import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAcceptedLegacyMigrationChecksum } from '../server/postgres-migrations.ts';

const historicalChecksums = [
  '50608edcb6e6bf3f93e713f79234ef7627877bfc8d53c47a9c4195c473a1fa2f',
  'a355292211030f74ed90190c99b41e2d34dd08c9f7f85a6ce80ceea0893460e8',
  '7edf0a3f0c23d72d8ae44ba23240ca39a9e1c6c73f734892f016653218a8009e'
];

test('only published historical migration 046 checksums are accepted as legacy', () => {
  for (const checksum of historicalChecksums) {
    assert.equal(
      isAcceptedLegacyMigrationChecksum('046_seed_seo_educational_insights', checksum),
      true,
      'published migration checksum should be recognized'
    );
  }

  assert.equal(
    isAcceptedLegacyMigrationChecksum('046_seed_seo_educational_insights', 'unknown-checksum'),
    false
  );
  assert.equal(
    isAcceptedLegacyMigrationChecksum('045_unrelated_migration', historicalChecksums[0]),
    false
  );
});

test('follow-up Insight migration uses valid PostgreSQL dollar-quote delimiters', async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const sql = await fs.readFile(path.join(root, 'db/postgres/047_sync_business_led_insights.sql'), 'utf8');

  assert.doesNotMatch(sql, /\\$q\\{|\\}q\\$/);
  assert.equal((sql.match(/\\$q\\$\\{/g) || []).length, 5);
  assert.equal((sql.match(/\\}\\$q\\$/g) || []).length, 5);
});
