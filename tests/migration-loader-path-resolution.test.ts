import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Migration loader supports both source-tree and compiled-server layouts', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-migrations.ts'), 'utf8');
  assert.ok(source.includes("import fsSync from 'node:fs';"));
  assert.ok(source.includes("path.resolve(process.cwd(), 'db/postgres')"));
  assert.ok(source.includes("path.resolve(entrypointDir, 'db/postgres')"));
  assert.ok(source.includes('fsSync.existsSync(candidate)'));
});
