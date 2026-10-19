import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const backupPath = process.argv[2];
const outputDir = process.argv[3] || path.join(process.cwd(), '.restore-rehearsal');

if (!backupPath) {
  throw new Error('Usage: tsx scripts/postgres-restore-rehearsal.ts <backup-file> [isolated-output-dir]');
}

const PREFIX = 'KAPI-ENC-V1:';

function key(): Buffer {
  const raw = process.env.KAPITECH_DATA_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error('KAPITECH_DATA_ENCRYPTION_KEY is required.');
  const value = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (value.length !== 32) throw new Error('KAPITECH_DATA_ENCRYPTION_KEY must decode to 32 bytes.');
  return value;
}

function decrypt(raw: string): string {
  if (!raw.startsWith(PREFIX)) return raw;
  const payload = JSON.parse(raw.slice(PREFIX.length));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.data, 'base64')),
    decipher.final()
  ]).toString('utf8');
}

const source = fs.readFileSync(path.resolve(backupPath), 'utf8');
const plaintext = decrypt(source);
const db = JSON.parse(plaintext);

const requiredArrays = [
  'users','sessions','leads','clients','crmDeals','projects','proposals',
  'tasks','timeLogs','invoices','expenses','approvals','vendors',
  'documents','notifications','auditLogs'
];

for (const name of requiredArrays) {
  if (!Array.isArray(db[name])) throw new Error(`Restored database is missing array: ${name}`);
}

fs.mkdirSync(path.resolve(outputDir), { recursive: true, mode: 0o700 });
const restoredPath = path.join(path.resolve(outputDir), 'kapitech_db.json');
fs.writeFileSync(restoredPath, source, { mode: 0o600 });
try { fs.chmodSync(restoredPath, 0o600); } catch {}

const summary = {
  restoredAt: new Date().toISOString(),
  sourceBytes: Buffer.byteLength(source),
  restoredBytes: fs.statSync(restoredPath).size,
  encrypted: source.startsWith(PREFIX),
  counts: Object.fromEntries(requiredArrays.map(name => [name, db[name].length]))
};

console.log(JSON.stringify(summary, null, 2));
