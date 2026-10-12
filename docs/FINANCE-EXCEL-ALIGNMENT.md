# Excel-aligned Finance workflow

## Source of truth and UI constraints

The workbook **Kapitech Finance Final Automated.xlsx** is the business-process reference for AMS Finance. The AMS design system and existing UI implementation remain the visual source of truth. The workspace reuses AdminPageShell, AdminModuleHeader, AdminSectionTabs, AdminPanel, AdminMetricStrip, AdminStatusBadge, the shared Button and Drawer, and the existing color tokens. Do not introduce a new palette or redesign existing Finance screens.

## Navigation map

The Finance workspace provides all twenty workbook sheet destinations in five navigation groups.

| Workbook sheet | AMS view | Current source / implementation status |
|---|---|---|
| 00 Executive Summary | Executive Summary | Live invoice, expense, project and vendor sources |
| 01 Dashboard | Dashboard | Source metrics and period-filtered activity |
| 02 Chart of Accounts | Chart of Accounts | 17 workbook accounts seeded in PostgreSQL; additional accounts can be recorded |
| 03 Revenue | Revenue | Issued client invoices and their payment records |
| 04 Expenses | Expenses | Existing AMS expense register |
| 05 Cash & Bank | Cash & Bank | Opening balance and movement register; includes source-derived collections/expense views, but is not a bank-statement reconciliation |
| 06 Accounts Receivable | Accounts Receivable | Derived from invoice balances |
| 07 Accounts Payable | Accounts Payable | Persisted vendor bills and linked payments; vendor contracts remain a distinct commitment source |
| 08 Project Finance | Project Finance | Persisted contract/commitment setup with linked invoice, collection and expense summaries |
| 09 Operational Budget | Operational Budget | Persisted monthly budget by category/PIC; expense actuals aggregated from the existing expense source |
| 10 Petty Cash | Petty Cash | Persistent vouchers with pending → approved → posted flow and internal cash-transfer linkage |
| 11 Vendor & Freelancer | Vendor & Freelancer | Existing AMS vendor and contract source |
| 12 Monthly P&L | Monthly P&L | Period-filtered preview; full automatic accrual/posting mapping is still incomplete |
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
- The period-close operation requires all ten workbook checklist controls marked Done and checks posted journals for balanced debit/credit totals.
- Vendor bills with recorded payments cannot be archived. Vendor-bill payment totals are constrained to the bill total.
- The supplementary register API is PostgreSQL-only because production AMS uses PostgreSQL as the authoritative store. It deliberately returns an unavailable response rather than silently saving these records into local/browser state.

## Accounting boundary: what is not claimed yet

This work aligns page destinations, persists the missing workbook registers and wires the corresponding create/edit/approval operations. It does not claim a complete general-ledger integration yet.

The next backend step required for full accounting parity is a reviewed posting engine that turns invoice issuance, client receipts, expense recognition, vendor bill approval/payment, petty-cash posting and internal transfers into audited journal entries under the workbook's account rules. At present:
- Cash/bank movement views include source-derived records, but the existing expense model has no verified bank-account/payment-method field and the register is not reconciled to a bank statement.
- Cash and balance-sheet opening balances are separate records. A complete trial balance requires the full transaction posting bridge, verified opening balances and reconciliation.
- Monthly P&L and annual totals are period-filtered previews while the existing expense categories are mapped to the workbook classes; unclassified costs stay visible rather than being silently assigned.
- Project setup records are not an automatic replacement for client contracts, approved vendor bills or linked project-cost source documents. Project IDs need to be linked consistently.
- The vendor payment schedule [30, 20, 50] is recorded as the workbook schedule metadata, while payments are entered against bills; automatic generation of three due instalments is not implemented yet.

Do not remove these caveats until matching integration tests and reconciliation evidence exist.


## Source journal draft generation

The Journal worksheet has a controlled **Generate source drafts** action. It prepares draft-only, balanced two-line entries from dated IDR client receipts, classified expense records and posted internal cash transfers, using the cash-basis examples in the workbook. Each generated entry stores a source type and source ID and is keyed by that provenance, so a repeat sync does not create a second entry for the same source.

Draft generation is not posting. A separate authorized user still needs to review the source evidence and use the existing maker-checker action. Entries remain skipped with a reason when the currency, date, expense classification, petty-cash relationship or cash-account mapping is incomplete. Since the AMS expense source does not always verify that an expense has been paid or identify the actual payment account, a draft without explicit payment status/account metadata is marked for review; 1000 Cash & Bank is only a provisional workbook default.

This bridge is an initial cash-basis workflow, not a complete general ledger or bank reconciliation. Invoice issuance/accrual accounting, tax splitting, vendor bill and payment automation, petty-cash expense account assignment, bank statement matching, opening trial-balance reconciliation, and authoritative Balance Sheet/P&L totals remain outside this implementation.


## Vendor & Freelancer 30% / 20% / 50% schedule

Vendor bills now expose the three worksheet stages as calculated amounts and paid amounts. Payments can be assigned to stage 1 (30%), stage 2 (20%), or stage 3 (50%); legacy payments with no stage remain supported and are allocated FIFO. The backend prevents bill-level overpayment and also prevents a new or edited payment from exceeding its selected stage's remaining balance. The next-payment indicator derives from the first stage with an outstanding amount.

The workbook supplies one due date per bill, not separate milestone dates. AMS therefore retains the bill-level due date and does not fabricate dates for Payment 1, Payment 2, or Payment 3. Stage allocations are derived views of persisted bills and linked payment records, not separate duplicate payable records.


## Monthly Closing control parity

Monthly Closing now uses the workbook's 11 checklist rows and PIC defaults: All revenue recorded (Baim), All expenses recorded (Fikri), Cash & bank reconciled, Receivables reviewed, Payables reviewed, Project margins reviewed, Journal balanced, P&L reviewed, Cash Flow reviewed, Balance Sheet reviewed, and Management approval. The backend close-period guard checks this same set rather than the previous set of 10 substitute controls.

A saved checklist remains an operator sign-off, not reconciliation evidence by itself. In particular, Cash & bank reconciled and Balance Sheet reviewed must not be interpreted as system-verified reconciliation until statement matching and a complete posted ledger exist.


## Source journal mapping correction and vendor payment coverage

Invoice issuance with zero recorded tax now prepares a draft debit to **1300 Accounts Receivable** and credit to **4000 Project Revenue**. A dated client receipt prepares debit to **1000 Cash & Bank** and credit to **1300 Accounts Receivable**, so collection does not recognize the same revenue a second time. These drafts still require Finance review and confirmation that the source invoice was not already recognized. Taxable invoice issuance remains skipped with a reason because the current workbook Chart of Accounts does not include a dedicated tax-liability account; the tax portion is not silently credited to revenue.

The source sync also prepares vendor-payment drafts for IDR vendor bills when the payment method has a supportable workbook account mapping: bank transfer proposes credit to 1000 Cash & Bank, and cash proposes a provisional credit to 1100 Petty Cash Reserve. Credit-card and other methods are held for explicit account mapping. The journal entry debits 2000 Accounts Payable. These are source-linked drafts only; vendor bill expense recognition, bill-to-ledger reconciliation, payment source verification, and independent approval remain required before posting.


## Source refresh and vendor-linked expense safety

Repeated source syncs now refresh an existing journal only when it is still a draft and its normalized lines/source values have changed. Posted journals are never rewritten; unchanged drafts are counted as already present. The source identifier remains stable across amount/date corrections to a payment record, and the unique index on (record_type, record_key) continues to protect concurrent duplicate creation.

Expense rows with vendor or vendor-contract linkage are withheld from the generic expense-to-cash draft lane. This avoids creating both a vendor bill/payment journal and a second expense/cash journal for the same obligation before the AMS source is explicitly matched. Such rows remain visible in the skipped queue and need Finance to reconcile them to a bill or confirm that the expense is a separate obligation.


A sync also detects when a source no longer matches an already posted journal. It reports the conflict without editing the posted record; Finance must reconcile the source and use the approved reversal/adjustment path instead of silently changing a posted period.
