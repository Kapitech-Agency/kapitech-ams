import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SearchX,
  X,
  LayoutDashboard,
  Layers,
  Briefcase,
  Receipt,
  Users,
  Inbox,
  Settings,
  Command,
  ArrowRight,
  FileText,
  ShieldCheck,
  FolderOpen,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { api } from '../../lib/apiClient';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string | number;
  type: string;
  name: string;
  url: string;
  status?: string;
  owner?: string;
}

interface QuickAction {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  shortcut: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectableItemsRef = useRef<Array<
    { kind: 'result'; result: SearchResult } | { kind: 'action'; action: QuickAction }
  >>([]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSearchResults([]);
      setActiveIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.search.query(query);
        if (res.success && res.data?.results) {
          setSearchResults(res.data.results as SearchResult[]);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, searchResults.length]);

  const quickActions: QuickAction[] = [
    {
      id: 'nav_dash',
      title: language === 'id' ? 'Buka Dashboard Overview' : 'Open Dashboard Overview',
      category: language === 'id' ? 'Navigasi' : 'Navigation',
      icon: LayoutDashboard,
      shortcut: 'G D',
      action: () => { navigate('/admin/dashboard'); onClose(); }
    },
    {
      id: 'nav_proposals',
      title: language === 'id' ? 'Buka Proposals & Quotations' : 'Open Proposals & Quotations',
      category: language === 'id' ? 'Navigasi' : 'Navigation',
      icon: FileText,
      shortcut: 'G Q',
      action: () => { navigate('/admin/proposals'); onClose(); }
    },
    {
      id: 'nav_projects',
      title: language === 'id' ? 'Lihat Client Projects & Task Execution' : 'View Client Projects & Tasks',
      category: language === 'id' ? 'Navigasi' : 'Navigation',
      icon: Layers,
      shortcut: 'G P',
      action: () => { navigate('/admin/projects'); onClose(); }
    },
    {
      id: 'nav_crm',
      title: language === 'id' ? 'Buka Agency CRM Pipeline' : 'Open Agency CRM Pipeline',
      category: language === 'id' ? 'Navigasi' : 'Navigation',
      icon: Briefcase,
      shortcut: 'G C',
      action: () => { navigate('/admin/crm'); onClose(); }
    },
    {
      id: 'nav_invoicing',
      title: language === 'id' ? 'Buka Invoicing & Financial Records' : 'Open Invoicing & Financials',
      category: language === 'id' ? 'Navigasi' : 'Navigation',
      icon: Receipt,
      shortcut: 'G I',
      action: () => { navigate('/admin/invoicing'); onClose(); }
    },
    {
      id: 'nav_clients',
      title: language === 'id' ? 'Buka Direktori Klien' : 'Open Client Directory',
      category: language === 'id' ? 'Navigasi' : 'Navigation',
      icon: Users,
      shortcut: 'G U',
      action: () => { navigate('/admin/clients'); onClose(); }
    },
    {
      id: 'nav_approvals',
      title: language === 'id' ? 'Pusat Persetujuan Eksekutif' : 'Executive Approvals Center',
      category: language === 'id' ? 'Navigasi' : 'Navigation',
      icon: ShieldCheck,
      shortcut: 'G A',
      action: () => { navigate('/admin/approvals'); onClose(); }
    },
    {
      id: 'nav_documents',
      title: language === 'id' ? 'Brankas Dokumen & Aset' : 'Documents & Asset Vault',
      category: language === 'id' ? 'Navigasi' : 'System',
      icon: FolderOpen,
      shortcut: 'G V',
      action: () => { navigate('/admin/documents'); onClose(); }
    },
    {
      id: 'nav_inbox',
      title: language === 'id' ? 'Lihat Inbox Formulir Masuk' : 'View Inbound Inquiries Inbox',
      category: language === 'id' ? 'Navigasi' : 'Navigation',
      icon: Inbox,
      shortcut: 'G M',
      action: () => { navigate('/admin/inbox'); onClose(); }
    },
    {
      id: 'nav_settings',
      title: language === 'id' ? 'Pengaturan Sistem & Audit Trail' : 'System Settings & Audit Trail',
      category: language === 'id' ? 'Sistem' : 'System',
      icon: Settings,
      shortcut: 'G S',
      action: () => { navigate('/admin/settings'); onClose(); }
    }
  ];

  const filteredActions = quickActions.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const selectableItems = [
    ...searchResults.map((result) => ({ kind: 'result' as const, result })),
    ...filteredActions.map((action) => ({ kind: 'action' as const, action }))
  ];
  selectableItemsRef.current = selectableItems;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          window.dispatchEvent(new CustomEvent('open_command_palette'));
        }
        return;
      }

      if (!isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const items = selectableItemsRef.current;
        setActiveIndex((index) =>
          items.length ? (index + 1) % items.length : 0
        );
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        const items = selectableItemsRef.current;
        setActiveIndex((index) =>
          items.length
            ? (index - 1 + items.length) % items.length
            : 0
        );
        return;
      }

      const items = selectableItemsRef.current;

      if (event.key === 'Enter' && items.length > 0) {
        event.preventDefault();
        const selected = items[activeIndex];
        if (selected?.kind === 'result') {
          navigate(selected.result.url);
          onClose();
        } else if (selected?.kind === 'action') {
          selected.action.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, isOpen, navigate, onClose]);

  const getBadgeColor = (_type: string) => 'bg-panel text-muted border-line';

  const runSelected = (index: number) => {
    const selected = selectableItems[index];
    if (!selected) return;
    if (selected.kind === 'result') {
      navigate(selected.result.url);
      onClose();
    } else {
      selected.action.action();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="2xl"
      title={language === 'id' ? 'Pencarian AMS' : 'Search AMS'}
      description={language === 'id' ? 'Cari data AMS atau lompat langsung ke modul kerja.' : 'Search AMS records or jump directly to a work module.'}
      initialFocusRef={inputRef}
      footer={(
        <div className="flex w-full flex-wrap items-center justify-between gap-2 text-[10px] text-muted">
          <div className="flex flex-wrap items-center gap-1.5">
            {['↑↓ Navigate', '↵ Select', 'ESC Close'].map((hint) => (
              <span key={hint} className="rounded-badge border border-line bg-bg px-2 py-1">{hint}</span>
            ))}
          </div>
          <div className="hidden items-center gap-1 rounded-badge border border-accent/20 bg-accent/6 px-2 py-1 font-semibold text-accent-text sm:flex">
            <Command size={11} />
            <span>KAPITECH AMS</span>
          </div>
        </div>
      )}
    >
      <div className="space-y-4">
        <div className="rounded-card border border-line bg-bg p-2">
          <div className="flex min-h-12 items-center gap-3 rounded-control border border-line bg-panel px-3">
            {isSearching ? (
              <Loader2 size={17} className="shrink-0 animate-spin text-accent-text" />
            ) : (
              <Search size={17} className="shrink-0 text-muted" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                language === 'id'
                  ? 'Cari deal, invoice, proyek, proposal, atau modul...'
                  : 'Search deals, invoices, projects, proposals, or modules...'
              }
              className="min-h-10 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-fg outline-none shadow-none focus:border-0 focus:shadow-none"
              aria-label={language === 'id' ? 'Pencarian AMS' : 'AMS search'}
              autoComplete="off"
            />
            {query && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                title="Clear search"
                icon={<X size={14} />}
                className="h-8 w-8 shrink-0 p-0"
              />
            )}
            <kbd className="hidden shrink-0 rounded-badge border border-line bg-bg px-2 py-1 text-[10px] font-semibold text-muted sm:inline-flex">⌘ K</kbd>
          </div>
        </div>

        <div className="max-h-[min(54vh,480px)] overflow-y-auto custom-scrollbar" role="listbox" aria-label="Command results">
          {searchResults.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold text-muted">
                  {language === 'id' ? 'Data AMS' : 'AMS records'}
                </span>
                <span className="text-[10px] text-muted">{searchResults.length}</span>
              </div>
              <div className="space-y-1">
                {searchResults.map((result, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={`${result.type}_${result.id}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => runSelected(index)}
                      className={`group flex w-full items-center justify-between rounded-control border p-3 text-left transition-[background-color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? 'border-accent/20 bg-accent/6' : 'border-transparent bg-panel hover:border-line hover:bg-panel-hover'}`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted">
                          <FileText size={14} />
                        </div>
                        <span className={`shrink-0 rounded-badge border px-2 py-0.5 text-[9px] font-medium normal-case ${getBadgeColor(result.type)}`}>
                          {result.type}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-fg">{result.name}</div>
                          <div className="flex items-center gap-2 text-[10px] text-muted">
                            {result.status && <span>Status: {result.status}</span>}
                            {result.owner && <span>• {result.owner}</span>}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={12} className={`shrink-0 transition-colors ${isActive ? 'text-accent-text' : 'text-muted'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 mt-5 flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                {language === 'id' ? 'Navigasi & perintah' : 'Navigation & commands'}
              </span>
            </div>

            {filteredActions.length === 0 && searchResults.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-card border border-dashed border-line bg-bg/40 px-6 text-center">
                <SearchX size={20} className="text-muted" />
                <p className="mt-3 text-xs font-medium text-fg">
                  {language === 'id' ? 'Tidak ada hasil' : 'No results'}
                </p>
                <p className="mt-1 max-w-sm text-[11px] leading-5 text-muted">
                  {language === 'id' ? 'Coba kata kunci lain atau gunakan menu navigasi.' : 'Try a different keyword or use the navigation commands.'}
                </p>
              </div>
            ) : (
              filteredActions.map((item, index) => {
                const selectableIndex = searchResults.length + index;
                const isActive = selectableIndex === activeIndex;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(selectableIndex)}
                    onClick={() => runSelected(selectableIndex)}
                    className={`group flex w-full items-center justify-between rounded-control p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? 'bg-panel-hover' : 'hover:bg-panel-hover'}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-control border transition-colors ${isActive ? 'border-line bg-panel text-fg' : 'border-line bg-bg text-muted'}`}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-fg">{item.title}</div>
                        <div className="text-[10px] text-muted">{item.category}</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">
                        {item.shortcut}
                      </span>
                      <ArrowRight size={12} className={`transition-all ${isActive ? 'text-accent-text' : 'text-muted'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CommandPalette;
