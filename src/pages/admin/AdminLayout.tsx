import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Link, NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Home,
  Briefcase,
  Landmark,
  Settings,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Search,
  ClipboardCheck,
  UsersRound,
  LockKeyhole,
  ServerCog
} from 'lucide-react';
import { getAdminSession, logoutAdmin } from '../../lib/adminAuth';
import { useLanguage } from '../../lib/LanguageContext';
import { CommandPalette } from '../../components/admin/CommandPalette';
import { AdminNotificationCenter } from '../../components/admin/AdminNotificationCenter';
import { Modal } from '../../components/ui/Modal';
import { useRbacRole } from '../../lib/rbacEngine';
import { AmsBrandLogo } from '../../components/admin/AmsBrandLogo';
import UserAvatar from '../../components/admin/UserAvatar';
import UserProfileSettingsModal from '../../components/admin/UserProfileSettingsModal';
import Button from '../../components/ui/Button';

interface NavItem {
  key: string;
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: string | number | null;
  badgeColor?: string;
  exact?: boolean;
}

type AdminNavItem = NavItem & { accessKey?: string };

const STITCH_NAV_ITEMS: AdminNavItem[] = [
  { key: 'dashboard', to: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { key: 'clients', to: '/admin/clients', label: 'Clients', icon: UsersRound },
  { key: 'projects', to: '/admin/projects', label: 'Projects', icon: Briefcase, badge: 14 },
  { key: 'tasks', to: '/admin/dashboard?view=tasks', label: 'Tasks', icon: ClipboardCheck, badge: 3, accessKey: 'projects' },
  { key: 'team', to: '/admin/time-logs', label: 'Team', icon: UsersRound, accessKey: 'timelogs' },
  { key: 'finance', to: '/admin/invoicing', label: 'Finance', icon: Landmark, accessKey: 'invoicing' },
  { key: 'documents', to: '/admin/documents', label: 'Documents Vault', icon: LockKeyhole, badge: 'Encrypted' },
  { key: 'system', to: '/admin/settings', label: 'System', icon: ServerCog, accessKey: 'settings' },
];

const DEFAULT_PROFILE_NAME = 'Fikri Nurlete';
const DEFAULT_PROFILE_TITLE = 'Stakeholder account';

export const AdminLayout: React.FC = () => {
  const { language } = useLanguage();
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
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [profileName, setProfileName] = useState(
    session?.user.profileDisplayName || DEFAULT_PROFILE_NAME
  );
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(
    () => session?.user.avatarUrl || null
  );
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
    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ name?: string; avatarUrl?: string | null }>).detail;
      if (detail?.name) setProfileName(detail.name);
      setProfileAvatarUrl(detail?.avatarUrl || null);
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
      const closeButton = document.querySelector<HTMLElement>('.ams-mobile-drawer button[aria-label="Close navigation menu"]');
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

  const filteredNavItems = useMemo(
    () => STITCH_NAV_ITEMS.filter((item) => isAllowed(item.accessKey || item.key)),
    [isAllowed]
  );

  const settingsAllowed = isAllowed('settings');
  const profileTitle = session?.user?.role || DEFAULT_PROFILE_TITLE;

  // Helper to determine if a navigation item is active, including Stitch dashboard view query tabs.
  const isItemActive = (itemTo: string) => {
    const [path, queryString] = itemTo.split('?');
    if (location.pathname !== path) return false;

    if (queryString) {
      const expected = new URLSearchParams(queryString);
      const actual = new URLSearchParams(location.search);
      return Array.from(expected.entries()).every(([key, value]) => actual.get(key) === value);
    }

    if (path === '/admin/dashboard') {
      return !location.search;
    }

    if (path === '/admin/settings') {
      return !location.search.includes('tab=rbac');
    }

    return true;
  };

  const activeNavItem = filteredNavItems.find((item) => isItemActive(item.to));
  const activeItemLabel = activeNavItem?.label || 'Dashboard';
  const activeSectionLabel = 'Workspace';

  return (
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
        <div className="relative flex h-[52px] shrink-0 items-center border-b border-line px-3">
          <Link to="/admin/dashboard" aria-label="Kapitech AMS dashboard" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-control px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg">
              <AmsBrandLogo className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="truncate text-[13px] font-semibold text-fg">KAPITECH</span>
                <span className="rounded-badge border border-accent/25 bg-accent/8 px-1.5 py-0.5 text-[9px] font-semibold text-accent-text">AMS</span>
              </div>
              <p className="mt-1 truncate text-[10px] text-muted">Agency Management System</p>
            </div>
          </Link>
        </div>

        <div className="px-3 pt-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Search AMS"
            aria-keyshortcuts="Control+K Meta+K"
            icon={<Search size={15} />}
            className="flex h-9 w-full justify-start border-line bg-bg px-3"
          >
            <span className="min-w-0 flex-1 truncate text-left text-xs">Search</span>
            <kbd className="ml-auto rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] text-muted">⌘K</kbd>
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 custom-scrollbar">
          <nav aria-label="Primary navigation" className="space-y-0.5">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.to);
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative flex min-h-10 items-center gap-2.5 rounded-control px-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? 'bg-accent/10 text-accent-text' : 'text-muted hover:bg-panel-hover hover:text-fg'}`}
                >
                  <Icon size={16} strokeWidth={active ? 2.1 : 1.8} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="shrink-0 rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] font-semibold text-muted">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 border-t border-line bg-panel px-3 pb-3 pt-3">
          {settingsAllowed && (
            <Link
              to="/admin/settings"
              aria-current={location.pathname.startsWith('/admin/settings') ? 'page' : undefined}
              className={`flex min-h-10 items-center gap-2.5 rounded-control px-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${location.pathname.startsWith('/admin/settings') ? 'bg-accent/10 text-accent-text' : 'text-muted hover:bg-panel-hover hover:text-fg'}`}
            >
              <Settings size={16} />
              <span className="flex-1">Settings</span>
            </Link>
          )}
          <div className="mt-2 flex items-center justify-between px-2.5 text-[10px] text-muted">
            <span>Kapitech AMS</span>
            <span>v2.4.0</span>
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
        open={profileSettingsOpen}
        onClose={() => setProfileSettingsOpen(false)}
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
            className="min-h-10 min-w-10 flex items-center justify-center rounded-control bg-bg text-fg border border-line transition-[background-color,border-color,color,transform] duration-150 hover:bg-panel-hover hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Menu size={20} />
          </button>

          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-control border border-line bg-bg shrink-0">
              <AmsBrandLogo compact className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="font-sans font-semibold text-fg text-xs block truncate">KAPITECH AMS</span>
              <span className="text-[9px] font-sans text-muted block truncate -mt-0.5">{activeItemLabel}</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Search AMS"
            aria-keyshortcuts="Control+K Meta+K"
            icon={<Search size={15} />}
            className="h-10 w-10 p-0"
          />
          <AdminNotificationCenter />
          <button
            type="button"
            onClick={() => setProfileSettingsOpen(true)}
            aria-label="Open profile settings"
            title="Profile settings"
            className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-panel text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <UserAvatar name={profileName} imageUrl={profileAvatarUrl} size="sm" />
          </button>
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
                <div className="flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg">
                  <AmsBrandLogo className="h-4 w-4" />
                </div>
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
                <span className="min-w-0 flex-1 truncate text-left text-xs">Search</span>
                <kbd className="ml-auto rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] text-muted">⌘K</kbd>
              </Button>
            </div>

            <nav aria-label="Primary navigation" className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 custom-scrollbar">
              <div className="space-y-0.5">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.to);
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex min-h-10 items-center gap-3 rounded-control px-3 py-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? 'bg-accent/10 font-semibold text-accent-text' : 'text-muted hover:bg-panel-hover hover:text-fg'}`}
                    >
                      <Icon size={17} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge !== null && item.badge !== undefined && (
                        <span className="shrink-0 rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] font-semibold text-muted">{item.badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="shrink-0 border-t border-line bg-bg px-2.5 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5">
              <div className="rounded-card border border-line bg-panel p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setProfileSettingsOpen(true);
                  }}
                  aria-label="Open profile settings"
                  className="flex min-h-10 w-full items-center gap-2 rounded-control px-1.5 py-1 text-left hover:bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <UserAvatar name={profileName} imageUrl={profileAvatarUrl} size="sm" online />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-fg">{profileName}</div>
                    <div className="mt-0.5 truncate text-[10px] text-muted">{profileTitle}</div>
                  </div>
                </button>
                <div className="mt-1.5 flex items-center gap-1.5 border-t border-line pt-1.5">
                  {settingsAllowed && (
                    <Link
                      to="/admin/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-control border border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <Settings size={16} />
                      <span className="text-xs font-medium">Settings</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                    className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    aria-label="Sign out"
                    icon={<LogOut size={14} />}
                    className="h-10 w-10 shrink-0 p-0"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between px-2.5 pb-1 text-[10px] text-muted">
                <span>Kapitech AMS</span><span>v2.4.0</span>
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
          <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-5 lg:px-6 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {location.pathname === '/admin/dashboard' ? (
                <nav aria-label="Dashboard view" className="flex items-center gap-1">
                  {[
                    { key: 'overview', label: 'Overview', search: '' },
                    { key: 'performance', label: 'Performance', search: '?view=performance' },
                    { key: 'analytics', label: 'Analytics', search: '?view=analytics' },
                  ].map((tab) => (
                    <NavLink
                      key={tab.key}
                      to={`/admin/dashboard${tab.search}`}
                      end
                      className={() => {
                        const activeView = new URLSearchParams(location.search).get('view') || 'overview';
                        return `inline-flex h-9 items-center rounded-chip px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${activeView === tab.key ? 'bg-line text-fg' : 'text-muted hover:bg-bg hover:text-fg'}`;
                      }}
                    >
                      {tab.label}
                    </NavLink>
                  ))}
                </nav>
              ) : (
                <nav aria-label="Breadcrumb">
                  <ol className="flex min-w-0 items-center gap-2 text-xs">
                    <li className="shrink-0 font-medium text-muted">{activeSectionLabel}</li>
                    <li aria-hidden="true" className="shrink-0 text-muted/60">/</li>
                    <li aria-current="page" className="min-w-0 truncate font-semibold text-fg">{activeItemLabel}</li>
                  </ol>
                </nav>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="secondary"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                className="h-10 w-10 p-0"
              />
              <AdminNotificationCenter />
              <button
                type="button"
                onClick={() => setProfileSettingsOpen(true)}
                aria-label="Open profile settings"
                title="Profile settings"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <UserAvatar name={profileName} imageUrl={profileAvatarUrl} size="sm" />
              </button>
            </div>
          </div>
        </header>

        {/* View Outlet */}
        <div className="flex-1 min-h-0 p-6 w-full max-w-[1560px] mx-auto">
          <Outlet />
        </div>

      </main>

    </div>
  );
};
export default AdminLayout;