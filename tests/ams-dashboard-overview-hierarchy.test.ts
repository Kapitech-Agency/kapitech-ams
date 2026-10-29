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
  assert.ok(primitives.includes("className={cn('ams-table-pagination bg-panel px-4 py-3 sm:px-5', showTopDivider ? 'border-t border-line' : '')}"), 'Shared pagination uses an opt-in divider rather than a forced top border.');
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
    '.ams-dashboard-activity-search-field',
    '.ams-dashboard-activity-field__label',
    '.ams-dashboard-activity-search',
    '.ams-dashboard-activity-filter--actor',
    '.ams-dashboard-activity-table',
    '@media (max-width: 759px)'
  ]) assert.ok(styles.includes(selector), 'Missing responsive Recent Activity rule: ' + selector);
});

test('Recent Activity uses a stable responsive filter toolbar and distinct row surfaces', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-recent-activity"');
  const end = dashboard.indexOf('</AdminPanel>', start);
  const activity = dashboard.slice(start, end);

  assert.ok(activity.includes('className="ams-dashboard-activity-tool-actions"'));
  assert.ok(activity.includes('className="ams-dashboard-activity-search-field"'));
  assert.ok(activity.includes('className="sr-only" htmlFor="dashboard-recent-activity-search">Search recent activity</label>'));
  assert.equal(activity.includes('<span>Sort by</span>'), false);
  assert.ok(activity.includes('Search event, actor or severity'));
  assert.ok(dashboard.includes("const searchableText = (action + ' ' + actor + ' ' + severity).toLowerCase();"));
  assert.ok(dashboard.includes('if (query && !searchableText.includes(query)) return false;'));
  assert.ok(activity.includes('Filter activity by severity'));
  assert.ok(activity.includes('Filter activity by actor'));
  assert.ok(activity.includes('Filter activity by time window'));
  assert.ok(activity.includes('Sort recent activity'));
  assert.ok(activity.includes('Export filtered recent activity as CSV'));
  assert.ok(activity.includes('<table className="ams-dashboard-activity-table">'));
  assert.ok(activity.includes('<th scope="col">Actor</th>'));
  assert.ok(activity.includes('<th scope="col">Date &amp; time (UTC)</th>'));
  assert.ok(activity.includes('<th scope="col">Severity</th>'));
  assert.ok(activity.includes('<AdminTablePagination'));

  for (const rule of [
    'grid-template-areas: "search filters actions";',
    '"filters actions"',
    '.ams-dashboard-activity-tool-actions',
    '.ams-dashboard-activity-table tbody tr td {',
    'background: color-mix(in srgb, var(--bg) 24%, var(--panel));',
    'border-spacing: 0 5px;',
    '@container (max-width: 479px)'
  ]) assert.ok(styles.includes(rule), 'Missing Recent Activity layout rule: ' + rule);
});

test('Recent Activity normalizes actor names consistently and keeps timestamps readable in narrow cards', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  assert.ok(dashboard.includes("const normalizeDashboardActivityActor = (value: unknown): string =>"));
  assert.ok(dashboard.includes('normalizeDashboardActivityActor(activity.actor)'));
  assert.ok(dashboard.includes('normalizeDashboardActivityActor(left.actor).localeCompare(normalizeDashboardActivityActor(right.actor))'));
  assert.ok(dashboard.includes('className="ams-dashboard-activity-table__time-full"'));
  assert.ok(dashboard.includes('className="ams-dashboard-activity-table__time-compact"'));
  assert.ok(dashboard.includes('title={timestampLabel}'));
  assert.ok(styles.includes('.ams-dashboard-activity-table__time-compact'));
  assert.ok(styles.includes('.ams-dashboard-activity-table__time-full'));
  assert.equal((styles.match(/\/\* Recent Activity final refinement/g) || []).length, 0,
    'Repeated final override blocks should be consolidated into the single Recent Activity contract.');
  assert.equal((styles.match(/\/\* Recent Activity — single source of truth/g) || []).length, 1);
});

test('Recent Activity keeps Search separate and groups compact, unlabeled dropdown filters together', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-recent-activity"');
  const end = dashboard.indexOf('</AdminPanel>', start);
  assert.ok(start >= 0 && end > start);
  const activity = dashboard.slice(start, end);
  const search = activity.indexOf('className="ams-dashboard-activity-search-field"');
  const filterPanel = activity.indexOf('className="ams-dashboard-activity-filter-panel"');
  const filterGroup = activity.indexOf('className="ams-dashboard-activity-filter-group"');
  const severity = activity.indexOf('className="ams-dashboard-activity-filter ams-dashboard-activity-filter--severity"');
  const actor = activity.indexOf('className="ams-dashboard-activity-filter ams-dashboard-activity-filter--actor"');
  const order = activity.indexOf('className="ams-dashboard-activity-filter ams-dashboard-activity-filter--order"');
  const actions = activity.indexOf('className="ams-dashboard-activity-tool-actions"');
  assert.ok(search >= 0 && filterPanel > search && filterGroup > filterPanel && actions > filterGroup,
    'Search, grouped filters and utility actions must be separate visual regions.');
  assert.ok(severity > filterGroup && actor > severity && order > actor && actions > order,
    'Severity, Actor and Sort by must appear together in one refinement group.');
  assert.ok(activity.includes('aria-label="Recent activity filters and sorting"'));
  assert.ok(activity.includes('aria-label="Severity, actor and sort controls"'));
  assert.ok(activity.includes('className="sr-only" htmlFor="dashboard-recent-activity-search">Search recent activity</label>'));
  assert.equal(activity.includes('<span>Severity</span>'), false);
  assert.equal(activity.includes('<span>Actor</span>'), false);
  assert.equal(activity.includes('<span>Sort by</span>'), false);
  assert.ok(activity.includes('aria-label="Sort recent activity"'));
  for (const selector of [
    '.ams-dashboard-activity-search-field',
    '.ams-dashboard-activity-filter-panel',
    '.ams-dashboard-activity-filter-group',
    '.ams-dashboard-activity-filter--severity',
    '.ams-dashboard-activity-filter--actor',
    '.ams-dashboard-activity-filter--order'
  ]) assert.ok(styles.includes(selector), 'Missing grouped activity filter styling: ' + selector);
  assert.ok(styles.includes('grid-template-areas: "search filters actions";'));
  assert.ok(styles.includes('"filters actions"'));
  assert.ok(styles.includes('"search"'));
  assert.ok(styles.includes('@container (max-width: 479px)'));
});

test('Recent Activity filter toolbar is compact, omits redundant headings, and keeps CSV export in the card header', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-recent-activity"');
  const end = dashboard.indexOf('</AdminPanel>', start);
  assert.ok(start >= 0 && end > start);
  const activity = dashboard.slice(start, end);
  const toolsStart = activity.indexOf('className="ams-dashboard-activity-tools"');
  const tableStart = activity.indexOf('className="ams-dashboard-activity-table"', toolsStart);
  assert.ok(toolsStart >= 0 && tableStart > toolsStart);
  const toolsContent = activity.slice(toolsStart, tableStart);
  const cardHeader = activity.slice(0, toolsStart);

  assert.ok(cardHeader.includes('className="ams-dashboard-card-action ams-dashboard-activity-export"'));
  assert.ok(cardHeader.includes('onClick={exportFilteredDashboardActivity}'));
  assert.ok(cardHeader.includes('Export CSV'));
  assert.ok(cardHeader.includes('ariaLabel="Export filtered recent activity as CSV"'));
  assert.equal(toolsContent.includes('Export CSV'), false);
  assert.equal(toolsContent.includes('ams-dashboard-activity-export'), false);
  assert.doesNotMatch(toolsContent, /<span>(?:Filters &amp; sorting|Refine loaded events|Severity|Actor|Sort by)<\/span>/);
  assert.ok(toolsContent.includes('aria-label="Filter activity by severity"'));
  assert.ok(toolsContent.includes('aria-label="Filter activity by actor"'));
  assert.ok(toolsContent.includes('aria-label="Sort recent activity"'));
  assert.ok(styles.includes('grid-template-columns: minmax(0, .92fr) minmax(0, 1.05fr) minmax(0, 1fr);'));
  assert.ok(styles.includes('gap: 6px;'));
  assert.ok(styles.includes('background: transparent;'));
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

test('Dashboard final layout contract keeps controls aligned and card content predictable', async () => {
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const finalLayer = styles.slice(styles.lastIndexOf('/* Dashboard final layout contract — 27 October 2026. */'));

  assert.ok(finalLayer.includes('overflow-x: clip;'), 'Dashboard tabs must not create a horizontal scroll strip.');
  assert.ok(finalLayer.includes('flex-wrap: wrap;'), 'Header controls must wrap instead of overflowing their row.');
  assert.ok(finalLayer.includes('height: 36px;'));
  assert.ok(finalLayer.includes('height: 28px;'), 'Project service-line choices remain compact inside the 36px shared toolbar.');
  assert.ok(finalLayer.includes('.ams-dashboard-finance-panel'));
  assert.ok(finalLayer.includes('.ams-dashboard-projects-panel'));
  assert.ok(finalLayer.includes('.ams-dashboard-owner-row'));
  assert.ok(finalLayer.includes('.ams-dashboard-activity-table tbody td'));
  assert.ok(finalLayer.includes('border-spacing: 0 5px;'));
  assert.ok(finalLayer.includes('@media (max-width: 759px)'));
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
  assert.ok(projectCard.includes('size="compact" icon={<FolderKanban'), 'Project Registry establishes the shared compact action size.');
  const groupRuleStart = contract.lastIndexOf('.ams-shell .ams-dashboard .ams-project-progress-header-actions .ams-dashboard-project-service-filter,');
  const groupRuleEnd = contract.indexOf('\n}', groupRuleStart) + 2;
  const groupRule = contract.slice(groupRuleStart, groupRuleEnd);
  assert.ok(groupRuleStart >= 0 && groupRuleEnd > groupRuleStart, 'Project service-line filter must use the shared bordered group rule.');
  assert.ok(groupRule.includes('height: var(--dashboard-control-height, 36px);'));
  assert.ok(groupRule.includes('padding: var(--dashboard-filter-shell-padding, 2px);'));
  assert.ok(groupRule.includes('border: 1px solid var(--dashboard-control-border, var(--line));'));
  const itemRuleStart = contract.lastIndexOf('.ams-shell .ams-dashboard .ams-project-progress-header-actions .ams-dashboard-project-service-filter .ams-dashboard-control--filter,');
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
  assert.ok(styles.includes('.ams-dashboard-view-tabs'), 'Dashboard tabs must use the shared wrap/no-scroll layout.');
  assert.doesNotMatch(styles, /\.ams-dashboard-toolbar > \.ams-dashboard-view-tabs::?-webkit-scrollbar/, 'Tabs must not rely on a horizontal scroll strip or scrollbar styling.');
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

test('Dashboard pixel-precision spacing uses equal 12px horizontal and vertical card gutters', async () => {
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const marker = '/* Dashboard pixel-precision spacing contract — 27 October 2026. */';
  const start = styles.lastIndexOf(marker);
  assert.ok(start >= 0, 'Dashboard spacing rules should be defined in the final scoped stylesheet.');
  const finalLayer = styles.slice(start);
  const unifiedMarker = '/* Dashboard unified grid gutter contract — 27 October 2026.';
  const unifiedStart = styles.lastIndexOf(unifiedMarker);
  assert.ok(unifiedStart >= 0, 'The effective grid gutter contract should be present.');
  const spacingLayer = styles.slice(unifiedStart);

  for (const selector of [
    '.ams-overview-card-row,',
    '.ams-overview-panel > div:first-child {',
    '.ams-dashboard-finance-header-actions {',
    '.ams-dashboard-finance-header-actions > .ams-card-period-controls {',
    '.ams-dashboard-finance-header-actions .ams-calendar-period-filter__trigger,',
    '.ams-dashboard-finance-header-actions .ams-dashboard-card-action {',
    '.ams-dashboard-team-time__header-actions,',
    '.ams-dashboard-activity-header-actions {',
    '@media (max-width: 639px)'
  ]) assert.ok(styles.includes(selector), 'Missing Dashboard spacing rule: ' + selector);

  assert.match(finalLayer, /\.ams-dashboard-finance-header-actions \{[^}]*gap: 8px/s);
  assert.match(finalLayer, /\.ams-dashboard-finance-header-actions \{[^}]*justify-content: flex-start/s);
  assert.match(spacingLayer, /\.ams-shell \.ams-page-shell\.ams-dashboard \{[^}]*gap: var\(--ams-dashboard-grid-gap\);/s);
  assert.match(spacingLayer, /\.ams-overview-card-row,[\s\S]*?gap: var\(--ams-dashboard-grid-gap\);[\s\S]*?column-gap: var\(--ams-dashboard-grid-gap\);[\s\S]*?row-gap: var\(--ams-dashboard-grid-gap\);/);
  assert.match(spacingLayer, /\.ams-overview-card-row \+ \.ams-overview-card-row \{[^}]*margin-top: 0;[^}]*margin-block-start: 0;/s);
  assert.match(spacingLayer, /\.ams-dashboard-delivery-row,[\s\S]*?column-gap: var\(--ams-dashboard-grid-gap\);[\s\S]*?row-gap: var\(--ams-dashboard-grid-gap\);/);
  assert.match(finalLayer, /\.ams-shell \.ams-dashboard \.ams-dashboard-finance-header-actions \.ams-calendar-period-filter__trigger,\s*\.ams-shell \.ams-dashboard \.ams-dashboard-finance-header-actions \.ams-dashboard-card-action \{[^}]*height: 36px;[^}]*min-height: 36px/s);
});

test('Dashboard actions, filters and calendars share one hover and geometry contract', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const sharedStyles = await read('src/components/admin/DashboardControls.css');
  const sharedComponent = await read('src/components/admin/DashboardControls.tsx');
  const pageStyles = await read('src/components/admin/GlobalExecutiveDashboard.css');

  const unifiedMarker = '/* Dashboard unified grid gutter contract — 27 October 2026.';
  const finalLayer = pageStyles.slice(pageStyles.lastIndexOf(unifiedMarker));
  assert.match(finalLayer, /\.ams-shell \.ams-page-shell\.ams-dashboard \{[^}]*gap: var\(--ams-dashboard-grid-gap\);/s);
  assert.match(finalLayer, /\.ams-overview-card-row,[\s\S]*?column-gap: var\(--ams-dashboard-grid-gap\);[\s\S]*?row-gap: var\(--ams-dashboard-grid-gap\)/s);
  assert.match(finalLayer, /\.ams-overview-card-row \+ \.ams-overview-card-row \{[^}]*margin-top: 0;[^}]*margin-block-start: 0;/s);
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
  assert.ok(dashboard.includes("value: 'severity', label: 'Highest severity'"));
  assert.ok(dashboard.includes("value: 'actor', label: 'Actor A–Z'"));
});

test('Dashboard card actions, Recorded time controls, calendar navigation and Activity filter widths stay aligned', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');

  assert.ok(dashboard.includes("filter((year) => /^\\d{4}$/.test(year))"), 'Calendar year navigation should match four-digit years.');
  assert.equal(dashboard.includes('dashboardActivityActorFilterWidth'), false, 'Actor filter width should follow the available grid track, not the longest actor label.');
  assert.equal(dashboard.includes('longestLabel * 6.8 + 44'), false);
  assert.equal(dashboard.includes("style={{ '--activity-actor-filter-width': dashboardActivityActorFilterWidth } as React.CSSProperties}"), false);
  assert.ok(dashboard.includes("const searchableText = (action + ' ' + actor + ' ' + severity).toLowerCase();"));
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
  assert.ok(activity.includes('className="ams-dashboard-activity-filter ams-dashboard-activity-filter--actor"'));
  assert.ok(!activity.includes('dashboardActivityActorFilterWidth'));
  assert.ok(activity.includes('className="ams-dashboard-activity-tool-actions"'));

  for (const selector of [
    '.ams-overview-panel .ams-dashboard-card-header-actions .ams-dashboard-card-action',
    '.ams-project-progress-header-actions .ams-project-registry-action',
    '.ams-dashboard-team-time__header-actions',
    '.ams-dashboard-finance-panel .ams-dashboard-finance-trend-region',
    '.ams-dashboard-finance-panel .ams-finance-movement-card',
    '.ams-dashboard-activity-tools'
  ]) assert.ok(styles.includes(selector), 'Missing focused Dashboard style: ' + selector);
  const finalLayer = styles.slice(styles.lastIndexOf('/* Dashboard final layout contract — 27 October 2026. */'));
  assert.ok(finalLayer.includes('grid-template-columns: minmax(220px, 1.4fr) minmax(116px, .72fr) minmax(150px, 1fr) minmax(122px, .75fr) auto auto;'));
  assert.ok(finalLayer.includes('@media (max-width: 1199px)'));
  assert.ok(finalLayer.includes('grid-template-columns: minmax(0, 1.25fr) minmax(120px, .8fr) minmax(145px, 1fr);'));
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

  assert.ok(dashboard.includes("ariaCurrent={view === tab.key ? 'page' : undefined}"));
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
  assert.ok(dashboard.includes('ariaLabel="Filter activity by time window"'));
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

test('Projects in progress and Needs attention stay aligned in the delivery row', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = dashboard.indexOf('aria-label="Project delivery and exceptions"');
  const projectStart = dashboard.indexOf('data-ams-feature-slug="dashboard-project-progress"', start);
  const attentionStart = dashboard.indexOf('data-ams-feature-slug="dashboard-attention-center"', projectStart);
  const nextRow = dashboard.indexOf('aria-label="Task queue and delivery deadlines"', attentionStart);
  assert.ok(start >= 0 && projectStart > start && attentionStart > projectStart && nextRow > attentionStart);
  const row = dashboard.slice(start, nextRow);
  const project = row.slice(0, row.indexOf('data-ams-feature-slug="dashboard-attention-center"'));
  const attention = row.slice(row.indexOf('data-ams-feature-slug="dashboard-attention-center"'));
  assert.ok(project.includes('min-[1100px]:col-span-7'), 'Projects in progress must occupy the same wide 7-column span as Task Queue.');
  assert.equal(project.includes('min-[1280px]:col-span-5'), false, 'The project delivery width must not shrink at wider desktop breakpoints.');
  assert.ok(project.includes('ams-dashboard-project-progress-panel'));
  assert.ok(row.includes("canOpenProjects ? 'min-[1100px]:col-span-5'"), 'Needs attention is the narrower 5-column companion.');
  const taskQueueStart = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const taskQueueSection = dashboard.lastIndexOf('<section', taskQueueStart);
  const deadlinesStart = dashboard.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"', taskQueueStart);
  const taskQueue = dashboard.slice(taskQueueSection, deadlinesStart);
  assert.ok(taskQueue.includes('min-[1100px]:col-span-7'), 'Task Queue establishes the intended wide-card width.');
  assert.ok(dashboard.includes('min-[1100px]:col-span-5'), 'Deadline and attention companion cards use the narrow 5-column span.');
  assert.ok(project.includes('h-full flex flex-col ams-overview-panel'));
  assert.ok(attention.includes('h-full flex flex-col ams-overview-panel'));
  assert.ok(attention.includes('title="No active exceptions"'));
  assert.ok(styles.includes('.ams-dashboard-delivery-row {\n  align-items: stretch;'));
  assert.ok(styles.includes('.ams-dashboard-project-progress-panel,\n.ams-shell .ams-dashboard .ams-dashboard-attention-panel {\n  display: flex;'));
  assert.ok(styles.includes('height: 100%;'));
  assert.ok(styles.includes('flex: 1 1 auto;'));
  assert.ok(styles.includes('grid-column: span 5 / span 5;'));
  assert.ok(styles.includes('grid-column: span 7 / span 7;'));
  assert.ok(styles.includes('Keep the delivery row identical to Task Queue: wide primary workspace (7/12),'));
});

test('Dashboard Team Workload aligns owner assignment signals and recorded-time rows', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-team-workload"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"', start);
  assert.ok(start >= 0 && end > start);
  const team = dashboard.slice(start, end);

  assert.ok(team.includes('ams-dashboard-team-tasks__header'));
  assert.ok(team.includes('Ranked by overdue, blocked and open task count'));
  assert.ok(team.includes('ams-dashboard-owner-list'));
  assert.ok(team.includes('ams-dashboard-owner-row__track'));
  assert.ok(team.includes('owner.overdue > 0 ?'));
  assert.ok(team.includes('owner.blocked > 0 ?'));
  assert.ok(team.includes('owner.review > 0 ?'));
  assert.ok(team.includes('No overdue / blocked'));
  assert.ok(team.includes('ams-dashboard-recorded-time-list'));
  assert.ok(team.includes('person.entries'));
  assert.ok(team.includes('Recorded time reporting period'));
  assert.ok(team.includes('aria-label={\'Recorded time for \' + person.name'));

  for (const selector of [
    '.ams-dashboard-team-panel > .ams-dashboard-team-body',
    '.ams-dashboard-owner-row__count',
    '.ams-dashboard-owner-row__signals > .is-warning',
    '.ams-dashboard-recorded-time-row__heading',
    '.ams-dashboard-recorded-time-row__entries',
    '@media (max-width: 599px)'
  ]) assert.ok(styles.includes(selector), 'Missing Team Workload layout rule: ' + selector);
});

test('Dashboard Team Workload gives Recorded time inset padding without a divider', async () => {
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const teamBlockStart = styles.lastIndexOf('/* Team Workload: simple comparison lists, consistent section rhythm, and a compact per-card time filter. */');
  const teamBlockEnd = styles.indexOf('@media (max-width: 599px)', teamBlockStart);
  assert.ok(teamBlockStart >= 0 && teamBlockEnd > teamBlockStart, 'The final Team Workload CSS contract should be bounded.');
  const teamStyles = styles.slice(teamBlockStart, teamBlockEnd);

  const tasksSelector = '.ams-shell .ams-dashboard .ams-dashboard-team-panel > .ams-dashboard-team-body > .ams-dashboard-team-tasks {';
  const timeSelector = '.ams-shell .ams-dashboard .ams-dashboard-team-panel .ams-dashboard-team-body > .ams-dashboard-team-time {';
  const tasksStart = teamStyles.indexOf(tasksSelector);
  const timeStart = teamStyles.indexOf(timeSelector);
  assert.ok(tasksStart >= 0 && timeStart > tasksStart, 'The final Team Workload rules must define the two-section layout.');
  const tasksRule = teamStyles.slice(tasksStart, teamStyles.indexOf('}', tasksStart));
  const timeRule = teamStyles.slice(timeStart, teamStyles.indexOf('}', timeStart));
  assert.match(tasksRule, /border-bottom:\s*0;/);
  assert.doesNotMatch(tasksRule, /border-bottom:.*1px solid/);
  assert.match(timeRule, /border-top:\s*0;/);
  assert.match(tasksRule, /padding:.*0 0 16px;/);
  assert.match(timeRule, /padding:\s*16px 14px 14px;/);
  assert.ok(styles.includes('background: color-mix(in srgb, var(--text) 2.5%, var(--panel));'),
    'Recorded time keeps its subtle grey surface with content inset from the edges.');

  const finalRowsStart = teamStyles.indexOf('.ams-shell .ams-dashboard .ams-dashboard-owner-row,\n.ams-shell .ams-dashboard .ams-dashboard-recorded-time-row {');
  assert.ok(finalRowsStart > tasksStart, 'Owner and recorded-time rows should share the final clean-list layout.');
  const rowRule = teamStyles.slice(finalRowsStart, teamStyles.indexOf('}', finalRowsStart));
  assert.match(rowRule, /border:\s*0;/);
  assert.match(rowRule, /border-radius:\s*0;/);
  assert.match(rowRule, /background:\s*transparent;/);
  assert.ok(teamStyles.includes('.ams-dashboard-team-time__header-actions .ams-calendar-period-filter__trigger'));
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
  assert.equal(analytics.includes('All dates defaults to the recent 30 days.'), false,
    'Analytics no longer duplicates the shared reporting-period scope in a nested selector card.');
  assert.ok(analytics.includes('const inquiryVolumeTrend = buildInquiryVolumeTrend('),
    'Inquiry volume retains its own source-backed period scope.');
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

test('Dashboard final layout keeps date controls local, cards aligned and tab navigation non-scrolling', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const end = dashboard.indexOf(") : view === 'performance' ? (", start);
  assert.ok(start >= 0 && end > start);
  const overview = dashboard.slice(start, end);
  const toolbarStart = dashboard.indexOf('<section className="ams-dashboard-toolbar');
  const toolbarEnd = dashboard.indexOf('</section>', toolbarStart);
  const toolbar = dashboard.slice(toolbarStart, toolbarEnd);

  assert.ok(toolbar.includes('ams-dashboard-view-tabs'));
  assert.doesNotMatch(toolbar, /DashboardCalendarPeriodFilter|Reporting date range|ams-card-period-controls/,
    'The global tabs strip must not contain a global date filter.');
  assert.ok(overview.includes('data-ams-feature-slug="dashboard-finance-period-controls"'));
  assert.ok(overview.includes('data-ams-feature-slug="dashboard-time-period-controls"'));
  assert.ok(overview.includes('data-ams-feature-slug="dashboard-recent-activity"'));
  assert.ok(overview.includes('data-ams-feature-slug="dashboard-recent-activity"'));
  assert.ok(overview.includes('ams-dashboard-activity-table'));
  assert.ok(overview.includes('Export CSV'));
  assert.ok(overview.includes('Reset filters'));
  assert.ok(overview.includes('Filter activity by severity'));
  assert.ok(overview.includes('Filter activity by actor'));
  assert.ok(overview.includes('Sort recent activity'));

  for (const selector of [
    '.ams-dashboard-page-header.ams-page-header',
    'overflow-x: clip',
    '.ams-dashboard-project-service-filter .ams-dashboard-control--filter',
    '.ams-dashboard-projects-body',
    '.ams-dashboard-team-body',
    '.ams-dashboard-activity-tools',
    '.ams-dashboard-activity-table'
  ]) assert.ok(styles.includes(selector), 'Missing final Dashboard layout rule: ' + selector);

  assert.match(styles, /\.ams-overview-card-row\[aria-label="Finance and project overview"\][\s\S]*?align-items:\s*stretch;/);
  assert.ok(dashboard.includes('DashboardCalendarPeriodFilter caption="Period" ariaLabel="Finance reporting period"'));
  assert.ok(dashboard.includes('DashboardCalendarPeriodFilter caption="Period" ariaLabel="Recorded time reporting period"'));
  assert.equal(toolbar.includes('overflow-x-auto'), false, 'Dashboard view tabs must never use horizontal scrolling.');
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

test('Dashboard Performance follows Overview panel composition and preserves source-backed delivery metrics', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('const PerformanceView: React.FC');
  const end = dashboard.indexOf('const AnalyticsView: React.FC', start);
  assert.ok(start >= 0 && end > start, 'Performance workspace should have a bounded source section');
  const performance = dashboard.slice(start, end);
  const summary = performance.indexOf('data-ams-feature-slug="dashboard-performance-summary"');
  const distribution = performance.indexOf('data-ams-feature-slug="dashboard-performance-status-distribution"');
  const projectQueue = performance.indexOf('data-ams-feature-slug="dashboard-performance-project-queue"');
  const recordedTime = performance.indexOf('data-ams-feature-slug="dashboard-performance-recorded-time"');

  assert.ok(summary >= 0 && distribution > summary && projectQueue > distribution && recordedTime > projectQueue,
    'Performance should follow Overview’s 12-column card rhythm: summary, task distribution, risk queue, then recorded-time analysis.');
  assert.ok(performance.includes('className="h-full ams-overview-panel ams-dashboard-performance-summary"'));
  assert.ok(performance.includes('className="h-full ams-overview-panel ams-dashboard-performance-status-panel"'));
  assert.ok(performance.includes('className="h-full ams-overview-panel ams-dashboard-performance-project-panel"'));
  assert.ok(performance.includes('className="h-full ams-overview-panel ams-dashboard-performance-time-panel"'));
  assert.equal(performance.includes('data-ams-feature-slug="dashboard-performance-scope"'), false, 'Reporting scope should not occupy a duplicate standalone card.');
  assert.equal(performance.includes('<AdminMetricStrip'), false, 'Do not recreate the generic KPI strip removed from Overview.');
  assert.ok(performance.includes('<DashboardControl'), 'Actions must use the shared Dashboard control.');
  assert.ok(performance.includes('<TrendChart'), 'Recorded time must retain a source-backed trend visualization.');
  assert.ok(performance.includes('presentation="maven"'), 'Recorded time charts must use the same Overview presentation.');
  assert.ok(performance.includes('View exact period values'));
  assert.ok(performance.includes('Top eight contributors by recorded time. Bars compare within this list only.'));
  assert.ok(performance.includes('const maxMemberTimeMinutes = Math.max(1, ...workload.map((member) => member.minutes))'));
  assert.ok(performance.includes('const totalTrackedMinutes = scopedTimeLogs.reduce'));
  assert.ok(performance.includes('const timeTrendModel = useMemo(() =>'));
  assert.match(performance, /matchesInterval\(dueDate, dueDate, task\.createdAt\)/);
  assert.match(performance, /matchesInterval\([\s\S]*project\.startDate \|\| project\.start[\s\S]*project\.createdAt[\s\S]*\)/);
  assert.match(performance, /matchesDate\(log\.date \|\| log\.createdAt\)/);
  assert.match(performance, /Current status mix across the filtered task set/);
  assert.match(performance, /No task records match the selected reporting scope/);
  assert.match(performance, /status\.count \/ tasks\.length \* 100/);
  assert.ok(performance.includes('Active projects'));
  assert.ok(performance.includes('Total hours'));
  assert.ok(performance.includes('Entries'));
});

test('Dashboard Performance header and reporting period follow the shared Overview shell', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const headerStart = dashboard.indexOf('<AdminModuleHeader slug="dashboard-header"');
  const headerEnd = dashboard.indexOf('<section className="ams-dashboard-toolbar', headerStart);
  assert.ok(headerStart >= 0 && headerEnd > headerStart);
  const header = dashboard.slice(headerStart, headerEnd);
  assert.ok(header.includes('title="Dashboard"'));
  assert.ok(header.includes('description="Delivery priorities, client commitments and agency operations."'));
  assert.ok(header.includes('data-ams-feature-slug="dashboard-workspace-shortcuts"'));
  assert.equal(header.includes("view === 'overview' ?"), false, 'Quick shortcuts and header layout must not change between Dashboard tabs.');
  assert.ok(dashboard.includes('reportPeriodMode={reportPeriodMode}'));
  assert.ok(dashboard.includes('canOpenTasks={canOpenTasks}'));
  assert.ok(dashboard.includes('canOpenProjects={canOpenProjects}'));
});

test('Dashboard Analytics uses an Overview-inspired report grid without nested report tabs', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = dashboard.indexOf('const AnalyticsView: React.FC');
  const end = dashboard.indexOf('type DashboardCalendarPeriodFilterProps', start);
  assert.ok(start >= 0 && end > start, 'Analytics workspace should have a bounded source section.');
  const analytics = dashboard.slice(start, end);

  const grid = analytics.indexOf('className="ams-dashboard-analytics-report-grid"');
  const financial = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-financial-report"');
  const receivables = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-receivables-report"');
  const projects = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-project-status-report"');
  const inquiry = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-inquiry-pipeline-report"');
  assert.ok(grid >= 0 && financial > grid && receivables > financial && projects > receivables && inquiry > projects,
    'Analytics should show all supported reports in an Overview-like card order.');
  assert.equal(analytics.includes('data-ams-feature-slug="dashboard-analytics-controls"'), false,
    'The nested report-selector panel must be removed.');
  assert.equal(dashboard.includes('type DashboardAnalyticsReport'), false);
  assert.equal(dashboard.includes('DASHBOARD_ANALYTICS_REPORT_OPTIONS'), false);
  assert.equal(analytics.includes('setReport('), false);
  for (const className of [
    'ams-dashboard-analytics-card--financial',
    'ams-dashboard-analytics-card--receivables',
    'ams-dashboard-analytics-card--projects',
    'ams-dashboard-analytics-card--inquiry'
  ]) assert.ok(analytics.includes(className), 'Missing Analytics card layout class: ' + className);
  assert.ok(analytics.includes('buildFinancialTrendForReportingPeriod(reportPeriodMode, reportPeriodValue'));
  assert.ok(analytics.includes('aria-label="Exact invoice and expense values by period"'));
  assert.ok(analytics.includes('not posted profit'));
  assert.ok(analytics.includes('Financial trend unavailable'));
  assert.ok(analytics.includes('A zero-value trend is not inferred from an empty source'));
  assert.ok(analytics.includes('Projects by current status'));
  assert.ok(analytics.includes('role="img" aria-label={group.status +'));
  assert.ok(analytics.includes('Current labels'), 'Project status remains a current-state grouping.');
  assert.doesNotMatch(analytics, /dashboard-analytics-kpis/, 'Do not introduce mixed-period duplicate KPI summaries.');
  assert.equal(analytics.includes('DashboardTrendRangePicker'), false, 'Analytics continues to use the shared period control.');
  assert.match(styles, /\.ams-dashboard-analytics-report-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\);[\s\S]*?gap:\s*var\(--ams-dashboard-gap,\s*12px\);/);
  assert.match(styles, /\.ams-dashboard-analytics-card--receivables\s*\{\s*grid-column:\s*span 5;/);
  assert.match(styles, /\.ams-dashboard-analytics-card--projects\s*\{\s*grid-column:\s*span 7;/);
  assert.match(styles, /@media\s*\(max-width:\s*899px\)[\s\S]*?\.ams-dashboard-analytics-card\s*\{\s*grid-column:\s*1\s*\/\s*-1;/);
});


test('Dashboard Analytics outer spacing follows the shared 12px Dashboard card gutter', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = dashboard.indexOf('const AnalyticsView: React.FC');
  const end = dashboard.indexOf('type DashboardCalendarPeriodFilterProps', start);
  assert.ok(start >= 0 && end > start, 'Analytics workspace should have a bounded source section.');
  const analytics = dashboard.slice(start, end);

  assert.ok(analytics.includes('<div className="ams-dashboard-analytics-workspace" data-ams-feature-slug="dashboard-analytics-workspace">'));
  assert.equal(analytics.includes('<div className="space-y-4" data-ams-feature-slug="dashboard-analytics-workspace">'), false,
    'Analytics outer spacing must be controlled by its workspace layout, not the generic margin utility.');

  const marker = '/* Analytics workspace rhythm: use the shared Dashboard card gutter. */';
  const spacing = styles.slice(styles.lastIndexOf(marker));
  assert.ok(spacing.length > 0);
  assert.match(spacing, /\.ams-dashboard-analytics-workspace\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;[\s\S]*?gap:\s*var\(--ams-dashboard-gap,\s*12px\);/);
  assert.match(styles, /\.ams-shell \.ams-dashboard\s*\{[\s\S]*?--ams-dashboard-gap:\s*12px;/,
    'Analytics must reuse the Dashboard spacing token instead of defining a competing value.');
});


test('Dashboard Analytics exposes the canonical inquiry pipeline only when Inbox access is allowed', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const charts = await read('src/components/charts/DashboardCharts.tsx');
  const start = dashboard.indexOf('const AnalyticsView:');
  const end = dashboard.indexOf('export const GlobalExecutiveDashboard', start);
  assert.ok(start >= 0 && end > start, 'Analytics workspace should be bounded.');
  const analytics = dashboard.slice(start, end);
  const projectStart = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-project-status-report"');
  const inquiryStart = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-inquiry-pipeline-report"');
  assert.ok(projectStart >= 0 && inquiryStart > projectStart, 'Project status should precede the full-width inquiry report.');
  const inquiry = analytics.slice(inquiryStart);

  assert.ok(analytics.includes(`      {canOpenInbox ? (\n        <section className="ams-dashboard-analytics-card ams-dashboard-analytics-card--inquiry"`),
    'The inquiry report must render only when the existing Inbox access gate allows it.');
  assert.equal(analytics.includes('setReport('), false, 'The nested report-selector state must be removed.');
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
  const finalLayer = styles.slice(styles.lastIndexOf('/* Dashboard final layout contract — 27 October 2026. */'));
  assert.ok(finalLayer.includes('.ams-dashboard-page-header .ams-dashboard-header-actions .ams-dashboard-control'));
  assert.ok(finalLayer.includes('height: 36px;') && finalLayer.includes('min-height: 36px;'));
  assert.ok(finalLayer.includes('.ams-dashboard-toolbar[aria-label="Dashboard view and reporting controls"] > .ams-dashboard-view-tabs'));
  assert.ok(finalLayer.includes('overflow-x: clip;'), 'Dashboard tabs use clipping/wrapping instead of a horizontal scroll strip.');
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
  assert.ok(toolbar.includes('active={view === tab.key}'));
  assert.ok(toolbar.includes("view === tab.key ? 'border-accent bg-transparent text-fg'"));
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
  assert.equal(styles.includes('.ams-dashboard-period-controls'), false);
  assert.ok(styles.includes('.ams-calendar-period-filter__trigger'));
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


test('Dashboard date controls stay local to Finance, Recorded Time, Deadlines and Activity', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.equal(overview.includes('aria-label="Reporting date range"'), false);
  assert.equal(dashboard.includes('aria-label="Reporting date range"'), false);
  for (const label of [
    'Finance reporting period',
    'Recorded time reporting period',
    'Filter activity by time window',
    'Filter deadlines by custom date range'
  ]) assert.ok(overview.includes('ariaLabel="' + label + '"') || overview.includes('aria-label="' + label + '"'), 'Missing card-local date control: ' + label);
  assert.ok(overview.includes('aria-label="Deadline start date"'));
  assert.ok(overview.includes('aria-label="Deadline end date"'));
  assert.ok(overview.includes('aria-label="Recent activity start date"'));
  assert.ok(overview.includes('aria-label="Recent activity end date"'));
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
  assert.match(styles, /overflow-y:\s*auto;/);
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
  assert.equal(styles.includes('.ams-dashboard-state--empty .ams-dashboard-state__icon'), false);
  assert.ok(styles.includes('@media (max-width: 599px)'));
});


test('Dashboard lead row aligns Projects to Finance and avoids conflicting card heights', async () => {
  const styles = (await read('src/components/admin/GlobalExecutiveDashboard.css')) + '\n' + await read('src/components/admin/DashboardControls.css');
  const finalLayer = styles.slice(styles.lastIndexOf('/* Dashboard final layout contract — 27 October 2026. */'));
  assert.ok(finalLayer.includes('.ams-overview-card-row[aria-label="Finance and project overview"]'));
  assert.ok(finalLayer.includes('align-items: stretch;'));
  assert.match(finalLayer, /section\[data-ams-feature-slug="dashboard-finance-overview"\],[\s\S]*section\[data-ams-feature-slug="dashboard-project-portfolio"\]\s*\{\s*display: flex;/);
  assert.match(finalLayer, /\.ams-dashboard-finance-panel,[\s\S]*\.ams-dashboard-projects-panel\s*\{[\s\S]*height: 100%;/);
  assert.match(finalLayer, /\.ams-dashboard-projects-body > \.ams-project-portfolio-body\s*\{[\s\S]*flex: 1 1 auto;/);
});


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
  assert.ok(styles.includes('.ams-dashboard-filter-group--segmented'));
  assert.ok(styles.includes('.ams-dashboard-select-trigger[aria-expanded="true"]'));
  assert.ok(styles.includes('.ams-dropdown-item[data-active="true"]:not([data-selected="true"])'));
  assert.ok(styles.includes('.ams-dashboard-control--filter[aria-pressed="true"]'));
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


test('Dashboard Overview action and filter controls use the shared symmetric-padding component', async () => {
  const shared = await read('src/components/admin/DashboardControls.tsx');
  const controlsCss = await read('src/components/admin/DashboardControls.css');
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const end = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, end);

  assert.ok(shared.includes('const DASHBOARD_CONTROL_PADDING_BY_SIZE: Record<DashboardControlSize, string> = {'));
  assert.ok(shared.includes("compact: '4px'"));
  assert.ok(shared.includes("standard: '6px'"));
  assert.ok(shared.includes("roomy: '5px'"));
  assert.ok(shared.includes('const controlPaddingStyle: React.CSSProperties = { padding: DASHBOARD_CONTROL_PADDING_BY_SIZE[size] };'));
  assert.equal((shared.match(/style={controlPaddingStyle}/g) || []).length, 2,
    'The same symmetric padding style must apply to both Link actions and native buttons.');
  assert.ok(shared.includes('export const DashboardFilterGroup'));
  assert.ok(shared.includes('<DashboardControl key={o.value}'), 'Every segmented filter option is rendered through DashboardControl.');

  assert.ok(dashboard.includes('<DashboardControl\n              key={tab.key}'), 'Dashboard view tabs must use the shared control.');
  assert.ok(overview.includes('<DashboardControl'));
  assert.ok(overview.includes('<DashboardFilterGroup'));
  assert.doesNotMatch(overview, /<button\b/, 'Overview action/filter buttons must not bypass the shared component.');
  assert.ok(controlsCss.includes('--dashboard-control-padding-standard-x: 12px;'),
    'Legacy CSS may define fallback geometry, but rendered button padding is owned by the shared component.');
});

test('Dashboard cards use whitespace and soft row surfaces instead of legacy divider styling', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');
  const controls = await read('src/components/admin/DashboardControls.css');
  const start = dashboard.indexOf("\n      {view === 'overview' ? (");
  const end = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, end);
  assert.ok(overview.includes('<AdminPanel headerDivider={false}'));
  for (const c of ['ams-dashboard-project-delivery-list','ams-dashboard-attention-list__rows','ams-dashboard-inbox-list','ams-dashboard-task-queue-list','ams-dashboard-deadline-list','ams-finance-quotation-rows','ams-dashboard-client-delivery-list']) assert.ok(overview.includes(c), 'Missing list wrapper: ' + c);
  assert.doesNotMatch(overview, /divide-y divide-line|border-(?:t|b|l|r) border-line/);
  assert.ok(primitives.includes('headerDivider?: boolean;'));
  assert.ok(primitives.includes('showTopDivider?: boolean;'));
  for (const obsolete of ['ams-overview-scope','ams-overview-panel--shortcuts','ams-overview-panel--money','ams-overview-panel--client-delivery','ams-dashboard-period-controls','ams-dashboard-date-select','ams-dashboard-activity-row__meta','ams-dashboard-activity-pagination','ams-dashboard-filter-pills','ams-dashboard-filter-pill','ams-dashboard-state--empty']) assert.equal(styles.includes('.' + obsolete), false, 'Legacy CSS selector remains: ' + obsolete);
  assert.doesNotMatch(styles, /\.ams-dashboard-view-tabs[^}]*overflow-x:\\s*(?:auto|scroll)/);
  assert.doesNotMatch(styles, /\.ams-dashboard-view-tabs::?-webkit-scrollbar/);
  assert.ok(styles.includes('border-spacing: 0 4px;'));
  assert.ok(styles.includes('.ams-dashboard-activity-table tbody td:first-child'));
  assert.ok(controls.includes('.ams-dashboard-control--filter[aria-pressed="true"]'));
  assert.ok(dashboard.includes('showTopDivider={false}'));
});

test('Dashboard cards remove interior divider lines without removing card/control outlines', async () => {
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const marker = '/* Dashboard card divider-free contract — 28 October 2026.';
  const finalLayer = styles.slice(styles.lastIndexOf(marker));
  assert.ok(finalLayer.includes('section.rounded-card.bg-panel > div:first-child'));
  assert.ok(finalLayer.includes('[class~="border-t"]'));
  assert.ok(finalLayer.includes('[class~="border-b"]'));
  assert.ok(finalLayer.includes('[class~="border-y"]'));
  assert.ok(finalLayer.includes('.divide-y > :not([hidden]) ~ :not([hidden])'));
  for (const selector of [
    '.ams-dashboard-attention-panel .ams-dashboard-inbox-triage',
    '.ams-dashboard-finance-panel .ams-finance-trend-region',
    '.ams-dashboard-finance-panel .ams-quotation-follow-up',
    '.ams-dashboard-projects-panel .ams-project-workload',
    '.ams-dashboard-team-panel .ams-dashboard-owner-row',
    '.ams-dashboard-activity-table thead th',
    '.ams-dashboard-activity-table tbody td'
  ]) assert.ok(finalLayer.includes(selector), 'Missing divider cleanup for: ' + selector);
  assert.ok(finalLayer.includes('border-collapse: separate;'));
  assert.ok(finalLayer.includes('border-spacing: 0 4px;'));
  assert.ok(finalLayer.includes('retain each card outline'));
});

test('Dashboard Overview uses one spacing token for all horizontal and vertical card gutters', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const marker = '/* Dashboard unified grid gutter contract — 27 October 2026.';
  const finalLayer = styles.slice(styles.lastIndexOf(marker));
  assert.ok(finalLayer.includes('--ams-dashboard-grid-gap: 12px;'));
  assert.match(finalLayer, /\.ams-overview-card-row,[\s\S]*?gap: var\(--ams-dashboard-grid-gap\);[\s\S]*?column-gap: var\(--ams-dashboard-grid-gap\);[\s\S]*?row-gap: var\(--ams-dashboard-grid-gap\);/);
  assert.match(finalLayer, /\.ams-shell \.ams-page-shell\.ams-dashboard\s*\{[^}]*gap: var\(--ams-dashboard-grid-gap\);/s);
  assert.match(finalLayer, /\.ams-overview-card-row \+ \.ams-overview-card-row\s*\{\s*margin-top: 0;\s*margin-block-start: 0;/);
  for (const row of [
    'Project delivery and exceptions',
    'Task queue and delivery deadlines',
    'Finance and project overview',
    'Team and client delivery',
    'Recent activity'
  ]) {
    assert.ok(dashboard.includes('aria-label="' + row + '"'), 'Missing Overview grid row: ' + row);
  }
  assert.ok(finalLayer.includes('.ams-overview-card-row > section'));
});


test('Dashboard final responsive contract aligns header, Projects, local date filters and Recent Activity', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = styles.lastIndexOf('/* Dashboard final responsive composition contract — 28 October 2026. */');
  const finalLayer = styles.slice(start);
  assert.ok(start >= 0, 'A final scoped responsive contract should resolve the previous cascade.');
  assert.ok(dashboard.includes('Delivery priorities, client commitments and agency operations.'));
  assert.ok(finalLayer.includes('grid-template-columns: minmax(0, 1fr) minmax(0, max-content);'));
  assert.ok(finalLayer.includes('height: 36px;'));
  assert.ok(finalLayer.includes('overflow-x: visible;'));
  assert.ok(finalLayer.includes('.ams-dashboard-projects-panel'));
  assert.ok(finalLayer.includes('height: 100%;'));
  assert.ok(finalLayer.includes('height: 32px;'));
  assert.ok(finalLayer.includes('height: 26px;'));
  assert.ok(finalLayer.includes('.ams-dashboard-activity-tools'));
  assert.ok(finalLayer.includes('.ams-dashboard-activity-table'));
  assert.ok(finalLayer.includes('@media (max-width: 1359px)'));
  assert.ok(finalLayer.includes('@media (max-width: 599px)'));

  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.equal(overview.includes('aria-label="Reporting date range"'), false);
  for (const label of [
    'Finance reporting period',
    'Recorded time reporting period',
    'Filter activity by time window',
    'Filter deadlines by custom date range'
  ]) assert.ok(overview.includes('ariaLabel="' + label + '"') || overview.includes('aria-label="' + label + '"'));
  for (const feature of [
    'dashboard-attention-center',
    'dashboard-finance-overview',
    'dashboard-project-portfolio',
    'dashboard-team-workload',
    'dashboard-recent-activity'
  ]) assert.ok(overview.includes('data-ams-feature-slug="' + feature + '"'));
  assert.ok(overview.includes('Export filtered recent activity as CSV'));
  assert.ok(overview.includes('pageSizeAriaLabel="Recent activity rows per page"'));
});


 
test('Dashboard card actions use the same compact visual contract as Project registry', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const controls = await read('src/components/admin/DashboardControls.css');
  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const tasksStart = overview.indexOf('data-ams-feature-slug="dashboard-task-load-by-owner"');
  const recordedTimeStart = overview.indexOf('data-ams-feature-slug="dashboard-recorded-time-by-person"', tasksStart);
  const taskOwnerHeader = overview.slice(tasksStart, recordedTimeStart);

  assert.ok(overviewStart >= 0 && overviewEnd > overviewStart);
  assert.ok(overview.includes('className="ams-project-registry-action ams-dashboard-card-action"'));
  for (const action of [
    'size="compact" icon={<CalendarDays size={14}/>} className="ams-dashboard-card-action">Open planning</DashboardControl>',
    'size="compact" icon={<FolderKanban size={14}/>} className="ams-dashboard-card-action">Open Projects</DashboardControl>',
    'size="compact" icon={<FolderKanban size={14}/>} className="ams-dashboard-card-action">Open project delivery</DashboardControl>'
  ]) assert.ok(overview.includes(action), 'Card action should match the Project registry contract: ' + action);
  assert.ok(taskOwnerHeader.includes('<DashboardControl to="/admin/tasks" variant="action" size="compact" icon={<CheckCircle2 size={14}/>} className="ams-dashboard-card-action" ariaLabel="Open Tasks" title="Open the Tasks workspace">View tasks</DashboardControl>'));
  assert.equal(taskOwnerHeader.includes('<Link to="/admin/tasks"'), false);

  const marker = controls.lastIndexOf('/* Dashboard card-action baseline: Project registry is the visual reference. */');
  const contract = controls.slice(marker);
  assert.ok(marker >= 0, 'Shared card-action sizing must live in the Dashboard control system.');
  assert.ok(contract.includes('height: 32px;'));
  assert.ok(contract.includes('min-height: 32px;'));
  assert.ok(contract.includes('padding: 0 10px;'));
  assert.ok(contract.includes('border-radius: 8px;'));
  assert.ok(contract.includes('font-size: 10px;'));
  assert.ok(contract.includes('background: var(--dashboard-control-surface, var(--panel));'));
  assert.ok(contract.includes('color: var(--muted);'));
});


test('Dashboard final UI layer keeps responsive card and control geometry coherent', async () => {
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const marker = '/* Dashboard final responsive composition contract — 28 October 2026.';
  const finalLayer = styles.slice(styles.lastIndexOf(marker));

  assert.ok(finalLayer.includes('--ams-dashboard-control-height: 36px;'));
  assert.ok(finalLayer.includes('--ams-dashboard-card-control-height: 32px;'));
  assert.ok(finalLayer.includes('--ams-dashboard-filter-height: 26px;'));
  assert.ok(finalLayer.includes('overflow-x: visible;'), 'Tabs should wrap and must not create a scroll strip.');
  assert.match(finalLayer, /\.ams-dashboard-view-tab\[aria-current="page"\]\s*\{[^}]*background: var\(--accent\);/s);
  assert.doesNotMatch(finalLayer, /\.ams-dashboard-view-tab\[aria-current="page"\]\s*\{[^}]*border-bottom:\s*2px/s);
  assert.ok(finalLayer.includes('.ams-dashboard-header-primary-actions'));
  assert.ok(finalLayer.includes('.ams-dashboard-header-utility-actions'));
  assert.ok(finalLayer.includes('.ams-dashboard-project-service-filter'));
  assert.ok(finalLayer.includes('height: 26px;'));
  assert.ok(finalLayer.includes('.ams-dashboard-finance-panel'));
  assert.ok(finalLayer.includes('.ams-dashboard-projects-panel'));
  assert.ok(finalLayer.includes('grid-auto-rows: 1fr;'));
  assert.ok(finalLayer.includes('.ams-dashboard-team-body'));
  assert.ok(finalLayer.includes('.ams-dashboard-owner-row'));
  assert.ok(finalLayer.includes('.ams-dashboard-recorded-time-row'));
  assert.ok(finalLayer.includes('.ams-dashboard-activity-tools'));
  assert.ok(finalLayer.includes('.ams-dashboard-activity-table'));
  assert.ok(finalLayer.includes('@media (max-width: 1359px)'));
  assert.ok(finalLayer.includes('@media (max-width: 599px)'));

  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.equal(overview.includes('aria-label="Reporting date range"'), false);
  for (const label of [
    'Finance reporting period',
    'Recorded time reporting period',
    'Filter activity by time window',
    'Filter deadlines by custom date range'
  ]) assert.ok(overview.includes('ariaLabel="' + label + '"') || overview.includes('aria-label="' + label + '"'));
  assert.ok(overview.includes('Export filtered recent activity as CSV'));
  assert.ok(overview.includes('pageSizeAriaLabel="Recent activity rows per page"'));
});


test('Dashboard header controls, tabs, project filters, Team Workload and Recent Activity use final compact alignment', async () => {
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const finalLayer = styles.slice(styles.lastIndexOf('/* Dashboard control normalization — 29 October 2026. */'));
  assert.ok(finalLayer.length > 0, 'The final alignment layer must be present.');

  assert.match(finalLayer, /\.ams-dashboard-header-actions \.ams-dashboard-control,[\s\S]*?height:\s*36px;[\s\S]*?min-height:\s*36px;[\s\S]*?max-height:\s*36px;/);
  assert.match(finalLayer, /nav\.ams-dashboard-view-tabs\s*\{[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?overflow-x:\s*visible;/);
  assert.match(finalLayer, /\.ams-dashboard-project-service-filter\s*\{[\s\S]*?height:\s*32px;[\s\S]*?max-height:\s*32px;/);
  assert.match(finalLayer, /\.ams-dashboard-project-service-filter \.ams-dashboard-control--filter\s*\{[\s\S]*?height:\s*24px;[\s\S]*?max-height:\s*24px;/);
  assert.match(finalLayer, /\.ams-project-registry-action[\s\S]*?height:\s*32px;[\s\S]*?max-height:\s*32px;/);
  assert.match(finalLayer, /\.ams-overview-card-row\[aria-label="Finance and project overview"\]\s*\{[\s\S]*?align-items:\s*stretch;[\s\S]*?grid-auto-rows:\s*minmax\(0, 1fr\);/);
  const teamLayerStart = styles.lastIndexOf('/* Team Workload: simple comparison lists, consistent section rhythm, and a compact per-card time filter. */');
  const teamLayerEnd = styles.indexOf('@media (max-width: 599px)', teamLayerStart);
  assert.ok(teamLayerStart >= 0 && teamLayerEnd > teamLayerStart);
  const teamLayer = styles.slice(teamLayerStart, teamLayerEnd);

  const tasksRuleStart = teamLayer.lastIndexOf('.ams-dashboard-team-panel > .ams-dashboard-team-body > .ams-dashboard-team-tasks {');
  const tasksRuleEnd = teamLayer.indexOf('}', tasksRuleStart);
  const finalTasksRule = teamLayer.slice(tasksRuleStart, tasksRuleEnd);
  assert.ok(tasksRuleStart >= 0 && tasksRuleEnd > tasksRuleStart);
  assert.match(finalTasksRule, /border-bottom:\s*0;/);
  assert.doesNotMatch(finalTasksRule, /border-bottom:\s*1px solid/);

  const timeRuleStart = teamLayer.lastIndexOf('.ams-dashboard-team-panel .ams-dashboard-team-body > .ams-dashboard-team-time {');
  const timeRuleEnd = teamLayer.indexOf('}', timeRuleStart);
  const finalTimeRule = teamLayer.slice(timeRuleStart, timeRuleEnd);
  assert.ok(timeRuleStart >= 0 && timeRuleEnd > timeRuleStart);
  assert.match(finalTimeRule, /padding:\s*16px 14px 14px;/);
  assert.match(finalLayer, /\.ams-dashboard-activity-search\s*\{[\s\S]*?height:\s*32px;[\s\S]*?min-height:\s*32px;[\s\S]*?max-height:\s*32px;/);
  assert.match(finalLayer, /\.ams-dashboard-activity-search input\s*\{[\s\S]*?min-height:\s*0;[\s\S]*?max-height:\s*100%;/);
  assert.match(finalLayer, /\.ams-dashboard-activity-filter \.ams-dashboard-select-trigger\s*\{[\s\S]*?height:\s*32px;[\s\S]*?max-height:\s*32px;/);

  const toolbarStart = dashboard.indexOf('<section className="ams-dashboard-toolbar');
  const toolbarEnd = dashboard.indexOf('</section>', toolbarStart);
  const toolbar = dashboard.slice(toolbarStart, toolbarEnd);
  assert.doesNotMatch(toolbar, /DashboardCalendarPeriodFilter|Reporting date range|ams-card-period-controls/,
    'Date selectors remain inside the relevant cards, not on a global toolbar.');
  assert.ok(dashboard.includes('ariaLabel="Filter activity by time window"'));
  assert.ok(dashboard.includes('aria-label="Search recent activity"'));
  assert.ok(dashboard.includes('Export filtered recent activity as CSV'));
});


test('Dashboard Performance outer spacing matches Overview shell and card gutters', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = dashboard.indexOf('const PerformanceView: React.FC');
  const end = dashboard.indexOf('const AnalyticsView: React.FC', start);
  assert.ok(start >= 0 && end > start);
  const performance = dashboard.slice(start, end);
  assert.ok(performance.includes('<div className="ams-dashboard-performance-workspace" data-ams-feature-slug="dashboard-performance-workspace">'));
  assert.equal(performance.includes('className="space-y-4"'), false, 'The generic vertical-margin utility must not collapse against the row margin reset.');

  const spacingMarker = '/* Dashboard Performance outer rhythm: match the Overview page-shell and card gutters. */';
  const spacing = styles.slice(styles.lastIndexOf(spacingMarker));
  assert.ok(spacing.length > 0);
  assert.match(spacing, /\.ams-dashboard-performance-workspace\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;[\s\S]*?gap:\s*12px;/);
  assert.match(spacing, /@media\s*\(max-width:\s*599px\)[\s\S]*?\.ams-dashboard-performance-workspace\s*\{[\s\S]*?gap:\s*12px;/, 'Mobile card rows should use the same compact 12px rhythm.');
  assert.match(spacing, /\.ams-dashboard-performance-workspace\s*>\s*\.ams-dashboard-performance-row\s*\{[\s\S]*?margin:\s*0;/);
  assert.match(styles, /\.ams-shell \.ams-dashboard \.ams-overview-card-row\s*\{[\s\S]*?column-gap:\s*12px;[\s\S]*?row-gap:\s*12px;/);
});
