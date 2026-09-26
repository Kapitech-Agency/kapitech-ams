/**
 * Admin Authentication, Session & Security Module for Kapitech Agency
 * Interfaces directly with the server-side API (/api/auth) for authentic
 * server-side password verification, cryptographically secure sessions,
 * brute-force lockout, and tamper-resistant audit logging.
 */

import { api } from './apiClient';
import { StakeholderRole } from './rbacEngine';

export type AdminTier = 
  | 'Tier 1: Top Management / Sponsor'
  | 'Stakeholder Executive'
  | 'Teknisi IT / Systems Engineer'
  | 'Tier 2: Project Manager (PM)' 
  | 'Tier 3: Operational Staff' 
  | 'Tier 4: Internal IT / System Administrator';

export interface StakeholderPermissions {
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
}

export interface AdminUser {
  id: string;
  name?: string;
  username: string;
  email: string;
  role: AdminTier;
  permissions?: StakeholderPermissions;
  stakeholderType?: 'Executive' | 'IT_Technical' | 'Project_Manager' | 'Operations' | 'Master';
  mfaEnabled?: boolean;
  division?: 'Management' | 'Engineering' | 'Design' | 'Finance' | 'Operations';
  lastLogin: string;
  createdAt: string;
}

export interface AdminAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  role: AdminTier;
  stakeholderType: 'Executive' | 'IT_Technical' | 'Project_Manager' | 'Operations' | 'Master';
  permissions: StakeholderPermissions;
  mfaEnabled: boolean;
  division: 'Management' | 'Engineering' | 'Design' | 'Finance' | 'Operations';
  status: 'active' | 'suspended';
  lastLogin: string;
  createdAt: string;
}

export interface AdminSession {
  user: AdminUser;
  expiresAt: number;
  rememberMe: boolean;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  ip: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export const DEFAULT_PERMISSIONS_MASTER: StakeholderPermissions = {
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
};

export function getDefaultPermissionsForRole(role: string): StakeholderPermissions {
  if (role.includes('Top Management') || role.includes('Master')) {
    return { ...DEFAULT_PERMISSIONS_MASTER };
  }
  if (role.includes('Executive')) {
    return {
      ...DEFAULT_PERMISSIONS_MASTER,
      canManageKanbanTasks: false,
      canManageCmsContent: false,
      canAccessServerAndApi: false,
      canRunDataMigration: false
    };
  }
  if (role.includes('Project Manager')) {
    return {
      ...DEFAULT_PERMISSIONS_MASTER,
      canManageInvoices: false,
      canApproveBudgets: false,
      canManageCmsContent: false,
      canAccessServerAndApi: false,
      canRunDataMigration: false,
      canViewSecurityAuditLogs: false,
      canManageAdminAccounts: false
    };
  }
  return {
    canViewFinancials: false,
    canManageInvoices: false,
    canApproveBudgets: false,
    canManageCrm: false,
    canManageProjects: true,
    canManageKanbanTasks: true,
    canManageClients: false,
    canManageVendors: false,
    canManageCmsContent: false,
    canAccessServerAndApi: false,
    canRunDataMigration: false,
    canViewSecurityAuditLogs: false,
    canManageAdminAccounts: false
  };
}

// Security decisions are enforced by the server. These helpers remain as no-op compatibility shims.
export function getLockoutState(): { isLocked: boolean; remainingSeconds: number } {
  return { isLocked: false, remainingSeconds: 0 };
}
export function recordClientFailedAttempt(): void {}
export function clearClientLockout(): void {}

const ADMIN_PROFILE_KEY = 'kapitech_admin_profile_v2';

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_PROFILE_KEY) || localStorage.getItem(ADMIN_PROFILE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (!session?.user || (session.expiresAt && session.expiresAt <= Date.now())) {
      sessionStorage.removeItem(ADMIN_PROFILE_KEY);
      localStorage.removeItem(ADMIN_PROFILE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function cacheAdminSession(user: AdminUser, rememberMe: boolean): AdminSession {
  // Only cache the non-secret user profile. Authentication remains in the HttpOnly server cookie.
  const durationMs = rememberMe ? 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
  const session: AdminSession = { user, expiresAt: Date.now() + durationMs, rememberMe };
  const serialized = JSON.stringify(session);
  sessionStorage.removeItem(ADMIN_PROFILE_KEY);
  localStorage.removeItem(ADMIN_PROFILE_KEY);
  (rememberMe ? localStorage : sessionStorage).setItem(ADMIN_PROFILE_KEY, serialized);
  return session;
}

export function isUserAuthenticated(): boolean {
  return getAdminSession() !== null;
}

export async function authenticateAdmin(
  identifier: string,
  passwordPlain: string,
  rememberMe: boolean = false
): Promise<{ success: boolean; error?: string; session?: AdminSession; requiresMfa?: boolean; mfaUser?: { id: string; username: string; email: string } }> {
  const res = await api.auth.login({ identifier, password: passwordPlain, rememberMe });
  if (!res.success || !res.data?.success) {
    return {
      success: false,
      error: res.error || (res.data as any)?.error || 'Kombinasi Username/Email atau Password tidak valid.'
    };
  }

  if ((res.data as any)?.requiresMfa) {
    return {
      success: true,
      requiresMfa: true,
      mfaUser: (res.data as any).user
    };
  }

  const session = cacheAdminSession(res.data.user, rememberMe);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('kapitech_auth_state_changed'));
  }
  return { success: true, session };
}

export function logoutAdmin(): void {
  void api.auth.logout().catch(() => {});
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ADMIN_PROFILE_KEY);
    localStorage.removeItem('kapitech_session_token');
    sessionStorage.removeItem('kapitech_session_token');
    localStorage.removeItem('kapitech_admin_session_v1');
    sessionStorage.removeItem('kapitech_admin_session_v1');
    localStorage.removeItem('kapitech_simulated_role');
    window.dispatchEvent(new Event('kapitech_auth_state_changed'));
  }
}

export function hasPermission(permission: keyof StakeholderPermissions): boolean {
  const session = getAdminSession();
  if (!session) return false;
  if (session.user.stakeholderType === 'Master') return true;
  return Boolean(session.user.permissions?.[permission]);
}

export const hasAdminPermission = hasPermission;

// Server Account Management
export async function fetchAdminAccounts(): Promise<AdminAccount[]> {
  const res = await api.auth.getUsers();
  if (res.success && res.data?.users) {
    return res.data.users;
  }
  return [];
}

export async function createAdminAccount(data: {
  name: string;
  username: string;
  email: string;
  passwordPlain: string;
  role: AdminTier;
  division?: 'Management' | 'Engineering' | 'Design' | 'Finance' | 'Operations';
}): Promise<{ success: boolean; error?: string; account?: AdminAccount }> {
  const res = await api.auth.createUser({
    name: data.name,
    username: data.username,
    email: data.email,
    password: data.passwordPlain,
    role: data.role,
    division: data.division || 'Operations'
  });

  if (res.success && res.data?.success) {
    return { success: true, account: res.data.user };
  }
  return { success: false, error: res.error || res.data?.error || 'Gagal membuat akun.' };
}

export async function deleteAdminAccount(id: string): Promise<{ success: boolean; error?: string }> {
  const res = await api.auth.deleteUser(id);
  if (res.success && res.data?.success) {
    return { success: true };
  }
  return { success: false, error: res.error || res.data?.error || 'Gagal menghapus akun.' };
}

export function updateAdminAccountPermissions(id: string, permissions: Partial<StakeholderPermissions>): { success: boolean; error?: string } {
  api.auth.updateUser(id, { permissions }).catch(() => {});
  return { success: true };
}

export function getStoredAdminAccounts(): AdminAccount[] {
  const session = getAdminSession();
  if (session) {
    return [
      {
        id: session.user.id,
        name: session.user.name || session.user.username,
        username: session.user.username,
        email: session.user.email,
        role: session.user.role,
        stakeholderType: session.user.stakeholderType || 'Master',
        permissions: session.user.permissions || DEFAULT_PERMISSIONS_MASTER,
        mfaEnabled: Boolean(session.user.mfaEnabled),
        division: session.user.division || 'Management',
        status: 'active',
        lastLogin: session.user.lastLogin || new Date().toISOString(),
        createdAt: session.user.createdAt || new Date().toISOString()
      }
    ];
  }
  return [];
}

// Audit Logs from Server
export async function fetchServerAuditLogs(): Promise<SecurityAuditLog[]> {
  const res = await api.auditLogs.getAll();
  if (res.success && res.data?.logs) {
    return res.data.logs;
  }
  return [];
}

export function getAuditLogs(): SecurityAuditLog[] {
  return [];
}

export function addAuditLog(entry: Omit<SecurityAuditLog, 'id' | 'timestamp'>): void {
  // Audit logs are created automatically on the server
}

export function clearAuditLogs(): void {
  // Immutable on client
}

// Credentials retrieval helper
export function getStoredAdminCredentials() {
  const session = getAdminSession();
  if (!session) return null;

  return {
    username: session.user.username,
    email: session.user.email,
    displayName: session.user.name || session.user.username,
    role: session.user.role || 'Unknown',
    division: session.user.division || 'Operations',
    mfaEnabled: Boolean(session.user.mfaEnabled)
  };
}

export async function verifyCurrentPassword(passwordPlain: string): Promise<boolean> {
  const res = await api.auth.verifyPassword(passwordPlain);
  return Boolean(res.success && res.data?.success);
}

export async function updateAdminCredentials(
  currentPassword: string,
  data: { username?: string; email?: string; newPassword?: string }
): Promise<{ success: boolean; error?: string }> {
  if (data.newPassword) {
    const res = await api.auth.changePassword({ currentPassword, newPassword: data.newPassword });
    if (!res.success || !res.data?.success) {
      return { success: false, error: res.error || (res.data as any)?.error || 'Password saat ini salah.' };
    }
  }
  return { success: true };
}

export async function updateAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const res = await api.auth.changePassword({ currentPassword, newPassword });
  if (res.success && res.data?.success) {
    return { success: true };
  }
  return { success: false, error: res.error || res.data?.error || 'Gagal mengubah password.' };
}