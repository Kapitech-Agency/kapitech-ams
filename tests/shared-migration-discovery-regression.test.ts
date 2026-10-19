import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Migration readiness reuses the shared migration loader', () => {
  const routes = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');
  const migrations = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-migrations.ts'), 'utf8');

  assert.ok(routes.includes("import { loadPostgresMigrations } from './postgres-migrations.ts';"));
  assert.ok(routes.includes('const migrations = await loadPostgresMigrations()'));
  assert.ok(migrations.includes('defaultMigrationsDir'));
  assert.ok(migrations.includes("path.resolve(entrypointDir, 'db/postgres')"));
  assert.ok(migrations.includes("path.resolve(entrypointDir, '../db/postgres')"));
});
