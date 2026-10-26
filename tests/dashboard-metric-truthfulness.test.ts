import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const dashboard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/GlobalExecutiveDashboard.tsx'), 'utf8');


test('Dashboard priority exceptions distinguish source-backed records, empty data and unavailable data', () => {
  assert.ok(dashboard.includes('data-ams-feature-slug="dashboard-priority-exceptions"'));
  assert.ok(dashboard.includes('attentionItemsDataReturned = Array.isArray(data.attentionItems)'));
  assert.ok(dashboard.includes('attentionItemsDataAvailable: attentionItemsDataReturned ? true : previous.attentionItemsDataAvailable'));
  assert.ok(dashboard.includes('No cross-module exceptions returned'));
  assert.ok(dashboard.includes('Exception data unavailable'));
  assert.ok(dashboard.includes("dashboardOverview.loading ? 'Loading cross-module exceptions' : 'Exception data unavailable'"));
  assert.ok(dashboard.includes("const safeDestination = candidates.find((candidate) => candidate.startsWith('/admin/') && canOpenDashboardRoute(candidate)) || null;"));
});


test('Dashboard Overview groups canonical project and service-line data without duplicating Project Registry', () => {
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.ok(dashboard.includes("const activeProjectRows = rawProjectRows.filter((project: any) => !isFinishedWork(project.status) && !isFinishedWork(project.health))"));
  assert.ok(dashboard.includes("const serviceLineSummaries = useMemo(() => serviceLineConfiguration.map((line) =>"));
  assert.ok(dashboard.includes("const allUpcomingCommitments = useMemo<DashboardCommitment[]>(() =>"));
  assert.ok(dashboard.includes("const upcomingCommitments = allUpcomingCommitments.filter((item) => {"));
  assert.ok(dashboard.includes("for (const project of activeProjectRows)"));
  assert.ok(overview.includes('Upcoming deadlines'));
  assert.ok(overview.includes('Creative & IT workload'));
  assert.ok(dashboard.includes("label: 'Other / Unclassified'"));
  assert.ok(overview.includes('data-ams-feature-slug="dashboard-project-portfolio"'));
  assert.ok(overview.includes('data-ams-feature-slug="dashboard-project-progress"'));
  assert.equal(overview.includes('pagedDashboardProjects'), false);
  assert.equal(overview.includes('project.budget'), false);
  assert.ok(overview.includes('getDashboardSavedProgress(project)'));
  assert.ok(overview.includes('Progress not recorded'));
});


test('Dashboard deadline distribution counts all source commitments rather than only the visible preview', () => {
  assert.ok(dashboard.includes('const allUpcomingCommitments = useMemo<DashboardCommitment[]>(() =>'));
  assert.ok(dashboard.includes('const upcomingCommitments = allUpcomingCommitments.filter((item) => {'));
  assert.ok(dashboard.includes("if (overviewDeadlineFilter === 'overdue') return item.dueDate < currentDayKey"));
  assert.ok(dashboard.includes("if (overviewDeadlineFilter === 'next7') return item.dueDate >= currentDayKey && item.dueDate <= nextSevenDaysKey"));
  assert.ok(dashboard.includes("if (overviewDeadlineFilter === 'days8to30') return item.dueDate > nextSevenDaysKey && item.dueDate <= nextThirtyDaysKey"));
  assert.ok(dashboard.includes('const nextSevenDayCommitmentCount = allUpcomingCommitments.filter((item) => item.dueDate >= currentDayKey && item.dueDate <= nextSevenDaysKey).length'));
  assert.doesNotMatch(dashboard, /const nextSevenDayCommitmentCount = upcomingCommitments\.filter/);
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const deadlineStart = overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  const teamStart = overview.indexOf('data-ams-feature-slug="dashboard-team-workload"', deadlineStart);
  assert.ok(deadlineStart >= 0 && teamStart > deadlineStart);
  const deadlines = overview.slice(deadlineStart, teamStart);
  assert.ok(deadlines.includes('Today–7 days'));
  assert.ok(deadlines.includes('Days 8–30'));
  assert.ok(deadlines.includes('overdueHorizonCount / commitmentHorizonTotal'));
});


test('Dashboard Finance card uses canonical invoice payments for selected-period cash received, never revenue aliases', () => {
  const financeStart = dashboard.indexOf('data-ams-feature-slug="dashboard-finance-overview"');
  const financeEnd = dashboard.indexOf('data-ams-feature-slug="dashboard-project-portfolio"', financeStart);
  assert.ok(financeStart >= 0 && financeEnd > financeStart);
  const finance = dashboard.slice(financeStart, financeEnd);
  const movementStart = finance.indexOf('data-ams-feature-slug="dashboard-finance-movement"');
  assert.ok(movementStart > 0, 'Cash/expense mini-visuals should be nested inside the primary Finance card.');
  assert.equal(dashboard.includes('data-ams-feature-slug="dashboard-money-movement"'), false,
    'Money movement should not create a separate full-width row.');
  const cashStart = dashboard.indexOf('const livePeriodCashCollected = operationalSnapshot.invoices === null ? null : operationalSnapshot.invoices.reduce');
  const outstandingStart = dashboard.indexOf('const liveOutstanding = operationalSnapshot.invoices === null ? null : operationalSnapshot.invoices.reduce', cashStart);
  assert.ok(cashStart >= 0 && outstandingStart > cashStart);
  const cashSource = dashboard.slice(cashStart, outstandingStart);
  assert.ok(cashSource.includes('isIssuedInvoice(invoice)'));
  assert.ok(cashSource.includes('getPaymentRows(invoice)'));
  assert.ok(cashSource.includes('matchesOverviewFinancialPeriod(payment.date)'));
  assert.ok(finance.includes('Cash received'));
  assert.ok(finance.includes('cashValueAvailable && livePeriodCashCollected !== null ? formatLiveMoney(livePeriodCashCollected, financeCurrency) : \'—\''));
  assert.ok(finance.includes('Outstanding receivables'));
  assert.ok(finance.includes('Expenses recorded'));
  assert.ok(finance.includes('livePeriodExpenses !== null ? formatLiveMoney(livePeriodExpenses, financeCurrency)'));
  assert.doesNotMatch(finance, /revenueThisMonth|cashCollectedMetric/);
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
  const cashStart = dashboard.indexOf('const livePeriodCashCollected');
  const outstandingStart = dashboard.indexOf('const liveOutstanding', cashStart);
  const expensesStart = dashboard.indexOf('const livePeriodExpenses', outstandingStart);
  const currentCash = dashboard.slice(cashStart, outstandingStart);
  const currentOutstanding = dashboard.slice(outstandingStart, expensesStart);
  const analyticsStart = dashboard.indexOf('const receivableInvoices = inCurrencyIssuedInvoices;');
  const analyticsEnd = dashboard.indexOf('const activeProjects =', analyticsStart);
  const analytics = dashboard.slice(analyticsStart, analyticsEnd);
  assert.ok(trend.includes('getInvoiceDate(invoice)') && trend.includes('isIssuedInvoice(invoice)'));
  assert.ok(currentCash.includes('getPaymentRows(invoice)') && currentCash.includes('isIssuedInvoice(invoice)'));
  assert.ok(currentCash.includes('matchesOverviewFinancialPeriod(payment.date)'));
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


test('Dashboard work and Finance cards use their owning route-access policy', () => {
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.ok(dashboard.includes('const canOpenDashboardRoute = (destination: string) =>'));
  assert.ok(dashboard.includes('return canAccessAmsRoute(currentNavigationRole, target.pathname, target.search)'));
  assert.ok(dashboard.includes("const canOpenTasks = canOpenDashboardRoute('/admin/tasks')"));
  assert.ok(dashboard.includes("const canOpenInvoiceRegister = canOpenDashboardRoute('/admin/finance?tab=accounts-receivable')"));
  assert.ok(dashboard.includes("const canOpenExpenseRegister = canOpenDashboardRoute('/admin/finance?tab=expenses')"));
  assert.ok(overview.includes('disabled={!canOpenTasks}'));
  assert.ok(overview.includes('canOpenDashboardRoute(taskDestination)'));
  assert.ok(overview.includes('canOpenProjects && canOpenDashboardRoute(projectHref)'));
  assert.ok(overview.includes('{canOpenInvoiceRegister ? ('));
  assert.ok(overview.includes('{canOpenExpenseRegister ? ('));
});


test('Dashboard Finance and delivery cards distinguish unavailable sources from empty records', () => {
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.ok(overview.includes('Task queue unavailable'));
  assert.ok(overview.includes('title="No task records yet"'));
  assert.ok(overview.includes('Project portfolio unavailable'));
  assert.ok(overview.includes('No project records returned'));
  assert.ok(overview.includes('Delivery schedule unavailable'));
  assert.ok(overview.includes('Invoice source unavailable.'));
  assert.ok(overview.includes('Expense source unavailable.'));
  assert.ok(overview.includes('No eligible expense records are available to confirm a selected-period total.'));
});

test('Dashboard Overview does not duplicate unverified project progress or budget metrics', () => {
  const overviewStart = dashboard.indexOf("{view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  assert.ok(dashboard.includes("const serviceLineConfiguration = ["));
  assert.ok(dashboard.includes("label: 'Other / Unclassified'"));
  assert.ok(dashboard.includes("const allUpcomingCommitments = useMemo<DashboardCommitment[]>(() =>"));
  assert.ok(dashboard.includes("const upcomingCommitments = allUpcomingCommitments.filter((item) => {"));
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
