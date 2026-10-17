# KAPITECH AMS — FULL UX/UI STRUCTURAL REDESIGN EXECUTION PROMPT

## 1. ROLE AND OBJECTIVE

Act as a principal product designer, enterprise UX architect, information-architecture specialist, accessibility reviewer, and senior frontend engineer.

Repository: `Kapitech-Agency/kapitech-ams`
Production application: `https://ams.kapitech.id`
Delivery branch: `main`

Perform a complete UX/UI structural redesign of Kapitech AMS. This is not visual polish, CSS cleanup alone, or incremental restyling of existing page structures. The current UX/UI is unsatisfactory because page composition, content hierarchy, feature placement, navigation, and the purpose of the main workspace are unclear. Treat these as structural product-design problems.

The user-provided Dashboard reference screenshot is the PRIMARY STRUCTURAL REFERENCE. Study it directly and apply its underlying layout principles throughout the application, adapting them to each module's actual tasks and workflows.

Do not merely copy colors, cards, borders, or button styles. Analyze and apply the reference's composition:
- Persistent, clearly grouped left navigation.
- Compact top navigation/context bar.
- Clear page title and concise explanatory subtitle.
- Primary actions positioned where users expect them.
- Deliberate hierarchy between summary information and the primary workspace.
- Balanced main and supporting columns where appropriate.
- Charts, operational lists, tables, and activity panels arranged by task relevance.
- Consistent spacing, alignment, density, typography, and control placement.
- Clear visual grouping without excessive cards, decorative borders, empty space, or unnecessary chrome.
- A coherent shell that remains stable as users move between modules and tabs.

The reference is a layout and hierarchy model, not a requirement to make every module identical. Each module must use a composition appropriate to its real purpose.

## 2. MANDATORY REPOSITORY GUIDELINES

Before editing, inspect `main`, the complete `docs/` directory, existing agent instructions, and relevant frontend source files.

Read and obey the applicable repository documents, including at minimum, if present:
- `docs/AMS-DESIGN-SYSTEM.md` or the actual canonical design-system file.
- `docs/AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md`.
- `docs/AMS-FRONTEND-ONLY-UXUI-EXECUTION-PROMPT.md`.
- All relevant UX interaction, navigation, table, drawer/modal, responsive, accessibility, and phased-implementation guidelines.
- `AGENTS.md` and any nested agent instructions.

Resolve actual paths rather than assuming a document exists at a particular location. Current canonical repository guidelines are mandatory. Do not invent a replacement design system when one already exists. Use the current AMS design system as the styling foundation and apply it consistently to redesigned structures. If a guideline gap exists, document it and propose only a minimal compatible addition.

## 3. NON-NEGOTIABLE SCOPE BOUNDARY

This is a frontend UX/UI task only.

DO NOT modify:
- Backend or server implementation.
- API contracts, endpoints, request/response shapes, or API integration behavior.
- Database schema, migrations, queries, or persisted data.
- Authentication, session handling, CSRF, MFA/TOTP, or login security logic.
- RBAC, roles, permission rules, authorization checks, or access-control behavior.
- Finance/accounting formulas, totals, balances, reconciliation, tax, invoice calculations, or financial business rules.
- Business logic, validation rules, workflow transitions, status semantics, or audit behavior.
- Production data, integrations, notifications, or file-storage behavior.
- Dependencies or build architecture unless a verified frontend-only blocker requires approval first.
- The public marketing website or its separate repository.

Preserve all existing routes, query parameters, role visibility, permissions, forms, workflow actions, data contracts, and business behavior. Do not replace live data with demo, mock, or fabricated records. Do not remove or disable a feature simply because its current interface is awkward. If a desired UX change appears to require a protected change, retain existing behavior and report the blocker. Do not silently expand scope.

## 4. PHASE 0 — REPOSITORY AND REFERENCE AUDIT

Before editing:
1. Confirm active branch, working tree, latest commit, and unfinished changes. Do not discard or overwrite other work.
2. Read mandatory documentation and map its rules to the codebase.
3. Locate the provided reference screenshot/design artifact in the repository or project context and inspect it directly. If unavailable, report that blocker instead of claiming to have inspected it.
4. Inventory every active route, module, tab, subtab, drawer, modal, menu, table, chart, form, empty state, loading state, and responsive variant.
5. Trace the shared shell: sidebar, topbar, page container, module headers, tabs, scroll containers, global CSS, table styles, overlays, and responsive breakpoints.
6. Identify legacy, duplicated, conflicting, or unused presentation code. Confirm usage before removal.
7. Record current build/test status before changing anything.

Create an audit matrix with:
- Route/module/subtab.
- User's primary job on the page.
- Current content hierarchy and layout problem.
- Misplaced, duplicated, hidden, or hard-to-discover features.
- Desired new structure based on reference principles.
- Existing components that can safely be reused.
- Components/styles that need redesign or removal.
- Design-system and workflow constraints.
- Validation steps and risk level.

Do not stop after producing the audit. Continue to implementation unless a real blocker prevents safe progress.

## 5. PHASE 1 — REDESIGN THE INFORMATION ARCHITECTURE

Create a structural plan for every active module and subtab before implementing page changes.

For every page, answer:
- What is the user's main objective?
- What information must be understood first?
- What is the primary action?
- Which supporting actions belong in the page header, toolbar, row action, drawer, or contextual menu?
- Which information deserves summary metrics, and which belongs in a table, list, chart, timeline, form, or detail view?
- Which filters and controls belong together?
- What should remain visible when scrolling?
- What belongs in the main content column versus a supporting panel?
- How should the layout adapt to smaller screens?
- What useful content should be visible on first load without unnecessary blank gaps?

Required principles:
- Apply the reference's clear shell and content hierarchy.
- Make the main workspace immediately understandable.
- Put the most important content before secondary details.
- Keep related controls and information together.
- Remove redundant page headings, duplicate headers, unnecessary KPI strips, repeated cards, decorative filler, and confusing nested tab bars.
- Do not add metrics or panels merely to fill space.
- Avoid excessive whitespace and overcrowding.
- Preserve existing design-system tokens, component conventions, and brand identity.
- Give every action a clear label and predictable placement.
- Maintain consistent page gutters, content widths, vertical rhythm, and header-to-content spacing.
- Tab changes must not cause arbitrary layout jumps.
- Do not introduce a new design trend, framework, or unrelated visual language.

Include a proposed layout description or concise wireframe for every module and subtab in the audit matrix. Then implement the structural plan. Do not leave this as a document-only exercise.

## 6. PHASE 2 — REDESIGN THE SHARED APPLICATION SHELL

Redesign and validate the shared shell before page-level changes.

### Sidebar
- Preserve valid routes and permission-based visibility.
- Use clear navigation grouping and hierarchy.
- Make active, hover, focus, collapsed, and expanded states distinguishable.
- Prevent labels, icons, badges, and footer controls from colliding or clipping.
- Keep navigation usable on short and narrow viewports.
- Avoid nested scrollbars unless content genuinely needs an independent scroll area.

### Topbar
- Establish consistent height, alignment, spacing, and responsive behavior.
- Group global navigation/context, date/time controls, notifications, and user/account actions logically.
- Prevent wrapping, overlap, unpredictable shrinking, or controls disappearing without a deliberate responsive rule.
- Do not add actions or change existing action behavior.

### Page shell and module header
- Use a stable shared page container with consistent horizontal gutters.
- Align module title, concise description, primary action, and contextual controls.
- Avoid duplicate headers that repeat the module title or waste vertical space.
- Keep tabs and subtabs aligned consistently with the content area.
- Apply consistent layout rules without forcing identical content into every module.

### Shared primitives
Audit and improve shared layout primitives, table wrappers, tab bars, page headers, drawers, modals, menus, form layouts, empty states, and loading states. Fix shared components when genuinely the root cause, then test all consumers. Do not create duplicate components merely to bypass a broken shared primitive unless a distinct use case justifies separation.

## 7. PHASE 3 — REDESIGN EVERY ACTIVE MODULE AND SUBTAB

Use routing and navigation source to discover all active modules. Do not assume the module list from memory.

For every module:
1. Identify real user jobs and data dependencies.
2. Redesign the main page hierarchy.
3. Redesign every tab and subtab, not only the landing tab.
4. Reposition existing actions into their natural task context.
5. Improve tables, filters, search, sorting, pagination, bulk actions, row actions, details, forms, and status indicators as applicable.
6. Make detail views readable and scannable.
7. Align drawers and modals with repository interaction guidelines.
8. Validate empty, loading, error, read-only, permission-restricted, and long-content states where present.
9. Verify existing actions perform exactly the same operations as before.
10. Remove obsolete frontend presentation code only after confirming it is unused and safe to remove.

Use domain-appropriate patterns:
- Operational dashboards: actionable summary, clear priorities, meaningful supporting information.
- Data-heavy workspaces: compact toolbar, understandable filters, readable table/list, clear detail/action flow.
- Finance: clear reporting-period context, readable amounts, meaningful grouping, existing accounting calculations preserved exactly.
- Client and project workspaces: obvious context, status, next action, relevant supporting details.
- Inbox and activity views: clear unread/priority states, understandable list-detail behavior, discoverable primary actions.
- CMS and settings: task-oriented forms, grouped settings, clear save/cancel behavior, visible validation feedback.

These are layout principles, not permission to add or alter business functionality. Use real existing data and behavior only.

## 8. PHASE 4 — GLOBAL SCROLLBAR AND OVERFLOW REPAIR

Scrollbar behavior is a mandatory workstream, not a cosmetic afterthought.

Audit and correct actual causes of scrolling defects, including:
- `html`, `body`, root application containers, and viewport-height calculations.
- Fixed/sticky topbars and sidebars.
- Main content and nested scroll containers.
- Global `overflow-x: hidden` and other clipping rules.
- `scrollbar-gutter` and scrollbar-width styling.
- `::-webkit-scrollbar` rules and custom scrollbar utilities.
- Containers using `overflow: hidden`, `auto`, `scroll`, `clip`, `min-height: 0`, `min-width: 0`, `100vh`, or `100dvh`.
- Flex/grid children that cannot shrink correctly.
- Tables, wide data grids, kanban boards, charts, drawers, modals, dropdowns, and long forms.
- Scroll locking/restoration when overlays open or close.
- Mobile touch scrolling, wheel/trackpad scrolling, keyboard scrolling, and focus movement.
- Components that hide scrollbars even though users need to discover or operate the scroll area.

Required behavior:
1. Provide one intentional, predictable primary vertical scrolling region for the application workspace. Keep the sidebar independently scrollable only when its content requires it.
2. Avoid accidental nested vertical scrollbars. Where nested scrolling is necessary, define boundaries clearly and ensure usability.
3. Keep sidebar and topbar stable when intended by the layout.
4. Keep long content reachable. Never hide overflow to conceal a broken layout.
5. Prevent page-level horizontal overflow at supported viewport widths. For inherently wide tables/boards, confine horizontal scrolling to the relevant content region and make it discoverable.
6. Do not globally remove native scrollbars or use `scrollbar-width: none` on functional content. If a minimal scrollbar style is used, keep it discoverable and operable with visible hover/focus states and adequate contrast.
7. Match scrollbars to the AMS theme with restrained track/thumb contrast. Avoid excessive thickness or bright decorative colors.
8. Use consistent cross-browser styling for Chromium/WebKit and Firefox where practical.
9. Ensure overlays do not leave the background locked after close. Prevent background scrolling when a modal is intentionally modal.
10. Use correct flex/grid sizing (`min-height: 0`, `min-width: 0`, bounded height, appropriate overflow ownership) instead of arbitrary clipping.
11. Do not add `!important` to force a scrollbar or overflow fix. Refactor conflicting rules in a scoped, maintainable way.
12. Verify scrolling with mouse wheel, trackpad, keyboard, touch where possible, and a visible scrollbar.
13. Test short content, long content, wide tables, nested drawers/modals, and small viewports.

Provide a root-cause report listing each conflicting scroll rule, why it caused or risked a problem, what changed, and affected routes/components. A color or width change alone does not count as fixing a scrollbar problem.

## 9. PHASE 5 — VISUAL QUALITY AND GLOBAL UX STANDARDS

Target top-tier enterprise application quality through clarity, consistency, accessibility, efficiency, and reliable behavior. Do not claim compliance with a specific certification unless tested.

### Typography and content
- Follow repository typography tokens and hierarchy.
- Distinguish titles, section headings, labels, descriptions, metadata, values, and helper text.
- Avoid tiny low-contrast metadata and oversized headings that waste workspace.
- Use consistent number formatting and tabular numerals where appropriate.
- Use concise, consistent interface language and sentence case according to product conventions.

### Spacing and layout
- Follow the existing spacing scale.
- Establish predictable content widths, gutters, gaps, and vertical rhythm.
- Avoid arbitrary one-off margins that make sibling pages inconsistent.
- Prevent KPI, chart, table, and form content from becoming cramped or unnecessarily card-heavy.
- Use alignment to establish hierarchy, not decorative borders.

### Color and contrast
- Follow canonical AMS palette and semantic tokens.
- Reserve brand accent for meaningful emphasis and primary actions.
- Use semantic status colors consistently.
- Maintain readable text and visible focus indicators.
- Do not introduce new colors without a design-system reason.

### Interaction and accessibility
- Ensure keyboard operation, visible focus, sensible tab order, and accessible names.
- Do not rely on color alone to communicate status.
- Preserve usable target sizes and clear disabled/loading states.
- Make focus and scroll behavior predictable when overlays open or close.
- Respect reduced-motion preferences when animations exist.
- Avoid unnecessary animation and decorative effects.

### Responsive behavior
Test at minimum: 1440px desktop, 1280px laptop, 1024px compact desktop/tablet landscape, 768px tablet, 390px mobile, and 320px narrow mobile if supported by product requirements.

Do not merely scale down desktop columns. Reflow content deliberately, preserve critical actions, prevent clipped navigation, and make tables/boards usable.

## 10. PHASE 6 — DIRECT-TO-MAIN IMPLEMENTATION

- Work directly on `main`. The user explicitly requires direct-to-main delivery. Do not create feature branches, work branches, or pull requests.
- Before editing, inspect working tree and existing commits. Never overwrite unrelated work.
- Commit and push coherent, validated stages directly to `main` so progress is recoverable and delivery does not depend on a later merge.
- Never reset, force-push, or discard existing commits.
- Keep stages small enough to validate and report.
- After each stage, report files/components changed, the problem addressed, validation performed, and unresolved issues. Then continue automatically.
- Do not stop after the audit, a plan, or a partial redesign.
- Do not claim completion when only the landing page or one representative tab has changed.
- Avoid broad search-and-replace edits that can damage unrelated layouts.
- Do not introduce new dependencies or design frameworks.
- Remove unused legacy CSS, conflicting overrides, temporary debugging code, and duplicate implementations when verified safe.
- Preserve product language conventions; do not introduce inconsistent Indonesian/English copy.
- If work spans sessions, record exact completed stages, remaining routes, validation status, and next action in repository-approved progress documentation, then resume from that checkpoint.

## 11. PHASE 7 — VALIDATION AND REGRESSION

Run actual available checks, including where configured:
- Production build.
- TypeScript/type checks.
- Lint.
- Existing unit/integration tests.
- Route and navigation checks.
- Browser interaction checks where tools and access allow.

Test every active route and tab, not just the dashboard. Verify:
- Layout hierarchy is consistent and understandable.
- Primary actions remain available and retain original behavior.
- Filters, search, tabs, pagination, sorting, forms, drawers, modals, and menus still work.
- Permission-restricted content remains restricted.
- Finance figures and workflows are unchanged.
- No data was replaced with mock content.
- No new console errors or broken assets are introduced.
- No horizontal page overflow, clipped content, hidden essential scrollbar, stuck scroll lock, or unreachable bottom content.
- Layout remains stable when switching tabs and navigating between modules.
- Loading, empty, error, and restricted states remain understandable.

If a check cannot run because credentials, environment, or infrastructure are unavailable, state that limitation explicitly. Never fabricate test results or claim visual browser validation without performing it.

## 12. DEFINITION OF DONE

The task is complete only when:
- Every active module and subtab in the route inventory has been reviewed and structurally redesigned.
- Dashboard reference layout principles are consistently applied and adapted to each module.
- Confusing old page compositions have not merely been reskinned.
- Shared shell, module headers, content gutters, tabs, tables, drawers, modals, and forms follow a coherent system.
- Scrollbar and overflow issues have been traced to their causes and verified across relevant routes.
- Existing routes, permissions, workflows, integrations, data, and business rules remain intact.
- Existing design-system tokens and repository guidelines are respected.
- Build and available checks pass, or remaining blockers are documented clearly.
- All completed work is committed and pushed directly to `main`.
- Final report lists modules/subtabs audited, structural changes, scrollbar root causes and fixes, tests run, commit SHAs, deployment status if verifiable, and remaining risks.

## 13. FINAL EXECUTION DIRECTIVE

Start by auditing the current `main` branch, actual reference screenshot, mandatory guidelines, shared shell, complete route inventory, and global scroll implementation.

Create the route-by-route structural redesign matrix and execute it in validated stages.

Be decisive about replacing confusing layouts. Do not preserve a bad page structure merely because it already exists. Reuse existing components only when they fit the new information architecture and comply with guidelines.

The goal is a coherent, production-ready Kapitech AMS whose layout is immediately understandable, visually clear, consistent, responsive, and efficient for daily operations.

Do not change backend or business behavior. Do not stop at recommendations. Work through every active frontend module and subtab, validate the result, and push each completed stage directly to `main`.
