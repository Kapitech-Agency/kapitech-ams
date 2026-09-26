import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Production reconciliation gate requires literal boolean true for every check', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');
  assert.ok(source.includes('Object.values(latestReconciliation.checks).every(value => value === true)'));
  assert.ok(!source.includes('Object.values(latestReconciliation.checks).every(Boolean)'));
});
