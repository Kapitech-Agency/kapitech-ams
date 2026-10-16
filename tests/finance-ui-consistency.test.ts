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
  assert.doesNotMatch(layout, /<AdminTopbarTabs/);
  assert.doesNotMatch(layout, /active-module-title|aria-label="Current module"/);
  assert.match(layout, /ariaLabel="Workspace navigation"/);
  assert.match(sidebar, /data-ams-navigation-layout="flat"/);
  assert.doesNotMatch(sidebar, /data-ams-nav-submenu|aria-expanded=|ChevronDown/);
  const subnavigation = await read('src/lib/amsModuleSubnavigation.ts');
  assert.match(navigation, /key: 'finance', label: 'Finance', to: '\/admin\/finance\?tab=executive-summary'/);
  assert.doesNotMatch(subnavigation, /Invoicing & Revenues|Profitability & Expenses|Project Profitability/);
  for (const area of ['Overview & Control', 'Transactions & Cash', 'Receivables & Payables', 'Project Finance', 'Accounting & Reports']) {
    assert.ok(workbook.includes("label: '" + area + "'"), 'Missing Finance group ' + area);
  }
  assert.match(workspace, /FINANCE_WORKBOOK_GROUPS/);
  assert.match(workspace, /ariaLabel="Finance areas"/);
  assert.match(workspace, /finance-tab-overview-control/);
  assert.match(workspace, /finance-tab-transactions-cash/);
  assert.match(workspace, /finance-tab-receivables-payables/);
  assert.match(workspace, /finance-tab-project-finance/);
  assert.match(workspace, /finance-tab-accounting-reports/);
  assert.match(workspace, /AdminSectionTabs ariaLabel="Finance worksheets" activeKey=\{activeTab\.key\} items=\{sheetItems\} className="w-full"/);
  assert.match(workspace, /data-ams-slug="finance-workspace-navigation"/);
  assert.match(workspace, /data-ams-slug="finance-active-worksheet"/);
  assert.match(workspace, /const sheetItems = activeGroup\.items[\s\S]{0,180}canShowFinanceWorksheet\(item\.key\)/);
  assert.match(workspace, /label: item\.label/);
  assert.doesNotMatch(workspace, /label: item\.sheet \+ ' ' \+ item\.label/);
  assert.match(workspace, /\{loading \? renderLoading\(\) : renderView\(activeTab\)\}/);
  assert.match(workbook, /FINANCE_WORKBOOK_GROUPS/);
  assert.ok(workbook.includes('cash-bank') && workbook.includes('accounts-receivable'));
});
test('Finance workspace groups navigation, search, and alerts using the shared AMS layout patterns', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');

  assert.match(workspace, /<div className="flex min-w-0 justify-start sm:justify-end" data-ams-slug="finance-worksheet-search">/);
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
  assert.match(workspace, /!sidebarDestinations\.has\(destination\)/);
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

test('Finance worksheets embed the existing transactional workflows instead of routing users away', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');
  const vendors = await read('src/pages/admin/AdminVendors.tsx');

  assert.match(invoicing, /type EmbeddedFinanceView = 'invoices' \| 'receivables' \| 'income-expenses' \| 'vendor-payments' \| 'quotations'/);
  assert.match(invoicing, /embeddedReceivablesOnly \|\| hasOpenReceivable/);
  assert.match(invoicing, /!embeddedReceivablesOnly && canCreateInvoice && <button[\s\S]*?onClick=\{openCreateInvoice\}/);
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
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');

  assert.ok(app.includes('<Route path="invoicing" element={<LegacyInvoicingRedirect />} />'));
  assert.match(app, /query.get\('finance'\) === 'vendor-payments'/);
  assert.ok(app.includes("'/admin/finance?tab=accounts-payable'"));
  assert.match(app, /const AdminInvoicing = lazyWithRetry/);
  assert.ok(app.includes('<Route path="proposals" element={<LegacyQuotationRedirect />} />'));
  assert.ok(app.includes('<Route path="finance/quotations" element={<ModuleRoute moduleKey="invoicing" moduleLabel="quotations"><AdminInvoicing embeddedView="quotations" /></ModuleRoute>} />'));
  assert.doesNotMatch(layout, /location\.pathname === '\/admin\/invoicing'/);
  assert.doesNotMatch(layout, /isFinanceModuleRoute|ariaLabel="Finance sections"/);
  assert.equal(layout.includes('data-ams-slug="active-module-title"'), false);
  assert.ok(layout.includes('ariaLabel="Workspace navigation"'));
  assert.ok(workspace.includes('ariaLabel="Finance areas"'));
  const navigation = await read('src/lib/amsModuleSubnavigation.ts');
  assert.match(navigation, /label: 'Profitability & Expenses', to: '\/admin\/finance\?tab=accounts-payable'/);
  assert.match(workspace, /finance-tab-accounting-reports/);
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

test('Finance Executive Summary and Dashboard have distinct scopes and period-aware activity', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf('const renderSummary = (dashboard: boolean) =>');
  const end = workspace.indexOf('const openVendorContractEditor', start);
  assert.ok(start >= 0 && end > start, 'Summary renderer should remain available.');
  const summary = workspace.slice(start, end);

  assert.match(summary, /const dashboardMetrics = \[/);
  assert.match(summary, /const dashboardRange = getReportingPeriodRange\(reportPeriodValue, reportPeriodMode, locale\)/);
  assert.match(summary, /label: 'Invoice value issued'[\s\S]*?billedInPeriod/);
  assert.match(summary, /label: 'Recorded cash in'[\s\S]*?cashInThisPeriod/);
  assert.match(summary, /label: 'Recorded cash out'[\s\S]*?cashOutThisPeriod/);
  assert.match(summary, /label: 'Net cash movement \(proxy\)'[\s\S]*?cashInThisPeriod - cashOutThisPeriod/);
  assert.match(summary, /data-ams-slug="finance-dashboard-period"/);
  assert.match(summary, /renderRecentActivity\(dashboardRange \?/);
  assert.doesNotMatch(summary, /finance-dashboard-month-picker|setSelectedMonth/);
  assert.match(summary, /title="Recent invoice register"/);
  assert.match(summary, /\{dashboard \? \([\s\S]*?AdminMetricStrip metrics=\{dashboardMetrics\}[\s\S]*?\) : \(/);
  assert.match(summary, /AdminMetricStrip metrics=\{metrics\}/);
  assert.doesNotMatch(summary, /Selected-month activity/);
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

test('Annual Summary includes years represented only by Cash & Bank records', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = workspace.indexOf("case 'annual-summary': {");
  const end = workspace.indexOf('\n      default:', start);
  assert.ok(start >= 0 && end > start);
  const annual = workspace.slice(start, end);
  assert.match(annual, /const yearCollections = cashMovements\.filter\(\(movement\) => movement\.currency === 'IDR'[\s\S]*?movement\.source !== 'Internal transfer'[\s\S]*?getYearKey\(movement\.date\) === selectedYear\)/);
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
});

test('Embedded invoice, expense, and receivable workflows do not leak UI state across worksheets', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const vendors = await read('src/pages/admin/AdminVendors.tsx');

  assert.match(workspace, /case 'revenue':[\s\S]{0,100}key=\{tab\.key\} embeddedView="invoices"/);
  assert.match(workspace, /case 'expenses':[\s\S]{0,150}key=\{tab\.key\} embeddedView="income-expenses"/);
  assert.match(workspace, /case 'accounts-receivable':[\s\S]{0,120}key=\{tab\.key\} embeddedView="receivables"/);
  assert.match(vendors, /\{!embedded && \([\s\S]{0,180}<AdminModuleHeader/);
  assert.match(vendors, /\{embedded && <button type="button" onClick=\{handleOpenAdd\}/);
  assert.match(vendors, /data-ams-slug="vendor-snapshot"/);
  assert.match(vendors, /flex flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between/);
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
