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

test('Finance settlement and tax accounts are added by a forward-only migration', async () => {
  const sql = await read('db/postgres/053_finance_settlement_tax_accounts.sql');
  assert.match(sql, /'coa-1010', 'chart-of-accounts', '1010'/);
  assert.match(sql, /'coa-2100', 'chart-of-accounts', '2100'/);
  assert.match(sql, /'coa-2200', 'chart-of-accounts', '2200'/);
  assert.match(sql, /Card Settlement Clearing/);
  assert.match(sql, /Tax Payable/);
  assert.match(sql, /Credit Card Payable/);
  assert.match(sql, /ON CONFLICT \(record_type, record_key\) DO NOTHING/);
  assert.ok(!sql.includes('DROP TABLE'));
  assert.ok(!sql.includes('DELETE FROM finance_workbook_records'));
});

test('Posted source journals lock accounting fields on their source records', async () => {
  const repository = await read('server/postgres-finance-workbook-repository.ts');
  const invoices = await read('server/postgres-invoice-repository.ts');
  const routes = await read('server/routes.ts');

  assert.match(repository, /ensurePostedSourceImmutable/);
  assert.match(repository, /'cash-bank-opening':\{sourceType:'cash-bank-opening',fields:\['accountCode','openingDate','openingBalance'\]\}/);
  assert.match(repository, /'balance-sheet-opening':\{sourceType:'balance-sheet-opening',fields:\['accountCode','asOfDate','openingAmount','side'\]\}/);
  assert.match(repository, /'vendor-bill':\{sourceType:'vendor-bill-issued'/);
  assert.match(repository, /'vendor-bill-payment':\{sourceType:'vendor-bill-payment'/);
  assert.match(repository, /await this\.ensurePostedSourceImmutable\(client,type,id,current\.payload,n\.payload\)/);
  assert.match(invoices, /INVOICE_POSTED_LEDGER_REVERSAL_REQUIRED/);
  assert.match(routes, /Accounting fields are locked; create and approve a reversal or adjustment journal first/);
});

test('Month-end close requires period-scoped statement evidence reconciled to posted GL', async () => {
  const repository = await read('server/postgres-finance-workbook-repository.ts');
  const routes = await read('server/routes.ts');
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');

  assert.match(repository, /'cash-reconciliation'/);
  assert.match(repository, /statementDate!==monthEnd/);
  assert.match(repository, /statementReference/);
  assert.match(routes, /has no month-end statement\/count reconciliation/);
  assert.match(routes, /differs from the posted GL/);
  assert.match(routes, /Cash & Bank opening balance \(account 1000\) is missing/);
  assert.match(workspace, /Statement reconciliation · '\+reconciliationMonth/);
  assert.match(workspace, /Reconciliation exceptions/);
  assert.match(workspace, /Record reconciliation/);
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
  assert.match(repository, /Maker-checker control cannot verify who created this record/);
  assert.match(repository, /the record creator cannot approve or post their own Finance record/);
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
  assert.match(routes, /FINANCE_SOURCE_JOURNAL_DRAFT_REFRESHED/);
  assert.match(routes, /existingSourceRecords/);
  assert.match(routes, /existing\.status === 'posted'/);
  assert.match(routes, /differs from an already posted journal/);
  assert.match(routes, /updated,/);
  assert.match(repository, /Journal source type and source ID must be supplied together/);
  assert.match(repository, /key = sourceType && sourceId \? 'source:' \+ sourceType \+ ':' \+ sourceId : reference/);
  assert.match(mapping, /buildFinanceSourceJournalDrafts/);
  assert.match(mapping, /No draft returned by this function is approved or posted/);
  assert.match(mapping, /Settlement method\/account is incomplete or unsupported/);
  assert.match(mapping, /debitCode, creditCode: '1300'/);
  assert.match(mapping, /sourceType: 'invoice-issued'/);
  assert.match(mapping, /sourceType: 'vendor-bill-payment'/);
  assert.match(repository, /invoice-issued.*invoice-payment.*expense.*expense-payment.*cash-bank-transfer.*vendor-bill-payment/);
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


test('Monthly Closing exposes and enforces all required controls', async () => {
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
  assert.match(workspace, /period can close after all 11 required controls are marked Done/);
  assert.doesNotMatch(workspace, /General journal balanced|Project allocation reviewed|Monthly reports approved/);
});


test('Client receipts and vendor payments require their recognized source journals before posting', async () => {
  const repository = await read('server/postgres-finance-workbook-repository.ts');
  const mapping = await read('src/lib/financeWorkbook.ts');
  const ui = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  assert.match(repository, /relatedSourceId/);
  assert.match(repository, /Cannot post this client receipt until the linked invoice-issued journal is posted/);
  assert.match(repository, /Cannot post this vendor payment until the linked vendor-bill-issued journal is posted/);
  assert.match(repository, /Cannot post this expense payment until the linked expense accrual is posted/);
  assert.match(repository, /invoice-issued.*invoice-payment.*expense.*expense-payment.*cash-bank-transfer.*vendor-bill-issued.*vendor-bill-payment/);
  assert.match(mapping, /Posting is blocked until the linked invoice-issued journal is posted/);
  assert.match(mapping, /Posting is blocked until the linked vendor-bill-issued journal is posted/);
  assert.match(ui, /relatedSourceId: editor\.record\.payload\.relatedSourceId/);
});
