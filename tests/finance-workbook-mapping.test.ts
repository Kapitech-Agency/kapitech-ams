import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyWorkbookExpense,
  buildFinanceSourceJournalDrafts,
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
  assert.deepEqual(FINANCE_WORKBOOK_GROUPS.map((group) => group.items.length), [2, 5, 4, 3, 6]);
});

test('Chart of Accounts mirrors the seventeen source workbook accounts', () => {
  assert.equal(EXCEL_CHART_OF_ACCOUNTS.length, 17);
  assert.equal(EXCEL_CHART_OF_ACCOUNTS[0].code, '1000');
  assert.equal(EXCEL_CHART_OF_ACCOUNTS.at(-1)?.code, '5600');
  assert.ok(EXCEL_CHART_OF_ACCOUNTS.every((account) => account.code.length === 4));
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


test('Source journal bridge generates balanced cash-basis drafts with stable provenance', () => {
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
    }]
  );
  assert.equal(plan.drafts.length, 3);
  const receipt = plan.drafts.find((draft) => draft.sourceType === 'invoice-payment');
  assert.ok(receipt);
  assert.equal(receipt?.lines[0].accountCode, '1000');
  assert.equal(receipt?.lines[1].accountCode, '4000');
  assert.equal(receipt?.reference, 'RCPT-001');
  assert.equal(receipt?.lines[0].debit, receipt?.lines[1].credit);
  assert.match(receipt?.sourceId || '', /^invoice-1:payment:/);

  const mappedExpense = plan.drafts.find((draft) => draft.sourceType === 'expense');
  assert.equal(mappedExpense?.lines[0].accountCode, '5100');
  assert.equal(mappedExpense?.lines[1].accountCode, '1000');
  assert.match(mappedExpense?.notes || '', /provisional workbook default/);
  assert.match(mappedExpense?.notes || '', /does not confirm that the expense is paid/);

  const transfer = plan.drafts.find((draft) => draft.sourceType === 'cash-bank-transfer');
  assert.equal(transfer?.lines[0].accountCode, '1100');
  assert.equal(transfer?.lines[1].accountCode, '1000');
});

test('Source journal bridge skips unpaid, foreign-currency, petty-cash duplicate and unmapped expense sources', () => {
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
  const plan = buildFinanceSourceJournalDrafts([unpaid, foreignPaid], [unknownExpense, pettyCashExpense] as any[], []);
  assert.equal(plan.drafts.length, 0);
  assert.ok(plan.skipped.some((item) => item.sourceType === 'invoice-payment' && /IDR-only/.test(item.reason)));
  assert.ok(plan.skipped.some((item) => item.sourceType === 'expense' && item.sourceId === 'unknown-expense' && /No unambiguous/.test(item.reason)));
  assert.ok(plan.skipped.some((item) => item.sourceType === 'expense' && item.sourceId === 'petty-expense' && /petty-cash/i.test(item.reason)));
});
