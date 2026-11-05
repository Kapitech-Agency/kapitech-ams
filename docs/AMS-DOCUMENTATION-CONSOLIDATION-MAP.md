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
