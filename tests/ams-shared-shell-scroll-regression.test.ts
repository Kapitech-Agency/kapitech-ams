import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('authenticated shell defines viewport geometry and one primary workspace scroller', async () => {
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  const styles = await read('src/index.css');

  assert.match(
    layout,
    /<div className="flex flex-col min-\[900px\]:flex-row selection:bg-accent selection:text-fg ams-shell">/,
    'the shared CSS shell should own viewport sizing and overflow',
  );
  assert.doesNotMatch(
    layout,
    /<div className="[^"]*\bh-screen\b[^"]*\bams-shell\b/,
    'the root element should not repeat viewport-height sizing in utility classes',
  );
  assert.match(
    layout,
    /<main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto custom-scrollbar">/,
    'the main workspace should remain the primary vertical scroll region',
  );
  assert.doesNotMatch(
    layout,
    /<main className="[^"]*\bh-full\b[^"]*overflow-y-auto/,
    'the main scroller should size through flex rather than a second full-height constraint',
  );

  assert.match(
    styles,
    /\.ams-shell\s*\{[^}]*height:\s*100dvh;[^}]*overflow:\s*hidden;/,
    'the shell should bound the application to the dynamic viewport',
  );
  assert.match(
    styles,
    /\.ams-shell>main\s*\{[^}]*scrollbar-width:\s*auto;/,
    'the main scroller should retain its native-width scrollbar for discoverability',
  );
  assert.match(
    styles,
    /body\s*\{[^}]*overflow-x:\s*clip;/,
    'global horizontal clipping must not create another scroll container',
  );
  assert.doesNotMatch(styles, /scrollbar-width:\s*none/, 'functional scrollbars must remain discoverable');

  assert.match(layout, /overflow-y-auto overscroll-contain px-3\.5 py-4 custom-scrollbar/, 'long sidebar navigation should remain independently scrollable');
  assert.match(layout, /flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 custom-scrollbar/, 'the mobile navigation drawer should retain its own scroll region');
});

test('mobile shell topbar reserves the safe-area inset across every drawer viewport width', async () => {
  const css = await read('src/index.css');
  const tabletAndMobile = css.slice(
    css.indexOf('@media(max-width:899px){'),
    css.indexOf('@media(max-width:599px){'),
  );

  assert.ok(tabletAndMobile.includes(
    '.ams-shell .ams-mobile-topbar{height:calc(52px + env(safe-area-inset-top));min-height:calc(52px + env(safe-area-inset-top));padding-top:env(safe-area-inset-top);padding-left:14px;padding-right:14px}',
  ), 'all drawer-width layouts must reserve the top safe area without shrinking the 52px content row');
  assert.equal(
      (css.match(/\.ams-shell \.ams-mobile-topbar\{height:calc\(52px \+ env\(safe-area-inset-top\)\)/g) || []).length,
    1,
    'the safe-area height contract must have one responsive owner',
  );
});

test('responsive page and dashboard geometry follows canonical design-system tokens', async () => {
  const css = await read('src/index.css');

  assert.match(css, /\.ams-shell \.ams-page-shell\{display:flex;flex-direction:column;gap:24px;padding:24px 24px 32px\}/);
  assert.match(css, /\.ams-shell \.ams-page-title\{[^}]*gap:8px[^}]*font-size:20px;line-height:28px/);
  assert.match(css, /\.ams-shell \.ams-dashboard section\[aria-label="Executive key performance indicators"\] article \{\s*min-height:\s*112px;\s*padding:\s*16px;\s*border-radius:\s*12px;\s*\}/s);
  assert.doesNotMatch(css, /border-radius:\s*(?:9|10)px/);
  assert.doesNotMatch(css, /\.ams-shell \.ams-dashboard\s*\{[^}]*max-width:\s*720px/s);
  assert.doesNotMatch(css, /\.ams-shell \.ams-page-title\{font-size:18px;line-height:24px\}/);
  assert.doesNotMatch(css, /\.ams-shell \.ams-page-title\s*\{[^}]*font-size:\s*18px;[^}]*line-height:\s*25px/s);
  assert.doesNotMatch(css, /\.ams-shell \.ams-page-shell\s*\{\s*padding:\s*20px 18px 28px;\s*gap:\s*20px;\s*\}/s);
  assert.doesNotMatch(css, /\.ams-shell \.ams-page-shell\s*\{\s*padding:\s*16px 14px 24px;\s*gap:\s*18px;\s*\}/s);
});
