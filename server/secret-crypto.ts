import crypto from 'node:crypto';

const PREFIX = 'KAPI-SECRET-V1:';

function getKey(): Buffer {
  const raw = process.env.KAPITECH_DATA_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error('KAPITECH_DATA_ENCRYPTION_KEY is required to protect PostgreSQL secrets.');
  }

  const key = /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');

  if (key.length !== 32) {
    throw new Error('KAPITECH_DATA_ENCRYPTION_KEY must be exactly 32 bytes.');
  }

  return key;
}

export function isEncryptedSecret(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function encryptSecret(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (isEncryptedSecret(value)) return value;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return PREFIX + JSON.stringify({
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    data: encrypted.toString('base64')
  });
}

export function decryptSecret(value: string | null | undefined): string | undefined {
  if (value == null || value === '') return undefined;
  if (!isEncryptedSecret(value)) return value;

  const payload = JSON.parse(value.slice(PREFIX.length));
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const encrypted = Buffer.from(payload.data, 'base64');

  if (iv.length !== 12 || authTag.length !== 16 || encrypted.length === 0) {
    throw new Error('Encrypted secret envelope is malformed.');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8');
}

export function encryptOptionalSecret(value: string | null | undefined): string | null {
  return value == null || value === '' ? null : encryptSecret(value);
}
