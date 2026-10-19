import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('staging importer is fail-closed for writes', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-import.ts'), 'utf8');

  assert.match(source, /KAPITECH_MIGRATION_ENV !== 'staging'/);
  assert.match(source, /KAPITECH_MIGRATION_ALLOW_WRITE !== 'true'/);
  assert.match(source, /NODE_ENV === 'production'/);
  assert.match(source, /await client\.query\('BEGIN'\)/);
  assert.match(source, /await client\.query\('ROLLBACK'\)/);
});

test('staging importer preserves stable IDs and does not delete target-only rows', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-import.ts'), 'utf8');

  assert.match(source, /ON CONFLICT \(id\) DO UPDATE/);
  assert.match(source, /target-only rows were not deleted/);
  assert.match(source, /Target-only rows deleted: false|targetOnlyRowsDeleted: false/);
});

test('staging importer validates source duplicates and foreign keys before writing', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-import.ts'), 'utf8');

  assert.match(source, /assertNoDuplicateIds\(db\)/);
  assert.match(source, /assertForeignKeys\(db\)/);
  assert.match(source, /documents\.accessUserIds/);
});


test('staging importer preserves and verifies the JSON audit hash chain', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-import.ts'), 'utf8');

  assert.match(source, /function computeAuditLogHash/);
  assert.match(source, /function prepareAuditLogChain/);
  assert.match(source, /const hasAnyHash = logs\.some/);
  assert.match(source, /const hasAllHashes = logs\.every/);
  assert.match(source, /Audit log chain contains partial hash fields/);
  assert.match(source, /Audit log chain verification failed in migration source/);
  assert.match(source, /for \(let index = logs\.length - 1; index >= 0; index -= 1\)/);
  assert.match(source, /const auditLogs = arr\(db, 'auditLogs'\)/);
  assert.match(source, /for \(let index = auditLogs\.length - 1; index >= 0; index -= 1\)/);
});
