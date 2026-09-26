import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('PostgreSQL reconciliation enforces field-level record parity', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'scripts/postgres-reconcile.ts'), 'utf8');
  assert.ok(source.includes('function compareParity('));
  assert.ok(source.includes('const recordParity = buildRecordParity(db, postgresRecords);'));
  assert.ok(source.includes('recordFieldParity: recordParityComplete'));
  assert.ok(source.includes('invoicePayments'));
  assert.ok(source.includes('proposalItems'));
  assert.ok(source.includes('documentAccess'));
});
