import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type Row = Record<string, any>;
const iso=(v:any)=>!v?'':v instanceof Date?v.toISOString():String(v);
const dateValue=(v:any)=>!v?'':v instanceof Date?v.toISOString().slice(0,10):String(v).slice(0,10);
function mapExpense(row:Row):Record<string,any>{
  const metadata=row.metadata&&typeof row.metadata==='object'&&!Array.isArray(row.metadata)?row.metadata:{};
  return {...metadata,id:row.id,type:row.type,category:row.category,description:row.description,
    amount:Number(row.amount||0),currency:row.currency||'IDR',date:dateValue(row.expense_date),
    expenseDate:dateValue(row.expense_date),recurringInterval:row.recurring_interval??metadata.recurringInterval??'none',
    projectId:row.project_id??undefined,recordedByUserId:row.recorded_by_user_id??undefined,
    recordedBy:row.recorded_by||metadata.recordedBy||'',status:row.status||'posted',version:Number(row.version||1),
    archivedAt:row.archived_at?iso(row.archived_at):undefined,createdAt:iso(row.created_at)};
}
export class ExpenseNotFoundError extends Error{readonly code='EXPENSE_NOT_FOUND';}
export class ExpenseImmutableError extends Error{readonly code='EXPENSE_IMMUTABLE';}
export class ExpenseVersionConflictError extends Error{readonly code='EXPENSE_VERSION_CONFLICT';}
export class ExpenseProjectNotFoundError extends Error{readonly code='EXPENSE_PROJECT_NOT_FOUND';}
export class PostgresExpenseRepository{
  async list(){const r=await getPostgresPool().query<Row>('SELECT * FROM expenses WHERE archived_at IS NULL AND status <> $1 ORDER BY expense_date DESC, created_at DESC',['voided']);return r.rows.map(mapExpense);}
  async findById(id:string){const r=await getPostgresPool().query<Row>('SELECT * FROM expenses WHERE id=$1 LIMIT 1',[id]);return r.rows[0]?mapExpense(r.rows[0]):null;}
  async create(input:Record<string,any>, audit?: AuditEntry){
    const userId=String(input.recordedByUserId||''), amount=Number(input.amount), currency=String(input.currency||'IDR').toUpperCase();
    const expenseDate=String(input.date||input.expenseDate||'').slice(0,10), projectId=input.projectId?String(input.projectId):null;
    const idempotencyKey=input.idempotencyKey?String(input.idempotencyKey).slice(0,100):null;
    if(!userId||!expenseDate||!/^[A-Z]{3}$/.test(currency)||!Number.isFinite(amount)||amount<=0) throw new Error('Valid user, date, currency, and positive expense amount are required.');
    return withPostgresTransaction(async client=>{
      const requestFingerprint=JSON.stringify({
        type:String(input.type||'OpEx'),
        category:String(input.category||'General'),
        description:String(input.description||''),
        amount:Math.round(amount*100)/100,
        currency,
        date:expenseDate,
        projectId:projectId||'',
        recurringInterval:String(input.recurringInterval||'none')
      });
      if(idempotencyKey){
        await client.query("SELECT pg_advisory_xact_lock(hashtextextended('kapitech:expense-idempotency:' || $1 || ':' || $2, 0))",[userId,idempotencyKey]);
        const existing=await client.query<Row>('SELECT * FROM expenses WHERE recorded_by_user_id=$1 AND idempotency_key=$2 LIMIT 1',[userId,idempotencyKey]);
        if(existing.rows[0]){
          const existingMetadata=existing.rows[0].metadata&&typeof existing.rows[0].metadata==='object'&&!Array.isArray(existing.rows[0].metadata)?existing.rows[0].metadata:{};
          const storedFingerprint=String(existingMetadata.requestFingerprint||JSON.stringify({
            type:String(existing.rows[0].type||'OpEx'),
            category:String(existing.rows[0].category||'General'),
            description:String(existing.rows[0].description||''),
            amount:Math.round(Number(existing.rows[0].amount||0)*100)/100,
            currency:String(existing.rows[0].currency||'IDR'),
            date:dateValue(existing.rows[0].expense_date),
            projectId:existing.rows[0].project_id?String(existing.rows[0].project_id):'',
            recurringInterval:String(existing.rows[0].recurring_interval||'none')
          }));
          if(storedFingerprint!==requestFingerprint) throw new Error('EXPENSE_IDEMPOTENCY_KEY_REUSE_CONFLICT');
          return { ...mapExpense(existing.rows[0]), __idempotentReplay: true };
        }
      }
      if(projectId){const project=await client.query<Row>('SELECT id FROM projects WHERE id=$1 FOR SHARE',[projectId]);if(!project.rows[0])throw new ExpenseProjectNotFoundError('Project not found.');}
      const metadata={...(input.metadata&&typeof input.metadata==='object'?input.metadata:{}),recurringInterval:input.recurringInterval??'none',requestFingerprint};
      const result=await client.query<Row>('INSERT INTO expenses (id,type,category,description,amount,currency,expense_date,recurring_interval,project_id,recorded_by_user_id,recorded_by,status,version,idempotency_key,metadata,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,$13,$14,NOW()) RETURNING *',
        [String(input.id),String(input.type||'OpEx'),String(input.category||'General'),String(input.description||''),Math.round(amount*100)/100,currency,expenseDate,String(input.recurringInterval||'none'),projectId,userId,String(input.recordedBy||''),'posted',idempotencyKey,JSON.stringify(metadata)]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapExpense(result.rows[0]);
    });
  }
  async void(id:string,expectedVersion?:number,audit?: AuditEntry){
    return withPostgresTransaction(async client=>{
      const current=await client.query<Row>('SELECT * FROM expenses WHERE id=$1 FOR UPDATE',[id]);if(!current.rows[0])throw new ExpenseNotFoundError('Expense not found.');
      const row=current.rows[0];if(row.status==='voided'||row.archived_at)throw new ExpenseImmutableError('Expense is already voided.');
      if(expectedVersion!=null&&Number(row.version)!==Number(expectedVersion))throw new ExpenseVersionConflictError('Expense was modified by another user.');
      const result=await client.query<Row>('UPDATE expenses SET status=$2,archived_at=NOW(),version=version+1 WHERE id=$1 RETURNING *',[id,'voided']);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapExpense(result.rows[0]);
    });
  }
}
export const postgresExpenseRepository=new PostgresExpenseRepository();
