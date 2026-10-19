# AMS Stage-by-Stage Execution Checklist

**Repository:** Kapitech-Agency/kapitech-ams  
**Delivery branch:** main  
**Canonical stage sequence:** [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md)  
**Requirement status and evidence:** [AMS Feature & Content Gap Register](AMS-FEATURE-CONTENT-GAP-REGISTER.md)  
**Product structure:** [AMS Master Structure & AI Implementation Guide](AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md)  
**Design authority:** [AMS Design System](../AMS-DESIGN-SYSTEM.md)  
**Purpose:** Prevent omitted phases, lost work after timeout, premature completion claims, and requirements that exist in design guidance but are not represented in implementation and acceptance checks.

> This is a detailed operational checklist for the canonical roadmap. It does not create a competing stage order, override domain contracts, or certify that a capability is implemented. Always reconcile status against current main, source code, tests, latest CI, and authorized runtime evidence.

## 1. Non-negotiable operating rules

1. Follow the numbered order in the canonical roadmap: Stage 0 through Stage 15. Stage numbers must not be renamed, skipped, merged, or treated as complete because later work has started.
2. Before each resume or new stage, fetch the latest main, record its HEAD, inspect relevant commits/files and current CI, and read the current gap-register entries. Preserve valid work; do not repeat it without a demonstrated defect.
3. Distinguish four things in every report: target requirement, implementation in source, automated verification, and authenticated/runtime verification. Evidence for one is not evidence for all.
4. Work in bounded, independently verifiable slices. Keep the requested scope for that slice; do not turn a visual change into an incidental backend or business-rule rewrite.
5. Update the gap register with evidence and a next action as status changes. Use the repository's status vocabulary: Verified complete, Partially complete, Missing, Failing/regressed, Not verified, Target-only, Provider/configuration blocked, or Deferred by release scope.
6. Do not invent data, actions, page states, routes, calculations, API success, provider capabilities, access grants, or production behavior to make a screen look complete.
7. A passing typecheck, test suite, build, HTTP smoke test, commit, or CI workflow proves only what that check actually covers. It does not automatically prove UI quality, end-to-end business behavior, deployment, or production readiness.
8. Commit authorized changes directly to main when allowed by the repository. Never force-push or bypass branch protection. If repository protections block the direct update, stop and report the exact blocker instead of improvising a new delivery route.
9. Group logically related changes into a bulk commit, run the relevant validation first, and avoid unnecessary pushes/workflow triggers. Do not combine unrelated risky changes just to reduce commit count.
10. Keep the user informed at baseline, after a meaningful slice, at a blocker or material risk, and at every stage boundary. After a routine report, continue with the next already-authorized task when safe.
11. Never request or place passwords, session cookies, MFA codes, API keys, bank credentials, private documents, or other secrets in chat, Markdown, source code, logs, or screenshots.
12. Do not perform destructive data actions, live money movement, credential/security-policy changes, or production-sensitive changes without the applicable explicit authorization and operational safeguards.
13. If a tool times out, do not infer success or start from zero. Record the exact last verified source SHA, whether it was committed, which tests finished, and the next command/action; then re-fetch main and current CI before resuming.
14. The user's explicit completion statement for the navigation implementation means the work must not be re-created. Validate only enough to preserve it and resolve concrete regressions. Continue from the earliest remaining stage whose exit gate is not met.
15. The visual/content approval gate at Stage 5 is mandatory. Do not start broad functional implementation at Stage 6 until the user explicitly approves the visual/content structure. A request to proceed does not permit false evidence or bypassing security, accounting, or release gates.

## 2. Status model and stage ledger

Use these states consistently:

- **Not started:** No substantive work/evidence is recorded for this scope.
- **In progress:** Work is active and the stage exit gate is not satisfied.
- **Partially complete:** One or more acceptance criteria pass, but at least one remains unmet or unverified.
- **Blocked:** A concrete dependency prevents the next required action. Name the dependency and safe work that can still proceed.
- **Unverified:** Evidence has not been collected. This does not mean the capability is either missing or correct.
- **Complete for stated scope:** Each acceptance criterion has relevant evidence and the formal exit gate passes. State any exclusions separately.
- **Approved:** A named user/authority decision gate has actually been passed. Do not infer approval from silence or from CI.

Maintain a stage ledger in progress documentation or the user checkpoint report:

| Field | Required content |
|---|---|
| Stage | Canonical stage number and title |
| Entry evidence | Commit, files, prior gate and blockers |
| Scope slice | One module/workspace/workflow or bounded control |
| Acceptance items | Checklist IDs or gap-register IDs |
| Status | One consistent status, no vague “almost done” |
| Evidence | Source paths, tests/CI run IDs, screenshot or runtime evidence as applicable |
| Commit | Exact SHA on main, or “no source change” for audit-only work |
| Open gap | Remaining criteria and owner/dependency |
| Next action | One concrete next task in canonical sequence |

## 3. Stage-by-stage mandatory checklist

### Stage 0 — Baseline, historical-work preservation and audit inventory

**Purpose:** Establish the current facts before acting.

Checklist:
- [ ] Confirm repository identity, branch main, current HEAD, parent commit and changed files.
- [ ] Review recent relevant commits and current workflow results on the exact SHA.
- [ ] Read AGENTS.md, docs/README.md, the canonical roadmap, the gap register, end-to-end execution prompt, current progress and implementation map.
- [ ] Read the Master Structure, navigation information architecture, role/content blueprint, worksheet matrix, Design System, relevant domain contracts and E2E matrix.
- [ ] Inventory all nine primary modules, their actual workspaces/worksheets, route/query patterns, record-detail routes, permission boundaries and real source data.
- [ ] Identify shared UI primitives, shell/header ownership, content hierarchy, scrolling, responsive behavior and repeated UI patterns.
- [ ] Specifically audit cross-cutting UI requirements, including contextual breadcrumbs; do not assume a requirement was implemented just because it appears in guidance.
- [ ] Separate confirmed defects from old audit findings that must be revalidated.
- [ ] Record work to preserve, known blockers, exact evidence and the next incomplete stage.

**Required evidence:** Baseline SHA, key source/test paths, status of relevant CI, updated requirement-level gap register and checkpoint report.

**Exit gate:** There is an evidence-based, dependency-aware next task; historical work and unverified claims are clearly separated.

### Stage 1 — Approved navigation and route ownership

**Purpose:** Complete the approved navigation without reopening the information architecture.

Checklist:
- [ ] Verify the nine primary modules: Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS and Settings.
- [ ] Verify Finance's five areas: Overview & Control, Transactions & Cash, Receivables & Payables, Project Finance, Accounting & Reports.
- [ ] Check each visible nav item against a supported route/view, selected state, role visibility and intended workspace.
- [ ] Test query/hash-backed views, direct links, refresh, back/forward, invalid query values and legacy compatibility behavior where appropriate.
- [ ] Ensure worksheets, status filters, saved views and individual records remain within the owning workspace rather than becoming new global modules.
- [ ] Check breadcrumb ancestors separately from primary navigation; a breadcrumb is not another sidebar layer and does not replace correct route ownership.
- [ ] Preserve existing APIs, entity stores, audit trails, maker-checker controls, permission policies and record history when a legacy menu is retired.

**Required evidence:** Navigation-to-route matrix, source/test evidence for important paths and updated gap rows.

**Exit gate:** Every visible destination works as intended or is explicitly documented as target-only, unavailable, or blocked with evidence. The already-completed navigation implementation must not be re-created.

### Stage 2 — Shared shell, geometry and contextual navigation consistency

**Purpose:** Fix the common layout foundations before continuing repeated page-by-page work.

Checklist:
- [ ] Verify one owner for the page header/title and one owner for the main page gutter.
- [ ] Verify workspace navigation, worksheets, toolbar, page content and notices use the canonical spacing relationships.
- [ ] Check tab switching does not produce header jumps, duplicate gutters, stale active styles or width changes.
- [ ] Verify exactly one primary vertical workspace scroll owner; inspect nested tables, boards, drawers, modals and mobile navigation as intentional exceptions.
- [ ] Check shell sizing, safe areas, compact sidebar/drawer, viewport-height behavior, focus visibility and narrow-layout fallback.
- [ ] Compare typography, controls, icon sizes, radii, table rows, spacing and responsive breakpoints with AMS-DESIGN-SYSTEM.md section 2.7.
- [ ] Decide whether breadcrumb behavior belongs in an existing shared header primitive or a small shared component. Reuse established components and avoid a second page header.
- [ ] A shared breadcrumb primitive must be semantic, keyboard accessible, responsive, permission-safe and displayable only when requested by page context. It must not force breadcrumbs on every route.
- [ ] Inventory all pages consuming changed shared primitives and retest those consumers.

**Required evidence:** Shared-shell consumer inventory, precise source/test changes and regression checks around layout/scroll ownership.

**Exit gate:** Known shared-shell defects are fixed or explicitly tracked; no page-specific hacks conceal a shared geometry issue.

### Stage 3 — Feature/content gap register and acceptance definition

**Purpose:** Ensure every requirement has an owner, source contract, acceptance test and status.

Checklist:
- [ ] Assign a stable requirement ID to every module/workspace/worksheet, cross-module workflow and cross-cutting behavior.
- [ ] Capture current implementation status, source evidence, test/runtime evidence, desired behavior, priority, dependencies, affected modules and next action.
- [ ] For content, define the user's task, primary work area, fields/columns, filters, supported actions, record links, periods/units/source, loading/empty/no-match/unavailable/error/success states.
- [ ] For data and metrics, identify canonical owner/source, time period/timezone/currency, freshness, fallback behavior, and whether missing data differs from zero.
- [ ] For actions, identify route, current UI, API/client contract, server permission check, canonical write owner, state transition, audit trail, side effects and recovery behavior.
- [ ] Record whether each gap is visual/layout, navigation, frontend interaction, backend/API, data/schema, permissions/security, test, provider/configuration or operations.
- [ ] Include cross-cutting breadcrumbs as an explicit requirement. Link the requirement to navigation IA and content architecture guidance; include valid parent routes, title non-duplication, responsive fallback and role access.
- [ ] Keep ambiguous business, accounting, privacy or permission rules listed as open decisions; do not invent a convenient behavior.
- [ ] Do not duplicate requirement IDs already owned by another canonical module; link consumers to the single canonical record.

**Required evidence:** Updated gap register with current evidence, complete coverage inventory and dependency-ranked next actions.

**Exit gate:** Every known requirement has a status, owner, acceptance criteria and next action. Unknown/unverified must not be mislabeled Missing or Complete.

### Stage 4 — Main-content structure and UI implementation across all nine modules

**Purpose:** Perform a full structural re-architecture of main content using docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md as the mandatory detailed contract. This is not a cosmetic revision of existing layouts.

Work through the module order in the canonical roadmap, one bounded worksheet at a time. Define the new ordered hierarchy and primary work surface before coding. Rebuild where the current structure fails the task; retain only elements justified by user task and source evidence.

Checklist for every view:
- [ ] State the page's primary user task and select the dominant working surface (register, board, editor, report, timeline, detail or operational control).
- [ ] Place filters, search, period scope and primary actions where they support that task; avoid duplicated headers, redundant summary strips and decorative cards.
- [ ] Verify fields, labels, units, timestamps, currency, statuses and row actions come from supported source contracts.
- [ ] Preserve existing record actions, routes, sorting, pagination, selected filters, URL state and permission checks.
- [ ] Implement only supported interactions; use real source state and truthful empty/unavailable/error outcomes, not fixture or hardcoded success.
- [ ] Apply responsive table/card/board patterns that preserve meaningful data and actions rather than hiding columns or forcing unusable overflow.
- [ ] Use the shared Drawer and ConfirmDialog patterns according to their guidelines; ensure pending/error/retry/close behavior is clear.
- [ ] Add breadcrumbs to eligible deep record/detail contexts using the approved conditional policy. Do not add them to obvious module roots, Dashboard, Inbox primary workspaces or established Finance tabs when location is already clear.
- [ ] Make breadcrumb ancestors link to valid parent routes that respect current permissions. The current record/page title remains the page heading and must not be repeated in the breadcrumb trail.
- [ ] At compact widths, collapse the ancestor path or use a clear back-to-parent control without adding a second navigation bar.
- [ ] Trace every shared UI change back to the other affected views and update the gap register per completed slice.

Minimum module coverage:
1. Dashboard: Overview, Performance and Analytics.
2. Inbox: Overview, Messages/categories/saved views; Follow-ups and Routing & Templates only where actual supporting contracts exist.
3. Projects: Overview/Registry, Tasks & Execution, Planning & Delivery, Content & Campaigns, Project Resources and Project Controls where supported.
4. Clients: Directory, Onboarding, Agreements, Service & Health, and applicable client detail pages.
5. Finance: all five primary areas and existing worksheets, with quotation destination/order and financial semantics preserved.
6. Team & Resources: Team & Capacity, People Operations, Vendors & Freelancers, Time & Availability where supported; apply strict visibility to employee details.
7. Documents: canonical register, secure detail/version and linked-record context.
8. Website CMS: actual content types/editors, draft/publish states, Careers jobs and restricted Applicants.
9. Settings: existing profile/account/security/access/audit/integration/system controls with no permission broadening.

**Required evidence:** Source change and relevant tests for each slice, updated gap ID(s), current commit SHA and known limitations.

**Exit gate:** Every active view is reviewed against its own content contract or explicitly remains blocked/unverified. A shared component change or successful build alone cannot complete a module.

### Stage 5 — Visual, responsive, keyboard and accessibility review; explicit user sign-off

**Purpose:** Validate the actual experience before expanding into broad functional implementation.

Checklist:
- [ ] Review applicable widths: 1440, 1280, 1100, 1024, 900/899, 768, 600/599, 390 and 320 CSS pixels, following the canonical Design System matrix.
- [ ] Test browser zoom/text resizing to 200% and 320px reflow.
- [ ] Capture the actual page viewport and relevant interaction states for all nine modules, every active worksheet, representative deep-detail routes, and shared components.
- [ ] Verify breadcrumb presence only on eligible pages, ancestor link destinations, current-title non-duplication, compact behavior, keyboard usability, visible focus and appropriate accessible naming.
- [ ] Verify shell and local scroll behavior with mouse wheel/trackpad/touch/keyboard when browser access permits.
- [ ] Test menus, drawers, modals, table sorting/pagination, boards, forms, focus return, Escape behavior and pending/error behavior.
- [ ] Review populated, loading, empty, no-match, stale/unavailable, restricted, validation/error, pending and confirmed-success states where applicable.
- [ ] Check contrast, target sizes, text scaling, reduced motion and semantic/ARIA behavior against the target WCAG 2.2 Level AA requirements.
- [ ] Identify the environment and account/role used for each screenshot or browser check. Redact personal data and secrets.
- [ ] Clearly label source-only and automated evidence separately from authenticated runtime/browser evidence.
- [ ] Present one consolidated visual/content acceptance report to the user and record the explicit decision.

**Required evidence:** Visual matrix, screenshots or precise browser observations, defect list, re-test outcomes, accessibility checks and recorded user sign-off.

**Exit gate:** The user explicitly approves the visual/content structure. If changes are requested, return to the appropriate Stage 2–5 slice. If the production browser session is unavailable, document the unverified items and continue only source/automated work that does not pretend to satisfy the browser gate. Do not start Stage 6 until the visual sign-off gate is actually passed.

### Stage 6 — Workflow, data and API traceability

**Purpose:** Establish how a user action becomes a safe, persisted business outcome.

Checklist:
- [ ] Trace each high-value journey from role and UI action through validation, route, API client, server handler/service, authorization, persistence and response.
- [ ] Identify canonical entity and write owner, state transition, preconditions, side effects, audit entry, notifications and downstream module effects.
- [ ] Define stable IDs, duplicate prevention, idempotency, version/concurrency behavior and retry semantics.
- [ ] Identify data ownership and access rules for clients, projects, tasks, quotations, invoices, payments, employees, applicants, documents and provider events.
- [ ] Define outcomes for validation failure, permission denial, stale record, duplicate request, timeout/unknown result, partial failure and provider unavailability.
- [ ] Trace deep-link and breadcrumb ancestors through real route ownership; a visible breadcrumb must not become a route or authorization bypass.
- [ ] Map every requirement to relevant unit, API/integration, role, cross-module and end-to-end tests.
- [ ] Record product/security/accounting decisions as decisions, not assumptions.

**Required evidence:** Updated workflow traceability matrix, dependency plan and acceptance tests.

**Exit gate:** High-value workflows have a verified source-of-truth map and testable acceptance criteria.

### Stage 7 — Foundation gaps, security and data-integrity plan

**Purpose:** Remediate only the foundation gaps needed for safe vertical slices.

Checklist:
- [ ] Review API validation/error semantics, server-side permission enforcement and record-level data scope.
- [ ] Review session, CSRF, MFA, RBAC, audit, encryption and secret handling within existing security contracts.
- [ ] Review canonical IDs, uniqueness, referential integrity, concurrency, idempotency and duplicate prevention.
- [ ] Plan schema/migration/backfill/reconciliation only where evidence shows they are needed.
- [ ] Review document storage/integrity, notifications, background jobs, provider failure, logs/metrics and operator recovery.
- [ ] Classify findings by risk; define reviewed remediation, tests, compatibility and recovery plan.
- [ ] Do not weaken safeguards or invent a new auth/data mechanism.

**Required evidence:** Prioritized foundation gap register and approved implementation/recovery plan for each substantive change.

**Exit gate:** Blocking foundation risks have safe remediation paths; there are no speculative broad rewrites.

### Stage 8 — Core agency workflows as tested vertical slices

**Purpose:** Connect supported UI and data behavior end-to-end, one workflow at a time.

Checklist:
- [ ] Inquiry intake → Inbox thread, category, owner and follow-up behavior.
- [ ] Qualification/scoping → canonical quotation/version in Finance, authorized review/send and quote outcome.
- [ ] Accepted scope/contract/SOW/change order → onboarding/handover → exactly one canonical project.
- [ ] Project/task/milestone/deliverable → assignments/dependencies → QA/client review/revision → completion/closure, where records and contracts exist.
- [ ] Client identity/360, onboarding evidence, agreement/renewal, retainer/SLA status and linked requests.
- [ ] Documents: secure upload/download, version/link, access, audit, integrity and failure recovery.
- [ ] Website CMS content lifecycle, publication confirmation and Careers applicant privacy.
- [ ] Team/resource availability, leave, training/performance restrictions, vendor/freelancer and time-entry behavior as supported.
- [ ] Cross-module notifications/follow-ups only where a real event and delivery/acknowledgement path is implemented.
- [ ] Include happy-path, validation, permission denial, duplicate, concurrent/stale, retry, timeout/unknown-outcome and recovery tests as relevant.
- [ ] Preserve one canonical record source; do not create duplicate CRM, quotation, task, document or approval stores.

**Required evidence:** End-to-end evidence per vertical slice and updated requirement/gap IDs.

**Exit gate:** Each declared slice is proven through the necessary UI/API/persistence and affected modules, with unresolved effects exposed honestly.

### Stage 9 — Finance quote-to-cash, purchase-to-pay and accounting integrity

**Purpose:** Confirm financial records and reports remain correct across the complete workflow.

Checklist:
- [ ] Verify quotation template/version, acceptance, billing terms, invoice issuance/cancellation, partial/full payments and receivables.
- [ ] Verify purchase/expense request, budget checks, vendor bills, payables, cash/bank and petty cash flows.
- [ ] Verify journal creation/post/reversal, Chart of Accounts, account mappings, P&L, cash flow, balance sheet and period closing.
- [ ] Verify Project Finance, allocations, team-fee costing and workbook/report reconciliation.
- [ ] Test duplicate submission, concurrent mutation, rounding/tax/currency boundaries, period lock, audit evidence and maker-checker controls.
- [ ] Preserve existing formulas, historical results and account codes unless a separate approved business-rule decision changes them.
- [ ] Confirm an accepted quotation is not cash, an issued invoice is not receipt, and an unconfirmed payment request is not settled transfer.
- [ ] Do not move real money from automated tests.

**Required evidence:** Relevant accounting/Finance regression runs, before/after baseline reconciliation and discrepancy report.

**Exit gate:** Affected financial records/calculations reconcile or an explicit business decision blocks release.

### Stage 10 — Integrations, event automation and provider-dependent features

**Purpose:** Enable only integrations that have valid contracts, configuration and verifiable behavior.

Checklist:
- [ ] Identify each provider, credentials owner, environment, contract/version, status source and support boundary.
- [ ] Verify event identity, deduplication, bounded retry, replay, last-sync/error display, manual recovery and audit.
- [ ] Ensure UI reports success only after a success state can be confirmed. Distinguish pending, rejected, failed and unknown outcomes.
- [ ] Keep provider secrets server-side and out of client code/logging.
- [ ] For Kopra H2H, require official specifications, approved access, sandbox/UAT certification, idempotency, status inquiry, reconciliation and controlled per-feature enablement.
- [ ] Disable or clearly mark unconfigured features; never fake a working integration.

**Required evidence:** Provider-specific conformance tests, runtime configuration status and failure/recovery tests.

**Exit gate:** Each feature declared enabled has evidence for its actual contract. Unready provider-dependent features remain disabled or excluded with an explicit scope decision.

### Stage 11 — Security, privacy, reliability and performance hardening

**Purpose:** Validate the system's protection and reliability boundaries.

Checklist:
- [ ] Re-test authentication/session/CSRF/MFA and server-side RBAC/record-scope enforcement.
- [ ] Verify restricted employee, applicant, private-document, Finance and integration-secret data.
- [ ] Review input validation, output safety, audit integrity, sanitized errors/logging, request limits and dependencies.
- [ ] Verify concurrency, idempotency, retry boundaries, resource limits and error/denial behavior.
- [ ] Review application availability, operational monitoring, latency and heavy-register/large-document behavior where applicable.
- [ ] Confirm no sensitive action can be authorized solely by hiding a UI button.
- [ ] Re-test findings and document any accepted residual risk through the authorized process.

**Required evidence:** Security/reliability findings, remediation commit(s), retest results and risk decisions.

**Exit gate:** No unaccepted critical/high-risk finding remains in release scope.

### Stage 12 — Full regression, E2E and UAT

**Purpose:** Confirm key behaviors across roles, modules and failure modes.

Checklist:
- [ ] Run the prescribed typecheck, tests, lint and production build commands that exist in the repository.
- [ ] Run navigation/query/deep-link tests, module and worksheet regressions, and shared component tests.
- [ ] Run relevant API contract, validation, authorization and negative tests.
- [ ] Run end-to-end cross-module journeys and Finance reconciliation.
- [ ] Run duplicate/retry/concurrency/timeout/partial-failure cases and recovery flows.
- [ ] Test roles/privacy, keyboard/accessibility and responsive behavior.
- [ ] Re-run all relevant tests after fixes, recording the exact final SHA and result.
- [ ] Record UAT scenario, user/role, environment, outcome and unresolved issue.

**Required evidence:** Test matrix linked to exact commit SHA, environment, workflow/run ID and defects.

**Exit gate:** Mandatory tests pass; all exceptions are explicitly documented and approved where required. Green CI alone is not full end-to-end proof.

### Stage 13 — Data reconciliation, backup, restore and disaster recovery

**Purpose:** Prove safe recovery from an artifact representative of the actual environment.

Checklist:
- [ ] Inventory currently loaded migrations; verify applied version/checksum parity.
- [ ] Verify backup provider, current backup freshness against RPO, artifact integrity and restricted access.
- [ ] Perform authorized restore rehearsal in an isolated target, using the same identified latest backup artifact.
- [ ] Verify data reconciliation and private document/object integrity after restore.
- [ ] Confirm RTO/RPO owner, runbook steps, dependencies, escalation and recovery evidence.
- [ ] Never perform destructive rehearsal against production.

**Required evidence:** Backup artifact reference, restore logs/results, reconciliation and document-integrity evidence, approved recovery report.

**Exit gate:** Required backup/restore/reconciliation controls pass using current evidence, not documentation alone.

### Stage 14 — Production readiness and release authorization

**Purpose:** Decide go/no-go before production release.

Checklist:
- [ ] Follow the current production cutover, readiness, backup/restore, database and private-vault runbooks.
- [ ] Verify current Hostinger project, main branch, domain, runtime/configuration and target release with authorized access.
- [ ] Verify CI for the intended commit, runtime configuration, PostgreSQL and migration/checksum parity.
- [ ] Verify accounting/data reconciliation, backup/restore, MFA and private document/object integrity.
- [ ] Verify enabled notifications/integrations and their configuration without exposing secrets.
- [ ] Require the authenticated production-readiness endpoint to return HTTP 200 and productionReady=true, as specified by the current runbook. HTTP 401 is not readiness evidence; HTTP 409 means gates remain incomplete; HTTP 503 means evaluation did not complete.
- [ ] Prepare exact release SHA, smoke-test plan, incident contacts and a safe recovery/rollback approach.
- [ ] Obtain the required explicit go/no-go authorization.

**Required evidence:** Release evidence bundle, gate results, go/no-go decision and release plan.

**Exit gate:** Every mandatory readiness/release gate passes with current evidence and the required authorization is recorded.

### Stage 15 — Deployment verification and stabilization

**Purpose:** Prove that the intended release is actually active and behaves correctly in production.

Checklist:
- [ ] Verify the production environment runs the intended main commit/build.
- [ ] Run non-destructive live smoke tests and authorized role-specific workflows.
- [ ] Verify primary navigation, representative critical workspaces, breadcrumb/parent paths on eligible detail routes, and key cross-module journeys.
- [ ] Review safe logs/telemetry, error rates, backup freshness and critical workflow indicators.
- [ ] Check for duplicate records, inconsistent financial status or unintended side effects.
- [ ] Apply authorized incident/recovery procedures if serious defects appear; never hide the issue with a status-only change.
- [ ] Record limitations, monitoring owner, handover and follow-up items.

**Required evidence:** Deployed SHA, environment/deployment evidence, smoke-test results, stabilization report and open-risk list.

**Exit gate:** Deployment and critical live workflows are confirmed. Otherwise the release remains deployed-unverified or not deployed.

## 4. Mandatory breadcrumb implementation and acceptance contract

Breadcrumbs are a cross-cutting requirement, not a new module or an unconditional global header. Their policy is already defined in the Master Structure and Content Architecture documents. The purpose of this section is to make those requirements testable and impossible to omit during execution.

### 4.1 Scope and when breadcrumbs appear

- Use breadcrumbs when a deep record/detail page benefits from ancestor context and a safe return path.
- Common eligible contexts include a project detail opened from Project Registry, a client detail opened from Clients Directory, or an invoice/contract/document detail when the actual route hierarchy supports meaningful ancestors.
- Decide eligibility from actual route ownership and user journey, not from a blanket rule that every page must show breadcrumbs.
- Do not add a breadcrumb bar to obvious module roots, Dashboard, primary Inbox workspaces, or established Finance tabs when the current location is already unambiguous.
- Do not promote worksheets, statuses, saved views or record details into another global navigation layer.
- A breadcrumb must not replace browser history, a real link, a route-level permission check or an explicit back action where one is required.

### 4.2 Content and route rules

- Display only meaningful ancestor levels. Example ancestors: Projects → Project Registry, while the page heading names the selected project.
- Every clickable ancestor must resolve to the correct real parent route and respect the existing route/record access policy.
- Do not link to a fabricated, unavailable or unauthorized parent.
- Do not repeat the current record title both in the breadcrumb and the main page heading.
- Use the current canonical record identity/name. Avoid hardcoded labels that become stale when a source-backed record changes.
- Breadcrumb clicks must not mutate data or silently reset unrelated query state unless the destination's documented route behavior requires it.
- Refresh, direct URL entry, back/forward and changing the selected record must not leave a stale breadcrumb path.
- Query/hash-backed workspaces must retain their intended owner and selected state.
- Missing ancestry or unavailable parent data must produce a safe, understandable fallback rather than a broken link or fabricated hierarchy.

### 4.3 Semantic, visual and responsive rules

- Use a semantic navigation landmark with an accessible breadcrumb name and ordered hierarchy.
- Keep keyboard traversal logical and each ancestor link focus-visible; decorative separators must not become interactive or create confusing screen-reader output.
- Follow shared AMS text, icon, spacing, focus, contrast, radius and responsive tokens.
- Preserve the page's single-header and single-gutter ownership. Do not introduce a second page title or duplicate tab/navigation row.
- On compact layouts, collapse long trails or provide a clear back-to-parent control without creating an overflowing horizontal bar or a second global navigation row.
- Ensure content does not wrap into an unreadable stack, overlap the title/actions or cause horizontal overflow at supported narrow widths.
- Verify at the applicable canonical viewport widths, including 390px and 320px, and with text resizing/zoom.
- Use established icon primitives and component variants. Do not add arbitrary colors, spacing, negative-margin hacks or a parallel navigation framework.

### 4.4 Required verification

- [ ] Enumerate eligible detail routes and intentionally excluded routes.
- [ ] Confirm each ancestor destination and its permission/record-scope behavior.
- [ ] Confirm current title is not duplicated in the trail.
- [ ] Confirm direct load, refresh, back/forward, selected-record change and missing-parent behavior.
- [ ] Confirm keyboard focus, accessible names, semantic hierarchy and reduced/compact presentation.
- [ ] Confirm no layout shift, overflow, duplicated header or unintended scroll container.
- [ ] Add/adjust regression tests for route hierarchy, current-title non-duplication, conditional presence and responsive fallback.
- [ ] Capture authenticated browser screenshots/runtime observations where available; do not substitute a source-level assertion for visual proof.
- [ ] Update requirement UX-NAV-BREADCRUMB-001 in the gap register with the exact commit, test and browser evidence.
- [ ] Retest all affected pages if the shared breadcrumb primitive changes.

### 4.5 Breadcrumb stage mapping

| Stage | Required breadcrumb work |
|---|---|
| Stage 0 | Search current source, routes and shared primitives; establish current implementation status from evidence. |
| Stage 1 | Ensure breadcrumb does not change approved primary module/worksheet hierarchy or route ownership. |
| Stage 2 | Establish/reuse accessible shared primitive and its geometry, while preserving conditional display policy. |
| Stage 3 | Maintain explicit requirement ID, criteria, status, evidence and next action in the gap register. |
| Stage 4 | Apply it to every eligible detail/context page; intentionally omit from roots and established tabs where location is already clear. |
| Stage 5 | Verify semantics, links, roles, narrow screens, focus, refresh/history and authenticated visual presentation; include in user sign-off. |
| Stage 6 onward | Preserve route and record-access rules; test ancestry as part of workflow deep links and regression. |
| Stage 12 | Include route ancestry and breadcrumb regressions in the final appropriate test matrix. |
| Stage 15 | Smoke-test representative eligible production detail paths after release. |

A breadcrumb task is not complete merely because a generic component exists. It is complete only when its eligible consumer routes are implemented, the exclusions are intentional, parent links work, the required automated checks pass, and available visual/runtime evidence is recorded.

## 5. Cross-module acceptance checklist

Apply the shared controls below to each of the nine modules and every active worksheet, not just the page that was edited.

| Control | Acceptance question |
|---|---|
| Ownership | Is this view owned by the correct module/workspace? |
| Route | Does the route/query select the correct view on direct load and refresh? |
| Navigation | Are selected state, parent path and browser history consistent? |
| Permission | Do server enforcement and role-visible actions agree? |
| Source | Are data, totals, timestamps and statuses from canonical sources? |
| Content | Is the primary working area clearly dominant and task-specific? |
| Actions | Does every enabled control do what its label promises? |
| States | Are loading, empty, no-match, unavailable, restricted, error, pending and success truthful? |
| Failure | Are retry, timeout, stale state and recovery handled without duplicate writes? |
| Privacy | Are sensitive fields, applicants, employee records, financial data and private documents scoped? |
| Responsive | Is the view usable at all applicable canonical widths without inaccessible hidden actions? |
| Accessibility | Are semantic structure, keyboard, focus, contrast, targets and text scaling addressed? |
| Regression | Are neighboring consumers and cross-module links retested? |
| Evidence | Is status backed by exact commit/test/runtime evidence and a named next action? |

### Module inventory minimums

- **Dashboard:** Overview, Performance, Analytics; every metric has source/period/units and truthful unavailable semantics.
- **Inbox:** Overview, Messages/categories/saved views, Follow-ups and Routing & Templates only where supported; canonical thread ownership and safe follow-up behavior.
- **Projects:** Overview/Registry, Tasks & Execution, Planning & Delivery, Content & Campaigns, Project Resources, Project Controls where supported; preserve canonical project/task state.
- **Clients:** Directory, Onboarding, Agreements, Service & Health and relevant record details; one canonical client identity and safe relation links.
- **Finance:** five approved areas and all existing worksheets; preserve accounting meaning, calculations, period locks, authorizations and reconciliation.
- **Team & Resources:** Team & Capacity, People Operations, Vendors & Freelancers, Time & Availability where supported; restrict HR and compensation data.
- **Documents:** Secure register, document detail/version, linked records, permission checks and object integrity.
- **Website CMS:** Supported content type/editor/publication states, Careers jobs and private Applicants; publication status must reflect actual confirmation.
- **Settings:** Implemented account, access, security/MFA, audit, integration and system controls; sensitive changes remain guarded.

## 6. Testing and evidence rules

For any claim, collect evidence appropriate to the layer:
- **Documentation:** accurate link, requirement ID and criteria.
- **Source:** exact component/route/API/service and behavior.
- **Automated test:** exact command/workflow run, commit SHA and pass/fail result.
- **Integration/E2E:** environment, role, record setup, actions and observed persisted outcome.
- **Visual/accessibility:** viewport, browser/context, state, screenshot or observable evidence, keyboard/accessibility results and limitations.
- **Production/deployment:** intended deployed SHA, authenticated or authorized workflow and live outcome.

Do not make screenshots of sensitive data available in public artifacts. Sanitize IDs and PII. If an environment is unavailable, mark that verification unverified and continue other authorized work that remains useful. A lack of production session does not justify a false pass, an authentication bypass, or abandoning unrelated source/test tasks.

## 7. Bulk commits, timeout recovery and final reporting

### Bulk commit rules
- Fetch the latest main just before writing.
- Check for concurrent changes so new work is not overwritten.
- Validate before commit with repository-supported checks relevant to the slice.
- Group the docs/source/tests that form one coherent requirement into a single commit where practical.
- Verify the exact commit SHA and current workflow outcomes after commit.
- Do not claim deployment unless Hostinger/runtime evidence confirms it.

### Timeout recovery
- Record last known main SHA, completed files, commit SHA if any, exact tests started/completed, CI run IDs and next unfinished checklist item.
- On resume, refetch main and the relevant files/CI.
- If a commit or workflow status is unknown, verify it before acting.
- Continue from the first unmet checkbox. Never restart already verified work simply because the session changed.

### Required report at every meaningful checkpoint

1. Stage and slice status.
2. Source-backed findings and user-visible behavior.
3. Changed files and exact commit SHA on main.
4. Checks actually run with exact pass/fail status and links.
5. Existing work preserved.
6. Requirements completed and gap IDs updated.
7. Remaining gaps, explicit blockers and what is unverified.
8. The next single action in canonical order.

## 8. Overall completion definition

The rollout is complete only when all in-scope requirements have passed their relevant acceptance criteria or are explicitly excluded with authorized agreement; all mandatory workflow, Finance, security, privacy, regression and E2E checks have evidence; backup/restore and production-readiness gates pass; the intended release is deployed and live smoke-tested; visual/content sign-off is recorded; and remaining risks/ownership are documented.

If any mandatory stage or release gate remains unverified, do not label the overall project complete or production-ready. Report the exact unmet gate and the next safe action.
