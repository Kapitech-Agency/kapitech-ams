import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Dashboard Analytics presents supported reports together without nested selector tabs', async () => {
  const source = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const start = source.indexOf('const AnalyticsView: React.FC');
  const end = source.indexOf('type DashboardCalendarPeriodFilterProps', start);
  assert.ok(start >= 0 && end > start, 'AnalyticsView should be identifiable');
  const analytics = source.slice(start, end);
  const grid = analytics.indexOf('className="ams-dashboard-analytics-report-grid"');
  const financial = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-financial-report"');
  const receivables = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-receivables-report"');
  const projects = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-project-status-report"');
  const inquiry = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-inquiry-pipeline-report"');
  assert.ok(grid >= 0 && financial > grid && receivables > financial && projects > receivables && inquiry > projects,
    'Analytics reports should use the Overview-inspired report order.');
  assert.equal(analytics.includes('data-ams-feature-slug="dashboard-analytics-controls"'), false);
  assert.equal(analytics.includes('aria-label="Analytics report"'), false);
  assert.equal(source.includes('DASHBOARD_ANALYTICS_REPORT_OPTIONS'), false);
  assert.equal(analytics.includes('setReport('), false);
  assert.ok(analytics.includes('ams-dashboard-analytics-card--receivables'));
  assert.ok(analytics.includes('ams-dashboard-analytics-card--projects'));
  assert.ok(analytics.includes(`      {canOpenInbox ? (\n        <section className="ams-dashboard-analytics-card ams-dashboard-analytics-card--inquiry"`),
    'Inquiry Pipeline must remain gated by current Inbox access.');
  assert.equal(analytics.includes('dashboard-analytics-kpis'), false, 'Mixed-scope KPI strip must not be introduced.');
});

test('Dashboard Analytics financial movement exposes exact values, date windows, and definitions', async () => {
  const source = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const analytics = source.slice(source.indexOf('const AnalyticsView: React.FC'), source.indexOf('type DashboardCalendarPeriodFilterProps'));
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
  assert.ok(analytics.includes('inCurrencyIssuedInvoices.length === 0'));
  assert.ok(analytics.includes('inCurrencyExpenses.length === 0'));
  assert.ok(analytics.includes('A zero-value invoice series is not inferred.'));
  assert.ok(analytics.includes('A zero-value expense series is not inferred.'));
  assert.ok(analytics.includes('!financialRecordsReturned'));
  assert.ok(analytics.includes('A zero-value trend is not inferred from an empty source'));
  assert.ok(analytics.includes('const inCurrencyExpenseRows = expenseRows.filter((row) => String(row.currency || \'IDR\').toUpperCase() === currency)'));
  assert.ok(analytics.includes('const inCurrencyExpenses = inCurrencyExpenseRows.filter(isDashboardExpenseEligible)'));
  assert.ok(analytics.includes('const financialRecordsReturned = inCurrencyIssuedInvoices.length > 0 || inCurrencyExpenses.length > 0'));
  assert.ok(analytics.includes('const selectedCurrencyFinancialRowsReturned = inCurrencyInvoices.length > 0 || inCurrencyExpenseRows.length > 0'));
  assert.ok(analytics.includes('const financialSourceRecordsReturned = invoiceRows.length > 0 || expenseRows.length > 0'));
  assert.ok(analytics.includes('No financial records in selected currency'));
  assert.ok(analytics.includes('selectedCurrencyFinancialRowsReturned'));
  assert.ok(analytics.includes('inCurrencyExpenses.length === 0'));
  assert.ok(analytics.includes('const receivableInvoices = inCurrencyIssuedInvoices'));
  assert.ok(analytics.includes('const receivables = receivableInvoices.reduce((sum, invoice) => sum + getInvoiceOutstanding(invoice), 0)'));
  assert.ok(analytics.includes('const openInvoiceCount = receivableInvoices.filter((invoice) => getInvoiceOutstanding(invoice) > 0).length'));
  assert.ok(analytics.includes('No issued invoice records in selected currency'));
});

test('Dashboard Analytics distinguishes balance and status snapshots from period trends', async () => {
  const source = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const analytics = source.slice(source.indexOf('const AnalyticsView: React.FC'), source.indexOf('type DashboardCalendarPeriodFilterProps'));
  assert.ok(analytics.includes('Current status distribution'));
  assert.ok(analytics.includes('This current snapshot is not filtered by the selected financial trend period'));
  assert.ok(analytics.includes('not trends for the selected financial period'));
  assert.ok(analytics.includes('This current snapshot is not filtered by the selected financial trend period'));
  assert.ok(analytics.includes('not trends for the selected financial period'));
  assert.ok(analytics.includes('to="/admin/finance?tab=chart-of-accounts"'));
  assert.ok(analytics.includes('to="/admin/finance?tab=accounts-receivable"'));
  assert.ok(analytics.includes('to="/admin/projects"'));
});
