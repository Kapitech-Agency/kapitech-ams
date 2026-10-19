import { closePostgresPool } from '../server/postgres.ts';
import { runPostgresMigrations } from '../server/postgres-migrations.ts';

async function main(): Promise<void> {
  try {
    const applied = await runPostgresMigrations();
    for (const version of applied) console.log('[PostgreSQL] Migration ' + version + ' is applied.');
  } finally {
    await closePostgresPool();
  }
}

main().catch(error => {
  console.error('[PostgreSQL] Migration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});