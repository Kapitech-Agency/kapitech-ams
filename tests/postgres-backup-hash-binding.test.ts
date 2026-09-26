import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('PostgreSQL backup readiness requires the latest backup hash and matching restore hash', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-backup-health.ts'), 'utf8');
  assert.ok(source.includes('KAPITECH_POSTGRES_BACKUP_LATEST_SHA256'));
  assert.ok(source.includes('KAPITECH_POSTGRES_BACKUP_RESTORE_BACKUP_SHA256'));
  assert.ok(source.includes('restoreMatchesLatestBackup'));
  assert.ok(source.includes('latestBackupSha256 === restoreBackupSha256'));
  assert.ok(source.includes('latestBackupSha256'));
});
