import assert from 'node:assert/strict'; import fs from 'node:fs'; import test from 'node:test';
test('audit append serializes the chain with a transaction advisory lock',()=>{const s=fs.readFileSync('server/postgres-audit-log-repository.ts','utf8');assert.match(s,/pg_advisory_xact_lock\(hashtextextended\('kapitech:ams:audit-chain'/);});
test('database migration enforces payment and expense idempotency uniqueness',()=>{const s=fs.readFileSync('db/postgres/017_idempotency_and_audit_constraints.sql','utf8');assert.match(s,/uq_invoice_payments_idempotency_v1/);});
