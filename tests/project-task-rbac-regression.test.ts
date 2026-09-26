import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read=(p:string)=>fs.readFileSync(p,'utf8');

test('project task controls use task-specific permission in the admin UI',()=>{
  const s=read('src/pages/admin/AdminProjects.tsx');
  const taskSection=s.slice(s.indexOf('const handleAddTask'), s.indexOf('// Drag & Drop Handlers'));
  assert.match(taskSection,/canManageKanbanTasks/);
  assert.doesNotMatch(taskSection,/if \(!canManageProjects/);

  const board=s.slice(s.indexOf('Task Execution Board'), s.indexOf('CONTEXTUAL TASK DETAIL DRAWER'));
  assert.match(board,/draggable=\{canManageKanbanTasks\}/);
  assert.match(board,/\{canManageKanbanTasks && \(/);
});

test('project CRUD backend blocks unauthorized task mutation',()=>{
  const s=read('server/routes.ts');
  const start=s.indexOf("apiRouter.put('/projects/:id'");
  const block=s.slice(start,start+11000);
  assert.match(block,/Task mutations require task-management permission/);
  assert.match(block,/canManageKanbanTasks/);
});

test('task assignee UI uses server-side active-user directory',()=>{const api=read('src/lib/apiClient.ts');const ui=read('src/pages/admin/AdminProjects.tsx');const route=read('server/routes.ts');assert.match(api,/getTaskAssignees/);assert.match(ui,/taskAssignees/);assert.match(ui,/assignee\.username/);assert.match(route,/\/auth\/task-assignees/);assert.match(route,/canManageKanbanTasks/);});

test('assignee resolution excludes suspended users',()=>{const task=read('server/postgres-task-repository.ts');const project=read('server/postgres-project-repository.ts');assert.match(task,/status = \$2/);assert.match(task,/\[candidate, 'active'\]/);assert.match(project,/status = \$2/);assert.match(project,/\[candidate, 'active'\]/);});
