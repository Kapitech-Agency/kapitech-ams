# AMS Execution Checkpoint

**Repository:** `Kapitech-Agency/kapitech-ams`  
**Delivery branch:** `main`  
**Canonical roadmap:** [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md)  
**Recovery protocol:** [AMS Resume After Timeout or Interruption Protocol](AMS-RESUME-AFTER-INTERRUPTION.md)  
**Current task:** Stage 4, main-content structural redesign. Stage 5 visual/accessibility review and explicit user sign-off remain mandatory before broad Stage 6+ work.

> This checkpoint is an evidence snapshot, not live branch state. Refresh `main`, current workflow status, and source/tests on every resume. This documentation update follows the application/test snapshot below.

## 1. Latest application/test snapshot

Snapshot reconciled on **23 October 2026**.

| Item | Evidence |
|---|---|
| Application/test SHA | [22f41ee82802390998c67472358922df73a2d103](https://github.com/Kapitech-Agency/kapitech-ams/commit/22f41ee82802390998c67472358922df73a2d103), Inbox Messages register and owner/channel filter structural slice. The first implementation commit [a9fe2348](https://github.com/Kapitech-Agency/kapitech-ams/commit/a9fe23487b1c4628ca6f6f7bf1bb6c150175ec76) exposed a TypeScript inference issue; explicit Set<string> typing and final checks are in [22f41ee](https://github.com/Kapitech-Agency/kapitech-ams/commit/22f41ee82802390998c67472358922df73a2d103). Inbox Overview remains verified at [620abf26](https://github.com/Kapitech-Agency/kapitech-ams/commit/620abf26ca51336db7efd186e2ff395eeb159722); Dashboard Analytics at [d812fe60](https://github.com/Kapitech-Agency/kapitech-ams/commit/d812fe60252cec1385b74d6ac88b04ef8306fe1d). |
| Structural implementation | Vendor Directory [0494f5ee](https://github.com/Kapitech-Agency/kapitech-ams/commit/0494f5ee77284d60abf1de0cc574590e15bd656e); Time Tracking [977c9e1d](https://github.com/Kapitech-Agency/kapitech-ams/commit/977c9e1dcf1a0c3008ae5d168fcf318763f4e086); Documents Library [11f1402d](https://github.com/Kapitech-Agency/kapitech-ams/commit/11f1402dc1df439fdf89c14bf0f292bb8bcfb7df); CMS Services [b682f09e](https://github.com/Kapitech-Agency/kapitech-ams/commit/b682f09eb5a41b89d12215c0488e4c1228b0888a); CMS Case Studies [4d975a0a](https://github.com/Kapitech-Agency/kapitech-ams/commit/4d975a0a1da92df5e2871fdc38a71eeb0ac2775d); CMS Insights [c0abd3a2](https://github.com/Kapitech-Agency/kapitech-ams/commit/c0abd3a211e293d9e359c40b29eec12cc851f420); CMS Testimonials [7186f3e7](https://github.com/Kapitech-Agency/kapitech-ams/commit/7186f3e7fe4e36f8b7954702a1e23998320082bc); Settings System Overview [c964f1a7](https://github.com/Kapitech-Agency/kapitech-ams/commit/c964f1a7bc7cc64a35561db0b22dded2a84ec1d7); Settings Audit Log [df1dd2ab](https://github.com/Kapitech-Agency/kapitech-ams/commit/df1dd2aba4804f08f01f4e6576cab6da4c515282); Settings Users & Access [f5d4bf9f](https://github.com/Kapitech-Agency/kapitech-ams/commit/f5d4bf9fac2a3d6038ea06c5c5c5c0964c8d617e); Settings Integrations [e80b9c11](https://github.com/Kapitech-Agency/kapitech-ams/commit/e80b9c119f528714ae69314160beafcf97798fd7); Dashboard Overview Recent Activity [2b926a98](https://github.com/Kapitech-Agency/kapitech-ams/commit/2b926a98c55660fad47c66497e07f034080e805a); Inbox actionable triage [94c55740](https://github.com/Kapitech-Agency/kapitech-ams/commit/94c55740b8f1907624e4edb2273f9600a36ad1bd); Dashboard Performance Priority [03872a67](https://github.com/Kapitech-Agency/kapitech-ams/commit/03872a6725fb9338e46a89f2d5a4c38ff3b433fe). |
| Changed source/test paths | `src/pages/admin/AdminInbox.tsx`; `src/lib/inboxTriage.ts`; `tests/ams-inbox-triage.test.ts`; `tests/ams-inbox-messages-workspace.test.ts`; `tests/ams-nine-module-workspace-regression.test.ts`. All Messages supports owner/channel filters in the canonical filtered collection, Review/Table mode, and source/owner columns; Sales Inquiries retains commercial service/budget fields. No backend/API/DB/auth/RBAC/Finance logic changes. |
| AMS Quality Gate | **Passed** on exact source/test SHA `22f41ee82802390998c67472358922df73a2d103`: [run 39842788314](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39842788314). Typecheck, regression tests, and production build succeeded. |
| AMS CI | **Passed** on exact source/test SHA `22f41ee82802390998c67472358922df73a2d103`: [run 39842788268](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39842788268). Type check, migrations, security regression tests, PostgreSQL integration, dependency audit, production build, packaged-migration verification and production HTTP smoke test passed. |
| Visual/runtime evidence | **Not captured:** no authenticated role session, rendered-browser screenshots, viewport sweep, keyboard/focus or touch review. Stage 5 remains pending. |

## 2. Active stage and scope

**Stage 4 — Main-content hierarchy across all nine modules: in progress.**

Navigation is treated as completed and must not be rebuilt. Use the main-content restructuring specification for page hierarchy, the Design System for visual geometry/tokens, the roadmap for stage order, and the gap register for implementation status. The reviewed Shadcn Admin archive and external admin templates remain comparative references only. Do not transplant generic navigation, theme, demo data or dependencies.

Scope for this frontend stage: content hierarchy, existing shared components, frontend regression coverage and documentation. Preserve current routes, source ownership, supported actions, API/data contracts, permission boundaries, authentication/security, and Finance calculations/posting behavior. Do not invent availability, leave, HR lifecycle, skills, utilization, or allocation records where canonical sources are absent.

## 2.1 Latest validation findings
The Website CMS publication-state slices remain green on exact source/test SHAs: Services `b682f09eb5a41b89d12215c0488e4c1228b0888a` (Quality Gate [39810591135](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810591135), CI [39810590666](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810590666)); Case Studies `4d975a0a1da92df5e2871fdc38a71eeb0ac2775d` (Quality Gate [39810998385](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810998385), CI [39810997918](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810997918)); Insights reset `c0abd3a211e293d9e359c40b29eec12cc851f420` (Quality Gate [39811959165](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39811959165), CI [39811959406](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39811959406)). These are source/test checks, not authenticated browser or public-cache verification.

## 3. Immediate resume sequence
1. Refresh live `main` on every resume. Latest source/test SHA is [22f41ee](https://github.com/Kapitech-Agency/kapitech-ams/commit/22f41ee82802390998c67472358922df73a2d103), with AMS Quality Gate [39842788314](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39842788314) and AMS CI [39842788268](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39842788268) both passed.
2. Preserve the verified Vendor Directory [0494f5ee](https://github.com/Kapitech-Agency/kapitech-ams/commit/0494f5ee77284d60abf1de0cc574590e15bd656e), Time Tracking [977c9e1d](https://github.com/Kapitech-Agency/kapitech-ams/commit/977c9e1dcf1a0c3008ae5d168fcf318763f4e086), Documents Library [11f1402d](https://github.com/Kapitech-Agency/kapitech-ams/commit/11f1402dc1df439fdf89c14bf0f292bb8bcfb7df), CMS Services [b682f09e](https://github.com/Kapitech-Agency/kapitech-ams/commit/b682f09eb5a41b89d12215c0488e4c1228b0888a), CMS Case Studies [4d975a0a](https://github.com/Kapitech-Agency/kapitech-ams/commit/4d975a0a1da92df5e2871fdc38a71eeb0ac2775d), and CMS Insights [c0abd3a2](https://github.com/Kapitech-Agency/kapitech-ams/commit/c0abd3a211e293d9e359c40b29eec12cc851f420), plus CMS Testimonials [7186f3e7](https://github.com/Kapitech-Agency/kapitech-ams/commit/7186f3e7fe4e36f8b7954702a1e23998320082bc), and Settings System Overview [c964f1a7](https://github.com/Kapitech-Agency/kapitech-ams/commit/c964f1a7bc7cc64a35561db0b22dded2a84ec1d7).
3. Keep the CMS views partially complete until Stage 5 authenticated role/visual/responsive/keyboard review and actual public-output confirmation. Saved CMS status alone does not prove live cache/deployment visibility.
4. Next action: continue Stage 4 with Projects → Planning & Delivery. Verify the active project/selected-project context, notes-first Brief, milestone register and timeline against canonical project/task sources. Keep deliverables, review/revision/dependency records unavailable where no canonical model or persisted workflow exists. Inbox Follow-ups and Routing/Templates remain blocked until their canonical records and workflow contracts exist.
5. Stage 5 visual/responsive/accessibility review and **explicit user sign-off** remain mandatory before broad Stage 6 workflow/data/API work. No authenticated browser screenshots or keyboard evidence have been captured.

## 2.2 Latest Stage 4 structural slice: Dashboard Analytics

- Source/test SHA: [d812fe60252cec1385b74d6ac88b04ef8306fe1d](https://github.com/Kapitech-Agency/kapitech-ams/commit/d812fe60252cec1385b74d6ac88b04ef8306fe1d).
- Structural change: the Analytics workspace selects Financial movement, Receivables, or Project status, then presents one primary report. Financial movement includes exact per-period values/date windows and clearly distinguishes invoice issue dates, expense record dates, current receivables, project status, and arithmetic difference from posted profit.
- Exact-SHA Quality Gate [39840053958 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39840053958) and AMS CI [39840053891 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39840053891).
- Remaining verification: authenticated browser, real-data comparison, viewport/reflow, keyboard/focus, and chart/touch review are **NOT VERIFIED**. Stage 5 and explicit user sign-off remain mandatory.

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

