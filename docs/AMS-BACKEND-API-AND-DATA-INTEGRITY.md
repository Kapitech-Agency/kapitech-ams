# AMS Backend, API, and Data Integrity Standards

**Purpose:** Standardize server validation, authorization, API contracts, transactions, concurrency, persistence, idempotency and audit.  
**Status:** Engineering contract; inspect current architecture before applying a pattern.

## 1. Runtime source selection

server/data-source.ts supports json and postgres and defaults to json when KAPITECH_DATA_SOURCE is unset. README specifies postgres as the required production configuration. Source code alone cannot prove deployed mode.

Before storage/migration work:
1. Inspect server/data-source.ts, server/application-data-repository.ts, repositories, migration loader and README.
2. Verify authorized runtime configuration and readiness evidence.
3. Do not switch source, migrate live data, rollback or claim production mode from a default or old Markdown alone.
4. Never auto-fallback between stores after an error.

## 2. Route and API contracts

Follow the existing Express route/service/repository structure. For each endpoint document method/path, domain owner, authentication, permission, input validation, response envelope, error semantics, persistence effects, audit events, idempotency and tests.

Use the established API client/request helpers and response shape. Validate untrusted HTTP inputs at runtime; TypeScript and frontend validation are not server validation.

## 3. Authorization and security

- Authenticate before protected reads/mutations.
- Enforce permissions and record-level scope server-side.
- Validate both action and target record access.
- Preserve HttpOnly sessions, CSRF, MFA/TOTP, encryption, private document vault, backups and audit/readiness controls.
- Treat content, user input, filenames, callbacks and provider responses as untrusted.
- Sanitize errors/logs; never expose stack traces, SQL internals, secrets, tokens, bank credentials or unnecessary personal data.
- Keep audit integrity; do not let users rewrite their own audit evidence.

## 4. Validation and semantics

Validate IDs, relationships, enum transitions, money/date/currency fields, lengths/types and request size. Reject invalid input rather than guessing a business default. Distinguish missing, null, empty string, zero and false. Prevent mass assignment by explicitly allowing fields.

Use existing money/currency/date helpers. Do not create a divergent status calculator. Reporting periods require clear timezone and boundaries.

## 5. Transactions and concurrency

For related writes:
- Identify invariants and all records that must change together.
- Use current transaction facilities in the active storage layer.
- Protect concurrent duplicate creation with stable IDs, unique constraints/locks or reviewed safeguards.
- Respect existing version checks/conflict behavior.
- For external calls, model intent → submitted → confirmed/failed/unknown → reconcile; a DB transaction cannot roll back a bank transfer or public publication.
- Define recovery for partial completion.
- Do not rely only on disabled UI controls to prevent duplicates.

## 6. Idempotency/retry

Define stable identity and duplicate behavior for incoming messages/webhooks, lead/client conversion, quote/invoice generation, payment recording, bank transfer/status inquiry, statement import, journal source sync, CMS publishing and notifications.

A timeout after possible external success is unknown, not automatic failure. Query the approved status/reference before retry. Never blindly repeat bank transfers.

## 7. Audit

Record actor/service, action, target, timestamp, outcome and safe correlation/source reference under existing conventions. Redact sensitive fields. Preserve audit-chain integrity. A frontend event is not proof of a backend mutation.

## 8. Query and repository behavior

- Use existing repositories and parameterized queries.
- Apply deterministic ordering, pagination and validated filters.
- Do not return sensitive fields a role does not need.
- Add indexes only after query/migration review.
- Dashboard/Client 360 aggregate canonical sources; they are not secondary ledgers.
- Keep derived totals/status logic centralized.
- Unavailable/stale is not zero/empty.

## 9. Migration standards

- Never edit a migration that has shipped; add an ordered migration.
- Audit schema, write paths, counts, duplicates and relationship quality.
- Preserve IDs; produce deterministic migration/reconciliation output.
- Define rollout compatibility and recovery/rollback.
- Backfills must be safe to rerun or detect prior completion.
- Test against isolated production-shaped data before live operations.
- Reconcile financial totals, audit chain, private document integrity, CMS and notification parity as applicable.
- A schema/table does not prove the app uses it.

## 10. Finance integrity boundaries

- Preserve current formulas, account mappings, transaction history, quote-to-invoice conversion, journal controls, maker-checker and period-close rules.
- Distinguish quotation, contract, invoice issued, recognized revenue, payment request, confirmed movement and cash received.
- A bank movement linked to a payment is not a second receipt.
- Posted journal correction uses existing reversal/adjustment; closed-period changes use controlled close/reopen paths.
- Do not mark bills/invoices paid from unconfirmed requests.
- Source sync must not duplicate payment or journal entries.

## 11. Error contract and operation

Callers need to distinguish invalid input, auth/permission denial, missing record, business-state conflict, duplicate/idempotency conflict, version conflict, provider unavailable, unknown external outcome and internal failure. Use existing response contracts. Return actionable sanitized errors; retain safe correlation IDs in logs.

## 12. Acceptance checklist
- [ ] Current route/client/service/repository/schema inspected.
- [ ] Server validation and authorization tested.
- [ ] Canonical source and cross-module writes identified.
- [ ] Duplicate/concurrent requests safe.
- [ ] Version/history/audit behavior defined.
- [ ] Finance semantics preserved.
- [ ] Timeout/retry/recovery explicit.
- [ ] Migration/reconciliation/recovery documented where needed.
- [ ] Positive and negative API tests run.
- [ ] Integration/E2E/regressions passed or gaps reported.
- [ ] Runtime/provider assumptions verified rather than guessed.
