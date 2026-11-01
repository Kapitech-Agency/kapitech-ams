import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Send } from 'lucide-react';
import { ContactSubmission } from '../../../lib/submissions';
import { useLanguage } from '../../../lib/LanguageContext';
import { Modal } from '../../ui/Modal';
import { getInboxResponseTemplates } from './responseTemplates';

interface CannedResponsesModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: ContactSubmission;
  onSelectTemplate?: (text: string) => void;
}

export const CannedResponsesModal: React.FC<CannedResponsesModalProps> = ({
  isOpen,
  onClose,
  submission,
  onSelectTemplate
}) => {
  const { language } = useLanguage();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const clientName = submission.fullName || 'Client';
  const templates = getInboxResponseTemplates(language, submission);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cleanPhoneForWhatsApp = (rawPhone?: string) => {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '62' + digits.substring(1);
    return digits;
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="xl"
      title={language === 'id' ? 'Template respons' : 'Response templates'}
      description={language === 'id' ? `Disesuaikan untuk: ${clientName}` : `Personalized for: ${clientName}`}
      footer={
        <div className="flex w-full items-center justify-between gap-3 text-xs text-muted">
          <span>{language === 'id' ? 'Format teks otomatis menyertakan identitas brief.' : 'Templates auto-merge client brief variables.'}</span>
          <button type="button" onClick={onClose} className="min-h-10 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            {language === 'id' ? 'Tutup' : 'Close'}
          </button>
        </div>
      }
    >
        <div className="space-y-4">
          {templates.map((tpl) => {
            const Icon = tpl.icon;
            const isCopied = copiedKey === tpl.key;

            return (
              <div 
                key={tpl.key}
                className="p-4 rounded-control bg-panel border border-line hover:border-line transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-control bg-panel flex items-center justify-center text-accent-text shrink-0">
                      <Icon size={13} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-fg font-sans">{tpl.title}</h4>
                      <span className="text-[10px] font-sans text-muted">{tpl.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Copy Body */}
                    <button
                      onClick={() => handleCopy(tpl.key, tpl.body)}
                      className={`min-h-10 px-2.5 rounded-control text-xs font-sans transition-all flex items-center gap-1.5 border ${
                        isCopied 
                          ? 'bg-success/10 text-success border-success/30 font-semibold' 
                          : 'bg-panel text-muted border-line hover:text-fg hover:border-[var(--line)]'
                      }`}
                      title="Copy response body"
                    >
                      {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{isCopied ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
                    </button>

                    {/* Email Mailto Action */}
                    <a
                      href={`mailto:${submission.email}?subject=${encodeURIComponent(tpl.subject)}&body=${encodeURIComponent(tpl.body)}`}
                      onClick={onClose}
                      className="min-h-10 px-2.5 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                      title="Send via default Email Client"
                    >
                      <Send size={12} />
                      <span>Email</span>
                    </a>

                    {/* WhatsApp Action if phone available */}
                    {submission.phone && cleanPhoneForWhatsApp(submission.phone) && (
                      <a
                        href={`https://wa.me/${cleanPhoneForWhatsApp(submission.phone)}?text=${encodeURIComponent(tpl.body)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="min-h-10 px-2.5 rounded-control bg-panel text-muted border border-line hover:bg-panel-hover hover:text-fg text-xs font-sans font-semibold transition-colors flex items-center gap-1.5"
                        title="Send via WhatsApp"
                      >
                        <span>WA</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Body Preview */}
                <div className="p-3 rounded-control bg-panel border border-line text-[11px] text-muted font-sans leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {tpl.body}
                </div>
              </div>
            );
          })}
        </div>
    </Modal>
  );
};
