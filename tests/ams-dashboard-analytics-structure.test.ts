import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Dashboard Analytics follows the approved Overview row pattern without nested selector tabs', async () => {
  const source = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = source.indexOf('const AnalyticsView: React.FC');
  const end = source.indexOf('type DashboardCalendarPeriodFilterProps', start);
  assert.ok(start >= 0 && end > start, 'AnalyticsView should be identifiable.');
  const analytics = source.slice(start, end);
  const rowOne = analytics.indexOf('aria-label="Financial movement and receivables"');
  const financial = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-financial-report"');
  const receivables = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-receivables-report"');
  const rowTwo = analytics.indexOf('aria-label="Project status and inquiry pipeline"');
  const projects = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-project-status-report"');
  const inquiry = analytics.indexOf('data-ams-feature-slug="dashboard-analytics-inquiry-pipeline-report"');
  assert.ok(rowOne >= 0 && financial > rowOne && receivables > financial && rowTwo > receivables && projects > rowTwo && inquiry > projects,
    'Analytics cards should follow the two-row Overview composition.');
  assert.match(analytics, /min-\[1100px\]:col-span-7" data-ams-feature-slug="dashboard-analytics-financial-report"/);
  assert.match(analytics, /min-\[1100px\]:col-span-5" data-ams-feature-slug="dashboard-analytics-receivables-report"/);
  assert.match(analytics, /min-\[1100px\]:col-span-5" data-ams-feature-slug="dashboard-analytics-project-status-report"/);
  assert.match(analytics, /min-\[1100px\]:col-span-7" data-ams-feature-slug="dashboard-analytics-inquiry-pipeline-report"/);
  assert.equal(analytics.includes('data-ams-feature-slug="dashboard-analytics-controls"'), false);
  assert.equal(analytics.includes('aria-label="Analytics report"'), false);
  assert.equal(source.includes('DASHBOARD_ANALYTICS_REPORT_OPTIONS'), false);
  assert.equal(analytics.includes('setReport('), false);
  assert.match(analytics, /title="Outstanding receivables"\s+className="h-full ams-overview-panel"/,
    'Outstanding Receivables and Financial Movement must share the same row height.');
  assert.doesNotMatch(styles, /\.ams-overview-card-row\[aria-label="Financial movement and receivables"\] > section\[data-ams-feature-slug="dashboard-analytics-receivables-report"\] \.ams-overview-panel\s*\{\s*height:\s*auto;/,
    'The Receivables card must not be forced to natural height.');
  assert.ok(analytics.includes('<DashboardControl to="/admin/finance?tab=chart-of-accounts"'));
  assert.equal(styles.includes('.ams-dashboard-analytics-report-grid'), false, 'Analytics must not have a custom grid.');
  assert.ok(styles.includes('.ams-dashboard-analytics-workspace > .ams-overview-card-row'));
  assert.ok(analytics.includes('data-ams-feature-slug="dashboard-analytics-inquiry-pipeline-report"'));
  assert.equal(analytics.includes('dashboard-analytics-kpis'), false);
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
  assert.ok(analytics.includes('No issued invoices in selected currency'));
});

test('Dashboard Analytics distinguishes balance and status snapshots from period trends', async () => {
  const source = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const analytics = source.slice(source.indexOf('const AnalyticsView: React.FC'), source.indexOf('type DashboardCalendarPeriodFilterProps'));
  assert.ok(analytics.includes('Current status distribution'));
  assert.ok(analytics.includes('This current snapshot is not filtered by the selected financial trend period'));
  assert.ok(analytics.includes('not trends for the selected financial period'));
  assert.ok(analytics.includes('to="/admin/finance?tab=chart-of-accounts"'));
  assert.ok(analytics.includes('to="/admin/finance?tab=accounts-receivable"'));
  assert.ok(analytics.includes('to="/admin/projects"'));
});


test('Dashboard Analytics reuses the approved Overview empty-state and unavailable-state components', async () => {
  const source = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const styles = await read('src/components/admin/GlobalExecutiveDashboard.css');
  const start = source.indexOf('const AnalyticsView: React.FC');
  const end = source.indexOf('type DashboardCalendarPeriodFilterProps', start);
  assert.ok(start >= 0 && end > start, 'AnalyticsView should be identifiable.');
  const analytics = source.slice(start, end);

  assert.ok((analytics.match(/<DashboardEmptyState\b/g) || []).length >= 8,
    'No-record conditions should reuse DashboardEmptyState, which is already used in the approved Overview.');
  assert.ok((analytics.match(/<DashboardUnavailable\b[\s\S]*?\/>/g) || []).every((tag) => /\bcompact\b/.test(tag)),
    'Loading or unavailable sources should use the compact status-row presentation from Overview.');
  assert.doesNotMatch(analytics, /rounded-control border border-line bg-bg px-4 py-5/,
    'Avoid one-off bordered empty boxes in Analytics.');
  assert.doesNotMatch(analytics, /flex min-h-32 flex-col items-center justify-center rounded-control border border-line bg-panel/,
    'Avoid a custom oversized centered empty state for the inquiry trend.');
  assert.match(analytics, /eyebrow="FINANCIAL MOVEMENT"/);
  assert.match(analytics, /eyebrow="RECEIVABLES"/);
  assert.match(analytics, /eyebrow="PROJECT STATUS"/);
  assert.match(analytics, /eyebrow="INQUIRY PIPELINE"/);
  assert.match(analytics, /eyebrow="REQUESTED SERVICES"/);
  assert.ok(styles.includes('.ams-dashboard-empty--compact'),
    'Analytics relies on the existing Overview empty-state styles rather than a new Analytics style.');
});
