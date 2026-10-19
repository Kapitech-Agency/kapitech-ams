import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('invoice payment idempotency has a PostgreSQL uniqueness backstop', () => {
  const migration = fs.readFileSync('db/postgres/034_invoice_payment_idempotency.sql', 'utf8');

  assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS invoice_payments_invoice_idempotency_key_unique/);
  assert.match(migration, /invoice_id/);
  assert.match(migration, /metadata->>'idempotencyKey'/);
  assert.match(migration, /NULLIF\(metadata->>'idempotencyKey', ''\) IS NOT NULL/);
});

test('payment route treats database uniqueness conflicts as payment conflicts', () => {
  const source = fs.readFileSync('server/routes.ts', 'utf8');
  const start = source.indexOf("apiRouter.post('/finance/invoices/:id/pay'");
  assert.ok(start >= 0);
  const route = source.slice(start, start + 7000);

  assert.match(route, /code.*23505/);
});
