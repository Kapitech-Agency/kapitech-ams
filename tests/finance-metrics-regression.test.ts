import assert from 'node:assert/strict';
import test from 'node:test';
import { computeFinancialMetrics } from '../src/lib/financeStore.ts';

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
