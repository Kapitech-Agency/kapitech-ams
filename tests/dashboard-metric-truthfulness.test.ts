import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const dashboard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/GlobalExecutiveDashboard.tsx'), 'utf8');

test('Dashboard priority exceptions distinguish the source-backed queue, genuine empty, and unavailable data', () => {
  assert.ok(dashboard.includes('data-ams-feature-slug="dashboard-priority-exceptions"'));
  assert.ok(dashboard.includes('attentionItemsDataReturned = Array.isArray(data.attentionItems)'));
  assert.ok(dashboard.includes('attentionItemsDataAvailable: attentionItemsDataReturned ? true : previous.attentionItemsDataAvailable'));
  assert.ok(dashboard.includes('No priority exceptions returned'));
  assert.ok(dashboard.includes('Priority exception data unavailable'));
  assert.ok(dashboard.includes('The interface does not infer that there are no exceptions.'));
  assert.ok(dashboard.includes("const safeDestination = /^\\/admin\\/[a-z0-9/_-]+$/i.test(destination) ? destination : null;"));
});

test('Dashboard Overview active project register excludes completed and archived records before applying view filters', () => {
  assert.match(dashboard, /health: String\(project\.health \|\| ''\)/);
  assert.match(dashboard, /const activeDashboardProjects = useMemo\([\s\S]*?!isFinishedWork\(project\.status\) && !isFinishedWork\(project\.health\)/);
  assert.match(dashboard, /\(\) => activeDashboardProjects\.filter\(\(project\) =>[\s\S]*matchesInterval\(project\.startDate, project\.targetEndDate, project\.createdAt\)/);
  assert.ok(dashboard.includes('No active projects recorded'));
  assert.ok(dashboard.includes('No active projects match the selected reporting scope and type'));
  assert.ok(dashboard.includes('The returned project records are completed or archived.'));
});

test('Dashboard does not substitute monthly revenue for cash collected', () => {
  assert.ok(dashboard.includes('const cashCollectedMetric = dashboardOverview.financials?.cashCollected ?? liveCashCollected;'));
  const start = dashboard.indexOf("id: 'revenue', label: 'Cash collected this month'");
  const end = dashboard.indexOf("id: 'outstanding', label: 'Outstanding invoices'", start);
  assert.ok(start >= 0 && end > start, 'Cash KPI should be separate from receivables.');
  const cashKpi = dashboard.slice(start, end);
  assert.ok(cashKpi.includes('Invoice payments recorded this month'));
  assert.doesNotMatch(cashKpi, /revenueThisMonth/, 'Revenue must not be used as a cash-received fallback.');
});

test('Dashboard financial trends use issued invoice rules and exclude void expense records', () => {
  const source = dashboard;
  const trendStart = source.indexOf('const aggregateFinancialTrend');
  const trendEnd = source.indexOf('const buildRecentFinancialTrend', trendStart);
  const trend = source.slice(trendStart, trendEnd);
  assert.ok(trend.includes('dateKey(getInvoiceDate(invoice))'));
  assert.ok(trend.includes('!isIssuedInvoice(invoice)'));
  assert.ok(trend.includes('!isDashboardExpenseEligible(expense)'));
  assert.ok(source.includes("return !['voided', 'cancelled', 'canceled', 'deleted'].includes(status)"));
  assert.ok(source.includes('invoiceHistoryReturned = Boolean(operationalSnapshot.invoices?.some((invoice: any) => String(invoice.currency || \'IDR\').toUpperCase() === financeCurrency && isIssuedInvoice(invoice)))'));
  assert.ok(source.includes('const financialRecordsReturned = inCurrencyIssuedInvoices.length > 0 || inCurrencyExpenses.length > 0'));
  assert.ok(source.includes('const inCurrencyExpenses = inCurrencyExpenseRows.filter(isDashboardExpenseEligible)'));
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

test('Dashboard financial trends do not treat records in another currency as a zero-value series', () => {
  assert.ok(dashboard.includes("invoiceHistoryReturned = Boolean(operationalSnapshot.invoices?.some((invoice: any) => String(invoice.currency || 'IDR').toUpperCase() === financeCurrency && isIssuedInvoice(invoice)))"));
  assert.ok(dashboard.includes("expenseHistoryReturned = Boolean(operationalSnapshot.expenses?.some((expense: any) => String(expense.currency || 'IDR').toUpperCase() === financeCurrency && isDashboardExpenseEligible(expense)))"));
  assert.ok(dashboard.includes("const inCurrencyExpenses = inCurrencyExpenseRows.filter(isDashboardExpenseEligible)"));
  assert.ok(dashboard.includes("const selectedCurrencyFinancialRowsReturned = inCurrencyInvoices.length > 0 || inCurrencyExpenseRows.length > 0"));
  assert.ok(dashboard.includes("financialRecordsReturned = inCurrencyIssuedInvoices.length > 0 || inCurrencyExpenses.length > 0"));
  assert.ok(dashboard.includes('A zero-value trend is not inferred from another currency.'));
  assert.ok(dashboard.includes('const cashCollectedMetric = dashboardOverview.financials?.cashCollected ?? liveCashCollected;'));
});

test('Dashboard distinguishes an empty portfolio from an unavailable project source', () => {
  assert.ok(dashboard.includes('projectDataAvailable'));
  assert.ok(dashboard.includes('No active projects to assess'));
  assert.ok(dashboard.includes('No projects recorded'));
  assert.ok(dashboard.includes('Live project data unavailable'));
});

test('missing project status, progress, and budget are not presented as healthy defaults or zero values', () => {
  assert.ok(dashboard.includes("status: rawStatus || 'Status unavailable'"));
  assert.ok(dashboard.includes("progress: parsedProgress !== null && Number.isFinite(parsedProgress) ? Math.max(0, Math.min(100, parsedProgress)) : null"));
  assert.ok(dashboard.includes("budget: parsedBudget !== null && Number.isFinite(parsedBudget) ? formatLiveMoney(parsedBudget, dashboardCurrency) : '—'"));
  assert.ok(dashboard.includes("project.progress == null ? '—' : project.progress + '%'"));
  assert.ok(dashboard.includes("projectDetails.progress == null ? 'Progress unavailable' : projectDetails.progress + '% complete'"));
});

test('invalid Dashboard money values remain unavailable instead of being displayed as zero', () => {
  assert.match(
    dashboard,
    /const formatLiveMoney = \(value: number, currency: string\) => \{\s*if \(!Number\.isFinite\(value\)\) return '—';\s*return new Intl\.NumberFormat\('en-US', \{ style: 'currency', currency: currency \|\| 'IDR', maximumFractionDigits: 0 \}\)\.format\(value\);\s*\};/
  );
  assert.doesNotMatch(dashboard, /Number\.isFinite\(value\) \? value : 0/);
});
