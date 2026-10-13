import assert from 'node:assert/strict';
import test from 'node:test';
import {
  convertReportingPeriodValue,
  formatReportingPeriodLabel,
  getCurrentReportingPeriodValue,
  getPreviousReportingPeriodValue,
  getReportingPeriodRange,
  setReportingPeriodYear
} from '../src/lib/reportingPeriods.ts';

test('monthly reporting period includes the entire selected month and handles leap years', () => {
  const february = getReportingPeriodRange('2024-02', 'month', 'en-US');
  assert.ok(february);
  assert.equal(february.startDate, '2024-02-01');
  assert.equal(february.endDate, '2024-02-29');
  assert.equal(february.startMonth, '2024-02');
  assert.equal(february.endMonth, '2024-02');
});

test('quarter reporting periods cover exactly three calendar months', () => {
  const q1 = getReportingPeriodRange('2026-Q1', 'quarter', 'en-US');
  const q4 = getReportingPeriodRange('2026-Q4', 'quarter', 'en-US');
  assert.ok(q1 && q4);
  assert.equal(q1.startMonth, '2026-01');
  assert.equal(q1.endMonth, '2026-03');
  assert.equal(q1.endDate, '2026-03-31');
  assert.equal(q4.startDate, '2026-10-01');
  assert.equal(q4.endDate, '2026-12-31');
  assert.match(q1.label, /Q1/);
});

test('year reporting periods include January through December', () => {
  const year = getReportingPeriodRange('2025', 'year');
  assert.ok(year);
  assert.equal(year.startDate, '2025-01-01');
  assert.equal(year.endDate, '2025-12-31');
});

test('previous-month and previous-quarter shortcuts roll across year boundaries', () => {
  assert.equal(getPreviousReportingPeriodValue('2026-01', 'month'), '2025-12');
  assert.equal(getPreviousReportingPeriodValue('2026-Q1', 'quarter'), '2025-Q4');
  assert.equal(getPreviousReportingPeriodValue('2026', 'year'), '2025');
});

test('year-over-year comparison preserves month and quarter', () => {
  assert.equal(getPreviousReportingPeriodValue('2026-10', 'month', 'previous-year'), '2025-10');
  assert.equal(getPreviousReportingPeriodValue('2026-Q3', 'quarter', 'previous-year'), '2025-Q3');
});

test('period changes preserve the relevant year and calendar quarter', () => {
  assert.equal(convertReportingPeriodValue('2026-05', 'month', 'quarter'), '2026-Q2');
  assert.equal(convertReportingPeriodValue('2026-Q3', 'quarter', 'month'), '2026-07');
  assert.equal(convertReportingPeriodValue('2026-Q3', 'quarter', 'year'), '2026');
  assert.equal(setReportingPeriodYear('2026-Q3', 'quarter', 2024), '2024-Q3');
  assert.equal(setReportingPeriodYear('2026-05', 'month', 2024), '2024-05');
  assert.equal(getCurrentReportingPeriodValue('year', new Date(2024, 2, 4)), '2024');
});

test('invalid reporting period strings are rejected rather than widened to a different period', () => {
  assert.equal(getReportingPeriodRange('2026-Q5', 'quarter'), null);
  assert.equal(getReportingPeriodRange('2026-13', 'month'), null);
  assert.equal(getReportingPeriodRange('FY2026', 'year'), null);
  assert.equal(formatReportingPeriodLabel('2026-Q5', 'quarter'), '2026-Q5');
});
