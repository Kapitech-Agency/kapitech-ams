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
import { AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminPanel, AdminSectionTabs, AdminStatusBadge, AdminTablePagination } from './AdminModulePrimitives';
import { CustomSelect } from '../ui/CustomSelect';
import { Modal } from '../ui/Modal';
import { DonutChart, TrendChart } from '../charts/DashboardCharts';
import { isSlugFixtureMode } from '../../lib/runtimeMode';
import { ProfileIdentity } from './ProfileIdentity';
import { api } from '../../lib/apiClient';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';

type RangeKey = '30D' | 'Q2' | 'YTD' | '12M';
type ProjectFilter = 'All' | 'Enterprise' | 'Retainer' | 'Fixed-fee';

interface DashboardProject {
  id: string;
  name: string;
  client: string;
  type: Exclude<ProjectFilter, 'All'>;
  status: string;
  statusTone: 'success' | 'warning' | 'danger' | 'info';
  progress: number;
  lead: string;
  budget: string;
  startDate?: string;
  targetEndDate?: string;
  createdAt?: string;
}

interface TeamMember {
  name: string;
  role: string;
  workload: number;
  tasks: number;
  state: string;
  tone: 'success' | 'warning' | 'info';
}

const sampleProjects: DashboardProject[] = [
  { id: 'proj-001', name: 'Atlas Brand System', client: 'Atlas Group', type: 'Enterprise', status: 'On track', statusTone: 'success', progress: 78, lead: 'Fikri', budget: '$42,000', startDate: '2026-01-01', targetEndDate: '2026-06-30' },
  { id: 'proj-002', name: 'Meridian Commerce', client: 'Meridian Labs', type: 'Fixed-fee', status: 'At risk', statusTone: 'warning', progress: 61, lead: 'Sarah', budget: '$28,500', startDate: '2026-03-01', targetEndDate: '2026-08-31' },
  { id: 'proj-003', name: 'Nova Growth Retainer', client: 'Nova Ventures', type: 'Retainer', status: 'On track', statusTone: 'success', progress: 72, lead: 'Dimas', budget: '$18,000', startDate: '2026-06-01', targetEndDate: '2026-12-31' },
  { id: 'proj-004', name: 'Orbit Product Launch', client: 'Orbit Health', type: 'Enterprise', status: 'Delayed', statusTone: 'danger', progress: 44, lead: 'Raka', budget: '$36,800', startDate: '2025-11-01', targetEndDate: '2026-03-31' },
  { id: 'proj-005', name: 'Northstar Campaign', client: 'Northstar Capital', type: 'Retainer', status: 'In review', statusTone: 'info', progress: 86, lead: 'Nadia', budget: '$24,000', startDate: '2026-04-01', targetEndDate: '2026-12-31' },
];

const sampleTeam: TeamMember[] = [
  { name: 'Fikri Nurlete', role: 'Chief Creative Officer', workload: 82, tasks: 11, state: 'High load', tone: 'warning' },
  { name: 'Reynaldo Anakotta', role: 'Project Manager', workload: 74, tasks: 9, state: 'Balanced', tone: 'success' },
  { name: 'Akell Ahmed', role: 'HR Manager', workload: 68, tasks: 8, state: 'Balanced', tone: 'success' },
  { name: 'IBrahim', role: 'Financial FP&A', workload: 55, tasks: 6, state: 'Available', tone: 'info' },
];

const sampleRevenueByRange: Record<RangeKey, Array<{ label: string; primary: number; secondary: number; tertiary: number }>> = {
  '30D': [
    { label: 'W1', primary: 18800, secondary: 12400, tertiary: 6400 },
    { label: 'W2', primary: 20100, secondary: 12900, tertiary: 7200 },
    { label: 'W3', primary: 21400, secondary: 13200, tertiary: 8200 },
    { label: 'W4', primary: 22600, secondary: 13800, tertiary: 8800 },
  ],
  Q2: [
    { label: 'Apr', primary: 71800, secondary: 49200, tertiary: 22600 },
    { label: 'May', primary: 80200, secondary: 51400, tertiary: 28800 },
    { label: 'Jun', primary: 84500, secondary: 52200, tertiary: 32300 },
  ],
  YTD: [
    { label: 'Jan', primary: 61000, secondary: 42000, tertiary: 19000 },
    { label: 'Feb', primary: 68500, secondary: 44700, tertiary: 23800 },
    { label: 'Mar', primary: 74200, secondary: 46300, tertiary: 27900 },
    { label: 'Apr', primary: 71800, secondary: 49200, tertiary: 22600 },
    { label: 'May', primary: 80200, secondary: 51400, tertiary: 28800 },
    { label: 'Jun', primary: 84500, secondary: 52200, tertiary: 32300 },
  ],
  '12M': [
    { label: 'Jul', primary: 57400, secondary: 40100, tertiary: 17300 },
    { label: 'Aug', primary: 59200, secondary: 41100, tertiary: 18100 },
    { label: 'Sep', primary: 63800, secondary: 42600, tertiary: 21200 },
    { label: 'Oct', primary: 67100, secondary: 43500, tertiary: 23600 },
    { label: 'Nov', primary: 69600, secondary: 44100, tertiary: 25500 },
    { label: 'Dec', primary: 73200, secondary: 45200, tertiary: 28000 },
    { label: 'Jan', primary: 61000, secondary: 42000, tertiary: 19000 },
    { label: 'Feb', primary: 68500, secondary: 44700, tertiary: 23800 },
    { label: 'Mar', primary: 74200, secondary: 46300, tertiary: 27900 },
    { label: 'Apr', primary: 71800, secondary: 49200, tertiary: 22600 },
    { label: 'May', primary: 80200, secondary: 51400, tertiary: 28800 },
    { label: 'Jun', primary: 84500, secondary: 52200, tertiary: 32300 },
  ],
};

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

const formatMoney = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const formatLiveMoney = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'IDR', maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);


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

const PerformanceView: React.FC<{ snapshot: DashboardOperationalSnapshot }> = ({ snapshot }) => {
  const fixtureMode = isSlugFixtureMode();
  const previewMode = fixtureMode && !snapshot.tasks?.length && !snapshot.projects?.length && !snapshot.timeLogs?.length;
  const tasks = snapshot.tasks || [];
  const projectRows = snapshot.projects?.length ? snapshot.projects : previewMode ? sampleProjects : [];
  const activeProjects = projectRows.filter((project) => !isFinishedWork(project.status) && !isFinishedWork(project.health));
  const completedTasks = tasks.filter((task) => isFinishedWork(task.status)).length;
  const blockedTasks = tasks.filter((task) => String(task.status || '').toLowerCase().includes('block')).length;
  const today = localDateKey(new Date());
  const overdueTasks = tasks.filter((task) => {
    const due = dateKey(task.dueDate || task.deadline);
    return due && due < today && !isFinishedWork(task.status);
  }).length;
  const taskCount = snapshot.tasks !== null ? tasks.length : previewMode ? sampleTeam.reduce((sum, member) => sum + member.tasks, 0) : null;
  const completionValue = snapshot.tasks !== null && tasks.length ? Math.round(completedTasks / tasks.length * 100) + '%' : '—';
  const blockedValue = snapshot.tasks !== null ? String(blockedTasks) : '—';
  const overdueValue = snapshot.tasks !== null ? String(overdueTasks) : '—';
  const activeProjectValue = snapshot.projects !== null ? String(activeProjects.length) : previewMode ? String(sampleProjects.length) : '—';

  const current = new Date();
  const monday = new Date(current);
  const day = current.getDay();
  monday.setDate(current.getDate() + (day === 0 ? -6 : 1 - day));
  monday.setHours(0, 0, 0, 0);
  const mondayKey = localDateKey(monday);
  const memberTime = (snapshot.timeLogs || []).reduce((map: Map<string, number>, log: any) => {
    const date = dateKey(log.date || log.createdAt);
    if (!date || date < mondayKey) return map;
    const identity = String(log.user || log.userName || log.assignee || log.userId || 'Unassigned');
    map.set(identity, (map.get(identity) || 0) + (Number(log.durationMinutes ?? log.minutes ?? 0) || 0));
    return map;
  }, new Map<string, number>());
  const workload = Array.from(memberTime.entries()).map(([name, minutes]) => ({ name, minutes })).sort((a, b) => b.minutes - a.minutes).slice(0, 8);
  const deliveryBreakdown = buildProjectDeliveryBreakdown(activeProjects);
  const needsAttention = activeProjects.filter((project) => {
    const state = String(project.health || project.status || '').toLowerCase();
    const due = dateKey(project.targetEndDate || project.endDate || project.dueDate || project.deadline);
    return /risk|delay|blocked|hold|issue/.test(state) || (due && due < today);
  }).slice(0, 8);

  if (snapshot.loading) return <DashboardUnavailable title="Loading performance data" description="Project, task, and time records are being loaded from AMS." />;

  return (
    <div className="space-y-4">
      {previewMode && <p className="rounded-control border border-warning/25 bg-warning/5 px-3 py-2 text-[11px] text-warning">Preview data only. Metrics below must not be used as production reporting.</p>}
      <AdminMetricStrip metrics={[
        { id: 'performance-projects', label: 'Active projects', value: activeProjectValue, icon: <FolderKanban size={15} />, context: snapshot.projects !== null ? 'Project records' : previewMode ? 'Preview records' : 'Live source unavailable' },
        { id: 'performance-tasks', label: 'Tasks tracked', value: taskCount === null ? '—' : String(taskCount), icon: <CheckCircle2 size={15} />, context: snapshot.tasks !== null ? 'Task records' : previewMode ? 'Preview summary' : 'Live source unavailable' },
        { id: 'performance-overdue', label: 'Overdue tasks', value: overdueValue, icon: <CalendarDays size={15} />, toneClassName: 'text-warning', context: snapshot.tasks !== null ? 'Open tasks past due date' : 'Not available' },
        { id: 'performance-blocked', label: 'Blocked tasks', value: blockedValue, icon: <AlertTriangle size={15} />, toneClassName: 'text-danger', context: snapshot.tasks !== null ? 'Task status' : 'Not available' },
      ]} />

      <div className="grid gap-4 min-[1100px]:grid-cols-2">
        <AdminPanel title="Task completion" description="Completion and status totals derived from the task records." bodyClassName="p-4 sm:p-5">
          {snapshot.tasks === null ? <DashboardUnavailable title="Task status unavailable" description="The task service did not return data for the current role." /> : tasks.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted">No task records found for this workspace.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-3"><div><p className="text-3xl font-semibold tabular-nums text-fg">{completionValue}</p><p className="mt-1 text-xs text-muted">{completedTasks} of {tasks.length} tasks completed</p></div><AdminStatusBadge tone={completedTasks === tasks.length ? 'success' : 'info'}>{completedTasks === tasks.length ? 'Complete' : 'In progress'}</AdminStatusBadge></div>
              <div className="flex h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full bg-success" style={{ width: (completedTasks / tasks.length * 100) + '%' }} />
                <div className="h-full bg-warning" style={{ width: (blockedTasks / tasks.length * 100) + '%' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Completed</p><p className="mt-1 text-lg font-semibold tabular-nums text-fg">{completedTasks}</p></div>
                <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Remaining</p><p className="mt-1 text-lg font-semibold tabular-nums text-fg">{tasks.length - completedTasks}</p></div>
              </div>
            </div>
          )}
        </AdminPanel>
        <AdminPanel title="Projects needing attention" description="Projects with an explicit risk flag or a past target date." bodyClassName="p-4 sm:p-5">
          {snapshot.projects === null && !previewMode ? <DashboardUnavailable title="Project status unavailable" description="Project risk cannot be calculated because live project records were not returned." /> : needsAttention.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted">No project risk flags or overdue target dates were found.</p>
          ) : (
            <div className="space-y-2">
              {needsAttention.map((project: any) => {
                const overdue = Boolean(dateKey(project.targetEndDate || project.endDate || project.dueDate || project.deadline) && dateKey(project.targetEndDate || project.endDate || project.dueDate || project.deadline) < today);
                return <div key={String(project.id || project.slug || project.name)} className="flex items-center justify-between gap-3 rounded-control border border-line bg-bg p-3"><div className="min-w-0"><p className="truncate text-xs font-medium text-fg">{project.name || project.title || 'Untitled project'}</p><p className="mt-1 truncate text-[10px] text-muted">{project.clientName || project.client || 'Client not linked'} · {project.status || project.health || 'Status not set'}</p></div><AdminStatusBadge tone={overdue ? 'danger' : 'warning'}>{overdue ? 'Overdue' : 'At risk'}</AdminStatusBadge></div>;
              })}
            </div>
          )}
        </AdminPanel>
      </div>

      <AdminPanel title="Tracked time this week" description="Hours recorded since Monday. This is logged time, not a forecast of remaining capacity." bodyClassName="p-4 sm:p-5">
        {snapshot.timeLogs === null ? <DashboardUnavailable title="Time records unavailable" description="The time tracking service did not return records for this role." /> : workload.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">No time entries recorded since {mondayKey}.</p>
        ) : (
          <div className="space-y-3">
            {workload.map((member) => <div key={member.name} className="flex items-center justify-between gap-3"><span className="min-w-0 truncate text-xs font-medium text-fg">{member.name}</span><span className="shrink-0 text-xs tabular-nums text-muted">{Math.floor(member.minutes / 60)}h {member.minutes % 60}m</span></div>)}
          </div>
        )}
      </AdminPanel>
      <div className="flex justify-end"><Link to="/admin/tasks" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">Open Tasks <ArrowUpRight size={13} /></Link></div>
    </div>
  );
};

const AnalyticsView: React.FC<{ snapshot: DashboardOperationalSnapshot; range: RangeKey }> = ({ snapshot, range }) => {
  const fixtureMode = isSlugFixtureMode();
  const previewFinancialData = fixtureMode && !snapshot.invoices?.length && !snapshot.expenses?.length;
  const currency = 'IDR';
  const invoiceRows = snapshot.invoices || [];
  const expenseRows = snapshot.expenses || [];
  const trend = snapshot.invoices !== null && snapshot.expenses !== null
    ? buildFinancialTrend(range, invoiceRows.filter((row) => String(row.currency || 'IDR').toUpperCase() === currency), expenseRows.filter((row) => String(row.currency || 'IDR').toUpperCase() === currency))
    : previewFinancialData ? sampleRevenueByRange[range] : [];
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
  const previewInvoiced = previewFinancialData ? trend.reduce((sum: number, point: any) => sum + Number(point.primary || 0), 0) : null;
  const previewExpenses = previewFinancialData ? trend.reduce((sum: number, point: any) => sum + Number(point.secondary || 0), 0) : null;

  return (
    <div className="space-y-4">
      {previewFinancialData && <p className="rounded-control border border-warning/25 bg-warning/5 px-3 py-2 text-[11px] text-warning">Preview data only. No production financial records were used for these sample trends.</p>}
      <AdminMetricStrip metrics={[
        { id: 'analytics-invoiced', label: 'Invoices issued', value: financialDataAvailable ? formatLiveMoney(totalInvoiced, currency) : previewFinancialData ? formatMoney(previewInvoiced || 0) : '—', icon: <FileText size={15} />, context: financialDataAvailable ? 'Issued invoices · IDR' : previewFinancialData ? 'Sample data' : 'Live source unavailable' },
        { id: 'analytics-expenses', label: 'Recorded expenses', value: financialDataAvailable ? formatLiveMoney(recordedExpenses, currency) : previewFinancialData ? formatMoney(previewExpenses || 0) : '—', icon: <CircleDollarSign size={15} />, context: financialDataAvailable ? 'Expense records · IDR' : previewFinancialData ? 'Sample data' : 'Live source unavailable' },
        { id: 'analytics-receivables', label: 'Outstanding receivables', value: snapshot.invoices !== null ? formatLiveMoney(receivables, currency) : '—', icon: <ReceiptText size={15} />, context: snapshot.invoices !== null ? 'Open, non-draft invoices · IDR' : 'Live source unavailable' },
        { id: 'analytics-projects', label: 'Active projects', value: snapshot.projects !== null ? String(activeProjects || 0) : fixtureMode ? String(sampleProjects.length) : '—', icon: <FolderKanban size={15} />, context: snapshot.projects !== null ? 'Current project records' : fixtureMode ? 'Preview records' : 'Live source unavailable' }
      ]} />

      <AdminPanel title="Invoice and expense trend" description="Invoice totals are grouped by issue date; expenses are grouped by recorded date. Their difference is not a posted profit figure." bodyClassName="p-4 sm:p-5">
        {trend.length >= 2 ? (
          <TrendChart data={trend} primaryLabel="Invoices issued" secondaryLabel="Recorded expenses" tertiaryLabel="Difference" primaryFormat={previewFinancialData ? formatMoney : (value) => formatLiveMoney(value, currency)} ariaLabel="Issued invoices and recorded expenses by period." />
        ) : (
          <DashboardUnavailable title="Financial trend unavailable" description="The selected sources did not return a usable period series. Values are not estimated." />
        )}
      </AdminPanel>

      <AdminPanel title="Project status" description="Current project status values from the project register." bodyClassName="p-4 sm:p-5">
        {snapshot.projects === null && !fixtureMode ? <DashboardUnavailable title="Project records unavailable" description="Project status analytics need access to the live project register." /> : (
          <div className="space-y-3">
            {(snapshot.projects?.length ? snapshot.projects : fixtureMode ? sampleProjects : []).reduce((groups: Array<{ status: string; count: number }>, project: any) => {
              const status = String(project.status || project.health || 'Not set');
              const existing = groups.find((item) => item.status === status);
              if (existing) existing.count += 1; else groups.push({ status, count: 1 });
              return groups;
            }, []).sort((a, b) => b.count - a.count).map((group) => <div key={group.status} className="flex items-center justify-between gap-3 rounded-control border border-line bg-bg px-3 py-2.5"><span className="text-xs text-fg">{group.status}</span><span className="text-xs font-semibold tabular-nums text-fg">{group.count}</span></div>)}
          </div>
        )}
      </AdminPanel>
    </div>
  );
};

export const GlobalExecutiveDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = (searchParams.get('view') || 'overview') as 'overview' | 'performance' | 'analytics';
  const fixtureMode = isSlugFixtureMode();
  const { matchesInterval, value: reportPeriodValue, enabled: reportPeriodEnabled } = useReportingPeriod();
  const [range, setRange] = useState<RangeKey>('Q2');
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('All');
  const [projectActionId, setProjectActionId] = useState<string | null>(null);
  const [projectActionPosition, setProjectActionPosition] = useState<{ top: number; left: number } | null>(null);
  const [projectDetails, setProjectDetails] = useState<DashboardProject | null>(null);
  const [dashboardProjectPage, setDashboardProjectPage] = useState(1);
  const [dashboardProjectPageSize, setDashboardProjectPageSize] = useState(6);
  const [dashboardOverview, setDashboardOverview] = useState<{ metrics?: any; financials?: any; projects?: any[]; source: 'server' | 'ab'; loading: boolean }>({ source: 'ab', loading: true });
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
        const projects = Array.isArray(response.data?.projects) ? response.data.projects : [];
        setDashboardOverview({
          metrics: response.data?.metrics,
          financials: response.data?.financials,
          projects,
          source: projects.length > 0 || Boolean(response.data?.metrics) ? 'server' : 'ab',
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


  const dashboardProjects = useMemo<DashboardProject[]>(() => {
    const projectSource = operationalSnapshot.projects ?? dashboardOverview.projects;
    const serverProjects = Array.isArray(projectSource)
      ? projectSource.map((project: any, index: number) => {
          const rawType = String(project.type || project.projectType || project.billingType || 'Fixed-fee').toLowerCase();
          const type: Exclude<ProjectFilter, 'All'> = rawType.includes('retainer')
            ? 'Retainer'
            : rawType.includes('enterprise')
              ? 'Enterprise'
              : 'Fixed-fee';
          const health = String(project.health || project.status || '').toLowerCase();
          const statusTone: DashboardProject['statusTone'] =
            health.includes('delay') || health.includes('blocked') ? 'danger'
              : health.includes('risk') ? 'warning'
                : health.includes('review') ? 'info'
                  : 'success';
          return {
            id: String(project.id || project.slug || 'server-project-' + index),
            name: String(project.name || project.title || project.projectName || 'Untitled project'),
            client: String(project.clientName || project.client || 'Unassigned client'),
            type,
            status: String(project.status || project.health || 'Active'),
            statusTone,
            progress: Math.max(0, Math.min(100, Number(project.progress ?? project.progressPercent ?? 0) || 0)),
            lead: String(project.teamLead || project.ownerName || project.lead || 'Unassigned'),
            budget: formatLiveMoney(
              Number(project.budget ?? project.totalBudget ?? 0) || 0,
              String(dashboardOverview.financials?.currency || dashboardOverview.metrics?.currency || 'IDR').toUpperCase()
            ),
            startDate: String(project.startDate || project.start || ''),
            targetEndDate: String(project.targetEndDate || project.endDate || project.dueDate || ''),
            createdAt: String(project.createdAt || project.updatedAt || '')
          };
        })
      : [];
    return serverProjects.length ? serverProjects : (fixtureMode ? sampleProjects : []);
  }, [dashboardOverview.projects, operationalSnapshot.projects, fixtureMode]);

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

  const deliveryProjects = operationalSnapshot.projects?.length ? operationalSnapshot.projects : fixtureMode ? sampleProjects : operationalSnapshot.projects;
  const deliveryBreakdown = useMemo(
    () => deliveryProjects === null ? [] : buildProjectDeliveryBreakdown(deliveryProjects),
    [deliveryProjects]
  );
  const totalDelivery = deliveryBreakdown.reduce((total, item) => total + Math.max(0, item.value), 0);
  const onScheduleValue = deliveryBreakdown.find((item) => item.label === 'No risk flag')?.value ?? 0;
  const onSchedulePercent = totalDelivery > 0 ? Math.round((Math.max(0, onScheduleValue) / totalDelivery) * 100) : 0;
  const financeCurrency = String(dashboardOverview.financials?.currency || dashboardOverview.metrics?.currency || 'IDR').toUpperCase();
  const previewFinancialTrend = fixtureMode && !operationalSnapshot.invoices?.length && !operationalSnapshot.expenses?.length;
  const financeSourcesAvailable = operationalSnapshot.invoices !== null && operationalSnapshot.expenses !== null;
  const revenueData = useMemo(() => {
    if (previewFinancialTrend) return sampleRevenueByRange[range];
    if (!financeSourcesAvailable) return [];
    const invoices = (operationalSnapshot.invoices || []).filter((invoice: any) => String(invoice.currency || 'IDR').toUpperCase() === financeCurrency);
    const expenses = (operationalSnapshot.expenses || []).filter((expense: any) => String(expense.currency || 'IDR').toUpperCase() === financeCurrency);
    return buildFinancialTrend(range, invoices, expenses);
  }, [previewFinancialTrend, financeSourcesAvailable, operationalSnapshot.invoices, operationalSnapshot.expenses, financeCurrency, range]);

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
  const activeProjectsMetric = dashboardOverview.metrics?.activeProjects ?? (operationalSnapshot.projects !== null ? activeProjectRows.length : fixtureMode ? 12 : null);
  const overdueTasksMetric = dashboardOverview.metrics?.overdueTasks ?? liveOverdueTaskCount ?? (fixtureMode ? 3 : null);
  const projectsAtRiskMetric = dashboardOverview.metrics?.projectsAtRisk ?? liveRiskProjectCount ?? (fixtureMode ? 3 : null);
  const cashCollectedMetric = dashboardOverview.financials?.cashCollected ?? dashboardOverview.financials?.revenueThisMonth ?? liveCashCollected;
  const outstandingMetric = dashboardOverview.financials?.outstandingReceivables ?? liveOutstanding;
  const cashDifferenceMetric = dashboardOverview.financials?.netOperatingProfit ?? liveCashDifference;

  return (
    <AdminPageShell featureSlug="dashboard-module" className="ams-dashboard">
      <AdminModuleHeader slug="dashboard-header"
        className="mb-0"
        title="Agency overview"
        description="Real-time metrics, project pacing, and financial health for the agency."
        actions={(
          <>
            {fixtureMode && (
              <div className="space-y-1">
                <span className="block text-[10px] text-muted">Preview chart range</span>
                <div className="flex w-full items-center gap-0.5 rounded-control bg-bg p-0.5 sm:w-auto">
                  {(['30D', 'Q2', 'YTD', '12M'] as RangeKey[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={range === item}
                      onClick={() => setRange(item)}
                      className={['rounded-chip px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', range === item ? 'bg-line font-medium text-fg' : 'text-muted hover:text-fg'].join(' ')}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Link
              to="/admin/projects"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-medium sm:min-h-9 sm:w-auto text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Plus size={14} />
              New project
            </Link>
          </>
        )}
      />

      <div className="min-[900px]:hidden min-w-0">
        <AdminSectionTabs
          ariaLabel="Dashboard view"
          activeKey={view}
          items={[
            { key: 'overview', label: 'Overview', to: '/admin/dashboard' },
            { key: 'performance', label: 'Performance', to: '/admin/dashboard?view=performance' },
            { key: 'analytics', label: 'Analytics', to: '/admin/dashboard?view=analytics' },
          ]}
        />
      </div>

      {view === 'overview' ? (
        <>
      <section data-ams-feature-slug="dashboard-overview" data-ams-slug="dashboard-overview" className="mb-5 grid gap-3 min-[1100px]:grid-cols-12" aria-label="Executive overview controls">
        <div className="min-[1100px]:col-span-9">
          <AdminMetricStrip
            className="grid-cols-1 sm:grid-cols-2 min-[760px]:grid-cols-4"
            metrics={[
              {
                id: 'active-projects', label: 'Active projects',
                value: activeProjectsMetric != null ? String(activeProjectsMetric) : '—',
                context: dashboardOverview.metrics?.activeProjects != null || operationalSnapshot.projects !== null ? 'Live project records' : fixtureMode ? 'Preview data' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live data unavailable',
                sparkline: fixtureMode && operationalSnapshot.projects === null ? [8, 9, 10, Number(activeProjectsMetric ?? 12)] : undefined,
                icon: <FolderKanban size={15} />, toneClassName: 'text-success', slug: 'dashboard-active-projects'
              },
              {
                id: 'tasks-due', label: 'Overdue tasks',
                value: overdueTasksMetric != null ? String(overdueTasksMetric) : '—',
                context: dashboardOverview.metrics?.overdueTasks != null || operationalSnapshot.tasks !== null ? 'Open tasks past due date' : fixtureMode ? 'Preview data' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live data unavailable',
                sparkline: fixtureMode && operationalSnapshot.tasks === null ? [6, 5, 4, Number(overdueTasksMetric ?? 3)] : undefined,
                icon: <CalendarDays size={15} />, toneClassName: 'text-info', slug: 'dashboard-tasks-overdue'
              },
              {
                id: 'overdue', label: 'Projects at risk',
                value: projectsAtRiskMetric != null ? String(projectsAtRiskMetric) : '—',
                change: projectsAtRiskMetric != null || fixtureMode ? 'Requires attention' : undefined,
                changeToneClassName: 'text-danger',
                sparkline: fixtureMode && operationalSnapshot.projects === null ? [6, 5, 4, Number(projectsAtRiskMetric ?? 3)] : undefined,
                icon: <AlertTriangle size={15} />, toneClassName: 'text-danger', slug: 'dashboard-projects-risk'
              },
              {
                id: 'revenue', label: 'Cash collected this month',
                value: cashCollectedMetric != null ? formatLiveMoney(Number(cashCollectedMetric), financeCurrency) : fixtureMode ? formatLiveMoney(84500, financeCurrency) : '—',
                context: dashboardOverview.financials?.cashCollected != null || dashboardOverview.financials?.revenueThisMonth != null || liveCashCollected !== null ? 'Recorded invoice payments' : fixtureMode ? 'Preview data' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live data unavailable',
                sparkline: fixtureMode && liveCashCollected === null ? sampleRevenueByRange[range].map((point) => point.primary) : undefined,
                icon: <CircleDollarSign size={15} />, toneClassName: 'text-success', slug: 'dashboard-revenue'
              },
              {
                id: 'outstanding', label: 'Outstanding invoices',
                value: outstandingMetric != null ? formatLiveMoney(Number(outstandingMetric), financeCurrency) : fixtureMode ? formatLiveMoney(32400, financeCurrency) : '—',
                context: dashboardOverview.financials?.outstandingReceivables != null || liveOutstanding !== null ? 'Open invoice balances' : fixtureMode ? 'Preview data' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live data unavailable',
                sparkline: fixtureMode && liveOutstanding === null ? [22, 25, 28, 32.4] : undefined,
                icon: <ReceiptText size={15} />, toneClassName: 'text-warning', slug: 'dashboard-outstanding'
              },
              {
                id: 'utilization', label: 'Team utilization',
                value: dashboardOverview.metrics?.teamUtilization != null ? String(dashboardOverview.metrics.teamUtilization) + '%' : fixtureMode ? '78%' : '—',
                context: dashboardOverview.metrics?.teamUtilization != null ? 'Live data' : fixtureMode ? 'Preview data' : dashboardOverview.loading ? 'Loading live data' : 'Live data unavailable',
                sparkline: fixtureMode ? [66, 70, 73, 78] : undefined,
                icon: <Users size={15} />, toneClassName: 'text-warning', slug: 'dashboard-utilization'
              },
              {
                id: 'avg-project-value', label: 'Avg. active project budget',
                value: averageActiveBudget != null ? formatLiveMoney(averageActiveBudget, financeCurrency) : fixtureMode ? '$29.8k' : '—',
                context: averageActiveBudget != null ? 'Average of active project budgets' : fixtureMode ? 'Preview data' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live project budgets unavailable',
                sparkline: fixtureMode && averageActiveBudget === null ? [24, 25.5, 28, 29.8] : undefined,
                icon: <FolderKanban size={15} />, toneClassName: 'text-fg', slug: 'dashboard-avg-project-value'
              },
              {
                id: 'net-operating-profit', label: 'Cash surplus / deficit',
                value: cashDifferenceMetric != null ? formatLiveMoney(Number(cashDifferenceMetric), financeCurrency) : fixtureMode ? formatLiveMoney(32300, financeCurrency) : '—',
                context: dashboardOverview.financials?.netOperatingProfit != null || liveCashDifference !== null ? 'Cash collected less recorded expenses; not posted profit' : fixtureMode ? 'Preview data' : dashboardOverview.loading || operationalSnapshot.loading ? 'Loading live data' : 'Live financial data unavailable',
                sparkline: fixtureMode && liveCashDifference === null ? [19600, 22600, 28800, 32300] : undefined,
                icon: <CircleDollarSign size={15} />,
                toneClassName: dashboardOverview.financials?.netOperatingProfit != null
                  ? Number(dashboardOverview.financials.netOperatingProfit) >= 0 ? 'text-success' : 'text-danger'
                  : fixtureMode ? 'text-success' : 'text-fg',
                slug: 'dashboard-net-operating-profit'
              }
            ]}
          />
        </div>
        <AdminPanel title="Quick actions" description="Jump directly into the most common agency workflows." bodyClassName="p-3" className="min-[1100px]:col-span-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'New project', icon: <Plus size={14} />, href: '/admin/projects' },
              { label: 'Review tasks', icon: <CheckCircle2 size={14} />, href: '/admin/tasks' },
              { label: 'Log time', icon: <Clock3 size={14} />, href: '/admin/time-logs' },
              { label: 'View invoices', icon: <ReceiptText size={14} />, href: '/admin/invoicing' },
              { label: 'View clients', icon: <Users size={14} />, href: '/admin/clients' },
              { label: 'View documents', icon: <FileText size={14} />, href: '/admin/documents' }
            ].map((action) => (
              <Link key={action.label} to={action.href} className="flex min-h-10 items-center gap-2 rounded-control border border-line bg-bg px-3 text-[11px] font-medium text-fg transition-colors hover:border-accent/30 hover:bg-panel-hover hover:text-accent-text">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-muted">{action.icon}</span>
                <span className="truncate">{action.label}</span>
                <ArrowUpRight size={12} className="ml-auto shrink-0 text-muted" />
              </Link>
            ))}
          </div>
        </AdminPanel>
      </section>

      <div className="grid gap-3 min-[1100px]:grid-cols-12">
        <AdminPanel className="min-[1100px]:col-span-8" bodyClassName="p-4 sm:p-5" title="Invoices vs expenses" description="Issued invoice value and recorded expenses by record date. The difference is not a posted profit figure." actions={(
          <div className="hidden items-center gap-3 text-[11px] text-muted sm:flex">
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-accent" /> Invoices issued</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-info" /> Expenses recorded</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-success" /> Difference</span>
          </div>
        )}>
          {revenueData.length >= 2 ? (
            <TrendChart data={revenueData} primaryLabel="Invoices issued" secondaryLabel="Expenses recorded" tertiaryLabel="Difference" primaryFormat={previewFinancialTrend ? formatMoney : (value) => formatLiveMoney(value, financeCurrency)} ariaLabel={'Issued invoices, recorded expenses, and difference for ' + range + '.'} />
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-control border border-line bg-bg px-5 py-8 text-center" role="status">
              <CircleDollarSign size={20} className="text-muted" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold text-fg">Revenue history is unavailable</p>
              <p className="mt-1 max-w-sm text-[11px] leading-5 text-muted">The dashboard service has not provided a live historical revenue series for this period.</p>
            </div>
          )}
        </AdminPanel>

        <AdminPanel className="min-[1100px]:col-span-4" bodyClassName="p-4 sm:p-5" title="Delivery & pacing" description="Project delivery distribution across the current portfolio.">
          {deliveryProjects !== null ? (
          <div className="space-y-4">
            {fixtureMode && !operationalSnapshot.projects?.length && <p className="text-[10px] text-warning">Preview data only. Live project records were not returned.</p>}
            <div className="rounded-control border border-line bg-bg/45 p-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">No risk flag</div>
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
                      <span className={['shrink-0 rounded-badge border px-1.5 py-0.5 text-[9px] font-medium', toneClasses[item.tone]].join(' ')}>
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
              <p className="mt-3 text-sm font-semibold text-fg">{dashboardOverview.loading ? 'Loading live projects…' : 'No live project data'}</p>
              <p className="mt-1 max-w-md text-xs leading-5 text-muted">{dashboardOverview.loading ? 'Waiting for the dashboard service to return project records.' : 'The dashboard service has not returned project records yet. Open Projects to review the live workspace.'}</p>
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
                    <span className="tabular-nums">{project.progress}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className={['h-full rounded-full', progressClasses[project.statusTone === 'danger' ? 'danger' : project.statusTone === 'warning' ? 'warning' : 'success']].join(' ')}
                      style={{ width: project.progress + '%' }}
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

          <div className="hidden min-[900px]:block overflow-x-auto custom-scrollbar">
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
                    <td className="px-3 py-3"><div className="flex min-w-[150px] items-center gap-2"><div className="h-1.5 min-w-20 flex-1 overflow-hidden rounded-sm bg-line"><div className={['h-full rounded-sm', progressClasses[project.statusTone === 'danger' ? 'danger' : project.statusTone === 'warning' ? 'warning' : 'success']].join(' ')} style={{ width: project.progress + '%' }} /></div><span className="w-8 text-right text-[11px] tabular-nums text-muted">{project.progress}%</span></div></td>
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
          description="Current workload distribution across the team."
          actions={fixtureMode ? <span className="rounded-badge border border-line bg-bg px-2 py-1 text-[11px] text-muted">4 members</span> : undefined}
        >
          {fixtureMode ? (
            <div className="space-y-4">
              {sampleTeam.map((member) => (
                <div key={member.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-xs font-semibold text-fg">{member.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-fg">{member.name}</div>
                        <div className="mt-0.5 truncate text-[10px] text-muted">{member.role}</div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-medium tabular-nums text-fg">{member.workload}%</span>
                      <span className="mt-0.5 block text-[10px] text-muted">{member.tasks} tasks · {member.state}</span>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-sm bg-line">
                    <div className={['h-full rounded-sm', progressClasses[member.tone]].join(' ')} style={{ width: member.workload + '%' }} />
                  </div>
                </div>
              ))}
              <div className="border-t border-line pt-4">
                <Link to="/admin/time-logs" className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-accent-text">View team schedule <ArrowUpRight size={13} /></Link>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[180px] flex-col items-center justify-center px-3 py-8 text-center" role="status">
              <Users size={20} className="text-muted" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold text-fg">Team workload data is unavailable</p>
              <p className="mt-1 max-w-sm text-[11px] leading-5 text-muted">Live assignments and utilization are not available from the dashboard service yet.</p>
            </div>
          )}
        </AdminPanel>
      </div>

      {fixtureMode && (
      <section className="mt-3 grid gap-3 sm:grid-cols-3" aria-label="Dashboard supporting signals">
        <article className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2 text-xs font-medium text-fg"><CheckCircle2 size={15} className="text-success" /> Delivery health</div><span className="rounded-badge border border-success/25 bg-success/10 px-2 py-1 text-[10px] font-medium text-success">67% on track</span></div>
          <div className="mt-4 flex items-end justify-between gap-4"><div><div className="text-xl font-semibold tabular-nums text-fg">8 / 12</div><div className="mt-1 text-[10px] text-muted">projects on schedule</div></div><div className="text-right"><div className="text-xs font-semibold text-fg">3 at risk</div><div className="mt-1 text-[10px] text-danger">1 overdue</div></div></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-success" style={{ width: '67%' }} /></div>
        </article>
        <article className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2 text-xs font-medium text-fg"><Clock3 size={15} className="text-warning" /> Priority work</div><span className="rounded-badge border border-warning/25 bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning">6 high</span></div>
          <div className="mt-4 flex items-end justify-between gap-4"><div><div className="text-xl font-semibold tabular-nums text-fg">18</div><div className="mt-1 text-[10px] text-muted">tasks due this week</div></div><div className="text-right"><div className="text-xs font-semibold text-fg">3 overdue</div><div className="mt-1 text-[10px] text-danger">1 blocked</div></div></div>
          <div className="mt-3 flex gap-1"><span className="h-1.5 flex-[3] rounded-full bg-danger" /><span className="h-1.5 flex-[3] rounded-full bg-warning" /><span className="h-1.5 flex-[6] rounded-full bg-info" /><span className="h-1.5 flex-[6] rounded-full bg-line" /></div>
        </article>
        <article className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2 text-xs font-medium text-fg"><ReceiptText size={15} className="text-warning" /> Invoice follow-up</div><span className="rounded-badge border border-warning/25 bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning">Action needed</span></div>
          <div className="mt-4 flex items-end justify-between gap-4"><div><div className="text-xl font-semibold tabular-nums text-fg">$8.7k</div><div className="mt-1 text-[10px] text-muted">past-due balance</div></div><div className="text-right"><div className="text-xs font-semibold text-fg">$32.4k</div><div className="mt-1 text-[10px] text-muted">total outstanding</div></div></div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-muted"><span>27% of outstanding is overdue</span><span className="font-medium text-warning">Follow up</span></div>
        </article>
      </section>
      )}

        </>
      ) : view === 'performance' ? (
        <PerformanceView snapshot={operationalSnapshot} />
      ) : (
        <AnalyticsView snapshot={operationalSnapshot} range={range} />
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
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Status</div>
                <div className="mt-1 text-sm font-semibold text-fg">{projectDetails.status}</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Progress</div>
                <div className="mt-1 text-sm font-semibold text-fg">{projectDetails.progress}%</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Project lead</div>
                <div className="mt-1 text-sm font-semibold text-fg">{projectDetails.lead}</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Budget</div>
                <div className="mt-1 text-sm font-semibold text-fg">{projectDetails.budget}</div>
              </div>
            </div>
            <div className="rounded-control border border-line bg-bg p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Delivery pacing</span>
                <span className="text-xs font-semibold text-fg">{projectDetails.progress}% complete</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-sm bg-line">
                <div
                  className={['h-full rounded-sm', progressClasses[projectDetails.statusTone === 'danger' ? 'danger' : projectDetails.statusTone === 'warning' ? 'warning' : 'success']].join(' ')}
                  style={{ width: projectDetails.progress + '%' }}
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