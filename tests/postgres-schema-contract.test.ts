import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function repositoryFiles(root: string): string[] {
  return fs.readdirSync(root)
    .filter(file => /^(postgres-repository|postgres-.*-repository)\.ts$/.test(file))
    .map(file => path.join(root, file));
}

test('PostgreSQL repository SQL table references exist in the authoritative migration schema', () => {
  const root = path.resolve(process.cwd());
  const migrationDir = path.join(root, 'db', 'postgres');
  const serverDir = path.join(root, 'server');

  const schema = fs.readdirSync(migrationDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => fs.readFileSync(path.join(migrationDir, file), 'utf8'))
    .join('\n');

  const tables = new Set<string>();
  for (const match of schema.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-z_][a-z0-9_]*)/gi)) {
    tables.add(match[1].toLowerCase());
  }

  assert.ok(tables.size > 0, 'No PostgreSQL tables were discovered from db/postgres migrations.');

  const nonTableIdentifiers = new Set(['set', 'proposal', 'crm', 'jsonb_array_elements']);
  const referencedTables = new Map<string, string[]>();
  for (const file of repositoryFiles(serverDir)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\b(?:FROM|JOIN|INTO|UPDATE|DELETE\s+FROM)\s+([a-z_][a-z0-9_]*)/gi)) {
      const table = match[1].toLowerCase();
      const afterToken = match[0].slice(match[0].lastIndexOf(table) + table.length);
      if (nonTableIdentifiers.has(table) || /^\s*\(/.test(afterToken)) continue;
      const files = referencedTables.get(table) || [];
      files.push(path.relative(root, file));
      referencedTables.set(table, files);
    }
  }

  const missing = [...referencedTables.entries()]
    .filter(([table]) => !tables.has(table))
    .map(([table, files]) => `${table} <- ${[...new Set(files)].join(', ')}`);

  assert.deepEqual(missing, [], 'Repository references tables missing from migration schema: ' + missing.join('; '));
});
