import crypto from 'node:crypto';
import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

type Row = Record<string, any>;
const iso = (v: Date | string): string => v instanceof Date ? v.toISOString() : new Date(v).toISOString();
const date = (v: unknown): string => v == null ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' ? v as Record<string, unknown> : {};

function mapDeal(row: Row): any {
  const metadata = obj(row.metadata);
  return {
    ...(metadata as Record<string, unknown>),
    id: row.id,
    title: row.title ?? metadata.title ?? '',
    clientId: row.client_id ?? undefined,
    clientName: row.client_name ?? metadata.clientName ?? '',
    company: row.company ?? metadata.company ?? '',
    email: row.email ?? metadata.email ?? '',
    phone: row.phone ?? metadata.phone ?? '',
    servicePillar: row.service_pillar ?? metadata.servicePillar ?? '',
    value: Number(row.value ?? metadata.value ?? 0),
    stage: row.stage ?? metadata.stage ?? 'new',
    priority: row.priority ?? metadata.priority ?? 'medium',
    probability: Number(row.probability ?? metadata.probability ?? 0),
    owner: row.owner ?? metadata.owner ?? '',
    expectedCloseDate: row.expected_close_date ? date(row.expected_close_date) : (typeof metadata.expectedCloseDate === 'string' ? metadata.expectedCloseDate : ''),
    notes: metadata.notes ?? '',
    source: metadata.source ?? '',
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function toMetadata(deal: any): Record<string, unknown> {
  const {
    id, title, clientId, clientName, company, email, phone, servicePillar,
    value, stage, priority, probability, owner, expectedCloseDate,
    createdAt, updatedAt, ...metadata
  } = deal;
  return metadata;
}

export class PostgresCrmDealRepository {
  async list(): Promise<any[]> {
    const result = await getPostgresPool().query('SELECT * FROM crm_deals ORDER BY created_at DESC');
    return result.rows.map(mapDeal);
  }

  async findById(id: string): Promise<any | null> {
    const result = await getPostgresPool().query('SELECT * FROM crm_deals WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapDeal(result.rows[0]) : null;
  }

  async create(deal: any, audit?: AuditEntry): Promise<any> {
    return withPostgresTransaction(async client => {
    const result = await client.query(
      `INSERT INTO crm_deals
       (id,title,client_id,client_name,company,email,phone,service_pillar,value,stage,priority,probability,owner,expected_close_date,metadata,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        deal.id,
        deal.title || 'Untitled Deal',
        deal.clientId || null,
        deal.clientName || null,
        deal.company || null,
        deal.email || null,
        deal.phone || null,
        deal.servicePillar || null,
        Number(deal.value || 0),
        deal.stage || 'new',
        deal.priority || 'medium',
        Number(deal.probability || 0),
        deal.owner || null,
        deal.expectedCloseDate || null,
        JSON.stringify(toMetadata(deal)),
        deal.createdAt,
        deal.updatedAt
      ]
    );
    if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
    return mapDeal(result.rows[0]);
    });
  }

  async update(id: string, patch: Record<string, unknown>, audit?: AuditEntry): Promise<any | null> {
    return withPostgresTransaction(async client => {
      const current = await client.query('SELECT * FROM crm_deals WHERE id = $1 FOR UPDATE', [id]);
      if (!current.rows[0]) return null;
      const existing = mapDeal(current.rows[0]);
      const next = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
      const result = await client.query(
        `UPDATE crm_deals SET title=$2,client_id=$3,client_name=$4,company=$5,email=$6,phone=$7,service_pillar=$8,value=$9,stage=$10,priority=$11,probability=$12,owner=$13,expected_close_date=$14,metadata=$15,updated_at=$16
         WHERE id=$1 RETURNING *`,
        [id, next.title || 'Untitled Deal', next.clientId || null, next.clientName || null,
         next.company || null, next.email || null, next.phone || null, next.servicePillar || null,
         Number(next.value || 0), next.stage || 'new', next.priority || 'medium', Number(next.probability || 0),
         next.owner || null, next.expectedCloseDate || null, JSON.stringify(toMetadata(next)), next.updatedAt]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return result.rows[0] ? mapDeal(result.rows[0]) : null;
    });
  }

  async delete(id: string, audit?: AuditEntry): Promise<boolean> {
    return withPostgresTransaction(async client=>{
      const current=await client.query('SELECT id FROM crm_deals WHERE id=$1 FOR UPDATE',[id]);
      if(!current.rows[0])return false;
      const references=await client.query('SELECT COUNT(*)::int AS count FROM proposals WHERE deal_id=$1',[id]);
      if(Number(references.rows[0]?.count||0)>0)throw new Error('DEAL_HAS_PROPOSALS');
      const result=await client.query('DELETE FROM crm_deals WHERE id=$1',[id]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return result.rowCount===1;
    });
  }

  async convertWonDeal(dealId: string, actor: { userId: string; username: string }, audit?: AuditEntry): Promise<{ client: any; project: any; invoice: any; replayed: boolean }> {
    return withPostgresTransaction(async db => {
      const dealResult = await db.query('SELECT * FROM crm_deals WHERE id=$1 FOR UPDATE', [dealId]);
      if (!dealResult.rows[0]) throw new Error('DEAL_NOT_FOUND');
      const deal = mapDeal(dealResult.rows[0]);
      if (String(deal.stage) !== 'won') throw new Error('DEAL_NOT_WON');

      const existingProjects = await db.query(
        "SELECT * FROM projects WHERE metadata->>'crmDealId'=$1 OR metadata->>'crmLeadId'=$1 ORDER BY created_at ASC LIMIT 2",
        [dealId]
      );
      const existingInvoices = await db.query(
        "SELECT * FROM invoices WHERE metadata->>'crmDealId'=$1 OR metadata->>'leadId'=$1 ORDER BY created_at ASC LIMIT 2",
        [dealId]
      );
      if (existingProjects.rows.length > 1) throw new Error('MULTIPLE_PROJECTS_FOR_DEAL');
      if (existingInvoices.rows.length > 1) throw new Error('MULTIPLE_INVOICES_FOR_DEAL');

      let clientId = deal.clientId ? String(deal.clientId) : null;
      if (!clientId && existingProjects.rows[0]?.client_id) clientId = String(existingProjects.rows[0].client_id);
      if (!clientId && existingInvoices.rows[0]?.client_id) clientId = String(existingInvoices.rows[0].client_id);

      if (!clientId) {
        const clientIdentity = String(deal.email || '').trim().toLowerCase() || String(deal.company || '').trim().toLowerCase();
        if (clientIdentity) {
          await db.query(
            'SELECT pg_advisory_xact_lock(hashtextextended($1, 3847219))',
            [`crm-won-client:${clientIdentity}`]
          );
        }
        const candidates = await db.query(
          'SELECT * FROM clients WHERE (LOWER(email)=LOWER($1) AND $1 <> \'\') OR (LOWER(company)=LOWER($2) AND $2 <> \'\') ORDER BY created_at ASC LIMIT 2',
          [String(deal.email || ''), String(deal.company || '')]
        );
        if (candidates.rows.length > 1) throw new Error('AMBIGUOUS_DEAL_CLIENT');
        if (candidates.rows[0]) clientId = String(candidates.rows[0].id);
      }

      if (clientId) {
        const clientRow = await db.query('SELECT * FROM clients WHERE id=$1 FOR UPDATE', [clientId]);
        if (!clientRow.rows[0]) throw new Error('DEAL_CLIENT_NOT_FOUND');
      }

      if (existingProjects.rows[0] && existingInvoices.rows[0] && clientId) {
        const project = existingProjects.rows[0];
        const invoice = existingInvoices.rows[0];
        const conversionTasks = await db.query(
          "SELECT id FROM tasks WHERE project_id=$1 AND metadata->>'crmDealId'=$2 ORDER BY created_at ASC LIMIT 2",
          [project.id, dealId]
        );
        if (conversionTasks.rows.length > 1) throw new Error('MULTIPLE_TASKS_FOR_DEAL');
        if (conversionTasks.rows.length === 0) {
          throw new Error('INCOMPLETE_DEAL_CONVERSION');
        }

        if (!project.client_id) {
          await db.query('UPDATE projects SET client_id=$2, updated_at=NOW() WHERE id=$1', [project.id, clientId]);
        } else if (String(project.client_id) !== String(clientId)) {
          throw new Error('DEAL_PROJECT_CLIENT_MISMATCH');
        }

        if (!invoice.client_id) {
          await db.query('UPDATE invoices SET client_id=$2, updated_at=NOW() WHERE id=$1', [invoice.id, clientId]);
        } else if (String(invoice.client_id) !== String(clientId)) {
          throw new Error('DEAL_INVOICE_CLIENT_MISMATCH');
        }
        if (!invoice.project_id) {
          await db.query('UPDATE invoices SET project_id=$2, updated_at=NOW() WHERE id=$1', [invoice.id, project.id]);
        } else if (String(invoice.project_id) !== String(project.id)) {
          throw new Error('DEAL_INVOICE_PROJECT_MISMATCH');
        }

        await db.query('UPDATE crm_deals SET client_id=$2, updated_at=NOW() WHERE id=$1', [dealId, clientId]);

        const refreshedProject = (await db.query('SELECT * FROM projects WHERE id=$1', [project.id])).rows[0];
        const refreshedInvoice = (await db.query('SELECT * FROM invoices WHERE id=$1', [invoice.id])).rows[0];
        return {
          client: (await db.query('SELECT * FROM clients WHERE id=$1', [clientId])).rows[0],
          project: refreshedProject,
          invoice: refreshedInvoice,
          replayed: true
        };
      }

      if (existingProjects.rows[0] || existingInvoices.rows[0]) {
        throw new Error('INCOMPLETE_DEAL_CONVERSION');
      }

      const now = new Date().toISOString();
      const clientRecordId = clientId || `cli_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      if (!clientId) {
        await db.query(
          `INSERT INTO clients (id,name,company,email,phone,industry,status,notes,metadata,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8::jsonb,$9,$9)`,
          [
            clientRecordId,
            String(deal.clientName || deal.company || 'Client').slice(0,160),
            String(deal.company || '').slice(0,200) || null,
            String(deal.email || '').slice(0,254) || null,
            String(deal.phone || '').slice(0,40) || null,
            String(deal.servicePillar || '').slice(0,160) || null,
            `Converted from CRM Won Deal ${deal.id}`,
            JSON.stringify({ crmDealId: deal.id }),
            now
          ]
        );
        clientId = clientRecordId;
      }

      const projectId = `proj_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const taskId = `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const projectName = `${String(deal.company || deal.clientName || 'Client').slice(0,120)} — ${String(deal.servicePillar || 'Digital Project').slice(0,100)}`;
      const projectMetadata = {
        clientName: deal.clientName || '',
        clientCompany: deal.company || '',
        clientEmail: deal.email || '',
        serviceCategory: deal.servicePillar || '',
        crmDealId: deal.id,
        progressPercent: 0,
        teamLead: actor.username,
        teamMembers: [actor.username],
        techStack: [],
        milestones: [],
        repositoryUrl: undefined,
        figmaUrl: undefined,
        liveStagingUrl: undefined
      };

      await db.query(
        `INSERT INTO projects (id,client_id,name,description,status,owner,budget,start_date,end_date,metadata,created_at,updated_at)
         VALUES ($1,$2,$3,$4,'in_progress',$5,$6,$7,$8,$9::jsonb,$10,$10)`,
        [
          projectId,
          clientId,
          projectName,
          `CRM conversion for deal ${deal.id}`,
          actor.username,
          Number(deal.value || 0),
          now.slice(0,10),
          new Date(Date.now()+45*86400000).toISOString().slice(0,10),
          JSON.stringify(projectMetadata),
          now
        ]
      );

      await db.query(
        `INSERT INTO tasks (id,project_id,title,description,status,priority,assignee_user_id,due_date,metadata,created_at,updated_at)
         VALUES ($1,$2,$3,$4,'todo','high',$5,$6,$7::jsonb,$8,$8)`,
        [
          taskId,
          projectId,
          `Kickoff and repository setup for ${projectName}`,
          'Initial task created by the CRM conversion workflow.',
          actor.userId,
          new Date(Date.now()+3*86400000).toISOString().slice(0,10),
          JSON.stringify({ assignedTo: actor.username, projectName, crmDealId: deal.id }),
          now
        ]
      );

      const downPayment = Math.round(Number(deal.value || 0) * 0.5);
      if (downPayment <= 0) throw new Error('DEAL_VALUE_REQUIRED');
      const taxAmount = Math.round(downPayment * 0.11);
      const invoiceTotal = downPayment + taxAmount;
      const invoiceId = `inv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const invoiceYear = new Date().getFullYear();
      await db.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 3847219))',
        [`crm-won-invoice-number:${invoiceYear}`]
      );
      let invoiceNumber = '';
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const candidate = `KAPI-INV-${invoiceYear}-${crypto.randomInt(100000,999999)}`;
        const existingNumber = await db.query(
          'SELECT 1 FROM invoices WHERE invoice_number=$1 LIMIT 1',
          [candidate]
        );
        if (existingNumber.rowCount === 0) {
          invoiceNumber = candidate;
          break;
        }
      }
      if (!invoiceNumber) throw new Error('INVOICE_NUMBER_GENERATION_FAILED');

      await db.query(
        `INSERT INTO invoices (id,invoice_number,client_id,project_id,type,subtotal,discount_percent,discount_amount,tax_percent,tax_amount,total,amount_paid,balance_due,currency,status,issue_date,due_date,notes,payment_terms,metadata,created_at,updated_at)
         VALUES ($1,$2,$3,$4,'invoice',$5,0,0,11,$6,$7,0,$7,'IDR','sent',$8,$9,$10,$11,$12::jsonb,$13,$13)`,
        [
          invoiceId,
          invoiceNumber,
          clientId,
          projectId,
          downPayment,
          taxAmount,
          invoiceTotal,
          now.slice(0,10),
          new Date(Date.now()+14*86400000).toISOString().slice(0,10),
          `50% kickoff retainer for CRM deal ${deal.id}.`,
          'Bank Transfer Net 14',
          JSON.stringify({ crmDealId: deal.id, leadId: deal.id, auditTrail: [{ action:'created', timestamp:now, user:actor.username }] }),
          now
        ]
      );

      await db.query(
        'INSERT INTO invoice_items (id,invoice_id,description,quantity,unit_price,amount) VALUES ($1,$2,$3,1,$4,$4)',
        [
          `ii_crm_${deal.id}_${crypto.randomBytes(4).toString('hex')}`,
          invoiceId,
          `50% kickoff retainer for ${projectName}`,
          downPayment
        ]
      );

      await db.query('UPDATE crm_deals SET client_id=$2,updated_at=$3 WHERE id=$1', [dealId, clientId, now]);
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(db, audit);

      return {
        client: (await db.query('SELECT * FROM clients WHERE id=$1',[clientId])).rows[0],
        project: (await db.query('SELECT * FROM projects WHERE id=$1',[projectId])).rows[0],
        invoice: (await db.query('SELECT * FROM invoices WHERE id=$1',[invoiceId])).rows[0],
        replayed: false
      };
    });
  }

  async convertLead(lead: any, client: any, deal: any, clientAlreadyExists = false, audit?: AuditEntry): Promise<{ client: any; deal: any }> {
    return withPostgresTransaction(async db => {
      const leadRow=await db.query('SELECT id,status FROM leads WHERE id=$1 FOR UPDATE',[lead.id]);
      if(!leadRow.rows[0])throw new Error('Lead not found during conversion.');
      if(String(leadRow.rows[0].status).toLowerCase()==='closed')throw new Error('Lead has already been converted.');
      let resolvedClient = client;
      const normalizedClientEmail = String(client.email || '').trim().toLowerCase();
      if (normalizedClientEmail) {
        await db.query(
          'SELECT pg_advisory_xact_lock(hashtextextended($1, 5612047))',
          [`crm-lead-client:${normalizedClientEmail}`]
        );
      }
      const existingByEmail = normalizedClientEmail
        ? await db.query('SELECT * FROM clients WHERE lower(email)=lower($1) ORDER BY created_at ASC LIMIT 2 FOR SHARE',[normalizedClientEmail])
        : { rows: [] };
      if (existingByEmail.rows.length > 1) throw new Error('AMBIGUOUS_LEAD_CLIENT');
      if (existingByEmail.rows[0]) {
        resolvedClient = {
          ...client,
          ...existingByEmail.rows[0],
          id: existingByEmail.rows[0].id,
          totalSpend: Number(existingByEmail.rows[0].metadata?.totalSpend || 0),
          projectsCount: Number(existingByEmail.rows[0].metadata?.projectsCount || 0)
        };
      } else if (clientAlreadyExists) {
        const existing=await db.query('SELECT * FROM clients WHERE id=$1 FOR SHARE',[client.id]);
        if(!existing.rows[0])throw new Error('Existing client not found during conversion.');
        resolvedClient={...client,...existing.rows[0],id:existing.rows[0].id};
      }
      const clientResult = existingByEmail.rows[0] || clientAlreadyExists ? null : await db.query(
        `INSERT INTO clients
         (id,name,company,email,phone,industry,status,notes,metadata,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [resolvedClient.id, resolvedClient.name, resolvedClient.company || null, resolvedClient.email || null, resolvedClient.phone || null, resolvedClient.industry || null,
         resolvedClient.status || 'active', resolvedClient.notes || null, JSON.stringify({
           ...resolvedClient,
           id: undefined, name: undefined, company: undefined, email: undefined, phone: undefined,
           industry: undefined, status: undefined, notes: undefined, createdAt: undefined, updatedAt: undefined
         }), client.createdAt, client.updatedAt]
      );
      const dealResult = await db.query(
        `INSERT INTO crm_deals
         (id,title,client_id,client_name,company,email,phone,service_pillar,value,stage,priority,probability,owner,expected_close_date,metadata,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING *`,
        [
          deal.id,
          deal.title || 'Untitled Deal',
          resolvedClient.id,
          deal.clientName || null,
          deal.company || client.company || null,
          deal.email || client.email || null,
          deal.phone || client.phone || null,
          deal.servicePillar || null,
          Number(deal.value || 0),
          deal.stage || 'new',
          deal.priority || 'medium',
          Number(deal.probability || 0),
          deal.owner || null,
          deal.expectedCloseDate || null,
          JSON.stringify(toMetadata(deal)),
          deal.createdAt,
          deal.updatedAt
        ]
      );
      const leadResult = await db.query('UPDATE leads SET status=$2,updated_at=NOW() WHERE id=$1 AND status <> $2 RETURNING *', [lead.id, 'closed']);
      if (!leadResult.rows[0]) throw new Error('Lead not found during conversion.');
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(db, audit);
      return {
        client: { ...resolvedClient, id: clientResult?.rows[0]?.id || resolvedClient.id },
        deal: mapDeal(dealResult.rows[0])
      };
    });
  }
}

export const postgresCrmDealRepository = new PostgresCrmDealRepository();
