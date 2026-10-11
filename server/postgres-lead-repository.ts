import crypto from 'node:crypto';
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


  async convertToClient(id: string, audit?: AuditEntry): Promise<{ lead: any; client: any; replayed: boolean; created: boolean } | null> {
    return withPostgresTransaction(async client => {
      const leadResult = await client.query('SELECT * FROM leads WHERE id = $1 FOR UPDATE', [id]);
      if (!leadResult.rows[0]) return null;
      const row = leadResult.rows[0];
      const lead = mapLead(row);
      const currentMetadata = obj(row.metadata);
      const linkedClientId = typeof currentMetadata.convertedClientId === 'string' ? currentMetadata.convertedClientId : '';

      const toClient = (clientRow: Row): any => {
        const metadata = obj(clientRow.metadata);
        const company = String(clientRow.company || '');
        const fallbackSlug = (company || String(clientRow.id || 'client'))
          .normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase()
          .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return {
          ...metadata,
          id: String(clientRow.id),
          slug: typeof metadata.slug === 'string' && metadata.slug.trim() ? metadata.slug : fallbackSlug,
          name: String(clientRow.name || ''),
          company,
          email: String(clientRow.email || ''),
          phone: String(clientRow.phone || ''),
          industry: String(clientRow.industry || ''),
          status: String(clientRow.status || 'active'),
          notes: clientRow.notes == null ? '' : String(clientRow.notes),
          createdAt: iso(clientRow.created_at),
          updatedAt: iso(clientRow.updated_at)
        };
      };

      if (linkedClientId) {
        const linked = await client.query('SELECT * FROM clients WHERE id = $1 LIMIT 1', [linkedClientId]);
        if (!linked.rows[0]) throw new Error('LEAD_CONVERSION_LINK_BROKEN');
        return { lead, client: toClient(linked.rows[0]), replayed: true, created: false };
      }

      const normalizedEmail = String(lead.email || '').trim().toLowerCase();
      if (normalizedEmail) {
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [normalizedEmail]);
      }
      let clientRow: Row | undefined;
      if (normalizedEmail) {
        const existing = await client.query(
          'SELECT * FROM clients WHERE lower(COALESCE(email, \'\')) = $1 ORDER BY created_at ASC, id ASC LIMIT 1 FOR UPDATE',
          [normalizedEmail]
        );
        clientRow = existing.rows[0];
      }

      const now = new Date().toISOString();
      let created = false;
      if (!clientRow) {
        created = true;
        const clientId = 'cli_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
        const company = String(lead.company || lead.fullName || '').trim();
        const slug = (company || clientId).normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase()
          .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || clientId;
        const notes = 'Converted from inbound lead ' + String(lead.id) + (lead.source ? ' (' + String(lead.source) + ')' : '') + '.';
        const metadata = {
          slug,
          location: '',
          totalSpend: 0,
          projectsCount: 0,
          contactPersonRole: '',
          convertedFromLeadId: String(lead.id),
          leadSource: String(lead.source || '')
        };
        const inserted = await client.query(
          `INSERT INTO clients
            (id,name,company,email,phone,industry,status,notes,metadata,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8::jsonb,$9,$9)
           RETURNING *`,
          [clientId, String(lead.fullName || 'Unknown contact'), company, normalizedEmail || null,
           String(lead.phone || ''), '', notes, JSON.stringify(metadata), now]
        );
        clientRow = inserted.rows[0];
      } else {
        const existingMeta = obj(clientRow.metadata);
        const metadata = { ...existingMeta, convertedFromLeadId: String(lead.id), leadSource: String(lead.source || '') };
        const updated = await client.query(
          'UPDATE clients SET metadata = $2::jsonb, updated_at = $3 WHERE id = $1 RETURNING *',
          [clientRow.id, JSON.stringify(metadata), now]
        );
        clientRow = updated.rows[0];
      }

      const nextLeadMetadata = {
        ...currentMetadata,
        convertedClientId: String(clientRow.id),
        convertedAt: now,
        conversionType: created ? 'created-client' : 'linked-existing-client'
      };
      const updatedLead = await client.query(
        'UPDATE leads SET status = $2, metadata = $3::jsonb, updated_at = $4 WHERE id = $1 RETURNING *',
        [id, 'closed', JSON.stringify(nextLeadMetadata), now]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return {
        lead: updatedLead.rows[0] ? mapLead(updatedLead.rows[0]) : { ...lead, status: 'closed', ...nextLeadMetadata },
        client: toClient(clientRow),
        replayed: false,
        created
      };
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
