export interface InboxTriageRecord {
  status?: string | null;
  assignedTo?: string | null;
  priority?: string | null;
}

/** Closed inbound records are not work to triage. */
const isOpenInboxRecord = (item: InboxTriageRecord) => item.status !== 'closed';

export const isInboxUnassigned = (item: InboxTriageRecord): boolean =>
  isOpenInboxRecord(item) && !String(item.assignedTo || '').trim();

export const isInboxHighPriority = (item: InboxTriageRecord): boolean =>
  isOpenInboxRecord(item) && (item.priority === 'urgent' || item.priority === 'high');

/** The default queue includes any open record that is new, unassigned, or high priority. */
export const isInboxActionable = (item: InboxTriageRecord): boolean =>
  isOpenInboxRecord(item) && (
    item.status === 'new' ||
    isInboxUnassigned(item) ||
    isInboxHighPriority(item)
  );
