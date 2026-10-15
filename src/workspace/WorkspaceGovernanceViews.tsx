import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Check, CheckCircle2, FileText, LockKeyhole, ShieldCheck, UsersRound } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { WorkspaceRole } from './workspaceAccess';
import {
  ActionButton,
  dateLabel,
  MetricCard,
  SectionPanel,
  SelectField,
  StatusBadge,
  TableScroller,
  tableCellClassName,
  tableClassName,
  tableHeadClassName,
  TextField,
  WorkspacePage,
} from './WorkspacePrimitives';

interface EditorialItem {
  id: string;
  title: string;
  kind: 'Insight' | 'Portfolio';
  owner: string;
  publishAt: string;
  status: 'Draft' | 'In review' | 'Scheduled' | 'Published';
  summary: string;
}
interface QuarantineRecord {
  id: string;
  title: string;
  metricDefined: boolean;
  evidenceLinked: boolean;
  clientApproved: boolean;
  status: 'Quarantined' | 'Eligible';
}
const INITIAL_EDITORIAL: EditorialItem[] = [
  { id: 'ED-061', title: 'MVP vs. Prototype vs. Proof of Concept', kind: 'Insight', owner: 'Editorial Team', publishAt: '2026-10-21', status: 'In review', summary: 'A decision framework for choosing the smallest experiment that resolves the biggest uncertainty.' },
  { id: 'ED-062', title: 'Designing an enterprise client portal', kind: 'Insight', owner: 'Mika Putri', publishAt: '2026-10-26', status: 'Draft', summary: 'Practical notes on access boundaries, workflow clarity and operational adoption.' },
  { id: 'ED-063', title: 'Nusantara Health Portal case study', kind: 'Portfolio', owner: 'Project Office', publishAt: '2026-10-29', status: 'In review', summary: 'A delivery narrative awaiting measured impact and client approval evidence.' },
];
const INITIAL_QUARANTINE: QuarantineRecord[] = [
  { id: 'Q-021', title: 'Nusantara Health Portal case study', metricDefined: true, evidenceLinked: false, clientApproved: false, status: 'Quarantined' },
  { id: 'Q-022', title: 'Aurora Commerce product redesign', metricDefined: true, evidenceLinked: true, clientApproved: true, status: 'Eligible' },
  { id: 'Q-023', title: 'Partner Portal engineering story', metricDefined: false, evidenceLinked: true, clientApproved: true, status: 'Quarantined' },
];

export const CmsEditorialView: React.FC<{ role: WorkspaceRole | null }> = ({ role }) => {
  const isEditor = role === 'Creative';
  const [editorial, setEditorial] = useState(INITIAL_EDITORIAL);
  const [quarantine, setQuarantine] = useState(INITIAL_QUARANTINE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [workingTitle, setWorkingTitle] = useState('');
  const [workingSummary, setWorkingSummary] = useState('');
  const [notice, setNotice] = useState('');
  const selectedItem = editorial.find((item) => item.id === selectedId) || null;

  const startEdit = (item: EditorialItem) => {
    setSelectedId(item.id);
    setWorkingTitle(item.title);
    setWorkingSummary(item.summary);
  };
  const saveDraft = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedItem || !workingTitle.trim()) return;
    setEditorial((items) => items.map((item) => item.id === selectedItem.id ? { ...item, title: workingTitle.trim(), summary: workingSummary.trim(), status: item.status === 'Published' ? 'Published' : 'Draft' } : item));
    setSelectedId(null);
    setNotice('Editorial changes saved in local preview state only.');
  };
  const toggleValidation = (id: string, field: 'metricDefined' | 'evidenceLinked' | 'clientApproved') => {
    setQuarantine((items) => items.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: !item[field] };
      updated.status = updated.metricDefined && updated.evidenceLinked && updated.clientApproved ? 'Eligible' : 'Quarantined';
      return updated;
    }));
  };
  const approvePublication = (record: QuarantineRecord) => {
    if (isEditor || !(record.metricDefined && record.evidenceLinked && record.clientApproved)) return;
    setQuarantine((items) => items.map((item) => item.id === record.id ? { ...item, status: 'Eligible' } : item));
    setEditorial((items) => items.map((item) => item.title === record.title ? { ...item, status: 'Scheduled' } : item));
    setNotice(record.title + ' passed the visible quarantine gate and was marked Scheduled in the local preview.');
  };
  const quarantinedCount = quarantine.filter((item) => !(item.metricDefined && item.evidenceLinked && item.clientApproved)).length;

  return (
    <WorkspacePage slug="workspace-cms-editorial" title="Insight Editorial Packs & Portfolio Quarantine" description={isEditor ? 'Editor view for article drafts, publishing schedule and visible quarantine validation status.' : 'Editorial calendar and release gates for validating outcome metrics before publication approval.'} actions={<StatusBadge tone={isEditor ? 'info' : 'neutral'}>{isEditor ? 'Creative · Editor view' : 'Editorial governance'}</StatusBadge>}>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Editorial items" value={String(editorial.length)} detail="Insight and portfolio records" icon={<FileText size={15} />} />
        <MetricCard label="Awaiting review" value={String(editorial.filter((item) => item.status === 'In review').length)} detail="Requires internal review" tone="warning" />
        <MetricCard label="Quarantine gates blocked" value={String(quarantinedCount)} detail="Missing required outcome evidence" tone={quarantinedCount ? 'danger' : 'success'} icon={<ShieldCheck size={15} />} />
      </div>
      {notice && <div role="status" className="rounded-control border border-line bg-panel px-3 py-2.5 text-[11px] leading-5 text-muted">{notice}</div>}
      <SectionPanel title="Editorial schedule grid" description="Edit titles and summaries in this local UI. Published content and scheduled jobs remain server-managed.">
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {editorial.map((item) => (
            <article key={item.id} className="flex min-w-0 flex-col rounded-control border border-line p-4">
              <div className="flex items-start justify-between gap-2"><StatusBadge tone={item.kind === 'Insight' ? 'info' : 'neutral'}>{item.kind}</StatusBadge><StatusBadge tone={item.status === 'Published' ? 'success' : item.status === 'In review' ? 'warning' : item.status === 'Scheduled' ? 'info' : 'neutral'}>{item.status}</StatusBadge></div>
              <h3 className="mt-3 text-[13px] font-semibold leading-5 text-fg">{item.title}</h3>
              <p className="mt-2 flex-1 text-[11px] leading-5 text-muted">{item.summary}</p>
              <div className="mt-4 grid gap-1 border-t border-line pt-3 text-[10px] text-muted"><span>{item.id} · Owner: {item.owner}</span><span>Scheduled date: {dateLabel(item.publishAt)}</span></div>
              <div className="mt-3"><ActionButton compact onClick={() => startEdit(item)}><FileText size={12} />Edit content</ActionButton></div>
            </article>
          ))}
        </div>
      </SectionPanel>
      <SectionPanel title="Portfolio quarantine gate dashboard" description="UI-level publication checks around Migration 048’s quarantine principle: unverified seed content stays unpublished. These editorial checks do not replace the migration’s isPublished=false rule.">
        <div className="mb-3 flex flex-wrap gap-2">
          <StatusBadge tone="success"><CheckCircle2 size={11} />Outcome metric defined</StatusBadge>
          <StatusBadge tone="info"><FileText size={11} />Evidence linked</StatusBadge>
          <StatusBadge tone="warning"><ShieldCheck size={11} />Client approval confirmed</StatusBadge>
        </div>
        <TableScroller label="Editorial quarantine registry">
          <table className={tableClassName + ' min-w-[1000px]'}>
            <thead className={tableHeadClassName}><tr><th className="px-3 py-3">Registry ID / content</th><th className="px-3 py-3">Outcome metric</th><th className="px-3 py-3">Evidence link</th><th className="px-3 py-3">Client approval</th><th className="px-3 py-3">Gate status</th><th className="px-3 py-3">Publication action</th></tr></thead>
            <tbody>{quarantine.map((record) => {
              const ready = record.metricDefined && record.evidenceLinked && record.clientApproved;
              return <tr key={record.id} className="hover:bg-bg/60">
                <td className={tableCellClassName}><p className="font-semibold text-fg">{record.title}</p><p className="mt-1 font-mono text-[10px] text-muted">{record.id}</p></td>
                {([
                  ['metricDefined', 'Outcome metric'] as const,
                  ['evidenceLinked', 'Evidence link'] as const,
                  ['clientApproved', 'Client approval'] as const,
                ]).map(([field, label]) => <td key={field} className={tableCellClassName}>
                  <label className="inline-flex items-center gap-2 text-[11px] text-fg"><input type="checkbox" checked={record[field]} disabled={isEditor} onChange={() => toggleValidation(record.id, field)} className="h-4 w-4 accent-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-70" /><span>{record[field] ? 'Verified' : 'Missing'}</span><span className="sr-only">{label}</span></label>
                </td>)}
                <td className={tableCellClassName}><StatusBadge tone={ready ? 'success' : 'danger'}>{ready ? 'Eligible' : 'Quarantined'}</StatusBadge></td>
                <td className={tableCellClassName}>{isEditor ? <span className="text-[10px] text-muted">Editor cannot approve publication</span> : <ActionButton compact variant="primary" disabled={!ready || record.status === 'Eligible' && editorial.some((item) => item.title === record.title && item.status === 'Scheduled')} onClick={() => approvePublication(record)}>Approve schedule</ActionButton>}</td>
              </tr>;
            })}</tbody>
          </table>
        </TableScroller>
        <p className="mt-3 text-[10px] leading-4 text-muted">This registry illustrates the quarantine gate UX. The authoritative Migration 048 rules, validation and publication enforcement must remain in the existing server workflow.</p>
      </SectionPanel>
      <Modal open={Boolean(selectedItem)} onClose={() => setSelectedId(null)} title="Edit editorial item" description={selectedItem ? selectedItem.id + ' · ' + selectedItem.kind : undefined} size="lg" footer={<><ActionButton onClick={() => setSelectedId(null)}>Cancel</ActionButton><ActionButton variant="primary" onClick={() => { const form = document.getElementById('editorial-form') as HTMLFormElement | null; form?.requestSubmit(); }}>Save draft</ActionButton></>}>
        <form id="editorial-form" onSubmit={saveDraft} className="grid gap-4">
          <TextField label="Content title" value={workingTitle} onChange={(event) => setWorkingTitle(event.target.value)} required />
          <label htmlFor="editorial-summary" className="grid gap-1.5 text-[11px] font-medium text-fg">Editorial summary<textarea id="editorial-summary" value={workingSummary} onChange={(event) => setWorkingSummary(event.target.value)} rows={5} className="min-w-0 resize-y rounded-control border border-line bg-panel p-3 text-[12px] font-normal leading-5 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" /></label>
          <div className="rounded-control border border-line bg-bg p-3 text-[11px] leading-5 text-muted">Content edits in this preview do not publish or update the public website. Use the existing AMS content API for persistence.</div>
        </form>
      </Modal>
    </WorkspacePage>
  );
};

type SettingsTab = 'users' | 'rates' | 'backups' | 'telemetry';
interface WorkspaceUser {
  id: string;
  name: string;
  role: WorkspaceRole;
  mfa: boolean;
  status: 'Active' | 'Suspended';
}
const INITIAL_USERS: WorkspaceUser[] = [
  { id: 'USR-001', name: 'Agency Administrator', role: 'Admin', mfa: true, status: 'Active' },
  { id: 'USR-007', name: 'Finance Desk', role: 'Finance', mfa: true, status: 'Active' },
  { id: 'USR-012', name: 'Project Office', role: 'PM', mfa: true, status: 'Active' },
  { id: 'USR-018', name: 'Creative Studio', role: 'Creative', mfa: false, status: 'Active' },
  { id: 'USR-024', name: 'Freelance Contributor', role: 'Freelancer', mfa: false, status: 'Active' },
];

export const SystemSettingsView: React.FC = () => {
  const [tab, setTab] = useState<SettingsTab>('users');
  const [users, setUsers] = useState(INITIAL_USERS);
  const [retentionDays, setRetentionDays] = useState(14);
  const [ratesVisible, setRatesVisible] = useState(false);
  const [notice, setNotice] = useState('');
  const activeUsers = users.filter((user) => user.status === 'Active').length;
  const mfaCoverage = activeUsers
    ? Math.round(users.filter((user) => user.mfa && user.status === 'Active').length / activeUsers * 100)
    : 0;

  const updateUser = (id: string, update: Partial<WorkspaceUser>) => setUsers((items) => items.map((user) => user.id === id ? { ...user, ...update } : user));
  const tabs: Array<{ key: SettingsTab; label: string }> = [
    { key: 'users', label: 'User access' },
    { key: 'rates', label: 'Cost rate tables' },
    { key: 'backups', label: 'Data backups' },
    { key: 'telemetry', label: 'Release telemetry' },
  ];

  return (
    <WorkspacePage slug="workspace-system-settings" title="User Access, Data Backups & Release Telemetry Gates" description="Administrative controls for workspace access, sensitive rate visibility, backup retention and production readiness gates." actions={<StatusBadge tone="warning">Admin-only surface</StatusBadge>}>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active user accounts" value={String(activeUsers)} detail="Preview user directory" icon={<UsersRound size={15} />} />
        <MetricCard label="MFA coverage" value={mfaCoverage + '%'} detail="Based on preview account states" tone={mfaCoverage >= 95 ? 'success' : 'warning'} />
        <MetricCard label="Backup retention" value={retentionDays + ' days'} detail="Allowed range: 3–30 days" tone="info" />
        <MetricCard label="Production readiness" value="true" detail="Preview variable · not live telemetry" tone="success" icon={<Activity size={15} />} />
      </div>
      {notice && <div role="status" className="rounded-control border border-line bg-panel px-3 py-2.5 text-[11px] leading-5 text-muted">{notice}</div>}
      <div className="flex min-w-0 flex-wrap items-center gap-1 overflow-x-auto rounded-control border border-line bg-panel p-1" role="tablist" aria-label="System settings sections">
        {tabs.map((item) => <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} onClick={() => setTab(item.key)} className={'min-h-8 shrink-0 rounded-chip border px-3 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' + (tab === item.key ? 'border-accent/25 bg-accent/10 text-fg' : 'border-transparent text-muted hover:bg-bg hover:text-fg')}>{item.label}</button>)}
      </div>

      {tab === 'users' && <SectionPanel title="User access and role directory" description="Role changes and status toggles are local interface states. Production changes must use the existing server authorization API.">
        <TableScroller label="Workspace user access table">
          <table className={tableClassName + ' min-w-[850px]'}>
            <thead className={tableHeadClassName}><tr><th className="px-3 py-3">User ID</th><th className="px-3 py-3">Display identity</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">MFA</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">UI control</th></tr></thead>
            <tbody>{users.map((user) => <tr key={user.id} className="hover:bg-bg/60">
              <td className={tableCellClassName + ' font-mono text-[10px] text-muted'}>{user.id}</td>
              <td className={tableCellClassName + ' font-medium text-fg'}>{user.name}</td>
              <td className={tableCellClassName}><label className="sr-only" htmlFor={'role-' + user.id}>Role for {user.name}</label><select id={'role-' + user.id} value={user.role} onChange={(event) => updateUser(user.id, { role: event.target.value as WorkspaceRole })} className="h-8 rounded-control border border-line bg-panel px-2 text-[11px] text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{['Admin', 'Finance', 'PM', 'Creative', 'Freelancer'].map((role) => <option key={role}>{role}</option>)}</select></td>
              <td className={tableCellClassName}><StatusBadge tone={user.mfa ? 'success' : 'warning'}>{user.mfa ? 'Enabled' : 'Required'}</StatusBadge></td>
              <td className={tableCellClassName}><StatusBadge tone={user.status === 'Active' ? 'success' : 'danger'}>{user.status}</StatusBadge></td>
              <td className={tableCellClassName}><div className="flex flex-wrap gap-2"><ActionButton compact onClick={() => updateUser(user.id, { mfa: !user.mfa })}>{user.mfa ? 'Mark MFA off' : 'Mark MFA on'}</ActionButton><ActionButton compact variant="secondary" onClick={() => updateUser(user.id, { status: user.status === 'Active' ? 'Suspended' : 'Active' })}>{user.status === 'Active' ? 'Suspend' : 'Reactivate'}</ActionButton></div></td>
            </tr>)}</tbody>
          </table>
        </TableScroller>
      </SectionPanel>}

      {tab === 'rates' && <SectionPanel title="Encrypted cost rate table controls" description="The interface only contains example rate rows. Encryption, authorization and protected persistence remain server responsibilities.">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line bg-bg p-3">
          <div className="flex min-w-0 items-start gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-muted"><LockKeyhole size={15} /></span><div><p className="text-[12px] font-semibold text-fg">Sensitive rate table</p><p className="mt-1 text-[11px] text-muted">UI masking state: {ratesVisible ? 'sample values visible' : 'masked'}</p></div></div>
          <ActionButton onClick={() => setRatesVisible((value) => !value)}>{ratesVisible ? 'Mask sample values' : 'Reveal sample values'}</ActionButton>
        </div>
        <TableScroller label="Cost rate preview table">
          <table className={tableClassName + ' min-w-[700px]'}>
            <thead className={tableHeadClassName}><tr><th className="px-3 py-3">Rate card</th><th className="px-3 py-3">Billing basis</th><th className="px-3 py-3 text-right">cost_rate</th><th className="px-3 py-3">Access rule</th></tr></thead>
            <tbody>{[
              { name: 'Engineering · Senior', basis: 'Per hour', rate: 450000 },
              { name: 'Product design · Senior', basis: 'Per hour', rate: 375000 },
              { name: 'QA & implementation', basis: 'Per hour', rate: 260000 },
            ].map((row) => <tr key={row.name}><td className={tableCellClassName + ' font-medium text-fg'}>{row.name}</td><td className={tableCellClassName + ' text-muted'}>{row.basis}</td><td className={tableCellClassName + ' text-right font-mono tabular-nums text-fg'}>{ratesVisible ? 'Rp ' + row.rate.toLocaleString('id-ID') : '••••••••'}</td><td className={tableCellClassName}><StatusBadge tone="info">Admin UI only</StatusBadge></td></tr>)}</tbody>
          </table>
        </TableScroller>
        <p className="mt-3 text-[10px] leading-4 text-muted">This toggle does not encrypt or decrypt data. It only demonstrates a masked presentation state; the API must not return protected rates to unauthorized users.</p>
      </SectionPanel>}

      {tab === 'backups' && <SectionPanel title="Data backup retention controls" description="Choose the retention window shown by the release controls. This does not trigger a backup job.">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.7fr)]">
          <div className="rounded-control border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><label htmlFor="backup-retention" className="text-[12px] font-semibold text-fg">Backup retention window</label><StatusBadge tone="info">{retentionDays} days</StatusBadge></div>
            <input id="backup-retention" type="range" min={3} max={30} step={1} value={retentionDays} onChange={(event) => setRetentionDays(Number(event.target.value))} className="mt-5 w-full accent-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
            <div className="mt-2 flex justify-between text-[10px] tabular-nums text-muted"><span>3 days</span><span>15 days</span><span>30 days</span></div>
            <p className="mt-4 text-[11px] leading-5 text-muted">The selected value is a local control state. Actual backup lifecycle, retention enforcement and deletion must be handled by the established backup service.</p>
          </div>
          <div className="grid content-start gap-2">
            {[['Latest successful backup', '15 Oct 2026 · 02:10 WIB', 'success'], ['Last restore rehearsal', '11 Oct 2026 · Passed', 'success'], ['Storage health', 'Healthy · sample telemetry', 'info']].map(([label, value, tone]) => <div key={label} className="flex items-start justify-between gap-3 rounded-control border border-line p-3"><div><p className="text-[11px] text-muted">{label}</p><p className="mt-1 text-[11px] font-medium text-fg">{value}</p></div><StatusBadge tone={tone as 'success' | 'info'}>{tone === 'success' ? 'OK' : 'Preview'}</StatusBadge></div>)}
          </div>
        </div>
      </SectionPanel>}

      {tab === 'telemetry' && <div className="grid min-w-0 gap-4">
        <SectionPanel title="Production readiness telemetry gate" description="The gate UI reflects requested status variables with a clear preview boundary.">
          <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-control border border-line p-4"><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-semibold text-fg">productionReady</p><StatusBadge tone="success">true</StatusBadge></div><p className="mt-2 text-[11px] leading-5 text-muted">Requested release gate variable shown as true in the interface fixture.</p></article>
            <article className="rounded-control border border-line p-4"><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-semibold text-fg">MFA coverage</p><StatusBadge tone={mfaCoverage >= 95 ? 'success' : 'warning'}>{mfaCoverage}%</StatusBadge></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-series-2" style={{ width: mfaCoverage + '%' }} /></div><p className="mt-2 text-[10px] text-muted">{users.filter((user) => user.mfa).length} of {users.length} preview accounts have MFA marked enabled.</p></article>
            <article className="rounded-control border border-line p-4"><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-semibold text-fg">Telegram bot dispatcher</p><StatusBadge tone="success">Healthy</StatusBadge></div><p className="mt-2 text-[11px] leading-5 text-muted">Last heartbeat 15 Oct 2026 · 16:55 WIB · sample health record.</p></article>
          </div>
        </SectionPanel>
        <SectionPanel title="Release gate checklist" description="A release operator should verify each signal from the actual deployment and security APIs.">
          <div className="grid gap-2 md:grid-cols-2">
            {[
              ['Authentication session verification', 'Passed · preview'],
              ['Required MFA coverage threshold', mfaCoverage >= 95 ? 'Passed · preview' : 'Review required · preview'],
              ['Backup retention range', retentionDays >= 3 && retentionDays <= 30 ? 'Passed · preview' : 'Review required · preview'],
              ['Notification dispatcher heartbeat', 'Passed · preview'],
            ].map(([label, value]) => <div key={label} className="flex min-w-0 items-center gap-2.5 rounded-control border border-line p-3"><CheckCircle2 size={14} className="shrink-0 text-success" /><div className="min-w-0 flex-1"><p className="text-[11px] font-medium text-fg">{label}</p><p className="mt-1 text-[10px] text-muted">{value}</p></div></div>)}
          </div>
        </SectionPanel>
      </div>}
    </WorkspacePage>
  );
};
