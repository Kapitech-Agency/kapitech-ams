import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Production CMS migration restores verified portfolio items without republishing synthetic testimonials', async () => {
  const migration = await fs.readFile(path.join(root, 'db/postgres/050_restore_verified_public_portfolio.sql'), 'utf8');
  const verifiedProjectIds = [
    'verified_case_pertamina_sales_management_system',
    'verified_case_navees_gold_video_social',
    'verified_case_ina_solusi_company_website',
    'verified_case_mobilku_social_design',
    'verified_case_reve_space_custom_web_cms',
    'verified_case_sombong_padel_event_design',
    'verified_case_sababay_winery_event_video',
  ];

  for (const id of verifiedProjectIds) {
    assert.ok(migration.includes("'" + id + "'"), 'Missing production portfolio record: ' + id);
  }

  assert.equal((migration.match(/'isPublished', true/g) || []).length, verifiedProjectIds.length);
  assert.match(migration, /ON CONFLICT \(id\) DO NOTHING/);
  assert.doesNotMatch(migration, /t_0[1-6]|bank-digital-nusantara-mobile|siloam-care-telehealth-ui/);
});
