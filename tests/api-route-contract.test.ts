import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('API route contract protects state-changing and private routes', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  const routePattern = /apiRouter\.(get|post|put|patch|delete)\(\s*(['\"])([^'\"]+)\2,([^\n]*)/g;
  const publicRoutes = new Set([
    'POST /auth/login',
    'POST /auth/firebase-login',
    'POST /auth/mfa/verify',
    'POST /leads/submit',
    'POST /leads/resume-upload',
    'GET /cms/services',
    'GET /cms/projects',
    'GET /cms/testimonials',
    'GET /cms/public-settings',
    'GET /cms/insights',
    'GET /cms/insights/sitemap.xml',
    'GET /cms/insights/:slug',
    'GET /cms/insight-categories',
    'GET /cms/insight-authors',
    'GET /cms/insight-tags'
  ]);
  const routes: Array<{ method: string; path: string; tail: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = routePattern.exec(source))) routes.push({ method: match[1].toUpperCase(), path: match[3], tail: match[4] });
  assert.ok(routes.length >= 80, 'Expected the full AMS API surface to be present.');
  for (const route of routes) {
    const key = `${route.method} ${route.path}`;
    if (publicRoutes.has(key)) continue;
    assert.match(route.tail, /requireAuth|requireMaster|requirePermission|requireAnyPermission|documentAccessMiddleware|documentMutationMiddleware|backupAccessMiddleware/,
      `Private route is missing an authentication/authorization guard: ${key}`);
  }
  for (const route of routes.filter(item => ['POST','PUT','PATCH','DELETE'].includes(item.method))) {
    const key = `${route.method} ${route.path}`;
    if (publicRoutes.has(key)) continue;
    assert.match(route.tail, /requireAuth|requireMaster|requirePermission|requireAnyPermission|documentMutationMiddleware|backupAccessMiddleware/,
      `State-changing route is missing an authentication guard: ${key}`);
  }
});

test('Dashboard API endpoints match the frontend API client contract', async () => {
  const serverParts = await Promise.all([
    fs.readFile(path.join(root, 'server/routes.ts'), 'utf8'),
    fs.readFile(path.join(root, 'server/insight-routes.ts'), 'utf8')
  ]);
  const server = serverParts.join('\n');
  const client = await fs.readFile(path.join(root, 'src/lib/apiClient.ts'), 'utf8');
  assert.ok(server.includes("apiRouter.get('/dashboard/overview', requireAuth, handleOverview);"));
  assert.ok(server.includes("apiRouter.get('/executive/overview', requireAuth, handleOverview);"));
  assert.ok(client.includes("'/api/dashboard/overview'")); assert.ok(client.includes("'/api/executive/overview'"));
});

test('Frontend API client literal endpoints exist on the server route surface', async () => {
  const serverParts = await Promise.all([
    fs.readFile(path.join(root, 'server/routes.ts'), 'utf8'),
    fs.readFile(path.join(root, 'server/insight-routes.ts'), 'utf8')
  ]);
  const server = serverParts.join('\n');
  const client = await fs.readFile(path.join(root, 'src/lib/apiClient.ts'), 'utf8');

  const routePattern = /apiRouter\.(?:get|post|put|patch|delete)\(\s*(['`])([^'`]+)\1/g;
  const serverPaths = new Set<string>();
  let routeMatch: RegExpExecArray | null;
  while ((routeMatch = routePattern.exec(server))) serverPaths.add(routeMatch[2].replace(/\/+$/, ''));

  const endpointPattern = /apiRequest(?:<[^>]*>)?\(\s*(['`])(\/api\/[^'`?]+)(?:\?[^'`]*)?\1/g;
  const clientPaths = new Set<string>();
  let endpointMatch: RegExpExecArray | null;
  while ((endpointMatch = endpointPattern.exec(client))) clientPaths.add(endpointMatch[2].replace(/^\/api/, '').replace(/\/+$/, ''));

  assert.ok(clientPaths.size >= 20, 'Expected a broad frontend API contract surface.');
  for (const clientPath of clientPaths) {
    const normalized = clientPath.replace(/:\w+/g, ':id').replace(/\$\{[^}]+\}/g, ':id');
    const exists = [...serverPaths].some(serverPath => serverPath.replace(/:\w+/g, ':id') === normalized);
    assert.ok(exists, 'Frontend API endpoint is not implemented by server routes: ' + clientPath);
  }
});
test('Public CMS endpoints require explicit publication state', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  assert.match(source, /services = canManage \? source : source\.filter\(\(item: any\) => item\.isPublished === true\)/);
  assert.match(source, /projects = canManage \? source : source\.filter\(\(item: any\) => item\.isPublished === true\)/);
  assert.match(source, /testimonials = canManage \? source : source\.filter\(\(item: any\) => item\.isPublished === true\)/);
});
test('Lead-to-client conversion is permission-checked, transactional, and idempotent', async () => {
  const routes = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  const repository = await fs.readFile(path.join(root, 'server/postgres-lead-repository.ts'), 'utf8');
  const apiClient = await fs.readFile(path.join(root, 'src/lib/apiClient.ts'), 'utf8');
  const inbox = await fs.readFile(path.join(root, 'src/pages/admin/AdminInbox.tsx'), 'utf8');
  assert.match(routes, /apiRouter\.post\('\/leads\/:id\/convert-to-client', requireAuth, requirePermission\('canManageClients'\)/);
  assert.match(routes, /Only client inquiries can be converted to clients/);
  assert.match(repository, /SELECT \* FROM leads WHERE id = \$1 FOR UPDATE/);
  assert.match(repository, /pg_advisory_xact_lock/);
  assert.match(repository, /convertedClientId/);
  assert.match(repository, /appendWithinTransaction/);
  assert.match(apiClient, /\/leads\/\$\{id\}\/convert-to-client/);
  assert.match(inbox, /handleConvertToClient/);
});
