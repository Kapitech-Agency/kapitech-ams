import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('time log creation rejects a task with no project when a project is explicitly selected', () => {
  const source = fs.readFileSync('server/postgres-time-log-repository.ts', 'utf8');
  const start = source.indexOf('if (taskId)');
  const end = source.indexOf('const metadata = logMetadata', start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.match(block, /taskProjectId !== resolvedProjectId/);
  assert.doesNotMatch(block, /resolvedProjectId && taskProjectId && taskProjectId !== resolvedProjectId/);
  assert.match(block, /Task must belong to a project before time can be logged/);
  assert.match(source, /Time log must reference a project or task/);
});

test('PostgreSQL enforces time-log project/task integrity at database level', () => {
  const source = fs.readFileSync('db/postgres/026_time_log_project_integrity.sql', 'utf8');
  assert.match(source, /TIME_LOG_TASK_PROJECT_INCONSISTENCY/);
  assert.match(source, /TIME_LOG_PROJECT_REQUIRED/);
  assert.match(source, /TIME_LOG_TASK_NOT_FOUND/);
  assert.match(source, /TIME_LOG_TASK_PROJECT_REQUIRED/);
  assert.match(source, /TIME_LOG_TASK_PROJECT_MISMATCH/);
  assert.match(source, /CREATE TRIGGER time_logs_task_project_integrity_v1/);
  assert.match(source, /CREATE TRIGGER tasks_project_move_integrity_v1/);
  assert.match(source, /BEFORE INSERT OR UPDATE OF project_id, task_id ON time_logs/);
  assert.match(source, /BEFORE UPDATE OF project_id ON tasks/);
});
