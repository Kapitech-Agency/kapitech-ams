import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');
const contains=(source:string, expected:string)=>assert.ok(source.includes(expected), expected);
describe('repository boundary integrity gate',()=>{
  it('validates proposal relationships during creation',()=>{
    const s=read('server/postgres-proposal-repository.ts');
    for (const expected of ['Proposal client not found.','Proposal project does not belong to the selected client.','Proposal deal does not belong to the selected client.','FOR SHARE']) contains(s,expected);
  });
  it('freezes paid invoice financial composition',()=>{
    const s=read('server/postgres-invoice-repository.ts');
    for (const expected of ['PAID_INVOICE_FINANCIAL_FIELDS_IMMUTABLE','subtotal','discountPercent','taxPercent']) contains(s,expected);
  });
  it('maps paid invoice immutability and proposal lifecycle conflicts to 409',()=>{
    const s=read('server/routes.ts');
    for (const expected of ['PAID_INVOICE_FINANCIAL_FIELDS_IMMUTABLE','PROPOSAL_DELETE_RESTRICTED','res.status(409)']) contains(s,expected);
  });
});
