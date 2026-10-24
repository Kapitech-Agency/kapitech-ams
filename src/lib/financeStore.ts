/**
 * Kapitech Agency Invoicing & Financials Store
 * Handles client invoice generation, payment status tracking (Draft, Sent, Paid, Overdue),
 * expenses, and financial KPI metrics calculation.
 */

import { api } from './apiClient';
import { toSlug } from './slug';


export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  slug?: string;
  description: string;
  quantity: number;
  unitPrice: number; // in IDR
  amount: number;
}

export interface InvoicePaymentRecord {
  id: string;
  slug?: string;
  amount: number;
  date: string;
  method: 'bank_transfer' | 'credit_card' | 'cash' | 'other';
  settlementAccountCode?: '1000' | '1010' | '1100' | '1200';
  reference?: string;
  recordedBy?: string;
  notes?: string;
}

export interface InvoiceAuditEntry {
  action: string;
  timestamp: string;
  user?: string;
  note?: string;
}

export interface AgencyInvoice {
  id: string;
  slug?: string;
  invoiceNumber: string;
  type?: 'invoice' | 'quotation';
  clientName: string;
  clientCompany: string;
  clientId?: string;
  clientEmail: string;
  clientPhone?: string;
  projectId?: string;
  leadId?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent: number; // e.g. 11% PPN in Indonesia
  taxAmount: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
  payments?: InvoicePaymentRecord[];
  currency: 'IDR' | 'USD';
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  approvedDate?: string;
  notes?: string;
  paymentTerms?: string;
  auditTrail?: InvoiceAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export type ExpenseType = 'OpEx' | 'CapEx' | 'Rentals' | 'Recurring' | 'Other';
export type ExpenseCategory = 
  | 'Software & Cloud' 
  | 'Salaries & Contractors' 
  | 'Office & Hardware' 
  | 'Office & Rentals'
  | 'Marketing & Ads' 
  | 'Legal & Admin'
  | 'CapEx Equipment';

export interface ExpensePaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: InvoicePaymentRecord['method'];
  paymentAccountCode?: '1000' | '1100' | '1200';
  reference?: string;
  notes?: string;
  recordedBy?: string;
}

export interface AgencyExpense {
  id: string;
  slug?: string;
  type?: ExpenseType;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  recurringInterval?: 'monthly' | 'quarterly' | 'yearly' | 'none';
  receiptUrl?: string;
  vendorId?: string;
  vendorContractId?: string;
  vendorPayment?: { vendorId: string; contractId: string; contractTitle?: string; reference?: string; notes?: string; legacyFormat?: boolean };
  paymentStatus?: 'unpaid' | 'partially_paid' | 'paid';
  payments?: ExpensePaymentRecord[];
  paidDate?: string;
  paymentMethod?: InvoicePaymentRecord['method'];
  paymentAccountCode?: '1000' | '1100' | '1200';
  metadata?: Record<string, unknown>;
  recordedBy: string;
  createdAt?: string;
}

let invoiceCache: AgencyInvoice[] | null = null;
let expenseCache: AgencyExpense[] | null = null;
export const FINANCE_EVENT_NAME = 'kapitech_finance_updated';

export const slugifyFinance = (value: unknown): string => toSlug(value, 'finance-record');

export const normalizeFinanceInvoice = (invoice: AgencyInvoice): AgencyInvoice => {
  const slug = slugifyFinance(invoice.slug || invoice.invoiceNumber || invoice.id);
  const payments = Array.isArray(invoice.payments)
    ? invoice.payments.map((payment) => ({
        ...payment,
        amount: Math.max(0, Number(payment.amount) || 0),
        slug: payment.slug || slugifyFinance(slug + '-payment-' + (payment.id || payment.date))
      }))
    : [];
  const paymentTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const amountPaid = payments.length > 0
    ? Math.min(Math.max(0, Number(invoice.total) || 0), paymentTotal)
    : Math.min(Math.max(0, Number(invoice.total) || 0), Math.max(0, Number(invoice.amountPaid) || 0));
  const balanceDue = Math.max(0, (Number(invoice.total) || 0) - amountPaid);

  return {
    ...invoice,
    slug,
    amountPaid,
    balanceDue,
    items: Array.isArray(invoice.items)
      ? invoice.items.map((item) => ({
          ...item,
          quantity: Math.max(0, Number(item.quantity) || 0),
          unitPrice: Math.max(0, Number(item.unitPrice) || 0),
          amount: Math.round(Math.max(0, Number(item.amount) || ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))) * 100) / 100,
          slug: item.slug || slugifyFinance(slug + '-' + (item.description || item.id))
        }))
      : [],
    payments
  };
};

export const getEffectiveInvoiceStatus = (invoice: AgencyInvoice, referenceDate: Date = new Date()): InvoiceStatus => {
  if (invoice.status === 'cancelled' || invoice.status === 'draft') return invoice.status;
  const balance = Math.max(0, Number(invoice.balanceDue ?? (Number(invoice.total) || 0) - (Number(invoice.amountPaid) || 0)));
  if (balance <= 0 && Number(invoice.total) > 0) return 'paid';
  if (balance > 0 && invoice.dueDate) {
    const due = new Date(String(invoice.dueDate) + 'T00:00:00');
    const day = new Date(referenceDate);
    day.setHours(0, 0, 0, 0);
    if (!Number.isNaN(due.getTime()) && due.getTime() < day.getTime()) return 'overdue';
  }
  if (balance > 0 && (Number(invoice.amountPaid || 0) > 0 || invoice.status === 'paid' || invoice.status === 'partially_paid')) return 'partially_paid';
  return invoice.status;
};

export const normalizeFinanceExpense = (expense: AgencyExpense): AgencyExpense => ({
  ...expense,
  slug: slugifyFinance(expense.slug || (expense.description || expense.id) + '-' + (expense.date || '') + '-' + expense.id)
});

let financeServerHydrationStarted = false;

let financeServerHydrationRetryCount = 0;
let financeServerHydrationRetryTimer: number | null = null;

function scheduleFinanceHydrationRetry(): void {
  if (typeof window === 'undefined' || financeServerHydrationRetryTimer !== null || financeServerHydrationRetryCount >= 6) return;
  const delay = Math.min(30000, 3000 * 2 ** financeServerHydrationRetryCount);
  financeServerHydrationRetryCount += 1;
  financeServerHydrationRetryTimer = window.setTimeout(() => {
    financeServerHydrationRetryTimer = null;
    hydrateFinanceFromServer();
  }, delay);
}

function hydrateFinanceFromServer(): void {
  if (typeof window === 'undefined' || financeServerHydrationStarted) return;
  financeServerHydrationStarted = true;

  Promise.all([api.finance.getInvoices(), api.finance.getExpenses()]).then(([invoiceRes, expenseRes]) => {
    // HTTP success alone is not proof that the response matches the collection contract.
    // Only a valid envelope may replace a last-known-good cache; malformed/error bodies
    // are not authoritative empty results.
    const invoices = invoiceRes.success && invoiceRes.data?.success !== false && Array.isArray(invoiceRes.data?.invoices)
      ? invoiceRes.data.invoices.map((inv: any) => normalizeFinanceInvoice({
          ...inv,
          slug: inv.slug || inv.metadata?.slug,
          currency: inv.currency || 'IDR',
          items: Array.isArray(inv.items) ? inv.items : []
        } as AgencyInvoice))
      : null;
    const expenses = expenseRes.success && expenseRes.data?.success !== false && Array.isArray(expenseRes.data?.expenses)
      ? expenseRes.data.expenses.map((expense: any) => normalizeFinanceExpense({
          ...expense,
          slug: expense.slug || expense.metadata?.slug
        } as AgencyExpense))
      : null;

    if (invoices !== null) invoiceCache = invoices;
    if (expenses !== null) expenseCache = expenses;
    if (typeof window !== 'undefined' && (invoices !== null || expenses !== null)) {
      window.dispatchEvent(new CustomEvent(FINANCE_EVENT_NAME));
    }

    if (invoices !== null && expenses !== null) {
      financeServerHydrationRetryCount = 0;
      return;
    }
    financeServerHydrationStarted = false;
    scheduleFinanceHydrationRetry();
  }).catch(() => {
    financeServerHydrationStarted = false;
    scheduleFinanceHydrationRetry();
  });
}

export const INITIAL_DEFAULT_INVOICES: AgencyInvoice[] = [];
export const INITIAL_DEFAULT_EXPENSES: AgencyExpense[] = [];
export const getAgencyInvoices = (): AgencyInvoice[] => {
  hydrateFinanceFromServer();
  if (invoiceCache) return invoiceCache;
  invoiceCache = [];
  return invoiceCache;
};

export const saveAgencyInvoice = async (invoice: AgencyInvoice): Promise<void> => {
  const current = getAgencyInvoices();
  const previousInvoices = [...current];
  const idx = current.findIndex(i => i.id === invoice.id);
  const now = new Date().toISOString();

  let updated: AgencyInvoice[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = { ...invoice, updatedAt: now };
  } else {
    updated = [{ ...invoice, createdAt: invoice.createdAt || now, updatedAt: now }, ...current];
  }

  invoiceCache = updated.map(normalizeFinanceInvoice);
  window.dispatchEvent(new CustomEvent(FINANCE_EVENT_NAME, { detail: updated }));

  const request = idx >= 0
    ? api.finance.updateInvoice(invoice.id, invoice)
    : api.finance.createInvoice(invoice);
  const res = await request;

  if (res.success && res.data?.success !== false) return;

  invoiceCache = previousInvoices;
  window.dispatchEvent(new CustomEvent(FINANCE_EVENT_NAME, { detail: previousInvoices }));
  throw new Error(res.error || 'Invoice could not be saved on the server.');
};

export const deleteAgencyInvoice = async (id: string): Promise<void> => {
  const current = getAgencyInvoices();
  const previousInvoices = [...current];
  const updated = current.filter(i => i.id !== id);
  invoiceCache = updated;
  window.dispatchEvent(new CustomEvent(FINANCE_EVENT_NAME, { detail: updated }));
  const res = await api.finance.deleteInvoice(id);
  if (res.success && res.data?.success !== false) return;

  invoiceCache = previousInvoices;
  window.dispatchEvent(new CustomEvent(FINANCE_EVENT_NAME, { detail: previousInvoices }));
  throw new Error(res.error || 'Invoice could not be cancelled on the server.');

};

export const updateInvoiceStatus = async (id: string, status: InvoiceStatus, actor: string = 'Authorized Lead'): Promise<void> => {
  const current = getAgencyInvoices();
  const inv = current.find(i => i.id === id);
  if (!inv) return;

  const now = new Date().toISOString();
  const auditTrail = [...(inv.auditTrail || []), {
    action: `Status marked as ${status.toUpperCase()}`,
    timestamp: now,
    user: actor
  }];

  const updated: AgencyInvoice = {
    ...inv,
    status,
    paidDate: status === 'paid' ? now.split('T')[0] : inv.paidDate,
    auditTrail,
    updatedAt: now
  };

  await saveAgencyInvoice(updated);
};

export const recordInvoicePayment = async (
  invoiceId: string,
  payment: {
    amount: number;
    date?: string;
    method: 'bank_transfer' | 'credit_card' | 'cash' | 'other';
    reference?: string;
    recordedBy?: string;
    notes?: string;
    idempotencyKey?: string;
  }
): Promise<AgencyInvoice | null> => {
  const current = getAgencyInvoices();
  const inv = current.find(i => i.id === invoiceId);
  if (!inv) return null;

  const result = await api.finance.payInvoice(invoiceId, {
    amount: payment.amount,
    date: payment.date,
    method: payment.method,
    reference: payment.reference,
    notes: payment.notes,
    idempotencyKey: payment.idempotencyKey || `payment-${invoiceId}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  });

  if (!result.success || !result.data?.invoice) {
    throw new Error(result.error || 'Payment could not be recorded on the server.');
  }

  const serverInvoice = result.data.invoice as AgencyInvoice;
  invoiceCache = current.map((item) => item.id === serverInvoice.id ? serverInvoice : item);
  window.dispatchEvent(new CustomEvent(FINANCE_EVENT_NAME, { detail: invoiceCache }));

  return serverInvoice;
};

export const getAgencyExpenses = (): AgencyExpense[] => {
  hydrateFinanceFromServer();
  if (expenseCache) return expenseCache;
  expenseCache = [];
  return expenseCache;
};

export const saveAgencyExpense = async (expense: AgencyExpense): Promise<void> => {
  const current = getAgencyExpenses();
  const previousExpenses = [...current];
  const idx = current.findIndex(e => e.id === expense.id);

  let updated: AgencyExpense[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = normalizeFinanceExpense(expense);
  } else {
    updated = [normalizeFinanceExpense(expense), ...current];
  }

  expenseCache = updated;
  window.dispatchEvent(new CustomEvent(FINANCE_EVENT_NAME, { detail: updated }));
  const res = await api.finance.createExpense(expense);
  if (res.success && res.data?.success !== false) return;

  expenseCache = previousExpenses;
  window.dispatchEvent(new CustomEvent(FINANCE_EVENT_NAME, { detail: previousExpenses }));
  throw new Error(res.error || 'Expense could not be saved on the server.');
};

export const deleteAgencyExpense = async (id: string): Promise<void> => {
  const current = getAgencyExpenses();
  const previousExpenses = [...current];
  const updated = current.filter(e => e.id !== id);
  expenseCache = updated;
  window.dispatchEvent(new CustomEvent(FINANCE_EVENT_NAME, { detail: updated }));
  const res = await api.finance.deleteExpense(id);
  if (res.success && res.data?.success !== false) return;

  expenseCache = previousExpenses;
  window.dispatchEvent(new CustomEvent(FINANCE_EVENT_NAME, { detail: previousExpenses }));
  throw new Error(res.error || 'Expense could not be deleted on the server.');

};

/**
 * Automated Invoice & Quotation Totals Calculation
 */
export const computeInvoiceTotals = (
  items: InvoiceLineItem[],
  taxPercent: number = 11,
  discountPercent: number = 0
) => {
  const roundMoney = (value: number) => Math.round(value * 100) / 100;
  const subtotal = roundMoney(items.reduce((sum, item) => sum + (Number(item.amount) || (Number(item.quantity || 1) * Number(item.unitPrice || 0))), 0));
  const discountAmount = roundMoney(subtotal * Math.max(0, Math.min(100, Number(discountPercent) || 0)) / 100);
  const discountedSubtotal = roundMoney(Math.max(0, subtotal - discountAmount));
  const taxAmount = roundMoney(discountedSubtotal * Math.max(0, Number(taxPercent) || 0) / 100);
  const total = roundMoney(discountedSubtotal + taxAmount);

  return {
    subtotal,
    discountPercent: Number(discountPercent) || 0,
    discountAmount,
    discountedSubtotal,
    taxPercent: Number(taxPercent) || 0,
    taxAmount,
    total
  };
};

/**
 * Monthly Cash Flow Data Series (Inflow vs Outflow)
 */
export interface CashFlowMonthPoint {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
}

export const getMonthlyCashFlowSeries = (
  invoices: AgencyInvoice[],
  expenses: AgencyExpense[]
): CashFlowMonthPoint[] => {
  const now = new Date();
  const months: Date[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    months.push(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1)));
  }

  const monthKey = (date: Date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

  const inflowByMonth = new Map<string, number>();
  const outflowByMonth = new Map<string, number>();

  for (const invoice of invoices) {
    const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
    if (payments.length > 0) {
      for (const payment of payments) {
        const parsed = new Date(`${String(payment.date || '')}T00:00:00Z`);
        if (!Number.isNaN(parsed.getTime())) {
          const key = monthKey(parsed);
          inflowByMonth.set(key, (inflowByMonth.get(key) || 0) + (Number(payment.amount) || 0));
        }
      }
    } else if (invoice.status === 'paid' && invoice.paidDate) {
      const parsed = new Date(`${invoice.paidDate}T00:00:00Z`);
      if (!Number.isNaN(parsed.getTime())) {
        const key = monthKey(parsed);
        inflowByMonth.set(key, (inflowByMonth.get(key) || 0) + (Number(invoice.amountPaid || invoice.total) || 0));
      }
    }
  }

  for (const expense of expenses) {
    const parsed = new Date(`${String(expense.date || '')}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      const key = monthKey(parsed);
      outflowByMonth.set(key, (outflowByMonth.get(key) || 0) + (Number(expense.amount) || 0));
    }
  }

  return months.map((month) => {
    const key = monthKey(month);
    const inflow = Math.round(inflowByMonth.get(key) || 0);
    const outflow = Math.round(outflowByMonth.get(key) || 0);
    return {
      month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      inflow,
      outflow,
      net: inflow - outflow
    };
  });
};

/**
 * Accounts Receivable Aging Analysis
 */
export interface ArAgingSummary {
  current: number;    // 0 - 30 days
  days30: number;     // 31 - 60 days
  days60: number;     // 61 - 90 days
  days90Plus: number; // 90+ days
  totalReceivable: number;
}

export const getAccountsReceivableAging = (invoices: AgencyInvoice[]): ArAgingSummary => {
  const pending = invoices
    .map(normalizeFinanceInvoice)
    .filter((invoice) => !['draft', 'cancelled'].includes(invoice.status))
    .filter((invoice) => getEffectiveInvoiceStatus(invoice) !== 'paid');
  const now = new Date().getTime();

  let current = 0;
  let days30 = 0;
  let days60 = 0;
  let days90Plus = 0;

  pending.forEach((inv) => {
    const amountDue = Math.max(0, Number(inv.balanceDue ?? ((Number(inv.total) || 0) - (Number(inv.amountPaid) || 0))));
    if (amountDue <= 0) return;

    const dueTime = new Date(String(inv.dueDate || '') + 'T00:00:00').getTime();
    const diffDays = Number.isNaN(dueTime)
      ? 0
      : Math.floor((now - dueTime) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) current += amountDue;
    else if (diffDays <= 30) days30 += amountDue;
    else if (diffDays <= 60) days60 += amountDue;
    else days90Plus += amountDue;
  });

  return {
    current,
    days30,
    days60,
    days90Plus,
    totalReceivable: current + days30 + days60 + days90Plus
  };
};

export const computeFinancialMetrics = (invoices: AgencyInvoice[], expenses: AgencyExpense[]) => {
  const normalizedInvoices = invoices.map(normalizeFinanceInvoice);
  const normalizedExpenses = expenses.map(normalizeFinanceExpense);
  const paidInvoices = normalizedInvoices.filter((invoice) => getEffectiveInvoiceStatus(invoice) === 'paid');
  const partiallyPaidInvoices = normalizedInvoices.filter((invoice) => getEffectiveInvoiceStatus(invoice) === 'partially_paid');
  const sentInvoices = normalizedInvoices.filter((invoice) => getEffectiveInvoiceStatus(invoice) === 'sent');
  const overdueInvoices = normalizedInvoices.filter((invoice) => getEffectiveInvoiceStatus(invoice) === 'overdue');
  const issuedInvoices = normalizedInvoices.filter((invoice) => !['draft', 'cancelled'].includes(invoice.status));

  const totalPaidRevenue = issuedInvoices.reduce((sum, invoice) => {
    const paid = invoice.balanceDue !== undefined
      ? Math.max(0, Math.min(Number(invoice.total) || 0, (Number(invoice.total) || 0) - Number(invoice.balanceDue)))
      : Math.max(0, Number(invoice.amountPaid) || 0);
    return sum + paid;
  }, 0);

  const totalBilled = issuedInvoices.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total) || 0), 0);
  const totalOutstanding = issuedInvoices.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.balanceDue ?? ((Number(invoice.total) || 0) - (Number(invoice.amountPaid) || 0)))), 0);
  const totalOverdue = overdueInvoices.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.balanceDue ?? ((Number(invoice.total) || 0) - (Number(invoice.amountPaid) || 0)))), 0);

  const opExExpenses = normalizedExpenses
    .filter((expense) => expense.type !== 'CapEx')
    .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const capExExpenses = normalizedExpenses
    .filter((expense) => expense.type === 'CapEx')
    .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const totalExpenses = opExExpenses + capExExpenses;

  const netOperatingProfit = totalPaidRevenue - opExExpenses;
  const cashNetProfit = totalPaidRevenue - totalExpenses;
  const netMarginPercent = totalPaidRevenue > 0
    ? Math.round((netOperatingProfit / totalPaidRevenue) * 1000) / 10
    : 0;

  const months = getMonthlyCashFlowSeries(normalizedInvoices, normalizedExpenses);
  const recentMonths = months.slice(-3);
  const monthlyBurnRate = recentMonths.length > 0
    ? Math.round(recentMonths.reduce((sum, point) => sum + point.outflow, 0) / recentMonths.length)
    : 0;

  return {
    totalInvoicesCount: normalizedInvoices.length,
    issuedInvoiceCount: issuedInvoices.length,
    paidCount: paidInvoices.length,
    partiallyPaidCount: partiallyPaidInvoices.length,
    sentCount: sentInvoices.length,
    overdueCount: overdueInvoices.length,
    totalPaidRevenue,
    totalBilled,
    totalOutstanding,
    totalOverdue,
    totalExpenses,
    opExExpenses,
    capExExpenses,
    netOperatingProfit,
    operatingExpense: opExExpenses,
    operatingProfit: netOperatingProfit,
    cashNetProfit,
    netMarginPercent,
    monthlyBurnRate,
    cashRunwayMonths: null,
    collectionRate: totalBilled > 0 ? Math.round((totalPaidRevenue / totalBilled) * 1000) / 10 : 0
  };
};
