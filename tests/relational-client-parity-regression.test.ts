import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Relational reconciliation includes client field parity', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'scripts/postgres-reconcile.ts'), 'utf8');
  assert.ok(source.includes("pool.query('SELECT id,name,company,email,phone,industry,status,notes,metadata FROM clients')"));
  assert.ok(source.includes("clients: compareParity('clients'"));
});
