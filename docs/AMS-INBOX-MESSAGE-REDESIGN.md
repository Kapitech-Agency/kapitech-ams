# Inbox Messages UI review — 31 October 2026

Status: local implementation; visual acceptance pending. Baseline: main `4a30bbcb3c23e6e2784499045fa868dffea12e2c`. Requirement: `VIEW-INBOX-MESSAGES`, canonical roadmap Stage 4, bounded to the user's requested Inbox Messages work. No push or deployment is implied.

## View structure contract

Primary task: scan inbound communication, understand a creative/IT request, identify ownership, and find the existing permitted next action.

Before: category/saved navigation → shared filters → separate legacy queue/table/review implementations → detail with brief and notes hidden behind separate tabs, numerous nested cards, and status/priority at the bottom.

After: category/saved navigation → existing shared search/filter/action surface → one compact canonical register and selected-record reader → sender/contact/source → brief → requested services and captured budget/rate → status/priority/owner → internal notes → existing permitted actions. All Messages, Sales Inquiries, Unread and Starred use the same presentation. Review and Table remain alternative presentations, not new records. Sales Inquiries retains its commercial table columns.

Reference decision: adapt the approved Dashboard Overview's calm surfaces, restrained accents, shared action controls and clear hierarchy. Inbox keeps its task-specific 5:7 register/reader and canonical 12px panels; Dashboard's special 16px card geometry, charts and KPI composition are not copied.

| Component | Question and order | Source / controls | States and access | Responsive behavior / evidence |
|---|---|---|---|---|
| Existing module header/navigation/filter surface | Where am I and which messages am I reviewing? First, before records. | Existing `AdminModuleHeader`, `AdminSectionTabs`, `AdminFilterBar`, query normalization, loaded-record search/status/priority/owner/channel filters and reporting-period match. Existing bulk/export/refresh handlers are retained. | Unsupported Client Requests, Project & Support, Resolved and Archived remain unavailable. Careers remains in CMS. | Existing shell owns the gutter. Narrow search flex basis corrected without changing other modules. Navigation tests inspect existing route ownership. |
| `inbox-message-list` / table `inbox-leads-directory` | Which message should I open? Identity/company/date, brief preview, category/status/priority/owner, separate saved control. | Existing `inboxListItems`; no additional fetch, store, ranking, business calculation or persistence. Newest-first source ordering and existing pagination state. | Skeleton, genuine source-empty, filtered-empty, unavailable; parent retains stale/error feedback. Star uses the original permission-gated handler. | Five columns at >=1100px. Narrow screens show list or selected reader. Table scroll is contained and keyboard focusable. Render tests verify source parity, safe escaping and independent selection/star controls. |
| `message-workspace-reader` | What is requested and who owns the next step? Brief precedes scope, triage and notes. | Existing selected `ContactSubmission`, existing note/status/priority/assignee/conversion/deletion/template handlers; existing normalized WhatsApp number and canonical Clients detail query. | Unknown services/budget/source remain explicitly missing. Read-only controls are disabled. Client link/conversion respects existing client permission. Existing confirmation modal handles deletion. No in-app sent/delivered claim. | Seven columns at >=1100px. Natural compact flow, explicit back action, focus moves to reader identity and returns to originating list/table control. |

## Availability and protected boundaries

- Existing and verified at source: submissions read/refresh, inquiry filtering, Unread (`new`), Starred, saved status/priority/owner/notes handlers, existing client conversion and delete confirmation, response-template utility, category routes and reporting-period filtering.
- Presentation changed: register/reader hierarchy, shared detail sections, responsive selection/back flow, keyboard focus, source states, table layout, pagination visibility and shared control styling scope.
- Target-only / unavailable: message history, attachments, SLA, due dates, follow-up records, routing rules, Client Requests/Project & Support category contracts, Resolved and Archived. No fictional data or success states added.
- No backend, API client/contract, DB/schema/migration, auth/session/CSRF/MFA/RBAC policy, finance calculation, integration or production configuration edits. No dependency changes. Synthetic data exists only in isolated render tests and the separately labelled exported preview, never in production components.
- Existing API mutation handlers are retained; this pass adds no business transitions or new endpoints. Draft/refresh concurrency behavior already present in the parent is not claimed to have been redesigned.

## Source and verification

Implementation: `src/pages/admin/AdminInbox.tsx`, `src/components/admin/inbox/MessageWorkspace.tsx`, `MessageWorkspace.css`. `DashboardControls.css` adds Inbox as a consumer of existing control rules while retaining Dashboard selectors and declarations.

Tests: `tests/ams-message-redesign.test.ts` renders the actual component. Existing Inbox/navigation/scroll/workspace source assertions now inspect the extracted component rather than removed JSX. Four pre-existing navigation expectations were corrected to the already implemented Messages landing; the old priority-filter whitespace assertion was corrected to accept its existing formatting. These changes do not weaken permission or unavailable-state assertions.

Baseline comparison: the original four focused suites at unchanged main ran 102 tests: 96 passed, six failed. After the redesign and updated Inbox expectations, the five focused suites ran 108 tests: 107 passed; the remaining failure is the unchanged Documents unavailable-vault source assertion. Final exact command results and browser evidence are recorded in the execution checkpoint.

Preview verification is isolated from production: it renders the actual new component with clearly labelled synthetic examples and read-only mutation controls. Browser evidence covers the register/reader, selection/back focus, search/no-match/reset, Table overflow, light/dark presentation, loading/empty/unavailable states and canonical breakpoint widths. It does not verify an authenticated production screen, real writes, provider delivery, screen-reader behavior, 200% text resize or full WCAG conformance.

Acceptance remaining: review the local preview, then inspect the authenticated Inbox with real data and the full application shell. Preserve this UI-only scope; broader workflow/backend work requires the user's next instruction and the documented Stage 5 acceptance gate.
