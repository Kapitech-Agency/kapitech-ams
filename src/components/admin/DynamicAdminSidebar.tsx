import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Home,
  Inbox,
  Briefcase,
  Landmark,
  ClipboardCheck,
  Clock3,
  UsersRound,
  LockKeyhole,
  LayoutGrid,
  FileText,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import {
  AMS_PRIMARY_SETTINGS_ITEM,
  getPrimaryNavigationForRole,
  isNavigationItemActive,
  type AmsNavigationIcon,
  type AmsNavigationItem,
  type AmsRole,
} from '../../lib/amsNavigationAccess';
import {
  getAmsModuleSubnavigation,
  isAmsModuleSubnavigationItemActive,
  type AmsSidebarModuleKey,
  type AmsSidebarSubnavigationItem,
} from '../../lib/amsModuleSubnavigation';

type IconComponent = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }>;

const NAVIGATION_ICONS: Record<AmsNavigationIcon, IconComponent> = {
  dashboard: Home,
  user: UsersRound,
  activity: Inbox,
  crm: Briefcase,
  clients: UsersRound,
  onboarding: ClipboardCheck,
  projects: Briefcase,
  tasks: ClipboardCheck,
  retainer: Clock3,
  quotes: FileText,
  invoice: FileText,
  ledger: Landmark,
  profitability: Landmark,
  editorial: FileText,
  registry: LayoutGrid,
  access: ShieldCheck,
  backup: LockKeyhole,
  readiness: ShieldCheck,
};

interface NavigationLinkProps {
  item: AmsNavigationItem;
  role: AmsRole;
  pathname: string;
  search: string;
  hash: string;
  onNavigate?: () => void;
  className?: string;
}

const NavigationLink: React.FC<NavigationLinkProps> = ({
  item,
  role,
  pathname,
  search,
  hash,
  onNavigate,
  className = '',
}) => {
  const Icon = NAVIGATION_ICONS[item.icon];
  const active = isNavigationItemActive(item, pathname, search, hash);
  const note = item.accessNote?.[role];

  return (
    <NavLink
      to={item.to}
      end
      onClick={onNavigate}
      title={item.label}
      aria-current={active ? 'page' : undefined}
      data-ams-nav-item={item.key}
      className={() => [
        'group flex min-h-10 min-w-0 items-center gap-2.5 rounded-control border border-transparent px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
        active
          ? 'bg-accent/10 text-fg'
          : 'text-muted hover:bg-bg/70 hover:text-fg',
      ].filter(Boolean).join(' ')}
    >
      <span className={['flex h-7 w-7 shrink-0 items-center justify-center', active ? 'text-fg' : 'text-muted group-hover:text-fg'].join(' ')}>
        <Icon size={16} strokeWidth={active ? 2.1 : 1.8} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {note && (
        <span className="shrink-0 rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] font-medium text-muted">
          {note}
        </span>
      )}
    </NavLink>
  );
};

interface SubnavigationListProps {
  items: AmsSidebarSubnavigationItem[];
  pathname: string;
  search: string;
  hash: string;
  onNavigate?: () => void;
}

const SubnavigationList: React.FC<SubnavigationListProps> = ({
  items,
  pathname,
  search,
  hash,
  onNavigate,
}) => (
  <div className="ml-4 mt-1 space-y-0.5 border-l border-line pl-2.5" data-ams-nav-submenu="true">
    {items.map((item) => {
      const active = isAmsModuleSubnavigationItemActive(item, pathname, search, hash);
      return (
        <Link
          key={item.key}
          to={item.to}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          data-ams-nav-subitem={item.key}
          data-ams-slug={item.slug || item.key}
          className={[
            'flex min-h-8 min-w-0 items-center rounded-control border border-transparent px-2.5 py-1.5 text-[11px] font-medium leading-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            active
              ? 'bg-accent/10 text-fg'
              : 'text-muted hover:bg-bg/70 hover:text-fg',
          ].join(' ')}
        >
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
        </Link>
      );
    })}
  </div>
);

export interface DynamicAdminSidebarNavigationProps {
  role: AmsRole;
  pathname: string;
  search: string;
  hash: string;
  onNavigate?: () => void;
}

/**
 * The sidebar contains primary modules with expandable, role-filtered submenu
 * links. The desktop top bar is reserved for global controls, not module routes.
 */
export const DynamicAdminSidebarNavigation: React.FC<DynamicAdminSidebarNavigationProps> = ({
  role,
  pathname,
  search,
  hash,
  onNavigate,
}) => {
  const items = getPrimaryNavigationForRole(role);
  const moduleItems = items.map((item) => ({
    item,
    children: getAmsModuleSubnavigation(item.key as AmsSidebarModuleKey, role),
  }));
  const activeModuleKey =
    moduleItems.find(({ item, children }) => children.some((child) =>
      isAmsModuleSubnavigationItemActive(child, pathname, search, hash)
    ))?.item.key
    || moduleItems.find(({ item, children }) => children.length > 0
      && isNavigationItemActive(item, pathname, search, hash))?.item.key
    || null;

  const [expandedModuleKey, setExpandedModuleKey] = useState<string | null>(activeModuleKey);

  useEffect(() => {
    setExpandedModuleKey(activeModuleKey);
  }, [activeModuleKey]);

  return (
    <nav aria-label="Primary navigation" data-ams-feature-slug="role-based-sidebar" className="space-y-1">
      {moduleItems.map(({ item, children }) => {
        const expanded = expandedModuleKey === item.key;
        return (
          <div key={item.key} className="min-w-0">
            <div className="flex min-w-0 items-center gap-1">
              <NavigationLink
                item={item}
                role={role}
                pathname={pathname}
                search={search}
                hash={hash}
                onNavigate={onNavigate}
                className={children.length > 0 ? 'min-w-0 flex-1' : 'w-full'}
              />
              {children.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExpandedModuleKey((current) => current === item.key ? null : item.key)}
                  aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.label} submenu`}
                  aria-expanded={expanded}
                  aria-controls={`ams-sidebar-submenu-${item.key}`}
                  data-ams-nav-expand={item.key}
                  className="flex h-9 w-8 shrink-0 items-center justify-center rounded-control border border-transparent text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <ChevronDown size={14} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} aria-hidden="true" />
                </button>
              )}
            </div>
            {expanded && children.length > 0 && (
              <div id={`ams-sidebar-submenu-${item.key}`}>
                <SubnavigationList
                  items={children}
                  pathname={pathname}
                  search={search}
                  hash={hash}
                  onNavigate={onNavigate}
                />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export interface AdminSystemSettingsNavigationProps {
  role: AmsRole;
  pathname: string;
  search: string;
  hash: string;
  onNavigate?: () => void;
}

/** System Settings stays pinned to the sidebar bottom and expands to its own sections. */
export const AdminSystemSettingsNavigation: React.FC<AdminSystemSettingsNavigationProps> = ({
  role,
  pathname,
  search,
  hash,
  onNavigate,
}) => {
  const items = role === 'Admin' ? getAmsModuleSubnavigation('settings', role) : [];
  const activeSubitem = items.find((item) =>
    isAmsModuleSubnavigationItemActive(item, pathname, search, hash)
  )?.key || null;
  const [expanded, setExpanded] = useState(Boolean(activeSubitem));

  useEffect(() => {
    setExpanded(Boolean(activeSubitem));
  }, [activeSubitem]);

  if (role !== 'Admin') return null;

  return (
    <section
      aria-label="System settings"
      data-ams-feature-slug="ams-system-settings-nav"
      className="mt-3 border-t border-line pt-3"
    >
      <div className="flex min-w-0 items-center gap-1">
        <NavigationLink
          item={AMS_PRIMARY_SETTINGS_ITEM}
          role={role}
          pathname={pathname}
          search={search}
          hash={hash}
          onNavigate={onNavigate}
          className="min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} Settings submenu`}
          aria-expanded={expanded}
          aria-controls="ams-sidebar-submenu-settings"
          data-ams-nav-expand="settings"
          className="flex h-9 w-8 shrink-0 items-center justify-center rounded-control border border-transparent text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronDown size={14} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} aria-hidden="true" />
        </button>
      </div>
      {expanded && items.length > 0 && (
        <div id="ams-sidebar-submenu-settings" className="max-h-48 overflow-y-auto custom-scrollbar">
          <SubnavigationList
            items={items}
            pathname={pathname}
            search={search}
            hash={hash}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </section>
  );
};

export default DynamicAdminSidebarNavigation;
