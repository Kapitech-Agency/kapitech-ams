import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Generic PostgreSQL user mapper decrypts MFA secrets consistently with auth repository', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-database-repository.ts'), 'utf8');
  assert.ok(source.includes("import { decryptSecret } from './secret-crypto.ts';"));
  assert.ok(source.includes('mfaSecret:decryptSecret(r.mfa_secret)'));
  assert.ok(source.includes('mfaPendingSecret:decryptSecret(r.mfa_pending_secret)'));
  assert.ok(!source.includes('mfaSecret:r.mfa_secret??undefined'));
  assert.ok(!source.includes('mfaPendingSecret:r.mfa_pending_secret??undefined'));
});
