import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('PostgreSQL auth security audits do not fall back to JSON audit storage', () => {
  const source = fs.readFileSync('server/auth.ts', 'utf8');
  assert.match(source, /import \{ postgresAuditLogRepository \} from '\.\/postgres-audit-log-repository\.ts';/);
  assert.match(source, /function recordSecurityAudit\(entry: Parameters<typeof recordAuditLog>\[0\]\)/);
  assert.match(source, /if \(getDataSourceMode\(\) === 'postgres'\)/);
  assert.match(source, /postgresAuditLogRepository\.append\(/);
  const auditCalls = source.match(/recordAuditLog\(\{/g) || [];
  assert.equal(auditCalls.length, 0);
});
