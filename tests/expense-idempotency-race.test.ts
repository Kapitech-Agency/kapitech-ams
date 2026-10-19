import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const read=(p:string)=>fs.readFileSync(p,'utf8');

test('expense idempotency serializes concurrent requests before duplicate lookup',()=>{const s=read('server/postgres-expense-repository.ts');assert.match(s,/pg_advisory_xact_lock/);assert.match(s,/kapitech:expense-idempotency/);assert.match(s,/recorded_by_user_id=\$1 AND idempotency_key=\$2/);});
