import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyWorkbookExpense,
  buildFinanceSourceJournalDrafts,
  getVendorBillInstallmentSchedule,
  EXCEL_CHART_OF_ACCOUNTS,
  FINANCE_WORKBOOK_GROUPS,
  getInvoiceCollected,
  getInvoiceOutstanding,
  getMonthKey,
  getYearKey,
  isIssuedInvoice
} from '../src/lib/financeWorkbook.ts';

test('Finance workspace maps exactly twenty unique workbook sheets', () => {
  const tabs = FINANCE_WORKBOOK_GROUPS.flatMap((group) => group.items);
  assert.equal(tabs.length, 20);
  assert.equal(new Set(tabs.map((tab) => tab.sheet)).size, 20);
  assert.deepEqual(tabs.map((tab) => tab.sheet).sort(), Array.from({ length: 20 }, (_, index) => String(index).padStart(2, '0')));
});

test('Finance navigation groups preserve the planned workbook grouping', () => {
  assert.deepEqual(FINANCE_WORKBOOK_GROUPS.map((group) => group.items.length), [2, 4, 3, 4, 7]);
});

test('Chart of Accounts includes operational and settlement accounts needed by source journals', () => {
  assert.equal(EXCEL_CHART_OF_ACCOUNTS.length, 20);
  assert.equal(EXCEL_CHART_OF_ACCOUNTS[0].code, '1000');
  assert.equal(EXCEL_CHART_OF_ACCOUNTS.at(-1)?.code, '5600');
  assert.ok(EXCEL_CHART_OF_ACCOUNTS.every((account) => account.code.length === 4));
  assert.equal(EXCEL_CHART_OF_ACCOUNTS.find((account) => account.code === '1010')?.type, 'Asset');
  assert.equal(EXCEL_CHART_OF_ACCOUNTS.find((account) => account.code === '2100')?.type, 'Liability');
  assert.equal(EXCEL_CHART_OF_ACCOUNTS.find((account) => account.code === '2200')?.type, 'Liability');
});

test('Invoice collections prefer payment-ledger records over the aggregate amount', () => {
  assert.equal(getInvoiceCollected({
    amountPaid: 900,
    payments: [
      { id: 'p1', amount: 250, date: '2026-10-01', method: 'bank_transfer' },
      { id: 'p2', amount: 300, date: '2026-10-02', method: 'bank_transfer' }
    ]
  }), 550);
  assert.equal(getInvoiceCollected({ amountPaid: 400, payments: [] }), 400);
});

test('Outstanding follows the stored invoice balance when present and otherwise derives it', () => {
  assert.equal(getInvoiceOutstanding({ total: 1000, amountPaid: 300, balanceDue: 700 }), 700);
  assert.equal(getInvoiceOutstanding({ total: 1000, amountPaid: 300 }), 700);
});

test('Draft and cancelled invoices are excluded from workbook reporting sources', () => {
  assert.equal(isIssuedInvoice({ status: 'draft' }), false);
  assert.equal(isIssuedInvoice({ status: 'cancelled' }), false);
  assert.equal(isIssuedInvoice({ status: 'sent' }), true);
  assert.equal(isIssuedInvoice({ status: 'paid' }), true);
  assert.equal(isIssuedInvoice({ type: 'quotation', status: 'sent' }), false);
});

test('Expense classification keeps Team Reward and Team Fee separate', () => {
  assert.equal(classifyWorkbookExpense({ category: 'Team Reward - Sales', description: 'Sales reward' }), 'teamReward');
  assert.equal(classifyWorkbookExpense({ category: 'Other', description: 'Project Team Fee' }), 'projectTeamFee');
  assert.equal(classifyWorkbookExpense({ category: 'Salaries & Contractors', description: 'Frontend contractor', projectId: 'project-1' }), 'directProjectCost');
  assert.equal(classifyWorkbookExpense({ category: 'Software & Cloud', description: 'Cloud subscription' }), 'operatingExpense');
  assert.equal(classifyWorkbookExpense({ category: 'Other', description: 'Miscellaneous' }), 'unclassified');
});

test('Reporting period keys accept ISO dates without inventing a missing period', () => {
  assert.equal(getMonthKey('2026-10-13'), '2026-10');
  assert.equal(getYearKey('2026-10-13T10:00:00Z'), '2026');
  assert.equal(getMonthKey('not-a-date'), '');
  assert.equal(getYearKey(undefined), '');
});


test('Source journal bridge generates balanced accrual and settlement drafts with stable provenance', () => {
  const invoice = {
    id: 'invoice-1', invoiceNumber: 'INV-001', type: 'invoice' as const, status: 'sent' as const,
    clientName: 'Client', clientCompany: 'Client Co', clientEmail: 'finance@example.test',
    items: [], subtotal: 1000000, taxPercent: 0, taxAmount: 0, total: 1000000,
    amountPaid: 250000, balanceDue: 750000, currency: 'IDR' as const,
    issueDate: '2026-10-01', dueDate: '2026-10-31',
    payments: [{ id: 'payment-1', amount: 250000, date: '2026-10-04', method: 'bank_transfer' as const, reference: 'RCPT-001' }],
    createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-04T00:00:00Z'
  };
  const expense = {
    id: 'expense-1', category: 'Salaries & Contractors' as const, description: 'Freelancer fee for delivery',
    type: 'OpEx' as const, amount: 100000, date: '2026-10-05', projectId: 'project-1',
    recordedBy: 'Finance', currency: 'IDR', status: 'posted'
  };
  const plan = buildFinanceSourceJournalDrafts(
    [invoice],
    [expense],
    [{
      id: 'transfer-1', status: 'posted',
      payload: {
        transactionKind: 'bank-to-petty-cash', date: '2026-10-06', amount: 50000,
        accountCode: '1000', counterpartAccountCode: '1100', direction: 'out',
        reference: 'TR-001', description: 'Petty cash top up'
      }
    }],
    [{
      id: 'bill-1', recordKey: 'BILL-001', projectId: 'project-1',
      payload: { billNo: 'BILL-001', vendorName: 'Vendor Co', currency: 'IDR', total: 150000, billDate: '2026-10-05', dueDate: '2026-10-31' }
    }],
    [{
      id: 'vendor-payment-1', status: 'posted',
      payload: { billId: 'bill-1', paidDate: '2026-10-07', amount: 50000, method: 'bank_transfer', reference: 'VP-001' }
    }]
  );
  assert.equal(plan.drafts.length, 6);
  const issued = plan.drafts.find((draft) => draft.sourceType === 'invoice-issued');
  assert.ok(issued);
  assert.equal(issued?.lines[0].accountCode, '1300');
  assert.equal(issued?.lines[1].accountCode, '4000');
  assert.equal(issued?.lines[0].debit, issued?.lines[1].credit);
  assert.match(issued?.notes || '', /zero recorded tax/);

  const receipt = plan.drafts.find((draft) => draft.sourceType === 'invoice-payment');
  assert.ok(receipt);
  assert.equal(receipt?.lines[0].accountCode, '1000');
  assert.equal(receipt?.lines[1].accountCode, '1300');
  assert.equal(receipt?.reference, 'RCPT-001');
  assert.equal(receipt?.lines[0].debit, receipt?.lines[1].credit);
  assert.match(receipt?.sourceId || '', /^invoice-1:payment:/);
  assert.match(receipt?.notes || '', /linked invoice-issued journal is posted/);
  assert.equal(receipt?.relatedSourceId, 'invoice-1:issued');

  const mappedExpense = plan.drafts.find((draft) => draft.sourceType === 'expense');
  assert.equal(mappedExpense?.lines[0].accountCode, '5100');
  assert.equal(mappedExpense?.lines[1].accountCode, '2000');
  assert.match(mappedExpense?.notes || '', /credit Accounts Payable/);
  assert.equal(plan.drafts.some((draft) => draft.sourceType === 'expense-payment'), false, 'An expense without a payment row must accrue without inventing a settlement.');

  const transfer = plan.drafts.find((draft) => draft.sourceType === 'cash-bank-transfer');
  assert.equal(transfer?.lines[0].accountCode, '1100');
  assert.equal(transfer?.lines[1].accountCode, '1000');

  const vendorBill = plan.drafts.find((draft) => draft.sourceType === 'vendor-bill-issued');
  assert.ok(vendorBill);
  assert.equal(vendorBill?.lines[0].accountCode, '5100');
  assert.equal(vendorBill?.lines[1].accountCode, '2000');
  assert.equal(vendorBill?.sourceId, 'bill-1');

  const vendorPayment = plan.drafts.find((draft) => draft.sourceType === 'vendor-bill-payment');
  assert.ok(vendorPayment);
  assert.equal(vendorPayment?.lines[0].accountCode, '2000');
  assert.equal(vendorPayment?.lines[1].accountCode, '1000');
  assert.equal(vendorPayment?.relatedSourceId, 'bill-1');
  assert.match(vendorPayment?.notes || '', /linked vendor-bill-issued journal is posted/);
});

test('Source journal bridge skips unsupported sources and handles tax/card entries when mappings exist', () => {
  const unpaid = {
    id: 'unpaid-invoice', invoiceNumber: 'INV-UNPAID', status: 'sent' as const,
    clientName: 'Client', clientCompany: 'Client Co', clientEmail: 'finance@example.test',
    items: [], subtotal: 1000000, taxPercent: 0, taxAmount: 0, total: 1000000,
    amountPaid: 0, balanceDue: 1000000, currency: 'IDR' as const,
    issueDate: '2026-10-01', dueDate: '2026-10-31', payments: [],
    createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z'
  };
  const foreignPaid = {
    ...unpaid, id: 'usd-invoice', invoiceNumber: 'INV-USD', amountPaid: 10, balanceDue: 0,
    currency: 'USD' as const, paidDate: '2026-10-04',
    payments: [{ id: 'usd-payment', amount: 10, date: '2026-10-04', method: 'bank_transfer' as const }]
  };
  const unknownExpense = { id: 'unknown-expense', category: 'Other' as const, description: 'Miscellaneous', amount: 1, date: '2026-10-05', recordedBy: 'Finance', currency: 'IDR' };
  const pettyCashExpense = { id: 'petty-expense', category: 'Other' as const, description: 'Petty cash voucher · supplies', amount: 1, date: '2026-10-05', recordedBy: 'Finance', currency: 'IDR' };
  const vendorLinkedExpense = { id: 'vendor-expense', category: 'Other' as const, description: 'Vendor delivery cost', amount: 100, date: '2026-10-05', recordedBy: 'Finance', currency: 'IDR', vendorContractId: 'contract-1' };
  const plan = buildFinanceSourceJournalDrafts([unpaid, foreignPaid], [unknownExpense, pettyCashExpense, vendorLinkedExpense] as any[], []);
  assert.equal(plan.drafts.length, 1);
  assert.equal(plan.drafts[0].sourceType, 'invoice-issued');
  assert.ok(plan.skipped.some((item) => item.sourceType === 'invoice-payment' && /IDR-only/.test(item.reason)));
  assert.ok(plan.skipped.some((item) => item.sourceType === 'expense' && item.sourceId === 'unknown-expense' && /Expense account mapping/.test(item.reason)));
  assert.ok(plan.skipped.some((item) => item.sourceType === 'expense' && item.sourceId === 'petty-expense' && /petty-cash/i.test(item.reason)));
  assert.ok(plan.skipped.some((item) => item.sourceType === 'expense' && item.sourceId === 'vendor-expense' && /duplicate cost and cash entries/.test(item.reason)));

  const taxable = {
    ...unpaid, id: 'taxable-invoice', invoiceNumber: 'INV-TAX', issueDate: '2026-10-02',
    currency: 'IDR' as const, taxAmount: 110000, amountPaid: 0, balanceDue: 1110000,
    subtotal: 1000000, total: 1110000,
    payments: [{ id: 'tax-payment', amount: 100000, date: '2026-10-03', method: 'bank_transfer' as const, reference: 'TAX-RCPT' }]
  };
  const unsupportedPayment = {
    id: 'vendor-card-payment', status: 'posted',
    payload: { billId: 'bill-card', paidDate: '2026-10-06', amount: 100, method: 'credit_card', reference: 'VP-CARD' }
  };
  const safePlan = buildFinanceSourceJournalDrafts(
    [taxable],
    [],
    [],
    [{ id: 'bill-card', recordKey: 'BILL-CARD', projectId: 'project-card', payload: { billNo: 'BILL-CARD', currency: 'IDR', total: 1000, billDate: '2026-10-05' } }],
    [unsupportedPayment]
  );
  assert.equal(safePlan.drafts.length, 4);
  const taxableJournal = safePlan.drafts.find((item) => item.sourceType === 'invoice-issued');
  assert.ok(taxableJournal);
  assert.deepEqual(taxableJournal?.lines.map((line) => [line.accountCode, line.debit, line.credit]), [['1300', 1110000, 0], ['4000', 0, 1000000], ['2100', 0, 110000]]);
  const taxableReceipt = safePlan.drafts.find((item) => item.sourceType === 'invoice-payment');
  assert.ok(taxableReceipt);
  assert.equal(taxableReceipt?.relatedSourceId, 'taxable-invoice:issued');
  const cardPayment = safePlan.drafts.find((item) => item.sourceType === 'vendor-bill-payment');
  assert.ok(cardPayment);
  assert.deepEqual(cardPayment?.lines.map((line) => [line.accountCode, line.debit, line.credit]), [['2000', 100, 0], ['2200', 0, 100]]);
  assert.equal(safePlan.skipped.length, 0);
});


test('Vendor & Freelancer schedule calculates 30/20/50 amounts and allocates unassigned payments FIFO', () => {
  const schedule = getVendorBillInstallmentSchedule(3500000, [
    { id: 'payment-1', amount: 1050000, paidDate: '2026-10-01' },
    { id: 'payment-2', amount: 200000, installmentNumber: 2, paidDate: '2026-10-05' }
  ]);
  assert.deepEqual(schedule.map((item) => item.amount), [1050000, 700000, 1750000]);
  assert.deepEqual(schedule.map((item) => item.paidAmount), [1050000, 200000, 0]);
  assert.deepEqual(schedule.map((item) => item.outstanding), [0, 500000, 1750000]);
  assert.deepEqual(schedule.map((item) => item.status), ['Paid', 'Partially Paid', 'Unpaid']);
  assert.equal(schedule.reduce((sum, item) => sum + item.amount, 0), 3500000);

  const legacy = getVendorBillInstallmentSchedule(3500000, [{ amount: 1200000 }]);
  assert.deepEqual(legacy.map((item) => item.paidAmount), [1050000, 150000, 0]);
  assert.equal(legacy[1].status, 'Partially Paid');
});

test('Vendor & Freelancer schedule retains overpayment anomalies for review', () => {
  const schedule = getVendorBillInstallmentSchedule(1000, [{ amount: 400, installmentNumber: 1 }]);
  assert.equal(schedule[0].status, 'Overpaid');
  assert.equal(schedule[0].paidAmount, 400);
  assert.equal(schedule[0].outstanding, 0);
});
