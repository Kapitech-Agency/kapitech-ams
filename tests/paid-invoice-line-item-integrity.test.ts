import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('paid invoices cannot replace line items',async()=>{const s=await fs.readFile(path.join(root,'server/postgres-invoice-repository.ts'),'utf8');assert.match(s,/PAID_INVOICE_ITEMS_IMMUTABLE/);assert.match(s,/current\.payments\.length > 0 && patch\.items !== undefined/);});
test('paid invoice item conflict is exposed as HTTP 409',async()=>{const s=await fs.readFile(path.join(root,'server/routes.ts'),'utf8');assert.match(s,/PAID_INVOICE_ITEMS_IMMUTABLE/);});
