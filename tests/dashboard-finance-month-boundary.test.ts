import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('dashboard finance month key uses Kapitech local time', () => {
  const source = fs.readFileSync('server/routes.ts', 'utf8');
  assert.match(source, /Intl\.DateTimeFormat\('en-CA',\{timeZone:'Asia\/Jakarta',year:'numeric',month:'2-digit'\}\)/);
});
