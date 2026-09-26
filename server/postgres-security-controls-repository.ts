import { getPostgresPool } from './postgres.ts';

interface RateLimitResult {
  allowed: boolean;
  count: number;
  remainingSeconds: number;
}

interface LoginLockoutResult {
  isLocked: boolean;
  failedAttempts: number;
  remainingSeconds: number;
}

const LOCKOUT_MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function keyPart(value: string): string {
  return String(value || 'unknown').trim().toLowerCase();
}

export class PostgresSecurityControlsRepository {
  async consumeRateLimit(
    bucketKey: string,
    maxRequests: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const result = await getPostgresPool().query<{
      request_count: number;
      expires_at: Date | string;
    }>(
      `INSERT INTO security_rate_limits
        (bucket_key, request_count, window_started_at, expires_at, updated_at)
       VALUES ($1, 1, NOW(), NOW() + ($2::double precision * INTERVAL '1 millisecond'), NOW())
       ON CONFLICT (bucket_key) DO UPDATE SET
         request_count = CASE
           WHEN security_rate_limits.expires_at <= NOW() THEN 1
           ELSE security_rate_limits.request_count + 1
         END,
         window_started_at = CASE
           WHEN security_rate_limits.expires_at <= NOW() THEN NOW()
           ELSE security_rate_limits.window_started_at
         END,
         expires_at = CASE
           WHEN security_rate_limits.expires_at <= NOW()
             THEN NOW() + ($2::double precision * INTERVAL '1 millisecond')
           ELSE security_rate_limits.expires_at
         END,
         updated_at = NOW()
       RETURNING request_count, expires_at`,
      [bucketKey, windowMs]
    );

    const row = result.rows[0];
    const count = Number(row?.request_count || 1);
    const expiresAt = row ? new Date(row.expires_at).getTime() : Date.now() + windowMs;
    const remainingSeconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));

    return {
      allowed: count <= maxRequests,
      count,
      remainingSeconds
    };
  }

  async checkLoginLockout(identifier: string, ip: string): Promise<LoginLockoutResult> {
    const lockoutKey = `${keyPart(identifier)}|${keyPart(ip)}`;
    const result = await getPostgresPool().query<{
      failed_attempts: number;
      lockout_until: Date | string | null;
    }>(
      'SELECT failed_attempts, lockout_until FROM security_login_lockouts WHERE lockout_key = $1 LIMIT 1',
      [lockoutKey]
    );
    const row = result.rows[0];
    if (!row) return { isLocked: false, failedAttempts: 0, remainingSeconds: 0 };

    if (row.lockout_until) {
      const remainingSeconds = Math.max(0, Math.ceil((new Date(row.lockout_until).getTime() - Date.now()) / 1000));
      if (remainingSeconds > 0) {
        return { isLocked: true, failedAttempts: Number(row.failed_attempts || 0), remainingSeconds };
      }
    }

    return { isLocked: false, failedAttempts: Number(row.failed_attempts || 0), remainingSeconds: 0 };
  }

  async recordFailedLogin(identifier: string, ip: string): Promise<LoginLockoutResult> {
    const lockoutKey = `${keyPart(identifier)}|${keyPart(ip)}`;
    const result = await getPostgresPool().query<{
      failed_attempts: number;
      lockout_until: Date | string | null;
    }>(
      `INSERT INTO security_login_lockouts
        (lockout_key, failed_attempts, lockout_until, updated_at)
       VALUES ($1, 1, NULL, NOW())
       ON CONFLICT (lockout_key) DO UPDATE SET
         failed_attempts = CASE
           WHEN security_login_lockouts.lockout_until IS NOT NULL
             AND security_login_lockouts.lockout_until <= NOW()
           THEN 1
           ELSE security_login_lockouts.failed_attempts + 1
         END,
         lockout_until = CASE
           WHEN (
             CASE
               WHEN security_login_lockouts.lockout_until IS NOT NULL
                 AND security_login_lockouts.lockout_until <= NOW()
               THEN 1
               ELSE security_login_lockouts.failed_attempts + 1
             END
           ) >= $2
           THEN NOW() + ($3::double precision * INTERVAL '1 millisecond')
           ELSE NULL
         END,
         updated_at = NOW()
       RETURNING failed_attempts, lockout_until`,
      [lockoutKey, LOCKOUT_MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MS]
    );

    const row = result.rows[0];
    const failedAttempts = Number(row?.failed_attempts || 1);
    const lockoutUntil = row?.lockout_until ? new Date(row.lockout_until).getTime() : 0;
    const remainingSeconds = lockoutUntil > Date.now()
      ? Math.ceil((lockoutUntil - Date.now()) / 1000)
      : 0;

    return {
      isLocked: remainingSeconds > 0,
      failedAttempts,
      remainingSeconds
    };
  }

  async clearLoginLockout(identifier: string, ip: string): Promise<void> {
    const lockoutKey = `${keyPart(identifier)}|${keyPart(ip)}`;
    await getPostgresPool().query(
      'DELETE FROM security_login_lockouts WHERE lockout_key = $1',
      [lockoutKey]
    );
  }

  async cleanupExpired(): Promise<void> {
    await getPostgresPool().query(
      'DELETE FROM security_rate_limits WHERE expires_at <= NOW()'
    );
    await getPostgresPool().query(
      'DELETE FROM security_login_lockouts WHERE lockout_until IS NULL OR lockout_until <= NOW()'
    );
  }
}

export const postgresSecurityControlsRepository = new PostgresSecurityControlsRepository();
