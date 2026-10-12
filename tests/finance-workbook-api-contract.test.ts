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
  assert.match(repository, /vendor-bill-payment/);
});

test('Finance client provides CRUD, approval and period-close operations for register APIs', async () => {
  const client = await read('src/lib/apiClient.ts');
  for (const method of ['workbookList', 'workbookCreate', 'workbookUpdate', 'workbookApprove', 'workbookDelete', 'workbookClosePeriod']) {
    assert.match(client, new RegExp(method + ':'));
  }
});
