import React from 'react';
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
      aria-current={active ? 'page' : undefined}
      data-ams-nav-item={item.key}
      className={() => [
        'group relative flex min-h-10 min-w-0 items-center gap-2.5 rounded-control border px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        active
          ? 'border-accent/25 bg-accent/10 text-fg'
          : 'border-transparent text-muted hover:border-line hover:bg-bg/70 hover:text-fg',
      ].join(' ')}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-accent" aria-hidden="true" />}
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

  return (
    <nav aria-label="Primary navigation" data-ams-feature-slug="role-based-sidebar" className="space-y-4">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label} data-ams-nav-group={group.key}>
          <h2 className="px-2 pb-1.5 text-[10px] font-medium tracking-wide text-muted">{group.label}</h2>
          <div className="space-y-1">
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
        </section>
      ))}
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
      className="space-y-1 pt-3"
    >
      <h2 className="px-2 pb-1.5 text-[10px] font-medium tracking-wide text-muted">SYSTEM SETTINGS</h2>
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
