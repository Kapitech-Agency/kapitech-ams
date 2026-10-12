import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Tasks workspace Kanban supports permission-aware drag/drop and keyboard stage movement', async () => {
  const source = await read('src/components/admin/TasksWorkspace.tsx');

  assert.ok(source.includes('data-ams-feature-slug="tasks-board-view"'));
  assert.ok(source.includes('const beginBoardTaskDrag ='));
  assert.ok(source.includes('const handleBoardTaskDrop ='));
  assert.ok(source.includes("event.key === 'ArrowLeft'"));
  assert.ok(source.includes("event.key !== 'ArrowRight'"));
  assert.ok(source.includes("dataTransfer.setData('text/ams-task-id', task.id)"));
  assert.ok(source.includes("api.tasks.update(task.id, { status: nextStatus })"));
  assert.ok(source.includes('setSelectedTask(current => current?.id === committedTask.id ? committedTask : current)'));
  assert.ok(source.includes('disabled={updatingTaskId !== null || bulkUpdating}'));
});

test('Sprint Kanban keeps selected task state consistent with optimistic save and rollback', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes('const [movingTaskId, setMovingTaskId] = useState<string | null>(null)'));
  assert.ok(source.includes('setSelectedTask(current => current?.id === task.id ? { ...current, status } : current)'));
  assert.ok(source.includes('setSelectedTask(current => current?.id === task.id ? { ...current, status: task.status } : current)'));
  assert.ok(source.includes('setMovingTaskId(null);'));
  assert.ok(source.includes("onClick={() => void updateTaskStatus(selectedTask, column.id)}"));
  assert.ok(!source.includes('setSelectedTask({ ...selectedTask, status: column.id })'));
  assert.ok(source.includes('disabled={!canManageKanbanTasks || Boolean(movingTaskId) || updatingSubtaskId !== null || selectedTask.status === column.id}'));
});

test('Projects and Sprint Kanban drag handles provide keyboard operation and respect in-flight moves', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes("event.key !== 'ArrowLeft'"));
  assert.ok(source.includes("event.key !== 'ArrowRight'"));
  assert.ok(source.includes("draggable={canManageProjects && !movingProjectId}"));
  assert.ok(source.includes("draggable={canManageKanbanTasks && !movingTaskId && updatingSubtaskId === null}"));
  assert.ok(source.includes("if (!canManageProjects || movingProjectId)"));
  assert.ok(source.includes("if (!canManageKanbanTasks || movingTaskId || updatingSubtaskId)"));
});

test('horizontal board scrolling does not steal pointer interactions from Kanban drag handles', async () => {
  const source = await read('src/lib/useDragToScroll.ts');

  assert.ok(source.includes("target.closest('[data-drag-handle]')"));
  assert.ok(source.includes('draggable="true"'));
});


test('Tasks workspace keeps Kanban drop lanes available when filters return no matches', async () => {
  const source = await read('src/components/admin/TasksWorkspace.tsx');

  assert.ok(source.includes("filteredRecords.length === 0 && layout !== 'board'"));
  assert.ok(source.includes("data-ams-slug={'tasks-column-' + column.status}"));
  assert.ok(source.includes("{!columnTasks.length && ("));
});

test('Kanban drag handles use native button semantics and visible design-system keyboard focus', async () => {
  const workspace = await read('src/components/admin/TasksWorkspace.tsx');
  const projects = await read('src/pages/admin/AdminProjects.tsx');

  for (const source of [workspace, projects]) {
    assert.ok(source.includes('type="button"'));
    assert.ok(source.includes('focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'));
    assert.ok(source.includes('aria-keyshortcuts="ArrowLeft ArrowRight Enter Space"'));
  }

  assert.ok(projects.includes("!target?.closest('[data-drag-handle=\"true\"]') && target?.closest('button,a,input,textarea,select,[data-no-drag=\"true\"]')"));
});
