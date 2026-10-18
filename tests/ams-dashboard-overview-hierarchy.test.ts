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

  assert.ok(metricStart >= 0 && actionsStart > metricStart, 'Executive metrics should appear before the quick-action row');
  assert.ok(chartStart > actionsStart, 'The primary analysis should follow KPIs and quick actions');
  assert.ok(projectsStart > chartStart, 'The active project register should follow the analysis row');
  assert.ok(capacityStart > projectsStart, 'Team capacity should remain alongside the primary project workspace');
  assert.ok(supportMetricsStart > capacityStart, 'Secondary indicators should remain below primary work areas');

  const overviewMetrics = overview.slice(metricStart, actionsStart);
  assert.ok(overviewMetrics.includes('className="grid-cols-1 min-[390px]:grid-cols-2 min-[760px]:grid-cols-4"'));
  assert.doesNotMatch(overviewMetrics, /min-\[1100px\]:col-span-9/, 'KPI cards should not be squeezed by an adjacent action panel');

  const quickActions = overview.slice(actionsStart, chartStart);
  assert.ok(quickActions.includes('min-[390px]:grid-cols-2'));
  assert.ok(quickActions.includes('min-[760px]:grid-cols-3'));
  assert.ok(quickActions.includes('min-[900px]:grid-cols-4'));
  assert.ok(quickActions.includes('min-[1100px]:grid-cols-5'));
  assert.doesNotMatch(quickActions, /label:\s*'New project'/, 'New project already belongs in the page header, so it must not be duplicated');
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
