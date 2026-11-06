# AMS End-to-End UX Audit, Laws, Quality Standards and Acceptance Playbook

> **Canonical UX/UI precedence (6 November 2026):** [AMS UX/UI, Visual Hierarchy and Usability Canonical Standard](AMS-UXUI-VISUAL-HIERARCHY-CANONICAL-STANDARD.md) governs cross-module UX principles, hierarchy, interactions and quality acceptance. This file retains only its documented specialist authority. Where older examples differ, follow the canonical standard without changing the approved business, token, or security owners.


> **Reconciled scope — 5 November 2026:** Dashboard Overview + Analytics and Inbox Messages-first are current presentation decisions. Finance has five canonical master taxonomy areas but six rendered presentation work areas in `AMS-FINANCE-WORKSPACES.md`. This playbook audits the latter without superseding the former, and never changes IDs, source data, route permissions or accounting behavior. Older references in historical specifications are superseded only for these visible UI decisions.


**Status:** Normative UX quality and audit playbook, not an implementation completion certificate  
**Version:** 1.0 | **Date:** 5 November 2026  
**Repository:** `Kapitech-Agency/kapitech-ams` | **Scope:** all nine AMS modules, shared shell, cross-module journeys, mobile, accessibility, recovery, and testing.  
**Approved visual baseline:** Dashboard > Overview, using the existing dark-first Kapitech design system.  
**Change class:** Documentation only. No application, API, database, RBAC, accounting, auth or deployment change is authorized by this document.

## 0. Purpose, authority and evidence

This document provides a testable UX rulebook for designers, developers, auditors, and coding agents. It complements rather than replaces existing authorities:

1. `AGENTS.md` and `docs/README.md`: instructions and conflict resolution.
2. `AMS-DESIGN-SYSTEM.md`: exact color, typography, spacing, breakpoint, component geometry and visual tokens.
3. `docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md` and `docs/architecture/ams-navigation-information-architecture.md`: module ownership, approved navigation and URLs.
4. `docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md` §4.10 and `docs/AMS-MAVEN-INSPIRED-OPERATIONAL-WORKSPACE-IMPLEMENTATION-GUIDE.md`: view order and source-backed contents/actions.
5. `docs/AMS-SHARED-UI-SYSTEM.md` and `docs/AMS-UX-INTERACTION-STANDARDS.md`: existing primitives, layout ownership and implementation contracts.
6. `docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md`, `docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md`: role-aware emphasis, not permission granting.
7. `docs/AMS-FEATURE-CONTENT-GAP-REGISTER.md`, `docs/AMS-EXECUTION-CHECKPOINT.md`: dated implementation evidence and pending issues.
8. Domain constraints including `docs/FINANCE-EXCEL-ALIGNMENT.md`, workflow state machines, security, drawer/modal/kanban guidance.

If this playbook proposes a user-experience improvement not supported by real data or an existing backend, classify it as a **proposal/dependency**, not a shipped capability. The latest explicit user request and production security/data-integrity rules remain controlling.

### Evidence taxonomy

- **V = Verified:** observed on current SHA with repeatable source/test/browser evidence.
- **P = Partially verified:** a subset of routes, roles, devices or states tested.
- **G = Recorded gap:** current repo documents/source identify a missing capability, but refresh evidence before implementation.
- **R = Risk/hypothesis:** likely UX problem needing screenshot/behavioral test.
- **N = Not tested:** insufficient evidence. Never convert N to pass or fail automatically.
- **T = Target state:** desired behavior, not current implementation.

Audit evidence must include timestamp, exact commit SHA, route and query, user role, viewport and zoom, theme, representative data state, actions, expected/actual behavior, screenshots or trace, issue ID and retest result. Use scrubbed/non-sensitive test data. Repository documents alone do not prove authenticated production UX.

### Quality priority

- **P0 critical:** wrong money/status/permissions, destructive data loss, blocked critical workflow, misleading real-world success, inaccessible critical operation. Stop release when confirmed.
- **P1 high:** broken primary journey, confusing ownership/action, severe navigation or mobile obstruction, no recovery from common failure.
- **P2 medium:** inconsistent filter, poor density/legibility, friction, secondary journey deficiencies.
- **P3 low:** optional polish and small visual refinements with no functional impact.

Prioritize by impact × frequency × irreversibility × affected roles, not by cosmetic visibility. Do not invent numerical scores without measured data.

## 1. UX laws and principles translated into AMS rules

“Laws” are design heuristics and empirical tendencies, not statutory obligations or guarantees. Accessibility standards such as WCAG 2.2 are separate, testable normative references.

| Principle | Operational AMS rule | Verification |
|---|---|---|
| User-centered design (ISO 9241-210 approach) | Start from role, actual task, constraints, interview/task evidence and operational frequency; do not begin from decorative cards. | Task map, observation notes, role walkthrough |
| Information architecture | One canonical owner for each entity and workflow, controlled hierarchy: module > workspace > worksheet > record; distinguish navigation, filters, views and actions. | IA inventory, findability test, route ownership |
| Navigation and wayfinding | One active destination per nav group, stable URL/query, back/forward, contextual breadcrumb for deep detail, correct authorized destination. | Direct deep-link and history tests |
| User-flow mapping | Map trigger, input, actor, states, mutation, confirmation, next destination, retry and exit for every core journey. | Flow trace with failure branches |
| Responsive/adaptive layout | Content reflows without clipping, overlap, inaccessible operations or unexplained horizontal page scrolling at canonical design-system breakpoints. | Multi-viewport screenshots and interaction |
| Usability / effectiveness | Critical tasks are discoverable, learnable and completable with clear labels and minimum avoidable steps; never trade task completion for fewer clicks alone. | Task success, errors, time, assistance |
| Affordance/signifiers | Buttons resemble actionable controls; selected, disabled, pending and read-only states visibly differ; icon-only controls have accessible names. | Screenshot + keyboard/action audit |
| Feedback / visibility of system status (Nielsen) | Inform the operator about fetching, processing, saved-but-not-published, successful, failed, uncertain and retry states at the right moment. | State transition test |
| Consistency and standards | Reuse same vocabulary, shared controls, header, filters, actions and panel anatomy across modules. | Shared UI inventory + visual comparison |
| Accessibility (WCAG 2.2 AA target) | Preserve keyboard operation, meaningful structure, labels, contrast, focus, error identification, alternatives, zoom and reduced motion. | Automated checks + manual keyboard/screen-reader |
| Error prevention/recovery | Guard destructive actions, validate inputs at point of entry, keep input on failures, prevent duplicate submit, provide rollback/retry only when safe. | Error-injection tests |
| Touch targets | Follow design-system control geometry; test target size and spacing against WCAG 2.2 SC 2.5.8 minimum 24×24 CSS px or permitted spacing exceptions. Aim for comfortable larger touch areas on handheld screens when practical. | Target overlays at mobile widths |
| Microcopy/content design | Use concrete verbs, exact record/context, precise units/status and next steps. Do not say “Success” when only request submission succeeded. | Content inventory; comprehension tests |
| Usability research/testing | Observe actual agency staff doing representative work. Report success, obstacles, error rate and confidence, not only aesthetic preference. | Moderated or unmoderated task sessions |
| Hick–Hyman law | Reduce unrelated simultaneous choices; group actions by task and use progressive disclosure, but do not hide frequent critical controls. | Decision-time comparison |
| Fitts’s law | Put high-frequency actions within reachable space with adequate target area; avoid tiny clustered icon hit areas. | Pointer/touch completion test |
| Jakob’s law | Prefer familiar admin/table/form patterns unless evidence supports change. | Learnability and familiarity checks |
| Miller’s law | Do not enforce an arbitrary “7 items” limit; chunk related information and expose recognizable group headings to reduce cognitive load. | Scanning/recall sessions |
| Tesler’s law | Keep necessary business complexity where it belongs; do not obscure invoice, approval, or security consequences in a simplistic UI. | Expert role review |
| Doherty threshold | Keep interactions responsive and visibly indicate work during network delays; do not treat a fixed 400ms heuristic as a pass/fail SLA. | Perceived/actual latency traces |
| Progressive disclosure | Default filters collapsed when contract requires, retain active count and reset; reveal advanced controls when relevant. | Filter-open/closed state check |
| Recognition over recall | Surface project/client identity, labels and saved context; avoid requiring operators to memorize IDs or status codes. | Task observation |
| Aesthetic-usability effect | Visual clarity supports perceived usability but never substitutes for working actions or truthful data. | Compare task outcome with visual review |
| Peak-end rule | Make task completion/exception recovery and final confirmation clear, specific and reversible when allowed. | Journey ending check |
| Postel robustness, cautiously | Accept clear valid user input and explain malformed inputs, but never weaken validation or finance/security constraints. | Validation and boundary tests |
| Gestalt proximity/continuity | Group related identity, status, owner, deadline and action; separate independent sections using shared spacing instead of nested decorative borders. | Hierarchy/scan test |

### 1.1 Mandatory user research

Identify personas by **task and authorization** (e.g., executive, project manager, creative contributor, developer, sales, finance, admin, IT), not by invented roles. Record top 5 frequent tasks and top 3 exception tasks per persona, screen access, device conditions, time pressure, handoff needs, source-of-truth boundaries, observed vocabulary and constraints. Validate with users; do not assume a product persona automatically has RBAC permission.

For every proposed feature or redesign record: user job, frequency, evidence source, problem statement, alternative, required data/permissions, success criteria, cost of error, and review owner. Avoid adding a UI control without an actual event and observed outcome.

## 2. Global UX contract: every workspace

### 2.1 Structure and content order

- One canonical `AdminPageShell` and `AdminModuleHeader`; one H1. Do not repeat a header after tabs.
- Header: name, relevant context/description, permitted primary/utility actions. Navigation directly follows per current design system.
- Use one dominant task surface: register, board, editor, reader, report, timeline or operational queue. KPI panels only when decision-critical.
- Within a record co-locate identity, current status, owner, deadline/period, amount/unit where relevant, source/last update and next action.
- Keep secondary diagnostics and explanatory prose subordinate to the main task, without hiding material risk.
- Dashboard Overview defines presentation quality, not a mandate to copy KPI/cards into every domain.
- Only the canonical shell controls outer gutter; each shared panel/form/table controls its own padding. No negative-margin or local `!important` fixes.
- Respect source-specific empty-state inset: use `DashboardEmptyState inset` only if parent is unpadded, never double-inset.
- No arbitrary new color, breakpoints, typography, control sizes, radius, new icon library, duplicated chart package or decorative animations.

### 2.2 Navigation hierarchy and state

- Top-level order: Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, Settings.
- Module, workspace, worksheet, saved filter/view, record detail and action are separate concepts.
- Query-selected tabs must show exactly one current link in each group; refresh and browser history preserve valid state.
- All navigable elements go to an existing authorized outcome. Compatibility redirects remain until consumers are migrated.
- Breadcrumbs only when contextual ancestry helps navigation; do not duplicate module-root labels. Back restores focus and prior scoped work when possible.
- Mobile may collapse navigation but may not remove essential capabilities or hide current location without a replacement signal.
- Keyboard navigation includes skip-to-content (where supported), logical heading order, visible focus and Escape/back behavior.

### 2.3 Search, filters, sort and pagination

- Search always available on searchable registers. Source-specific fields use `AdminFilterToolbar`/`AdminFilterField`, with initially collapsed fields, active-filter count, visible reset and retained filter state when collapsed.
- Filters must clearly state scope (all vs current category/project/client), apply to actual loaded/source-backed records and synchronize with pagination totals.
- Search, field filters, period, sort, saved view and column presentation must never masquerade as each other.
- Reset only clears documented controls. Changing scope invalidates selected items that belong to prior scope, without silently substituting another entity.
- Sort headers expose direction and stable behavior. Pagination never leaves user stranded on an out-of-range page after filtering.
- Keep applied filters visible or discoverable on mobile. Clear empty filtered results with useful reset, not a generic “no records”.
- Export text identifies actual export scope and must not silently export a different dataset.

### 2.4 Buttons, menus and actions

- Primary action matches current user job, is not duplicated across surrounding regions and does not overpower secondary controls.
- Buttons have verbs and precise targets: “Create invoice”, “Assign owner”, “Save draft”. Avoid generic “Proceed” or “Manage” when consequence is specific.
- A visible enabled control performs its labelled action. No inert buttons, demo-only mutations or confirmation before persistence.
- Explicit disabled/pending states and causes; no duplicate submit during pending.
- Destructive actions identify record, consequence and recovery (if any), using current confirmation components and verified permissions.
- Hover is a supplement, never the sole disclosure of essential controls. Touch and keyboard affordances must remain clear.
- Icon-only actions have accessible name, tooltip when helpful and adequate target size.

### 2.5 Form and overlay contract

- Use existing Drawer for long create/edit/detail, existing Modal/ConfirmDialog for short confirmation; no parallel overlay roots.
- Field order follows user decision process, label always visible and programmatically bound; help text and errors use input associations.
- Distinguish required from optional. Validate before submission when safe, server errors after return, and preserve entered values after failure.
- Keyboard Tab order logical; initial focus appropriate; Escape behavior controlled; return focus to invoking control; prevent unsafe dismiss during saves.
- Sticky footer must not overlap fields/keyboard or hide submit; drawer inner scroll must not create page-level double scroll.
- Display the actual saved record or explicit refresh uncertainty on completion, not fake toast success.
- Unsaved-change safeguards when leaving editor, tab, detail or page where data loss could occur.

### 2.6 States matrix — never conflate

| State | Required content and control |
|---|---|
| Initial loading | Layout-fitting skeleton/status and accessible busy semantics, no fake KPI zero |
| Refreshing | Retain prior valid content when allowed; mark stale/refreshing clearly |
| Valid empty | Explain no records exist; show permitted creation/navigation CTA |
| Filtered empty | Explain no match under current filters; offer Reset filters |
| Unselected | Prompt user to select a real record, no redundant blank reader |
| Unavailable source | Say source/feature unavailable, do not imply empty source or healthy zero |
| Failed load | Specific recoverable error, retry and retain working filter context |
| Permission denied | Clear restricted status; do not leak protected data |
| Invalid scope / deep link | Explain invalid record and offer route back; never open unrelated record |
| Pending mutation | Busy indicator, block duplicate/conflicting actions, retain input |
| Confirmed success | Identify completed action and persisted outcome, appropriate next action |
| Unknown external outcome | State uncertainty; reconcile/inquire before retrying financial action |
| Partial completion | Name completed and incomplete steps, preserve recovery path |
| Offline / timeout | Identify network issue; preserve draft where safe; no false server success |

### 2.7 Microcopy standard

- Use direct, actionable, consistent Indonesian or English terms according to the current AMS terminology contract; do not mix synonymous labels within one workflow.
- Dates include an unambiguous period/timezone when relevant. Financial values include currency and scope; rates, percentages and trends have a denominator/reference.
- Status must represent source stage: drafted, requested, issued, posted, paid, bank-confirmed, reconciled, published are not interchangeable.
- Error recipe: “what failed + what was preserved + how to retry/contact owner”; avoid raw SQL/stack traces or “Something went wrong” alone.
- Confirmation recipe: action + exact entity + consequence + cancel path. Success recipe: completed operation + identified record + next step.
- Keep accessible descriptions distinct from decorative helper text; avoid long uppercase paragraphs, filler headings, “Priority 01” decoration.

## 3. Accessibility and responsive acceptance

**Target:** WCAG 2.2 Level AA. Compliance is not inferred from code lint or screenshot. Evaluate WCAG 2.2 criteria applicable to each surface, including 1.1.1 alternatives, 1.3.1 relationships, 1.4.3 text contrast, 1.4.10 reflow, 1.4.11 non-text contrast, 2.1.1 keyboard, 2.1.2 no trap, 2.4.3 focus order, 2.4.7 focus visible, 2.4.11 focus not obscured (minimum), 2.5.8 target size minimum, 3.3.1 error identification, 3.3.2 labels/instructions, 4.1.2 name/role/value and 4.1.3 status messages. See https://www.w3.org/TR/WCAG22/ and WAI-ARIA APG https://www.w3.org/WAI/ARIA/apg/.

Required audit:
1. Keyboard-only across sidebar, tabs, toolbar, menus, tables, boards, drawers, modals and submit.
2. Screen-reader label/announcement checks for inputs, chart descriptions, counters, table captions, selected states, errors, toasts and progress.
3. Text contrast and interface-component focus/outline contrast in both dark/light themes.
4. 200% text resize and reflow at 320 CSS px viewport-equivalent without two-dimensional page scrolling, except legitimate data-table exceptions with named scroll regions.
5. Touch target/spacing check against SC 2.5.8 and platform usability; preserve reasonable touch comfort beyond technical minimum.
6. Reduced-motion support and no motion-dependent information.
7. Zoom, long names, translated strings, validation text, keyboard overlays, soft keyboard, sticky headers, dropdown clipping and mobile browser viewport.
8. Focus retention on selection, menu dismiss, validation, detail close, route transition and failed save.
9. Board has keyboard-usable List alternative; drag cannot be exclusive way to manage tasks.

**Viewport audit:** use exact canonical viewport and breakpoints in `AMS-DESIGN-SYSTEM.md`. The documented engineering spot-check widths 320, 390, 600, 900, 1100, 1280 px can be added for coverage but do not create a competing breakpoint system. At every width verify page gutter, header actions, tab wrapping, card grid, main-surface priority, table/card parity, side panels, form footers and no clipped critical CTA.

## 4. Cross-module operational user journeys

Every journey must have an explicit happy path, invalid-input path, access-denied path, network failure path, duplicate/retry path, back/refresh/deep-link path, mobile path and observable persisted outcome where supported.

| ID | Journey | Steps to test | Hard acceptance |
|---|---|---|---|
| J01 | Inquiry to project | Inbox > inspect lead > client/lead association > quotation > project | Stable canonical IDs; no duplicative lead/client/project; clear status |
| J02 | Project delivery | Projects registry > planning/scope > task assignment > execution > deliverable > QA > client review > closure | Accurate stage, owner, deadlines; missing review/history contracts disclosed |
| J03 | Commercial to cash | Quotation > issued invoice > receivable > payment evidence > cash reconciliation > journal | Source meanings not conflated; no invented payment or double posting |
| J04 | Client service | Client 360 > contract/retainer > request > owner > follow-up > resolution | Scope and service-source limitations truthful |
| J05 | Resource allocation | Team > assignment > capacity/time logs > project work | Recorded vs inferred hours clearly separated |
| J06 | Content publishing | CMS register > edit > preview > save > publish > public verification | Save success not confused with external deployment/cache update |
| J07 | Document lifecycle | Related client/project > upload > preview/download > access > replace/history where supported | No false versioning; permissions tested |
| J08 | Security/administration | Login > MFA > role navigation > restricted detail > sensitive action | No bypass; denied actions/data protect confidentiality |
| J09 | Finance period closing | Reconcile evidence > journal review > maker-checker > close/lock > report | Controls respected; no UI-induced unauthorized posting |
| J10 | Failure recovery | Interrupt save, refresh, stale record, invalid link, denied response, timeout | Preserved draft/context, explicit retry and no false confirmation |

**Cross-entity rule:** a route requiring a client/project/document ID must not silently replace an invalid ID with the first available record. A button from module A to B must open the intended entity with correct authorized scope.

## 5. Module-by-module audit checklist and target outcomes

Statuses here are **documentary findings as of this review**, not fresh authenticated browser pass/fail. Refresh current source, CI, gap register and runtime for each issue.

### 5.1 Dashboard

Primary jobs: understand financial exposure, active projects, attention queue and deadlines; navigate to action. Check Overview and currently approved Analytics only; avoid reintroducing removed Performance view. Test header actions including important invoice/project entry points, filter period ownership per card, overdue receivables, issued invoices vs recorded expenses, project health, Needs Attention, task deadlines, workload, client delivery and recent activity. For every KPI verify source, cutoff, currency/percentage, chart labels, truthful empty state and click-through. Chart should remain conceptually understandable when data empty without fabricating points. P1: unclear action destinations, secondary content displacing financial/project priorities; P0 if financial numbers misleading.

### 5.2 Inbox

Jobs: scan messages, qualify request, assign owner, take authorized next action and close loop. Check category links All Messages, Sales Inquiries, Client Requests and Project & Support; selected nav exclusivity, saved filters, Review/Table, split reader/drawer, star and owner controls, back/focus, unread/priority, response state, resolution, Follow-ups and Templates. **Recorded gap:** dedicated Client Requests and Project & Support data sources are not complete; never present preview/sample content as real. Follow-up availability and sending must reflect actual source, never infer messaging delivery. On mobile preserve useful row information and visible return path. Verify export scope, draft retention and denied mutations.

### 5.3 Projects

Jobs: project portfolio triage, plan scope, execute tasks, manage resources, produce deliverables, oversee changes/risks and close projects. Audit Registry, Planning, Tasks & Execution (Board/List/Project Queues/Blocked Work), Content & Campaigns, Resources, Controls/Budget/Closure and project file links. Check task owner/status/deadline, project identity, brief/milestone scope, workload evidence, view switches, read-only state and cross-module Finance link. **Recorded gaps:** persisted named task lists/dependency edges, some QA/client-review/revision-history and campaign/source capabilities. Do not relabel task grouping as actual dependencies. Creative/IT task differences should follow real project types, not fake fields. Preserve current task mutations/permissions.

### 5.4 Clients

Jobs: locate account and contact, understand Client 360, complete onboarding, manage agreement/retainer and service relationship. Audit Directory and Client 360, Onboarding Checklist/Documents/Kickoff, Agreements/History/Renewal, Retainers, SLA/Service & Health. Check canonical client context persists across worksheet links and scoped records, labels/forms and filter/reset, correct primary contact and no phantom aggregated health. **Recorded gaps:** dedicated onboarding approval/readiness, contract-specific history, service telemetry/history and validated health models. Validate existing 13-worksheet implementation before filing an issue.

### 5.5 Finance

Jobs: financial control, billing, spend, reconciliation, allocation, statements, posting and close. **Latest domain-specific presentation contract** `docs/AMS-FINANCE-WORKSPACES.md` uses six work areas organizing 20 workbook worksheets plus Quotations; do not impose an outdated five-area visual grouping. Audit Executive Summary, Period Performance, Cash & Reconciliation, Client Invoices, Expenses, Petty Cash, Quotations, Collections & Aging, Supplier Bills, Suppliers & Freelancers, Project Profitability, Operational Budget, Profit Allocation, Project Team Fees, Journal & Posting, Chart of Accounts, Monthly P&L, Cash Flow, Balance Sheet, Month-End Close and Annual Summary. Test one worksheet at a time, including its date scope, table/card mobile mapping, search/filter and reporting denominator. Never change finance formulas or assume statement authority where source is provisional. Distinguish quoted/contracted/issued/earned/due/received/posted/reconciled. P0: false paid state, double journal/payment, bypassed approval or period lock.

### 5.6 Team & Resources

Jobs: identify employees/vendors, assign skills/capacity, track time and workload. Audit Team Directory, Vendor Directory, Capacity & Allocation, Skill Matrix and Time Logs. Verify person identity, source-backed availability, assigned work, time-entry scope, permission gates, clear member vs vendor roles. **Recorded gaps:** vendor contracts/rates/status detail, My Timesheet and Timesheet Control. Never claim calculated capacity from missing expected hours.

### 5.7 Documents

Jobs: find and access correct agency/client/project documents, upload and review versions if supported. Audit categories, search, related entity filters, preview/download, file type/size, delete confirmation, access rejection, upload progress and recovery. **Recorded gap:** full version-history workspace is not demonstrated by latest referenced docs. Do not imply versioning or secure sharing without implementation evidence.

### 5.8 Website CMS

Jobs: manage Services, Case Studies/Projects, Insights, Testimonials and Careers. Audit register, editor, rich content, media, preview, draft/save, publish outcome, sort/filter, deletion, unsaved changes and public-site verification. Use domain-owned content editor rather than generic KPI cards. Saving CMS content does not prove public deployment/cache refresh. Check accessible labels, long text and confirmation.

### 5.9 Settings

Jobs: understand account/system state, access/security, audit and integrations. Audit System Overview, Access & Security, Audit Log, Integrations and role-sensitive visibility. Test MFA, session and identity status where authorized, audit event provenance, error messages, focus and destructive confirmation. “Connected”, “Backup ready” or “Healthy” only when supported by actual source. Never reveal secrets or infer server access from client-side visibility.

## 6. Shared component micro-audit checklist

For **each** component family below, test default/hover/focus/pressed/selected/disabled/loading/success/empty/error/denied as applicable, then at keyboard, mouse and touch:

- **Sidebar & topbar:** branding, collapse/expand, active state, overflow, destinations, nested nav, focus, responsive reachability.
- **Header & breadcrumbs:** single H1, title/description, responsive quick actions, accurate ancestor, no second page heading.
- **Tabs & segmented filters:** navigation vs filter semantics, active indicator/padding symmetry, no accidental horizontal scroller, persistence/back.
- **Buttons & menus:** labels, permission, action callback, destructive meaning, pending/duplicate guard, Escape/outside dismiss and return focus.
- **KPI/card/panel:** consistent token, one border owner, adequate content space, meaningful hierarchy, period/unit/status, no clipped label.
- **Chart:** real values, axes/units/legend, non-color differentiation, accessible summary, honest missing-data overlay, drill-down.
- **Table/register:** headings, sortable announcement, row identity, columns, numeric alignment, pagination, responsive cards or labelled scroll, bulk action scope.
- **Search/filter/date:** explicit label, scope, reset, empty match, form value persistence, local date semantics/timezone and no hidden active filter.
- **Form/input/select:** IDs, required/help/error, keyboard, input types, valid/invalid boundaries, disabled state, escape and submit failure retention.
- **Drawer/modal/popover:** layering, backdrop, focus trap/restore, scroll, sticky actions, Escape, safe dismissal and small viewport.
- **Board/list:** consistent task identity, keyboard alternative, drag affordance, source-backed stage and rollback.
- **Upload/editor:** progress, file restrictions, retry, unsaved content, preview/save/publish distinction and role gate.
- **Toast/notice/notification:** correct politeness, persistence and outcome, no duplicate or swallowed errors.
- **Empty/skeleton/error/restricted:** exact source semantic, action, placement, no false zero or mock content.
- **Theme/typography/icons:** dark/light contrast, scale, spacing, line wrap, icon naming, no overlap, 200% resize.
- **Performance interaction:** largest workspace loading, filtered list input latency, unnecessary rerenders and expensive overlapping motion measured in actual target devices.

Record each micro finding as **evidence + user impact + source/component owner + proposed change**, not “looks bad”.

## 7. Measurement and usability testing protocol

### 7.1 Participants and tasks

Recruit representative internal operators from executive, sales, PM, creative/IT contributors, Finance and administrators, with actual authorization; cover novice and experienced users. A practical first qualitative round may involve around five participants per distinct user group, but sample size depends on risk and diversity and is **not** evidence of statistical representativeness. Test realistic tasks with neutral wording and without coaching; avoid real payment/irreversible operations in production.

### 7.2 Metrics

- **Task success:** completed intended outcome using authorized source, independently verified; denominator = assigned eligible tasks.
- **Critical error rate:** destructive, financial, authorization or irreversible error events per eligible attempts.
- **Recoverability:** whether participants restored the task without manual admin intervention after an induced safe failure.
- **Time on task:** measured from clear start to verified completion, segmented by novice/expert and device.
- **Assistance rate:** tasks requiring moderator intervention or outside instruction divided by assigned tasks.
- **Navigation rework:** backtracks/wrong destinations and route hops before the correct record.
- **UX issue frequency:** number of participants hitting an issue / tested participants exposed to that step.
- **Accessibility:** manual keyboard, focus, screen-reader and contrast pass/fail by WCAG criterion and screen.
- **Optional SUS:** standard 10-question System Usability Scale after test, reported with participant count and method. Do not invent scores or treat it as a substitute for outcomes.

**Suggested release targets** must be approved with staff rather than declared as measured: zero unresolved confirmed P0; all critical workflows have verified happy/failure/role paths; P1 blockages resolved or explicitly risk-accepted by owner; all essential operations keyboard-usable; no critical content clipping at canonical viewports. Define numeric task-success/time goals only after baseline measurement.

### 7.3 Test procedure

1. Capture HEAD, data environment, role, test accounts and consent/privacy constraints.
2. Build route inventory and task list from real authority docs, not from sidebars alone.
3. Capture initial screenshots with actual stable app state and relevant loaded/empty/error variants.
4. Observe task completion; log click path, time, missteps, speech, backtracks and outcome.
5. Inject safe validation/network/permission failures in a non-production environment.
6. Repeat key tasks with keyboard and mobile, check screen-reader labeling.
7. Triangulate user behavior, screenshots, source/CI, and support records. Do not confuse operator preference with correctness.
8. File scoped issues with reproducible evidence and propose smallest appropriate source-level fix.
9. Retest after change and perform regression across consuming shared components.
10. Obtain explicit stage-5 frontend visual sign-off before expanding into broad backend or operational changes.

## 8. Issue record format and backlog governance

Use one issue ID per defect; link to existing canonical gap/requirement IDs, never duplicate records. Every issue must include:

```yaml
id: UX-AMS-XXXX
module: "Dashboard / Inbox / Projects / Clients / Finance / Team & Resources / Documents / Website CMS / Settings / Shared"
workspace: ""
route_and_query: ""
role: ""
commit_sha: ""
tested_at: ""
environment: ""
viewport_zoom_theme: ""
evidence_type: "V/P/G/R/N/T"
severity: "P0/P1/P2/P3"
user_task: ""
expected: ""
actual: ""
steps_to_reproduce: []
screenshots_or_trace: []
impact_frequency: ""
root_owner: "shell/shared component/domain/API/data/permissions"
proposed_remedy: ""
constraints_and_dependencies: ""
acceptance_checks: []
test_results: ""
status: "new/investigating/blocked/fixed/retested/accepted"
```

**Execution gates:** (A) evidence confirmed, (B) cross-module/data dependencies mapped, (C) source/domain authority read, (D) change confined to approved scope, (E) targeted tests pass, (F) all shared consumers verified, (G) exact-SHA CI status checked, (H) screenshots/retest accepted, (I) human sign-off. Do not call a component refactor a full workflow redesign. Do not declare finished because JSX renders or build passes.

## 9. Recommended order of work

1. **Baseline and authenticated visual evidence:** current main, route inventory, nine-module screenshot catalog, role and mobile coverage.
2. **Shared UX foundation:** page/header geometry, nested nav, breadcrumbs, scroll/focus, common action/filter/table/empty/error patterns.
3. **Dashboard and Inbox:** daily prioritization and intake/action journeys.
4. **Projects and Clients:** core agency delivery and entity continuity.
5. **Finance:** 21 destinations and critical money/status controls, without changing finance rules.
6. **Team, Documents, CMS and Settings:** supporting operator journeys and access safeguards.
7. **E2E cross-module test battery:** J01–J10, including failures, responsive, keyboard and roles.
8. **User observation and remediation:** prioritized evidence-backed P0/P1 first, then P2 and P3.
9. **Stage 5 visual/user acceptance gate:** sign-off per module and workflow, unresolved issues documented. No blanket production-ready statement without actual production operational checks.

**Important current-status notes (review 5 November 2026):** source/checkpoint documents describe shared component adoption as partial, Inbox special-category sources as incomplete, Project dependency/revision contracts as incomplete, Client onboarding/service telemetry as incomplete and authenticated final visual sign-off as not verified. Recent 3 November 2026 Finance commits updated empty-line plots, filters and overview. These dated findings must be rechecked against the actual HEAD, not copied as permanent truth.

## 10. Non-negotiable prohibitions

- No dummy records, fake KPI, fake zero, invisible permission workaround, inert CTA or false publish/bank success.
- No unsanctioned backend/API/DB/schema/auth/MFA/RBAC/security/Finance formula/period-lock changes during frontend-only UX work.
- No generic dashboard composition forced onto a task-specific register, board, editor or formal finance statement.
- No local CSS patch to compensate for broken shared-shell ownership.
- No destructive mutation, payment, bank transfer, production test write or role-policy change during an audit.
- No duplicate source of truth, duplicate client/project records or new financial logic to make UI appear complete.
- No claim of WCAG compliance, cross-role E2E completion or production acceptance without documented tests.
- No superseding the approved Dashboard Overview as the reference without explicit user approval.
- No completion declaration while critical pending UI, error recovery, focus, responsive and state branches lack evidence.

## 11. Reading and standards references

Internal: [documentation index](README.md), [UX Interaction Standards](AMS-UX-INTERACTION-STANDARDS.md), [Shared UI System](AMS-SHARED-UI-SYSTEM.md), [Frontend structural audit specification](AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md), [Gap Register](AMS-FEATURE-CONTENT-GAP-REGISTER.md), [Execution Checkpoint](AMS-EXECUTION-CHECKPOINT.md), [Finance Workspaces](AMS-FINANCE-WORKSPACES.md).

External: [ISO 9241-210 overview](https://www.iso.org/standard/77520.html), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/), [Nielsen Norman Group usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/). Design laws are heuristic support, not automatic approval or universal numerical constraints.

**Done means:** each relevant task is understandable, source-backed, permission-safe, keyboard/touch usable, recoverable and visually verified across the intended routes, roles and viewports, with an accountable human acceptance decision.
