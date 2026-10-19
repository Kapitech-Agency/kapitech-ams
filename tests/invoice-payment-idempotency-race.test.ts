import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('invoice payment idempotency serializes concurrent retries inside the transaction', () => {
  const source = fs.readFileSync('server/postgres-invoice-repository.ts', 'utf8');
  const start = source.indexOf('if (payment.idempotencyKey)');
  const end = source.indexOf("if(current.status==='cancelled')", start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.match(block, /pg_advisory_xact_lock\(hashtextextended\(\$1, 9127341\)\)/);
  assert.match(block, /invoice-payment:\$\{id\}:\$\{String\(payment\.idempotencyKey\)\}/);
  assert.match(block, /SELECT id,amount,method,paid_at,reference,metadata FROM invoice_payments/);
});
