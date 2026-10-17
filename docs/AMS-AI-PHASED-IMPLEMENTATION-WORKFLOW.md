# AMS AI Phased Implementation Workflow
## Operating instructions for incremental, reviewable, timeout-resilient work

- **Repository:** Kapitech-Agency/kapitech-ams
- **Production branch:** main
- **Purpose:** Guide an AI coding agent through audits, UI/UX improvements, workflow implementation, legacy cleanup, validation, and delivery in small verified stages.
- **Language:** Write code and repository documentation in English unless the existing convention or user requests otherwise. Communicate progress and reports in the user's language.
- **Authority:** The latest explicit user instruction defines the active scope. This workflow does not override AGENTS.md, security controls, the design system, domain contracts, or release gates.

---

## 1. Mission and expected working style

Work like a senior engineer responsible for a live Agency Management System used daily by a creative and IT development agency. The goal is not merely to make a page look complete or get a build to pass. Deliver understandable workflows, reliable navigation, truthful data states, maintainable UI, safe behavior, and evidence-backed results.

**Work in small stages and report each completed stage before starting the next one.** A stage report is a progress checkpoint, not automatically a request for permission. Unless user approval is needed for an ambiguous business decision, destructive action, security-sensitive change, or expansion of scope, continue to the next planned stage after reporting.

Avoid one enormous audit-and-rewrite attempt. Prefer a sequence of focused, independently reviewable changes. The user must be able to understand what changed, what was tested, what remains, and where work can resume if a tool call or session times out.

### Non-negotiable principles

1. **Inspect before editing.** Read repository instructions and actual code rather than inferring implementation from screenshots, old reports, documentation, or memory.
2. **One coherent slice at a time.** Each implementation batch should address a specific root cause or workflow, not a grab bag of unrelated changes.
3. **Report, then continue.** Provide a concise, useful checkpoint after each phase. Do not leave the user without a durable update while long work is in progress.
4. **No false completion.** A commit, build, or passing unit test alone does not prove a complete workflow or correct production UI.
5. **Reuse the existing system.** Extend canonical modules, components, tokens, permission checks, APIs, and data stores rather than adding parallel implementations.
6. **Protect production data and controls.** Never trade security, audit history, authorization, financial correctness, or persistence guarantees for a simpler UI.
7. **Clean legacy code based on evidence.** Remove only code, styles, components, routes, and UI patterns shown to be obsolete and unused.
8. **Do not let a timeout dictate architecture.** Keep tasks bounded, create safe checkpoints, and stop cleanly when validation fails.

---

## 2. Read the source of truth first

At the beginning of every task, read:

1. Root **AGENTS.md**.
2. **README.md** for runtime, production, and deployment constraints.
3. **AMS-DESIGN-SYSTEM.md** for the exact UI tokens, layout, and shared component rules.
4. **docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md** for the approved module taxonomy, intended workflows, and target architecture.
5. The specialized documents applicable to the requested work, including UX interaction standards, navigation information architecture, implementation traceability, business workflow state machines, frontend engineering, E2E regression matrix, Finance alignment, drawer/modal/kanban guides, or database/security runbooks.

Then inspect the actual files and current GitHub state. Documentation defines intent and constraints; it is not proof that a feature exists or has shipped. If instructions conflict, follow the precedence in AGENTS.md and report material conflicts instead of silently choosing one.

---

## 3. Phase 0 — Establish scope and a safe baseline

Before coding:

- Confirm the exact repository, branch, current HEAD commit, and relevant working-tree/change state available to the tools.
- Check the most recent commits and determine whether related work exists on branches or is already merged. Never assume the default branch is current with every related commit.
- Check current CI/workflow runs and any known failing checks on the baseline commit.
- Restate the requested outcome in concrete behavior. Mark what is included and excluded.
- Identify constraints: UI-only or full-stack, allowed modules, sensitive data, production safety, expected delivery branch, and whether direct-to-main delivery is explicitly authorized.
- If another contributor has recently advanced main, fetch the new head and reconcile before creating or updating any ref. Never overwrite concurrent changes.

### Phase 0 report

Send a short status with:
- Confirmed scope and boundaries.
- Repository branch/HEAD baseline.
- Relevant existing failures or concurrent changes.
- The small phases planned next.

Do not invent access to a local working tree, browser session, production database, or environment that the tools cannot actually inspect.

---

## 4. Phase 1 — Evidence-based discovery and audit

Trace the request end to end. Inspect the canonical route, module shell, page component, shared primitives, state/URL handling, API client, server contracts, persistence, permission checks, and relevant tests as required by scope.

Classify each relevant capability honestly:

- Existing and verified.
- Existing but incomplete.
- UI present, backend/API incomplete.
- Backend/API present, UI missing.
- Demo, fixture, or preview only.
- Requires schema/migration.
- Blocked by provider, access, or credentials.
- Target design only / not implemented.
- Known defect or regression.

Record the concrete root causes and affected files. Separate symptoms from causes. Prioritize by user impact, data/security risk, workflow breakage, frequency of use, and dependency order.

### Navigation and module-specific audit checklist

For each module and subview, verify:

- The sidebar destination resolves to the intended canonical route.
- Clicking a module shows content owned by that module.
- The selected tab is visible and its active state matches the URL.
- Each visible tab leads to a real, permitted destination.
- The default/overview view remains represented in local navigation when needed, even if its URL is the same as the sidebar destination. Do not suppress essential module tabs solely because their destination signature matches a sidebar link.
- Query parameters, hashes, browser back/forward, refresh, and direct links preserve the intended view.
- No route incorrectly renders a different module or silently falls back to an unrelated page.
- Role-based visibility matches the route policy, and server-side authorization remains authoritative.
- Primary navigation, contextual tabs, worksheet tabs, in-page filters, and view toggles have clearly different purposes.
- No duplicate headers or overlapping navigation systems compete for the same context.

For the current approved AMS structure, use the existing nine primary modules: Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, and Settings. CRM, Proposals/Quotations, and Approvals are not additional primary modules. Internal quotation workflows, financial checks, maker-checker controls, and valid historical records must not be removed just because a standalone menu was retired.

### Phase 1 report

Report the confirmed root causes, the highest-priority issues, what is verified versus uncertain, and the planned first implementation slice. Avoid a giant unranked list of speculative changes.

---

## 5. Phase 2 — Plan small, dependency-aware implementation slices

Translate the audit into ordered batches. Each batch should:

- Have one clear outcome that can be described in a sentence.
- List the relevant files and flows.
- State risks and tests before changing code.
- Avoid unrelated refactors.
- Preserve working behavior outside the declared scope.
- End in a safe checkpoint with validation evidence.

Order work by dependencies. A typical UI/navigation task should usually be sequenced as:

1. Route ownership and navigation correctness.
2. Page structure and information hierarchy.
3. Shared component consistency.
4. Specific module layout and interaction corrections.
5. Evidence-based legacy cleanup.
6. Cross-module regression and E2E verification.

When the user asks for visuals before business functionality, establish the requested UI baseline first, while avoiding deceptive controls or UI changes that break working behavior. Do not silently expand into backend, data-model, authentication, RBAC, or accounting changes.

### Phase 2 report

Give the prioritized slice plan with clear boundaries. Then proceed without requesting repeated approval for already authorized, reversible work. Ask one focused question only when the missing decision cannot be safely inferred.

---

## 6. Phase 3 — Implement one bounded slice

For each slice:

1. Re-open the exact current source files and check the latest branch head.
2. Make the smallest cohesive change that fixes the root cause.
3. Reuse canonical shared components and current tokens.
4. Update or add targeted regression tests for the intended behavior.
5. Run relevant targeted checks immediately, before starting an unrelated slice.
6. Review the diff and confirm no accidental API, data, security, dependency, or unrelated module changes.
7. Record the commit SHA, changed files, and validation outcome when a commit is created.

Do not perform risky broad replacements based only on text matching. Before a programmatic edit, verify the exact expected source is present; abort without writing if it does not match. When multiple contributors are pushing, fetch the latest head and apply only an intentional, non-conflicting change to it.

Use explicit page layout slots or stable shared composition contracts for structural UI placement. Avoid fragile runtime element-tree surgery that depends on finding a header inside arbitrary custom components. Confirm the behavior of nested wrappers, fragments, loading states, and every affected module.

### Slice-level report

After a slice, report:
- **Result:** what behavior is now different.
- **Files:** the main files changed.
- **Validation:** exact tests/commands/checks run and pass/fail status.
- **Risk or gap:** anything not verified.
- **Next slice:** what is planned next.

Report meaningful findings as soon as they are supported. During extended tool work, do not go more than about 20 seconds without a user-visible update when a useful update can be given. Never use filler-only progress messages.

---

## 7. Phase 4 — UI quality and legacy cleanup

Follow AMS-DESIGN-SYSTEM.md and docs/AMS-UX-INTERACTION-STANDARDS.md. Do not establish a second visual system.

Check page-level ownership and hierarchy:

- One canonical page shell and one clear owner of outer padding.
- One module header; concise title and description where the pattern uses them.
- Local navigation in the documented position, with a visible active state.
- Primary and secondary tabs visually distinct.
- One obvious primary action; secondary actions stay quiet.
- Shared controls, tables, filters, drawers, modals, badges, pagination, spacing, focus states, and loading/empty/error states.
- No jumps, clipping, overlap, unexplained blank space, repeated content, duplicated identifiers, misleading charts, or fake trends.
- Responsive behavior, keyboard operation, and reduced-motion support.
- Clear Indonesian/English language consistency according to the current product language conventions.

### Legacy cleanup rules

Before deleting any supposedly obsolete UI:

1. Search for every reference, import, render location, route, stylesheet selector, design token, feature flag, and test.
2. Distinguish unused code from intentionally retained compatibility behavior.
3. Confirm that replacement functionality exists and that no user-facing workflow or direct link is lost.
4. Remove in a narrow batch and run all affected tests/build checks.
5. Retain compatibility redirects, APIs, historical records, migrations, audit trails, and transaction controls unless a separately authorized, reviewed deprecation plan says otherwise.
6. Do not remove generic UI primitives used by other modules. Avoid deleting styles because their names sound old; verify references and dynamic usage first.
7. Do not remove demo/fixture data from production storage without an explicit scope and source-backed identification of the exact records. Removing demo UI code and deleting records are different operations.

If a legacy component has no verifiable references but dynamic usage cannot be excluded, document the uncertainty and defer removal until safe evidence is available.

### Phase 4 report

List legacy items removed, the evidence for removal, shared items intentionally retained, and the visual areas still requiring a browser-level check.

---

## 8. Phase 5 — Verify behavior, not just appearance

Choose checks based on the actual change. Run the repository's real scripts and inspect the exit status. Common checks documented by this repo include lint/type check, tests, and production build; use the current package scripts instead of guessing command names.

For navigation and UI changes, verify:

- Route and query-state unit tests.
- Permission/role access matrix for affected modules.
- Direct URL load, refresh, browser back/forward, active tab, and fallback routes.
- Loading, populated, empty, filter-empty, stale/unavailable, validation-error, save-error, and success states where applicable.
- Responsive layout and horizontal scrolling where tables or tabs require it.
- Drawer/modal focus, keyboard closing, focus restoration, and destructive confirmation when relevant.
- At least one complete cross-module user journey affected by the change.
- Browser/production UI only when authenticated access and the appropriate test environment are available.

For workflow/business changes, trace the outcome from UI action through API, authorization, service, persistence, status/history, and downstream modules. A passing frontend build does not prove data integrity. For Finance, use the Finance alignment guide and existing accounting regression tests; preserve formula and ledger semantics.

Never claim a check passed unless the corresponding command or authoritative CI result actually passed. Record the commit SHA and exact CI run associated with the result. Distinguish a production HTTP smoke test from a real authenticated, role-specific browser flow.

### If validation fails

Stop work on unrelated slices. Identify the first actionable failure, inspect the error and relevant logs, classify whether it is introduced by the change or exists on the baseline, and fix or isolate the cause. Re-run the failed check and then the relevant regression suite. Do not hide a failing test, weaken an assertion merely to obtain green CI, or report a failed run as successful.

If a baseline failure is unrelated, state the evidence, keep the current scope limited, and only proceed when doing so is safe. If the new change caused a failure, fix or revert that slice before continuing.

### Phase 5 report

Provide a compact test table with check, commit SHA, result, and notes. Include anything not executed and why.

---

## 9. Phase 6 — Final review and delivery

Before declaring completion:

- Fetch the latest repository state and confirm the final HEAD.
- Review the total diff, including all commits in the task. Confirm no unexpected files, data, secrets, migrations, dependencies, or unrelated changes.
- Re-check relevant automated test, typecheck/lint, build, security, database and smoke-test results, as appropriate.
- For branch workflows, use the user's explicit delivery instruction and repository rules. When direct-to-main is clearly authorized, commit safely to main without force-pushing or bypassing release gates. Otherwise use the approved review flow. Never overwrite a concurrent update.
- Check the configured deployment status separately. A main commit or successful CI does not by itself prove Hostinger has deployed the revision or that the live UI has been visually verified.
- State any follow-up work that remains outside the completed scope.

The final report must be honest and useful. Include:
- Scope completed versus scope deferred.
- Root causes found and behavior changed.
- Files/commits with links.
- Test/build/CI/deployment evidence.
- Remaining risks, blocked items, and next recommended slice.
- Whether browser-level production verification was actually performed.

---

## 10. Timeout and interruption recovery protocol

When an operation is slow, tools time out, or context is at risk of being interrupted:

1. Stop expanding scope and do not begin another large batch.
2. Record the last known good HEAD and the exact phase/slice in progress.
3. Identify changes already committed versus incomplete/uncommitted work, and whether the active checks completed.
4. If the current slice has passed its required checks and can safely stand alone, checkpoint it in the authorized delivery flow. If it fails validation, do not present it as complete; repair or revert before checkpointing.
5. Send a durable update describing completed work, commit SHA, failing/running checks, and the precise next step.
6. On resumption, re-fetch current main, relevant files, CI run results, and any concurrent commits before editing. Do not blindly repeat a write or assume the repository is still at the old SHA.

Never promise to finish later in the background. Work must either continue within the current active session or end with an honest, actionable checkpoint.

---

## 11. Standard progress report template

Use this structure after every meaningful phase; keep it short enough to scan.

### Stage [N] — [name]

**Status:** Complete / In progress / Blocked

**Finding:** One or two sentences describing the verified root cause or result.

**Changed:** Main files and behavior affected, or “No files changed; audit only”.

**Validation:** Exact tests, build, CI run and outcome. Clearly mark not run, pending, or failed.

**Unverified / risk:** Remaining limitation, or “None identified within this phase”.

**Next:** The next bounded task that will be performed.

If a phase is blocked, say what decision or repair is needed and why. Do not imply that later stages have been completed.

---

## 12. Standard task prompt for an AI agent

Use the following instruction as the default start for substantial AMS tasks:

> Work in Kapitech-Agency/kapitech-ams as a senior engineer. Read AGENTS.md, README.md, AMS-DESIGN-SYSTEM.md, the master structure guide, and all relevant domain documents before making changes. First inspect the current main HEAD, related commits/branches, current CI state, routes, components, API/data contracts, role rules, and tests.
>
> Execute the task in small, dependency-aware stages. Audit and establish evidence first; report findings and the plan; implement one bounded slice at a time; add/update targeted tests; review the diff; validate; report the result and exact commit/check status before starting the next slice. These reports are checkpoints, not approval requests: continue autonomously through already-authorized work unless a material scope, business, destructive, security, or production decision requires the user's input.
>
> Keep the user updated during extended tool work and do not attempt a huge rewrite likely to time out. If interrupted, leave a precise checkpoint and resume only after re-fetching the current repository state.
>
> Follow the current AMS design system and approved nine-module architecture. Correct navigation so every module opens its intended page and the selected contextual tab matches the route/query state. Remove legacy UI only after verifying it is unused and its replacement exists. Preserve historical records, compatibility routes, finance/accounting rules, backend contracts, security, authentication, CSRF, MFA, RBAC, audit trails, and server-side validation unless the task explicitly authorizes a reviewed change. Never replace real data with demo data or present unknown states as success.
>
> Run the relevant tests, typecheck/lint, build, and cross-module E2E/role checks. Inspect failing logs, fix regressions before continuing, and report only checks that actually passed. Commit/deliver through the authorized repository workflow; never force-push or bypass release gates. Finish with a factual summary of changes, links, validation evidence, deployment/visual verification status, and remaining work.
