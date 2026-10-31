import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowUpRight, Building2, Check, FileText, Inbox, Mail, MessageSquare, Phone, Star, Trash2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ContactSubmission } from '../../../lib/submissions';
import { AdminTablePagination } from '../AdminModulePrimitives';
import { DashboardControl } from '../DashboardControls';
import { Drawer } from '../../ui/Drawer';
import { Skeleton } from '../../ui/Skeleton';
import { INBOX_CATEGORY_CONTENT, getInboxMessageSubject, getInboxMessageContext, type InboxCategory } from './inboxPresentation';
import './MessageWorkspace.css';

type Props = {
  items: ContactSubmission[]; selected: ContactSubmission | null;
  loading: boolean; unavailable: boolean; sourceEmpty: boolean;
  language: string; table: boolean; commercial?: boolean;
  category?: InboxCategory; preview?: boolean; sourceUnavailable?: boolean; onPreview?: () => void;
  page: number; pageSize: number; onPage: (page: number) => void; onPageSize: (size: number) => void;
  onSelect: (item: ContactSubmission) => void; onBack: () => void; onReset: () => void; onRetry: () => void;
  onStar: (event: React.MouseEvent, id: string, starred?: boolean) => void;
  canManage: boolean; canConvert: boolean; converting: boolean;
  onConvert: () => void; onDelete: () => void; onTemplates: () => void;
  note: string; onNote: (value: string) => void; savingNote: boolean; onSaveNote: () => void;
  statusControl: React.ReactNode; priorityControl: React.ReactNode; ownerControl: React.ReactNode;
  whatsAppHref?: string;
};

/** Presentation only. Design examples never use canonical mutation handlers. */
export const MessageWorkspace: React.FC<Props> = (p) => {
  const t = (en: string, id: string) => p.language === 'id' ? id : en;
  const category = p.category || (p.commercial ? 'client' : 'messages');
  const content = INBOX_CATEGORY_CONTENT[category];
  const readerTitle = useRef<HTMLHeadingElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const register = useRef<HTMLElement>(null);
  const lastSelection = useRef<string | null>(null);
  const selected = p.selected;
  const selectedId = selected?.id;
  useEffect(() => {
    const element = workspace.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const page = element.closest('.ams-page-shell');
        const gutter = page ? parseFloat(getComputedStyle(page).paddingBottom) || 0 : 0;
        const available = window.innerHeight - element.getBoundingClientRect().top - gutter;
        const heading = element.querySelector<HTMLElement>('.ams-message-panel-heading');
        const pagination = element.querySelector<HTMLElement>('.ams-table-pagination');
        const row = element.querySelector<HTMLElement>('.ams-message-row, .ams-message-state, .ams-message-loading-row, tbody tr');
        const readableMinimum = (heading?.offsetHeight || 0) + (pagination?.offsetHeight || 0) + (row?.offsetHeight || 0);
        if (available > readableMinimum) element.style.setProperty('--inbox-pane-height', `${available}px`);
        else element.style.removeProperty('--inbox-pane-height');
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element.closest('.ams-page-shell') || element);
    window.addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', measure); };
  }, [category, p.loading, p.table, selectedId]);
  useEffect(() => {
    if (selectedId) readerTitle.current?.focus({ preventScroll: true });
    else if (lastSelection.current) {
      const buttons: NodeListOf<HTMLButtonElement> | undefined = register.current?.querySelectorAll('[data-message-id]');
      buttons?.forEach((button) => {
        if (button.dataset.messageId === lastSelection.current) button.focus({ preventScroll: true });
      });
    }
  }, [selectedId]);
  const select = (item: ContactSubmission) => { lastSelection.current = item.id; p.onSelect(item); };
  const date = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? t('Date not recorded', 'Tanggal tidak tercatat') : parsed.toLocaleDateString(p.language === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const status = (item: ContactSubmission) => ({ new: t('New', 'Baru'), 'in-review': t('In review', 'Ditinjau'), contacted: t('Contacted', 'Dihubungi'), closed: t('Closed deal', 'Deal ditutup') }[item.status] || item.status);
  const pageItems = p.items.slice((p.page - 1) * p.pageSize, p.page * p.pageSize);
  const subject = (item: ContactSubmission) => getInboxMessageSubject(item, p.preview);
  const context = (item: ContactSubmission) => getInboxMessageContext(item, p.preview);
  const star = (item: ContactSubmission) => <button type="button" className={'ams-message-star' + (item.starred ? ' is-saved' : '')} disabled={!p.canManage || p.preview} aria-pressed={Boolean(item.starred)} aria-label={`${item.starred ? t('Unstar', 'Hapus bintang') : t('Star', 'Beri bintang')} ${item.fullName || item.email}`} onClick={(event) => p.onStar(event, item.id, item.starred)}><Star size={16} aria-hidden="true" /></button>;
  const badges = (item: ContactSubmission) => <><span className={'ams-message-status is-' + item.status}>{status(item)}</span>{item.priority === 'urgent' || item.priority === 'high' ? <span className={'ams-message-priority is-' + item.priority}>{item.priority === 'urgent' ? t('Urgent', 'Mendesak') : t('High priority', 'Prioritas tinggi')}</span> : null}</>;
  const state = <div className="ams-message-state">
    <span className="ams-message-state-icon"><Inbox size={24} aria-hidden="true" /></span>
    <h3>{p.sourceUnavailable ? content.title : p.unavailable ? t('Inbox unavailable', 'Inbox tidak tersedia') : p.sourceEmpty ? t('Your next conversation starts here', 'Percakapan berikutnya dimulai di sini') : t('No matching messages', 'Tidak ada pesan yang sesuai')}</h3>
    <p>{p.sourceUnavailable ? content.empty : p.unavailable ? t('Messages could not be loaded. Retry to check the inbox.', 'Pesan gagal dimuat. Coba lagi untuk memeriksa inbox.') : p.sourceEmpty ? content.empty : t('Try a different search or reset the filters to see more messages.', 'Ubah pencarian atau reset filter untuk melihat pesan lainnya.')}</p>
    {p.sourceUnavailable ? <DashboardControl variant="primary" onClick={p.onPreview}>Preview this workspace</DashboardControl> : p.unavailable ? <DashboardControl onClick={p.onRetry}>{t('Retry', 'Coba lagi')}</DashboardControl> : !p.sourceEmpty ? <DashboardControl onClick={p.onReset}>{t('Reset filters', 'Reset filter')}</DashboardControl> : p.onPreview ? <DashboardControl onClick={p.onPreview}>Explore the design preview</DashboardControl> : null}
  </div>;

  const readerFooter = selected ? (<footer className={'ams-message-reader-footer' + (p.table ? ' is-drawer-footer' : '')}><div className="ams-message-next-actions">{p.preview ? <DashboardControl variant="primary" icon={<Mail size={14} />} onClick={p.onTemplates}>Preview a response</DashboardControl> : <DashboardControl variant="primary" to={`mailto:${selected.email}`} showArrow={false} icon={<Mail size={14} />}>Reply by email</DashboardControl>}{!p.preview && <DashboardControl onClick={p.onTemplates} icon={<FileText size={14} />}>{t('Response templates', 'Template balasan')}</DashboardControl>}</div><span className="ams-message-footer-note">{p.preview ? 'Sample content · No changes saved' : 'Replies open in your email app'}</span></footer>) : null;

  const reader = (<section data-ams-feature-slug="inbox-message-reader" id="message-workspace-reader" className={'ams-message-reader' + (p.table ? ' ams-message-reader--drawer' : '')} aria-label={t('Message detail', 'Detail pesan')}>
      {p.loading ? <div className="ams-message-reader-content" aria-label={t('Loading message detail', 'Memuat detail pesan')}><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-32 w-full" /></div> : selected ? <>
        <header className="ams-message-reader-header">
          <div className="ams-message-reader-utilities"><DashboardControl variant="quiet" onClick={p.onBack} icon={<ArrowLeft size={14} />} showArrow={false}>{t('Back to messages', 'Kembali ke daftar')}</DashboardControl><span>{content.title}</span>{star(selected)}</div>
          <h2 ref={readerTitle} tabIndex={-1} className="ams-message-subject">{subject(selected)}</h2>
          <div className="ams-message-reader-context"><span><Building2 size={14} aria-hidden="true" />{context(selected)}</span><span className="ams-message-row-context">{badges(selected)}</span></div>
        </header>
        <div className="ams-message-reader-content">
          <div className="ams-message-sender"><span className="ams-message-avatar" aria-hidden="true">{(selected.fullName || selected.email).slice(0, 1).toUpperCase()}</span><div className="ams-message-sender-info"><strong>{selected.fullName || selected.email}</strong><span>{p.preview ? 'Design example' : selected.source || t('Source not recorded', 'Sumber tidak tercatat')}</span></div><time dateTime={selected.createdAt}>{date(selected.createdAt)}</time></div>
          <section className="ams-message-brief" aria-labelledby="message-brief-heading"><h3 id="message-brief-heading">{t('Message & brief', 'Pesan & brief')}</h3><p>{selected.message || t('The sender did not include a message.', 'Pengirim tidak menyertakan pesan.')}</p></section>
          <dl className="ams-message-scope"><div><dt>{category === 'project-support' ? 'Technical context' : category === 'client-requests' ? 'Request context' : t('Requested services', 'Layanan yang diminta')}</dt><dd>{selected.services?.length ? <div className="ams-message-service-tags">{selected.services.map((service, index) => <span key={`${service}-${index}`}>{service}</span>)}</div> : selected.specialty || t('Not provided', 'Tidak disertakan')}</dd></div><div><dt>{category === 'client-requests' || category === 'project-support' ? 'Engagement context' : t('Stated budget / rate', 'Anggaran / tarif disampaikan')}</dt><dd>{category === 'client-requests' || category === 'project-support' ? context(selected) : selected.budget || selected.rateCard || t('Not provided', 'Tidak disertakan')}</dd></div></dl>
          <section className="ams-message-handling" aria-labelledby="message-handling-heading"><h3 id="message-handling-heading">{t('Triage & ownership', 'Triase & penanggung jawab')}</h3><div className="ams-message-handling-fields"><div><span>Status</span>{p.statusControl}</div><div><span>{t('Priority', 'Prioritas')}</span>{p.priorityControl}</div><div><span>{t('Owner / PIC', 'Penanggung jawab / PIC')}</span>{p.ownerControl}</div></div></section>
          <section className="ams-message-notes" aria-labelledby="message-notes-heading"><div className="ams-message-section-heading"><h3 id="message-notes-heading"><FileText size={14} aria-hidden="true" />{t('Internal notes', 'Catatan internal')}</h3><span>{p.preview ? 'Read-only preview' : t('Agency team only', 'Hanya tim agensi')}</span></div><label htmlFor="message-workspace-notes">{t('Discovery, creative direction & technical context', 'Discovery, arahan creative & konteks teknis')}</label><textarea id="message-workspace-notes" value={p.note} onChange={(event) => p.onNote(event.target.value)} disabled={!p.canManage || p.savingNote || p.preview} placeholder={t('Capture scope, deliverables, constraints and the next agreed step…', 'Catat lingkup, deliverable, batasan, dan langkah berikutnya yang disepakati…')} /><div className="ams-message-notes-action"><DashboardControl onClick={p.onSaveNote} disabled={!p.canManage || p.savingNote || p.preview || p.note === (selected.internalNotes || '')} icon={<Check size={14} />}>{p.savingNote ? t('Saving…', 'Menyimpan…') : t('Save notes', 'Simpan catatan')}</DashboardControl></div></section>
          {!p.preview && <div className="ams-message-contact"><a href={`mailto:${selected.email}`}><Mail size={14} />{selected.email}</a>{selected.phone && <a href={`tel:${selected.phone}`}><Phone size={14} />{selected.phone}</a>}{p.whatsAppHref && <a href={p.whatsAppHref} target="_blank" rel="noopener noreferrer">WhatsApp<ArrowUpRight size={14} /></a>}</div>}
          {!p.preview && (p.canManage || p.canConvert) && <div className="ams-message-record-actions">{selected.convertedClientId && p.canConvert ? <Link className="ams-message-client-link" to={`/admin/clients?client=${encodeURIComponent(selected.convertedClientId)}`}>{t('View linked client', 'Lihat klien terhubung')}<ArrowUpRight size={14} /></Link> : p.canConvert && (!selected.type || selected.type === 'inquiry') ? <DashboardControl onClick={p.onConvert} disabled={p.converting}>{p.converting ? t('Converting…', 'Mengonversi…') : t('Convert to client', 'Konversi ke klien')}</DashboardControl> : null}{p.canManage && <DashboardControl variant="quiet" className="ams-message-delete" onClick={p.onDelete} icon={<Trash2 size={14} />} ariaLabel={t('Delete message', 'Hapus pesan')}>{t('Delete message', 'Hapus pesan')}</DashboardControl>}</div>}
        </div>
        {!p.table && readerFooter}
      </> : <div className="ams-message-reader-placeholder"><div className="ams-message-placeholder-top"><span className="ams-message-state-icon"><MessageSquare size={24} aria-hidden="true" /></span><span>{content.title}</span><h2>{t('Select a conversation', 'Pilih percakapan')}</h2><p>{t('Read the brief, understand the context and decide the next step.', 'Baca brief, pahami konteks, dan tentukan langkah berikutnya.')}</p></div><div className="ams-message-reading-guide"><div><MessageSquare size={16} /><span><strong>Review the request</strong><span>Creative direction, scope or technical questions.</span></span></div><div><User size={16} /><span><strong>Keep ownership clear</strong><span>Status, priority and the person responsible.</span></span></div><div><FileText size={16} /><span><strong>Keep the team in context</strong><span>Internal notes and the next agreed step.</span></span></div></div><span className="ams-message-placeholder-tip">Choose a message from the list</span></div>}
    </section>);

  return <div ref={workspace} className={'ams-message-workspace' + (selected ? ' has-selection' : '') + (p.table ? ' is-table' : '')} data-ams-feature-slug="message-workspace">
    <section ref={register} className="ams-message-register" aria-label={t('Message register', 'Daftar pesan')}>
      <header className="ams-message-panel-heading"><div className="ams-message-queue-title"><h2>{content.title}</h2>{!p.loading && !p.unavailable && !p.sourceUnavailable && <span className="ams-message-count">{p.items.length}</span>}</div><span>{p.preview ? 'Sample messages' : t('Newest first', 'Terbaru dahulu')}</span></header>
      {p.loading ? <div role="status" aria-label={t('Loading messages', 'Memuat pesan')} className="ams-message-loading">{[0, 1, 2, 3, 4].map((row) => <div key={row} className="ams-message-loading-row"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-1/3" /></div>)}</div>
        : !p.items.length ? state : p.table ? <div className="ams-table-scroll ams-message-table-scroll" role="region" tabIndex={0} aria-label={t('Scrollable message table', 'Tabel pesan dapat digeser')}>
        <table data-ams-feature-slug="inbox-leads-directory" className="ams-table ams-message-table">
          <thead><tr><th scope="col">{t('Sender', 'Pengirim')}</th><th scope="col">{t('Message', 'Pesan')}</th><th scope="col">{t('Source', 'Sumber')}</th>{p.commercial ? <><th scope="col">{t('Requested services', 'Layanan diminta')}</th><th scope="col">{t('Budget', 'Anggaran')}</th></> : null}<th scope="col">Status</th><th scope="col">{t('Owner', 'PIC')}</th><th scope="col">{t('Received', 'Diterima')}</th><th scope="col">{t('Saved', 'Tersimpan')}</th></tr></thead>
          <tbody>{pageItems.map((item) => <tr key={item.id}>
            <td><button type="button" className="ams-message-text-link" data-message-id={item.id} onClick={() => select(item)}>{item.fullName || item.email}</button><span className="ams-message-secondary">{item.company || item.email}</span></td>
            <td><strong className="ams-message-table-subject">{subject(item)}</strong><p className="ams-message-preview">{item.message || t('No message provided', 'Pesan tidak disertakan')}</p></td><td>{item.source || t('Not recorded', 'Tidak tercatat')}</td>
            {p.commercial ? <><td>{item.services?.join(', ') || item.specialty || t('Not provided', 'Tidak disertakan')}</td><td>{item.budget || t('Not provided', 'Tidak disertakan')}</td></> : null}
            <td><span className="ams-message-row-context">{badges(item)}</span></td><td>{item.assignedTo || t('Unassigned', 'Belum ditugaskan')}</td><td><time dateTime={item.createdAt}>{date(item.createdAt)}</time></td><td>{star(item)}</td>
          </tr>)}</tbody>
        </table></div> : <div className="ams-message-rows" data-ams-feature-slug="inbox-message-list" data-ams-slug="inbox-message-list">
          {pageItems.map((item) => <div key={item.id} className={'ams-message-row' + (selected?.id === item.id ? ' is-selected' : '')}>
            <button type="button" className="ams-message-row-select" data-message-id={item.id} aria-pressed={selected?.id === item.id} aria-controls="message-workspace-reader" onClick={() => select(item)}>
              <span className="ams-message-row-top"><span className="ams-message-row-person"><span className="ams-message-avatar ams-message-avatar--small" aria-hidden="true">{(item.fullName || item.email).slice(0, 1).toUpperCase()}</span><span><strong>{item.fullName || item.email}</strong><span className="ams-message-company">{item.company || item.email}</span></span></span><time dateTime={item.createdAt}>{date(item.createdAt)}</time></span>
              <span className="ams-message-row-subject">{subject(item)}</span><span className="ams-message-preview">{item.message || t('No message provided', 'Pesan tidak disertakan')}</span>
              <span className="ams-message-row-bottom"><span className="ams-message-row-context">{badges(item)}</span><span className="ams-message-owner"><User size={12} aria-hidden="true" />{item.assignedTo || t('Unassigned', 'Belum ditugaskan')}</span></span>
            </button>{star(item)}
          </div>)}
        </div>}
      {p.items.length > 0 && !p.loading && <AdminTablePagination total={p.items.length} page={p.page} pageSize={p.pageSize} onPageChange={p.onPage} onPageSizeChange={p.onPageSize} itemLabel={t('messages', 'pesan')} slug="message-workspace-pagination" />}
    </section>

    {p.table ? <Drawer slug="inbox-message-detail-drawer" open={Boolean(selected)} onClose={() => { if (!p.savingNote && !p.converting) p.onBack(); }} title="Message detail" size="2xl" initialFocusRef={readerTitle} closeOnEscape={!p.savingNote && !p.converting} footer={readerFooter}>{reader}</Drawer> : reader}
  </div>;
};
