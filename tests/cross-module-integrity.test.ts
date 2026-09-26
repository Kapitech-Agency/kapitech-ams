import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('time-log writes reject a task that belongs to a different project', async () => {
  const source = await read('server/postgres-time-log-repository.ts');
  assert.match(source, /SELECT id, project_id FROM tasks WHERE id = \$1/);
  assert.match(source, /Task does not belong to the selected project/);
  assert.match(source, /if \(resolvedProjectId && taskProjectId !== resolvedProjectId\)/);
});
