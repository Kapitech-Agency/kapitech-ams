import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Finance sections use the shared topbar on desktop and the shared section tabs on mobile', async () => {
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  assert.match(layout, /location\.pathname === '\/admin\/finance'[\s\S]*?<AdminTopbarTabs/);
  assert.match(layout, /admin\.finance\.tab\.overviewControl/);
  assert.match(layout, /admin\.finance\.tab\.transactionsCash/);
  assert.match(layout, /admin\.finance\.tab\.receivablesPayables/);
  assert.match(layout, /admin\.finance\.tab\.projectFinance/);
  assert.match(layout, /admin\.finance\.tab\.accountingReports/);
  assert.match(workspace, /className="min-\[900px\]:hidden"/);
  assert.match(workspace, /AdminSectionTabs ariaLabel="Finance workbook sheets"/);
  const headerStart = workspace.indexOf('<AdminModuleHeader');
  const headerEnd = workspace.indexOf('</AdminModuleHeader>', headerStart);
  assert.ok(headerStart >= 0 && headerEnd > headerStart, 'Finance must use the shared module header.');
  assert.doesNotMatch(workspace.slice(headerStart, headerEnd), /\bicon=/, 'Finance header and its actions must not render icons.');
});

test('Finance locale uses the selected application language and localizes Indonesian workbook labels', async () => {
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
