import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Flat finance navigation keeps the complete worksheet workbook inside the Finance workspace', async () => {
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  const sidebar = await read('src/components/admin/DynamicAdminSidebar.tsx');
  const navigation = await read('src/lib/amsNavigationAccess.ts');
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const workbook = await read('src/lib/financeWorkbook.ts');
  assert.match(layout, /<AdminTopbarTabs/);
  assert.doesNotMatch(layout, /active-module-title|aria-label="Current module"/);
  assert.match(sidebar, /aria-label="Primary navigation"/);
  assert.match(sidebar, /data-ams-navigation-layout="flat"/);
  assert.doesNotMatch(sidebar, /data-ams-nav-submenu|aria-expanded=|ChevronDown/);
  const subnavigation = await read('src/lib/amsModuleSubnavigation.ts');
  assert.match(navigation, /key: 'finance', label: 'Finance', to: '\/admin\/finance\?tab=executive-summary'/);
  assert.doesNotMatch(subnavigation, /Invoicing & Revenues|Profitability & Expenses|Project Profitability/);
  for (const area of ['Overview & Control', 'Transactions & Cash', 'Receivables & Payables', 'Project Finance', 'Accounting & Reports']) {
    assert.ok(workbook.includes("label: '" + area + "'"), 'Missing Finance group ' + area);
  }
  assert.match(workspace, /FINANCE_WORKBOOK_GROUPS/);
  assert.match(subnavigation, /slug: 'finance-workspace-overview-control'/);
  assert.match(subnavigation, /finance-workspace-overview-control/);
  assert.match(subnavigation, /finance-workspace-transactions-cash/);
  assert.match(subnavigation, /finance-workspace-receivables-payables/);
  assert.match(subnavigation, /finance-workspace-project-finance/);
  assert.match(subnavigation, /finance-workspace-accounting-reports/);
  assert.match(workspace, /AdminSectionTabs ariaLabel="Finance worksheets" activeKey=\{activeTab\.key\} items=\{sheetItems\} className="w-full min-w-0 min-\[1100px\]:flex-1" variant="primary"/);
  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');
  assert.ok(primitives.includes("'border-accent/20 bg-accent/10 font-semibold text-fg'"),
    'The primary worksheet active state must use the shared crimson accent tint and border.');
  assert.match(workspace, /data-ams-slug="finance-workspace-navigation"/);
  assert.match(workspace, /data-ams-slug="finance-active-worksheet"/);
  assert.match(workspace, /const sheetItems = \[[\s\S]{0,260}key: 'quotations'[\s\S]{0,260}activeGroup\.items[\s\S]{0,400}canShowFinanceWorksheet\(item\.key\)/);
  assert.ok(workspace.indexOf("key: 'quotations'") < workspace.indexOf('...activeGroup.items'), 'Quotations must be the first worksheet in Receivables & Payables.');
  const worksheetAccessStart = workspace.indexOf('const canShowFinanceWorksheet =');
  const worksheetAccessEnd = workspace.indexOf('const sheetItems =', worksheetAccessStart);
  const worksheetAccess = workspace.slice(worksheetAccessStart, worksheetAccessEnd);
  assert.ok(worksheetAccessStart >= 0 && worksheetAccessEnd > worksheetAccessStart, 'Worksheet access filtering should be explicit.');
  assert.ok(worksheetAccess.includes('canAccessAmsRoute'), 'Worksheet access must continue to respect Finance role permissions.');
  assert.equal(worksheetAccess.includes('sidebarDestinations'), false, 'A worksheet must not disappear just because its URL is also the primary Finance destination.');
  assert.match(workbook, /key: 'executive-summary', sheet: '00', label: 'Executive Summary'/);
  assert.ok(workspace.includes("slug: 'finance-view-quotations'"));
  assert.match(workspace, /label: item\.label/);
  assert.doesNotMatch(workspace, /label: item\.sheet \+ ' ' \+ item\.label/);
  assert.match(workspace, /\{loading \? renderLoading\(\) : renderView\(activeTab\)\}/);
  assert.match(workbook, /FINANCE_WORKBOOK_GROUPS/);
  assert.ok(workbook.includes('cash-bank') && workbook.includes('accounts-receivable'));
});
test('Finance visible copy describes user workflows, not spreadsheet implementation', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const workbook = await read('src/lib/financeWorkbook.ts');

  for (const implementationPhrase of [
    'Excel-aligned finance workflow',
    'Finance workbook sheets',
    'Project name / Excel key',
    'workbook sheet tabs above',
    'Kapitech Finance Final Automated.xlsx',
    'Excel-aligned Finance flow',
    'Persistent workbook register',
    'Excel allocation policy',
    'Workbook Chart of Accounts posting map'
  ]) {
    assert.equal(workspace.includes(implementationPhrase), false, 'Visible Finance copy should not expose implementation wording: ' + implementationPhrase);
  }
  assert.ok(workspace.includes('Finance worksheets'));
  assert.ok(workspace.includes('Project name / project reference'));
  assert.doesNotMatch(workbook, /description: '[^']*(?:workbook|Excel)[^']*'/i);
});

test('Finance workspace groups navigation, search, and alerts using the shared AMS layout patterns', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');

  assert.match(workspace, /className="flex min-w-0 flex-col gap-3 min-\[1100px\]:flex-row min-\[1100px\]:items-center min-\[1100px\]:justify-between"[\s\S]{0,280}data-ams-slug="finance-workspace-navigation"/);
  assert.doesNotMatch(workspace, /SEARCHABLE_FINANCE_TABS\.has\(activeTab\.key\) && activeGroup\.items\.length <= 4/);
  assert.match(workspace, /<div className="flex min-w-0 w-full justify-start min-\[1100px\]:w-72 min-\[1100px\]:shrink-0 min-\[1100px\]:justify-end" data-ams-slug="finance-worksheet-search">/);
  assert.doesNotMatch(workspace, /finance-workspace-navigation[\s\S]{0,100}lg:flex-row/,
    'Finance worksheet navigation stays stacked until the canonical 1100px breakpoint.');
  assert.match(workspace, /\(Boolean\(registerActionError && !editor\) \|\| registerErrors\.length > 0 \|\| sourceErrors\.length > 0\)/);
  assert.match(workspace, /<AdminModuleNotice[\s\S]{0,320}Finance action needs attention/);
  assert.doesNotMatch(workspace, /<WorkbookNote tone="warning" title="Some finance sources are unavailable">/);
  assert.match(workspace, /<div className="min-w-0 space-y-3" data-ams-feature-slug=\{activeTab\.key\} data-ams-slug="finance-active-worksheet">/);
});

test('The Finance worksheet search controls the embedded vendor directory without a duplicate search field', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const vendors = await read('src/pages/admin/AdminVendors.tsx');

  assert.match(workspace, /<AdminVendors embedded searchTerm=\{searchText\} \/>/);
  assert.match(vendors, /embedded\?: boolean; searchTerm\?: string/);
  assert.match(vendors, /const effectiveSearchQuery = searchTerm \?\? searchQuery/);
  assert.match(vendors, /v\.name\.toLowerCase\(\)\.includes\(effectiveSearchQuery\.toLowerCase\(\)\)/);
  assert.match(vendors, /className=\{searchTerm !== undefined \? 'hidden' : 'relative w-full lg:w-96'\}/);
});

test('Cash Flow and Annual Summary separate actual cash accounts and exclude internal transfers', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');

  assert.match(workspace, /Posted General Ledger view below is calculated from posted journal lines/);
  assert.match(workspace, /opening balance entries are not treated as cash flows/);
  assert.match(workspace, /const getPostedLedgerCashFlow =/);
  assert.match(workspace, /const postedCurrentFlow = selectedRange \? getPostedLedgerCashFlow/);
  assert.match(workspace, /metric: 'Recorded cash outflow \(proxy\)'[\s\S]*?excludes petty-cash vouchers/);
  assert.match(workspace, /Collections minus recorded bank outflow proxy; excludes petty-cash voucher spending/);
  assert.match(workspace, /metric: 'Annual recorded cash in'[\s\S]*?excludes petty-cash voucher receipts/);
  assert.doesNotMatch(workspace, /metric: 'Annual Collections'[\s\S]*?basis: 'Payment date'/);
  assert.match(workspace, /Recorded cash in minus outflow proxy; cash transfers and petty-cash voucher activity are not a complete consolidated view/);
  assert.match(workspace, /FINANCE_UI_COPY: Record<string, string> = \{[\s\S]*?Perlakukan hasilnya sebagai pergerakan bersih/);
});

test('Annual Summary compares selected and previous years while preserving operating versus posted-ledger sources', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const annualStart = workspace.indexOf("case 'annual-summary': {");
  const annualEnd = workspace.indexOf("\n      default:", annualStart);
  assert.ok(annualStart >= 0 && annualEnd > annualStart, 'Annual Summary worksheet should be present.');
  const annualView = workspace.slice(annualStart, annualEnd);

  assert.doesNotMatch(annualView, /<AdminMetricStrip/, 'Annual figures should not be repeated in a KPI strip and comparison tables.');
  assert.match(annualView, /const previousYear = String\(Number\(selectedYear\) - 1\)/);
  assert.match(annualView, /buildAnnualSnapshot\(selectedYear\)/);
  assert.match(annualView, /buildAnnualSnapshot\(previousYear\)/);
  assert.match(annualView, /const previousRowsById = new Map\(previousSnapshot\.rows\.map/);
  assert.match(annualView, /difference: item\.amount - previousAmount/);
  assert.match(annualView, /title="Annual operating activity comparison"/);
  assert.match(annualView, /title="Posted General Ledger comparison"/);
  assert.match(annualView, /const annualOperatingRows = annualComparisonRows\.filter\(\(item\) => !item\.id\.startsWith\('gl-'\)\)/);
  assert.match(annualView, /const postedLedgerSummaryRows = annualComparisonRows\.filter\(\(item\) => item\.id\.startsWith\('gl-'\)\)/);
  assert.match(annualView, /Measurement basis/);
  assert.match(annualView, /metric: 'Issued invoice value \(excluding tax\)'/);
  assert.match(annualView, /This is billed value, not recognized accounting revenue/);
  assert.doesNotMatch(annualView, /Annual Revenue \/ Invoice Value/);
  assert.ok(workspace.includes('"Issued invoice value (excluding tax)":"Nilai invoice yang diterbitkan (di luar pajak)"'));
  assert.ok(workspace.includes('"Nilai invoice yang diterbitkan (di luar pajak)":"Issued invoice value (excluding tax)"'));

  assert.match(annualView, /Only posted journal lines contribute/);
  assert.match(annualView, /difference is selected year minus previous year/i);
  assert.match(annualView, /If the Finance source notice above indicates incomplete availability/);
  assert.match(annualView, /Export posted GL comparison/);
  assert.match(annualView, /selected year \/ ' \+ previousSnapshot\.postedJournalCount \+ ' previous year/);
  assert.match(annualView, /selectedSnapshot\.postedCashActivityCount \+ ' selected year \/ ' \+ previousSnapshot\.postedCashActivityCount/);
});

test('Cash Flow presents source and posted-ledger comparison tables without duplicated KPI strips', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const cashFlowStart = workspace.indexOf("case 'cash-flow': {");
  const cashFlowEnd = workspace.indexOf("\n      case 'monthly-closing':", cashFlowStart);
  assert.ok(cashFlowStart >= 0 && cashFlowEnd > cashFlowStart, 'Cash Flow worksheet should be present.');
  const cashFlowView = workspace.slice(cashFlowStart, cashFlowEnd);

  assert.doesNotMatch(cashFlowView, /<AdminMetricStrip/, 'Cash flow summary values should not be duplicated above comparison tables.');
  assert.match(cashFlowView, /title="Posted General Ledger cash flow"/);
  assert.match(cashFlowView, /title="Source cash movement comparison \(proxy\)"/);
  assert.match(cashFlowView, /title="Recorded source cash movement by Month \(proxy\)"/);
  assert.match(cashFlowView, /const postedFlowRows = postedFlowMetrics\.map/);
  assert.match(cashFlowView, /const flowComparisonRows = flowComparisonMetrics\.map/);
  assert.match(cashFlowView, /Export posted GL/);
  assert.match(cashFlowView, /Export comparison/);
  assert.match(cashFlowView, /Export period detail/);
});

test('Monthly P&L separates operational preview from the posted-ledger snapshot', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const pnlStart = workspace.indexOf("case 'monthly-pnl': {");
  const pnlEnd = workspace.indexOf("\n      case 'cash-flow':", pnlStart);
  assert.ok(pnlStart >= 0 && pnlEnd > pnlStart, 'Monthly P&L worksheet should be present.');
  const pnlView = workspace.slice(pnlStart, pnlEnd);
  const comparisonIndex = pnlView.indexOf('title="Operational source preview comparison"');
  const detailIndex = pnlView.indexOf('title="Operational source preview detail"');
  const ledgerIndex = pnlView.indexOf('data-ams-slug="finance-pnl-posted-ledger-summary"');

  assert.ok(comparisonIndex >= 0 && detailIndex > comparisonIndex && ledgerIndex > detailIndex, 'Source preview should lead, with posted-ledger figures grouped after its detail.');
  assert.doesNotMatch(pnlView, /id: 'pnl-revenue'/, 'Source-preview headline values are already represented in the comparison and detail tables.');
  assert.match(pnlView, /id: 'gl-revenue'/, 'Posted-ledger statement rows must remain visible.');
  const postedLedgerTable = pnlView.indexOf('title="Posted General Ledger income statement"');
  assert.ok(postedLedgerTable > detailIndex, 'The formal posted-ledger statement follows the operational preview.');
  assert.match(pnlView, /id: 'gl-expense'/);
  assert.match(pnlView, /id: 'gl-net'/);
  assert.match(pnlView, /Posted Revenue account credits less debits/);
  assert.match(pnlView, /Posted Expense account debits less credits/);
  assert.match(pnlView, /Posted Revenue less posted Expense-account activity; resolve source exceptions before relying on this as profit/);
  assert.match(pnlView, /Export posted GL/);
  assert.match(pnlView, /No posted journal entries returned for the selected period/);
  assert.match(pnlView, /Export comparison/);
  assert.match(pnlView, /Export CSV/);
  assert.match(pnlView, /postedLedger\.available/);
});

test('Project Finance distinguishes unavailable project source from a valid empty project response', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  assert.match(workspace, /const \[hasSuccessfulProjectSource, setHasSuccessfulProjectSource\] = useState\(false\)/);
  assert.match(workspace, /setProjects\(Array\.isArray\(projectSource\.data\?\.projects\) \? projectSource\.data\.projects as AgencyProject\[\] : \[\]\);\s*setHasSuccessfulProjectSource\(true\)/);
  const start = workspace.indexOf("case 'project-finance': {");
  const end = workspace.indexOf("case 'operational-budget':", start);
  assert.ok(start >= 0 && end > start, 'Project Finance worksheet should be available.');
  const project = workspace.slice(start, end);
  assert.match(project, /sourceErrors\.some\(\(error\) => error\.startsWith\('Projects:'\)\)/);
  assert.match(project, /Project source is stale/);
  assert.match(project, /Project source unavailable/);
  assert.match(project, /Last successfully loaded projects remain visible as stale/);
  assert.match(project, /No successful project source has loaded/);
  assert.match(project, /onClick=\{\(\) => void loadData\(true\)\} disabled=\{refreshing\}/);
  assert.match(project, /emptyMessage=\{projectSourceBlocked && !hasSuccessfulProjectSource \? 'Project source is unavailable/);
});

test('Project Finance provides a compact card register with the same rows, sorting, pagination, and row actions', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const componentStart = workspace.indexOf('const FinanceDataTable: React.FC');
  const componentEnd = workspace.indexOf('const WorkbookNote:', componentStart);
  const component = workspace.slice(componentStart, componentEnd);
  const projectStart = workspace.indexOf("case 'project-finance': {");
  const projectEnd = workspace.indexOf("case 'operational-budget':", projectStart);
  const projectView = workspace.slice(projectStart, projectEnd);

  assert.ok(componentStart >= 0 && componentEnd > componentStart);
  assert.ok(projectStart >= 0 && projectEnd > projectStart);
  assert.match(component, /compactCardLayout\?: FinanceCompactCardLayout/);
  assert.match(component, /data-ams-slug="finance-project-finance-cards"/);
  assert.match(component, /visibleRows\.map\(\(row\) => \(/);
  assert.match(component, /setSort\(\(current\) => \(\{ index, direction: current\?\.index === index \? current\.direction : 'asc' \}\)\)/);
  assert.match(component, /hidden max-w-full overflow-x-auto min-\[1280px\]:block/);
  assert.match(projectView, /compactCardLayout=\{\{titleIndex:0,subtitleIndexes:\[1,2\],statusIndexes:\[13,16\]/);
  assert.match(projectView, /label:'Planned financials',indexes:\[3,4,5,6\]/);
  assert.match(projectView, /label:'Reporting-period activity',indexes:\[7,8,9,10,11,12\]/);
  assert.match(projectView, /detailIndexes:\[14,15\],actionIndex:17/);
  assert.match(projectView, /calculateProjectFinanceWorkbookSummary/);
});

test('Cash & Bank separates cash movement metrics from statement reconciliation controls', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const cashStart = workspace.indexOf("case 'cash-bank': {");
  const cashEnd = workspace.indexOf("case 'accounts-receivable':", cashStart);
  assert.ok(cashStart >= 0 && cashEnd > cashStart, 'Cash & Bank workspace should be present.');
  const cash = workspace.slice(cashStart, cashEnd);
  const ledgerIndex = cash.indexOf('title="Cash & Bank ledger"');
  const metrics = [...cash.matchAll(/<AdminMetricStrip metrics=\{\[/g)].map((match) => match.index ?? -1);
  const reconciliationStart = cash.indexOf('data-ams-slug="finance-statement-reconciliation-workspace"');
  const reconciliation = cash.slice(reconciliationStart);

  assert.ok(ledgerIndex >= 0 && metrics.length === 2 && metrics[0] > ledgerIndex, 'The cash ledger should lead its supporting movement metrics.');
  assert.ok(reconciliationStart > metrics[0], 'Statement reconciliation should be a distinct later workspace.');
  assert.ok(reconciliation.indexOf('cash-recon-complete') < reconciliation.indexOf('title={openReconCount'), 'Reconciliation metrics should precede their actionable warning.');
  assert.ok(reconciliation.indexOf('title={openReconCount') < reconciliation.indexOf("title={'Statement reconciliation"), 'The reconciliation warning should stay attached to its statement table.');
  assert.match(cash.slice(metrics[0], reconciliationStart), /cash-opening[\s\S]*cash-in[\s\S]*cash-out[\s\S]*cash-closing/);
  assert.doesNotMatch(cash.slice(metrics[0], reconciliationStart), /cash-recon-complete|cash-recon-open/);
  assert.match(reconciliation, /cash-recon-complete[\s\S]*cash-recon-open/);
  assert.match(cash, /postedBalanceAsOf/);
});

test('Finance read permission blocks unauthorized register loads and shows an explicit restricted state', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');

  assert.match(workspace, /const canViewFinancials = hasAdminPermission\('canViewFinancials'\)/);
  assert.match(workspace, /const loadData = useCallback\(async \(quiet = false\) => \{\s*if \(!canViewFinancials\) \{\s*setLoading\(false\);\s*setRefreshing\(false\);\s*return;/);
  assert.match(workspace, /if \(!canViewFinancials\) return;/);
  assert.match(workspace, /if \(!canViewFinancials\) \{[\s\S]*?const restrictedPage = \(/);
  assert.match(workspace, /title="Financial access restricted"/);
  assert.match(workspace, /Your account does not have permission to view Finance data\./);
});

test('Finance worksheet search, date display, and register permissions are wired end to end', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');

  assert.ok(
    workspace.includes(String.raw`if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '—';`),
    'Finance tables must validate ISO dates with digit patterns so valid dates render.'
  );
  assert.match(workspace, /const getLocalDateInputValue = \(date = new Date\(\)\): string =>/);
  assert.doesNotMatch(workspace, /new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/, 'Date-only finance defaults must use local time, not UTC.');
  const cashBankStart = workspace.indexOf("case 'cash-bank': {");
  const receivablesStart = workspace.indexOf("case 'accounts-receivable':", cashBankStart);
  assert.ok(cashBankStart >= 0 && receivablesStart > cashBankStart);
  assert.doesNotMatch(workspace.slice(cashBankStart, receivablesStart), /renderRecentActivity\(\)/, 'Cash & Bank should not repeat a second table of the same movements.');
  assert.match(workspace, /SEARCHABLE_FINANCE_TABS\.has\(activeTab\.key\)/);
  assert.match(workspace, /value=\{searchText\}[\s\S]*?onChange=\{\(event\) => setSearchText\(event\.target\.value\)\}/);
  assert.match(workspace, /onClick=\{\(\) => setSearchText\(''\)\}/);
  assert.match(workspace, /const canManageFinanceRecords = hasAdminPermission\('canManageInvoices'\)/);
  assert.match(workspace, /const canApproveFinanceRecords = hasAdminPermission\('canApproveBudgets'\)/);
  assert.match(workspace, /const isPeriodLocked = Boolean\(recordPeriod\) && getRegisterRecords\('monthly-closing-lock'\)/);
  assert.match(workspace, /canApproveFinanceRecords && !isPeriodLocked && type === 'petty-cash-voucher'/);
  const closingStart = workspace.indexOf("case 'monthly-closing': {");
  const allocationStart = workspace.indexOf("case 'project-allocation':", closingStart);
  assert.ok(closingStart >= 0 && allocationStart > closingStart);
  const closingView = workspace.slice(closingStart, allocationStart);
  assert.match(closingView, /<CustomDatePicker type="month" value=\{selectedClosingMonth\} onChange=\{setSelectedClosingMonth\}/);
  assert.match(closingView, /aria-label="Closing month"/);
  assert.match(closingView, /Closing month: \{selectedClosingMonth\}/);
  assert.match(closingView, /slug="finance-closing-month-picker"/);
  assert.doesNotMatch(closingView, /slug="finance-closing-month-picker"[^>]*disabled=\{locked\}/, 'Users must be able to navigate away from a locked month.');
  assert.match(workspace, /You do not have permission to approve Finance records/);
  assert.match(workspace, /finally \{\s*setRegisterSaving\(false\);\s*\}/);
});

test('Accounts Payable installment selection uses canonical values and remaining installment balances', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const repository = await read('server/postgres-finance-workbook-repository.ts');

  assert.match(workspace, /defaultValue:'Unassigned'/);
  assert.match(workspace, /savedPayload\.installmentNumber = installmentNumber >= 1 && installmentNumber <= 3\s*\? String\(installmentNumber\)\s*: 'Unassigned';/);
  assert.match(workspace, /current\.type === 'vendor-bill-payment' && \['billId', 'installmentNumber'\]\.includes\(key\)/);
  assert.match(workspace, /payload\.amount = Math\.min\(billOutstanding, Math\.max\(0, selectedOutstanding\)\)/);
  assert.match(repository, /Payment exceeds the outstanding amount for Payment/);
});

test('Finance groups and vendor workflows are separated by user task', async () => {
  const workbook = await read('src/lib/financeWorkbook.ts');
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');

  const transactionsStart = workbook.indexOf("key: 'transactions',");
  const receivablesStart = workbook.indexOf("key: 'receivables',");
  const projectsStart = workbook.indexOf("key: 'projects',");
  const accountingStart = workbook.indexOf("key: 'accounting',");
  const groupsEnd = workbook.indexOf('\n];', accountingStart);
  assert.ok(transactionsStart >= 0 && receivablesStart > transactionsStart);
  assert.ok(projectsStart > receivablesStart && accountingStart > projectsStart && groupsEnd > accountingStart);

  const transactionsGroup = workbook.slice(transactionsStart, receivablesStart);
  const receivablesGroup = workbook.slice(receivablesStart, projectsStart);
  const projectsGroup = workbook.slice(projectsStart, accountingStart);
  const accountingGroup = workbook.slice(accountingStart, groupsEnd);
  assert.match(transactionsGroup, /items: \[\s*\{ key: 'cash-bank'/);
  assert.match(accountingGroup, /items: \[\s*\{ key: 'journal'/);
  assert.doesNotMatch(transactionsGroup, /key: 'chart-of-accounts'/);
  assert.doesNotMatch(receivablesGroup, /key: 'team-fee'/);
  assert.match(projectsGroup, /key: 'team-fee'/);
  assert.match(accountingGroup, /key: 'chart-of-accounts'/);

  const apStart = workspace.indexOf("case 'accounts-payable': {");
  const vendorsStart = workspace.indexOf("case 'vendors':", apStart);
  const projectStart = workspace.indexOf("case 'project-finance': {", vendorsStart);
  assert.ok(apStart >= 0 && vendorsStart > apStart && projectStart > vendorsStart);
  const apView = workspace.slice(apStart, vendorsStart);
  const vendorsView = workspace.slice(vendorsStart, projectStart);
  assert.match(apView, /title="Accounts Payable register"/);
  assert.match(apView, /title="Vendor payment schedule"/);
  assert.match(apView, /bills\.length > 0 &&/);
  assert.match(workspace, /const financeWorksheetDestination = \(key: string\) => '\/admin\/finance\?tab=' \+ key/);
  assert.match(workspace, /const canShowFinanceWorksheet = \(key: string\) =>/);
  assert.doesNotMatch(workspace, /sidebarDestinations/);
  assert.doesNotMatch(apView, /title="Vendor contract references"/);
  assert.match(vendorsView, /<AdminVendors embedded searchTerm=\{searchText\} \/>/);
  assert.match(vendorsView, /Vendor contract register/);
  assert.match(vendorsView, /openVendorContractEditor\(vendor, contract\)/);
  assert.doesNotMatch(vendorsView, /Vendor & Freelancer payment schedule/);
  assert.match(apView, /installment\.percentage/);
  assert.match(apView, /Outstanding \{formatMoney\(installment\.outstanding, currency\)\}/);
});

test('Finance locale uses the selected application language and localized finance account labels', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const translations = await read('src/lib/LanguageContext.tsx');
  assert.match(workspace, /const \{ language \} = useLanguage\(\)/);
  assert.match(workspace, /language === 'id' \? 'id-ID' : 'en-US'/);
  assert.match(workspace, /localizeFinanceValue\(financePage, language\)/);
  assert.match(workspace, /Kas dan rekening bank/);
  assert.match(workspace, /Cash and bank accounts/);
  assert.match(translations, /'admin\.finance\.tab\.overviewControl': 'Overview & Control'/);
  assert.match(translations, /'admin\.finance\.tab\.overviewControl': 'Ringkasan & Kontrol'/);
});

test('Finance views embed the existing transactional workflows instead of routing users away', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');
  const navigation = await read('src/lib/amsModuleSubnavigation.ts');
  const vendors = await read('src/pages/admin/AdminVendors.tsx');

  assert.match(invoicing, /type EmbeddedFinanceView = 'invoices' \| 'receivables' \| 'income-expenses' \| 'vendor-payments' \| 'quotations'/);
  assert.match(invoicing, /embeddedReceivablesOnly \|\| hasOpenReceivable/);
  assert.match(invoicing, /!embeddedReceivablesOnly && canCreateInvoice && !invoiceSourceBlocked && <button[\s\S]*?onClick=\{openCreateInvoice\}/);
  assert.match(invoicing, /openPayment\(invoice\)/);
  assert.match(invoicing, /embeddedIncomeExpenseMode \|\| 'income'/);
  assert.match(invoicing, /Expense ledger/);
  assert.match(vendors, /export const AdminVendors: React\.FC<\{ embedded\?: boolean; searchTerm\?: string \}>/);
  assert.match(vendors, /!embedded && <AdminModuleHeader/);
  assert.doesNotMatch(vendors, /data-ams-slug="team-mobile-tabs"/);
  assert.match(workspace, /accountsByCode\.values\(\)/);
  assert.match(workspace, /This account code already exists/);
});

test('Finance workbook replaces legacy finance navigation and keeps all operational actions in workbook tabs', async () => {
  const app = await read('src/App.tsx');
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  const sidebar = await read('src/components/admin/DynamicAdminSidebar.tsx');
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');
  const navigation = await read('src/lib/amsModuleSubnavigation.ts');

  assert.ok(app.includes('<Route path="invoicing" element={<LegacyInvoicingRedirect />} />'));
  assert.match(app, /query.get\('finance'\) === 'vendor-payments'/);
  assert.ok(app.includes("'/admin/finance?tab=accounts-payable'"));
  assert.match(app, /const AdminInvoicing = lazyWithRetry/);
  assert.ok(app.includes('<Route path="proposals" element={<LegacyQuotationRedirect />} />'));
  assert.ok(app.includes('<Route path="finance/quotations" element={<ModuleRoute moduleKey="invoicing" moduleLabel="quotations"><AdminInvoicing embeddedView="quotations" /></ModuleRoute>} />'));
  assert.doesNotMatch(layout, /location\.pathname === '\/admin\/invoicing'/);
  assert.doesNotMatch(layout, /isFinanceModuleRoute|ariaLabel="Finance sections"/);
  assert.equal(layout.includes('data-ams-slug="active-module-title"'), false);
  assert.ok(sidebar.includes('aria-label="Primary navigation"'));
  assert.ok(navigation.includes('Finance areas') || navigation.includes("label: 'Overview & Control'"));
  assert.equal(navigation.includes("label: 'Profitability & Expenses'"), false);
  assert.ok(navigation.includes('finance-workspace-receivables-payables'));
  assert.match(navigation, /finance-workspace-accounting-reports/);
  assert.doesNotMatch(layout, /finance=tax-retainers|finance=vendor-payments|finance=financial-reports/);

  const summaryStart = workspace.indexOf('const renderSummary =');
  const summaryEnd = workspace.indexOf('const openVendorContractEditor', summaryStart);
  assert.ok(summaryStart >= 0 && summaryEnd > summaryStart, 'Overview and dashboard render block should remain intact.');
  const summary = workspace.slice(summaryStart, summaryEnd);
  assert.doesNotMatch(summary, /Manage invoices|openLegacyTransactions/);

  assert.match(invoicing, /onClick=\{exportInvoicesCsv\}[\s\S]*?Export CSV/);
  assert.match(invoicing, /onClick=\{exportExpensesCsv\}[\s\S]*?Export CSV/);
  assert.match(invoicing, /finance-revenue-tax-retainer/);
  assert.match(workspace, /AdminInvoicing embeddedView="vendor-payments"/);
  assert.match(invoicing, /Contract-linked vendor payments/);
  assert.match(invoicing, /onClick=\{exportVendorPaymentsCsv\}[\s\S]*?Export CSV/);
});

test('Finance Executive Summary and Dashboard separate company summary from comparable period analysis', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf('const renderSummary = (dashboard: boolean) =>');
  const end = workspace.indexOf('const openVendorContractEditor', start);
  assert.ok(start >= 0 && end > start, 'Summary renderer should remain available.');
  const summary = workspace.slice(start, end);

  assert.match(summary, /const dashboardRange = getReportingPeriodRange\(reportPeriodValue, reportPeriodMode, locale\)/);
  assert.match(summary, /const previousDashboardPeriodValue = getPreviousReportingPeriodValue\(reportPeriodValue, reportPeriodMode\)/);
  assert.match(summary, /const previousDashboardRange = getReportingPeriodRange\(previousDashboardPeriodValue, reportPeriodMode, locale\)/);
  assert.match(summary, /invoicesInPreviousPeriod/);
  assert.match(summary, /movementsInPreviousPeriod/);
  assert.match(summary, /id: 'invoice-value-issued', cells: \['Invoice value issued', formatMoney\(billedInPeriod\), formatMoney\(billedInPreviousPeriod\), formatMoney\(billedInPeriod - billedInPreviousPeriod\)\]/);
  assert.match(summary, /id: 'recorded-cash-in', cells: \['Recorded cash in', formatMoney\(cashInThisPeriod\), formatMoney\(cashInPreviousPeriod\), formatMoney\(cashInThisPeriod - cashInPreviousPeriod\)\]/);
  assert.match(summary, /id: 'recorded-cash-out', cells: \['Recorded cash out', formatMoney\(cashOutThisPeriod\), formatMoney\(cashOutPreviousPeriod\), formatMoney\(cashOutThisPeriod - cashOutPreviousPeriod\)\]/);
  assert.match(summary, /id: 'net-cash-movement-proxy', cells: \['Net cash movement \(proxy\)'/);
  assert.match(summary, /data-ams-slug="finance-dashboard-period"/);
  assert.match(summary, /title="Selected vs previous period"/);
  assert.match(summary, /columns=\{\[\{ label: 'Measure' \}, \{ label: dashboardPeriodLabel, align: 'right' \}, \{ label: previousDashboardPeriodLabel, align: 'right' \}, \{ label: 'Difference', align: 'right' \}\]\}/);
  assert.match(summary, /renderRecentActivity\(dashboardRange \?/);
  assert.doesNotMatch(summary, /finance-dashboard-month-picker|setSelectedMonth/);
  assert.match(summary, /title="Recent invoice register"/);
  assert.match(summary, /\{dashboard \? \([\s\S]*?title="Selected vs previous period"[\s\S]*?\) : \(/);
  assert.doesNotMatch(summary, /dashboardMetrics|AdminMetricStrip metrics=\{dashboardMetrics\}/);
  assert.match(summary, /AdminMetricStrip metrics=\{metrics\}/);
  assert.match(summary, /Net movement is a proxy and is not a reconciled closing cash balance/);
});

test('Finance refresh keeps last successful source records available when a request fails', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');

  assert.match(workspace, /setRegisterRecords\(\(current\) => \{[\s\S]*?if \(result\.error\) return;[\s\S]*?return next;\s*\}\);/);
  assert.match(workspace, /if \(!invoiceSource\.error\) \{[\s\S]*?setInvoices\(nextInvoices\);/);
  assert.match(workspace, /if \(!expenseSource\.error\) \{[\s\S]*?setExpenses\(nextExpenses\);/);
  assert.match(workspace, /if \(!projectSource\.error\) \{\s*setProjects\(/);
  assert.match(workspace, /if \(!vendorSource\.error\) \{\s*setVendors\(/);
  assert.match(workspace, /setRegisterErrors\(workbookResults\.filter\(\(result\) => result\.error\)/);
  assert.match(workspace, /setSourceErrors\(baseResults\.filter\(\(result\) => result\.error\)/);
});


test('Embedded Finance preserves last successful source records and distinguishes failed sources from empty lists', async () => {
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');

  assert.ok(invoicing.includes('const [sourceErrors, setSourceErrors] = useState<string[]>([])'));
  assert.ok(invoicing.includes('const nextInvoices = invoiceSourceAvailable ? apiInvoices : invoices;'));
  assert.ok(invoicing.includes('const nextExpenses = expenseSourceAvailable ? apiExpenses : expenses;'));
  assert.ok(invoicing.includes('const sourceFailures = ['));
  assert.ok(invoicing.includes('const invoiceSourceBlocked = loading || refreshing || invoiceSourceUnavailable;'));
  assert.ok(!invoicing.includes('setError(null);\n    setSourceErrors([]);'));
  assert.ok(invoicing.includes('`Invoices: ${message}`'));
  assert.ok(invoicing.includes("loading || refreshing ? 'Loading invoices…' : invoiceSourceUnavailable ? 'Invoice data unavailable'"));
  assert.ok(invoicing.includes('Some Finance data sources could not be loaded. Displayed records and totals may be incomplete.'));
  assert.ok(invoicing.includes('if (!metricsSourceAvailable && invoiceSourceAvailable && expenseSourceAvailable) {'));
  assert.doesNotMatch(invoicing, /shouldUseDemoInvoices|shouldUseDemoExpenses|demoInvoices|demoExpenses|usingDemo|slugDataMode/);
  assert.ok(invoicing.includes('} else if (metricsRes.success && metricsRes.data?.metrics) {'));
  assert.ok(invoicing.includes("invoiceSourceUnavailable ? 'Invoice data unavailable' : embeddedReceivablesOnly"));
  assert.ok(invoicing.includes('!invoiceSourceBlocked && canManageInvoices && !embeddedReceivablesOnly'));
  assert.ok(invoicing.includes("expenseSourceUnavailable ? 'Expense data unavailable' : 'No expenses found'"));
  assert.ok(invoicing.includes("showNotice('danger', sourceUnavailableMessage('invoice'));"));
  assert.ok(invoicing.includes("showNotice('danger', sourceUnavailableMessage('expense'));"));
  assert.ok(invoicing.includes('disabled={invoiceSourceBlocked || !filteredInvoices.length}'));
  assert.ok(invoicing.includes('disabled={expenseSourceBlocked || !filteredExpenses.length}'));
  assert.ok(invoicing.includes('disabled={expenseSourceBlocked || vendorSourceBlocked || !filteredVendorPayments.length}'));
});

test('Annual Summary includes years represented only by Cash & Bank records', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf("case 'annual-summary': {");
  const end = workspace.indexOf('\n      default:', start);
  assert.ok(start >= 0 && end > start);
  const annual = workspace.slice(start, end);
  assert.match(annual, /const buildAnnualSnapshot = \(year: string\) => \{[\s\S]*?const yearCollections = cashMovements\.filter\(\(movement\) => movement\.currency === 'IDR'[\s\S]*?movement\.source !== 'Internal transfer'[\s\S]*?getYearKey\(movement\.date\) === year\)/);
  assert.match(annual, /buildAnnualSnapshot\(selectedYear\)/);
  assert.match(annual, /buildAnnualSnapshot\(previousYear\)/);
});

test('Operational Budget distinguishes expense-source failure from a valid zero actual', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  assert.match(workspace, /const \[hasSuccessfulExpenseSource, setHasSuccessfulExpenseSource\] = useState\(false\)/);
  assert.match(workspace, /setExpenses\(nextExpenses\);\s*setHasSuccessfulExpenseSource\(true\)/);
  const start = workspace.indexOf("case 'operational-budget': {");
  const end = workspace.indexOf("case 'petty-cash': {", start);
  assert.ok(start >= 0 && end > start, 'Operational Budget worksheet should be available.');
  const budget = workspace.slice(start, end);
  assert.match(budget, /sourceErrors\.some\(\(error\) => error\.startsWith\('Expenses:'\)\)/);
  assert.match(budget, /Stale actual · refresh required/);
  assert.match(budget, /Actuals unavailable/);
  assert.match(budget, /Budget variance unavailable/);
  assert.match(budget, /Variance unavailable · stale source/);
  assert.match(budget, /No successful expense source has loaded/);
  assert.match(budget, /Expense source refresh failed/);
  assert.match(budget, /onClick=\{\(\) => void loadData\(true\)\} disabled=\{refreshing\}/);
  assert.match(budget, /formatMoney\(item\.budget-item\.actual\)/);
  assert.match(budget, /expenseSourceBlocked\s*\?\s*hasSuccessfulExpenseSource\s*\?/);
});

test('Team Fee distinguishes allocation and expense source failures from valid empty registers', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf("case 'team-fee': {");
  const end = workspace.indexOf("case 'balance-sheet':", start);
  assert.ok(start >= 0 && end > start, 'Team Fee worksheet should be available.');
  const fee = workspace.slice(start, end);
  assert.match(fee, /registerErrors\.some\(\(error\) => error\.startsWith\('Finance register team-fee:'\)\)/);
  assert.match(fee, /Object\.prototype\.hasOwnProperty\.call\(registerRecords,'team-fee'\)/);
  assert.match(fee, /sourceErrors\.some\(\(error\) => error\.startsWith\('Expenses:'\)\)/);
  assert.match(fee, /hasSuccessfulExpenseSource \? 'Expense source data is stale/);
  assert.match(fee, /No successful Team Fee allocation response has loaded/);
  assert.match(fee, /No successful expense source has loaded/);
  assert.match(fee, /onClick=\{\(\) => void loadData\(true\)\} disabled=\{refreshing\}/);
  assert.match(fee, /emptyMessage=\{teamFeeSourceBlocked \? hasSuccessfulTeamFeeSource/);
  assert.match(fee, /emptyMessage=\{expenseSourceBlocked \? hasSuccessfulExpenseSource/);
  assert.match(fee, /Period filtering for member milestones uses due date/);
  assert.match(fee, /paid date is informational/);
});

test('Project Allocation explains defaults and displays the saved percentage per record', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf("case 'project-allocation': {");
  const end = workspace.indexOf("case 'team-fee': {", start);
  assert.ok(start >= 0 && end > start);
  const allocation = workspace.slice(start, end);
  assert.match(allocation, /label:'Default petty cash reserve'[\s\S]*?context:'For new allocations'/);
  assert.match(allocation, /record\.payload\.pettyCashPercent == null \? null : Number\(record\.payload\.pettyCashPercent\)/);
  assert.match(allocation, /record\.payload\.emergencyPercent == null \? null : Number\(record\.payload\.emergencyPercent\)/);
  assert.match(allocation, /record\.payload\.teamRewardPercent == null \? null : Number\(record\.payload\.teamRewardPercent\)/);
  assert.match(allocation, /percent === null \? 'Share not recorded' : percent \+ '% of net profit'/);
  assert.match(allocation, /The default split above applies only to new records/);
  assert.match(allocation, /Current saved allocation records do not include an effective month or quarter/);
  assert.match(allocation, /not historical per-period snapshots/);
  assert.doesNotMatch(allocation, /matchesDate\(record\.payload\.effectivePeriod/);
});

test('Embedded invoice, expense, and receivable workflows do not leak UI state across worksheets', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const vendors = await read('src/pages/admin/AdminVendors.tsx');

  assert.match(workspace, /case 'revenue':[\s\S]{0,100}key=\{tab\.key\} embeddedView="invoices"/);
  assert.match(workspace, /case 'expenses':[\s\S]{0,150}key=\{tab\.key\} embeddedView="income-expenses"/);
  assert.match(workspace, /case 'accounts-receivable':[\s\S]{0,120}key=\{tab\.key\} embeddedView="receivables"/);
  assert.match(vendors, /\{!embedded && \([\s\S]{0,180}<AdminModuleHeader/);
  assert.match(vendors, /\{embedded && <button type="button" onClick=\{handleOpenAdd\}/);
  const filters = vendors.indexOf('aria-label="Vendor directory controls"');
  const registerHeader = vendors.indexOf('data-ams-feature-slug="vendor-directory-register-header"');
  const directory = vendors.indexOf('data-ams-feature-slug="vendor-directory-list"');
  assert.ok(filters >= 0 && registerHeader > filters && directory > registerHeader);
  assert.doesNotMatch(vendors, /vendor-snapshot|vendor-kpis/);
});

test('Vendor contract editor protects unsaved changes on close and cancel', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  assert.match(workspace, /vendorContractDirty/);
  assert.match(workspace, /kind: 'discard-vendor-contract'/);
  assert.match(workspace, /Vendor contract changes have not been saved/);
  assert.match(workspace, /if \(vendorContractDirty\) setPendingConfirmation\(\{ kind: 'discard-vendor-contract' \}\)/);
});

test('Finance drawer uses the shared drawer header once and keeps source errors actionable', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf('const renderRegisterEditor = () =>');
  const end = workspace.indexOf('const navigationRole = getAmsRole', start);
  assert.ok(start >= 0 && end > start);
  const drawer = workspace.slice(start, end);

  assert.match(drawer, /title=\{editor\.record \? 'Edit ' \+ definition\.title : definition\.title\}/);
  assert.match(drawer, /description=\{definition\.description\}/);
  assert.doesNotMatch(drawer, /<h3 className="text-sm font-semibold text-fg">\{definition\.title\}<\/h3>/);
  assert.doesNotMatch(drawer, /<p className="text-xs leading-5 text-muted">\{definition\.description\}<\/p>/);
  assert.match(workspace, /Previously loaded records remain visible where available\. Treat affected data as stale until the source refreshes successfully\./);
});


test('Finance add and record-creation actions use the red primary button style', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  assert.match(workspace, /const registerAddButton[\s\S]*?<Button variant="primary" type="button" icon=\{<Plus size=\{14\} \/>\}/);
  assert.match(workspace, /variant="primary" type="button" icon=\{<Plus size=\{14\} \/>\} onClick=\{\(\) => openVendorContractEditor\(\)\}>Add contract/);
  assert.match(workspace, /variant="primary" type="button" icon=\{<Plus size=\{14\} \/>\}[\s\S]{0,260}>Record payment/);
  assert.match(workspace, /variant="primary" type="button" icon=\{<Plus size=\{14\} \/>\}[\s\S]{0,260}>Set budget/);
  assert.match(workspace, /variant="primary" type="button" icon=\{<Plus size=\{14\} \/>\}[\s\S]{0,260}>Create control/);
});


test('Finance date and month inputs use the shared custom calendar control', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');
  const picker = await read('src/components/ui/CustomDatePicker.tsx');
  const reportBar = await read('src/components/admin/AdminReportingPeriodBar.tsx');

  assert.match(workspace, /import \{ CustomDatePicker \} from '\.\.\/\.\.\/components\/ui\/CustomDatePicker'/);
  assert.match(reportBar, /slug="global-reporting-period-picker"/);
  assert.match(workspace, /field\.type === 'date' \|\| field\.type === 'month'[\s\S]*?<CustomDatePicker/);
  assert.doesNotMatch(workspace, /slug="finance-dashboard-month-picker"/);
  assert.doesNotMatch(workspace, /CustomReportPeriodPicker|finance-pnl-report-period-picker|finance-cash-flow-report-period-picker/);
  assert.doesNotMatch(workspace, /<AdminPanel title="Reporting period"/);
  assert.match(workspace, /slug="finance-closing-month-picker"/);
  assert.match(workspace, /const selectedYear = String\(Number\(reportPeriodValue\.slice\(0, 4\)\) \|\| new Date\(\)\.getFullYear\(\)\)/);
  assert.match(workspace, /data-ams-slug="finance-annual-summary-period"/);
  assert.match(workspace, /slug="finance-vendor-contract-start"/);
  assert.match(workspace, /slug="finance-vendor-contract-end"/);
  assert.doesNotMatch(workspace, /<input type="(?:date|month)"/);
  assert.ok(invoicing.includes("import { CustomDatePicker } from '../../components/ui/CustomDatePicker';"));
  for (const id of ['finance-quotation-valid-until', 'vendor-payment-date', 'finance-issue-date', 'finance-due-date', 'finance-expense-date', 'finance-payment-date']) {
    assert.match(invoicing, new RegExp('<CustomDatePicker id="' + id + '"'));
  }
  assert.doesNotMatch(invoicing, /<input id="[^"]+"[^>]*type="date"/);
  assert.match(workspace, /const missingRequired = definition\?\.fields\.find/);
  assert.match(workspace, /Due date cannot be earlier than the bill date/);
  assert.match(picker, /from '\.\/DropdownPortal'/);
  assert.match(picker, /CalendarDays/);
  assert.match(picker, /aria-expanded=\{isOpen\}/);
  assert.match(picker, /event\.key === 'ArrowLeft'/);
  assert.match(picker, /isMonthDisabled/);
  assert.match(picker, /aria-label="Choose year"/);
  assert.match(picker, /showYearPicker \? 'Previous 12 years'/);
  assert.match(picker, /const monthRefs = useRef/);
  assert.match(picker, /setActiveDate\(toLocalIsoDate\(active\)\)/);
  assert.match(picker, /dayRefs\.current\.get\(toLocalIsoDate\(active\)\)\?\.focus\(\)/);
  const reportingPeriods = await read('src/lib/reportingPeriods.ts');
  const periodPicker = await read('src/components/ui/CustomReportPeriodPicker.tsx');
  assert.match(periodPicker, /This month/);
  assert.match(periodPicker, /Last month/);
  assert.match(periodPicker, /This quarter/);
  assert.match(periodPicker, /Last quarter/);
  assert.match(periodPicker, /Reporting year/);
  assert.match(reportingPeriods, /export const getPreviousReportingPeriodValue/);
  assert.match(reportingPeriods, /export const getReportingPeriodRange/);
});

test('Finance registers provide sortable headers, usable pagination, and CSV export for the full sorted result', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');

  assert.match(workspace, /const compareFinanceSortText = \(left: string, right: string\)/);
  assert.match(workspace, /aria-sort=\{isSorted \? \(sort\?\.direction === 'asc' \? 'ascending' : 'descending'\) : 'none'\}/);
  assert.match(workspace, /Rows per page for ' \+ title/);
  assert.match(workspace, /<AdminTablePagination/);
  assert.match(workspace, /page=\{currentPage \+ 1\}/);
  assert.match(workspace, /onPageChange=\{\(nextPage\) => setPage\(nextPage - 1\)\}/);
  assert.match(workspace, /pageSizeAriaLabel=\{'Rows per page for ' \+ title\}/);
  assert.match(workspace, /const exportRows = \(\) =>/);
  assert.match(workspace, /const exportableRows = sortedRows\.map/);
  assert.match(workspace, /exportable = true/);
  assert.match(workspace, /exportable=\{false\} actions=\{<Button variant="secondary" type="button" icon=\{<Download size=\{14\}/);
});

test('Journal mapping matches the implemented accrual accounting workflow', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf("case 'journal': {");
  const end = workspace.indexOf("case 'annual-summary': {", start);
  assert.ok(start >= 0 && end > start);
  const journal = workspace.slice(start, end);

  assert.match(journal, /id:'invoice-issued',cells:\['Invoice issued','1300 · Accounts Receivable','4000 · Project Revenue; 2100 · Tax Payable when taxable'/);
  assert.match(journal, /id:'receipt',cells:\['Client receipt','1000 · Cash & Bank \/ 1010 · Card Clearing \/ 1100 · Petty Cash','1300 · Accounts Receivable'/);
  assert.match(journal, /id:'expense-accrual',cells:\['Expense recognition'[\s\S]*?'2000 · Accounts Payable'/);
  assert.match(journal, /id:'expense-payment',cells:\['Expense settlement','2000 · Accounts Payable'[\s\S]*?2200 · Verified settlement account/);
  assert.match(journal, /id:'vendor-bill',cells:\['Vendor bill issued'[\s\S]*?'2000 · Accounts Payable'/);
  assert.match(journal, /id:'vendor-payment',cells:\['Vendor bill payment','2000 · Accounts Payable'/);
  assert.doesNotMatch(journal, /Client receipt','1000 · Cash & Bank','4000 · Project Revenue/);
  assert.doesNotMatch(journal, /Not generated by this sync; use linked bill\/payment evidence/);
});

test('Vendor payment drawer requires a settlement account only for Other payment method', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  assert.match(
    workspace,
    /\{key:'settlementAccountCode',label:'Settlement account',type:'select',required:true,optionSource:'accounts',visibleWhen:\{key:'method',values:\['other'\]\}/
  );
  assert.match(
    workspace,
    /field\.required[\s\S]*?field\.visibleWhen\.values\.includes\(String\(editor\.payload\[field\.visibleWhen\.key\] \|\| ''\)\)/
  );
});

test('New vendor payments only offer bills with balances and preserve the selected bill while editing', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf("if (field.optionSource === 'vendorBills')");
  const end = workspace.indexOf('const changeRegisterField =', start);
  assert.ok(start >= 0 && end > start);
  const options = workspace.slice(start, end);
  assert.match(options, /const currentBillId = editor\?\.type === 'vendor-bill-payment' \? String\(editor\.record\?\.payload\.billId \|\| ''\) : ''/);
  assert.match(options, /const payableBills = bills\.filter\(/);
  assert.match(options, /Number\(bill\.payload\.outstanding \?\? bill\.payload\.total\) \|\| 0\) > 0\.01/);
  assert.match(options, /\|\| bill\.id === currentBillId/);
  assert.match(options, /No outstanding vendor bills/);
});


test('Finance document templates are available inside the existing five-group workspace', async () => {
  const workbook = await read('src/lib/financeWorkbook.ts');
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');
  const templates = await read('src/lib/financeDocumentTemplates.ts');
  const groups = workbook.slice(0, workbook.indexOf('export interface ExcelChartAccount'));

  assert.equal((groups.match(/\n    key: '(?:overview|transactions|receivables|projects|accounting)'/g) || []).length, 5);
  assert.match(groups, /key: 'receivables',[\s\S]*?key: 'accounts-receivable'/);
  assert.doesNotMatch(groups, /key: 'quotations', sheet: '03A'/);
  assert.ok(workspace.includes('const quotationsViewTab: FinanceWorkbookTab = {'));
  assert.match(workspace, /if \(tab\.key === 'quotations'\)[\s\S]{0,180}embeddedView="quotations"/);
  assert.ok(workspace.includes("slug: 'finance-view-quotations'"));
  assert.ok(invoicing.includes('FINANCE_INVOICE_TEMPLATES'));
  assert.ok(invoicing.includes('FINANCE_QUOTATION_TEMPLATES'));
  assert.ok(invoicing.includes('data-ams-feature-slug="finance-invoice-template-picker"'));
  assert.ok(invoicing.includes('data-ams-feature-slug="finance-quotation-template-picker"'));
  assert.ok(invoicing.includes('const printInvoiceDraft = () => {'));
  assert.ok(invoicing.includes('const printQuotationDraft = () => {'));
  assert.ok(invoicing.includes('const printSavedQuotation = (quotation: FinanceQuotation) => {'));
  assert.ok(templates.includes('const escapeHtml ='));
  assert.ok(templates.includes('document.write(html)'));
});

test('Finance reconciles uncertain transaction mutations before duplicate-prone retries', async () => {
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');

  for (const behavior of [
    'const isUnknownFinanceMutationOutcome = (response: { success: boolean; status?: number }) =>',
    'Previously loaded quotations are kept.',
    'The invoice save result could not be confirmed.',
    'The payment form and idempotency key are preserved.',
    'The payment form and idempotency ID are preserved.',
    'The form and idempotency key are preserved.',
    'Quotation save result could not be confirmed.',
    'Quotation status result could not be confirmed.',
    'Quotation deletion result could not be confirmed.',
    'Invoice and quotation sources were refreshed.',
    'The idempotency key is preserved. Inspect the vendor payment list before changing or resubmitting this payment.'
  ]) {
    assert.ok(invoicing.includes(behavior), 'Finance is missing unknown-outcome handling: ' + behavior);
  }

  assert.ok(invoicing.includes('await Promise.all([loadData(true), loadQuotations()])'));
  assert.ok(invoicing.includes('vendorPaymentIdempotencyKey'));
  assert.ok(invoicing.includes('expenseIdempotencyKey'));
});

test('JSON fallback enforces the same invoice and expense idempotency keys as PostgreSQL', async () => {
  const routes = await read('server/routes.ts');
  const invoicePayStart = routes.indexOf("apiRouter.post('/finance/invoices/:id/pay'");
  const invoicePayEnd = routes.indexOf("apiRouter.post('/finance/invoices',", invoicePayStart);
  const invoicePay = routes.slice(invoicePayStart, invoicePayEnd > invoicePayStart ? invoicePayEnd : invoicePayStart + 9000);
  const expenseStart = routes.indexOf("apiRouter.post('/finance/expenses',");
  const expenseEnd = routes.indexOf("apiRouter.post('/finance/expenses/:id/payments'", expenseStart);
  const expenseCreate = routes.slice(expenseStart, expenseEnd);

  assert.ok(invoicePayStart >= 0);
  assert.ok(invoicePay.includes("String(payment.idempotencyKey || '') === idempotencyKey"));
  assert.ok(invoicePay.includes("IDEMPOTENCY_KEY_REUSE_CONFLICT"));
  assert.ok(invoicePay.includes("replayed: true"));
  assert.ok(invoicePay.indexOf('const existingPayment = payments.find') < invoicePay.indexOf("if (invoice.status === 'cancelled')"));
  assert.ok(expenseStart >= 0 && expenseEnd > expenseStart);
  assert.ok(expenseCreate.includes('buildExpenseIdempotencyFingerprint'));
  assert.ok(expenseCreate.includes('metadata.requestFingerprint'));
  assert.ok(expenseCreate.includes('EXPENSE_IDEMPOTENCY_KEY_REUSE_CONFLICT'));
  assert.ok(expenseCreate.includes('replayed:true'));
});


test('Cash, petty cash, and payables put their working registers before supporting KPI strips', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');

  const cashStart = workspace.indexOf("case 'cash-bank': {");
  const cashEnd = workspace.indexOf("case 'accounts-receivable':", cashStart);
  const cash = workspace.slice(cashStart, cashEnd);
  assert.ok(cashStart >= 0 && cashEnd > cashStart);
  assert.ok(cash.indexOf('title="Cash & Bank ledger"') >= 0);
  assert.ok(cash.indexOf('<AdminMetricStrip metrics={[') > cash.indexOf('title="Cash & Bank ledger"'));

  const payableStart = workspace.indexOf("case 'accounts-payable': {");
  const payableEnd = workspace.indexOf("case 'vendors':", payableStart);
  const payables = workspace.slice(payableStart, payableEnd);
  assert.ok(payableStart >= 0 && payableEnd > payableStart);
  const payableRegister = payables.indexOf('title="Accounts Payable register"');
  const payableSchedule = payables.indexOf('title="Vendor payment schedule"');
  const payableMetrics = payables.indexOf('<AdminMetricStrip metrics={[');
  assert.ok(payableRegister >= 0 && payableSchedule > payableRegister && payableMetrics > payableSchedule,
    'The payable register and linked installment schedule must precede summary metrics.');

  const pettyStart = workspace.indexOf("case 'petty-cash':");
  const pettyEnd = workspace.indexOf("case 'monthly-pnl':", pettyStart);
  const petty = workspace.slice(pettyStart, pettyEnd);
  assert.ok(pettyStart >= 0 && pettyEnd > pettyStart);
  const pettyRegister = petty.indexOf('title="Petty Cash Ledger"');
  const pettyReconciliationHandoff = petty.indexOf('title="Reconciliation evidence is managed in Cash & Bank"');
  const pettyMetrics = petty.indexOf('<AdminMetricStrip metrics={[');
  assert.ok(pettyRegister >= 0 && pettyReconciliationHandoff > pettyRegister && pettyMetrics > pettyReconciliationHandoff,
    'Petty Cash should present its canonical reconciliation handoff after the ledger and before supporting metrics.');
  assert.match(petty, /navigate\('\/admin\/finance\?tab=cash-bank'\)/);
  assert.match(petty, /account 1100 reconciliation record/);
  assert.doesNotMatch(petty, /openRegisterForm\('cash-reconciliation'/,
    'Petty Cash must not create a duplicate reconciliation workflow.');
});


test('Accounts Payable and vendor payment schedule use compact cards for dense registers', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const apStart = workspace.indexOf("case 'accounts-payable': {");
  const apEnd = workspace.indexOf("case 'vendors':", apStart);
  assert.ok(apStart >= 0 && apEnd > apStart, 'Accounts Payable worksheet should be present.');
  const ap = workspace.slice(apStart, apEnd);
  const billRegister = ap.indexOf('title="Accounts Payable register"');
  const billMetrics = ap.indexOf('<AdminMetricStrip metrics={[', billRegister);
  const schedule = ap.indexOf('title="Vendor payment schedule"');
  const contractLinkedNote = ap.indexOf('title="Contract-linked vendor payments"');

  assert.ok(billRegister >= 0 && schedule > billRegister && billMetrics > schedule,
    'The primary payable register and installment schedule should precede supporting metrics.');
  assert.ok(contractLinkedNote > schedule, 'The contract-payment clarification must remain after the bill schedule.');
  assert.match(ap, /actions=\{registerAddButton\('vendor-bill','Add vendor bill'\)\}[\s\S]*?compactCardLayout=\{\{titleIndex:0,subtitleIndexes:\[1,2\],statusIndexes:\[8\]/);
  assert.match(ap, /label:'Bill details',indexes:\[3,4,5,6,7\]/);
  assert.match(ap, /actionIndex:9\}\}/);
  assert.match(ap, /emptyMessage="No vendor bills have been entered\. Create a bill to see its payment schedule\."[\s\S]*?compactCardLayout=\{\{titleIndex:0,subtitleIndexes:\[1,2\],statusIndexes:\[10\]/);
  assert.match(ap, /label:'Installments',indexes:\[4,5,6\]/);
  assert.match(ap, /label:'Settlement',indexes:\[7,8,9\]/);
  assert.match(ap, /getVendorBillInstallmentSchedule/);
  assert.match(ap, /registerRecordActions\('vendor-bill',record/);
});

test('Embedded invoice registers lead supporting summaries and receivables aging stays source-backed', async () => {
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');
  const pagination = invoicing.indexOf('slug="finance-invoices-pagination"');
  const embeddedSummary = invoicing.indexOf('{embedded && invoiceSummary}', pagination);
  const agingView = invoicing.indexOf('data-ams-slug="finance-receivables-aging"', pagination);
  assert.ok(invoicing.includes('const invoiceSummary = embeddedReceivablesOnly ? null : ('));
  assert.ok(invoicing.includes('{!embedded && invoiceSummary}'));
  assert.ok(pagination >= 0 && embeddedSummary > pagination && agingView > embeddedSummary,
    'The actionable invoice register must precede supporting summary and aging views.');

  const invoiceList = invoicing.indexOf('<div className="overflow-x-auto custom-scrollbar">{filteredInvoices.length===0?');
  const invoiceTableStart = invoicing.indexOf('<table className="ams-finance-table min-w-[1120px] table-fixed border-separate border-spacing-0 text-xs">', invoiceList);
  const invoiceTableEnd = invoicing.indexOf('</table>', invoiceTableStart);
  const invoiceTable = invoicing.slice(invoiceTableStart, invoiceTableEnd);
  assert.ok(invoiceList >= 0 && invoiceTableStart > invoiceList && invoiceTableEnd > invoiceTableStart,
    'The primary invoice register must provide a contained horizontal scroll region on narrow screens.');
  assert.ok(invoiceTable.includes('>Invoice</th>'));
  assert.ok(invoiceTable.includes('Client & project'));
  assert.ok(invoiceTable.includes('>Issued</th>') && invoiceTable.includes('>Due</th>'));
  assert.ok(invoiceTable.includes('>Total</th>') && invoiceTable.includes('>Balance</th>'));
  assert.ok(invoiceTable.includes('>Status</th>') && invoiceTable.includes('>Actions</th>'));
  assert.match(invoicing, /currencyInvoices\s+\.filter\(\(invoice\) => !\['draft', 'cancelled'\]\.includes\(invoice\.status\)\)/);
  assert.match(invoicing, /label: 'Due date missing or invalid'/);
  assert.match(invoicing, /balance <= 0\.009/);
  assert.match(invoicing, /data-ams-feature-slug="finance-receivables-aging"/);
  assert.match(invoicing, /Current includes items due today or later/);
  assert.match(invoicing, /Values follow the selected \{currency\} currency and are independent of the register search and due-date filters/);
  assert.match(invoicing, /invoiceSourceBlocked \? \([\s\S]*?Receivables aging unavailable[\s\S]*?Refreshing receivables aging/);
  assert.match(invoicing, /Retry invoice source/);
  assert.match(invoicing, /bucket\.percent\.toFixed\(1\)/);
  assert.match(invoicing, /No open receivable balances/);
});

test('Accounts Receivable aging does not classify invalid due dates as current', async () => {
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');
  const start = invoicing.indexOf('const agingBuckets = useMemo');
  const end = invoicing.indexOf('const receivableAgingTotals', start);
  assert.ok(start >= 0 && end > start, 'Aging bucket derivation should be isolated.');
  const derivation = invoicing.slice(start, end);
  assert.match(derivation, /const dueParts = \/\^/);
  assert.match(derivation, /due\.getFullYear\(\) === Number\(dueParts\[1\]\)/);
  assert.match(derivation, /bucket = buckets\[5\]/);
  assert.match(derivation, /const total = buckets\.reduce/);
  assert.match(derivation, /percent: total > 0 \? Math\.round\(\(bucket\.amount \/ total\) \* 1000\) \/ 10 : 0/);
});


test('Petty Cash delegates statement evidence to the canonical Cash & Bank reconciliation workspace', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf("case 'petty-cash':");
  const end = workspace.indexOf("case 'monthly-pnl':", start);
  assert.ok(start >= 0 && end > start, 'Petty Cash worksheet should be available.');
  const petty = workspace.slice(start, end);
  const register = petty.indexOf('title="Petty Cash Ledger"');
  const handoff = petty.indexOf('title="Reconciliation evidence is managed in Cash & Bank"');
  assert.ok(register >= 0 && handoff > register);
  assert.match(petty, /Open Cash &amp; Bank reconciliation/);
  assert.match(petty, /A petty-cash opening balance or posted voucher does not prove the physical cash count was reconciled/);
  assert.doesNotMatch(petty, /openRegisterForm\('cash-reconciliation'/);
});


test('Monthly Closing separates checklist completion from authoritative source validation', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf("case 'monthly-closing': {");
  const end = workspace.indexOf("case 'project-allocation':", start);
  assert.ok(start >= 0 && end > start, 'Monthly Closing worksheet should be present.');
  const closing = workspace.slice(start, end);
  const periodPanel = closing.indexOf('title="Closing period"');
  const preflightPanel = closing.indexOf('title="Final close validation"');
  const checklist = closing.indexOf('title="Monthly closing checklist"');
  assert.ok(periodPanel >= 0 && preflightPanel > periodPanel && checklist > preflightPanel,
    'Period selection, final source gates and checklist should be separate workspace layers.');
  assert.match(closing, /Checklist completion is necessary, but it is not final close readiness/);
  assert.match(closing, /The server performs the final checks when you request closure/);
  assert.match(closing, /no unresolved source-journal exceptions or period drafts/);
  assert.match(closing, /month-end statement or count evidence that matches the posted General Ledger/);
  assert.match(closing, /tab: 'journal'/);
  assert.match(closing, /tab: 'cash-bank'/);
  assert.match(closing, /navigate\('\/admin\/finance\?tab=' \+ review\.tab\)/);
  assert.match(closing, /Review Journal/);
  assert.match(closing, /Review Cash & Bank/);
  assert.match(closing, /This workspace does not guess a separate readiness score/);
  assert.match(closing, /disabled=\{locked\|\|completed!==WORKBOOK_CLOSING_ITEMS\.length\|\|registerSaving\}/);
});


test('Journal prioritizes the source posting queue and links account mapping to Chart of Accounts', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf("case 'journal': {");
  const end = workspace.indexOf("case 'annual-summary': {", start);
  assert.ok(start >= 0 && end > start, 'Journal worksheet should be present.');
  const journal = workspace.slice(start, end);
  const queueStart = journal.indexOf('title="Source transaction posting queue"');
  const registerStart = journal.indexOf('title="General Journal"');
  const mappingStart = journal.indexOf('title="Journal account mapping"');
  assert.ok(queueStart >= 0 && registerStart > queueStart && mappingStart > registerStart,
    'Source review queue should lead, followed by canonical journal register and reference mapping.');
  const queue = journal.slice(queueStart, registerStart);
  const register = journal.slice(registerStart, mappingStart);
  assert.match(queue, /Generate source drafts/);
  assert.match(queue, /syncSourceJournalDrafts/);
  assert.match(register, /registerAddButton\('journal-entry','Add journal entry'\)/);
  assert.doesNotMatch(register, /Generate source drafts/,
    'Source draft generation should be attached to the queue it populates.');
  assert.match(mappingStart >= 0 ? journal.slice(mappingStart) : '', /Review Chart of Accounts/);
  assert.match(journal, /navigate\('\/admin\/finance\?tab=chart-of-accounts'\)/);
});


test('Balance Sheet presents formal Assets, Liabilities, and Equity subtotals from posted ledger totals', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf("case 'balance-sheet': {");
  const end = workspace.indexOf("case 'journal': {", start);
  assert.ok(start >= 0 && end > start, 'Balance Sheet worksheet should be present.');
  const balanceSheet = workspace.slice(start, end);
  const assetsSubtotal = balanceSheet.indexOf("id: 'assets-total'");
  const liabilitiesSubtotal = balanceSheet.indexOf("id: 'liabilities-total'");
  const currentEarnings = balanceSheet.indexOf("id: 'equity-current-earnings'");
  const equitySubtotal = balanceSheet.indexOf("id: 'equity-total'");
  assert.ok(assetsSubtotal >= 0 && liabilitiesSubtotal > assetsSubtotal && currentEarnings > liabilitiesSubtotal && equitySubtotal > currentEarnings,
    'Formal statement order must group Assets, Liabilities, and Equity with current earnings before total equity.');
  assert.match(balanceSheet, /Total assets[\s\S]*?formatMoney\(totalAssets\)/);
  assert.match(balanceSheet, /Total liabilities[\s\S]*?formatMoney\(totalLiabilities\)/);
  assert.match(balanceSheet, /Total equity incl\. current earnings[\s\S]*?formatMoney\(totalEquity\)/);
  assert.match(balanceSheet, /const postedJournals = getRegisterRecords\('journal-entry'\)\.filter\(\(record\) => \{[\s\S]*?record\.status !== 'posted'/);
  assert.match(balanceSheet, /Assets, Liabilities and Equity[\s\S]*?with section subtotals/);
  assert.match(balanceSheet, /sourceExceptionCount/);
  assert.match(balanceSheet, /openingOffset/);
});
