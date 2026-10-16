# Excel-aligned Finance workflow

> **Documentation priority note (16 October 2026):** This document remains the domain reference for the established workbook-aligned Finance process, worksheet/source mapping, journal controls, and known accounting limitations. Its original five-group navigation map is a historical/baseline mapping; the target Finance navigation grouping is now defined by [AMS Master Structure & AI Implementation Guide](AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md). That navigation regrouping does **not** authorize changes to workbook formulas, account mapping, transaction meaning, posting controls, close guards, or historical results. Inspect current source and tests before assuming any implementation state.

## Source of truth and UI constraints

The workbook **Kapitech Finance Final Automated.xlsx** is the business-process reference for AMS Finance. The AMS design system and existing UI implementation remain the visual source of truth. The workspace reuses AdminPageShell, AdminModuleHeader, AdminSectionTabs, AdminPanel, AdminMetricStrip, AdminStatusBadge, the shared Button and Drawer, and the existing color tokens. Do not introduce a new palette or redesign existing Finance screens.

## Navigation map

The Finance workspace provides all twenty workbook sheet destinations in five navigation groups.

| Workbook sheet | AMS view | Current source / implementation status |
|---|---|---|
| 00 Executive Summary | Executive Summary | Live invoice, expense, project and vendor sources |
| 01 Dashboard | Dashboard | Source metrics and period-filtered activity |
| 02 Chart of Accounts | Chart of Accounts | Core workbook accounts seeded in PostgreSQL, including settlement, tax and opening-balance accounts; additional accounts can be recorded |
| 03 Revenue | Revenue | Issued client invoices and their payment records |
| 04 Expenses | Expenses | Existing AMS expense register |
| 05 Cash & Bank | Cash & Bank | Opening balance and movement register with source-derived collection/expense views; manual statement reconciliation is a separate control |
| 06 Accounts Receivable | Accounts Receivable | Derived from invoice balances |
| 07 Accounts Payable | Accounts Payable | Persisted vendor bills and linked payments; vendor contracts remain a distinct commitment source |
| 08 Project Finance | Project Finance | Persisted contract/commitment setup with linked invoice, collection and expense summaries |
| 09 Operational Budget | Operational Budget | Persisted monthly budget by category/PIC; expense actuals aggregated from the existing expense source |
| 10 Petty Cash | Petty Cash | Persistent vouchers with pending → approved → posted flow and internal cash-transfer linkage |
| 11 Vendor & Freelancer | Vendor & Freelancer | Existing AMS vendor and contract source |
| 12 Monthly P&L | Monthly P&L | Source preview plus posted-journal view; totals remain provisional until all sources and opening balances are reconciled |
| 13 Cash Flow | Cash Flow | Period-filtered dated receipts and recorded outflows; not yet a verified bank cash-flow reconciliation |
| 14 Monthly Closing | Monthly Closing | Persistent checklist items, reviewer approval and period lock |
| 15 Project Allocation | Project Allocation | Server-calculated persisted allocations from contract value less vendor commitments and other obligations |
| 16 Team Fee | Team Fee | Persistent project/member/role entitlement register, kept separate from Team Reward |
| 17 Balance Sheet | Balance Sheet | Opening balances and account readiness; totals remain non-authoritative until all transaction sources feed the ledger |
| 18 Journal | Journal | Persistent balanced journal entries with maker-checker posting; existing invoice/expense events are still not automatically posted |
| 19 Annual Summary | Annual Summary | Year-filtered invoice, collection and expense summary |

## Persistence and security

- Existing invoice, payment, expense, project and vendor records remain in the existing AMS services; they are not copied into a second frontend store.
- Supplementary Excel-specific records use PostgreSQL table finance_workbook_records and migration 052_excel_aligned_finance_workbook_records.sql.
- Supplementary API routes require existing Finance permissions. Mutations use version checks and append to the AMS audit log. Period-locked records cannot be changed.
- Petty cash vouchers start pending, require a different authorized user to approve, and then must be explicitly posted before affecting the voucher ledger.
- Journal entries must have at least two debit/credit lines, use active workbook account codes, and balance before save; posting is a separate authorized action. Posted journal entries cannot be edited or archived.
- The period-close operation requires all eleven workbook checklist controls marked Done, validates required cash/bank reconciliation evidence against posted-ledger balances, and checks posted journals for balanced debit/credit totals.
- Vendor bills with recorded payments cannot be archived. Vendor-bill payment totals are constrained to the bill total.
- The supplementary register API is PostgreSQL-only because production AMS uses PostgreSQL as the authoritative store. It deliberately returns an unavailable response rather than silently saving these records into local/browser state.

## Accounting boundary: what is implemented and what remains

Finance now has a source-linked journal-draft bridge with accounting guards. It is not a fully automatic general ledger, and source synchronization never posts a journal without separate authorized review.

- Invoice issue, client receipt, classified expense, eligible expense settlement, eligible vendor bill, eligible vendor payment, opening balance, and supported posted cash/card-transfer sources can generate balanced journal drafts.
- Client receipts clear Accounts Receivable instead of recognizing revenue a second time. Expense and vendor-bill costs are recognized separately from settlement. Vendor-linked expense records are withheld from the generic expense lane to reduce duplicate cost recognition.
- Cash / bank reconciliation records a statement or physical-count balance and reference, and period closing checks required reconciliation evidence against posted-ledger balances. There is no bank-feed connection or automatic statement-line matching.
- Monthly P&L, Cash Flow, Balance Sheet and Annual Summary show source previews and/or posted-journal figures. Treat the overall financial statements as provisional until source exceptions are resolved, opening balances are reconciled, all relevant journals are reviewed and posted, and month-end controls are evidenced.
- Project Finance remains a contract/commitment and project-summary layer. It does not replace signed client contracts, approved supplier documents, source-linked project costs or a reconciled actual project margin.
- The source ledger is IDR-only. Foreign-currency records need a separately documented conversion policy and supported FX accounting before journal generation.
- This audit did not establish a complete, tested source-journal workflow for credit notes/refunds, retainer or deferred revenue, or automated bank-feed matching. Do not treat those as supported end-to-end accounting flows until they have explicit source models and regression tests.

Do not remove these caveats until matching integration tests and reconciliation evidence exist.


## Source journal draft generation

The Journal worksheet has a controlled **Generate source drafts** action. It produces source-linked, balanced draft entries when source data and account mappings are valid:

- Issued IDR invoices debit **1300 Accounts Receivable** for the invoice total and credit **4000 Project Revenue** for the tax-exclusive amount. If tax is recorded, **2100 Tax Payable** receives the tax amount. The tax account must be active.
- Dated client receipts debit the mapped settlement asset, such as **1000 Cash & Bank**, **1010 Card Settlement Clearing**, or **1100 Petty Cash**, and credit **1300 Accounts Receivable**. Posting a receipt requires the matching invoice-recognition journal to be posted first.
- Classifiable expenses debit the mapped expense account and credit **2000 Accounts Payable** on the incurred date. Verified payment rows make separate settlement drafts that debit Accounts Payable and credit the actual supported bank/cash account or **2200 Credit Card Payable**. Incomplete dates, status, or settlement mappings remain in the skipped queue.
- Eligible vendor bills debit their configured active Expense account and credit Accounts Payable. Payments from a posted vendor-payment source debit Accounts Payable and credit the supported settlement account. A payment remains blocked from posting until its linked vendor-bill accrual is posted.
- Supported posted cash/card transfers and validated opening-balance sources can create separate balance-sheet drafts. Opening balances use **3200 Opening Balance Equity** as a temporary offset. Finance must reconcile and clear the offset before treating the Balance Sheet as final.

A generated draft is not a posted transaction. A different authorized user must review the source evidence and complete the existing maker-checker posting action. Each entry retains its source type and source ID; repeat synchronization protects existing drafts and posted journals rather than silently rewriting a posted entry. Invalid or ambiguous source rows remain visible with a reason.

The bridge still requires human review and a complete month-end reconciliation. It does not connect to bank feeds or automatically match statement lines, and it does not make the overall Balance Sheet or P&L authoritative by itself.


## Vendor & Freelancer 30% / 20% / 50% schedule

Vendor bills now expose the three worksheet stages as calculated amounts and paid amounts. Payments can be assigned to stage 1 (30%), stage 2 (20%), or stage 3 (50%); legacy payments with no stage remain supported and are allocated FIFO. The backend prevents bill-level overpayment and also prevents a new or edited payment from exceeding its selected stage's remaining balance. The next-payment indicator derives from the first stage with an outstanding amount.

The bill captures an overall due date and may also store due dates for Payment 1, Payment 2 and Payment 3. If a milestone date is blank, AMS does not invent one. Stage allocations are derived views of persisted bills and linked payment records, not separate duplicate payable records.


## Monthly Closing control parity

Monthly Closing now uses the workbook's 11 checklist rows and PIC defaults: All revenue recorded (Baim), All expenses recorded (Fikri), Cash & bank reconciled, Receivables reviewed, Payables reviewed, Project margins reviewed, Journal balanced, P&L reviewed, Cash Flow reviewed, Balance Sheet reviewed, and Management approval. The backend close-period guard checks this same set rather than the previous set of 10 substitute controls.

A saved checklist remains an operator sign-off, not reconciliation evidence by itself. In particular, Cash & bank reconciled and Balance Sheet reviewed must not be interpreted as system-verified reconciliation until statement matching and a complete posted ledger exist.


## Source journal mapping and vendor payment coverage

Taxable invoice issuance is supported when account **2100 Tax Payable** exists and is active. The draft debits **1300 Accounts Receivable** for the gross invoice total, credits **4000 Project Revenue** for the amount excluding tax, and credits **2100 Tax Payable** for output tax. Invoices with zero tax use a two-line Accounts Receivable / Project Revenue journal. A client receipt debits its verified settlement account and credits Accounts Receivable, so receiving payment does not book revenue a second time.

Vendor bills use their selected active Expense account and credit **2000 Accounts Payable**. For a project-linked legacy bill without an explicit expense account, **5100 Direct Project Cost** is a provisional mapping; an overhead bill requires a configured classification. Posted vendor-payment sources can generate separate drafts: bank transfer credits **1000 Cash & Bank**, cash credits **1100 Petty Cash Reserve**, card payments credit **2200 Credit Card Payable**, and Other requires a supported explicit settlement account. Each draft is source-linked and still requires authorized review and posting.

## Source refresh and vendor-linked expense safety

Repeated source syncs now refresh an existing journal only when it is still a draft and its normalized lines/source values have changed. Posted journals are never rewritten; unchanged drafts are counted as already present. The source identifier remains stable across amount/date corrections to a payment record, and the unique index on (record_type, record_key) continues to protect concurrent duplicate creation.

Expense rows with vendor or vendor-contract linkage are withheld from the generic expense-to-cash draft lane. This avoids creating both a vendor bill/payment journal and a second expense/cash journal for the same obligation before the AMS source is explicitly matched. Such rows remain visible in the skipped queue and need Finance to reconcile them to a bill or confirm that the expense is a separate obligation.


A sync also detects when a source no longer matches an already posted journal. It reports the conflict without editing the posted record; Finance must reconcile the source and use the approved reversal/adjustment path instead of silently changing a posted period.


## Prerequisite posting controls

Source-linked client receipt journals can only be posted after the matching invoice-issued journal is posted. Source-linked vendor payment journals can only be posted after the matching vendor-bill-issued accrual is posted. The prerequisite is verified inside the same PostgreSQL maker-checker transaction; it is not merely a warning in the UI.

The sync only drafts vendor bills with a valid IDR amount/date and an active Expense classification. A project-linked bill can use **5100 Direct Project Cost** as a fallback when the source has a valid project ID; an overhead bill needs its explicit Expense account. Bills without a valid classification stay in the skipped queue, and linked payment drafts remain ineligible until an accrual draft exists. Taxable client invoices are supported through the active **2100 Tax Payable** account; their receipts stay blocked from posting until invoice recognition is posted.
