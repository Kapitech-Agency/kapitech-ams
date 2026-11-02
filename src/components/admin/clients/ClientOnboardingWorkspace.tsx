import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, Eye, FileText } from 'lucide-react';
import type { AgencyClient } from '../../../lib/clientStore';
import { CustomSelect } from '../../ui/CustomSelect';
import { AdminPanel, AdminStatusBadge } from '../AdminModulePrimitives';
import { DashboardControl } from '../DashboardControls';
import { DashboardEmptyState } from '../DashboardEmptyState';

export type ClientOnboardingWorksheet = 'onboarding-checklist' | 'required-documents' | 'kickoff-readiness';

/** Presentation scope only. Canonical account IDs survive worksheet navigation. */
export function clientOnboardingHref(worksheet: ClientOnboardingWorksheet, clientId = '') {
  const params = new URLSearchParams({ scope: 'onboarding' });
  if (worksheet !== 'onboarding-checklist') params.set('worksheet', worksheet);
  if (clientId) params.set('onboardingClient', clientId);
  return '/admin/clients/all-clients?' + params.toString();
}

export const ClientOnboardingChecklistBoundary: React.FC = () =>
  <AdminPanel title="Onboarding requirements" className="ams-operational-panel ams-overview-panel" slug="onboarding-requirements-boundary">
    <DashboardEmptyState eyebrow="Requirements not configured" title="Profile review does not approve onboarding" description="The queue shows saved lead profiles. Assigned requirements, owners, due dates and approved completion evidence do not yet have a dedicated source. Review the account, then inspect its document and kickoff context." icon={<ClipboardCheck size={17} />} />
  </AdminPanel>;

type Props = {
  worksheet: Exclude<ClientOnboardingWorksheet, 'onboarding-checklist'>;
  clients: AgencyClient[];
  loading: boolean;
  unavailable: boolean;
  onInspect: (client: AgencyClient) => void;
  onRetry: () => void;
};

export const ClientOnboardingWorkspace: React.FC<Props> = p => {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('onboardingClient') || '';
  const leads = p.clients.filter(client => client.status === 'lead');
  const account = leads.find(client => client.id === selectedId);
  const documents = p.worksheet === 'required-documents';
  const title = documents ? 'Required Documents' : 'Kickoff Readiness';
  const Icon = documents ? FileText : CalendarDays;
  const select = (id: string) => {
    const next = new URLSearchParams(params);
    if (id) next.set('onboardingClient', id); else next.delete('onboardingClient');
    setParams(next);
  };

  return <div className="grid min-w-0 gap-4" data-ams-slug={'client-onboarding-' + p.worksheet}>
    <AdminPanel title="Lead account context" description="Choose the canonical lead account for this review. The same selection stays with you between onboarding worksheets." className="ams-operational-panel ams-overview-panel" bodyClassName="p-4">
      <div className="max-w-xl space-y-2"><label htmlFor="onboarding-account" className="block text-xs font-medium text-fg">Lead account</label>
        <CustomSelect id="onboarding-account" aria-label="Lead account" value={selectedId} onChange={select} disabled={p.loading || p.unavailable} options={[{ value: '', label: 'Choose a lead account' }, ...leads.map(client => ({ value: client.id, label: client.company || client.name || 'Unnamed lead account' }))]} />
      </div>
      {account && !p.loading && !p.unavailable && <div className="mt-4 flex min-w-0 flex-wrap items-start justify-between gap-3 border-t border-line pt-4">
        <div className="min-w-0 space-y-1"><p className="break-words text-sm font-semibold text-fg">{account.company || account.name}</p><p className="break-words text-xs text-muted">{account.name || 'Primary contact not recorded'}{account.contactPersonRole ? ' · ' + account.contactPersonRole : ''}</p><p className="break-all text-xs text-muted">{account.email || 'Email not recorded'}</p><AdminStatusBadge tone="info">Lead</AdminStatusBadge></div>
        <DashboardControl variant="quiet" icon={<Eye size={14} />} onClick={() => p.onInspect(account)}>Open Client 360</DashboardControl>
      </div>}
    </AdminPanel>
    <AdminPanel title={title} className="ams-operational-panel ams-overview-panel">
      {p.loading ? <div className="p-4 text-xs text-muted" role="status">Loading lead account context…</div> : p.unavailable ?
        <DashboardEmptyState eyebrow="Source unavailable" title="Lead accounts could not be verified" description="Reload the client source before reviewing account-specific evidence." icon={<Icon size={17} />} action={<DashboardControl variant="quiet" onClick={p.onRetry}>Retry loading</DashboardControl>} /> : !account ?
        <DashboardEmptyState eyebrow={selectedId ? 'Account unavailable' : 'Select an account'} title={selectedId ? 'Selected lead account unavailable' : leads.length ? 'Choose a lead account to review' : 'No lead accounts recorded'} description={selectedId ? 'This ID is not present in the current lead account source. Select another account; no other account is substituted.' : leads.length ? 'The document and kickoff review must stay linked to one canonical client identity.' : 'Create a lead account before reviewing onboarding evidence.'} icon={<Icon size={17} />} action={selectedId ? <DashboardControl variant="quiet" onClick={() => select('')}>Clear selection</DashboardControl> : undefined} /> :
        <DashboardEmptyState eyebrow={documents ? 'Requirements not configured' : 'Readiness not evaluated'} title={documents ? 'Document requirements are not configured for this account' : 'Kickoff requires validated evidence'} description={documents ? 'No required-document checklist or approval evidence is available. Inspect the authorized linked files through Client 360; a file’s existence does not establish acceptance.' : 'Configured requirements, requirement owners, blockers and approved evidence are not available. Profile completeness and contract status alone cannot authorize a kickoff. Review the account’s agreements and linked delivery records in Client 360.'} icon={<Icon size={17} />} />}
    </AdminPanel>
  </div>;
};
