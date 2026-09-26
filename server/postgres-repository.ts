import type { PoolClient } from 'pg';
import type { StoredSession, StoredUser } from './db.ts';
import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';
import { decryptSecret, encryptOptionalSecret, isEncryptedSecret } from './secret-crypto.ts';

type UserRow = {
  id: string; name: string; username: string; email: string; password_hash: string; salt: string;
  password_algorithm: string; role: string; stakeholder_type: StoredUser['stakeholderType'];
  permissions: StoredUser['permissions']; mfa_enabled: boolean; mfa_secret: string | null;
  mfa_pending_secret: string | null; mfa_pending_secret_created_at: Date | string | null;
  mfa_recovery_code_hashes: string[]; division: StoredUser['division'];
  status: StoredUser['status']; last_login: Date | string | null; created_at: Date | string;
};

type SessionRow = {
  token_hash: string; user_id: string; created_at: Date | string; last_activity_at: Date | string;
  expires_at: Date | string; remember_me: boolean; ip: string | null; user_agent: string;
  kind: 'session' | 'mfa'; mfa_failed_attempts: number;
};

function iso(value: Date | string | null): string {
  if (value === null) return '';
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function nullableIso(value: Date | string | null): string | undefined {
  return value === null ? undefined : iso(value);
}

function mapUser(row: UserRow): StoredUser {
  return {
    id: row.id, name: row.name, username: row.username, email: row.email,
    passwordHash: row.password_hash, salt: row.salt,
    passwordAlgorithm: row.password_algorithm as StoredUser['passwordAlgorithm'],
    role: row.role, stakeholderType: row.stakeholder_type, permissions: row.permissions,
    mfaEnabled: row.mfa_enabled, mfaSecret: decryptSecret(row.mfa_secret),
    mfaPendingSecret: decryptSecret(row.mfa_pending_secret),
    mfaPendingSecretCreatedAt: nullableIso(row.mfa_pending_secret_created_at),
    mfaRecoveryCodeHashes: Array.isArray(row.mfa_recovery_code_hashes) ? row.mfa_recovery_code_hashes : [],
    division: row.division, status: row.status,
    lastLogin: nullableIso(row.last_login) || '', createdAt: iso(row.created_at)
  };
}

function mapSession(row: SessionRow): StoredSession {
  return {
    tokenHash: row.token_hash, userId: row.user_id, createdAt: iso(row.created_at),
    lastActivityAt: iso(row.last_activity_at), expiresAt: new Date(row.expires_at).getTime(),
    rememberMe: row.remember_me, ip: row.ip ?? '', userAgent: row.user_agent,
    kind: row.kind, mfaFailedAttempts: row.mfa_failed_attempts
  };
}

async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPostgresPool().connect();
  try { return await fn(client); } finally { client.release(); }
}

export class PostgresAuthRepository {
  async findUserById(id: string): Promise<StoredUser | null> {
    const result = await getPostgresPool().query<UserRow>(
      'SELECT * FROM users WHERE id = $1 LIMIT 1', [id]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async findUserByIdentifier(identifier: string): Promise<StoredUser | null> {
    const result = await getPostgresPool().query<UserRow>(
      'SELECT * FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($1) LIMIT 1', [identifier]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async findUserByFirebaseUid(firebaseUid: string): Promise<StoredUser | null> {
    const result = await getPostgresPool().query<UserRow>(
      'SELECT * FROM users WHERE firebase_uid = $1 LIMIT 1', [firebaseUid]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async linkFirebaseUid(userId: string, firebaseUid: string): Promise<boolean> {
    const result = await getPostgresPool().query(
      'UPDATE users SET firebase_uid = $2 WHERE id = $1 AND firebase_uid IS NULL RETURNING id',
      [userId, firebaseUid]
    );
    return result.rowCount === 1;
  }

  async findUserByUsername(username: string): Promise<StoredUser | null> {
    const result = await getPostgresPool().query<UserRow>(
      'SELECT * FROM users WHERE username = $1 LIMIT 1', [username]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async findSession(tokenHash: string): Promise<StoredSession | null> {
    const result = await getPostgresPool().query<SessionRow>(
      'SELECT * FROM sessions WHERE token_hash = $1 LIMIT 1', [tokenHash]
    );
    return result.rows[0] ? mapSession(result.rows[0]) : null;
  }

  async createSession(session: StoredSession): Promise<void> {
    await getPostgresPool().query(
      `INSERT INTO sessions
        (token_hash,user_id,created_at,last_activity_at,expires_at,remember_me,ip,user_agent,kind,mfa_failed_attempts)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [session.tokenHash, session.userId, session.createdAt, session.lastActivityAt,
       new Date(session.expiresAt), session.rememberMe, session.ip || null, session.userAgent,
       session.kind || 'session', session.mfaFailedAttempts || 0]
    );
  }

  async updateSessionActivity(tokenHash: string, lastActivityAt: string, expiresAt?: number): Promise<boolean> {
    const result = await getPostgresPool().query(
      expiresAt === undefined
        ? 'UPDATE sessions SET last_activity_at = $2 WHERE token_hash = $1'
        : 'UPDATE sessions SET last_activity_at = $2, expires_at = $3 WHERE token_hash = $1',
      expiresAt === undefined
        ? [tokenHash, lastActivityAt]
        : [tokenHash, lastActivityAt, new Date(expiresAt)]
    );
    return result.rowCount === 1;
  }

  async updateMfaFailedAttempts(tokenHash: string, attempts = 1): Promise<number> {
    // MFA failure tracking is security-sensitive: the increment and validity
    // check must happen in one SQL statement so concurrent attempts cannot
    // overwrite each other's counters or increment an expired/non-MFA session.
    const result = await getPostgresPool().query<{ mfa_failed_attempts: number }>(
      `UPDATE sessions
       SET mfa_failed_attempts = mfa_failed_attempts + GREATEST(1, $2)
       WHERE token_hash = $1
         AND kind = 'mfa'
         AND expires_at > NOW()
       RETURNING mfa_failed_attempts`,
      [tokenHash, Math.max(1, Math.floor(attempts))]
    );
    return result.rows[0] ? Number(result.rows[0].mfa_failed_attempts) : 0;
  }

  async pruneUserSessions(userId: string, maxSessions = 5): Promise<void> {
    await getPostgresPool().query(
      `DELETE FROM sessions
       WHERE user_id = $1
         AND token_hash NOT IN (
           SELECT token_hash FROM sessions
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT $2
         )`,
      [userId, maxSessions]
    );
  }

  async deleteSession(tokenHash: string): Promise<boolean> {
    const result = await getPostgresPool().query(
      'DELETE FROM sessions WHERE token_hash = $1', [tokenHash]
    );
    return result.rowCount === 1;
  }

  async revokeUserSessions(userId: string, exceptTokenHash?: string): Promise<number> {
    const result = await getPostgresPool().query(
      exceptTokenHash
        ? 'DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2'
        : 'DELETE FROM sessions WHERE user_id = $1',
      exceptTokenHash ? [userId, exceptTokenHash] : [userId]
    );
    return result.rowCount ?? 0;
  }

  async updateUserPassword(userId: string, passwordHash: string, salt: string, passwordAlgorithm: string, options?: { exceptTokenHash?: string; audit?: AuditEntry }): Promise<boolean> {
    return withPostgresTransaction(async client => {
      const result = await client.query(
        'UPDATE users SET password_hash = $2, salt = $3, password_algorithm = $4 WHERE id = $1',
        [userId, passwordHash, salt, passwordAlgorithm]
      );
      if (result.rowCount !== 1) return false;
      if (options?.exceptTokenHash !== undefined) {
        await client.query('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2', [userId, options.exceptTokenHash]);
      }
      if (options?.audit) await postgresAuditLogRepository.appendWithinTransaction(client, options.audit);
      return true;
    });
  }

  async touchUserLastLogin(userId: string, lastLogin: string): Promise<boolean> {
    const result = await getPostgresPool().query(
      'UPDATE users SET last_login = $2 WHERE id = $1', [userId, lastLogin]
    );
    return result.rowCount === 1;
  }

  async updateUserMfa(userId: string, values: {
    mfaEnabled: boolean; mfaSecret: string | null; mfaPendingSecret?: string | null;
    mfaPendingSecretCreatedAt?: string | null; mfaRecoveryCodeHashes: string[];
  }, options?: { revokeAllSessions?: boolean; exceptTokenHash?: string; audit?: AuditEntry }): Promise<boolean> {
    return withPostgresTransaction(async client => {
      const result = await client.query(
        `UPDATE users SET
          mfa_enabled = $2, mfa_secret = $3, mfa_pending_secret = $4,
          mfa_pending_secret_created_at = $5, mfa_recovery_code_hashes = $6
         WHERE id = $1`,
        [userId, values.mfaEnabled, encryptOptionalSecret(values.mfaSecret), encryptOptionalSecret(values.mfaPendingSecret),
         values.mfaPendingSecretCreatedAt ?? null, JSON.stringify(values.mfaRecoveryCodeHashes)]
      );
      if (result.rowCount !== 1) return false;
      if (options?.revokeAllSessions) {
        await client.query(
          options.exceptTokenHash
            ? 'DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2'
            : 'DELETE FROM sessions WHERE user_id = $1',
          options.exceptTokenHash ? [userId, options.exceptTokenHash] : [userId]
        );
      }
      if (options?.audit) await postgresAuditLogRepository.appendWithinTransaction(client, options.audit);
      return true;
    });
  }

  async migrateLegacyMfaSecrets(): Promise<number> {
    const result = await getPostgresPool().query<{
      id: string;
      mfa_secret: string | null;
      mfa_pending_secret: string | null;
    }>('SELECT id, mfa_secret, mfa_pending_secret FROM users WHERE mfa_secret IS NOT NULL OR mfa_pending_secret IS NOT NULL');

    let migrated = 0;
    for (const row of result.rows) {
      const secretNeedsMigration = row.mfa_secret !== null && !isEncryptedSecret(row.mfa_secret);
      const pendingNeedsMigration = row.mfa_pending_secret !== null && !isEncryptedSecret(row.mfa_pending_secret);
      if (!secretNeedsMigration && !pendingNeedsMigration) continue;

      await getPostgresPool().query(
        'UPDATE users SET mfa_secret = CASE WHEN $2 THEN $3 ELSE mfa_secret END, mfa_pending_secret = CASE WHEN $4 THEN $5 ELSE mfa_pending_secret END WHERE id = $1',
        [
          row.id,
          secretNeedsMigration,
          secretNeedsMigration ? encryptOptionalSecret(row.mfa_secret) : null,
          pendingNeedsMigration,
          pendingNeedsMigration ? encryptOptionalSecret(row.mfa_pending_secret) : null
        ]
      );
      migrated += 1;
    }

    return migrated;
  }

  async listUsers(): Promise<StoredUser[]> {
    const result = await getPostgresPool().query<UserRow>('SELECT * FROM users ORDER BY created_at ASC');
    return result.rows.map(mapUser);
  }

  async deleteUser(userId: string, audit?: AuditEntry): Promise<boolean> {
    return withPostgresTransaction(async client => {
      const result = await client.query(
        'DELETE FROM users WHERE id = $1 AND stakeholder_type <> $2 AND username <> $3 RETURNING id',
        [userId, 'Master', 'admin']
      );
      if (result.rowCount !== 1) return false;
      await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return true;
    });
  }

  async updateUserPolicy(userId: string, name: string, role: string, stakeholderType: string, permissions: StoredUser['permissions'], division: string, status: StoredUser['status'], audit?: AuditEntry): Promise<StoredUser | null> {
    return withPostgresTransaction(async client => {
      const result = await client.query<UserRow>(
        `UPDATE users SET name=$2, role=$3, stakeholder_type=$4, permissions=$5, division=$6, status=$7 WHERE id=$1 RETURNING *`,
        [userId, name, role, stakeholderType, JSON.stringify(permissions), division, status]
      );
      if (!result.rows[0]) return null;
      if (status === 'suspended') {
        await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
      }
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapUser(result.rows[0]);
    });
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await getPostgresPool().query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  }

  async createUser(user: StoredUser, audit?: AuditEntry): Promise<void> {
    return withPostgresTransaction(async client => {
      await client.query(
        `INSERT INTO users
         (id,name,username,email,password_hash,salt,password_algorithm,role,stakeholder_type,permissions,
          mfa_enabled,mfa_secret,mfa_pending_secret,mfa_pending_secret_created_at,mfa_recovery_code_hashes,
          division,status,last_login,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [user.id,user.name,user.username,user.email,user.passwordHash,user.salt,user.passwordAlgorithm || 'pbkdf2-sha512',
         user.role,user.stakeholderType,JSON.stringify(user.permissions),user.mfaEnabled,encryptOptionalSecret(user.mfaSecret),
         encryptOptionalSecret(user.mfaPendingSecret),user.mfaPendingSecretCreatedAt || null,JSON.stringify(user.mfaRecoveryCodeHashes || []),
         user.division,user.status,user.lastLogin || null,user.createdAt]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
    });
  }
}

export const postgresAuthRepository = new PostgresAuthRepository();
