import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getPostgresPool, closePostgresPool } from '../server/postgres.ts';
import { encryptOptionalSecret } from '../server/secret-crypto.ts';
import { getDocumentStorage } from '../server/document-storage.ts';

type AnyRecord = Record<string, any>;

const DATA_DIR = process.env.KAPITECH_DATA_DIR
  ? path.resolve(process.env.KAPITECH_DATA_DIR)
  : path.join(process.env.HOME || process.cwd(), '.kapitech-ams-data');
const DB_FILE = path.join(DATA_DIR, 'kapitech_db.json');
const PREFIX = 'KAPI-ENC-V1:';
const MODE = process.env.KAPITECH_MIGRATION_MODE || 'validate';

const CORE_KEYS = [
  'users', 'sessions', 'leads', 'crmDeals', 'clients', 'projects', 'proposals',
  'tasks', 'timeLogs', 'invoices', 'expenses', 'approvals', 'vendors',
  'documents', 'notifications', 'auditLogs'
] as const;

function encryptionKey(): Buffer {
  const raw = process.env.KAPITECH_DATA_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error('KAPITECH_DATA_ENCRYPTION_KEY is required.');
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('KAPITECH_DATA_ENCRYPTION_KEY must decode to 32 bytes.');
  return key;
}

function decrypt(raw: string): string {
  if (!raw.startsWith(PREFIX)) return raw;
  const payload = JSON.parse(raw.slice(PREFIX.length));
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.data, 'base64')),
    decipher.final()
  ]).toString('utf8');
}

function arr(db: AnyRecord, key: string): AnyRecord[] {
  return Array.isArray(db?.[key]) ? db[key] : [];
}

function textValue(value: unknown, fallback = ''): string {
  return value === null || value === undefined ? fallback : String(value);
}

function nullableText(value: unknown): string | null {
  const valueText = textValue(value).trim();
  return valueText ? valueText : null;
}

function numberValue(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function nullableNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const CANONICAL_CLIENT_STATUSES = new Set(['active','inactive','completed','lead']);
const CANONICAL_CRM_STAGES = new Set(['new','contacted','proposal','negotiation','won','lost']);
const CANONICAL_PRIORITY = new Set(['low','medium','high','urgent']);

function normalizeClientStatus(value: unknown): string {
  const raw = textValue(value, 'active').trim().toLowerCase();
  const aliases: Record<string,string> = { prospect: 'lead', on_hold: 'inactive' };
  const normalized = aliases[raw] || raw;
  if (!CANONICAL_CLIENT_STATUSES.has(normalized)) throw new Error('Unsupported client status in migration source: ' + raw);
  return normalized;
}

function normalizeCrmStage(value: unknown): string {
  const raw = textValue(value, 'new').trim().toLowerCase();
  const aliases: Record<string,string> = { lead: 'new', discovery: 'contacted' };
  const normalized = aliases[raw] || raw;
  if (!CANONICAL_CRM_STAGES.has(normalized)) throw new Error('Unsupported CRM stage in migration source: ' + raw);
  return normalized;
}

function normalizePriority(value: unknown): string | null {
  const raw = nullableText(value)?.toLowerCase() || null;
  if (!raw) return null;
  if (!CANONICAL_PRIORITY.has(raw)) throw new Error('Unsupported priority in migration source: ' + raw);
  return raw;
}

function normalizeProposalStatus(value: unknown): string {
  const raw = textValue(value, 'Draft').trim().toLowerCase();
  const aliases: Record<string,string> = {
    draft: 'Draft',
    'internal review': 'Internal Review',
    'internal_review': 'Internal Review',
    sent: 'Sent',
    approved: 'Approved',
    rejected: 'Rejected',
    accepted: 'Accepted'
  };
  const normalized = aliases[raw];
  if (!normalized) throw new Error('Unsupported proposal status in migration source: ' + raw);
  return normalized;
}

function normalizeInvoiceStatus(value: unknown): string {
  const raw = textValue(value, 'draft').trim().toLowerCase();
  const allowed = new Set(['draft','sent','partially_paid','paid','overdue','cancelled']);
  if (!allowed.has(raw)) throw new Error('Unsupported invoice status in migration source: ' + raw);
  return raw;
}

function normalizeVendorStatus(value: unknown): string {
  const raw = textValue(value, 'active').trim().toLowerCase();
  const allowed = new Set(['active','under_review','inactive','blacklisted']);
  if (!allowed.has(raw)) throw new Error('Unsupported vendor status in migration source: ' + raw);
  return raw;
}

function normalizeProjectStatus(value: unknown): string {
  const raw = textValue(value).trim().toLowerCase();
  const allowed = new Set(['planning','in_progress','review','completed','on_hold']);
  if (!allowed.has(raw)) throw new Error('Unsupported project status in migration source: ' + raw);
  return raw;
}

function normalizeTaskStatus(value: unknown): string {
  const raw = textValue(value).trim().toLowerCase();
  const allowed = new Set(['todo','in_progress','review','done']);
  if (!allowed.has(raw)) throw new Error('Unsupported task status in migration source: ' + raw);
  return raw;
}

function assigneeUserIdFor(row: AnyRecord, users: AnyRecord[]): string | null {
  const candidate = nullableText(row.assigneeUserId || row.assigneeId || row.assignee);
  if (!candidate) return null;
  const matches = users.filter(user => {
    const id = textValue(user.id).toLowerCase();
    const username = textValue(user.username).trim().toLowerCase();
    const name = textValue(user.name).trim().toLowerCase();
    const probe = candidate.trim().toLowerCase();
    return probe === id || probe === username || probe === name;
  });
  if (matches.length !== 1) throw new Error('Unresolved task assignee in migration source: ' + candidate);
  return textValue(matches[0].id);
}

function dateValue(value: unknown): string | null {
  const text = textValue(value).trim();
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function timestampValue(value: unknown, fallback = '1970-01-01T00:00:00.000Z'): string {
  const text = textValue(value).trim();
  if (!text) return fallback;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function jsonValue(value: unknown): string {
  return JSON.stringify(value && typeof value === 'object' ? value : {});
}

function sha256(raw: string): string {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

function sha256Buffer(raw: Buffer): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function computeAuditLogHash(log: {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  actorRole: string;
  ip: string;
  userAgent: string;
  details: string;
  severity: string;
  prevHash: string;
}): string {
  return crypto.createHash('sha256').update(JSON.stringify(log), 'utf8').digest('hex');
}

function prepareAuditLogChain(db: AnyRecord): void {
  const logs = arr(db, 'auditLogs');
  if (!logs.length) return;

  const hasAnyHash = logs.some(log => Boolean(log.hash) || Boolean(log.prevHash));
  const hasAllHashes = logs.every(log => Boolean(log.hash) && Boolean(log.prevHash));

  if (!hasAnyHash) {
    let previousHash = 'GENESIS';
    for (let index = logs.length - 1; index >= 0; index -= 1) {
      const log = logs[index];
      const normalized = {
        id: textValue(log.id),
        timestamp: timestampValue(log.timestamp),
        action: textValue(log.action),
        actor: textValue(log.actor, 'anonymous'),
        actorRole: textValue(log.actorRole, 'visitor'),
        ip: textValue(log.ip, '127.0.0.1'),
        userAgent: textValue(log.userAgent, 'unknown'),
        details: textValue(log.details),
        severity: textValue(log.severity, 'info'),
        prevHash: previousHash
      };
      log.timestamp = normalized.timestamp;
      log.prevHash = normalized.prevHash;
      log.hash = computeAuditLogHash(normalized);
      previousHash = log.hash;
    }
    return;
  }

  if (!hasAllHashes) throw new Error('Audit log chain contains partial hash fields in migration source.');

  let previousHash = 'GENESIS';
  for (let index = logs.length - 1; index >= 0; index -= 1) {
    const log = logs[index];
    const normalized = {
      id: textValue(log.id),
      timestamp: timestampValue(log.timestamp),
      action: textValue(log.action),
      actor: textValue(log.actor, 'anonymous'),
      actorRole: textValue(log.actorRole, 'visitor'),
      ip: textValue(log.ip, '127.0.0.1'),
      userAgent: textValue(log.userAgent, 'unknown'),
      details: textValue(log.details),
      severity: textValue(log.severity, 'info'),
      prevHash: previousHash
    };
    const expectedHash = computeAuditLogHash(normalized);
    if (textValue(log.prevHash) !== normalized.prevHash || textValue(log.hash) !== expectedHash) {
      throw new Error('Audit log chain verification failed in migration source: ' + textValue(log.id));
    }
    previousHash = expectedHash;
  }
}

function privateDocumentSourceDir(): string {
  return process.env.KAPITECH_PRIVATE_DOCUMENT_DIR
    ? path.resolve(process.env.KAPITECH_PRIVATE_DOCUMENT_DIR)
    : path.join(DATA_DIR, 'private-documents');
}

function decryptPrivateDocument(payload: Buffer): Buffer {
  const raw = payload.toString('utf8');
  if (!raw.startsWith('KAPI-FILE-V1:')) throw new Error('Private document encryption header is invalid.');
  const envelope = JSON.parse(raw.slice('KAPI-FILE-V1:'.length));
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(envelope.data, 'base64')),
    decipher.final()
  ]);
}

function isMissingStorageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /missing|not found|404/i.test(message);
}

async function stagePrivateDocumentObjects(db: AnyRecord): Promise<{ metadata: Map<string, AnyRecord>; createdKeys: string[] }> {
  const documents = arr(db, 'documents').filter(row => row.storageKey && row.sourceType !== 'external_link');
  const metadata = new Map<string, AnyRecord>();
  const createdKeys: string[] = [];
  if (!documents.length) return { metadata, createdKeys };

  const storage = getDocumentStorage();
  const sourceDir = privateDocumentSourceDir();
  try {
    for (const document of documents) {
      const storageKey = textValue(document.storageKey).trim();
      if (!/^[a-f0-9]{64}$/.test(storageKey)) {
        throw new Error('Invalid private document storage key for ' + textValue(document.id));
      }

      const sourcePath = path.join(sourceDir, storageKey + '.enc');
      if (!fs.existsSync(sourcePath)) {
        throw new Error('Private document source object is missing: ' + textValue(document.id));
      }
      const payload = fs.readFileSync(sourcePath);
      if (payload.length === 0) throw new Error('Private document source object is empty: ' + textValue(document.id));

      const storageSha256 = sha256Buffer(payload);
      let existing: { storageSha256: string } | null = null;
      try {
        existing = await storage.get(storageKey);
      } catch (error) {
        if (!isMissingStorageError(error)) throw error;
      }

      if (existing) {
        if (existing.storageSha256 !== storageSha256) {
          throw new Error('Target storage already contains a different object for document ' + textValue(document.id) + '. Refusing to overwrite it during cutover.');
        }
      } else {
        await storage.put(storageKey, payload);
        createdKeys.push(storageKey);
      }

      const verified = await storage.get(storageKey);
      if (verified.storageSha256 !== storageSha256) {
        throw new Error('Private document object verification failed after migration: ' + textValue(document.id));
      }

      const contentSha256 = sha256Buffer(decryptPrivateDocument(payload));
      metadata.set(textValue(document.id), {
        contentSha256,
        storageSha256,
        storageVersion: Number(document.storageVersion || 1),
        storageProvider: storage.provider,
        integrityCheckedAt: new Date().toISOString(),
        uploadedAt: timestampValue(document.uploadedAt || document.uploadedDate, document.createdAt),
        sizeBytes: Buffer.byteLength(decryptPrivateDocument(payload))
      });
    }
  } catch (error) {
    for (const key of createdKeys) {
      try { await storage.delete(key); } catch (cleanupError) { console.error('[PostgreSQL import] Private object cleanup failed:', cleanupError); }
    }
    throw error;
  }

  return { metadata, createdKeys };
}

function duplicateIds(db: AnyRecord, key: string): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of arr(db, key)) {
    const id = nullableText(row.id);
    if (!id) continue;
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

function assertNoDuplicateIds(db: AnyRecord): void {
  const duplicates = Object.fromEntries(
    CORE_KEYS.map(key => [key, duplicateIds(db, key)]).filter(([, ids]) => ids.length)
  );
  if (Object.keys(duplicates).length) {
    throw new Error('Duplicate source IDs detected: ' + JSON.stringify(duplicates));
  }
}

function assertForeignKeys(db: AnyRecord): void {
  const users = new Set(arr(db, 'users').map(row => row.id).filter(Boolean));
  const clients = new Set(arr(db, 'clients').map(row => row.id).filter(Boolean));
  const projects = new Set(arr(db, 'projects').map(row => row.id).filter(Boolean));
  const deals = new Set(arr(db, 'crmDeals').map(row => row.id).filter(Boolean));
  const proposals = new Set(arr(db, 'proposals').map(row => row.id).filter(Boolean));
  const tasks = new Set(arr(db, 'tasks').map(row => row.id).filter(Boolean));
  const errors: string[] = [];

  const check = (key: string, field: string, ids: Set<string>) => {
    for (const row of arr(db, key)) {
      if (row[field] && !ids.has(row[field])) errors.push(key + '.' + field + ':' + row.id + ' -> ' + row[field]);
    }
  };

  check('sessions', 'userId', users);
  check('projects', 'clientId', clients);
  check('proposals', 'clientId', clients);
  check('proposals', 'dealId', deals);
  check('proposals', 'projectId', projects);
  check('tasks', 'projectId', projects);
  check('timeLogs', 'projectId', projects);
  check('timeLogs', 'taskId', tasks);
  check('timeLogs', 'userId', users);
  check('invoices', 'clientId', clients);
  check('invoices', 'projectId', projects);
  check('invoices', 'proposalId', proposals);
  check('expenses', 'recordedByUserId', users);
  check('expenses', 'projectId', projects);
  check('approvals', 'requesterUserId', users);
  check('documents', 'ownerUserId', users);
  check('notifications', 'recipientUserId', users);

  for (const row of arr(db, 'invoices')) {
    const invoiceClientId = clientIdFor(row, arr(db, 'clients'));
    const projectId = nullableText(row.projectId);
    if (invoiceClientId && projectId) {
      const project = arr(db, 'projects').find(item => textValue(item.id) === projectId);
      const projectClientId = project ? nullableText(project.clientId) : null;
      if (projectClientId && invoiceClientId !== projectClientId) throw new Error('Invoice client/project relationship mismatch in migration source: ' + textValue(row.id));
    }
  }

  for (const row of arr(db, 'timeLogs')) {
    const taskId = nullableText(row.taskId);
    const projectId = nullableText(row.projectId);
    if (!taskId && !projectId) throw new Error('Time log must reference a project or task in migration source: ' + textValue(row.id));
    if (taskId) {
      const task = arr(db, 'tasks').find(item => textValue(item.id) === taskId);
      if (!task) throw new Error('Referenced task not found in migration source: ' + taskId);
      const taskProjectId = nullableText(task.projectId);
      if (!taskProjectId) throw new Error('Time log task must belong to a project in migration source: ' + textValue(row.id));
      if (projectId && projectId !== taskProjectId) throw new Error('Time log task/project mismatch in migration source: ' + textValue(row.id));
    }
  }

  for (const row of arr(db, 'documents')) {
    for (const userId of Array.isArray(row.accessUserIds) ? row.accessUserIds : []) {
      if (userId && !users.has(userId)) {
        errors.push('documents.accessUserIds:' + row.id + ' -> ' + userId);
      }
    }
  }

  if (errors.length) {
    throw new Error('Broken source foreign keys detected: ' + errors.slice(0, 50).join(', '));
  }
}

function isHttps(value: unknown): boolean {
  try {
    return new URL(textValue(value)).protocol === 'https:';
  } catch {
    return false;
  }
}

function clientIdFor(row: AnyRecord, clients: AnyRecord[]): string | null {
  if (row.clientId) return nullableText(row.clientId);
  const name = textValue(row.clientName).trim().toLowerCase();
  const company = textValue(row.company || row.clientCompany).trim().toLowerCase();
  const matches = clients.filter(client => {
    const clientName = textValue(client.name).trim().toLowerCase();
    const clientCompany = textValue(client.company).trim().toLowerCase();
    return (name && clientName === name) || (company && clientCompany === company);
  });
  return matches.length === 1 ? textValue(matches[0].id) : null;
}

function clientIdForProjectLinkedRow(row: AnyRecord, clients: AnyRecord[], projects: AnyRecord[]): string | null {
  const directClientId = clientIdFor(row, clients);
  const projectId = nullableText(row.projectId);
  if (!projectId) return directClientId;

  const project = projects.find(item => textValue(item.id) === projectId);
  if (!project) throw new Error('Referenced project not found in migration source: ' + projectId);

  const projectClientId = nullableText(project.clientId);
  if (directClientId && projectClientId && directClientId !== projectClientId) {
    throw new Error('Client/project relationship mismatch in migration source: ' + textValue(row.id));
  }
  return directClientId || projectClientId;
}

function assertNestedIds(db: AnyRecord): void {
  const proposalItemIds = new Set<string>();
  const invoiceItemIds = new Set<string>();
  const paymentIds = new Set<string>();
  const invoiceNumbers = new Set<string>();
  const proposalInvoiceIds = new Set<string>();

  for (const row of arr(db, 'proposals')) {
    for (const item of Array.isArray(row.items) ? row.items : []) {
      const id = nullableText(item.id);
      if (!id) throw new Error('Proposal item is missing an id: ' + textValue(row.id));
      if (proposalItemIds.has(id)) throw new Error('Duplicate proposal item id: ' + id);
      proposalItemIds.add(id);
    }
  }
  for (const row of arr(db, 'invoices')) {
    const invoiceNumber = nullableText(row.invoiceNumber);
    if (invoiceNumber) {
      if (invoiceNumbers.has(invoiceNumber)) throw new Error('Duplicate invoice number in migration source: ' + invoiceNumber);
      invoiceNumbers.add(invoiceNumber);
    }
    const proposalId = nullableText(row.proposalId);
    if (proposalId) {
      if (proposalInvoiceIds.has(proposalId)) throw new Error('Multiple invoices reference the same proposal in migration source: ' + proposalId);
      proposalInvoiceIds.add(proposalId);
    }

    for (const item of Array.isArray(row.items) ? row.items : []) {
      const id = nullableText(item.id);
      if (!id) throw new Error('Invoice item is missing an id: ' + textValue(row.id));
      if (invoiceItemIds.has(id)) throw new Error('Duplicate invoice item id: ' + id);
      invoiceItemIds.add(id);
    }

    for (const payment of Array.isArray(row.payments) ? row.payments : []) {
      const id = nullableText(payment.id);
      if (!id) throw new Error('Invoice payment is missing an id: ' + textValue(row.id));
      if (paymentIds.has(id)) throw new Error('Duplicate invoice payment id: ' + id);
      paymentIds.add(id);
    }

    const items = Array.isArray(row.items) ? row.items : [];
    if (items.length === 0) throw new Error('Invoice has no line items in migration source: ' + textValue(row.id));
    const subtotalFromItems = items.reduce((sum, item) => {
      const quantity = numberValue(item.quantity);
      const unitPrice = numberValue(item.unitPrice);
      const amount = numberValue(item.amount, quantity * unitPrice);
      const expectedAmount = Math.round(quantity * unitPrice);
      if (quantity <= 0 || unitPrice < 0 || amount < 0 || Math.abs(amount - expectedAmount) > 0.01) {
        throw new Error('Invalid invoice line item in migration source: ' + textValue(row.id));
      }
      return Math.round((sum + amount) * 100) / 100;
    }, 0);
    const subtotal = numberValue(row.subtotal);
    const discountPercent = numberValue(row.discountPercent);
    const taxPercent = numberValue(row.taxPercent);
    if (discountPercent < 0 || discountPercent > 100 || taxPercent < 0 || taxPercent > 100) {
      throw new Error('Invalid invoice financial percentages in migration source: ' + textValue(row.id));
    }
    const discountAmount = Math.round(subtotal * discountPercent / 100);
    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(taxableSubtotal * taxPercent / 100);
    const expectedTotal = taxableSubtotal + taxAmount;
    if (Math.abs(subtotalFromItems - subtotal) > 0.01 ||
        Math.abs(numberValue(row.discountAmount) - discountAmount) > 0.01 ||
        Math.abs(numberValue(row.taxAmount) - taxAmount) > 0.01 ||
        Math.abs(numberValue(row.total) - expectedTotal) > 0.01) {
      throw new Error('Invoice financial total mismatch in migration source: ' + textValue(row.id));
    }

    const total = numberValue(row.total);
    const paid = numberValue(row.amountPaid);
    const balance = numberValue(row.balanceDue);
    const paymentSum = (Array.isArray(row.payments) ? row.payments : [])
      .reduce((sum, payment) => sum + numberValue(payment.amount), 0);
    if (Math.abs(paymentSum - paid) > 0.01) {
      throw new Error('Invoice payment aggregate mismatch in migration source: ' + textValue(row.id));
    }
    const expectedBalance = Math.max(total - paymentSum, 0);
    if (Math.abs(expectedBalance - balance) > 0.01) {
      throw new Error('Invoice balance aggregate mismatch in migration source: ' + textValue(row.id));
    }
    if (normalizeInvoiceStatus(row.status) === 'cancelled' && paymentSum > 0.01) {
      throw new Error('Cancelled invoice cannot contain payments in migration source: ' + textValue(row.id));
    }
  }

  for (const row of arr(db, 'documents')) {
    const ids = new Set<string>();
    for (const userId of Array.isArray(row.accessUserIds) ? row.accessUserIds : []) {
      const id = nullableText(userId);
      if (id && ids.has(id)) throw new Error('Duplicate document access user id: ' + id);
      if (id) ids.add(id);
    }
  }
}

function assertApprovalReferences(db: AnyRecord): void {
  const tables: Record<string, string> = { Invoice: 'invoices', Proposal: 'proposals', Project: 'projects', Expense: 'expenses' };
  for (const row of arr(db, 'approvals')) {
    const type = textValue(row.type, 'Invoice');
    const table = tables[type];
    if (!table) throw new Error('Unsupported approval type in migration source: ' + type);
    const ref = nullableText(row.referenceId);
    if (!ref) throw new Error('Approval reference is missing in migration source: ' + textValue(row.id));
    if (!arr(db, table).some(item => textValue(item.id) === ref)) {
      throw new Error('Broken approval reference in migration source: ' + textValue(row.id));
    }
  }
}

function metadata(row: AnyRecord, known: string[]): string {
  const extra: AnyRecord = {};
  for (const [key, value] of Object.entries(row)) {
    if (!known.includes(key)) extra[key] = value;
  }
  return jsonValue(extra);
}

async function upsert(client: any, table: string, columns: string[], values: unknown[]): Promise<void> {
  const placeholders = columns.map((_, index) => '$' + (index + 1)).join(', ');
  const updates = columns
    .filter(column => column !== 'id')
    .map(column => column + ' = EXCLUDED.' + column)
    .join(', ');
  const sql = 'INSERT INTO ' + table + ' (' + columns.join(', ') + ') VALUES (' + placeholders + ')' +
    ' ON CONFLICT (id) DO UPDATE SET ' + updates;
  await client.query(sql, values);
}

async function importUsers(client: any, db: AnyRecord): Promise<number> {
  for (const row of arr(db, 'users')) {
    await upsert(client, 'users',
      ['id','name','username','email','password_hash','salt','password_algorithm','role','stakeholder_type',
       'permissions','mfa_enabled','mfa_secret','mfa_pending_secret','mfa_pending_secret_created_at',
       'mfa_recovery_code_hashes','division','status','last_login','created_at'],
      [textValue(row.id), textValue(row.name), textValue(row.username), textValue(row.email),
       textValue(row.passwordHash), textValue(row.salt), textValue(row.passwordAlgorithm, 'pbkdf2-sha512'),
       textValue(row.role), textValue(row.stakeholderType), jsonValue(row.permissions),
       Boolean(row.mfaEnabled), encryptOptionalSecret(row.mfaSecret), encryptOptionalSecret(row.mfaPendingSecret),
       row.mfaPendingSecretCreatedAt ? timestampValue(row.mfaPendingSecretCreatedAt) : null,
       JSON.stringify(Array.isArray(row.mfaRecoveryCodeHashes) ? row.mfaRecoveryCodeHashes : []),
       textValue(row.division), textValue(row.status, 'active'), row.lastLogin ? timestampValue(row.lastLogin) : null,
       timestampValue(row.createdAt)]);
  }
  return arr(db, 'users').length;
}

async function importSessions(client: any, db: AnyRecord): Promise<number> {
  for (const row of arr(db, 'sessions')) {
    if (!row.tokenHash) throw new Error('Session ' + textValue(row.id, 'unknown') + ' has no tokenHash.');
    await client.query(
      `INSERT INTO sessions (token_hash,user_id,created_at,last_activity_at,expires_at,remember_me,ip,user_agent,kind,mfa_failed_attempts)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (token_hash) DO UPDATE SET user_id=EXCLUDED.user_id,created_at=EXCLUDED.created_at,
       last_activity_at=EXCLUDED.last_activity_at,expires_at=EXCLUDED.expires_at,remember_me=EXCLUDED.remember_me,
       ip=EXCLUDED.ip,user_agent=EXCLUDED.user_agent,kind=EXCLUDED.kind,mfa_failed_attempts=EXCLUDED.mfa_failed_attempts`,
      [textValue(row.tokenHash), textValue(row.userId), timestampValue(row.createdAt), timestampValue(row.lastActivityAt, timestampValue(row.createdAt)),
       new Date(numberValue(row.expiresAt)).toISOString(), Boolean(row.rememberMe), nullableText(row.ip),
       textValue(row.userAgent), textValue(row.kind, 'session'), numberValue(row.mfaFailedAttempts)]
    );
  }
  return arr(db, 'sessions').length;
}

async function importCore(client: any, db: AnyRecord, privateDocumentMetadata: Map<string, AnyRecord>): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  counts.users = await importUsers(client, db);
  counts.sessions = await importSessions(client, db);

  for (const row of arr(db, 'leads')) {
    await upsert(client, 'leads',
      ['id','full_name','email','phone','company','service_category','budget_range','project_timeline','message','source','status','honeypot_triggered','created_at','updated_at'],
      [textValue(row.id),textValue(row.fullName),textValue(row.email),nullableText(row.phone),nullableText(row.company),
       nullableText(row.serviceCategory),nullableText(row.budgetRange),nullableText(row.projectTimeline),textValue(row.message),
       nullableText(row.source),textValue(row.status,'new'),Boolean(row.honeypotTriggered),
       timestampValue(row.createdAt),timestampValue(row.updatedAt,row.createdAt)]);
  }
  counts.leads = arr(db,'leads').length;

  for (const row of arr(db, 'clients')) {
    await upsert(client, 'clients',
      ['id','name','company','email','phone','industry','status','notes','metadata','created_at','updated_at'],
      [textValue(row.id),textValue(row.name || row.clientName),nullableText(row.company),nullableText(row.email),nullableText(row.phone),
       nullableText(row.industry),normalizeClientStatus(row.status),nullableText(row.notes),metadata(row,['id','name','clientName','company','email','phone','industry','status','notes','createdAt','updatedAt']),
       timestampValue(row.createdAt),timestampValue(row.updatedAt,row.createdAt)]);
  }
  counts.clients = arr(db,'clients').length;

  const clients = arr(db,'clients');
  for (const row of arr(db, 'crmDeals')) {
    await upsert(client, 'crm_deals',
      ['id','title','client_id','client_name','company','email','phone','service_pillar','value','stage','priority','probability','owner','expected_close_date','metadata','created_at','updated_at'],
      [textValue(row.id),textValue(row.title),clientIdFor(row,clients),nullableText(row.clientName),nullableText(row.company),nullableText(row.email),
       nullableText(row.phone),nullableText(row.servicePillar),numberValue(row.value),normalizeCrmStage(row.stage),normalizePriority(row.priority),
       nullableNumber(row.probability),nullableText(row.owner),dateValue(row.expectedCloseDate),
       metadata(row,['id','title','clientId','clientName','company','email','phone','servicePillar','value','stage','priority','probability','owner','expectedCloseDate','createdAt','updatedAt']),
       timestampValue(row.createdAt),timestampValue(row.updatedAt,row.createdAt)]);
  }
  counts.crmDeals = arr(db,'crmDeals').length;

  for (const row of arr(db, 'projects')) {
    await upsert(client, 'projects',
      ['id','client_id','name','description','status','owner','budget','start_date','end_date','metadata','created_at','updated_at'],
      [textValue(row.id),nullableText(row.clientId),textValue(row.name || row.title),nullableText(row.description),normalizeProjectStatus(row.status),
       nullableText(row.owner),numberValue(row.budget),dateValue(row.startDate),dateValue(row.endDate),
       metadata(row,['id','clientId','name','title','description','status','owner','budget','startDate','endDate','createdAt','updatedAt']),
       timestampValue(row.createdAt),timestampValue(row.updatedAt,row.createdAt)]);
  }
  counts.projects = arr(db,'projects').length;

  const projects = arr(db,'projects');
  for (const row of arr(db, 'proposals')) {
    await upsert(client, 'proposals',
      ['id','proposal_number','title','client_id','deal_id','project_id','subtotal','discount','tax_percent','tax','total','currency',
       'validity_period','payment_terms','owner','status','notes','created_date','sent_date','approved_date','metadata','created_at','updated_at'],
      [textValue(row.id),nullableText(row.proposalNumber),textValue(row.title),clientIdForProjectLinkedRow(row,clients,projects),nullableText(row.dealId),nullableText(row.projectId),
       numberValue(row.subtotal),numberValue(row.discount),numberValue(row.taxPercent),numberValue(row.tax),numberValue(row.total),textValue(row.currency,'IDR'),
       nullableText(row.validityPeriod),nullableText(row.paymentTerms),nullableText(row.owner),normalizeProposalStatus(row.status),nullableText(row.notes),
       dateValue(row.createdDate),dateValue(row.sentDate),dateValue(row.approvedDate),metadata(row,['id','proposalNumber','title','clientId','clientName','company','dealId','projectId','items','subtotal','discount','taxPercent','tax','total','currency','validityPeriod','paymentTerms','owner','status','notes','createdDate','sentDate','approvedDate','createdAt','updatedAt']),
       timestampValue(row.createdAt),timestampValue(row.updatedAt,row.createdAt)]);
    for (const item of Array.isArray(row.items) ? row.items : []) {
      await client.query(
        `INSERT INTO proposal_items (id,proposal_id,description,quantity,unit_price)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO UPDATE SET proposal_id=EXCLUDED.proposal_id,description=EXCLUDED.description,
         quantity=EXCLUDED.quantity,unit_price=EXCLUDED.unit_price`,
        [textValue(item.id),textValue(row.id),textValue(item.description),numberValue(item.quantity,1),numberValue(item.unitPrice)]
      );
    }
  }
  counts.proposals = arr(db,'proposals').length;

  for (const row of arr(db, 'tasks')) {
    await upsert(client, 'tasks',
      ['id','project_id','title','description','status','priority','assignee_user_id','due_date','metadata','created_at','updated_at'],
      [textValue(row.id),nullableText(row.projectId),textValue(row.title),nullableText(row.description),normalizeTaskStatus(row.status),
       normalizePriority(row.priority),assigneeUserIdFor(row, arr(db,'users')),dateValue(row.dueDate),
       metadata(row,['id','projectId','title','description','status','priority','assigneeUserId','assigneeId','dueDate','createdAt','updatedAt']),
       timestampValue(row.createdAt),timestampValue(row.updatedAt,row.createdAt)]);
  }
  counts.tasks = arr(db,'tasks').length;

  const taskRows = arr(db,'tasks');
  for (const row of arr(db, 'timeLogs')) {
    const timeLogTaskId = nullableText(row.taskId);
    let timeLogProjectId = nullableText(row.projectId);
    if (timeLogTaskId) {
      const task = taskRows.find(item => textValue(item.id) === timeLogTaskId);
      if (!task) throw new Error('Referenced task not found in migration source: ' + timeLogTaskId);
      const taskProjectId = nullableText(task.projectId);
      if (timeLogProjectId && taskProjectId && timeLogProjectId !== taskProjectId) {
        throw new Error('Time log task/project mismatch in migration source: ' + textValue(row.id));
      }
      if (!timeLogProjectId) timeLogProjectId = taskProjectId;
    }
    await upsert(client, 'time_logs',
      ['id','project_id','task_id','user_id','hours','description','logged_at','created_at','metadata'],
      [textValue(row.id),timeLogProjectId,timeLogTaskId,nullableText(row.userId),
       numberValue(row.hours),nullableText(row.description),timestampValue(row.loggedAt || row.date,row.createdAt),
       timestampValue(row.createdAt,row.loggedAt || row.date),
       metadata(row, ['id','projectId','taskId','userId','user','durationMinutes','hours','billable','date','loggedAt','notes','description','createdAt'])]);
  }
  counts.timeLogs = arr(db,'timeLogs').length;

  for (const row of arr(db, 'invoices')) {
    await upsert(client, 'invoices',
      ['id','invoice_number','proposal_id','client_id','project_id','type','subtotal','discount_percent','discount_amount','tax_percent','tax_amount','total','amount_paid','balance_due','currency','status','issue_date','due_date','paid_date','notes','payment_terms','metadata','created_at','updated_at'],
      [textValue(row.id),nullableText(row.invoiceNumber),nullableText(row.proposalId),clientIdFor(row,clients),nullableText(row.projectId),textValue(row.type,'invoice'),
       numberValue(row.subtotal),numberValue(row.discountPercent),numberValue(row.discountAmount),numberValue(row.taxPercent),numberValue(row.taxAmount),
       numberValue(row.total),numberValue(row.amountPaid),numberValue(row.balanceDue),textValue(row.currency,'IDR'),normalizeInvoiceStatus(row.status),
       dateValue(row.issueDate),dateValue(row.dueDate),dateValue(row.paidDate),nullableText(row.notes),nullableText(row.paymentTerms),
       metadata(row,['id','invoiceNumber','proposalId','clientId','clientName','clientCompany','clientEmail','clientPhone','projectId','type','items','subtotal','discountPercent','discountAmount','taxPercent','taxAmount','total','amountPaid','balanceDue','currency','status','issueDate','dueDate','paidDate','notes','paymentTerms','payments','createdAt','updatedAt']),
       timestampValue(row.createdAt),timestampValue(row.updatedAt,row.createdAt)]);
    for (const item of Array.isArray(row.items) ? row.items : []) {
      await client.query(
        `INSERT INTO invoice_items (id,invoice_id,description,quantity,unit_price,amount)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET invoice_id=EXCLUDED.invoice_id,description=EXCLUDED.description,
         quantity=EXCLUDED.quantity,unit_price=EXCLUDED.unit_price,amount=EXCLUDED.amount`,
        [textValue(item.id),textValue(row.id),textValue(item.description),numberValue(item.quantity,1),numberValue(item.unitPrice),numberValue(item.amount,numberValue(item.quantity,1)*numberValue(item.unitPrice))]
      );
    }
    for (const payment of Array.isArray(row.payments) ? row.payments : []) {
      await client.query(
        `INSERT INTO invoice_payments (id,invoice_id,amount,paid_at,method,reference,metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET invoice_id=EXCLUDED.invoice_id,amount=EXCLUDED.amount,paid_at=EXCLUDED.paid_at,
         method=EXCLUDED.method,reference=EXCLUDED.reference,metadata=EXCLUDED.metadata`,
        [textValue(payment.id),textValue(row.id),numberValue(payment.amount),dateValue(payment.paidAt || payment.date) || '1970-01-01',
         nullableText(payment.method),nullableText(payment.reference),metadata(payment,['id','amount','paidAt','date','method','reference'])]
      );
    }
  }
  counts.invoices = arr(db,'invoices').length;

  for (const row of arr(db, 'expenses')) {
    await upsert(client, 'expenses',
      ['id','type','category','description','amount','currency','expense_date','recurring_interval','project_id','recorded_by_user_id','recorded_by','status','version','idempotency_key','metadata','created_at'],
      [textValue(row.id),textValue(row.type),textValue(row.category),textValue(row.description),numberValue(row.amount),textValue(row.currency,'IDR'),
       dateValue(row.date || row.expenseDate) || '1970-01-01',nullableText(row.recurringInterval),nullableText(row.projectId),nullableText(row.recordedByUserId),
       nullableText(row.recordedBy),textValue(row.status,'posted'),Number(row.version || 1),nullableText(row.idempotencyKey),
       metadata(row,['id','type','category','description','amount','currency','date','expenseDate','recurringInterval','projectId','recordedByUserId','recordedBy','status','version','idempotencyKey','createdAt']),
       timestampValue(row.createdAt)]);
  }
  counts.expenses = arr(db,'expenses').length;

  for (const row of arr(db, 'approvals')) {
    await upsert(client, 'approvals',
      ['id','type','reference_id','title','requester_user_id','requester','requester_role','value','approval_date','reason','risk_level','status','metadata','created_at'],
      [textValue(row.id),textValue(row.type),nullableText(row.referenceId),textValue(row.title),nullableText(row.requesterUserId),nullableText(row.requester),
       nullableText(row.requesterRole),numberValue(row.value),dateValue(row.date || row.approvalDate),nullableText(row.reason),nullableText(row.riskLevel),
       textValue(row.status),metadata(row,['id','type','referenceId','title','requesterUserId','requester','requesterRole','value','date','approvalDate','reason','riskLevel','status','createdAt']),
       timestampValue(row.createdAt)]);
  }
  counts.approvals = arr(db,'approvals').length;

  for (const row of arr(db, 'vendors')) {
    await upsert(client, 'vendors',
      ['id','name','category','contact_person','email','phone','payment_terms','status','monthly_spend','notes','metadata','created_at'],
      [textValue(row.id),textValue(row.name),nullableText(row.category),nullableText(row.contactPerson),nullableText(row.email),nullableText(row.phone),
       nullableText(row.paymentTerms),normalizeVendorStatus(row.status),numberValue(row.monthlySpend),nullableText(row.notes),
       metadata(row,['id','name','category','contactPerson','email','phone','paymentTerms','status','monthlySpend','notes','createdAt']),
       timestampValue(row.createdAt)]);
  }
  counts.vendors = arr(db,'vendors').length;

  for (const row of arr(db, 'documents')) {
    const externalUrl = isHttps(row.externalUrl || row.url) ? textValue(row.externalUrl || row.url) : null;
    const sourceType = row.storageKey ? 'private_file' : 'external_link';
    const privateMetadata = privateDocumentMetadata.get(textValue(row.id));
    const sizeBytes = privateMetadata?.sizeBytes ?? nullableNumber(row.sizeBytes);
    const status = sourceType === 'private_file' ? 'ready' : textValue(row.status,'ready');
    await upsert(client, 'documents',
      ['id','name','type','mime_type','size_bytes','category','related_entity','related_id','source_type','storage_key','owner_user_id','external_url','status','uploaded_at','created_at',
       'content_sha256','storage_sha256','storage_version','storage_provider','integrity_checked_at','metadata'],
      [textValue(row.id),textValue(row.name),textValue(row.type),nullableText(row.mimeType),sizeBytes,
       nullableText(row.category),nullableText(row.relatedEntity),nullableText(row.relatedId),sourceType,nullableText(row.storageKey),
       nullableText(row.ownerUserId),externalUrl,status,timestampValue(row.uploadedAt || row.uploadedDate,row.createdAt),
       timestampValue(row.createdAt),privateMetadata?.contentSha256 ?? nullableText(row.contentSha256),
       privateMetadata?.storageSha256 ?? nullableText(row.storageSha256),privateMetadata?.storageVersion ?? Number(row.storageVersion || 1),
       privateMetadata?.storageProvider ?? nullableText(row.storageProvider),privateMetadata?.integrityCheckedAt ?? null,
       metadata(row,['id','name','type','mimeType','sizeBytes','size','category','relatedEntity','relatedId','sourceType','storageKey','ownerUserId','owner','externalUrl','url','status','uploadedAt','uploadedDate','createdAt','contentSha256','storageSha256','storageVersion','storageProvider','integrityCheckedAt'])]);
    for (const userId of Array.isArray(row.accessUserIds) ? row.accessUserIds : []) {
      await client.query(
        `INSERT INTO document_access (document_id,user_id) VALUES ($1,$2)
         ON CONFLICT (document_id,user_id) DO NOTHING`,
        [textValue(row.id),textValue(userId)]
      );
    }
  }
  counts.documents = arr(db,'documents').length;

  for (const row of arr(db, 'notifications')) {
    await upsert(client, 'notifications',
      ['id','title','message','type','severity','read','link_url','recipient_user_id','created_at'],
      [textValue(row.id),textValue(row.title),textValue(row.message),nullableText(row.type),nullableText(row.severity),Boolean(row.read),
       nullableText(row.linkUrl),nullableText(row.recipientUserId),timestampValue(row.createdAt || row.timestamp)]);
  }
  counts.notifications = arr(db,'notifications').length;

  // CMS content is stored with a stable core identity plus JSONB for the flexible editorial fields.
  for (const row of arr(db, 'cmsServices')) {
    const data = { ...row };
    delete data.id; delete data.createdAt; delete data.updatedAt;
    await upsert(client, 'cms_services',
      ['id','name','slug','description','data','created_at','updated_at'],
      [textValue(row.id), textValue(row.title || row.name), nullableText(row.slug),
       nullableText(row.description || row.heroSubtitle), jsonValue(data),
       timestampValue(row.createdAt), timestampValue(row.updatedAt, row.createdAt)]);
  }
  counts.cmsServices = arr(db,'cmsServices').length;

  for (const row of arr(db, 'cmsProjects')) {
    const data = { ...row };
    delete data.id; delete data.createdAt; delete data.updatedAt;
    await upsert(client, 'cms_projects',
      ['id','name','slug','description','data','created_at','updated_at'],
      [textValue(row.id), textValue(row.title || row.name), nullableText(row.slug),
       nullableText(row.description || row.desc), jsonValue(data),
       timestampValue(row.createdAt), timestampValue(row.updatedAt, row.createdAt)]);
  }
  counts.cmsProjects = arr(db,'cmsProjects').length;

  for (const row of arr(db, 'cmsTestimonials')) {
    const data = { ...row };
    delete data.id; delete data.createdAt; delete data.updatedAt;
    await upsert(client, 'cms_testimonials',
      ['id','name','company','quote','data','created_at','updated_at'],
      [textValue(row.id), textValue(row.author || row.name), nullableText(row.company),
       nullableText(row.quote), jsonValue(data),
       timestampValue(row.createdAt), timestampValue(row.updatedAt, row.createdAt)]);
  }
  counts.cmsTestimonials = arr(db,'cmsTestimonials').length;

  const settings = db.cmsSettings && typeof db.cmsSettings === 'object' ? db.cmsSettings : {};
  for (const [key, value] of Object.entries(settings)) {
    if (key === 'updatedAt') continue;
    await client.query(
      `INSERT INTO cms_settings (key,value,updated_at) VALUES ($1,$2,$3)
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=EXCLUDED.updated_at`,
      [String(key), JSON.stringify(value), timestampValue(settings.updatedAt || new Date().toISOString())]
    );
  }
  counts.cmsSettings = Object.keys(settings).filter(key => key !== 'updatedAt').length;

  const notificationSettings = db.notificationSettings || {};

  await client.query(
    `INSERT INTO notification_settings
      (id,target_email,formspree_endpoint,telegram_chat_id,is_email_active,is_telegram_active,updated_at)
      VALUES (1,$1,$2,$3,$4,$5,$6)
      ON CONFLICT (id) DO UPDATE SET target_email=EXCLUDED.target_email,
      formspree_endpoint=EXCLUDED.formspree_endpoint,
      telegram_chat_id=EXCLUDED.telegram_chat_id,
      is_email_active=EXCLUDED.is_email_active,
      is_telegram_active=EXCLUDED.is_telegram_active,
      updated_at=EXCLUDED.updated_at`,
    [nullableText(notificationSettings.targetEmail), nullableText(notificationSettings.formspreeEndpoint),
     nullableText(notificationSettings.telegramChatId),
     Boolean(notificationSettings.isEmailActive), Boolean(notificationSettings.isTelegramActive),
     timestampValue(notificationSettings.updatedAt)]
  );
  counts.notificationSettings = 1;

  const auditLogs = arr(db, 'auditLogs');
  for (let index = auditLogs.length - 1; index >= 0; index -= 1) {
    const row = auditLogs[index];
    await upsert(client, 'audit_logs',
      ['id','timestamp','action','actor','actor_role','actor_user_id','ip','user_agent','details','severity','prev_hash','hash'],
      [textValue(row.id),timestampValue(row.timestamp),textValue(row.action),textValue(row.actor),textValue(row.actorRole),
       nullableText(row.actorUserId),nullableText(row.ip),nullableText(row.userAgent),textValue(row.details),textValue(row.severity,'info'),
       nullableText(row.prevHash),nullableText(row.hash)]);
  }
  counts.auditLogs = arr(db,'auditLogs').length;

  return counts;
}

async function main(): Promise<void> {
  if (!['validate', 'import'].includes(MODE)) throw new Error('KAPITECH_MIGRATION_MODE must be validate or import.');
  if (!fs.existsSync(DB_FILE)) throw new Error('JSON database file not found: ' + DB_FILE);

  if (MODE === 'import') {
    if (process.env.KAPITECH_MIGRATION_ENV !== 'staging') {
      throw new Error('Import is locked to KAPITECH_MIGRATION_ENV=staging.');
    }
    if (process.env.KAPITECH_MIGRATION_ALLOW_WRITE !== 'true') {
      throw new Error('Import requires KAPITECH_MIGRATION_ALLOW_WRITE=true.');
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing migration writes while NODE_ENV=production.');
    }
  }

  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const db = JSON.parse(decrypt(raw)) as AnyRecord;
  assertNoDuplicateIds(db);
  assertForeignKeys(db);
  assertNestedIds(db);
  assertApprovalReferences(db);
  prepareAuditLogChain(db);

  const sourceSha256 = sha256(raw);
  const localCounts = Object.fromEntries(CORE_KEYS.map(key => [key, arr(db,key).length]));

  const pool = getPostgresPool();
  const runId = crypto.randomUUID();
  await pool.query('SELECT 1');
  await pool.query(
    'INSERT INTO migration_runs (id,source_kind,source_sha256,started_at,status,report) VALUES ($1,$2,$3,NOW(),$4,$5)',
    [runId,'encrypted-json',sourceSha256,'running',JSON.stringify({mode:MODE,localCounts})]
  );

  try {
    let importedCounts: Record<string, number> | null = null;
    let stagedPrivateDocuments: { metadata: Map<string, AnyRecord>; createdKeys: string[] } = { metadata: new Map(), createdKeys: [] };

    if (MODE === 'import') {
      stagedPrivateDocuments = await stagePrivateDocumentObjects(db);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        importedCounts = await importCore(client, db, stagedPrivateDocuments.metadata);
        await client.query('COMMIT');
        stagedPrivateDocuments.createdKeys.length = 0;
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch {}
        if (stagedPrivateDocuments.createdKeys.length > 0) {
          const storage = getDocumentStorage();
          for (const key of stagedPrivateDocuments.createdKeys) {
            try { await storage.delete(key); } catch (cleanupError) {
              console.error('[PostgreSQL import] Private object rollback cleanup failed:', cleanupError);
            }
          }
        }
        throw error;
      } finally {
        client.release();
      }
    }

    const report = {
      runId,
      mode: MODE,
      sourceSha256,
      localCounts,
      importedCounts,
      safety: {
        sourceReadOnly: true,
        productionWritesBlocked: true,
        targetOnlyRowsDeleted: false,
        secretsExcludedFromReport: true
      },
      note: MODE === 'validate'
        ? 'Validation-only. No PostgreSQL business records were written.'
        : 'Staging-only deterministic upsert. Existing target rows with matching stable IDs were updated; target-only rows were not deleted.'
    };

    await pool.query(
      'UPDATE migration_runs SET completed_at=NOW(),status=$2,report=$3 WHERE id=$1',
      [runId,'succeeded',JSON.stringify(report)]
    );
    console.log(JSON.stringify(report,null,2));
  } catch (error) {
    await pool.query(
      'UPDATE migration_runs SET completed_at=NOW(),status=$2,report=$3 WHERE id=$1',
      [runId,'failed',JSON.stringify({mode:MODE,error:error instanceof Error ? error.message : String(error)})]
    );
    throw error;
  } finally {
    await closePostgresPool();
  }
}

main().catch(error => {
  console.error('[PostgreSQL import] Failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
