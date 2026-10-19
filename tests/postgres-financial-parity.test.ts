import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('reconciliation compares PostgreSQL financial aggregates, not only row counts', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-reconcile.ts'), 'utf8');

  for (const field of [
    'proposalSubtotal',
    'proposalTotal',
    'invoiceTotal',
    'invoiceAmountPaid',
    'invoiceBalanceDue',
    'expensesTotal',
    'pipelineValue'
  ]) {
    assert.match(source, new RegExp(field));
  }

  assert.match(source, /financialMismatches/);
  assert.match(source, /financialParity/);
  assert.match(source, /SUM\(subtotal\)/);
  assert.match(source, /SUM\(total\)/);
  assert.match(source, /SUM\(amount_paid\)/);
  assert.match(source, /SUM\(balance_due\)/);
  assert.match(source, /SUM\(amount\)/);
  assert.match(source, /SUM\(value\)/);
});

test('financial parity participates in the reconciliation pass/fail gate', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-reconcile.ts'), 'utf8');
  assert.match(source, /const reconciliationPass = checks\.countParity && checks\.financialParity/);
});


test('reconciliation gates client total spend against persisted invoice payments', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-reconcile.ts'), 'utf8');
  assert.match(source, /function pgClientSpendParity/);
  assert.match(source, /metadata->>'totalSpend'/);
  assert.match(source, /SUM\(ip\.amount\)/);
  assert.match(source, /clientSpendParity/);
  assert.match(source, /clientSpendParity\.valid/);
});
