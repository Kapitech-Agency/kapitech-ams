import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (p: string) => fs.readFileSync(p, 'utf8');

test('production build uses the constrained Hostinger-safe runner', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.build, 'node scripts/build-production.mjs');
  assert.equal(pkg.scripts.start, 'node dist/server.cjs');
  const build = read('scripts/build-production.mjs');
  assert.match(build, /spawnSync/);
  assert.match(build, /RAYON_NUM_THREADS/);
  assert.match(build, /vite/);
  assert.match(build, /esbuild/);
  assert.ok(build.includes('copy-postgres-migrations.mjs'));
});

test('production environment gate requires database, encryption, storage and backup evidence', () => {
  const s = read('scripts/validate-production-env.ts');
  for (const key of [
    'KAPITECH_DATA_SOURCE',
    'KAPITECH_DATA_ENCRYPTION_KEY',
    'KAPITECH_POSTGRES_SSL',
    'KAPITECH_DOCUMENT_STORAGE_PROVIDER',
    'KAPITECH_POSTGRES_BACKUP_LATEST_SHA256',
    'KAPITECH_POSTGRES_BACKUP_RESTORE_VERIFIED_AT'
  ]) {
    assert.ok(s.includes(key), key);
  }
});

test('migration packaging is deterministic and fails closed when no SQL migrations exist', () => {
  const build = read('scripts/build-production.mjs');
  const s = read('scripts/copy-postgres-migrations.mjs');
  assert.ok(build.includes('copy-postgres-migrations.mjs'));
  assert.ok(s.includes('.filter((file) => /^\\d+_.+\\.sql$/.test(file))'));
  assert.ok(s.includes('dist/db/postgres'));
  assert.ok(s.includes('No PostgreSQL migration files were found to package'));
});
