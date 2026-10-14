import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EXCEL_CHART_OF_ACCOUNTS,
  buildFinanceSourceJournalDrafts,
  isIssuedInvoice
} from '../src/lib/financeWorkbook.ts';

const baseInvoice = (overrides: Record<string, unknown> = {}) => ({
  id: 'inv_001',
  invoiceNumber: 'KTA-INV-001',
  type: 'invoice',
  clientName: 'Client',
  clientCompany: 'Client Co',
  clientEmail: 'finance@example.test',
  items: [],
  subtotal: 100,
  discountPercent: 0,
  discountAmount: 0,
  taxPercent: 11,
  taxAmount: 11,
  total: 111,
  currency: 'IDR',
  status: 'sent',
  issueDate: '2026-10-01',
  dueDate: '2026-10-31',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  payments: [],
  ...overrides
}) as any;

const baseExpense = (overrides: Record<string, unknown> = {}) => ({
  id: 'exp_001',
  type: 'OpEx',
  category: 'Software & Cloud',
  description: 'Software subscription',
  amount: 25,
  currency: 'IDR',
  date: '2026-10-02',
  status: 'posted',
  paymentStatus: 'paid',
  paidDate: '2026-10-03',
  paymentMethod: 'bank_transfer',
  paymentAccountCode: '1000',
  ...overrides
}) as any;

const balance = (draft: { lines: Array<{ debit: number; credit: number }> }) => ({
  debit: draft.lines.reduce((sum, line) => sum + line.debit, 0),
  credit: draft.lines.reduce((sum, line) => sum + line.credit, 0)
});

test('taxable invoices split net revenue and output tax into a balanced three-line journal', () => {
  const plan = buildFinanceSourceJournalDrafts([baseInvoice()], [], [], [], [], EXCEL_CHART_OF_ACCOUNTS);
  const draft = plan.drafts.find((item) => item.sourceType === 'invoice-issued');
  assert.ok(draft);
  assert.equal(draft.lines.length, 3);
  assert.deepEqual(draft.lines.map((line) => [line.accountCode, line.debit, line.credit]), [
    ['1300', 111, 0],
    ['4000', 0, 100],
    ['2100', 0, 11]
  ]);
  assert.deepEqual(balance(draft), { debit: 111, credit: 111 });
});

test('receipts cannot be generated when invoice recognition is blocked by an invalid tax setup', () => {
  const accounts = EXCEL_CHART_OF_ACCOUNTS.map((account) => account.code === '2100' ? { ...account, active: false } : account);
  const invoice = baseInvoice({
    payments: [{ id: 'pay_001', amount: 50, date: '2026-10-05', method: 'bank_transfer', reference: 'BANK-001' }]
  });
  const plan = buildFinanceSourceJournalDrafts([invoice], [], [], [], [], accounts);
  assert.equal(plan.drafts.some((item) => item.sourceType === 'invoice-issued'), false);
  assert.equal(plan.drafts.some((item) => item.sourceType === 'invoice-payment'), false);
  assert.ok(plan.skipped.some((item) => item.sourceType === 'invoice-issued' && item.reason.includes('Tax Payable')));
  assert.ok(plan.skipped.some((item) => item.sourceType === 'invoice-payment' && item.reason.includes('invoice recognition')));
});

test('unpaid expenses accrue to Accounts Payable without a cash settlement journal', () => {
  const plan = buildFinanceSourceJournalDrafts([], [baseExpense({ paymentStatus: 'unpaid', paidDate: undefined })], [], [], [], EXCEL_CHART_OF_ACCOUNTS);
  const accrual = plan.drafts.find((item) => item.sourceType === 'expense');
  assert.ok(accrual);
  assert.equal(accrual.date, '2026-10-02');
  assert.deepEqual(accrual.lines.map((line) => [line.accountCode, line.debit, line.credit]), [['5600',25,0],['2000',0,25]]);
  assert.equal(plan.drafts.some((item) => item.sourceType === 'expense-payment'), false);
});

test('paid expenses create an incurred-date accrual and a separate mapped settlement', () => {
  const valid = buildFinanceSourceJournalDrafts([], [baseExpense()], [], [], [], EXCEL_CHART_OF_ACCOUNTS);
  const accrual = valid.drafts.find((item) => item.sourceType === 'expense');
  const payment = valid.drafts.find((item) => item.sourceType === 'expense-payment');
  assert.ok(accrual && payment);
  assert.equal(accrual.date, '2026-10-02');
  assert.deepEqual(accrual.lines.map((line) => [line.accountCode,line.debit,line.credit]), [['5600',25,0],['2000',0,25]]);
  assert.equal(payment.date, '2026-10-03');
  assert.equal(payment.relatedSourceId, 'exp_001');
  assert.deepEqual(payment.lines.map((line) => [line.accountCode,line.debit,line.credit]), [['2000',25,0],['1000',0,25]]);

  const missingAccount = buildFinanceSourceJournalDrafts([], [baseExpense({ paymentAccountCode: undefined })], [], [], [], EXCEL_CHART_OF_ACCOUNTS);
  assert.equal(missingAccount.drafts.some((item) => item.sourceType === 'expense'), true);
  assert.equal(missingAccount.drafts.some((item) => item.sourceType === 'expense-payment'), false);
  assert.ok(missingAccount.skipped.some((item) => item.sourceType === 'expense-payment' && item.reason.includes('Settlement method/account')));
});

test('credit-card settlement clears Accounts Payable to Credit Card Payable', () => {
  const plan = buildFinanceSourceJournalDrafts([], [baseExpense({ paymentMethod: 'credit_card', paymentAccountCode: undefined })], [], [], [], EXCEL_CHART_OF_ACCOUNTS);
  const accrual = plan.drafts.find((item) => item.sourceType === 'expense');
  const payment = plan.drafts.find((item) => item.sourceType === 'expense-payment');
  assert.ok(accrual && payment);
  assert.equal(payment.lines[0].accountCode, '2000');
  assert.equal(payment.lines[1].accountCode, '2200');
  assert.deepEqual(balance(accrual), { debit: 25, credit: 25 });
  assert.deepEqual(balance(payment), { debit: 25, credit: 25 });
});

test('manual cash entries require an existing counterpart account and generate balanced journals', () => {
  const transaction = {
    id: 'cash_001',
    status: 'posted',
    payload: {
      transactionKind: 'manual',
      accountCode: '1000',
      counterpartAccountCode: '4000',
      date: '2026-10-07',
      amount: 200,
      direction: 'in',
      reference: 'ADJ-001',
      description: 'Documented manual receipt'
    }
  };
  const valid = buildFinanceSourceJournalDrafts([], [], [transaction], [], [], EXCEL_CHART_OF_ACCOUNTS);
  const draft = valid.drafts.find((item) => item.sourceType === 'cash-bank-transfer');
  assert.ok(draft);
  assert.deepEqual(draft.lines.map((line) => [line.accountCode, line.debit, line.credit]), [
    ['1000', 200, 0],
    ['4000', 0, 200]
  ]);
  assert.deepEqual(balance(draft), { debit: 200, credit: 200 });

  const invalid = buildFinanceSourceJournalDrafts([], [], [{
    ...transaction,
    payload: { ...transaction.payload, counterpartAccountCode: '9999' }
  }], [], [], EXCEL_CHART_OF_ACCOUNTS);
  assert.equal(invalid.drafts.some((item) => item.sourceType === 'cash-bank-transfer'), false);
  assert.ok(invalid.skipped.some((item) => item.reason.includes('counterpart account')));
});

test('overhead vendor bills use their configured expense account without requiring a project link', () => {
  const bill = {
    id: 'bill_001',
    recordKey: 'BILL-001',
    payload: {
      billNo: 'BILL-001',
      vendorName: 'Cloud Vendor',
      billDate: '2026-10-08',
      total: 500,
      currency: 'IDR',
      expenseAccountCode: '5600'
    }
  };
  const plan = buildFinanceSourceJournalDrafts([], [], [], [bill], [], EXCEL_CHART_OF_ACCOUNTS);
  const draft = plan.drafts.find((item) => item.sourceType === 'vendor-bill-issued');
  assert.ok(draft);
  assert.deepEqual(draft.lines.map((line) => [line.accountCode, line.debit, line.credit]), [
    ['5600', 500, 0],
    ['2000', 0, 500]
  ]);
  assert.deepEqual(balance(draft), { debit: 500, credit: 500 });
});

test('cancelled, voided, and quotation records do not become revenue journals', () => {
  for (const status of ['cancelled', 'voided', 'deleted', 'rejected']) {
    assert.equal(isIssuedInvoice(baseInvoice({ status })), false);
  }
  assert.equal(isIssuedInvoice(baseInvoice({ type: 'quotation' })), false);
  const plan = buildFinanceSourceJournalDrafts([
    baseInvoice({ status: 'cancelled' }),
    baseInvoice({ id: 'inv_quote', type: 'quotation' })
  ], [], [], [], [], EXCEL_CHART_OF_ACCOUNTS);
  assert.equal(plan.drafts.length, 0);
});
