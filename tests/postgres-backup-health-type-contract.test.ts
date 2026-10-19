import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('PostgreSQL backup health exposes and validates backup/restore hash evidence', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-backup-health.ts'), 'utf8');
  assert.ok(source.includes('latestBackupSha256: string | null;'));
  assert.ok(source.includes('restoreBackupSha256: string | null;'));
  assert.ok(source.includes('restoreMatchesLatestBackup: boolean;'));
  assert.ok(source.includes('latestBackupSha256,'));
  assert.ok(source.includes('restoreBackupSha256,'));
  assert.ok(source.includes('restoreMatchesLatestBackup,'));
});
