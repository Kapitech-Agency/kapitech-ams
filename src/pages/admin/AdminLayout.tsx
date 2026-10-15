import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Link, NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Home,
  Inbox,
  Briefcase,
  Landmark,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Search,
  ClipboardCheck,
  Clock3,
  UsersRound,
  LockKeyhole,
  LayoutGrid,
  Building2,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { getAdminSession, logoutAdmin } from '../../lib/adminAuth';
import { useLanguage } from '../../lib/LanguageContext';
import { CommandPalette } from '../../components/admin/CommandPalette';
import { AdminNotificationCenter } from '../../components/admin/AdminNotificationCenter';
import { Modal } from '../../components/ui/Modal';
import { AGENCY_TIER_LABELS, AgencyTier, getAgencyTier, useRbacRole } from '../../lib/rbacEngine';
import { AmsBrandLogo } from '../../components/admin/AmsBrandLogo';
import UserProfileSettingsModal from '../../components/admin/UserProfileSettingsModal';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
import { AdminTopbarTabs } from '../../components/admin/AdminModulePrimitives';
import { FINANCE_WORKBOOK_GROUPS } from '../../lib/financeWorkbook';
import Button from '../../components/ui/Button';
import { ReportingPeriodProvider } from '../../lib/ReportingPeriodContext';
import { AdminReportingPeriodBar } from '../../components/admin/AdminReportingPeriodBar';

type AdminNavGroup = 'Overview' | 'Sales' | 'Delivery' | 'Finance' | 'Content' | 'Operations';

interface NavItem {
  key: string;
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: string | number | null;
  badgeColor?: string;
  exact?: boolean;
  group: AdminNavGroup;
  requiredTier: AgencyTier;
}

type AdminNavItem = NavItem & { accessKey?: string; anyAccessKeys?: string[] };

// Sidebar items represent modules only. Feature views stay inside each module.
const NAV_GROUPS: AdminNavGroup[] = ['Overview', 'Sales', 'Delivery', 'Finance', 'Content', 'Operations'];

const STITCH_NAV_ITEMS: AdminNavItem[] = [
  { key: 'dashboard', to: '/admin/dashboard', label: 'Dashboard', icon: Home, requiredTier: 2, group: 'Overview' },
  { key: 'inbox', to: '/admin/inbox', label: 'Inbox', icon: Inbox, accessKey: 'inbox', requiredTier: 2, group: 'Sales' },
  { key: 'crm', to: '/admin/crm', label: 'CRM', icon: Briefcase, accessKey: 'crm', requiredTier: 3, group: 'Sales' },
  { key: 'proposals', to: '/admin/proposals', label: 'Proposals', icon: FileText, accessKey: 'proposals', requiredTier: 3, group: 'Sales' },
  { key: 'clients', to: '/admin/clients/all-clients', label: 'Clients', icon: UsersRound, requiredTier: 3, group: 'Sales' },
  { key: 'projects', to: '/admin/projects', label: 'Projects', icon: Briefcase, requiredTier: 3, group: 'Delivery' },
  { key: 'tasks', to: '/admin/tasks', label: 'Tasks', icon: ClipboardCheck, accessKey: 'projects', requiredTier: 3, group: 'Delivery' },
  { key: 'team', to: '/admin/team', label: 'Team', icon: UsersRound, accessKey: 'timelogs', requiredTier: 3, group: 'Delivery' },
  { key: 'time-logs', to: '/admin/time-logs', label: 'Time', icon: Clock3, accessKey: 'timelogs', requiredTier: 3, group: 'Delivery' },
  { key: 'finance', to: '/admin/finance', label: 'Finance', icon: Landmark, accessKey: 'invoicing', requiredTier: 2, group: 'Finance' },
  { key: 'vendors', to: '/admin/vendors', label: 'Vendors', icon: Building2, accessKey: 'vendors', requiredTier: 3, group: 'Finance' },
  { key: 'cms', to: '/admin/cms/projects', label: 'Website', icon: LayoutGrid, anyAccessKeys: ['cms_projects', 'services', 'testimonials', 'cms_insights'], requiredTier: 3, group: 'Content' },
  { key: 'documents', to: '/admin/documents', label: 'Documents', icon: LockKeyhole, requiredTier: 3, group: 'Operations' },
  { key: 'approvals', to: '/admin/approvals', label: 'Approvals', icon: ShieldCheck, accessKey: 'approvals', requiredTier: 3, group: 'Operations' },
];

const DEFAULT_PROFILE_NAME = 'Fikri Nurlete';
const DEFAULT_PROFILE_TITLE = 'Stakeholder account';

export const AdminLayout: React.FC = () => {
  const { language, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const session = getAdminSession();
  const { isAllowed } = useRbacRole(
    session?.user?.stakeholderType,
    session?.user?.division,
    session?.user?.role,
    session?.user?.permissions
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [profileView, setProfileView] = useState<'edit' | null>(null);
  const [profileName, setProfileName] = useState(
    session?.user.profileDisplayName || DEFAULT_PROFILE_NAME
  );
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(
    () => session?.user.avatarUrl || null
  );
  const [profileBio, setProfileBio] = useState(() => session?.user.bio || '');
  const [profilePersonalEmail, setProfilePersonalEmail] = useState(() => session?.user.personalEmail || '');
  const [profileAdditionalPhone, setProfileAdditionalPhone] = useState(() => session?.user.additionalPhone || '');
  const [profilePhone, setProfilePhone] = useState(() => session?.user.phone || '');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = window.localStorage.getItem('kapitech_ams_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch {
      return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem('kapitech_ams_theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOpenCommandPalette = () => setCommandPaletteOpen(true);
    window.addEventListener('open_command_palette', handleOpenCommandPalette);
    return () => window.removeEventListener('open_command_palette', handleOpenCommandPalette);
  }, []);

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ name?: string; avatarUrl?: string | null; bio?: string; personalEmail?: string; additionalPhone?: string; phone?: string }>).detail;
      if (detail?.name) setProfileName(detail.name);
      if ('avatarUrl' in (detail || {})) setProfileAvatarUrl(detail?.avatarUrl || null);
      if (typeof detail?.bio === 'string') setProfileBio(detail.bio);
      if (typeof detail?.personalEmail === 'string') setProfilePersonalEmail(detail.personalEmail);
      if (typeof detail?.additionalPhone === 'string') setProfileAdditionalPhone(detail.additionalPhone);
      if (typeof detail?.phone === 'string') setProfilePhone(detail.phone);
    };

    window.addEventListener('kapitech_profile_updated', handleProfileUpdated);
    return () => window.removeEventListener('kapitech_profile_updated', handleProfileUpdated);
  }, []);

  // Mobile navigation is a true drawer: lock the page, trap keyboard focus, and restore focus on close.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const getFocusable = () => {
      const drawer = document.querySelector<HTMLElement>('.ams-mobile-drawer > .relative');
      if (!drawer) return [];
      return Array.from(drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.getClientRects().length > 0);
    };

    const focusFirstControl = () => {
      const closeButton = document.querySelector<HTMLElement>('.ams-mobile-drawer > .relative button[aria-label="Close navigation menu"]');
      (closeButton || getFocusable()[0])?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileMenuOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const frame = window.requestAnimationFrame(focusFirstControl);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement?.isConnected) previousActiveElement.focus();
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => setLogoutConfirmOpen(true);

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const agencyTier = getAgencyTier(
    session?.user?.stakeholderType,
    session?.user?.division,
    session?.user?.role
  );
  const hasAgencyTier = (requiredTier: AgencyTier) => agencyTier <= requiredTier;

  const filteredNavItems = useMemo(() => {
    const seen = new Set<string>();
    const allowed = STITCH_NAV_ITEMS.filter(
      (item) => hasAgencyTier(item.requiredTier) && (item.anyAccessKeys ? item.anyAccessKeys.some((accessKey) => isAllowed(accessKey)) : isAllowed(item.accessKey || item.key))
    ).filter((item) => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });

    return allowed.map((item) => {
      if (item.key !== 'cms') return item;
      const firstAllowedSection = [
        ['cms_projects', '/admin/cms/projects'],
        ['services', '/admin/cms/services'],
        ['testimonials', '/admin/cms/testimonials'],
        ['cms_insights', '/admin/cms/insights'],
      ] as const;
      const destination = firstAllowedSection.find(([permission]) => isAllowed(permission))?.[1] || item.to;
      return { ...item, to: destination };
    });
  }, [agencyTier, isAllowed]);

  const canOpenMasterSettings = hasAgencyTier(1) && isAllowed('settings');
  const profileTitle = session?.user?.role || DEFAULT_PROFILE_TITLE;

  // Helper to determine if a navigation item is active, including Stitch dashboard view query tabs.
  const isItemActive = (itemTo: string) => {
    const [path, queryString] = itemTo.split('?');
    const actual = new URLSearchParams(location.search);

    if (path === '/admin/clients/all-clients' && location.pathname.startsWith('/admin/clients/')) return true;
    if (['/admin/cms/projects', '/admin/cms/services', '/admin/cms/testimonials', '/admin/cms/insights', '/admin/cms/careers'].includes(path) && location.pathname.startsWith('/admin/cms/')) return true;
    if (path === '/admin/tasks' && location.pathname === '/admin/dashboard' && actual.get('view') === 'tasks') return true;
    if (location.pathname !== path) return false;

    if (queryString) {
      const expected = new URLSearchParams(queryString);
      return Array.from(expected.entries()).every(([key, value]) => actual.get(key) === value);
    }

    if (path === '/admin/dashboard') return actual.get('view') !== 'tasks';
    if (path === '/admin/team') return !['vendor-directory', 'skill-matrix', 'time-logs'].includes(actual.get('view') || '');
    if (path === '/admin/settings') return !actual.has('tab') || actual.get('tab') !== 'rbac';

    return true;
  };

  const activeNavItem = filteredNavItems.find((item) => isItemActive(item.to));
  const activeItemLabel = activeNavItem?.label || 'Dashboard';
  const getGroupItems = (group: AdminNavGroup) => filteredNavItems.filter((item) => item.group === group);

  return (
    <ReportingPeriodProvider>
      <div className="h-screen w-full bg-bg text-fg flex flex-col min-[900px]:flex-row selection:bg-accent selection:text-fg font-sans antialiased overflow-hidden ams-shell">
      
      {/* Universal Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />

      {/* ------------------------------------------------------------- */}
      {/* DESKTOP SIDEBAR */}
      <motion.aside
        initial={false}
        animate={{ width: 220 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="hidden min-[900px]:flex w-[220px] shrink-0 flex-col relative bg-panel border-r border-line h-full z-30 overflow-hidden"
      >
        <div className="relative flex h-[52px] min-h-[52px] shrink-0 items-center border-b border-line px-3.5">
          <Link to="/admin/dashboard" aria-label="Kapitech AMS dashboard" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-control px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <AmsBrandLogo className="h-7 w-7 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="truncate text-[13px] font-semibold text-fg">KAPITECH</span>
                <span className="rounded-badge border border-accent/25 bg-accent/8 px-1.5 py-0.5 text-[10px] font-semibold text-accent-text">AMS</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="px-3.5 pt-3.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Search AMS"
            aria-keyshortcuts="Control+K Meta+K"
            icon={<Search size={15} />}
            className="flex h-10 w-full justify-start border-line bg-bg px-3"
          >
            <span className="min-w-0 flex-1 truncate text-left text-xs text-muted">Search</span>
            <kbd className="ml-auto rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] text-muted">⌘K</kbd>
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain px-3.5 py-4 custom-scrollbar">
          <nav aria-label="Primary navigation" className="space-y-4">
            {NAV_GROUPS.map((group) => {
              const items = getGroupItems(group);
              if (!items.length) return null;
              return (
                <section key={group} aria-label={group}>
                  <div className="px-2 pb-1.5 text-[10px] font-medium tracking-wide text-muted">{group}</div>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active = isItemActive(item.to);
                      return (
                        <Link
                          key={item.key}
                          to={item.to}
                          aria-current={active ? "page" : undefined}
                          className={["group relative flex min-h-10 items-center gap-2.5 rounded-control px-2.5 text-[12px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent", active ? "border border-accent/25 bg-accent/10 text-fg" : "border border-transparent text-muted hover:border-line hover:bg-bg/70 hover:text-fg"].join(" ")}
                        >
                          {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-accent" aria-hidden="true" />}
                          <span className={["flex h-7 w-7 shrink-0 items-center justify-center", active ? "text-fg" : "text-muted group-hover:text-fg"].join(" ")}>
                            <Icon size={15} strokeWidth={active ? 2.1 : 1.8} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.badge !== null && item.badge !== undefined && (
                            <span className={["shrink-0 rounded-badge border px-1.5 py-0.5 text-[10px] font-semibold", active ? "border-accent/15 bg-bg text-muted" : "border-line bg-bg text-muted"].join(" ")}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </nav>
        </div>
        <div className="shrink-0 border-t border-line bg-panel px-3.5 pb-3.5 pt-3">
          <div className="grid grid-cols-2 gap-2">
            {canOpenMasterSettings && (
            <Link
              to="/admin/settings"
              aria-current={location.pathname === '/admin/settings' ? 'page' : undefined}
              className={[
                "flex min-h-10 items-center justify-center rounded-control border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                location.pathname === '/admin/settings'
                  ? "border-accent/25 bg-accent/10 text-fg"
                  : "border-line bg-bg text-muted hover:border-accent/40 hover:bg-panel-hover hover:text-fg"
              ].join(" ")}
            >
              Settings
            </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              aria-pressed={logoutConfirmOpen}
              className={[
                "flex min-h-10 items-center justify-center rounded-control border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                logoutConfirmOpen
                  ? "border-danger/30 bg-danger/10 text-danger"
                  : "border-line bg-bg text-muted hover:border-danger/40 hover:bg-danger/10 hover:text-danger active:bg-danger/10 active:text-danger"
              ].join(" ")}
            >
              Sign out
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 px-2.5 pb-1 text-[10px] text-muted">
            <span className="truncate">{AGENCY_TIER_LABELS[agencyTier]}</span>
            <span className="shrink-0">Tier {agencyTier}</span>
          </div>
        </div>
      </motion.aside>

      <Modal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        size="sm"
        title={language === 'id' ? 'Keluar dari AMS?' : 'Sign out of AMS?'}
        description={language === 'id' ? 'Sesi Anda akan diakhiri pada perangkat ini.' : 'Your current AMS session will be ended on this device.'}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setLogoutConfirmOpen(false)}>
              {language === 'id' ? 'Tetap masuk' : 'Stay signed in'}
            </Button>
            <Button type="button" variant="destructive" onClick={confirmLogout} icon={<LogOut size={14} />}>
              {language === 'id' ? 'Keluar' : 'Sign out'}
            </Button>
          </>
        )}
      >
        <div className="flex items-start gap-3 rounded-card border border-danger/20 bg-danger/5 p-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-danger/20 bg-danger/10 text-danger">
            <LogOut size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-fg">{language === 'id' ? 'Konfirmasi keluar' : 'Confirm sign out'}</p>
            <p className="mt-1 text-[11px] leading-5 text-muted">{language === 'id' ? 'Anda dapat masuk kembali kapan saja dengan akun AMS yang sama.' : 'You can sign in again at any time with the same AMS account.'}</p>
          </div>
        </div>
      </Modal>

      <UserProfileSettingsModal
        open={profileView === 'edit'}
        onClose={() => setProfileView(null)}
        displayName={profileName}
        title={profileTitle}
      />

      {/* ------------------------------------------------------------- */}
      {/* MOBILE TOPBAR - Single, sleek, non-cluttered header */}
      {/* ------------------------------------------------------------- */}
      <div className="min-[900px]:hidden ams-mobile-topbar flex items-center justify-between gap-2 px-3 bg-panel border-b border-line sticky top-0 z-40 shrink-0 h-[52px] min-h-[52px] pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="min-h-10 min-w-10 flex items-center justify-center rounded-control bg-bg text-fg border border-line transition-[background-color,border-color,color,transform] duration-150 hover:bg-panel-hover hover:border-accent/30 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Menu size={20} />
          </button>

          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <AmsBrandLogo compact className="h-6 w-6 shrink-0" />
            <div className="min-w-0">
              <span className="font-sans font-semibold text-fg text-xs block truncate">KAPITECH AMS</span>
              <span className="text-[11px] font-sans text-muted block truncate -mt-0.5">{activeItemLabel}</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <AdminReportingPeriodBar />
          <AdminNotificationCenter />
          <Button
            type="button"
            variant="secondary"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            icon={theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            className="ams-topbar-icon h-8 w-8 p-0"
          />
          <ProfileIdentity
            profile={{
              id: session?.user?.id,
              name: profileName,
              role: profileTitle,
              division: session?.user?.division,
              username: session?.user?.username,
              companyEmail: session?.user?.email,
              personalEmail: profilePersonalEmail,
              phone: profilePhone,
              additionalPhone: profileAdditionalPhone,
              bio: profileBio,
              avatarUrl: profileAvatarUrl,
              lastActive: session?.user?.lastLogin,
              status: 'active'
            }}
            compact
            size="sm"
            directOpen
            onEdit={() => setProfileView('edit')}
            slug="topbar-profile-mobile"
              />
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="min-[900px]:hidden ams-mobile-drawer fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="AMS navigation"
        >
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 bg-bg/80 cursor-default"
            onClick={() => setMobileMenuOpen(false)}
          />

          <motion.div
            initial={{ x: -16, opacity: 0.98 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative z-50 flex h-[100dvh] w-[300px] max-w-[86vw] flex-col overflow-hidden border-r border-line bg-panel"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-panel p-3.5">
              <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                <AmsBrandLogo className="h-7 w-7 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                    <span>KAPITECH</span>
                    <span className="rounded-badge border border-accent/30 px-1.5 py-0.5 text-xs text-accent-text">AMS</span>
                  </div>
                  <p className="mt-[-2px] text-[10px] text-muted">Agency Management System</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCommandPaletteOpen(true);
                }}
                aria-label="Search AMS"
                aria-keyshortcuts="Control+K Meta+K"
                icon={<Search size={15} />}
                className="flex h-9 w-full justify-start border-line bg-bg px-3"
              >
                <span className="min-w-0 flex-1 truncate text-left text-xs text-muted">Search</span>
                <kbd className="ml-auto rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] text-muted">⌘K</kbd>
              </Button>
            </div>

            <nav aria-label="Primary navigation" className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 custom-scrollbar">
              <div className="space-y-4">
                {NAV_GROUPS.map((group) => {
                  const items = getGroupItems(group);
                  if (!items.length) return null;
                  return (
                    <section key={group} aria-label={group}>
                      <div className="px-2 pb-1.5 text-[10px] font-medium tracking-wide text-muted">{group}</div>
                      <div className="space-y-1">
                        {items.map((item) => {
                          const Icon = item.icon;
                          const active = isItemActive(item.to);
                          return (
                            <Link
                              key={item.key}
                              to={item.to}
                              onClick={() => setMobileMenuOpen(false)}
                              aria-current={active ? "page" : undefined}
                              className={["group relative flex min-h-10 items-center gap-2.5 rounded-control px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent", active ? "border border-accent/25 bg-accent/10 font-semibold text-fg" : "border border-transparent text-muted hover:border-line hover:bg-bg/70 hover:text-fg"].join(" ")}
                            >
                              {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-accent" aria-hidden="true" />}
                              <span className={["flex h-7 w-7 shrink-0 items-center justify-center", active ? "text-fg" : "text-muted group-hover:text-fg"].join(" ")}>
                                <Icon size={16} strokeWidth={active ? 2.1 : 1.8} />
                              </span>
                              <span className="min-w-0 flex-1 truncate">{item.label}</span>
                              {item.badge !== null && item.badge !== undefined && (
                                <span className="shrink-0 rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] font-semibold text-muted">{item.badge}</span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </nav>
            <div className="shrink-0 border-t border-line bg-bg px-2.5 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5">
              <div className="grid grid-cols-2 gap-2">
                {canOpenMasterSettings && (
                  <Link
                    to="/admin/settings"
                    onClick={() => setMobileMenuOpen(false)}
                  aria-current={location.pathname === '/admin/settings' ? 'page' : undefined}
                  className={[
                    "flex min-h-10 items-center justify-center rounded-control border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    location.pathname === '/admin/settings'
                      ? "border-accent/25 bg-accent/10 text-fg"
                      : "border-line bg-panel text-muted hover:border-accent/40 hover:bg-panel-hover hover:text-fg"
                  ].join(" ")}
                >
                  Settings
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  aria-pressed={logoutConfirmOpen}
                  className={[
                    "flex min-h-10 items-center justify-center rounded-control border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    logoutConfirmOpen
                      ? "border-danger/30 bg-danger/10 text-danger"
                      : "border-line bg-panel text-muted hover:border-danger/40 hover:bg-danger/10 hover:text-danger active:bg-danger/10 active:text-danger"
                  ].join(" ")}
                >
                  Sign out
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 px-2.5 pb-1 text-[10px] text-muted">
                <span className="truncate">{AGENCY_TIER_LABELS[agencyTier]}</span>
                <span className="shrink-0">Tier {agencyTier}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA & DESKTOP STICKY TOPBAR */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-y-auto overscroll-none bg-bg custom-scrollbar">
        
        {/* Sticky desktop top bar */}
        <header className="hidden min-[900px]:flex h-[52px] min-h-[52px] border-b border-line bg-panel sticky top-0 z-30 items-center shrink-0" aria-label="AMS top bar">
          <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-5 lg:px-6 flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0 flex-1 overflow-hidden">
              {location.pathname.startsWith('/admin/clients') ? (
                <AdminTopbarTabs
                  ariaLabel="Clients sections"
                  activeKey={location.pathname === '/admin/clients/retainers' ? 'retainers' : location.pathname === '/admin/clients/sla-monitoring' ? 'sla-monitoring' : location.pathname === '/admin/clients' || location.pathname === '/admin/clients/all-clients' ? 'all-clients' : ''}
                  items={[
                    { key: 'all-clients', label: 'All Clients', to: '/admin/clients/all-clients' },
                    { key: 'retainers', label: 'Retainers', to: '/admin/clients/retainers' },
                    { key: 'sla-monitoring', label: 'SLA', to: '/admin/clients/sla-monitoring' }
                  ]}
                />
              ) : location.pathname.startsWith('/admin/cms/') ? (
                <AdminTopbarTabs
                  ariaLabel="CMS sections"
                  activeKey={location.pathname.split('/').pop() || 'projects'}
                  items={[
                    { key: 'projects', label: 'Projects', to: '/admin/cms/projects', slug: 'cms-tab-projects' },
                    { key: 'services', label: 'Services', to: '/admin/cms/services', slug: 'cms-tab-services' },
                    { key: 'testimonials', label: 'Testimonials', to: '/admin/cms/testimonials', slug: 'cms-tab-testimonials' },
                    { key: 'insights', label: 'Insights', to: '/admin/cms/insights', slug: 'cms-tab-insights' },
                    { key: 'careers', label: 'Careers', to: '/admin/cms/careers', slug: 'cms-tab-careers' }
                  ]}
                />
              ) : location.pathname === '/admin/dashboard' && new URLSearchParams(location.search).get('view') !== 'tasks' ? (
                <AdminTopbarTabs
                  ariaLabel="Dashboard view"
                  activeKey={new URLSearchParams(location.search).get('view') || 'overview'}
                  items={[
                    { key: 'overview', label: 'Overview', to: '/admin/dashboard' },
                    { key: 'performance', label: 'Performance', to: '/admin/dashboard?view=performance' },
                    { key: 'analytics', label: 'Analytics', to: '/admin/dashboard?view=analytics' }
                  ]}
                />
              ) : location.pathname === '/admin/projects' ? (
                <AdminTopbarTabs
                  ariaLabel="Projects sections"
                  activeKey={new URLSearchParams(location.search).get('projects') || 'all'}
                  items={[
                    { key: 'all', label: 'All Projects', to: '/admin/projects' },
                    { key: 'sprint', label: 'Delivery', to: '/admin/projects?projects=sprint' },
                    { key: 'budget', label: 'Budget', to: '/admin/projects?projects=budget' },
                    { key: 'archived', label: 'Archived', to: '/admin/projects?projects=archived' }
                  ]}
                />
              ) : location.pathname === '/admin/dashboard' && new URLSearchParams(location.search).get('view') === 'tasks' ? (
                <AdminTopbarTabs
                  ariaLabel="Tasks sections"
                  activeKey={new URLSearchParams(location.search).get('taskscope') || 'all'}
                  items={[
                    { key: 'all', label: 'All Tasks', to: '/admin/dashboard?view=tasks', slug: 'task-tab-all' },
                    { key: 'my', label: 'My Tasks', to: '/admin/dashboard?view=tasks&taskscope=my', slug: 'task-tab-my' },
                    { key: 'due', label: 'Due', to: '/admin/dashboard?view=tasks&taskscope=due', slug: 'task-tab-due' },
                    { key: 'review', label: 'Review', to: '/admin/dashboard?view=tasks&taskscope=review', slug: 'task-tab-review' },
                    { key: 'blocked', label: 'Blocked', to: '/admin/dashboard?view=tasks&taskscope=blocked', slug: 'task-tab-blocked' },
                    { key: 'completed', label: 'Completed', to: '/admin/dashboard?view=tasks&taskscope=completed', slug: 'task-tab-completed' }
                  ]}
                />
              ) : location.pathname === '/admin/tasks' ? (
                <AdminTopbarTabs
                  ariaLabel="Tasks sections"
                  activeKey={new URLSearchParams(location.search).get('taskscope') || 'all'}
                  items={[
                    { key: 'all', label: 'All Tasks', to: '/admin/tasks', slug: 'task-tab-all' },
                    { key: 'my', label: 'My Tasks', to: '/admin/tasks?taskscope=my', slug: 'task-tab-my' },
                    { key: 'due', label: 'Due', to: '/admin/tasks?taskscope=due', slug: 'task-tab-due' },
                    { key: 'review', label: 'Review', to: '/admin/tasks?taskscope=review', slug: 'task-tab-review' },
                    { key: 'blocked', label: 'Blocked', to: '/admin/tasks?taskscope=blocked', slug: 'task-tab-blocked' },
                    { key: 'completed', label: 'Completed', to: '/admin/tasks?taskscope=completed', slug: 'task-tab-completed' }
                  ]}
                />
              ) : location.pathname === '/admin/inbox' ? (
                <AdminTopbarTabs
                  ariaLabel="Inbox sections"
                  activeKey={new URLSearchParams(location.search).get('view') || 'overview'}
                  items={[
                    { key: 'overview', label: 'Overview', to: '/admin/inbox?view=overview', slug: 'inbox-tab-overview' },
                    { key: 'client', label: 'Clients', to: '/admin/inbox?view=client', slug: 'inbox-tab-client' },
                    { key: 'jobs', label: 'Jobs', to: '/admin/inbox?view=jobs', slug: 'inbox-tab-jobs' },
                    { key: 'starred', label: 'Starred', to: '/admin/inbox?view=starred', slug: 'inbox-tab-starred' }
                  ]}
                />
              ) : location.pathname === '/admin/finance' ? (
                <AdminTopbarTabs
                  ariaLabel={t('admin.finance.sections')}
                  activeKey={(() => {
                    const requestedTab = new URLSearchParams(location.search).get('tab') || 'executive-summary';
                    return FINANCE_WORKBOOK_GROUPS.find((group) => group.items.some((item) => item.key === requestedTab))?.key || 'overview';
                  })()}
                  items={[
                    { key: 'overview', label: t('admin.finance.tab.overviewControl'), to: '/admin/finance?tab=executive-summary', slug: 'finance-tab-overview-control' },
                    { key: 'transactions', label: t('admin.finance.tab.transactionsCash'), to: '/admin/finance?tab=cash-bank', slug: 'finance-tab-transactions-cash' },
                    { key: 'receivables', label: t('admin.finance.tab.receivablesPayables'), to: '/admin/finance?tab=accounts-receivable', slug: 'finance-tab-receivables-payables' },
                    { key: 'projects', label: t('admin.finance.tab.projectFinance'), to: '/admin/finance?tab=project-finance', slug: 'finance-tab-project-finance' },
                    { key: 'accounting', label: t('admin.finance.tab.accountingReports'), to: '/admin/finance?tab=journal', slug: 'finance-tab-accounting-reports' }
                  ]}
                />
              ) : location.pathname === '/admin/team' ? (
                <AdminTopbarTabs
                  ariaLabel="Team sections"
                  activeKey={new URLSearchParams(location.search).get('view') || 'team-directory'}
                  items={[
                    { key: 'team-directory', label: 'Team Directory', to: '/admin/team' },
                    { key: 'capacity-allocation', label: 'Capacity', to: '/admin/team?view=capacity-allocation' }
                  ]}
                />
              ) : location.pathname === '/admin/vendors' ? (
                <AdminTopbarTabs
                  ariaLabel="Vendors sections"
                  activeKey={new URLSearchParams(location.search).get('view') || 'vendor-directory'}
                  items={[
                    { key: 'vendor-directory', label: 'Vendor Directory', to: '/admin/vendors' },
                    { key: 'skill-matrix', label: 'Skills', to: '/admin/vendors?view=skill-matrix' }
                  ]}
                />
              ) : location.pathname === '/admin/settings' ? (
                <AdminTopbarTabs
                  ariaLabel="Settings sections"
                  activeKey={(() => {
                    const activeTab = new URLSearchParams(location.search).get('tab') || 'overview';
                    if (['profile', 'rbac'].includes(activeTab)) return 'security';
                    if (['branding', 'api'].includes(activeTab)) return 'integrations';
                    return activeTab;
                  })()}
                  items={[
                    { key: 'overview', label: 'Overview', to: '/admin/settings?tab=overview' },
                    { key: 'audit', label: 'Audit Logs', to: '/admin/settings?tab=audit' },
                    { key: 'security', label: 'Security', to: '/admin/settings?tab=security' },
                    { key: 'integrations', label: 'Integrations', to: '/admin/settings?tab=integrations' }
                  ]}
                />
              ) : location.pathname === '/admin/documents' ? (
                <AdminTopbarTabs
                  ariaLabel="Documents sections"
                  activeKey={new URLSearchParams(location.search).get('documents') || 'all'}
                  items={[
                    { key: 'all', label: 'All Documents', to: '/admin/documents', slug: 'documents-tab-all' },
                    { key: 'sops', label: 'Policies', to: '/admin/documents?documents=sops', slug: 'documents-tab-sops' },
                    { key: 'legal', label: 'Legal', to: '/admin/documents?documents=legal', slug: 'documents-tab-legal' },
                    { key: 'finance', label: 'Finance', to: '/admin/documents?documents=finance', slug: 'documents-tab-finance' },
                    { key: 'infra', label: 'Access', to: '/admin/documents?documents=infra', slug: 'documents-tab-infra' }
                  ]}
                />
              ) : (
                <nav aria-label="Current module">
                  <span aria-current="page" className="min-w-0 truncate text-[11px] font-semibold text-fg">{activeItemLabel}</span>
                </nav>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <AdminReportingPeriodBar />
              <AdminNotificationCenter />
              <Button
                type="button"
                variant="ghost"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                className="h-8 w-8 p-0"
              />
              <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden="true" />
              <ProfileIdentity
                profile={{
                  id: session?.user?.id,
                  name: profileName,
                  role: profileTitle,
                  division: session?.user?.division,
                  username: session?.user?.username,
                  companyEmail: session?.user?.email,
                  personalEmail: session?.user?.personalEmail,
                  phone: session?.user?.phone,
                  additionalPhone: session?.user?.additionalPhone,
                  bio: session?.user?.bio,
                  avatarUrl: profileAvatarUrl,
                  lastActive: session?.user?.lastLogin,
                  status: 'active'
                }}
                size="sm"
                directOpen
                onEdit={() => setProfileView('edit')}
                slug="topbar-profile-mobile"
              />
            </div>
          </div>
        </header>
        {/* View Outlet */}
        <div className="ams-content flex-1 min-h-0 w-full max-w-[1560px] mx-auto">
          <Outlet />
        </div>

      </main>

      </div>
    </ReportingPeriodProvider>
  );
};
export default AdminLayout;