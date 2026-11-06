# AMS UX/UI, Visual Hierarchy and Usability Canonical Standard

**Status:** ACTIVE / NORMATIVE. **Updated:** 6 November 2026. **Scope:** all nine AMS modules, navigation, shared components, views, responsive states, usability acceptance. Documentation-only change; does not modify source, routing, backend, database, authorization, authentication, accounting calculations, or release status.

## 0. Authority, safety and conflict resolution

This document owns **UX principles, priority rules, visual hierarchy decisions, evidence expectations and cross-module usability acceptance**. It supersedes contradicting UX prescriptions in earlier examples, prompts and legacy guidance. It does **not** replace: `AGENTS.md` for execution/safety; `AMS-DESIGN-SYSTEM.md` for exact tokens/dimensions; `architecture/ams-navigation-information-architecture.md` for approved destinations; `AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md` for business capabilities; `AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md` §4.10 for approved domain page structures; `AMS-MAVEN-INSPIRED-OPERATIONAL-WORKSPACE-IMPLEMENTATION-GUIDE.md` for validated domain content; `AMS-SHARED-UI-SYSTEM.md` for component implementation; security, Finance, source tests and production controls. When a later screenshot/legacy note conflicts with a current norm, follow the designated owner and log the conflict. Never silently rewrite historical records.

**Fixed current presentation constraints:** Dashboard tabs = Overview and Analytics; Inbox Messages is the opening workspace, not a separate Inbox Overview; five canonical Finance taxonomy domains and six rendered work areas are different layers. Approved Dashboard Overview defines visual language, **not** a requirement to copy its cards to every module. Existing Kapitech dark-first/crimson tokens and documented component geometry remain authoritative. No demo/dummy/mock data in runtime or fabricated KPIs; missing data must be explicitly distinguished from true zero. No inert control or false-save feedback.

## 1. Seven-layer design hierarchy

1. User needs and business objectives: identify role, job-to-be-done, frequency, outcome, dependencies and consequences.
2. Information architecture: application > module > section > page/tab > content group > component > element; use task-centered grouping.
3. User journey/interaction: entry point > find > review > act > system confirmation > recovery; include permissions and failures.
4. Visual hierarchy/layout: reading priority, size, weight, contrast, placement, spacing, alignment and meaningful color.
5. Design system/components: semantic tokens > primitives > composites > patterns > templates > product pages.
6. Accessibility/usability: independent keyboard operation, semantics, responsive reflow, readable status and feedback.
7. Validation/iteration: heuristic review, actual-user task testing, accessibility and responsive verification, measured remediation.

Research/evaluation are iterative across all layers; the list expresses dependency, not a one-way project waterfall.

## 2. Heuristics and laws: practical decision rules

### Nielsen's ten usability heuristics

| Heuristic | Required behavior | Typical AMS check |
|---|---|---|
| Visibility of system status | Show loading, saving, success/failure and freshness truthfully | No success before confirmed persistence; no fake zeros |
| Match to the real world | Use agency/accounting vocabulary understandable to the relevant role | Invoice, project, deliverable, payment |
| User control/freedom | Provide Cancel, safe Back, reversible Undo when feasible | Preserve form work; return from drawer |
| Consistency/standards | Reuse design-system primitives, terminology and state semantics | Same filter and date-control behavior |
| Error prevention | Constrain invalid actions before they cause harm | Validation, destructive confirmation, permission guard |
| Recognition over recall | Reveal labels/options/context; do not require memorizing hidden state | Searchable client picker, visible active filters |
| Flexibility/efficiency | Support novice and power users without confusing defaults | Saved views, bulk actions only if supported |
| Aesthetic/minimalist design | Remove non-task content; use one dominant working surface | No decorative KPIs or nested card clutter |
| Error recognition/diagnosis/recovery | Explain problem, location, next recovery action | Inline form error and Retry |
| Help/documentation | Explain unfamiliar terms at point of use | Metric definitions, SOP and inline guidance |

### Additional evidence-informed principles

- Hick-Hyman: group alternatives around a task, and progressively reveal uncommon controls; do not arbitrarily remove legitimate choices.
- Fitts: enlarge critical hit areas and improve reachability; do not cluster tiny icon buttons.
- Jakob: reuse familiar navigation, forms, tables and common interaction conventions; domain accuracy overrides mimicry.
- Miller: chunk information into recognizable groups; **never** impose a false fixed 7-item menu rule.
- Tesler: keep unavoidable business complexity correct; simplify explanation, not invoice/security consequences.
- Doherty: provide fast perceptible responses and explicit asynchronous feedback; **no universal 400ms pass/fail SLA**.
- Gestalt proximity/similarity/continuity/Prägnanz: proximity reflects conceptual groups, identical appearances imply identical meaning, alignment/continuity guide scanning, avoid excess ornament.
- Von Restorff: one prominent action in the active context; avoid all-red competing buttons.
- Zeigarnik: progress and incomplete work may aid follow-through, but should not manipulate attention.
- Peak-end: make error recovery and successful completion understandable and reliable, never misleading.
- UCD / ISO 9241-210 approach: understand users and context, specify requirements, design, evaluate, iterate using actual role-based tasks.

**Important distinction:** UX laws are descriptive heuristics, not external mandatory numeric standards. WCAG success criteria and repository's explicit design-system values are testable obligations.

## 3. Information architecture and navigation

- Sidebar is for global modules; subsection navigation belongs inside a module. Do not mirror sidebar items in tabs or create deep nested navigation without task evidence.
- Names, order and destinations follow the approved navigation IA, not an external template.
- Tabs represent closely related peer views in one context and expose selected/focus state correctly; if there are too many peers, use a clearer information architecture.
- Breadcrumbs express actual ancestors on deep/detail views, not invented route labels. Do not show redundant breadcrumbs where no navigation value is added.
- Preserve active module, current view, applied filters and page context when switching related views if supported by the existing route contract.
- Permission visibility is not permission enforcement; never invent routes or weaken access guards.
- Record role-specific primary job and expected drill-down for every module and tab.

## 4. Visual hierarchy and page anatomy

Visual priority must follow **urgency > task relevance > primary work > analytical support > metadata** when appropriate to the role. Determine the ordering with workflow evidence rather than blindly sorting every page this way.

Use this adaptable anatomy:
1. Module/page header with precise title, context and primary action.
2. Contextual navigation only where there are multiple related subviews.
3. Local controls adjacent to the surface they affect: search, filter, period, sort, view mode.
4. Decision-grade summary if it changes the user's next action.
5. **One dominant working surface**: registry, queue, editor, board, report, inbox reader or chart.
6. Supporting context, related activity and secondary actions.

Do not force KPI strips on a registry or reader page. Approved Dashboard Overview is the quality reference for typography, surface rhythm and visual discipline, not universal layout replication.

Hierarchy signals: size and typographic weight, contrast, screen position, grouping/whitespace, alignment, and semantic color. Use one strong focal point per active context. F- and Z-patterns are optional observational patterns, never obligatory layouts for complex dashboards.

### Layout and spacing

- Use existing 12-column layout where suitable and **exact spacing/breakpoint tokens in `AMS-DESIGN-SYSTEM.md`**, not the illustrative generic 4/8/12/16/20/24/32/40 scale from teaching materials.
- Page shell owns outer gutter and section rhythm; the card owns internal padding; toolbar owns its controls; overlay owns its own layout. Avoid duplicate margin ownership and magic-height hacks.
- Related information belongs closer together than unrelated information. Favor meaningful whitespace without creating tall empty cards.
- Equal-width/height cards are only appropriate if content remains readable; avoid visual symmetry that sacrifices task completion.
- Responsive layout must preserve identity, status, primary action and route to full detail. Allow bounded horizontal scrolling for genuine tabular data, never unexplained page overflow.

### Typography and color

- Use repository typography tokens. Numeric comparisons use tabular figures and consistent unit/period; tables may align numeric columns to the right.
- Don't treat generic teaching samples (28–32 px page headings, 14–16 px body) as a replacement for AMS-specific typography.
- Crimson = primary brand/active emphasis, **not** automatically error, overdue, or success. Use semantic status colors and visible text/icon cues.
- Limit decorative badges and competing accents. Check each theme/state for actual contrast.

## 5. Shared interaction and component contracts

For each interactive component document: semantic role/name, enabled/disabled conditions, default/hover/focus/active/loading/success/error states, keyboard pattern, text feedback, responsive behavior, authorized action destination, cancellation and recovery path.

- Buttons: primary current-job CTA, secondary support, tertiary navigation/detail, destructive explicit risk. Avoid multiple competing primary CTAs in one local context.
- Filters: attach to the record surface/chart they control. Always show applied scope, clear/reset where useful, and a truthful filtered-empty state.
- Tables: readable headings and identity; appropriate search, sort, filters, pagination, row actions; bulk actions only with explicit selection and permission semantics. Support keyboard, accessible table markup and responsive strategy.
- Forms: persistent visible labels, grouped fields, required/optional meaning, predictable validation, preserve input after failure, inline actionable error, appropriate pending state and safe Cancel.
- Modal: brief blocking decision; Drawer: context-preserving short detail/edit; Full page: longer multi-stage work; Popover: short contextual choices; Tooltip: supplementary help, never sole location for critical information. Follow WAI-ARIA APG where applicable.
- Micro-interactions: short purposeful transitions; never substitute motion for state feedback; honor reduced motion. Animation duration examples are **guidance**, not mandatory universal numeric tokens.
- Undo or confirmation for destructive edits; no unannounced loss of unsaved work.
- Shared component implementation remains owned by `AMS-SHARED-UI-SYSTEM.md` and specialized Drawer/Modal/Kanban guides; do not create parallel primitives.

## 6. Honest data and visualization contract

| User question | Preferred view | Acceptance |
|---|---|---|
| How has this changed over time? | Line/area chart | Time axis, units, range, valid source |
| Which category is larger? | Bar chart or sortable table | Comparable scale, meaningful labels |
| How much of target is complete? | Progress indicator | Defined numerator, denominator, target |
| What share of the whole? | Donut/stacked bar where readable | Total and segments valid, labels readable |
| Which records require action? | Queue or data table | Identity, status, urgency, owner, next step |

Each KPI: definition, value, unit, period, source/freshness where relevant, interpretation/drill-down. Do not display decorative chart series without valid data. Use readable axes/legends and accessible alternative to information conveyed only by visual marks. Bar axes must not be truncated deceptively; line ranges must be honestly labeled. No invented invoice counts, statuses, percentages, financial values or demo chart curves in production.

## 7. Complete state taxonomy

Explicitly distinguish: initial loading, refreshing with existing data, never-created empty, filtered-empty, searched-empty, unavailable/missing data, error, partially failed fetch, permission restricted, pending/saving, success-confirmed, offline/stale, and no selection in split-pane. Use shared patterns, clear recovery actions, and avoid showing zero when the correct meaning is unknown/unavailable. Do not promise publish/bank/send success before a real confirmed result.

## 8. Accessibility, responsive and test criteria

**Normative target: WCAG 2.2 Level AA**, with applicable criteria tested per view. Normal text contrast >=4.5:1, large text >=3:1, meaningful UI boundaries/graphics >=3:1 where SC 1.4.11 applies. WCAG 2.2 SC 2.5.8 target size >=24×24 CSS px **or an applicable exception**; 44×44 is enhanced Level AAA, while AMS effective-hit-area preference is separately specified by the Design System. No color-only status. Keyboard access, visible unclipped focus, logical focus order, accessible names/roles/values, screen-reader announcements where needed, semantic headings, 200% text resize, 320 CSS px reflow with valid two-dimensional exceptions, reduced motion and high-contrast modes. WAI-ARIA APG is pattern guidance, not a substitute for semantic elements. Evaluate all actual themes and states manually plus automation.

Check canonical responsive widths **1440, 1280, 1100, 1024, 900, 899, 768, 600, 599, 390, 320 CSS px** where applicable. Never claim compliance based solely on a token, screenshot, lint pass or automated scan.

## 9. Domain-first priorities

| Module | Job and primary surface | Design priority |
|---|---|---|
| Dashboard | Overview/Analytics operational decision support | Finance exposure, projects, attention, supported trends |
| Inbox | Messages, triage and thread reader | Current queue, ownership, response, resolution |
| Projects | Registry/board/detail/deliverables | Delivery status, deadlines, blockers, review actions |
| Clients | Directory/client 360/contracts/retainers | Relationship state, agreement obligations and service health |
| Finance | Cash, invoices, AR/AP, reports and accounting | Valid financial meaning, overdue action, reconciliation truth |
| Team & Resources | Capacity, assignments, directory, time logs | Workload, conflicts, allocation and available people |
| Documents | Secure searchable registry | Ownership, relation, access and retrieval |
| Website CMS | Editorial register and editor | Draft/review/publish state and verified outcomes |
| Settings | Authorized configuration | Safety, explainability, confirmation and access |

Follow per-view source and field contracts in domain owners. Never infer that a specified feature exists without source and test verification.

## 10. Verification, evidence and release

For every touched view, record: role/task, reference design, baseline screenshot and source ref, proposed hierarchy, component reuse, state matrix, breakpoints, keyboard flow, exact evidence of data source and permission, usability task outcome, issues/severity, and reviewer sign-off. Measure task completion, time-on-task, errors, steps, discoverability, user satisfaction; distinguish opinion from observed evidence.

Severity: Critical blocks a core task or has dangerous consequence; High substantially impedes a major task; Medium creates friction with workaround; Low polish/consistency. No critical known issue at handoff.

Suggested weighted UX review rubric (**internal recommendation, not certification**): task efficiency 20%, IA 15%, visual hierarchy 15%, usability/interaction 15%, functional completeness 15%, consistency 10%, accessibility 10%. Scores do **not** replace WCAG, source-backed test, security, performance, data-integrity or deployment gates.

**DoD:** Clear task/primary action; verified IA; relevant content order; shared tokens; honest data/states; working interactions; keyboard/contrast/responsive evidence; role-based task test; no unresolved critical issue; actual authorization and data checks where relevant. A docs-only change cannot certify production readiness.

## 11. Decision registry: older rules clarified

| Potential legacy conflict | Binding resolution |
|---|---|
| "Copy Dashboard KPI layout everywhere" | Copy visual language only; domain task decides the primary surface |
| "Use mock data if API unavailable" | Forbidden runtime mock/dummy values; show unavailable/empty/error truthfully |
| "Global period on every tab" | Date scope belongs to supported data surface/approved view contract; no unsupported cross-module filtering |
| "Use one universal font size/spacing sample" | Exact AMS design tokens prevail |
| "All small touch controls pass at 24px" | Test WCAG exceptions AND AMS usability geometry; minimum alone does not prove usability |
| "Every page needs a breadcrumb" | Deep pages get accurate ancestors; avoid redundant hierarchy |
| "All KPI charts need a rendered line even with no data" | Empty-state visual must be honest; no fabricated chart series |
| "Any UX score proves production ready" | Product/finance/security/CI release gates remain independent |
| "Old Dashboard Performance/Inbox Overview tabs" | Historical only; current Overview+Analytics and Inbox Messages-first |
| "Five vs six Finance groups" | Canonical domain taxonomy vs presentation layer; do not conflate |

## 12. References

- Nielsen Norman Group: https://www.nngroup.com/articles/ten-usability-heuristics/
- Nielsen Norman Group, heuristic evaluation: https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/
- ISO 9241-210 overview: https://www.iso.org/standard/77520.html

This standard documents decisions and acceptance criteria, **not** evidence that the current AMS frontend passes them.
