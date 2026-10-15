import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  ChevronRight,
} from 'lucide-react';
import {
  AMS_SYSTEM_SETTINGS_ITEMS,
  getNavigationGroupsForRole,
  isNavigationItemActive,
  type AmsNavigationIcon,
  type AmsNavigationItem,
  type AmsRole,
} from '../../lib/amsNavigationAccess';

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
  compact?: boolean;
}

const NavigationLink: React.FC<NavigationLinkProps> = ({
  item,
  role,
  pathname,
  search,
  hash,
  onNavigate,
  compact = false,
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
        active
          ? 'bg-accent/10 text-fg'
          : 'text-muted hover:bg-bg/70 hover:text-fg',
      ].join(' ')}
    >
      <span className={['flex h-7 w-7 shrink-0 items-center justify-center', active ? 'text-fg' : 'text-muted group-hover:text-fg'].join(' ')}>
        <Icon size={16} strokeWidth={active ? 2.1 : 1.8} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {note && !compact && (
        <span className="shrink-0 rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] font-medium text-muted">
          {note}
        </span>
      )}
    </NavLink>
  );
};

export interface DynamicAdminSidebarNavigationProps {
  role: AmsRole;
  pathname: string;
  search: string;
  hash: string;
  onNavigate?: () => void;
}

export const DynamicAdminSidebarNavigation: React.FC<DynamicAdminSidebarNavigationProps> = ({
  role,
  pathname,
  search,
  hash,
  onNavigate,
}) => {
  const groups = getNavigationGroupsForRole(role).filter((group) => group.key !== 'system-settings');
  const activeGroupKey = groups.find((group) =>
    group.items.some((item) => isNavigationItemActive(item, pathname, search, hash))
  )?.key;
  const [expandedGroup, setExpandedGroup] = useState<string | null>(activeGroupKey ?? 'main-dashboard');

  useEffect(() => {
    if (activeGroupKey) setExpandedGroup(activeGroupKey);
  }, [activeGroupKey, pathname, search, hash, role]);

  return (
    <nav aria-label="Primary navigation" data-ams-feature-slug="role-based-sidebar" className="space-y-2">
      {groups.map((group) => {
        const expanded = role === 'Admin' || expandedGroup === group.key;
        const groupHasActiveItem = group.key === activeGroupKey;

        return (
          <section key={group.key} aria-label={group.label} data-ams-nav-group={group.key} className="min-w-0">
            {role === 'Admin' ? (
              <h2 className={[
                'flex min-h-9 items-center px-2 text-[10px] font-semibold uppercase tracking-[0.07em]',
                groupHasActiveItem ? 'text-fg' : 'text-muted',
              ].join(' ')}>
                {group.label}
              </h2>
            ) : (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`ams-nav-group-${group.key}`}
                onClick={() => setExpandedGroup((current) => current === group.key ? null : group.key)}
                className={[
                  'flex min-h-9 w-full items-center gap-2 rounded-control px-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  groupHasActiveItem ? 'text-fg' : 'text-muted hover:bg-bg/60 hover:text-fg',
                ].join(' ')}
              >
                <span className="min-w-0 flex-1 truncate text-[10px] font-semibold uppercase tracking-[0.07em]">
                  {group.label}
                </span>
                {expanded
                  ? <ChevronDown size={14} className="shrink-0" aria-hidden="true" />
                  : <ChevronRight size={14} className="shrink-0" aria-hidden="true" />}
              </button>
            )}
            {expanded && (
              <div id={`ams-nav-group-${group.key}`} className="mt-1 space-y-1 pl-0.5">
                {group.items.map((item) => (
                  <NavigationLink
                    key={item.key}
                    item={item}
                    role={role}
                    pathname={pathname}
                    search={search}
                    hash={hash}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}
          </section>
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

export const AdminSystemSettingsNavigation: React.FC<AdminSystemSettingsNavigationProps> = ({
  role,
  pathname,
  search,
  hash,
  onNavigate,
}) => {
  if (role !== 'Admin') return null;

  return (
    <section
      aria-label="SYSTEM SETTINGS"
      data-ams-feature-slug="ams-system-settings-nav"
      className="mt-2 space-y-1 pt-1"
    >
      <h2 className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">
        SYSTEM SETTINGS
      </h2>
      {AMS_SYSTEM_SETTINGS_ITEMS.map((item) => (
        <NavigationLink
          key={item.key}
          item={item}
          role={role}
          pathname={pathname}
          search={search}
          hash={hash}
          onNavigate={onNavigate}
        />
      ))}
    </section>
  );
};

export default DynamicAdminSidebarNavigation;
