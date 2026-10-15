import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessWorkspaceRoute,
  getWorkspaceAccessMode,
  normalizeWorkspaceRole,
  WORKSPACE_ROUTE_POLICIES,
  WorkspaceRole,
  WorkspaceRouteKey,
} from '../src/workspace/workspaceAccess';

const allRoutes = Object.keys(WORKSPACE_ROUTE_POLICIES) as WorkspaceRouteKey[];

test('role normalization accepts the five explicit workspace roles and fails closed for unknown roles', () => {
  const expected: WorkspaceRole[] = ['Admin', 'Finance', 'PM', 'Creative', 'Freelancer'];
  for (const role of expected) assert.equal(normalizeWorkspaceRole(role), role);
  assert.equal(normalizeWorkspaceRole('Tier 2: Project Manager (PM)'), 'PM');
  assert.equal(normalizeWorkspaceRole('Master Administrator'), 'Admin');
  assert.equal(normalizeWorkspaceRole('Unmapped Department'), null);
  assert.equal(normalizeWorkspaceRole(null), null);
});

test('Admin has access to every workspace route', () => {
  for (const route of allRoutes) assert.equal(canAccessWorkspaceRoute('Admin', route), true, route);
});

test('Finance receives dashboard, full CRM and the financial hub but no project, CMS or system access', () => {
  const allowed: WorkspaceRouteKey[] = [
    'executive-overview', 'personal-workspace', 'activity-stream',
    'sales-pipeline', 'client-directory', 'client-onboarding',
    'quotation-builder', 'invoice-ledger', 'expense-ledger', 'project-profitability',
  ];
  const denied: WorkspaceRouteKey[] = [
    'project-hub', 'task-engine', 'retainer-manager', 'cms-editorial', 'system-settings',
  ];
  for (const route of allowed) assert.equal(canAccessWorkspaceRoute('Finance', route), true, route);
  for (const route of denied) assert.equal(canAccessWorkspaceRoute('Finance', route), false, route);
});

test('PM can access project delivery and only the aggregated profitability view', () => {
  const allowed: WorkspaceRouteKey[] = [
    'executive-overview', 'personal-workspace', 'activity-stream',
    'sales-pipeline', 'client-directory', 'client-onboarding',
    'project-hub', 'task-engine', 'retainer-manager', 'project-profitability', 'cms-editorial',
  ];
  const denied: WorkspaceRouteKey[] = [
    'quotation-builder', 'invoice-ledger', 'expense-ledger', 'system-settings',
  ];
  for (const route of allowed) assert.equal(canAccessWorkspaceRoute('PM', route), true, route);
  for (const route of denied) assert.equal(canAccessWorkspaceRoute('PM', route), false, route);
  assert.equal(getWorkspaceAccessMode('PM', 'sales-pipeline'), 'read-only');
  assert.equal(getWorkspaceAccessMode('PM', 'project-profitability'), 'aggregate');
});

test('Creative is restricted to personal work, member project views and CMS editor', () => {
  const allowed: WorkspaceRouteKey[] = ['personal-workspace', 'activity-stream', 'project-hub', 'task-engine', 'cms-editorial'];
  for (const route of allowed) assert.equal(canAccessWorkspaceRoute('Creative', route), true, route);
  for (const route of allRoutes.filter((route) => !allowed.includes(route))) {
    assert.equal(canAccessWorkspaceRoute('Creative', route), false, route);
  }
  assert.equal(getWorkspaceAccessMode('Creative', 'project-hub'), 'member');
  assert.equal(getWorkspaceAccessMode('Creative', 'cms-editorial'), 'editor');
});

test('Freelancer receives only personal work and assigned task/project views', () => {
  const allowed: WorkspaceRouteKey[] = ['personal-workspace', 'activity-stream', 'project-hub', 'task-engine'];
  for (const route of allowed) assert.equal(canAccessWorkspaceRoute('Freelancer', route), true, route);
  for (const route of allRoutes.filter((route) => !allowed.includes(route))) {
    assert.equal(canAccessWorkspaceRoute('Freelancer', route), false, route);
  }
  assert.equal(getWorkspaceAccessMode('Freelancer', 'project-hub'), 'assigned');
  assert.equal(getWorkspaceAccessMode('Freelancer', 'task-engine'), 'assigned');
});

test('unrecognized roles cannot access guarded routes', () => {
  for (const route of allRoutes) assert.equal(canAccessWorkspaceRoute(null, route), false, route);
});
