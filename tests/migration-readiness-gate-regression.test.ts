import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import path from 'node:path';

test('Production readiness migration gate does not hard-code a fixed migration count', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');
  assert.ok(source.includes("import { loadPostgresMigrations } from './postgres-migrations.ts';"));
  assert.ok(source.includes("const migrations = await loadPostgresMigrations()"));
  assert.ok(source.includes("requiredMigrationVersions.length === appliedMigrations.length"));
  assert.ok(source.includes("requiredMigrationChecksums[version] === appliedMigrationChecksums[version]"));
  assert.ok(!source.includes("Array.from({ length: 14 }"));
});
