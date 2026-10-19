# AMS Frontend Structural Redesign Execution Prompt

**Repository:** Kapitech-Agency/kapitech-ams  
**Execution branch:** main  
**Production target:** https://ams.kapitech.id  
**Purpose:** Execute the approved frontend structural-redesign specification in bounded, verifiable slices.  
**Status:** Task-specific execution prompt. The linked specification and canonical delivery roadmap remain authoritative.

## Copy-paste execution instruction

Act as the senior frontend engineer responsible for executing the [AMS Frontend Structural Redesign Audit and Execution Specification](AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md) in the Kapitech AMS repository.

This is an implementation task. Do not stop after reading documents, producing another audit, rewriting the plan, or making isolated cosmetic fixes. Verify the current repository state, identify the earliest unfinished structural requirement, redesign that view from its actual agency task, implement the material content-structure changes, verify them, checkpoint the result, and continue in the documented order.

The user must be able to review the real frontend and decide whether its module content is ready before broad backend, API, data-model, workflow, integration, or production-readiness work begins.

## 1. Authority and required reading

Before editing application code, read these files in full and follow their internal links where relevant:

1. Root AGENTS.md.
2. docs/README.md.
3. docs/AMS-END-TO-END-DELIVERY-ROADMAP.md. This is the canonical sequence for the overall initiative.
4. docs/AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md. This is the controlling specification for this task.
5. docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md.
6. docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md.
7. docs/architecture/ams-navigation-information-architecture.md.
8. AMS-DESIGN-SYSTEM.md.
9. docs/AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md.
10. docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md and docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md.
11. docs/AMS-FRONTEND-ONLY-UXUI-EXECUTION-PROMPT.md.
12. docs/AMS-FRONTEND-ENGINEERING-STANDARDS.md and docs/AMS-UX-INTERACTION-STANDARDS.md.
13. docs/AMS-FEATURE-CONTENT-GAP-REGISTER.md, docs/AMS-STRUCTURAL-REDESIGN-PROGRESS.md, docs/AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md, and docs/AMS-EXECUTION-CHECKPOINT.md.
14. docs/AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md and docs/AMS-RESUME-AFTER-INTERRUPTION.md.
15. Relevant Finance, drawer, modal, Kanban, accessibility, testing, and module-specific specifications for the selected view.

Use each document for its defined purpose. The End-to-End Delivery Roadmap owns the overall stage sequence. The structural-redesign specification defines the frontend work method and its Stage 5 user sign-off gate. The gap register records requirement status and evidence. Target documents do not prove that a feature exists. Current source, tests, CI and available authorized rendered evidence determine actual status.

If documents conflict, follow AGENTS.md and the roadmap's precedence rules. Preserve business/domain contracts. Do not silently invent product behavior or overwrite a higher-authority requirement.

## 2. Non-negotiable scope boundary

### Allowed in this task

- Frontend page hierarchy, main-content composition and visual information architecture.
- Approved navigation/tab presentation, routing presentation and query-driven view state when already supported by the current contract.
- Reordering and grouping existing content so each workspace serves its real task.
- Reuse or focused correction of existing frontend components and design-system patterns.
- Responsive behavior, keyboard and focus behavior, truthful loading/empty/error/stale/unavailable states.
- Focused frontend regression tests.
- Updates to the relevant gap register, structural progress record, implementation map and execution checkpoint.
- Browser screenshots and visual evidence where authorized access is available.

### Prohibited in this task

Do not edit or change backend services, API routes/contracts, Express behavior, persistence, database or SQL, migrations, schema, data models, seed data, authentication, sessions, CSRF, MFA/TOTP, RBAC or authorization policy, encryption, audit controls, private-document authorization, notifications/integrations, Finance calculations or postings, payment flows, reconciliation, period locks, established business workflows, or canonical data ownership.

Do not add dependencies, replace the React/Tailwind/icon/motion stack, create a parallel design system, or implement fake runtime records and fake successful actions. Do not make unrelated public-site, hosting, deployment, or production changes.

If the target composition depends on a missing API, model, provider, permission or business transition, preserve the current truthful state, record the dependency against the correct requirement, and continue with the source-supported frontend work. Do not expand scope to make the screen look complete.

## 3. Product and navigation constraints

The approved primary navigation has exactly nine modules:

1. Dashboard
2. Inbox
3. Projects
4. Clients
5. Finance
6. Team & Resources
7. Documents
8. Website CMS
9. Settings

Do not rebuild approved navigation from scratch. Verify it against current source and repair only proven regressions. Do not add CRM, Proposal/Quotation, or generic Approval as primary modules.

Finance must retain its five approved areas:

1. Overview & Control
2. Transactions & Cash
3. Receivables & Payables
4. Project Finance
5. Accounting & Reports

Preserve canonical record ownership, existing route contracts, business meaning, access restrictions, Finance formulas, and established interactions. A role or persona may affect content emphasis only within current permissions.

## 4. Recover the live state before choosing work

At the beginning of the task and after any timeout or context interruption:

1. Fetch the latest main HEAD and recent commit history.
2. Check the current status of the repository's CI and Quality Gate for the exact relevant commit. Do not reuse historical status as current evidence.
3. Inspect relevant source files, routes, tabs, query parameters, tests and recent diffs.
4. Compare the checkpoint, gap register, structural progress record and implementation map with what is actually present in source.
5. Identify work that is already correct and preserve it. Do not repeat a completed slice just because a document is stale.
6. Separate unfinished structural requirements from minor bugs, cosmetic differences and backend-dependent capabilities.
7. Select one earliest unfinished structural view in the approved sequence. Do not select work merely because it is easy.

The approved navigation is not the current redesign target. The priority is the main content inside each actual module/workspace and the way it serves the user's task.

## 5. Mandatory implementation sequence

Follow the frontend stages in the structural-redesign specification. These refine, but do not replace or renumber, the overall delivery roadmap's Stages 0–15.

### Stage 0: Baseline and preservation

Verify current source, history, tests and CI. Reconcile progress documents against evidence. Identify one bounded starting slice.

### Stage 1: Navigation and routing verification

Verify the approved navigation, workspace destination, active state, deep link, query state, browser refresh/back/forward and supported legacy redirects. Do not rebuild completed navigation to create a sense of activity.

### Stage 2: Shared shell and page geometry

Verify one owner for each page header, outer gutter, contextual tab bar and primary scroll container. Inspect shell, topbar/sidebar, focus, overlays and responsive behavior. Fix shared ownership at the proper shared level, not with local padding patches, negative margins, duplicate headers, arbitrary z-index, or CSS hacks.

### Stage 3: View structure contract

For the selected view, document the real task, current composition, specific mismatch and intended hierarchy using Section 6 below. This is a short design step followed by implementation in the same bounded slice. Do not turn it into a planning-only phase.

### Stage 4: Structural redesign

Execute the nine modules in this order, following the exact workspace/worksheet order in the approved specifications:

1. Dashboard
2. Inbox
3. Projects
4. Clients
5. Finance
6. Team & Resources
7. Documents
8. Website CMS
9. Settings

Within each module, finish a clearly bounded workspace or worksheet slice before jumping to an unrelated one. Preserve correct work already on main. Once a slice meets its acceptance contract and is verified, update its evidence and continue to the next unfinished structural requirement.

### Stage 5: Visual, responsive, accessibility review and user sign-off

Inspect rendered views where authorized access exists. Review the whole module/workspace sequence, not only a few favored screens. Report verified, partial, missing, blocked and not-verified states accurately. Stop at this gate and request the user's explicit frontend sign-off before beginning broad Stage 6 or later workflow/data/API work.

## 6. Required view structure contract

Before changing a view, record the following in the existing structural progress/gap record or link to the applicable existing requirement. Reuse existing requirement IDs. Do not create duplicate gap entries.

- Module, workspace, worksheet and canonical requirement ID.
- Primary user task and the key question this view must answer.
- Current route/component and actual content order, based on source inspection.
- Structural mismatch between current composition and the target specification.
- Before sketch: the current regions in visual order.
- After sketch: the proposed regions in visual order, with the primary work surface explicitly identified.
- Required source-backed information and the context needed to interpret it, including identity, status, owner, date/period, amount/unit, source and linked records where relevant.
- Primary action, secondary actions, filters and supported navigation.
- The reason for the chosen surface: register, queue, board, report, timeline, editor, selected-record review, detail panel, or settings group.
- Supported loading, populated, no-data, filter-empty, error, stale/unavailable and restricted states that apply.
- Existing route/query, data meaning and permission behavior that must remain unchanged.
- Material structural changes to implement.
- Focused regression checks and the visual/responsive evidence required to accept the view.

The before/after sketch must describe a real change in content order, grouping, working surface, or task flow when the existing structure is wrong. Changing only color, padding, labels, icons, a small filter, or a state message does not satisfy a structural requirement.

## 7. Structural redesign means changing the task experience

Design from the real job performed in the selected workspace, not from the existing JSX arrangement. Start by identifying what the user must decide or accomplish, then put the information and controls needed for that job together.

Valid structural changes may include:

- Making the primary register, queue, board, editor, report or selected-record workspace the dominant working area.
- Separating a record list from selected-record review where that improves triage or review.
- Grouping record identity, status, owner, deadline/period, amount/source and next action together when relevant.
- Moving filters and view controls directly above the surface they govern.
- Removing duplicated headers, repeated KPI strips, decorative cards and redundant supporting panels.
- Giving related tasks a coherent workspace hierarchy without inventing an extra primary module.
- Clarifying the relationship between module navigation, workspace tabs, worksheet tabs, filters and view toggles.
- Making long tables, boards, detail panels, forms, drawers and editors useful at narrow widths without hiding important fields.

The following do not independently prove structural completion: changing styles, rewriting copy, adding a generic card, fixing a date or CSV defect, adding one empty-state message, changing only a shared primitive, or passing source-level tests while the primary work surface remains wrong. These are supporting improvements. Track them separately from structural completion.

Keep representative content concise. When real source data is available, use a small representative set that demonstrates the role and behavior of each supported function. Never inject sample/demo records into production runtime just to fill a layout. When no valid record exists, show the correct empty state. When a capability is unsupported, state that honestly and record its dependency.

## 8. Design system, interaction and accessibility

- Treat AMS-DESIGN-SYSTEM.md and the current token source as the only visual authority.
- Follow the existing content architecture, role blueprint, worksheet matrix and interaction standards.
- Use the current shared shell and component patterns. Do not create parallel primitives or arbitrary one-off variants.
- Preserve one title/header owner, one outer-gutter owner and one primary scrolling owner.
- Use semantic status labels and meaningful non-color cues. Do not make color the only status signal.
- Preserve keyboard access, visible focus, accessible names, sensible reading order and existing permission-safe behavior.
- Verify zoom/text resize, reflow, reduced motion, mobile detail/back patterns, and dialogs/drawers where relevant.
- Follow the exact viewport and breakpoint requirements in AMS-DESIGN-SYSTEM.md. Do not substitute an invented viewport list or claim visual checks that were not performed.
- Treat target WCAG 2.2 AA as a verification target, not an assertion inferred from a successful build.

## 9. Verification required for each bounded slice

For every slice:

1. Inspect the implementation diff and confirm that the change addresses the stated structural mismatch.
2. Verify that no unrelated files, business rules, data meanings, or protected backend files changed.
3. Add/update focused frontend regression coverage for the expected hierarchy, route/query behavior and relevant states.
4. Run the appropriate targeted tests, then the relevant repository test suite, typecheck/lint and production build as applicable. Current package scripts include npm run lint, npm test and npm run build; confirm current scripts before running them.
5. Check CI and Quality Gate for the exact pushed commit. Do not claim success based on a different SHA.
6. Where authorized browser access exists, inspect the actual rendered view at the documented desktop/tablet/mobile/boundary widths and record the route, state, viewport and evidence link.
7. Check consumers of shared components affected by the change.
8. Update the requirement's evidence and status. A shared-component change, build pass or screenshot alone does not make every consuming view complete.

If browser access or the required role is unavailable, state exactly what could not be verified. Do not generate fictional screenshot or runtime evidence.

## 10. Progress, checkpoint and timeout protocol

Work in small, independently verifiable commits. Provide a durable user-facing checkpoint after baseline and after every meaningful structural slice. Do not allow several substantial slices to accumulate without a report.

Every checkpoint must include:

- Date/time and current live main SHA.
- Official roadmap stage and one bounded module/workspace/requirement ID.
- What changed structurally and why it better serves the actual task.
- Changed file paths and exact commit link.
- Supporting bug fixes, separately labeled.
- Tests, lint/typecheck, build and CI/Quality Gate results for the exact SHA.
- Rendered visual evidence and viewport details, or the specific reason it is unavailable.
- Requirement statuses: verified complete, partial, missing, blocked, or not verified.
- Gap register/progress/checkpoint documents updated.
- Remaining blocker or dependency, if any.
- The next single action in canonical order.
- Confirmation that the Stage 5 user approval gate remains in force.

Follow docs/AMS-RESUME-AFTER-INTERRUPTION.md after a timeout. Refresh main and current CI before making another change. Check whether a prior file write or commit succeeded. Resume from the verified state instead of repeating the task from the beginning.

Commit directly to main when authorized by the repository rules and tools. Do not create a side branch or pull request as a workaround, force-push, bypass repository protection, or overwrite concurrent changes. If direct-to-main is blocked or a concurrent change creates risk, report the exact blocker and preserve the work safely.

## 11. Definition of done

The frontend structural-redesign task is ready for user review only when:

- The nine-module navigation remains consistent with the approved IA and verified route behavior.
- Each in-scope workspace has a view contract or explicit evidence-backed blocker.
- Main content has been assessed against actual tasks and changed structurally wherever the target contract requires it.
- Cosmetic fixes are not counted as structural completion.
- Unsupported capabilities and missing backend/model dependencies are clearly identified, without fake functionality.
- Source behavior, route/query state, permissions and canonical data meaning remain intact.
- Targeted regression coverage and applicable typecheck/build/test/CI checks have been recorded.
- Shared consumers and documented responsive/accessibility requirements have been reviewed for touched views.
- The gap register, structural progress record, implementation map and checkpoint agree with current verified evidence.
- A module-by-module Stage 5 review is ready, with browser evidence or explicit verification limitations.
- Work stops for the user's explicit frontend sign-off before broad Stage 6+ work.

## 12. Required end-of-slice report

Use this concise format after each slice:

**Stage / slice:**  
**Current main SHA:**  
**Structural problem addressed:**  
**Before → after:**  
**Changed paths / commit:**  
**Supporting fixes (not counted as structural completion):**  
**Checks and exact results:**  
**Browser evidence / limitations:**  
**Requirement status and register updates:**  
**Remaining blocker:**  
**Next single action:**  
**Frontend sign-off gate:** Pending / Approved

## Immediate next action

Read this prompt and the controlling structural-redesign specification in full. Fetch current main, inspect recent diffs and exact current CI, reconcile the gap register and checkpoint, and verify that approved navigation is already implemented. Then select the earliest unfinished structural workspace, complete its view contract, implement the actual material content-structure change, test it, update the evidence, and continue in canonical order. Do not answer with another plan only. Do not resume from stale commit notes. Do not begin broad backend/workflow work until the user approves Stage 5.
