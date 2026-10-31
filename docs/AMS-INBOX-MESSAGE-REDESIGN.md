# Inbox four-category design revision — 31 October 2026

Status: frontend implementation for visual review; user acceptance pending. Baseline: main `5c81dcc209b4ec68fc02fc05c197549b14633d96`. The user rejected the earlier appearance and explicitly requested all four subtab designs, corrected active states, usable controls and a further polish pass. The existing instruction authorizes committing/pushing completed tasks directly to main.

## Current design and flow

- All Messages, Sales Inquiries, Client Requests and Project & Support have independent category routes within Messages. All/Unread/Starred are a secondary group and compose with the category. Legacy unread/starred URLs remain supported. There is no Inbox Overview.
- Follow the approved Dashboard Overview through existing DashboardControl, DashboardFilterGroup, theme tokens and restrained surfaces. Search occupies the main toolbar; detailed status/priority/owner/record-type filters expand on demand, show an active count and support reset. Refresh is explicit; export/bulk actions and unavailable Resolved/Archived entries sit in More using DropdownPortal. Export retains its existing category-wide behavior and explains that scope.
- The shared section/topbar query tabs use Link with an explicit active key. NavLink's pathname matching previously marked multiple same-path query links active. Each navigation group now exposes exactly one current link.
- Review uses a compact register/reader at the canonical 1100px breakpoint and 5:7 proportions. Rows show sender, organization, subject, brief preview, date, status, priority and owner with a separate star control. Detail puts the brief before service/engagement context, triage, internal notes and existing permitted actions. The response footer remains visible while the body scrolls when desktop space permits.
- Table keeps its commercial columns for Sales Inquiries and opens selected detail in the existing Drawer. Table remains the active presentation. Narrow layouts show a single list or reader with an explicit Back action and focus restoration. Header flex sizing is content-based to avoid a 448px empty region on phones.

## Source honesty and protected scope

All Messages and Sales Inquiries retain canonical submission loading, ordering, reporting-period filtering and existing permission-gated handlers. Client Requests and Project & Support still lack canonical category contracts. The user's latest request supersedes their former disabled-tab presentation only: they are navigable for design review, not implemented operational workflows.

`preview=1` is explicitly labelled Design preview. Examples use reserved `example.invalid` recipients and `ams-ui-preview-*` identifiers, never persisted, seeded, merged into loaded records, or passed to mutation handlers. Preview controls for status/priority/owner/star/notes/conversion/deletion/export/bulk/refresh are disabled or guarded. Response templates may be inspected; external send actions are disabled in preview. Leaving preview restores canonical data or honest source-unavailable guidance without fictional counts. The separately exported offline HTML renders the actual AdminInbox and stubs only the read request; it is not an alternate implementation.

No backend, API-client contract, database, migration, auth/session/RBAC policy, Finance calculation, integration, runtime configuration or dependency changes. No SLA, due date, attachment, delivery confirmation, second client/request directory or new business transition.

## Verification and limits

TypeScript, full regression tests and production build are required before push; exact results and current CI evidence belong in the execution checkpoint and final delivery. New actual-component render tests verify four routes, exclusive current links, composed saved/table routes, unavailable-source honesty and preview mutation isolation. Existing source assertions follow the mounted extracted toolbar/reader rather than removed inline JSX; permission and canonical-source checks remain.

Browser review uses actual AdminInbox in an isolated, labelled offline sample harness. Checked all four categories, Review/Table and drawer, priority filtering/reset, More/Escape, mobile detail/back and response-template opening. Width/overflow checks: 320, 599, 600, 768, 899, 900, 1024, 1100, 1280 and 1440 CSS px. No page-wide overflow observed. Desktop/mobile screenshots and a self-contained interactive HTML accompany delivery. This is not authenticated production/full-shell evidence, real mutation verification, provider delivery, screen-reader certification or full WCAG certification. Stage 5 user visual acceptance remains pending; do not begin backend/workflow implementation.

---

The following section is the superseded first-pass historical snapshot. Its unavailable-category and preview-location statements do not describe this revision.

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
