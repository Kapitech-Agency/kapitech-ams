import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Finance top-level tabs and clean sub-tabs preserve direct transaction entry', async () => {
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  assert.match(layout, /location\.pathname === '\/admin\/finance'[\s\S]*?<AdminTopbarTabs/);
  assert.match(layout, /admin\.finance\.tab\.overviewControl/);
  assert.match(layout, /admin\.finance\.tab\.transactionsCash/);
  assert.match(layout, /admin\.finance\.tab\.receivablesPayables/);
  assert.match(layout, /admin\.finance\.tab\.projectFinance/);
  assert.match(layout, /admin\.finance\.tab\.accountingReports/);
  assert.match(layout, /admin\.finance\.tab\.transactionsCash'[\s\S]*?to: '\/admin\/finance\?tab=cash-bank'/);
  assert.match(layout, /admin\.finance\.tab\.receivablesPayables'[\s\S]*?to: '\/admin\/finance\?tab=accounts-receivable'/);
  assert.match(layout, /admin\.finance\.tab\.accountingReports'[\s\S]*?to: '\/admin\/finance\?tab=journal'/);
  assert.match(workspace, /className="min-\[900px\]:hidden"/);
  assert.match(workspace, /AdminSectionTabs ariaLabel="Finance sub-sections" activeKey=\{activeTab\.key\} items=\{sheetItems\}/);
  assert.match(workspace, /const sheetItems = activeGroup\.items\.map\(\(item\) =>/);
  assert.match(workspace, /label: item\.label/);
  assert.doesNotMatch(workspace, /label: item\.sheet \+ ' ' \+ item\.label/);
  assert.match(workspace, /\{loading \? renderLoading\(\) : renderView\(activeTab\)\}/);
  const pageStart = workspace.indexOf('const financePage = (');
  const pageEnd = workspace.indexOf('return localizeFinanceValue(financePage, language)', pageStart);
  assert.ok(pageStart >= 0 && pageEnd > pageStart, 'Finance page render must remain available.');
  const renderedPage = workspace.slice(pageStart, pageEnd);
  const uiSourceStart = workspace.indexOf('const renderSummary =');
  const uiSource = workspace.slice(uiSourceStart, pageStart);
  assert.doesNotMatch(uiSource, /Sheet \{activeTab\.sheet\}|Source of truth for workflow design|Excel-alignment implementation|Excel-aligned finance workflow|Open transaction workspace|workbook's Project Cost|Finance workbook sheets|Project name \/ Excel key/);
  assert.doesNotMatch(renderedPage, /Sheet \{activeTab\.sheet\}|Source of truth for workflow design|Excel-alignment implementation|Excel-aligned finance workflow|Open transaction workspace|Finance workbook sheets/);
  const headerStart = renderedPage.indexOf('<AdminModuleHeader');
  const headerEnd = renderedPage.indexOf('      />', headerStart);
  assert.ok(headerStart >= 0 && headerEnd > headerStart, 'Finance must use the shared module header.');
  assert.doesNotMatch(renderedPage.slice(headerStart, headerEnd), /\bicon=/, 'Finance header must not render icons.');
  assert.match(renderedPage.slice(headerStart, headerEnd), /description="Manage revenue, expenses, cash, receivables, payables, and financial reporting in one place\."/);
  assert.doesNotMatch(renderedPage, /<div className="border-b border-line pb-3">\s*<h2 className="text-base font-semibold text-fg">\{activeTab\.label\}<\/h2>\s*<\/div>/, 'The selected worksheet must not repeat its label as a separate header below the subtabs.');
  assert.match(uiSource, /case 'revenue':\s*return <AdminInvoicing embeddedView="invoices" \/>/);
  assert.match(uiSource, /case 'expenses':\s*return <AdminInvoicing embeddedView="income-expenses" embeddedIncomeExpenseMode="expenses" \/>/);
  assert.match(uiSource, /case 'accounts-receivable':\s*return <AdminInvoicing embeddedView="receivables" \/>/);
  assert.match(uiSource, /case 'vendors':[\s\S]*?<AdminVendors embedded searchTerm=\{searchText\} \/>/);
  assert.match(uiSource, /registerAddButton\('chart-of-accounts', 'Add account'\)/);
  assert.match(uiSource, /Add movement/);
  assert.match(uiSource, /Add vendor bill/);
  assert.match(uiSource, /Add project finance record/);
  assert.match(uiSource, /Add budget line/);
  assert.match(uiSource, /Add voucher/);
  assert.match(uiSource, /Add team fee/);
  assert.match(uiSource, /Add journal entry/);
  assert.match(uiSource, /Calculate project allocation/);
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
  assert.match(closingView, /<input type="month" value=\{selectedMonth\} onChange=\{\(event\)=>setSelectedMonth\(event\.target\.value\)\}/);
  assert.doesNotMatch(closingView, /<input type="month" value=\{selectedMonth\}[\s\S]{0,220}disabled=\{locked\}/, 'Users must be able to navigate away from a locked month.');
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
  assert.match(workspace, /receivables: 'accounts-receivable'/);
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

  assert.match(invoicing, /type EmbeddedFinanceView = 'invoices' \| 'receivables' \| 'income-expenses' \| 'vendor-payments'/);
  assert.match(invoicing, /embeddedReceivablesOnly \|\| hasOpenReceivable/);
  assert.match(invoicing, /!embeddedReceivablesOnly && canCreateInvoice && <button[\s\S]*?onClick=\{openCreateInvoice\}/);
  assert.match(invoicing, /openPayment\(invoice\)/);
  assert.match(invoicing, /embeddedIncomeExpenseMode \|\| 'income'/);
  assert.match(invoicing, /Expense ledger/);
  assert.match(vendors, /export const AdminVendors: React\.FC<\{ embedded\?: boolean; searchTerm\?: string \}>/);
  assert.match(vendors, /!embedded && <div className="min-\[900px\]:hidden min-w-0" data-ams-slug="team-mobile-tabs">/);
  assert.match(workspace, /accountsByCode\.values\(\)/);
  assert.match(workspace, /This account code already exists/);
});

test('Finance workbook replaces legacy finance navigation and keeps all operational actions in workbook tabs', async () => {
  const app = await read('src/App.tsx');
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');

  assert.ok(app.includes('<Route path="invoicing" element={<Navigate to="/admin/finance?tab=revenue" replace />} />'));
  assert.doesNotMatch(app, /const AdminInvoicing = lazyWithRetry/);
  assert.doesNotMatch(layout, /location\.pathname === '\/admin\/invoicing'/);
  assert.doesNotMatch(layout, /Finance sections|finance=tax-retainers|finance=vendor-payments|finance=financial-reports/);

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
