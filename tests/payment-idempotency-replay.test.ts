import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('payment replay exposes explicit replay state', () => {
  const source = fs.readFileSync('server/routes.ts', 'utf8');
  const start = source.indexOf("apiRouter.post('/finance/invoices/:id/pay'");
  assert.ok(start >= 0);
  const route = source.slice(start, start + 6500);

  assert.ok(route.includes('const replayed = saved.__idempotentReplay === true'));
  assert.ok(route.includes('replayed: replayed'));
  assert.ok(route.includes('if (replayed) delete saved.__idempotentReplay'));
});
