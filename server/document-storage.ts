import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type DocumentStorageProvider = 'local-encrypted-filesystem' | 's3-compatible';

export interface DocumentStorageObject {
  body: Buffer;
  storageSha256: string;
}

export interface DocumentStorage {
  readonly provider: DocumentStorageProvider;
  put(storageKey: string, payload: Buffer): Promise<void>;
  get(storageKey: string): Promise<DocumentStorageObject>;
  delete(storageKey: string): Promise<void>;
  verify(storageKey: string, expectedSha256: string): Promise<boolean>;
  healthCheck(): Promise<{ configured: boolean; ok: boolean; provider: string; reason?: string }>;
}

const LOCAL_DIR = process.env.KAPITECH_DATA_DIR
  ? path.join(path.resolve(process.env.KAPITECH_DATA_DIR), 'private-documents')
  : path.join(process.env.HOME || process.cwd(), '.kapitech-ams-data', 'private-documents');

function validateStorageKey(storageKey: string): string {
  const key = String(storageKey || '');
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Invalid private document storage key.');
  return key;
}

function sha256(payload: Buffer): string {
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function ensureLocalDirectory(): void {
  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(LOCAL_DIR, 0o700); } catch {}
}

class LocalEncryptedFilesystemStorage implements DocumentStorage {
  readonly provider = 'local-encrypted-filesystem' as const;

  private filePath(storageKey: string): string {
    const key = validateStorageKey(storageKey);
    return path.join(LOCAL_DIR, key + '.enc');
  }

  async put(storageKey: string, payload: Buffer): Promise<void> {
    ensureLocalDirectory();
    const targetPath = this.filePath(storageKey);
    const tempPath = targetPath + '.' + process.pid + '.' + Date.now() + '.tmp';
    fs.writeFileSync(tempPath, payload, { flag: 'wx', mode: 0o600 });
    try { fs.chmodSync(tempPath, 0o600); } catch {}
    try {
      if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
      fs.renameSync(tempPath, targetPath);
    } catch (error) {
      try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
      throw error;
    }
  }

  async get(storageKey: string): Promise<DocumentStorageObject> {
    const filePath = this.filePath(storageKey);
    if (!fs.existsSync(filePath)) throw new Error('Private document content is missing.');
    const body = fs.readFileSync(filePath);
    return { body, storageSha256: sha256(body) };
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = this.filePath(storageKey);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  async verify(storageKey: string, expectedSha256: string): Promise<boolean> {
    try {
      const filePath = this.filePath(storageKey);
      if (!fs.existsSync(filePath)) return false;
      return sha256(fs.readFileSync(filePath)) === String(expectedSha256 || '').trim();
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<{ configured: boolean; ok: boolean; provider: string; reason?: string }> {
    try {
      ensureLocalDirectory();
      return { configured: false, ok: true, provider: this.provider, reason: 'Local filesystem is not durable object storage for production.' };
    } catch (error) {
      return { configured: false, ok: false, provider: this.provider, reason: error instanceof Error ? error.message : 'Local storage unavailable.' };
    }
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function hmac(key: Buffer | string, value: string): Buffer {
  return crypto.createHmac('sha256', key).update(value).digest();
}

function hashHex(value: string | Buffer): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function encodePath(pathname: string): string {
  return pathname.split('/').map(segment => encodeURIComponent(segment)).join('/');
}

class S3CompatibleStorage implements DocumentStorage {
  readonly provider = 's3-compatible' as const;
  private readonly endpoint: URL;
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly sessionToken: string;
  private readonly bucket: string;

  constructor() {
    this.endpoint = new URL(requiredEnv('KAPITECH_DOCUMENT_STORAGE_ENDPOINT').replace(/\/$/, ''));
    this.region = process.env.KAPITECH_DOCUMENT_STORAGE_REGION?.trim() || 'auto';
    this.accessKeyId = requiredEnv('KAPITECH_DOCUMENT_STORAGE_ACCESS_KEY_ID');
    this.secretAccessKey = requiredEnv('KAPITECH_DOCUMENT_STORAGE_SECRET_ACCESS_KEY');
    this.sessionToken = process.env.KAPITECH_DOCUMENT_STORAGE_SESSION_TOKEN?.trim() || '';
    this.bucket = requiredEnv('KAPITECH_DOCUMENT_STORAGE_BUCKET');

    if (!['https:'].includes(this.endpoint.protocol)) {
      throw new Error('KAPITECH_DOCUMENT_STORAGE_ENDPOINT must use HTTPS.');
    }
  }

  private objectUrl(storageKey: string): URL {
    const key = validateStorageKey(storageKey);
    const url = new URL(this.endpoint.toString());
    const prefix = url.pathname.replace(/\/$/, '');
    url.pathname = prefix + '/' + encodePath(this.bucket + '/' + key + '.enc');
    return url;
  }

  private async request(method: string, storageKey: string | null, body?: Buffer): Promise<Response> {
    const payload = body || Buffer.alloc(0);
    const url = storageKey ? this.objectUrl(storageKey) : (() => {
      const u = new URL(this.endpoint.toString());
      u.pathname = u.pathname.replace(/\/$/, '') + '/' + encodeURIComponent(this.bucket);
      return u;
    })();

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const service = 's3';
    const host = url.host;
    const contentHash = hashHex(payload);

    const headers: Record<string, string> = {
      host,
      'x-amz-content-sha256': contentHash,
      'x-amz-date': amzDate
    };
    if (this.sessionToken) headers['x-amz-security-token'] = this.sessionToken;
    if (body) {
      headers['content-length'] = String(body.length);
      headers['x-amz-meta-storage-sha256'] = contentHash;
    }

    const signedHeaderNames = Object.keys(headers).sort();
    const canonicalHeaders = signedHeaderNames.map(name => name + ':' + headers[name].trim() + '\n').join('');
    const canonicalRequest = [
      method,
      url.pathname,
      url.searchParams.toString(),
      canonicalHeaders,
      signedHeaderNames.join(';'),
      contentHash
    ].join('\n');

    const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      hashHex(canonicalRequest)
    ].join('\n');

    const kDate = hmac('AWS4' + this.secretAccessKey, dateStamp);
    const kRegion = hmac(kDate, this.region);
    const kService = hmac(kRegion, service);
    const kSigning = hmac(kService, 'aws4_request');
    const signature = hmac(kSigning, stringToSign).toString('hex');

    headers.authorization =
      `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaderNames.join(';')}, Signature=${signature}`;

    return fetch(url, {
      method,
      headers,
      body: body && body.length > 0 ? body : undefined
    });
  }

  async put(storageKey: string, payload: Buffer): Promise<void> {
    const response = await this.request('PUT', storageKey, payload);
    if (!response.ok) throw new Error(`S3-compatible object upload failed with HTTP ${response.status}.`);
  }

  async get(storageKey: string): Promise<DocumentStorageObject> {
    const response = await this.request('GET', storageKey);
    if (!response.ok) {
      if (response.status === 404) throw new Error('Private document content is missing.');
      throw new Error(`S3-compatible object download failed with HTTP ${response.status}.`);
    }
    const body = Buffer.from(await response.arrayBuffer());
    return { body, storageSha256: sha256(body) };
  }

  async delete(storageKey: string): Promise<void> {
    const response = await this.request('DELETE', storageKey);
    if (!response.ok && response.status !== 404) {
      throw new Error(`S3-compatible object deletion failed with HTTP ${response.status}.`);
    }
  }

  async verify(storageKey: string, expectedSha256: string): Promise<boolean> {
    try {
      const response = await this.request('HEAD', storageKey);
      if (!response.ok) return false;
      const reported = response.headers.get('x-amz-meta-storage-sha256')?.trim() || '';
      return reported.length > 0 && reported === String(expectedSha256 || '').trim();
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<{ configured: boolean; ok: boolean; provider: string; reason?: string }> {
    try {
      const response = await this.request('HEAD', null);
      if (!response.ok) return { configured: true, ok: false, provider: this.provider, reason: `Bucket health check returned HTTP ${response.status}.` };
      return { configured: true, ok: true, provider: this.provider };
    } catch (error) {
      return { configured: true, ok: false, provider: this.provider, reason: error instanceof Error ? error.message : 'Object storage health check failed.' };
    }
  }
}

export function getDocumentStorage(): DocumentStorage {
  const provider = (process.env.KAPITECH_DOCUMENT_STORAGE_PROVIDER || '').trim().toLowerCase();
  if (provider === 's3' || provider === 's3-compatible') return new S3CompatibleStorage();
  return new LocalEncryptedFilesystemStorage();
}
