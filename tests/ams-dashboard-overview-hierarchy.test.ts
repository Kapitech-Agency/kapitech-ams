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
  const priorityExceptionsStart = overview.indexOf('data-ams-feature-slug="dashboard-priority-exceptions"');

  assert.ok(priorityExceptionsStart >= 0 && priorityExceptionsStart < metricStart, 'Priority exceptions should appear before decision KPIs');
  assert.ok(metricStart >= 0 && actionsStart > metricStart, 'Executive metrics should appear before the quick-action row');
  assert.ok(chartStart > actionsStart, 'The primary analysis should follow KPIs and quick actions');
  assert.ok(projectsStart > chartStart, 'The active project register should follow the analysis row');
  assert.ok(capacityStart > projectsStart, 'Team capacity should remain alongside the primary project workspace');
  assert.ok(supportMetricsStart > capacityStart, 'Secondary indicators should remain below primary work areas');

  const overviewMetrics = overview.slice(metricStart, actionsStart);
  assert.ok(overviewMetrics.includes('className="grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1100px]:grid-cols-4"'), 'Dashboard KPI columns must change only at canonical design-system breakpoints.');
  assert.equal(overviewMetrics.includes('min-[390px]'), false, 'Dashboard KPIs must not introduce a 390px breakpoint.');
  assert.equal(overviewMetrics.includes('min-[760px]'), false, 'Dashboard KPIs must not introduce a 760px breakpoint.');
  assert.doesNotMatch(overviewMetrics, /min-\[1100px\]:col-span-9/, 'KPI cards should not be squeezed by an adjacent action panel');

  const quickActions = overview.slice(actionsStart, chartStart);
  assert.ok(quickActions.includes('min-[600px]:grid-cols-2'));
  assert.ok(quickActions.includes('min-[900px]:grid-cols-3'));
  assert.ok(quickActions.includes('min-[1100px]:grid-cols-5'));
  assert.equal(quickActions.includes('min-[390px]'), false, 'Quick actions must not introduce a 390px breakpoint.');
  assert.equal(quickActions.includes('min-[760px]'), false, 'Quick actions must not introduce a 760px breakpoint.');
  assert.doesNotMatch(quickActions, /label:\s*'New project'/, 'New project already belongs in the page header, so it must not be duplicated');
  const trendPicker = overview.indexOf('<DashboardTrendRangePicker range={range} onChange={setRange} />');
  assert.ok(trendPicker > chartStart && trendPicker < projectsStart,
    'The trend-period control should sit in the chart header before the project register.');

  for (const label of ['Review tasks', 'Log time', 'View invoices', 'View clients', 'View documents']) {
    assert.ok(quickActions.includes("label: '" + label + "'"), 'Missing quick action: ' + label);
  }
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
  assert.match(dashboard, /to=\{canManageProjects \? '\/admin\/projects\?create=1' : '\/admin\/projects'\}/);
  assert.match(dashboard, /\{canManageProjects \? 'New project' : 'Open Projects'\}/);
  assert.match(projects, /const createProjectRequestHandled = React\.useRef\(false\)/);
  assert.match(projects, /searchParams\.get\('create'\) === '1'/);
  assert.match(projects, /next\.delete\('create'\)/);
  assert.match(projects, /if \(canManageProjects\) openNewProject\(\)/);
});


test('Dashboard trend range is selectable in Overview and Analytics without a duplicate legend', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const charts = await read('src/components/charts/DashboardCharts.tsx');

  assert.match(dashboard, /const \[range, setRange\] = useState<RangeKey>\('30D'\)/);
  assert.ok(dashboard.includes("{ value: '30D', label: '30 days' }"));
  assert.ok(dashboard.includes("{ value: 'Q2', label: 'Q2 (Apr–Jun)' }"));
  assert.ok(dashboard.includes("{ value: 'YTD', label: 'Year to date' }"));
  assert.ok(dashboard.includes("{ value: '12M', label: '12 months' }"));
  assert.match(dashboard, /role="group"[\s\S]{0,80}aria-label="Trend period"/);
  assert.match(dashboard, /aria-pressed=\{active\}/);
  assert.match(dashboard, /onClick=\{\(\) => onChange\(option\.value\)\}/);
  assert.match(dashboard, /<DashboardTrendRangePicker range=\{range\} onChange=\{setRange\} \/>/);
  assert.match(dashboard, /<DashboardTrendRangePicker range=\{range\} onChange=\{onRangeChange\} \/>/);
  assert.match(dashboard, /<AnalyticsView snapshot=\{operationalSnapshot\} range=\{range\} onRangeChange=\{setRange\} \/>/);
  assert.equal(dashboard.includes('data-ams-slug="dashboard-finance-chart-legend"'), false,
    'The overview should not duplicate the legend already rendered by TrendChart.');
  assert.ok(charts.includes('<div className="relative min-w-0" role="img" aria-label={ariaLabel}>'),
    'TrendChart should expose its chart with an accessible summary.');
  assert.ok(charts.includes('<span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-accent" />{primaryLabel}</span>'),
    'TrendChart should render its own primary-series legend.');
  assert.ok(charts.includes('{secondaryLabel && <span className="inline-flex items-center gap-2">'),
    'TrendChart should render its own comparison-series legend.');
});


test('Dashboard Performance prioritizes task/project analysis before supporting metrics', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('const PerformanceView: React.FC');
  const end = dashboard.indexOf('const AnalyticsView: React.FC', start);
  assert.ok(start >= 0 && end > start, 'Performance workspace should have a bounded source section');
  const performance = dashboard.slice(start, end);
  const primary = performance.indexOf('data-ams-feature-slug="dashboard-performance-primary"');
  const taskAnalysis = performance.indexOf('title="Task completion"', primary);
  const projectExceptions = performance.indexOf('title="Projects needing attention"', taskAnalysis);
  const weeklyTime = performance.indexOf('title="Tracked time this week"', projectExceptions);
  const supportingMetrics = performance.indexOf('data-ams-feature-slug="dashboard-performance-supporting-metrics"', weeklyTime);
  assert.ok(primary >= 0 && taskAnalysis > primary && projectExceptions > taskAnalysis && weeklyTime > projectExceptions && supportingMetrics > weeklyTime,
    'Task completion and project exceptions should lead, followed by time context and supporting metrics.');
  assert.match(performance, /Other open tasks/);
  assert.match(performance, /status\.count \/ tasks\.length \* 100/);
  assert.match(performance, /date < mondayKey \|\| date > today/);
  assert.match(performance, /Recorded time from \$\{mondayKey\} through \$\{today\}/);
  assert.match(performance, /Open Tasks/);
  assert.match(performance, /Open tasks with a blocked status/);
  assert.match(performance, /const attentionProjects = activeProjects\.filter/);
  assert.match(performance, /attentionProjects\.slice\(0, 8\)/);
  assert.match(performance, /Showing 8 of \{attentionProjects\.length\} projects with attention signals/);
});

test('Dashboard Analytics leads with period-scoped reports before summary metrics', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = dashboard.indexOf('const AnalyticsView: React.FC');
  const end = dashboard.indexOf('export const GlobalExecutiveDashboard', start);
  assert.ok(start >= 0 && end > start, 'Analytics workspace should have a bounded source section');
  const analytics = dashboard.slice(start, end);
  const primary = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-primary"');
  const trend = analytics.indexOf('title="Invoice and expense trend"', primary);
  const periodControl = analytics.indexOf('<DashboardTrendRangePicker range={range} onChange={onRangeChange} />', trend);
  const projectStatus = analytics.indexOf('title="Project status"', trend);
  const supportingMetrics = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-supporting-metrics"', projectStatus);
  assert.ok(primary >= 0 && trend > primary && periodControl > trend && projectStatus > trend && supportingMetrics > projectStatus,
    'Analytics report surfaces and period control should precede supporting summary metrics.');
  assert.ok(analytics.indexOf('slug="dashboard-analytics-kpis"') > supportingMetrics);
  assert.match(analytics, /not a posted profit figure/);
  assert.match(analytics, /Financial trend unavailable/);
});


test('Dashboard Overview prioritizes source-backed exceptions before KPIs without duplicating exception metrics', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const branchStart = dashboard.indexOf("{view === 'overview' ? (");
  const branchEnd = dashboard.indexOf(") : view === 'performance' ? (", branchStart);
  assert.ok(branchStart >= 0 && branchEnd > branchStart);
  const overview = dashboard.slice(branchStart, branchEnd);
  const priority = overview.indexOf('data-ams-feature-slug="dashboard-priority-exceptions"');
  const kpis = overview.indexOf('data-ams-feature-slug="dashboard-overview"');
  const actions = overview.indexOf('data-ams-feature-slug="dashboard-quick-actions"');
  assert.ok(priority >= 0 && kpis > priority && actions > kpis);
  assert.ok(overview.includes('No overdue tasks or project risk flags reported'));
  assert.ok(overview.includes('Priority exception data unavailable'));
  assert.ok(overview.includes('/admin/tasks?taskscope=due'));
  assert.ok(overview.includes('/admin/projects?projects=active'));
  const metricArea = overview.slice(kpis, actions);
  assert.match(metricArea, /id: 'outstanding'/);
  assert.match(metricArea, /id: 'utilization'/);
  assert.doesNotMatch(metricArea, /id: 'tasks-due'|id: 'overdue'/);
});