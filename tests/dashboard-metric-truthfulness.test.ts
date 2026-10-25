import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const dashboard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/GlobalExecutiveDashboard.tsx'), 'utf8');

test('Dashboard priority exceptions distinguish the source-backed queue, genuine empty, and unavailable data', () => {
  assert.ok(dashboard.includes('data-ams-feature-slug="dashboard-priority-exceptions"'));
  assert.ok(dashboard.includes('attentionItemsDataReturned = Array.isArray(data.attentionItems)'));
  assert.ok(dashboard.includes('attentionItemsDataAvailable: attentionItemsDataReturned ? true : previous.attentionItemsDataAvailable'));
  assert.ok(dashboard.includes('No exceptions returned by the Dashboard service'));
  assert.ok(dashboard.includes('Cross-module exception data unavailable'));
  assert.ok(dashboard.includes('This is not interpreted as a clean operational state.'));
  assert.ok(dashboard.includes("const safeDestination = destination.startsWith('/admin/') && canOpenDashboardRoute(destination) ? destination : null;"));
});

test('Dashboard Overview groups active canonical projects for service and delivery commitments without duplicating Project Registry', () => {
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.ok(dashboard.includes("const activeProjectRows = rawProjectRows.filter((project: any) => !isFinishedWork(project.status) && !isFinishedWork(project.health))"));
  assert.ok(dashboard.includes("const serviceLineSummaries = useMemo(() => serviceLineConfiguration.map((line) =>"));
  assert.ok(dashboard.includes("const upcomingCommitments = useMemo<DashboardCommitment[]>(() =>"));
  assert.ok(dashboard.includes("for (const project of activeProjectRows)"));
  assert.ok(overview.includes('Upcoming milestones & delivery deadlines'));
  assert.ok(overview.includes('Creative & IT workstreams'));
  assert.ok(overview.includes('Other / Unclassified'));
  assert.equal(overview.includes('pagedDashboardProjects'), false);
  assert.equal(overview.includes('progressPercent'), false);
  assert.equal(overview.includes('project.budget'), false);
});

test('Dashboard next-seven-day delivery indicator counts all commitments, not only the visible preview rows', () => {
  assert.ok(dashboard.includes('const allUpcomingCommitments = useMemo<DashboardCommitment[]>(() =>'));
  assert.ok(dashboard.includes('const upcomingCommitments = allUpcomingCommitments.slice(0, 8)'));
  assert.ok(dashboard.includes('const nextSevenDayCommitmentCount = allUpcomingCommitments.filter((item) => item.dueDate >= currentDayKey && item.dueDate <= nextSevenDaysKey).length'));
  assert.doesNotMatch(dashboard, /const nextSevenDayCommitmentCount = upcomingCommitments\.filter/);
  assert.ok(dashboard.includes('Projects with overdue delivery'));
});

test('Dashboard cash control uses canonical issued-invoice payment rows, never monthly revenue', () => {
  const financeStart = dashboard.indexOf('data-ams-feature-slug="dashboard-finance-control"');
  const financeEnd = dashboard.indexOf('data-ams-feature-slug="dashboard-workspace-shortcuts"', financeStart);
  assert.ok(financeStart >= 0 && financeEnd > financeStart);
  const finance = dashboard.slice(financeStart, financeEnd);
  const cashStart = dashboard.indexOf('const liveCashCollected = operationalSnapshot.invoices === null ? null : operationalSnapshot.invoices.reduce');
  const outstandingStart = dashboard.indexOf('const liveOutstanding = operationalSnapshot.invoices === null ? null : operationalSnapshot.invoices.reduce', cashStart);
  assert.ok(cashStart >= 0 && outstandingStart > cashStart);
  const cashSource = dashboard.slice(cashStart, outstandingStart);
  assert.ok(cashSource.includes('isIssuedInvoice(invoice)'));
  assert.ok(cashSource.includes('getPaymentRows(invoice)'));
  assert.ok(cashSource.includes('currentMonthKey'));
  assert.ok(finance.includes('Cash received this month'));
  assert.ok(finance.includes('{cashValueAvailable && liveCashCollected !== null ? formatLiveMoney(liveCashCollected, financeCurrency) : \'—\'}'));
  assert.ok(finance.includes('Payments recorded against issued invoices in the current month.'));
  assert.doesNotMatch(finance, /revenueThisMonth|cashCollectedMetric/, 'Revenue and the legacy API cash alias must not populate cash received.');
});

test('Dashboard Analytics uses issued invoice rules and excludes invalid expense states from trends', () => {
  const analyticsStart = dashboard.indexOf('const AnalyticsView:');
  const analyticsEnd = dashboard.indexOf('export const GlobalExecutiveDashboard', analyticsStart);
  const analytics = dashboard.slice(analyticsStart, analyticsEnd);
  const trendStart = dashboard.indexOf('const aggregateFinancialTrend');
  const trendEnd = dashboard.indexOf('const buildRecentFinancialTrend', trendStart);
  const trend = dashboard.slice(trendStart, trendEnd);
  assert.ok(trend.includes('dateKey(getInvoiceDate(invoice))'));
  assert.ok(trend.includes('!isIssuedInvoice(invoice)'));
  assert.ok(trend.includes('!isDashboardExpenseEligible(expense)'));
  assert.ok(dashboard.includes("return !['voided', 'cancelled', 'canceled', 'deleted'].includes(status)"));
  assert.ok(analytics.includes('const inCurrencyIssuedInvoices = inCurrencyInvoices.filter(isIssuedInvoice)'));
  assert.ok(analytics.includes('const inCurrencyExpenses = inCurrencyExpenseRows.filter(isDashboardExpenseEligible)'));
  assert.ok(analytics.includes('financialRecordsReturned = inCurrencyIssuedInvoices.length > 0 || inCurrencyExpenses.length > 0'));
});

test('Dashboard reuses canonical Finance invoice, issue-date, and payment helpers', () => {
  assert.ok(dashboard.includes("import { getInvoiceDate, getInvoiceOutstanding, getPaymentRows, isIssuedInvoice } from '../../lib/financeWorkbook';"));
  const trendStart = dashboard.indexOf('const aggregateFinancialTrend');
  const trendEnd = dashboard.indexOf('const buildRecentFinancialTrend', trendStart);
  const trend = dashboard.slice(trendStart, trendEnd);
  const currentCash = dashboard.slice(dashboard.indexOf('const liveCashCollected'), dashboard.indexOf('const liveOutstanding'));
  const currentOutstanding = dashboard.slice(dashboard.indexOf('const liveOutstanding'), dashboard.indexOf('const liveMonthlyExpenses'));
  const analyticsStart = dashboard.indexOf('const receivableInvoices = inCurrencyIssuedInvoices;');
  const analyticsEnd = dashboard.indexOf('const activeProjects =', analyticsStart);
  const analytics = dashboard.slice(analyticsStart, analyticsEnd);
  assert.ok(trend.includes('getInvoiceDate(invoice)') && trend.includes('isIssuedInvoice(invoice)'));
  assert.ok(currentCash.includes('getPaymentRows(invoice)') && currentCash.includes('isIssuedInvoice(invoice)'));
  assert.ok(currentOutstanding.includes('getInvoiceOutstanding(invoice)') && currentOutstanding.includes('isIssuedInvoice(invoice)'));
  assert.ok(dashboard.includes('const inCurrencyIssuedInvoices = inCurrencyInvoices.filter(isIssuedInvoice)'));
  assert.ok(analytics.includes('getInvoiceOutstanding(invoice)'));
  assert.doesNotMatch(currentOutstanding, /const balance = invoice\.balanceDue/);
  assert.doesNotMatch(analytics, /const paid = Number\(invoice\.amountPaid/);
});

test('Dashboard Analytics does not turn currency-mismatched or quotation-only records into zero financial trends', () => {
  const analyticsStart = dashboard.indexOf('const AnalyticsView:');
  const analyticsEnd = dashboard.indexOf('export const GlobalExecutiveDashboard', analyticsStart);
  const analytics = dashboard.slice(analyticsStart, analyticsEnd);
  assert.ok(analytics.includes("const inCurrencyInvoices = invoiceRows.filter((row) => String(row.currency || 'IDR').toUpperCase() === currency)"));
  assert.ok(analytics.includes('const inCurrencyIssuedInvoices = inCurrencyInvoices.filter(isIssuedInvoice)'));
  assert.ok(analytics.includes('const inCurrencyExpenseRows = expenseRows.filter((row) => String(row.currency || \'IDR\').toUpperCase() === currency)'));
  assert.ok(analytics.includes('const inCurrencyExpenses = inCurrencyExpenseRows.filter(isDashboardExpenseEligible)'));
  assert.ok(analytics.includes('const selectedCurrencyFinancialRowsReturned = inCurrencyInvoices.length > 0 || inCurrencyExpenseRows.length > 0'));
  assert.ok(analytics.includes('const financialRecordsReturned = inCurrencyIssuedInvoices.length > 0 || inCurrencyExpenses.length > 0'));
  assert.ok(analytics.includes('No usable financial records in selected currency'));
  assert.ok(analytics.includes('A zero-value trend is not inferred from another currency.'));
  assert.ok(analytics.includes('A zero-value trend is not inferred from an empty source.'));
});

test('Dashboard work indicators and Finance summaries use their owning route policy', () => {
  const primitives = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminModulePrimitives.tsx'), 'utf8');
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.ok(dashboard.includes('const canOpenDashboardRoute = (destination: string) =>'));
  assert.ok(dashboard.includes('return canAccessAmsRoute(currentNavigationRole, target.pathname, target.search)'));
  assert.ok(dashboard.includes("const taskKpiRoute = canOpenTasks ? '/admin/tasks' : ''"));
  assert.ok(dashboard.includes('href: taskKpiRoute || undefined'));
  assert.ok(dashboard.includes("href: canOpenTasks ? '/admin/tasks?taskscope=due' : undefined"));
  assert.ok(overview.includes('Projects in delivery'));
  assert.ok(overview.includes('Open tasks'));
  assert.ok(overview.includes('Tasks in review'));
  assert.ok(overview.includes('canOpenInvoiceRegister ? ('));
  assert.ok(overview.includes('canOpenExpenseRegister ? ('));
  assert.ok(primitives.includes('href?: string;'));
  assert.ok(primitives.includes('linkLabel?: string;'));
  assert.ok(primitives.includes('to={href}') && primitives.includes('aria-label={linkLabel ||'));
});

test('Dashboard task, project and Finance panels distinguish unavailable sources from empty records', () => {
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.ok(overview.includes('Task queue unavailable'));
  assert.ok(overview.includes('No task records returned'));
  assert.ok(overview.includes('Workstream data unavailable'));
  assert.ok(overview.includes('No project records returned'));
  assert.ok(overview.includes('Delivery schedule unavailable'));
  assert.ok(overview.includes('Invoice/payment source unavailable.'));
  assert.ok(overview.includes('Expense source unavailable.'));
  assert.ok(overview.includes('No eligible expense records are available to confirm a monthly total.'));
});

test('Dashboard Overview does not duplicate unverified project progress or budget metrics', () => {
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.ok(dashboard.includes("const serviceLineConfiguration = ["));
  assert.ok(dashboard.includes("label: 'Other / Unclassified'"));
  assert.ok(dashboard.includes("const upcomingCommitments = useMemo<DashboardCommitment[]>(() =>"));
  assert.ok(dashboard.includes("project.targetEndDate || project.endDate || project.dueDate || project.deadline"));
  assert.equal(overview.includes('progressPercent'), false, 'Overview should not invent or duplicate a project progress field.');
  assert.equal(overview.includes('project.budget'), false, 'Budget belongs to Project/Finance workspaces, not the delivery workboard.');
  assert.equal(overview.includes('Dashboard project details'), false);
});

test('invalid Dashboard money values remain unavailable instead of being displayed as zero', () => {
  assert.match(
    dashboard,
    /const formatLiveMoney = \(value: number, currency: string\) => \{\s*if \(!Number\.isFinite\(value\)\) return '—';\s*return new Intl\.NumberFormat\('en-US', \{ style: 'currency', currency: currency \|\| 'IDR', maximumFractionDigits: 0 \}\)\.format\(value\);\s*\};/
  );
  assert.doesNotMatch(dashboard, /Number\.isFinite\(value\) \? value : 0/);
});
