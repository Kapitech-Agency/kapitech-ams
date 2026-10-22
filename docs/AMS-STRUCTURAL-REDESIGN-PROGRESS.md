# Kapitech AMS Structural UX/UI Redesign Progress

Progress evidence last recorded: 23 October 2026  
Documentation cross-reference updated: 23 October 2026 (source/test evidence updated; no browser verification implied)
Repository: `Kapitech-Agency/kapitech-ams`
Required delivery branch: `main`

> **Status semantics:** This file is the compact progress roll-up, updated by the date above. Commit references and CI outcomes in individual slices are historical evidence for those exact commits; they do not prove the latest `main` commit or a live deployment is currently passing. Recheck current `main`, latest GitHub Actions, and authenticated browser/viewport acceptance before closing the redesign. The detailed historical view-by-view record is in [`AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md`](AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md).

> **Delivery-plan and target authority:** This file tracks structural UX/UI progress only. The overall path through navigation, main content, workflows, E2E, operational recovery and production deployment is defined by [`AMS-END-TO-END-DELIVERY-ROADMAP.md`](AMS-END-TO-END-DELIVERY-ROADMAP.md). The target main-content composition and required relative region order are defined by [`AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md`](AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md), especially §4.10. Current requirement-by-requirement state belongs in [`AMS-FEATURE-CONTENT-GAP-REGISTER.md`](AMS-FEATURE-CONTENT-GAP-REGISTER.md). The dated/local phase lists below are UX/UI progress context and must not override the target spec or become a competing schedule.

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
- The Stage 3 gap register identifies 36 primary workspaces, 10 cross-module workflows, and the nested disabled worksheets found in source, each with conservative statuses and next actions. Inbox Follow-ups, Inbox Routing & Templates, Projects Content & Campaigns, Projects Project Controls, and Team People Operations are unavailable in source and recorded as missing from the approved target.
- Stage 4 correction in this batch: Dashboard's “New project” action previously opened only the Projects registry. It is now permission-aware. Authorized users use a `create=1` deep link that opens the existing create drawer; other users receive an “Open Projects” link. The Projects page consumes the flag and retains its existing permission guard.
- Focused regression coverage was added in `tests/ams-dashboard-overview-hierarchy.test.ts`. Both workflows tied to `d26aefe57a2936b710fe7f806e8779713645a7b2` passed: Quality Gate [39156558846](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39156558846) and AMS CI [39156558805](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39156558805).
- No local build, lint or test result is claimed because the repository could not be cloned into the execution runtime. No backend/API/database/authentication/RBAC/business logic or Finance formula was changed. Browser QA and Stage 5 approval remain outstanding.

## Stage 4 source-backed Planning & Delivery checkpoint — 19 October 2026

- Promoted Project Brief, Milestones and Timeline to three URL-addressable views using existing canonical project and milestone records.
- Added normalization for unsupported `planningView` values and removes stale worksheet state on exit. The project selector retains the active worksheet. No deliverable, review, approval, revision, duration or dependency facts are invented.
- Scope & Deliverables, Deliverable Tracking, Internal Quality Review, Client Review and Revision History remain unavailable because the current project/task schema does not contain separate canonical records for those outcomes.
- Expanded the gap register with disabled nested worksheets across Inbox, Clients, Projects, Team & Resources, Time Tracking, Vendors, Contracts, SLA, Careers, Tasks and Kopra H2H. Disabled tabs remain off until their source/workflow is verified.
- Dashboard CTA source/test/typecheck/build evidence is verified on `d26aefe57a2936b710fe7f806e8779713645a7b2`; AMS Quality Gate and AMS CI passed. The Planning & Delivery batch `c0c63aea176ced4fc5c72613d056f1d5f28c3352` passed AMS Quality Gate [39157322660](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39157322660) and AMS CI [39157322657](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39157322657).
- No local build/test is claimed because the repository could not be cloned into the runtime. No backend/API/database/authentication/RBAC/business logic, model or Finance formula changed. Authenticated browser visual QA, accessibility checks and Stage 5 approval remain outstanding.

## Stage 4 source-backed Time Tracking checkpoint — 19 October 2026

- Activated Billable / Non-billable and Time by Project as separate query-addressable read-only worksheets over the existing time log response.
- Billing values distinguish `true`, `false` and unset rather than silently treating missing classifications as non-billable. Project summaries use the existing project ID/name on the entry and stay within the selected reporting period.
- Selecting a project drills down to the same canonical time rows; the billing filter also operates on the same records and does not mutate them. Pagination and empty states now correspond to the filtered period result.
- My Timesheet and Timesheet Control remain unavailable. The source audit has not verified a secure personal-query contract or persisted submit/review lifecycle for those workflows.
- No API, server-side ownership gate, data model, billing rule, Finance posting, authentication or RBAC code changed. The initial CI run failed at the newly added source assertion because its regex was over-escaped; typecheck passed, and regression tests/build were stopped by the failure. This correction updates the assertion to check the exact unchanged disabled-tab declarations. The corrective bulk commit `9067e10f2d11333ada9b655de72241684e869e15` passed AMS Quality Gate [39157823377](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39157823377) and AMS CI [39157823474](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39157823474), including regression tests, production build, migration packaging and HTTP smoke test. The Time Tracking source/test batch is CI-verified; authenticated browser validation remains outstanding. Browser interaction and Stage 5 visual/accessibility review remain outstanding.


## Stage 4 source-backed Vendor Skills Matrix navigation checkpoint — 19 October 2026

- The vendor directory now links to the existing Skills & Service Matrix only when the current `canAccessAmsRoute` policy permits `/admin/vendors?view=skill-matrix`. Both loading and loaded navigation states use the same gate.
- The destination already displays source-backed internal role focus and vendor skill/vetted/active coverage. No skill, member proficiency score or vendor record was fabricated.
- The route policy remains Admin-only for this query. Contracts & Rates and Engagement Status stay disabled. No financial-field visibility or role permission was broadened.
- Added source-level regression coverage for both tab declarations, the existing route, and the unchanged role policy. Initial CI for `b1b26a0f306a32af58d70468189e09555e700252` found a legacy assertion that still expected the tab to be disabled. Correction commit `84a0d3b1bf49b02a9720e02dc01a1ab3b7c2d40b` corrected that expectation and passed AMS Quality Gate [39158246211](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39158246211) and AMS CI [39158246209](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39158246209), including regression tests, production build, migration packaging and HTTP smoke test.
- The Time Tracking correction commit passed AMS Quality Gate and AMS CI. Planning & Delivery and Time Tracking are CI-verified at source level. Browser interaction, responsive/keyboard QA and Stage 5 approval remain outstanding.


## Stage 2 responsive shell and Stage 4 Dashboard geometry checkpoint — 19 October 2026

- The shell uses one viewport-height workspace, a primary `main` vertical scroller, and independent sidebar/drawer scroll regions. Existing source and regression tests cover those behaviors. Inspected `!important` declarations are scoped to print/export rules, not live workspace layout.
- Source audit against the current `AMS-DESIGN-SYSTEM.md` found responsive rules left from an earlier Dashboard layout: 720px Dashboard width cap; mobile titles at 18/24 and 18/25 rather than 20/28; 9px/10px radii; 7px KPI gap; legacy 13px/14px card padding and panel text overrides; duplicate tablet/mobile page-shell gaps and gutters.
- This batch removes the conflicting width, duplicate gutters/gaps, title scale and radius/padding overrides. Dashboard KPIs use the approved 12px spacing grid, 12px radius, 16px padding, 12px labels and 20/28 metric values. Topbar utility groups use radius 8 and token spacing. Shared panel geometry stays owned by the shared components.
- Added regression assertions for canonical page shell/title/card geometry and the known conflict selectors. Validation is pending the new commit's Quality Gate and AMS CI. Browser checks at 1440, 1280, 1024, 900, 768, 390 and 320px, keyboard access, scroll ownership, horizontal overflow and mobile drawer remain Stage 5 items.
- No authenticated browser session was available in the current execution context. No authenticated visual approval is claimed. Stage 5 approval remains a hard gate before Stage 6.


## Finance navigation correction checkpoint — 19 October 2026

- Source audit found a mismatch with Master Structure §9.1: Quotations belongs first in Receivables & Payables, but the UI appended it after Accounts Receivable, Accounts Payable and Vendors; the workspace root link opened Accounts Receivable.
- Corrected the root destination to `/admin/finance?tab=quotations` and ordered Quotations before the existing worksheets. Preserved the five top-level Finance areas, legacy quotation URL, existing records/API, role gates and all financial calculations/posting behavior.
- Added source regression assertions for destination, active state and worksheet order. This batch remains unverified until its matching CI workflows pass. Stage 5 browser checks for direct entry, refresh/back/forward, role visibility and responsive tab behavior remain outstanding.


### CI correction checkpoint — 19 October 2026

**Trigger:** Finance navigation bulk commit `40f646153ae7bb19b8263baa593767d885bb1787`.  
**Evidence:** AMS Quality Gate [39160813145](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39160813145) passed typecheck but regression tests found two stale/incorrect assertions: a legacy test still expected Receivables & Payables to open Accounts Receivable, and the responsive geometry regex omitted the actual child `> div` and expected spacing not present in CSS. These are test expectation defects; the shell selector and Finance navigation implementation are intentional. AMS CI [39160813121](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39160813121) had passed typecheck and was still running security regression checks at last inspection.  
**Correction:** Align the legacy navigation assertion with the approved first worksheet, Quotations, and make the shell regression match the actual responsive selector and whitespace. No production logic, accounting calculations, backend, API, database, or authorization code changed. Both workflows must pass for this correction batch before it is marked verified.


### Follow-up correction — responsive regression selector

The first correction commit `b6abb278d95587bc46326facb6294ee6be7271da` updated the Finance assertion but its CSS regex still included an extra `> div` that the actual KPI card selector does not contain. AMS Quality Gate [39160999440](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39160999440) therefore still failed only the responsive geometry regression. The test now matches the actual `section[aria-label="Executive key performance indicators"] article` selector and accepts the existing whitespace around CSS values. The Finance assertion correction remains in place. Revalidate both workflows on this follow-up commit before marking the batch verified.



## Finance navigation follow-up — worksheet visibility collision (19 October 2026)

The prior Quotations-only adjustment was not a complete navigation fix. The worksheet filter suppressed **Executive Summary** because its destination intentionally duplicates the primary Finance navigation destination (/admin/finance?tab=executive-summary). Removed the unrelated sidebar-destination exclusion from worksheet visibility; role-based route checks remain. Renamed the in-page row to **Finance worksheets** to distinguish it from the five Finance group tabs. Added route-order/active-state and visibility regression assertions. This is a frontend navigation-only change; validate the new commit through both CI workflows before calling the source fix complete. Browser authentication, visual review, and deployed-site verification remain outstanding.


## Finance worksheet active-state color correction (19 October 2026)

The Finance worksheet row had `variant="secondary"`, which intentionally rendered the selected worksheet with neutral panel styling. This did not follow the AMS design system's primary contextual-tab active state. Switched the Finance worksheet tabs to the shared `AdminSectionTabs` `primary` variant. The selected worksheet now uses the standard crimson accent tint (`bg-accent/10`) and crimson-accent border (`border-accent/20`), while keeping readable foreground text, keyboard focus treatment, URL-driven active state, and shared component geometry. Regression checks now require the primary variant and verify that its selected style is tied to the shared accent token. No backend, API, authorization, database, or financial logic changed.


## Latest execution checkpoint — 19 October 2026

- Navigation stage preserved: current `main` already contains the approved nine-module navigation and the five Finance primary areas. This execution did not recreate the sidebar, routes, tabs or worksheets.
- Stage 2 shell follow-up: commit `55ae212b936dd92671bad764baa1c91904999cff` moved the mobile topbar's safe-area-aware height contract into the entire below-900px drawer range and removed the duplicate narrow-only rule. Its new regression test initially failed because the test regex was over-escaped, not because the source selector was absent. Commit `00387bb643e895a7f1bd4cfa31bf161ef09fdd64` corrected the matcher. Both workflows then passed on that SHA: AMS CI [39198573319](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39198573319), Quality Gate [39198573222](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39198573222).
- Stage 4 Dashboard Overview slice: commit `78fe090409640e989a60700b1465186d42bf872f` replaced the off-contract 390px/760px responsive grid thresholds with the design system's 600px/900px/1100px thresholds for KPI and Quick Actions content. Regression assertions were aligned with the intended geometry. Both workflows passed on this exact source SHA: AMS CI [39198777481](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39198777481), Quality Gate [39198777527](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39198777527).
- CI ran typecheck, regression tests, production build, and the configured integration/security/production smoke stages. No local test/build result is claimed because this execution used the GitHub repository interface rather than a local repository checkout.
- Remaining: Dashboard is not complete. Continue source-by-source through Performance and Analytics, then Inbox, Projects, Clients, Finance worksheets, Team & Resources, Documents, Website CMS and Settings as Stage 4 permits. Preserve unavailable worksheets when their canonical data/workflow is absent.
- Production check: no authenticated production browser session or post-login screenshots were available. Stage 5 visual, responsive, keyboard/accessibility acceptance and explicit user sign-off remain outstanding. No deployment success is claimed.

## Stage 4 content-first checkpoint — 19 October 2026

- Current Stage 4 source slices: Dashboard Overview / Performance / Analytics; Inbox Overview and All Messages; Projects Overview. Keep all as `Partially complete` until each active view is browser-reviewed against its content contract.
- Dashboard Overview source/test evidence: `8826a3c8528860fa472906db105f851e2270a61f`; AMS CI [39203157223](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39203157223), Quality Gate [39203157309](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39203157309) passed.
- Dashboard Performance source/test evidence: `83a07eee49c199a32df089d74738f0b840c94baa`; AMS CI [39202525397](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39202525397), Quality Gate [39202525339](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39202525339) passed. Dashboard Analytics report-order and period-selection tests passed on descendant `9f3b254093569517f9b6bdb848d036f44c92079e`; CI [39202815124](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39202815124), Quality Gate [39202815087](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39202815087) passed.
- Inbox Overview and All Messages: queue/review hierarchy, selected-state accessibility, truthful loading/stale states, Unassigned scope, accurate total-versus-visible count, removal of inferred Next follow-up, and status/priority filters are source/test verified through `9398b0f884faa3b4055f7d7d0feaa8c2f3a6ff6b`; CI [39204078559](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39204078559), Quality Gate [39204078557](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39204078557) passed.
- Projects Overview is source/test verified on descendant `eac230c51703535dc4bcfe7e051b0d3d57839b61`; CI [39204437062](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39204437062), Quality Gate [39204436950](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39204436950) passed. One stale regression assertion was corrected to match the three-metric support strip after removing the duplicated Delivery exceptions KPI.
- Breadcrumb audit: current `src/App.tsx` routes are static workspace routes/redirects; project and client records open as context-preserving modal/drawer details. No global breadcrumb was added because there is no current eligible full-page detail route. Re-audit when such a route is introduced.
- No local command test/build is claimed; changes were delivered via repository API and validated by GitHub Actions. No authenticated post-login production screenshot/keyboard/viewport audit has been performed. Stage 5 user sign-off remains a mandatory gate.
- Clients Directory/Onboarding, Agreements → Renewal Schedule, and Service & Health source/test slices are verified on main. Renewal Schedule source changes and regression tests passed CI [39207367178](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207367178) and Quality Gate [39207367066](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207367066); Service & Health unavailable-telemetry guards passed CI [39207941880](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207941880) and Quality Gate [39207941811](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207941811). Continue Stage 4 in Finance from the next prioritized worksheet while preserving unresolved client history, onboarding evidence and SLA telemetry dependencies.


## Stage 4 Clients Directory and Onboarding checkpoint — 19 October 2026

- Directory now exposes the existing status, industry and location filter states with source-derived options. Status and spend-cap filters are hidden when the workspace is scoped to Lead; search, industry and location remain usable for prospective accounts.
- Onboarding has an explicit source boundary: the current list contains client records with Lead status, not separate checklist, required-document or kickoff-readiness records. The profile-detail readiness panel explicitly measures profile completeness only.
- URL scope changes clear incompatible filters and reset pagination. The Directory no longer duplicates Onboarding as a third-level footer scope; the approved module workspace navigation is the entry point.
- Contextual record creation from Onboarding defaults the status to Lead and updates labels to Add/Create Lead. Export receives an Onboarding-specific label and filename. The detail drawer persistent footer remains the single Log interaction action.
- Client filter controls and responsive/source regression checks passed CI [39206483169](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39206483169) and Quality Gate [39206483182](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39206483182) on 3e1897df6c60aa3ae6e2fbe348b13534efa93cc1. Contextual Onboarding actions and duplicate-action cleanup passed CI [39206734168](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39206734168) and Quality Gate [39206734181](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39206734181) on 6c42b94fb3db56304015772025fa234564bea716.
- These remain partial Stage 4 slices despite green source/regression CI. Renewal Schedule and Service & Health have now been checked source-by-source, with unavailable owner/action and telemetry records explicitly preserved as dependencies. Authenticated browser, role, keyboard and viewport acceptance remains Stage 5. No deployment or production visual result is claimed.


## Stage 4 view design record — Clients · Agreements · Renewal Schedule

**View ID:** `VIEW-CLIENTS-AGREEMENTS`, Renewal Schedule subsection.  
**Source/test verification:** The resulting source commit `939cd800a4321c8049e27cb383c1176cf9c8866b` passed AMS Quality Gate [39207367066](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207367066) and AMS CI [39207367178](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207367178). Canonical owner/action fields remain missing and authenticated browser/visual review stays open for Stage 5.

1. **Owner module and persona.** Clients → Agreements. Client-service/account owner is primary. Executives need an exception summary; PMs need renewal context when it affects delivery planning. Presentation does not change access.
2. **Primary task.** Find the active agreement or retainer whose recorded renewal/end date needs review and open its canonical source.
3. **Decision.** What is past date, due within 30 days, scheduled later, or missing a recorded date, and which source needs review?
4. **Primary work surface.** Searchable, timing-filtered agreement list. A calendar is deferred until the source supports the accountable owner/action needed for planning.
5. **Content order.** Page title and approved worksheet tabs; truthful partial-source notice with refresh; search and timing filter; canonical renewal register; ownership/data limitation note. Remove the pre-register KPI strip because its counts duplicate timing scopes and push the list down.
6. **Fields and semantics.** Agreement/retainer title, source type, client identity, stored renewal date or end date, lifecycle state, existing amount string and source-register link. Contract renewal date takes precedence over end date. Missing date stays distinct from unavailable source. Partial source coverage is never presented as a full total.
7. **Controls.** Search agreement title, client, source type and lifecycle label. Timing filter: all, past date, due in 30 days, scheduled, date not recorded. Clear filters resets only local schedule filters. Refresh uses the existing `load()` function.
8. **Canonical ownership and breadcrumb.** Contracts link to `/admin/contracts`; retainers link to `/admin/clients/retainers`. These are source registers, not record-detail routes. Do not add breadcrumbs to this worksheet.
9. **Role-aware presentation.** Preserve current route and server policy. The schedule is informational and does not add/imply edit or lifecycle-transition permission. Do not introduce new Finance/contract actions.
10. **States and recovery.** Loading skeleton; partial-source notice with retry; verified no-record state; filtered-empty state with Clear filters; honest source-coverage count; no inferred success or automatic expiration.
11. **Responsive behavior.** Search expands on wide layouts and stacks/wraps with timing control on narrow layouts. Record identity/date/status stay together. Validate against the Design System viewport matrix in Stage 5.
12. **Accessibility.** Labeled search and select, keyboard-operable controls, explicit filter group label, live result/source count, visible clear/retry actions, and non-color timing labels.
13. **Regression and runtime evidence.** Source regression asserts search/filter order before the primary register, no duplicate KPI strip, filtered-empty messaging, partial-source retry and the owner/action limitation. Run typecheck, configured tests/build and CI on the exact commit. Authenticated browser and visual screenshots remain Stage 5 evidence.
14. **Dependencies.** Current contract/retainer source shapes do not expose accountable owner or next-action fields. Contract History is currently unavailable; canonical historical-event semantics are unverified. Track under `SUB-CLIENTS-CONTRACT-HISTORY`; never infer history from `updatedAt`.
15. **Acceptance.** Users can search/filter canonical records before the primary register, clear filters, retry partial-source loading, distinguish true empty from filtered-empty/unavailable, and reach source registers. Keep the workspace partially complete until CI/Stage 5 and canonical dependency gaps are addressed.

**Next Stage 4 slice:** Clients → Service & Health. Keep SLA telemetry explicitly unavailable and Service Issues, Client Health, and Service History disabled until their canonical sources and rules are verified.


### Renewal Schedule validation correction — 19 October 2026

The first CI attempt for commit `9d0db39395d7ed26685b77e66efe86789a1d1688` failed during TypeScript checking because `ShieldAlert` was still used by the existing Contracts overview metric strip after being removed from the icon import while removing the Renewal Schedule metric strip. No test/build ran in that attempt. The follow-up restores the existing icon import without changing contract metrics or financial/business behavior. Verify the correction commit's TypeScript, regression tests, production build and both workflows before marking this view source/test verified.


### Renewal Schedule regression assertion correction — 19 October 2026

The follow-up `4af1ec687dd39deeca5933d54023f357b57d14f9` restored the existing `ShieldAlert` import and passed TypeScript, but its regression run failed because the test sliced the Renewal Schedule ternary through the filtered-empty branch and then expected a source-boundary note located immediately after that branch. The source note is present in the rendered view; the assertion was incorrectly scoped. The next commit checks this wording in the full component source while retaining separate assertions for register/control ordering. Recheck the exact fix SHA before verification is updated.


## Stage 4 view design record — Finance · Overview & Control · Dashboard

**View ID:** `VIEW-FIN-OVERVIEW`, Dashboard worksheet.  
**Status:** Source change committed in this checkpoint; the new SHA must pass both workflows before source/test verification is claimed.

1. **Owner and persona.** Finance → Overview & Control → Dashboard. Finance lead and authorized executive readers use it for selected-period comparison; this presentation does not change financial permissions.
2. **Primary task.** Compare billing and recorded cash movements for the selected period with the immediately previous comparable period, then inspect transactions that explain the selected period.
3. **Decision.** Did invoice value issued, recorded cash-in, cash-out or net movement change relative to the preceding month, quarter or year?
4. **Primary surface.** Exact-value comparison table followed by selected-period transaction activity. This avoids a decorative chart or trend line based on unreconciled balances.
5. **Content order.** Existing workspace header/period control; four-row current-versus-previous period table; selected-period transaction activity. Executive Summary remains distinct: company-wide totals and a recent invoice register.
6. **Fields and sources.** Invoice value uses canonical issued IDR invoices grouped by invoice date. Cash in/out use recorded IDR movements grouped by movement date. Net cash movement is cash-in minus cash-out and remains a proxy, not reconciled closing cash. Period labels and previous-period selection use existing shared reporting helpers.
7. **Search/filter/sort/actions.** The global reporting-period control remains the only period selection source. This slice adds no separate month picker and no financial mutation.
8. **Canonical relationships and breadcrumb.** Uses the current invoice and cash-movement projections rather than a second ledger. It stays at worksheet level; no breadcrumb.
9. **Role-aware presentation.** Existing Finance module and server authorization remain unchanged. The table exposes the same summary-level source values.
10. **States and recovery.** Reuses global source-availability notices and the selected-period activity empty state. No value is labeled as posted accounting balance. Partial-source semantics remain a Stage 5 check.
11. **Responsive transformation.** The comparison table is primary evidence. Stage 5 must validate table layout, horizontal overflow, toolbar wrapping and narrow-screen readability.
12. **Accessibility.** Semantic column headers, labeled measure/value cells and explicit definitions in the table description. Keyboard and screen-reader behavior need browser validation.
13. **Regression tests.** Assert shared current/previous ranges, source-backed value differences, the net movement proxy definition, activity scope and separation from the Executive Summary metric/register layout.
14. **Dependencies.** Historical cash movement completeness and bank reconciliation remain data limitations. No backend, financial formula, posting, payment, ledger or period-close behavior changes.
15. **Acceptance.** Dashboard differs meaningfully from Executive Summary, compares the selected month/quarter/year to the comparable prior period with existing helpers, states source semantics, and links comparison to the actual selected-period activity. Finance remains partially complete until remaining worksheets and Stage 5 visual/role checks are complete.

**Next Stage 4 slice:** Finance → Receivables & Payables → Accounts Receivable. Inspect invoice-list hierarchy, aging, outstanding/partial/overdue states and source recovery while preserving invoice/payment semantics.


## Stage 4 Clients Agreements and Service & Health checkpoint — 19 October 2026

- Agreements → Renewal Schedule is now a searchable, timing-filtered queue over canonical active contract and retainer records. Search, timing filter and Clear filters precede the primary register. Source retry, partial-source counts and filtered-empty state remain explicit. The schedule removes duplicated pre-register KPI cards.
- Renewal Schedule source and regression checks passed AMS CI [39207367178](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207367178) and AMS Quality Gate [39207367066](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207367066) on `939cd800a4321c8049e27cb383c1176cf9c8866b`. Earlier attempts caught an unused-icon import and a test-slice boundary; both were corrected before these green runs.
- Service & Health remains an honest prerequisite workspace. It declares telemetry unavailable, provides setup requirements and links back to Contracts & SOW. SLA metrics/incident history are not fabricated, and Service Issues & Feedback, Client Health and Service History remain target-only until source ownership and rules exist.
- The Service & Health regression guard passed AMS CI [39207941880](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207941880) and AMS Quality Gate [39207941811](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207941811) on `98a8662f4228622dabb8afe4500a05db94eb4201`.
- Stage 5 remains open for authorized browser/direct-route, keyboard/focus and responsive viewport checks. These are source/test results, not a production-deployment claim.
- Next Stage 4 work: continue into Finance, starting with the next prioritized worksheet from `AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md`, while retaining Finance formulas and posting behavior unchanged.


## Stage 4 view design record — Finance · Receivables & Payables · Accounts Receivable

**View ID:** VIEW-FIN-ARAP, Accounts Receivable worksheet.
**Implementation:** Register-first source restructuring with a canonical-source aging report. Verify the exact commit via both CI workflows before calling this slice source/test verified.

1. **Owner/persona.** Finance → Receivables & Payables → Accounts Receivable. Finance operators prioritize collection review; authorized users keep existing invoice/payment actions.
2. **Primary task.** Find open invoice balances, determine collection timing and open the canonical invoice/payment workflow.
3. **Decision.** Which open issued invoices are not yet overdue, 1–30, 31–60, 61–90, 90+ days past due, or have no valid due date?
4. **Primary surface.** The invoice register remains first and keeps live search, status/payment/due filters, sorting, pagination, CSV export and existing authorized actions. Aging is supporting analysis after the register, not a replacement queue.
5. **Content order.** Primary invoice register and pagination, then the Accounts Receivable aging report with totals and six explicit buckets. The four duplicated AR KPI cards are removed in favor of one connected report surface.
6. **Fields and semantics.** Existing invoice records and selected currency; finite positive outstanding balance; status excludes draft/cancelled; due today/future is Current/not yet overdue; overdue ranges use date boundaries; blank/invalid due dates remain in a separate bucket. Percentage is each bucket balance divided by total included open balance.
7. **Controls.** Reuses the existing currency selector for the aging distribution. Existing register search and due/status filters do not silently change the aging summary, which is an all-open-current-balance view for that selected currency.
8. **Canonical relation/breadcrumb.** No second invoice records, aging store or payment state. Rows still open existing invoice preview/edit/payment controls. No breadcrumb at worksheet level.
9. **Role-aware display.** No change to canManageInvoices, delete permission, status workflow or server authorization. Aging view is read-only.
10. **States/recovery.** Register retains loading, source-unavailable, no-record and filtered-empty handling. Age report includes only finite positive balances, separates missing/invalid dates, suppresses aged totals while the invoice source is blocked, offers the existing refresh action, and shows a true empty state only after a successful source load with no balances.
11. **Responsive behavior.** Summary values use two columns on mobile and four columns on wide screens. The aging table owns horizontal overflow so it cannot widen the page shell; viewport-specific proof remains a Stage 5 check.
12. **Accessibility.** Semantic section heading and table column headers. Text percentages and amounts carry the meaning; progress bars are decorative and hidden from assistive technology. Bucket names/numbers do not rely on color.
13. **Regression tests.** Assert register/pagination before the aging section, status exclusions, positive-balance threshold, invalid-date bucket, percentage definition, selected-currency semantics, blocked-source recovery and empty state.
14. **Dependencies.** Existing invoice records only. Do not change invoice formula, payment persistence, posting, API, authorization or canonical data ownership. Browser/reflow and source-state behavior still need verification.
15. **Acceptance.** An authorized reader sees the actionable register first, then a source-backed aging breakdown where every outstanding amount belongs to an explicit age bucket or the missing-date bucket. Source unavailability cannot appear as zero debt. AR/AP remains partially complete until Accounts Payable and related workflow traces are reviewed and Stage 5 verifies presentation.

**Next Stage 4 slice:** Finance → Receivables & Payables → Accounts Payable. Review bill register hierarchy, open balance, installment schedule, vendor canonical links and source/recovery states without changing payables calculations or payment behavior.


### Finance breakpoint assertion follow-up — 19 October 2026

On `b93f08e595831489bd85b15d9107303b9fa06730`, both AMS workflows failed on four stale Finance toolbar assertions inherited from the 1100px breakpoint change in `fabd0cdeb2eb7e8df7eef7f5471b4f79cb5536a5`. The page implementation is intentionally aligned to the 1100px Design System breakpoint. The corrective commit updates the three test suites to match `min-[1100px]` and fixes over-escaped regular expressions. Confirm both workflows on that exact follow-up SHA; do not count AR aging as verified before then.


## Stage 4 view design record — Finance · Receivables & Payables · Accounts Payable

**View ID:** VIEW-FIN-ARAP, Accounts Payable worksheet.
**Implementation:** Source-backed canonical bill register, linked installment schedule and context summary. Verify the exact commit through both workflows before calling this slice source/test verified.

1. **Owner/persona.** Finance → Receivables & Payables → Accounts Payable. Finance operators manage bill records and review linked payment schedule using current permissions.
2. **Primary task.** Find a vendor bill, confirm its saved amount and balance, and see its supported installment/payment state.
3. **Decision.** Which bill is open, how much is owed, how much has been paid, and what installment remains next?
4. **Primary surface.** Canonical Accounts Payable register followed by the installment schedule derived from saved bill/payment records.
5. **Content order.** Global Finance header/source notice; bill register and existing actions; linked installment schedule; compact IDR-only summary and foreign-currency count context; explanation/register for contract-linked vendor payments. Summary no longer interrupts the two work surfaces.
6. **Fields and source semantics.** Bill number, vendor/project, bill and due dates, total, paid/outstanding values, saved payment state; schedule rows reference bill ID and linked payment records. Total IDR outstanding is limited to IDR bills; foreign currency bill count remains disclosed separately rather than summing unlike currencies.
7. **Controls.** Existing register search/period filters and authorized bill actions remain unchanged. Schedule follows the same filtered bill set, preserving current source behavior. No new payment or reconciliation action is added.
8. **Canonical ownership/breadcrumb.** Bill records remain vendor-bill, payments vendor-bill-payment, vendor master stays owned by Team & Resources, and contract-linked payment records remain a separate explicitly labeled workflow. No duplicate vendor records or new breadcrumb.
9. **Role-aware presentation.** Existing canManageFinanceRecords, source route access and payment authorization remain unchanged.
10. **States/recovery.** Existing source warning and empty-state behavior remain authoritative. The schedule renders only when filtered bills exist. Do not treat a missing register as an empty balance when the shared Finance source warning indicates unavailable records.
11. **Responsive behavior.** Both register and schedule retain their existing compact-card layouts; the IDR summary stays below both working surfaces. Stage 5 must verify 1100px and mobile reflow/overflow.
12. **Accessibility.** Existing semantic table headings, status labels, row actions and compact-card grouping remain. Keyboard focus and narrow viewport behavior need browser verification.
13. **Regression tests.** Assert bill register before installment schedule before summary metrics; retain vendor-contract clarification order, card-layout column ownership, saved installment schedule helper and existing bill actions.
14. **Dependencies.** This slice only reorders existing content. It does not change payables calculation, invoice/vendor payment state, API, persistence, posting, bank reconciliation, or permission semantics.
15. **Acceptance.** The main bill queue and linked payment schedule are available in sequence without KPI interruption; only then does the page show the narrow IDR summary. Keep AR/AP partially complete until remaining payment lifecycle/source recovery checks and Stage 5 review pass.

**Next Stage 4 slice:** Finance → Transactions & Cash. Audit Cash & Bank, Revenue, Expenses and Petty Cash individually against source ownership, reconciliation state and primary working surface.


## Stage 4 view design record — Finance · Transactions & Cash · Petty Cash

**View ID:** VIEW-FIN-CASH, Petty Cash worksheet.
**Implementation status:** Ledger and posted-voucher logic existed. This slice adds a clear route to authoritative reconciliation evidence. Verify the resulting exact SHA through both workflows before calling source/test verification complete.

1. **Owner/persona.** Finance → Transactions & Cash → Petty Cash. Finance operators issue/track vouchers and review balance; authorized users retain existing voucher/top-up actions.
2. **Primary task.** Review petty-cash movements and voucher state, then reconcile physical cash against recorded evidence.
3. **Decision.** What is posted and affects roll-forward, what remains pending, and where is physical-count evidence recorded?
4. **Primary surface.** Petty Cash Ledger. Canonical statement/cash-count reconciliation remains in Cash & Bank, which owns statement evidence for account 1100.
5. **Content order.** Opening-balance/status note; ledger; reconciliation handoff with a real route into Cash & Bank; period-aware posted-movement KPI strip. The handoff appears before supporting metrics because it is the missing control action for this worksheet.
6. **Fields and semantics.** Ledger reads posted voucher records and internal cash transfers. Pending/approved vouchers remain visible but do not affect the running balance. Existing opening date determines roll-forward inclusion. No new balance formula is introduced.
7. **Controls.** Voucher/top-up/opening controls remain unchanged. The button navigates to /admin/finance?tab=cash-bank; users manage evidence within existing Cash & Bank controls and authorization.
8. **Canonical ownership/breadcrumb.** Voucher records stay under Petty Cash; internal transfers stay shared with Cash & Bank; cash-reconciliation records exist only in Cash & Bank. No duplicate reconciliation table, no new record, no breadcrumb.
9. **Role-aware display.** Existing canManageFinanceRecords and route visibility control writes. Handoff adds navigation only.
10. **States/recovery.** Existing missing-opening-balance warning remains. Pending vouchers do not inflate balances. Handoff explicitly says opening balance or posted voucher does not prove physical cash was reconciled. Destination owns saved evidence and exception states.
11. **Responsive behavior.** Handoff stacks below the ledger on narrow screens; secondary button follows existing control sizing. Verify 1100/900/600/390/320px in Stage 5.
12. **Accessibility.** Semantic note title, native button and clear label. Keyboard/focus and route history require browser verification.
13. **Regression tests.** Assert ledger → canonical reconciliation handoff → summary order, route, account 1100 note and no duplicate cash-reconciliation writer inside Petty Cash.
14. **Dependencies.** Authoritative reconciliation/month context remains in Cash & Bank. Handoff does not duplicate status calculations; browser must verify intended tab and period.
15. **Acceptance.** Petty Cash users can discover the official reconciliation workspace without misreading a local balance as reconciled. View remains partially complete until route, period and evidence states are browser-verified in Stage 5.

**Next Stage 4 slice:** Finance → Accounting & Reports. Review Journal and Chart of Accounts first, then Monthly P&L, Cash Flow, Balance Sheet, Monthly Closing and Annual Summary against posted-only source rules.


## Stage 4 view design record — Finance · Accounting & Reports · Annual Summary

**View ID:** VIEW-FIN-ACCOUNTING, Annual Summary worksheet.
**Implementation status:** comparison-first structural update committed on `main`; verify the resulting exact SHA through AMS CI and AMS Quality Gate before calling source/test verified.

1. **Owner/persona.** Finance → Accounting & Reports → Annual Summary. Finance leads and authorized executives compare annual operational sources with posted ledger results.
2. **Primary task.** Compare a selected calendar year to the previous calendar year while distinguishing source records from posted accounting activity.
3. **Decision.** Which recorded operational and posted-ledger measures changed year over year, on what source basis, and what remains a proxy or incomplete?
4. **Primary surface.** Two formal comparison tables, not an KPI dashboard. Operating activity and posted General Ledger are separated.
5. **Content order.** Selected vs previous year heading and difference explanation; annual operating activity comparison; posted GL comparison under an accounting limitation note. Duplicated single-year tables/KPIs are not retained.
6. **Fields and semantics.** IDR invoice value excluding tax, recorded collections, expenses, recorded outflow proxy and net cash movement proxy; posted GL revenue, expense, net result not final profit, and posted cash in/out/net. Every row shows selected-year amount, previous-year amount, numerical difference and measurement basis.
7. **Controls.** Shared Finance topbar year selection controls the selected year. Previous year is derived as selected year minus one. Each table has a CSV action containing the comparison values and basis. No additional year selector or financial mutation is added.
8. **Canonical ownership/breadcrumb.** Reads existing issued invoice, expense, Cash & Bank movement and posted-journal helpers. No duplicate ledger or breadcrumb at Finance worksheet level.
9. **Role-aware display.** Existing Finance route/permission policy remains unchanged; no source records or privileged fields are exposed beyond current worksheet policy.
10. **States/recovery.** Empty state differentiates no returned source activity from absent data through the existing Finance source-availability notice. Table descriptions state that partial source availability requires retry before interpreting differences. Posted GL rows use posted journals only; unresolved mappings remain excluded.
11. **Responsive behavior.** Uses the existing FinanceDataTable with horizontal containment and row/card behavior. Stage 5 must verify 1100, 900, 600, 390 and 320px and no page-shell overflow.
12. **Accessibility.** Semantic comparison column headings, explicit year names, exact numeric amounts, row-level measurement basis and non-color difference semantics. Keyboard, focus, screen-reader and text zoom need browser review.
13. **Regression tests.** Assert same-source annual snapshots for current/previous years, selected-minus-prior arithmetic, operating/posted ledger separation, measurement basis, posted-only limitation, year labels and export actions.
14. **Dependencies.** Source-derived revenue/cash/expense figures remain operational values, not reconciled profit or closing cash. Posting, tax, FX, account mapping and period-close logic remain untouched.
15. **Acceptance.** Annual Summary fulfills comparable-period analysis without combining source operating figures with the posted ledger or presenting proxy metrics as final accounting outcomes. The worksheet stays partially complete pending independent review of remaining accounting worksheets and Stage 5 visual/runtime checks.

**Next Stage 4 slice:** Review Journal + Chart of Accounts as a related source-to-posting path, then Monthly Closing and Balance Sheet controls. Keep all finance formulas, posting and permission logic unchanged.


### Annual Summary regression assertion correction — 19 October 2026

On restoration checkpoint `2a21a1707fc2d915b13e2ffa93637e6aac7ff863`, Typecheck passed and the new Annual Summary comparison regression passed. One pre-existing test still required the Cash & Bank year filter to compare directly with `selectedYear`; the implementation now correctly factors that same filter into `buildAnnualSnapshot(year)` and calls it for both selected and previous years. The fix updates the assertion to verify the shared year parameter and both invocations. Production build was skipped because the regression job stopped at this test; re-run both workflows on the correction SHA before claiming success.


## Stage 4 view design record — Finance · Accounting & Reports · Monthly Closing

**View ID:** VIEW-FIN-ACCOUNTING, Monthly Closing worksheet.
**Implementation status:** source-first evidence path and server-gate explanation added to `main`; exact-SHA AMS CI and Quality Gate must pass before this slice is source/test verified.

1. **Owner/persona.** Finance → Accounting & Reports → Monthly Closing. Finance operators maintain control checklist records; users with existing approval permission request period closure.
2. **Primary task.** Complete and review the selected month checklist, inspect authoritative evidence gates, and request closure only when both checklist and server preconditions pass.
3. **Decision.** Are the required controls recorded as Done, and have source journals and cash/bank evidence satisfied the server's period-close checks?
4. **Primary surface.** Monthly Closing checklist remains the main register. A separate Final close validation panel clarifies that checklist progress is necessary but not sufficient and links to the canonical source workspaces.
5. **Content order.** Checklist progress note; month selector/status/request-close action; Final close validation with Journal and Cash & Bank routes; checklist table. This separates control records from backend-validated reconciliation evidence.
6. **Fields and definitions.** Checklist completion counts records with the existing exact Done status. Validation criteria are derived from current server contract: 11 required controls Done, no unresolved source-journal exceptions, no remaining period draft journals, posted journals balanced, and period-end statement/count evidence with references that matches posted GL for required cash accounts.
7. **Controls.** Existing selectedClosingMonth, server close API, disabled state, confirmation, permission checks and error handling remain unchanged. Review buttons only navigate to `/admin/finance?tab=journal` and `/admin/finance?tab=cash-bank`.
8. **Canonical ownership/breadcrumb.** Journal owns source/posted journal records; Cash & Bank owns monthly statement and count reconciliation records; Monthly Closing owns checklist/period lock records. No separate UI readiness ledger or duplicate reconciliation state. No breadcrumb on worksheet root.
9. **Role-aware display.** No new permission or API path. Existing `canApproveFinanceRecords` controls period close; source register actions retain existing authorization.
10. **States/recovery.** Closed/open states and checklist counts remain source-backed. The panel explicitly states the UI does not infer authoritative readiness; the server remains the final check and its returned reason stays the recovery path. The panel does not show fake green/amber readiness based on incomplete data.
11. **Responsive behavior.** Two evidence destinations stack to one column on narrow screens and align horizontally at medium widths. Native buttons wrap as needed; no additional global navigation layer is introduced.
12. **Accessibility.** Separate semantic panel heading, descriptive text for each review path, native keyboard-operable buttons and visible action labels. Focus and layout need browser verification.
13. **Regression tests.** Assert layer order, the not-sufficient distinction, exact server gate semantics, both canonical route destinations, no inferred readiness score and unchanged close disabled condition.
14. **Dependencies.** Server's source preflight remains authoritative for exception mapping and required account reconciliation. The UI intentionally does not duplicate the readiness algorithm.
15. **Acceptance.** Users can distinguish checklist progress from validated close preconditions and reach source evidence before requesting period closure. Overall Accounting remains partially complete until the other worksheets and Stage 5 browser/accessibility checks pass.

**Next Stage 4 slice:** Journal + Chart of Accounts relationship. Review the Journal posting queue and account mapping context to ensure the canonical account reference is discoverable without implying that custom accounts automatically change posted ledger calculations.


## Stage 4 view design record — Finance · Accounting & Reports · Journal

**View ID:** VIEW-FIN-ACCOUNTING, Journal worksheet.
**Implementation status:** queue-first content order and canonical account-reference handoff committed to `main`; exact-SHA CI and Quality Gate are required before source/test verification.

1. **Owner/persona.** Finance → Accounting & Reports → Journal. Finance operators review source-to-journal state, generate drafts, and authorize manual journal records under existing permissions.
2. **Primary task.** Identify source transactions ready for accounting review, draft/posted state or skipped source mapping, then open the canonical General Journal entry if needed.
3. **Decision.** Which source rows have eligible posting drafts, are already posted, remain in draft, or were skipped for a reason requiring review?
4. **Primary surface.** Source transaction posting queue. It is the workflow triage surface and contains the draft-generation action; the persisted General Journal register follows as the canonical record/history surface.
5. **Content order.** Draft-only source sync notice and any sync result; source transaction posting queue and Generate source drafts action; General Journal register with Add journal entry; Journal account mapping reference with Chart of Accounts handoff.
6. **Fields and semantics.** Source date/reference/type/description/amount and current matching journal state or skip reason derive from invoice, expense, cash-bank, vendor bill/payment and opening-balance canonical records. Source queue rows are explicitly not journal entries. General Journal rows retain persisted entry status and actions; posted entries are immutable.
7. **Controls.** Generate source drafts remains gated by existing `canManageFinanceRecords`, uses the existing `syncSourceJournalDrafts()` action and disabled/loading states. Add journal entry remains on the General Journal register. Mapping reference navigates to `/admin/finance?tab=chart-of-accounts`.
8. **Canonical ownership/breadcrumb.** Journal entries own posted/draft accounting records; source data remains in invoice/expense/cash/vendor registers. Chart of Accounts remains canonical account catalogue. No duplicate journal data or breadcrumb is introduced.
9. **Role-aware display.** Existing Finance permission and maker-checker rules remain unchanged. Review links are navigation only.
10. **States/recovery.** Existing source sync result note, queue skipped reason, table empty state, register records and global Finance source availability notice remain. No source item is reported as posted until the canonical journal status says posted.
11. **Responsive behavior.** Existing FinanceDataTable controls remain; queue and journal register can horizontally contain dense columns. Validate 1100, 900, 600, 390 and 320px in Stage 5.
12. **Accessibility.** Table titles/descriptions identify queue versus record register; button label is visible, keyboard-operable and accompanied by loading/disabled state. Focus, screen-reader and zoom behavior require browser validation.
13. **Regression tests.** Assert queue → register → mapping order, Generate source drafts in the queue, Add journal entry on register, and the Chart of Accounts navigation destination.
14. **Dependencies.** Account mappings, draft validation, maker-checker approval/posting, API, persistence and accounting rules remain source-owned and unchanged.
15. **Acceptance.** The task-oriented source posting queue is the first primary surface, with source actions beside it; persisted journal records and reference mapping follow without being mistaken for pending source work. Overall Accounting remains partially complete pending Chart of Accounts and report/control review plus Stage 5 browser checks.

**Next Stage 4 slice:** Chart of Accounts. Verify default-vs-custom account presentation, canonical account search, and that custom account edits do not imply automatic posting/report mapping changes.


## Stage 4 view design record — Finance · Accounting & Reports · Balance Sheet

**View ID:** VIEW-FIN-ACCOUNTING, Balance Sheet worksheet.
**Implementation status:** formal posted-ledger section subtotals added to `main`; verify exact-SHA CI and Quality Gate before source/test verification is complete.

1. **Owner/persona.** Finance → Accounting & Reports → Balance Sheet. Finance leads inspect assets, liabilities, equity, opening offsets and source exceptions as of the selected report date.
2. **Primary task.** Reconcile the formal accounting equation to posted journal balances at the selected date and understand which source/account exceptions block confidence.
3. **Decision.** What are total assets, liabilities and equity including current earnings, is the accounting equation balanced, and which source exceptions or temporary opening offsets remain?
4. **Primary surface.** Formal Balance Sheet table, with explicit subtotals after Assets, Liabilities and Equity account groups; KPI strip retains fast totals and equation summary.
5. **Content order.** Existing posted-source exception/offset note; headline totals and accounting equation; grouped statement rows with subtotals; opening balance register as supporting reconciliation/input surface.
6. **Fields and semantics.** Existing as-of date, account code/name/type, posted account balance, current earnings, section subtotal and source basis. Current earnings remain separate until closed to retained earnings. Account 3200 remains explicitly temporary.
7. **Controls.** Existing shared reporting-period control sets the statement date; export remains on the posted ledger table. Opening-balance create/edit stays subject to existing permission and maker-checker/posting behavior.
8. **Canonical ownership/breadcrumb.** Account catalog remains owned by Chart of Accounts; posted journal lines are the sole source for displayed balances; opening balances remain separate canonical records. No duplicate ledger, changed posting or breadcrumb at worksheet root.
9. **Role-aware display.** Existing Finance route permissions and record-level actions remain unchanged.
10. **States/recovery.** Existing note exposes unbalanced equation, source exceptions and non-zero opening offset. Table still identifies posted-only basis and opening balance register retains its real empty state. No values are filled from non-posted invoices/expenses/openings.
11. **Responsive behavior.** Existing FinanceDataTable containment/export and KPI strip remain; added subtotal rows reuse the same table columns and do not create new horizontal layout. Stage 5 must validate at 1100, 900, 600, 390 and 320px.
12. **Accessibility.** Subtotal labels and values use semantic strong emphasis, remain textual and do not rely on row color; column headings and existing table semantics remain. Keyboard/export and text resizing need browser validation.
13. **Regression tests.** Assert asset subtotal precedes liability subtotal, current earnings precedes total equity, totals bind to existing aggregate variables, and balances are sourced from posted journals with source exception/3200 warnings retained.
14. **Dependencies.** No accounting calculation, account-normal-balance logic, posting lifecycle, FX, opening-entry, API or period-close behavior changes. Current earnings remain preliminary until closing/reconciliation policy completes.
15. **Acceptance.** The formal statement clearly exposes section subtotals and retained earnings/current-earnings distinction while preserving posted-only source semantics. Overall Accounting remains partially complete until independent P&L/Cash Flow review and Stage 5 visual/runtime checks pass.

### Source audit checkpoint — Chart of Accounts

Chart of Accounts was reviewed against the specification. The canonical register contains account code, name, type, normal balance, description, active status and management action. Default accounts are reference-only; custom accounts support existing record actions; global worksheet search filters both sets. The source explicitly states that adding an account does not automatically update posting/report mappings. No code change was needed for this audit. Stage 5 still needs authenticated keyboard/role/route verification.

**Next Stage 4 slice:** Monthly P&L and Cash Flow. Verify formal line/subtotal hierarchy and comparison/source labels against existing posted-ledger calculations, without changing accounting formulas.


## Stage 4 view design record — Finance · Accounting & Reports · Monthly P&L

**View ID:** VIEW-FIN-ACCOUNTING, Monthly P&L worksheet.
**Implementation status:** formal posted General Ledger table added after source-operating preview; exact-SHA CI and Quality Gate required before source/test verification.

1. **Owner/persona.** Finance → Accounting & Reports → Monthly P&L. Finance operators compare operational billing/cost preview with posted accounting activity for the shared reporting period.
2. **Primary task.** Review operating source trends and inspect separate posted General Ledger revenue, expense and result from recognized journal activity.
3. **Decision.** What does the operating source preview indicate, what has been posted to mapped accounting accounts, and which source exceptions still prevent treating the result as final profit?
4. **Primary surface.** Operating source comparison table and detail remain first; a formal posted-ledger income statement table follows. This avoids presenting posted accounting only as isolated KPI cards.
5. **Content order.** Operational source preview warning; comparison controls and current-versus-comparison table; source detail and expense classification note; posted GL income statement table and export.
6. **Fields and semantics.** Existing selected-period invoice/expense data remains unchanged. Posted GL rows use existing `getPostedLedgerIncomeStatement(startDate,endDate)` aggregates: Revenue account credits less debits, Expense account debits less credits, and posted result as revenue less posted expenses. Journal count and exact period are stated. No entry means an em dash with explicit “No posted journal entries” measurement text rather than an implied zero.
7. **Controls.** Existing shared reporting period and comparison mode remain the selectors. Posted-GL export includes the same displayed row labels, values and measurement basis; it appears only when posted entries exist. No accounting mutation is introduced.
8. **Canonical ownership/breadcrumb.** Source invoice/expense records remain the operational preview; journal entries and Chart of Accounts remain the posted accounting source. No ledger copy or breadcrumb at worksheet root.
9. **Role-aware display.** Existing Finance route/record permissions are unchanged. The table only displays values already derived by the existing posted-ledger helper.
10. **States/recovery.** Source errors continue to use global Finance notices. If the selected period returns no posted journals, amount cells are not rendered as 0; the basis states no posted entries were returned. Drafts/unmapped source rows remain excluded and disclosed.
11. **Responsive behavior.** Existing FinanceDataTable contains horizontal overflow and preserves three columns; Stage 5 must verify narrow-width readability and exports at 1100, 900, 600, 390 and 320px.
12. **Accessibility.** Semantic column headers and explicit statement-line/basis text; no status depends on color. Export is named for posted GL and only enabled when entries exist. Keyboard/focus, screen-reader and zoom remain browser-unverified.
13. **Regression tests.** Assert source comparison → source detail → formal posted-ledger table, row IDs, source basis, no-posted-entry state, export behavior and availability guard.
14. **Dependencies.** Uses existing posted ledger calculations. No income/expense formula, account mapping, accounting post, API, database, or permission behavior changes.
15. **Acceptance.** Posted General Ledger results read as a formal statement rather than a duplicated KPI strip, and remain separate from operational-source preview/profit proxy. Accounting remains partially complete pending Stage 5 visual checks and independent live-role/source validation.

**Next Stage 4 slice:** Confirm Finance source/period and role states in the remaining worksheets, then move to another module with a proven structural gap. Keep Finance partially complete until Stage 5 browser sign-off.


## Stage 4 view design record — Projects · Project Registry · Deadline filtering

View ID: VIEW-PROJECTS-OVERVIEW, Project Registry.
Source status: the canonical register already supports search, lifecycle/status quick filters, health/client/owner filters, sorting, and board/table/timeline modes. This slice adds the missing deadline filter required by the restructuring specification. Verify the exact commit through both CI workflows before calling source/test verified.

1. Owner/persona. Projects → Project Registry. Project managers and delivery team members narrow the canonical portfolio to projects whose deadlines need attention.
2. Primary task. Find overdue and soon-due projects without conflating them with completed work or projects whose deadline is not recorded.
3. Decision. Which non-completed projects are overdue, due between today and day 7, due on days 8–30, or have no valid deadline?
4. Primary surface. Existing canonical Project Registry with a deadline filter in the existing filter bar; board, table and timeline continue to use the same filtered project data.
5. Content order. Search, status quick filters, deadline, health, client, owner and sort controls; filtered portfolio; result counts; view-specific presentation. No new KPI strip or alternate project store.
6. Fields and semantics. targetEndDate from the canonical project. Calendar dates use local date-only parsing, not UTC timestamps. Today counts as due within 7 days. Overdue means deadline strictly before today and project is not Completed. Days 8–30 are disjoint from the next-seven-day range. Missing and invalid dates share an explicit filter and never become upcoming/overdue.
7. Controls. The filter composes with existing search/status/health/client/owner/report-period filters. Reset clears it; table pagination resets when it changes. It resets when leaving Project Registry so a hidden local filter cannot silently affect Budget or another worksheet.
8. Canonical ownership/breadcrumb. Uses project records only. Does not change status, edit permissions or route ownership. Registry remains a workspace, not a full-page detail route; no breadcrumb is added.
9. Role-aware presentation. Existing canManageProjects, route policy, create/edit/archive permissions and record actions remain unchanged.
10. States/recovery. If the source is unavailable, existing unavailable state and source notice remain authoritative. Invalid due dates are grouped with missing dates; they do not become urgent exceptions or implied dates.
11. Responsive behavior. Filter is part of the existing horizontally-contained filter control row and uses existing compact control sizing. Stage 5 must verify 1100, 900, 600, 390 and 320px and keyboard reachability of horizontal controls.
12. Accessibility. Explicit accessible label, visible selected option, existing CustomSelect behavior and explicit text categories. No state relies on color. Keyboard/focus/browser evidence remains Stage 5.
13. Regression tests. New pure tests cover local calendar boundaries, leap day/month/year changes, overdue strictness, next-seven-day inclusivity, 8–30-day disjoint window, completed exclusion, and missing/invalid dates. Page test covers control wiring, reset and hidden-filter cleanup.
14. Dependencies. No API/database/source model change. Uses existing target deadline and status only. Does not change deadline validation or workflow.
15. Acceptance. Registry users can filter meaningful deadline windows over canonical project data. The view remains partially complete until Stage 5 confirms viewport, keyboard and role behavior; other Project worksheets still require independent review.

Next Stage 4 slice: Projects · Tasks & Execution. Audit the existing canonical task Board/List and detail work surfaces against stage/priority/owner/deadline, unassigned state, keyboard alternatives and task-level source parity. Do not create separate tasks or simulate Dependencies unless a real canonical model exists.


## Stage 4 view design record — Projects · Tasks & Execution · Board/List empty and source states

View ID: VIEW-PROJECTS-TASKS, Tasks & Execution.
Implementation: source-state and Board empty-state hierarchy correction. Check the resulting SHA's CI and Quality Gate before calling this slice source/test verified.

1. Owner/persona. Projects → Tasks & Execution. Project managers and team members prioritize and move canonical delivery tasks through To Do, In Progress, Review, and Done.
2. Primary task. Find matching work, identify ownership, priority and deadline, open details, and move a task using permitted interactions.
3. Decision. Are there no matching tasks, is the queue genuinely empty, or has the task source not yet returned verified records?
4. Primary surface. Existing Board or List over canonical task records. Board remains a status-lane view; List stays the keyboard-friendly register and supports sorting and pagination.
5. Content order. Existing workspace/scope tabs, search/filter controls, active-filter/result summary, source/action notice, contextual board-empty or list-empty feedback, primary work surface, pagination, then supporting KPI strip. No KPI/source-store duplication.
6. Fields and semantics. Existing task ID/title, project, assignee, status, priority, due date, blocked state and subtasks remain source-derived. Task Lists and Dependencies remain unavailable because their canonical persisted models are not verified.
7. Controls. Existing filters, reset, row selection and bulk status controls remain. Unavailable state retries via the real task loader. Board empty reset reuses the existing clearFilters callback; no new API mutation is added.
8. Canonical ownership/breadcrumb. Both layouts continue to use the same task collection and existing status transition API. No duplicate task record, no dependency simulation and no breadcrumb at workspace level.
9. Role-aware presentation. Existing canManageKanbanTasks guards remain authoritative; no additional permissions are created. Read-only users see read-only board instructions without active drag handles.
10. States/recovery. Initial fetch failure shows Tasks unavailable with retry rather than an empty count. Source is considered loaded only after a successful canonical task array response, including a valid empty array. If a later refresh fails after successful load, known records remain visible with the existing warning. Board distinguishes filtered-empty from no tasks in the current queue, and lane copy reflects active filters.
11. Responsive behavior. Kanban lane minimum width is 280px per Kanban guidelines; the board retains a contained horizontal scroll region. List retains the contained table and keyboard-focusable region. Stage 5 must verify 1100, 900, 600, 390 and 320px.
12. Accessibility. Empty/unavailable states use role=status, retry/reset controls have visible labels, and no message depends on color. Stage 5 browser keyboard/focus and 200% zoom checks remain unverified.
13. Regression tests. Source parity suite now checks initial unavailable distinction, successful source evidence, actual retry, Board filtered-empty banner and lane copy, and 280px geometry; existing source-to-record and permission regressions remain.
14. Dependencies. No backend/API/persistence/auth/RBAC/business workflow changed. Retry uses loadTasks(true). Status transitions and unknown-outcome recovery remain on the existing canonical task API.
15. Acceptance. Users can distinguish true zero records, filter-empty results and initial source failure without losing useful lane drop targets for successful empty states. The view remains partially complete pending Stage 5 runtime/accessibility and Stage 6/8 workflow traces.

Next Stage 4 slice: Projects · Planning & Delivery. Review Project Brief, Milestones and Timeline individually. Keep Scope & Deliverables, Internal Quality Review, Client Review and Revision History unavailable until canonical workflows support them.


## Stage 4 view design record — Projects · Planning & Delivery · Selected-project recovery

View ID: VIEW-PROJECTS-PLANNING, Project Brief / Milestones / Timeline.
Implementation: a stale planningProject URL no longer silently selects the first active project. Verify the resulting SHA through both CI and Quality Gate before calling source/test verified.

1. Owner/persona. Projects → Planning & Delivery. Project managers inspect the selected project's brief, milestones and recorded schedule.
2. Primary task. Navigate among a project's brief, milestones and timeline while preserving the project identity in the URL.
3. Decision. Is the requested project available in the canonical project source, or should the user select another project/clear the stale URL?
4. Primary surface. Existing query-addressable Project Brief, Milestones and Timeline views over canonical project/milestone records.
5. Content order. Existing worksheet tabs; when selected record exists, project context selector and worksheet. When URL points to a missing record, show a specific unavailable state, a selector for returned canonical projects and a clear-selection recovery action.
6. Fields and semantics. Project identity comes from selected ID or slug only. Missing URL references do not fall back to a different record. Default project selection remains available only when no explicit project is requested.
7. Controls. Selector sets planningProject while preserving planningView and other existing query parameters. Clear-selection removes only planningProject, allowing the existing default selection policy to apply.
8. Canonical ownership/breadcrumb. Uses the existing project collection. No new records, route or breadcrumb.
9. Role-aware presentation. Existing route permission and project source remain authoritative. Only returned project options are shown.
10. States/recovery. If a specific selected ID/slug is not returned while project records are available, show Selected project unavailable rather than choosing another project. User can select a current project or clear the stale query. Existing source/loading states remain.
11. Responsive behavior. The existing CustomSelect recovery control is full width on narrow screens and constrained on wide screens. Stage 5 verifies 1100, 900, 600, 390 and 320px.
12. Accessibility. Semantic panel title/description, role=status explanation, labelled selector and visible recovery button. Keyboard/focus evidence remains Stage 5.
13. Regression tests. Added source regression assertions for explicit identity matching, no fallback for missing selection, source-aware unavailable copy, selector query updates and clearing only planningProject.
14. Dependencies. No backend, database, authorization or delivery workflow changes. Scope/acceptance criteria, deliverable tracking, internal QA, client review and revision history remain unavailable.
15. Acceptance. A stale or inaccessible project URL cannot silently show another project's planning data. The view remains partially complete pending browser route/history/accessibility verification and missing canonical planning workflows.


## Stage 4 view design record — Projects · Project Resources · Selected-project recovery

View ID: VIEW-PROJECTS-RESOURCES, Project Resources.
Implementation: remove silent fallback from an explicit resourcesProject URL. Verify the resulting SHA through both CI and Quality Gate before calling source/test verified.

1. Owner/persona. Projects → Project Resources. Project managers review team membership, explicit allocation records and project-scoped task assignments.
2. Primary task. Select a project and inspect recorded team/task assignments without suggesting that assignment count equals availability or capacity.
3. Decision. Is the URL-selected project present in the canonical project source, or must the user select another project/clear the stale query?
4. Primary surface. Existing project-scoped team/allocation summary and canonical task register.
5. Content order. Project selector, team/allocation values, project-scoped task assignments and capacity boundary statement. If the selected project is missing, show a specific unavailable state instead of a different project.
6. Fields and semantics. Project team names, explicit allocation percentages/dates and existing task assignment/status/priority/due date. Cross-project availability and time remain in Team & Resources/Time Tracking.
7. Controls. Selection updates resourcesProject while preserving other query parameters. Clearing removes only resourcesProject so the existing default project policy applies.
8. Canonical ownership/breadcrumb. Uses project, resource-allocation and task records already loaded; no new assignment store or breadcrumb.
9. Role-aware presentation. Existing project route and canManageProjects policy remain unchanged.
10. States/recovery. If a selected ID/slug is not returned, show Selected project unavailable and explain no alternate project will be substituted. User can choose a returned project or clear the query. If the source itself is unavailable, the existing source-unavailable state remains authoritative.
11. Responsive behavior. Recovery selector is full width on narrow screens and constrained on wide screens. Stage 5 verifies 1100, 900, 600, 390 and 320px.
12. Accessibility. Semantic panel, role=status explanation, accessible selector label and visible recovery button; keyboard/focus and screen-reader behavior remain Stage 5.
13. Regression tests. Explicit identity matching, no silent substitution, selector query update and query clearing are asserted. Existing resource allocation and task record behavior remains unchanged.
14. Dependencies. No API, persistence, RBAC or business logic change. Cross-project capacity and current availability remain unavailable in this project workspace.
15. Acceptance. A stale resource-project URL cannot silently display another project's team and allocation data. View stays partially complete until Stage 5 route/visual verification and cross-module source parity checks.


## Stage 4 view design record — Finance · Project Finance · Operational Budget

**View ID:** VIEW-FIN-PROJECT, Operational Budget worksheet.
**Implementation status:** Source update and regression coverage have been added to this checkpoint; verify the exact SHA in both CI workflows before marking this slice source/test verified.

1. **Owner/persona.** Finance → Project Finance → Operational Budget. Finance operators compare approved budget lines against recorded AMS expenses.
2. **Primary task.** Review month/category/project budget versus actuals and identify variance without treating a failed source read as no spending.
3. **Decision.** Is actual spending truly zero, based on a successful empty source response, or unavailable/stale because the expense source failed?
4. **Primary surface.** Canonical month/category/project budget-versus-actual register. The existing saved budget source and expense actual source remain the only records.
5. **Content order.** Monthly budget-versus-actual context; source-specific unavailable/stale notice with retry where needed; budget lines, actual, variance, expense-row count and authorized actions. No new KPI strip or duplicate data source.
6. **Fields and semantics.** Month, category, project/company-wide bucket, PIC/notes, saved budget amount, dated expense actual and record count. Variance remains budget minus recorded actual when the expense source is current. Unassigned expenses stay company-wide.
7. **Controls.** Existing report-period, search, Set budget and edit actions remain. Retry invokes the existing `loadData(true)`; no API or mutation changes.
8. **Canonical ownership/breadcrumb.** Uses saved operational-budget records and core AMS expense records. No duplicate expense rows, budget record or breadcrumb.
9. **Role-aware presentation.** Existing finance record permissions still gate budget writes. Retry is read-only.
10. **States/recovery.** Successful empty source yields a truthful zero actual. First-load expense failure suppresses actual/count/variance as unavailable. Failure after prior success preserves the last values but marks actual stale and suppresses variance until a refresh succeeds. The notice does not infer new values or pretend the source recovered.
11. **Responsive behavior.** Notice stacks at narrow widths and keeps retry visible. Existing FinanceDataTable owns its horizontal containment; Stage 5 still checks 1100, 900, 600, 390 and 320px.
12. **Accessibility.** Notice uses role=status, visible explanation and labeled retry button; status text accompanies warning badges, so color is not the only signal. Keyboard and focus still require browser verification.
13. **Regression tests.** Source tests cover loaded-state tracking, error detection, unavailable/stale copy, withheld variance, real retry, and unchanged current-source formula.
14. **Dependencies.** No backend, data model, finance formula, payment/posting behavior or permission policy changed. Source freshness is local presentation metadata only.
15. **Acceptance.** A successful empty expense result can show zero, but a failed initial load cannot. Stale values are labeled and variance is withheld until source recovery. Finance Project remains partially complete until Allocation/Team Fee are audited and Stage 5 browser evidence is collected.

**Next Stage 4 slice:** Finance → Project Allocation and Team Fee source/period semantics, then continue the remaining active worksheets before Stage 5 review.


## Stage 4 view design record — Finance · Project Finance · source recovery

**View ID:** VIEW-FIN-PROJECT, Project Finance main register.
**Status:** Source-state and regression changes were prepared on `main`; verify the exact commit through both CI workflows before source/test sign-off.

1. **Owner/persona.** Finance → Project Finance. Finance operators review each canonical AMS project alongside its configured financial inputs and source-derived activity.
2. **Primary task.** Inspect project finance configuration, linked invoices/collections/costs and vendor obligations without mistaking a failed project fetch for an empty portfolio.
3. **Decision.** Is there truly no project, or did the project source fail on initial load or a later refresh?
4. **Primary surface.** Existing one-row-per-project financial register with existing compact-card layout, source-derived activity and setup actions.
5. **Content order.** Project finance/source-coverage context; source unavailable/stale recovery note when needed; canonical project finance register; existing unlinked Finance records table where applicable.
6. **Fields and semantics.** Project identity from core project source; planning inputs from the saved Project Finance record; billing/collections/expense/AP values retain their existing periods and measurement definitions. No profitability formula change.
7. **Controls.** The existing period selector, Finance worksheet search, Configure and record editor controls remain. Retry invokes `loadData(true)` and adds no write action.
8. **Canonical ownership/breadcrumb.** Project identity remains owned by the Projects source; Finance owns project-finance inputs and vendor obligations. No new project record or breadcrumb.
9. **Role-aware display.** Existing Finance permissions and source handlers remain unchanged.
10. **States/recovery.** Successful empty project response continues to show the genuine empty state. Initial request failure shows unavailable and a retry. Later refresh failure retains known projects, labels their data as stale, and keeps the source error visible. No inferred project value is written.
11. **Responsive behavior.** Existing compact cards/table layout stays unchanged; recovery note stacks on narrow screens. Validate 1280/1100/900/600/390/320px in Stage 5.
12. **Accessibility.** Source note uses role=status, clear heading and visible retry button; stale/unavailable states use explicit words, not color alone. Keyboard/focus remains Stage 5.
13. **Regression tests.** Assert successful-source tracking, error label detection, initial-unavailable vs true-empty semantics, stale-on-refresh message, real retry control and empty-message conditional.
14. **Dependencies.** Core projects source is authoritative; no API/backend, financial formulas, persistence or policy change. Project Allocation has no canonical effective-period field; it remains a current saved allocation until a proper history/period model is approved.
15. **Acceptance.** Project Finance cannot represent a failed first-load as a genuinely empty project set. The view remains partially complete until Stage 5 source/recovery/role/browser checks pass and the Project Allocation period dependency is addressed at the appropriate data-model stage.

**Next Stage 4 slice:** Complete the remaining active Finance Project Allocation and Team Fee review without inventing period history, then audit Team & Resources, Documents, Website CMS and Settings worksheets using the same source-state acceptance standard.


## Stage 4 view design record — Finance · Project Finance · Project Allocation period semantics

**View ID:** VIEW-FIN-PROJECT, Project Allocation subsection.
**Status:** Period limitation is now visible in the existing policy note; canonical history remains blocked by the source model.

1. **Owner/persona.** Finance → Project Finance → Project Allocation. Authorized finance operators review a project's saved allocation percentages and amounts.
2. **Primary task.** Understand the saved current allocation and its policy basis without mistaking it for a period-based history report.
3. **Decision.** What allocation record is currently saved for this project, how do its percentages relate to the default policy, and is a selected-period breakdown actually supported?
4. **Primary surface.** Existing canonical Project Allocation register and saved percentages per record. No second register or fabricated history is added.
5. **Content order.** Existing allocation policy note; explicit limitation about no effective period; saved allocations with per-record percentages; standard Team Reward distribution breakdown.
6. **Fields and semantics.** Contract value, vendor commitment, other obligations, saved Team Fee total, saved petty-cash/emergency/reward percentages and status. Missing percentages remain “Share not recorded”; default splits apply to new records only.
7. **Controls.** Existing finance reporting-period selector remains global for worksheets that support it. It does not filter Project Allocation because the canonical allocation record has no effective month/quarter. No new date picker is added.
8. **Canonical ownership/breadcrumb.** Uses saved project-allocation records and Project Finance source inputs. No client-side period field or breadcrumb.
9. **Role-aware presentation.** Existing finance permissions and record actions unchanged.
10. **States/recovery.** Missing saved split percentages remain explicitly unavailable. The note explains that historical per-period allocation is unsupported. No status is inferred from record creation time.
11. **Responsive behavior.** Existing FinanceDataTable card/table presentation remains unchanged; visual viewport verification belongs to Stage 5.
12. **Accessibility.** Limitation is stated as text in the existing semantic policy note and does not rely on warning color.
13. **Regression tests.** Assert the limitation copy and guard against filtering allocations by a fabricated effective-period property.
14. **Dependencies.** A canonical period/effective-date/history field must be defined in Stage 6/data ownership before period-wise allocation is possible. Do not infer it from `createdAt`.
15. **Acceptance.** Users understand that they are seeing saved allocations, not a historical reporting-period series. This subview remains partially complete and dependency-blocked for historical periods.


## Stage 4 view design record — Finance · Project Finance · Team Fee

**View ID:** VIEW-FIN-PROJECT, Team Fee worksheet.
**Status:** Source-state feedback and period semantics are implemented in source; verify the resulting commit through both CI workflows before source/test sign-off.

1. **Owner/persona.** Finance → Project Finance → Team Fee. Finance operators review member-level fee milestones and separately inspect expenses categorized as Project Team Fee.
2. **Primary task.** Find a fee milestone, understand its due/payment state and distinguish the planned entitlement record from recorded expense costs.
3. **Decision.** Does the member-fee register or expense source truly have no matching rows, or did the corresponding source fail/unavailable refresh?
4. **Primary surface.** Two canonical source tables kept separate: Project Team Fee allocation and Project Team Fee expense sources.
5. **Content order.** Shared note explaining separate ownership and date semantics; source unavailable/stale recovery when needed; member-fee table; separately classified expense-source table.
6. **Fields and semantics.** Fee record: project/member/reference/role/amount/due date/paid date/payment status. Expense source: date/project/description/amount/record state. The fee table filters on due date or creation date when no due date exists; displayed paid date is informational and does not drive this schedule filter. Expense rows use expense date.
7. **Controls.** Existing Finance reporting period and search remain. A source recovery button invokes the existing `loadData(true)`; it does not create or change fee/payment records.
8. **Canonical ownership/breadcrumb.** The supplementary `team-fee` register owns member-level entitlement state. Core AMS expense records own classified expense costs. Expense cost is not automatically treated as payment settlement. No duplicate dataset or breadcrumb.
9. **Role-aware display.** Existing finance access policy, register permissions and action helpers remain unchanged.
10. **States/recovery.** Missing successful Team Fee source response shows unavailable rather than an empty register. A later failure labels last-known fee records as stale. Expense source has equivalent first-load unavailable and later-stale distinction using its existing successful-load flag. Empty states differ between source failure and a valid successful response with no matches.
11. **Responsive behavior.** The existing FinanceDataTable layout remains unchanged. The source note and retry button wrap on narrow widths; verify 1100/900/600/390/320px during Stage 5.
12. **Accessibility.** State feedback uses role=status and visible retry label; stale/unavailable wording carries meaning without relying on color. Keyboard/focus still requires browser validation.
13. **Regression tests.** Assert per-source failure detection, successful-empty distinction, stale copy, real retry, conditional empty messaging and due-date/creation-date period semantics.
14. **Dependencies.** A separate due date per installment is not currently stored; current member fee filter semantics are explicitly stated. No payment logic or API behavior changes.
15. **Acceptance.** Team Fee never claims an empty register solely because its request failed, keeps member entitlement separate from classified expense cost, and states how period filtering works. View remains partially complete pending Stage 5 browser/source validation.


## Stage 4 view design record — Documents · Document Library · filter ownership

**View ID:** VIEW-DOCS-LIBRARY, canonical Document Library.
**Status:** Removed an invisible global-period dependency from the register; verify the resulting SHA through both workflows before source/test sign-off.

1. **Owner/persona.** Documents → Document Library. Staff search for an authorized canonical file, verify its owner/relationship and use permitted preview/download/upload actions.
2. **Primary task.** Find a document across the canonical vault, independent of the currently selected Finance/reporting period.
3. **Decision.** Which canonical file matches the search/category and sorting criteria, and what safe action can be taken on that same record?
4. **Primary surface.** Existing searchable, sortable and paginated Document Library register/list, with the secure detail drawer and upload drawer.
5. **Content order.** Module header/header upload action; search/category/sort controls; canonical document register with explicit loading/unavailable/no-match states; upload flow and document-detail surface as needed. Existing mobile list and wide table remain.
6. **Fields and semantics.** Title/filename, category/type, owner, related client/project, size, update/upload date, status and available download action come from the canonical document records. Update/upload date is metadata, not an implicit filter.
7. **Controls.** Category is query-addressable through the existing `documents` parameter; search and sort/pagination stay local to this library. The global reporting-period selector no longer filters records without a corresponding date control in the Documents workspace.
8. **Canonical ownership/breadcrumb.** Document record remains canonical and linked to existing client/project IDs. Current details open in a drawer/modal within the library, not an eligible full-page route; do not add a breadcrumb. Any future full-page detail route must be re-audited against `UX-NAV-BREADCRUMB-001`.
9. **Role-aware presentation.** Current `canManageDocuments` and server-protected file access remain authoritative. No permissions are added.
10. **States/recovery.** Existing retry/access-denied behavior stays unchanged; on access failure, private rows and selected record are cleared. Transient non-auth errors preserve last known records with a visible stale-list warning. Upload create/storage ambiguous outcomes retain the current refresh-and-inspect recovery rather than blind duplicate retries.
11. **Responsive behavior.** Existing mobile document cards below 1280px and contained wide table stay unchanged; verify 1100/900/600/390/320px during Stage 5.
12. **Accessibility.** Explicit search/category/sort labels, document-specific preview/download/delete names, role alert for unavailable source and role status for stale refresh remain. Keyboard/focus/200% zoom still require browser verification.
13. **Regression tests.** Assert that the register stays primary and distinct unavailable/empty states remain, while the component no longer imports or invokes `useReportingPeriod`/unlabelled `matchesDate` for documents. Search and category matching remain connected to the canonical collection.
14. **Dependencies.** Current document source/interface does not expose a version-history chronology view. Do not fabricate version history or create a second repository. Verify backend/vault object integrity only through the existing protected contract.
15. **Acceptance.** Older documents remain discoverable through visible search/category/sort regardless of global reporting period; security, source failure, actual stored-object integrity and browser/device acceptance remain open until verified in Stage 5.


### Document Library global-period regression correction — 19 October 2026

The first Quality Gate for `8e6f6dda44c70049f45237aad229b3a620fdf842` failed because `tests/global-reporting-period.test.ts` still required Document Library to use `matchesDate(updatedAt/uploadedAt/createdAt)`, contradicting the content-first specification and the revised visible-filter ownership. The test now preserves the global reporting-period shell and asserts that Documents does not inherit the period invisibly. Re-run the complete Quality Gate and AMS CI on the corrective SHA before marking Document Library source/test verified.


## Stage 4 view design record — Website CMS · Services · publication feedback

**View ID:** VIEW-CMS-SERVICES, service register/editor.
**Status:** Publication feedback now distinguishes saved CMS state from independently verified public output. Verify the resulting commit on both workflows before calling source/test verified.

1. **Owner/persona.** Website CMS → Services. Authorized content editor maintains Creative & IT service records and their publication flag.
2. **Primary task.** Save a service draft or set its CMS publication flag, then confirm whether the public Services page actually reflects the saved state.
3. **Decision.** Did the CMS mutation succeed, and has public rendering been independently verified?
4. **Primary surface.** Existing service register/editor and publication-state controls.
5. **Content order.** Existing search/category/register and selected service editor remain unchanged. Status feedback follows the successful API response and explains the next verification step.
6. **Fields and semantics.** `isPublished` represents the saved CMS record flag. It does not constitute a runtime/browser probe of public page content or cache state.
7. **Controls.** Existing save and publish/unpublish calls remain. No second publish action, public-health endpoint or automatic request is added.
8. **Canonical ownership/breadcrumb.** Service CMS record remains canonical and feeds public service responses filtered by publication flag. No duplicate data.
9. **Role-aware display.** Existing route permissions and API mutation authority remain unchanged.
10. **States/recovery.** API failure continues to show an error. API success now says the CMS status was saved and asks the editor to verify public visibility; it does not state that the live page was independently confirmed.
11. **Responsive behavior.** Only status copy changed; existing responsive register/editor layout is retained. Viewport verification is Stage 5.
12. **Accessibility.** Existing status message remains visible/announced by the current component; copy now accurately names the confirmed state and next action. Keyboard/browser verification remains Stage 5.
13. **Regression tests.** Assert saved-CMS-state wording for publish/unpublish and reject prior messages claiming live-site visibility.
14. **Dependencies.** Independent public rendering/cache verification is currently manual/supported-runtime evidence. No backend, API, integration, or publication workflow changes are in this slice.
15. **Acceptance.** A successful CMS mutation is reported as saved publication state; public visibility remains explicitly unverified until the public Services response/page is checked. The view stays partially complete until Stage 5/browser review.


## Stage 4 view design record — Website CMS · Case Studies · publication feedback

**View ID:** VIEW-CMS-CASES, Case Studies workspace.
**Status:** Saved-CMS-state feedback is implemented in source; verify the resulting exact commit through both CI workflows before source/test sign-off.

1. **Owner/persona.** Website CMS → Case Studies. Authorized content editor authors and manages case-study records for the public /work collection.
2. **Primary task.** Save a draft or change the case-study publication flag, then confirm what has actually been verified about the public output.
3. **Decision.** Did the CMS record update succeed, and has the public response/page actually been checked?
4. **Primary surface.** Existing case-study register, editor, preview/details and publication toggle remain the working areas.
5. **Content order.** Existing search/register/editor flows remain unchanged; status feedback explains the confirmed CMS state and the next public-output verification step.
6. **Fields and semantics.** isPublished is a persisted CMS field. It is used by the public /work response filter, but a successful write response does not prove that a deployed public page or cache has refreshed.
7. **Controls.** Existing update/save actions and CMS record IDs remain. No new publish API, public probe or secondary state is added.
8. **Canonical ownership/breadcrumb.** Case-study records remain canonical CMS content and related public client/project attribution remains governed by existing rules. No new repository or breadcrumb.
9. **Role-aware display.** Existing CMS route permissions and API authorization remain unchanged.
10. **States/recovery.** Mutation error messages are unchanged. Successful changes now say the CMS publication state was saved and ask the editor to verify /work; no unsupported claim of live-site confirmation is displayed.
11. **Responsive behavior.** No structural layout changes; Stage 5 must still inspect register/editor reflow at the documented breakpoints.
12. **Accessibility.** Existing status feedback remains visible and localized, with copy that distinguishes saved state from external verification. Keyboard/focus and screen-reader behavior need browser validation.
13. **Regression tests.** Assert the new saved-state wording and reject prior “published successfully to live site” claims.
14. **Dependencies.** Actual public rendering remains a supported-environment/browser verification task; no API or public site changes are part of this slice.
15. **Acceptance.** A CMS mutation is reported as a saved CMS state, and public visibility remains unverified until the public /work output is checked. The view remains partially complete pending Stage 5 review.


### Case Studies publication-copy test correction — 19 October 2026

Quality Gate and CI on `4542f6de4fbd114f5f7696c105709a660cbb4358` failed because `tests/frontend-functional-regression.test.ts` still required the former message "Case study published successfully to live site!". The source change deliberately avoids that unsupported claim and confirms only the saved CMS flag. The regression assertion now checks the revised message and rejects the old live-site claim while preserving assertions for legacy published records, draft defaults and the server-side public filter. Re-run both workflows on the corrective SHA.


## Stage 4 view design record — Website CMS · Testimonials · publication feedback

**View ID:** VIEW-CMS-TESTIMONIALS, Testimonials workspace.
**Implementation status:** UI success feedback has been aligned with the confirmed CMS mutation response. Verify the resulting exact SHA through both workflows before considering source/test verification complete.

1. **Owner/persona.** Website CMS → Testimonials. Authorized content editors maintain testimonial quote, author, rating, attribution and saved publication flag.
2. **Primary task.** Save testimonial content or change its publication flag, then verify public output when publication visibility matters.
3. **Decision.** Did the CMS record update succeed, and has the public Testimonials output actually been checked?
4. **Primary surface.** Existing searchable testimonial directory and edit form, with explicit publication toggle and delete confirmation.
5. **Content order.** Existing header, search, result count, testimonial register/cards and editor/delete dialogs remain unchanged. Status feedback follows successful API response and states exactly what was saved plus the next public verification action.
6. **Fields and semantics.** isPublished is the persisted CMS record flag. For public users, the current /cms/testimonials API filters explicit isPublished === false drafts while retaining older testimonials without the flag. This server rule does not independently prove that a deployed page, CDN or cache has refreshed.
7. **Controls.** Existing save/create/delete and api.cms.updateTestimonial mutation remain unchanged. No second publish API, local publication cache, or automatic public health probe is added.
8. **Canonical ownership/breadcrumb.** Testimonial CMS record remains canonical. No new list/source, duplicate public state or breadcrumb is introduced.
9. **Role-aware presentation.** Existing CMS route permission and canManageCmsContent server authorization remain unchanged.
10. **States/recovery.** API failures still display the current error response. Successful publish/unpublish messages now say the CMS state was saved and ask editors to verify public visibility. Saving a draft says it remains a draft in the CMS. The interface no longer equates a successful write with verified live output.
11. **Responsive behavior.** Structural register/editor layout is unchanged; Stage 5 must verify cards, directory search, confirmation dialogs and status notices at design-system breakpoints.
12. **Accessibility.** Existing labeled search, publication buttons, accessible confirmation dialog and visible dismissible status notice remain. Keyboard focus and screen-reader announcement require browser evidence.
13. **Regression tests.** Functional and nine-module workspace tests assert CMS-state wording, reject unsupported public-live claims, and preserve canonical API update and server-side public filtering.
14. **Dependencies.** Actual live public response/cache/deployed page is not verified in this source-only change. Do not claim runtime publication verification without checking the supported public environment.
15. **Acceptance.** Editors can tell that the CMS flag was saved and know that public visibility remains to be checked. Keep the view partially complete until Stage 5/9 confirms authorized mutation, public output and recovery behavior.

**Next Stage 4 slice:** Continue Website CMS review with Insights and Careers only where source-backed defects are verified; do not invent recruitment/publication workflow beyond current canonical records.


## Stage 4 view design record — Website CMS · Careers · publication and deletion feedback

**View ID:** VIEW-CMS-CAREERS, Jobs worksheet.
**Implementation status:** Feedback now distinguishes CMS mutation results from independently verified public output. Verify the resulting exact SHA with both workflows before source/test sign-off.

1. **Owner/persona.** Website CMS → Careers → Jobs. Authorized editors maintain bilingual job records and the stored publication flag. Applicant records remain a separate restricted worksheet.
2. **Primary task.** Change a job's CMS publication flag or delete a job record without implying that a deployed public page was independently checked.
3. **Decision.** Was the CMS publication field saved or the CMS record deleted, and has public Careers output been verified afterwards?
4. **Primary surface.** Existing jobs register, filters, editor and delete-confirmation dialog. No new publish workspace or external verification endpoint.
5. **Content order.** Existing workspace tabs and editor/register remain unchanged. Toggle/save/delete feedback follows the confirmed response and explains the next verification action.
6. **Fields and semantics.** The UI mutates the canonical job record and its isPublished field. Success confirms the CMS response, not public page/CDN/cache state. Existing applicant records remain after job deletion.
7. **Controls.** Existing api.cms.updateCareer and api.cms.deleteCareer mutations remain. No new backend route, publish step or public-site health probe is added.
8. **Canonical ownership/breadcrumb.** Job records stay in the Careers CMS workspace; applicant records stay in the restricted Applicants tab. The message does not create a duplicate public status.
9. **Role-aware presentation.** Existing job-management permission and applicant access policy remain unchanged. No authorization policy was added.
10. **States/recovery.** Mutation errors still use existing error feedback. Success distinguishes saved CMS Published/Draft state; delete warning describes the CMS record deletion and retention of applications, then directs editor to verify public visibility changes.
11. **Responsive behavior.** Existing jobs register/editor geometry remains; longer notices must be checked for wrapping at 1100/900/600/390/320px.
12. **Accessibility.** Existing visible status notice and confirmation dialog remain. Keyboard focus, screen-reader announcement, and dialog reading order require browser review.
13. **Regression tests.** Assert the new published/draft wording, CMS-record deletion semantics, retained applications and rejection of prior unsupported public-live claims.
14. **Dependencies.** Runtime Careers page and public application persistence require authorized browser/output verification. No backend, public route, API contract or applicant workflow changed.
15. **Acceptance.** Operators get an accurate report of the CMS mutation and a specific next step to verify actual public output. The view stays partially complete pending Stage 5/9 role, browser, public submission and responsive verification.


## Stage 4 view design record — Website CMS · Insights · saved publication state

**View ID:** VIEW-CMS-INSIGHTS, editorial register and editor.
**Implementation status:** Save feedback now reflects the selected and prior CMS publication state. Verify the exact commit through both workflows before source/test sign-off.

1. **Owner/persona.** Website CMS → Insights. Authorized editors create and maintain editorial articles and language variants with status, taxonomy, SEO and article content.
2. **Primary task.** Save a draft/update or publish an article, then verify public output when publication is intended.
3. **Decision.** Did the record save as Published, remain/update as Draft, or create a new draft? Does the public page reflect the CMS state?
4. **Primary surface.** Existing article register with search/status/language filters and full content editor; direct public link remains available for published entries.
5. **Content order.** Existing header and editorial list/editor remain unchanged. Save feedback now confirms the saved CMS state rather than reporting a generic success for all outcomes.
6. **Fields and semantics.** Title, slug, status, publishedAt, language, category, author/tags, rich blocks, takeaways, FAQ and related articles continue to use existing Insight records and API. Status is stored CMS state, not independent evidence that deployment/cache has refreshed.
7. **Controls.** Existing create/update/delete and content-block controls remain. No new publication endpoint or secondary local publication state is introduced.
8. **Canonical ownership/breadcrumb.** Article remains canonical CMS Insight record. Language variants retain contentGroupId and related Insight IDs. No duplicate article source or new breadcrumb.
9. **Role-aware presentation.** Existing CMS route and API authorization remain unchanged.
10. **States/recovery.** Validation/save errors remain visible. Published success asks the editor to verify the public Insights page; a published→draft save prompts verification of visibility change; draft update/new draft messages state their CMS status. Existing source loading error/retry behavior remains.
11. **Responsive behavior.** Current register/editor and block editor geometry remain. Verify rich-block reflow, preview/public links, filters and error notices at Design System widths.
12. **Accessibility.** Existing labeled fields, block reorder actions, validation, and visible status notice remain. Keyboard/focus and screen-reader review remain Stage 5 tasks.
13. **Regression tests.** Assert previous publication state detection, explicit Published/Draft/new-draft feedback, canonical update API, load refresh, and existing public article link.
14. **Dependencies.** Independent public rendering, media hydration, translation and cache behavior require public/browser evidence. No API or public site code changed.
15. **Acceptance.** Editors know what CMS state was saved and where to verify output. The view stays partially complete until Stage 5/9 verifies public output, route/query/language state and browser interaction.

**Next Stage 4 slice:** Continue the remaining module-specific source audits, then consolidate Stage 4 gaps that are blocked by canonical source/model dependencies before Stage 5 review.


### Insights typecheck correction — 19 October 2026

Quality Gate [39229655648](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39229655648) and AMS CI [39229655663](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39229655663) on commit d7c8932 failed at TypeScript before regression tests because the canonical list state is named items, not insights. The publication-state comparison now reads the existing items state and the matching regression assertion is corrected. This does not change the record/API contract or publication flow. Re-run both workflows on the corrective commit.


## Stage 4 view design record — Settings · Integrations · notification status semantics

**View ID:** VIEW-SETTINGS-INTEGRATIONS, Integration Overview worksheet.
**Implementation status:** The visible status now distinguishes a successful settings fetch from provider delivery readiness. Verify this exact SHA through both CI workflows before source/test verification.

1. **Owner/persona.** Settings → Integrations. Authorized administrators review server-managed connection metadata and readiness without seeing secrets.
2. **Primary task.** Determine whether the notification configuration endpoint is reachable and whether separate server readiness checks report delivery as ready.
3. **Decision.** Was notification settings data retrieved, and does the server's production-readiness signal indicate notification delivery readiness?
4. **Primary surface.** Existing Integration Overview status groups and server-readiness gate summary.
5. **Content order.** Server-managed resource summary; clear notification-settings availability; separate integration-health/readiness indicators. No new duplicate provider dashboard.
6. **Fields and semantics.** The notification settings API success confirms the settings request returned successfully. It does not prove provider credentials, connectivity or message delivery. The existing production readiness response owns the notifications readiness gate.
7. **Controls.** No new controls or provider probes. Existing refresh/load and server-managed settings flow remain.
8. **Canonical ownership/breadcrumb.** Existing settings endpoint and production-readiness gate remain canonical for their respective meanings. No duplicate health source or breadcrumb.
9. **Role-aware presentation.** Existing canAccessServer restriction and API permission behavior remain unchanged.
10. **States/recovery.** Request states are Checking, Available and Unavailable. If settings load succeeds while delivery readiness is false/unavailable, the UI no longer labels the provider Connected. The existing global unavailable warning remains.
11. **Responsive behavior.** Existing status tiles and integration cards remain; confirm stacked/mobile and grid/desktop reflow at design-system breakpoints.
12. **Accessibility.** Status is expressed as text, not just icon color; same labels remain in SummaryCard and Integration Overview. Keyboard/focus and screen-reader announcement need browser checks.
13. **Regression tests.** Assert Available/not Connected wording and explicit distinction from the production-readiness notification gate.
14. **Dependencies.** A truthful configured/connected/last-checked/delivery result requires provider status fields/contract not exposed by the notification-settings GET response. Do not invent a client-side provider check or expose secrets; track for Stage 10 after contract/configuration verification.
15. **Acceptance.** A successful settings fetch is not shown as Connected. A distinct readiness signal determines delivery readiness, and missing provider contract information remains an explicit limitation. Overall Settings stays partial pending Stage 5 visual/role review and Stage 10 integration verification.


### Settings notification regression assertion correction — 19 October 2026

The Quality Gate and AMS CI runs on `74755c5b5005a09b59bdd1bc950d76ec24a71fe0` passed typecheck but failed the new notification semantics test because it looked for `label={notificationLabel}`; the actual `SummaryCard` contract uses `status={notificationLabel}`. The test now asserts the real prop. The Settings source change remains unchanged: API success means settings are available, while delivery readiness comes from the separate production-readiness gate. Re-run both workflows on this corrective commit.


### Annual Summary label clarification — 19 October 2026

The operational Annual Summary measure uses `reportInvoices` filtered through `isIssuedInvoice`, with amount calculated as invoice total less recorded tax. The prior label `Annual Revenue / Invoice Value` could blur issued billing with recognized accounting revenue. The label is now `Issued invoice value (excluding tax)`; the basis says it uses the IDR issued-invoice date and is billed value, not recognized accounting revenue. English/Indonesian labels and basis text are mapped in the existing Finance copy dictionary. No calculation, accounting posting or ledger behavior changed. Verify this SHA through CI and Quality Gate.


### Annual Summary localization assertion correction — 19 October 2026

CI and Quality Gate on `ed739f44032b2881e8c5fdca95cec421a6fa5d5a` passed typecheck but failed one Annual Summary regression assertion because the test expected single-quoted object keys while `FINANCE_UI_COPY` is represented with double-quoted keys/values. The source label and dictionary updates were present. The assertion now checks the exact double-quoted dictionary entries; no UI or calculation behavior changed. Re-run both workflows on this follow-up SHA.


### Annual Summary translation test cleanup — 19 October 2026

On 135033ec0bec5b9defcea68de134a6159c8487ba, test 330 still failed because a duplicate legacy assertion with single-quoted keys remained after the exact double-quoted dictionary checks were added. The stale assertion is removed; source translation entries remain unchanged. Re-run both workflows on the corrective SHA.


## Stage 4 view design record — Settings · System Overview · Backup & Recovery

**View ID:** VIEW-SETTINGS-OVERVIEW, System Overview.
**Implementation status:** The status card and recent-backup register now use the existing server fields for backup freshness, integrity and restore verification. Verify the exact commit through both workflows before source/test sign-off.

1. **Owner/persona.** Settings → System Overview. Authorized administrators inspect backup evidence and server operational readiness, without changing infrastructure policy.
2. **Primary task.** Determine whether the latest backup meets freshness and integrity requirements and whether a restore test is recorded as verified.
3. **Decision.** Is there a current snapshot, is its integrity valid, is it fresh, and does existing server health report restore verification?
4. **Primary surface.** System status summary paired with canonical recent production backup history.
5. **Content order.** Summary status/value/context; latest snapshot history; per-snapshot status only where the API can support it; separate production-readiness summary. Restore readiness is not inferred from mere backup existence.
6. **Fields and semantics.** Existing SecurityStatus includes backupFresh, backupIntegrity.valid, restoreVerified and restoreVerifiedAt. Summary marks recovery verified only if all three conditions are true. History API rows only expose timestamp/size, so the latest check result cannot be copied onto each historical snapshot.
7. **Controls.** Existing Verify integrity and Retry actions remain unchanged; they continue to call the current integrity/security endpoints. No new route, write path or infrastructure action is added.
8. **Canonical ownership/breadcrumb.** Current server security status is canonical for freshness/integrity/restore evidence; backup-list records are canonical for snapshot timestamp/size. No duplicate client-side health model.
9. **Role-aware presentation.** Existing canAccessServer/canView audit checks remain unchanged; no access policy altered.
10. **States/recovery.** Unavailable when sources fail or checks are missing, Review required when evidence is negative, Recovery verified only on freshness + integrity + restore verification. Historical rows say per-snapshot verification is not provided.
11. **Responsive behavior.** Existing status card and backup cards/table remain. Repeated cards preserve independent scroll container and 1280px grid/table switch; verify responsive widths in Stage 5.
12. **Accessibility.** Status values explicitly describe check evidence, not only color. Existing section headings, status badges, native buttons and scroll-region labels remain; keyboard/focus check stays in Stage 5.
13. **Regression tests.** Assert all three criteria are required, historical rows don't inherit newest status, and the source label makes missing per-snapshot evidence explicit.
14. **Dependencies.** Per-snapshot integrity/restore evidence is not returned by the backup-list endpoint. Do not synthesize it. Restore readiness remains infrastructure-owned and is reported from the server health status field.
15. **Acceptance.** A fresh snapshot alone or valid integrity alone cannot produce a healthy/recovery-verified status. Historical entries won't claim verification without a record. Overall Settings stays partially complete pending authenticated browser and responsive review.


## Recovery checkpoint · Settings backup-history status · 19 October 2026

- Current source commit: [`bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba`](https://github.com/Kapitech-Agency/kapitech-ams/commit/bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba).
- Changed file: `src/pages/admin/AdminSettings.tsx`.
- Root cause: the desktop backup-history table used `backupHealthy` from the newest server-wide checks for every row, while the mobile cards already used per-snapshot `backupVerificationFor(backup)`. Historical snapshots could therefore be presented as verified without evidence.
- Correction: the desktop row now uses `<StatusBadge {...backupVerificationFor(backup)} />`. The latest snapshot shows positive verification only when freshness, integrity and restore verification are all true. Historical rows remain explicitly unverified when the API returns only timestamps and sizes.
- Validation on this exact source SHA: [AMS CI 39239473226 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39239473226); [AMS Quality Gate 39239473547 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39239473547). The existing regression test remains enabled; it was not weakened.
- Scope review: frontend presentation only. No API, database, backend, backup infrastructure, auth, permission or business-rule changes.
- Remaining acceptance: Stage 5 still requires authenticated permission, error/retry, responsive viewport, keyboard/focus and visual review. No authenticated browser evidence was captured in this source-only environment.
- Next action: continue Stage 4 in the documented module order from the earliest unfinished Dashboard view; first reconcile the current Dashboard source/test slice against its gap-register acceptance criteria. Keep the Stage 5 user sign-off gate intact.


## Stage 4 source/test checkpoint · Dashboard money availability · 19 October 2026

- Application commit: [`febd4f42a18718230dd2ebccec5b975a0083ef68`](https://github.com/Kapitech-Agency/kapitech-ams/commit/febd4f42a18718230dd2ebccec5b975a0083ef68).
- Changed files: `src/components/admin/GlobalExecutiveDashboard.tsx`; `tests/dashboard-metric-truthfulness.test.ts`.
- Confirmed defect: the shared Dashboard money formatter converted non-finite input into numeric zero. An invalid source-derived amount could therefore look like a valid zero in Overview and Analytics.
- Correction: `formatLiveMoney` returns an em dash for non-finite numeric input and formats valid numbers without coercion. A genuine `0` remains a currency-formatted zero. The regression test asserts the unavailable fallback and rejects the unsafe zero coercion.
- Exact-SHA validation: [AMS CI 39240238235 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39240238235); [AMS Quality Gate 39240238176 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39240238176). Typecheck, regression tests and production build passed; CI verification and production build passed.
- Scope review: source-backed frontend display behavior and regression coverage only. No data source, calculation formula, API, database, Finance workflow, permission, backend or business rule was changed.
- Remaining acceptance: Dashboard Overview, Performance and Analytics remain partially complete until authenticated role/direct-route, chart/data, keyboard, responsive and visual review. No browser screenshot or live viewport test was captured here.
- Next action: continue Stage 4 in the documented order with the earliest concrete Inbox/Projects source-level gap. Follow-up and routing surfaces without canonical contracts remain unavailable rather than simulated.


## Stage 4 source/test checkpoint · Inbox register semantics · 19 October 2026

- Application commit: [`87b53aa61cd7c973869da73ef4273c8cb5f4cc7e`](https://github.com/Kapitech-Agency/kapitech-ams/commit/87b53aa61cd7c973869da73ef4273c8cb5f4cc7e).
- Changed files: `src/pages/admin/AdminInbox.tsx`; `tests/ams-nine-module-workspace-regression.test.ts`.
- Confirmed presentation gap: the general Inbox register used “Services / Specialty” and “Budget / Experience” headings for all inbound views even though Careers records are excluded from Inbox. The split-view empty state said “New inquiries and applications will appear here”, incorrectly implying applicants are managed there.
- Correction: generic Inbox table headings consistently read “Requested Services” and “Budget” with Indonesian equivalents; empty copy now refers only to new inquiries. The ingress filter excluding `type === 'career'`, and link/legacy route to Website CMS → Careers → Applicants, remain unchanged.
- Regression coverage: added `Inbox table labels and empty state reflect the inquiry-only workspace` in `tests/ams-nine-module-workspace-regression.test.ts`. It checks the rendered table's semantic labels, rejects the mixed experience/applicant wording, and guards the Careers source filter.
- Exact-SHA validation: [AMS Quality Gate 39245274582 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39245274582); [AMS CI 39245274600 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39245274600). The Quality Gate typecheck, regression tests and production build passed; AMS CI's typecheck, regression/security tests, production build and production HTTP smoke test passed.
- Scope review: copy/presentation and frontend regression coverage only. No API, route, applicant source, server permission, data model, or business workflow changed.
- Remaining acceptance: Stage 5 still needs authenticated keyboard, selected-view/browser history, responsive and visual review. No authenticated screenshot/viewport test was performed in this source-only session.
- Next action: source-audit residual applicant-specific branches in Inbox, remove only branches proven unreachable from the filtered record set, and preserve CMS Careers as the single applicant workspace.


## Stage 4 source/test checkpoint · Inbox applicant-presentation ownership · 19 October 2026

- Application commit: [`926291d005bbdef2c1e06779d28145d230606ddf`](https://github.com/Kapitech-Agency/kapitech-ams/commit/926291d005bbdef2c1e06779d28145d230606ddf).
- Changed files: `src/pages/admin/AdminInbox.tsx`; `tests/ams-nine-module-workspace-regression.test.ts`.
- Source audit established that every detail selection originates from `submissions` and that `refreshInbox` filters `type === 'career'` before setting that state. Selection resynchronization also reads only from the filtered state. Applicant-only cards/links/status choices in Inbox were therefore unreachable from supported Inbox records.
- Cleanup removed applicant type branches and resume/portfolio/LinkedIn fields from Inbox search, triage and detail rendering; removed career status badges/options, interview/screening action, and an unused detail-tab state; simplified starred and split-list identity to contact/inquiry fields. It did not alter the API, record type, status persistence, permissions, CMS applicant presentation or route compatibility.
- Preserved the canonical boundary: exactly one `item.type !== 'career'` ingress filter remains; the direct link to `/admin/cms/careers?tab=applicants` and the legacy redirect remain. The CMS Careers Applicants register/detail continues to own applicants.
- Regression test: `Inbox keeps Careers applicant presentation in the canonical CMS workspace`. The assertion uses optional whitespace around `===` to guard against formatting variants and checks the source filter, compatibility route and CMS Applicants view.
- Exact-SHA validation: AMS Quality Gate [39246295800 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39246295800); AMS CI [39246295872 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39246295872). Typecheck, regression tests, security regression tests, production build and production HTTP smoke test passed.
- Remaining acceptance: Inbox stays partially complete until Stage 5 validates roles, keyboard, selected-record behavior, responsive widths and browser history in an authorized browser session. No screenshot or authenticated runtime check was performed here.
- Next action: Stage 4 continues to Projects → Overview/Registry, using current-source evidence and the main-content specification; preserve unsupported Project Controls/Campaigns as unavailable until canonical models exist.


## Stage 4 source/test checkpoint · Tasks local calendar defaults · 19 October 2026

- Application commit: [`af65907022d9973b3859145e0971bf22a6caf343`](https://github.com/Kapitech-Agency/kapitech-ams/commit/af65907022d9973b3859145e0971bf22a6caf343).
- Changed files: `src/components/admin/TasksWorkspace.tsx`; `tests/task-workspace-data-parity-regression.test.ts`.
- Confirmed defect: both initial task form state and the New Task action used `new Date().toISOString().slice(0, 10)`. Since an HTML date input expects a local calendar date, UTC string truncation can produce the previous/next-looking date for users around local midnight outside UTC.
- Correction: `formatLocalDateInputValue` now composes `YYYY-MM-DD` from local `getFullYear()`, `getMonth()` and `getDate()`; both existing default call sites use the same helper. Existing due dates, due/overdue calculations, API fields, permissions, and task status behavior were not changed.
- Regression coverage: test `Tasks & Execution task-date defaults use the local calendar rather than UTC date slicing` asserts local date-component formatting, both creation defaults, and absence of the UTC ISO-slice default.
- Exact-SHA validation: AMS CI [39246972955 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39246972955); AMS Quality Gate [39246972981 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39246972981). Typecheck, regression tests, security regression tests, production build and production HTTP smoke test passed.
- Scope review: task form frontend default and regression coverage only. No server/API/data model/persistence/auth/permissions/workflow behavior changed.
- Remaining acceptance: Tasks & Execution is still partially complete pending authorized browser review of board/list filters, task detail, keyboard actions, responsive viewports and actual local date input behavior. No authenticated screenshot or viewport session was performed here.
- Next action: continue Stage 4 in Projects → Planning & Delivery, keeping unavailable canonical scope/QA/review/revision features disabled.



## Stage 4 source/test checkpoint · Planning worksheet selection context · 19 October 2026

- Application/source commit: [`fd1ea4fb51d0497d2c19e2cbd7cb0a8344f66b83`](https://github.com/Kapitech-Agency/kapitech-ams/commit/fd1ea4fb51d0497d2c19e2cbd7cb0a8344f66b83).
- Final passing test/check commit: [`444b9891b33e7891567341711dfa9a8d29866bf4`](https://github.com/Kapitech-Agency/kapitech-ams/commit/444b9891b33e7891567341711dfa9a8d29866bf4).
- Changed application source: `src/pages/admin/AdminProjects.tsx`. Tests updated in `tests/projects-module-regression.test.ts` and `tests/ams-sidebar-subnavigation.test.ts`.
- Confirmed defect: active Project Brief, Milestones and Timeline tab links were hard-coded URLs omitting `planningProject`. Switching worksheet after choosing a project could fall back to the default project and display another record.
- Correction: `planningWorksheetHref` clones the current URL query, preserves the selected project and other query state, then sets `projects=planning-delivery` and the desired `planningView`. Only the three active worksheets use this helper; unsupported worksheets remain disabled.
- Regression coverage: `Planning & Delivery preserves the selected project across active worksheet tabs` checks helper behavior and three targets. The existing sidebar test now asserts this helper instead of literal query strings while preserving default-view normalization and unavailable-worksheet assertions.
- Validation: Quality Gate [39247714368 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39247714368); AMS CI [39247714349 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39247714349) on exact commit `444b9891b33e7891567341711dfa9a8d29866bf4`. Typecheck, regression tests, security regression tests, production build and production HTTP smoke test passed.
- Failed prior validation: Quality Gate [39247451029](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39247451029) and AMS CI [39247450983](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39247450983) failed on the earlier source commit because of the obsolete static-URL assertion. The assertion was repaired and both workflows passed on the follow-up test commit. No failing test was suppressed.
- Remaining acceptance: browser verification of project selection retained across back/forward and direct tab links is still pending Stage 5. No authenticated browser screenshot was captured here.
- Next action: proceed to Clients → Directory as the next Stage 4 active workspace in canonical order; keep onboarding checklist and other absent records truthful and disabled until canonical models exist.


## Stage 4 source/test checkpoint · Clients Directory CSV correctness · 19 October 2026

- Final source/test commit: [`aba169fe8dcc493c1a404cc534ebd630f8e74fbf`](https://github.com/Kapitech-Agency/kapitech-ams/commit/aba169fe8dcc493c1a404cc534ebd630f8e74fbf).
- Changed paths: `src/pages/admin/AdminClients.tsx`; `tests/ams-nine-module-workspace-regression.test.ts`.
- Confirmed export defects: client billed value was previously coerced with `totalSpend || 0` even though the visible cards/table distinguish unrecorded values. The CSV column was generically labeled `Total Spend`, did not identify the canonical currency, and its row/BOM literals were double-escaped in source.
- Corrections: missing or non-finite `totalSpend` exports as an empty cell; valid numeric zero remains zero; header now reads `Cumulative billed value (IDR)`; row strings use actual `\n` line separators; Blob prefix uses the actual `\ufeff` BOM. No billing values, Finance formulas, canonical source data or persistence semantics changed.
- Regression coverage: `Client directory CSV preserves unrecorded billed values and identifies the stored currency` checks finite/missing semantics, no zero fallback, IDR label, actual newline and BOM source expressions.
- Exact-SHA evidence: AMS Quality Gate [39248843922 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39248843922), AMS CI [39248843929 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39248843929). Typecheck, regression tests, security regression tests, production build and production HTTP smoke test passed.
- Earlier validation attempt: Quality Gate [39248547110](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39248547110) failed only because the test slice ended before the BOM expression. The boundary was corrected in `aba169fe8dcc493c1a404cc534ebd630f8e74fbf`, the assertion remains active, and both workflows now pass. No regression assertion was removed.
- Remaining acceptance: Clients Directory stays partially complete pending authenticated data/role checks, search/filter/clear/sort/export behavior, responsive and keyboard/viewport review. No authenticated browser screenshot or actual downloaded CSV was tested interactively here.
- Next action: continue Stage 4 through Clients Directory and Onboarding using supported canonical fields, then Agreements. Keep unavailable checklist/history capabilities explicitly blocked by missing canonical records.



## Stage 4 source/test checkpoint · Clients scope-aware export and Onboarding copy · 19 October 2026

- Final passing application/test SHA: [`1ae8209b39ff65cc7cbb6c302ddc9815efc5720c`](https://github.com/Kapitech-Agency/kapitech-ams/commit/1ae8209b39ff65cc7cbb6c302ddc9815efc5720c).
- Changed files: `src/pages/admin/AdminClients.tsx`; `tests/ams-nine-module-workspace-regression.test.ts`.
- Export source defect: the visible header button had an inline CSV implementation separate from the existing `handleExport` function. The visible path always downloaded `kapitech-client-directory.csv`, even when the button was labeled `Export Onboarding Accounts`; its columns also included billed value for lead records. The older handler carried the correct dynamic filename but was not used by the visible action.
- Correction: the visible button now invokes the single handler. Lead/onboarding export contains record identity, company/contact and profile fields only; it does not include billed value or spend-cap fields. Directory export retains its prior project/billed-value/SLA spend columns, represents missing/non-finite billed value as blank, preserves genuine zero and names the billed-value currency (IDR). Both paths use escaped CSV cells, actual newline separators, UTF-8 BOM, the proper scope-specific filename and scope-specific export feedback.
- Test: `Client exports use one scope-aware CSV handler and preserve missing billed values` checks the visible event binding, scope-specific columns/filenames, non-finite/missing amount behavior, preserved Directory SLA columns, newline/BOM semantics and toast copy.
- Onboarding copy correction: the page heading no longer promises to “confirm onboarding readiness” when the canonical checklist, required-document evidence and kickoff-readiness records are unavailable. It now promises review of prospective accounts and recorded profile details. Existing disclosure that profile completeness is not onboarding approval remains. Regression coverage checks both the heading and this non-approval boundary.
- Prior CI finding: commit [`e8d44f3b2730d300a53e0fe33319ad1a75d4a6af`](https://github.com/Kapitech-Agency/kapitech-ams/commit/e8d44f3b2730d300a53e0fe33319ad1a75d4a6af) failed the existing Client detail regression because Directory's SLA columns were temporarily absent. They were restored in [`dcca9f2c9f0d242968423e37d63b2bb4a86d3ad5`](https://github.com/Kapitech-Agency/kapitech-ams/commit/dcca9f2c9f0d242968423e37d63b2bb4a86d3ad5) without weakening the test.
- Exact-SHA validation on `1ae8209b39ff65cc7cbb6c302ddc9815efc5720c`: AMS CI [39251017014 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39251017014); Quality Gate [39251017167 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39251017167). Typecheck, regression tests, security regression tests, production build and production HTTP smoke test passed.
- Scope: frontend CSV presentation/action binding and explanatory copy plus source regression coverage. No Finance calculations, canonical client values, API/database/authentication/permissions or onboarding workflow/persistence were changed.
- Remaining: Clients Directory and Onboarding remain partially complete pending Stage 5 authenticated browser/keyboard/responsive review and actual download verification. Checklist, Required Documents and Kickoff Readiness remain unavailable because canonical records/evidence/ownership are not implemented. No authenticated browser or downloaded CSV was tested interactively.
- Next action: continue Stage 4 at Clients → Agreements. Start with the Retainers form's date default, which still uses UTC ISO slicing for a local date input; preserve existing renewal state/business rules.



## Stage 4 source/test checkpoint · Retainer local renewal-date default · 19 October 2026

- Application/test SHA: [`7a76c4120dbb0ecce35e3964e9d8b91a9146de43`](https://github.com/Kapitech-Agency/kapitech-ams/commit/7a76c4120dbb0ecce35e3964e9d8b91a9146de43).
- Changed files: `src/pages/admin/AdminClientRetainers.tsx`, new `src/lib/retainerDateDefaults.ts`, and new `tests/client-retainer-date-defaults.test.ts`.
- Confirmed defect: initial retainer form state and the editor reset both used `toISOString().slice(0, 10)` to create a date-only input default, so the UTC date string could differ from the user's current local calendar date near midnight.
- Correction: `getDefaultRetainerRenewalDate` adds one month using the existing local `Date.setMonth` rule, then composes `YYYY-MM-DD` from local year/month/day components. It is used at both original call sites. No persisted retainer values or renewal rules were changed.
- Regression: the new test sets the timezone to `Asia/Jakarta` and checks the boundary at 00:30 local when UTC is still on the previous day. A second test confirms both create and reset paths use the helper and rejects the previous UTC-slicing expression.
- Exact-SHA validation: AMS CI [39251981965 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39251981965); Quality Gate [39251982047 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39251982047). Typecheck, regression tests, security regression tests, production build and production HTTP smoke test passed.
- Scope: Retainer frontend date input defaults and tests only. No API, persistence, permission, retainer state, Finance calculation or renewal terms were changed.
- Remaining: browser validation of create/edit defaults and Renewal Schedule timing remains in Stage 5. No authenticated browser session was used.
- Next action: source-audit Renewal Schedule's `renewalDays` date-only comparison for local calendar boundaries and add a deterministic regression before changing any behavior.



## Stage 4 source/test checkpoint · Renewal Schedule calendar-day semantics · 19 October 2026

- Final passing source/test SHA: [`4e57c8b4b8d7b3aabf3393b48499627db2015b40`](https://github.com/Kapitech-Agency/kapitech-ams/commit/4e57c8b4b8d7b3aabf3393b48499627db2015b40).
- Application source changes are in [`88d7804dfc2d9f73fd2afeb16bd33d08b54519a1`](https://github.com/Kapitech-Agency/kapitech-ams/commit/88d7804dfc2d9f73fd2afeb16bd33d08b54519a1); the final test correction is `4e57c8b4b8d7b3aabf3393b48499627db2015b40`.
- Changed files: `src/pages/admin/AdminClientRetainers.tsx`, `src/lib/retainerDateDefaults.ts`, `tests/client-retainer-date-defaults.test.ts`, and `tests/admin-pages-jsx-regression.test.ts`.
- Confirmed defect: `renewalDays` subtracted `Date.now()` from parsed date-only UTC midnight, which could classify today as one day away near Jakarta midnight. Date-only rendering through `new Date(value)` also shifted the displayed date in negative UTC offsets. Invalid date values could be treated as warning values due JavaScript `null <= 30` coercion.
- Correction: shared helpers validate exact `YYYY-MM-DD` values, compare the target and current local calendar day using date ordinals, and render the date at local noon. Renewal summary includes valid dates on day 0 through day 30 inclusive. Invalid dates are excluded and don't get the warning style. Existing one-month-forward `Date.setMonth` defaults were preserved in the earlier retainer date commit.
- Tests: `tests/client-retainer-date-defaults.test.ts` covers dates -1, 0, 1, 30 and 31 days in Asia/Jakarta, invalid inputs and Honolulu formatting. The responsive-retainer regression now verifies the shared helper, invalid-date guard, both card/table styles and 0–30 day summary filtering.
- The first CI attempt on `88d7804dfc2d9f73fd2afeb16bd33d08b54519a1` failed because an existing test insisted on the old expression. It was updated to assert the new equivalent behavior without dropping the check. Both workflows passed on exact SHA `4e57c8b4b8d7b3aabf3393b48499627db2015b40`: AMS CI [39253706334](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39253706334); Quality Gate [39253706326](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39253706326).
- Scope: date-only client-retainer frontend presentation and regression coverage only; no API, database, state transition, retainer pricing or permission changes.
- Remaining: authenticated browser checks for due-today/day-30 filter and display are pending Stage 5. No browser download/screenshot or viewport interaction was performed.
- Next action: continue Clients → Agreements audit for any remaining source-backed Contracts & SOWs presentation issues, then Client Service & Health. Keep Contract History unavailable until a canonical event/version record exists.

## Stage 4 structural slice · Projects Planning & Delivery / Project Brief · 19 October 2026

### View structure contract

- Module/workspace/worksheet: Projects → Planning & Delivery → Project Brief.
- Requirement IDs: VIEW-PROJECTS-PLANNING; cross-module roll-up AMS-MAIN-CONTENT-STRUCTURE-001.
- User task: review the selected project's recorded brief and context, then open supported task execution without confusing project identity across worksheets.
- Key question: which project is being planned, what source-backed delivery information is recorded, and what action can the user take next?
- Before composition: module header → Planning worksheet tabs → selected-project selector/context row → eight summary tiles → brief notes/team/action → separate “Planning data coverage” card repeating available and unavailable record information.
- Structural mismatch: project scope selector appeared after the worksheet tabs; the primary brief was fragmented into equal-weight tiles and notes, and a second coverage card competed with the actual brief.
- After composition: module header → selected-project scope control → Planning worksheet tabs → one dominant Project Brief surface. Recorded notes and supported task-execution action lead on the primary side; client/owner/service/status/dates/progress/milestone count/team are grouped in a context definition list; unsupported scope/deliverable/QA/client review/revision record ownership is stated inline.
- Primary surface: structured detail, appropriate because the current Project Brief is source-backed project context and recorded notes, not a supported editorial persistence workflow or chart.
- Source-owned fields/actions preserved: client, owner, service, status, start date, target deadline, recorded progress, recorded milestone count, team members, notes, worksheet query state, selected-project query state and Open task execution.
- Protected semantics: existing project source, routes/query keys, selection validation, permissions, API contract, backend, database and task/project workflows remain unchanged. No sample records or fabricated workflow actions added.
- Data states: existing loading, source-unavailable, no-project and invalid-selected-project paths remain in place; empty notes stays explicit. Unsupported worksheets remain unavailable.
- Before/after sketch: BEFORE Header → Tabs → Selector → 8 tiles → Notes/Team → Duplicate Coverage Panel. AFTER Header → Selected Project Scope → Tabs → Notes-first Project Brief + Source-backed Context → Inline unsupported-record boundary + task execution.
- Supporting bug fixes: none claimed in this slice. This is structural work.
- Changed paths: src/pages/admin/AdminProjects.tsx in [6bfc86133d6b76488f9013e1e88a5825e2c3c051](https://github.com/Kapitech-Agency/kapitech-ams/commit/6bfc86133d6b76488f9013e1e88a5825e2c3c051); tests/projects-module-regression.test.ts in [5bc5d601ae95090b14ef7a43cfd3ea52e7a08aa5](https://github.com/Kapitech-Agency/kapitech-ams/commit/5bc5d601ae95090b14ef7a43cfd3ea52e7a08aa5).
- Regression evidence: “Planning & Delivery puts project scope before worksheet tabs and makes the brief the primary workspace.” It asserts scope-before-tabs, tabs-before-brief, notes before supporting context, essential source-backed fields, inline unsupported-record boundary, project query retention, and absence of duplicate coverage/context panels.
- Exact-SHA CI: [AMS CI 39261177958 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39261177958) and [AMS Quality Gate 39261178055 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39261178055) on 5bc5d601ae95090b14ef7a43cfd3ea52e7a08aa5. Typecheck, regression/security tests, PostgreSQL integration/migration checks, dependency audit, production build, packaged-migration verification and production HTTP smoke test passed.
- Browser evidence: not captured. No authorized authenticated browser session was available in this execution; rendered visual, role, keyboard/touch and viewport acceptance remain unverified for Stage 5.
- Requirement status: PARTIALLY COMPLETE, not complete. Milestones and Timeline still need worksheet-by-worksheet structural acceptance; scope/deliverables, deliverable tracking, quality review, client review and revision history remain unavailable because their canonical records/workflows are absent. Campaigns and Project Controls remain unavailable while canonical models/permissions are absent.
- Next authorized action: inspect and structurally redesign Projects → Project Resources (VIEW-PROJECTS-RESOURCES) against its allocation/task assignment surfaces. Keep unsupported campaign/control workspaces explicitly unavailable and do not switch to unrelated Clients defects.
- Stage 5 user sign-off: PENDING and required before broad Stage 6+ work.

## Stage 4 structural slice · Projects Project Resources · 19 October 2026

### View structure contract

- Module/workspace: Projects → Project Resources.
- Requirement IDs: VIEW-PROJECTS-RESOURCES; cross-module roll-up AMS-MAIN-CONTENT-STRUCTURE-001.
- Primary task: inspect the selected project's explicit allocation records, who belongs to the project team, and which canonical tasks have assignees.
- Key question: what resource allocation is recorded for this project, and how are roster membership and task assignment represented without implying cross-project availability?
- Before composition: panel header with project selector → four KPI tiles → two-column team roster and allocation list → task assignment table → separate capacity/availability panel.
- Structural mismatch: KPI tiles repeated counts for records shown below and displaced the allocation register. The team list also joined allocation/task context to the roster by display-name matching, which could suggest a canonical identity relationship not established by this project view.
- After composition: selected-project scope row → primary full-width Recorded Resource Allocation register → subordinate Project Team and Project Task Assignments surfaces → compact Capacity and Availability boundary note linking authoritative data to Team & Resources/Time Tracking.
- Primary surface: allocation register, because the view is for project-scoped allocation dates/effort and the records are explicit, source-backed entries.
- Essential data preserved: project selector, allocation person, recorded allocation percentage, start/end period, team member/owner names, task title/assignee/status/priority/due date.
- Actions: changing selected project updates the existing resourcesProject query. Existing invalid selection path does not silently choose a different record; recovery selector and clear-query action remain.
- Data semantics: allocation records, roster membership and tasks render as separate canonical lists. No name-only cross-source join; no inferred availability, hours or overload percentages. Financial/HR fields remain untouched.
- States: existing loading/unavailable/no-project/invalid-project states remain. Empty allocation and task states remain distinct. Responsive table horizontal scrolling stays local to each register.
- Before/after sketch: BEFORE Scope buried in header action → KPI strip → roster + allocation in split card → task table → capacity card. AFTER Selected project scope → Allocation register → Team roster + Task assignments → Inline capacity/source boundary.
- Supporting fixes: removal of display-name-matched counts/percentages from the roster is a source-ownership presentation correction within the structural refactor, not a new business rule.
- Changed paths: src/pages/admin/AdminProjects.tsx in [108523df2c52e2d109280befc9791b23163a3c60](https://github.com/Kapitech-Agency/kapitech-ams/commit/108523df2c52e2d109280befc9791b23163a3c60); tests/projects-module-regression.test.ts in [17e9b6a7f5a77548c5d27327c1cbd71f3b1eeac1](https://github.com/Kapitech-Agency/kapitech-ams/commit/17e9b6a7f5a77548c5d27327c1cbd71f3b1eeac1).
- Regression evidence: “Project Resources leads with allocations and keeps capacity semantics separate.” Tests assert project scope precedes allocation, allocation precedes roster/task registers, duplicate KPIs are absent, capacity limitation is explicit, invalid selection recovery remains, and empty/unavailable states remain.
- Exact-SHA CI: [AMS CI 39262004358 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39262004358) and [AMS Quality Gate 39262004291 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39262004291) on 17e9b6a7f5a77548c5d27327c1cbd71f3b1eeac1. Typecheck, regression tests, PostgreSQL integration/migration checks, security regression tests, dependency audit, production build, packaged migration verification and production HTTP smoke test passed.
- Browser evidence: not captured; actual rendered responsive, keyboard/touch and role review remains in Stage 5.
- Requirement status: PARTIALLY COMPLETE pending browser review and cross-module source parity; do not imply people availability/capacity from the project records.
- Next action: complete Planning & Delivery → Milestones structural acceptance in the canonical worksheet sequence, then Timeline; move to other Projects workspaces only after these source-backed planning worksheets have an explicit status.
- Stage 5 user sign-off: PENDING.

## Stage 4 worksheet checkpoint · Projects Planning & Delivery / Milestones and Timeline · 19 October 2026

### Milestones worksheet contract

- Requirement: VIEW-PROJECTS-PLANNING within AMS-MAIN-CONTENT-STRUCTURE-001.
- Source contract: ProjectMilestone in src/lib/projectStore.ts stores id, optional slug, title, dueDate, completed and optional paymentTrigger. It has no milestone-specific owner or dependency fields.
- Composition assessed: selected-project scope → worksheet tabs → Milestones panel with completion count → one title/date/status register and explicit empty state.
- Structural finding: the existing register already matches the supported list/timeline target, so no unnecessary layout rewrite was made. The description identifies the missing owner/dependency fields in [aa13bccaf19a37bf76418cbb76f32f7a75fcf1e4](https://github.com/Kapitech-Agency/kapitech-ams/commit/aa13bccaf19a37bf76418cbb76f32f7a75fcf1e4).
- Regression: [14f2c96db2ca3ddf40bc46a0b6fe157b36031768](https://github.com/Kapitech-Agency/kapitech-ams/commit/14f2c96db2ca3ddf40bc46a0b6fe157b36031768) checks source-backed fields, empty state and missing-field boundary. AMS CI [39262877900](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39262877900) and Quality Gate [39262877908](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39262877908) passed.

### Timeline worksheet contract

- Requirement: VIEW-PROJECTS-PLANNING.
- Primary question: what is the chronological sequence of the selected project's recorded task and milestone due dates, and what date context is available?
- Before: Timeline header → three KPI-style cards for project start/deadline/progress → milestone-only vertical list.
- Mismatch: the metric strip competed with the main work surface and task due dates from canonical task records were missing from the timeline.
- After: project scope and tabs → one chronological list of recorded milestone and task due dates → supporting project-date context (start, target deadline, progress, dated-record counts) → explicit dependency-tracking limitation.
- Source-owned content: milestone title/dueDate/completed; task title/dueDate/status; project startDate/targetEndDate/progressPercent. Items without recorded due dates are not placed on a dated timeline.
- Implementation: [aacc1f60e63144ef616eba0fe446129c71d7db13](https://github.com/Kapitech-Agency/kapitech-ams/commit/aacc1f60e63144ef616eba0fe446129c71d7db13) makes the chronological register the main surface. It does not add sample data, dependencies or duration estimates.
- Regression: [cc9c46c82f7a5e514371683142b2c4725e28e8c2](https://github.com/Kapitech-Agency/kapitech-ams/commit/cc9c46c82f7a5e514371683142b2c4725e28e8c2) checks scope/tabs, chronological source fields, list/context order, empty state and dependency boundary. The initial test attempt at 9d37056 had an incorrect JSX fragment boundary selector; it was corrected in cc9c46c. Exact-SHA AMS CI [39263459463](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39263459463) and Quality Gate [39263459363](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39263459363) both passed.
- Status: PARTIALLY COMPLETE. Stage 5 browser/reflow/keyboard review remains outstanding; scope/deliverables, QA, client review, revision history and dependency links require canonical records/workflows.

### Projects blocker verification

- Content & Campaigns remains disabled in src/lib/amsModuleSubnavigation.ts. No canonical project-campaign model or project-to-CMS content relationship was verified.
- Project Resources is source/test-verified for project-scoped allocation, roster and task presentation. Cross-project capacity, actual time and overload remain owned by Team & Resources / Time Tracking.
- Project Controls remains disabled. The legacy budget view does not establish canonical risk/change/control records or transitions.
- Next action: begin Clients → Directory from its actual source and requirement contract. Do not replace structural work with unrelated date/export fixes.

## Stage 4 structural slice · Clients Directory and Client 360 · 19 October 2026

### View structure contract

- Module/workspace/requirement: Clients → Directory and selected Client 360; `VIEW-CLIENTS-DIRECTORY`.
- Primary task: find and distinguish canonical client accounts, understand recorded service/renewal context, and inspect the operational records linked to the selected client.
- Key question: who is this client, what retainer/service context is recorded, and which delivery, finance, Inbox and document records are explicitly linked and permitted for the current role?
- Source/model constraints: the current `AgencyClient` record includes a primary contact and retainer/service fields, but does not establish a separate multi-contact record set or relationship-owner field. New related lists use explicit relationships only: project/invoice `clientId`, document `relatedEntity='Client'` plus `relatedId`, and lead `convertedClientId`. No company-name match is used to manufacture these links.
- Before composition: header/actions → search and supported filters → canonical Directory register → repeated KPI strip below the register → selected-client drawer with contract/retainer context, interaction history and profile data. Service/renewal context was less visible within the register, while the selected Client 360 did not present the linked Projects, Finance invoices, Documents and converted Inbox records as one coherent section.
- After composition: header/actions → search/status/industry/location filters → canonical account register with recorded retainer/service context on both desktop rows and mobile cards → selected Client 360 detail. The duplicated KPI strip and its unused aggregation are removed. The detail surface keeps existing contract history and client interactions, then adds four linked-record registers: Projects & delivery, Inbox history, Finance references and Documents. Lists have bounded display counts with truthful totals, explicit loading/empty/error/restricted states and routes into existing workspaces.
- Structural rationale: a client register is a record-finding surface, not a second dashboard; the selected Client 360 is the appropriate place for multi-module context, with linked records grouped by canonical source and existing access permission.
- Source and permission constraints preserved: project references require `canManageProjects` or `canManageKanbanTasks`; finance references require `canViewFinancials`; Inbox conversion history requires `canManageCrm`; Documents use the existing workspace's `canManageProjects`, `canManageCrm` or `canAccessServerAndApi` scope. Existing APIs, contracts, roles, relationships, row actions, filters, routes and CSV semantics are unchanged.
- Unsupported capability boundaries: no new client owner, extra contact master, contract versioning, onboarding approval, retainer usage calculation or source relationship is invented. Contact remains the canonical primary-contact view until a real multi-contact model exists. Client Onboarding Checklist/Required Documents/Kickoff Readiness remain blocked by missing canonical evidence/ownership records.
- States: linked lists distinguish loading, empty, error and restricted. Errors provide an explicit retry; absent relationships render a specific empty state rather than guessed matches. No linked Inbox internal notes or browser/session details are presented.
- Before/after sketch: BEFORE Header → Filters → Register → duplicate KPI strip → Drawer (contracts/interactions/profile). AFTER Header → Filters → Register with service context → Drawer (existing contract and interaction history → linked Projects/Inbox/Finance/Documents → profile/contact information).
- Changed source: [6241a898af357470a585b236370ca70fc49e0c8e](https://github.com/Kapitech-Agency/kapitech-ams/commit/6241a898af357470a585b236370ca70fc49e0c8e) (register-first/service context), [b28f83a386e7614269b28ce0321611dae0436906](https://github.com/Kapitech-Agency/kapitech-ams/commit/b28f83a386e7614269b28ce0321611dae0436906) (remove unused KPI calculation), [cb2764b0b579769bee9e07577396b3073f9da01f](https://github.com/Kapitech-Agency/kapitech-ams/commit/cb2764b0b579769bee9e07577396b3073f9da01f) (linked record panels), [80976fa3241f3ffc9116a6769975db9d18750a7a](https://github.com/Kapitech-Agency/kapitech-ams/commit/80976fa3241f3ffc9116a6769975db9d18750a7a) and [088a3cadd4260f89a040f876daf2404e602cb1c5](https://github.com/Kapitech-Agency/kapitech-ams/commit/088a3cadd4260f89a040f876daf2404e602cb1c5) (typing and permission alignment). Existing regression expectations were updated in [6bcdc4b284e5959556a1a3d79fc68f7cb55038e9](https://github.com/Kapitech-Agency/kapitech-ams/commit/6bcdc4b284e5959556a1a3d79fc68f7cb55038e9), [a7d5ee2d02cb38e7ce2b073c3da9b83c967ccaa4](https://github.com/Kapitech-Agency/kapitech-ams/commit/a7d5ee2d02cb38e7ce2b073c3da9b83c967ccaa4) and [6517fbcfd65dc31103bf298cd844c33886d545b3](https://github.com/Kapitech-Agency/kapitech-ams/commit/6517fbcfd65dc31103bf298cd844c33886d545b3). Final focused Client 360 regressions and source/test state are included in exact SHA `088a3cadd4260f89a040f876daf2404e602cb1c5`.
- Verification evidence: [AMS Quality Gate 39269329548 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39269329548) and [AMS CI 39269329377 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39269329377) on the exact SHA. Typecheck, regression suite, production build, PostgreSQL migration/integration, security regression, dependency audit, packaged migration and production HTTP smoke test all passed.
- Browser evidence: NOT CAPTURED. No authenticated browser session was available for actual drawer, role, reflow, keyboard/touch or downloaded CSV verification. Stage 5 remains outstanding.
- Requirement status: PARTIALLY COMPLETE pending browser/accessibility acceptance. No visual or role-compliance claim is inferred from CI.
- Next authorized action: continue to Clients → Onboarding and assess Checklist, Required Documents and Kickoff Readiness against canonical records. Keep unsupported onboarding workflows unavailable; do not create checklist state or fake approval behavior.

## Stage 4 structural slice · Clients Onboarding Lead register · 19 October 2026

- Requirement: `VIEW-CLIENTS-ONBOARDING`. Primary task is reviewing prospective client records and knowing how Kapitech can contact each lead, not assessing mature-client billing or spend-cap status.
- Before: shared Clients header → disabled onboarding tabs → truthful source-boundary note → generic filters → common Directory card/table with billing and spend-cap fields.
- After: scope-aware Onboarding search → source-boundary note → distinct Lead register/card identity → primary contact, email, phone/WhatsApp, industry/location, Lead status, record-created and last-updated dates → existing profile/detail actions.
- Source contract: uses the existing `AgencyClient` record in `lead` status and only its canonical contact/industry/location/status/createdAt/updatedAt fields. Lead CSV and creation defaults remain unchanged. Directory-only billing/spend-cap columns still render for the normal Directory scope.
- Structural implementation: [5918ab4833b7f6c1bba939618bb0ce618f172f61](https://github.com/Kapitech-Agency/kapitech-ams/commit/5918ab4833b7f6c1bba939618bb0ce618f172f61). The responsive/accessibility test contract was aligned to the scope-specific named register and card labels in [dd7121e95ab4489b79a4f93b6a5838049a034b51](https://github.com/Kapitech-Agency/kapitech-ams/commit/dd7121e95ab4489b79a4f93b6a5838049a034b51) and [952203b70ead573edf994d7a53e51ab46eab12fe](https://github.com/Kapitech-Agency/kapitech-ams/commit/952203b70ead573edf994d7a53e51ab46eab12fe).
- Initial validation exposed two stale regression assumptions: fixed Directory-only scroll region label, then fixed static mobile card slug. Final exact-SHA validation passed: [Quality Gate 39273628833](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39273628833) and [AMS CI 39273628957](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39273628957), on `952203b70ead573edf994d7a53e51ab46eab12fe`. Typecheck, tests, production build, migrations, security regression, PostgreSQL integration, dependency audit, packaged migration and production HTTP smoke test passed.
- Missing canonical data: repository search found no `onboardingChecklist`, `requiredDocumentStatus`, `ClientOnboardingRequirement`, `kickoffReadiness` or onboarding owner/due-date record model. Checklist, Required Documents and Kickoff Readiness remain unavailable. Profile-readiness stays profile completeness only.
- Browser evidence: not captured; authenticated role, direct URL/history, actual CSV download, keyboard/touch and responsive viewport checks remain Stage 5.
- Status: PARTIALLY COMPLETE. Next canonical workspace is Clients → Agreements. Review Contracts & SOWs, Retainers & Service Commitments, Renewal Schedule and Contract History against current canonical sources.

## Stage 4 structural slice · Clients Onboarding / Lead register · 19 October 2026

### View structure contract

- Requirement: `VIEW-CLIENTS-ONBOARDING`; module/workspace: Clients → Onboarding, implemented through the existing Lead scope in `AdminClients`.
- Primary task: review prospective client accounts and see which contact/profile fields are present before continuing onboarding conversations.
- Key question: which lead is this, how can we reach its primary contact, and which basic account details are recorded or missing?
- Current source contract: `AgencyClient` provides company/name/email/phone/industry/location/status/createdAt/updatedAt/notes plus mature-client financial/service fields. There are no verified checklist entities, required-document verification records, readiness owner or kickoff approval records.
- Before composition: shared search with generic Client labels → Lead/status scope in filter footer → one responsive register rendered with Directory columns/cards, including billed value and spend-cap indicators on Lead records.
- Structural mismatch: the Lead scope looked like a filtered Directory. It surfaced mature-client billing/spend-cap data while contactability and onboarding-specific dates were less prominent; search/table labels did not identify the Lead queue clearly.
- After composition: contextual onboarding scope → Lead-specific search → Lead register/cards with company/added date, primary contact, email/phone, industry/location, lifecycle status and last-updated context. Mature-client billing/spend-cap columns remain in Directory scope. Existing Lead creation, CSV export, query scope, Lead-applicable filters, profile drawer and permissions remain.
- Primary surface: a record register. An evidence checklist or readiness score is unsupported by the current model.
- Data/permission constraints: reuse current `AgencyClient` records and roles. No contact entity, checklist simulation, approval state, API or workflow transition was added.
- States: existing loading and source-unavailable behavior remains. Lead-specific empty/matching copy now explains when no Lead exists. The separate source-boundary disclosure still says profile completeness is not onboarding approval.
- Before/after sketch: BEFORE generic search/filter → shared Directory columns/cards for Leads and mature accounts → financial/spend-cap values on Lead rows. AFTER Lead-specific search/scope → contact-first profile register → existing record actions; financial indicators stay in Directory.
- Changed source: [5918ab4833b7f6c1bba939618bb0ce618f172f61](https://github.com/Kapitech-Agency/kapitech-ams/commit/5918ab4833b7f6c1bba939618bb0ce618f172f61).
- Test corrections: initial CI exposed stale JSX expectations; follow-up commits [dd7121e95ab4489b79a4f93b6a5838049a034b51](https://github.com/Kapitech-Agency/kapitech-ams/commit/dd7121e95ab4489b79a4f93b6a5838049a034b51) and [952203b70ead573edf994d7a53e51ab46eab12fe](https://github.com/Kapitech-Agency/kapitech-ams/commit/952203b70ead573edf994d7a53e51ab46eab12fe) aligned the contract assertions to the actual named register and Lead mobile card. No test was deleted or bypassed.
- Exact-SHA validation: [AMS Quality Gate 39273628833 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39273628833) and [AMS CI 39273628957 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39273628957) on `952203b70ead573edf994d7a53e51ab46eab12fe`. Typecheck, regression tests, production build, security regression, PostgreSQL integration/migrations, dependency audit, packaged migrations and production HTTP smoke test passed.
- Browser evidence: NOT CAPTURED. No authenticated visual/keyboard/reflow/role session or actual downloaded CSV inspection was performed; Stage 5 remains outstanding.
- Requirement status: PARTIALLY COMPLETE. The Lead register structure is implemented; Checklist, Required Documents and Kickoff Readiness remain unavailable until their records, evidence links, ownership and approval transitions exist.
- Next authorized action: proceed to Clients → Agreements → Contracts & SOWs; compare the current primary register with §4.10 and the worksheet role matrix. Preserve the separate blocker for contract version/event history.

## Stage 4 structural slice · Clients Agreements / Contracts & SOWs · 19 October 2026

### View structure contract

- Requirement: `VIEW-CLIENTS-AGREEMENTS`; workspace: Clients → Agreements → Contracts & SOWs.
- Primary task: inspect a saved agreement's current commercial scope and obligations, verify client/project linkage and terms, and open the saved agreement document when a link exists.
- Key question: what agreement is this, which client/project and lifecycle state does it belong to, what terms/deliverables are recorded, and where is the saved document?
- Source model: the existing `ClientContract` record in `src/pages/admin/AdminContracts.tsx` has contract number/title/type/status, client/project references/names, value/currency, start/end/renewal dates, HTTPS document URL, scope, deliverables, payment terms, notes and timestamps. No new API, contract identity, version entity or transition was introduced.
- Before composition: shared card/table register with client/project, lifecycle dates/status/value and workflow actions; detail of scope/deliverables/payment terms was mainly available in the edit-draft form and could be confused with a mutation flow. No explicit read-only selected-agreement detail workspace existed.
- After composition: same canonical register and supported workflow controls → explicit `View details` action on mobile cards and desktop table → read-only agreement detail Drawer. The drawer groups identity/status/client/project/value/dates, scope/deliverables/payment terms, saved-document link and a clear source boundary for Contract History.
- Primary surface: keep the existing register primary because it is the list/search/filter/status-action surface. The new Drawer is the supporting selected-record workspace for terms/document inspection; it does not replace the register.
- Important fields and states: missing scope, deliverables, payment terms, and document URL each display “not recorded”/specific empty copy. Date fields reuse the existing date formatter. Lifecycle status uses the canonical status label/tone.
- Actions/permissions preserved: selected view is read-only. Existing draft editing, lifecycle transitions, draft deletion, expiry/termination confirmations and permission checks remain the only mutation routes. Edit draft is offered from the detail drawer only for draft/in-review states and only when the existing `canManage` permission allows it.
- Source boundary: Contract History remains unavailable. This detail view explicitly shows the latest saved fields and current lifecycle state; it does not reconstruct historic terms from `updatedAt` or claim a version history. Renewal and retainer history continue to come from their existing source views.
- Before/after sketch: BEFORE Register/cards/table → workflow actions; term details only through the editor. AFTER Register/cards/table → View details → selected agreement summary → scope/deliverables/payment terms → saved document + history boundary. Existing register ordering and mutations remain unchanged.
- Changed paths: `src/pages/admin/AdminContracts.tsx` in [ba76a9a3f9f9e8e261d5eea6100264cf87c5777b](https://github.com/Kapitech-Agency/kapitech-ams/commit/ba76a9a3f9f9e8e261d5eea6100264cf87c5777b); `tests/ams-nine-module-workspace-regression.test.ts` in [d0109ce94a1a9d6d2cd854771c9be4c9c8545e0c](https://github.com/Kapitech-Agency/kapitech-ams/commit/d0109ce94a1a9d6d2cd854771c9be4c9c8545e0c).
- Regression evidence: “Contracts & SOWs exposes saved agreement details without simulating Contract History” verifies the drawer follows the card/desktop register, selected-record fields use current model values, empty terms/document states remain explicit, and the detail drawer adds no contract mutation endpoint.
- Exact-SHA validation: AMS Quality Gate [39275162228 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39275162228) and AMS CI [39275162214 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39275162214), both on `d0109ce94a1a9d6d2cd854771c9be4c9c8545e0c`. Typecheck, regression tests, production build, PostgreSQL migrations/integration, security regression, dependency audit, packaged-migration verification and production HTTP smoke test passed.
- Browser evidence: NOT CAPTURED. No authorized authenticated browser session was available to validate actual Drawer appearance, keyboard operation, roles or viewport/reflow.
- Requirement status: PARTIALLY COMPLETE pending Stage 5 review and remaining Agreement worksheets. Contract History stays unavailable until canonical version/event history is established.
- Next action: continue to Clients → Agreements → Retainers & Service Commitments; inspect existing source and history/capacity caveats before deciding whether the register structure needs a material change. Renewal Schedule follows afterward.

## Stage 4 structural slice · Clients Agreements / Retainers & Service Commitments · 19 October 2026

### View structure contract

- Requirement: `VIEW-CLIENTS-AGREEMENTS`; worksheet: Clients → Agreements → Retainers & Service Commitments.
- Primary task: inspect each active retainer's recorded terms, hours and renewal date while understanding which values can be calculated safely.
- Key question: which terms and hour values are actually stored, when is renewal due, and is there a valid basis for utilization/remaining hours?
- Source contract: records come from the existing `AgencyClient` model via `api.clients.getAll()`; saves still use `api.clients.update()`. No verified service-scope model, retainer-period entity, carryover rule or canonical Time Logs reconciliation was introduced. An existing warning identifies used hours as a saved Client Directory field.
- Before: warning → filters → register whose mapper defaulted missing monthly value, commitment/used hours, overage rate, tier and cycle to zero or a plausible default → progress calculated with `Math.max(1, committedHours)` → aggregate KPI strip → four extra burn/near-cap/average-overage/source cards.
- Mismatch: missing values could read as explicit zero/defaults, and absent usage denominator could show a green status/progress. Burn and health summaries were duplicated below the register.
- After: source/reconciliation boundary → search/cycle/tier/health filters (including Usage unavailable) → responsive register with field-presence states and utilization only when commitment is recorded and positive and used hours are recorded → remaining hours or hours above commitment when calculable → one compact KPI strip with missing-source coverage context. The duplicate lower summary grid is removed.
- Data constraints: preserve canonical client fields and existing update path. Missing numbers display as Not recorded; an explicit saved zero remains zero. Incomplete monthly value totals/usage totals are not presented as complete aggregates. Renewal summary explains how many valid renewal dates were found when dates are missing.
- Unsupported fields remain blockers: service scope, billing period, carryover rules and contract version history are not fabricated. No Finance formula, business transition, API or database change was made.
- Regression: “Client Retainers keeps the source-backed register primary and distinguishes missing usage data from zero.” It asserts register hierarchy, missing field flags, null usage, remaining-hour state, reconciliation notice and preserved update path.
- Changed paths: `src/pages/admin/AdminClientRetainers.tsx` and `tests/ams-nine-module-workspace-regression.test.ts` in [72f6702777aefa5264f9de15dbcb72f8c674b9c1](https://github.com/Kapitech-Agency/kapitech-ams/commit/72f6702777aefa5264f9de15dbcb72f8c674b9c1).
- Verification: exact-SHA AMS CI/Quality Gate is **not yet available**. Queries for commit check-runs/statuses and workflow runs returned no check for `72f6702777aefa5264f9de15dbcb72f8c674b9c1`. The prior SHA `4f12689991735c8707059f17eba3d644996b4f22` passed AMS CI [39276355380](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39276355380) and Quality Gate [39276355335](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39276355335), but those checks predate this Retainers change.
- Browser evidence: NOT CAPTURED. Stage 5 role, keyboard, reflow and actual downloaded-report checks remain pending.
- Requirement status: PARTIALLY COMPLETE pending exact-SHA CI and Stage 5 evidence.
- Next action: obtain verifiable typecheck, regression, build and CI evidence for `72f6702777aefa5264f9de15dbcb72f8c674b9c1` before moving to Renewal Schedule.


## Stage 4 structural slice — Team & Resources · Team & Capacity · Team Directory

### View structure contract

- **Requirement:** \`VIEW-TEAM-CAPACITY\`; workspace: Team & Resources → Team & Capacity → Team Directory.
- **Primary task:** find the right internal team member, understand their recorded department/role and linked project assignments, inspect recorded time context, and open the profile or allocation action.
- **Key question:** who is this person, what department/role is actually recorded, which projects link to them, and what time was recorded this week?
- **Current source:** \`src/pages/admin/AdminTeams.tsx\`; current data remains the existing canonical team-member, project and time-log sources. No new source, API, model, or permission policy was added.
- **Before:** the roster field labeled “Pod / Focus” showed the first linked project name or the person's division in the same field; “Allocation status” described current-week time logging relative to a 40-hour reference; “Core skills” combined a role-derived focus category with technology strings from assigned project records; responsive cards repeated those meanings. A four-item KPI strip appended heuristic headcount/engineering/design/operations counts after the directory register.
- **Structural mismatch:** organizational identity was mixed with project names; recorded activity could be mistaken for planned allocation or availability; project technologies could be read as verified individual skills; and heuristic role-category KPIs distracted from the roster without representing canonical department groups.
- **Target composition:** page header and actions → workspace tabs → search plus explicit department/project/time filters → dominant canonical team roster with separate person identity, department/role, linked-project count, current-week recorded-time context, and clearly described role-focus/project-technology context → profile/allocation actions. Responsive cards mirror the same grouping. The heuristic KPI strip is removed.
- **Data semantics:** department and role labels come from the existing team-member record; linked project count remains derived from existing project assignments; “time logged this week” uses existing time records and is compared with the existing 40-hour reference. The UI does not describe this as approved capacity, leave availability, forecast, or actual billable hours.
- **Unsupported scope preserved:** no People Operations records, approved leave calendar, staffing availability, manager hierarchy, or additional individual skill-profile model is invented. Availability & Workload remains unavailable pending its source/policy requirements.
- **Before/after sketch:** BEFORE: search/filter → roster fields mix “Pod / Focus” and “Allocation status” → role-derived tags read like individual skills → heuristic KPI strip. AFTER: filters use their real semantics → register separates department/role, project count and time logged → role-focus/project-technology context is labelled carefully → profile/allocation actions; no heuristic KPI strip.
- **Regression coverage:** “Team Directory prioritizes the roster and separates department, project, and tracked-time context” verifies roster hierarchy, field labels, the explicit 40-hour comparison basis, filter/register order, and removal of heuristic KPI categories/ambiguous labels.
- **Scope:** frontend composition/labels and frontend regression coverage only. No backend/API/database, authorization policy, or canonical business workflow changed.
- **Verification:** targeted regression checks and both CI workflows are required on the exact source/test SHA. Authenticated browser screenshots, keyboard and responsive validation remain Stage 5.
- **Status:** partially complete until exact-SHA checks pass and remaining module/role/browser acceptance is reviewed.
- **Next action:** after CI is verified, continue the next unfinished frontend structural view in canonical module order; do not select an unrelated minor fix.


## Stage 4 structural slice — Team & Resources · Team & Capacity · Capacity Allocation

### View structure contract

- **Requirement:** `VIEW-TEAM-CAPACITY`; workspace: Team & Resources → Team & Capacity → Capacity Allocation.
- **Primary task:** identify saved project-member allocations overlapping the upcoming planning window and understand each recorded percentage, reference hours and date range.
- **Key question:** which person is assigned to which project, at what recorded percentage, and during which dates?
- **Current source:** `src/pages/admin/AdminTeams.tsx`; rows use existing project `resourceAllocations` and the canonical team directory. No new data source or API was added.
- **Before:** a strip of historical time metrics led the view, followed by a per-member weekly time table; upcoming allocations were then aggregated per member/week, hiding individual project/date-range records.
- **Structural mismatch:** historical activity dominated a planning task, and the aggregated forecast obscured which saved allocation contributed to planned workload.
- **Target composition:** search/member/project filters → primary saved allocation register (resource/role, project, allocation percentage, reference hours/week, date range) → secondary historical tracked-time table.
- **Data semantics:** rows come from existing project-member allocations with valid dates overlapping the next four weeks; completed/on-hold projects are excluded. Role/department is read from the existing team directory, with saved member name retained as fallback. Planned hours use the existing 40h/week comparison basis and do not represent approved capacity, availability, leave, billable time or conflict status. Failed/unavailable project source and a valid empty result remain distinct.
- **Before/after sketch:** BEFORE: historical KPI strip → time-history grid → aggregated weekly plans. AFTER: plan filters → individual allocation register with dates → time-history grid as distinct supporting context.
- **Regression coverage:** focused Team resource tests verify hierarchy, source filtering, planning-window inclusion, hours conversion, and unavailable-vs-empty states. Directory and time-source guards remain covered.
- **Scope:** frontend composition and tests only. Existing allocation mutation paths, API/database/schema, auth/RBAC, Finance and business workflows are unchanged.
- **Source/test evidence:** [structural change 07148c26](https://github.com/Kapitech-Agency/kapitech-ams/commit/07148c261bca145dde962f2a93519378f52c6074), [unavailable-state regression 6a5b503d](https://github.com/Kapitech-Agency/kapitech-ams/commit/6a5b503dd9c4e852a2cad8ed54b30efcdb33bb5b), and [workspace-hierarchy regression b082e285](https://github.com/Kapitech-Agency/kapitech-ams/commit/b082e2854f15696d393ac9d15c0c7b8e49ee1a3a). Application/test snapshot SHA: `b082e2854f15696d393ac9d15c0c7b8e49ee1a3a`.
- **Automated verification:** [AMS Quality Gate 39797152426](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39797152426) passed. [AMS CI 39797152441](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39797152441) logs show 762 passed, 0 failed, 20 skipped, PostgreSQL integration 8/8 passed, and successful lint/type-check, migrations, security tests, dependency audit, production build, packaged-migration check and production HTTP smoke test. The Actions API aggregate remained `in_progress` at last query; overall CI conclusion is not verified.
- **Browser evidence:** NOT CAPTURED. Authenticated role-specific screenshots, responsive reflow at required widths, keyboard/focus checks and touch target checks remain Stage 5.
- **Status:** partially complete pending final AMS CI aggregate confirmation and Stage 5 visual/accessibility review.
- **Next action:** re-query workflow aggregate and keep checkpoint current; after validation, continue with the next supported Team & Resources structural view without inventing People Operations or leave/availability workflows.


## Stage 4 structural slice — Team & Resources · Vendors & Freelancers · Directory · 22 October 2026

### View structure contract

- **Requirement:** `VIEW-TEAM-VENDORS`; workspace: Team & Resources → Vendors & Freelancers → Directory.
- **Primary task:** find and manage the canonical provider record using recorded identity, service category, engagement status, verification flag, skills and rate, then open its supported detail/edit workflow.
- **Current source:** `src/pages/admin/AdminVendors.tsx`; uses the existing vendor source and record identity. This slice introduces no new directory, model, endpoint, or business lifecycle.
- **Before:** module header/tabs → status feedback → four-card Vendor snapshot with aggregate counts/rating and mini-trend sequences → search/category/type/status/vetting filters → provider cards → empty state and pagination. The directory also applied the global reporting-period hook to `createdAt || updatedAt`, although the directory had no visible period control. This could silently hide provider master records when the report period changed.
- **Structural mismatch:** the snapshot displaced the register task and used mini-trends without a time-series basis. A global reporting-period preference was also acting as an implicit filter on canonical provider identity.
- **After:** module header/tabs and supported actions → operation feedback → explicit directory search/category/type/status/vetting filters → named “Vendor directory” register heading with a live matching-record count → canonical provider cards → truthful empty/error state and pagination. In embedded Finance contexts, the existing Add Vendor action now sits in the register header.
- **Before/after sketch:** BEFORE: header → KPI snapshot → filters → provider cards. AFTER: header → filters → register heading/count → provider cards. No separate period filter is introduced.
- **Data and behavior preserved:** source-backed provider records, identity, skills/rates/status, existing detail drawer, edit/delete/vetting actions, supported API paths, existing Admin-only Skills & Service Matrix route and permission policy remain unchanged. Vendor bills and payments remain owned by Finance.
- **Unsupported areas:** Contracts & Rates and Engagement Status remain unavailable/disabled. Skills & Service Matrix remains on the existing Admin-only destination. No sourced availability, contract terms, timesheet or supplier finance fields are invented.
- **Regression coverage:** `tests/ams-nine-module-workspace-regression.test.ts` verifies the new filter → register heading → list → pagination hierarchy and rejects the global reporting-period hook or reintroduced KPI snapshot. `tests/admin-pages-jsx-regression.test.ts` checks cross-module hierarchy and the shared detail drawer. `tests/finance-ui-consistency.test.ts` verifies the embedded Add Vendor behavior is preserved.
- **Changed paths:** `src/pages/admin/AdminVendors.tsx`; `tests/ams-nine-module-workspace-regression.test.ts`; `tests/admin-pages-jsx-regression.test.ts`; `tests/finance-ui-consistency.test.ts`. Structural implementation started at [e7a63774](https://github.com/Kapitech-Agency/kapitech-ams/commit/e7a63774395a8f6ef95e19f17a08e0d74ac2ac5b); legacy assertions and embedded action were corrected at [9a596d0d](https://github.com/Kapitech-Agency/kapitech-ams/commit/9a596d0deeafe98c59fe3432879d9092ec9d7c47); final TypeScript assertion-scope correction is [0494f5ee](https://github.com/Kapitech-Agency/kapitech-ams/commit/0494f5ee77284d60abf1de0cc574590e15bd656e).
- **Exact-SHA verification:** [AMS Quality Gate run 39801867733](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39801867733) passed on `0494f5ee77284d60abf1de0cc574590e15bd656e`. [AMS CI run 39801867597](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39801867597) completed successfully on the same SHA. Typecheck, regression tests, production build, migrations, security regression tests, PostgreSQL integration, dependency audit, packaged-migration verification and production HTTP smoke test passed.
- **Browser evidence:** NOT CAPTURED. No authorized authenticated browser session, role-specific screenshot, viewport reflow, keyboard/focus or touch review was available. Stage 5 remains pending.
- **Requirement status:** PARTIALLY COMPLETE. The primary directory structure and source/test checks are verified; Stage 5 role, visual, responsive and accessibility checks remain open. Contracts & Rates and Engagement Status remain unsupported.
- **Next action:** inspect Team & Resources → Time Tracking → Time Logs against its register/view contracts. Preserve the source-backed views if they already satisfy the target; do not introduce My Timesheet or Timesheet Control without a secure personal scope and canonical review lifecycle.


## Stage 4 structural slice — Team & Resources · Time Tracking · Time Logs / Billable & Project views · 22 October 2026

### View structure contract

- **Requirement:** `VIEW-TEAM-TIME`; workspace: Team & Resources → Time Tracking.
- **Primary task:** inspect canonical time entries by reporting period, person and project; review billable classification as recorded; compare project totals without confusing time with invoicing, cost or capacity.
- **Current source:** `src/pages/admin/AdminTimeLogs.tsx` using the existing `api.timeLogs.getAll()` and `api.projects.getAll()` sources. No new API, source store, identity model or review lifecycle was introduced.
- **Before:** page header/worksheet tabs → Billable classification total cards and filter above the ledger, or project total cards above the ledger → canonical register → generic metric strip after the table. There was no explicit person filter and the project filter was limited to the project view. Both mobile and desktop rows displayed an unset billing flag as “Non-billable”.
- **Structural mismatch:** supporting summaries displaced the canonical time-entry register, person/project scope was incomplete, and missing billing classification could be mistaken for a recorded non-billable value.
- **After:** header and supported worksheet tabs → source-backed reporting period/person/project controls plus the relevant billing filter → canonical responsive register/cards and permitted row action → view-specific billable or project breakdowns below the register. The base Time Logs view keeps a single supporting metric strip after the register.
- **Data semantics:** the reporting-period hook continues to filter by recorded log date. Person options derive only from currently available canonical time records, keyed by saved user ID where available. Project options derive from the period/person-scoped records. Billing true/false/unset now displays Billable / Non-billable / Unclassified distinctly; source totals retain those categories. Filter changes reset pagination and do not mutate source records.
- **Behavior preserved:** source reads, supported create/delete endpoints, current permission guards, owner-based delete restrictions, query-addressable supported worksheets, local date defaults, uncertain-mutation recovery, mobile cards, desktop register, and pagination remain intact.
- **Unsupported areas:** My Timesheet and Timesheet Control remain unavailable. No private self-service scope or canonical approval/review lifecycle was invented. Planned capacity, logged hours, invoiced time and recognized cost remain separate concepts.
- **Regression coverage:** `tests/ams-nine-module-workspace-regression.test.ts` asserts view order, scope derivation, summary order and billing state semantics. `tests/admin-pages-jsx-regression.test.ts` verifies responsive register, scope controls and preserved owner-based delete permissions.
- **Changed paths:** `src/pages/admin/AdminTimeLogs.tsx`, `tests/ams-nine-module-workspace-regression.test.ts`, and `tests/admin-pages-jsx-regression.test.ts` in [977c9e1d](https://github.com/Kapitech-Agency/kapitech-ams/commit/977c9e1dcf1a0c3008ae5d168fcf318763f4e086).
- **Exact-SHA verification:** AMS Quality Gate [39808274650](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39808274650) and AMS CI [39808274692](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39808274692) both passed on `977c9e1dcf1a0c3008ae5d168fcf318763f4e086`. Typecheck, regression tests, production build, PostgreSQL migrations/integration, security tests, dependency audit, packaged migration verification and production HTTP smoke test passed.
- **Browser evidence:** NOT CAPTURED. Authenticated role-specific screenshots, responsive viewport, keyboard/focus and touch review remain Stage 5 work.
- **Requirement status:** PARTIALLY COMPLETE. Register hierarchy/scope/filter semantics are source/test verified. Stage 5 visual review remains open; cross-module Finance/retainer propagation remains a later integration acceptance item. My Timesheet and Timesheet Control remain unsupported.
- **Next action:** continue the next supported top-level workspace, Documents → Document Library. Preserve secure object-storage/version ownership and existing file permissions. Do not create duplicate libraries or invent version history.


## Stage 4 structural slice — Documents · Document Library · 22 October 2026

### View structure contract

- **Requirement:** `VIEW-DOCS-LIBRARY`; workspace: Documents → Document Library.
- **Primary task:** find the authorized document, understand its current state and recorded metadata, follow its valid client/project relationship, and use the existing permitted preview/download/delete/upload actions.
- **Current source:** `src/pages/admin/AdminDocuments.tsx`. The canonical list continues to use `api.documents.getAll()` and the existing upload/download/delete paths. No new document source, vault store, ownership entity or version model was introduced.
- **Before:** header/upload action → search/category/sort → private register with status/owner/date/category/relationship → upload dropzone and existing preview/delete dialogs. The filter bar had no explicit status or relationship metadata filtering. Reset detection tracked only search text, and reset did not clear URL-backed category scope.
- **Structural mismatch:** users could not directly narrow the register by recorded readiness or linked-record presence; when a category deep link was active, reset could be hidden or leave that scope intact.
- **After:** header and permitted Upload action → search/category/status/related-record/sort filters → canonical responsive register, visible result count and honest loading/error/empty states → upload dropzone after the register → existing upload/detail/delete dialogs. Status options use the current `readyOf` helper, so external links remain Ready under the existing state contract. Relationship options use saved `relatedEntity` and `relatedId` metadata, not inferred or invented links.
- **Filter reset:** active-filter detection now accounts for search, category, readiness and record-link state. Reset clears those filter dimensions and removes only the `documents` query parameter while preserving unrelated URL parameters. Sorting remains an ordering preference and is not treated as a filter.
- **Security/data behavior preserved:** current canonical API, permission checks, source error/401/403 handling, last-known-good rows for transient failures, authenticated download path behavior, private document storage contract, record links, file-size/type validation and mutation confirmations remain unchanged.
- **Unsupported areas:** the current UI model does not establish full version chronology/restore history. No new version UI, storage provider, public file URL, or duplicate category library was added. Actual durable object-storage readiness and document-object recovery remain separate operational acceptance requirements.
- **Regression coverage:** `tests/ams-nine-module-workspace-regression.test.ts` verifies filter-before-register/upload-after-register hierarchy, source-backed status/relationship filters, active reset state, URL category removal and continued absence of global reporting-period scoping.
- **Changed paths:** `src/pages/admin/AdminDocuments.tsx` and `tests/ams-nine-module-workspace-regression.test.ts`. Structural source/test implementation [9e1c43f5](https://github.com/Kapitech-Agency/kapitech-ams/commit/9e1c43f5ff7565a1eb8c7fa4ae47248fd2265807); corrected the multi-line filter-bar assertion at [11f1402d](https://github.com/Kapitech-Agency/kapitech-ams/commit/11f1402dc1df439fdf89c14bf0f292bb8bcfb7df).
- **Exact-SHA verification:** AMS Quality Gate [39809646327 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39809646327) and AMS CI [39809646405 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39809646405), both on `11f1402dc1df439fdf89c14bf0f292bb8bcfb7df`. Typecheck, regression tests, production build, migrations, security regression tests, PostgreSQL integration, dependency audit, packaged migration verification and production HTTP smoke test passed.
- **Browser evidence:** NOT CAPTURED. Authenticated document/version access, actual storage/preview failures, direct category query behavior, responsive reflow, keyboard/focus and permission-role rendering remain Stage 5 checks.
- **Requirement status:** PARTIALLY COMPLETE. Explicit metadata filters, reset and hierarchy are source/test verified. Full version chronology and operational storage/recovery evidence remain unsupported/unverified.
- **Next action:** continue to Website CMS using the per-workspace structural contract and actual saved CMS state. Start with the next supported content register/workspace in canonical order; preserve public-route, save/publication-state semantics and applicant data boundaries.


## Stage 4 structural slice — Website CMS · Services · Publication state filter · 22 October 2026

### View structure contract

- **Requirement:** `VIEW-CMS-SERVICES`; workspace: Website CMS → Services.
- **Primary task:** find and edit the canonical service record, narrow the list by its saved publication state and category, and understand whether the CMS flag is saved or public output has been independently verified.
- **Current source:** `src/pages/admin/AdminCmsServices.tsx`; records still come from `api.cms.getServices()` and saves/publication toggles use the existing CMS mutation endpoints. No endpoint, record identity, or publication lifecycle was added.
- **Before:** page header with copy describing offerings as “live” → search and category chips → count and service register with Published/Draft labels → existing detail/editor drawer. There was no dedicated status filter although publication state was visible per row/card. Reset cleared only search and category.
- **Structural mismatch:** editors had to inspect or paginate the list to isolate draft or published records. Header copy could also read as if every managed CMS record were already live.
- **After:** status-accurate header → search/category/publication-state controls → one canonical service register, visible filtered count and existing mobile/table surfaces → selected service detail/editor. Published/Drafts filter and Reset sit within the existing shared filter bar before the register.
- **Data semantics:** “Published” uses `service.isPublished === true`, matching the existing service public-response contract. Other values remain in the Draft filter, consistent with the current CMS list presentation and explicit publication field. A successful mutation still confirms only the saved CMS flag; it does not prove the live page/cache refreshed.
- **Behavior preserved:** existing editor, rich service fields, record-ID update/delete behavior, publication toggle, validation, access policy, and save/error feedback remain. No service taxonomy change was made; no Mobile App service was added.
- **Regression:** `tests/cms-services-workflow-regression.test.ts` now asserts search/category/publication filter hierarchy, saved-flag semantics, reset completeness, and truthful CMS/public-output wording.
- **Changed paths:** `src/pages/admin/AdminCmsServices.tsx` and `tests/cms-services-workflow-regression.test.ts` in [b682f09e](https://github.com/Kapitech-Agency/kapitech-ams/commit/b682f09eb5a41b89d12215c0488e4c1228b0888a).
- **Exact-SHA verification:** AMS Quality Gate [39810591135 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810591135) and AMS CI [39810590666 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810590666) on `b682f09eb5a41b89d12215c0488e4c1228b0888a`. Typecheck, regression tests, production build, migrations, security tests, PostgreSQL integration, dependency audit and production HTTP smoke test passed.
- **Browser evidence:** NOT CAPTURED. Stage 5 must verify state filtering, edit/save, actual public `/services` output, permission role, keyboard/focus and responsive layout.
- **Requirement status:** PARTIALLY COMPLETE pending Stage 5 and public output verification.
- **Next action:** continue to Case Studies, then proceed in CMS order to Insights after checking its actual content/state contract.


## Stage 4 structural slice — Website CMS · Case Studies · Publication state filter · 22 October 2026

### View structure contract

- **Requirement:** `VIEW-CMS-CASES`; workspace: Website CMS → Case Studies.
- **Primary task:** locate the correct case study by content search and pillar, distinguish the saved CMS visibility state, and edit/preview the same canonical record.
- **Current source:** `src/pages/admin/AdminCmsProjects.tsx`; record loading, save/toggle/delete, existing detail/preview tabs and public `/work` filtering remain unchanged.
- **Before:** header/Add Case Study → search and pillar filter → filtered count and case-study register → preview/editor. Publication state appeared on records and could be toggled, but there was no Published/Drafts filter and Reset left the list scoping incomplete.
- **Structural mismatch:** editors could not quickly isolate drafts for editorial review or published records for content audit while retaining the existing pillar/search context.
- **After:** header and supported Add action → search, pillar and Published/Drafts filters → filtered count → canonical case-study card/table register → existing preview/editor. Reset now clears all three filter dimensions, and the empty state mentions publication scope.
- **Legacy-state semantics:** the current normalizer treats a missing `isPublished` flag as published for legacy case studies. The filter preserves that contract: Published is `isPublished !== false` and Drafts is `isPublished === false`. New templates continue to default to draft. No records are migrated or modified by filtering.
- **Behavior preserved:** public `/work` filtering, save/edit/toggle/delete APIs, CMS record IDs, media/editor fields, preview tabs and truthful status feedback remain. Mutation feedback confirms saved CMS state and still asks the editor to verify actual public output.
- **Regression:** `tests/ams-nine-module-workspace-regression.test.ts` verifies filters-before-register, saved flag semantics including legacy published records, reset and updated empty-state guidance.
- **Changed paths:** `src/pages/admin/AdminCmsProjects.tsx` and `tests/ams-nine-module-workspace-regression.test.ts` in [4d975a0a](https://github.com/Kapitech-Agency/kapitech-ams/commit/4d975a0a1da92df5e2871fdc38a71eeb0ac2775d).
- **Exact-SHA verification:** AMS Quality Gate [39810998385 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810998385) and AMS CI [39810997918 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810997918) on `4d975a0a1da92df5e2871fdc38a71eeb0ac2775d`. Typecheck, regression tests, production build, migrations, security tests, PostgreSQL integration, dependency audit and production HTTP smoke test passed.
- **Browser evidence:** NOT CAPTURED. Stage 5 must verify filter/pillar interactions, save/preview, media, actual public `/work` output, permission role, keyboard/focus and responsive layout.
- **Requirement status:** PARTIALLY COMPLETE pending Stage 5 and actual public visibility verification.
- **Next action:** proceed to Website CMS → Insights, checking the current register/filters/editor against the content-state specification before choosing another source-backed structural change.


## Stage 4 structural slice — Website CMS · Insights · Full editorial filter reset · 22 October 2026

### View structure contract

- **Requirement:** `VIEW-CMS-INSIGHTS`; workspace: Website CMS → Insights.
- **Primary task:** find editorial content by search, language, status, category, author and featured state; edit the same canonical article and distinguish saved CMS status from independently verified public visibility.
- **Current source:** `src/pages/admin/AdminCmsInsights.tsx`; the paginated register continues to query `api.cms.getInsights()` with the existing source-backed filter parameters.
- **Before:** header/Create action → search and five source-backed controls → status notice → result count and register/editorial preview. The filters were present but there was no one-step reset for combined search/language/status/category/author/featured scope.
- **Structural mismatch:** editors had to reset several dropdowns individually and clear search separately to return to the complete editorial queue.
- **After:** header/Create action → search and existing source-backed filters → localized Reset filters action → status notice → result count and canonical register. Reset clears all six filter dimensions and returns pagination to page one. It is disabled only when all dimensions are already neutral.
- **Data and workflow preserved:** request sequencing guards, server pagination, canonical taxonomy/author options, article CRUD, language variants, content block ordering, preview/edit and saved-publication feedback are unchanged. Reset clears frontend filter state only; it does not modify editorial records or publication state.
- **Regression:** `tests/ams-nine-module-workspace-regression.test.ts` verifies filter-before-register order, the reset control's position relative to notices/register, clearing all filter fields, neutral disabled state, and continued use of the existing Insights API.
- **Changed paths:** `src/pages/admin/AdminCmsInsights.tsx` and `tests/ams-nine-module-workspace-regression.test.ts` in [c0abd3a2](https://github.com/Kapitech-Agency/kapitech-ams/commit/c0abd3a211e293d9e359c40b29eec12cc851f420).
- **Exact-SHA verification:** AMS Quality Gate [39811959165 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39811959165) and AMS CI [39811959406 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39811959406) on `c0abd3a211e293d9e359c40b29eec12cc851f420`. Typecheck, regression tests, production build, migrations, security tests, PostgreSQL integration, dependency audit and production HTTP smoke test passed.
- **Browser evidence:** NOT CAPTURED. Stage 5 still needs authorized direct-route/translation checks, actual public `/insights` rendering/media, publishing failure/recovery, responsive layout and keyboard/focus review.
- **Requirement status:** PARTIALLY COMPLETE. The reset control and filter/register hierarchy are source/test verified. Actual public output and Stage 5 review remain open.
- **Next action:** continue to Website CMS → Testimonials and inspect the current search/publication-state control composition against the same canonical register requirements.


## Stage 4 structural slice — Website CMS · Testimonials · Publication-state register filter · 23 October 2026

### View structure contract

- **Requirement:** `VIEW-CMS-TESTIMONIALS`; workspace: Website CMS → Testimonials.
- **Primary task:** locate testimonials by attribution or quote, isolate records by saved CMS publication state, edit the canonical record, and distinguish saved state from independently verified public visibility.
- **Current source:** `src/pages/admin/AdminCmsTestimonials.tsx`; the canonical list still loads through `api.cms.getTestimonials()`. The same record IDs, create/update/delete and publication-toggle calls remain in use.
- **Before:** page header/Add testimonial → text search and Reset → status notice → filtered count → responsive canonical register (cards below 1280 CSS px and table at 1280 CSS px and above) → existing editor drawer.
- **Structural mismatch:** the register showed Published/Draft per record but did not let editors scope the queue to publication state. Editors had to scan or paginate records to isolate drafts or published testimonials.
- **After:** page header/Add testimonial → text search plus publication-state selector and complete Reset → status notice → filtered count → the same responsive canonical register → existing editor drawer. Selecting a state resets pagination to page one; Reset clears both search and publication scope.
- **State semantics:** the existing normalizer uses `item?.isPublished !== false`, so legacy records without the newer flag remain Published while explicit `false` remains Draft. The filter preserves this normalizer and uses the already-normalized record state. No data migration or record update is performed by filtering.
- **Preserved behavior:** searchable author/role/company/location/quote fields; canonical IDs; rating and attribution fields; existing CRUD, drawer, pagination, confirmation and CMS publication mutation; responsive card/table register; loading/error/empty states; API, permission, public route and saved-status feedback.
- **Reference decision:** adapted the existing AMS `CustomSelect` publication-filter pattern from CMS Services. No external template, token, dependency, data store or new workflow was introduced.
- **Regression:** `tests/ams-nine-module-workspace-regression.test.ts` asserts control/register order, state predicate, legacy-state normalization, reset completeness, pagination reset and bilingual state options.
- **Changed source/test paths:** `src/pages/admin/AdminCmsTestimonials.tsx`; `tests/ams-nine-module-workspace-regression.test.ts`. Source patch [62a36021](https://github.com/Kapitech-Agency/kapitech-ams/commit/62a36021267e243cb11b8811b505d8da885b3c93); final source/test validation SHA [7186f3e7](https://github.com/Kapitech-Agency/kapitech-ams/commit/7186f3e7fe4e36f8b7954702a1e23998320082bc).
- **Exact-SHA verification:** AMS Quality Gate [39824956954 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39824956954); AMS CI [39824955735 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39824955735). Typecheck, regression tests, production build, PostgreSQL migrations/integration, security regression tests, dependency audit, packaged-migration verification and production HTTP smoke test passed.
- **Browser evidence:** NOT CAPTURED. Stage 5 still needs authorized editor-role review, publication filter/reset interaction, actual public `/cms/testimonials` output, cache/deployment visibility, rating/quote rendering, keyboard/focus and responsive viewport checks.
- **Requirement status:** PARTIALLY COMPLETE. Filter and register hierarchy are source/test verified. Authenticated visual review and actual public-output visibility remain not verified.
- **Next action:** inspect Website CMS → Careers and verify the Jobs/Applicants/Recruitment History composition against the canonical sources and privacy boundary before selecting the next structural change.


## Stage 4 structural slice — Settings · System Overview · Status/readiness before backup evidence · 23 October 2026

### View structure contract

- **Requirement:** `VIEW-SETTINGS-OVERVIEW`; workspace: Settings → System Overview.
- **Primary task:** assess source-confirmed current system/readiness states, inspect backup history and distinguish snapshot creation from integrity, freshness and restore verification before taking an authorized action.
- **Current source:** `src/pages/admin/AdminSettings.tsx`; status comes from existing server-backed security, backup, notification and production-readiness requests. Role-gated actions remain guarded by `canAccessServer`.
- **Before:** page header and global errors/messages → three source-backed SummaryCards → Recent Production Backups register/cards → System Integrity and readiness gates/reason.
- **Structural mismatch:** the production-readiness gate list and explanatory reason appeared after the main backup evidence register. This placed status/exception context downstream from the records users need to interpret.
- **After:** page header and global errors/messages → source-backed SummaryCards → System Integrity/readiness gates and reason → Recent Production Backups register/cards. The evidence register is now preceded by both current summary state and server readiness context.
- **Primary work surface:** canonical backup evidence register, using the existing desktop table and compact responsive cards at the established breakpoint. Per-snapshot states still distinguish latest verified checks from history where the API supplies no per-snapshot evidence.
- **Preserved contracts:** no API, query/routes, auth/session, permission guards, record source, snapshot creation, integrity action, freshness/restore calculation or security behavior changed. `backupHealthy` still requires integrity valid + freshness true + restore verification true; historical records do not inherit the latest snapshot's verification.
- **Reference decision:** no external UI template was adopted. The change reorders existing AMS sections and adds semantic `data-ams-feature-slug`/slug markers to make the structure testable.
- **Regression:** `tests/admin-settings-module-regression.test.ts` asserts status-summary → System Integrity → backup register order, and preserves evidence-readiness context checks.
- **Changed source/test paths:** `src/pages/admin/AdminSettings.tsx`; `tests/admin-settings-module-regression.test.ts` in [c964f1a7](https://github.com/Kapitech-Agency/kapitech-ams/commit/c964f1a7bc7cc64a35561db0b22dded2a84ec1d7).
- **Exact-SHA validation:** AMS CI [39825954237 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39825954237), including typecheck, migrations, security regression tests, PostgreSQL integration, dependency audit, production build, packaged migrations and production HTTP smoke. Quality Gate job [39825954065](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39825954065) completed typecheck, regression tests and production build successfully; the run-level status still reported `in_progress` at snapshot time.
- **Browser evidence:** NOT CAPTURED. Stage 5 still requires authorized Settings role, source freshness/error/retry behavior, backup actions, responsive card/table layout, focus/keyboard and contrast review.
- **Requirement status:** PARTIALLY COMPLETE. The source/test-verified order is updated; authenticated visual/accessibility acceptance remains open.
- **Next action:** inspect Settings → Audit Log, starting with the available canonical fields and current search/outcome filters. Add only source-backed filters that materially improve the audit register.


## Stage 4 structural slice — Settings · Audit Log · Filter scopes and read-only record detail · 23 October 2026

### View structure contract

- **Requirement:** `VIEW-SETTINGS-AUDIT`; workspace: Settings → Audit Log.
- **Primary task:** narrow the canonical append-only audit history by reporting period, actor, event and outcome; search the fields present on a record; inspect full recorded details and safe operational metadata; export the same scoped result without mutating history.
- **Current source/domain evidence:** frontend `src/pages/admin/AdminSettings.tsx`; current record interface `SecurityAuditLog` in `src/lib/adminAuth.ts` contains `id`, `timestamp`, `action`, `actor`, `ip`, `details` and `severity`. Server response additionally supplies `actorRole` and `userAgent` used in the new detail surface, while chain hashes and arbitrary `metadata` are not rendered.
- **Before:** audit title and free-text search + outcome + CSV controls shared one horizontal header row → read-only desktop table/mobile cards → pagination. Search already covered actor/action/details/IP and the selected shared reporting period constrained timestamps, but there was no independent actor/event scope or selected-record detail review.
- **After:** audit title → separate responsive filter bar (text search, actor, event, outcome, Reset, Export CSV, global time-scope hint) → existing status/error feedback → canonical responsive audit register → read-only selected-event drawer.
- **Filters:** actor and event options come only from loaded audit records. Actor and event scopes combine with the existing global `matchesDate(log.timestamp)` scope, text search, and outcome state. Reset clears page-local filters, not the shared reporting period. Export continues to use the resulting `filteredLogs` list.
- **Target-field limitation:** the current canonical frontend audit record and existing response do not expose a dedicated structured target/resource field. Do not create a target selector by guessing from action names. Text search can find target references where the server recorded them in `details`; a dedicated target filter remains blocked on a future approved canonical model/API change and is not part of this frontend-only slice.
- **Detail review:** a selected event opens a read-only drawer with timestamp, actor, recorded role if present, action, severity, IP, user-agent and recorded details. It deliberately omits chain hashes, previous hashes and arbitrary metadata payloads. Existing CSV formula neutralization, pagination clamping, error/retry semantics and permission-gated audit route are unchanged.
- **Regression:** `tests/admin-settings-module-regression.test.ts` checks filter/register hierarchy, source-backed options, actor/event predicates, global time scope, Reset, detail actions, safe field exposure and responsive table/card markers.
- **Implementation commits:** initial structural source [d7106446](https://github.com/Kapitech-Agency/kapitech-ams/commit/d71064466d183e4a78ad465d2f69407828bb516f); hierarchy-test correction [57b7bf36](https://github.com/Kapitech-Agency/kapitech-ams/commit/57b7bf36e72b19c8065f75b2b99ff04caa387379); final option typing and green source/test SHA [df1dd2ab](https://github.com/Kapitech-Agency/kapitech-ams/commit/df1dd2aba4804f08f01f4e6576cab6da4c515282).
- **Exact-SHA checks:** AMS Quality Gate [39827295446 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39827295446); AMS CI [39827294995 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39827294995), including typecheck, regression tests, production build, migrations, security tests, PostgreSQL integration, dependency audit, packaged-migration and HTTP smoke tests.
- **Browser evidence:** NOT CAPTURED. Stage 5 requires authorized audit-view role checks, full drawer interaction, focus/keyboard behavior, responsive breakpoints, timestamp/report-period scope and export behavior in a real session.
- **Requirement status:** PARTIALLY COMPLETE. Filter hierarchy and detail affordance are source/test/CI verified; dedicated target filtering is missing from the existing data contract, and browser/accessibility evidence remains open.
- **Next action:** follow the canonical workspace order with Settings → Users & Access. Inspect the existing registry/role policy and lifecycle presentation without changing server permission logic.



## Stage 4 structural slice — Settings · Users & Access · Scoped account register · 23 October 2026

- **Requirement:** `VIEW-SETTINGS-ACCESS`, inside the existing Security section.
- **Task:** find a server-managed account by name/username/email; narrow by canonical role and status; inspect existing MFA/last-login fields.
- **Before:** existing identity/MFA/password sections and account register, but no search/role/status scope.
- **After:** existing self security sections → authorized Admin access accounts header/Add Account → responsive filter bar (search, role, status, Reset, visible/total count) → canonical cards/table → pagination derived from filtered records.
- **Sources:** `AdminAccount[]` from the existing account loader. Search uses only name, username, email; role choices derive from current accounts; status is Active/Suspended.
- **States:** true empty, filtered-no-match and failed-load states are distinct. Stale list warning remains visible if reload fails after a successful load. Changes reset to page one.
- **Security:** account directory stays inside `canManageAdminAccounts`. Add/delete/root protections, server-managed permissions, MFA/password flows and auth policy are unchanged. No unsupported edit-role, impersonation, activation or suspension workflow was added.
- **Regression:** `tests/admin-settings-module-regression.test.ts` covers section/filter/register/pagination order, searchable fields, role/status matching, filtered totals, distinct states and permission guard.
- **Implementation:** [d602c798](https://github.com/Kapitech-Agency/kapitech-ams/commit/d602c7985f10c26aaf05ab501341467135701d07); test correction and final green source/test SHA [f5d4bf9f](https://github.com/Kapitech-Agency/kapitech-ams/commit/f5d4bf9fac2a3d6038ea06c5c5c5c0964c8d617e).
- **Exact-SHA checks:** AMS Quality Gate [39828405506 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39828405506); AMS CI [39828405520 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39828405520), including tests/build/migrations/security/PostgreSQL/dependency and HTTP checks.
- **Browser evidence:** NOT CAPTURED. Stage 5 requires authorized-role, account actions, responsive, keyboard/focus and MFA/password flow review.
- **Requirement status:** PARTIALLY COMPLETE.
- **Next:** Settings → Integrations. Preserve unavailable/unverified Kopra H2H and distinguish configured, available, connected and sync success.



## Stage 4 structural slice — Settings · Integrations · Explicit readiness and provider evidence boundaries · 23 October 2026

- **Requirement:** `VIEW-SETTINGS-INTEGRATIONS`; preserve the existing Overview / Website & CMS Integrations nesting and keep Kopra H2H unavailable.
- **Source contract:** `src/pages/admin/AdminSettings.tsx` calls existing backup, security-status, notification-settings and production-readiness endpoints. A successful notification-settings request establishes settings availability only; the current contracts do not expose provider connectivity, delivery confirmation or content/data sync state.
- **Before:** Database defaulted to a PostgreSQL label when datasource was missing; missing document-storage and backup verification signals rendered as review states; undefined readiness gates rendered warning icons. This conflated unavailable evidence with a failed check.
- **After:** datasource is reported only when supplied by server, otherwise Checking/Not reported; document storage distinguishes Ready, Review required and Checking/Not reported; Backup/DR distinguishes Recovery verified, Review required and Checking/Not verified; health gates use Ready, Review required, Checking or Not reported.
- **Evidence boundary:** a dedicated section says the current integration contract does not report provider connectivity, delivery confirmation or content/data sync status. Website & CMS Settings copy clarifies that its current form manages public metadata, not provider/sync health.
- **Preserved contracts:** no API/backend, permissions, notification settings write, CMS mutation, route, auth or integration was added/enabled. Kopra H2H remains `available: false`. No production datasource or provider state is inferred.
- **Regression:** `tests/admin-settings-module-regression.test.ts` checks source-backed tri-state semantics, evidence-boundary text and existing nested navigation/Kopra disabled status.
- **Implementation:** primary UI [709f5c59](https://github.com/Kapitech-Agency/kapitech-ams/commit/709f5c5921725c2215743ffe5ea3319e464fe060); derived-state ordering fix [0f5408ac](https://github.com/Kapitech-Agency/kapitech-ams/commit/0f5408ac66ea1848dadb2b1833b2ef4ff533274a); regression assertion corrections and final green source/test SHA [e80b9c11](https://github.com/Kapitech-Agency/kapitech-ams/commit/e80b9c119f528714ae69314160beafcf97798fd7).
- **Exact-SHA validation:** AMS Quality Gate [39832811773 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39832811773); AMS CI [39832811706 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39832811706), including typecheck, regression tests, production build, security checks, PostgreSQL integration, dependency audit, migrations and HTTP smoke.
- **Browser evidence:** NOT CAPTURED. Stage 5 still needs authorized-role, actual environment/source, responsive, keyboard/focus and provider-verification review.
- **Requirement status:** PARTIALLY COMPLETE. The current surface describes its available evidence truthfully; provider connection/sync status remains absent from the current contract and intentionally unreported.
- **Next:** Settings → Preferences. Verify current supported values and persistence before changing the main content; avoid introducing shared or authorization-affecting preferences.



## Stage 4 source-contract review — Settings · Preferences · No canonical preference store available · 23 October 2026

- **Requirement:** `VIEW-SETTINGS-PREFERENCES`, as described in the main-content composition matrix.
- **Source reviewed:** `src/pages/admin/AdminSettings.tsx`, `src/lib/amsModuleSubnavigation.ts`, `src/lib/apiClient.ts`, and Sections 4.9/4.10 of `AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md`.
- **Current state:** active `SettingsTab` union contains only `overview`, `audit`, `security`, and `integrations`; the Settings workspace navigation exposes the same four areas. No per-user preference worksheet or dedicated persisted preference model/API was found.
- **Related but different settings:** existing CMS metadata settings and notification settings are shared/application-level settings. They are not evidence of personal display preferences and must not be repurposed as per-user preferences.
- **Decision:** no UI change was made. Do not add non-persisted preference controls, localStorage-only settings, arbitrary values or a new route to satisfy the visual specification. Implement only when the canonical per-user preference contract and permitted fields/save/reset behavior are approved and available.
- **Requirement status:** **MISSING / BLOCKED BY CANONICAL SOURCE CONTRACT**. This is a real requirement gap, not a completed view.
- **Next:** continue Stage 4 in the canonical roadmap order with Dashboard → Overview and verify the existing hierarchy against current data/source contracts before selecting one bounded structural slice.



## Stage 4 structural slice — Dashboard · Overview · Recent activity from the canonical audit source · 23 October 2026

- **Requirement:** VIEW-DASH-OVERVIEW; view composition defined in AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md §4.1.
- **Task:** scan operational exceptions and decision indicators, then inspect a small source-backed set of recent audit activity without confusing summary data with a new record store.
- **Before:** priority exceptions → decision KPIs → quick actions → financial trend/delivery pacing → active project register and team capacity → supporting metrics. The Overview had no recent-activity surface although the existing dashboard API response already returned recentActivity.
- **After:** existing hierarchy preserved; a recent-activity register is added after supporting metrics, following the required content order. It presents at most five server-returned audit entries using action, actor, UTC timestamp and severity, with a link to the canonical Settings → Audit Log view.
- **Source:** api.dashboard.getOverview() and the existing /api/dashboard/overview response. Server already supplies recent activity from the audit-log repository under canViewSecurityAuditLogs; the frontend panel repeats the permission boundary with hasAdminPermission('canViewSecurityAuditLogs').
- **States:** keeps loading, unavailable response and genuine empty list distinct. No placeholders or synthetic audit activity are fabricated.
- **Safe-data boundary:** does not display IP, user-agent, free-form audit details, hashes, prior hashes or arbitrary metadata. The existing response has no structured target/record URL for each event, so the panel links to the canonical Audit Log rather than inventing record-level deep links. The “linked owning record” part of the view contract remains incomplete until a supported canonical target/URL is available.
- **Preserved contracts:** no backend/API, dashboard calculation, audit-log mutation, permission policy, route or source record changed. Performance and Analytics branches remain intact.
- **Regression:** tests/ams-dashboard-overview-hierarchy.test.ts validates that recent activity follows supporting metrics and that visibility, state semantics, visible fields and the Audit Log link are permission/source-backed. A test-only assertion was corrected in [2b926a98](https://github.com/Kapitech-Agency/kapitech-ams/commit/2b926a98c55660fad47c66497e07f034080e805a) after the first test run used the wrong source pattern.
- **Changed paths:** src/components/admin/GlobalExecutiveDashboard.tsx; tests/ams-dashboard-overview-hierarchy.test.ts. UI change [efe57f61](https://github.com/Kapitech-Agency/kapitech-ams/commit/efe57f61caec877d9de94f8e7f42ff14c00034a2); final source/test SHA [2b926a98](https://github.com/Kapitech-Agency/kapitech-ams/commit/2b926a98c55660fad47c66497e07f034080e805a).
- **Exact-SHA verification:** AMS Quality Gate [39834166472 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39834166472); AMS CI [39834166397 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39834166397), including typecheck, regression tests, build, security, PostgreSQL integration, dependency audit, migration packaging and HTTP smoke.
- **Browser evidence:** NOT CAPTURED. Stage 5 still needs authenticated role/direct-route review, viewport screenshots, keyboard/focus validation and confirmation that the panel remains hidden for users without audit permission.
- **Requirement status:** PARTIALLY COMPLETE. Recent activity now appears in the mandated position with truthful source and safe fields. Event-to-owning-record links remain unavailable under the present API shape.
- **Next:** Dashboard → Performance. Review source-backed trend windows/definitions and task/project analysis; preserve the current verified Overview hierarchy.



## Stage 4 structural slice — Dashboard · Performance · Prioritized project attention register · 23 October 2026

- **Requirement:** VIEW-DASH-PERFORMANCE, current composition keeps task analysis and project attention first, followed by tracked time and supporting metrics.
- **Before:** project attention flags were derived from only health OR status (health took precedence if both existed) and the list was sliced to eight in source order, so a populated health field could mask a risk-bearing status and earlier API ordering could hide more urgent projects.
- **After:** one source-backed signal helper combines both health and status text. Attention projects are sorted before truncation: overdue projects first; within a due-date group, earlier dates first; entries with dates before entries lacking dates; then project name/title for deterministic fallback.
- **Scope:** this changes only which canonical projects are prioritized in the existing “Projects needing attention” list. It does not create new project risk states, records or metrics. Existing explicit risk keywords, target/due date fields, labels, count/“Showing 8 of N” copy and source ownership remain.
- **Regression:** tests/ams-dashboard-overview-hierarchy.test.ts checks both health/status signals, overdue-first sorting, date comparison and the eight-record limit.
- **Changed files:** src/components/admin/GlobalExecutiveDashboard.tsx; tests/ams-dashboard-overview-hierarchy.test.ts. Source behavior change [c6289365](https://github.com/Kapitech-Agency/kapitech-ams/commit/c62893650223bb9f80477e6d1fdfa737bfe1df55); final source/test SHA [03872a67](https://github.com/Kapitech-Agency/kapitech-ams/commit/03872a6725fb9338e46a89f2d5a4c38ff3b433fe), after correcting the old source-shape assertion.
- **Exact-SHA validation:** AMS Quality Gate [39836485893 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39836485893); AMS CI [39836486043 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39836486043), including typecheck, regression suite, production build, migrations, security tests, PostgreSQL integration, dependency audit and HTTP smoke.
- **Browser evidence:** NOT CAPTURED. Stage 5 still needs sample projects with mixed status/health, overdue dates, no target date and more than eight exceptions; confirm ordered output under authorized roles and responsive sizes.
- **Requirement status:** PARTIALLY COMPLETE. Source/test/CI evidence confirms risk signal coverage and ordering; live-data and browser/accessibility acceptance remain open.
- **Next:** Dashboard → Analytics. Audit the source of each report/metric and period, unit and drill-down contract before altering any chart.



### Dashboard Analytics structural slice · Stage 4 · 23 October 2026

**View contract**

- Requirement: `VIEW-DASH-ANALYTICS`; route/workspace: existing Dashboard `/admin/dashboard?view=analytics`; source: `src/components/admin/GlobalExecutiveDashboard.tsx`.
- Primary user task: answer a specific agency analysis question and follow it into the canonical source module.
- **Before:** one mixed view placed the invoice/expense trend beside project status, then appended an unscoped KPI strip for total invoices, recorded expenses, receivables and active projects. The period selector lived only in the financial chart header, so the page did not make clear which values were period-based versus current balances/status.
- **After target:** report selector → relevant scope controls → one focused report → exact values/definitions/source period → owning-module drill-down. Reports are Financial movement, Receivables, and Project status.
- Primary surface: financial trend plus exact-value table; receivables balance snapshot; current project-status distribution. The report selector is local UI state only and does not add a route, record, data store, or permission.
- Canonical sources and preserved semantics: existing dashboard invoice, expense and project snapshot only. Invoice buckets use the existing issue-date fallback; expense buckets use the existing recorded-date fallback. Receivables keep the existing invoice balance/paid-amount fallback and excluded statuses. Project grouping keeps the existing status → health → “Not set” fallback. Financial values remain IDR, and invoice/expense difference is not posted profit.
- Actions: Finance Transactions & Cash, Finance Accounts Receivable, and Projects deep links use current AMS destinations. No financial formula, endpoint, API contract, permission, workflow or persistence change.
- States: loading; source unavailable; empty invoice/expense sources (no plotted synthetic-zero trend); empty invoice/project sources; populated and selected-report state. Filtered-empty/stale/pending are not fabricated where no corresponding filter/action exists.
- Responsive/accessibility target: scope controls wrap at narrow widths; the exact-value table provides a non-chart way to inspect values inside contained horizontal scrolling; report buttons expose pressed state and keyboard focus. Authenticated browser, touch, keyboard and viewport evidence remain unverified for Stage 5.
- External reference decision: no external template layout copied. Existing AMS panels, tokens, trend chart and routes are reused; report-first ordering follows the canonical §4.10 contract.
- Regression: update the existing workspace/header source assertions and add `tests/ams-dashboard-analytics-structure.test.ts` for report hierarchy, exact period values, source definitions, empty/unavailable states and drill-downs.
- Structural scope: replaces the mixed side-by-side dashboard composition and trailing mixed-scope metric strip with a single-report work surface. CI evidence is pending until the resulting source/test SHA completes its workflows.
