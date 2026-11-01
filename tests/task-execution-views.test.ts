import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { resolveTaskExecutionLayout, buildTaskExecutionLayoutHref } from '../src/lib/taskExecutionNavigation';
import { canAccessAmsRoute, type AmsRole } from '../src/lib/amsNavigationAccess';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = buildSync({ entryPoints: [path.join(root, 'src/components/admin/tasks/TaskExecutionViews.tsx')], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', alias: { 'lucide-react': path.join(root, 'src/lib/untitled-ui-icon-bridge.tsx') }, loader: { '.css': 'empty' } });
const compiled = { exports: {} as any };
const require = createRequire(import.meta.url);
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(require, compiled, compiled.exports);
const { TaskExecutionList, TaskExecutionCard, TaskProjectQueues, TaskBlockedWork } = compiled.exports;
const { MemoryRouter } = require('react-router-dom');
const noop = () => {};
const task = { id: 'qa-task', slug: 'qa-task', title: 'QA creative and API review', description: 'Inspect the visual brief and API acceptance evidence.', projectId: 'qa-project-id', projectName: 'QA delivery project', projectSlug: 'derived-name-is-not-the-id', clientName: 'QA client', assigneeId: 'qa-person', assignee: 'QA specialist', priority: 'high', status: 'review', dueDate: '2030-01-01', tags: ['waiting'], blocked: true, createdAt: '2026-01-01', subtasks: [{ id: 'qa-check', title: 'QA checklist item', completed: false }] };
const actions = { onOpen: noop, formatDue: (value: string) => value || 'No due date', dueState: () => 'scheduled', projectHref: () => '/admin/projects?projects=sprint&project=qa-project-id' };
const render = (Component: React.ElementType, props = {}) => renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Component, { ...actions, ...props })));

test('Task layout aliases resolve to supported views while preserving role and personal scope', () => {
  assert.equal(resolveTaskExecutionLayout(null), 'board');
  assert.equal(resolveTaskExecutionLayout('task-lists'), 'projects');
  assert.equal(resolveTaskExecutionLayout('dependencies'), 'blockers');
  assert.equal(resolveTaskExecutionLayout('unknown'), 'board');
  for (const role of ['Admin', 'PM', 'Creative', 'Finance', 'Freelancer'] as AmsRole[]) {
    const params = new URLSearchParams(role === 'PM' ? 'taskscope=my' : 'taskscope=my&workspace=project');
    for (const layout of ['board', 'list', 'projects', 'blockers'] as const) {
      const target = new URL(buildTaskExecutionLayoutHref(params, layout), 'https://ams.kapitech.local');
      assert.equal(target.searchParams.get('taskscope'), 'my');
      assert.equal(target.searchParams.get('workspace'), params.get('workspace'));
      assert.equal(canAccessAmsRoute(role, target.pathname, target.search), canAccessAmsRoute(role, '/admin/tasks', params.toString()));
    }
  }
});

test('List retains task brief context, ownership, checklist and sort semantics with read-only guards', () => {
  const html = render(TaskExecutionList, { rows: [task], canManage: false, selectedIds: [], allVisibleSelected: false, onSelect: noop, onSelectVisible: noop, sortKey: 'priority', sortDirection: 'desc', onSort: noop });
  for (const value of ['QA creative and API review', 'QA delivery project', 'QA client', 'QA specialist', 'High', 'Review', 'Blocked / waiting', '0/1 checklist items']) assert.ok(html.includes(value), value);
  assert.match(html, /aria-sort="descending"/);
  assert.match(html, /aria-label="Scrollable task register"/);
  assert.doesNotMatch(html, /Select visible tasks|Edit task|Change stage for/);
});

test('Allowed List editing uses the existing callbacks and disables conflicting selection while busy', () => {
  const html = render(TaskExecutionList, { rows: [task], canManage: true, selectedIds: [], allVisibleSelected: false, onSelect: noop, onSelectVisible: noop, sortKey: 'priority', sortDirection: 'desc', onSort: noop, onStatus: noop, onEdit: noop, mutating: true });
  assert.match(html, /Select visible tasks/);
  assert.match(html, /Edit task QA creative and API review/);
  assert.match(html, /Change stage for QA creative and API review/);
  assert.match(html, /disabled=""/);
});

test('Missing dates and assignees do not become scheduled work or invented people', () => {
  const html = render(TaskExecutionCard, { task: { ...task, dueDate: '', assignee: '', assigneeId: '' }, projectHref: () => undefined });
  assert.match(html, /No due date/);
  assert.match(html, /Unassigned/);
  assert.doesNotMatch(html, />Scheduled<|Open project delivery for/);
});

test('Project queues group by canonical IDs, retain separate same-name projects and do not invent saved lists', () => {
  const html = render(TaskProjectQueues, { records: [task, { ...task, id: 'qa-two', status: 'done' }, { ...task, id: 'qa-three', projectId: 'qa-other-project', clientName: 'QA other client' }] });
  assert.equal((html.match(/<details/g) || []).length, 2);
  assert.match(html, /2 tasks/);
  assert.match(html, /QA other client/);
  assert.match(html, /Counts reflect the selected queue and filters/);
  assert.doesNotMatch(html, /Create list|Save list|Project progress|capacity/);
});

test('Blocked work preserves completed flagged tasks and does not fabricate dependency or clearance records', () => {
  const html = render(TaskBlockedWork, { rows: [{ ...task, status: 'done' }] });
  assert.match(html, /Done/);
  assert.match(html, /Blocked \/ waiting/);
  assert.match(html, /Inspect the visual brief/);
  assert.match(html, /prerequisite task or blocker reason is not recorded/);
  assert.doesNotMatch(html, /Create dependency|Clear dependency|Unblock task/);
  assert.match(render(TaskBlockedWork, { rows: [] }), /No blocked or waiting tasks in this view/);
});
