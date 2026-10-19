import crypto from 'node:crypto';
import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Client } from 'pg';
import { loadPostgresMigrations } from '../server/postgres-migrations.ts';

const execFileAsync = promisify(execFile);

const backupPathArg = process.argv[2];
if (!backupPathArg) {
  throw new Error('Usage: tsx scripts/postgres-restore-rehearsal.ts <postgres-backup-file>');
}

const backupPath = fs.realpathSync(backupPathArg);
const targetUrlRaw = process.env.KAPITECH_POSTGRES_REHEARSAL_URL?.trim();
if (!targetUrlRaw) {
  throw new Error('KAPITECH_POSTGRES_REHEARSAL_URL is required.');
}

const productionUrlRaw = process.env.KAPITECH_POSTGRES_URL?.trim();
const targetUrl = new URL(targetUrlRaw);
if (!targetUrl.hostname) {
  throw new Error('KAPITECH_POSTGRES_REHEARSAL_URL is invalid.');
}
if (productionUrlRaw) {
  const productionUrl = new URL(productionUrlRaw);
  if (
    targetUrl.protocol === productionUrl.protocol &&
    targetUrl.hostname === productionUrl.hostname &&
    targetUrl.port === productionUrl.port &&
    targetUrl.pathname === productionUrl.pathname
  ) {
    throw new Error('PostgreSQL restore rehearsal target must not be the production database.');
  }
}

const stat = fs.statSync(backupPath);
if (!stat.isFile()) throw new Error('PostgreSQL backup path must be a file.');

const backup = fs.readFileSync(backupPath);
const backupSha256 = crypto.createHash('sha256').update(backup).digest('hex');
const isCustomDump = backup.subarray(0, 5).toString('ascii') === 'PGDMP';

function postgresCliEnv(): NodeJS.ProcessEnv {
  const url = new URL(targetUrlRaw);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.replace(/^\//, '')),
  };
  const sslmode = url.searchParams.get('sslmode');
  if (sslmode) env.PGSSLMODE = sslmode;
  return env;
}

function safeTargetLabel(): string {
  return targetUrl.hostname + (targetUrl.port ? ':' + targetUrl.port : '') + targetUrl.pathname;
}

async function queryTarget<T extends Record<string, unknown>>(sql: string): Promise<T[]> {
  const client = new Client({ connectionString: targetUrlRaw });
  await client.connect();
  try {
    const result = await client.query<T>(sql);
    return result.rows;
  } finally {
    await client.end();
  }
}

const before = await queryTarget<{ count: string }>(
  "SELECT COUNT(*)::bigint AS count FROM information_schema.tables WHERE table_schema = 'public'"
);
if (Number(before[0]?.count || 0) !== 0) {
  throw new Error('Restore rehearsal target must be an empty PostgreSQL database.');
}

const env = postgresCliEnv();
const cliArgs = isCustomDump
  ? ['--no-owner', '--exit-on-error', '--single-transaction', '--dbname=' + encodeURIComponent(env.PGDATABASE || ''), backupPath]
  : ['--set=ON_ERROR_STOP=1', '--single-transaction', '--dbname=' + encodeURIComponent(env.PGDATABASE || ''), '--file', backupPath];

const command = isCustomDump ? 'pg_restore' : 'psql';
await execFileAsync(command, cliArgs, { env, maxBuffer: 8 * 1024 * 1024 });

const requiredTables = ['schema_migrations', 'users', 'migration_runs', 'notification_settings', 'documents'];
const tableRows = await queryTarget<{ table_name: string }>(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
);
const tableNames = new Set(tableRows.map(row => String(row.table_name)));
const missingTables = requiredTables.filter(table => !tableNames.has(table));
if (missingTables.length) {
  throw new Error('Restored PostgreSQL database is missing required tables: ' + missingTables.join(', '));
}

const [migrationRows, migrationHistory, userRows] = await Promise.all([
  queryTarget<{ count: string }>('SELECT COUNT(*)::bigint AS count FROM schema_migrations'),
  queryTarget<{ version: string; checksum: string }>('SELECT version, checksum FROM schema_migrations ORDER BY version'),
  queryTarget<{ count: string }>('SELECT COUNT(*)::bigint AS count FROM users')
]);

const expectedMigrations = await loadPostgresMigrations();
const restoredByVersion = new Map(
  migrationHistory.map(row => [String(row.version), String(row.checksum || '').toLowerCase()])
);
const migrationChecksumsVerified =
  migrationHistory.length === expectedMigrations.length &&
  expectedMigrations.every(migration => restoredByVersion.get(migration.version) === migration.checksum);

if (!migrationChecksumsVerified) {
  throw new Error('Restored PostgreSQL migration history does not match the deployed migration versions/checksums.');
}

const result = {
  status: 'verified',
  restoredAt: new Date().toISOString(),
  backupSha256,
  backupBytes: backup.byteLength,
  format: isCustomDump ? 'custom' : 'plain',
  target: safeTargetLabel(),
  migrationCount: Number(migrationRows[0]?.count || 0),
  migrationChecksumsVerified,
  userCount: Number(userRows[0]?.count || 0),
  requiredTablesVerified: requiredTables
};

console.log(JSON.stringify(result, null, 2));
