# AMS Business Workflow State Machines

**Purpose:** Define valid transitions, guards, side effects, recovery, and cross-module implications.  
**Status:** Target behavior specification. Map conceptual states to current persisted enums before changing code.  
**Rule:** This document does not authorize schema rewrites or imply that every workflow is implemented.

## 1. State-machine principles

- Status is a business fact, not merely a label or color.
- Each transition has an actor, preconditions, persisted result, audit event and failure outcome.
- Server-side validation owns transition legality.
- Repeated requests must not repeat irreversible effects.
- External submission and external confirmation are different states.
- Preserve current enums/API contracts unless an explicit migration is approved.
- Preserve history for sent/accepted quotations, issued invoices, posted journals, signed contracts and closed periods.
- Removing generic Approval navigation does not remove workflow-specific review or maker-checker controls.
- Never infer business status from a click, route change, timer, optimistic state or generic HTTP success.

## 2. Lead and opportunity

Lead conceptual states: New, Unqualified, Qualified, Nurturing, Converted, Disqualified, Archived.

| Transition | Guard | Effect |
|---|---|---|
| Intake → New | Valid source/contact and deduplication | Store/link inquiry, source, owner and history |
| New → Qualified | Required qualification fields reviewed | Save evidence and next action |
| New/Qualified → Nurturing | Owner/follow-up plan exist | Create/link follow-up |
| Qualified → Converted | Valid destination account/opportunity exists | Link canonical identity; no duplicate company/contact |
| Active → Disqualified | Reason required under policy | Preserve source/activity history |
| Active → Archived | Permission/policy allow | Remove from active queues, retain history |
| Archived → Active | Authorized reopen | Reuse same record and retain archive event |

Opportunity target stages: New → Qualification → Discovery → Scoping → Quotation → Negotiation → Contract → Closed Won / Closed Lost.

- New: source/owner established.
- Qualification: need, service fit, timing and relevant stakeholders reviewed.
- Discovery: brief/meeting and decision process recorded.
- Scoping: deliverables, exclusions, assumptions, dependencies, timeline and pricing basis defined.
- Quotation: suitable quote version exists.
- Negotiation: changes to scope/price/terms/schedule are versioned.
- Contract: applicable agreement/SOW and closing checklist validated.
- Closed Won: commercial evidence and handover requirements complete.
- Closed Lost: reason captured; activity history retained.

Forecast change is not a journal posting. Closed Won is not invoice payment, recognized revenue or cash receipt. Reopening a closed opportunity preserves the prior close event.

## 3. Quotation lifecycle

Target states: Draft, Ready to Send, Sent, Accepted, Rejected, Expired, Superseded/Revision.

The current repository has proposal APIs, a Finance invoice shape with an optional quotation type, and accepted-proposal immutability tests. Inspect these contracts before changing data ownership.

| Transition | Guard | Effect |
|---|---|---|
| Draft → Ready to Send | Client, scope, price, terms, validity and configured tax rules validate | Preview and validation result |
| Ready to Send → Sent | Authorized sender confirms final version/recipient/channel | Preserve exact sent version and verifiable sent metadata |
| Sent → Accepted | Acceptance evidence links to the sent version | Link to contract/closing/billing plan exactly once |
| Sent → Rejected | Rejection outcome recorded | Preserve quote and opportunity history |
| Sent → Expired | Validity passes under approved date/time rules and state is eligible | Record expiry without rewriting history |
| Eligible version → Revision | Change to scope/price/terms requires new version | Sent/accepted version remains immutable |
| Superseded version → Read-only | New version replaces it | Preserve old file and audit history |

CRM and Finance must share one authoritative quote lifecycle. Do not blindly merge existing proposal/invoice records. Preserve stable IDs and conversion behavior. One quote may produce multiple milestone invoices. Quote acceptance alone creates no cash/journal event.

## 4. Contract, SOW, and change order

Conceptual contract states: Draft, In Review, Ready for Signature, Active, Expiring, Expired, Terminated, Superseded. Map to the implementation before changing values.

- Active/signed versions are not silently overwritten.
- Change orders link to the parent contract/SOW and identify scope, timeline, price and billing impact.
- Renewal links to a CRM opportunity without cloning account/contact.
- Documents remain canonical versions in Documents/private vault.
- Amendments preserve prior terms and effective dates.

## 5. Project handover and delivery

Handover conceptual states: Not Ready, Ready for Handover, Handover In Progress, Handed Over, Blocked.

Required evidence can include accepted quote/contract/SOW version, scope/exclusions, client/internal PIC, milestones, timeline, billing terms, dependencies, risks and files.

- Readiness requires actual records/evidence, not cosmetic checklist completion.
- Handover creates/activates a project once.
- Retry cannot create a second project.
- Post-handover scope changes use explicit change-request behavior.

Project states may include Planning, Active, On Hold, Completed and Archived; cancellation only if current policy/model supports it.

- Planning → Active requires validated scope, owner/team and start criteria.
- Active → On Hold records reason and schedule/resource impact.
- On Hold → Active rechecks dependency and availability.
- Active → Completed requires delivery/acceptance/closure conditions.
- Completed → Archived retains history.
- Reopening a completed project requires permission/reason and preserves the prior completion event.

The current Kanban guideline uses To Do → In Progress → Review → Done. Blocked/overdue may be derived views unless current persisted workflow defines them as statuses. Failed drag/drop restores server state. Passing a due date does not silently change the canonical stage.

## 6. Content and campaign

Target flow: Brief → Planned → In Production → Internal Review → Client Review → Revision Required → Approved for Publishing → Scheduled → Published/Confirmed → Reported.

- Revisions link to feedback and the asset/content version.
- Internal review and client approval are separate.
- Scheduled is not Published.
- Publication requires provider confirmation, verifiable integration evidence or explicit manual confirmation with actor/time.
- Campaign results carry metric definition/source/date range.
- Without publisher integration, use a truthful manual status.
- Retry cannot duplicate content or external publication.

## 7. Client lifecycle, retainer and SLA

Client onboarding conceptual states: Not Started, In Progress, Blocked, Ready for Kickoff, Active, Offboarding, Closed. Shared identity is used through conversion. Checklist items link to actual evidence. Offboarding keeps required history while restricting access.

Retainer conceptual states: Planned, Active, Limit Reached/At Risk, Closed, Renewal Due, Renewed.
- Usage derives from eligible time entries and explicit contract rules.
- Corrections trigger auditable recalculation where supported.
- Billing schedule is linked and idempotent.
- Overage is not invoiced without required commercial confirmation.

SLA requires defined target, calendar, pause rules, timestamps and priority. If evidence is insufficient, SLA is manual/limited/unconfigured, never fabricated.

## 8. People Operations

Leave conceptual states: Draft, Submitted, Under Review, Approved, Rejected, Cancelled, Withdrawn.
- Validate policy, dates, overlaps and eligible balance where configured.
- Enforce separation of duties where self-approval is prohibited.
- Approved leave updates availability after server confirmation.
- Cancellation preserves request/approval audit.
- Availability alerts do not silently move tasks or deadlines.

Onboarding/offboarding checklist completion requires real evidence. A checkbox alone cannot prove external account revocation. HR/contract/compensation/performance data remain restricted. Finalized training/performance history retains its version; a review status does not imply payroll/discipline action.

## 9. Expense, payable, invoice, bank, journal and close

Purchase/expense request conceptual flow: Draft → Submitted → Under Review → Authorized/Rejected → Ordered/Committed when applicable → Received/Recorded → Closed/Cancelled. Reimbursement may follow a distinct route. Approval does not mean payment.

The current InvoiceStatus in src/lib/financeStore.ts is draft, sent, partially_paid, paid, overdue, cancelled. Treat this as observed code, not permission to change the enum.

- Issue requires a validated invoice.
- Partial/full payment follows canonical payment rows and current Finance rules.
- Overdue derives from outstanding balance/due date and approved date semantics.
- Cancel follows existing controls and does not erase payment/audit history.
- Payment must be confirmed under current model to mark settled.
- Retries cannot duplicate invoices/payments.

Vendor bill conceptual states: Draft, Recorded, Due, Partially Paid, Paid, Disputed, Cancelled. Map against existing enums. A bill is not a payment; ambiguous duplicate invoices need review.

Bank transfer conceptual states: Draft, Ready for Review, Awaiting Authorization, Submitted, Processing, Confirmed Successful, Confirmed Failed/Rejected, Unknown/Pending Inquiry, Reconciliation Exception.

- Timeout after potential dispatch is Unknown, not assumed failure.
- Query the approved status/reference before retry.
- Never blindly resend uncertain transfers.
- Confirmed movement links to the canonical Finance event and does not duplicate a journal.
- Batch outcomes remain item-level; partial success is explicit.

Reconciliation links evidence, not a second ledger. Ambiguous matches stay as exceptions. Journal draft → authorized/posted follows current maker-checker controls. Posted journal correction uses reversal/adjustment. Period close uses existing gates and cannot be silently bypassed.

## 10. CMS and applicants

CMS flow: Draft → Validated → Published/Confirmed → Unpublished/Archived, mapped to current code. Verify public-source state before claiming success; publish retry is idempotent.

Applicant workflow is separate from CRM. Applicant CV/contact data is restricted; retention/deletion follows approved privacy policy.

## 11. Cross-module side-effect ledger

| Event | Expected effect | Must not happen |
|---|---|---|
| Inquiry received | Link/create Inbox thread and eligible CRM lead | Duplicate lead on retry |
| Opportunity Closed Won | Prepare onboarding and project handover | Duplicate project/account/contact |
| Quote accepted | Update quote and prepare billing plan | Cash/journal creation from acceptance alone |
| Invoice issued | Update AR under current rules | Mark as paid |
| Payment submitted | Track request/reference | Assume settlement |
| Bank confirms payment | Link source payment/reconcile | Duplicate receipt/journal |
| Bank mutation imported | Match candidate to Finance event | Duplicate imported event |
| Leave approved | Update availability/show conflict | Silent reassignment |
| Time entry validated | Update eligible effort/retainer usage | Double counting |
| Contract nearing expiry | Link/create renewal follow-up | Duplicate renewal opportunity |
| CMS publish confirmed | Update publication state | Claim based on click/timer |

## 12. Required transition tests

For each implemented transition, test actor/permission, preconditions, persisted state, audit evidence, invalid input, denial, stale/concurrent conflict, duplicate submit, provider failure/timeout, retry/recovery, correct cross-module link, and no duplicate side effect.
