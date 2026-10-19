import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file: string) => fs.readFileSync(file, 'utf8');

test('Tasks & Execution exposes canonical worksheets and role-safe query-driven navigation', () => {
  const workspace = read('src/components/admin/TasksWorkspace.tsx');

  assert.match(workspace, /const TASK_WORKSPACE_VIEWS = \[\s*\{ key: 'board', label: 'Board \/ Kanban' \},\s*\{ key: 'list', label: 'List' \}/);
  assert.match(workspace, /key: 'task-lists', label: 'Task Lists', available: false/);
  assert.match(workspace, /key: 'dependencies', label: 'Dependencies', available: false/);
  assert.ok(workspace.includes("searchParams.get('layout')"));
  assert.ok(workspace.includes("const layout: 'list' | 'board' = requestedLayout === 'board' ? 'board' : 'list'"));
  assert.ok(workspace.includes("canonicalParams.set('layout', 'list')"));
  assert.ok(workspace.includes("setSearchParams(canonicalParams, { replace: true })"));
  assert.ok(workspace.includes('data-ams-slug="tasks-workspace-tabs"'));
  assert.ok(workspace.includes('data-ams-slug="tasks-queue-tabs"'));
  assert.ok(workspace.includes('visibleTaskTabs.map((tab)'));
  assert.ok(workspace.includes('return canAccessAmsRoute(currentRole, target.pathname, target.search)'));
  assert.doesNotMatch(workspace, /data-ams-slug="tasks-mobile-tabs"/);
  assert.doesNotMatch(workspace, /data-ams-slug="tasks-layout-toggle"/);
});

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

test('Task workspace reconciles ambiguous task mutations against canonical server records', () => {
  const workspace = read('src/components/admin/TasksWorkspace.tsx');

  assert.ok(workspace.includes("const isUnknownMutationOutcome = (response: { success: boolean; status?: number }) =>"));
  assert.ok(workspace.includes("const loadTasks = async (showLoading = true, isActive: () => boolean = () => true): Promise<boolean>"));
  assert.ok(workspace.includes("const createOutcomeUnknown = isUnknownMutationOutcome(response)"));
  assert.ok(workspace.includes('Task status could not be confirmed.'));
  assert.ok(workspace.includes('Task creation result could not be confirmed.'));
  assert.ok(workspace.includes('Task edit result could not be confirmed.'));
  assert.ok(workspace.includes('Checklist result could not be confirmed.'));
  assert.ok(workspace.includes('Task deletion result could not be confirmed.'));
  const deleteStart = workspace.indexOf('const deleteTask = async');
  const deleteEnd = workspace.indexOf('const activeFilterCount', deleteStart);
  const deleteHandler = workspace.slice(deleteStart, deleteEnd);
  assert.ok(deleteHandler.includes("setDeleteTaskError(response.error || 'Task could not be deleted.');\n        return;"));
  assert.ok(workspace.includes('Some task update results were unknown.'));
  assert.ok(workspace.includes('Task status response did not include the saved record.'));
  assert.ok(workspace.includes('Task update response did not include the saved record.'));
  assert.ok(workspace.includes('Checklist response did not include the saved task record.'));
  assert.ok(workspace.includes('setSelectedTask(current => current ? normalized.find(task => task.id === current.id) || null : null);'));
  assert.ok(workspace.includes('setSelectedIds(current => current.filter(id => normalized.some(task => task.id === id)));'));
  assert.ok(workspace.includes('if (!refreshed) setRecords(previousRecords);'));
  assert.ok(workspace.includes("response.success && confirmedTask && String(confirmedTask.id || '') === task.id"));
});


test('Task workspace distinguishes an unavailable canonical source from empty and filtered-empty queues', () => {
  const workspace = read('src/components/admin/TasksWorkspace.tsx');

  assert.match(workspace, /const \[taskSourceEverLoaded, setTaskSourceEverLoaded\] = useState\(false\)/);
  assert.match(workspace, /setTaskSourceEverLoaded\(true\);\s*setRecords\(normalized\)/);
  assert.match(workspace, /data-ams-slug="tasks-source-unavailable"/);
  assert.match(workspace, /data-ams-slug="tasks-source-retry"/);
  assert.match(workspace, /onClick=\{\(\) => void loadTasks\(true\)\}/);
  assert.match(workspace, /!taskSourceEverLoaded \? \([\s\S]*?data-ams-slug="tasks-source-unavailable"/);
  assert.match(workspace, /data-ams-slug="tasks-board-empty-state"/);
  assert.match(workspace, /layout === 'board' && filteredRecords\.length === 0/);
  assert.match(workspace, /No tasks match these filters/);
  assert.match(workspace, /No matching tasks in this stage\./);
  assert.match(workspace, /w-\[280px\] shrink-0/);
  assert.doesNotMatch(workspace, /w-\[252px\]|sm:w-\[268px\]/);
});

test('Tasks & Execution task-date defaults use the local calendar rather than UTC date slicing', () => {
  const workspace = read('src/components/admin/TasksWorkspace.tsx');

  assert.match(
    workspace,
    /const formatLocalDateInputValue = \(date: Date = new Date\(\)\): string => \{\s*const year = date\.getFullYear\(\);\s*const month = String\(date\.getMonth\(\) \+ 1\)\.padStart\(2, '0'\);\s*const day = String\(date\.getDate\(\)\)\.padStart\(2, '0'\);\s*return year \+ '-' \+ month \+ '-' \+ day;\s*\};/
  );
  assert.equal((workspace.match(/dueDate: formatLocalDateInputValue\(\)/g) || []).length, 2,
    'Initial task creation and reopening the New Task form must use the same local-date helper.');
  assert.doesNotMatch(workspace, /dueDate:\s*new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/);
});
