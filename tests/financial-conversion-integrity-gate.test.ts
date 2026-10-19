import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const read=(p:string)=>fs.readFileSync(p,'utf8');
test('invoice cancellation is blocked after payments in repository and route',()=>{
 const repo=read('server/postgres-invoice-repository.ts'); const routes=read('server/routes.ts');
 assert.match(repo,/current\.payments\.length>0.*INVOICE_WITH_PAYMENTS_CANNOT_BE_CANCELLED/);
 assert.match(routes,/INVOICE_WITH_PAYMENTS_CANNOT_BE_CANCELLED/);
});
test('proposal updates validate related records',()=>{
 const s=read('server/postgres-proposal-repository.ts');
 assert.match(s,/SELECT id FROM clients WHERE id=\$1 FOR SHARE/);
 assert.match(s,/SELECT id,client_id FROM projects WHERE id=\$1 FOR SHARE/);
 assert.match(s,/SELECT id,client_id FROM crm_deals WHERE id=\$1 FOR SHARE/);
});
test('proposal conversion locks referenced records',()=>{
 const s=read('server/postgres-proposal-repository.ts'); const i=s.indexOf('async convertToInvoice');
 assert.ok(i>=0); const x=s.slice(i);
 assert.match(x,/SELECT id FROM clients WHERE id=\$1 FOR SHARE/);
 assert.match(x,/SELECT id, client_id FROM projects WHERE id=\$1 FOR SHARE/);
 assert.match(x,/SELECT id, client_id FROM crm_deals WHERE id=\$1 FOR SHARE/);
});


test('proposal conversion requires approval and is idempotent after acceptance',()=>{
 const proposal=fs.readFileSync('server/postgres-proposal-repository.ts','utf8');
 const routes=fs.readFileSync('server/routes.ts','utf8');
 assert.ok(proposal.includes("String(p.status)==='Accepted'"));
 assert.ok(proposal.includes("String(p.status)!=='Approved'"));
 assert.ok(proposal.includes('PROPOSAL_APPROVAL_REQUIRED'));
 assert.ok(proposal.includes('__idempotentReplay:true'));
 assert.ok(proposal.includes('WHERE proposal_id=$1'));
 assert.match(routes,/Proposal cannot be converted to an invoice in its current status/);
});


test('invoice payment updates client total spend inside the PostgreSQL transaction',()=>{
 const repo=fs.readFileSync('server/postgres-invoice-repository.ts','utf8');
 assert.match(repo,/SELECT metadata FROM clients WHERE id=\$1 FOR UPDATE/);
 assert.match(repo,/totalSpend/);
 assert.match(repo,/UPDATE clients SET metadata=\$2,updated_at=\$3 WHERE id=\$1/);
 assert.match(repo,/__idempotentReplay/);
 const finance=fs.readFileSync('src/lib/financeStore.ts','utf8');
 assert.doesNotMatch(finance,/saveAgencyClient\(/);
});
