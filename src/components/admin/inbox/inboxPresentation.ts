import type { ContactSubmission } from '../../../lib/submissions';

export type InboxCategory = 'messages' | 'client' | 'client-requests' | 'project-support';

export const INBOX_CATEGORY_CONTENT: Record<InboxCategory, { title: string; description: string; empty: string; icon: 'inbox' | 'sales' | 'client' | 'support' }> = {
  messages: { title: 'All Messages', description: 'One place for incoming conversations, creative briefs and technical requests.', empty: 'Incoming messages will appear here. Open a message to review its brief and coordinate the next step.', icon: 'inbox' },
  client: { title: 'Sales Inquiries', description: 'Understand the brief, qualify the scope and prepare the next conversation.', empty: 'New business inquiries will appear here with requested services, stated budget and ownership.', icon: 'sales' },
  'client-requests': { title: 'Client Requests', description: 'Review client feedback, creative revisions and requests for existing engagements.', empty: 'Client request messages are not available here yet. Review current incoming conversations in All Messages.', icon: 'client' },
  'project-support': { title: 'Project & Support', description: 'Keep delivery questions, technical issues and handover conversations in context.', empty: 'Project and support messages are not available here yet. Review current incoming conversations in All Messages.', icon: 'support' },
};

export function getInboxMessageSubject(item: ContactSubmission): string {
  return item.services?.join(' · ') || item.specialty || (item.type === 'vendor' ? 'Partner introduction' : item.type === 'newsletter' ? 'Newsletter message' : 'General inquiry');
}

export function getInboxMessageContext(item: ContactSubmission): string {
  return item.company || item.email;
}
