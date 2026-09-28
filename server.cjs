const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const entry = path.join(process.cwd(), 'dist', 'server.cjs');

if (!fs.existsSync(entry)) {
  console.warn('[Kapitech AMS] dist/server.cjs is missing. Running the production build before startup.');

  const build = spawnSync(process.execPath, ['scripts/build-production.mjs'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      RAYON_NUM_THREADS: process.env.RAYON_NUM_THREADS || '1',
    },
  });

  if (build.error) {
    console.error('[Kapitech AMS] Production build could not be started:', build.error);
    process.exit(1);
  }

  if (build.status !== 0) {
    console.error('[Kapitech AMS] Production build failed with exit code:', build.status);
    process.exit(build.status ?? 1);
  }
}

if (!fs.existsSync(entry)) {
  console.error('[Kapitech AMS] Production server bundle was not created:', entry);
  process.exit(1);
}

require(entry);
