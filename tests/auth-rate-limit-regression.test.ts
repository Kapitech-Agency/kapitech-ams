import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('login and session-recovery endpoints bypass the generic authenticated budget', async () => {
  const routes = await read('server/routes.ts');
  const exceptionStart = routes.indexOf('const AUTH_ENDPOINTS_WITH_DEDICATED_LIMIT = new Set([');
  const exceptionBlock = routes.match(/const AUTH_ENDPOINTS_WITH_DEDICATED_LIMIT = new Set\\(\\[([\\s\\S]*?)\\]\\);/)?.[1] || '';
  const genericLimiter = routes.indexOf('return rateLimitAuthenticated(300, 60 * 1000)(req, res, next);');
  const loginRoute = routes.indexOf("apiRouter.post('/auth/login', rateLimitPublic(10, 15 * 60 * 1000)");
  const firebaseRoute = routes.indexOf("apiRouter.post('/auth/firebase-login', rateLimitPublic(10, 15 * 60 * 1000)");
  const mfaRoute = routes.indexOf("apiRouter.post('/auth/mfa/verify', rateLimitPublic(10, 5 * 60 * 1000)");

  assert.ok(exceptionStart >= 0, 'explicit exception list must exist');
  assert.ok(genericLimiter > exceptionStart, 'generic authenticated limiter must follow the exception list');
  assert.match(routes, /if \(!req\.user \|\| AUTH_ENDPOINTS_WITH_DEDICATED_LIMIT\.has\(req\.path\)\) return next\(\);/);
  assert.ok(loginRoute > genericLimiter, 'login must keep its dedicated IP-based limiter');
  assert.ok(firebaseRoute > genericLimiter, 'Firebase login must keep its dedicated IP-based limiter');
  assert.ok(mfaRoute > genericLimiter, 'MFA verification must keep its dedicated IP-based limiter');

  for (const endpoint of ['/auth/login', '/auth/firebase-login', '/auth/mfa/verify', '/auth/me', '/auth/logout']) {
    assert.ok(exceptionBlock.includes(`'${endpoint}'`), `${endpoint} must be exempted from the generic limiter`);
  }
});
