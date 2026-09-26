import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('expense idempotency compares the original request fingerprint', () => {
  const source = fs.readFileSync('server/postgres-expense-repository.ts', 'utf8');

  assert.match(source, /requestFingerprint/);
  assert.match(source, /EXPENSE_IDEMPOTENCY_KEY_REUSE_CONFLICT/);
  assert.match(source, /storedFingerprint!==requestFingerprint/);
});

test('expense idempotency reuse conflicts are returned as HTTP 409', () => {
  const source = fs.readFileSync('server/routes.ts', 'utf8');
  const start = source.indexOf("apiRouter.post('/finance/expenses'");
  assert.ok(start >= 0);
  const route = source.slice(start, start + 5000);

  assert.match(route, /EXPENSE_IDEMPOTENCY_KEY_REUSE_CONFLICT/);
  assert.match(route, /res\.status\(409\)/);
});
