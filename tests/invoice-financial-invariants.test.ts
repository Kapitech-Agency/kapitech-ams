import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(new URL('..', import.meta.url).pathname);

test('invoice financial validation uses cent precision', async () => {
  const source = await fs.readFile(path.join(root, 'server/postgres-invoice-repository.ts'), 'utf8');
  assert.match(source, /Math\.round\(quantity\*unitPrice\*100\)\/100/);
  assert.match(source, /Math\.round\(subtotal\*\(discountPercent\/100\)\*100\)\/100/);
  assert.match(source, /Math\.round\(taxableSubtotal\*\(taxPercent\/100\)\*100\)\/100/);
});

test('PostgreSQL enforces invoice financial invariants at database level', async () => {
  const source = await fs.readFile(path.join(root, 'db/postgres/025_invoice_financial_invariants.sql'), 'utf8');
  assert.match(source, /invoices_amount_paid_not_over_total_v1/);
  assert.match(source, /invoices_balance_matches_total_paid_v1/);
  assert.match(source, /invoices_discount_amount_matches_rate_v1/);
  assert.match(source, /invoices_tax_amount_matches_rate_v1/);
  assert.match(source, /invoices_total_matches_components_v1/);
  assert.match(source, /invoice_items_amount_matches_quantity_price_v1/);
  assert.match(source, /VALIDATE CONSTRAINT invoices_total_matches_components_v1/);
});
