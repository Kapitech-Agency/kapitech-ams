import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type Row = Record<string, any>;
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'?v as Record<string,unknown>:{};
const iso=(v:Date|string)=>v instanceof Date?v.toISOString():new Date(v).toISOString();
const date=(v:unknown)=>v==null?'':v instanceof Date?v.toISOString().slice(0,10):String(v).slice(0,10);

function mapInvoice(row:Row, items:Row[], payments:Row[]):any {
  const metadata=obj(row.metadata);
  const mappedPayments=payments.map(p=>({
    id:p.id, amount:Number(p.amount), date:date(p.paid_at), method:p.method,
    reference:p.reference||'', recordedBy:obj(metadata.paymentUsers)[p.id] || obj(p.metadata).recordedBy || '',
    notes:obj(p.metadata).notes || ''
  }));
  const amountPaid=Number(row.amount_paid||mappedPayments.reduce((s,p)=>s+p.amount,0));
  const total=Number(row.total||0);
  return {...metadata,id:row.id,invoiceNumber:row.invoice_number,proposalId:row.proposal_id??'',clientId:row.client_id??'',
    projectId:row.project_id??'',type:row.type||'invoice',items:items.map(i=>({
      id:i.id,description:i.description,quantity:Number(i.quantity),unitPrice:Number(i.unit_price),amount:Number(i.amount??Number(i.quantity)*Number(i.unit_price))
    })),subtotal:Number(row.subtotal||0),discountPercent:Number(row.discount_percent||0),
    discountAmount:Number(row.discount_amount||0),taxPercent:Number(row.tax_percent||0),taxAmount:Number(row.tax_amount||0),
    total,amountPaid,balanceDue:Math.max(0,total-amountPaid),currency:row.currency,status:row.status,
    issueDate:date(row.issue_date),dueDate:date(row.due_date),notes:row.notes||'',paymentTerms:row.payment_terms||'',
    payments:mappedPayments,auditTrail:Array.isArray(metadata.auditTrail)?metadata.auditTrail:[],
    createdAt:iso(row.created_at),updatedAt:iso(row.updated_at)};
}
function metadata(i:any){const {id,invoiceNumber,proposalId,clientId,projectId,type,items,subtotal,discountPercent,discountAmount,taxPercent,taxAmount,total,amountPaid,balanceDue,currency,status,issueDate,dueDate,notes,paymentTerms,payments,auditTrail,createdAt,updatedAt,...rest}=i;return {...rest,auditTrail};}

export class PostgresInvoiceRepository {
  private readonly writableStatuses = new Set(['draft','sent','overdue']);
  private async items(db:any,id:string){const r=await db.query('SELECT * FROM invoice_items WHERE invoice_id=$1 ORDER BY id ASC',[id]);return r.rows as Row[];}
  private async payments(db:any,id:string){const r=await db.query('SELECT * FROM invoice_payments WHERE invoice_id=$1 ORDER BY paid_at DESC, id DESC',[id]);return r.rows as Row[];}
  private validateFinancials(invoice:any):void {
    const items=Array.isArray(invoice.items)?invoice.items:[];
    if(items.length===0) throw new Error('INVOICE_ITEMS_REQUIRED');
    const itemSubtotal=items.reduce((sum:number,item:any)=>{
      const quantity=Number(item.quantity), unitPrice=Number(item.unitPrice), amount=Number(item.amount);
      const expected=Math.round(quantity*unitPrice*100)/100;
      if(!Number.isFinite(quantity)||quantity<=0||!Number.isFinite(unitPrice)||unitPrice<0||!Number.isFinite(amount)||amount<0||Math.abs(amount-expected)>0.01) throw new Error('INVALID_INVOICE_ITEM');
      return Math.round((sum+amount)*100)/100;
    },0);
    const subtotal=Math.round(Number(invoice.subtotal||0)*100)/100;
    const discountPercent=Number(invoice.discountPercent||0), taxPercent=Number(invoice.taxPercent||0);
    if(!Number.isFinite(subtotal)||subtotal<0||!Number.isFinite(discountPercent)||discountPercent<0||discountPercent>100||!Number.isFinite(taxPercent)||taxPercent<0||taxPercent>100) throw new Error('INVALID_INVOICE_TOTALS');
    const discountAmount=Math.round(subtotal*(discountPercent/100)*100)/100;
    const taxableSubtotal=Math.max(0,subtotal-discountAmount);
    const taxAmount=Math.round(taxableSubtotal*(taxPercent/100)*100)/100;
    const expectedTotal=taxableSubtotal+taxAmount;
    if(Math.abs(itemSubtotal-subtotal)>0.01||Math.abs(Number(invoice.discountAmount||0)-discountAmount)>0.01||Math.abs(Number(invoice.taxAmount||0)-taxAmount)>0.01||Math.abs(Number(invoice.total||0)-expectedTotal)>0.01) throw new Error('INVOICE_FINANCIAL_TOTAL_MISMATCH');
  }
  async list():Promise<any[]>{const db=getPostgresPool();const r=await db.query('SELECT * FROM invoices ORDER BY created_at DESC');const ir=await db.query('SELECT * FROM invoice_items ORDER BY id ASC');const pr=await db.query('SELECT * FROM invoice_payments ORDER BY paid_at DESC, id DESC');const im=new Map<string,Row[]>(),pm=new Map<string,Row[]>();for(const x of ir.rows){const a=im.get(x.invoice_id)||[];a.push(x);im.set(x.invoice_id,a)}for(const x of pr.rows){const a=pm.get(x.invoice_id)||[];a.push(x);pm.set(x.invoice_id,a)}return r.rows.map((x:Row)=>mapInvoice(x,im.get(x.id)||[],pm.get(x.id)||[]));}
  async findById(id:string):Promise<any|null>{const db=getPostgresPool();const r=await db.query('SELECT * FROM invoices WHERE id=$1',[id]);if(!r.rows[0])return null;return mapInvoice(r.rows[0],await this.items(db,id),await this.payments(db,id));}
  async create(i:any,audit?:AuditEntry):Promise<any>{return withPostgresTransaction(async db=>{
      const requestedStatus = String(i.status || 'draft');
      if (!this.writableStatuses.has(requestedStatus)) throw new Error('INVALID_INVOICE_STATUS');
      let resolvedClientId = i.clientId ? String(i.clientId) : null;
      const projectId = i.projectId ? String(i.projectId) : null;
      const invoiceItems = Array.isArray(i.items) ? i.items : [];
      const itemSubtotal = invoiceItems.reduce((sum: number, item: any) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const amount = Number(item.amount ?? quantity * unitPrice);
        const expectedAmount = Math.round(quantity * unitPrice * 100) / 100;
        if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(amount) || amount < 0 || Math.abs(amount - expectedAmount) > 0.01) {
          throw new Error('INVALID_INVOICE_ITEM');
        }
        return Math.round((sum + amount) * 100) / 100;
      }, 0);
      if (invoiceItems.length === 0) throw new Error('INVOICE_ITEMS_REQUIRED');
      if (Math.abs(itemSubtotal - Number(i.subtotal || 0)) > 0.01) {
        throw new Error('INVOICE_ITEM_SUBTOTAL_MISMATCH');
      }
      const subtotal = Math.round(Number(i.subtotal || 0) * 100) / 100;
      const discountPercent = Math.max(0, Number(i.discountPercent || 0));
      const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
      const taxableSubtotal = Math.max(0, subtotal - discountAmount);
      const taxPercent = Math.max(0, Number(i.taxPercent || 0));
      const taxAmount = Math.round(taxableSubtotal * (taxPercent / 100) * 100) / 100;
      const expectedTotal = taxableSubtotal + taxAmount;
      if (!Number.isFinite(discountPercent) || discountPercent > 100 || !Number.isFinite(taxPercent) || taxPercent > 100 ||
          Math.abs(Number(i.discountAmount || 0) - discountAmount) > 0.01 ||
          Math.abs(Number(i.taxAmount || 0) - taxAmount) > 0.01 ||
          Math.abs(Number(i.total || 0) - expectedTotal) > 0.01) {
        throw new Error('INVOICE_FINANCIAL_TOTAL_MISMATCH');
      }
      if (Number(i.total) < 0 || Number(i.subtotal || 0) < 0 || Number(i.discountAmount || 0) < 0 || Number(i.taxAmount || 0) < 0) {
        throw new Error('INVALID_INVOICE_TOTALS');
      }
      if (resolvedClientId) {
        const client = await db.query('SELECT id FROM clients WHERE id=$1 FOR SHARE',[resolvedClientId]);
        if (!client.rows[0]) throw new Error('Client not found.');
      }
      if (i.proposalId) {
        const proposal = await db.query('SELECT id, client_id, project_id FROM proposals WHERE id=$1 FOR SHARE',[String(i.proposalId)]);
        if (!proposal.rows[0]) throw new Error('Proposal not found.');
        const proposalClientId = proposal.rows[0].client_id ? String(proposal.rows[0].client_id) : null;
        const proposalProjectId = proposal.rows[0].project_id ? String(proposal.rows[0].project_id) : null;
        if (proposalClientId && resolvedClientId && proposalClientId !== resolvedClientId) throw new Error('Proposal does not belong to the selected client.');
        if (proposalProjectId && projectId && proposalProjectId !== projectId) throw new Error('Proposal does not belong to the selected project.');
        if (!resolvedClientId && proposalClientId) resolvedClientId = proposalClientId;
        if (!projectId && proposalProjectId) throw new Error('Proposal-linked invoice requires the proposal project linkage to be preserved.');
      }
      if (projectId) {
        const project = await db.query('SELECT id, client_id FROM projects WHERE id=$1 FOR SHARE',[projectId]);
        if (!project.rows[0]) throw new Error('Project not found.');
        const projectClientId = project.rows[0].client_id ? String(project.rows[0].client_id) : null;
        if (projectClientId && resolvedClientId && projectClientId !== resolvedClientId) {
          throw new Error('Project does not belong to the selected client.');
        }
        if (!resolvedClientId && projectClientId) resolvedClientId = projectClientId;
      }
      await db.query('INSERT INTO invoices (id,proposal_id,invoice_number,client_id,project_id,type,subtotal,discount_percent,discount_amount,tax_percent,tax_amount,total,amount_paid,balance_due,currency,status,issue_date,due_date,notes,payment_terms,metadata,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)',[i.id,i.proposalId||null,i.invoiceNumber,resolvedClientId,projectId,i.type||'invoice',i.subtotal,i.discountPercent||0,i.discountAmount||0,i.taxPercent||0,i.taxAmount||0,i.total,0,i.total,i.currency||'IDR',i.status||'draft',i.issueDate||null,i.dueDate||null,i.notes||null,i.paymentTerms||null,JSON.stringify(metadata(i)),i.createdAt,i.updatedAt]);for(const x of invoiceItems)await db.query('INSERT INTO invoice_items (id,invoice_id,description,quantity,unit_price,amount) VALUES ($1,$2,$3,$4,$5,$6)',[x.id,i.id,x.description,x.quantity,x.unitPrice,x.amount??Number(x.quantity)*Number(x.unitPrice)]);if(audit)await postgresAuditLogRepository.appendWithinTransaction(db,audit);return this.findByIdTx(db,i.id);});}
  private async findByIdTx(db:any,id:string){const r=await db.query('SELECT * FROM invoices WHERE id=$1',[id]);if(!r.rows[0])return null;return mapInvoice(r.rows[0],await this.items(db,id),await this.payments(db,id));}
  async update(id:string,patch:any,audit?:AuditEntry):Promise<any|null>{return withPostgresTransaction(async db=>{const r=await db.query('SELECT * FROM invoices WHERE id=$1 FOR UPDATE',[id]);if(!r.rows[0])return null;const current=mapInvoice(r.rows[0],await this.items(db,id),await this.payments(db,id));const allowedStatuses=new Set(['draft','sent','overdue','partially_paid','paid','cancelled']);if(patch.status!==undefined&&!allowedStatuses.has(String(patch.status)))throw new Error('INVALID_INVOICE_STATUS');if(current.status==='cancelled'&&patch.status&&patch.status!=='cancelled')throw new Error('Cancelled invoices cannot be reopened.');
      if (patch.status === 'cancelled') throw new Error('INVOICE_CANCELLATION_REQUIRES_CANCEL_ENDPOINT');if(patch.updatedAt&&current.updatedAt!==patch.updatedAt)throw new Error('Invoice has been modified since it was loaded. Refresh and retry.');const next={...current,...patch,id,updatedAt:new Date().toISOString(),payments:current.payments};
      let nextClientId = next.clientId ? String(next.clientId) : null;
      const nextProjectId = next.projectId ? String(next.projectId) : null;
      if (nextClientId) {
        const client = await db.query('SELECT id FROM clients WHERE id=$1 FOR SHARE',[nextClientId]);
        if (!client.rows[0]) throw new Error('Client not found.');
      }
      if (nextProjectId) {
        const project = await db.query('SELECT id, client_id FROM projects WHERE id=$1 FOR SHARE',[nextProjectId]);
        if (!project.rows[0]) throw new Error('Project not found.');
        const projectClientId = project.rows[0].client_id ? String(project.rows[0].client_id) : null;
        if (nextClientId && projectClientId && projectClientId !== nextClientId) {
          throw new Error('Project does not belong to the selected client.');
        }
        if (!nextClientId && projectClientId) nextClientId = projectClientId;
      }
      next.clientId=nextClientId; next.projectId=nextProjectId;
      if (current.proposalId && (nextClientId !== String(current.clientId || '') || nextProjectId !== String(current.projectId || ''))) throw new Error('PROPOSAL_LINKAGE_IMMUTABLE');
       if (current.payments.length > 0 && (nextClientId !== String(current.clientId || '') || nextProjectId !== String(current.projectId || ''))) throw new Error('PAID_INVOICE_LINKAGE_IMMUTABLE');
      if (current.payments.length > 0 && Number(next.total) !== Number(current.total)) throw new Error('PAID_INVOICE_TOTAL_IMMUTABLE');
      if (current.payments.length > 0) {
        const protectedFinancialFields = ['subtotal','discountPercent','discountAmount','taxPercent','taxAmount','currency'];
        if (protectedFinancialFields.some((key)=>patch[key]!==undefined && String(patch[key])!==String((current as any)[key]))) {
          throw new Error('PAID_INVOICE_FINANCIAL_FIELDS_IMMUTABLE');
        }
      }
      if (current.payments.length > 0 && patch.items !== undefined) {
        const currentItems = JSON.stringify(current.items.map((x:any)=>({id:x.id,description:x.description,quantity:Number(x.quantity),unitPrice:Number(x.unitPrice),amount:Number(x.amount)})));
        const normalizedNextItems = (next.items || []).map((x:any) => ({
          id: x.id, description: x.description, quantity: Number(x.quantity), unitPrice: Number(x.unitPrice),
          amount: Number(x.amount ?? (Number(x.quantity) * Number(x.unitPrice)))
        }));
        const nextItems = JSON.stringify(normalizedNextItems);
        if (currentItems !== nextItems) throw new Error('PAID_INVOICE_ITEMS_IMMUTABLE');
      }
      this.validateFinancials(next);
      const paid=next.payments.reduce((s:any,p:any)=>s+Number(p.amount||0),0);if(Number(next.total)<paid)throw new Error('Invoice total cannot be lower than payments already recorded.');next.amountPaid=paid;next.balanceDue=Math.max(0,Number(next.total)-paid);if(patch.status==='paid'&&!(next.balanceDue===0&&next.total>0))throw new Error('Invoice can only be marked paid after the remaining balance is fully settled.');if(patch.status==='partially_paid'&&!(paid>0&&next.balanceDue>0))throw new Error('Invoice can only be partially paid when a payment has been recorded and a balance remains.');if(next.balanceDue<=0&&next.total>0)next.status='paid';else if(paid>0)next.status='partially_paid';await db.query('UPDATE invoices SET invoice_number=$2,client_id=$3,project_id=$4,type=$5,subtotal=$6,discount_percent=$7,discount_amount=$8,tax_percent=$9,tax_amount=$10,total=$11,amount_paid=$12,balance_due=$13,currency=$14,status=$15,issue_date=$16,due_date=$17,notes=$18,payment_terms=$19,metadata=$20,updated_at=$21 WHERE id=$1',[id,current.invoiceNumber,next.clientId||null,next.projectId||null,next.type,next.subtotal,next.discountPercent,next.discountAmount,next.taxPercent,next.taxAmount,next.total,paid,next.balanceDue,next.currency,next.status,next.issueDate||null,next.dueDate||null,next.notes||null,next.paymentTerms||null,JSON.stringify(metadata(next)),next.updatedAt]);if(patch.items!==undefined){await db.query('DELETE FROM invoice_items WHERE invoice_id=$1',[id]);for(const x of next.items||[])await db.query('INSERT INTO invoice_items (id,invoice_id,description,quantity,unit_price,amount) VALUES ($1,$2,$3,$4,$5,$6)',[x.id,id,x.description,x.quantity,x.unitPrice,x.amount??Number(x.quantity)*Number(x.unitPrice)])}if(audit)await postgresAuditLogRepository.appendWithinTransaction(db,audit);return this.findByIdTx(db,id);});}
  async recordPayment(id:string,payment:any,audit?:AuditEntry):Promise<any|null>{return withPostgresTransaction(async db=>{const r=await db.query('SELECT * FROM invoices WHERE id=$1 FOR UPDATE',[id]);if(!r.rows[0])return null;const current=mapInvoice(r.rows[0],await this.items(db,id),await this.payments(db,id));
    const authoritativePaid=current.payments.reduce((sum:any,p:any)=>sum+Number(p.amount||0),0);
    const storedPaid=Number(r.rows[0].amount_paid||0);
    if(!Number.isFinite(storedPaid)||Math.abs(storedPaid-authoritativePaid)>0.01||authoritativePaid>Number(current.total||0)) throw new Error('INVOICE_PAYMENT_LEDGER_INCONSISTENT');
    const authoritativeBalance=Math.max(0,Number(current.total||0)-authoritativePaid);
    if (payment.idempotencyKey) {
      await db.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 9127341))',
        [`invoice-payment:${id}:${String(payment.idempotencyKey)}`]
      );
      const duplicate = await db.query("SELECT id,amount,method,paid_at,reference,metadata FROM invoice_payments WHERE invoice_id=$1 AND metadata->>'idempotencyKey'=$2 LIMIT 1",[id,String(payment.idempotencyKey)]);
      if (duplicate.rows[0]) {
        const duplicateMetadata=obj(duplicate.rows[0].metadata);
        const requestedFingerprint=JSON.stringify({
          amount: Math.round(Number(payment.amount)*100)/100,
          method: String(payment.method||''),
          date: String(payment.date||''),
          reference: String(payment.reference||''),
          notes: String(payment.notes||'')
        });
        const storedFingerprint=String(duplicateMetadata.requestFingerprint||JSON.stringify({
          amount: Math.round(Number(duplicate.rows[0].amount)*100)/100,
          method: String(duplicate.rows[0].method||''),
          date: date(duplicate.rows[0].paid_at),
          reference: String(duplicate.rows[0].reference||''),
          notes: String(duplicateMetadata.notes||'')
        }));
        if (storedFingerprint!==requestedFingerprint) throw new Error('IDEMPOTENCY_KEY_REUSE_CONFLICT');
        const replayed = await this.findByIdTx(db,id); return replayed ? { ...replayed, __idempotentReplay: true } : replayed;
      }
    }
    if(current.status==='cancelled')throw new Error('Cancelled invoices cannot receive payments.');
    const paymentAmount=Number(payment.amount);
    if(!Number.isFinite(paymentAmount)||paymentAmount<=0||paymentAmount>authoritativeBalance)throw new Error('Payment exceeds the current invoice balance.');
    const paymentMetadata={recordedBy:payment.recordedBy||payment.userId||'system',notes:payment.notes||'',idempotencyKey:payment.idempotencyKey||undefined,requestFingerprint:JSON.stringify({
      amount: Math.round(paymentAmount*100)/100,
      method: String(payment.method||''),
      date: String(payment.date||''),
      reference: String(payment.reference||''),
      notes: String(payment.notes||'')
    })};
    await db.query(
      'INSERT INTO invoice_payments (id,invoice_id,amount,paid_at,method,reference,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [payment.id,id,paymentAmount,payment.date,payment.method,payment.reference||null,JSON.stringify(paymentMetadata)]
    );
    const totalPaid=authoritativePaid+paymentAmount;
    const balance=Math.max(0,current.total-totalPaid);
    const status=balance<=0?'paid':'partially_paid';
    const auditTrail=[...current.auditTrail,{action:'payment_recorded',timestamp:new Date().toISOString(),user:payment.recordedBy||payment.userId||'system',note:payment.reference||payment.notes||''}];
    const updatedAt=new Date().toISOString();
    await db.query(
      'UPDATE invoices SET amount_paid=$2,balance_due=$3,status=$4,metadata=$5,updated_at=$6 WHERE id=$1',
      [id,totalPaid,balance,status,JSON.stringify({...metadata(current),auditTrail}),updatedAt]
    );
    if(current.clientId){
      const clientRow=await db.query('SELECT metadata FROM clients WHERE id=$1 FOR UPDATE',[current.clientId]);
      if(!clientRow.rows[0])throw new Error('Invoice client reference is invalid.');
      const clientMetadata=obj(clientRow.rows[0].metadata);
      const previousSpend=Number(clientMetadata.totalSpend||0);
      if(!Number.isFinite(previousSpend)||previousSpend<0)throw new Error('Client total spend is invalid.');
      const nextSpend=Math.round((previousSpend+paymentAmount)*100)/100;
      await db.query(
        'UPDATE clients SET metadata=$2,updated_at=$3 WHERE id=$1',
        [current.clientId,JSON.stringify({...clientMetadata,totalSpend:nextSpend}),updatedAt]
      );
    }
    if(audit)await postgresAuditLogRepository.appendWithinTransaction(db,audit);return this.findByIdTx(db,id);});}
  async cancel(id:string,user:string,audit?:AuditEntry):Promise<any|null>{return withPostgresTransaction(async db=>{const r=await db.query('SELECT * FROM invoices WHERE id=$1 FOR UPDATE',[id]);if(!r.rows[0])return null;const current=mapInvoice(r.rows[0],await this.items(db,id),await this.payments(db,id));if(current.status==='cancelled')return current;if(current.payments.length>0)throw new Error('INVOICE_WITH_PAYMENTS_CANNOT_BE_CANCELLED');const auditTrail=[...current.auditTrail,{action:'cancelled',timestamp:new Date().toISOString(),user}];await db.query('UPDATE invoices SET status=$2,metadata=$3,updated_at=$4 WHERE id=$1',[id,'cancelled',JSON.stringify({...metadata(current),auditTrail:auditTrail}),new Date().toISOString()]);if(audit)await postgresAuditLogRepository.appendWithinTransaction(db,audit);return this.findByIdTx(db,id);});}
  async delete(id:string,audit?:AuditEntry){return this.cancel(id,'system',audit);}
}
export const postgresInvoiceRepository=new PostgresInvoiceRepository();
