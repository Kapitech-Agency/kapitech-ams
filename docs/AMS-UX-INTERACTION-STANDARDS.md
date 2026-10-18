# AMS UX and Interaction Standards

**Purpose:** Standardize UX hierarchy, density, margin/padding ownership, shared interactions and accessibility across AMS.  
**Visual authority:** AMS-DESIGN-SYSTEM.md and current tokens in src/index.css. This document describes how to apply/test the system; it does not create a second token system.

## 1. Core principles

- AMS is a daily operational workspace, not a marketing page.
- Use calm, clear hierarchy and purposeful density.
- Make the next action obvious without making every control compete for attention.
- Preserve the current dark-first AMS language. Crimson is brand accent, not the universal state color.
- Reuse shared shell, tabs, forms, buttons, tables, drawers, modals, status, loading, empty and error patterns.
- Each control must match a real action and a real outcome.
- Do not disguise missing data as zero, empty success or integration success.
- Protect user work and explain failures/recovery.

## 2. Visual authority

1. AMS-DESIGN-SYSTEM.md owns exact tokens, typography, spacing scale, layout, component geometry, status colors, motion and accessibility details.
2. Shared source components/styles own actual rendering and must be inspected before local changes.
3. This guide owns cross-page application and consistency checks.
4. A page may add domain-specific hierarchy, not new tokens or parallel primitives.

Resolve code/document conflicts deliberately; do not silently invent alternatives.

## 3. Margin, padding and spacing ownership

### One owner per boundary
- Canonical page shell owns outer page padding.
- Module header owns internal title/description/action spacing.
- Shared section tabs own tab height/alignment/bar spacing.
- Page sections own gaps between semantic groups.
- Panels/cards own internal padding according to the design system.
- Shared form primitives own label/help/input/validation spacing.
- Shared drawer/modal owns overlay header/body/footer geometry.
- Shared table patterns own row height/cell padding/alignment.
- Child pages must not add another page gutter when the parent shell already owns it.

### Prohibited layout hacks
Do not use nested page-edge padding, negative margins to bleed tabs/panels, !important, arbitrary z-index, magic offsets, absolute positioning for ordinary alignment, one-off drawer widths, redundant cards around header controls, or duplicate headers to compensate for broken hierarchy.

Inspect layout ownership from the outer shell to the inner component and fix the actual owner.

### Spacing review
1. Inspect route shell and parent wrappers.
2. Identify the owner of each edge/gap/padding.
3. Compare against a stable sibling using the same primitive.
4. Review populated/loading/empty/error/validation states.
5. Switch all tabs and check for compounded gutters, jumps, clipping or overlap.
6. Review narrow viewport and keyboard focus.
7. Add long/error text and ensure natural expansion without overlap.

## 4. Page hierarchy

When appropriate:
1. Canonical page shell.
2. One module header with title, concise description and primary actions.
3. Local section tabs immediately after header.
4. Search/reporting/context controls inside the owning toolbar/header.
5. Decision-critical metrics only where useful.
6. Main register/workflow surface.
7. Supporting details and secondary actions.

Not every screen needs KPI cards. Do not leave blank metric gaps or add meaningless cards for visual parity. Do not add a second header below a subtab. Tab changes must not shift the overall shell.

## 5. Navigation and URL state

- Primary navigation follows the nine-module target in the master guide.
- Primary navigation, local tabs, filters and presentation modes have separate roles.
- Query-driven views survive reload/back/forward.
- Active state uses normalized path/query and role access, not string-prefix accidents.
- One route must not show contradictory active destinations.
- Deep links resolve without needing to open a drawer first.
- Preserve legacy deep links through compatibility behavior when removal could break users or saved references.
- Keep persistent navigation to the primary module and its current workspace. Worksheets, filters, saved views and individual records do not automatically become another menu layer.
- Breadcrumbs are optional/contextual, not a global element on every page. Use them on deep record/detail pages only when the ancestor path helps orientation or returning to a parent.
- Prefer ancestor breadcrumbs such as `Projects → Project Registry` above the current record title. Do not repeat the current page title in the breadcrumb and page heading. Every ancestor link must navigate to the correct authorized parent.
- Do not add breadcrumbs to obvious module roots or primary tab destinations whose location is already clear. On narrow layouts, collapse the path or use a clear back-to-parent affordance without creating a second tab/navigation row.

## 6. Tables and registers

- Titles/explanations are clear where required.
- Actions and numeric fields follow design-system alignment.
- Use tabular numerals for money/counts/durations; right-align numeric and financial columns.
- Avoid non-standard zebra styling.
- Filters compose predictably and reveal active scope.
- Sorting/pagination use stable keys/order.
- Distinguish no data, filter-empty, loading, error, stale/unavailable and access denied.
- Bulk selection/export represents the intended result scope.
- Row selection must not accidentally trigger a detail action.

## 7. Forms, drawers and dialogs

- Follow docs/AMS-DRAWER-GUIDELINES.md and docs/AMS-MODAL-GUIDELINES.md.
- Use the shared Drawer for create/edit and multi-field workflows as defined by those guides.
- Labels remain visible; placeholders are examples, not labels.
- Client validation improves feedback; server validation is authoritative.
- Retain form values after safe-to-retry errors.
- Block duplicate submit/conflicting edits while pending.
- Do not close/reset before confirmed save.
- Destructive confirmation states the affected record and consequence.
- A preview is not proof that an email/PDF/publish/payment succeeded.

## 8. Status and feedback

- Status labels reflect source-backed business state.
- Use semantic state colors; do not use danger red as generic brand accent.
- State is never color-only.
- Success follows confirmed persistence/provider outcome.
- Error explains what did/did not save and the next safe action.
- External data has last-verified timestamp/staleness.
- Unknown bank outcome is never presented as successful or failed by assumption.

## 9. Responsive behavior and accessibility

- Core actions remain available at narrow widths; do not depend only on hover/drag.
- Keyboard focus follows visual order and current focus tokens.
- Inputs/selects/tabs/drawers/dialogs/popovers have accessible names, keyboard behavior, focus restoration and error associations.
- Avoid overlapping focus traps when overlays stack.
- Honor reduced motion.
- Provide a non-drag alternative for board operations.

## 10. Visual consistency regression checklist

- [ ] One owner for outer page padding.
- [ ] Header/title/description/actions match shared patterns.
- [ ] Tabs have consistent placement, geometry, focus and active state.
- [ ] No duplicate header/redundant toolbar.
- [ ] Breadcrumbs are contextual, useful, permission-aware, and do not duplicate the current page title.
- [ ] Panels use canonical surface/padding tokens.
- [ ] Form errors do not overlap controls.
- [ ] Table density/numeric alignment/status/actions are consistent.
- [ ] Drawer/modal uses shared component and correct scroll/focus behavior.
- [ ] Loading/empty/unavailable/stale/error/populated states are distinct.
- [ ] Query/tab switching causes no layout jump.
- [ ] Responsive and keyboard use remain usable.
- [ ] No arbitrary token, negative-margin hack, !important or parallel component implementation.

## 11. Related documents
- AMS-DESIGN-SYSTEM.md
- docs/AMS-DRAWER-GUIDELINES.md
- docs/AMS-MODAL-GUIDELINES.md
- docs/AMS-KANBAN-GUIDELINES.md
- docs/architecture/ams-navigation-information-architecture.md
- docs/AMS-E2E-AND-REGRESSION-TEST-MATRIX.md
