import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Briefcase,
  Building2,
  BarChart3,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Home,
  Landmark,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Receipt,
  Settings,
  ShieldCheck,
  Sun,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import { getAdminSession, logoutAdmin } from '../lib/adminAuth';
import { AmsBrandLogo } from '../components/admin/AmsBrandLogo';
import {
  getWorkspaceAccessMode,
  normalizeWorkspaceRole,
  WORKSPACE_NAV_GROUPS,
  WorkspaceNavGroup,
  WorkspaceNavItem,
  WorkspaceRole,
  WorkspaceRouteKey,
} from './workspaceAccess';

const ICON_BY_ROUTE: Record<WorkspaceRouteKey, React.ComponentType<{ size?: number; className?: string }>> = {
  'executive-overview': BarChart3,
  'personal-workspace': Home,
  'activity-stream': Activity,
  'sales-pipeline': Briefcase,
  'client-directory': UsersRound,
  'client-onboarding': Building2,
  'project-hub': LayoutGrid,
  'task-engine': ClipboardCheck,
  'retainer-manager': Clock3,
  'quotation-builder': FileText,
  'invoice-ledger': Receipt,
  'expense-ledger': WalletCards,
  'project-profitability': BarChart3,
  'cms-editorial': FileText,
  'system-settings': Settings,
};

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  Admin: 'Administrator',
  Finance: 'Finance',
  PM: 'Project Manager',
  Creative: 'Creative',
  Freelancer: 'Freelancer',
};

const ALL_NAV_ITEMS = WORKSPACE_NAV_GROUPS.flatMap((group) => group.items);

function getVisibleGroups(role: WorkspaceRole | null): WorkspaceNavGroup[] {
  if (!role) return [];
  return WORKSPACE_NAV_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0);
}

export interface WorkspaceLayoutProps {
  children?: React.ReactNode;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getAdminSession();
  const user = session?.user;
  const role = normalizeWorkspaceRole(typeof user?.role === 'string' ? user.role : null);
  const visibleGroups = useMemo(() => getVisibleGroups(role), [role]);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  );

  const activeItem = ALL_NAV_ITEMS.find((item) => item.path === location.pathname);
  const pageTitle = activeItem?.label || 'Agency Workspace';
  const displayName = user?.profileDisplayName || user?.name || user?.username || 'Team member';
  const rawRole = typeof user?.role === 'string' ? user.role : 'Role not assigned';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const getFocusable = () => {
      const panel = document.querySelector<HTMLElement>('[data-workspace-mobile-panel]');
      if (!panel) return [];
      return Array.from(panel.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'))
        .filter((node) => node.getClientRects().length > 0);
    };
    const focusFrame = window.requestAnimationFrame(() => {
      const close = document.querySelector<HTMLElement>('[data-workspace-mobile-panel] [aria-label="Close workspace navigation"]');
      (close || getFocusable()[0])?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [mobileOpen]);

  const toggleTheme = () => setTheme((previous) => previous === 'dark' ? 'light' : 'dark');
  const confirmLogout = () => {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const renderNavigation = (groups: WorkspaceNavGroup[], mobile = false) => (
    <nav aria-label="Agency workspace navigation" className="min-w-0 flex-1 overflow-y-auto px-2.5 py-3">
      {groups.map((group) => (
        <section key={group.key} className="mb-4">
          {!collapsed || mobile ? (
            <h2 className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
              {group.label}
            </h2>
          ) : (
            <div className="mx-auto my-2 h-px w-7 bg-line" aria-hidden="true" />
          )}
          <div className="grid gap-1">
            {group.items.map((item: WorkspaceNavItem) => {
              const Icon = ICON_BY_ROUTE[item.key];
              const mode = role ? getWorkspaceAccessMode(role, item.key) : 'denied';
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  title={collapsed && !mobile ? item.label : undefined}
                  aria-label={collapsed && !mobile ? item.label : undefined}
                  onClick={() => { if (mobile) setMobileOpen(false); }}
                  className={({ isActive }) =>
                    'group flex min-h-9 min-w-0 items-center gap-2.5 rounded-control border px-2.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel ' +
                    (isActive
                      ? 'border-accent/20 bg-accent/10 font-semibold text-fg'
                      : 'border-transparent text-muted hover:bg-bg hover:text-fg')
                  }
                >
                  <Icon size={15} className="shrink-0" aria-hidden="true" />
                  {(!collapsed || mobile) && (
                    <>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {mode === 'read-only' && (
                        <span className="shrink-0 rounded-badge border border-line px-1.5 py-0.5 text-[9px] font-medium text-muted">Read-only</span>
                      )}
                      {mode === 'aggregate' && (
                        <span className="shrink-0 rounded-badge border border-info/25 bg-info/10 px-1.5 py-0.5 text-[9px] font-medium text-info">Aggregate</span>
                      )}
                    </>
                  )}
                  {collapsed && !mobile && <span className="sr-only">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );

  const renderSidebar = (mobile = false) => (
    <>
      <div className="flex h-[52px] min-h-[52px] items-center gap-2.5 border-b border-line px-3.5">
        <AmsBrandLogo className="h-7 w-7 shrink-0" />
        {(!collapsed || mobile) && (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="truncate text-[13px] font-semibold text-fg">KAPITECH</span>
              <span className="rounded-badge border border-accent/25 bg-accent/8 px-1.5 py-0.5 text-[10px] font-semibold text-accent-text">AMS</span>
            </div>
            <p className="mt-1 truncate text-[10px] text-muted">Agency Workspace</p>
          </div>
        )}
        {mobile && (
          <button type="button" aria-label="Close workspace navigation" onClick={() => setMobileOpen(false)} className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <X size={16} />
          </button>
        )}
        {!mobile && (
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((value) => !value)}
            className={(!collapsed ? 'ml-auto ' : 'mx-auto ') + 'hidden h-7 w-7 shrink-0 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-[900px]:inline-flex'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>
      {renderNavigation(visibleGroups, mobile)}
      {(!collapsed || mobile) && (
        <div className="border-t border-line p-3">
          <div className="flex min-w-0 items-center gap-2.5 rounded-control px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-[11px] font-semibold text-fg">
              {displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-fg">{displayName}</p>
              <p className="truncate text-[10px] text-muted">{role ? ROLE_LABELS[role] : rawRole}</p>
            </div>
          </div>
          <button type="button" onClick={confirmLogout} className="mt-1 flex min-h-8 w-full items-center gap-2 rounded-control px-2.5 text-[11px] font-medium text-muted hover:bg-bg hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <LogOut size={14} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="ams-shell flex min-h-screen w-full bg-bg text-fg font-sans antialiased">
      <aside
        aria-label="Primary workspace sidebar"
        className={(collapsed ? 'w-[64px] ' : 'w-[220px] ') + 'hidden h-screen shrink-0 flex-col border-r border-line bg-panel transition-[width] duration-150 min-[900px]:flex'}
      >
        {renderSidebar(false)}
      </aside>

      {mobileOpen && (
        <div className="ams-mobile-drawer fixed inset-0 z-[70] min-[900px]:hidden" role="presentation">
          <button type="button" aria-label="Close navigation overlay" onClick={() => setMobileOpen(false)} className="absolute inset-0 h-full w-full bg-black/60" />
          <aside data-workspace-mobile-panel className="relative flex h-full w-[min(300px,86vw)] max-w-[86vw] flex-col border-r border-line bg-panel">
            {renderSidebar(true)}
          </aside>
        </div>
      )}

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] min-h-[52px] min-w-0 items-center justify-between gap-3 border-b border-line bg-panel px-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button type="button" aria-label="Open workspace navigation" onClick={() => setMobileOpen(true)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-[900px]:hidden">
              <Menu size={17} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-fg">{pageTitle}</p>
              <p className="hidden truncate text-[10px] text-muted sm:block">Kapitech Agency Management System</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="hidden max-w-[160px] truncate rounded-badge border border-line px-2 py-1 text-[10px] font-medium text-muted sm:inline-flex">
              {role ? ROLE_LABELS[role] : rawRole}
            </span>
            <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title={theme === 'dark' ? 'Light theme' : 'Dark theme'} className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button type="button" onClick={confirmLogout} aria-label="Sign out" title="Sign out" className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <LogOut size={15} />
            </button>
          </div>
        </header>
        <div className="ams-content min-h-0 w-full flex-1 overflow-y-auto">
          <Outlet context={{ role, user }} />
        </div>
      </main>
    </div>
  );
};

export default WorkspaceLayout;
