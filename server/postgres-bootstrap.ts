import { getPostgresPool } from './postgres.ts';
import { generateSalt, hashPassword, type StoredUser } from './db.ts';

function requiredProductionValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + ' must be configured before PostgreSQL can bootstrap the first admin account.');
  return value;
}

function buildInitialAdmin(): StoredUser {
  const username = requiredProductionValue('ADMIN_INITIAL_USERNAME').toLowerCase();
  const email = requiredProductionValue('ADMIN_INITIAL_EMAIL').toLowerCase();
  const password = requiredProductionValue('ADMIN_INITIAL_PASSWORD');

  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)) throw new Error('ADMIN_INITIAL_USERNAME is invalid.');
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) throw new Error('ADMIN_INITIAL_EMAIL is invalid.');
  if (password.length < 12 || password.length > 128) throw new Error('ADMIN_INITIAL_PASSWORD must be 12 to 128 characters.');

  const salt = generateSalt();
  return {
    id: 'usr_root_admin',
    name: 'Executive Master Admin',
    username, email,
    passwordHash: hashPassword(password, salt, 'scrypt-v1'),
    salt, passwordAlgorithm: 'scrypt-v1',
    role: 'Tier 1: Top Management / Sponsor',
    stakeholderType: 'Master',
    permissions: {
      canViewFinancials: true, canManageInvoices: true, canApproveBudgets: true, canManageCrm: true,
      canManageProjects: true, canManageKanbanTasks: true, canManageClients: true, canManageVendors: true,
      canManageCmsContent: true, canAccessServerAndApi: true, canRunDataMigration: true,
      canViewSecurityAuditLogs: true, canManageAdminAccounts: true
    },
    mfaEnabled: false, division: 'Management', status: 'active', lastLogin: '',
    createdAt: new Date().toISOString()
  };
}

export async function ensurePostgresInitialAdmin(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return;

  const pool = getPostgresPool();
  const countResult = await pool.query<{ count: string }>('SELECT COUNT(*)::bigint AS count FROM users');
  if (Number(countResult.rows[0]?.count || 0) > 0) {
    const rootResult = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE stakeholder_type = 'Master' OR id = 'usr_root_admin' LIMIT 1"
    );
    if (rootResult.rows.length === 0) {
      throw new Error('PostgreSQL contains users but no Master admin account. Refusing to start.');
    }
    return;
  }

  const admin = buildInitialAdmin();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO users (id,name,username,email,password_hash,salt,password_algorithm,role,stakeholder_type,permissions,mfa_enabled,mfa_secret,mfa_pending_secret,mfa_pending_secret_created_at,mfa_recovery_code_hashes,division,status,last_login,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)',
      [admin.id, admin.name, admin.username, admin.email, admin.passwordHash, admin.salt, admin.passwordAlgorithm,
       admin.role, admin.stakeholderType, JSON.stringify(admin.permissions), admin.mfaEnabled, null, null, null,
       JSON.stringify([]), admin.division, admin.status, null, admin.createdAt]
    );
    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}