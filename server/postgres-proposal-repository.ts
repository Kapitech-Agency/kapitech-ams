import crypto from 'node:crypto';
import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type Row = Record<string, any>;
const iso=(v:Date|string)=>v instanceof Date?v.toISOString():new Date(v).toISOString();
const date=(v:unknown)=>v==null?'':v instanceof Date?v.toISOString().slice(0,10):String(v).slice(0,10);
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'?v as Record<string,unknown>:{};

function mapProposal(row:Row, itemRows:Row[]):any {
  const metadata=obj(row.metadata);
  return {...metadata,id:row.id,proposalNumber:row.proposal_number,title:row.title,
    clientId:row.client_id??undefined,dealId:row.deal_id??undefined,projectId:row.project_id??undefined,
    subtotal:Number(row.subtotal),discount:Number(row.discount),taxPercent:Number(row.tax_percent),tax:Number(row.tax),
    total:Number(row.total),currency:row.currency,validityPeriod:row.validity_period??'',paymentTerms:row.payment_terms??'',
    owner:row.owner??'',status:row.status,notes:row.notes??'',createdDate:row.created_date?date(row.created_date):undefined,
    sentDate:row.sent_date?date(row.sent_date):undefined,approvedDate:row.approved_date?date(row.approved_date):undefined,
    items:itemRows.map(i=>({id:i.id,description:i.description,quantity:Number(i.quantity),unitPrice:Number(i.unit_price)})),
    createdAt:iso(row.created_at),updatedAt:iso(row.updated_at)};
}
function mapExistingInvoice(row:Row,itemRows:Row[],paymentRows:Row[]):any {
  const metadata=obj(row.metadata);
  const amountPaid=Number(row.amount_paid||0);
  const total=Number(row.total||0);
  return {
    ...metadata,
    id:row.id,
    invoiceNumber:row.invoice_number,
    proposalId:row.proposal_id??'',
    clientId:row.client_id??'',
    projectId:row.project_id??'',
    type:row.type||'invoice',
    items:itemRows.map(i=>({id:i.id,description:i.description,quantity:Number(i.quantity),unitPrice:Number(i.unit_price),amount:Number(i.amount)})),
    subtotal:Number(row.subtotal||0),
    discountPercent:Number(row.discount_percent||0),
    discountAmount:Number(row.discount_amount||0),
    taxPercent:Number(row.tax_percent||0),
    taxAmount:Number(row.tax_amount||0),
    total,
    amountPaid,
    balanceDue:Math.max(0,total-amountPaid),
    currency:row.currency,
    status:row.status,
    issueDate:date(row.issue_date),
    dueDate:date(row.due_date),
    paidDate:date(row.paid_date),
    notes:row.notes||'',
    paymentTerms:row.payment_terms||'',
    payments:paymentRows.map(p=>({id:p.id,amount:Number(p.amount),date:date(p.paid_at),paidAt:date(p.paid_at),method:p.method,reference:p.reference||'',...(obj(p.metadata) as any)})),
    auditTrail:Array.isArray(metadata.auditTrail)?metadata.auditTrail:[],
    createdAt:iso(row.created_at),
    updatedAt:iso(row.updated_at)
  };
}

function metadata(p:any){const {id,proposalNumber,title,clientId,dealId,projectId,subtotal,discount,taxPercent,tax,total,currency,validityPeriod,paymentTerms,owner,status,notes,createdDate,sentDate,approvedDate,items,createdAt,updatedAt,...rest}=p;return rest;}

export class PostgresProposalRepository {
  private readonly creatableStatuses = new Set(['Draft','Internal Review','Sent']);
  private async items(db:any,id:string){const r=await db.query('SELECT * FROM proposal_items WHERE proposal_id=$1 ORDER BY id ASC',[id]);return r.rows as Row[];}
  async list():Promise<any[]>{const db=getPostgresPool();const r=await db.query('SELECT * FROM proposals ORDER BY created_at DESC');const items=await db.query('SELECT * FROM proposal_items ORDER BY id ASC');const m=new Map<string,Row[]>();for(const i of items.rows){const a=m.get(i.proposal_id)||[];a.push(i);m.set(i.proposal_id,a)}return r.rows.map((x:Row)=>mapProposal(x,m.get(x.id)||[]));}
  async findById(id:string):Promise<any|null>{const db=getPostgresPool();const r=await db.query('SELECT * FROM proposals WHERE id=$1',[id]);if(!r.rows[0])return null;return mapProposal(r.rows[0],await this.items(db,id));}
  async create(p:any,audit?:AuditEntry):Promise<any>{
    const requestedStatus = String(p.status || 'Draft');
    if (!this.creatableStatuses.has(requestedStatus)) throw new Error('PROPOSAL_CREATION_WORKFLOW_ONLY');
    return withPostgresTransaction(async db=>{
    let resolvedClientId = p.clientId ? String(p.clientId) : null;
    if (resolvedClientId) {
      const client = await db.query('SELECT id FROM clients WHERE id=$1 FOR SHARE',[resolvedClientId]);
      if (!client.rows[0]) throw new Error('Proposal client not found.');
    }
    if (p.projectId) {
      const project = await db.query('SELECT id,client_id FROM projects WHERE id=$1 FOR SHARE',[String(p.projectId)]);
      if (!project.rows[0]) throw new Error('Proposal project not found.');
      const projectClientId = project.rows[0].client_id ? String(project.rows[0].client_id) : null;
      if (projectClientId && resolvedClientId && projectClientId !== resolvedClientId) throw new Error('Proposal project does not belong to the selected client.');
      if (!resolvedClientId && projectClientId) resolvedClientId = projectClientId;
    }
    if (p.dealId) {
      const deal = await db.query('SELECT id,client_id FROM crm_deals WHERE id=$1 FOR SHARE',[String(p.dealId)]);
      if (!deal.rows[0]) throw new Error('Proposal deal not found.');
      const dealClientId = deal.rows[0].client_id ? String(deal.rows[0].client_id) : null;
      if (dealClientId && resolvedClientId && dealClientId !== resolvedClientId) throw new Error('Proposal deal does not belong to the selected client.');
      if (!resolvedClientId && dealClientId) resolvedClientId = dealClientId;
    }
    await db.query(`INSERT INTO proposals (id,proposal_number,title,client_id,deal_id,project_id,subtotal,discount,tax_percent,tax,total,currency,validity_period,payment_terms,owner,status,notes,created_date,sent_date,approved_date,metadata,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,[p.id,p.proposalNumber,p.title,resolvedClientId,p.dealId||null,p.projectId||null,p.subtotal,p.discount,p.taxPercent,p.tax,p.total,p.currency,p.validityPeriod||null,p.paymentTerms||null,p.owner||null,p.status,p.notes||null,p.createdDate||null,p.sentDate||null,p.approvedDate||null,JSON.stringify(metadata(p)),p.createdAt,p.updatedAt]);for(const i of p.items||[])await this.insertItem(db,p.id,i);if(audit)await postgresAuditLogRepository.appendWithinTransaction(db,audit);return p;});}
  async update(id:string,patch:any,audit?:AuditEntry):Promise<any|null>{return withPostgresTransaction(async db=>{const r=await db.query('SELECT * FROM proposals WHERE id=$1 FOR UPDATE',[id]);if(!r.rows[0])return null;const current=mapProposal(r.rows[0],await this.items(db,id)); const next={...current,...patch,id,updatedAt:new Date().toISOString()};
      let resolvedClientId = next.clientId ? String(next.clientId) : null;
      if (resolvedClientId) { const x=await db.query('SELECT id FROM clients WHERE id=$1 FOR SHARE',[resolvedClientId]); if(!x.rows[0])throw new Error('Proposal client not found.'); }
      if (next.projectId) { const x=await db.query('SELECT id,client_id FROM projects WHERE id=$1 FOR SHARE',[String(next.projectId)]); if(!x.rows[0])throw new Error('Proposal project not found.'); const projectClientId=x.rows[0].client_id?String(x.rows[0].client_id):null; if(resolvedClientId&&projectClientId&&projectClientId!==resolvedClientId)throw new Error('Proposal project does not belong to the selected client.'); if(!resolvedClientId&&projectClientId)resolvedClientId=projectClientId; }
      if (next.dealId) { const x=await db.query('SELECT id,client_id FROM crm_deals WHERE id=$1 FOR SHARE',[String(next.dealId)]); if(!x.rows[0])throw new Error('Proposal deal not found.'); const dealClientId=x.rows[0].client_id?String(x.rows[0].client_id):null; if(resolvedClientId&&dealClientId&&dealClientId!==resolvedClientId)throw new Error('Proposal deal does not belong to the selected client.'); if(!resolvedClientId&&dealClientId)resolvedClientId=dealClientId; }
      next.clientId=resolvedClientId;
      const currentStatus = String(r.rows[0].status || '');
      const nextStatus = String(next.status || currentStatus);
      if (!['Draft','Internal Review','Sent','Approved','Rejected','Accepted'].includes(nextStatus)) {
        throw new Error('INVALID_PROPOSAL_STATUS');
      }
      if (nextStatus === 'Accepted' && currentStatus !== 'Accepted') {
        throw new Error('ACCEPTED_PROPOSAL_WORKFLOW_ONLY');
      }
      if (['Approved','Rejected'].includes(nextStatus) && currentStatus !== nextStatus && !['Draft','Internal Review','Sent'].includes(currentStatus)) {
        throw new Error('PROPOSAL_APPROVAL_TRANSITION_INVALID');
      }
      if (String(r.rows[0].status)==='Accepted') {
        if (patch.status !== undefined && patch.status !== 'Accepted') throw new Error('ACCEPTED_PROPOSAL_IMMUTABLE');
        const protectedFields=['clientId','dealId','projectId','subtotal','discount','taxPercent','tax','total','currency','items'];
        if (protectedFields.some((key)=>patch[key]!==undefined)) throw new Error('ACCEPTED_PROPOSAL_IMMUTABLE');
      }await db.query('UPDATE proposals SET proposal_number=$2,title=$3,client_id=$4,deal_id=$5,project_id=$6,subtotal=$7,discount=$8,tax_percent=$9,tax=$10,total=$11,currency=$12,validity_period=$13,payment_terms=$14,owner=$15,status=$16,notes=$17,created_date=$18,sent_date=$19,approved_date=$20,metadata=$21,updated_at=$22 WHERE id=$1',[id,next.proposalNumber,next.title,next.clientId||null,next.dealId||null,next.projectId||null,next.subtotal,next.discount,next.taxPercent,next.tax,next.total,next.currency,next.validityPeriod||null,next.paymentTerms||null,next.owner||null,next.status,next.notes||null,next.createdDate||null,next.sentDate||null,next.approvedDate||null,JSON.stringify(metadata(next)),next.updatedAt]);if(patch.items!==undefined){await db.query('DELETE FROM proposal_items WHERE proposal_id=$1',[id]);for(const i of next.items||[])await this.insertItem(db,id,i)}if(audit)await postgresAuditLogRepository.appendWithinTransaction(db,audit);return mapProposal((await db.query('SELECT * FROM proposals WHERE id=$1',[id])).rows[0],await this.items(db,id));});}
  async delete(id:string,audit?:AuditEntry){
    return withPostgresTransaction(async db=>{
      const current=await db.query('SELECT id,status FROM proposals WHERE id=$1 FOR UPDATE',[id]);
      if(!current.rows[0]) return false;
      const status=String(current.rows[0].status||'');
      if(status!=='Draft') throw new Error('PROPOSAL_DELETE_RESTRICTED');
      const result=await db.query('DELETE FROM proposals WHERE id=$1',[id]);
      if(audit)await postgresAuditLogRepository.appendWithinTransaction(db,audit);
      return result.rowCount===1;
    });
  }
  async approve(id:string,audit?:AuditEntry):Promise<any|null>{return this.update(id,{status:'Approved',approvedDate:new Date().toISOString().slice(0,10)},audit);}
  async convertToInvoice(id:string,audit?:AuditEntry):Promise<any|null>{
    return withPostgresTransaction(async db=>{
      const r=await db.query('SELECT * FROM proposals WHERE id=$1 FOR UPDATE',[id]);
      if(!r.rows[0])return null;
      const p=mapProposal(r.rows[0],await this.items(db,id));

      const linkedInvoices=await db.query('SELECT * FROM invoices WHERE proposal_id=$1 ORDER BY created_at ASC LIMIT 2',[id]);
      if(linkedInvoices.rows.length>1) throw new Error('MULTIPLE_INVOICES_FOR_PROPOSAL');

      if(String(p.status)==='Accepted'){
        if(!linkedInvoices.rows[0]) throw new Error('ACCEPTED_PROPOSAL_INVOICE_LINK_MISSING');
        const existing=linkedInvoices.rows[0];
        const itemRows=await db.query('SELECT * FROM invoice_items WHERE invoice_id=$1 ORDER BY id ASC',[existing.id]);
        const paymentRows=await db.query('SELECT * FROM invoice_payments WHERE invoice_id=$1 ORDER BY paid_at DESC, id DESC',[existing.id]);
        return {
          ...mapExistingInvoice(existing,itemRows.rows,paymentRows.rows),
          __idempotentReplay:true
        };
      }

      if(String(p.status)!=='Approved')throw new Error('PROPOSAL_APPROVAL_REQUIRED');
      if(p.clientId){const x=await db.query('SELECT id FROM clients WHERE id=$1 FOR SHARE',[p.clientId]);if(!x.rows[0])throw new Error('Proposal client not found.');}
      if(p.projectId){const x=await db.query('SELECT id, client_id FROM projects WHERE id=$1 FOR SHARE',[p.projectId]);if(!x.rows[0])throw new Error('Proposal project not found.');if(p.clientId&&x.rows[0].client_id&&String(x.rows[0].client_id)!==String(p.clientId))throw new Error('Proposal project does not belong to the selected client.');}
      if(p.dealId){const x=await db.query('SELECT id, client_id FROM crm_deals WHERE id=$1 FOR SHARE',[p.dealId]);if(!x.rows[0])throw new Error('Proposal deal not found.');if(p.clientId&&x.rows[0].client_id&&String(x.rows[0].client_id)!==String(p.clientId))throw new Error('Proposal deal does not belong to the selected client.');}

      const now=new Date().toISOString(),issue=now.slice(0,10),due=new Date(Date.now()+14*86400000).toISOString().slice(0,10);
      const proposalSubtotal = Math.round(Number(p.subtotal || 0) * 100) / 100;
      const proposalDiscount = Math.round(Number(p.discount || 0) * 100) / 100;
      const proposalTaxPercent = Number(p.taxPercent || 0);
      const proposalTax = Math.round(Number(p.tax || 0) * 100) / 100;
      const derivedDiscountPercent = proposalSubtotal > 0
        ? proposalDiscount / proposalSubtotal * 100
        : 0;
      const derivedDiscountAmount = Math.round(proposalSubtotal * (derivedDiscountPercent / 100) * 100) / 100;
      const derivedTaxableSubtotal = Math.max(0, proposalSubtotal - derivedDiscountAmount);
      const derivedTaxAmount = Math.round(derivedTaxableSubtotal * (proposalTaxPercent / 100) * 100) / 100;
      const derivedTotal = Math.round((derivedTaxableSubtotal + derivedTaxAmount) * 100) / 100;
      if (
        !Number.isFinite(proposalSubtotal) || proposalSubtotal < 0 ||
        !Number.isFinite(proposalDiscount) || proposalDiscount < 0 ||
        proposalDiscount > proposalSubtotal ||
        !Number.isFinite(proposalTaxPercent) || proposalTaxPercent < 0 || proposalTaxPercent > 100 ||
        Math.abs(derivedDiscountAmount - proposalDiscount) > 0.01 ||
        Math.abs(derivedTaxAmount - proposalTax) > 0.01 ||
        Math.abs(derivedTotal - Number(p.total || 0)) > 0.01
      ) {
        throw new Error('PROPOSAL_FINANCIAL_TOTAL_MISMATCH');
      }
      const invoiceYear = new Date().getFullYear();
      await db.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 9127341))',
        [`invoice-number:${invoiceYear}`]
      );
      let n = '';
      let invoiceNumberExists = true;
      for (let attempt = 0; attempt < 10 && invoiceNumberExists; attempt++) {
        n = `INV-KAPI-${invoiceYear}-${crypto.randomInt(1000, 1000000)}`;
        const exists = await db.query('SELECT 1 FROM invoices WHERE invoice_number=$1 LIMIT 1', [n]);
        invoiceNumberExists = Boolean(exists.rows[0]);
      }
      if (invoiceNumberExists) throw new Error('INVOICE_NUMBER_GENERATION_FAILED');
      const invoice={
        id:`inv_${Date.now()}_${Math.random().toString(16).slice(2,8)}`,
        invoiceNumber:n,
        proposalId:id,
        clientId:p.clientId||null,
        projectId:p.projectId||null,
        type:'invoice',
        subtotal:p.subtotal,
        discountPercent:derivedDiscountPercent,
        discountAmount:proposalDiscount,
        taxPercent:proposalTaxPercent,
        taxAmount:proposalTax,
        total:derivedTotal,
        amountPaid:0,
        balanceDue:derivedTotal,
        currency:p.currency,
        status:'draft',
        issueDate:issue,
        dueDate:due,
        notes:`Generated from Proposal ${p.proposalNumber}. Terms: ${p.paymentTerms}`,
        paymentTerms:p.paymentTerms,
        createdAt:now,
        updatedAt:now
      };
      await db.query(`INSERT INTO invoices (id,proposal_id,invoice_number,client_id,project_id,type,subtotal,discount_percent,discount_amount,tax_percent,tax_amount,total,amount_paid,balance_due,currency,status,issue_date,due_date,notes,payment_terms,metadata,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,[
        invoice.id,invoice.proposalId,invoice.invoiceNumber,invoice.clientId,invoice.projectId,invoice.type,invoice.subtotal,invoice.discountPercent,invoice.discountAmount,
        invoice.taxPercent,invoice.taxAmount,invoice.total,0,invoice.balanceDue,invoice.currency,invoice.status,issue,due,invoice.notes,invoice.paymentTerms,'{}',now,now
      ]);
      for(const i of p.items){
        const quantity=Number(i.quantity);
        const unitPrice=Number(i.unitPrice);
        const amount=Math.round(quantity*unitPrice*100)/100;
        if(!Number.isFinite(quantity)||quantity<=0||!Number.isFinite(unitPrice)||unitPrice<0) throw new Error('INVALID_PROPOSAL_ITEM');
        await db.query('INSERT INTO invoice_items (id,invoice_id,description,quantity,unit_price,amount) VALUES ($1,$2,$3,$4,$5,$6)',[`ii_${i.id}`,invoice.id,i.description,quantity,unitPrice,amount]);
      }
      await db.query('UPDATE proposals SET status=$2,updated_at=$3 WHERE id=$1',[id,'Accepted',now]);
      if(audit)await postgresAuditLogRepository.appendWithinTransaction(db,audit);
      return {
        ...invoice,
        items:p.items.map((i:any)=>({id:`ii_${i.id}`,description:i.description,quantity:Number(i.quantity),unitPrice:Number(i.unitPrice),amount:Math.round(Number(i.quantity)*Number(i.unitPrice)*100)/100})),
        payments:[],
        auditTrail:[]
      };
    });
  }
  private async insertItem(db:any,pid:string,i:any){await db.query('INSERT INTO proposal_items (id,proposal_id,description,quantity,unit_price) VALUES ($1,$2,$3,$4,$5)',[i.id,pid,i.description,i.quantity,i.unitPrice]);}
}
export const postgresProposalRepository=new PostgresProposalRepository();