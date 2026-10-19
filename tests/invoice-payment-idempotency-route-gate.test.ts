import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const read=(p:string)=>fs.readFileSync(p,'utf8');
test('PostgreSQL payment route forwards the idempotency key',()=>{
 const s=read('server/routes.ts');
 assert.match(s,/idempotencyKey: String\(input\.idempotencyKey \|\| req\.get\('Idempotency-Key'\) \|\| ''\)/);
});
test('payment idempotency check executes while invoice is locked',()=>{
 const s=read('server/postgres-invoice-repository.ts');
 assert.match(s,/SELECT \* FROM invoices WHERE id=\$1 FOR UPDATE/);
 assert.match(s,/metadata->>'idempotencyKey'=\$2/);
});
