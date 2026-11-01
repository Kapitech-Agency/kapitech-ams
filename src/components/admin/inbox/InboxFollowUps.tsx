import React, { useEffect } from 'react';
import { CalendarDays, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AdminModuleHeader, AdminPageShell, AdminSectionTabs } from '../AdminModulePrimitives';
import { DashboardControl } from '../DashboardControls';
import { DashboardEmptyState } from '../DashboardEmptyState';
import './InboxFollowUps.css';

const FOLLOW_UP_VIEWS = [
  { key: 'today', label: 'Due Today', description: 'Scheduled conversations that need attention today.' },
  { key: 'upcoming', label: 'Upcoming', description: 'Upcoming conversations and agreed next steps.' },
  { key: 'overdue', label: 'Overdue', description: 'Follow-ups whose scheduled time has passed.' },
  { key: 'completed', label: 'Completed', description: 'Follow-ups with a recorded completion.' },
] as const;

/** Presentation only: no reminder contract exists in the current Inbox source. */
export const InboxFollowUps: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const requested = params.get('followup');
  const view = FOLLOW_UP_VIEWS.find((item) => item.key === requested) || FOLLOW_UP_VIEWS[0];

  useEffect(() => {
    if ((!requested || FOLLOW_UP_VIEWS.some((item) => item.key === requested)) && !params.has('preview')) return;
    const next = new URLSearchParams(params);
    next.delete('preview');
    if (requested && !FOLLOW_UP_VIEWS.some((item) => item.key === requested)) next.delete('followup');
    setParams(next, { replace: true });
  }, [params, requested, setParams]);

  return <AdminPageShell featureSlug="inbox-follow-ups-workspace" className="ams-inbox-message-redesign ams-inbox-follow-ups">
    <AdminModuleHeader slug="inbox-follow-ups-header" variant="workspace" title="Inbox"
      description="Keep client conversations, creative feedback and technical next steps on track."
      actions={<DashboardControl to="/admin/inbox?view=messages" icon={<MessageSquare size={14} />}>Open messages</DashboardControl>}
    />
    <AdminSectionTabs ariaLabel="Follow-up views" activeKey={view.key} className="ams-inbox-workspace-tabs ams-inbox-follow-ups-tabs" items={FOLLOW_UP_VIEWS.map((item) => ({
      key: item.key, label: item.label, to: `/admin/inbox?view=follow-ups&followup=${item.key}`,
    }))} />
    <section className="ams-inbox-panel ams-inbox-follow-ups-register" data-ams-slug="inbox-follow-ups-register" aria-labelledby="inbox-follow-ups-register-title" data-source-status="unavailable">
      <header className="ams-inbox-panel-header ams-inbox-follow-ups-register-header">
        <div><h2 id="inbox-follow-ups-register-title">{view.label}</h2><p>{view.description}</p></div>
        <span className="ams-inbox-follow-ups-availability">Unavailable</span>
      </header>
      <div className="ams-inbox-follow-ups-state">
        <DashboardEmptyState eyebrow="FOLLOW-UP QUEUE" icon={<CalendarDays size={17} aria-hidden="true" />}
          title="Follow-ups are not available yet"
          description="Scheduled follow-ups are not available in this inbox yet. Continue reviewing and responding to current conversations in Messages."
          action={<DashboardControl to="/admin/inbox?view=messages" icon={<MessageSquare size={14} />}>Review messages</DashboardControl>}
        />
      </div>
    </section>
  </AdminPageShell>;
};
