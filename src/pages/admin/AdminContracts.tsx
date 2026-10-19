import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, ExternalLink, FileText, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { api } from '../../lib/apiClient';
import { hasAdminPermission } from '../../lib/adminAuth';
import { AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminSectionTabs, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';

type ContractStatus = 'draft' | 'in_review' | 'sent' | 'signed' | 'active' | 'completed' | 'expired' | 'terminated';
type ContractType = 'msa' | 'sow' | 'service_agreement' | 'nda' | 'change_order';
type Currency = 'IDR' | 'USD';

type ClientContract = {
  id: string;
  contractNumber: string;
  title: string;
  contractType: ContractType;
  status: ContractStatus;
  clientId?: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  contractValue: number;
  currency: Currency;
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  documentUrl?: string;
  scope?: string;
  deliverables?: string[];
  paymentTerms?: string;
  notes?: string;
  signedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type RelatedRecord = {
  id: string;
  name?: string;
  company?: string;
  companyName?: string;
  title?: string;
  activeRetainer?: boolean;
  retainerId?: string;
  retainerRenewal?: string;
  retainerMonthlyValue?: number;
};

type RenewalScheduleRow = {
  id: string;
  source: 'Contract / SOW' | 'Retainer';
  title: string;
  clientName: string;
  date: string;
  dateLabel: string;
  status: string;
  amount: string;
  href: string;
};

type RenewalTimingFilter = 'all' | 'past-date' | 'due-soon' | 'scheduled' | 'date-not-recorded';

type ContractForm = {
  title: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  contractType: ContractType;
  contractValue: string;
  currency: Currency;
  startDate: string;
  endDate: string;
  renewalDate: string;
  documentUrl: string;
  scope: string;
  deliverables: string;
  paymentTerms: string;
  notes: string;
};

const emptyForm = (): ContractForm => ({
  title: '', clientId: '', clientName: '', projectId: '', projectName: '',
  contractType: 'sow', contractValue: '0', currency: 'IDR',
  startDate: '', endDate: '', renewalDate: '', documentUrl: '',
  scope: '', deliverables: '', paymentTerms: '', notes: ''
});

const statusLabels: Record<ContractStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  sent: 'Sent for signature',
  signed: 'Signed',
  active: 'Active',
  completed: 'Completed',
  expired: 'Expired',
  terminated: 'Terminated'
};

const statusTones: Record<ContractStatus, string> = {
  draft: 'border-line bg-bg text-muted',
  in_review: 'border-warning/25 bg-warning/10 text-warning',
  sent: 'border-info/25 bg-info/10 text-info',
  signed: 'border-accent/25 bg-accent/10 text-accent-text',
  active: 'border-success/25 bg-success/10 text-success',
  completed: 'border-line bg-bg text-muted',
  expired: 'border-danger/25 bg-danger/10 text-danger',
  terminated: 'border-danger/25 bg-danger/10 text-danger'
};

const typeLabels: Record<ContractType, string> = {
  msa: 'Master services agreement',
  sow: 'Statement of work',
  service_agreement: 'Service agreement',
  nda: 'NDA',
  change_order: 'Change order'
};

const statusOrder: ContractStatus[] = ['draft', 'in_review', 'sent', 'signed', 'active', 'completed'];
const todayIso = () => new Date().toISOString().slice(0, 10);
const isDatePast = (value?: string) => Boolean(value && value < todayIso());
const isIsoDateValue = (value?: string): value is string =>
  Boolean(value && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) && !Number.isNaN(new Date(value + 'T00:00:00').getTime()));
const getRenewalTimingKey = (date: string, today: string, nextThirtyDays: string): Exclude<RenewalTimingFilter, 'all'> => {
  if (!date) return 'date-not-recorded';
  if (date < today) return 'past-date';
  if (date <= nextThirtyDays) return 'due-soon';
  return 'scheduled';
};
const formatDate = (value?: string) => {
  if (!value) return 'Not set';
  const date = new Date(value + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatMoney = (value: number, currency: Currency) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency, maximumFractionDigits: currency === 'IDR' ? 0 : 2
}).format(Number(value) || 0);

const toForm = (contract: ClientContract): ContractForm => ({
  title: contract.title || '',
  clientId: contract.clientId || '',
  clientName: contract.clientName || '',
  projectId: contract.projectId || '',
  projectName: contract.projectName || '',
  contractType: contract.contractType || 'sow',
  contractValue: String(contract.contractValue ?? 0),
  currency: contract.currency === 'USD' ? 'USD' : 'IDR',
  startDate: contract.startDate || '',
  endDate: contract.endDate || '',
  renewalDate: contract.renewalDate || '',
  documentUrl: contract.documentUrl || '',
  scope: contract.scope || '',
  deliverables: Array.isArray(contract.deliverables) ? contract.deliverables.join('\n') : '',
  paymentTerms: contract.paymentTerms || '',
  notes: contract.notes || ''
});

export const AdminContracts: React.FC = () => {
  const canManage = hasAdminPermission('canManageProjects') || hasAdminPermission('canManageCrm') || hasAdminPermission('canManageClients');
  const [searchParams] = useSearchParams();
  const isRenewalSchedule = searchParams.get('view') === 'renewals';
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [clients, setClients] = useState<RelatedRecord[]>([]);
  const [projects, setProjects] = useState<RelatedRecord[]>([]);
  const [contractsSourceAvailable, setContractsSourceAvailable] = useState(false);
  const [clientsSourceAvailable, setClientsSourceAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transitioningId, setTransitioningId] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState<{ contract: ClientContract; status: 'expired' | 'terminated' } | null>(null);
  const [deleteDraftTarget, setDeleteDraftTarget] = useState<ClientContract | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [renewalQuery, setRenewalQuery] = useState('');
  const [renewalTimingFilter, setRenewalTimingFilter] = useState<RenewalTimingFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ContractStatus>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientContract | null>(null);
  const [form, setForm] = useState<ContractForm>(emptyForm());

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [contractRes, clientRes, projectRes] = await Promise.all([
        api.contracts.getAll(),
        api.clients.getAll(),
        api.projects.getAll()
      ]);
      const contractsAvailable = contractRes.success && Array.isArray(contractRes.data?.contracts);
      setContractsSourceAvailable(contractsAvailable);
      if (!contractsAvailable) {
        setError(contractRes.error || 'Contracts could not be loaded.');
        setContracts([]);
      } else {
        setContracts(contractRes.data.contracts as ClientContract[]);
      }
      const clientsAvailable = clientRes.success && Array.isArray(clientRes.data?.clients);
      setClientsSourceAvailable(clientsAvailable);
      setClients(clientsAvailable ? clientRes.data.clients as RelatedRecord[] : []);
      setProjects(projectRes.success && Array.isArray(projectRes.data?.projects) ? projectRes.data.projects : []);
    } catch (requestError) {
      setContractsSourceAvailable(false);
      setClientsSourceAvailable(false);
      setError(requestError instanceof Error ? requestError.message : 'Contracts could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => { setPage(1); }, [query, statusFilter, pageSize]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return contracts.filter((contract) => {
      const searchable = [contract.contractNumber, contract.title, contract.clientName, contract.projectName || '', typeLabels[contract.contractType], statusLabels[contract.status]].join(' ').toLowerCase();
      return (!normalized || searchable.includes(normalized)) && (statusFilter === 'all' || contract.status === statusFilter);
    }).sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
  }, [contracts, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const today = todayIso();
  const nextThirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const expiringSoon = contracts.filter((item) => item.status === 'active' && item.endDate && item.endDate >= today && item.endDate <= nextThirtyDays).length;
  const renewalScheduleRows = useMemo<RenewalScheduleRow[]>(() => {
    const contractRows = contracts
      .filter((contract) => contract.status === 'active')
      .map((contract): RenewalScheduleRow => {
        const hasRenewalDate = isIsoDateValue(contract.renewalDate);
        const hasEndDate = isIsoDateValue(contract.endDate);
        const date = hasRenewalDate ? String(contract.renewalDate) : hasEndDate ? String(contract.endDate) : '';
        return {
          id: 'contract:' + contract.id,
          source: 'Contract / SOW',
          title: contract.title || contract.contractNumber || 'Untitled agreement',
          clientName: contract.clientName || 'Client not linked',
          date,
          dateLabel: hasRenewalDate ? 'Renewal / review date' : hasEndDate ? 'Agreement end date' : 'Date not recorded',
          status: statusLabels[contract.status],
          amount: formatMoney(contract.contractValue, contract.currency === 'USD' ? 'USD' : 'IDR'),
          href: '/admin/contracts',
        };
      });
    const retainerRows = clients
      .filter((client) => client.activeRetainer === true)
      .map((client): RenewalScheduleRow => {
        const clientName = String(client.company || client.companyName || client.name || 'Unnamed client');
        const hasRenewalDate = isIsoDateValue(client.retainerRenewal);
        return {
          id: 'retainer:' + client.id,
          source: 'Retainer',
          title: String(client.retainerId || ('RET-' + client.id)),
          clientName,
          date: hasRenewalDate ? String(client.retainerRenewal) : '',
          dateLabel: hasRenewalDate ? 'Retainer renewal date' : 'Date not recorded',
          status: 'Active',
          amount: typeof client.retainerMonthlyValue === 'number' && Number.isFinite(client.retainerMonthlyValue)
            ? formatMoney(client.retainerMonthlyValue, 'IDR')
            : 'Not recorded',
          href: '/admin/clients/retainers',
        };
      });
    return [...contractRows, ...retainerRows].sort((left, right) =>
      (left.date || '9999-12-31').localeCompare(right.date || '9999-12-31')
      || left.clientName.localeCompare(right.clientName, undefined, { sensitivity: 'base' })
    );
  }, [contracts, clients]);
  const filteredRenewalScheduleRows = useMemo(() => {
    const normalizedQuery = renewalQuery.trim().toLocaleLowerCase();
    return renewalScheduleRows.filter((row) => {
      const matchesQuery = !normalizedQuery || [row.title, row.clientName, row.source, row.status]
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
      const matchesTiming = renewalTimingFilter === 'all'
        || getRenewalTimingKey(row.date, today, nextThirtyDays) === renewalTimingFilter;
      return matchesQuery && matchesTiming;
    });
  }, [renewalScheduleRows, renewalQuery, renewalTimingFilter, today, nextThirtyDays]);
  const renewalScheduleSourcesComplete = contractsSourceAvailable && clientsSourceAvailable;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setModalOpen(true);
  };

  const openEdit = (contract: ClientContract) => {
    setEditing(contract);
    setForm(toForm(contract));
    setError('');
    setModalOpen(true);
  };

  const updateForm = <K extends keyof ContractForm,>(key: K, value: ContractForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);
    updateForm('clientId', clientId);
    updateForm('clientName', client ? String(client.company || client.companyName || client.name || '') : form.clientName);
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    updateForm('projectId', projectId);
    updateForm('projectName', project ? String(project.name || project.title || '') : '');
    if (project && !form.clientName.trim()) {
      const linkedClient = clients.find((item) => item.id === (project as any).clientId);
      if (linkedClient) {
        updateForm('clientId', linkedClient.id);
        updateForm('clientName', String(linkedClient.company || linkedClient.companyName || linkedClient.name || ''));
      }
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage || saving) return;
    if (!form.title.trim() || !form.clientName.trim()) {
      setError('Contract title and client are required.');
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError('End date must be on or after the start date.');
      return;
    }
    if (form.documentUrl.trim() && !/^https:\/\//i.test(form.documentUrl.trim())) {
      setError('Document link must use HTTPS.');
      return;
    }

    setSaving(true);
    setError('');
    const payload = {
      ...form,
      title: form.title.trim(),
      clientName: form.clientName.trim(),
      projectName: form.projectName.trim(),
      contractValue: Number(form.contractValue || 0),
      deliverables: form.deliverables.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    };
    try {
      const response = editing
        ? await api.contracts.update(editing.id, payload)
        : await api.contracts.create(payload);
      if (!response.success || !response.data?.contract) {
        setError(response.error || 'The contract could not be saved.');
        return;
      }
      setModalOpen(false);
      setEditing(null);
      setNotice(editing ? 'Contract draft updated.' : 'Contract draft created.');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const transition = async (contract: ClientContract, status: ContractStatus) => {
    if (!canManage || transitioningId) return;
    setTransitioningId(contract.id);
    setError('');
    try {
      const response = await api.contracts.transition(contract.id, status);
      if (!response.success || !response.data?.contract) {
        setError(response.error || 'The contract status could not be changed.');
        return;
      }
      setContracts((current) => current.map((item) => item.id === contract.id ? response.data!.contract as ClientContract : item));
      setNotice(contract.contractNumber + ' moved to ' + statusLabels[status] + '.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The contract status could not be changed.');
    } finally {
      setTransitioningId('');
    }
  };

  const deleteDraft = async (contract: ClientContract) => {
    if (!canManage || transitioningId || contract.status !== 'draft') return;
    setTransitioningId(contract.id);
    setError('');
    try {
      const response = await api.contracts.delete(contract.id);
      if (!response.success) {
        setError(response.error || 'The draft could not be deleted.');
        return;
      }
      setContracts((current) => current.filter((item) => item.id !== contract.id));
      setNotice('Draft ' + contract.contractNumber + ' deleted.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The draft could not be deleted.');
    } finally {
      setTransitioningId('');
    }
  };

  const confirmPendingStatusChange = async () => {
    const pending = pendingStatusChange;
    if (!pending || !canManage || transitioningId) return;
    await transition(pending.contract, pending.status);
    setPendingStatusChange(null);
  };

  const confirmDeleteDraft = async () => {
    const target = deleteDraftTarget;
    if (!target || !canManage || transitioningId) return;
    await deleteDraft(target);
    setDeleteDraftTarget(null);
  };

  const primaryNext = (status: ContractStatus): ContractStatus | null => {
    if (status === 'draft') return 'in_review';
    if (status === 'in_review') return 'sent';
    if (status === 'sent') return 'signed';
    if (status === 'signed') return 'active';
    if (status === 'active') return 'completed';
    return null;
  };

  return (
    <AdminPageShell featureSlug="client-contracts-module">
      <AdminModuleHeader
        className="mb-0"
        title={isRenewalSchedule ? 'Renewal Schedule' : 'Contracts & SOW'}
        description={isRenewalSchedule
          ? 'Review dates recorded on active contracts and retainers. This schedule is a view over existing records, not a separate renewal register.'
          : 'Manage client agreements from draft and review through signature, activation, renewal, and closeout.'}
        actions={isRenewalSchedule
          ? <Link to="/admin/clients/retainers" className="inline-flex min-h-9 items-center justify-center rounded-control border border-line bg-bg px-3 text-xs font-medium text-fg hover:bg-panel-hover">Open Retainers</Link>
          : <Button type="button" variant="primary" onClick={openCreate} disabled={!canManage} icon={<Plus size={14} />}>New Contract</Button>}
      />

      <AdminSectionTabs
        ariaLabel="Client Agreements worksheets"
        activeKey={isRenewalSchedule ? 'renewals' : 'contracts'}
        className="w-full border-b border-line pb-2"
        items={[
          { key: 'contracts', label: 'Contracts & SOWs', to: '/admin/contracts' },
          { key: 'retainers', label: 'Retainers & Service Commitments', to: '/admin/clients/retainers' },
          { key: 'renewals', label: 'Renewal Schedule', to: '/admin/contracts?view=renewals' },
          { key: 'history', label: 'Contract History', to: '/admin/contracts', available: false },
        ]}
      />

      {isRenewalSchedule ? (
        <div className="space-y-4" data-ams-feature-slug="client-renewal-schedule" data-ams-slug="client-renewal-schedule">
          {!loading && !renewalScheduleSourcesComplete && (
            <div className="flex flex-col gap-3 rounded-control border border-warning/25 bg-warning/5 px-3 py-3 text-xs leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
              <p role="status">Renewal data is incomplete. {!contractsSourceAvailable ? 'The contract source is unavailable. ' : ''}{!clientsSourceAvailable ? 'The client retainer source is unavailable. ' : ''}Rows from available sources may still appear, but summary totals remain withheld until both sources load.</p>
              <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading} icon={<RefreshCw size={13} />} className="shrink-0">Refresh sources</Button>
            </div>
          )}
          <div data-ams-feature-slug="renewal-schedule-filters" data-ams-slug="renewal-schedule-filters" className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block min-w-0 flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input type="search" aria-label="Search renewal agreements" value={renewalQuery} onChange={(event) => setRenewalQuery(event.target.value)} placeholder="Search agreement, client, or source…" className="ams-control w-full pl-9" />
            </label>
            <div role="group" aria-label="Renewal schedule filters" className="flex min-w-0 flex-wrap items-center gap-2">
              <CustomSelect
                value={renewalTimingFilter}
                onChange={(value) => setRenewalTimingFilter(value as RenewalTimingFilter)}
                options={[
                  { value: 'all', label: 'All timing' },
                  { value: 'past-date', label: 'Past date' },
                  { value: 'due-soon', label: 'Due in 30 days' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'date-not-recorded', label: 'Date not recorded' }
                ]}
                aria-label="Filter renewals by timing"
                className="min-w-[170px]"
                triggerClassName="w-full min-w-[170px]"
                slug="renewal-timing-filter"
              />
              {(renewalQuery.trim() || renewalTimingFilter !== 'all') && (
                <Button type="button" variant="secondary" onClick={() => { setRenewalQuery(''); setRenewalTimingFilter('all'); }}>Clear filters</Button>
              )}
            </div>
          </div>
          <section className="overflow-hidden rounded-card border border-line bg-panel" aria-label="Renewal schedule records">
            <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div>
                <h2 className="text-sm font-semibold text-fg">Renewal and end-date schedule</h2>
                <p className="mt-1 text-[11px] leading-5 text-muted">The schedule reads active contracts and saved active retainer terms. It does not create or transition agreement records.</p>
              </div>
              <span aria-live="polite" className="text-[10px] text-muted">{loading ? 'Loading sources' : renewalScheduleSourcesComplete ? (filteredRenewalScheduleRows.length === renewalScheduleRows.length ? renewalScheduleRows.length + ' records' : filteredRenewalScheduleRows.length + ' of ' + renewalScheduleRows.length + ' records') : 'Partial source coverage · ' + filteredRenewalScheduleRows.length + ' available'}</span>
            </div>
            {loading ? (
              <div className="space-y-2 p-4" role="status" aria-label="Loading renewal schedule">
                {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-control border border-line bg-bg" />)}
              </div>
            ) : filteredRenewalScheduleRows.length === 0 ? (
              <div className="p-6 text-center" role="status">
                <CalendarDays size={19} className="mx-auto text-muted" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-fg">{renewalScheduleRows.length > 0 ? 'No matching renewal records.' : renewalScheduleSourcesComplete ? 'No active agreements have renewal or end-date records.' : 'Renewal schedule cannot be fully verified.'}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{renewalScheduleRows.length > 0 ? 'Clear the search or choose another timing filter.' : renewalScheduleSourcesComplete ? 'Add dates to the canonical contract or retainer records to include them in this schedule.' : 'Refresh after both contract and client record sources are available. The page will not treat unavailable data as zero renewals.'}</p>
                {renewalScheduleRows.length > 0 && <Button type="button" variant="secondary" className="mt-4" onClick={() => { setRenewalQuery(''); setRenewalTimingFilter('all'); }}>Clear filters</Button>}
              </div>
            ) : (
              <div className="divide-y divide-line">
                {filteredRenewalScheduleRows.map((row) => {
                  const timingKey = getRenewalTimingKey(row.date, today, nextThirtyDays);
                  const timing = timingKey === 'past-date' ? 'Past date' : timingKey === 'due-soon' ? 'Due in 30 days' : timingKey === 'scheduled' ? 'Scheduled' : 'Date not recorded';
                  const tone = timing === 'Past date' ? 'border-danger/25 bg-danger/10 text-danger' : timing === 'Due in 30 days' ? 'border-warning/25 bg-warning/10 text-warning' : 'border-line bg-bg text-muted';
                  return (
                    <article key={row.id} data-ams-slug={'renewal-schedule-' + row.id.replace(/[^a-zA-Z0-9-]+/g, '-')} className="grid min-w-0 gap-3 p-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(110px,0.55fr)_minmax(110px,0.45fr)] sm:items-center sm:gap-4 sm:p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-xs font-semibold text-fg">{row.title}</h3>
                          <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">{row.source}</span>
                        </div>
                        <p className="mt-1 break-words text-[11px] text-muted">{row.clientName}</p>
                        <Link to={row.href} className="mt-1 inline-flex min-h-7 items-center gap-1 text-[10px] text-accent-text hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                          Open source register <ExternalLink size={10} aria-hidden="true" />
                        </Link>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted">{row.dateLabel}</p>
                        <p className="mt-1 text-xs font-medium tabular-nums text-fg">{formatDate(row.date)}</p>
                        <p className="mt-1 text-[10px] text-muted">Lifecycle: {row.status}</p>
                      </div>
                      <div className="text-xs font-medium tabular-nums text-fg">{row.amount}</div>
                      <span className={'inline-flex w-fit rounded-badge border px-2 py-1 text-[10px] font-semibold ' + tone}>{timing}</span>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          <div className="rounded-card border border-line bg-panel px-4 py-3 text-[11px] leading-5 text-muted">
            The current contract and retainer sources do not expose an accountable owner or next-action field. Open the source register to verify ownership before follow-up. Dates come from active agreement records only. Retainer hours and billing eligibility are not recalculated here. Past-dated active records need a human lifecycle review; the schedule does not mark contracts as expired automatically.
          </div>
        </div>
      ) : (
        <>
      {error && (
        <div role="alert" className="flex flex-col gap-2 rounded-control border border-danger/25 bg-danger/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-fg">{error}</span>
          <Button type="button" variant="secondary" onClick={() => void load()} icon={<RefreshCw size={13} />}>Retry</Button>
        </div>
      )}



      <section className="rounded-card border border-line bg-panel p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block min-w-0 flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input aria-label="Search contracts" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search contract number, client, project, or title…" className="ams-control w-full pl-9" />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as 'all' | ContractStatus)}
              options={[
                { value: 'all', label: 'All statuses' },
                ...(Object.keys(statusLabels) as ContractStatus[]).map((status) => ({ value: status, label: statusLabels[status] }))
              ]}
              aria-label="Filter contracts by status"
              className="min-w-[160px]"
              triggerClassName="w-full min-w-[160px]"
              slug="contracts-status-filter"
            />
            <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading} icon={<RefreshCw size={13} />}>Refresh</Button>
          </div>
        </div>

        <div className="mt-4 min-w-0">
          <div className="grid gap-3 min-[1280px]:hidden" data-ams-feature-slug="contracts-compact-cards" role="list" aria-label="Contract and statement of work cards">
            {loading ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-card border border-line bg-bg p-4" role="status" aria-label="Loading contract">
                <div className="h-3 w-44 max-w-full animate-pulse rounded-badge bg-line" />
                <div className="mt-3 h-3 w-28 animate-pulse rounded-badge bg-line" />
                <div className="mt-4 grid grid-cols-2 gap-3"><div className="h-9 animate-pulse rounded-control bg-line/60" /><div className="h-9 animate-pulse rounded-control bg-line/60" /></div>
              </div>
            )) : visible.length ? visible.map((contract) => {
              const next = primaryNext(contract.status);
              return (
                <article key={contract.id} data-ams-slug={'contract-card-' + contract.id} role="listitem" className="min-w-0 rounded-card border border-line bg-bg p-3.5">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-semibold text-fg">{contract.title}</h3>
                      <p className="mt-1 break-words font-mono text-[10px] text-muted">{contract.contractNumber}</p>
                      <p className="mt-1 text-[10px] text-muted">{typeLabels[contract.contractType]}</p>
                    </div>
                    <span className={'inline-flex shrink-0 rounded-badge border px-2 py-1 text-[10px] font-medium ' + statusTones[contract.status]}>{statusLabels[contract.status]}</span>
                  </div>
                  <div className="mt-3 border-y border-line py-3">
                    <p className="text-xs font-medium text-fg">{contract.clientName}</p>
                    <p className="mt-1 break-words text-[11px] text-muted">{contract.projectName || 'Not linked to a project'}</p>
                    {contract.documentUrl && <a href={contract.documentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-[11px] text-muted hover:text-fg"><ExternalLink size={12} />Agreement file</a>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="min-w-0"><p className="text-[10px] text-muted">Start date</p><p className="mt-1 break-words text-xs text-fg">{formatDate(contract.startDate)}</p></div>
                    <div className="min-w-0"><p className="text-[10px] text-muted">End date</p><p className="mt-1 break-words text-xs text-fg">{formatDate(contract.endDate)}</p>{contract.status === 'active' && isDatePast(contract.endDate) && <p className="mt-1 text-[10px] text-danger">End date passed; update lifecycle status</p>}</div>
                    <div className="col-span-2 min-w-0"><p className="text-[10px] text-muted">Contract value</p><p className="mt-1 break-words text-sm font-semibold tabular-nums text-fg">{formatMoney(contract.contractValue, contract.currency)}</p></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                    {['draft', 'in_review'].includes(contract.status) && <Button type="button" variant="secondary" className="min-h-9 px-3 text-[10px]" onClick={() => openEdit(contract)} disabled={!canManage}>Edit draft</Button>}
                    {next && <Button type="button" variant="primary" className="min-h-9 px-3 text-[10px]" onClick={() => void transition(contract, next)} disabled={!canManage || Boolean(transitioningId)} loading={transitioningId === contract.id}>{next === 'in_review' ? 'Send to review' : next === 'sent' ? 'Send for signature' : next === 'signed' ? 'Record signature' : next === 'active' ? 'Activate' : 'Complete'} <ArrowRight size={12} /></Button>}
                    {contract.status === 'draft' && <Button type="button" variant="secondary" className="min-h-9 px-3 text-[10px]" onClick={() => setDeleteDraftTarget(contract)} disabled={!canManage || Boolean(transitioningId) || Boolean(deleteDraftTarget)} loading={transitioningId === contract.id}><Trash2 size={12} />Delete draft</Button>}
                    {contract.status === 'active' && isDatePast(contract.endDate) && <Button type="button" variant="secondary" className="min-h-9 px-3 text-[10px]" onClick={() => setPendingStatusChange({ contract, status: 'expired' })} disabled={!canManage || Boolean(transitioningId) || Boolean(pendingStatusChange)}>Mark expired</Button>}
                    {contract.status === 'active' && <Button type="button" variant="secondary" className="min-h-9 px-3 text-[10px]" onClick={() => setPendingStatusChange({ contract, status: 'terminated' })} disabled={!canManage || Boolean(transitioningId) || Boolean(pendingStatusChange)}>Terminate</Button>}
                  </div>
                </article>
              );
            }) : (
              <div className="rounded-card border border-line bg-bg px-4 py-10 text-center">
                <ClipboardCheck size={20} className="mx-auto text-muted" />
                <p className="mt-3 text-sm font-medium text-fg">{contracts.length ? 'No contracts match these filters.' : 'No contracts or SOWs recorded yet.'}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{contracts.length ? 'Clear the search or choose another status.' : 'Create a draft to start the review and signature workflow. This register does not create an e-signature on your behalf.'}</p>
                {!contracts.length && canManage && <Button type="button" variant="secondary" className="mt-4" onClick={openCreate} icon={<Plus size={13} />}>Create first contract</Button>}
              </div>
            )}
          </div>
          <div className="hidden min-[1280px]:block overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead><tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
              <th className="px-3 py-3 font-medium">Contract / SOW</th>
              <th className="px-3 py-3 font-medium">Client & project</th>
              <th className="px-3 py-3 font-medium">Term</th>
              <th className="px-3 py-3 text-right font-medium">Value</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 text-right font-medium">Workflow</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {loading ? Array.from({ length: 4 }).map((_, index) => <tr key={index}><td colSpan={6} className="px-3 py-4"><div className="h-3 w-56 animate-pulse rounded-badge bg-line" /></td></tr>) :
                visible.length ? visible.map((contract) => {
                  const next = primaryNext(contract.status);
                  return (
                    <tr key={contract.id} data-ams-slug={'contract-' + contract.id} className="transition-colors hover:bg-bg/60">
                      <td className="px-3 py-3 align-top">
                        <p className="text-xs font-semibold text-fg">{contract.title}</p>
                        <p className="mt-1 font-mono text-[10px] text-muted">{contract.contractNumber}</p>
                        <p className="mt-1 text-[10px] text-muted">{typeLabels[contract.contractType]}</p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="text-xs font-medium text-fg">{contract.clientName}</p>
                        <p className="mt-1 text-[10px] text-muted">{contract.projectName || 'Not linked to a project'}</p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center gap-1.5 text-xs text-fg"><CalendarDays size={13} className="text-muted" />{formatDate(contract.startDate)}</div>
                        <p className="mt-1 text-[10px] text-muted">Until {formatDate(contract.endDate)}</p>
                        {contract.status === 'active' && isDatePast(contract.endDate) && <p className="mt-1 text-[10px] text-danger">End date passed; update lifecycle status</p>}
                      </td>
                      <td className="px-3 py-3 text-right align-top text-xs font-medium tabular-nums text-fg">{formatMoney(contract.contractValue, contract.currency)}</td>
                      <td className="px-3 py-3 align-top"><span className={'inline-flex min-h-6 items-center rounded-badge border px-2 py-0.5 text-[10px] font-medium ' + statusTones[contract.status]}>{statusLabels[contract.status]}</span>
                        {contract.documentUrl && <a href={contract.documentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted hover:text-fg"><ExternalLink size={11} />Agreement file</a>}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {['draft', 'in_review'].includes(contract.status) && <Button type="button" variant="secondary" className="h-8 px-2 text-[10px]" onClick={() => openEdit(contract)} disabled={!canManage}>Edit draft</Button>}
                          {next && <Button type="button" variant="primary" className="h-8 px-2 text-[10px]" onClick={() => void transition(contract, next)} disabled={!canManage || Boolean(transitioningId)} loading={transitioningId === contract.id}>{next === 'in_review' ? 'Send to review' : next === 'sent' ? 'Send for signature' : next === 'signed' ? 'Record signature' : next === 'active' ? 'Activate' : 'Complete'} <ArrowRight size={12} /></Button>}
                          {contract.status === 'draft' && <Button type="button" variant="secondary" className="h-8 px-2 text-[10px]" onClick={() => setDeleteDraftTarget(contract)} disabled={!canManage || Boolean(transitioningId) || Boolean(deleteDraftTarget)} loading={transitioningId === contract.id}><Trash2 size={12} /> Delete draft</Button>}
                          {contract.status === 'active' && isDatePast(contract.endDate) && <Button type="button" variant="secondary" className="h-8 px-2 text-[10px]" onClick={() => setPendingStatusChange({ contract, status: 'expired' })} disabled={!canManage || Boolean(transitioningId) || Boolean(pendingStatusChange)}>Mark expired</Button>}
                          {contract.status === 'active' && <Button type="button" variant="secondary" className="h-8 px-2 text-[10px]" onClick={() => setPendingStatusChange({ contract, status: 'terminated' })} disabled={!canManage || Boolean(transitioningId) || Boolean(pendingStatusChange)}>Terminate</Button>}
                        </div>
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan={6} className="px-4 py-16 text-center">
                  <ClipboardCheck size={20} className="mx-auto text-muted" />
                  <p className="mt-3 text-sm font-medium text-fg">{contracts.length ? 'No contracts match these filters.' : 'No contracts or SOWs recorded yet.'}</p>
                  <p className="mt-1 text-xs text-muted">{contracts.length ? 'Clear the search or choose another status.' : 'Create a draft to start the review and signature workflow. This register does not create an e-signature on your behalf.'}</p>
                  {!contracts.length && canManage && <Button type="button" variant="secondary" className="mt-4" onClick={openCreate} icon={<Plus size={13} />}>Create first contract</Button>}
                </td></tr>}
            </tbody>
          </table>
          </div>
        </div>
        <AdminTablePagination total={filtered.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="contracts" slug="contracts-pagination" />
      </section>

      {notice && <div role="status" className="flex items-center justify-between gap-2 rounded-control border border-success/20 bg-success/5 px-3 py-2 text-xs text-fg"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message" className="rounded-control p-1 text-muted hover:bg-bg"><X size={13} /></button></div>}

      <section data-ams-feature-slug="contracts-overview-kpis" data-ams-slug="contracts-overview-kpis" aria-label="Contract overview">
        <AdminMetricStrip
          slug="contracts-overview-kpis"
          metrics={[
            { id: 'drafts', label: 'Drafts', value: loading ? '—' : contracts.filter((item) => item.status === 'draft').length, context: 'Not yet submitted for review', icon: <FileText size={15} /> },
            { id: 'in-workflow', label: 'In workflow', value: loading ? '—' : contracts.filter((item) => ['in_review', 'sent', 'signed'].includes(item.status)).length, context: 'Review and signature pending', icon: <RefreshCw size={15} />, toneClassName: 'text-info' },
            { id: 'active-agreements', label: 'Active agreements', value: loading ? '—' : contracts.filter((item) => item.status === 'active').length, context: 'Currently in force', icon: <CheckCircle2 size={15} />, toneClassName: 'text-success' },
            { id: 'renewal-expiry-watch', label: 'Renewal / expiry watch', value: loading ? '—' : expiringSoon, context: 'Active agreements ending within 30 days', icon: <CalendarDays size={15} />, toneClassName: 'text-warning' }
          ]}
        />
      </section>

      <section className="flex items-start gap-3 rounded-card border border-line bg-panel px-4 py-3 text-xs text-muted">
        <ShieldAlert size={15} className="mt-0.5 shrink-0" />
        <p>Lifecycle status and audit events are stored in AMS. The workflow records review, sending, signature confirmation, activation, and closeout; it does not send emails or apply a legally binding e-signature. Store signed documents in an approved secure location and attach its HTTPS link.</p>
      </section>

        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingStatusChange)}
        onClose={() => { if (!transitioningId) setPendingStatusChange(null); }}
        title={pendingStatusChange?.status === 'terminated' ? 'Terminate contract?' : 'Mark contract as expired?'}
        description={pendingStatusChange
          ? pendingStatusChange.status === 'terminated'
            ? 'Terminate ' + pendingStatusChange.contract.contractNumber + '? This action changes the contract lifecycle state.'
            : 'Mark ' + pendingStatusChange.contract.contractNumber + ' as expired?'
          : 'Confirm the contract lifecycle change.'}
        confirmLabel={pendingStatusChange?.status === 'terminated' ? 'Terminate contract' : 'Mark expired'}
        onConfirm={() => void confirmPendingStatusChange()}
        loading={Boolean(pendingStatusChange && transitioningId === pendingStatusChange.contract.id)}
      />
      <ConfirmDialog
        open={Boolean(deleteDraftTarget)}
        onClose={() => { if (!transitioningId) setDeleteDraftTarget(null); }}
        title="Delete contract draft?"
        description={deleteDraftTarget ? 'Delete draft ' + deleteDraftTarget.contractNumber + '? This action cannot be undone.' : 'This draft contract will be deleted.'}
        confirmLabel="Delete draft"
        onConfirm={() => void confirmDeleteDraft()}
        loading={Boolean(deleteDraftTarget && transitioningId === deleteDraftTarget.id)}
      />

      <Drawer
        slug="client-contract-editor"
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        size="xl"
        title={editing ? 'Edit contract draft' : 'New contract or SOW'}
        description="Set the commercial scope and keep each agreement linked to the right client and project."
        footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" form="contract-editor-form" variant="primary" loading={saving}>{editing ? 'Save draft' : 'Create draft'}</Button></div>}
      >
        <form id="contract-editor-form" onSubmit={save} className="space-y-4">
          {error && <p role="alert" className="rounded-control border border-danger/25 bg-danger/5 px-3 py-2 text-xs text-danger">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Contract title *</span><input className="ams-control w-full" value={form.title} onChange={(event) => updateForm('title', event.target.value)} maxLength={200} required placeholder="Website redesign statement of work" /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Contract type *</span><CustomSelect value={form.contractType} onChange={(value) => updateForm('contractType', value as ContractType)} options={(Object.keys(typeLabels) as ContractType[]).map((type) => ({ value: type, label: type === 'change_order' ? 'Change order (parent link unavailable)' : typeLabels[type], disabled: type === 'change_order' && form.contractType !== 'change_order' }))} aria-label="Contract type" className="w-full" triggerClassName="w-full" slug="contract-type-select" /></label>
            {form.contractType === 'change_order' && <p className="mt-1 text-[10px] leading-4 text-warning">This is a legacy change-order record without a verified parent-contract link. Creating new unlinked change orders is disabled.</p>}
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Link existing client</span><CustomSelect value={form.clientId} onChange={handleClientChange} options={[{ value: '', label: 'No client record selected' }, ...clients.map((client) => ({ value: client.id, label: String(client.company || client.companyName || client.name || client.id) }))]} aria-label="Link existing client" className="w-full" triggerClassName="w-full" slug="contract-client-select" /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Client / company name *</span><input className="ams-control w-full" value={form.clientName} onChange={(event) => updateForm('clientName', event.target.value)} maxLength={200} required placeholder="Client legal name" /></label>
            <label className="space-y-1.5 sm:col-span-2"><span className="text-[11px] text-muted">Related project</span><CustomSelect value={form.projectId} onChange={handleProjectChange} options={[{ value: '', label: 'Not linked to a project' }, ...projects.map((project) => ({ value: project.id, label: String(project.name || project.title || project.id) }))]} aria-label="Related project" className="w-full" triggerClassName="w-full" slug="contract-project-select" /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Contract value</span><input type="number" min="0" step="0.01" className="ams-control w-full" value={form.contractValue} onChange={(event) => updateForm('contractValue', event.target.value)} /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Currency</span><CustomSelect value={form.currency} onChange={(value) => updateForm('currency', value as Currency)} options={[{ value: 'IDR', label: 'IDR · Indonesian Rupiah' }, { value: 'USD', label: 'USD · US Dollar' }]} aria-label="Currency" className="w-full" triggerClassName="w-full" slug="contract-currency-select" /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Start date</span><input type="date" className="ams-control w-full" value={form.startDate} onChange={(event) => updateForm('startDate', event.target.value)} /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">End date</span><input type="date" className="ams-control w-full" value={form.endDate} min={form.startDate || undefined} onChange={(event) => updateForm('endDate', event.target.value)} /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Renewal / review date</span><input type="date" className="ams-control w-full" value={form.renewalDate} onChange={(event) => updateForm('renewalDate', event.target.value)} /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Signed document link (HTTPS)</span><input type="url" className="ams-control w-full" value={form.documentUrl} onChange={(event) => updateForm('documentUrl', event.target.value)} placeholder="https://…" /></label>
          </div>
          <label className="block space-y-1.5"><span className="text-[11px] text-muted">Scope and responsibilities</span><textarea rows={3} className="ams-control w-full" value={form.scope} onChange={(event) => updateForm('scope', event.target.value)} maxLength={5000} placeholder="In-scope work, exclusions, client responsibilities…" /></label>
          <label className="block space-y-1.5"><span className="text-[11px] text-muted">Deliverables (one per line)</span><textarea rows={3} className="ams-control w-full" value={form.deliverables} onChange={(event) => updateForm('deliverables', event.target.value)} placeholder="Discovery & requirements report&#10;UI/UX design files&#10;Production-ready website" /></label>
          <label className="block space-y-1.5"><span className="text-[11px] text-muted">Payment terms</span><textarea rows={2} className="ams-control w-full" value={form.paymentTerms} onChange={(event) => updateForm('paymentTerms', event.target.value)} maxLength={2000} placeholder="Milestones, due dates, tax, late fees…" /></label>
          <label className="block space-y-1.5"><span className="text-[11px] text-muted">Internal notes</span><textarea rows={2} className="ams-control w-full" value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} maxLength={3000} placeholder="Internal handover or approval context" /></label>
        </form>
      </Drawer>
    </AdminPageShell>
  );
};

export default AdminContracts;
