import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ExternalLink, FileText, ShieldAlert } from 'lucide-react';
import { AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminSectionTabs } from '../../components/admin/AdminModulePrimitives';
import { api } from '../../lib/apiClient';

type ContractRecord = {
  id: string;
  contractNumber?: string;
  title?: string;
  status?: string;
  clientName?: string;
  contractValue?: number;
  currency?: string;
  endDate?: string;
  renewalDate?: string;
};

type ClientRecord = {
  id: string;
  company?: string;
  companyName?: string;
  name?: string;
  activeRetainer?: boolean;
  retainerId?: string;
  retainerRenewal?: string;
  retainerMonthlyValue?: number;
};

type RenewalRow = {
  id: string;
  source: 'Contract / SOW' | 'Retainer';
  title: string;
  client: string;
  date: string;
  dateLabel: string;
  status: string;
  value: string;
  href: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const nextThirtyDaysIso = () => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
const isIsoDate = (value?: string): value is string =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value + 'T00:00:00').getTime()));

const formatDate = (value: string) => {
  if (!isIsoDate(value)) return 'Date not recorded';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(value + 'T00:00:00'));
};

const formatMoney = (value: unknown, currency: string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Not recorded';
  const safeCurrency = currency === 'USD' ? 'USD' : 'IDR';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: safeCurrency,
    maximumFractionDigits: safeCurrency === 'IDR' ? 0 : 2,
  }).format(amount);
};

export const AdminClientRenewalSchedule: React.FC = () => {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [contractsAvailable, setContractsAvailable] = useState(false);
  const [clientsAvailable, setClientsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [contractResponse, clientResponse] = await Promise.all([
        api.contracts.getAll(),
        api.clients.getAll(),
      ]);
      const contractSourceAvailable = contractResponse.success && Array.isArray(contractResponse.data?.contracts);
      const clientSourceAvailable = clientResponse.success && Array.isArray(clientResponse.data?.clients);
      setContractsAvailable(contractSourceAvailable);
      setClientsAvailable(clientSourceAvailable);
      setContracts(contractSourceAvailable ? contractResponse.data.contracts as ContractRecord[] : []);
      setClients(clientSourceAvailable ? clientResponse.data.clients as ClientRecord[] : []);
      if (!contractSourceAvailable || !clientSourceAvailable) {
        setError([
          !contractSourceAvailable ? contractResponse.error || 'Contract records could not be loaded.' : '',
          !clientSourceAvailable ? clientResponse.error || 'Client retainer records could not be loaded.' : '',
        ].filter(Boolean).join(' '));
      }
    } catch (loadError) {
      setContractsAvailable(false);
      setClientsAvailable(false);
      setContracts([]);
      setClients([]);
      setError(loadError instanceof Error ? loadError.message : 'Renewal records could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo<RenewalRow[]>(() => {
    const contractRows = contracts
      .filter((contract) => String(contract.status || '').toLowerCase() === 'active')
      .map((contract): RenewalRow => {
        const hasRenewalDate = isIsoDate(contract.renewalDate);
        const hasEndDate = isIsoDate(contract.endDate);
        const date = hasRenewalDate ? String(contract.renewalDate) : hasEndDate ? String(contract.endDate) : '';
        return {
          id: 'contract:' + contract.id,
          source: 'Contract / SOW',
          title: contract.title || contract.contractNumber || 'Untitled agreement',
          client: contract.clientName || 'Client not linked',
          date,
          dateLabel: hasRenewalDate ? 'Renewal / review date' : hasEndDate ? 'Agreement end date' : 'Date not recorded',
          status: 'Active',
          value: formatMoney(contract.contractValue, contract.currency || 'IDR'),
          href: '/admin/contracts',
        };
      });
    const retainerRows = clients
      .filter((client) => client.activeRetainer === true)
      .map((client): RenewalRow => {
        const date = isIsoDate(client.retainerRenewal) ? String(client.retainerRenewal) : '';
        return {
          id: 'retainer:' + client.id,
          source: 'Retainer',
          title: String(client.retainerId || 'RET-' + client.id),
          client: String(client.company || client.companyName || client.name || 'Unnamed client'),
          date,
          dateLabel: date ? 'Retainer renewal date' : 'Date not recorded',
          status: 'Active',
          value: formatMoney(client.retainerMonthlyValue, 'IDR'),
          href: '/admin/clients/retainers',
        };
      });
    return [...contractRows, ...retainerRows].sort((left, right) =>
      (left.date || '9999-12-31').localeCompare(right.date || '9999-12-31')
      || left.client.localeCompare(right.client, undefined, { sensitivity: 'base' })
    );
  }, [contracts, clients]);

  const sourcesAvailable = contractsAvailable && clientsAvailable;
  const today = todayIso();
  const nextThirtyDays = nextThirtyDaysIso();
  const dueSoon = rows.filter((row) => row.date && row.date >= today && row.date <= nextThirtyDays).length;
  const pastDates = rows.filter((row) => row.date && row.date < today).length;
  const missingDates = rows.filter((row) => !row.date).length;

  return (
    <AdminPageShell featureSlug="client-renewal-schedule" className="ams-clients-module">
      <AdminModuleHeader
        className="mb-0"
        title="Renewal Schedule"
        description="Review renewal and end dates recorded on active contracts and retainer terms. This schedule reads existing records and does not create a second renewal register."
        actions={(
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-9 items-center justify-center rounded-control border border-line bg-bg px-3 text-xs font-medium text-fg hover:bg-panel-hover disabled:opacity-50">
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        )}
      />

      <AdminSectionTabs
        ariaLabel="Client Agreements worksheets"
        activeKey="renewals"
        className="w-full border-b border-line pb-2"
        items={[
          { key: 'contracts', label: 'Contracts & SOWs', to: '/admin/contracts' },
          { key: 'retainers', label: 'Retainers & Service Commitments', to: '/admin/clients/retainers' },
          { key: 'renewals', label: 'Renewal Schedule', to: '/admin/clients/renewals' },
          { key: 'history', label: 'Contract History', to: '/admin/contracts', available: false },
        ]}
      />

      {error && <div role="status" className="rounded-control border border-warning/25 bg-warning/5 px-3 py-3 text-xs leading-5 text-muted">{error}</div>}

      <AdminMetricStrip
        slug="client-renewal-schedule-kpis"
        metrics={[
          { id: 'active-agreements', label: 'Active agreements', value: loading || !sourcesAvailable ? '—' : rows.length, context: 'Active contracts and retainers', icon: <FileText size={15} /> },
          { id: 'due-soon', label: 'Due in 30 days', value: loading || !sourcesAvailable ? '—' : dueSoon, context: 'Recorded renewal or end dates', icon: <CalendarDays size={15} />, toneClassName: 'text-warning' },
          { id: 'past-date', label: 'Past dates', value: loading || !sourcesAvailable ? '—' : pastDates, context: 'Needs lifecycle review', icon: <ShieldAlert size={15} />, toneClassName: 'text-danger' },
          { id: 'missing-date', label: 'Date not recorded', value: loading || !sourcesAvailable ? '—' : missingDates, context: 'Active records without a usable date', icon: <CalendarDays size={15} /> },
        ]}
      />

      {!loading && !sourcesAvailable && (
        <div role="status" className="rounded-control border border-warning/25 bg-warning/5 px-3 py-3 text-xs leading-5 text-muted">
          Schedule totals are withheld until both the contract and client sources are available. Any visible rows are partial and should not be treated as a complete schedule.
        </div>
      )}

      <section className="overflow-hidden rounded-card border border-line bg-panel" aria-label="Renewal schedule records">
        <div className="flex flex-col gap-1 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div>
            <h2 className="text-sm font-semibold text-fg">Renewal and end-date schedule</h2>
            <p className="mt-1 text-[11px] leading-5 text-muted">Past-dated active agreements are flagged for review but are not automatically expired.</p>
          </div>
          <span className="text-[10px] text-muted">{loading ? 'Loading sources' : sourcesAvailable ? rows.length + ' records' : 'Partial source coverage'}</span>
        </div>

        {loading ? (
          <div role="status" aria-label="Loading renewal schedule" className="space-y-2 p-4">
            {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-control border border-line bg-bg" />)}
          </div>
        ) : rows.length === 0 ? (
          <div role="status" className="p-6 text-center">
            <CalendarDays size={19} className="mx-auto text-muted" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-fg">{sourcesAvailable ? 'No active contracts or retainers found.' : 'Renewal schedule cannot be fully verified.'}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{sourcesAvailable ? 'Active records will appear here when they exist in the canonical source modules.' : 'Refresh after both data sources are available. Failed sources are not treated as zero renewals.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {rows.map((row) => {
              const timing = !row.date ? 'Date not set' : row.date < today ? 'Past date' : row.date <= nextThirtyDays ? 'Due in 30 days' : 'Scheduled';
              const tone = timing === 'Past date'
                ? 'border-danger/25 bg-danger/10 text-danger'
                : timing === 'Due in 30 days'
                  ? 'border-warning/25 bg-warning/10 text-warning'
                  : 'border-line bg-bg text-muted';
              return (
                <article key={row.id} data-ams-slug={'renewal-schedule-' + row.id.replace(/[^a-zA-Z0-9-]+/g, '-')} className="grid min-w-0 gap-3 p-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(110px,0.55fr)_minmax(110px,0.45fr)] sm:items-center sm:gap-4 sm:p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-xs font-semibold text-fg">{row.title}</h3>
                      <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">{row.source}</span>
                    </div>
                    <p className="mt-1 break-words text-[11px] text-muted">{row.client}</p>
                    <Link to={row.href} className="mt-1 inline-flex min-h-7 items-center gap-1 text-[10px] text-accent-text hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                      Open source register <ExternalLink size={10} aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted">{row.dateLabel}</p>
                    <p className="mt-1 text-xs font-medium tabular-nums text-fg">{formatDate(row.date)}</p>
                    <p className="mt-1 text-[10px] text-muted">Lifecycle: {row.status}</p>
                  </div>
                  <div className="text-xs font-medium tabular-nums text-fg">{row.value}</div>
                  <span className={'inline-flex w-fit rounded-badge border px-2 py-1 text-[10px] font-semibold ' + tone}>{timing}</span>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="rounded-card border border-line bg-panel px-4 py-3 text-[11px] leading-5 text-muted">
        Dates come from canonical active contract and retainer records. Retainer hours and billing eligibility are not recalculated here. Missing dates remain visible as “Date not recorded.”
      </div>
    </AdminPageShell>
  );
};
