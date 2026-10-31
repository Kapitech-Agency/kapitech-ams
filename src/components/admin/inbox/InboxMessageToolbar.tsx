import React, { useRef, useState } from 'react';
import { Check, ChevronDown, Download, Filter, LayoutGrid, RefreshCw, Search, Star, Table as TableIcon, X } from 'lucide-react';
import { AdminSectionTabs } from '../AdminModulePrimitives';
import { DashboardControl, DashboardFilterGroup } from '../DashboardControls';
import { CustomSelect, type SelectOption } from '../../ui/CustomSelect';
import { Link } from 'react-router-dom';
import { DropdownPortal } from '../../ui/DropdownPortal';
import type { InboxCategory } from './inboxPresentation';

export function InboxMessageNavigation({ category, saved, preview, table = false }: { category: InboxCategory; saved: string; preview: boolean; table?: boolean }) {
  const href = (view: InboxCategory, state = 'all') => {
    const query = new URLSearchParams({ view });
    if (state !== 'all') query.set('saved', state);
    if (preview || view === 'client-requests' || view === 'project-support') query.set('preview', '1');
    if (table) query.set('layout', 'table');
    return '/admin/inbox?' + query;
  };
  return <div className="ams-inbox2-navigation" data-ams-feature-slug="inbox-navigation">
    <AdminSectionTabs ariaLabel="Message categories" activeKey={category} className="ams-inbox2-categories" items={[
      { key: 'messages', label: 'All Messages', to: href('messages') },
      { key: 'client', label: 'Sales Inquiries', to: href('client') },
      { key: 'client-requests', label: 'Client Requests', to: href('client-requests') },
      { key: 'project-support', label: 'Project & Support', to: href('project-support') },
    ]} />
    <AdminSectionTabs ariaLabel="Message saved views" activeKey={saved} variant="secondary" className="ams-inbox2-saved" items={[
      { key: 'all', label: 'All', to: href(category) },
      { key: 'unread', label: 'Unread', to: href(category, 'unread') },
      { key: 'starred', label: 'Starred', to: href(category, 'starred') },
    ]} />
  </div>;
}

type Props = {
  search: string; onSearch: (value: string) => void;
  status: string; onStatus: (value: string) => void; statuses: SelectOption[];
  priority: string; onPriority: (value: string) => void;
  owner: string; onOwner: (value: string) => void; owners: SelectOption[];
  channel: string; onChannel: (value: string) => void; channels: SelectOption[];
  table: boolean; onView: (table: boolean) => void;
  loading: boolean; preview: boolean; canManage: boolean; busy: boolean;
  newCount: number; canExport: boolean;
  onRefresh: () => void; onReset: () => void; onExport: () => void; onProcess: () => void;
};

export const InboxMessageToolbar: React.FC<Props> = (p) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const activeFilters = [p.status, p.priority, p.owner, p.channel].filter((value) => value !== 'all').length;
  return <section className="ams-inbox2-toolbar" data-ams-slug="inbox-message-controls" aria-label="Message controls">
    <div className="ams-inbox2-toolbar-row">
      <label className="ams-inbox2-search">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Search inbound messages</span>
        <input aria-label="Search inbound messages" value={p.search} onChange={(event) => p.onSearch(event.target.value)} placeholder="Search messages, people or briefs…" />
        {p.search && <button type="button" onClick={() => p.onSearch('')} aria-label="Clear message search"><X size={14} /></button>}
      </label>
      <div className="ams-inbox2-toolbar-controls" data-ams-feature-slug="inbox-message-actions">
        <DashboardControl variant="filter" active={filtersOpen || activeFilters > 0} ariaPressed={filtersOpen} ariaExpanded={filtersOpen} ariaControls="inbox-message-filter-panel" onClick={() => setFiltersOpen(!filtersOpen)} icon={<Filter size={16} />} count={activeFilters || undefined}>Filters</DashboardControl>
        <DashboardFilterGroup ariaLabel="Message register view" className="ams-inbox2-view-switch" value={p.table ? 'table' : 'split'} options={[
          { value: 'split', label: <><LayoutGrid size={14} /><span>Review</span></> },
          { value: 'table', label: <><TableIcon size={14} /><span>Table</span></> },
        ]} onChange={(value) => p.onView(value === 'table')} />
        <DashboardControl variant="icon" ariaLabel="Refresh messages" title={p.preview ? 'Design preview uses sample data' : 'Refresh messages'} icon={<RefreshCw size={16} />} onClick={p.onRefresh} disabled={p.loading || p.preview} />
        <DashboardControl buttonRef={moreButton} ariaLabel="More message actions" ariaExpanded={moreOpen} ariaControls="inbox-more-actions" onClick={() => setMoreOpen(!moreOpen)} trailingIcon={<ChevronDown size={14} />}>More</DashboardControl>
        <DropdownPortal open={moreOpen} anchorRef={moreButton} onClose={() => setMoreOpen(false)} align="right" className="ams-inbox2-more-content">
          <div id="inbox-more-actions">
            <button type="button" onClick={() => { setMoreOpen(false); p.onExport(); }} disabled={!p.canExport || p.preview} title="Exports all records in the current category; search and filters are not applied."><Download size={16} />Export CSV</button>
            <button type="button" onClick={() => { setMoreOpen(false); p.onProcess(); }} disabled={!p.canManage || p.busy || p.preview || !p.newCount}><Check size={16} />Mark new as in review</button>
            <span className="ams-inbox2-more-label">Other saved views</span>
            <button type="button" disabled title="A canonical resolved-message workflow is not connected.">Resolved · Not connected</button>
            <button type="button" disabled title="A canonical archive workflow is not connected.">Archived · Not connected</button>
            {p.canManage && <Link onClick={() => setMoreOpen(false)} to="/admin/cms/careers?tab=applicants">Careers applicants</Link>}
          </div>
        </DropdownPortal>
      </div>
    </div>
    {filtersOpen && <div id="inbox-message-filter-panel" className="ams-inbox2-filter-panel">
      <div><span>Status</span><CustomSelect slug="inbox-message-status-filter" aria-label="Filter messages by status" value={p.status} onChange={p.onStatus} options={p.statuses.map((option) => ({ ...option, label: option.value === 'all' ? 'All statuses' : option.label.replace(/^Status: /, '') }))} /></div>
      <div><span>Priority</span><CustomSelect slug="inbox-message-priority-filter" aria-label="Filter messages by priority" value={p.priority} onChange={p.onPriority} options={[{ value: 'all', label: 'All priorities' }, { value: 'urgent', label: 'Urgent' }, { value: 'high', label: 'High' }, { value: 'normal', label: 'Normal' }, { value: 'low', label: 'Low' }]} /></div>
      <div><span>Owner / PIC</span><CustomSelect slug="inbox-message-owner-filter" aria-label="Filter messages by owner" value={p.owner} onChange={p.onOwner} options={p.owners} /></div>
      <div><span>Record type</span><CustomSelect slug="inbox-message-channel-filter" aria-label="Filter messages by channel" value={p.channel} onChange={p.onChannel} options={p.channels} /></div>
      <DashboardControl variant="quiet" icon={<X size={14} />} onClick={p.onReset} disabled={!activeFilters && !p.search}>Reset filters</DashboardControl>
    </div>}
    {activeFilters > 0 && !filtersOpen && <div className="ams-inbox2-active-filters"><Filter size={12} aria-hidden="true" /><span>{activeFilters} {activeFilters === 1 ? 'filter' : 'filters'} applied</span><button type="button" onClick={p.onReset}>Clear filters</button></div>}
  </section>;
};
