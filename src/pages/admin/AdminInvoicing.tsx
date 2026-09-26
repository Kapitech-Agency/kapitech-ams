import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
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
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X
} from 'lucide-react';
import { AgencyExpense, AgencyInvoice, InvoiceLineItem, InvoiceStatus, computeInvoiceTotals, computeFinancialMetrics, getMonthlyCashFlowSeries } from '../../lib/financeStore';
import { CurrencyCode, CURRENCY_EVENT, getActiveCurrency, setActiveCurrency, formatAmount } from '../../lib/currency';
import { useLanguage } from '../../lib/LanguageContext';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';
import { InvoiceStatusDropdown } from '../../components/ui/InvoiceStatusDropdown';
import { TrendChart } from '../../components/charts/DashboardCharts';
import { getAdminSession, hasAdminPermission } from '../../lib/adminAuth';
import { api } from '../../lib/apiClient';

type SortKey = 'updated' | 'due' | 'oldest' | 'amount_high' | 'amount_low' | 'invoice';
type Tab = 'invoices' | 'expenses';
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

const emptyLineItem = (): InvoiceLineItem => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'line-' + Date.now(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0
});

const cardClass = 'ams-dashboard-card rounded-card border border-line bg-panel p-4';
const actionClass = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-line bg-transparent px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50';
const primaryClass = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control bg-accent px-3.5 text-xs font-semibold text-white transition-colors hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50';
const fieldClass = 'min-h-10 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none transition-colors placeholder:text-muted focus:border-accent';

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

export const AdminInvoicing: React.FC = () => {
  const { language } = useLanguage();
  const session = getAdminSession();
  const canViewFinancials = hasAdminPermission('canViewFinancials');
  const canManageInvoices = hasAdminPermission('canManageInvoices');
  const canCreateInvoice = canManageInvoices;
  const canDeleteInvoice = session?.user?.role?.startsWith('Tier 1') || session?.user?.stakeholderType === 'Master';

  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [tab, setTab] = useState<Tab>('invoices');
  const [invoices, setInvoices] = useState<AgencyInvoice[]>([]);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [clients, setClients] = useState<FinanceClient[]>([]);
  const [projects, setProjects] = useState<FinanceProject[]>([]);
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('updated');
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
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));

  const [paymentInvoice, setPaymentInvoice] = useState<AgencyInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'credit_card' | 'cash' | 'other'>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const [detailInvoice, setDetailInvoice] = useState<AgencyInvoice | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'invoice' | 'expense'; id: string; label: string } | null>(null);

  const showNotice = (tone: 'success' | 'danger', message: string) => {
    setNotice({ tone, message });
    window.setTimeout(() => setNotice((current) => current?.message === message ? null : current), 3500);
  };

  const loadData = async (silent = false) => {
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
      setError(err instanceof Error ? err.message : 'Financial data is temporarily unavailable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const derivedMetrics = useMemo(
    () => computeFinancialMetrics(currencyInvoices, currencyExpenses),
    [currencyInvoices, currencyExpenses]
  );

  const cashFlow = useMemo(
    () => getMonthlyCashFlowSeries(currencyInvoices, currencyExpenses),
    [currencyInvoices, currencyExpenses]
  );

  const hasTrendData = cashFlow.some((point) => point.inflow !== 0 || point.outflow !== 0);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = currencyInvoices.filter((invoice) => {
      const searchable = [
        invoice.invoiceNumber,
        invoice.clientName,
        invoice.clientCompany,
        invoice.clientEmail,
        projects.find((project) => project.id === invoice.projectId)?.name || ''
      ].join(' ').toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
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
  }, [currencyInvoices, search, statusFilter, sort, projects]);

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
    count: currencyInvoices.filter((invoice) => invoice.status === status).length
  })), [currencyInvoices]);

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

  const invoiceTotals = useMemo(
    () => computeInvoiceTotals(invoiceItems, taxPercent, discountPercent),
    [invoiceItems, taxPercent, discountPercent]
  );

  const resetInvoiceForm = () => {
    setEditingInvoice(null);
    setInvoiceNumber('');
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
    setIssueDate(new Date().toISOString().slice(0, 10));
    setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setPaymentTerms('');
    setInvoiceNotes('');
  };

  const openCreateInvoice = () => {
    resetInvoiceForm();
    setInvoiceModalOpen(true);
  };

  const openEditInvoice = (invoice: AgencyInvoice) => {
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
    setClientId(id);
    const client = clients.find((item) => item.id === id);
    if (!client) return;
    setClientName(client.name);
    setClientCompany(client.company);
    setClientEmail(client.email);
    setClientPhone(client.phone);
  };

  const selectProject = (id: string) => {
    setProjectId(id);
    const project = projects.find((item) => item.id === id);
    if (!project) return;
    if (project.clientId) selectClient(project.clientId);
    if (!clientName) setClientName(project.clientName || '');
    if (!clientCompany) setClientCompany(project.clientCompany || '');
  };

  const updateLineItem = (index: number, patch: Partial<InvoiceLineItem>) => {
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

    const validItems = invoiceItems
      .filter((item) => item.description.trim() && Number(item.quantity) > 0 && Number(item.unitPrice) >= 0)
      .map((item) => ({
        ...item,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount: Math.round(Number(item.quantity) * Number(item.unitPrice))
      }));

    if (!clientName.trim() || !clientCompany.trim() || validItems.length === 0) {
      showNotice('danger', language === 'id' ? 'Klien, perusahaan, dan minimal satu line item wajib diisi.' : 'Client, company, and at least one line item are required.');
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
        notes: invoiceNotes.trim()
      };

      const result = editingInvoice
        ? await api.finance.updateInvoice(editingInvoice.id, payload)
        : await api.finance.createInvoice(payload);

      if (!result.success) throw new Error(result.error || 'Invoice could not be saved.');
      setInvoiceModalOpen(false);
      showNotice('success', language === 'id' ? 'Invoice berhasil disimpan.' : 'Invoice saved successfully.');
      await loadData(true);
    } catch (err) {
      showNotice('danger', err instanceof Error ? err.message : 'Invoice could not be saved.');
    } finally {
      setSavingInvoice(false);
    }
  };

  const updateInvoiceStatus = async (invoice: AgencyInvoice, nextStatus: InvoiceStatus) => {
    if (!canManageInvoices || invoice.status === nextStatus || nextStatus === 'cancelled') return;
    const result = await api.finance.updateInvoice(invoice.id, { status: nextStatus });
    if (!result.success) {
      showNotice('danger', result.error || 'Invoice status could not be updated.');
      return;
    }
    showNotice('success', language === 'id' ? 'Status invoice diperbarui.' : 'Invoice status updated.');
    await loadData(true);
  };

  const openPayment = (invoice: AgencyInvoice) => {
    const balance = Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0)));
    setPaymentInvoice(invoice);
    setPaymentAmount(Math.max(0, balance));
    setPaymentMethod('bank_transfer');
    setPaymentReference('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentNotes('');
  };

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentInvoice || !canManageInvoices || savingPayment) return;
    const balance = Number(paymentInvoice.balanceDue ?? (paymentInvoice.total - (paymentInvoice.amountPaid || 0)));
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > balance) {
      showNotice('danger', language === 'id' ? 'Nominal pembayaran harus lebih dari 0 dan tidak boleh melebihi sisa tagihan.' : 'Payment must be greater than 0 and cannot exceed the remaining balance.');
      return;
    }

    setSavingPayment(true);
    try {
      const result = await api.finance.payInvoice(paymentInvoice.id, {
        amount,
        date: paymentDate,
        method: paymentMethod,
        reference: paymentReference.trim(),
        notes: paymentNotes.trim()
      });
      if (!result.success) throw new Error(result.error || 'Payment could not be recorded.');
      setPaymentInvoice(null);
      showNotice('success', language === 'id' ? 'Pembayaran berhasil dicatat.' : 'Payment recorded successfully.');
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
    if (!expenseDescription.trim() || !Number.isFinite(amount) || amount <= 0) {
      showNotice('danger', language === 'id' ? 'Deskripsi dan nominal pengeluaran wajib diisi.' : 'Description and a valid expense amount are required.');
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
        currency
      });
      if (!result.success) throw new Error(result.error || 'Expense could not be saved.');
      setExpenseModalOpen(false);
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
    if (!confirmAction) return;
    const result = confirmAction.type === 'invoice'
      ? await api.finance.deleteInvoice(confirmAction.id)
      : await api.finance.deleteExpense(confirmAction.id);
    if (!result.success) {
      showNotice('danger', result.error || 'Action could not be completed.');
    } else {
      showNotice('success', confirmAction.type === 'invoice'
        ? (language === 'id' ? 'Invoice dibatalkan.' : 'Invoice cancelled.')
        : (language === 'id' ? 'Pengeluaran dibatalkan.' : 'Expense voided.'));
      await loadData(true);
    }
    setConfirmAction(null);
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
    <div className="min-h-full pb-8">
      <header className="ams-dashboard-header mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Kapitech AMS</span>
            <span aria-hidden="true">/</span>
            <span className="text-fg">Finance &amp; Invoicing</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold leading-7 tracking-[-0.01em] text-fg">{language === 'id' ? 'Keuangan &amp; Invoicing' : 'Finance &amp; Invoicing'}</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
            {language === 'id' ? 'Pantau kas masuk, piutang, pengeluaran, dan invoice dari data keuangan aktual.' : 'Monitor collected revenue, receivables, expenses, and invoices from current financial data.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="inline-flex min-h-10 items-center rounded-control border border-line bg-panel p-1" aria-label="Finance currency">
            {(['IDR', 'USD'] as CurrencyCode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveCurrency(item)}
                aria-pressed={currency === item}
                className={'min-h-8 rounded-chip px-3 text-xs font-semibold transition-colors ' + (currency === item ? 'bg-accent text-white' : 'text-muted hover:text-fg')}
              >
                {item}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => void loadData(true)} disabled={refreshing} className={actionClass}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? (language === 'id' ? 'Memuat' : 'Refreshing') : (language === 'id' ? 'Segarkan' : 'Refresh')}
          </button>
          {canManageInvoices && (
            <>
              <button type="button" onClick={() => setExpenseModalOpen(true)} disabled={!canManageInvoices} className={actionClass}>
                <Plus size={14} />
                {language === 'id' ? 'Catat pengeluaran' : 'Record expense'}
              </button>
              <button type="button" onClick={openCreateInvoice} disabled={!canManageInvoices} className={primaryClass}>
                <Plus size={14} />
                {language === 'id' ? 'Buat invoice' : 'Create invoice'}
              </button>
            </>
          )}
        </div>
      </header>

      {notice && (
        <div className={'mb-6 flex items-start gap-2 rounded-card border px-4 py-3 text-xs ' + (notice.tone === 'success' ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger')} role="status">
          {notice.tone === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
          <span>{notice.message}</span>
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
          <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-card border border-line bg-panel" />)}
          </div>
          <div className="h-56 animate-pulse rounded-card border border-line bg-panel" />
          <div className="h-72 animate-pulse rounded-card border border-line bg-panel" />
        </div>
      ) : (
        <>
          <section aria-labelledby="finance-snapshot-title">
            <div className="mb-3 flex items-end justify-between gap-3 border-b border-line pb-3">
              <div className="min-w-0">
                <h2 id="finance-snapshot-title" className="text-sm font-semibold text-fg">{language === 'id' ? 'Ringkasan finansial' : 'Financial snapshot'}</h2>
                <p className="mt-1 text-xs text-muted">{currency} ledger based on current server-calculated metrics.</p>
              </div>
              {serverMetrics && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-badge border border-accent/20 bg-accent/10 px-2 py-1 text-[11px] font-semibold tabular-nums text-accent-text">
                  <Receipt size={12} aria-hidden="true" />
                  {serverMetrics.totalInvoicesCount} invoices
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 min-[1100px]:grid-cols-6">
              {[
                { label: language === 'id' ? 'Pendapatan diterima' : 'Revenue collected', value: serverMetrics ? formatAmount(serverMetrics.totalRevenueCollected, currency) : '—', context: serverMetrics ? serverMetrics.paidCount + ' paid invoices' : '—', icon: DollarSign, tone: 'text-accent-text' },
                { label: language === 'id' ? 'Piutang' : 'Outstanding', value: serverMetrics ? formatAmount(serverMetrics.totalOutstanding, currency) : '—', context: serverMetrics ? serverMetrics.overdueCount + ' overdue' : '—', icon: WalletCards, tone: 'text-warning' },
                { label: language === 'id' ? 'Pengeluaran' : 'Expenses', value: serverMetrics ? formatAmount(serverMetrics.totalExpense, currency) : '—', context: currencyExpenses.length + ' records', icon: TrendingDown, tone: 'text-series-3' },
                { label: language === 'id' ? 'Laba operasi' : 'Operating profit', value: serverMetrics ? formatAmount(serverMetrics.netProfit, currency) : '—', context: serverMetrics ? serverMetrics.profitMargin + '% margin' : '—', icon: TrendingUp, tone: 'text-success' },
                { label: 'OpEx', value: formatAmount(derivedMetrics.opExExpenses, currency), context: 'Operating expense', icon: CreditCard, tone: 'text-info' },
                { label: 'CapEx', value: formatAmount(derivedMetrics.capExExpenses, currency), context: 'Capital expense', icon: ArrowUpRight, tone: 'text-muted' }
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                <div key={metric.label} className="min-w-0 border-l border-line px-4 py-5 first:border-l-0 min-[1100px]:py-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs leading-4 text-muted">{metric.label}</span>
                    <Icon size={16} className={'shrink-0 ' + metric.tone} strokeWidth={1.8} />
                  </div>
                  <div className="mt-3 truncate text-lg font-medium leading-7 tracking-[-0.01em] tabular-nums text-fg sm:text-xl">{metric.value}</div>
                  <div className="mt-1 min-h-4 text-[11px] leading-4 text-muted">{metric.context}</div>
                </div>
                );
              })}
            </div>
          </section>

          <section className="mt-6" aria-labelledby="financial-flow-title">
            <div className={cardClass}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 id="financial-flow-title" className="text-sm font-semibold text-fg">{language === 'id' ? 'Financial operating summary' : 'Financial operating summary'}</h2>
                  <p className="mt-1 text-xs leading-5 text-muted">Collected revenue → expenses → operating result.</p>
                </div>
                <span className="rounded-badge bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent-text">{serverMetrics?.profitMargin || '0'}% margin</span>
              </div>
              <div className="mt-5 grid grid-cols-2 border-y border-line sm:grid-cols-4">
                {[
                  { label: 'Revenue', value: serverMetrics ? formatAmount(serverMetrics.totalRevenueCollected, currency) : '—', tone: 'text-accent-text' },
                  { label: 'Expenses', value: serverMetrics ? formatAmount(serverMetrics.totalExpense, currency) : '—', tone: 'text-series-3' },
                  { label: 'Operating profit', value: serverMetrics ? formatAmount(serverMetrics.netProfit, currency) : '—', tone: 'text-success' },
                  { label: 'Outstanding', value: serverMetrics ? formatAmount(serverMetrics.totalOutstanding, currency) : '—', tone: 'text-warning' }
                ].map((metric) => (
                  <div key={metric.label} className={'min-w-0 px-4 py-4 sm:px-5 ' + (metric.label === 'Operating profit' ? '' : 'border-l border-line')}>
                    <p className="text-xs text-muted">{metric.label}</p>
                    <p className={'mt-2 truncate text-sm font-medium tabular-nums ' + metric.tone}>{metric.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-line border-t border-line pt-0 sm:grid-cols-3 sm:divide-y-0">
                <div className="min-w-0 px-3 py-4 sm:pl-4"><p className="text-xs text-muted">Collection rate</p><p className="mt-1 text-sm font-medium tabular-nums text-fg">{currencyInvoices.length ? derivedMetrics.collectionRate + '%' : '—'}</p></div>
                <div className="min-w-0 px-3 py-4 sm:pl-4"><p className="text-xs text-muted">Monthly burn rate</p><p className="mt-1 text-sm font-medium tabular-nums text-fg">{derivedMetrics.monthlyBurnRate ? formatAmount(derivedMetrics.monthlyBurnRate, currency) : '—'}</p></div>
                <div className="min-w-0 px-3 py-4 sm:pl-4"><p className="text-xs text-muted">Cash runway</p><p className="mt-1 text-sm font-medium tabular-nums text-fg">{derivedMetrics.cashRunwayMonths == null ? 'Not available' : derivedMetrics.cashRunwayMonths + ' mo'}</p></div>
              </div>
            </div>

            <div className={`${cardClass} mt-3`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="financial-trend-title" className="text-sm font-semibold text-fg">{language === 'id' ? 'Arus kas tercatat' : 'Recorded cash flow'}</h2>
                  <p className="mt-1 text-xs leading-5 text-muted">Only periods with actual payment and expense data are shown.</p>
                </div>
                <TrendingUp size={16} className="text-muted" strokeWidth={1.8} />
              </div>
              <div className="mt-4">
                {hasTrendData ? (
                  <TrendChart
                    data={cashFlow.filter((point) => point.inflow !== 0 || point.outflow !== 0).map((point) => ({ label: point.month, primary: point.inflow, secondary: point.outflow, tertiary: point.net }))}
                    primaryLabel="Revenue"
                    secondaryLabel="Expenses"
                    primaryFormat={(value) => formatAmount(value, currency, true)}
                    ariaLabel="Recorded revenue and expenses over available periods."
                  />
                ) : (
                  <EmptyState title={language === 'id' ? 'Belum ada data tren' : 'No trend data yet'} description={language === 'id' ? 'Chart tidak dibuat ketika tidak ada pembayaran atau pengeluaran aktual.' : 'A chart is not shown when there are no recorded payments or expenses.'} />
                )}
              </div>
            </div>
          </section>

          {actionRequiredInvoices.length > 0 && (
            <section className="mt-6" aria-labelledby="finance-actions-title">
              <div className={cardClass}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 id="finance-actions-title" className="text-sm font-semibold text-fg">{language === 'id' ? 'Perlu perhatian' : 'Action required'}</h2>
                    <p className="mt-1 text-xs leading-5 text-muted">Invoices that are overdue or due within the next 7 days.</p>
                  </div>
                  <span className="rounded-badge border border-warning/30 bg-warning/10 px-2 py-1 text-[11px] font-semibold tabular-nums text-warning">{actionRequiredInvoices.length}</span>
                </div>
                <div className="mt-4 divide-y divide-line border-y border-line">
                  {actionRequiredInvoices.slice(0, 5).map(({ invoice, daysUntilDue }) => {
                    const balance = Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0)));
                    const overdue = invoice.status === 'overdue' || daysUntilDue < 0;
                    return (
                      <button key={invoice.id} type="button" onClick={() => openPrintPreview(invoice)} className="flex w-full items-center gap-3 py-3 text-left hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent">
                        <span className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-control ' + (overdue ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning')}><AlertCircle size={15} /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-fg">{invoice.invoiceNumber}</span><span className="mt-0.5 block truncate text-[11px] text-muted">{invoice.clientCompany || invoice.clientName}</span></span>
                        <span className="shrink-0 text-right"><span className="block text-xs font-medium tabular-nums text-fg">{formatAmount(balance, invoice.currency)}</span><span className={'mt-0.5 block text-[11px] ' + (overdue ? 'text-danger' : 'text-warning')}>{overdue ? 'Overdue' : (daysUntilDue + 'd left')}</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section className="mt-6" aria-labelledby="finance-workspace-title">
            <div className="rounded-card border border-line bg-panel p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="inline-flex w-fit items-center rounded-control border border-line bg-bg p-1">
                  <button type="button" onClick={() => setTab('invoices')} className={'inline-flex min-h-9 items-center gap-1.5 rounded-chip px-3 text-xs font-medium ' + (tab === 'invoices' ? 'bg-accent text-white' : 'text-muted hover:text-fg')}>
                    <Receipt size={14} />
                    {language === 'id' ? 'Invoice' : 'Invoices'} <span className="tabular-nums opacity-80">({currencyInvoices.length})</span>
                  </button>
                  <button type="button" onClick={() => setTab('expenses')} className={'inline-flex min-h-9 items-center gap-1.5 rounded-chip px-3 text-xs font-medium ' + (tab === 'expenses' ? 'bg-accent text-white' : 'text-muted hover:text-fg')}>
                    <CreditCard size={14} />
                    {language === 'id' ? 'Pengeluaran' : 'Expenses'} <span className="tabular-nums opacity-80">({currencyExpenses.length})</span>
                  </button>
                </div>

                {tab === 'invoices' ? (
                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(320px,1fr)_168px_190px] lg:w-auto lg:min-w-[680px]">
                    <label className="relative min-w-0">
                      <span className="sr-only">Search invoices</span>
                      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted" />
                      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={language === 'id' ? 'Cari invoice, klien, proyek...' : 'Search invoice, client, project...'} className={fieldClass + ' pl-9 pr-3'} />
                    </label>
                    <CustomSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} className="w-full min-w-0" triggerClassName="h-10 min-h-10 w-full sm:h-9 sm:min-h-9" aria-label="Invoice status filter" />
                    <CustomSelect value={sort} onChange={(value) => setSort(value as SortKey)} options={sortOptions} className="w-full min-w-0" triggerClassName="h-10 min-h-10 w-full whitespace-nowrap sm:h-9 sm:min-h-9" aria-label="Invoice sort" />
                  </div>
                ) : (
                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(320px,1fr)_168px_190px] lg:w-auto lg:min-w-[680px]">
                    <label className="relative min-w-0">
                      <span className="sr-only">Search expenses</span>
                      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted" />
                      <input value={expenseSearch} onChange={(event) => setExpenseSearch(event.target.value)} placeholder={language === 'id' ? 'Cari pengeluaran, kategori, pencatat...' : 'Search expense, category, recorder...'} className={fieldClass + ' pl-9 pr-3'} />
                    </label>
                    <CustomSelect value={expenseTypeFilter} onChange={setExpenseTypeFilter} options={expenseTypeOptions} className="w-full min-w-0" triggerClassName="h-10 min-h-10 w-full sm:h-9 sm:min-h-9" aria-label="Expense type filter" />
                    <CustomSelect value={expenseSort} onChange={(value) => setExpenseSort(value as typeof expenseSort)} options={[
                      { value: 'date_desc', label: language === 'id' ? 'Tanggal terbaru' : 'Newest date' },
                      { value: 'date_asc', label: language === 'id' ? 'Tanggal terlama' : 'Oldest date' },
                      { value: 'amount_high', label: language === 'id' ? 'Nominal tertinggi' : 'Highest amount' },
                      { value: 'amount_low', label: language === 'id' ? 'Nominal terendah' : 'Lowest amount' }
                    ]} className="w-full min-w-0" triggerClassName="h-10 min-h-10 w-full whitespace-nowrap sm:h-9 sm:min-h-9" aria-label="Expense sort" />
                  </div>
                )}
              </div>
              {tab === 'invoices' && currencyInvoices.length > 0 && (
                <div className="mt-3 flex gap-1 overflow-x-auto border-t border-line pt-3">
                  {invoiceStatusCounts.filter((item) => item.count > 0).map(({ status, count }) => (
                    <button key={status} type="button" onClick={() => setStatusFilter(status)} className={'shrink-0 rounded-chip border px-2.5 py-1 text-[11px] font-semibold transition-colors ' + (statusFilter === status ? 'border-accent/30 bg-accent/10 text-accent-text' : 'border-line text-muted hover:text-fg')}>
                      {statusLabel[status]} <span className="tabular-nums">{count}</span>
                    </button>
                  ))}
                  {statusFilter !== 'all' && <button type="button" onClick={() => setStatusFilter('all')} className="shrink-0 rounded-chip px-2.5 py-1 text-[11px] text-muted hover:text-fg">Clear</button>}
                </div>
              )}
            </div>

            <div className="mt-3">
              {tab === 'invoices' ? (
                <>
                  {filteredInvoices.length === 0 ? (
                    <EmptyState
                      title={language === 'id' ? 'Belum ada invoice' : 'No invoices found'}
                      description={search || statusFilter !== 'all' ? 'No invoices match the current search or filter.' : 'No invoice records are available yet.'}
                      action={canManageInvoices ? <button type="button" onClick={() => setInvoiceModalOpen(true)} className={primaryClass}><Plus size={14} />Create invoice</button> : undefined}
                    />
                  ) : (
                    <>
                  <div className="overflow-x-auto rounded-card border border-line bg-panel">
                    <table className="ams-table w-full min-w-[1040px] border-collapse text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-panel">
                        <tr>
                          <th className="px-4 py-3 font-medium text-muted">Invoice</th>
                          <th className="px-4 py-3 font-medium text-muted">Client / project</th>
                          <th className="px-4 py-3 font-medium text-muted">Issue / due</th>
                          <th className="px-4 py-3 text-right font-medium text-muted">Amount</th>
                          <th className="px-4 py-3 font-medium text-muted">Status</th>
                          <th className="px-4 py-3 text-right font-medium text-muted">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedInvoices.map((invoice) => {
                          const balance = Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0)));
                          const project = projects.find((item) => item.id === invoice.projectId);
                          return (
                            <tr key={invoice.id} className="border-t border-line transition-colors hover:bg-bg">
                              <td className="px-4 py-3 align-top">
                                <button type="button" onClick={() => openPrintPreview(invoice)} className="font-medium text-fg hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{invoice.invoiceNumber}</button>
                                <p className="mt-1 text-[11px] text-muted">{invoice.currency}</p>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <p className="font-medium text-fg">{invoice.clientCompany || invoice.clientName}</p>
                                <p className="mt-1 text-[11px] text-muted">{invoice.clientName}{project ? ' · ' + project.name : ''}</p>
                              </td>
                              <td className="px-4 py-3 align-top tabular-nums text-muted">
                                <p>{invoice.issueDate}</p>
                                <p className={'mt-1 text-[11px] ' + (invoice.status === 'overdue' ? 'text-danger' : 'text-muted')}>Due {invoice.dueDate}</p>
                              </td>
                              <td className="px-4 py-3 text-right align-top">
                                <p className="font-medium tabular-nums text-fg">{formatAmount(invoice.total, invoice.currency)}</p>
                                <p className="mt-1 text-[11px] tabular-nums text-muted">{balance > 0 ? 'Due ' + formatAmount(balance, invoice.currency) : 'Settled'}</p>
                              </td>
                              <td className="px-4 py-3 align-top">
                                {canManageInvoices && invoice.status !== 'cancelled' ? (
                                  <InvoiceStatusDropdown status={invoice.status} onChange={(next) => void updateInvoiceStatus(invoice, next)} />
                                ) : <StatusBadge status={invoice.status} />}
                              </td>
                              <td className="px-4 py-3 text-right align-top">
                                <div className="flex items-center justify-end gap-1.5">
                                  {canManageInvoices && invoice.status !== 'paid' && invoice.status !== 'cancelled' && balance > 0 && (
                                    <button type="button" onClick={() => openPayment(invoice)} className="inline-flex min-h-9 items-center gap-1 rounded-control border border-success/30 bg-success/10 px-2.5 text-[11px] font-semibold text-success hover:bg-success/15" title="Record payment"><CreditCard size={13} />Pay</button>
                                  )}
                                  <button type="button" onClick={() => openPrintPreview(invoice)} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-control border border-line bg-transparent text-muted hover:bg-bg hover:text-fg" aria-label="View invoice"><FileText size={14} /></button>
                                  {canManageInvoices && invoice.status !== 'cancelled' && <button type="button" onClick={() => openEditInvoice(invoice)} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-control border border-line bg-transparent text-muted hover:bg-bg hover:text-fg" aria-label="Edit invoice"><Edit3 size={14} /></button>}
                                  {canManageInvoices && canDeleteInvoice && invoice.status !== 'cancelled' && <button type="button" onClick={() => setConfirmAction({ type: 'invoice', id: invoice.id, label: invoice.invoiceNumber })} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-control border border-line bg-transparent text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger" aria-label="Cancel invoice"><Trash2 size={14} /></button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  
                  {invoicePageCount > 1 && (
                    <div className="mt-3 flex flex-col gap-2 border-t border-line px-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] tabular-nums text-muted">Showing {((invoicePage - 1) * invoicePageSize) + 1}-{Math.min(invoicePage * invoicePageSize, filteredInvoices.length)} of {filteredInvoices.length}</p>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setInvoicePage((page) => Math.max(1, page - 1))} disabled={invoicePage === 1} className={actionClass}>Previous</button>
                        <span className="min-w-16 text-center text-[11px] tabular-nums text-muted">{invoicePage} / {invoicePageCount}</span>
                        <button type="button" onClick={() => setInvoicePage((page) => Math.min(invoicePageCount, page + 1))} disabled={invoicePage === invoicePageCount} className={actionClass}>Next</button>
                      </div>
                    </div>
                  )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {filteredExpenses.length === 0 ? (
                    <EmptyState
                      title={language === 'id' ? 'Belum ada pengeluaran' : 'No expenses found'}
                      description={expenseSearch || expenseTypeFilter !== 'all' ? 'No actual expense records match the current search or filter.' : 'Only actual expense records are shown. No placeholder rows are used.'}
                      action={canManageInvoices ? <button type="button" onClick={() => setExpenseModalOpen(true)} className={primaryClass}><Plus size={14} />Record expense</button> : undefined}
                    />
                  ) : (
                    <>
                  <div className="overflow-x-auto rounded-card border border-line bg-panel">
                    <table className="ams-table w-full min-w-[820px] border-collapse text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-panel">
                        <tr>
                          <th className="px-4 py-3 font-medium text-muted">Date</th>
                          <th className="px-4 py-3 font-medium text-muted">Type / category</th>
                          <th className="px-4 py-3 font-medium text-muted">Description</th>
                          <th className="px-4 py-3 text-right font-medium text-muted">Amount</th>
                          <th className="px-4 py-3 font-medium text-muted">Recorded by</th>
                          <th className="px-4 py-3 text-right font-medium text-muted">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedExpenses.map((expense) => (
                          <tr key={expense.id} className="border-t border-line transition-colors hover:bg-bg">
                            <td className="px-4 py-3 tabular-nums text-muted">{expense.date}</td>
                            <td className="px-4 py-3"><div className="font-medium text-fg">{expense.type || 'OpEx'}</div><div className="mt-1 text-[11px] text-muted">{expense.category}</div></td>
                            <td className="px-4 py-3 text-fg">{expense.description}</td>
                            <td className="px-4 py-3 text-right font-medium tabular-nums text-fg">{formatAmount(expense.amount, expense.currency || currency)}</td>
                            <td className="px-4 py-3 text-muted">{expense.recordedBy}</td>
                            <td className="px-4 py-3 text-right">
                              {canManageInvoices && <button type="button" onClick={() => setConfirmAction({ type: 'expense', id: expense.id, label: expense.description })} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-control border border-line text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger" aria-label="Void expense"><Trash2 size={14} /></button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {expensePageCount > 1 && (
                    <div className="mt-3 flex flex-col gap-2 border-t border-line px-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] tabular-nums text-muted">Showing {((expensePage - 1) * expensePageSize) + 1}-{Math.min(expensePage * expensePageSize, filteredExpenses.length)} of {filteredExpenses.length}</p>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setExpensePage((page) => Math.max(1, page - 1))} disabled={expensePage === 1} className={actionClass}>Previous</button>
                        <span className="min-w-16 text-center text-[11px] tabular-nums text-muted">{expensePage} / {expensePageCount}</span>
                        <button type="button" onClick={() => setExpensePage((page) => Math.min(expensePageCount, page + 1))} disabled={expensePage === expensePageCount} className={actionClass}>Next</button>
                      </div>
                    </div>
                  )}
                    </>
                  )}
                </>
              )}
            </div>
          </section>
        </>
      )}

      <Modal
        open={invoiceModalOpen}
        onClose={() => !savingInvoice && setInvoiceModalOpen(false)}
        size="xl"
        title={editingInvoice ? 'Edit invoice' : 'Create invoice'}
        description="Save only billing information that belongs to a real client/project record."
        closeOnOutsideClick={!savingInvoice}
        footer={
          <>
            <button type="button" onClick={() => setInvoiceModalOpen(false)} className={actionClass} disabled={savingInvoice}>Cancel</button>
            <button type="submit" form="finance-invoice-form" className={primaryClass} disabled={savingInvoice}>{savingInvoice ? 'Saving...' : 'Save invoice'}</button>
          </>
        }
      >
        <form id="finance-invoice-form" onSubmit={handleSaveInvoice} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted">Invoice number</label>
              <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} className={fieldClass} placeholder="Leave blank to generate automatically" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Currency</label>
              <CustomSelect value={invoiceCurrency} onChange={(value) => setInvoiceCurrency(value as CurrencyCode)} options={[{ value: 'IDR', label: 'IDR' }, { value: 'USD', label: 'USD' }]} className="w-full" triggerClassName="h-10 min-h-10 w-full" />
            </div>
          </div>

          <div className="grid gap-4 rounded-card border border-line bg-bg p-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Client record</label>
              <CustomSelect
                value={clientId}
                onChange={selectClient}
                options={[{ value: '', label: 'Manual client details' }, ...clients.map((client) => ({ value: client.id, label: client.company + ' · ' + client.name }))]}
                className="w-full"
                triggerClassName="h-10 min-h-10 w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Project</label>
              <CustomSelect
                value={projectId}
                onChange={selectProject}
                options={[{ value: '', label: 'No project linked' }, ...projects.map((project) => ({ value: project.id, label: project.name }))]}
                className="w-full"
                triggerClassName="h-10 min-h-10 w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Client name *</label>
              <input required value={clientName} onChange={(event) => setClientName(event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Company *</label>
              <input required value={clientCompany} onChange={(event) => setClientCompany(event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Email</label>
              <input type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Phone</label>
              <input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} className={fieldClass} />
            </div>
          </div>

          <section className="rounded-card border border-line bg-panel">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div><h3 className="text-sm font-semibold text-fg">Line items</h3><p className="mt-1 text-[11px] text-muted">Totals are calculated from the existing finance utility.</p></div>
              <button type="button" onClick={() => setInvoiceItems((items) => [...items, emptyLineItem()])} className={actionClass}><Plus size={13} />Add item</button>
            </div>
            <div className="space-y-3 p-4">
              {invoiceItems.map((item, index) => (
                <div key={item.id} className="grid gap-3 rounded-control border border-line bg-bg p-3 sm:grid-cols-[minmax(0,1fr)_90px_150px_40px]">
                  <div><label className="mb-1.5 block text-[11px] text-muted">Description *</label><input required value={item.description} onChange={(event) => updateLineItem(index, { description: event.target.value })} className={fieldClass} /></div>
                  <div><label className="mb-1.5 block text-[11px] text-muted">Qty</label><input type="number" min="0" step="1" value={item.quantity} onChange={(event) => updateLineItem(index, { quantity: Number(event.target.value) })} className={fieldClass} /></div>
                  <div><label className="mb-1.5 block text-[11px] text-muted">Unit price</label><input type="number" min="0" step="1" value={item.unitPrice} onChange={(event) => updateLineItem(index, { unitPrice: Number(event.target.value) })} className={fieldClass} /></div>
                  <div className="flex items-end"><button type="button" disabled={invoiceItems.length === 1} onClick={() => setInvoiceItems((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-control border border-line text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger disabled:opacity-40" aria-label="Remove line item"><Trash2 size={14} /></button></div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1.5 block text-xs font-medium text-muted">Discount %</label><input type="number" min="0" max="100" step="0.01" value={discountPercent} onChange={(event) => setDiscountPercent(Number(event.target.value))} className={fieldClass} /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-muted">Tax %</label><input type="number" min="0" max="100" step="0.01" value={taxPercent} onChange={(event) => setTaxPercent(Number(event.target.value))} className={fieldClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1.5 block text-xs font-medium text-muted">Issue date</label><input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} className={fieldClass} /></div>
                <div><label className="mb-1.5 block text-xs font-medium text-muted">Due date</label><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={fieldClass} /></div>
              </div>
              <div><label className="mb-1.5 block text-xs font-medium text-muted">Payment terms</label><input value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} className={fieldClass} placeholder="e.g. Net 14" /></div>
              <div><label className="mb-1.5 block text-xs font-medium text-muted">Notes</label><textarea value={invoiceNotes} onChange={(event) => setInvoiceNotes(event.target.value)} rows={4} className={fieldClass + ' py-2.5'} /></div>
            </div>
            <div className="rounded-card border border-line bg-bg p-4">
              <div className="flex items-center justify-between"><span className="text-xs text-muted">Subtotal</span><span className="tabular-nums text-sm text-fg">{formatAmount(invoiceTotals.subtotal, invoiceCurrency)}</span></div>
              <div className="mt-2 flex items-center justify-between"><span className="text-xs text-muted">Discount</span><span className="tabular-nums text-sm text-fg">- {formatAmount(invoiceTotals.discountAmount, invoiceCurrency)}</span></div>
              <div className="mt-2 flex items-center justify-between"><span className="text-xs text-muted">Tax</span><span className="tabular-nums text-sm text-fg">{formatAmount(invoiceTotals.taxAmount, invoiceCurrency)}</span></div>
              <div className="mt-4 flex items-end justify-between gap-4 border-t border-line pt-4"><span className="text-sm font-semibold text-fg">Total</span><span className="text-lg font-medium tabular-nums text-fg">{formatAmount(invoiceTotals.total, invoiceCurrency)}</span></div>
              <div className="mt-4"><label className="mb-1.5 block text-xs font-medium text-muted">Status</label><CustomSelect value={invoiceStatus} onChange={(value) => setInvoiceStatus(value as InvoiceStatus)} options={[{ value: 'draft', label: 'Draft' }, { value: 'sent', label: 'Sent' }, { value: 'overdue', label: 'Overdue' }]} className="w-full" triggerClassName="h-10 min-h-10 w-full" /></div>
              {editingInvoice && <p className="mt-3 text-[11px] leading-4 text-muted">Paid and partially paid status is controlled by recorded payments. Cancelled invoices cannot be edited.</p>}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={expenseModalOpen}
        onClose={() => !savingExpense && setExpenseModalOpen(false)}
        size="md"
        title="Record expense"
        description="Record an actual expense against the selected currency ledger."
        closeOnOutsideClick={!savingExpense}
        footer={
          <>
            <button type="button" onClick={() => setExpenseModalOpen(false)} className={actionClass} disabled={savingExpense}>Cancel</button>
            <button type="submit" form="finance-expense-form" className={primaryClass} disabled={savingExpense}>{savingExpense ? 'Saving...' : 'Save expense'}</button>
          </>
        }
      >
        <form id="finance-expense-form" onSubmit={handleSaveExpense} className="space-y-4">
          <div><label className="mb-1.5 block text-xs font-medium text-muted">Type</label><CustomSelect value={expenseType} onChange={(value) => setExpenseType(value as 'OpEx' | 'CapEx' | 'Rentals')} options={[{ value: 'OpEx', label: 'OpEx' }, { value: 'CapEx', label: 'CapEx' }, { value: 'Rentals', label: 'Rentals' }]} className="w-full" triggerClassName="h-10 min-h-10 w-full" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted">Category</label><CustomSelect value={expenseCategory} onChange={(value) => setExpenseCategory(value as AgencyExpense['category'])} options={['Software & Cloud','Salaries & Contractors','Office & Hardware','Office & Rentals','Marketing & Ads','Legal & Admin','CapEx Equipment'].map((value) => ({ value, label: value }))} className="w-full" triggerClassName="h-10 min-h-10 w-full" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted">Description *</label><input required value={expenseDescription} onChange={(event) => setExpenseDescription(event.target.value)} className={fieldClass} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1.5 block text-xs font-medium text-muted">Amount</label><input required type="number" min="0.01" step="0.01" value={expenseAmount} onChange={(event) => setExpenseAmount(Number(event.target.value))} className={fieldClass} /></div>
            <div><label className="mb-1.5 block text-xs font-medium text-muted">Date</label><input required type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} className={fieldClass} /></div>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!paymentInvoice}
        onClose={() => !savingPayment && setPaymentInvoice(null)}
        size="md"
        title="Record payment"
        description={paymentInvoice ? paymentInvoice.invoiceNumber + ' · ' + paymentInvoice.clientCompany : undefined}
        closeOnOutsideClick={!savingPayment}
        footer={
          <>
            <button type="button" onClick={() => setPaymentInvoice(null)} className={actionClass} disabled={savingPayment}>Cancel</button>
            <button type="submit" form="finance-payment-form" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control bg-success px-3.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={savingPayment}><Check size={14} />{savingPayment ? 'Saving...' : 'Record payment'}</button>
          </>
        }
      >
        {paymentInvoice && (
          <form id="finance-payment-form" onSubmit={handlePayment} className="space-y-4">
            <div className="rounded-card border border-line bg-bg p-4">
              <div className="flex justify-between gap-3 text-xs"><span className="text-muted">Invoice total</span><span className="tabular-nums text-fg">{formatAmount(paymentInvoice.total, paymentInvoice.currency)}</span></div>
              <div className="mt-2 flex justify-between gap-3 text-xs"><span className="text-muted">Already paid</span><span className="tabular-nums text-success">{formatAmount(paymentInvoice.amountPaid || 0, paymentInvoice.currency)}</span></div>
              <div className="mt-3 flex justify-between gap-3 border-t border-line pt-3 text-xs font-semibold"><span className="text-fg">Remaining balance</span><span className="tabular-nums text-warning">{formatAmount(paymentInvoice.balanceDue ?? (paymentInvoice.total - (paymentInvoice.amountPaid || 0)), paymentInvoice.currency)}</span></div>
            </div>
            <div><label className="mb-1.5 block text-xs font-medium text-muted">Amount received</label><input required min="0.01" type="number" step="0.01" max={Number(paymentInvoice.balanceDue ?? paymentInvoice.total)} value={paymentAmount} onChange={(event) => setPaymentAmount(Number(event.target.value))} className={fieldClass} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-xs font-medium text-muted">Payment method</label><CustomSelect value={paymentMethod} onChange={(value) => setPaymentMethod(value as typeof paymentMethod)} options={[{ value: 'bank_transfer', label: 'Bank transfer' }, { value: 'credit_card', label: 'Credit card' }, { value: 'cash', label: 'Cash' }, { value: 'other', label: 'Other' }]} className="w-full" triggerClassName="h-10 min-h-10 w-full" /></div>
              <div><label className="mb-1.5 block text-xs font-medium text-muted">Payment date</label><input required type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className={fieldClass} /></div>
            </div>
            <div><label className="mb-1.5 block text-xs font-medium text-muted">Reference</label><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className={fieldClass} placeholder="Transaction reference" /></div>
            <div><label className="mb-1.5 block text-xs font-medium text-muted">Notes</label><textarea value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} rows={3} className={fieldClass + ' py-2.5'} /></div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        size="sm"
        title={confirmAction?.type === 'invoice' ? 'Cancel invoice?' : 'Void expense?'}
        description={confirmAction ? confirmAction.label : undefined}
        footer={
          <>
            <button type="button" onClick={() => setConfirmAction(null)} className={actionClass}>Keep record</button>
            <button type="button" onClick={() => void confirmDelete()} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control bg-danger px-3.5 text-xs font-semibold text-white"><Trash2 size={14} />Confirm</button>
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
        footer={
          <button type="button" onClick={() => window.print()} className={actionClass}><Download size={14} />Print / Save PDF</button>
        }
      >
        {detailInvoice && (
          <div className="space-y-5">
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
                <tbody>{detailInvoice.items.map((item) => <tr key={item.id} className="border-b border-line last:border-0"><td className="px-3 py-2.5 text-fg">{item.description}</td><td className="px-3 py-2.5 text-right tabular-nums text-fg">{item.quantity}</td><td className="px-3 py-2.5 text-right tabular-nums text-fg">{formatAmount(item.unitPrice, detailInvoice.currency)}</td><td className="px-3 py-2.5 text-right tabular-nums text-fg">{formatAmount(item.amount, detailInvoice.currency)}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="grid gap-5 sm:grid-cols-[1fr_260px]">
              <div>
                <p className="text-xs font-medium text-muted">Payment activity</p>
                {detailInvoice.payments?.length ? (
                  <div className="mt-2 space-y-2">{detailInvoice.payments.map((payment) => <div key={payment.id} className="flex flex-col gap-1 rounded-control border border-line bg-bg p-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="text-muted">{payment.date} · {payment.method.replace('_', ' ')}{payment.reference ? ' · ' + payment.reference : ''}</span><span className="font-medium tabular-nums text-success">{formatAmount(payment.amount, detailInvoice.currency)}</span></div>)}</div>
                ) : <p className="mt-2 rounded-control border border-line bg-bg p-3 text-xs text-muted">No recorded payments.</p>}
                {detailInvoice.notes && <p className="mt-3 text-xs leading-5 text-muted">{detailInvoice.notes}</p>}
                {detailInvoice.paymentTerms && <p className="mt-2 text-xs text-muted">Terms: {detailInvoice.paymentTerms}</p>}
              </div>
              <div className="rounded-card border border-line bg-bg p-4 text-xs">
                <div className="flex justify-between gap-3"><span className="text-muted">Subtotal</span><span className="tabular-nums text-fg">{formatAmount(detailInvoice.subtotal, detailInvoice.currency)}</span></div>
                <div className="mt-2 flex justify-between gap-3"><span className="text-muted">Discount</span><span className="tabular-nums text-fg">- {formatAmount(detailInvoice.discountAmount || 0, detailInvoice.currency)}</span></div>
                <div className="mt-2 flex justify-between gap-3"><span className="text-muted">Tax ({detailInvoice.taxPercent}%)</span><span className="tabular-nums text-fg">{formatAmount(detailInvoice.taxAmount, detailInvoice.currency)}</span></div>
                <div className="mt-3 flex justify-between gap-3 border-t border-line pt-3 font-semibold"><span className="text-fg">Total</span><span className="tabular-nums text-fg">{formatAmount(detailInvoice.total, detailInvoice.currency)}</span></div>
                <div className="mt-2 flex justify-between gap-3"><span className="text-muted">Paid</span><span className="tabular-nums text-success">{formatAmount(detailInvoice.amountPaid || 0, detailInvoice.currency)}</span></div>
                <div className="mt-2 flex justify-between gap-3 font-semibold"><span className="text-fg">Balance due</span><span className="tabular-nums text-warning">{formatAmount(detailInvoice.balanceDue ?? (detailInvoice.total - (detailInvoice.amountPaid || 0)), detailInvoice.currency)}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminInvoicing;
