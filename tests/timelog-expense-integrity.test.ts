import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('time logs reject zero and negative durations before persistence',async()=>{const s=await fs.readFile(path.join(root,'server/postgres-time-log-repository.ts'),'utf8');assert.match(s,/!Number\.isFinite\(hours\) \|\| hours <= 0/);});
test('expenses use row locking and optimistic version checks when voiding',async()=>{const s=await fs.readFile(path.join(root,'server/postgres-expense-repository.ts'),'utf8');assert.match(s,/SELECT \* FROM expenses WHERE id=\$1 FOR UPDATE/);assert.match(s,/EXPENSE_VERSION_CONFLICT/);});
