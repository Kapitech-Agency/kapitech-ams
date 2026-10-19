#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DB_ENCRYPTION_PREFIX = 'KAPI-ENC-V1:';
const DATA_DIR = process.env.KAPITECH_DATA_DIR
  ? path.resolve(process.env.KAPITECH_DATA_DIR)
  : path.join(process.env.HOME || process.cwd(), '.kapitech-ams-data');
const DB_FILE = path.join(DATA_DIR, 'kapitech_db.json');

const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const backupFile = positionalArgs[0];
const force = process.argv.includes('--force');
const verifyOnly = process.argv.includes('--verify-only');

function getEncryptionKey() {
  const raw = process.env.KAPITECH_DATA_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error('KAPITECH_DATA_ENCRYPTION_KEY is required for encrypted AMS restore verification.');
  }

  const key = /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');

  if (key.length !== 32) {
    throw new Error('KAPITECH_DATA_ENCRYPTION_KEY must be exactly 32 bytes as 64 hex characters or base64.');
  }

  return key;
}

function decryptDatabase(raw) {
  if (!raw.startsWith(DB_ENCRYPTION_PREFIX)) {
    throw new Error('Backup is not encrypted with the expected KAPI-ENC-V1 format.');
  }

  const payload = JSON.parse(raw.slice(DB_ENCRYPTION_PREFIX.length));
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const encrypted = Buffer.from(payload.data, 'base64');

  if (iv.length !== 12 || authTag.length !== 16 || encrypted.length === 0) {
    throw new Error('Backup encryption envelope is malformed.');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8');
}

function validateDatabaseShape(db) {
  const requiredArrays = [
    'users', 'sessions', 'leads', 'crmDeals', 'proposals', 'clients',
    'projects', 'tasks', 'timeLogs', 'invoices', 'expenses',
    'approvals', 'vendors', 'documents', 'notifications',
    'cmsServices', 'cmsProjects', 'cmsTestimonials', 'auditLogs'
  ];

  return Boolean(
    db &&
    requiredArrays.every((key) => Array.isArray(db[key])) &&
    db.cmsSettings &&
    typeof db.cmsSettings === 'object' &&
    db.notificationSettings &&
    typeof db.notificationSettings === 'object'
  );
}

function loadAndVerifyBackup(source) {
  const raw = fs.readFileSync(source, 'utf8');
  const plaintext = decryptDatabase(raw);
  const db = JSON.parse(plaintext);

  if (!validateDatabaseShape(db)) {
    throw new Error('Backup decrypted successfully but does not match the expected AMS database structure.');
  }

  return db;
}

if (!backupFile) {
  console.error('Usage: node scripts/restore-ams-db.mjs <backup-file> [--verify-only] [--force]');
  process.exit(2);
}

const source = path.resolve(backupFile);
if (!fs.existsSync(source)) {
  console.error('Backup file not found.');
  process.exit(1);
}

try {
  const db = loadAndVerifyBackup(source);
  console.log(`Backup verified: ${source}`);
  console.log(`Records: ${db.users.length} users, ${db.clients.length} clients, ${db.projects.length} projects, ${db.invoices.length} invoices.`);

  if (verifyOnly) {
    console.log('Verification-only mode: live database was not modified.');
    process.exit(0);
  }
} catch (error) {
  console.error(`Refusing restore: ${error instanceof Error ? error.message : 'backup verification failed.'}`);
  process.exit(1);
}

if (fs.existsSync(DB_FILE) && !force) {
  console.error('Refusing to overwrite the live database without --force.');
  console.error('Create a safety copy of the current database first, then rerun with --force.');
  process.exit(1);
}

fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
try { fs.chmodSync(DATA_DIR, 0o700); } catch {}

const safetyPath = fs.existsSync(DB_FILE)
  ? path.join(DATA_DIR, `kapitech_db_pre_restore_${Date.now()}.bak`)
  : null;

if (safetyPath) {
  fs.copyFileSync(DB_FILE, safetyPath);
  fs.chmodSync(safetyPath, 0o600);
}

const payload = fs.readFileSync(source);
const tempPath = `${DB_FILE}.${process.pid}.${Date.now()}.restore.tmp`;
fs.writeFileSync(tempPath, payload, { mode: 0o600 });

try {
  fs.renameSync(tempPath, DB_FILE);
  fs.chmodSync(DB_FILE, 0o600);
} catch (error) {
  try { fs.unlinkSync(tempPath); } catch {}
  throw error;
}

console.log('Database restore completed.');
if (safetyPath) console.log(`Safety copy: ${safetyPath}`);
