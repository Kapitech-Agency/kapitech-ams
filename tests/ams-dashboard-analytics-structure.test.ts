import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Dashboard Analytics selects one business report before presenting its work surface', async () => {
  const source = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = source.indexOf('type DashboardAnalyticsReport');
  const end = source.indexOf('export const GlobalExecutiveDashboard', start);
  assert.ok(start >= 0 && end > start, 'AnalyticsView and its report contract should be identifiable');
  const analytics = source.slice(start, end);
  const controls = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-controls"');
  const financial = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-financial-report"');
  assert.ok(controls >= 0 && financial > controls, 'Report and scope controls should precede the active report');
  for (const label of ['Financial movement', 'Receivables', 'Project status']) {
    assert.ok(analytics.includes("label: '" + label + "'"), 'Missing report option: ' + label);
  }
  assert.ok(analytics.includes('aria-label="Analytics report"'));
  assert.ok(analytics.includes('aria-pressed={active}'));
  assert.ok(analytics.includes('setReport(option.value)'));
  assert.ok(analytics.includes('data-ams-feature-slug="dashboard-analytics-receivables-report"'));
  assert.ok(analytics.includes('data-ams-feature-slug="dashboard-analytics-project-status-report"'));
  assert.equal(analytics.includes('dashboard-analytics-kpis'), false, 'Unrelated, mixed-scope KPI strip should not follow the reports');
});

test('Dashboard Analytics financial movement exposes exact values, date windows, and definitions', async () => {
  const source = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const analytics = source.slice(source.indexOf('type DashboardAnalyticsReport'), source.indexOf('export const GlobalExecutiveDashboard'));
  assert.ok(source.includes('startDate: spec.start, endDate: spec.end'), 'Trend buckets need date boundaries for exact-value inspection');
  assert.ok(analytics.includes('aria-label="Exact invoice and expense values by period"'));
  assert.ok(analytics.includes('Selected period total'));
  assert.ok(analytics.includes('Invoices issued · {currency}'));
  assert.ok(analytics.includes('Expenses recorded · {currency}'));
  assert.ok(analytics.includes('Difference · not profit'));
  assert.ok(analytics.includes('Invoice buckets use issue date'));
  assert.ok(analytics.includes('Expense buckets use recorded date'));
  assert.ok(analytics.includes('The difference is an arithmetic comparison, not posted profit'));
  assert.ok(analytics.includes('!financialDataAvailable'));
  assert.ok(analytics.includes('!financialRecordsReturned'));
  assert.ok(analytics.includes('A zero-value trend is not inferred from an empty source'));
});

test('Dashboard Analytics distinguishes balance and status snapshots from period trends', async () => {
  const source = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const analytics = source.slice(source.indexOf('type DashboardAnalyticsReport'), source.indexOf('export const GlobalExecutiveDashboard'));
  assert.ok(analytics.includes('Current invoice balances'));
  assert.ok(analytics.includes('Current project register'));
  assert.ok(analytics.includes('This current snapshot is not filtered by the selected financial trend period'));
  assert.ok(analytics.includes('not trends for the selected financial period'));
  assert.ok(analytics.includes('to="/admin/finance?tab=chart-of-accounts"'));
  assert.ok(analytics.includes('to="/admin/finance?tab=accounts-receivable"'));
  assert.ok(analytics.includes('to="/admin/projects"'));
});
