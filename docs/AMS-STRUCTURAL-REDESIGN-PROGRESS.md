# Kapitech AMS Structural UX/UI Redesign Progress

Progress evidence last recorded: 18 October 2026  
Documentation cross-reference updated: 19 October 2026 (no new UI or browser verification implied)
Repository: `Kapitech-Agency/kapitech-ams`
Required delivery branch: `main`

> **Status semantics:** This file is the compact progress roll-up, updated by the date above. Commit references and CI outcomes in individual slices are historical evidence for those exact commits; they do not prove the latest `main` commit or a live deployment is currently passing. Recheck current `main`, latest GitHub Actions, and authenticated browser/viewport acceptance before closing the redesign. The detailed historical view-by-view record is in [`AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md`](AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md).

> **Delivery-plan authority:** This file tracks structural UX/UI progress only. The overall path through navigation, main content, workflows, E2E, operational recovery and production deployment is defined by [`AMS-END-TO-END-DELIVERY-ROADMAP.md`](AMS-END-TO-END-DELIVERY-ROADMAP.md). Current requirement-by-requirement state belongs in [`AMS-FEATURE-CONTENT-GAP-REGISTER.md`](AMS-FEATURE-CONTENT-GAP-REGISTER.md). The dated/local phase lists below are UX/UI progress context, not a competing end-to-end schedule.

## Scope

Structural frontend UX/UI redesign only. Preserve all routes, query parameters, existing permissions, live data sources, workflows, APIs, persistence, authentication, RBAC, and financial/business rules. Do not add dependencies or use mock data. The Dashboard screenshot is intended to be the primary structural reference; the provided Google Drive image could not be rendered by the available execution tools, so no claim of direct visual inspection is made.

## Completed in this execution

### Shared workspace geometry and contextual navigation

- Updated `src/index.css` in commit `ff981a40c4ee7d92fe2c1fcc2b953026f26ee4e7`.
- Established explicit shared-shell styling for the module contextual navigation strip and its horizontally scrollable tabs.
- Made the active workspace tab more distinct using existing AMS theme tokens.
- Adjusted page-shell gutters and vertical rhythm for tablet and mobile breakpoints while retaining the canonical desktop spacing.
- No route, data, API, business logic, permission, or dependency changes were made in this slice.

### Regression test alignment

- Updated the stale Approval regression test in `tests/frontend-functional-regression.test.ts` in commit `69b8fe63a1e454855960b681a0935e76f9526a62`.
- The test previously attempted to read the deleted `src/pages/admin/AdminApprovals.tsx`, so CI failed before it could validate the current route behavior. It now asserts that the legacy route redirects and the retired component is not imported.
- The route behavior itself was not changed.
- GitHub Actions for commit `69b8fe63a1e454855960b681a0935e76f9526a62` reported success for both AMS CI and AMS Quality Gate:
  - https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39110780153
  - https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39110780138

## Current route/module work map

The canonical route inventory and per-view content-order guidance are in `docs/AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md`. This is the implementation reference, not evidence that visual browser testing has been completed.

### Navigation-related commits visible in current main — verification still required

The following recent commit messages are visible in repository history and should be carried into the current Stage 0/1 audit instead of being repeated blindly:

- [`27cb9b4`](https://github.com/Kapitech-Agency/kapitech-ams/commit/27cb9b463e116c08acff942c16fca225cb0bdda8) — exposes Projects Planning and Delivery worksheets.
- [`68979ff`](https://github.com/Kapitech-Agency/kapitech-ams/commit/68979ff3ad1c2c16fd23e8f624cb99bfa102768c) — groups Inbox categories and saved views.
- [`c7bbb61`](https://github.com/Kapitech-Agency/kapitech-ams/commit/c7bbb61bd61d25f58900ca8f17a38e845057689b) — completes Team & Resources vendor worksheet navigation.
- [`6c44e71`](https://github.com/Kapitech-Agency/kapitech-ams/commit/6c44e7156e1168a5c941aad7f77e99da8114bc9d) — normalizes an invalid Documents category query.
- [`e80664c`](https://github.com/Kapitech-Agency/kapitech-ams/commit/e80664cec3e6ce28b09a3e1e4ed5c2394d1b3df6) — adds navigation regression coverage for document category query state.
- [`f14eb8d`](https://github.com/Kapitech-Agency/kapitech-ams/commit/f14eb8d5ac014fee39052ec99bc998acb389d4be) — records Document Library category behavior in traceability.

These are commit-history references, not a claim that the changes were independently re-tested during this documentation task. Verify the current source, relevant automated checks and permitted browser/role behavior; capture the actual result in the gap register and traceability records.

Required follow-on sequence:

1. **Dashboard:** verify overview, performance and analytics compositions against the documented content-first hierarchy; preserve source/period context and unavailable states.
2. **Inbox and Projects/Tasks:** inspect queue/detail and board/table/timeline work surfaces; keep query state and task lifecycle unchanged; remove only proven unreachable duplicate presentation.
3. **Clients and Finance:** improve page composition and worksheet hierarchy without changing relationship ownership, financial calculations, posting, reconciliation, period controls, or permissions.
4. **Team & Resources and Documents:** standardize register/detail layouts and drawers; preserve confidential fields and protected document storage behavior.
5. **Website CMS and Settings:** make each content editor/register or system setting group task-oriented; preserve publication, MFA/security, audit, and integration behavior.
6. **Global overflow pass:** trace root/body/shell/main scroll ownership and local table/board overflow. Do not remove clipping or scroll-lock rules without browser evidence.
7. **Validation:** typecheck, regression/security tests, production build, then authenticated browser checks at 1440, 1024, 768, 390 and 320px where credentials/runtime access permit.

## Validation limits

- AMS CI and AMS Quality Gate passed on the latest commit listed above.
- This execution environment cannot resolve/connect to `github.com` through a local Git clone. Source inspection and writes used the GitHub repository interface.
- No authenticated production session, browser DOM/computed-style inspection, screenshot capture, or touch/keyboard viewport test was performed. Do not report these as completed.
- The structural redesign is **in progress**. The shared-shell slice is not a substitute for the required module-by-module redesign and responsive visual QA.

## Next action

Continue with a bounded module-specific structural slice based on the current source and this repository's UX/UI guidelines. Commit directly to `main`, inspect the resulting GitHub Actions run, and record exact completion and remaining risks here after each substantial stage.

## Seventh implementation slice: dedicated workspace topbar tabs

- Added `AdminTopbarTabs` to `src/components/admin/AdminModulePrimitives.tsx` as a dedicated shared primitive for the authenticated shell's desktop workspace navigation. It uses the existing navigation access filter, route links, active `aria-current` semantics, stable tab geometry, keyboard focus styling, and active-tab visibility within horizontal overflow.
- Updated `src/pages/admin/AdminLayout.tsx` to use `AdminTopbarTabs` for the module navigation row instead of reusing the general `AdminSectionTabs` component. Secondary worksheet and in-page tabs continue to use `AdminSectionTabs`.
- Updated `tests/frontend-functional-regression.test.ts` to assert the dedicated topbar primitive is used exactly once in the shell.
- Commits on `main`: `9baf3d36868af58d94dc21590c8c29ecfd08201f`, `51af71b9e66cee8acd9a64dfa4fec4315c82e690`, `6356d34a4542a3ea80b5ac74750573e7988a8961`.
- GitHub Actions for commit `6356d34a4542a3ea80b5ac74750573e7988a8961` was still running at the last check; no pass/fail result is claimed yet.
- This is a shared navigation foundation slice, not completion of module content redesign. No browser visual validation has been performed in this environment.

## Next action

Continue with module-specific workspace hierarchy, starting with Finance's primary workspaces and then the remaining CMS/Settings and module subtabs. Preserve all financial and access behavior; validate each coherent change against CI before reporting it complete.

## Eighth implementation slice: desktop topbar composition and mobile tab fallback

- Re-composed the desktop shell so the contextual module tabs share the primary 52px topbar row with search and global utilities, rather than occupying a separate desktop row below it.
- Kept the same role-filtered destinations and URL-derived active state. At viewports below 900px, the shell continues to expose the same views through the shared in-page tab primitive; the mobile tab row uses `top: 0` within the main scroll viewport, which already begins below the mobile topbar.
- Added/updated regression assertions for the dedicated desktop topbar primitive and mobile fallback.
- Relevant commits: `d7edd0ff2b273aa2e3ed6c6817183ef3009a8ef0`, `47f29b5abda85d1b603a9ae842770c20e2a68718`, `797c76e5d9fa69a93940c002cd7e611ed974a2c6`.
- The topbar composition is source-validated; authenticated browser screenshot/viewport verification remains unavailable and is not claimed.

## Ninth implementation slice: Dashboard and Finance content hierarchy

- Dashboard's supporting metric strip no longer sits between the primary chart/delivery context and the Active Projects workspace. Active Projects and Team Capacity now appear first; secondary metrics follow the primary workspace. Added spacing after the moved strip and regression tests for the intended content order.
- Finance's module header now uses the selected worksheet's existing description when available, making the purpose of each subview clear without changing financial logic or record behavior.
- Relevant commits: `05118a5fb309b5c0a9017e3a72ac25aab8b00d6b`, `a1716ba97ff7940a49abcbb00aa5eb06d9ddc29c`, `0511dfaf057b8ae67d947d8655c3f1ca3b53ffc6`, `b07be0fc010671b240e2719e7e4963284f89f58b`.
- GitHub Actions passed on commit `b07be0fc010671b240e2719e7e4963284f89f58b`:
  - Typecheck, tests, and production build: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39114700265
  - Verify: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39114700292

## Eleventh implementation slice: Dashboard project progress states

- Updated the desktop Active Projects register to display an em dash when a project's progress is not reported, rather than exposing the JavaScript string `null%`.
- Kept the mobile project card's existing unavailable label and made the desktop register and project-detail progress bars safely render zero visual fill when no progress value exists. No project records or progress values are inferred.
- Added source-level regression assertions for the unavailable label and safe bar widths.
- This is a bounded data-presentation correction within Dashboard Overview; it does not complete the remaining module/subtab redesign or substitute for browser visual QA.

## Remaining structural redesign work

The overall task is still in progress. Continue route-by-route review of Dashboard Performance/Analytics, Inbox, Projects/Tasks, Clients, all five Finance workspaces and their worksheets, Team & Resources, Documents, all CMS content types and Careers subviews, and Settings subviews. Review root/inner scroll ownership and validate browser behavior when authenticated access is available. Do not describe this task as complete until every active view has been reviewed and its frontend checks and available visual QA are recorded.

## Tenth implementation slice: Dashboard Analytics composition

- Reorganized Dashboard Analytics into a responsive 12-column layout on wide screens: the invoice/expense trend owns the main column (8/12) and project status is a supporting column (4/12). At smaller widths, the panels naturally stack.
- Kept all data sources, calculations, period scope, unavailable states and chart semantics unchanged.
- Added a regression assertion for the responsive panel hierarchy.
- Commit: `cd2f32071f9e66dc8e5f8ed9a94d59c89e038020`.
- GitHub Actions passed for the implementation commit:
  - Typecheck, tests, and production build: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39115156063
  - Verify: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39115156045



## Twelfth implementation slice: Finance worksheet context

- The Finance page header now identifies the selected top-level workspace (Overview & Control, Transactions & Cash, Receivables & Payables, Project Finance, or Accounting & Reports) as its eyebrow and uses the selected worksheet's own description as the subtitle.
- This closes a context gap where every worksheet repeated the same generic Finance description, forcing users to infer the page's purpose from the selected tab alone.
- Kept the existing topbar group navigation, secondary worksheet tabs, search, reporting period, data sources, permissions, routes, financial calculations, posting, reconciliation, and transaction behavior unchanged.
- Added a focused source regression test for the selected workspace and worksheet context.
- Commit and CI status will be recorded after direct-to-main delivery; no browser visual validation is claimed from source-only inspection.


## Thirteenth implementation slice: stable Careers workspace navigation

- Moved Careers' transient success/error notice below the Job openings / Applicants tab row. Saving or deleting a record no longer inserts feedback between the page header and workspace navigation, which could shift the navigation vertically during a workflow.
- Kept the notice dismissible and retained its source-backed message/tone. No applicant/job state, API call, permission, URL behavior, publication state, or data handling changed.
- Added a regression assertion for header → workspace tabs → feedback → active panel order.


## Fourteenth implementation slice: stable CMS register controls

- Moved transient save/delete feedback below the filter bar in Case Studies, Insights, Services, and Testimonials. The page header and search/filter controls now stay in their established position when a success or error message appears.
- Careers already follows the same principle with feedback below its Jobs/Applicants tabs.
- Kept the same dismissible notice, status text/tone, CRUD operations, editor drawers, filters, sorting, pagination, permissions, publication state, routes, and API behavior.
- Added a regression test asserting the intended header → filter bar → feedback → register order across all four CMS registers.
- [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39121347658) and [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39121347649) passed for commit `110f2272e0e16bbb3cbcecbec14f939cd6e9e963`, including typecheck, regression tests, production build, and the configured production/security checks.


## Fifteenth implementation slice: consistent Team Directory header

- Removed the inline member-count badge from the Team Directory page title. The page title now follows the same clean title/description/action hierarchy as sibling workspaces; record counts remain in the directory's dedicated supporting summary rather than competing with the title.
- No team records, count calculations, route state, permissions, or actions changed.
- Added a source regression assertion that keeps the title free of a duplicate inline count.
- [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39121528692) and [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39121528688) passed for commit `a4d86460030579b5565348556862d3a8a5c46bd9`, including typecheck, regression tests, production build, PostgreSQL integration, dependency audit, and production HTTP smoke test.


## Sixteenth implementation slice: consistent CMS header spacing

- Aligned the Insights header's bottom-margin ownership with Case Studies, Services, Testimonials, and Careers. The shared page shell now controls the gap between header and subsequent workspace content consistently across CMS content types.
- Added regression coverage for the common header spacing contract across all five CMS views.
- No content, publishing workflow, editor, data, permission, or route behavior changed.
- [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39121672188) and [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39121672144) passed for commit `d58e0defa78101010802539bbf6fa75ac36b0ab2`, including typecheck, regression tests, production build, PostgreSQL integration, dependency audit, and production HTTP smoke test.


## Seventeenth implementation slice: Dashboard subview context

- Dashboard's page header now labels the active Overview, Performance, or Analytics workspace and provides a concise description tailored to that view's actual job.
- This removes the same generic subtitle from three materially different workspaces without changing any route/query state, metrics, calculations, reporting period, permissions, or data sources.
- Added source regression assertions for all three header contexts.
- [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39121845217) and [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39121845263) passed for commit `1666aa72c9529b961b628ee03914b138d6247571`, including typecheck, regression tests, production build, PostgreSQL integration, dependency audit, and production HTTP smoke test.


## Eighteenth implementation slice: distinguish Client Onboarding from the directory

- When the existing query-backed onboarding scope is selected, the Clients workspace now uses a dedicated "Client Onboarding" title, onboarding-specific eyebrow, and task-oriented description. The default directory keeps its existing title and purpose.
- This clarifies the difference between the directory and onboarding workflow without adding a route, changing status semantics, or modifying client data, readiness calculations, filters, permissions, or actions.
- Added source regression coverage for the contextual header and existing query-driven scope.
- [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39122034708) and [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39122034444) passed for commit `0ca8889489ae95bc819d3493574a9f3e8faf48b4`, including typecheck, regression tests, production build, PostgreSQL integration, dependency audit, and production HTTP smoke test.


## Nineteenth implementation slice: stable Contracts register during feedback

- Moved the transient contract success notice from directly below the page header to after the searchable, filterable contract register and its pagination, before the supporting overview metrics.
- Contract lifecycle errors remain separate, visible, and actionable. This placement change affects only the transient success notice; contract records, status transitions, confirmation dialogs, permissions, audit events, and API behavior are unchanged.
- Added regression coverage for header → register/pagination → notice → supporting metrics order.
- [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39122141929) and [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39122141932) passed for commit `83544de3b140fa35905afd48edb82dc050a7a124`, including typecheck, regression tests, production build, PostgreSQL integration, dependency audit, and production HTTP smoke test.


## Twentieth implementation slice: cleaner Projects header hierarchy

- Removed the project-count/status pill from the page title. The selected view now has a clean, predictable title while source availability remains explicit in a shared status badge within the eyebrow.
- Active/completed counts remain in the existing project summaries and register; loading/unavailable source states are still visible and are not represented as successful live data.
- No project status, progress, record counts, route/query state, actions, permissions, or workflow behavior changed.
- Added regression coverage for clean title composition and the source-backed status badge.
- The first run surfaced a legacy Projects regression assertion that still expected the old count badge inside the title. Updated it to assert the separate source-status badge and retained count in the existing metrics; the rerun passed.
- [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39122501818) and [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39122501781) passed for commit `8c039e1a1c16705e1404e8c6aa452f99f15d9390`, including typecheck, regression tests, production build, PostgreSQL integration, dependency audit, and production HTTP smoke test.


## Twenty-first implementation slice: Documents category context

- The Documents header now reflects the selected category instead of repeating the same vault title and description for all six topbar views. "All Documents" retains the overall vault context; each category uses its own title and task-oriented description.
- The private-vault status badge, search/sort controls, category routing, permissions, download/preview/delete behavior, and document data remain unchanged.
- Added regression coverage for the category-specific header copy.
- [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39122707224) and [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39122707232) passed for commit `8a6be2e48ddf71c036a2b18f2e2eddffc898afa0`, including typecheck, regression tests, production build, PostgreSQL integration, dependency audit, and production HTTP smoke test.


## Twenty-second implementation slice: Settings workspace identity

- The Settings page title now identifies the active topbar workspace: System overview, Access & security, Audit log, or Integrations. The active destination is reflected in both navigation and the page heading, rather than showing the same generic title across four different jobs.
- Existing contextual descriptions, permission-gated controls, MFA setup access, server status sources, audit records, integrations, and all routes/query parameters remain unchanged.
- Added source regression assertions for the four workspace titles.
- Source change and regression assertion are committed directly to `main`; CI status will be checked after the push. No authenticated browser screenshot testing is claimed.


## Twenty-third implementation slice: Inbox workspace identity

- The Inbox heading now follows the selected Overview, Client inquiries, or Starred workspace. This makes the current task explicit in the content heading as well as the persistent topbar navigation.
- Existing view query parameters, record filtering, queue controls, lead/client actions, polling, loading/error states, and permissions remain unchanged.
- Added regression coverage for the active-workspace heading.
- Source and test updates were committed directly to `main`. CI status will be checked for the latest commit. Authenticated browser visual QA remains outstanding.


## Twenty-fourth implementation slice: responsive Clients directory structure

- Replaced the forced 1,240px Clients directory table as the only presentation with a compact card register below 1,280px and retained the sortable desktop table for wider screens.
- The mobile/tablet register keeps account identity, real account status, industry, primary contact, recorded billed value, spend-cap health, pagination, view-profile action, and permission-gated edit action.
- Removed the nonessential slug column from the primary register (the slug remains accessible in the detail drawer) and moved the existing derived contract-tier label into secondary account metadata; actual account status is now also shown directly. The original tier classification remains visible in both responsive layouts.
- Reduced the desktop register's minimum width to 980px and aligned the empty/loading row geometry to the seven displayed columns.
- Added source regression coverage for the responsive layout, preserved actions, and table geometry. No data model, status semantics, filters, sorting, permissions, route state, API behavior, or SLA calculation changed.
- Commit is delivered directly to `main`; CI and production build status will be checked after the push. Authenticated browser visual testing is not available from this repository-only run.


## Twenty-fifth implementation slice: consistent Documents workspace breakpoint

- Kept the existing compact document-card list available through laptop and compact desktop widths; the 1,050px table now appears only at 1,280px and wider, so an 1,024px viewport no longer switches prematurely to a wide table.
- Preserved document search/sort/pagination, row actions, secure download availability, delete permission gating, content metadata, and empty/error states.
- Added regression coverage for the responsive breakpoint and retained desktop table.
- Source and test updates are committed directly to `main`; full CI status is being checked on the latest commit. Browser screenshot verification is not claimed.


## Twenty-sixth implementation slice: responsive Team Directory workspace

- Team Directory now automatically uses its existing card/grid presentation below 1,280px, including compact desktop and tablet widths, instead of defaulting to a wide data table.
- The explicit Table/Grid switch remains available on wide desktop; the selected desktop preference is retained when resizing back from compact layouts.
- Added a media-query listener for viewport changes and regression coverage for automatic layout selection and retained desktop controls.
- Team data, filters, sorting, pagination, member/vendor/time workflows, permissions, role visibility, and data sources remain unchanged. CI is being checked after the direct-to-`main` push; authenticated visual browser testing is not claimed.


## Twenty-seventh implementation slice: Inbox action ownership

- Clarified the header count as total inbound, distinct from the filtered queue count.
- On Inbox Overview, moved the mark-read/process-new action into the queue control strip alongside refresh, export, review mode, and reset. Removed duplicate header export/process actions for Overview; those actions remain in the header on the other Inbox tabs where they are not duplicated by the Overview toolbar.
- Preserved the existing click handlers, permission disabling, polling, filters, route/query state, and record behavior.
- Added regression coverage for the contextual action placement. CI status will be verified for the newest direct-to-`main` commit; browser interaction testing remains outstanding.


## Twenty-eighth implementation slice: CMS Case Studies responsive register

- Added a focused case-study card register for viewports below 1,280px. Each record keeps title/client, pillar, service, year, publication state, featured state, preview image where present, and the same publish/feature/edit/delete actions.
- Retained the sortable-by-order data register in the desktop table layout at 1,280px and above and kept existing pagination outside the responsive presentation switch, so both layouts use the same current page of source-backed records.
- Added regression coverage for the mobile card register and preserved handlers.
- CMS API operations, content normalization, publishing state, permissions, editor drawer, filters, page size, pagination, and record data are unchanged. CI status will be checked for this direct-to-`main` change; authenticated browser visual QA remains outstanding.


## Twenty-ninth implementation slice: CMS service, insight and testimonial registers

- Added compact card registers for Services, Insights, and Testimonials below 1,280px; the existing data tables now render only on wide desktop, where their multi-column metadata remains useful.
- Cards retain their actual content context and existing actions: service publication/inspection/edit/public link, insight status/language/author/date/edit/language variant/public link/delete, and testimonial publication/rating/quote/location/edit/delete.
- Existing filters, search, sort state, current page and pagination remain shared between responsive presentations. No new example content, fabricated metrics, backend operations, content state transitions, or permission changes were introduced.
- Added focused source regression assertions for the responsive registers and action handlers. Full CI status will be checked after the direct-to-`main` push; authenticated browser visual QA remains outstanding.


## Thirtieth implementation slice: CMS Careers job and applicant registers

- Added compact responsive card registers for Careers job openings and applicants below 1,280px; wide tables remain the presentation at 1,280px and wider.
- Job cards keep role identity, department, work type, workplace, location, publication state, source-backed applicant count, and existing publish/unpublish, edit, and delete actions.
- Applicant cards keep applicant identity/contact, applied position, received date, safe resume/portfolio links, existing status selector, detail action, email action, and delete action.
- Reused the same filtered/paginated source records across card and table layouts. Job/applicant APIs, permissions, status transitions, file URL safety checks, existing editor/detail drawers, and candidate associations are unchanged.
- Added regression coverage for both layouts and important workflow handlers. The commit is delivered directly to `main`; CI and Quality Gate status will be checked next. Browser testing with an authenticated AMS session remains outstanding.


## Thirty-first implementation slice: CMS responsive register type-check correction

- Corrected the missing `EyeOff` icon import used by the new Services card publication control after CI TypeScript validation reported it.
- No behavior or permission changes were made.


## Thirty-second implementation slice: Projects Table responsive work surface

- The Projects → Projects (Table view) now presents a card register below 1,280px instead of forcing the 1,080px desktop table into laptop/tablet widths.
- The card preserves project/client identity, lifecycle status, delivery progress, recorded cost against budget with source-unavailable state, deadline/overdue context, owner, detail action, and permission-gated edit action.
- Cards and desktop table use the same server-backed, filtered and paginated page slice; existing export, filters, sort, status semantics, project detail drawer, and lifecycle operations remain unchanged.
- Added regression assertions for responsive rendering, key financial/delivery labels, and action preservation. Direct-to-`main` CI is checked after this commit; no authenticated browser visual test is claimed.


## Thirty-third implementation slice: Projects Budget and Archived responsive workspaces

- Added compact card registers for Budget vs Actual and Archived Projects below 1,280px; the data tables remain available at wide desktop.
- Budget cards keep budget, source-backed actual-to-date, remaining budget, variance, delivery progress, and spend-to-budget comparison with their existing null/unavailable semantics. No cost was inferred from delivery progress.
- Archive cards keep completed project/client context, completed date, budget, final progress, owner, slug, detail action, and permission-gated edit action.
- Both presentations use the existing filtered and paginated project rows; no status transitions, budget formulas, Finance joins, record visibility, API integrations, or permissions changed. Regression coverage added; CI for the current main head remains under verification.


## Thirty-fourth implementation slice: Projects responsive table JSX boundary fix

- TypeScript validation reported that the compact project-card view and the wide table were sibling JSX elements in a single conditional branch.
- Wrapped those two responsive presentations in a fragment so the branch has one valid root, without changing their visibility, data source, pagination, or actions.


## Thirty-fifth implementation slice: Careers regression expectation aligned with responsive presentation

- Updated the Careers interaction test to expect the applicant status selector in both compact-card and wide-table layouts, in addition to the existing selectors in the page/form. This is a presentation duplicate for responsive layouts, not a new status workflow.
- The test remains strict about using the approved CustomSelect component and rejecting native select elements.


## Thirty-sixth implementation slice: Settings backup, audit and account workspaces

- Added compact card registers under 1,280px for production backup snapshots, system audit entries, and administrator accounts; desktop retains the columnar tables for wide-screen review.
- Backup cards retain snapshot identifier, UTC creation time, size, verification state, and the existing integrity-check action. Audit cards retain timestamp, actor, event, details, origin/IP, and severity. Account cards retain role, division, account state, MFA state, last login, and the master-only deletion guard.
- Cards and tables use the same source rows and existing view permissions; no new actions, permissions, API behavior, account mutation logic, backup verification logic, or audit data transformations were introduced. Added regression coverage; CI must pass before this slice is considered validated.


## Thirty-seventh implementation slice: preserve one named scroll owner for Settings audit

- Restored the named, keyboard-accessible horizontal scroll region for the system audit log, which is required by the cross-module scroll regression guard.
- Removed the nested horizontal overflow declaration from the desktop-only audit table wrapper so the outer region owns scrolling once; compact cards remain unaffected.
- This addresses a genuine accessibility/scroll-boundary regression found by CI without weakening the test or changing audit content/actions.


## Thirty-eighth implementation slice: responsive Team Time Logs register

- Added compact time-entry cards below 1,280px with date, project/task context, team member, duration, billable state, and allowed delete action; the 760px table is retained for wide desktop.
- Moved pagination outside the responsive presentation switch so both cards and table use the same source rows and current page.
- Preserved the existing API, date filtering, total/billable calculations, record removal action and exact owner-or-authorized-role deletion condition.
- Added regression coverage for the responsive register, billing state, pagination, and delete gate. CI for the current direct-to-main head is checked next.


## Thirty-ninth implementation slice: responsive Contracts / SOW register

- Added compact contract cards below 1,280px with title/number/type, client/project, term dates, contract value/currency, lifecycle status, end-date warning, agreement link where available, and the existing context-specific actions.
- Retained the 980px multi-column table at wide desktop. Cards use the same filtered source records and keep the exact lifecycle conditions for draft editing/deletion, review/signature progression, expired marking, and termination.
- No signature, approval, status transition, permission, API or contract business rule was changed. Regression assertions added for the responsive view and the manager permission gates.


## Fortieth implementation slice: Client Retainers register

- Added a compact retainer-card workspace below 1,280px while retaining the sortable 1,120px table at wide desktop.
- Cards clarify client/tier identity, monthly committed value, included hours, used-versus-committed hours and threshold coloring, overage rate, billing cycle, renewal date/near-renewal warning, health state, and permission-gated Edit terms action.
- Preserved the original usage calculation, renewal thresholds, sort/filter/page datasets, and edit permission. The responsive cards display the same visible source records as the table; no financial value or health status is derived differently.
- Added regression coverage for the compact register, usage/renewal logic, pagination, and edit permission.

## Forty-first implementation slice: Finance Annual Summary hierarchy

- Replaced the repeated KPI strips plus one long table with two task-oriented tables: Annual operating activity and Posted General Ledger.
- Preserved the same annual calculations, reporting-year context, source rows, GL reconciliation warning, source-basis descriptions, and full-summary CSV export. Existing row identifiers distinguish operating/source values from posted-ledger values.
- Added Annual Summary regression coverage separating source operating activity from posted-ledger results.
- Code commit: cb910375f90c35edf364720d3dda87dda5f94e92. Its first test run exposed a case-sensitive assertion only; the source sentence and UI were correct.

## Forty-second implementation slice: Cash Flow summary de-duplication

- Removed two sets of repeated summary cards where identical values were already present in the Posted General Ledger and source cash-movement comparison tables.
- Kept all three tables, reporting period comparison selector, source-versus-posted accounting disclaimer, calculations, row sources, and all three CSV exports.
- Added regression coverage for the three retained tables and exports.
- Code commit: dc6432bfd4d5180a484844701fc71db77c2c8981.

## Forty-third implementation slice: Monthly P&L content hierarchy

- Removed the four source-preview headline cards that repeated metrics already listed in the comparison and detail tables.
- Renamed the first table to Operational source preview comparison and grouped the three existing Posted GL metrics beneath the source tables in a separate Posted General Ledger snapshot section. This keeps operational proxies visually distinct from journal-backed accounting results.
- Retained all P&L/source calculations, the Posted GL data and unavailable state, comparison controls, warnings, table rows, source details and CSV exports.
- Added regression coverage for source-vs-ledger grouping, section order, metrics and exports.
- Code commit: c6c42442c0dbdc4829fea332d23f976552a2cf64.
- CI on the test correction commit ab32f676dcd76002f1017e451f21fb278d35af37: AMS CI passed (https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39129352213); AMS Quality Gate passed (https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39129352184).
- For commit c6c42442c0dbdc4829fea332d23f976552a2cf64, AMS Quality Gate passed (https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39129542635). The AMS CI verify job completed successfully (https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39129542634); the workflow final state was pending at the last status query.

## Remaining status after these slices

The structural redesign is still in progress. These changes improve three Finance reporting worksheets; they do not complete Finance's other worksheets or the remaining module/subtab inventory. The Drive reference screenshot remains unreadable through the available tool, so no claim of direct screenshot inspection is made. Authenticated browser visual QA and full viewport/scroll testing remain outstanding.

## Forty-fourth implementation slice: Cash & Bank task grouping

- Preserved the primary Cash & Bank ledger before its supporting metrics, in accordance with the register-first workspace guideline.
- Split the six values into a four-metric cash ledger group (opening balance, inflows, outflows and provisional balance) and a two-metric statement reconciliation group (reconciled accounts and exceptions). The latter is grouped with its warning and statement-reconciliation table in a named section.
- No finance formulas, reconciliation gates, record actions or workflow transitions changed. Added regression coverage for ordering and grouping.
- Code commit: 9bdffa502bc7aff4b3365f4b8037dd4f0ff446eb. AMS CI passed (https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39130102280); AMS Quality Gate passed (https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39130102409).

## Forty-fifth implementation slice: Project Finance compact workspace

- Added a responsive card workspace for the 18-column Project Finance register below 1,280px; the full sortable table remains the desktop presentation at 1,280px and above.
- Cards group planned financials separately from reporting-period activity, and retain client, PIC, project status, finance checks, dates, notes, row-specific configure/edit actions, and pagination. A compact sort control uses the table's existing sort state so mobile users retain sorting instead of being limited to horizontal scrolling.
- Both presentations render the same existing row cells and saved project-finance calculations. No backend/API, permission, finance formula, or record-action behavior changed.
- Added regression coverage for compact/desktop breakpoints, grouping, sort reuse, pagination-driven visible rows and action retention.
- Code commit: 51dd6e725c9a845e7ee1c3d9fd04f4756932b242. AMS CI passed (https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39130341652); AMS Quality Gate passed (https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39130341665).

## Updated overall status

The structural redesign remains in progress. These stages materially improve four Finance report/workspace layouts (Annual Summary, Cash Flow, Monthly P&L, Cash & Bank) and add a focused compact register for Project Finance. Other Finance worksheets and other module/subtab validation remain outstanding. The supplied Drive screenshot remains unreadable to the available fetch/render tool; no direct visual inspection is claimed. Full browser screenshot QA at 1440, 1280, 1024, 768, 390 and 320px, and interactive wheel/trackpad/touch/keyboard scrollbar testing still need to be completed where a live browser session is available.

## Forty-sixth implementation slice: Accounts Payable and vendor payment schedule cards

- Used the existing shared FinanceDataTable compact-card pattern for both the 10-column Accounts Payable register and 11-column vendor installment schedule below 1,280px. The full sortable tables remain available at wide desktop.
- Payable cards group bill date/due date/amount/paid/outstanding, retain the bill status and the original per-bill actions (including permission-gated Record payment), and preserve the register Add vendor bill action. Schedule cards group bill identity, installment details, total paid, outstanding, next payment and status.
- Both views use the same existing row data/pagination and sortable state as their desktop tables. Installment calculations, payment records, authorization, and contract-vs-bill separation were not changed.
- Regression coverage added for the compact grouping and register-first hierarchy.
- First CI attempt exposed a JSX bracket typo in the new schedule layout configuration; fixed immediately in commit d471d1134c137994e016fc8c87a242455ddc1b94.
- Validation on fix commit d471d1134c137994e016fc8c87a242455ddc1b94: AMS CI passed (https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39130839040); AMS Quality Gate passed (https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39130839000).

## Remaining Finance worksheet review

Responsive review has now added a compact register to Project Finance, Accounts Payable, and its installment schedule. Remaining Finance worksheets still need source-by-source layout review, especially Petty Cash, Operational Budget, Project Allocation, Team Fee, Chart of Accounts, Balance Sheet, Journal and Monthly Closing. Other module checkpoint/visual approval remains separate. No authenticated browser/viewport screenshot QA has been performed.


## Current main-line checkpoint — 19 October 2026

- Baseline: `ec1b9e5f9d64fd69b5c64bc919ae7441e486d6a9`. The baseline AMS Quality Gate and AMS CI completed successfully. This is evidence for the baseline SHA only, not a pass claim for changes added after it.
- Stage 0–2 source checks reviewed the nine-module navigation mapping, shell geometry and existing scroll regression guard. Source-level checks are green on the baseline; direct browser navigation, scroll, focus and responsive QA remain unverified and belong in Stage 5.
- The Stage 3 gap-register checkpoint identifies module workspaces and ten cross-module workflows with conservative statuses and next actions. Inbox Follow-ups, Inbox Routing & Templates, Projects Content & Campaigns, Projects Project Controls, and Team People Operations are unavailable in source and recorded as missing from the approved target.
- Stage 4 correction in this batch: Dashboard's “New project” action previously opened only the Projects registry. It is now permission-aware. Authorized users use a `create=1` deep link that opens the existing create drawer; other users receive an “Open Projects” link. The Projects page consumes the flag and retains its existing permission guard.
- Focused regression coverage was added in `tests/ams-dashboard-overview-hierarchy.test.ts`. CI on the new bulk commit is pending until its own workflows finish.
- No local build, lint or test result is claimed because the repository could not be cloned into the execution runtime. No backend/API/database/authentication/RBAC/business logic or Finance formula was changed. Browser QA and Stage 5 approval remain outstanding.

