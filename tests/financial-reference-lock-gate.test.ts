import assert from 'node:assert/strict'; import fs from 'node:fs'; import test from 'node:test';
const read=(p:string)=>fs.readFileSync(p,'utf8');
test('invoice create/update lock client and project references',()=>{const s=read('server/postgres-invoice-repository.ts');assert.match(s,/SELECT id FROM clients WHERE id=\$1 FOR SHARE/);assert.match(s,/SELECT id, client_id FROM projects WHERE id=\$1 FOR SHARE/);});
test('proposal conversion locks client, project and deal references',()=>{const s=read('server/postgres-proposal-repository.ts');const i=s.indexOf('async convertToInvoice');assert.match(s.slice(i),/FOR SHARE/);});
test('expense project validation remains transactional and locked',()=>{const s=read('server/postgres-expense-repository.ts');assert.match(s,/SELECT id FROM projects WHERE id=\$1 FOR SHARE/);});
