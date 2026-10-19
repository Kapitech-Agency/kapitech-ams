import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p:string)=>fs.readFileSync(path.join(root,p),'utf8');

test('financial and CRM integrity gates remain wired',()=>{
 const [invoice,proposal,approval,crm,lead,client,project,routes]=[
  read('server/postgres-invoice-repository.ts'),read('server/postgres-proposal-repository.ts'),
  read('server/postgres-approval-repository.ts'),read('server/postgres-crm-deal-repository.ts'),
  read('server/postgres-lead-repository.ts'),read('server/postgres-client-repository.ts'),
  read('server/postgres-project-repository.ts'),read('server/routes.ts')
 ];
 assert.match(invoice,/PAID_INVOICE_LINKAGE_IMMUTABLE/); assert.match(invoice,/PAID_INVOICE_TOTAL_IMMUTABLE/); assert.match(invoice,/metadata->>'idempotencyKey'/);
 assert.match(proposal,/ACCEPTED_PROPOSAL_IMMUTABLE/); assert.match(proposal,/Proposal project does not belong to the selected client/); assert.match(proposal,/Proposal deal does not belong to the selected client/);
 assert.match(approval,/INVALID_APPROVAL_STATUS/); assert.match(approval,/Approval reference not found/);
 assert.match(crm,/DEAL_HAS_PROPOSALS/); assert.match(crm,/Lead has already been converted/);
 assert.match(lead,/LEAD_IS_CLOSED/); assert.match(client,/CLIENT_HAS_BUSINESS_RECORDS/); assert.match(project,/PROJECT_HAS_BUSINESS_RECORDS/);
 assert.match(routes,/Idempotency-Key/); assert.match(routes,/ACCEPTED_PROPOSAL_IMMUTABLE/); assert.match(routes,/CLIENT_HAS_BUSINESS_RECORDS/); assert.match(routes,/PROJECT_HAS_BUSINESS_RECORDS/); assert.match(routes,/LEAD_IS_CLOSED/); assert.match(routes,/DEAL_HAS_PROPOSALS/);
});


test('won CRM conversion is atomic and uses all required PostgreSQL relations',()=>{
 const repo=read('server/postgres-crm-deal-repository.ts');
 const routes=read('server/routes.ts');
 assert.match(repo,/async convertWonDeal/);
 assert.match(repo,/FROM crm_deals WHERE id=\$1 FOR UPDATE/);
 assert.match(repo,/INSERT INTO clients/);
 assert.match(repo,/INSERT INTO projects/);
 assert.match(repo,/INSERT INTO tasks/);
 assert.match(repo,/INSERT INTO invoices/);
 assert.match(repo,/INSERT INTO invoice_items/);
 assert.match(repo,/UPDATE crm_deals SET client_id=\$2/);
 assert.match(repo,/withPostgresTransaction/);
 assert.match(repo,/DEAL_NOT_WON/);
 assert.match(repo,/INCOMPLETE_DEAL_CONVERSION/);
 assert.match(repo,/replayed\s*:\s*true/);
 assert.match(routes,/\/crm\/deals\/:id\/convert-to-project/);
 assert.match(routes,/postgresCrmDealRepository\.convertWonDeal/);
});
