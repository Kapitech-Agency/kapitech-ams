import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Dashboard Overview is an agency delivery workboard with canonical task, service-line, milestone, resource and Finance surfaces', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const performanceStart = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  assert.ok(overviewStart >= 0 && performanceStart > overviewStart, 'Dashboard overview branch should be identifiable');
  const overview = dashboard.slice(overviewStart, performanceStart);

  const scopeStart = overview.indexOf('data-ams-feature-slug="dashboard-overview-reporting-scope"');
  const attentionCenterStart = overview.indexOf('data-ams-feature-slug="dashboard-attention-center"');
  const exceptionsStart = overview.indexOf('data-ams-feature-slug="dashboard-priority-exceptions"');
  const inboxTriageStart = overview.indexOf('data-ams-feature-slug="dashboard-inbox-triage"');
  const indicatorsStart = overview.indexOf('data-ams-feature-slug="dashboard-agency-operating-indicators"');
  const deliveryDeskStart = overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const commitmentsStart = overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  const financeStart = overview.indexOf('data-ams-feature-slug="dashboard-finance-control"');
  const clientFocusStart = overview.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"');
  const shortcutsStart = overview.indexOf('data-ams-feature-slug="dashboard-workspace-shortcuts"');
  const activityStart = overview.indexOf('data-ams-feature-slug="dashboard-recent-activity"');

  assert.ok(scopeStart >= 0 && attentionCenterStart > scopeStart, 'The page must define reporting semantics before the attention queue.');
  assert.ok(exceptionsStart > attentionCenterStart, 'Cross-module exceptions sit inside the Needs attention workspace.');
  assert.ok(inboxTriageStart > exceptionsStart && indicatorsStart > inboxTriageStart, 'Incoming triage is grouped with cross-module exceptions before operating indicators.');
  const attentionCenter = overview.slice(attentionCenterStart, indicatorsStart);
  assert.ok(attentionCenter.includes('Needs attention'));
  assert.ok(attentionCenter.includes("min-[1100px]:col-span-6"));
  assert.ok(attentionCenter.includes("min-[1100px]:col-span-12"), 'Exception queue uses full width when Inbox is not available to the role.');
  assert.ok(attentionCenter.includes('dashboard-priority-exceptions'));
  assert.ok(attentionCenter.includes('dashboard-inbox-triage'));
  assert.ok(overview.includes('Operational queues'));
  assert.ok(overview.includes('Current open records'));
  assert.ok(overview.includes('Overdue and next 30 days'));
  assert.ok(overview.includes('Current month · current receivables'));
  assert.ok(overview.includes('Recorded time follows that selected period, but open task counts and project states remain current.'));
  assert.ok(overview.includes('The shared reporting period applies to Performance and Analytics trends.'));
  assert.ok(deliveryDeskStart > indicatorsStart, 'Task-level delivery work follows the decision indicators.');
  assert.ok(commitmentsStart > deliveryDeskStart, 'Project milestone/deadline and resource views follow the primary task queue.');
  assert.ok(clientFocusStart > commitmentsStart, 'Client delivery focus follows delivery commitments and resource context.');
  assert.ok(financeStart > clientFocusStart, 'Client delivery context precedes the canonical Finance summary.');
  assert.ok(shortcutsStart > financeStart, 'Workspace shortcuts follow actionable source summaries.');
  assert.ok(activityStart > shortcutsStart, 'Recent audit activity remains the final overview section.');

  for (const slug of [
    'dashboard-open-tasks', 'dashboard-overdue-tasks', 'dashboard-review-queue',
    'dashboard-delivery-dates', 'dashboard-task-load-by-owner',
    'dashboard-recorded-time-by-person', 'dashboard-workspace-shortcuts'
  ]) assert.ok(overview.includes(slug), 'Missing agency operating surface: ' + slug);

  assert.ok(overview.includes('Creative & IT workstreams'));
  assert.ok(overview.includes('serviceCategory'));
  assert.ok(overview.includes('Other / Unclassified'));
  assert.ok(dashboard.includes("reviewTaskCount: lineTasks.filter((task) => task.status === 'review' || task.status === 'in_review').length"));
  assert.ok(dashboard.includes("blockedTaskCount: lineTasks.filter((task) => task.blocked).length"));
  assert.ok(dashboard.includes("unassignedTaskCount: lineTasks.filter((task) => !task.assigned).length"));
  assert.ok(dashboard.includes("overdueTaskCount: lineTasks.filter((task) => dashboardTaskIsOverdue(task, currentDayKey)).length"));
  assert.ok(overview.includes("label: 'Tasks in review'"));
  assert.ok(overview.includes("label: 'Blocked tasks'"));
  assert.ok(overview.includes("label: 'Unassigned tasks'"));
  assert.ok(overview.includes("label: 'Overdue tasks'"));
  assert.ok(overview.includes("!canOpenProjects ? ("));
  assert.ok(overview.includes("operationalSnapshot.tasks !== null && canOpenTasks ? line.reviewTaskCount : null"));
  assert.ok(overview.includes('Task-state breakdown is unavailable for this role or source.'));
  assert.ok(overview.includes('Upcoming milestones & delivery deadlines'));
  assert.ok(overview.includes('Client delivery focus'));
  assert.ok(overview.includes('Saved company-name grouping is a fallback'));
  assert.ok(overview.includes('not a client health, contract or SLA score'));
  assert.ok(overview.includes('No client-linked delivery records'));
  assert.ok(overview.includes('Open tasks by owner'));
  assert.ok(overview.includes('Recorded time'));
  assert.ok(overview.includes('Finance control'));
  assert.ok(overview.includes('Cash received this month'));
  assert.ok(overview.includes('Outstanding receivables'));
  assert.ok(overview.includes('Task source unavailable'));
  assert.ok(overview.includes('Milestone source unavailable'));
  assert.ok(overview.includes('Destination not mapped to an authorized workspace'));

  assert.equal(overview.includes('title="Invoices vs expenses"'), false,
    'Overview should not repeat the financial trend that belongs in Analytics.');
  assert.equal(overview.includes('title="Delivery & pacing"'), false,
    'A generic no-risk portfolio ratio is not a substitute for task and milestone operations.');
  assert.equal(overview.includes('title="Team capacity"'), false,
    'Do not show a hardcoded unavailable placeholder when task and time sources are available.');
  assert.equal(overview.includes('title="Active projects"'), false,
    'Dashboard should summarize upcoming commitments instead of duplicating the full Project Registry.');

  assert.ok(overview.includes('The shared reporting period applies to Performance and Analytics trends.'));
  assert.ok(overview.includes('Neither is a forecast of available capacity.'));
  assert.ok(dashboard.includes("const cashCollectedMetric = liveCashCollected") || dashboard.includes("const liveCashCollected = operationalSnapshot.invoices === null"));
});


test('Dashboard Overview client delivery focus groups saved client relationships and preserves source boundaries', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"');
  const end = dashboard.indexOf('{(canOpenInvoiceRegister || canOpenExpenseRegister) ? (', start);
  assert.ok(start >= 0 && end > start, 'Client delivery focus should be a separate bounded source summary.');
  const clientFocus = dashboard.slice(start, end);
  assert.ok(dashboard.includes('const clientDeliveryFocus = useMemo<DashboardClientDeliveryFocus[]>(() =>'));
  assert.ok(dashboard.includes("resolveDashboardClientName(clientId, clientDirectoryById, project.clientCompany, project.client, project.clientName)"));
  assert.ok(dashboard.includes('const projectIdentity = projectClientById.get(task.projectId)'));
  assert.ok(dashboard.includes('ensureClient(task.clientId, task.clientName)'));
  assert.ok(clientFocus.includes('active projects'));
  assert.ok(clientFocus.includes('overdue commitments'));
  assert.ok(clientFocus.includes('Tasks in review'));
  assert.ok(clientFocus.includes('Blocked tasks'));
  assert.ok(clientFocus.includes('Overdue tasks'));
  assert.ok(clientFocus.includes('canOpenDashboardRoute(project.href)'));
  assert.ok(clientFocus.includes('not a client health, contract or SLA score'));
  assert.ok(clientFocus.includes('No future date · overdue work remains'));
  assert.ok(clientFocus.includes('No dated commitment in the next 30 days'));
});

test('Dashboard client delivery focus resolves canonical client IDs and never invents project slugs for drill-downs', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"');
  const end = dashboard.indexOf('{(canOpenInvoiceRegister || canOpenExpenseRegister) ? (', start);
  assert.ok(start >= 0 && end > start);
  const clientFocus = dashboard.slice(start, end);

  assert.ok(dashboard.includes("const canOpenClientDirectory = canOpenDashboardRoute('/admin/clients/all-clients')"));
  assert.ok(dashboard.includes("canOpenClientDirectory ? api.clients.getAll() : Promise.resolve"));
  assert.ok(dashboard.includes("const clientId = String(project.clientId || project.client_id || '').trim()"));
  assert.ok(dashboard.includes("const key = clientId ? 'client-id:' + clientId : 'saved-name:' + normalizedName"));
  assert.ok(dashboard.includes('const projectIdentity = projectClientById.get(task.projectId)'));
  assert.ok(dashboard.includes('ensureClient(task.clientId, task.clientName)'));
  assert.ok(dashboard.includes('Saved client ID · master record not resolved'));
  assert.ok(dashboard.includes('Grouped by saved company name'));
  assert.ok(dashboard.includes("'/admin/clients/all-clients?client=' + encodeURIComponent(client.clientId)"));
  assert.ok(clientFocus.includes('client.clientRecordAvailable && canOpenClientDirectory && client.clientId'));
  assert.ok(dashboard.includes("if (slug) return '/admin/projects?projects=sprint&project=' + encodeURIComponent(slug)"));
  assert.ok(dashboard.includes("if (id) return '/admin/projects?projects=all&project=' + encodeURIComponent(id)"));
  assert.ok(dashboard.includes('getDashboardProjectHref(project)'));
  assert.ok(dashboard.includes('const projectHref = item.projectHref'));
  assert.equal(dashboard.includes("'/admin/projects?projects=sprint&project=' + encodeURIComponent(projectSlug)"), false,
    'A generated slug must not be treated as a canonical project route.');
  assert.ok(clientFocus.includes('project.href && canOpenDashboardRoute(project.href)'));
});

test('Dashboard Overview Finance controls link to canonical ledgers only when route access allows them', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-finance-control"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-workspace-shortcuts"', start);
  assert.ok(start >= 0 && end > start, 'Finance control summary must remain a bounded Overview section.');
  const finance = dashboard.slice(start, end);

  assert.ok(dashboard.includes("const canOpenInvoiceRegister = canOpenDashboardRoute('/admin/finance?tab=accounts-receivable')"));
  assert.ok(dashboard.includes("const canOpenExpenseRegister = canOpenDashboardRoute('/admin/finance?tab=expenses')"));
  assert.ok(finance.includes('{canOpenInvoiceRegister ? ('));
  assert.ok(finance.includes('{canOpenExpenseRegister ? ('));
  assert.ok(finance.includes('Cash received this month'));
  assert.ok(finance.includes('Outstanding receivables'));
  assert.ok(finance.includes('Recorded expenses this month'));
  assert.ok(finance.includes('to="/admin/finance?tab=accounts-receivable"'));
  assert.ok(finance.includes('to="/admin/finance?tab=expenses"'));
  assert.ok(finance.includes('Finance owns posted accounting truth'));
  assert.doesNotMatch(finance, /revenueThisMonth|netOperatingProfit/, 'Current cash control must not substitute revenue or an unposted profit estimate.');
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
  assert.ok(dashboard.includes("const upcomingCommitments = allUpcomingCommitments.slice(0, 8)"));
  assert.ok(dashboard.includes("const taskLoadByAssignee = useMemo(() =>"));
  assert.ok(dashboard.includes("const periodTimeRows = useMemo(() =>"));
  assert.ok(dashboard.includes("const activeTaskCount = operationalSnapshot.tasks === null ? null : activeDashboardTasks.length"));
  assert.ok(dashboard.includes("operationalSnapshot.tasks === null ? ("));
  assert.ok(dashboard.includes("operationalSnapshot.projects === null ? ("));
  assert.ok(dashboard.includes('Task queue unavailable'));
  assert.ok(dashboard.includes('Workstream data unavailable'));
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

test('Dashboard overview keeps its operational queues source-backed and preserves financial source states in Analytics', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  for (const sourceCall of [
    'api.dashboard.getOverview()',
    'api.projects.getAll()',
    'api.tasks.getAll()',
    'api.timeLogs.getAll()',
    'api.finance.getInvoices()',
    'api.finance.getExpenses()',
  ]) {
    assert.ok(dashboard.includes(sourceCall), 'Dashboard data source missing: ' + sourceCall);
  }
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const analyticsStart = dashboard.indexOf('const AnalyticsView:');
  const analyticsEnd = dashboard.indexOf('export const GlobalExecutiveDashboard', analyticsStart);
  const analytics = dashboard.slice(analyticsStart, analyticsEnd);

  assert.ok(overview.includes('Task queue unavailable'), 'Missing task sources must remain explicit.');
  assert.ok(overview.includes('Workstream data unavailable'), 'Missing project sources must remain explicit.');
  assert.ok(overview.includes('Time-log source unavailable'), 'Missing time sources must remain explicit.');
  assert.ok(overview.includes('Invoice/payment source unavailable.'), 'Missing Finance sources must remain explicit.');
  assert.ok(analytics.includes('Financial trend unavailable'));
  assert.ok(analytics.includes('not posted profit'), 'Difference must not be relabeled as posted profit.');
  assert.ok(analytics.includes('A zero-value trend is not inferred from an empty source'));
  assert.doesNotMatch(dashboard, /Preview data only|sampleProjects|sampleTeam|sampleRevenueByRange|isSlugFixtureMode|fixtureMode/);
});

test('Dashboard project creation action opens the existing create drawer only for permitted roles', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const projects = await read('src/pages/admin/AdminProjects.tsx');

  assert.match(dashboard, /hasAdminPermission\('canManageProjects'\)/);
  assert.match(dashboard, /const canCreateProject = canManageProjects && canOpenDashboardRoute\('\/admin\/projects\?create=1'\)/);
  assert.match(dashboard, /canCreateProject \|\| canOpenProjects/);
  assert.match(dashboard, /to=\{canCreateProject \? '\/admin\/projects\?create=1' : '\/admin\/projects'\}/);
  assert.match(dashboard, /\{canCreateProject \? 'New project' : 'Open Projects'\}/);
  assert.match(projects, /const createProjectRequestHandled = React\.useRef\(false\)/);
  assert.match(projects, /searchParams\.get\('create'\) === '1'/);
  assert.match(projects, /next\.delete\('create'\)/);
  assert.match(projects, /if \(canManageProjects\) openNewProject\(\)/);
});


test('Dashboard Overview separates current operations from period-scoped Analytics without a duplicate chart filter', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const charts = await read('src/components/charts/DashboardCharts.tsx');
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const analyticsStart = dashboard.indexOf('const AnalyticsView:');
  const analyticsEnd = dashboard.indexOf('export const GlobalExecutiveDashboard', analyticsStart);
  const analytics = dashboard.slice(analyticsStart, analyticsEnd);

  assert.match(dashboard, /const \{ matchesDate, matchesInterval, value: reportPeriodValue, mode: reportPeriodMode, enabled: reportPeriodEnabled \} = useReportingPeriod\(\)/);
  assert.ok(analytics.includes('buildFinancialTrendForReportingPeriod(reportPeriodMode, reportPeriodValue'));
  assert.ok(analytics.includes('buildRecentFinancialTrend(inCurrencyInvoices, inCurrencyExpenses)'));
  assert.ok(analytics.includes('const selectedRangeLabel = describeFinancialTrendScope(trend, reportPeriodEnabled, reportPeriodLabel)'));
  assert.ok(analytics.includes("ariaLabel={'Issued invoice values and recorded expenses for ' + selectedRangeLabel + '. Exact values are listed in the table below.'}"));
  assert.ok(dashboard.includes('Recent 30-day default window'));
  assert.ok(analytics.includes('recent 30-day default window'));
  assert.ok(overview.includes('The shared reporting period applies to Performance and Analytics trends.'));
  assert.ok(overview.includes('Task ownership, review queues, delivery commitments and Finance balances show current operational state.'));
  assert.equal(overview.includes('title="Invoices vs expenses"'), false, 'Overview must not duplicate Analytics financial trends.');
  assert.equal(overview.includes('title="Active projects"'), false, 'Overview must not duplicate Project Registry.');
  assert.equal(dashboard.includes('DashboardTrendRangePicker'), false, 'The global reporting Filter is the only chart-period selector.');
  assert.equal(dashboard.includes('RangeKey'), false, 'Dashboard-local range state must not compete with global reporting scope.');
  assert.ok(analytics.includes('aria-label="Exact invoice and expense values by period"'), 'The chart must provide a keyboard-focusable exact-value table.');
  assert.ok(charts.includes('<div className="relative min-w-0" role="img" aria-label={ariaLabel}>'));
  assert.ok(charts.includes('<span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-accent" />{primaryLabel}</span>'));
  assert.ok(charts.includes('{secondaryLabel && <span className="inline-flex items-center gap-2">'));
});

test('Dashboard quick actions and project-header links respect route access', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.ok(dashboard.includes('const currentNavigationRole = getAmsRole(getAdminSession()?.user)'));
  assert.ok(dashboard.includes('return canAccessAmsRoute(currentNavigationRole, target.pathname, target.search)'));
  assert.ok(dashboard.includes('.filter((action) => canOpenDashboardRoute(action.href)).map((action) => ('));
  assert.ok(dashboard.includes("href: '/admin/finance?tab=accounts-receivable'"));
  assert.ok(dashboard.includes('canCreateProject || canOpenProjects'));
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
  const primary = performance.indexOf('data-ams-feature-slug="dashboard-performance-primary"');
  const taskStatus = performance.indexOf('title="Task status in scope"', primary);
  const projectExceptions = performance.indexOf('title="Projects needing attention"', taskStatus);
  const trackedTime = performance.indexOf('title="Tracked time in scope"', projectExceptions);
  const supportingMetrics = performance.indexOf('data-ams-feature-slug="dashboard-performance-supporting-metrics"', trackedTime);
  assert.ok(scope >= 0 && primary > scope && taskStatus > primary && projectExceptions > taskStatus && trackedTime > projectExceptions && supportingMetrics > trackedTime,
    'Reporting scope and primary delivery analysis should lead, followed by time context and supporting metrics.');
  assert.match(performance, /matchesInterval\(dueDate, dueDate, task\.createdAt\)/);
  assert.match(performance, /matchesInterval\([\s\S]*project\.startDate \|\| project\.start[\s\S]*project\.createdAt[\s\S]*\)/);
  assert.match(performance, /matchesDate\(log\.date \|\| log\.createdAt\)/);
  assert.match(performance, /Records without usable dates remain visible/);
  assert.match(performance, /current status snapshots, not historical status-transition trends/);
  assert.match(performance, /No task records match the selected reporting scope/);
  assert.match(performance, /current task status and the shared reporting-period date scope/);
  assert.match(performance, /Other open tasks/);
  assert.match(performance, /status\.count \/ tasks\.length \* 100/);
  assert.match(performance, /Active projects in scope/);
  assert.match(performance, /Tasks in scope/);
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

test('Dashboard Overview adds a permission-gated Inbox triage work surface from the canonical lead source', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const inboxTriage = await read('src/lib/inboxTriage.ts');
  const inboxPage = await read('src/pages/admin/AdminInbox.tsx');
  const branchStart = dashboard.indexOf("{view === 'overview' ? (");
  const branchEnd = dashboard.indexOf(") : view === 'performance' ? (", branchStart);
  assert.ok(branchStart >= 0 && branchEnd > branchStart);
  const overview = dashboard.slice(branchStart, branchEnd);
  const exceptionsStart = overview.indexOf('data-ams-feature-slug="dashboard-priority-exceptions"');
  const triageStart = overview.indexOf('data-ams-feature-slug="dashboard-inbox-triage"');
  const indicatorsStart = overview.indexOf('data-ams-feature-slug="dashboard-agency-operating-indicators"');
  assert.ok(exceptionsStart >= 0 && triageStart > exceptionsStart && indicatorsStart > triageStart,
    'Inbox triage belongs between cross-module exceptions and the agency operating indicators.');

  assert.ok(dashboard.includes("const canOpenInbox = canOpenDashboardRoute('/admin/inbox')"));
  assert.ok(dashboard.includes("canOpenInbox ? api.leads.getAll() : Promise.resolve"));
  assert.ok(dashboard.includes("inboxLeadRows.map((lead) => normalizeContactSubmission(lead as ContactSubmission)).filter((lead) => lead.type !== 'career')"));
  assert.ok(dashboard.includes("import { isInboxActionable, isInboxHighPriority, isInboxUnassigned } from '../../lib/inboxTriage'"));
  assert.ok(dashboard.includes("import { normalizeContactSubmission, type ContactSubmission } from '../../lib/submissions'"));
  assert.ok(dashboard.includes('const openRecords = operationalSnapshot.inboxLeads.filter((lead) => lead.status !== \'closed\')'));
  assert.ok(dashboard.includes('.filter(isInboxActionable)'));
  assert.ok(dashboard.includes('.filter(isInboxUnassigned)'));
  assert.ok(dashboard.includes('.filter(isInboxHighPriority)'));
  assert.ok(dashboard.includes('Inbox source did not return records'));
  assert.ok(dashboard.includes('Open inbound records that are new, unassigned or high priority. Careers applicants are kept in the Careers workspace.'));
  assert.ok(dashboard.includes('Triage counts can overlap: a record can be new, unassigned and high priority at once.'));
  assert.ok(dashboard.includes('No inbound records need immediate triage'));
  assert.ok(dashboard.includes('Closed records and Careers applicants are excluded.'));
  assert.match(dashboard, /return canOpenInbox\s+\? items\.filter\(\(item\) => String\(item\.category \|\| ''\)\.toLowerCase\(\) !== 'sales' && item\.id !== 'att_leads_new'\)/);
  assert.ok(inboxTriage.includes("item.status === 'new'"));
  assert.ok(inboxTriage.includes('isInboxUnassigned(item)'));
  assert.ok(inboxPage.includes(".filter((item) => item.type !== 'career')"));
  assert.ok(inboxPage.includes('isInboxActionable(item)'));
  assert.ok(dashboard.includes('inboxTriageSummary.state === \'unavailable\''));
});

test('Dashboard Overview places the canonical exception queue before agency indicators and delivery work', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const branchStart = dashboard.indexOf("{view === 'overview' ? (");
  const branchEnd = dashboard.indexOf(") : view === 'performance' ? (", branchStart);
  assert.ok(branchStart >= 0 && branchEnd > branchStart);
  const overview = dashboard.slice(branchStart, branchEnd);
  const scope = overview.indexOf('data-ams-feature-slug="dashboard-overview-reporting-scope"');
  const priority = overview.indexOf('data-ams-feature-slug="dashboard-priority-exceptions"');
  const indicators = overview.indexOf('data-ams-feature-slug="dashboard-agency-operating-indicators"');
  const deliveryDesk = overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const commitments = overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  const finance = overview.indexOf('data-ams-feature-slug="dashboard-finance-control"');
  const shortcuts = overview.indexOf('data-ams-feature-slug="dashboard-workspace-shortcuts"');
  assert.ok(scope >= 0 && priority > scope && indicators > priority && deliveryDesk > indicators && commitments > deliveryDesk);
  assert.ok(finance > commitments && shortcuts > finance);
  assert.ok(dashboard.includes('const attentionItemsDataReturned = Array.isArray(data.attentionItems)'));
  assert.ok(dashboard.includes('attentionItemsDataAvailable: attentionItemsDataReturned ? true : previous.attentionItemsDataAvailable'));
  assert.ok(overview.includes('Cross-module exception data unavailable'));
  assert.ok(overview.includes('No exceptions returned by the Dashboard service'));
  assert.ok(overview.includes('This is not interpreted as a clean operational state.'));
  assert.ok(overview.includes('Destination not mapped to an authorized workspace'));
  assert.ok(overview.includes("candidates.find((candidate) => candidate.startsWith('/admin/') && canOpenDashboardRoute(candidate))"));
  assert.ok(overview.includes("id: 'open-tasks', label: 'Open tasks'"));
  assert.ok(overview.includes("id: 'overdue-tasks', label: 'Overdue tasks'"));
  assert.ok(overview.includes("id: 'review-queue', label: 'Tasks in review'"));
  assert.equal(overview.includes('data-ams-feature-slug="dashboard-overview"'), false);
  assert.equal(overview.includes('data-ams-feature-slug="dashboard-quick-actions"'), false);
});

test('Dashboard agency delivery panels use responsive task cards and do not duplicate the project registry', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const queueStart = overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const commitmentStart = overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  assert.ok(queueStart >= 0 && commitmentStart > queueStart);
  const queue = overview.slice(queueStart, commitmentStart);
  assert.ok(queue.includes('visibleOverviewTasks.map((task) => {'));
  assert.ok(queue.includes('min-[900px]:flex-row'));
  assert.ok(queue.includes('role="group" aria-label="Delivery queue filters"'));
  assert.ok(queue.includes('aria-pressed={overviewTaskFilter === tab.key}'));
  assert.ok(queue.includes('Showing {visibleOverviewTasks.length} highest-priority tasks'));
  assert.equal(overview.includes('pagedDashboardProjects'), false, 'Overview must not duplicate the paginated Project Registry.');
  assert.equal(overview.includes('AdminTablePagination'), false, 'Task cards must not borrow registry pagination.');
  assert.equal(overview.includes('title="Active projects"'), false);
});

test('Dashboard Overview gates task, project, time and Finance links through the existing route-access policy', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.ok(dashboard.includes("const canOpenProjects = canOpenDashboardRoute('/admin/projects')"));
  assert.ok(dashboard.includes("const canOpenTasks = canOpenDashboardRoute('/admin/tasks')"));
  assert.ok(dashboard.includes("const canOpenTimeLogs = canOpenDashboardRoute('/admin/time-logs')"));
  assert.ok(dashboard.includes("const canOpenInvoiceRegister = canOpenDashboardRoute('/admin/finance?tab=accounts-receivable')"));
  assert.ok(dashboard.includes("const canOpenExpenseRegister = canOpenDashboardRoute('/admin/finance?tab=expenses')"));
  assert.ok(overview.includes('.filter((action) => canOpenDashboardRoute(action.href)).map((action) => ('));
  assert.ok(overview.includes('canOpenTasks && canOpenDashboardRoute(taskQueueDestination)'));
  assert.ok(overview.includes('canOpenProjects && canOpenDashboardRoute(projectHref)'));
  assert.ok(overview.includes('{canOpenTimeLogs ? <Link to="/admin/time-logs"'));
  assert.ok(overview.includes('{canOpenInvoiceRegister ? ('));
  assert.ok(overview.includes('{canOpenExpenseRegister ? ('));
  assert.ok(overview.includes('candidates.find((candidate) => candidate.startsWith(\'/admin/\') && canOpenDashboardRoute(candidate))'), 'Exception links must choose a destination allowed for the current role.');
});

test('Dashboard Overview displays canonical recent audit activity only for permitted roles', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const activity = overview.indexOf('data-ams-feature-slug="dashboard-recent-activity"');

  assert.ok(activity >= 0, 'Overview needs a source-backed recent activity surface.');
  assert.match(dashboard, /hasAdminPermission\('canViewSecurityAuditLogs'\)/);
  assert.match(dashboard, /const activityDataReturned = Array\.isArray\(data\.recentActivity\)/);
  assert.match(dashboard, /recentActivity: activityDataReturned \? data\.recentActivity as DashboardRecentActivity\[\] : previous\.recentActivity \?\? \[\]/);
  assert.ok(overview.includes('{canViewAuditLogs && ('), 'Audit events must remain hidden from roles without audit-log permission.');
  assert.ok(overview.includes('No recent activity available'));
  assert.ok(overview.includes('Recent activity unavailable'));
  assert.ok(overview.includes('/admin/settings?tab=audit'));
  const panel = overview.slice(activity);
  assert.match(panel, /activity\.action/);
  assert.match(panel, /activity\.actor/);
  assert.match(panel, /activity\.timestamp/);
  assert.doesNotMatch(panel, /activity\.(?:ip|userAgent|details|hash|prevHash|metadata)/,
    'Dashboard must not expose IPs, free-form audit details or chain metadata in the summary feed.');
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
