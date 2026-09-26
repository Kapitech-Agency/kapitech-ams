import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('production operational stores retry hydration after temporary server unavailability', () => {
  const files = [
    ['src/lib/financeStore.ts', 'scheduleFinanceHydrationRetry', 'financeServerHydrationStarted = false'],
    ['src/lib/projectStore.ts', 'scheduleProjectHydrationRetry', 'projectServerHydrationStarted = false'],
    ['src/lib/clientStore.ts', 'scheduleClientHydrationRetry', 'clientServerHydrationStarted = false'],
    ['src/lib/crmStore.ts', 'scheduleCrmHydrationRetry', 'crmServerHydrationStarted = false'],
    ['src/lib/vendorStore.ts', 'scheduleVendorHydrationRetry', 'vendorServerHydrationStarted = false']
  ] as const;

  for (const [file, retryFn, reset] of files) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, new RegExp(`function ${retryFn}\\(\\): void`));
    assert.match(source, new RegExp(reset.replace(/[.*+?^\\$\\{\\}()|[\\]\\\\]/g, '\\\\$&')));
    assert.match(source, /setTimeout\(\(\) =>/);
    assert.match(source, /Math\.min\(30000, 3000 \* 2 \*\* /);
  }
});

test('CMS production hydration retries after temporary server unavailability', () => {
  const source = fs.readFileSync('src/lib/cmsStore.ts', 'utf8');
  assert.match(source, /function scheduleCmsHydrationRetry/);
  assert.match(source, /cmsHydrationRetryState/);
  assert.match(source, /setTimeout\(\(\) =>/);
  assert.match(source, /fetchServerCmsServices/);
  assert.match(source, /fetchServerCmsProjects/);
  assert.match(source, /fetchServerCmsTestimonials/);
  assert.match(source, /fetchServerCmsSiteMeta/);
});
