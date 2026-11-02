import React from 'react';
import { ArrowUpDown, CalendarDays, Eye, FileText, Pencil, Users } from 'lucide-react';
import { AgencyClient } from '../../../lib/clientStore';
import { AdminDataTableShell, AdminPanel, AdminStatusBadge } from '../AdminModulePrimitives';
import { DashboardControl } from '../DashboardControls';
import { DashboardEmptyState } from '../DashboardEmptyState';
import { ProfileIdentity } from '../ProfileIdentity';
import { clientOnboardingHref } from './ClientOnboardingWorkspace';

type Props = {
  records: AgencyClient[]; loading: boolean; unavailable: boolean; hasAccounts: boolean;
  contacts: boolean; onboarding: boolean; canManage: boolean; profileContext?: (client: AgencyClient) => string;
  sortKey: string; direction: 'asc' | 'desc'; onSort: (key: 'company' | 'name' | 'updatedAt') => void;
  onInspect: (client: AgencyClient) => void; onEdit: (client: AgencyClient) => void;
  onReset: () => void; onRetry: () => void; onCreate?: () => void; formatDate: (value: string) => string;
  serviceContext: (client: AgencyClient) => string; spendContext: (client: AgencyClient) => string; pagination: React.ReactNode;
};

export const ClientDirectoryRegister: React.FC<Props> = p => {
  const title = p.onboarding ? 'Lead accounts' : p.contacts ? 'Primary contacts' : 'Company directory';
  const identity = (client: AgencyClient) => <button type="button" className="block min-w-0 text-left" onClick={() => p.onInspect(client)} aria-label={'View profile for ' + client.company}><span className="block break-words text-xs font-semibold text-fg">{p.contacts ? client.name || 'Contact not recorded' : client.company || client.name || 'Client account'}</span><span className="mt-1 block break-words text-[11px] text-muted">{p.contacts ? client.company || 'Company not recorded' : [client.industry, client.location].filter(Boolean).join(' · ') || 'Business context not recorded'}</span></button>;
  const contact = (client: AgencyClient) => p.contacts ? <span className="text-xs text-muted">{[client.contactPersonRole, client.industry, client.location].filter(Boolean).join(' · ') || 'Contact context not recorded'}</span> : client.name ? <ProfileIdentity profile={{name: client.name, role: client.contactPersonRole || undefined, contextLabel: client.company}} /> : <span className="text-xs text-muted">Contact not recorded</span>;
  const channels = (client: AgencyClient) => <div className="space-y-1 break-all text-xs"><p className="text-fg">{client.email ? <a className="hover:text-accent-text" href={'mailto:' + client.email}>{client.email}</a> : 'Email not recorded'}</p><p className="text-muted">{client.phone ? <a className="hover:text-fg" href={'tel:' + client.phone}>{client.phone}</a> : 'Phone not recorded'}</p></div>;
  const status = (client: AgencyClient) => <AdminStatusBadge tone={client.status === 'active' ? 'success' : client.status === 'lead' ? 'info' : 'neutral'}>{client.status ? client.status[0].toUpperCase() + client.status.slice(1) : 'Not set'}</AdminStatusBadge>;
  const actions = (client: AgencyClient) => <div className="flex flex-wrap items-center justify-end gap-2"><DashboardControl variant={p.onboarding ? "icon" : "quiet"} size="compact" title={p.onboarding ? "Review account" : "Client 360"} icon={<Eye size={14} />} onClick={() => p.onInspect(client)} ariaLabel={'View profile for ' + client.company}>{p.onboarding ? undefined : 'Client 360'}</DashboardControl>{p.onboarding && <><DashboardControl variant="quiet" size="compact" to={clientOnboardingHref('required-documents',client.id)} showArrow={false} icon={<FileText size={14} />}>Documents</DashboardControl><DashboardControl variant="quiet" size="compact" to={clientOnboardingHref('kickoff-readiness',client.id)} showArrow={false} icon={<CalendarDays size={14} />}>Kickoff</DashboardControl></>}{p.canManage && !p.onboarding && <DashboardControl variant="icon" size="compact" icon={<Pencil size={14} />} onClick={() => p.onEdit(client)} ariaLabel={'Manage ' + client.company} />}</div>;
  const context = (client: AgencyClient) => p.onboarding ? p.profileContext?.(client) || 'Added ' + p.formatDate(client.createdAt) : p.serviceContext(client) + ' · ' + p.spendContext(client);
  const sort = (key: 'company' | 'name' | 'updatedAt', label: string) => <button type="button" onClick={() => p.onSort(key)} className="inline-flex min-h-9 items-center gap-2 text-left">{label}<ArrowUpDown size={13} aria-hidden="true" /></button>;
  return <AdminPanel title={title} description={p.onboarding ? 'Review the prospective account, primary contact and recorded scope before agreeing the engagement.' : p.contacts ? 'One primary contact per canonical client account; this view does not create additional contact records.' : 'Canonical client identity, primary contact and recorded service context.'} className="ams-operational-panel ams-overview-panel" slug={p.onboarding ? 'clients-onboarding-register' : 'clients-directory-table'}>
    <AdminDataTableShell embedded>
      {p.loading ? <div className="space-y-3 p-4" role="status" aria-label="Loading client directory">{[1,2,3].map(x => <div key={x} className="h-12 animate-pulse rounded-control bg-line/60" />)}</div> : p.unavailable || !p.records.length ? <DashboardEmptyState inset icon={<Users size={17} />} eyebrow={p.unavailable ? 'Source unavailable' : p.hasAccounts ? 'No matching records' : 'Client relationships'} title={p.unavailable ? 'Client directory unavailable' : p.hasAccounts ? 'No accounts match this view' : p.onboarding ? 'No lead accounts recorded' : 'No client accounts recorded'} description={p.unavailable ? 'Reload the source before relying on account coverage.' : p.hasAccounts ? 'Adjust the search or filters to find the account you need.' : 'Create the canonical client account to connect contacts, agreements and delivery context.'} action={p.unavailable || p.hasAccounts || p.onCreate ? <DashboardControl variant="quiet" onClick={p.unavailable ? p.onRetry : p.hasAccounts ? p.onReset : p.onCreate}>{p.unavailable ? 'Retry loading' : p.hasAccounts ? 'Reset filters' : p.onboarding ? 'Create lead account' : 'Create client account'}</DashboardControl> : undefined} /> : <>
        <div className="grid gap-3 p-4 min-[1100px]:hidden" role="list" aria-label={title}>
          {p.records.map(client => <article key={client.id} role="listitem" className="min-w-0 border-b border-line pb-4 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">{identity(client)}{status(client)}</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">{contact(client)}{channels(client)}</div>
            <p className="my-3 break-words text-[11px] leading-5 text-muted">{context(client)}</p>{actions(client)}
          </article>)}
        </div>
        <div className="hidden overflow-x-auto custom-scrollbar min-[1100px]:block" tabIndex={0} role="region" aria-label={'Scrollable ' + title.toLowerCase()}>
          <table className="w-full min-w-[900px] text-left text-xs">
            <caption className="sr-only">{title} — inspect a canonical account in Client 360</caption>
            <thead className="border-b border-line bg-bg text-[11px] text-muted"><tr>
              <th scope="col" className="px-4 py-2" aria-sort={p.sortKey === (p.contacts ? 'name' : 'company') ? p.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{sort(p.contacts ? 'name' : 'company',p.contacts ? 'Primary contact / company' : 'Client account')}</th>
              <th scope="col" className="px-4 py-2">{p.contacts ? 'Role / business context' : 'Primary contact'}</th><th scope="col" className="px-4 py-2">Contact channels</th>{!p.onboarding && <th scope="col" className="px-4 py-2">Relationship</th>}
              <th scope="col" className="px-4 py-2">{p.onboarding ? 'Profile review' : 'Service / renewal'}</th>
              <th scope="col" className="px-4 py-2" aria-sort={p.sortKey === 'updatedAt' ? p.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{sort('updatedAt','Updated')}</th><th scope="col" className="px-4 py-2 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-line">{p.records.map(client => <tr key={client.id} className="hover:bg-bg/70"><th scope="row" className="max-w-[240px] px-4 py-3 font-normal">{identity(client)}</th><td className="px-4 py-3">{contact(client)}</td><td className="max-w-[240px] px-4 py-3">{channels(client)}</td>{!p.onboarding && <td className="px-4 py-3">{status(client)}</td>}<td className="max-w-[240px] px-4 py-3 text-muted">{context(client)}</td><td className="px-4 py-3 text-muted">{p.formatDate(client.updatedAt)}</td><td className="px-4 py-3">{actions(client)}</td></tr>)}</tbody>
          </table>
        </div>
      </>}
      {!p.loading && !p.unavailable && p.pagination}
    </AdminDataTableShell>
  </AdminPanel>;
};
