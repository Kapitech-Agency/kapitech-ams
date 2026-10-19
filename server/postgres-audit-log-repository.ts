import crypto from 'crypto';
import { getPostgresPool } from './postgres.ts';

type Row = Record<string, any>;

export type AuditEntry = { action: string; actor: string; actorRole: string; actorUserId?: string; ip?: string; userAgent?: string; details: string; severity?: string; };

const iso = (value: any): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const computeHash = (log: {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  actorRole: string;
  ip: string;
  userAgent: string;
  details: string;
  severity: string;
  prevHash: string;
}): string => crypto.createHash('sha256').update(JSON.stringify(log)).digest('hex');

const mapAuditLog = (row: Row): any => ({
  id: row.id,
  timestamp: iso(row.timestamp),
  action: row.action,
  actor: row.actor,
  actorRole: row.actor_role,
  actorUserId: row.actor_user_id || undefined,
  ip: row.ip || '127.0.0.1',
  userAgent: row.user_agent || 'unknown',
  details: row.details,
  severity: row.severity || 'info',
  prevHash: row.prev_hash,
  hash: row.hash,
  ...(row.metadata && typeof row.metadata === 'object' ? row.metadata : {})
});

export class PostgresAuditLogRepository {
  async list(limit = 1000): Promise<any[]> {
    const safeLimit = Math.min(5000, Math.max(1, Math.floor(limit)));
    const { rows } = await getPostgresPool().query(
      `SELECT * FROM audit_logs ORDER BY sequence DESC LIMIT ${safeLimit}`
    );
    return rows.map(mapAuditLog);
  }

  async appendWithinTransaction(client: { query: (text: string, values?: unknown[]) => Promise<any> }, entry: AuditEntry): Promise<any> {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('kapitech:ams:audit-chain', 0))");
    const latest = await client.query('SELECT hash FROM audit_logs ORDER BY sequence DESC LIMIT 1 FOR UPDATE');
    const previousHash = latest.rows[0]?.hash || 'GENESIS';
    const id = `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();
    const normalized = { id, timestamp, action: entry.action, actor: entry.actor || 'anonymous', actorRole: entry.actorRole || 'visitor', ip: entry.ip || '127.0.0.1', userAgent: entry.userAgent || 'unknown', details: entry.details, severity: entry.severity || 'info', prevHash: previousHash };
    const hash = computeHash(normalized);
    const { rows } = await client.query(`INSERT INTO audit_logs (id,timestamp,action,actor,actor_role,actor_user_id,ip,user_agent,details,severity,prev_hash,hash,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'{}'::jsonb) RETURNING *`, [id,timestamp,normalized.action,normalized.actor,normalized.actorRole,entry.actorUserId || null,normalized.ip,normalized.userAgent,normalized.details,normalized.severity,previousHash,hash]);
    return mapAuditLog(rows[0]);
  }

  async append(entry: AuditEntry): Promise<any> {
    const client = await getPostgresPool().connect();
    try { await client.query('BEGIN'); const result = await this.appendWithinTransaction(client, entry); await client.query('COMMIT'); return result; }
    catch (error) { try { await client.query('ROLLBACK'); } catch {} throw error; }
    finally { client.release(); }
  }
  async verifyChain(): Promise<{ valid: boolean; checked: number; brokenAt?: string }> {
    const { rows } = await getPostgresPool().query(
      'SELECT * FROM audit_logs ORDER BY sequence DESC'
    );
    let previousHash = 'GENESIS';
    let checked = 0;
    for (let index = rows.length - 1; index >= 0; index -= 1) {
      const row = rows[index];
      const normalized = {
        id: row.id,
        timestamp: iso(row.timestamp),
        action: row.action,
        actor: row.actor,
        actorRole: row.actor_role,
        ip: row.ip || '127.0.0.1',
        userAgent: row.user_agent || 'unknown',
        details: row.details,
        severity: row.severity || 'info',
        prevHash: row.prev_hash || previousHash
      };
      const expected = computeHash(normalized);
      checked += 1;
      if (row.prev_hash !== normalized.prevHash || row.hash !== expected) {
        return { valid: false, checked, brokenAt: row.id };
      }
      previousHash = expected;
    }
    return { valid: true, checked };
  }
}

export const postgresAuditLogRepository = new PostgresAuditLogRepository();
