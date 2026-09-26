import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type Row = Record<string, any>;

const iso = (value: any): string =>
  value == null ? new Date().toISOString() : value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const date = (value: any): string =>
  value == null ? '' : value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

const mapDocument = (row: Row, accessUserIds: string[] = []): any => ({
  ...(row.metadata && typeof row.metadata === 'object' ? row.metadata : {}),
  id: row.id,
  name: row.name,
  title: row.title || row.name,
  type: row.type || 'Document',
  mimeType: row.mime_type || '',
  size: row.size || '0 B',
  sizeBytes: Number(row.size_bytes || 0),
  category: row.category || 'General',
  relatedEntity: row.related_entity || 'General',
  relatedId: row.related_id || '',
  owner: row.owner || '',
  ownerUserId: row.owner_user_id || undefined,
  accessUserIds,
  sourceType: row.source_type || 'external_link',
  status: row.status || 'external_link',
  uploadedDate: date(row.uploaded_date),
  uploadedAt: row.uploaded_at ? iso(row.uploaded_at) : undefined,
  externalUrl: row.external_url || undefined,
  url: row.external_url || undefined,
  storageKey: row.storage_key || undefined,
  contentSha256: row.content_sha256 || undefined,
  storageSha256: row.storage_sha256 || undefined,
  storageVersion: Number(row.storage_version || 1),
  storageProvider: row.storage_provider || undefined,
  integrityCheckedAt: row.integrity_checked_at ? iso(row.integrity_checked_at) : undefined,
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at)
});

export class PostgresDocumentRepository {
  async list(): Promise<any[]> {
    const pool = getPostgresPool();
    const [documents, access] = await Promise.all([
      pool.query('SELECT * FROM documents ORDER BY created_at DESC'),
      pool.query('SELECT document_id, user_id FROM document_access')
    ]);
    const accessMap = new Map<string, string[]>();
    for (const row of access.rows) {
      const list = accessMap.get(row.document_id) || [];
      list.push(String(row.user_id));
      accessMap.set(row.document_id, list);
    }
    return documents.rows.map(row => mapDocument(row, accessMap.get(row.id) || []));
  }

  async findById(id: string): Promise<any | null> {
    const pool = getPostgresPool();
    const [document, access] = await Promise.all([
      pool.query('SELECT * FROM documents WHERE id = $1', [id]),
      pool.query('SELECT user_id FROM document_access WHERE document_id = $1', [id])
    ]);
    return document.rows[0] ? mapDocument(document.rows[0], access.rows.map(row => String(row.user_id))) : null;
  }

  async create(input: any, audit?: AuditEntry): Promise<any> {
    return withPostgresTransaction(async client => {
      const { rows } = await client.query(
        `INSERT INTO documents
          (id,name,title,type,mime_type,size,size_bytes,category,related_entity,related_id,owner,owner_user_id,source_type,status,uploaded_date,uploaded_at,external_url,storage_key,content_sha256,storage_sha256,storage_version,storage_provider,integrity_checked_at,created_at,updated_at,metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26::jsonb)
         RETURNING *`,
        [
          input.id,input.name,input.title,input.type,input.mimeType,input.size,input.sizeBytes,input.category,
          input.relatedEntity,input.relatedId,input.owner,input.ownerUserId,input.sourceType,input.status,
          input.uploadedDate || null,input.uploadedAt || null,input.url || input.externalUrl || null,input.storageKey || null,
          input.contentSha256 || null,input.storageSha256 || null,Number(input.storageVersion || 1),input.storageProvider || null,input.integrityCheckedAt || null,
          input.createdAt || new Date().toISOString(),input.updatedAt || new Date().toISOString(),
          JSON.stringify(input.metadata || {})
        ]
      );
      for (const userId of Array.isArray(input.accessUserIds) ? input.accessUserIds : []) {
        await client.query(
          'INSERT INTO document_access (document_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [input.id, userId]
        );
      }
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapDocument(rows[0], Array.isArray(input.accessUserIds) ? input.accessUserIds : []);
    });
  }

  async update(id: string, patch: any, audit?: AuditEntry): Promise<any | null> {
    return withPostgresTransaction(async client => {
      const currentResult = await client.query('SELECT * FROM documents WHERE id=$1 FOR UPDATE', [id]);
      if (!currentResult.rows[0]) return null;
      const accessResult = await client.query('SELECT user_id FROM document_access WHERE document_id=$1 ORDER BY user_id', [id]);
      const current = mapDocument(currentResult.rows[0], accessResult.rows.map((row:any)=>String(row.user_id)));
      const merged = { ...current, ...patch, updatedAt: new Date().toISOString() };
      await client.query(`UPDATE documents SET
        name=$2,title=$3,type=$4,mime_type=$5,size=$6,size_bytes=$7,category=$8,related_entity=$9,related_id=$10,
        owner=$11,owner_user_id=$12,source_type=$13,status=$14,uploaded_date=$15,uploaded_at=$16,external_url=$17,
        storage_key=$18,content_sha256=$19,storage_sha256=$20,storage_version=$21,storage_provider=$22,integrity_checked_at=$23,updated_at=$24,metadata=$25::jsonb
       WHERE id=$1`, [
        id,merged.name,merged.title,merged.type,merged.mimeType,merged.size,merged.sizeBytes,merged.category,
        merged.relatedEntity,merged.relatedId,merged.owner,merged.ownerUserId || null,merged.sourceType,merged.status,
        merged.uploadedDate || null,merged.uploadedAt || null,merged.url || merged.externalUrl || null,merged.storageKey || null,
        merged.contentSha256 || null,merged.storageSha256 || null,Number(merged.storageVersion || 1),merged.storageProvider || null,
        merged.integrityCheckedAt || null,merged.updatedAt,JSON.stringify(merged.metadata || {})
      ]);
      if (patch.accessUserIds !== undefined) {
        await client.query('DELETE FROM document_access WHERE document_id=$1', [id]);
        for (const userId of Array.isArray(patch.accessUserIds) ? patch.accessUserIds : []) {
          await client.query('INSERT INTO document_access (document_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id,userId]);
        }
      }
      const refreshed = await client.query('SELECT * FROM documents WHERE id=$1', [id]);
      const refreshedAccess = await client.query('SELECT user_id FROM document_access WHERE document_id=$1 ORDER BY user_id', [id]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapDocument(refreshed.rows[0], refreshedAccess.rows.map((row:any)=>String(row.user_id)));
    });
  }
  async delete(id: string, audit?: AuditEntry): Promise<boolean> {
    return withPostgresTransaction(async client => {
      await client.query('DELETE FROM document_access WHERE document_id=$1', [id]);
      const result = await client.query('DELETE FROM documents WHERE id=$1', [id]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return (result.rowCount || 0) > 0;
    });
  }
}

export const postgresDocumentRepository = new PostgresDocumentRepository();
