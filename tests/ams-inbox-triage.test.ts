import assert from 'node:assert/strict';
import test from 'node:test';
import { isInboxActionable, isInboxHighPriority, isInboxUnassigned } from '../src/lib/inboxTriage';

test('Inbox triage predicate includes new, unassigned, and urgent or high-priority open records', () => {
  assert.equal(isInboxActionable({ status: 'new', assignedTo: 'Rey', priority: 'normal' }), true);
  assert.equal(isInboxActionable({ status: 'in-review', assignedTo: '', priority: 'normal' }), true);
  assert.equal(isInboxActionable({ status: 'contacted', assignedTo: 'Fikri', priority: 'urgent' }), true);
  assert.equal(isInboxActionable({ status: 'in-review', assignedTo: 'Rafi', priority: 'high' }), true);
  assert.equal(isInboxActionable({ status: 'contacted', assignedTo: 'Rafi', priority: 'normal' }), false);
});

test('Inbox triage scopes exclude closed records and distinguish unassigned from priority', () => {
  assert.equal(isInboxUnassigned({ status: 'new', assignedTo: ' ', priority: 'normal' }), true);
  assert.equal(isInboxUnassigned({ status: 'in-review', assignedTo: 'Owner', priority: 'high' }), false);
  assert.equal(isInboxHighPriority({ status: 'in-review', assignedTo: 'Owner', priority: 'high' }), true);
  assert.equal(isInboxHighPriority({ status: 'contacted', assignedTo: 'Owner', priority: 'normal' }), false);
  assert.equal(isInboxActionable({ status: 'closed', assignedTo: '', priority: 'urgent' }), false);
  assert.equal(isInboxUnassigned({ status: 'closed', assignedTo: '', priority: 'normal' }), false);
  assert.equal(isInboxHighPriority({ status: 'closed', assignedTo: 'Owner', priority: 'urgent' }), false);
});
