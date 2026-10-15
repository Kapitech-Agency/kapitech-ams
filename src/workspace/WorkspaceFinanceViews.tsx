import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpDown, ArrowUpRight, CalendarDays, Download, FileText, Plus, Receipt, WalletCards } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { WorkspaceRole } from './workspaceAccess';
import {
  ActionButton,
  dateLabel,
  idr,
  idrCompact,
  MetricCard,
  openPrintableDocument,
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

type ProposalType = 'Fixed-Price' | 'Retainer' | 'Time & Materials';
interface ProposalLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}
interface ProposalVersion {
  version: string;
  date: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Superseded';
}
const INITIAL_PROPOSAL_LINES: ProposalLineItem[] = [
  { id: 'LI-01', description: 'Discovery & product definition', quantity: 1, rate: 8500000 },
  { id: 'LI-02', description: 'UX/UI design and prototyping', quantity: 1, rate: 24500000 },
  { id: 'LI-03', description: 'Frontend engineering', quantity: 1, rate: 42000000 },
];

export const QuotationBuilderView: React.FC = () => {
  const [proposalType, setProposalType] = useState<ProposalType>('Fixed-Price');
  const [client, setClient] = useState('Aurora Commerce');
  const [proposalName, setProposalName] = useState('Commerce Platform Phase 2');
  const [validUntil, setValidUntil] = useState('2026-11-14');
  const [lineItems, setLineItems] = useState(INITIAL_PROPOSAL_LINES);
  const [versions, setVersions] = useState<ProposalVersion[]>([
    { version: 'v1', date: '2026-10-08', amount: 69000000, status: 'Superseded' },
    { version: 'v2', date: '2026-10-12', amount: 75000000, status: 'Sent' },
  ]);
  const [notice, setNotice] = useState('');
  const total = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const updateLine = (id: string, field: keyof ProposalLineItem, value: string | number) => setLineItems((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const addLine = () => setLineItems((items) => [...items, { id: 'LI-' + String(items.length + 1).padStart(2, '0'), description: '', quantity: 1, rate: 0 }]);
  const createVersion = () => {
    const nextVersion = 'v' + (versions.length + 1);
    setVersions((items) => items.map((item) => item.status === 'Sent' ? { ...item, status: 'Superseded' } : item).concat([{ version: nextVersion, date: new Date().toISOString().slice(0, 10), amount: total, status: 'Draft' }]));
    setNotice(nextVersion + ' version record created locally. It has not been stored in AMS.');
  };
  const exportPdf = () => {
    const rows: Array<[string, string]> = [
      ['Client', client],
      ['Proposal', proposalName],
      ['Commercial model', proposalType],
      ['Valid until', validUntil],
      ...lineItems.map((item) => [item.description || 'Untitled line item', idr(item.quantity * item.rate)] as [string, string]),
      ['Total proposal value', idr(total)],
    ];
    const opened = openPrintableDocument('Quotation · ' + proposalName, rows);
    setNotice(opened ? 'Print dialog opened. Choose Save as PDF in the browser to export this draft.' : 'The print window was blocked. Allow pop-ups and try the export again.');
  };

  return (
    <WorkspacePage slug="workspace-quotation-builder" title="Quotations & Proposals Builder" description="Compile fixed-price, retainer, or time-and-materials proposals and review draft version history." actions={<StatusBadge tone="info">Client-side proposal preview</StatusBadge>}>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <MetricCard label="Current draft total" value={idrCompact(total)} detail="Calculated from line items" tone="info" />
        <MetricCard label="Version archive" value={String(versions.length)} detail="v1 through latest version" />
        <MetricCard label="Commercial model" value={proposalType} detail="Select the model that fits the engagement" />
      </div>
      {notice && <div role="status" className="rounded-control border border-line bg-panel px-3 py-2.5 text-[11px] leading-5 text-muted">{notice}</div>}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(290px,0.7fr)]">
        <SectionPanel title="Proposal form matrix" description="Fields update the in-page proposal draft. No quote is created in the backend.">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <TextField label="Proposal title" value={proposalName} onChange={(event) => setProposalName(event.target.value)} required />
            <SelectField label="Client" value={client} onChange={(event) => setClient(event.target.value)}>
              <option>Aurora Commerce</option><option>Nusantara Health</option><option>Partner Portal Co.</option><option>Sababay Digital</option>
            </SelectField>
            <SelectField label="Commercial model" value={proposalType} onChange={(event) => setProposalType(event.target.value as ProposalType)}>
              <option>Fixed-Price</option><option>Retainer</option><option>Time & Materials</option>
            </SelectField>
            <TextField label="Valid until" type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2"><h3 className="text-[12px] font-semibold text-fg">Scope and price items</h3><ActionButton compact onClick={addLine}><Plus size={12} />Add line item</ActionButton></div>
          <TableScroller label="Proposal line item matrix">
            <table className={tableClassName + ' min-w-[680px]'}>
              <thead className={tableHeadClassName}><tr><th className="px-3 py-3">Description</th><th className="px-3 py-3 text-right">Qty</th><th className="px-3 py-3 text-right">Unit price</th><th className="px-3 py-3 text-right">Subtotal</th></tr></thead>
              <tbody>{lineItems.map((item) => <tr key={item.id}>
                <td className={tableCellClassName}><label className="sr-only" htmlFor={'proposal-' + item.id}>Description</label><input id={'proposal-' + item.id} value={item.description} onChange={(event) => updateLine(item.id, 'description', event.target.value)} placeholder="Scope line" className="h-8 w-full min-w-[200px] rounded-control border border-line bg-panel px-2 text-[11px] text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" /></td>
                <td className={tableCellClassName}><label className="sr-only" htmlFor={'qty-' + item.id}>Quantity</label><input id={'qty-' + item.id} type="number" min={1} value={item.quantity} onChange={(event) => updateLine(item.id, 'quantity', Math.max(1, Number(event.target.value)))} className="h-8 w-16 rounded-control border border-line bg-panel px-2 text-right text-[11px] tabular-nums text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" /></td>
                <td className={tableCellClassName}><label className="sr-only" htmlFor={'rate-' + item.id}>Unit price</label><input id={'rate-' + item.id} type="number" min={0} step={50000} value={item.rate} onChange={(event) => updateLine(item.id, 'rate', Math.max(0, Number(event.target.value)))} className="h-8 w-32 rounded-control border border-line bg-panel px-2 text-right text-[11px] tabular-nums text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" /></td>
                <td className={tableCellClassName + ' whitespace-nowrap text-right font-semibold tabular-nums text-fg'}>{idr(item.quantity * item.rate)}</td>
              </tr>)}</tbody>
              <tfoot><tr><td colSpan={3} className="px-3 py-3 text-right text-[11px] font-semibold text-muted">Proposal total</td><td className="px-3 py-3 text-right text-[13px] font-semibold tabular-nums text-fg">{idr(total)}</td></tr></tfoot>
            </table>
          </TableScroller>
          <div className="mt-4 flex flex-wrap justify-end gap-2"><ActionButton onClick={createVersion}><Plus size={13} />Create version record</ActionButton><ActionButton variant="primary" onClick={exportPdf}><Download size={13} />Print / Save PDF</ActionButton></div>
        </SectionPanel>
        <SectionPanel title="Version control PDF export archive" description="Historical version records; print export is generated in the browser.">
          <div className="grid gap-3">
            {versions.slice().reverse().map((version) => (
              <article key={version.version} className="flex min-w-0 items-start gap-3 rounded-control border border-line p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted"><FileText size={16} /></span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-semibold text-fg">{version.version}</p><StatusBadge tone={version.status === 'Sent' ? 'success' : version.status === 'Draft' ? 'warning' : 'neutral'}>{version.status}</StatusBadge></div><p className="mt-1 text-[10px] text-muted">Quotation PDF · {dateLabel(version.date)}</p><p className="mt-2 text-[12px] font-semibold tabular-nums text-fg">{idr(version.amount)}</p></div>
                <ActionButton compact onClick={() => { setNotice('Selected ' + version.version + '. Use Print / Save PDF to export the current draft.'); }} aria-label={'Select ' + version.version}>Details</ActionButton>
              </article>
            ))}
          </div>
          <div className="mt-4 rounded-control border border-line bg-bg p-3"><p className="text-[11px] font-semibold text-fg">Archive integration boundary</p><p className="mt-1 text-[11px] leading-5 text-muted">Version rows in this build are local UI state. Durable file storage, revision ownership and access checks remain with the existing AMS API.</p></div>
        </SectionPanel>
      </div>
    </WorkspacePage>
  );
};

interface InvoiceRecord {
  id: string;
  client: string;
  milestone: string;
  amount: number;
  ageDays: number;
  dueAt: string;
  status: 'Outstanding' | 'Scheduled' | 'Paid';
}
const INITIAL_INVOICES: InvoiceRecord[] = [
  { id: 'INV-2026-041', client: 'Aurora Commerce', milestone: 'UX sign-off · 40%', amount: 28000000, ageDays: 12, dueAt: '2026-10-03', status: 'Outstanding' },
  { id: 'INV-2026-036', client: 'Nusantara Health', milestone: 'Build milestone · 50%', amount: 42500000, ageDays: 41, dueAt: '2026-09-04', status: 'Outstanding' },
  { id: 'INV-2026-029', client: 'Sababay Digital', milestone: 'Care plan · Sep', amount: 12500000, ageDays: 73, dueAt: '2026-08-03', status: 'Outstanding' },
  { id: 'INV-2026-044', client: 'Partner Portal Co.', milestone: 'API acceptance · 30%', amount: 18300000, ageDays: 28, dueAt: '2026-09-17', status: 'Outstanding' },
  { id: 'INV-2026-025', client: 'Northstar Commerce', milestone: 'Discovery complete', amount: 9000000, ageDays: 66, dueAt: '2026-08-10', status: 'Outstanding' },
];

export const InvoiceLedgerView: React.FC = () => {
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [selectedId, setSelectedId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('2026-10-20');
  const [notice, setNotice] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const openInvoices = invoices.filter((invoice) => invoice.status !== 'Paid');
  const agingBuckets = [
    { label: '0–30 days', items: openInvoices.filter((invoice) => invoice.ageDays <= 30), tone: 'info' as const },
    { label: '31–60 days', items: openInvoices.filter((invoice) => invoice.ageDays > 30 && invoice.ageDays <= 60), tone: 'warning' as const },
    { label: '>60 days', items: openInvoices.filter((invoice) => invoice.ageDays > 60), tone: 'danger' as const },
  ];
  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedId) || null;
  const scheduleBilling = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedInvoice) return;
    setInvoices((items) => items.map((invoice) => invoice.id === selectedId ? { ...invoice, status: 'Scheduled', dueAt: scheduledDate, ageDays: 0 } : invoice));
    setNotice('Billing milestone for ' + selectedInvoice.id + ' scheduled for ' + dateLabel(scheduledDate) + ' in local preview state.');
    setScheduleOpen(false);
  };

  return (
    <WorkspacePage slug="workspace-invoice-ledger" title="Invoicing & Accounts Receivable" description="Milestone-triggered billing schedules, outstanding receivables and invoice aging escalation." actions={<ActionButton variant="primary" onClick={() => { setSelectedId(invoices.find((invoice) => invoice.status === 'Outstanding')?.id || ''); setScheduleOpen(true); }}><CalendarDays size={13} />Schedule billing</ActionButton>}>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        {agingBuckets.map((bucket) => <MetricCard key={bucket.label} label={'Aging · ' + bucket.label} value={idrCompact(bucket.items.reduce((sum, item) => sum + item.amount, 0))} detail={bucket.items.length + ' outstanding invoice' + (bucket.items.length === 1 ? '' : 's')} tone={bucket.tone} icon={<AlertTriangle size={14} />} />)}
      </div>
      {notice && <div role="status" className="rounded-control border border-line bg-panel px-3 py-2.5 text-[11px] text-muted">{notice}</div>}
      <SectionPanel title="Aging invoice alert tracker" description="Outstanding balance is grouped by overdue age. Scheduled invoices are excluded from aging totals.">
        <div className="grid min-w-0 gap-3 lg:grid-cols-3">
          {agingBuckets.map((bucket) => <div key={bucket.label} className="min-w-0 rounded-control border border-line p-3">
            <div className="flex items-center justify-between gap-2"><p className="text-[12px] font-semibold text-fg">{bucket.label}</p><StatusBadge tone={bucket.tone}>{bucket.items.length}</StatusBadge></div>
            <p className="mt-2 text-[18px] font-semibold tabular-nums text-fg">{idrCompact(bucket.items.reduce((sum, item) => sum + item.amount, 0))}</p>
            <div className="mt-3 grid gap-2">{bucket.items.map((invoice) => <div key={invoice.id} className="rounded-control border border-line bg-bg p-2.5"><p className="text-[11px] font-semibold text-fg">{invoice.client}</p><p className="mt-1 text-[10px] text-muted">{invoice.id} · {invoice.ageDays} days overdue</p><p className="mt-2 text-[11px] font-semibold tabular-nums text-fg">{idr(invoice.amount)}</p></div>)}{!bucket.items.length && <p className="text-[10px] text-muted">No invoices in this band.</p>}</div>
          </div>)}
        </div>
      </SectionPanel>
      <SectionPanel title="Milestone billing schedule" description="Schedule a billing event against a project milestone; local preview only.">
        <TableScroller label="Invoice schedule">
          <table className={tableClassName + ' min-w-[900px]'}>
            <thead className={tableHeadClassName}><tr><th className="px-3 py-3">Invoice ID</th><th className="px-3 py-3">Client / milestone</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3">Due date</th><th className="px-3 py-3 text-right">Age (days)</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th></tr></thead>
            <tbody>{invoices.map((invoice) => <tr key={invoice.id} className="hover:bg-bg/60"><td className={tableCellClassName + ' font-mono text-[10px] text-muted'}>{invoice.id}</td><td className={tableCellClassName}><p className="font-medium text-fg">{invoice.client}</p><p className="mt-1 text-[10px] text-muted">{invoice.milestone}</p></td><td className={tableCellClassName + ' text-right tabular-nums font-semibold text-fg'}>{idr(invoice.amount)}</td><td className={tableCellClassName + ' whitespace-nowrap text-muted'}>{dateLabel(invoice.dueAt)}</td><td className={tableCellClassName + ' text-right tabular-nums text-fg'}>{invoice.ageDays}</td><td className={tableCellClassName}><StatusBadge tone={invoice.status === 'Paid' ? 'success' : invoice.status === 'Scheduled' ? 'info' : invoice.ageDays > 60 ? 'danger' : invoice.ageDays > 30 ? 'warning' : 'neutral'}>{invoice.status}</StatusBadge></td><td className={tableCellClassName}><ActionButton compact disabled={invoice.status === 'Paid'} onClick={() => { setSelectedId(invoice.id); setScheduleOpen(true); }}>Schedule</ActionButton></td></tr>)}</tbody>
          </table>
        </TableScroller>
      </SectionPanel>
      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule billing milestone" description="Attach a billing date to the selected invoice milestone." size="md" footer={<><ActionButton onClick={() => setScheduleOpen(false)}>Cancel</ActionButton><ActionButton variant="primary" onClick={() => { const form = document.getElementById('billing-schedule-form') as HTMLFormElement | null; form?.requestSubmit(); }}>Save schedule</ActionButton></>}>
        <form id="billing-schedule-form" onSubmit={scheduleBilling} className="grid gap-4">
          <SelectField label="Invoice / milestone" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} required>
            {invoices.filter((invoice) => invoice.status !== 'Paid').map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.id} · {invoice.client}</option>)}
          </SelectField>
          <TextField label="Scheduled billing date" type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} required />
          {selectedInvoice && <div className="rounded-control border border-line bg-bg p-3"><p className="text-[11px] font-semibold text-fg">{selectedInvoice.milestone}</p><p className="mt-1 text-[12px] tabular-nums text-muted">{idr(selectedInvoice.amount)}</p></div>}
        </form>
      </Modal>
    </WorkspacePage>
  );
};

interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  description: string;
  vendor: string;
  vendor_id: string;
  vendor_contract_id: string;
  contract_link_id: string;
  project: string;
  amount: number;
  status: 'Logged' | 'Pending review' | 'Paid';
}
const EXPENSES: ExpenseRecord[] = [
  { id: 'EXP-0261', date: '2026-10-14', category: 'Software', description: 'Prototype collaboration seats', vendor: 'Productivity Tools Ltd.', vendor_id: 'VND-0018', vendor_contract_id: 'CTR-SUB-0021', contract_link_id: 'CTR-SUB-0021', project: 'Aurora Commerce', amount: 1850000, status: 'Paid' },
  { id: 'EXP-0262', date: '2026-10-13', category: 'Cloud', description: 'Staging environment usage', vendor: 'Cloud Platform Asia', vendor_id: 'VND-0007', vendor_contract_id: 'CTR-OPS-0013', contract_link_id: 'CTR-OPS-0013', project: 'Partner Portal', amount: 3250000, status: 'Logged' },
  { id: 'EXP-0263', date: '2026-10-12', category: 'Production', description: 'Client shoot production assets', vendor: 'Studio Kreasi', vendor_id: 'VND-0026', vendor_contract_id: 'CTR-PRO-0009', contract_link_id: 'CTR-PRO-0009', project: 'Nusantara Health', amount: 6400000, status: 'Pending review' },
  { id: 'EXP-0264', date: '2026-10-10', category: 'Travel', description: 'Client workshop transport', vendor: 'Mobilitas Partner', vendor_id: 'VND-0012', vendor_contract_id: 'CTR-OPS-0018', contract_link_id: 'CTR-OPS-0018', project: 'Aurora Commerce', amount: 975000, status: 'Logged' },
];

export const ExpenseVendorLedgerView: React.FC = () => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => EXPENSES.filter((item) => (item.id + item.vendor + item.project + item.description + item.vendor_id + item.vendor_contract_id + item.contract_link_id).toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <WorkspacePage slug="workspace-expense-ledger" title="Expense & Vendor Ledger" description="Operational expense transactions with explicit vendor and contract-link IDs for each outflow." actions={<StatusBadge tone="info">Migration 049 field map</StatusBadge>}>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <MetricCard label="Operational outflows" value={idrCompact(EXPENSES.reduce((sum, item) => sum + item.amount, 0))} detail="Preview transaction total" />
        <MetricCard label="Vendors referenced" value={String(new Set(EXPENSES.map((item) => item.vendor_id)).size)} detail="Unique vendor_id values" tone="info" />
        <MetricCard label="Needs review" value={String(EXPENSES.filter((item) => item.status === 'Pending review').length)} detail="Pending ledger confirmation" tone="warning" />
      </div>
      <SectionPanel title="Expense transaction ledger" description="Rows show Migration 049 fields plus the requested UI alias. All record IDs below are illustrative fixtures." actions={<div className="relative"><input aria-label="Search expense ledger" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vendor, project or ID" className="h-9 w-[min(245px,70vw)] rounded-control border border-line bg-panel px-3 text-[11px] text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" /></div>}>
        <TableScroller label="Expense and vendor ledger table">
          <table className={tableClassName + ' min-w-[1240px]'}>
            <thead className={tableHeadClassName}><tr><th className="px-3 py-3">Expense ID / date</th><th className="px-3 py-3">Category / asset</th><th className="px-3 py-3">Vendor</th><th className="px-3 py-3">vendor_id</th><th className="px-3 py-3">vendor_contract_id · Migration 049</th><th className="px-3 py-3">contract_link_id · UI alias</th><th className="px-3 py-3">Project</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3">Status</th></tr></thead>
            <tbody>{filtered.map((expense) => <tr key={expense.id} className="hover:bg-bg/60"><td className={tableCellClassName}><p className="font-mono text-[10px] text-muted">{expense.id}</p><p className="mt-1 text-[10px] text-muted">{dateLabel(expense.date)}</p></td><td className={tableCellClassName}><p className="font-medium text-fg">{expense.category}</p><p className="mt-1 text-[10px] text-muted">{expense.description}</p></td><td className={tableCellClassName + ' text-fg'}>{expense.vendor}</td><td className={tableCellClassName + ' whitespace-nowrap font-mono text-[10px] text-muted'}>{expense.vendor_id}</td><td className={tableCellClassName + ' whitespace-nowrap font-mono text-[10px] text-muted'}>{expense.vendor_contract_id}</td><td className={tableCellClassName + ' whitespace-nowrap font-mono text-[10px] text-muted'}>{expense.contract_link_id}</td><td className={tableCellClassName + ' text-muted'}>{expense.project}</td><td className={tableCellClassName + ' text-right font-semibold tabular-nums text-fg'}>{idr(expense.amount)}</td><td className={tableCellClassName}><StatusBadge tone={expense.status === 'Paid' ? 'success' : expense.status === 'Pending review' ? 'warning' : 'neutral'}>{expense.status}</StatusBadge></td></tr>)}</tbody>
          </table>
          {!filtered.length && <p className="p-6 text-center text-[11px] text-muted">No expense transaction matches the current search.</p>}
        </TableScroller>
      </SectionPanel>
    </WorkspacePage>
  );
};

interface DetailedProfitability {
  project: string;
  revenue: number;
  staffHours: number;
  cost_rate: number;
  vendorExpenses: number;
  deliveryBudget: number;
}
const FINANCE_PROJECT_DATA: DetailedProfitability[] = [
  { project: 'Aurora Commerce', revenue: 128000000, staffHours: 230, cost_rate: 250000, vendorExpenses: 12800000, deliveryBudget: 80000000 },
  { project: 'Nusantara Health', revenue: 84000000, staffHours: 184, cost_rate: 300000, vendorExpenses: 22500000, deliveryBudget: 75000000 },
  { project: 'Partner Portal', revenue: 61000000, staffHours: 112, cost_rate: 220000, vendorExpenses: 9400000, deliveryBudget: 50000000 },
];
interface AggregateProfitability {
  project: string;
  revenue: number;
  staffCostTotal: number;
  vendorExpenses: number;
  deliveryBudget: number;
  netProfit: number;
}
const PM_AGGREGATE_DATA: AggregateProfitability[] = [
  { project: 'Aurora Commerce', revenue: 128000000, staffCostTotal: 57500000, vendorExpenses: 12800000, deliveryBudget: 80000000, netProfit: 57700000 },
  { project: 'Nusantara Health', revenue: 84000000, staffCostTotal: 55200000, vendorExpenses: 22500000, deliveryBudget: 75000000, netProfit: 6300000 },
  { project: 'Partner Portal', revenue: 61000000, staffCostTotal: 24640000, vendorExpenses: 9400000, deliveryBudget: 50000000, netProfit: 26960000 },
];

export const ProjectProfitabilityView: React.FC<{ role: WorkspaceRole | null }> = ({ role }) => {
  const aggregateMode = role === 'PM';
  const detailedRows = FINANCE_PROJECT_DATA.map((project) => {
    const staffCost = project.staffHours * project.cost_rate;
    const totalCost = staffCost + project.vendorExpenses;
    return { ...project, staffCost, totalCost, netProfit: project.revenue - totalCost, burnRate: totalCost / project.deliveryBudget * 100 };
  });
  const aggregateRows = PM_AGGREGATE_DATA.map((project) => {
    const totalCost = project.staffCostTotal + project.vendorExpenses;
    return { ...project, totalCost, burnRate: totalCost / project.deliveryBudget * 100 };
  });
  const totalRevenue = aggregateMode ? aggregateRows.reduce((sum, row) => sum + row.revenue, 0) : detailedRows.reduce((sum, row) => sum + row.revenue, 0);
  const totalCost = aggregateMode ? aggregateRows.reduce((sum, row) => sum + row.totalCost, 0) : detailedRows.reduce((sum, row) => sum + row.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const displayedRows = aggregateMode ? aggregateRows : detailedRows;
  const overrunCount = displayedRows.filter((row) => row.burnRate >= 80).length;

  return (
    <WorkspacePage slug="workspace-project-profitability" title="Real-Time Project Profitability Hub" description={aggregateMode ? 'Aggregated operating sums for project managers. Individual cost-rate fields are not rendered in this view.' : 'Project contribution using revenue less staff hours at cost rate and vendor expenses.'} actions={<StatusBadge tone={aggregateMode ? 'info' : 'success'}>{aggregateMode ? 'PM · Aggregated view' : 'Financial detail'}</StatusBadge>}>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Revenue" value={idrCompact(totalRevenue)} detail="Recognized project revenue" />
        <MetricCard label="Operating cost" value={idrCompact(totalCost)} detail="Staff cost plus vendor expenses" tone="warning" icon={<ArrowUpDown size={14} />} />
        <MetricCard label="Net profit" value={idrCompact(totalProfit)} detail="Revenue less operating cost" tone={totalProfit >= 0 ? 'success' : 'danger'} icon={totalProfit >= 0 ? <ArrowUpRight size={14} /> : <ArrowUpDown size={14} />} />
        <MetricCard label="Burn-rate alerts" value={String(overrunCount)} detail="Projects at or above 80% of delivery budget" tone={overrunCount ? 'warning' : 'success'} icon={<AlertTriangle size={14} />} />
      </div>
      {overrunCount > 0 && <div role="alert" className="flex items-start gap-2.5 rounded-control border border-warning/35 bg-warning/10 p-3"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" /><div><p className="text-[12px] font-semibold text-fg">Cost overrun warning</p><p className="mt-1 text-[11px] leading-5 text-muted">{overrunCount} project(s) have consumed at least 80% of their indicative delivery budget. Review scope, staffing and vendor commitments.</p></div></div>}
      {aggregateMode ? (
        <SectionPanel title="Aggregated project operating sums" description="PM view intentionally excludes cost_rate values, individual rates and staff-hour details.">
          <TableScroller label="Aggregated project profitability table">
            <table className={tableClassName + ' min-w-[930px]'}>
              <thead className={tableHeadClassName}><tr><th className="px-3 py-3">Project</th><th className="px-3 py-3 text-right">Revenue</th><th className="px-3 py-3 text-right">Staff cost · aggregate</th><th className="px-3 py-3 text-right">Vendor expenses</th><th className="px-3 py-3 text-right">Total operating cost</th><th className="px-3 py-3 text-right">Net profit</th><th className="px-3 py-3">Burn rate</th></tr></thead>
              <tbody>{aggregateRows.map((row) => <tr key={row.project} className="hover:bg-bg/60"><td className={tableCellClassName + ' font-semibold text-fg'}>{row.project}</td><td className={tableCellClassName + ' text-right tabular-nums text-fg'}>{idr(row.revenue)}</td><td className={tableCellClassName + ' text-right tabular-nums text-fg'}>{idr(row.staffCostTotal)}</td><td className={tableCellClassName + ' text-right tabular-nums text-fg'}>{idr(row.vendorExpenses)}</td><td className={tableCellClassName + ' text-right tabular-nums font-semibold text-fg'}>{idr(row.totalCost)}</td><td className={tableCellClassName + ' text-right tabular-nums font-semibold text-fg'}>{idr(row.netProfit)}</td><td className={tableCellClassName}><div className="flex min-w-[120px] items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><div className={'h-full rounded-full ' + (row.burnRate >= 80 ? 'bg-warning' : 'bg-series-2')} style={{ width: Math.min(100, row.burnRate) + '%' }} /></div><StatusBadge tone={row.burnRate >= 80 ? 'warning' : 'success'}>{Math.round(row.burnRate)}%</StatusBadge></div></td></tr>)}</tbody>
            </table>
          </TableScroller>
          <p className="mt-3 text-[10px] leading-4 text-muted">Aggregated amounts are provided for delivery oversight. Rate-level data should also be excluded from the API response for PM users; client-side masking is not a substitute for server authorization.</p>
        </SectionPanel>
      ) : (
        <SectionPanel title="Project profitability detail" description="Net profit = revenue − (staff hours × cost_rate) − vendor expenses. Rates are shown only in Finance/Admin views.">
          <TableScroller label="Project profitability detail table">
            <table className={tableClassName + ' min-w-[1120px]'}>
              <thead className={tableHeadClassName}><tr><th className="px-3 py-3">Project</th><th className="px-3 py-3 text-right">Revenue</th><th className="px-3 py-3 text-right">Staff hours</th><th className="px-3 py-3 text-right">cost_rate</th><th className="px-3 py-3 text-right">Staff cost</th><th className="px-3 py-3 text-right">Vendor expenses</th><th className="px-3 py-3 text-right">Net profit</th><th className="px-3 py-3">Burn rate</th></tr></thead>
              <tbody>{detailedRows.map((row) => <tr key={row.project} className="hover:bg-bg/60"><td className={tableCellClassName + ' font-semibold text-fg'}>{row.project}</td><td className={tableCellClassName + ' text-right tabular-nums text-fg'}>{idr(row.revenue)}</td><td className={tableCellClassName + ' text-right tabular-nums text-fg'}>{row.staffHours}</td><td className={tableCellClassName + ' text-right tabular-nums text-fg'}>{idr(row.cost_rate)}</td><td className={tableCellClassName + ' text-right tabular-nums text-fg'}>{idr(row.staffCost)}</td><td className={tableCellClassName + ' text-right tabular-nums text-fg'}>{idr(row.vendorExpenses)}</td><td className={tableCellClassName + ' text-right tabular-nums font-semibold text-fg'}>{idr(row.netProfit)}</td><td className={tableCellClassName}><StatusBadge tone={row.burnRate >= 80 ? 'warning' : 'success'}>{Math.round(row.burnRate)}% {row.burnRate >= 80 ? 'Overrun risk' : 'Within guardrail'}</StatusBadge></td></tr>)}</tbody>
            </table>
          </TableScroller>
        </SectionPanel>
      )}
    </WorkspacePage>
  );
};
