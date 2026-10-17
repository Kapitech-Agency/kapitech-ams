export type FinanceDocumentKind = 'invoice' | 'quotation';

export interface FinanceDocumentTemplate {
  key: string;
  label: string;
  title: string;
  lineItems: Array<{ description: string; quantity: number }>;
  paymentTerms: string;
  validityDays?: number;
}

export interface FinancePrintableLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
}

export interface FinancePrintableDocument {
  kind: FinanceDocumentKind;
  documentNumber: string;
  title?: string;
  clientName: string;
  clientCompany: string;
  clientEmail?: string;
  clientPhone?: string;
  projectName?: string;
  currency: 'IDR' | 'USD';
  issueDate?: string;
  dueDate?: string;
  validUntil?: string;
  status?: string;
  items: FinancePrintableLineItem[];
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  total: number;
  paymentTerms?: string;
  notes?: string;
}

const item = (description: string) => ({ description, quantity: 1 });

export const FINANCE_INVOICE_TEMPLATES: FinanceDocumentTemplate[] = [
  {
    key: 'blank',
    label: 'Blank invoice',
    title: '',
    lineItems: [],
    paymentTerms: ''
  },
  {
    key: 'project-milestone',
    label: 'Project milestone billing',
    title: 'Project Milestone Invoice',
    lineItems: [item('Project milestone payment. Specify milestone and deliverables')],
    paymentTerms: 'Payment due within 14 days of invoice date, unless otherwise agreed in the signed contract.'
  },
  {
    key: 'website-development',
    label: 'Website / IT development',
    title: 'Website / IT Development Invoice',
    lineItems: [
      item('Discovery, requirements, and project planning'),
      item('UX/UI design and prototyping'),
      item('Development and implementation'),
      item('Quality assurance and deployment')
    ],
    paymentTerms: 'Payment follows the agreed milestones and terms in the signed contract.'
  },
  {
    key: 'branding',
    label: 'Branding & design',
    title: 'Branding & Design Invoice',
    lineItems: [
      item('Brand discovery and strategy'),
      item('Visual identity and design development'),
      item('Brand guidelines and final assets')
    ],
    paymentTerms: 'Payment follows the agreed milestones and terms in the signed contract.'
  },
  {
    key: 'creative-production',
    label: 'Video & creative production',
    title: 'Creative Production Invoice',
    lineItems: [
      item('Creative development and pre-production'),
      item('Production'),
      item('Post-production and revisions')
    ],
    paymentTerms: 'Payment follows the agreed production milestones and terms in the signed agreement.'
  },
  {
    key: 'monthly-retainer',
    label: 'Monthly creative / IT retainer',
    title: 'Monthly Retainer Invoice',
    lineItems: [item('Monthly creative and/or IT service retainer. Specify billing period')],
    paymentTerms: 'Monthly billing. Payment due within 14 days of invoice date, unless otherwise agreed in the signed agreement.'
  },
  {
    key: 'maintenance-support',
    label: 'Maintenance & support',
    title: 'Maintenance & Support Invoice',
    lineItems: [item('Maintenance and support service. Specify coverage period')],
    paymentTerms: 'Payment due within 14 days of invoice date, unless otherwise agreed in the signed agreement.'
  },
  {
    key: 'digital-marketing',
    label: 'Digital marketing',
    title: 'Digital Marketing Invoice',
    lineItems: [
      item('Campaign planning and management'),
      item('Creative and content production'),
      item('Reporting and optimization')
    ],
    paymentTerms: 'Service fees and third-party advertising spend must follow the signed agreement.'
  }
];

export const FINANCE_QUOTATION_TEMPLATES: FinanceDocumentTemplate[] = [
  {
    key: 'blank',
    label: 'Blank quotation',
    title: '',
    lineItems: [],
    paymentTerms: 'As agreed in the final service agreement.',
    validityDays: 30
  },
  {
    key: 'website-development',
    label: 'Website / web application',
    title: 'Website / Web Application Proposal',
    lineItems: [
      item('Discovery and requirements'),
      item('Information architecture and UX/UI design'),
      item('Website or application development'),
      item('Quality assurance and launch'),
      item('Handover and documentation')
    ],
    paymentTerms: 'Milestones, delivery schedule, and payment terms to be confirmed in the final contract.',
    validityDays: 30
  },
  {
    key: 'branding',
    label: 'Brand identity & design',
    title: 'Brand Identity & Design Proposal',
    lineItems: [
      item('Brand discovery and strategy'),
      item('Logo and visual identity system'),
      item('Brand collateral and applications'),
      item('Brand guidelines and final assets')
    ],
    paymentTerms: 'Deliverables, revision limits, and payment milestones to be confirmed in the final agreement.',
    validityDays: 30
  },
  {
    key: 'video-production',
    label: 'Video & content production',
    title: 'Video & Content Production Proposal',
    lineItems: [
      item('Creative concept and pre-production'),
      item('Production'),
      item('Editing and post-production'),
      item('Deliverable formats and agreed revisions')
    ],
    paymentTerms: 'Production dates, revision limits, usage rights, and payment milestones to be confirmed in the final agreement.',
    validityDays: 30
  },
  {
    key: 'digital-marketing',
    label: 'Digital marketing & content',
    title: 'Digital Marketing & Content Proposal',
    lineItems: [
      item('Strategy and campaign planning'),
      item('Creative and content production'),
      item('Campaign management and optimization'),
      item('Performance reporting')
    ],
    paymentTerms: 'Service fees and third-party advertising spend are separate unless explicitly included in this quotation.',
    validityDays: 30
  },
  {
    key: 'monthly-retainer',
    label: 'Monthly creative / IT retainer',
    title: 'Monthly Service Retainer Proposal',
    lineItems: [
      item('Monthly service scope and included hours'),
      item('Service coordination and reporting'),
      item('Out-of-scope work and overage terms')
    ],
    paymentTerms: 'Included services, hours, overage rates, service windows, and renewal terms must be confirmed in the signed agreement.',
    validityDays: 30
  },
  {
    key: 'maintenance-support',
    label: 'Website maintenance & IT support',
    title: 'Maintenance & IT Support Proposal',
    lineItems: [
      item('Maintenance coverage and support window'),
      item('Monitoring, updates, and issue handling'),
      item('Reporting and service review')
    ],
    paymentTerms: 'Support scope, service levels, exclusions, and response targets must be confirmed in the signed agreement.',
    validityDays: 30
  }
];

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDocumentMoney = (value: number, currency: 'IDR' | 'USD'): string =>
  new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'IDR' ? 0 : 2
  }).format(Number.isFinite(value) ? value : 0);

const formatDocumentDate = (value?: string): string => {
  if (!value) return '—';
  const date = new Date(value.length === 10 ? value + 'T00:00:00' : value);
  return Number.isNaN(date.getTime())
    ? escapeHtml(value)
    : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

/**
 * Opens a print-ready document using the values already reviewed in the form.
 * The browser print dialog can save the document as PDF. No invoice or
 * quotation record is created by printing; persistence remains handled by AMS.
 */
export function printFinanceDocument(documentData: FinancePrintableDocument): boolean {
  if (typeof window === 'undefined') return false;
  const printWindow = window.open('', '_blank', 'width=980,height=900');
  if (!printWindow) return false;

  const kindLabel = documentData.kind === 'invoice' ? 'INVOICE' : 'QUOTATION';
  const dateLabel = documentData.kind === 'invoice' ? 'Issue date' : 'Prepared on';
  const dateValue = documentData.issueDate || new Date().toISOString().slice(0, 10);
  const dueLabel = documentData.kind === 'invoice' ? 'Due date' : 'Valid until';
  const dueValue = documentData.kind === 'invoice' ? documentData.dueDate : documentData.validUntil;
  const rows = documentData.items.map((line, index) => {
    const quantity = Number.isFinite(Number(line.quantity)) ? Number(line.quantity) : 0;
    const unitPrice = Number.isFinite(Number(line.unitPrice)) ? Number(line.unitPrice) : 0;
    const amount = Number.isFinite(Number(line.amount)) ? Number(line.amount) : quantity * unitPrice;
    return `<tr>
      <td class="center">${index + 1}</td>
      <td>${escapeHtml(line.description)}</td>
      <td class="right">${quantity.toLocaleString('en-US')}</td>
      <td class="right">${escapeHtml(formatDocumentMoney(unitPrice, documentData.currency))}</td>
      <td class="right">${escapeHtml(formatDocumentMoney(amount, documentData.currency))}</td>
    </tr>`;
  }).join('');
  const discountAmount = Number(documentData.discountAmount) || 0;
  const taxAmount = Number(documentData.taxAmount) || 0;
  const total = Number.isFinite(Number(documentData.total)) ? Number(documentData.total) : 0;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(kindLabel)} ${escapeHtml(documentData.documentNumber)}</title>
<style>
  :root{color-scheme:light}
  *{box-sizing:border-box}
  body{margin:0;background:#f3f4f6;color:#18181b;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.5}
  .page{width:210mm;min-height:297mm;margin:18px auto;padding:18mm;background:#fff;box-shadow:0 2px 18px rgba(0,0,0,.08)}
  .top{display:flex;justify-content:space-between;gap:32px;border-bottom:2px solid #dc143c;padding-bottom:22px}
  .brand{display:flex;gap:12px;align-items:flex-start}
  .mark{display:grid;place-items:center;width:42px;height:42px;background:#dc143c;color:#fff;font-weight:800;font-size:20px}
  h1{margin:0;font-size:18px;line-height:1.25}
  .muted{color:#71717a}
  .company-meta{margin-top:5px;font-size:10px;line-height:1.7}
  .doc-type{text-align:right}
  .doc-type h2{margin:0;color:#dc143c;font-size:22px;letter-spacing:.08em}
  .doc-type p{margin:5px 0 0}
  .docno{font-size:13px;font-weight:700;word-break:break-word}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:28px;padding:24px 0}
  .eyebrow{margin:0 0 6px;text-transform:uppercase;letter-spacing:.1em;font-size:9px;font-weight:700;color:#71717a}
  .party-name{font-size:14px;font-weight:700}
  .meta-line{overflow-wrap:anywhere}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{background:#f4f4f5;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
  th,td{padding:10px 9px;border-bottom:1px solid #e4e4e7;vertical-align:top}
  .center{text-align:center}.right{text-align:right;white-space:nowrap}
  .totals-wrap{display:flex;justify-content:flex-end;margin-top:18px}
  .totals{width:280px}
  .total-row{display:flex;justify-content:space-between;gap:16px;padding:5px 0}
  .grand-total{margin-top:6px;padding-top:12px;border-top:2px solid #18181b;font-size:16px;font-weight:800}
  .terms{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:30px;padding-top:18px;border-top:1px solid #e4e4e7}
  .terms p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
  .signature{margin-top:42px;display:flex;justify-content:flex-end}
  .signature-box{width:220px;padding-top:50px;border-bottom:1px solid #a1a1aa;text-align:center}
  footer{margin-top:30px;padding-top:12px;border-top:1px solid #e4e4e7;color:#71717a;font-size:9px}
  @page{size:A4;margin:0}
  @media print{body{background:#fff}.page{width:auto;min-height:0;margin:0;padding:16mm;box-shadow:none}.no-print{display:none!important}}
  @media screen and (max-width:800px){.page{width:100%;margin:0;padding:24px}.top{gap:12px}.parties,.terms{grid-template-columns:1fr}}
</style>
</head>
<body>
<main class="page">
  <header class="top">
    <div class="brand">
      <div class="mark">K</div>
      <div>
        <h1>PT. Kapitech Digital Indonesia</h1>
        <div class="muted">Creative &amp; IT Development Agency</div>
        <div class="company-meta">kapitech.id<br>hello@kapitech.co.id</div>
      </div>
    </div>
    <div class="doc-type">
      <h2>${kindLabel}</h2>
      <p class="docno">${escapeHtml(documentData.documentNumber || 'DRAFT')}</p>
      <p class="muted">${escapeHtml(documentData.status || 'Draft')}</p>
    </div>
  </header>
  <section class="parties">
    <div>
      <p class="eyebrow">Bill to</p>
      <div class="party-name">${escapeHtml(documentData.clientCompany || 'Client company')}</div>
      <div>${escapeHtml(documentData.clientName || '')}</div>
      ${documentData.clientEmail ? `<div class="meta-line">${escapeHtml(documentData.clientEmail)}</div>` : ''}
      ${documentData.clientPhone ? `<div class="meta-line">${escapeHtml(documentData.clientPhone)}</div>` : ''}
      ${documentData.projectName ? `<div class="meta-line muted">Project: ${escapeHtml(documentData.projectName)}</div>` : ''}
    </div>
    <div>
      <p class="eyebrow">Document details</p>
      <div class="meta-line"><strong>${dateLabel}:</strong> ${escapeHtml(formatDocumentDate(dateValue))}</div>
      <div class="meta-line"><strong>${dueLabel}:</strong> ${escapeHtml(formatDocumentDate(dueValue))}</div>
      <div class="meta-line"><strong>Currency:</strong> ${escapeHtml(documentData.currency)}</div>
      ${documentData.title ? `<div class="meta-line"><strong>Subject:</strong> ${escapeHtml(documentData.title)}</div>` : ''}
    </div>
  </section>
  <section>
    <p class="eyebrow">Scope &amp; line items</p>
    <table>
      <thead><tr><th class="center" style="width:34px">No.</th><th>Description</th><th class="right">Qty</th><th class="right">Unit price</th><th class="right">Amount</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">No line items provided.</td></tr>'}</tbody>
    </table>
  </section>
  <div class="totals-wrap">
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><strong>${escapeHtml(formatDocumentMoney(documentData.subtotal, documentData.currency))}</strong></div>
      <div class="total-row"><span>Discount (${Number(documentData.discountPercent) || 0}%)</span><strong>−${escapeHtml(formatDocumentMoney(discountAmount, documentData.currency))}</strong></div>
      <div class="total-row"><span>Tax (${Number(documentData.taxPercent) || 0}%)</span><strong>${escapeHtml(formatDocumentMoney(taxAmount, documentData.currency))}</strong></div>
      <div class="total-row grand-total"><span>Total</span><strong>${escapeHtml(formatDocumentMoney(total, documentData.currency))}</strong></div>
    </div>
  </div>
  <section class="terms">
    <div><p class="eyebrow">Payment terms</p><p>${escapeHtml(documentData.paymentTerms || 'As stated in the signed agreement.')}</p></div>
    <div><p class="eyebrow">Notes</p><p>${escapeHtml(documentData.notes || '—')}</p></div>
  </section>
  ${documentData.kind === 'quotation' ? '<div class="signature"><div class="signature-box">Authorized representative</div></div>' : ''}
  <footer>Prepared by Kapitech Agency through AMS. Please review client details, scope, amount, tax treatment, and contractual terms before external issue.</footer>
  <button class="no-print" onclick="window.print()" style="margin-top:18px;padding:10px 16px;border:0;background:#dc143c;color:#fff;font-weight:700;cursor:pointer">Print / Save as PDF</button>
</main>
<script>window.addEventListener('load',()=>{if(window.opener){setTimeout(()=>window.print(),300)}});</script>
</body>
</html>`;

  try {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    return true;
  } catch {
    printWindow.close();
    return false;
  }
}
