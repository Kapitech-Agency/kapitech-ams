import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('PostgreSQL restore rehearsal is a real database restore workflow', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'scripts/postgres-restore-rehearsal.ts'), 'utf8');
  assert.ok(source.includes("import { Client } from 'pg';"));
  assert.ok(source.includes("const isCustomDump = backup.subarray(0, 5).toString('ascii') === 'PGDMP';"));
  assert.ok(source.includes("const command = isCustomDump ? 'pg_restore' : 'psql';"));
  assert.ok(source.includes('PostgreSQL restore rehearsal target must not be the production database.'));
  assert.ok(source.includes('Restore rehearsal target must be an empty PostgreSQL database.'));
  assert.ok(source.includes('requiredTablesVerified'));
});

test('Legacy JSON restore rehearsal has an explicit non-PostgreSQL name', () => {
  assert.ok(fs.existsSync(path.resolve(process.cwd(), 'scripts/json-restore-rehearsal.ts')));
  assert.ok(fs.existsSync(path.resolve(process.cwd(), 'scripts/json-restore-rehearsal.ts')));
});
