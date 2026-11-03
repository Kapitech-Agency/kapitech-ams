export const FINANCE_AREAS = [
  { key: 'overview', label: 'Finance Overview', slug: 'finance-workspace-overview-control', tabs: ['executive-summary', 'dashboard'] },
  { key: 'receivables', label: 'Client Billing', slug: 'finance-workspace-receivables-payables', tabs: ['quotations', 'revenue', 'accounts-receivable'] },
  { key: 'transactions', label: 'Cash & Spend', slug: 'finance-workspace-transactions-cash', tabs: ['cash-bank', 'expenses', 'accounts-payable', 'vendors', 'petty-cash'] },
  { key: 'projects', label: 'Project Finance', slug: 'finance-workspace-project-finance', tabs: ['project-finance', 'operational-budget', 'team-fee', 'project-allocation'] },
  { key: 'accounting', label: 'Books & Close', slug: 'finance-workspace-accounting-reports', tabs: ['monthly-closing', 'journal', 'chart-of-accounts'] },
  { key: 'reports', label: 'Financial Reports', slug: 'finance-workspace-financial-reports', tabs: ['monthly-pnl', 'cash-flow', 'balance-sheet', 'annual-summary'] },
] as const;

export const FINANCE_WORKSHEET_LABELS: Readonly<Record<string, string>> = {
  dashboard: 'Period Performance',
  revenue: 'Client Invoices',
  'accounts-receivable': 'Collections & Aging',
  'accounts-payable': 'Supplier Bills',
  'cash-bank': 'Cash & Reconciliation',
  vendors: 'Suppliers & Freelancers',
  'project-finance': 'Project Profitability',
  'project-allocation': 'Profit Allocation',
  'team-fee': 'Project Team Fees',
  'monthly-closing': 'Month-End Close',
  journal: 'Journal & Posting',
};

export const financeWorksheetUrl = (key: string) => '/admin/finance?tab=' + key;

export function getFinanceArea(worksheet: string) {
  return FINANCE_AREAS.find(area => area.tabs.some(tab => tab === worksheet)) ?? FINANCE_AREAS[0];
}

export const FINANCE_HANDOFFS: Readonly<Record<string, readonly { tab: string; label: string }[]>> = {
  'executive-summary': [
    { tab: 'quotations', label: 'Manage client billing' },
    { tab: 'cash-bank', label: 'Review cash & spend' },
    { tab: 'project-finance', label: 'Review project profitability' },
    { tab: 'monthly-closing', label: 'Open month-end close' },
    { tab: 'monthly-pnl', label: 'Read financial reports' },
  ],
  quotations: [{ tab: 'revenue', label: 'Review client invoices' }],
  revenue: [{ tab: 'quotations', label: 'Review quotations' }, { tab: 'accounts-receivable', label: 'Review open balances' }],
  'accounts-receivable': [{ tab: 'revenue', label: 'Open invoice register' }, { tab: 'cash-bank', label: 'Review cash movements' }],
  'accounts-payable': [{ tab: 'vendors', label: 'Review supplier contracts' }, { tab: 'cash-bank', label: 'Review cash movements' }],
  'project-finance': [{ tab: 'operational-budget', label: 'Review budget variance' }, { tab: 'team-fee', label: 'Review project team fees' }, { tab: 'project-allocation', label: 'Review profit allocation' }],
  'monthly-closing': [{ tab: 'cash-bank', label: 'Review reconciliation evidence' }, { tab: 'journal', label: 'Review posting queue' }, { tab: 'monthly-pnl', label: 'Review profit and loss' }],
};


export const FINANCE_WORKSHEET_START: Readonly<Record<string, string>> = {
  'executive-summary': 'Start with overdue client invoices, then review the period’s performance and recent billing.',
  dashboard: 'Compare the selected period with the previous period, then inspect individual transactions.',
  quotations: 'Open or create a client quotation in the register. Use Pipeline review to check where proposals stand.',
  revenue: 'Find an invoice in the register to review its details or record a payment.',
  'accounts-receivable': 'Start with open invoices. Use Billing review to check how long balances have been outstanding.',
  'cash-bank': 'Review recorded cash movements first. Open Statement reconciliation to check month-end evidence.',
  expenses: 'Find or record an expense. Use Filters to narrow the register by type, category, or period.',
  'accounts-payable': 'Review supplier bills and installments due. Use Contract payments for payments linked to vendor contracts.',
  vendors: 'Find a supplier or freelancer in the directory. Switch to Contract register to review commitments.',
  'petty-cash': 'Review vouchers and balances. Use Reconciliation evidence to find the corresponding cash account.',
  'project-finance': 'Start with the project portfolio. Use Linking exceptions to find Finance records without a linked project.',
  'operational-budget': 'Compare the budget with recorded costs for the same month, category, and project.',
  'team-fee': 'Review fees by project and team member. Use Recorded expense sources to inspect the supporting expenses.',
  'project-allocation': 'Review saved profit allocations by project. Open Team reward policy to check the distribution basis.',
  'monthly-closing': 'Choose the closing month, complete the checklist, then review the evidence before requesting closure.',
  journal: 'Start with the source queue. Review generated drafts in Journal entries before approval or posting.',
  'chart-of-accounts': 'Look up account codes and normal balances before reviewing journal mappings.',
  'monthly-pnl': 'Start with the posted income statement. Switch to Source activity for operational comparison.',
  'cash-flow': 'Start with posted cash flow. Open Source movements to inspect recorded operational activity.',
  'balance-sheet': 'Review the posted statement, then open Opening balances to inspect its supporting register.',
  'annual-summary': 'Compare annual operating activity. Switch to Posted ledger for the accounting comparison.',
};
