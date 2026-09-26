import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  getDatabase,
  saveDatabase,
  hashPassword,
  hashSessionToken,
  verifyPassword,
  StoredUser,
  StoredSession,
  recordAuditLog
} from './db';
import { getDataSourceMode } from './data-source.ts';
import { postgresAuthRepository } from './postgres-repository.ts';
import { postgresSecurityControlsRepository } from './postgres-security-controls-repository.ts';
import { postgresAuditLogRepository } from './postgres-audit-log-repository.ts';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface LockoutEntry {
  failedAttempts: number;
  lockoutUntil: number;
}

interface MfaChallenge {
  userId: string;
  rememberMe: boolean;
  expiresAt: number;
  failedAttempts: number;
}

const loginLockouts = new Map<string, LockoutEntry>();
const publicRateLimits = new Map<string, RateLimitEntry>();
const authenticatedRateLimits = new Map<string, RateLimitEntry>();

const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;
const EXTENDED_SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;
const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const SESSION_TOUCH_INTERVAL_MS = 60 * 1000;

function recordSecurityAudit(entry: Parameters<typeof recordAuditLog>[0]): void {
  if (getDataSourceMode() === 'postgres') {
    void postgresAuditLogRepository.append({
      ...entry,
      actor: String(entry.actor || 'system'),
      actorRole: String(entry.actorRole || 'system'),
      ip: String(entry.ip || ''),
      userAgent: String(entry.userAgent || ''),
      details: String(entry.details || ''),
      severity: entry.severity || 'info'
    }).catch(error => {
      console.error('[Security] PostgreSQL audit append failed:', error);
    });
    return;
  }
  recordAuditLog(entry);
}

export interface AuthenticatedRequest extends Request {
  user?: StoredUser;
  sessionToken?: string;
}

function cleanupMaps(): void {
  const now = Date.now();
  for (const [key, entry] of loginLockouts) {
    if (entry.lockoutUntil > 0 && entry.lockoutUntil <= now) loginLockouts.delete(key);
  }
  for (const [key, entry] of publicRateLimits) {
    if (entry.resetAt <= now) publicRateLimits.delete(key);
  }
  for (const [key, entry] of authenticatedRateLimits) {
    if (entry.resetAt <= now) authenticatedRateLimits.delete(key);
  }
}

setInterval(cleanupMaps, 5 * 60 * 1000).unref();
setInterval(() => {
  if (getDataSourceMode() !== 'postgres') return;
  void postgresSecurityControlsRepository.cleanupExpired().catch(error => {
    console.error('[Security] PostgreSQL security-control cleanup failed:', error);
  });
}, 5 * 60 * 1000).unref();

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function cookieValue(req: Request, name: string): string {
  const header = req.headers.cookie || '';
  for (const segment of header.split(';')) {
    const [rawName, ...rest] = segment.split('=');
    if (rawName?.trim() !== name) continue;
    const rawValue = rest.join('=').trim();
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }
  return '';
}

function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = input.toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index < 0) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateMfaSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function buildMfaOtpUri(user: StoredUser, secret: string): string {
  const label = encodeURIComponent(`Kapitech AMS:${user.email}`);
  const issuer = encodeURIComponent('Kapitech AMS');
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export function hashMfaRecoveryCode(code: string): string {
  return crypto.createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');
}

export function generateMfaRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () => crypto.randomBytes(8).toString('hex').toUpperCase());
}

export function verifyMfaRecoveryCode(user: StoredUser, code: string): boolean {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized || normalized.length < 12 || !Array.isArray(user.mfaRecoveryCodeHashes)) return false;
  const candidateHash = hashMfaRecoveryCode(normalized);
  const index = user.mfaRecoveryCodeHashes.findIndex(hash => safeEqual(hash, candidateHash));
  if (index < 0) return false;
  user.mfaRecoveryCodeHashes.splice(index, 1);
  return true;
}

export function verifyTotpCode(secret: string, code: string, timestamp = Date.now()): boolean {
  if (!/^\d{6}$/.test(String(code))) return false;
  const key = base32Decode(secret);
  if (key.length < 10) return false;
  const timeStep = Math.floor(timestamp / 1000 / 30);
  for (const offset of [-1, 0, 1]) {
    const counter = timeStep + offset;
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter), 0);
    const digest = crypto.createHmac('sha1', key).update(buffer).digest();
    const dynamicOffset = digest[digest.length - 1] & 0x0f;
    const binary = (
      ((digest[dynamicOffset] & 0x7f) << 24) |
      ((digest[dynamicOffset + 1] & 0xff) << 16) |
      ((digest[dynamicOffset + 2] & 0xff) << 8) |
      (digest[dynamicOffset + 3] & 0xff)
    ) % 1_000_000;
    const expected = String(binary).padStart(6, '0');
    if (safeEqual(expected, String(code))) return true;
  }
  return false;
}

export async function issueMfaChallenge(userId: string, rememberMe: boolean): Promise<string> {
  const token = `kapi_mfa_${crypto.randomBytes(32).toString('hex')}`;
  const now = Date.now();
  if (getDataSourceMode() === 'postgres') {
    await postgresAuthRepository.createSession({ tokenHash: hashSessionToken(token), userId, createdAt: new Date(now).toISOString(), lastActivityAt: new Date(now).toISOString(), expiresAt: now + 5 * 60 * 1000, rememberMe, ip: '', userAgent: '', kind: 'mfa', mfaFailedAttempts: 0 });
    return token;
  }
  const db = getDatabase();
  db.sessions = db.sessions.filter(session => session.kind !== 'mfa' || session.expiresAt > now);
  db.sessions.push({
    tokenHash: hashSessionToken(token),
    userId,
    createdAt: new Date(now).toISOString(),
    lastActivityAt: new Date(now).toISOString(),
    expiresAt: now + 5 * 60 * 1000,
    rememberMe,
    ip: '',
    userAgent: '',
    kind: 'mfa',
    mfaFailedAttempts: 0
  });
  saveDatabase(db);

  return token;
}

export async function getMfaChallenge(token: string): Promise<MfaChallenge | null> {
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  if (getDataSourceMode() === 'postgres') {
    const session = await postgresAuthRepository.findSession(tokenHash);
    if (!session || session.kind !== 'mfa') return null;
    if (session.expiresAt <= Date.now()) { await postgresAuthRepository.deleteSession(tokenHash); return null; }
    return { userId: session.userId, rememberMe: Boolean(session.rememberMe), expiresAt: session.expiresAt, failedAttempts: session.mfaFailedAttempts || 0 };
  }
  const db = getDatabase();
  const session = db.sessions.find(item => item.tokenHash === tokenHash && item.kind === 'mfa');
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    db.sessions = db.sessions.filter(item => item.tokenHash !== tokenHash);
    saveDatabase(db);
    return null;
  }

  return {
    userId: session.userId,
    rememberMe: Boolean(session.rememberMe),
    expiresAt: session.expiresAt,
    failedAttempts: session.mfaFailedAttempts || 0
  };
}

export async function incrementMfaChallengeFailures(token: string): Promise<number> {
  if (!token) return 0;

  const tokenHash = hashSessionToken(token);
  if (getDataSourceMode() === 'postgres') {
    const failedAttempts = await postgresAuthRepository.updateMfaFailedAttempts(tokenHash, 1);
    if (failedAttempts >= 5) await postgresAuthRepository.deleteSession(tokenHash);
    return failedAttempts;
  }
  const db = getDatabase();
  const session = db.sessions.find(item => item.tokenHash === tokenHash && item.kind === 'mfa');
  if (!session || session.expiresAt <= Date.now()) return 0;

  session.mfaFailedAttempts = (session.mfaFailedAttempts || 0) + 1;
  const failedAttempts = session.mfaFailedAttempts;
  if (failedAttempts >= 5) {
    db.sessions = db.sessions.filter(item => item.tokenHash !== tokenHash);
  }
  saveDatabase(db);
  return failedAttempts;
}

export async function consumeMfaChallenge(token: string): Promise<MfaChallenge | null> {
  const challenge = await getMfaChallenge(token);
  if (!challenge) return null;

  const tokenHash = hashSessionToken(token);
  if (getDataSourceMode() === 'postgres') {
    await postgresAuthRepository.deleteSession(tokenHash);
    return challenge;
  }
  const db = getDatabase();
  db.sessions = db.sessions.filter(item => item.tokenHash !== tokenHash);
  saveDatabase(db);
  return challenge;
}

export function setMfaChallengeCookie(res: Response, token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.append(
    'Set-Cookie',
    `kapi_mfa_challenge=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=300;${secure}`
  );
}

export function clearMfaChallengeCookie(res: Response): void {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.append('Set-Cookie', `kapi_mfa_challenge=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0;${secure}`);
}

export function createCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(res: Response, token: string = createCsrfToken()): string {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.append(
    'Set-Cookie',
    `kapi_csrf=${token}; Path=/; SameSite=Strict; Max-Age=86400;${secure}`
  );
  return token;
}

export function clearCsrfCookie(res: Response): void {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.append('Set-Cookie', `kapi_csrf=; Path=/; SameSite=Strict; Max-Age=0;${secure}`);
}

export async function checkLockout(identifier: string, ip = 'unknown'): Promise<{ isLocked: boolean; remainingSeconds: number }> {
  if (getDataSourceMode() === 'postgres') {
    const state = await postgresSecurityControlsRepository.checkLoginLockout(identifier, ip);
    return { isLocked: state.isLocked, remainingSeconds: state.remainingSeconds };
  }

  const key = `${identifier.toLowerCase()}|${ip}`;
  const entry = loginLockouts.get(key);
  if (!entry) return { isLocked: false, remainingSeconds: 0 };
  const now = Date.now();
  if (entry.lockoutUntil > now) {
    return {
      isLocked: true,
      remainingSeconds: Math.ceil((entry.lockoutUntil - now) / 1000)
    };
  }
  loginLockouts.delete(key);
  return { isLocked: false, remainingSeconds: 0 };
}

export async function recordFailedLogin(identifier: string, ip = 'unknown'): Promise<{ isLocked: boolean; remainingSeconds: number }> {
  if (getDataSourceMode() === 'postgres') {
    const state = await postgresSecurityControlsRepository.recordFailedLogin(identifier, ip);
    return { isLocked: state.isLocked, remainingSeconds: state.remainingSeconds };
  }

  const key = `${identifier.toLowerCase()}|${ip}`;
  const entry = loginLockouts.get(key) || { failedAttempts: 0, lockoutUntil: 0 };
  entry.failedAttempts += 1;
  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  loginLockouts.set(key, entry);
  return {
    isLocked: entry.lockoutUntil > Date.now(),
    remainingSeconds: entry.lockoutUntil > Date.now()
      ? Math.ceil((entry.lockoutUntil - Date.now()) / 1000)
      : 0
  };
}

export async function clearLockout(identifier: string, ip = 'unknown'): Promise<void> {
  if (getDataSourceMode() === 'postgres') {
    await postgresSecurityControlsRepository.clearLoginLockout(identifier, ip);
    return;
  }
  loginLockouts.delete(`${identifier.toLowerCase()}|${ip}`);
}

export async function createSession(user: StoredUser, ip: string, userAgent: string, rememberMe = false): Promise<StoredSession> {
  const now = Date.now();
  const lifetime = rememberMe ? EXTENDED_SESSION_LIFETIME_MS : SESSION_LIFETIME_MS;
  const expiresAt = now + lifetime;
  const token = `kapi_sec_${crypto.randomBytes(32).toString('hex')}`;

  const session: StoredSession = {
    tokenHash: hashSessionToken(token),
    userId: user.id,
    createdAt: new Date(now).toISOString(),
    lastActivityAt: new Date(now).toISOString(),
    expiresAt,
    rememberMe,
    ip,
    userAgent,
    kind: 'session'
  };

  if (getDataSourceMode() === 'postgres') {
    await postgresAuthRepository.createSession(session);
    await postgresAuthRepository.pruneUserSessions(user.id, 5);
    return { ...session, token };
  }

  const db = getDatabase();

  // Keep a bounded number of sessions and remove stale sessions for the same account.
  db.sessions = db.sessions.filter(s => s.expiresAt > now);
  const userSessions = db.sessions.filter(s => s.userId === user.id);
  if (userSessions.length >= 5) {
    const keep = userSessions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
      .map(s => s.tokenHash);
    db.sessions = db.sessions.filter(s => s.userId !== user.id || keep.includes(s.tokenHash));
  }
  db.sessions.push(session);
  saveDatabase(db);

  // Return the one-time raw token to the caller without persisting it in the database.
  return { ...session, token };
}

export async function revokeSession(token: string): Promise<boolean> {
  const tokenHash = hashSessionToken(token);
  if (getDataSourceMode() === 'postgres') return postgresAuthRepository.deleteSession(tokenHash);
  const db = getDatabase();
  const initialCount = db.sessions.length;
  db.sessions = db.sessions.filter(s => s.tokenHash !== tokenHash);
  if (db.sessions.length !== initialCount) {
    saveDatabase(db);
    return true;
  }
  return false;
}

export async function revokeAllUserSessions(userId: string, exceptTokenHash?: string): Promise<number> {
  if (getDataSourceMode() === 'postgres') return postgresAuthRepository.revokeUserSessions(userId, exceptTokenHash);
  const db = getDatabase();
  const before = db.sessions.length;
  db.sessions = db.sessions.filter(s => s.userId !== userId || (exceptTokenHash ? s.tokenHash === exceptTokenHash : false));
  const revoked = before - db.sessions.length;
  if (revoked > 0) saveDatabase(db);
  return revoked;
}

export async function getSessionUser(token: string): Promise<StoredUser | null> {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  if (getDataSourceMode() === 'postgres') {
    const session = await postgresAuthRepository.findSession(tokenHash);
    if (!session || session.kind === 'mfa') return null;
    const now = Date.now();
    const lastActivityAt = new Date(session.lastActivityAt || session.createdAt).getTime();
    if (session.expiresAt <= now || now - lastActivityAt > SESSION_IDLE_TIMEOUT_MS) { await postgresAuthRepository.deleteSession(tokenHash); return null; }
    const user = await postgresAuthRepository.findUserById(session.userId);
    if (!user || user.status === 'suspended') { await postgresAuthRepository.deleteSession(tokenHash); return null; }
    if (now - lastActivityAt > SESSION_TOUCH_INTERVAL_MS) await postgresAuthRepository.updateSessionActivity(tokenHash, new Date(now).toISOString());
    return user;
  }
  const db = getDatabase();
  const session = db.sessions.find(s => s.tokenHash === tokenHash);
  if (!session || session.kind === 'mfa') return null;

  const now = Date.now();
  const lastActivityAt = new Date(session.lastActivityAt || session.createdAt).getTime();
  if (session.expiresAt <= now || now - lastActivityAt > SESSION_IDLE_TIMEOUT_MS) {
    db.sessions = db.sessions.filter(s => s.tokenHash !== tokenHash);
    saveDatabase(db);
    return null;
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user || user.status === 'suspended') {
    db.sessions = db.sessions.filter(s => s.tokenHash !== tokenHash);
    saveDatabase(db);
    return null;
  }

  if (now - lastActivityAt > SESSION_TOUCH_INTERVAL_MS) {
    session.lastActivityAt = new Date(now).toISOString();
    saveDatabase(db);
  }

  return user;
}

function sameOrigin(req: Request): boolean {
  const origin = req.get('origin');
  if (!origin) return true;
  const expected = `${req.protocol}://${req.get('host')}`;
  return origin === expected;
}

export function validateCsrf(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  if (req.path === '/auth/login' || req.path === '/leads/submit') {
    next();
    return;
  }

  if (!req.user) {
    next();
    return;
  }

  const cookieToken = cookieValue(req, 'kapi_csrf');
  const headerToken = req.get('x-csrf-token') || '';
  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken) || !sameOrigin(req)) {
    recordSecurityAudit({
      action: 'CSRF_BLOCKED',
      actor: req.user.username,
      actorRole: req.user.role,
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      details: `State-changing request blocked by CSRF/origin validation at ${req.originalUrl}.`,
      severity: 'warning'
    });
    res.status(403).json({ success: false, error: 'Security validation failed. Refresh the page and try again.' });
    return;
  }

  next();
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const sessionToken = cookieValue(req, 'kapi_session');
  try {
    if (sessionToken) {
      const user = await getSessionUser(sessionToken);
      if (user) {
        req.user = user;
        req.sessionToken = sessionToken;
        if (!cookieValue(req, 'kapi_csrf')) setCsrfCookie(res);
      }
    }
    next();
  } catch (error) {
    console.error('[Auth] Session lookup failed:', error);
    res.status(503).json({ success: false, error: 'Authentication service is temporarily unavailable.' });
  }
}
function requireMfaForProtectedAccess(req: AuthenticatedRequest, res: Response): boolean {
  if (!req.user) return true;
  if (req.user.mfaEnabled) return true;

  recordSecurityAudit({
    action: 'MFA_REQUIRED',
    actor: req.user.username,
    actorRole: req.user.role,
    ip: req.ip || '',
    userAgent: req.headers['user-agent'] || '',
    details: `Protected endpoint blocked until TOTP MFA is enabled at ${req.originalUrl}.`,
    severity: 'warning'
  });
  res.status(403).json({
    success: false,
    error: 'MFA is required before accessing protected AMS functions.',
    code: 'MFA_REQUIRED'
  });
  return false;
}

const MFA_BOOTSTRAP_EXEMPT_PATHS = new Set([
  '/auth/me',
  '/auth/logout',
  '/auth/mfa/setup/start',
  '/auth/mfa/setup/verify'
]);

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthenticated: Valid session required.' });
    return;
  }

  if (!MFA_BOOTSTRAP_EXEMPT_PATHS.has(req.path) && !requireMfaForProtectedAccess(req, res)) {
    return;
  }

  next();
}

export function requirePermission(permissionKey: keyof StoredUser['permissions']) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated' });
      return;
    }
    if (!requireMfaForProtectedAccess(req, res)) return;
    if (req.user.stakeholderType === 'Master') {
      next();
      return;
    }
    if (!req.user.permissions?.[permissionKey]) {
      recordSecurityAudit({
        action: 'ACCESS_DENIED',
        actor: req.user.username,
        actorRole: req.user.role,
        ip: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: `Missing permission '${permissionKey}' at ${req.originalUrl}.`,
        severity: 'warning'
      });
      res.status(403).json({ success: false, error: 'Unauthorized: insufficient permissions.' });
      return;
    }
    next();
  };
}

export function requireMaster(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthenticated' });
    return;
  }
  if (!requireMfaForProtectedAccess(req, res)) return;
  if (req.user.stakeholderType !== 'Master') {
    recordSecurityAudit({
      action: 'ACCESS_DENIED',
      actor: req.user.username,
      actorRole: req.user.role,
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      details: `Master-only endpoint denied at ${req.originalUrl}.`,
      severity: 'warning'
    });
    res.status(403).json({ success: false, error: 'Master administrator access required.' });
    return;
  }
  next();
}

export function requireAnyPermission(...permissionKeys: Array<keyof StoredUser['permissions']>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated' });
      return;
    }
    if (!requireMfaForProtectedAccess(req, res)) return;
    if (req.user.stakeholderType === 'Master') {
      next();
      return;
    }
    if (!req.user.permissions || !permissionKeys.some(key => Boolean(req.user!.permissions[key]))) {
      recordSecurityAudit({
        action: 'ACCESS_DENIED',
        actor: req.user.username,
        actorRole: req.user.role,
        ip: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: `Missing any permission [${permissionKeys.join(', ')}] at ${req.originalUrl}.`,
        severity: 'warning'
      });
      res.status(403).json({ success: false, error: 'Unauthorized: insufficient permissions.' });
      return;
    }
    next();
  };
}

export function rateLimitAuthenticated(maxRequests = 60, windowMs = 60 * 1000) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (getDataSourceMode() === 'postgres') {
      const identity = req.user?.id || req.ip || 'unknown';
      const bucketKey = `auth:${identity}:${maxRequests}:${windowMs}`;
      void postgresSecurityControlsRepository.consumeRateLimit(bucketKey, maxRequests, windowMs)
        .then(state => {
          if (!state.allowed) {
            res.status(429).json({ success: false, error: 'Too many requests. Please try again shortly.', remainingSeconds: state.remainingSeconds });
            return;
          }
          next();
        })
        .catch(error => {
          console.error('[Security] PostgreSQL authenticated rate-limit check failed:', error);
          res.status(503).json({ success: false, error: 'Security controls are temporarily unavailable.' });
        });
      return;
    }

    const key = req.user?.id || req.ip || 'unknown';
    const now = Date.now();
    const current = authenticatedRateLimits.get(key);
    if (!current || current.resetAt <= now) {
      authenticatedRateLimits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (current.count >= maxRequests) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again shortly.' });
      return;
    }
    current.count += 1;
    next();
  };
}

export function rateLimitPublic(maxRequests = 30, windowMs = 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (getDataSourceMode() === 'postgres') {
      const identity = req.ip || req.socket.remoteAddress || 'unknown';
      const bucketKey = `public:${identity}:${maxRequests}:${windowMs}`;
      void postgresSecurityControlsRepository.consumeRateLimit(bucketKey, maxRequests, windowMs)
        .then(state => {
          if (!state.allowed) {
            res.status(429).json({ success: false, error: 'Too many requests. Please slow down and try again shortly.', remainingSeconds: state.remainingSeconds });
            return;
          }
          next();
        })
        .catch(error => {
          console.error('[Security] PostgreSQL public rate-limit check failed:', error);
          res.status(503).json({ success: false, error: 'Security controls are temporarily unavailable.' });
        });
      return;
    }

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const current = publicRateLimits.get(key);
    if (!current || current.resetAt <= now) {
      publicRateLimits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (current.count >= maxRequests) {
      res.status(429).json({ success: false, error: 'Too many requests. Please slow down and try again shortly.' });
      return;
    }
    current.count += 1;
    next();
  };
}

export function verifyPasswordForUser(password: string, user: StoredUser): boolean {
  return verifyPassword(password, user);
}

export function preparePassword(password: string): { salt: string; passwordHash: string; passwordAlgorithm: 'scrypt-v1' } {
  const salt = crypto.randomBytes(16).toString('hex');
  return {
    salt,
    passwordHash: hashPassword(password, salt, 'scrypt-v1'),
    passwordAlgorithm: 'scrypt-v1'
  };
}
