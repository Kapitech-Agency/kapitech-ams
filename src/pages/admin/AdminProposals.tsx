import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Receipt
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { useLanguage } from '../../lib/LanguageContext';
import { CurrencyCode, CURRENCY_EVENT, formatAmount, getActiveCurrency } from '../../lib/currency';
import { hasAdminPermission } from '../../lib/adminAuth';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';

type ProposalStatus = 'draft' | 'review' | 'approved' | 'sent' | 'accepted' | 'rejected';
type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low' | 'expiry';

interface ProposalLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

interface Proposal {
  id: string;
  proposalNumber: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  status: ProposalStatus;
  lineItems: ProposalLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  taxPercent: number;
  total: number;
  currency: CurrencyCode;
  paymentTerms?: string;
  validUntil: string;
  createdAt: string;
  updatedAt?: string;
  owner?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  invoiceId?: string;
}

interface ProposalFormItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

const STATUS_TO_API: Record<ProposalStatus, string> = {
  draft: 'Draft',
  review: 'Internal Review',
  approved: 'Approved',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected'
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In review' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' }
];

function normalizeStatus(value: unknown): ProposalStatus {
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
}

function normalizeProposal(raw: any): Proposal {
  const rawItems = Array.isArray(raw?.lineItems) ? raw.lineItems : Array.isArray(raw?.items) ? raw.items : [];
  return {
    id: String(raw?.id || ''),
    proposalNumber: String(raw?.proposalNumber || ''),
    title: String(raw?.title || ''),
    clientName: String(raw?.clientName || raw?.name || ''),
    clientEmail: raw?.clientEmail ? String(raw.clientEmail) : undefined,
    clientCompany: raw?.clientCompany ? String(raw.clientCompany) : raw?.company ? String(raw.company) : undefined,
    status: normalizeStatus(raw?.status),
    lineItems: rawItems.map((item: any) => ({
      id: String(item?.id || ''),
      description: String(item?.description || ''),
      quantity: Number(item?.quantity) || 0,
      unitPrice: Number(item?.unitPrice) || 0,
      total: Number(item?.total ?? item?.amount ?? ((Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0)))
    })),
    subtotal: Number(raw?.subtotal) || 0,
    discount: Number(raw?.discount) || 0,
    tax: Number(raw?.tax ?? raw?.taxAmount) || 0,
    taxPercent: Number(raw?.taxPercent ?? 0) || 0,
    total: Number(raw?.total) || 0,
    currency: raw?.currency === 'USD' ? 'USD' : 'IDR',
    paymentTerms: raw?.paymentTerms ? String(raw.paymentTerms) : undefined,
    validUntil: String(raw?.validUntil || raw?.validityPeriod || ''),
    createdAt: String(raw?.createdAt || raw?.createdDate || ''),
    updatedAt: raw?.updatedAt ? String(raw.updatedAt) : undefined,
    owner: raw?.owner ? String(raw.owner) : undefined,
    notes: raw?.notes ? String(raw.notes) : undefined,
    approvedBy: raw?.approvedBy,
    approvedAt: raw?.approvedAt,
    invoiceId: raw?.invoiceId || raw?.invoice?.id
  };
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(value: string): number | null {
  const date = parseDate(value);
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / 86400000);
}

function statusLabel(status: ProposalStatus, language: string) {
  const labels: Record<ProposalStatus, [string, string]> = {
    draft: ['Draft', 'Draft'],
    review: ['Internal Review', 'Review Internal'],
    approved: ['Approved', 'Disetujui'],
    sent: ['Sent', 'Terkirim'],
    accepted: ['Accepted', 'Diterima'],
    rejected: ['Rejected', 'Ditolak']
  };
  return labels[status][language === 'id' ? 1 : 0];
}

function StatusBadge({ status, language }: { status: ProposalStatus; language: string }) {
  const config: Record<ProposalStatus, { tone: string; icon: React.ElementType }> = {
    draft: { tone: 'bg-panel text-muted border-line', icon: FileText },
    review: { tone: 'bg-warning/10 text-warning border-warning/30', icon: Clock3 },
    approved: { tone: 'bg-info/10 text-info border-info/30', icon: ShieldCheck },
    sent: { tone: 'bg-info/10 text-info border-info/30', icon: Send },
    accepted: { tone: 'bg-success/10 text-success border-success/30', icon: CheckCircle2 },
    rejected: { tone: 'bg-danger/10 text-danger border-danger/30', icon: AlertCircle }
  };
  const Icon = config[status].icon;
  return (
    <span className={'inline-flex min-h-7 items-center gap-1.5 rounded-badge border px-2 py-1 text-xs font-semibold ' + config[status].tone}>
      <Icon size={12} aria-hidden="true" />
      <span>{statusLabel(status, language)}</span>
    </span>
  );
}

export const AdminProposals: React.FC = () => {
  const { language } = useLanguage();
  const canManageCrm = hasAdminPermission('canManageCrm');
  const canManageInvoices = hasAdminPermission('canManageInvoices');
  const canApproveBudgets = hasAdminPermission('canApproveBudgets');

  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [notification, setNotification] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [detailProposal, setDetailProposal] = useState<Proposal | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'convert'; proposal: Proposal } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emptyItem = useCallback((): ProposalFormItem => ({
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    description: '',
    quantity: 1,
    unitPrice: 0
  }), []);

  const [formTitle, setFormTitle] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formClientCompany, setFormClientCompany] = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('');
  const [formValidDays, setFormValidDays] = useState(30);
  const [formDiscount, setFormDiscount] = useState(0);
  const [formTaxRate, setFormTaxRate] = useState(11);
  const [formNotes, setFormNotes] = useState('');
  const [formCurrency, setFormCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [formItems, setFormItems] = useState<ProposalFormItem[]>([]);

  const showToast = useCallback((message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(null), 3500);
  }, []);

  const loadProposals = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await api.proposals.getAll();
      if (!response.success) {
        setLoadError(response.error || (language === 'id' ? 'Proposal tidak dapat dimuat.' : 'Proposals could not be loaded.'));
        return;
      }
      setProposals(Array.isArray(response.data?.proposals) ? response.data.proposals.map(normalizeProposal) : []);
    } catch {
      setLoadError(language === 'id' ? 'Proposal tidak dapat dimuat. Coba lagi.' : 'Proposals could not be loaded. Try again.');
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    const handleCurrency = (event: Event) => {
      const custom = event as CustomEvent<{ currency: CurrencyCode }>;
      if (custom.detail?.currency) setCurrency(custom.detail.currency);
    };
    window.addEventListener(CURRENCY_EVENT, handleCurrency);
    return () => window.removeEventListener(CURRENCY_EVENT, handleCurrency);
  }, []);

  const resetForm = useCallback(() => {
    setFormTitle('');
    setFormClientName('');
    setFormClientCompany('');
    setFormPaymentTerms('');
    setFormValidDays(30);
    setFormDiscount(0);
    setFormTaxRate(11);
    setFormNotes('');
    setFormCurrency(getActiveCurrency());
    setFormItems([emptyItem()]);
    setEditingProposal(null);
  }, [emptyItem]);

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (proposal: Proposal) => {
    if (!canManageCrm || proposal.status === 'accepted') return;
    setEditingProposal(proposal);
    setFormTitle(proposal.title);
    setFormClientName(proposal.clientName);
    setFormClientCompany(proposal.clientCompany || '');
    setFormPaymentTerms(proposal.paymentTerms || '');
    const validityDays = Number.parseInt(proposal.validUntil, 10);
    setFormValidDays(Number.isFinite(validityDays) && validityDays > 0 ? validityDays : 30);
    setFormDiscount(proposal.discount);
    setFormTaxRate(proposal.taxPercent);
    setFormNotes(proposal.notes || '');
    setFormCurrency(proposal.currency);
    setFormItems(proposal.lineItems.map((item) => ({
      id: item.id || String(Date.now()),
      description: item.description,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0
    })));
    setFormOpen(true);
  };

  const formSubtotal = useMemo(
    () => formItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0), 0),
    [formItems]
  );
  const formDiscountSafe = Math.min(formSubtotal, Math.max(0, Number(formDiscount) || 0));
  const formTax = Math.round(Math.max(0, formSubtotal - formDiscountSafe) * (Math.min(100, Math.max(0, Number(formTaxRate) || 0)) / 100));
  const formTotal = Math.max(0, formSubtotal - formDiscountSafe) + formTax;

  const filteredProposals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = proposals.filter((proposal) => {
      const searchable = [
        proposal.proposalNumber,
        proposal.title,
        proposal.clientName,
        proposal.clientCompany,
        proposal.clientEmail,
        proposal.owner
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
      const remaining = daysUntil(proposal.validUntil);
      const matchesExpiry =
        expiryFilter === 'all' ||
        (expiryFilter === 'active' && remaining !== null && remaining >= 0) ||
        (expiryFilter === 'expiring' && remaining !== null && remaining >= 0 && remaining <= 7) ||
        (expiryFilter === 'expired' && remaining !== null && remaining < 0);
      return matchesSearch && matchesStatus && matchesExpiry;
    });

    return result.sort((a, b) => {
      if (sortBy === 'amount-high') return b.total - a.total;
      if (sortBy === 'amount-low') return a.total - b.total;
      if (sortBy === 'expiry') return (daysUntil(a.validUntil) ?? Number.MAX_SAFE_INTEGER) - (daysUntil(b.validUntil) ?? Number.MAX_SAFE_INTEGER);
      const aDate = parseDate(a.updatedAt || a.createdAt)?.getTime() || 0;
      const bDate = parseDate(b.updatedAt || b.createdAt)?.getTime() || 0;
      return sortBy === 'oldest' ? aDate - bDate : bDate - aDate;
    });
  }, [proposals, searchQuery, statusFilter, expiryFilter, sortBy]);

  const metrics = useMemo(() => {
    const expiring = proposals.filter((p) => {
      const d = daysUntil(p.validUntil);
      return d !== null && d >= 0 && d <= 7 && !['accepted', 'rejected'].includes(p.status);
    }).length;
    return {
      total: proposals.length,
      active: proposals.filter((p) => ['draft', 'review', 'approved', 'sent'].includes(p.status)).length,
      accepted: proposals.filter((p) => p.status === 'accepted').length,
      expiring
    };
  }, [proposals]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setExpiryFilter('all');
    setSortBy('newest');
  };

  const updateItem = (id: string, field: keyof Omit<ProposalFormItem, 'id'>, value: string | number) => {
    setFormItems((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageCrm) {
      showToast(language === 'id' ? 'Anda tidak memiliki izin mengelola proposal.' : 'You do not have permission to manage proposals.');
      return;
    }
    const validItems = formItems
      .map((item) => ({
        ...item,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice)
      }))
      .filter((item) => item.description && Number.isFinite(item.quantity) && item.quantity > 0 && Number.isFinite(item.unitPrice) && item.unitPrice >= 0);

    if (!formTitle.trim() || !formClientName.trim()) {
      showToast(language === 'id' ? 'Judul dan nama klien wajib diisi.' : 'Title and client name are required.');
      return;
    }
    if (!validItems.length) {
      showToast(language === 'id' ? 'Tambahkan minimal satu line item yang valid.' : 'Add at least one valid line item.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: formTitle.trim(),
      clientName: formClientName.trim(),
      company: formClientCompany.trim(),
      paymentTerms: formPaymentTerms.trim(),
      validityPeriod: formValidDays + ' Days',
      currency: formCurrency,
      discount: formDiscountSafe,
      taxPercent: Math.min(100, Math.max(0, Number(formTaxRate) || 0)),
      notes: formNotes.trim(),
      items: validItems.map(({ id, description, quantity, unitPrice }) => ({ id, description, quantity, unitPrice }))
    };

    try {
      const response = editingProposal
        ? await api.proposals.update(editingProposal.id, payload)
        : await api.proposals.create(payload);

      if (!response.success || !response.data?.proposal) {
        showToast(response.error || (language === 'id' ? 'Proposal gagal disimpan.' : 'Proposal could not be saved.'));
        return;
      }

      const normalized = normalizeProposal(response.data.proposal);
      setProposals((current) => editingProposal
        ? current.map((proposal) => proposal.id === normalized.id ? normalized : proposal)
        : [normalized, ...current]
      );
      setFormOpen(false);
      resetForm();
      showToast(editingProposal
        ? (language === 'id' ? 'Proposal diperbarui.' : 'Proposal updated.')
        : (language === 'id' ? 'Proposal dibuat.' : 'Proposal created.'));
    } catch {
      showToast(language === 'id' ? 'Proposal gagal disimpan. Coba lagi.' : 'Proposal could not be saved. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (proposal: Proposal, status: ProposalStatus) => {
    if (!canManageCrm) return;
    if (proposal.status === 'accepted') return;
    if (['approved', 'rejected'].includes(status) && !canApproveBudgets) {
      showToast(language === 'id' ? 'Status persetujuan memerlukan hak approval.' : 'Approval status requires approval permission.');
      return;
    }
    try {
      const response = await api.proposals.update(proposal.id, { status: STATUS_TO_API[status] });
      if (!response.success || !response.data?.proposal) {
        showToast(response.error || (language === 'id' ? 'Status gagal diperbarui.' : 'Status could not be updated.'));
        return;
      }
      const normalized = normalizeProposal(response.data.proposal);
      setProposals((current) => current.map((item) => item.id === normalized.id ? normalized : item));
      if (detailProposal?.id === normalized.id) setDetailProposal(normalized);
      showToast(language === 'id' ? 'Status proposal diperbarui.' : 'Proposal status updated.');
    } catch {
      showToast(language === 'id' ? 'Status gagal diperbarui. Coba lagi.' : 'Status could not be updated. Try again.');
    }
  };

  const confirmDelete = async () => {
    if (!confirmAction || confirmAction.type !== 'delete' || !canManageCrm) return;
    try {
      const response = await api.proposals.delete(confirmAction.proposal.id);
      if (!response.success) {
        showToast(response.error || (language === 'id' ? 'Proposal gagal dihapus.' : 'Proposal could not be deleted.'));
        return;
      }
      setProposals((current) => current.filter((item) => item.id !== confirmAction.proposal.id));
      setDetailProposal(null);
      showToast(language === 'id' ? 'Proposal dihapus.' : 'Proposal deleted.');
    } catch {
      showToast(language === 'id' ? 'Proposal gagal dihapus. Coba lagi.' : 'Proposal could not be deleted. Try again.');
    } finally {
      setConfirmAction(null);
    }
  };

  const confirmConvert = async () => {
    if (!confirmAction || confirmAction.type !== 'convert' || !canManageInvoices) return;
    try {
      const response = await api.proposals.convertToInvoice(confirmAction.proposal.id);
      if (!response.success || !response.data?.invoice) {
        showToast(response.error || (language === 'id' ? 'Invoice gagal diterbitkan.' : 'Invoice could not be issued.'));
        return;
      }
      showToast(language === 'id'
        ? 'Invoice ' + response.data.invoice.invoiceNumber + ' diterbitkan.'
        : 'Invoice ' + response.data.invoice.invoiceNumber + ' issued.');
      await loadProposals();
      setDetailProposal((current) => current ? { ...current, invoiceId: response.data?.invoice?.id || current.invoiceId } : current);
    } catch {
      showToast(language === 'id' ? 'Invoice gagal diterbitkan. Coba lagi.' : 'Invoice could not be issued. Try again.');
    } finally {
      setConfirmAction(null);
    }
  };

  const openDelete = (proposal: Proposal) => {
    if (!canManageCrm || proposal.status !== 'draft') {
      showToast(language === 'id' ? 'Hanya proposal Draft yang dapat dihapus.' : 'Only Draft proposals can be deleted.');
      return;
    }
    setConfirmAction({ type: 'delete', proposal });
  };

  const openConvert = (proposal: Proposal) => {
    if (!canManageInvoices || proposal.status !== 'approved') return;
    setConfirmAction({ type: 'convert', proposal });
  };

  const renderExpiry = (proposal: Proposal) => {
    const remaining = daysUntil(proposal.validUntil);
    if (remaining === null) return <span className="text-muted">—</span>;
    if (remaining < 0) return <span className="text-danger">{Math.abs(remaining)}d overdue</span>;
    if (remaining <= 7 && !['accepted', 'rejected'].includes(proposal.status)) return <span className="text-warning">{remaining === 0 ? 'Today' : remaining + 'd left'}</span>;
    return <span className="text-muted">{proposal.validUntil || '—'}</span>;
  };

  const formatDate = (value: string) => {
    const date = parseDate(value);
    return date ? new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(date) : '—';
  };

  const fieldClass = 'min-h-10 w-full rounded-control border border-line bg-panel px-3 text-xs text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';
  const sectionClass = 'rounded-card border border-line bg-panel p-4 sm:p-5';

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed inset-x-3 top-16 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:top-[68px]" role="status" aria-live="polite">
          <div className="flex max-w-md items-start gap-2 rounded-control border border-line bg-panel px-3 py-2.5 text-xs text-fg">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      <header className="ams-dashboard-header mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Kapitech AMS</span>
            <span aria-hidden="true">/</span>
            <span className="text-fg">{language === 'id' ? 'Proposal & Penawaran' : 'Proposal & Quotes'}</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold leading-7 tracking-[-0.01em] text-fg">
            {language === 'id' ? 'Proposal & Penawaran' : 'Proposal & Quotes'}
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
            {language === 'id' ? 'Kelola proposal komersial, nilai penawaran, status, dan tindak lanjut dari satu tempat.' : 'Manage commercial proposals, values, status, and follow-up from one place.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => void loadProposals()}
            disabled={isLoading}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-line bg-transparent px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>{language === 'id' ? 'Refresh' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            onClick={openCreate}
            disabled={!canManageCrm}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Plus size={14} aria-hidden="true" />
            <span>{language === 'id' ? 'Buat Proposal' : 'Create Proposal'}</span>
          </button>
        </div>
      </header>

      <section aria-label="Proposal summary" className="grid grid-cols-2 gap-x-4 border-y border-line py-4 sm:grid-cols-4 sm:gap-0">
        {[
          { label: language === 'id' ? 'Total proposal' : 'Total proposals', value: metrics.total, icon: FileText },
          { label: language === 'id' ? 'Aktif' : 'Active', value: metrics.active, icon: Clock3 },
          { label: language === 'id' ? 'Diterima' : 'Accepted', value: metrics.accepted, icon: CheckCircle2 },
          { label: language === 'id' ? 'Segera berakhir' : 'Expiring soon', value: metrics.expiring, icon: AlertCircle }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className={'flex min-w-0 items-center gap-3 py-2 ' + (index > 0 ? 'sm:border-l sm:border-line sm:pl-4' : '')}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-muted">
                <Icon size={14} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted">{metric.label}</div>
                <div className="mt-0.5 text-xl font-medium tabular-nums text-fg">{metric.value}</div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="space-y-3" aria-label="Proposal filters">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{language === 'id' ? 'Cari proposal' : 'Search proposals'}</span>
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={language === 'id' ? 'Cari nomor, judul, klien, perusahaan, atau owner…' : 'Search number, title, client, company, or owner…'}
              className={fieldClass + ' pl-9'}
            />
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-[520px]">
            <CustomSelect
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as ProposalStatus | 'all')}
              size="sm"
              aria-label={language === 'id' ? 'Filter status' : 'Status filter'}
              options={[{ value: 'all', label: language === 'id' ? 'Semua status' : 'All statuses' }, ...STATUS_OPTIONS.map((item) => ({ ...item, label: language === 'id' && item.value === 'review' ? 'Review internal' : item.label }))]}
              
            />
            <CustomSelect
              value={expiryFilter}
              onChange={(value) => setExpiryFilter(value as typeof expiryFilter)}
              size="sm"
              aria-label={language === 'id' ? 'Filter masa berlaku' : 'Expiry filter'}
              options={[
                { value: 'all', label: language === 'id' ? 'Semua masa berlaku' : 'All expiry' },
                { value: 'active', label: language === 'id' ? 'Masih aktif' : 'Active' },
                { value: 'expiring', label: language === 'id' ? '≤ 7 hari' : '≤ 7 days' },
                { value: 'expired', label: language === 'id' ? 'Kedaluwarsa' : 'Expired' }
              ]}
              
            />
            <CustomSelect
              value={sortBy}
              onChange={(value) => setSortBy(value as SortOption)}
              size="sm"
              aria-label={language === 'id' ? 'Urutkan proposal' : 'Sort proposals'}
              options={[
                { value: 'newest', label: language === 'id' ? 'Terbaru' : 'Newest' },
                { value: 'oldest', label: language === 'id' ? 'Terlama' : 'Oldest' },
                { value: 'amount-high', label: language === 'id' ? 'Nilai tertinggi' : 'Highest value' },
                { value: 'amount-low', label: language === 'id' ? 'Nilai terendah' : 'Lowest value' },
                { value: 'expiry', label: language === 'id' ? 'Masa berlaku terdekat' : 'Nearest expiry' }
              ]}
              
            />
          </div>
        </div>
        {(searchQuery || statusFilter !== 'all' || expiryFilter !== 'all' || sortBy !== 'newest') && (
          <div className="flex items-center justify-between gap-3 text-xs text-muted">
            <span>{filteredProposals.length} {language === 'id' ? 'hasil ditampilkan' : 'results shown'}</span>
            <button type="button" onClick={clearFilters} className="min-h-10 rounded-control px-2.5 text-xs font-medium text-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              {language === 'id' ? 'Reset filter' : 'Reset filters'}
            </button>
          </div>
        )}
      </section>

      {isLoading ? (
        <section className="overflow-hidden rounded-card border border-line bg-panel" aria-label={language === 'id' ? 'Memuat proposal' : 'Loading proposals'}>
          <div className="space-y-3 p-4 sm:p-5">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="grid animate-pulse grid-cols-1 gap-3 border-b border-line py-3 last:border-b-0 sm:grid-cols-[minmax(0,2fr)_minmax(130px,1fr)_140px_120px_110px_80px]">
                <div className="space-y-2"><div className="h-3 w-2/3 rounded bg-line" /><div className="h-3 w-1/3 rounded bg-line" /></div>
                <div className="h-3 w-2/3 rounded bg-line" />
                <div className="h-3 w-2/3 rounded bg-line" />
                <div className="h-6 w-20 rounded-badge bg-line" />
                <div className="h-3 w-20 rounded bg-line" />
                <div className="h-8 w-16 rounded-control bg-line" />
              </div>
            ))}
          </div>
        </section>
      ) : loadError ? (
        <section className="rounded-card border border-line bg-panel p-6" role="alert">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 shrink-0 text-danger" size={18} aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-fg">{language === 'id' ? 'Proposal gagal dimuat' : 'Proposals could not be loaded'}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{loadError}</p>
              </div>
            </div>
            <button type="button" onClick={() => void loadProposals()} className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              <RefreshCw size={13} aria-hidden="true" />
              {language === 'id' ? 'Coba lagi' : 'Retry'}
            </button>
          </div>
        </section>
      ) : proposals.length === 0 ? (
        <section className="rounded-card border border-line bg-panel p-8 text-center sm:p-12">
          <FileText className="mx-auto text-muted" size={22} aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold text-fg">{language === 'id' ? 'Belum ada proposal' : 'No proposals yet'}</h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted">{language === 'id' ? 'Proposal yang dibuat dari workflow komersial akan muncul di sini.' : 'Proposals created from the commercial workflow will appear here.'}</p>
          {canManageCrm && <button type="button" onClick={openCreate} className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-control bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Plus size={14} aria-hidden="true" />{language === 'id' ? 'Buat proposal pertama' : 'Create your first proposal'}</button>}
        </section>
      ) : filteredProposals.length === 0 ? (
        <section className="rounded-card border border-line bg-panel p-8 text-center sm:p-12">
          <Search className="mx-auto text-muted" size={22} aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold text-fg">{language === 'id' ? 'Tidak ada hasil' : 'No matching proposals'}</h2>
          <p className="mt-1 text-xs leading-5 text-muted">{language === 'id' ? 'Coba ubah kata kunci atau filter yang digunakan.' : 'Try changing the search query or filters.'}</p>
          <button type="button" onClick={clearFilters} className="mt-4 min-h-10 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{language === 'id' ? 'Reset filter' : 'Reset filters'}</button>
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-card border border-line bg-panel" aria-label={language === 'id' ? 'Daftar proposal' : 'Proposal list'}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-fg">{language === 'id' ? 'Daftar proposal' : 'Proposal list'}</h2>
                <p className="mt-0.5 text-xs text-muted">{filteredProposals.length} {language === 'id' ? 'dokumen' : 'documents'}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="ams-table w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line text-xs text-muted">
                    <th className="px-4 py-3 font-medium sm:px-5">Proposal</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 text-right font-medium">Value</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Expiry</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProposals.map((proposal) => (
                    <tr key={proposal.id} className="border-b border-line last:border-b-0 hover:bg-panel-hover">
                      <td className="max-w-[340px] px-4 py-3.5 sm:px-5">
                        <button type="button" onClick={() => setDetailProposal(proposal)} className="block max-w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                          <div className="truncate text-sm font-medium text-fg">{proposal.title || 'Untitled proposal'}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                            <span className="font-medium text-accent-text">{proposal.proposalNumber || '—'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{proposal.lineItems.length} {language === 'id' ? 'item' : 'items'}</span>
                          </div>
                        </button>
                      </td>
                      <td className="max-w-[220px] px-4 py-3.5">
                        <div className="truncate text-xs font-medium text-fg">{proposal.clientName || '—'}</div>
                        {proposal.clientCompany && <div className="mt-1 truncate text-xs text-muted">{proposal.clientCompany}</div>}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        <div className="text-xs font-semibold text-fg">{formatAmount(proposal.total, proposal.currency || currency)}</div>
                        {proposal.discount > 0 && <div className="mt-1 text-[11px] text-muted">-{formatAmount(proposal.discount, proposal.currency || currency)}</div>}
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={proposal.status} language={language} /></td>
                      <td className="px-4 py-3.5 text-xs">{renderExpiry(proposal)}</td>
                      <td className="px-4 py-3.5 text-xs text-muted">{formatDate(proposal.updatedAt || proposal.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => setDetailProposal(proposal)} aria-label={'View ' + proposal.proposalNumber} title="View details" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-control text-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Eye size={15} aria-hidden="true" /></button>
                          {proposal.status !== 'accepted' && canManageCrm && (
                            <button type="button" onClick={() => openEdit(proposal)} aria-label={'Edit ' + proposal.proposalNumber} title="Edit" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-control text-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><FileText size={15} aria-hidden="true" /></button>
                          )}
                          {proposal.status === 'approved' && canManageInvoices && (
                            <button type="button" onClick={() => openConvert(proposal)} className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-success/30 bg-success/10 px-2.5 text-xs font-semibold text-success hover:bg-success/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Receipt size={14} aria-hidden="true" />Invoice</button>
                          )}
                          {proposal.status === 'draft' && canManageCrm && (
                            <button type="button" onClick={() => openDelete(proposal)} aria-label={'Delete ' + proposal.proposalNumber} title="Delete draft" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-control text-muted hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Trash2 size={14} aria-hidden="true" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className={sectionClass}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-fg">{language === 'id' ? 'Perlu perhatian' : 'Action required'}</h2>
                  <p className="mt-0.5 text-xs text-muted">{language === 'id' ? 'Proposal yang mendekati tenggat atau masih menunggu keputusan.' : 'Proposals nearing expiry or still awaiting a decision.'}</p>
                </div>
                <ChevronRight size={16} className="text-muted" aria-hidden="true" />
              </div>
              <div className="mt-4 space-y-2">
                {proposals.filter((proposal) => {
                  const d = daysUntil(proposal.validUntil);
                  return proposal.status !== 'accepted' && proposal.status !== 'rejected' && d !== null && d <= 7;
                }).slice(0, 4).map((proposal) => (
                  <button key={proposal.id} type="button" onClick={() => setDetailProposal(proposal)} className="flex w-full items-center justify-between gap-3 rounded-control border border-line bg-bg px-3 py-2.5 text-left hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    <span className="min-w-0"><span className="block truncate text-xs font-medium text-fg">{proposal.title}</span><span className="mt-0.5 block truncate text-[11px] text-muted">{proposal.clientName} · {proposal.proposalNumber}</span></span>
                    <span className="shrink-0 text-xs font-medium text-warning">{renderExpiry(proposal)}</span>
                  </button>
                ))}
                {proposals.filter((proposal) => {
                  const d = daysUntil(proposal.validUntil);
                  return proposal.status !== 'accepted' && proposal.status !== 'rejected' && d !== null && d <= 7;
                }).length === 0 && <p className="py-2 text-xs text-muted">{language === 'id' ? 'Tidak ada proposal yang membutuhkan perhatian berdasarkan data saat ini.' : 'No proposals currently require attention based on the available data.'}</p>}
              </div>
            </div>
            <div className={sectionClass}>
              <div>
                <h2 className="text-sm font-semibold text-fg">{language === 'id' ? 'Pipeline status' : 'Pipeline status'}</h2>
                <p className="mt-0.5 text-xs text-muted">{language === 'id' ? 'Distribusi status dari proposal yang tersedia.' : 'Status distribution across available proposals.'}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STATUS_OPTIONS.map((status) => {
                  const count = proposals.filter((proposal) => proposal.status === status.value).length;
                  return <button key={status.value} type="button" onClick={() => setStatusFilter(status.value as ProposalStatus)} className="rounded-control border border-line bg-bg p-3 text-left hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><div className="text-xs text-muted">{status.label}</div><div className="mt-1 text-lg font-medium tabular-nums text-fg">{count}</div></button>;
                })}
              </div>
            </div>
          </section>
        </>
      )}

      <Modal
        open={formOpen}
        onClose={() => !isSubmitting && setFormOpen(false)}
        size="xl"
        title={editingProposal ? (language === 'id' ? 'Edit proposal' : 'Edit proposal') : (language === 'id' ? 'Buat proposal' : 'Create proposal')}
        description={language === 'id' ? 'Lengkapi informasi komersial dan line item sebelum menyimpan.' : 'Complete the commercial information and line items before saving.'}
        closeOnOutsideClick={!isSubmitting}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="space-y-3">
            <div className="text-sm font-semibold text-fg">{language === 'id' ? 'Informasi dasar' : 'Basic information'}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5"><span className="text-xs font-medium text-fg">Title <span className="text-danger">*</span></span><input required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className={fieldClass} placeholder="Project proposal title" /></label>
              <label className="space-y-1.5"><span className="text-xs font-medium text-fg">Client <span className="text-danger">*</span></span><input required value={formClientName} onChange={(e) => setFormClientName(e.target.value)} className={fieldClass} placeholder="Client contact or name" /></label>
              <label className="space-y-1.5"><span className="text-xs font-medium text-fg">Company</span><input value={formClientCompany} onChange={(e) => setFormClientCompany(e.target.value)} className={fieldClass} placeholder="Company name" /></label>
              <label className="space-y-1.5"><span className="text-xs font-medium text-fg">Currency</span><CustomSelect value={formCurrency} onChange={(value) => setFormCurrency(value as CurrencyCode)} size="sm" options={[{ value: 'IDR', label: 'IDR' }, { value: 'USD', label: 'USD' }]} /></label>
            </div>
          </section>

          <section className="space-y-3 border-t border-line pt-5">
            <div className="flex items-center justify-between gap-3"><div><div className="text-sm font-semibold text-fg">{language === 'id' ? 'Line items' : 'Line items'}</div><p className="mt-0.5 text-xs text-muted">{language === 'id' ? 'Nilai dihitung dari quantity × unit price.' : 'Values are calculated from quantity × unit price.'}</p></div><button type="button" onClick={() => setFormItems((items) => [...items, emptyItem()])} className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Plus size={14} aria-hidden="true" />Add item</button></div>
            <div className="space-y-2">
              {formItems.map((item, index) => (
                <div key={item.id} className="grid gap-2 rounded-control border border-line bg-bg p-3 sm:grid-cols-[minmax(0,1fr)_100px_150px_40px] sm:items-end">
                  <label className="space-y-1"><span className="text-[11px] text-muted">Item {index + 1}</span><input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} required className={fieldClass} placeholder="Deliverable or service" /></label>
                  <label className="space-y-1"><span className="text-[11px] text-muted">Qty</span><input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Math.max(0, Number(e.target.value)))} required className={fieldClass + ' tabular-nums'} /></label>
                  <label className="space-y-1"><span className="text-[11px] text-muted">Unit price</span><input type="number" min="0" step="1" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))} required className={fieldClass + ' tabular-nums'} /></label>
                  <button type="button" onClick={() => setFormItems((items) => items.length > 1 ? items.filter((current) => current.id !== item.id) : items)} disabled={formItems.length === 1} aria-label={'Remove item ' + (index + 1)} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-control text-muted hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Trash2 size={14} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="space-y-1.5"><span className="text-xs font-medium text-fg">Payment terms</span><input value={formPaymentTerms} onChange={(e) => setFormPaymentTerms(e.target.value)} className={fieldClass} placeholder="e.g. 50% upfront, 50% on delivery" /></label>
              <label className="space-y-1.5"><span className="text-xs font-medium text-fg">Validity period (days)</span><input type="number" min="1" value={formValidDays} onChange={(e) => setFormValidDays(Math.max(1, Number(e.target.value)))} className={fieldClass + ' tabular-nums'} /></label>
              <label className="space-y-1.5"><span className="text-xs font-medium text-fg">Notes</span><textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={4} className={fieldClass + ' py-2.5'} placeholder="Optional internal or client-facing notes" /></label>
            </div>
            <div className="rounded-card border border-line bg-bg p-4">
              <div className="flex items-center justify-between"><span className="text-xs text-muted">Subtotal</span><span className="text-xs tabular-nums text-fg">{formatAmount(formSubtotal, formCurrency)}</span></div>
              <label className="mt-3 flex items-center justify-between gap-3 text-xs text-muted"><span>Discount</span><input type="number" min="0" value={formDiscount} onChange={(e) => setFormDiscount(Math.max(0, Number(e.target.value)))} className="min-h-9 w-32 rounded-control border border-line bg-panel px-2 text-right text-xs tabular-nums text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline-accent" /></label>
              <label className="mt-3 flex items-center justify-between gap-3 text-xs text-muted"><span>Tax rate (%)</span><input type="number" min="0" max="100" step="0.01" value={formTaxRate} onChange={(e) => setFormTaxRate(Math.min(100, Math.max(0, Number(e.target.value))))} className="min-h-9 w-24 rounded-control border border-line bg-panel px-2 text-right text-xs tabular-nums text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" /></label>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-muted"><span>Tax</span><span className="tabular-nums">{formatAmount(formTax, formCurrency)}</span></div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm font-semibold text-fg"><span>Total</span><span className="tabular-nums">{formatAmount(formTotal, formCurrency)}</span></div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setFormOpen(false)} disabled={isSubmitting} className="inline-flex min-h-10 items-center justify-center rounded-control border border-line bg-panel px-4 text-xs font-medium text-muted hover:bg-panel-hover hover:text-fg disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Cancel</button>
            <button type="submit" disabled={isSubmitting || !canManageCrm} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control bg-accent px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              {isSubmitting ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
              {editingProposal ? 'Save changes' : 'Create proposal'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!detailProposal}
        onClose={() => setDetailProposal(null)}
        size="xl"
        title={detailProposal ? detailProposal.proposalNumber + ' · ' + detailProposal.title : ''}
        description={detailProposal ? (detailProposal.clientName || 'Proposal detail') : undefined}
      >
        {detailProposal && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <StatusBadge status={detailProposal.status} language={language} />
                <h2 className="mt-2 text-lg font-semibold leading-6 text-fg">{detailProposal.title}</h2>
                <p className="mt-1 text-xs text-muted">{detailProposal.clientName}{detailProposal.clientCompany ? ' · ' + detailProposal.clientCompany : ''}</p>
              </div>
              <div className="text-left sm:text-right"><div className="text-xs text-muted">Total</div><div className="mt-1 text-xl font-medium tabular-nums text-fg">{formatAmount(detailProposal.total, detailProposal.currency)}</div></div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Created', formatDate(detailProposal.createdAt)],
                ['Valid until', detailProposal.validUntil || '—'],
                ['Owner', detailProposal.owner || '—'],
                ['Updated', formatDate(detailProposal.updatedAt || detailProposal.createdAt)]
              ].map(([label, value]) => <div key={label} className="rounded-control border border-line bg-bg p-3"><div className="text-[11px] text-muted">{label}</div><div className="mt-1 truncate text-xs font-medium text-fg">{value}</div></div>)}
            </div>

            <section className="space-y-2">
              <div className="text-sm font-semibold text-fg">Line items</div>
              <div className="overflow-hidden rounded-card border border-line">
                {detailProposal.lineItems.map((item, index) => (
                  <div key={item.id || index} className="grid gap-2 border-b border-line px-3 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_90px_150px_150px] sm:items-center">
                    <div className="min-w-0"><div className="truncate text-xs font-medium text-fg">{item.description}</div><div className="mt-1 text-[11px] text-muted">{item.quantity} × {formatAmount(item.unitPrice, detailProposal.currency)}</div></div>
                    <div className="text-xs text-muted sm:text-right">{item.quantity}</div>
                    <div className="text-xs tabular-nums text-muted sm:text-right">{formatAmount(item.unitPrice, detailProposal.currency)}</div>
                    <div className="text-xs font-semibold tabular-nums text-fg sm:text-right">{formatAmount(item.total ?? item.quantity * item.unitPrice, detailProposal.currency)}</div>
                  </div>
                ))}
                {detailProposal.lineItems.length === 0 && <div className="p-4 text-xs text-muted">No line items available.</div>}
              </div>
            </section>

            <section className="ml-auto max-w-sm rounded-card border border-line bg-bg p-4 text-xs">
              <div className="flex justify-between text-muted"><span>Subtotal</span><span className="tabular-nums">{formatAmount(detailProposal.subtotal, detailProposal.currency)}</span></div>
              {detailProposal.discount > 0 && <div className="mt-2 flex justify-between text-muted"><span>Discount</span><span className="tabular-nums">-{formatAmount(detailProposal.discount, detailProposal.currency)}</span></div>}
              <div className="mt-2 flex justify-between text-muted"><span>Tax{detailProposal.taxPercent ? ' (' + detailProposal.taxPercent + '%)' : ''}</span><span className="tabular-nums">{formatAmount(detailProposal.tax, detailProposal.currency)}</span></div>
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm font-semibold text-fg"><span>Total</span><span className="tabular-nums">{formatAmount(detailProposal.total, detailProposal.currency)}</span></div>
            </section>

            {(detailProposal.paymentTerms || detailProposal.notes) && (
              <section className="grid gap-3 sm:grid-cols-2">
                {detailProposal.paymentTerms && <div className="rounded-card border border-line bg-panel p-4"><div className="text-xs font-semibold text-fg">Payment terms</div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted">{detailProposal.paymentTerms}</p></div>}
                {detailProposal.notes && <div className="rounded-card border border-line bg-panel p-4"><div className="text-xs font-semibold text-fg">Notes</div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted">{detailProposal.notes}</p></div>}
              </section>
            )}

            <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Download size={14} aria-hidden="true" />Print / Export</button>
              <div className="flex flex-wrap justify-end gap-2">
                {detailProposal.status !== 'accepted' && canManageCrm && <button type="button" onClick={() => { setDetailProposal(null); openEdit(detailProposal); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><FileText size={14} aria-hidden="true" />Edit</button>}
                {detailProposal.status === 'approved' && canManageInvoices && <button type="button" onClick={() => openConvert(detailProposal)} className="inline-flex min-h-10 items-center gap-1.5 rounded-control bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><CheckCircle2 size={14} aria-hidden="true" />Convert to invoice</button>}
              </div>
            </div>

            {canManageCrm && detailProposal.status !== 'accepted' && (
              <section className="border-t border-line pt-4">
                <div className="mb-2 text-xs font-semibold text-fg">Status</div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <CustomSelect value={detailProposal.status} onChange={(value) => void handleStatusChange(detailProposal, value as ProposalStatus)} size="sm" options={STATUS_OPTIONS.filter((item) => canApproveBudgets || !['approved', 'rejected'].includes(item.value))} />
                  {detailProposal.status === 'review' && <span className="text-xs text-muted">Approval status is permission-controlled.</span>}
                </div>
              </section>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        size="sm"
        title={confirmAction?.type === 'delete' ? (language === 'id' ? 'Hapus proposal?' : 'Delete proposal?') : (language === 'id' ? 'Terbitkan invoice?' : 'Convert to invoice?')}
        description={confirmAction?.type === 'delete'
          ? (language === 'id' ? 'Proposal Draft akan dihapus dari daftar.' : 'This Draft proposal will be removed from the list.')
          : (language === 'id' ? 'Tindakan ini menjalankan workflow invoice untuk proposal yang diterima.' : 'This runs the invoice workflow for the accepted proposal.')}
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setConfirmAction(null)} className="min-h-10 rounded-control border border-line bg-panel px-4 text-xs font-medium text-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Cancel</button>
          <button type="button" onClick={() => confirmAction?.type === 'delete' ? void confirmDelete() : void confirmConvert()} className={'min-h-10 rounded-control px-4 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' + (confirmAction?.type === 'delete' ? 'bg-danger' : 'bg-accent')}>
            {confirmAction?.type === 'delete' ? 'Delete' : 'Convert to invoice'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProposals;
