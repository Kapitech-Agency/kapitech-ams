# Kapitech AMS Structural UX/UI Redesign Progress

Updated: 18 October 2026
Repository: `Kapitech-Agency/kapitech-ams`
Required delivery branch: `main`

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
