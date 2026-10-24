import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Careers applicant refresh keeps the last successful register visible while refreshing', async () => {
  const source = await read('src/pages/admin/AdminCmsCareers.tsx');
  const start = source.indexOf('data-ams-feature-slug="cms-careers-applicants"');
  const end = source.indexOf('slug="cms-career-applicant-details"', start);
  assert.ok(start >= 0 && end > start, 'Applicant workspace should remain bounded before the applicant detail drawer');
  const view = source.slice(start, end);

  assert.ok(view.includes('applicantsLoading && !applicantsLoaded'), 'Only the first load should replace the register with loading skeletons.');
  assert.ok(view.includes('applicantsError && !applicantsLoaded'), 'A failed initial load should remain a clear unavailable state.');
  assert.ok(view.includes('applicantsLoading && applicantsLoaded'), 'A refresh should show status without hiding previously loaded rows.');
  assert.ok(view.includes('applicantsError && applicantsLoaded'), 'A failed refresh should show a stale-data warning alongside the saved register.');
  assert.ok(view.includes('Previously loaded applicant records remain visible while the latest list is being checked.'));
  assert.ok(view.includes('The current applicant count and newer changes cannot be confirmed.'));
  assert.ok(view.includes('applicantsError && applicantsLoaded && applicants.length === 0'), 'An empty last successful response must not be reported as a confirmed current empty result after refresh failure.');
  assert.ok(view.includes('data-ams-feature-slug="cms-careers-applicants-cards"'));
  assert.ok(view.includes('slug="cms-careers-applicants-table"'));
  assert.ok(view.includes('onClick={() => void loadApplicants(true)}'), 'Existing manual refresh remains the retry action.');
});

test('Careers applicants remain separate from Inbox and Recruitment History remains unavailable without canonical events', async () => {
  const careers = await read('src/pages/admin/AdminCmsCareers.tsx');
  const access = await read('src/lib/amsNavigationAccess.ts');
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  assert.ok(careers.includes("(item as any).type === 'career'"));
  assert.ok(careers.includes('data-ams-feature-slug="cms-careers-applicants"'));
  assert.ok(careers.includes('Recruitment history is not available yet.'));
  assert.ok(access.includes("if (path === '/admin/cms/careers' && params.get('tab') === 'applicants')"));
  assert.ok(inbox.includes(".filter((item) => item.type !== 'career')"));
});
