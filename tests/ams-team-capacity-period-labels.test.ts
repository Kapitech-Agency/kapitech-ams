import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Team Capacity historical tracked-time columns show concrete weekly date ranges', async () => {
  const source = await read('src/pages/admin/AdminTeams.tsx');
  const weeksStart = source.indexOf('const weeklyCapacity = useMemo');
  const rowsStart = source.indexOf('const capacityRows = useMemo', weeksStart);
  assert.ok(weeksStart >= 0 && rowsStart > weeksStart, 'Weekly tracked-time source must remain identifiable');
  const weeks = source.slice(weeksStart, rowsStart);
  assert.ok(weeks.includes('rangeLabel: weekRangeLabel(start, end)'));
  assert.ok(source.includes('const weekRangeLabel = (start: Date, endExclusive: Date) =>'));
  assert.ok(source.includes('endInclusive.setDate(endInclusive.getDate() - 1)'));
  const panelStart = source.indexOf('slug="capacity-allocation-table"');
  const panelEnd = source.indexOf('</AdminPanel>', panelStart);
  assert.ok(panelStart >= 0 && panelEnd > panelStart, 'Historical tracked-time panel should be bounded');
  const panel = source.slice(panelStart, panelEnd);
  assert.ok(panel.includes('{week.rangeLabel}'), 'Each weekly column must display a concrete date range');
  assert.ok(panel.includes('Hours · % of 40h ref.'));
  assert.ok(panel.includes('they do not confirm capacity or availability'));
  assert.ok(panel.includes('are separate from planned allocations'));
  assert.doesNotMatch(panel, /utilization/i, 'Tracked time versus a reference must not be presented as verified capacity utilization');
});

test('Team Capacity CSV identifies historical ranges and keeps planned-allocation ranges distinct', async () => {
  const source = await read('src/pages/admin/AdminTeams.tsx');
  assert.ok(source.includes("week.label + ' (' + week.rangeLabel + ') tracked time vs 40h reference'"));
  assert.ok(source.includes("week.label + ' (' + week.rangeLabel + ') planned allocation'"));
  assert.ok(source.includes("week.referencePercent + '% of 40h reference'"));
  assert.doesNotMatch(source, /tracked utilization/i);
  const planned = source.indexOf('slug="capacity-allocation-register"');
  const historical = source.indexOf('slug="capacity-allocation-table"');
  assert.ok(planned >= 0 && historical > planned, 'Planned allocations must remain separate from historical time records');
});
