import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Admin CRM mutation actions stay grouped behind the CRM permission', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCrm.tsx'), 'utf8');
  assert.ok(source.includes('{canManageCrm && ('));
  assert.ok(source.includes('disabled={!canManageCrm}'));
  assert.ok(source.includes('</button>\n            </>\n          )}'));
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
  assert.ok(source.includes('min-[900px]:hidden -mx-1 mb-4 overflow-x-auto'));
  assert.ok(source.includes('const QuotationStatusBadge'));
  assert.ok(!source.includes('quotation.status as never'));
  assert.ok(source.includes('Quarter net cash'));
  assert.ok(source.includes('xl:w-[150px]'));
  assert.ok(source.includes('xl:w-[164px]'));
  assert.ok(source.includes('whitespace-nowrap'));
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

test('Admin topbar keeps Finance sections in the canonical order', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  const markers = [
    "label: 'Invoice'",
    "label: 'Quotation'",
    "label: 'Income & Expenses'",
    "label: 'Tax & Retainers'",
    "label: 'Financial Reports'"
  ];
  let lastIndex = -1;
  for (const marker of markers) {
    const index = source.indexOf(marker);
    assert.ok(index > lastIndex);
    lastIndex = index;
  }
});
