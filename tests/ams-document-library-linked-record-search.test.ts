import assert from 'node:assert/strict';
import test from 'node:test';
import { documentLibrarySearchText, hasCanonicalDocumentLink, matchesDocumentRelatedContext, normalizeDocumentRelatedContext } from '../src/lib/documentLibrarySearch';

test('Document link filter only counts actual client and project relationships', () => {
  assert.equal(hasCanonicalDocumentLink({ relatedEntity: 'Client', relatedId: 'client-42' }), true);
  assert.equal(hasCanonicalDocumentLink({ relatedEntity: 'Project', relatedId: 'project-17' }), true);
  assert.equal(hasCanonicalDocumentLink({ relatedEntity: 'General', relatedId: 'legacy-ref' }), false);
  assert.equal(hasCanonicalDocumentLink({ relatedEntity: 'Client', relatedId: '   ' }), false);
  assert.equal(hasCanonicalDocumentLink({ relatedEntity: 'Other', relatedId: 'record-1' }), false);
});

test('Document search includes the authorized linked client or project name and ID', () => {
  const clients = [{ id: 'client-42', name: 'Acme Studio' }];
  const projects = [{ id: 'project-17', name: 'Website Redesign' }];

  const clientDocument = documentLibrarySearchText({
    name: 'Master Agreement.pdf',
    category: 'Legal',
    relatedEntity: 'Client',
    relatedId: 'client-42',
    tags: ['nda'],
  }, clients, projects);

  assert.match(clientDocument, /master agreement\.pdf/);
  assert.match(clientDocument, /acme studio/);
  assert.match(clientDocument, /client-42/);
  assert.match(clientDocument, /legal/);
  assert.match(clientDocument, /nda/);

  const projectDocument = documentLibrarySearchText({
    title: 'Homepage brief',
    relatedEntity: 'Project',
    relatedId: 'project-17',
  }, clients, projects);
  assert.match(projectDocument, /website redesign/);
  assert.match(projectDocument, /project-17/);
});

test('Document context accepts only canonical Client or Project IDs and matches exact relationships', () => {
  

  const clientContext = normalizeDocumentRelatedContext('Client', ' client-42 ');
  assert.deepEqual(clientContext, { entity: 'Client', id: 'client-42' });
  assert.equal(normalizeDocumentRelatedContext('client', 'client-42'), null);
  assert.equal(normalizeDocumentRelatedContext('Unknown', 'client-42'), null);
  assert.equal(normalizeDocumentRelatedContext('Client', '  '), null);
  assert.equal(normalizeDocumentRelatedContext(null, 'client-42'), null);

  assert.equal(matchesDocumentRelatedContext({ relatedEntity: 'Client', relatedId: 'client-42' }, clientContext), true);
  assert.equal(matchesDocumentRelatedContext({ relatedEntity: 'Client', relatedId: ' client-42 ' }, clientContext), true);
  assert.equal(matchesDocumentRelatedContext({ relatedEntity: 'Project', relatedId: 'client-42' }, clientContext), false);
  assert.equal(matchesDocumentRelatedContext({ relatedEntity: 'Client', relatedId: 'client-99' }, clientContext), false);
  assert.equal(matchesDocumentRelatedContext({ relatedEntity: 'General', relatedId: 'client-42' }, clientContext), false);
  assert.equal(matchesDocumentRelatedContext({ relatedEntity: 'Client', relatedId: 'client-99' }, null), true);
});

test('Document search remains useful when the linked record display name is unavailable', () => {
  const text = documentLibrarySearchText({
    title: 'Project brief',
    relatedEntity: 'Project',
    relatedId: 'project-legacy',
  }, [], []);
  assert.match(text, /project brief/);
  assert.match(text, /project-legacy/);
});
