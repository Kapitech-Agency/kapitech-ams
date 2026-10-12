import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUpRight, Briefcase, CalendarDays, CircleDollarSign, FileText, Landmark, RefreshCw, ShieldAlert, WalletCards } from 'lucide-react';
import { AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminPanel, AdminSectionTabs, AdminStatusBadge } from '../../components/admin/AdminModulePrimitives';
import Button from '../../components/ui/Button';
import { api } from '../../lib/apiClient';
import { normalizeFinanceExpense, normalizeFinanceInvoice } from '../../lib/financeStore';
import type { AgencyExpense, AgencyInvoice } from '../../lib/financeStore';
import type { AgencyProject } from '../../lib/projectStore';
import type { AgencyVendor } from '../../lib/vendorStore';
import {
  classifyWorkbookExpense,
  EXCEL_CHART_OF_ACCOUNTS,
  FINANCE_WORKBOOK_GROUPS,
  getInvoiceCollected,
  getInvoiceDate,
  getInvoiceOutstanding,
  getMonthKey,
  getPaymentRows,
  getYearKey,
  isIssuedInvoice,
  sumAmounts
} from '../../lib/financeWorkbook';
import type { FinanceWorkbookTab, WorkbookExpenseClass } from '../../lib/financeWorkbook';
import { useSearchParams, useNavigate } from 'react-router-dom';

type Column = { label: string; align?: 'left' | 'right' | 'center'; className?: string };
type TableRow = { id: string; cells: React.ReactNode[] };
type SourceResult = { label: string; data: any; error?: string };
type CashMovement = { id: string; date: string; reference: string; description: string; cashIn: number; cashOut: number; source: string; currency: string };

const formatMoney = (value: number, currency = 'IDR') => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: currency === 'USD' ? 'USD' : 'IDR',
  maximumFractionDigits: 0
}).format(Number.isFinite(Number(value)) ? Number(value) : 0);

const formatDate = (value: unknown) => {
  const text = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '—';
  const date = new Date(text + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normaliseStatus = (value: unknown) => String(value || 'Not recorded').replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusTone = (status: unknown): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
  const value = String(status || '').toLowerCase();
  if (value === 'paid' || value === 'completed' || value === 'active' || value === 'posted') return 'success';
  if (value === 'overdue' || value === 'voided' || value === 'cancelled' || value === 'failed') return 'danger';
  if (value === 'partially_paid' || value === 'pending' || value === 'open' || value === 'draft') return 'warning';
  if (value === 'sent' || value === 'in_progress') return 'info';
  return 'neutral';
};

const StatusBadge: React.FC<{ value: unknown }> = ({ value }) => (
  <AdminStatusBadge tone={statusTone(value)}>{normaliseStatus(value)}</AdminStatusBadge>
);

const FinanceDataTable: React.FC<{
  title: string;
  description?: string;
  columns: Column[];
  rows: TableRow[];
  emptyMessage: string;
  actions?: React.ReactNode;
}> = ({ title, description, columns, rows, emptyMessage, actions }) => (
  <AdminPanel title={title} description={description} actions={actions} bodyClassName="p-0">
    <div className="max-w-full overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <thead className="bg-bg text-[11px] font-medium text-muted">
          <tr>
            {columns.map((column, index) => (
              <th key={column.label + '-' + index} scope="col" className={'px-4 py-3 font-medium ' + (column.align === 'right' ? 'text-right ' : column.align === 'center' ? 'text-center ' : '') + (column.className || '')}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={row.id} className="border-t border-line align-middle">
              {row.cells.map((cell, index) => (
                <td key={row.id + '-' + index} className={'px-4 py-3 text-fg ' + (columns[index]?.align === 'right' ? 'text-right tabular-nums ' : columns[index]?.align === 'center' ? 'text-center ' : '') + (columns[index]?.className || '')}>
                  {cell}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-xs leading-5 text-muted">{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </AdminPanel>
);

const WorkbookNote: React.FC<{ tone?: 'info' | 'warning' | 'danger'; title: string; children: React.ReactNode }> = ({ tone = 'info', title, children }) => {
  const styles = {
    info: 'border-info/25 bg-info/5',
    warning: 'border-warning/25 bg-warning/5',
    danger: 'border-danger/25 bg-danger/5'
  };
  const iconTone = tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : 'text-info';
  return (
    <div className={'flex gap-3 rounded-card border p-4 ' + styles[tone]}>
      <ShieldAlert size={17} className={'mt-0.5 shrink-0 ' + iconTone} />
      <div className="min-w-0">
        <h3 className="text-xs font-semibold text-fg">{title}</h3>
        <div className="mt-1 text-xs leading-5 text-muted">{children}</div>
      </div>
    </div>
  );
};

const readSource = async (label: string, request: () => Promise<any>): Promise<SourceResult> => {
  try {
    const response = await request();
    if (!response?.success) return { label, data: null, error: response?.error || 'Source did not return a successful response.' };
    return { label, data: response.data || {} };
  } catch (error) {
    return { label, data: null, error: error instanceof Error ? error.message : 'Source is not available.' };
  }
};

const expenseLabel = (expense: AgencyExpense) => [expense.category, expense.description].filter(Boolean).join(' · ');
const isPettyCashRelated = (expense: AgencyExpense) => /petty cash|pettycash|kas kecil|cash voucher/i.test([expense.category, expense.description].join(' '));
const invoiceClient = (invoice: AgencyInvoice) => invoice.clientCompany || invoice.clientName || 'Client not set';
const projectLabel = (project: AgencyProject) => project.name || project.slug || project.id;

const EXPENSE_CLASS_LABELS: Record<WorkbookExpenseClass, string> = {
  directProjectCost: 'Direct project cost',
  teamReward: 'Team reward',
  projectTeamFee: 'Project team fee',
  operatingExpense: 'Operating expense',
  unclassified: 'Unclassified'
};

const WORKBOOK_CLOSING_ITEMS = [
  { label: 'All revenue recorded', owner: 'Finance' },
  { label: 'All expenses recorded', owner: 'Finance' },
  { label: 'Cash & bank reconciled', owner: 'Finance' },
  { label: 'Receivables reviewed', owner: 'Finance' },
  { label: 'Payables reviewed', owner: 'Finance' },
  { label: 'Project margins reviewed', owner: 'Project owner' },
  { label: 'Project allocation reviewed', owner: 'Management' },
  { label: 'General journal balanced', owner: 'Finance' },
  { label: 'Balance sheet reviewed', owner: 'Management' },
  { label: 'Monthly reports approved', owner: 'Management' }
];

export const AdminFinanceWorkspace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedTab = searchParams.get('tab') || 'executive-summary';
  const flatTabs = FINANCE_WORKBOOK_GROUPS.flatMap((group) => group.items);
  const activeTab = flatTabs.find((item) => item.key === requestedTab) || flatTabs[0];
  const activeGroup = FINANCE_WORKBOOK_GROUPS.find((group) => group.items.some((item) => item.key === activeTab.key)) || FINANCE_WORKBOOK_GROUPS[0];

  const [invoices, setInvoices] = useState<AgencyInvoice[]>([]);
  const [expenses, setExpenses] = useState<AgencyExpense[]>([]);
  const [projects, setProjects] = useState<AgencyProject[]>([]);
  const [vendors, setVendors] = useState<AgencyVendor[]>([]);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  const loadData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    const results = await Promise.all([
      readSource('Invoices', () => api.finance.getInvoices()),
      readSource('Expenses', () => api.finance.getExpenses()),
      readSource('Projects', () => api.projects.getAll()),
      readSource('Vendors', () => api.vendors.getAll())
    ]);
    const invoiceSource = results[0];
    const expenseSource = results[1];
    const projectSource = results[2];
    const vendorSource = results[3];
    const nextInvoices = Array.isArray(invoiceSource.data?.invoices)
      ? invoiceSource.data.invoices.map((item: AgencyInvoice) => normalizeFinanceInvoice({
          ...item,
          currency: item.currency || 'IDR',
          items: Array.isArray(item.items) ? item.items : []
        } as AgencyInvoice))
      : [];
    const nextExpenses = Array.isArray(expenseSource.data?.expenses)
      ? expenseSource.data.expenses.map((item: AgencyExpense) => normalizeFinanceExpense(item))
      : [];
    setInvoices(nextInvoices);
    setExpenses(nextExpenses);
    setProjects(Array.isArray(projectSource.data?.projects) ? projectSource.data.projects as AgencyProject[] : []);
    setVendors(Array.isArray(vendorSource.data?.vendors) ? vendorSource.data.vendors as AgencyVendor[] : []);
    setSourceErrors(results.filter((result) => result.error).map((result) => result.label + ': ' + result.error));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setSearchText('');
  }, [activeTab.key]);

  const reportInvoices = useMemo(() => invoices.filter(isIssuedInvoice), [invoices]);
  const totalBilled = useMemo(() => sumAmounts<AgencyInvoice>(reportInvoices, (invoice) => Number(invoice.total) || 0), [reportInvoices]);
  const totalCollected = useMemo(() => sumAmounts<AgencyInvoice>(reportInvoices, getInvoiceCollected), [reportInvoices]);
  const totalOutstanding = useMemo(() => sumAmounts<AgencyInvoice>(reportInvoices, getInvoiceOutstanding), [reportInvoices]);
  const totalExpenses = useMemo(() => sumAmounts<AgencyExpense>(expenses, (expense) => Number(expense.amount) || 0), [expenses]);
  const cashMovements = useMemo<CashMovement[]>(() => {
    const entries: CashMovement[] = [];
    for (const invoice of reportInvoices) {
      for (const payment of getPaymentRows(invoice)) {
        if (!payment.date || payment.amount <= 0) continue;
        entries.push({
          id: 'payment-' + invoice.id + '-' + payment.id,
          date: payment.date,
          reference: payment.reference || invoice.invoiceNumber,
          description: 'Client payment · ' + invoiceClient(invoice),
          cashIn: payment.amount,
          cashOut: 0,
          source: 'Invoice payment',
          currency: invoice.currency || 'IDR'
        });
      }
    }
    for (const expense of expenses) {
      if (!expense.date || Number(expense.amount) <= 0) continue;
      entries.push({
        id: 'expense-' + expense.id,
        date: String(expense.date).slice(0, 10),
        reference: String((expense as any).reference || expense.id),
        description: expenseLabel(expense),
        cashIn: 0,
        cashOut: Number(expense.amount) || 0,
        source: 'Expense record',
        currency: String((expense as any).currency || 'IDR')
      });
    }
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [reportInvoices, expenses]);

  const matching = useCallback((values: unknown[]) => {
    const needle = searchText.trim().toLowerCase();
    return !needle || values.some((value) => String(value || '').toLowerCase().includes(needle));
  }, [searchText]);

  const openLegacyTransactions = () => navigate('/admin/invoicing');
  const groupItems = FINANCE_WORKBOOK_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    to: '/admin/finance?tab=' + group.items[0].key
  }));
  const sheetItems = activeGroup.items.map((item) => ({
    key: item.key,
    label: item.sheet + ' ' + item.label,
    to: '/admin/finance?tab=' + item.key
  }));

  const renderLoading = () => (
    <AdminPanel title="Loading finance sources" description="Reading live AMS invoice, expense, project and vendor records.">
      <div className="space-y-3 p-4">
        <div className="h-4 w-1/3 rounded-control bg-line/60" />
        <div className="h-24 rounded-card border border-line bg-bg" />
        <div className="h-32 rounded-card border border-line bg-bg" />
      </div>
    </AdminPanel>
  );

  const renderRecentActivity = () => {
    const rows: TableRow[] = cashMovements.slice(0, 8).map((entry) => ({
      id: entry.id,
      cells: [
        formatDate(entry.date),
        entry.reference,
        entry.description,
        entry.source,
        entry.cashIn ? <span className="text-success">{formatMoney(entry.cashIn, entry.currency)}</span> : '—',
        entry.cashOut ? formatMoney(entry.cashOut, entry.currency) : '—'
      ]
    }));
    return (
      <FinanceDataTable
        title="Recent transaction activity"
        description="Derived from recorded invoice payments and expense records; this is not a separate bank statement."
        columns={[
          { label: 'Date' }, { label: 'Reference' }, { label: 'Description' }, { label: 'Source' },
          { label: 'Cash in', align: 'right' }, { label: 'Cash out', align: 'right' }
        ]}
        rows={rows}
        emptyMessage="No recorded payment or expense activity is available from the connected AMS sources."
      />
    );
  };

  const renderSummary = (dashboard: boolean) => {
    const currentMonth = selectedMonth;
    const billedInMonth = sumAmounts<AgencyInvoice>(reportInvoices.filter((invoice) => getMonthKey(getInvoiceDate(invoice)) === currentMonth), (invoice) => Number(invoice.total) || 0);
    const collectedInMonth = sumAmounts<CashMovement>(cashMovements.filter((movement) => getMonthKey(movement.date) === currentMonth), (movement) => movement.cashIn);
    const expenseInMonth = sumAmounts<AgencyExpense>(expenses.filter((expense) => getMonthKey(expense.date) === currentMonth), (expense) => Number(expense.amount) || 0);
    const metrics = [
      { id: 'billed', label: 'Total billed', value: formatMoney(totalBilled), context: 'Issued invoices excluding drafts and cancellations', icon: <FileText size={15} /> },
      { id: 'collected', label: 'Total collected', value: formatMoney(totalCollected), context: 'Recorded client payments', icon: <ArrowDown size={15} />, toneClassName: 'text-success' },
      { id: 'receivable', label: 'Outstanding receivables', value: formatMoney(totalOutstanding), context: 'Derived from invoice balances', icon: <WalletCards size={15} />, toneClassName: 'text-warning' },
      { id: 'expenses', label: 'Recorded expenses', value: formatMoney(totalExpenses), context: 'Expense records returned by AMS', icon: <ArrowUpRight size={15} />, toneClassName: 'text-series-3' }
    ];
    const recentInvoices: TableRow[] = [...reportInvoices]
      .sort((a, b) => String(b.issueDate || '').localeCompare(String(a.issueDate || '')))
      .slice(0, 6)
      .map((invoice) => ({
        id: invoice.id,
        cells: [
          invoice.invoiceNumber,
          invoiceClient(invoice),
          formatDate(invoice.issueDate),
          formatMoney(Number(invoice.total) || 0, invoice.currency),
          formatMoney(getInvoiceOutstanding(invoice), invoice.currency),
          <StatusBadge value={invoice.status} />
        ]
      }));
    return (
      <div className="space-y-4">
        <AdminMetricStrip metrics={metrics} />
        {dashboard && (
          <AdminPanel title="Selected-month activity" description="Choose a month to inspect the same invoice and expense sources used throughout this workspace.">
            <div className="grid gap-4 p-4 sm:grid-cols-3">
              <label className="block text-xs font-medium text-muted">Reporting month
                <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="mt-1.5 block h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" />
              </label>
              <div className="rounded-control border border-line bg-bg p-3">
                <span className="block text-xs text-muted">Invoice value issued</span>
                <strong className="mt-1 block text-base font-semibold tabular-nums text-fg">{formatMoney(billedInMonth)}</strong>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <span className="block text-xs text-muted">Cash movement in / out</span>
                <strong className="mt-1 block text-base font-semibold tabular-nums text-fg">{formatMoney(collectedInMonth)} / {formatMoney(expenseInMonth)}</strong>
              </div>
            </div>
          </AdminPanel>
        )}
        {sourceErrors.length > 0 && (
          <WorkbookNote tone="warning" title="Some finance sources are unavailable">
            {sourceErrors.join(' · ')}. KPI values only reflect source records that loaded successfully. Refresh after the connection is restored.
          </WorkbookNote>
        )}
        <FinanceDataTable
          title={dashboard ? 'Recent invoice register' : 'Finance at a glance'}
          description={dashboard ? 'Latest issued invoices with current outstanding balances.' : 'Recent invoice records. Use the workbook sheet tabs above to continue into the detailed finance flow.'}
          columns={[{ label: 'Invoice no.' }, { label: 'Client' }, { label: 'Issue date' }, { label: 'Invoice value', align: 'right' }, { label: 'Outstanding', align: 'right' }, { label: 'Status' }]}
          rows={recentInvoices}
          emptyMessage="No issued invoices were returned by AMS."
          actions={<Button variant="secondary" type="button" onClick={openLegacyTransactions}>Open transaction workspace</Button>}
        />
        {dashboard && renderRecentActivity()}
        {!dashboard && (
          <AdminPanel title="Workbook flow" description="The active Finance workspace follows the 20 worksheets in Kapitech Finance Final Automated.xlsx.">
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              <div className="rounded-control border border-line bg-bg p-3"><span className="text-xs text-muted">Transactions</span><strong className="mt-1 block text-lg font-semibold tabular-nums text-fg">{invoices.length + expenses.length}</strong><span className="mt-1 block text-xs text-muted">Invoice and expense records loaded</span></div>
              <div className="rounded-control border border-line bg-bg p-3"><span className="text-xs text-muted">Project records</span><strong className="mt-1 block text-lg font-semibold tabular-nums text-fg">{projects.length}</strong><span className="mt-1 block text-xs text-muted">Project links available for reconciliation</span></div>
              <div className="rounded-control border border-line bg-bg p-3"><span className="text-xs text-muted">Vendor records</span><strong className="mt-1 block text-lg font-semibold tabular-nums text-fg">{vendors.length}</strong><span className="mt-1 block text-xs text-muted">Vendor and contract references</span></div>
            </div>
          </AdminPanel>
        )}
      </div>
    );
  };

  const renderView = (tab: FinanceWorkbookTab) => {
    switch (tab.key) {
      case 'executive-summary':
        return renderSummary(false);
      case 'dashboard':
        return renderSummary(true);
      case 'chart-of-accounts':
        return (
          <div className="space-y-4">
            <WorkbookNote title="Workbook-aligned master configuration">
              These 17 account codes and their normal balances are mapped directly from sheet 02 Chart of Accounts. This first pass is read-only; account editing and the persistent account API are not yet connected.
            </WorkbookNote>
            <FinanceDataTable
              title="Chart of Accounts"
              description="Master account list used as the mapping reference for the Excel-aligned Finance flow."
              columns={[{ label: 'Account code' }, { label: 'Account name' }, { label: 'Account type' }, { label: 'Normal balance' }, { label: 'Description' }, { label: 'Status' }]}
              rows={EXCEL_CHART_OF_ACCOUNTS.filter((account) => matching([account.code, account.name, account.type, account.description])).map((account) => ({
                id: account.code,
                cells: [account.code, account.name, account.type, account.normalBalance, account.description, <StatusBadge value={account.active ? 'active' : 'inactive'} />]
              }))}
              emptyMessage="No chart-of-account rows match the current search."
            />
          </div>
        );
      case 'revenue':
        return (
          <div className="space-y-4">
            <WorkbookNote title="Revenue register mapped to issued invoices">
              Invoice records are the current transaction source. Revenue fields such as project, revenue account, due date and payment status are shown from invoice data where those fields exist in AMS.
            </WorkbookNote>
            <AdminPanel title="Search revenue records" bodyClassName="p-4">
              <label className="block text-xs font-medium text-muted">Search invoice, client or project
                <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search invoices…" className="mt-1.5 block h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent sm:max-w-md" />
              </label>
            </AdminPanel>
            <FinanceDataTable
              title="Revenue register"
              description="The workbook's Revenue tab maps to issued invoices; payment collections remain attached to the invoice payment records."
              columns={[{ label: 'Date' }, { label: 'Invoice no.' }, { label: 'Client' }, { label: 'Project' }, { label: 'Amount', align: 'right' }, { label: 'Payment status' }, { label: 'Due date' }]}
              rows={reportInvoices.filter((invoice) => matching([invoice.invoiceNumber, invoiceClient(invoice), invoice.projectId, invoice.notes])).map((invoice) => ({
                id: invoice.id,
                cells: [formatDate(getInvoiceDate(invoice)), invoice.invoiceNumber, invoiceClient(invoice), projects.find((project) => project.id === invoice.projectId)?.name || invoice.projectId || '—', formatMoney(Number(invoice.total) || 0, invoice.currency), <StatusBadge value={invoice.status} />, formatDate(invoice.dueDate)]
              }))}
              emptyMessage="No issued invoice data is available for the selected search."
              actions={<Button type="button" variant="secondary" onClick={openLegacyTransactions}>Manage invoices</Button>}
            />
          </div>
        );
      case 'expenses':
        return (
          <div className="space-y-4">
            <AdminPanel title="Search expense records" bodyClassName="p-4">
              <label className="block text-xs font-medium text-muted">Search category, description, project or vendor
                <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search expenses…" className="mt-1.5 block h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent sm:max-w-md" />
              </label>
            </AdminPanel>
            <FinanceDataTable
              title="Expense register"
              description="Existing AMS expenses are the source for recorded costs. Unmapped categories should be resolved before final workbook-style P&L posting."
              columns={[{ label: 'Date' }, { label: 'Category' }, { label: 'Description' }, { label: 'Project' }, { label: 'Amount', align: 'right' }, { label: 'Account mapping' }, { label: 'Status' }]}
              rows={expenses.filter((expense) => matching([expense.category, expense.description, expense.projectId, expense.vendorId])).map((expense) => {
                const classification = classifyWorkbookExpense(expense);
                return {
                  id: expense.id,
                  cells: [formatDate(expense.date), expense.category, expense.description, projects.find((project) => project.id === expense.projectId)?.name || expense.projectId || '—', formatMoney(Number(expense.amount) || 0, String((expense as any).currency || 'IDR')), EXPENSE_CLASS_LABELS[classification], <StatusBadge value={(expense as any).status || 'posted'} />]
                };
              })}
              emptyMessage="No expense records match the selected search."
              actions={<Button type="button" variant="secondary" onClick={openLegacyTransactions}>Manage expenses</Button>}
            />
          </div>
        );
      case 'cash-bank':
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Cash & Bank activity is derived, not a bank reconciliation">
              This view combines recorded invoice payments and expense records. AMS does not yet have the workbook's dedicated cash/bank ledger, opening balance, bank-account field and verified running balance, so a bank balance is intentionally not inferred here.
            </WorkbookNote>
            {renderRecentActivity()}
          </div>
        );
      case 'accounts-receivable':
        return (
          <FinanceDataTable
            title="Accounts receivable"
            description="Outstanding is derived from the same invoice balance; paid amount and due date stay linked to the invoice source."
            columns={[{ label: 'Invoice no.' }, { label: 'Invoice date' }, { label: 'Client' }, { label: 'Project' }, { label: 'Invoice amount', align: 'right' }, { label: 'Paid amount', align: 'right' }, { label: 'Outstanding', align: 'right' }, { label: 'Status' }, { label: 'Due date' }]}
            rows={reportInvoices.filter((invoice) => getInvoiceOutstanding(invoice) > 0).map((invoice) => ({
              id: invoice.id,
              cells: [invoice.invoiceNumber, formatDate(getInvoiceDate(invoice)), invoiceClient(invoice), projects.find((project) => project.id === invoice.projectId)?.name || invoice.projectId || '—', formatMoney(Number(invoice.total) || 0, invoice.currency), formatMoney(getInvoiceCollected(invoice), invoice.currency), formatMoney(getInvoiceOutstanding(invoice), invoice.currency), <StatusBadge value={invoice.status} />, formatDate(invoice.dueDate)]
            }))}
            emptyMessage="No outstanding invoice balances were returned by the current AMS invoice source."
            actions={<Button type="button" variant="secondary" onClick={openLegacyTransactions}>Open invoices</Button>}
          />
        );
      case 'accounts-payable': {
        const contracts = vendors.flatMap((vendor) => (Array.isArray(vendor.contracts) ? vendor.contracts : []).map((contract) => {
          const linked = expenses.filter((expense) => {
            const expenseRecord = expense as AgencyExpense & { vendorContractId?: string; vendorPayment?: { vendorId?: string; contractId?: string }; metadata?: { vendorPayment?: { vendorId?: string; contractId?: string } } };
            const structured = expenseRecord.vendorPayment || expenseRecord.metadata?.vendorPayment;
            return (expenseRecord.vendorId === vendor.id && expenseRecord.vendorContractId === contract.id)
              || (structured?.vendorId === vendor.id && structured?.contractId === contract.id)
              || expense.description.startsWith('[VENDOR_PAYMENT]|' + vendor.id + '|' + contract.id + '|');
          });
          return { vendor, contract, linkedCount: linked.length, linkedAmount: sumAmounts<AgencyExpense>(linked, (expense) => Number(expense.amount) || 0) };
        }));
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Vendor contracts are commitments, not vendor bills">
              The workbook's Accounts Payable requires a bill amount, amount paid, due date and outstanding balance. AMS currently exposes vendor contracts and linked expense/payment references, but not a dedicated vendor-bill register. The table below shows commitment references only and intentionally does not invent an AP outstanding balance.
            </WorkbookNote>
            <FinanceDataTable
              title="Vendor obligation references"
              description="Linked expense amounts are shown for traceability; they are not treated as a substitute for a bill ledger."
              columns={[{ label: 'Vendor' }, { label: 'Contract' }, { label: 'Rate basis' }, { label: 'Contract rate/value', align: 'right' }, { label: 'Linked expense records', align: 'center' }, { label: 'AP balance' }]
              }
              rows={contracts.filter(({ vendor, contract }) => matching([vendor.name, vendor.companyName, contract.title, contract.rateType])).map(({ vendor, contract, linkedCount, linkedAmount }) => ({
                id: vendor.id + '-' + contract.id,
                cells: [vendor.companyName || vendor.name, contract.title, normaliseStatus(contract.rateType), formatMoney(Number(contract.rateAmount) || 0, contract.currency), linkedCount + ' · ' + formatMoney(linkedAmount, contract.currency), <AdminStatusBadge tone="warning">Bill ledger required</AdminStatusBadge>]
              }))}
              emptyMessage="No vendor contracts are available. Create or link vendor contracts in the existing Vendors workspace."
            />
          </div>
        );
      }
      case 'vendors':
        return (
          <FinanceDataTable
            title="Vendor & freelancer directory"
            description="Uses the existing AMS vendor and contract source. Payment schedule and vendor-bill status still need to be linked to the workbook's 30/20/50 schedule."
            columns={[{ label: 'Vendor / company' }, { label: 'Type' }, { label: 'Service' }, { label: 'Rate', align: 'right' }, { label: 'Contracts', align: 'center' }, { label: 'Status' }]}
            rows={vendors.filter((vendor) => matching([vendor.name, vendor.companyName, vendor.type, vendor.primaryCategory, vendor.skills.join(' ')])).map((vendor) => ({
              id: vendor.id,
              cells: [vendor.companyName || vendor.name, normaliseStatus(vendor.type), vendor.primaryCategory, formatMoney(Number(vendor.hourlyRate) || 0, vendor.currency), String(Array.isArray(vendor.contracts) ? vendor.contracts.length : 0), <StatusBadge value={vendor.status} />]
            }))}
            emptyMessage="No vendor records were returned by AMS."
            actions={<Button type="button" variant="secondary" onClick={() => navigate('/admin/team?view=vendor-directory')}>Open vendor directory</Button>}
          />
        );
      case 'project-finance':
        return (
          <div className="space-y-4">
            <WorkbookNote title="Project Finance uses explicit AMS project links">
              Invoice and expense values are linked by project ID only. Records that have not been linked to a project remain visible in their source register but are not silently assigned to a project.
            </WorkbookNote>
            <FinanceDataTable
              title="Project finance overview"
              description="Project budget, billed invoice value, collected client payments and recorded expenses."
              columns={[{ label: 'Project' }, { label: 'Client' }, { label: 'Budget', align: 'right' }, { label: 'Billed', align: 'right' }, { label: 'Collected', align: 'right' }, { label: 'Recorded cost', align: 'right' }, { label: 'Project status' }]}
              rows={projects.filter((project) => matching([project.name, project.clientCompany, project.clientName, project.status])).map((project) => {
                const projectInvoices = reportInvoices.filter((invoice) => invoice.projectId === project.id);
                const projectExpenses = expenses.filter((expense) => expense.projectId === project.id);
                return {
                  id: project.id,
                  cells: [projectLabel(project), project.clientCompany || project.clientName || '—', formatMoney(Number(project.budget) || 0), formatMoney(sumAmounts<AgencyInvoice>(projectInvoices, (invoice) => Number(invoice.total) || 0)), formatMoney(sumAmounts<AgencyInvoice>(projectInvoices, getInvoiceCollected)), formatMoney(sumAmounts<AgencyExpense>(projectExpenses, (expense) => Number(expense.amount) || 0)), <StatusBadge value={project.status} />]
                };
              })}
              emptyMessage="No AMS projects were returned. Link invoices and expenses to projects to populate this view."
            />
          </div>
        );
      case 'operational-budget': {
        const totalsByMonthCategory = new Map<string, { month: string; category: string; amount: number; count: number }>();
        for (const expense of expenses) {
          const month = getMonthKey(expense.date);
          if (!month) continue;
          const key = month + '|' + String(expense.category || 'Unclassified');
          const current = totalsByMonthCategory.get(key) || { month, category: String(expense.category || 'Unclassified'), amount: 0, count: 0 };
          current.amount += Number(expense.amount) || 0;
          current.count += 1;
          totalsByMonthCategory.set(key, current);
        }
        const rows = [...totalsByMonthCategory.values()].sort((a, b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category)).filter((item) => matching([item.month, item.category])).map((item) => ({
          id: item.month + '-' + item.category,
          cells: [item.month, item.category, item.count, formatMoney(item.amount), 'Budget target not stored in current AMS']
        }));
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Budget comparison needs a dedicated monthly budget register">
              AMS project budgets are available, but they are not equivalent to the workbook's monthly category budget, PIC, variance and notes. This screen reports recorded actual expenses by month and category without presenting a fabricated budget or variance.
            </WorkbookNote>
            <FinanceDataTable title="Actual operating and project expenses" description="Aggregated from current expense records." columns={[{ label: 'Month' }, { label: 'Category' }, { label: 'Records', align: 'right' }, { label: 'Actual amount', align: 'right' }, { label: 'Budget / variance' }]} rows={rows} emptyMessage="No dated expenses are available for budget review." />
          </div>
        );
      }
      case 'petty-cash': {
        const rows = expenses.filter((expense) => isPettyCashRelated(expense) && matching([expense.category, expense.description])).map((expense) => ({
          id: expense.id,
          cells: [formatDate(expense.date), expense.id, expense.description, (expense as any).custodian || 'Not stored', '—', formatMoney(Number(expense.amount) || 0), (expense as any).approvedBy || 'Not stored', 'Expense source']
        }));
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Dedicated petty-cash ledger is not available yet">
              The workbook requires voucher number, custodian, cash in/out, running balance, approver and receipt notes. Those fields are not part of the current AMS expense API, so this view only lists clearly identified petty-cash-related expense records and does not calculate a cash balance.
            </WorkbookNote>
            <FinanceDataTable title="Petty-cash-related expense records" description="Source records only; not yet a complete petty-cash voucher ledger." columns={[{ label: 'Date' }, { label: 'Source ID' }, { label: 'Description' }, { label: 'Custodian' }, { label: 'Cash in', align: 'right' }, { label: 'Cash out', align: 'right' }, { label: 'Approved by' }, { label: 'Source' }]} rows={rows} emptyMessage="No expense record is explicitly identified as petty cash. Use the existing expense workspace for current expense entry." actions={<Button type="button" variant="secondary" onClick={openLegacyTransactions}>Open expense workspace</Button>} />
          </div>
        );
      }
      case 'monthly-pnl': {
        const monthInvoices = reportInvoices.filter((invoice) => getMonthKey(getInvoiceDate(invoice)) === selectedMonth);
        const monthExpenses = expenses.filter((expense) => getMonthKey(expense.date) === selectedMonth);
        const revenue = sumAmounts<AgencyInvoice>(monthInvoices, (invoice) => Number(invoice.total) || 0);
        const classTotals: Record<WorkbookExpenseClass, number> = {
          directProjectCost: 0,
          teamReward: 0,
          projectTeamFee: 0,
          operatingExpense: 0,
          unclassified: 0
        };
        for (const expense of monthExpenses) classTotals[classifyWorkbookExpense(expense)] += Number(expense.amount) || 0;
        const classifiedExpense = classTotals.directProjectCost + classTotals.teamReward + classTotals.projectTeamFee + classTotals.operatingExpense;
        const grossProfit = revenue - classTotals.directProjectCost;
        const netPreview = grossProfit - classTotals.teamReward - classTotals.projectTeamFee - classTotals.operatingExpense;
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Preliminary P&L mapping">
              Reporting month is filtered by invoice issue date and expense date. AMS expense categories are not yet identical to the workbook's Project Cost / Operating Cost field, so unmapped expenses are shown separately and excluded from the preliminary net figure until the mapping is approved.
            </WorkbookNote>
            <AdminPanel title="Reporting period" bodyClassName="p-4">
              <label className="block text-xs font-medium text-muted">Month
                <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="mt-1.5 block h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent sm:max-w-xs" />
              </label>
            </AdminPanel>
            <AdminMetricStrip metrics={[
              { id: 'pnl-revenue', label: 'Invoice value', value: formatMoney(revenue), context: 'Issued invoices in selected month', icon: <FileText size={15} /> },
              { id: 'pnl-direct', label: 'Direct project cost', value: formatMoney(classTotals.directProjectCost), context: 'Based on current category mapping', icon: <Briefcase size={15} /> },
              { id: 'pnl-operating', label: 'Operating expense', value: formatMoney(classTotals.operatingExpense), context: 'Mapped operating costs', icon: <ArrowUpRight size={15} /> },
              { id: 'pnl-net', label: 'Net preview', value: formatMoney(netPreview), context: 'Before unclassified ' + formatMoney(classTotals.unclassified), icon: <CircleDollarSign size={15} /> }
            ]} />
            <FinanceDataTable title="Monthly Profit & Loss" description="Workbook line items; values remain a preview until AMS account classifications and posting rules are approved." columns={[{ label: 'Line item' }, { label: 'Amount', align: 'right' }, { label: 'Basis' }]} rows={[
              { id: 'rev', cells: ['Revenue', formatMoney(revenue), 'Invoice issue date'] },
              { id: 'direct', cells: ['Direct Project Cost', formatMoney(classTotals.directProjectCost), 'Mapped expense records'] },
              { id: 'gross', cells: ['Gross Profit', formatMoney(grossProfit), 'Revenue minus direct project cost'] },
              { id: 'reward', cells: ['Team Reward', formatMoney(classTotals.teamReward), 'Separate from Team Fee'] },
              { id: 'fee', cells: ['Project Team Fee', formatMoney(classTotals.projectTeamFee), 'Separate allocation bucket'] },
              { id: 'opex', cells: ['Operating Expense', formatMoney(classTotals.operatingExpense), 'Mapped operating expenses'] },
              { id: 'unmapped', cells: ['Unclassified Expense', formatMoney(classTotals.unclassified), 'Requires category mapping; excluded from net preview'] },
              { id: 'net', cells: ['Net Profit (preview)', formatMoney(netPreview), 'Gross Profit less mapped reward, fee and operating expense'] }
            ]} emptyMessage="No activity exists for the selected month." />
            <div className="text-xs text-muted">Classified expense total: {formatMoney(classifiedExpense)} · Source records in selected month: {monthExpenses.length} expenses, {monthInvoices.length} invoices.</div>
          </div>
        );
      }
      case 'cash-flow': {
        const monthly = new Map<string, { month: string; inflow: number; outflow: number; count: number }>();
        for (const movement of cashMovements) {
          const month = getMonthKey(movement.date);
          if (!month) continue;
          const item = monthly.get(month) || { month, inflow: 0, outflow: 0, count: 0 };
          item.inflow += movement.cashIn;
          item.outflow += movement.cashOut;
          item.count += 1;
          monthly.set(month, item);
        }
        const rows = [...monthly.values()].sort((a, b) => b.month.localeCompare(a.month)).map((item) => ({
          id: item.month,
          cells: [item.month, formatMoney(item.inflow), formatMoney(item.outflow), formatMoney(item.inflow - item.outflow), item.count]
        }));
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Cash-flow movement, not reconciled ending cash">
              Inflows use dated invoice payments; outflows use dated AMS expense records. Opening bank balance, bank account IDs, internal transfers and independent petty-cash balances are not yet linked, so the final column is net movement rather than an authoritative bank ending balance.
            </WorkbookNote>
            <FinanceDataTable title="Monthly Cash Flow" description="The workbook's cash-in / cash-out structure, derived from live AMS transaction sources." columns={[{ label: 'Month' }, { label: 'Total cash in', align: 'right' }, { label: 'Total cash out', align: 'right' }, { label: 'Net cash movement', align: 'right' }, { label: 'Source rows', align: 'right' }]} rows={rows} emptyMessage="No dated receipts or expense movements are available." />
          </div>
        );
      }
      case 'monthly-closing':
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Monthly closing checklist is not yet persisted">
              This tab preserves the ten control items from the workbook, but completion status, assigned owner, sign-off date and closing lock do not yet have a dedicated AMS backend record. Each item remains unconfirmed until that workflow is implemented.
            </WorkbookNote>
            <FinanceDataTable title="Monthly closing controls" description="Workbook checklist template. A loaded source is not the same as a reconciled or approved closing." columns={[{ label: 'Checklist item' }, { label: 'Default owner' }, { label: 'Status' }, { label: 'Control purpose' }]} rows={WORKBOOK_CLOSING_ITEMS.map((item, index) => ({
              id: String(index),
              cells: [item.label, item.owner, <AdminStatusBadge tone="warning">Not confirmed</AdminStatusBadge>, index === 0 ? 'All issued revenue is traceable to source invoices.' : index === 1 ? 'Expenses are classified and supported by evidence.' : index === 2 ? 'Bank activity agrees to the bank statement and opening balance.' : index === 7 ? 'Total debit equals total credit.' : 'Review and document before the period is closed.']
            }))} emptyMessage="No checklist items are configured." />
          </div>
        );
      case 'project-allocation':
        return (
          <div className="space-y-4">
            <WorkbookNote title="Allocation policy mapped from sheet 15">
              The workbook calculates allocation from Net Project Profit after vendor costs and other project obligations. Amounts are not generated here until AMS has explicit vendor commitment and other-obligation values linked to the same project.
            </WorkbookNote>
            <AdminMetricStrip metrics={[
              { id: 'alloc-petty', label: 'Petty cash reserve', value: '10%', context: 'Of Net Project Profit', icon: <Wallet size={15} /> },
              { id: 'alloc-emergency', label: 'Emergency fund', value: '10%', context: 'Of Net Project Profit', icon: <ShieldAlert size={15} /> },
              { id: 'alloc-reward', label: 'Team Reward', value: '10%', context: 'Separate from Project Team Fee', icon: <CircleDollarSign size={15} /> },
              { id: 'alloc-company', label: 'Company operational fund', value: '70%', context: 'Remainder after three allocations above', icon: <Landmark size={15} /> }
            ]} />
            <FinanceDataTable title="Team Reward distribution" description="Fixed allocation rules from the workbook." columns={[{ label: 'Recipient group' }, { label: 'Percentage of Net Project Profit' }, { label: 'Share of Team Reward' }]} rows={[
              { id: 'sales', cells: ['Sales', '5%', '50%'] },
              { id: 'vendor', cells: ['Vendor / PIC', '2.5%', '25%'] },
              { id: 'management', cells: ['Management', '2.5%', '25%'] }
            ]} emptyMessage="No allocation policy is available." />
            <WorkbookNote tone="warning" title="Allocation cannot be posted yet">
              The current AMS project model exposes a project budget, not the workbook's complete Contract Value, Vendor Commitment and Other Obligations register. The percentages are aligned, while per-project amounts and reserve status still require the missing links.
            </WorkbookNote>
          </div>
        );
      case 'team-fee': {
        const feeExpenses = expenses.filter((expense) => classifyWorkbookExpense(expense) === 'projectTeamFee');
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Team Fee and Team Reward remain separate">
              The workbook's Team Fee register is allocated by project, member, role and fee amount. The current expense API has no member-level allocation fields, so this table only shows expense records explicitly classified as Project Team Fee; it does not infer individual entitlement or payment schedule.
            </WorkbookNote>
            <FinanceDataTable title="Project Team Fee source records" description="Only records with an explicit Team Fee classification are listed." columns={[{ label: 'Date' }, { label: 'Project' }, { label: 'Description' }, { label: 'Amount', align: 'right' }, { label: 'Record state' }]} rows={feeExpenses.map((expense) => ({
              id: expense.id,
              cells: [formatDate(expense.date), projects.find((project) => project.id === expense.projectId)?.name || expense.projectId || 'Not linked', expense.description, formatMoney(Number(expense.amount) || 0, String((expense as any).currency || 'IDR')), <StatusBadge value={(expense as any).status || 'recorded'} />]
            }))} emptyMessage="No expense is explicitly mapped to Project Team Fee in the connected source. Member-level allocations need a dedicated persistent register." />
          </div>
        );
      }
      case 'balance-sheet':
        return (
          <div className="space-y-4">
            <WorkbookNote tone="danger" title="Balance Sheet is not ready to report totals">
              The workbook requires company-wide cash and bank, petty cash, emergency fund, receivables, project prepayments, payables, owner capital and retained earnings. AMS does not yet expose a reconciled ledger/opening-balance source for all those accounts, so no total assets, liabilities or equity is presented as authoritative.
            </WorkbookNote>
            <FinanceDataTable title="Workbook balance-sheet accounts" description="Readiness of the account source, rather than an unverified balance." columns={[{ label: 'Section' }, { label: 'Account' }, { label: 'Current source' }, { label: 'Readiness' }]} rows={[
              { id: 'cash', cells: ['Assets', 'Cash & Bank (1000)', 'Invoice receipts and expense activity only', <AdminStatusBadge tone="warning">Opening balance missing</AdminStatusBadge>] },
              { id: 'petty', cells: ['Assets', 'Petty Cash (1100)', 'No independent petty-cash ledger', <AdminStatusBadge tone="warning">Ledger required</AdminStatusBadge>] },
              { id: 'reserve', cells: ['Assets', 'Emergency Fund (1200)', 'Allocation policy only', <AdminStatusBadge tone="warning">Balance not posted</AdminStatusBadge>] },
              { id: 'ar', cells: ['Assets', 'Accounts Receivable (1300)', 'Derived from invoice outstanding', <AdminStatusBadge tone="success">Source available</AdminStatusBadge>] },
              { id: 'prepayment', cells: ['Assets', 'Project Asset / Prepayment (1400)', 'No dedicated prepayment register', <AdminStatusBadge tone="warning">Register required</AdminStatusBadge>] },
              { id: 'ap', cells: ['Liabilities', 'Accounts Payable (2000)', 'Vendor contracts, not vendor bills', <AdminStatusBadge tone="warning">Bill ledger required</AdminStatusBadge>] },
              { id: 'capital', cells: ['Equity', 'Owner / Capital (3000)', 'Opening equity not configured', <AdminStatusBadge tone="warning">Opening balance missing</AdminStatusBadge>] },
              { id: 'retained', cells: ['Equity', 'Retained Earnings (3100)', 'Closing journal not persisted', <AdminStatusBadge tone="warning">Journal required</AdminStatusBadge>] }
            ]} emptyMessage="No balance-sheet account mapping is available." />
          </div>
        );
      case 'journal': {
        const journalSources = [
          ...reportInvoices.filter((invoice) => getInvoiceOutstanding(invoice) > 0 || getInvoiceCollected(invoice) > 0).map((invoice) => ({
            id: 'invoice-' + invoice.id,
            date: getInvoiceDate(invoice),
            reference: invoice.invoiceNumber,
            description: 'Invoice source · ' + invoiceClient(invoice),
            amount: Number(invoice.total) || 0,
            source: 'Invoice'
          })),
          ...cashMovements.map((entry) => ({
            id: entry.id,
            date: entry.date,
            reference: entry.reference,
            description: entry.description,
            amount: entry.cashIn || entry.cashOut,
            source: entry.source
          }))
        ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);
        return (
          <div className="space-y-4">
            <WorkbookNote tone="danger" title="Source activity is not a posted General Journal">
              The current Finance API has no persistent journal header/line service. Rows below are source transactions awaiting posting, not debit/credit journal entries. Do not use this list as an accounting ledger or as proof that the trial balance balances.
            </WorkbookNote>
            <FinanceDataTable title="Transactions awaiting journal posting" description="Recent invoice, receipt and expense source activity; duplicate source references are retained for traceability." columns={[{ label: 'Date' }, { label: 'Reference' }, { label: 'Source' }, { label: 'Description' }, { label: 'Amount', align: 'right' }, { label: 'Posting state' }]} rows={journalSources.map((row) => ({
              id: row.id,
              cells: [formatDate(row.date), row.reference || '—', row.source, row.description, formatMoney(row.amount), <AdminStatusBadge tone="warning">Not posted</AdminStatusBadge>]
            }))} emptyMessage="No invoice, payment or expense source transactions are available." />
            <FinanceDataTable title="Workbook account posting map" description="Reference rules from the workbook Chart of Accounts; journal generation must be implemented with auditable posting rules." columns={[{ label: 'Event' }, { label: 'Debit' }, { label: 'Credit' }, { label: 'Posting dependency' }]} rows={[
              { id: 'invoice', cells: ['Invoice issued', '1300 · Accounts Receivable', '4000 · Project Revenue', 'Invoice status and tax treatment'] },
              { id: 'receipt', cells: ['Client payment', '1000 · Cash & Bank', '1300 · Accounts Receivable', 'Payment record and bank account'] },
              { id: 'vendor-bill', cells: ['Vendor bill approved', '5100 · Vendor / Direct Project Cost', '2000 · Accounts Payable', 'Dedicated vendor bill and project reference'] },
              { id: 'vendor-payment', cells: ['Vendor bill paid', '2000 · Accounts Payable', '1000 · Cash & Bank', 'Bill reference and payment proof'] },
              { id: 'petty-cash-transfer', cells: ['Bank to petty cash', '1100 · Petty Cash Reserve', '1000 · Cash & Bank', 'Transfer ID shared by both cash ledgers'] }
            ]} emptyMessage="No account posting rules are available." />
          </div>
        );
      }
      case 'annual-summary': {
        const yearInvoices = reportInvoices.filter((invoice) => getYearKey(getInvoiceDate(invoice)) === selectedYear);
        const yearExpenses = expenses.filter((expense) => getYearKey(expense.date) === selectedYear);
        const yearCollections = cashMovements.filter((movement) => getYearKey(movement.date) === selectedYear);
        const yearBilled = sumAmounts<AgencyInvoice>(yearInvoices, (invoice) => Number(invoice.total) || 0);
        const yearCollected = sumAmounts<CashMovement>(yearCollections, (movement) => movement.cashIn);
        const yearOutflow = sumAmounts<CashMovement>(yearCollections, (movement) => movement.cashOut);
        const yearExpense = sumAmounts<AgencyExpense>(yearExpenses, (expense) => Number(expense.amount) || 0);
        const years = Array.from(new Set([
          String(new Date().getFullYear()),
          ...reportInvoices.map((invoice) => getYearKey(getInvoiceDate(invoice))),
          ...expenses.map((expense) => getYearKey(expense.date))
        ].filter((value) => /^\d{4}$/.test(value)))).sort((a, b) => b.localeCompare(a));
        return (
          <div className="space-y-4">
            <AdminPanel title="Reporting year" bodyClassName="p-4">
              <label className="block text-xs font-medium text-muted">Year
                <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="mt-1.5 block h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent sm:max-w-xs">
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
            </AdminPanel>
            <AdminMetricStrip metrics={[
              { id: 'year-billed', label: 'Annual invoice value', value: formatMoney(yearBilled), context: selectedYear + ' · issued invoices', icon: <FileText size={15} /> },
              { id: 'year-collected', label: 'Annual collections', value: formatMoney(yearCollected), context: 'Payments dated in selected year', icon: <ArrowDown size={15} /> },
              { id: 'year-expenses', label: 'Annual recorded expenses', value: formatMoney(yearExpense), context: yearExpenses.length + ' source expense records', icon: <ArrowUpRight size={15} /> },
              { id: 'year-net', label: 'Net cash movement', value: formatMoney(yearCollected - yearOutflow), context: 'Not an accounting net profit', icon: <CircleDollarSign size={15} /> }
            ]} />
            <FinanceDataTable title="Annual summary" description="Period-filtered view; accounting net profit and closing cash depend on the missing ledger, opening balances and posting workflow." columns={[{ label: 'Metric' }, { label: 'Amount', align: 'right' }, { label: 'Basis' }]} rows={[
              { id: 'a-revenue', cells: ['Annual Revenue / Invoice Value', formatMoney(yearBilled), 'Invoice issue date'] },
              { id: 'a-collected', cells: ['Annual Collections', formatMoney(yearCollected), 'Payment date'] },
              { id: 'a-expense', cells: ['Annual Recorded Expenses', formatMoney(yearExpense), 'Expense date'] },
              { id: 'a-outflow', cells: ['Recorded cash outflow', formatMoney(yearOutflow), 'Expense source dates'] },
              { id: 'a-net', cells: ['Net Cash Movement (proxy)', formatMoney(yearCollected - yearOutflow), 'Collections minus recorded outflow'] }
            ]} emptyMessage="No records exist for the selected year." />
          </div>
        );
      }
      default:
        return <WorkbookNote title="Finance worksheet">{tab.description}</WorkbookNote>;
    }
  };

  return (
    <AdminPageShell featureSlug="excel-aligned-finance-workspace" className="space-y-4">
      <AdminModuleHeader
        slug="finance-workspace-header"
        title="Finance"
        description="Excel-aligned finance workflow · 20 workbook sheets · existing AMS design system"
        icon={<Landmark size={19} />}
        actions={
          <>
            <Button variant="secondary" type="button" onClick={openLegacyTransactions} icon={<ArrowUpRight size={14} />}>Open transaction workspace</Button>
            <Button variant="secondary" type="button" onClick={() => void loadData(true)} loading={refreshing} icon={<RefreshCw size={14} />}>Refresh data</Button>
          </>
        }
      />
      <div className="space-y-2">
        <AdminSectionTabs ariaLabel="Finance groups" activeKey={activeGroup.key} items={groupItems} />
        <AdminSectionTabs ariaLabel="Finance workbook sheets" activeKey={activeTab.key} items={sheetItems} />
      </div>
      <div className="flex flex-col gap-1 border-b border-line pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-muted">Sheet {activeTab.sheet} · {activeGroup.label}</div>
          <h2 className="mt-1 text-base font-semibold text-fg">{activeTab.label}</h2>
          <p className="mt-1 text-xs leading-5 text-muted">{activeTab.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminStatusBadge tone={sourceErrors.length ? 'warning' : loading ? 'info' : 'success'}>
            {loading ? 'Loading sources' : sourceErrors.length ? 'Partial source availability' : 'Connected source views'}
          </AdminStatusBadge>
        </div>
      </div>
      {sourceErrors.length > 0 && (
        <WorkbookNote tone="warning" title="Finance source warning">
          {sourceErrors.join(' · ')}. Check the connected AMS source before interpreting the affected views.
        </WorkbookNote>
      )}
      {loading ? renderLoading() : renderView(activeTab)}
      <div className="flex flex-col gap-2 border-t border-line pt-3 text-[11px] leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Source of truth for workflow design: Kapitech Finance Final Automated.xlsx.</span>
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> Excel-alignment implementation · reports reflect connected AMS records</span>
      </div>
    </AdminPageShell>
  );
};
