import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  Layers3,
  MoreVertical,
  Plus,
  ReceiptText,
  RefreshCw,
  ShieldAlert,
  Users,
  WalletCards,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { useLanguage } from '../../lib/LanguageContext';
import { CURRENCY_EVENT, CurrencyCode, formatAmount, getActiveCurrency } from '../../lib/currency';
import { getAdminSession } from '../../lib/adminAuth';
import { FINANCE_EVENT_NAME, getAgencyExpenses, getAgencyInvoices, getMonthlyCashFlowSeries } from '../../lib/financeStore';
import { AdminMetricStrip, AdminModuleHeader, AdminPanel } from './AdminModulePrimitives';
import Button from '../ui/Button';
import { DonutChart, TrendChart } from '../charts/DashboardCharts';

type RangeKey = '30D' | 'Q2' | 'YTD' | '12M';
type Tone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

interface DashboardProject {
  id: string;
  name: string;
  clientName: string;
  clientCompany: string;
  status: string;
  health?: string;
  progressPercent: number;
  budget: number;
  serviceCategory: string;
  teamLead: string;
  tasks: Array<{
    id?: string;
    title?: string;
    status?: string;
    assignedTo?: string;
    assignee?: string;
    dueDate?: string;
  }>;
}

interface DashboardTask {
  id?: string;
  status?: string;
  assignedTo?: string;
  assignee?: string;
  dueDate?: string;
  projectName?: string;
}

interface ExecutiveOverviewData {
  metrics: {
    activeProjects: number;
    projectsAtRisk: number;
    overdueTasks: number;
    outstandingReceivables: number | null;
    overdueReceivables: number | null;
    openLeads: number;
  };
  financials: {
    revenueThisMonth: number | null;
    outstandingReceivables: number | null;
  };
  projects?: unknown[];
}

const subtleActionClass =
  'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:border-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const toneClass: Record<Tone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-info/30 bg-info/10 text-info',
  muted: 'border-line bg-bg text-muted',
};

const normalizeProject = (value: any): DashboardProject => ({
  id: String(value?.id || ''),
  name: String(value?.name || value?.title || 'Untitled project'),
  clientName: String(value?.clientName || ''),
  clientCompany: String(value?.clientCompany || value?.client || ''),
  status: String(value?.status || 'planning'),
  health: value?.health ? String(value.health) : undefined,
  progressPercent: Math.min(100, Math.max(0, Number(value?.progressPercent || 0))),
  budget: Number(value?.budget || 0),
  serviceCategory: String(value?.serviceCategory || ''),
  teamLead: String(value?.teamLead || ''),
  tasks: Array.isArray(value?.tasks) ? value.tasks : [],
});

const statusTone = (status: string, health?: string): Tone => {
  const value = `${status} ${health || ''}`.toLowerCase();
  if (value.includes('block') || value.includes('delay')) return 'danger';
  if (value.includes('risk') || value.includes('hold') || value.includes('review')) return 'warning';
  if (value.includes('complete') || value.includes('done') || value.includes('good')) return 'success';
  if (value.includes('progress') || value.includes('active')) return 'info';
  return 'muted';
};

const startOfDay = (date = new Date()) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const isPastDue = (value?: string) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && startOfDay(parsed) < startOfDay();
};

const isDueWithinWeek = (value?: string) => {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = startOfDay();
  const end = new Date(today);
  end.setDate(end.getDate() + 7);
  const due = startOfDay(parsed);
  return due >= today && due <= end;
};

const EmptyState = ({
  message,
  description,
  action,
}: {
  message: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex min-h-[176px] flex-col items-center justify-center rounded-control border border-line bg-bg px-4 py-8 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-panel text-muted">
      <Layers3 size={18} />
    </div>
    <p className="mt-3 text-sm font-medium text-fg">{message}</p>
    {description && <p className="mt-1 max-w-[48ch] text-xs leading-5 text-muted">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

const initials = (value: string) =>
  value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'NA';

export const GlobalExecutiveDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [range, setRange] = useState<RangeKey>('Q2');
  const [projectFilter, setProjectFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ExecutiveOverviewData | null>(null);
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(() => getAdminSession()?.user.mfaEnabled !== true);
  const [mfaRetrying, setMfaRetrying] = useState(false);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);

    const [overviewResult, projectsResult, tasksResult] = await Promise.allSettled([
      api.executive.getOverview(),
      api.projects.getAll(),
      api.tasks.getAll(),
    ]);

    const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null;
    const projectResponse = projectsResult.status === 'fulfilled' ? projectsResult.value : null;
    const taskResponse = tasksResult.status === 'fulfilled' ? tasksResult.value : null;

    if (overview?.success) {
      setData((overview.data || overview) as ExecutiveOverviewData);
      setLastRefreshed(new Date());
    } else {
      const code = (overview?.data as { code?: string } | undefined)?.code;
      const mfaBlocked = code === 'MFA_REQUIRED' || /MFA is required/i.test(overview?.error || '');
      if (mfaBlocked) {
        setMfaRequired(true);
        setData(null);
      } else {
        setError(overview?.error || 'Dashboard data is temporarily unavailable.');
      }
    }

    if (projectResponse?.success && Array.isArray(projectResponse.data?.projects)) {
      setProjects(projectResponse.data.projects.map(normalizeProject));
    } else if (overview?.success && Array.isArray((overview.data as any)?.projects)) {
      setProjects((overview.data as any).projects.map(normalizeProject));
    }

    if (taskResponse?.success && Array.isArray(taskResponse.data?.tasks)) {
      setTasks(taskResponse.data.tasks);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    const onCurrency = (event: Event) => {
      const detail = (event as CustomEvent<{ currency?: CurrencyCode }>).detail;
      setCurrency(detail?.currency || getActiveCurrency());
    };
    const onAuthChange = () => setMfaRequired(getAdminSession()?.user.mfaEnabled !== true);
    const onFinanceChange = () => void fetchOverview();

    void fetchOverview();
    window.addEventListener(CURRENCY_EVENT, onCurrency);
    window.addEventListener('kapitech_auth_state_changed', onAuthChange);
    window.addEventListener(FINANCE_EVENT_NAME, onFinanceChange);

    return () => {
      window.removeEventListener(CURRENCY_EVENT, onCurrency);
      window.removeEventListener('kapitech_auth_state_changed', onAuthChange);
      window.removeEventListener(FINANCE_EVENT_NAME, onFinanceChange);
    };
  }, []);

  const retryMfaStatus = async () => {
    setMfaRetrying(true);
    try {
      const response = await api.auth.me();
      if (response.success && response.data?.success && response.data.user) {
        setMfaRequired(response.data.user.mfaEnabled !== true);
        if (response.data.user.mfaEnabled === true) {
          window.dispatchEvent(new CustomEvent('kapitech_auth_state_changed'));
        }
      }
    } finally {
      setMfaRetrying(false);
    }
  };

  const effectiveProjects = projects.length
    ? projects
    : (data?.projects || []).map(normalizeProject);

  const allTasks = useMemo(
    () => tasks.length
      ? tasks
      : effectiveProjects.flatMap((project) => project.tasks.map((task) => ({ ...task, projectName: project.name }))),
    [effectiveProjects, tasks]
  );

  const activeProjects = effectiveProjects.filter(
    (project) => project.status === 'in_progress' || project.status === 'review'
  ).length || data?.metrics.activeProjects || 0;

  const tasksDueThisWeek = allTasks.filter(
    (task) => task.status !== 'done' && isDueWithinWeek(task.dueDate)
  ).length;

  const overdueTasks =
    allTasks.filter((task) => task.status !== 'done' && isPastDue(task.dueDate)).length ||
    data?.metrics.overdueTasks ||
    0;

  const teamLoad = useMemo(() => {
    const counts = new Map<string, number>();
    allTasks.forEach((task) => {
      if (task.status === 'done') return;
      const owner = String(task.assignedTo || task.assignee || 'Unassigned');
      counts.set(owner, (counts.get(owner) || 0) + 1);
    });
    effectiveProjects.forEach((project) => {
      if (project.teamLead && !counts.has(project.teamLead)) counts.set(project.teamLead, 0);
    });

    const entries = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const max = Math.max(1, ...entries.map(([, count]) => count));

    return entries.map(([name, count]) => ({
      name,
      tasks: count,
      percent: count ? Math.max(8, Math.round((count / max) * 100)) : 0,
      state: count >= max * 0.9 ? 'Near max' : count >= max * 0.7 ? 'High load' : count >= max * 0.45 ? 'Balanced' : 'Available',
    }));
  }, [allTasks, effectiveProjects]);

  const deliveryData = useMemo(() => {
    const items = [
      {
        label: 'On schedule',
        value: effectiveProjects.filter((project) => {
          const health = (project.health || '').toLowerCase();
          return health === 'good' || (!health && !['on_hold', 'review'].includes(project.status));
        }).length,
        tone: 'success' as const,
      },
      {
        label: 'At risk',
        value: effectiveProjects.filter((project) => {
          const health = (project.health || '').toLowerCase();
          return health.includes('risk') || project.status === 'review' || project.status === 'on_hold';
        }).length,
        tone: 'warning' as const,
      },
      {
        label: 'Overdue',
        value: effectiveProjects.filter((project) => {
          const health = (project.health || '').toLowerCase();
          return health.includes('delay') || health.includes('block');
        }).length,
        tone: 'danger' as const,
      },
    ];
    return items.filter((item) => item.value > 0);
  }, [effectiveProjects]);

  const onSchedulePercent = useMemo(() => {
    const total = deliveryData.reduce((sum, item) => sum + item.value, 0);
    const current = deliveryData.find((item) => item.label === 'On schedule')?.value || 0;
    return total ? Math.round((current / total) * 100) : 0;
  }, [deliveryData]);

  const financeSeries = useMemo(() => {
    if (!data?.financials || data.financials.revenueThisMonth === null) return [];
    try {
      return getMonthlyCashFlowSeries(getAgencyInvoices(), getAgencyExpenses());
    } catch {
      return [];
    }
  }, [data, currency]);

  const visibleFinanceSeries = useMemo(() => {
    if (range === '30D') return financeSeries.slice(-1);
    if (range === 'Q2') return financeSeries.slice(-3);
    if (range === 'YTD') return financeSeries.slice(0, new Date().getMonth() + 1);
    return financeSeries.slice(-12);
  }, [financeSeries, range]);

  const formatCurrency = (value: number | null | undefined) =>
    value == null ? 'Restricted' : formatAmount(value, currency, false);

  const filteredProjects = useMemo(() => {
    if (projectFilter === 'All') return effectiveProjects.slice(0, 6);
    return effectiveProjects
      .filter((project) => project.serviceCategory.toLowerCase() === projectFilter.toLowerCase())
      .slice(0, 6);
  }, [effectiveProjects, projectFilter]);

  const metrics = data?.metrics;
  const financials = data?.financials;

  const kpis = [
    {
      id: 'active-projects',
      label: 'Active projects',
      value: activeProjects,
      context: effectiveProjects.length ? `${effectiveProjects.length} total projects` : 'Project access required',
      icon: <FolderKanban size={16} />,
      toneClassName: 'text-success',
    },
    {
      id: 'due-week',
      label: 'Tasks due this week',
      value: tasks.length || effectiveProjects.some((project) => project.tasks.length) ? tasksDueThisWeek : '—',
      context: allTasks.length ? 'Open tasks in the next 7 days' : 'Task data unavailable',
      icon: <CalendarClock size={16} />,
      toneClassName: 'text-muted',
    },
    {
      id: 'overdue',
      label: 'Overdue tasks',
      value: overdueTasks,
      context: overdueTasks ? 'Requires attention' : 'No overdue tasks reported',
      icon: <AlertTriangle size={16} />,
      toneClassName: overdueTasks ? 'text-danger' : 'text-success',
    },
    {
      id: 'team-workload',
      label: 'Team workload',
      value: allTasks.filter((task) => task.status !== 'done').length,
      context: teamLoad.length ? `Open tasks across ${teamLoad.length} people` : 'Team task data unavailable',
      icon: <Users size={16} />,
      toneClassName: 'text-info',
    },
    {
      id: 'monthly-revenue',
      label: 'Monthly revenue',
      value: formatCurrency(financials?.revenueThisMonth),
      context: 'Current month',
      icon: <CircleDollarSign size={16} />,
      toneClassName: 'text-accent-text',
    },
    {
      id: 'outstanding',
      label: 'Outstanding invoices',
      value: formatCurrency(financials?.outstandingReceivables ?? metrics?.outstandingReceivables),
      context: metrics?.overdueReceivables ? `${formatCurrency(metrics.overdueReceivables)} overdue` : 'No overdue balance reported',
      icon: <ReceiptText size={16} />,
      toneClassName: 'text-warning',
    },
  ];

  return (
    <div className="min-h-full pb-8">
      <AdminModuleHeader
        title="Agency overview"
        description="Real-time metrics, project pacing, and financial health for the agency."
        icon={<Layers3 size={18} />}
        actions={
          <>
            {lastRefreshed && (
              <span className="hidden text-[11px] tabular-nums text-muted sm:inline">
                Synced {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button
              type="button"
              variant="secondary"
              loading={isLoading}
              onClick={() => void fetchOverview()}
              icon={<RefreshCw size={14} />}
            >
              {isLoading ? 'Syncing' : 'Refresh'}
            </Button>
            <Link
              to="/admin/projects"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Plus size={14} />
              New project
            </Link>
          </>
        }
      />

      {mfaRequired && (
        <section className="mb-6 flex flex-col gap-4 rounded-card border border-danger/40 bg-danger/10 p-4 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-danger/30 bg-danger/10 text-danger">
              <ShieldAlert size={17} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-fg">MFA setup required</h2>
              <p className="mt-1 text-xs leading-5 text-muted">Enable MFA before using protected AMS functions.</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="destructive"
              loading={mfaRetrying}
              onClick={() => void retryMfaStatus()}
              icon={<RefreshCw size={14} />}
            >
              {language === 'id' ? 'Coba lagi' : 'Retry'}
            </Button>
            <Link to="/admin/settings?tab=security&mfaRequired=1" className={subtleActionClass}>
              MFA settings <ArrowUpRight size={13} />
            </Link>
          </div>
        </section>
      )}

      {error && (
        <section className="mb-6 flex items-center justify-between gap-3 rounded-card border border-danger/40 bg-danger/10 px-4 py-3" role="alert">
          <p className="text-xs leading-5 text-fg">{error}</p>
          <button type="button" onClick={() => void fetchOverview()} className={subtleActionClass}>Retry</button>
        </section>
      )}

      {isLoading && !data ? (
        <div className="space-y-6" aria-label="Loading dashboard">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 min-[1100px]:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-control bg-line/70" />)}
          </div>
          <div className="grid gap-3 min-[1100px]:grid-cols-12">
            <div className="h-[340px] animate-pulse rounded-card bg-line/70 min-[1100px]:col-span-8" />
            <div className="h-[340px] animate-pulse rounded-card bg-line/70 min-[1100px]:col-span-4" />
          </div>
          <div className="grid gap-3 min-[1100px]:grid-cols-12">
            <div className="h-[320px] animate-pulse rounded-card bg-line/70 min-[1100px]:col-span-8" />
            <div className="h-[320px] animate-pulse rounded-card bg-line/70 min-[1100px]:col-span-4" />
          </div>
        </div>
      ) : (
        <>
          <section aria-labelledby="dashboard-kpis">
            <div className="mb-3">
              <h2 id="dashboard-kpis" className="text-sm font-semibold text-fg">Operational snapshot</h2>
              <p className="mt-1 text-xs text-muted">The signals worth checking first.</p>
            </div>
            <AdminMetricStrip metrics={kpis} className="grid-cols-2 gap-y-6 sm:grid-cols-3 min-[1100px]:grid-cols-6" />
          </section>

          <div className="mt-6 grid gap-3 min-[1100px]:grid-cols-12">
            <AdminPanel
              className="min-[1100px]:col-span-8"
              bodyClassName="p-4 sm:p-5"
              title="Revenue vs expenses"
              description="Comparative financial performance over the selected range."
              actions={
                <div className="flex items-center gap-0.5 rounded-control bg-bg p-0.5">
                  {(['30D', 'Q2', 'YTD', '12M'] as RangeKey[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={range === item}
                      onClick={() => setRange(item)}
                      className={`rounded-chip px-2.5 py-1.5 text-xs transition-colors ${range === item ? 'bg-line font-medium text-fg' : 'text-muted hover:text-fg'} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              }
            >
              {visibleFinanceSeries.length ? (
                <TrendChart
                  data={visibleFinanceSeries.map((point) => ({
                    label: point.month,
                    primary: point.inflow,
                    secondary: point.outflow,
                    tertiary: point.net,
                  }))}
                  primaryLabel="Revenue"
                  secondaryLabel="Operating expenses"
                  primaryFormat={(value) => formatAmount(value, currency, true)}
                  ariaLabel="Revenue and operating expenses trend."
                />
              ) : (
                <EmptyState
                  message="Financial trend unavailable."
                  description="Recorded invoices and expenses will appear here when financial data is accessible."
                  action={<Link to="/admin/invoicing" className={subtleActionClass}>Open invoicing</Link>}
                />
              )}
            </AdminPanel>

            <AdminPanel
              className="min-[1100px]:col-span-4"
              bodyClassName="p-4 sm:p-5"
              title="Delivery & pacing"
              description={`Milestone delivery distribution across ${effectiveProjects.length} projects.`}
            >
              {deliveryData.length ? (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs text-muted">On schedule</span>
                    <span className="text-sm font-semibold tabular-nums text-fg">{onSchedulePercent}%</span>
                  </div>
                  <DonutChart data={deliveryData} ariaLabel="Project delivery status distribution." />
                  <div className="mt-4 space-y-3 border-t border-line pt-4">
                    {deliveryData.map((item) => {
                      const total = deliveryData.reduce((sum, entry) => sum + entry.value, 0);
                      const percent = total ? Math.round((item.value / total) * 100) : 0;
                      const fill = item.tone === 'success' ? 'bg-success' : item.tone === 'warning' ? 'bg-warning' : 'bg-danger';
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between pb-1">
                            <span className="flex items-center gap-2 text-xs text-fg">
                              <i className={`h-2 w-2 rounded-full ${fill}`} />{item.label}
                            </span>
                            <span className="text-xs tabular-nums text-muted">{item.value} ({percent}%)</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-sm bg-line">
                            <div className={`h-full rounded-sm ${fill}`} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <EmptyState message="No project delivery data." description="Project health and pacing will appear here when project data is available." action={<Link to="/admin/projects" className={subtleActionClass}>Open projects</Link>} />
              )}
            </AdminPanel>
          </div>

          <div className="mt-6 grid gap-3 min-[1100px]:grid-cols-12">
            <AdminPanel
              className="min-[1100px]:col-span-8"
              bodyClassName="p-0"
              title="Active projects"
              description="Status, delivery pacing, and project budget."
              actions={
                <div className="flex max-w-full gap-1.5 overflow-x-auto custom-scrollbar">
                  {['All', 'Enterprise', 'Retainer', 'Fixed-fee'].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      aria-pressed={projectFilter === filter}
                      onClick={() => setProjectFilter(filter)}
                      className={`h-7 shrink-0 rounded-chip border px-2.5 text-xs transition-colors ${projectFilter === filter ? 'border-line bg-panel-hover font-medium text-fg' : 'border-line bg-bg text-muted hover:text-fg'} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              }
            >
              {filteredProjects.length ? (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line bg-bg/50">
                        <th className="px-4 py-2.5 text-xs font-medium text-muted sm:px-5">Project & client</th>
                        <th className="px-3 py-2.5 text-xs font-medium text-muted">Status</th>
                        <th className="px-3 py-2.5 text-xs font-medium text-muted">Pacing</th>
                        <th className="px-3 py-2.5 text-xs font-medium text-muted">Lead</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-muted">Budget</th>
                        <th className="w-10 px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {filteredProjects.map((project) => {
                        const tone = statusTone(project.status, project.health);
                        return (
                          <tr key={project.id || project.name} className="border-b border-line last:border-0 hover:bg-panel-hover">
                            <td className="px-4 py-3 sm:px-5">
                              <div className="font-medium text-fg">{project.name}</div>
                              <div className="mt-0.5 text-[11px] text-muted">{project.clientName || project.clientCompany || 'No client assigned'}</div>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center gap-1.5 rounded-badge border px-2 py-0.5 text-[11px] font-medium ${toneClass[tone]}`}>
                                <i className={`h-1.5 w-1.5 rounded-full ${tone === 'danger' ? 'bg-danger' : tone === 'warning' ? 'bg-warning' : tone === 'success' ? 'bg-success' : tone === 'info' ? 'bg-info' : 'bg-series-4'}`} />
                                {project.health || project.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="w-36 px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 min-w-[78px] flex-1 overflow-hidden rounded-sm bg-line">
                                  <div
                                    className={`h-full rounded-sm ${tone === 'danger' ? 'bg-danger' : tone === 'warning' ? 'bg-warning' : 'bg-success'}`}
                                    style={{ width: `${project.progressPercent}%` }}
                                  />
                                </div>
                                <span className="text-[11px] tabular-nums text-muted">{project.progressPercent}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-bg text-[10px] font-medium text-fg">
                                  {initials(project.teamLead)}
                                </span>
                                <span className="max-w-[120px] truncate text-xs text-muted">{project.teamLead || 'Unassigned'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {project.budget > 0 ? <span className="text-xs font-medium tabular-nums text-fg">{formatCurrency(project.budget)}</span> : <span className="text-xs text-muted">Not set</span>}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Link to="/admin/projects" aria-label={`Open projects for ${project.name}`} className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                                <MoreVertical size={15} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-5">
                  <EmptyState
                    message={projectFilter === 'All' ? 'No active projects.' : `No projects match ${projectFilter.toLowerCase()}.`}
                    description="Project records will appear here when the current account can access them."
                    action={<Link to="/admin/projects" className={subtleActionClass}>Open projects</Link>}
                  />
                </div>
              )}
            </AdminPanel>

            <AdminPanel
              className="min-[1100px]:col-span-4"
              bodyClassName="p-4 sm:p-5"
              title="Team capacity"
              description="Current task load based on open assignments."
              actions={<span className="rounded-badge border border-line bg-bg px-2 py-1 text-[11px] text-muted tabular-nums">{teamLoad.length} leads</span>}
            >
              {teamLoad.length ? (
                <div className="space-y-4">
                  {teamLoad.map((member) => {
                    const max = Math.max(1, ...teamLoad.map((item) => item.tasks));
                    const bar = member.tasks >= max * 0.9 ? 'bg-warning' : member.tasks < max * 0.5 ? 'bg-series-3' : 'bg-success';
                    return (
                      <div key={member.name}>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-xs font-semibold text-fg">{initials(member.name)}</div>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-medium text-fg">{member.name}</div>
                              <div className="mt-0.5 text-[11px] text-muted">{member.tasks} tasks</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-medium tabular-nums text-fg">{member.percent}%</span>
                            <span className="block text-[10px] text-muted">{member.state}</span>
                          </div>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-sm bg-line">
                          <div className={`h-full rounded-sm ${bar}`} style={{ width: `${member.percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-line pt-4">
                    <Link to="/admin/time-logs" className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-accent-text">
                      View full team schedule <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyState message="No team workload data." description="Open tasks with an assignee will appear here when available." action={<Link to="/admin/projects" className={subtleActionClass}>Open projects</Link>} />
              )}
            </AdminPanel>
          </div>

          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-control border border-line bg-panel px-3 py-3"><CheckCircle2 size={15} className="text-success" /><div><p className="text-[11px] text-muted">On schedule</p><p className="text-xs font-medium tabular-nums text-fg">{onSchedulePercent}%</p></div></div>
            <div className="flex items-center gap-2 rounded-control border border-line bg-panel px-3 py-3"><Clock3 size={15} className="text-warning" /><div><p className="text-[11px] text-muted">Tasks due this week</p><p className="text-xs font-medium tabular-nums text-fg">{tasks.length ? tasksDueThisWeek : '—'}</p></div></div>
            <div className="flex items-center gap-2 rounded-control border border-line bg-panel px-3 py-3"><WalletCards size={15} className="text-warning" /><div><p className="text-[11px] text-muted">Outstanding</p><p className="text-xs font-medium tabular-nums text-fg">{formatCurrency(financials?.outstandingReceivables ?? metrics?.outstandingReceivables)}</p></div></div>
            <div className="flex items-center gap-2 rounded-control border border-line bg-panel px-3 py-3"><Users size={15} className="text-info" /><div><p className="text-[11px] text-muted">Open leads</p><p className="text-xs font-medium tabular-nums text-fg">{metrics?.openLeads ?? 0}</p></div></div>
          </section>
        </>
      )}

      <div className="sr-only" aria-live="polite">{isLoading ? 'Refreshing dashboard' : 'Dashboard ready'}</div>
    </div>
  );
};

export default GlobalExecutiveDashboard;
