import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  Building2,
  ClipboardCheck,
  Clock3,
  Database,
  FileText,
  Globe,
  Inbox,
  Landmark,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShieldCheck,
  UsersRound,
} from '../../lib/untitled-ui-icon-bridge';
import {
  AMS_PRIMARY_SETTINGS_ITEM,
  getNavigationGroupsForRole,
  isNavigationItemActive,
  type AmsNavigationGroup,
  type AmsNavigationIcon,
  type AmsNavigationItem,
  type AmsRole,
} from '../../lib/amsNavigationAccess';

type IconComponent = React.ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number;
  'aria-hidden'?: boolean;
}>;

const NAVIGATION_ICONS: Record<AmsNavigationIcon, IconComponent> = {
  dashboard: LayoutDashboard,
  user: UsersRound,
  activity: Inbox,
  crm: Briefcase,
  clients: Building2,
  onboarding: ClipboardCheck,
  projects: Briefcase,
  tasks: ClipboardCheck,
  retainer: Clock3,
  quotes: FileText,
  invoice: ReceiptText,
  ledger: Landmark,
  profitability: BarChart3,
  editorial: Globe,
  registry: FileText,
  access: ShieldCheck,
  backup: Database,
  readiness: ShieldCheck,
  settings: Settings,
};

interface NavigationLinkProps {
  item: AmsNavigationItem;
  role: AmsRole;
  pathname: string;
  search: string;
  hash: string;
  onNavigate?: () => void;
}

const NavigationLink: React.FC<NavigationLinkProps> = ({
  item,
  role,
  pathname,
  search,
  hash,
  onNavigate,
}) => {
  const Icon = NAVIGATION_ICONS[item.icon];
  const active = isNavigationItemActive(item, pathname, search, hash);
  const note = item.accessNote?.[role];

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      title={item.label}
      aria-current={active ? 'page' : undefined}
      data-ams-nav-item={item.key}
      data-ams-slug={item.key}
      className={[
        'group flex min-h-10 w-full min-w-0 items-center gap-2.5 rounded-control border border-transparent px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        active ? 'bg-accent/10 text-fg' : 'text-muted hover:bg-bg/70 hover:text-fg',
      ].join(' ')}
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
    </Link>
  );
};

interface NavigationGroupProps {
  group: AmsNavigationGroup;
  role: AmsRole;
  pathname: string;
  search: string;
  hash: string;
  onNavigate?: () => void;
  showHeading?: boolean;
}

const NavigationGroup: React.FC<NavigationGroupProps> = ({
  group,
  role,
  pathname,
  search,
  hash,
  onNavigate,
  showHeading = true,
}) => {
  if (!group.items.length) return null;

  return (
    <section
      aria-label={group.label}
      data-ams-nav-group={group.key}
      className="space-y-1.5"
    >
      {showHeading && (
        <h2 className="px-2.5 pb-1 pt-3 text-[10px] font-semibold text-muted">
          {group.label}
        </h2>
      )}
      <div className="space-y-0.5">
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
  );
};

export interface DynamicAdminSidebarNavigationProps {
  role: AmsRole;
  pathname: string;
  search: string;
  hash: string;
  onNavigate?: () => void;
}

/**
 * Flat, role-filtered sidebar navigation. Each destination is a direct link;
 * in-page sections and tabs remain within their owning module workspace.
 */
export const DynamicAdminSidebarNavigation: React.FC<DynamicAdminSidebarNavigationProps> = ({
  role,
  pathname,
  search,
  hash,
  onNavigate,
}) => {
  const groups = getNavigationGroupsForRole(role);

  return (
    <nav
      aria-label="Primary navigation"
      data-ams-feature-slug="role-based-sidebar"
      data-ams-navigation-layout="flat"
      className="space-y-3"
    >
      {groups.map((group) => (
        <NavigationGroup
          key={group.key}
          group={group}
          role={role}
          pathname={pathname}
          search={search}
          hash={hash}
          onNavigate={onNavigate}
        />
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

/** Settings remains a single Admin-only direct link pinned to the sidebar bottom. */
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
      aria-label="System center"
      data-ams-feature-slug="ams-system-settings-nav"
      className="mt-3 border-t border-line pt-3"
    >
      <h2 className="px-2.5 pb-1.5 text-[10px] font-semibold text-muted">
        System settings
      </h2>
      <NavigationLink
        item={AMS_PRIMARY_SETTINGS_ITEM}
        role={role}
        pathname={pathname}
        search={search}
        hash={hash}
        onNavigate={onNavigate}
      />
    </section>
  );
};

export default DynamicAdminSidebarNavigation;
