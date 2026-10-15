import crypto from 'node:crypto';
import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

export type ClientInteractionType = 'call' | 'email' | 'meeting' | 'message' | 'note';

export type ClientInteractionInput = {
  id: string;
  clientId: string;
  type: ClientInteractionType;
  subject: string;
  summary: string;
  contactName: string;
  outcome: string;
  nextStep: string;
  occurredAt: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
};

type ClientInteractionRow = {
  id: string;
  client_id: string;
  interaction_type: ClientInteractionType;
  subject: string;
  summary: string;
  contact_name: string | null;
  outcome: string | null;
  next_step: string | null;
  occurred_at: Date | string;
  created_by_user_id: string | null;
  created_by_name: string;
  created_at: Date | string;
};

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

function mapInteraction(row: ClientInteractionRow) {
  return {
    id: row.id,
    clientId: row.client_id,
    type: row.interaction_type,
    subject: row.subject,
    summary: row.summary,
    contactName: row.contact_name || '',
    outcome: row.outcome || '',
    nextStep: row.next_step || '',
    occurredAt: iso(row.occurred_at),
    createdByUserId: row.created_by_user_id || '',
    createdByName: row.created_by_name,
    createdAt: iso(row.created_at)
  };
}

export class PostgresClientInteractionRepository {
  async listByClientId(clientId: string, limit = 200): Promise<ReturnType<typeof mapInteraction>[]> {
    const safeLimit = Math.min(200, Math.max(1, Math.floor(limit)));
    const result = await getPostgresPool().query<ClientInteractionRow>(
      `SELECT * FROM client_interactions
       WHERE client_id = $1
       ORDER BY occurred_at DESC, created_at DESC
       LIMIT ${safeLimit}`,
      [clientId]
    );
    return result.rows.map(mapInteraction);
  }

  async create(input: ClientInteractionInput, audit?: AuditEntry): Promise<ReturnType<typeof mapInteraction>> {
    return withPostgresTransaction(async client => {
      const linkedClient = await client.query('SELECT id FROM clients WHERE id = $1 FOR KEY SHARE', [input.clientId]);
      if (!linkedClient.rows[0]) throw new Error('CLIENT_NOT_FOUND');

      const result = await client.query<ClientInteractionRow>(
        `INSERT INTO client_interactions
          (id, client_id, interaction_type, subject, summary, contact_name, outcome, next_step,
           occurred_at, created_by_user_id, created_by_name, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [
          input.id,
          input.clientId,
          input.type,
          input.subject,
          input.summary,
          input.contactName || '',
          input.outcome || '',
          input.nextStep || '',
          input.occurredAt,
          input.createdByUserId || null,
          input.createdByName,
          input.createdAt
        ]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapInteraction(result.rows[0]);
    });
  }
}

export const postgresClientInteractionRepository = new PostgresClientInteractionRepository();
