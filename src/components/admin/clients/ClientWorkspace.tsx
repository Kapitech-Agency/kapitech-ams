import React from 'react';
import { Activity, CalendarDays, FileText, MessageSquare, Users } from 'lucide-react';
import { AdminPanel, AdminSectionTabs } from '../AdminModulePrimitives';
import { DashboardControl } from '../DashboardControls';
import { DashboardEmptyState } from '../DashboardEmptyState';

export const CLIENT_AGREEMENT_TABS = [
  { key: 'contracts', label: 'Contracts & SOWs', to: '/admin/contracts' },
  { key: 'retainers', label: 'Retainers & Service Commitments', to: '/admin/clients/retainers' },
  { key: 'renewals', label: 'Renewal Schedule', to: '/admin/contracts?view=renewals' },
  { key: 'history', label: 'Contract History', to: '/admin/contracts?view=history' },
];
export const CLIENT_ONBOARDING_TABS = [
  { key: 'onboarding-checklist', label: 'Onboarding Checklist', to: '/admin/clients/all-clients?scope=onboarding' },
  { key: 'required-documents', label: 'Required Documents', to: '/admin/clients/all-clients?scope=onboarding&worksheet=required-documents' },
  { key: 'kickoff-readiness', label: 'Kickoff Readiness', to: '/admin/clients/all-clients?scope=onboarding&worksheet=kickoff-readiness' },
];
export const CLIENT_SERVICE_TABS = [
  { key: 'sla-monitoring', label: 'SLA Monitoring', to: '/admin/clients/sla-monitoring' },
  { key: 'service-issues', label: 'Service Issues & Feedback', to: '/admin/clients/sla-monitoring?view=service-issues' },
  { key: 'client-health', label: 'Client Health', to: '/admin/clients/sla-monitoring?view=client-health' },
  { key: 'service-history', label: 'Service History', to: '/admin/clients/sla-monitoring?view=service-history' },
];
export const ClientAgreementTabs: React.FC<{ activeKey: string }> = ({ activeKey }) =>
  <AdminSectionTabs className="ams-operational-tabs" ariaLabel="Client Agreements worksheets" activeKey={activeKey} items={CLIENT_AGREEMENT_TABS} />;

const sourceWorkspaces = {
  history: { title: 'Contract History', eyebrow: 'Version history unavailable', empty: 'Agreement versions need their original evidence', description: 'The contract register exposes the current saved record. Persisted lifecycle audit events exist in AMS, but this workspace has no contract-specific version or event feed. Current statuses and updated dates are not reconstructed into a timeline.', icon: FileText, next: 'Inspect the current agreement and signed document', evidence: 'Open Contracts & SOWs to review scope, terms, dates and the recorded document link.', to: '/admin/contracts', action: 'Open contracts' },
  'sla-monitoring': { title: 'Service commitments', eyebrow: 'Telemetry not configured', empty: 'No verified SLA telemetry source', description: 'Uptime, response performance, breach state and recovery history need configured targets, working calendars and timestamped service events. These measurements are unavailable.', icon: Activity, next: 'Establish the agreed service scope', evidence: 'Review the signed service agreement and its support commitments before monitoring is connected.', to: '/admin/contracts', action: 'Review agreements' },
  'service-issues': { title: 'Service Issues & Feedback', eyebrow: 'Service request source unavailable', empty: 'No verified client service issue feed', description: 'Client-linked service requests, impact, ownership and resolution evidence are not exposed here. Sales messages are not reclassified as support incidents.', icon: MessageSquare, next: 'Review incoming client conversations', evidence: 'Keep communications in Inbox and account interactions in Client 360; neither is treated as an incident register.', to: '/admin/inbox?view=client', action: 'Open Inbox' },
  'client-health': { title: 'Client Health', eyebrow: 'Health rules not configured', empty: 'Review the relationship through its source records', description: 'No validated client-health model is configured. Invoice value, message volume, project count and advertising spend caps are not a client-health score.', icon: Users, next: 'Review delivery, agreements and account context', evidence: 'Use Client 360 for authorized projects, agreements, renewal dates, conversations and Finance references.', to: '/admin/clients/all-clients', action: 'Open directory' },
  'service-history': { title: 'Service History', eyebrow: 'Service event source unavailable', empty: 'No verified service outcome timeline', description: 'A service history requires client-linked events, timestamps, owners and outcomes. Account edits and project updates are not synthesized into service events.', icon: CalendarDays, next: 'Inspect recorded account interactions', evidence: 'Client 360 provides actual logged conversations and outcomes separately from unavailable service incident history.', to: '/admin/clients/all-clients', action: 'Open directory' },
};
export type ClientSourceWorksheet = keyof typeof sourceWorkspaces;

/** Domain composition of source boundaries, never a simulated register. */
export const ClientSourceWorkspace: React.FC<{ worksheet: ClientSourceWorksheet }> = ({ worksheet }) => {
  const item = sourceWorkspaces[worksheet];
  const Icon = item.icon;
  return <div className="grid min-w-0 gap-4" data-ams-slug={'client-source-' + worksheet}>
    <AdminPanel title={item.title} className="ams-operational-panel ams-overview-panel" actions={<DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" to={item.to} icon={<Icon size={14} />}>{item.action}</DashboardControl>}>
      <DashboardEmptyState inset eyebrow={item.eyebrow} title={item.empty} description={item.description} icon={<Icon size={17} />} />
    </AdminPanel>
    <AdminPanel title="Next action" className="ams-operational-panel ams-overview-panel" bodyClassName="p-4">
      <p className="text-xs font-medium text-fg">{item.next}</p><p className="mt-1 text-xs leading-5 text-muted">{item.evidence}</p>
    </AdminPanel>
  </div>;
};
