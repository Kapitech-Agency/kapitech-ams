import type { AgencyClient } from '../src/lib/clientStore.ts';
import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type ClientRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  status: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: Date | string;
  updated_at: Date | string;
};

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeStatus(status: string): AgencyClient['status'] {
  if (status === 'completed' || status === 'lead' || status === 'inactive') return status;
  if (status === 'on_hold') return 'inactive';
  return status === 'prospect' ? 'lead' : 'active';
}

function mapClient(row: ClientRow): AgencyClient {
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return {
    ...(metadata as Partial<AgencyClient>),
    id: row.id,
    name: row.name,
    company: row.company ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    industry: row.industry ?? '',
    location: typeof metadata.location === 'string' ? metadata.location : '',
    totalSpend: typeof metadata.totalSpend === 'number' ? metadata.totalSpend : 0,
    projectsCount: typeof metadata.projectsCount === 'number' ? metadata.projectsCount : 0,
    contactPersonRole: typeof metadata.contactPersonRole === 'string' ? metadata.contactPersonRole : '',
    status: normalizeStatus(row.status),
    notes: row.notes ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function toMetadata(client: AgencyClient): Record<string, unknown> {
  const { id, name, company, email, phone, industry, status, notes, createdAt, updatedAt, ...metadata } = client;
  return metadata;
}

export class PostgresClientRepository {
  async list(): Promise<AgencyClient[]> {
    const result = await getPostgresPool().query<ClientRow>('SELECT * FROM clients ORDER BY created_at DESC');
    return result.rows.map(mapClient);
  }

  async findById(id: string): Promise<AgencyClient | null> {
    const result = await getPostgresPool().query<ClientRow>('SELECT * FROM clients WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapClient(result.rows[0]) : null;
  }

  async create(client: AgencyClient, audit?: AuditEntry): Promise<AgencyClient> {
    return withPostgresTransaction(async db => {
    const result = await db.query<ClientRow>(
      `INSERT INTO clients
       (id,name,company,email,phone,industry,status,notes,metadata,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [client.id, client.name, client.company || null, client.email || null, client.phone || null,
       client.industry || null, normalizeStatus(String(client.status)), client.notes || null, JSON.stringify(toMetadata(client)),
       client.createdAt, client.updatedAt]
    );
    if (audit) await postgresAuditLogRepository.appendWithinTransaction(db, audit);
    return mapClient(result.rows[0]);
    });
  }

  async update(id: string, patch: Partial<AgencyClient>, audit?: AuditEntry): Promise<AgencyClient | null> {
    const client = await getPostgresPool().connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<ClientRow>('SELECT * FROM clients WHERE id = $1 FOR UPDATE', [id]);
      if (!current.rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }
      const row = current.rows[0];
      const currentClient = mapClient(row);
      const { totalSpend: _ignoredTotalSpend, projectsCount: _ignoredProjectsCount, ...editablePatch } = patch as any;
      const next = { ...currentClient, ...editablePatch, id, updatedAt: new Date().toISOString(),
        totalSpend: currentClient.totalSpend,
        projectsCount: currentClient.projectsCount
      };
      const result = await client.query<ClientRow>(
        `UPDATE clients SET name=$2,company=$3,email=$4,phone=$5,industry=$6,status=$7,notes=$8,metadata=$9,updated_at=$10
         WHERE id=$1 RETURNING *`,
        [id, next.name, next.company || null, next.email || null, next.phone || null, next.industry || null,
         normalizeStatus(String(next.status)), next.notes || null, JSON.stringify(toMetadata(next)), next.updatedAt]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      await client.query('COMMIT');
      return result.rows[0] ? mapClient(result.rows[0]) : null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string, audit?: AuditEntry): Promise<boolean> {
    const client = await getPostgresPool().connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query('SELECT id FROM clients WHERE id=$1 FOR UPDATE',[id]);
      if (!locked.rows[0]) { await client.query('ROLLBACK'); return false; }
      const references = await client.query(
        `SELECT
          (SELECT COUNT(*)::int FROM projects WHERE client_id=$1) AS projects,
          (SELECT COUNT(*)::int FROM crm_deals WHERE client_id=$1) AS deals,
          (SELECT COUNT(*)::int FROM proposals WHERE client_id=$1) AS proposals,
          (SELECT COUNT(*)::int FROM invoices WHERE client_id=$1) AS invoices`,
        [id]
      );
      if (Object.values(references.rows[0] || {}).some(v=>Number(v)>0)) {
        await client.query('ROLLBACK');
        throw new Error('CLIENT_HAS_BUSINESS_RECORDS');
      }
      const result=await client.query('DELETE FROM clients WHERE id=$1',[id]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      await client.query('COMMIT');
      return result.rowCount===1;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally {
      client.release();
    }
  }
}

export const postgresClientRepository = new PostgresClientRepository();
