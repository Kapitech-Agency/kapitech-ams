import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, ExternalLink, FileText, Plus, RefreshCw, Search, ShieldAlert, Trash2, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { api } from '../../lib/apiClient';
import { hasAdminPermission } from '../../lib/adminAuth';
import { AdminModuleHeader, AdminPageShell, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';

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

type RelatedRecord = { id: string; name?: string; company?: string; companyName?: string; title?: string };

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
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [clients, setClients] = useState<RelatedRecord[]>([]);
  const [projects, setProjects] = useState<RelatedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transitioningId, setTransitioningId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
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
      if (!contractRes.success || !Array.isArray(contractRes.data?.contracts)) {
        setError(contractRes.error || 'Contracts could not be loaded.');
        setContracts([]);
      } else {
        setContracts(contractRes.data.contracts as ClientContract[]);
      }
      setClients(clientRes.success && Array.isArray(clientRes.data?.clients) ? clientRes.data.clients : []);
      setProjects(projectRes.success && Array.isArray(projectRes.data?.projects) ? projectRes.data.projects : []);
    } catch (requestError) {
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
  const expiringSoon = contracts.filter((item) => item.status === 'active' && item.endDate && item.endDate >= today && item.endDate <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).length;

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
    const confirmation = status === 'terminated'
      ? window.confirm('Terminate ' + contract.contractNumber + '? This action changes the contract lifecycle state.')
      : status === 'expired'
        ? window.confirm('Mark ' + contract.contractNumber + ' as expired?')
        : true;
    if (!confirmation) return;
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
    } finally {
      setTransitioningId('');
    }
  };

  const deleteDraft = async (contract: ClientContract) => {
    if (!canManage || transitioningId || contract.status !== 'draft') return;
    if (!window.confirm('Delete draft ' + contract.contractNumber + '? This action cannot be undone.')) return;
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
        title="Contracts & SOW"
        description="Manage client agreements from draft and review through signature, activation, renewal, and closeout."
        actions={<Button type="button" variant="primary" onClick={openCreate} disabled={!canManage} icon={<Plus size={14} />}>New Contract</Button>}
      />

      {error && (
        <div role="alert" className="flex flex-col gap-2 rounded-control border border-danger/25 bg-danger/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-fg">{error}</span>
          <Button type="button" variant="secondary" onClick={() => void load()} icon={<RefreshCw size={13} />}>Retry</Button>
        </div>
      )}
      {notice && <div role="status" className="flex items-center justify-between gap-2 rounded-control border border-success/20 bg-success/5 px-3 py-2 text-xs text-fg"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message" className="rounded-control p-1 text-muted hover:bg-bg"><X size={13} /></button></div>}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Contract overview">
        {[
          { label: 'Drafts', value: contracts.filter((item) => item.status === 'draft').length, note: 'Not yet submitted for review' },
          { label: 'In workflow', value: contracts.filter((item) => ['in_review', 'sent', 'signed'].includes(item.status)).length, note: 'Review and signature pending' },
          { label: 'Active agreements', value: contracts.filter((item) => item.status === 'active').length, note: 'Currently in force' },
          { label: 'Renewal / expiry watch', value: expiringSoon, note: 'Active agreements ending within 30 days' }
        ].map((metric) => (
          <div key={metric.label} className="rounded-card border border-line bg-panel p-4">
            <p className="text-[11px] font-medium text-muted">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-fg">{loading ? '—' : metric.value}</p>
            <p className="mt-1 text-[10px] leading-4 text-muted">{metric.note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-card border border-line bg-panel p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block min-w-0 flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input aria-label="Search contracts" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search contract number, client, project, or title…" className="ams-control w-full pl-9" />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Filter contracts by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ContractStatus)} className="ams-control min-w-[160px]">
              <option value="all">All statuses</option>
              {(Object.keys(statusLabels) as ContractStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
            <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading} icon={<RefreshCw size={13} />}>Refresh</Button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
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
                          {contract.status === 'draft' && <Button type="button" variant="secondary" className="h-8 px-2 text-[10px]" onClick={() => void deleteDraft(contract)} disabled={!canManage || Boolean(transitioningId)} loading={transitioningId === contract.id}><Trash2 size={12} /> Delete draft</Button>}
                          {contract.status === 'active' && isDatePast(contract.endDate) && <Button type="button" variant="secondary" className="h-8 px-2 text-[10px]" onClick={() => void transition(contract, 'expired')} disabled={!canManage || Boolean(transitioningId)}>Mark expired</Button>}
                          {contract.status === 'active' && <Button type="button" variant="secondary" className="h-8 px-2 text-[10px]" onClick={() => void transition(contract, 'terminated')} disabled={!canManage || Boolean(transitioningId)}>Terminate</Button>}
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
        <AdminTablePagination total={filtered.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="contracts" slug="contracts-pagination" />
      </section>

      <section className="flex items-start gap-3 rounded-card border border-line bg-panel px-4 py-3 text-xs text-muted">
        <ShieldAlert size={15} className="mt-0.5 shrink-0" />
        <p>Lifecycle status and audit events are stored in AMS. The workflow records review, sending, signature confirmation, activation, and closeout; it does not send emails or apply a legally binding e-signature. Store signed documents in an approved secure location and attach its HTTPS link.</p>
      </section>

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
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Contract type *</span><select className="ams-control w-full" value={form.contractType} onChange={(event) => updateForm('contractType', event.target.value as ContractType)}>{(Object.keys(typeLabels) as ContractType[]).map((type) => <option key={type} value={type} disabled={type === 'change_order' && form.contractType !== 'change_order'}>{type === 'change_order' ? 'Change order (parent link unavailable)' : typeLabels[type]}</option>)}</select></label>
            {form.contractType === 'change_order' && <p className="mt-1 text-[10px] leading-4 text-warning">This is a legacy change-order record without a verified parent-contract link. Creating new unlinked change orders is disabled.</p>}
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Link existing client</span><select className="ams-control w-full" value={form.clientId} onChange={(event) => handleClientChange(event.target.value)}><option value="">No client record selected</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.company || client.companyName || client.name || client.id}</option>)}</select></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Client / company name *</span><input className="ams-control w-full" value={form.clientName} onChange={(event) => updateForm('clientName', event.target.value)} maxLength={200} required placeholder="Client legal name" /></label>
            <label className="space-y-1.5 sm:col-span-2"><span className="text-[11px] text-muted">Related project</span><select className="ams-control w-full" value={form.projectId} onChange={(event) => handleProjectChange(event.target.value)}><option value="">Not linked to a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name || project.title || project.id}</option>)}</select></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Contract value</span><input type="number" min="0" step="0.01" className="ams-control w-full" value={form.contractValue} onChange={(event) => updateForm('contractValue', event.target.value)} /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Currency</span><select className="ams-control w-full" value={form.currency} onChange={(event) => updateForm('currency', event.target.value as Currency)}><option value="IDR">IDR · Indonesian Rupiah</option><option value="USD">USD · US Dollar</option></select></label>
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
