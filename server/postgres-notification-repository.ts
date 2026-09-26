import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type Row = Record<string, any>;

const iso = (value: any): string =>
  value == null ? new Date().toISOString() : value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const parseReadBy = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(item => String(item)).filter(Boolean) : [];

const mapNotification = (row: Row): any => ({
  id: String(row.id),
  title: String(row.title || ''),
  message: String(row.message || ''),
  type: String(row.type || 'system'),
  severity: String(row.severity || 'info'),
  read: Boolean(row.read),
  readBy: parseReadBy(row.read_by),
  recipientUserId: row.recipient_user_id ? String(row.recipient_user_id) : undefined,
  linkUrl: row.link_url ? String(row.link_url) : '/admin/dashboard',
  timestamp: iso(row.created_at),
  createdAt: iso(row.created_at),
  metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {}
});

export class PostgresNotificationRepository {
  async list(): Promise<any[]> {
    const { rows } = await getPostgresPool().query(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 500'
    );
    return rows.map(mapNotification);
  }

  async create(input: {
    id: string;
    title: string;
    message: string;
    type: string;
    severity?: string;
    recipientUserId?: string;
    linkUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<any> {
    const { rows } = await getPostgresPool().query(
      `INSERT INTO notifications
        (id, title, message, type, severity, read, read_by, recipient_user_id, link_url, created_at, metadata)
       VALUES ($1,$2,$3,$4,$5,FALSE,'[]'::jsonb,$6,$7,NOW(),$8::jsonb)
       RETURNING *`,
      [
        input.id,
        input.title,
        input.message,
        input.type,
        input.severity || 'info',
        input.recipientUserId || null,
        input.linkUrl || '/admin/dashboard',
        JSON.stringify(input.metadata || {})
      ]
    );
    return mapNotification(rows[0]);
  }

  async markRead(id: string, userId: string, audit?: AuditEntry): Promise<any | null> {
    return withPostgresTransaction(async client => {
      const { rows } = await client.query(
        `UPDATE notifications
         SET read_by = CASE
           WHEN read_by @> $2::jsonb THEN read_by
           ELSE read_by || $2::jsonb
         END,
         read = TRUE
         WHERE id = $1
           AND (recipient_user_id IS NULL OR recipient_user_id = $3)
         RETURNING *`,
        [id, JSON.stringify([userId]), userId]
      );
      if (!rows[0]) return null;
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapNotification(rows[0]);
    });
  }

  async markAllRead(userId: string, hiddenTypes: string[] = [], audit?: AuditEntry): Promise<number> {
    return withPostgresTransaction(async client => {
      const { rowCount } = await client.query(
        `UPDATE notifications
         SET read_by = (
           SELECT COALESCE(jsonb_agg(DISTINCT value), '[]'::jsonb)
           FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(read_by) = 'array' THEN read_by ELSE '[]'::jsonb END
             || $1::jsonb
           ) AS value
         ),
         read = TRUE
         WHERE (recipient_user_id IS NULL OR recipient_user_id = $2)
           AND NOT (type = ANY($3::text[]))`,
        [JSON.stringify([userId]), userId, hiddenTypes]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return rowCount || 0;
    });
  }

  async findById(id: string): Promise<any | null> {
    const { rows } = await getPostgresPool().query(
      'SELECT * FROM notifications WHERE id = $1',
      [id]
    );
    return rows[0] ? mapNotification(rows[0]) : null;
  }
}

export const postgresNotificationRepository = new PostgresNotificationRepository();
