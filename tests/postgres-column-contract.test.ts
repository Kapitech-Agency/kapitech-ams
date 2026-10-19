import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function repositoryFiles(root: string): string[] {
  return fs.readdirSync(root)
    .filter(file => /^postgres-.*-repository\.ts$|^postgres-repository\.ts$/.test(file))
    .map(file => path.join(root, file));
}

function parseSchemaColumns(schema: string): Map<string, Set<string>> {
  const columns = new Map<string, Set<string>>();
  for (const match of schema.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-z_][a-z0-9_]*)\s*\(([^;]+?)\n\);/gim)) {
    const table = match[1].toLowerCase();
    const set = new Set<string>();
    for (const raw of match[2].split(/,\s*(?=[a-z_][a-z0-9_]*\s)/i)) {
      const name = raw.trim().match(/^([a-z_][a-z0-9_]*)\s+/i)?.[1];
      if (name) set.add(name.toLowerCase());
    }
    columns.set(table, set);
  }
  for (const match of schema.matchAll(/ALTER TABLE\s+([a-z_][a-z0-9_]*)([\s\S]*?);/gi)) {
    const table = match[1].toLowerCase();
    const set = columns.get(table) || new Set<string>();
    for (const columnMatch of match[2].matchAll(/ADD COLUMN(?: IF NOT EXISTS)?\s+([a-z_][a-z0-9_]*)/gi)) {
      set.add(columnMatch[1].toLowerCase());
    }
    columns.set(table, set);
  }
  return columns;
}

function stripSqlComments(source: string): string {
  return source.replace(/\/*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
}

test('PostgreSQL repository INSERT and UPDATE columns exist in the authoritative schema', () => {
  const root = path.resolve(process.cwd());
  const migrationDir = path.join(root, 'db', 'postgres');
  const serverDir = path.join(root, 'server');

  const schema = fs.readdirSync(migrationDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => fs.readFileSync(path.join(migrationDir, file), 'utf8'))
    .join('\n');

  const columns = parseSchemaColumns(schema);
  const missing: string[] = [];

  for (const file of repositoryFiles(serverDir)) {
    const source = stripSqlComments(fs.readFileSync(file, 'utf8'));

    for (const match of source.matchAll(/INSERT\s+INTO\s+([a-z_][a-z0-9_]*)\s*\(([^)]+)\)/gi)) {
      const table = match[1].toLowerCase();
      const known = columns.get(table);
      if (!known) continue;

      for (const rawColumn of match[2].split(',')) {
        const column = rawColumn.trim().replace(/["`]/g, '').toLowerCase();
        if (column && !known.has(column)) {
          missing.push(`${table}.${column} <- ${path.relative(root, file)}`);
        }
      }
    }

    for (const match of source.matchAll(/UPDATE\s+([a-z_][a-z0-9_]*)\s+SET\s+([\s\S]*?)(?:\s+WHERE\s+|\s*$)/gi)) {
      const table = match[1].toLowerCase();
      const known = columns.get(table);
      if (!known) continue;

      const assignments = match[2].split(/,\s*(?=[a-z_][a-z0-9_]*\s*=)/g);
      for (const assignment of assignments) {
        const column = assignment.trim().match(/^([a-z_][a-z0-9_]*)\s*=/i)?.[1]?.toLowerCase();
        if (column && !known.has(column)) {
          missing.push(`${table}.${column} <- ${path.relative(root, file)}`);
        }
      }
    }
  }

  assert.deepEqual([...new Set(missing)], [], 'Repository references columns missing from migration schema: ' + [...new Set(missing)].join('; '));
});
