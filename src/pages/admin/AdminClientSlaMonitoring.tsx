import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  TimerReset,
  TrendingUp,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';

type Tier = 'tier-1' | 'tier-2' | 'tier-3';
type Compliance = 'compliant' | 'warning' | 'breached';

type SlaAccount = {
  id: string;
  client: string;
  pod: string;
  tier: Tier;
  targetSla: number;
  currentUptime: number;
  mttrMinutes: number;
  responseStatus: string;
  lastIncident: string;
  incidentTitle: string;
  compliance: Compliance;
};

const seed: SlaAccount[] = [
  {
    id: 'SLA-001',
    client: 'PT Nusantara Vault Bank',
    pod: 'Pod Alpha',
    tier: 'tier-1',
    targetSla: 99.9,
    currentUptime: 99.98,
    mttrMinutes: 9.2,
    responseStatus: 'Within threshold',
    lastIncident: 'Nov 12, 14:22',
    incidentTitle: 'High DB Read Latency (Auto-mitigated in 6m)',
    compliance: 'compliant'
  },
  {
    id: 'SLA-002',
    client: 'Kinetix Logistics Cloud',
    pod: 'Pod Beta',
    tier: 'tier-1',
    targetSla: 99.5,
    currentUptime: 99.85,
    mttrMinutes: 12,
    responseStatus: 'Within threshold',
    lastIncident: 'Nov 08, 03:15',
    incidentTitle: 'Edge DNS Propagation Lag',
    compliance: 'compliant'
  },
  {
    id: 'SLA-003',
    client: 'PayPintar Gateways',
    pod: 'Pod Alpha',
    tier: 'tier-2',
    targetSla: 99.5,
    currentUptime: 99.12,
    mttrMinutes: 24,
    responseStatus: 'Approaching SLA Cap',
    lastIncident: 'Yesterday, 19:40',
    incidentTitle: 'DB Primary Failover Event',
    compliance: 'warning'
  },
  {
    id: 'SLA-004',
    client: 'SatuBio Diagnostics',
    pod: 'Pod DevOps Core',
    tier: 'tier-1',
    targetSla: 99.9,
    currentUptime: 99.95,
    mttrMinutes: 8,
    responseStatus: 'Optimal',
    lastIncident: 'Oct 29, 11:05',
    incidentTitle: 'Minor TLS Renewal Hiccup',
    compliance: 'compliant'
  },
  {
    id: 'SLA-005',
    client: 'Voltran Core Infra',
    pod: 'Pod DevOps Core',
    tier: 'tier-1',
    targetSla: 99.95,
    currentUptime: 99.99,
    mttrMinutes: 5,
    responseStatus: 'Benchmark',
    lastIncident: 'None',
    incidentTitle: 'Full clean availability',
    compliance: 'compliant'
  },
  {
    id: 'SLA-006',
    client: 'AeroMedika Telemetry',
    pod: 'Pod Beta',
    tier: 'tier-2',
    targetSla: 99.5,
    currentUptime: 99.78,
    mttrMinutes: 16,
    responseStatus: 'Within threshold',
    lastIncident: 'Nov 02, 22:11',
    incidentTitle: 'Ingress Controller Restart',
    compliance: 'compliant'
  }
];

const tierLabel: Record<Tier, string> = {
  'tier-1': 'Tier 1 Strategic',
  'tier-2': 'Tier 2 Production',
  'tier-3': 'Tier 3 Standard'
};

const complianceMeta: Record<Compliance, { label: string; dot: string; className: string }> = {
  compliant: {
    label: 'Compliant',
    dot: 'bg-success',
    className: 'border-success/20 bg-success/10 text-success'
  },
  warning: {
    label: 'Warning',
    dot: 'bg-warning',
    className: 'border-warning/20 bg-warning/10 text-warning'
  },
  breached: {
    label: 'Breached',
    dot: 'bg-danger',
    className: 'border-danger/20 bg-danger/10 text-danger'
  }
};

const formatPercent = (value: number) => value.toFixed(2) + '%';

export const AdminClientSlaMonitoring: React.FC = () => {
  const [records] = useState(seed);
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<'all' | Tier>('all');
  const [pod, setPod] = useState<'all' | string>('all');
  const [compliance, setCompliance] = useState<'all' | Compliance>('all');
  const [message, setMessage] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<SlaAccount | null>(null);
  const [selectedTelemetry, setSelectedTelemetry] = useState<SlaAccount | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((item) => {
      const searchable = [
        item.client,
        item.id,
        item.pod,
        tierLabel[item.tier],
        item.incidentTitle,
        item.lastIncident
      ]
        .join(' ')
        .toLowerCase();

      return (
        (!normalized || searchable.includes(normalized)) &&
        (tier === 'all' || item.tier === tier) &&
        (pod === 'all' || item.pod === pod) &&
        (compliance === 'all' || item.compliance === compliance)
      );
    });
  }, [records, query, tier, pod, compliance]);

  const averageSla =
    records.reduce((sum, item) => sum + item.currentUptime, 0) / Math.max(1, records.length);
  const averageMttr =
    records.reduce((sum, item) => sum + item.mttrMinutes, 0) / Math.max(1, records.length);
  const warnings = records.filter((item) => item.compliance === 'warning').length;
  const breaches = records.filter((item) => item.compliance === 'breached').length;
  const complianceCount = records.filter((item) => item.compliance === 'compliant').length;

  const reset = () => {
    setQuery('');
    setTier('all');
    setPod('all');
    setCompliance('all');
  };

  const exportAuditLog = () => {
    const rows = [
      [
        'SLA ID',
        'Client',
        'Pod',
        'Tier',
        'Target SLA',
        'Current Uptime 30D',
        'MTTR Minutes',
        'Response Status',
        'Last Incident',
        'Incident',
        'Compliance'
      ],
      ...filtered.map((item) => [
        item.id,
        item.client,
        item.pod,
        tierLabel[item.tier],
        formatPercent(item.targetSla),
        formatPercent(item.currentUptime),
        item.mttrMinutes,
        item.responseStatus,
        item.lastIncident,
        item.incidentTitle,
        complianceMeta[item.compliance].label
      ])
    ];

    const csv = rows
      .map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kapitech-sla-audit-log.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full pb-8">
      <header className="mb-5 flex flex-col gap-4 border-b border-line pb-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-medium leading-8 tracking-[-0.02em] text-fg">
              SLA Monitoring &amp; Service Health
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-badge border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Network &amp; Services Operational
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-[13px] leading-5 text-muted">
            Real-time uptime tracking, incident response compliance, and guaranteed SLA thresholds
            across all managed client infrastructure.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start md:self-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={exportAuditLog}
            icon={<Download size={14} />}
          >
            Export SLA Audit Log
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setMessage('SLA rule configuration remains FE-only until the backend rules model is enabled.')}
            icon={<Settings2 size={14} />}
          >
            Configure SLA Rules
          </Button>
        </div>
      </header>

      {message && (
        <div className="mb-4 flex items-center justify-between rounded-card border border-success/20 bg-success/10 px-3 py-2.5 text-xs text-success">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="SLA metrics">
        <div className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
              Average Platform SLA
            </span>
            <ShieldCheck size={18} className="text-success" />
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <span className="text-2xl font-medium leading-8 tabular-nums text-fg">
              {formatPercent(averageSla)}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] text-success">
              <TrendingUp size={13} /> +0.04%
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5 text-[11px] text-muted">
            <span>Target: 99.50% minimum</span>
            <span className="tabular-nums text-fg">30D Window</span>
          </div>
        </div>

        <div className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
              Mean Time to Respond (MTTR)
            </span>
            <Clock3 size={18} className="text-info" />
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <span className="text-2xl font-medium leading-8 tabular-nums text-fg">
              {averageMttr.toFixed(1)} mins
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] text-success">
              <TimerReset size={13} /> -3.2m
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5 text-[11px] text-muted">
            <span>SLA limit: 30 mins</span>
            <span className="font-medium text-success">Within Threshold</span>
          </div>
        </div>

        <div className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
              Active Incident Alerts
            </span>
            <Bell size={18} className="text-warning" />
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <span className="text-2xl font-medium leading-8 tabular-nums text-fg">
              {breaches} Critical <span className="text-base font-normal text-muted">/</span>{' '}
              {warnings} Minor
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5 text-[11px] text-muted">
            <span>Resolved: 18 this sprint</span>
            <span className="text-success">Zero breach risk</span>
          </div>
        </div>
      </section>

      <section
        className="mb-4 rounded-card border border-line bg-panel p-3"
        aria-label="SLA filters"
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-[420px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <label htmlFor="sla-search" className="sr-only">
              Search SLA targets
            </label>
            <input
              id="sla-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by client, tier, or service..."
              className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect
              value={tier}
              onChange={(value) => setTier(value as 'all' | Tier)}
              options={[
                { value: 'all', label: 'All Severity Levels' },
                { value: 'tier-1', label: 'Tier 1 Strategic' },
                { value: 'tier-2', label: 'Tier 2 Production' },
                { value: 'tier-3', label: 'Tier 3 Standard' }
              ]}
              aria-label="SLA severity"
              className="min-w-[165px]"
              triggerClassName="w-full"
            />
            <CustomSelect
              value={pod}
              onChange={(value) => setPod(value)}
              options={[
                { value: 'all', label: 'Assigned Pods: All' },
                { value: 'Pod Alpha', label: 'Pod Alpha' },
                { value: 'Pod Beta', label: 'Pod Beta' },
                { value: 'Pod DevOps Core', label: 'Pod DevOps Core' }
              ]}
              aria-label="Assigned pods"
              className="min-w-[170px]"
              triggerClassName="w-full"
            />
            <CustomSelect
              value={compliance}
              onChange={(value) => setCompliance(value as 'all' | Compliance)}
              options={[
                { value: 'all', label: 'Compliance: All Statuses' },
                { value: 'compliant', label: 'Compliant Only' },
                { value: 'warning', label: 'Warning Only' },
                { value: 'breached', label: 'Breached' }
              ]}
              aria-label="Compliance status"
              className="min-w-[175px]"
              triggerClassName="w-full"
            />
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted hover:bg-panel hover:text-fg"
              title="Reset filters"
              aria-label="Reset filters"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-card border border-line bg-panel" aria-label="Client SLA target matrix">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-fg">Client SLA Target Matrix</h2>
            <span className="rounded-badge bg-line/60 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted">
              {filtered.length} Monitored Accounts
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              Compliant (&gt;99.5%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-warning" />
              Warning (&lt;99.5%)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1200px] border-collapse text-left">
            <thead className="bg-bg">
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
                <th className="px-4 py-2.5 font-medium">CLIENT ACCOUNT &amp; POD</th>
                <th className="px-4 py-2.5 font-medium">TARGET SLA</th>
                <th className="px-4 py-2.5 font-medium">CURRENT UPTIME (30D)</th>
                <th className="px-4 py-2.5 font-medium">MTTR AVERAGE</th>
                <th className="px-4 py-2.5 font-medium">LAST INCIDENT</th>
                <th className="px-4 py-2.5 text-center font-medium">SLA STATUS</th>
                <th className="px-4 py-2.5 text-right font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const meta = complianceMeta[item.compliance];
                const warningRow = item.compliance === 'warning';

                return (
                  <tr
                    key={item.id}
                    className={
                      'border-b border-line last:border-0 transition-colors hover:bg-bg/70 ' +
                      (warningRow ? 'bg-warning/5' : '')
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-semibold text-fg">{item.client}</span>
                        <span className="mt-0.5 text-[10px] text-muted">
                          {item.pod} • {tierLabel[item.tier]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium tabular-nums text-fg">
                      {formatPercent(item.targetSla)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={'h-2 w-2 rounded-full ' + (warningRow ? 'bg-warning' : 'bg-success')} />
                        <span
                          className={
                            'text-xs font-semibold tabular-nums ' +
                            (warningRow ? 'text-warning' : 'text-fg')
                          }
                        >
                          {formatPercent(item.currentUptime)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tabular-nums text-fg">
                          {item.mttrMinutes} mins
                        </span>
                        <span
                          className={
                            'text-[10px] ' +
                            (warningRow ? 'text-warning' : 'text-success')
                          }
                        >
                          {item.responseStatus}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[320px] px-4 py-3">
                      <div
                        className="truncate text-[11px] text-muted"
                        title={item.lastIncident + ' • ' + item.incidentTitle}
                      >
                        <span className="font-medium text-fg">{item.lastIncident}</span> •{' '}
                        {item.incidentTitle}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={
                          'inline-flex items-center gap-1.5 rounded-badge border px-2 py-0.5 text-[10px] font-medium ' +
                          meta.className
                        }
                      >
                        <span className={'h-1.5 w-1.5 rounded-full ' + meta.dot} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedIncident(item)}
                          className="rounded-control border border-line bg-bg px-2.5 py-1 text-[10px] font-medium text-fg hover:bg-panel"
                        >
                          Incident Log
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTelemetry(item)}
                          className="rounded-control border border-line bg-bg px-2.5 py-1 text-[10px] font-medium text-muted hover:bg-panel hover:text-fg"
                        >
                          View Telemetry
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <Search size={18} className="mx-auto text-muted" />
                    <p className="mt-3 text-sm font-medium text-fg">No matching SLA accounts.</p>
                    <p className="mt-1 text-xs text-muted">
                      Try another search or reset the active filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-line bg-bg px-4 py-2.5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Showing <span className="font-medium tabular-nums text-fg">{filtered.length}</span> of{' '}
              <span className="font-medium tabular-nums text-fg">{records.length}</span> active client
              contracts
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-line sm:block" />
            <span>
              Next synthetic telemetry sweep in <span className="font-medium tabular-nums text-fg">42s</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              className="rounded-control border border-line bg-panel px-2.5 py-1.5 text-[11px] text-muted opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-medium tabular-nums text-fg">1</span>
            <button
              type="button"
              disabled
              className="rounded-control border border-line bg-panel px-2.5 py-1.5 text-[11px] text-muted opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="mt-3 grid grid-cols-1 gap-3 text-[11px] text-muted md:grid-cols-4" aria-label="SLA summary">
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2.5">
          <CheckCircle2 size={14} className="text-success" />
          <span>
            Compliant Accounts: <strong className="text-fg">{complianceCount}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2.5">
          <AlertTriangle size={14} className="text-warning" />
          <span>
            Warning Accounts: <strong className="text-fg">{warnings}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2.5">
          <FileText size={14} className="text-info" />
          <span>
            Active Matrix Rows: <strong className="text-fg">{filtered.length}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2.5">
          <TimerReset size={14} className="text-accent-text" />
          <span>
            Last Audit Run: <strong className="text-fg">Local preview</strong>
          </span>
        </div>
      </section>

      <Modal
        open={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        size="md"
        title="Incident Log"
        description={selectedIncident ? selectedIncident.client + ' · ' + selectedIncident.id : undefined}
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setSelectedIncident(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedIncident && (
          <div className="space-y-4">
            <div className="rounded-card border border-line bg-bg p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-fg">
                <AlertTriangle size={14} className={selectedIncident.compliance === 'warning' ? 'text-warning' : 'text-success'} />
                {selectedIncident.lastIncident}
              </div>
              <p className="mt-2 text-sm text-fg">{selectedIncident.incidentTitle}</p>
              <p className="mt-1 text-xs text-muted">
                Status: {complianceMeta[selectedIncident.compliance].label} · MTTR {selectedIncident.mttrMinutes} mins
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-card border border-line bg-panel p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted">Target SLA</span>
                <div className="mt-1 text-sm font-semibold tabular-nums text-fg">
                  {formatPercent(selectedIncident.targetSla)}
                </div>
              </div>
              <div className="rounded-card border border-line bg-panel p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted">Current Uptime</span>
                <div className="mt-1 text-sm font-semibold tabular-nums text-fg">
                  {formatPercent(selectedIncident.currentUptime)}
                </div>
              </div>
              <div className="rounded-card border border-line bg-panel p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted">Assigned Pod</span>
                <div className="mt-1 text-sm font-semibold text-fg">{selectedIncident.pod}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!selectedTelemetry}
        onClose={() => setSelectedTelemetry(null)}
        size="lg"
        title="Service Telemetry"
        description={
          selectedTelemetry
            ? selectedTelemetry.client + ' · 30-day SLA telemetry snapshot'
            : undefined
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSelectedTelemetry(null)}>
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setMessage('Telemetry export is FE-only in this preview.')}
              icon={<Download size={14} />}
            >
              Export Snapshot
            </Button>
          </div>
        }
      >
        {selectedTelemetry && (
          <div className="space-y-4">
            <div className="rounded-card border border-line bg-bg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-fg">{selectedTelemetry.client}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {selectedTelemetry.pod} · {tierLabel[selectedTelemetry.tier]}
                  </p>
                </div>
                <span
                  className={
                    'inline-flex items-center gap-1.5 rounded-badge border px-2 py-0.5 text-[10px] font-medium ' +
                    complianceMeta[selectedTelemetry.compliance].className
                  }
                >
                  <span
                    className={
                      'h-1.5 w-1.5 rounded-full ' +
                      complianceMeta[selectedTelemetry.compliance].dot
                    }
                  />
                  {complianceMeta[selectedTelemetry.compliance].label}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-card border border-line bg-panel p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted">30D Uptime</span>
                <div className="mt-1 text-lg font-medium tabular-nums text-fg">
                  {formatPercent(selectedTelemetry.currentUptime)}
                </div>
              </div>
              <div className="rounded-card border border-line bg-panel p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted">Target</span>
                <div className="mt-1 text-lg font-medium tabular-nums text-fg">
                  {formatPercent(selectedTelemetry.targetSla)}
                </div>
              </div>
              <div className="rounded-card border border-line bg-panel p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted">MTTR</span>
                <div className="mt-1 text-lg font-medium tabular-nums text-fg">
                  {selectedTelemetry.mttrMinutes} min
                </div>
              </div>
            </div>

            <div className="rounded-card border border-line bg-panel p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-fg">30-day availability</span>
                <span className="tabular-nums text-muted">
                  {formatPercent(selectedTelemetry.currentUptime)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line/70">
                <div
                  className="h-2 rounded-full bg-success"
                  style={{
                    width: Math.max(0, Math.min(100, selectedTelemetry.currentUptime)) + '%'
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                Synthetic telemetry preview only. Live endpoint metrics remain backend-dependent.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminClientSlaMonitoring;
