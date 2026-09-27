import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck, AlertCircle, BellOff } from 'lucide-react';
import Button from '../ui/Button';
import { api } from '../../lib/apiClient';
import { useLanguage } from '../../lib/LanguageContext';
import { DropdownPortal } from '../ui/DropdownPortal';
import { Skeleton } from '../ui/Skeleton';

type ServerNotification = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  createdAt?: string;
  isRead?: boolean;
  readAt?: string | null;
};

const sampleNotifications: ServerNotification[] = [
  {
    id: 'sample-1',
    title: 'Project milestone due',
    message: 'Meridian Commerce checkout UI review is due tomorrow.',
    type: 'Project',
    createdAt: new Date().toISOString(),
    isRead: false,
  },
  {
    id: 'sample-2',
    title: 'Invoice follow-up',
    message: 'An outstanding invoice is ready for follow-up.',
    type: 'Finance',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'sample-3',
    title: 'Team capacity alert',
    message: 'Raka is approaching maximum planned utilization.',
    type: 'Capacity',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
];

export const AdminNotificationCenter: React.FC = () => {
  const { language } = useLanguage();
  const [items, setItems] = useState<ServerNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const refresh = async () => {
    setLoading(true);
    try {
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
        setUsingSampleData(false);
        setError(null);
        return;
      }

      setItems((current) => current.length > 0 ? current : sampleNotifications);
      setUsingSampleData(true);
      setError(null);
    } catch {
      setItems((current) => current.length > 0 ? current : sampleNotifications);
      setUsingSampleData(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [language]);

  const unread = useMemo(() => items.filter(item => !item.isRead && !item.readAt).length, [items]);

  const markRead = async (id: string) => {
    const now = new Date().toISOString();
    setItems(prev => prev.map(item => item.id === id ? { ...item, isRead: true, readAt: now } : item));
    if (usingSampleData) {
      setActionMessage(null);
      return;
    }

    try {
      const res = await api.notifications.markRead(id);
      if (!res.success) {
        setActionMessage(language === 'id' ? 'Status dibaca disimpan sementara di sesi ini.' : 'Read state is being kept locally for this session.');
      } else {
        setActionMessage(null);
      }
    } catch {
      setActionMessage(language === 'id' ? 'Status dibaca disimpan sementara di sesi ini.' : 'Read state is being kept locally for this session.');
    }
  };

  const markAllRead = async () => {
    if (markingAllRead || unread === 0) return;
    setMarkingAllRead(true);
    const now = new Date().toISOString();
    setItems(prev => prev.map(item => ({ ...item, isRead: true, readAt: now })));

    if (usingSampleData) {
      setMarkingAllRead(false);
      return;
    }

    try {
      const res = await api.notifications.markAllRead();
      if (!res.success) {
        setActionMessage(language === 'id' ? 'Status baca disimpan sementara di sesi ini.' : 'Read state is being kept locally for this session.');
      } else {
        setActionMessage(null);
      }
    } catch {
      setActionMessage(language === 'id' ? 'Status baca disimpan sementara di sesi ini.' : 'Read state is being kept locally for this session.');
    } finally {
      setMarkingAllRead(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Button
          ref={triggerRef}
          type="button"
          variant="secondary"
          onClick={() => setOpen(v => !v)}
          aria-label={language === 'id' ? 'Notifikasi' : 'Notifications'}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="ams-notification-menu"
          icon={<Bell size={16} />}
          className={`h-10 w-10 p-0 ${open ? 'border-line bg-panel-hover text-fg' : ''}`}
        />
        {unread > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-badge border-2 border-panel bg-accent px-1 text-[9px] font-semibold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </div>

      <DropdownPortal
        open={open}
        anchorRef={triggerRef}
        onClose={() => setOpen(false)}
        align="right"
        offset={8}
        className="ams-notification-surface w-[min(380px,calc(100vw-24px))] overflow-hidden"
      >
        <section id="ams-notification-menu" role="dialog" aria-label={language === 'id' ? 'Notifikasi' : 'Notifications'}>
          <div className="ams-notification-header flex min-h-14 items-center justify-between gap-3 border-b border-line px-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-fg">{language === 'id' ? 'Notifikasi' : 'Notifications'}</p>
                {usingSampleData && (
                  <span className="rounded-badge border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-[9px] font-semibold text-warning">
                    Sample
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted">{unread} {language === 'id' ? 'belum dibaca' : 'unread'}</p>
            </div>
            {unread > 0 && (
              <Button
                type="button"
                variant="ghost"
                loading={markingAllRead}
                onClick={() => void markAllRead()}
                icon={<CheckCheck size={14} />}
                className="min-h-9 px-2 text-[11px] text-accent-text"
              >
                {language === 'id' ? 'Tandai semua' : 'Mark all read'}
              </Button>
            )}
          </div>
          {actionMessage && (
            <div role="status" className="border-b border-line bg-warning/5 px-4 py-2.5 text-[11px] leading-5 text-warning">
              {actionMessage}
            </div>
          )}
          <div className="ams-notification-list max-h-[min(60vh,460px)] overflow-y-auto overscroll-contain custom-scrollbar">
            {error ? (
              <div className="px-4 py-10 text-center" role="status">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-control border border-danger/20 bg-danger/10 text-danger">
                  <AlertCircle size={16} />
                </div>
                <p className="mt-3 text-[12px] font-medium text-fg">{error}</p>
                <Button type="button" variant="secondary" onClick={() => void refresh()} className="mt-3 min-h-9 px-3">
                  {language === 'id' ? 'Coba lagi' : 'Retry'}
                </Button>
              </div>
            ) : loading && items.length === 0 ? (
              <div className="space-y-1 p-2" aria-label={language === 'id' ? 'Memuat notifikasi' : 'Loading notifications'} role="status">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex gap-3 border-b border-line px-2 py-3.5 last:border-b-0">
                    <Skeleton className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3 w-2/5" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center" role="status">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-control border border-line bg-bg text-muted">
                  <BellOff size={16} />
                </div>
                <p className="mt-3 text-[12px] font-medium text-fg">{language === 'id' ? 'Tidak ada notifikasi.' : 'No notifications.'}</p>
                <p className="mt-1 text-[11px] text-muted">{language === 'id' ? 'Notifikasi baru akan muncul di sini.' : 'New notifications will appear here.'}</p>
              </div>
            ) : items.slice(0, 30).map(item => (
              <button key={item.id} type="button" onClick={() => void markRead(item.id)} className={`ams-notification-item w-full border-b border-line px-4 py-3.5 text-left transition-colors hover:bg-panel-hover focus-visible:outline-none focus-visible:bg-panel-hover ${(!item.isRead && !item.readAt) ? 'is-unread border-l-2 border-l-accent pl-[14px]' : ''}`}>
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
