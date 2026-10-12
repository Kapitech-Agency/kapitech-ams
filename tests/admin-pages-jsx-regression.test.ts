import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Retired CRM route redirects without loading a legacy page', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
  assert.ok(source.includes('<Route path="crm" element={<Navigate to="/admin/dashboard" replace />} />'));
  assert.doesNotMatch(source, /pages\/admin\/AdminCrm/);
});
test('Admin invoicing keeps financial mutations permission-gated and uses the shared AMS visual language', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminInvoicing.tsx'), 'utf8');

  assert.ok(source.includes("const canManageInvoices = hasAdminPermission('canManageInvoices');"));
  assert.ok(source.includes('{canManageInvoices &&'));
  assert.ok(source.includes('<AdminModuleHeader'));
  assert.ok(source.includes('const FinanceMetricCard'));
  assert.ok(source.includes('computeInvoiceTotals'));
  assert.ok(source.includes('api.finance.getMetrics(currency)'));
  assert.ok(!source.includes('123-00-998877-1'));
  assert.ok(source.includes('serverMetrics.totalInvoicesCount'));
  assert.ok(source.includes('Cash Flow vs Operating Burn'));
  assert.ok(source.includes('Finance snapshot'));
  assert.ok(source.includes('Cash position'));
  assert.ok(source.includes('Total outstanding balance'));
  assert.ok(source.includes('Collection progress'));
  assert.ok(source.includes('How to read this:'));
  assert.ok(source.includes('overdueInvoiceCount'));
  assert.ok(source.includes('paymentFilter'));
  assert.ok(source.includes('dueFilter'));
  assert.ok(source.includes('grid-cols-2 gap-3 xl:grid-cols-4'));
  assert.ok(source.includes('table-fixed'));
  assert.ok(source.includes('retainerLedgerInvoices'));
  assert.ok(source.includes('usingDemoRetainerLedger'));
  assert.ok(source.includes('border-separate border-spacing-0 text-xs'));
  assert.ok(source.includes('overflow-x-auto px-1 custom-scrollbar'));
  assert.ok(!source.includes('xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]'));
  assert.ok(source.includes('sticky top-0 z-10'));
  assert.ok(source.includes('Tax & Retainers'));
  assert.ok(source.includes('Financial Reports'));
  assert.ok(source.includes('Quotations'));
  assert.ok(source.includes('space-y-5"><section className="rounded-card border border-line bg-panel overflow-hidden">'));
  assert.ok(source.includes('grid gap-5 lg:grid-cols-2'));
  assert.ok(source.includes('const getInvoiceCollectedTotal'));
  assert.ok(source.includes('quarterInvoices'));
  assert.ok(source.includes("expense.type !== 'CapEx'"));
  assert.ok(source.includes('min-[900px]:hidden min-w-0 overflow-x-auto'));
  assert.ok(!source.includes(' -mx-1 '));
  assert.ok(source.includes('const QuotationStatusBadge'));
  assert.ok(!source.includes('quotation.status as never'));
  assert.ok(source.includes('Quarter net cash'));
  assert.ok(source.includes('xl:w-[150px]'));
  assert.ok(source.includes('whitespace-nowrap'));
  assert.equal((source.match(/xl:shrink-0/g) || []).length, 4);
  assert.equal((source.match(/xl:w-\[176px\]/g) || []).length, 2);
  assert.ok(source.includes('px-5 py-4'));
  assert.ok(source.includes('border border-line bg-panel text-muted'));
  const financeNavOrder = ['label: ' + String.fromCharCode(39) + 'Invoice', 'label: ' + String.fromCharCode(39) + 'Quotation', 'label: ' + String.fromCharCode(39) + 'Income & Expenses', 'label: ' + String.fromCharCode(39) + 'Tax & Retainers', 'label: ' + String.fromCharCode(39) + 'Financial Reports'];
  let lastIndex = -1;
  for (const marker of financeNavOrder) {
    const index = source.indexOf(marker);
    assert.ok(index > lastIndex);
    lastIndex = index;
  }
});

test('Admin projects mutation actions stay behind their permissions', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminProjects.tsx'), 'utf8');
  assert.ok(source.includes('{canManageKanbanTasks && <Button'));
  assert.ok(source.includes('{canManageProjects && <Button'));
  assert.ok(!source.includes('Legacy regression guard:'));
});

test('Admin topbar keeps active Finance sections in canonical order without retired quotations', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  const markers = [
    "label: 'Invoice'",
    "label: 'Income & Expenses'",
    "label: 'Tax & Retainers'",
    "label: 'Vendor Payments'",
    "label: 'Financial Reports'"
  ];
  let lastIndex = -1;
  for (const marker of markers) {
    const index = source.indexOf(marker);
    assert.ok(index > lastIndex);
    lastIndex = index;
  }
  assert.equal(source.includes("label: 'Quotation'"), false);
});
test('Authenticated AMS pages use one canonical responsive page frame', () => {
  const primitives = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminModulePrimitives.tsx'), 'utf8');
  const stylesheet = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
  const layout = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  const dashboard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/GlobalExecutiveDashboard.tsx'), 'utf8');

  assert.ok(primitives.includes("className={cn('ams-page-shell min-h-full min-w-0', className)}"));
  assert.ok(stylesheet.includes('.ams-shell>main>.ams-content{min-width:0;padding:0}'));
  assert.ok(stylesheet.includes('.ams-shell .ams-page-shell{display:flex;flex-direction:column;gap:24px;padding:24px 24px 32px}'));
  assert.ok(stylesheet.includes('.ams-shell .ams-page-shell{padding:24px 20px 32px}'));
  assert.ok(stylesheet.includes('.ams-shell .ams-page-shell{padding:16px 16px 24px}'));
  assert.ok(stylesheet.includes('.ams-shell .ams-page-shell{padding:16px 14px max(24px,env(safe-area-inset-bottom))}'));
  assert.ok(layout.includes('<div className="ams-content flex-1 min-h-0 w-full max-w-[1560px] mx-auto">'));
  assert.ok(dashboard.includes('<AdminPageShell featureSlug="dashboard-module" className="ams-dashboard">'));
});
