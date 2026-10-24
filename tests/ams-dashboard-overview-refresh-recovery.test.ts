import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Dashboard Overview exposes an accessible manual refresh action and keeps last values visible', async () => {
  const source = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.match(source, /aria-label="Refresh dashboard data"/);
  assert.match(source, /onClick=\{\(\) => setRefreshRequest\(\(current\) => current \+ 1\)\}/);
  assert.match(source, /disabled=\{isRefreshing\}/);
  assert.match(source, /Refreshing dashboard sources\. Previously loaded values remain visible\./);
  assert.match(source, /data-ams-feature-slug="dashboard-refresh-warning"/);
  assert.match(source, /setRefreshNotice\(failedSources\.length/);
});

test('Dashboard refresh retains prior source data when an individual endpoint fails', async () => {
  const source = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.match(source, /projects: projects \?\? previous\.projects/);
  assert.match(source, /tasks: tasks \?\? previous\.tasks/);
  assert.match(source, /timeLogs: timeLogs \?\? previous\.timeLogs/);
  assert.match(source, /invoices: invoices \?\? previous\.invoices/);
  assert.match(source, /expenses: expenses \?\? previous\.expenses/);
  assert.match(source, /setDashboardOverview\(\(previous\) => \(\{ \.\.\.previous, loading: false \}\)\)/);
  assert.match(source, /recentActivity: activityDataReturned \? data\.recentActivity as DashboardRecentActivity\[\] : previous\.recentActivity \?\? \[\]/);
  assert.match(source, /recentActivityDataAvailable: activityDataReturned \? true : previous\.recentActivityDataAvailable/);
  assert.match(source, /unavailable sources are not treated as zero/);
  for (const sourceCall of [
    'api.dashboard.getOverview()',
    'api.projects.getAll()',
    'api.tasks.getAll()',
    'api.timeLogs.getAll()',
    'api.finance.getInvoices()',
    'api.finance.getExpenses()',
  ]) assert.ok(source.includes(sourceCall), 'Existing Dashboard source removed: ' + sourceCall);
});
