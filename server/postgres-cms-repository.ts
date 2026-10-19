import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type CmsKind = 'service' | 'project' | 'testimonial';

const tableFor = (kind: CmsKind): string => ({
  service: 'cms_services',
  project: 'cms_projects',
  testimonial: 'cms_testimonials'
}[kind]);

const mapRow = (kind: CmsKind, row: any): any => ({
  ...(row.data && typeof row.data === 'object' ? row.data : {}),
  id: row.id,
  ...(kind === 'service' ? { name: row.name || row.data?.name || row.data?.title, slug: row.slug || row.data?.slug, description: row.description || row.data?.description } : {}),
  ...(kind === 'project' ? { name: row.name || row.data?.name || row.data?.title, slug: row.slug || row.data?.slug, description: row.description || row.data?.description } : {}),
  ...(kind === 'testimonial' ? { name: row.name || row.data?.name || row.data?.author, company: row.company || row.data?.company, quote: row.quote || row.data?.quote } : {}),
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
  updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString()
});

export class PostgresCmsRepository {
  async list(kind: CmsKind): Promise<any[]> {
    const { rows } = await getPostgresPool().query(`SELECT * FROM ${tableFor(kind)} ORDER BY created_at DESC`);
    return rows.map(row => mapRow(kind, row));
  }

  async findById(kind: CmsKind, id: string): Promise<any | null> {
    const { rows } = await getPostgresPool().query(`SELECT * FROM ${tableFor(kind)} WHERE id=$1`, [id]);
    return rows[0] ? mapRow(kind, rows[0]) : null;
  }

  async create(kind: CmsKind, input: any, audit?: AuditEntry): Promise<any> {
    return withPostgresTransaction(async client => {
      const table = tableFor(kind);
      const now = input.createdAt || new Date().toISOString();
      const name = input.name || input.title || input.author || '';
      const description = input.description || input.desc || '';
      const company = input.company || '';
      const quote = input.quote || '';
      const { rows } = await client.query(
        `INSERT INTO ${table} (id,name,slug,description,company,quote,data,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$8)
         RETURNING *`,
        [input.id,name,input.slug || null,description,company,quote,JSON.stringify(input),now]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapRow(kind, rows[0]);
    });
  }

  async update(kind: CmsKind, id: string, patch: any, audit?: AuditEntry): Promise<any | null> {
    return withPostgresTransaction(async client => {
      const currentResult = await client.query(`SELECT * FROM ${tableFor(kind)} WHERE id=$1 FOR UPDATE`, [id]);
      if (!currentResult.rows[0]) return null;
      const current = mapRow(kind, currentResult.rows[0]);
      const merged = { ...current, ...patch, updatedAt: new Date().toISOString() };
      const table = tableFor(kind);
      const name = merged.name || merged.title || merged.author || '';
      const description = merged.description || merged.desc || '';
      const company = merged.company || '';
      const quote = merged.quote || '';
      const { rows } = await client.query(
        `UPDATE ${table}
         SET name=$2,slug=$3,description=$4,company=$5,quote=$6,data=$7::jsonb,updated_at=$8
         WHERE id=$1 RETURNING *`,
        [id,name,merged.slug || null,description,company,quote,JSON.stringify(merged),merged.updatedAt]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return rows[0] ? mapRow(kind, rows[0]) : null;
    });
  }

  async delete(kind: CmsKind, id: string, audit?: AuditEntry): Promise<boolean> {
    return withPostgresTransaction(async client => {
      const { rowCount } = await client.query(`DELETE FROM ${tableFor(kind)} WHERE id=$1`, [id]);
      if (rowCount !== 1) return false;
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return true;
    });
  }

  async getSettings(): Promise<Record<string, any>> {
    const { rows } = await getPostgresPool().query('SELECT key,value,updated_at FROM cms_settings ORDER BY key');
    const settings: Record<string, any> = {};
    for (const row of rows) settings[row.key] = row.value;
    if (rows[0]?.updated_at) settings.updatedAt = rows[0].updated_at instanceof Date ? rows[0].updated_at.toISOString() : new Date(rows[0].updated_at).toISOString();
    return settings;
  }

  async updateSettings(patch: Record<string, any>, audit?: AuditEntry): Promise<Record<string, any>> {
    return withPostgresTransaction(async client => {
      const currentResult = await client.query('SELECT key,value,updated_at FROM cms_settings ORDER BY key');
      const current: Record<string, any> = {};
      for (const row of currentResult.rows) current[row.key] = row.value;
      if (currentResult.rows[0]?.updated_at) {
        current.updatedAt = currentResult.rows[0].updated_at instanceof Date
          ? currentResult.rows[0].updated_at.toISOString()
          : new Date(currentResult.rows[0].updated_at).toISOString();
      }
      const merged = { ...current, ...patch, updatedAt: new Date().toISOString() };
      for (const [key, value] of Object.entries(merged)) {
        if (key === 'updatedAt') continue;
        await client.query(
          `INSERT INTO cms_settings (key,value,updated_at) VALUES ($1,$2::jsonb,NOW())
           ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,
          [key, JSON.stringify(value)]
        );
      }
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return merged;
    });
  }
}

export const postgresCmsRepository = new PostgresCmsRepository();
