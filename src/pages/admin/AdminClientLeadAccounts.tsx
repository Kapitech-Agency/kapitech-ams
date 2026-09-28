import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  MailCheck,
  Plus,
  Search,
  Target,
  TrendingUp,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

type Stage =
  | 'discovery'
  | 'proposal'
  | 'contract'
  | 'ready-to-sign';

type Lead = {
  id: string;
  initials: string;
  company: string;
  contact: string;
  owner: string;
  ownerRole: string;
  ownerInitials: string;
  brief: string;
  location: string;
  monthlyValue: number;
  annualValue: number;
  stage: Stage;
  probability: number;
  nextAction: string;
  dueLabel: string;
  urgent?: boolean;
};

const seed: Lead[] = [
  {
    id: 'LEAD-001',
    initials: 'BA',
    company: 'Bank Artha Mandiri Digital',
    contact: 'Rizky Pranata',
    owner: 'Alex Vance',
    ownerRole: 'Lead Director',
    ownerInitials: 'AV',
    brief: 'Core Banking API Integration',
    location: 'Jakarta',
    monthlyValue: 320000000,
    annualValue: 3840000000,
    stage: 'proposal',
    probability: 75,
    nextAction: 'Technical demo review',
    dueLabel: 'Dec 04 • In 2 days'
  },
  {
    id: 'LEAD-002',
    initials: 'MU',
    company: 'Medika Utama Telehealth',
    contact: 'Nadia Putri',
    owner: 'Alex Vance',
    ownerRole: 'Lead Director',
    ownerInitials: 'AV',
    brief: 'HIPAA-compliant Cloud Migration',
    location: 'Bandung',
    monthlyValue: 180000000,
    annualValue: 2160000000,
    stage: 'discovery',
    probability: 50,
    nextAction: 'Architecture audit presentation',
    dueLabel: 'Dec 08 • In 6 days'
  },
  {
    id: 'LEAD-003',
    initials: 'LK',
    company: 'Logistik Kilat Nusantara',
    contact: 'Fajar Hidayat',
    owner: 'Alex Vance',
    ownerRole: 'Lead Director',
    ownerInitials: 'AV',
    brief: 'Fleet Telematics IoT Backend',
    location: 'Surabaya',
    monthlyValue: 240000000,
    annualValue: 2880000000,
    stage: 'contract',
    probability: 90,
    nextAction: 'Final MSA redline sign-off',
    dueLabel: 'Dec 05 • Urgent',
    urgent: true
  },
  {
    id: 'LEAD-004',
    initials: 'AP',
    company: 'AstraPay E-Wallet',
    contact: 'Dimas Kurniawan',
    owner: 'Alex Vance',
    ownerRole: 'Lead Director',
    ownerInitials: 'AV',
    brief: 'Microservices Re-architecture',
    location: 'Jakarta',
    monthlyValue: 450000000,
    annualValue: 5400000000,
    stage: 'proposal',
    probability: 65,
    nextAction: 'Send enterprise revised quotation',
    dueLabel: 'Dec 06 • In 4 days'
  },
  {
    id: 'LEAD-005',
    initials: 'CR',
    company: 'Cipta Retail Omnichannel',
    contact: 'Sarah Melati',
    owner: 'Alex Vance',
    ownerRole: 'Lead Director',
    ownerInitials: 'AV',
    brief: 'Headless E-commerce & Inventory',
    location: 'Tangerang',
    monthlyValue: 160000000,
    annualValue: 1920000000,
    stage: 'proposal',
    probability: 55,
    nextAction: 'Scoping validation with CTO',
    dueLabel: 'Dec 09 • In 7 days'
  },
  {
    id: 'LEAD-006',
    initials: 'DC',
    company: 'DanaCepat P2P Lending',
    contact: 'Arief Nugroho',
    owner: 'Alex Vance',
    ownerRole: 'Lead Director',
    ownerInitials: 'AV',
    brief: 'Security Audit & Vault Compliance',
    location: 'Jakarta',
    monthlyValue: 130000000,
    annualValue: 1560000000,
    stage: 'ready-to-sign',
    probability: 95,
    nextAction: 'Digital contract signing via Privy',
    dueLabel: 'Today • Ready'
  },
  {
    id: 'LEAD-007',
    initials: 'NS',
    company: 'NusaShip Commerce',
    contact: 'Rafi Aditya',
    owner: 'Maya Chen',
    ownerRole: 'Growth Lead',
    ownerInitials: 'MC',
    brief: 'Cross-border Order Routing',
    location: 'Jakarta',
    monthlyValue: 155000000,
    annualValue: 1860000000,
    stage: 'discovery',
    probability: 45,
    nextAction: 'Stakeholder discovery session',
    dueLabel: 'Dec 10 • In 8 days'
  },
  {
    id: 'LEAD-008',
    initials: 'TM',
    company: 'TransMed Supply',
    contact: 'Alya Prameswari',
    owner: 'Maya Chen',
    ownerRole: 'Growth Lead',
    ownerInitials: 'MC',
    brief: 'Healthcare Inventory Platform',
    location: 'Surabaya',
    monthlyValue: 205000000,
    annualValue: 2460000000,
    stage: 'discovery',
    probability: 55,
    nextAction: 'Technical discovery workshop',
    dueLabel: 'Dec 11 • In 9 days'
  },
  {
    id: 'LEAD-009',
    initials: 'FN',
    company: 'Finova NeoBank',
    contact: 'Yusuf Ramadhan',
    owner: 'Maya Chen',
    ownerRole: 'Growth Lead',
    ownerInitials: 'MC',
    brief: 'Fraud Detection Service',
    location: 'Jakarta',
    monthlyValue: 360000000,
    annualValue: 4320000000,
    stage: 'contract',
    probability: 82,
    nextAction: 'Security schedule review',
    dueLabel: 'Dec 07 • In 5 days'
  },
  {
    id: 'LEAD-010',
    initials: 'GT',
    company: 'GarudaTrip Platform',
    contact: 'Kevin Hartono',
    owner: 'Nadia Karim',
    ownerRole: 'Account Director',
    ownerInitials: 'NK',
    brief: 'Travel Booking Infrastructure',
    location: 'Bali',
    monthlyValue: 145000000,
    annualValue: 1740000000,
    stage: 'contract',
    probability: 88,
    nextAction: 'Procurement confirmation',
    dueLabel: 'Dec 05 • In 3 days'
  },
  {
    id: 'LEAD-011',
    initials: 'OL',
    company: 'OtoLink Mobility',
    contact: 'Tania Wibowo',
    owner: 'Nadia Karim',
    ownerRole: 'Account Director',
    ownerInitials: 'NK',
    brief: 'Connected Fleet Management',
    location: 'Bandung',
    monthlyValue: 190000000,
    annualValue: 2280000000,
    stage: 'proposal',
    probability: 62,
    nextAction: 'Commercial review with CFO',
    dueLabel: 'Dec 12 • In 10 days'
  },
  {
    id: 'LEAD-012',
    initials: 'MS',
    company: 'Merah Selatan Logistics',
    contact: 'Reno Saputra',
    owner: 'Nadia Karim',
    ownerRole: 'Account Director',
    ownerInitials: 'NK',
    brief: 'Warehouse Automation Layer',
    location: 'Semarang',
    monthlyValue: 125000000,
    annualValue: 1500000000,
    stage: 'proposal',
    probability: 48,
    nextAction: 'Solution architecture review',
    dueLabel: 'Dec 13 • In 11 days'
  },
  {
    id: 'LEAD-013',
    initials: 'VP',
    company: 'VitaPrima Labs',
    contact: 'Niken Sari',
    owner: 'Nadia Karim',
    ownerRole: 'Account Director',
    ownerInitials: 'NK',
    brief: 'Clinical Data Pipeline',
    location: 'Jakarta',
    monthlyValue: 165000000,
    annualValue: 1980000000,
    stage: 'proposal',
    probability: 58,
    nextAction: 'POC success criteria sign-off',
    dueLabel: 'Dec 09 • In 7 days'
  },
  {
    id: 'LEAD-014',
    initials: 'EP',
    company: 'EnergiPro Systems',
    contact: 'Rangga Wijaya',
    owner: 'Alex Vance',
    ownerRole: 'Lead Director',
    ownerInitials: 'AV',
    brief: 'Industrial IoT Operations',
    location: 'Surabaya',
    monthlyValue: 260000000,
    annualValue: 3120000000,
    stage: 'ready-to-sign',
    probability: 92,
    nextAction: 'Final signature package',
    dueLabel: 'Dec 04 • Ready'
  }
];

const stageMeta: Record<Stage, { label: string; dot: string }> = {
  discovery: { label: 'Discovery & Audit', dot: 'bg-muted' },
  proposal: { label: 'Proposal & Scoping', dot: 'bg-info' },
  contract: { label: 'Contract & Legal Review', dot: 'bg-warning' },
  'ready-to-sign': { label: 'Ready to Sign', dot: 'bg-success' }
};

const money = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);

const compactMoney = (value: number) => {
  if (value >= 1000000000) return 'Rp ' + (value / 1000000000).toFixed(2) + 'B';
  return 'Rp ' + Math.round(value / 1000000) + 'M';
};

const stageOrder: Array<'all' | Stage> = [
  'all',
  'discovery',
  'proposal',
  'contract',
  'ready-to-sign'
];

export const AdminClientLeadAccounts: React.FC = () => {
  const [records, setRecords] = useState(seed);
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<'all' | Stage>('all');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newContact, setNewContact] = useState('');
  const pageSize = 6;

  const stageCounts = useMemo(
    () =>
      ({
        all: records.length,
        discovery: records.filter((item) => item.stage === 'discovery').length,
        proposal: records.filter((item) => item.stage === 'proposal').length,
        contract: records.filter((item) => item.stage === 'contract').length,
        'ready-to-sign': records.filter((item) => item.stage === 'ready-to-sign').length
      }) as Record<'all' | Stage, number>,
    [records]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((item) => {
      const searchable = [
        item.company,
        item.contact,
        item.owner,
        item.brief,
        item.location,
        item.id
      ]
        .join(' ')
        .toLowerCase();

      return (
        (!normalized || searchable.includes(normalized)) &&
        (stage === 'all' || item.stage === stage)
      );
    });
  }, [records, query, stage]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const pipelineValue = 3850000000;
  const weightedProbability = 68.5;
  const proposalCount = records.filter((item) => item.stage === 'proposal').length;

  const setFilter = (value: 'all' | Stage) => {
    setStage(value);
    setPage(1);
  };

  const reset = () => {
    setQuery('');
    setStage('all');
    setPage(1);
  };

  const exportPipeline = () => {
    const rows = [
      [
        'Lead ID',
        'Company',
        'Contact',
        'Brief',
        'Location',
        'Monthly Value',
        'Annual Value',
        'Stage',
        'Win Probability',
        'Owner',
        'Next Action',
        'Due'
      ],
      ...filtered.map((item) => [
        item.id,
        item.company,
        item.contact,
        item.brief,
        item.location,
        item.monthlyValue,
        item.annualValue,
        stageMeta[item.stage].label,
        item.probability + '%',
        item.owner,
        item.nextAction,
        item.dueLabel
      ])
    ];

    const csv = rows
      .map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kapitech-lead-pipeline.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const addLead = () => {
    if (!newCompany.trim()) {
      setMessage('Company name is required.');
      return;
    }

    const lead: Lead = {
      id: 'LEAD-' + String(records.length + 1).padStart(3, '0'),
      initials: newCompany.trim().slice(0, 2).toUpperCase(),
      company: newCompany.trim(),
      contact: newContact.trim() || 'New prospect',
      owner: 'Alex Vance',
      ownerRole: 'Lead Director',
      ownerInitials: 'AV',
      brief: 'New pipeline opportunity',
      location: 'Indonesia',
      monthlyValue: 0,
      annualValue: 0,
      stage: 'discovery',
      probability: 25,
      nextAction: 'Qualify opportunity',
      dueLabel: 'To be scheduled'
    };

    setRecords((current) => [lead, ...current]);
    setIsAdding(false);
    setNewCompany('');
    setNewContact('');
    setMessage('Lead account added to the local FE pipeline.');
  };

  return (
    <div className="min-h-full pb-8">
      <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-medium leading-8 tracking-[-0.02em] text-fg">
              Lead Accounts &amp; Pipeline
            </h1>
            <span className="inline-flex items-center rounded-badge border border-accent/20 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent-text">
              {records.length} Prospective Accounts
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-[13px] leading-5 text-muted">
            Inbound enterprise opportunities, technical qualification, scoping stages, and projected retainer conversions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button type="button" variant="secondary" onClick={exportPipeline} icon={<ArrowDown size={14} />}>
            Export Pipeline
          </Button>
          <Button type="button" variant="primary" onClick={() => setIsAdding(true)} icon={<Plus size={14} />}>
            Add Lead Account
          </Button>
        </div>
      </header>

      {message && (
        <div className="mb-4 flex items-center justify-between rounded-card border border-line bg-panel px-3 py-2.5 text-xs text-fg">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Pipeline metrics">
        <div className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium">TOTAL PIPELINE VALUE</span>
            <CircleDollarSign size={18} />
          </div>
          <div className="mt-3 text-2xl font-medium leading-8 tabular-nums text-fg">
            {compactMoney(pipelineValue)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
            <span className="inline-flex items-center gap-0.5 font-medium text-fg">
              <ArrowUp size={13} /> +14.2%
            </span>
            <span>vs previous quarter (Estimated ACV)</span>
          </div>
        </div>

        <div className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium">WEIGHTED WIN PROBABILITY</span>
            <Target size={18} />
          </div>
          <div className="mt-3 text-2xl font-medium leading-8 tabular-nums text-fg">
            {weightedProbability.toFixed(1)}%
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
            <span className="inline-flex items-center gap-0.5 font-medium text-fg">
              <TrendingUp size={13} /> +5.4%
            </span>
            <span>Avg qualification across {records.length} deals</span>
          </div>
        </div>

        <div className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium">PROPOSALS OUT FOR REVIEW</span>
            <MailCheck size={18} />
          </div>
          <div className="mt-3 text-2xl font-medium leading-8 tabular-nums text-fg">
            {proposalCount} Enterprise Quotes
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Targeting close in Q4 fiscal cycle</span>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-card border border-line bg-panel p-3" aria-label="Pipeline filters">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-[420px]">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <label htmlFor="lead-search" className="sr-only">
              Search lead pipeline
            </label>
            <input
              id="lead-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search company, contact person, or deal owner..."
              className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 xl:pb-0">
            {stageOrder.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={
                  'inline-flex h-8 shrink-0 items-center rounded-control border px-3 text-[11px] font-medium transition-colors ' +
                  (stage === value
                    ? 'border-line bg-line text-fg'
                    : 'border-transparent bg-transparent text-muted hover:bg-bg hover:text-fg')
                }
              >
                {value === 'all' ? 'All Leads' : stageMeta[value].label} ({stageCounts[value]})
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-card border border-line bg-panel" aria-label="Lead pipeline table">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1240px] border-collapse text-left">
            <thead className="bg-bg">
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
                <th className="px-5 py-2.5 font-medium">PROSPECT / COMPANY</th>
                <th className="px-4 py-2.5 font-medium">ESTIMATED VALUE (ARR / RETAINER)</th>
                <th className="px-4 py-2.5 font-medium">STAGE</th>
                <th className="px-4 py-2.5 font-medium">LEAD OWNER</th>
                <th className="px-4 py-2.5 font-medium">WIN PROBABILITY</th>
                <th className="px-4 py-2.5 font-medium">NEXT ACTION &amp; DUE DATE</th>
                <th className="px-5 py-2.5 text-right font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0 transition-colors hover:bg-bg/70">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-[11px] font-semibold text-fg">
                        {item.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold leading-snug text-fg">{item.company}</div>
                        <div className="mt-0.5 text-[10px] text-muted">
                          {item.brief} • {item.location}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 tabular-nums">
                    <div className="text-xs font-medium text-fg">{money(item.monthlyValue)}<span className="text-muted">/mo</span></div>
                    <div className="mt-0.5 text-[10px] text-muted">{compactMoney(item.annualValue)} Annual</div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] font-medium text-muted">
                      <span className={'h-1.5 w-1.5 rounded-full ' + stageMeta[item.stage].dot} />
                      {stageMeta[item.stage].label}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-[9px] font-semibold text-fg">
                        {item.ownerInitials}
                      </div>
                      <span className="text-xs text-fg">{item.owner}</span>
                      <span className="text-[10px] text-muted">({item.ownerRole})</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 tabular-nums">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line/70">
                        <div
                          className="h-1.5 rounded-full bg-accent"
                          style={{ width: Math.min(100, item.probability) + '%' }}
                        />
                      </div>
                      <span className="text-xs font-medium text-fg">{item.probability}%</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-fg">{item.nextAction}</div>
                    <div className={'mt-0.5 text-[10px] ' + (item.urgent ? 'font-medium text-accent-text' : 'text-muted')}>
                      {item.dueLabel}
                    </div>
                  </td>

                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLead(item)}
                        className="rounded-control border border-line bg-bg px-2.5 py-1 text-[10px] font-medium text-fg hover:bg-panel"
                      >
                        View Deal
                      </button>
                      <button
                        type="button"
                        onClick={() => setMessage('Proposal workspace is FE-only until proposal data is connected to the backend.')}
                        className={
                          'rounded-control border px-2.5 py-1 text-[10px] font-medium transition-colors ' +
                          (item.stage === 'ready-to-sign'
                            ? 'border-accent bg-accent/10 text-accent-text hover:bg-accent hover:text-white'
                            : 'border-line bg-bg text-fg hover:bg-panel')
                        }
                      >
                        Create Proposal
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!visible.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <Search size={18} className="mx-auto text-muted" />
                    <p className="mt-3 text-sm font-medium text-fg">No matching pipeline accounts.</p>
                    <p className="mt-1 text-xs text-muted">Try another search or reset the active stage filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-line bg-bg px-4 py-2.5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing{' '}
            <span className="font-medium tabular-nums text-fg">
              {filtered.length ? (page - 1) * pageSize + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-medium tabular-nums text-fg">
              {Math.min(page * pageSize, filtered.length)}
            </span>{' '}
            of <span className="font-medium tabular-nums text-fg">{filtered.length}</span> pipeline lead accounts
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pageCount }).map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={
                    'inline-flex h-7 min-w-7 items-center justify-center rounded-control border px-1.5 text-[11px] font-medium ' +
                    (page === pageNumber
                      ? 'border-line bg-line text-fg'
                      : 'border-transparent text-muted hover:bg-panel hover:text-fg')
                  }
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              type="button"
              disabled={page === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-control border border-line bg-panel text-fg hover:bg-bg disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      <section className="mt-3 grid grid-cols-1 gap-3 text-[11px] text-muted md:grid-cols-4" aria-label="Pipeline summary">
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2.5">
          <CircleDollarSign size={14} className="text-accent-text" />
          <span>Open ACV: <strong className="text-fg">{compactMoney(pipelineValue)}</strong></span>
        </div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2.5">
          <Target size={14} className="text-info" />
          <span>Weighted Probability: <strong className="text-fg">{weightedProbability.toFixed(1)}%</strong></span>
        </div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2.5">
          <Clock3 size={14} className="text-warning" />
          <span>Contract Review: <strong className="text-fg">{stageCounts.contract}</strong></span>
        </div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2.5">
          <CheckCircle2 size={14} className="text-success" />
          <span>Ready to Sign: <strong className="text-fg">{stageCounts['ready-to-sign']}</strong></span>
        </div>
      </section>

      <Modal
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        size="md"
        title="Lead account"
        description={selectedLead ? selectedLead.company + ' · ' + selectedLead.id : undefined}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSelectedLead(null)}>
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setMessage('Proposal workspace is FE-only in this preview.');
                setSelectedLead(null);
              }}
              icon={<FileText size={14} />}
            >
              Create Proposal
            </Button>
          </div>
        }
      >
        {selectedLead && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-card border border-line bg-bg p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-control border border-line bg-panel text-xs font-semibold text-fg">
                {selectedLead.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{selectedLead.company}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {selectedLead.contact} · {selectedLead.location}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-card border border-line bg-panel p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted">Monthly Value</span>
                <div className="mt-1 text-sm font-semibold tabular-nums text-fg">{money(selectedLead.monthlyValue)}</div>
              </div>
              <div className="rounded-card border border-line bg-panel p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted">Win Probability</span>
                <div className="mt-1 text-sm font-semibold tabular-nums text-fg">{selectedLead.probability}%</div>
              </div>
              <div className="rounded-card border border-line bg-panel p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted">Stage</span>
                <div className="mt-1 text-sm font-semibold text-fg">{stageMeta[selectedLead.stage].label}</div>
              </div>
            </div>

            <div className="rounded-card border border-line bg-panel p-3">
              <span className="text-[10px] uppercase tracking-wider text-muted">Next action</span>
              <p className="mt-1 text-sm font-medium text-fg">{selectedLead.nextAction}</p>
              <p className="mt-1 text-xs text-muted">{selectedLead.dueLabel}</p>
            </div>

            <div className="text-xs text-muted">
              Owner: <span className="font-medium text-fg">{selectedLead.owner}</span> · {selectedLead.ownerRole}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={isAdding}
        onClose={() => setIsAdding(false)}
        size="sm"
        title="Add lead account"
        description="Create a local FE-only pipeline placeholder."
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={addLead} icon={<Plus size={14} />}>
              Add Lead
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="lead-company" className="mb-1.5 block text-xs font-medium text-fg">
              Company
            </label>
            <input
              id="lead-company"
              value={newCompany}
              onChange={(event) => setNewCompany(event.target.value)}
              placeholder="e.g. Nusantara Digital Group"
              className="h-9 w-full rounded-control border border-line bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="lead-contact" className="mb-1.5 block text-xs font-medium text-fg">
              Contact person
            </label>
            <input
              id="lead-contact"
              value={newContact}
              onChange={(event) => setNewContact(event.target.value)}
              placeholder="e.g. Andi Pratama"
              className="h-9 w-full rounded-control border border-line bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div className="rounded-card border border-line bg-bg p-3 text-xs text-muted">
            New entries start in <span className="font-medium text-fg">Discovery &amp; Audit</span> at 25% probability until connected to the backend CRM pipeline.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminClientLeadAccounts;
