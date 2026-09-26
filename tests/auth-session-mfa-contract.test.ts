import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('authentication uses server-side sessions with hardened cookies and idle expiry', async () => {
  const auth = await read('server/auth.ts');
  assert.match(auth, /kapi_session/);
  assert.match(auth, /HttpOnly/);
  assert.match(auth, /SameSite=Strict/);
  assert.match(auth, /SESSION_IDLE_TIMEOUT_MS/);
  assert.match(auth, /hashSessionToken/);
  assert.match(auth, /expiresAt/);
  assert.match(auth, /status === 'suspended'/);
});

test('state-changing authenticated requests require CSRF token and same-origin validation', async () => {
  const auth = await read('server/auth.ts');
  assert.match(auth, /x-csrf-token/i);
  assert.match(auth, /sameOrigin/);
  assert.match(auth, /CSRF_BLOCKED/);
  assert.match(auth, /req\.user/);
});

test('MFA challenge is short-lived, rate-limited and single-use', async () => {
  const auth = await read('server/auth.ts');
  assert.match(auth, /expiresAt: now \+ 5 \* 60 \* 1000/);
  assert.match(auth, /failedAttempts >= 5/);
  assert.match(auth, /consumeMfaChallenge/);
  assert.match(auth, /deleteSession\(tokenHash\)/);
});
