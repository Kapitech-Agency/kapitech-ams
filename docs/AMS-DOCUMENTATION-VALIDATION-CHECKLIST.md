# AMS Documentation Validation and Acceptance Checklist

> **Canonical UX/UI precedence (6 November 2026):** [AMS UX/UI, Visual Hierarchy and Usability Canonical Standard](AMS-UXUI-VISUAL-HIERARCHY-CANONICAL-STANDARD.md) governs cross-module UX principles, hierarchy, interactions and quality acceptance. This file retains only its documented specialist authority. Where older examples differ, follow the canonical standard without changing the approved business, token, or security owners.


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

## H. Verified operative instruction corrections — 5 November 2026

- Changed operative Stage 4 inventory in `AMS-END-TO-END-DELIVERY-ROADMAP.md`: Dashboard Overview + Analytics; Inbox Messages-first; Finance five-domain taxonomy/six rendered work areas.
- Changed operative `architecture/ams-navigation-information-architecture.md`: removed the retired Dashboard Performance and Inbox Overview from active workspace listing, retained the Finance domain taxonomy with an explicit presentation-contract pointer.
- This is documentation-only source reconciliation. It does not prove corresponding production routes or all indirect references were audited.
- GitHub repository code-search queries for three legacy documentation filenames returned no matches; **a zero search response is not a complete in-source inbound reference audit**.
- The previous 56-doc relative file target check does not validate Markdown fragment anchors or non-Markdown consumers. Full governance exit gate remains **PARTIAL**.


## I. Follow-up verification — 5 November 2026 (second pass)

- Recursive Git tree was retrieved again at `ace8589c796c5b62a978c627597cd5b19bac4955`: **505 tracked files and 61 Markdown files**; inventory baseline must account for the newly added inventory report.
- Checked `.github/copilot-instructions.md`, `.github/workflows/ams-ci.yml`, `.github/workflows/ams-quality.yml`, and `package.json` for explicit `docs/...md` references and documentation-specific test wiring.
- Copilot instructions have many **direct documentation dependencies**. These files must remain at their current paths until every reference is migrated. The two examined GitHub Actions files and package.json expose no literal `docs/...md` reference in this inspection.
- `package.json` exposes `ui:audit` and `ui:check`, but no dedicated `docs:check`, `markdownlint`, `remark` or `lychee` script was identified in this examination. **No CI documentation validation was executed.**
- Inspected the first 17 of 61 Markdown files for inline Markdown link fragments. No `[label](path#fragment)` instances were found in that subset. **This does not verify all anchor links**: bare URLs, HTML anchors, slug collisions, the other 44 Markdown files and references in code are unverified.
- Remaining gate: full file-to-file link and fragment extraction across the repository, canonical heading-slug matching, content-level duplicate comparison and active source/route validation. Status is **PARTIAL**, not completed.


## J. Markdown anchor-syntax inspection and normative overlap — 5 November 2026

- Enumerated all **61 Markdown files** in the current recursive `main` tree at the start of this checkpoint and successfully fetched each file, in five bounded batches.
- Searched every file for Markdown link forms containing a fragment (`[label](target#anchor)` or `[label](#anchor)`). **No operational Markdown links with a fragment were found**; one example `[label](path#fragment)` in this checklist is instructional text, not a real link target. As a result there are **zero fragment targets to resolve within that inspected syntax**.
- This is a limited *syntax-specific* result: HTML `href`, plain-text URLs, dynamically constructed references, reference-style Markdown links, heading-specific GitHub slug collision cases and external destinations were not validated by that expression. It is not a claim of full link correctness.
- Reviewed the scopes of `AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md`, `AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md`, `AMS-UX-INTERACTION-STANDARDS.md` and `AMS-END-TO-END-UX-AUDIT-AND-QUALITY-STANDARDS.md`. Added explicit authority notes to the first and third documents: content anatomy is SUPPORTING and §4.10 owns per-workspace order; UX Interaction Standards owns practical interaction application, while the UX Audit Playbook owns research/heuristics/acceptance. This is a **non-destructive authority consolidation**, not a line-by-line deduplication.
- No file moved, deleted or replaced. Broad source/CI text reference scanning, all Markdown link types, full duplicate-paragraph comparison, and live code/runtime alignment remain pending. Full release gate remains **PARTIAL**.


## K. Source-reference spot check and body-level consolidation — 5 November 2026

- Inspected tracked repository tree at `8cae1375a48c1dd0add205216ae166751c8f9c77`: 505 blobs, primarily TypeScript/TSX. Four `scripts/*.mjs` files, two GitHub workflows and `package.json` were checked for literal docs Markdown paths. The UI audit script explicitly refers to `docs/ui/shared-ui-inventory.json`; no Markdown path references were observed in these scripts/configuration files.
- `.github/copilot-instructions.md` continues to reference many specific documentation paths. **Do not rename/move/delete these files** without coordinated updates.
- Full-text scanning of all TypeScript/TSX/SQL/CSS files **was not performed**, so global inbound-reference verification remains outstanding.
- Resolved the outdated **active body content** (not just top warning) in `AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md` and `AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md`. Removed Dashboard Performance from active view lists and incorporated its valid comparison concepts into Analytics without discarding metrics/guardrails. Current navigation is Overview + Analytics.
- Scope: documentation only, no app or domain logic changes. Full documentation-consolidation acceptance stays **PARTIAL** until complete source reference and unique-requirement checks.


## L. Application-source reference sampling — 5 November 2026

- Git tree at `a7097af8a7bb47a443fff86eb32b35da1e4e500c`: 505 tracked files, including 284 TypeScript, 70 TSX, 56 SQL and 15 CSS files. Together these are **425 source files** subject to this repository-wide reference review.
- Successfully read **35 source files** in two small batches (first 18 matching TS/TSX/CSS/SQL in tree order, and first 17 under src/tests filtered from the same tree). Searched for Markdown filenames matching `(?:docs/)?[\\w-]+\\.md`. **No literal Markdown filename references were found in this 35-fetch sample.** Batches may overlap; this must not be reported as 35 unique files without deduplication.
- Repository search requests for selected documentation titles returned zero results, but this search cannot prove the full source set has no consumers.
- **Remaining:** inspect every one of the 425 tracked code files (including any overlap), literal and constructed path references, filenames in SQL/comments, plus anchor, templates and other source types. No rename, delete or merge of depended-on documents is authorized by this sample.
- This section is a coverage checkpoint, not a complete source scan. Consolidation gate remains **PARTIAL**.


## M. Continued source sampling and operative Analytics contract — 5 November 2026

- Extended source-text inspection with tree-order batches `35:52` and `52:70` (17 + 18 fetched files). Their literal `(?:docs/)?[\\w-]+\\.md` match counts were zero. Prior sampled batches may overlap. This is still not a certified 70-unique-file, 425-file recursive scan.
- Corrected four additional operative instructions in `AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md`: the formerly separate Performance subsection, comparison-region contract, the screen-composition table's Performance row, and module completion checklist now direct source-backed comparisons into **Analytics**, with no Performance tab.
- Re-read Master Structure, Main-Content Specification and Delivery Roadmap after change; the current core Dashboard navigation lists do not require a Performance tab. Mentions in top-of-file supersession notes remain intentional historical context.
- Remaining before destructive cleanup: enumerate all code-file inbound references, analyze all document unique requirements and duplicate paragraphs, and confirm active source/runtime navigation and CI. Overall **PARTIAL**.


## N. Continued source dependency audit — 5 November 2026

- Baseline `main` tree `65627731b5c80b21dc30ba12f94aa9c78e3f2434`: 425 tracked code files of extension TS/TSX/CSS/SQL.
- Inspected the 20 files in source-tree positions **70–89**, from `server/firebase-token.ts` through `server/postgres-lead-repository.ts`, successfully fetching each and searching literal Markdown names with `(?:docs/)?[\\w-]+\\.md`. **Zero literal matches** were found within these 20 files.
- This batch does not prove missing dynamic references, string concatenation, slash/backslash variants, or absence of links in the remaining code. Previous batches were sampled and may overlap; no completed whole-source audit is claimed.
- Documentation files still directly referenced from `.github/copilot-instructions.md` must remain stable. Do not archive/move/delete on the strength of the zero results above.
- Consolidation release gate remains **PARTIAL**. Continue with remaining source ranges; then compare normative sections for duplicates and trace unique requirements before a physical merge.


## O. Documentation verification utility — 5 November 2026

- Added `scripts/check-docs.mjs` with `npm run docs:check` to enumerate local Markdown, check common inline Markdown relative paths and GitHub-style heading slugs, and exit nonzero if broken references are detected.
- This is an initial local verification aid, **not yet proven passing on a checked-out full repository**. It does not cover all reference-style link syntax, HTML hrefs, dynamic imports, arbitrary text references, external HTTP URLs or semantic guideline conflicts.
- CI has not been modified to require it. Run the command in a full checkout and fix verified defects before enabling a mandatory CI gate.
- No deprecated docs renamed or removed. Complete source-level inbound-reference audit remains open; this is not an assertion that every file is safe to delete.

## P. Automated documentation verification in CI — 5 November 2026

- Created `.github/workflows/docs-check.yml` with Node 22, `actions/checkout@v4`, and `npm run docs:check`. It runs for documentation-related changes on push and pull requests, and supports manual `workflow_dispatch`.
- This creates an executable check inside GitHub's full checkout rather than requiring individual connector reads of all source files.
- **Execution result not yet retrieved:** this session could not access the Actions workflow-run collection through the available GitHub fetch endpoint. No successful CI run or zero-defect outcome is claimed. Consult GitHub Actions for authoritative pass/fail and logs.
- The script currently checks inline Markdown paths/anchors only, not semantic conflicts, all reference styles, all plain-text references, or every source-code consumer. Do not infer safe file removal from the check alone.
- Do not declare full documentation consolidation complete until workflow evidence is reviewed and remaining rule-uniqueness/source-consumer reviews are performed.


## Q. Full-checkout source-reference verification wired — 5 November 2026

- Extended `scripts/check-docs.mjs` to scan all local source/config files ending in TS, TSX, JS, JSX, MJS, CJS, CSS, SQL, JSON, YML, YAML and HTML for **literal `docs/...md` paths**, reporting missing targets as errors. The command runs under the new dedicated GitHub Actions documentation workflow.
- This replaces repeated partial manual connector samples with a reproducible local/full-checkout scan. It does **not** claim all dynamically constructed paths, non-literal file names, or all document semantics can be checked automatically.
- **Pass/fail remains unverified** until the workflow run results or a full-checkout command log are inspected. CI configuration present is not the same as CI passing.
- Moving/archiving referenced documents remains blocked until actual results, unique contractual content and migration mapping are inspected.


## R. Verified GitHub Actions execution — 5 November 2026

**Status of automated link and literal-source-reference check: PASS (for the syntax/classes supported by the checker).**

- Run: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/42007747437
- Trigger/branch/commit: push to `main` at `ce00ba56ad0a0f2e3062b271454b7725f440f51a`.
- Workflow: `Documentation integrity`, job `documentation`, completed **success**.
- Job log confirms `node scripts/check-docs.mjs` returned:
  - `markdownFiles: 61`
  - `checkedLinks: 219`
  - `codeFilesChecked: 439`
  - `docPathReferences: 2`
  - `issues: []`, `issueCount: 0`
- This supersedes earlier *unverified workflow execution* wording in sections P/Q, but does not upgrade the global documentation-governance release gate to PASS. The checker validates common inline relative paths, fragments and literal `docs/*.md` paths, **not** the uniqueness, correctness, chronology, contractual completeness, all dynamic/referenced links, external links, or implementation truth of Markdown prose.
- Physical deletion/moving of historical docs remains disallowed without unique-rule comparison and inbound-consumer migration evidence.


## S. Four-document UX content comparison — 5 November 2026

- Read all contents of the four UX documents: Content Architecture and Module Workspace Guidelines (23,617 chars), Main-Content Restructuring Specification (74,395 chars), UX Interaction Standards (12,448 chars), and End-to-End UX Audit and Quality Standards (39,034 chars).
- Recorded a role/heading-level content comparison and **RETAIN** decisions in `AMS-DOCUMENTATION-CONSOLIDATION-MAP.md`: supporting workspace anatomy, canonical per-view layout, interaction-application details, and evidence/testing playbook have distinct operational purposes.
- This is **not** a claim of an exhaustive line-by-line all-file duplicate or unique-contract diff. No document is deleted, relocated or merged.
- GitHub Actions documentation integrity check passed for commit `decc5e36f90b`, run https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/42008421422.
- Overall gate remains PARTIAL for semantic deduplication of the remaining documents and real app/role correctness.


## T. Consolidation closure checkpoint — 5 November 2026

**Closure decision:** governance reconciliation and safe non-destructive consolidation of reviewed documentation families is complete. A full repository-wide semantic proof or application production-ready certification is **NOT** claimed.

Verified:
- 61 Markdown files and 439 code/config files were scanned by passing GitHub Actions documentation integrity at `ce00ba56ad0a`; 219 supported Markdown links and two literal documentation path references, zero detected issues (https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/42007747437).
- A later documentation integrity run also passed at `63874d82e5e6` (https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/42008900688).
- Source-of-truth and task-based reading order are now in `docs/README.md` and the governance authority matrix.
- Active Dashboard and Inbox obsolete directives were corrected in key normative files; the five Finance domain categories and six Finance presentation areas are explicitly separated.
- Four evidence-heavy Markdown files carry explicit active/history roles instead of competing current-state instructions.
- A documented **retain rather than physically merge** decision preserves traceability and consumers; none of the four progress/evidence files was deleted or moved.

Not claimed:
- Exhaustive semantic line-by-line equivalence of all Markdown text and all embedded source contracts.
- Dynamic/reference-style/external links validated by current checker.
- Latest deployment, UI/UX, backend, RBAC or Finance production acceptance.
- GitHub Actions results for every subsequent commit until its specific run completes.

**Final documentation governance outcome:** reviewed-document authority consolidation ACCEPTED. **Full semantic and product readiness:** NOT VERIFIED. Revisit physical archival only with a concrete maintenance benefit and evidence-based no-loss migration.
