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
  assert.ok(source.includes("if (requestedView && !['overview', 'all', 'sprint', 'budget', 'archived', 'planning-delivery', 'resources', 'planning', 'active', 'on-hold', 'completed'].includes(requestedView))"));
  assert.ok(source.includes("const requestedLayout = searchParams.get('layout')"));
  assert.ok(source.includes("requestedLayout === 'table' ? 'table' : requestedLayout === 'timeline' ? 'timeline' : 'board'"));
  assert.ok(source.includes("searchParams.get('layout') === 'table' ? 'table' : searchParams.get('layout') === 'timeline' ? 'timeline' : 'board'"));
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
  const overviewEnd = source.indexOf("{view === 'planning-delivery' && (", overviewStart);
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
  assert.match(overview, /min-\[1100px\]:grid-cols-\[minmax\(0,1\.45fr\)_minmax\(280px,0\.75fr\)\]/);
  assert.doesNotMatch(overview, /xl:grid-cols-\[minmax\(0,1\.45fr\)_minmax\(280px,0\.75fr\)\]/);
  assert.ok(source.includes('projects-planning-delivery-workspace'));
  assert.ok(source.includes('title="Project timeline"'));
  assert.ok(source.includes('title="Milestones"'));
  assert.ok(source.includes("searchParams.get('planningView')"));
  assert.ok(source.includes("next.delete('planningView')"));
  assert.ok(source.includes('Project brief notes'));
  assert.ok(source.includes('Not tracked as separate project records'));
  assert.ok(source.includes("next.set('planningProject', value)"));
  assert.ok(source.includes('projects-resources-workspace'));
  assert.ok(source.includes('Recorded resource allocation'));
  assert.ok(source.includes("next.set('resourcesProject', value)"));
  assert.ok(source.includes('Capacity and availability'));
  assert.ok(source.includes("value: serverMode ? metrics.averageProgress + '%' : '—'"));
  assert.match(source, /AdminStatusBadge tone=\{serverMode \? 'success' : loading \? 'info' : 'warning'\}/);
  assert.match(source, /serverMode \? 'Live project data' : loading \? 'Loading project records' : 'Project data unavailable'/);
  assert.ok(source.includes("change: serverMode ? activeProjects.length + ' active projects'"));
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

  assert.ok(source.includes("No projects yet. Create a project to start the portfolio."));
  assert.ok(source.includes("No projects have been created yet."));
  assert.ok(source.includes('Loading project delivery'));
  assert.ok(source.includes('loading && (view === \'budget\' || view === \'archived\')'));
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


test('Planning & Delivery never substitutes a different project for an invalid URL selection', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');
  const selectionStart = source.indexOf("const planningProject = planningProjectId");
  const selectionEnd = source.indexOf("const planningMilestones", selectionStart);
  assert.ok(selectionStart >= 0 && selectionEnd > selectionStart, 'Planning project selection should be explicit.');
  const selection = source.slice(selectionStart, selectionEnd);

  assert.match(selection, /planningProjectId\s*\?\s*projects\.find[\s\S]*?\|\| null\s*:\s*projects\.find/);
  assert.match(source, /title=\{planningProjectId \? 'Selected project unavailable' : 'No project records'\}/);
  assert.match(source, /The selected project is not available in the current source\. AMS will not substitute another project automatically\./);
  assert.match(source, /Choose an available project for planning/);
  assert.match(source, /next\.set\('planningProject', value\)/);
  assert.match(source, /data-ams-slug="planning-project-clear-selection"/);
  assert.match(source, /next\.delete\('planningProject'\)/);
  assert.match(source, /options=\{\[\{ value: '', label: 'Choose a project\.\.\.' \}, \.\.\.projects\.map/);
});


test('Project Resources never substitutes a different project for an invalid URL selection', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');
  const selectionStart = source.indexOf('const resourcesProject = resourcesProjectId');
  const selectionEnd = source.indexOf('const resourcesAllocations', selectionStart);
  assert.ok(selectionStart >= 0 && selectionEnd > selectionStart, 'Resource project selection should be explicit.');
  const selection = source.slice(selectionStart, selectionEnd);

  assert.match(selection, /resourcesProjectId\s*\?\s*projects\.find[\s\S]*?\|\| null\s*:\s*projects\.find/);
  assert.match(source, /title=\{resourcesProjectId \? 'Selected project unavailable' : 'No project records'\}/);
  assert.match(source, /The selected project is not available in the current source\. AMS will not substitute another project automatically\./);
  assert.match(source, /Choose an available project for resources/);
  assert.match(source, /next\.set\('resourcesProject', value\)/);
  assert.match(source, /data-ams-slug="resources-project-clear-selection"/);
  assert.match(source, /next\.delete\('resourcesProject'\)/);
});

test('Planning & Delivery preserves the selected project across active worksheet tabs', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');
  const helperStart = source.indexOf('const planningWorksheetHref = (worksheet: PlanningWorkspaceView) => {');
  const helperEnd = source.indexOf('const planningProject = planningProjectId', helperStart);
  assert.ok(helperStart >= 0 && helperEnd > helperStart, 'Planning worksheet URL helper should be declared beside the selected-project context.');
  const helper = source.slice(helperStart, helperEnd);

  assert.ok(helper.includes('const next = new URLSearchParams(searchParams);'));
  assert.ok(helper.includes("next.set('projects', 'planning-delivery');"));
  assert.ok(helper.includes("next.set('planningView', worksheet);"));
  assert.ok(helper.includes("return '/admin/projects?' + next.toString();"));

  const tabsStart = source.indexOf('ariaLabel="Planning & Delivery worksheets"');
  const tabsEnd = source.indexOf('          />', tabsStart);
  assert.ok(tabsStart >= 0 && tabsEnd > tabsStart, 'Planning & Delivery worksheet tabs should be identifiable.');
  const tabs = source.slice(tabsStart, tabsEnd);
  assert.match(tabs, /key: 'brief', label: 'Project Brief', to: planningWorksheetHref\('brief'\)/);
  assert.match(tabs, /key: 'milestones', label: 'Milestones', to: planningWorksheetHref\('milestones'\)/);
  assert.match(tabs, /key: 'timeline', label: 'Timeline', to: planningWorksheetHref\('timeline'\)/);
  assert.doesNotMatch(tabs, /key: '(?:brief|milestones|timeline)'[^\n]*to: '\/admin\/projects\?projects=planning-delivery/);
});

test('Planning & Delivery puts project scope before worksheet tabs and makes the brief the primary workspace', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');
  const workspaceStart = source.indexOf("      {view === 'planning-delivery' && (");
  const workspaceEnd = source.indexOf("      {view === 'resources' && (", workspaceStart);
  assert.ok(workspaceStart >= 0 && workspaceEnd > workspaceStart, 'Planning & Delivery should remain a bounded workspace.');
  const workspace = source.slice(workspaceStart, workspaceEnd);

  const scopeIndex = workspace.indexOf('data-ams-slug="planning-delivery-scope"');
  const tabsIndex = workspace.indexOf('ariaLabel="Planning & Delivery worksheets"');
  const briefIndex = workspace.indexOf('data-ams-slug="planning-project-brief"');
  const notesIndex = workspace.indexOf('aria-label="Project brief notes"', briefIndex);
  const contextIndex = workspace.indexOf('aria-label="Project context"', briefIndex);
  assert.ok(scopeIndex >= 0 && tabsIndex > scopeIndex, 'The selected project scope must be visible before worksheet navigation.');
  assert.ok(briefIndex > tabsIndex && notesIndex > briefIndex && contextIndex > notesIndex,
    'The Project Brief must follow worksheet navigation and place recorded notes before supporting context.');
  assert.match(workspace, /This selection scopes the Project Brief, Milestones and Timeline worksheets\./);

  const briefEnd = workspace.indexOf("{planningView === 'milestones' && (", briefIndex);
  assert.ok(briefEnd > briefIndex, 'The Project Brief should have an explicit boundary before Milestones.');
  const brief = workspace.slice(briefIndex, briefEnd);
  assert.match(brief, /Project brief notes/);
  assert.match(brief, /Target deadline/);
  assert.match(brief, /Recorded progress/);
  assert.match(brief, /Recorded milestones/);
  assert.match(brief, /Team members/);
  assert.match(brief, /Not tracked as separate project records/);
  assert.match(brief, /Open task execution/);
  assert.doesNotMatch(brief, /title="Planning data coverage"/, 'Duplicate coverage panel should not compete with the brief.');
  assert.doesNotMatch(workspace, /data-ams-slug="planning-delivery-context"/, 'The duplicate context row should be removed.');
  assert.match(workspace, /next\.set\('planningProject', value\)/, 'Changing scope must keep the canonical project query state.');
});

test('Project Resources leads with allocations and keeps capacity semantics separate', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');
  const workspaceStart = source.indexOf("      {view === 'resources' && (");
  const workspaceEnd = source.indexOf("      {view === 'all' && (", workspaceStart);
  assert.ok(workspaceStart >= 0 && workspaceEnd > workspaceStart, 'Project Resources should remain a bounded workspace.');
  const workspace = source.slice(workspaceStart, workspaceEnd);

  const scopeIndex = workspace.indexOf('data-ams-slug="project-resources-scope"');
  const allocationIndex = workspace.indexOf('title="Recorded resource allocation"');
  const teamIndex = workspace.indexOf('title="Project team"');
  const taskIndex = workspace.indexOf('title="Project task assignments"');
  const capacityIndex = workspace.indexOf('data-ams-slug="project-capacity-boundary"');
  assert.ok(scopeIndex >= 0 && allocationIndex > scopeIndex, 'The selected project must be clear before the allocation register.');
  assert.ok(teamIndex > allocationIndex && taskIndex > teamIndex && capacityIndex > taskIndex,
    'Allocation is primary; the team and task registers follow, with capacity limitations kept secondary.');
  assert.doesNotMatch(workspace, /aria-label="Project resource summary"/, 'A KPI strip must not precede the actual resource records.');
  assert.doesNotMatch(workspace, /label: '(?:Team members|Allocation entries|Assigned tasks|Unassigned tasks)'/,
    'Summary cards must not duplicate the record surfaces below.');
  assert.match(workspace, /allocation\.allocationPercent/);
  assert.match(workspace, /formatDate\(allocation\.startDate\)/);
  assert.match(workspace, /formatDate\(allocation\.endDate\)/);
  assert.match(workspace, /String\(task\.assignedTo \|\| ''\)\.trim\(\) \|\| 'Unassigned'/);
  assert.match(workspace, /Capacity and availability/);
  assert.match(workspace, /does not infer cross-project availability, time-log totals, or overload percentages/);
  assert.doesNotMatch(workspace, /matchingTasks|allocationRecords/, 'The project team view should not imply a cross-source identity join based only on display names.');
  assert.match(workspace, /next\.set\('resourcesProject', value\)/);
  assert.match(workspace, /next\.delete\('resourcesProject'\)/);
  assert.match(workspace, /The selected project is not available in the current source\. AMS will not substitute another project automatically\./);
  assert.match(workspace, /No resource allocation entries are recorded for this project\./);
  assert.match(workspace, /No tasks are recorded for this project\./);
});

test('Planning & Delivery Milestones keeps the canonical register primary and discloses missing owner/dependency fields', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');
  const workspaceStart = source.indexOf("      {view === 'planning-delivery' && (");
  const workspaceEnd = source.indexOf("      {view === 'resources' && (", workspaceStart);
  assert.ok(workspaceStart >= 0 && workspaceEnd > workspaceStart, 'Planning & Delivery should remain a bounded workspace.');
  const workspace = source.slice(workspaceStart, workspaceEnd);
  const scopeIndex = workspace.indexOf('data-ams-slug="planning-delivery-scope"');
  const tabsIndex = workspace.indexOf('ariaLabel="Planning & Delivery worksheets"');
  const milestoneIndex = workspace.indexOf("planningView === 'milestones'");
  const timelineIndex = workspace.indexOf("planningView === 'timeline'", milestoneIndex);
  assert.ok(scopeIndex >= 0 && tabsIndex > scopeIndex && milestoneIndex > tabsIndex && timelineIndex > milestoneIndex,
    'Milestones should be a project-scoped worksheet following the common scope and worksheet controls.');

  const milestones = workspace.slice(milestoneIndex, timelineIndex);
  assert.match(milestones, /title="Milestones"/);
  assert.match(milestones, /Milestone title, due date and completion come from the selected project records\./);
  assert.match(milestones, /Milestone-specific owners and dependencies are not stored in the current model\./);
  assert.match(milestones, /planningMilestones\.filter\(\(milestone\) => milestone\.completed\)\.length/);
  assert.match(milestones, /planningMilestones\.map\(\(milestone, index\) =>/);
  assert.match(milestones, /milestone\.title \|\| 'Untitled milestone'/);
  assert.match(milestones, /formatDate\(milestone\.dueDate\)/);
  assert.match(milestones, /milestone\.completed \? 'Completed' : overdue \? 'Overdue'/);
  assert.match(milestones, /data-ams-slug="planning-milestone-column-headings"/);
  assert.match(milestones, /text-\[10px\] font-medium text-muted">Milestone<\/span>/);
  assert.match(milestones, /text-\[10px\] font-medium text-muted">Due date<\/span>/);
  assert.match(milestones, /text-\[10px\] font-medium text-muted">Status<\/span>/);
  assert.match(milestones, /text-\[10px\] font-medium text-muted sm:hidden">Due date<\/span>/);
  assert.match(milestones, /data-ams-slug="planning-milestone-register"/);
  assert.match(milestones, /No milestones are recorded for this project\./);
  assert.doesNotMatch(milestones, /ownerId|dependencyId|fakeMilestone|demoMilestone/,
    'The worksheet must not fabricate milestone owners, dependency records, or sample milestones.');
});

test('Planning & Delivery Timeline leads with chronological recorded task and milestone dates', async () => {
  const source = await read('src/pages/admin/AdminProjects.tsx');
  const workspaceStart = source.indexOf("      {view === 'planning-delivery' && (");
  const workspaceEnd = source.indexOf("      {view === 'resources' && (", workspaceStart);
  assert.ok(workspaceStart >= 0 && workspaceEnd > workspaceStart, 'Planning & Delivery should remain a bounded workspace.');
  const workspace = source.slice(workspaceStart, workspaceEnd);
  const scopeIndex = workspace.indexOf('data-ams-slug="planning-delivery-scope"');
  const tabsIndex = workspace.indexOf('ariaLabel="Planning & Delivery worksheets"');
  const timelineIndex = workspace.indexOf("planningView === 'timeline'");
  const timelineEnd = workspace.indexOf("            </>", timelineIndex);
  assert.ok(scopeIndex >= 0 && tabsIndex > scopeIndex && timelineIndex > tabsIndex && timelineEnd > timelineIndex,
    'Timeline should remain project-scoped under the common worksheet navigation.');
  const timeline = workspace.slice(timelineIndex, timelineEnd);
  assert.match(timeline, /title="Project timeline"/);
  assert.match(timeline, /aria-label="Recorded project timeline"/);
  assert.match(timeline, /planningTimelineItems\.map\(\(item\) =>/);
  assert.match(timeline, /aria-label="Project date context"/);
  assert.match(timeline, /Project start/);
  assert.match(timeline, /Target deadline/);
  assert.match(timeline, /Recorded progress/);
  assert.match(timeline, /No task or milestone due dates are recorded for this project\./);
  assert.match(timeline, /Dependency tracking unavailable/);
  assert.match(timeline, /do not store timeline dependency links/);
  assert.doesNotMatch(timeline, /sm:grid-cols-3|rounded-control border border-line bg-bg p-3/,
    'The timeline list, not a KPI tile strip, must be the main working surface.');

  const entriesStart = source.indexOf('  const planningTimelineItems = [');
  const entriesEnd = source.indexOf('  const resourcesProjectId =', entriesStart);
  assert.ok(entriesStart >= 0 && entriesEnd > entriesStart, 'Timeline event composition should be bounded beside canonical project selection.');
  const entries = source.slice(entriesStart, entriesEnd);
  assert.match(entries, /planningMilestones\s*\.filter\(\(milestone\) => Boolean\(milestone\.dueDate\)\)/);
  assert.match(entries, /planningProject\?\.tasks/);
  assert.match(entries, /\.filter\(\(task\) => Boolean\(task\.dueDate\)\)/);
  assert.match(entries, /\.sort\(\(left, right\) => left\.date\.localeCompare\(right\.date\)\)/);
  assert.doesNotMatch(entries, /dependencyId|estimatedDuration|fakeTimeline|demoTimeline/,
    'Timeline must not create dependencies or duration estimates absent from current records.');
});

