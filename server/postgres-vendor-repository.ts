import type { AgencyVendor } from '../src/lib/vendorStore.ts';
import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type VendorRow = {
  id: string; name: string; category: string | null; contact_person: string | null;
  email: string | null; phone: string | null; payment_terms: string | null;
  status: string; monthly_spend: number | string; notes: string | null;
  metadata: Record<string, unknown>; created_at: Date | string;
};

const iso = (value: Date | string) => value instanceof Date ? value.toISOString() : new Date(value).toISOString();
const obj = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};

function mapVendor(row: VendorRow): AgencyVendor {
  const metadata = obj(row.metadata);
  return {
    ...(metadata as Partial<AgencyVendor>),
    id: row.id,
    name: row.name,
    companyName: row.contact_person ?? (typeof metadata.companyName === 'string' ? metadata.companyName : undefined),
    email: row.email ?? '',
    phone: row.phone ?? '',
    type: (metadata.type ?? 'contractor') as AgencyVendor['type'],
    primaryCategory: (row.category ?? metadata.primaryCategory ?? 'Backend Dev') as AgencyVendor['primaryCategory'],
    skills: Array.isArray(metadata.skills) ? metadata.skills as string[] : [],
    hourlyRate: Number(metadata.hourlyRate ?? 0),
    currency: metadata.currency === 'USD' ? 'USD' : 'IDR',
    rating: Number(metadata.rating ?? 0),
    completedProjectsCount: Math.max(0, Number(metadata.completedProjectsCount ?? 0)),
    status: row.status as AgencyVendor['status'],
    isVetted: Boolean(metadata.isVetted),
    location: typeof metadata.location === 'string' ? metadata.location : '',
    portfolioUrl: typeof metadata.portfolioUrl === 'string' ? metadata.portfolioUrl : undefined,
    githubUrl: typeof metadata.githubUrl === 'string' ? metadata.githubUrl : undefined,
    contracts: Array.isArray(metadata.contracts) ? metadata.contracts as AgencyVendor['contracts'] : [],
    notes: row.notes ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: typeof metadata.updatedAt === 'string' ? metadata.updatedAt : iso(row.created_at)
  };
}

function toMetadata(vendor: AgencyVendor): Record<string, unknown> {
  const { id, name, companyName, email, phone, primaryCategory, status, notes, createdAt, updatedAt, ...metadata } = vendor;
  return metadata;
}

export class PostgresVendorRepository {
  async list(): Promise<AgencyVendor[]> {
    const result = await getPostgresPool().query<VendorRow>('SELECT * FROM vendors ORDER BY created_at DESC');
    return result.rows.map(mapVendor);
  }

  async findById(id: string): Promise<AgencyVendor | null> {
    const result = await getPostgresPool().query<VendorRow>('SELECT * FROM vendors WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapVendor(result.rows[0]) : null;
  }

  async create(vendor: AgencyVendor, audit?: AuditEntry): Promise<AgencyVendor> {
    return withPostgresTransaction(async db => {
    const result = await db.query<VendorRow>(
      `INSERT INTO vendors (id,name,category,contact_person,email,phone,payment_terms,status,monthly_spend,notes,metadata,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [vendor.id, vendor.name, vendor.primaryCategory, vendor.companyName || null, vendor.email || null, vendor.phone || null,
       typeof (vendor as any).paymentTerms === 'string' ? (vendor as any).paymentTerms : null, vendor.status, 0, vendor.notes || null,
       JSON.stringify({ ...toMetadata(vendor), updatedAt: vendor.updatedAt }), vendor.createdAt]
    );
    if (audit) await postgresAuditLogRepository.appendWithinTransaction(db, audit);
    return mapVendor(result.rows[0]);
    });
  }

  async update(id: string, patch: Partial<AgencyVendor>, audit?: AuditEntry): Promise<AgencyVendor | null> {
    const client = await getPostgresPool().connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<VendorRow>('SELECT * FROM vendors WHERE id = $1 FOR UPDATE', [id]);
      if (!current.rows[0]) { await client.query('ROLLBACK'); return null; }
      const currentVendor = mapVendor(current.rows[0]);
      const next = { ...currentVendor, ...patch, id, updatedAt: new Date().toISOString() };
      const result = await client.query<VendorRow>(
        `UPDATE vendors SET name=$2,category=$3,contact_person=$4,email=$5,phone=$6,payment_terms=$7,status=$8,notes=$9,metadata=$10 WHERE id=$1 RETURNING *`,
        [id, next.name, next.primaryCategory, next.companyName || null, next.email || null, next.phone || null,
         (next as any).paymentTerms || null, next.status, next.notes || null, JSON.stringify({ ...toMetadata(next), updatedAt: next.updatedAt })]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      await client.query('COMMIT');
      return result.rows[0] ? mapVendor(result.rows[0]) : null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string, audit?: AuditEntry): Promise<boolean> {
    return withPostgresTransaction(async client => {
      const result = await client.query('DELETE FROM vendors WHERE id = $1', [id]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return result.rowCount === 1;
    });
  }
}

export const postgresVendorRepository = new PostgresVendorRepository();
