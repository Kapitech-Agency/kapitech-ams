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
