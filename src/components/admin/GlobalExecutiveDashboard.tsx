import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  FileText,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Users,
} from 'lucide-react';
import { AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminPanel, AdminStatusBadge, AdminTablePagination } from './AdminModulePrimitives';
import { CustomSelect } from '../ui/CustomSelect';
import { Modal } from '../ui/Modal';
import { DonutChart, TrendChart } from '../charts/DashboardCharts';
import { ProfileIdentity } from './ProfileIdentity';
import { api } from '../../lib/apiClient';
import { hasAdminPermission } from '../../lib/adminAuth';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';

type RangeKey = '30D' | 'Q2' | 'YTD' | '12M';
type ProjectFilter = 'All' | 'Enterprise' | 'Retainer' | 'Fixed-fee';
const DASHBOARD_WORKSPACE_VIEWS = ['overview', 'performance', 'analytics'] as const;
type DashboardWorkspaceView = (typeof DASHBOARD_WORKSPACE_VIEWS)[number];

type DashboardRecentActivity = {
  id?: string;
  timestamp?: string;
  action?: string;
  actor?: string;
  severity?: string;
};

interface DashboardProject {
  id: string;
  name: string;
  client: string;
  type: Exclude<ProjectFilter, 'All'>;
  status: string;
  statusTone: 'success' | 'warning' | 'danger' | 'info';
  progress: number | null;
  lead: string;
  budget: string;
  startDate?: string;
  targetEndDate?: string;
  createdAt?: string;
}

const toneClasses = {
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  danger: 'border-danger/25 bg-danger/10 text-danger',
  info: 'border-info/25 bg-info/10 text-info',
} as const;

const progressClasses = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
} as const;

const formatLiveMoney = (value: number, currency: string) => {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'IDR', maximumFractionDigits: 0 }).format(value);
};


type DashboardOperationalSnapshot = {
  loading: boolean;
  projects: any[] | null;
  tasks: any[] | null;
  timeLogs: any[] | null;
  invoices: any[] | null;
  expenses: any[] | null;
};

const isFinishedWork = (value: unknown) => /^(done|complete|completed|closed|archived)$/i.test(String(value || '').trim());

const dateKey = (value: unknown) => {
  const text = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
};

const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

const buildProjectDeliveryBreakdown = (source: any[]) => {
  const active = source.filter((project) => !isFinishedWork(project.status) && !isFinishedWork(project.health));
  const today = localDateKey(new Date());
  const overdue = active.filter((project) => {
    const due = dateKey(project.targetEndDate || project.endDate || project.dueDate || project.deadline);
    return due && due < today;
  });
  const overdueIds = new Set(overdue.map((project) => String(project.id || project.slug || project.name)));
  const atRisk = active.filter((project) => {
    const key = String(project.id || project.slug || project.name);
    if (overdueIds.has(key)) return false;
    const state = String(project.health || project.status || '').toLowerCase();
    return /risk|delay|blocked|hold|issue/.test(state);
  });
  return [
    { label: 'No risk flag', value: Math.max(0, active.length - overdue.length - atRisk.length), tone: 'success' as const },
    { label: 'At risk', value: atRisk.length, tone: 'warning' as const },
    { label: 'Overdue', value: overdue.length, tone: 'danger' as const },
  ];
};

const buildFinancialTrend = (range: RangeKey, invoices: any[], expenses: any[]) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const specs: Array<{ label: string; start: string; end: string }> = [];
  const addMonth = (year: number, month: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);
    specs.push({
      label: startDate.toLocaleDateString('en-US', { month: 'short' }),
      start: localDateKey(startDate),
      end: localDateKey(endDate),
    });
  };
  if (range === 'Q2') {
    const year = currentMonth < 3 ? currentYear - 1 : currentYear;
    [3, 4, 5].forEach((month) => addMonth(year, month));
  } else if (range === 'YTD') {
    for (let month = 0; month <= currentMonth; month++) addMonth(currentYear, month);
  } else if (range === '12M') {
    for (let offset = 11; offset >= 0; offset--) {
      const date = new Date(currentYear, currentMonth - offset, 1);
      addMonth(date.getFullYear(), date.getMonth());
    }
  } else {
    const firstDate = new Date(now);
    firstDate.setDate(now.getDate() - 29);
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 1);
    for (let index = 0; index < 5; index++) {
      const startDate = new Date(firstDate);
      startDate.setDate(firstDate.getDate() + index * 7);
      if (startDate >= endDate) break;
      const bucketEnd = new Date(startDate);
      bucketEnd.setDate(startDate.getDate() + 7);
      const effectiveEnd = bucketEnd < endDate ? bucketEnd : endDate;
      specs.push({ label: 'W' + (index + 1), start: localDateKey(startDate), end: localDateKey(effectiveEnd) });
    }
  }
  return specs.map((spec) => {
    const invoiced = invoices.reduce((sum, invoice) => {
      const status = String(invoice.status || '').toLowerCase();
      const day = dateKey(invoice.issueDate || invoice.invoiceDate || invoice.createdAt);
      if (!day || day < spec.start || day >= spec.end || status === 'draft' || status === 'cancelled' || status === 'voided') return sum;
      return sum + (Number(invoice.total ?? invoice.amount ?? 0) || 0);
    }, 0);
    const recordedExpenses = expenses.reduce((sum, expense) => {
      const day = dateKey(expense.date || expense.expenseDate || expense.createdAt);
      if (!day || day < spec.start || day >= spec.end) return sum;
      return sum + (Number(expense.amount || 0) || 0);
    }, 0);
    return { label: spec.label, primary: invoiced, secondary: recordedExpenses, tertiary: invoiced - recordedExpenses };
  });
};

const DashboardUnavailable: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex min-h-[180px] flex-col items-center justify-center rounded-card border border-line bg-panel px-5 py-8 text-center" role="status">
    <AlertTriangle size={20} className="text-muted" aria-hidden="true" />
    <p className="mt-3 text-xs font-semibold text-fg">{title}</p>
    <p className="mt-1 max-w-md text-[11px] leading-5 text-muted">{description}</p>
  </div>
);


const DASHBOARD_TREND_RANGES: Array<{ value: RangeKey; label: string }> = [
  { value: '30D', label: '30 days' },
  { value: 'Q2', label: 'Q2 (Apr–Jun)' },
  { value: 'YTD', label: 'Year to date' },
  { value: '12M', label: '12 months' },
];

const DashboardTrendRangePicker: React.FC<{
  range: RangeKey;
  onChange: (range: RangeKey) => void;
}> = ({ range, onChange }) => (
  <div
    role="group"
    aria-label="Trend period"
    data-ams-slug="dashboard-trend-period"
    className="flex min-w-0 flex-wrap items-center gap-1.5"
  >
    {DASHBOARD_TREND_RANGES.map((option) => {
      const active = range === option.value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(option.value)}
          className={[
            'inline-flex min-h-10 min-[1100px]:min-h-9 items-center justify-center rounded-control border px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            active
              ? 'border-accent/20 bg-accent/10 text-fg'
              : 'border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg',
          ].join(' ')}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

const PerformanceView: React.FC<{ snapshot: DashboardOperationalSnapshot }> = ({ snapshot }) => {
  const tasks = snapshot.tasks || [];
  const projectRows = snapshot.projects || [];
  const activeProjects = projectRows.filter((project) => !isFinishedWork(project.status) && !isFinishedWork(project.health));
  const completedTasks = tasks.filter((task) => isFinishedWork(task.status)).length;
  const blockedTasks = tasks.filter((task) =>
    !isFinishedWork(task.status) && String(task.status || '').toLowerCase().includes('block')
  ).length;
  const today = localDateKey(new Date());
  const overdueTasks = tasks.filter((task) => {
    const due = dateKey(task.dueDate || task.deadline);
    return due && due < today && !isFinishedWork(task.status);
  }).length;
  const taskCount = snapshot.tasks !== null ? tasks.length : null;
  const completionValue = snapshot.tasks !== null && tasks.length ? Math.round(completedTasks / tasks.length * 100) + '%' : '—';
  const blockedValue = snapshot.tasks !== null ? String(blockedTasks) : '—';
  const overdueValue = snapshot.tasks !== null ? String(overdueTasks) : '—';
  const activeProjectValue = snapshot.projects !== null ? String(activeProjects.length) : '—';

  const current = new Date();
  const monday = new Date(current);
  const day = current.getDay();
  monday.setDate(current.getDate() + (day === 0 ? -6 : 1 - day));
  monday.setHours(0, 0, 0, 0);
  const mondayKey = localDateKey(monday);
  const memberTime = (snapshot.timeLogs || []).reduce((map: Map<string, number>, log: any) => {
    const date = dateKey(log.date || log.createdAt);
    if (!date || date < mondayKey || date > today) return map;
    const identity = String(log.user || log.userName || log.assignee || log.userId || 'Unassigned');
    map.set(identity, (map.get(identity) || 0) + (Number(log.durationMinutes ?? log.minutes ?? 0) || 0));
    return map;
  }, new Map<string, number>());
  const workload = Array.from(memberTime.entries()).map(([name, minutes]) => ({ name, minutes })).sort((a, b) => b.minutes - a.minutes).slice(0, 8);
  const projectAttentionSignals = (project: any) => {
    const state = [project.health, project.status].filter(Boolean).join(' ').toLowerCase();
    const due = dateKey(project.targetEndDate || project.endDate || project.dueDate || project.deadline);
    return {
      due,
      overdue: Boolean(due && due < today),
      flagged: /risk|delay|blocked|hold|issue/.test(state),
    };
  };
  const attentionProjects = activeProjects
    .filter((project) => {
      const signals = projectAttentionSignals(project);
      return signals.flagged || signals.overdue;
    })
    .sort((left, right) => {
      const leftSignals = projectAttentionSignals(left);
      const rightSignals = projectAttentionSignals(right);
      if (leftSignals.overdue !== rightSignals.overdue) return leftSignals.overdue ? -1 : 1;
      if (leftSignals.due && rightSignals.due && leftSignals.due !== rightSignals.due) {
        return leftSignals.due.localeCompare(rightSignals.due);
      }
      if (leftSignals.due) return -1;
      if (rightSignals.due) return 1;
      return String(left.name || left.title || '').localeCompare(String(right.name || right.title || ''));
    });
  const needsAttention = attentionProjects.slice(0, 8);
  const otherOpenTasks = Math.max(0, tasks.length - completedTasks - blockedTasks);
  const taskStatusBreakdown = [
    { id: 'completed', label: 'Completed', count: completedTasks, tone: 'bg-success' },
    { id: 'blocked', label: 'Blocked', count: blockedTasks, tone: 'bg-danger' },
    { id: 'other-open', label: 'Other open tasks', count: otherOpenTasks, tone: 'bg-info' },
  ];

  if (snapshot.loading) return <DashboardUnavailable title="Loading performance data" description="Project, task, and time records are being loaded from AMS." />;

  return (
    <div className="space-y-4" data-ams-feature-slug="dashboard-performance-workspace">
      <section className="grid gap-4 min-[1100px]:grid-cols-2" data-ams-feature-slug="dashboard-performance-primary">
        <AdminPanel
          title="Task completion"
          description="Task status distribution from the current task register. The status counts below account for all returned tasks."
          actions={(
            <Link to="/admin/tasks" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">
              Open Tasks <ArrowUpRight size={13} />
            </Link>
          )}
          bodyClassName="p-4 sm:p-5"
        >
          {snapshot.tasks === null ? <DashboardUnavailable title="Task status unavailable" description="The task service did not return data for the current role." /> : tasks.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted">No task records found for this workspace.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold tabular-nums text-fg">{completionValue}</p>
                  <p className="mt-1 text-xs text-muted">{completedTasks} of {tasks.length} tasks completed</p>
                </div>
                <AdminStatusBadge tone={completedTasks === tasks.length ? 'success' : 'info'}>
                  {completedTasks === tasks.length ? 'Complete' : 'In progress'}
                </AdminStatusBadge>
              </div>
              <div className="space-y-3" aria-label="Task status distribution">
                {taskStatusBreakdown.map((status) => {
                  const percentage = tasks.length ? Math.round(status.count / tasks.length * 100) : 0;
                  return (
                    <div key={status.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted">{status.label}</span>
                        <span className="shrink-0 font-medium tabular-nums text-fg">{status.count} <span className="font-normal text-muted">({percentage}%)</span></span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-line">
                        <div className={'h-full rounded-full ' + status.tone} style={{ width: percentage + '%' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </AdminPanel>

        <AdminPanel
          title="Projects needing attention"
          description="Active projects with an explicit risk flag or a target date before today."
          bodyClassName="p-0"
        >
          {snapshot.projects === null ? <div className="p-4"><DashboardUnavailable title="Project status unavailable" description="Project risk cannot be calculated because live project records were not returned." /></div> : needsAttention.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted">No project risk flags or overdue target dates were found.</p>
          ) : (
            <div className="divide-y divide-line">
              {needsAttention.map((project: any) => {
                const due = dateKey(project.targetEndDate || project.endDate || project.dueDate || project.deadline);
                const overdue = Boolean(due && due < today);
                return (
                  <div key={String(project.id || project.slug || project.name)} className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="break-words text-xs font-medium text-fg">{project.name || project.title || 'Untitled project'}</p>
                      <p className="mt-1 break-words text-[10px] text-muted">{project.clientName || project.client || 'Client not linked'} · {project.status || project.health || 'Status not set'}</p>
                      {due && <p className="mt-1 text-[10px] tabular-nums text-muted">Target {due}</p>}
                    </div>
                    <AdminStatusBadge tone={overdue ? 'danger' : 'warning'}>{overdue ? 'Overdue' : 'At risk'}</AdminStatusBadge>
                  </div>
                );
              })}
              {attentionProjects.length > needsAttention.length && <div className="px-4 py-3 text-[10px] text-muted">Showing 8 of {attentionProjects.length} projects with attention signals.</div>}
            </div>
          )}
        </AdminPanel>
      </section>

      <AdminPanel
        title="Tracked time this week"
        description={`Recorded time from ${mondayKey} through ${today}. Logged time is not a forecast of remaining capacity.`}
        bodyClassName="p-4 sm:p-5"
      >
        {snapshot.timeLogs === null ? <DashboardUnavailable title="Time records unavailable" description="The time tracking service did not return records for the current role." /> : workload.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">No time entries recorded during this week so far.</p>
        ) : (
          <div className="space-y-3">
            {workload.map((member) => (
              <div key={member.name} className="flex min-w-0 items-center justify-between gap-3">
                <span className="min-w-0 break-words text-xs font-medium text-fg">{member.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted">{Math.floor(member.minutes / 60)}h {member.minutes % 60}m</span>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>

      <section data-ams-feature-slug="dashboard-performance-supporting-metrics" aria-label="Performance summary metrics">
        <AdminMetricStrip slug="dashboard-performance-kpis" metrics={[
          { id: 'performance-projects', label: 'Active projects', value: activeProjectValue, icon: <FolderKanban size={15} />, context: snapshot.projects !== null ? 'Current project records' : 'Live source unavailable' },
          { id: 'performance-tasks', label: 'Tasks tracked', value: taskCount === null ? '—' : String(taskCount), icon: <CheckCircle2 size={15} />, context: snapshot.tasks !== null ? 'Current task records' : 'Live source unavailable' },
          { id: 'performance-overdue', label: 'Overdue tasks', value: overdueValue, icon: <CalendarDays size={15} />, toneClassName: 'text-warning', context: snapshot.tasks !== null ? 'Open tasks past due date' : 'Not available' },
          { id: 'performance-blocked', label: 'Blocked tasks', value: blockedValue, icon: <AlertTriangle size={15} />, toneClassName: 'text-danger', context: snapshot.tasks !== null ? 'Open tasks with a blocked status' : 'Not available' },
        ]} />
      </section>
    </div>
  );
};

const AnalyticsView: React.FC<{
  snapshot: DashboardOperationalSnapshot;
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
}> = ({ snapshot, range, onRangeChange }) => {
  const currency = 'IDR';
  const invoiceRows = snapshot.invoices || [];
  const expenseRows = snapshot.expenses || [];
  const trend = snapshot.invoices !== null && snapshot.expenses !== null
    ? buildFinancialTrend(range, invoiceRows.filter((row) => String(row.currency || 'IDR').toUpperCase() === currency), expenseRows.filter((row) => String(row.currency || 'IDR').toUpperCase() === currency))
    : [];
  const validInvoices = invoiceRows.filter((invoice) => String(invoice.currency || 'IDR').toUpperCase() === currency && !['draft', 'cancelled', 'voided'].includes(String(invoice.status || '').toLowerCase()));
  const validExpenses = expenseRows.filter((expense) => String(expense.currency || 'IDR').toUpperCase() === currency);
  const totalInvoiced = validInvoices.reduce((sum, invoice) => sum + (Number(invoice.total ?? invoice.amount ?? 0) || 0), 0);
  const recordedExpenses = validExpenses.reduce((sum, expense) => sum + (Number(expense.amount || 0) || 0), 0);
  const receivables = invoiceRows.filter((invoice) => String(invoice.currency || 'IDR').toUpperCase() === currency).reduce((sum, invoice) => {
    const status = String(invoice.status || '').toLowerCase();
    if (status === 'paid' || status === 'cancelled' || status === 'voided' || status === 'draft') return sum;
    const paid = Number(invoice.amountPaid ?? invoice.paidAmount ?? 0) || 0;
    const balance = Number(invoice.balanceDue ?? Math.max(0, Number(invoice.total || invoice.amount || 0) - paid));
    return sum + Math.max(0, Number.isFinite(balance) ? balance : 0);
  }, 0);
  const activeProjects = snapshot.projects?.filter((project) => !isFinishedWork(project.status) && !isFinishedWork(project.health)).length;

  if (snapshot.loading) return <DashboardUnavailable title="Loading analytics" description="Invoice, expense, and portfolio records are being loaded from AMS." />;
  const financialDataAvailable = snapshot.invoices !== null && snapshot.expenses !== null;
  return (
    <div className="space-y-4">


      <section className="grid gap-3 min-[1100px]:grid-cols-12" data-ams-feature-slug="dashboard-analytics-primary">
      <AdminPanel className="min-[1100px]:col-span-8" title="Invoice and expense trend" description="Invoice totals are grouped by issue date; expenses are grouped by recorded date. Their difference is not a posted profit figure." actions={<DashboardTrendRangePicker range={range} onChange={onRangeChange} />} bodyClassName="p-4 sm:p-5">
        {trend.length >= 2 ? (
          <TrendChart data={trend} primaryLabel="Invoices issued" secondaryLabel="Recorded expenses" tertiaryLabel="Difference" primaryFormat={(value) => formatLiveMoney(value, currency)} ariaLabel="Issued invoices and recorded expenses by period." />
        ) : (
          <DashboardUnavailable title="Financial trend unavailable" description="The selected sources did not return a usable period series. Values are not estimated." />
        )}
      </AdminPanel>

      <AdminPanel className="min-[1100px]:col-span-4" title="Project status" description="Current project status values from the project register." bodyClassName="p-4 sm:p-5">
        {snapshot.projects === null ? <DashboardUnavailable title="Project records unavailable" description="Project status analytics need access to the live project register." /> : (
          <div className="space-y-3">
            {(snapshot.projects || []).reduce((groups: Array<{ status: string; count: number }>, project: any) => {
              const status = String(project.status || project.health || 'Not set');
              const existing = groups.find((item) => item.status === status);
              if (existing) existing.count += 1; else groups.push({ status, count: 1 });
              return groups;
            }, []).sort((a, b) => b.count - a.count).map((group) => <div key={group.status} className="flex items-center justify-between gap-3 rounded-control border border-line bg-bg px-3 py-2.5"><span className="text-xs text-fg">{group.status}</span><span className="text-xs font-semibold tabular-nums text-fg">{group.count}</span></div>)}
          </div>
        )}
      </AdminPanel>
      </section>

      <section data-ams-feature-slug="dashboard-analytics-supporting-metrics" aria-label="Analytics summary metrics">
        <AdminMetricStrip slug="dashboard-analytics-kpis" metrics={[
        { id: 'analytics-invoiced', label: 'Invoices issued', value: financialDataAvailable ? formatLiveMoney(totalInvoiced, currency) : '—', icon: <FileText size={15} />, context: financialDataAvailable ? 'Issued invoices · IDR' : 'Live source unavailable' },
        { id: 'analytics-expenses', label: 'Recorded expenses', value: financialDataAvailable ? formatLiveMoney(recordedExpenses, currency) : '—', icon: <CircleDollarSign size={15} />, context: financialDataAvailable ? 'Expense records · IDR' : 'Live source unavailable' },
        { id: 'analytics-receivables', label: 'Outstanding receivables', value: snapshot.invoices !== null ? formatLiveMoney(receivables, currency) : '—', icon: <ReceiptText size={15} />, context: snapshot.invoices !== null ? 'Open, non-draft invoices · IDR' : 'Live source unavailable' },
        { id: 'analytics-projects', label: 'Active projects', value: snapshot.projects !== null ? String(activeProjects || 0) : '—', icon: <FolderKanban size={15} />, context: snapshot.projects !== null ? 'Current project records' : 'Live source unavailable' }
        ]} />
      </section>
    </div>
  );
};

export const GlobalExecutiveDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const canManageProjects = hasAdminPermission('canManageProjects');
  const canViewAuditLogs = hasAdminPermission('canViewSecurityAuditLogs');
  const requestedView = searchParams.get('view');
  const hasViewParameter = searchParams.has('view');
  const view: DashboardWorkspaceView = DASHBOARD_WORKSPACE_VIEWS.includes(requestedView as DashboardWorkspaceView)
    ? requestedView as DashboardWorkspaceView
    : 'overview';

  useEffect(() => {
    if (hasViewParameter && !DASHBOARD_WORKSPACE_VIEWS.includes(requestedView as DashboardWorkspaceView)) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [hasViewParameter, navigate, requestedView]);
  const { matchesInterval, value: reportPeriodValue, enabled: reportPeriodEnabled } = useReportingPeriod();
  const [range, setRange] = useState<RangeKey>('30D');
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('All');
  const [projectActionId, setProjectActionId] = useState<string | null>(null);
  const [projectActionPosition, setProjectActionPosition] = useState<{ top: number; left: number } | null>(null);
  const [projectDetails, setProjectDetails] = useState<DashboardProject | null>(null);
  const [dashboardProjectPage, setDashboardProjectPage] = useState(1);
  const [dashboardProjectPageSize, setDashboardProjectPageSize] = useState(6);
  const [dashboardOverview, setDashboardOverview] = useState<{ metrics?: any; financials?: any; projects?: any[]; recentActivity?: DashboardRecentActivity[]; recentActivityDataAvailable?: boolean; projectDataAvailable?: boolean; source: 'server' | 'ab'; loading: boolean }>({ source: 'ab', loading: true });
  const [operationalSnapshot, setOperationalSnapshot] = useState<DashboardOperationalSnapshot>({
    loading: true, projects: null, tasks: null, timeLogs: null, invoices: null, expenses: null
  });

  useEffect(() => {
    let active = true;
    api.dashboard.getOverview()
      .then((response) => {
        if (!active) return;
        if (!response.success) {
          setDashboardOverview({ source: 'ab', loading: false });
          return;
        }
        const projectDataAvailable = Array.isArray(response.data?.projects);
        const projects = projectDataAvailable ? response.data.projects : [];
        const recentActivityDataAvailable = Array.isArray(response.data?.recentActivity);
        setDashboardOverview({
          metrics: response.data?.metrics,
          financials: response.data?.financials,
          projects,
          recentActivity: recentActivityDataAvailable ? response.data.recentActivity as DashboardRecentActivity[] : [],
          recentActivityDataAvailable,
          projectDataAvailable,
          source: projectDataAvailable || Boolean(response.data?.metrics) ? 'server' : 'ab',
          loading: false
        });
      })
      .catch(() => {
        if (active) setDashboardOverview({ source: 'ab', loading: false });
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const readRows = (result: PromiseSettledResult<any>, field: string): any[] | null => {
      if (result.status !== 'fulfilled' || !result.value?.success || !Array.isArray(result.value.data?.[field])) return null;
      return result.value.data[field];
    };
    const requests: Array<Promise<any>> = [
      api.projects.getAll(),
      api.tasks.getAll(),
      api.timeLogs.getAll(),
      api.finance.getInvoices(),
      api.finance.getExpenses()
    ];
    Promise.allSettled(requests).then((results) => {
      if (!active) return;
      setOperationalSnapshot({
        loading: false,
        projects: readRows(results[0], 'projects'),
        tasks: readRows(results[1], 'tasks'),
        timeLogs: readRows(results[2], 'timeLogs'),
        invoices: readRows(results[3], 'invoices'),
        expenses: readRows(results[4], 'expenses')
      });
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!projectActionId) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-dashboard-project-actions]')) return;
      setProjectActionId(null);
      setProjectActionPosition(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProjectActionId(null);
        setProjectActionPosition(null);
      }
    };

    const handleScroll = () => {
      setProjectActionId(null);
      setProjectActionPosition(null);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [projectActionId]);


  const dashboardProjectDataAvailable = operationalSnapshot.projects !== null || dashboardOverview.projectDataAvailable === true;
  const dashboardProjects = useMemo<DashboardProject[]>(() => {
    const projectSource = operationalSnapshot.projects ?? (dashboardOverview.projectDataAvailable ? dashboardOverview.projects : undefined);
    const serverProjects = Array.isArray(projectSource)
      ? projectSource.map((project: any, index: number) => {
          const rawType = String(project.type || project.projectType || project.billingType || 'Fixed-fee').toLowerCase();
          const type: Exclude<ProjectFilter, 'All'> = rawType.includes('retainer')
            ? 'Retainer'
            : rawType.includes('enterprise')
              ? 'Enterprise'
              : 'Fixed-fee';
          const rawStatus = String(project.status || project.health || '').trim();
          const health = rawStatus.toLowerCase();
          const statusTone: DashboardProject['statusTone'] =
            /delay|blocked|overdue|hold|cancel|failed|issue/.test(health) ? 'danger'
              : /risk|watch|concern/.test(health) ? 'warning'
                : /review|pending|planning|draft|not started/.test(health) ? 'info'
                  : /active|progress|complete|done|closed|on track/.test(health) ? 'success'
                    : 'info';
          const rawProgress = project.progress ?? project.progressPercent;
          const parsedProgress = rawProgress === null || rawProgress === undefined || rawProgress === '' ? null : Number(rawProgress);
          const rawBudget = project.budget ?? project.totalBudget;
          const parsedBudget = rawBudget === null || rawBudget === undefined || rawBudget === '' ? null : Number(rawBudget);
          const dashboardCurrency = String(dashboardOverview.financials?.currency || dashboardOverview.metrics?.currency || 'IDR').toUpperCase();
          return {
            id: String(project.id || project.slug || 'server-project-' + index),
            name: String(project.name || project.title || project.projectName || 'Untitled project'),
            client: String(project.clientName || project.client || 'Unassigned client'),
            type,
            status: rawStatus || 'Status unavailable',
            statusTone,
            progress: parsedProgress !== null && Number.isFinite(parsedProgress) ? Math.max(0, Math.min(100, parsedProgress)) : null,
            lead: String(project.teamLead || project.ownerName || project.lead || 'Unassigned'),
            budget: parsedBudget !== null && Number.isFinite(parsedBudget) ? formatLiveMoney(parsedBudget, dashboardCurrency) : '—',
            startDate: String(project.startDate || project.start || ''),
            targetEndDate: String(project.targetEndDate || project.endDate || project.dueDate || ''),
            createdAt: String(project.createdAt || project.updatedAt || '')
          };
        })
      : [];
    return serverProjects;
  }, [dashboardOverview.financials?.currency, dashboardOverview.metrics?.currency, dashboardOverview.projectDataAvailable, dashboardOverview.projects, operationalSnapshot.projects]);

  const filteredProjects = useMemo(
    () => dashboardProjects.filter((project) =>
      matchesInterval(project.startDate, project.targetEndDate, project.createdAt)
      && (projectFilter === 'All' || project.type === projectFilter)
    ),
    [dashboardProjects, projectFilter, matchesInterval],
  );

  const dashboardProjectPageCount = Math.max(1, Math.ceil(filteredProjects.length / dashboardProjectPageSize));
  const pagedDashboardProjects = filteredProjects.slice(
    (dashboardProjectPage - 1) * dashboardProjectPageSize,
    dashboardProjectPage * dashboardProjectPageSize,
  );

  useEffect(() => {
    setDashboardProjectPage(1);
  }, [reportPeriodValue, reportPeriodEnabled]);
  useEffect(() => {
    setDashboardProjectPage((current) => Math.min(current, dashboardProjectPageCount));
  }, [dashboardProjectPageCount]);

  const deliveryProjects = operationalSnapshot.projects;
  const deliveryBreakdown = useMemo(
    () => deliveryProjects === null ? [] : buildProjectDeliveryBreakdown(deliveryProjects),
    [deliveryProjects]
  );
  const totalDelivery = deliveryBreakdown.reduce((total, item) => total + Math.max(0, item.value), 0);
  const onScheduleValue = deliveryBreakdown.find((item) => item.label === 'No risk flag')?.value ?? 0;
  const onSchedulePercent = totalDelivery > 0 ? Math.round((Math.max(0, onScheduleValue) / totalDelivery) * 100) : 0;
  const financeCurrency = String(dashboardOverview.financials?.currency || dashboardOverview.metrics?.currency || 'IDR').toUpperCase();
  const financeSourcesAvailable = operationalSnapshot.invoices !== null && operationalSnapshot.expenses !== null;
  const revenueData = useMemo(() => {
    if (!financeSourcesAvailable) return [];
    const invoices = (operationalSnapshot.invoices || []).filter((invoice: any) => String(invoice.currency || 'IDR').toUpperCase() === financeCurrency);
    const expenses = (operationalSnapshot.expenses || []).filter((expense: any) => String(expense.currency || 'IDR').toUpperCase() === financeCurrency);
    return buildFinancialTrend(range, invoices, expenses);
  }, [financeSourcesAvailable, operationalSnapshot.invoices, operationalSnapshot.expenses, financeCurrency, range]);

  const currentMonthKey = localDateKey(new Date()).slice(0, 7);
  const liveProjectRows = operationalSnapshot.projects || [];
  const activeProjectRows = liveProjectRows.filter((project: any) => !isFinishedWork(project.status) && !isFinishedWork(project.health));
  const activeProjectBudgets = activeProjectRows.map((project: any) => Number(project.budget ?? project.totalBudget ?? 0)).filter((value: number) => Number.isFinite(value) && value > 0);
  const averageActiveBudget = activeProjectBudgets.length
    ? activeProjectBudgets.reduce((sum: number, value: number) => sum + value, 0) / activeProjectBudgets.length
    : null;
  const liveOverdueTaskCount = operationalSnapshot.tasks === null ? null : operationalSnapshot.tasks.filter((task: any) => {
    const due = dateKey(task.dueDate || task.deadline);
    return due && due < localDateKey(new Date()) && !isFinishedWork(task.status);
  }).length;
  const liveRiskProjectCount = operationalSnapshot.projects === null ? null : buildProjectDeliveryBreakdown(operationalSnapshot.projects).filter((item) => item.label !== 'No risk flag').reduce((sum, item) => sum + item.value, 0);
  const liveCashCollected = operationalSnapshot.invoices === null ? null : operationalSnapshot.invoices.reduce((sum: number, invoice: any) => {
    if (String(invoice.currency || 'IDR').toUpperCase() !== financeCurrency) return sum;
    const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
    return sum + payments.filter((payment: any) => String(payment.date || '').slice(0, 7) === currentMonthKey).reduce((paymentSum: number, payment: any) => paymentSum + Math.max(0, Number(payment.amount) || 0), 0);
  }, 0);
  const liveOutstanding = operationalSnapshot.invoices === null ? null : operationalSnapshot.invoices.reduce((sum: number, invoice: any) => {
    if (String(invoice.currency || 'IDR').toUpperCase() !== financeCurrency || ['draft', 'cancelled', 'canceled', 'voided', 'deleted', 'paid'].includes(String(invoice.status || '').toLowerCase())) return sum;
    const balance = invoice.balanceDue != null
      ? Math.max(0, Number(invoice.balanceDue) || 0)
      : Math.max(0, (Number(invoice.total ?? invoice.amount ?? 0) || 0) - (Number(invoice.amountPaid ?? invoice.paidAmount ?? 0) || 0));
    return sum + balance;
  }, 0);
  const liveMonthlyExpenses = operationalSnapshot.expenses === null ? null : operationalSnapshot.expenses.reduce((sum: number, expense: any) => {
    if (String(expense.currency || 'IDR').toUpperCase() !== financeCurrency || String(expense.date || '').slice(0, 7) !== currentMonthKey || ['voided', 'cancelled', 'canceled', 'deleted'].includes(String(expense.status || '').toLowerCase())) return sum;
    return sum + Math.max(0, Number(expense.amount) || 0);
  }, 0);
  const liveCashDifference = liveCashCollected !== null && liveMonthlyExpenses !== null ? liveCashCollected - liveMonthlyExpenses : null;
  const activeProjectsMetric = dashboardOverview.metrics?.activeProjects ?? (operationalSnapshot.projects !== null ? activeProjectRows.length : null);
  const overdueTasksMetric = dashboardOverview.metrics?.overdueTasks ?? liveOverdueTaskCount;
  const projectsAtRiskMetric = dashboardOverview.metrics?.projectsAtRisk ?? liveRiskProjectCount;
  const cashCollectedMetric = dashboardOverview.financials?.cashCollected ?? dashboardOverview.financials?.revenueThisMonth ?? liveCashCollected;
  const outstandingMetric = dashboardOverview.financials?.outstandingReceivables ?? liveOutstanding;
  const cashDifferenceMetric = dashboardOverview.financials?.netOperatingProfit ?? liveCashDifference;

  return (
    <AdminPageShell featureSlug="dashboard-module" className="ams-dashboard">
      <AdminModuleHeader slug="dashboard-header"
        className="mb-0"
        eyebrow={view === 'overview' ? 'Overview' : view === 'performance' ? 'Performance' : 'Analytics'}
        title="Dashboard"
        description={view === 'overview'
          ? 'Monitor agency delivery, financial movement, team capacity, and operational exceptions.'
          : view === 'performance'
            ? 'Track project delivery, task completion, overdue work, and recorded team time.'
            : 'Review invoice and expense trends, outstanding receivables, and project status for the selected period.'}
        actions={(
          <>

            <Link
              to={canManageProjects ? '/admin/projects?create=1' : '/admin/projects'}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-medium sm:min-h-9 sm:w-auto text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Plus size={14} />
              {canManageProjects ? 'New project' : 'Open Projects'}
            </Link>
          </>
        )}
      />

      

      {view === 'overview' ? (
        <>
      <section data-ams-feature-slug="dashboard-priority-exceptions" aria-label="Priority exceptions">
        <AdminPanel title="Priority exceptions" description="Overdue work and project risk signals reported by current AMS sources." bodyClassName="p-0">
          {overdueTasksMetric !== null && Number(overdueTasksMetric) === 0 && projectsAtRiskMetric !== null && Number(projectsAtRiskMetric) === 0 ? (
            <div className="px-4 py-5" role="status">
              <p className="text-xs font-medium text-fg">No overdue tasks or project risk flags reported</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">The current sources report no priority delivery exceptions.</p>
            </div>
          ) : overdueTasksMetric === null && projectsAtRiskMetric === null ? (
            <div className="px-4 py-5" role="status">
              <p className="text-xs font-medium text-fg">{dashboardOverview.loading || operationalSnapshot.loading ? 'Loading priority exception data' : 'Priority exception data unavailable'}</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">Live task and project summary counts were not returned. The dashboard does not assume zero exceptions.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {overdueTasksMetric === null ? (
                <div className="px-4 py-3" role="status">
                  <p className="text-xs font-medium text-fg">Overdue task count unavailable</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">The task source did not return a usable count.</p>
                </div>
              ) : Number(overdueTasksMetric) > 0 ? (
                <div className="flex min-w-0 flex-col gap-2 px-4 py-3 min-[900px]:flex-row min-[900px]:items-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-danger/25 bg-danger/10 text-danger"><CalendarDays size={15} aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-fg">Overdue tasks</p>
                    <p className="mt-1 text-[11px] leading-5 text-muted">Open tasks past their recorded due date. The destination includes the wider due-work queue.</p>
                  </div>
                  <span className="text-lg font-semibold tabular-nums text-danger">{overdueTasksMetric}</span>
                  <Link to="/admin/tasks?taskscope=due" className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">Open due-work queue <ArrowUpRight size={13} aria-hidden="true" /></Link>
                </div>
              ) : null}
              {projectsAtRiskMetric === null ? (
                <div className="px-4 py-3" role="status">
                  <p className="text-xs font-medium text-fg">Project risk count unavailable</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">The project source did not return a usable risk count.</p>
                </div>
              ) : Number(projectsAtRiskMetric) > 0 ? (
                <div className="flex min-w-0 flex-col gap-2 px-4 py-3 min-[900px]:flex-row min-[900px]:items-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-warning/25 bg-warning/10 text-warning"><AlertTriangle size={15} aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-fg">Projects at risk</p>
                    <p className="mt-1 text-[11px] leading-5 text-muted">Projects with overdue delivery or a recorded risk state.</p>
                  </div>
                  <span className="text-lg font-semibold tabular-nums text-warning">{projectsAtRiskMetric}</span>
                  <Link to="/admin/projects?projects=active" className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">Review active projects <ArrowUpRight size={13} aria-hidden="true" /></Link>
                </div>
              ) : null}
            </div>
          )}
        </AdminPanel>
      </section>

      <section
        data-ams-feature-slug="dashboard-overview"
        data-ams-slug="dashboard-overview"
        className="space-y-3"
        aria-label="Executive overview metrics"
      >
        <AdminMetricStrip
          slug="dashboard-overview-kpis"
          className="grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1100px]:grid-cols-4"
          metrics={[
            {
              id: 'active-projects', label: 'Active projects',
              value: activeProjectsMetric != null ? String(activeProjectsMetric) : '—',
              context: dashboardOverview.metrics?.activeProjects != null || operationalSnapshot.projects !== null ? 'Live project records' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live data unavailable',
              icon: <FolderKanban size={15} />, toneClassName: 'text-success', slug: 'dashboard-active-projects'
            },
            {
              id: 'revenue', label: 'Cash collected this month',
              value: cashCollectedMetric != null ? formatLiveMoney(Number(cashCollectedMetric), financeCurrency) : '—',
              context: dashboardOverview.financials?.cashCollected != null || dashboardOverview.financials?.revenueThisMonth != null || liveCashCollected !== null ? 'Recorded invoice payments' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live data unavailable',
              icon: <CircleDollarSign size={15} />, toneClassName: 'text-success', slug: 'dashboard-revenue'
            },
            {
              id: 'outstanding', label: 'Outstanding invoices',
              value: outstandingMetric != null ? formatLiveMoney(Number(outstandingMetric), financeCurrency) : '—',
              context: dashboardOverview.financials?.outstandingReceivables != null || liveOutstanding !== null ? 'Open invoice balances' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live data unavailable',
              icon: <ReceiptText size={15} />, toneClassName: 'text-warning', slug: 'dashboard-outstanding'
            },
            {
              id: 'utilization', label: 'Team utilization',
              value: dashboardOverview.metrics?.teamUtilization != null ? String(dashboardOverview.metrics.teamUtilization) + '%' : '—',
              context: dashboardOverview.metrics?.teamUtilization != null ? 'Live data' : dashboardOverview.loading ? 'Loading live data' : 'Live data unavailable',
              icon: <Users size={15} />, toneClassName: 'text-warning', slug: 'dashboard-utilization'
            }
          ]}
        />
      </section>

      <section
        className="space-y-2"
        data-ams-feature-slug="dashboard-quick-actions"
        data-ams-slug="dashboard-quick-actions"
        aria-label="Quick actions"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-fg">Quick actions</h2>
          <p className="text-[11px] text-muted">Common workspaces</p>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1100px]:grid-cols-5">
          {[
            { label: 'Review tasks', icon: <CheckCircle2 size={14} />, href: '/admin/tasks' },
            { label: 'Log time', icon: <Clock3 size={14} />, href: '/admin/time-logs' },
            { label: 'View invoices', icon: <ReceiptText size={14} />, href: '/admin/invoicing' },
            { label: 'View clients', icon: <Users size={14} />, href: '/admin/clients' },
            { label: 'View documents', icon: <FileText size={14} />, href: '/admin/documents' }
          ].map((action) => (
            <Link
              key={action.label}
              to={action.href}
              className="flex min-h-10 min-w-0 items-center gap-2 rounded-control border border-line bg-bg px-3 text-xs font-medium text-fg transition-colors hover:border-accent/30 hover:bg-panel-hover hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="shrink-0 text-muted">{action.icon}</span>
              <span className="min-w-0 truncate">{action.label}</span>
              <ArrowUpRight size={12} className="ml-auto shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-3 min-[1100px]:grid-cols-12">
        <AdminPanel className="min-[1100px]:col-span-8" bodyClassName="p-4 sm:p-5" title="Invoices vs expenses" description="Issued invoice value and recorded expenses by record date. The difference is not a posted profit figure." actions={<DashboardTrendRangePicker range={range} onChange={setRange} />}>
          {revenueData.length >= 2 ? (
            <TrendChart data={revenueData} primaryLabel="Invoices issued" secondaryLabel="Expenses recorded" tertiaryLabel="Difference" primaryFormat={(value) => formatLiveMoney(value, financeCurrency)} ariaLabel={'Issued invoices, recorded expenses, and difference for ' + range + '.'} />
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-control border border-line bg-bg px-5 py-8 text-center" role="status">
              <CircleDollarSign size={20} className="text-muted" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold text-fg">Revenue history is unavailable</p>
              <p className="mt-1 max-w-sm text-[11px] leading-5 text-muted">The dashboard service has not provided a live historical revenue series for this period.</p>
            </div>
          )}
        </AdminPanel>

        <AdminPanel className="min-[1100px]:col-span-4" bodyClassName="p-4 sm:p-5" title="Delivery & pacing" description="Project delivery distribution across the current portfolio.">
          {deliveryProjects !== null ? totalDelivery === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center px-4 py-8 text-center" role="status">
              <FolderKanban size={20} className="text-muted" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold text-fg">No active projects to assess</p>
              <p className="mt-1 max-w-sm text-[11px] leading-5 text-muted">The live project source returned no active projects for delivery-risk assessment.</p>
              <Link to="/admin/projects" className="mt-3 inline-flex min-h-8 items-center rounded-control border border-line bg-panel px-3 text-[11px] font-medium text-fg hover:bg-panel-hover">Open Projects</Link>
            </div>
          ) : (
          <div className="space-y-4">
            <div className="rounded-control border border-line bg-bg/45 p-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted">No risk flag</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-[-0.03em] tabular-nums text-fg">{onSchedulePercent}%</span>
                    <span className="text-[11px] text-muted">{onScheduleValue} of {totalDelivery} projects</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-badge border border-success/20 bg-success/10 px-2 py-1 text-[10px] font-medium text-success">Unflagged</span>
              </div>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-line" aria-label="Delivery pacing breakdown">
                {deliveryBreakdown.map((item) => {
                  const percent = totalDelivery > 0 ? (Math.max(0, item.value) / totalDelivery) * 100 : 0;
                  return (
                    <div
                      key={item.label}
                      className={['h-full first:rounded-l-full last:rounded-r-full', progressClasses[item.tone]].join(' ')}
                      style={{ width: percent + '%' }}
                      title={item.label + ': ' + Math.round(percent) + '%'}
                    />
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {deliveryBreakdown.map((item) => {
                const safeValue = Math.max(0, item.value);
                const percent = totalDelivery > 0 ? Math.round((safeValue / totalDelivery) * 100) : 0;
                return (
                  <div key={item.label} className="min-w-0 rounded-control border border-line bg-bg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <i className={['h-2 w-2 shrink-0 rounded-full', progressClasses[item.tone]].join(' ')} />
                        <span className="whitespace-nowrap text-[10px] font-medium text-muted">{item.label}</span>
                      </div>
                      <span className={['shrink-0 rounded-badge border px-1.5 py-0.5 text-[10px] font-medium', toneClasses[item.tone]].join(' ')}>
                        {item.tone === 'success' ? 'Healthy' : item.tone === 'warning' ? 'Monitor' : 'Action'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <div>
                        <div className="text-lg font-semibold tabular-nums text-fg">{safeValue}</div>
                        <div className="mt-0.5 text-[10px] text-muted">{safeValue === 1 ? 'project' : 'projects'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold tabular-nums text-fg">{percent}%</div>
                        <div className="mt-0.5 text-[10px] text-muted">of portfolio</div>
                      </div>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
                      <div className={['h-full rounded-full', progressClasses[item.tone]].join(' ')} style={{ width: percent + '%' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          ) : (
            <div className="flex min-h-[180px] flex-col items-center justify-center px-4 py-8 text-center" role="status">
              <AlertTriangle size={20} className="text-muted" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold text-fg">Delivery distribution is unavailable</p>
              <p className="mt-1 max-w-sm text-[11px] leading-5 text-muted">Live project pacing metrics are not connected to the dashboard service yet.</p>
            </div>
          )}
        </AdminPanel>
      </div>

      <div className="mt-3 grid gap-3 min-[1100px]:grid-cols-12">
        <AdminPanel className="min-[1100px]:col-span-8" bodyClassName="p-0" title="Active projects" description="Current delivery status across the agency portfolio." actions={(
          <Link to="/admin/projects" className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-accent-text">View all <ArrowUpRight size={13} /></Link>
        )}>
          <div className="border-b border-line px-4 pt-3 sm:px-5">
            <div className="flex gap-1.5 overflow-x-auto pb-3 custom-scrollbar">
              {(['All', 'Enterprise', 'Retainer', 'Fixed-fee'] as ProjectFilter[]).map((filter) => (
                <button key={filter} type="button" aria-pressed={projectFilter === filter} onClick={() => { setProjectFilter(filter); setDashboardProjectPage(1); }} className={['shrink-0 rounded-chip border px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', projectFilter === filter ? 'border-line bg-panel-hover font-medium text-fg' : 'border-transparent bg-transparent text-muted hover:border-line hover:bg-bg hover:text-fg'].join(' ')}>{filter}</button>
              ))}
            </div>
          </div>
          {filteredProjects.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center px-5 py-10 text-center" role="status">
              <FolderKanban size={22} className="text-muted" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-fg">
                {dashboardOverview.loading || operationalSnapshot.loading
                  ? 'Loading live projects…'
                  : dashboardProjectDataAvailable
                    ? 'No projects recorded'
                    : 'Live project data unavailable'}
              </p>
              <p className="mt-1 max-w-md text-xs leading-5 text-muted">
                {dashboardOverview.loading || operationalSnapshot.loading
                  ? 'Waiting for the live dashboard and project services to return their records.'
                  : dashboardProjectDataAvailable
                    ? 'The live project source returned no projects matching this reporting period and type. Adjust the view or open Projects.'
                    : 'The dashboard and project services did not return project records. Open Projects to retry from the canonical workspace.'}
              </p>
              <Link to="/admin/projects" className="mt-4 inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">Open Projects</Link>
            </div>
          ) : (
            <>
          <div className="min-[900px]:hidden divide-y divide-line">
            {filteredProjects.map((project) => (
              <article key={project.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-semibold text-fg">{project.name}</h3>
                    <p className="mt-1 truncate text-[11px] text-muted">{project.client}</p>
                  </div>
                  <span className={['shrink-0 rounded-badge border px-2 py-1 text-[10px] font-medium', toneClasses[project.statusTone]].join(' ')}>
                    {project.status}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3 text-[10px] text-muted">
                    <span>{project.type}</span>
                    <span className="tabular-nums">{project.progress == null ? '—' : project.progress + '%'}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className={['h-full rounded-full', progressClasses[project.statusTone]].join(' ')}
                      style={{ width: (project.progress ?? 0) + '%' }}
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-control border border-line bg-bg p-2.5">
                    <div className="text-[10px] text-muted">Lead</div>
                    <div className="mt-1 truncate text-[11px] font-medium text-fg">{project.lead}</div>
                  </div>
                  <div className="rounded-control border border-line bg-bg p-2.5">
                    <div className="text-[10px] text-muted">Budget</div>
                    <div className="mt-1 truncate text-[11px] font-medium text-fg">{project.budget}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProjectDetails(project)}
                  className="mt-3 flex min-h-9 w-full items-center justify-center rounded-control border border-line bg-bg px-3 text-xs font-medium text-fg transition-colors hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  View project
                </button>
              </article>
            ))}
          </div>

          <div className="hidden min-[900px]:block overflow-x-auto custom-scrollbar" tabIndex={0} role="region" aria-label="Scrollable active project register" data-ams-slug="dashboard-projects-scroll">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead><tr>
                <th className="px-4 py-3 text-xs font-medium text-muted sm:px-5">Project / client</th>
                <th className="px-3 py-3 text-xs font-medium text-muted">Status</th>
                <th className="px-3 py-3 text-xs font-medium text-muted">Pacing</th>
                <th className="px-3 py-3 text-xs font-medium text-muted">Lead</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted">Budget</th>
                <th className="w-10 px-2 py-3" />
              </tr></thead>
              <tbody>
                {pagedDashboardProjects.map((project) => (
                  <tr key={project.id} className="border-t border-line transition-colors hover:bg-panel-hover">
                    <td className="px-4 py-3 sm:px-5"><div className="font-medium text-xs text-fg">{project.name}</div><div className="mt-0.5 text-[11px] text-muted">{project.client}</div></td>
                    <td className="px-3 py-3"><span className={['inline-flex items-center rounded-badge border px-2 py-1 text-[11px] font-medium', toneClasses[project.statusTone]].join(' ')}>{project.status}</span></td>
                    <td className="px-3 py-3"><div className="flex min-w-[150px] items-center gap-2"><div className="h-1.5 min-w-20 flex-1 overflow-hidden rounded-sm bg-line"><div className={['h-full rounded-sm', progressClasses[project.statusTone === 'danger' ? 'danger' : project.statusTone === 'warning' ? 'warning' : 'success']].join(' ')} style={{ width: (project.progress ?? 0) + '%' }} /></div><span className="w-8 text-right text-[11px] tabular-nums text-muted">{project.progress == null ? '—' : project.progress + '%'}</span></div></td>
                    <td className="px-3 py-3"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-bg text-[10px] font-semibold text-fg">{project.lead.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span className="text-xs text-muted">{project.lead}</span></div></td>
                    <td className="px-4 py-3 text-right text-xs font-medium tabular-nums text-fg">{project.budget}</td>
                    <td className="relative px-2 py-3 text-right" data-dashboard-project-actions>
                      <button
                        type="button"
                        aria-label={'More actions for ' + project.name}
                        aria-haspopup="menu"
                        aria-expanded={projectActionId === project.id}
                        onClick={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect();
                          setProjectActionPosition({
                            top: Math.min(window.innerHeight - 104, rect.bottom + 4),
                            left: Math.max(8, Math.min(window.innerWidth - 200, rect.right - 192)),
                          });
                          setProjectActionId(current => current === project.id ? null : project.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {projectActionId === project.id && (
                        <div
                          role="menu"
                          aria-label={'Actions for ' + project.name}
                          className="fixed z-[70] w-48 overflow-hidden rounded-card border border-line bg-panel p-1 text-left shadow-none"
                          style={{ top: projectActionPosition?.top, left: projectActionPosition?.left }}
                          data-dashboard-project-actions
                        >
                          <button
                            type="button"
                            role="menuitem"
                            className="flex min-h-9 w-full items-center rounded-control px-3 text-xs text-muted hover:bg-bg hover:text-fg"
                            onClick={() => {
                              setProjectDetails(project);
                              setProjectActionId(null);
                              setProjectActionPosition(null);
                            }}
                          >
                            View project details
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="flex min-h-9 w-full items-center rounded-control px-3 text-xs text-muted hover:bg-bg hover:text-fg"
                            onClick={() => {
                              navigate('/admin/projects');
                              setProjectActionId(null);
                              setProjectActionPosition(null);
                            }}
                          >
                            Open project workspace
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

            </>
          )}
          {filteredProjects.length > 0 && <AdminTablePagination
            total={filteredProjects.length}
            page={dashboardProjectPage}
            pageSize={dashboardProjectPageSize}
            onPageChange={setDashboardProjectPage}
            onPageSizeChange={setDashboardProjectPageSize}
            itemLabel="projects"
            slug="dashboard-projects-pagination"
          />}
        </AdminPanel>

        <AdminPanel
          className="min-[1100px]:col-span-4"
          bodyClassName="p-4 sm:p-5"
          title="Team capacity"
          description="Current workload distribution from persisted team and time records."
        >
          <div className="flex min-h-[180px] flex-col items-center justify-center px-3 py-8 text-center" role="status">
            <Users size={20} className="text-muted" aria-hidden="true" />
            <p className="mt-3 text-xs font-semibold text-fg">Team workload data is unavailable</p>
            <p className="mt-1 max-w-sm text-[11px] leading-5 text-muted">Live assignments and utilization are not available from the dashboard service yet.</p>
            <Link to="/admin/time-logs" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-accent-text">Open Time Logs <ArrowUpRight size={13} /></Link>
          </div>
        </AdminPanel>
      </div>

        <div className="mt-3 min-w-0" data-ams-feature-slug="dashboard-supporting-metrics">
          <AdminMetricStrip slug="dashboard-supporting-kpis" metrics={[
            {
              id: 'avg-project-value', label: 'Avg. active project budget',
              value: averageActiveBudget != null ? formatLiveMoney(averageActiveBudget, financeCurrency) : '—',
              context: averageActiveBudget != null ? 'Average of active project budgets' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live project budgets unavailable',
              icon: <FolderKanban size={15} />, toneClassName: 'text-fg', slug: 'dashboard-avg-project-value'
            },
            {
              id: 'net-operating-profit', label: 'Cash surplus / deficit',
              value: cashDifferenceMetric != null ? formatLiveMoney(Number(cashDifferenceMetric), financeCurrency) : '—',
              context: dashboardOverview.financials?.netOperatingProfit != null || liveCashDifference !== null ? 'Cash collected less recorded expenses; not posted profit' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live financial data unavailable',
              icon: <CircleDollarSign size={15} />,
              toneClassName: dashboardOverview.financials?.netOperatingProfit != null
                ? Number(dashboardOverview.financials.netOperatingProfit) >= 0 ? 'text-success' : 'text-danger'
                : 'text-fg',
              slug: 'dashboard-net-operating-profit'
            }
          ]} />
        </div>



        {canViewAuditLogs && (
          <section data-ams-feature-slug="dashboard-recent-activity" data-ams-slug="dashboard-recent-activity" aria-label="Recent activity">
            <AdminPanel
              title="Recent activity"
              description="Latest server-recorded audit events available to your role."
              bodyClassName="p-0"
              actions={(
                <Link to="/admin/settings?tab=audit" className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-accent-text">
                  View audit log <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              )}
            >
              {!dashboardOverview.recentActivityDataAvailable ? (
                <div className="flex min-h-[130px] flex-col items-center justify-center px-5 py-8 text-center" role="status">
                  <Clock3 size={19} className="text-muted" aria-hidden="true" />
                  <p className="mt-3 text-xs font-semibold text-fg">{dashboardOverview.loading ? 'Loading recent activity' : 'Recent activity unavailable'}</p>
                  <p className="mt-1 max-w-md text-[11px] leading-5 text-muted">
                    {dashboardOverview.loading
                      ? 'Waiting for the dashboard service to return recent audit events.'
                      : 'The dashboard service did not return a usable recent-activity list.'}
                  </p>
                </div>
              ) : (dashboardOverview.recentActivity || []).length === 0 ? (
                <div className="flex min-h-[130px] flex-col items-center justify-center px-5 py-8 text-center" role="status">
                  <Clock3 size={19} className="text-muted" aria-hidden="true" />
                  <p className="mt-3 text-xs font-semibold text-fg">No recent activity available</p>
                  <p className="mt-1 max-w-md text-[11px] leading-5 text-muted">The activity source returned no audit events for this account.</p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {dashboardOverview.recentActivity.slice(0, 5).map((activity, index) => {
                    const severity = String(activity.severity || 'info').toLowerCase();
                    const severityClasses = severity === 'critical'
                      ? 'border-danger/20 bg-danger/10 text-danger'
                      : severity === 'warning'
                        ? 'border-warning/20 bg-warning/10 text-warning'
                        : 'border-line bg-bg text-muted';
                    const severityLabel = severity === 'critical' ? 'Critical' : severity === 'warning' ? 'Warning' : 'Info';
                    const timestamp = activity.timestamp ? new Date(activity.timestamp) : null;
                    const timestampLabel = timestamp && !Number.isNaN(timestamp.getTime())
                      ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(timestamp) + ' UTC'
                      : 'Time not recorded';
                    return (
                      <article key={String(activity.id || activity.timestamp || index)} className="flex min-w-0 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted">
                            <Clock3 size={14} aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="break-words text-xs font-medium text-fg">{activity.action || 'Recorded audit event'}</p>
                            <p className="mt-1 break-words text-[11px] leading-5 text-muted">
                              {activity.actor ? 'By ' + activity.actor : 'By system'} · {timestampLabel}
                            </p>
                          </div>
                        </div>
                        <span className={'ml-11 inline-flex w-fit shrink-0 items-center rounded-badge border px-2 py-1 text-[10px] font-medium sm:ml-0 ' + severityClasses}>
                          {severityLabel}
                        </span>
                      </article>
                    );
                  })}
                </div>
              )}
            </AdminPanel>
          </section>
        )}

        </>
      ) : view === 'performance' ? (
        <PerformanceView snapshot={operationalSnapshot} />
      ) : (
        <AnalyticsView snapshot={operationalSnapshot} range={range} onRangeChange={setRange} />
      )}
      <Modal
        open={Boolean(projectDetails)}
        onClose={() => setProjectDetails(null)}
        size="md"
        title={projectDetails?.name || 'Project details'}
        description={projectDetails ? projectDetails.client : undefined}
        footer={(
          <>
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => setProjectDetails(null)}
            >
              Close
            </button>
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-medium text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => {
                setProjectDetails(null);
                navigate('/admin/projects');
              }}
            >
              Open workspace
            </button>
          </>
        )}
      >
        {projectDetails && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-xs font-medium text-muted">Status</div>
                <div className="mt-1 text-sm font-semibold text-fg">{projectDetails.status}</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-xs font-medium text-muted">Progress</div>
                <div className="mt-1 text-sm font-semibold text-fg">{projectDetails.progress == null ? '—' : projectDetails.progress + '%'}</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-xs font-medium text-muted">Project lead</div>
                <div className="mt-1 text-sm font-semibold text-fg">{projectDetails.lead}</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-xs font-medium text-muted">Budget</div>
                <div className="mt-1 text-sm font-semibold text-fg">{projectDetails.budget}</div>
              </div>
            </div>
            <div className="rounded-control border border-line bg-bg p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Delivery pacing</span>
                <span className="text-xs font-semibold text-fg">{projectDetails.progress == null ? 'Progress unavailable' : projectDetails.progress + '% complete'}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-sm bg-line">
                <div
                  className={['h-full rounded-sm', progressClasses[projectDetails.statusTone]].join(' ')}
                  style={{ width: (projectDetails.progress ?? 0) + '%' }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AdminPageShell>
  );
};

export default GlobalExecutiveDashboard;