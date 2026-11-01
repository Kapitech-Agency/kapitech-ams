import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, FileText, SlidersHorizontal, MessageSquare, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AdminModuleHeader, AdminPageShell, AdminPanel, AdminSectionTabs } from '../AdminModulePrimitives';
import { DashboardControl } from '../DashboardControls';
import { DashboardEmptyState } from '../DashboardEmptyState';
import { CustomSelect } from '../../ui/CustomSelect';
import { useLanguage } from '../../../lib/LanguageContext';
import { getInboxResponseTemplates } from './responseTemplates';
import './InboxRoutingTemplates.css';

export const InboxRoutingTemplates: React.FC = () => {
  const { language } = useLanguage();
  const [params, setParams] = useSearchParams();
  const section = params.get('section') === 'templates' ? 'templates' : 'rules';
  const templates = useMemo(() => getInboxResponseTemplates(language), [language]);
  const templateKey = params.get('template');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const detailTitle = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const lastSelected = useRef<string | null>(null);
  const selected = section === 'templates' ? templates.find((item) => item.key === templateKey) : undefined;
  const categories = Array.from(new Set(templates.map((item) => item.category)));
  const filtered = templates.filter((item) => (category === 'all' || item.category === category) &&
    (!query.trim() || [item.title, item.category, item.subject, item.body].join(' ').toLowerCase().includes(query.toLowerCase().trim())));

  useEffect(() => {
    const invalidSection = params.has('section') && !['rules', 'templates'].includes(params.get('section') || '');
    const invalidTemplate = templateKey && (section !== 'templates' || !templates.some((item) => item.key === templateKey));
    if (!invalidSection && !invalidTemplate && !params.has('preview')) return;
    const next = new URLSearchParams(params);
    next.delete('preview');
    if (invalidSection) next.delete('section');
    if (invalidTemplate) next.delete('template');
    setParams(next, { replace: true });
  }, [params, section, templateKey, templates, setParams]);

  useEffect(() => {
    setCopiedKey(null);
    setCopyError(false);
    if (selected) {
      lastSelected.current = selected.key;
      detailTitle.current?.focus({ preventScroll: true });
    } else if (lastSelected.current) {
      const button = root.current?.querySelector<HTMLButtonElement>(`[data-template-key="${lastSelected.current}"]`);
      button?.focus({ preventScroll: true });
      lastSelected.current = null;
    }
  }, [selected?.key, section]);

  const selectTemplate = (key?: string) => {
    const next = new URLSearchParams(params);
    if (key) next.set('template', key); else next.delete('template');
    setParams(next);
  };
  const resetFilters = () => { setQuery(''); setCategory('all'); };
  const copyResponse = async () => {
    if (!selected) return;
    const key = selected.key;
    setCopyError(false);
    try { await navigator.clipboard.writeText(selected.body); setCopiedKey(key); }
    catch { setCopyError(true); }
  };

  return <AdminPageShell featureSlug="inbox-routing-templates-workspace" className="ams-inbox-message-redesign ams-inbox-routing-templates">
    <AdminModuleHeader slug="inbox-routing-templates-header" title="Routing & Templates"
      description="Keep incoming requests organized and agency responses consistent."
      actions={<DashboardControl to="/admin/inbox?view=messages" icon={<MessageSquare size={14} />}>Open messages</DashboardControl>}
    />
    <AdminSectionTabs ariaLabel="Routing and template sections" activeKey={section} className="ams-routing-sections" items={[
      { key: 'rules', label: 'Routing Rules', to: '/admin/inbox?view=routing-templates&section=rules' },
      { key: 'templates', label: 'Response Templates', to: '/admin/inbox?view=routing-templates&section=templates' },
    ]} />
    {section === 'rules' ? <AdminPanel slug="inbox-routing-rules-register" title="Routing Rules"
      description="Conditions, ownership and priority for incoming conversations."
      actions={<span className="ams-routing-source-label">Unavailable</span>} bodyClassName="ams-routing-state" >
      <DashboardEmptyState eyebrow="INCOMING MESSAGE ROUTING" icon={<SlidersHorizontal size={17} aria-hidden="true" />}
        title="Automatic routing is not available yet"
        description="Incoming messages can still be reviewed and assigned in Messages. Automatic routing rules are not available in this inbox yet."
        action={<DashboardControl to="/admin/inbox?view=messages" icon={<MessageSquare size={14} />}>Review messages</DashboardControl>}
      />
    </AdminPanel> : <>
      <section className="ams-inbox2-toolbar" aria-label="Template controls">
        <div className="ams-inbox2-toolbar-row">
          <label className="ams-inbox2-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Search response templates</span>
            <input aria-label="Search response templates" placeholder="Search templates or response content…" value={query} onChange={(event) => { setQuery(event.target.value); if (templateKey) selectTemplate(); }} />
            {query && <button type="button" aria-label="Clear template search" onClick={() => setQuery('')}><X size={14} /></button>}
          </label>
          <div className="ams-routing-category"><CustomSelect aria-label="Filter templates by category" value={category}
            onChange={(value) => { setCategory(value); if (templateKey) selectTemplate(); }}
            options={[{ value: 'all', label: 'All categories' }, ...categories.map((value) => ({ value, label: value }))]} /></div>
          {(query || category !== 'all') && <DashboardControl variant="quiet" onClick={resetFilters}>Reset filters</DashboardControl>}
        </div>
      </section>
      <div ref={root} className={'ams-template-workspace' + (selected ? ' has-selection' : '')}>
        <AdminPanel slug="inbox-response-template-library" className="ams-template-register" title="Response Templates"
          description="Existing built-in responses used in Messages." actions={<span className="ams-routing-source-label">{filtered.length} of {templates.length}</span>}>
          {filtered.length ? <div className="ams-template-list">{filtered.map((item) => {
            const Icon = item.icon;
            return <button type="button" key={item.key} data-template-key={item.key} className="ams-template-row" aria-pressed={selected?.key === item.key}
              aria-controls="inbox-template-detail" onClick={() => selectTemplate(item.key)}>
              <span className="ams-template-row-icon"><Icon size={16} aria-hidden="true" /></span>
              <span><strong>{item.title}</strong><span className="ams-template-category">{item.category}</span><span className="ams-template-excerpt">{item.subject}</span></span>
            </button>;
          })}</div> : <div className="ams-routing-state"><DashboardEmptyState eyebrow="RESPONSE TEMPLATES" title="No matching templates"
            description="Try a different search or reset the category filter." icon={<FileText size={17} aria-hidden="true" />}
            action={<DashboardControl onClick={resetFilters}>Reset filters</DashboardControl>} /></div>}
        </AdminPanel>
        <section id="inbox-template-detail" className="ams-template-detail" aria-label="Response template detail">
          {selected ? <>
            <header className="ams-template-detail-header">
              <div className="ams-template-detail-actions"><DashboardControl variant="quiet" icon={<ArrowLeft size={14} />} onClick={() => selectTemplate()}>Back to templates</DashboardControl><span className="ams-routing-source-label">Built-in · Read-only</span><DashboardControl icon={copiedKey === selected.key ? <Check size={14} /> : <Copy size={14} />} onClick={() => void copyResponse()}>{copiedKey === selected.key ? 'Copied' : 'Copy response'}</DashboardControl></div>
              <h2 ref={detailTitle} tabIndex={-1}>{selected.title}</h2><p>{selected.category}</p>{copyError && <p role="alert">Could not copy the response. Select and copy the response text instead.</p>}
            </header>
            <div className="ams-template-detail-body">
              <dl><div><dt>Channels in Messages</dt><dd>Email, or WhatsApp when the contact has a phone number.</dd></div><div><dt>Subject</dt><dd>{selected.subject}</dd></div><div><dt>Personalization</dt><dd>Contact name, company and requested services are filled from the selected message.</dd></div></dl>
              <section aria-labelledby="inbox-template-response-heading"><h3 id="inbox-template-response-heading">Response content</h3><p className="ams-template-body">{selected.body}</p></section>
            </div>
            <footer className="ams-template-detail-footer"><div className="ams-template-detail-actions">
              <DashboardControl to="/admin/inbox?view=messages" icon={<MessageSquare size={14} />}>Use from Messages</DashboardControl>
            </div><p>Placeholder text is shown here. Open a message to personalize a response before sending.</p>
              {copiedKey === selected.key && <span className="sr-only" role="status">Response copied to clipboard</span>}
            </footer>
          </> : <div className="ams-routing-state"><DashboardEmptyState eyebrow="RESPONSE CONTENT" icon={<FileText size={17} aria-hidden="true" />}
            title="Select a response template" description="Read the existing response and its subject before using it from a message." /></div>}
        </section>
      </div>
    </>}
  </AdminPageShell>;
};
