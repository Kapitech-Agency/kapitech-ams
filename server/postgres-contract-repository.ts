import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type Row = Record<string, any>;

const iso = (value: any): string =>
  value == null ? new Date().toISOString() : value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const date = (value: any): string =>
  value == null ? '' : value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

const mapContract = (row: Row): any => ({
  ...(row.data && typeof row.data === 'object' ? row.data : {}),
  id: String(row.id),
  contractNumber: String(row.contract_number),
  clientId: row.client_id ? String(row.client_id) : '',
  projectId: row.project_id ? String(row.project_id) : '',
  status: String(row.status),
  contractType: String(row.contract_type),
  currency: row.currency === 'USD' ? 'USD' : 'IDR',
  contractValue: Number(row.contract_value || 0),
  startDate: date(row.start_date),
  endDate: date(row.end_date),
  renewalDate: date(row.renewal_date),
  documentUrl: String(row.document_url || ''),
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at)
});

export class PostgresContractRepository {
  async list(): Promise<any[]> {
    const pool = getPostgresPool();
    const result = await pool.query('SELECT * FROM client_contracts ORDER BY updated_at DESC, created_at DESC');
    return result.rows.map(mapContract);
  }

  async findById(id: string): Promise<any | null> {
    const pool = getPostgresPool();
    const result = await pool.query('SELECT * FROM client_contracts WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapContract(result.rows[0]) : null;
  }

  async create(contract: any, audit?: AuditEntry): Promise<any> {
    return withPostgresTransaction(async client => {
      const result = await client.query(
        `INSERT INTO client_contracts
          (id, contract_number, client_id, project_id, status, contract_type, currency, contract_value,
           start_date, end_date, renewal_date, document_url, data, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15)
         RETURNING *`,
        [
          contract.id, contract.contractNumber, contract.clientId || null, contract.projectId || null,
          contract.status, contract.contractType, contract.currency, contract.contractValue,
          contract.startDate || null, contract.endDate || null, contract.renewalDate || null,
          contract.documentUrl || null, JSON.stringify(contract),
          contract.createdAt || new Date().toISOString(), contract.updatedAt || new Date().toISOString()
        ]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapContract(result.rows[0]);
    });
  }

  async update(id: string, patch: Record<string, unknown>, audit?: AuditEntry): Promise<any | null> {
    return withPostgresTransaction(async client => {
      const existing = await client.query('SELECT * FROM client_contracts WHERE id = $1 FOR UPDATE', [id]);
      if (!existing.rows[0]) return null;
      const current = mapContract(existing.rows[0]);
      const next = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
      const result = await client.query(
        `UPDATE client_contracts SET
          client_id=$2, project_id=$3, status=$4, contract_type=$5, currency=$6, contract_value=$7,
          start_date=$8, end_date=$9, renewal_date=$10, document_url=$11, data=$12::jsonb, updated_at=$13
         WHERE id=$1 RETURNING *`,
        [
          id, next.clientId || null, next.projectId || null, next.status, next.contractType,
          next.currency, next.contractValue, next.startDate || null, next.endDate || null,
          next.renewalDate || null, next.documentUrl || null, JSON.stringify(next), next.updatedAt
        ]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapContract(result.rows[0]);
    });
  }

  async delete(id: string, audit?: AuditEntry): Promise<boolean> {
    return withPostgresTransaction(async client => {
      const result = await client.query('DELETE FROM client_contracts WHERE id = $1', [id]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return (result.rowCount || 0) > 0;
    });
  }
}

export const postgresContractRepository = new PostgresContractRepository();
