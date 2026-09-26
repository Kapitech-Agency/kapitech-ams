import assert from 'node:assert/strict';
import test from 'node:test';

test('JSON remains the default source until explicit PostgreSQL opt-in', async () => {
  const module = await import('../server/data-source.ts');
  const original = process.env.KAPITECH_DATA_SOURCE;
  delete process.env.KAPITECH_DATA_SOURCE;
  assert.equal(module.getDataSourceMode(), 'json');
  if (original === undefined) delete process.env.KAPITECH_DATA_SOURCE;
  else process.env.KAPITECH_DATA_SOURCE = original;
});

test('invalid data-source mode fails closed', async () => {
  const module = await import('../server/data-source.ts');
  const original = process.env.KAPITECH_DATA_SOURCE;
  process.env.KAPITECH_DATA_SOURCE = 'invalid';
  assert.throws(() => module.getDataSourceMode(), /must be either json or postgres/);
  if (original === undefined) delete process.env.KAPITECH_DATA_SOURCE;
  else process.env.KAPITECH_DATA_SOURCE = original;
});

test('PostgreSQL cutover requires all safety gates', async () => {
  const module = await import('../server/data-source.ts');
  assert.throws(
    () => module.assertPostgresCutoverReady({
      reconciliation: true,
      restoreRehearsal: true,
      migrationComplete: false
    }),
    /cutover is blocked/
  );
  assert.doesNotThrow(() => module.assertPostgresCutoverReady({
    reconciliation: true,
    restoreRehearsal: true,
    migrationComplete: true
  }));
});
