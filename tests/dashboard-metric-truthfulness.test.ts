import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const dashboard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/GlobalExecutiveDashboard.tsx'), 'utf8');

test('Dashboard priority exceptions distinguish positive counts, genuine zero, and unavailable data', () => {
  assert.ok(dashboard.includes('data-ams-feature-slug="dashboard-priority-exceptions"'));
  assert.ok(dashboard.includes('Number(overdueTasksMetric) > 0'));
  assert.ok(dashboard.includes('Number(projectsAtRiskMetric) > 0'));
  assert.ok(dashboard.includes('No overdue tasks or project risk flags reported'));
  assert.ok(dashboard.includes('Priority exception data unavailable'));
  assert.ok(dashboard.includes('Overdue task count unavailable'));
  assert.ok(dashboard.includes('Project risk count unavailable'));
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
