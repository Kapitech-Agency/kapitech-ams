import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowUpRight, Building2, Check, FileText, Inbox, Mail, MessageSquare, Phone, Star, Trash2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ContactSubmission } from '../../../lib/submissions';
import { AdminTablePagination } from '../AdminModulePrimitives';
import { DashboardControl } from '../DashboardControls';
import { Skeleton } from '../../ui/Skeleton';
import './MessageWorkspace.css';

type Props = {
  items: ContactSubmission[];
  selected: ContactSubmission | null;
  loading: boolean;
  unavailable: boolean;
  sourceEmpty: boolean;
  language: string;
  table: boolean;
  commercial?: boolean;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  onSelect: (item: ContactSubmission) => void;
  onBack: () => void;
  onReset: () => void;
  onRetry: () => void;
  onStar: (event: React.MouseEvent, id: string, starred?: boolean) => void;
  canManage: boolean;
  canConvert: boolean;
  converting: boolean;
  onConvert: () => void;
  onDelete: () => void;
  onTemplates: () => void;
  note: string;
  onNote: (value: string) => void;
  savingNote: boolean;
  onSaveNote: () => void;
  statusControl: React.ReactNode;
  priorityControl: React.ReactNode;
  ownerControl: React.ReactNode;
  whatsAppHref?: string;
};

/** Presentation only: records, filters and every mutation remain owned by AdminInbox. */
export const MessageWorkspace: React.FC<Props> = (p) => {
  const t = (en: string, id: string) => p.language === 'id' ? id : en;
  const readerTitle = useRef<HTMLHeadingElement>(null);
  const register = useRef<HTMLElement>(null);
  const lastSelection = useRef<string | null>(null);
  const selectedId = p.selected?.id;
  useEffect(() => {
    if (selectedId) readerTitle.current?.focus({ preventScroll: true });
    else if (lastSelection.current) {
      const buttons: NodeListOf<HTMLButtonElement> | undefined = register.current?.querySelectorAll('[data-message-id]');
      buttons?.forEach((button) => {
        if (button.dataset.messageId === lastSelection.current) button.focus({ preventScroll: true });
      });
    }
  }, [selectedId]);
  const select = (event: React.MouseEvent<HTMLButtonElement>, item: ContactSubmission) => {
    lastSelection.current = item.id;
    p.onSelect(item);
  };
  const date = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? t('Date not recorded', 'Tanggal tidak tercatat')
      : parsed.toLocaleDateString(p.language === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const status = (item: ContactSubmission) => ({ new: t('New', 'Baru'), 'in-review': t('In review', 'Ditinjau'), contacted: t('Contacted', 'Dihubungi'), closed: t('Closed deal', 'Deal ditutup') }[item.status] || item.status);
  const category = (item: ContactSubmission) => item.type === 'vendor' ? t('Freelance vendor', 'Vendor freelance') : item.type === 'newsletter' ? 'Newsletter' : t('Sales inquiry', 'Inquiry penjualan');
  const pageItems = p.items.slice((p.page - 1) * p.pageSize, p.page * p.pageSize);
  const selected = p.selected;
  const star = (item: ContactSubmission) => <button type="button" className={'ams-message-star' + (item.starred ? ' is-saved' : '')} disabled={!p.canManage} aria-pressed={Boolean(item.starred)} aria-label={`${item.starred ? t('Unstar', 'Hapus bintang') : t('Star', 'Beri bintang')} ${item.fullName || item.email}`} onClick={(event) => p.onStar(event, item.id, item.starred)}><Star size={16} aria-hidden="true" /></button>;
  const state = <div className="ams-message-state">
    <Inbox size={24} aria-hidden="true" />
    <h3>{p.unavailable ? t('Inbox unavailable', 'Inbox tidak tersedia') : p.sourceEmpty ? t('Your next conversation starts here', 'Percakapan berikutnya dimulai di sini') : t('No matching messages', 'Tidak ada pesan yang sesuai')}</h3>
    <p>{p.unavailable ? t('Messages could not be loaded. Retry to check the inbox.', 'Pesan gagal dimuat. Coba lagi untuk memeriksa inbox.') : p.sourceEmpty ? t('Incoming creative briefs, IT inquiries and partner messages will appear here.', 'Brief creative, inquiry IT, dan pesan mitra yang masuk akan muncul di sini.') : t('Try a different search or reset the filters to see more messages.', 'Ubah pencarian atau reset filter untuk melihat pesan lainnya.')}</p>
    {p.unavailable ? <DashboardControl onClick={p.onRetry}>{t('Retry', 'Coba lagi')}</DashboardControl> : !p.sourceEmpty ? <DashboardControl onClick={p.onReset}>{t('Reset filters', 'Reset filter')}</DashboardControl> : null}
  </div>;
  const pagination = p.items.length > 0 && !p.loading ? <AdminTablePagination total={p.items.length} page={p.page} pageSize={p.pageSize} onPageChange={p.onPage} onPageSizeChange={p.onPageSize} itemLabel={t('messages', 'pesan')} slug="message-workspace-pagination" /> : null;

  return <div className={'ams-message-workspace' + (selected ? ' has-selection' : '') + (p.table && !selected ? ' is-table' : '')} data-ams-feature-slug="message-workspace">
    <section ref={register} className="ams-message-register" aria-label={t('Message register', 'Daftar pesan')}>
      <header className="ams-message-panel-heading"><h2>{t('Incoming messages', 'Pesan masuk')}</h2><span>{t('Newest first', 'Terbaru dahulu')}</span></header>
      {p.loading ? <div role="status" aria-label={t('Loading messages', 'Memuat pesan')} className="ams-message-loading">{[0, 1, 2, 3, 4].map((row) => <div key={row} className="ams-message-loading-row"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-1/3" /></div>)}</div>
        : !p.items.length ? state : p.table && !selected ? <div className="ams-table-scroll ams-message-table-scroll" role="region" tabIndex={0} aria-label={t('Scrollable message table', 'Tabel pesan dapat digeser')}><table data-ams-feature-slug="inbox-leads-directory" className="ams-table ams-message-table"><thead><tr><th scope="col">{t('Sender', 'Pengirim')}</th><th scope="col">{t('Message', 'Pesan')}</th><th scope="col">{t('Source', 'Sumber')}</th>{p.commercial ? <><th scope="col">{t('Requested services', 'Layanan diminta')}</th><th scope="col">{t('Budget', 'Anggaran')}</th></> : null}<th scope="col">Status</th><th scope="col">{t('Owner', 'PIC')}</th><th scope="col">{t('Received', 'Diterima')}</th><th scope="col">{t('Saved', 'Tersimpan')}</th></tr></thead><tbody>{pageItems.map((item) => <tr key={item.id}><td><button type="button" className="ams-message-text-link" data-message-id={item.id} onClick={(event) => select(event, item)}>{item.fullName || item.email}</button><span className="ams-message-secondary">{item.company || item.email}</span></td><td><span className="ams-message-secondary">{category(item)}</span><p className="ams-message-preview">{item.message || t('No message provided', 'Pesan tidak disertakan')}</p></td><td>{item.source || t('Not recorded', 'Tidak tercatat')}</td>{p.commercial ? <><td>{item.services?.join(', ') || item.specialty || t('Not provided', 'Tidak disertakan')}</td><td>{item.budget || t('Not provided', 'Tidak disertakan')}</td></> : null}<td><span className={'ams-message-status is-' + item.status}>{status(item)}</span><span className="ams-message-secondary">{item.priority || 'normal'}</span></td><td>{item.assignedTo || t('Unassigned', 'Belum ditugaskan')}</td><td><time dateTime={item.createdAt}>{date(item.createdAt)}</time></td><td>{star(item)}</td></tr>)}</tbody></table></div>
          : <div className="ams-message-rows" data-ams-feature-slug="inbox-message-list" data-ams-slug="inbox-message-list">{pageItems.map((item) => <div key={item.id} className={'ams-message-row' + (selected?.id === item.id ? ' is-selected' : '')}>
            <button type="button" className="ams-message-row-select" data-message-id={item.id} aria-pressed={selected?.id === item.id} aria-controls="message-workspace-reader" onClick={(event) => select(event, item)}>
              <span className="ams-message-row-top"><strong>{item.fullName || item.email}</strong><time dateTime={item.createdAt}>{date(item.createdAt)}</time></span>
              <span className="ams-message-company">{item.company || item.email}</span>
              <span className="ams-message-preview">{item.message || t('No message provided', 'Pesan tidak disertakan')}</span>
              <span className="ams-message-row-context"><span className={'ams-message-status is-' + item.status}>{status(item)}</span><span>{category(item)}</span>{item.priority === 'urgent' || item.priority === 'high' ? <span className={'ams-message-priority is-' + item.priority}>{item.priority === 'urgent' ? t('Urgent', 'Mendesak') : t('High priority', 'Prioritas tinggi')}</span> : null}</span>
              <span className="ams-message-owner"><User size={12} aria-hidden="true" />{item.assignedTo || t('Unassigned', 'Belum ditugaskan')}</span>
            </button>{star(item)}
          </div>)}</div>}
      {pagination}
    </section>

    <section data-ams-feature-slug="inbox-message-reader" id="message-workspace-reader" className="ams-message-reader" aria-label={t('Message detail', 'Detail pesan')}>
      {p.loading ? <div className="ams-message-reader-content" aria-label={t('Loading message detail', 'Memuat detail pesan')}><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-32 w-full" /></div> : selected ? <>
        <header className="ams-message-reader-header">
          <div className="ams-message-reader-utilities"><DashboardControl onClick={p.onBack} icon={<ArrowLeft size={16} />} showArrow={false}>{t('Back to messages', 'Kembali ke daftar')}</DashboardControl><span>{category(selected)}</span>{star(selected)}</div>
          <div className="ams-message-sender"><span className="ams-message-avatar" aria-hidden="true">{(selected.fullName || selected.email).slice(0, 1).toUpperCase()}</span><div><h2 ref={readerTitle} tabIndex={-1}>{selected.fullName || selected.email}</h2><p><Building2 size={14} aria-hidden="true" />{selected.company || t('Company not provided', 'Perusahaan tidak disertakan')}</p></div></div>
          <div className="ams-message-contact"><a href={`mailto:${selected.email}`}><Mail size={14} aria-hidden="true" />{selected.email}</a>{selected.phone ? <a href={`tel:${selected.phone}`}><Phone size={14} aria-hidden="true" />{selected.phone}</a> : null}{p.whatsAppHref ? <a href={p.whatsAppHref} target="_blank" rel="noopener noreferrer"><MessageSquare size={14} aria-hidden="true" />WhatsApp<ArrowUpRight size={14} aria-hidden="true" /></a> : null}</div>
          <div className="ams-message-received"><time dateTime={selected.createdAt}>{date(selected.createdAt)}</time><span>{selected.source || t('Source not recorded', 'Sumber tidak tercatat')}</span></div>
        </header>
        <div className="ams-message-reader-content">
          <section className="ams-message-brief" aria-labelledby="message-brief-heading"><h3 id="message-brief-heading"><MessageSquare size={16} aria-hidden="true" />{t('Message & brief', 'Pesan & brief')}</h3><p>{selected.message || t('The sender did not include a message.', 'Pengirim tidak menyertakan pesan.')}</p></section>
          <dl className="ams-message-scope"><div><dt>{t('Requested services', 'Layanan yang diminta')}</dt><dd>{selected.services?.length ? <div className="ams-message-service-tags">{selected.services.map((service, index) => <span key={`${service}-${index}`}>{service}</span>)}</div> : selected.specialty || t('Not provided', 'Tidak disertakan')}</dd></div><div><dt>{t('Stated budget / rate', 'Anggaran / tarif disampaikan')}</dt><dd>{selected.budget || selected.rateCard || t('Not provided', 'Tidak disertakan')}</dd></div></dl>
          <section className="ams-message-handling" aria-labelledby="message-handling-heading"><h3 id="message-handling-heading">{t('Triage & ownership', 'Triase & penanggung jawab')}</h3><div className="ams-message-handling-fields"><div><span>{t('Status', 'Status')}</span>{p.statusControl}</div><div><span>{t('Priority', 'Prioritas')}</span>{p.priorityControl}</div><div><span>{t('Owner / PIC', 'Penanggung jawab / PIC')}</span>{p.ownerControl}</div></div></section>
          <section className="ams-message-notes" aria-labelledby="message-notes-heading"><div className="ams-message-section-heading"><h3 id="message-notes-heading"><FileText size={16} aria-hidden="true" />{t('Internal notes', 'Catatan internal')}</h3><span>{t('Agency team only', 'Hanya tim agensi')}</span></div><label htmlFor="message-workspace-notes">{t('Discovery, creative direction & technical context', 'Discovery, arahan creative & konteks teknis')}</label><textarea id="message-workspace-notes" value={p.note} onChange={(event) => p.onNote(event.target.value)} disabled={!p.canManage || p.savingNote} placeholder={t('Capture scope, deliverables, constraints and the next agreed step…', 'Catat lingkup, deliverable, batasan, dan langkah berikutnya yang disepakati…')} /><div className="ams-message-notes-action"><DashboardControl onClick={p.onSaveNote} disabled={!p.canManage || p.savingNote || p.note === (selected.internalNotes || '')} icon={<Check size={16} />}>{p.savingNote ? t('Saving…', 'Menyimpan…') : t('Save notes', 'Simpan catatan')}</DashboardControl></div></section>
        </div>
        <footer className="ams-message-reader-footer"><div className="ams-message-next-actions"><DashboardControl onClick={p.onTemplates} icon={<Mail size={16} />} disabled={!p.canManage}>{t('Response templates', 'Template balasan')}</DashboardControl>{selected.convertedClientId && p.canConvert ? <Link className="ams-message-client-link" to={`/admin/clients?client=${encodeURIComponent(selected.convertedClientId)}`}>{t('View linked client', 'Lihat klien terhubung')}<ArrowUpRight size={16} /></Link> : p.canConvert && (!selected.type || selected.type === 'inquiry') ? <DashboardControl onClick={p.onConvert} disabled={p.converting} variant="primary">{p.converting ? t('Converting…', 'Mengonversi…') : t('Convert to client', 'Konversi ke klien')}</DashboardControl> : null}</div>{p.canManage ? <DashboardControl onClick={p.onDelete} icon={<Trash2 size={16} />} ariaLabel={t('Delete message', 'Hapus pesan')} title={t('Delete message', 'Hapus pesan')} /> : null}</footer>
      </> : <div className="ams-message-state ams-message-reader-placeholder"><span className="ams-message-placeholder-icon"><MessageSquare size={24} aria-hidden="true" /></span><span>{t('Your agency communication workspace', 'Ruang komunikasi agensi')}</span><h2>{t('A clear brief. A clear next step.', 'Brief yang jelas. Langkah yang terarah.')}</h2><p>{t('Select a message to review the brief, understand creative or technical needs, and coordinate the next step with your team.', 'Pilih pesan untuk meninjau brief, memahami kebutuhan creative atau teknis, dan mengoordinasikan langkah berikutnya bersama tim.')}</p><div className="ams-message-reading-guide"><span><MessageSquare size={16} />{t('Review the request', 'Tinjau permintaan')}</span><span><User size={16} />{t('Confirm ownership', 'Pastikan PIC')}</span><span><FileText size={16} />{t('Keep context together', 'Satukan konteks')}</span></div></div>}
    </section>
  </div>;
};
