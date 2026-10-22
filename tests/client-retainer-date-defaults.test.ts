import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { formatRetainerRenewalDate, getDefaultRetainerRenewalDate, getRetainerRenewalDays } from '../src/lib/retainerDateDefaults';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('retainer renewal defaults use the local calendar when UTC falls on the previous date', () => {
  const previousTimezone = process.env.TZ;
  process.env.TZ = 'Asia/Jakarta';
  try {
    // 17:30 UTC on 18 October is 00:30 on 19 October in Jakarta.
    const now = new Date('2026-10-18T17:30:00.000Z');
    assert.equal(getDefaultRetainerRenewalDate(now), '2026-11-19');
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test('retainer create and edit defaults share the local-date helper', async () => {
  const source = await fs.readFile(path.join(root, 'src/pages/admin/AdminClientRetainers.tsx'), 'utf8');
  assert.equal((source.match(/getDefaultRetainerRenewalDate\(\)/g) || []).length, 2);
  assert.match(source, /useState\(\(\) => getDefaultRetainerRenewalDate\(\)\)/);
  assert.match(source, /record\?\.renewal \|\| getDefaultRetainerRenewalDate\(\)/);
  assert.doesNotMatch(source, /new Date\(new Date\(\)\.setMonth[\s\S]{0,100}toISOString\(\)\.slice\(0,\s*10\)/);
});

test('retainer renewal timing uses local calendar days, not UTC midnight-to-now duration', () => {
  const previousTimezone = process.env.TZ;
  process.env.TZ = 'Asia/Jakarta';
  try {
    // This instant is 00:30 on 19 October in Jakarta, while UTC is still 18 October.
    const now = new Date('2026-10-18T17:30:00.000Z');
    assert.equal(getRetainerRenewalDays('2026-10-18', now), -1);
    assert.equal(getRetainerRenewalDays('2026-10-19', now), 0);
    assert.equal(getRetainerRenewalDays('2026-10-20', now), 1);
    assert.equal(getRetainerRenewalDays('2026-11-18', now), 30);
    assert.equal(getRetainerRenewalDays('2026-11-19', now), 31);
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test('retainer date display preserves date-only values in negative UTC timezones', () => {
  const previousTimezone = process.env.TZ;
  process.env.TZ = 'Pacific/Honolulu';
  try {
    assert.equal(formatRetainerRenewalDate('2026-10-19'), '19 Oct 2026');
    assert.equal(formatRetainerRenewalDate('2026-02-30'), 'Not set');
    assert.equal(getRetainerRenewalDays('2026-02-30', new Date('2026-02-01T12:00:00.000Z')), null);
    assert.equal(formatRetainerRenewalDate(''), 'Not set');
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test('Retainer Renewal Schedule derives date-only presentation from shared calendar helpers', async () => {
  const source = await fs.readFile(path.join(root, 'src/pages/admin/AdminClientRetainers.tsx'), 'utf8');
  assert.match(source, /const formatDate = \(value: string\) => formatRetainerRenewalDate\(value\)/);
  assert.match(source, /const renewalDays = \(value: string\) => getRetainerRenewalDays\(value\)/);
  assert.match(source, /const days = item\.renewalRecorded \? renewalDays\(item\.renewal\) : null;\s*return days !== null && days >= 0 && days <= 30;/);
  assert.match(source, /const renewalDateCount = records\.filter\(\(item\) => item\.renewalRecorded && renewalDays\(item\.renewal\) !== null\)\.length;/,
    'The renewal summary must exclude missing and invalid date-only values rather than treating them as upcoming.');
  assert.doesNotMatch(source, /Math\.ceil\(\(new Date\(value\)\.getTime\(\) - Date\.now\(\)\) \/ 86400000\)/);
});
