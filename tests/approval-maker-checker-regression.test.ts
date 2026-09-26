import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Legacy approval requester identity is resolved before self-action blocking', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  const actionStart = source.indexOf("apiRouter.post('/approvals/:id/action'");
  const action = source.slice(actionStart, actionStart + 9000);
  const resolveIndex = action.indexOf('if (!requesterId && item.requester)');
  const selfBlockIndex = action.indexOf('if (requesterId && requesterId === req.user!.id)');
  assert.ok(resolveIndex >= 0);
  assert.ok(selfBlockIndex >= 0);
  assert.ok(resolveIndex < selfBlockIndex, 'Legacy requester must be resolved before maker-checker enforcement.');
});
test('JSON approval self-action checks identity before mutating approval state', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  const actionStart = source.indexOf("apiRouter.post('/approvals/:id/action'");
  const action = source.slice(actionStart, actionStart + 9000);
  const selfBlockIndex = action.indexOf('if (requesterId && requesterId === req.user!.id)');
  const mutationIndex = action.indexOf("item.status = action === 'Approve'");
  assert.ok(selfBlockIndex >= 0);
  assert.ok(mutationIndex >= 0);
  assert.ok(selfBlockIndex < mutationIndex, 'Self-action must be rejected before approval state is mutated.');
});
