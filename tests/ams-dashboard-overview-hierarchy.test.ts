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
  const exceptionsStart = overview.indexOf('data-ams-feature-slug="dashboard-priority-exceptions"');
  const indicatorsStart = overview.indexOf('data-ams-feature-slug="dashboard-agency-operating-indicators"');
  const deliveryDeskStart = overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const commitmentsStart = overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  const financeStart = overview.indexOf('data-ams-feature-slug="dashboard-finance-control"');
  const shortcutsStart = overview.indexOf('data-ams-feature-slug="dashboard-workspace-shortcuts"');
  const activityStart = overview.indexOf('data-ams-feature-slug="dashboard-recent-activity"');

  assert.ok(scopeStart >= 0 && exceptionsStart > scopeStart, 'The page must explain scope before cross-module exceptions.');
  assert.ok(indicatorsStart > exceptionsStart, 'Agency work indicators follow the exception queue.');
  assert.ok(deliveryDeskStart > indicatorsStart, 'Task-level delivery work follows the decision indicators.');
  assert.ok(commitmentsStart > deliveryDeskStart, 'Project milestone/deadline and resource views follow the primary task queue.');
  assert.ok(financeStart > commitmentsStart, 'Finance control remains a separate canonical summary.');
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
  assert.ok(overview.includes('Upcoming milestones & delivery deadlines'));
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


test('Dashboard Overview financial trend drills down to the existing Finance registers only when authorized', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.ok(dashboard.includes("const canOpenInvoiceRegister = canOpenDashboardRoute('/admin/finance?tab=accounts-receivable')"));
  assert.ok(dashboard.includes("const canOpenExpenseRegister = canOpenDashboardRoute('/admin/finance?tab=expenses')"));
  assert.ok(dashboard.includes('actions={canOpenInvoiceRegister || canOpenExpenseRegister ? ('));
  assert.ok(dashboard.includes('to="/admin/finance?tab=accounts-receivable"'));
  assert.ok(dashboard.includes('to="/admin/finance?tab=expenses"'));
  assert.ok(dashboard.includes('View invoices'));
  assert.ok(dashboard.includes('View expenses'));
});

test('Dashboard work queue and service-line summaries come from canonical task/project records', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.ok(dashboard.includes("api.tasks.getAll()"));
  assert.ok(dashboard.includes("const dashboardWorkTasks = useMemo<DashboardWorkTask[]>(() =>"));
  assert.ok(dashboard.includes("const projectId = String(task?.projectId || task?.project_id || '')"));
  assert.ok(dashboard.includes("const serviceCategory = String(project?.serviceCategory || task?.serviceCategory || task?.service || '')"));
  assert.ok(dashboard.includes("const serviceLineConfiguration = ["));
  assert.ok(dashboard.includes("label: 'Creative & Content'"));
  assert.ok(dashboard.includes("label: 'Web & IT Development'"));
  assert.ok(dashboard.includes("label: 'Other / Unclassified'"));
  assert.ok(dashboard.includes("const upcomingCommitments = useMemo<DashboardCommitment[]>(() =>"));
  assert.ok(dashboard.includes("const taskLoadByAssignee = useMemo(() =>"));
  assert.ok(dashboard.includes("const periodTimeRows = useMemo(() =>"));
  assert.ok(dashboard.includes("const activeTaskCount = operationalSnapshot.tasks === null ? null : activeDashboardTasks.length"));
  assert.ok(dashboard.includes("if (operationalSnapshot.tasks === null)"));
  assert.ok(dashboard.includes("if (operationalSnapshot.projects === null)"));
  assert.doesNotMatch(dashboard, /const taskCount\s*=\s*0/);
});

test('Dashboard Overview financial-history availability respects the selected currency', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.ok(dashboard.includes("invoiceSourceHasRows = Boolean(operationalSnapshot.invoices?.length)"));
  assert.ok(dashboard.includes("invoiceHistoryReturned = Boolean(operationalSnapshot.invoices?.some((invoice: any) => String(invoice.currency || 'IDR').toUpperCase() === financeCurrency && isIssuedInvoice(invoice)))"));
  assert.ok(dashboard.includes("expenseHistoryReturned = Boolean(operationalSnapshot.expenses?.some((expense: any) => String(expense.currency || 'IDR').toUpperCase() === financeCurrency && isDashboardExpenseEligible(expense)))"));
  assert.ok(dashboard.includes("const expenseSourceHasSelectedCurrencyRows = Boolean(operationalSnapshot.expenses?.some((expense: any) => String(expense.currency || 'IDR').toUpperCase() === financeCurrency))"));
  assert.ok(dashboard.includes('No usable financial records in selected currency'));
  assert.ok(dashboard.includes('No financial records in selected currency'));
  assert.ok(dashboard.includes('A zero-value trend is not inferred from another currency.'));
});

test('Dashboard overview keeps operational data and financial labels source-backed', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  for (const sourceCall of [
    'api.dashboard.getOverview()',
    'api.projects.getAll()',
    'api.tasks.getAll()',
    'api.finance.getInvoices()',
    'api.finance.getExpenses()',
  ]) {
    assert.ok(dashboard.includes(sourceCall), 'Dashboard data source missing: ' + sourceCall);
  }
  assert.ok(dashboard.includes('Live data unavailable'), 'Missing live sources must remain explicit');
  assert.ok(dashboard.includes('not a posted profit figure'), 'Difference must not be relabeled as posted profit');
  assert.ok(dashboard.includes('A usable issued-invoice and recorded-expense trend could not be built for this reporting window. Missing values are not estimated.'));
  assert.ok(dashboard.includes('Financial trend unavailable'));
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


test('Dashboard Overview and Analytics share the topbar reporting period without a duplicate chart filter', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const charts = await read('src/components/charts/DashboardCharts.tsx');
  assert.match(dashboard, /const \{ matchesDate, matchesInterval, value: reportPeriodValue, mode: reportPeriodMode, enabled: reportPeriodEnabled \} = useReportingPeriod\(\)/);
  assert.ok(dashboard.includes('getReportingPeriodRange(reportPeriodValue, reportPeriodMode, \'en-GB\')'));
  assert.ok(dashboard.includes('buildFinancialTrendForReportingPeriod(reportPeriodMode, reportPeriodValue'));
  assert.ok(dashboard.includes('buildRecentFinancialTrend(invoices, expenses)'));
  assert.ok(dashboard.includes('Recent 30-day default window'));
  assert.ok(dashboard.includes("ariaLabel={'Issued invoices, recorded expenses, and difference for ' + financialTrendScopeLabel + '.'}"), 'Chart accessible name must follow the same period label as its content.');
  assert.ok(dashboard.includes('Active projects overlapping '));
  assert.ok(dashboard.includes('Active projects across all dates.'));
  assert.ok(dashboard.includes('Active projects now'));
  assert.ok(dashboard.includes('Current open project records'));
  assert.ok(dashboard.includes('Payments less recorded expenses this month'));
  assert.equal(dashboard.includes('DashboardTrendRangePicker'), false, 'Use the global reporting-period Filter instead of a second chart picker.');
  assert.equal(dashboard.includes('RangeKey'), false, 'Dashboard-local range state must not compete with the shared reporting period.');
  assert.equal(dashboard.includes('data-ams-slug="dashboard-finance-chart-legend"'), false, 'The Overview should not duplicate the legend rendered by TrendChart.');
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

test('Dashboard Overview does not infer a zero financial trend from empty invoice or expense sources', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.match(dashboard, /const invoiceSourceHasRows = Boolean\(operationalSnapshot\.invoices\?\.length\)/);
  assert.match(dashboard, /const expenseSourceHasRows = Boolean\(operationalSnapshot\.expenses\?\.length\)/);
  const chartStart = dashboard.indexOf('title="Invoices vs expenses"');
  const chartEnd = dashboard.indexOf('</AdminPanel>', chartStart);
  assert.ok(chartStart >= 0 && chartEnd > chartStart, 'Overview financial chart should have a bounded panel section');
  const chart = dashboard.slice(chartStart, chartEnd);
  assert.ok(chart.includes('!financeSourcesAvailable'), 'Failed source reads must remain unavailable.');
  assert.ok(chart.includes('!invoiceHistoryReturned && !expenseHistoryReturned'), 'Two empty sources must remain an explicit no-record state.');
  assert.ok(chart.includes('!invoiceHistoryReturned'), 'An empty invoice source must not become a zero invoice trend.');
  assert.ok(chart.includes('!expenseHistoryReturned'), 'An empty expense source must not become a zero expense trend.');
  assert.ok(chart.includes('A zero-value trend is not inferred from another currency.'));
  assert.ok(chart.includes('No financial records in selected currency'));
  assert.ok(dashboard.includes('invoiceHistoryReturned = Boolean(operationalSnapshot.invoices?.some'));
  assert.ok(dashboard.includes('expenseHistoryReturned = Boolean(operationalSnapshot.expenses?.some'));

  assert.ok(chart.includes('A zero-value invoice series is not inferred.'));
  assert.ok(chart.includes('A zero-value expense series is not inferred.'));
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
  const projects = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-project-status-report"');
  assert.ok(controls >= 0 && financial > controls && receivables > controls && projects > controls,
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


test('Dashboard Overview shows the source-owned cross-module attention queue before KPIs and preserves unavailable states', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const branchStart = dashboard.indexOf("{view === 'overview' ? (");
  const branchEnd = dashboard.indexOf(") : view === 'performance' ? (", branchStart);
  assert.ok(branchStart >= 0 && branchEnd > branchStart);
  const overview = dashboard.slice(branchStart, branchEnd);
  const priority = overview.indexOf('data-ams-feature-slug="dashboard-priority-exceptions"');
  const kpis = overview.indexOf('data-ams-feature-slug="dashboard-overview"');
  const actions = overview.indexOf('data-ams-feature-slug="dashboard-quick-actions"');
  assert.ok(priority >= 0 && kpis > priority && actions > kpis);
  assert.ok(dashboard.includes('const attentionItemsDataReturned = Array.isArray(data.attentionItems)'));
  assert.ok(dashboard.includes('attentionItems: attentionItemsDataReturned ? data.attentionItems as DashboardAttentionItem[] : previous.attentionItems ?? []'));
  assert.ok(dashboard.includes('attentionItemsDataAvailable: attentionItemsDataReturned ? true : previous.attentionItemsDataAvailable'));
  assert.ok(overview.includes('Priority exception data unavailable'));
  assert.ok(overview.includes('No priority exceptions returned'));
  assert.ok(overview.includes('The interface does not infer that there are no exceptions.'));
  assert.ok(overview.includes('Destination unavailable'));
  assert.ok(overview.includes("destination.startsWith('/admin/') && canOpenDashboardRoute(destination) ? destination : null"));
  assert.ok(overview.includes("destination.startsWith('/admin/') && canOpenDashboardRoute(destination) ? destination : null"), 'Internal drill-downs must preserve valid query parameters and pass the current route-access policy.');
  const kpiEnd = overview.indexOf('<div className="grid gap-3 min-[1100px]:grid-cols-12">', kpis);
  assert.ok(kpiEnd > kpis, 'KPI strip should end before the grouped analysis row.');
  assert.ok(actions > overview.indexOf('data-ams-feature-slug="dashboard-supporting-metrics"'), 'Quick Actions should not interrupt summary analysis.');
  const metricArea = overview.slice(kpis, kpiEnd);
  assert.match(metricArea, /id: 'outstanding'/);
  assert.match(metricArea, /id: 'utilization'/);
  assert.doesNotMatch(metricArea, /id: 'tasks-due'|id: 'overdue'/);
});

test('Dashboard mobile and desktop project register respect the same pagination window', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const mobileStart = dashboard.indexOf('<div className="min-[900px]:hidden divide-y divide-line">');
  const desktopStart = dashboard.indexOf('<div className="hidden min-[900px]:block overflow-x-auto', mobileStart);
  const mobileRegister = dashboard.slice(mobileStart, desktopStart);
  const desktopEnd = dashboard.indexOf('          </div>', desktopStart);
  const desktopRegister = dashboard.slice(desktopStart, desktopEnd);
  assert.ok(mobileStart >= 0 && desktopStart > mobileStart, 'Both responsive register layouts must exist.');
  assert.ok(mobileRegister.includes('pagedDashboardProjects.map((project) => ('), 'Mobile cards must use the current pagination slice.');
  assert.ok(desktopRegister.includes('pagedDashboardProjects.map((project) => ('), 'Desktop table must use the same pagination slice.');
  assert.ok(!mobileRegister.includes('filteredProjects.map((project) => ('), 'Mobile cards must not bypass pagination.');
  assert.ok(dashboard.includes('<AdminTablePagination'));
  assert.ok(dashboard.includes('onPageChange={setDashboardProjectPage}'));
  assert.ok(dashboard.includes('onPageSizeChange={setDashboardProjectPageSize}'));
});

test('Dashboard Overview gates project and time-log drilldowns through the existing route-access policy', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.ok(dashboard.includes("const canOpenProjects = canOpenDashboardRoute('/admin/projects');"));
  assert.ok(overview.includes('actions={canOpenProjects ? ('), 'The project registry header action must follow route access.');
  assert.ok(overview.includes('{canOpenProjects ? <Link to="/admin/projects"'), 'Project empty states must hide unauthorized navigation.');
  assert.ok(overview.includes("{canOpenDashboardRoute('/admin/time-logs') ? <Link to=\"/admin/time-logs\""), 'Time Logs navigation must follow route access.');
  assert.ok(overview.includes('{canOpenProjects && ('), 'Project workspace menu/modal actions must be access-gated.');
  assert.ok(overview.includes('canOpenDashboardRoute(destination)'), 'Exception links must check both internal path and role-aware route access.');
  assert.ok(overviewStart >= 0 && overviewEnd > overviewStart);
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
