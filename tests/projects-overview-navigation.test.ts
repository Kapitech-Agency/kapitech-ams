import assert from 'node:assert/strict';
import test from 'node:test';
import { getProjectsDefaultView } from '../src/lib/projectsWorkspaceNavigation';
import { getAmsModuleSubnavigation, isAmsModuleSubnavigationItemActive } from '../src/lib/amsModuleSubnavigation';
import { getNavigationGroupsForRole } from '../src/lib/amsNavigationAccess';

test('Projects module entry defaults to Overview and preserves legacy record/layout deep links', () => {
  assert.equal(getProjectsDefaultView(new URLSearchParams()), 'overview');
  assert.equal(getProjectsDefaultView(new URLSearchParams('create=1')), 'overview');
  for (const query of ['project=record-slug', 'layout=table', 'layout=timeline&project=record-slug']) {
    assert.equal(getProjectsDefaultView(new URLSearchParams(query)), 'all');
  }
});

test('Projects has exactly one current workspace for module entry and every supported destination', () => {
  const items = getAmsModuleSubnavigation('projects', 'Admin');
  for (const [query, expected] of [
    ['', 'overview'], ['?projects=overview', 'overview'], ['?projects=all', 'registry'],
    ['?projects=active', 'registry'], ['?projects=planning', 'registry'],
    ['?projects=on-hold', 'registry'], ['?projects=completed', 'registry'],
    ['?projects=archived', 'registry'], ['?projects=planning-delivery', 'planning-delivery'],
    ['?projects=resources', 'resources'], ['?projects=sprint', 'tasks'],
    ['?project=record-slug', 'registry'], ['?layout=table', 'registry'],
  ]) {
    assert.deepEqual(items.filter(item => isAmsModuleSubnavigationItemActive(item, '/admin/projects', query)).map(item => item.key), [expected], query || 'module entry');
  }
});


test('Admin and PM sidebar Projects entries open Overview while restricted role destinations remain unchanged', () => {
  for (const role of ['Admin', 'PM'] as const) {
    assert.equal(getNavigationGroupsForRole(role).flatMap(group => group.items).find(item => item.key === 'project-hub')?.to, '/admin/projects?projects=overview');
  }
  for (const role of ['Finance', 'Creative'] as const) {
    assert.equal(getNavigationGroupsForRole(role).flatMap(group => group.items).find(item => item.key === 'project-hub')?.to, '/admin/projects?projects=sprint');
  }
  assert.equal(getNavigationGroupsForRole('Freelancer').flatMap(group => group.items).find(item => item.key === 'assigned-tasks')?.to, '/admin/tasks?taskscope=my&workspace=project');
});
