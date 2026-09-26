import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('PostgreSQL MFA failure counter is atomic under concurrent verification attempts', async () => {
  const repositorySource = await fs.readFile(path.join(root, 'server/postgres-repository.ts'), 'utf8');
  const authSource = await fs.readFile(path.join(root, 'server/auth.ts'), 'utf8');

  const methodStart = repositorySource.indexOf('async updateMfaFailedAttempts(');
  const methodEnd = repositorySource.indexOf('\n  async pruneUserSessions', methodStart);
  assert.ok(methodStart >= 0 && methodEnd > methodStart, 'MFA failure update method must exist');

  const method = repositorySource.slice(methodStart, methodEnd);
  assert.match(method, /SET mfa_failed_attempts = mfa_failed_attempts \+ GREATEST\(1, \$2\)/);
  assert.match(method, /AND kind = 'mfa'/);
  assert.match(method, /AND expires_at > NOW\(\)/);
  assert.match(method, /RETURNING mfa_failed_attempts/);
  assert.equal(
    method.includes('SELECT mfa_failed_attempts') || method.includes('findSession('),
    false,
    'MFA failure increments must not rely on a read/modify/write sequence'
  );

  const postgresAuthBlockStart = authSource.indexOf("if (getDataSourceMode() === 'postgres')", authSource.indexOf('export async function incrementMfaChallengeFailures'));
  const postgresAuthBlockEnd = authSource.indexOf('\n  }\n  const db = getDatabase();', postgresAuthBlockStart);
  assert.ok(postgresAuthBlockStart >= 0 && postgresAuthBlockEnd > postgresAuthBlockStart);

  const postgresAuthBlock = authSource.slice(postgresAuthBlockStart, postgresAuthBlockEnd);
  assert.match(postgresAuthBlock, /const failedAttempts = await postgresAuthRepository\.updateMfaFailedAttempts\(/);
  assert.match(postgresAuthBlock, /if \(failedAttempts >= 5\) await postgresAuthRepository\.deleteSession\(tokenHash\)/);
});
