import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTeams.tsx'), 'utf8');

test('Team & Resources declares the live sources required by each view', () => {
  assert.ok(source.includes("const TEAM_VIEW_DATA_SOURCES: Record<TeamView, TeamDataSource[]>"));
  assert.ok(source.includes("'team-directory': ['members', 'projects', 'timeLogs']"));
  assert.ok(source.includes("'vendor-directory': ['vendors', 'projects']"));
  assert.ok(source.includes("'capacity-allocation': ['members', 'projects', 'timeLogs']"));
  assert.ok(source.includes("'skill-matrix': ['members', 'vendors']"));
  assert.ok(source.includes("'time-logs': ['timeLogs', 'projects']"));
});

test('unavailable live sources cannot be presented as zero-valued Team & Resources KPIs', () => {
  assert.ok(source.includes('const currentViewDataUnavailable = TEAM_VIEW_DATA_SOURCES[currentView]'));
  assert.ok(source.includes('sourceAvailability[source] !== true'));
  assert.ok(source.includes("value: currentViewDataUnavailable ? '—'"));
  assert.ok(source.includes("label: 'Vetted coverage', value: currentViewDataUnavailable ? '—'"));
  assert.ok(source.includes("label: 'Active skill coverage', value: currentViewDataUnavailable ? '—'"));
});

test('missing source arrays and failed requests show unavailable states instead of empty-data claims', () => {
  assert.ok(source.includes('memberRes.success && Array.isArray(memberRes.data?.assignees)'));
  assert.ok(source.includes('vendorRes.success && Array.isArray(vendorRes.data?.vendors)'));
  assert.ok(source.includes('projectRes.success && Array.isArray(projectRes.data?.projects)'));
  assert.ok(source.includes('timeRes.success && Array.isArray(timeRes.data?.timeLogs)'));
  assert.ok(source.includes('Team data unavailable'));
  assert.ok(source.includes('Vendor data unavailable'));
  assert.ok(source.includes('Capacity data unavailable'));
  assert.ok(source.includes('Vendor skill data unavailable'));
  assert.ok(source.includes('Time log data unavailable'));
});
