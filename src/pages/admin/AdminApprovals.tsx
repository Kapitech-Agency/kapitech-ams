import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck, FileText, Plus, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';

import { AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminStatusBadge, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';
import { api } from '../../lib/apiClient';
import { getAdminSession, hasAdminPermission } from '../../lib/adminAuth';

type ApprovalType = 'Invoice' | 'Proposal' | 'Project' | 'Expense';
type ApprovalAction = 'Approve' | 'Reject' | 'Request Changes';

type ApprovalRecord = {
  id: string;
  type: ApprovalType | string;
  referenceId: string;
  title: string;
  reason?: string;
  riskLevel?: string;
  value?: number;
  currency?: string;
  date?: string;
  createdAt?: string;
  status: string;
  requesterId?: string;
  requester?: string;
  requesterRole?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
};

type ReferenceOption = { id: string; label: string; value: number; currency?: string };

const APPROVAL_TYPES: ApprovalType[] = ['Invoice', 'Proposal', 'Project', 'Expense'];
const APPROVAL_ACTIONS: ApprovalAction[] = ['Approve', 'Reject', 'Request Changes'];

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const formatValue = (value: unknown, currency = 'IDR') => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: currency || 'IDR', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return amount.toLocaleString('id-ID');
  }
};

const statusTone = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
  const value = String(status || '').toLowerCase();
  if (value === 'approved') return 'success';
  if (value === 'rejected') return 'danger';
  if (value.includes('change')) return 'warning';
  if (value === 'pending') return 'info';
  return 'neutral';
};

const controlClass = 'h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none placeholder:text-muted focus:border-accent';
const labelClass = 'mb-1.5 block text-[11px] font-medium text-muted';

export const AdminApprovals: React.FC = () => {
  const session = getAdminSession();
  const canRequest = hasAdminPermission('canManageProjects') || hasAdminPermission('canApproveBudgets');
  const canResolve = hasAdminPermission('canApproveBudgets');
  const [records, setRecords] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestType, setRequestType] = useState<ApprovalType>('Project');
  const [references, setReferences] = useState<ReferenceOption[]>([]);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestRisk, setRequestRisk] = useState('Medium');
  const [requestValue, setRequestValue] = useState('0');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [actionTarget, setActionTarget] = useState<ApprovalRecord | null>(null);
  const [action, setAction] = useState<ApprovalAction>('Approve');
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadRecords = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setLoadError(null);
    try {
      const response = await api.approvals.getAll();
      if (!response.success || !Array.isArray(response.data?.approvals)) {
        throw new Error(response.error || 'Approval records could not be loaded.');
      }
      setRecords(response.data.approvals as ApprovalRecord[]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Approval records could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void loadRecords(); }, []);

  const metrics = useMemo(() => ({
    total: records.length,
    pending: records.filter((item) => String(item.status).toLowerCase() === 'pending').length,
    approved: records.filter((item) => String(item.status).toLowerCase() === 'approved').length,
    changes: records.filter((item) => String(item.status).toLowerCase().includes('change')).length
  }), [records]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((item) => {
      const matchesSearch = !query || [item.title, item.type, item.requester, item.reason, item.referenceId, item.id].some((value) => String(value || '').toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all' || String(item.status).toLowerCase() === statusFilter.toLowerCase();
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    }).sort((a, b) => {
      const pendingOrder = Number(String(b.status).toLowerCase() === 'pending') - Number(String(a.status).toLowerCase() === 'pending');
      return pendingOrder || new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime();
    });
  }, [records, search, statusFilter, typeFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const loadReferences = async (type: ApprovalType) => {
    setReferenceLoading(true);
    setReferenceError(null);
    setReferences([]);
    setReferenceId('');
    setRequestTitle('');
    setRequestValue('0');
    try {
      let list: any[] = [];
      if (type === 'Invoice') {
        const result = await api.finance.getInvoices();
        if (!result.success) throw new Error(result.error || 'Invoices are unavailable to this role.');
        list = Array.isArray(result.data?.invoices) ? result.data.invoices : [];
      } else if (type === 'Proposal') {
        const result = await api.proposals.getAll();
        if (!result.success) throw new Error(result.error || 'Proposals could not be loaded.');
        list = Array.isArray(result.data?.proposals) ? result.data.proposals : [];
      } else if (type === 'Project') {
        const result = await api.projects.getAll();
        if (!result.success) throw new Error(result.error || 'Projects could not be loaded.');
        list = Array.isArray(result.data?.projects) ? result.data.projects : [];
      } else {
        const result = await api.finance.getExpenses();
        if (!result.success) throw new Error(result.error || 'Expenses are unavailable to this role.');
        list = Array.isArray(result.data?.expenses) ? result.data.expenses : [];
      }
      const options = list.map((record: any): ReferenceOption => {
        const id = String(record.id || '');
        const label = type === 'Invoice'
          ? [record.invoiceNumber || record.number, record.clientCompany || record.clientName].filter(Boolean).join(' · ')
          : type === 'Proposal'
            ? [record.proposalNumber || record.quotationNumber, record.title || record.company || record.clientCompany].filter(Boolean).join(' · ')
            : type === 'Project'
              ? String(record.name || record.title || record.projectName || id)
              : String(record.description || record.title || record.id || 'Expense');
        return { id, label: label || id, value: Number(record.total ?? record.amount ?? record.value ?? record.budget ?? 0) || 0, currency: String(record.currency || 'IDR') };
      }).filter((item) => item.id);
      setReferences(options);
      if (!options.length) setReferenceError('No records of this type are available to request approval.');
    } catch (error) {
      setReferenceError(error instanceof Error ? error.message : 'Source records could not be loaded.');
    } finally {
      setReferenceLoading(false);
    }
  };

  const openRequest = () => {
    setRequestOpen(true);
    void loadReferences(requestType);
  };

  const chooseReference = (id: string) => {
    setReferenceId(id);
    const option = references.find((item) => item.id === id);
    if (option) {
      setRequestTitle(option.label);
      setRequestValue(String(option.value));
    }
  };

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canRequest || submittingRequest || !referenceId || !requestTitle.trim() || !requestReason.trim()) return;
    const value = Number(requestValue);
    if (!Number.isFinite(value) || value < 0) {
      setNotice({ tone: 'danger', message: 'Enter a valid non-negative amount.' });
      return;
    }
    setSubmittingRequest(true);
    setNotice(null);
    try {
      const response = await api.approvals.create({
        type: requestType,
        referenceId,
        title: requestTitle.trim(),
        reason: requestReason.trim(),
        riskLevel: requestRisk,
        value
      });
      if (!response.success || !response.data?.approval) throw new Error(response.error || 'Approval request could not be created.');
      setRequestOpen(false);
      setNotice({ tone: 'success', message: 'Approval request submitted.' });
      await loadRecords(true);
    } catch (error) {
      setNotice({ tone: 'danger', message: error instanceof Error ? error.message : 'Approval request could not be created.' });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const submitAction = async () => {
    if (!actionTarget || !canResolve || submittingAction) return;
    setSubmittingAction(true);
    setNotice(null);
    try {
      const response = await api.approvals.action(actionTarget.id, action, actionNotes.trim());
      if (!response.success) throw new Error(response.error || 'Approval decision could not be saved.');
      setActionTarget(null);
      setActionNotes('');
      setNotice({ tone: 'success', message: action === 'Approve' ? 'Approval accepted.' : action === 'Reject' ? 'Approval rejected.' : 'Changes requested.' });
      await loadRecords(true);
    } catch (error) {
      setNotice({ tone: 'danger', message: error instanceof Error ? error.message : 'Approval decision could not be saved.' });
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <AdminPageShell featureSlug="approvals-module">
      <AdminModuleHeader
        className="mb-0"
        title="Approvals"
        description="Review requests for invoices, proposals, projects, and expenses. Decisions are permission-controlled and audited."
        actions={<>
          <Button type="button" variant="secondary" icon={<RefreshCw size={14} />} loading={refreshing} onClick={() => void loadRecords(true)}>Refresh</Button>
          {canRequest && <Button type="button" icon={<Plus size={14} />} onClick={openRequest}>Request approval</Button>}
        </>}
      />

      {notice && (
        <div role="status" aria-live="polite" className={'flex items-start gap-2.5 rounded-card border px-3 py-2.5 text-xs ' + (notice.tone === 'success' ? 'border-success/25 bg-success/10' : 'border-danger/25 bg-danger/10')}>
          {notice.tone === 'success' ? <CheckCircle2 size={15} className="mt-0.5 text-success" /> : <AlertCircle size={15} className="mt-0.5 text-danger" />}
          <span className="min-w-0 flex-1 text-fg">{notice.message}</span>
          <button type="button" aria-label="Dismiss notification" className="text-muted hover:text-fg" onClick={() => setNotice(null)}><X size={14} /></button>
        </div>
      )}

      <AdminMetricStrip metrics={[
        { id: 'approvals-total', label: 'Total requests', value: metrics.total, icon: <FileText size={15} /> },
        { id: 'approvals-pending', label: 'Pending', value: metrics.pending, icon: <ClipboardCheck size={15} />, toneClassName: 'text-warning' },
        { id: 'approvals-approved', label: 'Approved', value: metrics.approved, icon: <CheckCircle2 size={15} />, toneClassName: 'text-success' },
        { id: 'approvals-changes', label: 'Changes requested', value: metrics.changes, icon: <ShieldCheck size={15} />, toneClassName: 'text-info' }
      ]} />

      <section className="space-y-3 rounded-card border border-line bg-panel p-3 sm:p-4" data-ams-slug="approval-register">
        <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_170px_170px]">
          <label className="relative min-w-0">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." aria-label="Search approvals" className={controlClass + ' pl-9'} />
          </label>
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={controlClass}>
            <option value="Pending">Pending</option><option value="all">All statuses</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option><option value="Changes Requested">Changes requested</option>
          </select>
          <select aria-label="Filter by type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={controlClass}>
            <option value="all">All types</option>{APPROVAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        {loadError && (
          <div className="flex flex-col gap-2 rounded-control border border-danger/25 bg-danger/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <span className="text-xs text-fg">{loadError}</span>
            <Button type="button" variant="secondary" onClick={() => void loadRecords()}>Retry</Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead><tr className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
              <th className="px-3 py-3 font-medium">Request</th><th className="px-3 py-3 font-medium">Type</th><th className="px-3 py-3 font-medium">Requester</th><th className="px-3 py-3 font-medium">Value</th><th className="px-3 py-3 font-medium">Risk</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Date</th><th className="px-3 py-3 text-right font-medium">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {loading ? Array.from({ length: 4 }).map((_, index) => <tr key={index}><td colSpan={8} className="px-3 py-4"><div className="h-3 w-56 animate-pulse rounded-badge bg-line" /></td></tr>) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-control border border-line bg-bg text-muted"><ClipboardCheck size={18} /></div>
                  <p className="mt-3 text-sm font-medium text-fg">{loadError ? 'Approvals unavailable' : 'No approval requests found'}</p>
                  <p className="mt-1 text-xs text-muted">{loadError ? 'The approval service could not be reached.' : 'Requests will appear here once submitted.'}</p>
                </td></tr>
              ) : rows.map((item) => {
                const isPending = String(item.status).toLowerCase() === 'pending';
                const isOwnRequest = Boolean(item.requesterId && session?.user?.id && item.requesterId === session.user.id);
                return (
                  <tr key={item.id} data-ams-slug={'approval-' + item.id} className="align-top hover:bg-bg/60">
                    <td className="px-3 py-3"><div className="max-w-[300px] truncate text-xs font-semibold text-fg" title={item.title}>{item.title}</div><div className="mt-1 max-w-[300px] truncate text-[10px] text-muted" title={item.reason}>{item.reason || 'No reason provided'}</div><div className="mt-1 font-mono text-[10px] text-muted">{item.referenceId}</div></td>
                    <td className="px-3 py-3 text-xs text-fg">{item.type}</td>
                    <td className="px-3 py-3"><div className="text-xs text-fg">{item.requester || 'Unknown'}</div><div className="mt-1 text-[10px] text-muted">{item.requesterRole || '—'}</div></td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs tabular-nums text-fg">{formatValue(item.value, item.currency)}</td>
                    <td className="px-3 py-3"><AdminStatusBadge tone={String(item.riskLevel).toLowerCase() === 'critical' || String(item.riskLevel).toLowerCase() === 'high' ? 'danger' : String(item.riskLevel).toLowerCase() === 'medium' ? 'warning' : 'neutral'}>{item.riskLevel || 'Low'}</AdminStatusBadge></td>
                    <td className="px-3 py-3"><AdminStatusBadge tone={statusTone(item.status)}>{item.status}</AdminStatusBadge></td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-muted">{formatDate(item.createdAt || item.date)}</td>
                    <td className="px-3 py-3 text-right"><div className="inline-flex items-center gap-1.5">
                      <button type="button" onClick={() => { setActionTarget(item); setActionNotes(item.reviewNotes || ''); setAction('Approve'); }} className="inline-flex min-h-8 items-center rounded-control border border-line bg-panel px-2.5 text-[11px] font-medium text-fg hover:bg-bg" aria-label={'View details for ' + item.title}>Details</button>
                      {canResolve && isPending && !isOwnRequest && <button type="button" onClick={() => { setActionTarget(item); setActionNotes(''); setAction('Approve'); }} className="inline-flex min-h-8 items-center rounded-control bg-accent px-2.5 text-[11px] font-semibold text-white hover:bg-accent-hover">Review</button>}
                      {canResolve && isPending && isOwnRequest && <span className="text-[10px] text-muted">Maker-checker</span>}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && <AdminTablePagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="requests" slug="approvals-pagination" />}
      </section>

      <Drawer
        slug="approval-request-drawer"
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        size="lg"
        title="Request approval"
        description="Create a request against an existing AMS invoice, proposal, project, or expense. Approval references are validated by the server."
        footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setRequestOpen(false)}>Cancel</Button><Button type="submit" form="approval-request-form" loading={submittingRequest} disabled={!referenceId || referenceLoading}>Submit request</Button></div>}
      >
        <form id="approval-request-form" className="space-y-4" onSubmit={submitRequest}>
          <div>
            <label className={labelClass} htmlFor="approval-type">Record type</label>
            <select id="approval-type" value={requestType} onChange={(event) => { const next = event.target.value as ApprovalType; setRequestType(next); void loadReferences(next); }} className={controlClass}>
              {APPROVAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="approval-reference">Source record</label>
            <select id="approval-reference" value={referenceId} disabled={referenceLoading || references.length === 0} onChange={(event) => chooseReference(event.target.value)} className={controlClass}>
              <option value="">{referenceLoading ? 'Loading records…' : 'Select a record'}</option>
              {references.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
            {referenceError && <p className="mt-1.5 text-[11px] text-warning">{referenceError}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="approval-title">Request title</label>
            <input id="approval-title" required maxLength={200} value={requestTitle} onChange={(event) => setRequestTitle(event.target.value)} className={controlClass} placeholder="Approval title" />
          </div>
          <div>
            <label className={labelClass} htmlFor="approval-reason">Reason</label>
            <textarea id="approval-reason" required maxLength={2000} rows={4} value={requestReason} onChange={(event) => setRequestReason(event.target.value)} className="w-full rounded-control border border-line bg-bg px-3 py-2 text-xs leading-5 text-fg outline-none focus:border-accent" placeholder="Explain the decision required, risks, and relevant context." />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={labelClass} htmlFor="approval-value">Value</label><input id="approval-value" required type="number" min="0" step="0.01" value={requestValue} onChange={(event) => setRequestValue(event.target.value)} className={controlClass} /></div>
            <div><label className={labelClass} htmlFor="approval-risk">Risk level</label><select id="approval-risk" value={requestRisk} onChange={(event) => setRequestRisk(event.target.value)} className={controlClass}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
          </div>
        </form>
      </Drawer>

      <Drawer
        slug="approval-review-modal"
        open={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        size="md"
        title={actionTarget?.title || 'Approval details'}
        description={actionTarget ? actionTarget.type + ' · ' + actionTarget.referenceId + ' · ' + actionTarget.status : undefined}
        footer={(
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setActionTarget(null)}>Close</Button>
            {actionTarget && canResolve && String(actionTarget.status).toLowerCase() === 'pending' && actionTarget.requesterId !== session?.user?.id && (
              <Button type="button" onClick={() => void submitAction()} loading={submittingAction}>Save decision</Button>
            )}
          </div>
        )}
      >
        {actionTarget && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-bg p-3"><p className={labelClass}>Requested by</p><p className="text-xs text-fg">{actionTarget.requester || 'Unknown'}</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className={labelClass}>Value</p><p className="text-xs font-semibold tabular-nums text-fg">{formatValue(actionTarget.value, actionTarget.currency)}</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className={labelClass}>Risk</p><p className="text-xs text-fg">{actionTarget.riskLevel || 'Low'}</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className={labelClass}>Date</p><p className="text-xs text-fg">{formatDate(actionTarget.createdAt || actionTarget.date)}</p></div>
            </div>
            <div><p className={labelClass}>Reason</p><p className="whitespace-pre-wrap text-xs leading-5 text-fg">{actionTarget.reason || 'No reason provided.'}</p></div>
            {actionTarget.reviewNotes && <div><p className={labelClass}>Previous review notes</p><p className="whitespace-pre-wrap text-xs leading-5 text-fg">{actionTarget.reviewNotes}</p></div>}
            {canResolve && String(actionTarget.status).toLowerCase() === 'pending' && actionTarget.requesterId !== session?.user?.id ? (
              <div className="space-y-3 border-t border-line pt-4">
                <div><label className={labelClass} htmlFor="approval-decision">Decision</label><select id="approval-decision" value={action} onChange={(event) => setAction(event.target.value as ApprovalAction)} className={controlClass}>{APPROVAL_ACTIONS.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
                <div><label className={labelClass} htmlFor="approval-review-notes">Review notes</label><textarea id="approval-review-notes" rows={3} maxLength={2000} value={actionNotes} onChange={(event) => setActionNotes(event.target.value)} className="w-full rounded-control border border-line bg-bg px-3 py-2 text-xs leading-5 text-fg outline-none focus:border-accent" placeholder="Decision rationale or requested changes." /></div>
              </div>
            ) : (
              <p className="rounded-control border border-line bg-bg px-3 py-2 text-xs text-muted">{String(actionTarget.status).toLowerCase() === 'pending' ? 'The requester cannot approve their own request. A different authorized reviewer must decide.' : 'This request has already been resolved.'}</p>
            )}
          </div>
        )}
      </Drawer>
    </AdminPageShell>
  );
};

export default AdminApprovals;
