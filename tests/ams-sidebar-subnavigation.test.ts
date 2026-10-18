import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canAccessAmsRoute,
  getNavigationGroupsForRole,
  type AmsRole,
} from '../src/lib/amsNavigationAccess';
import { getAmsModuleSubnavigation, getAmsWorkspaceNavigationModule, isAmsModuleSubnavigationItemActive } from '../src/lib/amsModuleSubnavigation';

const roles: AmsRole[] = ['Admin', 'Finance', 'PM', 'Creative', 'Freelancer'];
const modules = ['dashboard', 'inbox', 'projects', 'clients', 'finance', 'team', 'documents', 'cms', 'settings', 'crm', 'tasks'] as const;

test('module navigation retains its default view even when it shares the sidebar destination', () => {
  const cases: Array<[typeof modules[number], string, string]> = [
    ['dashboard', 'Admin', 'overview'],
    ['finance', 'Admin', 'overview'],
    ['projects', 'Admin', 'all'],
    ['clients', 'Admin', 'directory'],
    ['team', 'Admin', 'team'],
    ['cms', 'Admin', 'projects'],
  ];
  for (const [moduleKey, role, key] of cases) {
    assert.ok(
      getAmsModuleSubnavigation(moduleKey, role as AmsRole).some((item) => item.key === key),
      'Missing default view: ' + role + '/' + moduleKey + '/' + key
    );
  }
  for (const role of roles) {
    for (const moduleKey of modules) {
      for (const item of getAmsModuleSubnavigation(moduleKey, role)) {
        const target = new URL(item.to, 'https://ams.kapitech.local');
        assert.equal(canAccessAmsRoute(role, target.pathname, target.search), true,
          'Inaccessible contextual destination: ' + role + '/' + moduleKey + '/' + item.key);
      }
    }
  }
});

test('contextual navigation contains only local views owned by the current module', () => {
  assert.deepEqual(getAmsModuleSubnavigation('dashboard', 'Admin').map((item) => item.key), ['overview', 'performance', 'analytics']);
  assert.deepEqual(getAmsModuleSubnavigation('inbox', 'Admin').map((item) => item.key), ['overview', 'client', 'starred']);
  assert.deepEqual(getAmsModuleSubnavigation('documents', 'Admin').map((item) => item.key), ['all', 'sops', 'legal', 'finance', 'hr', 'infra']);
  assert.deepEqual(getAmsModuleSubnavigation('crm', 'Admin'), []);
  assert.deepEqual(getAmsModuleSubnavigation('finance', 'Finance').map((item) => item.key), ['overview', 'transactions', 'receivables', 'projects', 'accounting']);
  assert.deepEqual(getAmsModuleSubnavigation('finance', 'PM').map((item) => item.key), ['projects']);
  assert.deepEqual(getAmsModuleSubnavigation('projects', 'Admin').map((item) => item.key), ['all', 'sprint', 'budget', 'archived', 'tasks']);
  assert.deepEqual(getAmsModuleSubnavigation('projects', 'Finance').map((item) => item.key), ['sprint', 'tasks']);
  assert.deepEqual(getAmsModuleSubnavigation('projects', 'Freelancer').map((item) => item.key), ['tasks']);
  assert.deepEqual(getAmsModuleSubnavigation('clients', 'Admin').map((item) => item.key), ['directory', 'onboarding', 'contracts', 'retainers', 'sla']);
  assert.deepEqual(getAmsModuleSubnavigation('team', 'Admin').map((item) => item.key), ['team', 'capacity', 'skills', 'vendors', 'time']);
  assert.deepEqual(getAmsModuleSubnavigation('team', 'PM').map((item) => item.key), ['team', 'capacity', 'time']);
  assert.deepEqual(getAmsModuleSubnavigation('team', 'Finance').map((item) => item.key), ['vendors']);
  assert.equal(getAmsModuleSubnavigation('team', 'Creative').some((item) => item.key === 'skills'), false);
  assert.equal(getAmsModuleSubnavigation('team', 'Freelancer').some((item) => item.key === 'skills'), false);
  assert.deepEqual(getAmsModuleSubnavigation('cms', 'Admin').map((item) => item.key), ['projects', 'insights', 'testimonials', 'services', 'careers']);
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'Admin').map((item) => item.key), ['backup', 'access', 'audit', 'integrations']);
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'Admin').map((item) => item.label), ['System overview', 'Access & security', 'Audit log', 'Integrations']);
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'PM'), []);
});

test('active state follows route and query for Dashboard, Projects, Clients, Team and Settings', () => {
  const inbox = getAmsModuleSubnavigation('inbox', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(inbox.find((item) => item.key === 'overview')!, '/admin/inbox'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(inbox.find((item) => item.key === 'client')!, '/admin/inbox', '?view=client'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(inbox.find((item) => item.key === 'starred')!, '/admin/inbox', '?view=starred'), true);

  const documents = getAmsModuleSubnavigation('documents', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(documents.find((item) => item.key === 'all')!, '/admin/documents'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(documents.find((item) => item.key === 'finance')!, '/admin/documents', '?documents=finance'), true);

  const dashboard = getAmsModuleSubnavigation('dashboard', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(dashboard.find((item) => item.key === 'overview')!, '/admin/dashboard'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(dashboard.find((item) => item.key === 'overview')!, '/admin/dashboard', '?view=performance'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(dashboard.find((item) => item.key === 'performance')!, '/admin/dashboard', '?view=performance'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(dashboard.find((item) => item.key === 'performance')!, '/admin/dashboard', '?view=analytics'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(dashboard.find((item) => item.key === 'analytics')!, '/admin/dashboard', '?view=analytics'), true);

  const finance = getAmsModuleSubnavigation('finance', 'Admin');
  assert.deepEqual(finance.map((item) => item.label), ['Overview & Control', 'Transactions & Cash', 'Receivables & Payables', 'Project Finance', 'Accounting & Reports']);
  assert.equal(isAmsModuleSubnavigationItemActive(finance.find((item) => item.key === 'overview')!, '/admin/finance'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(finance.find((item) => item.key === 'overview')!, '/admin/finance', '?tab=dashboard'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(finance.find((item) => item.key === 'transactions')!, '/admin/finance', '?tab=expenses'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(finance.find((item) => item.key === 'receivables')!, '/admin/finance', '?tab=quotations'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(finance.find((item) => item.key === 'receivables')!, '/admin/finance/quotations'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(finance.find((item) => item.key === 'projects')!, '/admin/finance', '?tab=project-finance'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(finance.find((item) => item.key === 'accounting')!, '/admin/finance', '?tab=monthly-closing'), true);

  const projects = getAmsModuleSubnavigation('projects', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'all')!, '/admin/projects'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'all')!, '/admin/projects', '?projects=budget'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'sprint')!, '/admin/projects', '?projects=sprint'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'sprint')!, '/admin/projects', '?projects=budget'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'budget')!, '/admin/projects', '?projects=budget'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'archived')!, '/admin/projects', '?projects=archived'), true);

  const clients = getAmsModuleSubnavigation('clients', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'directory')!, '/admin/clients/all-clients'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'directory')!, '/admin/clients/all-clients', '?scope=onboarding'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'onboarding')!, '/admin/clients/all-clients', '?scope=onboarding'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'onboarding')!, '/admin/clients/all-clients'), false);

  const team = getAmsModuleSubnavigation('team', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(team.find((item) => item.key === 'team')!, '/admin/team'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(team.find((item) => item.key === 'team')!, '/admin/team', '?view=capacity-allocation'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(team.find((item) => item.key === 'capacity')!, '/admin/team', '?view=capacity-allocation'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(team.find((item) => item.key === 'capacity')!, '/admin/team'), false);

  const cms = getAmsModuleSubnavigation('cms', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(cms.find((item) => item.key === 'projects')!, '/admin/cms/projects'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(cms.find((item) => item.key === 'careers')!, '/admin/cms/careers', '?tab=applicants'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(cms.find((item) => item.key === 'projects')!, '/admin/cms/careers', '?tab=applicants'), false);

  const settings = getAmsModuleSubnavigation('settings', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'access')!, '/admin/settings', '?tab=security'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'audit')!, '/admin/settings', '?tab=audit'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'integrations')!, '/admin/settings', '?tab=integrations'), true);
});

test('CMS default tabs and applicant-only roles match their permitted entry point', () => {
  const adminCms = getAmsModuleSubnavigation('cms', 'Admin');
  assert.equal(adminCms[0]?.key, 'projects');
  assert.equal(adminCms[0]?.label, 'Case studies');
  assert.equal(isAmsModuleSubnavigationItemActive(adminCms[0], '/admin/cms/projects'), true);

  const pmCms = getAmsModuleSubnavigation('cms', 'PM');
  assert.equal(pmCms[0]?.key, 'insights');
  const pmApplicants = pmCms.find((item) => item.key === 'careers');
  assert.equal(pmApplicants?.label, 'Applicants');
  assert.equal(pmApplicants?.to, '/admin/cms/careers?tab=applicants');
  assert.equal(isAmsModuleSubnavigationItemActive(pmApplicants!, '/admin/cms/careers', '?tab=applicants'), true);

  const financeCms = getAmsModuleSubnavigation('cms', 'Finance');
  assert.deepEqual(financeCms.map((item) => item.key), ['careers']);
  assert.equal(financeCms[0]?.label, 'Applicants');
  assert.equal(financeCms[0]?.to, '/admin/cms/careers?tab=applicants');
});

test('role-specific module entry points activate a tab that owns the destination', () => {
  const financeProjects = getAmsModuleSubnavigation('projects', 'Finance');
  assert.equal(isAmsModuleSubnavigationItemActive(financeProjects.find((item) => item.key === 'sprint')!, '/admin/projects', '?projects=sprint'), true);

  const financeTeam = getAmsModuleSubnavigation('team', 'Finance');
  assert.equal(isAmsModuleSubnavigationItemActive(financeTeam.find((item) => item.key === 'vendors')!, '/admin/vendors'), true);

  const creativeCms = getAmsModuleSubnavigation('cms', 'Creative');
  assert.equal(isAmsModuleSubnavigationItemActive(creativeCms.find((item) => item.key === 'insights')!, '/admin/cms/insights'), true);

  const creativeProjects = getAmsModuleSubnavigation('projects', 'Creative');
  assert.equal(isAmsModuleSubnavigationItemActive(creativeProjects.find((item) => item.key === 'sprint')!, '/admin/projects', '?projects=sprint'), true);
});

test('primary module clicks land on exactly one matching contextual tab across permitted roles', () => {
  const cases: Array<{
    role: AmsRole;
    primaryKey: string;
    module: typeof modules[number];
    expectedTab: string;
  }> = [
    { role: 'Admin', primaryKey: 'dashboard-hub', module: 'dashboard', expectedTab: 'overview' },
    { role: 'Finance', primaryKey: 'dashboard-hub', module: 'dashboard', expectedTab: 'overview' },
    { role: 'PM', primaryKey: 'dashboard-hub', module: 'dashboard', expectedTab: 'overview' },
    { role: 'Admin', primaryKey: 'project-hub', module: 'projects', expectedTab: 'all' },
    { role: 'Finance', primaryKey: 'project-hub', module: 'projects', expectedTab: 'sprint' },
    { role: 'Creative', primaryKey: 'project-hub', module: 'projects', expectedTab: 'sprint' },
    { role: 'Admin', primaryKey: 'clients', module: 'clients', expectedTab: 'directory' },
    { role: 'Finance', primaryKey: 'clients', module: 'clients', expectedTab: 'directory' },
    { role: 'PM', primaryKey: 'clients', module: 'clients', expectedTab: 'directory' },
    { role: 'Admin', primaryKey: 'team-resources', module: 'team', expectedTab: 'team' },
    { role: 'PM', primaryKey: 'team-resources', module: 'team', expectedTab: 'team' },
    { role: 'Finance', primaryKey: 'team-resources', module: 'team', expectedTab: 'vendors' },
    { role: 'Admin', primaryKey: 'website-cms', module: 'cms', expectedTab: 'projects' },
    { role: 'PM', primaryKey: 'website-cms', module: 'cms', expectedTab: 'insights' },
    { role: 'Creative', primaryKey: 'website-cms', module: 'cms', expectedTab: 'insights' },
  ];

  for (const item of cases) {
    const primary = getNavigationGroupsForRole(item.role)
      .flatMap((group) => group.items)
      .find((entry) => entry.key === item.primaryKey);
    assert.ok(primary, 'Missing permitted primary entry: ' + item.role + '/' + item.primaryKey);

    const destination = new URL(primary.to, 'https://ams.kapitech.local');
    const tabs = getAmsModuleSubnavigation(item.module, item.role);
    const active = tabs.filter((tab) =>
      isAmsModuleSubnavigationItemActive(tab, destination.pathname, destination.search, destination.hash)
    );

    assert.equal(active.length, 1,
      item.role + '/' + item.primaryKey + ' should activate exactly one tab at ' + primary.to);
    assert.equal(active[0].key, item.expectedTab,
      item.role + '/' + item.primaryKey + ' should activate ' + item.expectedTab + ' at ' + primary.to);
  }
});

test('MFA setup preserves exceptional Access without exposing Settings to non-admin navigation', () => {
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'Freelancer', true).map((item) => item.key), ['access']);
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'PM'), []);
});


test('topbar context follows the owning workspace and keeps personal My Hub separate from Projects', () => {
  assert.equal(getAmsWorkspaceNavigationModule('/admin/dashboard'), 'dashboard');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/finance', '?tab=accounts-receivable'), 'finance');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/tasks'), 'projects');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/tasks', '?taskscope=my'), null);
  assert.equal(getAmsWorkspaceNavigationModule('/admin/tasks', '?taskscope=my&workspace=project'), 'projects');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/cms/careers', '?tab=applicants'), 'cms');
});
