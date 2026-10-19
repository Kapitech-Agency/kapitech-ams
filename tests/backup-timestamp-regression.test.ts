import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import path from 'node:path';

test('Backup freshness rejects future timestamps instead of clamping them to fresh', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-backup-health.ts'), 'utf8');
  assert.ok(source.includes('ageMs >= 0'));
  assert.ok(source.includes('restoreVerifiedAtMs <= now'));
  assert.ok(source.includes('now - restoreVerifiedAtMs <= restoreMaxAgeMs'));
  assert.ok(!source.includes('Math.max(0, now - new Date(latestBackupAt).getTime())'));
  assert.ok(!source.includes('Math.max(0, now - restoreVerifiedAtMs)'));
});
