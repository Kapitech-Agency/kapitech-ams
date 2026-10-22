# AMS Execution Checkpoint

**Repository:** `Kapitech-Agency/kapitech-ams`  
**Delivery branch:** `main`  
**Canonical roadmap:** [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md)  
**Recovery protocol:** [AMS Resume After Timeout or Interruption Protocol](AMS-RESUME-AFTER-INTERRUPTION.md)  
**Current task:** Stage 4, main-content structural redesign. Stage 5 visual/accessibility review and explicit user sign-off remain mandatory before broad Stage 6+ work.

> This checkpoint is an evidence snapshot, not live branch state. Refresh `main`, current workflow status, and source/tests on every resume. This documentation update follows the application/test snapshot below.

## 1. Latest application/test snapshot

Snapshot reconciled on **22 October 2026**.

| Item | Evidence |
|---|---|
| Application/test SHA | [b082e2854f15696d393ac9d15c0c7b8e49ee1a3a](https://github.com/Kapitech-Agency/kapitech-ams/commit/b082e2854f15696d393ac9d15c0c7b8e49ee1a3a) |
| Structural implementation | [Capacity Allocation redesign, 07148c26](https://github.com/Kapitech-Agency/kapitech-ams/commit/07148c261bca145dde962f2a93519378f52c6074) |
| Regression updates | [Source-state assertions, 6a5b503d](https://github.com/Kapitech-Agency/kapitech-ams/commit/6a5b503dd9c4e852a2cad8ed54b30efcdb33bb5b); [workspace hierarchy regression, b082e285](https://github.com/Kapitech-Agency/kapitech-ams/commit/b082e2854f15696d393ac9d15c0c7b8e49ee1a3a) |
| Changed source/test paths | `src/pages/admin/AdminTeams.tsx`; `tests/team-resource-data-availability.test.ts`; `tests/frontend-functional-regression.test.ts` |
| AMS Quality Gate | **Passed** on the application/test SHA: [run 39797152426](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39797152426). |
| AMS CI | [run 39797152441](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39797152441). At the latest query, the workflow aggregate still reported `in_progress` (last API update 22 Oct 2026 14:38:50 UTC). The job logs show 762 passed, 0 failed, 20 skipped across 782 tests, plus PostgreSQL integration 8/8 passed. Lint/type-check, migrations, security tests, dependency audit, production build, packaged-migration check and production HTTP smoke test all logged success. Do not represent the workflow as concluded until the Actions status says completed. |
| Visual/runtime evidence | **Not captured:** no authenticated browser session for the target role, viewport screenshots, or keyboard/touch review. Stage 5 remains pending. |

## 2. Active stage and scope

**Stage 4 — Main-content hierarchy across all nine modules: in progress.**

Navigation is treated as completed and must not be rebuilt. Use the main-content restructuring specification for page hierarchy, the Design System for visual geometry/tokens, the roadmap for stage order, and the gap register for implementation status. The reviewed Shadcn Admin archive and external admin templates remain comparative references only. Do not transplant generic navigation, theme, demo data or dependencies.

Scope for this frontend stage: content hierarchy, existing shared components, frontend regression coverage and documentation. Preserve current routes, source ownership, supported actions, API/data contracts, permission boundaries, authentication/security, and Finance calculations/posting behavior. Do not invent availability, leave, HR lifecycle, skills, utilization, or allocation records where canonical sources are absent.

## 2.1 Latest validation findings

The first validation run on the new Capacity Allocation layout surfaced two obsolete source-shape expectations:

1. `tests/team-resource-data-availability.test.ts` expected the former generic `Capacity data unavailable` text. Commit `6a5b503d` now asserts the specific project-allocation and time-log unavailable messages.
2. `tests/frontend-functional-regression.test.ts` expected the removed `Historical tracked utilization` KPI. Commit `b082e285` now verifies the saved allocation register and its position ahead of historical time, while retaining assertions for persisted allocation updates and route/source contracts.

These test updates preserve behavior coverage. Exact-SHA Quality Gate is green. AMS CI has green step-level log output and zero test failures, but its aggregate completion still needs refresh and confirmation.

## 3. Immediate resume sequence

1. Refresh the live `main` HEAD and recent commits, then confirm the aggregate result for [AMS CI run 39797152441](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39797152441). Do not trust this timestamp without re-querying.
2. Preserve the Team Directory work at [06a07096](https://github.com/Kapitech-Agency/kapitech-ams/commit/06a0709642ca18e226676484bb78e9cbf1d16d3f) and Capacity Allocation at [07148c26](https://github.com/Kapitech-Agency/kapitech-ams/commit/07148c261bca145dde962f2a93519378f52c6074). The planning register lists saved project-member plans with role/context, percentage, reference hours/week and date range; historical tracked time is separate.
3. Keep `VIEW-TEAM-CAPACITY` partially complete until Stage 5 role-aware visual, responsive and keyboard checks are recorded. `Availability & Workload` lacks a verified calendar/approved-leave source. `People Operations` remains missing; do not create HR or leave workflows from browser-only state.
4. After reconciling workflow status and checkpoint/gap evidence, move to the next supported structural view in canonical order. Treat unavailable People Operations/Availability dependencies as explicit blockers; proceed to supported Vendors & Freelancers scope only after confirming its current source, route and permission contracts.
5. Stage 5 visual/responsive/accessibility review and **explicit user sign-off** remain a hard gate before broad Stage 6 workflow/data/API work. No authenticated visual or keyboard evidence has been captured in this run.

## 4. Required update fields for the next slice

- Updated date and current live main SHA.
- Roadmap stage and one bounded view/requirement ID.
- Source/test commits and changed paths.
- Exact-SHA CI/Quality Gate links and aggregate result.
- Source-backed behavior verified, plus unverified browser/accessibility evidence.
- Gap-register status, blockers and next single action.
- Confirmation that Stage 5 approval is still required.

Do not use “done” or “verified” as a substitute for test, workflow or runtime evidence.

### Historical Stage 4 structural checkpoint · 19 October 2026

- Verified source/test commit: 5bc5d601ae95090b14ef7a43cfd3ea52e7a08aa5 (exact-SHA AMS CI and Quality Gate passed in the table above).
- Structural change: Projects → Planning & Delivery → Project Brief now places the selected project scope before worksheet tabs and consolidates the brief into one notes-first structured detail surface plus source-backed context; duplicate context and coverage panels were removed.
- Visual status: NOT VERIFIED. No authenticated browser screenshots or viewport/keyboard session were captured; Stage 5 sign-off remains required.
- Next single action: implement the next source-backed structural slice in canonical Projects order, Project Resources (VIEW-PROJECTS-RESOURCES). Keep unsupported Content & Campaigns and Project Controls unavailable.

### Historical Stage 4 structural checkpoint · 19 October 2026

- Verified source/test commit: 17e9b6a7f5a77548c5d27327c1cbd71f3b1eeac1; exact-SHA AMS CI 39262004358 and Quality Gate 39262004291 passed.
- Structural changes: Project Brief scope selector precedes worksheet navigation and the primary brief centers recorded notes plus a compact source-backed context list. Project Resources leads with the explicit allocation register, keeps project roster/task assignments separate, removes duplicate KPIs and does not infer capacity from assignment counts.
- Browser status: NOT VERIFIED. No authenticated browser screenshots or viewport/keyboard session were captured; Stage 5 sign-off remains required.
- Next single action: explicitly verify Planning & Delivery → Milestones structure against its worksheet contract, preserve it if it already fits, then assess Timeline before proceeding to the next Projects workspace.

### Historical Stage 4 structural checkpoint · 19 October 2026

- Verified source/test commit: cc9c46c82f7a5e514371683142b2c4725e28e8c2. Exact-SHA AMS CI [39263459463](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39263459463) and Quality Gate [39263459363](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39263459363) both passed.
- Structural slices: Project Brief, Project Resources, Milestones field-boundary messaging, and Timeline using actual recorded task/milestone due dates. No backend, API, schema, auth/permissions, or domain transitions changed.
- Unsupported features remain unavailable: Content & Campaigns has no verified canonical project/campaign relation; Project Controls has no verified canonical risk/change/control records.
- Browser status: NOT VERIFIED. No authenticated browser screenshots or responsive/keyboard session was captured; Stage 5 sign-off remains required.
- Next single action: complete source evidence for Content & Campaigns and Project Controls blockers, then begin Clients → Directory structural review/implementation.

### Historical Stage 4 structural checkpoint · Clients Directory and Client 360 · 19 October 2026

- Verified source/test commit: 088a3cadd4260f89a040f876daf2404e602cb1c5. Exact-SHA AMS CI [39269329377](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39269329377) and Quality Gate [39269329548](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39269329548) both passed.
- Structural work: removed duplicate Clients Directory KPI strip/calculation, made recorded retainer/renewal context visible in the account register, and added Client 360 linked-record panels for Projects, Inbox conversions, Finance invoices and Documents using explicit relationships and existing permission scopes.
- Source boundaries: no new contact master, account owner model, onboarding evidence or approval state was fabricated. Project Campaigns/Project Controls remain unavailable due missing canonical data models.
- Browser status: NOT VERIFIED. Authenticated drawer, role, keyboard, responsive and CSV download verification remain Stage 5 work; user sign-off is still required before broad Stage 6+.
- Next single action: continue to Clients → Onboarding. Verify checklist/evidence readiness requirements against current model and preserve unavailable worksheets where canonical records are absent.

### Historical Stage 4 structural checkpoint · Clients Onboarding Lead register · 19 October 2026

- Verified source/test commit: 952203b70ead573edf994d7a53e51ab46eab12fe. Exact-SHA AMS Quality Gate [39273628833](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39273628833) and AMS CI [39273628957](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39273628957) passed.
- Structural result: onboarding scope uses a named Lead register/mobile card pattern with primary contact, recorded email/phone, industry/location, Lead status and created/updated dates instead of normal Directory billing/spend-cap context. Directory scope remains unchanged. URL scope, existing actions and data semantics are preserved.
- Boundary: checklist, required-document evidence, owner/due-date requirements and kickoff readiness are absent from the canonical model. Those worksheets remain unavailable. No browser evidence has been captured; Stage 5 user sign-off is still required.
- Next single action: continue to Clients → Agreements and assess the four documented agreement areas against current sources.

### Historical Stage 4 structural checkpoint · Clients Agreements / Contracts & SOWs · 19 October 2026

- Verified source/test commit: d0109ce94a1a9d6d2cd854771c9be4c9c8545e0c. Exact-SHA AMS Quality Gate [39275162228](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39275162228) and AMS CI [39275162214](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39275162214) both passed.
- Structural result: Contracts & SOWs retains its search/filter/lifecycle register; new View details actions on mobile/desktop open a read-only Drawer for the current saved agreement, canonical terms/deliverables, value/date/client/project context and saved document link.
- Boundary: Contract History is not simulated. A versioned canonical history/event source remains unverified. Existing permission, draft, transition and deletion paths remain unchanged.
- Browser status: NOT VERIFIED. Actual drawer reflow/keyboard/role behavior requires Stage 5 browser review and user sign-off.
- Next single action: assess and structurally continue Clients → Agreements → Retainers & Service Commitments. Keep Renewal Schedule's source boundaries and Contract History unavailable where their models do not support more.

### Historical Stage 4 structural checkpoint · Clients Retainers & Service Commitments · 19 October 2026

- Current main SHA: 72f6702777aefa5264f9de15dbcb72f8c674b9c1.
- Structural change: retainer field presence is preserved; missing terms are no longer shown as zero/default tier/cycle. Usage and remaining hours need recorded used hours and a positive commitment. A distinct Usage unavailable state is filterable. The duplicate lower burn/near-cap/average-overage grid is removed; the compact KPI strip explains incomplete coverage.
- Protected behavior: Client Directory remains the canonical source; existing api.clients.update path remains unchanged. No Time Logs reconciliation, Finance formulas, billing rules, period model, service-scope or carryover records were added.
- Verification blocker: no check-runs, commit statuses or workflow run surfaced for this exact SHA. Prior SHA 4f12689991735c8707059f17eba3d644996b4f22 passed AMS CI/Quality Gate before the Retainers change. Do not mark the current slice CI-verified yet.
- Browser status: NOT VERIFIED. Stage 5 role/reflow/keyboard and actual downloaded-report checks remain.
- Next single action: establish typecheck, regression, build and CI evidence for 72f6702777aefa5264f9de15dbcb72f8c674b9c1 before Renewal Schedule.

