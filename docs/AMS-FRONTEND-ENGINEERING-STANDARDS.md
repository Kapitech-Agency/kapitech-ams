# AMS Frontend Engineering Standards

**Purpose:** Define frontend conventions for React pages, routes, APIs, state, forms, shared components, failures and verification.  
**UI authority:** AMS-DESIGN-SYSTEM.md. **Product authority:** the AMS Master Structure guide.  
**Boundary:** A frontend-only task does not authorize backend, schema, authentication, permission-policy, Finance calculation or deployment changes.

## 1. Stack and shared patterns

Verify package.json/current source before major changes. The repository documents React 19, TypeScript, Vite 6, Tailwind CSS v4, react-router-dom v7, motion, an icon bridge and shared AMS components.

- Use function components, typed props and existing route patterns.
- Use Tailwind v4/current CSS tokens; do not add a legacy config or second token system.
- Reuse src/lib/apiClient.ts and existing request/error conventions.
- Reuse components under src/components/ui and src/components/admin.
- Follow the existing icon-bridge convention; do not introduce a second icon set.
- Do not add shadcn/Radix or a new chart library without an approved reason.
- Reuse existing formatting/date/currency/reporting-period/permission helpers.

## 2. Routes and page structure

- Inspect the route owner, parent shell, siblings and access policy before adding a page or tab.
- Use a single page shell and module header; the shell owns outer page padding.
- Local tabs belong only to their workspace.
- Query parameters drive views that need deep links/browser history.
- Do not add nested shell padding, a second header or duplicate destinations.
- Preserve legacy routes where required; assess links, consumers, tests and access before removal.
- Hidden navigation is not authorization.

## 3. API and server-state handling

- Use the current typed API client/response envelope.
- Treat server/external values as untrusted runtime data.
- Separate server-owned records from temporary local form state.
- Refetch/invalidate canonical data after mutations according to current patterns.
- Handle partial failure honestly; failed reads must not look like valid empty production data.
- Distinguish stale/unavailable data.
- Never use localStorage/fixtures/optimistic state as production persistence.
- Do not claim payment/publish/transfer success without authoritative confirmation.

## 4. Mutation and concurrency contract

Each mutation requires clear target semantics, client feedback, server validation/permission, pending state, confirmed success, safe error retention, canonical refresh and audit/version handling as applicable.

- Block duplicate submit and conflicting writes while pending.
- Roll back optimistic UI if the server rejects.
- Keep tables, counters, detail panels and sibling tabs synchronized.
- Respect existing version/conflict mechanisms.
- Handle zero, null, missing, empty string and false explicitly.

## 5. Forms and overlays

- Use shared Drawer for create/edit/multi-field workflows as required by drawer guidelines.
- Use Modal/ConfirmDialog only for cases allowed by modal guidelines.
- Use existing input/select/date/currency components.
- Keep labels visible and IDs unique/accessibly associated.
- Keep the drawer open during save; prevent accidental close/duplicate submission while pending.
- Keep input on safe retryable errors.
- Sensitive actions explain the consequence and require confirmation.
- Server permission remains authoritative.

## 6. Tabs, search, filters and tables

- Navigational tabs and filters have distinct semantics.
- Query-driven tabs remain consistent with active state.
- Search/filter/sort/pagination act on the correct server scope.
- Reset dependent filters when a parent selection invalidates them.
- Use stable keys and deterministic ordering.
- Distinguish no data, filtered-empty, loading, error, stale/unavailable and denied.
- Exports reflect the selected period/filter and canonical source.

## 7. Layout and domain states

- Treat `AMS-DESIGN-SYSTEM.md` section 2.7 as the exact design geometry contract. Do not invent local spacing, control heights, radius, breakpoints, or layer values. Use documented named variants and report any source/spec conflict before changing either.
- Target WCAG 2.2 Level AA. The normative baseline is [WCAG 2.2](https://www.w3.org/TR/WCAG22/); use the [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) for widget keyboard models. A passing build or automated accessibility scan alone is not proof of conformance.

Follow docs/AMS-UX-INTERACTION-STANDARDS.md and AMS-DESIGN-SYSTEM.md. Do not add one-off spacing to compensate for shell defects. Avoid nested cards, duplicate headers and layout shifts.

Render canonical business state; do not invent page-local calculations for invoice paid/overdue, project complete, SLA breached, journal posted or bank transfer status. Use the approved domain response/helper. Draft, Sent/Issued, Accepted, Posted, Submitted, Confirmed and Reconciled are distinct.

## 8. Security/privacy

- Never expose secrets/session tokens/bank credentials/private keys or private provider payloads in frontend code, browser storage, logs or errors.
- Preserve session/CSRF/MFA/RBAC patterns.
- Route helpers improve UX; server-side permissions enforce security.
- Fetch sensitive fields only where needed/permitted; mask bank/personal identifiers.
- Treat user content/files/imported provider content as untrusted.

## 9. Acceptance checklist

- [ ] Current page, siblings, tokens, API client and tests inspected.
- [ ] User scope boundary preserved.
- [ ] Route/query deep link and browser navigation work.
- [ ] Role visibility and API permission boundaries are correct.
- [ ] Loading/empty/unavailable/validation error/server error/pending/success states verified.
- [ ] Tab switching causes no duplicate padding/header/layout jump.
- [ ] Failed optimistic updates restore canonical state.
- [ ] Duplicate mutation cannot trigger.
- [ ] Keyboard/focus, contrast and semantics are checked against WCAG 2.2 AA for the touched scope.
- [ ] Responsive behavior is checked at affected canonical widths, including 320 CSS px reflow and 200% text resize; no hidden/clipped content or unexpected page-level horizontal overflow.
- [ ] Relevant tests, lint and build were actually run and reported.

## 10. Related documents
- AGENTS.md
- AMS-DESIGN-SYSTEM.md
- docs/AMS-UX-INTERACTION-STANDARDS.md
- docs/AMS-DRAWER-GUIDELINES.md
- docs/AMS-MODAL-GUIDELINES.md
- docs/AMS-KANBAN-GUIDELINES.md
- docs/AMS-BUSINESS-WORKFLOW-STATE-MACHINES.md
- docs/AMS-IMPLEMENTATION-TRACEABILITY.md
