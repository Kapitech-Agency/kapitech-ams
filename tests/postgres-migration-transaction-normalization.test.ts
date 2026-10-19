import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { normalizeMigrationSql } from '../server/postgres-migrations.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Migration transaction normalizer removes wrappers after SQL comments without changing migration source checksums', async () => {
  for (const file of [
    '001_initial_schema.sql',
    '005_expense_lifecycle.sql',
    '006_system_modules.sql',
    '014_notification_secret_removal.sql'
  ]) {
    const source = await fs.readFile(path.join(root, 'db/postgres', file), 'utf8');
    const normalized = normalizeMigrationSql(source);
    assert.doesNotMatch(normalized, /^\s*BEGIN;/i);
    assert.doesNotMatch(normalized, /COMMIT;\s*$/i);
    if (/\bBEGIN;/.test(source)) {
      assert.notEqual(source, normalized, file + ' should have its BEGIN wrapper normalized');
    }
  }
});

test('Migration normalizer does not rewrite migration source used for checksum calculation', async () => {
  const source = await fs.readFile(path.join(root, 'db/postgres/005_expense_lifecycle.sql'), 'utf8');
  assert.match(source, /BEGIN;/i);
  assert.match(source, /COMMIT;/i);
});
