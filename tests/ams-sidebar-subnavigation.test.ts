import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAmsModuleSubnavigation,
  isAmsModuleSubnavigationItemActive,
} from '../src/lib/amsModuleSubnavigation';

test('module dropdowns retain all destinations permitted for each role', () => {
  assert.deepEqual(
    getAmsModuleSubnavigation('dashboard', 'Admin').map((item) => item.key),
    ['overview', 'performance', 'analytics', 'my-hub', 'activity']
  );
  assert.deepEqual(
    getAmsModuleSubnavigation('crm', 'Finance').map((item) => item.key),
    ['pipeline', 'clients', 'onboarding', 'inbox', 'contracts', 'sla']
  );
  assert.deepEqual(
    getAmsModuleSubnavigation('finance', 'PM').map((item) => item.key),
    ['projects']
  );
  assert.deepEqual(
    getAmsModuleSubnavigation('projects', 'Finance').map((item) => item.key),
    ['sprint', 'tasks']
  );
  assert.deepEqual(
    getAmsModuleSubnavigation('cms', 'Creative').map((item) => item.key),
    ['insights', 'projects', 'testimonials']
  );
  assert.deepEqual(
    getAmsModuleSubnavigation('settings', 'Admin').map((item) => item.key),
    ['backup', 'access', 'audit', 'integrations', 'readiness']
  );
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'PM'), []);
  assert.deepEqual(getAmsModuleSubnavigation('projects', 'Freelancer'), []);
});

test('query-based submenu active state highlights only the selected destination', () => {
  const finance = getAmsModuleSubnavigation('finance', 'Finance');
  const isFinanceActive = (key: string, search: string) =>
    isAmsModuleSubnavigationItemActive(finance.find((item) => item.key === key)!, '/admin/finance', search);

  assert.equal(isFinanceActive('overview', ''), true);
  assert.equal(isFinanceActive('overview', '?tab=executive-summary'), true);
  assert.equal(isFinanceActive('overview', '?tab=cash-bank'), false);
  assert.equal(isFinanceActive('transactions', '?tab=cash-bank'), true);
  assert.equal(isFinanceActive('receivables', '?tab=accounts-receivable'), true);
  assert.equal(isFinanceActive('projects', '?tab=project-finance'), true);
  assert.equal(isFinanceActive('accounting', '?tab=journal'), true);
});

test('project and settings submenu states account for query parameters and hashes', () => {
  const projects = getAmsModuleSubnavigation('projects', 'Admin');
  const byProjectKey = (key: string) => projects.find((item) => item.key === key)!;
  assert.equal(isAmsModuleSubnavigationItemActive(byProjectKey('all'), '/admin/projects', ''), true);
  assert.equal(isAmsModuleSubnavigationItemActive(byProjectKey('all'), '/admin/projects', '?projects=sprint'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(byProjectKey('sprint'), '/admin/projects', '?projects=sprint'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(byProjectKey('capacity'), '/admin/team', '?view=capacity-allocation'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(byProjectKey('team'), '/admin/team', '?view=capacity-allocation'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(byProjectKey('tasks'), '/admin/dashboard', '?view=tasks'), true);

  const crm = getAmsModuleSubnavigation('crm', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(crm.find((item) => item.key === 'clients')!, '/admin/clients/all-clients', '', ''), true);
  assert.equal(isAmsModuleSubnavigationItemActive(crm.find((item) => item.key === 'onboarding')!, '/admin/clients/all-clients', '', '#client-onboarding-readiness'), true);

  const settings = getAmsModuleSubnavigation('settings', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'backup')!, '/admin/settings', '?tab=overview'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'access')!, '/admin/settings', '?tab=security'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'audit')!, '/admin/settings', '?tab=audit'), true);
});
