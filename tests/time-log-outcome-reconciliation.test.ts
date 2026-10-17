import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Time Logs reconciles uncertain creates and deletes from canonical records', async () => {
  const page = await fs.readFile(path.join(root, 'src/pages/admin/AdminTimeLogs.tsx'), 'utf8');

  assert.ok(page.includes("const isUnknownMutationOutcome = (response: { success: boolean; status?: number }) =>"));
  assert.ok(page.includes('const load = async (showLoading = true): Promise<boolean>'));
  assert.ok(page.includes('Previously loaded records are kept.'));
  assert.ok(page.includes('const unknownOutcome = isUnknownMutationOutcome(res)'));
  assert.ok(page.includes('await load(false)'));
  assert.ok(page.includes('Time entry result could not be confirmed.'));
  assert.ok(page.includes('Time entry deletion result could not be confirmed.'));
  assert.ok(page.includes('Inspect it before entering the same work again.'));
  assert.ok(page.includes('Do not retry until the server state has been checked.'));
});

test('Time Logs retains the canonical API as the only mutation source', async () => {
  const page = await fs.readFile(path.join(root, 'src/pages/admin/AdminTimeLogs.tsx'), 'utf8');
  assert.ok(page.includes('api.timeLogs.create({'));
  assert.ok(page.includes('api.timeLogs.delete(log.id)'));
  assert.doesNotMatch(page, /localStorage|sessionStorage|demoLogs|sampleLogs|fixtureLogs/);
});
