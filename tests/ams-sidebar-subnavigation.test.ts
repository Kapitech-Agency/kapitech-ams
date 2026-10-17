import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AMS_PRIMARY_SETTINGS_ITEM,
  canAccessAmsRoute,
  getAmsNavigationDestinationSignature,
  getAmsSidebarDestinationSignatures,
  getNavigationGroupsForRole,
  type AmsRole,
} from '../src/lib/amsNavigationAccess';
import { getAmsModuleSubnavigation, isAmsModuleSubnavigationItemActive } from '../src/lib/amsModuleSubnavigation';

const roles: AmsRole[] = ['Admin', 'Finance', 'PM', 'Creative', 'Freelancer'];
const modules = ['dashboard', 'projects', 'finance', 'clients', 'team', 'cms', 'settings', 'tasks'] as const;

test('global and contextual navigation do not own the same role-visible destination', () => {
  for (const role of roles) {
    const sidebarItems = getNavigationGroupsForRole(role).flatMap((group) => group.items);
    if (AMS_PRIMARY_SETTINGS_ITEM.allowedRoles.includes(role)) {
      const target = new URL(AMS_PRIMARY_SETTINGS_ITEM.to, 'https://ams.kapitech.local');
      if (canAccessAmsRoute(role, target.pathname, target.search)) sidebarItems.push(AMS_PRIMARY_SETTINGS_ITEM);
    }
    const signatures = new Set(sidebarItems.map((item) => getAmsNavigationDestinationSignature(item.to)));
    for (const moduleKey of modules) {
      for (const item of getAmsModuleSubnavigation(moduleKey, role)) {
        assert.equal(signatures.has(getAmsNavigationDestinationSignature(item.to)), false,
          'Duplicate destination: ' + role + '/' + moduleKey + '/' + item.key + ' (' + item.to + ')');
      }
    }
  }
});

test('contextual navigation contains only local views owned by the current module', () => {
  assert.deepEqual(getAmsModuleSubnavigation('dashboard', 'Admin').map((item) => item.key), ['performance', 'analytics']);
  assert.deepEqual(getAmsModuleSubnavigation('crm', 'Admin'), []);
  assert.deepEqual(getAmsModuleSubnavigation('finance', 'Finance'), []);
  assert.deepEqual(getAmsModuleSubnavigation('projects', 'Admin').map((item) => item.key), ['sprint', 'budget', 'archived', 'tasks']);
  assert.deepEqual(getAmsModuleSubnavigation('projects', 'Finance').map((item) => item.key), ['tasks']);
  assert.deepEqual(getAmsModuleSubnavigation('projects', 'Freelancer'), []);
  assert.deepEqual(getAmsModuleSubnavigation('clients', 'Admin').map((item) => item.key), ['onboarding', 'contracts', 'retainers', 'sla']);
  assert.deepEqual(getAmsModuleSubnavigation('team', 'Admin').map((item) => item.key), ['capacity', 'skills', 'vendors', 'time']);
  assert.deepEqual(getAmsModuleSubnavigation('team', 'PM').map((item) => item.key), ['capacity', 'time']);
  assert.deepEqual(getAmsModuleSubnavigation('team', 'Finance'), []);
  assert.equal(getAmsModuleSubnavigation('team', 'Creative').some((item) => item.key === 'skills'), false);
  assert.equal(getAmsModuleSubnavigation('team', 'Freelancer').some((item) => item.key === 'skills'), false);
  assert.deepEqual(getAmsModuleSubnavigation('cms', 'Admin').map((item) => item.key), ['insights', 'testimonials', 'services', 'careers']);
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'Admin').map((item) => item.key), ['access', 'audit', 'integrations']);
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'PM'), []);
});

test('active state follows route and query for Dashboard, Projects, Clients, Team and Settings', () => {
  const dashboard = getAmsModuleSubnavigation('dashboard', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(dashboard.find((item) => item.key === 'performance')!, '/admin/dashboard', '?view=performance'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(dashboard.find((item) => item.key === 'performance')!, '/admin/dashboard', '?view=analytics'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(dashboard.find((item) => item.key === 'analytics')!, '/admin/dashboard', '?view=analytics'), true);

  const projects = getAmsModuleSubnavigation('projects', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'sprint')!, '/admin/projects', '?projects=sprint'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'sprint')!, '/admin/projects', '?projects=budget'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'budget')!, '/admin/projects', '?projects=budget'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'archived')!, '/admin/projects', '?projects=archived'), true);

  const clients = getAmsModuleSubnavigation('clients', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'onboarding')!, '/admin/clients/all-clients', '?scope=onboarding'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'onboarding')!, '/admin/clients/all-clients'), false);

  const team = getAmsModuleSubnavigation('team', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(team.find((item) => item.key === 'capacity')!, '/admin/team', '?view=capacity-allocation'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(team.find((item) => item.key === 'capacity')!, '/admin/team'), false);

  const settings = getAmsModuleSubnavigation('settings', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'access')!, '/admin/settings', '?tab=security'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'audit')!, '/admin/settings', '?tab=audit'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'integrations')!, '/admin/settings', '?tab=integrations'), true);
});

test('MFA setup preserves exceptional Access without exposing Settings to non-admin navigation', () => {
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'Freelancer', true).map((item) => item.key), ['access']);
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'PM'), []);
});
