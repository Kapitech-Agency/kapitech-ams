import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('PostgreSQL startup bootstraps public CMS defaults after migrations', () => {
  const server = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
  const migration = server.indexOf('await runPostgresMigrations()');
  const admin = server.indexOf('await ensurePostgresInitialAdmin()');
  const cms = server.indexOf('await ensurePostgresCmsDefaults()');

  assert.ok(migration >= 0);
  assert.ok(admin >= 0);
  assert.ok(cms >= 0);
  assert.ok(migration < admin);
  assert.ok(admin < cms);
});

test('CMS bootstrap uses PostgreSQL tables and one-time seed markers', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-cms-bootstrap.ts'), 'utf8');
  assert.match(source, /cms_services/);
  assert.match(source, /cms_projects/);
  assert.match(source, /cms_seed_state/);
  assert.match(source, /ON CONFLICT DO NOTHING/);
  assert.match(source, /pg_advisory_xact_lock/);
  assert.match(source, /allSolutionsAndServices/);
  assert.match(source, /allProjects/);
});
