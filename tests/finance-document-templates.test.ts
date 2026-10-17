import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FINANCE_INVOICE_TEMPLATES,
  FINANCE_QUOTATION_TEMPLATES,
  printFinanceDocument,
  type FinancePrintableDocument
} from '../src/lib/financeDocumentTemplates.ts';

test('Finance invoice and quotation template catalogs contain usable scope presets', () => {
  assert.ok(FINANCE_INVOICE_TEMPLATES.some((template) => template.key === 'website-development' && template.lineItems.length > 0));
  assert.ok(FINANCE_INVOICE_TEMPLATES.some((template) => template.key === 'blank' && template.lineItems.length === 0));
  assert.ok(FINANCE_QUOTATION_TEMPLATES.some((template) => template.key === 'video-production' && template.lineItems.length > 0 && (template.validityDays || 0) > 0));

  for (const template of [...FINANCE_INVOICE_TEMPLATES, ...FINANCE_QUOTATION_TEMPLATES]) {
    assert.ok(template.label.trim().length > 0);
    assert.ok(template.lineItems.every((line) => line.description.trim().length > 0 && line.quantity > 0));
  }
});

test('Finance print preview safely escapes user-supplied document fields and does not persist a record', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  let html = '';
  let opened = false;
  let closed = false;
  const fakePrintWindow = {
    document: {
      open: () => {},
      write: (value: string) => { html += value; },
      close: () => { closed = true; }
    },
    focus: () => {}
  };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      open: () => {
        opened = true;
        return fakePrintWindow;
      }
    }
  });

  const documentData: FinancePrintableDocument = {
    kind: 'invoice',
    documentNumber: 'INV-<script>alert("x")</script>',
    title: '<b>Website scope</b>',
    clientName: '<img src=x onerror=alert(1)>',
    clientCompany: 'Kapitech & Partners',
    currency: 'IDR',
    issueDate: '2026-10-17',
    dueDate: '2026-10-31',
    status: 'Draft',
    items: [{ description: '</td><script>alert(1)</script>', quantity: 1, unitPrice: 1200, amount: 1200 }],
    subtotal: 1200,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 0,
    taxAmount: 0,
    total: 1200,
    paymentTerms: '<script>run()</script>',
    notes: 'Reviewed by Kapitech'
  };

  try {
    const printed = printFinanceDocument(documentData);
    assert.equal(printed, true);
    assert.equal(opened, true);
    assert.equal(closed, true);
    assert.ok(html.includes('INV-&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.ok(html.includes('&lt;/td&gt;&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(html.includes('&lt;script&gt;run()&lt;/script&gt;'));
    assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
    assert.ok(!html.includes('</td><script>alert(1)</script>'));
    assert.ok(html.includes('Print / Save as PDF'));
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('Finance print preview fails safely when browser pop-ups are blocked', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { open: () => null }
  });

  try {
    const printed = printFinanceDocument({
      kind: 'quotation',
      documentNumber: 'DRAFT-QTN-TEST',
      clientName: 'Client',
      clientCompany: 'Client Company',
      currency: 'IDR',
      items: [],
      subtotal: 0,
      total: 0
    });
    assert.equal(printed, false);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
