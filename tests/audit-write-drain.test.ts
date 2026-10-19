import assert from 'node:assert/strict'; import fs from 'node:fs'; import test from 'node:test';

test('postgres audit writes expose a drainable queue',()=>{const s=fs.readFileSync('server/db.ts','utf8');assert.match(s,/export function flushAuditLogWrites\(\): Promise<void>/);});

test('graceful shutdown closes the HTTP server before draining audit writes',()=>{const s=fs.readFileSync('server.ts','utf8');const close=s.indexOf('server.close');const drain=s.indexOf('await flushAuditLogWrites()');const pool=s.indexOf('await closePostgresPool()');assert.ok(close>=0);assert.ok(drain>close);assert.ok(pool>drain);assert.match(s,/process\.once\('SIGTERM'/);assert.match(s,/SHUTDOWN_TIMEOUT_MS = 10_000/);});
