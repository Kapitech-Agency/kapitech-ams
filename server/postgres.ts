import { Pool, type PoolClient } from 'pg';

let pool: Pool | null = null;

function requirePostgresUrl(): string {
  const url = process.env.KAPITECH_POSTGRES_URL?.trim();
  if (!url) {
    throw new Error(
      'KAPITECH_POSTGRES_URL is not configured. PostgreSQL access is opt-in and never falls back to the JSON database.'
    );
  }
  return url;
}

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function postgresSslConfig(): false | { rejectUnauthorized: boolean } {
  const mode = (process.env.KAPITECH_POSTGRES_SSL || 'require').trim().toLowerCase();
  if (mode === 'disable' || mode === 'false' || mode === 'off') return false;

  const rejectUnauthorized = !['false', '0', 'no'].includes(
    (process.env.KAPITECH_POSTGRES_SSL_REJECT_UNAUTHORIZED || 'true').trim().toLowerCase()
  );

  return { rejectUnauthorized };
}

export function getPostgresPool(): Pool {
  if (pool) return pool;

  pool = new Pool({
    connectionString: requirePostgresUrl(),
    ssl: postgresSslConfig(),
    max: readPositiveIntegerEnv('KAPITECH_POSTGRES_POOL_MAX', 10),
    idleTimeoutMillis: readPositiveIntegerEnv('KAPITECH_POSTGRES_IDLE_TIMEOUT_MS', 10_000),
    connectionTimeoutMillis: readPositiveIntegerEnv('KAPITECH_POSTGRES_CONNECTION_TIMEOUT_MS', 5_000),
    statement_timeout: readPositiveIntegerEnv('KAPITECH_POSTGRES_STATEMENT_TIMEOUT_MS', 15_000),
    application_name: 'kapitech-ams'
  });

  pool.on('error', (error) => {
    console.error('[PostgreSQL] Idle client error:', error);
  });

  return pool;
}

export async function query(text: string, values: unknown[] = []): Promise<unknown> {
  return getPostgresPool().query(text, values);
}

function isRetryableTransactionError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code || '')
    : '';
  return code === '40001' || code === '40P01';
}

export async function withPostgresTransaction<T>(
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const client = await getPostgresPool().connect();
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[PostgreSQL] Transaction rollback failed:', rollbackError);
      }
      if (!isRetryableTransactionError(error) || attempt === maxRetries) throw error;
      console.warn(`[PostgreSQL] Retrying transient transaction failure (attempt ${attempt + 2}/${maxRetries + 1}).`);
    } finally {
      client.release();
    }
  }

  throw new Error('PostgreSQL transaction retry loop exited unexpectedly.');
}

export async function checkPostgresConnection(): Promise<{ ok: boolean; latencyMs: number }> {
  const startedAt = Date.now();
  await query('SELECT 1');
  return { ok: true, latencyMs: Date.now() - startedAt };
}

export async function closePostgresPool(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
}
