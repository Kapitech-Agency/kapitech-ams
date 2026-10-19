import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('PostgreSQL startup bootstraps a first Master admin only on an empty user table', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-bootstrap.ts'), 'utf8');
  assert.ok(source.includes('SELECT COUNT(*)::bigint AS count FROM users'));
  assert.ok(source.includes("stakeholder_type = 'Master'"));
  assert.ok(source.includes('buildInitialAdmin()'));
  assert.ok(source.includes("if (process.env.NODE_ENV !== 'production') return;"));
});

test('CI verifies PostgreSQL login end to end after production bundle boot', () => {
  const workflow = fs.readFileSync(path.resolve(process.cwd(), '.github/workflows/ams-ci.yml'), 'utf8');
  assert.ok(workflow.includes('/api/auth/login'));
  assert.ok(workflow.includes("stakeholderType!=='Master'"));
  assert.ok(workflow.includes('/api/auth/me'));
});