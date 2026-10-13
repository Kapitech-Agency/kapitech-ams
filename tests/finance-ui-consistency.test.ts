import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Finance top-level tabs are the only section navigation and each tab renders its complete work area', async () => {
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  assert.match(layout, /location\.pathname === '\/admin\/finance'[\s\S]*?<AdminTopbarTabs/);
  assert.match(layout, /admin\.finance\.tab\.overviewControl/);
  assert.match(layout, /admin\.finance\.tab\.transactionsCash/);
  assert.match(layout, /admin\.finance\.tab\.receivablesPayables/);
  assert.match(layout, /admin\.finance\.tab\.projectFinance/);
  assert.match(layout, /admin\.finance\.tab\.accountingReports/);
  assert.match(workspace, /className="min-\[900px\]:hidden"/);
  assert.doesNotMatch(workspace, /AdminSectionTabs ariaLabel="Finance workbook sheets"/);
  assert.match(workspace, /const renderFinanceGroup = \(\) => \{/);
  assert.match(workspace, /activeGroup\.items\.map\(\(tab\) =>/);
  assert.match(workspace, /\{renderView\(tab\)\}/);
  const pageStart = workspace.indexOf('const financePage = (');
  const pageEnd = workspace.indexOf('return localizeFinanceValue(financePage, language)', pageStart);
  assert.ok(pageStart >= 0 && pageEnd > pageStart, 'Finance page render must remain available.');
  const renderedPage = workspace.slice(pageStart, pageEnd);
  assert.doesNotMatch(renderedPage, /Sheet \{activeTab\.sheet\}|Source of truth for workflow design|Excel-alignment implementation|Excel-aligned finance workflow|Open transaction workspace/);
  const headerStart = renderedPage.indexOf('<AdminModuleHeader');
  const headerEnd = renderedPage.indexOf('      />', headerStart);
  assert.ok(headerStart >= 0 && headerEnd > headerStart, 'Finance must use the shared module header.');
  assert.doesNotMatch(renderedPage.slice(headerStart, headerEnd), /\bicon=/, 'Finance header must not render icons.');
  assert.match(renderedPage, /Manage invoices/);
});

test('Finance locale uses the selected application language and localized workbook account labels', async () => {
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
