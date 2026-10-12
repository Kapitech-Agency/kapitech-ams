# Excel-aligned Finance workflow

## Source of truth

The workbook Kapitech Finance Final Automated.xlsx is the business-process reference for the AMS Finance module. The AMS design system in AMS-DESIGN-SYSTEM.md remains the UI source of truth. Do not restyle existing components or introduce a second color system.

## Navigation map

The Finance workspace provides all twenty workbook sheet destinations, grouped for navigation:

| Workbook sheet | AMS view | Current source / implementation status |
|---|---|---|
| 00 Executive Summary | Executive Summary | Live invoice, expense, project and vendor source views |
| 01 Dashboard | Dashboard | Live source counts and period-filtered activity |
| 02 Chart of Accounts | Chart of Accounts | 17 account codes mapped from Excel; read-only baseline |
| 03 Revenue | Revenue | Issued invoices and their payment records |
| 04 Expenses | Expenses | Existing AMS expense API, with explicit unmapped category visibility |
| 05 Cash & Bank | Cash & Bank | Derived activity feed; not a reconciled bank ledger |
| 06 Accounts Receivable | Accounts Receivable | Derived from invoice balances |
| 07 Accounts Payable | Accounts Payable | Commitment-reference view; no dedicated vendor-bill ledger yet |
| 08 Project Finance | Project Finance | Project budgets, linked invoices, collections and linked expenses |
| 09 Operational Budget | Operational Budget | Actual expense aggregates; monthly budget/PIC/variance store still needed |
| 10 Petty Cash | Petty Cash | Explicitly identified petty-cash-related expenses only; no voucher ledger yet |
| 11 Vendor & Freelancer | Vendor & Freelancer | Existing vendor and contract source |
| 12 Monthly P&L | Monthly P&L | Period-filtered preview with unclassified expense bucket |
| 13 Cash Flow | Cash Flow | Dated collections and recorded expenses; no opening cash balance |
| 14 Monthly Closing | Monthly Closing | Workbook checklist visible; completion and lock not persisted |
| 15 Project Allocation | Project Allocation | Workbook percentage policy mapped; project-specific posting still requires obligations |
| 16 Team Fee | Team Fee | Explicitly classified expense records; individual entitlement register still needed |
| 17 Balance Sheet | Balance Sheet | Account-readiness view; no authoritative balance totals until ledgers/opening balances exist |
| 18 Journal | Journal | Source activity and posting-map preview; no persistent General Journal endpoint yet |
| 19 Annual Summary | Annual Summary | Year-filtered invoice, collection and expense summary |

## Rules for keeping AMS aligned with Excel

- Each of the twenty sheets has one matching destination in the Finance workspace.
- Invoice and payment data stay sourced from the existing Finance API; expenses, projects and vendors use their existing APIs. Do not duplicate these records into another frontend-only store.
- The Excel Chart of Accounts is a read-only baseline until an account persistence API and migration are implemented.
- A workbook tab must not show an unverified cash balance, AP balance, journal, closing status or Balance Sheet total as authoritative.
- Expense classifications not supported by the current AMS fields must remain visibly unclassified until a reviewed mapping is agreed.
- Keep all styling on shared AMS primitives and tokens in src/components/admin/AdminModulePrimitives.tsx, src/components/ui, and src/index.css.

## Remaining backend work

This first alignment exposes the missing persistence required to make the complete Excel flow transactional rather than read-only: Chart of Accounts CRUD, bank/cash ledgers and opening balances, petty-cash vouchers/approvals, vendor bills and scheduled instalments, monthly operational budgets, member-level Team Fee records, project allocation records, General Journal header/lines and posting rules, plus a period-closing checklist with reviewer/sign-off and locking. These should be introduced in reviewed PostgreSQL migrations and protected Finance API routes; they should not be faked with local storage or dashboard-only numbers.
