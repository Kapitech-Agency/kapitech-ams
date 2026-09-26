import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { useLanguage } from '../../lib/LanguageContext';
import { DropdownPortal } from '../ui/DropdownPortal';

type ServerNotification = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  createdAt?: string;
  isRead?: boolean;
  readAt?: string | null;
};

export const AdminNotificationCenter: React.FC = () => {
  const { language } = useLanguage();
  const [items, setItems] = useState<ServerNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const refresh = async () => {
    setLoading(true);
    const res = await api.notifications.getAll();
    if (res.success && Array.isArray(res.data?.notifications)) {
      setItems((res.data.notifications as Array<ServerNotification & { read?: boolean; timestamp?: string }>)
        .map((notification) => ({
          ...notification,
          isRead: typeof notification.isRead === 'boolean'
            ? notification.isRead
            : Boolean(notification.read),
          createdAt: notification.createdAt || notification.timestamp
        })));
      setError(null);
    } else {
      setError(language === 'id' ? 'Notifikasi tidak dapat dimuat.' : 'Notifications could not be loaded.');
    }
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const unread = useMemo(() => items.filter(item => !item.isRead && !item.readAt).length, [items]);

  const closeMenu = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const markRead = async (id: string) => {
    const res = await api.notifications.markRead(id);
    if (res.success) setItems(prev => prev.map(item => item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item));
  };

  const markAllRead = async () => {
    if (markingAllRead || unread === 0) return;
    setMarkingAllRead(true);
    try {
      const res = await api.notifications.markAllRead();
      if (res.success) {
        setItems(prev => prev.map(item => ({ ...item, isRead: true, readAt: new Date().toISOString() })));
        setError(null);
      } else {
        setError(language === 'id' ? 'Notifikasi belum dapat ditandai dibaca.' : 'Notifications could not be marked as read.');
      }
    } finally {
      setMarkingAllRead(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="relative flex h-11 w-11 items-center justify-center rounded-control border border-line bg-panel text-muted transition-colors hover:bg-panel-hover hover:border-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        aria-label={language === 'id' ? 'Notifikasi' : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="ams-notification-menu"
      >
        <Bell size={16} />
        {unread > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-badge border border-panel bg-accent px-1 text-[9px] font-semibold text-white">{unread > 99 ? '99+' : unread}</span>}
      </button>

      <DropdownPortal
        open={open}
        anchorRef={triggerRef}
        onClose={closeMenu}
        align="right"
        offset={8}
        className="ams-notification-surface w-[min(380px,calc(100vw-24px))] overflow-hidden"
      >
        <section id="ams-notification-menu" role="dialog" aria-label={language === 'id' ? 'Notifikasi' : 'Notifications'}>
          <div className="ams-notification-header flex min-h-14 items-center justify-between gap-3 border-b border-line px-4">
            <div>
              <p className="text-[13px] font-semibold text-fg">{language === 'id' ? 'Notifikasi' : 'Notifications'}</p>
              <p className="mt-0.5 text-[11px] text-muted">{unread} {language === 'id' ? 'belum dibaca' : 'unread'}</p>
            </div>
            {unread > 0 && <button type="button" onClick={() => void markAllRead()} disabled={markingAllRead} className="inline-flex min-h-10 items-center gap-1.5 rounded-control px-2 text-[11px] font-medium text-accent-text hover:bg-panel-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><CheckCheck size={14}/>{language === 'id' ? 'Tandai semua' : 'Mark all read'}</button>}
          </div>
          <div className="ams-notification-list max-h-[min(60vh,460px)] overflow-y-auto overscroll-contain custom-scrollbar">
            {error ? (
              <div className="px-4 py-10 text-center" role="status">
                <p className="text-[12px] font-medium text-fg">{error}</p>
                <button type="button" onClick={() => void refresh()} className="mt-3 min-h-10 rounded-control border border-line bg-panel px-3 text-[11px] font-medium text-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                  {language === 'id' ? 'Coba lagi' : 'Retry'}
                </button>
              </div>
            ) : loading && items.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12px] text-muted">{language === 'id' ? 'Memuat notifikasi...' : 'Loading notifications...'}</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12px] text-muted">{language === 'id' ? 'Tidak ada notifikasi.' : 'No notifications.'}</div>
            ) : items.slice(0, 30).map(item => (
              <button key={item.id} type="button" onClick={() => void markRead(item.id)} className={`ams-notification-item w-full border-b border-line px-4 py-3.5 text-left transition-colors hover:bg-panel-hover focus-visible:outline-none focus-visible:bg-panel-hover ${(!item.isRead && !item.readAt) ? 'is-unread' : ''}`}>
                <div className="flex gap-3">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${(!item.isRead && !item.readAt) ? 'bg-accent' : 'bg-line'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-fg">{item.title || item.type || (language === 'id' ? 'Notifikasi sistem' : 'System notification')}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">{item.message || ''}</p>
                    {item.createdAt && <p className="mt-1.5 text-[10px] text-muted">{new Date(item.createdAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </DropdownPortal>
    </div>
  );
};
