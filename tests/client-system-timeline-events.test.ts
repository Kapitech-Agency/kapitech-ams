import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendSystemClientInteractionWithinTransaction,
  type SystemClientInteractionInput
} from '../server/postgres-client-interaction-repository.ts';

const input: SystemClientInteractionInput = {
  id: 'interaction_test_once',
  clientId: 'client_test_001',
  type: 'note',
  sourceType: 'system',
  systemAction: 'crm_deal_converted',
  sourceReferenceId: 'crm-deal-converted:deal_test_001',
  subject: 'Deal converted to delivery',
  summary: 'A won deal was converted to delivery records.',
  contactName: 'Test client',
  outcome: 'Project created: Website rebuild',
  nextStep: 'Review kickoff task and invoice.',
  occurredAt: '2026-10-15T10:00:00.000Z',
  createdByUserId: 'user_test_001',
  createdByName: 'Test user',
  createdAt: '2026-10-15T10:00:00.000Z'
};

test('system client interaction insert returns an explicitly marked timeline event', async () => {
  let calls = 0;
  const fakeClient = {
    query: async (sql: string, values: unknown[]) => {
      calls += 1;
      assert.ok(sql.includes('source_type'));
      assert.ok(sql.includes('system_action'));
      assert.ok(sql.includes('source_reference_id'));
      assert.ok(sql.includes('ON CONFLICT DO NOTHING'));
      assert.equal(values[1], input.clientId);
      return {
        rows: [{
          id: input.id,
          client_id: input.clientId,
          interaction_type: 'note',
          subject: input.subject,
          summary: input.summary,
          contact_name: input.contactName,
          outcome: input.outcome,
          next_step: input.nextStep,
          occurred_at: input.occurredAt,
          created_by_user_id: input.createdByUserId,
          created_by_name: input.createdByName,
          created_at: input.createdAt,
          source_type: 'system',
          system_action: input.systemAction,
          source_reference_id: input.sourceReferenceId
        }]
      };
    }
  };

  const created = await appendSystemClientInteractionWithinTransaction(fakeClient as any, input);
  assert.equal(calls, 1);
  assert.equal(created?.sourceType, 'system');
  assert.equal(created?.systemAction, 'crm_deal_converted');
  assert.equal(created?.sourceReferenceId, 'crm-deal-converted:deal_test_001');
  assert.equal(created?.type, 'note');
});

test('system client interaction insert treats an ON CONFLICT no-row result as an already-recorded event', async () => {
  const fakeClient = {
    query: async () => ({ rows: [] })
  };
  const duplicate = await appendSystemClientInteractionWithinTransaction(fakeClient as any, input);
  assert.equal(duplicate, null);
});
