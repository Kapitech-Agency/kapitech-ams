import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ExternalLink, FileText } from 'lucide-react';
import { AdminModuleHeader, AdminPageShell, AdminStatusBadge } from '../../components/admin/AdminModulePrimitives';

const slaSetupRequirements = [
  {
    title: 'Define each service commitment',
    detail: 'Link the client, service, target uptime, support window, response target, and measurement period to the signed agreement.'
  },
  {
    title: 'Connect a telemetry source',
    detail: 'Configure an approved monitoring provider and its authenticated server-side integration before calculating uptime or incidents.'
  },
  {
    title: 'Verify incident and recovery timestamps',
    detail: 'Use timestamped incident events to calculate response performance and mean time to recovery. Do not infer these values from project status.'
  }
];

export const AdminClientSlaMonitoring: React.FC = () => {
  return (
    <AdminPageShell featureSlug="client-sla-monitoring-module" className="ams-clients-module">
      <AdminModuleHeader
        slug="client-sla-monitoring-header"
        className="mb-0"
        title="SLA Monitoring"
        description="Monitor service commitments, availability, response performance, and incidents only after a verified telemetry source is connected."
        eyebrow={<AdminStatusBadge tone="warning" icon={<AlertTriangle size={12} />}>Telemetry not configured</AdminStatusBadge>}
      />

      

      <section className="rounded-card border border-warning/25 bg-warning/5 p-4 sm:p-5" role="status" aria-live="polite" data-ams-slug="sla-telemetry-not-configured">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-warning/25 bg-panel text-warning"><Activity size={17} /></span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-fg">No verified SLA telemetry source</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
              AMS is not connected to a live monitoring provider or incident-management feed. Uptime, MTTR, compliance, incident history, and snapshots are unavailable. No sample accounts or simulated performance values are shown.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-card border border-line bg-panel" aria-labelledby="sla-setup-title" data-ams-slug="sla-monitoring-setup">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <p className="text-xs font-medium text-muted">Setup checklist</p>
          <h2 id="sla-setup-title" className="mt-1 text-sm font-semibold text-fg">What must be configured before monitoring can start?</h2>
          <p className="mt-1 text-xs leading-5 text-muted">This checklist identifies the missing inputs. It does not imply that a provider is configured or receiving data.</p>
        </div>
        <div className="divide-y divide-line">
          {slaSetupRequirements.map((item, index) => (
            <div key={item.title} className="flex gap-3 px-4 py-4 sm:px-5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-[11px] font-semibold tabular-nums text-muted">{index + 1}</span>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-fg">{item.title}</h3>
                <p className="mt-1 max-w-4xl text-xs leading-5 text-muted">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-card border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between" data-ams-slug="sla-monitoring-next-actions">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted"><FileText size={16} /></span>
          <div>
            <h2 className="text-xs font-semibold text-fg">Manage the commercial SLA definition</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">Use Contracts & SOW to record the signed agreement and its service scope. Live compliance calculations remain unavailable until monitoring data is integrated.</p>
          </div>
        </div>
        <Link to="/admin/contracts" className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-control border border-line bg-bg px-3 text-xs font-medium text-fg transition-colors hover:bg-panel-hover">
          Open Contracts &amp; SOW <ExternalLink size={13} />
        </Link>
      </section>
    </AdminPageShell>
  );
};

export default AdminClientSlaMonitoring;
