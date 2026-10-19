import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('PostgreSQL restore rehearsal restores into an isolated database', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-restore-rehearsal.ts'), 'utf8');

  assert.match(source, /KAPITECH_POSTGRES_REHEARSAL_URL/);
  assert.match(source, /const isCustomDump = backup\.subarray\(0, 5\)/);
  assert.match(source, /const command = isCustomDump \? 'pg_restore' : 'psql'/);
  assert.match(source, /PostgreSQL restore rehearsal target must not be the production database/);
  assert.match(source, /Restore rehearsal target must be an empty PostgreSQL database/);
  assert.match(source, /\['--no-owner', '--exit-on-error', '--single-transaction'/);
  assert.match(source, /\['--set=ON_ERROR_STOP=1', '--single-transaction'/);
});

test('PostgreSQL restore rehearsal emits verifiable backup evidence', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-restore-rehearsal.ts'), 'utf8');

  assert.match(source, /backupSha256/);
  assert.match(source, /migrationCount/);
  assert.match(source, /userCount/);
  assert.match(source, /requiredTablesVerified/);
  assert.match(source, /loadPostgresMigrations/);
  assert.match(source, /migrationChecksumsVerified/);
});
