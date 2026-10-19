import assert from 'node:assert/strict';
import test from 'node:test';
import { getLocalDateOnly, matchesProjectDeadlineFilter, shiftLocalDateOnly } from '../src/lib/projectDeadlineFilters';

test('local date arithmetic preserves calendar boundaries and leap days', () => {
  assert.equal(shiftLocalDateOnly('2024-02-28', 1), '2024-02-29');
  assert.equal(shiftLocalDateOnly('2024-02-29', 1), '2024-03-01');
  assert.equal(shiftLocalDateOnly('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftLocalDateOnly('2026-10-19', 7), '2026-10-26');
  assert.equal(shiftLocalDateOnly('2026-02-30', 1), null);
  assert.equal(shiftLocalDateOnly('2026-10-19', 1.5), null);
});

test('the current calendar day belongs to the next-seven-day deadline filter, not overdue', () => {
  const today = '2026-10-19';
  assert.equal(matchesProjectDeadlineFilter({ targetEndDate: '2026-10-18', status: 'in_progress' }, 'overdue', today), true);
  assert.equal(matchesProjectDeadlineFilter({ targetEndDate: today, status: 'in_progress' }, 'overdue', today), false);
  assert.equal(matchesProjectDeadlineFilter({ targetEndDate: today, status: 'in_progress' }, 'next-7-days', today), true);
  assert.equal(matchesProjectDeadlineFilter({ targetEndDate: '2026-10-26', status: 'review' }, 'next-7-days', today), true);
  assert.equal(matchesProjectDeadlineFilter({ targetEndDate: '2026-10-27', status: 'review' }, 'next-7-days', today), false);
});

test('the 8–30 day window is disjoint from the next-seven-day window and includes day 30', () => {
  const today = '2026-10-19';
  assert.equal(matchesProjectDeadlineFilter({ targetEndDate: '2026-10-26', status: 'in_progress' }, 'days-8-30', today), false);
  assert.equal(matchesProjectDeadlineFilter({ targetEndDate: '2026-10-27', status: 'in_progress' }, 'days-8-30', today), true);
  assert.equal(matchesProjectDeadlineFilter({ targetEndDate: '2026-11-18', status: 'in_progress' }, 'days-8-30', today), true);
  assert.equal(matchesProjectDeadlineFilter({ targetEndDate: '2026-11-19', status: 'in_progress' }, 'days-8-30', today), false);
});

test('completed projects do not appear in active deadline urgency filters', () => {
  const completed = { targetEndDate: '2026-10-10', status: 'completed' };
  assert.equal(matchesProjectDeadlineFilter(completed, 'overdue', '2026-10-19'), false);
  assert.equal(matchesProjectDeadlineFilter({ ...completed, targetEndDate: '2026-10-22' }, 'next-7-days', '2026-10-19'), false);
  assert.equal(matchesProjectDeadlineFilter(completed, 'all', '2026-10-19'), true);
});

test('missing and invalid deadline values are explicit instead of being treated as upcoming or overdue', () => {
  const today = '2026-10-19';
  for (const targetEndDate of ['', 'not-a-date', '2026-02-30', null, undefined]) {
    assert.equal(matchesProjectDeadlineFilter({ targetEndDate }, 'no-deadline', today), true);
    assert.equal(matchesProjectDeadlineFilter({ targetEndDate }, 'overdue', today), false);
    assert.equal(matchesProjectDeadlineFilter({ targetEndDate }, 'next-7-days', today), false);
    assert.equal(matchesProjectDeadlineFilter({ targetEndDate }, 'days-8-30', today), false);
  }
});

test('invalid filter dates do not fabricate a deadline classification', () => {
  assert.equal(matchesProjectDeadlineFilter({ targetEndDate: '2026-11-01', status: 'active' }, 'overdue', 'not-a-date'), false);
  assert.equal(matchesProjectDeadlineFilter({ targetEndDate: '2026-11-01', status: 'active' }, 'next-7-days', 'not-a-date'), false);
  assert.equal(getLocalDateOnly(new Date(2026, 9, 19, 12)), '2026-10-19');
});
