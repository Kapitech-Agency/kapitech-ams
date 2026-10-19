import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = () => fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-task-repository.ts'), 'utf8');

test('task mutations lock parent projects before task rows and bump project updated_at', () => {
  const repository = source();

  assert.match(repository, /SELECT id FROM projects WHERE id = \$1 FOR UPDATE/);
  assert.match(repository, /UPDATE projects SET updated_at = NOW\(\) WHERE id = \$1/);
  assert.match(repository, /SELECT \* FROM tasks WHERE id = \$1 FOR UPDATE/);
  assert.match(repository, /SELECT project_id, updated_at FROM tasks WHERE id = \$1 LIMIT 1/);
  assert.match(repository, /Array\.from\(new Set\(\[currentProjectId, requestedProjectId\]/);
  assert.match(repository, /SELECT project_id FROM tasks WHERE id=\$1 LIMIT 1/);
  assert.match(repository, /SELECT id, project_id FROM tasks WHERE id=\$1 FOR UPDATE/);
});

test('task update locks all affected parent projects before locking the task row', () => {
  const repository = source();
  const updateStart = repository.indexOf('  async update(');
  const deleteStart = repository.indexOf('  async delete(', updateStart);
  assert.ok(updateStart >= 0 && deleteStart > updateStart);

  const updateBody = repository.slice(updateStart, deleteStart);
  const projectLock = updateBody.indexOf('SELECT id FROM projects WHERE id = $1 FOR UPDATE');
  const taskLock = updateBody.indexOf('SELECT * FROM tasks WHERE id = $1 FOR UPDATE');

  assert.ok(projectLock >= 0, 'update flow must lock the parent project');
  assert.ok(taskLock > projectLock, 'update flow must lock the parent project before the task');
});
