import React, { useId, useState } from 'react';
import { Filter, Search, X } from '../../lib/untitled-ui-icon-bridge';
import { DashboardControl } from './DashboardControls';
import { cn } from '../../lib/cn';
import './AdminFilterToolbar.css';

export interface AdminFilterToolbarProps {
  slug?: string;
  className?: string;
  ariaLabel?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  searchPlaceholder?: string;
  activeFilterCount: number;
  onReset: () => void;
  resetDisabled?: boolean;
  actions?: React.ReactNode;
  actionsSlug?: string;
  columns?: 3 | 4;
  children: React.ReactNode;
}

/** Inbox disclosure pattern: search stays visible; filtering state belongs to the caller. */
export const AdminFilterToolbar: React.FC<AdminFilterToolbarProps> = (p) => {
  const [open, setOpen] = useState(false);
  const panelId = 'ams-filters-' + useId();
  return <section className={cn('ams-filter-toolbar', p.className)} aria-label={p.ariaLabel || 'Search and filters'} data-ams-slug={p.slug}>
    <div className="ams-filter-toolbar-row">
      <label className="ams-filter-toolbar-search">
        <Search size={16} aria-hidden="true" /><span className="sr-only">{p.searchLabel}</span>
        <input aria-label={p.searchLabel} value={p.searchValue} onChange={event => p.onSearchChange(event.target.value)} placeholder={p.searchPlaceholder} />
        {p.searchValue && <button type="button" onClick={() => p.onSearchChange('')} aria-label={'Clear ' + p.searchLabel.toLowerCase()}><X size={14} /></button>}
      </label>
      <div className="ams-filter-toolbar-controls" data-ams-feature-slug={p.actionsSlug}>
        <DashboardControl variant="filter" active={open || p.activeFilterCount > 0} ariaPressed={open} ariaExpanded={open} ariaControls={panelId} onClick={() => setOpen(value => !value)} icon={<Filter size={16} />} count={p.activeFilterCount || undefined}>Filters</DashboardControl>
        {p.actions}
      </div>
    </div>
    {open && <div id={panelId} className="ams-filter-toolbar-panel" role="region" aria-label="Filter options">
      <div className={cn('ams-filter-toolbar-fields', p.columns === 4 && 'ams-filter-toolbar-fields--four')}>{p.children}</div>
      <div className="ams-filter-toolbar-footer"><DashboardControl variant="quiet" icon={<X size={14} />} onClick={p.onReset} disabled={p.resetDisabled ?? (!p.activeFilterCount && !p.searchValue)}>Reset filters</DashboardControl></div>
    </div>}
    {p.activeFilterCount > 0 && !open && <div className="ams-filter-toolbar-applied"><Filter size={12} aria-hidden="true" /><span>{p.activeFilterCount} {p.activeFilterCount === 1 ? 'filter' : 'filters'} applied</span><button type="button" onClick={p.onReset}>Clear filters</button></div>}
  </section>;
};

/** Visible label and select/control stay together across responsive grid changes. */
export const AdminFilterField: React.FC<{label: string; children: React.ReactNode}> = ({label, children}) => <div className="ams-filter-toolbar-field"><span>{label}</span>{children}</div>;
