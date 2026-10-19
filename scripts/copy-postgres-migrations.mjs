import fs from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.resolve(process.cwd(), 'db/postgres');
const targetDir = path.resolve(process.cwd(), 'dist/db/postgres');

await fs.rm(targetDir, { recursive: true, force: true });
await fs.mkdir(targetDir, { recursive: true });

const files = (await fs.readdir(sourceDir))
  .filter((file) => /^\d+_.+\.sql$/.test(file))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

if (!files.length) {
  throw new Error('No PostgreSQL migration files were found to package.');
}

for (const file of files) {
  await fs.copyFile(path.join(sourceDir, file), path.join(targetDir, file));
}

console.log('[Build] Packaged ' + files.length + ' PostgreSQL migration file(s) into dist/db/postgres.');
