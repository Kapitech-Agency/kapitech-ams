import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { AdminPageShell } from './AdminModulePrimitives';

export type NavigationPlaceholderKind = 'activity' | 'readiness' | 'deprecated-approvals';

interface AmsNavigationPlaceholderProps {
  kind: NavigationPlaceholderKind;
}

const PLACEHOLDER_CONTENT: Record<NavigationPlaceholderKind, {
  title: string;
  description: string;
  eyebrow: string;
  detail: string;
  reference?: string;
}> = {
  activity: {
    title: 'Live Activity Stream',
    description: 'A dedicated route for the shared activity timeline across AMS workspaces.',
    eyebrow: 'Navigation placeholder',
    detail: 'The activity-feed view is not part of this navigation and route-guard change. Existing client relationship activity remains available from each client profile.',
  },
  readiness: {
    title: 'Release Readiness Telemetry Gate',
    description: 'A reserved location for the production release-readiness monitor.',
    eyebrow: 'System monitor placeholder',
    detail: 'The UI does not call the monitoring endpoint in this navigation-only change. Connect the monitor here when its client-facing contract is approved.',
    reference: 'GET /api/system/production-readiness',
  },
  'deprecated-approvals': {
    title: 'Legacy approvals route',
    description: 'The standalone Approval module is retired from primary navigation.',
    eyebrow: 'Deprecated route · DEPRECATED_PENDING',
    detail: 'This restricted compatibility route remains available while existing consumers and workflow ownership are reviewed. Review, posting, and period-closing controls remain in their owning workflows. No approval action is available on this page.',
  },
};

export const AmsNavigationPlaceholder: React.FC<AmsNavigationPlaceholderProps> = ({ kind }) => {
  const content = PLACEHOLDER_CONTENT[kind];
  const Icon = kind === 'activity' ? Activity : ShieldCheck;

  return (
    <AdminPageShell featureSlug={kind === 'activity' ? 'live-activity-navigation-placeholder' : 'release-readiness-navigation-placeholder'}>
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-fg">{content.title}</h1>
        <p className="max-w-3xl text-xs leading-5 text-muted">{content.description}</p>
      </header>
      <section className="max-w-3xl rounded-card border border-line bg-panel p-5 sm:p-6" aria-labelledby="ams-navigation-placeholder-title">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted">
            <Icon size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{content.eyebrow}</p>
            <h2 id="ams-navigation-placeholder-title" className="mt-1 text-sm font-semibold text-fg">{content.title}</h2>
            <p className="mt-2 text-xs leading-5 text-muted">{content.detail}</p>
            {content.reference && (
              <code className="mt-3 inline-flex rounded-control border border-line bg-bg px-2.5 py-2 text-xs text-fg">
                {content.reference}
              </code>
            )}
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
};

export default AmsNavigationPlaceholder;
