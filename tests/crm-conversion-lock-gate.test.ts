import assert from 'node:assert/strict'; import fs from 'node:fs'; import test from 'node:test';
const read=(p:string)=>fs.readFileSync(p,'utf8');
test('CRM lead conversion locks existing client reference',()=>{
  const s=read('server/postgres-crm-deal-repository.ts');
  const i=s.indexOf('async convertLead');
  assert.match(s.slice(i),/SELECT \* FROM clients WHERE id=\$1 FOR SHARE/);
});
