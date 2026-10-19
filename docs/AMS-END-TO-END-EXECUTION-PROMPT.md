# AMS End-to-End Execution Prompt

**Repository:** Kapitech-Agency/kapitech-ams  
**Required delivery branch:** main  
**Canonical schedule:** docs/AMS-END-TO-END-DELIVERY-ROADMAP.md  
**Requirement inventory:** docs/AMS-FEATURE-CONTENT-GAP-REGISTER.md

## Copy-paste instruction

Act as the senior engineer responsible for completing Kapitech AMS end-to-end. The requested goal is not only to make navigation or UI look finished: carry current work through verified main content, complete supported business workflows, cross-module data integrity, security and regression tests, operational recovery, production readiness and live release verification.

Read AGENTS.md, docs/README.md, this roadmap, the gap register, the Master Structure, navigation IA, design system, current progress and implementation map, relevant domain specifications, E2E matrix, and current production runbooks. Inspect current main and current source/CI before deciding what remains. Read docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md and docs/AMS-STAGE-BY-STAGE-EXECUTION-CHECKLIST.md. Stage 4 must structurally re-architect each unfinished workspace from Kapitech's real tasks and canonical records, not merely polish or revise the current layout. Read docs/AMS-STAGE-BY-STAGE-EXECUTION-CHECKLIST.md as the detailed acceptance checklist; it supplements the roadmap and must not be treated as a competing schedule.

## Mandatory rules

1. Follow the stage order and exit criteria in docs/AMS-END-TO-END-DELIVERY-ROADMAP.md. That roadmap is the single canonical delivery sequence.
2. Do not start by rewriting everything. First audit actual current main and update the gap register. Preserve correct previous work, including already committed navigation, shell, Dashboard, Finance, Inbox, Projects/Tasks or other module improvements.
3. Execute one independently verifiable slice at a time. Within a module stage, handle one module or a clearly bounded worksheet/workflow slice at a time.
4. Send durable progress reports to the user at baseline, after each meaningful slice, at risks/blockers and every stage milestone. Include exact commit SHA, files, behavior, tests and results, remaining gaps, unverified states, and the next single task. Do not go more than one substantial uncheckpointed batch without reporting.
5. After reporting a routine slice, continue with the next task already covered by the user's approved end-to-end scope when safe. Do not stop and ask permission for every routine task. Stop at the explicit visual sign-off gate (Roadmap Stage 5), or when the user must decide a business/security/accounting rule, a destructive or production-sensitive action, an unresolved critical risk, or an actual scope change.
6. If a tool call times out or the work risks interruption, finish the smallest safe checkpoint, record whether it was committed/tested, and report a precise resume point. On resumption, re-fetch main, the changed files and current CI; never assume the previous HEAD is still current.
7. Commit verified checkpoints directly to main, as requested. Do not create a branch or PR, force-push, overwrite concurrent changes, or bypass repository protections. If direct-to-main is blocked, report the blocker.
8. Inspect real implementation. Target documentation is not proof. Distinguish verified complete, partial, missing, failing, not verified, target-only, provider/configuration blocked and deferred by release scope.
9. Keep the gap register, implementation traceability register and relevant progress roll-up updated as evidence changes. Never bulk mark a module complete based only on a shared component, build or screenshot.
10. Respect domain contracts. No new parallel CRM, Proposal or generic Approval module. Preserve the nine primary modules, the five Finance areas, canonical entity ownership, Finance calculations, record history, server-side permissions, private document controls and integration safeguards.
11. The full roadmap includes both frontend and later full-stack verification/remediation. Do not touch backend/API/schema/security/business logic during the visual stages as an opportunistic fix. At later authorized stages, make only scoped, reviewed changes with tests and migration/recovery plans where required. Do not change business rules or execute destructive/live-money operations without the applicable explicit decision and safeguards.
12. No false completion claims. A passing build is not E2E proof; a main commit is not deployment evidence; HTTP 401 from an authenticated readiness endpoint is not proof of readiness.
13. Breadcrumbs are an explicit cross-cutting requirement, not an optional afterthought. Track UX-NAV-BREADCRUMB-001 in the gap register; audit existing source first, implement conditionally on eligible detail routes, and verify parent links, permissions, title non-duplication, accessibility and compact layouts across Stages 2, 3, 4 and 5. Do not claim it is implemented until consumers and tests prove it.

## Required stage sequence

Follow the 16 numbered stages in the roadmap exactly:

0. Baseline and preserve historical work.
1. Approved navigation.
2. Shared shell and geometry.
3. Feature/content gap register.
4. Main-content hierarchy across all nine modules.
5. Visual, responsive and accessibility review with explicit user sign-off.
6. Workflow/data/API traceability.
7. Foundation gaps, security and data-integrity plan.
8. Core agency vertical workflows.
9. Finance quote-to-cash, purchase-to-pay and accounting integrity.
10. Integrations, event automation and provider-dependent features.
11. Security, privacy, reliability and performance hardening.
12. Full regression, E2E and UAT.
13. Data reconciliation, backup, restore and disaster-recovery proof.
14. Production readiness review and release authorization.
15. Deployment verification and stabilization.

These stages are not all one monolithic run. Proceed in bounded slices with reports and commits. The visual sign-off gate must be honored. Continue after routine reports when safe, but do not bypass user decisions or high-risk release gates.

## Required slice report

### Stage [N] / [Module or workflow slice] — [status]

- Verified result:
- Files and user-visible changes:
- Commit on main:
- Tests/CI actually run and their results:
- Existing work preserved:
- Remaining gaps and related gap-register IDs:
- Not verified / blocker:
- Next single task:

At a stage boundary, report whether its exit criteria passed, failed or remain unverified. Update the canonical progress/evidence documents and continue according to the roadmap only when the gate permits it.

## Production-ready definition

Do not declare production-ready until all mandatory product/workflow tests, Finance integrity checks, security/access controls, migration/reconciliation checks, backup/restore and private-document integrity checks pass; the authenticated `GET /api/system/production-readiness` returns HTTP 200 with `productionReady=true`; and the intended deployed release passes authorized live smoke tests. Provider-dependent integrations such as Kopra must either pass their independent readiness gate or remain disabled/out of the declared release scope with the user's agreement.

If any required gate is not verifiable, state **not yet production-ready** and identify the exact blocker.