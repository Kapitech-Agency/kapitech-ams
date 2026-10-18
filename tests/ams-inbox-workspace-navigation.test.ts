import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Inbox exposes all existing workspaces through URL-driven local navigation', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');

  assert.match(
    inbox,
    /data-ams-feature-slug="inbox-workspace-navigation"/,
    'the local Inbox navigation should be a distinct, discoverable workspace region',
  );
  assert.match(
    inbox,
    /aria-label=\{language === 'id' \? 'Tampilan workspace Inbox' : 'Inbox workspace views'\}/,
    'the navigation should have a localized accessible name',
  );
  assert.match(inbox, /key: 'overview' as InboxTab,/, 'all inbound view should be reachable');
  assert.match(inbox, /key: 'client' as InboxTab,/, 'client inquiry view should be reachable');
  assert.match(inbox, /key: 'starred' as InboxTab,/, 'starred view should be reachable');
  assert.match(
    inbox,
    /to=\{\`\/admin\/inbox\?view=\$\{view\.key\}\`\}/,
    'each navigation item should preserve the existing query-driven deep link',
  );
  assert.match(
    inbox,
    /aria-current=\{isActive \? 'page' : undefined\}/,
    'the current URL view should expose an accessible active state',
  );
  assert.match(
    inbox,
    /const requestedTab = searchParams\.get\('view'\) as InboxTab \| null/,
    'the existing URL state remains the source of the selected workspace',
  );
  assert.match(
    inbox,
    /\.filter\(\(item\) => item\.type !== 'career'\)/,
    'career applicants remain excluded from Inbox and owned by the CMS workflow',
  );
});
