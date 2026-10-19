import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('every API route that touches the JSON database has an explicit datasource boundary', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  const lines = source.split(/\r?\n/);
  const starts: number[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*apiRouter\.(get|post|put|patch|delete)\(/.test(lines[index])) {
      starts.push(index);
    }
  }

  const violations: string[] = [];

  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index];
    const end = index + 1 < starts.length ? starts[index + 1] : lines.length;
    const block = lines.slice(start, end).join('\n');

    if (!block.includes('getDatabase(')) continue;

    const hasDatasourceBoundary =
      block.includes('getDataSourceMode()') ||
      block.includes('const usePostgres') ||
      block.includes('const postgresMode') ||
      block.includes('const jsonDb = getDataSourceMode()');

    if (!hasDatasourceBoundary) {
      violations.push(`line ${start + 1}: ${lines[start].trim()}`);
    }
  }

  assert.deepEqual(violations, [], `API routes directly touching JSON storage without an explicit datasource boundary:\n${violations.join('\n')}`);
});
