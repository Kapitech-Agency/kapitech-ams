# AMS Feature & Content Gap Register

**Status:** Initial structured register — latest-code audit required before any item can be called missing or complete  
**Last updated:** 19 October 2026  
**Repository:** `Kapitech-Agency/kapitech-ams`  
**Current-state authority:** Current `main`, current source/tests/CI, and authorized runtime evidence  
**Sequence authority:** [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md)

> This register is the working inventory of what must be verified for a complete AMS release. It is deliberately **not** a claim that all listed features are missing. Previous navigation, shell, Dashboard, Finance, Inbox, Projects and other changes must be inspected and carried forward before assigning status. Target specifications are not proof of implementation.

## 1. Status vocabulary

Use one status for every requirement and attach evidence:

| Status | Meaning |
|---|---|
| Verified complete | Current code and the relevant tests or operational evidence demonstrate the requirement. |
| Partially complete | A material part works, but at least one acceptance criterion is not met. |
| Missing | Current-source audit confirms the required capability is absent. |
| Failing/regressed | Existing behavior or a required test demonstrably fails. |
| Not verified | Evidence is insufficient; do not infer completion or absence. |
| Target-only | A documented design that has not been approved for implementation yet. |
| Provider/configuration blocked | Requires external contract, credentials, environment or certification. |
| Deferred by release scope | Intentionally excluded from the current release and explicitly agreed by the user. |

Do not use “done” without a requirement-level evidence reference. “Not verified” is the default until the latest source/test or runtime evidence is checked. A status copied from an old progress note must be revalidated.

## 2. Required record for each gap

For every module, worksheet, feature and cross-module workflow, capture:

- Requirement ID and canonical owner module/workspace/worksheet.
- User/persona and primary task.
- Current status and the latest commit/source/test/runtime evidence.
- Desired outcome / acceptance criteria.
- Existing implementation to preserve and observed defect/gap.
- UI/content fields, filters, actions and data states.
- Canonical entity, source of truth, current API route and persistence owner (where relevant).
- Role/access requirement as observed in current policy; presentation never grants permission.
- Workflow states, preconditions, side effects, audit, duplicate/retry/concurrency and recovery behavior.
- Dependencies, affected modules, frontend/backend/data/security/provider scope.
- Test evidence required and current result.
- Priority, blocker/decision owner, next action and related roadmap stage.

Keep one canonical requirement ID per capability. Link consuming modules to it rather than creating duplicate feature records.

## 3. Initial module coverage inventory

The rows below identify the **minimum audit scope**, not a claim about the current implementation status. During Stage 0–3 of the roadmap, split them into granular requirement IDs and attach source/test evidence for each workspace.

| Module | Workspaces and content requiring verification | Cross-module/data contract to trace | Minimum acceptance focus |
|---|---|---|---|
| Dashboard | Overview, Performance, Analytics; metrics, project/delivery context, trends, exceptions, recent activity and drill-downs | Canonical source modules; period/timezone; revenue vs invoice vs cash vs costs/profit/receivables/balances | No invented values; meaningful labels/units/period/source; unavailable is not zero; drill-down opens owner |
| Inbox | Overview; Messages and categories/saved views; Follow-ups; Routing & Templates where supported; detail/thread actions | Canonical message/thread; source inquiry; linked client/project; assignee, follow-up, notifications; no duplicate CRM/request queue | Correct owner/status/priority/due date; query state; safe resolve/archive/retry; applicant workflow remains in CMS |
| Projects | Overview; Project Registry; Tasks & Execution; Planning & Delivery; Content & Campaigns; Project Resources; Project Controls as supported | Client/contract/quotation handover; canonical project/task/deliverable; team capacity/time; Documents links; Finance summary | Route/view clarity; board/list parity; milestone/dependency/QA/revisions; truthful progress and cost semantics; idempotent handover |
| Clients | Directory; Onboarding; Agreements; Service & Health; detail/360 views | Canonical company/contact; Inbox-owned requests; Finance quotation/invoice/payment; project ownership; contract, retainer and SLA | One client identity; linked records; checklist evidence; versioned agreements/renewal; SLA values only where configured |
| Finance | Overview & Control; Transactions & Cash; Receivables & Payables; Project Finance; Accounting & Reports; existing worksheets including quotations | Canonical quotation, invoice/payment, expense/vendor bill, bank transaction, journal, chart of accounts, periods and source links | Preserve formulas and worksheet keys; balances and statuses reconcile; duplicate-safe quote-to-invoice/payment/journal; controls remain enforced |
| Team & Resources | Team & Capacity; People Operations; Vendors & Freelancers; Time & Availability, as supported | Canonical team identity; restricted employment/leave/training/performance; Projects capacity; Finance vendor and costing; Client retainer usage | Role and record privacy; approved leave affects availability safely; capacity/time semantics; no silent assignment/date changes |
| Documents | Register/search, detail, versions, secure upload/download/preview and linked business records | Private vault/object storage/integrity metadata; owner record in Finance/Clients/Projects/CMS/People Ops | Authenticated authorization; object/checksum integrity; version/history; safe errors; no public/private leakage |
| Website CMS | Each actual content type/editor/register, publication states, Careers jobs, Careers Applicants | Canonical public content state; actual publisher/provider; restricted applicant personal data; Documents where linked | Draft/validation/publish confirmation; provider/manual status truthful; safe versions; applicants not duplicated in Inbox or CRM |
| Settings | Actual groups for profile/account, roles/access, security/MFA, audit, integrations, notifications and system state where implemented | Server-side authorization, audit services, secret/config storage, provider readiness and production gate | Restricted settings; secret never revealed; save/error state accurate; audit/impact/confirmation for sensitive changes |

## 4. Cross-module workflow register

Each journey must be broken down into individual transitions and linked requirement IDs in the maintained implementation traceability register.

| Workflow | End-to-end scope to verify | Failure/recovery cases that cannot be omitted |
|---|---|---|
| Inquiry to client/project | Public/inbound inquiry → Inbox → qualified existing compatible record if required → Finance quotation → agreement/terms → onboarding/handover → canonical project | Duplicate inquiry/conversion, missing terms/evidence, permission denial, failed/partial handover, retry |
| Project delivery | Plan/scope → milestones/tasks/resources → work/review/revisions → client acceptance/closure → related documents and reporting | Concurrent edit, invalid transition, drag/drop rejected, overdue/blocker, source unavailable, reopening history |
| Quote-to-cash | Versioned quotation → accepted/rejected/expired → valid billing terms → invoice → AR → payment → bank evidence if enabled → reconciliation → journal/report/close | Duplicate invoice/payment/journal, partial payment, unconfirmed request, unknown bank outcome, closed-period control |
| Purchase-to-pay | Expense/purchase request → policy/budget → required authorization → bill/expense → AP → authorized payment → bank/reconciliation → accounting | Duplicate bill/request, authorization conflict, budget exceeded, partial batch, transfer unknown/failed, recovery |
| Client lifecycle | Onboarding → contract/SOW → retainer/SLA → service/project links → renewal/offboarding | Missing evidence, overlapping dates, renewal duplicate, restricted record access, preserved history |
| People-to-capacity | Person/contract status → leave approval → availability → assignment → time entry → capacity/retainer/cost reporting where supported | Self-approval where prohibited, stale balance, conflicting leave/assignment, time-entry duplicate |
| Content-to-campaign | Brief/calendar → asset/version → internal review → client review/revisions → approval → schedule → publish confirmation → performance source | Failed/unknown publish, duplicate post, approval/version mismatch, metrics missing/stale |
| Document lifecycle | Upload → validation/authorization → durable storage/integrity → version/link → retrieve/export → retention/recovery | Object-store outage, failed write, unauthorized ID/reference, checksum mismatch, partial restore |
| Notification/automation | Domain event → valid subscription/rule → delivery/action → status/audit → safe retry/replay | Duplicate event, misconfiguration, secret error, permanent vs transient failure, bounded retry |
| Kopra H2H, if in release scope | Eligible payment request → validation/authorization → provider submit → inquiry/status → canonical Finance update → reconciliation and accounting | Unknown result after timeout, no blind retry, duplicate transfer, partial batch, provider unavailable, credential expiry |

## 5. Cross-cutting acceptance checklist

For every applicable requirement, record evidence for each dimension rather than relying on screenshots or build success alone.

- [ ] Owner module, route and canonical record are unambiguous.
- [ ] Purpose/content order, label/field meaning, units, currency and period are clear.
- [ ] Current state exists in source and maps to the documented target; no invented values.
- [ ] Supported actions reach the correct handler and report truthful outcomes.
- [ ] Server-side access policy and record scope remain enforced.
- [ ] Validation and legal/invalid state transitions are covered.
- [ ] Duplicate submission, retry, concurrency and stale update behavior are safe.
- [ ] Side effects across modules are correct, traceable and idempotent.
- [ ] Loading, empty/no-match, stale/unavailable, denied, validation/error, pending and success states are appropriate.
- [ ] Keyboard/accessibility and responsive behavior are tested where relevant.
- [ ] Automated tests and relevant end-to-end journey provide evidence.
- [ ] Operational implications, monitoring, backup, recovery and support ownership are defined where relevant.

## 6. Priority and dependency rules

Rank gaps by:
1. Production/security/data-integrity blocker.
2. Broken approved navigation or critical user journey.
3. Financial correctness, record duplication, authorization or lost-data risk.
4. Missing canonical data/API dependency needed by multiple modules.
5. Main-content clarity and high-frequency workflow friction.
6. Reliability, accessibility, responsive behavior and operational support.
7. Lower-impact polish or explicitly deferred enhancements.

A shared dependency should be fixed before its dependent modules. Never prioritize a decorative UI fix over a release-blocking data/security defect in the production readiness stages. During the visual-first stage, however, do not expand scope into unapproved backend changes; record those dependencies for the later authorized stage.

## 7. Evidence and updates

- Update this register as meaningful slices are completed; do not bulk-mark a module complete from one test.
- Reference current commit SHA, file/line or route/test, CI run, runtime evidence or accepted decision.
- If evidence is historical, label it historical and recheck current `main`.
- Keep the progress roll-up in `docs/AMS-STRUCTURAL-REDESIGN-PROGRESS.md` for structural UX/UI slices and `docs/AMS-IMPLEMENTATION-TRACEABILITY.md` for feature/workflow requirement IDs and evidence.
- Before a stage is closed, audit rows for that stage and identify remaining unverified/blocked items. No missing evidence is interpreted as success.
- Do not claim production readiness until Stage 14's operational gate and Stage 15's deployment verification pass.