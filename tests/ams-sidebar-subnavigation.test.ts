import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAmsModuleSubnavigation,
  isAmsModuleSubnavigationItemActive,
} from '../src/lib/amsModuleSubnavigation';

test('in-workspace tabs retain every destination permitted by each role', () => {
  assert.deepEqual(
    getAmsModuleSubnavigation('dashboard', 'Admin').map((item) => item.key),
    ['overview', 'performance', 'analytics', 'my-hub', 'activity']
  );
  assert.deepEqual(
    getAmsModuleSubnavigation('crm', 'Finance').map((item) => item.key),
    ['pipeline', 'clients', 'onboarding', 'inbox', 'contracts', 'sla']
  );
  assert.deepEqual(
    getAmsModuleSubnavigation('finance', 'Finance').map((item) => item.key),
    ['invoicing-revenues', 'profitability-expenses', 'project-profitability', 'quotes', 'vendors', 'approvals']
  );
  assert.deepEqual(
    getAmsModuleSubnavigation('finance', 'PM').map((item) => item.key),
    ['project-profitability']
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
  assert.deepEqual(
    getAmsModuleSubnavigation('projects', 'Freelancer').map((item) => item.key),
    ['tasks']
  );
});

test('Finance area activation stays coherent across all workbook worksheets', () => {
  const finance = getAmsModuleSubnavigation('finance', 'Finance');
  const isFinanceActive = (key: string, search: string) =>
    isAmsModuleSubnavigationItemActive(finance.find((item) => item.key === key)!, '/admin/finance', search);

  assert.equal(isFinanceActive('invoicing-revenues', ''), true);
  assert.equal(isFinanceActive('invoicing-revenues', '?tab=executive-summary'), true);
  assert.equal(isFinanceActive('invoicing-revenues', '?tab=cash-bank'), true);
  assert.equal(isFinanceActive('invoicing-revenues', '?tab=accounts-receivable'), true);
  assert.equal(isFinanceActive('invoicing-revenues', '?tab=accounts-payable'), false);
  assert.equal(isFinanceActive('profitability-expenses', '?tab=accounts-payable'), true);
  assert.equal(isFinanceActive('profitability-expenses', '?tab=journal'), true);
  assert.equal(isFinanceActive('profitability-expenses', '?tab=monthly-pnl'), true);
  assert.equal(isFinanceActive('profitability-expenses', '?tab=project-finance'), false);
  assert.equal(isFinanceActive('project-profitability', '?tab=project-finance'), true);
  assert.equal(isFinanceActive('project-profitability', '?tab=operational-budget'), true);
  assert.equal(isFinanceActive('project-profitability', '?tab=accounts-payable'), false);
});

test('project, CRM, and Settings tabs account for query parameters and hashes', () => {
  const projects = getAmsModuleSubnavigation('projects', 'Admin');
  const byProjectKey = (key: string) => projects.find((item) => item.key === key)!;
  assert.equal(isAmsModuleSubnavigationItemActive(byProjectKey('all'), '/admin/projects', ''), true);
  assert.equal(isAmsModuleSubnavigationItemActive(byProjectKey('all'), '/admin/projects', '?projects=sprint'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(byProjectKey('sprint'), '/admin/projects', '?projects=sprint'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(byProjectKey('budget'), '/admin/projects', '?projects=budget'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(byProjectKey('capacity'), '/admin/team', '?view=capacity-allocation'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(byProjectKey('team'), '/admin/team', '?view=capacity-allocation'), false);

  const crm = getAmsModuleSubnavigation('crm', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(crm.find((item) => item.key === 'clients')!, '/admin/clients/all-clients', '', ''), true);
  assert.equal(isAmsModuleSubnavigationItemActive(crm.find((item) => item.key === 'onboarding')!, '/admin/clients/all-clients', '', '#client-onboarding-readiness'), true);

  const settings = getAmsModuleSubnavigation('settings', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'backup')!, '/admin/settings', '?tab=overview'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'access')!, '/admin/settings', '?tab=security'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'audit')!, '/admin/settings', '?tab=audit'), true);
});

test('users who have not enrolled in MFA retain an Access destination without gaining Settings permissions', () => {
  assert.deepEqual(
    getAmsModuleSubnavigation('settings', 'Freelancer', true).map((item) => item.key),
    ['access']
  );
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'PM'), []);
});
