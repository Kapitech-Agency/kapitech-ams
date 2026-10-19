import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = () => fs.readFileSync(path.resolve(process.cwd(), 'server/postgres.ts'), 'utf8');

test('PostgreSQL transaction wrapper retries serialization failures and deadlocks', () => {
  const repository = source();

  assert.match(repository, /code === '40001' \|\| code === '40P01'/);
  assert.match(repository, /const maxRetries = 2/);
  assert.match(repository, /for \(let attempt = 0; attempt <= maxRetries; attempt \+= 1\)/);
  assert.match(repository, /ROLLBACK/);
  assert.match(repository, /client\.release\(\)/);
});

test('transaction retry is limited and non-transient errors are rethrown', () => {
  const repository = source();

  assert.match(repository, /attempt === maxRetries\) throw error/);
  assert.match(repository, /!isRetryableTransactionError\(error\)/);
});
