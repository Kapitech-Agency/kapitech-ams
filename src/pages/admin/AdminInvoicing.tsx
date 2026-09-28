import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download,
  Edit3,
  FileText,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X
} from 'lucide-react';
import { AgencyExpense, AgencyInvoice, InvoiceLineItem, InvoiceStatus, computeInvoiceTotals, computeFinancialMetrics, getMonthlyCashFlowSeries } from '../../lib/financeStore';
import { CurrencyCode, CURRENCY_EVENT, getActiveCurrency, setActiveCurrency, formatNativeAmount } from '../../lib/currency';
import { useLanguage } from '../../lib/LanguageContext';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';
import { InvoiceStatusDropdown } from '../../components/ui/InvoiceStatusDropdown';
import { getAdminSession, hasAdminPermission } from '../../lib/adminAuth';
import { api } from '../../lib/apiClient';
import { AdminMetricStrip, AdminModuleHeader } from '../../components/admin/AdminModulePrimitives';


type SortKey = 'updated' | 'due' | 'oldest' | 'amount_high' | 'amount_low' | 'invoice';
type Tab = 'invoices' | 'expenses';
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

const isDueSoonInvoice = (invoice: AgencyInvoice) => {
  const days = getDaysUntilDue(invoice.dueDate);
  return invoice.status !== 'paid' && invoice.status !== 'cancelled' && days >= 0 && days <= 7;
};

const emptyLineItem = (): InvoiceLineItem => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'line-' + Date.now(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0
});

const cardClass = 'ams-dashboard-card rounded-card border border-line bg-panel p-4';
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

const StatusBadge = ({ status }: { status: InvoiceStatus }) => (
  <span className={'inline-flex items-center gap-1.5 rounded-badge border px-2 py-1 text-[11px] font-semibold ' + statusTone[status]}>
    {status === 'paid' ? <CheckCircle2 size={12} /> : status === 'overdue' ? <AlertCircle size={12} /> : status === 'partially_paid' ? <WalletCards size={12} /> : status === 'cancelled' ? <X size={12} /> : <FileText size={12} />}
    {statusLabel[status]}
  </span>
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
};

const FinanceCashFlowChart: React.FC<{
  data: FinanceChartPoint[];
  currency: CurrencyCode;
  ariaLabel: string;
}> = ({ data, currency, ariaLabel }) => {
  if (!data.length) return null;
  const width = 760;
  const height = 180;
  const left = 8;
  const right = 12;
  const top = 12;
  const bottom = 18;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const values = data.flatMap((point) => [point.inflow, point.outflow, point.net, 0]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(1, maxValue - minValue);
  const x = (index: number) => left + (data.length === 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
  const y = (value: number) => top + ((maxValue - value) / range) * innerHeight;
  const polyline = (key: 'inflow' | 'outflow' | 'net') => data.map((point, index) => x(index) + ',' + y(point[key])).join(' ');
  const current = data[data.length - 1];
  return (
    <div className="min-w-0" role="img" aria-label={ariaLabel}>
      <div className="relative h-48 w-full">
        <svg viewBox={'0 0 ' + width + ' ' + height} className="h-full w-full" preserveAspectRatio="none">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const yy = top + ratio * innerHeight;
            return <line key={ratio} x1={left} x2={width - right} y1={yy} y2={yy} stroke="var(--line)" strokeWidth="1" />;
          })}
          <polyline points={polyline('outflow')} fill="none" stroke="var(--series-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={polyline('net')} fill="none" stroke="var(--success)" strokeWidth="1.8" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={polyline('inflow')} fill="none" stroke="var(--series-1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((point, index) => (
            <g key={point.label}>
              <circle cx={x(index)} cy={y(point.inflow)} r="2.8" fill="var(--series-1)" />
              <circle cx={x(index)} cy={y(point.outflow)} r="2.4" fill="var(--series-3)" />
              <circle cx={x(index)} cy={y(point.net)} r="2.4" fill="var(--success)" />
            </g>
          ))}
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-x-3 border-t border-line px-1 pt-2 text-[10px] tabular-nums text-muted sm:grid-cols-6">
        {data.map((point) => <span key={point.label} className="truncate text-center">{point.label}</span>)}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-muted">
        <span>Latest period</span>
        <span className="tabular-nums text-fg">{current ? formatNativeAmount(current.net, currency, true) : '—'} net</span>
      </div>
    </div>
  );
};
export const AdminInvoicing: React.FC = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const session = getAdminSession();
  const canViewFinancials = hasAdminPermission('canViewFinancials');
  const canManageInvoices = hasAdminPermission('canManageInvoices');
  const canCreateInvoice = canManageInvoices;
  const canDeleteInvoice = canManageInvoices;

  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [tab, setTab] = useState<Tab>('invoices');

  const financeView = useMemo(
    () => new URLSearchParams(location.search).get('finance') || 'invoices',
    [location.search]
  );

  useEffect(() => {
    if (financeView === 'income-expenses') setTab('expenses');
    if (financeView === 'invoices') setTab('invoices');
  }, [financeView]);
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
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
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
  const [confirmAction, setConfirmAction] = useState<{ type: 'invoice' | 'expense'; id: string; label: string } | null>(null);
  const [confirmingAction, setConfirmingAction] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState<'invoice' | 'expense' | 'payment' | null>(null);
  const [pendingPaymentInvoice, setPendingPaymentInvoice] = useState<AgencyInvoice | null>(null);
  const [invoiceDirty, setInvoiceDirty] = useState(false);
  const [expenseDirty, setExpenseDirty] = useState(false);
  const [paymentDirty, setPaymentDirty] = useState(false);
  const loadRequestId = React.useRef(0);

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

      if (!invoiceRes.success || !Array.isArray(invoiceRes.data?.invoices)) {
        throw new Error(invoiceRes.error || 'Unable to load invoices.');
      }
      if (!expenseRes.success || !Array.isArray(expenseRes.data?.expenses)) {
        throw new Error(expenseRes.error || 'Unable to load expenses.');
      }
      if (!metricsRes.success || !metricsRes.data?.metrics) {
        throw new Error(metricsRes.error || 'Unable to load financial metrics.');
      }

      if (requestId !== loadRequestId.current) return;
      setInvoices(invoiceRes.data.invoices as AgencyInvoice[]);
      setExpenses(expenseRes.data.expenses as FinanceExpense[]);
      setServerMetrics(metricsRes.data.metrics as ServerMetrics);
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

  useEffect(() => {
    if (!canViewFinancials) {
      setLoading(false);
      return;
    }
    void loadData();
  }, [canViewFinancials, currency]);

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

  const hasTrendData = cashFlow.some((point) => point.inflow !== 0 || point.outflow !== 0);

  const reportingQuarter = useMemo(() => {
    const dates = currencyInvoices.map((invoice) => invoice.issueDate).filter(Boolean).sort();
    return getQuarterRange(dates[dates.length - 1] || new Date());
  }, [currencyInvoices]);

  const ledgerInvoices = useMemo(
    () => ledgerPeriod === 'all'
      ? currencyInvoices
      : currencyInvoices.filter((invoice) => isInQuarter(invoice.issueDate, reportingQuarter)),
    [currencyInvoices, ledgerPeriod, reportingQuarter]
  );

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = ledgerInvoices.filter((invoice) => {
      const searchable = [
        invoice.invoiceNumber,
        invoice.clientName,
        invoice.clientCompany,
        invoice.clientEmail,
        projectsById.get(invoice.projectId)?.name || ''
      ].join(' ').toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'due_soon'
          ? isDueSoonInvoice(invoice)
          : invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...result].sort((a, b) => {
      if (sort === 'amount_high') return b.total - a.total;
      if (sort === 'amount_low') return a.total - b.total;
      if (sort === 'due') return String(a.dueDate).localeCompare(String(b.dueDate));
      if (sort === 'oldest') return String(a.updatedAt || '').localeCompare(String(b.updatedAt || ''));
      if (sort === 'invoice') return a.invoiceNumber.localeCompare(b.invoiceNumber);
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
  }, [ledgerInvoices, search, statusFilter, sort, projectsById]);

  useEffect(() => {
    setInvoicePage(1);
  }, [search, statusFilter, sort, currency]);

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
      .filter(({ daysUntilDue }) => daysUntilDue <= 7)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [currencyInvoices]);

  const invoiceStatusCounts = useMemo(() => (['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'] as InvoiceStatus[]).map((status) => ({
    status,
    count: ledgerInvoices.filter((invoice) => invoice.status === status).length
  })), [ledgerInvoices]);

  const dueSoonCount = useMemo(() => ledgerInvoices.filter(isDueSoonInvoice).length, [ledgerInvoices]);

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
      { label: '0–30 Days', tone: 'success' as const, amount: 0, count: 0 },
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
      .filter((invoice) => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + Math.max(0, Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0)))), 0),
    [currencyInvoices]
  );

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
        title="Finance & Invoices"
        description="Cash flow pacing, client accounts receivable, retainer burn, and tax provisions for the active financial period."
        actions={(
          <>
            <div className="inline-flex min-h-10 items-center rounded-control border border-line bg-panel p-1" aria-label="Finance currency">
              {(['IDR', 'USD'] as CurrencyCode[]).map((item) => (
                <button key={item} type="button" onClick={() => setActiveCurrency(item)} aria-pressed={currency === item} className={'min-h-8 rounded-chip px-3 text-xs font-semibold transition-colors ' + (currency === item ? 'bg-line text-fg' : 'text-muted hover:text-fg')}>
                  {item}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => void loadData(true)} disabled={refreshing} className={actionClass}>
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>
            <button type="button" onClick={exportInvoicesCsv} disabled={!filteredInvoices.length || refreshing} className={actionClass}>
              <Download size={14} />
              Export CSV
            </button>
            {canManageInvoices && (
              <button type="button" onClick={openCreateInvoice} disabled={!canManageInvoices} className={primaryClass}>
                <Plus size={14} />
                + New Invoice
              </button>
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

      {loading ? (
        <div className="space-y-6" aria-label="Loading finance">
          <div className="grid grid-cols-2 gap-3 min-[1100px]:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-card border border-line bg-panel" />)}</div>
          <div className="grid gap-3 min-[1100px]:grid-cols-3"><div className="h-72 animate-pulse rounded-card border border-line bg-panel min-[1100px]:col-span-2" /><div className="h-72 animate-pulse rounded-card border border-line bg-panel" /></div>
          <div className="h-80 animate-pulse rounded-card border border-line bg-panel" />
        </div>
      ) : financeView === 'tax-retainers' || financeView === 'financial-reports' ? (
        <section className="rounded-card border border-line bg-panel p-6 sm:p-8" aria-labelledby="finance-section-title">
          <div className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-bg text-muted">
            {financeView === 'tax-retainers' ? <DollarSign size={18} /> : <TrendingUp size={18} />}
          </div>
          <h2 id="finance-section-title" className="mt-4 text-base font-semibold text-fg">
            {financeView === 'tax-retainers' ? 'Tax & Retainers' : 'Financial Reports'}
          </h2>
          <p className="mt-2 max-w-[62ch] text-xs leading-5 text-muted">
            {financeView === 'tax-retainers'
              ? 'This Finance surface is reserved for tax provisions and retainer controls. The current AMS finance API does not expose a dedicated dataset for this section yet.'
              : 'This Finance surface is reserved for reporting packs and period summaries. The current AMS finance API does not expose a dedicated reporting dataset for this section yet.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/admin/invoicing')} className={primaryClass}>
              Open Invoices
            </button>
            <button type="button" onClick={() => navigate('/admin/invoicing?finance=income-expenses')} className={actionClass}>
              Open Income &amp; Expenses
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 min-[1100px]:grid-cols-5" aria-label="Finance KPI snapshot">
            {[
              { label: 'Total Invoiced', icon: <Receipt size={12} aria-hidden="true" />, value: formatNativeAmount(ledgerInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0), currency, true), context: (ledgerPeriod === 'reporting-quarter' ? (reportingQuarter?.label || 'Reporting period') + ' · ' : '') + (serverMetrics ? serverMetrics.totalInvoicesCount + ' total invoices' : ledgerInvoices.length + ' invoices'), tone: 'text-accent-text' },
              { label: 'Collected (YTD)', value: serverMetrics ? formatNativeAmount(serverMetrics.totalRevenueCollected, currency, true) : '—', context: currencyInvoices.length ? derivedMetrics.collectionRate + '% collection rate' : '—', icon: <WalletCards size={17} />, tone: 'text-success' },
              { label: 'Outstanding', value: serverMetrics ? formatNativeAmount(serverMetrics.totalOutstanding, currency, true) : '—', context: serverMetrics ? serverMetrics.overdueCount + ' overdue' : '—', icon: <CreditCard size={17} />, tone: 'text-warning' },
              { label: 'Overdue Balance', value: formatNativeAmount(overdueBalance, currency, true), context: serverMetrics ? serverMetrics.overdueCount + ' critical invoices' : '—', icon: <AlertCircle size={17} />, tone: 'text-danger' },
              { label: 'Operating Margin', value: serverMetrics ? serverMetrics.profitMargin + '%' : '—', context: serverMetrics && serverMetrics.netProfit >= 0 ? 'Healthy operating result' : 'Review operating result', icon: <TrendingUp size={17} />, tone: serverMetrics && serverMetrics.netProfit < 0 ? 'text-danger' : 'text-success' }
            ].map((metric) => (
              <article key={metric.label} className="min-w-0 rounded-card border border-line bg-panel p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.08em] font-semibold text-muted"><span className="truncate">{metric.label}</span><span className={'flex h-7 w-7 shrink-0 items-center justify-center rounded-control border border-line bg-bg ' + metric.tone}>{metric.icon}</span></div>
                <div className="mt-3 truncate text-2xl font-medium tabular-nums tracking-[-0.03em] text-fg">{metric.value}</div>
                <div className="mt-2 text-[11px]"><span className={'font-medium ' + metric.tone}>{metric.context}</span></div>
              </article>
            ))}
          </section>

          <section className="mt-3 rounded-card border border-line bg-panel px-4 py-3 sm:px-5" aria-label="Finance operating signals">
            <AdminMetricStrip className="grid-cols-2 sm:grid-cols-3 min-[1100px]:grid-cols-6" metrics={[
              { label: 'Collection rate', value: currencyInvoices.length ? derivedMetrics.collectionRate + '%' : '—', context: 'Current ledger' },
              { label: 'Monthly burn', value: derivedMetrics.monthlyBurnRate ? formatNativeAmount(derivedMetrics.monthlyBurnRate, currency, true) : '—', context: 'Expense run-rate' },
              { label: 'Cash runway', value: derivedMetrics.cashRunwayMonths == null ? '—' : derivedMetrics.cashRunwayMonths + ' mo', context: 'Based on current burn' }
            ]} />
          </section>

          <section className="mt-6 grid gap-3 min-[1100px]:grid-cols-3" aria-label="Finance visual analytics">
            <div className="min-[1100px]:col-span-2 rounded-card border border-line bg-panel p-4 sm:p-5">
              <div className="flex flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="financial-trend-title" className="text-sm font-semibold text-fg">Cash Flow vs Operating Burn</h2>
                  <p className="mt-1 text-xs leading-5 text-muted">Monthly billing inflow, operational burn rate, and net result from recorded transactions.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-success" /> Net Inflow</span>
                  <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-accent" /> Retainer Target</span>
                  <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-info" /> Operational Burn</span>
                </div>
              </div>
              <div className="pt-3">
                {hasTrendData ? <FinanceCashFlowChart data={cashFlow.filter((point) => point.inflow !== 0 || point.outflow !== 0)} currency={currency} ariaLabel="Cash flow versus operating burn by month." /> : <EmptyState title={language === 'id' ? 'Belum ada data arus kas' : 'No cash-flow data yet'} description={language === 'id' ? 'Chart akan muncul setelah ada pembayaran invoice atau expense aktual.' : 'The chart appears after actual invoice payments or expense records are available.'} />}
              </div>
            </div>

            <div className="rounded-card border border-line bg-panel p-4 sm:p-5">
              <div className="border-b border-line pb-4">
                <h2 className="text-sm font-semibold text-fg">Aging Receivables</h2>
                <p className="mt-1 text-xs text-muted">Total outstanding {formatNativeAmount(serverMetrics?.totalOutstanding || 0, currency, true)} across 3 buckets</p>
              </div>
              <div className="mt-4">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-line bg-bg">
                  {agingBuckets.map((bucket) => <div key={bucket.label} className={'h-full ' + (bucket.tone === 'success' ? 'bg-success' : bucket.tone === 'warning' ? 'bg-warning' : 'bg-danger')} style={{ width: bucket.percent + '%' }} title={bucket.label + ': ' + bucket.percent + '%'} />)}
                </div>
                <div className="my-4 space-y-2.5">
                  {agingBuckets.map((bucket) => (
                    <div key={bucket.label} className="rounded-control border border-line bg-bg px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2"><span className={'h-2 w-2 shrink-0 rounded-full ' + (bucket.tone === 'success' ? 'bg-success' : bucket.tone === 'warning' ? 'bg-warning' : 'bg-danger')} /><div className="min-w-0"><div className="truncate text-xs font-medium text-fg">{bucket.label}</div><div className="mt-0.5 text-[10px] text-muted">{bucket.count} open accounts</div></div></div>
                        <div className="shrink-0 text-right"><div className="text-xs font-semibold tabular-nums text-fg">{formatNativeAmount(bucket.amount, currency, true)}</div><div className={'mt-0.5 text-[10px] tabular-nums ' + (bucket.tone === 'danger' ? 'text-danger' : bucket.tone === 'warning' ? 'text-warning' : 'text-success')}>{bucket.percent}%</div></div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => actionRequiredInvoices[0] && openPrintPreview(actionRequiredInvoices[0].invoice)} className={actionRequiredInvoices.length ? actionClass + ' w-full' : actionClass + ' w-full opacity-60'} disabled={!actionRequiredInvoices.length}>
                  <ArrowUpRight size={14} />
                  Review overdue & due invoices
                </button>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-card border border-line bg-panel overflow-hidden" aria-labelledby="finance-workspace-title">
            <div className="border-b border-line p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <button type="button" onClick={() => setTab('invoices')} className={'inline-flex min-h-9 shrink-0 items-center gap-1.5 border-b-2 px-2 text-xs font-medium transition-colors ' + (tab === 'invoices' ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg')}><Receipt size={14} /> Invoices <span className="tabular-nums opacity-70">({currencyInvoices.length})</span></button>
                  <button type="button" onClick={() => setTab('expenses')} className={'inline-flex min-h-9 shrink-0 items-center gap-1.5 border-b-2 px-2 text-xs font-medium transition-colors ' + (tab === 'expenses' ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg')}><CreditCard size={14} /> Expenses <span className="tabular-nums opacity-70">({currencyExpenses.length})</span></button>
                </div>
                {tab === 'invoices' ? (
                  <div className="flex w-full flex-col gap-2 xl:w-auto xl:flex-row xl:items-center">
                    <label className="relative min-w-[220px] xl:w-64"><span className="sr-only">Search invoices</span><Search size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice # or client..." className={fieldClass + ' pl-9 pr-3'} /></label>
                    <div className="flex items-center gap-1 overflow-x-auto rounded-control border border-line bg-bg p-0.5 custom-scrollbar">
                      {['All', 'Paid', 'Due Soon', 'Overdue', 'Draft'].map((label) => {
                        const key = label === 'All' ? 'all' : label === 'Paid' ? 'paid' : label === 'Due Soon' ? 'due_soon' : label === 'Overdue' ? 'overdue' : 'draft';
                        const count = key === 'all' ? ledgerInvoices.length : key === 'due_soon' ? dueSoonCount : invoiceStatusCounts.find((item) => item.status === key)?.count || 0;
                        return <button key={label} type="button" onClick={() => setStatusFilter(key)} className={'min-h-8 shrink-0 rounded-chip px-2.5 text-[11px] font-medium transition-colors ' + (statusFilter === key ? 'bg-line text-fg' : 'text-muted hover:text-fg')}>{label}<span className="ml-1 tabular-nums opacity-70">{count}</span></button>;
                      })}
                    </div>
                    <div className="relative">
                      <button type="button" onClick={() => setPeriodMenuOpen((open) => !open)} className={actionClass + ' w-full justify-between xl:w-auto'} aria-expanded={periodMenuOpen}>
                        <CalendarDays size={13} />
                        {ledgerPeriod === 'reporting-quarter' ? (reportingQuarter?.label || 'Reporting period') : 'All periods'}
                      </button>
                      {periodMenuOpen && (
                        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 rounded-card border border-line bg-panel p-1.5">
                          <button type="button" onClick={() => { setLedgerPeriod('reporting-quarter'); setPeriodMenuOpen(false); setStatusFilter('all'); }} className="w-full rounded-control px-3 py-2 text-left text-xs text-fg hover:bg-bg">
                            <span className="block font-medium">{reportingQuarter?.label || 'Reporting period'}</span>
                            <span className="mt-0.5 block text-[10px] text-muted">Match the latest invoice quarter</span>
                          </button>
                          <button type="button" onClick={() => { setLedgerPeriod('all'); setPeriodMenuOpen(false); setStatusFilter('all'); }} className="mt-1 w-full rounded-control px-3 py-2 text-left text-xs text-muted hover:bg-bg hover:text-fg">
                            <span className="block font-medium">All periods</span>
                            <span className="mt-0.5 block text-[10px]">Show the full invoice ledger</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => setPeriodMenuOpen(false)} className={actionClass + ' w-9 px-0'} aria-label="Filter columns" title="Filter columns">
                      <SlidersHorizontal size={14} />
                    </button>
                    <CustomSelect value={sort} onChange={(value) => setSort(value as SortKey)} options={sortOptions} className="w-full xl:w-44" triggerClassName="h-9 min-h-9 w-full" aria-label="Invoice sort" />
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-2 xl:w-auto xl:flex-row">
                    <label className="relative min-w-[220px] xl:w-64"><span className="sr-only">Search expenses</span><Search size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted" /><input value={expenseSearch} onChange={(event) => setExpenseSearch(event.target.value)} placeholder="Search expense or category..." className={fieldClass + ' pl-9 pr-3'} /></label>
                    <CustomSelect value={expenseTypeFilter} onChange={setExpenseTypeFilter} options={expenseTypeOptions} className="w-full xl:w-40" triggerClassName="h-9 min-h-9 w-full" aria-label="Expense type filter" />
                    <CustomSelect value={expenseSort} onChange={(value) => setExpenseSort(value as typeof expenseSort)} options={[{ value: 'date_desc', label: 'Newest date' }, { value: 'date_asc', label: 'Oldest date' }, { value: 'amount_high', label: 'Highest amount' }, { value: 'amount_low', label: 'Lowest amount' }]} className="w-full xl:w-40" triggerClassName="h-9 min-h-9 w-full" aria-label="Expense sort" />
                  </div>
                )}
              </div>
              {tab === 'invoices' && <div className="mt-3 flex items-center gap-2 border-t border-line pt-3"><span className="text-[10px] uppercase tracking-[0.08em] text-muted">Ledger</span><span className="h-1 w-1 rounded-full bg-line" /><span className="text-[10px] text-muted">Current financial period</span>{statusFilter !== 'all' && <button type="button" onClick={() => setStatusFilter('all')} className="ml-auto rounded-chip px-2 py-1 text-[11px] text-muted hover:text-fg">Clear filters</button>}</div>}
            </div>
            <div className="p-0">
              {tab === 'invoices' ? (
                <>
                  {filteredInvoices.length === 0 ? <EmptyState title="No invoices found" description={search || statusFilter !== 'all' ? 'No invoices match the current search or filter.' : 'No invoice records are available yet.'} action={canManageInvoices ? <button type="button" onClick={openCreateInvoice} className={primaryClass}><Plus size={14} />Create invoice</button> : undefined} /> : (
                    <>
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="ams-table w-full min-w-[1040px] border-collapse text-left text-xs">
                          <thead className="bg-bg"><tr>
                            <th className="px-4 py-3 sm:px-5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Invoice #</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Client &amp; Project</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Issue Date</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Due Date</th>
                            <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Amount (IDR)</th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Status</th>
                            <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Actions</th>
                          </tr></thead>
                          <tbody>
                            {paginatedInvoices.map((invoice) => {
                              const balance = Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0)));
                              const project = projectsById.get(invoice.projectId);
                              const isOverdue = invoice.status === 'overdue';
                              return (
                                <tr key={invoice.id} className="group border-t border-line transition-colors hover:bg-bg">
                                  <td className="px-4 py-3 sm:px-5"><div className="flex items-center gap-2"><span className={'h-1.5 w-1.5 rounded-full ' + (isOverdue ? 'bg-danger' : invoice.status === 'paid' ? 'bg-success' : invoice.status === 'sent' ? 'bg-info' : 'bg-warning')} /><button type="button" onClick={() => openPrintPreview(invoice)} className="font-medium tabular-nums text-fg hover:text-accent-text">{invoice.invoiceNumber}</button></div><p className="mt-1 text-[11px] text-muted">{invoice.currency}</p></td>
                                  <td className="px-4 py-3"><div className="font-medium text-fg">{invoice.clientCompany || invoice.clientName}</div><div className="mt-0.5 text-[11px] text-muted">{project?.name || invoice.clientName}</div></td>
                                  <td className="px-4 py-3 tabular-nums text-muted">{invoice.issueDate}</td>
                                  <td className={'px-4 py-3 tabular-nums font-medium ' + (isOverdue ? 'text-danger' : 'text-muted')}>{invoice.dueDate}{isOverdue && <div className="mt-0.5 text-[10px] text-danger">Overdue</div>}</td>
                                  <td className="px-4 py-3 text-right"><div className="font-semibold tabular-nums text-fg">{formatNativeAmount(invoice.total, invoice.currency)}</div><div className="mt-0.5 text-[10px] tabular-nums text-muted">{balance > 0 ? 'Due ' + formatNativeAmount(balance, invoice.currency, true) : 'Settled'}</div></td>
                                  <td className="px-4 py-3">{canManageInvoices && invoice.status !== 'cancelled' ? <InvoiceStatusDropdown status={invoice.status} allowedStatuses={['draft', 'sent', 'overdue']} disabled={updatingInvoiceId === invoice.id || !['draft', 'sent', 'overdue'].includes(invoice.status)} onChange={(next) => void updateInvoiceStatus(invoice, next)} /> : <StatusBadge status={invoice.status} />}</td>
                                  <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                                    {canManageInvoices && invoice.status !== 'paid' && invoice.status !== 'cancelled' && balance > 0 && <button type="button" onClick={() => openPayment(invoice)} className="inline-flex h-7 min-h-7 items-center rounded-control border border-line bg-bg px-2.5 text-[10px] font-medium text-muted hover:bg-panel-hover hover:text-fg">Pay</button>}
                                    <button type="button" onClick={() => openPrintPreview(invoice)} className="inline-flex h-7 w-7 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label="View invoice" title="View invoice"><FileText size={15} /></button>
                                    {canManageInvoices && invoice.status !== 'cancelled' && <button type="button" onClick={() => openEditInvoice(invoice)} className="inline-flex h-7 w-7 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label="Edit invoice" title="Edit invoice"><Edit3 size={14} /></button>}
                                    {canManageInvoices && canDeleteInvoice && !['cancelled', 'paid', 'partially_paid'].includes(invoice.status) && <button type="button" onClick={() => setConfirmAction({ type: 'invoice', id: invoice.id, label: invoice.invoiceNumber })} className="inline-flex h-7 w-7 items-center justify-center rounded-control text-muted hover:bg-danger/10 hover:text-danger" aria-label="Cancel invoice" title="Cancel invoice"><Trash2 size={14} /></button>}
                                  </div></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {invoicePageCount > 1 && <div className="border-t border-line px-4 py-3 sm:px-5"><div className="flex flex-col gap-2 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-1 tabular-nums"><span>Showing</span><span className="font-medium text-fg">{((invoicePage - 1) * invoicePageSize) + 1}–{Math.min(invoicePage * invoicePageSize, filteredInvoices.length)}</span><span>of</span><span className="font-medium text-fg">{filteredInvoices.length}</span><span>invoices</span></div><div className="flex items-center gap-1"><button type="button" onClick={() => setInvoicePage((page) => Math.max(1, page - 1))} disabled={invoicePage === 1} className={actionClass}>Previous</button><button type="button" disabled className="h-7 w-7 rounded-control border border-line bg-line text-[10px] font-semibold text-fg">{invoicePage}</button><button type="button" onClick={() => setInvoicePage((page) => Math.min(invoicePageCount, page + 1))} disabled={invoicePage === invoicePageCount} className={actionClass}>Next</button></div></div></div>}
                    </>
                  )}
                </>
              ) : (
                <div className="p-4 sm:p-5">
                  {filteredExpenses.length === 0 ? <EmptyState title="No expenses found" description={expenseSearch || expenseTypeFilter !== 'all' ? 'No actual expense records match the current search or filter.' : 'Only actual expense records are shown. No placeholder rows are used.'} action={canManageInvoices ? <button type="button" onClick={openExpenseModal} className={primaryClass}><Plus size={14} />Record expense</button> : undefined} /> : (
                    <div className="overflow-x-auto rounded-card border border-line bg-panel custom-scrollbar">
                      <table className="ams-table w-full min-w-[820px] border-collapse text-left text-xs">
                        <thead className="bg-bg"><tr><th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Date</th><th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Type / category</th><th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Description</th><th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Amount</th><th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Recorded by</th><th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Action</th></tr></thead>
                        <tbody>{paginatedExpenses.map((expense) => <tr key={expense.id} className="border-t border-line transition-colors hover:bg-bg"><td className="px-4 py-3 tabular-nums text-muted">{expense.date}</td><td className="px-4 py-3"><div className="font-medium text-fg">{expense.type || 'OpEx'}</div><div className="mt-0.5 text-[11px] text-muted">{expense.category}</div></td><td className="px-4 py-3 text-fg">{expense.description}</td><td className="px-4 py-3 text-right font-medium tabular-nums text-fg">{formatNativeAmount(expense.amount, expense.currency || currency)}</td><td className="px-4 py-3 text-muted">{expense.recordedBy}</td><td className="px-4 py-3 text-right">{canManageInvoices && <button type="button" onClick={() => setConfirmAction({ type: 'expense', id: expense.id, label: expense.description })} className="inline-flex h-7 w-7 items-center justify-center rounded-control text-muted hover:bg-danger/10 hover:text-danger" aria-label="Void expense" title="Void expense"><Trash2 size={14} /></button>}</td></tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </>
      )}

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
