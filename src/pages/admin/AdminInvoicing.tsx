import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  Check,
  CheckCircle2,
  Copy,
  BadgeCheck,
  BarChart3,
  Clock3,
  Download,
  Edit3,
  Eye,
  FileText,
  Hourglass,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Send,
  MoreHorizontal,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  WalletCards,
  X
} from 'lucide-react';
import { AgencyExpense, AgencyInvoice, InvoiceLineItem, InvoiceStatus, INITIAL_DEFAULT_EXPENSES, INITIAL_DEFAULT_INVOICES, computeInvoiceTotals, computeFinancialMetrics, getMonthlyCashFlowSeries, slugifyFinance, normalizeFinanceInvoice, normalizeFinanceExpense } from '../../lib/financeStore';
import { AgencyVendor, getAgencyVendors } from '../../lib/vendorStore';
import { CurrencyCode, CURRENCY_EVENT, getActiveCurrency, setActiveCurrency, formatNativeAmount } from '../../lib/currency';
import { useLanguage } from '../../lib/LanguageContext';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { InvoiceStatusDropdown } from '../../components/ui/InvoiceStatusDropdown';
import { hasAdminPermission } from '../../lib/adminAuth';
import { api } from '../../lib/apiClient';
import { AdminMetricCard, AdminModuleHeader, AdminPageShell, AdminSectionTabs, AdminTablePagination, AdminStatusBadge } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';


type SortKey = 'updated' | 'due' | 'oldest' | 'amount_high' | 'amount_low' | 'invoice';
type LedgerPeriod = 'reporting-quarter' | 'all';
type FinanceClient = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
};
type FinanceProject = {
  id: string;
  name: string;
  clientName?: string;
  clientCompany?: string;
  clientEmail?: string;
  clientId?: string;
};

type FinanceExpense = AgencyExpense & {
  currency?: CurrencyCode;
  projectId?: string;
  status?: string;
  version?: number;
};

type VendorPaymentStatus = 'scheduled' | 'partial' | 'paid' | 'overdue';

type VendorPaymentRecord = {
  id: string;
  slug: string;
  vendor: AgencyVendor;
  contract: AgencyVendor['contracts'][number];
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: VendorPaymentStatus;
};

const VENDOR_PAYMENT_MARKER = '[VENDOR_PAYMENT]';

const vendorPaymentStatusLabel: Record<VendorPaymentStatus, string> = {
  scheduled: 'Scheduled',
  partial: 'Partially paid',
  paid: 'Paid',
  overdue: 'Overdue'
};

const vendorPaymentStatusTone: Record<VendorPaymentStatus, string> = {
  scheduled: 'bg-info/10 text-info border-info/20',
  partial: 'bg-warning/10 text-warning border-warning/20',
  paid: 'bg-success/10 text-success border-success/20',
  overdue: 'bg-danger/10 text-danger border-danger/20'
};

const vendorPaymentFormatDate = (value: string) => {
  if (!value) return 'Not set';
  const parsed = new Date(value + 'T00:00:00');
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatFinanceTableDate = (value: string) => {
  if (!value) return 'Not set';
  const parsed = new Date(value + 'T00:00:00');
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatQuotationValidity = (value: string) => {
  const days = getDaysUntilDue(value);
  if (days < 0) return Math.abs(days) + ' days expired';
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 7) return days + ' days left';
  return 'Valid';
};

const vendorPaymentDueDate = (contract: AgencyVendor['contracts'][number]) => {
  if (contract.endDate) return contract.endDate;
  const start = new Date(contract.startDate + 'T00:00:00');
  if (Number.isNaN(start.getTime())) return new Date().toISOString().slice(0, 10);
  start.setDate(start.getDate() + (contract.rateType === 'monthly_retainer' ? 30 : 14));
  return start.toISOString().slice(0, 10);
};

const vendorPaymentExpenseMeta = (expense: FinanceExpense) => {
  const match = expense.description.match(/^\[VENDOR_PAYMENT\]\|([^|]+)\|([^|]+)\|(.*?)(?:\|REF:([^|]*))?(?:\|NOTE:(.*))?$/);
  if (!match) return null;
  return { vendorId: match[1], contractId: match[2], title: match[3], reference: match[4] || '', notes: match[5] || '' };
};

type ServerMetrics = {
  currency: CurrencyCode;
  totalRevenueCollected: number;
  totalBilled: number;
  totalOutstanding: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: string;
  totalInvoicesCount: number;
  paidCount: number;
  partiallyPaidCount: number;
  overdueCount: number;
  draftCount: number;
};

const createInvoiceNumber = (): string => {
  const bytes = typeof crypto !== 'undefined' && crypto.getRandomValues
    ? crypto.getRandomValues(new Uint32Array(1))[0]
    : Math.floor(Math.random() * 0xffffffff);
  return `INV-KAPI-${new Date().getFullYear()}-${1000 + (bytes % 9000)}`;
};

const getDateInputValue = (offsetDays = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const getQuarterRange = (value: string | Date) => {
  const date = value instanceof Date ? new Date(value) : new Date(String(value) + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return null;
  const quarter = Math.floor(date.getMonth() / 3);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    start: new Date(date.getFullYear(), quarter * 3, 1),
    end: new Date(date.getFullYear(), quarter * 3 + 3, 0),
    label: 'Q' + (quarter + 1) + ' ' + date.getFullYear() + ' (' + months[quarter * 3] + '-' + months[quarter * 3 + 2] + ')'
  };
};

const isInQuarter = (value: string, range: ReturnType<typeof getQuarterRange>) => {
  if (!range) return false;
  const date = new Date(value + 'T00:00:00');
  return !Number.isNaN(date.getTime()) && date >= range.start && date <= range.end;
};

const getDaysUntilDue = (value: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(value + 'T00:00:00');
  if (Number.isNaN(due.getTime())) return 9999;
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
};

const isPastDueInvoice = (invoice: AgencyInvoice) => {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
  const days = getDaysUntilDue(invoice.dueDate);
  return days < 0;
};

const isDueSoonInvoice = (invoice: AgencyInvoice) => {
  const days = getDaysUntilDue(invoice.dueDate);
  return !isPastDueInvoice(invoice) && invoice.status !== 'paid' && invoice.status !== 'cancelled' && days >= 0 && days <= 7;
};

type FinanceIncomeRow = {
  id: string;
  slug: string;
  invoiceId: string;
  invoiceNumber: string;
  clientCompany: string;
  date: string;
  amount: number;
  currency: CurrencyCode;
  method?: string;
  reference?: string;
};

const isRetainerInvoice = (invoice: AgencyInvoice) =>
  /retainer/i.test(
    [invoice.paymentTerms, invoice.notes, ...invoice.items.map((item) => item.description)]
      .filter(Boolean)
      .join(' ')
  );

const getInvoiceCollectedInRange = (invoice: AgencyInvoice, start: Date, end: Date) => {
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  if (payments.length) {
    return payments.reduce((sum, payment) => {
      const date = new Date(String(payment.date || '') + 'T00:00:00');
      return !Number.isNaN(date.getTime()) && date >= start && date <= end
        ? sum + (Number(payment.amount) || 0)
        : sum;
    }, 0);
  }

  if (invoice.paidDate) {
    const paidDate = new Date(invoice.paidDate + 'T00:00:00');
    return !Number.isNaN(paidDate.getTime()) && paidDate >= start && paidDate <= end
      ? Number(invoice.amountPaid || invoice.total || 0)
      : 0;
  }

  return 0;
};

const getInvoiceCollectedTotal = (invoice: AgencyInvoice) => {
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  if (payments.length) {
    return payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  }
  return Number(invoice.amountPaid || 0);
};

const getPreviousQuarter = (range: ReturnType<typeof getQuarterRange>) => {
  if (!range) return null;
  return getQuarterRange(new Date(range.start.getFullYear(), range.start.getMonth() - 1, 15));
};

const formatFinanceCardAmount = (amount: number, currency: CurrencyCode) => {
  if (!Number.isFinite(amount)) return '—';
  const prefix = currency === 'USD' ? '$ ' : 'Rp ';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    const millions = amount / 1_000_000;
    return prefix + millions.toLocaleString('en-US', { maximumFractionDigits: 0 }) + 'M';
  }
  if (abs >= 1_000) {
    return prefix + Math.round(amount / 1_000).toLocaleString('en-US') + 'K';
  }
  return prefix + Math.round(amount).toLocaleString('en-US');
};

const emptyLineItem = (): InvoiceLineItem => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'line-' + Date.now(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0
});

const actionClass = 'inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50';
const primaryClass = 'inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control bg-accent px-3.5 text-xs font-semibold text-white transition-colors hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50';
const fieldClass = 'h-9 min-h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none transition-colors placeholder:text-muted focus:border-accent';

const statusLabel: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partially_paid: 'Partially paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled'
};

const statusTone: Record<InvoiceStatus, string> = {
  draft: 'bg-bg text-muted border-line',
  sent: 'bg-info/10 text-info border-info/20',
  partially_paid: 'bg-warning/10 text-warning border-warning/20',
  paid: 'bg-success/10 text-success border-success/20',
  overdue: 'bg-danger/10 text-danger border-danger/20',
  cancelled: 'bg-danger/10 text-danger border-danger/20'
};

type FinanceQuotationStatus = 'draft' | 'review' | 'approved' | 'sent' | 'accepted' | 'rejected';
type PaymentFilter = 'all' | 'unpaid' | 'partial' | 'paid';
type DueFilter = 'all' | 'due_soon' | 'overdue' | 'later';
type QuotationSort = 'newest' | 'oldest' | 'value_high' | 'value_low' | 'valid_until';

type FinanceQuotation = {
  id: string;
  slug: string;
  quotationNumber: string;
  title: string;
  clientName: string;
  clientCompany: string;
  total: number;
  currency: CurrencyCode;
  status: FinanceQuotationStatus;
  validUntil: string;
  createdAt: string;
  owner: string;
  invoiceId?: string;
  items?: InvoiceLineItem[];
  discountPercent?: number;
  taxPercent?: number;
  paymentTerms?: string;
  notes?: string;
};

const STITCH_FINANCE_QUOTATIONS: FinanceQuotation[] = [
  { id: 'quote_slug_001', slug: 'enterprise-website-redesign-design-system', quotationNumber: 'QTN-2026-018', title: 'Enterprise Website Redesign & Design System', clientName: 'Nadia Wijaya', clientCompany: 'Astra Digital Ventures', total: 285000000, currency: 'IDR', status: 'sent', validUntil: '2026-10-10', createdAt: '2026-09-23', owner: 'Fikri Nurlete' },
  { id: 'quote_slug_002', slug: 'fintech-product-ux-audit-prototype', quotationNumber: 'QTN-2026-017', title: 'Fintech Product UX Audit & Prototype', clientName: 'Raka Prasetyo', clientCompany: 'Finova Labs', total: 92000000, currency: 'IDR', status: 'review', validUntil: '2026-10-04', createdAt: '2026-09-21', owner: 'Strategy Team' },
  { id: 'quote_slug_003', slug: 'cloud-migration-platform-hardening', quotationNumber: 'QTN-2026-016', title: 'Cloud Migration & Platform Hardening', clientName: 'Sarah Jenkins', clientCompany: 'Telkomsel Innovation Labs', total: 175000000, currency: 'IDR', status: 'approved', validUntil: '2026-10-16', createdAt: '2026-09-18', owner: 'Technology Team' },
  { id: 'quote_slug_004', slug: '3d-brand-experience-sprint', quotationNumber: 'QTN-2026-015', title: '3D Brand Experience Sprint', clientName: 'Jessica Halim', clientCompany: 'ShopeePay Regional Tech', total: 640000000, currency: 'IDR', status: 'accepted', validUntil: '2026-09-29', createdAt: '2026-09-12', owner: 'Creative Team', invoiceId: 'slug-inv-qtn-015' },
  { id: 'quote_slug_005', slug: 'security-portal-discovery', quotationNumber: 'QTN-2026-014', title: 'Security Portal Discovery', clientName: 'Reza Pratama', clientCompany: 'Mandiri FinTech Division', total: 145000000, currency: 'IDR', status: 'draft', validUntil: '2026-10-22', createdAt: '2026-09-08', owner: 'Fikri Nurlete' },
  { id: 'quote_slug_006', slug: 'react-native-commerce-app', quotationNumber: 'QTN-2026-013', title: 'React Native Commerce App', clientName: 'Kevin Wijaya', clientCompany: 'Nusa Cloud Systems', total: 128000000, currency: 'IDR', status: 'rejected', validUntil: '2026-09-26', createdAt: '2026-09-03', owner: 'Product Team' }
];

const STITCH_FINANCE_RETAINER_INVOICES: AgencyInvoice[] = [
  {
    id: 'retainer_demo_001',
    slug: 'kapi-ret-2026-001-astra-digital-ventures',
    invoiceNumber: 'KAPI-RET-2026-001',
    type: 'invoice',
    clientName: 'Nadia Wijaya',
    clientCompany: 'Astra Digital Ventures',
    clientEmail: 'finance@astradigital.id',
    clientPhone: '+62 811-2000-1100',
    items: [{ id: 'retainer_item_001', description: 'Monthly Product Design & Frontend Retainer', quantity: 1, unitPrice: 68000000, amount: 68000000 }],
    subtotal: 68000000,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 11,
    taxAmount: 7480000,
    total: 75480000,
    amountPaid: 75480000,
    balanceDue: 0,
    payments: [{ id: 'retainer_payment_001', amount: 75480000, date: '2026-09-06', method: 'bank_transfer', reference: 'ADV-RET-SEP', recordedBy: 'Finance Lead' }],
    currency: 'IDR',
    status: 'paid',
    issueDate: '2026-09-01',
    dueDate: '2026-09-10',
    paidDate: '2026-09-06',
    notes: 'Monthly retainer — product design and frontend support.',
    paymentTerms: 'Monthly Retainer Net 10',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-06T14:00:00Z'
  },
  {
    id: 'retainer_demo_002',
    slug: 'kapi-ret-2026-002-telkomsel-innovation-labs',
    invoiceNumber: 'KAPI-RET-2026-002',
    type: 'invoice',
    clientName: 'Sarah Jenkins',
    clientCompany: 'Telkomsel Innovation Labs',
    clientEmail: 'finance@telkomsel.co.id',
    clientPhone: '+62 811-2000-2200',
    items: [{ id: 'retainer_item_002', description: 'Cloud Platform Maintenance Retainer', quantity: 1, unitPrice: 92000000, amount: 92000000 }],
    subtotal: 92000000,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 11,
    taxAmount: 10120000,
    total: 102120000,
    amountPaid: 51060000,
    balanceDue: 51060000,
    payments: [{ id: 'retainer_payment_002', amount: 51060000, date: '2026-09-12', method: 'bank_transfer', reference: 'TIL-RET-SEP', recordedBy: 'Finance Lead' }],
    currency: 'IDR',
    status: 'partially_paid',
    issueDate: '2026-09-03',
    dueDate: '2026-09-18',
    notes: 'Monthly cloud platform maintenance retainer.',
    paymentTerms: 'Monthly Retainer Net 15',
    createdAt: '2026-09-03T10:00:00Z',
    updatedAt: '2026-09-12T15:00:00Z'
  },
  {
    id: 'retainer_demo_003',
    slug: 'kapi-ret-2026-003-shopeepay-regional-tech',
    invoiceNumber: 'KAPI-RET-2026-003',
    type: 'invoice',
    clientName: 'Jessica Halim',
    clientCompany: 'ShopeePay Regional Tech',
    clientEmail: 'finance@shopeepay.com',
    clientPhone: '+62 811-2000-3300',
    items: [{ id: 'retainer_item_003', description: 'Interactive Product Support Retainer', quantity: 1, unitPrice: 125000000, amount: 125000000 }],
    subtotal: 125000000,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 11,
    taxAmount: 13750000,
    total: 138750000,
    amountPaid: 0,
    balanceDue: 138750000,
    payments: [],
    currency: 'IDR',
    status: 'sent',
    issueDate: '2026-09-05',
    dueDate: '2026-09-20',
    notes: 'Monthly product support and optimization retainer.',
    paymentTerms: 'Monthly Retainer Net 15',
    createdAt: '2026-09-05T09:00:00Z',
    updatedAt: '2026-09-05T09:00:00Z'
  },
  {
    id: 'retainer_demo_004',
    slug: 'kapi-ret-2026-004-northstar-labs',
    invoiceNumber: 'KAPI-RET-2026-004',
    type: 'invoice',
    clientName: 'Marcus Lee',
    clientCompany: 'Northstar Labs',
    clientEmail: 'finance@northstarlabs.com',
    clientPhone: '+1 415-200-4400',
    items: [{ id: 'retainer_item_004', description: 'US Market Growth Retainer', quantity: 1, unitPrice: 14500, amount: 14500 }],
    subtotal: 14500,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 0,
    taxAmount: 0,
    total: 14500,
    amountPaid: 7250,
    balanceDue: 7250,
    payments: [{ id: 'retainer_payment_004', amount: 7250, date: '2026-09-08', method: 'bank_transfer', reference: 'NSL-SEP-RET', recordedBy: 'Finance Lead' }],
    currency: 'USD',
    status: 'partially_paid',
    issueDate: '2026-09-02',
    dueDate: '2026-09-16',
    notes: 'Monthly growth retainer for US market support.',
    paymentTerms: 'Monthly Retainer Net 14',
    createdAt: '2026-09-02T09:00:00Z',
    updatedAt: '2026-09-08T14:00:00Z'
  }
];

const normalizeFinanceQuotationStatus = (value: unknown): FinanceQuotationStatus => {
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
};

const normalizeFinanceQuotation = (raw: any): FinanceQuotation => ({
  id: String(raw?.id || ''),
  slug: slugifyFinance(raw?.slug || raw?.quotationNumber || raw?.proposalNumber || ((raw?.clientCompany || raw?.company || 'quotation') + '-' + (raw?.title || raw?.id || 'record'))),
  quotationNumber: String(raw?.proposalNumber || raw?.quotationNumber || ''),
  title: String(raw?.title || 'Untitled quotation'),
  clientName: String(raw?.clientName || raw?.name || ''),
  clientCompany: String(raw?.clientCompany || raw?.company || ''),
  total: Number(raw?.total) || Number(raw?.subtotal) || 0,
  currency: raw?.currency === 'USD' ? 'USD' : 'IDR',
  status: normalizeFinanceQuotationStatus(raw?.status),
  validUntil: String(raw?.validUntil || raw?.validityPeriod || ''),
  createdAt: String(raw?.createdAt || raw?.createdDate || ''),
  owner: String(raw?.owner || 'Finance'),
  invoiceId: raw?.invoiceId || raw?.invoice?.id || undefined,
  items: Array.isArray(raw?.items) ? raw.items.map((item: any, index: number) => ({
    id: String(item?.id || 'quotation-item-' + index),
    slug: slugifyFinance(item?.slug || String(raw?.slug || raw?.quotationNumber || 'quotation') + '-' + String(item?.description || item?.id || index)),
    description: String(item?.description || ''),
    quantity: Number(item?.quantity) || 1,
    unitPrice: Number(item?.unitPrice) || Number(item?.amount) || 0,
    amount: Number(item?.amount) || ((Number(item?.quantity) || 1) * (Number(item?.unitPrice) || 0))
  })) : [],
  discountPercent: Number(raw?.discountPercent) || 0,
  taxPercent: Number(raw?.taxPercent) || 0,
  paymentTerms: String(raw?.paymentTerms || ''),
  notes: String(raw?.notes || '')
});

const StatusBadge = ({ status }: { status: InvoiceStatus }) => (
  <span className={'inline-flex items-center gap-1.5 rounded-badge border px-2 py-1 text-[11px] font-semibold ' + statusTone[status]}>
    {status === 'paid' ? <CheckCircle2 size={12} /> : status === 'overdue' ? <AlertCircle size={12} /> : status === 'partially_paid' ? <WalletCards size={12} /> : status === 'cancelled' ? <X size={12} /> : <FileText size={12} />}
    {statusLabel[status]}
  </span>
);

const quotationStatusTone: Record<FinanceQuotationStatus, string> = {
  draft: 'bg-bg text-muted border-line',
  review: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-accent/10 text-accent-text border-accent/20',
  sent: 'bg-info/10 text-info border-info/20',
  accepted: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-danger/10 text-danger border-danger/20'
};

const QuotationStatusBadge = ({ status }: { status: FinanceQuotationStatus }) => {
  const icon = status === 'approved' ? <BadgeCheck size={12} /> : status === 'accepted' ? <CheckCircle2 size={12} /> : status === 'sent' ? <Send size={12} /> : status === 'review' ? <Clock3 size={12} /> : status === 'rejected' ? <AlertCircle size={12} /> : <FileText size={12} />;
  const label: Record<FinanceQuotationStatus, string> = {
    draft: 'Draft',
    review: 'Internal Review',
    approved: 'Approved',
    sent: 'Sent',
    accepted: 'Accepted',
    rejected: 'Rejected'
  };
  return (
    <span className={'inline-flex items-center gap-1.5 rounded-badge border px-2 py-1 text-[11px] font-semibold ' + quotationStatusTone[status]}>
      {icon}
      {label[status]}
    </span>
  );
};

const EmptyState = ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
  <div className="flex min-h-[180px] flex-col items-center justify-center rounded-card border border-line bg-bg px-5 py-8 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-panel text-muted">
      <Receipt size={18} strokeWidth={1.8} />
    </div>
    <p className="mt-3 text-sm font-medium text-fg">{title}</p>
    <p className="mt-1 max-w-[48ch] text-xs leading-5 text-muted">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

type FinanceChartPoint = {
  label: string;
  inflow: number;
  outflow: number;
  net: number;
  retainerTarget: number;
};


const FinanceCashFlowChart: React.FC<{
  data: FinanceChartPoint[];
  currency: CurrencyCode;
  ariaLabel: string;
}> = ({ data, currency, ariaLabel }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  if (!data.length) return null;
  const width = 760, height = 340, left = 64, right = 18, top = 20, bottom = 42;
  const innerWidth = width - left - right, innerHeight = height - top - bottom;
  const values = data.flatMap((point) => [point.inflow, point.outflow, point.net]);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(1, ...values);
  const range = Math.max(1, maxValue - minValue);
  const x = (index: number) => left + (data.length === 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
  const y = (value: number) => top + ((maxValue - value) / range) * innerHeight;
  const line = (key: 'inflow' | 'outflow' | 'net') => data.map((point, index) => x(index) + ',' + y(point[key])).join(' ');
  const area = (key: 'inflow' | 'net') => {
    const pts = data.map((point, index) => ({ x: x(index), y: y(point[key]) }));
    if (!pts.length) return '';
    return 'M ' + pts[0].x + ' ' + y(0) + ' L ' + pts.map((point) => point.x + ' ' + point.y).join(' L ') + ' L ' + pts[pts.length - 1].x + ' ' + y(0) + ' Z';
  };
  const latest = data[data.length - 1];
  const collected = data.reduce((sum, point) => sum + point.inflow, 0);
  const burn = data.reduce((sum, point) => sum + point.outflow, 0);
  const net = collected - burn;
  const coverage = latest.outflow > 0 ? (latest.inflow / latest.outflow) * 100 : null;
  const tooltipLeft = activeIndex === null ? 50 : Math.max(14, Math.min(86, (x(activeIndex) / width) * 100));
  return (
    <div className="min-w-0" role="img" aria-label={ariaLabel}>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Cash collected', value: latest.inflow, tone: 'text-success' },
          { label: 'Operating burn', value: latest.outflow, tone: 'text-series-3' },
          { label: 'Net cash', value: latest.net, tone: latest.net >= 0 ? 'text-success' : 'text-danger' }
        ].map((item) => (
          <div key={item.label} className="rounded-control border border-line bg-bg px-3 py-2.5">
            <p className="truncate text-[10px] font-medium text-muted">{item.label}</p>
            <p className={'mt-1 truncate text-sm font-semibold tabular-nums ' + item.tone}>{formatNativeAmount(item.value, currency, true)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-card border border-line/80 bg-bg/30 p-2 sm:p-3">
        <div className="relative h-[clamp(270px,34vw,380px)] w-full">
          <svg viewBox={'0 0 ' + width + ' ' + height} className="h-full w-full" preserveAspectRatio="none" onMouseLeave={() => setActiveIndex(null)}>
            <defs>
              <linearGradient id="finance-inflow-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--series-1)" stopOpacity="0.18"/><stop offset="100%" stopColor="var(--series-1)" stopOpacity="0"/></linearGradient>
              <linearGradient id="finance-net-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--success)" stopOpacity="0.14"/><stop offset="100%" stopColor="var(--success)" stopOpacity="0"/></linearGradient>
            </defs>
            {[0, .25, .5, .75, 1].map((ratio) => <g key={ratio}><line x1={left} x2={width - right} y1={top + ratio * innerHeight} y2={top + ratio * innerHeight} stroke="var(--line)" strokeWidth="1"/><text x={left - 8} y={top + ratio * innerHeight + 4} textAnchor="end" fontSize="9" fill="var(--muted)">{formatNativeAmount(maxValue - ratio * range, currency, true)}</text></g>)}
            <line x1={left} x2={width - right} y1={y(0)} y2={y(0)} stroke="var(--line)" strokeWidth="1.4" strokeDasharray="4 4"/>
            <path d={area('inflow')} fill="url(#finance-inflow-fill)"/>
            <path d={area('net')} fill="url(#finance-net-fill)"/>
            <polyline points={line('inflow')} fill="none" stroke="var(--series-1)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points={line('outflow')} fill="none" stroke="var(--series-3)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points={line('net')} fill="none" stroke="var(--success)" strokeWidth="2.1" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round"/>
            {data.map((point, index) => <g key={point.label} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} tabIndex={0} aria-label={`${point.label}: collected ${formatNativeAmount(point.inflow, currency, true)}, operating burn ${formatNativeAmount(point.outflow, currency, true)}, net ${formatNativeAmount(point.net, currency, true)}`}><line x1={x(index)} x2={x(index)} y1={top} y2={top + innerHeight} stroke={activeIndex === index ? 'var(--series-4)' : 'transparent'} strokeDasharray="4 4"/><circle cx={x(index)} cy={y(point.inflow)} r={activeIndex === index ? 4.8 : 3} fill="var(--series-1)"/><circle cx={x(index)} cy={y(point.outflow)} r={activeIndex === index ? 4.4 : 2.5} fill="var(--series-3)"/><circle cx={x(index)} cy={y(point.net)} r={activeIndex === index ? 4.4 : 2.5} fill="var(--success)"/></g>)}
          </svg>
          {activeIndex !== null && data[activeIndex] && <div className="pointer-events-none absolute top-3 z-10 w-[210px] -translate-x-1/2 rounded-control border border-line bg-panel px-3 py-2.5 text-[11px]" style={{ left: tooltipLeft + '%' }}><p className="font-semibold text-fg">{data[activeIndex].label}</p><div className="mt-2 space-y-1.5 text-muted"><div className="flex justify-between gap-3"><span>Collected</span><span className="tabular-nums text-success">{formatNativeAmount(data[activeIndex].inflow, currency, true)}</span></div><div className="flex justify-between gap-3"><span>Operating burn</span><span className="tabular-nums text-fg">{formatNativeAmount(data[activeIndex].outflow, currency, true)}</span></div><div className="flex justify-between gap-3"><span>Net cash</span><span className={'tabular-nums ' + (data[activeIndex].net >= 0 ? 'text-success' : 'text-danger')}>{formatNativeAmount(data[activeIndex].net, currency, true)}</span></div></div></div>}
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(68px,1fr))] gap-2 border-t border-line pt-2 text-[10px] tabular-nums text-muted">{data.map((point) => <span key={point.label} className="truncate text-center">{point.label}</span>)}</div>
      </div>
      <div className="mt-3 flex flex-col gap-2 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5"><span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-accent"/>Cash collected</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-series-3"/>Operating burn</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-success"/>Net cash</span></div>
        <span className="tabular-nums text-fg">6-month net {formatNativeAmount(net, currency, true)} · {coverage === null ? '—' : coverage.toFixed(0) + '%'} coverage latest</span>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-muted">Collected = actual payments received. Burn = recorded expenses. Net cash = collected minus burn.</p>
    </div>
  );
};
const FinanceMetricCard: React.FC<React.ComponentProps<typeof AdminMetricCard>> = AdminMetricCard;
export const AdminInvoicing: React.FC = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const canViewFinancials = hasAdminPermission('canViewFinancials');
  const canManageInvoices = hasAdminPermission('canManageInvoices');
  const canCreateInvoice = canManageInvoices;
  const canDeleteInvoice = canManageInvoices;

  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());

  const financeView = useMemo(
    () => new URLSearchParams(location.search).get('finance') || 'invoices',
    [location.search]
  );
  const [invoices, setInvoices] = useState<AgencyInvoice[]>([]);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [clients, setClients] = useState<FinanceClient[]>([]);
  const [projects, setProjects] = useState<FinanceProject[]>([]);
  const [vendors, setVendors] = useState<AgencyVendor[]>(() => getAgencyVendors());
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);
  const noticeTimerRef = React.useRef<number | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('updated');
  const [ledgerPeriod, setLedgerPeriod] = useState<LedgerPeriod>('reporting-quarter');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    client: true,
    timeline: true,
    billing: true,
    status: true,
    actions: true
  });
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expensePeriodFilter, setExpensePeriodFilter] = useState<'all' | '30d' | '90d' | 'ytd'>('all');
  const [expenseDetail, setExpenseDetail] = useState<FinanceExpense | null>(null);
  const [expenseSort, setExpenseSort] = useState<'date_desc' | 'date_asc' | 'amount_high' | 'amount_low'>('date_desc');
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicePageSize, setInvoicePageSize] = useState(10);
  const [expensePage, setExpensePage] = useState(1);
  const [expensePageSize, setExpensePageSize] = useState(10);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<AgencyInvoice | null>(null);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [invoiceCurrency, setInvoiceCurrency] = useState<CurrencyCode>(currency);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>([emptyLineItem()]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(11);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>('draft');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseType, setExpenseType] = useState<'OpEx' | 'CapEx' | 'Rentals'>('OpEx');
  const [expenseCategory, setExpenseCategory] = useState<AgencyExpense['category']>('Software & Cloud');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseDate, setExpenseDate] = useState(getDateInputValue());
  const [expenseProjectId, setExpenseProjectId] = useState('');
  const [expenseRecurringInterval, setExpenseRecurringInterval] = useState<AgencyExpense['recurringInterval']>('none');
  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState('');
  const [expenseIdempotencyKey, setExpenseIdempotencyKey] = useState('');

  const [paymentInvoice, setPaymentInvoice] = useState<AgencyInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'credit_card' | 'cash' | 'other'>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(getDateInputValue());
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentIdempotencyKey, setPaymentIdempotencyKey] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(null);

  const [detailInvoice, setDetailInvoice] = useState<AgencyInvoice | null>(null);
  const [reminderInvoice, setReminderInvoice] = useState<AgencyInvoice | null>(null);
  const [dunningOpen, setDunningOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'invoice' | 'expense'; id: string; label: string } | null>(null);
  const [confirmingAction, setConfirmingAction] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState<'invoice' | 'expense' | 'payment' | null>(null);
  const [pendingPaymentInvoice, setPendingPaymentInvoice] = useState<AgencyInvoice | null>(null);
  const [invoiceDirty, setInvoiceDirty] = useState(false);
  const [expenseDirty, setExpenseDirty] = useState(false);
  const [paymentDirty, setPaymentDirty] = useState(false);
  const loadRequestId = React.useRef(0);

  const [usingDemoFinance, setUsingDemoFinance] = useState(false);
  const [usingDemoInvoices, setUsingDemoInvoices] = useState(false);
  const [usingDemoExpenses, setUsingDemoExpenses] = useState(false);
  const [incomeExpenseMode, setIncomeExpenseMode] = useState<'income' | 'expenses'>('income');
  const [incomeSearch, setIncomeSearch] = useState('');
  const [incomePage, setIncomePage] = useState(1);
  const [incomePageSize, setIncomePageSize] = useState(10);
  const [quotationPage, setQuotationPage] = useState(1);
  const [quotationPageSize, setQuotationPageSize] = useState(10);
  const [vendorPaymentPage, setVendorPaymentPage] = useState(1);
  const [vendorPaymentPageSize, setVendorPaymentPageSize] = useState(10);
  const [retainerPage, setRetainerPage] = useState(1);
  const [retainerPageSize, setRetainerPageSize] = useState(10);
  const [quotations, setQuotations] = useState<FinanceQuotation[]>(STITCH_FINANCE_QUOTATIONS);
  const [usingDemoQuotations, setUsingDemoQuotations] = useState(true);
  const [quotationLoading, setQuotationLoading] = useState(true);
  const [quotationSearch, setQuotationSearch] = useState('');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState<'all' | FinanceQuotationStatus>('all');
  const [quotationSort, setQuotationSort] = useState<QuotationSort>('newest');
  const [quotationActionMenu, setQuotationActionMenu] = useState<string | null>(null);
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [quotationDetail, setQuotationDetail] = useState<FinanceQuotation | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<FinanceQuotation | null>(null);
  const [quotationSaving, setQuotationSaving] = useState(false);
  const [quotationTitle, setQuotationTitle] = useState('');
  const [quotationClientName, setQuotationClientName] = useState('');
  const [quotationClientCompany, setQuotationClientCompany] = useState('');
  const [quotationAmount, setQuotationAmount] = useState(0);
  const [quotationItems, setQuotationItems] = useState<InvoiceLineItem[]>([emptyLineItem()]);
  const [quotationDiscountPercent, setQuotationDiscountPercent] = useState(0);
  const [quotationTaxPercent, setQuotationTaxPercent] = useState(11);
  const [quotationValidUntil, setQuotationValidUntil] = useState(getDateInputValue(30));
  const [quotationPaymentTerms, setQuotationPaymentTerms] = useState('Bank Transfer Net 14');
  const [quotationNotes, setQuotationNotes] = useState('');
  const [quotationStatus, setQuotationStatus] = useState<FinanceQuotationStatus>('draft');

  const [vendorPaymentSearch, setVendorPaymentSearch] = useState('');
  const [vendorPaymentStatusFilter, setVendorPaymentStatusFilter] = useState<VendorPaymentStatus | 'all'>('all');
  const [vendorPaymentVendorFilter, setVendorPaymentVendorFilter] = useState('all');
  const [vendorPaymentSort, setVendorPaymentSort] = useState<'due_asc' | 'due_desc' | 'amount_high' | 'amount_low'>('due_asc');
  const [vendorPaymentModalOpen, setVendorPaymentModalOpen] = useState(false);
  const [vendorPaymentDetail, setVendorPaymentDetail] = useState<VendorPaymentRecord | null>(null);
  const [vendorPaymentVendorId, setVendorPaymentVendorId] = useState('');
  const [vendorPaymentContractId, setVendorPaymentContractId] = useState('');
  const [vendorPaymentAmount, setVendorPaymentAmount] = useState(0);
  const [vendorPaymentDate, setVendorPaymentDate] = useState(getDateInputValue());
  const [vendorPaymentReference, setVendorPaymentReference] = useState('');
  const [vendorPaymentNotes, setVendorPaymentNotes] = useState('');
  const [savingVendorPayment, setSavingVendorPayment] = useState(false);
  const [vendorPaymentIdempotencyKey, setVendorPaymentIdempotencyKey] = useState('');

  const dismissNotice = () => {
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
    setNotice(null);
  };

  const showNotice = (tone: 'success' | 'danger', message: string) => {
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
    setNotice({ tone, message });
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, 3500);
  };

  useEffect(() => () => {
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
  }, []);

  const loadData = async (silent = false) => {
    const requestId = ++loadRequestId.current;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [invoiceRes, expenseRes, metricsRes, clientRes, projectRes, vendorRes] = await Promise.all([
        api.finance.getInvoices(),
        api.finance.getExpenses(),
        api.finance.getMetrics(currency),
        api.clients.getAll(),
        api.projects.getAll(),
        api.vendors.getAll()
      ]);

      const apiInvoices = invoiceRes.success && Array.isArray(invoiceRes.data?.invoices)
        ? invoiceRes.data.invoices as AgencyInvoice[]
        : [];
      const apiExpenses = expenseRes.success && Array.isArray(expenseRes.data?.expenses)
        ? expenseRes.data.expenses as FinanceExpense[]
        : [];

      const demoInvoices = INITIAL_DEFAULT_INVOICES
        .filter((invoice) => invoice.currency === currency)
        .map((invoice) => ({ ...invoice, items: Array.isArray(invoice.items) ? invoice.items.map((item) => ({ ...item })) : [] }));
      const demoExpenses = INITIAL_DEFAULT_EXPENSES
        .map((expense) => ({ ...expense, currency }));

      const shouldUseDemoInvoices = apiInvoices.length === 0;
      const shouldUseDemoExpenses = apiExpenses.length === 0;
      const nextInvoices = shouldUseDemoInvoices ? demoInvoices : apiInvoices;
      const nextExpenses = shouldUseDemoExpenses ? demoExpenses : apiExpenses;

      if (!nextInvoices.length && !nextExpenses.length && !metricsRes.success) {
        throw new Error(invoiceRes.error || expenseRes.error || metricsRes.error || 'Financial data is temporarily unavailable.');
      }

      if (requestId !== loadRequestId.current) return;

      setUsingDemoInvoices(shouldUseDemoInvoices);
      setUsingDemoExpenses(shouldUseDemoExpenses);
      setUsingDemoFinance(shouldUseDemoInvoices || shouldUseDemoExpenses);

      setInvoices(nextInvoices);
      setExpenses(nextExpenses);

      if (shouldUseDemoInvoices || shouldUseDemoExpenses || !metricsRes.success || !metricsRes.data?.metrics) {
        const derived = computeFinancialMetrics(nextInvoices, nextExpenses);
        setServerMetrics({
          currency,
          totalRevenueCollected: derived.totalPaidRevenue,
          totalBilled: derived.totalPaidRevenue + derived.totalOutstanding + derived.totalOverdue,
          totalOutstanding: derived.totalOutstanding,
          totalExpense: derived.totalExpenses,
          netProfit: derived.netOperatingProfit,
          profitMargin: String(derived.netMarginPercent),
          totalInvoicesCount: derived.totalInvoicesCount,
          paidCount: derived.paidCount,
          partiallyPaidCount: derived.partiallyPaidCount,
          overdueCount: derived.overdueCount,
          draftCount: nextInvoices.filter((invoice) => invoice.status === 'draft').length
        });
      } else {
        setServerMetrics(metricsRes.data.metrics as ServerMetrics);
      }

      if (clientRes.success && Array.isArray(clientRes.data?.clients)) {
        setClients(clientRes.data.clients as FinanceClient[]);
      }
      if (projectRes.success && Array.isArray(projectRes.data?.projects)) {
        setProjects(projectRes.data.projects as FinanceProject[]);
      }
      if (vendorRes.success && Array.isArray(vendorRes.data?.vendors) && vendorRes.data.vendors.length) {
        setVendors(vendorRes.data.vendors as AgencyVendor[]);
      } else {
        setVendors(getAgencyVendors());
      }
    } catch (err) {
      if (requestId === loadRequestId.current) {
        setError(err instanceof Error ? err.message : 'Financial data is temporarily unavailable.');
      }
    } finally {
      if (requestId === loadRequestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const loadQuotations = async () => {
    setQuotationLoading(true);
    try {
      const result = await api.proposals.getAll();
      const rows = result.success && Array.isArray(result.data?.proposals)
        ? result.data.proposals.map(normalizeFinanceQuotation).filter((quotation) => quotation.currency === currency)
        : [];

      if (rows.length) {
        setQuotations(rows);
        setUsingDemoQuotations(false);
      } else {
        setQuotations(
          STITCH_FINANCE_QUOTATIONS.filter((quotation) => quotation.currency === currency)
        );
        setUsingDemoQuotations(true);
      }
    } catch {
      setQuotations(STITCH_FINANCE_QUOTATIONS.filter((quotation) => quotation.currency === currency));
      setUsingDemoQuotations(true);
    } finally {
      setQuotationLoading(false);
    }
  };

  useEffect(() => {
    if (!canViewFinancials) {
      setLoading(false);
      return;
    }
    void loadData();
  }, [canViewFinancials, currency]);

  useEffect(() => {
    void loadQuotations();
  }, [currency]);

  useEffect(() => {
    const handleCurrencyChange = (event: Event) => {
      const detail = (event as CustomEvent<{ currency?: CurrencyCode }>).detail;
      if (detail?.currency) setCurrency(detail.currency);
    };
    window.addEventListener(CURRENCY_EVENT, handleCurrencyChange);
    return () => window.removeEventListener(CURRENCY_EVENT, handleCurrencyChange);
  }, []);

  const currencyInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.currency === currency),
    [invoices, currency]
  );

  const currencyExpenses = useMemo(
    () => expenses.filter((expense) => (expense.currency || 'IDR') === currency),
    [expenses, currency]
  );

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  const vendorPaymentRecords = useMemo<VendorPaymentRecord[]>(() => {
    const paymentExpenses = currencyExpenses.filter((expense) => (
      expense.category === 'Salaries & Contractors' && vendorPaymentExpenseMeta(expense)
    ));

    return vendors.flatMap((vendor) => vendor.contracts
      .filter((contract) => contract.status !== 'terminated' && contract.currency === currency)
      .map((contract) => {
        const matchingExpenses = paymentExpenses.filter((expense) => {
          const meta = vendorPaymentExpenseMeta(expense);
          return meta?.vendorId === vendor.id && meta?.contractId === contract.id;
        });
        const paidAmount = matchingExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
        const amount = Number(contract.rateAmount || 0);
        const dueDate = vendorPaymentDueDate(contract);
        const dueDays = getDaysUntilDue(dueDate);
        const status: VendorPaymentStatus = paidAmount >= amount && amount > 0
          ? 'paid'
          : paidAmount > 0
            ? 'partial'
            : dueDays < 0
              ? 'overdue'
              : 'scheduled';

        return {
          id: vendor.id + ':' + contract.id,
          slug: slugifyFinance((vendor.companyName || vendor.name) + '-' + contract.title + '-' + dueDate),
          vendor, contract, dueDate, amount, paidAmount, status
        };
      }));
  }, [vendors, currencyExpenses, currency]);

  const filteredVendorPayments = useMemo(() => {
    const query = vendorPaymentSearch.trim().toLowerCase();
    const rows = vendorPaymentRecords.filter((row) => {
      const haystack = [row.vendor.name, row.vendor.companyName || '', row.vendor.primaryCategory, row.contract.title, row.contract.rateType].join(' ').toLowerCase();
      return (!query || haystack.includes(query))
        && (vendorPaymentStatusFilter === 'all' || row.status === vendorPaymentStatusFilter)
        && (vendorPaymentVendorFilter === 'all' || row.vendor.id === vendorPaymentVendorFilter);
    });
    return [...rows].sort((a, b) => {
      if (vendorPaymentSort === 'amount_high') return b.amount - a.amount;
      if (vendorPaymentSort === 'amount_low') return a.amount - b.amount;
      const aTime = new Date(a.dueDate + 'T00:00:00').getTime();
      const bTime = new Date(b.dueDate + 'T00:00:00').getTime();
      return vendorPaymentSort === 'due_desc' ? bTime - aTime : aTime - bTime;
    });
  }, [vendorPaymentRecords, vendorPaymentSearch, vendorPaymentStatusFilter, vendorPaymentVendorFilter, vendorPaymentSort]);

  const vendorPaymentPageCount = Math.max(1, Math.ceil(filteredVendorPayments.length / vendorPaymentPageSize));
  const paginatedVendorPayments = filteredVendorPayments.slice((vendorPaymentPage - 1) * vendorPaymentPageSize, vendorPaymentPage * vendorPaymentPageSize);

  const vendorPaymentMetrics = useMemo(() => ({
    scheduled: vendorPaymentRecords.filter((row) => row.status === 'scheduled').length,
    overdue: vendorPaymentRecords.filter((row) => row.status === 'overdue').length,
    paid: vendorPaymentRecords.filter((row) => row.status === 'paid').reduce((sum, row) => sum + row.paidAmount, 0),
    outstanding: vendorPaymentRecords.reduce((sum, row) => sum + Math.max(0, row.amount - row.paidAmount), 0)
  }), [vendorPaymentRecords]);

  const derivedMetrics = useMemo(
    () => computeFinancialMetrics(currencyInvoices, currencyExpenses),
    [currencyInvoices, currencyExpenses]
  );

  const cashFlow = useMemo(
    () => getMonthlyCashFlowSeries(currencyInvoices, currencyExpenses),
    [currencyInvoices, currencyExpenses]
  );

  const reportingQuarter = useMemo(() => getQuarterRange(new Date()), []);

  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const ytdInvoiced = useMemo(
    () => currencyInvoices
      .filter((invoice) => invoice.status !== 'cancelled')
      .filter((invoice) => {
        const date = new Date(invoice.issueDate + 'T00:00:00');
        return !Number.isNaN(date.getTime()) && date >= yearStart && date <= yearEnd;
      })
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
    [currencyInvoices, currentYear]
  );

  const ytdCollected = useMemo(
    () => currencyInvoices
      .filter((invoice) => invoice.status !== 'cancelled')
      .reduce((sum, invoice) => sum + getInvoiceCollectedInRange(invoice, yearStart, yearEnd), 0),
    [currencyInvoices, currentYear]
  );

  const ytdExpenses = useMemo(
    () => currencyExpenses.reduce((sum, expense) => {
      const date = new Date(String(expense.date || '') + 'T00:00:00');
      return !Number.isNaN(date.getTime()) && date >= yearStart && date <= yearEnd
        ? sum + Number(expense.amount || 0)
        : sum;
    }, 0),
    [currencyExpenses, currentYear]
  );

  const ytdNetCash = ytdCollected - ytdExpenses;
  const ytdCollectionRate = ytdInvoiced > 0 ? (ytdCollected / ytdInvoiced) * 100 : 0;

  const retainerInvoices = useMemo(
    () => currencyInvoices.filter((invoice) => invoice.status !== 'cancelled' && isRetainerInvoice(invoice)),
    [currencyInvoices]
  );

  const retainerLedgerInvoices = useMemo(() => {
    if (retainerInvoices.length) return retainerInvoices;
    return STITCH_FINANCE_RETAINER_INVOICES.filter((invoice) => invoice.currency === currency).map(normalizeFinanceInvoice);
  }, [currency, retainerInvoices]);

  const usingDemoRetainerLedger = retainerInvoices.length === 0 && retainerLedgerInvoices.length > 0;
  const retainerPageCount = Math.max(1, Math.ceil(retainerLedgerInvoices.length / retainerPageSize));
  const paginatedRetainerLedgerInvoices = retainerLedgerInvoices.slice((retainerPage - 1) * retainerPageSize, retainerPage * retainerPageSize);

  const financeChartData = useMemo(
    () => cashFlow.map((point) => {
      const target = retainerInvoices
        .filter((invoice) => {
          const date = new Date(invoice.issueDate + 'T00:00:00');
          return !Number.isNaN(date.getTime()) && date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) === point.month;
        })
        .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

      return { ...point, label: point.month, retainerTarget: target };
    }),
    [cashFlow, retainerInvoices]
  );

  const hasTrendData = financeChartData.some(
    (point) => point.net !== 0 || point.outflow !== 0 || point.retainerTarget !== 0
  );

  const quarterInvoices = useMemo(
    () => reportingQuarter
      ? currencyInvoices.filter((invoice) => isInQuarter(invoice.issueDate, reportingQuarter))
      : [],
    [currencyInvoices, reportingQuarter]
  );

  const quarterCollected = useMemo(
    () => {
      if (!reportingQuarter) return 0;
      const end = new Date(reportingQuarter.end);
      end.setHours(23, 59, 59, 999);
      return quarterInvoices
        .filter((invoice) => invoice.status !== 'cancelled')
        .reduce((sum, invoice) => sum + getInvoiceCollectedInRange(invoice, reportingQuarter.start, end), 0);
    },
    [quarterInvoices, reportingQuarter]
  );

  const quarterExpenses = useMemo(
    () => reportingQuarter
      ? currencyExpenses
        .filter((expense) => isInQuarter(expense.date, reportingQuarter) && expense.type !== 'CapEx')
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
      : 0,
    [currencyExpenses, reportingQuarter]
  );

  const quarterNetCash = quarterCollected - quarterExpenses;
  const quarterMargin = quarterCollected > 0 ? (quarterNetCash / quarterCollected) * 100 : 0;

  const taxProvision = useMemo(
    () => currencyInvoices
      .filter((invoice) => invoice.status !== 'cancelled')
      .reduce((sum, invoice) => sum + Number(invoice.taxAmount || 0), 0),
    [currencyInvoices]
  );

  const taxCollected = useMemo(
    () => currencyInvoices
      .filter((invoice) => invoice.status !== 'cancelled')
      .reduce((sum, invoice) => {
        const collected = getInvoiceCollectedTotal(invoice);
        const paidRatio = invoice.total > 0 ? Math.min(1, collected / Number(invoice.total)) : 0;
        return sum + Number(invoice.taxAmount || 0) * paidRatio;
      }, 0),
    [currencyInvoices]
  );

  const taxOutstanding = Math.max(0, taxProvision - taxCollected);

  const retainerBilled = useMemo(
    () => retainerInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
    [retainerInvoices]
  );

  const retainerCollected = useMemo(
    () => retainerInvoices.reduce((sum, invoice) => sum + getInvoiceCollectedTotal(invoice), 0),
    [retainerInvoices]
  );

  const quarterExpenseCategories = useMemo(() => {
    const totals = new Map<string, number>();
    currencyExpenses
      .filter((expense) => reportingQuarter && isInQuarter(expense.date, reportingQuarter))
      .forEach((expense) => {
        const key = expense.category || 'Other';
        totals.set(key, (totals.get(key) || 0) + Number(expense.amount || 0));
      });
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [currencyExpenses, reportingQuarter]);

  const quarterStatusRows = useMemo(() => (
    ['paid', 'sent', 'partially_paid', 'overdue', 'draft'] as InvoiceStatus[]
  ).map((status) => ({
    status,
    count: quarterInvoices.filter((invoice) => invoice.status === status).length
  })), [quarterInvoices]);

  const ledgerInvoices = useMemo(
    () => ledgerPeriod === 'all'
      ? currencyInvoices
      : currencyInvoices.filter((invoice) => isInQuarter(invoice.issueDate, reportingQuarter)),
    [currencyInvoices, ledgerPeriod, reportingQuarter]
  );

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = ledgerInvoices.filter((invoice) => {
      const balance = Math.max(0, Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0))));
      const collected = Math.max(0, Number(invoice.total || 0) - balance);
      const paymentState: PaymentFilter = balance <= 0 || invoice.status === 'paid' ? 'paid' : collected > 0 ? 'partial' : 'unpaid';
      const dueState: DueFilter = isPastDueInvoice(invoice) ? 'overdue' : isDueSoonInvoice(invoice) ? 'due_soon' : 'later';
      const searchable = [invoice.invoiceNumber, invoice.clientName, invoice.clientCompany, invoice.clientEmail, projectsById.get(invoice.projectId)?.name || ''].join(' ').toLowerCase();
      return (!query || searchable.includes(query))
        && (statusFilter === 'all' || (statusFilter === 'due_soon' ? isDueSoonInvoice(invoice) : invoice.status === statusFilter))
        && (paymentFilter === 'all' || paymentState === paymentFilter)
        && (dueFilter === 'all' || dueState === dueFilter);
    });
    return [...result].sort((a, b) => {
      if (sort === 'amount_high') return b.total - a.total;
      if (sort === 'amount_low') return a.total - b.total;
      if (sort === 'due') return String(a.dueDate).localeCompare(String(b.dueDate));
      if (sort === 'oldest') return String(a.updatedAt || '').localeCompare(String(b.updatedAt || ''));
      if (sort === 'invoice') return a.invoiceNumber.localeCompare(b.invoiceNumber);
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
  }, [ledgerInvoices, search, statusFilter, paymentFilter, dueFilter, sort, projectsById]);

  useEffect(() => {
    setInvoicePage(1);
  }, [search, statusFilter, paymentFilter, dueFilter, sort, currency]);

  useEffect(() => {
    setExpensePage(1);
  }, [expenseSearch, expenseTypeFilter, expenseSort, currency]);

  const paginatedInvoices = useMemo(() => {
    const start = (invoicePage - 1) * invoicePageSize;
    return filteredInvoices.slice(start, start + invoicePageSize);
  }, [filteredInvoices, invoicePage]);

  const invoicePageCount = Math.max(1, Math.ceil(filteredInvoices.length / invoicePageSize));

  useEffect(() => {
    setInvoicePage((page) => Math.min(page, invoicePageCount));
  }, [invoicePageCount]);
  useEffect(() => { setVendorPaymentPage((page) => Math.min(page, vendorPaymentPageCount)); }, [vendorPaymentPageCount]);
  useEffect(() => { setRetainerPage((page) => Math.min(page, retainerPageCount)); }, [retainerPageCount]);

  const actionRequiredInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return currencyInvoices
      .filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled')
      .map((invoice) => {
        const due = new Date(invoice.dueDate + 'T00:00:00');
        const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / 86400000);
        return { invoice, daysUntilDue };
      })
      .filter(({ invoice, daysUntilDue }) => daysUntilDue <= 7 || isPastDueInvoice(invoice))
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [currencyInvoices]);

  const invoiceStatusCounts = useMemo(() => (['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'] as InvoiceStatus[]).map((status) => ({
    status,
    count: ledgerInvoices.filter((invoice) => invoice.status === status).length
  })), [ledgerInvoices]);

  const dueSoonCount = useMemo(() => ledgerInvoices.filter(isDueSoonInvoice).length, [ledgerInvoices]);

  const incomeRows = useMemo<FinanceIncomeRow[]>(() => {
    const rows: FinanceIncomeRow[] = [];
    currencyInvoices
      .filter((invoice) => invoice.status !== 'cancelled')
      .forEach((invoice) => {
        const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
        if (payments.length) {
          payments.forEach((payment) => {
            const date = String(payment.date || '');
            if (!date) return;
            rows.push({
              id: String(payment.id || invoice.id + '-' + date),
              slug: slugifyFinance((invoice.slug || invoice.invoiceNumber) + '-payment-' + (payment.id || date)),
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              clientCompany: invoice.clientCompany || invoice.clientName,
              date,
              amount: Number(payment.amount) || 0,
              currency: invoice.currency,
              method: String(payment.method || 'Other'),
              reference: String(payment.reference || '')
            });
          });
        } else if (invoice.paidDate && Number(invoice.amountPaid || 0) > 0) {
          rows.push({
            id: invoice.id + '-paid',
            slug: slugifyFinance((invoice.slug || invoice.invoiceNumber) + '-paid-' + invoice.paidDate),
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            clientCompany: invoice.clientCompany || invoice.clientName,
            date: invoice.paidDate,
            amount: Number(invoice.amountPaid || 0),
            currency: invoice.currency,
            method: 'Recorded payment',
            reference: ''
          });
        }
      });
    const query = incomeSearch.trim().toLowerCase();
    return rows
      .filter((row) => !query || [row.invoiceNumber, row.clientCompany, row.date].join(' ').toLowerCase().includes(query))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [currencyInvoices, incomeSearch]);

  const paginatedIncomeRows = useMemo(() => {
    const start = (incomePage - 1) * incomePageSize;
    return incomeRows.slice(start, start + incomePageSize);
  }, [incomeRows, incomePage]);
  const incomePageCount = Math.max(1, Math.ceil(incomeRows.length / incomePageSize));

  useEffect(() => {
    setIncomePage(1);
  }, [incomeSearch, currency]);

  useEffect(() => {
    setIncomePage(1);
    setExpensePage(1);
  }, [incomeExpenseMode, currency]);

  useEffect(() => {
    setIncomePage((page) => Math.min(page, incomePageCount));
  }, [incomePageCount]);

  const filteredExpenses = useMemo(() => {
    const query = expenseSearch.trim().toLowerCase();
    const result = currencyExpenses.filter((expense) => {
      const searchable = [expense.description, expense.category, expense.type || 'OpEx', expense.recordedBy, expense.date].join(' ').toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesType = expenseTypeFilter === 'all' || (expense.type || 'OpEx') === expenseTypeFilter;
      const matchesCategory = expenseCategoryFilter === 'all' || expense.category === expenseCategoryFilter;
      const expenseDateValue = new Date(String(expense.date || '') + 'T00:00:00');
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const periodStart =
        expensePeriodFilter === '30d'
          ? new Date(today.getTime() - 30 * 86400000)
          : expensePeriodFilter === '90d'
            ? new Date(today.getTime() - 90 * 86400000)
            : expensePeriodFilter === 'ytd'
              ? new Date(today.getFullYear(), 0, 1)
              : null;
      const matchesPeriod = !periodStart || (!Number.isNaN(expenseDateValue.getTime()) && expenseDateValue >= periodStart && expenseDateValue <= today);
      return matchesSearch && matchesType && matchesCategory && matchesPeriod;
    });

    return [...result].sort((a, b) => {
      if (expenseSort === 'amount_high') return Number(b.amount) - Number(a.amount);
      if (expenseSort === 'amount_low') return Number(a.amount) - Number(b.amount);
      if (expenseSort === 'date_asc') return String(a.date || '').localeCompare(String(b.date || ''));
      return String(b.date || '').localeCompare(String(a.date || ''));
    });
  }, [currencyExpenses, expenseSearch, expenseTypeFilter, expenseCategoryFilter, expensePeriodFilter, expenseSort]);

  const paginatedExpenses = useMemo(() => {
    const start = (expensePage - 1) * expensePageSize;
    return filteredExpenses.slice(start, start + expensePageSize);
  }, [filteredExpenses, expensePage]);
  const expensePageCount = Math.max(1, Math.ceil(filteredExpenses.length / expensePageSize));

  useEffect(() => {
    setExpensePage((page) => Math.min(page, expensePageCount));
  }, [expensePageCount]);

  useEffect(() => {
    setExpensePage(1);
  }, [expenseSearch, expenseTypeFilter, expenseCategoryFilter, expensePeriodFilter, expenseSort]);

  const invoiceTotals = useMemo(
    () => computeInvoiceTotals(invoiceItems, taxPercent, discountPercent),
    [invoiceItems, taxPercent, discountPercent]
  );

  const invoiceBillingLocked = Boolean(
    editingInvoice
    && ((editingInvoice.payments?.length ?? 0) > 0 || Number(editingInvoice.amountPaid || 0) > 0)
  );

  const resetInvoiceForm = () => {
    setInvoiceDirty(false);
    setEditingInvoice(null);
    setInvoiceNumber(createInvoiceNumber());
    setClientId('');
    setProjectId('');
    setClientName('');
    setClientCompany('');
    setClientEmail('');
    setClientPhone('');
    setInvoiceCurrency(currency);
    setInvoiceItems([emptyLineItem()]);
    setDiscountPercent(0);
    setTaxPercent(11);
    setInvoiceStatus('draft');
    setIssueDate(getDateInputValue());
    setDueDate(getDateInputValue(14));
    setPaymentTerms('');
    setInvoiceNotes('');
  };

  const syncDemoFinanceMetrics = (nextInvoices: AgencyInvoice[], nextExpenses: FinanceExpense[]) => {
    const metrics = computeFinancialMetrics(
      nextInvoices.filter((invoice) => invoice.currency === currency),
      nextExpenses.filter((expense) => (expense.currency || 'IDR') === currency)
    );
    setServerMetrics({
      currency,
      totalRevenueCollected: metrics.totalPaidRevenue,
      totalBilled: metrics.totalPaidRevenue + metrics.totalOutstanding + metrics.totalOverdue,
      totalOutstanding: metrics.totalOutstanding,
      totalExpense: metrics.totalExpenses,
      netProfit: metrics.netOperatingProfit,
      profitMargin: String(metrics.netMarginPercent),
      totalInvoicesCount: metrics.totalInvoicesCount,
      paidCount: metrics.paidCount,
      partiallyPaidCount: metrics.partiallyPaidCount,
      overdueCount: metrics.overdueCount,
      draftCount: nextInvoices.filter((invoice) => invoice.status === 'draft' && invoice.currency === currency).length
    });
  };

  const openCreateInvoice = () => {
    resetInvoiceForm();
    setInvoiceModalOpen(true);
  };

  const requestCloseInvoice = () => {
    if (savingInvoice) return;
    if (invoiceDirty) {
      setInvoiceModalOpen(false);
      setDiscardPrompt('invoice');
      return;
    }
    setInvoiceModalOpen(false);
    setInvoiceDirty(false);
  };

  const requestCloseExpense = () => {
    if (savingExpense) return;
    if (expenseDirty) {
      setExpenseModalOpen(false);
      setDiscardPrompt('expense');
      return;
    }
    setExpenseModalOpen(false);
    setExpenseDirty(false);
  };

  const requestClosePayment = () => {
    if (savingPayment) return;
    if (paymentDirty) {
      setPendingPaymentInvoice(paymentInvoice);
      setPaymentInvoice(null);
      setDiscardPrompt('payment');
      return;
    }
    setPaymentInvoice(null);
    setPaymentDirty(false);
  };

  const cancelDiscardPrompt = () => {
    const target = discardPrompt;
    setDiscardPrompt(null);
    if (target === 'invoice') setInvoiceModalOpen(true);
    if (target === 'expense') setExpenseModalOpen(true);
    if (target === 'payment') {
      setPaymentInvoice(pendingPaymentInvoice);
      setPendingPaymentInvoice(null);
    }
  };

  const confirmDiscardPrompt = () => {
    const target = discardPrompt;
    setDiscardPrompt(null);
    if (target === 'invoice') setInvoiceDirty(false);
    if (target === 'expense') {
      setExpenseDirty(false);
      setExpenseIdempotencyKey('');
    }
    if (target === 'payment') {
      setPaymentDirty(false);
      setPaymentIdempotencyKey('');
      setPendingPaymentInvoice(null);
    }
  };

  const openExpenseModal = () => {
    setExpenseDirty(false);
    setExpenseType('OpEx');
    setExpenseCategory('Software & Cloud');
    setExpenseDescription('');
    setExpenseAmount(0);
    setExpenseDate(getDateInputValue());
    setExpenseProjectId('');
    setExpenseRecurringInterval('none');
    setExpenseReceiptUrl('');
    setExpenseIdempotencyKey(
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `expense-${Date.now()}-${Math.random().toString(16).slice(2)}`
    );
    setExpenseModalOpen(true);
  };

  const openEditInvoice = (invoice: AgencyInvoice) => {
    setInvoiceDirty(false);
    setEditingInvoice(invoice);
    setInvoiceNumber(invoice.invoiceNumber);
    setClientId(String((invoice as AgencyInvoice & { clientId?: string }).clientId || ''));
    setProjectId(invoice.projectId || '');
    setClientName(invoice.clientName || '');
    setClientCompany(invoice.clientCompany || '');
    setClientEmail(invoice.clientEmail || '');
    setClientPhone(invoice.clientPhone || '');
    setInvoiceCurrency(invoice.currency);
    setInvoiceItems(invoice.items.length ? invoice.items.map((item) => ({ ...item })) : [emptyLineItem()]);
    setDiscountPercent(Number(invoice.discountPercent || 0));
    setTaxPercent(Number(invoice.taxPercent || 0));
    setInvoiceStatus(invoice.status);
    setIssueDate(invoice.issueDate || '');
    setDueDate(invoice.dueDate || '');
    setPaymentTerms(invoice.paymentTerms || '');
    setInvoiceNotes(invoice.notes || '');
    setInvoiceModalOpen(true);
  };

  const selectClient = (id: string) => {
    setInvoiceDirty(true);
    setClientId(id);
    const client = clients.find((item) => item.id === id);
    if (!client) return;
    setClientName(client.name);
    setClientCompany(client.company);
    setClientEmail(client.email);
    setClientPhone(client.phone);
  };

  const selectProject = (id: string) => {
    setInvoiceDirty(true);
    setProjectId(id);
    const project = projects.find((item) => item.id === id);
    if (!project) return;

    if (project.clientId) {
      const client = clients.find((item) => item.id === project.clientId);
      setClientId(project.clientId);
      setClientName(client?.name || project.clientName || '');
      setClientCompany(client?.company || project.clientCompany || '');
      setClientEmail(client?.email || project.clientEmail || '');
      setClientPhone(client?.phone || '');
      return;
    }

    setClientId('');
    if (!clientName) setClientName(project.clientName || '');
    if (!clientCompany) setClientCompany(project.clientCompany || '');
    if (!clientEmail) setClientEmail(project.clientEmail || '');
  };

  const updateLineItem = (index: number, patch: Partial<InvoiceLineItem>) => {
    setInvoiceDirty(true);
    setInvoiceItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const next = { ...item, ...patch };
      const quantity = Math.max(0, Number(next.quantity) || 0);
      const unitPrice = Math.max(0, Number(next.unitPrice) || 0);
      return { ...next, quantity, unitPrice, amount: Math.round(quantity * unitPrice) };
    }));
  };

  const handleSaveInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageInvoices || savingInvoice) return;

    const invalidLineItem = invoiceItems.some((item) => (
      !item.description.trim()
      || !Number.isFinite(Number(item.quantity))
      || Number(item.quantity) <= 0
      || !Number.isFinite(Number(item.unitPrice))
      || Number(item.unitPrice) < 0
    ));

    if (invalidLineItem) {
      showNotice('danger', language === 'id'
        ? 'Setiap line item harus memiliki deskripsi, jumlah valid, dan harga satuan yang valid.'
        : 'Every line item must have a description, a valid quantity, and a valid unit price.');
      return;
    }

    const validItems = invoiceItems.map((item, index) => ({
      ...item,
      slug: item.slug || slugifyFinance((invoiceNumber.trim() || clientCompany.trim() || 'invoice') + '-item-' + (index + 1)),
      description: item.description.trim(),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      amount: Math.round(Number(item.quantity) * Number(item.unitPrice))
    }));

    const numericTax = Number(taxPercent);
    const numericDiscount = Number(discountPercent);
    const parsedIssueDate = issueDate ? new Date(`${issueDate}T00:00:00`) : null;
    const parsedDueDate = dueDate ? new Date(`${dueDate}T00:00:00`) : null;

    if (!clientName.trim() || !clientCompany.trim() || validItems.length === 0) {
      showNotice('danger', language === 'id' ? 'Klien, perusahaan, dan minimal satu line item wajib diisi.' : 'Client, company, and at least one line item are required.');
      return;
    }

    if (!Number.isFinite(numericTax) || numericTax < 0 || numericTax > 100 || !Number.isFinite(numericDiscount) || numericDiscount < 0 || numericDiscount > 100) {
      showNotice('danger', language === 'id' ? 'Pajak dan diskon harus berada di antara 0% dan 100%.' : 'Tax and discount must be between 0% and 100%.');
      return;
    }

    if ((parsedIssueDate && Number.isNaN(parsedIssueDate.getTime())) || (parsedDueDate && Number.isNaN(parsedDueDate.getTime()))) {
      showNotice('danger', language === 'id' ? 'Tanggal invoice tidak valid.' : 'Invoice dates are invalid.');
      return;
    }

    if (parsedIssueDate && parsedDueDate && parsedDueDate < parsedIssueDate) {
      showNotice('danger', language === 'id' ? 'Tanggal jatuh tempo tidak boleh sebelum tanggal invoice.' : 'Due date cannot be earlier than the invoice date.');
      return;
    }

    setSavingInvoice(true);
    try {
      const payload = {
        slug: editingInvoice?.slug || slugifyFinance(invoiceNumber.trim() || clientCompany.trim() || ('invoice-' + Date.now())),
        invoiceNumber: invoiceNumber.trim() || undefined,
        clientId: clientId || undefined,
        clientName: clientName.trim(),
        clientCompany: clientCompany.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        projectId: projectId || undefined,
        items: validItems,
        taxPercent: Math.min(100, Math.max(0, Number(taxPercent) || 0)),
        discountPercent: Math.min(100, Math.max(0, Number(discountPercent) || 0)),
        currency: invoiceCurrency,
        status: invoiceStatus === 'partially_paid' || invoiceStatus === 'paid' || invoiceStatus === 'cancelled' ? (editingInvoice?.status || 'draft') : invoiceStatus,
        issueDate: issueDate || undefined,
        dueDate: dueDate || undefined,
        paymentTerms: paymentTerms.trim(),
        notes: invoiceNotes.trim(),
        updatedAt: editingInvoice?.updatedAt
      };


      if (usingDemoInvoices) {
        const now = new Date().toISOString();
        const localTotals = computeInvoiceTotals(validItems, numericTax, numericDiscount);
        const localInvoice: AgencyInvoice = {
          id: editingInvoice?.id || 'inv_slug_' + Date.now(),
          slug: editingInvoice?.slug || slugifyFinance(invoiceNumber.trim() || clientCompany.trim() || ('invoice-' + Date.now())),
          invoiceNumber: invoiceNumber.trim() || 'INV-SLUG-' + String(100 + invoices.length + 1),
          type: 'invoice',
          clientName: clientName.trim(),
          clientCompany: clientCompany.trim(),
          clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim(),
          projectId: projectId || undefined,
          items: validItems,
          subtotal: localTotals.subtotal,
          discountPercent: numericDiscount,
          discountAmount: localTotals.discountAmount,
          taxPercent: numericTax,
          taxAmount: localTotals.taxAmount,
          total: localTotals.total,
          amountPaid: editingInvoice?.amountPaid || 0,
          balanceDue: Math.max(0, localTotals.total - Number(editingInvoice?.amountPaid || 0)),
          payments: editingInvoice?.payments || [],
          currency: invoiceCurrency,
          status: invoiceStatus,
          issueDate: issueDate || new Date().toISOString().slice(0, 10),
          dueDate: dueDate || getDateInputValue(14),
          paidDate: editingInvoice?.paidDate,
          notes: invoiceNotes.trim(),
          paymentTerms: paymentTerms.trim(),
          createdAt: editingInvoice?.createdAt || now,
          updatedAt: now
        };
        const nextInvoices = editingInvoice
          ? invoices.map((invoice) => invoice.id === editingInvoice.id ? localInvoice : invoice)
          : [localInvoice, ...invoices];
        setInvoices(nextInvoices);
        syncDemoFinanceMetrics(nextInvoices, expenses);
        setInvoiceModalOpen(false);
        setInvoiceDirty(false);
        showNotice('success', editingInvoice ? 'Demo invoice updated.' : 'Demo invoice created.');
        return;
      }

      const result = editingInvoice
        ? await api.finance.updateInvoice(editingInvoice.id, payload)
        : await api.finance.createInvoice(payload);

      if (!result.success) {
        if (result.status === 409) {
          await loadData(true);
          throw new Error(language === 'id'
            ? 'Invoice tidak tersimpan karena state finansial berubah. Daftar terbaru sudah dimuat; periksa kembali draft ini sebelum mencoba lagi.'
            : 'The invoice was not saved because its financial state changed. The latest list is refreshed; review this draft before trying again.');
        }
        throw new Error(result.error || 'Invoice could not be saved.');
      }
      setInvoiceModalOpen(false);
      setInvoiceDirty(false);
      showNotice('success', language === 'id' ? 'Invoice berhasil disimpan.' : 'Invoice saved successfully.');
      await loadData(true);
    } catch (err) {
      showNotice('danger', err instanceof Error ? err.message : 'Invoice could not be saved.');
    } finally {
      setSavingInvoice(false);
    }
  };

  const updateInvoiceStatus = async (invoice: AgencyInvoice, nextStatus: InvoiceStatus) => {
    if (!canManageInvoices || updatingInvoiceId || invoice.status === nextStatus || nextStatus === 'cancelled') return;
    setUpdatingInvoiceId(invoice.id);
    try {
      if (usingDemoInvoices) {
        const nextInvoices = invoices.map((item) => item.id === invoice.id
          ? { ...item, status: nextStatus, updatedAt: new Date().toISOString(), paidDate: nextStatus === 'paid' ? getDateInputValue() : item.paidDate }
          : item);
        setInvoices(nextInvoices);
        syncDemoFinanceMetrics(nextInvoices, expenses);
        showNotice('success', 'Demo invoice status updated.');
        return;
      }

      const result = await api.finance.updateInvoice(invoice.id, { status: nextStatus, updatedAt: invoice.updatedAt });
      if (!result.success) {
        showNotice(
          'danger',
          result.status === 409
            ? (language === 'id' ? 'Status invoice berubah di server. Data terbaru dimuat ulang; coba lagi dari state terbaru.' : 'This invoice changed on the server. The latest data was reloaded; retry from the current state.')
            : (result.error || 'Invoice status could not be updated.')
        );
        if (result.status === 409) await loadData(true);
        return;
      }
      showNotice('success', language === 'id' ? 'Status invoice diperbarui.' : 'Invoice status updated.');
      await loadData(true);
    } catch (err) {
      showNotice('danger', err instanceof Error ? err.message : 'Invoice status could not be updated.');
    } finally {
      setUpdatingInvoiceId(null);
    }
  };

  const openPayment = (invoice: AgencyInvoice) => {
    setPaymentDirty(false);
    const balance = Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0)));
    setPaymentInvoice(invoice);
    setPaymentAmount(Math.max(0, balance));
    setPaymentMethod('bank_transfer');
    setPaymentReference('');
    setPaymentDate(getDateInputValue());
    setPaymentNotes('');
    setPaymentIdempotencyKey(
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `payment-${invoice.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`
    );
  };

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentInvoice || !canManageInvoices || savingPayment) return;
    const balance = Number(paymentInvoice.balanceDue ?? (paymentInvoice.total - (paymentInvoice.amountPaid || 0)));
    const amount = Number(paymentAmount);
    const normalizedPaymentDate = new Date(`${paymentDate}T00:00:00`);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (!Number.isFinite(amount) || amount <= 0 || amount > balance) {
      showNotice('danger', language === 'id' ? 'Nominal pembayaran harus lebih dari 0 dan tidak boleh melebihi sisa tagihan.' : 'Payment must be greater than 0 and cannot exceed the remaining balance.');
      return;
    }

    if (Number.isNaN(normalizedPaymentDate.getTime()) || normalizedPaymentDate > today) {
      showNotice('danger', language === 'id' ? 'Tanggal pembayaran tidak boleh kosong atau berada di masa depan.' : 'Payment date must be valid and cannot be in the future.');
      return;
    }

    setSavingPayment(true);
    try {
      if (usingDemoInvoices) {
        const nextAmountPaid = Math.min(Number(paymentInvoice.total), Number(paymentInvoice.amountPaid || 0) + amount);
        const nextBalance = Math.max(0, Number(paymentInvoice.total) - nextAmountPaid);
        const nextStatus: InvoiceStatus = nextBalance === 0 ? 'paid' : 'partially_paid';
        const paymentRecord = {
          id: 'payment_slug_' + Date.now(),
          slug: slugifyFinance((paymentInvoice.slug || paymentInvoice.invoiceNumber) + '-payment-' + Date.now()),
          amount,
          date: paymentDate,
          method: paymentMethod,
          reference: paymentReference.trim(),
          notes: paymentNotes.trim()
        };
        const nextInvoices = invoices.map((item) => item.id === paymentInvoice.id
          ? {
              ...item,
              amountPaid: nextAmountPaid,
              balanceDue: nextBalance,
              status: nextStatus,
              paidDate: nextBalance === 0 ? paymentDate : item.paidDate,
              payments: [...(item.payments || []), paymentRecord],
              updatedAt: new Date().toISOString()
            }
          : item);
        setInvoices(nextInvoices);
        syncDemoFinanceMetrics(nextInvoices, expenses);
        setPaymentInvoice(null);
        setPaymentIdempotencyKey('');
        setPaymentDirty(false);
        showNotice('success', 'Demo payment recorded.');
        return;
      }

      const result = await api.finance.payInvoice(paymentInvoice.id, {
        amount,
        date: paymentDate,
        method: paymentMethod,
        reference: paymentReference.trim(),
        notes: paymentNotes.trim(),
        idempotencyKey: paymentIdempotencyKey
      });
      if (!result.success) {
        if (result.status === 409) {
          await loadData(true);
          throw new Error(language === 'id'
            ? 'Pembayaran tidak dicatat karena saldo atau state invoice berubah. Data terbaru sudah dimuat; buka kembali pembayaran dari invoice terbaru.'
            : 'The payment was not recorded because the invoice balance or state changed. The latest data is refreshed; reopen payment from the current invoice.');
        }
        throw new Error(result.error || 'Payment could not be recorded.');
      }
      setPaymentInvoice(null);
      setPaymentIdempotencyKey('');
      setPaymentDirty(false);
      showNotice('success', result.data?.replayed
        ? (language === 'id' ? 'Pembayaran sebelumnya sudah tercatat; data disinkronkan.' : 'That payment was already recorded; the finance data has been synchronized.')
        : (language === 'id' ? 'Pembayaran berhasil dicatat.' : 'Payment recorded successfully.'));
      await loadData(true);
    } catch (err) {
      showNotice('danger', err instanceof Error ? err.message : 'Payment could not be recorded.');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSaveExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageInvoices || savingExpense) return;
    const amount = Number(expenseAmount);
    const normalizedExpenseDate = new Date(`${expenseDate}T00:00:00`);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (!expenseDescription.trim() || !Number.isFinite(amount) || amount <= 0) {
      showNotice('danger', language === 'id' ? 'Deskripsi dan nominal pengeluaran wajib diisi.' : 'Description and a valid expense amount are required.');
      return;
    }

    if (Number.isNaN(normalizedExpenseDate.getTime()) || normalizedExpenseDate > today) {
      showNotice('danger', language === 'id' ? 'Tanggal pengeluaran harus valid dan tidak boleh berada di masa depan.' : 'Expense date must be valid and cannot be in the future.');
      return;
    }

    setSavingExpense(true);
    try {
      if (usingDemoExpenses) {
        const localExpense: FinanceExpense = {
          id: 'exp_slug_' + Date.now(),
          slug: slugifyFinance(expenseDescription.trim() + '-' + expenseDate + '-' + Date.now()),
          type: expenseType,
          category: expenseCategory,
          description: expenseDescription.trim(),
          amount,
          date: expenseDate,
          currency,
          recordedBy: 'Fikri Nurlete',
          createdAt: new Date().toISOString(),
          version: 1
        };
        const nextExpenses = [localExpense, ...expenses];
        setExpenses(nextExpenses);
        syncDemoFinanceMetrics(invoices, nextExpenses);
        setExpenseModalOpen(false);
        setExpenseIdempotencyKey('');
        setExpenseDirty(false);
        setExpenseDescription('');
        setExpenseAmount(0);
        showNotice('success', 'Demo expense recorded.');
        return;
      }

      const result = await api.finance.createExpense({
        slug: slugifyFinance(expenseDescription.trim() + '-' + expenseDate),
        type: expenseType,
        category: expenseCategory,
        description: expenseDescription.trim(),
        amount,
        date: expenseDate,
        currency,
        projectId: expenseProjectId || undefined,
        recurringInterval: expenseRecurringInterval,
        receiptUrl: expenseReceiptUrl.trim(),
        idempotencyKey: expenseIdempotencyKey
      });
      if (!result.success) throw new Error(result.error || 'Expense could not be saved.');
      setExpenseModalOpen(false);
      setExpenseIdempotencyKey('');
      setExpenseDirty(false);
      setExpenseDescription('');
      setExpenseAmount(0);
      showNotice('success', language === 'id' ? 'Pengeluaran berhasil dicatat.' : 'Expense recorded successfully.');
      await loadData(true);
    } catch (err) {
      showNotice('danger', err instanceof Error ? err.message : 'Expense could not be saved.');
    } finally {
      setSavingExpense(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmAction || confirmingAction) return;
    setConfirmingAction(true);
    try {
      if ((confirmAction.type === 'invoice' && usingDemoInvoices) || (confirmAction.type === 'expense' && usingDemoExpenses)) {
        if (confirmAction.type === 'invoice') {
          const nextInvoices = invoices.map((item) => item.id === confirmAction.id ? { ...item, status: 'cancelled' as InvoiceStatus, updatedAt: new Date().toISOString() } : item);
          setInvoices(nextInvoices);
          syncDemoFinanceMetrics(nextInvoices, expenses);
          setDetailInvoice((current) => current?.id === confirmAction.id ? null : current);
          showNotice('success', 'Demo invoice cancelled.');
        } else {
          const nextExpenses = expenses.filter((item) => item.id !== confirmAction.id);
          setExpenses(nextExpenses);
          syncDemoFinanceMetrics(invoices, nextExpenses);
          showNotice('success', 'Demo expense voided.');
        }
        setConfirmAction(null);
        return;
      }

      const result = confirmAction.type === 'invoice'
        ? await api.finance.deleteInvoice(confirmAction.id)
        : await api.finance.deleteExpense(
            confirmAction.id,
            (expenses.find((expense) => expense.id === confirmAction.id) as FinanceExpense | undefined)?.version
          );

      if (!result.success) {
        if (result.status === 409) {
          await loadData(true);
        }
        showNotice(
          'danger',
          result.status === 409
            ? (language === 'id' ? 'Data finansial berubah di server. Data terbaru sudah dimuat; periksa kembali sebelum mencoba lagi.' : 'This financial record changed on the server. The latest data is refreshed; review it before trying again.')
            : (result.error || 'Action could not be completed.')
        );
      } else {
        showNotice('success', confirmAction.type === 'invoice'
          ? (language === 'id' ? 'Invoice dibatalkan.' : 'Invoice cancelled.')
          : (language === 'id' ? 'Pengeluaran dibatalkan.' : 'Expense voided.'));
        await loadData(true);
      }
      setConfirmAction(null);
    } catch (err) {
      showNotice('danger', err instanceof Error ? err.message : 'Action could not be completed.');
      setConfirmAction(null);
    } finally {
      setConfirmingAction(false);
    }
  };

  const openPrintPreview = (invoice: AgencyInvoice) => setDetailInvoice(invoice);

  const statusOptions = [
    { value: 'all', label: language === 'id' ? 'Semua status' : 'All statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'partially_paid', label: language === 'id' ? 'Sebagian dibayar' : 'Partially paid' },
    { value: 'paid', label: language === 'id' ? 'Lunas' : 'Paid' },
    { value: 'overdue', label: language === 'id' ? 'Jatuh tempo' : 'Overdue' },
    { value: 'cancelled', label: language === 'id' ? 'Dibatalkan' : 'Cancelled' }
  ];

  const sortOptions = [
    { value: 'updated', label: language === 'id' ? 'Terakhir diperbarui' : 'Recently updated' },
    { value: 'due', label: language === 'id' ? 'Jatuh tempo' : 'Due date' },
    { value: 'oldest', label: language === 'id' ? 'Terlama diperbarui' : 'Oldest updated' },
    { value: 'amount_high', label: language === 'id' ? 'Nominal tertinggi' : 'Highest amount' },
    { value: 'amount_low', label: language === 'id' ? 'Nominal terendah' : 'Lowest amount' },
    { value: 'invoice', label: language === 'id' ? 'Nomor invoice' : 'Invoice number' }
  ];

  const expenseTypeOptions = [
    { value: 'all', label: language === 'id' ? 'Semua tipe' : 'All types' },
    { value: 'OpEx', label: 'OpEx' },
    { value: 'CapEx', label: 'CapEx' },
    { value: 'Rentals', label: 'Rentals' }
  ];

  const expenseCategoryOptions = [
    { value: 'all', label: language === 'id' ? 'Semua kategori' : 'All categories' },
    ...['Software & Cloud', 'Salaries & Contractors', 'Office & Hardware', 'Office & Rentals', 'Marketing & Ads', 'Legal & Admin', 'CapEx Equipment']
      .map((value) => ({ value, label: value }))
  ];

  const expensePeriodOptions = [
    { value: 'all', label: language === 'id' ? 'Semua periode' : 'All periods' },
    { value: '30d', label: language === 'id' ? '30 hari terakhir' : 'Last 30 days' },
    { value: '90d', label: language === 'id' ? '90 hari terakhir' : 'Last 90 days' },
    { value: 'ytd', label: 'YTD' }
  ];

  const agingBuckets = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = [
      { label: 'Current', tone: 'success' as const, amount: 0, count: 0 },
      { label: '1–30 Days overdue', tone: 'warning' as const, amount: 0, count: 0 },
      { label: '31–60 Days overdue', tone: 'warning' as const, amount: 0, count: 0 },
      { label: '61–90 Days overdue', tone: 'danger' as const, amount: 0, count: 0 },
      { label: '90+ Days overdue', tone: 'danger' as const, amount: 0, count: 0 }
    ];

    currencyInvoices.forEach((invoice) => {
      const balance = Math.max(0, Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0))));
      if (balance <= 0) return;

      const due = new Date(String(invoice.dueDate) + 'T00:00:00');
      const daysSinceDue = Number.isNaN(due.getTime())
        ? 0
        : Math.floor((today.getTime() - due.getTime()) / 86400000);

      const bucket = daysSinceDue <= 0
        ? buckets[0]
        : daysSinceDue <= 30
          ? buckets[1]
          : daysSinceDue <= 60
            ? buckets[2]
            : daysSinceDue <= 90
              ? buckets[3]
              : buckets[4];
      bucket.amount += balance;
      bucket.count += 1;
    });

    const total = buckets.reduce((sum, bucket) => sum + bucket.amount, 0);
    return buckets.map((bucket) => ({
      ...bucket,
      percent: total > 0 ? Math.round((bucket.amount / total) * 1000) / 10 : 0
    }));
  }, [currencyInvoices]);

  const overdueBalance = useMemo(
    () => currencyInvoices
      .filter(isPastDueInvoice)
      .reduce((sum, invoice) => sum + Math.max(0, Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0)))), 0),
    [currencyInvoices]
  );

  const previousQuarter = useMemo(() => getPreviousQuarter(reportingQuarter), [reportingQuarter]);

  const previousQuarterTotal = useMemo(
    () => currencyInvoices
      .filter((invoice) => isInQuarter(invoice.issueDate, previousQuarter))
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
    [currencyInvoices, previousQuarter]
  );

  const currentQuarterTotal = useMemo(
    () => quarterInvoices
      .filter((invoice) => invoice.status !== 'cancelled')
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
    [quarterInvoices]
  );

  const quarterChangePercent = previousQuarterTotal > 0
    ? ((currentQuarterTotal - previousQuarterTotal) / previousQuarterTotal) * 100
    : null;

  const pendingInvoiceCount = useMemo(
    () => currencyInvoices.filter((invoice) => {
      const balance = Math.max(0, Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0))));
      return invoice.status !== 'paid' && invoice.status !== 'cancelled' && balance > 0;
    }).length,
    [currencyInvoices]
  );

  const criticalOverdueCount = useMemo(
    () => currencyInvoices.filter((invoice) => isPastDueInvoice(invoice) && getDaysUntilDue(invoice.dueDate) < -60).length,
    [currencyInvoices]
  );

  const overdueInvoiceCount = useMemo(
    () => currencyInvoices.filter(isPastDueInvoice).length,
    [currencyInvoices]
  );

  const operatingMarginValue = serverMetrics ? Number.parseFloat(serverMetrics.profitMargin) : NaN;
  const operatingMarginHealthy = Number.isFinite(operatingMarginValue) && operatingMarginValue >= 35;

  const openVendorPaymentModal = (record?: VendorPaymentRecord) => {
    const vendor = record?.vendor || vendors.find((item) => item.contracts.some((contract) => contract.currency === currency)) || vendors[0];
    const contract = record?.contract || vendor?.contracts.find((item) => item.status === 'active' && item.currency === currency) || vendor?.contracts.find((item) => item.currency === currency);
    setVendorPaymentVendorId(vendor?.id || '');
    setVendorPaymentContractId(contract?.id || '');
    setVendorPaymentAmount(record ? Math.max(0, record.amount - record.paidAmount) : Number(contract?.rateAmount || 0));
    setVendorPaymentDate(getDateInputValue());
    setVendorPaymentReference('');
    setVendorPaymentNotes('');
    setVendorPaymentIdempotencyKey(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'vendor-payment-' + Date.now());
    setVendorPaymentDetail(null);
    setVendorPaymentModalOpen(true);
  };

  const selectedVendorForPayment = vendors.find((vendor) => vendor.id === vendorPaymentVendorId) || null;
  const selectedVendorContracts = selectedVendorForPayment?.contracts.filter((contract) => contract.status !== 'terminated' && contract.currency === currency) || [];

  const handleSaveVendorPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageInvoices || savingVendorPayment) return;
    const vendor = vendors.find((item) => item.id === vendorPaymentVendorId);
    const contract = vendor?.contracts.find((item) => item.id === vendorPaymentContractId);
    const amount = Number(vendorPaymentAmount);
    const normalizedDate = new Date(vendorPaymentDate + 'T00:00:00');

    if (!vendor || !contract) {
      showNotice('danger', 'Select a vendor and contract.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      showNotice('danger', 'Enter a valid payment amount.');
      return;
    }
    if (Number.isNaN(normalizedDate.getTime()) || normalizedDate > new Date()) {
      showNotice('danger', 'Payment date must be valid and cannot be in the future.');
      return;
    }

    setSavingVendorPayment(true);
    try {
      const cleanReference = vendorPaymentReference.trim().replace(/[|]/g, '/');
      const cleanNotes = vendorPaymentNotes.trim().replace(/[|]/g, '/');
      const cleanTitle = contract.title.replace(/[|]/g, '/');
      const description = VENDOR_PAYMENT_MARKER + '|' + vendor.id + '|' + contract.id + '|' + cleanTitle + '|REF:' + cleanReference + '|NOTE:' + cleanNotes;
      const result = await api.finance.createExpense({
        type: 'OpEx',
        category: 'Salaries & Contractors',
        description,
        amount,
        date: vendorPaymentDate,
        currency,
        idempotencyKey: vendorPaymentIdempotencyKey
      });
      if (!result.success) throw new Error(result.error || 'Vendor payment could not be recorded.');
      setVendorPaymentModalOpen(false);
      setVendorPaymentIdempotencyKey('');
      showNotice('success', language === 'id' ? 'Vendor payment berhasil dicatat.' : 'Vendor payment recorded successfully.');
      await loadData(true);
    } catch (err) {
      showNotice('danger', err instanceof Error ? err.message : 'Vendor payment could not be recorded.');
    } finally {
      setSavingVendorPayment(false);
    }
  };

  const exportVendorPaymentsCsv = () => {
    const csv = [
      ['Vendor', 'Company', 'Contract', 'Due date', 'Amount', 'Paid', 'Outstanding', 'Status'],
      ...filteredVendorPayments.map((row) => [
        row.vendor.name, row.vendor.companyName || '', row.contract.title, row.dueDate, row.amount, row.paidAmount,
        Math.max(0, row.amount - row.paidAmount), vendorPaymentStatusLabel[row.status]
      ])
    ].map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kapitech-vendor-payments.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotice('success', language === 'id' ? 'Vendor payment CSV berhasil diekspor.' : 'Vendor payment CSV exported successfully.');
  };

  const getQuotationStatusOptions = (status: FinanceQuotationStatus) => {
    const options: Array<{ value: FinanceQuotationStatus; label: string }> = [
      { value: status, label: quotationStatusLabel(status) }
    ];
    if (status === 'draft') options.push({ value: 'review', label: 'Internal Review' });
    if (status === 'review') options.push(
      { value: 'draft', label: 'Draft' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' }
    );
    if (status === 'approved') options.push(
      { value: 'review', label: 'Internal Review' },
      { value: 'sent', label: 'Sent' },
      { value: 'rejected', label: 'Rejected' }
    );
    if (status === 'sent') options.push(
      { value: 'approved', label: 'Approved' },
      { value: 'accepted', label: 'Accepted' },
      { value: 'rejected', label: 'Rejected' }
    );
    if (status === 'accepted') options.push({ value: 'sent', label: 'Sent' });
    if (status === 'rejected') options.push({ value: 'review', label: 'Internal Review' });
    return options;
  };

  const quotationStatusLabel = (status: FinanceQuotationStatus) => {
    const labels: Record<FinanceQuotationStatus, string> = {
      draft: 'Draft',
      review: 'Internal Review',
      approved: 'Approved',
      sent: 'Sent',
      accepted: 'Accepted',
      rejected: 'Rejected'
    };
    return labels[status];
  };

  const filteredQuotations = useMemo(() => {
    const query = quotationSearch.trim().toLowerCase();
    return quotations
      .filter((quotation) => {
        const searchable = [quotation.quotationNumber, quotation.title, quotation.clientName, quotation.clientCompany, quotation.owner].join(' ').toLowerCase();
        return (!query || searchable.includes(query)) && (quotationStatusFilter === 'all' || quotation.status === quotationStatusFilter);
      })
      .sort((a,b) => quotationSort === 'oldest'
        ? String(a.createdAt).localeCompare(String(b.createdAt))
        : quotationSort === 'value_high'
          ? b.total - a.total
          : quotationSort === 'value_low'
            ? a.total - b.total
            : quotationSort === 'valid_until'
              ? String(a.validUntil).localeCompare(String(b.validUntil))
              : String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [quotations, quotationSearch, quotationStatusFilter, quotationSort]);

  const quotationPageCount = Math.max(1, Math.ceil(filteredQuotations.length / quotationPageSize));
  const paginatedQuotations = filteredQuotations.slice((quotationPage - 1) * quotationPageSize, quotationPage * quotationPageSize);
  useEffect(() => { setQuotationPage((page) => Math.min(page, quotationPageCount)); }, [quotationPageCount]);

  const quotationMetrics = useMemo(() => ({
    total: quotations.length,
    active: quotations.filter((quotation) => ['draft', 'review', 'approved', 'sent'].includes(quotation.status)).length,
    approved: quotations.filter((quotation) => quotation.status === 'approved' && !quotation.invoiceId).length,
    accepted: quotations.filter((quotation) => quotation.status === 'accepted').length,
    expiring: quotations.filter((quotation) => ['draft', 'review', 'approved', 'sent'].includes(quotation.status) && getDaysUntilDue(quotation.validUntil) >= 0 && getDaysUntilDue(quotation.validUntil) <= 7).length,
    value: quotations.filter((quotation) => quotation.status !== 'rejected').reduce((sum, quotation) => sum + quotation.total, 0)
  }), [quotations]);

  const quotationPreviewTotals = useMemo(
    () => computeInvoiceTotals(quotationItems, Number(quotationTaxPercent) || 0, Number(quotationDiscountPercent) || 0),
    [quotationItems, quotationTaxPercent, quotationDiscountPercent]
  );

  const updateQuotationItem = (index: number, patch: Partial<InvoiceLineItem>) => {
    setQuotationItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const next = { ...item, ...patch };
      return { ...next, amount: Math.max(0, Number(next.quantity) || 0) * Math.max(0, Number(next.unitPrice) || 0) };
    }));
  };

  const addQuotationItem = () => setQuotationItems((current) => [...current, emptyLineItem()]);
  const removeQuotationItem = (index: number) => setQuotationItems((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current);

  const resetQuotationForm = () => {
    setEditingQuotation(null);
    setQuotationTitle('');
    setQuotationClientName('');
    setQuotationClientCompany('');
    setQuotationAmount(0);
    setQuotationItems([emptyLineItem()]);
    setQuotationDiscountPercent(0);
    setQuotationTaxPercent(11);
    setQuotationValidUntil(getDateInputValue(30));
    setQuotationPaymentTerms('Bank Transfer Net 14');
    setQuotationNotes('');
    setQuotationStatus('draft');
  };

  const openCreateQuotation = () => {
    resetQuotationForm();
    setQuotationModalOpen(true);
  };

  const openEditQuotation = (quotation: FinanceQuotation) => {
    setEditingQuotation(quotation);
    setQuotationTitle(quotation.title);
    setQuotationClientName(quotation.clientName);
    setQuotationClientCompany(quotation.clientCompany);
    setQuotationAmount(quotation.total);
    setQuotationItems(quotation.items?.length ? quotation.items.map((item) => ({ ...item })) : [{ ...emptyLineItem(), description: quotation.title, unitPrice: quotation.total, amount: quotation.total }]);
    setQuotationDiscountPercent(Number(quotation.discountPercent || 0));
    setQuotationTaxPercent(Number(quotation.taxPercent || 11));
    setQuotationValidUntil(quotation.validUntil);
    setQuotationPaymentTerms(quotation.paymentTerms || 'Bank Transfer Net 14');
    setQuotationNotes(quotation.notes || '');
    setQuotationStatus(quotation.status);
    setQuotationModalOpen(true);
  };

  const saveQuotation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageInvoices || quotationSaving) return;

    const validQuotationItems = quotationItems
      .map((item) => ({ ...item, description: item.description.trim(), quantity: Number(item.quantity) || 0, unitPrice: Number(item.unitPrice) || 0, amount: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) }))
      .filter((item) => item.description && item.quantity > 0 && item.unitPrice > 0);

    if (!quotationTitle.trim() || !quotationClientName.trim() || !quotationClientCompany.trim() || validQuotationItems.length === 0) {
      showNotice('danger', language === 'id'
        ? 'Judul, klien, perusahaan, dan nominal quotation wajib diisi.'
        : 'Quotation title, client, company, and a valid amount are required.');
      return;
    }

    if (editingQuotation && quotationStatus !== editingQuotation.status && !getQuotationStatusOptions(editingQuotation.status).some((option) => option.value === quotationStatus)) {
      showNotice('danger', language === 'id' ? 'Perubahan status quotation tidak mengikuti alur approval.' : 'That quotation status change is not allowed by the approval workflow.');
      return;
    }

    setQuotationSaving(true);
    const quotationSlug = editingQuotation?.slug || slugifyFinance(quotationClientCompany.trim() + '-' + quotationTitle.trim());
    const payload = {
      slug: quotationSlug,
      title: quotationTitle.trim(),
      clientName: quotationClientName.trim(),
      company: quotationClientCompany.trim(),
      currency,
      validityPeriod: quotationValidUntil,
      taxPercent: Math.min(100, Math.max(0, Number(quotationTaxPercent) || 0)),
      discount: Math.round(Number(quotationPreviewTotals.discountAmount) || 0),
      paymentTerms: quotationPaymentTerms.trim(),
      notes: quotationNotes.trim(),
      items: validQuotationItems.map((item, index) => ({
        id: item.id || 'quotation-item-' + Date.now() + '-' + index,
        slug: item.slug || slugifyFinance(quotationSlug + '-' + item.description + '-' + index),
        description: item.description,
        quantity: item.quantity,
        unitPrice: Math.round(item.unitPrice),
        amount: Math.round(item.amount)
      })),
      ...(editingQuotation ? { status: quotationStatusLabel(quotationStatus) } : {})
    };

    try {
      if (usingDemoQuotations) {
        const now = new Date().toISOString();
        const localQuotation: FinanceQuotation = {
          id: editingQuotation?.id || 'quote_slug_' + Date.now(),
          slug: editingQuotation?.slug || slugifyFinance(quotationClientCompany.trim() + '-' + quotationTitle.trim()),
          quotationNumber: editingQuotation?.quotationNumber || 'QTN-2026-' + String(100 + quotations.length + 1).padStart(3, '0'),
          title: quotationTitle.trim(),
          clientName: quotationClientName.trim(),
          clientCompany: quotationClientCompany.trim(),
          total: Math.round(quotationPreviewTotals.total),
          currency,
          status: quotationStatus,
          validUntil: quotationValidUntil,
          createdAt: editingQuotation?.createdAt || now.slice(0, 10),
          owner: editingQuotation?.owner || 'Fikri Nurlete',
          invoiceId: editingQuotation?.invoiceId,
          items: validQuotationItems,
          discountPercent: Number(quotationDiscountPercent) || 0,
          taxPercent: Number(quotationTaxPercent) || 0,
          paymentTerms: quotationPaymentTerms.trim(),
          notes: quotationNotes.trim()
        };
        setQuotations((current) => editingQuotation
          ? current.map((item) => item.id === editingQuotation.id ? localQuotation : item)
          : [localQuotation, ...current]);
        setQuotationModalOpen(false);
        resetQuotationForm();
        showNotice('success', editingQuotation ? 'Quotation updated.' : 'Quotation created.');
        return;
      }

      const response = editingQuotation
        ? await api.proposals.update(editingQuotation.id, payload)
        : await api.proposals.create(payload);

      if (!response.success || !response.data?.proposal) {
        throw new Error(response.error || 'Quotation could not be saved.');
      }

      const normalized = normalizeFinanceQuotation(response.data.proposal);
      setQuotations((current) => editingQuotation
        ? current.map((item) => item.id === normalized.id ? normalized : item)
        : [normalized, ...current]);
      setQuotationModalOpen(false);
      resetQuotationForm();
      showNotice('success', editingQuotation ? 'Quotation updated.' : 'Quotation created.');
    } catch (err) {
      showNotice('danger', err instanceof Error ? err.message : 'Quotation could not be saved.');
    } finally {
      setQuotationSaving(false);
    }
  };

  const updateQuotationStatus = async (quotation: FinanceQuotation, status: FinanceQuotationStatus) => {
    if (!canManageInvoices || quotation.status === status) return;

    if (usingDemoQuotations) {
      const updatedQuotation = { ...quotation, status };
      setQuotations((current) => current.map((item) => item.id === quotation.id ? updatedQuotation : item));
      setQuotationDetail((current) => current?.id === quotation.id ? updatedQuotation : current);
      showNotice('success', 'Quotation status updated.');
      return;
    }

    try {
      const response = await api.proposals.update(quotation.id, { status: quotationStatusLabel(status) });
      if (!response.success || !response.data?.proposal) throw new Error(response.error || 'Quotation status could not be updated.');
      const normalized = normalizeFinanceQuotation(response.data.proposal);
      setQuotations((current) => current.map((item) => item.id === normalized.id ? normalized : item));
      setQuotationDetail((current) => current?.id === normalized.id ? normalized : current);
      showNotice('success', 'Quotation status updated.');
    } catch (err) {
      showNotice('danger', err instanceof Error ? err.message : 'Quotation status could not be updated.');
    }
  };

  const deleteQuotation = async (quotation: FinanceQuotation) => {
    if (!canManageInvoices) return;

    if (usingDemoQuotations) {
      setQuotations((current) => current.filter((item) => item.id !== quotation.id));
      if (quotationDetail?.id === quotation.id) setQuotationDetail(null);
      showNotice('success', 'Quotation removed from the demo workspace.');
      return;
    }

    try {
      const response = await api.proposals.delete(quotation.id);
      if (!response.success) throw new Error(response.error || 'Quotation could not be deleted.');
      setQuotations((current) => current.filter((item) => item.id !== quotation.id));
      if (quotationDetail?.id === quotation.id) setQuotationDetail(null);
      showNotice('success', 'Quotation deleted.');
    } catch (err) {
      showNotice('danger', err instanceof Error ? err.message : 'Quotation could not be deleted.');
    }
  };

  const convertQuotationToInvoice = async (quotation: FinanceQuotation) => {
    if (!canManageInvoices || quotation.invoiceId || quotation.status !== 'approved') return;

    if (usingDemoQuotations) {
      const updatedQuotation = { ...quotation, status: 'accepted' as FinanceQuotationStatus, invoiceId: 'slug-inv-' + Date.now() };
      setQuotations((current) => current.map((item) => item.id === quotation.id ? updatedQuotation : item));
      setQuotationDetail((current) => current?.id === quotation.id ? updatedQuotation : current);
      showNotice('success', 'Approved quotation converted to a demo invoice reference.');
      return;
    }

    try {
      const response = await api.proposals.convertToInvoice(quotation.id);
      if (!response.success || !response.data?.invoice) {
        throw new Error(response.error || 'Quotation could not be converted to an invoice.');
      }
      const updatedQuotation = { ...quotation, status: 'accepted' as FinanceQuotationStatus, invoiceId: response.data?.invoice?.id || quotation.invoiceId };
      setQuotations((current) => current.map((item) => item.id === quotation.id ? updatedQuotation : item));
      setQuotationDetail((current) => current?.id === quotation.id ? updatedQuotation : current);
      await loadData(true);
      showNotice('success', 'Quotation converted to invoice ' + response.data.invoice.invoiceNumber + '.');
    } catch (err) {
      showNotice('danger', err instanceof Error ? err.message : 'Quotation could not be converted to an invoice.');
    }
  };

  const exportQuotationsCsv = () => {
    const rows = filteredQuotations.map((quotation) => [
      quotation.quotationNumber,
      quotation.title,
      quotation.clientCompany,
      quotation.clientName,
      quotation.currency,
      quotation.total,
      quotation.status,
      quotation.validUntil,
      quotation.owner
    ]);
    const csv = [['Quotation #', 'Title', 'Company', 'Contact', 'Currency', 'Total', 'Status', 'Valid Until', 'Owner'], ...rows]
      .map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kapitech-finance-quotations.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotice('success', language === 'id' ? 'CSV quotation berhasil diekspor.' : 'Quotation CSV exported successfully.');
  };

  const exportTaxCsv = () => {
    const headers = ['Invoice #', 'Client', 'Issue Date', 'Currency', 'Taxable Base', 'Tax Rate', 'Tax Provision', 'Tax Collected'];
    const rows = currencyInvoices
      .filter((invoice) => invoice.status !== 'cancelled')
      .map((invoice) => {
        const paidRatio = invoice.total > 0 ? Math.min(1, getInvoiceCollectedTotal(invoice) / Number(invoice.total)) : 0;
        return [
          invoice.invoiceNumber,
          invoice.clientCompany || invoice.clientName,
          invoice.issueDate,
          invoice.currency,
          invoice.subtotal,
          invoice.taxPercent,
          invoice.taxAmount,
          Number(invoice.taxAmount || 0) * paidRatio
        ];
      });
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kapitech-finance-tax.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotice('success', language === 'id' ? 'CSV pajak berhasil diekspor.' : 'Tax CSV exported successfully.');
  };

  const exportReportCsv = () => {
    const rows = financeChartData.map((point) => [point.label, point.inflow, point.outflow, point.net, point.retainerTarget]);
    const csv = [['Period', 'Billing Inflow', 'Operational Burn', 'Net Inflow', 'Retainer Target'], ...rows]
      .map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kapitech-finance-report.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotice('success', language === 'id' ? 'Laporan finansial berhasil diekspor.' : 'Financial report CSV exported successfully.');
  };

  const exportExpensesCsv = () => {
    const headers = ['Expense', 'Type', 'Category', 'Project', 'Date', 'Currency', 'Amount', 'Recurring', 'Receipt'];
    const rows = filteredExpenses.map((expense) => [
      expense.description,
      expense.type || 'OpEx',
      expense.category,
      projectsById.get(expense.projectId || '')?.name || '',
      expense.date,
      expense.currency || currency,
      expense.amount,
      expense.recurringInterval || 'none',
      expense.receiptUrl || ''
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kapitech-finance-expenses.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotice('success', language === 'id' ? 'CSV expense berhasil diekspor.' : 'Expense CSV exported successfully.');
  };

  const exportInvoicesCsv = () => {
    const headers = ['Invoice #', 'Client', 'Project', 'Issue Date', 'Due Date', 'Currency', 'Total', 'Balance Due', 'Status'];
    const rows = filteredInvoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.clientCompany || invoice.clientName,
      projectsById.get(invoice.projectId)?.name || '',
      invoice.issueDate,
      invoice.dueDate,
      invoice.currency,
      invoice.total,
      Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0))),
      invoice.status
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kapitech-finance-invoices.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotice('success', language === 'id' ? 'CSV invoice berhasil diekspor.' : 'Invoice CSV exported successfully.');
  };

  if (!canViewFinancials) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <section className="w-full max-w-xl rounded-card border border-line bg-panel p-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-control border border-danger/30 bg-danger/10 text-danger">
            <ShieldCheck size={22} />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-fg">{language === 'id' ? 'Akses finansial terbatas' : 'Financial access restricted'}</h1>
          <p className="mt-2 text-xs leading-5 text-muted">
            {language === 'id' ? 'Akun Anda tidak memiliki izin untuk melihat data Finance & Invoicing.' : 'Your account does not have permission to view Finance & Invoicing data.'}
          </p>
        </section>
      </div>
    );
  }

  return (
    <AdminPageShell featureSlug="finance-module" className="finance-module">
      <div className="min-[900px]:hidden min-w-0">
        <AdminSectionTabs
          ariaLabel="Finance sections"
          activeKey={financeView === 'invoices' ? 'invoices' : financeView}
          items={[
            { key: 'invoices', label: 'Invoice', to: '/admin/invoicing' },
            { key: 'quotations', label: 'Quotation', to: '/admin/invoicing?finance=quotations' },
            { key: 'income-expenses', label: 'Income & Expenses', to: '/admin/invoicing?finance=income-expenses' },
            { key: 'tax-retainers', label: 'Tax & Retainers', to: '/admin/invoicing?finance=tax-retainers' },
            { key: 'vendor-payments', label: 'Vendor Payments', to: '/admin/invoicing?finance=vendor-payments' },
            { key: 'financial-reports', label: 'Financial Reports', to: '/admin/invoicing?finance=financial-reports' },
          ]}
        />
      </div>
      <AdminModuleHeader
        className="mb-0"
        title={financeView === 'quotations' ? 'Quotations' : financeView === 'income-expenses' ? 'Income & Expenses' : financeView === 'tax-retainers' ? 'Tax & Retainers' : financeView === 'vendor-payments' ? 'Vendor Payments' : financeView === 'financial-reports' ? 'Financial Reports' : 'Invoices'}
        description={financeView === 'quotations'
          ? 'Manage the commercial pipeline from draft through approval, acceptance, and invoice conversion.'
          : financeView === 'income-expenses'
            ? 'Track actual cash collections, operating expenses, and net cash movement.'
            : financeView === 'tax-retainers'
              ? 'Monitor tax provision, tax collection, and retainer billing and collection.'
              : financeView === 'financial-reports'
                ? 'Review collection performance, margin, expense mix, and financial trends.'
                : financeView === 'vendor-payments'
                  ? 'Schedule, review, record, and reconcile payments owed to agency vendors and contractors.'
                  : 'Manage billing, receivables, collection risk, and invoice activity.'}
        actions={(
          <>
            {(usingDemoFinance || (financeView === 'quotations' && usingDemoQuotations)) && (
              <AdminStatusBadge tone="warning">A/B data</AdminStatusBadge>
            )}
            <div className="inline-flex min-h-9 items-center rounded-control border border-line bg-panel p-1" aria-label="Finance currency">
              {(['IDR', 'USD'] as CurrencyCode[]).map((item) => <button key={item} type="button" onClick={() => setActiveCurrency(item)} aria-pressed={currency === item} className={'min-h-7 rounded-chip px-2.5 text-[11px] font-semibold ' + (currency === item ? 'bg-accent/10 text-fg border border-accent/25' : 'text-muted hover:bg-bg hover:text-fg border border-transparent')}>{item}</button>)}
            </div>
            <button type="button" onClick={() => void loadData(true)} disabled={refreshing} className={actionClass} title="Refresh finance data"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Refreshing' : 'Refresh'}</button>
            {financeView === 'quotations' ? (
              <>
                <button type="button" onClick={exportQuotationsCsv} disabled={!filteredQuotations.length} className={actionClass}><Download size={14}/>Export CSV</button>
                {canManageInvoices && <button type="button" onClick={openCreateQuotation} className={primaryClass}><Plus size={14}/>New quotation</button>}
              </>
            ) : financeView === 'income-expenses' ? (
              <>
                <button type="button" onClick={() => incomeExpenseMode === 'income' ? exportInvoicesCsv() : exportExpensesCsv()} disabled={incomeExpenseMode === 'income' ? !incomeRows.length : !filteredExpenses.length} className={actionClass}><Download size={14}/>Export CSV</button>
                {canManageInvoices && <button type="button" onClick={openExpenseModal} className={primaryClass}><Plus size={14}/>Add expense</button>}
              </>
            ) : financeView === 'tax-retainers' ? (
              <>
                <button type="button" onClick={exportTaxCsv} disabled={!currencyInvoices.length} className={actionClass}><Download size={14}/>Export tax detail</button>
                {canManageInvoices && <button type="button" onClick={openCreateInvoice} className={primaryClass}><Plus size={14}/>New invoice</button>}
              </>
            ) : financeView === 'vendor-payments' ? (
              <>
                <button type="button" onClick={exportVendorPaymentsCsv} disabled={!filteredVendorPayments.length} className={actionClass}><Download size={14}/>Export CSV</button>
                {canManageInvoices && <button type="button" onClick={() => openVendorPaymentModal()} className={primaryClass}><Plus size={14}/>Record payment</button>}
              </>
            ) : financeView === 'financial-reports' ? (
              <button type="button" onClick={exportReportCsv} disabled={!financeChartData.length} className={actionClass}><Download size={14}/>Export report</button>
            ) : (
              <>
                <button type="button" onClick={exportInvoicesCsv} disabled={!currencyInvoices.length} className={actionClass}><Download size={14}/>Export CSV</button>
                {canManageInvoices && <>
                  <button type="button" onClick={openCreateQuotation} className={actionClass}><FileText size={14}/>New quotation</button>
                  <button type="button" onClick={openCreateInvoice} className={primaryClass}><Plus size={14}/>New invoice</button>
                </>}
              </>
            )}
          </>
        )}
      />
      {notice && (
        <div className="fixed right-4 top-[68px] z-[60] w-[min(420px,calc(100vw-32px))]" aria-live="polite" aria-atomic="true">
          <div className={'flex items-start gap-3 rounded-card border px-5 py-3 text-xs ' + (notice.tone === 'success' ? 'border-success/30 bg-panel text-success' : 'border-danger/30 bg-panel text-danger')} role="status">
            <span className="mt-0.5 shrink-0">{notice.tone === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}</span>
            <span className="min-w-0 flex-1 leading-5 text-fg">{notice.message}</span>
            <button type="button" onClick={dismissNotice} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label="Dismiss notification" title="Dismiss notification"><X size={14} /></button>
          </div>
        </div>
      )}

      {error && (
        <section className="mb-6 flex flex-col gap-3 rounded-card border border-danger/40 bg-danger/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p className="text-xs leading-5 text-fg">{error}</p>
          <button type="button" onClick={() => void loadData(true)} className={actionClass}>Retry</button>
        </section>
      )}

      {(loading || (financeView === 'quotations' && quotationLoading)) ? (
        <div className="space-y-5" aria-label="Loading finance">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[82px] animate-pulse rounded-card border border-line bg-panel" />)}</div>
          <div className="grid gap-5 xl:grid-cols-3"><div className="h-80 animate-pulse rounded-card border border-line bg-panel xl:col-span-2"/><div className="h-80 animate-pulse rounded-card border border-line bg-panel"/></div>
          <div className="h-72 animate-pulse rounded-card border border-line bg-panel"/>
        </div>
      ) : financeView === 'quotations' ? (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><FinanceMetricCard label="Total quotations" value={quotationMetrics.total} context="All records" sparkline={[quotationMetrics.total, quotationMetrics.active, quotationMetrics.accepted, quotationMetrics.expiring]} icon={<FileText size={15}/>}/><FinanceMetricCard label="Active pipeline" value={quotationMetrics.active} context="Draft through sent" sparkline={[quotationMetrics.total, quotationMetrics.active, quotationMetrics.accepted, quotationMetrics.expiring]} icon={<Clock3 size={15}/>}/><FinanceMetricCard label="Pipeline value" value={formatFinanceCardAmount(quotationMetrics.value,currency)} context={usingDemoQuotations?'Demo workspace data':'Server-backed records'} sparkline={filteredQuotations.length ? filteredQuotations.slice(0, 8).map((quotation) => quotation.total) : [quotationMetrics.value]} icon={<WalletCards size={15} />}/><FinanceMetricCard label="Accepted" value={quotationMetrics.accepted} context={quotationMetrics.approved+' approved ready to convert'} sparkline={[quotationMetrics.active, quotationMetrics.approved, quotationMetrics.accepted]} icon={<CheckCircle2 size={15} className="text-success"/>} toneClassName="text-success"/></section>
          <section className="space-y-5">
            <section className="rounded-card border border-line bg-panel overflow-hidden">
  <div className="border-b border-line bg-panel p-4 sm:px-5">
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-fg">Quotation ledger</h2>
          <p className="mt-1 text-xs text-muted">Search, filter, and sort the commercial pipeline.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] font-medium text-muted">
            {filteredQuotations.length} visible
          </span>
          {canManageInvoices && (
            <button type="button" onClick={openCreateQuotation} className={primaryClass}>
              <Plus size={14}/>New quotation
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-2 lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]">
        <label className="relative min-w-0">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <span className="sr-only">Search quotations</span>
          <input value={quotationSearch} onChange={(event)=>setQuotationSearch(event.target.value)} placeholder="Search quotation, client..." className={fieldClass+' h-10 pl-9'}/>
        </label>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(170px,1fr)_minmax(160px,1fr)]">
          <CustomSelect value={quotationStatusFilter} onChange={(value)=>setQuotationStatusFilter(value as typeof quotationStatusFilter)} options={[{value:'all',label:'All statuses'},{value:'draft',label:'Draft'},{value:'review',label:'Internal review'},{value:'approved',label:'Approved'},{value:'sent',label:'Sent'},{value:'accepted',label:'Accepted'},{value:'rejected',label:'Rejected'}]} className="min-w-0" triggerClassName="h-10 min-h-10 w-full whitespace-nowrap" aria-label="Quotation status filter"/>
          <CustomSelect value={quotationSort} onChange={(value)=>setQuotationSort(value as QuotationSort)} options={[{value:'newest',label:'Newest'},{value:'oldest',label:'Oldest'},{value:'value_high',label:'Highest value'},{value:'value_low',label:'Lowest value'},{value:'valid_until',label:'Valid until'}]} className="min-w-0" triggerClassName="h-10 min-h-10 w-full whitespace-nowrap" aria-label="Quotation sort"/>
        </div>
      </div>
      {(quotationSearch || quotationStatusFilter !== 'all') && (
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="text-[10px] text-muted">Quotation filters are active</span>
          <button type="button" onClick={()=>{setQuotationSearch('');setQuotationStatusFilter('all');}} className={actionClass+' h-8 min-h-8 px-3 text-[11px]'}>Clear filters</button>
        </div>
      )}
    </div>
  </div><div className="overflow-hidden">{filteredQuotations.length===0?<div className="p-5"><EmptyState title="No quotations found" description="Adjust the search or filters."/></div>:<table className="ams-finance-table min-w-[1060px] border-separate border-spacing-0 text-xs">
<thead className="sticky top-0 z-10">
<tr>
  <th className="w-[25%]">Quotation</th>
  <th className="w-[23%]">Client</th>
  <th className="w-[14%] text-right">Value</th>
  <th className="w-[12%]">Created</th>
  <th className="w-[14%]">Valid until</th>
  <th className="w-[12%]">Status</th>
  <th className="w-[10%]">Owner</th>
  <th className="w-[56px] text-right">Actions</th>
</tr></thead>
<tbody>
{paginatedQuotations.map((quotation)=>{
  const validityDays = getDaysUntilDue(quotation.validUntil);
  const canConvert = canManageInvoices && quotation.status === "approved" && !quotation.invoiceId;
  return <tr key={quotation.id}>
    <td>
      <button type="button" onClick={()=>setQuotationDetail(quotation)} className="font-semibold tabular-nums text-fg hover:text-accent-text">{quotation.quotationNumber}</button>
      <p className="mt-1 max-w-[340px] truncate font-medium text-fg">{quotation.title}</p>
      <p className="mt-1 text-[10px] text-muted">{quotation.items?.length ? quotation.items.length + " line " + (quotation.items.length === 1 ? "item" : "items") : "Commercial scope"}</p>
    </td>
    <td>
      <p className="truncate font-medium text-fg">{quotation.clientCompany || quotation.clientName}</p>
      <p className="mt-1 truncate text-[11px] text-muted">{quotation.clientName}</p>
    </td>
    <td className="text-right">
      <p className="font-semibold tabular-nums text-fg">{formatNativeAmount(quotation.total,quotation.currency,true)}</p>
      <p className="mt-1 text-[10px] text-muted">{quotation.currency}</p>
    </td>
    <td className="tabular-nums text-muted">{formatFinanceTableDate(quotation.createdAt)}</td>
    <td>
      <p className={"tabular-nums " + (validityDays < 0 ? "text-danger" : validityDays <= 7 ? "text-warning" : "text-fg")}>{formatFinanceTableDate(quotation.validUntil)}</p>
      <p className="mt-1 text-[10px] text-muted">{formatQuotationValidity(quotation.validUntil)}</p>
    </td>
    <td><QuotationStatusBadge status={quotation.status}/></td>
    <td>
      <span className="truncate text-xs text-fg">{quotation.owner || "Finance"}</span>
      {quotation.invoiceId&&<p className="mt-1 text-[10px] text-success">Invoice linked</p>}
    </td>
    <td>
      <div className="relative flex justify-end">
        <button type="button" onClick={()=>setQuotationActionMenu((current)=>current===quotation.id?null:quotation.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg" aria-label={"Quotation actions for " + quotation.quotationNumber} aria-expanded={quotationActionMenu===quotation.id} title="Quotation actions"><MoreHorizontal size={14}/></button>
        {quotationActionMenu===quotation.id&&<div className="absolute right-0 top-[calc(100%+6px)] z-40 w-48 rounded-card border border-line bg-panel p-1.5" role="menu">
          <button type="button" role="menuitem" onClick={()=>{setQuotationDetail(quotation);setQuotationActionMenu(null);}} className="flex w-full items-center gap-2 rounded-control px-3 py-2.5 text-left text-xs text-muted hover:bg-bg hover:text-fg"><Eye size={14}/>View quotation</button>
          {canManageInvoices&&<button type="button" role="menuitem" onClick={()=>{openEditQuotation(quotation);setQuotationActionMenu(null);}} className="flex w-full items-center gap-2 rounded-control px-3 py-2.5 text-left text-xs text-muted hover:bg-bg hover:text-fg"><Edit3 size={14}/>Edit quotation</button>}
          {canConvert&&<button type="button" role="menuitem" onClick={()=>{void convertQuotationToInvoice(quotation);setQuotationActionMenu(null);}} className="flex w-full items-center gap-2 rounded-control px-3 py-2.5 text-left text-xs text-muted hover:bg-bg hover:text-fg"><Receipt size={14}/>Convert to invoice</button>}
          {canManageInvoices&&<button type="button" role="menuitem" onClick={()=>{void deleteQuotation(quotation);setQuotationActionMenu(null);}} className="flex w-full items-center gap-2 rounded-control px-3 py-2.5 text-left text-xs text-danger hover:bg-danger/10"><Trash2 size={14}/>Delete quotation</button>}
        </div>}
      </div>
    </td>
  </tr>
})}
</tbody></table>}</div><AdminTablePagination total={filteredQuotations.length} page={quotationPage} pageSize={quotationPageSize} onPageChange={setQuotationPage} onPageSizeChange={setQuotationPageSize} itemLabel="quotations" slug="finance-quotations-pagination" /></section>
            <section className="rounded-card border border-line bg-panel overflow-hidden"><div className="border-b border-line p-4"><h2 className="text-sm font-semibold text-fg">Pipeline stages</h2><p className="mt-1 text-xs text-muted">Count and value by stage.</p></div><div className="space-y-3 p-4">{(['draft','review','approved','sent','accepted','rejected'] as FinanceQuotationStatus[]).map((status)=>{const count=quotations.filter((q)=>q.status===status).length;const value=quotations.filter((q)=>q.status===status).reduce((sum,q)=>sum+q.total,0);return <div key={status} className="rounded-control border border-line bg-bg px-3 py-3"><div className="flex justify-between text-xs"><span className="font-medium text-fg">{quotationStatusLabel(status)}</span><span className="tabular-nums font-semibold">{count}</span></div><p className="mt-1 text-[10px] tabular-nums text-muted">{formatNativeAmount(value,currency,true)}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel"><div className="h-full rounded-full bg-series-3" style={{width:(quotationMetrics.value>0?Math.min(100,value/quotationMetrics.value*100):0)+'%'}}/></div></div>})}</div></section>
          </section>
        </div>
      ) : financeView === 'income-expenses' ? (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><FinanceMetricCard label="Income YTD" value={formatFinanceCardAmount(ytdCollected,currency)} context={ytdCollectionRate.toFixed(1)+'% collected vs issued'} sparkline={financeChartData.map((point) => point.inflow)} icon={<WalletCards size={15} className="text-success"/>} toneClassName="text-success"/><FinanceMetricCard label="Invoiced YTD" value={formatFinanceCardAmount(ytdInvoiced,currency)} context="Issued billings" sparkline={financeChartData.map((point) => point.inflow + point.retainerTarget)} icon={<Receipt size={15}/>}/><FinanceMetricCard label="Expenses YTD" value={formatFinanceCardAmount(ytdExpenses,currency)} context={currencyExpenses.length+' expense records'} sparkline={financeChartData.map((point) => point.outflow)} icon={<ArrowDown size={15}/>}/><FinanceMetricCard label="Net cash YTD" value={formatFinanceCardAmount(ytdNetCash,currency)} context="Collected less expenses" sparkline={financeChartData.map((point) => point.net)} icon={<TrendingUp size={15}/>} toneClassName={ytdNetCash>=0?'text-success':'text-danger'}/></section>
          <section className="rounded-card border border-line bg-panel overflow-hidden" aria-label="Income and expenses ledger">
  <header className="border-b border-line bg-panel p-4 sm:px-5">
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-sm font-semibold text-fg">Income & expenses ledger</h2>
            <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] font-medium text-muted">
              {incomeExpenseMode === 'income' ? incomeRows.length + ' payments' : filteredExpenses.length + ' expenses'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">Review collected income and recorded operating spend from the same finance workspace.</p>
        </div>
        <div className="inline-flex shrink-0 items-center rounded-control border border-line bg-bg p-0.5" role="tablist" aria-label="Ledger type">
          <button type="button" role="tab" aria-selected={incomeExpenseMode === 'income'} onClick={() => setIncomeExpenseMode('income')} className={'min-h-8 rounded-chip border px-3 text-[11px] font-semibold transition-colors ' + (incomeExpenseMode === 'income' ? 'border-accent/25 bg-accent/10 text-fg' : 'border-transparent text-muted hover:bg-panel hover:text-fg')}>Income</button>
          <button type="button" role="tab" aria-selected={incomeExpenseMode === 'expenses'} onClick={() => setIncomeExpenseMode('expenses')} className={'min-h-8 rounded-chip border px-3 text-[11px] font-semibold transition-colors ' + (incomeExpenseMode === 'expenses' ? 'border-accent/25 bg-accent/10 text-fg' : 'border-transparent text-muted hover:bg-panel hover:text-fg')}>Expenses</button>
        </div>
      </div>
      {incomeExpenseMode === 'income' ? (
        <div className="grid gap-2 lg:grid-cols-[minmax(240px,1fr)_minmax(240px,320px)]">
          <div className="flex min-h-10 items-center rounded-control border border-line bg-bg px-3 text-[10px] text-muted">Showing recorded payment activity in {currency}.</div>
          <label className="relative min-w-0">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
            <span className="sr-only">Search income</span>
            <input value={incomeSearch} onChange={(event) => setIncomeSearch(event.target.value)} placeholder="Search invoice or client..." className={fieldClass + ' h-10 pl-8'}/>
          </label>
        </div>
      ) : (
        <div className="grid gap-2 lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]">
          <label className="relative min-w-0">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
            <span className="sr-only">Search expense</span>
            <input value={expenseSearch} onChange={(event) => setExpenseSearch(event.target.value)} placeholder="Search expense..." className={fieldClass + ' h-10 pl-8'}/>
          </label>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_minmax(140px,1fr)_minmax(150px,1fr)_auto]">
            <CustomSelect value={expenseTypeFilter} onChange={setExpenseTypeFilter} options={expenseTypeOptions} triggerClassName="h-10 min-h-10 w-full whitespace-nowrap" aria-label="Expense type filter"/>
            <CustomSelect value={expenseCategoryFilter} onChange={setExpenseCategoryFilter} options={expenseCategoryOptions} triggerClassName="h-10 min-h-10 w-full whitespace-nowrap" aria-label="Expense category filter"/>
            <CustomSelect value={expensePeriodFilter} onChange={(value) => setExpensePeriodFilter(value as typeof expensePeriodFilter)} options={expensePeriodOptions} triggerClassName="h-10 min-h-10 w-full whitespace-nowrap" aria-label="Expense period filter"/>
            <CustomSelect value={expenseSort} onChange={(value) => setExpenseSort(value as typeof expenseSort)} options={[{value:'date_desc',label:'Newest'},{value:'date_asc',label:'Oldest'},{value:'amount_high',label:'Highest amount'},{value:'amount_low',label:'Lowest amount'}]} triggerClassName="h-10 min-h-10 w-full whitespace-nowrap" aria-label="Expense sort"/>
            {canManageInvoices && <button type="button" onClick={openExpenseModal} className={primaryClass + ' h-10 min-h-10 shrink-0'}><Plus size={14}/>Add expense</button>}
          </div>
        </div>
      )}
    </div>
  </header>
  {incomeExpenseMode === 'income' ? (
    <div className="space-y-0">
      <div className="overflow-x-auto custom-scrollbar">
        {incomeRows.length === 0 ? (
          <div className="p-5"><EmptyState title="No income recorded" description="Recorded payments will appear here."/></div>
        ) : (
          <table className="ams-finance-table min-w-[900px] border-separate border-spacing-0 text-xs">
            <thead><tr><th className="w-[22%]">Payment</th><th className="w-[27%]">Client</th><th className="w-[13%]">Received</th><th className="w-[18%]">Method</th><th className="w-[15%] text-right">Amount</th><th className="w-[48px] text-right">Action</th></tr></thead>
            <tbody>
              {paginatedIncomeRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button type="button" onClick={() => { const invoice = currencyInvoices.find((item) => item.id === row.invoiceId); if (invoice) openPrintPreview(invoice); }} className="font-semibold tabular-nums text-xs text-fg hover:text-accent-text">{row.invoiceNumber}</button>
                    <p className="mt-1 text-[10px] text-muted">{row.reference || "Recorded payment"}</p>
                  </td>
                  <td><p className="truncate text-xs font-medium text-fg">{row.clientCompany}</p><p className="mt-1 text-[10px] text-muted">{row.invoiceNumber}</p></td>
                  <td className="tabular-nums text-muted">{formatFinanceTableDate(row.date)}</td>
                  <td><p className="text-xs text-fg capitalize">{String(row.method || "Other").replace("_"," ")}</p><p className="mt-1 text-[10px] text-muted">Collected income</p></td>
                  <td className="text-right"><p className="text-xs font-semibold tabular-nums text-success">{formatNativeAmount(row.amount, row.currency, true)}</p></td>
                  <td><div className="flex justify-end"><button type="button" onClick={() => { const invoice = currencyInvoices.find((item) => item.id === row.invoiceId); if (invoice) openPrintPreview(invoice); }} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg" aria-label="View payment invoice" title="View invoice"><Eye size={14}/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AdminTablePagination total={incomeRows.length} page={incomePage} pageSize={incomePageSize} onPageChange={setIncomePage} onPageSizeChange={setIncomePageSize} itemLabel="payments" slug="finance-income-pagination" />
    </div>
  ) : (
    <div className="space-y-0">
      <div className="overflow-x-auto custom-scrollbar">
        {filteredExpenses.length === 0 ? (
          <div className="p-5"><EmptyState title="No expenses found" description="Adjust the search or filters."/></div>
        ) : (
          <table className="ams-finance-table min-w-[980px] border-separate border-spacing-0 text-xs">
            <thead><tr><th className="w-[27%]">Expense</th><th className="w-[19%]">Category</th><th className="w-[18%]">Project</th><th className="w-[12%]">Date</th><th className="w-[13%] text-right">Amount</th><th className="w-[11%]">Schedule</th><th className="w-[48px] text-right">Action</th></tr></thead>
            <tbody>
              {paginatedExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    <button type="button" onClick={() => setExpenseDetail(expense)} className="text-left">
                      <p className="max-w-[330px] truncate text-xs font-medium text-fg hover:text-accent-text">{expense.description}</p>
                      <p className="mt-1 text-[10px] text-muted">{expense.recordedBy || "Finance"} · {expense.type || "OpEx"}</p>
                    </button>
                  </td>
                  <td><p className="text-xs text-fg">{expense.category}</p><p className="mt-1 text-[10px] text-muted">{expense.receiptUrl ? "Receipt attached" : "No receipt"}</p></td>
                  <td><span className="text-xs text-fg">{projectsById.get(expense.projectId || "")?.name || "Unassigned"}</span></td>
                  <td className="tabular-nums text-muted">{formatFinanceTableDate(expense.date)}</td>
                  <td className="text-right"><span className="text-xs font-semibold tabular-nums text-fg">{formatNativeAmount(expense.amount, expense.currency || currency, true)}</span></td>
                  <td><p className="text-xs text-fg">{expense.recurringInterval && expense.recurringInterval !== "none" ? expense.recurringInterval : "One-time"}</p><p className="mt-1 text-[10px] text-muted">{expense.recurringInterval && expense.recurringInterval !== "none" ? "Recurring" : "Single charge"}</p></td>
                  <td><div className="flex justify-end">{canManageInvoices&&<button type="button" onClick={() => setConfirmAction({ type: "expense", id: expense.id, label: expense.description })} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger" aria-label="Void expense" title="Void expense"><Trash2 size={14}/></button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AdminTablePagination total={filteredExpenses.length} page={expensePage} pageSize={expensePageSize} onPageChange={setExpensePage} onPageSizeChange={setExpensePageSize} itemLabel="expenses" slug="finance-expenses-pagination" />
    </div>
  )}
</section>
        </div>
      ) : financeView === 'vendor-payments' ? (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <FinanceMetricCard label="Scheduled" value={String(vendorPaymentMetrics.scheduled)} context="Upcoming vendor payments" icon={<Clock3 size={15}/>} />
            <FinanceMetricCard label="Overdue" value={String(vendorPaymentMetrics.overdue)} context="Payments past due" icon={<AlertCircle size={15} className="text-danger"/>} toneClassName="text-danger" />
            <FinanceMetricCard label="Paid" value={formatFinanceCardAmount(vendorPaymentMetrics.paid, currency)} context="Recorded payments" icon={<CheckCircle2 size={15} className="text-success"/>} toneClassName="text-success" />
            <FinanceMetricCard label="Outstanding" value={formatFinanceCardAmount(vendorPaymentMetrics.outstanding, currency)} context="Remaining obligations" icon={<WalletCards size={15} className="text-warning"/>} toneClassName="text-warning" />
          </section>

          <section className="rounded-card border border-line bg-panel overflow-hidden" aria-label="Vendor payments ledger">
            <header className="border-b border-line bg-panel p-4 sm:px-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-sm font-semibold text-fg">Vendor payment ledger</h2>
                      <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] font-medium text-muted">{filteredVendorPayments.length} visible</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">Track contractor and partner payment obligations from vendor contracts.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] text-muted">{currency}</span>
                    {canManageInvoices && <button type="button" onClick={() => openVendorPaymentModal()} className={primaryClass}><Plus size={14}/>Record payment</button>}
                  </div>
                </div>

                <div className="grid gap-2 lg:grid-cols-[minmax(240px,1fr)_minmax(150px,1fr)_minmax(170px,1fr)_minmax(150px,1fr)]">
                  <label className="relative min-w-0">
                    <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
                    <span className="sr-only">Search vendor payments</span>
                    <input value={vendorPaymentSearch} onChange={(event) => setVendorPaymentSearch(event.target.value)} placeholder="Search vendor, company, contract..." className={fieldClass + ' h-10 pl-8'}/>
                  </label>
                  <CustomSelect value={vendorPaymentVendorFilter} onChange={setVendorPaymentVendorFilter} options={[{value:'all',label:'All vendors'}, ...vendors.map((vendor) => ({value:vendor.id,label:vendor.name}))]} triggerClassName="h-10 min-h-10 w-full whitespace-nowrap"/>
                  <CustomSelect value={vendorPaymentStatusFilter} onChange={(value) => setVendorPaymentStatusFilter(value as VendorPaymentStatus | 'all')} options={[{value:'all',label:'All payment states'},{value:'scheduled',label:'Scheduled'},{value:'partial',label:'Partially paid'},{value:'paid',label:'Paid'},{value:'overdue',label:'Overdue'}]} triggerClassName="h-10 min-h-10 w-full whitespace-nowrap"/>
                  <CustomSelect value={vendorPaymentSort} onChange={(value) => setVendorPaymentSort(value as typeof vendorPaymentSort)} options={[{value:'due_asc',label:'Due soonest'},{value:'due_desc',label:'Due latest'},{value:'amount_high',label:'Highest amount'},{value:'amount_low',label:'Lowest amount'}]} triggerClassName="h-10 min-h-10 w-full whitespace-nowrap"/>
                </div>

                {(vendorPaymentSearch || vendorPaymentStatusFilter !== 'all' || vendorPaymentVendorFilter !== 'all') && (
                  <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                    <span className="text-[10px] text-muted">Vendor payment filters are active</span>
                    <button type="button" onClick={() => { setVendorPaymentSearch(''); setVendorPaymentStatusFilter('all'); setVendorPaymentVendorFilter('all'); }} className={actionClass + ' h-8 min-h-8 px-3 text-[11px]'}>Clear filters</button>
                  </div>
                )}
              </div>
            </header>

            <div className="overflow-x-auto custom-scrollbar">
              {filteredVendorPayments.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="No vendor payments found"
                    description={vendors.length ? 'No contracts match the current filters or there are no obligations in this currency.' : 'Vendor data is not available yet. Refresh Finance after vendor records are available.'}
                    action={vendors.length && canManageInvoices ? <button type="button" onClick={() => openVendorPaymentModal()} className={primaryClass}><Plus size={14}/>Record payment</button> : undefined}
                  />
                </div>
              ) : (
                <table className="ams-finance-table min-w-[1120px] border-separate border-spacing-0 text-xs">
                  <thead><tr><th className="w-[23%]">Vendor / contract</th><th className="w-[12%]">Due date</th><th className="w-[13%] text-right">Amount</th><th className="w-[13%] text-right">Paid</th><th className="w-[13%] text-right">Outstanding</th><th className="w-[12%]">Status</th><th className="w-[48px] text-right">Action</th></tr></thead>
                  <tbody>
                    {paginatedVendorPayments.map((row) => (
                      <tr key={row.id} className="group cursor-pointer hover:bg-bg" onClick={() => setVendorPaymentDetail(row)}>
                        <td>
                          <p className="font-medium text-fg">{row.vendor.companyName || row.vendor.name}</p>
                          <p className="mt-1 text-[10px] text-muted">{row.contract.title} · {row.vendor.name}</p>
                        </td>
                        <td><p className="tabular-nums text-fg">{vendorPaymentFormatDate(row.dueDate)}</p><p className="mt-1 text-[10px] text-muted">{row.status === 'overdue' ? Math.abs(getDaysUntilDue(row.dueDate)) + ' days overdue' : getDaysUntilDue(row.dueDate) === 0 ? 'Due today' : getDaysUntilDue(row.dueDate) > 0 ? 'Due in ' + getDaysUntilDue(row.dueDate) + ' days' : 'Past due'}</p></td>
                        <td className="text-right"><span className="font-semibold tabular-nums text-fg">{formatNativeAmount(row.amount, currency, true)}</span></td>
                        <td className="text-right"><span className="font-semibold tabular-nums text-success">{formatNativeAmount(row.paidAmount, currency, true)}</span></td>
                        <td className="text-right"><span className={"font-semibold tabular-nums " + (row.amount - row.paidAmount > 0 ? "text-warning" : "text-success")}>{formatNativeAmount(Math.max(0,row.amount-row.paidAmount), currency, true)}</span></td>
                        <td><span className={'inline-flex rounded-badge border px-2 py-1 text-[10px] font-semibold ' + vendorPaymentStatusTone[row.status]}>{vendorPaymentStatusLabel[row.status]}</span></td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <button type="button" className="ams-table-action" onClick={() => setVendorPaymentDetail(row)}>View</button>
                            {canManageInvoices && row.status !== 'paid' && <button type="button" className="ams-table-action" data-primary="true" onClick={() => openVendorPaymentModal(row)}>Pay</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <AdminTablePagination total={filteredVendorPayments.length} page={vendorPaymentPage} pageSize={vendorPaymentPageSize} onPageChange={setVendorPaymentPage} onPageSizeChange={setVendorPaymentPageSize} itemLabel="vendor payments" slug="finance-vendor-payments-pagination" />
          </section>
        </div>
      ) : financeView === 'tax-retainers' ? (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><FinanceMetricCard label="Tax provision" value={formatFinanceCardAmount(taxProvision,currency)} context="Tax across issued invoices" sparkline={[taxProvision, taxCollected, taxOutstanding, retainerBilled]} icon={<Receipt size={15}/>}/><FinanceMetricCard label="Tax collected" value={formatFinanceCardAmount(taxCollected,currency)} context={(taxProvision>0?((taxCollected/taxProvision)*100).toFixed(1):'0.0')+'% of provision'} sparkline={[taxProvision, taxCollected, taxOutstanding]} icon={<BadgeCheck size={15} className="text-success"/>} toneClassName="text-success"/><FinanceMetricCard label="Tax outstanding" value={formatFinanceCardAmount(taxOutstanding,currency)} context="Provision not collected" sparkline={[taxOutstanding, taxProvision, taxCollected]} icon={<Hourglass size={15} className="text-warning"/>} toneClassName="text-warning"/><FinanceMetricCard label="Retainer billed" value={formatFinanceCardAmount(retainerBilled,currency)} context={(retainerBilled>0?((retainerCollected/retainerBilled)*100).toFixed(1):'0.0')+'% collected'} sparkline={financeChartData.map((point) => point.retainerTarget)} icon={<TrendingUp size={15}/>}/></section>
          <section className="space-y-5"><section className="rounded-card border border-line bg-panel overflow-hidden"><div className="border-b border-line p-4"><div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-semibold text-fg">Retainer ledger</h2><p className="mt-1 text-xs text-muted">Billing and collected value for retainer invoices.</p></div>{usingDemoRetainerLedger&&<span className="shrink-0 rounded-badge border border-line bg-bg px-2 py-1 text-[10px] font-medium text-muted">Sample data</span>}</div></div><div className="overflow-hidden"><table className="ams-finance-table table-fixed border-separate border-spacing-0 text-xs">
<thead><tr>
  <th className="w-[22%]">Invoice</th>
  <th className="w-[24%]">Client</th>
  <th className="w-[11%]">Issued</th>
  <th className="w-[11%]">Due</th>
  <th className="w-[13%] text-right">Billed</th>
  <th className="w-[13%] text-right">Collected</th>
  <th className="w-[10%]">Status</th>
</tr></thead>
<tbody className="divide-y divide-line">
{paginatedRetainerLedgerInvoices.map((invoice)=><tr key={invoice.id}>
  <td>
    <button type="button" onClick={()=>openPrintPreview(invoice)} className="font-semibold tabular-nums text-fg hover:text-accent-text">{invoice.invoiceNumber}</button>
    <p className="mt-1 text-[10px] text-muted">{invoice.paymentTerms || "Retainer invoice"}</p>
  </td>
  <td><p className="font-medium text-fg">{invoice.clientCompany||invoice.clientName}</p><p className="mt-1 text-[10px] text-muted">{invoice.clientName}</p></td>
  <td className="tabular-nums text-muted">{formatFinanceTableDate(invoice.issueDate)}</td>
  <td className="tabular-nums text-muted">{formatFinanceTableDate(invoice.dueDate)}</td>
  <td className="text-right font-semibold tabular-nums text-fg">{formatNativeAmount(invoice.total,invoice.currency,true)}</td>
  <td className="text-right font-semibold tabular-nums text-success">{formatNativeAmount(getInvoiceCollectedInRange(invoice,yearStart,yearEnd),invoice.currency,true)}</td>
  <td><StatusBadge status={invoice.status}/></td>
</tr>)}
</tbody></table></div><AdminTablePagination total={retainerLedgerInvoices.length} page={retainerPage} pageSize={retainerPageSize} onPageChange={setRetainerPage} onPageSizeChange={setRetainerPageSize} itemLabel="retainer invoices" slug="finance-retainer-pagination" /></section>
            <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-card border border-line bg-panel p-4"><div className="border-b border-line pb-3"><h2 className="text-sm font-semibold text-fg">Tax provision</h2><p className="mt-1 text-xs text-muted">Provision versus collected and outstanding tax.</p></div><div className="mt-4 space-y-3">{[{label:'Provision',value:taxProvision,tone:'bg-series-1'},{label:'Collected',value:taxCollected,tone:'bg-success'},{label:'Outstanding',value:taxOutstanding,tone:'bg-warning'}].map((item)=>{const percent=taxProvision>0?Math.min(100,item.value/taxProvision*100):0;return <div key={item.label}><div className="flex justify-between text-xs"><span className="text-muted">{item.label}</span><span className="font-medium tabular-nums">{formatNativeAmount(item.value,currency,true)}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg"><div className={'h-full rounded-full '+item.tone} style={{width:percent+'%'}}/></div></div>})}</div><button type="button" onClick={exportTaxCsv} disabled={!currencyInvoices.length} className={actionClass+' mt-5 w-full'}><Download size={14}/>Export tax detail</button></section><section className="rounded-card border border-line bg-panel p-4"><div className="flex justify-between gap-3"><div><h2 className="text-sm font-semibold text-fg">Retainer collection</h2><p className="mt-1 text-xs text-muted">Collection against billed retainers.</p></div><span className="text-sm font-semibold tabular-nums">{retainerBilled>0?((retainerCollected/retainerBilled)*100).toFixed(1):'0.0'}%</span></div><div className="mt-4 h-2 rounded-full bg-bg overflow-hidden"><div className="h-full rounded-full bg-success" style={{width:(retainerBilled>0?Math.min(100,retainerCollected/retainerBilled*100):0)+'%'}}/></div><div className="mt-2 flex justify-between text-[10px] tabular-nums text-muted"><span>{formatFinanceCardAmount(retainerCollected,currency)}</span><span>{formatFinanceCardAmount(retainerBilled,currency)}</span></div></section></div>
          </section>
        </div>
      ) : financeView === 'financial-reports' ? (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><FinanceMetricCard label="Net cash YTD" value={formatFinanceCardAmount(ytdNetCash,currency)} context="Collected less expenses" sparkline={financeChartData.map((point) => point.net)} icon={<TrendingUp size={15}/>} toneClassName={ytdNetCash>=0?'text-success':'text-danger'}/><FinanceMetricCard label="Collection rate" value={ytdCollectionRate.toFixed(1)+'%'} context="Collected vs issued" sparkline={financeChartData.map((point) => point.inflow > 0 ? (point.inflow / Math.max(point.inflow + point.retainerTarget, 1)) * 100 : 0)} icon={<BarChart3 size={15}/>}/><FinanceMetricCard label="Operating margin" value={(Number.isFinite(operatingMarginValue)?operatingMarginValue:quarterMargin).toFixed(1)+'%'} context="Target ≥ 35%" sparkline={financeChartData.map((point) => point.inflow > 0 ? (point.net / point.inflow) * 100 : 0)} icon={<TrendingUp size={15}/>}/><FinanceMetricCard label="Outstanding" value={formatFinanceCardAmount(derivedMetrics.totalOutstanding,currency)} context={pendingInvoiceCount+' invoices open'} sparkline={financeChartData.map((point) => point.outflow)} icon={<Hourglass size={15} className="text-warning"/>} toneClassName="text-warning"/></section>
          <section className="rounded-card border border-line bg-panel overflow-hidden"><div className="border-b border-line p-4"><div className="flex justify-between gap-3"><div><h2 className="text-sm font-semibold text-fg">Cash Flow vs Operating Burn</h2><p className="mt-1 text-xs text-muted">Actual collections versus recorded operating spend. Dotted line = net cash.</p></div><span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] text-muted">{reportingQuarter?.label||'Current period'}</span></div></div><div className="p-4">{hasTrendData?<FinanceCashFlowChart data={financeChartData} currency={currency} ariaLabel="Finance cash flow trend comparing cash collected, operating burn, and net cash."/>:<EmptyState title="No trend data" description="Monthly payment and expense records will populate this report."/>}</div></section>
          <section className="grid gap-5 xl:grid-cols-3"><section className="rounded-card border border-line bg-panel overflow-hidden"><div className="border-b border-line p-4"><h2 className="text-sm font-semibold text-fg">Invoice status mix</h2><p className="mt-1 text-xs text-muted">Current reporting quarter.</p></div><div className="space-y-2 p-4">{quarterStatusRows.map((row)=><div key={row.status} className="flex justify-between rounded-control border border-line bg-bg px-3 py-2.5"><StatusBadge status={row.status}/><span className="text-xs font-semibold tabular-nums">{row.count}</span></div>)}</div></section><section className="rounded-card border border-line bg-panel overflow-hidden"><div className="border-b border-line p-4"><h2 className="text-sm font-semibold text-fg">Expense mix</h2><p className="mt-1 text-xs text-muted">Top categories by quarter spend.</p></div><div className="space-y-3 p-4">{quarterExpenseCategories.length===0?<EmptyState title="No expense categories" description="Actual expense records will appear here."/>:quarterExpenseCategories.slice(0,5).map(([category,amount])=><div key={category}><div className="flex justify-between gap-3 text-xs"><span className="truncate text-muted">{category}</span><span className="tabular-nums font-medium">{formatNativeAmount(amount,currency,true)}</span></div><div className="mt-1.5 h-1.5 rounded-full bg-bg overflow-hidden"><div className="h-full rounded-full bg-series-3" style={{width:(quarterExpenses>0?Math.min(100,amount/quarterExpenses*100):0)+'%'}}/></div></div>)}</div></section><section className="rounded-card border border-line bg-panel overflow-hidden"><div className="border-b border-line p-4"><h2 className="text-sm font-semibold text-fg">Report controls</h2><p className="mt-1 text-xs text-muted">Audit context and export.</p></div><div className="grid grid-cols-2 gap-2 p-4">{[['Period',reportingQuarter?.label||'—'],['Invoices',String(serverMetrics?serverMetrics.totalInvoicesCount:ledgerInvoices.length)],['Open',String(pendingInvoiceCount)],['Overdue',String(criticalOverdueCount)],['Retainer',formatFinanceCardAmount(retainerBilled,currency)],['Tax due',formatFinanceCardAmount(taxOutstanding,currency)]].map(([label,value])=><div key={label} className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">{label}</p><p className="mt-1 text-sm font-semibold tabular-nums">{value}</p></div>)}</div><div className="border-t border-line p-4"><button type="button" onClick={exportReportCsv} disabled={!financeChartData.length} className={actionClass+' w-full'}><Download size={14}/>Export financial report</button></div></section></section>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><FinanceMetricCard label="Quarter billed" value={formatFinanceCardAmount(currentQuarterTotal,currency)} context={quarterChangePercent===null?'Current quarter':(quarterChangePercent>=0?'+':'')+quarterChangePercent.toFixed(1)+'% vs previous quarter'} sparkline={financeChartData.map((point) => point.inflow + point.retainerTarget)} icon={<Receipt size={15}/>}/><FinanceMetricCard label="Collected YTD" value={formatFinanceCardAmount(ytdCollected,currency)} context={ytdCollectionRate.toFixed(1)+'% collection rate'} sparkline={financeChartData.map((point) => point.inflow)} icon={<WalletCards size={15} className="text-success"/>} toneClassName="text-success"/><FinanceMetricCard label="Outstanding" value={formatFinanceCardAmount(derivedMetrics.totalOutstanding,currency)} context={pendingInvoiceCount+' open invoices'} icon={<Hourglass size={15} className="text-warning"/>} toneClassName="text-warning"/><FinanceMetricCard label="Overdue" value={formatFinanceCardAmount(overdueBalance,currency)} context={criticalOverdueCount+' invoices need attention'} sparkline={financeChartData.map((point) => point.outflow)} icon={<AlertCircle size={15} className="text-danger"/>} toneClassName="text-danger"/></section>
          <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]"><section className="rounded-card border border-line bg-panel overflow-hidden"><div className="border-b border-line p-4"><div className="flex justify-between gap-3"><div><h2 className="text-sm font-semibold text-fg">Cash Flow vs Operating Burn</h2><p className="mt-1 text-xs text-muted">Six-month view of actual cash collected versus recorded operating spend.</p></div><div className="shrink-0 rounded-control border border-line bg-bg px-3 py-2 text-right">
  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">Quarter net cash</p>
  <p className={'mt-0.5 text-sm font-semibold tabular-nums '+(quarterNetCash>=0?'text-success':'text-danger')}>{formatFinanceCardAmount(quarterNetCash,currency)}</p>
</div></div></div><div className="p-4">{hasTrendData?<FinanceCashFlowChart data={financeChartData} currency={currency} ariaLabel="Finance cash flow trend comparing cash collected, operating burn, and net cash."/>:<EmptyState title="No trend data" description="Billing payments and expenses will populate this trend."/>}</div></section><section className="rounded-card border border-line bg-panel overflow-hidden"><div className="border-b border-line p-4"><h2 className="text-sm font-semibold text-fg">Aging receivables</h2><p className="mt-1 text-xs text-muted">{formatFinanceCardAmount(derivedMetrics.totalOutstanding,currency)} outstanding across 5 aging buckets.</p></div><div className="p-4"><div className="flex h-2.5 overflow-hidden rounded-full bg-bg border border-line">{agingBuckets.map((bucket)=><div key={bucket.label} className={'h-full '+(bucket.tone==='success'?'bg-success':bucket.tone==='warning'?'bg-warning':'bg-danger')} style={{width:bucket.percent+'%'}}/>)}</div><div className="mt-4 space-y-2.5">{agingBuckets.map((bucket)=><div key={bucket.label} className="flex items-center justify-between rounded-control border border-line bg-bg px-3 py-3"><div><p className="text-xs font-medium text-fg">{bucket.label}</p><p className="mt-1 text-[10px] text-muted">{bucket.count} account{bucket.count===1?'':'s'}</p></div><div className="text-right"><p className="text-xs font-semibold tabular-nums">{formatNativeAmount(bucket.amount,currency,true)}</p><p className="mt-1 text-[10px] text-muted">{bucket.percent}%</p></div></div>)}</div><button type="button" onClick={()=>setDunningOpen(true)} disabled={!actionRequiredInvoices.length} className={actionClass+' mt-4 w-full'}><Send size={14}/>Prepare collection notices</button></div></section></section>
          <section className="rounded-card border border-line bg-panel overflow-hidden">
  <div className="border-b border-line bg-panel p-4 sm:px-5">
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h2 className="text-sm font-semibold text-fg">Invoice ledger</h2>
            <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] font-medium text-muted">
              {filteredInvoices.length} visible
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            {ledgerPeriod === 'all' ? 'All periods' : reportingQuarter?.label || 'Current quarter'} · Search, filter, and manage receivables.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-control border border-line bg-bg p-0.5">
            <button
              type="button"
              onClick={() => { setLedgerPeriod('reporting-quarter'); setStatusFilter('all'); }}
              className={'min-h-8 rounded-chip px-3 text-[11px] font-semibold transition-colors ' + (ledgerPeriod === 'reporting-quarter' ? 'border border-accent/25 bg-accent/10 text-fg' : 'border border-transparent text-muted hover:bg-panel hover:text-fg')}
            >
              Current quarter
            </button>
            <button
              type="button"
              onClick={() => { setLedgerPeriod('all'); setStatusFilter('all'); }}
              className={'min-h-8 rounded-chip px-3 text-[11px] font-semibold transition-colors ' + (ledgerPeriod === 'all' ? 'border border-accent/25 bg-accent/10 text-fg' : 'border border-transparent text-muted hover:bg-panel hover:text-fg')}
            >
              All periods
            </button>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setColumnMenuOpen((open) => !open)}
              className={actionClass + ' h-9 min-h-9 px-3'}
              aria-expanded={columnMenuOpen}
              aria-haspopup="menu"
            >
              <SlidersHorizontal size={14}/>Columns
            </button>
            {columnMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 rounded-card border border-line bg-panel p-1.5" role="menu">
                {(['client','timeline','billing','status','actions'] as const).map((key) => {
                  const labels: Record<typeof key, string> = {
                    client: 'Client & project',
                    timeline: 'Issue and due dates',
                    billing: 'Amounts',
                    status: 'Status',
                    actions: 'Actions'
                  };
                  return (
                    <button
                      key={key}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={columnVisibility[key]}
                      onClick={() => setColumnVisibility((current) => ({ ...current, [key]: !current[key] }))}
                      className="flex w-full items-center justify-between gap-3 rounded-control px-3 py-2.5 text-left text-xs text-muted hover:bg-bg hover:text-fg"
                    >
                      <span>{labels[key]}</span>
                      <span className={columnVisibility[key] ? 'font-semibold text-accent-text' : 'text-muted'}>
                        {columnVisibility[key] ? 'Visible' : 'Hidden'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-[minmax(240px,1fr)_minmax(0,3fr)]">
        <label className="relative min-w-0">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <span className="sr-only">Search invoices</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoice, client, project..."
            className={fieldClass + ' h-10 pl-9'}
          />
        </label>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            className="min-w-0 xl:shrink-0"
            triggerClassName="h-10 min-h-10 w-full whitespace-nowrap xl:w-[150px]"
          />
          <CustomSelect
            value={paymentFilter}
            onChange={(value) => setPaymentFilter(value as PaymentFilter)}
            options={[
              {value:'all',label:'All payment states'},
              {value:'unpaid',label:'Unpaid'},
              {value:'partial',label:'Partially paid'},
              {value:'paid',label:'Paid'}
            ]}
            className="min-w-0 xl:shrink-0"
            triggerClassName="h-10 min-h-10 w-full whitespace-nowrap xl:w-[176px]"
          />
          <CustomSelect
            value={dueFilter}
            onChange={setDueFilter}
            options={[
              {value:'all',label:'All due states'},
              {value:'due_soon',label:'Due within 7 days'},
              {value:'overdue',label:'Overdue'},
              {value:'later',label:'Due later'}
            ]}
            className="min-w-0 xl:shrink-0"
            triggerClassName="h-10 min-h-10 w-full whitespace-nowrap xl:w-[150px]"
          />
          <CustomSelect
            value={sort}
            onChange={(value) => setSort(value as SortKey)}
            options={sortOptions}
            className="min-w-0 xl:shrink-0"
            triggerClassName="h-10 min-h-10 w-full whitespace-nowrap xl:w-[176px]"
          />
        </div>
      </div>

      {(search || statusFilter !== 'all' || paymentFilter !== 'all' || dueFilter !== 'all') && (
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="text-[10px] text-muted">Filters are active</span>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setPaymentFilter('all');
              setDueFilter('all');
            }}
            className={actionClass + ' h-8 min-h-8 px-3 text-[11px]'}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  </div><div className="overflow-hidden">{filteredInvoices.length===0?<div className="p-5"><EmptyState title="No invoices found" description="No invoices match the current filters." action={canManageInvoices?<button type="button" onClick={openCreateInvoice} className={primaryClass}><Plus size={14}/>Create invoice</button>:undefined}/></div>:<table className="ams-finance-table table-fixed border-separate border-spacing-0 text-xs">
<thead><tr>
  <th className="w-[20%]">Invoice</th>
  {columnVisibility.client&&<th className="w-[19%]">Client & project</th>}
  {columnVisibility.timeline&&<><th className="w-[10%]">Issued</th><th className="w-[10%]">Due</th></>}
  {columnVisibility.billing&&<><th className="w-[12%] text-right">Total</th><th className="w-[12%] text-right">Balance</th></>}
  {columnVisibility.status&&<th className="w-[10%]">Status</th>}
  {columnVisibility.actions&&<th className="w-[17%] text-right">Actions</th>}
</tr></thead>
<tbody className="divide-y divide-line">
{paginatedInvoices.map((invoice)=>{
  const balance=Number(invoice.balanceDue??(invoice.total-(invoice.amountPaid||0)));
  const project=projectsById.get(invoice.projectId);
  const overdue=isPastDueInvoice(invoice);
  return <tr key={invoice.id} className="group align-top transition-colors hover:bg-bg">
    <td className="px-5 py-4">
      <div className="flex items-start gap-2.5">
        <span className={'mt-1.5 h-2 w-2 shrink-0 rounded-full '+(overdue?'bg-danger':invoice.status==='paid'?'bg-success':'bg-warning')} aria-hidden="true" />
        <div className="min-w-0">
          <button type="button" onClick={()=>openPrintPreview(invoice)} className="font-semibold tabular-nums text-fg hover:text-accent-text">{invoice.invoiceNumber}</button>
          <p className="mt-1 text-[11px] text-muted">{overdue?'Past due':invoice.status==='paid'?'Settled':invoice.status==='partially_paid'?'Partially paid':'Open balance'}</p>
        </div>
      </div>
    </td>
    {columnVisibility.client&&<td className="px-5 py-4">
      <p className="truncate font-medium text-fg">{invoice.clientCompany||invoice.clientName}</p>
      <p className="mt-1 truncate text-[11px] text-muted">{project?.name||invoice.clientEmail||invoice.clientName}</p>
    </td>}
    {columnVisibility.timeline&&<><td className="tabular-nums text-muted">{formatFinanceTableDate(invoice.issueDate)}</td>
    <td>
      <p className={'tabular-nums '+(overdue?'text-danger':'text-fg')}>{formatFinanceTableDate(invoice.dueDate)}</p>
      <p className={'mt-1 text-[10px] '+(overdue?'text-danger':'text-muted')}>{overdue ? Math.abs(getDaysUntilDue(invoice.dueDate)) + ' days overdue' : getDaysUntilDue(invoice.dueDate) === 0 ? 'Due today' : getDaysUntilDue(invoice.dueDate) + ' days left'}</p>
    </td></>}
    {columnVisibility.billing&&<><td className="text-right">
      <p className="font-semibold tabular-nums text-fg">{formatNativeAmount(invoice.total,invoice.currency,true)}</p>
      <p className="mt-1 text-[10px] text-muted">{invoice.currency}</p>
    </td>
    <td className="text-right">
      <p className={'font-semibold tabular-nums '+(balance>0?'text-warning':'text-success')}>{balance>0?formatNativeAmount(balance,invoice.currency,true):'Settled'}</p>
      <p className="mt-1 text-[10px] text-muted">{balance>0?'Outstanding':'Paid in full'}</p>
    </td></>}
    {columnVisibility.status&&<td className="px-5 py-4">
      {canManageInvoices&&['draft','sent','overdue'].includes(invoice.status)
        ? <InvoiceStatusDropdown status={invoice.status} allowedStatuses={['draft','sent','overdue']} disabled={updatingInvoiceId===invoice.id} onChange={(next)=>void updateInvoiceStatus(invoice,next)} />
        : <StatusBadge status={invoice.status} />}
    </td>}
    {columnVisibility.actions&&<td className="px-5 py-4">
      <div className="flex items-center justify-end gap-1.5">
        {overdue&&<button type="button" onClick={()=>setReminderInvoice(invoice)} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger" aria-label={'Send reminder for '+invoice.invoiceNumber} title="Send reminder"><Send size={13}/></button>}
        {canManageInvoices&&invoice.status!=='paid'&&invoice.status!=='cancelled'&&balance>0&&<button type="button" onClick={()=>openPayment(invoice)} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg" aria-label={'Record payment for '+invoice.invoiceNumber} title="Record payment"><WalletCards size={13}/></button>}
        <button type="button" onClick={()=>openPrintPreview(invoice)} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg" aria-label="View invoice" title="View invoice"><Eye size={13}/></button>
        {canManageInvoices&&invoice.status!=='cancelled'&&<button type="button" onClick={()=>openEditInvoice(invoice)} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg" aria-label="Edit invoice" title="Edit invoice"><Edit3 size={13}/></button>}
        {canManageInvoices&&canDeleteInvoice&&!['cancelled','paid','partially_paid'].includes(invoice.status)&&<button type="button" onClick={()=>setConfirmAction({type:'invoice',id:invoice.id,label:invoice.invoiceNumber})} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger" aria-label="Cancel invoice" title="Cancel invoice"><Trash2 size={13}/></button>}
      </div>
    </td>}
  </tr>;
})}
</tbody></table>}</div><AdminTablePagination total={filteredInvoices.length} page={invoicePage} pageSize={invoicePageSize} onPageChange={setInvoicePage} onPageSizeChange={setInvoicePageSize} itemLabel="records" slug="finance-invoices-pagination" /></section>
          <section className="rounded-card border border-line bg-panel overflow-hidden">
  <div className="border-b border-line p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold text-fg">Finance snapshot</h2>
        <p className="mt-1 max-w-2xl text-xs text-muted">A decision view of cash movement, receivables, and operating performance.</p>
      </div>
      <span className="inline-flex shrink-0 items-center rounded-badge border border-line bg-bg px-2.5 py-1 text-[10px] font-semibold text-muted">{reportingQuarter?.label || 'Current quarter'}</span>
    </div>
  </div>

  <div className="p-4">
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
      <article className="rounded-control border border-line bg-bg p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Cash position</p>
            <p className="mt-1 text-xs text-muted">Collected cash minus recorded operating expenses.</p>
          </div>
          <span className="rounded-badge border border-line bg-panel px-2 py-1 text-[10px] font-medium text-muted">Current quarter</span>
        </div>

        <div className="mt-5">
          <p className={'text-3xl font-semibold leading-none tabular-nums ' + (quarterNetCash >= 0 ? 'text-success' : 'text-danger')}>{formatNativeAmount(quarterNetCash,currency,true)}</p>
          <p className="mt-2 text-[10px] text-muted">Net cash available from this period's recorded movement.</p>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <div className="rounded-control border border-line bg-panel px-3 py-3">
            <p className="text-[10px] font-medium text-muted">Cash collected</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-success">{formatNativeAmount(quarterCollected,currency,true)}</p>
          </div>
          <div className="rounded-control border border-line bg-panel px-3 py-3">
            <p className="text-[10px] font-medium text-muted">Operating expenses</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-fg">{formatNativeAmount(quarterExpenses,currency,true)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
          <div>
            <p className="text-[10px] text-muted">Billed</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-fg">{formatNativeAmount(currentQuarterTotal,currency,true)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted">Collection rate</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-fg">{currentQuarterTotal > 0 ? ((quarterCollected / currentQuarterTotal) * 100).toFixed(1) : '0.0'}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted">Margin</p>
            <p className={'mt-1 text-sm font-semibold tabular-nums ' + (quarterMargin >= 0 ? 'text-success' : 'text-danger')}>{quarterMargin.toFixed(1)}%</p>
          </div>
        </div>
      </article>

      <article className="rounded-control border border-line bg-bg p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Receivables</p>
          <p className="mt-1 text-xs text-muted">Outstanding money still sitting on open invoices.</p>
        </div>

        <div className="mt-5">
          <p className="text-2xl font-semibold leading-none tabular-nums text-fg">{formatNativeAmount(derivedMetrics.totalOutstanding,currency,true)}</p>
          <p className="mt-2 text-[10px] text-muted">Total outstanding balance</p>
        </div>

        <div className="mt-5 rounded-control border border-danger/20 bg-danger/10 px-3 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[10px] font-medium text-danger">Overdue balance</span>
            <span className="text-sm font-semibold tabular-nums text-danger">{formatNativeAmount(overdueBalance,currency,true)}</span>
          </div>
          <p className="mt-1 text-[10px] text-danger/80">{overdueInvoiceCount} invoice{overdueInvoiceCount === 1 ? '' : 's'} overdue</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-control border border-line bg-panel px-3 py-3">
            <p className="text-[10px] text-muted">Open</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-fg">{pendingInvoiceCount}</p>
          </div>
          <div className="rounded-control border border-line bg-panel px-3 py-3">
            <p className="text-[10px] text-muted">Due soon</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-warning">{dueSoonCount}</p>
          </div>
          <div className="rounded-control border border-line bg-panel px-3 py-3">
            <p className="text-[10px] text-muted">60+ days</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-danger">{criticalOverdueCount}</p>
          </div>
        </div>
      </article>
    </div>

    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      <article className="rounded-control border border-line bg-bg p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Collection progress</p>
            <p className="mt-1 text-xs text-muted">How much of the current quarter's billed amount has actually been collected.</p>
          </div>
          <span className="text-lg font-semibold tabular-nums text-success">{currentQuarterTotal > 0 ? ((quarterCollected / currentQuarterTotal) * 100).toFixed(1) : '0.0'}%</span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-panel">
          <div className="h-full rounded-full bg-success" style={{width:Math.min(100,Math.max(0,currentQuarterTotal > 0 ? (quarterCollected / currentQuarterTotal) * 100 : 0))+'%'}} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] tabular-nums text-muted">
          <span>{formatNativeAmount(quarterCollected,currency,true)} collected</span>
          <span>{formatNativeAmount(currentQuarterTotal,currency,true)} billed</span>
        </div>
      </article>

      <article className="rounded-control border border-line bg-bg p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Tax & retainers</p>
            <p className="mt-1 text-xs text-muted">Current book exposure and recurring billing position.</p>
          </div>
          <span className="rounded-badge border border-line bg-panel px-2 py-1 text-[10px] text-muted">All current records</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-control border border-line bg-panel px-3 py-3">
            <p className="text-[10px] text-muted">Tax outstanding</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-warning">{formatFinanceCardAmount(taxOutstanding,currency)}</p>
          </div>
          <div className="rounded-control border border-line bg-panel px-3 py-3">
            <p className="text-[10px] text-muted">Retainer billed</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-fg">{formatFinanceCardAmount(retainerBilled,currency)}</p>
          </div>
          <div className="rounded-control border border-line bg-panel px-3 py-3">
            <p className="text-[10px] text-muted">Retainer collected</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-success">{formatFinanceCardAmount(retainerCollected,currency)}</p>
          </div>
        </div>
      </article>
    </div>

    <div className="mt-4 border-t border-line pt-3 text-[10px] leading-4 text-muted">
      <span className="font-medium text-fg">How to read this:</span> net cash = collections − operating expenses. Receivables are still unpaid invoice balances. Collection rate is based on billed versus collected in the current quarter.
    </div>
  </div>
</section>
        </div>
      )}
      <Modal
        open={!!reminderInvoice}
        onClose={() => setReminderInvoice(null)}
        size="md"
        title="Payment reminder"
        description={reminderInvoice ? reminderInvoice.invoiceNumber + ' · ' + (reminderInvoice.clientCompany || reminderInvoice.clientName) : undefined}
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <button type="button" onClick={() => setReminderInvoice(null)} className={actionClass}>Close</button>
            <button type="button" onClick={() => {
              if (!reminderInvoice) return;
              const balance = Number(reminderInvoice.balanceDue ?? (reminderInvoice.total - (reminderInvoice.amountPaid || 0)));
              const message = [
                'Payment reminder',
                reminderInvoice.invoiceNumber,
                reminderInvoice.clientCompany || reminderInvoice.clientName,
                'Outstanding: ' + formatNativeAmount(balance, reminderInvoice.currency, true),
                'Due date: ' + reminderInvoice.dueDate,
                'Please arrange settlement at your earliest convenience.'
              ].join('\n');
              void navigator.clipboard?.writeText(message);
              showNotice('success', 'Reminder draft copied to clipboard.');
            }} className={primaryClass}><Copy size={14} />Copy reminder</button>
          </div>
        }
      >
        {reminderInvoice && (
          <div className="space-y-3">
            <div className="rounded-card border border-line bg-bg p-4">
              <p className="whitespace-pre-line text-xs leading-5 text-fg">
                {[
                  'Payment reminder',
                  reminderInvoice.invoiceNumber,
                  reminderInvoice.clientCompany || reminderInvoice.clientName,
                  'Outstanding: ' + formatNativeAmount(Number(reminderInvoice.balanceDue ?? (reminderInvoice.total - (reminderInvoice.amountPaid || 0))), reminderInvoice.currency, true),
                  'Due date: ' + reminderInvoice.dueDate,
                  '',
                  'Please arrange settlement at your earliest convenience.'
                ].join('\n')}
              </p>
            </div>
            <p className="text-[10px] text-muted">This prepares the reminder in the browser; delivery remains an application/integration concern.</p>
          </div>
        )}
      </Modal>

      <Modal
        open={dunningOpen}
        onClose={() => setDunningOpen(false)}
        size="lg"
        title="Bulk dunning preparation"
        description={actionRequiredInvoices.length + ' invoice' + (actionRequiredInvoices.length === 1 ? '' : 's') + ' require attention within the current collection window.'}
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <button type="button" onClick={() => setDunningOpen(false)} className={actionClass}>Close</button>
            <button type="button" onClick={() => {
              const csv = [['Invoice #', 'Client', 'Due Date', 'Outstanding'], ...actionRequiredInvoices.map(({ invoice }) => [
                invoice.invoiceNumber,
                invoice.clientCompany || invoice.clientName,
                invoice.dueDate,
                Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0)))
              ])].map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
              void navigator.clipboard?.writeText(csv);
              showNotice('success', 'Dunning list copied to clipboard.');
            }} className={primaryClass}><Copy size={14} />Copy dunning list</button>
          </div>
        }
      >
        <div className="space-y-2">
          {actionRequiredInvoices.map(({ invoice, daysUntilDue }) => (
            <div key={invoice.id} className="flex items-center justify-between gap-3 rounded-control border border-line bg-bg px-3 py-3">
              <div className="min-w-0"><p className="truncate text-xs font-medium text-fg">{invoice.invoiceNumber} · {invoice.clientCompany || invoice.clientName}</p><p className="mt-0.5 text-[10px] text-muted">{isPastDueInvoice(invoice) ? Math.abs(daysUntilDue) + ' days overdue' : 'Due in ' + daysUntilDue + ' days'} · {invoice.dueDate}</p></div>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-fg">{formatNativeAmount(Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0))), invoice.currency, true)}</span>
            </div>
          ))}
        </div>
      </Modal>

      <Drawer
        open={quotationModalOpen}
        onClose={() => {
          if (!quotationSaving) {
            setQuotationModalOpen(false);
            resetQuotationForm();
          }
        }}
        size="lg"
        title={editingQuotation ? 'Edit quotation' : 'Create quotation'}
        description="Create a commercial quotation from the Finance workspace. Demo mode keeps the record local until server data is available."
        closeOnOutsideClick={!quotationSaving}
        footer={
          <>
            <button type="button" onClick={() => { setQuotationModalOpen(false); resetQuotationForm(); }} className={actionClass} disabled={quotationSaving}>Cancel</button>
            <button type="submit" form="finance-quotation-form" className={primaryClass} disabled={quotationSaving}>
              {quotationSaving ? 'Saving...' : editingQuotation ? 'Save quotation' : 'Create quotation'}
            </button>
          </>
        }
      >
        <form id="finance-quotation-form" onSubmit={saveQuotation} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="finance-quotation-title" className="mb-1.5 block text-xs font-medium text-muted">Quotation title *</label>
              <input id="finance-quotation-title" required maxLength={180} value={quotationTitle} onChange={(event) => setQuotationTitle(event.target.value)} className={fieldClass} placeholder="e.g. Enterprise website redesign" />
            </div>
            <div>
              <label htmlFor="finance-quotation-client" className="mb-1.5 block text-xs font-medium text-muted">Client name *</label>
              <input id="finance-quotation-client" required maxLength={120} value={quotationClientName} onChange={(event) => setQuotationClientName(event.target.value)} className={fieldClass} placeholder="Contact name" />
            </div>
            <div>
              <label htmlFor="finance-quotation-company" className="mb-1.5 block text-xs font-medium text-muted">Company *</label>
              <input id="finance-quotation-company" required maxLength={160} value={quotationClientCompany} onChange={(event) => setQuotationClientCompany(event.target.value)} className={fieldClass} placeholder="Company / account" />
            </div>
            <div>
              <label htmlFor="finance-quotation-amount" className="mb-1.5 block text-xs font-medium text-muted">Starting amount</label>
              <input id="finance-quotation-amount" min="0" max="1000000000000" step="0.01" type="number" value={quotationAmount || ''} onChange={(event) => setQuotationAmount(Number(event.target.value))} className={fieldClass} />
              <p className="mt-1 text-[10px] text-muted">Use line items below for the final commercial value.</p>
            </div>
            <div>
              <label htmlFor="finance-quotation-valid-until" className="mb-1.5 block text-xs font-medium text-muted">Valid until *</label>
              <input id="finance-quotation-valid-until" required type="date" value={quotationValidUntil} onChange={(event) => setQuotationValidUntil(event.target.value)} className={fieldClass} />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-fg">Line items</p>
                  <p className="mt-1 text-[10px] text-muted">Define the billable scope, quantities, and unit rates.</p>
                </div>
                <button type="button" onClick={addQuotationItem} className={actionClass + ' h-8 min-h-8 px-2.5'}><Plus size={13}/>Add item</button>
              </div>
              <div className="mt-3 space-y-2">
                {quotationItems.map((item, index) => (
                  <div key={item.id} className="rounded-control border border-line bg-bg p-3">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_80px_minmax(140px,0.8fr)_auto]">
                      <input value={item.description} onChange={(event) => updateQuotationItem(index, { description: event.target.value })} className={fieldClass} placeholder="Deliverable / scope item" aria-label={'Quotation item ' + (index + 1)} />
                      <input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateQuotationItem(index, { quantity: Number(event.target.value) })} className={fieldClass} aria-label={'Quantity for item ' + (index + 1)} />
                      <input type="number" min="0" step="0.01" value={item.unitPrice || ''} onChange={(event) => updateQuotationItem(index, { unitPrice: Number(event.target.value) })} className={fieldClass} aria-label={'Unit price for item ' + (index + 1)} />
                      <button type="button" onClick={() => removeQuotationItem(index)} disabled={quotationItems.length === 1} className="inline-flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-30" aria-label={'Remove item ' + (index + 1)}><Trash2 size={14}/></button>
                    </div>
                    <div className="mt-2 flex justify-end text-[11px] tabular-nums text-muted">{formatNativeAmount(item.amount || 0, currency, true)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="finance-quotation-discount" className="mb-1.5 block text-xs font-medium text-muted">Discount %</label>
              <input id="finance-quotation-discount" min="0" max="100" step="0.01" type="number" value={quotationDiscountPercent} onChange={(event) => setQuotationDiscountPercent(Number(event.target.value))} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="finance-quotation-tax" className="mb-1.5 block text-xs font-medium text-muted">Tax %</label>
              <input id="finance-quotation-tax" min="0" max="100" step="0.01" type="number" value={quotationTaxPercent} onChange={(event) => setQuotationTaxPercent(Number(event.target.value))} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="finance-quotation-payment-terms" className="mb-1.5 block text-xs font-medium text-muted">Payment terms</label>
              <input id="finance-quotation-payment-terms" maxLength={240} value={quotationPaymentTerms} onChange={(event) => setQuotationPaymentTerms(event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="finance-quotation-notes" className="mb-1.5 block text-xs font-medium text-muted">Notes</label>
              <input id="finance-quotation-notes" maxLength={1000} value={quotationNotes} onChange={(event) => setQuotationNotes(event.target.value)} className={fieldClass} />
            </div>
            {editingQuotation && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Status</label>
                <CustomSelect
                  value={quotationStatus}
                  onChange={(value) => setQuotationStatus(value as FinanceQuotationStatus)}
                  options={getQuotationStatusOptions(editingQuotation?.status || quotationStatus)}
                  className="w-full"
                  triggerClassName="h-10 min-h-10 w-full"
                />
              </div>
            )}
          </div>
          <div className="rounded-card border border-line bg-bg px-4 py-3">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between gap-3"><span className="text-muted">Subtotal</span><span className="tabular-nums text-fg">{formatNativeAmount(quotationPreviewTotals.subtotal, currency, true)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted">Discount</span><span className="tabular-nums text-fg">- {formatNativeAmount(quotationPreviewTotals.discountAmount, currency, true)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted">Tax</span><span className="tabular-nums text-fg">{formatNativeAmount(quotationPreviewTotals.taxAmount, currency, true)}</span></div>
              <div className="flex justify-between gap-3 border-t border-line pt-2 font-semibold"><span className="text-fg">Preview total</span><span className="tabular-nums text-fg">{formatNativeAmount(quotationPreviewTotals.total, currency, true)}</span></div>
            </div>
            <p className="mt-2 text-[10px] text-muted">Currency follows the active Finance currency switch.</p>
          </div>
        </form>
      </Drawer>

      <Modal
        open={!!quotationDetail}
        onClose={() => setQuotationDetail(null)}
        size="lg"
        title={quotationDetail ? quotationDetail.quotationNumber : 'Quotation'}
        description={quotationDetail ? quotationDetail.clientCompany : undefined}
        footer={
          quotationDetail ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => openEditQuotation(quotationDetail)} className={actionClass}><Edit3 size={14} />Edit</button>
                <button type="button" onClick={() => exportQuotationsCsv()} className={actionClass}><Download size={14} />Export list</button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void convertQuotationToInvoice(quotationDetail)} disabled={Boolean(quotationDetail.invoiceId) || quotationDetail.status !== 'approved'} className={primaryClass}>
                  <Receipt size={14} />
                  {quotationDetail.invoiceId ? 'Invoice linked' : 'Convert to invoice'}
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        {quotationDetail && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 rounded-card border border-line bg-bg p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-muted">Quotation</p>
                <p className="mt-1 text-lg font-semibold text-fg">{quotationDetail.quotationNumber}</p>
                <p className="mt-1 text-xs text-muted">{quotationDetail.title}</p>
              </div>
              <span className="inline-flex min-h-7 items-center rounded-badge border border-line bg-panel px-2 py-1 text-xs font-semibold text-fg">{quotationStatusLabel(quotationDetail.status)}</span>
            </div>
            {quotationDetail.items?.length ? (
              <div className="rounded-card border border-line bg-panel overflow-hidden">
                <div className="border-b border-line p-4"><h2 className="text-sm font-semibold text-fg">Commercial scope</h2><p className="mt-1 text-xs text-muted">Line items used to build the quoted value.</p></div>
                <div className="overflow-x-auto">
                  <table className="ams-finance-table min-w-[620px] border-separate border-spacing-0 text-xs">
                    <thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead>
                    <tbody>{quotationDetail.items.map((item) => <tr key={item.id}><td>{item.description}</td><td className="text-right tabular-nums">{item.quantity}</td><td className="text-right tabular-nums">{formatNativeAmount(item.unitPrice, quotationDetail.currency, true)}</td><td className="text-right tabular-nums font-semibold">{formatNativeAmount(item.amount, quotationDetail.currency, true)}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            ) : null}
            {(quotationDetail.paymentTerms || quotationDetail.notes) && (
              <div className="rounded-card border border-line bg-bg p-4 text-xs">
                {quotationDetail.paymentTerms && <div><p className="text-[10px] text-muted">Payment terms</p><p className="mt-1 text-fg">{quotationDetail.paymentTerms}</p></div>}
                {quotationDetail.notes && <div className={quotationDetail.paymentTerms ? 'mt-3 border-t border-line pt-3' : ''}><p className="text-[10px] text-muted">Notes</p><p className="mt-1 whitespace-pre-line leading-5 text-muted">{quotationDetail.notes}</p></div>}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] uppercase tracking-[0.08em] text-muted">Client</p><p className="mt-1 text-sm font-medium text-fg">{quotationDetail.clientCompany}</p><p className="mt-0.5 text-xs text-muted">{quotationDetail.clientName}</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] uppercase tracking-[0.08em] text-muted">Commercial value</p><p className="mt-1 text-sm font-semibold tabular-nums text-fg">{formatNativeAmount(quotationDetail.total, quotationDetail.currency, true)}</p><p className="mt-0.5 text-xs text-muted">Valid until {quotationDetail.validUntil}</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] uppercase tracking-[0.08em] text-muted">Owner</p><div className="mt-1"><ProfileIdentity profile={{ name: quotationDetail.owner, role: undefined, contextLabel: 'Quotation owner' }} showRole={false} /></div></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] uppercase tracking-[0.08em] text-muted">Created</p><p className="mt-1 text-sm font-medium text-fg">{quotationDetail.createdAt}</p></div>
            </div>
            <div className="rounded-card border border-line bg-panel p-4">
              <p className="text-xs font-semibold text-fg">Next actions</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {([
                  ['review', 'Internal review'],
                  ['approved', 'Approve'],
                  ['sent', 'Mark sent']
                ] as Array<[FinanceQuotationStatus, string]>).map(([status, label]) => (
                  <button key={status} type="button" onClick={() => void updateQuotationStatus(quotationDetail, status)} className={actionClass + ' w-full'} disabled={!canManageInvoices}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Drawer
        open={vendorPaymentModalOpen}
        onClose={() => !savingVendorPayment && setVendorPaymentModalOpen(false)}
        size="md"
        title="Record vendor payment"
        description="Record an outgoing vendor payment through the existing Finance expense ledger."
        closeOnOutsideClick={!savingVendorPayment}
        footer={
          <>
            <button type="button" onClick={() => setVendorPaymentModalOpen(false)} className={actionClass} disabled={savingVendorPayment}>Cancel</button>
            <button type="submit" form="vendor-payment-form" className={primaryClass} disabled={savingVendorPayment || !vendorPaymentVendorId || !vendorPaymentContractId}>
              {savingVendorPayment ? 'Saving...' : 'Record payment'}
            </button>
          </>
        }
      >
        <form id="vendor-payment-form" onSubmit={handleSaveVendorPayment} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Vendor *</label>
              <CustomSelect
                value={vendorPaymentVendorId}
                onChange={(value) => {
                  setVendorPaymentVendorId(value);
                  const nextVendor = vendors.find((item) => item.id === value);
                  const nextContract = nextVendor?.contracts.find((item) => item.status === 'active' && item.currency === currency) || nextVendor?.contracts.find((item) => item.currency === currency);
                  setVendorPaymentContractId(nextContract?.id || '');
                  setVendorPaymentAmount(Number(nextContract?.rateAmount || 0));
                }}
                options={vendors.filter((vendor) => vendor.contracts.some((contract) => contract.status !== 'terminated' && contract.currency === currency)).map((vendor) => ({value:vendor.id,label:vendor.name}))}
                className="w-full"
                triggerClassName="h-10 min-h-10 w-full"
                aria-label="Vendor"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Contract *</label>
              <CustomSelect
                value={vendorPaymentContractId}
                onChange={(value) => {
                  setVendorPaymentContractId(value);
                  const contract = selectedVendorContracts.find((item) => item.id === value);
                  if (contract) setVendorPaymentAmount(Math.max(0, Number(contract.rateAmount || 0)));
                }}
                options={selectedVendorContracts.map((contract) => ({value:contract.id,label:contract.title}))}
                className="w-full"
                triggerClassName="h-10 min-h-10 w-full"
                aria-label="Contract"
              />
            </div>
            <div>
              <label htmlFor="vendor-payment-amount" className="mb-1.5 block text-xs font-medium text-muted">Payment amount *</label>
              <input id="vendor-payment-amount" type="number" min="0.01" step="0.01" value={vendorPaymentAmount || ''} onChange={(event) => setVendorPaymentAmount(Number(event.target.value))} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="vendor-payment-date" className="mb-1.5 block text-xs font-medium text-muted">Payment date *</label>
              <input id="vendor-payment-date" type="date" value={vendorPaymentDate} onChange={(event) => setVendorPaymentDate(event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="vendor-payment-reference" className="mb-1.5 block text-xs font-medium text-muted">Reference</label>
              <input id="vendor-payment-reference" value={vendorPaymentReference} onChange={(event) => setVendorPaymentReference(event.target.value)} className={fieldClass} placeholder="Bank reference / transaction ID" />
            </div>
            <div>
              <label htmlFor="vendor-payment-notes" className="mb-1.5 block text-xs font-medium text-muted">Notes</label>
              <input id="vendor-payment-notes" value={vendorPaymentNotes} onChange={(event) => setVendorPaymentNotes(event.target.value)} className={fieldClass} placeholder="Optional payment note" />
            </div>
          </div>

          {selectedVendorForPayment && vendorPaymentContractId && (
            <div className="rounded-card border border-line bg-bg p-4">
              <div className="flex items-start gap-3">
                <ProfileIdentity profile={{ id: selectedVendorForPayment.id, name: selectedVendorForPayment.name, role: selectedVendorForPayment.type === 'freelancer' ? 'Freelancer' : 'Agency partner', division: selectedVendorForPayment.primaryCategory }} showRole={false}/>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-fg">{selectedVendorForPayment.companyName || selectedVendorForPayment.name}</div>
                  <div className="mt-1 text-[10px] text-muted">{selectedVendorContracts.find((contract) => contract.id === vendorPaymentContractId)?.title || 'Selected contract'}</div>
                  <div className="mt-2 text-sm font-semibold tabular-nums text-fg">{formatNativeAmount(vendorPaymentAmount, currency, true)}</div>
                </div>
              </div>
            </div>
          )}
        </form>
      </Drawer>

      <Modal
        open={!!vendorPaymentDetail}
        onClose={() => setVendorPaymentDetail(null)}
        size="md"
        title={vendorPaymentDetail?.vendor.name || 'Vendor payment'}
        description={vendorPaymentDetail?.contract.title}
        footer={vendorPaymentDetail ? (
          <div className="flex w-full items-center justify-between gap-2">
            <button type="button" onClick={() => setVendorPaymentDetail(null)} className={actionClass}>Close</button>
            {canManageInvoices && vendorPaymentDetail.status !== 'paid' && <button type="button" onClick={() => openVendorPaymentModal(vendorPaymentDetail)} className={primaryClass}><Check size={14}/>Record payment</button>}
          </div>
        ) : undefined}
      >
        {vendorPaymentDetail && (
          <div className="space-y-4">
            <div className="rounded-card border border-line bg-bg p-4">
              <ProfileIdentity profile={{ id: vendorPaymentDetail.vendor.id, name: vendorPaymentDetail.vendor.name, role: vendorPaymentDetail.vendor.type === 'freelancer' ? 'Freelancer' : 'Agency partner', division: vendorPaymentDetail.vendor.primaryCategory }} showRole={false}/>
              <p className="mt-2 text-xs text-muted">{vendorPaymentDetail.vendor.companyName || vendorPaymentDetail.vendor.email}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Contract</p><p className="mt-1 text-xs font-medium text-fg">{vendorPaymentDetail.contract.title}</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Due date</p><p className="mt-1 text-xs font-medium text-fg">{vendorPaymentFormatDate(vendorPaymentDetail.dueDate)}</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Contract value</p><p className="mt-1 text-xs font-semibold tabular-nums text-fg">{formatNativeAmount(vendorPaymentDetail.amount, currency, true)}</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Paid</p><p className="mt-1 text-xs font-semibold tabular-nums text-success">{formatNativeAmount(vendorPaymentDetail.paidAmount, currency, true)}</p></div>
            </div>
            <div className="rounded-card border border-line bg-bg p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Outstanding</span>
                <span className="text-sm font-semibold tabular-nums text-fg">{formatNativeAmount(Math.max(0, vendorPaymentDetail.amount - vendorPaymentDetail.paidAmount), currency, true)}</span>
              </div>
              <div className="mt-3"><span className={'inline-flex rounded-badge border px-2 py-1 text-[10px] font-semibold ' + vendorPaymentStatusTone[vendorPaymentDetail.status]}>{vendorPaymentStatusLabel[vendorPaymentDetail.status]}</span></div>
            </div>
          </div>
        )}
      </Modal>

      <Drawer
        open={invoiceModalOpen}
        onClose={() => {
          requestCloseInvoice();
        }}
        size="xl"
        title={editingInvoice ? 'Edit invoice' : 'Create invoice'}
        description="Review billing, client, project, and payment terms before saving the invoice."
        closeOnOutsideClick={!savingInvoice && !invoiceDirty}
        footer={
          <>
            <button type="button" onClick={() => {
              requestCloseInvoice();
            }} className={actionClass} disabled={savingInvoice}>Cancel</button>
            <button type="submit" form="finance-invoice-form" className={primaryClass} disabled={savingInvoice}>{savingInvoice ? 'Saving...' : 'Save invoice'}</button>
          </>
        }
      >
        <form id="finance-invoice-form" onSubmit={handleSaveInvoice} onChange={() => setInvoiceDirty(true)} className="space-y-5">
          {invoiceBillingLocked && (
            <div className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning/10 px-5 py-3 text-xs text-fg" role="note">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-warning" />
              <div>
                <p className="font-medium">Billing fields are locked</p>
                <p className="mt-1 leading-5 text-muted">This invoice has recorded payment activity. Client linkage, currency, amounts, tax, discount, and invoice dates cannot be changed.</p>
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="finance-invoice-number" className="mb-1.5 block text-xs font-medium text-muted">Invoice number</label>
              <input id="finance-invoice-number"
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                readOnly={Boolean(editingInvoice)}
                maxLength={80}
                className={fieldClass + (editingInvoice ? ' cursor-default text-muted' : '')}
                placeholder="Generated automatically"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Currency</label>
              <CustomSelect aria-label="Invoice currency" disabled={invoiceBillingLocked} value={invoiceCurrency} onChange={(value) => { setInvoiceDirty(true); setInvoiceCurrency(value as CurrencyCode); }} options={[{ value: 'IDR', label: 'IDR' }, { value: 'USD', label: 'USD' }]} className="w-full" triggerClassName="h-10 min-h-10 w-full" />
            </div>
          </div>

          <div className="grid gap-4 rounded-card border border-line bg-bg p-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Client record</label>
              <CustomSelect aria-label="Client record"
                disabled={invoiceBillingLocked}
                value={clientId}
                onChange={selectClient}
                options={[{ value: '', label: 'Manual client details' }, ...clients.map((client) => ({ value: client.id, label: client.company + ' · ' + client.name }))]}
                className="w-full"
                triggerClassName="h-10 min-h-10 w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Project</label>
              <CustomSelect aria-label="Project"
                disabled={invoiceBillingLocked}
                value={projectId}
                onChange={selectProject}
                options={[{ value: '', label: 'No project linked' }, ...projects.map((project) => ({ value: project.id, label: project.name }))]}
                className="w-full"
                triggerClassName="h-10 min-h-10 w-full"
              />
            </div>
            <div>
              <label htmlFor="finance-client-name" className="mb-1.5 block text-xs font-medium text-muted">Client name *</label>
              <input id="finance-client-name" required disabled={invoiceBillingLocked} maxLength={160} value={clientName} onChange={(event) => setClientName(event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="finance-client-company" className="mb-1.5 block text-xs font-medium text-muted">Company *</label>
              <input id="finance-client-company" required disabled={invoiceBillingLocked} maxLength={200} value={clientCompany} onChange={(event) => setClientCompany(event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="finance-client-email" className="mb-1.5 block text-xs font-medium text-muted">Email</label>
              <input id="finance-client-email" type="email" disabled={invoiceBillingLocked} maxLength={254} value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="finance-client-phone" className="mb-1.5 block text-xs font-medium text-muted">Phone</label>
              <input id="finance-client-phone" disabled={invoiceBillingLocked} maxLength={40} value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} className={fieldClass} />
            </div>
          </div>

          <section className="rounded-card border border-line bg-panel">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div><h3 className="text-sm font-semibold text-fg">Line items</h3><p className="mt-1 text-[11px] text-muted">Totals are calculated from the existing finance utility.</p></div>
              <button type="button" onClick={() => { setInvoiceDirty(true); setInvoiceItems((items) => items.length >= 100 ? items : [...items, emptyLineItem()]); }} disabled={invoiceBillingLocked || invoiceItems.length >= 100} className={actionClass}><Plus size={13} />Add item</button>
            </div>
            <div className="space-y-3 p-4">
              {invoiceItems.map((item, index) => (
                <div key={item.id} className="grid gap-3 rounded-control border border-line bg-bg p-3 sm:grid-cols-[minmax(0,1fr)_90px_150px_40px]">
                  <div><label htmlFor={`finance-item-${item.id}-description`} className="mb-1.5 block text-[11px] text-muted">Description *</label><input id={`finance-item-${item.id}-description`} required disabled={invoiceBillingLocked} maxLength={500} value={item.description} onChange={(event) => updateLineItem(index, { description: event.target.value })} className={fieldClass} /></div>
                  <div><label htmlFor={`finance-item-${item.id}-qty`} className="mb-1.5 block text-[11px] text-muted">Qty</label><input id={`finance-item-${item.id}-qty`} disabled={invoiceBillingLocked} type="number" min="0.01" max="100000" step="0.01" value={item.quantity} onChange={(event) => updateLineItem(index, { quantity: Number(event.target.value) })} className={fieldClass} /></div>
                  <div><label htmlFor={`finance-item-${item.id}-unit-price`} className="mb-1.5 block text-[11px] text-muted">Unit price</label><input id={`finance-item-${item.id}-unit-price`} disabled={invoiceBillingLocked} type="number" min="0" max="10000000000" step="0.01" value={item.unitPrice} onChange={(event) => updateLineItem(index, { unitPrice: Number(event.target.value) })} className={fieldClass} /></div>
                  <div className="flex items-end"><button type="button" disabled={invoiceBillingLocked || invoiceItems.length === 1} onClick={() => { setInvoiceDirty(true); setInvoiceItems((items) => items.filter((_, itemIndex) => itemIndex !== index)); }} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-control border border-line text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger disabled:opacity-40" aria-label="Remove line item"><Trash2 size={14} /></button></div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="finance-discount" className="mb-1.5 block text-xs font-medium text-muted">Discount %</label><input id="finance-discount" disabled={invoiceBillingLocked} type="number" min="0" max="100" step="0.01" value={discountPercent} onChange={(event) => setDiscountPercent(Number(event.target.value))} className={fieldClass} /></div>
                <div><label htmlFor="finance-tax" className="mb-1.5 block text-xs font-medium text-muted">Tax %</label><input id="finance-tax" disabled={invoiceBillingLocked} type="number" min="0" max="100" step="0.01" value={taxPercent} onChange={(event) => setTaxPercent(Number(event.target.value))} className={fieldClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="finance-issue-date" className="mb-1.5 block text-xs font-medium text-muted">Issue date</label><input id="finance-issue-date" disabled={invoiceBillingLocked} type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} className={fieldClass} /></div>
                <div><label htmlFor="finance-due-date" className="mb-1.5 block text-xs font-medium text-muted">Due date</label><input id="finance-due-date" disabled={invoiceBillingLocked} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={fieldClass} /></div>
              </div>
              <div><label htmlFor="finance-payment-terms" className="mb-1.5 block text-xs font-medium text-muted">Payment terms</label><input id="finance-payment-terms" maxLength={500} value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} className={fieldClass} placeholder="e.g. Net 14" /></div>
              <div><label htmlFor="finance-invoice-notes" className="mb-1.5 block text-xs font-medium text-muted">Notes</label><textarea id="finance-invoice-notes" maxLength={5000} value={invoiceNotes} onChange={(event) => setInvoiceNotes(event.target.value)} rows={4} className={fieldClass + ' py-2.5'} /></div>
            </div>
            <div className="self-start rounded-card border border-line bg-bg p-4 lg:sticky lg:top-3">
              <div className="flex items-center justify-between"><span className="text-xs text-muted">Subtotal</span><span className="tabular-nums text-sm text-fg">{formatNativeAmount(invoiceTotals.subtotal, invoiceCurrency)}</span></div>
              <div className="mt-2 flex items-center justify-between"><span className="text-xs text-muted">Discount</span><span className="tabular-nums text-sm text-fg">- {formatNativeAmount(invoiceTotals.discountAmount, invoiceCurrency)}</span></div>
              <div className="mt-2 flex items-center justify-between"><span className="text-xs text-muted">Tax</span><span className="tabular-nums text-sm text-fg">{formatNativeAmount(invoiceTotals.taxAmount, invoiceCurrency)}</span></div>
              <div className="mt-4 flex items-end justify-between gap-4 border-t border-line pt-4"><span className="text-sm font-semibold text-fg">Total</span><span className="text-lg font-medium tabular-nums text-fg">{formatNativeAmount(invoiceTotals.total, invoiceCurrency)}</span></div>
              <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-muted">Status</label>
              {editingInvoice && !['draft', 'sent', 'overdue'].includes(editingInvoice.status) ? (
                <div className="flex min-h-10 items-center rounded-control border border-line bg-bg px-3">
                  <StatusBadge status={editingInvoice.status} />
                  <span className="ml-2 text-[11px] text-muted">Controlled by the payment/cancellation workflow.</span>
                </div>
              ) : (
                <CustomSelect
                  value={invoiceStatus}
                  onChange={(value) => { setInvoiceDirty(true); setInvoiceStatus(value as InvoiceStatus); }}
                  options={[{ value: 'draft', label: 'Draft' }, { value: 'sent', label: 'Sent' }, { value: 'overdue', label: 'Overdue' }]}
                  className="w-full"
                  triggerClassName="h-10 min-h-10 w-full"
                />
              )}
            </div>
            </div>
          </div>
        </form>
      </Drawer>

      <Drawer
        open={expenseModalOpen}
        onClose={() => {
          requestCloseExpense();
        }}
        size="md"
        title="Record expense"
        description="Record an actual expense against the selected currency ledger."
        closeOnOutsideClick={!savingExpense && !expenseDirty}
        footer={
          <>
            <button type="button" onClick={() => {
              requestCloseExpense();
            }} className={actionClass} disabled={savingExpense}>Cancel</button>
            <button type="submit" form="finance-expense-form" className={primaryClass} disabled={savingExpense}>{savingExpense ? 'Saving...' : 'Save expense'}</button>
          </>
        }
      >
        <form id="finance-expense-form" onSubmit={handleSaveExpense} onChange={() => setExpenseDirty(true)} className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="mb-1.5 block text-xs font-medium text-muted">Type</span>
              <span className="mb-1.5 rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] font-semibold text-muted">{currency}</span>
            </div>
            <CustomSelect aria-label="Expense type" value={expenseType} onChange={(value) => { setExpenseDirty(true); setExpenseType(value as 'OpEx' | 'CapEx' | 'Rentals'); }} options={[{ value: 'OpEx', label: 'OpEx' }, { value: 'CapEx', label: 'CapEx' }, { value: 'Rentals', label: 'Rentals' }]} className="w-full" triggerClassName="h-10 min-h-10 w-full" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted">Category</label><CustomSelect aria-label="Expense category" value={expenseCategory} onChange={(value) => { setExpenseDirty(true); setExpenseCategory(value as AgencyExpense['category']); }} options={['Software & Cloud','Salaries & Contractors','Office & Hardware','Office & Rentals','Marketing & Ads','Legal & Admin','CapEx Equipment'].map((value) => ({ value, label: value }))} className="w-full" triggerClassName="h-10 min-h-10 w-full" /></div>
          <div><label htmlFor="finance-expense-description" className="mb-1.5 block text-xs font-medium text-muted">Description *</label><input id="finance-expense-description" required maxLength={500} value={expenseDescription} onChange={(event) => setExpenseDescription(event.target.value)} className={fieldClass} /></div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Project</label>
            <CustomSelect aria-label="Expense project" value={expenseProjectId} onChange={(value) => { setExpenseDirty(true); setExpenseProjectId(value); }} options={[{ value: '', label: 'Unassigned' }, ...projects.map((project) => ({ value: project.id, label: project.name }))]} className="w-full" triggerClassName="h-10 min-h-10 w-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Recurring</label>
              <CustomSelect aria-label="Recurring interval" value={expenseRecurringInterval || 'none'} onChange={(value) => { setExpenseDirty(true); setExpenseRecurringInterval(value as AgencyExpense['recurringInterval']); }} options={[{ value: 'none', label: 'One-time' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }]} className="w-full" triggerClassName="h-10 min-h-10 w-full" />
            </div>
            <div>
              <label htmlFor="finance-expense-receipt" className="mb-1.5 block text-xs font-medium text-muted">Receipt / document link</label>
              <input id="finance-expense-receipt" type="url" maxLength={1000} value={expenseReceiptUrl} onChange={(event) => setExpenseReceiptUrl(event.target.value)} className={fieldClass} placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="finance-expense-amount" className="mb-1.5 block text-xs font-medium text-muted">Amount *</label><input id="finance-expense-amount" required type="number" min="0.01" max="100000000000" step="0.01" value={expenseAmount} onChange={(event) => setExpenseAmount(Number(event.target.value))} className={fieldClass} /></div>
            <div><label htmlFor="finance-expense-date" className="mb-1.5 block text-xs font-medium text-muted">Date *</label><input id="finance-expense-date" required type="date" max={getDateInputValue()} value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} className={fieldClass} /></div>
          </div>
        </form>
      </Drawer>

      <Modal
        open={!!expenseDetail}
        onClose={() => setExpenseDetail(null)}
        size="md"
        title={expenseDetail?.description || 'Expense detail'}
        description={expenseDetail ? expenseDetail.category : undefined}
        footer={<button type="button" onClick={() => setExpenseDetail(null)} className={actionClass}>Close</button>}
      >
        {expenseDetail && (
          <div className="space-y-4">
            <div className="rounded-card border border-line bg-bg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-fg">{expenseDetail.description}</p>
                  <p className="mt-1 text-xs text-muted">{expenseDetail.category} · {expenseDetail.type || 'OpEx'}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-fg">{formatNativeAmount(expenseDetail.amount, expenseDetail.currency || currency, true)}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><p className="text-[10px] text-muted">Date</p><p className="mt-1 text-xs tabular-nums text-fg">{expenseDetail.date}</p></div>
              <div><p className="text-[10px] text-muted">Recorded by</p><p className="mt-1 text-xs text-fg">{expenseDetail.recordedBy || 'Finance'}</p></div>
              <div><p className="text-[10px] text-muted">Recurring</p><p className="mt-1 text-xs text-fg">{expenseDetail.recurringInterval && expenseDetail.recurringInterval !== 'none' ? expenseDetail.recurringInterval : 'One-time'}</p></div>
              <div><p className="text-[10px] text-muted">Receipt</p>{expenseDetail.receiptUrl ? <a href={expenseDetail.receiptUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs text-accent-text hover:underline">Open document</a> : <p className="mt-1 text-xs text-muted">Not attached</p>}</div>
            </div>
          </div>
        )}
      </Modal>

      <Drawer
        open={!!paymentInvoice}
        onClose={() => {
          requestClosePayment();
        }}
        size="md"
        title="Record payment"
        description={paymentInvoice ? paymentInvoice.invoiceNumber + ' · ' + paymentInvoice.clientCompany : undefined}
        closeOnOutsideClick={!savingPayment && !paymentDirty}
        footer={
          <>
            <button type="button" onClick={() => {
              requestClosePayment();
            }} className={actionClass} disabled={savingPayment}>Cancel</button>
            <button type="submit" form="finance-payment-form" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control bg-success px-3.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={savingPayment}><Check size={14} />{savingPayment ? 'Saving...' : 'Record payment'}</button>
          </>
        }
      >
        {paymentInvoice && (
          <form id="finance-payment-form" onSubmit={handlePayment} onChange={() => setPaymentDirty(true)} className="space-y-4">
            <div className="rounded-card border border-line bg-bg p-4">
              <div className="flex justify-between gap-3 text-xs"><span className="text-muted">Invoice total</span><span className="tabular-nums text-fg">{formatNativeAmount(paymentInvoice.total, paymentInvoice.currency)}</span></div>
              <div className="mt-2 flex justify-between gap-3 text-xs"><span className="text-muted">Already paid</span><span className="tabular-nums text-success">{formatNativeAmount(paymentInvoice.amountPaid || 0, paymentInvoice.currency)}</span></div>
              <div className="mt-3 flex justify-between gap-3 border-t border-line pt-3 text-xs font-semibold"><span className="text-fg">Remaining balance</span><span className="tabular-nums text-warning">{formatNativeAmount(paymentInvoice.balanceDue ?? (paymentInvoice.total - (paymentInvoice.amountPaid || 0)), paymentInvoice.currency)}</span></div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="finance-payment-amount" className="mb-1.5 block text-xs font-medium text-muted">Amount received</label>
                <span className="mb-1.5 text-[11px] tabular-nums text-muted">Up to {formatNativeAmount(Number(paymentInvoice.balanceDue ?? (paymentInvoice.total - (paymentInvoice.amountPaid || 0))), paymentInvoice.currency)}</span>
              </div>
              <div className="flex items-center gap-2">
                <input id="finance-payment-amount" required min="0.01" type="number" step="0.01" max={Number(paymentInvoice.balanceDue ?? (paymentInvoice.total - (paymentInvoice.amountPaid || 0)))} value={paymentAmount} onChange={(event) => setPaymentAmount(Number(event.target.value))} className={fieldClass} />
                <button type="button" onClick={() => setPaymentAmount(Number(paymentInvoice.balanceDue ?? (paymentInvoice.total - (paymentInvoice.amountPaid || 0))))} className={actionClass + ' shrink-0'}>Full balance</button>
              </div></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-xs font-medium text-muted">Payment method</label><CustomSelect aria-label="Payment method" value={paymentMethod} onChange={(value) => { setPaymentDirty(true); setPaymentMethod(value as typeof paymentMethod); }} options={[{ value: 'bank_transfer', label: 'Bank transfer' }, { value: 'credit_card', label: 'Credit card' }, { value: 'cash', label: 'Cash' }, { value: 'other', label: 'Other' }]} className="w-full" triggerClassName="h-10 min-h-10 w-full" /></div>
              <div><label htmlFor="finance-payment-date" className="mb-1.5 block text-xs font-medium text-muted">Payment date</label><input id="finance-payment-date" required type="date" max={getDateInputValue()} value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className={fieldClass} /></div>
            </div>
            <div><label htmlFor="finance-payment-reference" className="mb-1.5 block text-xs font-medium text-muted">Reference</label><input id="finance-payment-reference" maxLength={160} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className={fieldClass} placeholder="Transaction reference" /></div>
            <div><label htmlFor="finance-payment-notes" className="mb-1.5 block text-xs font-medium text-muted">Notes</label><textarea id="finance-payment-notes" maxLength={1000} value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} rows={3} className={fieldClass + ' py-2.5'} /></div>
          </form>
        )}
      </Drawer>

      <Modal
        open={!!discardPrompt}
        onClose={cancelDiscardPrompt}
        size="sm"
        title="Discard unsaved changes?"
        description={
          discardPrompt === 'invoice'
            ? 'Your invoice draft has changes that are not saved.'
            : discardPrompt === 'expense'
              ? 'Your expense draft has changes that are not saved.'
              : 'Your payment draft has changes that are not saved.'
        }
        footer={
          <>
            <button type="button" onClick={cancelDiscardPrompt} className={actionClass}>Keep editing</button>
            <button type="button" onClick={confirmDiscardPrompt} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control bg-danger px-3.5 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              <Trash2 size={14} />Discard changes
            </button>
          </>
        }
      >
        <p className="text-xs leading-5 text-muted">
          The form will close without saving. You can keep editing and return to the current draft.
        </p>
      </Modal>

      <Modal
        open={!!confirmAction}
        onClose={() => { if (!confirmingAction) setConfirmAction(null); }}
        size="sm"
        title={confirmAction?.type === 'invoice' ? 'Cancel invoice?' : 'Void expense?'}
        description={confirmAction ? confirmAction.label : undefined}
        footer={
          <>
            <button type="button" onClick={() => setConfirmAction(null)} className={actionClass}>Keep record</button>
            <button type="button" onClick={() => void confirmDelete()} disabled={confirmingAction} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control bg-danger px-3.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={14} />{confirmingAction ? 'Processing...' : 'Confirm'}</button>
          </>
        }
      >
        <p className="text-xs leading-5 text-muted">
          {confirmAction?.type === 'invoice'
            ? 'The existing finance endpoint cancels invoices rather than hard-deleting them. Invoices with recorded payments may be rejected by the server.'
            : 'The existing finance endpoint voids the expense record. It is not physically deleted from the server.'}
        </p>
      </Modal>

      <Modal
        open={!!detailInvoice}
        onClose={() => setDetailInvoice(null)}
        size="xl"
        title={detailInvoice ? detailInvoice.invoiceNumber : 'Invoice'}
        description={detailInvoice ? detailInvoice.clientCompany : undefined}
        dialogClassName="ams-invoice-preview-modal"
        footer={
          <button type="button" onClick={() => window.print()} className={actionClass}><Download size={14} />Print / Save PDF</button>
        }
      >
        {detailInvoice && (
          <div className="ams-invoice-document space-y-5">
            <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-fg">PT Kapitech Digital Indonesia</p>
                <p className="mt-1 text-xs leading-5 text-muted">Invoice detail and payment record.</p>
              </div>
              <StatusBadge status={detailInvoice.status} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs font-medium text-muted">Billed to</p><div className="mt-1"><ProfileIdentity profile={{ name: detailInvoice.clientName, contextLabel: detailInvoice.clientCompany }} showRole={false} size="sm" /></div><p className="text-xs text-muted">{detailInvoice.clientCompany}</p><p className="mt-1 text-xs text-muted">{detailInvoice.clientEmail}</p>{detailInvoice.clientPhone && <p className="text-xs text-muted">{detailInvoice.clientPhone}</p>}</div>
              <div className="sm:text-right"><p className="text-xs font-medium text-muted">Invoice metadata</p><p className="mt-1 text-xs tabular-nums text-fg">Issue {detailInvoice.issueDate}</p><p className="text-xs tabular-nums text-fg">Due {detailInvoice.dueDate}</p><p className="text-xs text-muted">{detailInvoice.currency}</p></div>
            </div>
            <div className="overflow-hidden rounded-control border border-line">
              <table className="ams-finance-table table-fixed border-separate border-spacing-0 text-xs">
                <thead><tr className="border-b border-line text-muted"><th className="w-[54%] px-3 py-2 text-left font-medium">Description</th><th className="w-[12%] px-3 py-2 text-right font-medium">Qty</th><th className="w-[17%] px-3 py-2 text-right font-medium">Unit price</th><th className="w-[17%] px-3 py-2 text-right font-medium">Amount</th></tr></thead>
                <tbody>{detailInvoice.items.map((item) => <tr key={item.id} className="border-b border-line last:border-0"><td className="px-3 py-2.5 text-fg">{item.description}</td><td className="px-3 py-2.5 text-right tabular-nums text-fg">{item.quantity}</td><td className="px-3 py-2.5 text-right tabular-nums text-fg">{formatNativeAmount(item.unitPrice, detailInvoice.currency)}</td><td className="px-3 py-2.5 text-right tabular-nums text-fg">{formatNativeAmount(item.amount, detailInvoice.currency)}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="grid gap-5 sm:grid-cols-[1fr_260px]">
              <div>
                <p className="text-xs font-medium text-muted">Payment activity</p>
                {detailInvoice.payments?.length ? (
                  <div className="mt-2 space-y-2">{detailInvoice.payments.map((payment) => <div key={payment.id} className="flex flex-col gap-1 rounded-control border border-line bg-bg p-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="text-muted">{payment.date} · {payment.method.replace('_', ' ')}{payment.reference ? ' · ' + payment.reference : ''}</span><span className="font-medium tabular-nums text-success">{formatNativeAmount(payment.amount, detailInvoice.currency)}</span></div>)}</div>
                ) : <p className="mt-2 rounded-control border border-line bg-bg p-3 text-xs text-muted">No recorded payments.</p>}
                {detailInvoice.notes && <p className="mt-3 text-xs leading-5 text-muted">{detailInvoice.notes}</p>}
                {detailInvoice.auditTrail?.length ? (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted">Activity</p>
                    <div className="mt-2 space-y-2">
                      {detailInvoice.auditTrail.slice().reverse().slice(0, 8).map((entry, index) => (
                        <div key={entry.timestamp + entry.action + index} className="flex items-start justify-between gap-3 rounded-control border border-line bg-bg px-3 py-2.5 text-[11px]">
                          <div><p className="font-medium text-fg">{entry.action}</p>{entry.user && <p className="mt-0.5 text-muted">{entry.user}</p>}{entry.note && <p className="mt-0.5 leading-4 text-muted">{entry.note}</p>}</div>
                          <span className="shrink-0 tabular-nums text-muted">{entry.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {detailInvoice.paymentTerms && <p className="mt-2 text-xs text-muted">Terms: {detailInvoice.paymentTerms}</p>}
              </div>
              <div className="rounded-card border border-line bg-bg p-4 text-xs">
                <div className="flex justify-between gap-3"><span className="text-muted">Subtotal</span><span className="tabular-nums text-fg">{formatNativeAmount(detailInvoice.subtotal, detailInvoice.currency)}</span></div>
                <div className="mt-2 flex justify-between gap-3"><span className="text-muted">Discount</span><span className="tabular-nums text-fg">- {formatNativeAmount(detailInvoice.discountAmount || 0, detailInvoice.currency)}</span></div>
                <div className="mt-2 flex justify-between gap-3"><span className="text-muted">Tax ({detailInvoice.taxPercent}%)</span><span className="tabular-nums text-fg">{formatNativeAmount(detailInvoice.taxAmount, detailInvoice.currency)}</span></div>
                <div className="mt-3 flex justify-between gap-3 border-t border-line pt-3 font-semibold"><span className="text-fg">Total</span><span className="tabular-nums text-fg">{formatNativeAmount(detailInvoice.total, detailInvoice.currency)}</span></div>
                <div className="mt-2 flex justify-between gap-3"><span className="text-muted">Paid</span><span className="tabular-nums text-success">{formatNativeAmount(detailInvoice.amountPaid || 0, detailInvoice.currency)}</span></div>
                <div className="mt-2 flex justify-between gap-3 font-semibold"><span className="text-fg">Balance due</span><span className="tabular-nums text-warning">{formatNativeAmount(detailInvoice.balanceDue ?? (detailInvoice.total - (detailInvoice.amountPaid || 0)), detailInvoice.currency)}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AdminPageShell>
  );
};

export default AdminInvoicing;
