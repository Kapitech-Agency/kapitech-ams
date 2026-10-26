import React, { useEffect, useMemo, useState } from 'react';
import './GlobalExecutiveDashboard.css';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
import { formatReportingPeriodLabel, getReportingPeriodRange, getReportingYearOptions, type ReportingPeriodMode } from '../../lib/reportingPeriods';
import { getInvoiceDate, getInvoiceOutstanding, getPaymentRows, isIssuedInvoice } from '../../lib/financeWorkbook';
import { isInboxActionable, isInboxHighPriority, isInboxUnassigned } from '../../lib/inboxTriage';
import { normalizeContactSubmission, type ContactSubmission } from '../../lib/submissions';

const DASHBOARD_WORKSPACE_VIEWS = ['overview', 'performance', 'analytics'] as const;
type DashboardWorkspaceView = (typeof DASHBOARD_WORKSPACE_VIEWS)[number];
type DashboardTone = 'success' | 'warning' | 'danger' | 'info';
type DashboardTaskFilter = 'action' | 'review' | 'overdue' | 'blocked' | 'unassigned';
type DashboardProjectFilter = 'all' | 'creative' | 'technology';
type DashboardDeadlineFilter = 'all' | 'overdue' | 'next7' | 'days8to30';
type DashboardQuotationStatus = 'draft' | 'review' | 'approved' | 'sent' | 'accepted' | 'rejected';
type DashboardQuotationFilter = 'all' | 'review' | 'approved' | 'sent' | 'draft';

type DashboardQuotation = {
  id: string;
  quotationNumber: string;
  title: string;
  clientName: string;
  clientCompany: string;
  total: number | null;
  currency: string;
  status: DashboardQuotationStatus;
  validUntil: string;
  createdAt: string;
  owner: string;
  invoiceId: string;
};

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

const normalizeDashboardQuotationStatus = (value: unknown): DashboardQuotationStatus => {
  switch (String(value || '').trim().toLowerCase()) {
    case 'review':
    case 'internal review':
    case 'internal_review':
      return 'review';
    case 'approved':
      return 'approved';
    case 'sent':
      return 'sent';
    case 'accepted':
      return 'accepted';
    case 'rejected':
      return 'rejected';
    default:
      return 'draft';
  }
};

const normalizeDashboardQuotation = (raw: any): DashboardQuotation => {
  const rawTotal = raw?.total ?? raw?.subtotal;
  const parsedTotal = rawTotal === null || rawTotal === undefined || rawTotal === '' ? Number.NaN : Number(rawTotal);
  return {
    id: String(raw?.id || ''),
    quotationNumber: String(raw?.proposalNumber || raw?.quotationNumber || ''),
    title: String(raw?.title || 'Untitled quotation'),
    clientName: String(raw?.clientName || raw?.name || ''),
    clientCompany: String(raw?.clientCompany || raw?.company || ''),
    total: Number.isFinite(parsedTotal) ? parsedTotal : null,
    currency: String(raw?.currency || 'IDR').toUpperCase() === 'USD' ? 'USD' : 'IDR',
    status: normalizeDashboardQuotationStatus(raw?.status),
    validUntil: String(raw?.validUntil || raw?.validityPeriod || '').slice(0, 10),
    createdAt: String(raw?.createdAt || raw?.createdDate || ''),
    owner: String(raw?.owner || 'Finance'),
    invoiceId: String(raw?.invoiceId || raw?.invoice?.id || '').trim()
  };
};

const dashboardQuotationStatusLabel = (status: DashboardQuotationStatus) => ({
  draft: 'Draft',
  review: 'Internal review',
  approved: 'Approved · ready for invoice',
  sent: 'Sent to client',
  accepted: 'Accepted',
  rejected: 'Rejected'
}[status]);

const dashboardAttentionSeverityRank = (severity: unknown) => {
  const normalized = String(severity || 'info').toLowerCase();
  if (normalized === 'danger' || normalized === 'critical') return 0;
  if (normalized === 'warning') return 1;
  return 2;
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
  quotations: any[] | null;
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

const getAdjacentReportingPeriodValue = (value: string, mode: ReportingPeriodMode, offset: number): string => {
  const range = getReportingPeriodRange(value, mode);
  if (!range || !Number.isInteger(offset)) return value;
  if (mode === 'year') return String(range.year + offset);
  if (mode === 'month') {
    const [year, month] = range.startMonth.split('-').map(Number);
    const next = new Date(year, month - 1 + offset, 1);
    return String(next.getFullYear()) + '-' + String(next.getMonth() + 1).padStart(2, '0');
  }
  const match = /^(\d{4})-Q([1-4])$/.exec(value);
  if (!match) return value;
  const absoluteQuarter = Number(match[1]) * 4 + Number(match[2]) - 1 + offset;
  const year = Math.floor(absoluteQuarter / 4);
  const quarter = ((absoluteQuarter % 4) + 4) % 4 + 1;
  return String(year) + '-Q' + quarter;
};

const getDashboardSavedProgress = (project: any): number | null => {
  const rawValue = project?.progressPercent;
  if (rawValue === null || rawValue === undefined || (typeof rawValue === 'string' && !rawValue.trim())) return null;
  const normalized = typeof rawValue === 'string' ? rawValue.trim().replace(/%$/, '') : rawValue;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value) : null;
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

type DashboardEmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  tone?: 'neutral' | 'success';
};

const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  eyebrow,
  title,
  description,
  icon = <FileText size={17} aria-hidden="true" />,
  action,
  compact = true,
  tone = 'neutral'
}) => (
  <div className={[
    'ams-dashboard-empty',
    compact ? 'ams-dashboard-empty--compact' : '',
    tone === 'success' ? 'ams-dashboard-empty--success' : ''
  ].filter(Boolean).join(' ')} role="status">
    <span className="ams-dashboard-empty__icon" aria-hidden="true">{icon}</span>
    <div className="ams-dashboard-empty__content">
      <p className="ams-dashboard-empty__eyebrow">{eyebrow}</p>
      <p className="ams-dashboard-empty__title">{title}</p>
      <p className="ams-dashboard-empty__description">{description}</p>
      {action ? <div className="ams-dashboard-empty__action">{action}</div> : null}
    </div>
  </div>
);

const DashboardUnavailable: React.FC<{ title: string; description: string; compact?: boolean }> = ({ title, description, compact = false }) => (
  <div
    className={compact ? 'ams-dashboard-state ams-dashboard-state--compact' : 'flex min-h-[180px] flex-col items-center justify-center rounded-card border border-line bg-panel px-5 py-8 text-center'}
    role="status"
  >
    <span className={compact ? 'ams-dashboard-state__icon' : undefined} aria-hidden="true">
      <AlertTriangle size={compact ? 16 : 20} className={compact ? undefined : 'text-muted'} />
    </span>
    <div className={compact ? 'min-w-0 flex-1' : undefined}>
      <p className={compact ? 'text-xs font-semibold text-fg' : 'mt-3 text-xs font-semibold text-fg'}>{title}</p>
      <p className={compact ? 'mt-1 max-w-full break-words text-[11px] leading-4 text-muted' : 'mt-1 max-w-md text-[11px] leading-5 text-muted'}>{description}</p>
    </div>
  </div>
);


const PerformanceView: React.FC<{
  snapshot: DashboardOperationalSnapshot;
  matchesDate: (value: unknown) => boolean;
  matchesInterval: (startValue: unknown, endValue?: unknown, fallbackValue?: unknown) => boolean;
  reportPeriodLabel: string;
  reportPeriodEnabled: boolean;
  reportPeriodValue: string;
  reportPeriodMode: ReportingPeriodMode;
}> = ({ snapshot, matchesDate, matchesInterval, reportPeriodLabel, reportPeriodEnabled, reportPeriodValue, reportPeriodMode }) => {
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
  const maxMemberTimeMinutes = Math.max(1, ...workload.map((member) => member.minutes));
  const totalTrackedMinutes = scopedTimeLogs.reduce(
    (total: number, log: any) => total + Math.max(0, Number(log.durationMinutes ?? log.minutes ?? 0) || 0),
    0
  );
  const trackedTimeEntryCount = scopedTimeLogs.length;
  const timeTrendModel = useMemo(() => {
    type TimeTrendBucket = { key: string; label: string; startDate: string; endDate: string; minutes: number; entries: number };
    const buckets: TimeTrendBucket[] = [];
    const dateFor = (year: number, month: number, day: number) =>
      String(year) + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    const addMonth = (year: number, month: number, label: string) => {
      const startDate = dateFor(year, month, 1);
      const endDate = dateFor(year, month, new Date(year, month, 0).getDate());
      buckets.push({ key: startDate.slice(0, 7), label, startDate, endDate, minutes: 0, entries: 0 });
    };
    const selectedRange = reportPeriodEnabled ? getReportingPeriodRange(reportPeriodValue, reportPeriodMode, 'en-GB') : null;
    if (selectedRange && reportPeriodMode === 'month') {
      const year = Number(selectedRange.startDate.slice(0, 4));
      const month = Number(selectedRange.startDate.slice(5, 7));
      const monthEndDay = Number(selectedRange.endDate.slice(8, 10));
      for (let startDay = 1; startDay <= monthEndDay; startDay += 7) {
        const endDay = Math.min(monthEndDay, startDay + 6);
        buckets.push({ key: dateFor(year, month, startDay), label: startDay + '–' + endDay, startDate: dateFor(year, month, startDay), endDate: dateFor(year, month, endDay), minutes: 0, entries: 0 });
      }
    } else if (selectedRange) {
      const [startYear, startMonth] = selectedRange.startMonth.split('-').map(Number);
      const [endYear, endMonth] = selectedRange.endMonth.split('-').map(Number);
      for (let year = startYear, month = startMonth; year < endYear || (year === endYear && month <= endMonth); month += 1) {
        if (month > 12) { year += 1; month = 1; }
        const label = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(new Date(year, month - 1, 1));
        addMonth(year, month, label);
      }
    } else {
      const now = new Date();
      for (let offset = 11; offset >= 0; offset -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        addMonth(date.getFullYear(), date.getMonth() + 1, new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit' }).format(date));
      }
    }
    let datedEntriesInWindow = 0;
    let entriesWithoutUsableDate = 0;
    scopedTimeLogs.forEach((log: any) => {
      const loggedDate = dateKey(log.date || log.createdAt);
      if (!isValidDashboardDate(loggedDate)) { entriesWithoutUsableDate += 1; return; }
      const bucket = buckets.find((candidate) => loggedDate >= candidate.startDate && loggedDate <= candidate.endDate);
      if (!bucket) return;
      bucket.minutes += Math.max(0, Number(log.durationMinutes ?? log.minutes ?? 0) || 0);
      bucket.entries += 1;
      datedEntriesInWindow += 1;
    });
    return {
      rows: buckets,
      points: datedEntriesInWindow ? buckets.map((bucket) => ({ label: bucket.label, primary: bucket.minutes / 60 })) : [],
      datedEntriesInWindow,
      entriesWithoutUsableDate,
      chartScope: selectedRange ? reportPeriodLabel : 'Recent 12 months'
    };
  }, [reportPeriodEnabled, reportPeriodMode, reportPeriodValue, reportPeriodLabel, scopedTimeLogs]);

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
        <p className="text-[11px] leading-4 text-muted">Tasks use due dates, projects use scheduled overlap, and time uses logged dates. Statuses are current snapshots, not history.</p>
      </section>

      <section data-ams-feature-slug="dashboard-performance-supporting-metrics" aria-label="Performance summary metrics">
        <AdminMetricStrip slug="dashboard-performance-kpis" metrics={[
          {
            id: 'performance-completion',
            label: 'Task completion',
            value: completionValue,
            icon: <CheckCircle2 size={15} />,
            toneClassName: completedTasks > 0 && completedTasks === tasks.length ? 'text-success' : undefined,
            context: snapshot.tasks === null ? 'Task source unavailable' : tasks.length ? completedTasks + ' of ' + tasks.length + ' in-scope tasks completed' : 'No task records in scope'
          },
          {
            id: 'performance-overdue',
            label: 'Overdue tasks',
            value: overdueValue,
            icon: <CalendarDays size={15} />,
            toneClassName: 'text-danger',
            context: snapshot.tasks !== null ? 'Open tasks past their due date' : 'Task source unavailable'
          },
          {
            id: 'performance-blocked',
            label: 'Blocked tasks',
            value: blockedValue,
            icon: <AlertTriangle size={15} />,
            toneClassName: 'text-warning',
            context: snapshot.tasks !== null ? 'Current blocked status in scope' : 'Task source unavailable'
          },
          {
            id: 'performance-projects',
            label: 'Active projects',
            value: activeProjectValue,
            icon: <FolderKanban size={15} />,
            context: snapshot.projects !== null ? 'Current projects overlapping the period' : 'Project source unavailable'
          },
        ]} />
      </section>

      <section className="grid gap-4 min-[1100px]:grid-cols-2" data-ams-feature-slug="dashboard-performance-primary">
        <AdminPanel
          title="Task status in scope"
          description="Task status mix for the selected period."
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
                  <p className="text-xs font-semibold text-fg">Current task distribution</p>
                  <p className="mt-1 text-[11px] text-muted">{tasks.length} task records in the selected scope</p>
                </div>
                <span className="inline-flex min-h-7 items-center rounded-badge border border-line bg-bg px-2.5 text-[10px] text-muted">
                  Current status · not status history
                </span>
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
                      <div className="h-3 overflow-hidden rounded-full bg-line">
                        <div className={'h-full rounded-full ' + status.tone} style={{ width: percentage + '%' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] leading-4 text-muted">Current status · selected date scope</p>
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

      <AdminPanel title="Recorded time" bodyClassName="p-4 sm:p-5">
        {snapshot.timeLogs === null ? <DashboardUnavailable title="Time records unavailable" description="The time tracking source did not return records." /> : scopedTimeLogs.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted" role="status">{allTimeLogs.length > 0 ? 'No time entries in the selected period.' : 'No time entries recorded.'}</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted">{reportPeriodEnabled ? reportPeriodLabel : 'All dates'} · hours by period and contributor</p>
              <div className="flex flex-wrap gap-2">
                <div className="rounded-control border border-line bg-bg px-3 py-2"><p className="text-[10px] text-muted">Total hours</p><p className="mt-0.5 text-lg font-semibold tabular-nums text-fg">{(totalTrackedMinutes / 60).toLocaleString('en-US', { maximumFractionDigits: 1 })}h</p></div>
                <div className="rounded-control border border-line bg-bg px-3 py-2"><p className="text-[10px] text-muted">Entries</p><p className="mt-0.5 text-lg font-semibold tabular-nums text-fg">{trackedTimeEntryCount}</p></div>
              </div>
            </div>
            <div className="grid min-w-0 gap-6 min-[1100px]:grid-cols-12">
              <section className="min-w-0 min-[1100px]:col-span-7" aria-label="Recorded hours over time">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-semibold text-fg">Hours over time</h3><span className="text-[10px] text-muted">{timeTrendModel.chartScope}</span></div>
                {timeTrendModel.points.length ? (
                  <>
                    <TrendChart data={timeTrendModel.points} primaryLabel="Logged hours" primaryFormat={(value) => (Math.round(value * 10) / 10).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'h'} ariaLabel={'Recorded hours over time for ' + timeTrendModel.chartScope + '. Exact values are available in the period table.'} />
                    <details className="mt-3 rounded-control border border-line bg-bg px-3 py-2">
                      <summary className="cursor-pointer text-xs font-medium text-fg">View exact period values</summary>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-[240px] text-xs">
                          <thead className="text-muted"><tr><th className="py-2 text-left font-medium">Period</th><th className="py-2 text-right font-medium">Hours</th><th className="py-2 text-right font-medium">Entries</th></tr></thead>
                          <tbody>{timeTrendModel.rows.map((row) => <tr key={row.key} className="border-t border-line"><th scope="row" className="py-2 text-left font-medium text-fg">{row.label}</th><td className="py-2 text-right tabular-nums text-fg">{(row.minutes / 60).toLocaleString('en-US', { maximumFractionDigits: 2 })}h</td><td className="py-2 text-right tabular-nums text-muted">{row.entries}</td></tr>)}</tbody>
                        </table>
                      </div>
                    </details>
                  </>
                ) : (
                  <div className="rounded-control border border-line bg-bg px-3 py-4" role="status"><p className="text-xs font-medium text-fg">No dated time entries in this chart window</p><p className="mt-1 text-[11px] text-muted">Total hours still covers the selected scope outside this chart window.</p></div>
                )}
                {timeTrendModel.entriesWithoutUsableDate > 0 ? <p className="mt-2 text-[10px] leading-4 text-muted">{timeTrendModel.entriesWithoutUsableDate} entries without a usable date remain in total hours but are not plotted.</p> : null}
              </section>
              <section className="min-w-0 min-[1100px]:col-span-5" aria-label="Recorded time by contributor">
                <h3 className="mb-3 text-xs font-semibold text-fg">By contributor</h3>
                {workload.length === 0 ? <p className="text-xs text-muted" role="status">No contributor totals to compare.</p> : (
                  <div className="space-y-4">
                    {workload.map((member) => {
                      const shareWidth = Math.max(0, Math.min(100, (member.minutes / maxMemberTimeMinutes) * 100));
                      return <div key={member.name} className="min-w-0 space-y-1.5">
                        <div className="flex min-w-0 items-start justify-between gap-3"><span className="min-w-0 break-words text-xs font-medium text-fg">{member.name}</span><span className="shrink-0 text-xs tabular-nums text-muted">{Math.floor(member.minutes / 60)}h {member.minutes % 60}m</span></div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-line" role="img" aria-label={member.name + ': ' + Math.floor(member.minutes / 60) + ' hours and ' + member.minutes % 60 + ' minutes recorded'}><div className="h-full rounded-full bg-series-3 transition-[width]" style={{ width: shareWidth + '%' }} /></div>
                      </div>;
                    })}
                  </div>
                )}
                <p className="mt-3 text-[10px] leading-4 text-muted">Top eight contributors by recorded time. Bars compare within this list only.</p>
              </section>
            </div>
          </div>
        )}
      </AdminPanel>


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
  const projectStatusMaximum = Math.max(1, ...projectStatusGroups.map((group) => group.count));
  const projectStatusTotal = snapshot.projects?.length ?? 0;

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
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-xs font-semibold text-fg">Analytics reports</p>
            </div>
            <div role="group" aria-label="Analytics report" className="grid min-w-0 grid-cols-2 gap-2 min-[900px]:grid-cols-4">
              {DASHBOARD_ANALYTICS_REPORT_OPTIONS.filter((option) => option.value !== 'inquiry-pipeline' || canOpenInbox).map((option) => {
                const active = report === option.value;
                const ReportIcon = option.value === 'financial-movement'
                  ? CircleDollarSign
                  : option.value === 'receivables'
                    ? ReceiptText
                    : option.value === 'inquiry-pipeline'
                      ? Users
                      : FolderKanban;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setReport(option.value)}
                    className={[
                      'flex min-h-12 min-w-0 items-center gap-2.5 rounded-control border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      active ? 'border-accent/35 bg-accent/10 text-fg' : 'border-line bg-bg text-muted hover:bg-panel hover:text-fg',
                    ].join(' ')}
                  >
                    <span className={[
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control border',
                      active ? 'border-accent/25 bg-accent/10 text-accent-text' : 'border-line bg-panel text-muted',
                    ].join(' ')}>
                      <ReportIcon size={15} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words text-xs font-semibold leading-4">{option.label}</span>
                    </span>
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
        <p className="mt-3 border-t border-line pt-3 text-[10px] leading-4 text-muted">Trend charts follow the reporting period; All dates defaults to the recent 30 days. Receivables and status remain current.</p>
      </section>

      {report === 'financial-movement' ? (
        <section className="space-y-3" data-ams-feature-slug="dashboard-analytics-financial-report" aria-label="Financial movement report">
          <AdminPanel
            title="Issued invoices vs recorded expenses"
            description="Issued invoices vs recorded expenses by date; difference is not posted profit."
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
                    <p className="mt-1 text-[11px] text-muted">Exact values behind the chart.</p>
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
                  Invoice buckets use issue date; Expense buckets use recorded date. The difference is an arithmetic comparison, not posted profit.
                </p>
              </>
            )}
          </AdminPanel>
        </section>
      ) : report === 'receivables' ? (
        <section className="space-y-3" data-ams-feature-slug="dashboard-analytics-receivables-report" aria-label="Receivables report">
          <AdminPanel
            title="Outstanding receivables"
            description="Current outstanding balance from issued invoices."
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
            description="Current inquiry status and requested service demand."
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
                <div className="grid grid-cols-1 gap-2 min-[600px]:grid-cols-3">
                  <div className="min-w-0 rounded-control border border-line bg-bg p-3">
                    <p className="text-[10px] leading-4 text-muted">Active projects</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-fg">{activeProjects}</p>
                    <p className="mt-1 text-[10px] text-muted">Current portfolio</p>
                  </div>
                  <div className="min-w-0 rounded-control border border-line bg-bg p-3">
                    <p className="text-[10px] leading-4 text-muted">Project records</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-fg">{projectStatusTotal}</p>
                    <p className="mt-1 text-[10px] text-muted">All saved states</p>
                  </div>
                  <div className="min-w-0 rounded-control border border-line bg-bg p-3">
                    <p className="text-[10px] leading-4 text-muted">Status groups</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-fg">{projectStatusGroups.length}</p>
                    <p className="mt-1 text-[10px] text-muted">Current labels</p>
                  </div>
                </div>
                <div className="space-y-3" aria-label="Project distribution by current status">
                  <div>
                    <h3 className="text-sm font-semibold text-fg">Projects by current status</h3>
                    <p className="mt-1 text-[11px] text-muted">Each project appears in one saved status group.</p>
                  </div>
                  {projectStatusGroups.map((group) => {
                    const percentage = projectStatusTotal > 0 ? Math.round((group.count / projectStatusTotal) * 100) : 0;
                    const width = Math.max(0, Math.min(100, (group.count / projectStatusMaximum) * 100));
                    return (
                      <div key={group.status} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 break-words text-xs font-medium text-fg">{group.status}</span>
                          <span className="shrink-0 text-xs tabular-nums text-muted">{group.count} <span className="text-[10px]">· {percentage}%</span></span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-line" role="img" aria-label={group.status + ': ' + group.count + ' projects, ' + percentage + ' percent of current project records'}>
                          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: width + '%' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="border-t border-line pt-3 text-[11px] leading-5 text-muted">
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
  const canOpenQuotationRegister = canOpenDashboardRoute('/admin/finance?tab=quotations');
  const canCreateProject = canManageProjects && canOpenDashboardRoute('/admin/projects?create=1');
  const canOpenProjects = canOpenDashboardRoute('/admin/projects');
  const canOpenInbox = canOpenDashboardRoute('/admin/inbox');
  const canOpenClientDirectory = canOpenDashboardRoute('/admin/clients/all-clients');
  const canOpenTasks = canOpenDashboardRoute('/admin/tasks');
  const canCreateInvoice = hasAdminPermission('canManageInvoices') && canOpenInvoiceRegister;
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
  const {
    matchesDate,
    matchesInterval,
    value: reportPeriodValue,
    mode: reportPeriodMode,
    enabled: reportPeriodEnabled,
    setMode: setReportingPeriodMode,
    setValue: setReportingPeriodValue,
    clearFilter: clearReportingPeriodFilter
  } = useReportingPeriod();
  const selectedReportingRange = getReportingPeriodRange(reportPeriodValue, reportPeriodMode, 'en-GB');
  const reportPeriodLabel = reportPeriodEnabled && selectedReportingRange
    ? selectedReportingRange.label + ' (' + selectedReportingRange.startDate + ' – ' + selectedReportingRange.endDate + ')'
    : 'All dates';
  const reportingPeriodOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = getReportingYearOptions(currentYear, [], selectedReportingRange?.year ?? currentYear);
    return years.flatMap((year) => {
      if (reportPeriodMode === 'year') {
        const value = String(year);
        return [{ value, label: formatReportingPeriodLabel(value, reportPeriodMode, 'en-GB') }];
      }
      if (reportPeriodMode === 'quarter') {
        return [1, 2, 3, 4].map((quarter) => {
          const value = String(year) + '-Q' + quarter;
          return { value, label: formatReportingPeriodLabel(value, reportPeriodMode, 'en-GB') };
        });
      }
      return Array.from({ length: 12 }, (_, index) => {
        const value = String(year) + '-' + String(index + 1).padStart(2, '0');
        return { value, label: formatReportingPeriodLabel(value, reportPeriodMode, 'en-GB') };
      });
    }).sort((left, right) => right.value.localeCompare(left.value));
  }, [reportPeriodMode, selectedReportingRange?.year]);
  const previousReportingPeriodValue = getAdjacentReportingPeriodValue(reportPeriodValue, reportPeriodMode, -1);
  const nextReportingPeriodValue = getAdjacentReportingPeriodValue(reportPeriodValue, reportPeriodMode, 1);
  const canMoveToPreviousPeriod = reportPeriodEnabled && reportingPeriodOptions.some((option) => option.value === previousReportingPeriodValue);
  const canMoveToNextPeriod = reportPeriodEnabled && reportingPeriodOptions.some((option) => option.value === nextReportingPeriodValue);
  const overviewPeriodDisplay = reportPeriodEnabled && selectedReportingRange ? selectedReportingRange.label : 'Recent 30 days';
  const [overviewTaskFilter, setOverviewTaskFilter] = useState<DashboardTaskFilter>('action');
  const [overviewProjectFilter, setOverviewProjectFilter] = useState<DashboardProjectFilter>('all');
  const [overviewDeadlineFilter, setOverviewDeadlineFilter] = useState<DashboardDeadlineFilter>('all');
  const [overviewQuotationFilter, setOverviewQuotationFilter] = useState<DashboardQuotationFilter>('all');
  const [dashboardOverview, setDashboardOverview] = useState<{ metrics?: any; financials?: any; projects?: any[]; attentionItems?: DashboardAttentionItem[]; attentionItemsDataAvailable?: boolean; recentActivity?: DashboardRecentActivity[]; recentActivityDataAvailable?: boolean; projectDataAvailable?: boolean; stale?: boolean; source: 'server' | 'ab'; loading: boolean }>({ source: 'ab', loading: true });
  const [operationalSnapshot, setOperationalSnapshot] = useState<DashboardOperationalSnapshot>({
    loading: true, projects: null, clients: null, inboxLeads: null, tasks: null, timeLogs: null, invoices: null, expenses: null, quotations: null
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
      canOpenInbox ? api.leads.getAll() : Promise.resolve({ success: true, data: { leads: [] } }),
      canOpenQuotationRegister ? api.proposals.getAll() : Promise.resolve({ success: true, data: { proposals: [] } })
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
      const quotations = canOpenQuotationRegister ? readRows(results[8], 'proposals') : null;

      if (projects === null) failedSources.push('projects');
      if (tasks === null) failedSources.push('tasks');
      if (timeLogs === null) failedSources.push('time logs');
      if (invoices === null) failedSources.push('invoices');
      if (expenses === null) failedSources.push('expenses');
      if (canOpenClientDirectory && clients === null) failedSources.push('client directory');
      if (canOpenInbox && inboxLeads === null) failedSources.push('inbox leads');
      if (canOpenQuotationRegister && quotations === null) failedSources.push('quotations');

      setOperationalSnapshot((previous) => ({
        loading: false,
        projects: projects ?? previous.projects,
        clients: canOpenClientDirectory ? clients ?? previous.clients : null,
        inboxLeads: canOpenInbox ? inboxLeads ?? previous.inboxLeads : null,
        tasks: tasks ?? previous.tasks,
        timeLogs: timeLogs ?? previous.timeLogs,
        invoices: invoices ?? previous.invoices,
        expenses: expenses ?? previous.expenses,
        quotations: canOpenQuotationRegister ? quotations ?? previous.quotations : null
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
  }, [refreshRequest, canOpenClientDirectory, canOpenInbox, canOpenQuotationRegister]);

  const financeCurrency = String(dashboardOverview.financials?.currency || dashboardOverview.metrics?.currency || 'IDR').toUpperCase();
  const currentDayKey = localDateKey(new Date());
  const overviewFinancialPeriodStart = reportPeriodEnabled && selectedReportingRange
    ? selectedReportingRange.startDate
    : shiftDashboardDate(currentDayKey, -29);
  const overviewFinancialPeriodEnd = reportPeriodEnabled && selectedReportingRange
    ? selectedReportingRange.endDate
    : currentDayKey;
  const matchesOverviewFinancialPeriod = (value: unknown) => {
    const day = dateKey(value);
    return isValidDashboardDate(day) && day >= overviewFinancialPeriodStart && day <= overviewFinancialPeriodEnd;
  };
  const nextThreeDaysKey = shiftDashboardDate(currentDayKey, 3);
  const nextSevenDaysKey = shiftDashboardDate(currentDayKey, 7);
  const nextThirtyDaysKey = shiftDashboardDate(currentDayKey, 30);

  const projectSourceAvailable = operationalSnapshot.projects !== null;
  const rawProjectRows = operationalSnapshot.projects || [];
  const activeProjectRows = rawProjectRows.filter((project: any) => !isFinishedWork(project.status) && !isFinishedWork(project.health));
  const openProjectCount = projectSourceAvailable ? activeProjectRows.length : null;

  const dashboardQuotationRows = useMemo<DashboardQuotation[]>(() => {
    if (!Array.isArray(operationalSnapshot.quotations)) return [];
    return operationalSnapshot.quotations
      .map(normalizeDashboardQuotation)
      .filter((quotation) => quotation.currency === financeCurrency && Boolean(quotation.id));
  }, [operationalSnapshot.quotations, financeCurrency]);

  const activeDashboardQuotations = useMemo(
    () => dashboardQuotationRows.filter((quotation) =>
      ['draft', 'review', 'sent'].includes(quotation.status) ||
      (quotation.status === 'approved' && !quotation.invoiceId)
    ),
    [dashboardQuotationRows]
  );

  const dashboardQuotationFilterCounts = {
    all: activeDashboardQuotations.length,
    review: activeDashboardQuotations.filter((quotation) => quotation.status === 'review').length,
    approved: activeDashboardQuotations.filter((quotation) => quotation.status === 'approved' && !quotation.invoiceId).length,
    sent: activeDashboardQuotations.filter((quotation) => quotation.status === 'sent').length,
    draft: activeDashboardQuotations.filter((quotation) => quotation.status === 'draft').length
  };

  const filteredDashboardQuotations = activeDashboardQuotations
    .filter((quotation) => overviewQuotationFilter === 'all' || quotation.status === overviewQuotationFilter)
    .slice()
    .sort((left, right) => {
      const validityRank = (quotation: DashboardQuotation) => {
        if (!isValidDashboardDate(quotation.validUntil)) return 3;
        if (quotation.validUntil < currentDayKey) return 0;
        if (quotation.validUntil <= nextSevenDaysKey) return 1;
        return 2;
      };
      const validityDifference = validityRank(left) - validityRank(right);
      if (validityDifference !== 0) return validityDifference;
      const leftValidity = isValidDashboardDate(left.validUntil) ? left.validUntil : '9999-12-31';
      const rightValidity = isValidDashboardDate(right.validUntil) ? right.validUntil : '9999-12-31';
      const validityDateDifference = leftValidity.localeCompare(rightValidity);
      if (validityDateDifference !== 0) return validityDateDifference;
      const statusRank = (status: DashboardQuotationStatus) => status === 'review' ? 0 : status === 'approved' ? 1 : status === 'sent' ? 2 : 3;
      return statusRank(left.status) - statusRank(right.status) ||
        left.clientCompany.localeCompare(right.clientCompany) ||
        left.title.localeCompare(right.title);
    });

  const visibleDashboardQuotations = filteredDashboardQuotations.slice(0, 3);

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
    // Keep the exception API as the source of truth, but order the visible queue by severity.
    // Stable sort preserves server ordering among items with the same severity.
    const allowedItems = canOpenInbox
      ? items.filter((item) => String(item.category || '').toLowerCase() !== 'sales' && item.id !== 'att_leads_new')
      : items;
    return [...allowedItems].sort((left, right) =>
      dashboardAttentionSeverityRank(left.severity) - dashboardAttentionSeverityRank(right.severity)
    );
  }, [canOpenInbox, dashboardOverview.attentionItems]);

  const attentionSeveritySummary = useMemo(() => {
    const counts = { total: overviewAttentionItems.length, urgent: 0, attention: 0, other: 0 };
    for (const item of overviewAttentionItems) {
      const severity = String(item.severity || 'info').toLowerCase();
      if (severity === 'danger' || severity === 'critical') counts.urgent += 1;
      else if (severity === 'warning') counts.attention += 1;
      else counts.other += 1;
    }
    return counts;
  }, [overviewAttentionItems]);

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
  const workstreamOpenTaskMaximum = Math.max(0, ...serviceLineSummaries.map((line) => line.openTaskCount));

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
        (right.unassignedTaskCount ?? -1) - (left.unassignedTaskCount ?? -1) ||
        (right.reviewTaskCount ?? -1) - (left.reviewTaskCount ?? -1) ||
        (left.nextCommitmentDate || '9999-12-31').localeCompare(right.nextCommitmentDate || '9999-12-31') ||
        (right.openTaskCount ?? -1) - (left.openTaskCount ?? -1) ||
        right.projectCount - left.projectCount ||
        left.name.localeCompare(right.name)
      )
      .slice(0, 5);
  }, [activeDashboardTasks, activeProjectRows, allUpcomingCommitments, canOpenClientDirectory, canOpenProjects, canOpenTasks, clientDirectoryById, currentDayKey, operationalSnapshot.projects, operationalSnapshot.tasks]);
  const clientDeliveryOpenTaskMaximum = Math.max(1, ...clientDeliveryFocus.map((client) => client.openTaskCount ?? 0));

  const upcomingCommitments = allUpcomingCommitments.filter((item) => {
    if (overviewDeadlineFilter === 'overdue') return item.dueDate < currentDayKey;
    if (overviewDeadlineFilter === 'next7') return item.dueDate >= currentDayKey && item.dueDate <= nextSevenDaysKey;
    if (overviewDeadlineFilter === 'days8to30') return item.dueDate > nextSevenDaysKey && item.dueDate <= nextThirtyDaysKey;
    return true;
  }).slice(0, 8);
  const commitmentHorizonTotal = allUpcomingCommitments.length;
  const overdueHorizonCount = allUpcomingCommitments.filter((item) => item.dueDate < currentDayKey).length;
  const nextSevenDayCommitmentCount = allUpcomingCommitments.filter((item) => item.dueDate >= currentDayKey && item.dueDate <= nextSevenDaysKey).length;
  const daysEightToThirtyCommitmentCount = allUpcomingCommitments.filter((item) => item.dueDate > nextSevenDaysKey && item.dueDate <= nextThirtyDaysKey).length;
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
  const taskLoadByAssigneeMaximum = Math.max(1, ...taskLoadByAssignee.map((owner) => owner.total));

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
  const periodTimeRowsMaximum = Math.max(1, ...periodTimeRows.map((person) => person.minutes));

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
  const livePeriodCashCollected = operationalSnapshot.invoices === null ? null : operationalSnapshot.invoices.reduce((sum: number, invoice: any) => {
    if (String(invoice.currency || 'IDR').toUpperCase() !== financeCurrency || !isIssuedInvoice(invoice)) return sum;
    return sum + getPaymentRows(invoice)
      .filter((payment) => matchesOverviewFinancialPeriod(payment.date))
      .reduce((paymentSum, payment) => paymentSum + Math.max(0, Number(payment.amount) || 0), 0);
  }, 0);
  const liveOutstanding = operationalSnapshot.invoices === null ? null : operationalSnapshot.invoices.reduce((sum: number, invoice: any) => {
    if (String(invoice.currency || 'IDR').toUpperCase() !== financeCurrency || !isIssuedInvoice(invoice)) return sum;
    return sum + getInvoiceOutstanding(invoice);
  }, 0);
  const livePeriodExpenses = operationalSnapshot.expenses === null ? null : operationalSnapshot.expenses.reduce((sum: number, expense: any) => {
    if (String(expense.currency || 'IDR').toUpperCase() !== financeCurrency || !matchesOverviewFinancialPeriod(expense.date || expense.expenseDate || expense.createdAt) || !isDashboardExpenseEligible(expense)) return sum;
    return sum + Math.max(0, Number(expense.amount) || 0);
  }, 0);
  const cashValueAvailable = operationalSnapshot.invoices !== null && issuedInvoicesInSelectedCurrency.length > 0;
  const outstandingValueAvailable = operationalSnapshot.invoices !== null && issuedInvoicesInSelectedCurrency.length > 0;
  const expensesValueAvailable = operationalSnapshot.expenses !== null && financeExpenseRows.length > 0;
  const canOpenFinanceOverview = canOpenInvoiceRegister || canOpenExpenseRegister;
  const overviewFinanceTrendRows = operationalSnapshot.invoices !== null && operationalSnapshot.expenses !== null
    ? reportPeriodEnabled
      ? buildFinancialTrendForReportingPeriod(reportPeriodMode, reportPeriodValue, issuedInvoicesInSelectedCurrency, financeExpenseRows)
      : buildRecentFinancialTrend(issuedInvoicesInSelectedCurrency, financeExpenseRows)
    : [];
  const overviewMoneyMovementRows = operationalSnapshot.invoices !== null && operationalSnapshot.expenses !== null
    ? overviewFinanceTrendRows.map((bucket) => {
        const cashReceived = issuedInvoicesInSelectedCurrency.reduce((sum, invoice) => sum + getPaymentRows(invoice)
          .filter((payment) => {
            const day = dateKey(payment.date);
            return isValidDashboardDate(day) && day >= bucket.startDate && day < bucket.endDate;
          })
          .reduce((paymentSum, payment) => paymentSum + Math.max(0, Number(payment.amount) || 0), 0), 0);
        const recordedExpenses = financeExpenseRows.reduce((sum, expense) => {
          const day = dateKey(expense.date || expense.expenseDate || expense.createdAt);
          if (!isValidDashboardDate(day) || day < bucket.startDate || day >= bucket.endDate) return sum;
          return sum + Math.max(0, Number(expense.amount) || 0);
        }, 0);
        return { ...bucket, cashReceived, recordedExpenses };
      })
    : [];
  const overviewCashMovementMaximum = Math.max(1, ...overviewMoneyMovementRows.map((bucket) => bucket.cashReceived));
  const overviewExpenseMovementMaximum = Math.max(1, ...overviewMoneyMovementRows.map((bucket) => bucket.recordedExpenses));
  const overviewFinanceTrendHasRecords = overviewFinanceTrendRows.some((bucket) => bucket.primary > 0 || bucket.secondary > 0);
  const projectRiskBreakdown: DonutPoint[] = operationalSnapshot.projects === null
    ? []
    : buildProjectDeliveryBreakdown(rawProjectRows).map((item) => ({ label: item.label, value: item.value, tone: item.tone }));
  const orderedActiveDashboardProjects = activeProjectRows.slice().sort((left, right) => {
    const leftDue = dateKey(left.targetEndDate || left.endDate || left.dueDate || left.deadline);
    const rightDue = dateKey(right.targetEndDate || right.endDate || right.dueDate || right.deadline);
    const leftOverdue = isValidDashboardDate(leftDue) && leftDue < currentDayKey;
    const rightOverdue = isValidDashboardDate(rightDue) && rightDue < currentDayKey;
    if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
    const leftRisk = /risk|delay|blocked|hold|issue/.test(String(left.health || left.status || '').toLowerCase());
    const rightRisk = /risk|delay|blocked|hold|issue/.test(String(right.health || right.status || '').toLowerCase());
    if (leftRisk !== rightRisk) return leftRisk ? -1 : 1;
    if (isValidDashboardDate(leftDue) && isValidDashboardDate(rightDue) && leftDue !== rightDue) return leftDue.localeCompare(rightDue);
    if (isValidDashboardDate(leftDue)) return -1;
    if (isValidDashboardDate(rightDue)) return 1;
    return String(left.name || left.title || '').localeCompare(String(right.name || right.title || ''));
  });
  const activeDashboardProjectFilterCounts = {
    all: orderedActiveDashboardProjects.length,
    creative: orderedActiveDashboardProjects.filter((project) => getDashboardServiceLine(project) === 'creative').length,
    technology: orderedActiveDashboardProjects.filter((project) => getDashboardServiceLine(project) === 'technology').length
  };
  const featuredDashboardProjects = orderedActiveDashboardProjects
    .filter((project) => overviewProjectFilter === 'all' || getDashboardServiceLine(project) === overviewProjectFilter)
    .slice(0, 4);

  return (
    <AdminPageShell featureSlug="dashboard-module" className="ams-dashboard">
      <AdminModuleHeader slug="dashboard-header"
        className="mb-0 ams-dashboard-page-header"
        eyebrow={view === 'overview' ? undefined : 'Agency operations'}
        title="Dashboard"
        description={view === 'overview'
          ? undefined
          : view === 'performance'
            ? 'Compare delivery progress, bottlenecks, and recorded team effort over the selected period.'
            : 'Explore supported trends across financial movement, inquiry demand, and portfolio status.'}
        actions={(
          <div
            className="ams-dashboard-header-actions flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end"
            data-ams-feature-slug="dashboard-quick-actions"
            aria-label="Dashboard quick actions"
          >
            {canOpenInvoiceRegister ? (
              <Link
                to={canCreateInvoice ? '/admin/finance?tab=accounts-receivable&action=create-invoice' : '/admin/finance?tab=accounts-receivable'}
                className={[
                  'ams-dashboard-header-action ams-dashboard-header-action--invoice inline-flex min-h-10 items-center justify-center gap-2 rounded-control px-4 text-xs font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  canCreateInvoice
                    ? 'bg-accent text-white hover:-translate-y-px hover:bg-accent-hover'
                    : 'border border-line bg-panel text-fg hover:border-accent/30 hover:bg-panel-hover'
                ].join(' ')}
                aria-label={canCreateInvoice ? 'Create invoice' : 'Open invoices'}
                title={canCreateInvoice ? 'Create a new invoice' : 'Open the invoice register'}
              >
                <ReceiptText size={15} aria-hidden="true" />
                {canCreateInvoice ? 'Create invoice' : 'Invoices'}
              </Link>
            ) : null}
            {canOpenProjects ? (
              <Link
                to={canCreateProject ? '/admin/projects?create=1' : '/admin/projects'}
                className="ams-dashboard-header-action ams-dashboard-header-action--project inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-line bg-panel px-3.5 text-xs font-medium text-fg transition-all duration-150 hover:-translate-y-px hover:border-accent/30 hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label={canCreateProject ? 'Create project' : 'Open projects'}
                title={canCreateProject ? 'Create a new project' : 'Open the Projects workspace'}
              >
                <FolderKanban size={14} aria-hidden="true" />
                {canCreateProject ? 'New project' : 'Projects'}
              </Link>
            ) : null}
            {view === 'overview' ? (
              <nav className="ams-dashboard-header-shortcuts flex min-w-0 flex-wrap items-center gap-1.5" data-ams-feature-slug="dashboard-workspace-shortcuts" aria-label="Dashboard workspace shortcuts">
                {[
                  { label: 'Tasks', icon: <CheckCircle2 size={13} aria-hidden="true" />, href: '/admin/tasks' },
                  { label: 'Clients', icon: <Users size={13} aria-hidden="true" />, href: '/admin/clients/all-clients' },
                  { label: 'Documents', icon: <FileText size={13} aria-hidden="true" />, href: '/admin/documents' }
                ].filter((action) => canOpenDashboardRoute(action.href)).map((action) => (
                  <Link key={action.label} to={action.href} className="ams-dashboard-header-shortcut inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-2.5 text-[11px] font-medium text-muted transition-colors hover:border-accent/30 hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label={'Open ' + action.label} title={'Open ' + action.label}>
                    <span className="shrink-0">{action.icon}</span><span>{action.label}</span>
                  </Link>
                ))}
              </nav>
            ) : null}
            <button
              type="button"
              onClick={() => setRefreshRequest((current) => current + 1)}
              disabled={isRefreshing}
              aria-label="Refresh dashboard data"
              title="Refresh dashboard data"
              className="ams-dashboard-header-action ams-dashboard-header-action--refresh inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-all duration-150 hover:-translate-y-px hover:border-accent/30 hover:bg-panel-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} aria-hidden="true" />
              <span className="hidden min-[440px]:inline">{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          </div>
        )}
      />

      <section className="ams-dashboard-toolbar flex min-w-0 flex-col gap-3 border-b border-line/70 pb-4 xl:flex-row xl:items-center xl:justify-between" data-ams-feature-slug="dashboard-view-and-reporting-controls" aria-label="Dashboard view and reporting controls">
        <nav className="ams-dashboard-view-tabs flex min-w-0 items-center gap-1 overflow-x-auto" aria-label="Dashboard views">
          {([
            { key: 'overview', label: 'Overview' },
            { key: 'performance', label: 'Performance' },
            { key: 'analytics', label: 'Analytics' }
          ] as Array<{ key: DashboardWorkspaceView; label: string }>).map((tab) => (
            <Link
              key={tab.key}
              to={tab.key === 'overview' ? '/admin/dashboard' : '/admin/dashboard?view=' + tab.key}
              aria-current={view === tab.key ? 'page' : undefined}
              className={[
                'ams-dashboard-view-tab inline-flex min-h-10 shrink-0 items-center border-b-2 border-x-0 border-t-0 px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                view === tab.key ? 'is-active border-accent bg-transparent text-fg' : 'border-transparent bg-transparent text-muted hover:border-line hover:bg-transparent hover:text-fg'
              ].join(' ')}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="ams-dashboard-period-controls flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end" aria-label="Reporting period filters">
          <label className="ams-dashboard-period-field flex min-w-0 flex-col gap-1">
            <span className="text-[10px] font-medium text-muted">Group by</span>
            <select aria-label="Reporting period type" value={reportPeriodMode} onChange={(event) => setReportingPeriodMode(event.target.value as ReportingPeriodMode)} className="ams-dashboard-period-select min-h-10 w-full rounded-control border border-line bg-panel px-3 text-xs text-fg outline-none transition-colors hover:border-accent/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:min-w-[120px]">
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </label>
          <label className="ams-dashboard-period-field flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-medium text-muted">Date range</span>
            <span className="ams-dashboard-date-select relative block min-w-0">
              <CalendarDays size={14} className="ams-dashboard-date-select__icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <select aria-label="Reporting date range" value={reportPeriodEnabled ? reportPeriodValue : '__recent_30_days__'} onChange={(event) => {
                if (event.target.value === '__recent_30_days__') clearReportingPeriodFilter();
                else setReportingPeriodValue(event.target.value);
              }} className="ams-dashboard-period-select ams-dashboard-date-select__input min-h-10 w-full rounded-control border border-line bg-panel px-3 text-xs text-fg outline-none transition-colors hover:border-accent/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:min-w-[190px]">
                <option value="__recent_30_days__">Recent 30 days · default</option>
                {reportingPeriodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </span>
          </label>
          <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Previous reporting period" title="Previous period" disabled={!canMoveToPreviousPeriod} onClick={() => setReportingPeriodValue(previousReportingPeriodValue)} className="ams-dashboard-period-step inline-flex h-10 w-10 items-center justify-center rounded-control border border-line bg-panel text-muted transition-colors hover:border-accent/30 hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-35">
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Next reporting period" title="Next period" disabled={!canMoveToNextPeriod} onClick={() => setReportingPeriodValue(nextReportingPeriodValue)} className="ams-dashboard-period-step inline-flex h-10 w-10 items-center justify-center rounded-control border border-line bg-panel text-muted transition-colors hover:border-accent/30 hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-35">
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
          {reportPeriodEnabled ? (
            <button type="button" onClick={clearReportingPeriodFilter} className="ams-dashboard-clear-period inline-flex min-h-10 items-center justify-center rounded-control border border-line px-3 text-xs font-medium text-muted transition-colors hover:border-accent/30 hover:bg-panel hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Clear period</button>
          ) : null}
        </div>
      </section>

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
        <div className="rounded-control border border-warning/25 bg-warning/5 px-3 py-2 text-xs text-muted" role="status" data-ams-feature-slug="dashboard-refresh-warning">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
            <p className="min-w-0 flex-1 leading-5">
              {refreshNotice.startsWith('Could not refresh ')
                ? 'Some dashboard data could not be refreshed.'
                : 'Dashboard refresh failed.'}{' '}
              Previously loaded values remain visible; unavailable sources are not treated as zero.
            </p>
            <details className="min-w-0 max-w-full">
              <summary className="min-h-9 cursor-pointer py-1 font-medium text-warning underline decoration-warning/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                View refresh details
              </summary>
              <p className="mt-1 max-w-full break-words leading-4">{refreshNotice}</p>
            </details>
          </div>
        </div>
      ) : null}

      {view === 'overview' ? (
        <>
          <section className="ams-overview-card-row grid min-w-0 gap-4 min-[1100px]:grid-cols-12" aria-label="Project delivery and exceptions">
            {canOpenProjects ? (
              <section className="min-w-0 min-[1100px]:col-span-7" data-ams-feature-slug="dashboard-project-progress" aria-label="Projects in progress">
                <AdminPanel
                  title="Projects in progress"
                  className="h-full ams-overview-panel ams-overview-panel--list"
                  bodyClassName="p-0"
                  actions={(
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <div className="ams-dashboard-segmented-filter flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-bg p-1" role="group" aria-label="Filter projects by service line">
                        {([
                          { key: 'all', label: 'All', count: activeDashboardProjectFilterCounts.all },
                          { key: 'creative', label: 'Creative', count: activeDashboardProjectFilterCounts.creative },
                          { key: 'technology', label: 'IT', count: activeDashboardProjectFilterCounts.technology }
                        ] as Array<{ key: DashboardProjectFilter; label: string; count: number }>).map((filter) => (
                          <button key={filter.key} type="button" aria-pressed={overviewProjectFilter === filter.key} onClick={() => setOverviewProjectFilter(filter.key)} className={[
                            'inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                            overviewProjectFilter === filter.key ? 'bg-panel text-fg font-semibold' : 'text-muted hover:bg-panel/70 hover:text-fg'
                          ].join(' ')}>
                            {filter.label}
                            <span className="text-[10px] tabular-nums text-muted">{filter.count}</span>
                          </button>
                        ))}
                      </div>
                      <Link to="/admin/projects?projects=all" className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:border-accent/25 hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                        Project registry <ArrowUpRight size={13} aria-hidden="true" />
                      </Link>
                    </div>
                  )}
                >
                  {operationalSnapshot.projects === null ? (
                    <div className="p-4"><DashboardUnavailable title="Project progress unavailable" description="The Projects source did not return current records." compact /></div>
                  ) : featuredDashboardProjects.length === 0 ? (
                    <div className="px-4 py-4"><DashboardEmptyState eyebrow="PROJECT DELIVERY" icon={<FolderKanban size={17} aria-hidden="true" />} title={activeProjectRows.length === 0 ? 'No active projects yet' : 'No projects match this filter'} description={activeProjectRows.length === 0 ? 'Active delivery work will appear here when projects are in progress.' : 'Try All or choose the other service line to see matching projects.'} action={<Link to="/admin/projects?projects=all" className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-fg hover:text-accent-text">Open project registry <ArrowUpRight size={12} aria-hidden="true" /></Link>} /></div>
                  ) : (
                    <div className="divide-y divide-line">
                      {featuredDashboardProjects.map((project) => {
                        const due = dateKey(project.targetEndDate || project.endDate || project.dueDate || project.deadline);
                        const overdue = isValidDashboardDate(due) && due < currentDayKey;
                        const statusText = String(project.status || project.health || 'Status not set');
                        const progress = getDashboardSavedProgress(project);
                        const projectHref = getDashboardProjectHref(project);
                        const projectRouteAvailable = Boolean(projectHref && canOpenDashboardRoute(projectHref));
                        return (
                          <article key={String(project.id || project.slug || project.name)} className="space-y-2.5 px-4 py-3.5 sm:px-5">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                              <div className="min-w-0">
                                {projectRouteAvailable && projectHref ? (
                                  <Link to={projectHref} className="break-words text-xs font-semibold text-fg hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{project.name || project.title || 'Untitled project'} <ArrowUpRight size={11} className="inline" aria-hidden="true" /></Link>
                                ) : (
                                  <p className="break-words text-xs font-semibold text-fg">{project.name || project.title || 'Untitled project'}</p>
                                )}
                                <p className="mt-1 break-words text-[11px] text-muted">{project.clientName || project.clientCompany || project.client || 'Client not linked'}</p>
                              </div>
                              <span className={['shrink-0 rounded-badge border px-2 py-1 text-[10px] font-medium', toneClasses[overdue ? 'danger' : /risk|delay|blocked|hold|issue/i.test(statusText) ? 'warning' : 'info']].join(' ')}>{statusText}</span>
                            </div>
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="min-w-0 flex-1">
                                {progress !== null ? (
                                  <>
                                    <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] text-muted">
                                      <span>Saved progress</span><span className="font-semibold tabular-nums text-fg">{progress}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-line" role="img" aria-label={String(project.name || project.title || 'Project') + ' saved progress: ' + progress + ' percent'}>
                                      <div className="h-full rounded-full bg-accent" style={{ width: progress + '%' }} />
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-[10px] leading-4 text-muted">Progress not recorded</p>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <p className={['text-[10px] tabular-nums', overdue ? 'font-semibold text-danger' : 'text-muted'].join(' ')}>{due && isValidDashboardDate(due) ? formatDashboardDate(due) : 'No target date'}</p>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </AdminPanel>
              </section>
            ) : null}

            <section className={['min-w-0', canOpenProjects ? 'min-[1100px]:col-span-5' : 'min-[1100px]:col-span-12'].join(' ')} data-ams-feature-slug="dashboard-attention-center" aria-label="Needs attention">
              <AdminPanel
                title="Needs attention"
                className="h-full ams-overview-panel ams-overview-panel--attention"
                bodyClassName="p-0"
                actions={dashboardOverview.attentionItemsDataAvailable ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {attentionSeveritySummary.urgent > 0 ? <span className="rounded-badge border border-danger/25 bg-danger/10 px-2 py-1 text-[10px] font-medium text-danger">{attentionSeveritySummary.urgent} urgent</span> : null}
                    {attentionSeveritySummary.attention > 0 ? <span className="rounded-badge border border-warning/25 bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning">{attentionSeveritySummary.attention} attention</span> : null}
                    {attentionSeveritySummary.total === 0 ? <span className="text-[10px] text-muted">No active exceptions</span> : null}
                  </div>
                ) : undefined}
              >
                <div data-ams-feature-slug="dashboard-priority-exceptions" aria-label="Priority exceptions">
                  {!dashboardOverview.attentionItemsDataAvailable ? (
                    <div className="p-3 sm:p-4" role="status">
                      <div className="ams-dashboard-state ams-dashboard-state--compact">
                        <span className="ams-dashboard-state__icon" aria-hidden="true"><AlertTriangle size={15} /></span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-fg">{dashboardOverview.loading ? 'Loading cross-module exceptions' : 'Exception data unavailable'}</p>
                          <p className="mt-1 text-[11px] leading-4 text-muted">Unconfirmed sources are kept separate from a clean-state result.</p>
                        </div>
                      </div>
                    </div>
                  ) : overviewAttentionItems.length === 0 ? (
                    <div className="p-3 sm:p-4"><DashboardEmptyState eyebrow="OPERATIONS CLEAR" tone="success" icon={<CheckCircle2 size={17} aria-hidden="true" />} title="No active exceptions" description="Available sources returned no cross-module issues that need attention." compact /></div>
                  ) : (
                    <div className="divide-y divide-line">
                      {overviewAttentionItems.slice(0, 4).map((item, index) => {
                        const severity = String(item.severity || 'info').toLowerCase();
                        const tone: DashboardTone = severity === 'danger' || severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'info';
                        const category = String(item.category || 'Operations');
                        const knownDestinationCandidates: Record<string, string[]> = {
                          att_invoices_overdue: ['/admin/finance?tab=accounts-receivable'],
                          att_projects_risk: ['/admin/projects?projects=all', '/admin/projects?projects=planning-delivery', '/admin/projects?projects=sprint'],
                          att_tasks_overdue: ['/admin/tasks?taskscope=due', '/admin/projects?projects=planning-delivery', '/admin/projects?projects=sprint'],
                          att_leads_new: ['/admin/inbox?view=messages']
                        };
                        const candidates = knownDestinationCandidates[String(item.id || '')] || [String(item.linkUrl || '')];
                        const safeDestination = candidates.find((candidate) => candidate.startsWith('/admin/') && canOpenDashboardRoute(candidate)) || null;
                        const severityLabel = tone === 'danger' ? 'Urgent' : tone === 'warning' ? 'Attention' : 'Info';
                        return (
                          <article key={String(item.id || category + '-' + item.title || index)} className="flex min-w-0 items-start gap-3 px-4 py-3">
                            <span className={['mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full', tone === 'danger' ? 'bg-danger' : tone === 'warning' ? 'bg-warning' : 'bg-info'].join(' ')} aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="break-words text-xs font-semibold text-fg">{item.title || 'Attention item'}</p>
                                <span className={['rounded-badge border px-2 py-0.5 text-[10px] font-medium', toneClasses[tone]].join(' ')}>{severityLabel}</span>
                              </div>
                              {item.description ? <p className="mt-1 line-clamp-1 break-words text-[11px] leading-4 text-muted">{item.description}</p> : null}
                              {safeDestination ? <Link to={safeDestination} className="mt-1.5 inline-flex min-h-7 items-center gap-1 text-[11px] font-medium text-muted hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{category === 'Finance' ? 'Receivables' : category === 'Delivery' ? 'Delivery' : category === 'Sales' ? 'Inbox' : 'Review'} <ArrowUpRight size={11} aria-hidden="true" /></Link> : null}
                            </div>
                          </article>
                        );
                      })}
                      {overviewAttentionItems.length > 4 ? <p className="border-t border-line px-4 py-2 text-[10px] text-muted">Showing 4 of {overviewAttentionItems.length} exceptions.</p> : null}
                    </div>
                  )}
                </div>

                {canOpenInbox ? (
                  <div className="border-t border-line" data-ams-feature-slug="dashboard-inbox-triage" aria-label="Inbound inquiry triage">
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <h3 className="text-xs font-semibold text-fg">Inbox</h3>
                        
                      </div>
                      <Link to="/admin/inbox?view=messages" className="inline-flex min-h-8 items-center gap-1 text-[11px] font-medium text-muted hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Open Inbox <ArrowUpRight size={12} aria-hidden="true" /></Link>
                    </div>
                    {inboxTriageSummary.state === 'loading' ? (
                      <p className="px-4 pb-4 text-[11px] text-muted" role="status">Loading inbound records.</p>
                    ) : inboxTriageSummary.state === 'unavailable' ? (
                      <p className="px-4 pb-4 text-[11px] text-muted" role="status">Inbox data unavailable; triage counts are not inferred.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-3 border-y border-line bg-bg/60 px-4 py-3">
                          {[
                            { label: 'New', value: inboxTriageSummary.newCount },
                            { label: 'Unassigned', value: inboxTriageSummary.unassignedCount },
                            { label: 'High priority', value: inboxTriageSummary.highPriorityCount }
                          ].map((metric) => (
                            <div key={metric.label} className="min-w-0 border-l border-line pl-2.5">
                              <p className="text-[10px] leading-4 text-muted">{metric.label}</p>
                              <p className="mt-0.5 text-base font-semibold tabular-nums text-fg">{metric.value}</p>
                            </div>
                          ))}
                        </div>
                        {inboxTriageSummary.actionable.length ? (
                          <div className="divide-y divide-line">
                            {inboxTriageSummary.actionable.slice(0, 2).map((lead) => (
                              <article key={lead.id} className="flex min-w-0 items-center justify-between gap-3 px-4 py-2.5">
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-medium text-fg">{lead.fullName || 'Inbound contact'}</p>
                                  <p className="mt-0.5 truncate text-[10px] text-muted">{lead.company || 'Company not provided'} · {lead.status || 'Status unavailable'}</p>
                                </div>
                                <span className={['shrink-0 text-[10px] font-medium', isInboxUnassigned(lead) ? 'text-warning' : 'text-muted'].join(' ')}>{String(lead.assignedTo || '').trim() || 'Unassigned'}</span>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-3"><DashboardEmptyState eyebrow="INBOX TRIAGE" tone="success" icon={<FileText size={16} aria-hidden="true" />} title="Inbox is clear" description="No inbound records currently need immediate triage." compact /></div>
                        )}
                      </>
                    )}
                  </div>
                ) : null}
              </AdminPanel>
            </section>
          </section>

<section className="ams-overview-card-row grid min-w-0 gap-4 min-[1100px]:grid-cols-12" aria-label="Task queue and delivery deadlines">
            <section className="min-w-0 min-[1100px]:col-span-7" data-ams-feature-slug="dashboard-delivery-desk" aria-label="Task delivery queue">
              <AdminPanel
                title="Task queue"
                className="h-full ams-overview-panel ams-overview-panel--list"
                bodyClassName="p-0"
                actions={canOpenTasks ? (
                  <Link to={overviewTaskQueueHref} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    Open Tasks <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                ) : undefined}
              >
                <div className="border-b border-line px-3 py-3 sm:px-4">
                  <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Task queue filters">
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
                {!canOpenTasks || operationalSnapshot.tasks === null ? (
                  <div className="p-4"><DashboardUnavailable title="Task queue unavailable" description="The canonical Tasks source is not available to this role or did not return records." compact /></div>
                ) : dashboardWorkTasks.length === 0 ? (
                  <div className="px-4 py-8" role="status">
                    <DashboardEmptyState eyebrow="TASK QUEUE" icon={<CheckCircle2 size={17} aria-hidden="true" />} title="No task records yet" description="Tasks will appear here when they are created in the canonical Tasks workspace." action={canOpenTasks ? <Link to="/admin/tasks" className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-fg hover:text-accent-text">Open Tasks <ArrowUpRight size={12} aria-hidden="true" /></Link> : undefined} />
                  </div>
                ) : activeDashboardTasks.length === 0 ? (
                  <div className="px-4 py-4"><DashboardEmptyState eyebrow="TASK QUEUE" tone="success" icon={<CheckCircle2 size={17} aria-hidden="true" />} title="Queue cleared" description="Every task in the current scope is complete. Switch to another queue to review other work." /></div>
                ) : visibleOverviewTasks.length === 0 ? (
                  <div className="px-4 py-4"><DashboardEmptyState eyebrow="QUEUE FILTER" icon={<CheckCircle2 size={17} aria-hidden="true" />} title="No tasks in this queue" description="There are no matching tasks for this filter. Choose another queue to inspect different work." /></div>
                ) : (
                  <div className="divide-y divide-line">
                    {visibleOverviewTasks.slice(0, 5).map((task) => {
                      const overdue = dashboardTaskIsOverdue(task, currentDayKey);
                      const dueSoon = dashboardTaskIsDueSoon(task, currentDayKey, nextSevenDaysKey);
                      const taskDestination = task.blocked
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
                        <article key={task.id} className="flex min-w-0 items-start gap-3 px-4 py-3">
                          <span className={['mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full', toneClasses[overdue ? 'danger' : task.blocked ? 'warning' : dashboardTaskPriorityTone(task.priority)]].join(' ')} aria-hidden="true" />
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-xs font-semibold text-fg">{task.title}</p>
                            <p className="mt-1 break-words text-[11px] text-muted">{task.projectName}{task.clientName ? ' · ' + task.clientName : ''}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <span className={['rounded-badge border px-2 py-0.5 text-[10px] font-medium', toneClasses[dashboardTaskPriorityTone(task.priority)]].join(' ')}>{task.priority.toUpperCase()}</span>
                              <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">{dashboardTaskStatusLabel(task.status)}</span>
                              {task.blocked ? <span className="rounded-badge border border-danger/25 bg-danger/10 px-2 py-0.5 text-[10px] text-danger">Blocked</span> : null}
                              {!task.assigned ? <span className="rounded-badge border border-warning/25 bg-warning/10 px-2 py-0.5 text-[10px] text-warning">Unassigned</span> : null}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] font-medium text-fg">{task.assigneeLabel}</p>
                            <p className={['mt-1 text-[10px] tabular-nums', overdue ? 'font-semibold text-danger' : dueSoon ? 'font-medium text-warning' : 'text-muted'].join(' ')}>{dueLabel}</p>
                            {canOpenDashboardRoute(taskDestination) ? <Link to={taskDestination} className="mt-1 inline-flex min-h-7 items-center gap-1 text-[10px] font-medium text-muted hover:text-accent-text">Open queue <ArrowUpRight size={10} aria-hidden="true" /></Link> : null}
                          </div>
                        </article>
                      );
                    })}
                    {activeDashboardTasks.length > 5 ? <p className="border-t border-line px-4 py-2 text-[10px] text-muted">Showing 5 of {activeDashboardTasks.length} open tasks.</p> : null}
                  </div>
                )}
              </AdminPanel>
            </section>

            <section className="min-w-0 min-[1100px]:col-span-5" data-ams-feature-slug="dashboard-delivery-commitments" aria-label="Upcoming delivery deadlines">
              <AdminPanel
                title="Upcoming deadlines"
                className="h-full ams-overview-panel ams-overview-panel--list"
                bodyClassName="p-0"
                actions={canOpenProjects ? (
                  <Link to="/admin/projects?projects=planning-delivery&planningView=milestones" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    Open planning <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                ) : undefined}
              >
                {operationalSnapshot.projects === null ? (
                  <div className="p-4"><DashboardUnavailable title="Delivery schedule unavailable" description="Project and milestone records were not returned. Deadlines are not inferred." compact /></div>
                ) : rawProjectRows.length === 0 ? (
                  <div className="px-4 py-4"><DashboardEmptyState eyebrow="DELIVERY TIMELINE" icon={<CalendarDays size={17} aria-hidden="true" />} title="No delivery dates to display" description="The project register returned no records, so upcoming deadlines cannot be determined." action={canOpenProjects ? <Link to="/admin/projects?projects=all" className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-fg hover:text-accent-text">Open Projects <ArrowUpRight size={12} aria-hidden="true" /></Link> : undefined} /></div>
                ) : (
                  <>
                    <div className="space-y-3 border-b border-line bg-bg/50 px-4 py-4" data-ams-feature-slug="dashboard-delivery-horizon-visualization">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div><p className="text-[11px] text-muted">Overdue and due within 30 days</p><p className="mt-1 text-xl font-semibold tabular-nums text-fg">{commitmentHorizonTotal}</p></div>
                        
                      </div>
                      {commitmentHorizonTotal > 0 ? (
                        <>
                          <div className="flex h-2 overflow-hidden rounded-full bg-line" role="img" aria-label={'Delivery deadlines: ' + overdueHorizonCount + ' overdue, ' + nextSevenDayCommitmentCount + ' due in 7 days, ' + daysEightToThirtyCommitmentCount + ' due in days 8 to 30.'}>
                            {overdueHorizonCount > 0 ? <span className="h-full bg-danger" style={{ width: overdueHorizonCount / commitmentHorizonTotal * 100 + '%' }} aria-hidden="true" /> : null}
                            {nextSevenDayCommitmentCount > 0 ? <span className="h-full bg-warning" style={{ width: nextSevenDayCommitmentCount / commitmentHorizonTotal * 100 + '%' }} aria-hidden="true" /> : null}
                            {daysEightToThirtyCommitmentCount > 0 ? <span className="h-full bg-info" style={{ width: daysEightToThirtyCommitmentCount / commitmentHorizonTotal * 100 + '%' }} aria-hidden="true" /> : null}
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Filter deadlines">
                            {([
                              { key: 'all', label: 'All', count: commitmentHorizonTotal, tone: 'text-fg' },
                              { key: 'overdue', label: 'Overdue', count: overdueHorizonCount, tone: 'text-danger' },
                              { key: 'next7', label: 'Today–7 days', count: nextSevenDayCommitmentCount, tone: 'text-warning' },
                              { key: 'days8to30', label: 'Days 8–30', count: daysEightToThirtyCommitmentCount, tone: 'text-muted' }
                            ] as Array<{ key: DashboardDeadlineFilter; label: string; count: number; tone: string }>).map((item) => (
                              <button key={item.key} type="button" aria-pressed={overviewDeadlineFilter === item.key} onClick={() => setOverviewDeadlineFilter(item.key)} className={[
                                'ams-dashboard-deadline-filter flex min-w-0 flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                                overviewDeadlineFilter === item.key ? 'is-active border-accent/25 bg-accent/5' : 'border-transparent bg-panel/70 hover:border-line hover:bg-panel'
                              ].join(' ')}>
                                <span className={['text-[10px] leading-4', item.tone].join(' ')}>{item.label}</span>
                                <span className="text-base font-semibold tabular-nums text-fg">{item.count}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <DashboardEmptyState eyebrow="DELIVERY HORIZON" tone="success" icon={<CalendarDays size={16} aria-hidden="true" />} title="No upcoming commitments" description="No dated open commitments fall within the next 30 days." compact />
                      )}
                    </div>
                    {upcomingCommitments.length === 0 ? (
                      commitmentHorizonTotal === 0 ? null : (
                        <div className="px-4 py-3">
                          <DashboardEmptyState
                            eyebrow="DEADLINE FILTER"
                            tone="success"
                            icon={<CalendarDays size={16} aria-hidden="true" />}
                            title={overviewDeadlineFilter === 'overdue' ? 'No overdue commitments' : overviewDeadlineFilter === 'next7' ? 'No near-term deadlines' : overviewDeadlineFilter === 'days8to30' ? 'No commitments in this window' : 'No upcoming commitments'}
                            description={overviewDeadlineFilter === 'overdue' ? 'Nothing in the current delivery window is overdue.' : overviewDeadlineFilter === 'next7' ? 'No open commitments are due today or within the next seven days.' : overviewDeadlineFilter === 'days8to30' ? 'No open commitments fall between days 8 and 30.' : 'No dated commitments fall within the next 30 days.'}
                            compact
                          />
                        </div>
                      )
                    ) : (
                      <div className="divide-y divide-line">
                        {upcomingCommitments.slice(0, 4).map((item) => {
                          const overdue = item.dueDate < currentDayKey;
                          const dueTone: DashboardTone = overdue ? 'danger' : item.dueDate === currentDayKey ? 'warning' : 'info';
                          const projectHref = item.projectHref;
                          const projectRouteAvailable = Boolean(projectHref && canOpenProjects && canOpenDashboardRoute(projectHref));
                          return (
                            <article key={item.id} className="flex min-w-0 items-start gap-3 px-4 py-3">
                              <span className={['mt-1 h-2.5 w-2.5 shrink-0 rounded-full', dueTone === 'danger' ? 'bg-danger' : dueTone === 'warning' ? 'bg-warning' : 'bg-info'].join(' ')} aria-hidden="true" />
                              <div className="min-w-0 flex-1">
                                <p className="break-words text-xs font-semibold text-fg">{item.projectName}</p>
                                <p className="mt-0.5 break-words text-[10px] text-muted">{item.title} · {item.kind}</p>
                                <p className="mt-1 text-[10px] text-muted">{item.owner}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className={['text-[10px] tabular-nums', overdue ? 'font-semibold text-danger' : 'text-muted'].join(' ')}>{formatDashboardDate(item.dueDate)}</p>
                                {projectRouteAvailable && projectHref ? <Link to={projectHref} className="mt-1 inline-flex min-h-7 items-center gap-1 text-[10px] font-medium text-muted hover:text-accent-text">Open <ArrowUpRight size={10} aria-hidden="true" /></Link> : null}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </AdminPanel>
            </section>
          </section>

<section className="ams-overview-card-row grid min-w-0 gap-4 min-[1100px]:grid-cols-12" aria-label="Finance and project overview">
            {canOpenFinanceOverview ? (
              <section
                className={['min-w-0', canOpenProjects ? 'min-[1100px]:col-span-7' : 'min-[1100px]:col-span-12'].join(' ')}
                data-ams-feature-slug="dashboard-finance-overview"
                aria-label="Finance overview"
              >
                <AdminPanel
                  title="Finance"
                  className="h-full ams-overview-panel ams-overview-panel--finance"
                  bodyClassName="p-4 sm:p-5"
                  actions={(
                    <Link to={canOpenInvoiceRegister ? '/admin/finance?tab=accounts-receivable' : '/admin/finance?tab=expenses'} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                      Open Finance <ArrowUpRight size={13} aria-hidden="true" />
                    </Link>
                  )}
                >
                  <div className="grid min-w-0 gap-5 min-[900px]:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                    <div className="flex min-w-0 flex-col justify-between gap-5">
                      <div>
                        <p className="text-xs font-medium text-muted">{canOpenInvoiceRegister ? 'Outstanding receivables' : 'Expenses recorded in period'}</p>
                        <p className="mt-2 break-words text-2xl font-semibold tracking-tight tabular-nums text-fg sm:text-3xl">
                          {canOpenInvoiceRegister
                            ? outstandingValueAvailable && liveOutstanding !== null ? formatLiveMoney(liveOutstanding, financeCurrency) : '—'
                            : expensesValueAvailable && livePeriodExpenses !== null ? formatLiveMoney(livePeriodExpenses, financeCurrency) : '—'}
                        </p>
                        <p className="ams-finance-receivables__context mt-1.5 text-[11px] leading-4 text-muted" role="status">
                          {canOpenInvoiceRegister
                            ? operationalSnapshot.invoices === null
                              ? 'Invoice source unavailable.'
                              : outstandingValueAvailable
                                ? 'Open issued invoices'
                                : 'No issued invoice records'
                            : operationalSnapshot.expenses === null
                              ? 'Expense source unavailable.'
                              : expensesValueAvailable
                                ? 'Eligible expenses · selected period'
                                : 'No eligible expense records are available to confirm a selected-period total.'}
                        </p>
                      </div>

                      <div data-ams-feature-slug="dashboard-finance-control" className="ams-finance-control-links flex flex-wrap gap-2 border-t border-line pt-3">
                        {canOpenInvoiceRegister ? (
                          <Link to="/admin/finance?tab=accounts-receivable" className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line bg-bg px-3 text-[11px] font-medium text-muted transition-colors hover:border-accent/25 hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                            <ReceiptText size={12} aria-hidden="true" /> Receivables <ArrowUpRight size={11} aria-hidden="true" />
                          </Link>
                        ) : null}
                        {canOpenExpenseRegister ? (
                          <Link to="/admin/finance?tab=expenses" className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line bg-bg px-3 text-[11px] font-medium text-muted transition-colors hover:border-accent/25 hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                            <ReceiptText size={12} aria-hidden="true" /> Expenses <ArrowUpRight size={11} aria-hidden="true" />
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    <div className="ams-finance-trend-region min-w-0 border-t border-line pt-4 min-[900px]:border-l min-[900px]:border-t-0 min-[900px]:pl-5 min-[900px]:pt-0" data-ams-feature-slug="dashboard-finance-trend">
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-xs font-semibold text-fg">Invoices vs expenses</h3>
                        <span className="text-[10px] text-muted">{reportPeriodEnabled ? reportPeriodLabel : 'Recent 30 days'}</span>
                      </div>
                      {operationalSnapshot.invoices === null || operationalSnapshot.expenses === null ? (
                        <div className="ams-dashboard-state ams-dashboard-state--compact" role="status">
                          <span className="ams-dashboard-state__icon" aria-hidden="true"><AlertTriangle size={16} /></span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-fg">Financial movement unavailable</p>
                            <p className="mt-1 break-words text-[11px] leading-4 text-muted">Invoice and expense sources are not both available to this role or service.</p>
                          </div>
                        </div>
                      ) : !overviewFinanceTrendHasRecords ? (
                        <DashboardEmptyState eyebrow="FINANCIAL MOVEMENT" icon={<CircleDollarSign size={17} aria-hidden="true" />} title="No eligible financial records" description="No issued-invoice or eligible-expense values are available for the selected currency and period." compact />
                      ) : overviewFinanceTrendRows.length ? (
                        <>
                          <TrendChart
                            data={overviewFinanceTrendRows}
                            primaryLabel="Issued invoices"
                            secondaryLabel="Recorded expenses"
                            tertiaryLabel=""
                            primaryFormat={(value) => formatLiveMoney(value, financeCurrency)}
                            axisFormat={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: financeCurrency, notation: 'compact', maximumFractionDigits: 1 }).format(value)}
                            presentation="maven"
                            ariaLabel={'Issued-invoice totals by invoice date and eligible expenses by recorded date. Scope: ' + describeFinancialTrendScope(overviewFinanceTrendRows, reportPeriodEnabled, reportPeriodLabel) + '. This comparison is not posted profit or cash flow.'}
                          />
                          
                        </>
                      ) : (
                        <p className="py-8 text-center text-xs text-muted" role="status">No trend buckets are available for this period.</p>
                      )}
                    </div>
                  </div>
                
                  {(canOpenInvoiceRegister || canOpenExpenseRegister) ? (
                    <section className="ams-finance-movement" data-ams-feature-slug="dashboard-finance-movement" aria-label="Money movement">
                      <div className="ams-finance-movement__heading">
                        <h3>Period movement</h3>
                        <span className="ams-finance-movement__period">{overviewPeriodDisplay}</span>
                      </div>
                      <div className={['ams-finance-movement__grid', canOpenInvoiceRegister && canOpenExpenseRegister ? 'is-balanced' : 'is-single'].join(' ')}>
                        {canOpenInvoiceRegister ? (
                          <div className="ams-finance-movement-card" data-ams-feature-slug="dashboard-cash-received" aria-label="Cash received">
                            <div className="ams-finance-movement-card__copy min-w-0">
                              <div className="ams-finance-movement-card__label">
                                <p className="text-[11px] font-medium text-muted">Cash received</p>
                                <span className="ams-finance-movement-card__icon" aria-hidden="true"><ArrowUpRight size={13} /></span>
                              </div>
                              <p className="mt-1.5 break-words text-base font-semibold tabular-nums text-fg">{cashValueAvailable && livePeriodCashCollected !== null ? formatLiveMoney(livePeriodCashCollected, financeCurrency) : '—'}</p>
                              
                            </div>
                            <div className="ams-finance-movement-card__chart">
                              {cashValueAvailable && overviewMoneyMovementRows.length ? (
                                <>
                                  <div className="ams-money-movement-sparkline ams-money-movement-sparkline--cash" role="img" aria-label={'Cash received by period bucket: ' + overviewMoneyMovementRows.map((bucket) => bucket.label + ' ' + formatLiveMoney(bucket.cashReceived, financeCurrency)).join(', ')}>
                                    {overviewMoneyMovementRows.map((bucket) => {
                                      const barHeight = bucket.cashReceived > 0 ? Math.max(5, bucket.cashReceived / overviewCashMovementMaximum * 100) : 0;
                                      return <span key={bucket.startDate} className="ams-money-movement-sparkbar" style={{ height: barHeight + '%' }} title={bucket.label + ': ' + formatLiveMoney(bucket.cashReceived, financeCurrency)} />;
                                    })}
                                  </div>
                                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-muted"><span>{overviewMoneyMovementRows[0].label}</span><span>{overviewMoneyMovementRows[overviewMoneyMovementRows.length - 1].label}</span></div>
                                </>
                              ) : (
                                <p className="flex min-h-[48px] items-center text-[11px] leading-4 text-muted" role="status">{operationalSnapshot.invoices === null ? 'Invoice source unavailable.' : cashValueAvailable ? 'Period trend unavailable.' : 'No issued invoice records are available for this currency.'}</p>
                              )}
                            </div>
                          </div>
                        ) : null}
                        {canOpenExpenseRegister ? (
                          <div className="ams-finance-movement-card ams-finance-movement-card--expenses" data-ams-feature-slug="dashboard-expenses-recorded" aria-label="Expenses recorded">
                            <div className="ams-finance-movement-card__copy min-w-0">
                              <div className="ams-finance-movement-card__label">
                                <p className="text-[11px] font-medium text-muted">Expenses recorded</p>
                                <span className="ams-finance-movement-card__icon" aria-hidden="true"><ReceiptText size={13} /></span>
                              </div>
                              <p className="mt-1.5 break-words text-base font-semibold tabular-nums text-fg">{expensesValueAvailable && livePeriodExpenses !== null ? formatLiveMoney(livePeriodExpenses, financeCurrency) : '—'}</p>
                              
                            </div>
                            <div className="ams-finance-movement-card__chart">
                              {expensesValueAvailable && overviewMoneyMovementRows.length ? (
                                <>
                                  <div className="ams-money-movement-sparkline ams-money-movement-sparkline--expenses" role="img" aria-label={'Recorded expenses by period bucket: ' + overviewMoneyMovementRows.map((bucket) => bucket.label + ' ' + formatLiveMoney(bucket.recordedExpenses, financeCurrency)).join(', ')}>
                                    {overviewMoneyMovementRows.map((bucket) => {
                                      const barHeight = bucket.recordedExpenses > 0 ? Math.max(5, bucket.recordedExpenses / overviewExpenseMovementMaximum * 100) : 0;
                                      return <span key={bucket.startDate} className="ams-money-movement-sparkbar" style={{ height: barHeight + '%' }} title={bucket.label + ': ' + formatLiveMoney(bucket.recordedExpenses, financeCurrency)} />;
                                    })}
                                  </div>
                                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-muted"><span>{overviewMoneyMovementRows[0].label}</span><span>{overviewMoneyMovementRows[overviewMoneyMovementRows.length - 1].label}</span></div>
                                </>
                              ) : (
                                <p className="flex min-h-[48px] items-center text-[11px] leading-4 text-muted" role="status">{operationalSnapshot.expenses === null ? 'Expense source unavailable.' : expensesValueAvailable ? 'Period trend unavailable.' : 'No eligible expense records are available for this currency.'}</p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </section>
                  ) : null}

                  {canOpenQuotationRegister ? (
                    <section
                      className="ams-quotation-follow-up mt-4 border-t border-line pt-4"
                      data-ams-feature-slug="dashboard-commercial-quotation-pipeline"
                      aria-label="Quotation follow-up"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-fg">Quotation follow-up</h3>
                            <span className="rounded-full border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">
                              {dashboardQuotationFilterCounts.all} active
                            </span>
                          </div>
                          
                        </div>
                        <Link
                          to="/admin/finance?tab=quotations"
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-bg px-3 text-[11px] font-medium text-muted transition-colors hover:border-accent/25 hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          Open quotation ledger <ArrowUpRight size={12} aria-hidden="true" />
                        </Link>
                      </div>

                      {operationalSnapshot.quotations === null ? (
                        <div className="mt-3 ams-dashboard-state ams-dashboard-state--compact" role="status">
                          <span className="ams-dashboard-state__icon" aria-hidden="true"><AlertTriangle size={15} /></span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-fg">{operationalSnapshot.loading ? 'Loading quotation records' : 'Quotation data unavailable'}</p>
                            <p className="mt-1 text-[11px] leading-4 text-muted">The follow-up queue cannot be confirmed from the current quotation source.</p>
                          </div>
                        </div>
                      ) : dashboardQuotationRows.length === 0 ? (
                        <div className="mt-3"><DashboardEmptyState eyebrow="QUOTATION REGISTER" icon={<FileText size={17} aria-hidden="true" />} title={'No quotation records in ' + financeCurrency} description="The quotation source returned no records in this currency." compact /></div>
                      ) : activeDashboardQuotations.length === 0 ? (
                        <div className="mt-3"><DashboardEmptyState eyebrow="QUOTATION FOLLOW-UP" tone="success" icon={<CheckCircle2 size={17} aria-hidden="true" />} title="No quotations need follow-up" description={overviewQuotationFilter === 'all' ? 'No active quotations currently meet the follow-up criteria.' : 'No active quotations match the selected stage.'} compact /></div>
                      ) : (
                        <>
                          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter quotations by stage">
                            {([
                              { key: 'all', label: 'All active', count: dashboardQuotationFilterCounts.all },
                              { key: 'review', label: 'Review', count: dashboardQuotationFilterCounts.review },
                              { key: 'approved', label: 'Approved', count: dashboardQuotationFilterCounts.approved },
                              { key: 'sent', label: 'Sent', count: dashboardQuotationFilterCounts.sent },
                              { key: 'draft', label: 'Draft', count: dashboardQuotationFilterCounts.draft }
                            ] as Array<{ key: DashboardQuotationFilter; label: string; count: number }>).map((filter) => (
                              <button
                                key={filter.key}
                                type="button"
                                aria-pressed={overviewQuotationFilter === filter.key}
                                onClick={() => setOverviewQuotationFilter(filter.key)}
                                className={[
                                  'inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                                  overviewQuotationFilter === filter.key
                                    ? 'border-accent/25 bg-accent/10 text-fg'
                                    : 'border-line bg-bg text-muted hover:border-line hover:bg-panel-hover hover:text-fg'
                                ].join(' ')}
                              >
                                {filter.label}
                                <span className="rounded-full border border-line bg-panel px-1.5 py-0.5 text-[10px] tabular-nums">{filter.count}</span>
                              </button>
                            ))}
                          </div>

                          {visibleDashboardQuotations.length === 0 ? (
                            <div className="mt-2 rounded-xl border border-line bg-bg px-3 py-4" role="status">
                              <p className="text-xs font-medium text-fg">No quotations match this stage</p>
                              
                              <button
                                type="button"
                                onClick={() => setOverviewQuotationFilter('all')}
                                className="mt-2 inline-flex min-h-8 items-center gap-1 rounded-full border border-line px-3 text-[11px] font-medium text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                              >
                                Clear stage filter
                              </button>
                            </div>
                          ) : (
                            <div className="mt-2 divide-y divide-line">
                              {visibleDashboardQuotations.map((quotation) => {
                                const expired = isValidDashboardDate(quotation.validUntil) && quotation.validUntil < currentDayKey;
                                const expiringSoon = isValidDashboardDate(quotation.validUntil) && quotation.validUntil >= currentDayKey && quotation.validUntil <= nextSevenDaysKey;
                                const statusTone = quotation.status === 'review'
                                  ? 'border-warning/25 bg-warning/10 text-warning'
                                  : quotation.status === 'approved'
                                    ? 'border-success/25 bg-success/10 text-success'
                                    : quotation.status === 'sent'
                                      ? 'border-info/25 bg-info/10 text-info'
                                      : 'border-line bg-bg text-muted';
                                const validityTone = expired ? 'text-danger' : expiringSoon ? 'text-warning' : 'text-muted';
                                const validityLabel = !isValidDashboardDate(quotation.validUntil)
                                  ? 'Validity not recorded'
                                  : expired
                                    ? 'Expired · ' + formatDashboardDate(quotation.validUntil)
                                    : 'Valid until ' + formatDashboardDate(quotation.validUntil);
                                return (
                                  <article key={quotation.id} className="flex min-w-0 flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="break-words text-xs font-semibold text-fg">{quotation.quotationNumber || quotation.title}</p>
                                        <span className={['rounded-full border px-2 py-0.5 text-[10px] font-medium', statusTone].join(' ')}>
                                          {dashboardQuotationStatusLabel(quotation.status)}
                                        </span>
                                      </div>
                                      {quotation.quotationNumber && quotation.title && quotation.title !== quotation.quotationNumber ? (
                                        <p className="mt-1 break-words text-[11px] font-medium text-fg">{quotation.title}</p>
                                      ) : null}
                                      <p className="mt-1 break-words text-[11px] text-muted">{quotation.clientCompany || quotation.clientName || 'Client not recorded'}{quotation.owner ? ' · ' + quotation.owner : ''}</p>
                                      <p className={['mt-1 text-[10px] leading-4', validityTone].join(' ')}>{validityLabel}</p>
                                    </div>
                                    <div className="shrink-0 sm:text-right">
                                      <p className="text-xs font-semibold tabular-nums text-fg">{quotation.total === null ? 'Amount not recorded' : formatLiveMoney(quotation.total, quotation.currency)}</p>
                                      {quotation.invoiceId ? <p className="mt-1 text-[10px] text-muted">Invoice linked</p> : null}
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          )}

                        </>
                      )}
                    </section>
                  ) : null}
</AdminPanel>
              </section>
            ) : null}

            {canOpenProjects ? (
              <section
                className={['min-w-0', canOpenFinanceOverview ? 'min-[1100px]:col-span-5' : 'min-[1100px]:col-span-12'].join(' ')}
                data-ams-feature-slug="dashboard-project-portfolio"
                aria-label="Project portfolio"
              >
                <AdminPanel
                  title="Projects"
                  className="h-full ams-overview-panel ams-overview-panel--projects"
                  bodyClassName="p-4 sm:p-5"
                  actions={(
                    <Link to="/admin/projects?projects=all" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                      Open Projects <ArrowUpRight size={13} aria-hidden="true" />
                    </Link>
                  )}
                >
                  {operationalSnapshot.projects === null ? (
                    <DashboardUnavailable title="Project portfolio unavailable" description="The canonical Projects source did not return current records." compact />
                  ) : rawProjectRows.length === 0 ? (
                    <DashboardEmptyState eyebrow="PROJECT PORTFOLIO" icon={<FolderKanban size={17} aria-hidden="true" />} title="No project records yet" description="Portfolio metrics and service-line distribution appear when the Projects register contains records." compact />
                  ) : (
                    <div className="space-y-4">
                      <div className="ams-project-summary-grid grid grid-cols-3 gap-2" aria-label="Current project portfolio metrics">
                        <div className="ams-project-summary-item" data-ams-feature-slug="dashboard-active-project-count">
                          <span className="ams-project-summary-item__icon" aria-hidden="true"><FolderKanban size={14} /></span>
                          <p>Active</p>
                          <strong>{activeProjectRows.length}</strong>
                        </div>
                        <div className="ams-project-summary-item ams-project-summary-item--danger" data-ams-feature-slug="dashboard-overdue-commitment-count">
                          <span className="ams-project-summary-item__icon" aria-hidden="true"><AlertTriangle size={14} /></span>
                          <p>Overdue</p>
                          <strong>{overdueCommitmentCount ?? '—'}</strong>
                        </div>
                        <div className="ams-project-summary-item ams-project-summary-item--tasks" data-ams-feature-slug="dashboard-open-task-count">
                          <span className="ams-project-summary-item__icon" aria-hidden="true"><CheckCircle2 size={14} /></span>
                          <p>Open tasks</p>
                          <strong>{activeTaskCount ?? '—'}</strong>
                        </div>
                      </div>

                      {activeProjectRows.length === 0 ? (
                        <DashboardEmptyState eyebrow="PROJECT PORTFOLIO" icon={<FolderKanban size={17} aria-hidden="true" />} title="No active project distribution" description="Portfolio risk and workload visuals appear when active projects are available." compact />
                      ) : (
                        <>
                          <div className="grid min-w-0 gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                            {projectRiskBreakdown.reduce((sum, item) => sum + item.value, 0) > 0 ? (
                              <DonutChart data={projectRiskBreakdown} ariaLabel="Active projects grouped by saved risk and deadline signals" showLegend={false} centerLabel="Active" presentation="maven" />
                            ) : (
                              <div className="min-w-0"><DashboardEmptyState eyebrow="RISK DISTRIBUTION" icon={<FolderKanban size={17} aria-hidden="true" />} title="No risk signals to chart" description="No saved risk or deadline signals are available for these projects." compact /></div>
                            )}
                            <div className="min-w-0 space-y-2">
                              {projectRiskBreakdown.map((item) => {
                                const toneClass = item.tone === 'danger' ? 'bg-danger' : item.tone === 'warning' ? 'bg-warning' : 'bg-success';
                                return (
                                  <div key={item.label} className="flex items-center justify-between gap-3 border-b border-line py-1.5 last:border-b-0">
                                    <span className="flex min-w-0 items-center gap-2 text-[11px] text-muted">
                                      <span className={['h-2 w-2 shrink-0 rounded-full', toneClass].join(' ')} aria-hidden="true" />
                                      <span className="break-words">{item.label}</span>
                                    </span>
                                    <span className="shrink-0 text-xs font-semibold tabular-nums text-fg">{item.value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="border-t border-line pt-3">
                            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                              <h3 className="text-xs font-semibold text-fg">Creative & IT workload</h3>
                              
                            </div>
                            <div className="space-y-3">
                              {serviceLineSummaries.map((line) => (
                                <div key={line.key} className="min-w-0 space-y-1.5" data-ams-feature-slug={'dashboard-workstream-open-task-load-' + line.key}>
                                  <div className="flex items-baseline justify-between gap-3">
                                    <span className="min-w-0 text-xs font-medium text-fg">{line.label}</span>
                                    <span className="shrink-0 text-[10px] tabular-nums text-muted">{line.projectCount} projects{canOpenTasks && operationalSnapshot.tasks !== null ? ' · ' + line.openTaskCount + ' open tasks' : ''}</span>
                                  </div>
                                  {canOpenTasks && operationalSnapshot.tasks !== null ? (
                                    <div className="h-2 overflow-hidden rounded-full bg-line" role="img" aria-label={'Open task load for ' + line.label + ': ' + line.openTaskCount + ' tasks.'}>
                                      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: (workstreamOpenTaskMaximum > 0 ? line.openTaskCount / workstreamOpenTaskMaximum * 100 : 0) + '%' }} />
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-muted" role="status">Task queue unavailable for this role or source.</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </AdminPanel>
              </section>
            ) : null}
          </section>

<section className="ams-overview-card-row grid min-w-0 gap-4 min-[1100px]:grid-cols-12" aria-label="Team and client delivery">
            <section className="min-w-0 min-[1100px]:col-span-5" data-ams-feature-slug="dashboard-team-workload" aria-label="Team workload">
              <AdminPanel title="Team workload" className="h-full ams-overview-panel" bodyClassName="p-4 sm:p-5">
                <section data-ams-feature-slug="dashboard-task-load-by-owner" aria-label="Open tasks by owner">
                  <div className="mb-3 flex items-baseline justify-between gap-2">
                    <h3 className="text-xs font-semibold text-fg">Open tasks by owner</h3>
                    {canOpenTasks ? <Link to="/admin/tasks" className="text-[11px] font-medium text-muted hover:text-accent-text">View tasks <ArrowUpRight size={11} aria-hidden="true" /></Link> : null}
                  </div>
                  {!canOpenTasks || operationalSnapshot.tasks === null ? (
                    <div className="ams-dashboard-state ams-dashboard-state--compact" role="status">
                    <span className="ams-dashboard-state__icon" aria-hidden="true"><AlertTriangle size={15} /></span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-fg">Task assignment data unavailable</p>
                      <p className="mt-1 text-[11px] leading-4 text-muted">Owner workload cannot be shown until the task source returns.</p>
                    </div>
                  </div>
                  ) : taskLoadByAssignee.length === 0 ? (
                    <DashboardEmptyState eyebrow="TEAM WORKLOAD" icon={<Users size={17} aria-hidden="true" />} title="No open assignments" description="Open task distribution will appear here when tasks have owners." compact />
                  ) : (
                    <div className="space-y-3">
                      {taskLoadByAssignee.slice(0, 4).map((owner) => (
                        <div key={owner.label} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate text-xs font-medium text-fg">{owner.label}</span>
                            <span className="shrink-0 text-[11px] tabular-nums text-muted">{owner.total} tasks</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-line" role="img" aria-label={'Open task load for ' + owner.label + ': ' + owner.total + ' tasks.'}>
                            <div className="h-full rounded-full bg-accent" style={{ width: owner.total / taskLoadByAssigneeMaximum * 100 + '%' }} />
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
                            <span>{owner.overdue} overdue</span><span>{owner.blocked} blocked</span><span>{owner.review} in review</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="mt-5 border-t border-line pt-4" data-ams-feature-slug="dashboard-recorded-time-by-person" aria-label="Recorded time by person">
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-xs font-semibold text-fg">Recorded time</h3>
                    <span className="text-[10px] text-muted">{reportPeriodEnabled ? reportPeriodLabel : 'All recorded dates'}</span>
                  </div>
                  <p className="mb-3 text-[10px] leading-4 text-muted">Logged hours · not capacity</p>
                  {!canOpenTimeLogs || operationalSnapshot.timeLogs === null ? (
                    <div className="ams-dashboard-state ams-dashboard-state--compact" role="status">
                    <span className="ams-dashboard-state__icon" aria-hidden="true"><AlertTriangle size={15} /></span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-fg">Time-log source unavailable.</p>
                      <p className="mt-1 text-[11px] leading-4 text-muted">Recorded hours are not estimated from task assignments.</p>
                    </div>
                  </div>
                  ) : periodTimeRows.length === 0 ? (
                    <DashboardEmptyState eyebrow="RECORDED TIME" icon={<Clock3 size={17} aria-hidden="true" />} title="No recorded time in this period" description="Hours are shown only when team members have saved time entries for the selected scope." compact />
                  ) : (
                    <div className="space-y-3">
                      {periodTimeRows.slice(0, 4).map((person) => (
                        <div key={person.name} className="ams-recorded-time-row space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate text-xs font-medium text-fg">{person.name}</span>
                            <span className="shrink-0 text-[11px] tabular-nums text-muted">{Math.floor(person.minutes / 60)}h {person.minutes % 60}m</span>
                          </div>
                          <div className="ams-recorded-time-row__track" role="img" aria-label={'Recorded time for ' + person.name + ': ' + Math.floor(person.minutes / 60) + ' hours ' + (person.minutes % 60) + ' minutes'}>
                            <span style={{ width: Math.min(100, person.minutes / periodTimeRowsMaximum * 100) + '%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {canOpenTimeLogs ? <Link to="/admin/time-logs" className="mt-3 inline-flex min-h-8 items-center gap-1 text-[11px] font-medium text-muted hover:text-accent-text">Open Time Logs <ArrowUpRight size={11} aria-hidden="true" /></Link> : null}
                </section>
              </AdminPanel>
            </section>

            {canOpenProjects ? (
              <section className="min-w-0 min-[1100px]:col-span-7" data-ams-feature-slug="dashboard-client-delivery-focus" aria-label="Client delivery focus">
                <AdminPanel
                  title="Client delivery focus"
                  className="h-full ams-overview-panel ams-overview-panel--list"
                  bodyClassName="p-0"
                  actions={(
                    <Link to="/admin/projects?projects=all" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Open project delivery <ArrowUpRight size={13} aria-hidden="true" /></Link>
                  )}
                >
                  {operationalSnapshot.projects === null ? (
                    <div className="p-4"><DashboardUnavailable title="Client delivery data unavailable" description="The Projects source did not return records. Client delivery counts are not inferred." compact /></div>
                  ) : clientDeliveryFocus.length === 0 ? (
                    <div className="px-4 py-4"><DashboardEmptyState eyebrow="CLIENT DELIVERY" icon={<Users size={17} aria-hidden="true" />} title="No client delivery items" description="Client-linked delivery summaries appear when active projects are connected to client records." action={canOpenClientDirectory ? <Link to="/admin/clients/all-clients" className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-fg hover:text-accent-text">Open Clients <ArrowUpRight size={12} aria-hidden="true" /></Link> : undefined} /></div>
                  ) : (
                    <div className="divide-y divide-line">
                      {clientDeliveryFocus.slice(0, 4).map((client) => (
                        <article key={client.key} className="space-y-2.5 px-4 py-3.5 sm:px-5">
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                              {client.clientRecordAvailable && canOpenClientDirectory && client.clientId ? (
                                <Link to={'/admin/clients/all-clients?client=' + encodeURIComponent(client.clientId)} className="break-words text-xs font-semibold text-fg hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{client.name} <ArrowUpRight size={11} aria-hidden="true" /></Link>
                              ) : (
                                <p className="break-words text-xs font-semibold text-fg">{client.name}</p>
                              )}
                              <p className="mt-0.5 text-[10px] text-muted">{client.serviceLines.join(' · ') || client.clientIdentityLabel}</p>
                            </div>
                            <span className="shrink-0 text-[10px] text-muted">{client.projectCount} active projects</span>
                          </div>
                          {client.openTaskCount === null ? (
                            <p className="text-[11px] leading-4 text-muted" role="status">Task signals unavailable for this role or source.</p>
                          ) : (
                            <>
                              <div className="ams-client-delivery-load space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-[11px] font-medium text-muted">Open task load</span>
                                  <span className="text-xs font-semibold tabular-nums text-fg">{client.openTaskCount}</span>
                                </div>
                                <div className="ams-client-delivery-load__track" role="img" aria-label={'Open tasks for ' + client.name + ': ' + client.openTaskCount}>
                                  <span style={{ width: Math.min(100, client.openTaskCount / clientDeliveryOpenTaskMaximum * 100) + '%' }} />
                                </div>
                              </div>
                              <div className="ams-client-delivery-signals grid grid-cols-3 gap-2">
                                {[
                                  { label: 'Overdue', value: client.overdueTaskCount, tone: 'danger' },
                                  { label: 'Blocked', value: client.blockedTaskCount, tone: 'warning' },
                                  { label: 'Unassigned', value: client.unassignedTaskCount, tone: 'neutral' }
                                ].map((signal) => (
                                  <div key={signal.label} className={['min-w-0 rounded-xl border px-2.5 py-2', signal.tone === 'danger' && signal.value ? 'border-danger/20 bg-danger/5' : signal.tone === 'warning' && signal.value ? 'border-warning/20 bg-warning/5' : 'border-line bg-bg'].join(' ')}>
                                    <p className="text-[11px] text-muted">{signal.label}</p>
                                    <p className={['mt-1 text-base font-semibold tabular-nums', signal.value === null ? 'text-muted' : signal.tone === 'danger' && signal.value > 0 ? 'text-danger' : signal.tone === 'warning' && signal.value > 0 ? 'text-warning' : 'text-fg'].join(' ')}>{signal.value === null ? '—' : signal.value}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                                <span className="rounded-full border border-line bg-bg px-2.5 py-1">In review {client.reviewTaskCount === null ? '—' : client.reviewTaskCount}</span>
                              </div>
                            </>
                          )}
                          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
                              {client.projects.slice(0, 2).map((project, index) => project.href && canOpenDashboardRoute(project.href) ? (
                                <Link key={project.href} to={project.href} className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-medium text-muted hover:text-accent-text">{project.name} <ArrowUpRight size={12} aria-hidden="true" /></Link>
                              ) : (
                                <span key={project.href || project.name + '-' + index} className="inline-flex min-h-8 items-center text-[11px] text-muted">{project.name}</span>
                              ))}
                            </div>
                            <span className={['text-[11px] tabular-nums', client.overdueCommitmentCount > 0 ? 'font-medium text-danger' : 'text-muted'].join(' ')}>
                              {client.overdueCommitmentCount > 0
                                ? client.overdueCommitmentCount + ' overdue commitments'
                                : client.nextCommitmentDate
                                  ? 'Next due ' + formatDashboardDate(client.nextCommitmentDate)
                                  : 'No dated commitment in 30 days'}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </AdminPanel>
              </section>
            ) : null}
          </section>

<section className="ams-overview-card-row grid min-w-0 gap-4 min-[1100px]:grid-cols-12" aria-label="Recent activity">
            {canViewAuditLogs ? (
              <section className="min-w-0 min-[1100px]:col-span-12" data-ams-feature-slug="dashboard-recent-activity" data-ams-slug="dashboard-recent-activity" aria-label="Recent activity">
                <AdminPanel
                  title="Recent activity"
                  className="h-full ams-overview-panel ams-overview-panel--list"
                  bodyClassName="p-0"
                  actions={(
                    <Link to="/admin/settings?tab=audit" className="inline-flex min-h-9 items-center gap-1 text-[11px] font-medium text-muted hover:text-accent-text">View audit log <ArrowUpRight size={12} aria-hidden="true" /></Link>
                  )}
                >
                  {!dashboardOverview.recentActivityDataAvailable ? (
                    <div className="p-3 sm:p-4" role="status">
                    <div className="ams-dashboard-state ams-dashboard-state--compact">
                      <span className="ams-dashboard-state__icon" aria-hidden="true"><AlertTriangle size={15} /></span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-fg">{dashboardOverview.loading ? 'Loading recent activity' : 'Recent activity unavailable'}</p>
                        <p className="mt-1 text-[11px] leading-4 text-muted">No activity entries are available from the current source.</p>
                      </div>
                    </div>
                  </div>
                  ) : (dashboardOverview.recentActivity || []).length === 0 ? (
                    <div className="px-4 py-4"><DashboardEmptyState eyebrow="AUDIT ACTIVITY" icon={<FileText size={17} aria-hidden="true" />} title="No recent activity" description="New audit events will appear here as workspace actions are recorded." compact /></div>
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
                          <article key={String(activity.id || activity.timestamp || index)} className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted"><Clock3 size={14} aria-hidden="true" /></span>
                              <div className="min-w-0">
                                <p className="break-words text-xs font-medium text-fg">{activity.action || 'Recorded audit event'}</p>
                                <p className="mt-0.5 break-words text-[10px] text-muted">{activity.actor ? 'By ' + activity.actor : 'By system'} · {timestampLabel}</p>
                              </div>
                            </div>
                            <span className={'shrink-0 rounded-badge border px-2 py-1 text-[10px] font-medium ' + severityClasses}>{severityLabel}</span>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </AdminPanel>
              </section>
            ) : null}

            
          </section>
        </>
      ) : view === 'performance' ? (
        <PerformanceView
          snapshot={operationalSnapshot}
          matchesDate={matchesDate}
          matchesInterval={matchesInterval}
          reportPeriodLabel={reportPeriodLabel}
          reportPeriodEnabled={reportPeriodEnabled}
          reportPeriodValue={reportPeriodValue}
          reportPeriodMode={reportPeriodMode}
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