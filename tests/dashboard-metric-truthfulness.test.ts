import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const dashboard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/GlobalExecutiveDashboard.tsx'), 'utf8');

test('project risk KPI distinguishes a positive count, a genuine zero, and unavailable data', () => {
  assert.ok(dashboard.includes("change: projectsAtRiskMetric == null ? undefined : projectsAtRiskMetric > 0 ? 'Requires attention' : 'No projects flagged'"));
  assert.ok(dashboard.includes("changeToneClassName: projectsAtRiskMetric == null ? 'text-muted' : projectsAtRiskMetric > 0 ? 'text-danger' : 'text-success'"));
  assert.ok(dashboard.includes("toneClassName: projectsAtRiskMetric == null ? 'text-muted' : projectsAtRiskMetric > 0 ? 'text-danger' : 'text-success'"));
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
