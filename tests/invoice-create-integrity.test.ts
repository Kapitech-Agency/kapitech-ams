import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('PostgreSQL invoice creation validates line item integrity before insert', () => {
  const source = fs.readFileSync('server/postgres-invoice-repository.ts', 'utf8');
  const start = source.indexOf('async create(');
  const end = source.indexOf('private async findByIdTx', start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.match(block, /INVALID_INVOICE_ITEM/);
  assert.match(block, /INVOICE_ITEM_SUBTOTAL_MISMATCH/);
  assert.match(block, /INVALID_INVOICE_TOTALS/);
  assert.match(block, /INVOICE_FINANCIAL_TOTAL_MISMATCH/);
  assert.match(block, /INVOICE_ITEMS_REQUIRED/);
  assert.match(block, /expectedAmount\s*=\s*Math\.round\(quantity\s*\*\s*unitPrice\s*\*\s*100\)\s*\/\s*100/);
  assert.ok(block.indexOf('invoiceItems') < block.indexOf('INSERT INTO invoices'));
});

test('PostgreSQL invoice updates revalidate authoritative financial totals', () => {
  const source = fs.readFileSync('server/postgres-invoice-repository.ts', 'utf8');
  const updateStart = source.indexOf('async update(');
  const paymentStart = source.indexOf('async recordPayment(', updateStart);
  assert.ok(updateStart >= 0 && paymentStart > updateStart);
  const block = source.slice(updateStart, paymentStart);
  assert.match(block, /this\.validateFinancials\(next\)/);
  assert.match(source, /private validateFinancials\(invoice:any\)/);
  assert.match(source, /INVOICE_FINANCIAL_TOTAL_MISMATCH/);
});

test('PostgreSQL invoice creation preserves the proposal relational link', () => {
  const source = fs.readFileSync('server/postgres-invoice-repository.ts', 'utf8');
  const start = source.indexOf('async create(');
  const end = source.indexOf('private async findByIdTx', start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.match(block, /INSERT INTO invoices \(id,proposal_id,invoice_number/);
  assert.match(block, /i\.proposalId/);
});

test('PostgreSQL invoice updates cannot break an existing proposal linkage', () => {
  const source = fs.readFileSync('server/postgres-invoice-repository.ts', 'utf8');
  const updateStart = source.indexOf('async update(');
  const paymentStart = source.indexOf('async recordPayment(', updateStart);
  assert.ok(updateStart >= 0 && paymentStart > updateStart);
  const block = source.slice(updateStart, paymentStart);
  assert.match(block, /current\.proposalId/);
  assert.match(block, /PROPOSAL_LINKAGE_IMMUTABLE/);
});

test('PostgreSQL payment recording derives paid amount from payment rows', () => {
  const source = fs.readFileSync('server/postgres-invoice-repository.ts', 'utf8');
  const start = source.indexOf('async recordPayment(');
  const end = source.indexOf('async cancel(', start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.match(block, /authoritativePaid=current\.payments\.reduce/);
  assert.match(block, /const totalPaid=authoritativePaid\+paymentAmount/);
});

test('PostgreSQL invoice creation validates proposal client/project linkage before insert', () => {
  const source = fs.readFileSync('server/postgres-invoice-repository.ts', 'utf8');
  const start = source.indexOf('async create(');
  const end = source.indexOf('private async findByIdTx', start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.match(block, /SELECT id, client_id, project_id FROM proposals/);
  assert.match(block, /Proposal does not belong to the selected client/);
  assert.match(block, /Proposal does not belong to the selected project/);
  assert.match(block, /Proposal-linked invoice requires the proposal project linkage to be preserved/);
});

test('PostgreSQL invoice mapping treats proposal_id as authoritative relational state', () => {
  const source = fs.readFileSync('server/postgres-invoice-repository.ts', 'utf8');
  assert.match(source, /proposalId:row\.proposal_id/);
  assert.doesNotMatch(source, /proposalId:row\.proposal_id\?\?metadata\.proposalId/);
});

test('proposal-to-invoice conversion preserves amount-based proposal discounts as invoice percentage state', () => {
  const source = fs.readFileSync('server/postgres-proposal-repository.ts', 'utf8');
  const start = source.indexOf('async convertToInvoice(');
  const end = source.indexOf('private async insertItem', start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.match(block, /derivedDiscountPercent/);
  assert.match(block, /derivedDiscountAmount/);
  assert.match(block, /derivedTaxAmount/);
  assert.match(block, /derivedTotal/);
  assert.match(block, /PROPOSAL_FINANCIAL_TOTAL_MISMATCH/);
  assert.match(block, /discountPercent:derivedDiscountPercent/);
  assert.match(block, /discountAmount:proposalDiscount/);
});


test('Invoice route preserves cent precision and scopes JSON reference lookups', () => {
  const source = fs.readFileSync('server/routes.ts', 'utf8');
  const routeStart = source.indexOf("apiRouter.post('/finance/invoices'");
  const routeEnd = source.indexOf("apiRouter.put('/finance/invoices/:id'", routeStart);
  assert.ok(routeStart >= 0 && routeEnd > routeStart);
  const block = source.slice(routeStart, routeEnd);
  assert.match(source, /amount: Math\.round\(item\.quantity \* item\.unitPrice \* 100\) \/ 100/);
  assert.match(block, /if \(getDataSourceMode\(\) === 'json'\) \{/);
  const jsonGuard = block.indexOf("if (getDataSourceMode() === 'json') {");
  const projectLookup = block.indexOf("const project = (db?.projects || []).find", jsonGuard);
  assert.ok(jsonGuard >= 0 && projectLookup > jsonGuard);
  const postgresCreate = block.indexOf("if (getDataSourceMode() === 'postgres')");
  assert.ok(postgresCreate > projectLookup);
});


test('Financial line-item integrity validates both parents when a line is moved', () => {
  const migration = fs.readFileSync('db/postgres/032_financial_line_parent_move_integrity.sql', 'utf8');
  assert.match(migration, /OLD\.proposal_id IS DISTINCT FROM NEW\.proposal_id/);
  assert.match(migration, /OLD\.invoice_id IS DISTINCT FROM NEW\.invoice_id/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION enforce_proposal_line_totals_v1/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION enforce_invoice_line_totals_v1/);
});
