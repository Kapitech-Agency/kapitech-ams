import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Excel-aligned supplementary Finance registers use a persisted PostgreSQL schema', async () => {
  const sql = await read('db/postgres/052_excel_aligned_finance_workbook_records.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS finance_workbook_records/);
  assert.match(sql, /payload JSONB NOT NULL CHECK \(jsonb_typeof\(payload\) = 'object'\)/);
  assert.match(sql, /CONSTRAINT finance_workbook_record_key_unique UNIQUE \(record_type, record_key\)/);
  assert.equal((sql.match(/\('coa-\d{4}', 'chart-of-accounts'/g) || []).length, 17);
});

test('All supplementary Finance register routes have explicit auth and permissions', async () => {
  const routes = await read('server/routes.ts');
  const fragments = [
    `apiRouter.get('/finance/workbook/:type', requireAuth, requirePermission('canViewFinancials'`,
    `apiRouter.post('/finance/workbook/:type', requireAuth, requirePermission('canManageInvoices'`,
    `apiRouter.put('/finance/workbook/:type/:id', requireAuth, requirePermission('canManageInvoices'`,
    `apiRouter.delete('/finance/workbook/:type/:id', requireAuth, requirePermission('canManageInvoices'`,
    `apiRouter.post('/finance/workbook/:type/:id/approve', requireAuth, requirePermission('canApproveBudgets'`,
    `apiRouter.post('/finance/workbook/periods/:period/close', requireAuth, requirePermission('canApproveBudgets'`
  ];
  for (const fragment of fragments) assert.ok(routes.includes(fragment), 'Missing secured route: ' + fragment);
});

test('Finance supplementary repository preserves period locks, maker approval actions and double-entry checks', async () => {
  const repository = await read('server/postgres-finance-workbook-repository.ts');
  assert.match(repository, /ensurePeriodOpen/);
  assert.match(repository, /Journal entry must balance/);
  assert.match(repository, /Only pending petty cash vouchers can be approved/);
  assert.match(repository, /Cannot close /);
  assert.match(repository, /Only an approved petty cash voucher can be posted/);
  assert.match(repository, /vendor-bill-payment/);
  assert.match(repository, /postPettyCashVoucher/);
  assert.match(repository, /A vendor bill with recorded payments cannot be archived/);
});

test('Finance client provides CRUD, approval and period-close operations for register APIs', async () => {
  const client = await read('src/lib/apiClient.ts');
  for (const method of ['workbookList', 'workbookCreate', 'workbookUpdate', 'workbookApprove', 'workbookDelete', 'workbookClosePeriod']) {
    assert.match(client, new RegExp(method + ':'));
  }
});


test('Journal source sync is permission-gated, draft-only and duplicate-safe', async () => {
  const routes = await read('server/routes.ts');
  const repository = await read('server/postgres-finance-workbook-repository.ts');
  const mapping = await read('src/lib/financeWorkbook.ts');
  assert.match(routes, /finance\/workbook\/journal-drafts\/sync/);
  assert.match(routes, /apiRouter\.post\('\/finance\/workbook\/journal-drafts\/sync', requireAuth, requirePermission\('canManageInvoices'\)/);
  assert.match(routes, /FINANCE_SOURCE_JOURNAL_DRAFT_CREATED/);
  assert.match(routes, /existingSourceKeys/);
  assert.match(repository, /Journal source type and source ID must be supplied together/);
  assert.match(repository, /key = sourceType && sourceId \? 'source:' \+ sourceType \+ ':' \+ sourceId : reference/);
  assert.match(mapping, /buildFinanceSourceJournalDrafts/);
  assert.match(mapping, /No draft returned by this function is approved or posted/);
  assert.match(mapping, /provisional workbook default/);
  assert.match(mapping, /debitCode: '1000', creditCode: '1300'/);
  assert.match(mapping, /sourceType: 'invoice-issued'/);
  assert.match(mapping, /sourceType: 'vendor-bill-payment'/);
  assert.match(repository, /invoice-issued.*invoice-payment.*expense.*cash-bank-transfer.*vendor-bill-payment/);
  assert.match(routes, /postgresFinanceWorkbookRepository\.list\('vendor-bill-payment'\)/);
  const client = await read('src/lib/apiClient.ts');
  assert.match(client, /workbookSyncJournalDrafts:/);
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  assert.match(workspace, /sourceType: editor\.record\.payload\.sourceType/);
  assert.match(workspace, /sourceId: editor\.record\.payload\.sourceId/);
  assert.match(workspace, /const summary = response\.data\?\.summary/);
});


test('Vendor installment payments preserve the 30/20/50 schedule and enforce stage caps on create and update', async () => {
  const repository = await read('server/postgres-finance-workbook-repository.ts');
  const ui = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const mapping = await read('src/lib/financeWorkbook.ts');
  assert.match(repository, /installmentNumber/);
  assert.match(repository, /Payment exceeds the outstanding amount for Payment/);
  assert.match(repository, /getVendorBillInstallmentSchedule/);
  assert.match(mapping, /getVendorBillInstallmentSchedule/);
  assert.match(ui, /Payment 1 · 30%/);
  assert.match(ui, /Payment 2 · 20%/);
  assert.match(ui, /Payment 3 · 50%/);
  assert.match(ui, /Vendor & Freelancer · 30% \/ 20% \/ 50% schedule/);
});


test('Monthly Closing exposes and enforces the exact 11 workbook controls', async () => {
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const repository = await read('server/postgres-finance-workbook-repository.ts');
  const workbookControls = [
    'All revenue recorded', 'All expenses recorded', 'Cash & bank reconciled',
    'Receivables reviewed', 'Payables reviewed', 'Project margins reviewed',
    'Journal balanced', 'P&L reviewed', 'Cash Flow reviewed',
    'Balance Sheet reviewed', 'Management approval'
  ];
  for (const item of workbookControls) {
    assert.match(workspace, new RegExp(item.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&')));
    assert.ok(repository.toLowerCase().includes("'" + item.toLowerCase() + "'"), 'Backend closing control missing: ' + item);
  }
  assert.match(workspace, /all eleven workbook control items/);
  assert.doesNotMatch(workspace, /General journal balanced|Project allocation reviewed|Monthly reports approved/);
});
