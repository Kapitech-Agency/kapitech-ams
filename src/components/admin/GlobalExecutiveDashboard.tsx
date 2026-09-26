import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardCheck,
  FolderKanban,
  Inbox,
  Landmark,
  RefreshCw,
  ShieldAlert,
  Users,
  WalletCards,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { useLanguage } from '../../lib/LanguageContext';
import { getActiveCurrency, CURRENCY_EVENT, CurrencyCode, formatAmount } from '../../lib/currency';
import { getAdminSession } from '../../lib/adminAuth';
import {
  FINANCE_EVENT_NAME,
  getAgencyExpenses,
  getAgencyInvoices,
  getMonthlyCashFlowSeries,
  computeFinancialMetrics,
} from '../../lib/financeStore';
import { TrendChart, BarChart, DonutChart } from '../charts/DashboardCharts';

interface ExecutiveOverviewData {
  metrics: {
    revenueCollected: number | null;
    totalBilled: number | null;
    outstandingReceivables: number | null;
    overdueReceivables: number | null;
    activePipeline: number | null;
    activeProjects: number;
    projectsAtRisk: number;
    pendingApprovals: number;
    overdueTasks: number;
    openLeads: number;
  };
  financials: {
    revenueThisMonth: number | null;
    cashCollected: number | null;
    outstandingReceivables: number | null;
    operatingExpenses: number | null;
    netOperatingProfit: number | null;
    margin: string | null;
  };
  pipelineByStage: Array<{ stage: string; count: number; value: number }>;
  attentionItems: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'danger' | 'warning' | 'info';
    category: string;
    linkUrl: string;
  }>;
  projects: Array<{
    id?: string;
    name?: string;
    clientName?: string;
    status?: string;
    health?: string;
    progressPercent?: number;
    targetEndDate?: string;
  }>;
  recentActivity: Array<{
    id?: string;
    action?: string;
    title?: string;
    description?: string;
    actor?: string;
    createdAt?: string;
    timestamp?: string;
  }>;
}

type ProjectTone = 'accent' | 'success' | 'info' | 'warning' | 'danger' | 'muted';

const cardClass = 'ams-dashboard-card rounded-card border border-line bg-panel p-4 sm:p-5';
const actionClass = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-line bg-transparent px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const EmptyState = ({ message, description, action }: { message: string; description?: string; action?: React.ReactNode }) => (
  <div className="flex min-h-[176px] flex-col items-center justify-center rounded-card border border-line bg-bg px-4 py-8 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-panel text-muted">
      <ClipboardCheck size={18} strokeWidth={1.8} />
    </div>
    <p className="mt-3 text-sm font-medium text-fg">{message}</p>
    {description && <p className="mt-1 max-w-[48ch] text-xs leading-5 text-muted">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-control bg-line/70 ${className}`} aria-hidden="true" />
);

const statusTone = (status: string): ProjectTone => {
  const value = status.toLowerCase();
  if (value.includes('complete') || value === 'done') return 'success';
  if (value.includes('review')) return 'warning';
  if (value.includes('hold') || value.includes('risk') || value.includes('delay')) return 'danger';
  if (value.includes('progress') || value.includes('active')) return 'info';
  if (value.includes('planning')) return 'muted';
  return 'accent';
};

const toneClass: Record<ProjectTone, string> = {
  accent: 'bg-accent/10 text-accent-text',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  muted: 'bg-bg text-muted',
};

const iconToneClass: Record<ProjectTone, string> = {
  accent: 'text-accent-text',
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  muted: 'text-muted',
};

const Metric = ({
  label,
  value,
  context,
  icon: Icon,
  tone = 'accent',
  href,
}: {
  label: string;
  value: string | number;
  context: React.ReactNode;
  icon: React.ElementType;
  tone?: ProjectTone;
  href?: string;
}) => {
  const content = (
    <div className="min-w-0 px-1">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs leading-4 text-muted">{label}</span>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center ${iconToneClass[tone]}`} aria-hidden="true">
          <Icon size={16} strokeWidth={1.8} />
        </span>
      </div>
      <div className="mt-3 text-2xl font-medium leading-8 tracking-[-0.02em] tabular-nums text-fg">{value}</div>
      <div className="mt-1 min-h-4 text-xs leading-4 text-muted">{context}</div>
    </div>
  );
  return href ? (
    <Link to={href} className="group rounded-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
      <div className="transition-transform duration-150 group-hover:-translate-y-0.5">{content}</div>
    </Link>
  ) : content;
};

export const GlobalExecutiveDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ExecutiveOverviewData | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [financeVersion, setFinanceVersion] = useState(0);
  const [mfaRequired, setMfaRequired] = useState(() => getAdminSession()?.user.mfaEnabled !== true);
  const [mfaRetrying, setMfaRetrying] = useState(false);

  useEffect(() => {
    const handleCurrencyChange = (event: Event) => {
      const custom = event as CustomEvent<{ currency: CurrencyCode }>;
      if (custom.detail?.currency) setCurrency(custom.detail.currency);
    };
    const handleAuthChange = () => setMfaRequired(getAdminSession()?.user.mfaEnabled !== true);
    const handleFinanceChange = () => setFinanceVersion((value) => value + 1);
    window.addEventListener(CURRENCY_EVENT, handleCurrencyChange);
    window.addEventListener('kapitech_auth_state_changed', handleAuthChange);
    window.addEventListener(FINANCE_EVENT_NAME, handleFinanceChange);
    return () => {
      window.removeEventListener(CURRENCY_EVENT, handleCurrencyChange);
      window.removeEventListener('kapitech_auth_state_changed', handleAuthChange);
      window.removeEventListener(FINANCE_EVENT_NAME, handleFinanceChange);
    };
  }, []);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.executive.getOverview();
      if (response.success) {
        const payload = (response.data || response) as ExecutiveOverviewData;
        setData(payload);
        setLastRefreshed(new Date());
      } else {
        const responseCode = (response.data as { code?: string } | undefined)?.code;
        const mfaBlocked = responseCode === 'MFA_REQUIRED' || /MFA is required/i.test(response.error || '');
        if (mfaBlocked) {
          setMfaRequired(true);
          setData(null);
          setLastRefreshed(null);
          setError(null);
        } else {
          setError(response.error || 'Dashboard data is temporarily unavailable.');
        }
      }
    } catch {
      setError('Dashboard data is temporarily unavailable. Retry to reconnect.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchOverview();
  }, []);

  const retryMfaStatus = async () => {
    setMfaRetrying(true);
    try {
      const response = await api.auth.me();
      if (response.success && response.data?.success && response.data.user) {
        const user = response.data.user;
        setMfaRequired(user.mfaEnabled !== true);
        if (user.mfaEnabled === true) {
          window.dispatchEvent(new CustomEvent('kapitech_auth_state_changed'));
        }
      }
    } finally {
      setMfaRetrying(false);
    }
  };

  const canViewFinancials = data !== null && data.financials.revenueThisMonth !== null;
  const financeSeries = useMemo(() => {
    if (!canViewFinancials) return [];
    try {
      return getMonthlyCashFlowSeries(getAgencyInvoices(), getAgencyExpenses());
    } catch {
      return [];
    }
  }, [canViewFinancials, financeVersion]);

  const financialMetrics = useMemo(() => {
    if (!canViewFinancials) return null;
    const invoices = getAgencyInvoices();
    const expenses = getAgencyExpenses();
    const metrics = computeFinancialMetrics(invoices, expenses);
    return {
      collectionRate: invoices.length ? metrics.collectionRate : null,
      totalOutstanding: metrics.totalOutstanding,
      totalOverdue: metrics.totalOverdue,
      totalExpenses: metrics.totalExpenses,
    };
  }, [canViewFinancials, financeVersion]);

  const metrics = data?.metrics;
  const financials = data?.financials;
  const attentionItems = data?.attentionItems ?? [];
  const pipelineStages = data?.pipelineByStage ?? [];
  const projects = data?.projects ?? [];
  const recentActivity = data?.recentActivity ?? [];

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return language === 'id' ? 'Restricted' : 'Restricted';
    return formatAmount(value, currency, false);
  };

  const projectStatusData = useMemo(() => {
    const grouped = new Map<string, number>();
    projects.forEach((project) => {
      const key = String(project.status || 'unknown').replace(/_/g, ' ');
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });
    return Array.from(grouped.entries()).map(([label, value]) => ({
      label: label.replace(/\b\w/g, (char) => char.toUpperCase()),
      value,
      tone: statusTone(label),
    }));
  }, [projects]);

  const pipelineData = useMemo(() => pipelineStages.map((stage) => ({
    label: stage.stage.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    value: stage.count,
    detail: formatCurrency(stage.value),
  })), [pipelineStages, currency]);

  const latestFinancial = financeSeries.at(-1);
  const previousFinancial = financeSeries.at(-2);
  const financialInsight = latestFinancial && previousFinancial
    ? latestFinancial.inflow > previousFinancial.inflow
      ? 'Collected revenue is above the previous month.'
      : latestFinancial.inflow < previousFinancial.inflow
        ? 'Collected revenue is below the previous month.'
        : 'Collected revenue is flat versus the previous month.'
    : null;

  const attentionCount = attentionItems.length;
  const operationalActions = [
    { label: 'Open inbox', href: '/admin/inbox', icon: Inbox },
    { label: 'Open CRM', href: '/admin/crm', icon: Users },
    { label: 'Open projects', href: '/admin/projects', icon: BriefcaseBusiness },
    { label: 'Open invoicing', href: '/admin/invoicing', icon: Landmark },
  ];

  return (
    <div className="min-h-full pb-8">
      <header className="ams-dashboard-header mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Kapitech AMS</span>
            <span aria-hidden="true">/</span>
            <span className="text-fg">Dashboard</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold leading-7 tracking-[-0.01em] text-fg">Executive overview</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
            A live operational view of revenue, pipeline, delivery, and items that need attention.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {lastRefreshed && <span className="text-[11px] tabular-nums text-muted">Synced {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
          <button type="button" onClick={() => void fetchOverview()} disabled={isLoading} className={`${actionClass} disabled:cursor-not-allowed disabled:opacity-50`} aria-label="Refresh dashboard">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Syncing' : 'Refresh'}
          </button>
        </div>
      </header>

      {mfaRequired && (
        <section className="mb-6 flex flex-col gap-4 rounded-card border border-danger/40 bg-danger/10 p-4 sm:flex-row sm:items-center sm:justify-between" role="alert" aria-label="MFA setup required">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-danger/30 bg-danger/10 text-danger" aria-hidden="true">
              <ShieldAlert size={17} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-fg">MFA setup required</h2>
              <p className="mt-1 text-xs leading-5 text-muted">Enable MFA before using protected AMS functions.</p>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
            <button type="button" onClick={() => void retryMfaStatus()} disabled={mfaRetrying} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-danger/40 bg-danger/10 px-3 text-xs font-semibold text-danger hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger">
              <RefreshCw size={14} className={mfaRetrying ? 'animate-spin' : ''} />
              {mfaRetrying ? 'Retrying' : (language === 'id' ? 'Coba lagi' : 'Retry')}
            </button>
            <Link to="/admin/settings?tab=security&mfaRequired=1" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              MFA Settings <ArrowUpRight size={13} />
            </Link>
          </div>
        </section>
      )}

      {error && (
        <section className="mb-6 flex flex-col gap-3 rounded-card border border-danger/40 bg-danger/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p className="text-xs leading-5 text-fg">{error}</p>
          <button type="button" onClick={() => void fetchOverview()} className={actionClass}>Retry</button>
        </section>
      )}

      {isLoading && !data ? (
        <div className="space-y-6" aria-label="Loading dashboard">
          <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-3 min-[1100px]:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <React.Fragment key={`dashboard-skeleton-${index}`}>
                <SkeletonBlock className="h-24" />
              </React.Fragment>
            ))}
          </div>
          <SkeletonBlock className="h-[310px]" />
          <div className="grid gap-3 lg:grid-cols-2"><SkeletonBlock className="h-[300px]" /><SkeletonBlock className="h-[300px]" /></div>
        </div>
      ) : (
        <>
          <section aria-labelledby="snapshot-title">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 id="snapshot-title" className="text-sm font-semibold text-fg">Operational snapshot</h2>
                <p className="mt-1 text-xs text-muted">The few signals worth checking first.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-6 border-y border-line py-5 sm:grid-cols-3 min-[1100px]:grid-cols-6">
              <Metric label="Revenue collected" value={formatCurrency(metrics?.revenueCollected)} icon={CircleDollarSign} href="/admin/invoicing" context={financials?.revenueThisMonth != null ? `${formatCurrency(financials.revenueThisMonth)} this month` : 'Financial access required'} />
              <Metric label="Outstanding" value={formatCurrency(metrics?.outstandingReceivables)} icon={WalletCards} tone="warning" href="/admin/invoicing" context={metrics?.overdueReceivables ? `${formatCurrency(metrics.overdueReceivables)} overdue` : 'No overdue balance reported'} />
              <Metric label="Open leads" value={metrics?.openLeads ?? 0} icon={Users} tone="info" href="/admin/crm" context={metrics?.activePipeline != null ? `${formatCurrency(metrics.activePipeline)} active pipeline` : 'CRM access required'} />
              <Metric label="Active projects" value={metrics?.activeProjects ?? 0} icon={FolderKanban} tone="success" href="/admin/projects" context={metrics?.projectsAtRisk ? `${metrics.projectsAtRisk} at risk` : 'No active risk flags'} />
              <Metric label="Pending approvals" value={metrics?.pendingApprovals ?? 0} icon={ClipboardCheck} tone="warning" href="/admin/approvals" context="Awaiting review" />
              <Metric label="Overdue tasks" value={metrics?.overdueTasks ?? 0} icon={AlertTriangle} tone="danger" href="/admin/projects" context="Needs attention" />
            </div>
          </section>

          <section className="mt-6" aria-labelledby="financial-trend-title">
            <div className={cardClass}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 id="financial-trend-title" className="text-sm font-semibold text-fg">Financial operating trend</h2>
                  <p className="mt-1 text-xs leading-5 text-muted">Collected revenue versus recorded expenses over the last six available months.</p>
                </div>
                <Link to="/admin/invoicing" className={actionClass}>View invoicing <ArrowUpRight size={13} /></Link>
              </div>
              {canViewFinancials && financeSeries.length > 0 ? (
                <div className="mt-5">
                  <TrendChart
                    data={financeSeries.map((point) => ({ label: point.month, primary: point.inflow, secondary: point.outflow, tertiary: point.net }))}
                    primaryLabel="Revenue"
                    secondaryLabel="Expenses"
                    primaryFormat={(value) => formatAmount(value, currency, true)}
                    ariaLabel="Six month financial trend showing collected revenue and expenses."
                  />
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
                    <div><p className="text-xs text-muted">This month</p><p className="mt-1 text-sm font-medium tabular-nums text-fg">{formatCurrency(financials?.revenueThisMonth)}</p></div>
                    <div><p className="text-xs text-muted">Expenses</p><p className="mt-1 text-sm font-medium tabular-nums text-fg">{formatCurrency(financials?.operatingExpenses)}</p></div>
                    <div><p className="text-xs text-muted">Net operating profit</p><p className="mt-1 text-sm font-medium tabular-nums text-fg">{formatCurrency(financials?.netOperatingProfit)}</p></div>
                    <div><p className="text-xs text-muted">Net margin</p><p className="mt-1 text-sm font-medium tabular-nums text-fg">{financials?.margin ?? 'Restricted'}</p></div>
                  </div>
                  {financialInsight && <p className="mt-3 text-xs leading-5 text-muted"><span className="font-medium text-fg">Insight:</span> {financialInsight}</p>}
                </div>
              ) : (
                <div className="mt-4"><EmptyState message={canViewFinancials ? 'No financial trend data available.' : 'Financial trend is restricted.'} description={canViewFinancials ? 'Recorded payments and expenses will appear here once data is available.' : 'Your current role does not expose financial data.'} /></div>
              )}
            </div>
          </section>

          <div className="mt-6 grid gap-3 min-[1100px]:grid-cols-12">
            <section className={`${cardClass} min-[1100px]:col-span-7`} aria-labelledby="pipeline-title">
              <div className="flex items-start justify-between gap-3">
                <div><h2 id="pipeline-title" className="text-sm font-semibold text-fg">Lead pipeline</h2><p className="mt-1 text-xs text-muted">Lead count by current CRM stage.</p></div>
                <Link to="/admin/crm" className={actionClass}>Open CRM <ArrowUpRight size={13} /></Link>
              </div>
              <div className="mt-5">
                {pipelineData.length ? <BarChart data={pipelineData} valueLabel="Leads" ariaLabel="Lead pipeline counts by CRM stage." /> : <EmptyState message="No pipeline data available." description="CRM stage data will appear here when accessible." action={<Link to="/admin/crm" className={actionClass}>Open CRM</Link>} />}
              </div>
            </section>

            <section className={`${cardClass} min-[1100px]:col-span-5`} aria-labelledby="project-status-title">
              <div className="flex items-start justify-between gap-3">
                <div><h2 id="project-status-title" className="text-sm font-semibold text-fg">Project delivery</h2><p className="mt-1 text-xs text-muted">Current project status mix returned by the operational data.</p></div>
                <Link to="/admin/projects" className={actionClass}>Projects <ArrowUpRight size={13} /></Link>
              </div>
              <div className="mt-5">
                {projectStatusData.length ? <DonutChart data={projectStatusData} ariaLabel="Project status distribution." /> : <EmptyState message="No active project data." description="Project status will appear here when projects are available." />}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-3 min-[1100px]:grid-cols-12">
            <section className={`${cardClass} min-[1100px]:col-span-7`} aria-labelledby="financial-summary-title">
              <div className="flex items-start justify-between gap-3">
                <div><h2 id="financial-summary-title" className="text-sm font-semibold text-fg">Financial operating summary</h2><p className="mt-1 text-xs text-muted">Receivables and operating performance from current financial data.</p></div>
                {financialMetrics?.collectionRate !== null && financialMetrics?.collectionRate !== undefined && <span className="rounded-badge bg-success/10 px-2 py-1 text-[11px] font-semibold text-success">{financialMetrics.collectionRate}% collection rate</span>}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-control border border-line bg-line sm:grid-cols-4">
                <div className="bg-panel p-3.5"><p className="text-xs text-muted">Revenue</p><p className="mt-1 text-sm font-medium tabular-nums text-fg">{formatCurrency(financials?.revenueThisMonth)}</p></div>
                <div className="bg-panel p-3.5"><p className="text-xs text-muted">Expenses</p><p className="mt-1 text-sm font-medium tabular-nums text-fg">{formatCurrency(financials?.operatingExpenses)}</p></div>
                <div className="bg-panel p-3.5"><p className="text-xs text-muted">Outstanding</p><p className="mt-1 text-sm font-medium tabular-nums text-fg">{formatCurrency(financials?.outstandingReceivables)}</p></div>
                <div className="bg-panel p-3.5"><p className="text-xs text-muted">Overdue</p><p className="mt-1 text-sm font-medium tabular-nums text-danger">{formatCurrency(metrics?.overdueReceivables)}</p></div>
              </div>
              <div className="mt-4 grid gap-4 rounded-control border border-line bg-bg p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted">Collection rate</p>
                      <p className="mt-1 text-xl font-medium tabular-nums text-fg">
                        {financialMetrics?.collectionRate != null ? `${financialMetrics.collectionRate}%` : 'Restricted'}
                      </p>
                    </div>
                    <span className="text-xs text-muted">Receivables collected</span>
                  </div>
                  {financialMetrics?.collectionRate != null && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-success" style={{ width: `${Math.min(100, Math.max(0, financialMetrics.collectionRate))}%` }} />
                    </div>
                  )}
                </div>
                <div className="border-t border-line pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                  <p className="text-xs text-muted">Net operating profit</p>
                  <p className="mt-1 text-xl font-medium tabular-nums text-fg">{formatCurrency(financials?.netOperatingProfit)}</p>
                  <p className="mt-1 text-xs text-muted">Net margin {financials?.margin ?? 'Restricted'}</p>
                </div>
              </div>
            </section>

            <section className={`${cardClass} min-[1100px]:col-span-5`} aria-labelledby="attention-title">
              <div className="flex items-start justify-between gap-3">
                <div><h2 id="attention-title" className="text-sm font-semibold text-fg">Action required</h2><p className="mt-1 text-xs text-muted">Only current items generated by the operational data.</p></div>
                <span className={`rounded-badge px-2 py-1 text-[11px] font-semibold ${attentionCount ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{attentionCount}</span>
              </div>
              <div className="mt-4 space-y-2">
                {attentionItems.length ? attentionItems.slice(0, 5).map((item) => (
                  <Link key={item.id} to={item.linkUrl} className="group flex min-h-14 items-start gap-3 rounded-control border border-line bg-bg p-3 hover:border-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-control ${toneClass[item.severity === 'danger' ? 'danger' : item.severity === 'warning' ? 'warning' : 'info']}`}><AlertTriangle size={14} /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-fg">{item.title}</span><span className="mt-0.5 block text-[11px] leading-4 text-muted">{item.description}</span></span>
                    <ArrowUpRight size={14} className="mt-1 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                )) : <EmptyState message="No action required." description="No current overdue, approval, delivery, or unassigned-lead alerts were returned." />}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-3 min-[1100px]:grid-cols-12">
            <section className={`${cardClass} min-[1100px]:col-span-4`} aria-labelledby="quick-actions-title">
              <div><h2 id="quick-actions-title" className="text-sm font-semibold text-fg">Quick actions</h2><p className="mt-1 text-xs text-muted">Jump directly to the modules used most often.</p></div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {operationalActions.map((item) => {
                  const Icon = item.icon;
                  return <Link key={item.href} to={item.href} className="group flex min-h-20 flex-col justify-between rounded-control border border-line bg-bg p-3 text-xs font-medium text-fg transition-colors hover:border-muted hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Icon size={17} className="text-muted transition-colors group-hover:text-accent-text" /><span className="flex items-center justify-between gap-2">{item.label}<ArrowUpRight size={13} className="text-muted" /></span></Link>;
                })}
              </div>
            </section>

            <section className={`${cardClass} min-[1100px]:col-span-8`} aria-labelledby="activity-title">
              <div className="flex items-start justify-between gap-3"><div><h2 id="activity-title" className="text-sm font-semibold text-fg">Recent activity</h2><p className="mt-1 text-xs text-muted">Latest audit events returned for this account.</p></div><Link to="/admin/settings" className={actionClass}>View audit log <ArrowUpRight size={13} /></Link></div>
              <div className="mt-4 overflow-hidden rounded-control border border-line">
                {recentActivity.length ? recentActivity.slice(0, 6).map((event, index) => (
                  <div key={event.id ?? index} className="flex items-start gap-3 border-b border-line px-3 py-3 last:border-0">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-bg text-muted"><Activity size={14} /></span>
                    <div className="min-w-0 flex-1"><p className="text-xs leading-5 text-fg">{event.action ?? event.title ?? 'System activity'}</p><p className="mt-0.5 text-[11px] leading-4 text-muted">{event.description ?? event.actor ?? 'AMS operation'}</p></div>
                  </div>
                )) : <EmptyState message="No recent activity." description="New audit events will appear here after operational actions are recorded." />}
              </div>
            </section>
          </div>
        </>
      )}

      <div className="sr-only" aria-live="polite">{isLoading ? 'Refreshing dashboard' : 'Dashboard ready'}</div>
    </div>
  );
};

export default GlobalExecutiveDashboard;
