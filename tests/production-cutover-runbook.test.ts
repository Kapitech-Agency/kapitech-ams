import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Production cutover runbook covers the required operational gates', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'docs/PRODUCTION-CUTOVER.md'), 'utf8');
  for (const token of [
    'KAPITECH_DATA_SOURCE=postgres',
    'KAPITECH_DATA_ENCRYPTION_KEY',
    'KAPITECH_DOCUMENT_STORAGE_PROVIDER=s3-compatible',
    'KAPITECH_POSTGRES_BACKUP_LATEST_SHA256',
    'KAPITECH_POSTGRES_BACKUP_RESTORE_BACKUP_SHA256',
    'KAPITECH_RELATIONAL_RECONCILIATION_SOURCE_SHA256',
    'npm run db:migrate',
    'npm run db:restore-rehearsal',
    'npm run db:reconcile',
    'npm run validate:production-env',
    'npm run build',
    'npm start'
  ]) {
    assert.ok(source.includes(token), 'Missing runbook token: ' + token);
  }
});
