import fs from 'node:fs';
import path from 'node:path';

/** Follow the actual page composition when inspecting extracted Inbox presentation. */
export function readInboxPresentation(): string {
  return [
    'src/pages/admin/AdminInbox.tsx',
    'src/components/admin/inbox/InboxMessageToolbar.tsx',
    'src/components/admin/inbox/MessageWorkspace.tsx',
    'src/components/admin/inbox/MessageWorkspace.css',
  ].map((file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8').replace(/\r\n/g, '\n')).join('\n');
}
