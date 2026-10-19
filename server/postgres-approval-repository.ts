import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type Approval = Record<string, any>;

const iso = (v: any) => v == null ? '' : v instanceof Date ? v.toISOString() : new Date(v).toISOString();
const date = (v: any) => v == null ? '' : v instanceof Date ? v.toISOString().slice(0,10) : String(v).slice(0,10);

function mapRow(r: any): Approval {
  const metadata = r.metadata && typeof r.metadata === 'object' ? r.metadata : {};
  return {
    ...metadata,
    id: r.id,
    type: r.type ?? metadata.type ?? 'Invoice',
    title: r.title ?? metadata.title ?? 'Approval Request',
    value: Number(r.value ?? metadata.value ?? 0),
    status: r.status ?? metadata.status ?? 'Pending',
    requesterId: r.requester_user_id ?? metadata.requesterId,
    requesterUserId: r.requester_user_id ?? metadata.requesterUserId,
    requesterRole: r.requester_role ?? metadata.requesterRole,
    approvalDate: r.approval_date ? date(r.approval_date) : metadata.approvalDate,
    createdAt: r.created_at ? iso(r.created_at) : metadata.createdAt,
    updatedAt: r.updated_at ? iso(r.updated_at) : metadata.updatedAt,
  };
}

export class PostgresApprovalRepository {
  async list(): Promise<Approval[]> {
    const { rows } = await getPostgresPool().query('SELECT * FROM approvals ORDER BY created_at DESC');
    return rows.map(mapRow);
  }

  async create(input: Approval, audit?: AuditEntry): Promise<Approval> {
    const now = new Date().toISOString();
    const supportedReferences: Record<string,string> = { Invoice:'invoices', Proposal:'proposals', Project:'projects', Expense:'expenses' };
    const type = String(input.type || 'Invoice');
    const referenceId = String(input.referenceId || '').trim();
    const referenceTable = supportedReferences[type];
    if (!referenceTable) throw new Error('UNSUPPORTED_APPROVAL_TYPE');
    if (!referenceId) throw new Error('Approval reference is required.');
    return withPostgresTransaction(async client => {
      const reference = await client.query(`SELECT id FROM ${referenceTable} WHERE id=$1 FOR SHARE`, [referenceId]);
      if (!reference.rows[0]) throw new Error('Approval reference not found.');
      const metadata = { ...input, requesterId: undefined, requesterUserId: undefined, requesterRole: undefined, status: undefined };
      const { rows } = await client.query(
        `INSERT INTO approvals (id,type,title,value,status,reference_id,requester_user_id,requester_role,approval_date,metadata,created_at,updated_at)
         VALUES ($1,$2,$3,$4,'Pending',$5,$6,$7,$8,$9::jsonb,$10,$10) RETURNING *`,
        [input.id,type,input.title,Number(input.value||0),referenceId,input.requesterId||null,input.requesterRole||null,input.date||null,JSON.stringify(metadata),now]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapRow(rows[0]);
    });
  }
  async findById(id: string): Promise<Approval | null> {
    const { rows } = await getPostgresPool().query('SELECT * FROM approvals WHERE id=$1 LIMIT 1', [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async action(id: string, status: string, reviewer: Approval, notes: string, audit?: AuditEntry): Promise<Approval | null> {
    if (!['Approved', 'Rejected', 'Changes Requested'].includes(status)) throw new Error('INVALID_APPROVAL_STATUS');
    const client = await getPostgresPool().connect();
    try {
      await client.query('BEGIN');
      const current = await client.query('SELECT * FROM approvals WHERE id=$1 FOR UPDATE', [id]);
      if (!current.rows[0]) { await client.query('ROLLBACK'); return null; }
      const item = mapRow(current.rows[0]);
      if (item.status !== 'Pending') {
        await client.query('ROLLBACK');
        throw new Error('This approval request has already been resolved.');
      }
      if (item.requesterId && item.requesterId === reviewer.id) {
        throw new Error('APPROVAL_SELF_ACTION_BLOCKED');
      }
      if (item.type && current.rows[0].reference_id) {
        const referenceId=String(current.rows[0].reference_id);
        const referenceTable=item.type==='Invoice'?'invoices':item.type==='Proposal'?'proposals':item.type==='Project'?'projects':item.type==='Expense'?'expenses':null;
        if(referenceTable){const ref=await client.query(`SELECT id FROM ${referenceTable} WHERE id=$1 LIMIT 1`,[referenceId]);if(!ref.rows[0])throw new Error('Approval reference not found.');}
      }
      const metadata = {
        ...(current.rows[0].metadata && typeof current.rows[0].metadata === 'object' ? current.rows[0].metadata : {}),
        ...item,
        status,
        reviewedById: reviewer.id,
        reviewedBy: reviewer.name || reviewer.username,
        reviewedAt: new Date().toISOString(),
        reviewNotes: notes,
      };
      const updated = await client.query(
        `UPDATE approvals SET status=$2, metadata=$3::jsonb, updated_at=NOW() WHERE id=$1 RETURNING *`,
        [id, status, JSON.stringify(metadata)]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      await client.query('COMMIT');
      return mapRow(updated.rows[0]);
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally {
      client.release();
    }
  }
}
export const postgresApprovalRepository = new PostgresApprovalRepository();
