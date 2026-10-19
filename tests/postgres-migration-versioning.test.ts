import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('PostgreSQL migration history is versioned without mutating migration 001', async () => {
  const initial = await fs.readFile(path.join(root, 'db/postgres/001_initial_schema.sql'), 'utf8');
  const tracking = await fs.readFile(path.join(root, 'db/postgres/002_migration_runs.sql'), 'utf8');
  const runner = await fs.readFile(path.join(root, 'server/postgres-migrations.ts'), 'utf8');
  const shared = await fs.readFile(path.join(root, 'server/postgres-migrations.ts'), 'utf8');

  assert.doesNotMatch(initial, /CREATE TABLE IF NOT EXISTS migration_runs/);
  assert.match(tracking, /CREATE TABLE IF NOT EXISTS migration_runs/);
  assert.match(tracking, /source_sha256 CHAR\(64\)/);
  assert.match(runner, /runPostgresMigrations/);
  assert.match(shared, /readdir\(migrationsDir\)/);
  assert.match(shared, /sort\(\(a, b\) => a\.localeCompare\(b, 'en', \{ numeric: true \}\)\)/);
  assert.match(shared, /checksum mismatch\. Refusing to start against a modified migration/);
});

test('Migration runner keeps the historical 001 transaction wrapper out of the stored checksum', async () => {
  const runner = await fs.readFile(path.join(root, 'server/postgres-migrations.ts'), 'utf8');

  assert.match(runner, /normalizeMigrationSql/);
  assert.match(runner, /normalizeMigrationSql/);
  assert.match(runner, /BEGIN;/);
  assert.match(runner, /COMMIT;/);
});
