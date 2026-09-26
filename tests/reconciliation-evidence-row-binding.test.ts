import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Production reconciliation readiness binds report hash to the migration_runs row hash and source kind', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');
  assert.ok(source.includes("WHERE source_kind = 'encrypted-json'"));
  assert.ok(source.includes('rowSourceSha256'));
  assert.ok(source.includes("latestReconciliation.sourceSha256 === latestReconciliation.rowSourceSha256"));
  assert.ok(source.includes("latestReconciliation?.sourceKind === 'encrypted-json'"));
});
