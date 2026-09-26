import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('financial mutation routes require explicit authorization', async () => {
  const routes = await read('server/routes.ts');
  const sensitive = [
    '/finance/invoices',
    '/finance/expenses',
    '/finance/invoices/:id/pay',
    '/crm/proposals/:id/approve',
    '/approvals/:id/action'
  ];
  for (const fragment of sensitive) {
    const index = routes.indexOf(fragment);
    assert.ok(index >= 0, 'Missing financial route: ' + fragment);
    const window = routes.slice(Math.max(0, index - 120), index + 700);
    assert.match(window, /requireAuth|requirePermission|requireAnyPermission|requireMaster/,
      'Financial mutation route lacks authorization: ' + fragment);
  }
});

test('approval action retains maker-checker self-action protection', async () => {
  const routes = await read('server/routes.ts');
  const index = routes.indexOf('/approvals/:id/action');
  assert.ok(index >= 0);
  const window = routes.slice(index, index + 5000);
  assert.match(window, /requesterId/);
  assert.match(window, /requester.*actor|actor.*requester|self/i);
  assert.match(window, /Approve|Reject|Request Changes/);
});
