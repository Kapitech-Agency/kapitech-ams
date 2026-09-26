import React, { useState, useEffect, useMemo } from 'react';
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
      return <span className="px-2 py-0.5 rounded text-xs font-sans bg-danger/10 text-danger border border-danger/30 normal-case font-semibold">High Risk</span>;
    }
    if (l === 'medium') {
      return <span className="px-2 py-0.5 rounded text-xs font-sans bg-warning/10 text-warning border border-warning/30 normal-case font-semibold">Medium Risk</span>;
    }
    return <span className="px-2 py-0.5 rounded text-xs font-sans bg-panel-hover text-muted border border-line normal-case font-semibold">Low Risk</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 left-3 right-3 sm:left-auto sm:top-20 sm:right-6 z-50 px-4 py-2.5 rounded-card bg-panel border border-accent/40 text-fg text-xs font-sans flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent " />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="ams-page-header">
        <h1 className="ams-page-title">
          <Shield size={22} className="text-accent-text shrink-0" />
          <span>{language === 'id' ? 'Pusat Persetujuan Eksekutif' : 'Executive Approvals Center'}</span>
        </h1>
        <p className="text-xs font-sans text-muted mt-1">
          {language === 'id' 
            ? 'Otorisasi anggaran klien, invoice berisiko tinggi, proposal komersial, dan pengeluaran operasional.' 
            : 'Multi-level executive authorization for budgets, high-value invoices, and operational expenses.'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-card bg-panel border border-line space-y-1">
          <div className="text-xs font-sans text-muted flex items-center justify-between">
            <span>{language === 'id' ? 'Menunggu Otorisasi' : 'Pending Authorization'}</span>
            <Clock size={13} className="text-warning" />
          </div>
          <div className="text-lg sm:text-xl font-semibold font-sans text-warning">
            {metrics.pendingCount}
          </div>
          <div className="text-xs font-sans text-muted">
            {language === 'id' ? 'Perlu tindakan eksekutif' : 'Action required'}
          </div>
        </div>

        <div className="p-4 rounded-card bg-panel border border-line space-y-1">
          <div className="text-xs font-sans text-muted flex items-center justify-between">
            <span>{language === 'id' ? 'Nilai Tertunda' : 'Pending Value'}</span>
            <DollarSign size={13} className="text-accent" />
          </div>
          <div className="text-lg sm:text-xl font-semibold font-sans text-fg">
            {formatAmount(metrics.totalPendingValue, currency)}
          </div>
          <div className="text-xs font-sans text-muted">
            {language === 'id' ? 'Total nilai menunggu review' : 'Total financial exposure'}
          </div>
        </div>

        <div className="p-4 rounded-card bg-panel border border-line space-y-1">
          <div className="text-xs font-sans text-muted flex items-center justify-between">
            <span>{language === 'id' ? 'Tinggi Risiko' : 'High Risk Items'}</span>
            <AlertTriangle size={13} className="text-danger" />
          </div>
          <div className="text-lg sm:text-xl font-semibold font-sans text-danger">
            {metrics.highRiskPending}
          </div>
          <div className="text-xs font-sans text-danger/80">
            {language === 'id' ? 'Perlu hak persetujuan' : 'Requires approval permission'}
          </div>
        </div>

        <div className="p-4 rounded-card bg-panel border border-line space-y-1">
          <div className="text-xs font-sans text-muted flex items-center justify-between">
            <span>{language === 'id' ? 'Telah Disetujui' : 'Total Approved'}</span>
            <CheckCircle2 size={13} className="text-success" />
          </div>
          <div className="text-lg sm:text-xl font-semibold font-sans text-success">
            {metrics.approvedCount}
          </div>
          <div className="text-xs font-sans text-muted">
            {language === 'id' ? 'Tercatat dalam audit trail' : 'Logged in audit trail'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-card bg-panel border border-line">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'id' ? 'Cari judul, pemohon, atau catatan...' : 'Search title, requester, or notes...'}
            className="w-full h-9 pl-8 pr-3 text-xs bg-panel text-fg placeholder-muted rounded-control border border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus:border-accent font-sans"
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
                className={`min-h-10 sm:min-h-9 px-2.5 rounded-chip text-xs font-sans capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[.98] ${
                  statusFilter === st
                    ? 'bg-accent text-white border border-accent font-semibold'
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
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 rounded-card bg-bg border border-line text-center text-xs font-sans text-muted flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-accent" size={20} />
            <span>Loading authorization items...</span>
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
                      <span className="px-2 py-0.5 rounded text-xs font-sans normal-case bg-panel text-muted border border-line">
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
                        <span>Requested by {item.requester}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        <span>{item.date}</span>
                      </span>
                      {item.reviewedBy && (
                        <>
                          <span>•</span>
                          <span className="text-success">Decided by {item.reviewedBy}</span>
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
                        className="px-3 py-1 rounded-control bg-success/10 hover:bg-success/20 text-success border border-success/30 text-xs font-sans font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Check size={12} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveItem(item);
                          setDecisionAction('Reject');
                        }}
                        className="px-3 py-1 rounded-control bg-danger/10 hover:bg-danger/15 text-danger border border-danger/30 text-xs font-sans font-semibold flex items-center gap-1 transition-colors"
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
      <Modal open={!!activeItem && canApproveBudgets} onClose={() => setActiveItem(null)} size="md" title="Executive Decision Confirmation" description="Record the decision and rationale in the security audit log.">
            <form onSubmit={handleDecisionSubmit} className="p-5 space-y-4 text-xs font-sans">
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

              <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="min-h-10 px-4 py-2 rounded-control bg-panel hover:bg-panel-hover border border-line text-muted text-xs font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-sans font-semibold disabled:opacity-50 flex items-center gap-1.5 min-h-10"
                >
                  {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>Confirm Decision</span>
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
};
