import assert from 'node:assert/strict';
import test from 'node:test';
import { computeFinancialMetrics, getEffectiveInvoiceStatus } from '../src/lib/financeStore.ts';

const invoice = (overrides: Record<string, unknown> = {}) => ({
  id: 'inv-test',
  invoiceNumber: 'TEST-001',
  clientName: 'Test Client',
  clientCompany: 'Test Company',
  clientEmail: 'test@example.com',
  items: [{ id: 'line-1', description: 'Service', quantity: 1, unitPrice: 1_000_000, amount: 1_000_000 }],
  subtotal: 1_000_000,
  taxPercent: 0,
  taxAmount: 0,
  total: 1_000_000,
  amountPaid: 0,
  balanceDue: 1_000_000,
  payments: [],
  currency: 'IDR',
  status: 'overdue',
  issueDate: '2026-09-01',
  dueDate: '2026-09-10',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides
} as any);

test('Outstanding receivables include overdue invoices', () => {
  const metrics = computeFinancialMetrics([invoice()], []);
  assert.equal(metrics.totalOutstanding, 1_000_000);
  assert.equal(metrics.totalOverdue, 1_000_000);
});

test('Partially paid invoices contribute only their remaining balance', () => {
  const metrics = computeFinancialMetrics([
    invoice({
      status: 'partially_paid',
      amountPaid: 400_000,
      balanceDue: 600_000,
      payments: [{
        id: 'pay-1',
        amount: 400_000,
        date: '2026-09-15',
        method: 'bank_transfer'
      }]
    })
  ], []);
  assert.equal(metrics.totalOutstanding, 600_000);
  assert.equal(metrics.totalPaidRevenue, 400_000);
});


test('Draft invoices do not enter billed or receivable totals', () => {
  const metrics = computeFinancialMetrics([
    invoice({
      status: 'draft',
      total: 2_000_000,
      balanceDue: 2_000_000
    })
  ], []);
  assert.equal(metrics.totalBilled, 0);
  assert.equal(metrics.totalOutstanding, 0);
  assert.equal(metrics.totalOverdue, 0);
});

test('Invoice status becomes overdue from due date when balance remains', () => {
  const value = invoice({
    status: 'sent',
    dueDate: '2026-09-10'
  });
  assert.equal(
    getEffectiveInvoiceStatus(value, new Date('2026-10-01T00:00:00')),
    'overdue'
  );
});

test('Operating profit excludes CapEx while cash profit includes it', () => {
  const metrics = computeFinancialMetrics([
    invoice({
      status: 'paid',
      amountPaid: 10_000_000,
      balanceDue: 0,
      payments: [{
        id: 'pay-capex',
        amount: 10_000_000,
        date: '2026-09-15',
        method: 'bank_transfer'
      }]
    })
  ], [
    {
      id: 'opex-1',
      category: 'Software & Cloud',
      description: 'Software',
      amount: 2_000_000,
      date: '2026-09-20',
      type: 'OpEx',
      currency: 'IDR',
      recordedBy: 'test'
    },
    {
      id: 'capex-1',
      category: 'CapEx Equipment',
      description: 'Camera',
      amount: 3_000_000,
      date: '2026-09-21',
      type: 'CapEx',
      currency: 'IDR',
      recordedBy: 'test'
    }
  ] as any);
  assert.equal(metrics.operatingProfit, 8_000_000);
  assert.equal(metrics.cashNetProfit, 5_000_000);
});
