import React, { useState, useEffect, useMemo } from 'react';
// Shared module chrome renders the canonical ams-dashboard-header primitive.
import { Skeleton } from '../../components/ui/Skeleton';
import { 
  ShieldCheck,
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  Receipt, 
  DollarSign, 
  Layers, 
  MessageSquare, 
  User, 
  Calendar,
  Loader2,
  Check,
  X,
  FileText
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/apiClient';
import { useLanguage } from '../../lib/LanguageContext';
import { getActiveCurrency, formatAmount, CurrencyCode, CURRENCY_EVENT } from '../../lib/currency';
import { hasAdminPermission } from '../../lib/adminAuth';
import { CustomSelect } from '../../components/ui/CustomSelect';
import Button from '../../components/ui/Button';

import { AdminMetricStrip, AdminModuleHeader , AdminPageShell } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
interface ApprovalItem {
  id: string;
  type: string;
  referenceId?: string;
  title: string;
  requester: string;
  requesterRole?: string;
  value: number;
  date: string;
  reason: string;
  riskLevel: 'Low' | 'Medium' | 'High' | string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Changes Requested' | string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export const AdminApprovals: React.FC = () => {
  const { language } = useLanguage();
  const canApproveBudgets = hasAdminPermission('canApproveBudgets');
  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Decision Modal State
  const [activeItem, setActiveItem] = useState<ApprovalItem | null>(null);
  const [decisionAction, setDecisionAction] = useState<'Approve' | 'Reject' | 'Request Changes'>('Approve');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    const handleCurrency = (e: Event) => {
      const custom = e as CustomEvent<{ currency: CurrencyCode }>;
      if (custom.detail?.currency) {
        setCurrency(custom.detail.currency);
      }
    };
    window.addEventListener(CURRENCY_EVENT, handleCurrency);
    return () => window.removeEventListener(CURRENCY_EVENT, handleCurrency);
  }, []);

  const loadApprovals = async () => {
    setIsLoading(true);
    try {
      const res = await api.approvals.getAll();
      if (res.success && res.data?.approvals) {
        setApprovals(res.data.approvals);
      }
    } catch {
      showToast('Failed to load approvals.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    if (!canApproveBudgets) {
      setActiveItem(null);
      showToast(language === 'id' ? 'Anda tidak memiliki hak persetujuan.' : 'You do not have approval permission.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.approvals.action(activeItem.id, decisionAction, decisionNotes);

      if (res.success && res.data?.approval) {
        setApprovals(prev => prev.map(a => a.id === activeItem.id ? res.data.approval : a));
        setActiveItem(null);
        setDecisionNotes('');
        const label = decisionAction === 'Approve' 
          ? (language === 'id' ? 'Permintaan disetujui.' : 'Request approved.')
          : decisionAction === 'Reject'
          ? (language === 'id' ? 'Permintaan ditolak.' : 'Request rejected.')
          : (language === 'id' ? 'Revisi diminta.' : 'Changes requested.');
        showToast(label);
      } else {
        showToast(res.error || 'Failed to submit decision.');
      }
    } catch {
      showToast('Action failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const pending = approvals.filter(a => a.status === 'Pending');
    const totalPendingValue = pending.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
    const highRiskPending = pending.filter(a => a.riskLevel?.toLowerCase() === 'high').length;
    const approvedCount = approvals.filter(a => a.status === 'Approved').length;

    return {
      pendingCount: pending.length,
      totalPendingValue,
      highRiskPending,
      approvedCount
    };
  }, [approvals]);

  // Filtered Items
  const filteredApprovals = useMemo(() => {
    return approvals.filter(item => {
      const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesType = typeFilter === 'all' || item.type.toLowerCase().includes(typeFilter.toLowerCase());
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [approvals, statusFilter, typeFilter, searchQuery]);

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('invoice')) return <Receipt size={14} className="text-accent" />;
    if (t.includes('budget') || t.includes('expense')) return <DollarSign size={14} className="text-success" />;
    if (t.includes('proposal')) return <FileText size={14} className="text-info" />;
    return <Layers size={14} className="text-info" />;
  };

  const getRiskBadge = (level: string) => {
    const l = level?.toLowerCase();
    if (l === 'high') {
      return <span className="px-2 py-0.5 rounded-badge text-xs font-sans bg-danger/10 text-danger border border-danger/30 normal-case font-semibold">High Risk</span>;
    }
    if (l === 'medium') {
      return <span className="px-2 py-0.5 rounded-badge text-xs font-sans bg-warning/10 text-warning border border-warning/30 normal-case font-semibold">Medium Risk</span>;
    }
    return <span className="px-2 py-0.5 rounded-badge text-xs font-sans bg-panel-hover text-muted border border-line normal-case font-semibold">Low Risk</span>;
  };

  return (
    <AdminPageShell featureSlug="approvals-module">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 left-3 right-3 sm:left-auto sm:top-20 sm:right-6 z-50 px-4 py-2.5 rounded-card bg-panel border border-accent/40 text-fg text-xs font-sans flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent " />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <AdminModuleHeader
        className="mb-0"
        title={(
          <span className="flex items-center gap-2"><Shield size={20} className="text-accent-text shrink-0" />{language === 'id' ? 'Pusat Persetujuan Eksekutif' : 'Executive Approvals Center'}</span>
        )}
        description={language === 'id' ? 'Otorisasi anggaran klien, invoice berisiko tinggi, proposal komersial, dan pengeluaran operasional.' : 'Multi-level executive authorization for budgets, high-value invoices, and operational expenses.'}
      />

      {/* KPI Cards */}
      <section aria-label="Approval snapshot" className="rounded-card border border-line bg-panel p-4">
        <div className="mb-3 flex items-end justify-between gap-3 border-b border-line pb-3">
          <div><h2 className="text-sm font-semibold text-fg">{language === 'id' ? 'Ringkasan persetujuan' : 'Approval snapshot'}</h2><p className="mt-1 text-xs text-muted">{language === 'id' ? 'Permintaan dan exposure finansial yang menunggu keputusan.' : 'Decision queue and financial exposure across the approval workspace.'}</p></div>
          <span className="text-[11px] font-medium tabular-nums text-muted">{metrics.pendingCount} pending</span>
        </div>
        <AdminMetricStrip
          metrics={[
            { id: 'pending', label: language === 'id' ? 'Menunggu Otorisasi' : 'Pending Authorization', value: metrics.pendingCount, context: language === 'id' ? 'Perlu tindakan eksekutif' : 'Action required', sparkline: [metrics.pendingCount, metrics.highRiskPending, metrics.approvedCount, metrics.pendingCount], icon: <Clock size={16} strokeWidth={1.8} />, toneClassName: 'text-warning' },
            { id: 'pending-value', label: language === 'id' ? 'Nilai Tertunda' : 'Pending Value', value: formatAmount(metrics.totalPendingValue, currency), context: language === 'id' ? 'Total nilai menunggu review' : 'Total financial exposure', sparkline: approvals.slice(0, 8).map((item) => Number(item.value) || 0), icon: <DollarSign size={16} strokeWidth={1.8} />, toneClassName: 'text-accent-text' },
            { id: 'risk', label: language === 'id' ? 'Tinggi Risiko' : 'High Risk Items', value: metrics.highRiskPending, context: language === 'id' ? 'Perlu hak persetujuan' : 'Requires approval permission', sparkline: [metrics.highRiskPending, metrics.pendingCount, metrics.approvedCount], icon: <AlertTriangle size={16} strokeWidth={1.8} />, toneClassName: 'text-danger' },
            { id: 'approved', label: language === 'id' ? 'Telah Disetujui' : 'Total Approved', value: metrics.approvedCount, context: language === 'id' ? 'Tercatat dalam audit trail' : 'Logged in audit trail', sparkline: [metrics.pendingCount, metrics.approvedCount, metrics.highRiskPending], icon: <CheckCircle2 size={16} strokeWidth={1.8} />, toneClassName: 'text-success' }
          ]}
        />
      </section>

      {/* Filter and Search Bar */}
      <section className="rounded-card border border-line bg-panel p-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'id' ? 'Cari judul, pemohon, atau catatan...' : 'Search title, requester, or notes...'}
            className="w-full h-9 min-h-9 pl-8 pr-3 text-xs bg-bg text-fg placeholder-muted rounded-control border border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus:border-accent font-sans"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          <div className="flex items-center gap-1 bg-panel p-1 rounded-control border border-line">
            {(['Pending', 'Approved', 'Rejected', 'Changes Requested', 'all'] as const).map((st) => (
              <button
                key={st}
                type="button"
                aria-pressed={statusFilter === st}
                onClick={() => setStatusFilter(st)}
                className={`h-9 min-h-9 px-2.5 rounded-chip text-xs font-sans capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  statusFilter === st
                    ? 'bg-line text-fg font-semibold'
                    : 'text-muted hover:bg-bg hover:text-fg'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <CustomSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'invoice', label: 'Invoice' },
              { value: 'budget', label: 'Budget' },
              { value: 'proposal', label: 'Proposal' },
              { value: 'expense', label: 'Expense' }
            ]}
          />
        </div>
      </section>

      {/* Approvals List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2" role="status" aria-label="Loading authorization items">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-card border border-line bg-panel p-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="mt-3 h-3 w-72 max-w-full" />
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="p-12 rounded-card bg-bg border border-line text-center text-xs font-sans text-muted">
            {language === 'id' ? 'Tidak ada permintaan otorisasi.' : 'No authorization items match criteria.'}
          </div>
        ) : (
          filteredApprovals.map((item) => (
            <div 
              key={item.id}
              className="p-4 rounded-card bg-bg border border-line hover:border-line transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-9 rounded-control bg-panel border border-line flex items-center justify-center shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-fg">{item.title}</span>
                      <span className="px-2 py-0.5 rounded-badge text-xs font-sans normal-case bg-panel text-muted border border-line">
                        {item.type}
                      </span>
                      {getRiskBadge(item.riskLevel)}
                    </div>
                    {item.reason && (
                      <p className="text-xs text-muted mt-1 leading-relaxed">{item.reason}</p>
                    )}
                    <div className="text-xs font-sans text-muted flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1">
                        <User size={11} />
                        <ProfileIdentity profile={{ name: item.requester, contextLabel: 'Approval requester' }} size="sm" showRole={false} />
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        <span>{item.date}</span>
                      </span>
                      {item.reviewedBy && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-2 text-success"><span>Decided by</span><ProfileIdentity profile={{ name: item.reviewedBy, contextLabel: 'Approval reviewer' }} size="sm" showRole={false} className="text-success" /></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                  {item.value > 0 && (
                    <div className="text-right">
                      <div className="text-xs font-sans text-muted">Value</div>
                      <div className="font-semibold font-sans text-fg text-sm">
                        {formatAmount(item.value, currency)}
                      </div>
                    </div>
                  )}

                  {item.status.toLowerCase() === 'pending' && canApproveBudgets ? (
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => {
                          setActiveItem(item);
                          setDecisionAction('Approve');
                        }}
                        className="min-h-10 sm:min-h-9 px-3 py-1 rounded-control bg-success/10 hover:bg-success/20 text-success border border-success/30 text-xs font-sans font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Check size={12} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveItem(item);
                          setDecisionAction('Reject');
                        }}
                        className="min-h-10 sm:min-h-9 px-3 py-1 rounded-control bg-danger/10 hover:bg-danger/15 text-danger border border-danger/30 text-xs font-sans font-semibold flex items-center gap-1 transition-colors"
                      >
                        <X size={12} />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-badge text-xs font-sans font-semibold normal-case border ${
                      item.status.toLowerCase() === 'approved'
                        ? 'bg-success/10 text-success border-success/30'
                        : item.status.toLowerCase() === 'rejected'
                        ? 'bg-danger/10 text-danger border-danger/30'
                        : item.status.toLowerCase() === 'changes requested'
                        ? 'bg-warning/10 text-warning border-warning/30'
                        : 'bg-warning/10 text-warning border-warning/30'
                    }`}>
                      {item.status}
                    </span>
                  )}
                </div>
              </div>

              {item.reviewNotes && (
                <div className="text-xs font-sans text-muted bg-panel/50 p-2.5 rounded-control border border-line flex items-center gap-2">
                  <MessageSquare size={12} className="text-accent shrink-0" />
                  <span>Decision notes: {item.reviewNotes}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* DECISION MODAL */}
      <Modal
        open={!!activeItem && canApproveBudgets}
        onClose={() => setActiveItem(null)}
        size="md"
        title="Executive Decision Confirmation"
        description="Record the decision and rationale in the security audit log."
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setActiveItem(null)}>Cancel</Button>
            <Button type="submit" form="approval-decision-form" loading={isSubmitting} disabled={isSubmitting} icon={<ShieldCheck size={14} />}>
              Confirm Decision
            </Button>
          </>
        )}
      >
            <form id="approval-decision-form" onSubmit={handleDecisionSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <div className="font-semibold text-fg text-sm">{activeItem.title}</div>
                <div className="text-xs font-sans text-muted mt-0.5">
                  Requested by: {activeItem.requester}
                </div>
                {activeItem.value > 0 && (
                  <div className="text-xs font-sans font-semibold text-success mt-1">
                    Value: {formatAmount(activeItem.value, currency)}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans text-muted">Action</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-sans text-xs">
                  <button
                    type="button"
                    onClick={() => setDecisionAction('Approve')}
                    className={`py-2 rounded-control border text-center transition-all ${
                      decisionAction === 'Approve'
                        ? 'bg-success/10 text-success border-success/30 font-semibold'
                        : 'bg-panel text-muted border-line'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction('Request Changes')}
                    className={`py-2 rounded-control border text-center transition-all ${
                      decisionAction === 'Request Changes'
                        ? 'bg-warning/10 text-warning border-warning/30 font-semibold'
                        : 'bg-panel text-muted border-line'
                    }`}
                  >
                    Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction('Reject')}
                    className={`py-2 rounded-control border text-center transition-all ${
                      decisionAction === 'Reject'
                        ? 'bg-danger/10 text-danger border-danger/30 font-semibold'
                        : 'bg-panel text-muted border-line'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans text-muted">Decision Notes / Reason</label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Record rationale for the immutable security audit log..."
                  className="w-full p-2.5 rounded-control bg-panel text-fg border border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus:border-accent text-xs resize-none"
                />
              </div>

            </form>
      </Modal>
    </AdminPageShell>
  );
};
