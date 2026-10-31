import type { ContactSubmission } from '../../../lib/submissions';

export type InboxCategory = 'messages' | 'client' | 'client-requests' | 'project-support';

export const INBOX_CATEGORY_CONTENT: Record<InboxCategory, { title: string; description: string; empty: string; icon: 'inbox' | 'sales' | 'client' | 'support' }> = {
  messages: { title: 'All Messages', description: 'One place for incoming conversations, creative briefs and technical requests.', empty: 'Incoming messages will appear here. Open a message to review its brief and coordinate the next step.', icon: 'inbox' },
  client: { title: 'Sales Inquiries', description: 'Understand the brief, qualify the scope and prepare the next conversation.', empty: 'New business inquiries will appear here with requested services, stated budget and ownership.', icon: 'sales' },
  'client-requests': { title: 'Client Requests', description: 'Review client feedback, creative revisions and requests for existing engagements.', empty: 'Explore the client-request layout before its dedicated workflow is connected.', icon: 'client' },
  'project-support': { title: 'Project & Support', description: 'Keep delivery questions, technical issues and handover conversations in context.', empty: 'Explore the project and support layout before its dedicated workflow is connected.', icon: 'support' },
};

type PreviewItem = ContactSubmission & { previewSubject: string; previewContext: string };

/** Explicit, read-only design examples. Never seed, persist, export or mutate these through AMS APIs. */
const sample = (id: string, previewSubject: string, fullName: string, company: string, message: string, services: string[], status: ContactSubmission['status'], extra: Partial<PreviewItem> = {}): PreviewItem => ({
  id: `ams-ui-preview-${id}`, previewSubject, fullName, company, email: `${id}@example.invalid`, message, services,
  status, priority: 'normal', type: 'inquiry', source: 'Design preview', createdAt: '2026-10-31T08:30:00.000Z',
  previewContext: company, ...extra,
});

const SALES: PreviewItem[] = [
  sample('brand', 'Brand identity & digital launch', 'Creative lead', 'Sample brand studio', 'We are planning a brand launch and would like to align identity, art direction and our digital experience.\n\nThe initial scope includes a visual identity system, brand guidelines and a responsive website. We would like a discovery session to define deliverables, review milestones and the design-to-development handover.', ['Brand identity', 'UI/UX design', 'Web development'], 'new', { priority: 'high', starred: true, budget: 'To be aligned during discovery' }),
  sample('platform', 'Customer portal & API integration', 'Product lead', 'Sample technology company', 'We need an accessible customer portal that connects with our existing API. Please help us scope the architecture, user journeys, performance requirements and release plan.', ['Web development', 'API integration'], 'in-review', { assignedTo: 'Technical Project Manager', createdAt: '2026-10-30T10:00:00.000Z' }),
  sample('campaign', 'Campaign concept & motion system', 'Marketing lead', 'Sample retail brand', 'We are preparing a seasonal campaign. We would like to discuss the creative concept, social content formats and a reusable motion system for the launch.', ['Art direction', 'Motion design'], 'contacted', { assignedTo: 'Business Director', createdAt: '2026-10-29T09:00:00.000Z' }),
];
const REQUESTS: PreviewItem[] = [
  sample('revision', 'Feedback on campaign key visuals', 'Client marketing team', 'Sample retail brand', 'The campaign direction is approved for further exploration. Please refine the headline hierarchy and prepare a second composition for the hero visual.\n\nWe have grouped our feedback here so the creative team can review it together before the next presentation.', ['Creative revision', 'Art direction'], 'new', { priority: 'high', starred: true, assignedTo: 'Senior UI/UX Designer', previewContext: 'Seasonal campaign · Creative review' }),
  sample('content', 'Review the next content batch', 'Client brand team', 'Sample lifestyle brand', 'Please share the next content batch for review, including the copy direction, design variations and platform-specific crops.', ['Social content', 'Content review'], 'in-review', { assignedTo: 'Business Director', previewContext: 'Content engagement · Client feedback', createdAt: '2026-10-30T10:00:00.000Z' }),
  sample('scope', 'Additional landing-page variation', 'Client product team', 'Sample technology company', 'We would like to discuss an additional landing-page variation for a new audience. Please review the request and confirm the scope before scheduling any work.', ['UI/UX design', 'Scope discussion'], 'contacted', { previewContext: 'Website engagement · Scope request', createdAt: '2026-10-29T09:00:00.000Z' }),
];
const SUPPORT: PreviewItem[] = [
  sample('checkout', 'Checkout issue on a narrow viewport', 'Client operations team', 'Sample commerce company', 'The checkout action is difficult to reach on a narrow mobile viewport.\n\nSteps to review:\n1. Open the cart on a mobile device.\n2. Continue to checkout.\n3. Inspect the primary action when the keyboard is open.\n\nExpected behavior: the checkout action remains visible and reachable.', ['Web development', 'UI issue'], 'new', { priority: 'urgent', starred: true, assignedTo: 'Lead Full-Stack Tech', previewContext: 'Commerce website · Technical support' }),
  sample('handover', 'Release handover & documentation', 'Client engineering team', 'Sample technology company', 'Please walk us through the release handover, environment responsibilities and available technical documentation before we confirm the next step.', ['Release handover', 'Documentation'], 'in-review', { assignedTo: 'Technical Project Manager', previewContext: 'Customer portal · Delivery question', createdAt: '2026-10-30T10:00:00.000Z' }),
  sample('accessibility', 'Accessibility review of navigation', 'Client product team', 'Sample service platform', 'We would like to review the keyboard focus order and screen-reader labels of the main navigation. Please capture the findings and clarify the recommended next action.', ['Accessibility', 'Frontend review'], 'contacted', { previewContext: 'Service platform · Quality review', createdAt: '2026-10-29T09:00:00.000Z' }),
];

export function getInboxDesignPreview(category: InboxCategory): ContactSubmission[] {
  return category === 'client-requests' ? REQUESTS : category === 'project-support' ? SUPPORT : category === 'client' ? SALES : [...SALES, REQUESTS[0], SUPPORT[0]];
}

export function getInboxMessageSubject(item: ContactSubmission, preview = false): string {
  return preview && 'previewSubject' in item ? String(item.previewSubject) : item.services?.join(' · ') || item.specialty || (item.type === 'vendor' ? 'Partner introduction' : item.type === 'newsletter' ? 'Newsletter message' : 'General inquiry');
}

export function getInboxMessageContext(item: ContactSubmission, preview = false): string {
  return preview && 'previewContext' in item ? String(item.previewContext) : item.company || item.email;
}
