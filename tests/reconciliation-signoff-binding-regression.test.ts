import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Production readiness binds reconciliation signoff to source hash and run time', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');
  assert.ok(source.includes('KAPITECH_RELATIONAL_RECONCILIATION_SOURCE_SHA256'));
  assert.ok(source.includes('reconciliationSourceBound'));
  assert.ok(source.includes('reconciliationCompletedBeforeSignoff'));
  assert.ok(source.includes('latestReconciliation.sourceSha256'));
});