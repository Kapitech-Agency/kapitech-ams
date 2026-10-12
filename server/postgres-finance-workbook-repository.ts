import { getVendorBillInstallmentSchedule } from '../src/lib/financeWorkbook.ts';
import crypto from 'node:crypto';
import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

export const FINANCE_WORKBOOK_RECORD_TYPES = [
  'chart-of-accounts', 'cash-bank-opening', 'cash-bank-transaction', 'petty-cash-voucher',
  'vendor-bill', 'vendor-bill-payment', 'operational-budget', 'project-finance', 'team-fee',
  'project-allocation', 'journal-entry', 'monthly-closing', 'balance-sheet-opening', 'monthly-closing-lock'
] as const;
export type FinanceWorkbookRecordType = typeof FINANCE_WORKBOOK_RECORD_TYPES[number];
export type FinanceWorkbookRecord = {
  id: string; recordType: FinanceWorkbookRecordType; recordKey: string; periodKey?: string; projectId?: string;
  status: string; payload: Record<string, unknown>; version: number; createdByUserId?: string;
  updatedByUserId?: string; createdAt: string; updatedAt: string; archivedAt?: string;
};
type Row = Record<string, any>;
type Actor = { id: string; name: string; username: string; role: string };
export class FinanceWorkbookValidationError extends Error { readonly code = 'FINANCE_WORKBOOK_INVALID'; }
export class FinanceWorkbookNotFoundError extends Error { readonly code = 'FINANCE_WORKBOOK_NOT_FOUND'; }
export class FinanceWorkbookConflictError extends Error { readonly code = 'FINANCE_WORKBOOK_CONFLICT'; }
export class FinanceWorkbookPeriodClosedError extends Error { readonly code = 'FINANCE_WORKBOOK_PERIOD_CLOSED'; }

const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const txt = (v: unknown, n = 500): string => String(v ?? '').trim().slice(0, n);
const money = (v: unknown, label: string, allowZero = true): number => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || (!allowZero && n === 0) || n > 1_000_000_000_000) throw new FinanceWorkbookValidationError(label + ' must be a valid ' + (allowZero ? 'non-negative' : 'positive') + ' amount.');
  return Math.round(n * 100) / 100;
};
const date = (v: unknown, label: string, optional = false): string => {
  const s = txt(v, 10);
  if (optional && !s) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(new Date(s + 'T00:00:00Z').getTime())) throw new FinanceWorkbookValidationError(label + ' must use YYYY-MM-DD.');
  return s;
};
const month = (v: unknown): string => {
  const s = txt(v, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) throw new FinanceWorkbookValidationError('Period must use YYYY-MM.');
  return s;
};
const choice = (v: unknown, allowed: string[], label: string, fallback = ''): string => {
  const s = txt(v, 100) || fallback;
  if (!allowed.includes(s)) throw new FinanceWorkbookValidationError(label + ' must be one of: ' + allowed.join(', ') + '.');
  return s;
};
const periodOf = (s: string): string => s ? s.slice(0, 7) : '';
const timeNow = () => new Date().toISOString();
const uid = (prefix: string) => prefix + '_' + Date.now().toString(36) + '_' + crypto.randomBytes(5).toString('hex');
const keyText = (v: unknown): string => txt(v, 220).toLowerCase();

function mapRow(row: Row): FinanceWorkbookRecord {
  return {
    id: String(row.id), recordType: row.record_type as FinanceWorkbookRecordType, recordKey: String(row.record_key),
    periodKey: row.period_key ? String(row.period_key) : undefined, projectId: row.project_id ? String(row.project_id) : undefined,
    status: String(row.status || 'active'), payload: obj(row.payload), version: Number(row.version || 1),
    createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : undefined,
    updatedByUserId: row.updated_by_user_id ? String(row.updated_by_user_id) : undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    archivedAt: row.archived_at ? (row.archived_at instanceof Date ? row.archived_at.toISOString() : String(row.archived_at)) : undefined
  };
}

function normalise(type: FinanceWorkbookRecordType, raw: unknown, approval = false): { payload: Record<string, unknown>; key: string; period?: string; project?: string; status: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new FinanceWorkbookValidationError('Payload must be a JSON object.');
  const v = obj(raw);
  let p: Record<string, unknown> = {};
  let key = '';
  let period = '';
  let project = txt(v.projectId, 160);
  let status = txt(v.status, 80) || 'active';
  switch (type) {
    case 'chart-of-accounts': {
      const code = txt(v.code, 4);
      if (!/^\d{4}$/.test(code) || !txt(v.name, 160)) throw new FinanceWorkbookValidationError('Four-digit account code and account name are required.');
      p = { code, name: txt(v.name,160), accountType: choice(v.accountType,['Asset','Liability','Equity','Revenue','Expense'],'Account type'), normalBalance: choice(v.normalBalance,['Debit','Credit'],'Normal balance'), description: txt(v.description,500), active: v.active !== false };
      key = code; status = p.active ? 'active' : 'inactive'; break;
    }
    case 'cash-bank-opening': {
      const accountCode = choice(v.accountCode,['1000','1100','1200'],'Account code');
      const openingDate = date(v.openingDate,'Opening date');
      p = { accountCode, openingDate, openingBalance: money(v.openingBalance,'Opening balance'), notes: txt(v.notes,500) };
      key = accountCode; period = periodOf(openingDate); status = 'active'; break;
    }
    case 'cash-bank-transaction': {
      const d = date(v.date,'Transaction date');
      const kind = choice(v.transactionKind,['manual','bank-to-petty-cash','petty-cash-to-bank','bank-to-emergency-fund','emergency-fund-to-bank'],'Transaction kind','manual');
      const accountCode = choice(v.accountCode,['1000','1100','1200'],'Account code','1000');
      const counterpart = kind === 'manual' ? '' : choice(v.counterpartAccountCode,['1000','1100','1200'],'Counterpart account');
      if (counterpart && counterpart === accountCode) throw new FinanceWorkbookValidationError('Transfers must use two different accounts.');
      const direction = choice(v.direction,['in','out'],'Direction');
      if (kind !== 'manual') {
        const expected: Record<string,string[]> = {
          'bank-to-petty-cash':['1000','1100','out'], 'petty-cash-to-bank':['1100','1000','out'],
          'bank-to-emergency-fund':['1000','1200','out'], 'emergency-fund-to-bank':['1200','1000','out']
        };
        const rule = expected[kind];
        if (accountCode !== rule[0] || counterpart !== rule[1] || direction !== rule[2]) throw new FinanceWorkbookValidationError('Account and direction do not match the transfer type.');
      }
      const reference = txt(v.reference,160) || uid('CB');
      const description = txt(v.description,300);
      if (!description) throw new FinanceWorkbookValidationError('Transaction description is required.');
      p = { date: d, reference, description, accountCode, counterpartAccountCode: counterpart, transactionKind: kind, direction, amount: money(v.amount,'Amount',false), category: txt(v.category,120)||'Manual movement', projectId: project, notes: txt(v.notes,500) };
      key = kind === 'manual' ? uid('cash') : reference; period = periodOf(d); status = 'posted'; break;
    }
    case 'petty-cash-voucher': {
      const d = date(v.date,'Voucher date');
      const voucherNo = txt(v.voucherNo,100) || uid('PCV');
      const description = txt(v.description,300), custodian = txt(v.custodian,160);
      if (!description || !custodian) throw new FinanceWorkbookValidationError('Voucher description and custodian are required.');
      const direction = choice(v.direction,['in','out'],'Direction');
      const value = money(v.amount,'Voucher amount',false);
      status = choice(v.status,['pending','approved','rejected','posted'],'Voucher status','pending');
      if (!approval && status !== 'pending') throw new FinanceWorkbookValidationError('New vouchers must start as pending approval.');
      if (direction === 'out' && value > 100000 && status === 'posted' && !txt(v.approvedBy,160)) throw new FinanceWorkbookValidationError('Expense above Rp100.000 needs management approval before posting.');
      p = { date:d, voucherNo, description, custodian, direction, amount:value, approvedBy:txt(v.approvedBy,160), approvedAt:txt(v.approvedAt,40), status, notes:txt(v.notes,600), projectId:project };
      key = voucherNo; period = periodOf(d); break;
    }
    case 'vendor-bill': {
      const billNo = txt(v.billNo,100), vendorName = txt(v.vendorName,200);
      if (!billNo || !vendorName) throw new FinanceWorkbookValidationError('Bill number and vendor name are required.');
      const billDate = date(v.billDate,'Bill date'), dueDate = date(v.dueDate,'Due date');
      if (dueDate < billDate) throw new FinanceWorkbookValidationError('Due date cannot precede bill date.');
      const currency = (txt(v.currency,3)||'IDR').toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) throw new FinanceWorkbookValidationError('Currency must be a three-letter ISO currency code.');
      p = { billNo, vendorId:txt(v.vendorId,160), vendorName, projectId:project, projectName:txt(v.projectName,200), billDate, dueDate, currency, total:money(v.total,'Bill amount',false), paymentSchedule:[30,20,50], notes:txt(v.notes,600) };
      key = billNo; period = periodOf(billDate); status = 'open'; break;
    }
    case 'vendor-bill-payment': {
      const billId = txt(v.billId,160), paidDate = date(v.paidDate,'Payment date');
      if (!billId) throw new FinanceWorkbookValidationError('Vendor bill is required.');
      const rawInstallment = txt(v.installmentNumber,60);
      const installmentMatch = rawInstallment.match(/^([123])(?:\s|$)/);
      if (rawInstallment && !/^unassigned\b/i.test(rawInstallment) && !installmentMatch) {
        throw new FinanceWorkbookValidationError('Choose Payment 1 (30%), Payment 2 (20%), Payment 3 (50%), or Unassigned / FIFO.');
      }
      const installmentNumber = installmentMatch ? Number(installmentMatch[1]) : undefined;
      const reference = txt(v.reference,160) || uid('VP');
      p = { billId, ...(installmentNumber ? { installmentNumber } : {}), paidDate, amount:money(v.amount,'Payment amount',false), method:choice(v.method,['bank_transfer','credit_card','cash','other'],'Payment method','bank_transfer'), reference, notes:txt(v.notes,500), projectId:project };
      key = reference; period = periodOf(paidDate); status = 'posted'; break;
    }
    case 'operational-budget': {
      const m = month(v.month), category = txt(v.category,160);
      if (!category) throw new FinanceWorkbookValidationError('Budget category is required.');
      p = { month:m, category, budgetAmount:money(v.budgetAmount,'Budget amount'), pic:txt(v.pic,160), notes:txt(v.notes,500), projectId:project };
      key = m + '|' + keyText(category); period = m; break;
    }
    case 'project-finance': {
      const projectName = txt(v.projectName,200);
      if (!project && !projectName) throw new FinanceWorkbookValidationError('Project ID or project name is required.');
      const startDate = date(v.startDate,'Start date',true), endDate = date(v.endDate,'End date',true);
      if (startDate && endDate && endDate < startDate) throw new FinanceWorkbookValidationError('End date cannot precede start date.');
      p = { projectId:project, projectName, clientName:txt(v.clientName,200), pic:txt(v.pic,160), contractValue:money(v.contractValue,'Contract value'), vendorCommitment:money(v.vendorCommitment,'Vendor commitment'), otherObligations:money(v.otherObligations,'Other obligations'), projectStatus:txt(v.projectStatus,60)||'Active', startDate, endDate, notes:txt(v.notes,600) };
      key = project || keyText(projectName); period = startDate ? periodOf(startDate) : ''; status = String(p.projectStatus); break;
    }
    case 'team-fee': {
      const projectName = txt(v.projectName,200), memberName = txt(v.memberName,160);
      if ((!project && !projectName) || !memberName) throw new FinanceWorkbookValidationError('Project and team member are required.');
      const dueDate = date(v.dueDate,'Due date',true);
      status = choice(v.paymentStatus,['planned','pending','paid'],'Payment status','planned');
      p = { projectId:project, projectName, memberName, role:txt(v.role,120), feeAmount:money(v.feeAmount,'Team fee',false), dueDate, paymentStatus:status, notes:txt(v.notes,500) };
      key = (project || keyText(projectName)) + '|' + keyText(memberName); period = dueDate ? periodOf(dueDate) : ''; break;
    }
    case 'project-allocation': {
      const projectName = txt(v.projectName,200);
      if (!project && !projectName) throw new FinanceWorkbookValidationError('Project is required.');
      const contractValue = money(v.contractValue,'Contract value'), vendorCost = money(v.vendorCost,'Vendor commitment'), otherObligations = money(v.otherObligations,'Other obligations');
      const pettyPct = Number(v.pettyCashPercent ?? 10), emergencyPct = Number(v.emergencyPercent ?? 10), rewardPct = Number(v.teamRewardPercent ?? 10);
      if (![pettyPct,emergencyPct,rewardPct].every(n=>Number.isFinite(n)&&n>=0&&n<=100) || pettyPct+emergencyPct+rewardPct>100) throw new FinanceWorkbookValidationError('Allocation percentages must be between 0 and 100 and cannot total more than 100%.');
      const net = Math.round((contractValue-vendorCost-otherObligations)*100)/100;
      const petty = Math.round(net*pettyPct)/100, emergency = Math.round(net*emergencyPct)/100, reward = Math.round(net*rewardPct)/100;
      const emergencyStatus = choice(v.emergencyStatus,['Reserved','Used','Released','Not allocated'],'Emergency fund status','Reserved');
      p = { projectId:project, projectName, contractValue, vendorCost, otherObligations, netProjectProfit:net, pettyCashPercent:pettyPct, emergencyPercent:emergencyPct, teamRewardPercent:rewardPct, pettyCashReserve:petty, emergencyFund:emergency, teamReward:reward, salesReward:Math.round(net*Math.min(5,rewardPct/2))/100, vendorPicReward:Math.round(net*Math.min(2.5,rewardPct/4))/100, managementReward:Math.round(net*Math.min(2.5,rewardPct/4))/100, teamFeeAmount:money(v.teamFeeAmount,'Team fee total'), companyOperationalFund:Math.round((net-petty-emergency-reward)*100)/100, emergencyStatus, notes:txt(v.notes,600) };
      key = project || keyText(projectName); status = emergencyStatus; break;
    }
    case 'journal-entry': {
      const d = date(v.date,'Journal date'), reference = txt(v.reference,160), description = txt(v.description,300);
      if (!reference || !description) throw new FinanceWorkbookValidationError('Journal reference and description are required.');
      const rawLines = Array.isArray(v.lines) ? v.lines.slice(0,100) : [];
      if (rawLines.length < 2) throw new FinanceWorkbookValidationError('A journal entry requires at least two lines.');
      let debits = 0, credits = 0;
      const lines = rawLines.map((rawLine,index) => {
        const line = obj(rawLine), code = txt(line.accountCode,4);
        if (!/^\d{4}$/.test(code)) throw new FinanceWorkbookValidationError('Journal line ' + (index+1) + ' must use a four-digit account code.');
        const debit = money(line.debit,'Debit'), credit = money(line.credit,'Credit');
        if ((debit>0&&credit>0)||(debit===0&&credit===0)) throw new FinanceWorkbookValidationError('Each journal line needs one positive debit or credit amount.');
        debits += debit; credits += credit;
        return { accountCode:code, accountName:txt(line.accountName,160), debit, credit, notes:txt(line.notes,400) };
      });
      debits = Math.round(debits*100)/100; credits = Math.round(credits*100)/100;
      if (Math.abs(debits-credits)>0.01) throw new FinanceWorkbookValidationError('Journal entry must balance: total debit must equal total credit.');
      status = choice(v.status,['draft','posted'],'Journal status','draft');
      if (status === 'posted' && !approval) throw new FinanceWorkbookValidationError('A journal must be approved before posting.');
      const sourceType = txt(v.sourceType, 40);
      const sourceId = txt(v.sourceId, 160);
      const allowedSourceTypes = ['invoice-payment', 'expense', 'cash-bank-transfer'];
      if ((sourceType && !sourceId) || (!sourceType && sourceId)) {
        throw new FinanceWorkbookValidationError('Journal source type and source ID must be supplied together.');
      }
      if (sourceType && !allowedSourceTypes.includes(sourceType)) {
        throw new FinanceWorkbookValidationError('Journal source type is not supported.');
      }
      p = {
        date:d, reference, description, projectId:project, lines, debitTotal:debits, creditTotal:credits,
        notes:txt(v.notes,600), status,
        ...(sourceType && sourceId ? { sourceType, sourceId } : {})
      };
      key = sourceType && sourceId ? 'source:' + sourceType + ':' + sourceId : reference;
      period = periodOf(d); break;
    }
    case 'monthly-closing': {
      const m = month(v.period), checklistItem = txt(v.checklistItem,200);
      if (!checklistItem) throw new FinanceWorkbookValidationError('Checklist item is required.');
      status = choice(v.status,['Open','In Progress','Done','Blocked'],'Checklist status','Open');
      if (approval && status !== 'Done') throw new FinanceWorkbookValidationError('Approved control must be marked Done.');
      p = { period:m, checklistItem, status, pic:txt(v.pic,160), date:date(v.date,'Checklist date',true), notes:txt(v.notes,500) };
      key = m + '|' + keyText(checklistItem); period = m; break;
    }
    case 'balance-sheet-opening': {
      const code = txt(v.accountCode,4);
      if (!/^\d{4}$/.test(code)) throw new FinanceWorkbookValidationError('Opening balance must use a four-digit account code.');
      const asOfDate = date(v.asOfDate,'Opening balance date');
      p = { accountCode:code, asOfDate, openingAmount:money(v.openingAmount,'Opening amount'), side:choice(v.side,['Debit','Credit'],'Balance side'), notes:txt(v.notes,500) };
      key = asOfDate + '|' + code; period = periodOf(asOfDate); break;
    }
    case 'monthly-closing-lock': {
      const m = month(v.period);
      if (!approval) throw new FinanceWorkbookValidationError('Period locks are only created through the closing workflow.');
      p = { period:m, closedBy:txt(v.closedBy,160), closedAt:txt(v.closedAt,40)||timeNow(), notes:txt(v.notes,500) };
      key = m; period = m; status = 'closed'; break;
    }
    default: throw new FinanceWorkbookValidationError('Unsupported Finance workbook record type.');
  }
  return { payload:p, key, period:period||undefined, project:project||undefined, status };
}

export class PostgresFinanceWorkbookRepository {
  isRecordType(v: unknown): v is FinanceWorkbookRecordType { return FINANCE_WORKBOOK_RECORD_TYPES.includes(String(v) as FinanceWorkbookRecordType); }
  private async ensurePeriodOpen(client: { query: (sql:string, values?:unknown[])=>Promise<any> }, period?: string): Promise<void> {
    if (!period) return;
    const r = await client.query("SELECT id FROM finance_workbook_records WHERE record_type='monthly-closing-lock' AND period_key=$1 AND archived_at IS NULL LIMIT 1",[period]);
    if (r.rows[0]) throw new FinanceWorkbookPeriodClosedError('Finance period ' + period + ' is closed.');
  }
  async list(type: FinanceWorkbookRecordType, filters: { period?:string; projectId?:string; includeArchived?:boolean } = {}): Promise<FinanceWorkbookRecord[]> {
    const where = ['record_type=$1']; const values:unknown[]=[type];
    if (!filters.includeArchived) where.push('archived_at IS NULL');
    if (filters.period) { values.push(filters.period); where.push('period_key=$'+values.length); }
    if (filters.projectId) { values.push(filters.projectId); where.push('project_id=$'+values.length); }
    const result = await getPostgresPool().query<Row>('SELECT * FROM finance_workbook_records WHERE '+where.join(' AND ')+' ORDER BY updated_at DESC, created_at DESC',values);
    const rows = result.rows.map(mapRow);
    if (type==='vendor-bill') {
      const paymentRows = await getPostgresPool().query<Row>("SELECT id,payload FROM finance_workbook_records WHERE record_type='vendor-bill-payment' AND archived_at IS NULL");
      const paymentsByBill = new Map<string, Array<Record<string, any>>>();
      for (const row of paymentRows.rows) {
        const payment = obj(row.payload);
        const billId = String(payment.billId || '');
        if (!billId) continue;
        const items = paymentsByBill.get(billId) || [];
        items.push({ ...payment, id: row.id });
        paymentsByBill.set(billId, items);
      }
      return rows.map(bill => {
        const total = Number(bill.payload.total || 0);
        const billPayments = paymentsByBill.get(bill.id) || [];
        const rawPaid = billPayments.reduce((sum, payment) => sum + Math.max(0, Number(payment.amount) || 0), 0);
        const amountPaid = Math.min(total, rawPaid);
        const due = String(bill.payload.dueDate || '');
        const paymentStatus = amountPaid >= total && total > 0
          ? 'Paid'
          : amountPaid > 0
            ? 'Partially Paid'
            : due < new Date().toISOString().slice(0,10)
              ? 'Overdue'
              : 'Unpaid';
        const schedulePercentages = Array.isArray(bill.payload.paymentSchedule) ? bill.payload.paymentSchedule as number[] : undefined;
        const installments = getVendorBillInstallmentSchedule(
          total,
          billPayments.map((payment) => ({
            id: payment.id,
            amount: payment.amount,
            installmentNumber: payment.installmentNumber,
            paidDate: payment.paidDate
          })),
          schedulePercentages
        );
        const next = installments.find((installment) => installment.outstanding > 0.01);
        return {
          ...bill,
          payload: {
            ...bill.payload,
            paidAmount: amountPaid,
            outstanding: Math.max(0, total - amountPaid),
            paymentStatus,
            installments,
            nextPayment: next ? 'Payment ' + next.number + ' - ' + next.percentage + '%' : 'Complete'
          }
        };
      });
    }
    return rows;
  }
  async get(type: FinanceWorkbookRecordType,id:string):Promise<FinanceWorkbookRecord|null> {
    const result=await getPostgresPool().query<Row>('SELECT * FROM finance_workbook_records WHERE record_type=$1 AND id=$2 AND archived_at IS NULL LIMIT 1',[type,id]);
    return result.rows[0]?mapRow(result.rows[0]):null;
  }
  async create(type:FinanceWorkbookRecordType,raw:unknown,actor:Actor,audit?:AuditEntry,approval=false):Promise<FinanceWorkbookRecord>{
    if(type==='monthly-closing-lock') throw new FinanceWorkbookValidationError('Use the close-period workflow to lock a month.');
    const n=normalise(type,raw,approval);
    const id=type==='chart-of-accounts'?'coa-'+n.key:uid(type.replace(/-/g,''));
    return withPostgresTransaction(async client=>{
      await this.ensurePeriodOpen(client,n.period);
      if(type==='vendor-bill-payment'){
        const bill=await client.query<Row>("SELECT * FROM finance_workbook_records WHERE record_type='vendor-bill' AND id=$1 AND archived_at IS NULL FOR UPDATE",[String(n.payload.billId)]);
        if(!bill.rows[0]) throw new FinanceWorkbookNotFoundError('Vendor bill was not found.');
        const paid=await client.query<Row>("SELECT payload FROM finance_workbook_records WHERE record_type='vendor-bill-payment' AND archived_at IS NULL AND payload->>'billId'=$1",[String(n.payload.billId)]);
        const billPayload = obj(bill.rows[0].payload);
        const currentPaid=paid.rows.reduce((s:number,r:Row)=>s+Number(obj(r.payload).amount||0),0), total=Number(billPayload.total||0);
        const paymentAmount = Number(n.payload.amount)||0;
        if(currentPaid+paymentAmount>total+0.01) throw new FinanceWorkbookConflictError('Vendor bill payments cannot exceed the bill amount.');
        const installmentNumber = Number(n.payload.installmentNumber||0);
        if ([1,2,3].includes(installmentNumber)) {
          const schedule = getVendorBillInstallmentSchedule(
            total,
            paid.rows.map((row:Row) => {
              const payment = obj(row.payload);
              return {
                id: row.id,
                amount: payment.amount,
                installmentNumber: payment.installmentNumber,
                paidDate: payment.paidDate
              };
            }),
            Array.isArray(billPayload.paymentSchedule) ? billPayload.paymentSchedule as number[] : undefined
          );
          const installment = schedule.find((item)=>item.number===installmentNumber);
          if (!installment || paymentAmount>installment.outstanding+0.01) {
            throw new FinanceWorkbookConflictError(
              'Payment exceeds the outstanding amount for Payment ' + installmentNumber +
              '. Remaining installment balance: ' + Number(installment?.outstanding||0).toLocaleString('id-ID') + '.'
            );
          }
        }
      }
      if(type==='journal-entry'||type==='balance-sheet-opening'){
        const acc=await client.query<Row>("SELECT payload FROM finance_workbook_records WHERE record_type='chart-of-accounts' AND status='active' AND archived_at IS NULL");
        const active=new Set(acc.rows.map((r:Row)=>String(obj(r.payload).code||'')));
        const codes=type==='journal-entry' ? (n.payload.lines as Array<Record<string,unknown>>).map((line)=>String(line.accountCode)) : [String(n.payload.accountCode||'')];
        for(const code of codes) if(!active.has(code)) throw new FinanceWorkbookValidationError('Finance record references an account that is not active.');
      }
      const result=await client.query<Row>(
        'INSERT INTO finance_workbook_records (id,record_type,record_key,period_key,project_id,status,payload,version,created_by_user_id,updated_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,1,$8,$8) RETURNING *',
        [id,type,n.key,n.period||null,n.project||null,n.status,JSON.stringify(n.payload),actor.id]
      );
      if(audit) await postgresAuditLogRepository.appendWithinTransaction(client,audit);
      return mapRow(result.rows[0]);
    });
  }
  async update(type:FinanceWorkbookRecordType,id:string,raw:unknown,version:number,actor:Actor,audit?:AuditEntry):Promise<FinanceWorkbookRecord>{
    const current=await this.get(type,id);
    if(!current) throw new FinanceWorkbookNotFoundError('Finance workbook record was not found.');
    if(!Number.isInteger(version)||version!==current.version) throw new FinanceWorkbookConflictError('Record changed since it was loaded. Refresh and retry.');
    if(type==='chart-of-accounts'&&txt(obj(raw).code,4)!==String(current.payload.code)) throw new FinanceWorkbookValidationError('Account codes cannot be changed after creation.');
    if(type==='journal-entry'&&current.status==='posted') throw new FinanceWorkbookConflictError('Posted journal entries cannot be edited.');
    if(type==='monthly-closing-lock') throw new FinanceWorkbookConflictError('Closed periods cannot be edited.');
    const n=normalise(type,raw);
    if(type==='journal-entry'&&n.status==='posted'&&current.status!=='posted') throw new FinanceWorkbookValidationError('Journals must be posted through the approval endpoint.');
    if(type==='petty-cash-voucher'&&n.payload.status!==current.payload.status&&['approved','posted'].includes(String(n.payload.status))) throw new FinanceWorkbookValidationError('Voucher approval must use the management approval endpoint.');
    if(type==='monthly-closing'&&n.payload.status==='Done'&&current.payload.status!=='Done') throw new FinanceWorkbookValidationError('Closing control sign-off must use the approval endpoint.');
    return withPostgresTransaction(async client=>{
      await this.ensurePeriodOpen(client,current.periodKey);
      await this.ensurePeriodOpen(client,n.period);
      if(type==='vendor-bill-payment'){
        const bill=await client.query<Row>("SELECT * FROM finance_workbook_records WHERE record_type='vendor-bill' AND id=$1 AND archived_at IS NULL FOR UPDATE",[String(n.payload.billId)]);
        if(!bill.rows[0]) throw new FinanceWorkbookNotFoundError('Vendor bill was not found.');
        const otherPayments=await client.query<Row>("SELECT id,payload FROM finance_workbook_records WHERE record_type='vendor-bill-payment' AND archived_at IS NULL AND payload->>'billId'=$1 AND id<>$2 FOR UPDATE",[String(n.payload.billId),id]);
        const billPayload=obj(bill.rows[0].payload);
        const priorPaid=otherPayments.rows.reduce((sum:number,row:Row)=>sum+Number(obj(row.payload).amount||0),0);
        const total=Number(billPayload.total||0), paymentAmount=Number(n.payload.amount)||0;
        if(priorPaid+paymentAmount>total+0.01) throw new FinanceWorkbookConflictError('Vendor bill payments cannot exceed the bill amount.');
        const installmentNumber=Number(n.payload.installmentNumber||0);
        if([1,2,3].includes(installmentNumber)){
          const schedule=getVendorBillInstallmentSchedule(
            total,
            otherPayments.rows.map((row:Row) => {
              const payment = obj(row.payload);
              return {
                id: row.id,
                amount: payment.amount,
                installmentNumber: payment.installmentNumber,
                paidDate: payment.paidDate
              };
            }),
            Array.isArray(billPayload.paymentSchedule)?billPayload.paymentSchedule as number[]:undefined
          );
          const installment=schedule.find((item)=>item.number===installmentNumber);
          if(!installment||paymentAmount>installment.outstanding+0.01){
            throw new FinanceWorkbookConflictError('Payment exceeds the outstanding amount for Payment '+installmentNumber+'. Remaining installment balance: '+Number(installment?.outstanding||0).toLocaleString('id-ID')+'.');
          }
        }
      }
      const result=await client.query<Row>(
        'UPDATE finance_workbook_records SET record_key=$3,period_key=$4,project_id=$5,status=$6,payload=$7::jsonb,version=version+1,updated_by_user_id=$8,updated_at=NOW() WHERE record_type=$1 AND id=$2 AND version=$9 AND archived_at IS NULL RETURNING *',
        [type,id,n.key,n.period||null,n.project||null,n.status,JSON.stringify(n.payload),actor.id,version]
      );
      if(!result.rows[0]) throw new FinanceWorkbookConflictError('Record changed. Refresh and retry.');
      if(audit) await postgresAuditLogRepository.appendWithinTransaction(client,audit);
      return mapRow(result.rows[0]);
    });
  }
  async approve(type:FinanceWorkbookRecordType,id:string,actor:Actor,audit?:AuditEntry,notes=''):Promise<FinanceWorkbookRecord>{
    return withPostgresTransaction(async client=>{
      const found=await client.query<Row>('SELECT * FROM finance_workbook_records WHERE record_type=$1 AND id=$2 AND archived_at IS NULL FOR UPDATE',[type,id]);
      if(!found.rows[0]) throw new FinanceWorkbookNotFoundError('Finance workbook record was not found.');
      const current=mapRow(found.rows[0]); await this.ensurePeriodOpen(client,current.periodKey);
      let payload:Record<string,unknown>; let status:string;
      if(type==='petty-cash-voucher'){
        if(current.payload.status!=='pending') throw new FinanceWorkbookConflictError('Only pending petty cash vouchers can be approved.');
        payload={...current.payload,status:'approved',approvedBy:actor.name||actor.username,approvedAt:timeNow(),approvalNotes:txt(notes,500)}; status='approved';
      } else if(type==='journal-entry'){
        if(current.status==='posted') throw new FinanceWorkbookConflictError('Journal is already posted.');
        payload={...current.payload,status:'posted',approvedBy:actor.name||actor.username,postedAt:timeNow(),approvalNotes:txt(notes,500)}; status='posted';
      } else if(type==='monthly-closing'){
        if(current.payload.status==='Done') return current;
        payload={...current.payload,status:'Done',date:String(current.payload.date||new Date().toISOString().slice(0,10)),approvedBy:actor.name||actor.username,approvalNotes:txt(notes,500)}; status='Done';
      } else throw new FinanceWorkbookValidationError('This record type does not support approval.');
      const updated=await client.query<Row>('UPDATE finance_workbook_records SET status=$2,payload=$3::jsonb,version=version+1,updated_by_user_id=$4,updated_at=NOW() WHERE id=$1 AND version=$5 RETURNING *',[id,status,JSON.stringify(payload),actor.id,current.version]);
      if(!updated.rows[0]) throw new FinanceWorkbookConflictError('Record changed during approval.');
      if(audit) await postgresAuditLogRepository.appendWithinTransaction(client,audit);
      return mapRow(updated.rows[0]);
    });
  }
  async postPettyCashVoucher(id:string,actor:Actor,audit?:AuditEntry,notes=''):Promise<FinanceWorkbookRecord>{
    return withPostgresTransaction(async client=>{
      const found=await client.query<Row>("SELECT * FROM finance_workbook_records WHERE record_type='petty-cash-voucher' AND id=$1 AND archived_at IS NULL FOR UPDATE",[id]);
      if(!found.rows[0]) throw new FinanceWorkbookNotFoundError('Petty cash voucher was not found.');
      const current=mapRow(found.rows[0]);
      await this.ensurePeriodOpen(client,current.periodKey);
      if(current.payload.status!=='approved') throw new FinanceWorkbookConflictError('Only an approved petty cash voucher can be posted.');
      const payload={...current.payload,status:'posted',postedBy:actor.name||actor.username,postedAt:timeNow(),postingNotes:txt(notes,500)};
      const updated=await client.query<Row>("UPDATE finance_workbook_records SET status='posted',payload=$2::jsonb,version=version+1,updated_by_user_id=$3,updated_at=NOW() WHERE id=$1 AND version=$4 AND archived_at IS NULL RETURNING *",[id,JSON.stringify(payload),actor.id,current.version]);
      if(!updated.rows[0]) throw new FinanceWorkbookConflictError('Petty cash voucher changed during posting.');
      if(audit) await postgresAuditLogRepository.appendWithinTransaction(client,audit);
      return mapRow(updated.rows[0]);
    });
  }
  async closePeriod(periodValue:string,actor:Actor,audit?:AuditEntry):Promise<FinanceWorkbookRecord>{
    const period=month(periodValue);
    return withPostgresTransaction(async client=>{
      const prior=await client.query<Row>("SELECT id FROM finance_workbook_records WHERE record_type='monthly-closing-lock' AND period_key=$1 AND archived_at IS NULL FOR UPDATE",[period]);
      if(prior.rows[0]) throw new FinanceWorkbookConflictError('Finance period is already closed.');
      const rows=await client.query<Row>("SELECT payload FROM finance_workbook_records WHERE record_type='monthly-closing' AND period_key=$1 AND archived_at IS NULL",[period]);
      const byName=new Map(rows.rows.map((r:Row)=>[keyText(obj(r.payload).checklistItem),obj(r.payload)]));
      const required=['all revenue recorded','all expenses recorded','cash & bank reconciled','receivables reviewed','payables reviewed','project margins reviewed','project allocation reviewed','general journal balanced','balance sheet reviewed','monthly reports approved'];
      const open=required.filter(label=>String(byName.get(label)?.status||'')!=='Done');
      if(open.length) throw new FinanceWorkbookConflictError('Cannot close '+period+'. Complete: '+open.join(', ')+'.');
      const journals=await client.query<Row>("SELECT payload FROM finance_workbook_records WHERE record_type='journal-entry' AND period_key=$1 AND status='posted' AND archived_at IS NULL",[period]);
      for(const row of journals.rows){const p=obj(row.payload);if(Math.abs(Number(p.debitTotal||0)-Number(p.creditTotal||0))>0.01)throw new FinanceWorkbookConflictError('Cannot close the period because a posted journal is unbalanced.');}
      const payload={period,closedBy:actor.name||actor.username,closedAt:timeNow(),notes:''};
      const result=await client.query<Row>("INSERT INTO finance_workbook_records (id,record_type,record_key,period_key,status,payload,version,created_by_user_id,updated_by_user_id) VALUES ($1,'monthly-closing-lock',$2,$2,'closed',$3::jsonb,1,$4,$4) RETURNING *",[uid('periodlock'),period,JSON.stringify(payload),actor.id]);
      if(audit) await postgresAuditLogRepository.appendWithinTransaction(client,audit);
      return mapRow(result.rows[0]);
    });
  }
  async archive(type:FinanceWorkbookRecordType,id:string,version:number,actor:Actor,audit?:AuditEntry):Promise<FinanceWorkbookRecord>{
    return withPostgresTransaction(async client=>{
      const found=await client.query<Row>('SELECT * FROM finance_workbook_records WHERE record_type=$1 AND id=$2 AND archived_at IS NULL FOR UPDATE',[type,id]);
      if(!found.rows[0]) throw new FinanceWorkbookNotFoundError('Finance workbook record was not found.');
      const current=mapRow(found.rows[0]);
      if(current.version!==version) throw new FinanceWorkbookConflictError('Record changed. Refresh and retry.');
      if(['chart-of-accounts','journal-entry','monthly-closing-lock'].includes(type)) throw new FinanceWorkbookConflictError('This record type cannot be deleted; deactivate or use an approved accounting adjustment.');
      if(type==='vendor-bill'){
        const linked=await client.query<Row>("SELECT id FROM finance_workbook_records WHERE record_type='vendor-bill-payment' AND archived_at IS NULL AND payload->>'billId'=$1 LIMIT 1",[id]);
        if(linked.rows[0]) throw new FinanceWorkbookConflictError('A vendor bill with recorded payments cannot be archived. Record an approved adjustment instead.');
      }
      await this.ensurePeriodOpen(client,current.periodKey);
      const result=await client.query<Row>('UPDATE finance_workbook_records SET archived_at=NOW(),version=version+1,updated_by_user_id=$3,updated_at=NOW() WHERE id=$1 AND version=$2 RETURNING *',[id,version,actor.id]);
      if(!result.rows[0]) throw new FinanceWorkbookConflictError('Record changed. Refresh and retry.');
      if(audit) await postgresAuditLogRepository.appendWithinTransaction(client,audit);
      return mapRow(result.rows[0]);
    });
  }
}
export const postgresFinanceWorkbookRepository = new PostgresFinanceWorkbookRepository();
