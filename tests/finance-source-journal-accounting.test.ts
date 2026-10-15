import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EXCEL_CHART_OF_ACCOUNTS,
  buildFinanceSourceJournalDrafts,
  calculateProjectFinanceWorkbookSummary,
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

test('Project Finance summary mirrors the Excel planned-profit and vendor-payment columns', () => {
  const summary = calculateProjectFinanceWorkbookSummary({
    contractValue: 42_457_500,
    vendorCommitment: 16_000_000,
    otherObligations: 10_000_000,
    bills: [
      { total: 3_500_000, payments: [{ amount: 1_050_000 }] },
      { total: 4_000_000, payments: [{ amount: 1_200_000 }] },
      { total: 3_500_000, payments: [{ amount: 1_050_000 }] },
      { total: 2_500_000, payments: [{ amount: 750_000 }] },
      { total: 2_500_000, payments: [{ amount: 750_000 }] }
    ]
  });

  assert.equal(summary.netProjectProfit, 16_457_500);
  assert.equal(summary.vendorBillTotal, 16_000_000);
  assert.equal(summary.vendorPaid, 4_800_000);
  assert.equal(summary.vendorOutstanding, 11_200_000);
  assert.equal(summary.check, 'OK');
});

test('Project Finance controls flag excess supplier bills and overpayments without changing planned profit', () => {
  const overCommitment = calculateProjectFinanceWorkbookSummary({
    contractValue: 1_000,
    vendorCommitment: 500,
    otherObligations: 100,
    bills: [{ total: 550, payments: [{ amount: 100 }] }]
  });
  assert.equal(overCommitment.netProjectProfit, 400);
  assert.equal(overCommitment.vendorOutstanding, 450);
  assert.equal(overCommitment.check, 'Bills exceed commitment');

  const overpayment = calculateProjectFinanceWorkbookSummary({
    contractValue: 1_000,
    vendorCommitment: 500,
    otherObligations: 100,
    bills: [{ total: 500, payments: [{ amount: 525 }] }]
  });
  assert.equal(overpayment.vendorPaid, 525);
  assert.equal(overpayment.vendorOutstanding, 0);
  assert.equal(overpayment.check, 'Payments exceed bill total');
});

test('Project Finance flags a configured vendor commitment without linked vendor bills', () => {
  const summary = calculateProjectFinanceWorkbookSummary({
    contractValue: 42_457_500,
    vendorCommitment: 16_000_000,
    otherObligations: 10_000_000,
    bills: []
  });
  assert.equal(summary.netProjectProfit, 16_457_500);
  assert.equal(summary.vendorPaid, 0);
  assert.equal(summary.vendorOutstanding, 0);
  assert.equal(summary.check, 'No vendor bills linked');
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

test('invoice Other receipts require an explicit active settlement asset account', () => {
  const invoice = baseInvoice({
    payments: [{
      id: 'other_receipt_001',
      amount: 40,
      date: '2026-10-05',
      method: 'other',
      settlementAccountCode: '1200',
      reference: 'OTHER-RECEIPT-001'
    }]
  });
  const plan = buildFinanceSourceJournalDrafts([invoice], [], [], [], [], EXCEL_CHART_OF_ACCOUNTS);
  const receipt = plan.drafts.find((item) => item.sourceType === 'invoice-payment');
  assert.ok(receipt);
  assert.equal(receipt.lines[0].accountCode, '1200');
  assert.equal(receipt.relatedSourceId, 'inv_001:issued');
  assert.deepEqual(balance(receipt), { debit: 40, credit: 40 });

  const missing = buildFinanceSourceJournalDrafts([baseInvoice({
    payments: [{ id:'other_receipt_missing', amount:40, date:'2026-10-05', method:'other', reference:'OTHER-NO-ACCOUNT' }]
  })], [], [], [], [], EXCEL_CHART_OF_ACCOUNTS);
  assert.equal(missing.drafts.some((item) => item.sourceType === 'invoice-payment'), false);
  assert.ok(missing.skipped.some((item) => item.sourceType === 'invoice-payment' && item.reason.includes('explicit active cash')));
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

test('Other vendor payment methods require and use an explicit settlement account', () => {
  const bill = {
    id: 'bill_other_001',
    recordKey: 'BILL-OTHER-001',
    payload: {
      billNo: 'BILL-OTHER-001',
      vendorName: 'Operations Vendor',
      billDate: '2026-10-08',
      total: 150,
      currency: 'IDR',
      expenseAccountCode: '5600'
    }
  };
  const payment = {
    id: 'bill_payment_other_001',
    status: 'posted',
    payload: {
      billId: 'bill_other_001',
      paidDate: '2026-10-10',
      amount: 150,
      method: 'other',
      settlementAccountCode: '1000',
      reference: 'OTHER-SETTLEMENT-001'
    }
  };
  const plan = buildFinanceSourceJournalDrafts([], [], [], [bill], [payment], EXCEL_CHART_OF_ACCOUNTS);
  const settlement = plan.drafts.find((item) => item.sourceType === 'vendor-bill-payment');
  assert.ok(settlement);
  assert.equal(settlement.relatedSourceId, 'bill_other_001');
  assert.deepEqual(settlement.lines.map((line) => [line.accountCode,line.debit,line.credit]), [['2000',150,0],['1000',0,150]]);
  assert.equal(plan.skipped.length, 0);

  const missingMapping = buildFinanceSourceJournalDrafts([], [], [], [bill], [{
    ...payment,
    payload: { ...payment.payload, settlementAccountCode: undefined }
  }], EXCEL_CHART_OF_ACCOUNTS);
  assert.equal(missingMapping.drafts.some((item) => item.sourceType === 'vendor-bill-payment'), false);
  assert.ok(missingMapping.skipped.some((item) => item.sourceType === 'vendor-bill-payment' && item.reason.includes('actual account')));
});

test('card clearing and credit-card statement payments generate distinct balanced settlement journals', () => {
  const transactions = [
    {
      id: 'card-clear-001',
      status: 'posted',
      payload: {
        transactionKind: 'card-clearing-to-bank',
        accountCode: '1010',
        counterpartAccountCode: '1000',
        direction: 'out',
        date: '2026-10-10',
        amount: 97,
        reference: 'CARD-SETTLE-001',
        description: 'Card processor settlement to bank'
      }
    },
    {
      id: 'card-payable-001',
      status: 'posted',
      payload: {
        transactionKind: 'bank-to-credit-card-payable',
        accountCode: '1000',
        counterpartAccountCode: '2200',
        direction: 'out',
        date: '2026-10-11',
        amount: 250,
        reference: 'CARD-BANK-001',
        description: 'Company credit card statement payment'
      }
    }
  ];
  const plan = buildFinanceSourceJournalDrafts([], [], transactions, [], [], EXCEL_CHART_OF_ACCOUNTS);
  const clearing = plan.drafts.find((item) => item.sourceId === 'card-clear-001');
  const liability = plan.drafts.find((item) => item.sourceId === 'card-payable-001');
  assert.ok(clearing && liability);
  assert.deepEqual(clearing.lines.map((line) => [line.accountCode,line.debit,line.credit]), [['1000',97,0],['1010',0,97]]);
  assert.deepEqual(liability.lines.map((line) => [line.accountCode,line.debit,line.credit]), [['2200',250,0],['1000',0,250]]);
  assert.deepEqual(balance(clearing), { debit: 97, credit: 97 });
  assert.deepEqual(balance(liability), { debit: 250, credit: 250 });
  assert.equal(plan.skipped.length, 0);
});

test('cash and balance-sheet opening balances produce balanced journals through Opening Balance Equity', () => {
  const plan = buildFinanceSourceJournalDrafts(
    [], [], [], [], [], EXCEL_CHART_OF_ACCOUNTS,
    [
      {
        id: 'opening_cash_001',
        recordType: 'cash-bank-opening',
        recordKey: '1000',
        payload: { accountCode: '1000', openingDate: '2026-01-01', openingBalance: 5000 }
      },
      {
        id: 'opening_ar_001',
        recordType: 'balance-sheet-opening',
        recordKey: '2026-01-01|1300',
        payload: { accountCode: '1300', asOfDate: '2026-01-01', openingAmount: 800, side: 'Debit' }
      },
      {
        id: 'opening_ap_001',
        recordType: 'balance-sheet-opening',
        recordKey: '2026-01-01|2000',
        payload: { accountCode: '2000', asOfDate: '2026-01-01', openingAmount: 300, side: 'Credit' }
      }
    ]
  );
  assert.equal(plan.skipped.length, 0);
  assert.equal(plan.drafts.length, 3);
  const cash = plan.drafts.find((item) => item.sourceType === 'cash-bank-opening');
  const receivable = plan.drafts.find((item) => item.sourceId === 'opening_ar_001');
  const payable = plan.drafts.find((item) => item.sourceId === 'opening_ap_001');
  assert.ok(cash && receivable && payable);
  assert.deepEqual(cash.lines.map((line) => [line.accountCode,line.debit,line.credit]), [['1000',5000,0],['3200',0,5000]]);
  assert.deepEqual(receivable.lines.map((line) => [line.accountCode,line.debit,line.credit]), [['1300',800,0],['3200',0,800]]);
  assert.deepEqual(payable.lines.map((line) => [line.accountCode,line.debit,line.credit]), [['3200',300,0],['2000',0,300]]);
  for (const draft of plan.drafts) assert.deepEqual(balance(draft), { debit: draft.lines.reduce((sum,line)=>sum+line.debit,0), credit: draft.lines.reduce((sum,line)=>sum+line.credit,0) });
});

test('opening balance sources reject cash accounts in the generic balance sheet register', () => {
  const plan = buildFinanceSourceJournalDrafts([], [], [], [], [], EXCEL_CHART_OF_ACCOUNTS, [
    {
      id: 'invalid_opening',
      recordType: 'balance-sheet-opening',
      recordKey: '2026-01-01|1000',
      payload: { accountCode: '1000', asOfDate: '2026-01-01', openingAmount: 100, side: 'Debit' }
    }
  ]);
  assert.equal(plan.drafts.length, 0);
  assert.ok(plan.skipped.some((item) => item.reason.includes('Use the Cash & Bank opening register')));
});

test('client payment journal source IDs stay stable when identified payment rows are reordered', () => {
  const payments = [
    { id: 'pay_A', amount: 25, date: '2026-10-05', method: 'bank_transfer', reference: 'BANK-001' },
    { id: 'pay_B', amount: 35, date: '2026-10-06', method: 'credit_card', reference: 'CARD-001' }
  ];
  const getSourceIds = (rows: typeof payments) => {
    const plan = buildFinanceSourceJournalDrafts([baseInvoice({ payments: rows })], [], [], [], [], EXCEL_CHART_OF_ACCOUNTS);
    return new Map(
      plan.drafts
        .filter((item) => item.sourceType === 'invoice-payment')
        .map((item) => [item.reference, item.sourceId])
    );
  };

  assert.deepEqual(
    [...getSourceIds(payments).entries()].sort(),
    [...getSourceIds([...payments].reverse()).entries()].sort()
  );
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
