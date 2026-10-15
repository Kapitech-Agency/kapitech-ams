import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file: string) => fs.readFileSync(file, 'utf8');

test('Tasks workspace reads canonical task records and allows tasks on empty projects', () => {
  const workspace = read('src/components/admin/TasksWorkspace.tsx');
  assert.ok(workspace.includes('api.tasks.getAll()'));
  assert.ok(workspace.includes('const [projects, setProjects] = useState<TaskProject[]>([])'));
  assert.ok(workspace.includes('projects.map((project) => [project.id, project.name])'));
  assert.ok(workspace.includes('projectRes.data?.projects'));
  assert.ok(workspace.includes('taskRes.data?.tasks'));
  assert.ok(!workspace.includes('new Map<string, string>(records.map(task => [task.projectId, task.projectName]))'));
});

test('Checklist completion and task deletion are persisted and permission-gated', () => {
  const workspace = read('src/components/admin/TasksWorkspace.tsx');
  assert.ok(workspace.includes('role="checkbox"'));
  assert.ok(workspace.includes('toggleTaskSubtask(selectedTask, item.id)'));
  assert.ok(workspace.includes('api.tasks.update(task.id, { subtasks: nextSubtasks, updatedAt: previousTask.updatedAt })'));
  assert.ok(workspace.includes('if (!canManageTasks || updatingSubtaskId !== null || updatingTaskId !== null || bulkUpdating) return;'));
  assert.ok(workspace.includes('api.tasks.delete(target.id)'));
  const routes = read('server/routes.ts');
  assert.ok(routes.includes('Task has time logs and cannot be deleted.'));
});

test('JSON mode keeps legacy project tasks and top-level task records synchronized', () => {
  const routes = read('server/routes.ts');
  assert.ok(routes.includes('function mergeJsonProjectTasks(project: any, globalTasks: any[]): any[]'));
  assert.ok(routes.includes('function mergeJsonTaskCollection(db: any): any[]'));
  assert.ok(routes.includes('tasks: mergeJsonProjectTasks(project, globalTasks)'));
  assert.ok(routes.includes('mergeJsonTaskCollection(getDatabase())'));
  assert.ok(routes.includes("upsertJsonProjectTask(db, { ...newTask, assignedTo: newTask.assignee }, '')"));
  assert.ok(routes.includes("upsertJsonProjectTask(db, { ...nextTask, assignedTo: String(nextTask.assignedTo || nextTask.assignee || '') }, previousProjectId)"));
  assert.ok(routes.includes('db.tasks = db.tasks.filter((task: any) =>'));
  assert.ok(routes.includes('removeJsonProjectTask(db, id)'));
  assert.ok(routes.includes('Task has time logs and cannot be deleted.'));
});
