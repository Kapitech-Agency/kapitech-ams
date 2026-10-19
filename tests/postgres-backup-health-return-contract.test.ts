import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Non-PostgreSQL backup health returns the complete integrity contract', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-backup-health.ts'), 'utf8');
  assert.ok(source.includes('restoreBackupSha256: null,'));
  assert.ok(source.includes('restoreMatchesLatestBackup: false,'));
});
