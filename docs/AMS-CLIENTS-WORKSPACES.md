# Clients workspaces — frontend composition contract

**Updated:** 2 November 2026. **Reference:** approved Dashboard Overview and the [Shared UI System](AMS-SHARED-UI-SYSTEM.md). This is a presentation/routing rebuild, not a new client, onboarding, service or accounting backend.

## Workspace and worksheet ownership

| Workspace | Worksheets and entry | Available source / boundary |
|---|---|---|
| Directory | Companies: `/admin/clients/all-clients`; Contacts: `?worksheet=contacts` | One canonical client account and its primary contact. Contacts changes the identity emphasis; it does not invent a multi-contact store. No relationship-owner field or account tier is inferred. |
| Onboarding | `?scope=onboarding`; Required Documents: `&worksheet=required-documents`; Kickoff Readiness: `&worksheet=kickoff-readiness` | Lead client records and recorded profile fields exist. Assigned requirement/checklist records, required-document approval and validated kickoff rules are unavailable. The Checklist starts with the lead review queue. Documents and Kickoff use `onboardingClient=<canonical-id>` to select one account; account context persists across worksheet links. They do not repeat the company register. Each worksheet explains its evidence boundary. Profile completeness is never onboarding approval. |
| Agreements | Contracts & SOWs: `/admin/contracts`; Retainers & Service Commitments: `/admin/clients/retainers`; Renewal Schedule: `/admin/contracts?view=renewals`; Contract History: `?view=history` | Current contracts, existing lifecycle callbacks, client-owned retainer terms and the canonical active-agreement date projection exist. Contract-specific persisted version/event feeds are unavailable in this workspace; updated dates are not synthesized into history. Existing lifecycle audit persistence is retained. |
| Service & Health | `/admin/clients/sla-monitoring`; `?view=service-issues`, `?view=client-health`, `?view=service-history` | No configured telemetry, incident feed, validated health model or service-event feed is exposed. All four worksheets have navigable, distinct source boundaries and canonical next actions. Sales inquiries are not classified as incidents and spend caps are not client-health scores. |

Clients desktop and mobile module navigation must adopt `ams-operational-tabs` in the actual AdminLayout, matching the approved Overview’s computed 6px padding on every side in both selected and unselected states. Internal worksheet tabs use the same shared context. A manual navigation wrapper in an audit cannot prove this production wiring.

All thirteen worksheet routes use one current internal link and retain the four existing module workspaces. Invalid worksheet values render the workspace default. Existing legacy client redirects, deep-linked Client 360 requests and route/RBAC policy stay intact.

## Directory and Client 360

Directory order: workspace header/actions → worksheet navigation → shared disclosure filters → Directory scope choice → canonical register and pagination → selected Client 360 Drawer. Onboarding Checklist order: header/navigation → relevant industry/location filters and source-backed sort → lead profile review queue/pagination → compact requirement-source boundary. Documents/Kickoff order: header/navigation → canonical lead picker and account context → account-specific evidence availability. The generic Next action card and repeated queue are removed from these worksheets.

- Company identity, primary contact, contact channels, relationship state, recorded service/renewal context and updated date lead the register. Contacts puts the recorded person first and keeps company context. Native email/phone links use only recorded values.
- Advertising cap state retains the existing source calculation and is explicitly identified as advertising context. The legacy `scope=at-risk` route remains compatible; its label is **Spend cap exceptions**. Arbitrary strategic/retainer account tiers based on project count are removed from the Directory.
- Existing search/status/industry/location/spend filters, reporting-period scope, sorting and export source logic remain. Sort controls expose existing company/update/industry/billed-value/project-count ordering. Search is excluded from the active field-filter badge. Filters begin closed; applied state is visible when closed. Reset clears search/field filters without leaving Onboarding or its worksheet. Onboarding excludes relationship/spend-cap filters and financial sort options; changing into Onboarding defaults to recently updated profiles. Profile-field counts reuse the existing completeness helper and never imply requirement completion. The six-column queue omits the repeated Lead status; row actions are review, Documents and Kickoff. Authorized editing remains in Client 360, avoiding a duplicate row edit action.
- The domain register composes `AdminPanel`, embedded `AdminDataTableShell`, `ProfileIdentity`, `AdminStatusBadge`, `DashboardControl`, `DashboardEmptyState` and existing pagination. Desktop tables have captions, row/column headers, sort semantics and a named keyboard-scroll region. Below 1100px the equivalent records become cards. Source failure hides stale rows; unavailable is distinct from valid empty and filtered empty.
- Client 360 has Account profile, Linked work, permitted Agreements and permitted Interactions sections. Existing loaders and permission gates remain authoritative. Projects/Inbox/Finance/Documents keep their canonical source relationships and destinations; no duplicate editable master or ledger is created. The existing logged-interaction workflow remains in its shared Drawer.

## Agreements and service commitments

- One shared agreement-worksheet definition owns all four destinations; Contracts and Retainers cannot drift into different active states.
- Contracts use the shared disclosure filter before the source register. Current saved detail, draft creation/editing, lifecycle transitions and confirmations keep their existing handlers and validation. This UI does not send a signature email or execute a legally binding e-signature.
- Retainers use the shared cycle/tier/usage disclosure filters, register/cards, read-only commitment Drawer, pagination and source-backed supporting summary. Inspection is available without management controls; authorized editing reuses the existing form. Canonical Client 360 links use client IDs, not retainer IDs or labels.
- Missing terms/usage remain unknown. Recorded usage is not reconciled Time Log consumption. Existing remaining-hour/usage/renewal/value calculations are preserved. Source failure withholds totals and offers retry; save failure is not successful persistence. In-flight form saves block dismiss/cancel.
- Renewal timing remains the existing active-contract/active-retainer projection. Incomplete source coverage is explicit; missing dates remain visible and no lifecycle transition runs automatically.

## Shared presentation and cleanup

Shared geometry stays in the existing owners: `AdminModuleHeader`, `OperationalWorkspace.css`, `AdminFilterToolbar`, `DashboardControls`, `DashboardEmptyState`, shared Drawer and form Button. Card actions use `variant="action" size="compact" className="ams-dashboard-card-action"` inside `ams-overview-panel`. No Clients stylesheet, token layer, fixture route, preview label or new component framework is added.

Remove the superseded inline Directory table/card implementation, legacy Clients/Retainers `AdminFilterBar` consumers, inferred tier display, static disabled worksheet rows, unused imports/helpers, unconsumed legacy client-table CSS selector aliases and old SLA setup-card composition. Active source libraries, APIs, stores, secure document handling, forms, permission gates and compatibility routes remain.

## Verification boundary

Render tests cover all worksheet routes, one current state, aligned table cells, primary-contact identity, read-only controls, source failure hiding stale records, loading/valid-empty/filtered-empty states and honest unavailable evidence. Full regression, inventory, typecheck/build and local actual-component browser QA are recorded in the [execution checkpoint](AMS-EXECUTION-CHECKPOINT.md). Isolated QA adapters live outside production source. Authenticated production writes, deployment health, full WCAG certification and user visual sign-off are separate gates.
