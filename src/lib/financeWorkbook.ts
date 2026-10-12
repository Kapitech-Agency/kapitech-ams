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
  return status !== 'draft' && status !== 'cancelled';
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
