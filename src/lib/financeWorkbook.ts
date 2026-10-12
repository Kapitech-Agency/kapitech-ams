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
      { key: 'chart-of-accounts', sheet: '02', label: 'Chart of Accounts', description: 'Master account codes and normal balances from the workbook.' },
      { key: 'revenue', sheet: '03', label: 'Revenue', description: 'Revenue register sourced from issued client invoices.' },
      { key: 'expenses', sheet: '04', label: 'Expenses', description: 'Expense register sourced from finance expenses in AMS.' },
      { key: 'cash-bank', sheet: '05', label: 'Cash & Bank', description: 'Cash movement view built from recorded receipts and expenses.' },
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
      { key: 'team-fee', sheet: '16', label: 'Team Fee', description: 'Project team-fee allocation, kept separate from Team Reward.' }
    ]
  },
  {
    key: 'projects',
    label: 'Project Finance',
    items: [
      { key: 'project-finance', sheet: '08', label: 'Project Finance', description: 'Project-level budget, invoicing, receipts and recorded costs.' },
      { key: 'operational-budget', sheet: '09', label: 'Operational Budget', description: 'Budget-versus-actual controls and variance review.' },
      { key: 'project-allocation', sheet: '15', label: 'Project Allocation', description: 'The workbook allocation policy for net project profit.' }
    ]
  },
  {
    key: 'accounting',
    label: 'Accounting & Reports',
    items: [
      { key: 'monthly-pnl', sheet: '12', label: 'Monthly P&L', description: 'Monthly profit-and-loss view based on the workbook structure.' },
      { key: 'cash-flow', sheet: '13', label: 'Cash Flow', description: 'Monthly cash inflow, outflow and net movement.' },
      { key: 'monthly-closing', sheet: '14', label: 'Monthly Closing', description: 'Month-end checklist and reconciliation controls.' },
      { key: 'balance-sheet', sheet: '17', label: 'Balance Sheet', description: 'Company-wide assets, liabilities and equity readiness.' },
      { key: 'journal', sheet: '18', label: 'Journal', description: 'Double-entry mapping and source transactions awaiting posting.' },
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
  { code: '1100', name: 'Petty Cash Reserve', type: 'Asset', normalBalance: 'Debit', description: 'Kas kecil/reserve', active: true },
  { code: '1200', name: 'Emergency Fund', type: 'Asset', normalBalance: 'Debit', description: 'Dana darurat', active: true },
  { code: '1300', name: 'Accounts Receivable', type: 'Asset', normalBalance: 'Debit', description: 'Piutang pelanggan', active: true },
  { code: '1400', name: 'Project Asset / Prepayment', type: 'Asset', normalBalance: 'Debit', description: 'Prepayment/project asset', active: true },
  { code: '2000', name: 'Accounts Payable', type: 'Liability', normalBalance: 'Credit', description: 'Hutang vendor/freelancer', active: true },
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
  return type !== 'quotation' && status !== 'draft' && status !== 'cancelled';
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


export type FinanceSourceJournalType = 'invoice-issued' | 'invoice-payment' | 'expense' | 'cash-bank-transfer' | 'vendor-bill-issued' | 'vendor-bill-payment';

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
 * Prepares draft-only journal entries following the cash-basis examples in the Kapitech workbook.
 * No draft returned by this function is approved or posted. Unsupported or ambiguous sources stay
 * in the skipped list so Finance can resolve the account mapping rather than silently guessing.
 */
export function buildFinanceSourceJournalDrafts(
  invoices: AgencyInvoice[],
  expenses: Array<AgencyExpense & Record<string, any>>,
  cashBankTransactions: Array<{ id: string; status?: string; payload: Record<string, unknown> }>,
  vendorBills: Array<{ id: string; recordKey?: string; projectId?: string; payload: Record<string, unknown> }> = [],
  vendorBillPayments: Array<{ id: string; status?: string; payload: Record<string, unknown> }> = []
): FinanceSourceJournalPlan {
  const drafts: FinanceSourceJournalDraft[] = [];
  const skipped: FinanceSourceJournalSkip[] = [];
  const skip = (item: FinanceSourceJournalSkip) => skipped.push(item);

  for (const invoice of invoices) {
    if (!isIssuedInvoice(invoice)) continue;

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
    } else if (safeFinanceMoney(invoice.taxAmount) > 0.01) {
      skip({
        sourceType: 'invoice-issued', sourceId: invoiceSourceId, date: issueDate,
        reference: invoiceReference, description: invoiceDescription, amount: invoiceAmount,
        reason: 'Taxable invoice issuance is held because the current workbook Chart of Accounts has no dedicated tax-liability account; do not credit tax to revenue.'
      });
    } else {
      const notes = 'Draft generated from an issued AMS invoice with zero recorded tax. Debit Accounts Receivable and credit Project Revenue. Confirm invoice items, discounts and that this invoice has not already been recognized in the ledger; not posted.';
      drafts.push(buildTwoLineFinanceDraft({
        sourceType: 'invoice-issued', sourceId: invoiceSourceId, date: issueDate,
        reference: invoiceReference, description: invoiceDescription,
        debitCode: '1300', creditCode: '4000', amount: invoiceAmount,
        projectId: invoice.projectId, notes
      }));
    }

    const payments = getPaymentRows(invoice);
    if (safeFinanceMoney(invoice.taxAmount) > 0.01) {
      for (let paymentIndex = 0; paymentIndex < payments.length; paymentIndex++) {
        const payment = payments[paymentIndex];
        skip({
          sourceType: 'invoice-payment',
          sourceId: sourceIdentifier(invoice.id, 'payment', payment.id, String(paymentIndex)),
          date: payment.date,
          reference: String(payment.reference || invoice.invoiceNumber || invoice.id || ''),
          description: 'Client receipt · ' + String(invoice.clientCompany || invoice.clientName || 'Client not set'),
          amount: Number(payment.amount) || 0,
          reason: 'The related invoice is taxable and its issuance draft is held because a tax-liability account is missing. Reconcile the invoice AR/tax posting before generating a cash-receipt journal.'
        });
      }
      continue;
    }
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
      const notes = 'Draft generated from an AMS invoice payment. Confirm the receipt against supporting evidence; this follows the workbook cash-basis receipt example and is not posted.';
      drafts.push(buildTwoLineFinanceDraft({
        sourceType: 'invoice-payment', sourceId, date: payment.date, reference, description,
        debitCode: '1000', creditCode: '1300', amount, projectId: invoice.projectId,
        relatedSourceId: sourceIdentifier(invoice.id, 'issued'),
        notes: notes + ' Posting is blocked until the linked invoice-issued journal is posted.'
      }));
    }
  }

  for (const expense of expenses) {
    const metadata = expense.metadata && typeof expense.metadata === 'object' ? expense.metadata as Record<string, unknown> : {};
    const expenseId = String(expense.id || '').trim();
    const expenseDate = String(expense.date || '').slice(0, 10);
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
        reason: 'This expense is linked to a vendor or vendor contract. Match it to the Accounts Payable bill/payment workflow or confirm that it is not the same obligation before generating a journal; automatic expense posting is withheld to prevent duplicate cost and cash entries.'
      });
      continue;
    }
    const recordStatus = String(expense.status || metadata.status || '').toLowerCase();
    const paymentStatus = String(expense.paymentStatus || metadata.paymentStatus || '').toLowerCase();
    if (recordStatus && ['voided', 'cancelled', 'canceled', 'rejected', 'deleted', 'draft', 'pending'].includes(recordStatus)) continue;
    if (paymentStatus && ['unpaid', 'pending', 'planned', 'awaiting_payment', 'not_paid'].includes(paymentStatus.replace(/[\s-]+/g, '_'))) {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount: Number(expense.amount) || 0, reason: 'The source indicates this expense is not yet paid. Do not create a cash-basis journal until payment is confirmed.' });
      continue;
    }
    if (!expenseId) {
      skip({ sourceType, sourceId: 'missing-expense-id', date: expenseDate, reference, description, amount, reason: 'The expense has no stable source ID for duplicate-safe synchronization.' });
      continue;
    }
    if (!amount) {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount: Number(expense.amount) || 0, reason: 'Expense amount must be positive.' });
      continue;
    }
    if (!isValidFinanceDate(expenseDate)) {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount, reason: 'Expense has no valid transaction date.' });
      continue;
    }
    if (safeFinanceCurrency((expense as any).currency || metadata.currency) !== 'IDR') {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount, reason: 'The workbook cash accounts are IDR-only. Convert and document the exchange rate before creating a journal.' });
      continue;
    }
    if (/petty[\s-]*cash|kas kecil|cash voucher|top[\s-]*up (?:petty[\s-]*cash|kas kecil)/i.test(searchable)) {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount, reason: 'This looks like a petty-cash voucher or top-up. Use the approved petty-cash voucher or paired internal-transfer register to avoid duplicate posting.' });
      continue;
    }
    const explicitAccountValue = expense.paymentAccountCode ?? expense.cashAccountCode ?? expense.paidFromAccountCode
      ?? metadata.paymentAccountCode ?? metadata.cashAccountCode ?? metadata.paidFromAccountCode;
    const explicitAccount = explicitAccountValue == null || String(explicitAccountValue).trim() === ''
      ? ''
      : String(explicitAccountValue).trim();
    if (explicitAccount && !CASH_ACCOUNT_CODES.has(explicitAccount)) {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount, reason: 'The source payment account is not one of the workbook cash accounts 1000, 1100 or 1200. Resolve the account mapping before journalizing.' });
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
    if (!debitCode) {
      skip({ sourceType, sourceId, date: expenseDate, reference, description, amount, reason: 'No unambiguous Chart of Accounts mapping exists for this expense. Classify it before creating a journal.' });
      continue;
    }

    const paymentConfirmed = ['paid', 'settled', 'completed'].includes(paymentStatus);
    const notes = [
      'Draft generated from an AMS expense record.',
      paymentConfirmed ? 'Source payment status says paid; verify the receipt before approval.' : 'The source does not confirm that the expense is paid; verify payment status before approval.',
      explicitAccount ? 'Source payment account: ' + explicitAccount + '; verify supporting evidence.' : 'The source does not verify a payment account; 1000 Cash & Bank is a provisional workbook default. Confirm the actual account before approval.',
      'Not posted.'
    ].join(' ');
    const creditCode = explicitAccount || '1000';
    drafts.push(buildTwoLineFinanceDraft({
      sourceType, sourceId, date: expenseDate, reference, description, debitCode, creditCode,
      amount, projectId: expense.projectId, notes
    }));
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
    if (!projectId) {
      skip({ sourceType: 'vendor-bill-issued', sourceId, date: billDate, reference, description, amount, reason: 'The vendor bill is not linked to an AMS project or expense account classification. Classify the debit account before generating an Accounts Payable accrual.' });
      continue;
    }
    const notes = 'Draft generated from an IDR vendor bill linked to an AMS project. Debit Direct Project Cost and credit Accounts Payable. Verify the bill, project allocation and that the obligation has not already been recognized; not posted.';
    drafts.push(buildTwoLineFinanceDraft({
      sourceType: 'vendor-bill-issued', sourceId, date: billDate, reference, description,
      debitCode: '5100', creditCode: '2000', amount, projectId, notes
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
    const creditCode = method === 'bank_transfer' ? '1000' : method === 'cash' ? '1100' : '';
    if (!creditCode) {
      skip({
        sourceType: 'vendor-bill-payment', sourceId, date: paidDate, reference, description, amount,
        reason: 'The payment method has no confirmed matching credit account in the current Chart of Accounts. Credit-card and other methods need an explicit account mapping.'
      });
      continue;
    }
    const notes = method === 'cash'
      ? 'Draft generated from an AMS vendor bill payment. Debit Accounts Payable and provisionally credit Petty Cash Reserve for a cash payment. Verify the actual payment source and bill evidence before approval; not posted.'
      : 'Draft generated from an AMS vendor bill payment. Debit Accounts Payable and credit Cash & Bank for a bank-transfer payment. Verify the transfer and bill evidence before approval; not posted.';
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
    if (kind === 'manual') continue;
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
    if (!CASH_ACCOUNT_CODES.has(sourceCode) || !CASH_ACCOUNT_CODES.has(counterpartCode) || sourceCode === counterpartCode || !['bank-to-petty-cash', 'petty-cash-to-bank', 'bank-to-emergency-fund', 'emergency-fund-to-bank'].includes(kind)) {
      skip({ sourceType: 'cash-bank-transfer', sourceId, date, reference, description, amount, reason: 'Internal transfer account mapping is incomplete or unsupported. Resolve the source and counterpart accounts before journalizing.' });
      continue;
    }
    const notes = 'Draft generated from a posted AMS internal cash transfer. This is a balance-sheet movement, not income or expense. Not posted.';
    drafts.push(buildTwoLineFinanceDraft({
      sourceType: 'cash-bank-transfer', sourceId, date, reference, description,
      debitCode: counterpartCode, creditCode: sourceCode, amount,
      projectId: String(payload.projectId || '') || undefined, notes
    }));
  }

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
