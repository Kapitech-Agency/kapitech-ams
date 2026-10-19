import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('PostgreSQL startup runs migrations before admin bootstrap', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
  const migrate = source.indexOf('await runPostgresMigrations()');
  const admin = source.indexOf('await ensurePostgresInitialAdmin()');
  assert.ok(migrate >= 0 && admin >= 0);
  assert.ok(migrate < admin);
});

test('CLI migration runner delegates to the same runtime migration implementation', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'scripts/postgres-migrate.ts'), 'utf8');
  assert.ok(source.includes("runPostgresMigrations"));
  assert.ok(!source.includes('CREATE TABLE IF NOT EXISTS schema_migrations'));
});

test('PostgreSQL startup retry cannot run concurrent initialization attempts', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
  assert.match(source, /let postgresInitializationInFlight = false/);
  assert.match(source, /if \(postgresInitializationInFlight \|\| postgresReady \|\| productionConfigError\) return/);
  assert.match(source, /postgresInitializationInFlight = true/);
  assert.match(source, /postgresInitializationInFlight = false/);
  assert.match(source, /finally \{/);
});
