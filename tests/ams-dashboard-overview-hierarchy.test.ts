import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Dashboard Overview prioritizes urgent delivery actions, deadlines, and header shortcuts before reporting context', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const performanceStart = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  assert.ok(overviewStart >= 0 && performanceStart > overviewStart, 'Dashboard overview branch should be identifiable');
  const overview = dashboard.slice(overviewStart, performanceStart);

  const finance = overview.indexOf('data-ams-feature-slug="dashboard-finance-overview"');
  const portfolio = overview.indexOf('data-ams-feature-slug="dashboard-project-portfolio"');
  const projectProgress = overview.indexOf('data-ams-feature-slug="dashboard-project-progress"');
  const attention = overview.indexOf('data-ams-feature-slug="dashboard-attention-center"');
  const taskQueue = overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const deadlines = overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  const team = overview.indexOf('data-ams-feature-slug="dashboard-team-workload"');
  const clientFocus = overview.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"');
  const activity = overview.indexOf('data-ams-feature-slug="dashboard-recent-activity"');
  const shortcuts = dashboard.indexOf('data-ams-feature-slug="dashboard-workspace-shortcuts"');

  assert.ok(projectProgress >= 0 && attention > projectProgress, 'Urgent delivery exceptions must lead the Overview before reporting context.');
  assert.ok(taskQueue > attention && deadlines > taskQueue, 'Action queues and deadlines must precede portfolio and financial analysis.');
  assert.ok(finance > deadlines && portfolio > finance, 'Finance and portfolio context follows immediate delivery actions.');
  assert.equal(overview.includes('dashboard-overview-reporting-scope'), false, 'Do not repeat the reporting period as a second content card.');
  assert.ok(shortcuts >= 0 && shortcuts < overviewStart, 'Workspace shortcuts belong in the page header, not in the lower content rows.');
  assert.equal(overview.includes('dashboard-workspace-shortcuts'), false, 'Do not repeat workspace shortcuts as a lower card.');

  assert.ok(team > deadlines && clientFocus > team, 'Team and client delivery context remain secondary.');
  assert.ok(activity > clientFocus, 'Recent audit activity remains the final, lower-priority content row.');
  assert.ok(overview.includes('min-[1100px]:col-span-12'), 'Recent activity should use the available row width after shortcuts move to the header.');
  assert.equal(overview.includes('Priority 01'), false, 'The visual hierarchy must not use invented rank numbering.');
  assert.equal(overview.includes('data-ams-feature-slug="dashboard-agency-operating-indicators"'), false, 'Remove the redundant generic KPI strip.');

  assert.ok(overview.includes('<TrendChart'), 'Finance must use a source-backed financial trend.');
  assert.ok(overview.includes('primaryLabel="Issued invoices"'));
  assert.ok(overview.includes('secondaryLabel="Recorded expenses"'));
  assert.ok(overview.includes('<DonutChart'), 'Projects must visualize the current portfolio state.');
  assert.ok(overview.includes('Creative & IT workload'));
  assert.ok(dashboard.includes('const getDashboardSavedProgress'));
  assert.ok(overview.includes('getDashboardSavedProgress(project)'), 'Project bars must use only saved progress data.');
  assert.ok(overview.includes('Progress not recorded'), 'Missing progress must not be fabricated.');
  assert.ok(overview.includes('Cash received'));
  assert.ok(overview.includes('Outstanding receivables'));
  assert.ok(overview.includes('Expenses recorded'));
  assert.ok(overview.includes('Task queue unavailable'));
  assert.ok(overview.includes('Time-log source unavailable'));
  assert.ok(overview.includes('dashboard-task-load-by-owner'));
  assert.ok(overview.includes('dashboard-recorded-time-by-person'));
  assert.ok(overview.includes('dashboard-inbox-triage'));
  assert.ok(overview.includes('dashboard-priority-exceptions'));
  assert.ok(dashboard.includes('api.tasks.getAll()'));
  assert.ok(dashboard.includes('buildFinancialTrendForReportingPeriod(overviewFinancePeriodMode, overviewFinancePeriodValue'));
  assert.doesNotMatch(overview, /sampleProjects|demoProject|fakeFinance|const fake/i);
});



test('Dashboard Overview empty states are contextual, action-aware and distinct from unavailable sources', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const end = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, end);
  assert.ok(dashboard.includes('type DashboardEmptyStateProps = {'));
  assert.ok(dashboard.includes('eyebrow: string;'));
  assert.ok(dashboard.includes("tone?: 'neutral' | 'success';"));
  assert.ok(styles.includes('.ams-dashboard-empty--success .ams-dashboard-empty__icon'));
  for (const label of [
    'PROJECT DELIVERY', 'INBOX TRIAGE', 'TASK QUEUE',
    'DELIVERY TIMELINE', 'DELIVERY HORIZON',
    'QUOTATION FOLLOW-UP', 'PROJECT PORTFOLIO', 'RISK DISTRIBUTION',
    'TEAM WORKLOAD', 'RECORDED TIME', 'CLIENT DELIVERY', 'AUDIT ACTIVITY'
  ]) assert.ok(overview.includes('eyebrow="' + label + '"'), 'Missing contextual empty-state heading: ' + label);
  assert.ok(overview.includes('ams-dashboard-attention-empty-indicator'));
  assert.ok(overview.includes('No active exceptions'));
  assert.ok(overview.includes("'No recorded activity yet'"));
  assert.ok(overview.includes('title="No task records yet"'));
  assert.ok(overview.includes('ams-finance-chart-empty-state'));
  assert.ok(overview.includes('No eligible financial records'));
  assert.doesNotMatch(overview, /Nothing to show/);
  assert.ok(overview.includes('DashboardUnavailable'), 'Unavailable-source states must stay distinct from genuine empty states.');
});


test('Dashboard hover states do not lift controls and exact-selector CSS overrides are consolidated', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  assert.doesNotMatch(dashboard, /hover:-translate-y-[\w-]+/);
  assert.doesNotMatch(styles, /translateY\s*\(/i);
  assert.doesNotMatch(styles, /\.ams-shell \.ams-dashboard button:hover:not\(:disabled\),\s*\.ams-shell \.ams-dashboard a:hover\s*\{[^}]*transform\s*:/s);
  assert.ok(styles.includes('--dashboard-control-height: 36px'));
  assert.ok(styles.includes('--dashboard-control-compact-height: 32px'));
  assert.match(styles, /\.ams-dashboard-toolbar[^{}]*\.ams-dashboard-view-tabs|\.ams-dashboard-toolbar\s*>\s*\.ams-dashboard-view-tabs/);
  const rules = styles.match(/^\.ams-shell \.ams-dashboard \.ams-dashboard-header-actions\s*\{/gm) || [];
  assert.equal(rules.length, 1, 'Header action base layout should be defined once outside responsive contexts.');
});
test('Dashboard Needs Attention, Finance, Projects and Recent Activity use deliberate card hierarchies', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');

  for (const marker of [
    'ams-dashboard-attention-panel',
    'ams-dashboard-attention-item',
    'ams-dashboard-inbox-metrics',
    'ams-dashboard-finance-panel',
    'ams-finance-primary-grid',
    'ams-finance-primary-metric',
    'ams-dashboard-projects-panel',
    'ams-project-risk-section__heading',
    'ams-project-workload__heading',
    'ams-dashboard-activity-table',
    'ams-dashboard-activity-table__actor',
    'ams-dashboard-activity-table__time',
    'ams-dashboard-activity-table__severity'
  ]) assert.ok(dashboard.includes(marker), 'Missing redesigned focus-card element: ' + marker);

  for (const selector of [
    '.ams-dashboard-attention-item__marker.is-urgent',
    '.ams-dashboard-inbox-metric',
    '.ams-finance-primary-grid',
    '.ams-finance-movement-card',
    '.ams-project-risk-layout',
    '.ams-project-workstream',
    '.ams-dashboard-activity-table',
    '.ams-dashboard-activity-tools',
    '@media (max-width: 759px)'
  ]) assert.ok(styles.includes(selector), 'Missing focus-card visual rule: ' + selector);

  assert.ok(dashboard.includes('activity.actor'));
  assert.ok(dashboard.includes('activity.timestamp'));
  assert.ok(dashboard.includes('data-ams-feature-slug="dashboard-priority-exceptions"'));
  assert.ok(dashboard.includes('data-ams-feature-slug="dashboard-finance-trend"'));
  assert.ok(dashboard.includes('data-ams-feature-slug="dashboard-project-portfolio"'));
  assert.ok(dashboard.includes('data-ams-feature-slug="dashboard-recent-activity"'));
});

test('Overview uses per-card period controls, compact project filters, aligned header actions and an accessible activity table', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const end = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, end);
  const adminLayout = await read('src/pages/admin/AdminLayout.tsx');
  assert.ok(adminLayout.includes('const isDashboardOverview ='));
  assert.ok(adminLayout.includes('{!isDashboardOverview ? <AdminReportingPeriodBar /> : null}'));
  assert.equal(overview.includes('aria-label="Reporting date range"'), false, 'Overview should rely on card-local date controls.');
  assert.ok(!dashboard.includes('ams-dashboard-view-tabs flex min-w-0 items-center gap-1 overflow-x-auto'));
  assert.ok(overview.includes('className="ams-project-registry-action'));
  assert.ok(dashboard.includes('ariaLabel="Finance reporting period"'));
  assert.ok(dashboard.includes('ariaLabel="Finance reporting period"'));
  assert.ok(dashboard.includes('ariaLabel="Recorded time reporting period"'));
  assert.ok(dashboard.includes('ariaLabel="Recorded time reporting period"'));
  assert.ok(dashboard.includes('aria-label="Filter attention by severity"'));
  for (const label of [
    'Search recent activity', 'Filter activity by severity',
    'Filter activity by time window', 'Recent activity start date',
    'Recent activity end date'
  ]) assert.ok(overview.includes('aria-label="' + label + '"') || overview.includes('ariaLabel="' + label + '"'), 'Missing activity table control: ' + label);
  assert.ok(overview.includes('pageSizeAriaLabel="Recent activity rows per page"'));
  assert.ok(overview.includes('<AdminTablePagination'));
  assert.ok(overview.includes('<table className="ams-dashboard-activity-table">'));
  assert.ok(overview.includes("{value:'custom',label:'Custom'}"));
  assert.ok(dashboard.includes('activityStartDate && eventDay < activityStartDate'));
  assert.ok(dashboard.includes('activityEndDate && eventDay > activityEndDate'));
  assert.ok(overview.includes('<th scope="col">Actor</th>'));
  assert.ok(overview.includes('visibleDashboardRecentActivity.map'));
  for (const selector of [
    '.ams-dashboard-header-shortcut', '.ams-dashboard-view-tabs',
    '.ams-dashboard-projects-panel', '.ams-dashboard-team-body',
    '.ams-dashboard-activity-table', '.ams-dashboard-activity-tools'
  ]) assert.ok(styles.includes(selector), 'Missing layout rule: ' + selector);
});

test('Recent Activity reuses AMS pagination while keeping date, severity, actor, and search filters functional', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const activityStart = dashboard.indexOf('data-ams-feature-slug="dashboard-recent-activity"');
  const activityEnd = dashboard.indexOf('</AdminPanel>', activityStart);
  assert.ok(activityStart >= 0 && activityEnd > activityStart);
  const activity = dashboard.slice(activityStart, activityEnd);
  assert.ok(dashboard.includes('AdminTablePagination } from \'./AdminModulePrimitives\''));
  assert.ok(activity.includes('<AdminTablePagination'));
  assert.ok(activity.includes('total={filteredDashboardRecentActivity.length}'));
  assert.ok(activity.includes('page={currentActivityPage}'));
  assert.ok(activity.includes('pageSize={activityPageSize}'));
  assert.ok(activity.includes('pageSizeOptions={[5, 10, 20]}'));
  assert.ok(primitives.includes('className="ams-table-pagination border-t border-line bg-panel px-4 py-3 sm:px-5"'));
  assert.ok(activity.includes('Search recent activity'));
  assert.ok(activity.includes('Filter activity by actor'));
  assert.ok(activity.includes('Filter activity by severity'));
  assert.ok(activity.includes('Filter activity by time window'));
  assert.ok(activity.includes('aria-label="Recent activity start date"'));
  assert.ok(activity.includes('aria-label="Recent activity end date"'));
  assert.equal(activity.includes('ams-dashboard-activity-page-buttons'), false);
  assert.equal(activity.includes('Page {currentActivityPage} of {activityPageCount}'), false);
  for (const selector of [
    '.ams-dashboard-activity-tools',
    '.ams-dashboard-activity-search',
    '.ams-dashboard-activity-filter--actor',
    '.ams-dashboard-activity-table',
    '@media (max-width: 759px)'
  ]) assert.ok(styles.includes(selector), 'Missing responsive Recent Activity rule: ' + selector);
});

test('Dashboard cards use soft surfaces and whitespace instead of decorative divider lines', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const polishStart = styles.lastIndexOf('/* Minimal Dashboard polish: no decorative dividers — 2026-10-27.');
  assert.ok(polishStart >= 0, 'A final no-divider visual pass should be the active styling layer.');
  const polish = styles.slice(polishStart);
  assert.ok(polish.includes('border-bottom: 0;'));
  assert.ok(polish.includes('border-top: 0;'));
  assert.ok(polish.includes('border-collapse: separate;'));
  assert.ok(polish.includes('.ams-dashboard-activity-table tbody tr'));
  assert.ok(polish.includes('background: color-mix('));
  assert.ok(styles.includes('.ams-shell .ams-dashboard .ams-overview-panel > div:first-child h2 {'));
  for (const marker of [
    'dashboard-project-progress', 'dashboard-attention-center',
    'dashboard-delivery-desk', 'dashboard-delivery-commitments',
    'dashboard-finance-overview', 'dashboard-project-portfolio',
    'dashboard-team-workload', 'dashboard-client-delivery-focus',
    'dashboard-recent-activity'
  ]) assert.ok(dashboard.includes('data-ams-feature-slug="' + marker + '"'), 'Missing dashboard card: ' + marker);
});

test('Dashboard controls use card-local dropdowns, design-system active states, and compact pagination', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  assert.ok(dashboard.includes("import { CustomSelect } from '../ui/CustomSelect';"));
  assert.ok(dashboard.includes("import { DropdownPortal } from '../ui/DropdownPortal';"));
  assert.equal(dashboard.includes('aria-label="Reporting date range"'), false);
  assert.equal(dashboard.includes('aria-label="Reporting period filters"'), false);
  for (const label of ['Filter attention by severity','Filter activity by actor','Filter activity by severity','Filter activity by time window','Sort recent activity']) {
    assert.ok(dashboard.includes('aria-label="' + label + '"') || dashboard.includes('ariaLabel="' + label + '"'), 'Missing custom card dropdown: ' + label);
  }
  assert.ok(dashboard.includes('pageSizeAriaLabel="Recent activity rows per page"'), 'The shared AMS pagination should expose its accessible page-size label.');
  assert.ok(dashboard.includes('const dashboardActivityActors = useMemo'));
  assert.ok(dashboard.includes("activityActorFilter !== '__all_actors__'"));
  assert.ok(dashboard.includes("activitySortOrder === 'oldest'"));
  assert.ok(dashboard.includes('<AdminTablePagination'), 'Recent Activity must use AMS shared pagination.');
  for (const selector of ['.ams-dashboard-view-tab[aria-current="page"]','.ams-dashboard button[aria-pressed="true"]','.ams-dashboard .ams-dashboard-select-trigger[aria-expanded="true"]','.ams-dashboard-projects-body','.ams-dashboard-finance-trend-region .ams-trend-chart__plot','.ams-shell:has(.ams-dashboard)','.ams-portal-root .ams-calendar-period-filter__panel','.ams-portal-root .ams-dashboard-activity-calendar-panel']) {
    assert.ok(styles.includes(selector), 'Missing final Dashboard layout/control rule: ' + selector);
  }
});

test('Project registry sits beside compact service-line filters in the Project Progress card header', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const headerStart = dashboard.indexOf('className="ams-dashboard-header-actions');
  const headerEnd = dashboard.indexOf('<section className="ams-dashboard-toolbar', headerStart);
  const projectProgress = dashboard.indexOf('data-ams-feature-slug="dashboard-project-progress"');
  const projectProgressEnd = dashboard.indexOf('data-ams-feature-slug="dashboard-attention-center"', projectProgress);
  const projectRegistry = dashboard.indexOf('className="ams-project-registry-action');
  const portfolioStart = dashboard.indexOf('data-ams-feature-slug="dashboard-project-portfolio"');
  const portfolioEnd = dashboard.indexOf('data-ams-feature-slug="dashboard-team-workload"', portfolioStart);
  assert.ok(headerStart >= 0 && headerEnd > headerStart);
  assert.equal(dashboard.slice(headerStart, headerEnd).includes('Project registry'), false, 'Registry should not crowd the global quick-action group.');
  assert.ok(projectProgress >= 0 && projectRegistry > projectProgress && projectRegistry < projectProgressEnd, 'Project registry and filters should share the Project Progress header row.');
  assert.ok(dashboard.includes('actions={(\n                    <div className="ams-project-progress-header-actions"'), 'Project filters belong in the card header.');
  assert.ok(dashboard.slice(projectProgress, projectProgressEnd).includes('<DashboardFilterGroup'));
  assert.ok(dashboard.slice(portfolioStart, portfolioEnd).includes('bodyClassName="ams-dashboard-projects-body p-4 sm:p-5"'), 'Projects must use the flex-fill body.');
  assert.ok(styles.includes('.ams-dashboard-projects-body > .ams-project-portfolio-body'));
  assert.ok(styles.includes('.ams-project-registry-action'));
});

test('Project All/Creative/IT filters match the Task queue segmented-control design', async () => {
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const contract = styles.slice(styles.lastIndexOf('/* Final Dashboard control contract. */'));
  assert.ok(contract.includes('.ams-project-progress-header-actions .ams-dashboard-project-service-filter,'));
  assert.ok(contract.includes('.ams-dashboard-task-filter-toolbar .ams-dashboard-task-queue-filter {'));
  assert.ok(contract.includes('.ams-project-progress-header-actions .ams-dashboard-project-service-filter .ams-dashboard-control--filter,'));
  assert.ok(contract.includes('.ams-dashboard-task-filter-toolbar .ams-dashboard-task-queue-filter .ams-dashboard-control--filter {'));
  assert.ok(contract.includes('height: var(--dashboard-control-height, 36px);'));
  assert.ok(contract.includes('height: var(--dashboard-control-filter-height, 28px);'));
  assert.ok(contract.includes('padding: var(--dashboard-filter-shell-padding, 2px);'));
  assert.ok(contract.includes('background: var(--dashboard-control-selected);'));
  assert.doesNotMatch(styles, /Final user-directed correction: project service-line filters use a text-only active state/);
});

test('Dashboard Project and Task filters share one segmented background and interaction contract', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const projectStart = dashboard.indexOf('data-ams-feature-slug="dashboard-project-progress"');
  const attentionStart = dashboard.indexOf('data-ams-feature-slug="dashboard-attention-center"', projectStart);
  const taskStart = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const deadlinesStart = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"', taskStart);
  const project = dashboard.slice(projectStart, attentionStart);
  const queue = dashboard.slice(taskStart, deadlinesStart);
  const marker = styles.lastIndexOf('/* Dashboard refinement — aligned header, card heights, compact filters, and local date range. */');
  assert.ok(projectStart >= 0 && attentionStart > projectStart);
  assert.ok(taskStart >= 0 && deadlinesStart > taskStart);
  assert.ok(dashboard.includes("import { DashboardControl, DashboardFilterGroup } from './DashboardControls';"));
  assert.ok(project.includes('<DashboardFilterGroup'));
  assert.ok(queue.includes('<DashboardFilterGroup'));
  assert.ok(project.includes('value={overviewProjectFilter}'));
  assert.ok(queue.includes('value={overviewTaskFilter}'));
  assert.ok(dashboard.includes('ariaLabel="Filter deadlines"'));
  assert.ok(dashboard.includes('ariaLabel="Filter quotations by stage"'));
  assert.ok(marker >= 0);
  const finalFilters = styles.slice(marker);
  assert.ok(finalFilters.includes('.ams-dashboard-filter-group'));
  assert.ok(finalFilters.includes('.ams-dashboard-control--filter:hover:not(:disabled)'));
  assert.ok(finalFilters.includes('.ams-dashboard-control--filter[aria-pressed="true"]'));
  assert.ok(finalFilters.includes('.ams-dashboard-control__count'));
  assert.ok(finalFilters.includes('background:var(--dashboard-control-selected)') || finalFilters.includes('background: var(--dashboard-control-selected)'));
  assert.ok(finalFilters.includes('.ams-dashboard-projects-panel {'));
});

test('Project service-line filters are a single shared segmented control aligned with Project registry', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const controls = await read('src/components/admin/DashboardControls.css');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-project-progress"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-attention-center"', start);
  const projectCard = dashboard.slice(start, end);
  const contract = styles.slice(styles.lastIndexOf('/* Final Dashboard control contract. */'));

  assert.ok(projectCard.includes('<DashboardFilterGroup ariaLabel="Filter projects by service line"'));
  assert.ok(projectCard.includes("{value:'all',label:'All',count:activeDashboardProjectFilterCounts.all}"));
  assert.ok(projectCard.includes("{value:'creative',label:'Creative',count:activeDashboardProjectFilterCounts.creative}"));
  assert.ok(projectCard.includes("{value:'technology',label:'IT',count:activeDashboardProjectFilterCounts.technology}"));
  assert.doesNotMatch(projectCard, /<button\b/, 'Service-line options must not be recreated as separate custom buttons.');
  assert.ok(projectCard.includes('size="standard" icon={<FolderKanban'), 'Project Registry uses the standard action size.');
  const groupRuleStart = contract.indexOf('.ams-shell .ams-dashboard .ams-project-progress-header-actions .ams-dashboard-project-service-filter,');
  const groupRuleEnd = contract.indexOf('\n}', groupRuleStart) + 2;
  const groupRule = contract.slice(groupRuleStart, groupRuleEnd);
  assert.ok(groupRuleStart >= 0 && groupRuleEnd > groupRuleStart, 'Project service-line filter must use the shared bordered group rule.');
  assert.ok(groupRule.includes('height: var(--dashboard-control-height, 36px);'));
  assert.ok(groupRule.includes('padding: var(--dashboard-filter-shell-padding, 2px);'));
  assert.ok(groupRule.includes('border: 1px solid var(--dashboard-control-border, var(--line));'));
  const itemRuleStart = contract.indexOf('.ams-shell .ams-dashboard .ams-project-progress-header-actions .ams-dashboard-project-service-filter .ams-dashboard-control--filter,');
  const itemRuleEnd = contract.indexOf('\n}', itemRuleStart) + 2;
  const itemRule = contract.slice(itemRuleStart, itemRuleEnd);
  assert.ok(itemRuleStart >= 0 && itemRuleEnd > itemRuleStart, 'Segmented options must use a shared compact item rule.');
  assert.ok(itemRule.includes('height: var(--dashboard-control-filter-height, 28px);'));
  assert.ok(itemRule.includes('padding: 0 var(--dashboard-control-padding-filter-x, 10px);'));
  assert.ok(contract.includes('.ams-dashboard-view-tabs'));
  assert.ok(contract.includes('overflow-x: visible;'), 'Dashboard tabs wrap rather than becoming a horizontal scroll strip.');
  assert.ok(controls.includes('--dashboard-control-padding-standard-x: 12px;'));
});

test('Dashboard card-local calendars sit in card headers, dropdown widths are stable, and empty Finance trends preserve their plot', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const financeStart = overview.indexOf('data-ams-feature-slug="dashboard-finance-overview"');
  const portfolioStart = overview.indexOf('data-ams-feature-slug="dashboard-project-portfolio"', financeStart);
  const finance = overview.slice(financeStart, portfolioStart);
  const teamStart = overview.indexOf('data-ams-feature-slug="dashboard-team-workload"');
  const clientStart = overview.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"', teamStart);
  const team = overview.slice(teamStart, clientStart);
  const activityStart = overview.indexOf('data-ams-feature-slug="dashboard-recent-activity"');
  const activity = overview.slice(activityStart);

  assert.ok(finance.indexOf('data-ams-feature-slug="dashboard-finance-period-controls"') < finance.indexOf('data-ams-feature-slug="dashboard-finance-trend"'));
  assert.ok(finance.includes('data={overviewFinanceChartRows}'));
  assert.ok(finance.includes('ams-finance-chart-empty-state'));
  assert.ok(dashboard.includes('const overviewFinanceChartRows = overviewFinanceTrendRows.length'));
  assert.ok(dashboard.includes('primary: 0, secondary: 0, tertiary: 0'));
  const recordedTimeStart = team.indexOf('data-ams-feature-slug="dashboard-recorded-time-by-person"');
  const recordedTimeEnd = team.indexOf('!canOpenTimeLogs', recordedTimeStart);
  const recordedTimeHeader = team.slice(recordedTimeStart, recordedTimeEnd);
  assert.ok(recordedTimeStart >= 0 && team.indexOf('dashboard-time-period-controls') > recordedTimeStart);
  assert.ok(recordedTimeHeader.includes('ams-dashboard-team-time__header-actions'));
  assert.equal(recordedTimeHeader.includes('Open Time Logs'), false, 'Open Time Logs belongs inside the recorded-time empty state, not in the heading.');
  assert.ok(team.includes('action={canOpenTimeLogs ? <DashboardControl to="/admin/time-logs"'), 'Empty recorded-time state owns the Open Time Logs action.');
  assert.ok(team.includes('title="No recorded time in this period"'));
  assert.ok(recordedTimeHeader.includes('ariaLabel="Recorded time reporting period"'));
  assert.equal(team.includes('ams-dashboard-team-header-actions'), false, 'Recorded-time controls belong beside their own heading.');
  assert.ok(activity.indexOf('Filter activity by time window') < activity.indexOf('ams-dashboard-activity-tools'));
  assert.ok(activity.includes('ams-dashboard-activity-header-actions'));
  assert.ok(styles.includes('.ams-calendar-period-filter {'));
  assert.ok(styles.includes('width: 232px;'));
  assert.ok(styles.includes('width: 178px;'));
  assert.ok(styles.includes('.ams-dashboard-finance-panel .ams-finance-control-links'));
  assert.ok(styles.includes('.ams-finance-chart-empty-state'));
  assert.ok(styles.includes('align-items: stretch;'));
  assert.ok(styles.includes('.ams-dashboard-toolbar > .ams-dashboard-view-tabs::-webkit-scrollbar'));
  assert.ok(styles.includes('.ams-project-progress-header-actions .ams-project-registry-action'));
});


test('Upcoming deadlines supports a card-local custom date window beyond the default 30-day horizon', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-finance-overview"', start);
  assert.ok(start >= 0 && end > start);
  const deadlines = dashboard.slice(start, end);
  assert.ok(dashboard.includes("type DashboardDeadlineFilter = 'all' | 'overdue' | 'next7' | 'days8to30' | 'custom'"));
  assert.ok(dashboard.includes('const isDeadlineCustomRangeInvalid = Boolean(deadlineStartDate && deadlineEndDate && deadlineStartDate > deadlineEndDate)'));
  assert.ok(dashboard.includes("if (overviewDeadlineFilter === 'custom')"));
  assert.ok(dashboard.includes('if (deadlineStartDate && item.dueDate < deadlineStartDate) return false'));
  assert.ok(dashboard.includes('if (deadlineEndDate && item.dueDate > deadlineEndDate) return false'));
  assert.ok(deadlines.includes('ariaLabel="Filter deadlines by custom date range"'));
  assert.ok(deadlines.includes('aria-label="Deadline start date"'));
  assert.ok(deadlines.includes('aria-label="Deadline end date"'));
  assert.ok(deadlines.includes('aria-label="Custom deadline date range"'));
  assert.ok(styles.includes('.ams-dashboard-deadline-date-range'));
  assert.equal(deadlines.includes('aria-label="Reporting date range"'), false);
});

test('Dashboard pixel-precision spacing keeps Finance period and Open Finance aligned with the shared spacing scale', async () => {
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const marker = '/* Dashboard pixel-precision spacing contract — 27 October 2026. */';
  const start = styles.lastIndexOf(marker);
  assert.ok(start >= 0, 'A single final spacing contract must own the final Dashboard spacing rules.');
  const finalLayer = styles.slice(start);

  for (const selector of [
    '.ams-overview-card-row {',
    '.ams-overview-panel > div:first-child {',
    '.ams-dashboard-finance-header-actions {',
    '.ams-dashboard-finance-header-actions > .ams-card-period-controls {',
    '.ams-dashboard-finance-header-actions .ams-calendar-period-filter__trigger,',
    '.ams-dashboard-finance-header-actions .ams-dashboard-card-action {',
    '.ams-dashboard-team-time__header-actions,',
    '.ams-dashboard-activity-header-actions {',
    '@media (max-width: 639px)'
  ]) assert.ok(finalLayer.includes(selector), 'Missing final spacing rule: ' + selector);

  assert.match(finalLayer, /\.ams-dashboard-finance-header-actions \{[^}]*gap: 8px/s);
  assert.match(finalLayer, /\.ams-dashboard-finance-header-actions \{[^}]*justify-content: flex-start/s);
  assert.match(finalLayer, /\.ams-overview-card-row \{[^}]*column-gap: 12px;[^}]*row-gap: 12px/s);
  assert.match(finalLayer, /\.ams-shell \.ams-dashboard \.ams-dashboard-finance-header-actions \.ams-calendar-period-filter__trigger,\s*\.ams-shell \.ams-dashboard \.ams-dashboard-finance-header-actions \.ams-dashboard-card-action \{[^}]*height: 36px;[^}]*min-height: 36px/s);
});

test('Dashboard actions, filters and calendars share one hover and geometry contract', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const sharedStyles = await read('src/components/admin/DashboardControls.css');
  const sharedComponent = await read('src/components/admin/DashboardControls.tsx');
  const pageStyles = await read('src/components/admin/GlobalExecutiveDashboard.css');

  assert.match(pageStyles, /\.ams-shell \.ams-dashboard \.ams-overview-card-row \{[^}]*column-gap: 12px;[^}]*row-gap: 12px/s);
  assert.ok(sharedComponent.includes("import './DashboardControls.css';"));
  assert.ok(sharedStyles.includes('--dashboard-control-hover:'));
  assert.ok(sharedStyles.includes('--dashboard-control-hover-border:'));
  assert.match(sharedStyles, /\.ams-dashboard-control:hover:not\(:disabled\)[\s\S]*?background: var\(--dashboard-control-hover/);
  assert.ok(sharedStyles.includes('--dashboard-control-height: 36px;'));
  assert.ok(sharedStyles.includes('--dashboard-control-compact-height: 32px;'));
  assert.ok(sharedStyles.includes('--dashboard-control-radius: 8px;'));
  assert.ok(sharedStyles.includes('border-radius: var(--dashboard-control-radius, 8px)'));
  assert.ok(sharedStyles.includes('.ams-dashboard-filter-group--compact'));
  assert.ok(sharedStyles.includes('.ams-dashboard-toolbar > .ams-dashboard-view-tabs'));
  assert.ok(sharedStyles.includes('overflow-x: visible;'));
  assert.ok(sharedStyles.includes('.ams-calendar-period-filter__tile'));
  assert.ok(sharedStyles.includes('.ams-dashboard-activity-calendar-panel button:hover'));
  assert.ok(dashboard.includes('className="ams-calendar-period-filter__trigger"'));
  assert.ok(dashboard.includes('className="ams-calendar-period-filter__tile"'));
  assert.ok(dashboard.includes('const exportFilteredDashboardActivity = () => {'));
  assert.ok(dashboard.includes('ariaLabel="Export filtered recent activity as CSV"'));
  assert.ok(dashboard.includes('const exportedRows = filteredDashboardRecentActivity.map((activity) => {'));
  assert.ok(dashboard.includes("['Activity', 'Actor', 'Timestamp (UTC)', 'Severity']"));
  assert.ok(dashboard.includes('ams-dashboard-activity-table'));
  assert.ok(dashboard.includes('aria-label="Search recent activity"'));
  assert.ok(dashboard.includes('aria-label="Filter activity by severity"'));
  assert.ok(dashboard.includes('aria-label="Filter activity by actor"'));
  assert.ok(dashboard.includes('aria-label="Sort recent activity"'));
});

test('Dashboard card actions, Recorded time controls, calendar navigation and Activity filter widths stay aligned', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');

  assert.ok(dashboard.includes("filter((year) => /^\\d{4}$/.test(year))"), 'Calendar year navigation should match four-digit years.');
  assert.ok(dashboard.includes('dashboardActivityActorFilterWidth'));
  assert.ok(dashboard.includes('longestLabel * 6.8 + 44'));
  assert.ok(dashboard.includes("style={{ '--activity-actor-filter-width': dashboardActivityActorFilterWidth } as React.CSSProperties}"));
  assert.ok(dashboard.includes('ams-dashboard-activity-filter--actor'));
  assert.ok(dashboard.includes('ams-dashboard-activity-filter--severity'));
  assert.ok(dashboard.includes('ams-dashboard-activity-filter--order'));

  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const end = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, end);
  const activityStart = overview.indexOf('data-ams-feature-slug="dashboard-recent-activity"');
  const activity = overview.slice(activityStart);
  assert.ok(activity.includes('Search recent activity'));
  assert.ok(activity.includes('Filter activity by actor'));
  assert.ok(activity.includes("className=\"ams-dashboard-activity-filter ams-dashboard-activity-filter--actor\" style={{ width: dashboardActivityActorFilterWidth, maxWidth: '100%' }}"));

  for (const selector of [
    '.ams-overview-panel .ams-dashboard-card-header-actions .ams-dashboard-card-action',
    '.ams-project-progress-header-actions .ams-project-registry-action',
    '.ams-dashboard-team-time__header-actions',
    '.ams-dashboard-finance-panel .ams-dashboard-finance-trend-region',
    '.ams-dashboard-finance-panel .ams-finance-movement-card',
    '.ams-dashboard-activity-tools'
  ]) assert.ok(styles.includes(selector), 'Missing focused Dashboard style: ' + selector);
  assert.ok(styles.includes('grid-template-columns: minmax(220px, 1.4fr) 132px minmax(160px, 1fr) 142px auto;'));
  assert.ok(styles.includes('@media (max-width: 1199px)'));
  assert.ok(styles.includes('grid-template-columns: minmax(0, 1.35fr) minmax(120px, .8fr) minmax(150px, 1fr);'));
  assert.ok(styles.includes('grid-template-columns: repeat(2, minmax(0, 1fr));'));
  assert.ok(dashboard.includes('<AdminTablePagination'));
  assert.ok(overview.includes('Open Time Logs'));
  assert.ok(overview.includes('Open Finance'));
  assert.ok(overview.includes('View audit log'));
});

test('Dashboard segmented filters use one reusable neutral-state component', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const shared = await read('src/components/admin/DashboardControls.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  assert.ok(dashboard.includes("import { DashboardControl, DashboardFilterGroup } from './DashboardControls';"));
  for (const label of ['Filter projects by service line','Task queue filters','Filter deadlines','Filter quotations by stage','Activity date presets','Reporting period grouping']) assert.ok(dashboard.includes('ariaLabel="' + label + '"'));
  assert.ok(shared.includes('export const DashboardControl'));
  assert.ok(shared.includes('export const DashboardFilterGroup'));
  assert.ok(styles.includes('--dashboard-control-selected'));
  assert.ok(styles.includes('--dashboard-control-selected:'));
});
test('Dashboard active tabs, shared filter states, aligned card bodies, compact actions, and team spacing stay consistent', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');

  assert.ok(dashboard.includes('aria-current={view === tab.key ? \'page\' : undefined}'));
  assert.ok(styles.includes('.ams-dashboard-toolbar[aria-label="Dashboard view and reporting controls"] > .ams-dashboard-view-tabs .ams-dashboard-view-tab[aria-current="page"]'));
  assert.ok(styles.includes('overflow-x: visible;'));
  assert.ok(styles.includes('.ams-dashboard-task-queue-filter .ams-dashboard-control--filter[aria-pressed="true"]'));
  assert.ok(styles.includes('.ams-project-progress-header-actions .ams-dashboard-project-service-filter .ams-dashboard-control--filter[aria-pressed="true"]'));
  assert.ok(styles.includes('.ams-dashboard-task-queue-filter .ams-dashboard-control--filter,'));
  assert.ok(styles.includes('.ams-project-progress-header-actions .ams-project-registry-action'));
  assert.ok(styles.includes('.ams-dashboard-delivery-row'));
  assert.ok(styles.includes('.ams-dashboard-task-queue-body,'));
  assert.ok(styles.includes('.ams-dashboard-deadlines-body'));
  assert.ok(styles.includes('.ams-dashboard-finance-body,'));
  assert.ok(styles.includes('.ams-dashboard-projects-body'));
  assert.ok(styles.includes('.ams-dashboard-team-tasks'));
  assert.ok(styles.includes('border-bottom: 0;'));
  assert.ok(styles.includes('.ams-calendar-period-filter__trigger'));
  assert.ok(styles.includes('.ams-dashboard-activity-calendar-trigger'));
  assert.ok(styles.includes('border-radius: 8px;'));
  assert.ok(dashboard.includes('<AdminTablePagination'));
  assert.ok(primitives.includes('export const AdminTablePagination'));
  const taskStart = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const deadlineStart = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"', taskStart);
  const task = dashboard.slice(taskStart, deadlineStart);
  const overviewStop = dashboard.indexOf(") : view === 'performance' ? (", deadlineStart);
  const deadlines = dashboard.slice(deadlineStart, overviewStop);
  assert.ok(task.includes('ams-dashboard-task-queue-panel'));
  assert.ok(task.includes('ams-dashboard-task-queue-list'));
  assert.ok(task.includes('Open Tasks'));
  assert.ok(deadlines.includes('ams-dashboard-deadlines-panel'));
  assert.ok(deadlines.includes('ams-dashboard-deadline-list'));
});

test('Task Queue and Upcoming Deadlines empty states share the same top inset', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const taskStart = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const deadlineStart = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"', taskStart);
  const overviewEnd = dashboard.indexOf('data-ams-feature-slug="dashboard-team-workload"', deadlineStart);
  assert.ok(taskStart >= 0 && deadlineStart > taskStart && overviewEnd > deadlineStart);
  const task = dashboard.slice(taskStart, deadlineStart);
  const deadlines = dashboard.slice(deadlineStart, overviewEnd);
  const taskEmptyStart = task.indexOf(') : dashboardWorkTasks.length === 0 ? (');
  const taskEmptyEnd = task.indexOf(') : activeDashboardTasks.length === 0 ?', taskEmptyStart);
  assert.ok(taskEmptyStart >= 0 && taskEmptyEnd > taskEmptyStart);
  const taskEmptyState = task.slice(taskEmptyStart, taskEmptyEnd);
  assert.ok(taskEmptyState.includes('<div className="px-4 py-4" role="status">'));
  assert.doesNotMatch(taskEmptyState, /py-8/);
  assert.ok(deadlines.includes('<div className="px-4 py-4"><DashboardEmptyState eyebrow="DELIVERY TIMELINE"'),
    'The empty deadline state uses the same 16px top inset as the task queue.');
});

test('Dashboard project and task filters use a shared segmented shell and canonical control-padding tokens', async () => {
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const controls = await read('src/components/admin/DashboardControls.css');
  const finalContract = styles.slice(styles.lastIndexOf('/* Final Dashboard control contract. */'));
  const workloadRules = styles.slice(styles.indexOf('/* Team Workload rhythm:'));

  assert.ok(finalContract.includes('padding: var(--dashboard-filter-shell-padding, 2px);'), 'Filter group shells use the shared interior-padding token.');
  assert.ok(finalContract.includes('padding: 0 var(--dashboard-control-padding-filter-x, 10px);'), 'Segmented items use the shared filter-padding token.');
  assert.ok(finalContract.includes('background: var(--dashboard-control-selected'), 'Active filter background must be neutral, not brand red.');
  assert.ok(finalContract.includes('color: var(--text);'), 'Active filter label uses neutral text.');
  assert.ok(finalContract.includes('border-radius: var(--dashboard-control-radius, 8px);'), 'Control shell radius uses the shared token.');
  assert.ok(workloadRules.includes('padding-top: 16px;'), 'Recorded Time must retain explicit top spacing.');
  assert.ok(controls.includes('.ams-dashboard-control--filter[aria-pressed="true"]'));
  assert.ok(finalContract.includes('.ams-dashboard-project-service-filter'));
  assert.ok(finalContract.includes('.ams-dashboard-task-queue-filter'));
  for (const token of ['--dashboard-control-padding-standard-x: 12px;', '--dashboard-control-padding-compact-x: 10px;', '--dashboard-control-padding-filter-x: 10px;']) {
    assert.ok(controls.includes(token), 'Missing canonical padding token: ' + token);
  }
});

test('Dashboard uses a consistent typography scale, neutral project filters and empty-state-only ledger actions', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const dashboardStyles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const controlStyles = await read('src/components/admin/DashboardControls.css');
  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const quotationStart = overview.indexOf('data-ams-feature-slug="dashboard-commercial-quotation-pipeline"');
  const projectsStart = overview.indexOf('data-ams-feature-slug="dashboard-project-portfolio"', quotationStart);
  const quotations = overview.slice(quotationStart, projectsStart);
  const quotationHeaderStart = quotations.indexOf('ams-quotation-follow-up__header');
  const quotationBodyStart = quotations.indexOf('operationalSnapshot.quotations === null', quotationHeaderStart);
  const quotationHeader = quotations.slice(quotationHeaderStart, quotationBodyStart);
  const recordedTimeStart = overview.indexOf('data-ams-feature-slug="dashboard-recorded-time-by-person"');
  const recordedTimeEnd = overview.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"', recordedTimeStart);
  const recordedTime = overview.slice(recordedTimeStart, recordedTimeEnd);

  assert.ok(dashboardStyles.includes('--ams-dashboard-type-h1: 26px'));
  assert.ok(dashboardStyles.includes('--ams-dashboard-type-h2: 15px'));
  assert.ok(dashboardStyles.includes('--ams-dashboard-type-h3: 13px'));
  assert.ok(dashboardStyles.includes('--ams-dashboard-type-h4: 12px'));
  assert.ok(dashboardStyles.includes('--ams-dashboard-type-body: 12px'));
  assert.ok(dashboardStyles.includes('--ams-dashboard-type-secondary: 11px'));
  assert.ok(dashboardStyles.includes('--ams-dashboard-type-meta: 10px'));
  assert.ok(dashboardStyles.includes('.ams-dashboard-page-header h1'));
  assert.ok(dashboardStyles.includes('.ams-overview-panel > div:first-child h2'));
  assert.ok(dashboardStyles.includes('.ams-overview-panel h3'));

  const projectFilterStart = overview.indexOf('className="ams-project-progress-header-actions"');
  assert.ok(projectFilterStart >= 0);
  assert.ok(dashboardStyles.includes('.ams-project-progress-header-actions .ams-dashboard-project-service-filter .ams-dashboard-control--filter[aria-pressed="true"]'));
  const finalContract = dashboardStyles.slice(dashboardStyles.lastIndexOf('/* Final Dashboard control contract. */'));
  const projectGroupCssStart = finalContract.indexOf('.ams-shell .ams-dashboard .ams-project-progress-header-actions .ams-dashboard-project-service-filter,');
  const projectRegistryCssStart = finalContract.indexOf('.ams-shell .ams-dashboard .ams-project-progress-header-actions .ams-project-registry-action', projectGroupCssStart);
  const projectFilterCss = finalContract.slice(projectGroupCssStart, projectRegistryCssStart);
  assert.ok(projectGroupCssStart >= 0 && projectRegistryCssStart > projectGroupCssStart);
  assert.ok(projectFilterCss.includes('background: var(--dashboard-control-selected)'));
  assert.ok(projectFilterCss.includes('padding: var(--dashboard-filter-shell-padding, 2px);'));
  assert.doesNotMatch(projectFilterCss, /background:\s*var\(--accent\)/);
  assert.ok(dashboardStyles.includes('overflow-x: visible;'));

  assert.equal(quotationHeader.includes('Open quotation ledger'), false, 'Quotation ledger action must not crowd the Quotation Follow-up heading.');
  assert.ok(quotations.includes('action={<DashboardControl to="/admin/finance?tab=quotations"'), 'Quotation ledger action must be available inside an empty state.');
  assert.ok(quotations.includes('title="No quotations match this stage"'));
  const timeHeaderStart = recordedTime.indexOf('ams-dashboard-team-time__header-actions');
  const timeEmptyStart = recordedTime.indexOf('title="No recorded time in this period"');
  const timeHeader = recordedTime.slice(timeHeaderStart, timeEmptyStart);
  assert.ok(timeHeaderStart >= 0 && timeEmptyStart > timeHeaderStart);
  assert.equal(timeHeader.includes('Open Time Logs'), false, 'Open Time Logs must not appear as a permanent heading action.');
  assert.ok(recordedTime.includes('action={canOpenTimeLogs ? <DashboardControl to="/admin/time-logs"'), 'Open Time Logs is shown in the empty state only.');
  assert.ok(controlStyles.includes('--dashboard-control-height: 36px;'));
  assert.ok(controlStyles.includes('--dashboard-control-compact-height: 32px;'));
  assert.ok(dashboardStyles.includes('.ams-overview-card-row[aria-label="Finance and project overview"] .ams-overview-panel--projects'));
});

test('Dashboard header controls, Projects height, Team Workload and Recent Activity remain aligned and responsive', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');

  assert.ok(dashboard.includes('data-ams-feature-slug="dashboard-quick-actions"'));
  assert.ok(dashboard.includes('aria-label="Dashboard views"'));
  assert.ok(dashboard.includes('aria-label="Filter activity by severity"'));
  assert.ok(dashboard.includes('aria-label="Filter activity by actor"'));
  assert.ok(dashboard.includes('aria-label="Sort recent activity"'));
  assert.ok(dashboard.includes('aria-label="Filter activity by time window"'));
  assert.ok(dashboard.includes('Export filtered recent activity as CSV'));
  assert.ok(dashboard.includes('pageSizeAriaLabel="Recent activity rows per page"'));

  for (const selector of [
    '.ams-dashboard-header-primary-actions',
    '.ams-dashboard-header-shortcuts',
    '.ams-dashboard-header-utility-actions',
    '.ams-dashboard-view-tabs',
    '.ams-dashboard-projects-body > .ams-project-portfolio-body',
    '.ams-dashboard-team-tasks',
    '.ams-dashboard-team-time',
    '.ams-dashboard-owner-row__signals > span',
    '.ams-dashboard-activity-tools',
    '.ams-dashboard-activity-table',
    '@media (max-width: 1199px)',
    '@media (max-width: 759px)'
  ]) assert.ok(styles.includes(selector), 'Missing Dashboard alignment/responsive rule: ' + selector);

  assert.ok(styles.includes('height: 36px;'));
  assert.ok(styles.includes('overflow-x: visible;'));
  assert.ok(styles.includes('justify-content: space-between;'));
  assert.ok(styles.includes('grid-template-columns: minmax(220px, 1.5fr)'));
  assert.ok(styles.includes('display: flex;'));
});

test('Dashboard Client Delivery Focus prioritizes agency delivery risk before portfolio size', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const modelStart = dashboard.indexOf('const clientDeliveryFocus = useMemo<DashboardClientDeliveryFocus[]>(() =>');
  const modelEnd = dashboard.indexOf('const upcomingCommitments = allUpcomingCommitments.filter((item) => {', modelStart);
  assert.ok(modelStart >= 0 && modelEnd > modelStart);
  const model = dashboard.slice(modelStart, modelEnd);
  const signals = [
    'right.overdueCommitmentCount - left.overdueCommitmentCount',
    '(right.overdueTaskCount ?? -1) - (left.overdueTaskCount ?? -1)',
    '(right.blockedTaskCount ?? -1) - (left.blockedTaskCount ?? -1)',
    '(right.unassignedTaskCount ?? -1) - (left.unassignedTaskCount ?? -1)',
    '(right.reviewTaskCount ?? -1) - (left.reviewTaskCount ?? -1)',
    "(left.nextCommitmentDate || '9999-12-31').localeCompare(right.nextCommitmentDate || '9999-12-31')",
    '(right.openTaskCount ?? -1) - (left.openTaskCount ?? -1)',
    'right.projectCount - left.projectCount',
    'left.name.localeCompare(right.name)'
  ];
  let last = -1;
  for (const signal of signals) {
    const position = model.indexOf(signal);
    assert.ok(position > last, 'Delivery risk must sort before portfolio size: ' + signal);
    last = position;
  }
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-recent-activity"', start);
  assert.ok(start >= 0 && end > start);
  const panel = dashboard.slice(start, end);
  const metricOrder = ["label: 'Overdue'", "label: 'Blocked'", "label: 'Unassigned'"];
  let previous = -1;
  for (const label of metricOrder) {
    const position = panel.indexOf(label);
    assert.ok(position > previous, 'Client delivery signals must remain ordered: ' + label);
    previous = position;
  }
  assert.ok(panel.indexOf('Open task load') >= 0);
  assert.ok(panel.indexOf('In review {client.reviewTaskCount') > previous);
  assert.ok(panel.includes('clientDeliveryFocus.slice(0, 4).map((client) => ('));
  assert.ok(panel.includes("client.overdueCommitmentCount + ' overdue commitments'"));
  assert.ok(panel.includes('No dated commitment in 30 days'));
});


test('Dashboard Overview client delivery focus groups saved client relationships and preserves source boundaries', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-recent-activity"', start);
  assert.ok(start >= 0 && end > start);
  const panel = dashboard.slice(start, end);
  assert.ok(dashboard.includes('const clientDeliveryFocus = useMemo<DashboardClientDeliveryFocus[]>(() =>'));
  assert.ok(dashboard.includes("resolveDashboardClientName(clientId, clientDirectoryById, project.clientCompany, project.client, project.clientName)"));
  assert.ok(dashboard.includes('const projectIdentity = projectClientById.get(task.projectId)'));
  assert.ok(dashboard.includes('ensureClient(task.clientId, task.clientName)'));
  assert.ok(panel.includes('active projects'));
  assert.ok(panel.includes('Open task load'));
  assert.ok(panel.includes("label: 'Overdue'"));
  assert.ok(panel.includes("label: 'Blocked'"));
  assert.ok(panel.includes('client.overdueTaskCount'));
  assert.ok(panel.includes('client.nextCommitmentDate'));
  assert.ok(panel.includes('project.href && canOpenDashboardRoute(project.href)'));
  assert.ok(panel.includes("client.overdueCommitmentCount + ' overdue commitments'"));
  assert.ok(panel.includes('No dated commitment in 30 days'));
});


test('Dashboard client delivery focus resolves canonical client IDs and never invents project slugs for drill-downs', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-recent-activity"', start);
  assert.ok(start >= 0 && end > start);
  const panel = dashboard.slice(start, end);
  assert.ok(dashboard.includes("const canOpenClientDirectory = canOpenDashboardRoute('/admin/clients/all-clients')"));
  assert.ok(dashboard.includes("canOpenClientDirectory ? api.clients.getAll() : Promise.resolve"));
  assert.ok(dashboard.includes("const clientId = String(project.clientId || project.client_id || '').trim()"));
  assert.ok(dashboard.includes("const key = clientId ? 'client-id:' + clientId : 'saved-name:' + normalizedName"));
  assert.ok(dashboard.includes('const projectIdentity = projectClientById.get(task.projectId)'));
  assert.ok(dashboard.includes('ensureClient(task.clientId, task.clientName)'));
  assert.ok(dashboard.includes('Saved client ID · master record not resolved'));
  assert.ok(dashboard.includes('Grouped by saved company name'));
  assert.ok(dashboard.includes("'/admin/clients/all-clients?client=' + encodeURIComponent(client.clientId)"));
  assert.ok(panel.includes('client.clientRecordAvailable && canOpenClientDirectory && client.clientId'));
  assert.ok(dashboard.includes("if (slug) return '/admin/projects?projects=sprint&project=' + encodeURIComponent(slug)"));
  assert.ok(dashboard.includes("if (id) return '/admin/projects?projects=all&project=' + encodeURIComponent(id)"));
  assert.ok(dashboard.includes('const projectHref = getDashboardProjectHref(project)'));
  assert.equal(dashboard.includes("'/admin/projects?projects=sprint&project=' + encodeURIComponent(projectSlug)"), false);
  assert.ok(panel.includes('project.href && canOpenDashboardRoute(project.href)'));
});


test('Dashboard Overview Finance controls link to canonical ledgers only when route access allows them', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-finance-overview"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-project-portfolio"', start);
  assert.ok(start >= 0 && end > start);
  const finance = dashboard.slice(start, end);
  assert.ok(dashboard.includes("const canOpenInvoiceRegister = canOpenDashboardRoute('/admin/finance?tab=accounts-receivable')"));
  assert.ok(dashboard.includes("const canOpenExpenseRegister = canOpenDashboardRoute('/admin/finance?tab=expenses')"));
  assert.ok(finance.includes('data-ams-feature-slug="dashboard-finance-control"'));
  assert.ok(finance.includes('{canOpenInvoiceRegister ? ('));
  assert.ok(finance.includes('{canOpenExpenseRegister ? ('));
  assert.ok(finance.includes('Cash received'));
  assert.ok(finance.includes('Outstanding receivables'));
  assert.ok(finance.includes('Expenses recorded'));
  assert.ok(finance.includes('to="/admin/finance?tab=accounts-receivable"'));
  assert.ok(finance.includes('to="/admin/finance?tab=expenses"'));
  assert.ok(finance.includes('Invoices vs expenses'));
  assert.ok(finance.includes('Issued-invoice totals by invoice date and eligible expenses by recorded date'));
  assert.ok(finance.includes('data-ams-feature-slug="dashboard-finance-movement"'));
  assert.ok(finance.includes('<TrendChart'));
  assert.ok(finance.includes('primaryLabel="Issued invoices"'));
  assert.ok(finance.includes('secondaryLabel="Recorded expenses"'));
  assert.doesNotMatch(finance, /revenueThisMonth|netOperatingProfit/);
});

test('Dashboard work queue and service-line summaries come from canonical task/project records', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.ok(dashboard.includes('api.tasks.getAll()'));
  assert.ok(dashboard.includes("const dashboardWorkTasks = useMemo<DashboardWorkTask[]>(() =>"));
  assert.ok(dashboard.includes("const projectId = String(task?.projectId || task?.project_id || '')"));
  assert.ok(dashboard.includes("const serviceCategory = String(project?.serviceCategory || task?.serviceCategory || task?.service || '')"));
  assert.ok(dashboard.includes("const serviceLineConfiguration = ["));
  assert.ok(dashboard.includes("const projectIds = new Set(lineProjects.map((project: any) => String(project.id || '')).filter(Boolean));"));
  assert.ok(dashboard.includes("(Boolean(task.projectId) && projectIds.has(task.projectId)) || (task.serviceLine === line.key && !task.projectId)"));
  assert.ok(dashboard.includes("const projectIdentity = projectId ? 'id:' + projectId : href ? 'href:' + href : 'name:' + projectName.toLocaleLowerCase();"));
  assert.ok(dashboard.includes("group.projectCount = group.projectIds.size;"));
  assert.ok(dashboard.includes("label: 'Creative & Content'"));
  assert.ok(dashboard.includes("label: 'Web & IT Development'"));
  assert.ok(dashboard.includes("label: 'Other / Unclassified'"));
  assert.ok(dashboard.includes("const allUpcomingCommitments = useMemo<DashboardCommitment[]>(() =>"));
  assert.ok(dashboard.includes("const upcomingCommitments = allUpcomingCommitments.filter((item) => {"));
  assert.ok(dashboard.includes("}).slice(0, 8);"));
  assert.ok(dashboard.includes("if (overviewDeadlineFilter === 'overdue') return item.dueDate < currentDayKey"));
  assert.ok(dashboard.includes("const taskLoadByAssignee = useMemo(() =>"));
  assert.ok(dashboard.includes("const periodTimeRows = useMemo(() =>"));
  assert.ok(dashboard.includes("const activeTaskCount = operationalSnapshot.tasks === null ? null : activeDashboardTasks.length"));
  assert.ok(dashboard.includes("operationalSnapshot.tasks === null ? ("));
  assert.ok(dashboard.includes("operationalSnapshot.projects === null ? ("));
  assert.ok(dashboard.includes('Task queue unavailable'));
  assert.ok(dashboard.includes('Task queue unavailable for this role or source.'));
  assert.doesNotMatch(dashboard, /const taskCount\s*=\s*0/);
});

test('Dashboard Analytics financial-history availability respects currency and issued-invoice rules', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('const AnalyticsView:');
  const end = dashboard.indexOf('export const GlobalExecutiveDashboard', start);
  assert.ok(start >= 0 && end > start, 'Analytics source should have a bounded financial reporting surface.');
  const analytics = dashboard.slice(start, end);

  assert.ok(analytics.includes("const inCurrencyInvoices = invoiceRows.filter((row) => String(row.currency || 'IDR').toUpperCase() === currency)"));
  assert.ok(analytics.includes('const inCurrencyIssuedInvoices = inCurrencyInvoices.filter(isIssuedInvoice)'));
  assert.ok(analytics.includes('const inCurrencyExpenseRows = expenseRows.filter((row) => String(row.currency || \'IDR\').toUpperCase() === currency)'));
  assert.ok(analytics.includes('const inCurrencyExpenses = inCurrencyExpenseRows.filter(isDashboardExpenseEligible)'));
  assert.ok(analytics.includes('const selectedCurrencyFinancialRowsReturned = inCurrencyInvoices.length > 0 || inCurrencyExpenseRows.length > 0'));
  assert.ok(analytics.includes('const financialRecordsReturned = inCurrencyIssuedInvoices.length > 0 || inCurrencyExpenses.length > 0'));
  assert.ok(analytics.includes('No usable financial records in selected currency'));
  assert.ok(analytics.includes('No financial records in selected currency'));
  assert.ok(analytics.includes('A zero-value trend is not inferred from another currency.'));
  assert.ok(analytics.includes('No usable financial records in selected currency'));
});


test('Dashboard overview keeps its operational cards source-backed and preserves financial source states in Analytics', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  for (const sourceCall of ['api.dashboard.getOverview()', 'api.projects.getAll()', 'api.tasks.getAll()', 'api.timeLogs.getAll()', 'api.finance.getInvoices()', 'api.finance.getExpenses()']) {
    assert.ok(dashboard.includes(sourceCall), 'Dashboard source missing: ' + sourceCall);
  }
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const stop = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, stop);
  const analyticsStart = dashboard.indexOf('const AnalyticsView:');
  const analyticsEnd = dashboard.indexOf('export const GlobalExecutiveDashboard', analyticsStart);
  const analytics = dashboard.slice(analyticsStart, analyticsEnd);
  for (const text of ['Task queue unavailable', 'Project portfolio unavailable', 'Delivery schedule unavailable', 'Time-log source unavailable.', 'Invoice source unavailable.', 'Financial movement unavailable']) {
    assert.ok(overview.includes(text), 'Overview must disclose source unavailability: ' + text);
  }
  assert.ok(analytics.includes('Financial trend unavailable'));
  assert.ok(analytics.includes('not posted profit'));
  assert.ok(analytics.includes('A zero-value trend is not inferred from an empty source'));
  assert.doesNotMatch(dashboard, /Preview data only|sampleProjects|sampleTeam|sampleRevenueByRange|isSlugFixtureMode|fixtureMode/);
});

test('Dashboard project creation action opens the existing create drawer only for permitted roles', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const projects = await read('src/pages/admin/AdminProjects.tsx');

  assert.match(dashboard, /hasAdminPermission\('canManageProjects'\)/);
  assert.match(dashboard, /const canCreateProject = canManageProjects && canOpenDashboardRoute\('\/admin\/projects\?create=1'\)/);
  assert.ok(dashboard.includes('{canOpenProjects ? ('));
  assert.ok(dashboard.includes("to={canCreateProject?'/admin/projects?create=1':'/admin/projects'}"));
  assert.match(dashboard, /canCreateProject\s*\?\s*'New project'\s*:\s*'Projects'/);
  assert.match(projects, /const createProjectRequestHandled = React\.useRef\(false\)/);
  assert.match(projects, /searchParams\.get\('create'\) === '1'/);
  assert.match(projects, /next\.delete\('create'\)/);
  assert.match(projects, /if \(canManageProjects\) openNewProject\(\)/);
});



test('Dashboard Overview separates current operations from period-scoped Analytics without a duplicate chart filter', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const charts = await read('src/components/charts/DashboardCharts.tsx');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const stop = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, stop);
  const analyticsStart = dashboard.indexOf('const AnalyticsView:');
  const analyticsEnd = dashboard.indexOf('export const GlobalExecutiveDashboard', analyticsStart);
  const analytics = dashboard.slice(analyticsStart, analyticsEnd);
  assert.ok(dashboard.includes('matchesDate,'));
  assert.ok(dashboard.includes('matchesInterval,'));
  assert.ok(dashboard.includes('value: reportPeriodValue,'));
  assert.ok(dashboard.includes('mode: reportPeriodMode,'));
  assert.ok(dashboard.includes('enabled: reportPeriodEnabled,'));
  assert.equal(dashboard.includes('setValue: setReportingPeriodValue'), false);
  assert.ok(dashboard.includes('useReportingPeriod()'));
  assert.ok(analytics.includes('buildFinancialTrendForReportingPeriod(reportPeriodMode, reportPeriodValue'));
  assert.ok(analytics.includes('buildRecentFinancialTrend(inCurrencyInvoices, inCurrencyExpenses)'));
  assert.ok(analytics.includes('const selectedRangeLabel = describeFinancialTrendScope(trend, reportPeriodEnabled, reportPeriodLabel)'));
  assert.ok(dashboard.includes('Recent 30-day default window'));
  assert.ok(analytics.includes('All dates defaults to the recent 30 days.'));
  assert.equal(overview.includes('dashboard-overview-reporting-scope'), false);
  assert.equal(dashboard.includes('aria-label="Reporting date range"'), false);
  assert.equal(dashboard.includes('ams-dashboard-period-controls'), false);
  assert.equal(overview.includes('title="Invoices vs expenses"'), false);
  assert.equal(overview.includes('title="Active projects"'), false);
  assert.equal(dashboard.includes('DashboardTrendRangePicker'), false);
  assert.equal(dashboard.includes('RangeKey'), false);
  assert.ok(analytics.includes('aria-label="Exact invoice and expense values by period"'));
  assert.ok(charts.includes("role={isMavenPresentation ? 'group' : 'img'} aria-label={ariaLabel}"));
  assert.ok(charts.includes('ams-trend-chart__legend'));
  assert.ok(charts.includes('style={{ backgroundColor: primaryLineColor }}'));
  assert.ok(charts.includes('{secondaryLabel && <span className="inline-flex items-center gap-2">'));
});

test('Dashboard quick actions and project-header links respect route access', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.ok(dashboard.includes('const currentNavigationRole = getAmsRole(getAdminSession()?.user)'));
  assert.ok(dashboard.includes('return canAccessAmsRoute(currentNavigationRole, target.pathname, target.search)'));
  assert.ok(dashboard.includes('.filter((action) => canOpenDashboardRoute(action.href)).map((action) => ('));
  assert.ok(dashboard.includes("href: '/admin/tasks'"));
  assert.ok(dashboard.includes("href: '/admin/clients/all-clients'"));
  assert.ok(dashboard.includes("href: '/admin/documents'"));
  assert.ok(dashboard.includes('data-ams-feature-slug="dashboard-quick-actions"'));
  assert.ok(dashboard.includes("const canCreateInvoice = hasAdminPermission('canManageInvoices') && canOpenInvoiceRegister"));
  assert.equal(dashboard.includes("const canCreateTask ="), false);
  assert.ok(dashboard.includes("to={canCreateInvoice?'/admin/finance?tab=accounts-receivable&action=create-invoice':'/admin/finance?tab=accounts-receivable'}"));
  assert.equal(dashboard.includes("to={canCreateTask ? '/admin/tasks?create=1' : '/admin/tasks'}"), false);
  assert.ok(dashboard.includes("to={canCreateProject?'/admin/projects?create=1':'/admin/projects'}"));
});

test('Dashboard Analytics does not infer zero financial trends from empty or currency-mismatched sources', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('const AnalyticsView:');
  const end = dashboard.indexOf('export const GlobalExecutiveDashboard', start);
  assert.ok(start >= 0 && end > start, 'Analytics view must remain bounded.');
  const analytics = dashboard.slice(start, end);

  assert.ok(analytics.includes('const financialDataAvailable = snapshot.invoices !== null && snapshot.expenses !== null'));
  assert.ok(analytics.includes('const financialRecordsReturned = inCurrencyIssuedInvoices.length > 0 || inCurrencyExpenses.length > 0'));
  assert.ok(analytics.includes('const selectedCurrencyFinancialRowsReturned = inCurrencyInvoices.length > 0 || inCurrencyExpenseRows.length > 0'));
  assert.ok(analytics.includes('!financialDataAvailable'), 'Failed source reads must remain unavailable.');
  assert.ok(analytics.includes('!financialRecordsReturned'), 'Empty or non-issued records must not become a zero trend.');
  assert.ok(analytics.includes('No usable financial records in selected currency'));
  assert.ok(analytics.includes('A zero-value trend is not inferred from another currency.'));
  assert.ok(analytics.includes('A zero-value trend is not inferred from an empty source.'));
  assert.ok(analytics.includes('A zero-value invoice series is not inferred.'));
  assert.ok(analytics.includes('A zero-value expense series is not inferred.'));
  assert.ok(analytics.includes('Financial trend unavailable'));
});

test('Dashboard Performance scopes source-backed delivery records to the shared reporting period', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('const PerformanceView: React.FC');
  const end = dashboard.indexOf('type DashboardAnalyticsReport', start);
  assert.ok(start >= 0 && end > start, 'Performance workspace should have a bounded source section');
  const performance = dashboard.slice(start, end);
  const scope = performance.indexOf('data-ams-feature-slug="dashboard-performance-scope"');
  const supportingMetrics = performance.indexOf('data-ams-feature-slug="dashboard-performance-supporting-metrics"');
  const primary = performance.indexOf('data-ams-feature-slug="dashboard-performance-primary"');
  const taskStatus = performance.indexOf('title="Task status in scope"', primary);
  const projectExceptions = performance.indexOf('title="Projects needing attention"', taskStatus);
  const trackedTime = performance.indexOf('title="Recorded time"', projectExceptions);
  assert.ok(scope >= 0 && supportingMetrics > scope && primary > supportingMetrics && taskStatus > primary && projectExceptions > taskStatus && trackedTime > projectExceptions,
    'Reporting scope and decision KPIs must lead, then task/project analysis and recorded-time context.');
  assert.ok(performance.includes("label: 'Task completion'"), 'Completion rate should be visible before detailed distribution.');
  assert.ok(performance.includes('const maxMemberTimeMinutes = Math.max(1, ...workload.map((member) => member.minutes))'));
  assert.ok(performance.includes('const totalTrackedMinutes = scopedTimeLogs.reduce'));
  assert.ok(performance.includes('const timeTrendModel = useMemo(() =>'));
  assert.ok(performance.includes('Recent 12 months'));
  assert.ok(performance.includes('<TrendChart'));
  assert.ok(performance.includes('View exact period values'));
  assert.ok(performance.includes('data-ams-feature-slug="dashboard-performance-supporting-metrics"'));
  assert.ok(performance.includes('role="img" aria-label={member.name +'));
  assert.match(performance, /matchesInterval\(dueDate, dueDate, task\.createdAt\)/);
  assert.match(performance, /matchesInterval\([\s\S]*project\.startDate \|\| project\.start[\s\S]*project\.createdAt[\s\S]*\)/);
  assert.match(performance, /matchesDate\(log\.date \|\| log\.createdAt\)/);
  assert.match(performance, /Missing usable dates remain visible/);
  assert.match(performance, /Current status · not status history/);
  assert.match(performance, /No task records match the selected reporting scope/);
  assert.match(performance, /Current status · selected date scope/);
  assert.match(performance, /Other open tasks/);
  assert.match(performance, /status\.count \/ tasks\.length \* 100/);
  assert.match(performance, /label: 'Active projects'/);
  assert.match(performance, /label: 'Task completion'/);
  assert.match(performance, /Total hours/);
  assert.match(performance, /Entries/);
});

test('Dashboard Performance puts decision KPIs first and visualizes recorded time as a comparison', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('const PerformanceView: React.FC');
  const end = dashboard.indexOf('type DashboardAnalyticsReport', start);
  const performance = dashboard.slice(start, end);
  const scope = performance.indexOf('data-ams-feature-slug="dashboard-performance-scope"');
  const kpis = performance.indexOf('data-ams-feature-slug="dashboard-performance-supporting-metrics"');
  const taskProjects = performance.indexOf('data-ams-feature-slug="dashboard-performance-primary"');
  const time = performance.indexOf('title="Recorded time"');
  assert.ok(scope >= 0 && kpis > scope && taskProjects > kpis && time > taskProjects);
  assert.ok(performance.includes("label: 'Task completion'"));
  assert.ok(performance.includes("label: 'Overdue tasks'"));
  assert.ok(performance.includes("label: 'Blocked tasks'"));
  assert.ok(performance.includes('Total hours'));
  assert.ok(performance.includes('Entries'));
  assert.ok(performance.includes('const maxMemberTimeMinutes = Math.max(1, ...workload.map((member) => member.minutes))'));
  assert.ok(performance.includes('Top eight contributors by recorded time. Bars compare within this list only.'));
  assert.ok(performance.includes('const timeTrendModel = useMemo(() =>'));
  assert.ok(performance.includes("style={{ width: shareWidth + '%' }}"));
});

test('Dashboard Analytics exposes report-first hierarchy and a single focused work surface', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('type DashboardAnalyticsReport');
  const end = dashboard.indexOf('export const GlobalExecutiveDashboard', start);
  assert.ok(start >= 0 && end > start, 'Analytics workspace should have a bounded source section');
  const analytics = dashboard.slice(start, end);
  const controls = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-controls"');
  const financial = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-financial-report"');
  const receivables = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-receivables-report"');
  const inquiry = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-inquiry-pipeline-report"');
  const projects = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-project-status-report"');
  assert.ok(controls >= 0 && financial > controls && receivables > controls && inquiry > controls && projects > controls,
    'Report and scope controls must precede each selectable report surface.');
  assert.ok(analytics.includes('reportPeriodMode: ReportingPeriodMode'));
  assert.ok(analytics.includes('reportPeriodValue: string'));
  assert.ok(analytics.includes('reportPeriodEnabled: boolean'));
  assert.ok(analytics.includes('buildFinancialTrendForReportingPeriod(reportPeriodMode, reportPeriodValue'));
  assert.ok(analytics.includes('Shared reporting period'));
  assert.equal(analytics.includes('DashboardTrendRangePicker'), false, 'Analytics must use the single topbar period control.');
  assert.doesNotMatch(analytics, /dashboard-analytics-kpis/, 'Mixed-period summary metrics should not appear after the selected report.');
  assert.match(analytics, /not posted profit/);
  assert.match(analytics, /Financial trend unavailable/);
  assert.match(analytics, /A zero-value trend is not inferred from an empty source/);
  assert.match(analytics, /Current invoice balances/);
  assert.match(analytics, /Current project register/);
  assert.ok(analytics.includes('Analytics reports'));
  assert.ok(analytics.includes('min-[900px]:grid-cols-4'), 'Report choices should have a consistent responsive grid.');
  assert.ok(analytics.includes('min-h-12 min-w-0 items-center'), 'Report selection should favor compact visual labels over explanatory text.');
  assert.equal(analytics.includes('option.description'), false, 'Report tiles should not repeat explanatory copy.');
  assert.ok(analytics.includes('const projectStatusMaximum = Math.max(1, ...projectStatusGroups.map((group) => group.count))'));
  assert.ok(analytics.includes('data-ams-feature-slug="dashboard-analytics-project-status-report"'));
  assert.ok(analytics.includes('Projects by current status'));
  assert.ok(analytics.includes('role="img" aria-label={group.status +'));
  assert.ok(analytics.includes('Current labels'), 'Project status summary should remain current-state and source-backed.');
});


test('Dashboard Analytics exposes the canonical inquiry pipeline only when Inbox access is allowed', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const charts = await read('src/components/charts/DashboardCharts.tsx');
  const start = dashboard.indexOf('const AnalyticsView:');
  const end = dashboard.indexOf('export const GlobalExecutiveDashboard', start);
  assert.ok(start >= 0 && end > start, 'Analytics workspace should be bounded.');
  const analytics = dashboard.slice(start, end);
  const inquiryStart = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-inquiry-pipeline-report"');
  const projectsStart = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-project-status-report"', inquiryStart);
  assert.ok(inquiryStart >= 0 && projectsStart > inquiryStart, 'Inquiry analysis should be a distinct selectable report before project status.');
  const inquiry = analytics.slice(inquiryStart, projectsStart);

  assert.ok(dashboard.includes("{ value: 'inquiry-pipeline', label: 'Inquiry pipeline' }"));
  assert.ok(analytics.includes("option.value !== 'inquiry-pipeline' || canOpenInbox"));
  assert.ok(analytics.includes("if (!canOpenInbox && report === 'inquiry-pipeline') setReport('financial-movement')"));
  assert.ok(analytics.includes("record.type === 'inquiry'"));
  assert.ok(analytics.includes("record.status !== 'closed'"));
  assert.ok(analytics.includes("Boolean(String(record.convertedClientId || '').trim())"));
  assert.ok(analytics.includes('record.services'));
  assert.ok(dashboard.includes('canOpenInbox={canOpenInbox}'));
  assert.ok(inquiry.includes('snapshot.inboxLeads === null'));
  assert.ok(inquiry.includes('No sales inquiry records returned'));
  assert.ok(inquiry.includes('Current status distribution'));
  assert.ok(inquiry.includes('Requested services'));
  assert.ok(inquiry.includes('One inquiry may request multiple services'));
  assert.ok(inquiry.includes('type “inquiry”'));
  assert.ok(inquiry.includes('Client linkage requires a saved Client Directory ID.'));
  assert.ok(inquiry.includes('No conversion rate or booked revenue is inferred.'));
  assert.ok(inquiry.includes('to="/admin/inbox"'));
  assert.ok(dashboard.includes('const buildInquiryVolumeTrend ='));
  assert.ok(inquiry.includes('data-ams-feature-slug="dashboard-analytics-inquiry-volume-trend"'));
  assert.ok(inquiry.includes('data-ams-feature-slug="dashboard-analytics-inquiry-status-visualization"'));
  assert.ok(inquiry.includes('<TrendChart'));
  assert.ok(inquiry.includes('<DonutChart'));
  assert.ok(inquiry.includes('bg-accent transition-[width]'));
  assert.ok(inquiry.includes('grouped by saved submission date'));
  assert.ok(inquiry.includes('without a valid submission date are excluded from this trend'));
  assert.ok(charts.includes('centerLabel?: string'));
  assert.ok(charts.includes("centerLabel = 'Projects'"), 'Existing donut users must retain their current center label by default.');
  assert.equal(inquiry.includes('budget'), false, 'Budget strings must not be aggregated as currency without a canonical numeric model.');
});

test('Dashboard priority exception drill-downs select the first route allowed for the current role', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-priority-exceptions"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-inbox-triage"', start);
  assert.ok(start >= 0 && end > start);
  const exceptions = dashboard.slice(start, end);
  assert.ok(exceptions.includes("att_projects_risk: ['/admin/projects?projects=all', '/admin/projects?projects=planning-delivery', '/admin/projects?projects=sprint']"));
  assert.ok(exceptions.includes("att_tasks_overdue: ['/admin/tasks?taskscope=due', '/admin/projects?projects=planning-delivery', '/admin/projects?projects=sprint']"));
  assert.ok(exceptions.includes("candidates.find((candidate) => candidate.startsWith('/admin/') && canOpenDashboardRoute(candidate))"));
  assert.equal(exceptions.includes("const destination = knownDestination[String(item.id || '')] || String(item.linkUrl || '')"), false,
    'A single fixed destination can disable a valid workspace for another role.');
});


test('Dashboard Overview adds a permission-gated Inbox triage card from the canonical lead source', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const inboxTriage = await read('src/lib/inboxTriage.ts');
  const inboxPage = await read('src/pages/admin/AdminInbox.tsx');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const stop = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, stop);
  const finance = overview.indexOf('data-ams-feature-slug="dashboard-finance-overview"');
  const projects = overview.indexOf('data-ams-feature-slug="dashboard-project-portfolio"');
  const progress = overview.indexOf('data-ams-feature-slug="dashboard-project-progress"');
  const exceptions = overview.indexOf('data-ams-feature-slug="dashboard-priority-exceptions"');
  const triage = overview.indexOf('data-ams-feature-slug="dashboard-inbox-triage"');
  const queue = overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const deadlines = overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  assert.ok(progress >= 0 && exceptions > progress && overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"') > exceptions && overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"') > overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"') && finance > overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"') && projects > finance);
  assert.ok(triage > exceptions && queue > triage && deadlines > queue);
  assert.ok(dashboard.includes("const canOpenInbox = canOpenDashboardRoute('/admin/inbox')"));
  assert.ok(dashboard.includes("canOpenInbox ? api.leads.getAll() : Promise.resolve"));
  assert.ok(dashboard.includes("inboxLeadRows.map((lead) => normalizeContactSubmission(lead as ContactSubmission)).filter((lead) => lead.type !== 'career')"));
  assert.ok(dashboard.includes("import { isInboxActionable, isInboxHighPriority, isInboxUnassigned } from '../../lib/inboxTriage'"));
  assert.ok(dashboard.includes("import { normalizeContactSubmission, type ContactSubmission } from '../../lib/submissions'"));
  assert.ok(dashboard.includes("const openRecords = operationalSnapshot.inboxLeads.filter((lead) => lead.status !== 'closed')"));
  assert.ok(dashboard.includes('.filter(isInboxActionable)'));
  assert.ok(dashboard.includes('.filter(isInboxUnassigned)'));
  assert.ok(dashboard.includes('.filter(isInboxHighPriority)'));
  assert.ok(dashboard.includes('Inbox data unavailable; triage counts are not inferred.'));
  assert.ok(dashboard.includes('title="Inbox is clear"'));
  assert.match(dashboard, /const allowedItems = canOpenInbox\s+\? items\.filter\(\(item\) => String\(item\.category \|\| ''\)\.toLowerCase\(\) !== 'sales' && item\.id !== 'att_leads_new'\)/);
  assert.match(dashboard, /return \[\.\.\.allowedItems\]\.sort\(\(left, right\) =>\s*dashboardAttentionSeverityRank\(left\.severity\) - dashboardAttentionSeverityRank\(right\.severity\)/);
  assert.ok(inboxTriage.includes("item.status === 'new'"));
  assert.ok(inboxTriage.includes('isInboxUnassigned(item)'));
  assert.ok(inboxPage.includes(".filter((item) => item.type !== 'career')"));
  assert.ok(inboxPage.includes('isInboxActionable(item)'));
});


test('Dashboard Needs attention card shows severity and authorised Inbox triage without artificial numbering', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-attention-center"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-desk"', start);
  assert.ok(start >= 0 && end > start);
  const attention = dashboard.slice(start, end);
  assert.ok(attention.includes('title="Needs attention"'));
  assert.ok(attention.includes('attentionSeveritySummary.urgent > 0'));
  assert.ok(attention.includes('attentionSeveritySummary.attention > 0'));
  assert.ok(attention.includes('filteredOverviewAttentionItems.slice(0, 4).map((item, index) => {'));
  assert.ok(attention.includes('aria-label="Filter attention by severity"'));
  assert.ok(attention.includes('data-ams-feature-slug="dashboard-priority-exceptions"'));
  assert.ok(attention.includes('data-ams-feature-slug="dashboard-inbox-triage"'));
  assert.ok(attention.includes("label: 'New', value: inboxTriageSummary.newCount"));
  assert.ok(attention.includes("label: 'Unassigned', value: inboxTriageSummary.unassignedCount"));
  assert.ok(attention.includes("label: 'High priority', value: inboxTriageSummary.highPriorityCount"));
  assert.equal(attention.includes('Priority 01'), false);
});


test('Dashboard Needs Attention places its clean-state pill and level filter in the header', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-attention-center"');
  const bodyStart = dashboard.indexOf('<div className="ams-dashboard-attention-list"', start);
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-desk"', bodyStart);
  assert.ok(start >= 0 && bodyStart > start && end > bodyStart);
  const header = dashboard.slice(start, bodyStart);
  const body = dashboard.slice(bodyStart, end);
  assert.ok(header.includes('ams-dashboard-attention-empty-indicator'));
  assert.ok(header.includes('No active exceptions'));
  assert.ok(header.indexOf('No active exceptions') < header.indexOf('Filter attention by severity'));
  assert.ok(header.includes("label: 'All levels'"));
  assert.equal(header.includes('>Severity</span>'), false, 'Do not repeat a visible Severity label beside the level selector.');
  assert.equal(body.includes('ams-dashboard-attention-toolbar'), false, 'The filter should live in the card header, not inside the body.');
  assert.equal(body.includes('>Severity</span>'), false);
  assert.ok(styles.includes('.ams-dashboard-attention-empty-indicator'));
  assert.ok(styles.includes('.ams-dashboard-attention-header-filter'));
  assert.match(styles, /\.ams-dashboard-attention-empty-indicator\s*\{[^}]*height:\s*32px;[^}]*min-height:\s*32px;/s);
  assert.match(styles, /\.ams-dashboard-attention-header-filter\s*\{[^}]*height:\s*32px;[^}]*min-height:\s*32px;/s);
  assert.match(styles, /\.ams-dashboard-attention-header-filter \.ams-dashboard-select-trigger\s*\{[^}]*height:\s*32px;[^}]*min-height:\s*32px;/s);
  assert.match(styles, /\.ams-dashboard-attention-empty-indicator\s*\{[^}]*align-self:\s*center;/s);
  assert.ok(body.includes('title="No exceptions match this severity"'), 'Filtered-empty state remains actionable.');
  assert.ok(body.includes("setAttentionSeverityFilter('all')"));
});

test('Dashboard Overview orders urgent delivery actions before finance and portfolio context', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const stop = dashboard.indexOf(") : view === 'performance' ? (", start);
  assert.ok(start >= 0 && stop > start);
  const overview = dashboard.slice(start, stop);
  const order = [
    'dashboard-project-progress',
    'dashboard-attention-center',
    'dashboard-delivery-desk',
    'dashboard-delivery-commitments',
    'dashboard-finance-overview',
    'dashboard-project-portfolio',
    'dashboard-team-workload',
    'dashboard-client-delivery-focus',
    'dashboard-recent-activity'
  ];
  let previous = -1;
  for (const slug of order) {
    const position = overview.indexOf('data-ams-feature-slug="' + slug + '"');
    assert.ok(position > previous, 'Overview priority/order must be clear: ' + slug);
    previous = position;
  }
  const shortcuts = dashboard.indexOf('data-ams-feature-slug="dashboard-workspace-shortcuts"');
  assert.ok(shortcuts >= 0 && shortcuts < start, 'Workspace shortcuts must live in the header before Overview content.');
  assert.equal(overview.includes('dashboard-workspace-shortcuts'), false);
  assert.equal(overview.includes('Priority 01'), false);
  assert.equal(overview.includes('data-ams-feature-slug="dashboard-agency-operating-indicators"'), false);
  const financeCard = overview.indexOf('data-ams-feature-slug="dashboard-finance-overview"');
  const financeMovement = overview.indexOf('data-ams-feature-slug="dashboard-finance-movement"');
  const projectPortfolio = overview.indexOf('data-ams-feature-slug="dashboard-project-portfolio"');
  assert.ok(financeCard >= 0 && financeMovement > financeCard && projectPortfolio > financeMovement,
    'Cash received and expenses must stay within the primary Finance card before the Projects card.');
  assert.ok(overview.includes('data-ams-feature-slug="dashboard-cash-received"'));
  assert.ok(overview.includes('data-ams-feature-slug="dashboard-expenses-recorded"'));
  assert.equal(overview.includes('data-ams-feature-slug="dashboard-money-movement"'), false,
    'Money movement must not add an extra full-width row outside the Finance card.');
  for (const label of ['Invoices vs expenses','Money movement','Projects in progress','Creative & IT workload','Needs attention','Task queue','Upcoming deadlines','Team workload','Client delivery focus','Recent activity']) {
    assert.ok(overview.includes(label), 'Missing overview card: ' + label);
  }
  assert.ok(dashboard.includes('const attentionItemsDataReturned = Array.isArray(data.attentionItems)'));
  assert.ok(dashboard.includes('attentionItemsDataAvailable: attentionItemsDataReturned ? true : previous.attentionItemsDataAvailable'));
  assert.ok(overview.includes('Exception data unavailable'));
  assert.ok(overview.includes('ams-dashboard-attention-empty-indicator'));
  assert.ok(overview.includes('No active exceptions'));
  assert.ok(overview.includes("candidates.find((candidate) => candidate.startsWith('/admin/') && canOpenDashboardRoute(candidate))"));
  assert.equal(overview.includes('title="Invoices vs expenses"'), false);
  assert.equal(overview.includes('title="Team capacity"'), false);
});

test('Dashboard exceptions sort by severity without artificial priority numbering', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.match(dashboard, /const dashboardAttentionSeverityRank = \(severity: unknown\) =>/);
  assert.match(dashboard, /if \(normalized === 'danger' \|\| normalized === 'critical'\) return 0;/);
  assert.match(dashboard, /if \(normalized === 'warning'\) return 1;/);
  assert.match(dashboard, /return \[\.\.\.allowedItems\]\.sort\(\(left, right\) =>\s*dashboardAttentionSeverityRank\(left\.severity\) - dashboardAttentionSeverityRank\(right\.severity\)/);
  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const attentionStart = overview.indexOf('data-ams-feature-slug="dashboard-attention-center"');
  const attentionEnd = overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"', attentionStart);
  const attention = overview.slice(attentionStart, attentionEnd);
  assert.ok(attentionStart >= 0 && attentionEnd > attentionStart);
  assert.ok(attention.includes('attentionSeveritySummary.urgent > 0'));
  assert.ok(attention.includes('border-danger/25 bg-danger/10'));
  assert.equal(overview.includes('Priority 01'), false);
});



test('Dashboard Overview visualizes all dated commitments and keeps the deadline preview compact', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-team-workload"', start);
  assert.ok(start >= 0 && end > start);
  const deadlines = dashboard.slice(start, end);
  assert.ok(dashboard.includes('const commitmentHorizonTotal = commitmentHorizonItems.length'));
  assert.ok(dashboard.includes("const overdueHorizonCount = commitmentHorizonItems.filter((item) => item.dueDate < currentDayKey).length"));
  assert.ok(dashboard.includes('const daysEightToThirtyCommitmentCount'));
  assert.ok(deadlines.includes('Overdue and due within 30 days'));
  assert.ok(deadlines.includes("aria-label={'Delivery deadlines within 30 days: ' + overdueHorizonCount"));
  assert.ok(deadlines.includes('upcomingCommitments.slice(0, 4).map((item) => {'));
  assert.ok(deadlines.includes("label:'Overdue'"));
  assert.ok(deadlines.includes("label:'Today–7 days'"));
  assert.ok(deadlines.includes("label:'Days 8–30'"));
  assert.ok(deadlines.includes('overdueHorizonCount / commitmentHorizonTotal'));
  assert.ok(deadlines.includes('nextSevenDayCommitmentCount / commitmentHorizonTotal'));
  assert.ok(deadlines.includes('daysEightToThirtyCommitmentCount / commitmentHorizonTotal'));
});


test('Dashboard Projects card visualizes Creative and IT workload from canonical service-line counts', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-project-portfolio"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-team-workload"', start);
  assert.ok(start >= 0 && end > start);
  const projects = dashboard.slice(start, end);
  assert.ok(dashboard.includes('const workstreamOpenTaskMaximum'));
  assert.ok(projects.includes('Creative & IT workload'));
  assert.ok(projects.includes("data-ams-feature-slug={'dashboard-workstream-open-task-load-' + line.key}"));
  assert.ok(projects.includes('canOpenTasks && operationalSnapshot.tasks !== null'));
  assert.ok(projects.includes('workstreamOpenTaskMaximum > 0 ? line.openTaskCount / workstreamOpenTaskMaximum * 100 : 0'));
  assert.ok(projects.includes('{line.projectCount} projects'));
  assert.ok(projects.includes('Task queue unavailable for this role or source.'));
  assert.ok(projects.includes('<DonutChart'));
  assert.ok(projects.includes('projectRiskBreakdown.map((item) => {'));
});


test('Dashboard task queue and deadline cards remain compact, responsive and source-backed', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const stop = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, stop);
  const queueStart = overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const deadlineStart = overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  assert.ok(queueStart >= 0 && deadlineStart > queueStart);
  const queue = overview.slice(queueStart, deadlineStart);
  assert.ok(queue.includes('visibleOverviewTasks.slice(0, 5).map((task) => {'));
  assert.ok(queue.includes('ariaLabel="Task queue filters"'));
  assert.ok(queue.includes('onChange={(value)=>setOverviewTaskFilter(value as DashboardTaskFilter)}'));
  assert.ok(queue.includes('canOpenDashboardRoute(taskDestination)'));
  assert.ok(dashboard.includes('const taskLoadByAssigneeMaximum = Math.max(1, ...taskLoadByAssignee.map((owner) => owner.total))'));
  assert.ok(overview.includes("aria-label={'Open task load for ' + owner.label"));
  assert.ok(overview.includes("style={{ width: owner.total / taskLoadByAssigneeMaximum * 100 + '%' }}"));
  assert.equal(overview.includes('pagedDashboardProjects'), false);
  assert.equal(queue.includes('AdminTablePagination'), false, 'The Tasks queue does not use a second local pagination system.');
  assert.ok(overview.includes('<AdminTablePagination'), 'Recent Activity should use the existing AMS pagination primitive.');
  assert.equal(overview.includes('title="Active projects"'), false);
});


test('Task queue filters live in the card header beside Open Tasks', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const queueStart = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const headerActionsStart = dashboard.indexOf('actions={(', queueStart);
  const headerEnd = dashboard.indexOf('\n              >', headerActionsStart);
  const bodyEnd = dashboard.indexOf('</AdminPanel>', headerEnd);
  assert.ok(queueStart >= 0 && headerActionsStart > queueStart && headerEnd > headerActionsStart && bodyEnd > headerEnd);
  const headerActions = dashboard.slice(headerActionsStart, headerEnd);
  const body = dashboard.slice(headerEnd, bodyEnd);
  assert.ok(headerActions.includes('ariaLabel="Task queue filters"'));
  assert.ok(headerActions.includes('density="compact"'));
  assert.ok(headerActions.includes('className="ams-dashboard-card-header-actions ams-dashboard-task-filter-toolbar"'));
  assert.ok(headerActions.includes('overviewTaskQueueHref'));
  assert.equal(body.includes('ariaLabel="Task queue filters"'), false, 'The Task queue body should not repeat filters already placed in its header.');
  assert.equal(body.includes('ams-dashboard-task-filter-toolbar'), false);
});

test('Dashboard Overview gates module links through the existing route-access policy', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const stop = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, stop);
  assert.ok(dashboard.includes("const canOpenProjects = canOpenDashboardRoute('/admin/projects')"));
  assert.ok(dashboard.includes("const canOpenTasks = canOpenDashboardRoute('/admin/tasks')"));
  assert.ok(dashboard.includes("const canOpenTimeLogs = canOpenDashboardRoute('/admin/time-logs')"));
  assert.ok(dashboard.includes("const canOpenInvoiceRegister = canOpenDashboardRoute('/admin/finance?tab=accounts-receivable')"));
  assert.ok(dashboard.includes("const canOpenExpenseRegister = canOpenDashboardRoute('/admin/finance?tab=expenses')"));
  assert.ok(dashboard.includes(".filter((action) => canOpenDashboardRoute(action.href)).map((action) => ("));
  assert.ok(overview.includes('disabled={!canOpenTasks}'));
  assert.ok(overview.includes('canOpenDashboardRoute(taskDestination)'));
  assert.ok(overview.includes('canOpenProjects && canOpenDashboardRoute(projectHref)'));
  assert.ok(overview.includes('to="/admin/time-logs"'));
  assert.ok(overview.includes('ams-dashboard-team-time__header-actions'));
  assert.ok(overview.includes('{canOpenInvoiceRegister ? ('));
  assert.ok(overview.includes('{canOpenExpenseRegister ? ('));
  assert.ok(overview.includes("candidates.find((candidate) => candidate.startsWith('/admin/') && canOpenDashboardRoute(candidate))"));
});


test('Dashboard Overview displays canonical recent audit activity only for permitted roles', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const stop = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, stop);
  const activity = overview.indexOf('data-ams-feature-slug="dashboard-recent-activity"');
  assert.ok(activity >= 0);
  assert.match(dashboard, /hasAdminPermission\('canViewSecurityAuditLogs'\)/);
  assert.match(dashboard, /const activityDataReturned = Array\.isArray\(data\.recentActivity\)/);
  assert.match(dashboard, /recentActivity: activityDataReturned \? data\.recentActivity as DashboardRecentActivity\[\] : previous\.recentActivity \?\? \[\]/);
  assert.ok(overview.includes('{canViewAuditLogs ? ('), 'Audit records must remain hidden without audit-log permission.');
  assert.ok(overview.includes('Recent activity unavailable'));
  assert.ok(overview.includes("'No recorded activity yet'"));
  assert.ok(overview.includes('/admin/settings?tab=audit'));
  const panel = overview.slice(activity);
  assert.match(panel, /activity\.action/);
  assert.match(panel, /activity\.actor/);
  assert.match(panel, /activity\.timestamp/);
  assert.doesNotMatch(panel, /activity\.(?:ip|userAgent|details|hash|prevHash|metadata)/);
});

test('Dashboard Performance prioritizes overdue and risk-flagged projects before truncating the attention list', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('const PerformanceView: React.FC');
  const end = dashboard.indexOf('const AnalyticsView: React.FC', start);
  assert.ok(start >= 0 && end > start);
  const performance = dashboard.slice(start, end);
  assert.ok(performance.includes('const projectAttentionSignals = (project: any) => {'));
  assert.ok(performance.includes("[project.health, project.status].filter(Boolean).join(' ')"));
  assert.ok(performance.includes('return signals.flagged || signals.overdue;'));
  assert.ok(performance.includes('if (leftSignals.overdue !== rightSignals.overdue) return leftSignals.overdue ? -1 : 1;'));
  assert.ok(performance.includes('leftSignals.due.localeCompare(rightSignals.due)'));
  assert.ok(performance.includes('const needsAttention = attentionProjects.slice(0, 8);'));
});


test('Dashboard Overview uses a rounded reference-led visual system and interactive financial trend', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const chart = await read('src/components/charts/DashboardCharts.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const designSystem = await read('AMS-DESIGN-SYSTEM.md');
  assert.ok(dashboard.includes("import './GlobalExecutiveDashboard.css';"));
  assert.ok(dashboard.includes('presentation="maven"'));
  assert.ok(dashboard.includes('ams-overview-panel--finance'));
  assert.ok(dashboard.includes('ams-overview-panel--projects'));
  assert.ok(dashboard.includes('ams-overview-card-row'));
  assert.ok(chart.includes("presentation?: 'default' | 'maven'"));
  assert.ok(chart.includes("const primaryLineColor = isMavenPresentation ? 'var(--series-3)' : 'var(--series-1)'"));
  assert.ok(chart.includes("const secondaryLineColor = isMavenPresentation ? 'var(--series-2)' : 'var(--series-3)'"));
  assert.ok(chart.includes("event.key === 'ArrowLeft' || event.key === 'ArrowRight'"));
  assert.ok(chart.includes('Use left and right arrow keys to inspect points'));
  assert.ok(chart.includes("style={{ touchAction: isMavenPresentation ? 'pan-y' : 'none' }}"));
  assert.ok(styles.includes('--dashboard-card-shadow: 0 3px 18px'));
  assert.ok(styles.includes('--dashboard-card-shadow: none'));
  assert.ok(styles.includes('border-radius: var(--radius-dashboard-card)'));
  assert.ok(styles.includes('.ams-overview-panel:has(a:hover)'));
  assert.ok(styles.includes('@media (prefers-reduced-motion: reduce)'));
  assert.ok(!styles.includes('!important'));
  assert.ok(designSystem.includes('Dashboard reference-led visual variant'));
  assert.ok(designSystem.includes('dark mode remains shadow-free'));
});


test('Dashboard Overview keeps reporting controls card-local and operational filters functional', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);

  assert.ok(dashboard.includes('aria-label="Dashboard views"'));
  assert.ok(dashboard.includes("to={tab.key === 'overview' ? '/admin/dashboard' : '/admin/dashboard?view=' + tab.key}"));
  assert.equal(dashboard.includes('aria-label="Reporting period type"'), false);
  assert.equal(dashboard.includes('aria-label="Reporting date range"'), false);
  assert.equal(dashboard.includes('setMode: setReportingPeriodMode'), false);
  assert.equal(dashboard.includes('setValue: setReportingPeriodValue'), false);
  assert.equal(dashboard.includes('clearFilter: clearReportingPeriodFilter'), false);
  assert.equal(dashboard.includes('getReportingYearOptions(currentYear, [], selectedReportingRange?.year ?? currentYear)'), false);
  assert.ok(dashboard.includes("getReportingPeriodRange(reportPeriodValue, reportPeriodMode, 'en-GB')"));
  assert.equal(dashboard.includes('aria-label="Previous reporting period"'), false);
  assert.equal(dashboard.includes('aria-label="Next reporting period"'), false);
  assert.equal(dashboard.includes('onClick={clearReportingPeriodFilter}'), false);
  assert.equal(overview.includes('dashboard-overview-reporting-scope'), false);
  assert.equal(dashboard.includes('ams-dashboard-period-controls'), false);
  assert.ok(overview.includes('ariaLabel="Finance reporting period"'));
  assert.ok(overview.includes('ariaLabel="Recorded time reporting period"'));
  assert.ok(overview.includes('ariaLabel="Filter activity by time window"'));
  assert.equal(dashboard.includes('aria-label="Reporting date range"'), false);

  assert.ok(dashboard.includes("orderedActiveDashboardProjects\n    .filter((project) => overviewProjectFilter === 'all' || getDashboardServiceLine(project) === overviewProjectFilter)"));
  assert.ok(overview.includes('ariaLabel="Filter projects by service line"'));
  assert.ok(overview.includes('onChange={(value)=>setOverviewProjectFilter(value as DashboardProjectFilter)}'));
  assert.ok(overview.includes('count:activeDashboardProjectFilterCounts.all'));
  assert.ok(overview.includes('count:activeDashboardProjectFilterCounts.creative'));
  assert.ok(overview.includes('count:activeDashboardProjectFilterCounts.technology'));
  assert.ok((await read('src/components/admin/DashboardControls.tsx')).includes('count={o.count}'));

  assert.ok(dashboard.includes("const upcomingCommitments = allUpcomingCommitments.filter((item) => {"));
  assert.ok(dashboard.includes("if (overviewDeadlineFilter === 'overdue') return item.dueDate < currentDayKey"));
  assert.ok(dashboard.includes("if (overviewDeadlineFilter === 'next7') return item.dueDate >= currentDayKey && item.dueDate <= nextSevenDaysKey"));
  assert.ok(dashboard.includes("if (overviewDeadlineFilter === 'days8to30') return item.dueDate > nextSevenDaysKey && item.dueDate <= nextThirtyDaysKey"));
  assert.ok(overview.includes('ariaLabel="Filter deadlines"'));
  assert.ok(overview.includes('onChange={(value)=>setOverviewDeadlineFilter(value as DashboardDeadlineFilter)'));
  assert.ok(overview.includes('ariaLabel="Task queue filters"'));
  assert.equal(overview.includes('Priority 01'), false);
});


test('Dashboard header provides aligned quick actions and tabs without a duplicate reporting bar', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const headerStart = dashboard.indexOf('<AdminModuleHeader slug="dashboard-header"');
  const headerEnd = dashboard.indexOf('<section className="ams-dashboard-toolbar', headerStart);
  assert.ok(headerStart >= 0 && headerEnd > headerStart, 'Dashboard header must be a bounded region.');
  const header = dashboard.slice(headerStart, headerEnd);
  assert.ok(header.includes('data-ams-feature-slug="dashboard-quick-actions"'));
  assert.ok(dashboard.includes("const canCreateInvoice = hasAdminPermission('canManageInvoices') && canOpenInvoiceRegister"));
  assert.ok(header.includes("'/admin/finance?tab=accounts-receivable&action=create-invoice'"));
  assert.equal(header.includes('/admin/tasks?create=1'), false);
  assert.ok(header.includes("'/admin/projects?create=1'"));
  assert.ok(header.includes('ams-dashboard-header-action--invoice'));
  assert.ok(header.includes("title={canCreateInvoice?'Create a new invoice':'Open the invoice register'}"));
  assert.ok(header.includes("title={canCreateProject?'Create a new project':'Open the Projects workspace'}"));
  assert.ok(header.includes('ams-dashboard-header-action--project'));
  assert.ok(header.includes('ams-dashboard-header-action--refresh'));
  assert.ok(header.includes('ams-dashboard-header-utility-actions'));
  assert.ok(styles.includes('.ams-dashboard-page-header .ams-dashboard-header-actions .ams-dashboard-control'));
  assert.ok(styles.includes('height:36px; min-height:36px;'));
  assert.ok(styles.includes('.ams-dashboard-toolbar[aria-label="Dashboard view and reporting controls"] > .ams-dashboard-view-tabs'));
  assert.ok(styles.includes('overflow-x:visible;'));
  assert.ok(header.includes("canCreateInvoice?'Create invoice':'Invoices'"));
  assert.equal(header.includes('New task'), false);
  assert.ok(header.includes("canCreateProject?'New project':'Projects'"));
  assert.ok(header.includes('ariaLabel="Refresh dashboard data"'));

  assert.ok(invoicing.includes("const requestedInvoiceAction = searchParams.get('action')"));
  assert.ok(invoicing.includes("requestedInvoiceAction !== 'create-invoice'"));
  assert.ok(invoicing.includes("embeddedView !== 'receivables'"));
  assert.ok(invoicing.includes('createInvoiceActionHandled.current = true'));
  assert.ok(invoicing.includes('openCreateInvoice();'));
  assert.ok(header.includes('className="mb-0 ams-dashboard-page-header"'));
  assert.ok(styles.includes('.ams-dashboard-header-actions > a,'));
  assert.ok(styles.includes('.ams-dashboard-header-actions > a:focus-visible'));
  assert.ok(styles.includes('.ams-dashboard-control--primary'));
  assert.ok(styles.includes('.ams-dashboard-control--action'));
  assert.ok(styles.includes('grid-template-columns: minmax(0, 1fr) auto'));
  assert.ok(styles.includes('border-bottom: 0'));
  assert.ok(styles.includes('.ams-dashboard-page-header h1'));
  assert.ok(styles.includes('border-radius: 10px'));
  assert.ok(styles.includes('.ams-dashboard-toolbar > .ams-dashboard-view-tabs .ams-dashboard-view-tab[aria-current="page"]'));
  assert.ok(styles.includes('.ams-dashboard-select-trigger'));
  assert.ok(styles.includes('prefers-reduced-motion: reduce'));

  const toolbarStart = dashboard.indexOf('<section className="ams-dashboard-toolbar');
  const toolbarEnd = dashboard.indexOf('{isRefreshing &&', toolbarStart);
  const toolbar = dashboard.slice(toolbarStart, toolbarEnd);
  assert.ok(toolbar.includes('aria-label="Dashboard views"'));
  assert.equal(toolbar.includes('aria-label="Reporting period filters"'), false);
  assert.equal(toolbar.includes('aria-label="Reporting date range"'), false);
  assert.equal(toolbar.includes('<CalendarDays size={14}'), false);
  assert.equal(toolbar.includes('aria-label="Previous reporting period"'), false);
  assert.equal(toolbar.includes('aria-label="Next reporting period"'), false);
  assert.equal(toolbar.includes('clearReportingPeriodFilter'), false);
  assert.ok(toolbar.includes("view === tab.key ? 'is-active border-accent bg-transparent text-fg'"));
});


test('Dashboard Overview presents Finance and Projects as compact visual work surfaces', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const financeStart = overview.indexOf('data-ams-feature-slug="dashboard-finance-overview"');
  const projectStart = overview.indexOf('data-ams-feature-slug="dashboard-project-portfolio"', financeStart);
  const finance = overview.slice(financeStart, projectStart);
  assert.equal(overview.includes('ams-overview-scope__meta'), false);
  assert.equal(overview.includes('dashboard-overview-reporting-scope'), false);
  assert.equal(dashboard.includes('ams-dashboard-period-controls'), false);
  assert.ok(overview.includes('ariaLabel="Finance reporting period"'));
  assert.ok(overview.includes('ariaLabel="Recorded time reporting period"'));
  assert.ok(overview.includes('ariaLabel="Filter activity by time window"'));
  assert.ok(finance.includes('ams-finance-control-links'));
  assert.ok(finance.includes('data-ams-feature-slug="dashboard-finance-movement"'));
  assert.ok(finance.includes('data-ams-feature-slug="dashboard-finance-trend"'));
  assert.ok(finance.includes('presentation="maven"'));
  assert.ok(finance.includes('ams-finance-movement-card__chart'));
  assert.ok(finance.includes('ams-money-movement-sparkline--cash'));
  assert.ok(finance.includes('ams-money-movement-sparkline--expenses'));
  assert.equal(finance.includes('Cash received and eligible expenses in the selected period.'), false);
  assert.ok(overview.includes('ams-project-summary-grid'));
  assert.ok(overview.includes('dashboard-active-project-count'));
  assert.ok(overview.includes('dashboard-overdue-commitment-count'));
  assert.ok(overview.includes('dashboard-open-task-count'));
  assert.ok(overview.includes('Filter projects by service line'));
  assert.ok(overview.includes('Filter deadlines'));
  assert.ok(overview.includes('Task queue filters'));
  assert.ok(overview.includes('setOverviewProjectFilter'));
  assert.ok(overview.includes('setOverviewDeadlineFilter'));
  assert.ok(overview.includes('setOverviewTaskFilter'));
  assert.ok(styles.includes('.ams-project-summary-grid'));
  assert.ok(styles.includes('.ams-finance-movement-card__icon'));
  assert.ok(styles.includes('.ams-finance-movement-card__context'));
  assert.ok(styles.includes('.ams-finance-movement-card__axis-labels'));
  assert.ok(styles.includes('align-items: flex-end;'));
  assert.ok(styles.includes('justify-content: space-between;'));
  assert.ok(styles.includes('.ams-dashboard-period-controls'));
  assert.equal(overview.includes('Priority 01'), false);
});


test('Dashboard Finance layout follows the card width and keeps its financial sections visually distinct', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const financeStart = overview.indexOf('data-ams-feature-slug="dashboard-finance-overview"');
  const projectStart = overview.indexOf('data-ams-feature-slug="dashboard-project-portfolio"', financeStart);
  const finance = overview.slice(financeStart, projectStart);

  assert.ok(finance.includes('ams-dashboard-finance-body'));
  assert.ok(finance.includes('ams-finance-primary-grid'));
  assert.ok(finance.includes('ams-finance-primary-metric'));
  assert.ok(finance.includes('data-ams-feature-slug="dashboard-finance-trend"'));
  assert.ok(finance.includes('ariaLabel="Finance reporting period"'));
  assert.ok(finance.includes('ams-finance-movement-card__value'));
  assert.ok(finance.includes('ams-finance-movement-card__context'));
  assert.ok(finance.includes('ams-finance-movement-card--cash'));
  assert.ok(finance.includes('ams-finance-movement__title-group'));
  assert.ok(finance.includes('Cash &amp; expense movement'));
  assert.ok(finance.includes('ams-quotation-follow-up__description'));
  assert.ok(finance.includes('data-ams-feature-slug="dashboard-commercial-quotation-pipeline"'));

  assert.ok(styles.includes('container-name: finance-card;'));
  assert.ok(styles.includes('@container finance-card (min-width: 620px)'));
  assert.ok(styles.includes('@container finance-card (max-width: 619px)'));
  assert.ok(styles.includes('@container finance-card (max-width: 419px)'));
  assert.ok(styles.includes('.ams-dashboard-finance-trend-region .ams-trend-chart__plot'));
  assert.ok(styles.includes('.ams-finance-quotation-row'));
  assert.ok(styles.includes('grid-template-columns: minmax(0, 1fr)'));
});

test('Dashboard Overview exposes canonical quotation follow-up and functional commercial stage filters', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const financeStart = overview.indexOf('data-ams-feature-slug="dashboard-finance-overview"');
  const projectsStart = overview.indexOf('data-ams-feature-slug="dashboard-project-portfolio"', financeStart);
  const financeCard = overview.slice(financeStart, projectsStart);

  assert.ok(dashboard.includes("const canOpenQuotationRegister = canOpenDashboardRoute('/admin/finance?tab=quotations')"));
  assert.ok(dashboard.includes("canOpenQuotationRegister ? api.proposals.getAll() : Promise.resolve({ success: true, data: { proposals: [] } })"));
  assert.ok(dashboard.includes("const quotations = canOpenQuotationRegister ? readRows(results[8], 'proposals') : null"));
  assert.ok(dashboard.includes('quotations: canOpenQuotationRegister ? quotations ?? previous.quotations : null'));
  assert.ok(financeCard.includes('data-ams-feature-slug="dashboard-commercial-quotation-pipeline"'));
  assert.ok(financeCard.includes('ariaLabel="Filter quotations by stage"'));
  assert.ok(financeCard.includes('onChange={(value)=>setOverviewQuotationFilter(value as DashboardQuotationFilter)'));
  assert.ok(financeCard.includes("onChange={(value)=>setOverviewQuotationFilter(value as DashboardQuotationFilter)"));
  assert.ok(dashboard.includes("(quotation.status === 'approved' && !quotation.invoiceId)"), 'Approved quotations without a linked invoice stay in the active follow-up pipeline.');
  assert.ok(dashboard.includes("['draft', 'review', 'sent'].includes(quotation.status)"), 'Draft, review, and sent quotations remain in the actionable current pipeline.');
  assert.ok(financeCard.includes('No quotations match this stage'));
  assert.ok(financeCard.includes('Quotation data unavailable'));
  assert.ok(financeCard.includes("title={'No quotation records in ' + financeCurrency}"));
  assert.ok(financeCard.includes('Validity not recorded'));
  assert.ok(financeCard.includes('Amount not recorded'));
  assert.ok(financeCard.includes('to="/admin/finance?tab=quotations"'));
  assert.equal(financeCard.includes('fakeQuotation'), false);
  assert.equal(financeCard.includes('sampleQuotation'), false);
});




test('Maven Finance trend uses reference-style point-following hover and consistent series colours', async () => {
  const chart = await read('src/components/charts/DashboardCharts.tsx');
  assert.ok(chart.includes('yPercent: number'));
  assert.ok(chart.includes('yPercent: ((selectedPoint.y - top) / innerHeight) * 100'));
  assert.ok(chart.includes('stroke={primaryLineColor}'));
  assert.ok(chart.includes('stroke={secondaryLineColor}'));
  assert.ok(chart.includes('top: isMavenPresentation ? `clamp(8px, calc(${hover?.yPercent ?? 35}% - 44px), calc(100% - 124px))` : \'0\''));
  assert.ok(chart.includes('{!isMavenPresentation && <div className="mt-1 text-[10px] text-muted">'));
  assert.ok(chart.includes('stopColor={primaryLineColor} stopOpacity="0"'));
});


test('Dashboard refresh warnings keep the main status concise and preserve source detail on demand', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-refresh-warning"');
  const end = dashboard.indexOf("{view === 'overview' ?", start);
  assert.ok(start >= 0 && end > start, 'Dashboard refresh warning should be present before the Overview cards.');
  const warning = dashboard.slice(start, end);
  assert.ok(warning.includes('Some dashboard data could not be refreshed.'));
  assert.ok(warning.includes('Dashboard refresh failed.'));
  assert.ok(warning.includes('Previously loaded values remain visible; unavailable sources are not treated as zero.'));
  assert.ok(warning.includes('<details'));
  assert.ok(warning.includes('View refresh details'));
  assert.ok(warning.includes('{refreshNotice}'));
});


test('Dashboard calendar filters are dropdowns with card-local periods and accessible date selection', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const end = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, end);
  assert.ok(dashboard.includes('const DashboardCalendarPeriodFilter: React.FC<DashboardCalendarPeriodFilterProps>'));
  assert.ok(dashboard.includes('Choose reporting period'));
  assert.ok(dashboard.includes('ariaLabel="Reporting period grouping"'));
  assert.ok(overview.includes('ariaLabel="Finance reporting period"'));
  assert.ok(overview.includes('ariaLabel="Recorded time reporting period"'));
  assert.ok(overview.includes('ariaLabel="Filter activity by time window"'));
  assert.ok(overview.includes('aria-label="Activity calendar filter options"'));
  assert.ok(overview.includes('aria-label="Recent activity start date"'));
  assert.ok(overview.includes('aria-label="Recent activity end date"'));
  assert.ok(styles.includes('.ams-calendar-period-filter__panel'));
  assert.match(styles, /background:\s*var\(--line\);/);
  assert.ok(styles.includes('/* Minimal Dashboard polish: no decorative dividers — 2026-10-27.'));
  const finalTabLayer = styles.slice(styles.lastIndexOf('/* Dashboard interaction and alignment contract — final layer, 27 October 2026. */'));
  assert.ok(finalTabLayer.includes('background: var(--accent);'), 'Active tabs remain crimson.');
  assert.ok(finalTabLayer.includes('border-bottom: 0;'), 'Active tabs must not use a bottom underline.');
  assert.doesNotMatch(finalTabLayer, /border-bottom:\s*2px solid var\(--accent\)/, 'No active tab underline should remain in the final layer.');
  assert.ok(finalTabLayer.includes('.ams-dashboard-control--filter[aria-pressed="true"]'));
  assert.doesNotMatch(finalTabLayer, /box-shadow:\s*inset 0 -2px 0 var\(--accent\)/, 'Active filters use a neutral grey surface without a crimson underline.');
  assert.equal(styles.includes('--dashboard-active-bg:#641326'), false);
  assert.ok(styles.includes('.ams-portal-root .ams-calendar-period-filter__panel'));
  assert.ok(styles.includes('.ams-portal-root .ams-dashboard-activity-calendar-panel'));
  assert.ok(styles.includes('overflow-y:auto;'));
  assert.doesNotMatch(overview, /overflow-x-auto/, 'Dashboard Overview must not introduce horizontal scroll strips.');
  assert.ok(dashboard.includes('ariaExpanded={open}'));
  assert.ok(dashboard.includes('anchorRef={triggerRef}'));
  assert.ok(dashboard.includes('anchorRef={activityCalendarTriggerRef}'));
  assert.ok(dashboard.includes("setActivityCalendarOpen(next==='custom')"));
});

test('Dashboard Overview uses compact source states and custom controls without oversized blank panels', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const overviewStart = dashboard.indexOf("{view === 'overview' ?");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ?", overviewStart);
  assert.ok(overviewStart >= 0 && overviewEnd > overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  for (const title of [
    'Project portfolio unavailable',
    'Project progress unavailable',
    'Task queue unavailable',
    'Delivery schedule unavailable',
    'Client delivery data unavailable',
    'Financial movement unavailable',
    'No eligible financial records',
    'Quotation data unavailable',
    'Exception data unavailable'
  ]) assert.ok(overview.includes(title), 'Missing truthful Dashboard state: ' + title);
  assert.ok(overview.includes('ams-dashboard-state--compact'));
  assert.ok(dashboard.includes('ams-dashboard-empty'));
  assert.equal(overview.includes('min-h-[220px]'), false, 'Unavailable Finance charts must not reserve a chart-height blank panel.');
  assert.equal(overview.includes('min-h-[250px]'), false, 'An empty project source must not reserve a large blank portfolio area.');
  assert.ok(styles.includes('.ams-dashboard-state--compact'));
  assert.ok(styles.includes('.ams-dashboard-state--empty .ams-dashboard-state__icon'));
  assert.ok(styles.includes('@media (max-width: 599px)'));
});


test('Dashboard lead row aligns Projects to Finance and avoids conflicting card heights', async () => {
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const row = styles.match(/\.ams-shell \.ams-dashboard \.ams-overview-card-row\s*\{([^}]*)\}/);
  const financeRow = styles.match(/\.ams-shell \.ams-dashboard \.ams-overview-card-row\[aria-label="Finance and project overview"\]\s*\{([^}]*)\}/);
  const projectsSection = styles.match(/\.ams-shell \.ams-dashboard \.ams-overview-card-row\[aria-label="Finance and project overview"\]\s*>\s*section\[data-ams-feature-slug="dashboard-project-portfolio"\]\s*\{([^}]*)\}/);
  assert.ok(row && /align-items:\s*stretch;/.test(row[1]) && /gap:\s*14px;/.test(row[1]));
  assert.ok(financeRow && /align-items:\s*stretch;/.test(financeRow[1]) && /gap:\s*12px;/.test(financeRow[1]));
  assert.ok(projectsSection && /align-self:\s*stretch;/.test(projectsSection[1]) && /display:\s*flex;/.test(projectsSection[1]));
  assert.match(styles, /\.ams-dashboard-projects-panel\s*\{[^}]*height:\s*100%;/s);
});;


test('Overview action buttons, panel headers, dropdown states, and filter rows share one visual contract', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const end = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, end);

  assert.ok(dashboard.includes('ams-dashboard-header-primary-actions'));
  assert.ok(overview.includes('ams-project-progress-header-actions'));
  assert.ok(overview.includes('ams-dashboard-projects-body'));
  assert.ok(overview.includes('className="ams-project-portfolio-body space-y-4'));
  assert.doesNotMatch(overview, /overflow-x-auto/, 'Dashboard Overview filters must wrap rather than scroll horizontally.');

  for (const action of [
    'Open Finance', 'Open quotation ledger', 'View tasks', 'Open Time Logs',
    'View audit log', 'Open Inbox', 'Open Tasks', 'Open Projects', 'Open project delivery'
  ]) {
    const index = overview.indexOf(action);
    assert.ok(index >= 0, 'Missing expected dashboard action: ' + action);
    assert.ok(overview.slice(Math.max(0, index - 700), index).includes('ams-dashboard-card-action'),
      'Action should use the shared card-action style: ' + action);
  }

  assert.ok(styles.includes('height: 58px;'));
  assert.ok(styles.includes('.ams-dashboard-card-action'));
  assert.ok(styles.includes('height: 32px;'));
  assert.ok(styles.includes('.ams-dashboard-filter-pills'));
  assert.ok(styles.includes('.ams-dashboard-select-trigger[aria-expanded="true"]'));
  assert.ok(styles.includes('.ams-dropdown-item[data-active="true"]:not([data-selected="true"])'));
  assert.ok(styles.includes('.ams-dashboard-filter-pill[aria-pressed="true"]'));
  assert.equal(styles.includes('--dashboard-active-bg:#641326'), false);
  const activeTabsLayer = styles.slice(styles.lastIndexOf('/* Dashboard interaction and alignment contract — final layer, 27 October 2026. */'));
  assert.ok(activeTabsLayer.includes('background: var(--accent);'), 'Selected tabs retain their crimson active state.');
  assert.doesNotMatch(activeTabsLayer, /border-bottom:\s*2px solid var\(--accent\)/, 'Selected tabs must not use a crimson underline.');
  assert.match(styles, /background:\s*var\(--line\)/);
  assert.ok(styles.includes('.ams-dashboard-dropdown-menu .ams-dropdown-item[data-selected="true"]'));
});


test('All Dashboard buttons, filters, and calendar controls share the same component contract', async () => {
  const pageStyles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const controlStyles = await read('src/components/admin/DashboardControls.css');
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const shared = await read('src/components/admin/DashboardControls.tsx');

  assert.ok(shared.includes("import './DashboardControls.css';"));
  assert.ok(shared.includes('export const DashboardControl'));
  assert.ok(shared.includes('export const DashboardFilterGroup'));
  for (const selector of [
    '.ams-dashboard-control:hover:not(:disabled)',
    '.ams-dashboard-control--filter:hover:not(:disabled)',
    '.ams-dashboard-header-actions .ams-dashboard-control',
    '.ams-overview-panel .ams-dashboard-control--action',
    '.ams-dashboard-toolbar > .ams-dashboard-view-tabs',
    '.ams-calendar-period-filter__trigger',
    '.ams-calendar-period-filter__tile',
    '.ams-dashboard-activity-calendar-panel'
  ]) assert.ok(controlStyles.includes(selector), 'Missing shared control style: ' + selector);

  assert.ok(controlStyles.includes('--dashboard-control-height: 36px;'));
  assert.ok(controlStyles.includes('--dashboard-control-compact-height: 32px;'));
  assert.ok(controlStyles.includes('--dashboard-control-radius: 8px;'));
  assert.ok(controlStyles.includes('--dashboard-control-hover:'));
  assert.ok(controlStyles.includes('height: var(--dashboard-control-height, 36px);'));
  assert.ok(controlStyles.includes('height: var(--dashboard-control-compact-height, 32px);'));
  assert.ok(controlStyles.includes('outline: 2px solid var(--accent);'));
  assert.ok(controlStyles.includes('overflow-x: visible;'));
  assert.ok(controlStyles.includes('@media (max-width: 599px)'));
  assert.doesNotMatch(controlStyles, /!important/);

  for (const marker of [
    'ams-dashboard-header-action', 'ams-dashboard-header-shortcut',
    'ams-project-registry-action', 'ams-dashboard-card-action',
    'ams-calendar-period-filter__trigger', 'ams-calendar-period-filter__tile',
    'ams-dashboard-activity-calendar-trigger'
  ]) assert.ok(dashboard.includes(marker), 'Missing shared Dashboard control usage: ' + marker);
  assert.ok(dashboard.includes('bodyClassName="ams-dashboard-projects-body p-4 sm:p-5"'));
  assert.ok(pageStyles.includes('.ams-dashboard-projects-body > .ams-project-portfolio-body'));
  assert.ok(pageStyles.includes('.ams-dashboard-team-time__header-actions'));
});
