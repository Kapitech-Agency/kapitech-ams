import type { DatabaseSchema, StoredSession, StoredUser } from './db.ts';
import { getPostgresPool } from './postgres.ts';
import { PostgresAuthRepository } from './postgres-repository.ts';
import { decryptSecret } from './secret-crypto.ts';

type Row=Record<string,any>;
const iso=(v:any)=>v==null?'':v instanceof Date?v.toISOString():new Date(v).toISOString();
const date=(v:any)=>v==null?'':v instanceof Date?v.toISOString().slice(0,10):String(v).slice(0,10);
const obj=(v:any)=>v&&typeof v==='object'?v:{};
const base=(r:Row,x:Row={})=>({...obj(r.metadata),...x,id:r.id});
const mapUser=(r:Row):StoredUser=>({id:r.id,name:r.name,username:r.username,email:r.email,passwordHash:r.password_hash,salt:r.salt,passwordAlgorithm:r.password_algorithm,role:r.role,stakeholderType:r.stakeholder_type,permissions:obj(r.permissions),mfaEnabled:r.mfa_enabled,mfaSecret:decryptSecret(r.mfa_secret),mfaPendingSecret:decryptSecret(r.mfa_pending_secret),mfaPendingSecretCreatedAt:r.mfa_pending_secret_created_at?iso(r.mfa_pending_secret_created_at):undefined,mfaRecoveryCodeHashes:Array.isArray(r.mfa_recovery_code_hashes)?r.mfa_recovery_code_hashes:[],division:r.division,status:r.status,lastLogin:r.last_login?iso(r.last_login):'',createdAt:iso(r.created_at)});
const mapSession=(r:Row):StoredSession=>({tokenHash:r.token_hash,userId:r.user_id,createdAt:iso(r.created_at),lastActivityAt:iso(r.last_activity_at),expiresAt:new Date(r.expires_at).getTime(),rememberMe:r.remember_me,ip:r.ip??'',userAgent:r.user_agent,kind:r.kind,mfaFailedAttempts:r.mfa_failed_attempts});

export class PostgresDatabaseRepository {
  readonly auth=new PostgresAuthRepository();
 async loadDatabase():Promise<DatabaseSchema>{
  const p=getPostgresPool();
  const names=['users','sessions','leads','crm_deals','clients','projects','proposals','proposal_items','tasks','time_logs','invoices','invoice_items','invoice_payments','expenses','approvals','vendors','documents','document_access','notifications','cms_services','cms_projects','cms_testimonials','cms_settings','audit_logs','notification_settings'];
  const rs=await Promise.all(names.map(n=>p.query('SELECT * FROM '+n))); const m=new Map(names.map((n,i)=>[n,rs[i].rows as Row[]]));
  const users=(m.get('users')??[]).map(mapUser),sessions=(m.get('sessions')??[]).map(mapSession);
  const leads=(m.get('leads')??[]).map(r=>base(r,{fullName:r.full_name,honeypotTriggered:r.honeypot_triggered,createdAt:iso(r.created_at),updatedAt:iso(r.updated_at)}));
  const clients=(m.get('clients')??[]).map(r=>base(r,{createdAt:iso(r.created_at),updatedAt:iso(r.updated_at)}));
  const crmDeals=(m.get('crm_deals')??[]).map(r=>base(r,{clientId:r.client_id??undefined,clientName:r.client_name??undefined,servicePillar:r.service_pillar??undefined,expectedCloseDate:r.expected_close_date?date(r.expected_close_date):undefined,createdAt:iso(r.created_at),updatedAt:iso(r.updated_at)}));
  const projects=(m.get('projects')??[]).map(r=>base(r,{clientId:r.client_id??undefined,startDate:r.start_date?date(r.start_date):undefined,endDate:r.end_date?date(r.end_date):undefined,createdAt:iso(r.created_at),updatedAt:iso(r.updated_at)}));
  const pi=new Map<string,Row[]>();for(const r of m.get('proposal_items')??[]){const a=pi.get(r.proposal_id)??[];a.push(r);pi.set(r.proposal_id,a)}
  const proposals=(m.get('proposals')??[]).map(r=>base(r,{proposalNumber:r.proposal_number,clientId:r.client_id??undefined,dealId:r.deal_id??undefined,projectId:r.project_id??undefined,taxPercent:Number(r.tax_percent),createdDate:r.created_date?date(r.created_date):undefined,sentDate:r.sent_date?date(r.sent_date):undefined,approvedDate:r.approved_date?date(r.approved_date):undefined,items:(pi.get(r.id)??[]).map(i=>({id:i.id,description:i.description,quantity:Number(i.quantity),unitPrice:Number(i.unit_price)})),createdAt:iso(r.created_at),updatedAt:iso(r.updated_at)}));
  const tasks=(m.get('tasks')??[]).map(r=>base(r,{projectId:r.project_id??undefined,assigneeUserId:r.assignee_user_id??undefined,dueDate:r.due_date?date(r.due_date):undefined,createdAt:iso(r.created_at),updatedAt:iso(r.updated_at)}));
  const timeLogs=(m.get('time_logs')??[]).map(r=>base(r,{projectId:r.project_id??undefined,taskId:r.task_id??undefined,userId:r.user_id??undefined,loggedAt:iso(r.logged_at),createdAt:iso(r.created_at)}));
  const ii=new Map<string,Row[]>(),ip=new Map<string,Row[]>();for(const r of m.get('invoice_items')??[]){const a=ii.get(r.invoice_id)??[];a.push(r);ii.set(r.invoice_id,a)}for(const r of m.get('invoice_payments')??[]){const a=ip.get(r.invoice_id)??[];a.push(r);ip.set(r.invoice_id,a)}
  const invoices=(m.get('invoices')??[]).map(r=>base(r,{invoiceNumber:r.invoice_number,clientId:r.client_id??undefined,projectId:r.project_id??undefined,discountPercent:Number(r.discount_percent),discountAmount:Number(r.discount_amount),taxPercent:Number(r.tax_percent),taxAmount:Number(r.tax_amount),amountPaid:Number(r.amount_paid),balanceDue:Number(r.balance_due),issueDate:r.issue_date?date(r.issue_date):undefined,dueDate:r.due_date?date(r.due_date):undefined,paidDate:r.paid_date?date(r.paid_date):undefined,items:(ii.get(r.id)??[]).map(i=>({id:i.id,description:i.description,quantity:Number(i.quantity),unitPrice:Number(i.unit_price),amount:Number(i.amount)})),payments:(ip.get(r.id)??[]).map(x=>({id:x.id,amount:Number(x.amount),date:date(x.paid_at),paidAt:date(x.paid_at),method:x.method??undefined,reference:x.reference??undefined})),createdAt:iso(r.created_at),updatedAt:iso(r.updated_at)}));
  const expenses=(m.get('expenses')??[]).map(r=>base(r,{date:date(r.expense_date),expenseDate:date(r.expense_date),recordedByUserId:r.recorded_by_user_id??undefined,createdAt:iso(r.created_at)}));
  const approvals=(m.get('approvals')??[]).map(r=>base(r,{referenceId:r.reference_id??undefined,requesterUserId:r.requester_user_id??undefined,requesterRole:r.requester_role??undefined,approvalDate:r.approval_date?date(r.approval_date):undefined,createdAt:iso(r.created_at)}));
  const vendors=(m.get('vendors')??[]).map(r=>base(r,{contactPerson:r.contact_person??undefined,paymentTerms:r.payment_terms??undefined,monthlySpend:Number(r.monthly_spend),createdAt:iso(r.created_at)}));
  const da=new Map<string,string[]>();for(const r of m.get('document_access')??[]){const a=da.get(r.document_id)??[];a.push(r.user_id);da.set(r.document_id,a)}
  const documents=(m.get('documents')??[]).map(r=>base(r,{mimeType:r.mime_type??undefined,sizeBytes:r.size_bytes==null?undefined:Number(r.size_bytes),relatedEntity:r.related_entity??undefined,relatedId:r.related_id??undefined,sourceType:r.source_type,storageKey:r.storage_key??undefined,ownerUserId:r.owner_user_id??undefined,externalUrl:r.external_url??undefined,accessUserIds:da.get(r.id)??[],uploadedAt:iso(r.uploaded_at),createdAt:iso(r.created_at)}));
  const notifications=(m.get('notifications')??[]).map(r=>base(r,{linkUrl:r.link_url??undefined,recipientUserId:r.recipient_user_id??undefined,createdAt:iso(r.created_at)}));
  const cmsServices=(m.get('cms_services')??[]).map(r=>({...obj(r.data),id:r.id,name:r.name,slug:r.slug??undefined,description:r.description??undefined,createdAt:iso(r.created_at),updatedAt:iso(r.updated_at)}));
  const cmsProjects=(m.get('cms_projects')??[]).map(r=>({...obj(r.data),id:r.id,name:r.name,slug:r.slug??undefined,description:r.description??undefined,createdAt:iso(r.created_at),updatedAt:iso(r.updated_at)}));
  const cmsTestimonials=(m.get('cms_testimonials')??[]).map(r=>({...obj(r.data),id:r.id,name:r.name,company:r.company??undefined,quote:r.quote??undefined,createdAt:iso(r.created_at),updatedAt:iso(r.updated_at)}));
  const sr=m.get('cms_settings')??[],cmsSettings:any=Object.fromEntries(sr.map(r=>[r.key,r.value]));if(sr.length)cmsSettings.updatedAt=iso(sr[0].updated_at);
  const auditLogs=(m.get('audit_logs')??[]).map(r=>base(r,{actorRole:r.actor_role,actorUserId:r.actor_user_id??undefined,userAgent:r.user_agent??'',timestamp:iso(r.timestamp)}));
  const n=m.get('notification_settings')?.[0];const notificationSettings={targetEmail:n?.target_email??'',formspreeEndpoint:n?.formspree_endpoint??'',telegramBotToken:'',telegramChatId:n?.telegram_chat_id??'',isEmailActive:Boolean(n?.is_email_active),isTelegramActive:Boolean(n?.is_telegram_active),updatedAt:n?.updated_at?iso(n.updated_at):''};
  return{users,sessions,leads,crmDeals,clients,projects,proposals,tasks,timeLogs,invoices,expenses,approvals,vendors,documents,notifications,cmsServices,cmsProjects,cmsTestimonials,cmsSettings,auditLogs,notificationSettings};
 }}
export const postgresDatabaseRepository=new PostgresDatabaseRepository();
