import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Home,
  Inbox,
  Users,
  Receipt,
  Briefcase,
  Landmark,
  Shield,
  Layers,
  FileText,
  Clock3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  HelpCircle,
  Search
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

interface NavSection {
  id: string;
  titleKey: string;
  items: NavItem[];
}

const DEFAULT_PROFILE_NAME = 'Fikri Nurlete';
const DEFAULT_PROFILE_TITLE = 'Chief Executive Officer';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('kapitech_ams_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('kapitech_ams_sidebar_collapsed', sidebarCollapsed ? '1' : '0');
    } catch {}
  }, [sidebarCollapsed]);
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
    try { return window.localStorage.getItem('kapitech_ams_theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
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

  // 4 Logical Sections (with Consolidated Single Settings U('menu'))
  const navSections: NavSection[] = [
    {
      id: 'core',
      titleKey: 'admin.nav.coreOperations',
      items: [
        { key: 'dashboard', to: '/admin/dashboard', label: t('admin.nav.dashboard'), icon: Home, badge: null },
        { key: 'inbox', to: '/admin/inbox', label: t('admin.nav.inbox'), icon: Inbox, badge: null },
        { key: 'crm', to: '/admin/crm', label: t('admin.nav.crm'), icon: Users, badge: null },
        { key: 'clients', to: '/admin/clients', label: t('admin.nav.clients'), icon: Users, badge: null },
        { key: 'projects', to: '/admin/projects', label: t('admin.nav.projects'), icon: Briefcase, badge: null }
      ]
    },
    {
      id: 'finance',
      titleKey: 'admin.nav.financeRevenue',
      items: [
        { key: 'proposals', to: '/admin/proposals', label: language === 'id' ? 'Proposal & Penawaran' : 'Proposals & quotes', icon: Receipt, badge: null },
        { key: 'invoicing', to: '/admin/invoicing', label: t('admin.nav.invoicing'), icon: Landmark, badge: null },
        { key: 'approvals', to: '/admin/approvals', label: language === 'id' ? 'Pusat persetujuan' : 'Approval center', icon: Shield, badge: null }
      ]
    },
    {
      id: 'delivery',
      titleKey: 'admin.nav.delivery',
      items: [
        { key: 'vendors', to: '/admin/vendors', label: t('admin.nav.vendors'), icon: Briefcase, badge: null },
        { key: 'documents', to: '/admin/documents', label: language === 'id' ? 'Dokumen' : 'Documents', icon: FileText, badge: null },
        { key: 'timelogs', to: '/admin/time-logs', label: language === 'id' ? 'Pelacakan waktu' : 'Time tracking', icon: Clock3, badge: null }
      ]
    },
    {
      id: 'content',
      titleKey: 'admin.nav.contentPortfolio',
      items: [
        { key: 'services', to: '/admin/cms/services', label: t('admin.nav.servicesCatalog'), icon: Layers, badge: null },
        { key: 'cms_projects', to: '/admin/cms/projects', label: t('admin.nav.caseStudies'), icon: Layers, badge: null },
        { key: 'testimonials', to: '/admin/cms/testimonials', label: t('admin.cms.testiTitle'), icon: Users, badge: null }
      ]
    },
    {
      id: 'admin',
      titleKey: 'admin.nav.administration',
      items: [
        { key: 'settings', to: '/admin/settings', label: t('admin.nav.settings'), icon: Settings, badge: null }
      ]
    }
  ];

  // RBAC Filtered Sections: dynamically show only modules permitted for the current stakeholder role
  const filteredNavSections = useMemo(() => {
    return navSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => isAllowed(item.key))
      }))
      .filter(section => section.items.length > 0);
  }, [navSections, isAllowed]);
  const settingsAllowed = isAllowed('settings');
  const contentNavSections = filteredNavSections.filter((section) => section.id !== 'admin');

  // Helper to determine if link is active
  const isItemActive = (itemTo: string) => {
    if (itemTo.includes('tab=')) {
      const [path, query] = itemTo.split('?');
      return location.pathname === path && location.search.includes(query);
    }
    if (itemTo === '/admin/settings') {
      return location.pathname === '/admin/settings' && !location.search.includes('tab=rbac');
    }
    if (location.pathname === itemTo) return true;
    if (itemTo !== '/admin/dashboard' && itemTo !== '/admin/settings' && location.pathname.startsWith(itemTo)) {
      return true;
    }
    return false;
  };

  // Current location labels used by the utility bar.
  let activeItemLabel = 'Dashboard';
  let activeSectionLabel = '';
  if (location.pathname === '/admin/settings') {
    activeItemLabel = t('admin.nav.settings');
    activeSectionLabel = t('admin.nav.administration');
  } else {
    for (const section of navSections) {
      for (const item of section.items) {
        if (isItemActive(item.to)) {
          activeItemLabel = item.label;
          activeSectionLabel = t(section.titleKey);
          break;
        }
      }
      if (activeSectionLabel) break;
    }
  }

  if (!activeSectionLabel) {
    activeSectionLabel = t('admin.nav.coreOperations');
  }

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
        animate={{ width: sidebarCollapsed ? 64 : 220 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={`hidden min-[900px]:flex flex-col relative bg-panel border-r border-line shrink-0 h-full z-30 overflow-visible ${sidebarCollapsed ? 'ams-sidebar-collapsed' : 'ams-sidebar-expanded'}`}
      >
        <div className="relative flex h-14 shrink-0 items-center border-b border-line px-2.5">
          <Link to="/admin/dashboard" aria-label="Kapitech AMS dashboard" className={`group flex min-h-10 items-center rounded-control px-2 transition-colors duration-150 hover:bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="h-9 w-9 rounded-control bg-bg border border-line p-1.5 flex items-center justify-center shrink-0 transition-colors duration-150 group-hover:border-accent/40">
              <AmsBrandLogo className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-2 leading-none">
                  <span className="text-[13px] font-semibold text-fg whitespace-nowrap">KAPITECH</span>
                  <span className="shrink-0 rounded-badge border border-accent/25 bg-accent/8 px-1.5 py-0.5 text-[9px] font-semibold text-accent-text">AMS</span>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-muted whitespace-nowrap">Agency Management System</p>
              </div>
            )}
          </Link>
        </div>
        <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar ${sidebarCollapsed ? 'px-2 py-3' : 'px-2.5 py-3'}`}>
          <div className={sidebarCollapsed ? 'space-y-2' : 'space-y-4'}>
            {contentNavSections.map((section) => (
              <div key={section.id} className="space-y-1">
                {!sidebarCollapsed && <div className="px-2.5 pb-1 text-[10px] font-semibold text-muted">{t(section.titleKey)}</div>}
                {sidebarCollapsed && <div className="mx-auto mb-2 h-px w-5 bg-line" />}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.to);
                    return (
                      <Link key={item.to} to={item.to} title={sidebarCollapsed ? item.label : undefined} aria-current={active ? 'page' : undefined}
                        className={`group flex min-h-10 items-center rounded-control text-[13px] font-medium transition-[background-color,color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel active:scale-[0.985] ${sidebarCollapsed ? 'mx-auto h-10 w-10 justify-center px-0' : 'gap-2.5 px-2.5'} ${active ? 'bg-accent/14 text-fg' : 'text-muted hover:bg-panel-hover hover:text-fg'}`}>
                        <Icon size={16} strokeWidth={active ? 2.1 : 1.8} className={`shrink-0 transition-colors duration-150 ${active ? 'text-accent-text' : 'text-muted group-hover:text-fg'}`} />
                        {!sidebarCollapsed && <span className="min-w-0 truncate">{item.label}</span>}
                        {!sidebarCollapsed && item.badge !== null && item.badge !== undefined && <span className="ml-auto shrink-0 rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] font-semibold text-muted">{item.badge}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 border-t border-line bg-panel px-2 pb-2">
          <div className={`flex min-h-10 items-center rounded-control border border-line bg-bg px-1.5 ${sidebarCollapsed ? 'justify-center' : 'gap-1.5'}`}>
            <button
              type="button"
              onClick={() => setProfileSettingsOpen(true)}
              aria-label="Open profile settings"
              title="Profile settings"
              className={`group flex min-h-9 min-w-0 items-center rounded-control px-1.5 py-1 text-left transition-colors duration-150 hover:bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${sidebarCollapsed ? 'justify-center' : 'flex-1 gap-2'}`}
            >
              <UserAvatar name={profileName} imageUrl={profileAvatarUrl} size="sm" online />
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-fg">{profileName}</div>
                  <div className="mt-0.5 truncate text-[10px] text-muted">{DEFAULT_PROFILE_TITLE}</div>
                </div>
              )}
            </button>

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
        title={DEFAULT_PROFILE_TITLE}
      />

      {/* ------------------------------------------------------------- */}
      {/* MOBILE TOPBAR - Single, sleek, non-cluttered header */}
      {/* ------------------------------------------------------------- */}
      <div className="min-[900px]:hidden ams-mobile-topbar flex items-center justify-between gap-2 px-3 bg-panel border-b border-line sticky top-0 z-40 shrink-0 h-[52px] min-h-[52px] pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="min-h-10 min-w-10 flex items-center justify-center rounded-control bg-bg text-fg border border-line transition-[background-color,border-color,color,transform] duration-150 hover:bg-panel-hover hover:border-accent/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
          {settingsAllowed && (
            <Link
              to="/admin/settings"
              aria-label="Open settings"
              className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-panel text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Settings size={16} />
            </Link>
          )}
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
            icon={<LogOut size={14} strokeWidth={1.9} />}
            className="h-10 w-10 shrink-0 p-0"
          />
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
        </div>
      </div>

      {/* Mobile Drawer Overlay & U('menu') (Global standard sliding drawer from left) */}
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
            className="fixed inset-0 bg-bg/80 transition-opacity cursor-default"
            onClick={() => setMobileMenuOpen(false)}
          />

          <motion.div initial={{ x: -16, opacity: 0.98 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.18, ease: "easeOut" }} className="relative w-[300px] max-w-[86vw] bg-panel border-r border-line h-[100dvh] flex flex-col justify-between z-50 overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-line flex items-center justify-between gap-2 bg-panel shrink-0">
              <Link 
                to="/admin/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="h-8 px-2.5 rounded-control bg-bg border border-line flex items-center justify-center shrink-0">
                  <AmsBrandLogo className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-sans font-semibold text-fg text-sm flex items-center gap-1.5">
                    <span>KAPITECH</span>
                    <span className="text-xs font-sans px-1.5 py-0.5 rounded-badge text-accent-text border border-accent/30 font-semibold">
                      AMS
                    </span>
                  </div>
                  <p className="text-[10px] font-sans text-muted -mt-0.5">Agency Management System</p>
                </div>
              </Link>

              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="min-h-10 min-w-10 flex items-center justify-center rounded-control bg-bg text-muted border border-line transition-[background-color,border-color,color,transform] duration-150 hover:bg-panel-hover hover:border-accent/30 hover:text-fg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Navigation List Filtered by Dynamic RBAC */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-4 custom-scrollbar">
              {contentNavSections.map((section) => (
                <div key={section.id} className="space-y-1">
                  <div className="text-[11px] font-sans text-muted font-medium px-3 pt-1">
                    {t(section.titleKey)}
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.to);

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`relative flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-sans transition-[background-color,color,transform] duration-150 min-h-10 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel active:scale-[0.985] ${
                          active 
                            ? 'bg-accent/15 text-fg font-semibold ' 
                            : 'text-muted hover:text-fg hover:bg-panel-hover'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon size={17} className={active ? 'text-accent-text shrink-0' : 'text-muted shrink-0'} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== null && item.badge !== undefined && (
                          <span className={`px-2 py-0.5 rounded-badge text-[10px] font-semibold shrink-0 ${item.badgeColor || 'bg-bg text-muted border border-line'}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}

            </div>

            {/* Bottom session details */}
            <div className="shrink-0 border-t border-line bg-bg px-2.5 pb-2.5 pt-2">
              <div className="flex items-center gap-1.5 rounded-card border border-line bg-panel p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setProfileSettingsOpen(true);
                  }}
                  aria-label="Open profile settings"
                  className="group flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-control px-1.5 py-1 text-left transition-colors hover:bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <UserAvatar name={profileName} imageUrl={profileAvatarUrl} size="sm" online />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-fg">{profileName}</div>
                    <div className="mt-0.5 truncate text-[10px] text-muted">{DEFAULT_PROFILE_TITLE}</div>
                  </div>
                </button>
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
        <header className="hidden min-[900px]:flex h-14 border-b border-line bg-panel sticky top-0 z-30 items-center shrink-0" aria-label="AMS top bar">
          <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-5 lg:px-6 flex items-center justify-between gap-4">
            <div className="min-w-0 flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSidebarCollapsed(v => !v)}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                icon={sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                className="h-9 w-9 shrink-0 p-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-muted">{activeSectionLabel}</span>
                  <span className="text-[11px] text-muted">/</span>
                  <span className="truncate text-[13px] font-semibold text-fg">{activeItemLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Search AMS"
                aria-keyshortcuts="Control+K Meta+K"
                icon={<Search size={15} />}
                className="hidden lg:flex h-10 w-[260px] xl:w-[320px] justify-start border-line bg-bg px-3"
              >
                <span className="min-w-0 flex-1 truncate text-left text-xs">Search AMS</span>
                <kbd className="ml-auto rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] text-muted">⌘K</kbd>
              </Button>
              <Link
                to="/admin/settings?tab=audit"
                aria-label="Open help and audit"
                title="Help and audit"
                className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-panel text-muted transition-colors hover:border-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <HelpCircle size={16} />
              </Link>
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
              {settingsAllowed && (
                <Link
                  to="/admin/settings"
                  aria-label="Open settings"
                  title="Settings"
                  className={`flex h-10 w-10 items-center justify-center rounded-control border border-line transition-colors hover:border-accent/40 hover:bg-accent/8 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${location.pathname.startsWith('/admin/settings') ? 'bg-accent/10 text-accent-text' : 'bg-panel text-muted'}`}
                >
                  <Settings size={16} />
                </Link>
              )}
              <Button
                type="button"
                variant="destructive"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
                icon={<LogOut size={14} strokeWidth={1.9} />}
                className="h-10 w-10 shrink-0 p-0"
              />
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