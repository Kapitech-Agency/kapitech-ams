import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('expense lifecycle constraints are fully validated after migration 035', () => {
  const migration = fs.readFileSync('db/postgres/035_validate_expense_lifecycle_constraints.sql', 'utf8');

  for (const constraint of [
    'expenses_amount_v2_check',
    'expenses_currency_v2_check',
    'expenses_status_v2_check',
    'expenses_version_v2_check',
    'expenses_project_id_fkey'
  ]) {
    assert.match(migration, new RegExp(`VALIDATE CONSTRAINT ${constraint}`));
  }
});

test('PostgreSQL reconciliation gates invoice ledger and unvalidated expense constraints', () => {
  const source = fs.readFileSync('scripts/postgres-reconcile.ts', 'utf8');

  assert.match(source, /async function pgFinanceIntegrity/);
  assert.match(source, /SUM\(ip\.amount\)/);
  assert.match(source, /recordedPaid - row\.paymentPaid/);
  assert.match(source, /recordedBalance - row\.expectedBalance/);
  assert.match(source, /NOT c\.convalidated/);
  assert.match(source, /financeIntegrity: financeIntegrity\.valid/);
});
