import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDataSourceMode } from './data-source.ts';
import { isProductionRuntime } from './runtime.ts';
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
  clientInteractions: any[];
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
  cmsInsights: any[];
  cmsInsightCategories: any[];
  cmsInsightTags: any[];
  cmsInsightAuthors: any[];
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
  const isProduction = isProductionRuntime();
  const adminSalt = generateSalt();
  

  const initialAdminUsername = process.env.ADMIN_INITIAL_USERNAME || (isProduction ? '' : 'admin');
  const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD || (isProduction ? '' : 'dev-only-change-me');
  const initialAdminEmail = process.env.ADMIN_INITIAL_EMAIL || (isProduction ? '' : 'admin@localhost');

  if (isProduction && !initialAdminPassword) {
    throw new Error('ADMIN_INITIAL_PASSWORD must be configured in production before the database is initialized.');
  }

// Bootstrap configuration only. Operational collections start empty; test fixtures belong in isolated test helpers.
  // Existing persistent database files are loaded as-is and are not cleaned by this bootstrap.
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
    clientInteractions: [],
    leads: [],
    crmDeals: [],
    proposals: [],
    clients: [],
    projects: [],
    tasks: [],
    timeLogs: [],
    invoices: [],
    expenses: [],
    approvals: [],
    vendors: [],
    documents: [],
    notifications: [],
    cmsServices: [],
    cmsProjects: [],
    cmsTestimonials: [],
    cmsInsights: [],
    cmsInsightCategories: [],
    cmsInsightTags: [],
    cmsInsightAuthors: [],
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
      'clientInteractions',
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
      'cmsInsights',
      'cmsInsightCategories',
      'cmsInsightTags',
      'cmsInsightAuthors',
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

  if (isProductionRuntime() && !isDataEncryptionEnabled()) {
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

  if (isProductionRuntime() && !isDataEncryptionEnabled()) {
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
