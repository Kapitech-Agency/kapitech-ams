import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getDefaultRetainerRenewalDate } from '../src/lib/retainerDateDefaults';

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
