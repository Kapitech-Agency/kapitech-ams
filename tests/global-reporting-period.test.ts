import assert from 'node:assert/strict';
import test from 'node:test';
import {
  convertReportingPeriodValue,
  getReportingPeriodRange,
  getPreviousReportingPeriodValue
} from '../src/lib/reportingPeriods.ts';

test('global period ranges include exactly the selected month, quarter, or year', () => {
  assert.equal(getReportingPeriodRange('2024-02', 'month')?.endDate, '2024-02-29');
  assert.equal(getReportingPeriodRange('2026-Q2', 'quarter')?.startDate, '2026-04-01');
  assert.equal(getReportingPeriodRange('2026-Q2', 'quarter')?.endDate, '2026-06-30');
  assert.equal(getReportingPeriodRange('2025', 'year')?.startDate, '2025-01-01');
  assert.equal(getReportingPeriodRange('2025', 'year')?.endDate, '2025-12-31');
});

test('global period presets roll backwards across calendar boundaries', () => {
  assert.equal(getPreviousReportingPeriodValue('2026-01', 'month'), '2025-12');
  assert.equal(getPreviousReportingPeriodValue('2026-Q1', 'quarter'), '2025-Q4');
  assert.equal(getPreviousReportingPeriodValue('2026', 'year'), '2025');
  assert.equal(convertReportingPeriodValue('2026-10', 'month', 'quarter'), '2026-Q4');
});

test('global reporting period controls stay in the admin layout shared by modules and tabs', async () => {
  const fs = await import('node:fs/promises');
  const layout = await fs.readFile('src/pages/admin/AdminLayout.tsx', 'utf8');
  const periodFilter = await fs.readFile('src/components/admin/AdminReportingPeriodBar.tsx', 'utf8');
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
  assert.ok(periodFilter.includes('<span>{selectedLabel}</span>'));
  assert.ok(periodFilter.includes('new Intl.DateTimeFormat(locale, { month: \'short\', year: \'numeric\' })'));
  assert.ok(periodFilter.includes("return match ? 'Q' + match[2] + ' ' + match[1] : value;"));
  assert.ok(!periodFilter.includes('<span>Filter</span>'));
  assert.ok(inbox.includes('matchesDate(item.createdAt)'));
  assert.ok(tasks.includes('matchesDate(task.dueDate || task.createdAt)'));
  assert.ok(projects.includes('matchesInterval(project.startDate, project.targetEndDate, project.createdAt)'));
  assert.ok(documents.includes('matchesDate(doc.updatedAt || doc.uploadedAt || doc.uploadedDate || (doc as any).createdAt)'));
  assert.ok(teams.includes('matchesDate(log.date)'));
  assert.ok(dashboard.includes('matchesInterval(project.startDate, project.targetEndDate, project.createdAt)'));
  assert.ok(settings.includes('backups.filter((backup) => matchesDate(backup.createdAt))'));
});
