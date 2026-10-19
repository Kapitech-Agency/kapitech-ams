import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('authorization middleware has explicit permission and Master gates', async () => {
  const auth = await read('server/auth.ts');
  const routes = await read('server/routes.ts');
  assert.match(auth, /requirePermission/);
  assert.match(auth, /requireAnyPermission/);
  assert.match(auth, /requireMaster/);
  assert.match(routes, /requirePermission\('canApproveBudgets'\)/);
  assert.match(routes, /requireMaster/);
});

test('sensitive user-management routes are not public', async () => {
  const routes = await read('server/routes.ts');
  for (const pathFragment of ['/auth/users', '/system/backups', '/system/security/status', '/audit-logs']) {
    const index = routes.indexOf(pathFragment);
    assert.ok(index >= 0, 'Expected sensitive route: ' + pathFragment);
    const window = routes.slice(Math.max(0, index - 120), index + 500);
    assert.match(window, /requireAuth|requireMaster|requirePermission|requireAnyPermission/,
      'Sensitive route lacks an authorization guard: ' + pathFragment);
  }
});
