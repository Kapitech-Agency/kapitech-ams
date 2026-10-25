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

test('Dashboard Overview active project register excludes completed and archived records before applying view filters', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.match(dashboard, /health: String\(project\.health \|\| ''\)/);
  assert.match(dashboard, /const activeDashboardProjects = useMemo\([\s\S]*?!isFinishedWork\(project\.status\) && !isFinishedWork\(project\.health\)/);
  assert.match(dashboard, /\(\) => activeDashboardProjects\.filter\(\(project\) =>[\s\S]*matchesInterval\(project\.startDate, project\.targetEndDate, project\.createdAt\)/);
  assert.ok(dashboard.includes('No active projects recorded'));
  assert.ok(dashboard.includes('No active projects match the selected reporting scope and type'));
  assert.ok(dashboard.includes('The returned project records are completed or archived.'));
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
