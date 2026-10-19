import assert from 'node:assert/strict'; import fs from 'node:fs'; import test from 'node:test';
const read=(p:string)=>fs.readFileSync(p,'utf8');
test('financial and operational reference writes use shared locks',()=>{
 const inv=read('server/postgres-invoice-repository.ts'); const prop=read('server/postgres-proposal-repository.ts'); const exp=read('server/postgres-expense-repository.ts'); const time=read('server/postgres-time-log-repository.ts'); const crm=read('server/postgres-crm-deal-repository.ts');
 assert.match(inv,/SELECT id FROM clients WHERE id=\$1 FOR SHARE/); assert.match(inv,/SELECT id, client_id FROM projects WHERE id=\$1 FOR SHARE/);
 assert.match(prop,/FOR SHARE/); assert.match(exp,/SELECT id FROM projects WHERE id=\$1 FOR SHARE/);
 assert.match(time,/SELECT id FROM projects WHERE id = \$1 FOR SHARE/); assert.match(time,/SELECT id, project_id FROM tasks WHERE id = \$1 FOR SHARE/);
 const i=crm.indexOf('async convertLead'); assert.match(crm.slice(i),/SELECT \* FROM clients WHERE id=\$1 FOR SHARE/);
});
test('invoice cancellation guard is present on current main code path',()=>{const s=read('server/postgres-invoice-repository.ts');assert.match(s,/INVOICE_WITH_PAYMENTS_CANNOT_BE_CANCELLED/);});
