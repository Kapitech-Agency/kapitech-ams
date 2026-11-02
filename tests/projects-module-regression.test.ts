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
  assert.ok(source.includes("const view: ProjectsView = requestedView === 'overview'"));
  assert.ok(source.includes("requestedView === 'sprint' || requestedView === 'budget' || requestedView === 'archived'"));
  assert.ok(source.includes("if (requestedView && !['overview', 'all', 'sprint', 'budget', 'archived', 'planning-delivery', 'resources', 'content-campaigns', 'controls', 'planning', 'active', 'on-hold', 'completed'].includes(requestedView))"));
  assert.ok(source.includes("const requestedLayout = searchParams.get('layout')"));
  assert.ok(source.includes("requestedLayout === 'board' ? 'board' : requestedLayout === 'timeline' ? 'timeline' : 'table'"));
  assert.ok(source.includes("searchParams.get('layout') === 'board' ? 'board' : searchParams.get('layout') === 'timeline' ? 'timeline' : 'table'"));
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
  assert.ok(source.includes('const persistedTask = response.data?.task ? normalizeTask(response.data.task) : null'));
  assert.ok(source.includes('if (!persistedTask)'));
  assert.ok(source.includes('The server did not return the saved task record.'));
  assert.ok(!source.includes('const localTask: ProjectTask'));
  assert.ok(!source.includes("'demo_task_' + Date.now()"));
  assert.ok(source.includes('const syncProjects = async (showLoading = true) =>'));
  assert.ok(source.includes('await syncProjects(false)'));
  const taskSaveStart = source.indexOf('const saveTask = async');
  const taskSaveEnd = source.indexOf('const updateTaskStatus = async', taskSaveStart);
  const taskSave = source.slice(taskSaveStart, taskSaveEnd);
  assert.ok(taskSave.includes('} catch (error) {'));
  assert.ok(taskSave.includes('Task could not be saved.'));
  assert.ok(taskSave.includes('if (savedToData) setTaskDrawerOpen(false)'));
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
  assert.ok(source.includes('projects-overview-workspace'));
  assert.ok(source.includes("title={view === 'overview' ? 'Project Overview'"));
  assert.ok(source.includes('Delivery exceptions'));
  assert.ok(source.includes('Project status distribution'));
  const overviewStart = source.indexOf('data-ams-feature-slug="projects-overview-workspace"');
  const overviewEnd = source.indexOf('<ProjectDeliveryWorkspaces', overviewStart);
  assert.ok(overviewStart >= 0 && overviewEnd > overviewStart, 'Project Overview should have a bounded source section');
  const overview = source.slice(overviewStart, overviewEnd);
  const primary = overview.indexOf('data-ams-feature-slug="projects-overview-primary"');
  const exceptions = overview.indexOf('title="Delivery exceptions"', primary);
  const distribution = overview.indexOf('title="Project status distribution"', exceptions);
  const supporting = overview.indexOf('data-ams-feature-slug="projects-overview-supporting-metrics"', distribution);
  const summary = overview.indexOf('aria-label="Project delivery summary"', supporting);
  assert.ok(primary >= 0 && exceptions > primary && distribution > exceptions && supporting > distribution && summary > supporting,
    'Delivery exceptions and status distribution should lead the supporting summary metrics.');
  assert.doesNotMatch(overview.slice(supporting, summary), /label: 'Delivery exceptions'/,
    'The exception count must not be duplicated as a KPI alongside the exception register.');
  assert.match(overview, /min-\[1100px\]:grid-cols-\[minmax\(0,7fr\)_minmax\(0,5fr\)\]/);
  assert.doesNotMatch(overview, /xl:grid-cols-\[minmax\(0,7fr\)_minmax\(0,5fr\)\]/);
  assert.ok(source.includes('<ProjectDeliveryWorkspaces workspace={view as DeliveryWorkspace}'));
  assert.ok(source.includes('recordedCost={getRecordedExpense}'));
  assert.ok(source.includes('onRefresh={() => void syncProjects()}'));
  assert.ok(source.includes("value: serverMode ? metrics.averageProgress + '%' : '—'"));
  assert.match(source, /AdminStatusBadge tone=\{serverMode \? 'success' : loading \? 'info' : 'warning'\}/);
  assert.match(source, /serverMode \? 'Live project data' : loading \? 'Loading project records' : 'Project data unavailable'/);
  assert.ok(source.includes("change: serverMode ? activeProjects.length + ' open projects'"));
  assert.ok(source.includes("label: project.name + (project.status === 'completed' ? ' (Completed)' : '')"));
  assert.ok(source.includes("selectedSprintProject.status === 'completed' ? 'Completed project' : 'Active delivery'"));
});

test('Completed projects remain inspectable but cannot receive new tasks', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes("if (selectedSprintProject.status === 'completed')"));
  assert.ok(source.includes("Completed projects cannot receive new tasks."));
  assert.ok(source.includes("selectedSprintProject.status !== 'completed'"));
  assert.ok(source.includes("project.id === taskForm.projectId"));
});

test('Projects board, table, sprint, budget, and archive expose loading or empty states', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  const records = await read('src/components/admin/projects/ProjectRegistryRecords.tsx');
  assert.ok(records.includes("No projects have been created yet."));
  assert.ok(records.includes("Project records unavailable"));
  assert.ok(records.includes("Loading project registry"));
  assert.ok(source.includes('Loading project delivery'));
  assert.ok(source.includes("loading && view === 'budget'"));
});

test('Sprint task sorting uses a transitive status order with stable priority and due-date tie-breakers', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes('const statusOrder = TASK_COLUMNS.findIndex(column => column.id === a.status)'));
  assert.ok(source.includes('if (statusOrder !== 0) return statusOrder;'));
  assert.ok(source.includes('PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]'));
  assert.ok(source.includes("(a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31')"));
  assert.ok(!source.includes('if (a.status !== b.status) return 0;'));
});

test('Project details expose client, schedule, team, technology, and milestone context', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes("['Start date', formatDate(selectedProjectDetail.startDate)]"));
  assert.ok(source.includes("['Client contact', selectedProjectDetail.clientName || 'Not provided']"));
  assert.ok(source.includes("['Client email', selectedProjectDetail.clientEmail || 'Not provided']"));
  assert.ok(source.includes('>Team members</div>'));
  assert.ok(source.includes('>Technology stack</div>'));
  assert.ok(source.includes('aria-label="Project milestones"'));
  assert.ok(source.includes("milestone.completed ? 'Completed' : overdueMilestone ? 'Overdue' : 'Upcoming'"));
  assert.ok(source.includes("formatAmount(milestone.paymentTrigger, currency)"));
});

test('Project edits preserve the original server timestamp for optimistic concurrency', async () => {
  const page = await read('src/pages/admin/AdminProjects.tsx');
  const repository = await read('server/postgres-project-repository.ts');

  assert.ok(page.includes('updatedAt: editingProject?.updatedAt || now'));
  assert.ok(page.includes('The server will issue the new updatedAt value after a successful write.'));
  assert.ok(repository.includes('if (patch.updatedAt && iso(current.updated_at) !== patch.updatedAt) throw new ProjectConcurrencyError();'));
});

test('Ambiguous project and task mutation responses refresh canonical records instead of rolling back blindly', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(source.includes('const isUnknownMutationOutcome = (response: { success: boolean; status?: number }) =>'));
  assert.ok(source.includes('!response.success && (response.status === undefined || response.status >= 500)'));
  assert.ok(source.includes('if (isUnknownMutationOutcome(response)) {\n          await syncProjects(false);\n          setProjectDrawerOpen(false);'));
  assert.ok(source.includes('setTaskDrawerOpen(false);'));
  assert.ok(source.includes('Task status outcome is unknown. Canonical records were refreshed.'));
  assert.ok(source.includes('Task status outcome is unknown. Canonical records were refreshed.'));
  assert.ok(source.includes('Project status outcome is unknown. Canonical records were refreshed.'));
  assert.ok(source.includes('Checklist update outcome is unknown. Canonical records were refreshed.'));
  assert.ok(source.includes('Project deletion outcome is unknown.'));
  assert.ok(source.includes('Task deletion outcome is unknown.'));
  assert.ok(source.includes('return true;') && source.includes('return false;'));
  assert.ok(source.includes('if (!refreshed) rollback();'));
  assert.ok(source.includes('if (!refreshed) applySubtasks(previousSubtasks);'));
});


test('Project Registry deadline filtering uses explicit local-date ranges and resets with the register controls', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');

  assert.match(source, /projectDeadlineFilter, setProjectDeadlineFilter.*useState<ProjectDeadlineFilter>\('all'\)/);
  assert.match(source, /aria-label="Filter projects by deadline"/);
  assert.match(source, /label: 'Due in next 7 days'/);
  assert.match(source, /label: 'Due in 8–30 days'/);
  assert.match(source, /label: 'No \/ invalid deadline'/);
  assert.match(source, /matchesProjectDeadlineFilter\(project, projectDeadlineFilter, projectFilterToday\)/);
  assert.match(source, /projectDeadlineFilter === 'all' \? '' : projectDeadlineFilter/);
  assert.match(source, /setProjectDeadlineFilter\('all'\)/);
  assert.match(source, /projectDeadlineFilter, projectSort, reportPeriodValue, reportPeriodEnabled/);
  assert.match(source, /if \(view !== 'all' && projectDeadlineFilter !== 'all'\) setProjectDeadlineFilter\('all'\)/);
});


test('Remaining project workspaces use the shared delivery composition without changing data or mutation ownership', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');
  const presentation = await read('src/components/admin/projects/ProjectDeliveryWorkspaces.tsx');
  assert.match(source, /workspace=\{view as DeliveryWorkspace\} projects=\{projects\} loading=\{loading\} available=\{serverMode\}/);
  assert.match(source, /onEdit=\{canManageProjects \? project => openEditProject/);
  assert.match(source, /canAccessAmsRoute\(currentAmsRole, target.pathname, target.search\)/);
  assert.match(source, /recordedCost=\{getRecordedExpense\}/);
  assert.match(presentation, /AdminFilterToolbar/);
  assert.match(presentation, /AdminDataTableShell embedded/);
  assert.match(presentation, /<Drawer/);
  assert.doesNotMatch(presentation, /api\.|localStorage|fetch\(/);
});

test('Project Overview uses shared empty states and exposes source-backed milestone navigation', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');
  const overview = source.slice(source.indexOf('data-ams-feature-slug="projects-overview-workspace"'), source.indexOf('<ProjectDeliveryWorkspaces', source.indexOf('data-ams-feature-slug="projects-overview-workspace"')));
  assert.match(overview, /DashboardEmptyState/);
  assert.match(overview, /title="Overdue milestones"/);
  assert.match(overview, /planningWorksheetHref\('milestones'\)/);
  assert.match(overview, /!milestone.completed && isOverdue\(milestone.dueDate\)/);
  assert.match(overview, /onClick=\{\(\) => openProjectDetail\(project\)\}/);
  assert.match(overview, /title="Tasks in review"/);
  assert.match(source, /task.status === 'review'/);
  assert.match(overview, /setPendingReviewTask\(\{ projectId: project.id, taskId: task.id \}\); goToSprint\(project\)/);
  assert.match(source, /selectedSprintProject\?\.id !== pendingReviewTask.projectId/);
  assert.match(source, /selectedSprintProject.tasks.find\(item => item.id === pendingReviewTask.taskId\)/);
  assert.doesNotMatch(overview, /title="Delivery coverage"/);
  assert.match(overview, /Client approval and a designated reviewer are not recorded here/);
  assert.doesNotMatch(overview, /localStorage|Math.random|Design preview/);
});


test('Projects Overview equalizes all operational cards in one grid and keeps compact summaries secondary', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');
  const css = await read('src/components/admin/ProjectsOverview.css');
  const overview = source.slice(source.indexOf('data-ams-feature-slug="projects-overview-workspace"'), source.indexOf('<ProjectDeliveryWorkspaces', source.indexOf('data-ams-feature-slug="projects-overview-workspace"')));
  assert.equal((overview.match(/className="ams-projects-overview-panel ams-operational-panel ams-overview-panel"/g) || []).length, 4);
  assert.equal((overview.match(/ams-projects-overview-grid/g) || []).length, 1);
  assert.match(css, /grid-auto-rows:minmax\(330px,1fr\)/);
  assert.match(css, /ams-projects-overview-panel \{[^}]*height:100%/);
  assert.doesNotMatch(css, /align-self:start/);
  assert.match(overview, /role="region" aria-label="Tasks awaiting review" tabIndex=\{0\}/);
  assert.doesNotMatch(overview, /\.slice\(0,/);
  assert.ok(overview.indexOf('title="Tasks in review"') < overview.indexOf('projects-overview-supporting-metrics'));
});


test('Project detail retains its originating workspace and review drawers close when leaving execution', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');
  const start = source.indexOf('const openProjectDetail =');
  const end = source.indexOf('const openNewProject =', start);
  const selection = source.slice(start, end);
  assert.ok(selection.includes("if (!next.get('projects')) next.set('projects', view)"));
  assert.ok(selection.includes("if (view === 'all' && !next.get('projects')) next.set('projects', 'all')"));
  assert.match(source, /if \(view !== 'sprint'\) setSelectedTask\(null\);\s*\}, \[view\]\)/);
  const openView = source.slice(source.indexOf('const openView ='), source.indexOf('const openLayout ='));
  assert.ok(openView.includes("next.set('projects', nextView)"));
  assert.doesNotMatch(openView, /delete\('projects'\)/);
  const openLayout = source.slice(source.indexOf('const openLayout ='), source.indexOf('const goToSprint ='));
  assert.ok(openLayout.includes("if (view === 'all' && !next.get('projects')) next.set('projects', 'all')"));
});
