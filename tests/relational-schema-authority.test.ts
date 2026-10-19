import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Legacy relational schema reference cannot be mistaken for production migration source of truth', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'docs/relational-schema.sql'), 'utf8');
  assert.ok(source.includes('NON-AUTHORITATIVE SCHEMA REFERENCE'));
  assert.ok(source.includes('db/postgres/*.sql'));
  assert.ok(source.includes('npm run db:migrate'));
  assert.ok(source.includes('must not be used for production cutover/reconciliation'));
});
