import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('API client preserves HTTP 409 readiness payloads', async () => {
  const source = await fs.readFile(path.join(root, 'src/lib/apiClient.ts'), 'utf8');
  assert.ok(source.includes('data: json as T'));
  assert.ok(source.includes('productionReadiness: () => apiRequest'));
  assert.ok(source.includes('/api/system/production-readiness'));
});

test('Admin Settings exposes the production readiness card', async () => {
  const source = await fs.readFile(path.join(root, 'src/pages/admin/AdminSettings.tsx'), 'utf8');
  assert.ok(source.includes('ProductionReadinessCard'));
  assert.ok(source.includes('Provider-managed backup'));
  assert.ok(source.includes("res.data.retention ?? res.data.retentionDays ?? 14"));
  const component = await fs.readFile(path.join(root, 'src/components/admin/ProductionReadinessCard.tsx'), 'utf8');
  for (const gate of ['Runtime', 'Encryption', 'PostgreSQL', 'Migrations', 'MFA', 'Backup / DR', 'Documents', 'Notifications']) assert.ok(component.includes(gate));
});

test('JSON production readiness explicitly includes notifications as blocked', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  assert.ok(source.includes('notifications: false'));
});