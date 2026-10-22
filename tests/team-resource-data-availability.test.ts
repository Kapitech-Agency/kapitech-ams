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
  assert.ok(source.includes('Project allocation source unavailable. Refresh to retry.'));
  assert.ok(source.includes('Time log source unavailable. Refresh to retry.'));
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

test('Capacity Allocation prioritizes saved project allocations and separates tracked-time history', () => {
  assert.match(source, /const allocationRegisterRows = useMemo\(/);
  assert.match(source, /startDate > allocationWindow\.endDate \|\| endDate < allocationWindow\.startDate/);
  assert.match(source, /String\(plan\.memberId\) === String\(member\.id\)/);
  assert.match(source, /row\.plan\.allocationPercent \* 0\.4/);

  const start = source.indexOf('data-ams-feature-slug="capacity-allocation"');
  const end = source.indexOf(") : currentView === 'skill-matrix' ?", start);
  assert.ok(start >= 0 && end > start, 'Capacity Allocation should have a bounded primary workspace');
  const view = source.slice(start, end);
  const filters = view.indexOf('slug="capacity-allocation-filters"');
  const register = view.indexOf('slug="capacity-allocation-register"');
  const history = view.indexOf('slug="capacity-allocation-table"');
  assert.ok(filters >= 0 && register > filters && history > register,
    'The allocation filters and saved project-member register must precede secondary historical time.');
  assert.match(view, /Member: All/);
  assert.match(view, /Project: All/);
  assert.match(view, /Resource & role/);
  assert.match(view, /Allocation %/);
  assert.match(view, /Planned hours \/ week/);
  assert.match(view, /Planned date range/);
  assert.match(view, /40h\/week reference only/);
  assert.match(view, /No dated resource allocations overlap the next four weeks\./);
  assert.match(view, /No allocations match these filters\./);
  assert.match(view, /Project allocation source unavailable\. Refresh to retry\./);
  assert.match(view, /Loading saved project allocations\.\.\./);
  assert.match(view, /sourceAvailability\.timeLogs === false \? '—' : 'Loading'/);
  assert.doesNotMatch(view, /capacity-allocation-kpi-utilization|futureCapacityRows/,
    'The historical summary strip and aggregated forecast must not replace the saved plan register.');
});

test('Team project and capacity views do not show zero or no-plan states when sources are unavailable', () => {
  assert.match(source, /sourceAvailability\.projects === true \? projectsForMember\.length : '—'/);
  assert.match(source, /'Project data unavailable'/);
  assert.match(source, /sourceAvailability\.timeLogs === true \? week\.referencePercent \+ '% of 40h reference' : 'Unavailable'/);
  const directoryStart = source.indexOf('data-ams-feature-slug="team-directory"');
  const directoryEnd = source.indexOf(") : currentView === 'roles-departments' ?", directoryStart);
  assert.ok(directoryStart >= 0 && directoryEnd > directoryStart);
  const directory = source.slice(directoryStart, directoryEnd);
  assert.match(directory, /allocation\.percent === null \? '—'/);
  assert.doesNotMatch(directory, /team-directory-kpi-headcount/);
  assert.match(source, /sourceAvailability\.timeLogs === false \? '—' : 'Loading'/);
  assert.match(source, /currentViewDataUnavailable \? 'Time log data unavailable' : 'No time logs found'/);
});


test('Roles & Departments is an active member-backed worksheet separate from access policy', () => {
  assert.ok(source.includes("requestedView === 'roles-departments' ? 'roles-departments'"));
  assert.ok(source.includes("to: '/admin/team?view=roles-departments'"));
  assert.ok(source.includes("currentView === 'roles-departments' ? 'roles-departments'"));
  assert.ok(source.includes('data-ams-feature-slug="team-roles-departments"'));
  assert.ok(source.includes('slug="team-roles-departments-matrix"'));
  assert.ok(source.includes('Department and role matrix'));
  assert.doesNotMatch(source, /team-roles-departments-count|team-roles-count|team-role-members-count|team-role-active-count/,
    'The matrix is the primary worksheet and should not be preceded by duplicate KPI counts.');
  assert.ok(source.includes('Role and division labels describe the roster, not system access.'));
  assert.ok(source.includes('Settings → Users & Access.'));
  assert.ok(source.includes("downloadCsv('kapitech-roles-departments.csv'"));
});
