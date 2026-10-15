import React, { useMemo, useState } from 'react';
import { Building2, Check, ChevronRight, FileText, GripVertical, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { WorkspaceRole } from './workspaceAccess';
import {
  ActionButton,
  dateLabel,
  idr,
  idrCompact,
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

type DealStage = 'Discovery' | 'Qualification' | 'Proposal Sent' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
interface Deal {
  id: string;
  company: string;
  contact: string;
  service: string;
  value: number;
  stage: DealStage;
  probability: number;
  nextStep: string;
}
const DEAL_STAGES: DealStage[] = ['Discovery', 'Qualification', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'];
const STAGE_PROBABILITY: Record<DealStage, number> = {
  Discovery: 20,
  Qualification: 35,
  'Proposal Sent': 60,
  Negotiation: 80,
  'Closed Won': 100,
  'Closed Lost': 0,
};
const INITIAL_DEALS: Deal[] = [
  { id: 'DL-103', company: 'Northstar Commerce', contact: 'Dara Wijaya', service: 'E-commerce platform', value: 40000000, stage: 'Discovery', probability: 20, nextStep: 'Discovery call · 16 Oct' },
  { id: 'DL-107', company: 'Nusantara Health', contact: 'Arman Satria', service: 'Patient portal', value: 78000000, stage: 'Qualification', probability: 35, nextStep: 'Confirm scope · 17 Oct' },
  { id: 'DL-112', company: 'Partner Portal Co.', contact: 'Nadia Putri', service: 'Web application', value: 92000000, stage: 'Proposal Sent', probability: 60, nextStep: 'Proposal review · 18 Oct' },
  { id: 'DL-114', company: 'Aurora Commerce', contact: 'Rina Maheswari', service: 'Product design & build', value: 110000000, stage: 'Negotiation', probability: 80, nextStep: 'Finalize SOW · 19 Oct' },
  { id: 'DL-095', company: 'Sababay Digital', contact: 'Made Aditya', service: 'Website engineering', value: 64000000, stage: 'Closed Won', probability: 100, nextStep: 'Onboarding started' },
  { id: 'DL-089', company: 'Bumi Data Labs', contact: 'Rizky Pramana', service: 'Internal dashboard', value: 50000000, stage: 'Closed Lost', probability: 0, nextStep: 'Closed · 09 Oct' },
];

function probabilityTone(probability: number): 'success' | 'warning' | 'danger' | 'info' {
  if (probability >= 80) return 'success';
  if (probability >= 50) return 'info';
  if (probability >= 20) return 'warning';
  return 'danger';
}

export const SalesPipelineView: React.FC<{ role: WorkspaceRole | null }> = ({ role }) => {
  const [deals, setDeals] = useState(INITIAL_DEALS);
  const [dragId, setDragId] = useState<string | null>(null);
  const readOnly = role === 'PM';
  const weightedPipeline = deals.filter((deal) => !['Closed Won', 'Closed Lost'].includes(deal.stage))
    .reduce((total, deal) => total + deal.value * deal.probability / 100, 0);
  const moveDeal = (dealId: string, stage: DealStage) => {
    if (readOnly) return;
    setDeals((items) => items.map((deal) => deal.id === dealId ? { ...deal, stage, probability: STAGE_PROBABILITY[stage] } : deal));
  };

  return (
    <WorkspacePage
      slug="workspace-sales-pipeline"
      title="Sales & Deal Pipeline"
      description="Opportunity workflow from discovery through close, including stage probability and weighted estimates."
      actions={<StatusBadge tone={readOnly ? 'warning' : 'info'}>{readOnly ? 'PM · Read-only' : 'Drag or select a stage'}</StatusBadge>}
    >
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Weighted open pipeline" value={idrCompact(weightedPipeline)} detail="Closed deals excluded" tone="info" />
        <MetricCard label="Active opportunities" value={String(deals.filter((deal) => !['Closed Won', 'Closed Lost'].includes(deal.stage)).length)} detail="Across six stages" />
        <MetricCard label="Closed won · sample" value={idrCompact(deals.filter((deal) => deal.stage === 'Closed Won').reduce((sum, deal) => sum + deal.value, 0))} detail="Won opportunities in this preview" tone="success" />
      </div>
      {readOnly && <div className="rounded-control border border-line bg-panel px-3 py-2.5 text-[11px] leading-5 text-muted">PM view is read-only. Deal cards cannot be dragged or moved; stage controls are disabled.</div>}
      <SectionPanel title="Opportunity kanban" description="Weighted value = deal value × probability. Drop a card into another stage to update the local preview.">
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max items-start gap-3">
            {DEAL_STAGES.map((stage) => {
              const stageDeals = deals.filter((deal) => deal.stage === stage);
              const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value * deal.probability / 100, 0);
              return (
                <section
                  key={stage}
                  onDragOver={(event) => { if (!readOnly) event.preventDefault(); }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!readOnly && dragId) moveDeal(dragId, stage);
                    setDragId(null);
                  }}
                  aria-label={stage + ' column'}
                  className="w-[248px] min-w-[248px] rounded-card border border-line bg-bg/60 p-2.5"
                >
                  <header className="mb-2.5 border-b border-line px-1 pb-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[11px] font-semibold text-fg">{stage}</h3>
                      <span className="rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] tabular-nums text-muted">{stageDeals.length}</span>
                    </div>
                    <p className="mt-1.5 text-[10px] tabular-nums text-muted">Weighted {idrCompact(stageValue)}</p>
                  </header>
                  <div className="grid min-h-[170px] content-start gap-2">
                    {stageDeals.map((deal) => (
                      <article
                        key={deal.id}
                        draggable={!readOnly}
                        onDragStart={(event) => {
                          if (readOnly) return;
                          setDragId(deal.id);
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('text/plain', deal.id);
                        }}
                        onDragEnd={() => setDragId(null)}
                        aria-disabled={readOnly}
                        className={'min-w-0 rounded-control border border-line bg-panel p-3 ' + (!readOnly ? 'cursor-grab active:cursor-grabbing' : 'cursor-default') + (dragId === deal.id ? ' opacity-50' : '')}
                      >
                        <div className="flex items-start gap-2">
                          {!readOnly && <GripVertical size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold leading-4 text-fg">{deal.company}</p>
                            <p className="mt-1 text-[10px] text-muted">{deal.id} · {deal.service}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[12px] font-semibold tabular-nums text-fg">{idrCompact(deal.value)}</span>
                          <StatusBadge tone={probabilityTone(deal.probability)}>{deal.probability}%</StatusBadge>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
                          <span className="text-[10px] text-muted">Weighted value</span>
                          <span className="text-[11px] font-semibold tabular-nums text-fg">{idrCompact(deal.value * deal.probability / 100)}</span>
                        </div>
                        <p className="mt-2 truncate text-[10px] text-muted">{deal.contact} · {deal.nextStep}</p>
                        <label className="mt-3 grid gap-1 text-[10px] font-medium text-muted">
                          Change stage
                          <select
                            aria-label={'Change stage for ' + deal.company}
                            value={deal.stage}
                            disabled={readOnly}
                            onChange={(event) => moveDeal(deal.id, event.target.value as DealStage)}
                            className="h-8 min-w-0 rounded-control border border-line bg-panel px-2 text-[10px] text-fg disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {DEAL_STAGES.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                      </article>
                    ))}
                    {stageDeals.length === 0 && <p className="rounded-control border border-dashed border-line p-4 text-center text-[10px] text-muted">Drop a deal here</p>}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </SectionPanel>
    </WorkspacePage>
  );
};

interface ClientRecord {
  id: string;
  company: string;
  npwp: string;
  pic: string;
  email: string;
  phone: string;
  health: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  status: 'Active' | 'Onboarding' | 'At risk';
}
const CLIENTS: ClientRecord[] = [
  { id: 'CLI-0021', company: 'Aurora Commerce', npwp: '02.***.***.4-021.000', pic: 'Rina Maheswari', email: 'rina@example.test', phone: '+62 21 5550 1021', health: 'A', status: 'Active' },
  { id: 'CLI-0022', company: 'Nusantara Health', npwp: '03.***.***.6-018.000', pic: 'Arman Satria', email: 'arman@example.test', phone: '+62 21 5550 1022', health: 'B', status: 'Active' },
  { id: 'CLI-0023', company: 'Partner Portal Co.', npwp: '01.***.***.8-014.000', pic: 'Nadia Putri', email: 'nadia@example.test', phone: '+62 21 5550 1023', health: 'C', status: 'Onboarding' },
  { id: 'CLI-0024', company: 'Sababay Digital', npwp: '04.***.***.9-009.000', pic: 'Made Aditya', email: 'made@example.test', phone: '+62 21 5550 1024', health: 'D', status: 'At risk' },
  { id: 'CLI-0025', company: 'Northstar Commerce', npwp: '05.***.***.1-025.000', pic: 'Dara Wijaya', email: 'dara@example.test', phone: '+62 21 5550 1025', health: 'B', status: 'Active' },
];
const HEALTH_TONE: Record<ClientRecord['health'], 'success' | 'info' | 'warning' | 'danger'> = {
  A: 'success', B: 'success', C: 'info', D: 'warning', E: 'warning', F: 'danger',
};

export const ClientDirectoryView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const filtered = useMemo(() => CLIENTS.filter((client) => {
    const matchesQuery = (client.company + ' ' + client.id + ' ' + client.pic).toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'All' || client.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [query, statusFilter]);

  return (
    <WorkspacePage slug="workspace-client-directory" title="Client Directory" description="Corporate profile metadata, tax-document references, primary contacts and client health indicators." actions={<StatusBadge tone="info">{filtered.length} records</StatusBadge>}>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Client accounts" value={String(CLIENTS.length)} detail="Example directory records" icon={<Building2 size={15} />} />
        <MetricCard label="Healthy accounts · A–B" value={String(CLIENTS.filter((client) => ['A', 'B'].includes(client.health)).length)} detail="Health score scale A–F" tone="success" />
        <MetricCard label="Needs follow-up" value={String(CLIENTS.filter((client) => ['D', 'E', 'F'].includes(client.health) || client.status === 'At risk').length)} detail="Use a direct client check-in" tone="warning" />
      </div>
      <SectionPanel title="Corporate profiles" description="Tax IDs are intentionally masked in these sample records." actions={<div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input aria-label="Search clients" placeholder="Search company, ID or PIC" value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 w-[min(240px,70vw)] rounded-control border border-line bg-panel pl-8 pr-3 text-[11px] text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" /></div>}>
        <div className="mb-3 flex flex-wrap gap-2">
          {['All', 'Active', 'Onboarding', 'At risk'].map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={'min-h-8 rounded-chip border px-3 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' + (statusFilter === status ? 'border-accent/25 bg-accent/10 text-fg' : 'border-line bg-panel text-muted hover:text-fg')}>{status}</button>)}
        </div>
        <TableScroller label="Client directory table">
          <table className={tableClassName + ' min-w-[990px]'}>
            <thead className={tableHeadClassName}><tr><th className="px-3 py-3">Client ID</th><th className="px-3 py-3">Company name</th><th className="px-3 py-3">Legal tax document / NPWP</th><th className="px-3 py-3">PIC contact details</th><th className="px-3 py-3">Health score</th><th className="px-3 py-3">Account status</th></tr></thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-bg/60">
                  <td className={tableCellClassName + ' whitespace-nowrap font-mono text-[10px] text-muted'}>{client.id}</td>
                  <td className={tableCellClassName}><p className="font-semibold text-fg">{client.company}</p><p className="mt-1 text-[10px] text-muted">Corporate account</p></td>
                  <td className={tableCellClassName}><span className="font-mono text-[11px] tabular-nums text-muted">{client.npwp}</span><div className="mt-1 text-[10px] text-muted">NPWP on file · preview</div></td>
                  <td className={tableCellClassName}><p className="font-medium text-fg">{client.pic}</p><a className="mt-1 block text-[10px] text-accent-text hover:underline" href={'mailto:' + client.email}>{client.email}</a><p className="mt-1 text-[10px] text-muted">{client.phone}</p></td>
                  <td className={tableCellClassName}><StatusBadge tone={HEALTH_TONE[client.health]}>Grade {client.health}</StatusBadge></td>
                  <td className={tableCellClassName}><StatusBadge tone={client.status === 'Active' ? 'success' : client.status === 'At risk' ? 'warning' : 'info'}>{client.status}</StatusBadge></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-[11px] text-muted">No client matches this search.</td></tr>}
            </tbody>
          </table>
        </TableScroller>
      </SectionPanel>
    </WorkspacePage>
  );
};

interface OnboardingClient {
  id: string;
  company: string;
  wonAt: string;
  contract: string;
}
const WON_CLIENTS: OnboardingClient[] = [
  { id: 'CLI-0021', company: 'Aurora Commerce', wonAt: '2026-10-10', contract: 'MSA-AUR-2026-v2' },
  { id: 'CLI-0026', company: 'Sababay Digital', wonAt: '2026-10-08', contract: 'MSA-SAB-2026-v1' },
];
const ONBOARDING_STEPS = [
  'Confirm signed MSA / SOW',
  'Create client workspace',
  'Assign delivery owner',
  'Confirm kickoff date',
  'Collect brand and product assets',
  'Approve first milestone plan',
];

export const ClientOnboardingView: React.FC<{ role: WorkspaceRole | null }> = ({ role }) => {
  const readOnly = role === 'PM';
  const [checklist, setChecklist] = useState<Record<string, boolean[]>>({
    'CLI-0021': [true, true, true, false, false, false],
    'CLI-0026': [true, true, false, false, false, false],
  });
  const [vaultClient, setVaultClient] = useState<OnboardingClient | null>(null);
  const toggleMilestone = (clientId: string, index: number) => {
    if (readOnly) return;
    setChecklist((current) => {
      const next = (current[clientId] || ONBOARDING_STEPS.map(() => false)).slice();
      next[index] = !next[index];
      return { ...current, [clientId]: next };
    });
  };

  return (
    <WorkspacePage slug="workspace-client-onboarding" title="Client Onboarding Framework" description={readOnly ? 'Read-only CRM view of closed-won milestones and contract archive references.' : 'Closed-won handoff milestones, client kickoff readiness and the MSA contract archive entry point.'} actions={readOnly ? <StatusBadge tone="neutral">PM · Read-only</StatusBadge> : undefined}>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Closed-won clients" value={String(WON_CLIENTS.length)} detail="Eligible for onboarding" />
        <MetricCard label="Milestones complete" value={String(Object.values(checklist).flat().filter(Boolean).length)} detail="Checked in this local view" tone="success" />
        <MetricCard label="Contract archive" value={String(WON_CLIENTS.length)} detail="Vault records referenced" tone="info" />
      </div>
      <SectionPanel title="Closed-won onboarding checklist" description="Each milestone grid is initiated from a Closed Won deal. Checklist changes remain local to this UI preview.">
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          {WON_CLIENTS.map((client) => {
            const done = checklist[client.id] || ONBOARDING_STEPS.map(() => false);
            const percent = Math.round(done.filter(Boolean).length / ONBOARDING_STEPS.length * 100);
            return (
              <article key={client.id} className="min-w-0 rounded-control border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0"><p className="text-[13px] font-semibold text-fg">{client.company}</p><p className="mt-1 text-[10px] text-muted">{client.id} · Closed won {dateLabel(client.wonAt)}</p></div>
                  <StatusBadge tone={percent === 100 ? 'success' : percent >= 50 ? 'info' : 'warning'}>{percent}% ready</StatusBadge>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-series-2 transition-[width]" style={{ width: percent + '%' }} /></div>
                <div className="mt-4 grid gap-2">
                  {ONBOARDING_STEPS.map((step, index) => (
                    <label key={step} className="flex min-w-0 items-start gap-2.5 rounded-control border border-line px-2.5 py-2">
                      <input type="checkbox" checked={Boolean(done[index])} disabled={readOnly} onChange={() => toggleMilestone(client.id, index)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60" />
                      <span className={'flex-1 text-[11px] leading-4 ' + (done[index] ? 'text-muted line-through' : 'text-fg')}>{step}</span>
                      {done[index] && <Check size={13} className="shrink-0 text-success" aria-hidden="true" />}
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                  <div><p className="text-[10px] text-muted">MSA archive reference</p><p className="mt-1 font-mono text-[10px] text-fg">{client.contract}</p></div>
                  <ActionButton onClick={() => setVaultClient(client)}><ShieldCheck size={13} />Open contract vault</ActionButton>
                </div>
              </article>
            );
          })}
        </div>
      </SectionPanel>
      <Modal
        open={Boolean(vaultClient)}
        onClose={() => setVaultClient(null)}
        title="MSA Contract Document Vault"
        description={vaultClient ? vaultClient.company + ' · ' + vaultClient.contract : undefined}
        size="lg"
        footer={<ActionButton variant="primary" onClick={() => setVaultClient(null)}>Close archive preview</ActionButton>}
      >
        <div className="grid gap-3">
          <div className="flex items-start gap-2.5 rounded-control border border-warning/25 bg-warning/10 p-3">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-warning" />
            <p className="text-[11px] leading-5 text-fg">Vault navigation is a UI-only placeholder. No document URL is exposed and storage authorization must be checked by the existing server before files are opened.</p>
          </div>
          {[
            { name: 'Master Services Agreement.pdf', version: 'v2 · Signed copy', date: '10 Oct 2026' },
            { name: 'Statement of Work.pdf', version: 'v1 · Approved scope', date: '10 Oct 2026' },
            { name: 'Client onboarding checklist.pdf', version: 'v1 · Internal record', date: '11 Oct 2026' },
          ].map((file) => (
            <div key={file.name} className="flex min-w-0 items-center gap-3 rounded-control border border-line p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted"><FileText size={16} /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-medium text-fg">{file.name}</p><p className="mt-1 text-[10px] text-muted">{file.version} · {file.date}</p></div>
              <StatusBadge tone="neutral">Archive entry</StatusBadge>
            </div>
          ))}
        </div>
      </Modal>
    </WorkspacePage>
  );
};
