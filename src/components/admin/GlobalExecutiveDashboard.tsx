import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Code2,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  FileText,
  Eye,
  RefreshCw,
  Palette,
  Plus,
  ReceiptText,
  Users,
} from 'lucide-react';
import { AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminPanel, AdminStatusBadge } from './AdminModulePrimitives';
import { DonutChart, TrendChart, type DonutPoint, type TrendPoint } from '../charts/DashboardCharts';
import { api } from '../../lib/apiClient';
import { getAdminSession, hasAdminPermission } from '../../lib/adminAuth';
import { canAccessAmsRoute, getAmsRole } from '../../lib/amsNavigationAccess';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';
import { getReportingPeriodRange, type ReportingPeriodMode } from '../../lib/reportingPeriods';
import { getInvoiceDate, getInvoiceOutstanding, getPaymentRows, isIssuedInvoice } from '../../lib/financeWorkbook';
import { isInboxActionable, isInboxHighPriority, isInboxUnassigned } from '../../lib/inboxTriage';
import { normalizeContactSubmission, type ContactSubmission } from '../../lib/submissions';

const DASHBOARD_WORKSPACE_VIEWS = ['overview', 'performance', 'analytics'] as const;
type DashboardWorkspaceView = (typeof DASHBOARD_WORKSPACE_VIEWS)[number];
type DashboardTone = 'success' | 'warning' | 'danger' | 'info';
type DashboardTaskFilter = 'action' | 'review' | 'overdue' | 'blocked' | 'unassigned';

type DashboardWorkTask = {
  id: string;
  title: string;
  projectId: string;
  projectSlug: string;
  projectName: string;
  clientId: string;
  clientName: string;
  serviceCategory: string;
  serviceLine: 'creative' | 'technology' | 'other';
  status: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate: string;
  assigneeLabel: string;
  assigned: boolean;
  blocked: boolean;
};

type DashboardCommitment = {
  id: string;
  projectId: string;
  projectSlug: string;
  projectHref: string | null;
  projectName: string;
  clientId: string;
  clientName: string;
  serviceCategory: string;
  serviceLine: 'creative' | 'technology' | 'other';
  title: string;
  kind: 'Milestone' | 'Project deadline';
  dueDate: string;
  owner: string;
};

type DashboardClientDeliveryFocus = {
  key: string;
  name: string;
  projectCount: number;
  projects: Array<{ name: string; href: string | null }>;
  clientId: string | null;
  clientIdentityLabel: string;
  clientRecordAvailable: boolean;
  serviceLines: string[];
  openTaskCount: number | null;
  reviewTaskCount: number | null;
  blockedTaskCount: number | null;
  unassignedTaskCount: number | null;
  overdueTaskCount: number | null;
  overdueCommitmentCount: number;
  nextCommitmentDate: string | null;
};

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


const toneClasses: Record<DashboardTone, string> = {
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
  clients: any[] | null;
  inboxLeads: ContactSubmission[] | null;
  tasks: any[] | null;
  timeLogs: any[] | null;
  invoices: any[] | null;
  expenses: any[] | null;
};

const isFinishedWork = (value: unknown) => /^(done|complete|completed|closed|archived)$/i.test(String(value || '').trim());

const isValidDashboardDate = (value: unknown) => {
  const key = dateKey(value);
  if (!key) return false;
  const parsed = new Date(key + 'T00:00:00');
  return Number.isFinite(parsed.getTime()) && localDateKey(parsed) === key;
};

const shiftDashboardDate = (value: string, days: number) => {
  if (!isValidDashboardDate(value)) return '';
  const parsed = new Date(value + 'T00:00:00');
  parsed.setDate(parsed.getDate() + days);
  return localDateKey(parsed);
};

const formatDashboardDate = (value: string) => {
  if (!isValidDashboardDate(value)) return 'Date not set';
  return new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDashboardServiceLine = (project: any): DashboardWorkTask['serviceLine'] => {
  const category = String(project?.serviceCategory || project?.service || '').trim().toLowerCase();
  const stack = Array.isArray(project?.techStack) ? project.techStack.filter(Boolean) : [];
  if (/creative|content|video|motion|design|brand|graphic|social|campaign|marketing|photograph|animation|ui\/?ux|ux\/?ui/.test(category)) return 'creative';
  if (/web|website|development|software|application|\bit\b|support|data|e-commerce|ecommerce|integration|automation|technical|hosting|cms|api/.test(category)) return 'technology';
  if (!category && stack.length > 0) return 'technology';
  return 'other';
};

const getDashboardProjectHref = (project: any): string | null => {
  const slug = String(project?.slug || '').trim();
  const id = String(project?.id || '').trim();
  if (slug) return '/admin/projects?projects=sprint&project=' + encodeURIComponent(slug);
  if (id) return '/admin/projects?projects=all&project=' + encodeURIComponent(id);
  return null;
};

const resolveDashboardClientName = (clientId: unknown, clientDirectoryById: Map<string, any>, ...fallbackNames: unknown[]) => {
  const id = String(clientId || '').trim();
  const client = id ? clientDirectoryById.get(id) : null;
  const canonicalName = client?.company || client?.companyName || client?.company_name || client?.name;
  const fallbackName = fallbackNames.find((value) => String(value || '').trim());
  return String(canonicalName || fallbackName || '').trim();
};

const isDashboardTaskBlocked = (task: any) =>
  Boolean(task?.blocked) ||
  (Array.isArray(task?.tags) && task.tags.some((tag: unknown) =>
    ['blocked', 'blocker', 'blocked-by', 'waiting'].includes(String(tag).trim().toLowerCase())
  ));

const dashboardTaskPriorityWeight: Record<DashboardWorkTask['priority'], number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

const dashboardTaskPriorityTone = (priority: DashboardWorkTask['priority']): DashboardTone =>
  priority === 'urgent' ? 'danger' : priority === 'high' ? 'warning' : priority === 'medium' ? 'info' : 'success';

const dashboardTaskStatusLabel = (status: string) => {
  if (status === 'todo') return 'To do';
  if (status === 'in_progress' || status === 'in-progress') return 'In progress';
  if (status === 'review' || status === 'in_review') return 'Review';
  if (isFinishedWork(status)) return 'Completed';
  return status.replace(/[_-]+/g, ' ').replace(/^./, (letter) => letter.toUpperCase()) || 'Status unavailable';
};

const dashboardTaskIsOpen = (task: DashboardWorkTask) => !isFinishedWork(task.status);

const dashboardTaskIsOverdue = (task: DashboardWorkTask, today: string) =>
  dashboardTaskIsOpen(task) && Boolean(task.dueDate && task.dueDate < today);

const dashboardTaskIsDueSoon = (task: DashboardWorkTask, today: string, throughDate: string) =>
  dashboardTaskIsOpen(task) && Boolean(task.dueDate && task.dueDate >= today && task.dueDate <= throughDate);

const dashboardTaskNeedsAction = (task: DashboardWorkTask, today: string, throughDate: string) =>
  dashboardTaskIsOverdue(task, today) ||
  task.blocked ||
  task.priority === 'urgent' ||
  task.priority === 'high' ||
  task.status === 'review' ||
  !task.assigned ||
  dashboardTaskIsDueSoon(task, today, throughDate);


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

type InquiryTrendSpec = { label: string; start: string; end: string };

const formatInquiryTrendBucketLabel = (start: string, endExclusive: string) => {
  const startDate = new Date(start + 'T00:00:00');
  const lastDate = new Date(endExclusive + 'T00:00:00');
  lastDate.setDate(lastDate.getDate() - 1);
  const formatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' });
  return formatter.format(startDate) + '–' + formatter.format(lastDate);
};

const buildInquiryVolumeTrend = (
  inquiries: ContactSubmission[],
  mode: ReportingPeriodMode,
  value: string,
  periodEnabled: boolean,
  periodLabel: string
): { data: TrendPoint[]; scopeLabel: string } => {
  const period = periodEnabled ? getReportingPeriodRange(value, mode) : null;
  const specs: InquiryTrendSpec[] = [];
  if (period) {
    const start = new Date(period.startDate + 'T00:00:00');
    const endExclusive = new Date(period.endDate + 'T00:00:00');
    endExclusive.setDate(endExclusive.getDate() + 1);
    if (mode === 'month') {
      let cursor = start;
      while (cursor < endExclusive) {
        const next = new Date(cursor);
        next.setDate(next.getDate() + 7);
        const end = next < endExclusive ? next : endExclusive;
        const startKey = localDateKey(cursor);
        const endKey = localDateKey(end);
        specs.push({ label: formatInquiryTrendBucketLabel(startKey, endKey), start: startKey, end: endKey });
        cursor = end;
      }
    } else {
      let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cursor < endExclusive) {
        const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        const end = next < endExclusive ? next : endExclusive;
        const startKey = localDateKey(cursor);
        const endKey = localDateKey(end);
        specs.push({
          label: cursor.toLocaleDateString('en-GB', { month: 'short' }),
          start: startKey,
          end: endKey,
        });
        cursor = next;
      }
    }
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    const endExclusive = new Date(today);
    endExclusive.setDate(endExclusive.getDate() + 1);
    let cursor = start;
    while (cursor < endExclusive) {
      const next = new Date(cursor);
      next.setDate(next.getDate() + 7);
      const end = next < endExclusive ? next : endExclusive;
      const startKey = localDateKey(cursor);
      const endKey = localDateKey(end);
      specs.push({ label: formatInquiryTrendBucketLabel(startKey, endKey), start: startKey, end: endKey });
      cursor = end;
    }
  }

  const data = specs.map((spec) => ({
    label: spec.label,
    primary: inquiries.reduce((count, inquiry) => {
      const createdDate = dateKey(inquiry.createdAt);
      if (!createdDate || !isValidDashboardDate(createdDate) || createdDate < spec.start || createdDate >= spec.end) return count;
      return count + 1;
    }, 0),
  }));
  const lastEndExclusive = specs.length ? new Date(specs[specs.length - 1].end + 'T00:00:00') : null;
  if (lastEndExclusive) lastEndExclusive.setDate(lastEndExclusive.getDate() - 1);
  const scopeLabel = period && specs.length
    ? periodLabel
    : specs.length && lastEndExclusive
      ? 'Recent 30-day default window (' + formatFinancialTrendDate(specs[0].start) + ' – ' + formatFinancialTrendDate(localDateKey(lastEndExclusive)) + ')'
      : 'Period unavailable';
  return { data, scopeLabel };
};

const formatInquiryStatusLabel = (status: string) =>
  status.replace(/[-_]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

const getInquiryStatusTone = (status: string): DonutPoint['tone'] => {
  const normalized = status.trim().toLowerCase().replace(/[_\s]+/g, '-');
  if (normalized === 'new') return 'accent';
  if (['in-review', 'contacted', 'screening', 'shortlisted', 'interview'].includes(normalized)) return 'info';
  if (normalized === 'hired') return 'success';
  if (normalized === 'rejected') return 'danger';
  return 'muted';
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

type DashboardAnalyticsReport = 'financial-movement' | 'receivables' | 'inquiry-pipeline' | 'project-status';

const DASHBOARD_ANALYTICS_REPORT_OPTIONS: Array<{ value: DashboardAnalyticsReport; label: string }> = [
  { value: 'financial-movement', label: 'Financial movement' },
  { value: 'receivables', label: 'Receivables' },
  { value: 'inquiry-pipeline', label: 'Inquiry pipeline' },
  { value: 'project-status', label: 'Project status' },
];

const AnalyticsView: React.FC<{
  snapshot: DashboardOperationalSnapshot;
  reportPeriodMode: ReportingPeriodMode;
  reportPeriodValue: string;
  reportPeriodLabel: string;
  reportPeriodEnabled: boolean;
  currency: string;
  canOpenInbox: boolean;
}> = ({ snapshot, reportPeriodMode, reportPeriodValue, reportPeriodLabel, reportPeriodEnabled, currency, canOpenInbox }) => {
  const [report, setReport] = useState<DashboardAnalyticsReport>('financial-movement');
  useEffect(() => {
    if (!canOpenInbox && report === 'inquiry-pipeline') setReport('financial-movement');
  }, [canOpenInbox, report]);

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

  const inquiryRows = snapshot.inboxLeads || [];
  const inquiryRecords = inquiryRows.filter((record) => record.type === 'inquiry');
  const openInquiryCount = inquiryRecords.filter((record) => record.status !== 'closed').length;
  const linkedInquiryCount = inquiryRecords.filter((record) => Boolean(String(record.convertedClientId || '').trim())).length;
  const inquiryStatusGroups: Array<{ status: string; count: number }> = inquiryRecords.reduce((groups: Array<{ status: string; count: number }>, record: ContactSubmission) => {
    const status = String(record.status || 'Not set');
    const existing = groups.find((item) => item.status === status);
    if (existing) existing.count += 1;
    else groups.push({ status, count: 1 });
    return groups;
  }, [] as Array<{ status: string; count: number }>).sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
  const inquiryServiceGroups: Array<{ service: string; count: number }> = inquiryRecords.reduce((groups: Array<{ service: string; count: number }>, record: ContactSubmission) => {
    const services = Array.isArray(record.services)
      ? Array.from(new Set(record.services.map((service) => String(service || '').trim()).filter(Boolean)))
      : [];
    services.forEach((service) => {
      const existing = groups.find((item) => item.service === service);
      if (existing) existing.count += 1;
      else groups.push({ service, count: 1 });
    });
    return groups;
  }, [] as Array<{ service: string; count: number }>).sort((a, b) => b.count - a.count || a.service.localeCompare(b.service));
  const inquiryStatusChartData: DonutPoint[] = inquiryStatusGroups.map((group) => ({
    label: formatInquiryStatusLabel(group.status),
    value: group.count,
    tone: getInquiryStatusTone(group.status),
  }));
  const inquiryVolumeTrend = buildInquiryVolumeTrend(
    inquiryRecords,
    reportPeriodMode,
    reportPeriodValue,
    reportPeriodEnabled,
    reportPeriodLabel
  );
  const datedInquiryCount = inquiryRecords.filter((record) => isValidDashboardDate(dateKey(record.createdAt))).length;
  const undatedInquiryCount = inquiryRecords.length - datedInquiryCount;
  const maxInquiryServiceCount = Math.max(1, ...inquiryServiceGroups.map((group) => group.count));

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
              {DASHBOARD_ANALYTICS_REPORT_OPTIONS.filter((option) => option.value !== 'inquiry-pipeline' || canOpenInbox).map((option) => {
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
              <p className="mt-1 text-xs text-fg">{report === 'receivables' ? 'Current invoice balances' : report === 'inquiry-pipeline' ? 'Current inquiry pipeline' : 'Current project register'}</p>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          Financial movement uses the shared Filter selection. When set to All dates, its chart uses the recent 30-day default window. Inquiry volume also follows the shared Filter and uses the same default window. Receivables and project status are current snapshots; inquiry status and service demand are current-state groupings. No historic conversion performance or booked revenue is inferred.
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
                  ariaLabel={'Issued invoice values and recorded expenses for ' + selectedRangeLabel + '. Exact values are listed in the table below.'}
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
      ) : report === 'inquiry-pipeline' ? (
        <section className="space-y-3" data-ams-feature-slug="dashboard-analytics-inquiry-pipeline-report" aria-label="Inquiry pipeline report">
          <AdminPanel
            title="Inquiry pipeline"
            description="Current status distribution and requested service demand from canonical Inbox inquiry records. This report does not infer historical conversion performance or booked revenue."
            actions={canOpenInbox ? (
              <Link to="/admin/inbox" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">
                Open Inbox <ArrowUpRight size={13} />
              </Link>
            ) : undefined}
            bodyClassName="p-4 sm:p-5"
          >
            {!canOpenInbox ? (
              <DashboardUnavailable title="Inquiry analytics restricted" description="This report requires existing permission to open Inbox." />
            ) : snapshot.inboxLeads === null ? (
              <DashboardUnavailable title="Inquiry pipeline unavailable" description="The Inbox source did not return records for the current role. An unavailable source is not interpreted as an empty pipeline." />
            ) : inquiryRecords.length === 0 ? (
              <div className="rounded-control border border-line bg-bg px-4 py-5" role="status">
                <p className="text-xs font-medium text-fg">No sales inquiry records returned</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {inquiryRows.length > 0
                    ? 'The source returned submissions, but none has the canonical inquiry type. Other submission types are not counted in this report.'
                    : 'The Inbox source returned no inquiry submissions.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2 min-[600px]:grid-cols-3">
                  {[
                    { label: 'Inquiry records', value: inquiryRecords.length },
                    { label: 'Open inquiries', value: openInquiryCount },
                    { label: 'Linked to a client', value: linkedInquiryCount }
                  ].map((metric) => (
                    <div key={metric.label} className="min-w-0 rounded-control border border-line bg-bg px-3 py-3">
                      <p className="text-[10px] leading-4 text-muted">{metric.label}</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums text-fg">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <section
                  className="space-y-3 rounded-card border border-line bg-bg p-3 sm:p-4"
                  data-ams-feature-slug="dashboard-analytics-inquiry-volume-trend"
                  aria-label="Inquiry volume trend"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-fg">Inquiry volume</h3>
                      <p className="mt-1 text-[11px] leading-5 text-muted">{inquiryVolumeTrend.scopeLabel} · grouped by saved submission date</p>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-badge border border-line bg-panel px-2.5 py-1 text-[10px] text-muted">
                      <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                      New inquiries
                    </span>
                  </div>
                  {datedInquiryCount > 0 && inquiryVolumeTrend.data.length > 0 ? (
                    <TrendChart
                      data={inquiryVolumeTrend.data}
                      primaryLabel="New inquiries"
                      primaryFormat={(count) => count + (count === 1 ? ' inquiry' : ' inquiries')}
                      ariaLabel={'New inquiry count by date bucket for ' + inquiryVolumeTrend.scopeLabel + '. The chart uses saved inquiry submission dates.'}
                    />
                  ) : (
                    <div className="flex min-h-32 flex-col items-center justify-center rounded-control border border-line bg-panel px-4 py-6 text-center" role="status">
                      <CalendarDays size={18} className="text-muted" aria-hidden="true" />
                      <p className="mt-2 text-xs font-semibold text-fg">Inquiry volume trend unavailable</p>
                      <p className="mt-1 max-w-md text-[11px] leading-5 text-muted">No usable submission dates are available for the inquiry records. The current status totals remain available above.</p>
                    </div>
                  )}
                  <p className="text-[11px] leading-5 text-muted">
                    {undatedInquiryCount > 0
                      ? undatedInquiryCount + ' inquiry record(s) without a valid submission date are excluded from this trend. Counts above still include those records.'
                      : 'The selected period scopes this volume trend only. Status and service demand below are current snapshots.'}
                  </p>
                </section>

                <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
                  <section
                    className="min-w-0 space-y-3 rounded-card border border-line bg-bg p-3 sm:p-4"
                    data-ams-feature-slug="dashboard-analytics-inquiry-status-visualization"
                    aria-label="Inquiry status distribution"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-fg">Current status distribution</h3>
                        <p className="mt-1 text-[11px] text-muted">All current inquiry records</p>
                      </div>
                      <span className="rounded-badge border border-line bg-panel px-2 py-1 text-[10px] font-medium text-muted">Current</span>
                    </div>
                    {inquiryStatusChartData.length > 0 ? (
                      <DonutChart
                        data={inquiryStatusChartData}
                        centerLabel="Inquiries"
                        ariaLabel={'Current inquiry status distribution: ' + inquiryStatusChartData.map((item) => item.label + ' ' + item.value).join(', ')}
                      />
                    ) : (
                      <p className="rounded-control border border-line bg-panel px-3 py-3 text-xs text-muted" role="status">No current status values are available to chart.</p>
                    )}
                  </section>
                  <section
                    className="min-w-0 space-y-3 rounded-card border border-line bg-bg p-3 sm:p-4"
                    aria-label="Requested services"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-fg">Requested services</h3>
                        <p className="mt-1 text-[11px] text-muted">Inquiry count by service category</p>
                      </div>
                      <span className="rounded-badge border border-line bg-panel px-2 py-1 text-[10px] font-medium text-muted">{inquiryServiceGroups.length ? 'Top ' + Math.min(8, inquiryServiceGroups.length) : 'No categories'}</span>
                    </div>
                    <p className="text-[11px] leading-5 text-muted">One inquiry may request multiple services, so service counts can overlap.</p>
                    {inquiryServiceGroups.length > 0 ? (
                      <div className="space-y-3">
                        {inquiryServiceGroups.slice(0, 8).map((group) => {
                          const width = Math.max(4, (group.count / maxInquiryServiceCount) * 100);
                          return (
                            <div key={group.service} className="space-y-1.5">
                              <div className="flex min-w-0 items-start justify-between gap-3">
                                <span className="min-w-0 break-words text-xs text-fg">{group.service}</span>
                                <span className="shrink-0 text-xs font-semibold tabular-nums text-fg">{group.count}</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-line" role="img" aria-label={group.service + ': ' + group.count + ' inquiries'}>
                                <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: width + '%' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="rounded-control border border-line bg-panel px-3 py-3 text-xs text-muted" role="status">No requested service categories were recorded for these inquiries.</p>
                    )}
                  </section>
                </div>
                <p className="border-t border-line pt-3 text-[11px] leading-5 text-muted">
                  Source: canonical AMS Inbox submissions. Only records with type “inquiry” are included; Careers applicants, vendors and newsletter subscriptions are excluded. Status is the current record status. Client linkage requires a saved Client Directory ID. No conversion rate or booked revenue is inferred.
                </p>
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
  const canOpenInvoiceRegister = canOpenDashboardRoute('/admin/finance?tab=accounts-receivable');
  const canOpenExpenseRegister = canOpenDashboardRoute('/admin/finance?tab=expenses');
  const canCreateProject = canManageProjects && canOpenDashboardRoute('/admin/projects?create=1');
  const canOpenProjects = canOpenDashboardRoute('/admin/projects');
  const canOpenInbox = canOpenDashboardRoute('/admin/inbox');
  const canOpenClientDirectory = canOpenDashboardRoute('/admin/clients/all-clients');
  const canOpenTasks = canOpenDashboardRoute('/admin/tasks');
  const canOpenTimeLogs = canOpenDashboardRoute('/admin/time-logs');
  const canOpenDocuments = canOpenDashboardRoute('/admin/documents');
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
  const [overviewTaskFilter, setOverviewTaskFilter] = useState<DashboardTaskFilter>('action');
  const [dashboardOverview, setDashboardOverview] = useState<{ metrics?: any; financials?: any; projects?: any[]; attentionItems?: DashboardAttentionItem[]; attentionItemsDataAvailable?: boolean; recentActivity?: DashboardRecentActivity[]; recentActivityDataAvailable?: boolean; projectDataAvailable?: boolean; stale?: boolean; source: 'server' | 'ab'; loading: boolean }>({ source: 'ab', loading: true });
  const [operationalSnapshot, setOperationalSnapshot] = useState<DashboardOperationalSnapshot>({
    loading: true, projects: null, clients: null, inboxLeads: null, tasks: null, timeLogs: null, invoices: null, expenses: null
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
      api.finance.getExpenses(),
      canOpenClientDirectory ? api.clients.getAll() : Promise.resolve({ success: true, data: { clients: [] } }),
      canOpenInbox ? api.leads.getAll() : Promise.resolve({ success: true, data: { leads: [] } })
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
      const clients = canOpenClientDirectory ? readRows(results[6], 'clients') : null;
      const inboxLeadRows = canOpenInbox ? readRows(results[7], 'leads') : null;
      const inboxLeads = inboxLeadRows === null
        ? null
        : inboxLeadRows.map((lead) => normalizeContactSubmission(lead as ContactSubmission)).filter((lead) => lead.type !== 'career');

      if (projects === null) failedSources.push('projects');
      if (tasks === null) failedSources.push('tasks');
      if (timeLogs === null) failedSources.push('time logs');
      if (invoices === null) failedSources.push('invoices');
      if (expenses === null) failedSources.push('expenses');
      if (canOpenClientDirectory && clients === null) failedSources.push('client directory');
      if (canOpenInbox && inboxLeads === null) failedSources.push('inbox leads');

      setOperationalSnapshot((previous) => ({
        loading: false,
        projects: projects ?? previous.projects,
        clients: canOpenClientDirectory ? clients ?? previous.clients : null,
        inboxLeads: canOpenInbox ? inboxLeads ?? previous.inboxLeads : null,
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
  }, [refreshRequest, canOpenClientDirectory, canOpenInbox]);

  const financeCurrency = String(dashboardOverview.financials?.currency || dashboardOverview.metrics?.currency || 'IDR').toUpperCase();
  const currentDayKey = localDateKey(new Date());
  const currentMonthKey = currentDayKey.slice(0, 7);
  const nextThreeDaysKey = shiftDashboardDate(currentDayKey, 3);
  const nextSevenDaysKey = shiftDashboardDate(currentDayKey, 7);
  const nextThirtyDaysKey = shiftDashboardDate(currentDayKey, 30);

  const projectSourceAvailable = operationalSnapshot.projects !== null;
  const rawProjectRows = operationalSnapshot.projects || [];
  const activeProjectRows = rawProjectRows.filter((project: any) => !isFinishedWork(project.status) && !isFinishedWork(project.health));
  const openProjectCount = projectSourceAvailable ? activeProjectRows.length : null;

  const clientDirectoryById = useMemo(
    () => new Map<string, any>(
      (canOpenClientDirectory ? operationalSnapshot.clients || [] : [])
        .map((client: any): [string, any] => [String(client.id || '').trim(), client])
        .filter(([id]) => Boolean(id))
    ),
    [canOpenClientDirectory, operationalSnapshot.clients]
  );

  const inboxTriageSummary = useMemo(() => {
    if (!canOpenInbox) return { state: 'restricted' as const, openCount: 0, newCount: 0, unassignedCount: 0, highPriorityCount: 0, actionable: [] as ContactSubmission[] };
    if (operationalSnapshot.inboxLeads === null) {
      return {
        state: operationalSnapshot.loading ? 'loading' as const : 'unavailable' as const,
        openCount: null,
        newCount: null,
        unassignedCount: null,
        highPriorityCount: null,
        actionable: [] as ContactSubmission[]
      };
    }

    const openRecords = operationalSnapshot.inboxLeads.filter((lead) => lead.status !== 'closed');
    const actionable = openRecords
      .filter(isInboxActionable)
      .sort((left, right) => {
        const priorityRank = (value: unknown) => value === 'urgent' ? 0 : value === 'high' ? 1 : value === 'normal' ? 2 : 3;
        const priorityDifference = priorityRank(left.priority) - priorityRank(right.priority);
        if (priorityDifference !== 0) return priorityDifference;
        const stateRank = (lead: ContactSubmission) => lead.status === 'new' ? 0 : isInboxUnassigned(lead) ? 1 : 2;
        const stateDifference = stateRank(left) - stateRank(right);
        if (stateDifference !== 0) return stateDifference;
        const leftDate = Date.parse(left.createdAt || '');
        const rightDate = Date.parse(right.createdAt || '');
        if (Number.isFinite(leftDate) && Number.isFinite(rightDate) && leftDate !== rightDate) return leftDate - rightDate;
        return String(left.id || '').localeCompare(String(right.id || ''));
      });

    return {
      state: 'ready' as const,
      openCount: openRecords.length,
      newCount: openRecords.filter((lead) => lead.status === 'new').length,
      unassignedCount: openRecords.filter(isInboxUnassigned).length,
      highPriorityCount: openRecords.filter(isInboxHighPriority).length,
      actionable
    };
  }, [canOpenInbox, operationalSnapshot.inboxLeads, operationalSnapshot.loading]);

  const overviewAttentionItems = useMemo(() => {
    const items = dashboardOverview.attentionItems || [];
    // The server's Sales exception uses open-lead volume as a proxy for unassigned records.
    // Inbox is the source of truth for assignment and priority, so avoid duplicating or mislabelling it.
    return canOpenInbox
      ? items.filter((item) => String(item.category || '').toLowerCase() !== 'sales' && item.id !== 'att_leads_new')
      : items;
  }, [canOpenInbox, dashboardOverview.attentionItems]);



  const dashboardWorkTasks = useMemo<DashboardWorkTask[]>(() => {
    if (!Array.isArray(operationalSnapshot.tasks)) return [];
    const projectById = new Map<string, any>((operationalSnapshot.projects || []).map((project: any) => [String(project.id || ''), project]));
    return operationalSnapshot.tasks.map((task: any): DashboardWorkTask => {
      const id = String(task?.id || task?.slug || '');
      const projectId = String(task?.projectId || task?.project_id || '');
      const project = projectById.get(projectId);
      const projectName = String(task?.projectName || task?.project_name || project?.name || project?.title || 'Unlinked project');
      const clientId = String(project?.clientId || project?.client_id || task?.clientId || task?.client_id || '').trim();
      const clientName = resolveDashboardClientName(clientId, clientDirectoryById, project?.clientCompany, project?.client, task?.clientCompany, project?.clientName, task?.clientName);
      const serviceCategory = String(project?.serviceCategory || task?.serviceCategory || task?.service || '');
      const rawStatus = String(task?.status || 'todo').toLowerCase();
      const rawPriority = String(task?.priority || 'medium').toLowerCase();
      const assigneeId = String(task?.assigneeUserId || task?.assigneeId || '');
      const assigneeName = String(task?.assigneeName || task?.assignee || task?.assignedTo || '').trim();
      const assigned = Boolean(assigneeId || assigneeName);
      const dueCandidate = dateKey(task?.dueDate || task?.due_date || task?.deadline);
      const dueDate = isValidDashboardDate(dueCandidate) ? dueCandidate : '';
      return {
        id,
        title: String(task?.title || task?.name || 'Untitled task'),
        projectId,
        projectSlug: String(project?.slug || ''),
        projectName,
        clientId,
        clientName,
        serviceCategory,
        serviceLine: getDashboardServiceLine(project || { serviceCategory, techStack: task?.techStack }),
        status: rawStatus,
        priority: (['urgent', 'high', 'medium', 'low'].includes(rawPriority) ? rawPriority : 'medium') as DashboardWorkTask['priority'],
        dueDate,
        assigneeLabel: assigneeName || (assigneeId ? 'Assigned · name unavailable' : 'Unassigned'),
        assigned,
        blocked: isDashboardTaskBlocked(task)
      };
    }).filter((task: DashboardWorkTask) => Boolean(task.id));
  }, [clientDirectoryById, operationalSnapshot.projects, operationalSnapshot.tasks]);

  const activeDashboardTasks = dashboardWorkTasks.filter(dashboardTaskIsOpen);
  const taskQueueCounts = useMemo(() => ({
    action: activeDashboardTasks.filter((task) => dashboardTaskNeedsAction(task, currentDayKey, nextThreeDaysKey)).length,
    review: activeDashboardTasks.filter((task) => task.status === 'review' || task.status === 'in_review').length,
    overdue: activeDashboardTasks.filter((task) => dashboardTaskIsOverdue(task, currentDayKey)).length,
    blocked: activeDashboardTasks.filter((task) => task.blocked).length,
    unassigned: activeDashboardTasks.filter((task) => !task.assigned).length
  }), [activeDashboardTasks, currentDayKey, nextThreeDaysKey]);

  const visibleOverviewTasks = useMemo(() => {
    const filtered = activeDashboardTasks.filter((task) => {
      if (overviewTaskFilter === 'review') return task.status === 'review' || task.status === 'in_review';
      if (overviewTaskFilter === 'overdue') return dashboardTaskIsOverdue(task, currentDayKey);
      if (overviewTaskFilter === 'blocked') return task.blocked;
      if (overviewTaskFilter === 'unassigned') return !task.assigned;
      return dashboardTaskNeedsAction(task, currentDayKey, nextThreeDaysKey);
    });
    return filtered.sort((left, right) => {
      const leftUrgency = (dashboardTaskIsOverdue(left, currentDayKey) ? 100 : 0) +
        (left.blocked ? 80 : 0) +
        (left.priority === 'urgent' ? 60 : left.priority === 'high' ? 40 : 0) +
        (left.status === 'review' || left.status === 'in_review' ? 30 : 0) +
        (!left.assigned ? 15 : 0);
      const rightUrgency = (dashboardTaskIsOverdue(right, currentDayKey) ? 100 : 0) +
        (right.blocked ? 80 : 0) +
        (right.priority === 'urgent' ? 60 : right.priority === 'high' ? 40 : 0) +
        (right.status === 'review' || right.status === 'in_review' ? 30 : 0) +
        (!right.assigned ? 15 : 0);
      if (leftUrgency !== rightUrgency) return rightUrgency - leftUrgency;
      if (left.dueDate && right.dueDate) return left.dueDate.localeCompare(right.dueDate);
      if (left.dueDate) return -1;
      if (right.dueDate) return 1;
      return left.title.localeCompare(right.title);
    }).slice(0, 7);
  }, [activeDashboardTasks, currentDayKey, nextThreeDaysKey, overviewTaskFilter]);

  const overviewTaskQueueHref = overviewTaskFilter === 'review'
    ? '/admin/tasks?taskscope=review'
    : overviewTaskFilter === 'overdue'
      ? '/admin/tasks?taskscope=due'
      : overviewTaskFilter === 'blocked'
        ? '/admin/tasks?taskscope=blocked'
        : '/admin/tasks';

  const serviceLineConfiguration = [
    { key: 'creative' as const, label: 'Creative & Content', description: 'Brand, design, video, social and campaign delivery', icon: <Palette size={17} aria-hidden="true" /> },
    { key: 'technology' as const, label: 'Web & IT Development', description: 'Websites, applications, data and technical delivery', icon: <Code2 size={17} aria-hidden="true" /> },
    { key: 'other' as const, label: 'Other / Unclassified', description: 'Projects without a recognized saved service category', icon: <FolderKanban size={17} aria-hidden="true" /> }
  ];

  const serviceLineSummaries = useMemo(() => serviceLineConfiguration.map((line) => {
    const lineProjects = activeProjectRows.filter((project: any) => getDashboardServiceLine(project) === line.key);
    const projectIds = new Set(lineProjects.map((project: any) => String(project.id || '')).filter(Boolean));
    const lineTasks = canOpenTasks
      ? activeDashboardTasks.filter((task) => (Boolean(task.projectId) && projectIds.has(task.projectId)) || (task.serviceLine === line.key && !task.projectId))
      : [];
    const lineCommitments = lineProjects.reduce((count: number, project: any) => {
      const milestones = Array.isArray(project.milestones) ? project.milestones : [];
      const hasOverdueMilestone = milestones.some((milestone: any) => milestone?.completed !== true && !isFinishedWork(milestone?.status) &&
        isValidDashboardDate(milestone?.dueDate) && String(milestone.dueDate).slice(0, 10) < currentDayKey);
      const targetDate = dateKey(project.targetEndDate || project.endDate || project.dueDate || project.deadline);
      const projectOverdue = isValidDashboardDate(targetDate) && targetDate < currentDayKey;
      return count + (hasOverdueMilestone || projectOverdue ? 1 : 0);
    }, 0);
    return {
      ...line,
      projectCount: lineProjects.length,
      openTaskCount: lineTasks.length,
      reviewTaskCount: lineTasks.filter((task) => task.status === 'review' || task.status === 'in_review').length,
      blockedTaskCount: lineTasks.filter((task) => task.blocked).length,
      unassignedTaskCount: lineTasks.filter((task) => !task.assigned).length,
      overdueTaskCount: lineTasks.filter((task) => dashboardTaskIsOverdue(task, currentDayKey)).length,
      overdueCommitmentCount: lineCommitments
    };
  }), [activeDashboardTasks, activeProjectRows, canOpenTasks, currentDayKey]);

  const allUpcomingCommitments = useMemo<DashboardCommitment[]>(() => {
    if (operationalSnapshot.projects === null) return [];
    const commitments: DashboardCommitment[] = [];
    for (const project of activeProjectRows) {
      const projectId = String(project.id || '');
      const projectName = String(project.name || project.title || 'Untitled project');
      const projectSlug = String(project.slug || '');
      const projectHref = getDashboardProjectHref(project);
      const clientId = String(project.clientId || project.client_id || '').trim();
      const clientName = resolveDashboardClientName(clientId, clientDirectoryById, project.clientCompany, project.client, project.clientName);
      const serviceCategory = String(project.serviceCategory || '');
      const serviceLine = getDashboardServiceLine(project);
      const milestones = Array.isArray(project.milestones) ? project.milestones : [];
      const datedMilestoneKeys = new Set<string>();
      for (const milestone of milestones) {
        if (milestone?.completed === true || isFinishedWork(milestone?.status)) continue;
        const dueDate = dateKey(milestone?.dueDate || milestone?.targetDate);
        if (!isValidDashboardDate(dueDate) || dueDate > nextThirtyDaysKey) continue;
        datedMilestoneKeys.add(dueDate);
        commitments.push({
          id: 'milestone-' + String(milestone.id || milestone.slug || milestone.title || projectId + '-' + dueDate),
          projectId,
          projectSlug,
          projectHref,
          projectName,
          clientId,
          clientName,
          serviceCategory,
          serviceLine,
          title: String(milestone.title || milestone.name || 'Untitled milestone'),
          kind: 'Milestone',
          dueDate,
          owner: String(project.teamLead || project.ownerName || project.lead || 'Owner not assigned')
        });
      }
      const projectDueDate = dateKey(project.targetEndDate || project.endDate || project.dueDate || project.deadline);
      if (isValidDashboardDate(projectDueDate) && projectDueDate <= nextThirtyDaysKey && !datedMilestoneKeys.has(projectDueDate)) {
        commitments.push({
          id: 'project-deadline-' + projectId,
          projectId,
          projectSlug,
          projectHref,
          projectName,
          clientId,
          clientName,
          serviceCategory,
          serviceLine,
          title: 'Project delivery deadline',
          kind: 'Project deadline',
          dueDate: projectDueDate,
          owner: String(project.teamLead || project.ownerName || project.lead || 'Owner not assigned')
        });
      }
    }
    return commitments.sort((left, right) => {
      const leftOverdue = left.dueDate < currentDayKey;
      const rightOverdue = right.dueDate < currentDayKey;
      if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
      return left.dueDate.localeCompare(right.dueDate);
    });
  }, [activeProjectRows, clientDirectoryById, currentDayKey, nextThirtyDaysKey, operationalSnapshot.projects]);

  const clientDeliveryFocus = useMemo<DashboardClientDeliveryFocus[]>(() => {
    if (!canOpenProjects || operationalSnapshot.projects === null) return [];
    const taskMetricsAvailable = canOpenTasks && operationalSnapshot.tasks !== null;
    type ClientAccumulator = DashboardClientDeliveryFocus & {
      projectIds: Set<string>;
      projectHrefs: Set<string>;
      serviceLineKeys: Set<string>;
    };
    const groups = new Map<string, ClientAccumulator>();
    const projectClientById = new Map<string, { key: string; name: string; clientId: string | null }>();

    const ensureClient = (rawClientId: unknown, rawName: unknown): ClientAccumulator | null => {
      const clientId = String(rawClientId || '').trim();
      const name = resolveDashboardClientName(clientId, clientDirectoryById, rawName) || (clientId ? 'Client record unavailable' : '');
      if (!clientId && !name) return null;
      const normalizedName = name.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
      const key = clientId ? 'client-id:' + clientId : 'saved-name:' + normalizedName;
      const clientRecordAvailable = Boolean(clientId && clientDirectoryById.has(clientId));
      const clientIdentityLabel = clientRecordAvailable
        ? 'Client directory record'
        : clientId
          ? 'Saved client ID · master record not resolved'
          : 'Grouped by saved company name';
      const current = groups.get(key);
      if (current) {
        if (clientRecordAvailable && name) current.name = name;
        return current;
      }
      const created: ClientAccumulator = {
        key,
        name,
        clientId: clientId || null,
        clientIdentityLabel,
        clientRecordAvailable,
        projectCount: 0,
        projects: [],
        serviceLines: [],
        openTaskCount: taskMetricsAvailable ? 0 : null,
        reviewTaskCount: taskMetricsAvailable ? 0 : null,
        blockedTaskCount: taskMetricsAvailable ? 0 : null,
        unassignedTaskCount: taskMetricsAvailable ? 0 : null,
        overdueTaskCount: taskMetricsAvailable ? 0 : null,
        overdueCommitmentCount: 0,
        nextCommitmentDate: null,
        projectIds: new Set<string>(),
        projectHrefs: new Set<string>(),
        serviceLineKeys: new Set<string>()
      };
      groups.set(key, created);
      return created;
    };

    const serviceLineLabel = (line: string) => line === 'creative'
      ? 'Creative & Content'
      : line === 'technology'
        ? 'Web & IT Development'
        : 'Other / Unclassified';

    for (const project of activeProjectRows) {
      const projectId = String(project.id || '').trim();
      const projectName = String(project.name || project.title || 'Untitled project');
      const clientId = String(project.clientId || project.client_id || '').trim();
      const savedClientName = resolveDashboardClientName(clientId, clientDirectoryById, project.clientCompany, project.client, project.clientName);
      const group = ensureClient(clientId, savedClientName);
      if (!group) continue;
      const href = getDashboardProjectHref(project);
      const projectIdentity = projectId ? 'id:' + projectId : href ? 'href:' + href : 'name:' + projectName.toLocaleLowerCase();
      group.projectIds.add(projectIdentity);
      group.projectCount = group.projectIds.size;
      if (projectId) projectClientById.set(projectId, { key: group.key, name: group.name, clientId: group.clientId });
      if (!group.projectHrefs.has(projectIdentity)) {
        group.projectHrefs.add(projectIdentity);
        group.projects.push({ name: projectName, href });
      }
      group.serviceLineKeys.add(serviceLineLabel(getDashboardServiceLine(project)));
    }

    if (taskMetricsAvailable) {
      for (const task of activeDashboardTasks) {
        const projectIdentity = projectClientById.get(task.projectId);
        const group = projectIdentity
          ? groups.get(projectIdentity.key) || null
          : ensureClient(task.clientId, task.clientName);
        if (!group) continue;
        group.openTaskCount = (group.openTaskCount ?? 0) + 1;
        group.reviewTaskCount = (group.reviewTaskCount ?? 0) + (task.status === 'review' || task.status === 'in_review' ? 1 : 0);
        group.blockedTaskCount = (group.blockedTaskCount ?? 0) + (task.blocked ? 1 : 0);
        group.unassignedTaskCount = (group.unassignedTaskCount ?? 0) + (!task.assigned ? 1 : 0);
        group.overdueTaskCount = (group.overdueTaskCount ?? 0) + (dashboardTaskIsOverdue(task, currentDayKey) ? 1 : 0);
        group.serviceLineKeys.add(serviceLineLabel(task.serviceLine));
      }
    }

    for (const commitment of allUpcomingCommitments) {
      const projectIdentity = projectClientById.get(commitment.projectId);
      const group = projectIdentity
        ? groups.get(projectIdentity.key) || null
        : ensureClient(commitment.clientId, commitment.clientName);
      if (!group) continue;
      if (commitment.dueDate < currentDayKey) {
        group.overdueCommitmentCount += 1;
      } else if (!group.nextCommitmentDate || commitment.dueDate < group.nextCommitmentDate) {
        group.nextCommitmentDate = commitment.dueDate;
      }
    }

    return Array.from(groups.values())
      .map((group) => ({
        key: group.key,
        name: group.name,
        clientId: group.clientId,
        clientIdentityLabel: group.clientIdentityLabel,
        clientRecordAvailable: group.clientRecordAvailable,
        projectCount: group.projectCount,
        projects: group.projects,
        serviceLines: Array.from(group.serviceLineKeys),
        openTaskCount: group.openTaskCount,
        reviewTaskCount: group.reviewTaskCount,
        blockedTaskCount: group.blockedTaskCount,
        unassignedTaskCount: group.unassignedTaskCount,
        overdueTaskCount: group.overdueTaskCount,
        overdueCommitmentCount: group.overdueCommitmentCount,
        nextCommitmentDate: group.nextCommitmentDate
      }))
      .sort((left, right) =>
        right.overdueCommitmentCount - left.overdueCommitmentCount ||
        (right.overdueTaskCount ?? -1) - (left.overdueTaskCount ?? -1) ||
        (right.blockedTaskCount ?? -1) - (left.blockedTaskCount ?? -1) ||
        right.projectCount - left.projectCount ||
        left.name.localeCompare(right.name)
      )
      .slice(0, 5);
  }, [activeDashboardTasks, activeProjectRows, allUpcomingCommitments, canOpenClientDirectory, canOpenProjects, canOpenTasks, clientDirectoryById, currentDayKey, operationalSnapshot.projects, operationalSnapshot.tasks]);

  const upcomingCommitments = allUpcomingCommitments.slice(0, 8);
  const nextSevenDayCommitmentCount = allUpcomingCommitments.filter((item) => item.dueDate >= currentDayKey && item.dueDate <= nextSevenDaysKey).length;
  const overdueCommitmentCount = operationalSnapshot.projects === null ? null : activeProjectRows.reduce((total: number, project: any) => {
    const targetDate = dateKey(project.targetEndDate || project.endDate || project.dueDate || project.deadline);
    const dueProjectIsOverdue = isValidDashboardDate(targetDate) && targetDate < currentDayKey;
    const overdueMilestones = (Array.isArray(project.milestones) ? project.milestones : []).filter((milestone: any) =>
      milestone?.completed !== true && !isFinishedWork(milestone?.status) &&
      isValidDashboardDate(milestone?.dueDate) && String(milestone.dueDate).slice(0, 10) < currentDayKey
    ).length;
    return total + overdueMilestones + (dueProjectIsOverdue ? 1 : 0);
  }, 0);

  const taskLoadByAssignee = useMemo(() => {
    const groups = new Map<string, { label: string; total: number; overdue: number; blocked: number; review: number }>();
    for (const task of activeDashboardTasks) {
      const key = task.assigned ? task.assigneeLabel : 'Unassigned';
      const item = groups.get(key) || { label: key, total: 0, overdue: 0, blocked: 0, review: 0 };
      item.total += 1;
      item.overdue += dashboardTaskIsOverdue(task, currentDayKey) ? 1 : 0;
      item.blocked += task.blocked ? 1 : 0;
      item.review += task.status === 'review' || task.status === 'in_review' ? 1 : 0;
      groups.set(key, item);
    }
    return Array.from(groups.values()).sort((left, right) => right.overdue - left.overdue || right.blocked - left.blocked || right.total - left.total || left.label.localeCompare(right.label)).slice(0, 5);
  }, [activeDashboardTasks, currentDayKey]);

  const periodTimeRows = useMemo(() => {
    if (operationalSnapshot.timeLogs === null) return [];
    const groups = new Map<string, { name: string; minutes: number; entries: number }>();
    for (const log of operationalSnapshot.timeLogs.filter((item: any) => matchesDate(item.date))) {
      const key = String(log.userId || log.user || 'unassigned');
      const name = String(log.user || '').trim() || (log.userId ? 'Assigned team member' : 'Unassigned / general');
      const group = groups.get(key) || { name, minutes: 0, entries: 0 };
      group.minutes += Math.max(0, Number(log.durationMinutes || 0) || 0);
      group.entries += 1;
      groups.set(key, group);
    }
    return Array.from(groups.values()).sort((left, right) => right.minutes - left.minutes || left.name.localeCompare(right.name)).slice(0, 5);
  }, [matchesDate, operationalSnapshot.timeLogs]);

  const activeTaskCount = operationalSnapshot.tasks === null ? null : activeDashboardTasks.length;
  const overdueTaskCount = operationalSnapshot.tasks === null ? null : activeDashboardTasks.filter((task) => dashboardTaskIsOverdue(task, currentDayKey)).length;
  const reviewTaskCount = operationalSnapshot.tasks === null ? null : activeDashboardTasks.filter((task) => task.status === 'review' || task.status === 'in_review').length;
  const activeProjectsMetric = openProjectCount ?? (canOpenProjects ? dashboardOverview.metrics?.activeProjects ?? null : null);
  const taskKpiRoute = canOpenTasks ? '/admin/tasks' : '';
  const projectKpiRoute = canOpenProjects ? '/admin/projects?projects=all' : '';
  const issuedInvoicesInSelectedCurrency = (operationalSnapshot.invoices || []).filter((invoice: any) =>
    String(invoice.currency || 'IDR').toUpperCase() === financeCurrency && isIssuedInvoice(invoice)
  );
  const financeExpenseRows = (operationalSnapshot.expenses || []).filter((expense: any) =>
    String(expense.currency || 'IDR').toUpperCase() === financeCurrency && isDashboardExpenseEligible(expense)
  );
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
    if (String(expense.currency || 'IDR').toUpperCase() !== financeCurrency || String(expense.date || '').slice(0, 7) !== currentMonthKey || !isDashboardExpenseEligible(expense)) return sum;
    return sum + Math.max(0, Number(expense.amount) || 0);
  }, 0);
  const cashValueAvailable = operationalSnapshot.invoices !== null && issuedInvoicesInSelectedCurrency.length > 0;
  const outstandingValueAvailable = operationalSnapshot.invoices !== null && issuedInvoicesInSelectedCurrency.length > 0;
  const expensesValueAvailable = operationalSnapshot.expenses !== null && financeExpenseRows.length > 0;

  return (
    <AdminPageShell featureSlug="dashboard-module" className="ams-dashboard">
      <AdminModuleHeader slug="dashboard-header"
        className="mb-0"
        eyebrow={view === 'overview' ? 'Overview' : view === 'performance' ? 'Performance' : 'Analytics'}
        title="Dashboard"
        description={view === 'overview'
          ? 'Coordinate creative production, web and IT delivery, task ownership, delivery dates, and current Finance control.'
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
        className="space-y-3 rounded-card border border-line bg-panel px-4 py-3 sm:px-5"
        data-ams-feature-slug="dashboard-overview-reporting-scope"
        aria-label="Overview reporting scope"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-fg">Operating scope</p>
            <p className="mt-1 text-xs text-muted">{reportPeriodEnabled ? reportPeriodLabel : 'Current agency workload · all recorded dates'}</p>
          </div>
          <p className="max-w-3xl text-xs leading-5 text-muted">
            Task ownership, review queues, delivery commitments and Finance balances show current operational state. Delivery deadlines cover overdue items and the next 30 days. The shared reporting period applies to Performance and Analytics trends. Recorded time follows that selected period, but open task counts and project states remain current. Finance control values use the current month or current receivable balances. No capacity, approval or client SLA is inferred when its source is unavailable.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 border-t border-line pt-3 sm:grid-cols-2 min-[1100px]:grid-cols-4">
          <div className="min-w-0">
            <p className="text-[10px] leading-4 text-muted">Operational queues</p>
            <p className="mt-1 text-xs font-medium text-fg">Current open records</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] leading-4 text-muted">Delivery window</p>
            <p className="mt-1 text-xs font-medium text-fg">Overdue and next 30 days</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] leading-4 text-muted">Recorded time</p>
            <p className="mt-1 text-xs font-medium text-fg">{reportPeriodEnabled ? reportPeriodLabel : 'All recorded dates'}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] leading-4 text-muted">Finance control</p>
            <p className="mt-1 text-xs font-medium text-fg">Current month · current receivables</p>
          </div>
        </div>
      </section>

      <section className="space-y-3" data-ams-feature-slug="dashboard-attention-center" aria-label="Needs attention">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-fg">Needs attention</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Cross-module exceptions and incoming work that may need action. Open the owning workspace for the canonical record.</p>
        </div>
        <div className="grid min-w-0 gap-3 min-[1100px]:grid-cols-12">
          <section className={['min-w-0', canOpenInbox ? 'min-[1100px]:col-span-6' : 'min-[1100px]:col-span-12'].join(' ')} data-ams-feature-slug="dashboard-priority-exceptions" aria-label="Priority exceptions">
        <AdminPanel
          title="Priority exceptions"
          description="Cross-module issues returned by the authorized Dashboard service. Use the owning workspace for the underlying record."
          bodyClassName="p-0"
        >
          {!dashboardOverview.attentionItemsDataAvailable ? (
            <div className="px-4 py-5" role="status">
              <p className="text-xs font-medium text-fg">{dashboardOverview.loading ? 'Loading cross-module exceptions' : 'Cross-module exception data unavailable'}</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">The Dashboard service did not return a usable exception list. This is not interpreted as a clean operational state.</p>
            </div>
          ) : (dashboardOverview.attentionItems || []).length === 0 ? (
            <div className="px-4 py-5" role="status">
              <p className="text-xs font-medium text-fg">{canOpenInbox ? 'No other cross-module exceptions returned' : 'No exceptions returned by the Dashboard service'}</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">{canOpenInbox ? 'Inbound records are reviewed separately below using the canonical Inbox source.' : 'Task and milestone queues below are still calculated from their own current source records.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {overviewAttentionItems.map((item, index) => {
                const severity = String(item.severity || 'info').toLowerCase();
                const tone: DashboardTone = severity === 'danger' || severity === 'critical'
                  ? 'danger'
                  : severity === 'warning'
                    ? 'warning'
                    : 'info';
                const category = String(item.category || 'Operations');
                const knownDestinationCandidates: Record<string, string[]> = {
                  att_invoices_overdue: ['/admin/finance?tab=accounts-receivable'],
                  att_projects_risk: ['/admin/projects?projects=all', '/admin/projects?projects=planning-delivery', '/admin/projects?projects=sprint'],
                  att_tasks_overdue: ['/admin/tasks?taskscope=due', '/admin/projects?projects=planning-delivery', '/admin/projects?projects=sprint'],
                  att_leads_new: ['/admin/inbox?view=messages']
                };
                const candidates = knownDestinationCandidates[String(item.id || '')] || [String(item.linkUrl || '')];
                const safeDestination = candidates.find((candidate) => candidate.startsWith('/admin/') && canOpenDashboardRoute(candidate)) || null;
                const linkLabel = category === 'Finance'
                  ? 'Open receivables'
                  : category === 'Sales'
                    ? 'Open Inbox'
                    : category === 'Delivery'
                      ? 'Open delivery work'
                      : 'Review workspace';
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
                      <span className="inline-flex min-h-9 shrink-0 items-center text-[11px] text-muted">Destination not mapped to an authorized workspace</span>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </AdminPanel>
      </section>

      {canOpenInbox ? (
        <section className="min-w-0 min-[1100px]:col-span-6" data-ams-feature-slug="dashboard-inbox-triage" aria-label="Inbound inquiry triage">
          <AdminPanel
            title="Inbound triage"
            description="Open inbound records that are new, unassigned or high priority. Careers applicants are kept in the Careers workspace."
            bodyClassName="p-0"
            actions={(
              <Link to="/admin/inbox?view=messages" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                Open Inbox <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            )}
          >
            {inboxTriageSummary.state === 'loading' ? (
              <div className="px-4 py-5" role="status">
                <p className="text-xs font-medium text-fg">Loading inbound records</p>
                <p className="mt-1 text-[11px] leading-5 text-muted">Waiting for the same server-backed lead source used by Inbox. No queue total is inferred while it loads.</p>
              </div>
            ) : inboxTriageSummary.state === 'unavailable' ? (
              <div className="px-4 py-5" role="status">
                <p className="text-xs font-medium text-fg">Inbound triage unavailable</p>
                <p className="mt-1 text-[11px] leading-5 text-muted">The Inbox source did not return records. Assignment, priority and empty state cannot be verified from the dashboard summary alone.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
                  {[
                    { label: 'Open records', value: inboxTriageSummary.openCount },
                    { label: 'New', value: inboxTriageSummary.newCount },
                    { label: 'Unassigned', value: inboxTriageSummary.unassignedCount },
                    { label: 'High priority', value: inboxTriageSummary.highPriorityCount }
                  ].map((metric) => (
                    <div key={metric.label} className="min-w-0 bg-panel px-3 py-3 sm:px-4">
                      <p className="text-[10px] leading-4 text-muted">{metric.label}</p>
                      <p className="mt-1 text-base font-semibold tabular-nums text-fg">{metric.value}</p>
                    </div>
                  ))}
                </div>
                {inboxTriageSummary.actionable.length === 0 ? (
                  <div className="px-4 py-5" role="status">
                    <p className="text-xs font-medium text-fg">No inbound records need immediate triage</p>
                    <p className="mt-1 text-[11px] leading-5 text-muted">No open record is new, unassigned or high priority. Closed records and Careers applicants are excluded. The counts above come from the current Inbox source.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {inboxTriageSummary.actionable.slice(0, 5).map((lead) => {
                      const priority = lead.priority === 'urgent' || lead.priority === 'high';
                      const assignedTo = String(lead.assignedTo || '').trim();
                      const services = Array.isArray(lead.services) ? lead.services.filter(Boolean).slice(0, 2).join(' · ') : '';
                      const received = isValidDashboardDate(dateKey(lead.createdAt)) ? formatDashboardDate(dateKey(lead.createdAt)) : 'Date not recorded';
                      return (
                        <article key={lead.id} className="flex min-w-0 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="break-words text-xs font-semibold text-fg">{lead.fullName || 'Inbound contact'}</p>
                              <span className={['rounded-badge border px-2 py-0.5 text-[10px] font-medium', toneClasses[lead.status === 'new' ? 'warning' : 'info']].join(' ')}>{lead.status || 'Status unavailable'}</span>
                              {priority ? <span className={['rounded-badge border px-2 py-0.5 text-[10px] font-medium', toneClasses[lead.priority === 'urgent' ? 'danger' : 'warning']].join(' ')}>{lead.priority === 'urgent' ? 'Urgent' : 'High priority'}</span> : null}
                            </div>
                            <p className="mt-1 break-words text-[11px] text-muted">{lead.company || 'Company not provided'}{services ? ' · ' + services : ''}</p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                            <span className={['text-[11px]', assignedTo ? 'text-muted' : 'font-medium text-warning'].join(' ')}>{assignedTo || 'Unassigned'}</span>
                            <span className="text-[11px] tabular-nums text-muted">{received}</span>
                          </div>
                        </article>
                      );
                    })}
                    {inboxTriageSummary.actionable.length > 5 ? (
                      <div className="px-4 py-3 text-[11px] text-muted">
                        Showing 5 of {inboxTriageSummary.actionable.length} actionable inbound records, ordered by priority and age.
                      </div>
                    ) : null}
                    <div className="border-t border-line px-4 py-3 text-[10px] leading-5 text-muted">
                      Triage counts can overlap: a record can be new, unassigned and high priority at once. These are source-backed indicators, not mutually exclusive totals or a second record store.
                    </div>
                  </div>
                )}
              </>
            )}
          </AdminPanel>
        </section>
      ) : null}
        </div>
      </section>

      <section className="space-y-3" data-ams-feature-slug="dashboard-agency-operating-indicators" aria-label="Agency operating indicators">
        <AdminMetricStrip
          slug="dashboard-agency-operating-kpis"
          className="grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1100px]:grid-cols-5"
          metrics={[
            {
              id: 'active-projects', label: 'Projects in delivery',
              value: canOpenProjects && activeProjectsMetric != null ? String(activeProjectsMetric) : '—',
              context: !canOpenProjects ? 'Not available to this role' : projectSourceAvailable ? 'Open canonical project records' : dashboardOverview.metrics?.activeProjects != null ? 'Dashboard summary · source detail unavailable' : 'Project source unavailable',
              sourceLabel: 'Projects',
              href: projectKpiRoute || undefined,
              linkLabel: projectKpiRoute ? 'Open project workspace' : undefined,
              icon: <FolderKanban size={15} />, toneClassName: 'text-fg', slug: 'dashboard-active-projects'
            },
            {
              id: 'open-tasks', label: 'Open tasks',
              value: canOpenTasks && activeTaskCount != null ? String(activeTaskCount) : '—',
              context: !canOpenTasks ? 'Not available to this role' : operationalSnapshot.tasks !== null ? 'Tasks not yet completed' : 'Task source unavailable',
              sourceLabel: 'Tasks & Execution',
              href: taskKpiRoute || undefined,
              linkLabel: taskKpiRoute ? 'Open task queue' : undefined,
              icon: <CheckCircle2 size={15} />, toneClassName: 'text-fg', slug: 'dashboard-open-tasks'
            },
            {
              id: 'overdue-tasks', label: 'Overdue tasks',
              value: canOpenTasks && overdueTaskCount != null ? String(overdueTaskCount) : '—',
              context: !canOpenTasks ? 'Not available to this role' : operationalSnapshot.tasks !== null ? 'Open tasks past due date' : 'Task source unavailable',
              sourceLabel: 'Tasks & Execution',
              href: canOpenTasks ? '/admin/tasks?taskscope=due' : undefined,
              linkLabel: canOpenTasks ? 'Review due work' : undefined,
              icon: <AlertTriangle size={15} />, toneClassName: overdueTaskCount ? 'text-danger' : 'text-fg', slug: 'dashboard-overdue-tasks'
            },
            {
              id: 'review-queue', label: 'Tasks in review',
              value: canOpenTasks && reviewTaskCount != null ? String(reviewTaskCount) : '—',
              context: !canOpenTasks ? 'Not available to this role' : operationalSnapshot.tasks !== null ? 'Waiting in the review status' : 'Task source unavailable',
              sourceLabel: 'Tasks & Execution',
              href: canOpenTasks ? '/admin/tasks?taskscope=review' : undefined,
              linkLabel: canOpenTasks ? 'Open review queue' : undefined,
              icon: <Eye size={15} />, toneClassName: reviewTaskCount ? 'text-warning' : 'text-fg', slug: 'dashboard-review-queue'
            },
            {
              id: 'delivery-dates', label: 'Delivery dates · next 7 days',
              value: canOpenProjects && operationalSnapshot.projects !== null ? String(nextSevenDayCommitmentCount) : '—',
              context: !canOpenProjects ? 'Not available to this role' : operationalSnapshot.projects !== null ? 'Open milestones and project targets' : 'Milestone source unavailable',
              sourceLabel: 'Projects · milestones',
              href: canOpenProjects ? '/admin/projects?projects=planning-delivery&planningView=milestones' : undefined,
              linkLabel: canOpenProjects ? 'Review milestones' : undefined,
              icon: <CalendarDays size={15} />, toneClassName: nextSevenDayCommitmentCount ? 'text-warning' : 'text-fg', slug: 'dashboard-delivery-dates'
            }
          ]}
        />
      </section>

      <section className="space-y-3" data-ams-feature-slug="dashboard-delivery-desk" aria-label="Agency delivery desk">
        <div className="grid min-w-0 gap-3 min-[1100px]:grid-cols-12">
          <AdminPanel
            className="min-w-0 min-[1100px]:col-span-8"
            title="Delivery queue"
            description="Live tasks from Tasks & Execution, ordered by overdue state, blockers, priority, review status, ownership and due date. This is a working queue, not a second task store."
            bodyClassName="p-0"
            actions={canOpenTasks ? (
              <Link
                to={overviewTaskQueueHref}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Open {overviewTaskFilter === 'review' ? 'review queue' : overviewTaskFilter === 'overdue' ? 'due tasks' : overviewTaskFilter === 'blocked' ? 'blocked tasks' : 'Tasks'} <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            ) : undefined}
          >
            <div className="border-b border-line px-3 py-3 sm:px-4">
              <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Delivery queue filters">
                {([
                  { key: 'action', label: 'Action needed', count: taskQueueCounts.action },
                  { key: 'review', label: 'Review', count: taskQueueCounts.review },
                  { key: 'overdue', label: 'Overdue', count: taskQueueCounts.overdue },
                  { key: 'blocked', label: 'Blocked', count: taskQueueCounts.blocked },
                  { key: 'unassigned', label: 'Unassigned', count: taskQueueCounts.unassigned }
                ] as Array<{ key: DashboardTaskFilter; label: string; count: number }>).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={overviewTaskFilter === tab.key}
                    disabled={!canOpenTasks}
                    onClick={() => setOverviewTaskFilter(tab.key)}
                    className={[
                      'inline-flex min-h-9 shrink-0 items-center gap-2 rounded-control border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50',
                      overviewTaskFilter === tab.key ? 'border-accent/25 bg-accent/10 text-fg' : 'border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg'
                    ].join(' ')}
                  >
                    {tab.label}
                    <span className="rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] tabular-nums">{canOpenTasks && operationalSnapshot.tasks !== null ? tab.count : '—'}</span>
                  </button>
                ))}
              </div>
            </div>
            {operationalSnapshot.tasks === null ? (
              <div className="p-4"><DashboardUnavailable title="Task queue unavailable" description="The canonical task source did not return data for this role. Queue counts and owner assignments are not inferred." /></div>
            ) : dashboardWorkTasks.length === 0 ? (
              <div className="px-4 py-8" role="status">
                <p className="text-xs font-semibold text-fg">No task records returned</p>
                <p className="mt-1 text-xs text-muted">Tasks & Execution returned an empty task register. Create or import work from the canonical Tasks workspace when appropriate.</p>
              </div>
            ) : activeDashboardTasks.length === 0 ? (
              <div className="px-4 py-8" role="status">
                <p className="text-xs font-semibold text-fg">All returned tasks are complete</p>
                <p className="mt-1 text-xs text-muted">The canonical task register contains no open work items.</p>
              </div>
            ) : visibleOverviewTasks.length === 0 ? (
              <div className="px-4 py-8" role="status">
                <p className="text-xs font-semibold text-fg">No tasks match this queue</p>
                <p className="mt-1 text-xs text-muted">Change the queue filter to inspect a different task state.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {visibleOverviewTasks.map((task) => {
                  const overdue = dashboardTaskIsOverdue(task, currentDayKey);
                  const dueSoon = dashboardTaskIsDueSoon(task, currentDayKey, nextSevenDaysKey);
                  const taskQueueDestination = task.blocked
                    ? '/admin/tasks?taskscope=blocked'
                    : task.status === 'review' || task.status === 'in_review'
                      ? '/admin/tasks?taskscope=review'
                      : overdue || dueSoon
                        ? '/admin/tasks?taskscope=due'
                        : '/admin/tasks';
                  const dueLabel = !task.dueDate
                    ? 'No due date'
                    : overdue
                      ? 'Overdue · ' + formatDashboardDate(task.dueDate)
                      : task.dueDate === currentDayKey
                        ? 'Due today'
                        : dueSoon
                          ? 'Due · ' + formatDashboardDate(task.dueDate)
                          : formatDashboardDate(task.dueDate);
                  return (
                    <article key={task.id} className="flex min-w-0 flex-col gap-3 px-4 py-3 sm:px-5 min-[900px]:flex-row min-[900px]:items-center" data-ams-task-id={task.id}>
                      <span className={['mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control border', toneClasses[overdue ? 'danger' : task.blocked ? 'warning' : dashboardTaskPriorityTone(task.priority)]].join(' ')}>
                        {task.blocked || overdue ? <AlertTriangle size={14} aria-hidden="true" /> : task.status === 'review' || task.status === 'in_review' ? <Eye size={14} aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-xs font-semibold text-fg">{task.title}</p>
                        <p className="mt-1 break-words text-[11px] leading-5 text-muted">
                          {task.projectName}{task.clientName ? ' · ' + task.clientName : ''}{task.serviceCategory ? ' · ' + task.serviceCategory : ''}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className={['inline-flex items-center rounded-badge border px-2 py-0.5 text-[10px] font-medium', toneClasses[dashboardTaskPriorityTone(task.priority)]].join(' ')}>{task.priority.toUpperCase()}</span>
                          <span className="inline-flex items-center rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">{dashboardTaskStatusLabel(task.status)}</span>
                          {task.blocked ? <span className="inline-flex items-center rounded-badge border border-danger/25 bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">Blocked</span> : null}
                          {!task.assigned ? <span className="inline-flex items-center rounded-badge border border-warning/25 bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">Unassigned</span> : null}
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-col gap-1 sm:w-44 sm:shrink-0 sm:items-end">
                        <span className="text-[11px] font-medium text-fg">{task.assigneeLabel}</span>
                        <span className={['text-[11px] tabular-nums', overdue ? 'font-semibold text-danger' : dueSoon ? 'font-medium text-warning' : 'text-muted'].join(' ')}>{dueLabel}</span>
                        {canOpenTasks && canOpenDashboardRoute(taskQueueDestination) ? (
                          <Link to={taskQueueDestination} className="inline-flex min-h-8 items-center gap-1 text-[11px] font-medium text-muted hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                            Open task queue <ArrowUpRight size={12} aria-hidden="true" />
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {canOpenTasks && activeDashboardTasks.length > visibleOverviewTasks.length && visibleOverviewTasks.length > 0 ? (
              <div className="border-t border-line px-4 py-3 text-[11px] text-muted">
                Showing {visibleOverviewTasks.length} highest-priority tasks from {activeDashboardTasks.length} open records in Tasks & Execution.
              </div>
            ) : null}
          </AdminPanel>

          <AdminPanel
            className="min-w-0 min-[1100px]:col-span-4"
            title="Creative & IT workstreams"
            description="Project groupings use each saved service category. Unrecognized or missing categories stay visible under Other / Unclassified."
            bodyClassName="p-0"
          >
            {!canOpenProjects ? (
              <div className="p-4"><DashboardUnavailable title="Workstream data unavailable to this role" description="Project categories and workstream counts are hidden when the current role cannot open Projects." /></div>
            ) : operationalSnapshot.projects === null ? (
              <div className="p-4"><DashboardUnavailable title="Workstream data unavailable" description="The canonical project source did not return project categories for this role." /></div>
            ) : rawProjectRows.length === 0 ? (
              <div className="px-4 py-8" role="status">
                <p className="text-xs font-semibold text-fg">No project records returned</p>
                <p className="mt-1 text-xs text-muted">Workstream counts are not estimated from task titles or placeholder categories.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {serviceLineSummaries.map((line) => (
                  <div key={line.key} className="px-4 py-4 sm:px-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted">{line.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-xs font-semibold text-fg">{line.label}</h3>
                          <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] tabular-nums text-muted">{line.projectCount} projects</span>
                        </div>
                        <p className="mt-1 text-[11px] leading-5 text-muted">{line.description}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2 min-[900px]:grid-cols-3">
                          {[
                            { label: 'Active projects', value: operationalSnapshot.projects !== null && canOpenProjects ? line.projectCount : null },
                            { label: 'Open tasks', value: operationalSnapshot.tasks !== null && canOpenTasks ? line.openTaskCount : null },
                            { label: 'Tasks in review', value: operationalSnapshot.tasks !== null && canOpenTasks ? line.reviewTaskCount : null },
                            { label: 'Blocked tasks', value: operationalSnapshot.tasks !== null && canOpenTasks ? line.blockedTaskCount : null },
                            { label: 'Unassigned tasks', value: operationalSnapshot.tasks !== null && canOpenTasks ? line.unassignedTaskCount : null },
                            { label: 'Overdue tasks', value: operationalSnapshot.tasks !== null && canOpenTasks ? line.overdueTaskCount : null },
                            { label: 'Projects with overdue delivery', value: operationalSnapshot.projects !== null && canOpenProjects ? line.overdueCommitmentCount : null }
                          ].map((metric) => (
                            <div key={metric.label} className="min-w-0 rounded-control border border-line bg-bg px-3 py-2">
                              <p className="text-[10px] leading-4 text-muted">{metric.label}</p>
                              <p className="mt-1 text-sm font-semibold tabular-nums text-fg">{metric.value == null ? '—' : metric.value}</p>
                            </div>
                          ))}
                        </div>
                        {(!canOpenTasks || operationalSnapshot.tasks === null) ? (
                          <p className="mt-2 text-[10px] leading-4 text-muted">Task-state breakdown is unavailable for this role or source.</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {canOpenProjects ? (
              <div className="border-t border-line px-4 py-3">
                <Link to="/admin/projects?projects=all" className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-muted hover:text-accent-text">
                  Open Project Registry <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              </div>
            ) : null}
          </AdminPanel>
        </div>
      </section>

      <section className="space-y-3" data-ams-feature-slug="dashboard-delivery-commitments" aria-label="Delivery commitments and resource load">
        <div className="grid min-w-0 gap-3 min-[1100px]:grid-cols-12">
          <AdminPanel
            className="min-w-0 min-[1100px]:col-span-7"
            title="Upcoming milestones & delivery deadlines"
            description="Open milestone and project target dates due today, overdue, or within the next 30 days. Project records remain owned by Projects."
            bodyClassName="p-0"
            actions={canOpenProjects ? (
              <Link to="/admin/projects?projects=planning-delivery&planningView=milestones" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                Open Planning & Delivery <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            ) : undefined}
          >
            {operationalSnapshot.projects === null ? (
              <div className="p-4"><DashboardUnavailable title="Delivery schedule unavailable" description="Project and milestone records were not returned for the current role. Deadlines are not inferred." /></div>
            ) : rawProjectRows.length === 0 ? (
              <div className="px-4 py-8" role="status">
                <p className="text-xs font-semibold text-fg">No project records returned</p>
                <p className="mt-1 text-xs text-muted">No milestones or delivery commitments can be derived from an empty project source.</p>
              </div>
            ) : upcomingCommitments.length === 0 ? (
              <div className="px-4 py-8" role="status">
                <p className="text-xs font-semibold text-fg">No dated commitments due in the next 30 days</p>
                <p className="mt-1 text-xs text-muted">No open milestone or project target dates were returned within this window. Missing dates are not estimated.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {upcomingCommitments.map((item) => {
                  const overdue = item.dueDate < currentDayKey;
                  const dueTone: DashboardTone = overdue ? 'danger' : item.dueDate === currentDayKey ? 'warning' : 'info';
                  const projectHref = item.projectHref;
                  const projectRouteAvailable = Boolean(projectHref && canOpenProjects && canOpenDashboardRoute(projectHref));
                  return (
                    <article key={item.id} className="flex min-w-0 flex-col gap-2 px-4 py-3 sm:px-5 sm:flex-row sm:items-center">
                      <span className={['inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control border', toneClasses[dueTone]].join(' ')}><CalendarDays size={14} aria-hidden="true" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold text-fg">{item.title}</p>
                          <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">{item.kind}</span>
                          <span className={['rounded-badge border px-2 py-0.5 text-[10px] font-medium', toneClasses[dueTone]].join(' ')}>{overdue ? 'Overdue' : item.dueDate === currentDayKey ? 'Due today' : item.dueDate <= nextSevenDaysKey ? 'Due this week' : 'Upcoming'}</span>
                        </div>
                        <p className="mt-1 break-words text-[11px] text-muted">{item.projectName}{item.clientName ? ' · ' + item.clientName : ''}{item.serviceCategory ? ' · ' + item.serviceCategory : ''}</p>
                        <p className="mt-1 text-[11px] text-muted">{item.owner}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                        <span className={['text-xs tabular-nums', overdue ? 'font-semibold text-danger' : 'font-medium text-fg'].join(' ')}>{formatDashboardDate(item.dueDate)}</span>
                        {projectRouteAvailable && projectHref ? <Link to={projectHref} className="inline-flex min-h-8 items-center gap-1 text-[11px] font-medium text-muted hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Open project <ArrowUpRight size={12} aria-hidden="true" /></Link> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {operationalSnapshot.projects !== null && rawProjectRows.length > 0 && upcomingCommitments.length > 0 && (overdueCommitmentCount || 0) > 0 ? (
              <div className="border-t border-line px-4 py-3 text-[11px] text-muted">
                {overdueCommitmentCount} open milestone or project deadline records are past due across active projects.
              </div>
            ) : null}
          </AdminPanel>

          <AdminPanel
            className="min-w-0 min-[1100px]:col-span-5"
            title="Assigned work & logged time"
            description="Task counts show assignment load; logged hours show recorded activity. Neither is a forecast of available capacity."
            bodyClassName="p-4 sm:p-5"
          >
            <div className="space-y-4">
              <div data-ams-feature-slug="dashboard-task-load-by-owner">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-xs font-semibold text-fg">Open tasks by owner</h3>
                  {canOpenTasks ? <Link to="/admin/tasks" className="text-[11px] font-medium text-muted hover:text-accent-text">View tasks <ArrowUpRight size={12} aria-hidden="true" /></Link> : null}
                </div>
                {operationalSnapshot.tasks === null ? (
                  <p className="text-xs text-muted" role="status">Task assignment data unavailable.</p>
                ) : taskLoadByAssignee.length === 0 ? (
                  <p className="text-xs text-muted" role="status">No open task assignments in the current source.</p>
                ) : (
                  <div className="space-y-3">
                    {taskLoadByAssignee.map((owner) => (
                      <div key={owner.label} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate text-xs font-medium text-fg">{owner.label}</span>
                          <span className="shrink-0 text-xs tabular-nums text-muted">{owner.total} open</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">{owner.overdue} overdue</span>
                          <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">{owner.blocked} blocked</span>
                          <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">{owner.review} in review</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-line pt-4" data-ams-feature-slug="dashboard-recorded-time-by-person">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-xs font-semibold text-fg">Recorded time</h3>
                  <span className="text-[10px] text-muted">{reportPeriodEnabled ? reportPeriodLabel : 'All recorded dates'}</span>
                </div>
                <p className="mb-3 text-[11px] leading-5 text-muted">Logged time is actual recorded activity, not remaining capacity or billable revenue.</p>
                {operationalSnapshot.timeLogs === null ? (
                  <p className="text-xs text-muted" role="status">Time-log source unavailable.</p>
                ) : periodTimeRows.length === 0 ? (
                  <p className="text-xs text-muted" role="status">No time records returned for this reporting scope.</p>
                ) : (
                  <div className="space-y-2.5">
                    {periodTimeRows.map((person) => (
                      <div key={person.name} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-xs text-fg">{person.name}</span>
                        <span className="shrink-0 text-xs tabular-nums text-muted">{Math.floor(person.minutes / 60)}h {person.minutes % 60}m · {person.entries} entries</span>
                      </div>
                    ))}
                  </div>
                )}
                {canOpenTimeLogs ? <Link to="/admin/time-logs" className="mt-3 inline-flex min-h-8 items-center gap-1 text-xs font-medium text-muted hover:text-accent-text">Open Time Logs <ArrowUpRight size={13} aria-hidden="true" /></Link> : null}
              </div>
            </div>
          </AdminPanel>
        </div>
      </section>

      <section data-ams-feature-slug="dashboard-client-delivery-focus" aria-label="Client delivery focus">
        <AdminPanel
          title="Client delivery focus"
          description="Current delivery workload grouped by Client Directory ID when linked. Saved company-name grouping is a fallback for legacy records without a client ID. This is delivery context, not a client health, contract or SLA score."
          bodyClassName="p-0"
          actions={canOpenProjects ? (
            <Link to="/admin/projects?projects=all" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              Open project delivery <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          ) : undefined}
        >
          {!canOpenProjects ? (
            <div className="p-4"><DashboardUnavailable title="Client-linked delivery unavailable to this role" description="Client-linked project summaries are hidden when the current role cannot open Projects." /></div>
          ) : operationalSnapshot.projects === null ? (
            <div className="p-4"><DashboardUnavailable title="Client delivery data unavailable" description="The project source did not return records for the current role. Client delivery counts are not inferred." /></div>
          ) : clientDeliveryFocus.length === 0 ? (
            <div className="px-4 py-8" role="status">
              <p className="text-xs font-semibold text-fg">No client-linked delivery records</p>
              <p className="mt-1 text-xs text-muted">No active project or open task contains a saved client name. This does not indicate client health or service status.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {clientDeliveryFocus.map((client) => (
                <article key={client.key} className="min-w-0 space-y-3 px-4 py-4 sm:px-5">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      {client.clientRecordAvailable && canOpenClientDirectory && client.clientId ? (
                        <Link to={'/admin/clients/all-clients?client=' + encodeURIComponent(client.clientId)} className="inline-flex items-center gap-1 break-words text-xs font-semibold text-fg hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                          {client.name} <ArrowUpRight size={12} aria-hidden="true" />
                        </Link>
                      ) : (
                        <h3 className="break-words text-xs font-semibold text-fg">{client.name}</h3>
                      )}
                      <p className="mt-1 text-[10px] text-muted">{client.clientIdentityLabel}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {client.serviceLines.map((line) => (
                          <span key={line} className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">{line}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                      <span className="text-muted">{client.projectCount} active projects</span>
                      <span className={client.overdueCommitmentCount > 0 ? 'font-medium text-danger' : 'text-muted'}>{client.overdueCommitmentCount} overdue commitments</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 min-[900px]:grid-cols-4">
                    {[
                      { label: 'Open tasks', value: client.openTaskCount },
                      { label: 'Tasks in review', value: client.reviewTaskCount },
                      { label: 'Blocked tasks', value: client.blockedTaskCount },
                      { label: 'Overdue tasks', value: client.overdueTaskCount }
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-control border border-line bg-bg px-3 py-2">
                        <p className="text-[10px] leading-4 text-muted">{metric.label}</p>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-fg">{metric.value == null ? '—' : metric.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {client.projects.slice(0, 3).map((project, index) => project.href && canOpenDashboardRoute(project.href) ? (
                        <Link key={project.href} to={project.href} className="inline-flex min-h-8 items-center gap-1 text-[11px] font-medium text-muted hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                          {project.name} <ArrowUpRight size={11} aria-hidden="true" />
                        </Link>
                      ) : (
                        <span key={project.href || project.name + '-' + index} className="inline-flex min-h-8 items-center text-[11px] text-muted">{project.name}</span>
                      ))}
                      {client.projects.length > 3 ? <span className="inline-flex min-h-8 items-center text-[11px] text-muted">+{client.projects.length - 3} more projects</span> : null}
                    </div>
                    <p className="shrink-0 text-[11px] text-muted">
                      {client.nextCommitmentDate
                        ? 'Next due ' + formatDashboardDate(client.nextCommitmentDate)
                        : client.overdueCommitmentCount > 0
                          ? 'No future date · overdue work remains'
                          : 'No dated commitment in the next 30 days'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </AdminPanel>
      </section>

      {(canOpenInvoiceRegister || canOpenExpenseRegister) ? (
        <section data-ams-feature-slug="dashboard-finance-control" aria-label="Finance control summary">
          <AdminPanel
            title="Finance control"
            description={'Current financial snapshot · ' + currentMonthKey + ' · ' + financeCurrency + '. Finance owns posted accounting truth; Dashboard summarizes canonical records.'}
            bodyClassName="p-4 sm:p-5"
          >
            <div className="grid gap-3 min-[900px]:grid-cols-3">
              {canOpenInvoiceRegister ? (
                <div className="min-w-0 rounded-control border border-line bg-bg p-4">
                  <p className="text-xs font-medium text-muted">Cash received this month</p>
                  <p className="mt-2 text-xl font-semibold tabular-nums text-fg">{cashValueAvailable && liveCashCollected !== null ? formatLiveMoney(liveCashCollected, financeCurrency) : '—'}</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">{operationalSnapshot.invoices === null ? 'Invoice/payment source unavailable.' : cashValueAvailable ? 'Payments recorded against issued invoices in the current month.' : 'No issued invoice records are available to confirm a cash total.'}</p>
                  <Link to="/admin/finance?tab=accounts-receivable" className="mt-3 inline-flex min-h-8 items-center gap-1 text-[11px] font-medium text-muted hover:text-accent-text">Open Accounts Receivable <ArrowUpRight size={12} aria-hidden="true" /></Link>
                </div>
              ) : null}
              {canOpenInvoiceRegister ? (
                <div className="min-w-0 rounded-control border border-line bg-bg p-4">
                  <p className="text-xs font-medium text-muted">Outstanding receivables</p>
                  <p className="mt-2 text-xl font-semibold tabular-nums text-fg">{outstandingValueAvailable && liveOutstanding !== null ? formatLiveMoney(liveOutstanding, financeCurrency) : '—'}</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">{operationalSnapshot.invoices === null ? 'Invoice source unavailable.' : outstandingValueAvailable ? 'Current balances on issued invoices; not filtered by reporting period.' : 'No issued invoice records are available to confirm an open balance.'}</p>
                  <Link to="/admin/finance?tab=accounts-receivable" className="mt-3 inline-flex min-h-8 items-center gap-1 text-[11px] font-medium text-muted hover:text-accent-text">Open receivables <ArrowUpRight size={12} aria-hidden="true" /></Link>
                </div>
              ) : null}
              {canOpenExpenseRegister ? (
                <div className="min-w-0 rounded-control border border-line bg-bg p-4">
                  <p className="text-xs font-medium text-muted">Recorded expenses this month</p>
                  <p className="mt-2 text-xl font-semibold tabular-nums text-fg">{expensesValueAvailable && liveMonthlyExpenses !== null ? formatLiveMoney(liveMonthlyExpenses, financeCurrency) : '—'}</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">{operationalSnapshot.expenses === null ? 'Expense source unavailable.' : expensesValueAvailable ? 'Eligible expenses by recorded date in the current month.' : 'No eligible expense records are available to confirm a monthly total.'}</p>
                  <Link to="/admin/finance?tab=expenses" className="mt-3 inline-flex min-h-8 items-center gap-1 text-[11px] font-medium text-muted hover:text-accent-text">Open expenses <ArrowUpRight size={12} aria-hidden="true" /></Link>
                </div>
              ) : null}
            </div>
          </AdminPanel>
        </section>
      ) : null}

      <section data-ams-feature-slug="dashboard-workspace-shortcuts" aria-label="Workspace shortcuts">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xs font-semibold text-fg">Continue in a workspace</h2>
          <p className="text-[11px] text-muted">Open the canonical record surface</p>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1100px]:grid-cols-5">
          {[
            { label: 'Tasks & Execution', icon: <CheckCircle2 size={14} />, href: '/admin/tasks' },
            { label: 'Project Planning', icon: <CalendarDays size={14} />, href: '/admin/projects?projects=planning-delivery' },
            { label: 'Time Logs', icon: <Clock3 size={14} />, href: '/admin/time-logs' },
            { label: 'Accounts Receivable', icon: <ReceiptText size={14} />, href: '/admin/finance?tab=accounts-receivable' },
            { label: 'Documents', icon: <FileText size={14} />, href: '/admin/documents' }
          ].filter((action) => canOpenDashboardRoute(action.href)).map((action) => (
            <Link key={action.label} to={action.href} className="flex min-h-10 min-w-0 items-center gap-2 rounded-control border border-line bg-bg px-3 text-xs font-medium text-fg transition-colors hover:border-accent/30 hover:bg-panel-hover hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              <span className="shrink-0 text-muted">{action.icon}</span>
              <span className="min-w-0 truncate">{action.label}</span>
              <ArrowUpRight size={12} className="ml-auto shrink-0 text-muted" aria-hidden="true" />
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
          canOpenInbox={canOpenInbox}
        />
      )}
    </AdminPageShell>
  );
};

export default GlobalExecutiveDashboard;