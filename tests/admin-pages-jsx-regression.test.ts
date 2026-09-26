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

test('Admin invoicing keeps financial mutations permission-gated and uses the shared dashboard visual language', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminInvoicing.tsx'), 'utf8');
  assert.ok(source.includes('const canManageInvoices = hasAdminPermission(\'canManageInvoices\');'));
  assert.ok(source.includes('{canManageInvoices && ('));
  assert.ok(source.includes('ams-dashboard-header'));
  assert.ok(source.includes('computeInvoiceTotals'));
  assert.ok(source.includes('api.finance.getMetrics(currency)'));
  assert.ok(!source.includes('123-00-998877-1'));
  assert.ok(source.includes('serverMetrics.totalInvoicesCount'));
  assert.ok(source.includes('border-b border-line pb-3'));
  assert.ok(source.includes('const cardClass = \'ams-dashboard-card rounded-card border border-line bg-panel p-4\';'));
  assert.ok(source.includes('border-l border-line px-4 py-5 first:border-l-0'));
  assert.ok(source.includes('id="financial-trend-title"'));
  assert.ok(source.includes('<Receipt size={12} aria-hidden="true" />'));
  assert.ok(source.includes('grid-cols-2 sm:grid-cols-3 min-[1100px]:grid-cols-6'));
  assert.ok(source.includes('w-full min-w-[1040px] border-collapse text-left text-xs'));
  assert.ok(source.includes('w-full min-w-[820px] border-collapse text-left text-xs'));
});

test('Admin projects mutation actions stay behind their permissions', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminProjects.tsx'), 'utf8');
  assert.ok(source.includes('{canManageKanbanTasks && <Button'));
  assert.ok(source.includes('{canManageProjects && <Button'));
  assert.ok(!source.includes('Legacy regression guard:'));
});
