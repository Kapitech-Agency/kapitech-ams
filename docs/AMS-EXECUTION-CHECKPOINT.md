# AMS Execution Checkpoint

**Repository:** `Kapitech-Agency/kapitech-ams`  
**Delivery branch:** `main`  
**Canonical roadmap:** [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md)  
**Recovery protocol:** [AMS Resume After Timeout or Interruption Protocol](AMS-RESUME-AFTER-INTERRUPTION.md)  
**Current task:** Stage 4, Dashboard structural redesign. Performance has a source/test-verified shared reporting-period scope. Overview now uses the source-owned cross-module attention queue and filters completed/archived projects from its active register. Next reconcile Overview's visible period context and chart scope, then complete Analytics. Do not move to Inbox before all Dashboard views meet their source/test content contracts. Stage 5 and explicit user sign-off remain mandatory before broad Stage 6+ work.

> This checkpoint is an evidence snapshot, not live branch state. Refresh `main`, current workflow status, and source/tests on every resume. This documentation update follows the application/test snapshot below.

## 1. Latest application/test snapshot

Snapshot reconciled on **25 October 2026**.

| Item | Evidence |
|---|---|
| Application/test SHA | Dashboard Performance scope: [c8e0bea4](https://github.com/Kapitech-Agency/kapitech-ams/commit/c8e0bea4aafc39e78005c87049769261164d3da0), tests aligned in [e662d6a1](https://github.com/Kapitech-Agency/kapitech-ams/commit/e662d6a1a2d3915ef8f066bc6443c4db8b9b7c91). Dashboard Overview cross-module exception queue: [40b07b55](https://github.com/Kapitech-Agency/kapitech-ams/commit/40b07b552244cbb4ab36e3ac04cdf96cc0dc8edc). Active-project register filter: [da6d1077](https://github.com/Kapitech-Agency/kapitech-ams/commit/da6d1077387bc81f2b1424d5a464cb3bb4908ef9). Regression-test helper fix: [fa043825](https://github.com/Kapitech-Agency/kapitech-ams/commit/fa0438254916b656d78ecff6b07c462df352056f). Exact-SHA Quality Gate [40165080061 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40165080061). AMS CI [40165080058 failed only at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40165080058). |
| Code/test HEAD before this documentation checkpoint | fa0438254916b656d78ecff6b07c462df352056f. Quality Gate typecheck, regression tests and production build passed. AMS CI typecheck, PostgreSQL migrations, security regression and PostgreSQL integration passed; body-parser@1.20.6 audit failure caused its dependent production build, migration packaging and HTTP smoke steps to be skipped. |
| Structural implementation | Vendor Directory [0494f5ee](https://github.com/Kapitech-Agency/kapitech-ams/commit/0494f5ee77284d60abf1de0cc574590e15bd656e); Time Tracking [977c9e1d](https://github.com/Kapitech-Agency/kapitech-ams/commit/977c9e1dcf1a0c3008ae5d168fcf318763f4e086); Documents Library [11f1402d](https://github.com/Kapitech-Agency/kapitech-ams/commit/11f1402dc1df439fdf89c14bf0f292bb8bcfb7df); CMS Services [b682f09e](https://github.com/Kapitech-Agency/kapitech-ams/commit/b682f09eb5a41b89d12215c0488e4c1228b0888a); CMS Case Studies [4d975a0a](https://github.com/Kapitech-Agency/kapitech-ams/commit/4d975a0a1da92df5e2871fdc38a71eeb0ac2775d); CMS Insights [c0abd3a2](https://github.com/Kapitech-Agency/kapitech-ams/commit/c0abd3a211e293d9e359c40b29eec12cc851f420); CMS Testimonials [7186f3e7](https://github.com/Kapitech-Agency/kapitech-ams/commit/7186f3e7fe4e36f8b7954702a1e23998320082bc); Settings System Overview [c964f1a7](https://github.com/Kapitech-Agency/kapitech-ams/commit/c964f1a7bc7cc64a35561db0b22dded2a84ec1d7); Settings Audit Log [df1dd2ab](https://github.com/Kapitech-Agency/kapitech-ams/commit/df1dd2aba4804f08f01f4e6576cab6da4c515282); Settings Users & Access [f5d4bf9f](https://github.com/Kapitech-Agency/kapitech-ams/commit/f5d4bf9fac2a3d6038ea06c5c5c5c0964c8d617e); Settings Integrations [e80b9c11](https://github.com/Kapitech-Agency/kapitech-ams/commit/e80b9c119f528714ae69314160beafcf97798fd7); Dashboard Overview Recent Activity [2b926a98](https://github.com/Kapitech-Agency/kapitech-ams/commit/2b926a98c55660fad47c66497e07f034080e805a); Inbox actionable triage [94c55740](https://github.com/Kapitech-Agency/kapitech-ams/commit/94c55740b8f1907624e4edb2273f9600a36ad1bd); Finance Executive Summary and exception priority [69f46b3f](https://github.com/Kapitech-Agency/kapitech-ams/commit/69f46b3f648a844ce1765d0bb885c79275eabe23); Team Capacity period/reference labels [8eaea7e0](https://github.com/Kapitech-Agency/kapitech-ams/commit/8eaea7e097835fd5519dfc952bf85379d5c828d5); Roles & Departments matrix-first [d06b5d6f](https://github.com/Kapitech-Agency/kapitech-ams/commit/d06b5d6f5d5bc876ddd71ad15ac3d95a5dd0769d); Skills & Service Matrix source independence [e7ec1292](https://github.com/Kapitech-Agency/kapitech-ams/commit/e7ec1292a6dea9d825b2d95d056cb37457d70f76); Careers Applicants refresh recovery [de42f24c](https://github.com/Kapitech-Agency/kapitech-ams/commit/de42f24c9af61dd26c69272a221f9e1ad87c008d); Documents Library linked-record search [6da546a6](https://github.com/Kapitech-Agency/kapitech-ams/commit/6da546a61792c6f01ef9609fa1feff9f894bf41f); Dashboard Performance Priority [03872a67]; Dashboard Overview manual refresh/stale recovery [4ebf0d88](https://github.com/Kapitech-Agency/kapitech-ams/commit/4ebf0d880a8537e85cee1ba6a9fe73aa8f850e04)(https://github.com/Kapitech-Agency/kapitech-ams/commit/03872a6725fb9338e46a89f2d5a4c38ff3b433fe). |
| Changed source/test paths | src/components/admin/GlobalExecutiveDashboard.tsx; tests/ams-dashboard-overview-hierarchy.test.ts; tests/ams-dashboard-overview-refresh-recovery.test.ts; tests/dashboard-metric-truthfulness.test.ts; tests/frontend-functional-regression.test.ts; tests/admin-pages-jsx-regression.test.ts. Performance consumes shared period scope. Overview displays the server-owned attentionItems queue with distinct loading/unavailable/empty states and validated internal drill-downs; its active-project register excludes completed and archived status/health and explains empty states. |
| AMS Quality Gate | Passed on exact source/test SHA fa0438254916b656d78ecff6b07c462df352056f: [run 40165080061](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40165080061). Typecheck, all regression tests, and production build passed. |
| AMS CI | Failed at dependency audit only on exact source/test SHA fa0438254916b656d78ecff6b07c462df352056f: [run 40165080058](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40165080058). Typecheck, migrations, security regression and PostgreSQL integration passed. Existing high body-parser@1.20.6 advisory (GHSA-27r3-jxmh-p828) causes production build, packaged-migration check and HTTP smoke to be skipped in this workflow. No dependencies changed. |
| Visual/runtime evidence | **Not captured:** no authenticated role session, rendered-browser screenshots, viewport sweep, keyboard/focus or touch review. Stage 5 remains pending. |

## 2. Active stage and scope

**Stage 4 — Main-content hierarchy across all nine modules: in progress.**

Navigation is treated as completed and must not be rebuilt. Use the main-content restructuring specification for page hierarchy, the Design System for visual geometry/tokens, the roadmap for stage order, and the gap register for implementation status. The reviewed Shadcn Admin archive and external admin templates remain comparative references only. Do not transplant generic navigation, theme, demo data or dependencies.

Scope for this frontend stage: content hierarchy, existing shared components, frontend regression coverage and documentation. Preserve current routes, source ownership, supported actions, API/data contracts, permission boundaries, authentication/security, and Finance calculations/posting behavior. Do not invent availability, leave, HR lifecycle, skills, utilization, or allocation records where canonical sources are absent.

## 2.1 Latest validation findings
The Website CMS publication-state slices remain green on exact source/test SHAs: Services `b682f09eb5a41b89d12215c0488e4c1228b0888a` (Quality Gate [39810591135](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810591135), CI [39810590666](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810590666)); Case Studies `4d975a0a1da92df5e2871fdc38a71eeb0ac2775d` (Quality Gate [39810998385](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810998385), CI [39810997918](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810997918)); Insights reset `c0abd3a211e293d9e359c40b29eec12cc851f420` (Quality Gate [39811959165](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39811959165), CI [39811959406](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39811959406)). These are source/test checks, not authenticated browser or public-cache verification.

## 3. Immediate resume sequence
1. Refresh live `main` on every resume. Latest verified code/test SHA is [2adbae9e](https://github.com/Kapitech-Agency/kapitech-ams/commit/2adbae9e4d0f234555a65eb26dbcaa186f6d8270); Quality Gate [40079373731 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40079373731). AMS CI [40079373714 failed only at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40079373714) after typecheck, migrations, security regression and PostgreSQL integration passed. The existing high `body-parser@1.20.6` advisory is the only observed CI blocker; no dependency files changed.
2. Preserve the verified Vendor Directory [0494f5ee](https://github.com/Kapitech-Agency/kapitech-ams/commit/0494f5ee77284d60abf1de0cc574590e15bd656e), Time Tracking [977c9e1d](https://github.com/Kapitech-Agency/kapitech-ams/commit/977c9e1dcf1a0c3008ae5d168fcf318763f4e086), Documents Library [11f1402d](https://github.com/Kapitech-Agency/kapitech-ams/commit/11f1402dc1df439fdf89c14bf0f292bb8bcfb7df), CMS Services [b682f09e](https://github.com/Kapitech-Agency/kapitech-ams/commit/b682f09eb5a41b89d12215c0488e4c1228b0888a), CMS Case Studies [4d975a0a](https://github.com/Kapitech-Agency/kapitech-ams/commit/4d975a0a1da92df5e2871fdc38a71eeb0ac2775d), and CMS Insights [c0abd3a2](https://github.com/Kapitech-Agency/kapitech-ams/commit/c0abd3a211e293d9e359c40b29eec12cc851f420), plus CMS Testimonials [7186f3e7](https://github.com/Kapitech-Agency/kapitech-ams/commit/7186f3e7fe4e36f8b7954702a1e23998320082bc), and Settings System Overview [c964f1a7](https://github.com/Kapitech-Agency/kapitech-ams/commit/c964f1a7bc7cc64a35561db0b22dded2a84ec1d7).
3. Keep the CMS views partially complete until Stage 5 authenticated role/visual/responsive/keyboard review and actual public-output confirmation. Saved CMS status alone does not prove live cache/deployment visibility.
4. Continue Stage 4 within Dashboard only. Dashboard Performance now uses the shared reporting-period context; Dashboard Overview has a server-owned cross-module attention queue and excludes completed/archived projects from the active register. Next reconcile Overview's displayed period scope with chart-specific range controls, then complete Analytics. Do not move to Inbox or another module before all three Dashboard views are source/test-reviewed. Stage 5 still requires authenticated browser evidence and explicit user sign-off.
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



### Latest Stage 4 structural slice: Projects Planning & Delivery milestone register · 24 October 2026

- Exact source/test SHA: [8b2458988516f75c72a1d323a9fdc21a1fdb7bc9](https://github.com/Kapitech-Agency/kapitech-ams/commit/8b2458988516f75c72a1d323a9fdc21a1fdb7bc9).
- Requirement: make the canonical Milestones register legible without implying unsupported owner, dependency or workflow data.
- Before: each row visually presented its existing milestone title, due date and state, but field headings were implicit and the due-date label disappeared on compact layouts.
- After: a semantic table exposes column headers for Milestone, Due date and Status on desktop; compact rows explicitly label Due date. Status and date values still derive only from canonical project milestones.
- Changed files: `src/pages/admin/AdminProjects.tsx`, `tests/projects-module-regression.test.ts`.
- Exact-SHA Quality Gate [40072909356 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40072909356). Typecheck, focused/regression tests and production build passed.
- Exact-SHA AMS CI [40072909292 failed at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40072909292); it reports the same existing high `body-parser@1.20.6` advisory. No dependency files were changed; the CI workflow skipped downstream build/packaging/HTTP smoke after the audit gate.
- Authenticated browser, visual viewport, touch/keyboard and accessibility-runtime verification remain **NOT VERIFIED**. The automated checks do not establish WCAG 2.2 AA conformance. Stage 5 and explicit user sign-off remain required.
- Next action: continue Stage 4 in canonical order with Clients → Directory / Client 360.

### Latest Stage 4 structural slice: Client 360 linked-record relationship scope · 24 October 2026

- Exact source/test SHA: [0b506fecaac56c5cf5acbb5dcfcb670663dbeae3](https://github.com/Kapitech-Agency/kapitech-ams/commit/0b506fecaac56c5cf5acbb5dcfcb670663dbeae3).
- Before: the linked-record section said “Only explicit client ID relationships are shown” immediately after a separate Contracts & SOWs section that deliberately preserves exact company-name fallback for legacy contract records without a client ID. Both behaviors were correct in source, but the adjacent copy could imply the policy was inconsistent.
- After: the note explicitly scopes ID-only matching to Projects, Inbox, Finance and Documents. The Contracts & SOWs panel copy continues to disclose client-ID or exact-company-name matching. Data matching and access filters are unchanged.
- Changed files: `src/pages/admin/AdminClients.tsx`, `tests/ams-nine-module-workspace-regression.test.ts`.
- Exact-SHA Quality Gate [40073190083 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40073190083). Typecheck, regression tests and production build passed.
- Exact-SHA AMS CI [40073190078 failed at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40073190078) on the existing high `body-parser@1.20.6` advisory; downstream build/packaging/HTTP smoke were skipped. No dependency files changed.
- Browser, actual role visibility, responsive, keyboard/touch and assistive-technology behavior remain **NOT VERIFIED**. Stage 5 and explicit user sign-off remain mandatory.
- Next Stage 4 slice: Finance → Transactions & Cash → Revenue.


### Latest Stage 4 Finance register structural pass · 24 October 2026

- Latest code/test SHA: [24589cdc8abad578d74d6d53c143458c5512d417](https://github.com/Kapitech-Agency/kapitech-ams/commit/24589cdc8abad578d74d6d53c143458c5512d417).
- Revenue and Accounts Receivable share the canonical invoice component. The table now uses a contained horizontal-scroll region and a minimum width that protects Invoice, Client & project, Issued, Due, Total, Balance, Status and Actions from being clipped. The register remains ahead of supporting summary and aging views.
- Expenses adds a Supplier column resolved only through the canonical vendor ID, plus the existing `paymentStatus` value. It distinguishes Unlinked, Vendor data unavailable, Linked vendor unavailable and Not recorded; no supplier or payment state is inferred. The Schedule column, project relation, currency amount, date and existing void action remain present. Search also checks a linked vendor's actual company/name. No generic record-lifecycle status field is available in the current view model, so the UI does not invent one.
- Quotations now uses contained horizontal scrolling to preserve its Quotation, Client, Value, Created, Valid until, Status, Owner and Actions columns on narrow screens; its existing supported review/edit/convert/delete actions and conversion guard are unchanged.
- Changed source/test paths: `src/pages/admin/AdminInvoicing.tsx`, `tests/finance-ui-consistency.test.ts`. Quality Gate for this exact SHA [40074278685 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40074278685): typecheck, regression suite and production build. AMS CI [40074278688 failed at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40074278688) because of the existing high `body-parser@1.20.6` advisory; downstream build/package/smoke checks were skipped.
- Authenticated browser, selected roles, screenshot evidence, viewport matrix, keyboard/touch, screen-reader and runtime accessibility verification remain **NOT VERIFIED**. Do not claim WCAG 2.2 AA from CI alone. Stage 5 and explicit user sign-off remain required.
- Next Stage 4 slice: Finance → Receivables & Payables → Accounts Receivable.

### Latest Stage 4 slices: Careers label semantics and Settings readiness gate state · 24 October 2026

**Latest combined source/test SHA:** [bffa1c8a6d8832608791120444ddc61b0df5a3b8](https://github.com/Kapitech-Agency/kapitech-ams/commit/bffa1c8a6d8832608791120444ddc61b0df5a3b8).

- **Website CMS → Careers:** [source change d122371f](https://github.com/Kapitech-Agency/kapitech-ams/commit/d122371fe82b06ae0039bad3b0584a022aa1c878) changes the job-list metric label from a generic “Applicants” claim to “Position text matches” and adds a note that it compares submitted position text with job title/title ID. The current applicant projection has no stable job ID; matching predicate and displayed count remain unchanged. Exact-SHA Quality Gate [40075032131 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40075032131); the current combined gate is also green.
- **Settings → System Overview:** [source change e5210f58](https://github.com/Kapitech-Agency/kapitech-ams/commit/e5210f58182cc8a4c312a4a5ed2287e59d2908e2) avoids coercing missing readiness booleans to false. True gates read Ready, confirmed false gates read Review, unresolved gates read Checking or Not reported; absent overall readiness uses a neutral tone and a truthful label. Test assertion scope was corrected in [bffa1c8a](https://github.com/Kapitech-Agency/kapitech-ams/commit/bffa1c8a6d8832608791120444ddc61b0df5a3b8).
- Exact-SHA Quality Gate [40075459535 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40075459535): typecheck, all regression tests and production build. AMS CI [40075459710 failed at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40075459710) on existing high `body-parser@1.20.6`; typecheck, migrations, security regression and PostgreSQL integration tests had passed. No dependency files were changed.
- **Not verified:** authenticated role-based browser review, actual visual screenshots, viewport/reflow/keyboard/focus/touch and assistive-technology behavior. Stage 5 and explicit user sign-off remain mandatory.
- **Next action:** continue Stage 4 with Settings → Users & Access, then Audit Log and Integrations in the specification's sequence.

### Latest Stage 4 slice: Settings Users & Access MFA reporting state · 24 October 2026

- Exact code/test SHA: [70cd7c8a0295cff4ff38e0bbab9d1a633d358c4d](https://github.com/Kapitech-Agency/kapitech-ams/commit/70cd7c8a0295cff4ff38e0bbab9d1a633d358c4d).
- Source evidence: `AdminUser.mfaEnabled` is optional, and `GET /api/auth/users` passes `u.mfaEnabled` through without coercing absent values. Before: the account directory showed every falsey value as “Not configured”, masking absent telemetry as an explicitly disabled state.
- After: a shared helper in `AdminSettings.tsx` maps true → Enabled/success, false → Not configured/warning, and undefined → Not reported/neutral. Compact cards and desktop table use the same helper. No authentication or MFA operation changed.
- Changed files: `src/pages/admin/AdminSettings.tsx`, `tests/admin-settings-module-regression.test.ts`, and the existing responsive regression `tests/admin-pages-jsx-regression.test.ts` updated to check the shared helper.
- Exact-SHA Quality Gate [40075953554 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40075953554): typecheck, full regression suite and production build. AMS CI [40075953547 failed only at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40075953547) for existing `body-parser@1.20.6` via Express. Typecheck, migration, security and PostgreSQL integration passed; no dependency files changed.
- Browser role visibility, visual screenshots, responsive viewport, keyboard/focus and screen-reader checks remain **NOT VERIFIED**. Stage 5 is still mandatory.
- Next: Settings → Audit Log, preserving its read-only semantics and explicit reporting-period scope.

### Latest Stage 4 slice: cross-module document links and breadcrumb consumer audit · 24 October 2026

- Exact source/test SHA: [970093fd0cd34069cf1f0249ab894a82fb92b374](https://github.com/Kapitech-Agency/kapitech-ams/commit/970093fd0cd34069cf1f0249ab894a82fb92b374).
- Before: Document Library sent Client links to `/admin/clients?client=ID`. `App.tsx` redirects that alias to `/admin/clients/all-clients` without query parameters, so the selected Client record was lost. It also made a link clickable even if its canonical target had not been found in the loaded reference list.
- After: Client links use `/admin/clients/all-clients?client=ID`, which is the route that reads the ID and opens the existing Client drawer. Project links retain `/admin/projects?project=ID`, because `AdminProjects` explicitly resolves the selection by either project ID or slug. Both link types require a matching record in the loaded canonical Client/Project list; missing/unavailable targets remain non-clickable labels.
- Changed files: `src/pages/admin/AdminDocuments.tsx`, `tests/ams-nine-module-workspace-regression.test.ts`. Regression covers the route aliases, selected-record consumers and missing-target guard. No API, database, authorization, document access, file storage or business workflow change.
- Exact-SHA Quality Gate [40076581187 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40076581187): typecheck, regression tests and production build. AMS CI [40076581063 failed only at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40076581063); typecheck, migrations, security regression and PostgreSQL integration passed before the known high `body-parser@1.20.6` advisory failed the audit.
- Breadcrumb audit: the route tree is static and workspace-oriented; Project and Client details remain contextual drawer/modal views. No eligible full-page record-detail consumer was found, so no shared breadcrumb component was added. Runtime/browser review remains **NOT VERIFIED**.
- Next Stage 4 slice: continue the cross-module pass with Client 360 → Project, Documents and Finance context. Stage 5 remains mandatory.

### Latest Stage 4 slice: preserve Client 360 context in Document Library · 24 October 2026

- Exact source/test SHA: [460409347c6b3ef7eba9b1f96ff19b715403285e](https://github.com/Kapitech-Agency/kapitech-ams/commit/460409347c6b3ef7eba9b1f96ff19b715403285e).
- Before: the “Documents” link in Client 360 opened only the broad “Project & Client Files” category. It did not restrict the register to the selected client's document relationships.
- After: the link carries `relatedEntity=Client` and `relatedId=selectedClient.id`. Document Library accepts only canonical Client/Project entity values and non-empty IDs, filters rows by exact entity+ID match, shows a context message, and forces the visible relationship selector to “Linked record” while that precise context is active. Invalid context query parameters are removed. Reset clears both context parameters and category scope while retaining unrelated URL parameters.
- Shared pure helpers are in `src/lib/documentLibrarySearch.ts`. Tests cover valid/invalid context parsing, exact entity/ID matching, no-context pass-through, the Client 360 URL, visible context, and reset behavior.
- Changed files: `src/pages/admin/AdminDocuments.tsx`, `src/pages/admin/AdminClients.tsx`, `src/lib/documentLibrarySearch.ts`, `tests/ams-document-library-linked-record-search.test.ts`, `tests/ams-nine-module-workspace-regression.test.ts`.
- Exact-SHA Quality Gate [40077964259 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40077964259): typecheck, full regression tests and production build. AMS CI [40077964330 failed only at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40077964330); typecheck, migrations, security and PostgreSQL integration passed. No API, permission or dependency changed.
- Browser role access, actual document visibility for real records, responsive reflow, back/forward, keyboard/focus and screen-reader behavior remain **NOT VERIFIED**. Stage 5 remains mandatory.
- Next Stage 4 cross-module slice: Client 360 → Finance invoice context. Reuse existing Finance routing and source-owned filters only; do not invent an invoice detail route or add a backend/API contract.

### Latest Stage 4 slice: preserve Client 360 context in Accounts Receivable · 24 October 2026

- Exact source/test SHA: [b94599505397f514f0ea6518c67c5b6ff135f6e3](https://github.com/Kapitech-Agency/kapitech-ams/commit/b94599505397f514f0ea6518c67c5b6ff135f6e3).
- Source verification: `server/postgres-invoice-repository.ts` maps `row.client_id` to `clientId`, and the invoice write path stores `client_id`. The frontend `AgencyInvoice` type had omitted this already-existing field; only that type declaration was aligned.
- Before: Client 360’s Finance shortcut opened the entire Accounts Receivable view, losing the selected client context.
- After: the shortcut passes `clientId=selectedClient.id`. The existing AR invoice list filters rows by exact `invoice.clientId`, displays a context label based on the existing loaded client reference, resets pagination when scope changes, and offers a clear-filter action. This applies to the canonical invoice register only; summary and aging sections keep their existing scope so they are not mislabeled as client-specific.
- Changed files: `src/pages/admin/AdminClients.tsx`, `src/pages/admin/AdminInvoicing.tsx`, `src/lib/financeStore.ts`, `tests/finance-ui-consistency.test.ts`. No API, backend, database/schema, route, authorization, payment, or accounting formula changed.
- Exact-SHA Quality Gate [40078483239 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40078483239): typecheck, regression tests and production build. AMS CI [40078483229 failed only at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40078483229); typecheck, migrations, security regression and PostgreSQL integration passed. Existing high `body-parser@1.20.6` remains separate maintenance scope.
- Authenticated browser, real record visibility, direct URL/back-forward, responsive layout, keyboard/focus and screen-reader behavior remain **NOT VERIFIED**. Stage 5 is mandatory.
- Next Stage 4 cross-module slice: Project → Client context. Audit the current Project drawer’s client link for canonical ID and permission-safe target behavior before changing it.

### Latest Stage 4 slice: Project drawer → canonical Client Directory · 24 October 2026

- Latest verified source/test SHA: [66cd7ca38fba9d2e4e3b053612df271815e67f64](https://github.com/Kapitech-Agency/kapitech-ams/commit/66cd7ca38fba9d2e4e3b053612df271815e67f64). Source change [b8ee1c7d](https://github.com/Kapitech-Agency/kapitech-ams/commit/b8ee1c7dcef694b2e7edada58891de6208a9e3fe).
- Project detail resolves `selectedProjectDetail.clientId` through the existing `api.clients.getAll()` reference list, using the same `canReadClients` guard as the project editor. It links to `/admin/clients/all-clients?client=ID` only on an exact canonical record match. If loading fails or no ID match exists, the view shows status text rather than a speculative link. No company-name matching is used.
- Existing route/permission policy remains unchanged. No role grants, API, database/schema, project data or workflow logic changed.
- Changed files: `src/pages/admin/AdminProjects.tsx`, `tests/ams-nine-module-workspace-regression.test.ts`, `tests/frontend-functional-regression.test.ts` (existing loader assertion updated for the callback and loaded-state contract).
- Exact-SHA Quality Gate [40078994964 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40078994964). AMS CI [40078994978 failed only at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40078994978); typecheck, migrations, security regression and PostgreSQL integration passed. Existing high `body-parser@1.20.6` remains separate maintenance scope.
- Browser role checks, direct URL/history, responsive rendering, keyboard/focus and assistive technology remain **NOT VERIFIED**. Stage 5 remains mandatory.
- Next: audit Project → Documents link eligibility against the stricter current Documents route policy before adding a shortcut.

### Latest Stage 4 slice: permission-gated Project → Document Library shortcut · 24 October 2026

- Exact source/test SHA: [2adbae9e4d0f234555a65eb26dbcaa186f6d8270](https://github.com/Kapitech-Agency/kapitech-ams/commit/2adbae9e4d0f234555a65eb26dbcaa186f6d8270).
- Route-policy audit confirmed that `/admin/documents` is Admin-only in the current `canAccessAmsRoute` policy. A project drawer shortcut was added only when that exact shared policy allows the current session role to access Documents. No route permission or navigation policy changed.
- When rendered, the shortcut opens the existing Document Library with `documents=project-client&relatedEntity=Project&relatedId=selectedProjectDetail.id`. Document Library already normalizes this context and filters by exact canonical entity+ID pair. No API, DB, permission, storage or workflow changes.
- Changed files: `src/pages/admin/AdminProjects.tsx`, `tests/ams-nine-module-workspace-regression.test.ts`.
- Exact-SHA Quality Gate [40079373731 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40079373731), including typecheck, regression tests and production build. AMS CI [40079373714 failed only at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40079373714); typecheck, migration, security regression and PostgreSQL integration passed. Existing high `body-parser@1.20.6` remains out of scope.
- Browser role checks, actual documents visibility, direct URL/history, responsive layout, keyboard/focus and assistive technology remain **NOT VERIFIED**. Stage 5 remains mandatory.
- Next Stage 4 cross-module audit: Project → Finance. Check the existing Project Finance query/state first; do not add a route or widen access without evidence.

### Latest Stage 4 slice: Dashboard Performance shared reporting-period scope · 25 October 2026

- **Code/test snapshot:** source change [c8e0bea4](https://github.com/Kapitech-Agency/kapitech-ams/commit/c8e0bea4aafc39e78005c87049769261164d3da0); test correction [e662d6a1](https://github.com/Kapitech-Agency/kapitech-ams/commit/e662d6a1a2d3915ef8f066bc6443c4db8b9b7c91). Current source/test SHA for this slice: `e662d6a1a2d3915ef8f066bc6443c4db8b9b7c91`.
- **Before:** Performance showed current task status and fixed current-week logged time, while Dashboard's shared reporting-period filter was not applied to its working surfaces.
- **After:** the view states the selected period and exact date boundaries; tasks are scoped by due date (creation-date fallback), projects by schedule overlap (creation-date fallback), and time entries by logged date (creation timestamp fallback). The context's existing behavior keeps records without usable dates visible.
- **Truthful metric boundary:** task status, project flags, and logged time are current record snapshots. The UI states that current dashboard inputs do not provide status-transition history; it does not infer period-over-period completion trends.
- **Changed paths:** `src/components/admin/GlobalExecutiveDashboard.tsx`, `tests/ams-dashboard-overview-hierarchy.test.ts`, `tests/frontend-functional-regression.test.ts`, `tests/admin-pages-jsx-regression.test.ts`. The last two tests were updated after CI revealed stale assertions against the prior JSX signature.
- **Validation:** Quality Gate [40164451181 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40164451181), including typecheck, regression tests, and production build. AMS CI [40164451257 failed at the pre-existing dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40164451257) after typecheck, migrations, security regression, and PostgreSQL integration passed.
- **Browser/authenticated role, viewport, keyboard/focus, and screen-reader verification:** **NOT VERIFIED**. Stage 5 remains mandatory.
- **Next single action:** stay in Dashboard. Review and complete Overview's content hierarchy and source/period semantics, then Analytics. Do not begin Inbox until all three Dashboard views have completed their Stage 4 source/test review.


### Latest Stage 4 slice: Dashboard Overview · Cross-module attention queue and active project register · 25 October 2026

- **Source/test snapshot:** priority queue implementation [40b07b55](https://github.com/Kapitech-Agency/kapitech-ams/commit/40b07b552244cbb4ab36e3ac04cdf96cc0dc8edc), active-project filter [da6d1077](https://github.com/Kapitech-Agency/kapitech-ams/commit/da6d1077387bc81f2b1424d5a464cb3bb4908ef9), and test helper correction [fa043825](https://github.com/Kapitech-Agency/kapitech-ams/commit/fa0438254916b656d78ecff6b07c462df352056f).
- **Before:** Overview built the primary exception section from two local delivery counts, so finance, sales/inquiry and operational items provided by the existing Dashboard summary were not represented in that work surface. The project table filtered by period and type only despite its “Active projects” title.
- **After:** the view reads the existing attentionItems array from api.dashboard.getOverview(). Loading, unavailable, genuine empty and populated states are distinct. Internal paths are validated before they become drill-down links. Completed/archived status or health rows are removed before the project period/type filters; empty states distinguish an unavailable source, an empty project source, no active projects, and no active project matching the current filters.
- **Scope:** frontend source and regression tests only. No API/backend, permission policy, authentication, database/schema or financial calculations changed.
- **Changed paths:** src/components/admin/GlobalExecutiveDashboard.tsx, tests/ams-dashboard-overview-hierarchy.test.ts, tests/ams-dashboard-overview-refresh-recovery.test.ts, tests/dashboard-metric-truthfulness.test.ts.
- **Validation:** Quality Gate [40165080061 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40165080061), including typecheck, regression tests and production build. AMS CI [40165080058 failed at the existing dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40165080058) after typecheck, PostgreSQL migrations, security regression and PostgreSQL integration passed.
- **Still open:** visible reporting-period semantics in Overview, authenticated browser/role review, responsive viewport coverage, keyboard/focus and assistive-technology review. Recent activity remains capped at five and its source currently lacks per-record destination URLs.
- **Next single action:** reconcile Overview's displayed period scope with its chart-specific range controls and explicitly separate current-state KPIs from period-scoped lists. Then finish Analytics; do not advance to Inbox.
