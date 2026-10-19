import crypto from 'crypto';

const FIREBASE_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

type FirebaseCertificateCache = {
  expiresAt: number;
  certificates: Record<string, string>;
};

let certificateCache: FirebaseCertificateCache | null = null;

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Buffer.from(normalized, 'base64');
}

function parseJwtPart<T>(value: string): T {
  return JSON.parse(base64UrlDecode(value).toString('utf8')) as T;
}

function parseCacheMaxAge(cacheControl: string | null): number {
  const match = cacheControl?.match(/max-age=(\\d+)/i);
  const seconds = match ? Number(match[1]) : 3600;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 3600;
}

async function getFirebaseCertificates(): Promise<Record<string, string>> {
  if (certificateCache && certificateCache.expiresAt > Date.now()) return certificateCache.certificates;

  const response = await fetch(FIREBASE_CERT_URL, {
    headers: { accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`Firebase certificate endpoint returned HTTP ${response.status}.`);

  const certificates = await response.json() as Record<string, string>;
  const maxAgeSeconds = parseCacheMaxAge(response.headers.get('cache-control'));
  certificateCache = {
    certificates,
    expiresAt: Date.now() + Math.max(60, maxAgeSeconds - 60) * 1000
  };
  return certificates;
}

export interface VerifiedFirebaseToken {
  uid: string;
  email: string;
  emailVerified: boolean;
  authTime: number;
  issuedAt: number;
  expiresAt: number;
  claims: Record<string, unknown>;
}

export function isFirebaseAuthEnabled(): boolean {
  return /^true$/i.test(String(process.env.KAPITECH_FIREBASE_AUTH_ENABLED || '').trim());
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken> {
  if (!isFirebaseAuthEnabled()) throw new Error('Firebase authentication is disabled.');

  const projectId = String(process.env.FIREBASE_PROJECT_ID || '').trim();
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is not configured.');

  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw new Error('Malformed Firebase ID token.');

  const header = parseJwtPart<{ alg?: string; kid?: string }>(parts[0]);
  const payload = parseJwtPart<{
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    auth_time?: number;
    email?: string;
    email_verified?: boolean;
  }>(parts[1]);

  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported Firebase ID token signature.');
  if (payload.aud !== projectId) throw new Error('Firebase ID token audience mismatch.');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Firebase ID token issuer mismatch.');
  if (!payload.sub || payload.sub.length > 128) throw new Error('Firebase ID token subject is invalid.');

  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(payload.exp) || payload.exp <= now) throw new Error('Firebase ID token has expired.');
  if (!Number.isFinite(payload.iat) || payload.iat > now + 60) throw new Error('Firebase ID token issued-at time is invalid.');
  if (!Number.isFinite(payload.auth_time) || payload.auth_time > now + 60) throw new Error('Firebase ID token authentication time is invalid.');

  const certificates = await getFirebaseCertificates();
  let certificate = certificates[header.kid];
  if (!certificate) {
    certificateCache = null;
    const refreshedCertificates = await getFirebaseCertificates();
    certificate = refreshedCertificates[header.kid];
  }
  if (!certificate) throw new Error('Firebase ID token signing key is unknown.');

  const signingInput = `${parts[0]}.${parts[1]}`;
  const signature = base64UrlDecode(parts[2]);
  const verified = crypto.verify(
    'RSA-SHA256',
    Buffer.from(signingInput, 'utf8'),
    certificate,
    signature
  );
  if (!verified) throw new Error('Firebase ID token signature verification failed.');

  const email = String(payload.email || '').trim().toLowerCase();
  if (!email || !payload.email_verified) throw new Error('A verified Firebase email address is required.');

  return {
    uid: payload.sub,
    email,
    emailVerified: Boolean(payload.email_verified),
    authTime: Number(payload.auth_time),
    issuedAt: Number(payload.iat),
    expiresAt: Number(payload.exp),
    claims: payload as Record<string, unknown>
  };
}

