import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Production startup requires PostgreSQL and encryption configuration', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
  assert.ok(source.includes('Production runtime requires KAPITECH_DATA_SOURCE=postgres'));
  assert.ok(source.includes('Production runtime requires KAPITECH_POSTGRES_URL.'));
  assert.ok(source.includes('Production runtime requires KAPITECH_DATA_ENCRYPTION_KEY.'));
});

test('Production environment example does not contain a usable default password or JSON datasource', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf8');
  assert.ok(source.includes('ADMIN_INITIAL_PASSWORD='));
  assert.ok(!source.includes('ADMIN_INITIAL_PASSWORD=change-this-in-hostinger'));
  assert.ok(source.includes('KAPITECH_DATA_SOURCE=postgres'));
});
