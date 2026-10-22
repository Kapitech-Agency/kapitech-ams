import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Skill Matrix source status is isolated between internal members and vendor skills', async () => {
  const source = await read('src/pages/admin/AdminTeams.tsx');
  const start = source.indexOf(") : currentView === 'skill-matrix' ? (");
  const end = source.indexOf('data-ams-feature-slug="time-logs"', start);
  assert.ok(start >= 0 && end > start, 'Skill Matrix work surface should be bounded');
  const view = source.slice(start, end);
  assert.ok(source.includes('const skillMatrixMembersUnavailable = sourceAvailability.members !== true'));
  assert.ok(source.includes('const skillMatrixVendorsUnavailable = sourceAvailability.vendors !== true'));
  assert.ok(view.includes("skillMatrixMembersUnavailable ? '—' : members.length"));
  assert.ok(view.includes("skillMatrixVendorsUnavailable ? '—' : skillRows.length"));
  assert.ok(view.includes("sourceAvailability.members === false ? 'Internal team records unavailable. Refresh to retry.' : 'Loading internal team records...'"));
  assert.ok(view.includes('sourceAvailability.vendors === false'));
  assert.ok(view.includes('Loading vendor skill data...'));
  assert.ok(view.includes('No internal team members found.'));
  assert.ok(view.includes('No vendor skills have been recorded.'));
  assert.ok(view.includes('Previously loaded skill coverage remains visible.'));
});

test('Skill Matrix retains role-derived and recorded vendor skill semantics', async () => {
  const source = await read('src/pages/admin/AdminTeams.tsx');
  const start = source.indexOf(") : currentView === 'skill-matrix' ? (");
  const end = source.indexOf('data-ams-feature-slug="time-logs"', start);
  const view = source.slice(start, end);
  assert.ok(view.includes('Role-aligned focus derived from the server-provided role and division. It is not a self-reported proficiency score.'));
  assert.ok(view.includes('distinct skills reported by the vendor directory.'));
  assert.ok(view.includes('sourceAvailability.members === true'));
  assert.ok(view.includes('sourceAvailability.vendors === true'));
  assert.ok(view.indexOf('slug="skill-matrix-internal-role-matrix"') < view.indexOf('slug="skill-matrix-vendor-skill-coverage"'));
});
