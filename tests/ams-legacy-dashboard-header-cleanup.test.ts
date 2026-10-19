import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const stylesheet = fs.readFileSync(path.resolve(root, 'src/index.css'), 'utf8');

test('retired dashboard-header styling has been removed in favor of the shared page header', () => {
  assert.doesNotMatch(stylesheet, /\.ams-dashboard-header\b/);
  assert.match(stylesheet, /\.ams-shell \.ams-page-header\{/);
  assert.match(stylesheet, /\.ams-shell \.ams-page-header>\*\{min-width:0\}/);
});

test('current Dashboard mobile KPI and panel layout remains defined after legacy cleanup', () => {
  assert.ok(stylesheet.includes('.ams-shell .ams-dashboard section[aria-label="Executive key performance indicators"] article'));
  assert.ok(stylesheet.includes('.ams-shell .ams-dashboard .ams-panel'));
  assert.ok(stylesheet.includes('.ams-shell .ams-dashboard-card'));
});

test('the directory pages describe the canonical shared page-header primitive', () => {
  for (const file of ['src/pages/admin/AdminClients.tsx', 'src/pages/admin/AdminInbox.tsx', 'src/pages/admin/AdminVendors.tsx']) {
    const source = fs.readFileSync(path.resolve(root, file), 'utf8');
    assert.ok(source.includes('canonical ams-page-header primitive.'), file + ' should refer to the current shared header');
    assert.equal(source.includes('ams-dashboard-header'), false, file + ' should not carry obsolete header naming');
  }
});
