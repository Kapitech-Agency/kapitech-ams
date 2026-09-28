          </motion.div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA & DESKTOP STICKY TOPBAR */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-y-auto overscroll-none bg-bg custom-scrollbar">
        
        {/* Sticky desktop top bar */}
        <header className="hidden min-[900px]:flex h-[52px] min-h-[52px] border-b border-line bg-panel sticky top-0 z-30 items-center shrink-0" aria-label="AMS top bar">
          {location.pathname.startsWith('/admin/clients') ? (
            <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-5 lg:px-6 flex items-center justify-between gap-4">
              <nav aria-label="Clients sections" className="flex min-w-0 items-center gap-1 overflow-x-auto custom-scrollbar">
                {[
                  { key: 'all-clients', label: 'All Clients', to: '/admin/clients/all-clients' },
                  { key: 'retainers', label: 'Retainers', to: '/admin/clients/retainers' },
                  { key: 'sla-monitoring', label: 'SLA Monitoring', to: '/admin/clients/sla-monitoring' },
                  { key: 'lead-accounts', label: 'Lead Accounts', to: '/admin/clients/lead-accounts' }
                ].map((tab) => {
                  const active = location.pathname === tab.to;
                  return (
                    <NavLink
                      key={tab.key}
                      to={tab.to}
                      end
                      className={() =>
                        'inline-flex h-9 shrink-0 items-center rounded-chip px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
                        (active ? 'bg-line text-fg' : 'text-muted hover:bg-bg hover:text-fg')
                      }
                    >
                      {tab.label}
                    </NavLink>
                  );
                })}
              </nav>
              <div className="flex min-w-0 items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCommandPaletteOpen(true)}
                  aria-label="Search AMS"
                  aria-keyshortcuts="Control+K Meta+K"
                  icon={<Search size={14} />}
                  className="hidden h-9 w-[280px] justify-start border-line bg-bg px-3 xl:flex"
                >
                  <span className="min-w-0 flex-1 truncate text-left text-xs">Search retainers or clients...</span>
                  <kbd className="ml-auto rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] text-muted">⌘K</kbd>
                </Button>
                <AdminNotificationCenter />
                <Button type="button" variant="secondary" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} className="h-10 w-10 p-0" />
                <div className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
                <button type="button" onClick={() => setProfileSettingsOpen(true)} aria-label="Open profile settings" title="Profile settings" className="flex h-10 items-center gap-2 rounded-control px-1.5 text-left hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <UserAvatar name={profileName} imageUrl={profileAvatarUrl} size="sm" />
                  <span className="hidden max-w-[150px] truncate text-xs font-medium text-fg 2xl:block">{profileName}</span>
                </button>
              </div>
            </div>
          ) : (
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