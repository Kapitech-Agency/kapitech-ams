import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Roles & Departments presents the grouped matrix as the primary work surface', async () => {
  const source = await read('src/pages/admin/AdminTeams.tsx');
  const start = source.indexOf(") : currentView === 'roles-departments' ? (");
  const end = source.indexOf(") : currentView === 'vendor-directory' ?", start);
  assert.ok(start >= 0 && end > start, 'Roles & Departments should have a bounded workspace');
  const view = source.slice(start, end);
  const matrix = view.indexOf('slug="team-roles-departments-matrix"');
  assert.ok(matrix >= 0);
  assert.ok(view.indexOf('Department and role matrix') > matrix);
  assert.doesNotMatch(view, /<AdminMetricStrip|team-roles-departments-count|team-roles-count|team-role-members-count|team-role-active-count/,
    'Summary cards duplicate the Department/Role/Member/Active columns in the main matrix.');
  assert.match(view, /Counts are grouped from current team member records/);
  assert.match(view, /Role and division labels describe the roster, not system access/);
  assert.match(view, /Settings → Users & Access/);
  for (const label of ['Department', 'Role', 'Members', 'Active', 'Other status', 'Member names']) {
    assert.ok(view.includes('>' + label + '</th>'), 'Missing matrix column: ' + label);
  }
});

test('Roles & Departments preserves source unavailable and valid empty states', async () => {
  const source = await read('src/pages/admin/AdminTeams.tsx');
  const start = source.indexOf(") : currentView === 'roles-departments' ? (");
  const end = source.indexOf(") : currentView === 'vendor-directory' ?", start);
  const view = source.slice(start, end);
  assert.match(view, /Team member data is unavailable\. Refresh to retry; group counts are not shown as zero\./);
  assert.match(view, /No team member records are available for grouping\./);
  assert.match(view, /aria-label="Scrollable department and role matrix"/);
});
