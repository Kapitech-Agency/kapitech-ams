# AMS E2E and Regression Test Matrix

**Purpose:** Prove user-visible behavior, persisted outcomes, role boundaries, cross-module effects and recovery.  
**Scripts:** Verify package.json. The repository currently defines npm run test, npm run lint and npm run build.  
**Rule:** A route render or successful build is not end-to-end evidence.

## 1. Evidence requirements

Record commit/branch, exact command/scenario, pass/fail, environment/fixtures, skipped tests and reasons, external prerequisites and known gaps. A test file existing does not prove it ran. Production claims need readiness/operational evidence.

## 2. Test layers

1. Unit/domain: calculations, normalization, state guards and matching.
2. API/auth: valid/invalid input, allowed/denied role, record scope and conflicts.
3. Persistence/integrity: relations, uniqueness, migrations, concurrency, audit and idempotency.
4. Interaction: validation, drawers/modals, keyboard, pending/error/success, route state.
5. Cross-module integration: source links to the correct downstream record exactly once.
6. E2E: user journey through persisted final outcome.
7. Visual regression: shell, tabs, tables, overlay, responsive and accessibility.
8. Operations: readiness, backup/restore, migration/recovery, logs and provider sandbox.

## 3. Core workflow matrix

| ID | Journey | Success assertions | Failure/retry assertions |
|---|---|---|---|
| E2E-001 | Inquiry → Inbox → linked legacy record when required | One thread, linked identity, owner and activity, without standalone CRM UI dependency | Duplicate provider event creates no duplicate |
| E2E-002 | Lead → opportunity | Stage guard/history/next action persist | Illegal transition, denial and stale version rejected |
| E2E-003 | Opportunity → quote | Correct template, version, scope, total and links | Retry safe; sent/accepted version immutable |
| E2E-004 | Quote/contract → handover | Commercial evidence and readiness validated | Missing evidence blocks; no duplicate project |
| E2E-005 | Handover → project/tasks | Project, tasks, owners, milestones and schedule saved | Failure cannot leave duplicate/orphan records |
| E2E-006 | Kanban/list | Same task state in all views | Failed drag restores prior server state |
| E2E-007 | Content production | Brief, asset versions, reviews, revisions and publish proof linked | Scheduled is not Published; history retained |
| E2E-008 | Client onboarding/360 | Linked projects, contracts, Inbox and Finance | No duplicate account/contact; private fields restricted |
| E2E-009 | Retainer usage | Eligible logs update usage once | Duplicate/ineligible logs not counted |
| E2E-010 | Leave → capacity | Approved leave affects availability and flags conflict | Rejected/cancelled leave has no approved impact |
| E2E-011 | Vendor bill → AP | Canonical vendor, amount, due date, evidence linked | Duplicate supplier bill flagged for review |
| E2E-012 | Invoice generation | Number/template/source milestone/terms/totals correct | Retry cannot duplicate invoice or number |
| E2E-013 | Partial/full payment | Balance/status follows canonical payment rows | Rejection/duplicate cannot mark paid |
| E2E-014 | Journal posting | Balanced source-linked draft and authorized posting/audit | Duplicate posting, unbalanced lines and prohibited self-approval rejected |
| E2E-015 | Finance reports/month close | Source-backed period values and valid close | Required unresolved items block close under current rules |
| E2E-016 | Bank ingestion/reconciliation | Bank reference links to correct Finance event | Duplicate import cannot double-record; ambiguous match remains pending |
| E2E-017 | Kopra transfer (sandbox only) | Submission/confirmation follow official contract | Timeout remains unknown; no blind retry; item statuses independent |
| E2E-018 | CMS edit/publish | Draft/version/public output agree | Failed publish not marked live; retry-safe |
| E2E-019 | Careers application | Job/applicant status persists; CV access restricted | Applicant is not a sales lead by default |
| E2E-020 | Settings/RBAC | Permitted configuration and audit work | Direct unauthorized route/API blocked |
| E2E-021 | Document upload/version/download | Canonical version served through authenticated flow | Private URL not leaked; invalid file/access denied |
| E2E-022 | Dashboard drill-down | KPI source/period and linked result agree | Missing source shown unavailable, not false zero |

## 4. Finance regression matrix

Use controlled, isolated data; never mutate production to create a regression case.

| ID | Area | Required assertions |
|---|---|---|
| FIN-REG-001 | Worksheet inventory | All 20 current worksheet keys remain reachable in target groups |
| FIN-REG-002 | Invoice totals | Subtotal, discount, tax and total match established calculation |
| FIN-REG-003 | Payments | Payment rows, amount paid, balance and status consistent |
| FIN-REG-004 | AR ageing | Date boundaries, currency and outstanding amount correct |
| FIN-REG-005 | Expenses/AP | Vendor links, bills and payment statuses match source |
| FIN-REG-006 | Cash & Bank | Issued invoice/unconfirmed request does not imply cash movement |
| FIN-REG-007 | Project Finance | Project progress is not treated as financial actual |
| FIN-REG-008 | Allocation/team fee | Current mapping/calculation reconciles |
| FIN-REG-009 | Journal | Balanced, source-linked, maker-checker, idempotent posting |
| FIN-REG-010 | Closing | Current gates/locks/reopen behavior preserved |
| FIN-REG-011 | Reports | Period totals match baseline or approved calculation change |
| FIN-REG-012 | Document templates | Numbering collision-safe; sent/accepted versions retained |
| FIN-REG-013 | Vendor fee schedules | Existing 30/20/50 logic preserved where applicable |
| FIN-REG-014 | Timeout/retry | Partial failure/retry does not duplicate payment/journal |

A Finance result must state baseline dataset, expected/actual amount, tolerance and evidence. Use exact minor-unit equality for same-currency calculations unless an approved accounting rule specifies otherwise.

## 5. UX/UI regression matrix

**Conformance baseline:** target WCAG 2.2 Level AA. Use the normative [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) and the [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) for widget interactions. Automated checks do not replace manual keyboard, focus, zoom/reflow, theme contrast and assistive-technology review.

Canonical responsive widths are 1440, 1280, 1100, 1024, 900, 899, 768, 600, 599, 390 and 320 CSS px. Check widths relevant to every changed component and the breakpoint edges, plus 200% text resize. 320px reflow may allow contained horizontal scrolling for genuinely two-dimensional data tables/boards, but not for the surrounding page.

| ID | Surface | Checks |
|---|---|---|
| UX-REG-001 | Page shell | One owner for outer padding; no compounded gutters |
| UX-REG-002 | Header | Stable title/description/actions; no duplicate header |
| UX-REG-003 | Tabs/routes | Active state, reload/back/forward, no unrelated tabs |
| UX-REG-004 | Spacing | No negative-margin hack, arbitrary token or one-off drawer width |
| UX-REG-005 | Tables | Density, alignment, filters, sorting and pagination |
| UX-REG-006 | Drawer | Shared component, pending/close/focus/scroll/save/error |
| UX-REG-007 | Modal | Shared pattern, clear consequence and keyboard/focus |
| UX-REG-008 | Forms | Visible labels/errors; null/empty/zero handled |
| UX-REG-009 | States | Loading, empty, no results, stale/unavailable, error and denied distinct |
| UX-REG-010 | Responsive | No clipped actions or critical desktop-only control; verify canonical breakpoints, 320px reflow and 200% text resize |
| UX-REG-011 | WCAG 2.2 AA contrast | Text >=4.5:1, large text >=3:1, meaningful non-text controls/data >=3:1 against adjacent colors |
| UX-REG-012 | Keyboard and focus | All actions keyboard-operable; visible focus is not clipped or obscured; modal focus is managed and restored |
| UX-REG-013 | Target size | WCAG 2.2 24x24 CSS px minimum unless exception; AMS target 36px desktop / 40px touch layout |
| UX-REG-014 | Reflow and text resize | No information/function loss at 200% text resize or 320 CSS px width except contained two-dimensional regions where essential |
| UX-REG-015 | Motion and semantics | Reduced motion supported; status not color-only; names/labels and native semantics verified |
| UX-REG-011 | Accessibility | Keyboard, focus, labels, state not color-only |
| UX-REG-012 | Mutation feedback | Success only after persistence; failed optimistic change rolls back |

Use AMS-DESIGN-SYSTEM.md and docs/AMS-UX-INTERACTION-STANDARDS.md as the UI oracle.

## 6. Role/security matrix

For each sensitive operation test menu visibility, direct route, API read/mutation, record scope, sensitive fields/exports, session/MFA/CSRF as relevant, and audit behavior. Current navigation types include Admin, Finance, PM, Creative and Freelancer; verify backend roles before assuming this is exhaustive.

## 7. Bank testing constraints

Only mocks or the bank-approved sandbox may be used in ordinary tests. Never use production banking credentials or live transfers in CI.

Where enabled, test success, rejection, invalid input, beneficiary mismatch, timeout/unknown, retry, duplicate request/callback, partial batch, ambiguous reconciliation, fees/returns, downtime, credential expiry and unauthorized action. A mock response is not evidence of live connection.

## 8. Execution/release

Run current package scripts for tests, lint and build plus focused/integration/E2E/security regression tests. Run authorized production readiness/smoke checks when release status is in scope. Report actual outcomes, skipped tests and reasons; never claim a test passed without observing the result.
