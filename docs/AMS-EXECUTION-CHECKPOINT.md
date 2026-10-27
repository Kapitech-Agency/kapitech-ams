# AMS Execution Checkpoint

**Repository:** `Kapitech-Agency/kapitech-ams`  
**Delivery branch:** `main`  
**Canonical roadmap:** [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md)  
**Recovery protocol:** [AMS Resume After Timeout or Interruption Protocol](AMS-RESUME-AFTER-INTERRUPTION.md)  
**Current task:** Stage 4 Dashboard Overview card-content alignment to the user-supplied Fynix Behance reference and contextual empty-state redesign, then Stage 5 authenticated rendered review and user sign-off. Latest scoped implementation slice moves operational exceptions, task queue, and deadlines ahead of finance/portfolio context; workspace shortcuts are promoted into the Dashboard header and removed from the lower content rows. Latest UI source/test slice: [94c9f87f](https://github.com/Kapitech-Agency/kapitech-ams/commit/94c9f87f0200b0619122576f0ff6522a3d9dda8f), a bounded layout correction to compact the Overview card gutters and prevent the Projects portfolio card from stretching into unused vertical space beside the taller Finance card. The latest CI/Quality Gate runs for this SHA were still in progress at checkpoint refresh; verify their final outcomes before claiming a pass. Production data-backed visual review is blocked because the available browser profile did not contain a saved sign-in, so Finance/Projects/task/time-log visualizations were not available to inspect. No backend/API/auth/permission/data changes were made. Dashboard remains the only active module until explicit user sign-off; do not start Inbox.


> This checkpoint is an evidence snapshot, not live branch state. Refresh `main`, current workflow status, and source/tests on every resume. Section 1 is the prior source/test snapshot; the latest warning-state slice and browser findings are recorded in Section 0.


## 0. Latest bounded slice — 26 October 2026

- Authenticated production Dashboard was inspected at the browser's native desktop width only (~1440px equivalent), using two no-mutation loads. The earlier inspection saw the long refresh warning; a later single-load inspection confirmed the concise status plus “View refresh details” disclosure. Finance and Projects still show unavailable-source states, and all expected Overview card headings are present below the fold. The browser report is inconsistent about the precise height/layout of composite unavailable panels, so do not treat every compact-state style as confirmed in production. Native viewport resizing was not supported; 1440, 1280, 1024, 900, 768, 390 and 320px, keyboard/focus, 200% zoom, screen reader and WCAG acceptance remain unverified.
- HTTP 429 appeared after repeated reload attempts during the inspection. This is an inspection-time observation, not proof of a systemic production rate-limit defect.
- Bounded UI slice: shorten the visible refresh warning and move the unchanged full source message into a native keyboard-operable disclosure. Preserve source collection, loaded values, unavailable-vs-zero semantics, APIs, routes, permission checks and business behavior. Update the Dashboard regression test and this checkpoint in the same commit.
- The latest UI source/test slice is [3a530856](https://github.com/Kapitech-Agency/kapitech-ams/commit/3a5308564b36b43dcc625bc3eaba40d2b3e3eea0). Quality Gate [40334550914 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40334550914), and the docs-only checkpoint commit [f7e15372](https://github.com/Kapitech-Agency/kapitech-ams/commit/f7e15372a9a67e56dad8df15ba66b593df24740f) also passed Quality Gate [40335096944](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40335096944). AMS CI [40335096926](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40335096926) failed at dependency audit for the pre-existing high `body-parser@1.20.6` advisory [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828); migration, security regression and PostgreSQL integration passed.


### 0.2 Lead-row geometry correction — 26 October 2026

- Commit: [94c9f87f](https://github.com/Kapitech-Agency/kapitech-ams/commit/94c9f87f0200b0619122576f0ff6522a3d9dda8f).
- `src/components/admin/GlobalExecutiveDashboard.css` now uses the canonical 12px Overview grid gutter and 16px card header/body padding. The first Finance + Projects row intentionally keeps Finance as the dominant analysis workspace while allowing the Projects portfolio card to end at its own content height instead of stretching to match Finance's quotation follow-up queue.
- Regression coverage added to `tests/ams-dashboard-overview-hierarchy.test.ts` for the 12px grid gutter, lead-row alignment, natural-height Projects card and 16px content padding.
- Exact-SHA CI and Quality Gate were still running when this checkpoint update was prepared. Do not infer test success from a running workflow.
- A no-mutation production inspection showed the dashboard loaded without a saved sign-in in the available Browser Context Profile. As a result, invoice, expense, project, task, time-log, quotation and inbox source states appeared unavailable and the data-backed charts could not be assessed. This does **not** establish a backend defect; no authenticated response/network trace was available. Do not add placeholder figures or bypass access checks. Re-establish the user-authorized profile sign-in and inspect the actual data state before claiming visual acceptance.
- Next: finish CI/Quality Gate; continue the full Overview visual pass against authenticated data and the approved Maven-informed guide; inspect the other Overview rows and narrow layouts; update checkpoint with concrete evidence. Do not touch backend/API/auth/RBAC or other modules.

### 0.1 Dashboard primary cards and content-state presentation

- This slice changes the Dashboard main content, not the header: Finance trend and Projects portfolio states now use compact visual status rows rather than 220px/250px blank panels. Project progress, task queue, deadline, client focus, team workload, time logs, quotations, exceptions and activity source states now use a consistent icon/text treatment. Genuine empty states use a neutral icon style distinct from unavailable sources.
- No values, records, permissions, routes, APIs or business operations were fabricated or changed. Populated charts, metrics and rows remain bound to canonical sources. The visual impact is greatest when production sources are unavailable, which was the state seen during authenticated inspection.
- Added source-level regression coverage for the status inventory, compact/empty state classes, and removal of oversized blank Finance and Projects panels. The first check on [cabbb947](https://github.com/Kapitech-Agency/kapitech-ams/commit/cabbb947b62bfc07e96d28a23c6f4694d8bdbe6e) caught a punctuation-level mismatch in the time-log unavailable label; the follow-up [3a530856](https://github.com/Kapitech-Agency/kapitech-ams/commit/3a5308564b36b43dcc625bc3eaba40d2b3e3eea0) preserved the exact wording and the Quality Gate then passed. AMS CI reached and passed migrations, security regression and PostgreSQL integration, but failed at dependency audit for the existing `body-parser@1.20.6` advisory [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828).
- Next: inspect the populated Finance + Projects visual hierarchy, then review Project progress/Needs attention, Task queue/Deadlines, Team/Client delivery, and Recent activity/shortcuts in order. Stage 5 responsive/accessibility evidence and explicit user sign-off remain required; do not start Inbox yet.


| Latest visual-state slice validation | Quality Gate [40334550914] success on [3a530856](https://github.com/Kapitech-Agency/kapitech-ams/commit/3a5308564b36b43dcc625bc3eaba40d2b3e3eea0); AMS CI [40334551164] failure on the same source/test SHA due to the high dependency audit advisory. |

## 1. Prior application/test snapshot (before warning-state slice)

Snapshot reconciled on **26 October 2026** before the current warning-state slice; the SHA/CI rows below are historical evidence.

| Item | Evidence |
|---|---|
| Prior application/test SHA | Source/test head before the warning-state slice: [1b614c1f](https://github.com/Kapitech-Agency/kapitech-ams/commit/1b614c1f4b2e48232d36f6ba745cf3ae987a2b95). Earlier Dashboard visual/content, syntax and regression changes are linked in the history below. |
| Previous exact-SHA Quality Gate | [40311057121 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40311057121) on prior source/test SHA [1b614c1f](https://github.com/Kapitech-Agency/kapitech-ams/commit/1b614c1f4b2e48232d36f6ba745cf3ae987a2b95); current warning-state slice requires a new exact-SHA check. |
| Structural implementation | Vendor Directory [0494f5ee](https://github.com/Kapitech-Agency/kapitech-ams/commit/0494f5ee77284d60abf1de0cc574590e15bd656e); Time Tracking [977c9e1d](https://github.com/Kapitech-Agency/kapitech-ams/commit/977c9e1dcf1a0c3008ae5d168fcf318763f4e086); Documents Library [11f1402d](https://github.com/Kapitech-Agency/kapitech-ams/commit/11f1402dc1df439fdf89c14bf0f292bb8bcfb7df); CMS Services [b682f09e](https://github.com/Kapitech-Agency/kapitech-ams/commit/b682f09eb5a41b89d12215c0488e4c1228b0888a); CMS Case Studies [4d975a0a](https://github.com/Kapitech-Agency/kapitech-ams/commit/4d975a0a1da92df5e2871fdc38a71eeb0ac2775d); CMS Insights [c0abd3a2](https://github.com/Kapitech-Agency/kapitech-ams/commit/c0abd3a211e293d9e359c40b29eec12cc851f420); CMS Testimonials [7186f3e7](https://github.com/Kapitech-Agency/kapitech-ams/commit/7186f3e7fe4e36f8b7954702a1e23998320082bc); Settings System Overview [c964f1a7](https://github.com/Kapitech-Agency/kapitech-ams/commit/c964f1a7bc7cc64a35561db0b22dded2a84ec1d7); Settings Audit Log [df1dd2ab](https://github.com/Kapitech-Agency/kapitech-ams/commit/df1dd2aba4804f08f01f4e6576cab6da4c515282); Settings Users & Access [f5d4bf9f](https://github.com/Kapitech-Agency/kapitech-ams/commit/f5d4bf9fac2a3d6038ea06c5c5c5c0964c8d617e); Settings Integrations [e80b9c11](https://github.com/Kapitech-Agency/kapitech-ams/commit/e80b9c119f528714ae69314160beafcf97798fd7); Dashboard Overview Recent Activity [2b926a98](https://github.com/Kapitech-Agency/kapitech-ams/commit/2b926a98c55660fad47c66497e07f034080e805a); Inbox actionable triage [94c55740](https://github.com/Kapitech-Agency/kapitech-ams/commit/94c55740b8f1907624e4edb2273f9600a36ad1bd); Finance Executive Summary and exception priority [69f46b3f](https://github.com/Kapitech-Agency/kapitech-ams/commit/69f46b3f648a844ce1765d0bb885c79275eabe23); Team Capacity period/reference labels [8eaea7e0](https://github.com/Kapitech-Agency/kapitech-ams/commit/8eaea7e097835fd5519dfc952bf85379d5c828d5); Roles & Departments matrix-first [d06b5d6f](https://github.com/Kapitech-Agency/kapitech-ams/commit/d06b5d6f5d5bc876ddd71ad15ac3d95a5dd0769d); Skills & Service Matrix source independence [e7ec1292](https://github.com/Kapitech-Agency/kapitech-ams/commit/e7ec1292a6dea9d825b2d95d056cb37457d70f76); Careers Applicants refresh recovery [de42f24c](https://github.com/Kapitech-Agency/kapitech-ams/commit/de42f24c9af61dd26c69272a221f9e1ad87c008d); Documents Library linked-record search [6da546a6](https://github.com/Kapitech-Agency/kapitech-ams/commit/6da546a61792c6f01ef9609fa1feff9f894bf41f); Dashboard Performance Priority [03872a67]; Dashboard Overview manual refresh/stale recovery [4ebf0d88](https://github.com/Kapitech-Agency/kapitech-ams/commit/4ebf0d880a8537e85cee1ba6a9fe73aa8f850e04)(https://github.com/Kapitech-Agency/kapitech-ams/commit/03872a6725fb9338e46a89f2d5a4c38ff3b433fe). |
| Changed source/test paths | src/components/admin/GlobalExecutiveDashboard.tsx; src/components/charts/DashboardCharts.tsx; tests/ams-dashboard-overview-hierarchy.test.ts; tests/ams-nine-module-workspace-regression.test.ts; tests/global-reporting-period.test.ts; tests/dashboard-metric-truthfulness.test.ts; docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md; docs/AMS-MAVEN-INSPIRED-OPERATIONAL-WORKSPACE-IMPLEMENTATION-GUIDE.md. Existing scoped Dashboard CSS is reused; no backend/API/database/schema/role/route/Finance formula changes. |
| AMS Quality Gate | PASS on exact source/test SHA [1b614c1f](https://github.com/Kapitech-Agency/kapitech-ams/commit/1b614c1f4b2e48232d36f6ba745cf3ae987a2b95), run [40311057121](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40311057121). TypeScript, regression tests and production build passed. |
| AMS CI | Run [40311056256](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40311056256) on [1b614c1f](https://github.com/Kapitech-Agency/kapitech-ams/commit/1b614c1f4b2e48232d36f6ba745cf3ae987a2b95): type check, PostgreSQL migrations, security regression and PostgreSQL integration passed; dependency audit failed on the existing high body-parser@1.20.6 DoS advisory [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828). Production build, packaged migration verification and HTTP smoke test were skipped. |
| Visual/runtime evidence | Authenticated Dashboard inspected at native desktop width (~1440px equivalent) on 26 October; Finance and Projects showed unavailable-source states and the original refresh notice was verbose. Viewport resizing was unsupported. 1440/1280/1024/900/768/390/320 breakpoints, keyboard/focus, 200% zoom, screen reader and WCAG acceptance remain not verified. HTTP 429 appeared after repeated reload attempts in this inspection only; no systemic production claim. |

## 2. Active stage and scope

**Stage 4 — Main-content hierarchy across all nine modules: in progress.**

Navigation is treated as completed and must not be rebuilt. Use the main-content restructuring specification for page hierarchy, the Design System for visual geometry/tokens, the roadmap for stage order, and the gap register for implementation status. The reviewed Shadcn Admin archive and external admin templates remain comparative references only. Do not transplant generic navigation, theme, demo data or dependencies.

Scope for this frontend stage: content hierarchy, existing shared components, frontend regression coverage and documentation. Preserve current routes, source ownership, supported actions, API/data contracts, permission boundaries, authentication/security, and Finance calculations/posting behavior. Do not invent availability, leave, HR lifecycle, skills, utilization, or allocation records where canonical sources are absent.

## 2.1 Latest validation findings
The Website CMS publication-state slices remain green on exact source/test SHAs: Services `b682f09eb5a41b89d12215c0488e4c1228b0888a` (Quality Gate [39810591135](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810591135), CI [39810590666](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810590666)); Case Studies `4d975a0a1da92df5e2871fdc38a71eeb0ac2775d` (Quality Gate [39810998385](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810998385), CI [39810997918](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810997918)); Insights reset `c0abd3a211e293d9e359c40b29eec12cc851f420` (Quality Gate [39811959165](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39811959165), CI [39811959406](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39811959406)). These are source/test checks, not authenticated browser or public-cache verification.

## 3. Immediate resume sequence
1. Refresh the live branch and exact-SHA checks on every resume. Prior source/test head before warning-state slice is [1b614c1f](https://github.com/Kapitech-Agency/kapitech-ams/commit/1b614c1f4b2e48232d36f6ba745cf3ae987a2b95); Quality Gate [40311057121 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40311057121), while AMS CI [40311056256](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40311056256) stopped at the existing body-parser dependency audit advisory after prior type/database/security checks passed.
2. Preserve the verified Vendor Directory [0494f5ee](https://github.com/Kapitech-Agency/kapitech-ams/commit/0494f5ee77284d60abf1de0cc574590e15bd656e), Time Tracking [977c9e1d](https://github.com/Kapitech-Agency/kapitech-ams/commit/977c9e1dcf1a0c3008ae5d168fcf318763f4e086), Documents Library [11f1402d](https://github.com/Kapitech-Agency/kapitech-ams/commit/11f1402dc1df439fdf89c14bf0f292bb8bcfb7df), CMS Services [b682f09e](https://github.com/Kapitech-Agency/kapitech-ams/commit/b682f09eb5a41b89d12215c0488e4c1228b0888a), CMS Case Studies [4d975a0a](https://github.com/Kapitech-Agency/kapitech-ams/commit/4d975a0a1da92df5e2871fdc38a71eeb0ac2775d), and CMS Insights [c0abd3a2](https://github.com/Kapitech-Agency/kapitech-ams/commit/c0abd3a211e293d9e359c40b29eec12cc851f420), plus CMS Testimonials [7186f3e7](https://github.com/Kapitech-Agency/kapitech-ams/commit/7186f3e7fe4e36f8b7954702a1e23998320082bc), and Settings System Overview [c964f1a7](https://github.com/Kapitech-Agency/kapitech-ams/commit/c964f1a7bc7cc64a35561db0b22dded2a84ec1d7).
3. Keep the CMS views partially complete until Stage 5 authenticated role/visual/responsive/keyboard review and actual public-output confirmation. Saved CMS status alone does not prove live cache/deployment visibility.
4. Remain in Dashboard. The current Overview sequence is header toolbar → Finance + Projects portfolio → project progress + Needs attention → task queue + upcoming deadlines → team workload + client delivery focus → recent activity + workspace shortcuts. Do not add a duplicate reporting-period card; period controls remain in the toolbar. Header actions are permission-aware Create invoice/Invoices, New project/Projects, and Refresh. Existing task, project, deadline and quotation filters remain interactive. Review the actual page in an authenticated browser at 1440–320px, including hover/chart selection, touch, keyboard/focus and accessible reflow before Dashboard sign-off. Dashboard remains active; do not start Inbox.
5. Stage 5 visual/responsive/accessibility review and **explicit user sign-off** remain mandatory before broad Stage 6 workflow/data/API work. No authenticated browser screenshots or keyboard evidence have been captured.

## 2.2 Latest Stage 4 structural slice: Dashboard Analytics

- Source/test SHA: [d812fe60252cec1385b74d6ac88b04ef8306fe1d](https://github.com/Kapitech-Agency/kapitech-ams/commit/d812fe60252cec1385b74d6ac88b04ef8306fe1d).
- Structural change: the Analytics workspace selects Financial movement, Receivables, or Project status, then presents one primary report. Financial movement includes exact per-period values/date windows and clearly distinguishes invoice issue dates, expense record dates, current receivables, project status, and arithmetic difference from posted profit.
- Exact-SHA Quality Gate [39840053958 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39840053958) and AMS CI [39840053891 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39840053891).
- Remaining verification: authenticated browser, real-data comparison, viewport/reflow, keyboard/focus, and chart/touch review are **NOT VERIFIED**. Stage 5 and explicit user sign-off remain mandatory.

### Latest Stage 4 structural slice: Dashboard Overview attention composition and scope semantics · 25 October 2026

- **Code/test HEAD:** [bd64d338](https://github.com/Kapitech-Agency/kapitech-ams/commit/bd64d338039468a22252df1a9706d0679fec215a). Structural change [1e13e0ae](https://github.com/Kapitech-Agency/kapitech-ams/commit/1e13e0aeb6692ea093091d87b513f61895ce1c48); follow-up restored the established operating-scope sentence required by shared reporting-period regression contracts.
- **Before:** Overview described mixed current-state and period-scoped data in a single explanation and showed cross-module exceptions and inbound triage as separate full-width sections, increasing vertical stacking before the main agency work indicators.
- **After:** The Operating scope region explicitly labels current operational queues, overdue/next-30-day delivery commitments, period-scoped recorded time, and current-month/current-receivable Finance values. “Needs attention” groups the canonical Dashboard exception list and role-authorized Inbox triage; the lists remain distinct, preserve their own empty/unavailable semantics and only show Inbox when the existing route access allows it. The two panels share the desktop row at 1100px and stack below; when Inbox is unavailable, exceptions use the full row.
- **Changed paths:** `src/components/admin/GlobalExecutiveDashboard.tsx`, `tests/ams-dashboard-overview-hierarchy.test.ts`.
- **Validation:** Exact-SHA Quality Gate [40193689375 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40193689375), including type check, regression tests and production build. AMS CI [40193689372 failed at the existing dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40193689372); type check, migrations, security regression and PostgreSQL integration passed, while subsequent build/package/HTTP smoke steps were skipped.
- **Boundaries:** No backend/API, database/schema, authentication/permission policy, route contract, Finance calculation, or business workflow changed. No fixture data was introduced.
- **Still unverified:** authenticated browser rendering/data, role-by-role visibility, 1440–320px viewport sweep, keyboard/focus, touch, contrast and assistive technology. Stage 5 and explicit user sign-off remain mandatory. Recent Activity still has no verified per-record destination URL in the current summary contract.
- **Next single action:** continue Overview source/empty/error-state acceptance and Recent Activity limitations against Main-Content Restructuring Specification §4.1/§4.10, then finish Dashboard Analytics. Do not move to Inbox.

### Latest Stage 4 structural slice: Dashboard Analytics · Inquiry pipeline report · 25 October 2026

- Code/test HEAD: [8824ffa1](https://github.com/Kapitech-Agency/kapitech-ams/commit/8824ffa1618914409d565095e7cd58c385940609).
- Business purpose: give Kapitech a current view of sales inquiry status and requested Creative/IT service demand without duplicating the Inbox message register.
- Content: Analytics now selects Inquiry pipeline alongside Financial movement, Receivables and Project status. The report displays inquiry count, open inquiry count, saved Client Directory linkage count, current status distribution and popular requested-service categories. A single inquiry counts once per same category; service counts can overlap when one inquiry requests multiple categories.
- Source and role scope: uses the existing Dashboard snapshot of canonical Inbox submissions and includes only records with type inquiry. Careers applicants, vendors and newsletter submissions are excluded. Existing Inbox route access gates both the option and report content; the selection resets if access becomes unavailable.
- Truthful semantics: this is a current-state snapshot, not a historical conversion funnel. Client linkage requires a saved convertedClientId. Budget strings are not summed as currency. No win rate, booked revenue or unsupported CRM state is inferred. A failed/null source is distinct from a valid empty source.
- Changed paths: src/components/admin/GlobalExecutiveDashboard.tsx; tests/ams-dashboard-overview-hierarchy.test.ts.
- Implementation commits: report [da6b523e](https://github.com/Kapitech-Agency/kapitech-ams/commit/da6b523e99e68c4cbfdc6b8ed17d22b2c92e8433), reducer type correction [35282a57](https://github.com/Kapitech-Agency/kapitech-ams/commit/35282a57586a5964fcb5e7d5d27fb1a351ce0a0e), regression correction [8824ffa1](https://github.com/Kapitech-Agency/kapitech-ams/commit/8824ffa1618914409d565095e7cd58c385940609).
- Validation: Quality Gate [40194509887](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40194509887) passed on exact source/test SHA 8824ffa1618914409d565095e7cd58c385940609, including TypeScript, regression suite and production build. AMS CI [40194509771](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40194509771) failed at the existing dependency audit for high body-parser@1.20.6 advisory GHSA-27r3-jxmh-p828. Type check, PostgreSQL migrations, security regression and PostgreSQL integration passed; downstream build/package/HTTP smoke steps were skipped.
- Scope boundary: no new API/backend, database/schema, route, authorization policy, Finance formula, dependency or fabricated data.
- Still unverified: authenticated browser output, role-by-role visibility, prescribed viewport sweep, keyboard/focus, touch, contrast and assistive technology. Stage 5 and explicit user sign-off remain mandatory.
- Next: finish remaining Overview source/empty/error-state and Recent Activity acceptance, then complete Analytics report-by-report source/content review. Do not move to Inbox.

## Latest Stage 4 visual-first slice — Dashboard Analytics · Inquiry trend, status donut and service-demand bars · 25 October 2026

- **Source/test HEAD:** [bcb5071e](https://github.com/Kapitech-Agency/kapitech-ams/commit/bcb5071e761206b1a004f2a4af3e4f06141451e5).
- **Visual result:** the Inquiry pipeline is no longer text-only. It shows a line chart of saved inquiry creation dates, a donut chart for current status distribution, and horizontal bars comparing requested service categories. This is a source-backed visual slice designed for the user to review before deeper workflow work.
- **Period semantics:** inquiry volume follows the shared topbar Filter. When All dates is selected, it uses a labelled recent 30-day window. Monthly selection groups by weeks; quarter/year selection groups by month. Inquiry status and requested service totals are current snapshots, not period-history claims.
- **Data integrity:** records without a valid creation date remain counted in inquiry totals but are excluded from the line chart with a clear explanation. A valid source with dates can show zero-count buckets. A failed or undated source is not silently converted into a historical trend. Each service category is deduplicated per inquiry; categories overlap across inquiries.
- **Reusable UI:** `DonutChart` now accepts an optional `centerLabel`; existing callers still default to “Projects.”
- **Changed paths:** `src/components/admin/GlobalExecutiveDashboard.tsx`; `src/components/charts/DashboardCharts.tsx`; `tests/ams-dashboard-overview-hierarchy.test.ts`.
- **Implementation commits:** visual slice [28e782be](https://github.com/Kapitech-Agency/kapitech-ams/commit/28e782bea08187ee83951faf9608522c944d6486); label, empty-state and regression alignment [bcb5071e](https://github.com/Kapitech-Agency/kapitech-ams/commit/bcb5071e761206b1a004f2a4af3e4f06141451e5).
- **Validation:** Quality Gate [40195600825](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40195600825) passed on exact source/test SHA `bcb5071e761206b1a004f2a4af3e4f06141451e5`, including TypeScript, regression suite and production build. AMS CI [40195600831](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40195600831) failed at the existing high `body-parser@1.20.6` dependency audit advisory GHSA-27r3-jxmh-p828; type check, PostgreSQL migrations, security regression and PostgreSQL integration passed, while later build/package/HTTP smoke steps were skipped.
- **Not verified visually:** authenticated browser rendering, production deployment result, role-by-role visibility, 1440–320px reflow, 200% zoom/text resize, keyboard/focus, touch, contrast and assistive technology. Stage 5 remains pending.
- **Next single task:** review the Dashboard header/reporting-toolbar styling in an authenticated rendered session when an authorized profile is available. Confirm quick actions for actual roles, underline tabs, date-range icon/control, hover/focus/disabled states and wrapping at 1440–320px. Then continue Dashboard-only visual review; do not start Inbox or edit backend/permissions to force action visibility.

## Latest Stage 4 visual-first slice — Dashboard Overview · Creative/IT workstream load bars · 25 October 2026

- **Source/test HEAD:** [725099ca](https://github.com/Kapitech-Agency/kapitech-ams/commit/725099ca6b8791633359444333f7368939d399c3).
- **Before:** Creative & IT workstreams showed seven small numeric cards per service line. Active project count repeated the project badge; open task count repeated the workload that the user needed to compare visually. At narrow panel width, the cards were dense and harder to scan.
- **After:** each service line now has a horizontal open-task load bar scaled to the highest open-task count among the displayed service lines. Active project count stays in the project identity badge. Review, blocked, unassigned, overdue and overdue-delivery indicators remain in a clearer two-column metric grid.
- **Semantics:** bars compare open task counts, not capacity or completion percentages. Review/blocked/unassigned/overdue flags can overlap and are not stacked as if they sum to a whole. The graph is gated by existing task access/source; a missing source shows an explicit unavailable state.
- **Creative/IT labels:** Creative & Content, Web & IT Development and Other / Unclassified are retained. Tasks are grouped by saved service category and existing project relationship rules.
- **Changed paths:** `src/components/admin/GlobalExecutiveDashboard.tsx`; `tests/ams-dashboard-overview-hierarchy.test.ts`.
- **Validation:** Quality Gate [40196067228](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40196067228) passed on exact source/test SHA `725099ca6b8791633359444333f7368939d399c3`, including TypeScript, regression suite and production build. AMS CI [40196067205](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40196067205) failed at the existing high `body-parser@1.20.6` dependency audit advisory GHSA-27r3-jxmh-p828 after type check, PostgreSQL migrations, security regression and PostgreSQL integration passed. Downstream build/package/HTTP smoke steps were skipped.
- **Unverified visually:** authenticated production/browser rendering, real data review, viewport sweep, text zoom, keyboard/focus, touch, contrast and assistive technology. Stage 5 is still pending.
- **Next:** continue visual-first review of Overview client-delivery and delivery-commitment surfaces using current source records; keep the scope frontend-only.

## Latest Stage 4 visual-first slice — Dashboard Overview · Deadline horizon graphic · 25 October 2026

- **Source/test HEAD:** [d283674f](https://github.com/Kapitech-Agency/kapitech-ams/commit/d283674f8b027f4fec7b973ed8345b8a967e6946).
- **Before:** upcoming milestones and project deadlines were shown only as a priority-ordered list of up to eight records. The list was useful for action, but did not communicate the overall balance of overdue work versus near-term and later commitments.
- **After:** the panel now begins with a segmented horizontal bar and three counts: overdue, today through seven days, and days eight through thirty. These buckets are derived from the complete canonical `allUpcomingCommitments` array, before the list is truncated.
- **Semantics:** the graphic counts dated active-project milestones and project targets already selected by the existing date logic. The detailed list remains capped at eight priority-ranked entries. The visual chart's count/period is explicit and not based on only the visible preview. It does not invent missing dates or task capacity.
- **Changed paths:** `src/components/admin/GlobalExecutiveDashboard.tsx`; `tests/ams-dashboard-overview-hierarchy.test.ts`.
- **Evidence:** visual implementation [127c4e20](https://github.com/Kapitech-Agency/kapitech-ams/commit/127c4e2076e2b3aab1f443f8d8846c9ed058fa0e), test scope correction [d283674f](https://github.com/Kapitech-Agency/kapitech-ams/commit/d283674f8b027f4fec7b973ed8345b8a967e6946).
- **Validation:** Quality Gate [40196509952](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40196509952) passed on exact source/test SHA `d283674f8b027f4fec7b973ed8345b8a967e6946`, including TypeScript, regression suite and production build. AMS CI [40196510099](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40196510099) failed at the existing high `body-parser@1.20.6` dependency audit advisory GHSA-27r3-jxmh-p828 after type check, PostgreSQL migrations, security regression and PostgreSQL integration passed. Downstream build/package/HTTP smoke steps were skipped.
- **Not verified visually:** authenticated browser/production rendering, real-data comparison, viewport/zoom, keyboard/focus, touch, contrast and assistive technology. Stage 5 remains pending.
- **Next:** refine Client Delivery Focus with source-backed visuals, then let the user review Dashboard Overview and Analytics before expanding deeper workflows.

## Latest Stage 4 visual-first slice — Deadline-horizon scope label correction · 25 October 2026

- **Source/test HEAD:** [58ce42bb](https://github.com/Kapitech-Agency/kapitech-ams/commit/58ce42bb69d06b9d0242b403558c8ce6a015b7de).
- **Correction:** the source's overdue bucket can include commitments overdue by more than 30 days, while future commitments are capped at the next 30 days. The visible scope label now accurately reads “All overdue or upcoming commitments through the next 30 days.”
- **Why it matters:** the segmented chart categories remain Overdue, Today–7 days and Days 8–30. The total covers all overdue records plus future records through day 30; the detailed list still shows up to eight priority items.
- **Validation:** Quality Gate [40196767458](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40196767458) passed on exact source/test SHA `58ce42bb69d06b9d0242b403558c8ce6a015b7de`, including TypeScript, regression suite and production build. AMS CI [40196767409](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40196767409) failed at the existing high `body-parser@1.20.6` dependency audit advisory GHSA-27r3-jxmh-p828 after type check, PostgreSQL migrations, security regression and PostgreSQL integration passed. Downstream build/package/HTTP smoke steps were skipped.
- **Next:** continue visual-first refinement of Client Delivery Focus and then inspect authenticated rendered Overview/Analytics. Do not expand deeper workflow scope before visual acceptance.

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


### Latest Stage 4 slice: Dashboard Overview and Analytics · Shared global reporting-period contract · 25 October 2026

- Source/test SHA: [5ab84f82](https://github.com/Kapitech-Agency/kapitech-ams/commit/5ab84f82d0566c66cba770823964fa5b2be73b36). Period implementation [12ad8c83](https://github.com/Kapitech-Agency/kapitech-ams/commit/12ad8c83ebacd7f36d24d7ed151de605d1f4317e); accessible-name fix [3d90a4a3](https://github.com/Kapitech-Agency/kapitech-ams/commit/3d90a4a3cb9546d195a709c4359d63bf3799baa7).
- Before: Overview and Analytics had local 30 days / Q2 / YTD / 12 months chart controls while the AMS topbar already had the shared Month / Quarter / Year / All dates Filter.
- After: one global Filter governs financial trend periods in Overview and Analytics. Month uses weekly buckets; Quarter and Year use monthly buckets with inclusive dates. All dates explicitly uses a recent 30-day chart window. Exact trend dates remain available in the Analytics table.
- Analytics uses the Dashboard-selected currency. Issued invoice value, current receivables, monthly recorded payments and expenses, and the arithmetic difference remain distinct. The difference is not presented as posted profit. No Finance formulas or API/business rules changed.
- Validation: Quality Gate [40166216286 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40166216286), including typecheck, regression tests and production build. AMS CI [40166216296 failed at the pre-existing dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40166216296), after typecheck, migrations, security regression and PostgreSQL integration passed.
- Still open: full Overview acceptance review and Analytics view-by-view review; authenticated browser/role, prescribed viewports, keyboard/focus, contrast and assistive-technology verification remain NOT VERIFIED. Stage 5 sign-off is pending.
- Next single action: audit each Overview region against Main-Content Restructuring Specification §4.1 and §4.10, then complete Analytics. Stay in Dashboard.

### Dashboard resume checkpoint · Workstream/client identity edge cases · 25 October 2026

- Current source/test SHA: [367acf31](https://github.com/Kapitech-Agency/kapitech-ams/commit/367acf319a5124224c07b74c52258d5ef4304dc4). Exact-SHA Quality Gate [40183390506 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40183390506).
- Workstream summary [700160ea](https://github.com/Kapitech-Agency/kapitech-ams/commit/700160eaee06784568aa91dd9a843cc53048e0d5) reports active projects, open/review/blocked/unassigned/overdue tasks and overdue project commitments per saved service line. Empty project IDs are excluded from workstream ID sets, so unlinked tasks match only through saved serviceLine and are not duplicated across workstreams.
- Client delivery focus [eb7c92f9](https://github.com/Kapitech-Agency/kapitech-ams/commit/eb7c92f9acd3a8e1899c0a9702cd0cde5036f485) groups by saved client display name, links permitted project details and reports overdue/upcoming commitments without claiming client health/SLA/contract status. Missing project IDs use the existing project href as fallback aggregation identity.
- Scope remains frontend-only. No new API, backend, schema, Finance formulas, routes or permission policies were introduced.
- AMS CI [40183390498](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40183390498) failed at the existing high body-parser@1.20.6 dependency audit. Typecheck, PostgreSQL migrations, security regression and PostgreSQL integration passed; dependent build/package/HTTP smoke steps were skipped.
- Authenticated live data, role/direct-route behavior, canonical viewport sweep, keyboard/focus, contrast, touch and assistive-technology review remain NOT VERIFIED. Recent Activity still lacks per-record destination URLs.
- Next single action: continue Overview acceptance against §4.1/§4.10, focusing on client/project link resolution, source/empty states, current-state versus period scope and Recent Activity limitations. Then finish Analytics. Do not move to Inbox.

### Dashboard resume checkpoint · Client and project identity resolution · 25 October 2026

- Current source/test SHA: [8469c88f](https://github.com/Kapitech-Agency/kapitech-ams/commit/8469c88fc3b58ba27912ffe86c8193bb0129c6e5). Quality Gate [40187377703 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40187377703).
- Client Delivery Focus now groups on saved `clientId` where present. For roles allowed to access Client Directory, the existing `api.clients.getAll()` source supplies canonical company/name fields. Client links use the existing `/admin/clients/all-clients?client=...` selection only when a matching record and route access exist. Roles without access do not trigger the Client Directory request.
- Legacy records without an ID use normalized saved company names and display that fallback. Tasks linked to a project inherit the project's client group before conflicting task-level display labels are considered.
- Project/commitment drill-downs use an existing stored slug or the persisted project ID route supported by Projects. If neither exists, the project label remains visible without an invented direct URL.
- Changed paths: `src/components/admin/GlobalExecutiveDashboard.tsx`; `tests/ams-dashboard-overview-hierarchy.test.ts`. No new API endpoint, schema, permission rule, Finance formula or posting behavior changed.
- AMS CI [40187377730 failed at the existing dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40187377730) after typecheck, migrations, security regression and PostgreSQL integration passed.
- Authenticated browser behavior, role-specific client visibility, route selection, responsive viewports, keyboard/focus and assistive-technology review remain NOT VERIFIED. Stage 5 sign-off is pending.
- Next single action: finish Overview source/empty states and current-state versus period scope region-by-region against §4.1/§4.10, then finish Analytics. Do not move to Inbox.


## Latest Stage 4 slice — Dashboard Client Delivery Focus prioritization · 25 October 2026

- **Source/test HEAD:** [6af0b89c](https://github.com/Kapitech-Agency/kapitech-ams/commit/6af0b89c7e2b39237262189a28db088f249afb78).
- **Content hierarchy reviewed against the target:** Overview remains Operating scope → Needs attention (cross-module exceptions + authorized Inbox triage) → agency operating indicators → delivery queue/workstreams → deadline horizon and assigned-work/logged-time context → Client Delivery Focus → Finance control → workspace shortcuts → recent audit activity. The source-order regression continues to guard this hierarchy.
- **Within Client Delivery Focus:** canonical client groups are ordered by overdue commitments, overdue tasks, blocked tasks, unassigned tasks, tasks in review, nearest upcoming commitment, open-task load, project count, then saved client name. This makes delivery risk more visible before portfolio size and alphabetic tie-breaking.
- **Truthfulness/security:** all rows still derive from canonical project/task/client sources. Missing task metrics stay unavailable rather than zero. The aggregation is not a Client 360, health, contract or SLA score. No backend/API/schema, route, permission, business workflow or Finance logic changed.
- **Validation:** Quality Gate [40197510745 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40197510745) with TypeScript, regression tests and production build. AMS CI [40197510751](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40197510751) passed type check, PostgreSQL migrations, security regression and PostgreSQL integration, then failed on the existing high `body-parser@1.20.6` dependency audit; later build/package/HTTP smoke steps were skipped.
- **Still NOT VERIFIED:** authenticated user-role rendering, production/browser screenshots, prescribed responsive viewport sweep, keyboard/focus, contrast, touch and assistive technology. Stage 5 review and user sign-off remain mandatory.
- **Next:** use authenticated browser review to inspect the rendered Overview/Analytics at the required widths. Continue Stage 4 hierarchy changes only where source-backed task priority and the approved per-workspace specification justify them; do not advance to deeper workflows before visual acceptance.


## Latest Stage 4 slice — Client Delivery Focus risk-first metric layout · 25 October 2026

- **Source/test HEAD:** [703dc5f1](https://github.com/Kapitech-Agency/kapitech-ams/commit/703dc5f1b245ccb7000a40161c351baff804be6c).
- **Visible row metric order:** Overdue tasks → Blocked tasks → Unassigned tasks → Tasks in review → Open tasks. The grid uses two columns by default, three columns from 600px, and five columns from 1100px so the risk order remains readable without forcing a wide row on small screens.
- **Client row ranking:** overdue commitments → overdue tasks → blocked tasks → unassigned work → review workload → nearest next commitment → open workload → project count → client name.
- **Whole-page content order:** operating scope → Needs attention → agency operating indicators → delivery queue and Creative/IT workstreams → delivery deadlines and assigned-work/logged-time context → Client Delivery Focus → Finance control → workspace shortcuts → recent audit activity. This follows the approved per-workspace target specification.
- **Data/security boundary:** canonical client/project/task sources, routes and access checks remain unchanged. Missing values remain unavailable, not zero. No health score, contract state or SLA result is inferred.
- **Validation:** Quality Gate [40197784861 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40197784861) with TypeScript, regression tests and production build. AMS CI [40197785384](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40197785384) passed type check, PostgreSQL migrations, security regression and PostgreSQL integration, then failed on the existing high `body-parser@1.20.6` audit advisory; later build/package/HTTP smoke steps were skipped.
- **Still NOT VERIFIED:** authenticated role rendering, production/browser screenshots, responsive viewport sweep, keyboard/focus, contrast, touch, and assistive-technology checks. Stage 5 and user sign-off remain required.
- **Next:** obtain an authenticated AMS session and inspect Overview/Analytics at the documented widths before moving into deeper workflow implementation.


## Latest Stage 4 visual-first slice — complete Dashboard visual hierarchy pass · 25 October 2026

- **Current source/test HEAD:** [e33d811e](https://github.com/Kapitech-Agency/kapitech-ams/commit/e33d811e77fb759e8268ec7c4df6a60ed5774159).
- **Design direction from the Maven reference:** prioritize legible information hierarchy, focused decision surfaces, purposeful charts, exact values and consistent components. The application keeps Kapitech’s dark-first surfaces, restrained crimson brand accent and existing tokens; no reference brand assets were copied.
- **Overview:** operating scope → Needs attention → operating indicators → delivery desk and Creative/IT workstreams → deadlines/resources/time → Client Delivery Focus → Finance control → shortcuts → recent activity. Queue, workload and deadline visuals remain sourced from the canonical existing services. Client rows and task indicators lead with delivery risk.
- **Performance:** reporting scope → decision KPI strip (task completion, overdue tasks, blocked tasks, active projects) → task status and project exception analysis → recorded-time comparison. Logged-time bars compare within the visible top-eight contributor list; they do not imply capacity, utilization or billable time. Duplicate completion percentage was removed from the detailed task distribution.
- **Analytics:** source/period scope and report selector → one selected report surface. Financial movement retains a trend and exact-value table; Receivables remains a current issued-invoice balance snapshot; Inquiry pipeline retains saved-date volume, current status and requested-service views; Project status now has active/total/status-group summary and proportional current-state bars.
- **Data and authorization:** existing records, currencies, date semantics, routes, permission checks and unavailable states remain authoritative. No sample values, financial formula or historical conversion/trend metric was invented.
- **Changed paths:** `src/components/admin/GlobalExecutiveDashboard.tsx`; `tests/ams-dashboard-overview-hierarchy.test.ts`; `tests/ams-nine-module-workspace-regression.test.ts`.
- **Validation:** Quality Gate [40200940679 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40200940679) with TypeScript, regression tests and production build. AMS CI [40200940728](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40200940728) passed type check, PostgreSQL migrations, security regression and PostgreSQL integration, then failed at the existing dependency audit advisory; later build/package/HTTP smoke steps were skipped.
- **Not verified:** authenticated browser screenshots, role-specific rendering, 1440/1280/1024/900/768/390/320 widths, keyboard/focus/touch, contrast and assistive technology. These require an authenticated visual review; CI is not treated as visual sign-off.
- **Next action:** remain in Dashboard. Finish authenticated browser and responsive review of all three views, then fix only Dashboard-specific visual gaps and record explicit acceptance. Do not start Inbox or any other module before this gate.


## Latest corrective slice — Dashboard Overview priority and order · 25 October 2026

- **Issue from user review:** the earlier Overview made the order of attention unclear because the operating KPI strip sat between Needs attention and the task queue/deadline work.
- **New order:** compact reporting scope → Needs attention → Active delivery → Deadlines & team load → Operating snapshot → Client Delivery Focus → Finance control → shortcuts → recent audit activity.
- **Priority logic:** cross-module exceptions sort by danger/critical, warning, then informational severity, preserving server order within each severity. The Urgent summary receives stronger visual weight when its count is nonzero. Inbox triage stays in its own authorized panel and is not merged into the exception dataset.
- **Source/test changes:** [c4b41cdf](https://github.com/Kapitech-Agency/kapitech-ams/commit/c4b41cdf6d99ede2b69ec1723feeaec6e7e13f99), [16b83be1](https://github.com/Kapitech-Agency/kapitech-ams/commit/16b83be1f05fd2d17828947c0e87146f870fcbcc), [84144ca0](https://github.com/Kapitech-Agency/kapitech-ams/commit/84144ca03b820a841d67c57e2079a4409e5daf83), [7e1c24bc](https://github.com/Kapitech-Agency/kapitech-ams/commit/7e1c24bc3d0cef3bad07cf87649a183bec4c020f). The authoritative main-content spec and Maven-inspired implementation guide are aligned; the gap register/progress map record this correction.
- **CI finding:** Quality Gate [40212344633](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40212344633) caught three stale test assertions from the previous hierarchy and old filter expression. They were corrected in the follow-up test commits. Latest exact-SHA CI and Quality Gate are not yet confirmed green. Do not claim completion until both the current checks and the later authenticated visual acceptance gate are satisfied.
- **Next single action:** refresh the latest GitHub Actions runs for current branch, fix any remaining test/build failures without restoring the old order, then proceed to authenticated Dashboard visual review. No other module is authorized to begin yet.


## Latest user-directed correction — Dashboard Overview card composition · 26 October 2026

- **User requirement:** follow the supplied production dashboard pattern rather than inventing a generic action-first stack. Finance and Projects are the primary cards. The remainder is grouped as: Project progress + Needs attention; Task queue + Upcoming deadlines; Team workload + Client delivery focus; Recent activity + Workspace shortcuts. The “Priority 01” label is absent.
- **Implementation:** [62abbbcc](https://github.com/Kapitech-Agency/kapitech-ams/commit/62abbbcc8b3f161343b38b4d8d2edf1df5267e2c) establishes the card composition; [41a48be](https://github.com/Kapitech-Agency/kapitech-ams/commit/41a48be29dd78bc47fef489cb42b79bb49dc2fe7) corrects source-state presentation. Finance values and trend remain separated by accounting meaning; Projects risk donut and Creative/IT bars derive from saved source records; progress appears only when valid saved progress exists.
- **Regression/quality evidence:** [1ac957e](https://github.com/Kapitech-Agency/kapitech-ams/commit/1ac957e6fc0e03700a290fdfb0220c8d78a92cd7) aligns structural/source tests; [64725ba](https://github.com/Kapitech-Agency/kapitech-ams/commit/64725ba5647323c6a7366c45783a14e9f9e5306f) fixes the final copy-case mismatch. Exact-HEAD Quality Gate [40216837643 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40216837643), including typecheck, regression tests and production build.
- **CI blocker:** AMS CI [40216837672](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40216837672) passed database/security checks and integration, then failed the existing high body-parser@1.20.6 audit advisory [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828). This is not caused by Dashboard code.
- **Not verified:** authenticated browser screenshots, production data/role rendering, viewport/reflow, keyboard/focus, 200% zoom and accessibility. No current browser profile has a recorded AMS sign-in. Remain in Dashboard and do not start Inbox until these checks and explicit user sign-off are complete.


## Dashboard Overview functional controls — 26 October 2026

- The header now shows direct Overview, Performance and Analytics navigation. Refresh and permission-safe project actions remain in the page header.
- The reporting toolbar provides Month/Quarter/Year grouping, period selection, previous/next and Clear, using the existing shared reporting-period context. Recent 30 days remains the default. Scope copy distinguishes period-based financial/time summaries from current-state project, task, receivable and deadline measures.
- Projects in progress has All/Creative/IT service-line filters with source-derived counts; the adjacent list changes with the selected filter.
- Upcoming deadlines has All/Overdue/Today–7 days/Days 8–30 filters. Counts are based on all qualifying commitments; the visible preview is filtered and then capped.
- Existing Task queue filters remain functional. Accessible names, selected states, hover/focus response and contextual empty states are present.
- Exact-SHA Quality Gate [40222829265 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40222829265). AMS CI [40222829303](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40222829303) passed type/migration/security/PostgreSQL integration checks, then failed on the pre-existing body-parser@1.20.6 high-severity audit finding [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828).
- Authenticated browser rendering, actual role-specific visibility, hover/focus/keyboard/touch, reflow from 1440px to 320px, contrast, 200% zoom and assistive-technology review remain NOT VERIFIED. Do not start Inbox before Dashboard sign-off.


## Dashboard header quick-action contract — 26 October 2026

- Source/test SHA: [4062d917](https://github.com/Kapitech-Agency/kapitech-ams/commit/4062d9178f4494e316bb5cab00d7c1538edfbb90).
- Global Dashboard header: **Create invoice** when invoice-creation permission and receivables route are both available; otherwise **Invoices** when the register is readable. **New project** when creation is permitted; otherwise **Projects** when readable. **Refresh** remains secondary and reflects loading/disabled state. The previously added global New task action was removed because the official Dashboard header contract does not call for it; task creation remains in its owning workspace.
- Quality Gate [40280398446 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40280398446), including typecheck, regression tests and production build. AMS CI [40280398538](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40280398538) failed only at the existing dependency audit; type check, security regression and PostgreSQL integration passed.
- Still not verified: authenticated rendered/browser acceptance, role-specific visual output, responsive layout across 1440–320px and accessibility. Keep Dashboard active until sign-off.


## Latest correction — Finance and Projects Overview card composition · 26 October 2026

- Current source/test head: [17045f98](https://github.com/Kapitech-Agency/kapitech-ams/commit/17045f98f8bef77f0ff4c4100c65d6a1d42aa378).
- Finance values and the line chart stay inside the primary Finance card. The smaller Cash received and Expenses recorded visuals sit beneath that chart in the same card; the standalone full-width Money movement row is removed.
- Selected-period values reuse canonical invoice-payment and eligible-expense rules. Outstanding receivables, project portfolio state and delivery deadlines remain current-state measures.
- Quality Gate [40286753576 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40286753576).
- AMS CI [40286753536 failed at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40286753536) for the pre-existing body-parser@1.20.6 advisory GHSA-27r3-jxmh-p828. Type check, migrations, security regression and PostgreSQL integration passed; downstream build/package/HTTP smoke steps were skipped.
- Authenticated visual acceptance remains NOT VERIFIED. Dashboard stays the only active module until user sign-off; do not start Inbox.


## Latest Stage 4 slice — Dashboard header actions and reporting controls · 26 October 2026

- Code/test head at this checkpoint: [5cf48154](https://github.com/Kapitech-Agency/kapitech-ams/commit/5cf481540993908bb201d3b64cfd92cfa7f899aa).
- Visual styling: [0d1f00fe](https://github.com/Kapitech-Agency/kapitech-ams/commit/0d1f00fe2f8a8ff9e042af7c661ba89c6b5a0d6f). Header title hierarchy is clearer; Create invoice remains the leading commercial action when permitted, New project is secondary, Refresh stays compact. Buttons/selectors use 8–10px corners rather than full-pill geometry; Overview/Performance/Analytics uses a restrained underline tab pattern aligned with the Maven reference; Date range has a calendar icon.
- Functionality contract preserved: route/permission checks still govern Create invoice versus Invoices and New project versus Projects. Month/Quarter/Year and date range selector, previous/next period, clear period, project/deadline/task filters remain stateful.
- Validation: Quality Gate [40294219603 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40294219603), including TypeScript, regression suite and production build. AMS CI [40294219619 failed at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40294219619) for the pre-existing body-parser@1.20.6 high DoS advisory GHSA-27r3-jxmh-p828; type check, PostgreSQL migrations, security regression and integration passed. Downstream build/package/HTTP smoke was skipped.
- Not verified visually: no authenticated browser profile is available for ams.kapitech.id, so role-specific actions, responsive wrapping, keyboard/focus, contrast and assistive technology are not signed off. Do not equate CI success with visual acceptance. Keep Dashboard active until the user approves the visual direction; do not start Inbox.


### Latest Stage 4 slice — Dashboard Overview visual-first content refinement · 26 October 2026

- Source/test head: [7f5d6f92](https://github.com/Kapitech-Agency/kapitech-ams/commit/7f5d6f92c5496bfa2b61cdd2fd14977d17b6f520).
- Finance: outstanding receivables and invoice-versus-expense line chart form the primary surface; Cash received and Expenses recorded are two compact mini-chart cards within the same Finance card, driven by canonical payments/eligible expenses.
- Projects: balanced Active/Overdue/Open tasks metric tiles precede the risk/deadline ring and Creative/IT workload bars.
- Density: report scope uses a compact period row; repeated “X of Y projects” copy and redundant task description were removed; existing project/deadline/task filters retain their real counts and selection behavior.
- Header actions, reporting-period state, permissions, routes and Finance formulas are unchanged. No API/backend/schema or demo-data changes.
- Quality Gate [40297817157 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40297817157). AMS CI [40297818288 failed only at the pre-existing dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40297818288) for the body-parser@1.20.6 advisory GHSA-27r3-jxmh-p828; type, migrations, security and PostgreSQL integration passed.
- Authenticated browser rendering, actual role output, responsive/keyboard/accessibility acceptance remain NOT VERIFIED. Do not start Inbox before Dashboard sign-off.


## Latest Dashboard Overview main-content gap — commercial quotation follow-up · 26 October 2026

- New daily-use surface: **Quotation follow-up** inside the main Finance card, linking the commercial pipeline to the invoice workflow used by Kapitech.
- Data/route contract: canonical `api.proposals.getAll()`, route-gated by `canOpenDashboardRoute('/admin/finance?tab=quotations')`; visible route `/admin/finance?tab=quotations`.
- Actionable current stages are Draft, Internal review, Approved without linked invoice, and Sent to client. The status filter changes the displayed shortlist. Expired/near-validity records appear first when their saved dates are valid.
- Source-only semantics: no quotation values become invoice/receivable numbers, no fake record or amount is created, and quote-stage status is treated as current state rather than selected-period history.
- Regression coverage: assert source gating, data contract, current-stage predicates, functional filter state, route, and honest missing/empty/filtered-empty states.
- Core UI/source commit: [bea022f9](https://github.com/Kapitech-Agency/kapitech-ams/commit/bea022f9f1eac9f03e767d88d60a789a8bcb14f1); final test-scope correction at [82fa4ff4](https://github.com/Kapitech-Agency/kapitech-ams/commit/82fa4ff4301c8bf51bb168973c191f4516498bd1). Exact-SHA Quality Gate [40303410048 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40303410048): typecheck, regression tests and production build succeeded. AMS CI [40303410305 failed only at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40303410305) for the pre-existing high-severity `body-parser@1.20.6` DoS advisory [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828); type check, PostgreSQL migrations, security regression and PostgreSQL integration passed, while later build/package/HTTP smoke steps were skipped. Browser-authenticated rendering and Stage 5 responsive/accessibility checks remain **NOT VERIFIED**. Dashboard remains the only active module; do not begin Inbox before explicit user sign-off.


## Latest Stage 4 slice — Dashboard Overview visual-first copy reduction and chart hover refinement · 26 October 2026

- Current source/test SHA: [1b614c1f](https://github.com/Kapitech-Agency/kapitech-ams/commit/1b614c1f4b2e48232d36f6ba745cf3ae987a2b95).
- The date period is shown only in the existing header toolbar. The Overview body begins directly with Finance and Projects; redundant reporting-scope card, long Overview subtitle, repeated chart/helper paragraphs and duplicate quotation/task count copy were removed. Distinct loading, unavailable, empty and filtered-empty states remain.
- Header actions remain permission-aware: Create invoice or Invoices, New project or Projects, and Refresh. The shared period selector, previous/next, clear-period action, view tabs, project filter, deadline filter, task queue filter and quotation-stage filter remain functional.
- Finance line chart now positions its detail tooltip near the selected data point, uses consistent line/marker colours and retains keyboard point selection. The chart still represents issued invoice values and eligible expenses; it does not imply profit or cash flow.
- Quality Gate [40311057121 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40311057121), including TypeScript, regression tests and production build.
- AMS CI [40311056256 failed only at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40311056256) on the pre-existing high body-parser@1.20.6 advisory GHSA-27r3-jxmh-p828; type check, migrations, security regression and PostgreSQL integration passed; later build/package/HTTP smoke steps were skipped.
- Authenticated browser rendering, actual production roles/data, viewport reflow, chart-hover rendering, keyboard/touch and accessibility remain NOT VERIFIED. Dashboard stays the only active module until explicit user sign-off.


## 2026-10-26 — Dashboard urgency and shortcut hierarchy

- Reordered Overview content by operational urgency: (1) project delivery and exceptions, (2) task queue and upcoming deadlines, (3) Finance and project portfolio analysis, (4) team workload and client delivery focus, (5) recent audit activity.
- Moved the existing authorized Tasks, Clients, and Documents shortcuts to the Dashboard header. Finance and Projects remain represented by their primary header actions, avoiding duplicate shortcut entries. Links remain filtered through the existing route-access check.
- Removed the lower Workspace Shortcuts card; recent activity now occupies the final row without a duplicate/secondary shortcuts panel.
- Scope remained frontend presentation and regression assertions only. No backend, API, database, authentication, role, permission, route, or business-logic changes.
- Visual sign-off is still pending; this source change is not evidence of authenticated production rendering or responsive acceptance.

- Follow-up layout correction: the final Recent Activity panel now uses the full available row width after the shortcut panel was removed.


## 0.3 Dashboard reference/content and empty-state correction — 26 October 2026

- User supplied the Fynix AI Finance Management dashboard on Behance as a content-design reference. Adapted patterns are a clear headline value, compact related metrics, meaningful trends, proportional distribution, and concise record lists—not personal-wallet concepts, sample figures, palette or unsupported AI features.
- Aligned the structural specification and Maven-inspired implementation guide with the active Overview order: header actions and visible shortcuts → Project delivery + Needs attention → Task queue + Upcoming deadlines → Finance + Project Portfolio → Team workload + Client delivery focus → full-width Recent Activity.
- Contextual empty states use card-specific labels, a clear title, concise explanation and authorized next action when useful; confirmed clear states have restrained success treatment. Empty, filtered-empty and unavailable-source states remain distinct.
- Validation baseline prior to this correction: Quality Gate on [e55fb6d3](https://github.com/Kapitech-Agency/kapitech-ams/commit/e55fb6d3a4a907c7ed7ee5c5c8756bac8151a44c) passed TypeScript but failed regression assertions that still expected the earlier row order and old empty-state copy. This commit updates those assertions together with the source-of-truth card contract. Verify CI and Quality Gate on the exact new SHA before claiming a pass.
- No backend/API/database/authentication/permission/Finance formula changes.


## 0.4 Dashboard focus-card visual refinement — 26 October 2026

- Focused only on Needs attention, Finance, Projects portfolio and Recent activity. Needs attention now has consistent severity rails, a clearer row hierarchy and a separate Inbox triage sub-workspace with aligned count tiles. Finance separates its headline receivable metric from the trend, stages its movement visuals as supporting cards and keeps quotation follow-up as a distinct source-backed list. Projects has a labelled portfolio-signal distribution, clearer metric tiles and aligned Creative/IT workload bars. Recent Activity uses explicit event, actor/time and severity columns instead of leaving the centre of the full-width panel empty.
- All changes are presentation-only. Existing canonical records, filters, source states, routes, authorization checks, financial semantics and empty/unavailable behavior remain unchanged. New regression assertions cover the four card structures and scoped CSS.
- Quality Gate must pass on the exact commit before this slice is considered validated; production visual inspection at desktop/tablet/mobile widths remains a separate acceptance step.


## 0.5 Dashboard control and card layout pass — 26 October 2026

- Projects portfolio now stretches to the Finance panel height in the shared row, while its metrics, portfolio signal distribution and Creative/IT workload retain deliberate internal spacing.
- Dashboard Overview no longer uses a global reporting-period/date-range selector. Finance trend/money movement and Team recorded-time each own independent Month/Quarter/Year controls. Needs Attention has a functional severity filter; Upcoming deadlines and task queue keep their existing current-state filters.
- Project All/Creative/IT filter controls are compact and aligned with Project registry. Dashboard tabs wrap instead of using horizontal scrolling. Quick-action controls share an exact height and wrap cleanly at constrained widths.
- Team workload receives a stable owner-row layout and its own recorded-time period filter.
- Recent Activity is a semantic table with search, severity/time-window filters, row-count control, and local pagination, based only on loaded canonical audit records. Permission checks and audit fields remain unchanged.
- All changes stay in frontend presentation/derived filtering. No backend, API, database, authentication, permission policy or Finance formula changes.


## 0.6 Local date scope and test alignment — 26 October 2026

- Overview hides the shared reporting-period controls. Finance period selection independently scopes invoice/expense trend and money movement. Recorded Time independently scopes team time logs. Upcoming Deadlines retains its operational horizon filter and Needs Attention has severity filtering.
- Regression tests now assert the semantic Recent Activity table and its real filter controls, rather than the previous card/list markup and empty-state wording. Global reporting-period tests preserve shared controls for Performance/Analytics while allowing Recorded Time to use its own card-local scope.
- Updated the Main-Content Restructuring Specification and Maven-inspired implementation guide so the source documentation no longer requires a global date selector on Overview.
- TypeScript passed on the previous code SHA; this test/documentation correction must be validated by the next Quality Gate run before marking this slice complete.


## 0.7 Consistent Dashboard card header separators — 26 October 2026

- Normalized the header treatment across all Dashboard Overview cards, including Project Delivery, Needs Attention, Task Queue, Upcoming Deadlines, Finance, Projects, Team Workload, Client Delivery Focus and Recent Activity.
- Every card now uses one shared heading size, consistent header padding, a subtle header surface and a visible one-pixel divider before the content. Mobile uses a smaller horizontal inset and stacked action layout; list/table cards retain their own row dividers beneath the shared header boundary.
- Added a regression test to prevent card-specific headers from silently losing the shared separator. No business data, calculations, routes, permissions, or backend/API files changed.


## 0.5 Dashboard control and visual consistency pass — 26 October 2026

- Removed the duplicated page-level Dashboard period selectors; Finance trend and Recorded Time retain card-local period controls. Upcoming Deadlines, Needs Attention and Recent Activity keep their dedicated filters.
- Replaced card-level native dropdowns with AMS CustomSelect controls for consistent chevron spacing, menus and selected states.
- Unified header action heights, rectangular button surfaces, red active selections, no hover outline/card glow, and wrapping tabs/header actions. The Dashboard mount uses a single constrained page-scroll container.
- Projects stretches to match Finance; the Finance line-chart region is taller to align with the receivables panel. Team Workload uses the same outer card/body rhythm as sibling cards.
- Recent Activity adds actor and sort filters to search/severity/time filters, with numbered pagination, first/previous/next/last and 5/10/20 rows per page. Filters operate on already-loaded audit records only.
- No API, database, authentication, role/permission, finance calculation or business-logic changes.


## 0.5 Dashboard controls and card-level date refinement — 27 October 2026

- Removed the shared reporting-period bar from Dashboard Overview only. It remains available for other workspaces and Dashboard Performance/Analytics; Overview uses Finance grouping/period, Recorded Time grouping/period, deadline/task filters and Recent Activity time-window/custom-range controls independently.
- Standardized header quick actions, view tabs and Project service-line filters to consistent heights and responsive alignment. View tabs wrap instead of becoming a horizontal scrolling strip.
- Kept Projects stretched to match the outer height of Finance. Team Workload owner signals and card-local period controls receive consistent alignment.
- Recent Activity retains search, severity/actor/time-window filters, sorting, page-size and pagination; the new custom From/To range filters the audit records by the visible UTC date.
- Updated regression assertions to reflect the removal of the Overview-wide date picker while retaining app-wide ReportingPeriodProvider coverage elsewhere. No API, database, access-policy or financial-calculation changes.


## Dashboard control follow-up — 27 October 2026

- Split primary Create invoice / New project actions from Tasks, Clients, Documents shortcuts and Refresh. Buttons share a fixed 36px header height and the action group may wrap instead of overflowing.
- Moved Projects in progress service-line filters and Project registry to one toolbar beneath the card title. This keeps all card heading strips at a 58px baseline and the All/Creative/IT control group aligned with Project registry at 36px outer height.
- Replaced Task Queue and Quotation Follow-up horizontal-scroll filter strips with wrapping button groups. The Dashboard Overview branch is regression-tested to contain no `overflow-x-auto`.
- Applied one shared 32px card-action style to Finance, quotation, task, time-log, Inbox, audit, Projects and delivery links. Custom dropdowns now differentiate the open/focus tint from selected crimson option state; active filters, tabs and pagination retain a consistent crimson selected state.
- Projects continues to stretch to Finance row height through its flex body. Recent Activity remains a source-backed table with search, actor/severity/time-window/custom-date filters, sort, row-count selection and pagination.
- No backend/API/database/financial calculation/permissions changes. Quality Gate result must be confirmed for the new SHA; AMS CI still has an independent high-severity dependency audit finding for body-parser.


## 0.5 Dashboard flow and calendar-control refinement — 27 October 2026

- Dashboard shell/body scroll duplication is prevented by using the shell as the viewport boundary and the app main region as the sole vertical scroll container. Overview tabs and card filter groups wrap rather than form horizontal scroll strips.
- A final Dashboard-only CSS contract standardizes card header heights, card-action dimensions, spacing and filter geometry to override legacy cascade conflicts.
- Finance and Recorded Time use custom calendar-triggered period selectors with Month/Quarter/Year grouping inside the calendar. Period choices are constrained to values provided by the existing reporting-period helper. Recent Activity uses a matching date panel with 7/30/90-day, custom-date and all-loaded-date presets.
- Project Portfolio has an explicit flex body to stretch with Finance in the shared analysis row. Project and task active filters use a restrained dark-crimson selected state.
- Presentation-only: canonical data, routes, calculations, backend and permission checks remain unchanged. Validate Quality Gate and CI against the exact commit; dependency audit is tracked separately from frontend verification.


## 0.5 Dashboard header, period-dropdown and active-state consistency — 27 October 2026

- Project registry is a permission-aware Dashboard header action. All/Creative/IT project filters now live in the Projects in progress card heading and use compact segmented-control geometry.
- Finance and Recorded time use the shared DropdownPortal for reporting periods. Recent Activity uses the same overlay behavior for time presets and custom dates; it closes on outside click/Escape and does not remain open simply because Custom range is selected.
- Active state matches the root AMS design system: Overview/Performance/Analytics uses the light underline tab, segmented filters use the neutral `--line` surface, calendar selections and custom dropdown selections use a restrained accent tint, and pagination remains a distinct page indicator.
- Header controls are standardized at 36px. Source records, authorization, routes, financial formulas and backend/API/database logic remain unchanged.
- Regression tests cover card-header placement, project registry ownership, dropdown portal wiring and active-state styling. Check CI/Quality Gate for the exact commit before marking this work validated.


## 0.5 Dashboard-wide button consistency — 27 October 2026

- Added a final scoped button/control contract to GlobalExecutiveDashboard.css. Header actions and shortcuts use the same 36px geometry, card actions and pagination use 32px, Project service-line segments remain 28px inside a 36px group, and date/select triggers use the same 36px baseline. Larger deadline choice tiles retain their content-driven size but share the same border, radius and selected-state system.
- Standardized border radius, typography, horizontal padding, hover behavior, disabled opacity, and visible keyboard focus. Navigation tabs retain their semantic underline; primary invoice creation retains the brand action treatment; selected filters use the same neutral surface. Calendar popup controls receive matching rules in their portal, outside the Dashboard DOM.
- The work is limited to Dashboard presentation and regression coverage; no route, permissions, data, filter logic or backend behavior changed.


- Button consistency follow-up includes the Analytics report choice tiles and the Needs Attention "Show all levels" action, so those controls use the same selected-state and card-action styles. Calendar overlays define their own copy of the control tokens because they render outside the Dashboard DOM.


## Dashboard control consistency and CSS cascade cleanup — 27 October 2026

- Removed Tailwind hover-lift classes from Dashboard header actions and removed CSS translateY hover effects from controls, card surfaces and chart bars. Hover feedback now comes from background, border and text color rather than vertical movement.
- Consolidated repeated exact-selector CSS rules per media/support context by keeping the effective declaration for each property and moving the unique declarations into one canonical rule. Empty duplicate rules and empty at-rule wrappers were removed. Calendar chevron rotation on open remains a state indicator; it is not a hover-lift effect.
- Recent Activity remains a source-backed table with search, actor/severity/time-window filters, custom From/To dates, sort order, page size and pagination. Project filters, per-card date ranges, header button geometry and tab wrapping remain in place.
- Validation requirement: Quality Gate must pass on the exact cleanup commit. Full AMS CI also runs a dependency audit; previous runs have failed on an existing high-severity advisory for body-parser@1.20.6, unrelated to this front-end change.
- No backend, API, database, auth, permission, workflow or financial-calculation changes.


## 0.5 Finance card responsive polish — 27 October 2026

- Scoped the layout to the Finance panel container so the headline receivables metric and financial trend only sit side-by-side when the actual card is wide enough; narrower card widths use a single-column layout without fixed-height blank space.
- Refined the Finance headline metric, period-filter/chart region, cash/expense movement tiles and quotation follow-up list. Period controls remain local to Finance. The trend subtitle states the distinct invoice and expense date bases; movement values receive consistent type treatment; quotation follow-up includes a concise purpose line.
- Existing records, filter behavior, routes, permissions, currencies, period calculations, invoice/expense semantics and empty/unavailable states are unchanged. Regression coverage now checks container-aware breakpoints and Finance section hierarchy.
- Verify Quality Gate on the exact commit; rendered review of Finance at desktop, tablet and mobile widths remains required before visual sign-off.


## 0.5 Finance composition and Cash & Expense Movement correction — 27 October 2026

- Replaced the final stack of conflicting Finance CSS overrides with one responsive style contract scoped to the Finance card. The receivable headline and financial trend now read as one top-level analysis group without competing nested surfaces; the chart keeps its own card-local reporting period.
- Reworked Cash & Expense Movement into two comparable tiles. Each tile places its primary value and contextual label before a full-width, baseline-aligned mini bar chart; cash receipts and eligible expense buckets retain their separate colors and canonical source calculations. The period chip reflects the Finance period selected above.
- Quotation follow-up remains a distinct, filterable canonical register preview below the movement section. Existing role checks, date range semantics, source-unavailable states, invoice/expense formulas, currencies and routes are unchanged.
- Regression assertions now cover the Cash & Expense Movement context, date scope, bar chart layout and responsive container variants. Confirm the new Quality Gate result for this exact commit; the unrelated CI dependency audit has historically flagged `body-parser@1.20.6`.


## 0.5 Dashboard refinement: no decorative dividers — 27 October 2026

- Moved Project Registry from the global quick-action cluster to the Projects in Progress card header beside All/Creative/IT. The service-line filters remain compact; the registry action shares their 36px toolbar height.
- Replaced the active tab underline and internal card/list dividers with soft selected surfaces, spacing, row hover states and restrained typography. Major cards keep a subtle outer boundary; internal groups rely on visual rhythm instead of horizontal rules.
- Finance and Team Workload retain their own per-card date controls. Recent Activity retains search, actor/severity/time filters, custom date range, sort order, page size and pagination; table rows use soft surfaces instead of grid lines.
- UI, regression tests and execution checkpoint updated together. Verify Quality Gate on the resulting commit. No API, database, authentication, permission, financial calculation or source-record changes.


## 0.5 Dashboard per-card filters and Finance chart refinement — 27 October 2026

- Moved the Finance reporting-period selector to the Finance card header, the recorded-time period selector to Team Workload's header, and the Recent Activity date-window picker to the Recent Activity header. Controls have fixed widths so selected labels no longer resize the card toolbar.
- Finance now keeps its trend plot visible when source data is available but the selected period has no eligible values: both chart series use zero points and a centered empty-state overlay explains the absence of records. Unavailable invoice/expense sources remain a separate unavailable state.
- Removed Finance content separators and made the inner layout rely on spacing and subdued surfaces. Project Portfolio is explicitly stretched to the same desktop row height as Finance; compact project service-line controls align to the registry action.
- Refined the Dashboard header/shortcuts, removed horizontal tab overflow, unified quick-action heights, and tightened Team Workload plus Recent Activity responsive controls. Recent Activity retains its canonical search, actor/severity filters, date window, sort order and pagination.
- Source data, permissions, routes, business calculations and backend/API/database code are unchanged. Validate Quality Gate on this exact SHA and continue to treat production visual inspection as a separate acceptance step.


## 0.5 Dashboard controls and Finance visual cleanup — 27 October 2026

- Finance's Invoices vs expenses trend and Cash & expense movement use clearer inner spacing and consistent sub-surfaces while sharing the Finance-card-local reporting period.
- Recent Activity search is compact and beside its filters. Actor filter width follows the longest loaded option and remains stable while another actor is selected; controls reflow on narrow screens.
- Recorded-time period control and Open Time Logs sit beside the Recorded time heading. Open Finance, View audit log and Project registry use the standardized action height.
- Corrected the calendar year matcher so year navigation can identify four-digit year options. Presentation-only; no backend, API, database, permission or calculation changes.


## 0.5 Recent Activity layout correction — 27 October 2026

- Fixed the Recent Activity responsive filter grid where the search field could collapse into one cell instead of spanning the row on mobile, and conflicting fixed-width actor/period controls could crowd the toolbar at intermediate widths.
- Replaced the oversized page-number/First/Last pagination cluster with a compact Rows + Previous / Page X of Y / Next control group. Search, actor, severity, sort order, date-window filter, custom date range, results count and page-size selection remain functional.
- Reasserted a single final CSS contract for this card's header, filters, table columns, mobile actor treatment and pagination. Other Dashboard cards, business logic, data sources, permissions and backend remain untouched.
- Quality Gate / AMS CI must be checked on this correction commit before marking it validated.


## 0.6 Dashboard pixel-precision spacing pass — 27 October 2026

- Established a final, scoped spacing contract for Dashboard card rows and card headers: preserved the original 12px between workspace cards, 12px header rhythm, and 8px between sibling controls. Changes apply to controls within a card/header, not the space between cards. At narrow widths, Finance period and Open Finance remain left-aligned with the same 8px gap instead of being pushed to opposite ends of the header.
- Finance calendar and Open Finance now share a 36px baseline and have zero incidental margins. Header action groups, Team time controls and Recent Activity actions reuse the same alignment rhythm. Narrow-screen header padding is 14px while desktop header padding is 14px 18px.
- Added a source regression test for the final CSS contract. This is a presentation-only refinement; canonical data, period behavior, links, permissions, backend and calculations are unchanged. Verify the Quality Gate on this exact commit before acceptance.


## 0.7 Dashboard control alignment and Recent Activity export — 27 October 2026

- Preserved the established 12px gaps between Dashboard cards. Standardized only internal control alignment: page-header quick actions and shortcuts share 36px height; project All/Creative/IT filters and Project registry share 28px height; Dashboard tabs wrap and no longer act as a horizontal scroll strip.
- Finance and Recorded Time retain independent card-level reporting periods; Recent Activity keeps search, severity, actor, date window/custom range, sort, reset, and pagination controls. Added CSV export for the currently filtered/sorted loaded audit events with Activity, Actor, UTC timestamp and Severity fields only; no sensitive audit metadata or new API source is exported.
- Team Workload gets a consistent internal rhythm for task-owner signals, recorded-time rows, and its period controls. The existing Projects-to-Finance equal-height contract is preserved.
- Presentation-only changes; canonical data access, permission gates, routes, backend, and financial calculations are unchanged. Validate Quality Gate and CI on this exact SHA.


- Follow-up alignment detail: removed the extra outer padding/border around the All/Creative/IT segmented group so its visible height no longer exceeds the 28px Project registry action. Card-to-card gap remains 12px.


## 0.5 Dashboard segmented filter consistency — 27 October 2026

- Project in progress (All/Creative/IT) and Task Queue filters now share one grouped background, compact option height, consistent active/hover/focus states and matching count badges. The group surface is visible as one connected control rather than separate floating pills. Project registry uses the aligned group height.
- Reinforced the desktop Finance/Projects row stretch contract so the Projects card body can fill to Finance height without changing card gaps; existing per-card date filters, wrapping tabs, header action sizing and Recent Activity table/filter behavior remain intact.
- Scope remains UI and test assertions only; no data source, API, finance calculation, auth or permission logic changes.


## 0.5 Shared Dashboard filter control — 27 October 2026

- Added `src/components/admin/DashboardControls.tsx` as the shared implementation for segmented filter groups and filter options. Project service line, Task Queue, deadline, quotation stage, Recent Activity time presets and card reporting-period groupings now share the same component.
- Filter groups use a visible rounded background; options share consistent spacing and sizing. Hover and active states are neutral grey, not brand red; task filters have a more comfortable group size than compact project filters.
- The global reporting period remains out of the Dashboard header. Card-local period controls remain attached to their respective cards.
- Frontend-only, without changing API/data sources, permissions, business logic, or financial calculations.


## 0.6 Shared Dashboard action controls — 27 October 2026

- The shared control module now renders Dashboard actions and filters through one reusable primitive. Header invoice/project/shortcut/refresh actions, card CTAs and Recent Activity date/reset/export/pagination actions use consistent rounded controls, boxed icons, and standard/compact heights.
- Filter active and hover states remain neutral grey. Create Invoice retains primary emphasis. Finance and Projects stretch to equal height on wide layouts.
- Existing hrefs, handlers, role permission gates, data semantics and financial calculations are preserved. Frontend-only.


## 0.5 Task Queue filter placement — 27 October 2026

- Moved the existing Task Queue filters from the body into the card header beside the Open Tasks action. Filter values, counts, permissions and queue filtering behavior remain unchanged; filter density is compact and wraps rather than introducing horizontal scrolling.
- Added a regression test confirming the filters belong to the card header and are not duplicated in the queue body.
- Presentation-only change; no backend, API, database, auth, permission or task workflow changes.


### 0.6 Shared control and calendar consistency — 27 October 2026

- Baseline: [282511c2](https://github.com/Kapitech-Agency/kapitech-ams/commit/282511c263fb24615aec27934d17d92a5d461cbe). Quality Gate regressions were traced to source-shape assertions that no longer matched shared DashboardControl/DashboardFilterGroup usage and card-local activity filtering.
- Added a dedicated shared component stylesheet for one neutral hover surface, 8px rounded-rectangle action geometry, consistent heights and card-local calendar buttons. The period calendar's trigger, Done, year navigation and month/quarter/year choices use DashboardControl.
- Finance and Project Portfolio stretch to equal height at desktop. Team Workload has a clear separator and row rhythm between task assignments and recorded time.
- No backend/API/authentication/permissions/finance formula changes. Exact-SHA Quality Gate and authenticated visual checks remain required before acceptance.


### 0.7 Shared control style authority and verification fixes — 27 October 2026

- Styled action controls in Needs Attention, task empty states, deadline empty states, client empty states, and Quotation Follow-up now use DashboardControl instead of bespoke raw links/buttons.
- Shared control stylesheet adds a final specificity guard so header actions, card actions, filter/calendar controls, and calendar-portal buttons use one neutral hover surface and 8px rounded-rectangle geometry.
- Regression tests are being aligned with the shared component contract (ARIA props and filter-group rendering), rather than removed or weakened to mask source-shape changes.
- No backend/API/database/authentication/permission/finance-calculation changes.


### 0.9 Deadline range regression alignment — 27 October 2026

- Updated regression expectations to the card-local deadline range and 30-day summary model. Tests verify custom dates filter already-loaded saved project/milestone deadlines, while summary counts remain limited to the standard overdue/30-day horizon.
- Header controls, tab wrapping, project filter sizing, equal-height Finance/Projects, Team Workload rhythm and Recent Activity table layout are covered alongside the new deadline range.
- Frontend-only. Production visual sign-off remains outstanding; CI dependency audit is a separate existing advisory.


## 0.5 Dashboard control alignment and pagination correction — 27 October 2026

- Restored a clearly visible selected state for Overview/Performance/Analytics and unified Project service-line filters with Task Queue filter active styling.
- Matched the Project Progress filters with Project registry and Task Queue filters with Open Tasks; card actions are consistent rounded rectangles. Header quick actions, card-local calendar triggers and controls use the same measured baselines.
- Finance and Projects flex bodies share their desktop row height. Task Queue and Upcoming Deadlines use a matching flex-fill body contract. Recorded Time is separated from owner workload by spacing, not a divider line.
- Recent Activity now uses shared `AdminTablePagination` from `AdminModulePrimitives`; custom pagination markup was removed while search, actor/severity/date filters, sort order, CSV export and responsive table semantics stay intact.
- Date selection remains card-local: Finance, Recorded Time, Upcoming Deadlines and Recent Activity each scope only their own measures.
- Presentation-only changes; no backend, API, data model, permissions, Finance formulas, or authorization checks changed.


## 0.5 Dashboard filter/action-control correction — 27 October 2026

- Corrected the final cascade for Projects in progress and Task Queue filter groups: the segmented containers now retain visible inner padding and a rounded neutral shell; selected filter text/background/border are forced to neutral tokens rather than the crimson brand accent.
- Applied a specific rounded-rectangle contract to Project registry, Open planning, Open Projects, Open project delivery and other Dashboard card-action links so card-header anchor rules cannot turn them back into pills. Actions match the filter group height.
- Restored explicit 16px top spacing and divider for Recorded Time within Team Workload.
- Added regression assertions for the filter shell padding, neutral active state, rounded card action links and Recorded Time spacing. Frontend presentation only; no API, database, auth, permission, data-source or workflow logic changed.


## 0.5 Needs Attention header control refinement — 27 October 2026

- Removed the redundant visible “Severity” label from the Needs Attention filter.
- Moved the existing All levels / Urgent / Attention / Info selector into the card header at the far right. A source-confirmed empty state now appears immediately to its left as a rounded rectangular indicator; it is not duplicated in the body.
- The filter still uses the existing attentionSeverityFilter state and canonical records. Per-item urgency labels, source availability handling, severity sorting, route access checks and Inbox triage remain intact.
- This was a scoped frontend and regression-test change only. Confirm the new commit's Quality Gate before considering the slice validated.


## 0.5 Dashboard control, empty-state action and typography cleanup — 27 October 2026

- Removed the permanent **Open quotation ledger** control from the Quotation Follow-up heading; the ledger route is now offered from the genuine no-records, no-follow-up and filtered-empty states.
- Moved **Open Time Logs** from the Recorded time heading into its empty state. The independent period selector remains in the recorded-time card header.
- Standardized Dashboard type scale: H1 26/32, H2 15/20, H3 13/18, H4 12/17, H5/H6 11/15; body 12/18, supporting copy 11/16, metadata 10/14.
- Enforced a two-tier control geometry: standard actions 36px high with 12px horizontal padding; compact filter/registry controls 32px high with 10px padding. Projects-in-progress filters use a neutral gray active state and plain count text, without a crimson block. Tabs remain wrapping/non-scrolling.
- Reasserted the equal-height Finance/Projects row, compact activity filters and responsive Recent Activity table styles. Existing per-card date controls and recent-activity search/actor/severity/time/order/export/pagination behavior remain in place.
- UI/UX and documentation only. No backend, API, database, permissions, authentication, route behavior or financial calculations changed.


## 0.5 Shared Dashboard filter shell and button-padding contract — 27 October 2026

- Confirmed All / Creative / IT already use the shared `DashboardFilterGroup` component. The visual defect came from a later legacy Dashboard CSS rule that reset its wrapper to transparent with no border, removing the shared segmented surface. That conflicting rule has been removed.
- The final segmented group is a 36px bordered shell with 2px interior padding; each option is 28px high and uses the shared 10px horizontal filter padding. The adjacent Project registry action and header quick actions use the 36px / 12px standard-action contract.
- Added canonical padding variables for standard, compact and filter controls, content gap, segmented shell padding and item radius in `DashboardControls.css`. Card-level styles now specify grouped layout and responsiveness rather than one-off horizontal padding.
- Added regression checks for shared-component usage, visible grouping, size alignment, padding tokens and non-scrolling Dashboard tabs.
- Frontend-only. No changes to backend/API/database/authentication/permissions/financial calculations or canonical source processing.


## 0.5 Dashboard alignment and filter parity follow-up — 27 October 2026

- Project service-line filter now uses the same shared segmented-control shell, item height, padding, border, and active state as Task Queue. Removed the project-only text-only active-state override and updated regression coverage.
- Tightened the Dashboard header control baseline and wrapping behavior; tabs wrap naturally and do not form a horizontal scroll strip. Kept date-range controls scoped to cards that need them rather than adding a global reporting-date control.
- Reinforced the Projects portfolio flex-fill layout alongside Finance, separated Team Workload's owner/task and recorded-time sections, and refined Recent Activity's filter toolbar/table spacing across desktop and compact layouts. Recent Activity retains the source-backed search, severity, actor, date-range, sort, reset, CSV export, and pagination features.
- Frontend-only. No API, database, permissions, authentication, or business calculations changed. Validation is pending for this exact commit; full authenticated visual review remains necessary.


- Recent Activity now supports additional client-side sort modes: highest severity first and actor A–Z, in addition to newest and oldest. Tie-breaking remains deterministic by timestamp; existing actor/severity/date filters, CSV export and pagination remain source-backed.


## 0.5 Dashboard responsive control and card hierarchy consolidation — 27 October 2026

- Consolidated overridden CSS declarations safely and replaced the repeated header/tab/card overrides with one final layout contract. The final rules give the header a stable action baseline, make action groups wrap at tablet widths, prohibit horizontal scrolling on the Dashboard tabs, keep Project service-line options compact inside the same-height registry toolbar, and make Projects flex-fill the Finance row.
- Team Workload uses separated task/time groups and aligned local period controls. Recent Activity keeps its search, actor/severity/date/order filters, custom range, CSV export and shared pagination; the table now uses soft row surfaces and a dedicated narrow-screen column layout.
- Existing canonical data, permissions, routes, financial semantics and filter behavior remain unchanged. TypeScript, regression tests, production build and AMS CI results must be checked on this commit.
