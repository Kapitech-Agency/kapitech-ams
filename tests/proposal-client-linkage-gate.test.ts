import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const read=(p:string)=>fs.readFileSync(p,'utf8');
test('proposal creation derives client linkage from project or deal',()=>{
 const s=read('server/postgres-proposal-repository.ts');
 assert.match(s,/let resolvedClientId = p\.clientId \? String\(p\.clientId\) : null/);
 assert.match(s,/projectClientId/);
 assert.match(s,/dealClientId/);
 assert.match(s,/resolvedClientId/);
});

test('proposal and invoice reference updates derive client from selected project',()=>{
 const proposal=read('server/postgres-proposal-repository.ts');
 const invoice=read('server/postgres-invoice-repository.ts');
 assert.match(proposal,/if\(!resolvedClientId&&projectClientId\)resolvedClientId=projectClientId/);
 assert.match(proposal,/next\.clientId=resolvedClientId/);
 assert.match(invoice,/if \(!resolvedClientId && projectClientId\) resolvedClientId = projectClientId/);
 assert.match(invoice,/resolvedClientId,projectId/);
});
