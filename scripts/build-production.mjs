import { spawnSync } from 'node:child_process';
import { build as buildVite } from 'vite';
import { build as buildEsbuild } from 'esbuild';

const env = {
  ...process.env,
  RAYON_NUM_THREADS: process.env.RAYON_NUM_THREADS || '1',
};

process.env.RAYON_NUM_THREADS = env.RAYON_NUM_THREADS;

await buildVite();

await buildEsbuild({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  outfile: 'dist/server.cjs',
});

const migration = spawnSync(process.execPath, ['scripts/copy-postgres-migrations.mjs'], { stdio: 'inherit', env });

if (migration.error) throw migration.error;
if (migration.status !== 0) process.exit(migration.status ?? 1);
