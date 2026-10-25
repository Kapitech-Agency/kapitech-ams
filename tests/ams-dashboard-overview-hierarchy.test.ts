import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Dashboard overview gives KPIs full width and keeps quick actions compact and distinct', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const performanceStart = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  assert.ok(overviewStart >= 0 && performanceStart > overviewStart, 'Dashboard overview branch should be identifiable');

  const overview = dashboard.slice(overviewStart, performanceStart);
  const metricStart = overview.indexOf('data-ams-feature-slug="dashboard-overview"');
  const actionsStart = overview.indexOf('data-ams-feature-slug="dashboard-quick-actions"');
  const chartStart = overview.indexOf('title="Invoices vs expenses"');
  const projectsStart = overview.indexOf('title="Active projects"');
  const capacityStart = overview.indexOf('title="Team capacity"');
  const supportMetricsStart = overview.indexOf('data-ams-feature-slug="dashboard-supporting-metrics"');
  const overviewMetricsEnd = overview.indexOf('<div className="grid gap-3 min-[1100px]:grid-cols-12">', metricStart);
  const priorityExceptionsStart = overview.indexOf('data-ams-feature-slug="dashboard-priority-exceptions"');
  const reportingScopeStart = overview.indexOf('data-ams-feature-slug="dashboard-overview-reporting-scope"');

  assert.ok(reportingScopeStart >= 0 && reportingScopeStart < priorityExceptionsStart, 'Reporting scope must be visible before exception review.');
  assert.ok(overview.includes('not historical results for this period'));
  assert.ok(overview.includes('active project register covers all dates'));
  assert.ok(priorityExceptionsStart >= 0 && priorityExceptionsStart < metricStart, 'Priority exceptions should appear before decision KPIs');
  assert.ok(metricStart >= 0 && overviewMetricsEnd > metricStart, 'Executive KPI area should be identifiable before primary analysis');
  assert.ok(chartStart > metricStart && chartStart < projectsStart, 'Primary analysis should follow executive KPIs and precede project detail');
  assert.ok(projectsStart > chartStart, 'The active project register should follow the analysis row');
  assert.ok(capacityStart > projectsStart, 'Team capacity should remain alongside the primary project workspace');
  assert.ok(supportMetricsStart > capacityStart, 'Secondary indicators should remain below primary work areas');
  assert.ok(actionsStart > supportMetricsStart, 'Quick actions must follow the grouped operational summaries and supporting metrics.');
  const recentActivityStart = overview.indexOf('data-ams-feature-slug="dashboard-recent-activity"');
  assert.ok(recentActivityStart > actionsStart, 'Recent activity should follow primary summaries and quick actions.');

  const overviewMetrics = overview.slice(metricStart, overviewMetricsEnd);
  assert.ok(overviewMetrics.includes('className="grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1100px]:grid-cols-4"'), 'Dashboard KPI columns must change only at canonical design-system breakpoints.');
  assert.equal(overviewMetrics.includes('min-[390px]'), false, 'Dashboard KPIs must not introduce a 390px breakpoint.');
  assert.equal(overviewMetrics.includes('min-[760px]'), false, 'Dashboard KPIs must not introduce a 760px breakpoint.');
  assert.doesNotMatch(overviewMetrics, /min-\[1100px\]:col-span-9/, 'KPI cards should not be squeezed by an adjacent action panel');

  const quickActions = overview.slice(actionsStart, recentActivityStart);
  assert.ok(quickActions.includes('min-[600px]:grid-cols-2'));
  assert.ok(quickActions.includes('min-[900px]:grid-cols-3'));
  assert.ok(quickActions.includes('min-[1100px]:grid-cols-5'));
  assert.equal(quickActions.includes('min-[390px]'), false, 'Quick actions must not introduce a 390px breakpoint.');
  assert.equal(quickActions.includes('min-[760px]'), false, 'Quick actions must not introduce a 760px breakpoint.');
  assert.doesNotMatch(quickActions, /label:\s*'New project'/, 'New project already belongs in the page header, so it must not be duplicated');
  assert.ok(overview.includes('financialTrendScopeLabel'), 'The invoice/expense chart must describe the single global reporting scope.');

  for (const label of ['Review tasks', 'Log time', 'View invoices', 'View clients', 'View documents']) {
    assert.ok(quickActions.includes("label: '" + label + "'"), 'Missing quick action: ' + label);
  }
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
  assert.ok(dashboard.includes('The dashboard service has not provided a live historical revenue series for this period.'));
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
  assert.ok(overview.includes('/^\\/admin\\/[a-z0-9/_-]+$/i.test(destination)'));
  const kpiEnd = overview.indexOf('<div className="grid gap-3 min-[1100px]:grid-cols-12">', kpis);
  assert.ok(kpiEnd > kpis, 'KPI strip should end before the grouped analysis row.');
  assert.ok(actions > overview.indexOf('data-ams-feature-slug="dashboard-supporting-metrics"'), 'Quick Actions should not interrupt summary analysis.');
  const metricArea = overview.slice(kpis, kpiEnd);
  assert.match(metricArea, /id: 'outstanding'/);
  assert.match(metricArea, /id: 'utilization'/);
  assert.doesNotMatch(metricArea, /id: 'tasks-due'|id: 'overdue'/);
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
