export type DataSourceMode = 'json' | 'postgres';

export function getDataSourceMode(): DataSourceMode {
  const mode = (process.env.KAPITECH_DATA_SOURCE || 'json').trim().toLowerCase();
  if (mode === 'postgres') return 'postgres';
  if (mode === 'json') return 'json';
  throw new Error('KAPITECH_DATA_SOURCE must be either json or postgres.');
}

export function isPostgresDataSource(): boolean {
  return getDataSourceMode() === 'postgres';
}

export function assertPostgresCutoverReady(gates: {
  reconciliation: boolean;
  restoreRehearsal: boolean;
  migrationComplete: boolean;
}): void {
  if (!gates.reconciliation || !gates.restoreRehearsal || !gates.migrationComplete) {
    throw new Error(
      'PostgreSQL cutover is blocked until reconciliation, restore rehearsal, and migration gates all pass.'
    );
  }
}
