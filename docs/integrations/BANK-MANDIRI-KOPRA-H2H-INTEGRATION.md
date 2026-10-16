# Bank Mandiri Kopra Host-to-Host Integration Specification

**Integration status:** Planned; no bank-issued technical API contract is included in this repository.  
**Purpose:** Prepare AMS architecture and safe implementation requirements.  
**Restriction:** Do not invent endpoints, payloads, authentication formats, signatures, certificates, callbacks, status codes or credentials.

## 1. Official public capability references

Bank Mandiri's public materials describe Kopra Host to Host as API integration between the bank and a company's ERP/internal system. Publicly described feature families include balance inquiry, transaction status/history, beneficiary-name inquiry, transfers within Mandiri, interbank transfer rails such as SKN/RTGS/BI-FAST subject to service, foreign-currency transfers where enabled, payroll, and bill-payment inquiry/payment.

The bank describes an application/agreement process, supporting documents, application development and testing with the bank, and customer-specific feature selection. SNAP governance applies where the service uses SNAP specifications. These pages do not prove Kapitech eligibility or that any capability is enabled.

Official starting points to re-verify:
- https://www.bankmandiri.co.id/en/kopra-host-to-host
- https://www.bankmandiri.co.id/variant-kopra-host-to-host
- https://www.bankmandiri.co.id/mandiri-h2h-payment
- https://www.bankmandiri.co.id/documents/20143/576636849/RIPLAY%2BKopra%2BHost%2Bto%2BHost.pdf/c3f63e6e-4eaa-bc44-d5cb-2f4150e42e02?t=1780757350218&version=1.0
- https://www.bankmandiri.co.id/en/mandiri-api
- https://www.bankmandiri.co.id/en/mandiri-api/syarat-dan-ketentuan

Public product descriptions are not the API contract. Obtain the current bank-issued technical specification, agreement, sandbox details and enabled-feature list before implementing the connector. Bank documentation mentions sandbox testing and certification before production for applicable API services.

## 2. Navigation ownership

**Finance → Cash Management**
- Bank Accounts
- Bank Transactions & Reconciliation
- Bank Mandiri Kopra H2H
  - Kopra Overview
  - Balance Inquiry
  - Transaction Inquiry & Mutations
  - Beneficiary Name Inquiry
  - Transfers & Payments
  - Payment Queue & Batch
  - Transaction Status & Exceptions
  - Bank Reconciliation
  - Bank Mapping & Rules
  - Transaction History & Audit

**Settings → Integrations → Bank Integrations → Bank Mandiri Kopra H2H**
- Environment/connection state.
- Secure credential/certificate configuration.
- Account mapping.
- Connection testing.
- Synchronization/checkpoint status.
- Callback setup only if supported.
- Redacted diagnostics.
- Configuration audit.
- Explicit enable/disable control.

Finance handles everyday transactions/reconciliation. Settings handles restricted technical configuration. Kopra is not a separate primary sidebar module.

## 3. Feature enablement registry

| Capability | Target preparation | Required activation evidence |
|---|---|---|
| Balance inquiry | UI/service boundary and freshness indicators | Enabled account, exact response fields and sandbox evidence |
| Transaction/status inquiry | Query/history view | Reference/date-window/pagination/status contract |
| Beneficiary name | Pre-transfer validation | Contracted service and mismatch semantics |
| Mandiri transfer | Payment execution | Approved API, permission/limits, beneficiary rules and final status behavior |
| Interbank transfer | Optional rails | Supported rail, fees/cut-off, references and final status |
| Foreign currency | Optional future capability | Allowed currency/account/rail and FX/fee rules |
| Bill payment | Optional | Supported biller/product and inquiry/payment contract |
| Payroll | Restricted option | Explicit approval, employee-data permissions, batch rules and testing |
| Mutation sync | Ingestion/reconciliation | Stable IDs, paging, checkpoints and history limits |
| Callback/webhook | Only if supported | Official schema, signature, retry, replay and network rules |

A menu/config row does not mean a provider capability is active.

## 4. Required bank onboarding package

Obtain the enabled feature list/agreement, current spec/version, sandbox access, production certification criteria, authentication/signature/encryption/certificate requirements, request/response schemas, validation and error codes, final/pending/unknown status semantics, idempotency/reference rules, callback contract if available, account/beneficiary rules, limits/cut-off/currencies/fees/rails, IP/network requirements, rate limits/timeouts/history windows/pagination, applicable SNAP requirements, test cases/UAT evidence and escalation contacts.

If a critical item is absent, document the exact blocker and do not guess.

## 5. Connector boundary

Use a server-side provider adapter in the existing backend architecture. The browser must never call the bank using private credentials.

Logical flow:
1. Existing Finance payment request is the origin.
2. Permission, limits, budget and beneficiary checks determine eligibility.
3. Store a safe correlation reference.
4. Server connector builds/signs the request exactly as the official spec requires.
5. Record normalized state and safe provider reference.
6. Query status/callback according to contract.
7. Link bank movement to the canonical Finance transaction.
8. Reconcile and route unmatched/ambiguous movements to exceptions.
9. Apply existing accounting rules without duplicating financial events.
10. Audit/monitor without storing unnecessary secrets or raw sensitive payloads.

These are logical responsibilities, not a prescribed number of new tables/services.

## 6. Status and timeout semantics

AMS must distinguish Draft/Not Submitted, Awaiting Review/Authorization, Submitted/Processing, Confirmed Successful, Confirmed Failed/Rejected, Unknown/Awaiting Inquiry, and Reconciliation Exception. Map actual bank statuses only after reviewing the contract.

On timeout after potential dispatch:
1. Preserve the safe internal correlation/request record.
2. Mark the outcome unknown, not automatically failed.
3. Query status using the supported bank reference/process.
4. Never blindly resend an uncertain transfer.
5. Retry only if documented idempotency/reference rules make it safe.
6. Keep unresolved outcomes in an authorized exception queue.
7. Browser refresh/double-click must not create a second instruction.

Batch outcomes are tracked per item. Batch acceptance is not proof that all transfers succeeded.

## 7. Security and permissions

- Reuse AMS auth/session/CSRF/RBAC.
- Separate create/edit/submit/authorize/inspect/resolve when policy requires.
- Enforce all permissions server-side, including account and record scope.
- Preserve maker-checker separation where required.
- Secrets/private keys/certificates use approved server-side secret storage and are never revealed after saving.
- Redact credentials, signatures, account identifiers and sensitive payload fields from logs/errors.
- Protect against replay, duplicate callbacks, request tampering, object-access bypass and resubmission.
- Use transport security, certificate validation and allowlisting exactly as bank requirements specify.
- Audit configuration, submission, authorization, exception resolution and reconciliation overrides.
- Emergency disable prevents new submissions without falsifying history.

Do not invent cryptography or disable certificate validation to make requests work.

## 8. Accounting/reconciliation boundaries

- Payment request is not a cash movement.
- Submission is not confirmation.
- Confirmed bank movement links to the existing Finance event.
- A bank feed cannot create a second receipt/payment/journal for the same event.
- Distinguish balance types only if provided by the API; show source and last successful timestamp.
- Amount/date similarity is not sufficient for automatic matching when multiple candidates exist.
- Manual overrides require permission, reason, actor, timestamp and audit.
- Unknown fees/credits/debits, returns, timing differences and ambiguous matches remain visible exceptions.
- Monthly close uses existing Finance controls, not a separate Kopra ledger.

## 9. Rollout gates

Before sandbox development: agreement/spec, access, feature list, network/auth requirements and canonical Finance relationships are available.

Before UAT: test success/rejection, invalid input, timeout/unknown, retry/duplicates, delayed status, callback replay if supported, partial batch, ambiguous reconciliation, fees/returns, downtime and unauthorized actions. Reconcile Finance/journal linking; isolate fixtures; document runbook/alerts.

Before production: required bank sign-off/certification, secure production config by an authorized operator, role/limit/beneficiary/status/reconciliation/recovery tests, approved real-money test plan, rehearsed disable/rollback, and explicit feature enablement.

Deploying the UI does not activate payment execution.

## 10. Test requirements

Test valid/invalid inquiry, stale feed, duplicate import/callback, beneficiary mismatch, processing/success/rejection/unknown, timeout inquiry, duplicate submission, partial batch, provider downtime/rate limiting/certificate expiry, unauthorized submit/authorize/resolve, manual match audit, canonical Finance payment/journal linkage and secret redaction. No live transaction in ordinary CI.

## 11. Known blockers
- No bank-issued technical contract is committed to the repository.
- Exact endpoints, schemas, signatures, certificates, callbacks and status semantics are intentionally unspecified.
- This documentation task did not verify Kapitech eligibility, credentials, sandbox, production connector or live account.

Until resolved, label the connector planned or sandbox-only according to evidence. Never present it as a live bank connection.
