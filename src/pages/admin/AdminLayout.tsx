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
  UserCircle,
  HelpCircle
} from 'lucide-react';
import { getAdminSession, logoutAdmin } from '../../lib/adminAuth';
import { useLanguage } from '../../lib/LanguageContext';
import { CommandPalette } from '../../components/admin/CommandPalette';
import { AdminNotificationCenter } from '../../components/admin/AdminNotificationCenter';
import { Modal } from '../../components/ui/Modal';
import { useRbacRole } from '../../lib/rbacEngine';
import { AmsBrandLogo } from '../../components/admin/AmsBrandLogo';
import { DropdownPortal } from '../../components/ui/DropdownPortal';

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

export const AdminLayout: React.FC = () => {
  const { language, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const session = getAdminSession();
  const { roleMeta, isAllowed } = useRbacRole(
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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return window.localStorage.getItem('kapitech_ams_theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileTriggerRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem('kapitech_ams_theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
        {
          key: 'dashboard',
          to: '/admin/dashboard',
          label: t('admin.nav.dashboard'),
          icon: Home,
          badge: null
        },
        {
          key: 'inbox',
          to: '/admin/inbox',
          label: t('admin.nav.inbox'),
          icon: Inbox,
          badge: null
        },
        {
          key: 'crm',
          to: '/admin/crm',
          label: t('admin.nav.crm'),
          icon: Users,
          badge: null
        },
        {
          key: 'proposals',
          to: '/admin/proposals',
          label: language === 'id' ? 'Proposal & Penawaran' : 'Proposals & Quotes',
          icon: Receipt,
          badge: null
        },
        {
          key: 'projects',
          to: '/admin/projects',
          label: t('admin.nav.projects'),
          icon: Briefcase,
          badge: null
        }
      ]
    },
    {
      id: 'finance',
      titleKey: 'admin.nav.financeRevenue',
      items: [
        {
          key: 'invoicing',
          to: '/admin/invoicing',
          label: t('admin.nav.invoicing'),
          icon: Landmark,
          badge: null
        },
        {
          key: 'clients',
          to: '/admin/clients',
          label: t('admin.nav.clients'),
          icon: Users,
          badge: null
        },
        {
          key: 'vendors',
          to: '/admin/vendors',
          label: t('admin.nav.vendors'),
          icon: Briefcase,
          badge: null
        },
        {
          key: 'approvals',
          to: '/admin/approvals',
          label: language === 'id' ? 'Pusat Persetujuan' : 'Approval Center',
          icon: Shield,
          badge: null
        }
      ]
    },
    {
      id: 'content',
      titleKey: 'admin.nav.contentPortfolio',
      items: [
        {
          key: 'services',
          to: '/admin/cms/services',
          label: t('admin.nav.servicesCatalog'),
          icon: Layers,
          badge: null
        },
        {
          key: 'cms_projects',
          to: '/admin/cms/projects',
          label: t('admin.nav.caseStudies'),
          icon: Layers,
          badge: null
        },
        {
          key: 'testimonials',
          to: '/admin/cms/testimonials',
          label: t('admin.cms.testiTitle'),
          icon: Users,
          badge: null
        },
        {
          key: 'documents',
          to: '/admin/documents',
          label: language === 'id' ? 'Dokumen' : 'Documents',
          icon: FileText,
          badge: null
        },
        {
          key: 'timelogs',
          to: '/admin/time-logs',
          label: language === 'id' ? 'Pelacakan Waktu' : 'Time Tracking',
          icon: Clock3,
          badge: null
        }
      ]
    },
    {
      id: 'admin',
      titleKey: 'admin.nav.administration',
      items: [
        {
          key: 'settings',
          to: '/admin/settings',
          label: t('admin.nav.settings'),
          icon: Settings,
          badge: null
        },
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

  const settingsItem = filteredNavSections
    .find((section) => section.id === 'admin')
    ?.items.find((item) => item.key === 'settings');
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

  // Find active item label for breadcrumb
  let activeItemLabel = 'Dashboard';
  if (location.pathname === '/admin/settings') {
    activeItemLabel = t('admin.nav.settings');
  } else {
    for (const section of navSections) {
      for (const item of section.items) {
        if (isItemActive(item.to)) {
          activeItemLabel = item.label;
          break;
        }
      }
    }
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
        className={`hidden min-[900px]:flex flex-col bg-panel border-r border-line shrink-0 h-full z-30 overflow-hidden ${sidebarCollapsed ? 'ams-sidebar-collapsed' : 'ams-sidebar-expanded'}`}
      >
        <div className="shrink-0 px-2.5 py-2 border-b border-line">
          <div className={`flex items-center min-w-0 ${sidebarCollapsed ? 'justify-center' : 'gap-2'}`}>
            <Link to="/admin/dashboard" aria-label="Kapitech AMS dashboard" className={`group flex min-w-0 flex-1 items-center rounded-control min-h-10 transition-colors duration-150 hover:bg-panel-hover focus-visible:outline-none ${sidebarCollapsed ? 'justify-center px-1' : 'gap-3 px-2'}`}>
              <div className="h-9 w-9 rounded-control bg-bg border border-line p-1.5 flex items-center justify-center shrink-0 transition-colors duration-150 group-hover:border-accent/40">
                <AmsBrandLogo className="h-5 w-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 py-0.5">
                  <div className="flex items-center gap-2 leading-none">
                    <span className="text-[13px] font-semibold tracking-[0.01em] text-fg whitespace-nowrap">KAPITECH</span>
                    <span className="shrink-0 rounded-badge border border-accent/25 bg-accent/8 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.04em] text-accent-text">AMS</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-muted whitespace-nowrap">Agency Management System</p>
                </div>
              )}
            </Link>
            <button type="button" onClick={() => setSidebarCollapsed(v => !v)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`ams-sidebar-toggle group shrink-0 flex h-7 w-7 items-center justify-center rounded-control border border-line bg-panel text-muted transition-[background-color,border-color,color,transform] duration-150 ease-out hover:border-accent/30 hover:bg-panel-hover hover:text-fg active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${sidebarCollapsed ? 'absolute right-2 top-2' : ''}`}>
              {sidebarCollapsed ? <ChevronRight size={13} strokeWidth={2} /> : <ChevronLeft size={13} strokeWidth={2} />}
            </button>
          </div>
        </div>
        <div className={`flex-1 min-h-0 overflow-hidden ${sidebarCollapsed ? 'px-2 py-3' : 'px-2.5 py-3'}`}>
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
        {settingsItem && (
          <div className="shrink-0 px-2.5 pb-1">
            <Link to={settingsItem.to} title={sidebarCollapsed ? settingsItem.label : undefined} aria-current={isItemActive(settingsItem.to) ? 'page' : undefined}
              className={`group flex min-h-10 items-center rounded-control text-[13px] font-medium transition-[background-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel active:scale-[0.985] ${sidebarCollapsed ? 'mx-auto h-10 w-10 justify-center px-0' : 'gap-2.5 px-2.5'} ${isItemActive(settingsItem.to) ? 'bg-accent/12 text-fg' : 'text-muted hover:bg-panel-hover hover:text-fg'}`}>
              <Settings size={16} strokeWidth={isItemActive(settingsItem.to) ? 2.1 : 1.8} className={`shrink-0 transition-colors duration-150 ${isItemActive(settingsItem.to) ? 'text-accent-text' : 'text-muted group-hover:text-fg'}`} />
              {!sidebarCollapsed && <span className="truncate">{settingsItem.label}</span>}
            </Link>
          </div>
        )}
        <div className={`shrink-0 border-t border-line bg-panel px-2.5 py-2 ${sidebarCollapsed ? 'space-y-2' : ''}`}>
          <div className={`group flex min-h-10 items-center rounded-control transition-colors duration-150 hover:bg-panel-hover ${sidebarCollapsed ? 'justify-center' : 'gap-2.5 px-1.5'}`}>
            <div className="h-8 w-8 rounded-control bg-accent/90 border border-accent/30 flex items-center justify-center text-xs font-semibold text-fg shrink-0">{roleMeta.accountProfile.avatarLabel}</div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-fg">{roleMeta.accountProfile.displayName}</div>
                <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-muted"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" /><span className="truncate">{roleMeta.accountProfile.accountId}</span></div>
              </div>
            )}
            <button type="button" onClick={handleLogout} aria-label={t('admin.nav.logout')} title={t('admin.nav.logout')}
              className={`group/logout flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted transition-[background-color,border-color,color,transform] duration-150 hover:border-danger/30 hover:bg-danger/10 hover:text-danger active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${sidebarCollapsed ? '' : 'ml-auto'}`}>
              <LogOut size={15} strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </motion.aside>

      <Modal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        size="sm"
        title={language === 'id' ? 'Keluar dari AMS?' : 'Sign out of AMS?'}
        description={t('admin.nav.logoutConfirm')}
        footer={(
          <>
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(false)}
              className="min-h-10 w-full sm:w-auto px-3 rounded-control border border-line bg-panel text-xs font-medium text-muted hover:text-fg hover:bg-panel-hover"
            >
              {language === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={confirmLogout}
              className="min-h-10 w-full sm:w-auto px-3 rounded-control bg-danger/10 border border-danger/30 text-danger hover:bg-danger/15 text-xs font-semibold"
            >
              {language === 'id' ? 'Keluar' : 'Sign out'}
            </button>
          </>
        )}
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
          <button type="button" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-panel text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
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

          <motion.div initial={{ x: -16, opacity: 0.98 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.18, ease: "easeOut" }} className="relative w-[300px] max-w-[88vw] bg-panel border-r border-line h-[100dvh] flex flex-col justify-between z-50 overflow-hidden">
            
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

            {/* Settings remains pinned above the session controls */}
            {settingsItem && (
              <div className="px-3 pb-2 pt-1 border-t border-line bg-panel shrink-0">
                <Link
                  to={settingsItem.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-control text-xs font-sans min-h-10 transition-[background-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel active:scale-[0.985] ${
                    isItemActive(settingsItem.to)
                      ? 'bg-accent/15 text-fg font-medium'
                      : 'text-muted hover:text-fg hover:bg-bg'
                  }`}
                >
                  <Settings size={16} className={isItemActive(settingsItem.to) ? 'text-accent-text' : 'text-muted'} />
                  <span>{settingsItem.label}</span>
                </Link>
              </div>
            )}

            {/* Bottom session details */}
            <div className="p-3.5 border-t border-line bg-bg flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-control bg-accent border border-line flex items-center justify-center text-xs font-sans text-fg font-semibold shrink-0 ">
                  {roleMeta.accountProfile.avatarLabel}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-fg truncate">{roleMeta.accountProfile.displayName}</div>
                  <div className="text-xs font-sans text-muted truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                    <span className="truncate">{roleMeta.accountProfile.accountId}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="px-3 py-2 min-h-[40px] rounded-control bg-panel border border-line text-muted text-xs font-sans flex items-center gap-1.5 shrink-0 transition-[background-color,border-color,color,transform] duration-150 hover:bg-panel-hover hover:border-danger/30 hover:text-danger active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              >
                <LogOut size={14} />
                <span>{t('admin.nav.logout')}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA & DESKTOP STICKY TOPBAR */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-y-auto overscroll-none bg-bg custom-scrollbar">
        
        {/* Sticky desktop top bar */}
        <header className="hidden min-[900px]:flex h-[52px] border-b border-line bg-panel sticky top-0 z-30 items-center shrink-0" aria-label="AMS top bar">
          <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-5 lg:px-6 flex items-center justify-between gap-4">
            <div className="min-w-0 flex items-center gap-2 text-xs text-muted">
              <span className="truncate">{activeItemLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                to="/admin/settings?tab=audit"
                aria-label="Open help and audit"
                title="Help and audit"
                className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-panel text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <HelpCircle size={16} />
              </Link>
              <button
                type="button"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-panel text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <AdminNotificationCenter />
              <div className="relative">
                <button
                  ref={profileTriggerRef}
                  type="button"
                  onClick={() => setProfileMenuOpen(v => !v)}
                  aria-label="Open account menu"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-panel text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <UserCircle size={17} />
                </button>
                <DropdownPortal
                  open={profileMenuOpen}
                  anchorRef={profileTriggerRef}
                  onClose={() => setProfileMenuOpen(false)}
                  align="right"
                  offset={8}
                  className="ams-popover-surface w-56 p-1"
                >
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="truncate text-xs font-semibold text-fg">{roleMeta.accountProfile.displayName}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted">{roleMeta.accountProfile.accountId}</p>
                  </div>
                  <Link to="/admin/settings?tab=profile" onClick={() => setProfileMenuOpen(false)} className="ams-dropdown-item flex min-h-10 items-center rounded-chip px-2.5 text-xs">
                    Profile
                  </Link>
                  <Link to="/admin/settings?tab=security" onClick={() => setProfileMenuOpen(false)} className="ams-dropdown-item flex min-h-10 items-center rounded-chip px-2.5 text-xs">
                    Security
                  </Link>
                  <button type="button" onClick={() => { setProfileMenuOpen(false); handleLogout(); }} className="ams-dropdown-item flex min-h-10 w-full items-center rounded-chip px-2.5 text-left text-xs text-danger">
                    Sign out
                  </button>
                </DropdownPortal>
              </div>
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