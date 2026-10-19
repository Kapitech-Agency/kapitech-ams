# AMS Execution Checkpoint

**Purpose:** Compact resume pointer for the current delivery effort. This is not a replacement for the roadmap, gap register, specifications, or current source.  
**Recovery procedure:** [AMS Resume After Timeout or Interruption Protocol](AMS-RESUME-AFTER-INTERRUPTION.md)  
**Canonical sequence:** [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md)  
**Requirement inventory:** [AMS Feature & Content Gap Register](AMS-FEATURE-CONTENT-GAP-REGISTER.md)  
**Repository:** `Kapitech-Agency/kapitech-ams`  
**Delivery branch:** `main`

> All SHAs and CI statuses below are dated snapshots, not live state. On every resume, fetch the current `main` HEAD and current workflow results before editing. Update this file after every meaningful slice.

## 1. Last verified code/test snapshot

Latest application/test snapshot verified on **19 October 2026**:

| Item | Evidence |
|---|---|
| Current main source/test commit | 72f6702777aefa5264f9de15dbcb72f8c674b9c1 |
| Current source commit | [refactor(clients): make retainer usage source-aware](https://github.com/Kapitech-Agency/kapitech-ams/commit/72f6702777aefa5264f9de15dbcb72f8c674b9c1) |
| Changed application source | src/pages/admin/AdminProjects.tsx; src/pages/admin/AdminClients.tsx; src/pages/admin/AdminContracts.tsx; src/pages/admin/AdminClientRetainers.tsx (Projects Planning, Directory/Client 360, Onboarding, Contracts & SOWs and Retainer usage states) |
| Regression tests | tests/projects-module-regression.test.ts; tests/ams-nine-module-workspace-regression.test.ts; tests/admin-pages-jsx-regression.test.ts; tests/ams-client-detail-data-state-regression.test.ts; tests/ams-scrollbar-and-table-regression.test.ts |
| AMS CI on prior verified SHA | **Passed before Retainers changes**: [run 39276355380 on 4f126899](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39276355380) |
| AMS Quality Gate on prior verified SHA | **Passed before Retainers changes**: [run 39276355335 on 4f126899](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39276355335) |
| Current SHA validation | **NOT VERIFIED**: Actions/check-runs/status queries returned no run/status for 72f6702777aefa5264f9de15dbcb72f8c674b9c1 at checkpoint time. Do not claim typecheck, regression, build or integration checks passed for this SHA. |

### Recent verified frontend slices

- [Settings backup-history correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba): desktop rows use per-snapshot verification; both workflows passed.
- [Dashboard monetary truthfulness correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/febd4f42a18718230dd2ebccec5b975a0083ef68): non-finite amounts show unavailable, not zero; both workflows passed.
- [Inbox applicant-presentation cleanup](https://github.com/Kapitech-Agency/kapitech-ams/commit/926291d005bbdef2c1e06779d28145d230606ddf): removed unreachable Careers-only UI while preserving the source filter and CMS route; both workflows passed.
- [Tasks local-date correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/af65907022d9973b3859145e0971bf22a6caf343): due-date defaults use local calendar fields; both workflows passed.
- [Planning tab query preservation](https://github.com/Kapitech-Agency/kapitech-ams/commit/444b9891b33e7891567341711dfa9a8d29866bf4): active Planning tabs preserve `planningProject`; both workflows passed.
- [Clients exports and Onboarding copy](https://github.com/Kapitech-Agency/kapitech-ams/commit/1ae8209b39ff65cc7cbb6c302ddc9815efc5720c): one visible scope-aware export handler, profile-only Onboarding columns, preserved Directory financial fields, truthful readiness copy; both workflows passed.
- [Retainer default dates and renewal date-only handling](https://github.com/Kapitech-Agency/kapitech-ams/commit/88d7804dfc2d9f73fd2afeb16bd33d08b54519a1) with corrected regression coverage at [`4e57c8b4b8d7b3aabf3393b48499627db2015b40`](https://github.com/Kapitech-Agency/kapitech-ams/commit/4e57c8b4b8d7b3aabf3393b48499627db2015b40): create/reset defaults use the local calendar; Renewal Schedule uses validated date-only calendar arithmetic and date rendering. Due today counts as day 0, day 30 is included, invalid dates are excluded from the summary and no longer gain a warning by null coercion, and the entered date remains stable at negative UTC offsets. The new tests exercise Jakarta day boundaries, the 0/1/30/31-day cases and Honolulu date display.

The first validation attempt on source commit [`88d7804dfc2d9f73fd2afeb16bd33d08b54519a1`](https://github.com/Kapitech-Agency/kapitech-ams/commit/88d7804dfc2d9f73fd2afeb16bd33d08b54519a1) failed because an older responsive-retainer test asserted the prior `renewalDays(item.renewal) <= 30` implementation expression. The fix commit `4e57c8b4b8d7b3aabf3393b48499627db2015b40` updated that assertion to verify the shared highlight helper, invalid-date guard, both responsive styles and inclusive 0–30-day summary filter. It did not remove the test or loosen its behavior checks. Both workflows passed on the follow-up SHA.

This checkpoint is a dated evidence pointer, not a live branch status feed. Re-fetch `main` and exact workflow results before acting; docs-only commits do not change the source/test snapshot that was tested.

## 2. Active delivery stage

**Stage 4 — Main-content hierarchy across all nine modules: in progress.**

The gap register's snapshot for `AMS-MAIN-CONTENT-STRUCTURE-001` recorded some Dashboard, Inbox, Projects Overview and Clients slices as source/test-verified, with other workspaces and worksheets open. This should not be treated as a complete summary of every later commit already on `main`.

Recent repository history includes further work/tests for **Website CMS, Finance and Settings**. On resume, compare recent commit diffs with current code/tests and update the relevant gap rows/traceability/progress notes before selecting the next content slice. Do not repeat completed work simply because a summary has not caught up.

### Scope to preserve

- Approved nine-module navigation is considered implemented; do not build it again.
- Stage 4 is a task-based structural overhaul, not cosmetic polishing. Follow `docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md` and `docs/AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md`.
- Work in bounded, source-backed, tested slices. Commit directly to `main` when supported and authorized.
- Do not opportunistically change backend/API/database/schema/auth/session/CSRF/MFA/RBAC, Finance calculations/postings, permissions, provider contracts, or established business logic during the structural/UI stage.
- Stage 5 visual/responsive/accessibility review and **explicit user sign-off** remain a mandatory gate before broad Stage 6 work.

## 3. Immediate resume sequence

Re-verify live source and CI on every resume; this list is a dated recovery pointer.

1. **Rehydrate:** fetch current `main`, recent history, relevant source and exact current CI/Quality Gate results.
2. **Preserve verified slices:** Settings backup history, Dashboard money fallback, Inbox applicant ownership, Tasks local dates, Planning query context, Clients scope-aware exports/evidence-based Onboarding copy, Retainer local-date defaults and Renewal Schedule calendar-day handling have successful exact-SHA evidence.
3. **Continue structural main-content redesign, not ad hoc gap chasing:** follow [AMS Frontend Structural Redesign Audit & Execution Specification](AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md) and [AMS Main-Content Restructuring Specification](AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md). Projects Planning/Resources, Clients Directory/Client 360, Lead-register Onboarding and Contracts & SOWs have source/test evidence. Retainers source/test slice is committed at 72f6702777aefa5264f9de15dbcb72f8c674b9c1, but its exact-SHA CI has not surfaced. Next action: obtain verifiable CI on 72f6702777aefa5264f9de15dbcb72f8c674b9c1 before progressing to Renewal Schedule. Contract History remains unavailable until a versioned canonical history source is verified.
4. **Validate one bounded slice:** inspect current source/tests and gap row, make the smallest complete change, retain negative-path regression tests, verify both CI workflows on the source/test SHA, then update checkpoint and gap evidence.
5. **Release gate remains closed:** authenticated browser/viewport/accessibility review and explicit user sign-off are still required at Stage 5. No authenticated screenshot or browser visual/keyboard/touch test has been performed in this execution. Do not start broad Stage 6 workflow/backend implementation before approval.

## 4. Checkpoint update template

Update the current fields after each substantial slice. Keep the file concise and operational.

- **Updated at:** YYYY-MM-DD HH:MM UTC
- **Stage / slice:** one roadmap stage and one bounded requirement/module/workspace
- **Current main HEAD:** full SHA + commit link (dated live snapshot)
- **Last verified commit:** full SHA + exact verified outcome
- **Changed paths:** file list or commit link
- **Tests/checks:** exact command or job, result, and run link
- **Unverified items/blockers:** precise evidence and impact
- **Gap/traceability updates:** requirement IDs and links
- **Last completed acceptance item:** one concrete statement
- **Next single action:** one actionable step
- **User decision/sign-off:** requirement and gate, or “none”
- **Environment limits:** browser/runtime/access limits only when actually applicable

Do not replace evidence with generic phrases such as “continued”, “fixed”, “done”, or “looks good”.

## 5. Current next-action rule

For the structural main-content objective, also follow [AMS Frontend Structural Redesign Audit and Execution Specification](AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md). Do not treat date/CSV/copy/query bug fixes as structural redesign completion. Implement the selected view's structure contract, validate the actual composition, and preserve the Stage 5 user sign-off gate.



When the user says “lanjutkan” or similar, do not ask them to restate the task and do not give only another prompt or plan. Follow [the resume protocol](AMS-RESUME-AFTER-INTERRUPTION.md), inspect the current source and CI, carry forward completed work, execute the next authorized action, and report the precise verified checkpoint. Stop only for a genuine decision, mandatory sign-off gate, or blocker that cannot be resolved safely within the existing authorization.

### Current Stage 4 structural checkpoint · 19 October 2026

- Verified source/test commit: 5bc5d601ae95090b14ef7a43cfd3ea52e7a08aa5 (exact-SHA AMS CI and Quality Gate passed in the table above).
- Structural change: Projects → Planning & Delivery → Project Brief now places the selected project scope before worksheet tabs and consolidates the brief into one notes-first structured detail surface plus source-backed context; duplicate context and coverage panels were removed.
- Visual status: NOT VERIFIED. No authenticated browser screenshots or viewport/keyboard session were captured; Stage 5 sign-off remains required.
- Next single action: implement the next source-backed structural slice in canonical Projects order, Project Resources (VIEW-PROJECTS-RESOURCES). Keep unsupported Content & Campaigns and Project Controls unavailable.

### Current Stage 4 structural checkpoint · 19 October 2026

- Verified source/test commit: 17e9b6a7f5a77548c5d27327c1cbd71f3b1eeac1; exact-SHA AMS CI 39262004358 and Quality Gate 39262004291 passed.
- Structural changes: Project Brief scope selector precedes worksheet navigation and the primary brief centers recorded notes plus a compact source-backed context list. Project Resources leads with the explicit allocation register, keeps project roster/task assignments separate, removes duplicate KPIs and does not infer capacity from assignment counts.
- Browser status: NOT VERIFIED. No authenticated browser screenshots or viewport/keyboard session were captured; Stage 5 sign-off remains required.
- Next single action: explicitly verify Planning & Delivery → Milestones structure against its worksheet contract, preserve it if it already fits, then assess Timeline before proceeding to the next Projects workspace.

### Current Stage 4 structural checkpoint · 19 October 2026

- Verified source/test commit: cc9c46c82f7a5e514371683142b2c4725e28e8c2. Exact-SHA AMS CI [39263459463](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39263459463) and Quality Gate [39263459363](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39263459363) both passed.
- Structural slices: Project Brief, Project Resources, Milestones field-boundary messaging, and Timeline using actual recorded task/milestone due dates. No backend, API, schema, auth/permissions, or domain transitions changed.
- Unsupported features remain unavailable: Content & Campaigns has no verified canonical project/campaign relation; Project Controls has no verified canonical risk/change/control records.
- Browser status: NOT VERIFIED. No authenticated browser screenshots or responsive/keyboard session was captured; Stage 5 sign-off remains required.
- Next single action: complete source evidence for Content & Campaigns and Project Controls blockers, then begin Clients → Directory structural review/implementation.

### Current Stage 4 structural checkpoint · Clients Directory and Client 360 · 19 October 2026

- Verified source/test commit: 088a3cadd4260f89a040f876daf2404e602cb1c5. Exact-SHA AMS CI [39269329377](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39269329377) and Quality Gate [39269329548](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39269329548) both passed.
- Structural work: removed duplicate Clients Directory KPI strip/calculation, made recorded retainer/renewal context visible in the account register, and added Client 360 linked-record panels for Projects, Inbox conversions, Finance invoices and Documents using explicit relationships and existing permission scopes.
- Source boundaries: no new contact master, account owner model, onboarding evidence or approval state was fabricated. Project Campaigns/Project Controls remain unavailable due missing canonical data models.
- Browser status: NOT VERIFIED. Authenticated drawer, role, keyboard, responsive and CSV download verification remain Stage 5 work; user sign-off is still required before broad Stage 6+.
- Next single action: continue to Clients → Onboarding. Verify checklist/evidence readiness requirements against current model and preserve unavailable worksheets where canonical records are absent.

### Current Stage 4 structural checkpoint · Clients Onboarding Lead register · 19 October 2026

- Verified source/test commit: 952203b70ead573edf994d7a53e51ab46eab12fe. Exact-SHA AMS Quality Gate [39273628833](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39273628833) and AMS CI [39273628957](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39273628957) passed.
- Structural result: onboarding scope uses a named Lead register/mobile card pattern with primary contact, recorded email/phone, industry/location, Lead status and created/updated dates instead of normal Directory billing/spend-cap context. Directory scope remains unchanged. URL scope, existing actions and data semantics are preserved.
- Boundary: checklist, required-document evidence, owner/due-date requirements and kickoff readiness are absent from the canonical model. Those worksheets remain unavailable. No browser evidence has been captured; Stage 5 user sign-off is still required.
- Next single action: continue to Clients → Agreements and assess the four documented agreement areas against current sources.

### Current Stage 4 structural checkpoint · Clients Agreements / Contracts & SOWs · 19 October 2026

- Verified source/test commit: d0109ce94a1a9d6d2cd854771c9be4c9c8545e0c. Exact-SHA AMS Quality Gate [39275162228](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39275162228) and AMS CI [39275162214](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39275162214) both passed.
- Structural result: Contracts & SOWs retains its search/filter/lifecycle register; new View details actions on mobile/desktop open a read-only Drawer for the current saved agreement, canonical terms/deliverables, value/date/client/project context and saved document link.
- Boundary: Contract History is not simulated. A versioned canonical history/event source remains unverified. Existing permission, draft, transition and deletion paths remain unchanged.
- Browser status: NOT VERIFIED. Actual drawer reflow/keyboard/role behavior requires Stage 5 browser review and user sign-off.
- Next single action: assess and structurally continue Clients → Agreements → Retainers & Service Commitments. Keep Renewal Schedule's source boundaries and Contract History unavailable where their models do not support more.

### Current Stage 4 structural checkpoint · Clients Retainers & Service Commitments · 19 October 2026

- Current main SHA: 72f6702777aefa5264f9de15dbcb72f8c674b9c1.
- Structural change: retainer field presence is preserved; missing terms are no longer shown as zero/default tier/cycle. Usage and remaining hours need recorded used hours and a positive commitment. A distinct Usage unavailable state is filterable. The duplicate lower burn/near-cap/average-overage grid is removed; the compact KPI strip explains incomplete coverage.
- Protected behavior: Client Directory remains the canonical source; existing api.clients.update path remains unchanged. No Time Logs reconciliation, Finance formulas, billing rules, period model, service-scope or carryover records were added.
- Verification blocker: no check-runs, commit statuses or workflow run surfaced for this exact SHA. Prior SHA 4f12689991735c8707059f17eba3d644996b4f22 passed AMS CI/Quality Gate before the Retainers change. Do not mark the current slice CI-verified yet.
- Browser status: NOT VERIFIED. Stage 5 role/reflow/keyboard and actual downloaded-report checks remain.
- Next single action: establish typecheck, regression, build and CI evidence for 72f6702777aefa5264f9de15dbcb72f8c674b9c1 before Renewal Schedule.

