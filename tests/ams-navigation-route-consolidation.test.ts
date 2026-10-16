import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  AMS_NAVIGATION_GROUPS,
  AMS_PRIMARY_SETTINGS_ITEM,
  canAccessAmsRoute,
  getAmsNavigationDestinationSignature,
  getNavigationGroupsForRole,
  getPrimaryNavigationForRole,
} from '../src/lib/amsNavigationAccess';
import { getAmsModuleSubnavigation } from '../src/lib/amsModuleSubnavigation';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');
const roles = ['Admin', 'Finance', 'PM', 'Creative', 'Freelancer'] as const;
const contextualModules = ['dashboard', 'crm', 'projects', 'finance', 'clients', 'team', 'cms', 'settings', 'tasks'] as const;

test('every role-visible primary and contextual destination passes the same route access policy', () => {
  for (const role of roles) {
    const primary = getNavigationGroupsForRole(role).flatMap((group) => group.items);
    if (AMS_PRIMARY_SETTINGS_ITEM.allowedRoles.includes(role)) {
      primary.push(AMS_PRIMARY_SETTINGS_ITEM);
    }

    const destinations = primary.map((item) => getAmsNavigationDestinationSignature(item.to));
    assert.equal(new Set(destinations).size, destinations.length, role + ' primary navigation contains duplicate destinations');

    for (const item of primary) {
      const target = new URL(item.to, 'https://ams.kapitech.local');
      assert.equal(
        canAccessAmsRoute(role, target.pathname, target.search),
        true,
        role + ' sees a destination denied by the route policy: ' + item.to,
      );
    }

    for (const moduleKey of contextualModules) {
      for (const item of getAmsModuleSubnavigation(moduleKey, role)) {
        const target = new URL(item.to, 'https://ams.kapitech.local');
        assert.equal(
          canAccessAmsRoute(role, target.pathname, target.search),
          true,
          role + '/' + moduleKey + ' sees a contextual destination denied by the route policy: ' + item.to,
        );
      }
    }
  }
});

test('consolidated aliases keep their canonical module owner and preserve useful URL state', async () => {
  const app = await read('src/App.tsx');
  const layout = await read('src/pages/admin/AdminLayout.tsx');

  assert.ok(app.includes('<Route path="/crm" element={<Navigate to="/admin/clients/all-clients" replace />} />'));
  assert.ok(app.includes('<Route path="crm" element={<Navigate to="/admin/clients/all-clients" replace />} />'));
  assert.ok(app.includes('<Route path="clients/lead-accounts" element={<Navigate to="/admin/clients/all-clients" replace />} />'));
  assert.ok(app.includes('<Route path="proposals" element={<LegacyQuotationRedirect />} />'));
  assert.ok(app.includes("pathname: '/admin/finance/quotations', search: location.search, hash: location.hash"));
  assert.ok(app.includes("if (query.get('view') === 'jobs')"));
  assert.ok(app.includes("pathname: '/admin/cms/careers', search: '?tab=applicants'"));
  assert.ok(app.includes('<Route path="finance/quotations" element={<ModuleRoute moduleKey="invoicing" moduleLabel="quotations"><AdminInvoicing embeddedView="quotations" /></ModuleRoute>} />'));

  assert.match(layout, /path === '\/admin\/clients' \|\| path\.startsWith\('\/admin\/clients\/'\) \|\| path === '\/admin\/contracts'\) return 'clients'/);
  assert.match(layout, /path === '\/admin\/team' \|\| path === '\/admin\/time-logs' \|\| path === '\/admin\/vendors'\) return 'team'/);
  assert.match(layout, /if \(path\.startsWith\('\/admin\/cms\/'\)\) return 'cms'/);
});

test('legacy routes remain protected and role-scoped while removed modules stay out of navigation', async () => {
  const labels = getPrimaryNavigationForRole('Admin').map((item) => item.label);
  assert.deepEqual(labels, [
    'Dashboard', 'Inbox', 'Projects', 'Clients', 'Finance', 'Team & Resources', 'Documents', 'Website CMS',
  ]);
  assert.equal(labels.length + 1, 9);
  assert.deepEqual(AMS_NAVIGATION_GROUPS.map((group) => group.label), ['WORKSPACE', 'DELIVERY', 'OPERATIONS', 'PUBLISHING']);
  assert.doesNotMatch(labels.join('|'), /CRM|Proposal|Approval/i);

  for (const role of roles) {
    assert.equal(canAccessAmsRoute(role, '/admin/approvals'), role === 'Admin' || role === 'Finance');
    assert.equal(canAccessAmsRoute(role, '/admin/proposals'), role === 'Admin' || role === 'Finance');
    assert.equal(
      canAccessAmsRoute(role, '/admin/cms/careers', '?tab=applicants'),
      role === 'Admin' || role === 'Finance' || role === 'PM',
    );
    assert.equal(canAccessAmsRoute(role, '/admin/cms/careers'), role === 'Admin');
    assert.equal(canAccessAmsRoute(role, '/admin/finance/quotations'), role === 'Admin' || role === 'Finance');
  }

  const app = await read('src/App.tsx');
  assert.ok(app.includes('<Route path="approvals" element={<ModuleRoute moduleKey="approvals" moduleLabel="Approvals"><AdminApprovals /></ModuleRoute>} />'));
  assert.ok(app.includes('const AdminApprovals = lazyWithRetry('));
});
