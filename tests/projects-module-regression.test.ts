import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Projects module normalizes URL view and keeps layout in sync with browser navigation', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes("const requestedView = searchParams.get('projects');"));
  assert.ok(source.includes("requestedView === 'sprint' || requestedView === 'budget' || requestedView === 'archived'"));
  assert.ok(source.includes("if (requestedView && !['sprint', 'budget', 'archived'].includes(requestedView))"));
  assert.ok(source.includes("setProjectLayout(searchParams.get('layout') === 'table' ? 'table' : 'board')"));
});

test('Project date defaults use local calendar and malformed numbers normalize safely', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes('now.getFullYear()'));
  assert.ok(source.includes('now.getMonth() + 1'));
  assert.ok(source.includes('now.getDate()'));
  assert.ok(source.includes('Number.isFinite(parsed) ? parsed : fallback'));
  assert.ok(source.includes('budget: Math.max(0, toFiniteNumber(project?.budget))'));
  assert.ok(source.includes('progressPercent: Math.min(100, Math.max(0, toFiniteNumber(project?.progressPercent)))'));
});

test('Project form rejects invalid numeric values and deadlines before start dates', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes('!Number.isFinite(budget)'));
  assert.ok(source.includes('!Number.isFinite(progress)'));
  assert.ok(source.includes('budget > 100_000_000_000'));
  assert.ok(source.includes('projectForm.targetEndDate < projectForm.startDate'));
});

test('Successful project and task writes update local state before non-blocking revalidation', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes('const persistedProject = response.data?.project ? normalizeProject(response.data.project) : null'));
  assert.ok(source.includes('const persistedTask = response.data?.task ? normalizeTask(response.data.task) : localTask'));
  assert.ok(source.includes('const syncProjects = async (showLoading = true) =>'));
  assert.ok(source.includes('await syncProjects(false)'));
});

test('Sprint project switching clears stale task details, filters, and drag state', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  const selectorStart = source.indexOf('aria-label="Select sprint project"');
  const selectorBlock = source.slice(Math.max(0, selectorStart - 1400), selectorStart + 300);
  assert.ok(selectorBlock.includes('setSelectedTask(null)'));
  assert.ok(selectorBlock.includes("setTaskSearch('')"));
  assert.ok(selectorBlock.includes("setTaskPriorityFilter('')"));
  assert.ok(selectorBlock.includes("setTaskAssigneeFilter('')"));
  assert.ok(selectorBlock.includes('setDraggingTaskId(null)'));
});

test('Checklist updates respect task permission and roll back optimistic changes on server rejection', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes('if (!canManageKanbanTasks || updatingSubtaskId || movingTaskId || !selectedSprintProject) return;'));
  assert.ok(source.includes('disabled={!canManageKanbanTasks || updatingSubtaskId !== null || Boolean(movingTaskId)}'));
  assert.ok(source.includes('Checklist is read-only for your current role.'));
  assert.ok(source.includes('applySubtasks(previousSubtasks)'));
  assert.ok(source.includes('setUpdatingSubtaskId(null)'));
  assert.ok(source.includes('aria-busy={updatingSubtaskId === item.id}'));
});

test('Project and task mutation entry points retain explicit permission guards', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes('if (!canManageProjects || saving) return;'));
  assert.ok(source.includes('if (!canManageKanbanTasks || saving || movingTaskId || updatingSubtaskId) return;'));
  assert.ok(source.includes('if (!canManageProjects || !deleteProject || deletingProjectRecord) return;'));
  assert.ok(source.includes('if (!canManageKanbanTasks || !deleteTask || !selectedSprintProject || deletingTaskRecord) return;'));
});

test('Toast timers are replaced and cleared on unmount', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes('if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current)'));
  assert.ok(source.includes('if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current);'));
  assert.ok(source.includes('toastTimeoutRef.current = null'));
});

test('Interactive project and task details follow the shared Drawer guideline', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.match(source, /<Drawer\s+open=\{Boolean\(selectedProjectDetail\)\}/);
  assert.match(source, /<Drawer\s+open=\{Boolean\(selectedTask\)\}/);
  assert.match(source, /<Modal\s+open=\{Boolean\(deleteProject\)\}/);
  assert.match(source, /<Modal\s+open=\{Boolean\(deleteTask\)\}/);
  assert.doesNotMatch(source, /<Modal\s+open=\{Boolean\(selectedTask\)\}/);
  assert.doesNotMatch(source, /<Modal\s+open=\{Boolean\(selectedProjectDetail\)\}/);
});

test('Project overview metrics and sprint project selection describe their actual context', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes("label: 'Average project progress'"));
  assert.ok(source.includes("value: metrics.averageProgress + '%'"));
  assert.ok(source.includes("view === 'archived' ? archivedProjects.length + ' Completed Projects' : activeProjects.length + ' Active Projects'"));
  assert.ok(source.includes("label: project.name + (project.status === 'completed' ? ' (Completed)' : '')"));
  assert.ok(source.includes("selectedSprintProject.status === 'completed' ? 'Completed project' : 'Active delivery'"));
});
