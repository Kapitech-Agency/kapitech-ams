import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function repositoryFiles(root: string): string[] {
  return fs.readdirSync(root)
    .filter(file => /^postgres-.*-repository\.ts$|^postgres-repository\.ts$/.test(file))
    .map(file => path.join(root, file));
}

function schemaRequiredColumns(schema: string): Map<string, Set<string>> {
  const required = new Map<string, Set<string>>();

  const add = (table: string, column: string) => {
    const set = required.get(table) || new Set<string>();
    set.add(column);
    required.set(table, set);
  };

  for (const match of schema.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-z_][a-z0-9_]*)\s*\(([\s\S]*?)\n\);/gim)) {
    const table = match[1].toLowerCase();
    for (const rawLine of match[2].split(/\r?\n/)) {
      const line = rawLine.trim().replace(/,$/, '');
      const column = line.match(/^([a-z_][a-z0-9_]*)\s+(.+)$/i);
      if (!column || column[1].toUpperCase() === 'CONSTRAINT') continue;
      const name = column[1].toLowerCase();
      const definition = column[2];
      const requiredByConstraint = /NOT NULL\b|PRIMARY KEY\b/i.test(definition);
      const generated = /GENERATED\s+ALWAYS/i.test(definition);
      const hasDefault = /\bDEFAULT\b/i.test(definition);
      if (requiredByConstraint && !generated && !hasDefault) add(table, name);
    }
  }

  for (const match of schema.matchAll(/ALTER TABLE\s+([a-z_][a-z0-9_]*)([\s\S]*?);/gi)) {
    const table = match[1].toLowerCase();
    for (const columnMatch of match[2].matchAll(/ADD COLUMN(?: IF NOT EXISTS)?\s+([a-z_][a-z0-9_]*)\s+([^,;]+)(?:,|$)/gi)) {
      const name = columnMatch[1].toLowerCase();
      const definition = columnMatch[2];
      const requiredByConstraint = /NOT NULL\b|PRIMARY KEY\b/i.test(definition);
      const generated = /GENERATED\s+ALWAYS/i.test(definition);
      const hasDefault = /\bDEFAULT\b/i.test(definition);
      if (requiredByConstraint && !generated && !hasDefault) add(table, name);
    }
  }

  return required;
}

test('PostgreSQL INSERT statements provide every required schema column', () => {
  const root = path.resolve(process.cwd());
  const schema = fs.readdirSync(path.join(root, 'db', 'postgres'))
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => fs.readFileSync(path.join(root, 'db', 'postgres', file), 'utf8'))
    .join('\n');

  const required = schemaRequiredColumns(schema);
  const missing: string[] = [];

  for (const file of repositoryFiles(path.join(root, 'server'))) {
    const source = fs.readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/--[^\n]*/g, ' ');

    for (const match of source.matchAll(/INSERT\s+INTO\s+([a-z_][a-z0-9_]*)\s*\(([^)]+)\)/gi)) {
      const table = match[1].toLowerCase();
      const requiredColumns = required.get(table);
      if (!requiredColumns) continue;
      const provided = new Set(
        match[2].split(',').map(column => column.trim().replace(/["`]/g, '').toLowerCase()).filter(Boolean)
      );

      for (const column of requiredColumns) {
        if (!provided.has(column)) {
          missing.push(`${table}.${column} <- ${path.relative(root, file)}`);
        }
      }
    }
  }

  assert.deepEqual(
    [...new Set(missing)],
    [],
    'Repository INSERTs omit required schema columns: ' + [...new Set(missing)].join('; ')
  );
});
