import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('authentication audit events use PostgreSQL audit storage in PostgreSQL mode', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');

  assert.ok(
    source.includes("async function writeAuditLog(entry: Parameters<typeof recordAuditLog>[0]): Promise<void>"),
    'shared audit writer must exist'
  );
  assert.ok(
    source.includes("if (getDataSourceMode() === 'postgres')") &&
    source.includes("await postgresAuditLogRepository.append({"),
    'shared audit writer must append to PostgreSQL in PostgreSQL mode'
  );
  assert.ok(
    source.includes("[Audit] PostgreSQL audit append failed:"),
    'audit persistence failures must not break authentication responses'
  );

  for (const action of [
    'LOGIN_FAILED',
    'LOGIN_MFA_CHALLENGE',
    'LOGIN_SUCCESS',
    'MFA_VERIFY_FAILED',
    'LOGOUT'
  ]) {
    const occurrences = source.match(new RegExp("action: '" + action + "'", 'g')) || [];
    assert.ok(occurrences.length > 0, action);
  }

  const authBlockStart = source.indexOf("apiRouter.post('/auth/login'");
  const authBlockEnd = source.indexOf("apiRouter.get('/auth/me'", authBlockStart);
  assert.ok(authBlockStart >= 0 && authBlockEnd > authBlockStart);

  const authBlock = source.slice(authBlockStart, authBlockEnd);
  assert.ok(authBlock.includes('await writeAuditLog({'), 'authentication audit events must use the PostgreSQL-aware writer');
  const jsonOnlyAuditCount = (authBlock.match(/if \(getDataSourceMode\(\) === 'json'\) recordAuditLog\(\{/g) || []).length;
  assert.equal(jsonOnlyAuditCount, 2, 'MFA lifecycle audit writes may remain explicitly JSON-only for compatibility mode');
  const unguardedAuditBlock = authBlock.replace(
    /if \(getDataSourceMode\(\) === 'json'\) recordAuditLog\(\{/g,
    ''
  );
  assert.equal(
    unguardedAuditBlock.includes("recordAuditLog({"),
    false,
    'authentication routes must not write directly to the JSON audit store outside compatibility guards'
  );
});
