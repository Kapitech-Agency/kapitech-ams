import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type Row = Record<string, any>;
const iso = (v: Date | string): string => v instanceof Date ? v.toISOString() : new Date(v).toISOString();
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' ? v as Record<string, unknown> : {};

function mapLead(row: Row): any {
  const metadata = obj(row.metadata);
  return {
    ...(metadata as Record<string, unknown>),
    id: row.id,
    fullName: row.full_name,
    email: row.email ?? '',
    company: row.company ?? '',
    phone: row.phone ?? '',
    message: row.message ?? '',
    status: row.status,
    source: row.source ?? '',
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function toMetadata(lead: any): Record<string, unknown> {
  const { id, fullName, email, company, phone, message, status, source, createdAt, updatedAt, ...metadata } = lead;
  return metadata;
}

export class PostgresLeadRepository {
  async list(): Promise<any[]> {
    const result = await getPostgresPool().query('SELECT * FROM leads ORDER BY created_at DESC');
    return result.rows.map(mapLead);
  }

  async findById(id: string): Promise<any | null> {
    const result = await getPostgresPool().query('SELECT * FROM leads WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapLead(result.rows[0]) : null;
  }

  async create(lead: any, audit?: AuditEntry): Promise<any> {
    return withPostgresTransaction(async client => {
    const result = await client.query(
      `INSERT INTO leads
       (id,full_name,email,company,phone,message,status,source,metadata,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [lead.id, lead.fullName, lead.email || null, lead.company || null, lead.phone || null, lead.message || null,
       lead.status, lead.source || null, JSON.stringify(toMetadata(lead)), lead.createdAt, lead.updatedAt]
    );
    if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
    return mapLead(result.rows[0]);
    });
  }

  async update(id: string, patch: Record<string, unknown>, audit?: AuditEntry): Promise<any | null> {
    return withPostgresTransaction(async client => {
      const current = await client.query('SELECT * FROM leads WHERE id = $1 FOR UPDATE', [id]);
      if (!current.rows[0]) return null;
      const existing = mapLead(current.rows[0]);
      const next = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
      const result = await client.query(
        `UPDATE leads SET full_name=$2,email=$3,company=$4,phone=$5,message=$6,status=$7,source=$8,metadata=$9,updated_at=$10
         WHERE id=$1 RETURNING *`,
        [id, next.fullName, next.email || null, next.company || null, next.phone || null, next.message || null,
         next.status, next.source || null, JSON.stringify(toMetadata(next)), next.updatedAt]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return result.rows[0] ? mapLead(result.rows[0]) : null;
    });
  }

  async delete(id: string, audit?: AuditEntry): Promise<boolean> {
    return withPostgresTransaction(async client => {
      const current=await client.query('SELECT status FROM leads WHERE id = $1 FOR UPDATE',[id]);
      if(!current.rows[0])return false;
      if(current.rows[0].status==='closed')throw new Error('LEAD_IS_CLOSED');
      const result=await client.query('DELETE FROM leads WHERE id = $1',[id]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return result.rowCount===1;
    });
  }
}

export const postgresLeadRepository = new PostgresLeadRepository();
