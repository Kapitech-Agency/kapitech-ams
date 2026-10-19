import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Protected admin auth is server-session authoritative', async () => {
  const guard = await fs.readFile(path.join(root, 'src/components/admin/RequireAdminAuth.tsx'), 'utf8');
  const auth = await fs.readFile(path.join(root, 'src/lib/adminAuth.ts'), 'utf8');

  assert.ok(guard.includes('api.auth.me()'));
  assert.ok(guard.includes('cacheAdminSession(res.data.user, rememberMe)'));
  assert.ok(auth.includes('(rememberMe ? localStorage : sessionStorage).setItem(ADMIN_PROFILE_KEY, serialized)'));
  assert.ok(auth.includes('const raw = sessionStorage.getItem(ADMIN_PROFILE_KEY) || localStorage.getItem(ADMIN_PROFILE_KEY)'));
  assert.ok(auth.includes('HttpOnly'));
  assert.ok(!auth.includes("localStorage.setItem('kapitech_session_token'"));
  assert.ok(!auth.includes("localStorage.setItem('kapitech_admin_session_v1'"));
});

test('Admin logout clears legacy client-side authentication artifacts', async () => {
  const auth = await fs.readFile(path.join(root, 'src/lib/adminAuth.ts'), 'utf8');
  assert.ok(auth.includes("sessionStorage.removeItem(ADMIN_PROFILE_KEY)"));
  assert.ok(auth.includes("localStorage.removeItem('kapitech_session_token')"));
  assert.ok(auth.includes("sessionStorage.removeItem('kapitech_session_token')"));
  assert.ok(auth.includes("localStorage.removeItem('kapitech_admin_session_v1')"));
  assert.ok(auth.includes("sessionStorage.removeItem('kapitech_admin_session_v1')"));
});
