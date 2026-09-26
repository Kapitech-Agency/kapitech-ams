import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Notification state mutations retain audit coverage', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  assert.equal((source.match(/action: 'NOTIFICATION_READ'/g) || []).length, 1);
  assert.equal((source.match(/action: 'NOTIFICATIONS_MARKED_ALL_READ'/g) || []).length, 1);
  assert.ok(source.includes("apiRouter.post('/notifications/:id/read', requireAuth"));
  assert.ok(source.includes("apiRouter.post('/notifications/mark-all-read', requireAuth"));
});
