import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { AdminModuleHeader, AdminModuleNotice, AdminPageShell } from '../../components/admin/AdminModulePrimitives';
import { AdminDataTableShell, AdminPanel } from '../../components/admin/AdminModulePrimitives';
import { AdminFilterToolbar } from '../../components/admin/AdminFilterToolbar';
import { DashboardEmptyState } from '../../components/admin/DashboardEmptyState';
import { FinanceRecordSurface } from '../../components/admin/finance/FinanceRecordSurface';
import Button from '../../components/ui/Button';

type ProjectProfitabilityRow = {
  projectId: string;
  projectName: string;
  clientName: string;
  projectStatus: string;
  currency: string;
  budget: number | null;
  invoiced: number;
  collected: number;
  outstanding: number;
  recordedCosts: number;
  contribution: number;
  marginPercent: number | null;
};

const currencyFormatter = (currency: string, value: number) => {
  const safeCurrency = /^[A-Z]{3}$/.test(currency) ? currency : 'IDR';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: safeCurrency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
};

const statusLabel = (value: string) => value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export const AdminProjectProfitability: React.FC = () => {
  const [projects, setProjects] = useState<ProjectProfitabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await api.finance.getProjectProfitability();
      if (!response.success || !Array.isArray(response.data?.projects)) {
        setError(response.error || 'Project profitability data is temporarily unavailable.');
        return;
      }
      setProjects(response.data.projects);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Project profitability data is temporarily unavailable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleProjects = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      [project.projectName, project.clientName, project.projectStatus, project.currency]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [projects, searchText]);

  const idrRows = useMemo(() => projects.filter((project) => project.currency === 'IDR'), [projects]);
  const idrCollected = idrRows.reduce((sum, project) => sum + project.collected, 0);
  const idrOutstanding = idrRows.reduce((sum, project) => sum + project.outstanding, 0);
  const idrCosts = idrRows.reduce((sum, project) => sum + project.recordedCosts, 0);
  const idrContribution = idrRows.reduce((sum, project) => sum + project.contribution, 0);
  const projectCount = new Set(projects.map((project) => project.projectId)).size;

  return (
    <AdminPageShell featureSlug="project-profitability-aggregate-workspace">
      <AdminModuleHeader
        slug="project-profitability-header"
        title="Project Profitability"
        description="Project-level commercial performance and recorded costs. Individual vendor and employee rates are not shown in this workspace."
        className="mb-0"
        actions={(
          <Button type="button" variant="secondary" icon={<RefreshCw size={14} />} loading={refreshing} onClick={() => void load(true)}>
            Refresh
          </Button>
        )}
      />

      {error && (
        <AdminModuleNotice tone="danger" slug="project-profitability-error">
          <div className="flex min-w-0 items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button type="button" className="ml-auto text-xs font-semibold text-fg underline underline-offset-2" onClick={() => void load()}>
            Retry
          </button>
        </AdminModuleNotice>
      )}



      <AdminFilterToolbar slug="project-profitability-search" searchValue={searchText} onSearchChange={setSearchText} searchLabel="Search project profitability" searchPlaceholder="Search project or client" activeFilterCount={0} onReset={() => setSearchText('')} />
      <AdminPanel className="ams-operational-panel ams-overview-panel" slug="project-profitability-table" title="Project-level financial summary" description="Figures remain separated by currency; only project aggregates are returned to this view."><AdminDataTableShell embedded>
      {loading ? <div className="p-4 text-xs text-muted" role="status">Loading aggregate project data…</div> : !visibleProjects.length ? <DashboardEmptyState inset eyebrow="Project finance" title={error ? 'Project data unavailable' : 'No matching projects'} description={error ? 'Retry to load the aggregate project source.' : 'No project profitability records match this search.'} /> : (
        <FinanceRecordSurface caption="Project-level financial summary">
          <table className="w-full min-w-[1040px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-bg/60 text-[10px] font-semibold uppercase tracking-wide text-muted">
                <th scope="col" className="px-4 py-3 sm:px-5">Project / Client</th>
                <th scope="col" className="px-3 py-3">Status</th>
                <th scope="col" className="px-3 py-3 text-right">Budget</th>
                <th scope="col" className="px-3 py-3 text-right">Invoiced</th>
                <th scope="col" className="px-3 py-3 text-right">Collected</th>
                <th scope="col" className="px-3 py-3 text-right">Outstanding</th>
                <th scope="col" className="px-3 py-3 text-right">Recorded costs</th>
                <th scope="col" className="px-3 py-3 text-right">Contribution</th>
                <th scope="col" className="px-4 py-3 text-right sm:px-5">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visibleProjects.map((project) => (
                <tr key={project.projectId + ':' + project.currency} className="transition-colors hover:bg-bg/40">
                  <td className="px-4 py-3 sm:px-5">
                    <p className="font-medium text-fg">{project.projectName || 'Untitled project'}</p>
                    <p className="mt-1 text-[10px] text-muted">{project.clientName || 'No client linked'} · {project.currency}</p>
                  </td>
                  <td className="px-3 py-3 text-muted">{statusLabel(project.projectStatus)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{project.budget == null ? '—' : currencyFormatter(project.currency, project.budget)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-fg">{currencyFormatter(project.currency, project.invoiced)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-fg">{currencyFormatter(project.currency, project.collected)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{currencyFormatter(project.currency, project.outstanding)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{currencyFormatter(project.currency, project.recordedCosts)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium text-fg">{currencyFormatter(project.currency, project.contribution)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-fg sm:px-5">{project.marginPercent == null ? '—' : project.marginPercent.toFixed(1) + '%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </FinanceRecordSurface>)}

        <div className="border-t border-line px-4 py-3 sm:px-5">
          <p className="text-[10px] leading-4 text-muted">
            Aggregate formula: collected revenue minus recorded expenses. This is a management contribution indicator, not a fully allocated accounting profit unless all project costs have been recorded and classified.
          </p>
        </div>
</AdminDataTableShell></AdminPanel>

      <section aria-label="Aggregate profitability metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-card border border-line bg-panel p-4" data-ams-slug="profitability-project-count">
          <p className="text-[11px] font-medium text-muted">Projects in report</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-fg">{loading ? '—' : projectCount}</p>
          <p className="mt-1 text-[10px] text-muted">Distinct projects across currencies</p>
        </div>
        <div className="rounded-card border border-line bg-panel p-4" data-ams-slug="profitability-collected-idr">
          <p className="text-[11px] font-medium text-muted">Collected · IDR only</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-fg">{loading ? '—' : currencyFormatter('IDR', idrCollected)}</p>
          <p className="mt-1 text-[10px] text-muted">Issued invoice payments recorded in AMS</p>
        </div>
        <div className="rounded-card border border-line bg-panel p-4" data-ams-slug="profitability-outstanding-idr">
          <p className="text-[11px] font-medium text-muted">Outstanding · IDR only</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-fg">{loading ? '—' : currencyFormatter('IDR', idrOutstanding)}</p>
          <p className="mt-1 text-[10px] text-muted">Open balances for issued invoices</p>
        </div>
        <div className="rounded-card border border-line bg-panel p-4" data-ams-slug="profitability-contribution-idr">
          <p className="text-[11px] font-medium text-muted">Contribution · IDR only</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-fg">{loading ? '—' : currencyFormatter('IDR', idrContribution)}</p>
          <p className="mt-1 text-[10px] text-muted">Collected revenue less recorded expenses ({currencyFormatter('IDR', idrCosts)} costs)</p>
        </div>
      </section>
    </AdminPageShell>
  );
};

export default AdminProjectProfitability;
