import test from 'node:test';
import assert from 'node:assert/strict';

test('application data repository defaults to JSON', async () => {
  const previous = process.env.KAPITECH_DATA_SOURCE;
  delete process.env.KAPITECH_DATA_SOURCE;
  const { getApplicationDatabaseRepository } = await import('../server/application-data-repository.ts');
  const repository = getApplicationDatabaseRepository();
  assert.equal(typeof repository.loadDatabase, 'function');
  if (previous === undefined) delete process.env.KAPITECH_DATA_SOURCE;
  else process.env.KAPITECH_DATA_SOURCE = previous;
});

test('application data repository selects PostgreSQL explicitly', async () => {
  const previous = process.env.KAPITECH_DATA_SOURCE;
  process.env.KAPITECH_DATA_SOURCE = 'postgres';
  const { getApplicationDatabaseRepository } = await import('../server/application-data-repository.ts');
  const repository = getApplicationDatabaseRepository();
  assert.equal(repository.constructor.name, 'PostgresDatabaseRepository');
  if (previous === undefined) delete process.env.KAPITECH_DATA_SOURCE;
  else process.env.KAPITECH_DATA_SOURCE = previous;
});

test('application data repository rejects an invalid data source', async () => {
  const previous = process.env.KAPITECH_DATA_SOURCE;
  process.env.KAPITECH_DATA_SOURCE = 'sqlite';
  const { getApplicationDatabaseRepository } = await import('../server/application-data-repository.ts');
  assert.throws(() => getApplicationDatabaseRepository(), /KAPITECH_DATA_SOURCE/);
  if (previous === undefined) delete process.env.KAPITECH_DATA_SOURCE;
  else process.env.KAPITECH_DATA_SOURCE = previous;
});
