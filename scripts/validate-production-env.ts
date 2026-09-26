import path from 'node:path';
import { URL, fileURLToPath } from 'node:url';

export type ProductionEnvironmentValidation = {
  errors: string[];
  warnings: string[];
  valid: boolean;
};

const HEX64 = /^[0-9a-fA-F]{64}$/;

function required(env: Record<string, string | undefined>, name: string, errors: string[]): string {
  const value = env[name]?.trim() || '';
  if (!value) errors.push(`${name} is required.`);
  return value;
}

function checkIsoPastOrNow(value: string, name: string, errors: string[]): void {
  if (!value) return;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    errors.push(`${name} must be a valid ISO-8601 timestamp.`);
    return;
  }
  if (parsed.getTime() > Date.now()) errors.push(`${name} must not be in the future.`);
}

function checkSha(value: string, name: string, errors: string[]): void {
  if (!value) return;
  if (!HEX64.test(value)) errors.push(`${name} must be a 64-character SHA-256 hex value.`);
}

export function validateProductionEnvironment(
  env: Record<string, string | undefined> = process.env
): ProductionEnvironmentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if ((env.NODE_ENV || '').trim() !== 'production') {
    errors.push('NODE_ENV must be production.');
  }

  if ((env.KAPITECH_DATA_SOURCE || '').trim().toLowerCase() !== 'postgres') {
    errors.push('KAPITECH_DATA_SOURCE must be postgres.');
  }

  const postgresUrl = required(env, 'KAPITECH_POSTGRES_URL', errors);
  const poolSettings: Array<[string, number]> = [
    ['KAPITECH_POSTGRES_POOL_MAX', 10],
    ['KAPITECH_POSTGRES_IDLE_TIMEOUT_MS', 10_000],
    ['KAPITECH_POSTGRES_CONNECTION_TIMEOUT_MS', 5_000],
    ['KAPITECH_POSTGRES_STATEMENT_TIMEOUT_MS', 15_000],
  ];
  for (const [name, fallback] of poolSettings) {
    const raw = (env[name] || '').trim();
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isInteger(value) || value <= 0) {
      errors.push(`${name} must be a positive integer; default is ${fallback}.`);
    }
  }

  if (postgresUrl) {
    try {
      const parsed = new URL(postgresUrl);
      if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
        errors.push('KAPITECH_POSTGRES_URL must use postgres:// or postgresql://.');
      } else if (!parsed.hostname || !parsed.pathname || parsed.pathname === '/') {
        errors.push('KAPITECH_POSTGRES_URL must include a PostgreSQL host and database name.');
      }
    } catch {
      errors.push('KAPITECH_POSTGRES_URL must be a valid PostgreSQL URL. Use postgresql://USER:PASSWORD@HOST:PORT/DATABASE and URL-encode special characters in the username/password.');
    }
  }

  if (['disable', 'off', 'false', '0'].includes((env.KAPITECH_POSTGRES_SSL || '').trim().toLowerCase())) {
    errors.push('KAPITECH_POSTGRES_SSL must not disable TLS in production.');
  }

  const encryptionKey = required(env, 'KAPITECH_DATA_ENCRYPTION_KEY', errors);
  if (encryptionKey && !HEX64.test(encryptionKey)) {
    try {
      const decoded = Buffer.from(encryptionKey, 'base64');
      if (decoded.length !== 32 || decoded.toString('base64').replace(/=+$/,'') !== encryptionKey.replace(/=+$/,'')) {
        errors.push('KAPITECH_DATA_ENCRYPTION_KEY must be exactly 32 bytes as 64 hexadecimal characters or valid base64.');
      }
    } catch {
      errors.push('KAPITECH_DATA_ENCRYPTION_KEY must be exactly 32 bytes as 64 hexadecimal characters or valid base64.');
    }
  }

  const firebaseEnabled = /^true$/i.test((env.KAPITECH_FIREBASE_AUTH_ENABLED || '').trim());
  if (firebaseEnabled && !(env.FIREBASE_PROJECT_ID || '').trim()) {
    errors.push('FIREBASE_PROJECT_ID is required when KAPITECH_FIREBASE_AUTH_ENABLED=true.');
  }

  const appUrl = required(env, 'APP_URL', errors);
  if (appUrl) {
    try {
      const parsed = new URL(appUrl);
      if (parsed.protocol !== 'https:') errors.push('APP_URL must use HTTPS in production.');
    } catch {
      errors.push('APP_URL must be a valid URL.');
    }
  }

  const storageProvider = required(env, 'KAPITECH_DOCUMENT_STORAGE_PROVIDER', errors).toLowerCase();
  if (!['s3', 's3-compatible'].includes(storageProvider)) {
    errors.push('Production document storage must use the s3-compatible provider.');
  }
  required(env, 'KAPITECH_DOCUMENT_STORAGE_BUCKET', errors);
  const storageEndpoint = required(env, 'KAPITECH_DOCUMENT_STORAGE_ENDPOINT', errors);
  if (storageEndpoint) {
    try {
      const parsed = new URL(storageEndpoint);
      if (parsed.protocol !== 'https:') errors.push('KAPITECH_DOCUMENT_STORAGE_ENDPOINT must use HTTPS.');
    } catch {
      errors.push('KAPITECH_DOCUMENT_STORAGE_ENDPOINT must be a valid URL.');
    }
  }
  required(env, 'KAPITECH_DOCUMENT_STORAGE_ACCESS_KEY_ID', errors);
  required(env, 'KAPITECH_DOCUMENT_STORAGE_SECRET_ACCESS_KEY', errors);

  required(env, 'KAPITECH_POSTGRES_BACKUP_PROVIDER', errors);
  const latestBackupAt = required(env, 'KAPITECH_POSTGRES_BACKUP_LATEST_AT', errors);
  const latestBackupSha256 = required(env, 'KAPITECH_POSTGRES_BACKUP_LATEST_SHA256', errors);
  checkIsoPastOrNow(latestBackupAt, 'KAPITECH_POSTGRES_BACKUP_LATEST_AT', errors);
  checkSha(latestBackupSha256, 'KAPITECH_POSTGRES_BACKUP_LATEST_SHA256', errors);

  const restoreVerifiedAt = required(env, 'KAPITECH_POSTGRES_BACKUP_RESTORE_VERIFIED_AT', errors);
  const restoreBackupSha256 = required(env, 'KAPITECH_POSTGRES_BACKUP_RESTORE_BACKUP_SHA256', errors);
  checkIsoPastOrNow(restoreVerifiedAt, 'KAPITECH_POSTGRES_BACKUP_RESTORE_VERIFIED_AT', errors);
  checkSha(restoreBackupSha256, 'KAPITECH_POSTGRES_BACKUP_RESTORE_BACKUP_SHA256', errors);
  if (latestBackupSha256 && restoreBackupSha256 && latestBackupSha256.toLowerCase() !== restoreBackupSha256.toLowerCase()) {
    errors.push('KAPITECH_POSTGRES_BACKUP_RESTORE_BACKUP_SHA256 must match KAPITECH_POSTGRES_BACKUP_LATEST_SHA256.');
  }

  const reconciliationVerifiedAt = required(env, 'KAPITECH_RELATIONAL_RECONCILIATION_VERIFIED_AT', errors);
  const reconciliationSourceSha256 = required(env, 'KAPITECH_RELATIONAL_RECONCILIATION_SOURCE_SHA256', errors);
  checkIsoPastOrNow(reconciliationVerifiedAt, 'KAPITECH_RELATIONAL_RECONCILIATION_VERIFIED_AT', errors);
  checkSha(reconciliationSourceSha256, 'KAPITECH_RELATIONAL_RECONCILIATION_SOURCE_SHA256', errors);

  if (!(env.ADMIN_INITIAL_PASSWORD || '').trim()) {
    warnings.push('ADMIN_INITIAL_PASSWORD is empty. This is only valid when the production PostgreSQL database already contains an administrator account.');
  }

  const hasTelegram = Boolean((env.KAPITECH_TELEGRAM_BOT_TOKEN || '').trim() || (env.KAPITECH_TELEGRAM_CHAT_ID || '').trim());
  if (hasTelegram && (!(env.KAPITECH_TELEGRAM_BOT_TOKEN || '').trim() || !(env.KAPITECH_TELEGRAM_CHAT_ID || '').trim())) {
    errors.push('Telegram notification configuration must provide both bot token and chat ID when enabled.');
  }

  return { errors, warnings, valid: errors.length === 0 };
}

const isDirectExecution = Boolean(
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
);

if (isDirectExecution) {
  if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
    const result = validateProductionEnvironment();
    if (result.warnings.length > 0) {
      for (const warning of result.warnings) console.warn(`[Production Env] Warning: ${warning}`);
    }
    if (!result.valid) {
      console.error('[Production Env] Validation failed:');
      for (const error of result.errors) console.error(`- ${error}`);
      process.exit(1);
    }
    console.log('[Production Env] Contract validation passed. Secret values were not printed.');
  } else {
    console.log('[Production Env] Skipped because NODE_ENV is not production and CI is not true.');
  }
}
