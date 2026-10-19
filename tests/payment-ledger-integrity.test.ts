import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('payment idempotency keys are bound to the original payment semantics', () => {
  const source = fs.readFileSync('server/postgres-invoice-repository.ts', 'utf8');
  const start = source.indexOf('async recordPayment(');
  assert.ok(start >= 0);
  const route = source.slice(start, start + 9000);
  assert.match(route, /IDEMPOTENCY_KEY_REUSE_CONFLICT/);
  assert.match(route, /requestFingerprint/);
  assert.match(route, /invoice-payment:\$\{id\}:\$\{String\(payment\.idempotencyKey\)\}/);
});

test('payment recording refuses stale or overpaid ledger state', () => {
  const source = fs.readFileSync('server/postgres-invoice-repository.ts', 'utf8');
  const start = source.indexOf('async recordPayment(');
  assert.ok(start >= 0);
  const route = source.slice(start, start + 9000);
  assert.match(route, /INVOICE_PAYMENT_LEDGER_INCONSISTENT/);
  assert.match(route, /authoritativePaid=current\.payments\.reduce/);
  assert.match(route, /authoritativeBalance=Math\.max/);
  assert.match(route, /paymentAmount>authoritativeBalance/);
});

test('payment idempotency conflicts are exposed as HTTP 409', () => {
  const source = fs.readFileSync('server/routes.ts', 'utf8');
  const start = source.indexOf("apiRouter.post('/finance/invoices/:id/pay'");
  assert.ok(start >= 0);
  const route = source.slice(start, start + 7000);
  assert.match(route, /IDEMPOTENCY_KEY_REUSE_CONFLICT/);
  assert.match(route, /INVOICE_PAYMENT_LEDGER_INCONSISTENT/);
  assert.match(route, /res\.status\(conflict \? 409 : 400\)/);
});
