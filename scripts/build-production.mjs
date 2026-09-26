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

await import('./copy-postgres-migrations.mjs');