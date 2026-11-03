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
