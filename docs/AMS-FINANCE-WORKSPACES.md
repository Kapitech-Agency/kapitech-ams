# Finance workspace presentation

Updated: 2 November 2026. Scope: frontend presentation and navigation. Dashboard Overview is the approved visual reference. [Finance alignment](FINANCE-EXCEL-ALIGNMENT.md) remains authoritative for financial meaning, sources, posting and closing controls.

## Workspace contract

- Six work areas organize the twenty workbook worksheets and Quotations. Worksheet identifiers, source ownership and deep links are stable. Finance opens Executive Summary. Client Billing opens Quotations, Cash & Spend opens Cash & Reconciliation, Project Finance opens Project Profitability, Books & Close opens Month-End Close, and Financial Reports opens Monthly P&L. The Executive Summary workbench links to these workflows. Contextual links connect related tasks and respect the existing route policy. Query-aware current links use the shared `ams-operational-tabs` context in the real desktop/mobile AdminLayout and worksheet navigation; selected padding is symmetric, with the existing 36px desktop/40px touch targets.
- `AdminPageShell` owns the page gutter and vertical region spacing. `AdminModuleHeader` owns the Finance heading, owning-area eyebrow, active worksheet description and refresh action. Panels use `AdminPanel` with `ams-operational-panel ams-overview-panel`; card actions use `DashboardControl`, with compact card-action geometry. Financial metric cards opt into the shared stacked value/trend layout so a sparkline cannot truncate a financial value; other consumers retain their approved default. Form and confirmation controls retain shared Button and existing submission behavior.
- `AdminFilterToolbar` owns register search and disclosure filters. Search stays visible, Filters starts closed, labels remain visible when expanded, applied count/reset remains available when closed. Counts exclude search and sort. Invoice period and currency are separate neutral `DashboardFilterGroup` contexts; changing invoice period retains its existing status reset. Filter reset never submits a transaction.
- Quotations: status and sort. Invoices/Receivables: invoice status, payment status, due date and sort. Expenses: type, category, period and sort. Contract-linked vendor payments: vendor, payment state and sort. Source-backed worksheet search and PM aggregate search use the same toolbar without an inert Filters button.
- `AdminDataTableShell embedded` contains the register and pagination inside its owning panel. `FinanceRecordSurface` is a presentation bridge over existing native cells and handlers, including conditional invoice columns. At widths below 1100px registers use labelled record cards; desktop retains the native table. Span/unsupported structures fall back to a named keyboard-scrollable native table. Existing grouped Project Finance/payable cards retain their task-specific sections. Formal statements remain tables at every width.
- Empty content uses one compact `DashboardEmptyState` outside tables, with the Overview 16px body inset exactly once. Loaded, empty, filtered-empty, restricted, stale and unavailable sources remain distinct. Do not imply a successful source or a confirmed zero from a failed request.

## Workspace design

Each worksheet opens on its primary task. Multi-part worksheets use the shared Overview filter group to switch working surfaces without resetting the register. Executive Summary separates overdue exceptions, period performance and recent invoices. Client Billing separates the register from pipeline or billing review. Cash and supplier worksheets separate movement, reconciliation, installment, contract and directory work. Project Finance separates the portfolio and linking exceptions, saved allocations and reward policy, and member fees and expense evidence. Month-End Close keeps the period and close action visible while checklist and evidence have their own surfaces. Journal separates source queue, entries and account mapping. Financial Reports separates posted ledger statements from source activity or opening balances. Period controls stay available across report sections.

## Worksheet composition and ownership

| Area | Worksheet | Presentation / existing source |
|---|---|---|
| Finance Overview | Executive Summary | Period context → overdue exceptions → period metrics → figure definitions → recent invoices; existing invoice/expense source |
| Finance Overview | Period Performance | Selected/previous comparison statement → period activity |
| Cash & Spend | Cash & Reconciliation | Movement register → movement metrics → separate statement-reconciliation controls |
| Client Billing | Client Invoices | Existing invoice register, editor and payment inspection → supporting tax/retainer views |
| Cash & Spend | Expenses | Existing expense register and supplier/project links, recorded settlement state |
| Cash & Spend | Petty Cash | Voucher register → canonical Cash & Bank reconciliation handoff → metrics |
| Client Billing | Quotations | Canonical proposal/quotation ledger, existing review/editor/conversion flow |
| Client Billing | Collections & Aging | Outstanding invoice register → source-backed aging, including invalid due-date bucket |
| Cash & Spend | Supplier Bills | Vendor-bill register → linked installment schedule → supporting metrics; contract commitments remain distinct |
| Cash & Spend | Suppliers & Freelancers | Existing canonical vendor/contract source and links; no parallel supplier store |
| Project Finance | Project Profitability | Existing grouped project financial register; PM receives only authorized project aggregates |
| Project Finance | Operational Budget | Existing category/PIC monthly budget and recorded expense actuals |
| Project Finance | Profit Allocation | Existing persisted allocation records and server results |
| Project Finance | Project Team Fees | Existing fee/source records and recorded settlement state |
| Books & Close | Journal & Posting | Existing draft bridge, inspection, maker-checker posting and record controls |
| Books & Close | Chart of Accounts | Existing accounts register and permitted editor |
| Financial Reports | Monthly P&L | Formal statement with existing provisional/posted-source caveats |
| Financial Reports | Cash Flow | Formal statement; source movement remains distinct from bank reconciliation |
| Financial Reports | Balance Sheet | Formal statement with existing reconciliation limitations |
| Books & Close | Month-End Close | Existing month picker, checklist, reviewer and lock controls |
| Financial Reports | Annual Summary | Formal annual statement from existing reporting source |

## Boundaries and evidence

No backend, API, auth/RBAC, persistence, formula, account mapping, source selection, transaction, maker-checker, period lock, idempotency or bank-provider behavior is changed. Existing form handlers, permission conditions and optimistic/version guards remain authoritative. No new bank integration or production financial operation is implied.

Presentation regression coverage exercises native-cell/callback preservation, conditional columns, mobile cards, formal-report/span fallback, named keyboard scroll regions, single empty inset and pagination bounds. Existing financial suites remain required. Visual QA uses actual AdminLayout and source components with isolated adapters outside the repository; QA example records are never shipped in the app. Browser verification does not establish production data reconciliation or replace user visual approval.
