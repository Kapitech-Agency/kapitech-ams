import assert from 'node:assert/strict';
import test from 'node:test';
import {
  convertReportingPeriodValue,
  getReportingPeriodRange,
  getPreviousReportingPeriodValue,
  getReportingYearOptions,
  MIN_REPORTING_YEAR
} from '../src/lib/reportingPeriods.ts';

test('global period ranges include exactly the selected month, quarter, or year', () => {
  assert.equal(getReportingPeriodRange('2024-02', 'month')?.endDate, '2024-02-29');
  assert.equal(getReportingPeriodRange('2026-Q2', 'quarter')?.startDate, '2026-04-01');
  assert.equal(getReportingPeriodRange('2026-Q2', 'quarter')?.endDate, '2026-06-30');
  assert.equal(getReportingPeriodRange('2025', 'year')?.startDate, '2025-01-01');
  assert.equal(getReportingPeriodRange('2025', 'year')?.endDate, '2025-12-31');
});

test('reporting year options never predate the company founding year', () => {
  const years = getReportingYearOptions(2026, [2018, 2020, 2021, 2027], 2020);
  assert.equal(MIN_REPORTING_YEAR, 2021);
  assert.equal(years[years.length - 1], 2021);
  assert.ok(years.includes(2021));
  assert.ok(years.includes(2028));
  assert.ok(!years.includes(2020));
  assert.ok(!years.includes(2018));
});

test('global period presets roll backwards across calendar boundaries', () => {
  assert.equal(getPreviousReportingPeriodValue('2026-01', 'month'), '2025-12');
  assert.equal(getPreviousReportingPeriodValue('2026-Q1', 'quarter'), '2025-Q4');
  assert.equal(getPreviousReportingPeriodValue('2026', 'year'), '2025');
  assert.equal(convertReportingPeriodValue('2026-10', 'month', 'quarter'), '2026-Q4');
});

test('Finance workbook keeps all 20 sheets reachable through the worksheet renderer', async () => {
  const fs = await import('node:fs/promises');
  const workbook = await fs.readFile('src/lib/financeWorkbook.ts', 'utf8');
  const workspace = await fs.readFile('src/pages/admin/AdminFinanceWorkspace.tsx', 'utf8');
  const subnavigation = await fs.readFile('src/lib/amsModuleSubnavigation.ts', 'utf8');
  const workbookBlock = workbook.slice(
    workbook.indexOf('export const FINANCE_WORKBOOK_GROUPS'),
    workbook.indexOf('export interface ExcelChartAccount')
  );
  const worksheetKeys = [...workbookBlock.matchAll(/\{ key: '([^']+)', sheet: '([^']+)'/g)].map((match) => match[1]);
  const rendererStart = workspace.indexOf('const renderView = (tab: FinanceWorkbookTab) => {');
  const rendererEnd = workspace.indexOf('if (!canViewFinancials)', rendererStart);
  assert.ok(rendererStart >= 0 && rendererEnd > rendererStart);
  const renderer = workspace.slice(rendererStart, rendererEnd);
  const renderedKeys = [...renderer.matchAll(/case '([^']+)':/g)].map((match) => match[1]);

  assert.equal(worksheetKeys.length, 20);
  assert.equal(new Set(worksheetKeys).size, worksheetKeys.length);
  assert.deepEqual([...renderedKeys].sort(), [...worksheetKeys].sort());
  for (const slug of [
    'finance-workspace-overview-control',
    'finance-workspace-transactions-cash',
    'finance-workspace-receivables-payables',
    'finance-workspace-project-finance',
    'finance-workspace-accounting-reports',
  ]) {
    assert.ok(subnavigation.includes(slug), 'Missing stable Finance area tab slug ' + slug);
  }
  assert.ok(workspace.includes('const canShowFinanceWorksheet = (key: string) =>'));
  assert.ok(subnavigation.includes("key: 'overview', label: 'Overview & Control'"));
  assert.ok(workspace.includes('const sheetItems = ['));
  assert.ok(workspace.includes('...activeGroup.items'));
  assert.ok(workspace.includes("slug: 'finance-view-quotations'"));
  assert.ok(workspace.includes('getAmsSidebarDestinationSignatures(navigationRole)'));
  assert.ok(subnavigation.includes('Finance areas') || subnavigation.includes("label: 'Overview & Control'"));
  assert.ok(workspace.includes('ariaLabel="Finance views"'));
  assert.ok(workspace.includes('data-ams-slug="finance-workspace-navigation"'));
});

test('date-aware Finance views use the shared reporting period without changing their ledger roll-forward', async () => {
  const fs = await import('node:fs/promises');
  const workspace = await fs.readFile('src/pages/admin/AdminFinanceWorkspace.tsx', 'utf8');
  const subnavigation = await fs.readFile('src/lib/amsModuleSubnavigation.ts', 'utf8');
  const invoicing = await fs.readFile('src/pages/admin/AdminInvoicing.tsx', 'utf8');

  assert.ok(workspace.includes('const { mode: reportPeriodMode, value: reportPeriodValue, enabled: reportPeriodEnabled, matchesDate, matchesInterval } = useReportingPeriod()'));
  assert.ok(workspace.includes('allCashLedgerRows.filter((row) => matchesDate(row.date) && matching(row.search)).reverse()'));
  assert.ok(workspace.includes('matchesDate(record.payload.billDate || record.payload.dueDate || record.createdAt)'));
  assert.ok(workspace.includes('matchesDate(item.month + \'-01\')'));
  assert.ok(workspace.includes('matchesDate(record.payload.dueDate || record.createdAt)'));
  assert.ok(workspace.includes('matchesDate(expense.date)'));
  assert.ok(workspace.includes('matchesDate(record.payload.date || record.createdAt)'));
  assert.ok(workspace.includes('const dashboardRange = getReportingPeriodRange(reportPeriodValue, reportPeriodMode, locale);'));
  assert.ok(workspace.includes("const date = String(getInvoiceDate(invoice) || '').slice(0, 10);"));
  assert.ok(workspace.includes("const date = String(entry.date || '').slice(0, 10);"));
  assert.ok(workspace.includes("const date = String(movement.date || '').slice(0, 10);"));
  assert.ok(workspace.includes('const selectedYear = String(Number(reportPeriodValue.slice(0, 4)) || new Date().getFullYear());'));
  assert.ok(workspace.includes('renderRecentActivity(dashboardRange ?'));
  assert.ok(workspace.includes('const defaultFinanceMonth = getReportingPeriodRange(reportPeriodValue, reportPeriodMode, locale)?.startMonth'));
  assert.ok(workspace.includes('const response = await api.finance.workbookClosePeriod(period);'));
  assert.ok(!workspace.includes('getReportingYearOptions(new Date().getFullYear(), availableYears, Number(selectedYear)).map(String)'));
  assert.ok(!workspace.includes('CustomReportPeriodPicker'));
  assert.ok(!workspace.includes('finance-dashboard-month-picker'));
  assert.ok(!workspace.includes('finance-pnl-report-period-picker'));
  assert.ok(!workspace.includes('finance-cash-flow-report-period-picker'));
  assert.ok(workspace.includes('const accountActivity = new Map<string, { debit: number; credit: number }>();'));
  assert.ok(workspace.includes('for (const journal of postedJournals)'));
  assert.ok(workspace.includes('recordType: \'cash-bank-opening\' as const'));
  assert.ok(workspace.includes('recordType: \'balance-sheet-opening\' as const'));
  assert.ok(workspace.includes('const openingOffset = accountBalance(\'3200\', \'Equity\')'));
  assert.ok(workspace.includes('const sourceExceptionCount = exceptionKeys.size'));
  assert.ok(workspace.includes('const requestId = ++loadRequestId.current;'));
  assert.ok(workspace.includes('if (requestId !== loadRequestId.current) return;'));
  assert.ok(workspace.includes('const selectedCashRange = reportPeriodEnabled ? getReportingPeriodRange(reportPeriodValue, reportPeriodMode) : null;'));
  assert.ok(workspace.includes('const periodClosingBalance = closingBalanceAvailable'));
  assert.ok(workspace.includes('const selectedPettyRange = reportPeriodEnabled ? getReportingPeriodRange(reportPeriodValue, reportPeriodMode) : null;'));
  assert.ok(workspace.includes('Number(record.payload.outstanding ?? ((Number(record.payload.total) || 0) - (Number(record.payload.paidAmount) || 0)))'));
  assert.ok(invoicing.includes('return matchesDate(row.dueDate)'));
  assert.ok(invoicing.includes('vendorPaymentSort, matchesDate]'));
  assert.ok(invoicing.includes('return retainerInvoices.filter((invoice) => matchesDate(invoice.issueDate || invoice.createdAt))'));
  assert.ok(invoicing.includes('setRetainerPage(1); }, [currency, reportPeriodValue, reportPeriodEnabled, matchesDate]'));
});

test('global reporting period controls stay in the admin layout shared by modules and tabs', async () => {
  const fs = await import('node:fs/promises');
  const layout = await fs.readFile('src/pages/admin/AdminLayout.tsx', 'utf8');
  const periodFilter = await fs.readFile('src/components/admin/AdminReportingPeriodBar.tsx', 'utf8');
  const periodPicker = await fs.readFile('src/components/ui/CustomReportPeriodPicker.tsx', 'utf8');
  const inbox = await fs.readFile('src/pages/admin/AdminInbox.tsx', 'utf8');
  const tasks = await fs.readFile('src/components/admin/TasksWorkspace.tsx', 'utf8');
  const projects = await fs.readFile('src/pages/admin/AdminProjects.tsx', 'utf8');
  const documents = await fs.readFile('src/pages/admin/AdminDocuments.tsx', 'utf8');
  const teams = await fs.readFile('src/pages/admin/AdminTeams.tsx', 'utf8');
  const dashboard = await fs.readFile('src/components/admin/GlobalExecutiveDashboard.tsx', 'utf8');
  const settings = await fs.readFile('src/pages/admin/AdminSettings.tsx', 'utf8');

  assert.ok(layout.includes('<ReportingPeriodProvider>'));
  assert.equal((layout.match(/<AdminReportingPeriodBar \/>/g) || []).length, 2);
  assert.ok(layout.includes('<Outlet />'));
  assert.ok(!layout.includes('global-reporting-period-container'));
  assert.ok(periodFilter.includes('global-reporting-period-trigger'));
  assert.ok(periodFilter.includes('global-reporting-period-popover'));
  assert.ok(periodFilter.includes('The applied period scopes dated lists. Finance reports follow the selected period. Monthly Closing uses its own closing month;'));
  assert.ok(periodFilter.includes('<span>{selectedLabel}</span>'));
  assert.ok(periodFilter.includes('new Intl.DateTimeFormat(locale, { month: \'short\', year: \'numeric\' })'));
  assert.ok(periodFilter.includes("return match ? 'Q' + match[2] + ' ' + match[1] : value;"));
  assert.ok(!periodFilter.includes('<span>Filter</span>'));
  assert.ok(periodPicker.includes('compact ? "grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2"'));
  assert.ok(periodPicker.includes('getReportingYearOptions(currentYear, availableYears, parsedYear)'));
  assert.ok(periodPicker.includes('rawParsedYear < MIN_REPORTING_YEAR'));
  assert.ok(periodPicker.includes('setReportingPeriodYear(value, mode, MIN_REPORTING_YEAR)'));
  assert.ok(periodPicker.includes('disabled={!canChoosePreviousPeriod}'));
  assert.ok(!periodPicker.includes('compact ? "grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3"'));
  assert.ok(inbox.includes('matchesDate(item.createdAt)'));
  assert.ok(tasks.includes('matchesDate(task.dueDate || task.createdAt)'));
  assert.ok(projects.includes('matchesInterval(project.startDate, project.targetEndDate, project.createdAt)'));
  assert.ok(documents.includes('matchesDate(doc.updatedAt || doc.uploadedAt || doc.uploadedDate || (doc as any).createdAt)'));
  assert.ok(teams.includes('matchesDate(log.date)'));
  assert.ok(dashboard.includes('matchesInterval(project.startDate, project.targetEndDate, project.createdAt)'));
  assert.ok(settings.includes('backups.filter((backup) => matchesDate(backup.createdAt))'));
});
