import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyWorkbookExpense,
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
