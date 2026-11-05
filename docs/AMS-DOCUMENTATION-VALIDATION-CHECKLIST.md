# AMS Documentation Validation and Acceptance Checklist

**Status:** ACTIVE. **Updated:** 5 November 2026. Documentation-only QA; does not imply product QA.

## A. Inventory gate

> **Evidence update (5 November 2026):** Recursive tree inventory completed at `a2858ce`'s parent `eb2e2f3b6929`: 504 tracked files, 60 tracked Markdown files (56 in docs), tree not truncated. All 56 docs Markdown files checked for relative Markdown file-target existence against that tree; none missing. See `AMS-DOCUMENTATION-INVENTORY-2026-11-05.md`. This is not proof of valid anchors, in-source references, all links, or no duplicate rules. Full release gate remains PARTIAL.


- [ ] Enumerate **all tracked files** from current HEAD tree recursively, not only README links; record docs root, nested folders, root policies, GitHub AI instructions, generated inventory and operational runbooks.
- [ ] Identify owner, purpose, status, file size, last meaningful revision, incoming/outgoing links and downstream tooling consumers.
- [ ] Classify each as ACTIVE, SUPPORTING, HISTORICAL, SUPERSEDED or ARCHIVED.
- [ ] Mark inaccessible/unreadable files as NOT VERIFIED, never assumed safe to delete.

## B. Structural validation

- [ ] One authoritative owner per requirement class, documented in `AMS-DOCUMENTATION-GOVERNANCE-AND-AUTHORITY-MATRIX.md`.
- [ ] Explicit scope and precedence for normative documents; no implicit order inferred from filename or date.
- [ ] No independent stage numbering in prompt/checklist that contradicts canonical 0–15 roadmap.
- [ ] A document that contains older snapshots labels the snapshot and links current status.
- [ ] Major reports keep current summary separate from immutable historical logs.
- [ ] New documents solve distinct maintenance/user problems; otherwise extend an existing owner.

## C. Content and conflict checks

- [ ] Search current and legacy terms, including Dashboard Performance, Inbox Overview, Finance five/six work areas, navigation depth, breadcrumb, reporting periods, filters, token dimensions, source-backed state, auth/MFA/RBAC, role visibility, finance posted/paid/reconciled, Stage 5 and production-ready.
- [ ] For each detected conflict, record both exact file paths/sections, requirement owner, actual code/data/test evidence and resolution.
- [ ] Correct the **operative body text** of actively normative documents where safe; a note at the top alone is a temporary compatibility measure.
- [ ] Do not delete historical claims; move snapshots to archival context after references verified.
- [ ] Never replace precise technical domain constraints with generic UX guidance.

## D. Links, syntax, migration safety

- [ ] Parse Markdown links, anchors and relative paths from every Markdown file.
- [ ] Check destination existence, case and anchor names; external links may need separate accessibility checks.
- [ ] Search all repository sources and scripts for references to renamed files; update consumers in the same change.
- [ ] Check tables, fences, YAML examples and headings for formatting/validity.
- [ ] Keep existing paths when complete consumer verification is unavailable.
- [ ] Compare before/after unique requirements and headings for silent loss.
- [ ] Do not overwrite concurrent authors: refresh blob SHA before GitHub updates.

## E. Runtime evidence and release boundary

- [ ] Implementation status matches current source, relevant tests, exact SHA and authorized runtime evidence.
- [ ] Unverified production behavior marked NOT VERIFIED.
- [ ] No fake verification count, fabricated test success, or invented data contract.
- [ ] No app/API/schema/auth/Finance changes made under documentation-only scope.
- [ ] Full test or lint claim only if executed with recorded exit status; Markdown checks alone do not verify app behavior.
- [ ] Commit and verify target file(s) on main when authorized. Report changed files, commit, remaining gaps and known link-verification limits.

## F. Recommended tooling, not yet assumed implemented

When a full repository checkout is available, create/extend a documentation lint script that enumerates all tracked Markdown, checks relative paths/anchors, detects duplicate instruction ownership, and outputs a deterministic JSON conflict inventory. Wire a non-destructive check to CI only after reviewing expected references and false positives. Do not claim such a script exists until its code/test are present.

## G. Release gate

PASS requires inventory + content + links + source mapping + documented exception decisions. PARTIAL means some checks are performed but unknowns remain. FAIL means broken normative links, unresolved conflicting active instructions or lost domain rules. Keep the current status **PARTIAL until a full recursive tree scan and dependent-source validation is completed**.
