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
