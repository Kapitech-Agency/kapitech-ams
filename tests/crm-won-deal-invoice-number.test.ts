import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('CRM won-deal conversion serializes and checks generated invoice numbers', () => {
  const source = fs.readFileSync('server/postgres-crm-deal-repository.ts', 'utf8');
  const start = source.indexOf('async convertWonDeal(');
  assert.ok(start >= 0);
  const route = source.slice(start, start + 16000);

  assert.ok(route.includes('crm-won-invoice-number:${invoiceYear}'));
  assert.ok(route.includes('pg_advisory_xact_lock(hashtextextended($1, 3847219))'));
  assert.ok(route.includes('for (let attempt = 0; attempt < 10; attempt += 1)'));
  assert.ok(route.includes('SELECT 1 FROM invoices WHERE invoice_number=$1 LIMIT 1'));
  assert.ok(route.includes("if (existingNumber.rowCount === 0) {"));
  assert.ok(route.includes("throw new Error('INVOICE_NUMBER_GENERATION_FAILED')"));
});

test('CRM won-deal replay requires exactly one conversion task and tags new tasks to the deal', () => {
  const source = fs.readFileSync('server/postgres-crm-deal-repository.ts', 'utf8');
  const start = source.indexOf('async convertWonDeal(');
  assert.ok(start >= 0);
  const route = source.slice(start, start + 16000);

  assert.ok(route.includes("metadata->>'crmDealId'=$2"));
  assert.ok(route.includes("throw new Error('MULTIPLE_TASKS_FOR_DEAL')"));
  assert.ok(route.includes("throw new Error('INCOMPLETE_DEAL_CONVERSION')"));
  assert.ok(route.includes('crmDealId: deal.id'));
});

test('CRM conversion maps integrity conflicts to HTTP 409', () => {
  const source = fs.readFileSync('server/routes.ts', 'utf8');
  const start = source.indexOf("apiRouter.post('/crm/deals/:id/convert-to-project'");
  assert.ok(start >= 0);
  const route = source.slice(start, start + 5000);
  assert.match(route, /DEAL_INVOICE_PROJECT_MISMATCH/);
  assert.match(route, /MULTIPLE_TASKS_FOR_DEAL/);
  assert.match(route, /res\.status\(status\)/);
});
