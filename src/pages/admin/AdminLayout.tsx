import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import { getAdminSession, logoutAdmin } from '../../lib/adminAuth';
import { useLanguage } from '../../lib/LanguageContext';
import { CommandPalette } from '../../components/admin/CommandPalette';
import { AdminNotificationCenter } from '../../components/admin/AdminNotificationCenter';
import { Modal } from '../../components/ui/Modal';
import { AGENCY_TIER_LABELS, getAgencyTier } from '../../lib/rbacEngine';
import { getAmsRole } from '../../lib/amsNavigationAccess';
import { getAmsModuleSubnavigation, isAmsModuleSubnavigationItemActive, type AmsSidebarModuleKey } from '../../lib/amsModuleSubnavigation';
import { AdminSectionTabs } from '../../components/admin/AdminModulePrimitives';
import { AmsBrandLogo } from '../../components/admin/AmsBrandLogo';
import UserProfileSettingsModal from '../../components/admin/UserProfileSettingsModal';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
import { GlobalTimerControl } from '../../components/admin/GlobalTimerControl';
import { AdminSystemSettingsNavigation, DynamicAdminSidebarNavigation } from '../../components/admin/DynamicAdminSidebar';
import Button from '../../components/ui/Button';
import { ReportingPeriodProvider } from '../../lib/ReportingPeriodContext';
import { AdminReportingPeriodBar } from '../../components/admin/AdminReportingPeriodBar';

const DEFAULT_PROFILE_NAME = 'Fikri Nurlete';
const DEFAULT_PROFILE_TITLE = 'Stakeholder account';

export const AdminLayout: React.FC = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const session = getAdminSession();
  const amsRole = getAmsRole(session?.user);

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
  const profileTitle = session?.user?.role || DEFAULT_PROFILE_TITLE;
  const workspaceNavigationModule: AmsSidebarModuleKey | null = (() => {
    const path = location.pathname;

    if (path === '/admin/dashboard') return 'dashboard';
    if (path === '/admin/finance' || path.startsWith('/admin/finance/')) return 'finance';
    if (path === '/admin/projects' || path === '/admin/tasks') return 'projects';
    if (path === '/admin/clients' || path.startsWith('/admin/clients/') || path === '/admin/contracts') return 'clients';
    if (path === '/admin/team' || path === '/admin/time-logs' || path === '/admin/vendors') return 'team';
    if (path.startsWith('/admin/cms/')) return 'cms';
    if (path === '/admin/settings' || path === '/admin/navigation/release-readiness') return 'settings';
    return null;
  })();

  const mfaSetupRequired = Boolean(
    session?.user
    && (new URLSearchParams(location.search).get('mfaRequired') === '1' || session.user.mfaEnabled !== true)
  );
  const workspaceTabItems = workspaceNavigationModule
    ? getAmsModuleSubnavigation(workspaceNavigationModule, amsRole, mfaSetupRequired)
    : [];
  const activeWorkspaceTab = workspaceTabItems.find((item) =>
    isAmsModuleSubnavigationItemActive(item, location.pathname, location.search, location.hash)
  );



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

        <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain px-3.5 py-4 custom-scrollbar">
          <DynamicAdminSidebarNavigation role={amsRole} pathname={location.pathname} search={location.search} hash={location.hash} />
        </div>
        <div className="shrink-0 border-t border-line bg-panel px-3.5 pb-3.5 pt-3">
          <AdminSystemSettingsNavigation role={amsRole} pathname={location.pathname} search={location.search} hash={location.hash} />
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

          <div className="flex items-center gap-2" aria-label="Kapitech AMS">
            <AmsBrandLogo compact className="h-6 w-6 shrink-0" />
            <span className="font-sans font-semibold text-fg text-xs block truncate">KAPITECH AMS</span>
          </div>
        </div>

        <div
          className="ams-mobile-topbar-actions flex min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain custom-scrollbar"
          tabIndex={0}
          role="region"
          aria-label="Mobile workspace controls"
          data-ams-slug="mobile-workspace-controls"
        >
          <AdminReportingPeriodBar />
          <Button
            type="button"
            variant="secondary"
            aria-label="Search everything in AMS"
            aria-keyshortcuts="Control+K Meta+K"
            onClick={() => setCommandPaletteOpen(true)}
            icon={<Search size={15} />}
            className="ams-topbar-icon h-8 w-8 p-0"
          />
          <GlobalTimerControl userId={session?.user?.id} />
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
            actionMenu
            onEdit={() => setProfileView('edit')}
            onLogout={handleLogout}
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

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 custom-scrollbar">
              <DynamicAdminSidebarNavigation role={amsRole} pathname={location.pathname} search={location.search} hash={location.hash} onNavigate={() => setMobileMenuOpen(false)} />
            </div>
            <div className="shrink-0 border-t border-line bg-bg px-2.5 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5">
              <AdminSystemSettingsNavigation role={amsRole} pathname={location.pathname} search={location.search} hash={location.hash} onNavigate={() => setMobileMenuOpen(false)} />
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
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Search everything in AMS"
                aria-keyshortcuts="Control+K Meta+K"
                icon={<Search size={14} />}
                className="h-8 shrink-0 justify-start gap-2 border-line bg-bg px-2.5"
              >
                <span className="hidden text-[11px] font-medium sm:inline">Search Everything</span>
                <kbd className="hidden rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] text-muted md:inline">⌘K</kbd>
              </Button>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <AdminReportingPeriodBar />
              <GlobalTimerControl userId={session?.user?.id} />
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
                actionMenu
                onEdit={() => setProfileView('edit')}
                onLogout={handleLogout}
                slug="topbar-profile-mobile"
              />
            </div>
          </div>
        </header>
        {/* Module tabs belong to the shared topbar, not inside individual page headers. */}
        {workspaceTabItems.length > 0 && (
          <div
            className="ams-workspace-topbar-nav sticky top-0 z-20 border-b border-line bg-panel min-[900px]:top-[52px]"
            data-ams-slug="workspace-topbar-navigation"
          >
            <div className="mx-auto w-full max-w-[1560px] min-w-0 px-3 sm:px-5 lg:px-6">
              <AdminSectionTabs
                ariaLabel="Module navigation"
                activeKey={activeWorkspaceTab?.key || ''}
                items={workspaceTabItems}
                className="w-full py-2"
              />
            </div>
          </div>
        )}
        <div className="ams-content flex-1 min-h-0 w-full max-w-[1560px] mx-auto">
          <Outlet />
        </div>

      </main>

      </div>
    </ReportingPeriodProvider>
  );
};
export default AdminLayout;