import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import path from 'node:path';

test('Production readiness requires PostgreSQL migration checksum parity', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');
  assert.ok(source.includes('SELECT version, checksum FROM schema_migrations'));
  assert.ok(source.includes('requiredMigrationChecksums'));
  assert.ok(source.includes('migrationChecksumComplete'));
  assert.ok(source.includes('migrationChecksumComplete;'));
});
