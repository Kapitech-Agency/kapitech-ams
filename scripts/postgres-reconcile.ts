import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getPostgresPool, closePostgresPool } from '../server/postgres.ts';

const DATA_DIR = process.env.KAPITECH_DATA_DIR
  ? path.resolve(process.env.KAPITECH_DATA_DIR)
  : path.join(process.env.HOME || process.cwd(), '.kapitech-ams-data');
const DB_FILE = path.join(DATA_DIR, 'kapitech_db.json');
const PREFIX = 'KAPI-ENC-V1:';

function encryptionKey(): Buffer {
  const raw = process.env.KAPITECH_DATA_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error('KAPITECH_DATA_ENCRYPTION_KEY is required to read the production JSON database.');
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('KAPITECH_DATA_ENCRYPTION_KEY must decode to 32 bytes.');
  return key;
}

function decrypt(raw: string): string {
  if (!raw.startsWith(PREFIX)) return raw;
  const payload = JSON.parse(raw.slice(PREFIX.length));
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(payload.data, 'base64')), decipher.final()]).toString('utf8');
}

function sha256(raw: string | Buffer): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function arr(db: any, key: string): any[] {
  return Array.isArray(db?.[key]) ? db[key] : [];
}

function count(db: any, key: string): number {
  return arr(db, key).length;
}

function money(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sum(db: any, key: string, field: string): number {
  return arr(db, key).reduce((total, row) => total + money(row?.[field]), 0);
}

function uniqueIds(db: any, key: string): number {
  const ids = arr(db, key).map(row => row?.id).filter(Boolean);
  return new Set(ids).size;
}

function duplicateIds(db: any, key: string): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of arr(db, key)) {
    const id = row?.id;
    if (!id) continue;
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

function computeAuditLogHash(log: any): string {
  return crypto.createHash('sha256').update(JSON.stringify({
    id: log.id,
    timestamp: log.timestamp,
    action: log.action,
    actor: log.actor,
    actorRole: log.actorRole,
    ip: log.ip,
    userAgent: log.userAgent,
    details: log.details,
    severity: log.severity,
    prevHash: log.prevHash
  })).digest('hex');
}

function verifyAuditLogChain(db: any): { valid: boolean; checked: number; brokenAt?: string } {
  const logs = arr(db, 'auditLogs');
  let previousHash = 'GENESIS';
  let checked = 0;
  for (let index = logs.length - 1; index >= 0; index -= 1) {
    const log = logs[index];
    const prevHash = log.prevHash || previousHash;
    const expectedHash = computeAuditLogHash({ ...log, prevHash });
    checked += 1;
    if (log.prevHash !== prevHash || log.hash !== expectedHash) return { valid: false, checked, brokenAt: String(log.id || '') };
    previousHash = expectedHash;
  }
  return { valid: true, checked };
}

function verifyPrivateDocuments(db: any): { valid: boolean; checked: number; missing: string[]; malformed: string[] } {
  const missing: string[] = [];
  const malformed: string[] = [];
  let checked = 0;
  const dir = process.env.KAPITECH_PRIVATE_DOCUMENT_DIR
    ? path.resolve(process.env.KAPITECH_PRIVATE_DOCUMENT_DIR)
    : path.join(DATA_DIR, 'private-documents');
  for (const document of arr(db, 'documents')) {
    if (!document.storageKey) continue;
    checked += 1;
    if (!/^[a-f0-9]{64}$/.test(String(document.storageKey))) {
      malformed.push(String(document.id || document.storageKey));
      continue;
    }
    try {
      const encryptedPath = path.join(dir, String(document.storageKey) + '.enc');
      const stat = fs.statSync(encryptedPath);
      if (!stat.isFile() || stat.size <= 0) {
        missing.push(String(document.id || document.storageKey));
        continue;
      }
      if (document.storageSha256) {
        const encryptedPayload = fs.readFileSync(encryptedPath);
        const actualSha256 = sha256(encryptedPayload);
        if (actualSha256 !== String(document.storageSha256)) malformed.push(String(document.id || document.storageKey));
      }
    } catch {
      missing.push(String(document.id || document.storageKey));
    }
  }
  return { valid: missing.length === 0 && malformed.length === 0, checked, missing, malformed };
}

async function pgClientSpendParity(): Promise<{ valid: boolean; mismatches: Array<{ id: string; recorded: number; calculated: number }> }> {
  const result = await getPostgresPool().query<{
    id: string;
    recorded: string | null;
    calculated: string | null;
  }>(`
    SELECT
      c.id,
      COALESCE(NULLIF(c.metadata->>'totalSpend','')::numeric, 0) AS recorded,
      COALESCE(SUM(ip.amount), 0) AS calculated
    FROM clients c
    LEFT JOIN invoices i ON i.client_id = c.id
    LEFT JOIN invoice_payments ip ON ip.invoice_id = i.id
    GROUP BY c.id, c.metadata
  `);

  const mismatches = result.rows
    .map(row => ({
      id: String(row.id),
      recorded: Number(row.recorded || 0),
      calculated: Number(row.calculated || 0)
    }))
    .filter(row => Math.abs(row.recorded - row.calculated) > 0.005)
    .slice(0, 100);

  return { valid: mismatches.length === 0, mismatches };
}

async function pgFinanceIntegrity(): Promise<{
  valid: boolean;
  invoiceMismatches: Array<{ id: string; total: number; recordedPaid: number; paymentPaid: number; recordedBalance: number; expectedBalance: number; status: string; expectedStatus: string }>;
  unvalidatedConstraints: string[];
}> {
  const pool = getPostgresPool();
  const invoiceResult = await pool.query<{
    id: string;
    total: string;
    amount_paid: string;
    balance_due: string;
    status: string;
    payment_paid: string;
  }>(
    `SELECT i.id, i.total, i.amount_paid, i.balance_due, i.status,
            COALESCE(SUM(ip.amount), 0) AS payment_paid
       FROM invoices i
       LEFT JOIN invoice_payments ip ON ip.invoice_id = i.id
      GROUP BY i.id, i.total, i.amount_paid, i.balance_due, i.status`
  );

  const invoiceMismatches = invoiceResult.rows.map(row => {
    const total = Number(row.total || 0);
    const recordedPaid = Number(row.amount_paid || 0);
    const paymentPaid = Number(row.payment_paid || 0);
    const recordedBalance = Number(row.balance_due || 0);
    const expectedBalance = Math.max(0, total - paymentPaid);
    const expectedStatus = paymentPaid >= total && total > 0
      ? 'paid'
      : paymentPaid > 0
        ? 'partially_paid'
        : row.status === 'cancelled'
          ? 'cancelled'
          : row.status;
    return { id: String(row.id), total, recordedPaid, paymentPaid, recordedBalance, expectedBalance, status: String(row.status), expectedStatus };
  }).filter(row =>
    Math.abs(row.recordedPaid - row.paymentPaid) > 0.005 ||
    Math.abs(row.recordedBalance - row.expectedBalance) > 0.005 ||
    (row.status !== 'cancelled' && row.status !== row.expectedStatus)
  ).slice(0, 100);

  const constraintResult = await pool.query<{ table_name: string; constraint_name: string }>(
    `SELECT c.conrelid::regclass::text AS table_name, c.conname AS constraint_name
       FROM pg_constraint c
      WHERE NOT c.convalidated
        AND c.conrelid::regclass::text IN ('expenses')
      ORDER BY c.conrelid::regclass::text, c.conname`
  );

  const unvalidatedConstraints = constraintResult.rows.map(row => `${row.table_name}.${row.constraint_name}`);
  return { valid: invoiceMismatches.length === 0 && unvalidatedConstraints.length === 0, invoiceMismatches, unvalidatedConstraints };
}

async function pgCountsAndFinancials(): Promise<{ counts: Record<string, number>; financials: Record<string, number>; cmsSettings: Record<string, unknown>; notificationSettings: Record<string, unknown> }> {
  const pool = getPostgresPool();
  const tables: Record<string, string> = {
    users: 'users', sessions: 'sessions', leads: 'leads', crmDeals: 'crm_deals',
    proposals: 'proposals', clients: 'clients', projects: 'projects', tasks: 'tasks',
    timeLogs: 'time_logs', invoices: 'invoices', expenses: 'expenses', approvals: 'approvals',
    vendors: 'vendors', documents: 'documents', notifications: 'notifications', auditLogs: 'audit_logs', cmsServices: 'cms_services', cmsProjects: 'cms_projects', cmsTestimonials: 'cms_testimonials'
  };
  const counts: Record<string, number> = {};
  for (const [source, table] of Object.entries(tables)) {
    const result = await pool.query<{ count: string }>('SELECT COUNT(*)::bigint AS count FROM ' + table);
    counts[source] = Number(result.rows[0].count);
  }

  const result = await pool.query<{
    proposal_subtotal: string; proposal_total: string; invoice_total: string;
    invoice_amount_paid: string; invoice_balance_due: string; expenses_total: string;
    pipeline_value: string;
  }>(`
    SELECT
      (SELECT COALESCE(SUM(subtotal),0) FROM proposals) AS proposal_subtotal,
      (SELECT COALESCE(SUM(total),0) FROM proposals) AS proposal_total,
      (SELECT COALESCE(SUM(total),0) FROM invoices) AS invoice_total,
      (SELECT COALESCE(SUM(amount_paid),0) FROM invoices) AS invoice_amount_paid,
      (SELECT COALESCE(SUM(balance_due),0) FROM invoices) AS invoice_balance_due,
      (SELECT COALESCE(SUM(amount),0) FROM expenses) AS expenses_total,
      (SELECT COALESCE(SUM(value),0) FROM crm_deals) AS pipeline_value
  `);
  const row = result.rows[0];
  const cmsResult = await pool.query<{ key: string; value: unknown }>(
    'SELECT key, value FROM cms_settings ORDER BY key'
  );
  const pgCmsSettings: Record<string, unknown> = {};
  for (const item of cmsResult.rows) pgCmsSettings[item.key] = item.value;

  const notificationResult = await pool.query<{
    target_email: string | null;
    formspree_endpoint: string | null;
    telegram_chat_id: string | null;
    is_email_active: boolean;
    is_telegram_active: boolean;
  }>(
    `SELECT target_email, formspree_endpoint, telegram_chat_id, is_email_active,
            is_telegram_active
       FROM notification_settings WHERE id = 1`
  );
  const notificationRow = notificationResult.rows[0];
  return {
    counts,
    financials: {
      proposalSubtotal: Number(row.proposal_subtotal),
      proposalTotal: Number(row.proposal_total),
      invoiceTotal: Number(row.invoice_total),
      invoiceAmountPaid: Number(row.invoice_amount_paid),
      invoiceBalanceDue: Number(row.invoice_balance_due),
      expensesTotal: Number(row.expenses_total),
      pipelineValue: Number(row.pipeline_value)
    },
    cmsSettings: pgCmsSettings,
    notificationSettings: notificationRow ? {
      targetEmail: notificationRow.target_email,
      formspreeEndpoint: notificationRow.formspree_endpoint,
      telegramChatId: notificationRow.telegram_chat_id,
      isEmailActive: notificationRow.is_email_active,
      isTelegramActive: notificationRow.is_telegram_active,
      hasTelegramToken: Boolean(process.env.KAPITECH_TELEGRAM_BOT_TOKEN)
    } : {}
  };
}

type ParityMapper = (row: any) => { id: string; value: any };

function normalizeParityValue(value: any): any {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeParityValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, normalizeParityValue(value[key])])
    );
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number(value.toFixed(6));
  }
  return value;
}

function parityFingerprint(value: any): string {
  return sha256(JSON.stringify(normalizeParityValue(value)));
}

function buildParityIndex(rows: any[], mapper: ParityMapper): Map<string, string> {
  const index = new Map<string, string>();
  for (const row of rows) {
    const mapped = mapper(row);
    if (!mapped.id) continue;
    index.set(mapped.id, parityFingerprint(mapped.value));
  }
  return index;
}

function compareParity(name: string, sourceRows: any[], targetRows: any[], sourceMapper: ParityMapper, targetMapper: ParityMapper) {
  const sourceIndex = buildParityIndex(sourceRows, sourceMapper);
  const targetIndex = buildParityIndex(targetRows, targetMapper);
  const missingIds = [...sourceIndex.keys()].filter(id => !targetIndex.has(id)).slice(0, 50);
  const unexpectedIds = [...targetIndex.keys()].filter(id => !sourceIndex.has(id)).slice(0, 50);
  const mismatchedIds = [...sourceIndex.keys()]
    .filter(id => targetIndex.has(id) && sourceIndex.get(id) !== targetIndex.get(id))
    .slice(0, 50);

  const sourceCanonical = [...sourceIndex.entries()].sort(([a], [b]) => a.localeCompare(b));
  const targetCanonical = [...targetIndex.entries()].sort(([a], [b]) => a.localeCompare(b));

  return {
    valid: sourceIndex.size === targetIndex.size && missingIds.length === 0 && unexpectedIds.length === 0 && mismatchedIds.length === 0,
    sourceCount: sourceIndex.size,
    targetCount: targetIndex.size,
    sourceHash: sha256(JSON.stringify(sourceCanonical)),
    targetHash: sha256(JSON.stringify(targetCanonical)),
    missingIds,
    unexpectedIds,
    mismatchedIds
  };
}

async function pgRecordSets(): Promise<Record<string, any[]>> {
  const pool = getPostgresPool();
  const result = await Promise.all([
    pool.query('SELECT id,name,username,email,role,stakeholder_type,division,status,mfa_enabled,permissions FROM users'),
    pool.query('SELECT id,name,company,email,phone,industry,status,notes,metadata FROM clients'),
    pool.query('SELECT id,full_name,email,phone,company,service_category,budget_range,project_timeline,message,source,status,honeypot_triggered FROM leads'),
    pool.query('SELECT id,title,client_id,client_name,company,email,phone,service_pillar,value,stage,priority,probability,owner,expected_close_date FROM crm_deals'),
    pool.query('SELECT id,name,description,client_id,status,owner,budget,start_date,end_date FROM projects'),
    pool.query('SELECT id,proposal_number,title,client_id,deal_id,project_id,subtotal,discount,tax_percent,tax,total,currency,validity_period,payment_terms,owner,status,notes,created_date,sent_date,approved_date FROM proposals'),
    pool.query('SELECT id,proposal_id,description,quantity,unit_price FROM proposal_items'),
    pool.query('SELECT id,project_id,title,description,status,priority,assignee_user_id,due_date FROM tasks'),
    pool.query('SELECT id,project_id,task_id,user_id,hours,description,logged_at FROM time_logs'),
    pool.query('SELECT id,invoice_number,client_id,project_id,type,subtotal,discount_percent,discount_amount,tax_percent,tax_amount,total,amount_paid,balance_due,currency,status,issue_date,due_date,paid_date,notes,payment_terms FROM invoices'),
    pool.query('SELECT id,invoice_id,description,quantity,unit_price,amount FROM invoice_items'),
    pool.query('SELECT id,invoice_id,amount,paid_at,method,reference,metadata FROM invoice_payments'),
    pool.query('SELECT id,type,category,description,amount,expense_date,recurring_interval,recorded_by_user_id,recorded_by FROM expenses'),
    pool.query('SELECT id,type,reference_id,title,requester_user_id,requester,requester_role,value,approval_date,reason,risk_level,status FROM approvals'),
    pool.query('SELECT id,name,category,contact_person,email,phone,payment_terms,status,monthly_spend,notes FROM vendors'),
    pool.query('SELECT id,name,type,mime_type,size_bytes,category,related_entity,related_id,source_type,storage_key,owner_user_id,external_url,status,uploaded_date,uploaded_at,content_sha256,storage_sha256,storage_version,storage_provider,integrity_checked_at FROM documents'),
    pool.query('SELECT document_id,user_id FROM document_access'),
    pool.query('SELECT id,title,message,type,severity,read,read_by,recipient_user_id,link_url,created_at FROM notifications'),
    pool.query('SELECT id,timestamp,action,actor,actor_role,actor_user_id,ip,user_agent,details,severity,prev_hash,hash FROM audit_logs'),
    pool.query('SELECT id,name,slug,description,data,created_at,updated_at FROM cms_services'),
    pool.query('SELECT id,name,slug,description,data,created_at,updated_at FROM cms_projects'),
    pool.query('SELECT id,name,company,quote,data,created_at,updated_at FROM cms_testimonials')
  ]);

  const keys = [
    'users','clients','leads','crmDeals','projects','proposals','proposalItems','tasks','timeLogs','invoices',
    'invoiceItems','invoicePayments','expenses','approvals','vendors','documents','documentAccess',
    'notifications','auditLogs','cmsServices','cmsProjects','cmsTestimonials'
  ];

  return Object.fromEntries(keys.map((key, index) => [key, result[index].rows]));
}

function buildRecordParity(db: any, pg: Record<string, any[]>) {
  return {
    users: compareParity('users', arr(db,'users'), pg.users,
      row => ({ id: String(row.id), value: { username: row.username, email: row.email, role: row.role, stakeholderType: row.stakeholderType, division: row.division, status: row.status, mfaEnabled: Boolean(row.mfaEnabled), permissions: row.permissions } }),
      row => ({ id: String(row.id), value: { username: row.username, email: row.email, role: row.role, stakeholderType: row.stakeholder_type, division: row.division, status: row.status, mfaEnabled: Boolean(row.mfa_enabled), permissions: row.permissions } })
    ),
    clients: compareParity('clients', arr(db,'clients'), pg.clients,
      row => ({ id: String(row.id), value: { name: row.name ?? row.clientName ?? null, company: row.company ?? null, email: row.email ?? null, phone: row.phone ?? null, industry: row.industry ?? null, status: row.status, notes: row.notes ?? null, metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {} } }),
      row => ({ id: String(row.id), value: { name: row.name ?? null, company: row.company ?? null, email: row.email ?? null, phone: row.phone ?? null, industry: row.industry ?? null, status: row.status, notes: row.notes ?? null, metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {} } })
    ),
    leads: compareParity('leads', arr(db,'leads'), pg.leads,
      row => ({ id: String(row.id), value: { fullName: row.fullName, email: row.email, phone: row.phone ?? null, company: row.company ?? null, serviceCategory: row.serviceCategory ?? null, budgetRange: row.budgetRange ?? null, projectTimeline: row.projectTimeline ?? null, message: row.message, source: row.source ?? null, status: row.status, honeypotTriggered: Boolean(row.honeypotTriggered) } }),
      row => ({ id: String(row.id), value: { fullName: row.full_name, email: row.email, phone: row.phone ?? null, company: row.company ?? null, serviceCategory: row.service_category ?? null, budgetRange: row.budget_range ?? null, projectTimeline: row.project_timeline ?? null, message: row.message, source: row.source ?? null, status: row.status, honeypotTriggered: Boolean(row.honeypot_triggered) } })
    ),
    crmDeals: compareParity('crmDeals', arr(db,'crmDeals'), pg.crmDeals,
      row => ({ id: String(row.id), value: { title: row.title, clientId: row.clientId ?? null, clientName: row.clientName ?? null, company: row.company ?? null, email: row.email ?? null, phone: row.phone ?? null, servicePillar: row.servicePillar ?? null, value: money(row.value), stage: row.stage, priority: row.priority ?? null, probability: row.probability ?? null, owner: row.owner ?? null, expectedCloseDate: row.expectedCloseDate ?? null } }),
      row => ({ id: String(row.id), value: { title: row.title, clientId: row.client_id ?? null, clientName: row.client_name ?? null, company: row.company ?? null, email: row.email ?? null, phone: row.phone ?? null, servicePillar: row.service_pillar ?? null, value: money(row.value), stage: row.stage, priority: row.priority ?? null, probability: row.probability ?? null, owner: row.owner ?? null, expectedCloseDate: row.expected_close_date ?? null } })
    ),
    projects: compareParity('projects', arr(db,'projects'), pg.projects,
      row => ({ id: String(row.id), value: { clientId: row.clientId ?? null, name: row.name ?? row.title, description: row.description ?? null, status: row.status, owner: row.owner ?? null, budget: money(row.budget), startDate: row.startDate ?? null, endDate: row.endDate ?? null } }),
      row => ({ id: String(row.id), value: { clientId: row.client_id ?? null, name: row.name, description: row.description ?? null, status: row.status, owner: row.owner ?? null, budget: money(row.budget), startDate: row.start_date ?? null, endDate: row.end_date ?? null } })
    ),
    proposals: compareParity('proposals', arr(db,'proposals'), pg.proposals,
      row => ({ id: String(row.id), value: { proposalNumber: row.proposalNumber ?? null, title: row.title, clientId: row.clientId ?? null, dealId: row.dealId ?? null, projectId: row.projectId ?? null, subtotal: money(row.subtotal), discount: money(row.discount), taxPercent: money(row.taxPercent), tax: money(row.tax), total: money(row.total), currency: row.currency, validityPeriod: row.validityPeriod ?? null, paymentTerms: row.paymentTerms ?? null, owner: row.owner ?? null, status: row.status, notes: row.notes ?? null, createdDate: row.createdDate ?? null, sentDate: row.sentDate ?? null, approvedDate: row.approvedDate ?? null } }),
      row => ({ id: String(row.id), value: { proposalNumber: row.proposal_number ?? null, title: row.title, clientId: row.client_id ?? null, dealId: row.deal_id ?? null, projectId: row.project_id ?? null, subtotal: money(row.subtotal), discount: money(row.discount), taxPercent: money(row.tax_percent), tax: money(row.tax), total: money(row.total), currency: row.currency, validityPeriod: row.validity_period ?? null, paymentTerms: row.payment_terms ?? null, owner: row.owner ?? null, status: row.status, notes: row.notes ?? null, createdDate: row.created_date ?? null, sentDate: row.sent_date ?? null, approvedDate: row.approved_date ?? null } })
    ),
    proposalItems: compareParity('proposalItems', arr(db,'proposals').flatMap(p => (Array.isArray(p.items) ? p.items : []).map(item => ({ ...item, proposalId: p.id }))), pg.proposalItems,
      row => ({ id: String(row.id), value: { proposalId: row.proposalId, description: row.description, quantity: money(row.quantity), unitPrice: money(row.unitPrice) } }),
      row => ({ id: String(row.id), value: { proposalId: row.proposal_id, description: row.description, quantity: money(row.quantity), unitPrice: money(row.unit_price) } })
    ),
    tasks: compareParity('tasks', arr(db,'tasks'), pg.tasks,
      row => ({ id: String(row.id), value: { projectId: row.projectId ?? null, title: row.title, description: row.description ?? null, status: row.status, priority: row.priority ?? null, assigneeUserId: row.assigneeUserId ?? row.assigneeId ?? null, dueDate: row.dueDate ?? null } }),
      row => ({ id: String(row.id), value: { projectId: row.project_id ?? null, title: row.title, description: row.description ?? null, status: row.status, priority: row.priority ?? null, assigneeUserId: row.assignee_user_id ?? null, dueDate: row.due_date ?? null } })
    ),
    timeLogs: compareParity('timeLogs', arr(db,'timeLogs'), pg.timeLogs,
      row => ({ id: String(row.id), value: { projectId: row.projectId ?? null, taskId: row.taskId ?? null, userId: row.userId ?? null, hours: money(row.hours), description: row.description ?? null, loggedAt: row.loggedAt ?? row.date ?? null } }),
      row => ({ id: String(row.id), value: { projectId: row.project_id ?? null, taskId: row.task_id ?? null, userId: row.user_id ?? null, hours: money(row.hours), description: row.description ?? null, loggedAt: row.logged_at ?? null } })
    ),
    invoices: compareParity('invoices', arr(db,'invoices'), pg.invoices,
      row => ({ id: String(row.id), value: { invoiceNumber: row.invoiceNumber ?? null, clientId: row.clientId ?? null, projectId: row.projectId ?? null, type: row.type ?? 'invoice', subtotal: money(row.subtotal), discountPercent: money(row.discountPercent), discountAmount: money(row.discountAmount), taxPercent: money(row.taxPercent), taxAmount: money(row.taxAmount), total: money(row.total), amountPaid: money(row.amountPaid), balanceDue: money(row.balanceDue), currency: row.currency, status: row.status, issueDate: row.issueDate ?? null, dueDate: row.dueDate ?? null, paidDate: row.paidDate ?? null, notes: row.notes ?? null, paymentTerms: row.paymentTerms ?? null } }),
      row => ({ id: String(row.id), value: { invoiceNumber: row.invoice_number ?? null, clientId: row.client_id ?? null, projectId: row.project_id ?? null, type: row.type ?? 'invoice', subtotal: money(row.subtotal), discountPercent: money(row.discount_percent), discountAmount: money(row.discount_amount), taxPercent: money(row.tax_percent), taxAmount: money(row.tax_amount), total: money(row.total), amountPaid: money(row.amount_paid), balanceDue: money(row.balance_due), currency: row.currency, status: row.status, issueDate: row.issue_date ?? null, dueDate: row.due_date ?? null, paidDate: row.paid_date ?? null, notes: row.notes ?? null, paymentTerms: row.payment_terms ?? null } })
    ),
    invoiceItems: compareParity('invoiceItems', arr(db,'invoices').flatMap(inv => (Array.isArray(inv.items) ? inv.items : []).map(item => ({ ...item, invoiceId: inv.id }))), pg.invoiceItems,
      row => ({ id: String(row.id), value: { invoiceId: row.invoiceId, description: row.description, quantity: money(row.quantity), unitPrice: money(row.unitPrice), amount: money(row.amount ?? money(row.quantity) * money(row.unitPrice)) } }),
      row => ({ id: String(row.id), value: { invoiceId: row.invoice_id, description: row.description, quantity: money(row.quantity), unitPrice: money(row.unit_price), amount: money(row.amount) } })
    ),
    invoicePayments: compareParity('invoicePayments', arr(db,'invoices').flatMap(inv => (Array.isArray(inv.payments) ? inv.payments : []).map(payment => ({ ...payment, invoiceId: inv.id }))), pg.invoicePayments,
      row => ({ id: String(row.id), value: { invoiceId: row.invoiceId, amount: money(row.amount), paidAt: row.paidAt ?? row.date ?? null, method: row.method ?? null, reference: row.reference ?? null } }),
      row => ({ id: String(row.id), value: { invoiceId: row.invoice_id, amount: money(row.amount), paidAt: row.paid_at ?? null, method: row.method ?? null, reference: row.reference ?? null } })
    ),
    expenses: compareParity('expenses', arr(db,'expenses'), pg.expenses,
      row => ({ id: String(row.id), value: { type: row.type, category: row.category, description: row.description, amount: money(row.amount), date: row.date ?? row.expenseDate ?? null, recurringInterval: row.recurringInterval ?? null, recordedByUserId: row.recordedByUserId ?? null, recordedBy: row.recordedBy ?? null } }),
      row => ({ id: String(row.id), value: { type: row.type, category: row.category, description: row.description, amount: money(row.amount), date: row.expense_date ?? null, recurringInterval: row.recurring_interval ?? null, recordedByUserId: row.recorded_by_user_id ?? null, recordedBy: row.recorded_by ?? null } })
    ),
    approvals: compareParity('approvals', arr(db,'approvals'), pg.approvals,
      row => ({ id: String(row.id), value: { type: row.type, referenceId: row.referenceId ?? null, title: row.title, requesterUserId: row.requesterUserId ?? null, requester: row.requester ?? null, requesterRole: row.requesterRole ?? null, value: money(row.value), approvalDate: row.date ?? row.approvalDate ?? null, reason: row.reason ?? null, riskLevel: row.riskLevel ?? null, status: row.status } }),
      row => ({ id: String(row.id), value: { type: row.type, referenceId: row.reference_id ?? null, title: row.title, requesterUserId: row.requester_user_id ?? null, requester: row.requester ?? null, requesterRole: row.requester_role ?? null, value: money(row.value), approvalDate: row.approval_date ?? null, reason: row.reason ?? null, riskLevel: row.risk_level ?? null, status: row.status } })
    ),
    vendors: compareParity('vendors', arr(db,'vendors'), pg.vendors,
      row => ({ id: String(row.id), value: { name: row.name, category: row.category ?? null, contactPerson: row.contactPerson ?? null, email: row.email ?? null, phone: row.phone ?? null, paymentTerms: row.paymentTerms ?? null, status: row.status, monthlySpend: money(row.monthlySpend), notes: row.notes ?? null } }),
      row => ({ id: String(row.id), value: { name: row.name, category: row.category ?? null, contactPerson: row.contact_person ?? null, email: row.email ?? null, phone: row.phone ?? null, paymentTerms: row.payment_terms ?? null, status: row.status, monthlySpend: money(row.monthly_spend), notes: row.notes ?? null } })
    ),
    documents: compareParity('documents', arr(db,'documents'), pg.documents,
      row => ({ id: String(row.id), value: { name: row.name, type: row.type, mimeType: row.mimeType ?? null, sizeBytes: row.sizeBytes ?? null, category: row.category ?? null, relatedEntity: row.relatedEntity ?? null, relatedId: row.relatedId ?? null, sourceType: row.sourceType ?? (row.storageKey ? 'private_file' : 'external_link'), storageKey: row.storageKey ?? null, ownerUserId: row.ownerUserId ?? null, externalUrl: row.externalUrl ?? row.url ?? null, status: row.status, uploadedDate: row.uploadedDate ?? null, uploadedAt: row.uploadedAt ?? null, contentSha256: row.contentSha256 ?? null, storageSha256: row.storageSha256 ?? null, storageVersion: row.storageVersion ?? 1, storageProvider: row.storageProvider ?? null, integrityCheckedAt: row.integrityCheckedAt ?? null } }),
      row => ({ id: String(row.id), value: { name: row.name, type: row.type, mimeType: row.mime_type ?? null, sizeBytes: row.size_bytes == null ? null : Number(row.size_bytes), category: row.category ?? null, relatedEntity: row.related_entity ?? null, relatedId: row.related_id ?? null, sourceType: row.source_type, storageKey: row.storage_key ?? null, ownerUserId: row.owner_user_id ?? null, externalUrl: row.external_url ?? null, status: row.status, uploadedDate: row.uploaded_date ?? null, uploadedAt: row.uploaded_at ?? null, contentSha256: row.content_sha256 ?? null, storageSha256: row.storage_sha256 ?? null, storageVersion: row.storage_version ?? 1, storageProvider: row.storage_provider ?? null, integrityCheckedAt: row.integrity_checked_at ?? null } })
    ),
    documentAccess: compareParity('documentAccess', arr(db,'documents').flatMap(doc => (Array.isArray(doc.accessUserIds) ? doc.accessUserIds : []).map(userId => ({ id: String(doc.id) + ':' + String(userId), documentId: doc.id, userId }))), pg.documentAccess,
      row => ({ id: String(row.id), value: { documentId: row.documentId, userId: row.userId } }),
      row => ({ id: String(row.document_id) + ':' + String(row.user_id), value: { documentId: row.document_id, userId: row.user_id } })
    ),
    notifications: compareParity('notifications', arr(db,'notifications'), pg.notifications,
      row => ({ id: String(row.id), value: { title: row.title, message: row.message, type: row.type, severity: row.severity, read: Boolean(row.read), readBy: Array.isArray(row.readBy) ? row.readBy.map(String).sort() : [], recipientUserId: row.recipientUserId ?? null, linkUrl: row.linkUrl ?? null } }),
      row => ({ id: String(row.id), value: { title: row.title, message: row.message, type: row.type, severity: row.severity, read: Boolean(row.read), readBy: Array.isArray(row.read_by) ? row.read_by.map(String).sort() : [], recipientUserId: row.recipient_user_id ?? null, linkUrl: row.link_url ?? null } })
    ),
    auditLogs: compareParity('auditLogs', arr(db,'auditLogs'), pg.auditLogs,
      row => ({ id: String(row.id), value: { timestamp: row.timestamp, action: row.action, actor: row.actor, actorRole: row.actorRole, ip: row.ip ?? null, userAgent: row.userAgent ?? null, details: row.details, severity: row.severity, prevHash: row.prevHash ?? null, hash: row.hash ?? null } }),
      row => ({ id: String(row.id), value: { timestamp: row.timestamp, action: row.action, actor: row.actor, actorRole: row.actor_role, ip: row.ip ?? null, userAgent: row.user_agent ?? null, details: row.details, severity: row.severity, prevHash: row.prev_hash ?? null, hash: row.hash ?? null } })
    ),
    cmsServices: compareParity('cmsServices', arr(db,'cmsServices'), pg.cmsServices,
      row => { const data = { ...row }; delete data.id; delete data.createdAt; delete data.updatedAt; return { id: String(row.id), value: { name: row.title || row.name, slug: row.slug ?? null, description: row.description || row.heroSubtitle || null, data } }; },
      row => ({ id: String(row.id), value: { name: row.name, slug: row.slug ?? null, description: row.description ?? null, data: row.data && typeof row.data === 'object' ? row.data : {} } })
    ),
    cmsProjects: compareParity('cmsProjects', arr(db,'cmsProjects'), pg.cmsProjects,
      row => { const data = { ...row }; delete data.id; delete data.createdAt; delete data.updatedAt; return { id: String(row.id), value: { name: row.title || row.name, slug: row.slug ?? null, description: row.description || row.desc || null, data } }; },
      row => ({ id: String(row.id), value: { name: row.name, slug: row.slug ?? null, description: row.description ?? null, data: row.data && typeof row.data === 'object' ? row.data : {} } })
    ),
    cmsTestimonials: compareParity('cmsTestimonials', arr(db,'cmsTestimonials'), pg.cmsTestimonials,
      row => { const data = { ...row }; delete data.id; delete data.createdAt; delete data.updatedAt; return { id: String(row.id), value: { name: row.author || row.name, company: row.company ?? null, quote: row.quote ?? null, data } }; },
      row => ({ id: String(row.id), value: { name: row.name, company: row.company ?? null, quote: row.quote ?? null, data: row.data && typeof row.data === 'object' ? row.data : {} } })
    )
  };
}

async function main(): Promise<void> {
  if (!fs.existsSync(DB_FILE)) throw new Error('JSON database file not found: ' + DB_FILE);

  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const db = JSON.parse(decrypt(raw));
  const sourceSha256 = sha256(raw);

  const localCounts: Record<string, number> = {};
  const keys = [
    'users','sessions','leads','crmDeals','proposals','clients','projects',
    'tasks','timeLogs','invoices','expenses','approvals','vendors','documents',
    'notifications','auditLogs','cmsServices','cmsProjects','cmsTestimonials'
  ];
  for (const key of keys) localCounts[key] = count(db, key);

  const duplicates: Record<string, string[]> = {};
  for (const key of keys) {
    const ids = duplicateIds(db, key);
    if (ids.length) duplicates[key] = ids;
  }

  const auditChain = verifyAuditLogChain(db);
  const privateDocuments = verifyPrivateDocuments(db);

  const sourceCmsSettings = db.cmsSettings && typeof db.cmsSettings === 'object' ? { ...db.cmsSettings } : {};
  delete sourceCmsSettings.updatedAt;
  const sourceNotification = db.notificationSettings || {};
  const notificationSource = {
    targetEmail: sourceNotification.targetEmail || null,
    formspreeEndpoint: sourceNotification.formspreeEndpoint || null,
    telegramChatId: sourceNotification.telegramChatId || null,
    isEmailActive: Boolean(sourceNotification.isEmailActive),
    isTelegramActive: Boolean(sourceNotification.isTelegramActive),
    hasTelegramToken: Boolean(process.env.KAPITECH_TELEGRAM_BOT_TOKEN)
  };

  const financials = {
    proposalSubtotal: sum(db, 'proposals', 'subtotal'),
    proposalTotal: sum(db, 'proposals', 'total'),
    invoiceTotal: sum(db, 'invoices', 'total'),
    invoiceAmountPaid: sum(db, 'invoices', 'amountPaid'),
    invoiceBalanceDue: sum(db, 'invoices', 'balanceDue'),
    expensesTotal: sum(db, 'expenses', 'amount'),
    pipelineValue: sum(db, 'crmDeals', 'value')
  };

  const userIds = new Set(arr(db, 'users').map(row => row?.id).filter(Boolean));
  const clientIds = new Set(arr(db, 'clients').map(row => row?.id).filter(Boolean));
  const projectIds = new Set(arr(db, 'projects').map(row => row?.id).filter(Boolean));
  const brokenReferences = {
    sessionsUser: arr(db, 'sessions').filter(row => row?.userId && !userIds.has(row.userId)).length,
    projectsClient: arr(db, 'projects').filter(row => row?.clientId && !clientIds.has(row.clientId)).length,
    proposalsClient: arr(db, 'proposals').filter(row => row?.clientId && !clientIds.has(row.clientId)).length,
    proposalsProject: arr(db, 'proposals').filter(row => row?.projectId && !projectIds.has(row.projectId)).length,
    invoicesClient: arr(db, 'invoices').filter(row => row?.clientId && !clientIds.has(row.clientId)).length,
    invoicesProject: arr(db, 'invoices').filter(row => row?.projectId && !projectIds.has(row.projectId)).length,
    tasksProject: arr(db, 'tasks').filter(row => row?.projectId && !projectIds.has(row.projectId)).length
  };

  const pool = getPostgresPool();
  const runId = crypto.randomUUID();
  await pool.query('SELECT 1');
  await pool.query(
    'INSERT INTO migration_runs (id, source_kind, source_sha256, started_at, status, report) VALUES ($1,$2,$3,NOW(),$4,$5)',
    [runId, 'encrypted-json', sourceSha256, 'running', JSON.stringify({ localCounts, financials, duplicates, brokenReferences })]
  );

  try {
    const postgresResult = await pgCountsAndFinancials();
    const clientSpendParity = await pgClientSpendParity();
    const financeIntegrity = await pgFinanceIntegrity();
    const postgresCounts = postgresResult.counts;
    const postgresRecords = await pgRecordSets();
    const recordParity = buildRecordParity(db, postgresRecords);
    const recordParityComplete = Object.values(recordParity).every(result => result.valid);
    const financialMismatches = Object.fromEntries(
      Object.keys(financials)
        .filter(key => Math.abs(financials[key as keyof typeof financials] - postgresResult.financials[key]) > 0.005)
        .map(key => [key, { json: financials[key as keyof typeof financials], postgres: postgresResult.financials[key] }])
    );
    const cmsSettingsMismatches = Object.keys({ ...sourceCmsSettings, ...postgresResult.cmsSettings })
      .filter(key => JSON.stringify(sourceCmsSettings[key]) !== JSON.stringify(postgresResult.cmsSettings[key]))
      .map(key => [key, { json: sourceCmsSettings[key], postgres: postgresResult.cmsSettings[key] }]);
    const notificationMismatches = Object.keys(notificationSource)
      .filter(key => notificationSource[key as keyof typeof notificationSource] !== postgresResult.notificationSettings[key])
      .map(key => key === 'hasTelegramToken' ? key : [key, { json: notificationSource[key as keyof typeof notificationSource], postgres: postgresResult.notificationSettings[key] }]);

    const countMismatches = Object.fromEntries(
      keys
        .filter(key => localCounts[key] !== postgresCounts[key])
        .map(key => [key, { json: localCounts[key], postgres: postgresCounts[key] }])
    );

    const checks = {
      sourceReadable: true,
      duplicateIds: Object.keys(duplicates).length === 0,
      brokenReferences: Object.values(brokenReferences).every(value => value === 0),
      postgresReachable: true,
      countParity: Object.keys(countMismatches).length === 0,
      financialParity: Object.keys(financialMismatches).length === 0,
      cmsSettingsParity: cmsSettingsMismatches.length === 0,
      notificationSettingsParity: notificationMismatches.length === 0,
      auditChainIntegrity: auditChain.valid,
      privateDocumentIntegrity: privateDocuments.valid,
      recordFieldParity: recordParityComplete,
      clientSpendParity: clientSpendParity.valid,
      financeIntegrity: financeIntegrity.valid
    };

    const reconciliationPass = checks.countParity && checks.financialParity && checks.recordFieldParity;
    const status = reconciliationPass && Object.values(checks).every(Boolean) ? 'succeeded' : 'failed';
    const report = {
      runId,
      sourceSha256,
      checks,
      localCounts,
      postgresCounts,
      countMismatches,
      financialMismatches,
      cmsSettingsMismatches,
      notificationMismatches,
      recordParity,
      clientSpendParity,
      financeIntegrity,
      auditChain,
      privateDocuments,
      financials,
      duplicates,
      brokenReferences,
      note: 'This command is reconciliation-only. It does not insert, update, delete, or migrate business records.'
    };

    await pool.query(
      'UPDATE migration_runs SET completed_at=NOW(), status=$2, report=$3 WHERE id=$1',
      [runId, status, JSON.stringify(report)]
    );

    console.log(JSON.stringify(report, null, 2));
    if (status !== 'succeeded') process.exitCode = 2;
  } catch (error) {
    await pool.query(
      'UPDATE migration_runs SET completed_at=NOW(), status=$2, report=$3 WHERE id=$1',
      [runId, 'failed', JSON.stringify({ error: error instanceof Error ? error.message : String(error) })]
    );
    throw error;
  } finally {
    await closePostgresPool();
  }
}

main().catch(error => {
  console.error('[PostgreSQL reconciliation] Failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
