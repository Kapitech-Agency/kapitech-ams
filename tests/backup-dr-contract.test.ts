import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('backup and security-status endpoints are protected', async () => {
  const routes = await read('server/routes.ts');
  for (const fragment of ['/system/backups', '/system/security/status']) {
    const index = routes.indexOf(fragment);
    assert.ok(index >= 0, 'Missing backup/DR route: ' + fragment);
    const window = routes.slice(Math.max(0, index - 120), index + 900);
    assert.match(window, /requireAuth|requireMaster|requirePermission|backupAccessMiddleware/);
  }
});

test('production readiness exposes backup freshness and restore verification gates', async () => {
  const routes = await read('server/routes.ts');
  assert.match(routes, /restoreVerified/);
  assert.match(routes, /backupFresh/);
  assert.match(routes, /RPO|rpoMinutes|KAPITECH_POSTGRES_BACKUP_RPO_MINUTES/);
  assert.match(routes, /RTO|rtoMinutes|KAPITECH_POSTGRES_BACKUP_RTO_MINUTES/);
});
