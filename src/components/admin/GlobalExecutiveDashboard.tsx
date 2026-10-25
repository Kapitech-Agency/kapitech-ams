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
  RefreshCw,
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
import { getAdminSession, hasAdminPermission } from '../../lib/adminAuth';
import { canAccessAmsRoute, getAmsRole } from '../../lib/amsNavigationAccess';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';
import { getReportingPeriodRange, type ReportingPeriodMode } from '../../lib/reportingPeriods';
import { getInvoiceDate, getInvoiceOutstanding, getPaymentRows, isIssuedInvoice } from '../../lib/financeWorkbook';

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

type DashboardAttentionItem = {
  id?: string;
  title?: string;
  description?: string;
  severity?: string;
  category?: string;
  linkUrl?: string;
};

interface DashboardProject {
  id: string;
  name: string;
  client: string;
  type: Exclude<ProjectFilter, 'All'>;
  status: string;
  health?: string;
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

type FinancialTrendSpec = { label: string; start: string; end: string };

const isDashboardExpenseEligible = (expense: any) => {
  const status = String(expense.status || '').toLowerCase();
  return !['voided', 'cancelled', 'canceled', 'deleted'].includes(status);
};

const aggregateFinancialTrend = (specs: FinancialTrendSpec[], invoices: any[], expenses: any[]) =>
  specs.map((spec) => {
    const invoiced = invoices.reduce((sum, invoice) => {
      const day = dateKey(getInvoiceDate(invoice));
      if (!day || day < spec.start || day >= spec.end || !isIssuedInvoice(invoice)) return sum;
      return sum + (Number(invoice.total ?? invoice.amount ?? 0) || 0);
    }, 0);
    const recordedExpenses = expenses.reduce((sum, expense) => {
      const day = dateKey(expense.date || expense.expenseDate || expense.createdAt);
      const status = String(expense.status || '').toLowerCase();
      if (!day || day < spec.start || day >= spec.end || !isDashboardExpenseEligible(expense)) return sum;
      return sum + (Number(expense.amount || 0) || 0);
    }, 0);
    return { label: spec.label, startDate: spec.start, endDate: spec.end, primary: invoiced, secondary: recordedExpenses, tertiary: invoiced - recordedExpenses };
  });

const buildRecentFinancialTrend = (invoices: any[], expenses: any[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDate = new Date(today);
  firstDate.setDate(today.getDate() - 29);
  const endExclusive = new Date(today);
  endExclusive.setDate(today.getDate() + 1);
  const specs: FinancialTrendSpec[] = [];
  let cursor = firstDate;
  let index = 1;
  while (cursor < endExclusive) {
    const next = new Date(cursor);
    next.setDate(next.getDate() + 7);
    const effectiveEnd = next < endExclusive ? next : endExclusive;
    specs.push({ label: 'W' + index, start: localDateKey(cursor), end: localDateKey(effectiveEnd) });
    cursor = effectiveEnd;
    index += 1;
  }
  return aggregateFinancialTrend(specs, invoices, expenses);
};

const buildFinancialTrendForReportingPeriod = (mode: ReportingPeriodMode, value: string, invoices: any[], expenses: any[]) => {
  const period = getReportingPeriodRange(value, mode);
  if (!period) return buildRecentFinancialTrend(invoices, expenses);
  const start = new Date(period.startDate + 'T00:00:00');
  const endExclusive = new Date(period.endDate + 'T00:00:00');
  endExclusive.setDate(endExclusive.getDate() + 1);
  const specs: FinancialTrendSpec[] = [];
  if (mode === 'month') {
    let cursor = start;
    let index = 1;
    while (cursor < endExclusive) {
      const next = new Date(cursor);
      next.setDate(next.getDate() + 7);
      const effectiveEnd = next < endExclusive ? next : endExclusive;
      specs.push({ label: 'W' + index, start: localDateKey(cursor), end: localDateKey(effectiveEnd) });
      cursor = effectiveEnd;
      index += 1;
    }
  } else {
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor < endExclusive) {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const effectiveEnd = next < endExclusive ? next : endExclusive;
      specs.push({ label: cursor.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), start: localDateKey(cursor), end: localDateKey(effectiveEnd) });
      cursor = next;
    }
  }
  return aggregateFinancialTrend(specs, invoices, expenses);
};

const formatFinancialTrendDate = (value: string) => {
  const date = new Date(value + 'T00:00:00');
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : value;
};

const describeFinancialTrendScope = (trend: Array<{ startDate: string; endDate: string }>, reportPeriodEnabled: boolean, reportPeriodLabel: string) => {
  if (reportPeriodEnabled) return reportPeriodLabel;
  if (!trend.length) return 'Recent 30-day default window';
  const lastEnd = new Date(trend[trend.length - 1].endDate + 'T00:00:00');
  lastEnd.setDate(lastEnd.getDate() - 1);
  return 'Recent 30-day default window (' + formatFinancialTrendDate(trend[0].startDate) + ' – ' + formatFinancialTrendDate(localDateKey(lastEnd)) + ')';
};

const DashboardUnavailable: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex min-h-[180px] flex-col items-center justify-center rounded-card border border-line bg-panel px-5 py-8 text-center" role="status">
    <AlertTriangle size={20} className="text-muted" aria-hidden="true" />
    <p className="mt-3 text-xs font-semibold text-fg">{title}</p>
    <p className="mt-1 max-w-md text-[11px] leading-5 text-muted">{description}</p>
  </div>
);


const PerformanceView: React.FC<{
  snapshot: DashboardOperationalSnapshot;
  matchesDate: (value: unknown) => boolean;
  matchesInterval: (startValue: unknown, endValue?: unknown, fallbackValue?: unknown) => boolean;
  reportPeriodLabel: string;
  reportPeriodEnabled: boolean;
}> = ({ snapshot, matchesDate, matchesInterval, reportPeriodLabel, reportPeriodEnabled }) => {
  const allTasks = snapshot.tasks || [];
  const allProjects = snapshot.projects || [];
  const allTimeLogs = snapshot.timeLogs || [];

  // Shared reporting period scopes operational records by their meaningful dates.
  // Missing usable dates remain visible through the shared context's fallback behavior.
  const tasks = allTasks.filter((task: any) => {
    const dueDate = task.dueDate || task.deadline;
    return matchesInterval(dueDate, dueDate, task.createdAt);
  });
  const scopedProjects = allProjects.filter((project: any) =>
    matchesInterval(
      project.startDate || project.start,
      project.targetEndDate || project.endDate || project.dueDate || project.deadline,
      project.createdAt
    )
  );
  const scopedTimeLogs = allTimeLogs.filter((log: any) => matchesDate(log.date || log.createdAt));

  const activeProjects = scopedProjects.filter((project) => !isFinishedWork(project.status) && !isFinishedWork(project.health));
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

  const memberTime = scopedTimeLogs.reduce((map: Map<string, number>, log: any) => {
    const identity = String(log.user || log.userName || log.assignee || log.userId || 'Unassigned');
    map.set(identity, (map.get(identity) || 0) + (Number(log.durationMinutes ?? log.minutes ?? 0) || 0));
    return map;
  }, new Map<string, number>());
  const workload = Array.from(memberTime.entries())
    .map(([name, minutes]) => ({ name, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 8);

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
      <section
        className="space-y-2 rounded-card border border-line bg-panel p-4 sm:p-5"
        data-ams-feature-slug="dashboard-performance-scope"
        aria-label="Performance reporting scope"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-fg">Performance snapshot</p>
            <p className="mt-1 text-xs text-muted">Reporting period: {reportPeriodLabel}</p>
          </div>
          <span className="inline-flex min-h-7 items-center rounded-badge border border-line bg-bg px-2.5 text-[11px] text-muted">
            {reportPeriodEnabled ? 'Period filter active' : 'All dates'}
          </span>
        </div>
        <p className="text-xs leading-5 text-muted">
          Tasks use due date, with creation date as a fallback. Projects use recorded schedule overlap, with creation date as a fallback. Time entries use their logged date, with creation timestamp as a fallback. Records without usable dates remain visible. The current sources do not provide status-transition history, so these are current status snapshots, not historical status-transition trends.
        </p>
      </section>

      <section className="grid gap-4 min-[1100px]:grid-cols-2" data-ams-feature-slug="dashboard-performance-primary">
        <AdminPanel
          title="Task status in scope"
          description="Current status distribution for task records selected by the shared reporting period. This does not mean a task changed status during that period."
          actions={(
            <Link to="/admin/tasks" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">
              Open Tasks <ArrowUpRight size={13} />
            </Link>
          )}
          bodyClassName="p-4 sm:p-5"
        >
          {snapshot.tasks === null ? <DashboardUnavailable title="Task status unavailable" description="The task service did not return data for the current role." /> : tasks.length === 0 ? (
            <div className="py-8 text-center" role="status">
              <p className="text-xs font-medium text-fg">{allTasks.length === 0 ? 'No task records returned' : 'No task records match the selected reporting scope'}</p>
              <p className="mt-1 text-xs text-muted">{allTasks.length === 0 ? 'The task source returned no records.' : 'Change the shared reporting period to inspect another date scope. Rows without usable dates remain visible.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold tabular-nums text-fg">{completionValue}</p>
                  <p className="mt-1 text-xs text-muted">{completedTasks} of {tasks.length} in-scope tasks are currently completed</p>
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
              <p className="text-xs leading-5 text-muted">Source: current canonical task records. Counts use current task status and the shared reporting-period date scope.</p>
            </div>
          )}
        </AdminPanel>

        <AdminPanel
          title="Projects needing attention"
          description="Active projects with an explicit risk flag or target dates before today, limited to projects in the selected reporting scope."
          bodyClassName="p-0"
          actions={(
            <Link to="/admin/projects" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">
              Open Projects <ArrowUpRight size={13} />
            </Link>
          )}
        >
          {snapshot.projects === null ? <div className="p-4"><DashboardUnavailable title="Project status unavailable" description="Project risk cannot be assessed because live project records were not returned." /></div> : scopedProjects.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted" role="status">{allProjects.length === 0 ? 'No project records returned' : 'No projects match the selected reporting scope.'}</p>
          ) : needsAttention.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted" role="status">No explicit project risk flags or overdue target dates were found in this scope.</p>
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
              {attentionProjects.length > needsAttention.length && <div className="px-4 py-3 text-[10px] text-muted">Showing 8 of {attentionProjects.length} projects with attention signals in this scope.</div>}
            </div>
          )}
        </AdminPanel>
      </section>

      <AdminPanel
        title="Tracked time in scope"
        description={reportPeriodEnabled ? 'Recorded time during ' + reportPeriodLabel + '. Logged time is not a forecast of remaining capacity.' : 'Recorded time across all available dates. Logged time is not a forecast of remaining capacity.'}
        bodyClassName="p-4 sm:p-5"
      >
        {snapshot.timeLogs === null ? <DashboardUnavailable title="Time records unavailable" description="The time tracking service did not return records for the current role." /> : workload.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted" role="status">{scopedTimeLogs.length === 0 && allTimeLogs.length > 0 ? 'No time entries match the selected reporting scope.' : 'No time entries recorded in this scope.'}</p>
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
          { id: 'performance-projects', label: 'Active projects in scope', value: activeProjectValue, icon: <FolderKanban size={15} />, context: snapshot.projects !== null ? 'Current project records in scope' : 'Live source unavailable' },
          { id: 'performance-tasks', label: 'Tasks in scope', value: taskCount === null ? '—' : String(taskCount), icon: <CheckCircle2 size={15} />, context: snapshot.tasks !== null ? 'Current task records in scope' : 'Live source unavailable' },
          { id: 'performance-overdue', label: 'Open overdue tasks in scope', value: overdueValue, icon: <CalendarDays size={15} />, toneClassName: 'text-warning', context: snapshot.tasks !== null ? 'Current tasks past due date' : 'Not available' },
          { id: 'performance-blocked', label: 'Blocked tasks in scope', value: blockedValue, icon: <AlertTriangle size={15} />, toneClassName: 'text-danger', context: snapshot.tasks !== null ? 'Open tasks with a blocked status' : 'Not available' },
        ]} />
      </section>
    </div>
  );
};

type DashboardAnalyticsReport = 'financial-movement' | 'receivables' | 'project-status';

const DASHBOARD_ANALYTICS_REPORT_OPTIONS: Array<{ value: DashboardAnalyticsReport; label: string }> = [
  { value: 'financial-movement', label: 'Financial movement' },
  { value: 'receivables', label: 'Receivables' },
  { value: 'project-status', label: 'Project status' },
];

const AnalyticsView: React.FC<{
  snapshot: DashboardOperationalSnapshot;
  reportPeriodMode: ReportingPeriodMode;
  reportPeriodValue: string;
  reportPeriodLabel: string;
  reportPeriodEnabled: boolean;
  currency: string;
}> = ({ snapshot, reportPeriodMode, reportPeriodValue, reportPeriodLabel, reportPeriodEnabled, currency }) => {
  const [report, setReport] = useState<DashboardAnalyticsReport>('financial-movement');
  const invoiceRows = snapshot.invoices || [];
  const expenseRows = snapshot.expenses || [];
  const inCurrencyInvoices = invoiceRows.filter((row) => String(row.currency || 'IDR').toUpperCase() === currency);
  const inCurrencyIssuedInvoices = inCurrencyInvoices.filter(isIssuedInvoice);
  const inCurrencyExpenseRows = expenseRows.filter((row) => String(row.currency || 'IDR').toUpperCase() === currency);
  const inCurrencyExpenses = inCurrencyExpenseRows.filter(isDashboardExpenseEligible);
  const trend = snapshot.invoices !== null && snapshot.expenses !== null
    ? reportPeriodEnabled
      ? buildFinancialTrendForReportingPeriod(reportPeriodMode, reportPeriodValue, inCurrencyInvoices, inCurrencyExpenses)
      : buildRecentFinancialTrend(inCurrencyInvoices, inCurrencyExpenses)
    : [];
  const receivableInvoices = inCurrencyIssuedInvoices;
  const receivables = receivableInvoices.reduce((sum, invoice) => sum + getInvoiceOutstanding(invoice), 0);
  const openInvoiceCount = receivableInvoices.filter((invoice) => getInvoiceOutstanding(invoice) > 0).length;
  const activeProjects = snapshot.projects === null
    ? null
    : snapshot.projects.filter((project) => !isFinishedWork(project.status) && !isFinishedWork(project.health)).length;
  const projectStatusGroups = snapshot.projects === null ? [] : snapshot.projects.reduce((groups: Array<{ status: string; count: number }>, project: any) => {
    const status = String(project.status || project.health || 'Not set');
    const existing = groups.find((item) => item.status === status);
    if (existing) existing.count += 1;
    else groups.push({ status, count: 1 });
    return groups;
  }, []).sort((a, b) => b.count - a.count);
  const financialDataAvailable = snapshot.invoices !== null && snapshot.expenses !== null;
  const financialSourceRecordsReturned = invoiceRows.length > 0 || expenseRows.length > 0;
  const financialRecordsReturned = inCurrencyIssuedInvoices.length > 0 || inCurrencyExpenses.length > 0;
  const selectedCurrencyFinancialRowsReturned = inCurrencyInvoices.length > 0 || inCurrencyExpenseRows.length > 0;
  const selectedRangeLabel = describeFinancialTrendScope(trend, reportPeriodEnabled, reportPeriodLabel);
  const formatReportDate = (value: string) => {
    const date = new Date(value + 'T00:00:00');
    return Number.isFinite(date.getTime())
      ? date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : value;
  };
  const inclusiveEndDate = (endExclusive: string) => {
    const date = new Date(endExclusive + 'T00:00:00');
    if (!Number.isFinite(date.getTime())) return endExclusive;
    date.setDate(date.getDate() - 1);
    return localDateKey(date);
  };
  const selectedPeriodDescription = trend.length
    ? formatReportDate(trend[0].startDate) + ' – ' + formatReportDate(inclusiveEndDate(trend[trend.length - 1].endDate))
    : 'Period unavailable';
  const periodInvoicedTotal = trend.reduce((sum, point) => sum + point.primary, 0);
  const periodExpenseTotal = trend.reduce((sum, point) => sum + (point.secondary ?? 0), 0);
  const periodDifferenceTotal = trend.reduce((sum, point) => sum + (point.tertiary ?? 0), 0);

  if (snapshot.loading) return <DashboardUnavailable title="Loading analytics" description="Invoice, expense, and portfolio records are being loaded from AMS." />;

  return (
    <div className="space-y-4" data-ams-feature-slug="dashboard-analytics-workspace">
      <section
        className="rounded-card border border-line bg-panel p-4 sm:p-5"
        data-ams-feature-slug="dashboard-analytics-controls"
        aria-label="Analytics report controls"
      >
        <div className="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium text-muted">Report</p>
            <div role="group" aria-label="Analytics report" className="flex min-w-0 flex-wrap gap-2">
              {DASHBOARD_ANALYTICS_REPORT_OPTIONS.map((option) => {
                const active = report === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setReport(option.value)}
                    className={[
                      'inline-flex min-h-10 items-center justify-center rounded-control border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      active ? 'border-accent/25 bg-accent/10 text-fg' : 'border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg',
                    ].join(' ')}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          {report === 'financial-movement' ? (
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">Shared reporting period</p>
              <p className="mt-1 text-xs text-fg">{selectedRangeLabel}</p>
            </div>
          ) : (
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">Scope</p>
              <p className="mt-1 text-xs text-fg">{report === 'receivables' ? 'Current invoice balances' : 'Current project register'}</p>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          Financial movement uses the shared Filter selection. When it is set to All dates, this chart uses the recent 30-day default window. Receivables and project status are current snapshots.
        </p>
      </section>

      {report === 'financial-movement' ? (
        <section className="space-y-3" data-ams-feature-slug="dashboard-analytics-financial-report" aria-label="Financial movement report">
          <AdminPanel
            title="Issued invoices vs recorded expenses"
            description="Compare invoice values by issue date with expenses by recorded date. The difference is an arithmetic comparison, not posted profit."
            actions={(
              <Link to="/admin/finance?tab=chart-of-accounts" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">
                Open Transactions & Cash <ArrowUpRight size={13} />
              </Link>
            )}
            bodyClassName="p-4 sm:p-5"
          >
            <div className="mb-4 flex flex-col gap-2 border-b border-line pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium text-fg">{selectedRangeLabel}</p>
                <p className="mt-1 text-xs text-muted">{selectedPeriodDescription}</p>
              </div>
              <p className="text-xs text-muted">Source: AMS invoice and expense records · Currency: {currency}</p>
            </div>

            {!financialDataAvailable ? (
              <DashboardUnavailable title="Financial trend unavailable" description="The invoice or expense source did not return data for the current role. Values are not estimated." />
            ) : !financialRecordsReturned ? (
              <DashboardUnavailable
                title={financialSourceRecordsReturned
                  ? selectedCurrencyFinancialRowsReturned
                    ? 'No usable financial records in selected currency'
                    : 'No financial records in selected currency'
                  : 'No financial records returned'}
                description={financialSourceRecordsReturned
                  ? selectedCurrencyFinancialRowsReturned
                    ? 'Rows match ' + currency + ', but include only quotations or non-issued invoices and/or cancelled, voided, or deleted expenses. These records do not form a financial trend.'
                    : 'The invoice and expense sources returned records, but none match ' + currency + '. A zero-value trend is not inferred from another currency.'
                  : 'The invoice and expense sources returned no records. A zero-value trend is not inferred from an empty source.'}
              />
            ) : inCurrencyIssuedInvoices.length === 0 ? (
              <DashboardUnavailable title="Invoice history unavailable" description={'The invoice source returned no usable records in ' + currency + '. A zero-value invoice series is not inferred.'} />
            ) : inCurrencyExpenses.length === 0 ? (
              <DashboardUnavailable title="Expense history unavailable" description={'The expense source returned no usable records in ' + currency + '. A zero-value expense series is not inferred.'} />
            ) : trend.length < 2 ? (
              <DashboardUnavailable title="Financial trend unavailable" description="The selected sources did not return a usable period series. Values are not estimated." />
            ) : (
              <>
                <TrendChart
                  data={trend}
                  primaryLabel="Invoices issued"
                  secondaryLabel="Recorded expenses"
                  tertiaryLabel="Difference"
                  primaryFormat={(value) => formatLiveMoney(value, currency)}
                  ariaLabel="Issued invoice values and recorded expenses by period. Exact values are listed in the table below."
                />
                <div className="mt-5 space-y-2" data-ams-feature-slug="dashboard-analytics-exact-values">
                  <div>
                    <h3 className="text-sm font-semibold text-fg">Exact period values</h3>
                    <p className="mt-1 text-xs text-muted">The table provides the values and date ranges behind the chart.</p>
                  </div>
                  <div className="overflow-x-auto rounded-control border border-line" role="region" aria-label="Exact invoice and expense values by period" tabIndex={0}>
                    <table className="w-full min-w-[680px] border-collapse text-left text-xs" aria-label="Exact invoice and expense values by period">
                      <thead className="bg-bg text-muted">
                        <tr className="border-b border-line">
                          <th className="px-3 py-2.5 font-medium" scope="col">Period</th>
                          <th className="px-3 py-2.5 text-right font-medium" scope="col">Invoices issued · {currency}</th>
                          <th className="px-3 py-2.5 text-right font-medium" scope="col">Expenses recorded · {currency}</th>
                          <th className="px-3 py-2.5 text-right font-medium" scope="col">Difference · not profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trend.map((point) => {
                          const endDate = inclusiveEndDate(point.endDate);
                          return (
                            <tr key={point.startDate + '-' + point.endDate} className="border-b border-line last:border-0">
                              <th className="px-3 py-3 font-medium text-fg" scope="row">
                                <span className="block">{point.label}</span>
                                <span className="mt-1 block text-[11px] font-normal text-muted">{formatReportDate(point.startDate)} – {formatReportDate(endDate)}</span>
                              </th>
                              <td className="px-3 py-3 text-right tabular-nums text-fg">{formatLiveMoney(point.primary, currency)}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-fg">{formatLiveMoney(point.secondary ?? 0, currency)}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-fg">{formatLiveMoney(point.tertiary ?? 0, currency)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-bg">
                        <tr className="border-t border-line">
                          <th className="px-3 py-3 font-semibold text-fg" scope="row">Selected period total</th>
                          <td className="px-3 py-3 text-right font-semibold tabular-nums text-fg">{formatLiveMoney(periodInvoicedTotal, currency)}</td>
                          <td className="px-3 py-3 text-right font-semibold tabular-nums text-fg">{formatLiveMoney(periodExpenseTotal, currency)}</td>
                          <td className="px-3 py-3 text-right font-semibold tabular-nums text-fg">{formatLiveMoney(periodDifferenceTotal, currency)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-muted">
                  Invoice buckets use issue date. Expense buckets use recorded date. The difference is not revenue recognition, cash flow, or posted profit.
                </p>
              </>
            )}
          </AdminPanel>
        </section>
      ) : report === 'receivables' ? (
        <section className="space-y-3" data-ams-feature-slug="dashboard-analytics-receivables-report" aria-label="Receivables report">
          <AdminPanel
            title="Outstanding receivables"
            description="Current open invoice balances. This is a balance snapshot, not an amount issued or cash collected."
            actions={(
              <Link to="/admin/finance?tab=accounts-receivable" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">
                Open Accounts Receivable <ArrowUpRight size={13} />
              </Link>
            )}
            bodyClassName="p-4 sm:p-5"
          >
            {snapshot.invoices === null ? (
              <DashboardUnavailable title="Receivables unavailable" description="The invoice source did not return data for the current role." />
            ) : invoiceRows.length === 0 ? (
              <div className="rounded-control border border-line bg-bg px-4 py-5" role="status">
                <p className="text-xs font-medium text-fg">No invoice records returned</p>
                <p className="mt-1 text-xs text-muted">An empty source is not represented as a confirmed zero balance.</p>
              </div>
            ) : inCurrencyIssuedInvoices.length === 0 ? (
              <DashboardUnavailable title="No issued invoice records in selected currency" description={'The invoice source returned no issued invoice records in ' + currency + '. Quotations and non-issued invoice rows are excluded from receivables.'} />
            ) : (
              <div className="space-y-4">
                <div className="rounded-control border border-line bg-bg p-4">
                  <p className="text-xs text-muted">Open invoice balance · {currency}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-fg">{formatLiveMoney(receivables, currency)}</p>
                  <p className="mt-1 text-xs text-muted">{openInvoiceCount} open invoice records</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-fg">Definition and source</h3>
                  <p className="text-xs leading-5 text-muted">
                    Source: current AMS invoice records. The balance excludes paid, draft, cancelled, and voided statuses, and uses available balance fields with the existing invoice amount and paid amount fallback. This current snapshot is not filtered by the selected financial trend period.
                  </p>
                </div>
              </div>
            )}
          </AdminPanel>
        </section>
      ) : (
        <section className="space-y-3" data-ams-feature-slug="dashboard-analytics-project-status-report" aria-label="Project status report">
          <AdminPanel
            title="Project status"
            description="Current status distribution from the canonical project register."
            actions={(
              <Link to="/admin/projects" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">
                Open Projects <ArrowUpRight size={13} />
              </Link>
            )}
            bodyClassName="p-4 sm:p-5"
          >
            {snapshot.projects === null ? (
              <DashboardUnavailable title="Project records unavailable" description="Project status analytics need access to the live project register." />
            ) : snapshot.projects.length === 0 ? (
              <div className="rounded-control border border-line bg-bg px-4 py-5" role="status">
                <p className="text-xs font-medium text-fg">No project records returned</p>
                <p className="mt-1 text-xs text-muted">The current source contains no project rows to group by status.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-control border border-line bg-bg p-4">
                  <p className="text-xs text-muted">Active projects</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-fg">{activeProjects}</p>
                  <p className="mt-1 text-xs text-muted">Current portfolio snapshot</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-fg">Projects by current status</h3>
                  {projectStatusGroups.map((group) => (
                    <div key={group.status} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
                      <span className="text-xs text-fg">{group.status}</span>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-fg">{group.count}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs leading-5 text-muted">
                  Source: current project records. Status counts are current-state groupings, not trends for the selected financial period. Records without a status use the existing health field, then “Not set”.
                </p>
              </div>
            )}
          </AdminPanel>
        </section>
      )}
    </div>
  );
};

export const GlobalExecutiveDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const canManageProjects = hasAdminPermission('canManageProjects');
  const currentNavigationRole = getAmsRole(getAdminSession()?.user);
  const canOpenDashboardRoute = (destination: string) => {
    const target = new URL(destination, 'https://ams.kapitech.local');
    return canAccessAmsRoute(currentNavigationRole, target.pathname, target.search);
  };
  const getDashboardMetricDrilldown = (href: string, linkLabel: string): { href?: string; linkLabel?: string } =>
    canOpenDashboardRoute(href) ? { href, linkLabel } : {};
  const canOpenInvoiceRegister = canOpenDashboardRoute('/admin/finance?tab=accounts-receivable');
  const canOpenExpenseRegister = canOpenDashboardRoute('/admin/finance?tab=expenses');
  const canCreateProject = canManageProjects && canOpenDashboardRoute('/admin/projects?create=1');
  const canOpenProjects = canOpenDashboardRoute('/admin/projects');
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
  const { matchesDate, matchesInterval, value: reportPeriodValue, mode: reportPeriodMode, enabled: reportPeriodEnabled } = useReportingPeriod();
  const selectedReportingRange = getReportingPeriodRange(reportPeriodValue, reportPeriodMode, 'en-GB');
  const reportPeriodLabel = reportPeriodEnabled && selectedReportingRange
    ? selectedReportingRange.label + ' (' + selectedReportingRange.startDate + ' – ' + selectedReportingRange.endDate + ')'
    : 'All dates';
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('All');
  const [projectActionId, setProjectActionId] = useState<string | null>(null);
  const [projectActionPosition, setProjectActionPosition] = useState<{ top: number; left: number } | null>(null);
  const [projectDetails, setProjectDetails] = useState<DashboardProject | null>(null);
  const [dashboardProjectPage, setDashboardProjectPage] = useState(1);
  const [dashboardProjectPageSize, setDashboardProjectPageSize] = useState(6);
  const [dashboardOverview, setDashboardOverview] = useState<{ metrics?: any; financials?: any; projects?: any[]; attentionItems?: DashboardAttentionItem[]; attentionItemsDataAvailable?: boolean; recentActivity?: DashboardRecentActivity[]; recentActivityDataAvailable?: boolean; projectDataAvailable?: boolean; stale?: boolean; source: 'server' | 'ab'; loading: boolean }>({ source: 'ab', loading: true });
  const [operationalSnapshot, setOperationalSnapshot] = useState<DashboardOperationalSnapshot>({
    loading: true, projects: null, tasks: null, timeLogs: null, invoices: null, expenses: null
  });
  const [refreshRequest, setRefreshRequest] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsRefreshing(true);

    const requests: Array<Promise<any>> = [
      api.dashboard.getOverview(),
      api.projects.getAll(),
      api.tasks.getAll(),
      api.timeLogs.getAll(),
      api.finance.getInvoices(),
      api.finance.getExpenses()
    ];

    const readRows = (result: PromiseSettledResult<any>, field: string): any[] | null => {
      if (result.status !== 'fulfilled' || !result.value?.success || !Array.isArray(result.value.data?.[field])) return null;
      return result.value.data[field];
    };

    Promise.allSettled(requests).then((results) => {
      if (!active) return;
      const failedSources: string[] = [];
      const overviewResult = results[0];

      if (overviewResult.status === 'fulfilled' && overviewResult.value?.success) {
        const data = overviewResult.value.data || {};
        const projectDataReturned = Array.isArray(data.projects);
        const activityDataReturned = Array.isArray(data.recentActivity);
        const attentionItemsDataReturned = Array.isArray(data.attentionItems);
        setDashboardOverview((previous) => ({
          metrics: data.metrics ?? previous.metrics,
          financials: data.financials ?? previous.financials,
          projects: projectDataReturned ? data.projects : previous.projects,
          attentionItems: attentionItemsDataReturned ? data.attentionItems as DashboardAttentionItem[] : previous.attentionItems ?? [],
          attentionItemsDataAvailable: attentionItemsDataReturned ? true : previous.attentionItemsDataAvailable,
          recentActivity: activityDataReturned ? data.recentActivity as DashboardRecentActivity[] : previous.recentActivity ?? [],
          recentActivityDataAvailable: activityDataReturned ? true : previous.recentActivityDataAvailable,
          projectDataAvailable: projectDataReturned ? true : previous.projectDataAvailable,
          stale: (!data.metrics && previous.metrics != null) || (!data.financials && previous.financials != null) || (!attentionItemsDataReturned && previous.attentionItemsDataAvailable === true) || (!activityDataReturned && previous.recentActivityDataAvailable === true),
          source: projectDataReturned || Boolean(data.metrics) ? 'server' : previous.source,
          loading: false
        }));
      } else {
        failedSources.push('dashboard summary');
        setDashboardOverview((previous) => ({ ...previous, loading: false }));
      }

      const projects = readRows(results[1], 'projects');
      const tasks = readRows(results[2], 'tasks');
      const timeLogs = readRows(results[3], 'timeLogs');
      const invoices = readRows(results[4], 'invoices');
      const expenses = readRows(results[5], 'expenses');

      if (projects === null) failedSources.push('projects');
      if (tasks === null) failedSources.push('tasks');
      if (timeLogs === null) failedSources.push('time logs');
      if (invoices === null) failedSources.push('invoices');
      if (expenses === null) failedSources.push('expenses');

      setOperationalSnapshot((previous) => ({
        loading: false,
        projects: projects ?? previous.projects,
        tasks: tasks ?? previous.tasks,
        timeLogs: timeLogs ?? previous.timeLogs,
        invoices: invoices ?? previous.invoices,
        expenses: expenses ?? previous.expenses
      }));

      setRefreshNotice(failedSources.length
        ? 'Could not refresh ' + failedSources.join(', ') + '. Previously loaded values are retained where available; unavailable sources are not treated as zero.'
        : null);
      setIsRefreshing(false);
    }).catch(() => {
      if (!active) return;
      setDashboardOverview((previous) => ({ ...previous, loading: false }));
      setOperationalSnapshot((previous) => ({ ...previous, loading: false }));
      setRefreshNotice('Dashboard refresh failed. Previously loaded values are retained where available; unavailable sources are not treated as zero.');
      setIsRefreshing(false);
    });

    return () => { active = false; };
  }, [refreshRequest]);

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
            health: String(project.health || ''),
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

  const activeDashboardProjects = useMemo(
    () => dashboardProjects.filter((project) =>
      !isFinishedWork(project.status) && !isFinishedWork(project.health)
    ),
    [dashboardProjects],
  );

  const filteredProjects = useMemo(
    () => activeDashboardProjects.filter((project) =>
      matchesInterval(project.startDate, project.targetEndDate, project.createdAt)
      && (projectFilter === 'All' || project.type === projectFilter)
    ),
    [activeDashboardProjects, projectFilter, matchesInterval],
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
  const invoiceSourceHasRows = Boolean(operationalSnapshot.invoices?.length);
  const expenseSourceHasRows = Boolean(operationalSnapshot.expenses?.length);
  const invoiceSourceHasSelectedCurrencyRows = Boolean(operationalSnapshot.invoices?.some((invoice: any) => String(invoice.currency || 'IDR').toUpperCase() === financeCurrency));
  const expenseSourceHasSelectedCurrencyRows = Boolean(operationalSnapshot.expenses?.some((expense: any) => String(expense.currency || 'IDR').toUpperCase() === financeCurrency));
  const invoiceHistoryReturned = Boolean(operationalSnapshot.invoices?.some((invoice: any) => String(invoice.currency || 'IDR').toUpperCase() === financeCurrency && isIssuedInvoice(invoice)));
  const expenseHistoryReturned = Boolean(operationalSnapshot.expenses?.some((expense: any) => String(expense.currency || 'IDR').toUpperCase() === financeCurrency && isDashboardExpenseEligible(expense)));
  const revenueData = useMemo(() => {
    if (!financeSourcesAvailable) return [];
    const invoices = (operationalSnapshot.invoices || []).filter((invoice: any) => String(invoice.currency || 'IDR').toUpperCase() === financeCurrency);
    const expenses = (operationalSnapshot.expenses || []).filter((expense: any) => String(expense.currency || 'IDR').toUpperCase() === financeCurrency);
    return reportPeriodEnabled
      ? buildFinancialTrendForReportingPeriod(reportPeriodMode, reportPeriodValue, invoices, expenses)
      : buildRecentFinancialTrend(invoices, expenses);
  }, [financeSourcesAvailable, operationalSnapshot.invoices, operationalSnapshot.expenses, financeCurrency, reportPeriodEnabled, reportPeriodMode, reportPeriodValue]);
  const financialTrendScopeLabel = describeFinancialTrendScope(revenueData, reportPeriodEnabled, reportPeriodLabel);

  const currentMonthKey = localDateKey(new Date()).slice(0, 7);
  const liveProjectRows = operationalSnapshot.projects || [];
  const activeProjectRows = liveProjectRows.filter((project: any) => !isFinishedWork(project.status) && !isFinishedWork(project.health));
  const activeProjectBudgets = activeProjectRows.map((project: any) => Number(project.budget ?? project.totalBudget ?? 0)).filter((value: number) => Number.isFinite(value) && value > 0);
  const averageActiveBudget = activeProjectBudgets.length
    ? activeProjectBudgets.reduce((sum: number, value: number) => sum + value, 0) / activeProjectBudgets.length
    : null;
  const liveCashCollected = operationalSnapshot.invoices === null ? null : operationalSnapshot.invoices.reduce((sum: number, invoice: any) => {
    if (String(invoice.currency || 'IDR').toUpperCase() !== financeCurrency || !isIssuedInvoice(invoice)) return sum;
    return sum + getPaymentRows(invoice)
      .filter((payment) => String(payment.date || '').slice(0, 7) === currentMonthKey)
      .reduce((paymentSum, payment) => paymentSum + Math.max(0, Number(payment.amount) || 0), 0);
  }, 0);
  const liveOutstanding = operationalSnapshot.invoices === null ? null : operationalSnapshot.invoices.reduce((sum: number, invoice: any) => {
    if (String(invoice.currency || 'IDR').toUpperCase() !== financeCurrency || !isIssuedInvoice(invoice)) return sum;
    return sum + getInvoiceOutstanding(invoice);
  }, 0);
  const liveMonthlyExpenses = operationalSnapshot.expenses === null ? null : operationalSnapshot.expenses.reduce((sum: number, expense: any) => {
    if (String(expense.currency || 'IDR').toUpperCase() !== financeCurrency || String(expense.date || '').slice(0, 7) !== currentMonthKey || ['voided', 'cancelled', 'canceled', 'deleted'].includes(String(expense.status || '').toLowerCase())) return sum;
    return sum + Math.max(0, Number(expense.amount) || 0);
  }, 0);
  const liveCashDifference = liveCashCollected !== null && liveMonthlyExpenses !== null ? liveCashCollected - liveMonthlyExpenses : null;
  const activeProjectsMetric = dashboardOverview.metrics?.activeProjects ?? (operationalSnapshot.projects !== null ? activeProjectRows.length : null);
  // The current dashboard API maps financials.cashCollected to monthly revenue. Only use payment rows for a cash-collected KPI.
  const cashCollectedMetric = liveCashCollected;
  const outstandingMetric = dashboardOverview.financials?.outstandingReceivables ?? liveOutstanding;
  const cashDifferenceMetric = liveCashDifference;

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
            : 'Choose a report to inspect financial movement, outstanding receivables, or current project status.'}
        actions={(
          <>
            <button
              type="button"
              onClick={() => setRefreshRequest((current) => current + 1)}
              disabled={isRefreshing}
              aria-label="Refresh dashboard data"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg transition-colors hover:bg-panel-hover disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-9 sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} aria-hidden="true" />
              {isRefreshing ? 'Refreshing…' : 'Refresh data'}
            </button>
            {canCreateProject || canOpenProjects ? (
              <Link
                to={canCreateProject ? '/admin/projects?create=1' : '/admin/projects'}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-medium sm:min-h-9 sm:w-auto text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Plus size={14} />
                {canCreateProject ? 'New project' : 'Open Projects'}
              </Link>
            ) : null}
          </>
        )}
      />

      {isRefreshing && !dashboardOverview.loading && !operationalSnapshot.loading ? (
        <p className="rounded-control border border-line bg-panel px-3 py-2 text-xs text-muted" role="status" data-ams-feature-slug="dashboard-refreshing-status">
          Refreshing dashboard sources. Previously loaded values remain visible.
        </p>
      ) : null}
      {dashboardOverview.stale ? (
        <p className="rounded-control border border-warning/25 bg-warning/5 px-3 py-2 text-xs text-muted" role="status" data-ams-feature-slug="dashboard-summary-stale">
          The latest dashboard response omitted previously available summary fields. Previously loaded values remain visible and may be stale.
        </p>
      ) : null}
      {refreshNotice ? (
        <p className="rounded-control border border-warning/25 bg-warning/5 px-3 py-2 text-xs text-muted" role="status" data-ams-feature-slug="dashboard-refresh-warning">
          {refreshNotice}
        </p>
      ) : null}

      {view === 'overview' ? (
        <>
      <section
        className="space-y-2 rounded-card border border-line bg-panel px-4 py-3 sm:px-5"
        data-ams-feature-slug="dashboard-overview-reporting-scope"
        aria-label="Overview reporting scope"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-fg">Reporting scope</p>
            <p className="mt-1 text-xs text-muted">{financialTrendScopeLabel}</p>
          </div>
          <p className="max-w-3xl text-xs leading-5 text-muted">
            {reportPeriodEnabled
              ? 'The invoice/expense trend and active project register follow this period. Priority exceptions, KPI summaries, delivery pacing, team capacity, and recent activity are current snapshots or work queues, not historical results for this period.'
              : 'The invoice/expense trend uses this recent 30-day default window. The active project register covers all dates. Priority exceptions, KPI summaries, delivery pacing, team capacity, and recent activity are current snapshots or work queues.'}
          </p>
        </div>
      </section>

      <section data-ams-feature-slug="dashboard-priority-exceptions" aria-label="Priority exceptions">
        <AdminPanel
          title="Priority exceptions"
          description="Actionable cross-module items returned by the Dashboard service for your authorized scope."
          bodyClassName="p-0"
        >
          {!dashboardOverview.attentionItemsDataAvailable ? (
            <div className="px-4 py-5" role="status">
              <p className="text-xs font-medium text-fg">{dashboardOverview.loading ? 'Loading priority exceptions' : 'Priority exception data unavailable'}</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">The Dashboard service did not return a usable attention list. The interface does not infer that there are no exceptions.</p>
            </div>
          ) : (dashboardOverview.attentionItems || []).length === 0 ? (
            <div className="px-4 py-5" role="status">
              <p className="text-xs font-medium text-fg">No priority exceptions returned</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">The Dashboard service reports no actionable exceptions for this authorized scope.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {(dashboardOverview.attentionItems || []).map((item, index) => {
                const severity = String(item.severity || 'info').toLowerCase();
                const tone: DashboardProject['statusTone'] = severity === 'danger' || severity === 'critical'
                  ? 'danger'
                  : severity === 'warning'
                    ? 'warning'
                    : 'info';
                const category = String(item.category || 'Operations');
                const destination = String(item.linkUrl || '');
                const safeDestination = /^\/admin\/[a-z0-9/_-]+$/i.test(destination) && canOpenDashboardRoute(destination) ? destination : null;
                const linkLabel = category === 'Finance'
                  ? 'Open Finance'
                  : category === 'Sales'
                    ? 'Open Inbox'
                    : category === 'Delivery'
                      ? 'Open Projects'
                      : 'Review operations';
                const severityLabel = tone === 'danger' ? 'Urgent' : tone === 'warning' ? 'Attention' : 'Informational';
                const AttentionIcon = tone === 'danger'
                  ? AlertTriangle
                  : category === 'Delivery'
                    ? CalendarDays
                    : category === 'Finance'
                      ? CircleDollarSign
                      : category === 'Sales'
                        ? Users
                        : Clock3;

                return (
                  <article key={String(item.id || category + '-' + item.title || index)} className="flex min-w-0 flex-col gap-3 px-4 py-3 min-[900px]:flex-row min-[900px]:items-center">
                    <span className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-control border', toneClasses[tone]].join(' ')}>
                      <AttentionIcon size={15} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-xs font-semibold text-fg">{item.title || 'Attention item'}</p>
                        <span className={['inline-flex items-center rounded-badge border px-2 py-0.5 text-[10px] font-medium', toneClasses[tone]].join(' ')}>{severityLabel}</span>
                        <span className="inline-flex items-center rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">{category}</span>
                      </div>
                      {item.description ? <p className="mt-1 break-words text-[11px] leading-5 text-muted">{item.description}</p> : null}
                    </div>
                    {safeDestination ? (
                      <Link to={safeDestination} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                        {linkLabel} <ArrowUpRight size={13} aria-hidden="true" />
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-9 shrink-0 items-center text-[11px] text-muted">Destination unavailable</span>
                    )}
                  </article>
                );
              })}
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
              id: 'active-projects', label: 'Active projects now',
              value: activeProjectsMetric != null ? String(activeProjectsMetric) : '—',
              context: dashboardOverview.metrics?.activeProjects != null || operationalSnapshot.projects !== null ? 'Current open project records' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live data unavailable',
              sourceLabel: 'Projects',
              ...getDashboardMetricDrilldown('/admin/projects?projects=all', 'Open Projects registry'),
              icon: <FolderKanban size={15} />, toneClassName: 'text-success', slug: 'dashboard-active-projects'
            },
            {
              id: 'cash-collected', label: 'Cash collected this month',
              value: cashCollectedMetric != null ? formatLiveMoney(Number(cashCollectedMetric), financeCurrency) : '—',
              context: liveCashCollected !== null ? 'Invoice payments recorded this month' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live data unavailable',
              sourceLabel: 'Finance · invoice payment records',
              ...getDashboardMetricDrilldown('/admin/finance?tab=accounts-receivable', 'Open invoice payments'),
              icon: <CircleDollarSign size={15} />, toneClassName: 'text-success', slug: 'dashboard-cash-collected'
            },
            {
              id: 'outstanding', label: 'Outstanding invoices',
              value: outstandingMetric != null ? formatLiveMoney(Number(outstandingMetric), financeCurrency) : '—',
              context: dashboardOverview.financials?.outstandingReceivables != null || liveOutstanding !== null ? 'Current open invoice balances' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live data unavailable',
              sourceLabel: 'Finance · issued invoice balances',
              ...getDashboardMetricDrilldown('/admin/finance?tab=accounts-receivable', 'Open receivables register'),
              icon: <ReceiptText size={15} />, toneClassName: 'text-warning', slug: 'dashboard-outstanding'
            },
            {
              id: 'utilization', label: 'Team utilization',
              value: dashboardOverview.metrics?.teamUtilization != null ? String(dashboardOverview.metrics.teamUtilization) + '%' : '—',
              context: dashboardOverview.metrics?.teamUtilization != null ? 'Current team utilization' : dashboardOverview.loading ? 'Loading live data' : 'Live data unavailable',
              sourceLabel: 'Team & Resources',
              ...getDashboardMetricDrilldown('/admin/team', 'Open Team & Capacity'),
              icon: <Users size={15} />, toneClassName: 'text-warning', slug: 'dashboard-utilization'
            }
          ]}
        />
      </section>



      <div className="grid gap-3 min-[1100px]:grid-cols-12">
        <AdminPanel
          className="min-[1100px]:col-span-8"
          bodyClassName="p-4 sm:p-5"
          title="Invoices vs expenses"
          description={'Issued invoice value and recorded expenses for ' + financialTrendScopeLabel + '. Invoice values use issue date and expenses use recorded date. The difference is not a posted profit figure.'}
          actions={canOpenInvoiceRegister || canOpenExpenseRegister ? (
            <div className="flex flex-wrap gap-2">
              {canOpenInvoiceRegister && (
                <Link
                  to="/admin/finance?tab=accounts-receivable"
                  className="inline-flex min-h-8 items-center rounded-control border border-line bg-bg px-3 text-[11px] font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  View invoices
                </Link>
              )}
              {canOpenExpenseRegister && (
                <Link
                  to="/admin/finance?tab=expenses"
                  className="inline-flex min-h-8 items-center rounded-control border border-line bg-bg px-3 text-[11px] font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  View expenses
                </Link>
              )}
            </div>
          ) : undefined}
        >
          {!financeSourcesAvailable ? (
            <DashboardUnavailable title="Financial trend unavailable" description="The invoice or expense source did not return data for the current role. Values are not estimated." />
          ) : !invoiceHistoryReturned && !expenseHistoryReturned ? (
            <DashboardUnavailable
              title={invoiceSourceHasRows || expenseSourceHasRows
                ? invoiceSourceHasSelectedCurrencyRows || expenseSourceHasSelectedCurrencyRows
                  ? 'No usable financial records in selected currency'
                  : 'No financial records in selected currency'
                : 'No financial records returned'}
              description={invoiceSourceHasRows || expenseSourceHasRows
                ? invoiceSourceHasSelectedCurrencyRows || expenseSourceHasSelectedCurrencyRows
                  ? 'Records match ' + financeCurrency + ', but none are issued invoices or eligible expenses. Quotations and cancelled, voided, or deleted expenses do not form a financial trend.'
                  : 'The invoice and expense sources returned records, but none match ' + financeCurrency + '. A zero-value trend is not inferred from another currency.'
                : 'The invoice and expense sources returned no records. A zero-value trend is not inferred from an empty source.'}
            />
          ) : !invoiceHistoryReturned ? (
            <DashboardUnavailable title="Invoice history unavailable" description={'The invoice source returned no usable records in ' + financeCurrency + '. A zero-value invoice series is not inferred.'} />
          ) : !expenseHistoryReturned ? (
            <DashboardUnavailable title="Expense history unavailable" description={'The expense source returned no usable records in ' + financeCurrency + '. A zero-value expense series is not inferred.'} />
          ) : revenueData.length >= 2 ? (
            <TrendChart data={revenueData} primaryLabel="Invoices issued" secondaryLabel="Expenses recorded" tertiaryLabel="Difference" primaryFormat={(value) => formatLiveMoney(value, financeCurrency)} ariaLabel={'Issued invoices, recorded expenses, and difference for ' + financialTrendScopeLabel + '.'} />
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-control border border-line bg-bg px-5 py-8 text-center" role="status">
              <CircleDollarSign size={20} className="text-muted" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold text-fg">Financial trend unavailable</p>
              <p className="mt-1 max-w-sm text-[11px] leading-5 text-muted">A usable issued-invoice and recorded-expense trend could not be built for this reporting window. Missing values are not estimated.</p>
            </div>
          )}
        </AdminPanel>

        <AdminPanel className="min-[1100px]:col-span-4" bodyClassName="p-4 sm:p-5" title="Delivery & pacing" description="Current active portfolio snapshot. This is not historical status-transition data.">
          {deliveryProjects !== null ? totalDelivery === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center px-4 py-8 text-center" role="status">
              <FolderKanban size={20} className="text-muted" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold text-fg">No active projects to assess</p>
              <p className="mt-1 max-w-sm text-[11px] leading-5 text-muted">The live project source returned no active projects for delivery-risk assessment.</p>
              {canOpenProjects ? <Link to="/admin/projects" className="mt-3 inline-flex min-h-8 items-center rounded-control border border-line bg-panel px-3 text-[11px] font-medium text-fg hover:bg-panel-hover">Open Projects</Link> : null}
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
        <AdminPanel className="min-[1100px]:col-span-8" bodyClassName="p-0" title="Active projects" description={reportPeriodEnabled ? 'Active projects overlapping ' + reportPeriodLabel + '.' : 'Active projects across all dates.'} actions={canOpenProjects ? (
          <Link to="/admin/projects" className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-accent-text">View all <ArrowUpRight size={13} /></Link>
        ) : undefined}>
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
                  : !dashboardProjectDataAvailable
                    ? 'Live project data unavailable'
                    : dashboardProjects.length === 0
                      ? 'No projects recorded'
                      : activeDashboardProjects.length === 0
                        ? 'No active projects recorded'
                        : 'No active projects match the selected reporting scope and type'}
              </p>
              <p className="mt-1 max-w-md text-xs leading-5 text-muted">
                {dashboardOverview.loading || operationalSnapshot.loading
                  ? 'Waiting for the live dashboard and project services to return their records.'
                  : !dashboardProjectDataAvailable
                    ? (canOpenProjects ? 'The dashboard and project services did not return project records. Open Projects to retry from the canonical workspace.' : 'The dashboard and project services did not return project records available to this role.')
                    : dashboardProjects.length === 0
                      ? 'The canonical project source returned no records.'
                      : activeDashboardProjects.length === 0
                        ? (canOpenProjects ? 'The returned project records are completed or archived. Open Projects to review the wider history.' : 'The returned project records are completed or archived.')
                        : (canOpenProjects ? 'No current project matches the selected reporting period and type. Adjust the scope or open Projects.' : 'No current project matches the selected reporting period and type. Adjust the scope or type filter.')}
              </p>
              {canOpenProjects ? <Link to="/admin/projects" className="mt-4 inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">Open Projects</Link> : null}
            </div>
          ) : (
            <>
          <div className="min-[900px]:hidden divide-y divide-line">
            {pagedDashboardProjects.map((project) => (
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
{canOpenProjects && (
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
                          )}
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
            {canOpenDashboardRoute('/admin/time-logs') ? <Link to="/admin/time-logs" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-accent-text">Open Time Logs <ArrowUpRight size={13} /></Link> : null}
          </div>
        </AdminPanel>
      </div>

        <div className="mt-3 min-w-0" data-ams-feature-slug="dashboard-supporting-metrics">
          <AdminMetricStrip slug="dashboard-supporting-kpis" metrics={[
            {
              id: 'avg-project-value', label: 'Avg. active project budget now',
              value: averageActiveBudget != null ? formatLiveMoney(averageActiveBudget, financeCurrency) : '—',
              context: averageActiveBudget != null ? 'Average of current active project budgets' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live project budgets unavailable',
              icon: <FolderKanban size={15} />, toneClassName: 'text-fg', slug: 'dashboard-avg-project-value'
            },
            {
              id: 'cash-expense-difference', label: 'Payments less recorded expenses this month',
              value: cashDifferenceMetric != null ? formatLiveMoney(Number(cashDifferenceMetric), financeCurrency) : '—',
              context: liveCashDifference !== null ? 'Invoice payments recorded this month less expenses recorded this month; not posted profit' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live financial data unavailable',
              icon: <CircleDollarSign size={15} />,
              toneClassName: liveCashDifference != null
                ? liveCashDifference >= 0 ? 'text-success' : 'text-danger'
                : 'text-fg',
              slug: 'dashboard-cash-expense-difference'
            }
          ]} />
        </div>



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
            { label: 'View invoices', icon: <ReceiptText size={14} />, href: '/admin/finance?tab=accounts-receivable' },
            { label: 'View clients', icon: <Users size={14} />, href: '/admin/clients' },
            { label: 'View documents', icon: <FileText size={14} />, href: '/admin/documents' }
          ].filter((action) => canOpenDashboardRoute(action.href)).map((action) => (
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
        <PerformanceView
          snapshot={operationalSnapshot}
          matchesDate={matchesDate}
          matchesInterval={matchesInterval}
          reportPeriodLabel={reportPeriodLabel}
          reportPeriodEnabled={reportPeriodEnabled}
        />
      ) : (
        <AnalyticsView
          snapshot={operationalSnapshot}
          reportPeriodMode={reportPeriodMode}
          reportPeriodValue={reportPeriodValue}
          reportPeriodLabel={reportPeriodLabel}
          reportPeriodEnabled={reportPeriodEnabled}
          currency={financeCurrency}
        />
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
{canOpenProjects && (
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
            )}
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