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
  assert.match(uiSource, /case 'revenue':\s*return <AdminInvoicing embeddedView="invoices" \/>/);
  assert.match(uiSource, /case 'expenses':\s*return <AdminInvoicing embeddedView="income-expenses" embeddedIncomeExpenseMode="expenses" \/>/);
  assert.match(uiSource, /case 'accounts-receivable':\s*return <AdminInvoicing embeddedView="receivables" \/>/);
  assert.match(uiSource, /case 'vendors':\s*return <AdminVendors embedded \/>/);
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
  assert.match(vendorsView, /return <AdminVendors embedded \/>/);
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

  assert.match(invoicing, /type EmbeddedFinanceView = 'invoices' \| 'receivables' \| 'income-expenses'/);
  assert.match(invoicing, /embeddedReceivablesOnly \|\| hasOpenReceivable/);
  assert.match(invoicing, /embedded && canCreateInvoice && <button[\s\S]*?onClick=\{openCreateInvoice\}/);
  assert.match(invoicing, /onClick=\{\(\) => openPayment\(invoice\)\}/);
  assert.match(invoicing, /embeddedIncomeExpenseMode \|\| 'income'/);
  assert.match(invoicing, /Expense ledger/);
  assert.match(vendors, /export const AdminVendors: React\.FC<\{ embedded\?: boolean \}>/);
  assert.match(vendors, /!embedded && <div className="min-\[900px\]:hidden min-w-0" data-ams-slug="team-mobile-tabs">/);
  assert.match(workspace, /accountsByCode\.values\(\)/);
  assert.match(workspace, /This account code already exists/);
});
