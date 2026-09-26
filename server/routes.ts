import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { 
  getDatabase,
  saveDatabase,
  createDatabaseBackup,
  listDatabaseBackups,
  verifyDatabaseBackupIntegrity,
  recordAuditLog,
  hashSessionToken,
  StoredUser,
  verifyAuditLogChain,
  isDataEncryptionEnabled
} from './db';
import { 
  authenticate,
  validateCsrf,
  setCsrfCookie,
  clearCsrfCookie,
  requireAuth,
  requirePermission,
  createSession,
  revokeSession,
  revokeAllUserSessions,
  verifyPasswordForUser,
  preparePassword,
  checkLockout,
  recordFailedLogin,
  clearLockout,
  AuthenticatedRequest,
  rateLimitPublic,
  rateLimitAuthenticated,
  requireAnyPermission,
  requireMaster,
  generateMfaSecret,
  buildMfaOtpUri,
  verifyTotpCode,
  generateMfaRecoveryCodes,
  hashMfaRecoveryCode,
  verifyMfaRecoveryCode,
  issueMfaChallenge,
  getMfaChallenge,
  incrementMfaChallengeFailures,
  consumeMfaChallenge,
  setMfaChallengeCookie,
  clearMfaChallengeCookie
} from './auth';
import { getDataSourceMode } from './data-source.ts';
import { loadApplicationDatabase } from './application-data-repository.ts';
import { postgresAuthRepository } from './postgres-repository.ts';
import { postgresClientRepository } from './postgres-client-repository.ts';
import { postgresProjectRepository, ProjectConcurrencyError } from './postgres-project-repository.ts';
import { postgresVendorRepository } from './postgres-vendor-repository.ts';
import { postgresLeadRepository } from './postgres-lead-repository.ts';
import { postgresCrmDealRepository } from './postgres-crm-deal-repository.ts';
import { postgresProposalRepository } from './postgres-proposal-repository.ts';
import { postgresTaskRepository } from './postgres-task-repository.ts';
import { postgresTimeLogRepository } from './postgres-time-log-repository.ts';
import { postgresInvoiceRepository } from './postgres-invoice-repository.ts';
import { postgresExpenseRepository, ExpenseImmutableError, ExpenseNotFoundError, ExpenseVersionConflictError, ExpenseProjectNotFoundError } from './postgres-expense-repository.ts';
import { postgresApprovalRepository } from './postgres-approval-repository.ts';
import { postgresNotificationRepository } from './postgres-notification-repository.ts';
import { canViewNotification, getHiddenNotificationTypes } from './notification-access.ts';
import { postgresDocumentRepository } from './postgres-document-repository.ts';
import { postgresAuditLogRepository } from './postgres-audit-log-repository.ts';
import { postgresCmsRepository } from './postgres-cms-repository.ts';
import { postgresNotificationSettingsRepository } from './postgres-notification-settings-repository.ts';
import { getDocumentStorage } from './document-storage.ts';
import { getPostgresBackupHealth } from './postgres-backup-health.ts';
import { checkPostgresConnection, getPostgresPool } from './postgres.ts';
import { loadPostgresMigrations } from './postgres-migrations.ts';
import { isFirebaseAuthEnabled, verifyFirebaseIdToken } from './firebase-token.ts';


const ROLE_POLICIES: Record<string, {
  stakeholderType: StoredUser['stakeholderType'];
  division: StoredUser['division'];
  permissions: StoredUser['permissions'];
}> = {
  'Stakeholder Executive': {
    stakeholderType: 'Executive',
    division: 'Management',
    permissions: {
      canViewFinancials: true, canManageInvoices: true, canApproveBudgets: true, canManageCrm: true,
      canManageProjects: true, canManageKanbanTasks: false, canManageClients: true, canManageVendors: true,
      canManageCmsContent: false, canAccessServerAndApi: false, canRunDataMigration: false,
      canViewSecurityAuditLogs: true, canManageAdminAccounts: false
    }
  },
  'Financial Officer': {
    stakeholderType: 'Operations',
    division: 'Finance',
    permissions: {
      canViewFinancials: true, canManageInvoices: true, canApproveBudgets: true, canManageCrm: false,
      canManageProjects: false, canManageKanbanTasks: false, canManageClients: true, canManageVendors: true,
      canManageCmsContent: false, canAccessServerAndApi: false, canRunDataMigration: false,
      canViewSecurityAuditLogs: false, canManageAdminAccounts: false
    }
  },
  'Tier 2: Project Manager (PM)': {
    stakeholderType: 'Project_Manager',
    division: 'Operations',
    permissions: {
      canViewFinancials: false, canManageInvoices: false, canApproveBudgets: false, canManageCrm: true,
      canManageProjects: true, canManageKanbanTasks: true, canManageClients: true, canManageVendors: true,
      canManageCmsContent: false, canAccessServerAndApi: false, canRunDataMigration: false,
      canViewSecurityAuditLogs: false, canManageAdminAccounts: false
    }
  },
  'Tier 3: Operational Staff': {
    stakeholderType: 'Operations',
    division: 'Operations',
    permissions: {
      canViewFinancials: false, canManageInvoices: false, canApproveBudgets: false, canManageCrm: false,
      canManageProjects: true, canManageKanbanTasks: true, canManageClients: false, canManageVendors: false,
      canManageCmsContent: false, canAccessServerAndApi: false, canRunDataMigration: false,
      canViewSecurityAuditLogs: false, canManageAdminAccounts: false
    }
  },
  'Teknisi IT / Systems Engineer': {
    stakeholderType: 'IT_Technical',
    division: 'Engineering',
    permissions: {
      canViewFinancials: false, canManageInvoices: false, canApproveBudgets: false, canManageCrm: false,
      canManageProjects: false, canManageKanbanTasks: false, canManageClients: false, canManageVendors: false,
      canManageCmsContent: false, canAccessServerAndApi: true, canRunDataMigration: true,
      canViewSecurityAuditLogs: true, canManageAdminAccounts: false
    }
  }
};

const MAX_PUBLIC_TEXT = 4000;
const MAX_INTERNAL_TEXT = 5000;
const CRM_STAGES = ['new', 'contacted', 'proposal', 'negotiation', 'won', 'lost'] as const;
const DEAL_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
function makeAuditEntry(req: AuthenticatedRequest, action: string, details: string, severity: 'info' | 'warning' | 'critical' = 'info') {
  return { action, actor: req.user!.username, actorRole: req.user!.role, actorUserId: req.user!.id, ip: req.ip, userAgent: req.headers['user-agent'] as string, details, severity };
}

async function writeAuditLog(entry: Parameters<typeof recordAuditLog>[0]): Promise<void> {
  if (getDataSourceMode() === 'postgres') {
    try {
      await postgresAuditLogRepository.append({
        ...entry,
        actor: String(entry.actor || 'system'),
        actorRole: String(entry.actorRole || 'system'),
        ip: String(entry.ip || ''),
        userAgent: String(entry.userAgent || ''),
        details: String(entry.details || ''),
        severity: entry.severity || 'info'
      });
    } catch (error) {
      console.error('[Audit] PostgreSQL audit append failed:', error);
    }
    return;
  }
  recordAuditLog(entry);
}


function cleanText(value: unknown, max = MAX_INTERNAL_TEXT): string {
  return String(value ?? '').trim().slice(0, max);
}

function cleanOptionalUrl(value: unknown): string {
  const candidate = cleanText(value, 2000);
  if (!candidate) return '';
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function pickFields<T extends Record<string, unknown>>(source: Record<string, unknown>, fields: readonly string[]): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(source, field)) result[field] = source[field];
  }
  return result as Partial<T>;
}

function normalizeProbability(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(1, Math.max(0, numeric > 1 ? numeric / 100 : numeric));
}

const MAX_MONEY = 100_000_000_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidEmail(value: unknown): boolean {
  const email = String(value ?? '').trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

function isValidDate(value: unknown): boolean {
  if (!ISO_DATE_PATTERN.test(String(value ?? ''))) return false;
  const parsed = new Date(String(value) + 'T00:00:00Z');
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === String(value);
}

function normalizeNumber(value: unknown, min: number, max: number, fallback?: number): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) return fallback ?? null;
  return Math.round(numeric * 100) / 100;
}

function normalizeStringArray(value: unknown, maxItems = 50, maxLength = 160): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map(item => cleanText(item, maxLength)).filter(Boolean);
}

function getInvoicePaidAmount(invoice: any): number {
  const payments = Array.isArray(invoice?.payments) ? invoice.payments : [];
  if (payments.length > 0) {
    return payments.reduce((sum: number, payment: any) => sum + (Number(payment?.amount) || 0), 0);
  }
  return Math.max(0, Number(invoice?.amountPaid) || 0);
}

function getInvoiceBalanceDue(invoice: any): number {
  const total = Math.max(0, Number(invoice?.total) || 0);
  return Math.max(0, total - getInvoicePaidAmount(invoice));
}

async function dispatchLeadTelegramNotification(
  lead: {
    fullName: string;
    company: string;
    email: string;
    phone: string;
    services: string[];
    budget: string;
    message: string;
  },
  settings: {
    isTelegramActive: boolean;
    telegramChatId: string;
    telegramBotToken?: string;
  }
): Promise<void> {
  const botToken = (process.env.KAPITECH_TELEGRAM_BOT_TOKEN || settings.telegramBotToken || '').trim();
  const chatId = (process.env.KAPITECH_TELEGRAM_CHAT_ID || settings.telegramChatId || '').trim();

  if (!settings.isTelegramActive || !botToken || !chatId) return;

  const telegramText =
    `🔔 *New Kapitech Lead Received*\\n\\n` +
    `👤 *Name:* ${lead.fullName}\\n` +
    `🏢 *Company:* ${lead.company || '-'}\\n` +
    `✉️ *Email:* ${lead.email}\\n` +
    `📞 *Phone:* ${lead.phone || '-'}\\n` +
    `🛠️ *Services:* ${lead.services.join(', ') || '-'}\\n` +
    `💰 *Budget:* ${lead.budget || '-'}\\n\\n` +
    `💬 *Message:*\\n_${lead.message.slice(0, 300)}_`;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: telegramText, parse_mode: 'Markdown' })
    });
  } catch (error) {
    console.debug('[Notifications] Telegram lead notification failed:', error);
  }
}

function pushNotification(
  db: ReturnType<typeof getDatabase> | undefined,
  input: {
    title: string;
    message: string;
    type: 'lead' | 'finance' | 'approval' | 'project' | 'system';
    severity?: 'info' | 'warning' | 'danger' | 'critical';
    linkUrl?: string;
    recipientUserId?: string;
  }
): void {
  const notification = {
    id: `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    title: cleanText(input.title, 180),
    message: cleanText(input.message, 1000),
    type: input.type,
    severity: input.severity || 'info',
    read: false,
    readBy: [],
    recipientUserId: input.recipientUserId || undefined,
    linkUrl: input.linkUrl || '/admin/dashboard',
    timestamp: new Date().toISOString()
  };

  if (getDataSourceMode() === 'postgres') {
    void postgresNotificationRepository.create(notification).catch(error => {
      console.error('[Notifications] Failed to persist PostgreSQL notification:', error);
    });
    return;
  }

  if (!Array.isArray(db.notifications)) db.notifications = [];
  db.notifications.unshift(notification);
  db.notifications = db.notifications.slice(0, 500);
}

export const apiRouter = Router();

// Apply auth header checking on all API requests
apiRouter.use(authenticate);
apiRouter.use(validateCsrf);
apiRouter.use((req: AuthenticatedRequest, res: Response, next) => {
  if (!req.user) return next();
  return rateLimitAuthenticated(300, 60 * 1000)(req, res, next);
});

// ----------------------------------------------------
// 1. AUTHENTICATION & SESSION MANAGEMENT
// ----------------------------------------------------

apiRouter.post('/auth/login', rateLimitPublic(10, 15 * 60 * 1000), async (req: Request, res: Response): Promise<void> => {
  const { identifier, password, rememberMe } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!identifier || !password) {
    res.status(400).json({ success: false, error: 'Username/email and password are required.' });
    return;
  }

  const cleanIdentifier = String(identifier).trim().toLowerCase();
  let lockout;
  try {
    lockout = await checkLockout(cleanIdentifier, ip);
  } catch (error) {
    console.error('[Auth] Login lockout check failed:', error);
    res.status(503).json({ success: false, error: 'Authentication security controls are temporarily unavailable.' });
    return;
  }
  if (lockout.isLocked) {
    res.status(429).json({
      success: false,
      error: `Security Lockout: Too many failed login attempts. Please try again in ${lockout.remainingSeconds}s.`
    });
    return;
  }

  let db;
  let user: StoredUser | null;
  try {
    if (getDataSourceMode() === 'postgres') {
      user = await postgresAuthRepository.findUserByIdentifier(cleanIdentifier);
    } else {
      db = getDatabase();
      user = db.users.find(u => u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier) || null;
    }
  } catch (error) {
    console.error('[Auth] Failed to initialize authentication database:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('ADMIN_INITIAL_PASSWORD')) {
      res.status(503).json({
        success: false,
        error: 'Authentication is not initialized. Configure ADMIN_INITIAL_PASSWORD in the hosting environment, then restart the application.'
      });
      return;
    }
    res.status(503).json({
      success: false,
      error: 'Authentication service is temporarily unavailable. Check the server runtime logs.'
    });
    return;
  }

  if (!user || user.status === 'suspended') {
    let lockoutState;
    try {
      lockoutState = await recordFailedLogin(cleanIdentifier, ip);
    } catch (error) {
      console.error('[Auth] Failed-login security control failed:', error);
      res.status(503).json({ success: false, error: 'Authentication security controls are temporarily unavailable.' });
      return;
    }
    await writeAuditLog({
      action: 'LOGIN_FAILED',
      actor: cleanIdentifier,
      actorRole: 'anonymous',
      ip,
      userAgent,
      details: 'Failed login attempt: Account not found or suspended.',
      severity: 'warning'
    });
    if (lockoutState.isLocked) {
      res.status(429).json({
        success: false,
        error: `Security Lockout: Too many failed login attempts. Please try again in ${lockoutState.remainingSeconds}s.`,
        remainingSeconds: lockoutState.remainingSeconds
      });
      return;
    }
    res.status(401).json({ success: false, error: 'Invalid username/email or password.' });
    return;
  }

  if (!verifyPasswordForUser(password, user)) {
    let lockoutState;
    try {
      lockoutState = await recordFailedLogin(cleanIdentifier, ip);
    } catch (error) {
      console.error('[Auth] Failed-login security control failed:', error);
      res.status(503).json({ success: false, error: 'Authentication security controls are temporarily unavailable.' });
      return;
    }
    await writeAuditLog({
      action: 'LOGIN_FAILED',
      actor: user.username,
      actorRole: user.role,
      ip,
      userAgent,
      details: 'Failed login attempt: Incorrect password.',
      severity: 'warning'
    });
    if (lockoutState.isLocked) {
      res.status(429).json({
        success: false,
        error: `Security Lockout: Too many failed login attempts. Please try again in ${lockoutState.remainingSeconds}s.`,
        remainingSeconds: lockoutState.remainingSeconds
      });
      return;
    }
    res.status(401).json({ success: false, error: 'Invalid username/email or password.' });
    return;
  }

  // Password verified. Complete legacy hash migration before deciding whether a second factor is required.
  try {
    await clearLockout(cleanIdentifier, ip);

    if ((user.passwordAlgorithm || 'pbkdf2-sha512') !== 'scrypt-v1') {
      const prepared = preparePassword(password);
      user.salt = prepared.salt;
      user.passwordHash = prepared.passwordHash;
      user.passwordAlgorithm = prepared.passwordAlgorithm;
      if (getDataSourceMode() === 'postgres') await postgresAuthRepository.updateUserPassword(user.id, prepared.passwordHash, prepared.salt, prepared.passwordAlgorithm);
      else saveDatabase(db);
    }

    if (user.mfaEnabled) {
      if (!user.mfaSecret) {
        res.status(503).json({
          success: false,
          error: 'MFA is enabled but not configured correctly. Contact a Master administrator.'
        });
        return;
      }

      const challenge = await issueMfaChallenge(user.id, Boolean(rememberMe));
      setMfaChallengeCookie(res, challenge);
      setCsrfCookie(res);

      await writeAuditLog({
        action: 'LOGIN_MFA_CHALLENGE',
        actor: user.username,
        actorRole: user.role,
        ip,
        userAgent,
        details: 'Password accepted; TOTP second factor is configured and required to complete sign-in.',
        severity: 'info'
      });

      res.json({
        success: true,
        requiresMfa: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          mfaEnabled: true
        }
      });
      return;
    }

    const nowIso = new Date().toISOString();
    user.lastLogin = nowIso;
    if (getDataSourceMode() === 'postgres') await postgresAuthRepository.touchUserLastLogin(user.id, nowIso);
    else saveDatabase(db);
    const session = await createSession(user, ip, userAgent, Boolean(rememberMe));

    await writeAuditLog({
      action: 'LOGIN_SUCCESS',
      actor: user.username,
      actorRole: user.role,
      ip,
      userAgent,
      details: `User ${user.username} authenticated successfully.`,
      severity: 'info'
    });

    const cookieMaxAge = rememberMe ? 24 * 3600 : 12 * 3600;
    const secureCookie = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
    res.append('Set-Cookie', `kapi_session=${session.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${cookieMaxAge};${secureCookie}`);
    setCsrfCookie(res);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        stakeholderType: user.stakeholderType,
        permissions: user.permissions,
        division: user.division,
        mfaEnabled: user.mfaEnabled,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('[Auth] Failed to create authenticated session:', error);
    res.status(503).json({
      success: false,
      error: 'Login could not be completed because the server session store is unavailable. Check the server runtime logs.'
    });
  }
});

apiRouter.post('/auth/firebase-login', rateLimitPublic(10, 15 * 60 * 1000), async (req: Request, res: Response): Promise<void> => {
  const origin = req.get('origin');
  if (origin && origin !== `${req.protocol}://${req.get('host')}`) {
    res.status(403).json({ success: false, error: 'Security validation failed.' });
    return;
  }

  if (!isFirebaseAuthEnabled()) {
    res.status(404).json({ success: false, error: 'Firebase authentication is not enabled.' });
    return;
  }

  if (getDataSourceMode() !== 'postgres') {
    res.status(503).json({ success: false, error: 'Firebase authentication requires the PostgreSQL datasource.' });
    return;
  }

  const idToken = String(req.body?.idToken || '').trim();
  const rememberMe = Boolean(req.body?.rememberMe);
  if (!idToken || idToken.length > 5000) {
    res.status(400).json({ success: false, error: 'A valid Firebase ID token is required.' });
    return;
  }

  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const firebaseUser = await verifyFirebaseIdToken(idToken);
    let user = await postgresAuthRepository.findUserByFirebaseUid(firebaseUser.uid);

    if (!user) {
      user = await postgresAuthRepository.findUserByIdentifier(firebaseUser.email);
      if (!user || user.status === 'suspended') {
        await writeAuditLog({
          action: 'LOGIN_FAILED_FIREBASE',
          actor: firebaseUser.email,
          actorRole: 'anonymous',
          ip,
          userAgent,
          details: 'Firebase identity verified, but no active PostgreSQL AMS account is mapped to the verified email address.',
          severity: 'warning'
        });
        res.status(401).json({ success: false, error: 'No active AMS account is mapped to this Firebase email address.' });
        return;
      }

      const linked = await postgresAuthRepository.linkFirebaseUid(user.id, firebaseUser.uid);
      if (!linked) {
        const existingFirebaseUser = await postgresAuthRepository.findUserByFirebaseUid(firebaseUser.uid);
        if (!existingFirebaseUser || existingFirebaseUser.id !== user.id) {
          res.status(409).json({ success: false, error: 'This Firebase identity is already linked to another AMS account.' });
          return;
        }
      }
    }

    if (!user || user.status === 'suspended') {
      await writeAuditLog({
        action: 'LOGIN_FAILED_FIREBASE',
        actor: firebaseUser.email,
        actorRole: 'anonymous',
        ip,
        userAgent,
        details: 'Firebase identity verified, but no active PostgreSQL AMS account is mapped to the verified email address.',
        severity: 'warning'
      });
      res.status(401).json({ success: false, error: 'No active AMS account is mapped to this Firebase email address.' });
      return;
    }

    if (user.mfaEnabled) {
      if (!user.mfaSecret) {
        res.status(503).json({ success: false, error: 'MFA is enabled but not configured correctly. Contact a Master administrator.' });
        return;
      }

      const challenge = await issueMfaChallenge(user.id, rememberMe);
      setMfaChallengeCookie(res, challenge);
      setCsrfCookie(res);

      await writeAuditLog({
        action: 'LOGIN_MFA_CHALLENGE_FIREBASE',
        actor: user.username,
        actorRole: user.role,
        ip,
        userAgent,
        details: 'Firebase identity accepted; TOTP second factor is required to complete the server session.',
        severity: 'info'
      });

      res.json({
        success: true,
        requiresMfa: true,
        provider: 'firebase',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          mfaEnabled: true
        }
      });
      return;
    }

    const nowIso = new Date().toISOString();
    user.lastLogin = nowIso;
    await postgresAuthRepository.touchUserLastLogin(user.id, nowIso);
    const session = await createSession(user, ip, userAgent, rememberMe);

    await writeAuditLog({
      action: 'LOGIN_SUCCESS_FIREBASE',
      actor: user.username,
      actorRole: user.role,
      ip,
      userAgent,
      details: `User ${user.username} authenticated through Firebase and mapped to the PostgreSQL AMS account.`,
      severity: 'info'
    });

    const cookieMaxAge = rememberMe ? 24 * 3600 : 12 * 3600;
    const secureCookie = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
    res.append('Set-Cookie', `kapi_session=${session.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${cookieMaxAge};${secureCookie}`);
    setCsrfCookie(res);

    res.json({
      success: true,
      provider: 'firebase',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        stakeholderType: user.stakeholderType,
        permissions: user.permissions,
        division: user.division,
        mfaEnabled: user.mfaEnabled,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('[Auth] Firebase login failed:', error);
    await writeAuditLog({
      action: 'LOGIN_FAILED_FIREBASE',
      actor: 'firebase',
      actorRole: 'anonymous',
      ip,
      userAgent,
      details: 'Firebase ID token verification or PostgreSQL account mapping failed.',
      severity: 'warning'
    });
    res.status(401).json({ success: false, error: 'Firebase authentication could not be verified.' });
  }
});

apiRouter.post('/auth/mfa/verify', rateLimitPublic(10, 5 * 60 * 1000), async (req: Request, res: Response): Promise<void> => {
  const origin = req.get('origin');
  if (origin && origin !== `${req.protocol}://${req.get('host')}`) {
    res.status(403).json({ success: false, error: 'Security validation failed.' });
    return;
  }

  const challengeToken = req.headers.cookie
    ?.split(';')
    .map(part => part.trim())
    .find(part => part.startsWith('kapi_mfa_challenge='))
    ?.slice('kapi_mfa_challenge='.length) || '';
  const challenge = await getMfaChallenge(decodeURIComponent(challengeToken));
  if (!challenge) {
    clearMfaChallengeCookie(res);
    res.status(401).json({ success: false, error: 'MFA challenge expired. Please sign in again.' });
    return;
  }

  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  const user = getDataSourceMode() === 'postgres' ? await postgresAuthRepository.findUserById(challenge.userId) : db!.users.find(item => item.id === challenge.userId) || null;
  const code = String(req.body?.code || '').trim();
  const validTotp = Boolean(user?.mfaEnabled && user?.mfaSecret && verifyTotpCode(user.mfaSecret, code));
  const validRecovery = Boolean(user?.mfaEnabled && user && verifyMfaRecoveryCode(user, code));
  if (validRecovery && getDataSourceMode() === 'postgres' && user) {
    await postgresAuthRepository.updateUserMfa(user.id, { mfaEnabled: user.mfaEnabled, mfaSecret: user.mfaSecret || null, mfaPendingSecret: user.mfaPendingSecret || null, mfaPendingSecretCreatedAt: user.mfaPendingSecretCreatedAt || null, mfaRecoveryCodeHashes: user.mfaRecoveryCodeHashes || [] });
  }
  if (!user || user.status === 'suspended' || !user.mfaEnabled || (!validTotp && !validRecovery)) {
    const failedAttempts = await incrementMfaChallengeFailures(decodeURIComponent(challengeToken));
    if (failedAttempts >= 5) {
      clearMfaChallengeCookie(res);
    }
    await writeAuditLog({
      action: 'MFA_VERIFY_FAILED',
      actor: user?.username || 'unknown',
      actorRole: user?.role || 'anonymous',
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: 'Invalid or unavailable MFA verification code during sign-in.',
      severity: 'warning'
    });
    res.status(401).json({ success: false, error: 'Invalid verification code.' });
    return;
  }

  await consumeMfaChallenge(decodeURIComponent(challengeToken));
  user.lastLogin = new Date().toISOString();
  if (getDataSourceMode() === 'postgres') await postgresAuthRepository.touchUserLastLogin(user.id, user.lastLogin);
  else saveDatabase(db!);

  const session = await createSession(user, req.ip || 'unknown', req.headers['user-agent'] || 'unknown', challenge.rememberMe);
  const cookieMaxAge = challenge.rememberMe ? 24 * 3600 : 12 * 3600;
  const secureCookie = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.append('Set-Cookie', `kapi_session=${session.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${cookieMaxAge};${secureCookie}`);
  clearMfaChallengeCookie(res);
  setCsrfCookie(res);

  await writeAuditLog({
    action: 'LOGIN_SUCCESS',
    actor: user.username,
    actorRole: user.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `User ${user.username} authenticated successfully with MFA.`,
    severity: 'info'
  });

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      stakeholderType: user.stakeholderType,
      permissions: user.permissions,
      division: user.division,
      mfaEnabled: user.mfaEnabled,
      lastLogin: user.lastLogin
    }
  });
});

apiRouter.post('/auth/mfa/setup/start', requireAuth, rateLimitAuthenticated(5, 15 * 60 * 1000), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  if (user.mfaEnabled) {
    res.status(409).json({ success: false, error: 'MFA is already enabled.' });
    return;
  }

  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  const current = getDataSourceMode() === 'postgres' ? await postgresAuthRepository.findUserById(user.id) : db!.users.find(item => item.id === user.id) || null;
  if (!current) {
    res.status(404).json({ success: false, error: 'Account not found.' });
    return;
  }

  const secret = generateMfaSecret();
  current.mfaPendingSecret = secret;
  current.mfaPendingSecretCreatedAt = new Date().toISOString();
  if (getDataSourceMode() === 'postgres') await postgresAuthRepository.updateUserMfa(current.id, { mfaEnabled: current.mfaEnabled, mfaSecret: current.mfaSecret || null, mfaPendingSecret: secret, mfaPendingSecretCreatedAt: current.mfaPendingSecretCreatedAt, mfaRecoveryCodeHashes: current.mfaRecoveryCodeHashes || [] });
  else saveDatabase(db!);

  res.json({
    success: true,
    secret,
    otpAuthUri: buildMfaOtpUri(current, secret)
  });
});

apiRouter.post('/auth/mfa/setup/verify', requireAuth, rateLimitAuthenticated(10, 15 * 60 * 1000), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const code = String(req.body?.code || '').trim();
  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  const user = getDataSourceMode() === 'postgres' ? await postgresAuthRepository.findUserById(req.user!.id) : db!.users.find(item => item.id === req.user!.id) || null;
  if (!user?.mfaPendingSecret) {
    res.status(409).json({ success: false, error: 'MFA setup has not been started.' });
    return;
  }

  const pendingCreatedAt = new Date(user.mfaPendingSecretCreatedAt || 0).getTime();
  if (!Number.isFinite(pendingCreatedAt) || pendingCreatedAt <= 0 || Date.now() - pendingCreatedAt > 10 * 60 * 1000) {
    user.mfaPendingSecret = undefined;
    user.mfaPendingSecretCreatedAt = undefined;
    if (getDataSourceMode() === 'postgres') await postgresAuthRepository.updateUserMfa(user.id, { mfaEnabled: user.mfaEnabled, mfaSecret: user.mfaSecret || null, mfaPendingSecret: null, mfaPendingSecretCreatedAt: null, mfaRecoveryCodeHashes: user.mfaRecoveryCodeHashes || [] });
    else saveDatabase(db!);
    res.status(410).json({ success: false, error: 'MFA setup expired. Start the setup again.' });
    return;
  }

  if (!verifyTotpCode(user.mfaPendingSecret, code)) {
    res.status(401).json({ success: false, error: 'Invalid verification code.' });
    return;
  }

  user.mfaSecret = user.mfaPendingSecret;
  user.mfaPendingSecret = undefined;
  user.mfaPendingSecretCreatedAt = undefined;
  user.mfaEnabled = true;
  const recoveryCodes = generateMfaRecoveryCodes(8);
  user.mfaRecoveryCodeHashes = recoveryCodes.map(hashMfaRecoveryCode);
  if (getDataSourceMode() === 'postgres') {
    await postgresAuthRepository.updateUserMfa(
      user.id,
      { mfaEnabled: true, mfaSecret: user.mfaSecret || null, mfaPendingSecret: null, mfaPendingSecretCreatedAt: null, mfaRecoveryCodeHashes: user.mfaRecoveryCodeHashes },
      {
        revokeAllSessions: true,
        exceptTokenHash: req.sessionToken ? hashSessionToken(req.sessionToken) : undefined,
        audit: makeAuditEntry(req, 'MFA_ENABLED', 'TOTP multi-factor authentication enabled for the account.', 'info')
      }
    );
  } else saveDatabase(db!);
  if (getDataSourceMode() === 'json') await revokeAllUserSessions(user.id, req.sessionToken ? hashSessionToken(req.sessionToken) : undefined);

  if (getDataSourceMode() === 'json') recordAuditLog({
    action: 'MFA_ENABLED',
    actor: user.username,
    actorRole: user.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: 'TOTP multi-factor authentication enabled for the account.',
    severity: 'info'
  });

  res.json({ success: true, mfaEnabled: true, mfaRecoveryCodes: recoveryCodes, message: 'MFA enabled successfully. Store the recovery codes securely; each code can be used once.' });
});

apiRouter.post('/auth/mfa/disable', requireAuth, rateLimitAuthenticated(5, 15 * 60 * 1000), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentPassword = String(req.body?.currentPassword || '');
  const code = String(req.body?.code || '').trim();
  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  const user = getDataSourceMode() === 'postgres' ? await postgresAuthRepository.findUserById(req.user!.id) : db!.users.find(item => item.id === req.user!.id) || null;
  if (!user?.mfaEnabled || !user.mfaSecret) {
    res.status(409).json({ success: false, error: 'MFA is not enabled.' });
    return;
  }
  const validSecondFactor = verifyTotpCode(user.mfaSecret, code) || verifyMfaRecoveryCode(user, code);
  if (!verifyPasswordForUser(currentPassword, user) || !validSecondFactor) {
    res.status(401).json({ success: false, error: 'Current password and a valid TOTP or recovery code are required.' });
    return;
  }

  user.mfaEnabled = false;
  user.mfaSecret = undefined;
  user.mfaPendingSecret = undefined;
  user.mfaRecoveryCodeHashes = [];
  if (getDataSourceMode() === 'postgres') {
    await postgresAuthRepository.updateUserMfa(
      user.id,
      { mfaEnabled: false, mfaSecret: null, mfaPendingSecret: null, mfaPendingSecretCreatedAt: null, mfaRecoveryCodeHashes: [] },
      {
        revokeAllSessions: true,
        audit: makeAuditEntry(req, 'MFA_DISABLED', 'TOTP multi-factor authentication disabled for the account.', 'warning')
      }
    );
  } else saveDatabase(db!);
  if (getDataSourceMode() === 'json') await revokeAllUserSessions(user.id);

  if (getDataSourceMode() === 'json') recordAuditLog({
    action: 'MFA_DISABLED',
    actor: user.username,
    actorRole: user.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: 'TOTP multi-factor authentication disabled for the account.',
    severity: 'warning'
  });

  const secureCookie = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.append('Set-Cookie', `kapi_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0;${secureCookie}`);
  clearCsrfCookie(res);
  res.json({ success: true, mfaEnabled: false });
});

apiRouter.post('/auth/logout', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (req.sessionToken) {
    await revokeSession(req.sessionToken);
  }
  if (req.user) {
    await writeAuditLog({
      action: 'LOGOUT',
      actor: req.user.username,
      actorRole: req.user.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: `User ${req.user.username} logged out.`,
      severity: 'info'
    });
  }
  const secureCookie = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.append('Set-Cookie', `kapi_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0;${secureCookie}`);
  clearCsrfCookie(res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      stakeholderType: user.stakeholderType,
      permissions: user.permissions,
      division: user.division,
      mfaEnabled: user.mfaEnabled,
      lastLogin: user.lastLogin
    }
  });
});

apiRouter.post('/auth/change-password', requireAuth, rateLimitAuthenticated(10, 15 * 60 * 1000), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, error: 'Current password and new password are required.' });
    return;
  }

  if (typeof newPassword !== 'string' || newPassword.length < 12 || newPassword.length > 128) {
    res.status(400).json({ success: false, error: 'New password must be 12 to 128 characters.' });
    return;
  }

  if (newPassword === currentPassword) {
    res.status(400).json({ success: false, error: 'New password must be different from the current password.' });
    return;
  }

  if (!verifyPasswordForUser(currentPassword, user)) {
    res.status(400).json({ success: false, error: 'Current password is incorrect.' });
    return;
  }

  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  const dbUser = getDataSourceMode() === 'postgres' ? await postgresAuthRepository.findUserById(user.id) : db!.users.find(u => u.id === user.id) || null;
  if (dbUser) {
    const prepared = preparePassword(newPassword);
    dbUser.salt = prepared.salt;
    dbUser.passwordHash = prepared.passwordHash;
    dbUser.passwordAlgorithm = prepared.passwordAlgorithm;
    if (getDataSourceMode() === 'postgres') {
      await postgresAuthRepository.updateUserPassword(
        user.id,
        prepared.passwordHash,
        prepared.salt,
        prepared.passwordAlgorithm,
        {
          exceptTokenHash: req.sessionToken ? hashSessionToken(req.sessionToken) : undefined,
          audit: makeAuditEntry(req, 'PASSWORD_CHANGED', `User ${user.username} changed their password.`, 'info')
        }
      );
    } else saveDatabase(db!);
    if (getDataSourceMode() === 'json' && req.sessionToken) {
      await revokeAllUserSessions(user.id, hashSessionToken(req.sessionToken));
    }

    if (getDataSourceMode() === 'json') recordAuditLog({
      action: 'PASSWORD_CHANGED',
      actor: user.username,
      actorRole: user.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: `User ${user.username} changed their password.`,
      severity: 'info'
    });
  }

  res.json({ success: true, message: 'Password updated successfully.' });
});

// Admin Account Management (Requires Master or canManageAdminAccounts permission)
apiRouter.post('/auth/verify-password', requireAuth, rateLimitAuthenticated(10, 15 * 60 * 1000), (req: AuthenticatedRequest, res: Response): void => {
  const { password } = req.body;
  const user = req.user!;
  if (!password || typeof password !== 'string') {
    res.status(400).json({ success: false, error: 'Password is required.' });
    return;
  }

  if (!verifyPasswordForUser(password, user)) {
    res.status(401).json({ success: false, error: 'Current password is incorrect.' });
    return;
  }

  res.json({ success: true });
});

apiRouter.get('/auth/users', requireAuth, requireMaster, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const users = getDataSourceMode() === 'postgres' ? await postgresAuthRepository.listUsers() : getDatabase().users;
  const sanitizedUsers = users.map(u => ({
    id: u.id, name: u.name, username: u.username, email: u.email, role: u.role,
    stakeholderType: u.stakeholderType, permissions: u.permissions, division: u.division,
    mfaEnabled: u.mfaEnabled, status: u.status, lastLogin: u.lastLogin, createdAt: u.createdAt
  }));
  res.json({ success: true, users: sanitizedUsers });
});

apiRouter.get('/auth/task-assignees', requireAuth, requirePermission('canManageKanbanTasks'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const users = getDataSourceMode() === 'postgres' ? await postgresAuthRepository.listUsers() : getDatabase().users;
  const assignees = users
    .filter(user => user.status === 'active')
    .map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      division: user.division
    }));
  res.json({ success: true, assignees });
});

apiRouter.post('/auth/users', requireAuth, requireMaster, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, username, email, password, role, division } = req.body;
  const requestedRole = String(role || 'Tier 3: Operational Staff').trim();
  const policy = ROLE_POLICIES[requestedRole];

  if (!policy) {
    res.status(400).json({ success: false, error: 'Unsupported account role.' });
    return;
  }
  if (!name || !username || !email || !password) {
    res.status(400).json({ success: false, error: 'Name, username, email, and password are required.' });
    return;
  }

  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    res.status(400).json({ success: false, error: 'Account password must be 12 to 128 characters.' });
    return;
  }

  const cleanName = cleanText(name, 160);
  const cleanUsername = String(username).trim().toLowerCase();
  const cleanEmail = String(email).trim().toLowerCase();
  const reservedUsernames = new Set(['admin', 'root', 'administrator', 'superuser', 'system']);

  if (!cleanName) {
    res.status(400).json({ success: false, error: 'Name is required.' });
    return;
  }
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(cleanUsername) || reservedUsernames.has(cleanUsername)) {
    res.status(400).json({ success: false, error: 'Username must be 3 to 64 characters and use only lowercase letters, numbers, dots, underscores, or hyphens.' });
    return;
  }
  if (!isValidEmail(cleanEmail)) {
    res.status(400).json({ success: false, error: 'Invalid account email address.' });
    return;
  }

  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  const existing = getDataSourceMode() === 'postgres'
    ? await postgresAuthRepository.findUserByIdentifier(cleanUsername)
    : db!.users.find(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail) || null;
  if (existing || (getDataSourceMode() === 'postgres' && await postgresAuthRepository.findUserByIdentifier(cleanEmail))) {
    res.status(400).json({ success: false, error: 'Username or email already exists.' });
    return;
  }

  const prepared = preparePassword(password);
  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    name: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    passwordHash: prepared.passwordHash,
    salt: prepared.salt,
    passwordAlgorithm: prepared.passwordAlgorithm,
    role: requestedRole,
    stakeholderType: policy.stakeholderType,
    permissions: policy.permissions,
    mfaEnabled: false,
    division: policy.division,
    status: 'active',
    lastLogin: '',
    createdAt: new Date().toISOString()
  };

  if (getDataSourceMode() === 'postgres') {
    await postgresAuthRepository.createUser(newUser, makeAuditEntry(req, 'ACCOUNT_CREATED', `Created admin user "${newUser.username}" (${newUser.role}).`, 'info'));
  } else {
    db!.users.push(newUser);
    saveDatabase(db!);
    recordAuditLog({
      action: 'ACCOUNT_CREATED',
      actor: req.user!.username,
      actorRole: req.user!.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: `Created admin user "${newUser.username}" (${newUser.role}).`,
      severity: 'info'
    });
  }

  res.json({ success: true, user: { id: newUser.id, username: newUser.username } });
});

apiRouter.put('/auth/users/:id', requireAuth, requireMaster, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  const target = getDataSourceMode() === 'postgres'
    ? await postgresAuthRepository.findUserById(id)
    : db!.users.find(u => u.id === id) || null;

  if (!target) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  if (target.stakeholderType === 'Master' || target.username === 'admin') {
    res.status(403).json({ success: false, error: 'The Root Master Admin account cannot be modified here.' });
    return;
  }

  const body = req.body || {};
  const nextRole = body.role !== undefined ? String(body.role).trim() : target.role;
  const policy = ROLE_POLICIES[nextRole];
  if (!policy) {
    res.status(400).json({ success: false, error: 'Unsupported account role.' });
    return;
  }

  const nextName = body.name !== undefined ? String(body.name).trim() : target.name;
  if (!nextName || nextName.length > 160) {
    res.status(400).json({ success: false, error: 'Name is required and must be at most 160 characters.' });
    return;
  }

  if (body.division !== undefined && String(body.division) !== policy.division) {
    res.status(400).json({ success: false, error: 'Division is derived from the selected role and cannot be overridden.' });
    return;
  }

  const nextStatus = body.status !== undefined ? String(body.status) : target.status;
  if (!['active', 'suspended'].includes(nextStatus)) {
    res.status(400).json({ success: false, error: 'Invalid account status.' });
    return;
  }

  const updated = getDataSourceMode() === 'postgres'
    ? await postgresAuthRepository.updateUserPolicy(
        target.id,
        nextName,
        nextRole,
        policy.stakeholderType,
        policy.permissions,
        policy.division,
        nextStatus as StoredUser['status'],
        makeAuditEntry(req, 'ACCOUNT_UPDATED', `Updated admin user "${target.username}" policy to "${nextRole}" and status "${nextStatus}".`, 'warning')
      )
    : (() => {
        target.name = nextName;
        target.role = nextRole;
        target.stakeholderType = policy.stakeholderType;
        target.division = policy.division;
        target.permissions = policy.permissions;
        target.status = nextStatus as StoredUser['status'];
        if (target.status === 'suspended') db!.sessions = db!.sessions.filter(session => session.userId !== target.id);
        saveDatabase(db!);
        return target;
      })();

  if (!updated) {
    res.status(409).json({ success: false, error: 'User could not be updated.' });
    return;
  }

  if (getDataSourceMode() === 'json')   recordAuditLog({
    action: 'ACCOUNT_UPDATED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Updated admin user "${target.username}" policy to "${nextRole}" and status "${nextStatus}".`,
    severity: 'warning'
  });

  res.json({
    success: true,
    user: {
      id: updated.id,
      name: updated.name,
      username: updated.username,
      email: updated.email,
      role: updated.role,
      stakeholderType: updated.stakeholderType,
      permissions: updated.permissions,
      division: updated.division,
      status: updated.status
    }
  });
});

apiRouter.delete('/auth/users/:id', requireAuth, requireMaster, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  const target = getDataSourceMode() === 'postgres'
    ? await postgresAuthRepository.findUserById(id)
    : db!.users.find(u => u.id === id) || null;

  if (!target) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  if (target.stakeholderType === 'Master' || target.username === 'admin') {
    res.status(403).json({ success: false, error: 'Cannot delete the Root Master Admin account.' });
    return;
  }

  if (getDataSourceMode() === 'postgres') {
    const deleted = await postgresAuthRepository.deleteUser(id, makeAuditEntry(req, 'ACCOUNT_DELETED', `Deleted user "${target.username}".`, 'warning'));
    if (!deleted) {
      res.status(409).json({ success: false, error: 'User could not be deleted.' });
      return;
    }
  } else {
    db!.users = db!.users.filter(u => u.id !== id);
    db!.sessions = db!.sessions.filter(s => s.userId !== id);
    saveDatabase(db!);
  }

  if (getDataSourceMode() === 'json')   recordAuditLog({
    action: 'ACCOUNT_DELETED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Deleted user "${target.username}".`,
    severity: 'warning'
  });

  res.json({ success: true, message: 'User deleted.' });
});


// ----------------------------------------------------
// 2. LEADS & CONTACT SUBMISSIONS
// ----------------------------------------------------

apiRouter.post('/leads/submit', rateLimitPublic(10, 60 * 1000), async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, company, phone, services, budget, message, source, type, portfolioUrl, rateCard, specialty, website } = req.body;

  if (website) {
    res.status(400).json({ success: false, error: 'Submission rejected.' });
    return;
  }

  const origin = req.get('origin');
  if (origin && !/^https:\/\/(?:www\.)?kapitech\.id$/i.test(origin) && !/^https:\/\/ams\.kapitech\.id$/i.test(origin)) {
    res.status(403).json({ success: false, error: 'Submission origin is not allowed.' });
    return;
  }

  if (!fullName || !email || !message) {
    res.status(400).json({ success: false, error: 'Name, email, and message are required fields.' });
    return;
  }
  if (String(fullName).length > 160 || String(message).length > MAX_PUBLIC_TEXT || String(company || '').length > 200) {
    res.status(400).json({ success: false, error: 'Submission contains fields that exceed the allowed length.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    res.status(400).json({ success: false, error: 'Invalid email address.' });
    return;
  }

  const now = new Date().toISOString();
  const normalizedServices = normalizeStringArray(services, 20, 120);
  const newLead = {
    id: `lead_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    fullName: cleanText(fullName, 160),
    email: cleanEmail,
    company: cleanText(company, 200),
    phone: cleanText(phone, 80),
    services: normalizedServices,
    budget: cleanText(budget, 160),
    message: cleanText(message, MAX_PUBLIC_TEXT),
    status: 'new',
    source: cleanText(source || 'Website Form', 120),
    type: cleanText(type || 'inquiry', 80),
    portfolioUrl: cleanOptionalUrl(portfolioUrl),
    rateCard: cleanText(rateCard, 120),
    specialty: cleanText(specialty, 160),
    createdAt: now,
    updatedAt: now
  };

  let jsonDb: ReturnType<typeof getDatabase> | undefined;
  let notificationSettings: {
    isTelegramActive: boolean;
    telegramChatId: string;
    telegramBotToken?: string;
  };

  if (getDataSourceMode() === 'postgres') {
    await postgresLeadRepository.create(
      newLead,
      {
        action: 'LEAD_SUBMISSION',
        actor: cleanEmail,
        actorRole: 'public_lead',
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
        details: `New inbound lead received from ${newLead.fullName} (${cleanEmail}).`,
        severity: 'info'
      }
    );
    const postgresNotificationSettings = await postgresNotificationSettingsRepository.get();
    notificationSettings = postgresNotificationSettings;
  } else {
    jsonDb = getDatabase();
    jsonDb.leads.unshift(newLead);
    saveDatabase(jsonDb);
    notificationSettings = jsonDb.notificationSettings;
  }

  void dispatchLeadTelegramNotification(newLead, notificationSettings);

  pushNotification(getDataSourceMode() === 'json' ? jsonDb : undefined, {
    title: 'New inbound lead',
    message: `${newLead.fullName}${newLead.company ? ` from ${newLead.company}` : ''} submitted a new inquiry.`,
    type: 'lead',
    severity: 'info',
    linkUrl: '/admin/inbox'
  });

  if (jsonDb) saveDatabase(jsonDb);

  if (getDataSourceMode() === 'json') recordAuditLog({
    action: 'LEAD_SUBMISSION',
    actor: cleanEmail,
    actorRole: 'public_lead',
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `New inbound lead received from ${newLead.fullName} (${cleanEmail}).`,
    severity: 'info'
  });

  res.json({ success: true, message: 'Inquiry submitted successfully.', id: newLead.id });
});

apiRouter.get('/leads', requireAuth, requirePermission('canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const leads = getDataSourceMode() === 'postgres' ? await postgresLeadRepository.list() : (await loadApplicationDatabase()).leads;
  res.json({ success: true, leads });
});

apiRouter.put('/leads/:id', requireAuth, requirePermission('canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body || {};
  const patch = pickFields(updates, [
    'fullName', 'email', 'company', 'phone', 'services', 'budget', 'message',
    'status', 'source', 'type', 'portfolioUrl', 'rateCard', 'specialty'
  ]);
  if (patch.email !== undefined) patch.email = cleanText(patch.email, 254).toLowerCase();
  if (patch.fullName !== undefined) patch.fullName = cleanText(patch.fullName, 160);
  if (patch.company !== undefined) patch.company = cleanText(patch.company, 200);
  if (patch.message !== undefined) patch.message = cleanText(patch.message, MAX_PUBLIC_TEXT);
  if (patch.services !== undefined) patch.services = Array.isArray(patch.services) ? patch.services.slice(0, 20).map((v) => cleanText(v, 120)) : [];
  if (patch.portfolioUrl !== undefined) patch.portfolioUrl = cleanOptionalUrl(patch.portfolioUrl);

  if (getDataSourceMode() === 'postgres') {
    const lead = await postgresLeadRepository.update(id, patch, makeAuditEntry(req, 'LEAD_UPDATED', `Updated lead ${patch.fullName || id} (status: ${patch.status || 'unchanged'}).`, 'info'));
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found.' });
      return;
    }
    res.json({ success: true, lead });
    return;
  }

  const db = getDatabase();
  const idx = db.leads.findIndex(l => l.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Lead not found.' });
    return;
  }
  db.leads[idx] = { ...db.leads[idx], ...patch, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  recordAuditLog({ action: 'LEAD_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Updated lead ${db.leads[idx].fullName} (status: ${db.leads[idx].status}).`, severity: 'info' });
  res.json({ success: true, lead: db.leads[idx] });
});

apiRouter.delete('/leads/:id', requireAuth, requirePermission('canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    const lead = await postgresLeadRepository.findById(id);
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found.' });
      return;
    }
    try { await postgresLeadRepository.delete(id, makeAuditEntry(req, 'LEAD_DELETED', `Deleted lead ${lead.fullName} (${lead.email}).`, 'warning')); } catch(error) { if(error instanceof Error&&error.message==='LEAD_IS_CLOSED'){res.status(409).json({success:false,error:'Closed leads are retained as business history and cannot be deleted.'});return;} throw error; }
    res.json({ success: true, message: 'Lead removed.' });
    return;
  }

  const db = getDatabase();
  const lead = db.leads.find(l => l.id === id);
  if (!lead) {
    res.status(404).json({ success: false, error: 'Lead not found.' });
    return;
  }
  db.leads = db.leads.filter(l => l.id !== id);
  saveDatabase(db);
  recordAuditLog({ action: 'LEAD_DELETED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Deleted lead ${lead.fullName} (${lead.email}).`, severity: 'warning' });
  res.json({ success: true, message: 'Lead removed.' });
});

apiRouter.post('/leads/:id/convert', requireAuth, requirePermission('canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    const lead = await postgresLeadRepository.findById(id);
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found.' });
      return;
    }

    const existingClient = (await postgresClientRepository.list()).find((client) => client.email.toLowerCase() === String(lead.email).toLowerCase());
    const client = existingClient || {
      id: `cli_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      name: lead.fullName,
      company: lead.company || lead.fullName,
      email: lead.email,
      phone: lead.phone || '',
      location: '',
      industry: '',
      status: 'active',
      totalSpend: 0,
      projectsCount: 0,
      contactPersonRole: '',
      notes: `Converted from inbound lead on ${new Date().toLocaleDateString('id-ID')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const leadValue = Number(lead.dealValue ?? lead.value ?? 0);
    const deal = {
      id: `deal_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      title: `${lead.company || lead.fullName} - ${lead.services?.join(', ') || 'Digital Project'}`,
      clientName: lead.fullName,
      company: lead.company || lead.fullName,
      value: Number.isFinite(leadValue) && leadValue >= 0 ? leadValue : 0,
      stage: 'new',
      probability: normalizeProbability(lead.probability),
      owner: req.user!.name || req.user!.username,
      expectedCloseDate: /^\d{4}-\d{2}-\d{2}$/.test(String(lead.expectedCloseDate || '')) ? String(lead.expectedCloseDate) : '',
      notes: lead.message,
      priority: DEAL_PRIORITIES.includes(String(lead.priority) as any) ? String(lead.priority) : 'medium',
      source: lead.source || 'Website',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingClient) {
      try {
        const createdDeal = await postgresCrmDealRepository.convertLead(lead, existingClient, deal, true, makeAuditEntry(req, 'LEAD_CONVERTED', `Converted lead "${lead.fullName}" into CRM Deal using existing client.`, 'info'));
        res.json({ success: true, client: existingClient, deal: createdDeal.deal });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Lead conversion could not be completed.';
        if (message.includes('already been converted') || message.includes('during conversion')) {
          res.status(409).json({ success: false, error: message });
          return;
        }
        throw error;
      }
      return;
    }

    try {
      const converted = await postgresCrmDealRepository.convertLead(lead, client, deal, false, makeAuditEntry(req, 'LEAD_CONVERTED', `Converted lead "${lead.fullName}" into Client & CRM Deal.`, 'info'));
      res.json({ success: true, client, deal: converted.deal });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lead conversion could not be completed.';
      if (message.includes('already been converted') || message.includes('during conversion')) {
        res.status(409).json({ success: false, error: message });
        return;
      }
      throw error;
    }
    return;
  }

  const db = getDatabase();
  const lead = db.leads.find(l => l.id === id);
  if (!lead) {
    res.status(404).json({ success: false, error: 'Lead not found.' });
    return;
  }
  let client = db.clients.find(c => c.email.toLowerCase() === lead.email.toLowerCase());
  if (!client) {
    client = {
      id: `cli_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      companyName: lead.company || lead.fullName,
      clientName: lead.fullName,
      email: lead.email,
      phone: lead.phone || '',
      address: '',
      status: 'active',
      tier: 'Standard',
      totalProjects: 1,
      totalInvoiced: 0,
      activeRetainer: false,
      notes: `Converted from inbound lead on ${new Date().toLocaleDateString('id-ID')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.clients.push(client);
  }
  const leadValue = Number(lead.dealValue ?? lead.value ?? 0);
  const deal = {
    id: `deal_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    title: `${lead.company || lead.fullName} - ${lead.services?.join(', ') || 'Digital Project'}`,
    clientName: lead.fullName,
    company: lead.company || lead.fullName,
    value: Number.isFinite(leadValue) && leadValue >= 0 ? leadValue : 0,
    stage: 'new',
    probability: normalizeProbability(lead.probability),
    owner: req.user!.name || req.user!.username,
    expectedCloseDate: /^\d{4}-\d{2}-\d{2}$/.test(String(lead.expectedCloseDate || '')) ? String(lead.expectedCloseDate) : '',
    notes: lead.message,
    priority: DEAL_PRIORITIES.includes(String(lead.priority) as any) ? String(lead.priority) : 'medium',
    source: lead.source || 'Website',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.crmDeals.push(deal);
  lead.status = 'closed';
  lead.updatedAt = new Date().toISOString();
  saveDatabase(db);
  recordAuditLog({ action: 'LEAD_CONVERTED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Converted lead "${lead.fullName}" into Client & CRM Deal.`, severity: 'info' });
  res.json({ success: true, client, deal });
});

// ----------------------------------------------------
// ----------------------------------------------------

apiRouter.get('/crm/deals', requireAuth, requirePermission('canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const deals = getDataSourceMode() === 'postgres'
    ? await postgresCrmDealRepository.list()
    : (await loadApplicationDatabase()).crmDeals;
  res.json({ success: true, deals });
});

apiRouter.post('/crm/deals', requireAuth, requirePermission('canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const dealData = req.body || {};
  const requestedStage = String(dealData.stage || 'new');
  const requestedPriority = String(dealData.priority || 'medium');
  if (!CRM_STAGES.includes(requestedStage as any) || !DEAL_PRIORITIES.includes(requestedPriority as any)) {
    res.status(400).json({ success: false, error: 'Invalid CRM stage or priority.' });
    return;
  }
  const value = Number(dealData.value);
  if (!Number.isFinite(value) || value < 0 || value > 100_000_000_000) {
    res.status(400).json({ success: false, error: 'Deal value must be a valid non-negative amount.' });
    return;
  }
  const newDeal = {
    id: `deal_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    title: cleanText(dealData.title, 200),
    clientName: cleanText(dealData.clientName, 160),
    company: cleanText(dealData.company, 200),
    email: cleanText(dealData.email, 254).toLowerCase(),
    phone: cleanText(dealData.phone, 40),
    servicePillar: cleanText(dealData.servicePillar, 120),
    value,
    stage: requestedStage,
    probability: normalizeProbability(dealData.probability),
    owner: cleanText(dealData.owner || req.user!.name || req.user!.username, 160),
    expectedCloseDate: /^\d{4}-\d{2}-\d{2}$/.test(String(dealData.expectedCloseDate || '')) ? String(dealData.expectedCloseDate) : '',
    notes: cleanText(dealData.notes, 3000),
    priority: requestedPriority,
    source: cleanText(dealData.source || 'Internal', 120),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (getDataSourceMode() === 'postgres') {
    try {
      const deal = await postgresCrmDealRepository.create(newDeal, makeAuditEntry(req, 'CRM_DEAL_CREATED', `Created CRM deal "${newDeal.title || newDeal.id}".`, 'info'));
            res.json({ success: true, deal });
    } catch (error) {
      res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Deal could not be created.' });
    }
    return;
  }

  const db = getDatabase();
  db.crmDeals.unshift(newDeal);
  saveDatabase(db);
  recordAuditLog({
    action: 'CRM_DEAL_CREATED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Created CRM deal "${newDeal.title || newDeal.id}".`,
    severity: 'info'
  });
  res.json({ success: true, deal: newDeal });
});

apiRouter.put('/crm/deals/:id', requireAuth, requirePermission('canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body || {};
  const patch = pickFields(updates, [
    'title', 'clientName', 'company', 'email', 'phone', 'servicePillar',
    'value', 'stage', 'probability', 'owner', 'expectedCloseDate', 'notes',
    'priority', 'source'
  ]);
  if (patch.value !== undefined) {
    const value = Number(patch.value);
    if (!Number.isFinite(value) || value < 0 || value > 100_000_000_000) {
      res.status(400).json({ success: false, error: 'Deal value must be a valid non-negative amount.' });
      return;
    }
    patch.value = value;
  }
  if (patch.probability !== undefined) patch.probability = normalizeProbability(patch.probability);
  if (patch.stage !== undefined && !CRM_STAGES.includes(String(patch.stage) as any)) {
    res.status(400).json({ success: false, error: 'Invalid CRM stage.' });
    return;
  }
  if (patch.priority !== undefined && !DEAL_PRIORITIES.includes(String(patch.priority) as any)) {
    res.status(400).json({ success: false, error: 'Invalid CRM priority.' });
    return;
  }
  if (patch.email !== undefined) patch.email = cleanText(patch.email, 254).toLowerCase();
  for (const key of ['title','clientName','company','phone','servicePillar','owner','notes','source'] as const) {
    if (patch[key] !== undefined) patch[key] = cleanText(patch[key], key === 'notes' ? 3000 : 200);
  }
  if (patch.expectedCloseDate !== undefined) {
    patch.expectedCloseDate = /^\d{4}-\d{2}-\d{2}$/.test(String(patch.expectedCloseDate)) ? String(patch.expectedCloseDate) : '';
  }

  if (getDataSourceMode() === 'postgres') {
    const deal = await postgresCrmDealRepository.update(id, patch, makeAuditEntry(req, 'CRM_DEAL_UPDATED', `Updated CRM deal "${patch.title || id}".`, 'info'));
    if (!deal) {
      res.status(404).json({ success: false, error: 'Deal not found.' });
      return;
    }
        res.json({ success: true, deal });
    return;
  }

  const db = getDatabase();
  const idx = db.crmDeals.findIndex(d => d.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Deal not found.' });
    return;
  }
  db.crmDeals[idx] = { ...db.crmDeals[idx], ...patch, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  recordAuditLog({
    action: 'CRM_DEAL_UPDATED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Updated CRM deal "${db.crmDeals[idx].title || id}".`,
    severity: 'info'
  });
  res.json({ success: true, deal: db.crmDeals[idx] });
});

apiRouter.post('/crm/deals/:id/convert-to-project', requireAuth,
  requirePermission('canManageCrm'),
  requirePermission('canManageProjects'),
  requirePermission('canManageInvoices'),
  requirePermission('canManageClients'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (getDataSourceMode() !== 'postgres') {
      res.status(409).json({ success: false, error: 'Won-deal conversion requires PostgreSQL production mode.' });
      return;
    }

    try {
      const result = await postgresCrmDealRepository.convertWonDeal(
        String(req.params.id),
        { userId: req.user!.id, username: req.user!.username },
        makeAuditEntry(req, 'CRM_DEAL_CONVERTED', `Converted won CRM deal "${req.params.id}" into client, project, and invoice records.`, 'info')
      );
      res.status(result.replayed ? 200 : 201).json({
        success: true,
        replayed: result.replayed,
        client: result.client,
        project: result.project,
        invoice: result.invoice
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CRM deal conversion failed.';
      const status =
        message === 'DEAL_NOT_FOUND' ? 404 :
        ['DEAL_NOT_WON','DEAL_VALUE_REQUIRED','DEAL_CLIENT_NOT_FOUND','DEAL_PROJECT_CLIENT_MISMATCH','DEAL_INVOICE_CLIENT_MISMATCH','DEAL_INVOICE_PROJECT_MISMATCH','AMBIGUOUS_DEAL_CLIENT','INCOMPLETE_DEAL_CONVERSION','MULTIPLE_PROJECTS_FOR_DEAL','MULTIPLE_INVOICES_FOR_DEAL','MULTIPLE_TASKS_FOR_DEAL'].includes(message) ? 409 :
        400;
      res.status(status).json({ success: false, error: message });
    }
  });

apiRouter.delete('/crm/deals/:id', requireAuth, requirePermission('canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    const deal = await postgresCrmDealRepository.findById(id);
    if (!deal) {
      res.status(404).json({ success: false, error: 'Deal not found.' });
      return;
    }
    try { await postgresCrmDealRepository.delete(id, makeAuditEntry(req, 'CRM_DEAL_DELETED', `Deleted CRM deal "${deal.title || id}".`, 'warning')); } catch(error) { if(error instanceof Error&&error.message==='DEAL_HAS_PROPOSALS'){res.status(409).json({success:false,error:'Deal is referenced by proposals and cannot be deleted.'});return;} throw error; }
        res.json({ success: true, message: 'Deal deleted.' });
    return;
  }

  const db = getDatabase();
  const deal = db.crmDeals.find(d => d.id === id);
  if (!deal) {
    res.status(404).json({ success: false, error: 'Deal not found.' });
    return;
  }
  db.crmDeals = db.crmDeals.filter(d => d.id !== id);
  saveDatabase(db);
  recordAuditLog({
    action: 'CRM_DEAL_DELETED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Deleted CRM deal "${deal.title || id}".`,
    severity: 'warning'
  });
  res.json({ success: true, message: 'Deal deleted.' });
});

// ----------------------------------------------------
// 4. CLIENTS MANAGEMENT
// ----------------------------------------------------

apiRouter.get('/clients', requireAuth, requireAnyPermission('canManageClients', 'canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const clients = getDataSourceMode() === 'postgres' ? await postgresClientRepository.list() : getDatabase().clients;
  res.json({ success: true, clients });
});

apiRouter.post('/clients', requireAuth, requirePermission('canManageClients'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const clientData = req.body || {};
  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  const email = cleanText(clientData.email, 254).toLowerCase();
  const website = cleanOptionalUrl(clientData.website);
  const avatarUrl = cleanOptionalUrl(clientData.avatarUrl);
  const totalSpend = normalizeNumber(clientData.totalSpend ?? 0, 0, MAX_MONEY, 0);
  const projectsCount = normalizeNumber(clientData.projectsCount ?? 0, 0, 100000, 0);
  const slaBudget = normalizeNumber(clientData.slaDailyAdSpendBudget ?? 0, 0, MAX_MONEY, 0);
  const currentSpend = normalizeNumber(clientData.currentDailyAdSpend ?? 0, 0, MAX_MONEY, 0);

  if (email && !isValidEmail(email)) {
    res.status(400).json({ success: false, error: 'Invalid client email address.' });
    return;
  }
  if (clientData.status !== undefined && !['active','inactive','prospect','on_hold'].includes(String(clientData.status))) {
    res.status(400).json({ success: false, error: 'Invalid client status.' });
    return;
  }

  const newClient = {
    id: `cli_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    ...pickFields(clientData, ['name','company','companyName','clientName','email','phone','website','location','industry','status','contactPersonRole','notes']),
    name: cleanText(clientData.name || clientData.clientName, 160),
    company: cleanText(clientData.company || clientData.companyName, 200),
    clientName: cleanText(clientData.clientName || clientData.name, 160),
    email,
    phone: cleanText(clientData.phone, 40),
    website,
    location: cleanText(clientData.location, 160),
    industry: cleanText(clientData.industry, 160),
    status: clientData.status === 'prospect' ? 'lead' : clientData.status === 'on_hold' ? 'inactive' : clientData.status ? String(clientData.status) : 'lead',
    totalSpend: totalSpend ?? 0,
    projectsCount: projectsCount ?? 0,
    contactPersonRole: cleanText(clientData.contactPersonRole, 160),
    notes: cleanText(clientData.notes, 3000),
    avatarUrl,
    slaDailyAdSpendBudget: slaBudget ?? 0,
    currentDailyAdSpend: currentSpend ?? 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (getDataSourceMode() === 'postgres') {
    const client = await postgresClientRepository.create(newClient as any, makeAuditEntry(req, 'CLIENT_CREATED', `Created client "${newClient.company || newClient.clientName}".`, 'info'));
        res.json({ success: true, client });
    return;
  }
  db!.clients.unshift(newClient);
  saveDatabase(db!);

  recordAuditLog({
    action: 'CLIENT_CREATED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Created client "${newClient.company || newClient.clientName}".`,
    severity: 'info'
  });

  res.json({ success: true, client: newClient });
});

apiRouter.put('/clients/:id', requireAuth, requirePermission('canManageClients'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body || {};
  if (getDataSourceMode() === 'postgres') {
    const patch = pickFields(updates || {}, ['name','company','companyName','clientName','email','phone','website','location','industry','status','contactPersonRole','notes','avatarUrl','slaDailyAdSpendBudget','currentDailyAdSpend','tier','activeRetainer']);
    if (patch.email !== undefined) patch.email = cleanText(patch.email, 254).toLowerCase();
    if (patch.email && !isValidEmail(patch.email)) { res.status(400).json({ success: false, error: 'Invalid client email address.' }); return; }
    if (patch.website !== undefined) patch.website = cleanOptionalUrl(patch.website);
    if (patch.status !== undefined && !['active','inactive','prospect','on_hold'].includes(String(patch.status))) { res.status(400).json({ success: false, error: 'Invalid client status.' }); return; }
    const updated = await postgresClientRepository.update(id, patch as any, makeAuditEntry(req, 'CLIENT_UPDATED', `Updated client ${id}.`, 'info'));
    if (!updated) { res.status(404).json({ success: false, error: 'Client not found.' }); return; }
        res.json({ success: true, client: updated });
    return;
  }
  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  const idx = db?.clients.findIndex(c => c.id === id) ?? -1;
  if (idx === -1 && getDataSourceMode() === 'json') {
    res.status(404).json({ success: false, error: 'Client not found.' });
    return;
  }
  const patch = pickFields(updates || {}, ['name', 'companyName', 'clientName', 'email', 'phone', 'address', 'website', 'location', 'industry', 'status', 'tier', 'totalProjects', 'totalInvoiced', 'activeRetainer', 'notes', 'slaDailyAdSpendBudget', 'currentDailyAdSpend']);
  if (patch.email !== undefined) {
    patch.email = cleanText(patch.email, 254).toLowerCase();
    if (patch.email && !isValidEmail(patch.email)) {
      res.status(400).json({ success: false, error: 'Invalid client email address.' });
      return;
    }
  }
  if (patch.website !== undefined) patch.website = cleanOptionalUrl(patch.website);
  if (patch.status !== undefined && !['active','inactive','prospect','on_hold','completed','lead'].includes(String(patch.status))) {
    res.status(400).json({ success: false, error: 'Invalid client status.' });
    return;
  }
  if (patch.status === 'prospect') patch.status = 'lead';
  if (patch.status === 'on_hold') patch.status = 'inactive';
  for (const key of ['name','companyName','clientName','phone','address','location','industry','tier','notes'] as const) {
    if (patch[key] !== undefined) patch[key] = cleanText(patch[key], key === 'notes' ? 3000 : 200);
  }
  for (const key of ['totalProjects','totalInvoiced','slaDailyAdSpendBudget','currentDailyAdSpend'] as const) {
    if (patch[key] !== undefined) {
      const numeric = normalizeNumber(patch[key], 0, key === 'totalProjects' ? 100000 : MAX_MONEY);
      if (numeric === null) {
        res.status(400).json({ success: false, error: `Invalid numeric value for ${key}.` });
        return;
      }
      patch[key] = numeric;
    }
  }
  if (patch.activeRetainer !== undefined) patch.activeRetainer = Boolean(patch.activeRetainer);
  const updatedAt = new Date().toISOString();
  const updatedClient = { ...db!.clients[idx], ...patch, updatedAt };
  if (!updatedClient) { res.status(404).json({ success: false, error: 'Client not found.' }); return; }
  db!.clients[idx] = updatedClient;
  saveDatabase(db!);
  recordAuditLog({
    action: 'CLIENT_UPDATED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Updated client ${id}.`,
    severity: 'info'
  });
  res.json({ success: true, client: updatedClient });
});

apiRouter.delete('/clients/:id', requireAuth, requirePermission('canManageClients'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    let deleted:boolean;
    try { deleted=await postgresClientRepository.delete(id, makeAuditEntry(req, 'CLIENT_DELETED', `Deleted client ${id}.`, 'warning')); } catch(error) { if(error instanceof Error&&error.message==='CLIENT_HAS_BUSINESS_RECORDS'){res.status(409).json({success:false,error:'Client has business records and cannot be deleted.'});return;} throw error; }
    if (!deleted) { res.status(404).json({ success: false, error: 'Client not found.' }); return; }
        res.json({ success: true, message: 'Client deleted.' });
    return;
  }
  {
    const db = getDatabase();
    const client = db.clients.find(c => c.id === id);
    if (!client) { res.status(404).json({ success: false, error: 'Client not found.' }); return; }
    db.clients = db.clients.filter(c => c.id !== id);
    saveDatabase(db);
    recordAuditLog({
      action: 'CLIENT_DELETED',
      actor: req.user!.username,
      actorRole: req.user!.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: `Deleted client "${client.company || client.clientName || id}".`,
      severity: 'warning'
    });
  }
  res.json({ success: true, message: 'Client deleted.' });
});

// ----------------------------------------------------
// 5. PROJECTS MANAGEMENT
// ----------------------------------------------------

apiRouter.get('/projects', requireAuth, requireAnyPermission('canManageProjects', 'canManageKanbanTasks'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projects = getDataSourceMode() === 'postgres' ? await postgresProjectRepository.list() : getDatabase().projects;
  res.json({ success: true, projects });
});

apiRouter.post('/projects', requireAuth, requirePermission('canManageProjects'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const projectData = req.body || {};
  const progressPercent = Math.min(100, Math.max(0, Number(projectData.progressPercent) || 0));
  const budget = Number(projectData.budget);
  if (!Number.isFinite(budget) || budget < 0 || budget > 100_000_000_000) {
    res.status(400).json({ success: false, error: 'Project budget must be a valid non-negative amount.' });
    return;
  }
  const now = new Date().toISOString();
  const newProject = {
    id: `proj_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    name: cleanText(projectData.name || projectData.title, 200),
    title: cleanText(projectData.title || projectData.name, 200),
    client: cleanText(projectData.client || projectData.clientCompany, 200),
    clientId: cleanText(projectData.clientId, 100) || undefined,
    clientName: cleanText(projectData.clientName, 160),
    clientCompany: cleanText(projectData.clientCompany || projectData.client, 200),
    clientEmail: cleanText(projectData.clientEmail, 254).toLowerCase(),
    crmLeadId: cleanText(projectData.crmLeadId, 100),
    serviceCategory: cleanText(projectData.serviceCategory, 120),
    status: ['planning','in_progress','review','completed','on_hold'].includes(String(projectData.status)) ? String(projectData.status) : 'planning',
    health: ['Good','At Risk','Delayed','Blocked'].includes(String(projectData.health)) ? String(projectData.health) : 'Good',
    budget,
    progressPercent,
    startDate: normalizeDate(projectData.startDate, now.slice(0,10)),
    targetEndDate: normalizeDate(projectData.targetEndDate, new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10)),
    teamLead: cleanText(projectData.teamLead, 160),
    teamMembers: Array.isArray(projectData.teamMembers) ? projectData.teamMembers.slice(0,50).map((v: unknown) => cleanText(v,160)) : [],
    techStack: Array.isArray(projectData.techStack) ? projectData.techStack.slice(0,50).map((v: unknown) => cleanText(v,120)) : [],
    milestones: Array.isArray(projectData.milestones) ? projectData.milestones.slice(0,50) : [],
    tasks: Array.isArray(projectData.tasks) ? projectData.tasks.slice(0,200) : [],
    repositoryUrl: cleanOptionalUrl(projectData.repositoryUrl),
    figmaUrl: cleanOptionalUrl(projectData.figmaUrl),
    liveStagingUrl: cleanOptionalUrl(projectData.liveStagingUrl),
    notes: cleanText(projectData.notes, 3000),
    createdAt: now,
    updatedAt: now
  };

  const jsonProjectDb = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  if (newProject.clientId && jsonProjectDb && !(jsonProjectDb.clients || []).some((client: any) => String(client.id) === String(newProject.clientId))) {
    res.status(404).json({ success: false, error: 'Client not found.' });
    return;
  }
  if (jsonProjectDb) {
    const taskIds = new Set<string>();
    for (const task of newProject.tasks as any[]) {
      const taskId = String(task?.id || '');
      if (!taskId || taskIds.has(taskId)) {
        res.status(400).json({ success: false, error: 'Project tasks require unique IDs.' });
        return;
      }
      taskIds.add(taskId);
      if (!['todo','in_progress','review','done'].includes(String(task?.status || 'todo'))) {
        res.status(400).json({ success: false, error: 'Invalid task status.' });
        return;
      }
      if (!['low','medium','high','urgent'].includes(String(task?.priority || 'medium'))) {
        res.status(400).json({ success: false, error: 'Invalid task priority.' });
        return;
      }
    }
  }

  if (newProject.tasks.length > 0 && req.user!.stakeholderType !== 'Master' && !req.user!.permissions?.canManageKanbanTasks) {
    res.status(403).json({ success: false, error: 'Task mutations require task-management permission.' });
    return;
  }
  if (getDataSourceMode() === 'postgres') {
    const project = await postgresProjectRepository.create(newProject as any, makeAuditEntry(req, 'PROJECT_CREATED', `Created project "${newProject.name}".`, 'info'));
    res.json({ success: true, project });
    return;
  }
  const db = getDatabase();
  db.projects.unshift(newProject);
  saveDatabase(db);
  recordAuditLog({
    action: 'PROJECT_CREATED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Created project "${newProject.name}".`,
    severity: 'info'
  });
  res.json({ success: true, project: newProject });
});

apiRouter.put('/projects/:id', requireAuth, requirePermission('canManageProjects'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body || {};
  if (getDataSourceMode() === 'postgres') {
    const existingProject = await postgresProjectRepository.findById(id);
    if (!existingProject) { res.status(404).json({ success: false, error: 'Project not found.' }); return; }
    const patch = pickFields(updates, ['title','name','client','clientId','clientName','clientCompany','clientEmail','serviceCategory','status','health','budget','progressPercent','startDate','targetEndDate','teamLead','teamMembers','techStack','repositoryUrl','figmaUrl','liveStagingUrl','notes','tasks','milestones','crmLeadId','updatedAt']);
    if (patch.clientEmail !== undefined) {
      patch.clientEmail = cleanText(patch.clientEmail, 254).toLowerCase();
      if (patch.clientEmail && !isValidEmail(patch.clientEmail)) { res.status(400).json({ success: false, error: 'Invalid project client email address.' }); return; }
    }
    if (patch.status !== undefined && !['planning','in_progress','review','completed','on_hold'].includes(String(patch.status))) { res.status(400).json({ success: false, error: 'Invalid project status.' }); return; }
    if (patch.health !== undefined && !['Good','At Risk','Delayed','Blocked'].includes(String(patch.health))) { res.status(400).json({ success: false, error: 'Invalid project health state.' }); return; }
    if (patch.budget !== undefined) {
      const numeric = normalizeNumber(patch.budget, 0, MAX_MONEY);
      if (numeric === null) { res.status(400).json({ success: false, error: 'Invalid project budget.' }); return; }
      patch.budget = numeric;
    }
    if (patch.progressPercent !== undefined) {
      const progress = normalizeNumber(patch.progressPercent, 0, 100);
      if (progress === null) { res.status(400).json({ success: false, error: 'Invalid project progress.' }); return; }
      patch.progressPercent = progress;
    }
    for (const key of ['startDate','targetEndDate'] as const) {
      if (patch[key] !== undefined && !isValidDate(patch[key])) { res.status(400).json({ success: false, error: `Invalid project date for ${key}.` }); return; }
    }
    for (const key of ['repositoryUrl','figmaUrl','liveStagingUrl'] as const) {
      if (patch[key] !== undefined) patch[key] = cleanOptionalUrl(patch[key]);
    }
    if (patch.teamMembers !== undefined) patch.teamMembers = normalizeStringArray(patch.teamMembers, 50, 160);
    if (patch.techStack !== undefined) patch.techStack = normalizeStringArray(patch.techStack, 50, 120);
    if (patch.tasks !== undefined) {
      patch.tasks = Array.isArray(patch.tasks) ? patch.tasks.slice(0, 200) : [];
      if (req.user!.stakeholderType !== 'Master' && !req.user!.permissions?.canManageKanbanTasks) {
        if (taskMutationFingerprint(existingProject.tasks) !== taskMutationFingerprint(patch.tasks)) {
          res.status(403).json({ success: false, error: 'Task mutations require task-management permission.' });
          return;
        }
        delete (patch as any).tasks;
      }
    }
    if (patch.milestones !== undefined) patch.milestones = Array.isArray(patch.milestones) ? patch.milestones.slice(0, 50) : [];
    try {
      const project = await postgresProjectRepository.update(id, patch as any, makeAuditEntry(req, 'PROJECT_UPDATED', `Updated project ${id}.`));
      if (!project) { res.status(404).json({ success: false, error: 'Project not found.' }); return; }
      res.json({ success: true, project });
    } catch (error) {
      if (error instanceof ProjectConcurrencyError) { res.status(409).json({ success: false, error: error.message, code: 'PROJECT_CONFLICT' }); return; }
      if (error instanceof Error && error.message === 'TASK_HAS_TIME_LOGS') { res.status(409).json({ success: false, error: 'A task with time logs cannot be removed from the project.', code: 'TASK_HAS_TIME_LOGS' }); return; }
      if (error instanceof Error && ['DUPLICATE_TASK_ID','INVALID_TASK_STATUS','INVALID_TASK_PRIORITY','TASK_ID_REQUIRED','ASSIGNEE_NOT_FOUND'].includes(error.message)) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      throw error;
    }
    return;
  }
  const db = getDatabase();
  const idx = db.projects.findIndex(p => p.id === id);
  if (idx === -1) { res.status(404).json({ success: false, error: 'Project not found.' }); return; }
  const patch = pickFields(updates || {}, ['title', 'name', 'client', 'clientId', 'clientName', 'clientCompany', 'clientEmail', 'serviceCategory', 'status', 'health', 'budget', 'progressPercent', 'startDate', 'targetEndDate', 'teamLead', 'teamMembers', 'techStack', 'repositoryUrl', 'figmaUrl', 'liveStagingUrl', 'notes', 'tasks']);
  if (patch.clientId !== undefined && patch.clientId && !(db.clients || []).some((client: any) => String(client.id) === String(patch.clientId))) {
    res.status(404).json({ success: false, error: 'Client not found.' });
    return;
  }
  if (patch.clientId !== undefined && String(patch.clientId || '') !== String(db.projects[idx].clientId || '')) {
    const linkedBusiness = (db.proposals || []).some((item: any) => String(item.projectId || '') === id)
      || (db.invoices || []).some((item: any) => String(item.projectId || '') === id);
    if (linkedBusiness) {
      res.status(409).json({ success: false, error: 'Project client cannot be changed after proposal or invoice linkage.' });
      return;
    }
  }
  for (const key of ['title','name','client','clientName','clientCompany','serviceCategory','teamLead','notes'] as const) {
    if (patch[key] !== undefined) patch[key] = cleanText(patch[key], key === 'notes' ? 3000 : 200);
  }
  if (patch.clientEmail !== undefined) { patch.clientEmail = cleanText(patch.clientEmail, 254).toLowerCase(); if (patch.clientEmail && !isValidEmail(patch.clientEmail)) { res.status(400).json({ success: false, error: 'Invalid project client email address.' }); return; } }
  if (patch.status !== undefined && !['planning','in_progress','review','completed','on_hold'].includes(String(patch.status))) { res.status(400).json({ success: false, error: 'Invalid project status.' }); return; }
  if (patch.health !== undefined && !['Good','At Risk','Delayed','Blocked'].includes(String(patch.health))) { res.status(400).json({ success: false, error: 'Invalid project health state.' }); return; }
  if (patch.budget !== undefined) { const numeric = normalizeNumber(patch.budget, 0, MAX_MONEY); if (numeric === null) { res.status(400).json({ success: false, error: 'Invalid project budget.' }); return; } patch.budget = numeric; }
  if (patch.progressPercent !== undefined) { const progress = normalizeNumber(patch.progressPercent, 0, 100); if (progress === null) { res.status(400).json({ success: false, error: 'Invalid project progress.' }); return; } patch.progressPercent = progress; }
  for (const key of ['startDate','targetEndDate'] as const) { if (patch[key] !== undefined && !isValidDate(patch[key])) { res.status(400).json({ success: false, error: `Invalid project date for ${key}.` }); return; } }
  for (const key of ['repositoryUrl','figmaUrl','liveStagingUrl'] as const) if (patch[key] !== undefined) patch[key] = cleanOptionalUrl(patch[key]);
  if (patch.teamMembers !== undefined) patch.teamMembers = normalizeStringArray(patch.teamMembers, 50, 160);
  if (patch.techStack !== undefined) patch.techStack = normalizeStringArray(patch.techStack, 50, 120);
  if (patch.tasks !== undefined) {
    const nextTasks: any[] = Array.isArray(patch.tasks) ? patch.tasks.slice(0, 200) : [];
    patch.tasks = nextTasks;
    const previousTasks: any[] = Array.isArray(db.projects[idx].tasks) ? db.projects[idx].tasks : [];
    const nextTaskIds = new Set(nextTasks.map((task: any) => String(task?.id || '')));
    const removedTaskIds = previousTasks.map((task: any) => String(task?.id || '')).filter(taskId => taskId && !nextTaskIds.has(taskId));
    if (removedTaskIds.some(taskId => (db.timeLogs || []).some((log: any) => String(log.taskId || '') === taskId))) {
      res.status(409).json({ success: false, error: 'A task with time logs cannot be removed from the project.' });
      return;
    }
    for (const task of nextTasks) {
      if (!['todo','in_progress','review','done'].includes(String(task?.status || 'todo'))) {
        res.status(400).json({ success: false, error: 'Invalid task status.' });
        return;
      }
      if (!['low','medium','high','urgent'].includes(String(task?.priority || 'medium'))) {
        res.status(400).json({ success: false, error: 'Invalid task priority.' });
        return;
      }
    }
    if (req.user!.stakeholderType !== 'Master' && !req.user!.permissions?.canManageKanbanTasks) {
      if (taskMutationFingerprint(db.projects[idx].tasks) !== taskMutationFingerprint(nextTasks)) {
        res.status(403).json({ success: false, error: 'Task mutations require task-management permission.' });
        return;
      }
      delete (patch as any).tasks;
    }
  }
  db.projects[idx] = { ...db.projects[idx], ...patch, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  recordAuditLog({ action: 'PROJECT_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Updated project ${id}.`, severity: 'info' });
  res.json({ success: true, project: db.projects[idx] });
});

apiRouter.delete('/projects/:id', requireAuth, requirePermission('canManageProjects'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    const project = await postgresProjectRepository.findById(id);
    if (!project) { res.status(404).json({ success: false, error: 'Project not found.' }); return; }
    let deleted:boolean;
    try { deleted=await postgresProjectRepository.delete(id, makeAuditEntry(req, 'PROJECT_DELETED', `Deleted project "${project.name}".`, 'warning')); } catch(error) { if(error instanceof Error&&error.message==='PROJECT_HAS_BUSINESS_RECORDS'){res.status(409).json({success:false,error:'Project has business records and cannot be deleted.'});return;} throw error; }
    if (!deleted) { res.status(404).json({ success: false, error: 'Project not found.' }); return; }
    res.json({ success: true, message: 'Project removed.' });
    return;
  }
  const db = getDatabase();
  const project = db.projects.find((item: any) => item.id === id);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found.' }); return; }
  db.projects = db.projects.filter(p => p.id !== id);
  saveDatabase(db);
  recordAuditLog({ action: 'PROJECT_DELETED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Deleted project "${project.name || project.title || id}".`, severity: 'warning' });
  res.json({ success: true, message: 'Project removed.' });
});

// ----------------------------------------------------
// 6. FINANCE, INVOICING & PAYMENTS (Server-Authoritative Calculations)
// ----------------------------------------------------

apiRouter.get('/finance/invoices', requireAuth, requirePermission('canViewFinancials'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const invoices = getDataSourceMode() === 'postgres' ? await postgresInvoiceRepository.list() : getDatabase().invoices;
  res.json({ success: true, invoices });
});

function normalizeInvoiceItems(value: unknown): Array<{ id: string; description: string; quantity: number; unitPrice: number; amount: number }> {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).map((item: any) => {
    const quantity = Number(item?.quantity);
    const unitPrice = Number(item?.unitPrice);
    return {
      id: String(item?.id || `line_${crypto.randomBytes(4).toString('hex')}`).slice(0, 80),
      description: String(item?.description || '').trim().slice(0, 500),
      quantity: Number.isFinite(quantity) ? Math.min(100000, Math.max(0, quantity)) : 0,
      unitPrice: Number.isFinite(unitPrice) ? Math.min(10_000_000_000, Math.max(0, unitPrice)) : 0,
      amount: 0
    };
  }).filter(item => item.description && item.quantity > 0 && item.unitPrice >= 0).map(item => ({
    ...item,
    amount: Math.round(item.quantity * item.unitPrice * 100) / 100
  }));
}

function normalizeDate(value: unknown, fallback: string): string {
  const candidate = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    const parsed = new Date(`${candidate}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate) return candidate;
  }
  return fallback;
}

const INVOICE_STATUSES = new Set(['draft', 'sent', 'overdue']);
const INVOICE_UPDATE_STATUSES = new Set(['draft', 'sent', 'overdue', 'partially_paid', 'paid']);
const PAYMENT_METHODS = new Set(['bank_transfer', 'credit_card', 'cash', 'other']);

function taskMutationFingerprint(value: unknown): string {
  const tasks = Array.isArray(value) ? value : [];
  return JSON.stringify(tasks.map((task: any) => ({
    id: String(task?.id || ''),
    title: String(task?.title || ''),
    description: String(task?.description || ''),
    status: String(task?.status || ''),
    priority: String(task?.priority || 'medium'),
    assignedTo: String(task?.assignedTo ?? task?.assignee ?? ''),
    dueDate: String(task?.dueDate || ''),
    estimatedHours: Number(task?.estimatedHours || 0),
    actualHours: Number(task?.actualHours || 0),
    tags: Array.isArray(task?.tags) ? task.tags.map((v: unknown) => String(v)) : [],
    subtasks: Array.isArray(task?.subtasks)
      ? task.subtasks.map((subtask: any) => ({
          id: String(subtask?.id || ''),
          title: String(subtask?.title || ''),
          completed: Boolean(subtask?.completed)
        }))
      : []
  })).sort((a, b) => a.id.localeCompare(b.id)));
}

function buildInvoiceFinancials(items: ReturnType<typeof normalizeInvoiceItems>, taxPercent: number, discountPercent: number) {
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const taxableSubtotal = Math.round(Math.max(0, subtotal - discountAmount) * 100) / 100;
  const taxAmount = Math.round(taxableSubtotal * (taxPercent / 100) * 100) / 100;
  const total = Math.round((taxableSubtotal + taxAmount) * 100) / 100;
  return { subtotal, discountAmount, taxableSubtotal, taxAmount, total };
}


apiRouter.post('/finance/invoices', requireAuth, requirePermission('canManageInvoices'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const input = req.body || {};
  const items = normalizeInvoiceItems(input.items);
  if (items.length === 0) {
    res.status(400).json({ success: false, error: 'At least one valid invoice line item is required.' });
    return;
  }

  const taxPercent = Number.isFinite(Number(input.taxPercent)) ? Math.min(100, Math.max(0, Number(input.taxPercent))) : 11;
  const discountPercent = Number.isFinite(Number(input.discountPercent)) ? Math.min(100, Math.max(0, Number(input.discountPercent))) : 0;
  const { subtotal, discountAmount, taxableSubtotal, taxAmount, total } = buildInvoiceFinancials(items, taxPercent, discountPercent);

  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  const requestedNumber = String(input.invoiceNumber || '').trim();
  const invoiceNumber = requestedNumber && /^[A-Za-z0-9._/-]{1,80}$/.test(requestedNumber)
    ? requestedNumber
    : `INV-KAPI-${new Date().getFullYear()}-${crypto.randomInt(1000, 10000)}`;

  if (db?.invoices?.some((invoice: any) => invoice.invoiceNumber === invoiceNumber)) {
    res.status(409).json({ success: false, error: 'Invoice number already exists.' });
    return;
  }

  const issueDate = normalizeDate(input.issueDate, new Date().toISOString().slice(0, 10));
  const dueDate = normalizeDate(input.dueDate, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const requestedStatus = String(input.status || 'draft');
  const status = INVOICE_STATUSES.has(requestedStatus) ? requestedStatus : 'draft';
  let resolvedClientId = String(input.clientId || '').slice(0, 100) || '';
  const requestedProjectId = String(input.projectId || '').slice(0, 100);
  if (getDataSourceMode() === 'json') {
    if (requestedProjectId) {
      const project = (db?.projects || []).find((item: any) => String(item.id) === requestedProjectId);
      if (!project) { res.status(404).json({ success: false, error: 'Project not found.' }); return; }
      const projectClientId = String(project.clientId || '').trim();
      if (resolvedClientId && projectClientId && resolvedClientId !== projectClientId) {
        res.status(409).json({ success: false, error: 'Project does not belong to the selected client.' }); return;
      }
      if (!resolvedClientId && projectClientId) resolvedClientId = projectClientId;
    }
    if (resolvedClientId && !(db?.clients || []).some((item: any) => String(item.id) === resolvedClientId)) {
      res.status(404).json({ success: false, error: 'Client not found.' }); return;
    }
  }
  const invoice = {
    id: `inv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    invoiceNumber,
    type: input.type === 'quotation' ? 'quotation' : 'invoice',
    clientName: String(input.clientName || 'Client').trim().slice(0, 160),
    clientCompany: String(input.clientCompany || '').trim().slice(0, 200),
    clientEmail: String(input.clientEmail || '').trim().toLowerCase().slice(0, 254),
    clientPhone: String(input.clientPhone || '').trim().slice(0, 40),
    projectId: String(input.projectId || '').slice(0, 100),
    leadId: String(input.leadId || '').slice(0, 100),
    items,
    subtotal,
    discountPercent,
    discountAmount,
    taxPercent,
    taxAmount,
    total,
    amountPaid: 0,
    balanceDue: total,
    payments: [],
    currency: input.currency === 'USD' ? 'USD' : 'IDR',
    status,
    issueDate,
    dueDate,
    notes: String(input.notes || '').trim().slice(0, 5000),
    paymentTerms: String(input.paymentTerms || '').trim().slice(0, 500),
    auditTrail: [{
      action: 'created',
      timestamp: new Date().toISOString(),
      user: req.user!.username
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  (invoice as any).clientId = resolvedClientId || undefined;
  if (getDataSourceMode() === 'postgres') {
    try {
      const saved = await postgresInvoiceRepository.create(invoice, makeAuditEntry(req, 'INVOICE_CREATED', `Created invoice ${invoice.invoiceNumber} for ${invoice.clientName} (Total: ${invoice.total}).`));
      res.json({ success: true, invoice: saved }); return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invoice could not be created.';
      res.status(message.includes('duplicate') ? 409 : 400).json({ success: false, error: message }); return;
    }
  }

  db!.invoices.unshift(invoice);
  saveDatabase(db!);

  recordAuditLog({
    action: 'INVOICE_CREATED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Created invoice ${invoice.invoiceNumber} for ${invoice.clientName} (Total: ${invoice.total}).`,
    severity: 'info'
  });

  res.json({ success: true, invoice });
});

apiRouter.put('/finance/invoices/:id', requireAuth, requirePermission('canManageInvoices'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const input = req.body || {};
  if (getDataSourceMode() === 'postgres') {
    const existing = await postgresInvoiceRepository.findById(req.params.id);
    if (!existing) { res.status(404).json({ success: false, error: 'Invoice not found.' }); return; }
    const items = input.items !== undefined ? normalizeInvoiceItems(input.items) : normalizeInvoiceItems(existing.items);
    if (items.length === 0) { res.status(400).json({ success: false, error: 'At least one valid invoice line item is required.' }); return; }
    const taxPercent = input.taxPercent !== undefined ? Math.min(100, Math.max(0, Number(input.taxPercent) || 0)) : Number(existing.taxPercent) || 0;
    const discountPercent = input.discountPercent !== undefined ? Math.min(100, Math.max(0, Number(input.discountPercent) || 0)) : Number(existing.discountPercent) || 0;
    const financials = buildInvoiceFinancials(items, taxPercent, discountPercent);
    if (input.status !== undefined && !INVOICE_UPDATE_STATUSES.has(String(input.status))) {
      res.status(400).json({ success: false, error: 'Invalid invoice status.' });
      return;
    }
    const editableInvoiceFields = pickFields(input, ['type','clientId','projectId','leadId','currency','issueDate','dueDate','notes','paymentTerms','status']);
    const patch = {
      ...editableInvoiceFields, items, taxPercent, discountPercent, ...financials,
      clientId: input.clientId !== undefined ? String(input.clientId).slice(0,100) : existing.clientId,
      projectId: input.projectId !== undefined ? String(input.projectId).slice(0,100) : existing.projectId,
      currency: input.currency === 'USD' || input.currency === 'IDR' ? input.currency : existing.currency,
      issueDate: input.issueDate !== undefined ? normalizeDate(input.issueDate, existing.issueDate) : existing.issueDate,
      dueDate: input.dueDate !== undefined ? normalizeDate(input.dueDate, existing.dueDate) : existing.dueDate,
      notes: input.notes !== undefined ? String(input.notes).trim().slice(0,5000) : existing.notes,
      paymentTerms: input.paymentTerms !== undefined ? String(input.paymentTerms).trim().slice(0,500) : existing.paymentTerms,
      updatedAt: input.updatedAt
    };
    try {
      const saved = await postgresInvoiceRepository.update(req.params.id, patch, makeAuditEntry(req, 'INVOICE_UPDATED', `Updated invoice ${req.params.id}.`));
      if (!saved) { res.status(404).json({ success: false, error: 'Invoice not found.' }); return; }
      res.json({ success: true, invoice: saved }); return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invoice could not be updated.';
      res.status(message.includes('modified') || message.includes('Cancelled') || message.includes('PAID_INVOICE_LINKAGE_IMMUTABLE') || message.includes('PAID_INVOICE_TOTAL_IMMUTABLE') || message.includes('PAID_INVOICE_ITEMS_IMMUTABLE') || message.includes('PAID_INVOICE_FINANCIAL_FIELDS_IMMUTABLE') ? 409 : 400).json({ success: false, error: message }); return;
    }
  }

  const db = getDatabase();
  const idx = db.invoices.findIndex((invoice: any) => invoice.id === id);

  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Invoice not found.' });
    return;
  }

  const existing = db.invoices[idx];
  if (existing.status === 'cancelled' && input.status !== 'cancelled') {
    res.status(409).json({ success: false, error: 'Cancelled invoices cannot be reopened.' });
    return;
  }

  const items = input.items !== undefined ? normalizeInvoiceItems(input.items) : normalizeInvoiceItems(existing.items);
  if (items.length === 0) {
    res.status(400).json({ success: false, error: 'At least one valid invoice line item is required.' });
    return;
  }

  const requestedClientId = input.clientId !== undefined ? String(input.clientId || '').slice(0, 100) : String(existing.clientId || '');
  const requestedProjectId = input.projectId !== undefined ? String(input.projectId || '').slice(0, 100) : String(existing.projectId || '');
  const linkedProject = requestedProjectId ? (db.projects || []).find((item: any) => String(item.id) === requestedProjectId) : null;
  if (requestedProjectId && !linkedProject) { res.status(404).json({ success: false, error: 'Project not found.' }); return; }
  const linkedProjectClientId = String(linkedProject?.clientId || '').trim();
  if (requestedClientId && !(db.clients || []).some((item: any) => String(item.id) === requestedClientId)) {
    res.status(404).json({ success: false, error: 'Client not found.' }); return;
  }
  if (requestedClientId && linkedProjectClientId && requestedClientId !== linkedProjectClientId) {
    res.status(409).json({ success: false, error: 'Project does not belong to the selected client.' }); return;
  }
  const taxPercent = input.taxPercent !== undefined ? Math.min(100, Math.max(0, Number(input.taxPercent) || 0)) : Number(existing.taxPercent) || 0;
  const discountPercent = input.discountPercent !== undefined ? Math.min(100, Math.max(0, Number(input.discountPercent) || 0)) : Number(existing.discountPercent) || 0;
  const { subtotal, discountAmount, taxableSubtotal, taxAmount, total } = buildInvoiceFinancials(items, taxPercent, discountPercent);

  const existingPayments = Array.isArray(existing.payments) ? existing.payments : [];
  const amountPaid = existingPayments.reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0);
  if (total < amountPaid) {
    res.status(409).json({ success: false, error: 'Invoice total cannot be lower than payments already recorded.' });
    return;
  }

  const requestedStatus = String(input.status || existing.status);
  if (input.status !== undefined && !INVOICE_UPDATE_STATUSES.has(requestedStatus)) {
    res.status(400).json({ success: false, error: 'Invalid invoice status.' });
    return;
  }
  let status = INVOICE_STATUSES.has(requestedStatus) ? requestedStatus : existing.status;
  if (requestedStatus === 'paid' && !(amountPaid >= total && total > 0)) {
    res.status(409).json({ success: false, error: 'Invoice can only be marked paid after the remaining balance is fully settled.' });
    return;
  }
  if (requestedStatus === 'partially_paid' && !(amountPaid > 0 && amountPaid < total)) {
    res.status(409).json({ success: false, error: 'Invoice can only be partially paid when a payment has been recorded and a balance remains.' });
    return;
  }
  if (amountPaid >= total && total > 0) status = 'paid';
  else if (amountPaid > 0) status = 'partially_paid';

  db.invoices[idx] = {
    ...existing,
    invoiceNumber: existing.invoiceNumber,
    clientName: input.clientName !== undefined ? String(input.clientName).trim().slice(0, 160) : existing.clientName,
    clientCompany: input.clientCompany !== undefined ? String(input.clientCompany).trim().slice(0, 200) : existing.clientCompany,
    clientEmail: input.clientEmail !== undefined ? String(input.clientEmail).trim().toLowerCase().slice(0, 254) : existing.clientEmail,
    clientPhone: input.clientPhone !== undefined ? String(input.clientPhone).trim().slice(0, 40) : existing.clientPhone,
    projectId: input.projectId !== undefined ? requestedProjectId : existing.projectId,
    clientId: requestedClientId || undefined,
    leadId: input.leadId !== undefined ? String(input.leadId).slice(0, 100) : existing.leadId,
    items,
    subtotal,
    discountPercent,
    discountAmount,
    taxPercent,
    taxAmount,
    total,
    amountPaid,
    balanceDue: Math.max(0, total - amountPaid),
    payments: existingPayments,
    currency: input.currency === 'USD' || input.currency === 'IDR' ? input.currency : existing.currency || 'IDR',
    status,
    issueDate: input.issueDate !== undefined ? normalizeDate(input.issueDate, existing.issueDate) : existing.issueDate,
    dueDate: input.dueDate !== undefined ? normalizeDate(input.dueDate, existing.dueDate) : existing.dueDate,
    notes: input.notes !== undefined ? String(input.notes).trim().slice(0, 5000) : existing.notes,
    paymentTerms: input.paymentTerms !== undefined ? String(input.paymentTerms).trim().slice(0, 500) : existing.paymentTerms,
    auditTrail: [
      ...(Array.isArray(existing.auditTrail) ? existing.auditTrail : []),
      { action: 'updated', timestamp: new Date().toISOString(), user: req.user!.username }
    ],
    updatedAt: new Date().toISOString()
  };

  saveDatabase(db);

  recordAuditLog({
    action: 'INVOICE_UPDATED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Updated invoice ${db.invoices[idx].invoiceNumber} (Status: ${status}).`,
    severity: 'info'
  });

  res.json({ success: true, invoice: db.invoices[idx] });
});

apiRouter.post('/finance/invoices/:id/pay', requireAuth, requirePermission('canManageInvoices'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const input = req.body || {};
  const payAmount = Number(input.amount);

  if (!Number.isFinite(payAmount) || payAmount <= 0) {
    res.status(400).json({ success: false, error: 'Valid payment amount is required.' });
    return;
  }

  if (getDataSourceMode() === 'postgres') {
    const invoice = await postgresInvoiceRepository.findById(req.params.id);
    if (!invoice) { res.status(404).json({ success: false, error: 'Invoice not found.' }); return; }
    const payAmount = Number(input.amount);
    if (!Number.isFinite(payAmount) || payAmount <= 0) { res.status(400).json({ success: false, error: 'Valid payment amount is required.' }); return; }
    const method = PAYMENT_METHODS.has(String(input.method)) ? String(input.method) : 'bank_transfer';
    const date = normalizeDate(input.date, new Date().toISOString().slice(0,10));
    const payment = { id: `pay_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`, amount: Math.round(payAmount*100)/100, date, method, reference: String(input.reference||'').trim().slice(0,160), notes: String(input.notes||'').trim().slice(0,1000), idempotencyKey: String(input.idempotencyKey || req.get('Idempotency-Key') || '').trim().slice(0,100), recordedBy: req.user!.name || req.user!.username, userId: req.user!.id };
    try {
      const saved = await postgresInvoiceRepository.recordPayment(req.params.id, payment, makeAuditEntry(req, 'PAYMENT_RECORDED', `Recorded payment of ${payment.amount} for invoice ${req.params.id}.`));
      if (!saved) { res.status(404).json({ success:false,error:'Invoice not found.' }); return; }
      const replayed = saved.__idempotentReplay === true;
      if (replayed) delete saved.__idempotentReplay;
      
      res.json({ success:true, invoice:saved, payment: replayed ? undefined : payment, replayed: replayed }); return;
    } catch(error) {
      const message=error instanceof Error?error.message:'Payment could not be recorded.';
      const conflict = message.includes('exceeds') || message.includes('Cancelled') || message === 'IDEMPOTENCY_KEY_REUSE_CONFLICT' || message === 'INVOICE_PAYMENT_LEDGER_INCONSISTENT' || (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505');
      res.status(conflict ? 409 : 400).json({success:false,error:message}); return;
    }
  }

  const db = getDatabase();
  const invoice = db.invoices.find((item: any) => item.id === id);
  if (!invoice) {
    res.status(404).json({ success: false, error: 'Invoice not found.' });
    return;
  }

  if (invoice.status === 'cancelled') {
    res.status(409).json({ success: false, error: 'Cancelled invoices cannot receive payments.' });
    return;
  }

  const currentBalance = Math.max(0, Number(invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0))));
  if (currentBalance <= 0) {
    res.status(409).json({ success: false, error: 'Invoice has no remaining balance.' });
    return;
  }

  if (payAmount > currentBalance) {
    res.status(400).json({ success: false, error: 'Payment exceeds the current invoice balance.' });
    return;
  }

  const method = PAYMENT_METHODS.has(String(input.method)) ? String(input.method) : 'bank_transfer';
  const date = normalizeDate(input.date, new Date().toISOString().slice(0, 10));
  const reference = String(input.reference || '').trim().slice(0, 160);
  const notes = String(input.notes || '').trim().slice(0, 1000);
  const idempotencyKey = String(input.idempotencyKey || req.get('Idempotency-Key') || '').trim().slice(0, 100);

  const paymentRecord = {
    id: `pay_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    amount: Math.round(payAmount * 100) / 100,
    date,
    method,
    reference,
    recordedBy: req.user!.name || req.user!.username,
    notes,
    idempotencyKey
  };

  if (!Array.isArray(invoice.payments)) invoice.payments = [];
  invoice.payments.push(paymentRecord);

  const totalPaid = invoice.payments.reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0);
  invoice.amountPaid = totalPaid;
  invoice.balanceDue = Math.max(0, Number(invoice.total || 0) - totalPaid);
  invoice.status = invoice.balanceDue <= 0 ? 'paid' : 'partially_paid';
  invoice.updatedAt = new Date().toISOString();
  invoice.auditTrail = [
    ...(Array.isArray(invoice.auditTrail) ? invoice.auditTrail : []),
    { action: 'payment_recorded', timestamp: new Date().toISOString(), user: req.user!.username, note: reference || notes }
  ];

  saveDatabase(db);

  recordAuditLog({
    action: 'PAYMENT_RECORDED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Recorded payment of ${payAmount} for invoice ${invoice.invoiceNumber}. New status: ${invoice.status}.`,
    severity: 'info'
  });

  res.json({ success: true, invoice, payment: paymentRecord });
});

apiRouter.delete('/finance/invoices/:id', requireAuth, requirePermission('canManageInvoices'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    try {
      const invoice = await postgresInvoiceRepository.cancel(req.params.id, req.user!.username, makeAuditEntry(req, 'INVOICE_CANCELLED', `Cancelled invoice ${req.params.id}.`, 'warning'));
      if (!invoice) { res.status(404).json({ success:false,error:'Invoice not found.' }); return; }
      res.json({success:true,message:'Invoice cancelled.',invoice}); return;
    } catch(error) {
      const message=error instanceof Error?error.message:'Invoice could not be cancelled.';
      res.status(message==='INVOICE_WITH_PAYMENTS_CANNOT_BE_CANCELLED'?409:400).json({success:false,error:message}); return;
    }
  }

  const db = getDatabase();
  const invoice = db.invoices.find((item: any) => item.id === id);
  if (!invoice) {
    res.status(404).json({ success: false, error: 'Invoice not found.' });
    return;
  }

  if (Array.isArray(invoice.payments) && invoice.payments.some((payment: any) => Number(payment.amount) > 0)) {
    res.status(409).json({ success: false, error: 'INVOICE_WITH_PAYMENTS_CANNOT_BE_CANCELLED' });
    return;
  }
  invoice.status = 'cancelled';
  invoice.updatedAt = new Date().toISOString();
  invoice.auditTrail = [
    ...(Array.isArray(invoice.auditTrail) ? invoice.auditTrail : []),
    { action: 'cancelled', timestamp: new Date().toISOString(), user: req.user!.username }
  ];
  saveDatabase(db);

  recordAuditLog({
    action: 'INVOICE_CANCELLED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Cancelled invoice ${invoice.invoiceNumber}.`,
    severity: 'warning'
  });

  res.json({ success: true, message: 'Invoice cancelled.', invoice });
});

// Expenses
apiRouter.get('/finance/expenses', requireAuth, requirePermission('canViewFinancials'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const expenses = getDataSourceMode() === 'postgres'
      ? await postgresExpenseRepository.list()
      : getDatabase().expenses.filter((expense: any) => expense.status !== 'voided');
    res.json({ success: true, expenses });
  } catch (error) {
    console.error('[Expenses] Failed to load expenses:', error);
    res.status(503).json({ success: false, error: 'Expense data is temporarily unavailable.' });
  }
});

apiRouter.post('/finance/expenses', requireAuth, requirePermission('canManageInvoices'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const exp = req.body || {};
  const amount = Number(exp.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000_000) {
    res.status(400).json({ success: false, error: 'Expense amount must be a valid positive amount.' });
    return;
  }
  const date = normalizeDate(exp.date, new Date().toISOString().slice(0, 10));
  const currency = String(exp.currency || 'IDR').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    res.status(400).json({ success: false, error: 'Expense currency must be a valid ISO 4217 code.' });
    return;
  }
  const newExpense = {
    id: `exp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    type: ['OpEx', 'CapEx', 'Rentals'].includes(String(exp.type)) ? String(exp.type) : 'OpEx',
    category: cleanText(exp.category || 'General', 120),
    description: cleanText(exp.description, 500),
    amount: Math.round(amount * 100) / 100,
    currency,
    date,
    projectId: cleanText(exp.projectId, 100) || undefined,
    recurringInterval: cleanText(exp.recurringInterval || 'none', 40),
    recordedBy: req.user!.name || req.user!.username,
    recordedByUserId: req.user!.id,
    idempotencyKey: cleanText(exp.idempotencyKey || req.get('Idempotency-Key'), 100) || undefined,
    createdAt: new Date().toISOString()
  };
  if (getDataSourceMode() === 'postgres') {
    try {
      const expense = await postgresExpenseRepository.create(newExpense, makeAuditEntry(req, 'EXPENSE_CREATED', `Created expense "${newExpense.description || newExpense.id}" (${newExpense.currency} ${newExpense.amount}).`));
      const replayed = expense.__idempotentReplay === true;
      if (replayed) delete expense.__idempotentReplay;
      res.json({ success:true, expense, replayed });
    } catch (error) {
      if (error instanceof ExpenseProjectNotFoundError || (error instanceof Error && error.message === 'EXPENSE_IDEMPOTENCY_KEY_REUSE_CONFLICT')) { res.status(409).json({ success:false,error:error.message }); return; }
      res.status(400).json({ success:false,error:error instanceof Error?error.message:'Expense could not be created.' });
    }
    return;
  }
  const db=getDatabase();
  const existingIdempotent=newExpense.idempotencyKey ? db.expenses.find((expense:any)=>expense.recordedByUserId===newExpense.recordedByUserId&&expense.idempotencyKey===newExpense.idempotencyKey&&expense.status!=='voided') : undefined;
  if(existingIdempotent){res.json({success:true,expense:existingIdempotent});return;}
  db.expenses.unshift(newExpense); saveDatabase(db);
  recordAuditLog({ action:'EXPENSE_CREATED', actor:req.user!.username, actorRole:req.user!.role, ip:req.ip, userAgent:req.headers['user-agent'] as string, details:`Created expense "${newExpense.description || newExpense.id}" (${newExpense.currency} ${newExpense.amount}).`, severity:'info' });
  res.json({success:true,expense:newExpense});
});

apiRouter.delete('/finance/expenses/:id', requireAuth, requirePermission('canManageInvoices'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {id}=req.params;
  const expectedVersion=req.body?.version!==undefined?Number(req.body.version):undefined;
  if(getDataSourceMode()==='postgres'){
    try{
      const expense=await postgresExpenseRepository.void(id,Number.isFinite(expectedVersion)?expectedVersion:undefined,makeAuditEntry(req,'EXPENSE_VOIDED',`Voided expense "${id}".`,'warning'));
      res.json({success:true,message:'Expense voided.',expense});
    }catch(error){
      if(error instanceof ExpenseNotFoundError){res.status(404).json({success:false,error:error.message});return;}
      if(error instanceof ExpenseVersionConflictError){res.status(409).json({success:false,error:error.message,code:error.code});return;}
      if(error instanceof ExpenseImmutableError){res.status(409).json({success:false,error:error.message,code:error.code});return;}
      res.status(400).json({success:false,error:error instanceof Error?error.message:'Expense could not be voided.'});
    }
    return;
  }
  const db=getDatabase(),expense=db.expenses.find((item:any)=>item.id===id);
  if(!expense){res.status(404).json({success:false,error:'Expense not found.'});return;}
  if(expense.status==='voided'){res.status(409).json({success:false,error:'Expense is already voided.'});return;}
  if(expectedVersion!==undefined&&Number(expense.version||1)!==expectedVersion){res.status(409).json({success:false,error:'Expense was modified by another user.',code:'EXPENSE_VERSION_CONFLICT'});return;}
  expense.status='voided';expense.version=Number(expense.version||1)+1;expense.archivedAt=new Date().toISOString();expense.voidedAt=expense.archivedAt;expense.updatedAt=expense.archivedAt;saveDatabase(db);
  recordAuditLog({action:'EXPENSE_VOIDED',actor:req.user!.username,actorRole:req.user!.role,ip:req.ip,userAgent:req.headers['user-agent'] as string,details:`Voided expense "${expense.description || id}" (${expense.currency || 'IDR'} ${expense.amount || 0}).`,severity:'warning'});
  res.json({success:true,message:'Expense voided.',expense});
});

// Financial Metrics (Authoritative server-calculated metrics)
apiRouter.get('/finance/metrics', requireAuth, requirePermission('canViewFinancials'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usePostgres=getDataSourceMode()==='postgres';
    const invoices=usePostgres?await postgresInvoiceRepository.list():getDatabase().invoices;
    const expenses=usePostgres?await postgresExpenseRepository.list():getDatabase().expenses.filter((expense:any)=>expense.status!=='voided');
    const byCurrency=new Map<string,any>();
    const getBucket=(value:unknown)=>{const currency=String(value||'IDR').toUpperCase();if(!byCurrency.has(currency))byCurrency.set(currency,{currency,totalRevenueCollected:0,totalBilled:0,totalOutstanding:0,totalExpense:0,paidCount:0,partiallyPaidCount:0,overdueCount:0,draftCount:0});return byCurrency.get(currency);};
    for(const inv of invoices){const b=getBucket(inv.currency);b.totalBilled+=Number(inv.total)||0;b.totalRevenueCollected+=getInvoicePaidAmount(inv);if(inv.status!=='paid'&&inv.status!=='cancelled')b.totalOutstanding+=getInvoiceBalanceDue(inv);if(inv.status==='paid')b.paidCount++;else if(inv.status==='partially_paid')b.partiallyPaidCount++;else if(inv.status==='overdue')b.overdueCount++;else if(inv.status==='draft')b.draftCount++;}
    for(const exp of expenses){const b=getBucket(exp.currency);b.totalExpense+=Number(exp.amount)||0;}
    const currency = String(req.query.currency || 'IDR').toUpperCase();
    const primary = byCurrency.get(currency) || getBucket(currency);
    const netProfit = primary.totalRevenueCollected - primary.totalExpense;
    const profitMargin = primary.totalRevenueCollected > 0
      ? ((netProfit / primary.totalRevenueCollected) * 100).toFixed(1)
      : '0';
    const byCurrencyMetrics = Array.from(byCurrency.values()).map((bucket: any) => ({
      ...bucket,
      netProfit: bucket.totalRevenueCollected - bucket.totalExpense,
      profitMargin: bucket.totalRevenueCollected > 0
        ? (((bucket.totalRevenueCollected - bucket.totalExpense) / bucket.totalRevenueCollected) * 100).toFixed(1)
        : '0'
    }));

    res.json({
      success: true,
      metrics: {
        currency,
        totalRevenueCollected: primary.totalRevenueCollected,
        totalBilled: primary.totalBilled,
        totalOutstanding: primary.totalOutstanding,
        totalExpense: primary.totalExpense,
        netProfit,
        profitMargin,
        totalInvoicesCount: invoices.filter((invoice: any) => String(invoice.currency || 'IDR').toUpperCase() === currency).length,
        paidCount: primary.paidCount,
        partiallyPaidCount: primary.partiallyPaidCount,
        overdueCount: primary.overdueCount,
        draftCount: primary.draftCount,
        byCurrency: byCurrencyMetrics
      }
    });
  }catch(error){console.error('[Finance Metrics] Failed:',error);res.status(503).json({success:false,error:'Financial metrics are temporarily unavailable.'});}
});

// ----------------------------------------------------
// 7. Vendors
apiRouter.get('/vendors', requireAuth, requireAnyPermission('canManageVendors', 'canViewFinancials'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const vendors = getDataSourceMode() === 'postgres' ? await postgresVendorRepository.list() : getDatabase().vendors;
  res.json({ success: true, vendors });
});

apiRouter.post('/vendors', requireAuth, requirePermission('canManageVendors'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const vendorData = req.body || {};
  const hourlyRate = Number(vendorData.hourlyRate);
  if (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 10_000_000_000) {
    res.status(400).json({ success: false, error: 'Vendor hourly rate must be a valid non-negative amount.' });
    return;
  }
  const rating = Number(vendorData.rating);
  const now = new Date().toISOString();
  const newVendor = {
    id: `ven_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    name: cleanText(vendorData.name, 160),
    companyName: cleanText(vendorData.companyName, 200),
    email: cleanText(vendorData.email, 254).toLowerCase(),
    phone: cleanText(vendorData.phone, 40),
    type: ['freelancer','agency_partner','contractor','saas_vendor'].includes(String(vendorData.type)) ? String(vendorData.type) : 'contractor',
    primaryCategory: cleanText(vendorData.primaryCategory, 120),
    skills: Array.isArray(vendorData.skills) ? vendorData.skills.slice(0,100).map((v: unknown) => cleanText(v,120)) : [],
    hourlyRate,
    currency: vendorData.currency === 'USD' ? 'USD' : 'IDR',
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0,
    completedProjectsCount: Math.max(0, Math.floor(Number(vendorData.completedProjectsCount) || 0)),
    status: ['active','under_review','inactive','blacklisted'].includes(String(vendorData.status)) ? String(vendorData.status) : 'under_review',
    isVetted: Boolean(vendorData.isVetted),
    location: cleanText(vendorData.location, 160),
    portfolioUrl: cleanOptionalUrl(vendorData.portfolioUrl),
    githubUrl: cleanOptionalUrl(vendorData.githubUrl),
    contracts: Array.isArray(vendorData.contracts) ? vendorData.contracts.slice(0,50) : [],
    notes: cleanText(vendorData.notes, 3000),
    createdAt: now,
    updatedAt: now
  };
  if (getDataSourceMode() === 'postgres') {
    const vendor = await postgresVendorRepository.create(newVendor as any, makeAuditEntry(req, 'VENDOR_CREATED', `Created vendor "${newVendor.name}".`, 'info'));
    res.json({ success: true, vendor });
    return;
  }
  const db = getDatabase();
  db.vendors.unshift(newVendor);
  saveDatabase(db);
  recordAuditLog({
    action: 'VENDOR_CREATED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Created vendor "${newVendor.name}".`,
    severity: 'info'
  });
  res.json({ success: true, vendor: newVendor });
});

apiRouter.put('/vendors/:id', requireAuth, requirePermission('canManageVendors'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body || {};
  if (getDataSourceMode() === 'postgres') {
    const patch = pickFields(updates, ['name','companyName','email','phone','type','primaryCategory','skills','hourlyRate','currency','rating','completedProjectsCount','status','isVetted','location','portfolioUrl','githubUrl','contracts','notes','updatedAt']);
    if (patch.email !== undefined) {
      patch.email = cleanText(patch.email, 254).toLowerCase();
      if (patch.email && !isValidEmail(patch.email)) { res.status(400).json({ success: false, error: 'Invalid vendor email address.' }); return; }
    }
    if (patch.status !== undefined && !['active','under_review','inactive','blacklisted'].includes(String(patch.status))) { res.status(400).json({ success: false, error: 'Invalid vendor status.' }); return; }
    if (patch.hourlyRate !== undefined) {
      const numeric = normalizeNumber(patch.hourlyRate, 0, MAX_MONEY);
      if (numeric === null) { res.status(400).json({ success: false, error: 'Invalid vendor hourly rate.' }); return; }
      patch.hourlyRate = numeric;
    }
    if (patch.rating !== undefined) {
      const numeric = normalizeNumber(patch.rating, 0, 5);
      if (numeric === null) { res.status(400).json({ success: false, error: 'Invalid vendor rating.' }); return; }
      patch.rating = numeric;
    }
    if (patch.completedProjectsCount !== undefined) {
      const numeric = normalizeNumber(patch.completedProjectsCount, 0, 1_000_000);
      if (numeric === null) { res.status(400).json({ success: false, error: 'Invalid vendor project count.' }); return; }
      patch.completedProjectsCount = Math.floor(numeric);
    }
    for (const key of ['name','companyName','phone','primaryCategory','location','notes'] as const) if (patch[key] !== undefined) patch[key] = cleanText(patch[key], key === 'notes' ? 3000 : 200);
    for (const key of ['portfolioUrl','githubUrl'] as const) if (patch[key] !== undefined) patch[key] = cleanOptionalUrl(patch[key]);
    if (patch.skills !== undefined) patch.skills = normalizeStringArray(patch.skills, 100, 120);
    if (patch.contracts !== undefined) patch.contracts = Array.isArray(patch.contracts) ? patch.contracts.slice(0, 50) : [];
    try {
      const vendor = await postgresVendorRepository.update(id, patch as any, makeAuditEntry(req, 'VENDOR_UPDATED', `Updated vendor ${id}.`, 'info'));
      if (!vendor) { res.status(404).json({ success: false, error: 'Vendor not found.' }); return; }
      res.json({ success: true, vendor });
    } catch (error) { throw error; }
    return;
  }
  const db = getDatabase();
  const idx = db.vendors.findIndex(v => v.id === id);
  if (idx === -1) { res.status(404).json({ success: false, error: 'Vendor not found.' }); return; }
  const patch = pickFields(updates || {}, ['name', 'category', 'contactPerson', 'email', 'phone', 'website', 'paymentTerms', 'status', 'monthlySpend', 'notes', 'portfolioUrl', 'githubUrl', 'contracts']);
  if (patch.email !== undefined) { patch.email = cleanText(patch.email, 254).toLowerCase(); if (patch.email && !isValidEmail(patch.email)) { res.status(400).json({ success: false, error: 'Invalid vendor email address.' }); return; } }
  for (const key of ['website','portfolioUrl','githubUrl'] as const) if (patch[key] !== undefined) patch[key] = cleanOptionalUrl(patch[key]);
  if (patch.status !== undefined && !['active','under_review','inactive','blacklisted'].includes(String(patch.status))) { res.status(400).json({ success: false, error: 'Invalid vendor status.' }); return; }
  if (patch.monthlySpend !== undefined) { const numeric = normalizeNumber(patch.monthlySpend, 0, MAX_MONEY); if (numeric === null) { res.status(400).json({ success: false, error: 'Invalid vendor monthly spend.' }); return; } patch.monthlySpend = numeric; }
  for (const key of ['name','category','contactPerson','phone','paymentTerms','notes'] as const) if (patch[key] !== undefined) patch[key] = cleanText(patch[key], key === 'notes' ? 3000 : 200);
  if (patch.contracts !== undefined) patch.contracts = Array.isArray(patch.contracts) ? patch.contracts.slice(0, 50) : [];
  db.vendors[idx] = { ...db.vendors[idx], ...patch, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  recordAuditLog({ action: 'VENDOR_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Updated vendor ${id}.`, severity: 'info' });
  res.json({ success: true, vendor: db.vendors[idx] });
});

apiRouter.delete('/vendors/:id', requireAuth, requirePermission('canManageVendors'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    const vendor = await postgresVendorRepository.findById(id);
    if (!vendor) { res.status(404).json({ success: false, error: 'Vendor not found.' }); return; }
    const deleted = await postgresVendorRepository.delete(id, makeAuditEntry(req, 'VENDOR_DELETED', `Deleted vendor "${vendor.name}".`, 'warning'));
    if (!deleted) { res.status(404).json({ success: false, error: 'Vendor not found.' }); return; }
    res.json({ success: true, message: 'Vendor deleted.' });
    return;
  }
  const db = getDatabase();
  const vendor = db.vendors.find((item: any) => item.id === id);
  if (!vendor) { res.status(404).json({ success: false, error: 'Vendor not found.' }); return; }
  db.vendors = db.vendors.filter(v => v.id !== id);
  saveDatabase(db);
  recordAuditLog({ action: 'VENDOR_DELETED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Deleted vendor "${vendor.name || id}".`, severity: 'warning' });
  res.json({ success: true, message: 'Vendor deleted.' });
});

// ----------------------------------------------------
// 8. CMS (Services, Projects, Testimonials, Settings)
// ----------------------------------------------------

// CMS Services (Public GET for published services, protected for drafts)
apiRouter.get('/cms/services', rateLimitPublic(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const canManage = Boolean(user && (user.stakeholderType === 'Master' || user.permissions?.canManageCmsContent));
  const source = getDataSourceMode() === 'postgres'
    ? await postgresCmsRepository.list('service')
    : getDatabase().cmsServices;
  const services = canManage ? source : source.filter((item: any) => item.isPublished !== false);
  res.json({ success: true, services });
});

apiRouter.post('/cms/services', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const item = req.body || {};
  const now = new Date().toISOString();
  const newService = {
    id: `srv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    ...pickFields(item, [
      'slug','type','category','title','navSubtitle','navSubtitleId','heroHeadline','heroHeadlineId',
      'heroSubtitle','heroSubtitleId','badge','badgeId','metrics','capabilities','technologies',
      'deliverables','testimonial','featured','isPublished'
    ]),
    slug: cleanText(item.slug, 160).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    title: cleanText(item.title, 200),
    isPublished: item.isPublished !== undefined ? Boolean(item.isPublished) : true,
    createdAt: now,
    updatedAt: now
  };
  if (getDataSourceMode() === 'postgres') {
    const service = await postgresCmsRepository.create('service', newService, makeAuditEntry(req, 'CMS_SERVICE_CREATED', `Created CMS service "${newService.title}".`, 'info'));
    if (getDataSourceMode() === 'json') recordAuditLog({ action: 'CMS_SERVICE_CREATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Created CMS service "${service.title || newService.title}".`, severity: 'info' });
    res.json({ success: true, service });
    return;
  }
  const db = getDatabase();
  db.cmsServices.unshift(newService);
  saveDatabase(db);
  recordAuditLog({ action: 'CMS_SERVICE_CREATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Created CMS service "${newService.title}".`, severity: 'info' });
  res.json({ success: true, service: newService });
});

apiRouter.put('/cms/services/:id', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const patch = pickFields(req.body || {}, ['slug','type','category','title','navSubtitle','navSubtitleId','heroHeadline','heroHeadlineId','heroSubtitle','heroSubtitleId','badge','badgeId','metrics','capabilities','technologies','deliverables','testimonial','featured','isPublished']);
  if (getDataSourceMode() === 'postgres') {
    const service = await postgresCmsRepository.update('service', id, patch, makeAuditEntry(req, 'CMS_SERVICE_UPDATED', `Updated CMS service "${patch.title || id}".`, 'info'));
    if (!service) { res.status(404).json({ success: false, error: 'Service not found.' }); return; }
    if (getDataSourceMode() === 'json') recordAuditLog({ action: 'CMS_SERVICE_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Updated CMS service "${service.title || id}".`, severity: 'info' });
    res.json({ success: true, service });
    return;
  }
  const db = getDatabase();
  const idx = db.cmsServices.findIndex(s => s.id === id);
  if (idx === -1) { res.status(404).json({ success: false, error: 'Service not found.' }); return; }
  db.cmsServices[idx] = { ...db.cmsServices[idx], ...patch, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  recordAuditLog({ action: 'CMS_SERVICE_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Updated CMS service "${db.cmsServices[idx].title || id}".`, severity: 'info' });
  res.json({ success: true, service: db.cmsServices[idx] });
});

apiRouter.delete('/cms/services/:id', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    const service = await postgresCmsRepository.findById('service', req.params.id);
    if (!service) { res.status(404).json({ success: false, error: 'Service not found.' }); return; }
    await postgresCmsRepository.delete('service', req.params.id, makeAuditEntry(req, 'CMS_SERVICE_DELETED', `Deleted CMS service "${service.title || service.name || id}".`, 'warning'));
    if (getDataSourceMode() === 'json') recordAuditLog({ action: 'CMS_SERVICE_DELETED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Deleted CMS service "${service.title || service.name || id}".`, severity: 'warning' });
    res.json({ success: true, message: 'Service deleted.' });
    return;
  }
  const db = getDatabase();
  const service = db.cmsServices.find((item: any) => item.id === id);
  if (!service) { res.status(404).json({ success: false, error: 'Service not found.' }); return; }
  db.cmsServices = db.cmsServices.filter(s => s.id !== id);
  saveDatabase(db);
  recordAuditLog({ action: 'CMS_SERVICE_DELETED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Deleted CMS service "${service.title || id}".`, severity: 'warning' });
  res.json({ success: true, message: 'Service deleted.' });
});

// CMS Projects
apiRouter.get('/cms/projects', rateLimitPublic(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const canManage = Boolean(user && (user.stakeholderType === 'Master' || user.permissions?.canManageCmsContent));
  const source = getDataSourceMode() === 'postgres'
    ? await postgresCmsRepository.list('project')
    : getDatabase().cmsProjects;
  const projects = canManage ? source : source.filter((item: any) => item.isPublished !== false);
  res.json({ success: true, projects });
});

apiRouter.post('/cms/projects', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const item = req.body || {};
  const now = new Date().toISOString();
  const newProj = {
    id: `proj_cms_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    ...pickFields(item, ['slug','title','client','industry','pillar','service','featured','image','desc','descId','challenge','challengeId','solution','solutionId','deliverables','technologies','impact','year','isPublished']),
    slug: cleanText(item.slug, 160).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    title: cleanText(item.title, 240),
    isPublished: item.isPublished !== undefined ? Boolean(item.isPublished) : true,
    createdAt: now,
    updatedAt: now
  };
  if (getDataSourceMode() === 'postgres') {
    const project = await postgresCmsRepository.create('project', newProj, makeAuditEntry(req, 'CMS_PROJECT_CREATED', `Created CMS project "${newProj.title}".`, 'info'));
    if (getDataSourceMode() === 'json') recordAuditLog({ action: 'CMS_PROJECT_CREATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Created CMS project "${project.title || newProj.title}".`, severity: 'info' });
    res.json({ success: true, project });
    return;
  }
  const db = getDatabase();
  db.cmsProjects.unshift(newProj);
  saveDatabase(db);
  recordAuditLog({ action: 'CMS_PROJECT_CREATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Created CMS project "${newProj.title}".`, severity: 'info' });
  res.json({ success: true, project: newProj });
});

apiRouter.put('/cms/projects/:id', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const patch = pickFields(req.body || {}, ['slug','title','client','industry','pillar','service','featured','image','desc','descId','challenge','challengeId','solution','solutionId','deliverables','technologies','impact','year','isPublished']);
  if (getDataSourceMode() === 'postgres') {
    const project = await postgresCmsRepository.update('project', id, patch, makeAuditEntry(req, 'CMS_PROJECT_UPDATED', `Updated CMS project "${patch.title || id}".`, 'info'));
    if (!project) { res.status(404).json({ success: false, error: 'Project not found.' }); return; }
    if (getDataSourceMode() === 'json') recordAuditLog({ action: 'CMS_PROJECT_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Updated CMS project "${project.title || id}".`, severity: 'info' });
    res.json({ success: true, project });
    return;
  }
  const db = getDatabase();
  const idx = db.cmsProjects.findIndex(p => p.id === id);
  if (idx === -1) { res.status(404).json({ success: false, error: 'Project not found.' }); return; }
  db.cmsProjects[idx] = { ...db.cmsProjects[idx], ...patch, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  recordAuditLog({ action: 'CMS_PROJECT_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Updated CMS project "${db.cmsProjects[idx].title || id}".`, severity: 'info' });
  res.json({ success: true, project: db.cmsProjects[idx] });
});

apiRouter.delete('/cms/projects/:id', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    const project = await postgresCmsRepository.findById('project', req.params.id);
    if (!project) { res.status(404).json({ success: false, error: 'Project not found.' }); return; }
    await postgresCmsRepository.delete('project', req.params.id, makeAuditEntry(req, 'CMS_PROJECT_DELETED', `Deleted CMS project "${project.title || project.name || id}".`, 'warning'));
    if (getDataSourceMode() === 'json') recordAuditLog({ action: 'CMS_PROJECT_DELETED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Deleted CMS project "${project.title || project.name || id}".`, severity: 'warning' });
    res.json({ success: true, message: 'Project deleted.' });
    return;
  }
  const db = getDatabase();
  const project = db.cmsProjects.find((item: any) => item.id === id);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found.' }); return; }
  db.cmsProjects = db.cmsProjects.filter(p => p.id !== id);
  saveDatabase(db);
  recordAuditLog({ action: 'CMS_PROJECT_DELETED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Deleted CMS project "${project.title || id}".`, severity: 'warning' });
  res.json({ success: true, message: 'Project deleted.' });
});

// CMS Testimonials
apiRouter.get('/cms/testimonials', rateLimitPublic(), async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthenticatedRequest).user;
  const canManage = Boolean(user && (user.stakeholderType === 'Master' || user.permissions?.canManageCmsContent));
  const source = getDataSourceMode() === 'postgres'
    ? await postgresCmsRepository.list('testimonial')
    : getDatabase().cmsTestimonials;
  const testimonials = canManage ? source : source.filter((item: any) => item.isPublished !== false);
  res.json({ success: true, testimonials });
});

apiRouter.post('/cms/testimonials', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const item = req.body || {};
  const rating = Number(item.rating);
  const now = new Date().toISOString();
  const newTestimonial = {
    id: `test_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    quote: cleanText(item.quote, 2000),
    quoteId: cleanText(item.quoteId, 2000),
    author: cleanText(item.author, 160),
    name: cleanText(item.author, 160),
    role: cleanText(item.role, 160),
    company: cleanText(item.company, 200),
    location: cleanText(item.location, 160),
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 5,
    avatar: cleanOptionalUrl(item.avatar),
    isPublished: item.isPublished !== undefined ? Boolean(item.isPublished) : true,
    createdAt: now,
    updatedAt: now
  };
  if (getDataSourceMode() === 'postgres') {
    const testimonial = await postgresCmsRepository.create('testimonial', newTestimonial, makeAuditEntry(req, 'CMS_TESTIMONIAL_CREATED', `Created CMS testimonial "${newTestimonial.author}".`, 'info'));
    if (getDataSourceMode() === 'json') recordAuditLog({ action: 'CMS_TESTIMONIAL_CREATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Created CMS testimonial "${testimonial.author || testimonial.name}".`, severity: 'info' });
    res.json({ success: true, testimonial });
    return;
  }
  const db = getDatabase();
  db.cmsTestimonials.unshift(newTestimonial);
  saveDatabase(db);
  recordAuditLog({ action: 'CMS_TESTIMONIAL_CREATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Created CMS testimonial "${newTestimonial.author}".`, severity: 'info' });
  res.json({ success: true, testimonial: newTestimonial });
});

apiRouter.put('/cms/testimonials/:id', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const patch = pickFields(req.body || {}, ['quote','quoteId','author','role','company','location','rating','avatar','isPublished']);
  if (getDataSourceMode() === 'postgres') {
    const testimonial = await postgresCmsRepository.update('testimonial', id, patch, makeAuditEntry(req, 'CMS_TESTIMONIAL_UPDATED', `Updated CMS testimonial "${patch.author || patch.name || id}".`, 'info'));
    if (!testimonial) { res.status(404).json({ success: false, error: 'Testimonial not found.' }); return; }
    if (getDataSourceMode() === 'json') recordAuditLog({ action: 'CMS_TESTIMONIAL_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Updated CMS testimonial "${testimonial.author || id}".`, severity: 'info' });
    res.json({ success: true, testimonial });
    return;
  }
  const db = getDatabase();
  const idx = db.cmsTestimonials.findIndex(t => t.id === id);
  if (idx === -1) { res.status(404).json({ success: false, error: 'Testimonial not found.' }); return; }
  db.cmsTestimonials[idx] = { ...db.cmsTestimonials[idx], ...patch, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  recordAuditLog({ action: 'CMS_TESTIMONIAL_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Updated CMS testimonial "${db.cmsTestimonials[idx].author || id}".`, severity: 'info' });
  res.json({ success: true, testimonial: db.cmsTestimonials[idx] });
});

apiRouter.delete('/cms/testimonials/:id', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    const testimonial = await postgresCmsRepository.findById('testimonial', req.params.id);
    if (!testimonial) { res.status(404).json({ success: false, error: 'Testimonial not found.' }); return; }
    await postgresCmsRepository.delete('testimonial', req.params.id, makeAuditEntry(req, 'CMS_TESTIMONIAL_DELETED', `Deleted CMS testimonial "${testimonial.author || testimonial.name || id}".`, 'warning'));
    if (getDataSourceMode() === 'json') recordAuditLog({ action: 'CMS_TESTIMONIAL_DELETED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Deleted CMS testimonial "${testimonial.author || testimonial.name || id}".`, severity: 'warning' });
    res.json({ success: true, message: 'Testimonial deleted.' });
    return;
  }
  const db = getDatabase();
  const testimonial = db.cmsTestimonials.find((item: any) => item.id === id);
  if (!testimonial) { res.status(404).json({ success: false, error: 'Testimonial not found.' }); return; }
  db.cmsTestimonials = db.cmsTestimonials.filter(t => t.id !== id);
  saveDatabase(db);
  recordAuditLog({ action: 'CMS_TESTIMONIAL_DELETED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Deleted CMS testimonial "${testimonial.author || id}".`, severity: 'warning' });
  res.json({ success: true, message: 'Testimonial deleted.' });
});

// Public CMS metadata. Only non-sensitive presentation fields are exposed.
apiRouter.get('/cms/public-settings', rateLimitPublic(), async (_req: Request, res: Response): Promise<void> => {
  const settings = getDataSourceMode() === 'postgres'
    ? await postgresCmsRepository.getSettings()
    : getDatabase().cmsSettings;

  res.json({
    success: true,
    settings: {
      siteTitle: cleanText(settings?.siteTitle || 'Kapitech Agency', 160),
      siteDescription: cleanText(settings?.siteDescription || '', 320),
      defaultLanguage: settings?.defaultLanguage === 'en' ? 'en' : 'id',
      maintenanceMode: Boolean(settings?.maintenanceMode)
    }
  });
});

// CMS Settings
apiRouter.get('/cms/settings', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const settings = getDataSourceMode() === 'postgres'
    ? await postgresCmsRepository.getSettings()
    : getDatabase().cmsSettings;
  res.json({ success: true, settings });
});

apiRouter.put('/cms/settings', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const patch = pickFields(req.body || {}, ['siteTitle','siteDescription','contactReceiverEmail','defaultLanguage','enableLiveChat','enableSoundAlerts','maintenanceMode']);
  if (getDataSourceMode() === 'postgres') {
    const settings = await postgresCmsRepository.updateSettings(patch, makeAuditEntry(req, 'CMS_SETTINGS_UPDATED', 'Updated CMS settings.', 'info'));
    if (getDataSourceMode() === 'json') recordAuditLog({ action: 'CMS_SETTINGS_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: 'Updated CMS settings.', severity: 'info' });
    res.json({ success: true, settings });
    return;
  }
  const db = getDatabase();
  db.cmsSettings = { ...db.cmsSettings, ...patch, updatedAt: new Date().toISOString() };
  saveDatabase(db);
  recordAuditLog({ action: 'CMS_SETTINGS_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: 'Updated CMS settings.', severity: 'info' });
  res.json({ success: true, settings: db.cmsSettings });
});
// ----------------------------------------------------
// 9. AUDIT LOGS (Server-Side, Tamper-Resistant)
// ----------------------------------------------------

apiRouter.get('/audit-logs', requireAuth, requirePermission('canViewSecurityAuditLogs'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const logs = getDataSourceMode() === 'postgres'
    ? await postgresAuditLogRepository.list()
    : getDatabase().auditLogs;
  res.json({ success: true, logs });
});

apiRouter.get('/audit-logs/integrity', requireAuth, requirePermission('canViewSecurityAuditLogs'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const integrity = getDataSourceMode() === 'postgres'
    ? await postgresAuditLogRepository.verifyChain()
    : verifyAuditLogChain(getDatabase());
  res.status(integrity.valid ? 200 : 409).json({
    success: integrity.valid,
    integrity
  });
});

// ----------------------------------------------------
// 10. NOTIFICATION SETTINGS (Secrets kept strictly on server)
// ----------------------------------------------------

apiRouter.get('/notifications/settings', requireAuth, requirePermission('canAccessServerAndApi'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const postgresMode = getDataSourceMode() === 'postgres';
  const jsonNotificationSettings = postgresMode ? undefined : getDatabase().notificationSettings;
  const s = postgresMode
    ? await postgresNotificationSettingsRepository.get()
    : jsonNotificationSettings!;
  const hasTelegramToken = postgresMode
    ? Boolean(process.env.KAPITECH_TELEGRAM_BOT_TOKEN?.trim())
    : Boolean(jsonNotificationSettings?.telegramBotToken?.trim());

  res.json({
    success: true,
    settings: {
      targetEmail: s.targetEmail,
      formspreeEndpoint: s.formspreeEndpoint,
      telegramChatId: s.telegramChatId,
      isEmailActive: s.isEmailActive,
      isTelegramActive: s.isTelegramActive,
      hasTelegramToken
    }
  });
});

apiRouter.put('/notifications/settings', requireAuth, requirePermission('canAccessServerAndApi'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { targetEmail, formspreeEndpoint, telegramChatId, isEmailActive, isTelegramActive } = req.body;
  if (getDataSourceMode() === 'postgres') {
    const current = await postgresNotificationSettingsRepository.get();
    const nextTargetEmail = targetEmail !== undefined ? cleanText(targetEmail, 254).toLowerCase() : current.targetEmail;
    const nextFormspreeEndpoint = formspreeEndpoint !== undefined ? cleanOptionalUrl(formspreeEndpoint) : current.formspreeEndpoint;
    const nextTelegramChatId = telegramChatId !== undefined ? cleanText(telegramChatId, 120) : current.telegramChatId;
    if (nextTargetEmail && !isValidEmail(nextTargetEmail)) { res.status(400).json({ success: false, error: 'Invalid notification target email address.' }); return; }
    if (nextFormspreeEndpoint && !/^https:\/\/(?:www\.)?formspree\.io\//i.test(nextFormspreeEndpoint)) { res.status(400).json({ success: false, error: 'Only Formspree HTTPS endpoints are allowed.' }); return; }
    const settings = await postgresNotificationSettingsRepository.update({
      targetEmail: nextTargetEmail,
      formspreeEndpoint: nextFormspreeEndpoint,
      telegramChatId: nextTelegramChatId,
      isEmailActive: isEmailActive !== undefined ? Boolean(isEmailActive) : current.isEmailActive,
      isTelegramActive: isTelegramActive !== undefined ? Boolean(isTelegramActive) : current.isTelegramActive
    }, makeAuditEntry(req, 'SETTINGS_UPDATED', 'Updated notification and dispatch channel settings.', 'info'));

    res.json({ success: true, message: 'Notification settings saved.' });
    return;
  }

  const db = getDatabase();
  const current = db.notificationSettings;
  const nextTargetEmail = targetEmail !== undefined ? cleanText(targetEmail, 254).toLowerCase() : current.targetEmail;
  const nextFormspreeEndpoint = formspreeEndpoint !== undefined ? cleanOptionalUrl(formspreeEndpoint) : current.formspreeEndpoint;
  const nextTelegramChatId = telegramChatId !== undefined ? cleanText(telegramChatId, 120) : current.telegramChatId;
  if (nextTargetEmail && !isValidEmail(nextTargetEmail)) { res.status(400).json({ success: false, error: 'Invalid notification target email address.' }); return; }
  if (nextFormspreeEndpoint && !/^https:\/\/(?:www\.)?formspree\.io\//i.test(nextFormspreeEndpoint)) { res.status(400).json({ success: false, error: 'Only Formspree HTTPS endpoints are allowed.' }); return; }
  db.notificationSettings = {
    targetEmail: nextTargetEmail,
    formspreeEndpoint: nextFormspreeEndpoint,
    telegramBotToken: current.telegramBotToken,
    telegramChatId: nextTelegramChatId,
    isEmailActive: isEmailActive !== undefined ? Boolean(isEmailActive) : current.isEmailActive,
    isTelegramActive: isTelegramActive !== undefined ? Boolean(isTelegramActive) : current.isTelegramActive,
    updatedAt: new Date().toISOString()
  };
  saveDatabase(db);
  recordAuditLog({ action: 'SETTINGS_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: 'Updated notification and dispatch channel settings.', severity: 'info' });
  res.json({ success: true, message: 'Notification settings saved.' });
});
// ----------------------------------------------------
// 11. SERVER-SIDE GEMINI INTEGRATION (Key never exposed to browser)
// ----------------------------------------------------

apiRouter.post('/ai/generate', requireAuth, requirePermission('canAccessServerAndApi'), rateLimitAuthenticated(10, 60 * 1000), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { prompt, context } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.length > 4000) {
    res.status(400).json({ success: false, error: 'Prompt is required and must be 4000 characters or fewer.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      success: false,
      error: 'Gemini AI service is not configured on server. Please set GEMINI_API_KEY.'
    });
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `You are the executive AI copilot for Kapitech Agency Management System. Context: ${typeof context === 'string' ? context.slice(0, 4000) : 'General Agency Operations'}. Request: ${prompt}`
                  }
                ]
              }
            ]
          }),
          signal: controller.signal
        }
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        console.error('[AI] Gemini API returned HTTP', response.status);
        res.status(502).json({ success: false, error: 'AI service request failed. Please try again later.' });
        return;
      }

      const outputText = Array.isArray(payload?.candidates?.[0]?.content?.parts)
        ? payload.candidates[0].content.parts
            .map((part: { text?: string }) => typeof part.text === 'string' ? part.text : '')
            .join('')
        : '';

      if (!outputText) {
        res.status(502).json({ success: false, error: 'AI service returned an empty response. Please try again later.' });
        return;
      }

      await writeAuditLog({
        action: 'AI_GENERATION_REQUESTED',
        actor: req.user!.username,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
        details: 'Generated an AI copilot response without persisting prompt or generated content.',
        severity: 'info'
      });

      res.json({ success: true, result: outputText });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err: any) {
    console.error('Server Gemini API call failed:', err);
    res.status(502).json({ success: false, error: 'AI service request failed. Please try again later.' });
  }
});

// ----------------------------------------------------
// 12. DATA MIGRATION: IMPORT FROM LEGACY LOCALSTORAGE
// ----------------------------------------------------

apiRouter.post('/migration/import-local', requireAuth, requirePermission('canRunDataMigration'), (req: AuthenticatedRequest, res: Response): void => {
  if (getDataSourceMode() === 'postgres') {
    res.status(409).json({ success: false, error: 'Legacy JSON import is disabled while PostgreSQL is the active datasource. Use the relational migration pipeline.' });
    return;
  }
  const { leads, clients, projects, invoices, expenses, vendors, cmsServices, cmsProjects, cmsTestimonials } = req.body;
  const db = getDatabase();
  let importedCount = 0;

  if (Array.isArray(leads) && leads.length > 0) {
    for (const lead of leads) {
      if (!db.leads.some(l => l.id === lead.id || l.email === lead.email)) {
        db.leads.push(lead);
        importedCount++;
      }
    }
  }

  if (Array.isArray(clients) && clients.length > 0) {
    for (const client of clients) {
      if (!db.clients.some(c => c.id === client.id)) {
        db.clients.push(client);
        importedCount++;
      }
    }
  }

  if (Array.isArray(projects) && projects.length > 0) {
    for (const project of projects) {
      if (!db.projects.some(p => p.id === project.id)) {
        db.projects.push(project);
        importedCount++;
      }
    }
  }

  if (Array.isArray(invoices) && invoices.length > 0) {
    for (const invoice of invoices) {
      if (!db.invoices.some(i => i.id === invoice.id || i.invoiceNumber === invoice.invoiceNumber)) {
        db.invoices.push(invoice);
        importedCount++;
      }
    }
  }

  if (Array.isArray(expenses) && expenses.length > 0) {
    for (const expense of expenses) {
      if (!db.expenses.some(e => e.id === expense.id)) {
        db.expenses.push(expense);
        importedCount++;
      }
    }
  }

  if (Array.isArray(vendors) && vendors.length > 0) {
    for (const vendor of vendors) {
      if (!db.vendors.some(v => v.id === vendor.id)) {
        db.vendors.push(vendor);
        importedCount++;
      }
    }
  }

  if (Array.isArray(cmsServices) && cmsServices.length > 0) {
    for (const srv of cmsServices) {
      if (!db.cmsServices.some(s => s.id === srv.id || s.slug === srv.slug)) {
        db.cmsServices.push(srv);
        importedCount++;
      }
    }
  }

  if (Array.isArray(cmsProjects) && cmsProjects.length > 0) {
    for (const proj of cmsProjects) {
      if (!db.cmsProjects.some(p => p.id === proj.id || p.slug === proj.slug)) {
        db.cmsProjects.push(proj);
        importedCount++;
      }
    }
  }

  if (Array.isArray(cmsTestimonials) && cmsTestimonials.length > 0) {
    for (const t of cmsTestimonials) {
      if (!db.cmsTestimonials.some(existing => existing.id === t.id)) {
        db.cmsTestimonials.push(t);
        importedCount++;
      }
    }
  }

  saveDatabase(db);

  recordAuditLog({
    action: 'DATA_MIGRATION',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Imported and synchronized ${importedCount} records from legacy client storage into persistent database.`,
    severity: 'info'
  });

  res.json({
    success: true,
    importedCount,
    message: `Successfully migrated ${importedCount} records into the server database.`
  });
});

// ----------------------------------------------------
// 13. PROPOSALS & QUOTATIONS (PART 12)
// ----------------------------------------------------

apiRouter.get('/crm/proposals', requireAuth, requirePermission('canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (getDataSourceMode() === 'postgres') { const proposals = await postgresProposalRepository.list(); res.json({ success: true, proposals }); return; }
  const db = getDatabase();
  res.json({ success: true, proposals: db.proposals || [] });
});

apiRouter.post('/crm/proposals', requireAuth, requirePermission('canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = req.body;
  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems.slice(0, 100).map((item: any) => ({
    id: cleanText(item?.id || crypto.randomBytes(4).toString('hex'), 80),
    description: cleanText(item?.description, 500),
    quantity: normalizeNumber(item?.quantity ?? 1, 0.01, 100000, 1) || 1,
    unitPrice: normalizeNumber(item?.unitPrice ?? 0, 0, MAX_MONEY, 0) || 0
  })).filter((item: any) => item.description && item.quantity > 0);
  if (!items.length) {
    res.status(400).json({ success: false, error: 'Proposal requires at least one valid line item.' });
    return;
  }
  const subtotal = items.reduce((sum: number, it: any) => sum + (it.quantity * it.unitPrice), 0);
  const discount = Math.min(subtotal, Math.max(0, Number(data.discount) || 0));
  const taxPercent = Math.min(100, Math.max(0, Number(data.taxPercent ?? 11) || 0));
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * (taxPercent / 100));
  const total = taxableAmount + tax;
  const requestedStatus = String(data.status || 'Draft');
  const statusValues = new Set(['Draft','Internal Review','Sent']);
  if (!statusValues.has(requestedStatus)) {
    res.status(requestedStatus === 'Approved' || requestedStatus === 'Rejected' ? 403 : 409).json({
      success: false,
      error: requestedStatus === 'Accepted'
        ? 'Accepted status can only be created by the proposal-to-invoice workflow.'
        : 'Proposal approval status must use the approval workflow.'
    });
    return;
  }
  const status = requestedStatus;
  const currency = data.currency === 'USD' ? 'USD' : 'IDR';
  const newProposal = {
    id: `prop_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    proposalNumber: cleanText(data.proposalNumber || `PROP-KAPI-${new Date().getFullYear()}-${crypto.randomInt(1000, 1000000)}`, 80),
    title: cleanText(data.title || 'Digital Engineering Proposal', 240),
    clientName: cleanText(data.clientName || 'Prospective Client', 160),
    company: cleanText(data.company, 200),
    dealId: cleanText(data.dealId, 120),
    projectId: cleanText(data.projectId, 120),
    items,
    subtotal,
    discount,
    taxPercent,
    tax,
    total,
    currency,
    validityPeriod: cleanText(data.validityPeriod || '30 Days', 80),
    paymentTerms: cleanText(data.paymentTerms || '50% Upfront, 50% on Delivery', 300),
    owner: req.user!.name || req.user!.username,
    status,
    notes: cleanText(data.notes, 3000),
    createdDate: new Date().toISOString().split('T')[0],
    sentDate: data.sentDate || null,
    approvedDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (getDataSourceMode() === 'postgres') { const proposal = await postgresProposalRepository.create(newProposal, makeAuditEntry(req, 'PROPOSAL_CREATED', `Created proposal ${newProposal.proposalNumber} (Total: ${newProposal.total}).`)); res.json({ success: true, proposal }); return; }

  if (!db?.proposals) db!.proposals = [];
  db!.proposals.unshift(newProposal);
  saveDatabase(db!);

  recordAuditLog({
    action: 'PROPOSAL_CREATED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Created proposal ${newProposal.proposalNumber} for ${newProposal.clientName} (Total: ${newProposal.total}).`,
    severity: 'info'
  });

  res.json({ success: true, proposal: newProposal });
});

apiRouter.put('/crm/proposals/:id', requireAuth, requirePermission('canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body || {};
  const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  const idx = db?.proposals?.findIndex(p => p.id === id) ?? -1;

  if (getDataSourceMode() === 'postgres') {
    const existing = await postgresProposalRepository.findById(id);
    if (!existing) { res.status(404).json({ success: false, error: 'Proposal not found.' }); return; }
    const items = Array.isArray(updates.items) ? updates.items.slice(0, 100).map((item: any) => ({
      id: cleanText(item?.id || crypto.randomBytes(4).toString('hex'), 80),
      description: cleanText(item?.description, 500),
      quantity: Math.min(100000, Math.max(0, Number(item?.quantity) || 0)),
      unitPrice: Math.min(10_000_000_000, Math.max(0, Number(item?.unitPrice) || 0))
    })).filter((item: any) => item.description && item.quantity > 0) : existing.items;
    if (!items.length) { res.status(400).json({ success: false, error: 'Proposal requires at least one valid line item.' }); return; }
    const subtotal = items.reduce((sum: number, it: any) => sum + Number(it.quantity) * Number(it.unitPrice), 0);
    const discount = updates.discount !== undefined ? Math.min(subtotal, Math.max(0, Number(updates.discount) || 0)) : existing.discount;
    const taxPercent = updates.taxPercent !== undefined ? Math.min(100, Math.max(0, Number(updates.taxPercent) || 0)) : existing.taxPercent;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * (taxPercent / 100));
    const total = taxableAmount + tax;
    const patch = pickFields(updates, ['proposalNumber','title','clientName','company','dealId','projectId','currency','validityPeriod','paymentTerms','status','notes','sentDate']);
    if (patch.proposalNumber !== undefined && !/^[A-Za-z0-9._/-]{1,80}$/.test(String(patch.proposalNumber))) { res.status(400).json({ success: false, error: 'Invalid proposal number.' }); return; }
    for (const key of ['title','clientName','company','dealId','projectId','validityPeriod','paymentTerms','notes'] as const) if (patch[key] !== undefined) patch[key] = cleanText(patch[key], key === 'notes' ? 3000 : 300);
    if (patch.currency !== undefined && !['IDR','USD'].includes(String(patch.currency))) { res.status(400).json({ success: false, error: 'Invalid proposal currency.' }); return; }
    if (patch.status !== undefined && !['Draft','Internal Review','Sent','Approved','Rejected','Accepted'].includes(String(patch.status))) { res.status(400).json({ success: false, error: 'Invalid proposal status.' }); return; }
    if (['Approved', 'Rejected'].includes(String(patch.status)) && !Boolean(req.user!.permissions?.canApproveBudgets) && req.user!.stakeholderType !== 'Master') {
      res.status(403).json({ success: false, error: 'Proposal approval status requires approval permission.' });
      return;
    }
    if (patch.status === 'Accepted' && String(existing.status) !== 'Accepted') {
      res.status(409).json({ success: false, error: 'Accepted status can only be created by the proposal-to-invoice workflow.' });
      return;
    }
    if (patch.sentDate !== undefined && patch.sentDate !== null && !isValidDate(patch.sentDate)) { res.status(400).json({ success: false, error: 'Invalid proposal sent date.' }); return; }
    let proposal;
    try {
      proposal = await postgresProposalRepository.update(id, { ...patch, items, subtotal, discount, taxPercent, tax, total }, makeAuditEntry(req, 'PROPOSAL_UPDATED', `Updated proposal ${id}.`));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Proposal could not be updated.';
      if (message === 'ACCEPTED_PROPOSAL_IMMUTABLE') { res.status(409).json({ success: false, error: 'Accepted proposals cannot be reopened or moved to another status.' }); return; }
      if (message === 'ACCEPTED_PROPOSAL_WORKFLOW_ONLY') { res.status(409).json({ success: false, error: 'Accepted status can only be created by the proposal-to-invoice workflow.' }); return; }
      throw error;
    }
    res.json({ success: true, proposal }); return;
  }

  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Proposal not found.' });
    return;
  }

  const existing = db!.proposals[idx];

  if (updates.status !== undefined) {
    const requestedStatus = String(updates.status);
    if (!['Draft','Internal Review','Sent','Approved','Rejected','Accepted'].includes(requestedStatus)) {
      res.status(400).json({ success: false, error: 'Invalid proposal status.' });
      return;
    }
    if (['Approved', 'Rejected'].includes(requestedStatus) && req.user!.stakeholderType !== 'Master' && !req.user!.permissions?.canApproveBudgets) {
      res.status(403).json({ success: false, error: 'Proposal approval status requires approval permission.' });
      return;
    }
    if (requestedStatus === 'Accepted' && String(existing.status) !== 'Accepted') {
      res.status(409).json({ success: false, error: 'Accepted status can only be created by the proposal-to-invoice workflow.' });
      return;
    }
    if (String(existing.status) === 'Accepted' && requestedStatus !== 'Accepted') {
      res.status(409).json({ success: false, error: 'Accepted proposals cannot be reopened or moved to another status.' });
      return;
    }
    if (['Approved','Rejected'].includes(requestedStatus) && String(existing.status) === requestedStatus) {
      res.status(409).json({ success: false, error: 'Proposal is already in the requested approval state.' });
      return;
    }
    if (['Approved','Rejected'].includes(requestedStatus) && !['Draft','Internal Review','Sent'].includes(String(existing.status))) {
      res.status(409).json({ success: false, error: 'Invalid proposal approval transition.' });
      return;
    }
  }

  const items = Array.isArray(updates.items) ? updates.items.slice(0, 100).map((item: any) => ({
    id: cleanText(item?.id || crypto.randomBytes(4).toString('hex'), 80),
    description: cleanText(item?.description, 500),
    quantity: Math.min(100000, Math.max(0, Number(item?.quantity) || 0)),
    unitPrice: Math.min(10_000_000_000, Math.max(0, Number(item?.unitPrice) || 0))
  })).filter((item: any) => item.description && item.quantity > 0) : existing.items;
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: 'Proposal requires at least one valid line item.' });
    return;
  }
  const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0);
  const discount = updates.discount !== undefined ? Math.min(subtotal, Math.max(0, Number(updates.discount) || 0)) : (existing.discount || 0);
  const taxPercent = updates.taxPercent !== undefined ? Math.min(100, Math.max(0, Number(updates.taxPercent) || 0)) : (existing.taxPercent || 11);
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * (taxPercent / 100));
  const total = taxableAmount + tax;
  const patch = pickFields(updates, ['proposalNumber','title','clientName','company','dealId','projectId','currency','validityPeriod','paymentTerms','status','notes','sentDate']);
  if (patch.proposalNumber !== undefined && !/^[A-Za-z0-9._/-]{1,80}$/.test(String(patch.proposalNumber))) {
    res.status(400).json({ success: false, error: 'Invalid proposal number.' });
    return;
  }
  for (const key of ['title','clientName','company','dealId','projectId','validityPeriod','paymentTerms','notes'] as const) {
    if (patch[key] !== undefined) patch[key] = cleanText(patch[key], key === 'notes' ? 3000 : 300);
  }
  if (patch.currency !== undefined && !['IDR','USD'].includes(String(patch.currency))) {
    res.status(400).json({ success: false, error: 'Invalid proposal currency.' });
    return;
  }
  if (patch.status !== undefined && !['Draft','Internal Review','Sent','Approved','Rejected','Accepted'].includes(String(patch.status))) {
    res.status(400).json({ success: false, error: 'Invalid proposal status.' });
    return;
  }
  if (patch.status === 'Accepted' && String(existing.status) !== 'Accepted') {
    res.status(409).json({ success: false, error: 'Accepted status can only be created by the proposal-to-invoice workflow.' });
    return;
  }
  if (['Approved', 'Rejected'].includes(String(patch.status)) && !Boolean(req.user!.permissions?.canApproveBudgets) && req.user!.stakeholderType !== 'Master') {
    res.status(403).json({ success: false, error: 'Proposal approval status requires approval permission.' });
    return;
  }
  if (patch.sentDate !== undefined && patch.sentDate !== null && !isValidDate(patch.sentDate)) {
    res.status(400).json({ success: false, error: 'Invalid proposal sent date.' });
    return;
  }
  db!.proposals[idx] = {
    ...existing,
    ...patch,
    items,
    subtotal,
    discount,
    taxPercent,
    tax,
    total,
    updatedAt: new Date().toISOString()
  };

  saveDatabase(db!);
  recordAuditLog({
    action: 'PROPOSAL_UPDATED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Updated proposal ${db!.proposals[idx].proposalNumber}.`,
    severity: 'info'
  });
  res.json({ success: true, proposal: db!.proposals[idx] });
});

apiRouter.post('/crm/proposals/:id/approve', requireAuth, requirePermission('canApproveBudgets'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    const current = await postgresProposalRepository.findById(id);
    if (!current) { res.status(404).json({ success: false, error: 'Proposal not found.' }); return; }
    if (!['Draft','Internal Review','Sent'].includes(String(current.status))) { res.status(409).json({ success: false, error: 'Only draft, internal review, or sent proposals can be approved.' }); return; }
    const approved = await postgresProposalRepository.approve(id, makeAuditEntry(req, 'PROPOSAL_APPROVED', `Approved proposal ${current.proposalNumber}.`));

    res.json({ success: true, proposal: approved });
    return;
  }
  const db = getDatabase();
  const prop = (db.proposals || []).find(p => p.id === id);
  if (!prop) { res.status(404).json({ success: false, error: 'Proposal not found.' }); return; }

  if (!['Draft','Internal Review','Sent'].includes(String(prop.status))) {
    res.status(409).json({ success: false, error: 'Only draft, internal review, or sent proposals can be approved.' });
    return;
  }
  prop.status = 'Approved';
  prop.approvedDate = new Date().toISOString().split('T')[0];
  prop.updatedAt = new Date().toISOString();
  saveDatabase(db);

  recordAuditLog({
    action: 'PROPOSAL_APPROVED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Approved proposal ${prop.proposalNumber}.`,
    severity: 'info'
  });

  res.json({ success: true, proposal: prop });
});

apiRouter.post('/crm/proposals/:id/convert-to-invoice', requireAuth, requirePermission('canManageInvoices'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    const current = await postgresProposalRepository.findById(id);
    if (!current) { res.status(404).json({ success: false, error: 'Proposal not found.' }); return; }
    try {
      const invoice = await postgresProposalRepository.convertToInvoice(id, makeAuditEntry(req, 'PROPOSAL_CONVERTED_TO_INVOICE', `Converted proposal ${current.proposalNumber} to invoice.`, 'info'));

      res.json({ success: true, invoice, proposal: await postgresProposalRepository.findById(id) });
    } catch (error) {
      res.status(409).json({ success: false, error: error instanceof Error ? error.message : 'Proposal could not be converted to invoice.' });
    }
    return;
  }
  const db = getDatabase();
  const prop = (db.proposals || []).find(p => p.id === id);
  if (!prop) { res.status(404).json({ success: false, error: 'Proposal not found.' }); return; }
  if (!['Draft','Internal Review','Sent','Approved'].includes(String(prop.status))) {
    res.status(409).json({ success: false, error: 'Proposal cannot be converted to an invoice in its current status.' });
    return;
  }
  const proposalClientId = String(prop.clientId || '').trim();
  const proposalProjectId = String(prop.projectId || '').trim();
  if (proposalClientId && !(db.clients || []).some((client: any) => String(client.id) === proposalClientId)) {
    res.status(409).json({ success: false, error: 'Proposal client not found.' });
    return;
  }
  if (proposalProjectId) {
    const proposalProject = (db.projects || []).find((project: any) => String(project.id) === proposalProjectId);
    if (!proposalProject) { res.status(409).json({ success: false, error: 'Proposal project not found.' }); return; }
    const projectClientId = String(proposalProject.clientId || '').trim();
    if (proposalClientId && projectClientId && proposalClientId !== projectClientId) {
      res.status(409).json({ success: false, error: 'Proposal project does not belong to the selected client.' });
      return;
    }
  }

  const year = new Date().getFullYear();
  let invoiceNumber = `INV-KAPI-${year}-${crypto.randomInt(1000, 1000000)}`;
  while (db.invoices.some((invoice: any) => invoice.invoiceNumber === invoiceNumber)) {
    invoiceNumber = `INV-KAPI-${year}-${crypto.randomInt(1000, 1000000)}`;
  }
  const newInvoice = {
    id: `inv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    invoiceNumber,
    clientName: prop.clientName,
    clientCompany: prop.company || prop.clientName,
    clientEmail: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    items: prop.items,
    subtotal: prop.subtotal,
    taxPercent: prop.taxPercent,
    taxAmount: prop.tax,
    total: prop.total,
    amountPaid: 0,
    balanceDue: prop.total,
    payments: [],
    notes: `Generated from Proposal ${prop.proposalNumber}. Terms: ${prop.paymentTerms}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.invoices.unshift(newInvoice);
  prop.status = 'Accepted';
  prop.updatedAt = new Date().toISOString();
  saveDatabase(db);

  recordAuditLog({
    action: 'PROPOSAL_CONVERTED_TO_INVOICE',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Converted proposal ${prop.proposalNumber} to invoice ${newInvoice.invoiceNumber}.`,
    severity: 'info'
  });

  res.json({ success: true, invoice: newInvoice, proposal: prop });
});

apiRouter.delete('/crm/proposals/:id', requireAuth, requirePermission('canManageCrm'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    const existing = await postgresProposalRepository.findById(id);
    if (!existing) { res.status(404).json({ success: false, error: 'Proposal not found.' }); return; }
    let deleted: boolean;
    try {
      deleted = await postgresProposalRepository.delete(id, makeAuditEntry(req, 'PROPOSAL_DELETED', `Deleted proposal ${existing.proposalNumber}.`, 'warning'));
    } catch (error) {
      if (error instanceof Error && error.message === 'PROPOSAL_DELETE_RESTRICTED') {
        res.status(409).json({ success: false, error: 'Only Draft proposals can be deleted.' });
        return;
      }
      throw error;
    }
    if (!deleted) { res.status(404).json({ success: false, error: 'Proposal not found.' }); return; }
        res.json({ success: true, message: 'Proposal deleted.' });
    return;
  }
  const db = getDatabase();
  db.proposals = (db.proposals || []).filter(p => p.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Proposal deleted.' });
});

// ----------------------------------------------------
// 14. PROJECT TASKS & TIME TRACKING (PARTS 16, 17, 18)
// ----------------------------------------------------

apiRouter.get('/projects/tasks', requireAuth, requireAnyPermission('canManageKanbanTasks', 'canManageProjects'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tasks = getDataSourceMode() === 'postgres' ? await postgresTaskRepository.list() : getDatabase().tasks || [];
  res.json({ success: true, tasks });
});

apiRouter.post('/projects/tasks', requireAuth, requirePermission('canManageKanbanTasks'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const taskData = req.body || {};
  const dueDate = String(taskData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const estimatedHours = normalizeNumber(taskData.estimatedHours ?? 8, 0, 10000, 8);
  const actualHours = normalizeNumber(taskData.actualHours ?? 0, 0, 10000, 0);
  const priority = ['low','medium','high','urgent'].includes(String(taskData.priority)) ? String(taskData.priority) : 'medium';
  const status = ['todo','in_progress','review','done'].includes(String(taskData.status)) ? String(taskData.status) : 'todo';
  if (!taskData.title || !isValidDate(dueDate) || estimatedHours === null || actualHours === null) {
    res.status(400).json({ success: false, error: 'Task title, due date, and valid hour values are required.' }); return;
  }
  const newTask = {
    id: `task_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    title: cleanText(taskData.title, 240),
    projectId: cleanText(taskData.projectId, 120),
    projectName: cleanText(taskData.projectName || 'General Delivery', 200),
    assignee: cleanText(taskData.assignee || req.user!.name || req.user!.username, 160),
    reporter: req.user!.name || req.user!.username,
    priority, status, dueDate, estimatedHours, actualHours,
    tags: normalizeStringArray(Array.isArray(taskData.tags) && taskData.tags.length ? taskData.tags : ['Sprint'], 30, 80),
    subtasks: Array.isArray(taskData.subtasks) ? taskData.subtasks.slice(0, 50) : [],
    description: cleanText(taskData.description, 3000),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (getDataSourceMode() === 'postgres') {
    try {
      const task = await postgresTaskRepository.create(newTask, makeAuditEntry(req, 'TASK_CREATED', `Created task "${newTask.title}".`));
      res.json({ success: true, task }); return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Task could not be created.';
      res.status(message === 'Project not found.' ? 404 : message === 'ASSIGNEE_NOT_FOUND' ? 400 : 409).json({ success: false, error: message }); return;
    }
  }
  const db = getDatabase();
  db.tasks.unshift(newTask);
  saveDatabase(db);
  recordAuditLog({ action: 'TASK_CREATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Created task "${newTask.title}".`, severity: 'info' });
  res.json({ success: true, task: newTask });
});

apiRouter.put('/projects/tasks/:id', requireAuth, requirePermission('canManageKanbanTasks'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body || {};
  const patch = pickFields(updates, ['title','description','projectId','projectName','assignee','priority','status','dueDate','estimatedHours','actualHours','tags','subtasks','updatedAt']);
  for (const key of ['title','description','projectId','projectName','assignee'] as const) if (patch[key] !== undefined) patch[key] = cleanText(patch[key], key === 'description' ? 3000 : 240);
  if (patch.status !== undefined && !['todo','in_progress','review','done'].includes(String(patch.status))) { res.status(400).json({ success: false, error: 'Invalid task status.' }); return; }
  if (patch.priority !== undefined && !['low','medium','high','urgent'].includes(String(patch.priority))) { res.status(400).json({ success: false, error: 'Invalid task priority.' }); return; }
  if (patch.dueDate !== undefined && !isValidDate(patch.dueDate)) { res.status(400).json({ success: false, error: 'Invalid task due date.' }); return; }
  for (const key of ['estimatedHours','actualHours'] as const) {
    if (patch[key] !== undefined) { const numeric = normalizeNumber(patch[key], 0, 10000); if (numeric === null) { res.status(400).json({ success: false, error: `Invalid task hours for ${key}.` }); return; } patch[key] = numeric; }
  }
  if (patch.tags !== undefined) patch.tags = normalizeStringArray(patch.tags, 30, 80);
  if (patch.subtasks !== undefined) patch.subtasks = Array.isArray(patch.subtasks) ? patch.subtasks.slice(0, 50) : [];
  if (getDataSourceMode() === 'postgres') {
    try {
      const task = await postgresTaskRepository.update(id, patch, makeAuditEntry(req, 'TASK_UPDATED', `Updated task ${id}.`));
      if (!task) { res.status(404).json({ success: false, error: 'Task not found.' }); return; }
      res.json({ success: true, task }); return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Task could not be updated.';
      res.status(message.includes('modified since') ? 409 : message.endsWith('not found.') ? 404 : 409).json({ success: false, error: message }); return;
    }
  }
  const db = getDatabase(); const idx = (db.tasks || []).findIndex(t => t.id === id);
  if (idx === -1) { res.status(404).json({ success: false, error: 'Task not found.' }); return; }
  db.tasks[idx] = { ...db.tasks[idx], ...patch, updatedAt: new Date().toISOString() }; saveDatabase(db);
  recordAuditLog({ action: 'TASK_UPDATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Updated task ${id}.`, severity: 'info' });
  res.json({ success: true, task: db.tasks[idx] });
});

apiRouter.delete('/projects/tasks/:id', requireAuth, requirePermission('canManageKanbanTasks'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    try {
      const deleted = await postgresTaskRepository.delete(id, makeAuditEntry(req, 'TASK_DELETED', `Deleted task ${id}.`, 'warning'));
      if (!deleted) { res.status(404).json({ success: false, error: 'Task not found.' }); return; }
    } catch (error) {
      if (error instanceof Error && error.message === 'TASK_HAS_TIME_LOGS') {
        res.status(409).json({ success: false, error: 'Task has time logs and cannot be deleted.' });
        return;
      }
      throw error;
    }
    res.json({ success: true, message: 'Task deleted.' }); return;
  }
  const db = getDatabase(); const exists = (db.tasks || []).some(t => t.id === id);
  if (!exists) { res.status(404).json({ success: false, error: 'Task not found.' }); return; }
  db.tasks = (db.tasks || []).filter(t => t.id !== id); saveDatabase(db);
  recordAuditLog({ action: 'TASK_DELETED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Deleted task ${id}.`, severity: 'warning' });
  res.json({ success: true, message: 'Task deleted.' });
});

// Time Tracking
apiRouter.get('/projects/timelogs', requireAuth, requireAnyPermission('canManageKanbanTasks', 'canManageProjects'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const timeLogs = getDataSourceMode() === 'postgres' ? await postgresTimeLogRepository.list() : getDatabase().timeLogs || [];
  res.json({ success: true, timeLogs });
});

apiRouter.post('/projects/timelogs', requireAuth, requireAnyPermission('canManageKanbanTasks', 'canManageProjects'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const logData = req.body || {};
  const durationMinutes = normalizeNumber(logData.durationMinutes ?? 60, 1, 1440, 60);
  const date = String(logData.date || new Date().toISOString().slice(0, 10));
  if (durationMinutes === null || !isValidDate(date)) { res.status(400).json({ success: false, error: 'Valid duration and date are required for a time entry.' }); return; }
  const newLog = {
    id: `tim_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    projectId: cleanText(logData.projectId, 120), projectName: cleanText(logData.projectName || 'General', 200),
    taskId: cleanText(logData.taskId, 120), taskTitle: cleanText(logData.taskTitle, 240),
    user: req.user!.name || req.user!.username, userId: req.user!.id, durationMinutes,
    billable: logData.billable !== undefined ? Boolean(logData.billable) : true, date,
    notes: cleanText(logData.notes, 2000), createdAt: new Date().toISOString()
  };
  if (getDataSourceMode() === 'postgres') {
    try {
      const timeLog = await postgresTimeLogRepository.create(newLog, makeAuditEntry(req, 'TIMELOG_CREATED', `Created ${durationMinutes} minute time entry for ${newLog.projectName}.`, 'info'));
      res.json({ success: true, timeLog }); return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Time entry could not be created.';
      res.status(message.endsWith('not found.') ? 404 : 409).json({ success: false, error: message }); return;
    }
  }
  const db = getDatabase();
  if (!db.timeLogs) db.timeLogs = []; db.timeLogs.unshift(newLog); saveDatabase(db);
  recordAuditLog({ action: 'TIMELOG_CREATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Created ${durationMinutes} minute time entry for ${newLog.projectName}.`, severity: 'info' });
  res.json({ success: true, timeLog: newLog });
});

apiRouter.delete('/projects/timelogs/:id', requireAuth, requireAnyPermission('canManageKanbanTasks', 'canManageProjects'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const canManageAllTimeLogs = Boolean(req.user!.permissions?.canManageProjects);
  if (getDataSourceMode() === 'postgres') {
    const existing = await postgresTimeLogRepository.findById(id);
    if (!existing) { res.status(404).json({ success: false, error: 'Time entry not found.' }); return; }
    if (!canManageAllTimeLogs && String(existing.userId || '') !== String(req.user!.id)) {
      res.status(403).json({ success: false, error: 'You can only delete your own time entries.' });
      return;
    }
    const deleted = await postgresTimeLogRepository.delete(id, makeAuditEntry(req, 'TIMELOG_DELETED', `Deleted time entry ${id}.`, 'warning'));
    if (!deleted) { res.status(404).json({ success: false, error: 'Time entry not found.' }); return; }
    res.json({ success: true, message: 'Time entry deleted.' }); return;
  }
  const db = getDatabase(); const existing = (db.timeLogs || []).find(t => t.id === id);
  if (!existing) { res.status(404).json({ success: false, error: 'Time entry not found.' }); return; }
  if (!canManageAllTimeLogs && String(existing.userId || '') !== String(req.user!.id)) {
    res.status(403).json({ success: false, error: 'You can only delete your own time entries.' });
    return;
  }
  db.timeLogs = (db.timeLogs || []).filter(t => t.id !== id); saveDatabase(db);
  recordAuditLog({ action: 'TIMELOG_DELETED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Deleted time entry ${id}.`, severity: 'warning' });
  res.json({ success: true, message: 'Time entry deleted.' });
});

// ----------------------------------------------------
// 15. APPROVALS CENTER (PART 24)
// ----------------------------------------------------

apiRouter.get('/approvals', requireAuth, requireAnyPermission('canApproveBudgets', 'canManageProjects', 'canViewFinancials'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (getDataSourceMode() === 'postgres') {
    const approvals = await postgresApprovalRepository.list();
    res.json({ success: true, approvals });
    return;
  }
  const db = getDatabase();
  res.json({ success: true, approvals: db.approvals || [] });
});

apiRouter.post('/approvals', requireAuth, requireAnyPermission('canManageProjects', 'canApproveBudgets'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = req.body || {};
  const type = String(data.type || 'Invoice').trim();
  if (!['Invoice','Proposal','Project','Expense'].includes(type)) {
    res.status(400).json({ success: false, error: 'Unsupported approval type.' });
    return;
  }
  const referenceId = String(data.referenceId || '').trim().slice(0, 120);
  const title = String(data.title || 'Approval Request').trim().slice(0, 200);
  const reason = String(data.reason || 'Standard operational review').trim().slice(0, 2000);
  const riskLevel = ['Low', 'Medium', 'High', 'Critical'].includes(String(data.riskLevel)) ? String(data.riskLevel) : 'Low';
  const value = Number(data.value);
  if (!title || !reason || !Number.isFinite(value) || value < 0) {
    res.status(400).json({ success: false, error: 'Approval title, reason, and a valid non-negative value are required.' });
    return;
  }
  const referenceTableByType: Record<string, string> = {
    Invoice: 'invoices', Proposal: 'proposals', Project: 'projects', Expense: 'expenses'
  };
  const referenceTable = referenceTableByType[type];
  const jsonDb = getDataSourceMode() === 'json' ? getDatabase() : undefined;
  if (jsonDb) {
    const referenceRows = (jsonDb as any)?.[referenceTable] || [];
    if (!referenceRows.some((row: any) => String(row.id) === referenceId)) {
      res.status(409).json({ success: false, error: 'Approval reference not found.' });
      return;
    }
  }

  const newApproval = {
    id: `appr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    type, referenceId, title,
    requesterId: req.user!.id,
    requester: req.user!.name || req.user!.username,
    requesterRole: req.user!.role,
    value, date: new Date().toISOString().split('T')[0],
    reason, riskLevel, status: 'Pending', createdAt: new Date().toISOString()
  };
  if (getDataSourceMode() === 'postgres') {
    let approval;
    try {
      approval = await postgresApprovalRepository.create(newApproval, makeAuditEntry(req, 'APPROVAL_CREATED', `Created approval request "${title}" for ${value}.`, riskLevel === 'Critical' ? 'critical' : riskLevel === 'High' ? 'warning' : 'info'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Approval request could not be created.';
      if (message.includes('reference is required') || message.includes('reference not found')) {
        res.status(409).json({ success: false, error: message });
        return;
      }
      throw error;
    }
    pushNotification(undefined, { title: 'Approval request pending', message: `${newApproval.title} requires an independent review.`, type: 'approval', severity: riskLevel === 'Critical' ? 'critical' : riskLevel === 'High' ? 'warning' : 'info', linkUrl: '/admin/approvals' });

    res.status(201).json({ success: true, approval });
    return;
  }
  const db = getDatabase();
  if (!db.approvals) db.approvals = [];
  db.approvals.unshift(newApproval);
  pushNotification(db, { title: 'Approval request pending', message: `${newApproval.title} requires an independent review.`, type: 'approval', severity: riskLevel === 'Critical' ? 'critical' : riskLevel === 'High' ? 'warning' : 'info', linkUrl: '/admin/approvals' });
  saveDatabase(db);
  recordAuditLog({ action: 'APPROVAL_CREATED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Created approval request "${title}" for ${value}.`, severity: riskLevel === 'Critical' ? 'critical' : riskLevel === 'High' ? 'warning' : 'info' });
  res.status(201).json({ success: true, approval: newApproval });
});

apiRouter.post('/approvals/:id/action', requireAuth, requirePermission('canApproveBudgets'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const action = String(req.body?.action || '');
  const notes = String(req.body?.notes || '').trim().slice(0, 2000);
  const allowedActions = new Set(['Approve', 'Reject', 'Request Changes']);
  if (!allowedActions.has(action)) {
    res.status(400).json({ success: false, error: 'Invalid approval action.' });
    return;
  }
  if (getDataSourceMode() === 'postgres') {
    const item = await postgresApprovalRepository.findById(id);
    if (!item) { res.status(404).json({ success: false, error: 'Approval item not found.' }); return; }
    if (item.status !== 'Pending') { res.status(409).json({ success: false, error: 'This approval request has already been resolved.' }); return; }
    if (item.requesterId === req.user!.id) {
      await writeAuditLog(makeAuditEntry(req, 'APPROVAL_SELF_ACTION_BLOCKED', `Blocked self-approval action "${action}" on approval item "${item.title}".`, 'warning'));
      res.status(403).json({ success: false, error: 'Maker-checker control: the requester cannot approve or reject their own request.' });
      return;
    }
    const status = action === 'Approve' ? 'Approved' : action === 'Reject' ? 'Rejected' : 'Changes Requested';
    let updated;
    try {
      updated = await postgresApprovalRepository.action(id, status, req.user!, notes, makeAuditEntry(req, `APPROVAL_${action.toUpperCase().replace(/ /g, '_')}`, `${action} decision executed for approval item "${item.title}".`, action === 'Reject' ? 'warning' : 'info'));
    } catch (error) {
      if (error instanceof Error && error.message === 'APPROVAL_SELF_ACTION_BLOCKED') {
        await writeAuditLog(makeAuditEntry(
          req,
          'APPROVAL_SELF_ACTION_BLOCKED',
          'Blocked self-approval action "' + action + '" on approval item "' + item.title + '".',
          'warning'
        ));
        res.status(403).json({ success: false, error: 'Maker-checker control: the requester cannot approve or reject their own request.' });
        return;
      }
      throw error;
    }

    res.json({ success: true, approval: updated });
    return;
  }
  const db = getDatabase();
  const item = (db.approvals || []).find(a => a.id === id);
  if (!item) { res.status(404).json({ success: false, error: 'Approval item not found.' }); return; }
  if (item.status !== 'Pending') { res.status(409).json({ success: false, error: 'This approval request has already been resolved.' }); return; }
  let requesterId = item.requesterId;
  if (!requesterId && item.requester) {
    const legacyRequester = db.users.find(u => u.name === item.requester || u.username === item.requester);
    requesterId = legacyRequester?.id;
  }
  if (requesterId && requesterId === req.user!.id) {
    recordAuditLog({ action: 'APPROVAL_SELF_ACTION_BLOCKED', actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `Blocked self-approval action "${action}" on approval item "${item.title}".`, severity: 'warning' });
    res.status(403).json({ success: false, error: 'Maker-checker control: the requester cannot approve or reject their own request.' });
    return;
  }
  if (requesterId) item.requesterId = requesterId;
  item.status = action === 'Approve' ? 'Approved' : action === 'Reject' ? 'Rejected' : 'Changes Requested';
  item.reviewedById = req.user!.id; item.reviewedBy = req.user!.name || req.user!.username; item.reviewedAt = new Date().toISOString(); item.reviewNotes = notes;
  saveDatabase(db);
  recordAuditLog({ action: `APPROVAL_${action.toUpperCase().replace(/ /g, '_')}`, actor: req.user!.username, actorRole: req.user!.role, ip: req.ip, userAgent: req.headers['user-agent'] as string, details: `${action} decision executed for approval item "${item.title}".`, severity: action === 'Reject' ? 'warning' : 'info' });
  res.json({ success: true, approval: item });
});
// ----------------------------------------------------
// 16. DOCUMENTS & ASSET VAULT
// ----------------------------------------------------

const PRIVATE_DOCUMENT_DIR = process.env.KAPITECH_DATA_DIR
  ? path.join(path.resolve(process.env.KAPITECH_DATA_DIR), 'private-documents')
  : path.join(process.env.HOME || process.cwd(), '.kapitech-ams-data', 'private-documents');

const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);

function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function publicDocument(document: any): any {
  const { storageKey, ownerUserId, accessUserIds, ...safeDocument } = document || {};
  if (safeDocument.sourceType === 'private_file' && safeDocument.status === 'ready') {
    safeDocument.downloadUrl = `/api/documents/${encodeURIComponent(String(safeDocument.id))}/content`;
  }
  return safeDocument;
}

function canAccessDocument(req: AuthenticatedRequest, document: any): boolean {
  if (!req.user || req.user.stakeholderType === 'Master') return true;

  const ownerUserId = String(document?.ownerUserId || '');
  const accessUserIds = Array.isArray(document?.accessUserIds)
    ? document.accessUserIds.map((id: unknown) => String(id))
    : [];

  // Legacy records without an explicit access list keep module-permission access.
  if (!ownerUserId && accessUserIds.length === 0) return true;

  return ownerUserId === req.user.id || accessUserIds.includes(req.user.id);
}

function requireDocumentObjectAccess(req: AuthenticatedRequest, res: Response, document?: any): boolean {
  if (!document) return true;

  if (!canAccessDocument(req, document)) {
    void writeAuditLog({
      action: 'DOCUMENT_ACCESS_DENIED',
      actor: req.user?.username || 'anonymous',
      actorRole: req.user?.role || 'visitor',
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: `Object-level document access denied for "${document.name || req.params.id}".`,
      severity: 'warning'
    });
    res.status(403).json({ success: false, error: 'Document access denied.' });
    return false;
  }

  return true;
}

function getDocumentEncryptionKey(): Buffer {
  const raw = process.env.KAPITECH_DATA_ENCRYPTION_KEY?.trim() || '';
  const key = /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('Document encryption key is not configured correctly.');
  }
  return key;
}

function encryptPrivateDocument(buffer: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getDocumentEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.from(
    'KAPI-FILE-V1:' + JSON.stringify({
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      data: encrypted.toString('base64')
    }),
    'utf8'
  );
}

function decryptPrivateDocument(payload: Buffer): Buffer {
  const raw = payload.toString('utf8');
  if (!raw.startsWith('KAPI-FILE-V1:')) {
    throw new Error('Private document encryption header is invalid.');
  }
  const envelope = JSON.parse(raw.slice('KAPI-FILE-V1:'.length));
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getDocumentEncryptionKey(),
    Buffer.from(envelope.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(envelope.data, 'base64')),
    decipher.final()
  ]);
}

const documentAccessMiddleware = requireAnyPermission(
  'canManageProjects',
  'canManageCrm',
  'canViewFinancials',
  'canViewSecurityAuditLogs'
);
const documentMutationMiddleware = requireAnyPermission(
  'canManageProjects',
  'canManageCrm',
  'canAccessServerAndApi'
);

apiRouter.get('/documents', requireAuth, documentAccessMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const documents = getDataSourceMode() === 'postgres'
    ? await postgresDocumentRepository.list()
    : getDatabase().documents || [];
  res.json({
    success: true,
    documents: documents
      .filter((document: any) => canAccessDocument(req, document))
      .map(publicDocument)
  });
});

apiRouter.post('/documents', requireAuth, documentMutationMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = req.body || {};
  const sourceType = data.url ? 'external_link' : 'private_file';
  const name = cleanText(data.name || 'Document', 240);
  const mimeType = cleanText(data.mimeType || '', 160).toLowerCase();

  if (sourceType === 'external_link') {
    const externalUrl = cleanOptionalUrl(data.url);
    let externalProtocol = '';
    try { externalProtocol = new URL(externalUrl).protocol; } catch {}
    if (!externalUrl || externalProtocol !== 'https:') {
      res.status(400).json({ success: false, error: 'Only valid HTTPS document links are allowed.' });
      return;
    }
  } else if (mimeType && !DOCUMENT_MIME_TYPES.has(mimeType)) {
    res.status(400).json({ success: false, error: 'Unsupported document file type.' });
    return;
  }

  const now = new Date().toISOString();
  const newDoc: any = {
    id: `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
    name,
    title: name,
    type: cleanText(data.type || 'Document', 40),
    mimeType,
    size: cleanText(data.size || '0 B', 40),
    sizeBytes: Math.max(0, Math.floor(Number(data.sizeBytes) || 0)),
    category: cleanText(data.category || 'General', 100),
    relatedEntity: cleanText(data.relatedEntity || 'General', 200),
    relatedId: cleanText(data.relatedId || '', 120),
    owner: req.user!.name || req.user!.username,
    ownerUserId: req.user!.id,
    accessUserIds: [req.user!.id],
    sourceType,
    status: sourceType === 'private_file' ? 'pending_upload' : 'external_link',
    uploadedDate: now.split('T')[0],
    createdAt: now,
    updatedAt: now
  };

  if (sourceType === 'private_file') newDoc.storageKey = crypto.randomBytes(32).toString('hex');
  else newDoc.url = cleanOptionalUrl(data.url);

  let created = newDoc;
  if (getDataSourceMode() === 'postgres') {
    created = await postgresDocumentRepository.create(newDoc, makeAuditEntry(req, 'DOCUMENT_CREATED', `Created document record "${name}" (${sourceType}).`, 'info'));
  } else {
    const db = getDatabase();
    if (!db.documents) db.documents = [];
    db.documents.unshift(newDoc);
    db.documents = db.documents.slice(0, 500);
    saveDatabase(db);
  }

  if (getDataSourceMode() !== 'postgres') recordAuditLog({
    action: 'DOCUMENT_CREATED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Created document record "${name}" (${sourceType}).`,
    severity: 'info'
  });

  res.status(201).json({ success: true, document: publicDocument(created) });
});

apiRouter.put('/documents/:id/content', requireAuth, documentMutationMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const document = getDataSourceMode() === 'postgres'
    ? await postgresDocumentRepository.findById(id)
    : (getDatabase().documents || []).find((item: any) => item.id === id);

  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found.' });
    return;
  }
  if (!requireDocumentObjectAccess(req, res, document)) return;

  if (document.sourceType !== 'private_file' || !document.storageKey) {
    res.status(409).json({ success: false, error: 'This document is an external link and has no private file content.' });
    return;
  }

  const body = req.body;
  if (!Buffer.isBuffer(body) || body.length === 0) {
    res.status(400).json({ success: false, error: 'A non-empty document file is required.' });
    return;
  }
  if (body.length > 25 * 1024 * 1024) {
    res.status(413).json({ success: false, error: 'Document exceeds the 25 MB vault limit.' });
    return;
  }

  const mimeType = String(req.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!DOCUMENT_MIME_TYPES.has(mimeType)) {
    res.status(415).json({ success: false, error: 'Unsupported document MIME type.' });
    return;
  }

  const configuredProvider = process.env.KAPITECH_DOCUMENT_STORAGE_PROVIDER?.trim().toLowerCase() || '';
  if (process.env.NODE_ENV === 'production' && getDataSourceMode() === 'postgres' && configuredProvider !== 's3' && configuredProvider !== 's3-compatible') {
    res.status(503).json({ success: false, error: 'Durable document storage is required for PostgreSQL production mode.' });
    return;
  }

  const storage = getDocumentStorage();
  const previousStorageKey = String(document.storageKey || '');
  const nextStorageKey = crypto.randomBytes(32).toString('hex');
  let encryptedPayload: Buffer;
  let storageSha256: string;
  try {
    encryptedPayload = encryptPrivateDocument(body);
    storageSha256 = crypto.createHash('sha256').update(encryptedPayload).digest('hex');
    await storage.put(nextStorageKey, encryptedPayload);
  } catch (error) {
    console.error('[Documents] Private object upload failed:', error);
    res.status(500).json({ success: false, error: 'Private document storage failed.' });
    return;
  }

  try {
    const contentSha256 = crypto.createHash('sha256').update(body).digest('hex');
    const patch = {
      mimeType,
      type: mimeType.split('/').pop()?.toUpperCase() || document.type || 'FILE',
      sizeBytes: body.length,
      size: humanFileSize(body.length),
      status: 'ready',
      contentSha256,
      storageSha256,
      storageKey: nextStorageKey,
      storageVersion: Number(document.storageVersion || 1) + 1,
      storageProvider: storage.provider,
      integrityCheckedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uploadedAt: new Date().toISOString()
    };
    const updated = getDataSourceMode() === 'postgres'
      ? await postgresDocumentRepository.update(id, patch, makeAuditEntry(req, 'DOCUMENT_UPLOADED', `Uploaded private document "${document.name}" (${body.length} bytes).`, 'info'))
      : (() => {
          const db = getDatabase();
          const index = (db.documents || []).findIndex((item: any) => item.id === id);
          if (index < 0) return null;
          db.documents[index] = { ...db.documents[index], ...patch };
          saveDatabase(db);
          return db.documents[index];
        })();

    if (!updated) {
      try { await storage.delete(nextStorageKey); } catch (cleanupError) {
        console.error('[Documents] Uploaded orphan object cleanup failed:', cleanupError);
      }
      res.status(404).json({ success: false, error: 'Document not found.' });
      return;
    }

    if (getDataSourceMode() !== 'postgres') recordAuditLog({
      action: 'DOCUMENT_UPLOADED',
      actor: req.user!.username,
      actorRole: req.user!.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: `Uploaded private document "${document.name}" (${body.length} bytes).`,
      severity: 'info'
    });

    if (previousStorageKey && previousStorageKey !== nextStorageKey) {
      try { await storage.delete(previousStorageKey); }
      catch (cleanupError) { console.warn('[Documents] Previous private object cleanup failed:', cleanupError); }
    }

    res.json({ success: true, document: publicDocument(updated) });
  } catch (error) {
    console.error('[Documents] Private upload metadata update failed:', error);
    try { await storage.delete(nextStorageKey); } catch (cleanupError) {
      console.error('[Documents] Failed to clean up uploaded object after metadata failure:', cleanupError);
    }
    res.status(500).json({ success: false, error: 'Private document storage failed.' });
  }
});

apiRouter.get('/documents/:id/content', requireAuth, documentAccessMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const document = getDataSourceMode() === 'postgres'
    ? await postgresDocumentRepository.findById(id)
    : (getDatabase().documents || []).find((item: any) => item.id === id);

  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found.' });
    return;
  }
  if (!requireDocumentObjectAccess(req, res, document)) return;

  if (document.sourceType !== 'private_file' || document.status !== 'ready') {
    res.status(409).json({ success: false, error: 'Private document content is not available.' });
    return;
  }

  const storage = getDocumentStorage();
  try {
    const stored = await storage.get(document.storageKey);

    if (document.storageSha256 && stored.storageSha256 !== String(document.storageSha256)) {
      if (getDataSourceMode() === 'postgres') {
        await postgresAuditLogRepository.append(makeAuditEntry(
          req,
          'DOCUMENT_INTEGRITY_FAILURE',
          `Storage checksum mismatch for private document "${document.name}".`,
          'critical'
        ));
      } else {
        recordAuditLog({
          action: 'DOCUMENT_INTEGRITY_FAILURE',
          actor: req.user!.username,
          actorRole: req.user!.role,
          ip: req.ip,
          userAgent: req.headers['user-agent'] as string,
          details: `Storage checksum mismatch for private document "${document.name}".`,
          severity: 'critical'
        });
      }
      res.status(409).json({ success: false, error: 'Private document integrity verification failed.' });
      return;
    }

    const content = decryptPrivateDocument(stored.body);
    const actualContentSha256 = crypto.createHash('sha256').update(content).digest('hex');
    if (document.contentSha256 && actualContentSha256 !== String(document.contentSha256)) {
      if (getDataSourceMode() === 'postgres') {
        await postgresAuditLogRepository.append(makeAuditEntry(
          req,
          'DOCUMENT_INTEGRITY_FAILURE',
          `Content checksum mismatch for private document "${document.name}".`,
          'critical'
        ));
      } else {
        recordAuditLog({
          action: 'DOCUMENT_INTEGRITY_FAILURE',
          actor: req.user!.username,
          actorRole: req.user!.role,
          ip: req.ip,
          userAgent: req.headers['user-agent'] as string,
          details: `Content checksum mismatch for private document "${document.name}".`,
          severity: 'critical'
        });
      }
      res.status(409).json({ success: false, error: 'Private document content integrity verification failed.' });
      return;
    }

    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(String(document.name || 'document'))}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('Content-Length', content.length);
    res.end(content);

    if (getDataSourceMode() === 'postgres') {
      await postgresAuditLogRepository.append(makeAuditEntry(
        req,
        'DOCUMENT_DOWNLOADED',
        `Downloaded private document "${document.name}".`,
        'info'
      ));
    } else {
      recordAuditLog({
        action: 'DOCUMENT_DOWNLOADED',
        actor: req.user!.username,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
        details: `Downloaded private document "${document.name}".`,
        severity: 'info'
      });
    }
  } catch (error) {
    console.error('[Documents] Private download failed:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Document delivery failed.' });
    }
  }
});

apiRouter.delete('/documents/:id', requireAuth, documentMutationMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const document = getDataSourceMode() === 'postgres'
    ? await postgresDocumentRepository.findById(id)
    : (getDatabase().documents || []).find((item: any) => item.id === id);

  if (!document) {
    res.status(404).json({ success: false, error: 'Document not found.' });
    return;
  }
  if (!requireDocumentObjectAccess(req, res, document)) return;

  if (getDataSourceMode() === 'postgres') {
    const storageKey = String(document.storageKey || '');
    try {
      const deleted = await postgresDocumentRepository.delete(
        id,
        makeAuditEntry(req, 'DOCUMENT_DELETED', `Deleted document "${document.name}".`, 'warning')
      );
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Document not found.' });
        return;
      }
      if (storageKey) {
        try {
          await getDocumentStorage().delete(storageKey);
        } catch (storageError) {
          console.error('[Documents] Postgres document storage cleanup failed:', storageError);
          res.status(202).json({
            success: true,
            message: 'Document record deleted. Private storage cleanup requires retry.',
            cleanupPending: true
          });
          return;
        }
      }
      res.json({ success: true, message: 'Document removed.', cleanupPending: false });
      return;
    } catch (error) {
      console.error('[Documents] PostgreSQL document deletion failed:', error);
      res.status(500).json({ success: false, error: 'Document could not be deleted safely.' });
      return;
    }
  }

  const storageKey = String(document.storageKey || '');
  if (storageKey) {
    try {
      await getDocumentStorage().delete(storageKey);
    } catch (error) {
      console.error('[Documents] Failed to remove private content:', error);
      res.status(500).json({ success: false, error: 'Private document content could not be removed safely.' });
      return;
    }
  }

  const db = getDatabase();
  db.documents = (db.documents || []).filter(d => d.id !== id);
  saveDatabase(db);

  recordAuditLog({
    action: 'DOCUMENT_DELETED',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Deleted document "${document.name}".`,
    severity: 'warning'
  });

  res.json({ success: true, message: 'Document removed.' });
});

apiRouter.get('/system/document-vault/status', requireAuth, requireAnyPermission('canViewSecurityAuditLogs', 'canAccessServerAndApi'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (getDataSourceMode() !== 'postgres') {
    res.json({ success: true, status: { datasource: 'json', objectStorageConfigured: false, integrityMetadata: false, productionReady: false } });
    return;
  }
  try {
    const documents = await postgresDocumentRepository.list();
    const privateFiles = documents.filter(document => document.sourceType === 'private_file');
    const checksummed = privateFiles.filter(document => document.storageSha256 && document.contentSha256);
    const storage = getDocumentStorage();
    const health = await storage.healthCheck();
    const objectStorageConfigured = health.configured;
    const productionReady = health.ok && objectStorageConfigured && privateFiles.every(document => document.storageProvider === storage.provider && document.storageSha256 && document.contentSha256);
    res.json({ success: true, status: { datasource: 'postgres', storageProvider: storage.provider, objectStorageConfigured, storageHealth: health, privateDocumentCount: privateFiles.length, integrityMetadataCoveragePercent: privateFiles.length ? Math.round(checksummed.length / privateFiles.length * 100) : 100, productionReady } });
  } catch (error) {
    console.error('[Documents] Vault status failed:', error);
    res.status(500).json({ success: false, error: 'Document vault status is unavailable.' });
  }
});

// ----------------------------------------------------
// 17. SYSTEM BACKUP CONTROLS
// ----------------------------------------------------

const backupAccessMiddleware = requireAnyPermission('canRunDataMigration', 'canAccessServerAndApi');

apiRouter.post('/system/backups', requireAuth, backupAccessMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (getDataSourceMode() === 'postgres') {
    const health = getPostgresBackupHealth();
    res.status(health.configured ? 409 : 503).json({
      success: false,
      error: health.configured
        ? 'PostgreSQL backups are managed by the configured backup provider; trigger them through the provider or operations scheduler.'
        : 'PostgreSQL backup provider is not configured. Configure the managed backup/DR service before production cutover.',
      backup: health
    });
    return;
  }

  try {
    const backup = createDatabaseBackup(true);
    if (!backup) {
      res.status(404).json({ success: false, error: 'No persistent database file exists yet.' });
      return;
    }

    recordAuditLog({
      action: 'DATABASE_BACKUP_CREATED',
      actor: req.user!.username,
      actorRole: req.user!.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: `Created a manual encrypted database backup (${backup.sizeBytes} bytes).`,
      severity: 'info'
    });

    res.json({
      success: true,
      backup: {
        createdAt: backup.createdAt,
        sizeBytes: backup.sizeBytes
      }
    });
  } catch (error) {
    console.error('[Backup] Manual backup failed:', error);
    res.status(500).json({ success: false, error: 'Database backup could not be created.' });
  }
});

apiRouter.get('/system/backups/download', requireAuth, backupAccessMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (getDataSourceMode() === 'postgres') {
    res.status(409).json({
      success: false,
      error: 'JSON backup download is disabled in PostgreSQL mode. Use the configured PostgreSQL backup provider or operations export process.'
    });
    return;
  }

  try {
    const backup = createDatabaseBackup(true);
    if (!backup) {
      res.status(404).json({ success: false, error: 'No persistent database file exists yet.' });
      return;
    }

    const dataDir = process.env.KAPITECH_DATA_DIR
      ? path.resolve(process.env.KAPITECH_DATA_DIR)
      : path.join(process.env.HOME || process.cwd(), '.kapitech-ams-data');
    const backupDir = process.env.KAPITECH_DB_BACKUP_DIR
      ? path.resolve(process.env.KAPITECH_DB_BACKUP_DIR)
      : path.join(dataDir, 'backups');
    const candidates = listDatabaseBackups();
    const latest = candidates[0];
    if (!latest) {
      res.status(404).json({ success: false, error: 'Backup file is not available.' });
      return;
    }

    const backupPath = path.join(backupDir, latest.name);
    if (!fs.existsSync(backupPath)) {
      res.status(404).json({ success: false, error: 'Backup file is not available.' });
      return;
    }

    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(latest.name)}`);
    res.sendFile(backupPath);
    recordAuditLog({
      action: 'DATABASE_BACKUP_DOWNLOADED',
      actor: req.user!.username,
      actorRole: req.user!.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: `Downloaded encrypted database backup "${latest.name}".`,
      severity: 'warning'
    });
  } catch (error) {
    console.error('[Backup] Encrypted backup download failed:', error);
    res.status(500).json({ success: false, error: 'Database backup download failed.' });
  }
});

apiRouter.get('/system/backups/integrity', requireAuth, backupAccessMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (getDataSourceMode() === 'postgres') {
    const health = getPostgresBackupHealth();
    res.status(health.integrity.valid ? 200 : 409).json({ success: health.integrity.valid, integrity: health.integrity, backup: health });
    return;
  }

  try {
    const integrity = verifyDatabaseBackupIntegrity();
    res.status(integrity.valid ? 200 : 409).json({
      success: integrity.valid,
      integrity
    });
  } catch (error) {
    console.error('[Backup] Backup integrity check failed:', error);
    res.status(500).json({ success: false, error: 'Database backup integrity status is unavailable.' });
  }
});

apiRouter.get('/system/backups', requireAuth, backupAccessMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (getDataSourceMode() === 'postgres') {
    const health = getPostgresBackupHealth();
    res.json({
      success: true,
      backups: health.latestBackupAt ? [{ createdAt: health.latestBackupAt, sizeBytes: null }] : [],
      provider: health.provider,
      configured: health.configured,
      retentionDays: health.retentionDays,
      rpoMinutes: health.rpoMinutes,
      rtoMinutes: health.rtoMinutes,
      encryptedAtRest: true,
      privateDocumentEncryption: true,
      restoreVerified: health.integrity.restoreVerified,
      restoreVerifiedAt: health.integrity.restoreVerifiedAt
    });
    return;
  }

  try {
    const backups = listDatabaseBackups().map(backup => ({
      createdAt: backup.createdAt,
      sizeBytes: backup.sizeBytes
    }));
    res.json({
      success: true,
      backups,
      retention: Math.min(30, Math.max(3, Math.floor(Number(process.env.KAPITECH_DB_BACKUP_RETENTION || 14) || 14))),
      encryptedAtRest: isDataEncryptionEnabled(),
      privateDocumentEncryption: isDataEncryptionEnabled()
    });
  } catch (error) {
    console.error('[Backup] Backup listing failed:', error);
    res.status(500).json({ success: false, error: 'Database backup status is unavailable.' });
  }
});

apiRouter.get('/system/security/status', requireAuth, requireAnyPermission('canViewSecurityAuditLogs', 'canAccessServerAndApi'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = getDataSourceMode() === 'postgres'
      ? await postgresAuthRepository.listUsers()
      : (Array.isArray(getDatabase().users) ? getDatabase().users : []);
    const activeUserCount = users.filter(user => user.status === 'active').length;
    const mfaEnabledCount = users.filter(user => user.status === 'active' && user.mfaEnabled).length;
    const postgresMode = getDataSourceMode() === 'postgres';
    const backupHealth = postgresMode ? getPostgresBackupHealth() : null;
    const backups = postgresMode ? [] : listDatabaseBackups();
    const latestBackup = backups[0];
    const latestBackupAgeMs = latestBackup ? Math.max(0, Date.now() - new Date(latestBackup.createdAt).getTime()) : null;
    const backupIntegrity = postgresMode
      ? backupHealth!.integrity
      : verifyDatabaseBackupIntegrity();

    res.json({
      success: true,
      status: {
        encryptionAtRest: postgresMode ? true : isDataEncryptionEnabled(),
        privateDocumentEncryption: postgresMode ? true : isDataEncryptionEnabled(),
        mfaRequired: true,
        activeUserCount,
        mfaEnabledCount,
        mfaCoveragePercent: activeUserCount > 0 ? Math.round((mfaEnabledCount / activeUserCount) * 100) : 100,
        backupProvider: postgresMode ? backupHealth!.provider : 'json-local',
        backupConfigured: postgresMode ? backupHealth!.configured : backups.length > 0,
        backupCount: postgresMode ? (backupHealth!.latestBackupAt ? 1 : 0) : backups.length,
        latestBackupAt: postgresMode ? backupHealth!.latestBackupAt : (latestBackup?.createdAt || null),
        latestBackupAgeMinutes: postgresMode ? backupHealth!.latestBackupAgeMinutes : (latestBackupAgeMs === null ? null : Math.round(latestBackupAgeMs / 60000)),
        backupFresh: postgresMode ? backupHealth!.backupFresh : (latestBackupAgeMs !== null && latestBackupAgeMs <= 24 * 60 * 60 * 1000),
        backupIntegrity,
        restoreVerified: postgresMode ? backupHealth!.integrity.restoreVerified : null,
        restoreVerifiedAt: postgresMode ? backupHealth!.integrity.restoreVerifiedAt : null,
        rpoMinutes: postgresMode ? backupHealth!.rpoMinutes : null,
        rtoMinutes: postgresMode ? backupHealth!.rtoMinutes : null,
        retentionDays: postgresMode ? backupHealth!.retentionDays : null
      }
    });
  } catch (error) {
    console.error('[Security] Security posture check failed:', error);
    res.status(500).json({ success: false, error: 'Security posture status is unavailable.' });
  }
});

// ----------------------------------------------------
// 17. PRODUCTION READINESS GATE
// ----------------------------------------------------

apiRouter.get('/system/production-readiness', requireAuth, requireAnyPermission('canViewSecurityAuditLogs', 'canAccessServerAndApi'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const postgresMode = getDataSourceMode() === 'postgres';
  if (!postgresMode) {
    res.status(409).json({
      success: false,
      productionReady: false,
      gates: {
        runtime: false,
        encryption: false,
        relationalReconciliation: false,
        postgres: false,
        migrations: false,
        mfa: false,
        backupDr: false,
        documentStorage: false,
        notifications: false
      },
      status: {
        datasource: 'json',
        reason: 'Production cutover requires KAPITECH_DATA_SOURCE=postgres.'
      }
    });
    return;
  }

  try {
    const [connection, users, documents, storageHealth, notificationSettings] = await Promise.all([
      checkPostgresConnection(),
      postgresAuthRepository.listUsers(),
      postgresDocumentRepository.list(),
      getDocumentStorage().healthCheck(),
      postgresNotificationSettingsRepository.get()
    ]);

    let appliedMigrations: string[] = [];
    let appliedMigrationChecksums: Record<string, string> = {};
    let migrationCheckError: string | undefined;
    try {
      const { rows } = await getPostgresPool().query<{ version: string; checksum: string }>(
        'SELECT version, checksum FROM schema_migrations ORDER BY version'
      );
      appliedMigrations = rows.map(row => String(row.version));
      appliedMigrationChecksums = Object.fromEntries(
        rows.map(row => [String(row.version), String(row.checksum || '')])
      );
    } catch (error) {
      migrationCheckError = error instanceof Error ? error.message : 'Migration status unavailable.';
    }

    let requiredMigrationVersions: string[] = [];
    let requiredMigrationChecksums: Record<string, string> = {};
    let migrationDefinitionCheckError: string | undefined;
    try {
      const migrations = await loadPostgresMigrations();
      requiredMigrationVersions = migrations.map(migration => migration.version);
      requiredMigrationChecksums = Object.fromEntries(
        migrations.map(migration => [migration.version, migration.checksum])
      );
    } catch (error) {
      migrationDefinitionCheckError = error instanceof Error ? error.message : 'Migration definitions unavailable.';
    }

    const migrationVersionComplete = !migrationCheckError
      && !migrationDefinitionCheckError
      && requiredMigrationVersions.length === appliedMigrations.length
      && requiredMigrationVersions.every(version => Object.prototype.hasOwnProperty.call(appliedMigrationChecksums, version));

    const migrationChecksumComplete = migrationVersionComplete
      && requiredMigrationVersions.every(version => requiredMigrationChecksums[version] === appliedMigrationChecksums[version]);

    const migrationComplete = migrationChecksumComplete;

    const activeUsers = users.filter(user => user.status === 'active');
    const mfaEnabledCount = activeUsers.filter(user => user.mfaEnabled).length;
    const mfaComplete = activeUsers.length > 0 && mfaEnabledCount === activeUsers.length;

    const backup = getPostgresBackupHealth();

    const privateFiles = documents.filter(document => document.sourceType === 'private_file');
    const checksummed = privateFiles.filter(document => document.storageSha256 && document.contentSha256);
    const documentIntegrityComplete = privateFiles.length === checksummed.length;
    const storage = getDocumentStorage();
    const documentObjectIntegrityResults = privateFiles.length === 0
      ? []
      : await Promise.all(
          privateFiles.map(async document => ({
            id: String(document.id),
            valid: Boolean(
              document.storageKey &&
              document.storageSha256 &&
              await storage.verify(String(document.storageKey), String(document.storageSha256))
            )
          }))
        );
    const documentObjectsVerified = documentObjectIntegrityResults.every(result => result.valid);
    const documentStorageReady = storageHealth.configured && storageHealth.ok && documentIntegrityComplete && documentObjectsVerified;

    const runtimeReady =
      process.env.NODE_ENV === 'production' &&
      /^https:\/\//i.test(String(process.env.APP_URL || '').trim()) &&
      Boolean(process.env.KAPITECH_DATA_SOURCE === 'postgres');

    const encryptionReady = isDataEncryptionEnabled();

    const telegramConfigured = !notificationSettings.isTelegramActive
      || Boolean(
        process.env.KAPITECH_TELEGRAM_BOT_TOKEN?.trim()
        && (process.env.KAPITECH_TELEGRAM_CHAT_ID?.trim() || notificationSettings.telegramChatId?.trim())
      );
    const emailNotificationConfigured = !notificationSettings.isEmailActive
      || Boolean(notificationSettings.targetEmail?.trim() && notificationSettings.formspreeEndpoint?.trim());
    const notificationsReady = telegramConfigured && emailNotificationConfigured;

    const reconciliationVerifiedAt = process.env.KAPITECH_RELATIONAL_RECONCILIATION_VERIFIED_AT?.trim() || '';
    const reconciliationSourceSha256 = process.env.KAPITECH_RELATIONAL_RECONCILIATION_SOURCE_SHA256?.trim().toLowerCase() || '';
    const reconciliationDate = reconciliationVerifiedAt ? new Date(reconciliationVerifiedAt) : null;
    const reconciliationSignoffReady = Boolean(
      reconciliationDate &&
      !Number.isNaN(reconciliationDate.getTime()) &&
      reconciliationDate.getTime() <= Date.now() &&
      /^[0-9a-f]{64}$/.test(reconciliationSourceSha256)
    );

    let latestReconciliation: {
      id: string;
      status: string;
      sourceKind: string | null;
      completedAt: string | null;
      sourceSha256: string | null;
      rowSourceSha256: string | null;
      checks: Record<string, boolean>
    } | null = null;
    try {
      const { rows } = await getPostgresPool().query<{
        id: string;
        source_kind: string;
        source_sha256: string;
        status: string;
        completed_at: Date | string | null;
        report: unknown;
      }>(
        "SELECT id, source_kind, source_sha256, status, completed_at, report FROM migration_runs WHERE source_kind = 'encrypted-json' ORDER BY COALESCE(completed_at, started_at) DESC LIMIT 1"
      );
      const row = rows[0];
      if (row) {
        let report: any = row.report;
        if (typeof report === 'string') {
          try { report = JSON.parse(report); } catch {}
        }
        latestReconciliation = {
          id: String(row.id),
          status: String(row.status),
          sourceKind: String(row.source_kind || '').trim().toLowerCase() || null,
          completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
          sourceSha256: typeof report?.sourceSha256 === 'string' ? report.sourceSha256.toLowerCase() : null,
          rowSourceSha256: typeof row.source_sha256 === 'string' ? row.source_sha256.trim().toLowerCase() : null,
          checks: report?.checks && typeof report.checks === 'object' ? report.checks : {}
        };
      }
    } catch (error) {
      console.error('[Readiness] Reconciliation history check failed:', error);
    }

    const reconciliationRunReady = Boolean(
      latestReconciliation?.status === 'succeeded' &&
      Object.keys(latestReconciliation.checks).length > 0 &&
      Object.values(latestReconciliation.checks).every(value => value === true)
    );
    const reconciliationSourceBound = Boolean(
      latestReconciliation?.sourceKind === 'encrypted-json' &&
      latestReconciliation.sourceSha256 &&
      latestReconciliation.rowSourceSha256 &&
      latestReconciliation.sourceSha256 === latestReconciliation.rowSourceSha256 &&
      latestReconciliation.sourceSha256 === reconciliationSourceSha256
    );
    const reconciliationCompletedBeforeSignoff = Boolean(
      latestReconciliation?.completedAt &&
      reconciliationDate &&
      new Date(latestReconciliation.completedAt).getTime() <= reconciliationDate.getTime()
    );
    const reconciliationReady =
      reconciliationSignoffReady &&
      reconciliationRunReady &&
      reconciliationSourceBound &&
      reconciliationCompletedBeforeSignoff;

    const backupDrReady = Boolean(
      backup.configured &&
      backup.backupFresh &&
      backup.integrity.valid &&
      backup.integrity.restoreVerified
    );

    const gates = {
      runtime: runtimeReady,
      encryption: encryptionReady,
      relationalReconciliation: reconciliationReady,
      postgres: connection.ok,
      migrations: migrationComplete,
      mfa: mfaComplete,
      backupDr: backupDrReady,
      documentStorage: documentStorageReady,
      notifications: notificationsReady
    };

    const productionReady = Object.values(gates).every(Boolean);

    res.status(productionReady ? 200 : 409).json({
      success: productionReady,
      productionReady,
      gates,
      status: {
        datasource: 'postgres',
        runtime: {
          nodeEnvProduction: process.env.NODE_ENV === 'production',
          appUrlHttps: /^https:\/\//i.test(String(process.env.APP_URL || '').trim()),
          dataSourcePostgres: true
        },
        encryption: {
          configured: encryptionReady,
          algorithm: 'AES-256-GCM'
        },
        relationalReconciliation: {
          verifiedAt: reconciliationVerifiedAt || null,
          sourceSha256: reconciliationSourceSha256 || null,
          signoffComplete: reconciliationSignoffReady,
          sourceBound: reconciliationSourceBound,
          databaseSourceSha256: latestReconciliation?.rowSourceSha256 || null,
          completedBeforeSignoff: reconciliationCompletedBeforeSignoff,
          run: latestReconciliation,
          runComplete: reconciliationRunReady,
          complete: reconciliationReady
        },
        postgres: connection,
        migrations: {
          requiredMigrationCount: requiredMigrationVersions.length,
          required: requiredMigrationVersions,
          applied: appliedMigrations,
          checksumComplete: migrationChecksumComplete,
          complete: migrationComplete,
          error: migrationCheckError || migrationDefinitionCheckError || null
        },
        mfa: {
          activeUserCount: activeUsers.length,
          enabledCount: mfaEnabledCount,
          coveragePercent: activeUsers.length ? Math.round((mfaEnabledCount / activeUsers.length) * 100) : 0,
          complete: mfaComplete
        },
        backupDr: backup,
        notifications: {
          telegramActive: notificationSettings.isTelegramActive,
          telegramConfigured,
          emailActive: notificationSettings.isEmailActive,
          emailConfigured: emailNotificationConfigured,
          ready: notificationsReady
        },
        documentStorage: {
          provider: storageHealth.provider,
          health: storageHealth,
          privateDocumentCount: privateFiles.length,
          integrityMetadataCoveragePercent: privateFiles.length
            ? Math.round((checksummed.length / privateFiles.length) * 100)
            : 100,
          objectIntegrityVerified: documentObjectsVerified,
          objectIntegrityFailures: documentObjectIntegrityResults.filter(result => !result.valid).map(result => result.id),
          ready: documentStorageReady
        }
      }
    });
  } catch (error) {
    console.error('[Readiness] Production readiness check failed:', error);
    res.status(503).json({ success: false, productionReady: false, error: 'Production readiness status is unavailable.' });
  }
});

// 17. UNIFIED NOTIFICATIONS CENTER
// ----------------------------------------------------

// ----------------------------------------------------
// 17. UNIFIED NOTIFICATIONS CENTER (PART 28)
// ----------------------------------------------------

apiRouter.get('/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const isMaster = req.user!.stakeholderType === 'Master';
  const canViewFinance = isMaster || Boolean(req.user!.permissions?.canViewFinancials || req.user!.permissions?.canManageInvoices);
  const canViewCrm = isMaster || Boolean(req.user!.permissions?.canManageCrm);
  const canViewApprovals = isMaster || Boolean(req.user!.permissions?.canApproveBudgets || req.user!.permissions?.canManageProjects);
  let source: any[] = [];
  if (getDataSourceMode() === 'postgres') {
    try {
      source = await postgresNotificationRepository.list();
    } catch (error) {
      // Keep the notification center usable during PostgreSQL initialization
      // or a transient notification-table failure. JSON remains the compatibility store.
      console.error('Notification repository unavailable:', error);
      source = getDatabase().notifications || [];
    }
  } else {
    source = getDatabase().notifications || [];
  }

  const notifications = source.filter((notification) => canViewNotification(req.user!, notification)).map((notification) => ({
    ...notification,
    read: Array.isArray(notification.readBy)
      ? notification.readBy.includes(req.user!.id)
      : Boolean(notification.read)
  }));

  res.json({ success: true, notifications });
});

apiRouter.post('/notifications/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (getDataSourceMode() === 'postgres') {
    const notification = await postgresNotificationRepository.findById(id);
    if (!notification) {
      res.status(404).json({ success: false, error: 'Notification not found.' });
      return;
    }
    if (!canViewNotification(req.user!, notification)) {
      await postgresAuditLogRepository.append(makeAuditEntry(
        req,
        'ACCESS_DENIED',
        `Notification access denied for "${id}".`,
        'warning'
      ));
      res.status(403).json({ success: false, error: 'Notification access denied.' });
      return;
    }
    const updated = await postgresNotificationRepository.markRead(id, req.user!.id, makeAuditEntry(req, 'NOTIFICATION_READ', `Marked notification "${id}" as read.`, 'info'));
    if (!updated) {
      res.status(403).json({ success: false, error: 'Notification access denied.' });
      return;
    }

    res.json({ success: true });
    return;
  }

  const db = getDatabase();
  const notif = (db.notifications || []).find(n => n.id === id);
  if (!notif) {
    res.status(404).json({ success: false, error: 'Notification not found.' });
    return;
  }
  if (!canViewNotification(req.user!, notif)) {
    recordAuditLog({
      action: 'ACCESS_DENIED',
      actor: req.user!.username,
      actorRole: req.user!.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
      details: `Notification access denied for "${id}".`,
      severity: 'warning'
    });
    res.status(403).json({ success: false, error: 'Notification access denied.' });
    return;
  }
  if (!Array.isArray(notif.readBy)) notif.readBy = [];
  if (!notif.readBy.includes(req.user!.id)) notif.readBy.push(req.user!.id);
  saveDatabase(db);
  recordAuditLog({
    action: 'NOTIFICATION_READ',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: `Marked notification "${id}" as read.`,
    severity: 'info'
  });
  res.json({ success: true });
});

apiRouter.post('/notifications/mark-all-read', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (getDataSourceMode() === 'postgres') {
    await postgresNotificationRepository.markAllRead(req.user!.id, getHiddenNotificationTypes(req.user!), makeAuditEntry(req, 'NOTIFICATIONS_MARKED_ALL_READ', 'Marked all accessible notifications as read.', 'info'));

    res.json({ success: true });
    return;
  }

  const db = getDatabase();
  for (const notification of (db.notifications || [])) {
    if (!canViewNotification(req.user!, notification)) continue;
    if (!Array.isArray(notification.readBy)) notification.readBy = [];
    if (!notification.readBy.includes(req.user!.id)) notification.readBy.push(req.user!.id);
  }
  saveDatabase(db);
  recordAuditLog({
    action: 'NOTIFICATIONS_MARKED_ALL_READ',
    actor: req.user!.username,
    actorRole: req.user!.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details: 'Marked all accessible notifications as read.',
    severity: 'info'
  });
  res.json({ success: true });
});

// ----------------------------------------------------
// 18. UNIFIED GLOBAL SEARCH (PART 6)
// ----------------------------------------------------

apiRouter.get('/search', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) {
    res.json({ success: true, results: [] });
    return;
  }

  const usePostgres = getDataSourceMode() === 'postgres';
  const isMaster = req.user!.stakeholderType === 'Master';
  const canCrm = isMaster || Boolean(req.user!.permissions.canManageCrm);
  const canClients = isMaster || Boolean(req.user!.permissions.canManageClients);
  const canProjects = isMaster || Boolean(req.user!.permissions.canManageProjects);
  const canFinance = isMaster || Boolean(req.user!.permissions.canViewFinancials);
  const canProposals = isMaster || Boolean(
    req.user!.permissions.canManageCrm ||
    req.user!.permissions.canManageInvoices ||
    req.user!.permissions.canApproveBudgets
  );

  const db = usePostgres ? undefined : getDatabase();
  const [leads, deals, clients, projects, invoices, proposals] = usePostgres
    ? await Promise.all([
        canCrm ? postgresLeadRepository.list() : Promise.resolve([]),
        canCrm ? postgresCrmDealRepository.list() : Promise.resolve([]),
        canClients ? postgresClientRepository.list() : Promise.resolve([]),
        canProjects ? postgresProjectRepository.list() : Promise.resolve([]),
        canFinance ? postgresInvoiceRepository.list() : Promise.resolve([]),
        canProposals ? postgresProposalRepository.list() : Promise.resolve([])
      ])
    : [
        canCrm ? (db!.leads || []) : [],
        canCrm ? (db!.crmDeals || []) : [],
        canClients ? (db!.clients || []) : [],
        canProjects ? (db!.projects || []) : [],
        canFinance ? (db!.invoices || []) : [],
        canProposals ? (db!.proposals || []) : []
      ];

  const results: any[] = [];

  for (const lead of leads as any[]) {
    if (
      (lead.fullName && String(lead.fullName).toLowerCase().includes(q)) ||
      (lead.company && String(lead.company).toLowerCase().includes(q)) ||
      (lead.email && String(lead.email).toLowerCase().includes(q))
    ) {
      results.push({
        type: 'Lead',
        id: lead.id,
        name: `${lead.fullName} (${lead.company || 'Inquiry'})`,
        status: lead.status,
        owner: lead.email,
        lastUpdated: lead.updatedAt || lead.createdAt,
        url: '/admin/inbox'
      });
    }
  }

  for (const deal of deals as any[]) {
    if (
      (deal.title && String(deal.title).toLowerCase().includes(q)) ||
      (deal.company && String(deal.company).toLowerCase().includes(q)) ||
      (deal.clientName && String(deal.clientName).toLowerCase().includes(q))
    ) {
      results.push({
        type: 'Deal',
        id: deal.id,
        name: deal.title || deal.company,
        status: deal.stage,
        owner: deal.owner || 'Unassigned',
        lastUpdated: deal.updatedAt || deal.createdAt,
        url: '/admin/crm'
      });
    }
  }

  for (const cli of clients as any[]) {
    if (
      (cli.companyName && String(cli.companyName).toLowerCase().includes(q)) ||
      (cli.company && String(cli.company).toLowerCase().includes(q)) ||
      (cli.clientName && String(cli.clientName).toLowerCase().includes(q)) ||
      (cli.name && String(cli.name).toLowerCase().includes(q)) ||
      (cli.email && String(cli.email).toLowerCase().includes(q))
    ) {
      results.push({
        type: 'Client',
        id: cli.id,
        name: cli.companyName || cli.company || cli.clientName || cli.name,
        status: cli.status,
        owner: cli.email,
        lastUpdated: cli.updatedAt || cli.createdAt,
        url: '/admin/clients'
      });
    }
  }

  for (const proj of projects as any[]) {
    if (
      (proj.title && String(proj.title).toLowerCase().includes(q)) ||
      (proj.name && String(proj.name).toLowerCase().includes(q)) ||
      (proj.client && String(proj.client).toLowerCase().includes(q)) ||
      (proj.clientCompany && String(proj.clientCompany).toLowerCase().includes(q))
    ) {
      results.push({
        type: 'Project',
        id: proj.id,
        name: proj.title || proj.name,
        status: proj.status || proj.health || 'Active',
        owner: proj.clientCompany || proj.client || proj.teamLead,
        lastUpdated: proj.updatedAt || proj.createdAt,
        url: '/admin/projects'
      });
    }
  }

  for (const inv of invoices as any[]) {
    if (
      (inv.invoiceNumber && String(inv.invoiceNumber).toLowerCase().includes(q)) ||
      (inv.clientName && String(inv.clientName).toLowerCase().includes(q)) ||
      (inv.clientCompany && String(inv.clientCompany).toLowerCase().includes(q))
    ) {
      results.push({
        type: 'Invoice',
        id: inv.id,
        name: `${inv.invoiceNumber} - ${inv.clientCompany || inv.clientName}`,
        status: inv.status,
        owner: `${inv.currency || 'IDR'} ${Number(inv.total || 0).toLocaleString()}`,
        lastUpdated: inv.updatedAt || inv.createdAt,
        url: '/admin/invoicing'
      });
    }
  }

  for (const prop of proposals as any[]) {
    if (
      (prop.proposalNumber && String(prop.proposalNumber).toLowerCase().includes(q)) ||
      (prop.clientName && String(prop.clientName).toLowerCase().includes(q)) ||
      (prop.title && String(prop.title).toLowerCase().includes(q))
    ) {
      results.push({
        type: 'Proposal',
        id: prop.id,
        name: `${prop.proposalNumber} - ${prop.title}`,
        status: prop.status,
        owner: prop.owner,
        lastUpdated: prop.updatedAt || prop.createdAt,
        url: '/admin/proposals'
      });
    }
  }

  res.json({ success: true, results: results.slice(0, 20) });
});

// ----------------------------------------------------
// 19. EXECUTIVE DASHBOARD & TODAY AT KAPITECH ENGINE (PARTS 7, 30, 68)
// ----------------------------------------------------

const handleOverview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usePostgres=getDataSourceMode()==='postgres';
    const db=usePostgres?undefined:getDatabase();
    const isMaster=req.user!.stakeholderType==='Master';
    const canViewFinancials=isMaster||Boolean(req.user!.permissions?.canViewFinancials);
    const canViewCrm=isMaster||Boolean(req.user!.permissions?.canManageCrm);
    const canViewProjects=isMaster||Boolean(req.user!.permissions?.canManageProjects||req.user!.permissions?.canManageKanbanTasks);
    const canViewApprovals=isMaster||Boolean(req.user!.permissions?.canApproveBudgets||req.user!.permissions?.canManageProjects);
    const canViewAudit=isMaster||Boolean(req.user!.permissions?.canViewSecurityAuditLogs);
    const leads=canViewCrm?(usePostgres?await postgresLeadRepository.list():(db!.leads||[])):[],deals=canViewCrm?(usePostgres?await postgresCrmDealRepository.list():(db!.crmDeals||[])):[],proposals=(canViewCrm||canViewFinancials||canViewApprovals)?(usePostgres?await postgresProposalRepository.list():(db!.proposals||[])):[],approvals=canViewApprovals?(usePostgres?await postgresApprovalRepository.list():(db!.approvals||[])):[];
    const projects=canViewProjects?(usePostgres?await postgresProjectRepository.list():(db!.projects||[])):[],tasks=canViewProjects?(usePostgres?await postgresTaskRepository.list():(db!.tasks||[])):[];
    const invoices=canViewFinancials?(usePostgres?await postgresInvoiceRepository.list():(db.invoices||=[])):[];
    const expenses=canViewFinancials?(usePostgres?await postgresExpenseRepository.list():(db.expenses||[]).filter((e:any)=>e.status!=='voided')):[];
    const now=new Date(),monthKey=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).format(now);
    const openLeadsCount=canViewCrm?leads.filter(l=>l.status==='new'||l.status==='in_review').length:0;
    const activeDeals=canViewCrm?deals.filter(d=>d.stage!=='won'&&d.stage!=='lost'):[],dealsInPipelineCount=activeDeals.length,activePipelineValue=activeDeals.reduce((s,d)=>s+(Number(d.value)||0),0);
    const proposalsAwaitingCount=proposals.filter(p=>['Draft','Internal Review','Sent'].includes(String(p.status))).length;
    const activeProjectsList=projects.filter(p=>!['completed','Completed','archived','Archived'].includes(String(p.status))),activeProjectsCount=activeProjectsList.length,projectsAtRiskCount=projects.filter(p=>['At Risk','Delayed','Blocked'].includes(String(p.health))).length;
    const financeByCurrency=new Map<string,any>();const bucket=(v:unknown)=>{const currency=String(v||'IDR').toUpperCase();if(!financeByCurrency.has(currency))financeByCurrency.set(currency,{currency,revenueCollected:0,totalBilled:0,outstandingReceivables:0,overdueReceivables:0,operatingExpenses:0,revenueThisMonth:0,monthlyOperatingExpenses:0,overdueInvoicesCount:0});return financeByCurrency.get(currency);};
    for(const inv of invoices){const b=bucket(inv.currency);b.totalBilled+=Number(inv.total)||0;b.revenueCollected+=getInvoicePaidAmount(inv);if(inv.status!=='paid'&&inv.status!=='cancelled'){const bal=getInvoiceBalanceDue(inv);b.outstandingReceivables+=bal;if(inv.dueDate&&new Date(inv.dueDate)<now){b.overdueReceivables+=bal;b.overdueInvoicesCount++;}}for(const p of Array.isArray(inv.payments)?inv.payments:[])if(String(p.date||'').startsWith(monthKey))b.revenueThisMonth+=Number(p.amount)||0;}
    for(const exp of expenses){const b=bucket(exp.currency);const amount=Number(exp.amount)||0;b.operatingExpenses+=amount;if(String(exp.date||'').startsWith(monthKey))b.monthlyOperatingExpenses+=amount;}
    const currency=String(req.query.currency||'IDR').toUpperCase(),primary=financeByCurrency.get(currency)||bucket(currency),netOperatingProfitThisMonth=primary.revenueThisMonth-primary.monthlyOperatingExpenses,netMarginThisMonth=primary.revenueThisMonth>0?Number(((netOperatingProfitThisMonth/primary.revenueThisMonth)*100).toFixed(1)):0;
    const pendingApprovalsCount=approvals.filter(a=>a.status==='Pending').length,overdueTasksCount=tasks.filter(t=>t.status!=='done'&&t.dueDate&&new Date(t.dueDate)<now).length;
    const pipelineByStage=canViewCrm?CRM_STAGES.map(stage=>{const ds=deals.filter(d=>d.stage===stage);return{stage,count:ds.length,value:ds.reduce((s,d)=>s+(Number(d.value)||0),0)}}):[];
    const attentionItems:any[]=[];if(canViewFinancials&&primary.overdueInvoicesCount>0)attentionItems.push({id:'att_invoices_overdue',title:primary.overdueInvoicesCount+' Invoices Overdue',description:'Follow-up required on unpaid accounts totaling '+primary.currency+' '+primary.overdueReceivables.toLocaleString(),severity:'danger',category:'Finance',linkUrl:'/admin/invoicing'});if(canViewApprovals&&pendingApprovalsCount>0)attentionItems.push({id:'att_pending_approvals',title:pendingApprovalsCount+' Executive Approvals Awaiting Review',description:'Budget and operational approvals are waiting for review.',severity:'warning',category:'Operations',linkUrl:'/admin/approvals'});if(canViewProjects&&projectsAtRiskCount>0)attentionItems.push({id:'att_projects_risk',title:projectsAtRiskCount+' Projects Flagged At Risk',description:'Delivery timeline or resource constraints require attention.',severity:'danger',category:'Delivery',linkUrl:'/admin/projects'});if(canViewProjects&&overdueTasksCount>0)attentionItems.push({id:'att_tasks_overdue',title:overdueTasksCount+' Tasks Overdue in Active Sprints',description:'Tasks passed their due dates and may require rescheduling.',severity:'warning',category:'Delivery',linkUrl:'/admin/projects'});if(canViewCrm&&openLeadsCount>3)attentionItems.push({id:'att_leads_new',title:openLeadsCount+' Inbound Inquiries Unassigned',description:'Website inquiries are waiting for qualification.',severity:'info',category:'Sales',linkUrl:'/admin/inbox'});
    res.json({success:true,metrics:{currency,revenueCollected:canViewFinancials?primary.revenueCollected:null,totalBilled:canViewFinancials?primary.totalBilled:null,outstandingReceivables:canViewFinancials?primary.outstandingReceivables:null,overdueReceivables:canViewFinancials?primary.overdueReceivables:null,activePipeline:canViewCrm?activePipelineValue:null,activeProjects:canViewProjects?activeProjectsCount:0,projectsAtRisk:canViewProjects?projectsAtRiskCount:0,pendingApprovals:canViewApprovals?pendingApprovalsCount:0,overdueTasks:canViewProjects?overdueTasksCount:0,openLeads:canViewCrm?openLeadsCount:0,byCurrency:Array.from(financeByCurrency.values())},todayAtKapitech:{openLeadsCount:canViewCrm?openLeadsCount:0,dealsInPipelineCount:canViewCrm?dealsInPipelineCount:0,pipelineValue:canViewFinancials?activePipelineValue:null,proposalsAwaitingCount:(canViewCrm||canViewFinancials||canViewApprovals)?proposalsAwaitingCount:0,projectsAtRiskCount:canViewProjects?projectsAtRiskCount:0,overdueInvoicesCount:canViewFinancials?primary.overdueInvoicesCount:0,cashOutstanding:canViewFinancials?primary.outstandingReceivables:null,currency},financials:canViewFinancials?{currency,revenueThisMonth:primary.revenueThisMonth,cashCollected:primary.revenueThisMonth,outstandingReceivables:primary.outstandingReceivables,operatingExpenses:primary.monthlyOperatingExpenses,netOperatingProfit:netOperatingProfitThisMonth,margin:netMarginThisMonth}:{currency,revenueThisMonth:null,cashCollected:null,outstandingReceivables:null,operatingExpenses:null,netOperatingProfit:null,margin:null},pipelineByStage,attentionItems,projects:canViewProjects?activeProjectsList.slice(0,10):[],recentActivity:canViewAudit?(usePostgres?await postgresAuditLogRepository.list(10):(db!.auditLogs||[]).slice(0,10)):[]});
  }catch(error){console.error('[Dashboard Overview] Failed:',error);res.status(503).json({success:false,error:'Dashboard data is temporarily unavailable.'});}
};

apiRouter.get('/dashboard/overview', requireAuth, handleOverview);
apiRouter.get('/executive/overview', requireAuth, handleOverview);