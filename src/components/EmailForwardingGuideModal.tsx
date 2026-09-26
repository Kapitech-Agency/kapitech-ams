import React, { useState } from 'react';
import { Mail, Check, Copy, ShieldCheck, Sparkles } from 'lucide-react';
import { Modal } from './ui/Modal';
import { useLanguage } from '../lib/LanguageContext';

interface EmailForwardingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailForwardingGuideModal: React.FC<EmailForwardingGuideModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      title={language === 'id' ? 'Notifikasi Email' : 'Email Alerts'}
      description={language === 'id' ? 'Panduan konfigurasi penerusan notifikasi inquiry ke email tim.' : 'Configure how inbound inquiry notifications are routed to your team email.'}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-10 items-center justify-center rounded-control border border-line bg-transparent px-4 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {language === 'id' ? 'Tutup' : 'Close'}
        </button>
      }
    >
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 custom-scrollbar sm:px-5">
          <section className="rounded-control border border-line bg-bg p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-success" />
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-semibold text-fg">
                  {language === 'id' ? 'Alamat Email Tujuan' : 'Default Destination'}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {language === 'id'
                    ? 'Form publik tersimpan di sistem inbox AMS dan dapat diteruskan ke alamat email operasional.'
                    : 'Public form submissions are stored in the AMS inbox and can be routed to an operational mailbox.'}
                </p>
                <div className="mt-3 flex flex-col gap-2 rounded-control border border-line bg-panel p-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <code className="min-w-0 break-all text-xs text-fg">business@kapitech.id</code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('business@kapitech.id', 'email')}
                    className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-control border border-line bg-transparent px-3 text-[11px] font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {copiedKey === 'email' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'email' ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-control border border-line bg-bg p-4">
            <div className="flex items-start gap-3">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-accent-text" />
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-fg">
                  {language === 'id' ? 'Provider Email Relay' : 'Email Relay Provider'}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {language === 'id'
                    ? 'Untuk pengiriman otomatis melalui provider email, gunakan EmailJS atau Resend dan hubungkan konfigurasi service yang sesuai.'
                    : 'For automated delivery, connect an email provider such as EmailJS or Resend and configure the required service credentials.'}
                </p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-muted">
                  <li>
                    Daftar di{' '}
                    <a href="https://www.emailjs.com" target="_blank" rel="noreferrer" className="text-accent-text hover:underline">
                      EmailJS
                    </a>{' '}
                    atau{' '}
                    <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-accent-text hover:underline">
                      Resend
                    </a>.
                  </li>
                  <li>Hubungkan service ke Gmail atau domain <code className="text-fg">@kapitech.id</code>.</li>
                  <li>Masukkan <code className="text-fg">SERVICE_ID</code>, <code className="text-fg">TEMPLATE_ID</code>, dan <code className="text-fg">PUBLIC_KEY</code> pada konfigurasi email.</li>
                </ol>
              </div>
            </div>
          </section>

          <section className="rounded-control border border-line bg-bg p-4">
            <div className="flex items-start gap-3">
              <Check size={15} className="mt-0.5 shrink-0 text-success" />
              <div>
                <h3 className="text-xs font-semibold text-fg">
                  {language === 'id' ? 'Status Inbox' : 'Inbox Status'}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {language === 'id'
                    ? 'Inquiry dari formulir website tetap masuk ke Inbox AMS secara real-time, termasuk unread counter dan notifikasi audio.'
                    : 'Website inquiries continue to appear in the AMS Inbox in real time, including unread count and audio notification.'}
                </p>
              </div>
            </div>
          </section>
        </div>

    </Modal>
  );
};
