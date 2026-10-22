import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTeams.tsx'), 'utf8');

test('Team & Resources declares the live sources required by each view', () => {
  assert.ok(source.includes("const TEAM_VIEW_DATA_SOURCES: Record<TeamView, TeamDataSource[]>"));
  assert.ok(source.includes("'team-directory': ['members', 'projects', 'timeLogs']"));
  assert.ok(source.includes("'roles-departments': ['members']"));
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


test('team allocation distinguishes unavailable time logs from a recorded zero', () => {
  assert.match(source, /sourceAvailability\.timeLogs === true/);
  assert.match(source, /'Time data unavailable'/);
  assert.match(source, /'Loading time data'/);
  assert.match(source, /percent: null/);
  assert.match(source, /teamStatus === 'unavailable'/);
  assert.match(source, /value: 'unavailable', label: 'Time source unavailable'/);
  assert.match(source, /allocation\.percent === null \? '—'/);
  assert.match(source, /sourceAvailability\.timeLogs === true \? formatHours\(teamTrackedMinutes\.get\(member\.id\) \?\? 0\) : 'Unavailable'/);
});

test('Team project and capacity views do not show zero or no-plan states when sources are unavailable', () => {
  assert.match(source, /sourceAvailability\.projects === true \? projectsForMember\.length : '—'/);
  assert.match(source, /'Project data unavailable'/);
  assert.match(source, /sourceAvailability\.timeLogs === true \? week\.utilization \+ '%' : 'Unavailable'/);
  assert.match(source, /sourceAvailability\.projects === true \? \(week\.projectCount \? week\.allocationPercent \+ '%' : 'No plan'\) : 'Unavailable'/);
  assert.match(source, /sourceAvailability\.projects === true && !futureCapacityRows\.some/);
  const directoryStart = source.indexOf('data-ams-feature-slug="team-directory"');
  const directoryEnd = source.indexOf(") : currentView === 'roles-departments' ?", directoryStart);
  assert.ok(directoryStart >= 0 && directoryEnd > directoryStart);
  const directory = source.slice(directoryStart, directoryEnd);
  assert.match(directory, /allocation\.percent === null \? '—' : allocation\.percent \+ '% of 40h baseline'/);
  assert.doesNotMatch(directory, /team-directory-kpi-headcount/);
  assert.match(source, /sourceAvailability\.timeLogs === false \? 'Time log data unavailable'/);
});


test('Roles & Departments is an active member-backed worksheet separate from access policy', () => {
  assert.ok(source.includes("requestedView === 'roles-departments' ? 'roles-departments'"));
  assert.ok(source.includes("to: '/admin/team?view=roles-departments'"));
  assert.ok(source.includes("currentView === 'roles-departments' ? 'roles-departments'"));
  assert.ok(source.includes('data-ams-feature-slug="team-roles-departments"'));
  assert.ok(source.includes('Role groups'));
  assert.ok(source.includes("downloadCsv('kapitech-roles-departments.csv'"));
  assert.ok(source.includes('They do not grant, remove, or modify system permissions'));
});
