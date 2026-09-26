import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('migration 016 enforces database-level integrity for core records',async()=>{
 const sql=await fs.readFile(path.join(root,'db/postgres/016_database_integrity_constraints.sql'),'utf8');
 assert.match(sql,/time_logs_hours_positive_v1/);
 assert.match(sql,/invoice_payments_amount_positive_v1/);
 assert.match(sql,/invoice_items_quantity_positive_v1/);
 assert.match(sql,/invoices_amounts_nonnegative_v1/);
 assert.match(sql,/invoices_status_v1/);
 assert.match(sql,/approvals_status_v1/);
 assert.match(sql,/NOT VALID/);
});
test('migration runner verifies immutable migration checksums',async()=>{
 const source=await fs.readFile(path.join(root,'server/postgres-migrations.ts'),'utf8');
 assert.match(source,/checksum/);
 assert.match(source,/checksum mismatch/);
 assert.match(source,/pg_advisory_lock/);
});
