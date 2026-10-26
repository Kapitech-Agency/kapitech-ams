import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Dashboard Overview leads with Finance and Projects cards and groups agency operations visually', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const performanceStart = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  assert.ok(overviewStart >= 0 && performanceStart > overviewStart, 'Dashboard overview branch should be identifiable');
  const overview = dashboard.slice(overviewStart, performanceStart);

  const scope = overview.indexOf('data-ams-feature-slug="dashboard-overview-reporting-scope"');
  const finance = overview.indexOf('data-ams-feature-slug="dashboard-finance-overview"');
  const portfolio = overview.indexOf('data-ams-feature-slug="dashboard-project-portfolio"');
  const projectProgress = overview.indexOf('data-ams-feature-slug="dashboard-project-progress"');
  const attention = overview.indexOf('data-ams-feature-slug="dashboard-attention-center"');
  const taskQueue = overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const deadlines = overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  const team = overview.indexOf('data-ams-feature-slug="dashboard-team-workload"');
  const clientFocus = overview.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"');
  const activity = overview.indexOf('data-ams-feature-slug="dashboard-recent-activity"');
  const shortcuts = overview.indexOf('data-ams-feature-slug="dashboard-workspace-shortcuts"');

  assert.ok(scope >= 0 && finance > scope && portfolio > finance, 'Finance and Projects must be the first main cards after scope.');
  assert.ok(projectProgress > portfolio && attention > projectProgress, 'Project progress precedes the compact exception card.');
  assert.ok(taskQueue > attention && deadlines > taskQueue, 'Task execution and deadlines follow the Finance/Project lead cards.');
  assert.ok(team > deadlines && clientFocus > team, 'Team and client delivery context remain secondary.');
  assert.ok(activity > clientFocus && shortcuts > activity, 'Audit activity and shortcuts stay at the bottom of the overview.');
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
  assert.ok(dashboard.includes('buildFinancialTrendForReportingPeriod(reportPeriodMode, reportPeriodValue'));
  assert.doesNotMatch(overview, /sampleProjects|demoProject|fakeFinance|const fake/i);
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
  const end = dashboard.indexOf('aria-label="Recent activity and shortcuts"', start);
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
  assert.ok(panel.includes('Overdue commitments remain'));
  assert.ok(panel.includes('No dated commitment in 30 days'));
});


test('Dashboard Overview client delivery focus groups saved client relationships and preserves source boundaries', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"');
  const end = dashboard.indexOf('aria-label="Recent activity and shortcuts"', start);
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
  assert.ok(panel.includes('Overdue commitments remain'));
  assert.ok(panel.includes('No dated commitment in 30 days'));
});


test('Dashboard client delivery focus resolves canonical client IDs and never invents project slugs for drill-downs', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-client-delivery-focus"');
  const end = dashboard.indexOf('aria-label="Recent activity and shortcuts"', start);
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
  assert.ok(finance.includes('Issued invoice values by issue date vs eligible expenses by recorded date'));
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
  const start = dashboard.indexOf("{view === 'overview' ? (");
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
  assert.match(dashboard, /to=\{canCreateProject \? '\/admin\/projects\?create=1' : '\/admin\/projects'\}/);
  assert.match(dashboard, /\{canCreateProject \? 'New project' : 'Projects'\}/);
  assert.match(projects, /const createProjectRequestHandled = React\.useRef\(false\)/);
  assert.match(projects, /searchParams\.get\('create'\) === '1'/);
  assert.match(projects, /next\.delete\('create'\)/);
  assert.match(projects, /if \(canManageProjects\) openNewProject\(\)/);
});



test('Dashboard Overview separates current operations from period-scoped Analytics without a duplicate chart filter', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const charts = await read('src/components/charts/DashboardCharts.tsx');
  const start = dashboard.indexOf("{view === 'overview' ? (");
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
  assert.ok(dashboard.includes('setValue: setReportingPeriodValue'));
  assert.ok(dashboard.includes('useReportingPeriod()'));
  assert.ok(analytics.includes('buildFinancialTrendForReportingPeriod(reportPeriodMode, reportPeriodValue'));
  assert.ok(analytics.includes('buildRecentFinancialTrend(inCurrencyInvoices, inCurrencyExpenses)'));
  assert.ok(analytics.includes('const selectedRangeLabel = describeFinancialTrendScope(trend, reportPeriodEnabled, reportPeriodLabel)'));
  assert.ok(dashboard.includes('Recent 30-day default window'));
  assert.ok(analytics.includes('All dates defaults to the recent 30 days.'));
  assert.ok(overview.includes('The selected period controls financial movement and recorded-time summaries. Project health, open tasks, receivables, and deadlines show current operational state.'));
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
  assert.ok(dashboard.includes("href: '/admin/finance?tab=accounts-receivable'"));
  assert.ok(dashboard.includes('data-ams-feature-slug="dashboard-quick-actions"'));
  assert.ok(dashboard.includes("const canCreateInvoice = hasAdminPermission('canManageInvoices') && canOpenInvoiceRegister"));
  assert.equal(dashboard.includes("const canCreateTask ="), false);
  assert.ok(dashboard.includes("to={canCreateInvoice ? '/admin/finance?tab=accounts-receivable&action=create-invoice' : '/admin/finance?tab=accounts-receivable'}"));
  assert.equal(dashboard.includes("to={canCreateTask ? '/admin/tasks?create=1' : '/admin/tasks'}"), false);
  assert.ok(dashboard.includes("to={canCreateProject ? '/admin/projects?create=1' : '/admin/projects'}"));
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
  const start = dashboard.indexOf("{view === 'overview' ? (");
  const stop = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, stop);
  const finance = overview.indexOf('data-ams-feature-slug="dashboard-finance-overview"');
  const projects = overview.indexOf('data-ams-feature-slug="dashboard-project-portfolio"');
  const progress = overview.indexOf('data-ams-feature-slug="dashboard-project-progress"');
  const exceptions = overview.indexOf('data-ams-feature-slug="dashboard-priority-exceptions"');
  const triage = overview.indexOf('data-ams-feature-slug="dashboard-inbox-triage"');
  const queue = overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const deadlines = overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  assert.ok(finance >= 0 && projects > finance && progress > projects && exceptions > progress);
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
  assert.ok(dashboard.includes('No inbound records need immediate triage.'));
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
  assert.ok(attention.includes('overviewAttentionItems.slice(0, 4).map((item, index) => {'));
  assert.ok(attention.includes('data-ams-feature-slug="dashboard-priority-exceptions"'));
  assert.ok(attention.includes('data-ams-feature-slug="dashboard-inbox-triage"'));
  assert.ok(attention.includes("label: 'New', value: inboxTriageSummary.newCount"));
  assert.ok(attention.includes("label: 'Unassigned', value: inboxTriageSummary.unassignedCount"));
  assert.ok(attention.includes("label: 'High priority', value: inboxTriageSummary.highPriorityCount"));
  assert.equal(attention.includes('Priority 01'), false);
});


test('Dashboard Overview orders Finance and Projects first, followed by action-oriented module cards', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf("{view === 'overview' ? (");
  const stop = dashboard.indexOf(") : view === 'performance' ? (", start);
  assert.ok(start >= 0 && stop > start);
  const overview = dashboard.slice(start, stop);
  const order = [
    'dashboard-overview-reporting-scope',
    'dashboard-finance-overview',
    'dashboard-project-portfolio',
    'dashboard-project-progress',
    'dashboard-attention-center',
    'dashboard-delivery-desk',
    'dashboard-delivery-commitments',
    'dashboard-team-workload',
    'dashboard-client-delivery-focus',
    'dashboard-recent-activity',
    'dashboard-workspace-shortcuts'
  ];
  let previous = -1;
  for (const slug of order) {
    const position = overview.indexOf('data-ams-feature-slug="' + slug + '"');
    assert.ok(position > previous, 'Overview priority/order must be clear: ' + slug);
    previous = position;
  }
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
  for (const label of ['Invoice value vs expenses','Money movement','Projects in progress','Creative & IT workload','Needs attention','Task queue','Upcoming deadlines','Team workload','Client delivery focus','Recent activity','Workspaces']) {
    assert.ok(overview.includes(label), 'Missing overview card: ' + label);
  }
  assert.ok(dashboard.includes('const attentionItemsDataReturned = Array.isArray(data.attentionItems)'));
  assert.ok(dashboard.includes('attentionItemsDataAvailable: attentionItemsDataReturned ? true : previous.attentionItemsDataAvailable'));
  assert.ok(overview.includes('Exception data unavailable'));
  assert.ok(overview.includes('No cross-module exceptions returned'));
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
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
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
  assert.ok(dashboard.includes('const commitmentHorizonTotal = allUpcomingCommitments.length'));
  assert.ok(dashboard.includes("const overdueHorizonCount = allUpcomingCommitments.filter((item) => item.dueDate < currentDayKey).length"));
  assert.ok(dashboard.includes('const daysEightToThirtyCommitmentCount'));
  assert.ok(deadlines.includes('Overdue and due within 30 days'));
  assert.ok(deadlines.includes("aria-label={'Delivery deadlines: ' + overdueHorizonCount"));
  assert.ok(deadlines.includes('upcomingCommitments.slice(0, 4).map((item) => {'));
  assert.ok(deadlines.includes("label: 'Overdue'"));
  assert.ok(deadlines.includes("label: 'Today–7 days'"));
  assert.ok(deadlines.includes("label: 'Days 8–30'"));
  assert.ok(deadlines.includes('overdueHorizonCount / commitmentHorizonTotal'));
  assert.ok(deadlines.includes('nextSevenDayCommitmentCount / commitmentHorizonTotal'));
  assert.ok(deadlines.includes('daysEightToThirtyCommitmentCount / commitmentHorizonTotal'));
});


test('Dashboard Projects card visualizes Creative and IT workload from canonical service-line counts', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('data-ams-feature-slug="dashboard-project-portfolio"');
  const end = dashboard.indexOf('data-ams-feature-slug="dashboard-project-progress"', start);
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
  const start = dashboard.indexOf("{view === 'overview' ? (");
  const stop = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, stop);
  const queueStart = overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const deadlineStart = overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  assert.ok(queueStart >= 0 && deadlineStart > queueStart);
  const queue = overview.slice(queueStart, deadlineStart);
  assert.ok(queue.includes('visibleOverviewTasks.slice(0, 5).map((task) => {'));
  assert.ok(queue.includes('role="group" aria-label="Task queue filters"'));
  assert.ok(queue.includes('aria-pressed={overviewTaskFilter === tab.key}'));
  assert.ok(queue.includes('canOpenDashboardRoute(taskDestination)'));
  assert.ok(dashboard.includes('const taskLoadByAssigneeMaximum = Math.max(1, ...taskLoadByAssignee.map((owner) => owner.total))'));
  assert.ok(overview.includes("aria-label={'Open task load for ' + owner.label"));
  assert.ok(overview.includes("style={{ width: owner.total / taskLoadByAssigneeMaximum * 100 + '%' }}"));
  assert.equal(overview.includes('pagedDashboardProjects'), false);
  assert.equal(overview.includes('AdminTablePagination'), false);
  assert.equal(overview.includes('title="Active projects"'), false);
});


test('Dashboard Overview gates module links through the existing route-access policy', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf("{view === 'overview' ? (");
  const stop = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, stop);
  assert.ok(dashboard.includes("const canOpenProjects = canOpenDashboardRoute('/admin/projects')"));
  assert.ok(dashboard.includes("const canOpenTasks = canOpenDashboardRoute('/admin/tasks')"));
  assert.ok(dashboard.includes("const canOpenTimeLogs = canOpenDashboardRoute('/admin/time-logs')"));
  assert.ok(dashboard.includes("const canOpenInvoiceRegister = canOpenDashboardRoute('/admin/finance?tab=accounts-receivable')"));
  assert.ok(dashboard.includes("const canOpenExpenseRegister = canOpenDashboardRoute('/admin/finance?tab=expenses')"));
  assert.ok(overview.includes(".filter((action) => canOpenDashboardRoute(action.href)).map((action) => ("));
  assert.ok(overview.includes('disabled={!canOpenTasks}'));
  assert.ok(overview.includes('canOpenDashboardRoute(taskDestination)'));
  assert.ok(overview.includes('canOpenProjects && canOpenDashboardRoute(projectHref)'));
  assert.ok(overview.includes('{canOpenTimeLogs ? <Link to="/admin/time-logs"'));
  assert.ok(overview.includes('{canOpenInvoiceRegister ? ('));
  assert.ok(overview.includes('{canOpenExpenseRegister ? ('));
  assert.ok(overview.includes("candidates.find((candidate) => candidate.startsWith('/admin/') && canOpenDashboardRoute(candidate))"));
});


test('Dashboard Overview displays canonical recent audit activity only for permitted roles', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf("{view === 'overview' ? (");
  const stop = dashboard.indexOf(") : view === 'performance' ? (", start);
  const overview = dashboard.slice(start, stop);
  const activity = overview.indexOf('data-ams-feature-slug="dashboard-recent-activity"');
  assert.ok(activity >= 0);
  assert.match(dashboard, /hasAdminPermission\('canViewSecurityAuditLogs'\)/);
  assert.match(dashboard, /const activityDataReturned = Array\.isArray\(data\.recentActivity\)/);
  assert.match(dashboard, /recentActivity: activityDataReturned \? data\.recentActivity as DashboardRecentActivity\[\] : previous\.recentActivity \?\? \[\]/);
  assert.ok(overview.includes('{canViewAuditLogs ? ('), 'Audit records must remain hidden without audit-log permission.');
  assert.ok(overview.includes('Recent activity unavailable'));
  assert.ok(overview.includes('No recent audit activity was returned.'));
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
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
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


test('Dashboard Overview exposes complete header navigation, reporting controls, and working operational filters', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);

  assert.ok(dashboard.includes('aria-label="Dashboard views"'));
  assert.ok(dashboard.includes("to={tab.key === 'overview' ? '/admin/dashboard' : '/admin/dashboard?view=' + tab.key}"));
  assert.ok(dashboard.includes('aria-label="Reporting period type"'));
  assert.ok(dashboard.includes('aria-label="Reporting date range"'));
  assert.ok(dashboard.includes('setMode: setReportingPeriodMode'));
  assert.ok(dashboard.includes('setValue: setReportingPeriodValue'));
  assert.ok(dashboard.includes('clearFilter: clearReportingPeriodFilter'));
  assert.ok(dashboard.includes('getReportingYearOptions(currentYear, [], selectedReportingRange?.year ?? currentYear)'));
  assert.ok(dashboard.includes('formatReportingPeriodLabel(value, reportPeriodMode, \'en-GB\')'));
  assert.ok(dashboard.includes('aria-label="Previous reporting period"'));
  assert.ok(dashboard.includes('aria-label="Next reporting period"'));
  assert.ok(dashboard.includes('onClick={clearReportingPeriodFilter}'));
  assert.ok(overview.includes('The selected period controls financial movement and recorded-time summaries'));
  assert.ok(overview.includes('Finance trend: {overviewPeriodDisplay}'));

  assert.ok(dashboard.includes("orderedActiveDashboardProjects\n    .filter((project) => overviewProjectFilter === 'all' || getDashboardServiceLine(project) === overviewProjectFilter)"));
  assert.ok(overview.includes('aria-label="Filter projects by service line"'));
  assert.ok(overview.includes("aria-pressed={overviewProjectFilter === filter.key}"));
  assert.ok(overview.includes('activeDashboardProjectFilterCounts[overviewProjectFilter]'));

  assert.ok(dashboard.includes("const upcomingCommitments = allUpcomingCommitments.filter((item) => {"));
  assert.ok(dashboard.includes("if (overviewDeadlineFilter === 'overdue') return item.dueDate < currentDayKey"));
  assert.ok(dashboard.includes("if (overviewDeadlineFilter === 'next7') return item.dueDate >= currentDayKey && item.dueDate <= nextSevenDaysKey"));
  assert.ok(dashboard.includes("if (overviewDeadlineFilter === 'days8to30') return item.dueDate > nextSevenDaysKey && item.dueDate <= nextThirtyDaysKey"));
  assert.ok(overview.includes('aria-label="Filter deadlines"'));
  assert.ok(overview.includes('aria-pressed={overviewDeadlineFilter === item.key}'));
  assert.ok(overview.includes('aria-label="Task queue filters"'));
  assert.equal(overview.includes('Priority 01'), false);
});


test('Dashboard header provides permission-aware invoice, project and refresh actions', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
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
  assert.ok(header.includes('ams-dashboard-header-action--project'));
  assert.ok(header.includes('ams-dashboard-header-action--refresh'));
  assert.ok(header.includes("canCreateInvoice ? 'Create invoice' : 'Invoices'"));
  assert.equal(header.includes('New task'), false);
  assert.ok(header.includes("canCreateProject ? 'New project' : 'Projects'"));
  assert.ok(header.includes('aria-label="Refresh dashboard data"'));

  assert.ok(invoicing.includes("const requestedInvoiceAction = searchParams.get('action')"));
  assert.ok(invoicing.includes("requestedInvoiceAction !== 'create-invoice'"));
  assert.ok(invoicing.includes("embeddedView !== 'receivables'"));
  assert.ok(invoicing.includes('createInvoiceActionHandled.current = true'));
  assert.ok(invoicing.includes('openCreateInvoice();'));
  assert.ok(styles.includes('.ams-dashboard-header-actions > a,'));
  assert.ok(styles.includes('.ams-dashboard-header-actions > a:focus-visible'));
  assert.ok(styles.includes('prefers-reduced-motion: reduce'));
});
