import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AMS_PRIMARY_SETTINGS_ITEM,
  canAccessAmsRoute,
  getNavigationGroupsForRole,
  type AmsRole,
} from '../src/lib/amsNavigationAccess';
import {
  getAmsModuleSubnavigation,
  isAmsModuleSubnavigationItemActive,
} from '../src/lib/amsModuleSubnavigation';

const roles: AmsRole[] = ['Admin', 'Finance', 'PM', 'Creative', 'Freelancer'];
const modules = ['dashboard', 'crm', 'projects', 'finance', 'cms', 'settings', 'tasks'] as const;

function destinationSignature(to: string): string {
  const target = new URL(to, 'https://ams.kapitech.local');
  const pathname = target.pathname.replace(/\/+$/, '') || '/';
  const query = [...target.searchParams.entries()]
    .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue)
    )
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `${pathname}${query ? `?${query}` : ''}${target.hash}`;
}

test('global sidebar and contextual module navigation never own the same destination', () => {
  for (const role of roles) {
    const sidebarItems = getNavigationGroupsForRole(role).flatMap((group) => group.items);
    if (
      AMS_PRIMARY_SETTINGS_ITEM.allowedRoles.includes(role)
      && canAccessAmsRoute(
        role,
        new URL(AMS_PRIMARY_SETTINGS_ITEM.to, 'https://ams.kapitech.local').pathname,
        new URL(AMS_PRIMARY_SETTINGS_ITEM.to, 'https://ams.kapitech.local').search
      )
    ) sidebarItems.push(AMS_PRIMARY_SETTINGS_ITEM);

    const sidebarDestinations = new Set(sidebarItems.map((item) => destinationSignature(item.to)));

    for (const moduleKey of modules) {
      for (const item of getAmsModuleSubnavigation(moduleKey, role)) {
        assert.equal(
          sidebarDestinations.has(destinationSignature(item.to)),
          false,
          `Duplicate destination for role=${role}, module=${moduleKey}, item=${item.key}: ${item.to}`
        );
      }
    }
  }
});

test('contextual navigation keeps only role-permitted local views not exposed in the sidebar', () => {
  assert.deepEqual(
    getAmsModuleSubnavigation('dashboard', 'Admin').map((item) => item.key),
    ['performance', 'analytics', 'activity']
  );
  assert.deepEqual(getAmsModuleSubnavigation('crm', 'Admin'), []);
  assert.deepEqual(getAmsModuleSubnavigation('crm', 'Finance'), []);
  assert.deepEqual(getAmsModuleSubnavigation('finance', 'Finance'), []);
  assert.deepEqual(getAmsModuleSubnavigation('finance', 'PM'), []);
  assert.deepEqual(
    getAmsModuleSubnavigation('projects', 'Admin').map((item) => item.key),
    ['sprint', 'budget', 'archived']
  );
  assert.deepEqual(getAmsModuleSubnavigation('projects', 'Finance'), []);
  assert.deepEqual(getAmsModuleSubnavigation('projects', 'Creative'), []);
  assert.deepEqual(getAmsModuleSubnavigation('projects', 'Freelancer'), []);
  assert.deepEqual(getAmsModuleSubnavigation('cms', 'Admin'), []);
  assert.deepEqual(getAmsModuleSubnavigation('cms', 'Creative'), []);
  assert.deepEqual(
    getAmsModuleSubnavigation('settings', 'Admin').map((item) => item.key),
    ['access', 'audit', 'integrations', 'readiness']
  );
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'PM'), []);
});

test('contextual active states remain exact for dashboard views, project views, and unique settings routes', () => {
  const dashboard = getAmsModuleSubnavigation('dashboard', 'Admin');
  const dashboardItem = (key: string) => dashboard.find((item) => item.key === key)!;
  assert.equal(isAmsModuleSubnavigationItemActive(dashboardItem('performance'), '/admin/dashboard', '?view=performance'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(dashboardItem('performance'), '/admin/dashboard', '?view=analytics'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(dashboardItem('analytics'), '/admin/dashboard', '?view=analytics'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(dashboardItem('activity'), '/admin/navigation/live-activity'), true);

  const projects = getAmsModuleSubnavigation('projects', 'Admin');
  const projectItem = (key: string) => projects.find((item) => item.key === key)!;
  assert.equal(isAmsModuleSubnavigationItemActive(projectItem('sprint'), '/admin/projects', '?projects=sprint'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(projectItem('sprint'), '/admin/projects', '?projects=budget'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(projectItem('budget'), '/admin/projects', '?projects=budget'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(projectItem('archived'), '/admin/projects', '?projects=archived'), true);

  const settings = getAmsModuleSubnavigation('settings', 'Admin');
  const settingsItem = (key: string) => settings.find((item) => item.key === key)!;
  assert.equal(isAmsModuleSubnavigationItemActive(settingsItem('access'), '/admin/settings', '?tab=security'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settingsItem('audit'), '/admin/settings', '?tab=audit'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settingsItem('integrations'), '/admin/settings', '?tab=integrations'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settingsItem('readiness'), '/admin/navigation/release-readiness'), true);
});

test('MFA setup keeps its exceptional Access route without exposing the Settings module to non-admins', () => {
  assert.deepEqual(
    getAmsModuleSubnavigation('settings', 'Freelancer', true).map((item) => item.key),
    ['access']
  );
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'PM'), []);
});
