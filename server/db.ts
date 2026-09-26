import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDataSourceMode } from './data-source.ts';
import { postgresAuditLogRepository } from './postgres-audit-log-repository.ts';

// Path to persistent JSON database file
const DATA_DIR = process.env.KAPITECH_DATA_DIR
  ? path.resolve(process.env.KAPITECH_DATA_DIR)
  : path.join(process.env.HOME || process.cwd(), '.kapitech-ams-data');
const DB_FILE = path.join(DATA_DIR, 'kapitech_db.json');
const DB_ENCRYPTION_PREFIX = 'KAPI-ENC-V1:';
const BACKUP_DIR = process.env.KAPITECH_DB_BACKUP_DIR
  ? path.resolve(process.env.KAPITECH_DB_BACKUP_DIR)
  : path.join(DATA_DIR, 'backups');
const DEFAULT_BACKUP_RETENTION = 14;
const BACKUP_MIN_INTERVAL_MS = 15 * 60 * 1000;
let lastAutomaticBackupAt = 0;

function getBackupRetention(): number {
  const configured = Number(process.env.KAPITECH_DB_BACKUP_RETENTION || DEFAULT_BACKUP_RETENTION);
  if (!Number.isFinite(configured)) return DEFAULT_BACKUP_RETENTION;
  return Math.min(30, Math.max(3, Math.floor(configured)));
}

function ensureBackupDirectory(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
  } else {
    try { fs.chmodSync(BACKUP_DIR, 0o700); } catch {}
  }
}

function backupFilename(timestamp = new Date()): string {
  const stamp = timestamp.toISOString().replace(/[:.]/g, '-');
  return `kapitech_db_${stamp}_${crypto.randomBytes(4).toString('hex')}.bak`;
}

function pruneDatabaseBackups(): void {
  ensureBackupDirectory();
  const retention = getBackupRetention();
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(name => /^kapitech_db_.*\.bak$/.test(name))
    .map(name => {
      const fullPath = path.join(BACKUP_DIR, name);
      let mtimeMs = 0;
      try { mtimeMs = fs.statSync(fullPath).mtimeMs; } catch {}
      return { name, fullPath, mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const backup of backups.slice(retention)) {
    try { fs.unlinkSync(backup.fullPath); } catch {}
  }
}

export function createDatabaseBackup(force = false): { createdAt: string; sizeBytes: number } | null {
  if (!fs.existsSync(DB_FILE)) return null;
  const now = Date.now();
  if (!force && now - lastAutomaticBackupAt < BACKUP_MIN_INTERVAL_MS) return null;

  ensureBackupDirectory();
  const raw = fs.readFileSync(DB_FILE);
  const finalPath = path.join(BACKUP_DIR, backupFilename(new Date(now)));
  const tempPath = `${finalPath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, raw, { mode: 0o600 });
  try { fs.chmodSync(tempPath, 0o600); } catch {}
  fs.renameSync(tempPath, finalPath);
  try { fs.chmodSync(finalPath, 0o600); } catch {}
  lastAutomaticBackupAt = now;
  pruneDatabaseBackups();
  return { createdAt: new Date(now).toISOString(), sizeBytes: raw.length };
}

export function verifyDatabaseBackupIntegrity(): { valid: boolean; checkedAt: string; latestName?: string; reason?: string } {
  const backups = listDatabaseBackups();
  const latest = backups[0];
  if (!latest) {
    return { valid: false, checkedAt: new Date().toISOString(), reason: 'No backup snapshot is available.' };
  }

  const latestPath = path.join(BACKUP_DIR, latest.name);
  try {
    const raw = fs.readFileSync(latestPath, 'utf8');
    const plaintext = raw.startsWith(DB_ENCRYPTION_PREFIX)
      ? decryptDatabase(raw)
      : raw;
    const parsed = JSON.parse(plaintext);
    const validSchema =
      parsed &&
      Array.isArray(parsed.users) &&
      Array.isArray(parsed.sessions) &&
      Array.isArray(parsed.projects) &&
      Array.isArray(parsed.invoices) &&
      Array.isArray(parsed.auditLogs);

    if (!validSchema) {
      return {
        valid: false,
        checkedAt: new Date().toISOString(),
        latestName: latest.name,
        reason: 'Latest backup does not contain the expected AMS database structure.'
      };
    }

    return {
      valid: true,
      checkedAt: new Date().toISOString(),
      latestName: latest.name
    };
  } catch (error) {
    return {
      valid: false,
      checkedAt: new Date().toISOString(),
      latestName: latest.name,
      reason: error instanceof Error ? error.message : 'Backup integrity verification failed.'
    };
  }
}

export function listDatabaseBackups(): Array<{ name: string; createdAt: string; sizeBytes: number }> {
  ensureBackupDirectory();
  return fs.readdirSync(BACKUP_DIR)
    .filter(name => /^kapitech_db_.*\.bak$/.test(name))
    .map(name => {
      const fullPath = path.join(BACKUP_DIR, name);
      const stat = fs.statSync(fullPath);
      return { name, createdAt: stat.mtime.toISOString(), sizeBytes: stat.size };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function getDataEncryptionKey(): Buffer | null {
  const raw = process.env.KAPITECH_DATA_ENCRYPTION_KEY?.trim();
  if (!raw) return null;

  const key = /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');

  if (key.length !== 32) {
    throw new Error('KAPITECH_DATA_ENCRYPTION_KEY must be exactly 32 bytes as 64 hex characters or base64.');
  }

  return key;
}

export function isDataEncryptionEnabled(): boolean {
  return Boolean(getDataEncryptionKey());
}

function encryptDatabase(db: DatabaseSchema): string {
  const key = getDataEncryptionKey();
  if (!key) return JSON.stringify(db, null, 2);

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(db), 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return DB_ENCRYPTION_PREFIX + JSON.stringify({
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    data: encrypted.toString('base64')
  });
}

function decryptDatabase(raw: string): string {
  if (!raw.startsWith(DB_ENCRYPTION_PREFIX)) return raw;

  const key = getDataEncryptionKey();
  if (!key) {
    throw new Error('Database encryption is enabled but KAPITECH_DATA_ENCRYPTION_KEY is not configured.');
  }

  const payload = JSON.parse(raw.slice(DB_ENCRYPTION_PREFIX.length));
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const encrypted = Buffer.from(payload.data, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8');
}

// Ensure the persistence directory exists with owner-only permissions where supported.
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
} else {
  try { fs.chmodSync(DATA_DIR, 0o700); } catch {}
}

export interface StoredUser {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  passwordAlgorithm?: 'scrypt-v1' | 'pbkdf2-sha512';
  role: string;
  stakeholderType: 'Executive' | 'IT_Technical' | 'Project_Manager' | 'Operations' | 'Master';
  permissions: {
    canViewFinancials: boolean;
    canManageInvoices: boolean;
    canApproveBudgets: boolean;
    canManageCrm: boolean;
    canManageProjects: boolean;
    canManageKanbanTasks: boolean;
    canManageClients: boolean;
    canManageVendors: boolean;
    canManageCmsContent: boolean;
    canAccessServerAndApi: boolean;
    canRunDataMigration: boolean;
    canViewSecurityAuditLogs: boolean;
    canManageAdminAccounts: boolean;
  };
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaPendingSecret?: string;
  mfaPendingSecretCreatedAt?: string;
  mfaRecoveryCodeHashes?: string[];
  division: 'Management' | 'Engineering' | 'Design' | 'Finance' | 'Operations';
  status: 'active' | 'suspended';
  lastLogin: string;
  createdAt: string;
}

export interface StoredSession {
  tokenHash: string;
  userId: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: number;
  rememberMe: boolean;
  ip: string;
  userAgent: string;
  kind?: 'session' | 'mfa';
  mfaFailedAttempts?: number;
  // Legacy field retained only for one-time migration from older deployments.
  token?: string;
}


export interface StoredAuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  actorRole: string;
  ip: string;
  userAgent: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  prevHash?: string;
  hash?: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  sessions: StoredSession[];
  leads: any[];
  crmDeals: any[];
  proposals: any[];
  clients: any[];
  projects: any[];
  tasks: any[];
  timeLogs: any[];
  invoices: any[];
  expenses: any[];
  approvals: any[];
  vendors: any[];
  documents: any[];
  notifications: any[];
  cmsServices: any[];
  cmsProjects: any[];
  cmsTestimonials: any[];
  cmsSettings: Record<string, any>;
  auditLogs: StoredAuditLog[];
  notificationSettings: {
    targetEmail: string;
    formspreeEndpoint: string;
    telegramBotToken: string;
    telegramChatId: string;
    isEmailActive: boolean;
    isTelegramActive: boolean;
    updatedAt: string;
  };
}

function computeAuditLogHash(log: Omit<StoredAuditLog, 'hash'>): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(log))
    .digest('hex');
}

function migrateLegacyAuditLogChain(db: DatabaseSchema): boolean {
  if (!Array.isArray(db.auditLogs) || db.auditLogs.length === 0) return false;

  // Only reconstruct genuinely legacy records when the entire chain predates
  // hash fields. Once any hash exists, a mismatch is treated as tampering or
  // corruption and must never be silently rewritten during startup.
  const isLegacy = db.auditLogs.every(log => !log.hash && !log.prevHash);
  if (!isLegacy) return false;

  let previousHash = 'GENESIS';
  for (let index = db.auditLogs.length - 1; index >= 0; index -= 1) {
    const log = db.auditLogs[index];
    const normalized = {
      id: log.id,
      timestamp: log.timestamp,
      action: log.action,
      actor: log.actor,
      actorRole: log.actorRole,
      ip: log.ip,
      userAgent: log.userAgent,
      details: log.details,
      severity: log.severity,
      prevHash: previousHash
    };
    log.prevHash = normalized.prevHash;
    log.hash = computeAuditLogHash(normalized);
    previousHash = log.hash;
  }
  return true;
}

export function verifyAuditLogChain(db: DatabaseSchema): { valid: boolean; checked: number; brokenAt?: string } {
  if (!Array.isArray(db.auditLogs) || db.auditLogs.length === 0) {
    return { valid: true, checked: 0 };
  }

  let previousHash = 'GENESIS';
  let checked = 0;

  for (let index = db.auditLogs.length - 1; index >= 0; index -= 1) {
    const log = db.auditLogs[index];
    const normalized = {
      id: log.id,
      timestamp: log.timestamp,
      action: log.action,
      actor: log.actor,
      actorRole: log.actorRole,
      ip: log.ip,
      userAgent: log.userAgent,
      details: log.details,
      severity: log.severity,
      prevHash: log.prevHash || previousHash
    };
    const expectedHash = computeAuditLogHash(normalized);
    checked += 1;
    if (log.prevHash !== normalized.prevHash || log.hash !== expectedHash) {
      return { valid: false, checked, brokenAt: log.id };
    }
    previousHash = expectedHash;
  }

  return { valid: true, checked };
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function hashPassword(
  password: string,
  salt: string,
  algorithm: 'scrypt-v1' | 'pbkdf2-sha512' = 'pbkdf2-sha512'
): string {
  if (algorithm === 'scrypt-v1') {
    return crypto.scryptSync(String(password), salt, 64, {
      N: 32768,
      r: 8,
      p: 1,
      maxmem: 64 * 1024 * 1024
    }).toString('hex');
  }

  return crypto.pbkdf2Sync(String(password), salt, 220000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, user: StoredUser): boolean {
  const algorithm = user.passwordAlgorithm || 'pbkdf2-sha512';
  const computed = hashPassword(password, user.salt, algorithm);
  return timingSafeEqualHex(computed, user.passwordHash);
}

// Initial seed accounts
function getInitialSeedData(): DatabaseSchema {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminSalt = generateSalt();
  

  const initialAdminUsername = process.env.ADMIN_INITIAL_USERNAME || (isProduction ? '' : 'admin');
  const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD || (isProduction ? '' : 'dev-only-change-me');
  const initialAdminEmail = process.env.ADMIN_INITIAL_EMAIL || (isProduction ? '' : 'admin@localhost');

  if (isProduction && !initialAdminPassword) {
    throw new Error('ADMIN_INITIAL_PASSWORD must be configured in production before the database is initialized.');
  }

  const seed: DatabaseSchema = {
    users: [
      {
        id: 'usr_root_admin',
        name: 'Executive Master Admin',
        username: initialAdminUsername,
        email: initialAdminEmail,
        passwordHash: hashPassword(initialAdminPassword, adminSalt, 'scrypt-v1'),
        salt: adminSalt,
        passwordAlgorithm: 'scrypt-v1',
        role: 'Tier 1: Top Management / Sponsor',
        stakeholderType: 'Master',
        permissions: {
          canViewFinancials: true,
          canManageInvoices: true,
          canApproveBudgets: true,
          canManageCrm: true,
          canManageProjects: true,
          canManageKanbanTasks: true,
          canManageClients: true,
          canManageVendors: true,
          canManageCmsContent: true,
          canAccessServerAndApi: true,
          canRunDataMigration: true,
          canViewSecurityAuditLogs: true,
          canManageAdminAccounts: true
        },
        mfaEnabled: false,
        division: 'Management',
        status: 'active',
        lastLogin: '',
        createdAt: '2025-01-01T00:00:00.000Z'
      }
    ],
    sessions: [],
    leads: [
      {
        id: 'lead_inb_001',
        fullName: 'Bambang Soediro',
        email: 'bambang.soediro@pertamina-digital.id',
        phone: '+62 811-9876-5432',
        company: 'PT Pertamina Digital Hub',
        serviceCategory: 'Cloud & AI Architecture',
        budgetRange: 'IDR 500M - 1B',
        projectTimeline: 'Q4 2026',
        message: 'Requesting enterprise proposal for IoT telemetry processing backend on GCP with real-time analytics.',
        source: 'Website Contact Form',
        status: 'new',
        createdAt: '2026-09-18T10:30:00.000Z',
        updatedAt: '2026-09-18T10:30:00.000Z'
      },
      {
        id: 'lead_inb_002',
        fullName: 'Clarissa Wijaya',
        email: 'c.wijaya@traveloka-partners.com',
        phone: '+62 812-4455-6677',
        company: 'Traveloka Lifestyle Division',
        serviceCategory: '3D WebGL Brand Experience',
        budgetRange: 'IDR 250M - 500M',
        projectTimeline: 'Immediate',
        message: 'Looking to build an interactive 3D holiday destination visualizer for high-intent booking conversions.',
        source: 'Inbound Inquiry',
        status: 'in_review',
        createdAt: '2026-09-16T14:15:00.000Z',
        updatedAt: '2026-09-17T09:00:00.000Z'
      }
    ],
    crmDeals: [
      {
        id: 'deal_101',
        title: 'BCA Wealth Microservices Architecture',
        clientName: 'Reza Pratama',
        company: 'Bank Central Asia (BCA Digital)',
        email: 'reza.pratama@bcadigital.co.id',
        phone: '+62 812-3344-5566',
        servicePillar: 'AI & Cloud Solutions',
        value: 380000000,
        stage: 'negotiation',
        priority: 'urgent',
        probability: 0.8,
        owner: 'Executive Partner',
        expectedCloseDate: '2026-09-30',
        createdAt: '2026-08-25T10:00:00.000Z',
        updatedAt: '2026-09-12T14:30:00.000Z'
      },
      {
        id: 'deal_102',
        title: 'Alam Sutera 3D WebGL Virtual Tour',
        clientName: 'Dian Sastro',
        company: 'Alam Sutera Realty & Urban Space',
        email: 'dian.sastro@alamsutera.com',
        phone: '+62 813-8899-0011',
        servicePillar: 'UI/UX Design',
        value: 195000000,
        stage: 'proposal',
        priority: 'high',
        probability: 0.6,
        owner: 'Project Operations Lead',
        expectedCloseDate: '2026-10-15',
        createdAt: '2026-09-02T09:00:00.000Z',
        updatedAt: '2026-09-10T11:00:00.000Z'
      },
      {
        id: 'deal_103',
        title: 'FinTech Multi-Currency Settlement Engine',
        clientName: 'Michael Chen',
        company: 'FinTech Pacific Singapore',
        email: 'm.chen@pacificfin.sg',
        phone: '+65 9123-4567',
        servicePillar: 'Web Development',
        value: 320000000,
        stage: 'contacted',
        priority: 'high',
        probability: 0.3,
        owner: 'Executive Partner',
        expectedCloseDate: '2026-10-30',
        createdAt: '2026-09-05T08:30:00.000Z',
        updatedAt: '2026-09-08T15:00:00.000Z'
      },
      {
        id: 'deal_104',
        title: 'Logistik Nusantara Fleet Geolocation Cluster',
        clientName: 'Rian Hidayat',
        company: 'Logistik Nusantara Decacorn',
        email: 'rian@logistiknusantara.id',
        phone: '+62 817-6655-4433',
        servicePillar: 'Digital Product MVP',
        value: 145000000,
        stage: 'lead',
        priority: 'medium',
        probability: 0.1,
        owner: 'Project Operations Lead',
        expectedCloseDate: '2026-11-10',
        createdAt: '2026-09-14T09:00:00.000Z',
        updatedAt: '2026-09-14T09:15:00.000Z'
      },
      {
        id: 'deal_105',
        title: 'Astra Digital Ventura Microservices Sprint',
        clientName: 'Budi Santoso',
        company: 'PT Astra Digital Ventura',
        email: 'budi.santoso@astradigital.id',
        phone: '+62 812-9988-7711',
        servicePillar: 'Web Development',
        value: 183150000,
        stage: 'won',
        priority: 'high',
        probability: 1.0,
        owner: 'Executive Partner',
        expectedCloseDate: '2026-08-01',
        createdAt: '2026-07-20T08:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z'
      }
    ],
    proposals: [
      {
        id: 'prop_2026_001',
        proposalNumber: 'PROP-KAPI-2026-1048',
        title: '3D WebGL Virtual Tour & Township Unit Configurator',
        clientName: 'Dian Sastro',
        company: 'Alam Sutera Realty & Urban Space',
        dealId: 'deal_102',
        projectId: 'proj_102',
        items: [
          { id: 'item_p1', description: 'Interactive 3D WebGL Architectural Environment', quantity: 1, unitPrice: 120000000 },
          { id: 'item_p2', description: 'Real-Time Unit Selection & Balcony View Configurator', quantity: 1, unitPrice: 60000000 }
        ],
        subtotal: 180000000,
        discount: 5000000,
        taxPercent: 11,
        tax: 19250000,
        total: 194250000,
        currency: 'IDR',
        validityPeriod: '30 Days',
        paymentTerms: '50% Upfront, 50% on Delivery',
        owner: 'Executive Partner',
        status: 'Sent',
        notes: 'Includes high-definition asset optimization for mobile devices.',
        createdDate: '2026-09-03',
        sentDate: '2026-09-04',
        approvedDate: null,
        createdAt: '2026-09-03T10:00:00.000Z',
        updatedAt: '2026-09-04T11:00:00.000Z'
      },
      {
        id: 'prop_2026_002',
        proposalNumber: 'PROP-KAPI-2026-1049',
        title: 'Cloud Microservices & High-Security Auth Flow',
        clientName: 'Reza Pratama',
        company: 'Bank Central Asia (BCA Digital)',
        dealId: 'deal_101',
        projectId: 'proj_101',
        items: [
          { id: 'item_p3', description: 'Distributed Microservices Architecture Blueprint', quantity: 1, unitPrice: 180000000 },
          { id: 'item_p4', description: 'Zero-Trust PBKDF2 Multi-Factor Auth Vault', quantity: 1, unitPrice: 165000000 }
        ],
        subtotal: 345000000,
        discount: 0,
        taxPercent: 11,
        tax: 37950000,
        total: 382950000,
        currency: 'IDR',
        validityPeriod: '45 Days',
        paymentTerms: '30% Kickoff, 40% Staging, 30% Final Signoff',
        owner: 'Executive Partner',
        status: 'Internal Review',
        notes: 'Compliance reviewed by enterprise legal team.',
        createdDate: '2026-09-10',
        sentDate: null,
        approvedDate: null,
        createdAt: '2026-09-10T14:00:00.000Z',
        updatedAt: '2026-09-12T09:00:00.000Z'
      }
    ],
    clients: [
      {
        id: 'cli_101',
        name: 'Budi Santoso',
        company: 'PT Astra Digital Ventura',
        email: 'budi.santoso@astradigital.id',
        phone: '+62 812-9988-7711',
        website: 'https://astradigital.id',
        location: 'Jakarta Selatan, Indonesia',
        industry: 'Enterprise Technology & Mobility',
        status: 'active',
        totalSpend: 183150000,
        projectsCount: 2,
        contactPersonRole: 'Head of Digital Engineering',
        notes: 'Key enterprise account. Currently deploying microservices and React architecture.',
        slaDailyAdSpendBudget: 15000000,
        currentDailyAdSpend: 11200000,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-14T14:15:00.000Z'
      },
      {
        id: 'cli_102',
        name: 'Sarah Jenkins',
        company: 'Telkomsel Innovation Labs',
        email: 's.jenkins@telkomsel.co.id',
        phone: '+62 811-2233-4455',
        website: 'https://telkomsel.com/innovation',
        location: 'Bandung, Indonesia',
        industry: 'Telecommunications & Cloud',
        status: 'active',
        totalSpend: 126540000,
        projectsCount: 1,
        contactPersonRole: 'VP Product Innovation',
        notes: '3D WebGL Brand Experience & Interactive Design System showcase.',
        slaDailyAdSpendBudget: 10000000,
        currentDailyAdSpend: 8400000,
        createdAt: '2026-08-10T09:00:00.000Z',
        updatedAt: '2026-09-02T10:00:00.000Z'
      },
      {
        id: 'cli_103',
        name: 'Reza Pratama',
        company: 'Bank Central Asia (BCA Digital)',
        email: 'reza.pratama@bcadigital.co.id',
        phone: '+62 812-3344-5566',
        website: 'https://bcadigital.co.id',
        location: 'Jakarta Pusat, Indonesia',
        industry: 'Banking & Financial Technology',
        status: 'active',
        totalSpend: 380000000,
        projectsCount: 1,
        contactPersonRole: 'Head of Core Systems Architecture',
        notes: 'Strategic banking partner. High security SLA with quarterly audit requirements.',
        createdAt: '2026-08-20T08:00:00.000Z',
        updatedAt: '2026-09-15T12:00:00.000Z'
      }
    ],
    projects: [
      {
        id: 'proj_101',
        title: 'BCA Wealth Microservices Architecture',
        name: 'BCA Wealth Microservices Architecture',
        client: 'Bank Central Asia (BCA Digital)',
        clientName: 'Reza Pratama',
        clientCompany: 'Bank Central Asia (BCA Digital)',
        clientEmail: 'reza.pratama@bcadigital.co.id',
        serviceCategory: 'AI & Cloud Solutions',
        status: 'In Progress',
        health: 'Good',
        budget: 380000000,
        progressPercent: 65,
        startDate: '2026-08-15',
        targetEndDate: '2026-10-30',
        teamLead: 'Project Operations Lead',
        teamMembers: ['Senior Frontend Dev', 'Cloud DevOps Lead', 'Security Architect'],
        techStack: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'GCP'],
        createdAt: '2026-08-15T08:00:00.000Z',
        updatedAt: '2026-09-15T14:00:00.000Z'
      },
      {
        id: 'proj_102',
        title: 'Alam Sutera 3D WebGL Virtual Tour',
        name: 'Alam Sutera 3D WebGL Virtual Tour',
        client: 'Alam Sutera Realty & Urban Space',
        clientName: 'Dian Sastro',
        clientCompany: 'Alam Sutera Realty & Urban Space',
        clientEmail: 'dian.sastro@alamsutera.com',
        serviceCategory: 'UI/UX Design',
        status: 'In Progress',
        health: 'At Risk',
        budget: 195000000,
        progressPercent: 45,
        startDate: '2026-09-01',
        targetEndDate: '2026-11-15',
        teamLead: 'Creative Director',
        teamMembers: ['3D WebGL Specialist', 'Senior Frontend Dev'],
        techStack: ['Three.js', 'React', 'Tailwind CSS', 'Vite'],
        createdAt: '2026-09-01T09:00:00.000Z',
        updatedAt: '2026-09-15T10:00:00.000Z'
      },
      {
        id: 'proj_103',
        title: 'Astra Digital Ventura Microservices Sprint',
        name: 'Astra Digital Ventura Microservices Sprint',
        client: 'PT Astra Digital Ventura',
        clientName: 'Budi Santoso',
        clientCompany: 'PT Astra Digital Ventura',
        clientEmail: 'budi.santoso@astradigital.id',
        serviceCategory: 'Web Development',
        status: 'Completed',
        health: 'Good',
        budget: 183150000,
        progressPercent: 100,
        startDate: '2026-07-01',
        targetEndDate: '2026-08-30',
        teamLead: 'Lead Full-Stack Tech',
        teamMembers: ['Lead Full-Stack Tech', 'Senior Frontend Dev'],
        techStack: ['React', 'Express', 'Tailwind CSS', 'Vite'],
        createdAt: '2026-07-01T08:00:00.000Z',
        updatedAt: '2026-08-30T16:00:00.000Z'
      }
    ],
    tasks: [
      {
        id: 'task_101',
        title: 'Implement Multi-Factor Biometric JWT Vault',
        projectId: 'proj_101',
        projectName: 'BCA Wealth Microservices Architecture',
        assignee: 'Security Architect',
        reporter: 'Project Operations Lead',
        priority: 'urgent',
        status: 'done',
        dueDate: '2026-09-10',
        estimatedHours: 16,
        actualHours: 14,
        createdAt: '2026-08-20T10:00:00.000Z',
        updatedAt: '2026-09-10T15:00:00.000Z'
      },
      {
        id: 'task_102',
        title: 'Build Distributed Transaction Ledger Cache',
        projectId: 'proj_101',
        projectName: 'BCA Wealth Microservices Architecture',
        assignee: 'Cloud DevOps Lead',
        reporter: 'Project Operations Lead',
        priority: 'high',
        status: 'in_progress',
        dueDate: '2026-09-25',
        estimatedHours: 24,
        actualHours: 12,
        createdAt: '2026-08-28T09:00:00.000Z',
        updatedAt: '2026-09-15T11:00:00.000Z'
      },
      {
        id: 'task_103',
        title: 'GLTF Mesh Compression & LOD Pipeline',
        projectId: 'proj_102',
        projectName: 'Alam Sutera 3D WebGL Virtual Tour',
        assignee: '3D WebGL Specialist',
        reporter: 'Creative Director',
        priority: 'urgent',
        status: 'done',
        dueDate: '2026-09-15',
        estimatedHours: 20,
        actualHours: 18,
        createdAt: '2026-09-02T10:00:00.000Z',
        updatedAt: '2026-09-15T09:00:00.000Z'
      },
      {
        id: 'task_104',
        title: 'Interactive Unit Floorplan Configurator',
        projectId: 'proj_102',
        projectName: 'Alam Sutera 3D WebGL Virtual Tour',
        assignee: 'Senior Frontend Dev',
        reporter: 'Creative Director',
        priority: 'high',
        status: 'in_progress',
        dueDate: '2026-09-18', // overdue relative to today
        estimatedHours: 30,
        actualHours: 22,
        createdAt: '2026-09-05T09:30:00.000Z',
        updatedAt: '2026-09-18T10:00:00.000Z'
      }
    ],
    timeLogs: [
      {
        id: 'tl_01',
        projectId: 'proj_101',
        projectName: 'BCA Wealth Microservices Architecture',
        taskId: 'task_101',
        taskTitle: 'Implement Multi-Factor Biometric JWT Vault',
        user: 'Security Architect',
        durationMinutes: 420,
        billable: true,
        date: '2026-09-09',
        notes: 'Refactored cryptographic hashing algorithm to comply with BCA specifications.',
        createdAt: '2026-09-09T17:00:00.000Z'
      }
    ],
    invoices: [
      {
        id: 'inv_101',
        invoiceNumber: 'KAPI-INV-2026-001',
        type: 'invoice',
        clientName: 'Budi Santoso',
        clientCompany: 'PT Astra Digital Ventura',
        clientEmail: 'budi.santoso@astradigital.id',
        clientPhone: '+62 812-9988-7711',
        items: [
          {
            id: 'item_1',
            description: 'Enterprise React & Node.js Microservices Architecture Implementation',
            quantity: 1,
            unitPrice: 165000000,
            amount: 165000000
          }
        ],
        subtotal: 165000000,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: 11,
        taxAmount: 18150000,
        total: 183150000,
        amountPaid: 183150000,
        balanceDue: 0,
        payments: [
          { id: 'pay_1', amount: 183150000, date: '2026-08-14', method: 'Bank Transfer Net 14', reference: 'BCA-VA-990182' }
        ],
        currency: 'IDR',
        status: 'paid',
        issueDate: '2026-08-01',
        dueDate: '2026-08-15',
        paidDate: '2026-08-14',
        notes: 'Sprint 1 & Sprint 2 deliverable sign-off settlement.',
        paymentTerms: 'Bank Transfer Net 14',
        createdAt: '2026-08-01T09:00:00.000Z',
        updatedAt: '2026-08-14T14:15:00.000Z'
      },
      {
        id: 'inv_102',
        invoiceNumber: 'KAPI-INV-2026-002',
        type: 'invoice',
        clientName: 'Sarah Jenkins',
        clientCompany: 'Telkomsel Innovation Labs',
        clientEmail: 's.jenkins@telkomsel.co.id',
        clientPhone: '+62 811-2233-4455',
        items: [
          {
            id: 'item_2',
            description: '3D WebGL Brand Experience & Interactive Design System',
            quantity: 1,
            unitPrice: 120000000,
            amount: 120000000
          }
        ],
        subtotal: 120000000,
        discountPercent: 5,
        discountAmount: 6000000,
        taxPercent: 11,
        taxAmount: 12540000,
        total: 126540000,
        amountPaid: 126540000,
        balanceDue: 0,
        payments: [
          { id: 'pay_2', amount: 126540000, date: '2026-08-30', method: 'Mandiri Corporate', reference: 'MNDR-99381' }
        ],
        currency: 'IDR',
        status: 'paid',
        issueDate: '2026-08-18',
        dueDate: '2026-09-01',
        paidDate: '2026-08-30',
        notes: 'Phase 1 Interactive showcase release milestone.',
        paymentTerms: 'Bank Transfer Net 14',
        createdAt: '2026-08-18T11:00:00.000Z',
        updatedAt: '2026-08-30T16:00:00.000Z'
      },
      {
        id: 'inv_103',
        invoiceNumber: 'KAPI-INV-2026-003',
        type: 'invoice',
        clientName: 'Reza Pratama',
        clientCompany: 'Bank Central Asia (BCA Digital)',
        clientEmail: 'reza.pratama@bcadigital.co.id',
        clientPhone: '+62 812-3344-5566',
        items: [
          {
            id: 'item_3',
            description: 'Zero-Trust Internal Portal & RBAC Security Infrastructure (Milestone 1)',
            quantity: 1,
            unitPrice: 180000000,
            amount: 180000000
          }
        ],
        subtotal: 180000000,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: 11,
        taxAmount: 19800000,
        total: 199800000,
        amountPaid: 0,
        balanceDue: 199800000,
        payments: [],
        currency: 'IDR',
        status: 'approved',
        issueDate: '2026-09-02',
        dueDate: '2026-09-28',
        notes: 'Final UAT signed. Invoice authorized and sent for AP processing.',
        paymentTerms: 'Bank Transfer Net 21',
        createdAt: '2026-09-02T13:00:00.000Z',
        updatedAt: '2026-09-04T09:45:00.000Z'
      },
      {
        id: 'inv_104',
        invoiceNumber: 'KAPI-INV-2026-004',
        type: 'invoice',
        clientName: 'Dian Sastro',
        clientCompany: 'Alam Sutera Realty & Urban Space',
        clientEmail: 'dian.sastro@alamsutera.com',
        clientPhone: '+62 813-8899-0011',
        items: [
          {
            id: 'item_4',
            description: '3D CAD Model Optimization & Texturing Milestone',
            quantity: 1,
            unitPrice: 80000000,
            amount: 80000000
          }
        ],
        subtotal: 80000000,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: 11,
        taxAmount: 8800000,
        total: 88800000,
        amountPaid: 0,
        balanceDue: 88800000,
        payments: [],
        currency: 'IDR',
        status: 'overdue',
        issueDate: '2026-08-15',
        dueDate: '2026-09-01',
        notes: 'Second payment reminder issued to client accounting.',
        paymentTerms: 'Bank Transfer Net 14',
        createdAt: '2026-08-15T10:00:00.000Z',
        updatedAt: '2026-09-10T10:00:00.000Z'
      }
    ],
    expenses: [
      {
        id: 'exp_201',
        type: 'OpEx',
        category: 'Software & Cloud',
        description: 'GCP Cloud Run, Artifact Registry & Vertex AI Infrastructure',
        amount: 14500000,
        date: '2026-09-01',
        recurringInterval: 'monthly',
        recordedBy: 'Cloud DevOps Lead',
        createdAt: '2026-09-01T08:00:00.000Z'
      },
      {
        id: 'exp_202',
        type: 'OpEx',
        category: 'Salaries & Contractors',
        description: 'Senior Frontend & 3D WebGL Specialist Contractor Retainer',
        amount: 38000000,
        date: '2026-09-05',
        recurringInterval: 'monthly',
        recordedBy: 'Managing Partner',
        createdAt: '2026-09-05T09:00:00.000Z'
      },
      {
        id: 'exp_203',
        type: 'Rentals',
        category: 'Office & Rentals',
        description: 'Kapitech HQ Studio Rental & Coworking Hub (Sudirman, Jakarta)',
        amount: 22000000,
        date: '2026-09-02',
        recurringInterval: 'monthly',
        recordedBy: 'Operations Staff',
        createdAt: '2026-09-02T10:00:00.000Z'
      },
      {
        id: 'exp_204',
        type: 'CapEx',
        category: 'CapEx Equipment',
        description: 'Apple Silicon M3 Max Workstations for 3D Render Team',
        amount: 46000000,
        date: '2026-08-15',
        recurringInterval: 'none',
        recordedBy: 'Managing Partner',
        createdAt: '2026-08-15T11:00:00.000Z'
      },
      {
        id: 'exp_205',
        type: 'OpEx',
        category: 'Marketing & Ads',
        description: 'B2B Enterprise Client Acquisition & Showcase Campaign',
        amount: 8500000,
        date: '2026-08-25',
        recurringInterval: 'monthly',
        recordedBy: 'Growth Manager',
        createdAt: '2026-08-25T14:00:00.000Z'
      }
    ],
    approvals: [
      {
        id: 'appr_001',
        type: 'Budget',
        referenceId: 'exp_204',
        title: 'CapEx Approval: High-Performance GPU Workstations for 3D Studio',
        requester: 'Creative Director',
        requesterRole: 'Tier 2: Project Manager (PM)',
        value: 46000000,
        date: '2026-09-18',
        reason: 'Accelerates WebGL render pipelines by 4x for the upcoming township release.',
        riskLevel: 'Medium',
        status: 'Pending',
        createdAt: '2026-09-18T11:00:00.000Z'
      },
      {
        id: 'appr_002',
        type: 'Invoice Discount',
        referenceId: 'prop_2026_001',
        title: 'Alam Sutera Strategic Retainer 5% Volume Discount',
        requester: 'Executive Partner',
        requesterRole: 'Stakeholder Executive',
        value: 5000000,
        date: '2026-09-17',
        reason: 'Secures 12-month exclusive digital maintenance agreement.',
        riskLevel: 'Low',
        status: 'Pending',
        createdAt: '2026-09-17T15:30:00.000Z'
      }
    ],
    vendors: [
      {
        id: 'ven_001',
        name: 'Google Cloud Platform (PT Google Indonesia)',
        category: 'Cloud Hosting & APIs',
        contactPerson: 'Enterprise Support Desk',
        email: 'billing@google.com',
        phone: '+62 21-2970-7600',
        paymentTerms: 'Credit Card Monthly',
        status: 'active',
        monthlySpend: 14500000,
        notes: 'Primary container hosting on Cloud Run and Artifact Registry.',
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'ven_002',
        name: 'Figma Inc.',
        category: 'Design Tools',
        contactPerson: 'Enterprise Account Manager',
        email: 'sales@figma.com',
        phone: '+1 800-figma',
        paymentTerms: 'Annual Enterprise Billing',
        status: 'active',
        monthlySpend: 3200000,
        notes: 'Design tokens and collaborative canvas for client reviews.',
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    ],
    documents: [
      {
        id: 'doc_001',
        name: 'Kapitech_BCA_Master_Services_Agreement_2026.pdf',
        type: 'PDF',
        size: '2.4 MB',
        category: 'Contract',
        relatedEntity: 'Bank Central Asia (BCA Digital)',
        relatedId: 'cli_103',
        owner: 'Executive Master Admin',
        url: '#',
        uploadedDate: '2026-08-20',
        createdAt: '2026-08-20T10:00:00.000Z'
      },
      {
        id: 'doc_002',
        name: 'Kapitech_Security_Architecture_Whitepaper_v2.pdf',
        type: 'PDF',
        size: '4.1 MB',
        category: 'Technical Specification',
        relatedEntity: 'General',
        relatedId: '',
        owner: 'Project Operations Lead',
        url: '#',
        uploadedDate: '2026-09-01',
        createdAt: '2026-09-01T08:00:00.000Z'
      }
    ],
    notifications: [
      {
        id: 'notif_001',
        title: 'New High-Value Lead Received',
        message: 'PT Pertamina Digital Hub submitted an inquiry for Cloud & AI Architecture.',
        type: 'lead',
        severity: 'info',
        read: false,
        linkUrl: '/admin/inbox',
        timestamp: '2026-09-18T10:30:00.000Z'
      },
      {
        id: 'notif_002',
        title: 'Invoice KAPI-INV-2026-004 Overdue',
        message: 'Invoice for Alam Sutera (IDR 88,800,000) is past its Net 14 due date.',
        type: 'finance',
        severity: 'danger',
        read: false,
        linkUrl: '/admin/invoicing',
        timestamp: '2026-09-17T09:00:00.000Z'
      },
      {
        id: 'notif_003',
        title: 'Pending Executive Budget Review',
        message: 'CapEx Request for 3D GPU Workstations requires your approval.',
        type: 'approval',
        severity: 'warning',
        read: false,
        linkUrl: '/admin/approvals',
        timestamp: '2026-09-18T11:00:00.000Z'
      }
    ],
    cmsServices: [],
    cmsProjects: [],
    cmsTestimonials: [],
    cmsSettings: {
      siteTitle: 'Kapitech Agency | High-Performance Digital Solutions',
      siteDescription: 'Premier digital product engineering agency in Indonesia.',
      contactReceiverEmail: 'kapitechagency@gmail.com',
      defaultLanguage: 'en',
      enableLiveChat: true,
      enableSoundAlerts: true,
      maintenanceMode: false
    },
    auditLogs: [
      {
        id: 'log_seed_init',
        timestamp: new Date().toISOString(),
        action: 'SYSTEM_BOOTSTRAP',
        actor: 'system',
        actorRole: 'Master',
        ip: '127.0.0.1',
        userAgent: 'Internal Init',
        details: 'Initialized secure persistent database storage.',
        severity: 'info'
      }
    ],
    notificationSettings: {
      targetEmail: 'kapitechagency@gmail.com',
      formspreeEndpoint: '',
      telegramBotToken: '',
      telegramChatId: '',
      isEmailActive: true,
      isTelegramActive: false,
      updatedAt: new Date().toISOString()
    }
  };

  if (isProduction) {
    seed.users = seed.users
      .filter((user) => user.id === 'usr_root_admin')
      .map((user) => ({ ...user, lastLogin: '', mfaEnabled: false }));

    for (const key of [
      'leads',
      'crmDeals',
      'proposals',
      'clients',
      'projects',
      'tasks',
      'timeLogs',
      'invoices',
      'expenses',
      'approvals',
      'vendors',
      'documents',
      'notifications',
      'cmsServices',
      'cmsProjects',
      'cmsTestimonials',
      'auditLogs'
    ] as Array<keyof DatabaseSchema>) {
      (seed as any)[key] = [];
    }
  }

  return seed;
}

let inMemoryDb: DatabaseSchema | null = null;
let lastPersistedFileFingerprint: string | null = null;

function fingerprintDatabaseFile(raw: string): string {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

function readDatabaseFileFingerprint(): string | null {
  if (!fs.existsSync(DB_FILE)) return null;
  return fingerprintDatabaseFile(fs.readFileSync(DB_FILE, 'utf8'));
}

export function getDatabase(): DatabaseSchema {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  if (process.env.NODE_ENV === 'production' && !isDataEncryptionEnabled()) {
    throw new Error(
      'Production persistent storage requires KAPITECH_DATA_ENCRYPTION_KEY. Configure a 32-byte key before starting AMS.'
    );
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const rawFile = fs.readFileSync(DB_FILE, 'utf-8');
      lastPersistedFileFingerprint = fingerprintDatabaseFile(rawFile);
      const raw = decryptDatabase(rawFile);
      inMemoryDb = JSON.parse(raw);

      // Migrate legacy password/session records in-memory before the database is returned.
      if (inMemoryDb) {
        let migrationChanged = false;

        // Bootstrap recovery: the original production seed used ADMIN_INITIAL_PASSWORD.
        // Legacy root accounts still using PBKDF2 can be synchronized from that
        // configured secret, then immediately upgraded to the current scrypt format.
        // Accounts already migrated to scrypt are never overwritten by this path.
        const bootstrapPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim();
        const bootstrapUsername = process.env.ADMIN_INITIAL_USERNAME?.trim().toLowerCase();
        const bootstrapEmail = process.env.ADMIN_INITIAL_EMAIL?.trim().toLowerCase();

        for (const user of inMemoryDb.users || []) {
          if (!user.passwordAlgorithm) {
            user.passwordAlgorithm = 'pbkdf2-sha512';
            migrationChanged = true;
          }

          const isLegacyRoot =
            user.id === 'usr_root_admin' &&
            user.passwordAlgorithm === 'pbkdf2-sha512' &&
            Boolean(bootstrapPassword) &&
            (!bootstrapUsername || user.username.toLowerCase() === bootstrapUsername) &&
            (!bootstrapEmail || user.email.toLowerCase() === bootstrapEmail);

          if (isLegacyRoot) {
            const salt = generateSalt();
            user.salt = salt;
            user.passwordHash = hashPassword(bootstrapPassword!, salt, 'scrypt-v1');
            user.passwordAlgorithm = 'scrypt-v1';
            migrationChanged = true;
          }
        }

        for (const session of inMemoryDb.sessions || []) {
          if (!session.tokenHash && session.token) {
            session.tokenHash = hashSessionToken(session.token);
            session.lastActivityAt = session.lastActivityAt || session.createdAt;
            session.rememberMe = session.rememberMe ?? (
              (session.expiresAt - new Date(session.createdAt).getTime()) > 12 * 60 * 60 * 1000
            );
            delete session.token;
            migrationChanged = true;
          }
        }

        if (migrationChanged) {
          saveDatabaseSync(inMemoryDb);
        }
      }
      if (migrateLegacyAuditLogChain(inMemoryDb!)) {
        saveDatabaseSync(inMemoryDb!);
      }

      // Validate schema keys and backfill empty arrays from seed
      const seed = getInitialSeedData();
      let hasChanges = false;
      for (const key of Object.keys(seed) as (keyof DatabaseSchema)[]) {
        if (inMemoryDb && (inMemoryDb[key] === undefined || inMemoryDb[key] === null)) {
          (inMemoryDb as any)[key] = seed[key];
          hasChanges = true;
        } else if (
          inMemoryDb &&
          Array.isArray(inMemoryDb[key]) &&
          (inMemoryDb[key] as any[]).length === 0 &&
          Array.isArray(seed[key]) &&
          (seed[key] as any[]).length > 0 &&
          key !== 'sessions'
        ) {
          (inMemoryDb as any)[key] = seed[key];
          hasChanges = true;
        }
      }
      if (hasChanges) {
        saveDatabaseSync(inMemoryDb!);
      } else if (!rawFile.startsWith(DB_ENCRYPTION_PREFIX) && isDataEncryptionEnabled()) {
        // Upgrade an existing plaintext database to encrypted-at-rest storage.
        saveDatabaseSync(inMemoryDb!);
      }
      return inMemoryDb!;
    } catch (err) {
      console.error('[Database] Failed to load the existing persistent database:', err);
      throw new Error(
        'Persistent database could not be loaded. The application will not replace the existing data automatically.'
      );
    }
  }

  if (process.env.NODE_ENV === 'production' && !isDataEncryptionEnabled()) {
    throw new Error(
      'Production persistent storage requires KAPITECH_DATA_ENCRYPTION_KEY. Configure a 32-byte key before starting AMS.'
    );
  }

  inMemoryDb = getInitialSeedData();
  saveDatabaseSync(inMemoryDb);
  return inMemoryDb;
}

export function saveDatabaseSync(db: DatabaseSchema): void {
  if (fs.existsSync(DB_FILE) && lastPersistedFileFingerprint) {
    const currentFingerprint = readDatabaseFileFingerprint();
    if (currentFingerprint && currentFingerprint !== lastPersistedFileFingerprint) {
      throw new Error(
        'Persistent database changed in another application process. Write rejected to prevent a stale in-memory snapshot from overwriting newer data.'
      );
    }
  }

  // Keep a rolling encrypted snapshot before replacing the live database.
  // Backup failures never block the primary write, but are surfaced in runtime logs.
  if (fs.existsSync(DB_FILE)) {
    try {
      createDatabaseBackup(false);
    } catch (error) {
      console.error('[Database] Automatic backup failed:', error);
    }
  }

  const tempPath = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  const payload = encryptDatabase(db);
  fs.writeFileSync(tempPath, payload, { encoding: 'utf8', mode: 0o600 });
  try { fs.chmodSync(tempPath, 0o600); } catch {}
  fs.renameSync(tempPath, DB_FILE);
  try { fs.chmodSync(DB_FILE, 0o600); } catch {}
  lastPersistedFileFingerprint = fingerprintDatabaseFile(payload);
  inMemoryDb = db;
}

export function saveDatabase(db: DatabaseSchema): Promise<void> {
  // Keep the API async-compatible, but perform the atomic write before returning.
  saveDatabaseSync(db);
  return Promise.resolve();
}

const PERIODIC_BACKUP_INTERVAL_MS = 6 * 60 * 60 * 1000;
setInterval(() => {
  try {
    if (fs.existsSync(DB_FILE)) createDatabaseBackup(false);
  } catch (error) {
    console.error('[Database] Periodic backup failed:', error);
  }
}, PERIODIC_BACKUP_INTERVAL_MS).unref();

// Append-only tamper resistant audit log.
let postgresAuditWriteChain: Promise<void> = Promise.resolve();

export function flushAuditLogWrites(): Promise<void> {
  return postgresAuditWriteChain;
}

export function recordAuditLog(entry: {
  action: string;
  actor: string;
  actorRole: string;
  ip?: string;
  userAgent?: string;
  details: string;
  severity?: 'info' | 'warning' | 'critical';
}): void {
  if (getDataSourceMode() === 'postgres') {
    // Serialize appends so the hash chain remains deterministic even when several
    // security events are emitted during the same request burst. Keep failures
    // visible to the process while retaining the existing non-blocking API.
    postgresAuditWriteChain = postgresAuditWriteChain
      .then(() => postgresAuditLogRepository.append(entry))
      .then(() => undefined)
      .catch(error => {
        console.error('[AuditLog] PostgreSQL append failed:', error);
      });
    return;
  }

  const db = getDatabase();
  const previousHash = db.auditLogs?.[0]?.hash || 'GENESIS';
  const logWithoutHash: Omit<StoredAuditLog, 'hash'> = {
    id: `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    timestamp: new Date().toISOString(),
    action: entry.action,
    actor: entry.actor || 'anonymous',
    actorRole: entry.actorRole || 'visitor',
    ip: entry.ip || '127.0.0.1',
    userAgent: entry.userAgent || 'unknown',
    details: entry.details,
    severity: entry.severity || 'info',
    prevHash: previousHash
  };

  const log: StoredAuditLog = {
    ...logWithoutHash,
    hash: computeAuditLogHash(logWithoutHash)
  };

  db.auditLogs.unshift(log); saveDatabase(db);
}
