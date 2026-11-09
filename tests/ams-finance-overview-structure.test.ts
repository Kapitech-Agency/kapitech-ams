import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Finance Executive Summary separates selected-period measures from current receivable balances', async () => {
  const source = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const start = source.indexOf('const renderSummary = (dashboard: boolean) =>');
  const end = source.indexOf('const openVendorContractEditor', start);
  assert.ok(start >= 0 && end > start, 'Finance summary renderer must remain bounded');
  const summary = source.slice(start, end);
  assert.ok(summary.includes("data-ams-feature-slug={dashboard ? 'finance-dashboard-workspace' : 'finance-executive-summary-workspace'}"));
  assert.ok(summary.includes('Reporting period: {dashboardPeriodLabel}'));
  assert.ok(summary.includes('expensesRecordedInPeriod'));
  assert.ok(summary.includes('getInvoiceDate(invoice) >= dashboardRange.startDate && getInvoiceDate(invoice) <= dashboardRange.endDate'));
  assert.ok(summary.includes("value: !dashboardRange || (invoiceSourceError && idrInvoices.length === 0) ? 'Unavailable' : formatMoney(billedInPeriod)"));
  assert.ok(summary.includes('clientPaymentsInPeriod'));
  assert.ok(summary.includes('getPaymentRows(invoice)'));
  assert.ok(summary.includes("const expensesInPeriod = dashboardRange"));
  assert.ok(summary.includes("id: 'receivable-snapshot'"));
  assert.ok(summary.includes("label: 'Current outstanding receivables'"));
  assert.ok(summary.includes('Current IDR invoice balances; this is a snapshot, not a period movement.'));
  assert.ok(summary.includes('IDR issued invoices by invoice date for the selected period.'));
  assert.ok(summary.includes('IDR expense records by expense date for the selected period; not posted expense-account activity.'));
});

test('Finance Executive Summary highlights overdue invoices using the existing Finance invoice status rules', async () => {
  const source = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const summary = source.slice(source.indexOf('const renderSummary = (dashboard: boolean) =>'), source.indexOf('const openVendorContractEditor'));
  assert.ok(source.includes("import { getEffectiveInvoiceStatus, normalizeFinanceExpense, normalizeFinanceInvoice } from '../../lib/financeStore'"));
  assert.ok(summary.includes("getEffectiveInvoiceStatus(invoice) === 'overdue' && getInvoiceOutstanding(invoice) > 0"));
  assert.ok(summary.includes('title="Items needing attention · overdue invoices"'));
  assert.ok(summary.includes('This exception queue is independent of the selected invoice issue-date period.'));
  const periodContext = summary.indexOf('featureSlug="finance-executive-summary-period"');
  const exceptionQueue = summary.indexOf('title="Items needing attention · overdue invoices"');
  const metricStrip = summary.indexOf('<AdminMetricStrip metrics={metrics}');
  const figureDefinitions = summary.indexOf('data-ams-feature-slug="finance-executive-summary-definitions"');
  const recentRegister = summary.indexOf('title="Recent invoice register"');
  assert.ok(periodContext >= 0 && metricStrip > periodContext && exceptionQueue > metricStrip && figureDefinitions > exceptionQueue && recentRegister > figureDefinitions,
    'Executive Summary should lead with period metrics before the exception queue, definitions, and recent invoice register.');
  assert.ok(summary.includes("formatMoney(getInvoiceOutstanding(invoice), invoice.currency)"));
  assert.ok(summary.includes('const overdueInvoiceRows: TableRow[] = overdueInvoices.map((invoice) => ({'), 'The complete overdue queue should be paginated by FinanceDataTable instead of silently truncating at a fixed row count.');
  assert.ok(summary.includes("navigate('/admin/finance?tab=accounts-receivable')"));
  assert.ok(summary.includes('Invoice source refresh failed. Overdue rows use the last loaded invoice records and may be stale.'));
  assert.ok(summary.includes('Overdue invoice exceptions unavailable because the invoice source did not load.'));
  assert.ok(summary.includes('No overdue invoice balances in the current invoice source.'));
});

test('Finance Executive Summary keeps cash movement and posted profit semantically separate', async () => {
  const source = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const summary = source.slice(source.indexOf('const renderSummary = (dashboard: boolean) =>'), source.indexOf('const openVendorContractEditor'));
  assert.ok(summary.includes('Recorded cash movement is shown in Dashboard comparison.'));
  assert.ok(summary.includes('not the same as client payments'));
  assert.ok(summary.includes('not a substitute for posted General Ledger profit or bank reconciliation'));
  assert.ok(summary.includes('title="Selected vs previous period"'));
  assert.ok(summary.includes('Net movement is a proxy and is not a reconciled closing cash balance.'));
});

test('Shared trend preserves the empty plot without representing missing data as zero', async () => {
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { TrendChart } = await import('../src/components/charts/DashboardCharts');
  const props = {
    primaryLabel: 'Recorded payments',
    ariaLabel: 'Recorded payments by date',
    data: [{ label: 'Jan', primary: 0 }, { label: 'Feb', primary: 0 }],
  };

  for (const data of [[], props.data]) {
    const empty = renderToStaticMarkup(createElement(TrendChart, { ...props, data, emptyState: 'No records' }));
    assert.match(empty, /<svg/);
    assert.match(empty, /<line/);
    assert.match(empty, /No records/);
    assert.doesNotMatch(empty, /ams-trend-chart__primary-line|<table/);
  }

  const recordedZero = renderToStaticMarkup(createElement(TrendChart, props));
  assert.match(recordedZero, /ams-trend-chart__primary-line/);
  assert.match(recordedZero, /<table/);
});
