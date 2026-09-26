/**
 * Kapitech Agency Invoicing & Financials Store
 * Handles client invoice generation, payment status tracking (Draft, Sent, Paid, Overdue),
 * expenses, and financial KPI metrics calculation.
 */

import { api } from './apiClient';

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in IDR
  amount: number;
}

export interface InvoicePaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: 'bank_transfer' | 'credit_card' | 'cash' | 'other';
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
  invoiceNumber: string;
  type?: 'invoice' | 'quotation';
  clientName: string;
  clientCompany: string;
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

export interface AgencyExpense {
  id: string;
  type?: ExpenseType;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  recurringInterval?: 'monthly' | 'quarterly' | 'yearly' | 'none';
  receiptUrl?: string;
  recordedBy: string;
  createdAt?: string;
}

let invoiceCache: AgencyInvoice[] | null = null;
let expenseCache: AgencyExpense[] | null = null;
export const FINANCE_EVENT_NAME = 'kapitech_finance_updated';

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
  if (!import.meta.env.PROD || financeServerHydrationStarted) return;
  financeServerHydrationStarted = true;

  Promise.all([api.finance.getInvoices(), api.finance.getExpenses()]).then(([invoiceRes, expenseRes]) => {
    const invoices = invoiceRes.success && Array.isArray(invoiceRes.data?.invoices)
      ? invoiceRes.data.invoices.map((inv: any) => ({ ...inv, currency: inv.currency || 'IDR', items: Array.isArray(inv.items) ? inv.items : [] }))
      : [];
    const expenses = expenseRes.success && Array.isArray(expenseRes.data?.expenses)
      ? expenseRes.data.expenses
      : [];

    if (invoiceRes.success) invoiceCache = invoices;
    if (expenseRes.success) expenseCache = expenses;
    if (typeof window !== 'undefined' && (invoiceRes.success || expenseRes.success)) {
      window.dispatchEvent(new CustomEvent(FINANCE_EVENT_NAME));
    }

    if (invoiceRes.success && expenseRes.success) {
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

export const INITIAL_DEFAULT_INVOICES: AgencyInvoice[] = [
  {
    id: 'inv_101',
    invoiceNumber: 'KAPI-INV-2026-001',
    type: 'invoice',
    clientName: 'Budi Santoso',
    clientCompany: 'PT Astra Digital Ventura',
    clientEmail: 'budi.santoso@astradigital.id',
    clientPhone: '+62 812-9988-7711',
    items: [
      {
        id: 'item_1',
        description: 'Enterprise React & Node.js Microservices Architecture Implementation',
        quantity: 1,
        unitPrice: 165000000,
        amount: 165000000
      }
    ],
    subtotal: 165000000,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 11,
    taxAmount: 18150000,
    total: 183150000,
    currency: 'IDR',
    status: 'paid',
    issueDate: '2026-08-01',
    dueDate: '2026-08-15',
    paidDate: '2026-08-14',
    notes: 'Sprint 1 & Sprint 2 deliverable sign-off settlement.',
    paymentTerms: 'Bank Transfer Net 14',
    auditTrail: [
      { action: 'Created', timestamp: '2026-08-01T09:00:00Z', user: 'Finance Lead' },
      { action: 'Approved', timestamp: '2026-08-02T10:30:00Z', user: 'Managing Partner' },
      { action: 'Paid', timestamp: '2026-08-14T14:15:00Z', user: 'BCA Virtual Account' }
    ],
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-14T14:15:00Z'
  },
  {
    id: 'inv_102',
    invoiceNumber: 'KAPI-INV-2026-002',
    type: 'invoice',
    clientName: 'Sarah Jenkins',
    clientCompany: 'Telkomsel Innovation Labs',
    clientEmail: 's.jenkins@telkomsel.co.id',
    clientPhone: '+62 811-2233-4455',
    items: [
      {
        id: 'item_2',
        description: '3D WebGL Brand Experience & Interactive Design System',
        quantity: 1,
        unitPrice: 120000000,
        amount: 120000000
      }
    ],
    subtotal: 120000000,
    discountPercent: 5,
    discountAmount: 6000000,
    taxPercent: 11,
    taxAmount: 12540000,
    total: 126540000,
    currency: 'IDR',
    status: 'paid',
    issueDate: '2026-08-18',
    dueDate: '2026-09-01',
    paidDate: '2026-08-30',
    notes: 'Phase 1 Interactive showcase release milestone.',
    paymentTerms: 'Bank Transfer Net 14',
    auditTrail: [
      { action: 'Created', timestamp: '2026-08-18T11:00:00Z', user: 'Finance Lead' },
      { action: 'Paid', timestamp: '2026-08-30T16:00:00Z', user: 'Mandiri Corporate' }
    ],
    createdAt: '2026-08-18T11:00:00Z',
    updatedAt: '2026-08-30T16:00:00Z'
  },
  {
    id: 'inv_103',
    invoiceNumber: 'KAPI-INV-2026-003',
    type: 'invoice',
    clientName: 'Reza Pratama',
    clientCompany: 'Bank Mandiri FinTech Division',
    clientEmail: 'reza.p@mandirift.co.id',
    clientPhone: '+62 813-5566-7788',
    items: [
      {
        id: 'item_3',
        description: 'Zero-Trust Internal Portal & RBAC Security Infrastructure',
        quantity: 1,
        unitPrice: 210000000,
        amount: 210000000
      }
    ],
    subtotal: 210000000,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 11,
    taxAmount: 23100000,
    total: 233100000,
    currency: 'IDR',
    status: 'sent',
    issueDate: '2026-09-02',
    dueDate: '2026-09-20',
    approvedDate: '2026-09-04',
    notes: 'Final UAT signed. Invoice authorized and sent for AP processing.',
    paymentTerms: 'Bank Transfer Net 21',
    auditTrail: [
      { action: 'Created', timestamp: '2026-09-02T13:00:00Z', user: 'Finance Lead' },
      { action: 'Approved', timestamp: '2026-09-04T09:45:00Z', user: 'Managing Partner' }
    ],
    createdAt: '2026-09-02T13:00:00Z',
    updatedAt: '2026-09-04T09:45:00Z'
  },
  {
    id: 'inv_104',
    invoiceNumber: 'KAPI-INV-2026-004',
    type: 'invoice',
    clientName: 'Jessica Halim',
    clientCompany: 'ShopeePay Regional Tech',
    clientEmail: 'jessica.h@shopeepay.com',
    clientPhone: '+62 817-4433-2211',
    items: [
      {
        id: 'item_4',
        description: 'High-Throughput Payment Orchestrator & Cloud Run Backend',
        quantity: 1,
        unitPrice: 95000000,
        amount: 95000000
      }
    ],
    subtotal: 95000000,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 11,
    taxAmount: 10450000,
    total: 105450000,
    currency: 'IDR',
    status: 'sent',
    issueDate: '2026-09-05',
    dueDate: '2026-09-22',
    notes: 'Awaiting client finance authorization.',
    paymentTerms: 'Bank Transfer Net 14',
    createdAt: '2026-09-05T10:00:00Z',
    updatedAt: '2026-09-05T10:00:00Z'
  },
  {
    id: 'inv_105',
    invoiceNumber: 'KAPI-INV-2026-005',
    type: 'invoice',
    clientName: 'Kevin Wijaya',
    clientCompany: 'Nusa Cloud Systems',
    clientEmail: 'kevin@nusacloud.id',
    clientPhone: '+62 819-1122-3344',
    items: [
      {
        id: 'item_5',
        description: 'Legacy Cloud Migration & Kubernetes Architecture Sprint',
        quantity: 1,
        unitPrice: 45000000,
        amount: 45000000
      }
    ],
    subtotal: 45000000,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 11,
    taxAmount: 4950000,
    total: 49950000,
    currency: 'IDR',
    status: 'overdue',
    issueDate: '2026-08-01',
    dueDate: '2026-08-16',
    notes: 'Reminder notice #2 sent to client finance team.',
    paymentTerms: 'Bank Transfer Net 14',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-20T11:00:00Z'
  }
];

export const INITIAL_DEFAULT_EXPENSES: AgencyExpense[] = [
  {
    id: 'exp_201',
    type: 'OpEx',
    category: 'Software & Cloud',
    description: 'GCP Cloud Run, Artifact Registry & Vertex AI Infrastructure',
    amount: 14500000,
    date: '2026-09-01',
    recurringInterval: 'monthly',
    recordedBy: 'Cloud DevOps Lead',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'exp_202',
    type: 'OpEx',
    category: 'Salaries & Contractors',
    description: 'Senior Frontend & 3D WebGL Specialist Contractor Retainer',
    amount: 38000000,
    date: '2026-09-05',
    recurringInterval: 'monthly',
    recordedBy: 'Managing Partner',
    createdAt: '2026-09-05T09:00:00Z'
  },
  {
    id: 'exp_203',
    type: 'Rentals',
    category: 'Office & Rentals',
    description: 'Kapitech HQ Studio Rental & Coworking Hub (Sudirman, Jakarta)',
    amount: 22000000,
    date: '2026-09-02',
    recurringInterval: 'monthly',
    recordedBy: 'Operations Staff',
    createdAt: '2026-09-02T10:00:00Z'
  },
  {
    id: 'exp_204',
    type: 'CapEx',
    category: 'CapEx Equipment',
    description: 'Apple Silicon M3 Max Workstations for 3D Render Team',
    amount: 46000000,
    date: '2026-08-15',
    recurringInterval: 'none',
    recordedBy: 'Managing Partner',
    createdAt: '2026-08-15T11:00:00Z'
  },
  {
    id: 'exp_205',
    type: 'OpEx',
    category: 'Marketing & Ads',
    description: 'B2B Enterprise Client Acquisition & Showcase Campaign',
    amount: 8500000,
    date: '2026-08-25',
    recurringInterval: 'monthly',
    recordedBy: 'Growth Manager',
    createdAt: '2026-08-25T14:00:00Z'
  }
];

export const getAgencyInvoices = (): AgencyInvoice[] => {
  hydrateFinanceFromServer();
  if (invoiceCache) return invoiceCache;
  invoiceCache = import.meta.env.PROD ? [] : INITIAL_DEFAULT_INVOICES;
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

  invoiceCache = updated;
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
  expenseCache = import.meta.env.PROD ? [] : INITIAL_DEFAULT_EXPENSES;
  return expenseCache;
};

export const saveAgencyExpense = async (expense: AgencyExpense): Promise<void> => {
  const current = getAgencyExpenses();
  const previousExpenses = [...current];
  const idx = current.findIndex(e => e.id === expense.id);

  let updated: AgencyExpense[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = expense;
  } else {
    updated = [expense, ...current];
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
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || (Number(item.quantity || 1) * Number(item.unitPrice || 0))), 0);
  const discountAmount = Math.round((subtotal * Math.max(0, Math.min(100, Number(discountPercent) || 0))) / 100);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((discountedSubtotal * Math.max(0, Number(taxPercent) || 0)) / 100);
  const total = discountedSubtotal + taxAmount;

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
  const pending = invoices.filter(i => i.status === 'sent' || i.status === 'overdue' || i.status === 'partially_paid');
  const now = new Date().getTime();

  let current = 0;
  let days30 = 0;
  let days60 = 0;
  let days90Plus = 0;

  pending.forEach(inv => {
    const amountDue = inv.balanceDue !== undefined ? inv.balanceDue : (inv.total - (inv.amountPaid || 0));
    if (amountDue <= 0) return;

    const dueTime = new Date(inv.dueDate).getTime();
    const diffDays = Math.floor((now - dueTime) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      current += amountDue;
    } else if (diffDays <= 30) {
      days30 += amountDue;
    } else if (diffDays <= 60) {
      days60 += amountDue;
    } else {
      days90Plus += amountDue;
    }
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
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const partiallyPaidInvoices = invoices.filter(i => i.status === 'partially_paid');
  const sentInvoices = invoices.filter(i => i.status === 'sent');
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');

  const totalPaidRevenue = invoices.reduce((sum, invoice) =>
    sum + (Array.isArray(invoice.payments)
      ? invoice.payments.reduce((paymentSum, payment) => paymentSum + (Number(payment.amount) || 0), 0)
      : (Number(invoice.amountPaid) || 0)), 0
  );

  const totalSent = sentInvoices.reduce((sum, i) => sum + (i.balanceDue !== undefined ? i.balanceDue : i.total), 0);
  const partialBalance = partiallyPaidInvoices.reduce((sum, i) => sum + (i.balanceDue !== undefined ? i.balanceDue : (i.total - (i.amountPaid || 0))), 0);
  const totalOverdue = overdueInvoices.reduce((sum, i) => sum + (i.balanceDue !== undefined ? i.balanceDue : i.total), 0);

  const totalOutstanding = totalSent + totalOverdue + partialBalance;

  const opExExpenses = expenses.filter(e => e.type !== 'CapEx').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const capExExpenses = expenses.filter(e => e.type === 'CapEx').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalExpenses = opExExpenses + capExExpenses;

  const netOperatingProfit = totalPaidRevenue - totalExpenses;
  const grossRevenue = totalPaidRevenue + totalOutstanding;
  const netMarginPercent = grossRevenue > 0
    ? Math.round((netOperatingProfit / grossRevenue) * 100)
    : 0;

  const months = getMonthlyCashFlowSeries(invoices, expenses);
  const recentMonths = months.slice(-3);
  const monthlyBurnRate = recentMonths.length > 0
    ? Math.round(recentMonths.reduce((sum, point) => sum + point.outflow, 0) / recentMonths.length)
    : 0;

  return {
    totalInvoicesCount: invoices.length,
    paidCount: paidInvoices.length,
    partiallyPaidCount: partiallyPaidInvoices.length,
    sentCount: sentInvoices.length,
    overdueCount: overdueInvoices.length,
    totalPaidRevenue,
    totalOutstanding,
    totalOverdue,
    totalExpenses,
    opExExpenses,
    capExExpenses,
    netOperatingProfit,
    netMarginPercent,
    monthlyBurnRate,
    cashRunwayMonths: null,
    collectionRate: invoices.length > 0 ? Math.round((paidInvoices.length / invoices.length) * 100) : 0
  };
};
