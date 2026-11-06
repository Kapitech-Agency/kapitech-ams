# AMS Documentation Consolidation and Migration Map

**Status:** ACTIVE proposal with staged, non-destructive adoption. **Updated:** 5 November 2026.
**Important:** This document records validated overlap in accessible primary files and proposes safe migrations. It is not proof of a complete repository-wide duplication scan. No existing files are to be deleted or moved until recursive inventory, full link graph and unique-requirement checks pass.

## Decision matrix

| Family | Documents | Decision | Target owner | Preservation / validation |
|---|---|---|---|---|
| Governance | AGENTS, docs README, old multi-prompt instructions | KEEP entry points, add explicit authority matrix | AGENTS + governance matrix | Do not weaken agent security/deploy constraints |
| UX general | UX Interaction Standards; End-to-End UX Audit, Laws & Standards | KEEP bounded documents; deduplicate only repeated explanations incrementally | Interaction = actual UI application; UX Audit = research, laws, evidence, acceptance | Preserve exact component geometry only in Design System |
| Design / UI | Design System; Shared UI System; Drawer/Modal/Kanban | KEEP separate | Each component owner | Protect geometry, focus and domain rules |
| Content | Content Architecture Guidelines; Main-Content Restructuring Specification | CANDIDATE MERGE high-level anatomy into main-content spec, retain compatibility pointer | Main-Content Specification | Compare section-by-section, preserve §4.10 and role distinctions |
| Execution | End-to-End Prompt; Frontend-only Prompt; Frontend Structural Prompt; AI Phased Workflow | CONSOLIDATE authority, not delete specialized content blindly | End-to-End Prompt selects specialized scope; canonical Roadmap owns stages | Explicitly mark old prompts as supporting/legacy, verify unique prohibitions before replace |
| Roadmap | Delivery Roadmap; Stage-by-Stage Checklist | KEEP plan and checklist | Roadmap | Stage numbering must be identical |
| Progress | Structural Redesign Progress; Content-First Implementation Map; Execution Checkpoint | SPLIT current concise checkpoint from dated log; ARCHIVE dated slices after traceability validation | Execution Checkpoint + Gap Register | Logs can contain SHA-specific evidence required for audit |
| Requirements | Feature Content Gap Register; Implementation Traceability | KEEP both with unique roles | Gap = current requirements; Traceability = history/evidence | Link same requirement ID, avoid competing live status |
| Finance | Finance Excel Alignment; Finance Workspaces; five-area master taxonomy | KEEP separate; explain taxonomy/presentation | Finance Alignment (math); Finance Workspaces (UI) | Preserve 20 workbook IDs, Quotations and accounting controls |
| Domain | Projects/Clients/Inbox etc. specialist contracts | KEEP | Domain-specific docs | Do not merge into one generic UX document |
| Production | production runbooks; PostgreSQL historical/staging docs | KEEP segregated active vs history | docs README | Never treat historical JSON rollback as current procedure |

## Migration strategy

**Wave 0: secure pointers (safe)** — establish authority matrix, validation checklist and migration map. Cross-link these from `docs/README.md` and `AGENTS.md` without changing application. This is the current documentation-only operation.

**Wave 1: comprehensive inventory (prerequisite)** — recursively enumerate full repository HEAD, classify files, detect inbound links, parse headings and exact duplicated normative statements. Must inspect all source references and test/CI consumers.

**Wave 2: normative reconciliation** — resolve body-level current Dashboard/Inbox/Finance inconsistencies across master, navigation IA, main-content, roadmap and prompts. Preserve historical evidence but remove obsolete imperative language from current instructions. Requires current route implementation verification.

**Wave 3: content consolidation** — migrate only unique statements with heading-level traceability; replace redundant document with a stable, clearly labeled pointer or archive path after link checks. Avoid rewriting large files blindly.

**Wave 4: archival** — move immutable dated logs to a history hierarchy only with a complete inbound-link update; retain key commit/SHA/evidence references. No silent deletion.

**Wave 5: automated validation** — optional docs lint in CI after implementation and review; verify all paths, anchors and owners. Do not claim this was run until executed.

## Exit criteria per migration

1. Before/after heading and unique contract inventory attached.
2. Authority, version, status, target mapping and owner named.
3. Exact file SHA and concurrent change check.
4. All inbound and outbound links resolved; code/CI references not broken.
5. No Finance, RBAC, security, URL, workflow or test semantics lost.
6. History retained and current status not replaced by stale snapshot.
7. Relevant tests/checks executed; no invented pass.
8. Changes to `main` verified and summarized.

## Remaining blocker

A full recursive tracked-file tree and code-reference graph cannot be inferred from `docs/README.md`. Until it is available and inspected, destructive merges, renames and archival moves are **NOT VERIFIED** and should not be executed.

## Operational consolidation outcome — 5 November 2026

This consolidation keeps specialist documents intact and resolves overlapping authority through one centralized matrix, operative Dashboard/Inbox corrections, and a single canonical end-to-end entry point. Physical merging of long historical logs is **explicitly deferred**, because deletion or title-based merging does not improve correctness without a validated inbound-reference map and unique-requirement diff. Do not label deferred merge tasks as completed. Use `npm run docs:check` to assist local link checking, subject to successful execution on a checkout.

## Evidence checkpoint: verified documentation CI — 5 November 2026

The automated documentation integrity workflow passed on commit `ce00ba56ad0a0f2e3062b271454b7725f440f51a`, run https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/42007747437. It read 61 Markdown files, checked 219 supported Markdown links and 439 code/config files, and reported zero defects for its supported literal reference checks.

**Decision:** paths are eligible for continued content-level consolidation **review**, not for automatic deletion or relocation. This check establishes relative-link integrity for a bounded syntax, but does not prove that old documents lack unique active requirements, that non-literal inbound references are absent, or that user-approved UX requirements match the actual application. Consequently: retain existing paths and history until unique-requirement comparison and consumers are explicitly reconciled.


## Content comparison checkpoint — 5 November 2026

Four current UX documents were fetched completely and compared by heading and role, not just by filename:

| Document | Approx. characters | Unique durable function | Decision |
|---|---:|---|---|
| `AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md` | 23,617 | Compact page anatomy and nine-module *high-level* priorities, frontend-only guardrails | RETAIN as SUPPORTING; do not duplicate detailed views into this document |
| `AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md` | 74,395 | Nine-module actionable workspace structure, state requirements and section 4.10 relative hierarchy | RETAIN as canonical main-content specification |
| `AMS-UX-INTERACTION-STANDARDS.md` | 12,448 | Applied spacing ownership, navigation, tables/forms/overlays, component usage and responsive behaviors | RETAIN as current interaction application standard |
| `AMS-END-TO-END-UX-AUDIT-AND-QUALITY-STANDARDS.md` | 39,034 | UX laws, user research, nine-module audit protocol, usability measurements, evidence and acceptance | RETAIN as assessment and validation playbook |

**Comparison finding:** these files share vocabulary and repeated high-level UX principles but their principal required outputs, update cadence and exact operational rules are different. A wholesale merge would increase cognitive load and risk losing actionable contracts. Consolidation is therefore **normative-role consolidation**, not physical deletion: detailed page order belongs only in the Main-Content Specification, applied UI geometry in UX Interaction Standards under the Design System, and research/acceptance in the UX Audit Playbook. Link to the owner rather than recopying paragraphs.

**Evidence:** GitHub Actions `Documentation integrity` run https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/42008421422 passed at `decc5e36f90b`. Its result is a link integrity gate, not a semantic equivalence test. A full exact-paragraph and unique-contract diff of all Markdown files was not run. No historical file is approved for removal solely by this review.

## Execution document authority review, 5 November 2026

Full text and heading structures were inspected for the End-to-End Execution Prompt, Frontend Structural Redesign Prompt, Frontend-only UXUI Prompt, AI Phased Workflow, Resume After Interruption, and Execution Checkpoint.

Retain the End-to-End Execution Prompt as the canonical starting instruction. Retain the Frontend Structural Redesign Prompt as its specialized FE-only instruction. Treat the older Frontend-only UXUI Prompt as supporting background, not an independent stage schedule. Retain the AI Phased Workflow for bounded execution procedure, the Resume Protocol for interruption handling, and the Execution Checkpoint for dated evidence. The 215,578-character checkpoint contains history, not proof of current implementation.

These files have overlapping general rules but distinct purposes and evidence; deleting or merging them without unique requirement migration and consumer updates would be unsafe. Keep stable paths for now. Latest source and CI verification still controls claims about implementation. This review compared their full contents and section purposes, not every possible semantic duplicate.

## Final retention and governance decision, 5 November 2026

The repository-wide Markdown inventory, owner matrix, prompt comparison, UX document comparison and automatic literal/relative-link checks have now been established. The repository uses **selective consolidation of authority**, not wholesale physical file merges:

- **Normative:** End-to-End Execution Prompt, Roadmap, Master Structure, Navigation IA, Main-Content Specification, Design System, domain contracts, interaction standard and UX acceptance playbook remain separate with one named authority per area.
- **Supporting:** older content-first frontend prompt, content architecture guide and phased micro-step workflow remain read-only/reference materials under canonical owners; a reader must not obey a conflicting legacy stage schedule.
- **Dated evidence:** Structural Redesign Progress and Content-First Implementation Map are retained with explicit historical labels. Implementation Traceability is an evidence ledger; Execution Checkpoint is the resume context, not a live completeness certificate.
- **Production and sensitive business controls:** Finance/accounting, backend API integrity, data schema, roles and recovery runbooks remain dedicated normative documents. No such contracts are merged into UX prose.
- **Physical archive/move decision:** **NO MOVE / NO DELETE** at this checkpoint. Preserving stable historical paths is the approved safe migration outcome because long logs preserve SHA-linked evidence and Copilot/AGENTS/README links reference specific paths. A large rename/rewrite is not necessary to produce an unambiguous active reading order.

Entry point: `docs/README.md` now contains a task-based canonical reading-order table. `AMS-DOCUMENTATION-GOVERNANCE-AND-AUTHORITY-MATRIX.md` owns conflicts; `AMS-DOCUMENTATION-VALIDATION-CHECKLIST.md` owns evidence and QA. `npm run docs:check` runs in GitHub Actions, but it does not validate semantic correctness or current production readiness.

**Deliverable classification:** documentation governance and non-destructive consolidation **completed for reviewed contract families**. A full semantic line-by-line comparison across all historical content and runtime product readiness validation remain out of scope and must not be reported as completed. No documents were silently removed or merged.

## 6 November 2026 — explicit UX and documentation conflict register

| ID | Overlapping documents | Decision | Status |
|---|---|---|---|
| UX-01 | UX canonical / UX audit / interaction guide | Canonical owns design principles; UX audit owns test method; interaction guide owns applied mechanics | Authority reconciled, semantic dedup pending |
| IA-01 | Content Architecture / Main-Content Specification | Main-Content owns per-workspace order; Content Architecture is explanatory | Physical merge pending unique-content/inbound-reference verification |
| EX-01 | End-to-End / FE-only / Structural / Full redesign prompts | End-to-End is single default entry, roadmap sole global stage order; other prompts are scoped/historical | Authority reconciled, old paths retained |
| STATE-01 | Checkpoint / Progress / Content-First Map / Traceability | Checkpoint supports resumption, progress/map are historical, traceability records evidence; HEAD plus CI determines actual state | Retain unique evidence |
| DATA-01 | Old mock-data fallback / source-backed runtime policy | Runtime mock/dummy KPIs forbidden; display truthful unavailable state | Design System corrected previously |
| NAV-01 | Historical Performance/Inbox Overview / current presentation | Dashboard Overview+Analytics and Inbox Messages default | Current owner prevails |
| FIN-01 | Five Finance taxonomy groups / six rendered areas | Domain taxonomy and UI presentation are distinct | Keep separate |
| DOC-01 | Dated inventory / current docs structure | Inventory is a 5 Nov snapshot, not current file count | Re-inventory before destructive operations |

For every proposed deletion or physical merge: demonstrate unique-requirement migration, full Markdown/source inbound links and anchors, correct historical evidence retention, docs-check against exact SHA, and no protected domain edits. **No file is approved for unconditional deletion.**
