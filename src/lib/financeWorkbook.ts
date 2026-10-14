import type { AgencyExpense, AgencyInvoice } from './financeStore';

export interface FinanceWorkbookTab {
  key: string;
  sheet: string;
  label: string;
  description: string;
}

export interface FinanceWorkbookGroup {
  key: string;
  label: string;
  items: FinanceWorkbookTab[];
}

/** Navigation and terminology map for the 20 finance worksheets maintained in the Kapitech workbook. */
export const FINANCE_WORKBOOK_GROUPS: FinanceWorkbookGroup[] = [
  {
    key: 'overview',
    label: 'Overview & Control',
    items: [
      { key: 'executive-summary', sheet: '00', label: 'Executive Summary', description: 'Company-wide financial summary and allocation overview.' },
      { key: 'dashboard', sheet: '01', label: 'Dashboard', description: 'Operational finance KPIs and recent monthly movement.' }
    ]
  },
  {
    key: 'transactions',
    label: 'Transactions & Cash',
    items: [
      { key: 'cash-bank', sheet: '05', label: 'Cash & Bank', description: 'Cash movement view built from recorded receipts and expenses.' },
      { key: 'revenue', sheet: '03', label: 'Revenue', description: 'Revenue register sourced from issued client invoices.' },
      { key: 'expenses', sheet: '04', label: 'Expenses', description: 'Expense register sourced from finance expenses in AMS.' },
      { key: 'petty-cash', sheet: '10', label: 'Petty Cash', description: 'Petty-cash register and controls required by the workbook.' }
    ]
  },
  {
    key: 'receivables',
    label: 'Receivables & Payables',
    items: [
      { key: 'accounts-receivable', sheet: '06', label: 'Accounts Receivable', description: 'Invoice balances, due dates and payment status.' },
      { key: 'accounts-payable', sheet: '07', label: 'Accounts Payable', description: 'Vendor obligations and the bill records still required.' },
      { key: 'vendors', sheet: '11', label: 'Vendor & Freelancer', description: 'Vendor directory, contracts, rates and payment references.' },
    ]
  },
  {
    key: 'projects',
    label: 'Project Finance',
    items: [
      { key: 'project-finance', sheet: '08', label: 'Project Finance', description: 'Project-level budget, invoicing, receipts and recorded costs.' },
      { key: 'operational-budget', sheet: '09', label: 'Operational Budget', description: 'Budget-versus-actual controls and variance review.' },
      { key: 'project-allocation', sheet: '15', label: 'Project Allocation', description: 'The workbook allocation policy for net project profit.' },
      { key: 'team-fee', sheet: '16', label: 'Team Fee', description: 'Project team-fee allocation, kept separate from Team Reward.' }
    ]
  },
  {
    key: 'accounting',
    label: 'Accounting & Reports',
    items: [
      { key: 'journal', sheet: '18', label: 'Journal', description: 'Double-entry mapping and source transactions awaiting posting.' },
      { key: 'chart-of-accounts', sheet: '02', label: 'Chart of Accounts', description: 'Master account codes and normal balances from the workbook.' },
      { key: 'monthly-pnl', sheet: '12', label: 'Monthly P&L', description: 'Monthly profit-and-loss view based on the workbook structure.' },
      { key: 'cash-flow', sheet: '13', label: 'Cash Flow', description: 'Monthly cash inflow, outflow and net movement.' },
      { key: 'balance-sheet', sheet: '17', label: 'Balance Sheet', description: 'Company-wide assets, liabilities and equity readiness.' },
      { key: 'monthly-closing', sheet: '14', label: 'Monthly Closing', description: 'Month-end checklist and reconciliation controls.' },
      { key: 'annual-summary', sheet: '19', label: 'Annual Summary', description: 'Company-wide annual finance summary.' }
    ]
  }
];

export interface ExcelChartAccount {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  normalBalance: 'Debit' | 'Credit';
  description: string;
  active: boolean;
}

/** The current workbook Chart of Accounts, copied as master configuration (not a transaction fixture). */
export const EXCEL_CHART_OF_ACCOUNTS: ExcelChartAccount[] = [
  { code: '1000', name: 'Cash & Bank', type: 'Asset', normalBalance: 'Debit', description: 'Kas dan rekening bank', active: true },
  { code: '1010', name: 'Card Settlement Clearing', type: 'Asset', normalBalance: 'Debit', description: 'Card receipts awaiting settlement to bank', active: true },
  { code: '1100', name: 'Petty Cash Reserve', type: 'Asset', normalBalance: 'Debit', description: 'Kas kecil/reserve', active: true },
  { code: '1200', name: 'Emergency Fund', type: 'Asset', normalBalance: 'Debit', description: 'Dana darurat', active: true },
  { code: '1300', name: 'Accounts Receivable', type: 'Asset', normalBalance: 'Debit', description: 'Piutang pelanggan', active: true },
  { code: '1400', name: 'Project Asset / Prepayment', type: 'Asset', normalBalance: 'Debit', description: 'Prepayment/project asset', active: true },
  { code: '2000', name: 'Accounts Payable', type: 'Liability', normalBalance: 'Credit', description: 'Hutang vendor/freelancer', active: true },
  { code: '2100', name: 'Tax Payable', type: 'Liability', normalBalance: 'Credit', description: 'Output tax payable to tax authority', active: true },
  { code: '2200', name: 'Credit Card Payable', type: 'Liability', normalBalance: 'Credit', description: 'Company credit card obligation', active: true },
  { code: '3000', name: 'Owner / Capital', type: 'Equity', normalBalance: 'Credit', description: 'Modal', active: true },
  { code: '3100', name: 'Retained Earnings', type: 'Equity', normalBalance: 'Credit', description: 'Laba ditahan', active: true },
  { code: '4000', name: 'Project Revenue', type: 'Revenue', normalBalance: 'Credit', description: 'Pendapatan project', active: true },
  { code: '5100', name: 'Vendor / Direct Project Cost', type: 'Expense', normalBalance: 'Debit', description: 'Fee vendor/freelancer', active: true },
  { code: '5200', name: 'Other Project Obligations', type: 'Expense', normalBalance: 'Debit', description: 'Kewajiban project lain', active: true },
  { code: '5300', name: 'Team Reward - Sales', type: 'Expense', normalBalance: 'Debit', description: 'Reward sales', active: true },
  { code: '5310', name: 'Team Reward - Vendor/PIC', type: 'Expense', normalBalance: 'Debit', description: 'Reward vendor/PIC', active: true },
  { code: '5320', name: 'Team Reward - Management', type: 'Expense', normalBalance: 'Debit', description: 'Reward management', active: true },
  { code: '5400', name: 'Project Team Fee', type: 'Expense', normalBalance: 'Debit', description: 'Fee tim project', active: true },
  { code: '5500', name: 'Bank & Administration Fee', type: 'Expense', normalBalance: 'Debit', description: 'Biaya bank/admin', active: true },
  { code: '5600', name: 'Company Operational Expense', type: 'Expense', normalBalance: 'Debit', description: 'Biaya operasional perusahaan', active: true }
];

export type WorkbookExpenseClass = 'directProjectCost' | 'teamReward' | 'projectTeamFee' | 'operatingExpense' | 'unclassified';

export interface WorkbookExpenseLike {
  category?: string;
  description?: string;
  type?: string;
  vendorId?: string;
  vendorContractId?: string;
  vendorPayment?: unknown;
  projectId?: string;
}

export function isIssuedInvoice(invoice: Partial<AgencyInvoice>): boolean {
  const status = String(invoice.status || '').toLowerCase();
  const type = String(invoice.type || 'invoice').toLowerCase();
  return type !== 'quotation' && !['draft', 'cancelled', 'canceled', 'voided', 'deleted', 'rejected'].includes(status);
}

export function getInvoiceCollected(invoice: Partial<AgencyInvoice>): number {
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  if (payments.length > 0) {
    return payments.reduce((sum, payment) => sum + Math.max(0, Number(payment.amount) || 0), 0);
  }
  return Math.max(0, Number(invoice.amountPaid) || 0);
}

export function getInvoiceOutstanding(invoice: Partial<AgencyInvoice>): number {
  if (invoice.balanceDue !== undefined && invoice.balanceDue !== null) {
    return Math.max(0, Number(invoice.balanceDue) || 0);
  }
  return Math.max(0, (Number(invoice.total) || 0) - getInvoiceCollected(invoice));
}

export function getInvoiceDate(invoice: Partial<AgencyInvoice>): string {
  return String(invoice.issueDate || invoice.createdAt || '').slice(0, 10);
}

export function getPaymentRows(invoice: Partial<AgencyInvoice>): Array<{ id: string; date: string; amount: number; reference: string; method: string }> {
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  if (payments.length > 0) {
    return payments.map((payment) => ({
      id: String(payment.id || invoice.id || ''),
      date: String(payment.date || '').slice(0, 10),
      amount: Math.max(0, Number(payment.amount) || 0),
      reference: String(payment.reference || invoice.invoiceNumber || ''),
      method: String(payment.method || 'other')
    }));
  }
  if (Number(invoice.amountPaid) > 0 && invoice.paidDate) {
    return [{
      id: String(invoice.id || invoice.invoiceNumber || '') + '-legacy-payment',
      date: String(invoice.paidDate).slice(0, 10),
      amount: Math.max(0, Number(invoice.amountPaid) || 0),
      reference: String(invoice.invoiceNumber || ''),
      method: 'recorded payment'
    }];
  }
  return [];
}

export function classifyWorkbookExpense(expense: WorkbookExpenseLike): WorkbookExpenseClass {
  const category = String(expense.category || '').toLowerCase();
  const description = String(expense.description || '').toLowerCase();
  const type = String(expense.type || '').toLowerCase();
  const searchable = [category, description, type].join(' ');
  if (/team reward|sales reward|vendor\/pic reward|management reward/.test(searchable)) return 'teamReward';
  if (/project team fee|team fee/.test(searchable)) return 'projectTeamFee';
  const vendorLinked = Boolean(expense.vendorId || expense.vendorContractId || expense.vendorPayment);
  if (vendorLinked || /direct project cost|project cost|vendor fee|freelancer fee/.test(searchable)) return 'directProjectCost';
  if (expense.projectId) return 'directProjectCost';
  if (/operating cost|operational expense|software|cloud|rent|marketing|legal|admin|salary|contractor|office|hardware|capex|opex/.test(searchable)) return 'operatingExpense';
  return 'unclassified';
}

export function getMonthKey(value: unknown): string {
  const date = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : '';
}

export function getYearKey(value: unknown): string {
  const date = String(value || '').slice(0, 10);
  return /^\d{4}/.test(date) ? date.slice(0, 4) : '';
}

export function sumAmounts<T>(items: T[], amountOf: (item: T) => number): number {
  return items.reduce((sum, item) => sum + (Number(amountOf(item)) || 0), 0);
}


export type FinanceSourceJournalType = 'invoice-issued' | 'invoice-payment' | 'expense' | 'expense-payment' | 'cash-bank-transfer' | 'vendor-bill-issued' | 'vendor-bill-payment';

export interface FinanceSourceJournalDraft {
  sourceType: FinanceSourceJournalType;
  sourceId: string;
  date: string;
  reference: string;
  description: string;
  projectId?: string;
  relatedSourceId?: string;
  lines: Array<{ accountCode: string; accountName: string; debit: number; credit: number; notes: string }>;
  notes: string;
}

export interface FinanceSourceJournalSkip {
  sourceType: FinanceSourceJournalType;
  sourceId: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  reason: string;
}

export interface FinanceSourceJournalPlan {
  drafts: FinanceSourceJournalDraft[];
  skipped: FinanceSourceJournalSkip[];
}

const FINANCE_ACCOUNT_NAMES = new Map<string, string>(EXCEL_CHART_OF_ACCOUNTS.map((account) => [account.code, account.name] as const));
const CASH_ACCOUNT_CODES = new Set(['1000', '1100', '1200']);
const VALID_FINANCE_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isValidFinanceDate = (value: unknown): boolean => {
  const date = String(value || '').slice(0, 10);
  if (!VALID_FINANCE_DATE.test(date)) return false;
  const parsed = new Date(date + 'T00:00:00Z');
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};
const safeFinanceMoney = (value: unknown): number => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0;
};
const safeFinanceCurrency = (value: unknown): string => String(value || 'IDR').trim().toUpperCase();
const sourceIdentifier = (...parts: string[]): string => parts.map((part) => String(part || '').trim()).filter(Boolean).join(':').slice(0, 160);
const accountName = (code: string): string => FINANCE_ACCOUNT_NAMES.get(code) || code;

function buildTwoLineFinanceDraft(input: {
  sourceType: FinanceSourceJournalType;
  sourceId: string;
  date: string;
  reference: string;
  description: string;
  debitCode: string;
  creditCode: string;
  amount: number;
  projectId?: string;
  relatedSourceId?: string;
  notes: string;
}): FinanceSourceJournalDraft {
  return {
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    date: input.date,
    reference: input.reference,
    description: input.description,
    projectId: input.projectId || undefined,
    ...(input.relatedSourceId ? { relatedSourceId: input.relatedSourceId } : {}),
    lines: [
      { accountCode: input.debitCode, accountName: accountName(input.debitCode), debit: input.amount, credit: 0, notes: input.notes },
      { accountCode: input.creditCode, accountName: accountName(input.creditCode), debit: 0, credit: input.amount, notes: input.notes }
    ],
    notes: input.notes
  };
}

/**
 * Prepares draft-only entries for Finance source records. Expenses are accrued on incurred date,
 * while payments are separate entries that settle Accounts Payable. No draft returned by this function is approved or posted.
 * Unsupported or ambiguous sources stay in the skipped list rather than silently guessing accounts.
 */
export function buildFinanceSourceJournalDrafts(
  invoices: AgencyInvoice[],
  expenses: Array<AgencyExpense & Record<string, any>>,
  cashBankTransactions: Array<{ id: string; status?: string; payload: Record<string, unknown> }>,
  vendorBills: Array<{ id: string; recordKey?: string; projectId?: string; payload: Record<string, unknown> }> = [],
  vendorBillPayments: Array<{ id: string; status?: string; payload: Record<string, unknown> }> = [],
  chartAccounts: Array<{ code: string; name?: string; type?: string; accountType?: string; active?: boolean }> = []
): FinanceSourceJournalPlan {
  const drafts: FinanceSourceJournalDraft[] = [];
  const skipped: FinanceSourceJournalSkip[] = [];
  const accountNames = new Map<string, string>(FINANCE_ACCOUNT_NAMES);
  const accountTypes = new Map<string, string>(EXCEL_CHART_OF_ACCOUNTS.map((account) => [account.code, account.type] as const));
  for (const account of chartAccounts) {
    const code = String(account.code || '').trim();
    if (!/^\d{4}$/.test(code)) continue;
    if (account.name) accountNames.set(code, String(account.name));
    if (account.active === false) { accountTypes.set(code, '__inactive__'); continue; }
    const type = String(account.accountType || account.type || '').trim();
    if (type) accountTypes.set(code, type);
  }
  const skip = (item: FinanceSourceJournalSkip) => skipped.push(item);

  for (const invoice of invoices) {
    if (!isIssuedInvoice(invoice)) continue;
    let invoiceRecognitionReady = true;

    const invoiceId = String(invoice.id || '').trim();
    const issueDate = String(invoice.issueDate || '').slice(0, 10);
    const invoiceAmount = safeFinanceMoney(invoice.total);
    const invoiceReference = String(invoice.invoiceNumber || invoiceId || '').slice(0, 160);
    const invoiceDescription = 'Invoice issued · ' + String(invoice.clientCompany || invoice.clientName || 'Client not set');
    const invoiceSourceId = sourceIdentifier(invoiceId, 'issued');
    if (!invoiceId || !invoiceAmount || !isValidFinanceDate(issueDate)) {
      skip({
        sourceType: 'invoice-issued', sourceId: invoiceSourceId, date: issueDate,
        reference: invoiceReference, description: invoiceDescription, amount: Number(invoice.total) || 0,
        reason: 'Invoice issuance needs a stable invoice ID, valid issue date and positive total.'
      });
    } else if (safeFinanceCurrency(invoice.currency) !== 'IDR') {
      skip({
        sourceType: 'invoice-issued', sourceId: invoiceSourceId, date: issueDate,
        reference: invoiceReference, description: invoiceDescription, amount: invoiceAmount,
        reason: 'The workbook ledger is IDR-only. Document the FX rate and conversion before creating a journal.'
      });
    } else {
      const taxAmount = safeFinanceMoney(invoice.taxAmount);
      if (taxAmount > invoiceAmount + 0.01) {
        invoiceRecognitionReady = false;
        skip({ sourceType: 'invoice-issued', sourceId: invoiceSourceId, date: issueDate, reference: invoiceReference, description: invoiceDescription, amount: invoiceAmount, reason: 'Invoice tax exceeds invoice total. Correct invoice totals before journalizing.' });
      } else if (taxAmount > 0.01 && accountTypes.get('2100') !== 'Liability') {
        invoiceRecognitionReady = false;
        skip({ sourceType: 'invoice-issued', sourceId: invoiceSourceId, date: issueDate, reference: invoiceReference, description: invoiceDescription, amount: invoiceAmount, reason: 'The Tax Payable account (2100) must exist and be active before a taxable invoice can be journalized.' });
      } else if (taxAmount > 0.01) {
        const revenueAmount = Math.round((invoiceAmount - taxAmount) * 100) / 100;
        const notes = 'Draft generated from an issued IDR invoice. Debit Accounts Receivable for the invoice total, credit Project Revenue for the tax-exclusive amount and credit Tax Payable for output tax. Verify supporting evidence; not posted.';
        drafts.push({
          sourceType: 'invoice-issued', sourceId: invoiceSourceId, date: issueDate,
          reference: invoiceReference, description: invoiceDescription, projectId: invoice.projectId || undefined,
          lines: [
            { accountCode: '1300', accountName: accountNames.get('1300') || 'Accounts Receivable', debit: invoiceAmount, credit: 0, notes },
            ...(revenueAmount > 0 ? [{ accountCode: '4000', accountName: accountNames.get('4000') || 'Project Revenue', debit: 0, credit: revenueAmount, notes }] : []),
            { accountCode: '2100', accountName: accountNames.get('2100') || 'Tax Payable', debit: 0, credit: taxAmount, notes }
          ],
          notes
        });
      } else {
        const notes = 'Draft generated from an issued AMS invoice with zero recorded tax. Debit Accounts Receivable and credit Project Revenue. Confirm items, discounts and no duplicate recognition; not posted.';
        drafts.push(buildTwoLineFinanceDraft({
          sourceType: 'invoice-issued', sourceId: invoiceSourceId, date: issueDate,
          reference: invoiceReference, description: invoiceDescription,
          debitCode: '1300', creditCode: '4000', amount: invoiceAmount,
          projectId: invoice.projectId, notes
        }));
      }
    }

    const payments = getPaymentRows(invoice);
    if (payments.length === 0 && getInvoiceCollected(invoice) > 0) {
      skip({
        sourceType: 'invoice-payment',
        sourceId: sourceIdentifier(invoice.id, 'payment-date-required'),
        date: String(invoice.paidDate || ''),
        reference: String(invoice.invoiceNumber || invoice.id || ''),
        description: 'Client receipt · ' + String(invoice.clientCompany || invoice.clientName || 'Client not set'),
        amount: getInvoiceCollected(invoice),
        reason: 'A collection amount exists without a dated payment row. Verify the receipt date before journalizing.'
      });
      continue;
    }

    if (!invoiceRecognitionReady) {
      for (let paymentIndex = 0; paymentIndex < payments.length; paymentIndex++) {
        const payment = payments[paymentIndex];
        skip({ sourceType: 'invoice-payment', sourceId: sourceIdentifier(invoice.id, 'payment', payment.id, String(paymentIndex)), date: payment.date, reference: String(payment.reference || invoice.invoiceNumber || invoice.id || ''), description: 'Client receipt · ' + String(invoice.clientCompany || invoice.clientName || 'Client not set'), amount: Number(payment.amount) || 0, reason: 'Receipt journal is held because the linked invoice recognition entry is not eligible. Correct the invoice tax and account mapping first.' });
      }
      continue;
    }

    for (let paymentIndex = 0; paymentIndex < payments.length; paymentIndex++) {
      const payment = payments[paymentIndex];
      const amount = safeFinanceMoney(payment.amount);
      const sourceId = sourceIdentifier(invoice.id, 'payment', payment.id, String(paymentIndex));
      const reference = String(payment.reference || invoice.invoiceNumber || invoice.id || '').slice(0, 160);
      const description = 'Client receipt · ' + String(invoice.clientCompany || invoice.clientName || 'Client not set');
      if (!amount) {
        skip({ sourceType: 'invoice-payment', sourceId, date: payment.date, reference, description, amount: Number(payment.amount) || 0, reason: 'Payment amount must be positive.' });
        continue;
      }
      if (!isValidFinanceDate(payment.date)) {
        skip({ sourceType: 'invoice-payment', sourceId, date: payment.date, reference, description, amount, reason: 'Payment has no valid receipt date.' });
        continue;
      }
      if (safeFinanceCurrency(invoice.currency) !== 'IDR') {
        skip({ sourceType: 'invoice-payment', sourceId, date: payment.date, reference, description, amount, reason: 'The workbook cash accounts are IDR-only. Convert and document the exchange rate before creating a journal.' });
        continue;
      }
      const paymentMethod = String(payment.method || '').toLowerCase().replace(/[\s-]+/g, '_');
      const debitCode = paymentMethod === 'cash' ? '1100' : paymentMethod === 'bank_transfer' ? '1000' : paymentMethod === 'credit_card' ? '1010' : '';
      if (!debitCode) {
        skip({ sourceType: 'invoice-payment', sourceId, date: payment.date, reference, description, amount, reason: 'Payment method is not mapped to a cash, bank or card-clearing account. Record the actual settlement method before posting.' });
        continue;
      }
      const notes = 'Draft generated from an AMS invoice payment. Verify receipt evidence; card receipts are posted to clearing until settled to bank. Not posted.';
      drafts.push(buildTwoLineFinanceDraft({
        sourceType: 'invoice-payment', sourceId, date: payment.date, reference, description,
        debitCode, creditCode: '1300', amount, projectId: invoice.projectId,
        relatedSourceId: sourceIdentifier(invoice.id, 'issued'),
        notes: notes + ' Posting is blocked until the linked invoice-issued journal is posted.'
      }));
    }
  }

  for (const expense of expenses) {
    const metadata = expense.metadata && typeof expense.metadata === 'object' ? expense.metadata as Record<string, unknown> : {};
    const expenseId = String(expense.id || '').trim();
    const expenseDate = String(expense.date || expense.expenseDate || '').slice(0, 10);
    const amount = safeFinanceMoney(expense.amount);
    const reference = String(expense.reference || metadata.reference || expenseId || '').slice(0, 160);
    const description = String(expense.description || expense.category || 'Expense record');
    const sourceId = sourceIdentifier(expenseId);
    const sourceType: FinanceSourceJournalType = 'expense';
    const searchable = [expense.category, expense.description, expense.type].map((value) => String(value || '').toLowerCase()).join(' ');
    const vendorLinked = Boolean(
      expense.vendorId || expense.vendorContractId || expense.vendorPayment ||
      metadata.vendorId || metadata.vendorContractId || metadata.vendorPayment
    );
    if (vendorLinked) {
      skip({
        sourceType: 'expense', sourceId, date: expenseDate, reference, description, amount,
        reason: 'This expense is linked to a vendor or vendor contract. Match the obligation to the Accounts Payable bill workflow before journalizing here to prevent duplicate cost recognition.'
      });
      continue;
    }
    const recordStatus = String(expense.status || metadata.status || '').toLowerCase();
    if (recordStatus && ['voided', 'cancelled', 'canceled', 'rejected', 'deleted', 'draft', 'pending'].includes(recordStatus)) continue;
    if (!expenseId) {
      skip({ sourceType, sourceId: 'missing-expense-id', date: expenseDate, reference, description, amount, reason: 'The expense has no stable source ID for duplicate-safe synchronization.' });
      continue;
    }
    if (!amount) {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount: Number(expense.amount) || 0, reason: 'Expense amount must be positive.' });
      continue;
    }
    if (!isValidFinanceDate(expenseDate)) {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount, reason: 'Expense has no valid incurred/recognition date.' });
      continue;
    }
    if (safeFinanceCurrency((expense as any).currency || metadata.currency) !== 'IDR') {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount, reason: 'The workbook ledger is IDR-only. Convert and document the exchange rate before creating a journal.' });
      continue;
    }
    if (/petty[\s-]*cash|kas kecil|cash voucher|top[\s-]*up (?:petty[\s-]*cash|kas kecil)/i.test(searchable)) {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount, reason: 'This looks like a petty-cash voucher or top-up. Use the approved petty-cash voucher or paired internal-transfer register to avoid duplicate posting.' });
      continue;
    }

    let debitCode = '';
    if (/other project obligations?|project obligations?/i.test(searchable)) {
      debitCode = '5200';
    } else {
      const expenseClass = classifyWorkbookExpense(expense);
      if (expenseClass === 'directProjectCost') debitCode = '5100';
      else if (expenseClass === 'projectTeamFee') debitCode = '5400';
      else if (expenseClass === 'teamReward') {
        if (/sales/.test(searchable)) debitCode = '5300';
        else if (/vendor|pic/.test(searchable)) debitCode = '5310';
        else if (/management|manager/.test(searchable)) debitCode = '5320';
      } else if (expenseClass === 'operatingExpense') {
        debitCode = /bank|admin(?:istration)? fee|transaction fee|transfer fee|payment fee/.test(searchable) ? '5500' : '5600';
      }
    }
    if (!debitCode || accountTypes.get(debitCode) !== 'Expense') {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount, reason: 'No active Expense account mapping exists for this expense. Classify it before creating a journal.' });
      continue;
    }
    if (accountTypes.get('2000') !== 'Liability') {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount, reason: 'Accounts Payable account (2000) must be active before expense accruals can be posted.' });
      continue;
    }

    const accrualNotes = 'Draft generated from an AMS expense record on its incurred date. Debit the classified expense account and credit Accounts Payable. Payment is recorded separately; this entry is not posted.';
    drafts.push(buildTwoLineFinanceDraft({
      sourceType, sourceId, date: expenseDate, reference, description,
      debitCode, creditCode: '2000', amount, projectId: expense.projectId, notes: accrualNotes
    }));

    const explicitPaymentRows = Array.isArray((expense as any).payments) ? (expense as any).payments as Array<Record<string, unknown>> : [];
    const legacyPaymentStatus = String(expense.paymentStatus || metadata.paymentStatus || '').toLowerCase().replace(/[\s-]+/g, '_');
    const paymentRows: Array<Record<string, unknown>> = explicitPaymentRows.length > 0
      ? explicitPaymentRows
      : ['paid', 'settled', 'completed'].includes(legacyPaymentStatus)
        ? [{
            id: String((expense as any).paymentId || expenseId + '-payment'),
            amount,
            date: String(expense.paidDate || metadata.paidDate || ''),
            method: String((expense as any).paymentMethod || metadata.paymentMethod || ''),
            paymentAccountCode: String((expense as any).paymentAccountCode || metadata.paymentAccountCode || ''),
            reference: String((expense as any).paymentReference || metadata.paymentReference || reference)
          }]
        : [];

    const totalRecordedPayments = paymentRows.reduce((sum, payment) => sum + safeFinanceMoney(payment.amount), 0);
    if (totalRecordedPayments > amount + 0.01) {
      skip({ sourceType: 'expense-payment', sourceId: sourceIdentifier(expenseId, 'payment-total'), date: expenseDate, reference, description, amount: totalRecordedPayments, reason: 'Recorded payments exceed the expense amount. Correct the payment history before generating payment journals.' });
      continue;
    }
    for (let paymentIndex = 0; paymentIndex < paymentRows.length; paymentIndex++) {
      const payment = paymentRows[paymentIndex];
      const paymentId = String(payment.id || expenseId + '-payment-' + (paymentIndex + 1)).trim();
      const paymentSourceId = sourceIdentifier(expenseId, 'payment', paymentId);
      const paymentDate = String(payment.date || payment.paidDate || '').slice(0, 10);
      const paymentAmount = safeFinanceMoney(payment.amount);
      const paymentReference = String(payment.reference || reference).slice(0, 160);
      const method = String(payment.method || '').toLowerCase().replace(/[\s-]+/g, '_');
      const paymentAccount = String(payment.paymentAccountCode || payment.accountCode || payment.paidFromAccountCode || '');
      if (!paymentAmount || !isValidFinanceDate(paymentDate)) {
        skip({ sourceType: 'expense-payment', sourceId: paymentSourceId, date: paymentDate, reference: paymentReference, description: 'Expense settlement · ' + description, amount: Number(payment.amount) || 0, reason: 'Expense payment needs a positive amount and a valid actual payment date.' });
        continue;
      }
      let creditCode = '';
      if (method === 'credit_card') {
        if (accountTypes.get('2200') === 'Liability') creditCode = '2200';
      } else if (['bank_transfer', 'cash'].includes(method) && CASH_ACCOUNT_CODES.has(paymentAccount)) {
        creditCode = paymentAccount;
      }
      if (!creditCode) {
        skip({ sourceType: 'expense-payment', sourceId: paymentSourceId, date: paymentDate, reference: paymentReference, description: 'Expense settlement · ' + description, amount: paymentAmount, reason: 'Settlement method/account is incomplete or unsupported. Choose an active bank, cash, emergency-fund, or Credit Card Payable mapping before recording this payment.' });
        continue;
      }
      const paymentNotes = 'Draft generated from an AMS expense payment. Debit Accounts Payable and credit the actual settlement account. Verify bank/card statement and payment evidence; not posted.';
      drafts.push(buildTwoLineFinanceDraft({
        sourceType: 'expense-payment', sourceId: paymentSourceId, date: paymentDate,
        reference: paymentReference, description: 'Expense settlement · ' + description,
        debitCode: '2000', creditCode, amount: paymentAmount, projectId: expense.projectId,
        relatedSourceId: sourceId, notes: paymentNotes
      }));
    }
  }

  const billsById = new Map(vendorBills.map((bill) => [String(bill.id), bill]));
  const eligibleVendorBillIds = new Set<string>();
  for (const bill of vendorBills) {
    const payload = bill.payload || {};
    const billId = String(bill.id || '').trim();
    const billDate = String(payload.billDate || '').slice(0, 10);
    const amount = safeFinanceMoney(payload.total);
    const reference = String(payload.billNo || bill.recordKey || billId || '').slice(0, 160);
    const description = 'Vendor bill recognized · ' + String(payload.vendorName || 'Vendor not set');
    const sourceId = sourceIdentifier(billId);
    const projectId = String(bill.projectId || payload.projectId || '').trim();
    if (!billId || !amount || !isValidFinanceDate(billDate)) {
      skip({
        sourceType: 'vendor-bill-issued', sourceId: sourceId || 'missing-bill-id',
        date: billDate, reference, description, amount: Number(payload.total) || 0,
        reason: 'Vendor bill accrual needs a stable bill ID, positive amount and valid bill date.'
      });
      continue;
    }
    if (safeFinanceCurrency(payload.currency) !== 'IDR') {
      skip({ sourceType: 'vendor-bill-issued', sourceId, date: billDate, reference, description, amount, reason: 'The workbook ledger is IDR-only. Document the FX rate and conversion before creating a bill accrual journal.' });
      continue;
    }
    const debitCode = String(payload.expenseAccountCode || (projectId ? '5100' : '')).trim();
    if (!debitCode || accountTypes.get(debitCode) !== 'Expense') {
      skip({ sourceType: 'vendor-bill-issued', sourceId, date: billDate, reference, description, amount, reason: 'Select an active Expense account for the vendor bill. Project-linked legacy bills default to Direct Project Cost; overhead bills require explicit expense classification.' });
      continue;
    }
    const notes = 'Draft generated from an IDR vendor bill. Debit the saved expense account and credit Accounts Payable. Verify that the obligation has not already been recognized; not posted.';
    drafts.push(buildTwoLineFinanceDraft({
      sourceType: 'vendor-bill-issued', sourceId, date: billDate, reference, description,
      debitCode, creditCode: '2000', amount, projectId: projectId || undefined, notes
    }));
    eligibleVendorBillIds.add(billId);
  }

  for (const payment of vendorBillPayments) {
    const payload = payment.payload || {};
    const paymentId = String(payment.id || '').trim();
    const billId = String(payload.billId || '').trim();
    const bill = billsById.get(billId);
    const paidDate = String(payload.paidDate || '').slice(0, 10);
    const amount = safeFinanceMoney(payload.amount);
    const reference = String(payload.reference || paymentId || '').slice(0, 160);
    const description = 'Vendor payment · ' + String(bill?.payload.billNo || bill?.recordKey || billId || 'Unlinked bill');
    const sourceId = sourceIdentifier(paymentId);

    if (!paymentId || !bill) {
      skip({
        sourceType: 'vendor-bill-payment', sourceId: sourceId || 'missing-payment-id',
        date: paidDate, reference, description, amount,
        reason: 'Vendor payment cannot be mapped because its source payment ID or linked vendor bill is missing.'
      });
      continue;
    }
    if (String(payment.status || '').toLowerCase() !== 'posted') {
      skip({ sourceType: 'vendor-bill-payment', sourceId, date: paidDate, reference, description, amount, reason: 'Vendor payment is not in the posted source state.' });
      continue;
    }
    if (!eligibleVendorBillIds.has(bill.id)) {
      skip({
        sourceType: 'vendor-bill-payment', sourceId, date: paidDate, reference, description, amount,
        reason: 'The linked vendor bill does not have an eligible draft accrual. Classify and review the bill first so this payment cannot reduce an Accounts Payable balance that was never recognized by the source sync.'
      });
      continue;
    }
    if (!isValidFinanceDate(paidDate) || !amount) {
      skip({ sourceType: 'vendor-bill-payment', sourceId, date: paidDate, reference, description, amount: Number(payload.amount) || 0, reason: 'Vendor payment needs a valid payment date and positive amount.' });
      continue;
    }
    if (safeFinanceCurrency(bill.payload.currency) !== 'IDR') {
      skip({ sourceType: 'vendor-bill-payment', sourceId, date: paidDate, reference, description, amount, reason: 'The workbook ledger is IDR-only. Document the FX rate and conversion before creating a journal.' });
      continue;
    }
    const method = String(payload.method || '').trim().toLowerCase();
    const creditCode = method === 'bank_transfer' ? '1000' : method === 'cash' ? '1100' : method === 'credit_card' && accountTypes.get('2200') === 'Liability' ? '2200' : '';
    if (!creditCode) {
      skip({
        sourceType: 'vendor-bill-payment', sourceId, date: paidDate, reference, description, amount,
        reason: 'The payment method has no active settlement-account mapping. Use bank transfer or cash, or activate Credit Card Payable (2200) for card payments.'
      });
      continue;
    }
    const notes = method === 'cash'
      ? 'Draft generated from an AMS vendor bill payment. Debit Accounts Payable and credit Petty Cash Reserve. Verify actual cash source and bill evidence; not posted.'
      : method === 'credit_card'
        ? 'Draft generated from an AMS vendor bill payment. Debit Accounts Payable and credit Credit Card Payable; verify the card statement and bill evidence; not posted.'
        : 'Draft generated from an AMS vendor bill payment. Debit Accounts Payable and credit Cash & Bank. Verify the bank transfer and bill evidence; not posted.';
    drafts.push(buildTwoLineFinanceDraft({
      sourceType: 'vendor-bill-payment', sourceId, date: paidDate, reference, description,
      debitCode: '2000', creditCode, amount,
      projectId: String(bill.projectId || bill.payload.projectId || payload.projectId || '') || undefined,
      relatedSourceId: sourceIdentifier(bill.id), notes: notes + ' Posting is blocked until the linked vendor-bill-issued journal is posted.'
    }));
  }

  for (const transaction of cashBankTransactions) {
    const payload = transaction.payload || {};
    const kind = String(payload.transactionKind || 'manual');
    const sourceCode = String(payload.accountCode || '');
    const counterpartCode = String(payload.counterpartAccountCode || '');
    const date = String(payload.date || '').slice(0, 10);
    const amount = safeFinanceMoney(payload.amount);
    const reference = String(payload.reference || transaction.id || '').slice(0, 160);
    const description = String(payload.description || 'Internal cash transfer');
    const sourceId = sourceIdentifier(transaction.id);
    if (String(transaction.status || payload.status || '').toLowerCase() !== 'posted') {
      skip({ sourceType: 'cash-bank-transfer', sourceId, date, reference, description, amount: Number(payload.amount) || 0, reason: 'The internal transfer is not posted in its source register.' });
      continue;
    }
    if (!isValidFinanceDate(date) || !amount) {
      skip({ sourceType: 'cash-bank-transfer', sourceId, date, reference, description, amount: Number(payload.amount) || 0, reason: 'Internal transfer needs a valid date and positive amount.' });
      continue;
    }
    if (kind === 'manual') {
      if (!CASH_ACCOUNT_CODES.has(sourceCode) || !/^\d{4}$/.test(counterpartCode) || sourceCode === counterpartCode || !accountTypes.has(counterpartCode) || accountTypes.get(counterpartCode) === '__inactive__') {
        skip({ sourceType: 'cash-bank-transfer', sourceId, date, reference, description, amount, reason: 'Manual cash movement needs an active four-digit counterpart account different from the source cash account.' });
        continue;
      }
      const direction = String(payload.direction || 'out');
      if (!['in', 'out'].includes(direction)) {
        skip({ sourceType: 'cash-bank-transfer', sourceId, date, reference, description, amount, reason: 'Manual cash direction must be In or Out.' });
        continue;
      }
      const notes = 'Draft generated from a posted manual Cash & Bank movement. Verify the counterpart account and supporting statement; not posted.';
      drafts.push(buildTwoLineFinanceDraft({
        sourceType: 'cash-bank-transfer', sourceId, date, reference, description,
        debitCode: direction === 'in' ? sourceCode : counterpartCode,
        creditCode: direction === 'in' ? counterpartCode : sourceCode,
        amount, projectId: String(payload.projectId || '') || undefined, notes
      }));
      continue;
    }
    if (!CASH_ACCOUNT_CODES.has(sourceCode) || !CASH_ACCOUNT_CODES.has(counterpartCode) || sourceCode === counterpartCode || !['bank-to-petty-cash', 'petty-cash-to-bank', 'bank-to-emergency-fund', 'emergency-fund-to-bank'].includes(kind)) {
      skip({ sourceType: 'cash-bank-transfer', sourceId, date, reference, description, amount, reason: 'Internal transfer account mapping is incomplete or unsupported. Resolve source and counterpart accounts before journalizing.' });
      continue;
    }
    const notes = 'Draft generated from a posted AMS internal cash transfer. This is a balance-sheet movement, not income or expense. Not posted.';
    drafts.push(buildTwoLineFinanceDraft({
      sourceType: 'cash-bank-transfer', sourceId, date, reference, description,
      debitCode: counterpartCode, creditCode: sourceCode, amount,
      projectId: String(payload.projectId || '') || undefined, notes
    }));
  }

  for (const draft of drafts) for (const line of draft.lines) line.accountName = accountNames.get(line.accountCode) || line.accountCode;
  return { drafts, skipped };
}


export interface VendorBillInstallmentSummary {
  number: 1 | 2 | 3;
  percentage: 30 | 20 | 50;
  amount: number;
  paidAmount: number;
  outstanding: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overpaid';
}

export interface VendorBillInstallmentPayment {
  id?: unknown;
  amount: unknown;
  installmentNumber?: unknown;
  paidDate?: unknown;
}

/**
 * Mirrors the Vendor & Freelancer worksheet: calculate installment amounts, allocate payments
 * explicitly tagged to a stage, and distribute legacy/unassigned payments FIFO. The workbook has
 * one bill due date, not three installment due dates, so this function does not invent stage dates.
 */
export function getVendorBillInstallmentSchedule(
  totalValue: unknown,
  paymentRecords: VendorBillInstallmentPayment[],
  percentages: number[] = [30, 20, 50]
): VendorBillInstallmentSummary[] {
  const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const total = Math.max(0, roundCurrency(Number(totalValue) || 0));
  const validPercentages = percentages.length === 3
    && percentages.every((value) => Number.isFinite(value) && value >= 0)
    && Math.abs(percentages.reduce((sum, value) => sum + value, 0) - 100) < 0.001
    ? percentages
    : [30, 20, 50];
  const firstAmount = roundCurrency(total * validPercentages[0] / 100);
  const secondAmount = roundCurrency(total * validPercentages[1] / 100);
  const amounts = [firstAmount, secondAmount, roundCurrency(Math.max(0, total - firstAmount - secondAmount))];
  const paid = [0, 0, 0];
  const orderedPayments = paymentRecords.slice().sort((a, b) =>
    String(a.paidDate || '').localeCompare(String(b.paidDate || '')) ||
    String(a.id || '').localeCompare(String(b.id || ''))
  );

  for (const payment of orderedPayments) {
    const amount = Math.max(0, roundCurrency(Number(payment.amount) || 0));
    if (amount <= 0) continue;
    const installmentNumber = Number(payment.installmentNumber || 0);
    if ([1, 2, 3].includes(installmentNumber)) {
      const index = installmentNumber - 1;
      paid[index] = roundCurrency(paid[index] + amount);
      continue;
    }
    let remaining = amount;
    for (let index = 0; index < 3 && remaining > 0.009; index++) {
      const balance = Math.max(0, roundCurrency(amounts[index] - paid[index]));
      if (balance <= 0.009) continue;
      const applied = Math.min(balance, remaining);
      paid[index] = roundCurrency(paid[index] + applied);
      remaining = roundCurrency(remaining - applied);
    }
    // Retain excess on the final stage so legacy overpayment anomalies remain visible, not hidden.
    if (remaining > 0.009) paid[2] = roundCurrency(paid[2] + remaining);
  }

  return amounts.map((amount, index) => {
    const paidAmount = roundCurrency(paid[index]);
    const outstanding = Math.max(0, roundCurrency(amount - paidAmount));
    const status: VendorBillInstallmentSummary['status'] = paidAmount > amount + 0.01
      ? 'Overpaid'
      : amount > 0 && paidAmount >= amount - 0.01
        ? 'Paid'
        : paidAmount > 0
          ? 'Partially Paid'
          : 'Unpaid';
    return {
      number: (index + 1) as 1 | 2 | 3,
      percentage: validPercentages[index] as 30 | 20 | 50,
      amount,
      paidAmount,
      outstanding,
      status
    };
  });
}
