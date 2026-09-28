import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  CalendarDays,
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
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  WalletCards,
  X
} from 'lucide-react';
import { AgencyExpense, AgencyInvoice, InvoiceLineItem, InvoiceStatus, INITIAL_DEFAULT_EXPENSES, INITIAL_DEFAULT_INVOICES, computeInvoiceTotals, computeFinancialMetrics, getMonthlyCashFlowSeries } from '../../lib/financeStore';
import { CurrencyCode, CURRENCY_EVENT, getActiveCurrency, setActiveCurrency, formatNativeAmount } from '../../lib/currency';
import { useLanguage } from '../../lib/LanguageContext';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';
import { InvoiceStatusDropdown } from '../../components/ui/InvoiceStatusDropdown';
import { hasAdminPermission } from '../../lib/adminAuth';
import { api } from '../../lib/apiClient';
import { AdminModuleHeader } from '../../components/admin/AdminModulePrimitives';


type SortKey = 'updated' | 'due' | 'oldest' | 'amount_high' | 'amount_low' | 'invoice';
type LedgerPeriod = 'reporting-quarter' | 'all';
type PaymentFilter = 'all' | 'unpaid' | 'partial' | 'paid';
type DueFilter = 'all' | 'due_soon' | 'overdue' | 'later';
type QuotationSort = 'newest' | 'oldest' | 'value_high' | 'value_low' | 'valid_until';
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
  invoiceId: string;
  invoiceNumber: string;
  clientCompany: string;
  date: string;
  amount: number;
  currency: CurrencyCode;
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

type FinanceQuotation = {
  id: string;
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
};

const STITCH_FINANCE_QUOTATIONS: FinanceQuotation[] = [
  { id: 'quote_slug_001', quotationNumber: 'QTN-2026-018', title: 'Enterprise Website Redesign & Design System', clientName: 'Nadia Wijaya', clientCompany: 'Astra Digital Ventures', total: 285000000, currency: 'IDR', status: 'sent', validUntil: '2026-10-10', createdAt: '2026-09-23', owner: 'Fikri Nurlete' },
  { id: 'quote_slug_002', quotationNumber: 'QTN-2026-017', title: 'Fintech Product UX Audit & Prototype', clientName: 'Raka Prasetyo', clientCompany: 'Finova Labs', total: 92000000, currency: 'IDR', status: 'review', validUntil: '2026-10-04', createdAt: '2026-09-21', owner: 'Strategy Team' },
  { id: 'quote_slug_003', quotationNumber: 'QTN-2026-016', title: 'Cloud Migration & Platform Hardening', clientName: 'Sarah Jenkins', clientCompany: 'Telkomsel Innovation Labs', total: 175000000, currency: 'IDR', status: 'approved', validUntil: '2026-10-16', createdAt: '2026-09-18', owner: 'Technology Team' },
  { id: 'quote_slug_004', quotationNumber: 'QTN-2026-015', title: '3D Brand Experience Sprint', clientName: 'Jessica Halim', clientCompany: 'ShopeePay Regional Tech', total: 640000000, currency: 'IDR', status: 'accepted', validUntil: '2026-09-29', createdAt: '2026-09-12', owner: 'Creative Team', invoiceId: 'slug-inv-qtn-015' },
  { id: 'quote_slug_005', quotationNumber: 'QTN-2026-014', title: 'Security Portal Discovery', clientName: 'Reza Pratama', clientCompany: 'Mandiri FinTech Division', total: 145000000, currency: 'IDR', status: 'draft', validUntil: '2026-10-22', createdAt: '2026-09-08', owner: 'Fikri Nurlete' },
  { id: 'quote_slug_006', quotationNumber: 'QTN-2026-013', title: 'React Native Commerce App', clientName: 'Kevin Wijaya', clientCompany: 'Nusa Cloud Systems', total: 128000000, currency: 'IDR', status: 'rejected', validUntil: '2026-09-26', createdAt: '2026-09-03', owner: 'Product Team' }
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
  invoiceId: raw?.invoiceId || raw?.invoice?.id || undefined
});

const StatusBadge = ({ status }: { status: InvoiceStatus }) => (
  <span className={'inline-flex items-center gap-1.5 rounded-badge border px-2 py-1 text-[11px] font-semibold ' + statusTone[status]}>
    {status === 'paid' ? <CheckCircle2 size={12} /> : status === 'overdue' ? <AlertCircle size={12} /> : status === 'partially_paid' ? <WalletCards size={12} /> : status === 'cancelled' ? <X size={12} /> : <FileText size={12} />}
    {statusLabel[status]}
  </span>
);

const FinanceMetricCard = ({
  label,
  value,
  context,
  icon,
  toneClassName = 'text-fg'
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  context?: React.ReactNode;
  icon?: React.ReactNode;
  toneClassName?: string;
}) => (
  <article className="min-w-0 rounded-card border border-line bg-panel px-4 py-3.5">
    <div className="flex items-center justify-between gap-3">
      <span className="truncate text-[11px] font-medium text-muted">{label}</span>
      {icon && <span className={'shrink-0 ' + toneClassName}>{icon}</span>}
    </div>
    <p className={'mt-1.5 truncate text-xl font-medium leading-7 tracking-[-0.02em] tabular-nums ' + toneClassName}>{value}</p>
    {context && <p className="mt-0.5 truncate text-[10px] leading-4 text-muted">{context}</p>}
  </article>
);

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
  if (!data.length) return null;
  const width = 760;
  const height = 190;
  const left = 8;
  const right = 12;
  const top = 12;
  const bottom = 20;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const values = data.flatMap((point) => [point.inflow, point.outflow, point.net]);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(1, ...values);
  const range = Math.max(1, maxValue - minValue);
  const x = (index: number) => left + (data.length === 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
  const y = (value: number) => top + ((maxValue - value) / range) * innerHeight;
  const polyline = (key: 'inflow' | 'outflow' | 'net') => data.map((point, index) => x(index) + ',' + y(point[key])).join(' ');
  const current = data[data.length - 1];
  const collected = data.reduce((sum, point) => sum + point.inflow, 0);
  const burn = data.reduce((sum, point) => sum + point.outflow, 0);
  const net = collected - burn;
  const latestCoverage = current.outflow > 0 ? (current.inflow / current.outflow) * 100 : null;
  return (
    <div className="min-w-0" role="img" aria-label={ariaLabel}>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Latest collected', value: current.inflow, tone: 'text-accent-text' },
          { label: 'Latest burn', value: current.outflow, tone: 'text-series-3' },
          { label: 'Latest net cash', value: current.net, tone: current.net >= 0 ? 'text-success' : 'text-danger' }
        ].map((item) => (
          <div key={item.label} className="min-w-0 rounded-control border border-line bg-bg px-3 py-2.5">
            <p className="truncate text-[10px] font-medium text-muted">{item.label}</p>
            <p className={'mt-1 truncate text-sm font-semibold tabular-nums ' + item.tone}>{formatNativeAmount(item.value, currency, true)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-control border border-line bg-bg p-3">
        <div className="relative h-48 w-full">
          <svg viewBox={'0 0 ' + width + ' ' + height} className="h-full w-full" preserveAspectRatio="none">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const yy = top + ratio * innerHeight;
              return <line key={ratio} x1={left} x2={width - right} y1={yy} y2={yy} stroke="var(--line)" strokeWidth="1" />;
            })}
            <line x1={left} x2={width - right} y1={y(0)} y2={y(0)} stroke="var(--line)" strokeWidth="1.4" strokeDasharray="4 4" />
            <polyline points={polyline('inflow')} fill="none" stroke="var(--series-1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={polyline('outflow')} fill="none" stroke="var(--series-3)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={polyline('net')} fill="none" stroke="var(--success)" strokeWidth="1.9" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
            {data.map((point, index) => (
              <g key={point.label}>
                <circle cx={x(index)} cy={y(point.inflow)} r="3" fill="var(--series-1)" />
                <circle cx={x(index)} cy={y(point.outflow)} r="2.5" fill="var(--series-3)" />
                <circle cx={x(index)} cy={y(point.net)} r="2.5" fill="var(--success)" />
              </g>
            ))}
          </svg>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-line pt-2 text-[10px] tabular-nums text-muted sm:grid-cols-6">
          {data.map((point) => <span key={point.label} className="truncate text-center">{point.label}</span>)}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-accent"></span>Cash collected</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-series-3"></span>Operating burn</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full border border-success bg-transparent"></span>Net cash</span>
        </div>
        <div className="tabular-nums text-fg">6-month net {formatNativeAmount(net, currency, true)} · {latestCoverage === null ? '—' : latestCoverage.toFixed(0) + '%'} cash coverage latest</div>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-muted">Cash collected is actual payments received. Operating burn is recorded expenses. Net cash is collected less burn for each month.</p>
    </div>
  );
};
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
  const [expenseSort, setExpenseSort] = useState<'date_desc' | 'date_asc' | 'amount_high' | 'amount_low'>('date_desc');
  const [invoicePage, setInvoicePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const invoicePageSize = 10;
  const expensePageSize = 10;

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
  const [incomeSearch, setIncomeSearch] = useState('');
  const [incomePage, setIncomePage] = useState(1);
  const incomePageSize = 10;
  const [quotations, setQuotations] = useState<FinanceQuotation[]>(STITCH_FINANCE_QUOTATIONS);
  const [usingDemoQuotations, setUsingDemoQuotations] = useState(true);
  const [quotationLoading, setQuotationLoading] = useState(true);
  const [quotationSearch, setQuotationSearch] = useState('');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState<'all' | FinanceQuotationStatus>('all');
  const [quotationSort, setQuotationSort] = useState<QuotationSort>('newest');
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [quotationDetail, setQuotationDetail] = useState<FinanceQuotation | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<FinanceQuotation | null>(null);
  const [quotationSaving, setQuotationSaving] = useState(false);
  const [quotationTitle, setQuotationTitle] = useState('');
  const [quotationClientName, setQuotationClientName] = useState('');
  const [quotationClientCompany, setQuotationClientCompany] = useState('');
  const [quotationAmount, setQuotationAmount] = useState(0);
  const [quotationValidUntil, setQuotationValidUntil] = useState(getDateInputValue(30));
  const [quotationStatus, setQuotationStatus] = useState<FinanceQuotationStatus>('draft');

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
      const [invoiceRes, expenseRes, metricsRes, clientRes, projectRes] = await Promise.all([
        api.finance.getInvoices(),
        api.finance.getExpenses(),
        api.finance.getMetrics(currency),
        api.clients.getAll(),
        api.projects.getAll()
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
      ? currencyExpenses.filter((expense) => isInQuarter(expense.date, reportingQuarter)).reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
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
        const collected = Array.isArray(invoice.payments) && invoice.payments.length
          ? invoice.payments.reduce((paymentSum, payment) => paymentSum + (Number(payment.amount) || 0), 0)
          : Number(invoice.amountPaid || 0);
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
    () => retainerInvoices.reduce((sum, invoice) => {
      const collected = Array.isArray(invoice.payments) && invoice.payments.length
        ? invoice.payments.reduce((paymentSum, payment) => paymentSum + (Number(payment.amount) || 0), 0)
        : Number(invoice.amountPaid || 0);
      return sum + collected;
    }, 0),
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
      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'due_soon' ? isDueSoonInvoice(invoice) : invoice.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || paymentState === paymentFilter;
      const matchesDue = dueFilter === 'all' || dueState === dueFilter;
      return matchesSearch && matchesStatus && matchesPayment && matchesDue;
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
  }, [search, statusFilter, paymentFilter, dueFilter, sort, ledgerPeriod, currency]);

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
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              clientCompany: invoice.clientCompany || invoice.clientName,
              date,
              amount: Number(payment.amount) || 0,
              currency: invoice.currency
            });
          });
        } else if (invoice.paidDate && Number(invoice.amountPaid || 0) > 0) {
          rows.push({
            id: invoice.id + '-paid',
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            clientCompany: invoice.clientCompany || invoice.clientName,
            date: invoice.paidDate,
            amount: Number(invoice.amountPaid || 0),
            currency: invoice.currency
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
    setIncomePage((page) => Math.min(page, incomePageCount));
  }, [incomePageCount]);

  const filteredExpenses = useMemo(() => {
    const query = expenseSearch.trim().toLowerCase();
    const result = currencyExpenses.filter((expense) => {
      const searchable = [expense.description, expense.category, expense.type || 'OpEx', expense.recordedBy, expense.date].join(' ').toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesType = expenseTypeFilter === 'all' || (expense.type || 'OpEx') === expenseTypeFilter;
      return matchesSearch && matchesType;
    });

    return [...result].sort((a, b) => {
      if (expenseSort === 'amount_high') return Number(b.amount) - Number(a.amount);
      if (expenseSort === 'amount_low') return Number(a.amount) - Number(b.amount);
      if (expenseSort === 'date_asc') return String(a.date || '').localeCompare(String(b.date || ''));
      return String(b.date || '').localeCompare(String(a.date || ''));
    });
  }, [currencyExpenses, expenseSearch, expenseTypeFilter, expenseSort]);

  const paginatedExpenses = useMemo(() => {
    const start = (expensePage - 1) * expensePageSize;
    return filteredExpenses.slice(start, start + expensePageSize);
  }, [filteredExpenses, expensePage]);
  const expensePageCount = Math.max(1, Math.ceil(filteredExpenses.length / expensePageSize));

  useEffect(() => {
    setExpensePage((page) => Math.min(page, expensePageCount));
  }, [expensePageCount]);

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

    const validItems = invoiceItems.map((item) => ({
      ...item,
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
        type: expenseType,
        category: expenseCategory,
        description: expenseDescription.trim(),
        amount,
        date: expenseDate,
        currency,
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

  const agingBuckets = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = [
      { label: 'Current / 0–30 Days', tone: 'success' as const, amount: 0, count: 0 },
      { label: '31–60 Days', tone: 'warning' as const, amount: 0, count: 0 },
      { label: '60+ Days', tone: 'danger' as const, amount: 0, count: 0 }
    ];

    currencyInvoices.forEach((invoice) => {
      const balance = Math.max(0, Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0))));
      if (balance <= 0) return;

      const due = new Date(String(invoice.dueDate) + 'T00:00:00');
      const daysSinceDue = Number.isNaN(due.getTime())
        ? 0
        : Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));

      const bucket = daysSinceDue <= 30 ? buckets[0] : daysSinceDue <= 60 ? buckets[1] : buckets[2];
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
    () => ledgerInvoices
      .filter((invoice) => invoice.status !== 'cancelled')
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
    [ledgerInvoices]
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

  const operatingMarginValue = serverMetrics ? Number.parseFloat(serverMetrics.profitMargin) : NaN;
  const operatingMarginHealthy = Number.isFinite(operatingMarginValue) && operatingMarginValue >= 35;

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
      .sort((a, b) => {
        if (quotationSort === 'oldest') return String(a.createdAt).localeCompare(String(b.createdAt));
        if (quotationSort === 'value_high') return b.total - a.total;
        if (quotationSort === 'value_low') return a.total - b.total;
        if (quotationSort === 'valid_until') return String(a.validUntil).localeCompare(String(b.validUntil));
        return String(b.createdAt).localeCompare(String(a.createdAt));
      });
  }, [quotations, quotationSearch, quotationStatusFilter, quotationSort]);
  const quotationMetrics = useMemo(() => ({
    total: quotations.length,
    active: quotations.filter((quotation) => ['draft', 'review', 'approved', 'sent'].includes(quotation.status)).length,
    approved: quotations.filter((quotation) => quotation.status === 'approved' && !quotation.invoiceId).length,
    accepted: quotations.filter((quotation) => quotation.status === 'accepted').length,
    value: quotations.filter((quotation) => quotation.status !== 'rejected').reduce((sum, quotation) => sum + quotation.total, 0)
  }), [quotations]);

  const resetQuotationForm = () => {
    setEditingQuotation(null);
    setQuotationTitle('');
    setQuotationClientName('');
    setQuotationClientCompany('');
    setQuotationAmount(0);
    setQuotationValidUntil(getDateInputValue(30));
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
    setQuotationValidUntil(quotation.validUntil);
    setQuotationStatus(quotation.status);
    setQuotationModalOpen(true);
  };

  const saveQuotation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageInvoices || quotationSaving) return;

    if (!quotationTitle.trim() || !quotationClientName.trim() || !quotationClientCompany.trim() || !Number.isFinite(quotationAmount) || quotationAmount <= 0) {
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
    const payload = {
      title: quotationTitle.trim(),
      clientName: quotationClientName.trim(),
      company: quotationClientCompany.trim(),
      currency,
      validityPeriod: quotationValidUntil,
      taxPercent: 11,
      discount: 0,
      paymentTerms: 'Bank Transfer Net 14',
      notes: 'Finance module quotation workspace.',
      items: [{
        id: 'quotation-item-' + Date.now(),
        description: quotationTitle.trim(),
        quantity: 1,
        unitPrice: Math.round(quotationAmount)
      }],
      ...(editingQuotation ? { status: quotationStatusLabel(quotationStatus) } : {})
    };

    try {
      if (usingDemoQuotations) {
        const now = new Date().toISOString();
        const localQuotation: FinanceQuotation = {
          id: editingQuotation?.id || 'quote_slug_' + Date.now(),
          quotationNumber: editingQuotation?.quotationNumber || 'QTN-2026-' + String(100 + quotations.length + 1).padStart(3, '0'),
          title: quotationTitle.trim(),
          clientName: quotationClientName.trim(),
          clientCompany: quotationClientCompany.trim(),
          total: Math.round(quotationAmount),
          currency,
          status: quotationStatus,
          validUntil: quotationValidUntil,
          createdAt: editingQuotation?.createdAt || now.slice(0, 10),
          owner: editingQuotation?.owner || 'Fikri Nurlete',
          invoiceId: editingQuotation?.invoiceId
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
        const paidRatio = invoice.total > 0 ? Math.min(1, Number(invoice.amountPaid || 0) / Number(invoice.total)) : 0;
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
        <section className="w-full max-w-xl rounded-card border border-line bg-panel p-6 text-center sm:p-8">
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
    <div className="min-h-full pb-10">

      <AdminModuleHeader
        title={financeView === 'quotations' ? 'Quotations' : financeView === 'income-expenses' ? 'Income & Expenses' : financeView === 'tax-retainers' ? 'Tax & Retainers' : financeView === 'financial-reports' ? 'Financial Reports' : 'Invoices'}
        description={financeView === 'quotations'
          ? 'Manage the commercial pipeline from draft quotation through approval, acceptance, and invoice conversion.'
          : financeView === 'income-expenses'
            ? 'Track actual cash collections, operating expenses, and net cash movement for the current financial year.'
            : financeView === 'tax-retainers'
              ? 'Monitor tax provision, tax collection, and retainer billing and collection across the active currency ledger.'
              : financeView === 'financial-reports'
                ? 'Review collection performance, margin, expense mix, and reporting trends for the active financial period.'
                : 'Manage invoices, accounts receivable, collection risk, and billing activity for the active financial period.'}
        actions={(
          <>
            <div className="inline-flex min-h-9 items-center rounded-control border border-line bg-panel p-1" aria-label="Finance currency">
              {(['IDR', 'USD'] as CurrencyCode[]).map((item) => (
                <button key={item} type="button" onClick={() => setActiveCurrency(item)} aria-pressed={currency === item} className={'min-h-7 rounded-chip px-2.5 text-[11px] font-semibold transition-colors ' + (currency === item ? 'bg-line text-fg' : 'text-muted hover:text-fg')}>{item}</button>
              ))}
            </div>
            <button type="button" onClick={() => void loadData(true)} disabled={refreshing} className={actionClass} title="Refresh finance data">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>
            {financeView === 'quotations' ? (
              <>
                <button type="button" onClick={exportQuotationsCsv} disabled={!filteredQuotations.length} className={actionClass}><Download size={14} />Export CSV</button>
                {canManageInvoices && <button type="button" onClick={openCreateQuotation} className={primaryClass}><Plus size={14} />New quotation</button>}
              </>
            ) : financeView === 'income-expenses' ? (
              <>
                <button type="button" onClick={exportReportCsv} disabled={!financeChartData.length} className={actionClass}><Download size={14} />Export report</button>
                {canManageInvoices && <button type="button" onClick={openExpenseModal} className={actionClass}><Plus size={14} />New expense</button>}
                {canCreateInvoice && <button type="button" onClick={openCreateInvoice} className={primaryClass}><Plus size={14} />New invoice</button>}
              </>
            ) : financeView === 'tax-retainers' ? (
              <>
                <button type="button" onClick={exportTaxCsv} disabled={!currencyInvoices.length} className={actionClass}><Download size={14} />Export tax detail</button>
                {canCreateInvoice && <button type="button" onClick={openCreateInvoice} className={primaryClass}><Plus size={14} />New invoice</button>}
              </>
            ) : financeView === 'financial-reports' ? (
              <button type="button" onClick={exportReportCsv} disabled={!financeChartData.length} className={actionClass}><Download size={14} />Export report</button>
            ) : (
              <>
                <button type="button" onClick={exportInvoicesCsv} disabled={!currencyInvoices.length} className={actionClass}><Download size={14} />Export CSV</button>
                {canManageInvoices && <button type="button" onClick={openCreateQuotation} className={actionClass}><FileText size={14} />New quotation</button>}
                {canCreateInvoice && <button type="button" onClick={openCreateInvoice} className={primaryClass}><Plus size={14} />New invoice</button>}
              </>
            )}
          </>
        )}
      />

      {notice && (
        <div className="fixed right-4 top-[68px] z-[60] w-[min(420px,calc(100vw-32px))]" aria-live="polite" aria-atomic="true">
          <div className={'flex items-start gap-3 rounded-card border px-4 py-3 text-xs ' + (notice.tone === 'success' ? 'border-success/30 bg-panel text-success' : 'border-danger/30 bg-panel text-danger')} role="status">
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

      {loading && financeView !== 'quotations' ? (
        <div className="space-y-6" aria-label="Loading finance">
          <div className="grid grid-cols-2 gap-3 min-[1100px]:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-card border border-line bg-panel" />)}
          </div>
          <div className="grid gap-6 min-[1100px]:grid-cols-3">
            <div className="h-72 animate-pulse rounded-card border border-line bg-panel min-[1100px]:col-span-2" />
            <div className="h-72 animate-pulse rounded-card border border-line bg-panel" />
          </div>
          <div className="h-80 animate-pulse rounded-card border border-line bg-panel" />
        </div>
      ) : financeView === 'quotations' ? (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Quotation overview">
            <FinanceMetricCard label="Total quotations" value={quotationMetrics.total} context="All records" icon={<FileText size={15} />} />
            <FinanceMetricCard label="Active pipeline" value={quotationMetrics.active} context="Draft, review, approved, sent" icon={<Clock3 size={15} />} />
            <FinanceMetricCard label="Pipeline value" value={formatFinanceCardAmount(quotationMetrics.value, currency)} context={usingDemoQuotations ? 'Demo workspace data' : 'Server-backed records'} icon={<WalletCards size={15} />} />
            <FinanceMetricCard label="Accepted" value={quotationMetrics.accepted} context={quotationMetrics.approved + ' approved and ready to convert'} icon={<CheckCircle2 size={15} className="text-success" />} toneClassName="text-success" />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <section className="rounded-card border border-line bg-panel overflow-hidden" aria-labelledby="finance-quotations-title">
              <div className="border-b border-line p-4 sm:p-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                  <div className="min-w-0">
                    <h2 id="finance-quotations-title" className="text-sm font-semibold text-fg">Quotation ledger</h2>
                    <p className="mt-1 text-xs leading-5 text-muted">Search and filter commercial opportunities before they move into invoicing.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:items-center">
                    <label className="relative min-w-0 sm:min-w-[240px] xl:w-64"><span className="sr-only">Search quotations</span><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={quotationSearch} onChange={(event) => setQuotationSearch(event.target.value)} placeholder="Search quotation, client, company..." className={fieldClass + ' pl-9'} /></label>
                    <CustomSelect value={quotationStatusFilter} onChange={(value) => setQuotationStatusFilter(value as typeof quotationStatusFilter)} options={[{ value: 'all', label: 'All statuses' }, { value: 'draft', label: 'Draft' }, { value: 'review', label: 'Internal review' }, { value: 'approved', label: 'Approved' }, { value: 'sent', label: 'Sent' }, { value: 'accepted', label: 'Accepted' }, { value: 'rejected', label: 'Rejected' }]} className="w-full sm:w-44" triggerClassName="h-9 min-h-9 w-full" aria-label="Quotation status filter" />
                    <CustomSelect value={quotationSort} onChange={(value) => setQuotationSort(value as QuotationSort)} options={[{ value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' }, { value: 'value_high', label: 'Highest value' }, { value: 'value_low', label: 'Lowest value' }, { value: 'valid_until', label: 'Valid until' }]} className="w-full sm:w-44" triggerClassName="h-9 min-h-9 w-full" aria-label="Quotation sort" />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[10px] text-muted">
                  <span>{filteredQuotations.length} visible records</span><span className="h-1 w-1 rounded-full bg-line" /><span>{quotationMetrics.value ? formatFinanceCardAmount(quotationMetrics.value, currency) : '—'} active pipeline value</span>
                  {(quotationSearch || quotationStatusFilter !== 'all') && <button type="button" onClick={() => { setQuotationSearch(''); setQuotationStatusFilter('all'); }} className="ml-auto rounded-chip px-2 py-1 text-[11px] text-muted hover:bg-bg hover:text-fg">Clear filters</button>}
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                {quotationLoading ? (
                  <div className="grid gap-2 p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-control bg-bg" />)}</div>
                ) : filteredQuotations.length === 0 ? (
                  <div className="p-5"><EmptyState title="No quotations found" description="Adjust the search or status filter, or create a new quotation." action={canManageInvoices ? <button type="button" onClick={openCreateQuotation} className={primaryClass}><Plus size={14} />Create quotation</button> : undefined} /></div>
                ) : (
                  <table className="w-full min-w-[900px] border-collapse text-xs">
                    <thead className="bg-bg"><tr>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-muted">Quotation</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted">Value</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted">Timeline</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted">Status</th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold text-muted">Actions</th>
                    </tr></thead>
                    <tbody>
                      {filteredQuotations.map((quotation) => {
                        const statusToneClass = quotation.status === 'accepted'
                          ? 'border-success/20 bg-success/10 text-success'
                          : quotation.status === 'rejected'
                            ? 'border-danger/20 bg-danger/10 text-danger'
                            : quotation.status === 'sent'
                              ? 'border-info/20 bg-info/10 text-info'
                              : quotation.status === 'review' || quotation.status === 'approved'
                                ? 'border-warning/20 bg-warning/10 text-warning'
                                : 'border-line bg-bg text-muted';
                        return (
                          <tr key={quotation.id} className="group border-t border-line hover:bg-bg">
                            <td className="px-5 py-4"><button type="button" onClick={() => setQuotationDetail(quotation)} className="font-semibold tabular-nums text-fg hover:text-accent-text">{quotation.quotationNumber}</button><p className="mt-1 max-w-[34ch] truncate text-xs text-fg">{quotation.title}</p><p className="mt-0.5 text-[10px] text-muted">{quotation.clientCompany} · {quotation.clientName}</p></td>
                            <td className="px-4 py-4"><p className="font-semibold tabular-nums text-fg">{formatNativeAmount(quotation.total, quotation.currency, true)}</p><p className="mt-1 text-[10px] text-muted">Owner · {quotation.owner}</p></td>
                            <td className="px-4 py-4"><p className="tabular-nums text-fg">Created {quotation.createdAt}</p><p className="mt-1 tabular-nums text-[10px] text-muted">Valid until {quotation.validUntil}</p></td>
                            <td className="px-4 py-4"><CustomSelect value={quotation.status} onChange={(value) => void updateQuotationStatus(quotation, value as FinanceQuotationStatus)} options={getQuotationStatusOptions(quotation.status)} className="w-40" triggerClassName={'h-8 min-h-8 w-full border ' + statusToneClass} aria-label={'Status for ' + quotation.quotationNumber} /></td>
                            <td className="px-5 py-4 text-right"><div className="flex items-center justify-end gap-1">
                              <button type="button" onClick={() => setQuotationDetail(quotation)} className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label="View quotation" title="View quotation"><Eye size={15} /></button>
                              {canManageInvoices && <button type="button" onClick={() => openEditQuotation(quotation)} className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label="Edit quotation" title="Edit quotation"><Edit3 size={14} /></button>}
                              {canManageInvoices && <button type="button" onClick={() => void convertQuotationToInvoice(quotation)} disabled={Boolean(quotation.invoiceId) || quotation.status !== 'approved'} className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg disabled:cursor-not-allowed disabled:opacity-40" aria-label="Convert quotation to invoice" title={quotation.invoiceId ? 'Invoice already created' : quotation.status === 'approved' ? 'Convert approved quotation to invoice' : 'Only approved quotations can be converted'}><Receipt size={15} /></button>}
                              {canManageInvoices && <button type="button" onClick={() => void deleteQuotation(quotation)} className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-danger/10 hover:text-danger" aria-label="Delete quotation" title="Delete quotation"><Trash2 size={14} /></button>}
                            </div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="rounded-card border border-line bg-panel overflow-hidden" aria-labelledby="quotation-pipeline-title">
              <div className="border-b border-line p-4 sm:p-5"><h2 id="quotation-pipeline-title" className="text-sm font-semibold text-fg">Pipeline stages</h2><p className="mt-1 text-xs leading-5 text-muted">Commercial movement before invoice conversion.</p></div>
              <div className="p-4 sm:p-5 space-y-3">
                {(['draft','review','approved','sent','accepted','rejected'] as FinanceQuotationStatus[]).map((status) => {
                  const count = quotations.filter((quotation) => quotation.status === status).length;
                  const value = quotations.filter((quotation) => quotation.status === status).reduce((sum, quotation) => sum + quotation.total, 0);
                  return <div key={status} className="rounded-control border border-line bg-bg px-3 py-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-fg">{quotationStatusLabel(status)}</span><span className="text-xs font-semibold tabular-nums text-fg">{count}</span></div><p className="mt-1 text-[10px] tabular-nums text-muted">{formatNativeAmount(value, currency, true)}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel"><div className="h-full rounded-full bg-series-3" style={{ width: (quotationMetrics.value > 0 ? Math.min(100, (value / quotationMetrics.value) * 100) : 0) + '%' }} /></div></div>;
                })}
              </div>
            </section>
          </section>
        </div>      ) : financeView === 'income-expenses' ? (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Income and expenses summary">
            <FinanceMetricCard label="Income YTD" value={formatFinanceCardAmount(ytdCollected, currency)} context={ytdCollectionRate.toFixed(1) + '% collected of issued billings'} icon={<WalletCards size={15} className="text-success" />} toneClassName="text-success" />
            <FinanceMetricCard label="Invoiced YTD" value={formatFinanceCardAmount(ytdInvoiced, currency)} context="Issued billings" icon={<Receipt size={15} />} />
            <FinanceMetricCard label="Expenses YTD" value={formatFinanceCardAmount(ytdExpenses, currency)} context={currencyExpenses.length + ' recorded entries'} icon={<ArrowDown size={15} className="text-series-3" />} />
            <FinanceMetricCard label="Net cash YTD" value={formatFinanceCardAmount(ytdNetCash, currency)} context="Collections less expenses" icon={<TrendingUp size={15} />} toneClassName={ytdNetCash >= 0 ? 'text-success' : 'text-danger'} />
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-card border border-line bg-panel overflow-hidden" aria-labelledby="finance-income-title">
              <div className="border-b border-line p-4 sm:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div><h2 id="finance-income-title" className="text-sm font-semibold text-fg">Income ledger</h2><p className="mt-1 text-xs leading-5 text-muted">Actual payment activity, separated from invoice value.</p></div>
                  <label className="relative w-full md:w-60"><span className="sr-only">Search income</span><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={incomeSearch} onChange={(event) => setIncomeSearch(event.target.value)} placeholder="Search payment, invoice, client..." className={fieldClass + ' pl-8'} /></label>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[10px] text-muted"><span>{incomeRows.length} payment records</span><span className="h-1 w-1 rounded-full bg-line" /><span>YTD collected {formatFinanceCardAmount(ytdCollected, currency)}</span>{incomeSearch && <button type="button" onClick={() => setIncomeSearch('')} className="ml-auto rounded-chip px-2 py-1 text-[11px] text-muted hover:bg-bg hover:text-fg">Clear</button>}</div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                {incomeRows.length === 0 ? <div className="p-5"><EmptyState title="No income recorded" description="Recorded payments will appear here once invoices start collecting cash." /></div> : (
                  <table className="w-full min-w-[760px] border-collapse text-xs">
                    <thead className="bg-bg"><tr><th className="px-5 py-3 text-left text-[10px] font-semibold text-muted">Payment</th><th className="px-4 py-3 text-left text-[10px] font-semibold text-muted">Client</th><th className="px-4 py-3 text-left text-[10px] font-semibold text-muted">Date</th><th className="px-5 py-3 text-right text-[10px] font-semibold text-muted">Amount</th></tr></thead>
                    <tbody>{paginatedIncome.map((row) => <tr key={row.id} className="border-t border-line hover:bg-bg"><td className="px-5 py-4"><button type="button" onClick={() => { const invoice = currencyInvoices.find((item) => item.id === row.invoiceId); if (invoice) openPrintPreview(invoice); }} className="font-semibold tabular-nums text-fg hover:text-accent-text">{row.invoiceNumber}</button><p className="mt-1 text-[10px] text-muted">Payment record</p></td><td className="px-4 py-4 text-fg">{row.clientCompany}</td><td className="px-4 py-4 tabular-nums text-muted">{row.date}</td><td className="px-5 py-4 text-right font-semibold tabular-nums text-success">{formatNativeAmount(row.amount, row.currency, true)}</td></tr>)}</tbody>
                  </table>
                )}
              </div>
              {incomePageCount > 1 && <div className="border-t border-line px-5 py-3"><div className="flex items-center justify-between text-[11px] text-muted"><span className="tabular-nums">Showing {((incomePage - 1) * incomePageSize) + 1}–{Math.min(incomePage * incomePageSize, incomeRows.length)} of {incomeRows.length}</span><div className="flex items-center gap-1"><button type="button" onClick={() => setIncomePage((page) => Math.max(1, page - 1))} disabled={incomePage === 1} className={actionClass}>Previous</button><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-control border border-line bg-line px-2 text-[10px] font-semibold text-fg">{incomePage}</span><button type="button" onClick={() => setIncomePage((page) => Math.min(incomePageCount, page + 1))} disabled={incomePage === incomePageCount} className={actionClass}>Next</button></div></div></div>}
            </section>

            <section className="rounded-card border border-line bg-panel overflow-hidden" aria-labelledby="finance-expense-title">
              <div className="border-b border-line p-4 sm:p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-end justify-between gap-3"><div><h2 id="finance-expense-title" className="text-sm font-semibold text-fg">Expense ledger</h2><p className="mt-1 text-xs leading-5 text-muted">Operating spend with type, category, and date controls.</p></div><button type="button" onClick={openExpenseModal} className={actionClass}><Plus size={14} />Add expense</button></div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="relative"><span className="sr-only">Search expense</span><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={expenseSearch} onChange={(event) => setExpenseSearch(event.target.value)} placeholder="Search expense..." className={fieldClass + ' pl-8'} /></label>
                    <CustomSelect value={expenseTypeFilter} onChange={setExpenseTypeFilter} options={expenseTypeOptions} className="w-full" triggerClassName="h-9 min-h-9 w-full" aria-label="Expense type filter" />
                    <CustomSelect value={expenseSort} onChange={(value) => setExpenseSort(value as typeof expenseSort)} options={[{ value: 'date_desc', label: 'Newest first' }, { value: 'date_asc', label: 'Oldest first' }, { value: 'amount_high', label: 'Highest amount' }, { value: 'amount_low', label: 'Lowest amount' }]} className="w-full" triggerClassName="h-9 min-h-9 w-full" aria-label="Expense sort" />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[780px] border-collapse text-xs">
                  <thead className="bg-bg"><tr><th className="px-5 py-3 text-left text-[10px] font-semibold text-muted">Expense</th><th className="px-4 py-3 text-left text-[10px] font-semibold text-muted">Type</th><th className="px-4 py-3 text-left text-[10px] font-semibold text-muted">Date</th><th className="px-5 py-3 text-right text-[10px] font-semibold text-muted">Amount</th><th className="px-4 py-3 text-right text-[10px] font-semibold text-muted">Action</th></tr></thead>
                  <tbody>{paginatedExpenses.map((expense) => <tr key={expense.id} className="border-t border-line hover:bg-bg"><td className="px-5 py-4"><p className="font-medium text-fg">{expense.description}</p><p className="mt-1 text-[10px] text-muted">{expense.category}</p></td><td className="px-4 py-4 text-muted">{expense.type || 'OpEx'}</td><td className="px-4 py-4 tabular-nums text-muted">{expense.date}</td><td className="px-5 py-4 text-right font-medium tabular-nums text-fg">{formatNativeAmount(expense.amount, expense.currency || currency, true)}</td><td className="px-4 py-4 text-right">{canManageInvoices && <button type="button" onClick={() => setConfirmAction({ type: 'expense', id: expense.id, label: expense.description })} className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-danger/10 hover:text-danger" aria-label="Void expense" title="Void expense"><Trash2 size={14} /></button>}</td></tr>)}</tbody>
                </table>
              </div>
              {expensePageCount > 1 && <div className="border-t border-line px-5 py-3"><div className="flex items-center justify-between text-[11px] text-muted"><span className="tabular-nums">Showing {((expensePage - 1) * expensePageSize) + 1}–{Math.min(expensePage * expensePageSize, filteredExpenses.length)} of {filteredExpenses.length}</span><div className="flex items-center gap-1"><button type="button" onClick={() => setExpensePage((page) => Math.max(1, page - 1))} disabled={expensePage === 1} className={actionClass}>Previous</button><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-control border border-line bg-line px-2 text-[10px] font-semibold text-fg">{expensePage}</span><button type="button" onClick={() => setExpensePage((page) => Math.min(expensePageCount, page + 1))} disabled={expensePage === expensePageCount} className={actionClass}>Next</button></div></div></div>}
            </section>
          </section>
        </div>      ) : financeView === 'tax-retainers' ? (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Tax and retainers summary">
            <FinanceMetricCard label="Tax provision" value={formatFinanceCardAmount(taxProvision, currency)} context="Tax across issued invoices" icon={<Receipt size={15} />} />
            <FinanceMetricCard label="Tax collected" value={formatFinanceCardAmount(taxCollected, currency)} context={(taxProvision > 0 ? ((taxCollected / taxProvision) * 100).toFixed(1) : '0.0') + '% of provision'} icon={<BadgeCheck size={15} className="text-success" />} toneClassName="text-success" />
            <FinanceMetricCard label="Tax outstanding" value={formatFinanceCardAmount(taxOutstanding, currency)} context="Provision not yet collected" icon={<Hourglass size={15} className="text-warning" />} toneClassName="text-warning" />
            <FinanceMetricCard label="Retainer billed" value={formatFinanceCardAmount(retainerBilled, currency)} context={(retainerBilled > 0 ? ((retainerCollected / retainerBilled) * 100).toFixed(1) : '0.0') + '% collected'} icon={<TrendingUp size={15} />} />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <section className="rounded-card border border-line bg-panel overflow-hidden" aria-labelledby="finance-retainer-title">
              <div className="border-b border-line p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><h2 id="finance-retainer-title" className="text-sm font-semibold text-fg">Retainer ledger</h2><p className="mt-1 text-xs leading-5 text-muted">Billing and actual collections for invoices identified as retainers.</p></div><span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] tabular-nums text-muted">{retainerInvoices.length} invoices</span></div></div>
              <div className="overflow-x-auto custom-scrollbar"><table className="w-full min-w-[720px] border-collapse text-xs"><thead className="bg-bg"><tr><th className="px-5 py-3 text-left text-[10px] font-semibold text-muted">Invoice</th><th className="px-4 py-3 text-left text-[10px] font-semibold text-muted">Client</th><th className="px-4 py-3 text-left text-[10px] font-semibold text-muted">Status</th><th className="px-4 py-3 text-right text-[10px] font-semibold text-muted">Billed</th><th className="px-5 py-3 text-right text-[10px] font-semibold text-muted">Collected</th></tr></thead><tbody>{retainerInvoices.slice(0,12).map((invoice) => <tr key={invoice.id} className="border-t border-line hover:bg-bg"><td className="px-5 py-4"><button type="button" onClick={() => openPrintPreview(invoice)} className="font-semibold tabular-nums text-fg hover:text-accent-text">{invoice.invoiceNumber}</button><p className="mt-1 text-[10px] text-muted">Due {invoice.dueDate}</p></td><td className="px-4 py-4 text-fg">{invoice.clientCompany || invoice.clientName}</td><td className="px-4 py-4"><StatusBadge status={invoice.status} /></td><td className="px-4 py-4 text-right tabular-nums text-fg">{formatNativeAmount(invoice.total, invoice.currency, true)}</td><td className="px-5 py-4 text-right tabular-nums text-success">{formatNativeAmount(getInvoiceCollectedInRange(invoice, yearStart, yearEnd), invoice.currency, true)}</td></tr>)}</tbody></table></div>
            </section>

            <section className="grid gap-5">
              <section className="rounded-card border border-line bg-panel p-4 sm:p-5" aria-labelledby="finance-tax-breakdown-title">
                <div className="border-b border-line pb-3"><h2 id="finance-tax-breakdown-title" className="text-sm font-semibold text-fg">Tax provision</h2><p className="mt-1 text-xs leading-5 text-muted">Movement from issued tax into collected and outstanding tax.</p></div>
                <div className="mt-4 space-y-3">
                  {[{ label: 'Provision', value: taxProvision, percent: 100, tone: 'bg-series-1' }, { label: 'Collected', value: taxCollected, percent: taxProvision > 0 ? Math.min(100,(taxCollected/taxProvision)*100) : 0, tone: 'bg-success' }, { label: 'Outstanding', value: taxOutstanding, percent: taxProvision > 0 ? Math.min(100,(taxOutstanding/taxProvision)*100) : 0, tone: 'bg-warning' }].map((item) => <div key={item.label}><div className="flex items-center justify-between text-xs"><span className="text-muted">{item.label}</span><span className="font-medium tabular-nums text-fg">{formatNativeAmount(item.value,currency,true)}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg"><div className={'h-full rounded-full '+item.tone} style={{width:item.percent+'%'}} /></div></div>)}
                </div>
                <button type="button" onClick={exportTaxCsv} disabled={!currencyInvoices.length} className={actionClass + ' mt-5 w-full'}><Download size={14} />Export tax detail</button>
              </section>
              <section className="rounded-card border border-line bg-panel p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-fg">Retainer collection</h2><p className="mt-1 text-xs leading-5 text-muted">Collected against retainer billings in the active ledger.</p></div><span className="text-sm font-semibold tabular-nums text-fg">{retainerBilled > 0 ? ((retainerCollected/retainerBilled)*100).toFixed(1) : '0.0'}%</span></div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-success" style={{width:(retainerBilled>0?Math.min(100,(retainerCollected/retainerBilled)*100):0)+'%'}} /></div>
                <div className="mt-2 flex justify-between gap-3 text-[10px] tabular-nums text-muted"><span>{formatFinanceCardAmount(retainerCollected,currency)} collected</span><span>{formatFinanceCardAmount(retainerBilled,currency)} billed</span></div>
              </section>
            </section>
          </section>
        </div>      ) : financeView === 'financial-reports' ? (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Financial reporting summary">
            <article className="rounded-card border border-line bg-panel p-5"><div className="flex items-center justify-between text-xs font-medium text-muted"><span>Net cash YTD</span><TrendingUp size={15} /></div><p className={'mt-3 text-2xl font-medium tabular-nums ' + (ytdNetCash >= 0 ? 'text-success' : 'text-danger')}>{formatFinanceCardAmount(ytdNetCash, currency)}</p><p className="mt-2 text-xs text-muted">Collected less expenses</p></article>
            <article className="rounded-card border border-line bg-panel p-5"><div className="flex items-center justify-between text-xs font-medium text-muted"><span>Collection rate</span><BarChart3 size={15} /></div><p className="mt-3 text-2xl font-medium tabular-nums text-fg">{ytdCollectionRate.toFixed(1)}%</p><p className="mt-2 text-xs text-muted">Collected against issued billings</p></article>
            <article className="rounded-card border border-line bg-panel p-5"><div className="flex items-center justify-between text-xs font-medium text-muted"><span>Operating margin</span><TrendingUp size={15} className="text-success" /></div><p className="mt-3 text-2xl font-medium tabular-nums text-fg">{Number.isFinite(operatingMarginValue) ? operatingMarginValue.toFixed(1) : quarterMargin.toFixed(1)}%</p><p className="mt-2 text-xs text-muted">Target ≥ 35%</p></article>
            <article className="rounded-card border border-line bg-panel p-5"><div className="flex items-center justify-between text-xs font-medium text-muted"><span>Outstanding</span><Hourglass size={15} className="text-warning" /></div><p className="mt-3 text-2xl font-medium tabular-nums text-warning">{formatFinanceCardAmount(derivedMetrics.totalOutstanding, currency)}</p><p className="mt-2 text-xs text-muted">{pendingInvoiceCount} invoices still open</p></article>
          </section>

          <section className="grid grid-cols-1 gap-6 min-[1100px]:grid-cols-3">
            <section className="min-[1100px]:col-span-2 rounded-card border border-line bg-panel overflow-hidden" aria-labelledby="financial-trend-title">
              <div className="border-b border-line p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 id="financial-trend-title" className="text-sm font-semibold text-fg">Cash Flow vs Operating Burn</h2><p className="mt-1 text-xs text-muted">Monthly billing inflow, operational burn, and retainer target.</p></div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted"><span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-accent"></span>Net inflow</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-success"></span>Retainer target</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-series-3"></span>Operating burn</span></div>
              </div>
              <div className="p-5">
                {hasTrendData ? <FinanceCashFlowChart data={financeChartData} currency={currency} ariaLabel="Finance cash flow trend showing net inflow, retainer target and operating burn." /> : <EmptyState title="No trend data" description="Monthly billing and expense records will populate this chart." />}
              </div>
            </section>

            <section className="rounded-card border border-line bg-panel overflow-hidden" aria-labelledby="report-status-title">
              <div className="border-b border-line p-5"><h2 id="report-status-title" className="text-sm font-semibold text-fg">Invoice status mix</h2><p className="mt-1 text-xs text-muted">{ledgerInvoices.length} invoices in the active period.</p></div>
              <div className="space-y-3 p-5">
                {quarterStatusRows.map((row) => (
                  <div key={row.status} className="flex items-center justify-between rounded-control border border-line bg-bg px-3 py-2.5">
                    <div className="flex items-center gap-2"><Receipt size={12} aria-hidden="true" /><span className="text-xs text-muted">{statusLabel[row.status]}</span></div>
                    <span className="text-xs font-semibold tabular-nums text-fg">{row.count}</span>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <section className="grid grid-cols-1 gap-6 min-[1100px]:grid-cols-2">
            <section className="rounded-card border border-line bg-panel overflow-hidden">
              <div className="border-b border-line p-5"><h2 className="text-sm font-semibold text-fg">Expense categories</h2><p className="mt-1 text-xs text-muted">Top recorded expenses in the current quarter.</p></div>
              <div className="p-5 space-y-3">
                {quarterExpenseCategories.length === 0 ? <EmptyState title="No expense categories" description="Actual expense records will appear here." /> : quarterExpenseCategories.slice(0, 6).map(([category, amount]) => {
                  const max = quarterExpenseCategories[0]?.[1] || 1;
                  const percent = Math.round((amount / max) * 100);
                  return <div key={category}><div className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-muted">{category}</span><span className="tabular-nums font-medium text-fg">{formatNativeAmount(amount, currency, true)}</span></div><div className="mt-1.5 h-1.5 rounded-full bg-bg overflow-hidden"><div className="h-full rounded-full bg-series-3" style={{ width: percent + '%' }} /></div></div>;
                })}
              </div>
            </section>
            <section className="rounded-card border border-line bg-panel overflow-hidden">
              <div className="border-b border-line p-5"><h2 className="text-sm font-semibold text-fg">Reporting controls</h2><p className="mt-1 text-xs text-muted">The report surface stays exportable and drillable without changing the underlying finance ledger.</p></div>
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                {[
                  ['Current quarter', reportingQuarter?.label || '—'],
                  ['Current invoices', String(serverMetrics ? serverMetrics.totalInvoicesCount : ledgerInvoices.length)],
                  ['Open balances', String(pendingInvoiceCount)],
                  ['Overdue', String(criticalOverdueCount)]
                ].map(([label, value]) => <div key={label} className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] uppercase tracking-[0.08em] text-muted">{label}</p><p className="mt-1 text-sm font-semibold tabular-nums text-fg">{value}</p></div>)}
              </div>
              <div className="border-t border-line p-5"><button type="button" onClick={exportReportCsv} disabled={!financeChartData.length} className={actionClass + ' w-full'}><Download size={14} />Export financial report</button></div>
            </section>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <AdminMetricStrip
            className="grid-cols-2 sm:grid-cols-3 min-[1100px]:grid-cols-6"
            itemClassName="rounded-card border border-line bg-panel p-4 sm:p-5"
            metrics={[
              { id: 'billed', label: 'Total invoiced', value: formatFinanceCardAmount(currentQuarterTotal, currency), context: quarterChangePercent === null ? 'Current quarter' : (quarterChangePercent >= 0 ? '+' : '') + quarterChangePercent.toFixed(1) + '% vs previous quarter', icon: <Receipt size={18} aria-hidden="true" /> },
              { id: 'collected', label: 'Collected YTD', value: formatFinanceCardAmount(ytdCollected, currency), context: ytdCollectionRate.toFixed(1) + '% collection rate' + (usingDemoInvoices ? ' · Demo' : ''), icon: <WalletCards size={18} className="text-success" aria-hidden="true" /> },
              { id: 'outstanding', label: 'Outstanding', value: formatFinanceCardAmount(derivedMetrics.totalOutstanding, currency), context: pendingInvoiceCount + ' invoices pending', icon: <Hourglass size={18} className="text-warning" aria-hidden="true" /> },
              { id: 'overdue', label: 'Overdue balance', value: formatFinanceCardAmount(overdueBalance, currency), context: criticalOverdueCount + ' critical invoices', icon: <AlertCircle size={18} className="text-danger" aria-hidden="true" />, toneClassName: 'text-danger' },
              { id: 'margin', label: 'Operating margin', value: Number.isFinite(operatingMarginValue) ? operatingMarginValue.toFixed(1) + '%' : quarterMargin.toFixed(1) + '%', context: operatingMarginHealthy ? 'Healthy · target ≥ 35%' : 'Below target · monitor burn', icon: <TrendingUp size={18} className={operatingMarginHealthy ? 'text-success' : 'text-warning'} aria-hidden="true" /> },
              { id: 'count', label: 'Total invoices', value: serverMetrics ? serverMetrics.totalInvoicesCount : 0, context: currency + ' finance ledger', icon: <FileText size={18} aria-hidden="true" /> }
            ]}
          />

          <section className="grid grid-cols-1 gap-6 min-[1100px]:grid-cols-3">
            <section className="min-[1100px]:col-span-2 rounded-card border border-line bg-panel overflow-hidden" aria-labelledby="dashboard-finance-trend-title">
              <div className="border-b border-line p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 id="dashboard-finance-trend-title" className="text-sm font-semibold text-fg">Cash Flow vs Operating Burn</h2><p className="mt-1 text-xs text-muted">Monthly billing inflow, operating burn rate, and net retention.</p></div>
                <div className="flex items-center gap-3 text-[10px] text-muted"><span>Net inflow</span><span>Retainer target</span><span>Operational burn</span></div>
              </div>
              <div className="p-5">
                {hasTrendData ? <FinanceCashFlowChart data={financeChartData} currency={currency} ariaLabel="Finance cash flow trend." /> : <EmptyState title="No trend data" description="Billing and expense records will populate the financial trend." />}
              </div>
            </section>

            <section className="rounded-card border border-line bg-panel overflow-hidden" aria-labelledby="aging-receivables-title">
              <div className="border-b border-line p-5"><h2 id="aging-receivables-title" className="text-sm font-semibold text-fg">Aging Receivables</h2><p className="mt-1 text-xs text-muted">Total outstanding {formatFinanceCardAmount(derivedMetrics.totalOutstanding, currency)} across 3 buckets.</p></div>
              <div className="p-5">
                <div className="h-2.5 overflow-hidden rounded-full border border-line bg-bg flex">
                  {agingBuckets.map((bucket) => <div key={bucket.label} className={'h-full ' + (bucket.tone === 'success' ? 'bg-success' : bucket.tone === 'warning' ? 'bg-warning' : 'bg-danger')} style={{ width: bucket.percent + '%' }} title={bucket.label + ': ' + bucket.percent + '%'} />)}
                </div>
                <div className="mt-4 space-y-3">
                  {agingBuckets.map((bucket) => (
                    <div key={bucket.label} className="rounded-control border border-line bg-bg px-3 py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0"><span className={'h-2 w-2 shrink-0 rounded-full ' + (bucket.tone === 'success' ? 'bg-success' : bucket.tone === 'warning' ? 'bg-warning' : 'bg-danger')} /><div className="min-w-0"><p className="truncate text-sm font-medium text-fg">{bucket.label}</p><p className="mt-0.5 text-[10px] text-muted">{bucket.count} active account{bucket.count === 1 ? '' : 's'}</p></div></div>
                      <div className="text-right shrink-0"><p className="text-xs font-semibold tabular-nums text-fg">{formatNativeAmount(bucket.amount, currency, true)}</p><p className="mt-0.5 text-[10px] tabular-nums text-muted">{bucket.percent}%</p></div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setDunningOpen(true)} disabled={!actionRequiredInvoices.length} className={actionClass + ' mt-4 w-full'}><Send size={14} />Prepare bulk dunning notices</button>
              </div>
            </section>
          </section>

          <section className="rounded-card border border-line bg-panel overflow-hidden" aria-labelledby="finance-workspace-title">
            <div className="border-b border-line p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 id="finance-workspace-title" className="text-sm font-semibold text-fg">Invoice Ledger</h2>
                    {usingDemoInvoices && <span className="rounded-badge border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">Demo data</span>}
                  </div>
                  <p className="mt-1 text-[11px] text-muted">{serverMetrics ? serverMetrics.totalInvoicesCount : ledgerInvoices.length} invoices in the active ledger period</p>
                </div>
                <div className="flex w-full flex-col gap-2 xl:w-auto xl:flex-row xl:items-center">
                  <label className="relative min-w-[220px] xl:w-64"><span className="sr-only">Search invoices</span><Search size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice # or client..." className={fieldClass + ' pl-9 pr-3'} /></label>
                  <div className="flex items-center gap-1 overflow-x-auto rounded-control border border-line bg-bg p-0.5 custom-scrollbar">
                    {['All', 'Paid', 'Due Soon', 'Overdue', 'Draft'].map((label) => {
                      const key = label === 'All' ? 'all' : label === 'Paid' ? 'paid' : label === 'Due Soon' ? 'due_soon' : label === 'Overdue' ? 'overdue' : 'draft';
                      const count = key === 'all'
                        ? ledgerInvoices.length
                        : key === 'due_soon'
                          ? dueSoonCount
                          : key === 'overdue'
                            ? ledgerInvoices.filter((invoice) => isPastDueInvoice(invoice)).length
                            : invoiceStatusCounts.find((item) => item.status === key)?.count || 0;
                      return <button key={label} type="button" onClick={() => setStatusFilter(key)} className={'min-h-8 shrink-0 rounded-chip px-2.5 text-[11px] font-medium transition-colors ' + (statusFilter === key ? 'bg-line text-fg' : 'text-muted hover:text-fg')}>{label}<span className="ml-1 tabular-nums opacity-70">{count}</span></button>;
                    })}
                  </div>
                  <div className="relative">
                    <button type="button" onClick={() => setPeriodMenuOpen((open) => !open)} className={actionClass + ' justify-between'} aria-expanded={periodMenuOpen}><CalendarDays size={13} />{ledgerPeriod === 'reporting-quarter' ? (reportingQuarter?.label || 'Reporting period') : 'All periods'}</button>
                    {periodMenuOpen && <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 rounded-card border border-line bg-panel p-1.5"><button type="button" onClick={() => { setLedgerPeriod('reporting-quarter'); setPeriodMenuOpen(false); setStatusFilter('all'); }} className="w-full rounded-control px-3 py-2 text-left text-xs text-fg hover:bg-bg"><span className="block font-medium">{reportingQuarter?.label || 'Reporting period'}</span><span className="mt-0.5 block text-[10px] text-muted">Match the latest invoice quarter</span></button><button type="button" onClick={() => { setLedgerPeriod('all'); setPeriodMenuOpen(false); setStatusFilter('all'); }} className="mt-1 w-full rounded-control px-3 py-2 text-left text-xs text-muted hover:bg-bg hover:text-fg"><span className="block font-medium">All periods</span><span className="mt-0.5 block text-[10px]">Show the full invoice ledger</span></button></div>}
                  </div>
                  <div className="relative">
                    <button type="button" onClick={() => setColumnMenuOpen((open) => !open)} className={actionClass + ' w-9 px-0'} aria-label="Filter columns" title="Filter columns" aria-expanded={columnMenuOpen}><SlidersHorizontal size={14} /></button>
                    {columnMenuOpen && <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 rounded-card border border-line bg-panel p-1.5">{[['client','Client & Project'],['issue','Issue Date'],['due','Due Date'],['amount','Amount'],['status','Status'],['actions','Actions']].map(([key,label]) => <button key={key} type="button" role="menuitemcheckbox" aria-checked={columnVisibility[key]} onClick={() => setColumnVisibility((current) => ({ ...current, [key]: !current[key] }))} className="flex w-full items-center justify-between rounded-control px-3 py-2 text-left text-xs text-muted hover:bg-bg hover:text-fg"><span>{label}</span><span className={columnVisibility[key] ? 'text-accent-text' : 'text-muted'}>{columnVisibility[key] ? 'Visible' : 'Hidden'}</span></button>)}</div>}
                  </div>
                  <CustomSelect value={sort} onChange={(value) => setSort(value as SortKey)} options={sortOptions} className="w-full xl:w-44" triggerClassName="h-9 min-h-9 w-full" aria-label="Invoice sort" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                <span className="text-[10px] uppercase tracking-[0.08em] text-muted">Ledger</span><span className="h-1 w-1 rounded-full bg-line" /><span className="text-[10px] text-muted">Current financial period</span>
                {(search || statusFilter !== 'all') && <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="ml-auto rounded-chip px-2 py-1 text-[11px] text-muted hover:text-fg">Clear filters</button>}
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              {filteredInvoices.length === 0 ? (
                <div className="p-5"><EmptyState title="No invoices found" description={search || statusFilter !== 'all' ? 'No invoices match the current search or filter.' : 'No invoice records are available yet.'} action={canManageInvoices ? <button type="button" onClick={openCreateInvoice} className={primaryClass}><Plus size={14} />Create invoice</button> : undefined} /></div>
              ) : (
                <table className="w-full min-w-[1040px] border-collapse text-left text-xs">
                  <thead className="bg-bg">
                    <tr>
                      <th className="px-4 py-3 sm:px-5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Invoice #</th>
                      {columnVisibility.client && <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Client & Project</th>}
                      {columnVisibility.issue && <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Issue Date</th>}
                      {columnVisibility.due && <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Due Date</th>}
                      {columnVisibility.amount && <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Amount (IDR)</th>}
                      {columnVisibility.status && <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Status</th>}
                      {columnVisibility.actions && <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInvoices.map((invoice) => {
                      const balance = Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0)));
                      const project = projectsById.get(invoice.projectId);
                      const isOverdue = isPastDueInvoice(invoice) || invoice.status === 'overdue';
                      return (
                        <tr key={invoice.id} className="group border-t border-line transition-colors hover:bg-bg">
                          <td className="px-4 py-3 sm:px-5"><div className="flex items-center gap-2"><span className={'h-1.5 w-1.5 rounded-full ' + (isOverdue ? 'bg-danger' : invoice.status === 'paid' ? 'bg-success' : invoice.status === 'sent' ? 'bg-info' : 'bg-warning')} /><button type="button" onClick={() => openPrintPreview(invoice)} className="font-medium tabular-nums text-fg hover:text-accent-text">{invoice.invoiceNumber}</button></div><p className="mt-1 text-[11px] text-muted">{invoice.currency}</p></td>
                          {columnVisibility.client && <td className="px-4 py-3"><div className="font-medium text-fg">{invoice.clientCompany || invoice.clientName}</div><div className="mt-0.5 text-[11px] text-muted">{project?.name || invoice.clientName}</div></td>}
                          {columnVisibility.issue && <td className="px-4 py-3 tabular-nums text-muted">{invoice.issueDate}</td>}
                          {columnVisibility.due && <td className={'px-4 py-3 tabular-nums font-medium ' + (isOverdue ? 'text-danger' : 'text-muted')}>{invoice.dueDate}{isOverdue && <div className="mt-0.5 text-[10px] text-danger">Overdue</div>}</td>}
                          {columnVisibility.amount && <td className="px-4 py-3 text-right"><div className="font-semibold tabular-nums text-fg">{formatNativeAmount(invoice.total, invoice.currency)}</div><div className="mt-0.5 text-[10px] tabular-nums text-muted">{balance > 0 ? 'Due ' + formatNativeAmount(balance, invoice.currency, true) : 'Settled'}</div></td>}
                          {columnVisibility.status && <td className="px-4 py-3">{canManageInvoices ? <InvoiceStatusDropdown status={invoice.status} allowedStatuses={['draft', 'sent', 'overdue']} disabled={updatingInvoiceId === invoice.id || !['draft', 'sent', 'overdue'].includes(invoice.status)} onChange={(next) => void updateInvoiceStatus(invoice, next)} /> : <StatusBadge status={invoice.status} />}</td>}
                          {columnVisibility.actions && <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1 opacity-85 group-hover:opacity-100">
                            {isPastDueInvoice(invoice) && <button type="button" onClick={() => setReminderInvoice(invoice)} className="inline-flex h-7 items-center rounded-control border border-line bg-bg px-2.5 text-[10px] font-medium text-danger hover:bg-panel-hover">Reminder</button>}
                            {canManageInvoices && invoice.status !== 'paid' && invoice.status !== 'cancelled' && balance > 0 && <button type="button" onClick={() => openPayment(invoice)} className="inline-flex h-7 min-h-7 items-center rounded-control border border-line bg-bg px-2.5 text-[10px] font-medium text-muted hover:bg-panel-hover hover:text-fg">Pay</button>}
                            <button type="button" onClick={() => openPrintPreview(invoice)} className="inline-flex h-7 w-7 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label="View invoice" title="View invoice"><Eye size={15} /></button>
                            {canManageInvoices && invoice.status !== 'cancelled' && <button type="button" onClick={() => openEditInvoice(invoice)} className="inline-flex h-7 w-7 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label="Edit invoice" title="Edit invoice"><Edit3 size={14} /></button>}
                            {canManageInvoices && canDeleteInvoice && !['cancelled', 'paid', 'partially_paid'].includes(invoice.status) && <button type="button" onClick={() => setConfirmAction({ type: 'invoice', id: invoice.id, label: invoice.invoiceNumber })} className="inline-flex h-7 w-7 items-center justify-center rounded-control text-muted hover:bg-danger/10 hover:text-danger" aria-label="Cancel invoice" title="Cancel invoice"><Trash2 size={14} /></button>}

                          </div></td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {invoicePageCount > 1 && (
              <div className="border-t border-line px-4 py-3 sm:px-5">
                <div className="flex flex-col gap-2 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-1 tabular-nums"><span>Showing</span><span className="font-medium text-fg">{((invoicePage - 1) * invoicePageSize) + 1}–{Math.min(invoicePage * invoicePageSize, filteredInvoices.length)}</span><span>of</span><span className="font-medium text-fg">{filteredInvoices.length}</span><span>invoices</span></div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setInvoicePage((page) => Math.max(1, page - 1))} disabled={invoicePage === 1} className={actionClass}>Previous</button>
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-control border border-line bg-line px-2 text-[10px] font-semibold text-fg">{invoicePage}</span>
                    <button type="button" onClick={() => setInvoicePage((page) => Math.min(invoicePageCount, page + 1))} disabled={invoicePage === invoicePageCount} className={actionClass}>Next</button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-card border border-line bg-panel overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div><h2 className="text-sm font-semibold text-fg">Finance snapshot</h2><p className="mt-1 text-xs text-muted">Period: {reportingQuarter?.label || 'Active period'} · {pendingInvoiceCount} open invoices · {currencyExpenses.length} expense records.</p></div>
              <div className="flex items-center gap-2"><span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] font-medium text-muted">Invoices {ledgerInvoices.length}</span><span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] font-medium text-muted">Retainers {retainerInvoices.length}</span><span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] font-medium text-muted">Expenses {currencyExpenses.length}</span></div>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
              {[
                { label: 'Quarter billed', value: formatFinanceCardAmount(currentQuarterTotal, currency), icon: <Receipt size={16} /> },
                { label: 'Quarter collected', value: formatFinanceCardAmount(quarterCollected, currency), icon: <WalletCards size={16} /> },
                { label: 'Quarter expenses', value: formatFinanceCardAmount(quarterExpenses, currency), icon: <ArrowDown size={16} /> }
              ].map((item) => <div key={item.label} className="rounded-control border border-line bg-bg p-3"><div className="flex items-center gap-2 text-xs text-muted">{item.icon}{item.label}</div><p className="mt-2 text-lg font-medium tabular-nums text-fg">{item.value}</p></div>)}
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

      <Modal
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
              <label htmlFor="finance-quotation-amount" className="mb-1.5 block text-xs font-medium text-muted">Quoted amount *</label>
              <input id="finance-quotation-amount" required min="0.01" max="1000000000000" step="0.01" type="number" value={quotationAmount || ''} onChange={(event) => setQuotationAmount(Number(event.target.value))} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="finance-quotation-valid-until" className="mb-1.5 block text-xs font-medium text-muted">Valid until *</label>
              <input id="finance-quotation-valid-until" required type="date" value={quotationValidUntil} onChange={(event) => setQuotationValidUntil(event.target.value)} className={fieldClass} />
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
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted">Preview total</span>
              <span className="font-semibold tabular-nums text-fg">{formatNativeAmount(Number(quotationAmount) || 0, currency, true)}</span>
            </div>
            <p className="mt-1 text-[10px] text-muted">Currency follows the active Finance currency switch.</p>
          </div>
        </form>
      </Modal>

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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] uppercase tracking-[0.08em] text-muted">Client</p><p className="mt-1 text-sm font-medium text-fg">{quotationDetail.clientCompany}</p><p className="mt-0.5 text-xs text-muted">{quotationDetail.clientName}</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] uppercase tracking-[0.08em] text-muted">Commercial value</p><p className="mt-1 text-sm font-semibold tabular-nums text-fg">{formatNativeAmount(quotationDetail.total, quotationDetail.currency, true)}</p><p className="mt-0.5 text-xs text-muted">Valid until {quotationDetail.validUntil}</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] uppercase tracking-[0.08em] text-muted">Owner</p><p className="mt-1 text-sm font-medium text-fg">{quotationDetail.owner}</p></div>
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

      <Modal
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
            <div className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-fg" role="note">
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
      </Modal>

      <Modal
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
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="finance-expense-amount" className="mb-1.5 block text-xs font-medium text-muted">Amount *</label><input id="finance-expense-amount" required type="number" min="0.01" max="100000000000" step="0.01" value={expenseAmount} onChange={(event) => setExpenseAmount(Number(event.target.value))} className={fieldClass} /></div>
            <div><label htmlFor="finance-expense-date" className="mb-1.5 block text-xs font-medium text-muted">Date *</label><input id="finance-expense-date" required type="date" max={getDateInputValue()} value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} className={fieldClass} /></div>
          </div>
        </form>
      </Modal>

      <Modal
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
              <input id="finance-payment-amount" required min="0.01" type="number" step="0.01" max={Number(paymentInvoice.balanceDue ?? (paymentInvoice.total - (paymentInvoice.amountPaid || 0)))} value={paymentAmount} onChange={(event) => setPaymentAmount(Number(event.target.value))} className={fieldClass} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-xs font-medium text-muted">Payment method</label><CustomSelect aria-label="Payment method" value={paymentMethod} onChange={(value) => { setPaymentDirty(true); setPaymentMethod(value as typeof paymentMethod); }} options={[{ value: 'bank_transfer', label: 'Bank transfer' }, { value: 'credit_card', label: 'Credit card' }, { value: 'cash', label: 'Cash' }, { value: 'other', label: 'Other' }]} className="w-full" triggerClassName="h-10 min-h-10 w-full" /></div>
              <div><label htmlFor="finance-payment-date" className="mb-1.5 block text-xs font-medium text-muted">Payment date</label><input id="finance-payment-date" required type="date" max={getDateInputValue()} value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className={fieldClass} /></div>
            </div>
            <div><label htmlFor="finance-payment-reference" className="mb-1.5 block text-xs font-medium text-muted">Reference</label><input id="finance-payment-reference" maxLength={160} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className={fieldClass} placeholder="Transaction reference" /></div>
            <div><label htmlFor="finance-payment-notes" className="mb-1.5 block text-xs font-medium text-muted">Notes</label><textarea id="finance-payment-notes" maxLength={1000} value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} rows={3} className={fieldClass + ' py-2.5'} /></div>
          </form>
        )}
      </Modal>

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
              <div><p className="text-xs font-medium text-muted">Billed to</p><p className="mt-1 text-sm font-medium text-fg">{detailInvoice.clientName}</p><p className="text-xs text-muted">{detailInvoice.clientCompany}</p><p className="mt-1 text-xs text-muted">{detailInvoice.clientEmail}</p>{detailInvoice.clientPhone && <p className="text-xs text-muted">{detailInvoice.clientPhone}</p>}</div>
              <div className="sm:text-right"><p className="text-xs font-medium text-muted">Invoice metadata</p><p className="mt-1 text-xs tabular-nums text-fg">Issue {detailInvoice.issueDate}</p><p className="text-xs tabular-nums text-fg">Due {detailInvoice.dueDate}</p><p className="text-xs text-muted">{detailInvoice.currency}</p></div>
            </div>
            <div className="overflow-x-auto rounded-control border border-line">
              <table className="ams-table w-full min-w-[520px] text-xs">
                <thead><tr className="border-b border-line text-muted"><th className="px-3 py-2 text-left font-medium">Description</th><th className="px-3 py-2 text-right font-medium">Qty</th><th className="px-3 py-2 text-right font-medium">Unit price</th><th className="px-3 py-2 text-right font-medium">Amount</th></tr></thead>
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
    </div>
  );
};

export default AdminInvoicing;
