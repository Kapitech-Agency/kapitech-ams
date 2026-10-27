# AMS Design System

**Product:** Kapitech Agency Management System (AMS), a production-grade internal tool for running the agency: clients, projects, tasks, team, finance, and a private document vault.
**Repo:** `Kapitech-Agency/kapitech-ams` (React 19 + Vite + TypeScript + Tailwind CSS v4, Express API).
**Users:** agency staff and managers day to day; privileged **Master** and **IT** users for system, backup, and security tasks.
**Direction:** dark-first, data-dense, calm, trustworthy. Crimson is the single accent and is used sparingly.

> **For the AI agent:** this file is the source of truth for every UI you build in this repo. Use the tokens exactly as written. Do not invent colors, radii, fonts, or spacing values. If something is missing, extend the system in the same spirit and say what you added.
>
> **Before writing code, inspect the repo** (`src/index.css` or the current theme file, `src/components`, `src/lib`, existing pages). If tokens or components already exist, **map them to the names in this file and migrate incrementally**. Do not create parallel duplicates. Report any conflicts instead of silently overwriting.

> For consistent page hierarchy, margin/padding ownership, spacing application and interaction-level review, also follow `docs/AMS-UX-INTERACTION-STANDARDS.md`. For the target module taxonomy and workflow ownership, use `docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md`; this design system remains the source of truth for exact visual tokens and component appearance.

> **Architecture documentation boundary:** This file is authoritative for visual tokens, page geometry, shared UI primitives, and interaction rules. It is not the authority for the current module taxonomy or proof that a feature has shipped. Read [AGENTS.md](AGENTS.md) for AI change rules and [the AMS master structure guide](docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md) for target navigation/workflows. Check route examples and feature status against the master guide and actual source; never create a parallel design system.

---

## 0. Repo context

Verified from `README.md` and `package.json`:

| Area | Fact | What it means for UI work |
|---|---|---|
| Frontend | React 19, Vite 6, TypeScript, `react-router-dom` v7 | Function components, typed props, `NavLink` for nav active state |
| Styling | **Tailwind CSS v4** via `@tailwindcss/vite` | Define tokens in CSS with `@theme`. There is **no** `tailwind.config.js`. |
| Helpers | `clsx`, `tailwind-merge` | Use a `cn()` helper (`twMerge(clsx(...))`). Reuse it if it already exists in `src/lib`. |
| Icons | `@untitledui/icons` via `src/lib/untitled-ui-icon-bridge.tsx` | The only icon set. Existing `lucide-react` imports are routed through the Vite alias to this official Untitled UI bridge; keep using the bridge and add missing mappings there. |
| Motion | `motion` (`import { motion } from "motion/react"`) | Not `framer-motion` |
| Search | `fuse.js` | Client-side fuzzy search, e.g. the ⌘K palette |
| Charts | **No chart library installed** | Build small SVG chart components, or propose a dependency and justify it before adding |
| UI kit | **No shadcn/ui, no Radix** | Build components in-house. Handle focus and keyboard behavior yourself. |
| Backend | Express API, PostgreSQL (`pg`), HttpOnly session cookies, CSRF, TOTP MFA | UI must never handle secrets and must respect roles and CSRF flows |
| Quality gates | CI runs `npm ci`, `npm run lint` (`tsc --noEmit`), `npm run build`; tests use `node --test` | Every change must pass lint and build |
| Optional integrations | Gemini (AI), Telegram notifications | See the AI and notification patterns in section 8 |

**Reconciled against the current repository:** token values live in `src/index.css`; shared admin primitives live in `src/components/admin/AdminModulePrimitives.tsx`; reusable UI controls live in `src/components/ui`. Extend these implementations instead of duplicating them. If a token or component conflicts with this document, update the document and implementation together.

---

## 1. Principles

1. **Data first.** The most important number on a screen is the largest thing on it. Chrome stays quiet.
2. **One accent.** Crimson marks the primary series, the active nav item, the primary button, and focus. If everything is crimson, nothing is.
3. **Borders over shadows in dark mode.** Depth comes from 1px lines and slightly lighter panels.
4. **Color is never the only signal.** Status always pairs color with an icon or text.
5. **Security is visible but calm.** Sensitive actions are explicit, confirmed, and clearly labeled. Nothing sensitive is ever exposed in the UI or stored client-side.
6. **Consistent vocabulary.** The same action has the same name everywhere.
7. **Density with breathing room.** Compact rows, generous space around cards and sections.

---

## 2. Design tokens

### 2.1 Color: neutrals and surfaces

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#09090c` | `#f4f4f7` | App background |
| `--panel` | `#0f0f14` | `#ffffff` | Sidebar, cards |
| `--line` | `#20202a` | `#e3e3ea` | Borders, grid lines, dividers |
| `--text` | `#f3f3f6` | `#16161c` | Primary text, KPI numbers |
| `--muted` | `#8b8b99` | `#6c6c7a` | Labels, axis text, secondary text |

### 2.2 Color: crimson accent

| Token | Hex | Use |
|---|---|---|
| `--crimson-50` | `#fff1f3` | Light-mode tint backgrounds |
| `--crimson-100` | `#ffe0e5` | Light-mode hover tint |
| `--crimson-300` | `#ff9dac` | Secondary chart tint |
| `--crimson-400` | `#e83252` | **Accent text/icons on dark backgrounds** (`--accent-text`) |
| `--crimson-500` | `#dc143c` | **Brand accent**: buttons, primary series, active indicator (`--accent`) |
| `--crimson-600` | `#c40f34` | Button hover; accent text on light backgrounds |
| `--crimson-700` | `#a10c2b` | Button pressed |
| `--crimson-900` | `#5c0819` | Deep tint backgrounds in dark mode |

Rules:
- Text on a crimson-500 fill is white (contrast about 5:1).
- On dark backgrounds, crimson **text or thin icons** use `--crimson-400`, since 500 is too dim at small sizes.
- Tinted fills use `color-mix(in srgb, var(--accent) 14%, transparent)` (selected nav) or `8%` (subtle highlights).

### 2.3 Color: data and status

| Token | Dark | Light | Meaning |
|---|---|---|---|
| `--series-1` | `--accent` | `--accent` | Primary metric (e.g. revenue) |
| `--series-2` | `#34d399` | `#12a672` | Positive/health metric (e.g. on-time delivery) |
| `--series-3` | `#5b8cff` | `#3b6fe0` | Contrast metric (e.g. expenses, backlog) |
| `--series-4` | `#b9b9c6` | `#8a8a98` | Reference/neutral metric (targets, baselines) |
| `--success` | `#34d399` | `#12a672` | Paid, done, healthy |
| `--warning` | `#f5a524` | `#b7791f` | Due soon, expiring |
| `--danger` | `#f97066` | `#d92d20` | Overdue, failed, destructive |
| `--info` | `#5b8cff` | `#3b6fe0` | Neutral information |

**Crimson is the brand accent, so it must not be used for errors or negative states.** Use `--danger` (a warmer coral-red) with an icon and text label.

### 2.4 Typography

- **Family:** Inter (`system-ui, -apple-system, "Segoe UI", sans-serif` fallback). One family only. If the repo already loads a font, keep it and note the difference.
- **Numbers:** always `tabular-nums` in tables, KPIs, and tooltips.
- **Weights:** 400 body, 500 KPI values and buttons, 600 titles and badges.

| Style | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| `display` | 24 / 32 | 500 | -0.02em | KPI values |
| `title-lg` | 20 / 28 | 600 | -0.01em | Page titles |
| `title` | 14 / 20 | 600 | 0 | Card titles |
| `body` | 13 / 18 | 400 | 0 | Default text, table cells |
| `small` | 12 / 16 | 400 | 0 | Legends, badges, helper text |
| `caption` | 10-11 / 14 | 400 | 0 | Chart axis labels |

Sentence case everywhere. No all-caps labels, no tracked-out eyebrows.

### 2.5 Spacing, radius, elevation

- **Spacing (4px base):** 4, 8, 12, 16, 20, 24, 32, 48. Card padding 16, gap between cards 12, page padding 24 (14 on mobile), section gap 24.
- **Radius:** 5 (badges), 6 (chips, segmented items), 8 (buttons, inputs, nav items), 12 (cards). One radius per role, not one for everything.
- **Elevation:** dark mode has **no shadows**; separation is `1px solid var(--line)` plus panel color. Light mode may use `0 1px 2px rgba(0,0,0,.05)` on cards only. Popovers and tooltips use `--bg` fill plus a 1px border.

### 2.6 Dashboard reference-led visual variant

The user-selected Maven / Orbix reference informs information hierarchy, concise card content, meaningful data visualization, clear records and low-friction interaction patterns across all nine AMS modules, as detailed in `docs/AMS-MAVEN-INSPIRED-OPERATIONAL-WORKSPACE-IMPLEMENTATION-GUIDE.md`. It does not mean that every workspace should use the same dashboard layout. The dedicated visual variant in this section, including 16px Dashboard card geometry, specialized financial chart styling, project-ring interaction and Dashboard tab treatment, is scoped to Dashboard Overview only. Other modules retain canonical 12px card geometry and use task-specific compositions from the Main-Content Restructuring Specification.

- **Card geometry:** `--radius-dashboard-card: 16px`; chart plot radius uses `--radius-dashboard-plot: 12px`. Other modules continue to use the canonical 12px `--radius-card`.
- **Surface treatment:** maintain a quiet one-pixel outline, low-contrast secondary surfaces and one consistent header/body rhythm. Light mode may use a very subtle card shadow; dark mode remains shadow-free.
- **Trend chart:** use restrained blue and teal lines for the two financial series, a soft grid, concise axis values, smooth curves and a small floating detail surface on hover. Hover follows the nearest data point, not the raw pointer position. On the Overview Finance trend, canonical data remains issued invoices and eligible expenses; visual colors must not imply that one series is profit or cash flow.
- **Project ring:** hover/focus emphasizes one segment and updates the center to the corresponding saved count and share. Underlying risk/deadline calculations stay unchanged.
- **Interactions:** header actions and date selectors use shared Dashboard control geometry; related filters use `DashboardFilterGroup`, never separately hand-built button rows. Overview/Performance/Analytics tabs wrap without horizontal scrolling. Keep quiet hover/focus borders and short transitions. Lists and workload bars get a restrained hover response. Honor `prefers-reduced-motion`; preserve visible keyboard focus.
- **Scope boundary:** CSS and chart presentation props are scoped to Dashboard Overview. Do not modify the global theme, navigation, API, permission policy, source records or Finance formulas to imitate the reference.

### 2.7 Tailwind v4 setup (copy-paste)

Put this in the app's main CSS file (usually `src/index.css`). Merge with what exists rather than replacing it.

```css
@import "tailwindcss";

/* dark variant driven by data-theme on <html> */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

:root {
  --bg:#f4f4f7; --panel:#ffffff; --line:#e3e3ea; --text:#16161c; --muted:#6c6c7a;
  --accent:#dc143c; --accent-text:#c40f34;
  --series-2:#12a672; --series-3:#3b6fe0; --series-4:#8a8a98;
  --success:#12a672; --warning:#b7791f; --danger:#d92d20; --info:#3b6fe0;
}
:root[data-theme="dark"] {
  --bg:#09090c; --panel:#0f0f14; --line:#20202a; --text:#f3f3f6; --muted:#8b8b99;
  --accent-text:#e83252;
  --series-2:#34d399; --series-3:#5b8cff; --series-4:#b9b9c6;
  --success:#34d399; --warning:#f5a524; --danger:#f97066; --info:#5b8cff;
}

/* expose tokens as Tailwind utilities: bg-panel, border-line, text-fg, text-muted, bg-accent ... */
@theme inline {
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --color-bg: var(--bg);
  --color-panel: var(--panel);
  --color-line: var(--line);
  --color-fg: var(--text);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-accent-text: var(--accent-text);
  --color-series-2: var(--series-2);
  --color-series-3: var(--series-3);
  --color-series-4: var(--series-4);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --color-info: var(--info);
  --radius-badge: 5px;
  --radius-chip: 6px;
  --radius-control: 8px;
  --radius-card: 12px;
}
```

Usage: `className="bg-panel border border-line rounded-card p-4 text-fg"`.

Theme switching: set `document.documentElement.dataset.theme` to `"dark"` or `"light"` (default from `prefers-color-scheme`). Set it in a tiny inline script in `index.html` before first paint to avoid a flash. Persisting only the theme choice is fine; never store anything sensitive client-side.


## 2.7 Global geometry, interaction and conformance contract

This section turns the visual system into a deterministic implementation contract. The dimensions below are AMS design decisions, not values prescribed by an external accessibility standard. External standards govern accessibility and operability; they do not mandate a universal spacing scale or card design.

### Authority and conflict resolution

- This file is the single source of truth for visual tokens, component geometry, typography, responsive rules, motion and accessibility acceptance.
- `src/index.css` and shared component source are the implementation to inspect, not permission to introduce a competing rule. When implementation and specification disagree, report the exact mismatch; this documentation contract does not by itself prove the runtime UI conforms.
- Specialist component documents may narrow a rule for a named component variant. They may not redefine global tokens or create alternate values for the same variant.
- Page/content blueprints define information architecture and composition, not independent pixel values. When values conflict, follow this file and update the conflicting specialist text.
- Target accessibility conformance: WCAG 2.2 Level AA, using the WAI-ARIA Authoring Practices Guide for established interaction patterns. WCAG is normative; APG is implementation guidance. A document change, static test or successful build is not proof of conformance.
- Measure dimensions in CSS pixels. Prefer token classes/variables and existing shared primitives. Do not create arbitrary values when an approved token or named variant applies.

### Canonical spacing map

Use the existing 4px-base scale: `4, 8, 12, 16, 20, 24, 32, 48px`. The scale is intentionally discrete. A value outside it is permitted only when it is part of a named component contract below, a required border/focus geometry, or a documented exceptional content requirement.

| Relationship | Canonical value or behavior |
|---|---|
| Page inline gutter | 24px at >=1100px; 20px at 900–1099px; 16px at 600–899px; 14px below 600px, per the page-shell table below |
| Main page sibling sections | 24px vertical gap owned by `AdminPageShell`; do not add direct-child top/bottom margins |
| Module title to description | 4px |
| Module header to its contextual navigation | 12px; treat header + navigation as a grouped unit |
| Contextual navigation to the page toolbar/work area | 16px |
| Toolbar control groups | 8px within a group; 12px between distinct groups |
| Grid/card gutters | 12px unless the page recipe defines a different existing shared component variant |
| Card/panel inner padding | 16px |
| Card heading to its content | 12px |
| Form group vertical gap | 20px |
| Form grid gap | 12px |
| Label to input | 6px |
| Input to helper/error text | 4px |
| Button icon to label | 8px |
| Badge icon to label | 4px |
| Table cell inline padding | 12px |
| Table cell block padding | 8px standard; 4px compact; cell minimum height follows the named row-density variant |
| Section heading to supporting explanation | 4px |
| Overlay/dialog header, body and footer | Follow the named Drawer/Modal contract; do not transfer page spacing into an overlay |

Use CSS `gap` for sibling rhythm. Use internal component padding for content inset. Margins may be used for text-flow semantics or within a component when specified above, but must not compensate for a wrong parent layout. Do not combine page-shell gutter + module-root gutter + content-wrapper gutter.

### Geometry and component size contract

| Element | Canonical geometry | Permitted variants |
|---|---|---|
| Sidebar | 220px expanded; 64px collapsed | Below 900px use the approved drawer/sheet behavior |
| Global topbar | 52px high | Adapt controls at narrow widths without clipping |
| Main workspace | Fill available width; children use `min-width: 0` where required | No arbitrary max-width on data registers |
| Reading/explanation text | Aim for 45–80 characters per line; use `max-width: 72ch` where a prose column can be constrained | Do not constrain data tables or dashboards to a reading width |
| Primary page title | 20/28px, weight 600 | Use the existing typography token; never invent page-specific title sizes |
| Card/section title | 14/20px, weight 600 | Follow semantic hierarchy, not visual convenience |
| Standard body/table text | 13/18px, weight 400 | Compact density may change row height, not shrink essential text |
| Standard input/select | 40px minimum height | 36px compact variant only in dense toolbars/table filters and only when usable; document the variant |
| Textarea | 88px minimum height | 130px for explicitly marked long editorial content |
| Button | 36px minimum effective target on desktop; 40px on touch/narrow layouts | Shared compact variant only if the effective hit area meets accessibility rules |
| Desktop contextual tab | 32px visual height as defined by shared tab primitives | At touch layouts ensure the effective target area remains usable and non-overlapping |
| Table row | 40px standard; 32px compact | 48px comfortable variant only through a named shared renderer (currently used by Finance) |
| Table header | 40px | Align header labels and column data consistently |
| Icon | 16px for ordinary controls/navigation | 20px for prominent actions only; decorative size must not drive clickable target size |
| Border | 1px `--line` | Use semantic tokens; do not add decorative borders to every nested region |
| Keyboard focus | 2px outline with 2px offset | Must remain visible, high contrast, unclipped, and not confused with selection |
| Radius | 5px badge; 6px chip/tab item; 8px control; 12px card/dialog | No ad hoc intermediate radii |
| Dark-theme shadow | None by default | Surface color + 1px border provides separation |
| Layering | Use the established shell/overlay layer order | No arbitrary z-index values; overlays must be ordered by role, with the topmost overlay owning focus |

The button/input/tab rows above describe design intent and permitted named variants. During implementation, inspect current source before claiming conformance. If code differs, record an explicit remediation item; do not silently invent exceptions.

### Grid and responsive transformation contract

| Content | >=1100px | 900–1099px | 600–899px | <600px |
|---|---|---|---|---|
| App shell | Expanded/collapsible sidebar + workspace | Same shell, compact page gutter | Sidebar becomes drawer; main workspace fills width | Drawer navigation; single-column content by default |
| KPI/metric strip | Up to six columns when all metrics remain readable | Three columns | Two or three columns based on label length | Two columns where readable; otherwise one |
| Main analysis + supporting panel | 8/4 or equivalent task-appropriate split | Split only if both columns remain usable | Stack supporting content below the main area | Single-column order by task priority |
| Ordinary card collections | Four-column maximum when justified by content | Two columns | Two columns only while each remains readable | One column, except compact KPIs when readable |
| Forms | Use two columns only for related, short fields with adequate width | Reduce columns when labels/control widths become tight | Usually one column for narrow drawers or complex forms | One column |
| Contextual navigation | Shared desktop tab primitive | Shared desktop tab primitive | Shared in-page tab primitive | Same destinations via horizontal scroll or a deliberate accessible compact pattern |
| Data tables | Full register as required by task | Preserve key columns and actions | Contained horizontal scrolling or supported compact/detail view | Contained horizontal scrolling or supported compact/detail view; never cause page-wide horizontal overflow |

Canonical visual review widths: **1440, 1280, 1100, 1024, 900, 899, 768, 600, 599, 390 and 320 CSS px**. The 1100, 900 and 600 pairs verify breakpoint edges; not every screenshot must become a permanent artifact, but every affected layout must be checked at relevant widths. Additionally verify browser zoom/text resize up to 200% and WCAG reflow at the equivalent of 320 CSS px wide. Do not solve overflow by hiding meaningful content.

### Contrast, state and movement contract

- WCAG 2.2 AA: normal text contrast >= 4.5:1; large text >= 3:1; required non-text control boundaries, state indicators and graphical information >= 3:1 against adjacent colors. Validate foreground/background pairs in both light and dark themes; the existence of color tokens alone does not prove contrast.
- Use semantic colors and icon/text labels together. No status, validation, active state or chart meaning may rely on color alone.
- Interactive targets must satisfy WCAG 2.2 SC 2.5.8 (24 × 24 CSS px minimum unless a documented criterion exception applies). AMS usability target is >=36px effective hit area on desktop and >=40px on touch layouts; a visually compact glyph is allowed only when its effective target meets the target and does not overlap another target.
- Keyboard focus must be visible, logically ordered, not trapped except by a modal, and not obscured by sticky headers, drawers or overlays. Follow established WAI-ARIA APG interaction patterns for tabs, menus, dialogs, comboboxes and other composite widgets.
- Support text resizing to 200%, browser zoom, reflow, high-contrast/forced-colors settings, reduced motion, and keyboard-only use.
- Animation is functional feedback only. Respect `prefers-reduced-motion`; do not require motion, hover, drag, color or sound to discover or operate a feature.
- If a component pattern has no clear standard, use native semantic HTML first, then the existing shared primitive, then APG guidance where applicable. Do not add ARIA roles without implementing the corresponding keyboard and state behavior.

---

## 3. Layout

- **App shell:** left sidebar (220px, collapsible to 64px) + main column. Main column has a 52px top bar, then a route-level `AdminPageShell` that owns all page padding. `.ams-content` must not add a second layer of page padding.
- **Responsive section navigation:** below 900px, every topbar section/submodule navigation must remain available inside the page using `AdminSectionTabs` or an equivalent shared pattern. Do not make submodules reachable only through a desktop topbar.
- **Grid:** content uses a 12-column CSS grid with 12px gaps. Common patterns: KPI strip of 6 equal columns; hero chart full width; secondary cards 4 across.
- **Breakpoints:** ≥1100 full layout; 900-1099 KPI strip 3 columns and secondary cards 2 across; <900 sidebar becomes a drawer; <600 single column (KPIs 2 across).
- **Alignment:** left-align text; right-align numeric table columns.
- **Safe areas:** add `env(safe-area-inset-*)` padding on mobile for edge-hugging elements.
### Canonical page frame and padding

`AdminPageShell` is the only source of outer page padding for every authenticated module and every module tab. It is implemented in `src/components/admin/AdminModulePrimitives.tsx` and styled in `src/index.css`.

| Viewport | Inline padding | Top padding | Bottom padding |
|---|---:|---:|---:|
| Desktop, 1100px and wider | 24px | 24px | 32px |
| Compact desktop, 900px to 1099px | 20px | 24px | 32px |
| Tablet, 600px to 899px | 16px | 16px | 24px |
| Mobile, below 600px | 14px | 16px | `max(24px, env(safe-area-inset-bottom))` |

Rules:
- The root element rendered by every authenticated module route must be `<AdminPageShell>`. Dashboard overview must use the same shell. Tabs within a module must remain inside that root shell. Changing a tab must not introduce a second page gutter.
- `.ams-content` only constrains width and min-width. Do not put page padding there or apply page-level padding to individual module roots. This prevents compounded gutters.
- The `AdminPageShell.className` prop is for module scoping and layout variants only. Do not add `px-*`, `py-*`, `pt-*`, `pb-*`, `mx-*`, or negative margins to the outer shell.
- Do not use negative horizontal margins to make tab bars bleed outside the page gutter. Tab navigation, page headings, filters, metrics, tables, empty states, and tab content align to the same inline gutter.
- Use the shell's 24px vertical `gap` for sibling sections. Avoid using section-level `mt-*` or `mb-*` on direct children to create the page rhythm. Spacing inside a card or component remains local to that component.
- Fixed notifications, portals, dialogs, and drawers are overlays, not page sections, and must not contribute to the layout gap.
- Before adding a new module or tab, verify its root uses `AdminPageShell` and compare alignment at 1440px, 1024px, 768px, and 390px viewport widths.

```
┌───────────┬──────────────────────────────────────────┐
│ Logo      │ Tabs ........................ theme  avatar│
│ Search    ├──────────────────────────────────────────┤
│ Nav       │ KPI  KPI  KPI  KPI  KPI  KPI             │
│           │ ┌──────────── Hero chart ─────────────┐  │
│           │ └─────────────────────────────────────┘  │
│ ⚙ Settings│ ┌────┐ ┌────┐ ┌────┐ ┌────┐             │
│           │ └────┘ └────┘ └────┘ └────┘             │
└───────────┴──────────────────────────────────────────┘
```

---

## 4. Components

For every component define default, hover, focus-visible, active, and disabled states. Focus is always a 2px `--accent` outline with 2px offset. Build them in `src/components/ui` (or the existing equivalent) with typed props and `cn()`.

### Sidebar
- Background `--panel`, right border `--line`. Logo, then search field (opens the ⌘K palette), then nav.
- Nav item: 8px 10px padding, radius 8, `--muted` text, Untitled UI icon at 16px through the shared icon bridge. Hover → `--text`.
- **Active item** (use `NavLink`): 14% accent tint background, `--text` color, 2px inset accent bar on the left.
- Sub-items indent 16px, size 12.
- **Settings button** pinned to the bottom: ghost style, gear icon + "Settings" label, same size and states as a nav item. When collapsed it shows the icon only, with a tooltip.
- Items the current role cannot access are **not rendered**.

### Top bar and section tabs
- 52px high, bottom border `--line`. Keep section tabs on the left and utilities on the right.
- **Desktop section navigation uses `AdminTopbarTabs` only.** Its links share one geometry: 32px height, 6px radius, 12px horizontal padding, 11px text, 2px visible keyboard focus, transparent border when inactive, subtle panel hover, and a 10–14% accent tint plus light accent border when active. Do not create module-specific tab heights or typography.
- **Responsive page navigation uses `AdminSectionTabs` only** below 900px. Dashboard, Inbox, Finance, Clients, Retainers, and SLA Monitoring must use the same component, align to the page gutter, and sit immediately after the module header. Do not apply negative top margins or custom grid/pill markup for individual modules.
- Desktop and mobile tab sets must preserve the same reachable views and active-state semantics. Query-string views must use a shared `activeKey` derived from the URL. Every tab should expose `aria-current="page"` only for the active destination.
- Keep data-automation slugs stable where they already exist. Do not bypass the shared tab primitives to add module-specific active/hover/focus styles.
- Segmented controls inside a view can use their own neutral selected state; do not style every active control red.

### Drawers, modals, and form interaction

- Drawer is the default for create/edit workflows and multi-field input: career openings and applicant notes, projects/tasks, clients, vendors, finance records, document upload, user accounts, CMS content, and other record forms.
- Use the shared Drawer component and its canonical ams-drawer-header, ams-drawer-body, and ams-drawer-footer regions. Do not build page-specific drawer shells or use custom width overrides. Use named size presets only.
- Drawer geometry: 1px left border; panel background; header/footer padding 16px vertically and 20px horizontally; content padding 20px; mobile content/header/footer horizontal padding 16px; footer actions pinned at the bottom and safe-area aware on mobile.
- Drawer type scale: title 14/20 at 600; description 12/16; field labels 12/16 at 500; normal body/input/select text 13/18; helper/error text 12/18; section headings 14/20 at 600; subsection headings 12/16 at 600; metadata only may use 10–11px. Never use 9px for field labels or helper content.
- Form rhythm: top-level form gap 20px; field-grid gap 12px; label-to-control gap 6px; control minimum height 40px; textarea minimum height 88px (130px only for explicitly marked long editorial fields); 8px control radius; card padding 16px; footer actions 36px high with 8px between them.
- Drawer width presets: sm 384px, md 448px, lg 512px, xl 576px, 2xl 672px, 3xl 896px, 4xl 1024px. The panel is full-width on narrow screens. Pick the smallest preset that supports readable content and stack fields when columns become too narrow. Use 3xl/4xl for long or bilingual multi-column forms.
- A modal confirmation opened over an active drawer must render above it and own focus/Escape handling. The underlying drawer must suspend its focus trap until the modal closes; never allow two overlay focus traps to compete.
- Modal is for concise non-input context, such as read-only detail previews and short utility summaries. Do not place forms, text/number/date inputs, textareas, selects, or custom input controls inside a Modal. The keyboard-first CommandPalette is the sole exception.
- Use the shared Modal component and its canonical ams-modal, ams-modal-header, ams-modal-body, and ams-modal-footer styles. Modal/backdrop colors must use semantic panel/text/line tokens for the dialog and a fixed translucent black scrim for the overlay; do not use bg-bg as the scrim because it becomes a light wash in light theme.
- Modal type scale: title 14/20 at 600; description 12/16 at 400; body content follows the existing module hierarchy (13/18 default); footer actions use 12/16 text, 40px target height on mobile and 36px on desktop. Keep the close control 36px, the header/body/footer spacing shared, and the footer pinned under a scrollable body.
- A Modal that represents an in-flight async confirmation must set busy. Busy state blocks Escape/backdrop/close-button dismissal and disables cancel/confirm controls to prevent dismissing or submitting twice.
- Destructive actions should use the shared ConfirmDialog pattern wherever practical. Keep the object name and consequence clear, disable duplicate submission while pending, and preserve existing permission checks and API flow.
- Every form drawer must use explicit labels, visible validation/error messages, disabled/pending submit state, and Cancel/Close behavior that prevents accidental loss while saving. Long forms scroll inside the drawer; the primary action footer stays visible.
- Use docs/AMS-DRAWER-GUIDELINES.md for new drawers. Avoid one-off type sizes, margin overrides, custom panel padding, and arbitrary drawer widths. Mark faithful source-content previews with data-ams-drawer-preview when they need to retain their own typography.
### KPI card
- No panel background (sits on `--bg`). Label (`small`, muted) above value (`display`). Unit is `small`, muted, directly after the value.
- Optional change badge: inverted pill (`--text` background, `--bg` text, radius 5, 11px, 600).
- One unit and at most one badge per KPI.

### Card
- `--panel` background, 1px `--line`, radius 12, padding 16. Header row: title left, controls right, 8px above content.

### Segmented control (range selector)
- Use the shared `DashboardFilterGroup` component for related filter options; do not hand-build parallel rows of filter buttons.
- The Dashboard segmented shell uses a 1px `--line`-family border, `--bg`-family fill, radius 8 and 2px interior padding. Its inner options use radius 6, 28px height and 10px horizontal padding. The shell aligns to a standard 36px sibling action; its inner options remain visually compact.
- Selected options use a neutral `--line`-family background and `--text`; unselected options use `--muted`. Crimson is not a filter-selection fill.

### Buttons
| Semantic size | Geometry and padding |
|---|---|
| Standard action | 36px high, 12px horizontal padding, 8px icon-to-label gap, radius 8. |
| Compact action | 32px high, 10px horizontal padding, 8px content gap, radius 8. |
| Segmented option | 28px high, 10px horizontal padding, radius 6; aligned inside a 36px grouped shell. |
| Primary | `--accent` fill, white text, weight 500. Hover `crimson-600`, pressed `crimson-700`. |
| Secondary | `--panel` fill, 1px `--line`, `--text`. Hover: border `--muted`. |
| Ghost | Transparent, `--muted` text. Hover: `--text`. |
| Destructive | `--danger` outline or fill with icon + text. Always behind a confirm step (see section 8). |

In the Dashboard, `src/components/admin/DashboardControls.css` is the source of truth for shared size and padding variables: `--dashboard-control-padding-standard-x` (12px), `--dashboard-control-padding-compact-x` (10px), and `--dashboard-control-padding-filter-x` (10px). Card-level CSS may define grouped layout and responsive behavior, but must not invent alternate horizontal padding for a control of the same semantic size.

One primary button per view region. Buttons that trigger a request show a pending state and are disabled while pending.

### Badges and status
- 5px-radius chip or pill, 12px text, 600. Status = icon + text + tinted background (14% of the status color).
- Examples: **Active** (success), **Due soon** (warning), **Overdue** (danger), **Draft** (muted), **Encrypted** (info).

### Data table
- Row height 40 (compact 32). Header: `small`, muted, bottom border `--line`. No zebra; row hover is `color-mix(--text 4%)`.
- Numeric columns right-aligned with tabular figures. Sticky header. Row actions in the last column as a ghost icon menu.
- Always provide sort, search (Fuse.js where client-side), filter, pagination, empty state, and skeleton loading.

### Inputs
- Standard height 40px, radius 8, 1px `--line`, `--panel` fill, `--muted` placeholder. A 36px compact variant is allowed only for dense toolbars/table filters. Focus: 2px accent outline with offset. Error: `--danger` border plus a visible message below (never color alone). Every input has an associated visible label. Touch-layout controls must meet the effective hit-area rule in section 2.7.

### Tooltip (charts)
- `--bg` fill, 1px `--line`, radius 8, padding 10px 12px, 12px text. Title (date) in 600, then rows: colored dot + series name left, value right (tabular). Stays inside its card.

### Progress and breakdown bars
- Track `--line`, height 6, radius 3. Fill uses a series color. Label row above: name left, percent right.

### Dialog, drawer, toast
- No Radix in the repo: use the native `<dialog>` element or a hand-built dialog with focus trap, `Escape` to close, and focus returned to the trigger.
- Toast wording mirrors the action ("Invoice sent"). Errors say what failed and how to fix it.

### Loading, empty, error states
- **Loading:** skeleton blocks in `--line`. No spinners for content areas.
- **Empty:** one sentence saying what belongs here plus one primary action ("Add your first client").
- **Error:** what failed and how to fix it. No apologies, no vague text, no stack traces or internal details.

---

## 5. Data visualization

- Series order is fixed: crimson → green → blue → gray. A color always means the same metric across charts.
- Grid: horizontal lines only, 1px `--line`. Axis text `caption`, muted. Dual axes only when both scales align to the same gridlines.
- Primary series stroke 2.5px, others 1.8px. Smooth curves for trends, straight segments for sparse or discrete data.
- Hover: dashed vertical guide, a dot per series, tooltip. Label the latest value where it helps.
- Every chart has a legend, an `aria-label`, and human formatting (`Rp 1,2 M`, `85%`, `12 tasks`).
- Bar charts start at zero. Maximum 4 series per chart.
- **Implementation:** no chart library is installed, so build small typed SVG components in `src/components/charts` (line, bar, donut, sparkline) that read tokens via CSS variables. Adding a dependency requires a stated reason.

---

## 6. Motion

- Use the `motion` package. Wrap the app in `<MotionConfig reducedMotion="user">` so reduced-motion preferences are honored automatically.
- Motion answers user actions (tab change, range switch, dialog open). Duration 150-250ms, ease-out.
- One optional page-load moment: charts draw in once (about 600ms). No staggered fade-ups on every card, no looping animations.
- KPI count-up is allowed on first load only.

---

## 7. Accessibility

AMS targets **WCAG 2.2 Level AA**. Use the normative [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) as the conformance baseline and the [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) for established widget behavior. APG is guidance, not a substitute for WCAG or semantic HTML.

- **Contrast:** normal text >= 4.5:1; large text >= 3:1; meaningful non-text control boundaries, focus indicators and graphical data >= 3:1 against adjacent colors. Verify computed color pairs in light and dark themes.
- **Keyboard:** all actions work with keyboard alone; preserve logical focus order, visible focus, no unexpected focus loss, and no keyboard trap outside an active modal. Composite widgets follow their established APG key patterns.
- **Focus:** use a visible 2px `--accent` outline with 2px offset where contrast against both neighboring surfaces is adequate. Never clip the outline or obscure the focused element under sticky content/overlays.
- **Target size:** formal WCAG 2.2 AA minimum is 24 × 24 CSS px unless a documented criterion exception applies. AMS aims for an effective target of 36px on desktop and 40px on touch layouts. Small icons may have a larger transparent hit area.
- **Reflow and zoom:** content remains usable at 200% text resize and at 320 CSS px width (400% zoom equivalent), except for content that genuinely requires two-dimensional layout, such as a data table or board. Contain that horizontal scroll within the relevant region; do not create page-wide horizontal overflow.
- **Semantics:** use native HTML controls before custom ARIA widgets. Every input has a programmatically associated label; errors/help text are associated with the field. Icon-only actions need accessible names. Maintain correct heading order, landmarks, table headers and tab/dialog semantics.
- **Non-color cues:** pair status colors with text/icon; validation includes readable text; chart series have label/legend or equivalent. Links cannot be distinguished from body text by color alone.
- **Motion:** honor `prefers-reduced-motion`; avoid unpausable automatic movement when it is not essential. Do not make interactions dependent on hover, drag, animation or sound.
- **Async feedback:** announce relevant success/error/pending changes through appropriate live-region semantics without repeatedly announcing unchanged content.
- **Themes and user preferences:** test light/dark, forced colors/high contrast, increased text spacing and reduced motion where supported.
- **Verification:** use automated checks as a supplement, not a replacement for manual keyboard, screen reader, zoom/reflow and visual contrast review. Do not claim WCAG conformance without recording the tested scope and evidence.

See [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/).

---

## 8. Product patterns (agency and security)

### Modules (align with the approved navigation architecture)

The exact primary-module order and ownership are defined by `docs/architecture/ams-navigation-information-architecture.md` and `docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md`. The sidebar has nine primary modules; do not add a standalone Tasks, CRM, Proposal, or generic Approval module. Settings may be pinned to the bottom but remains one of the nine modules.

| Primary module | Primary content |
|---|---|
| Dashboard | Source-backed cross-module operational priorities, delivery health, meaningful trends, exceptions and drill-downs |
| Inbox | Messages, follow-ups, routing rules and response templates |
| Projects | Overview, Project Registry, Tasks & Execution, Planning & Delivery, Content & Campaigns, Project Resources, Project Controls |
| Clients | Directory, onboarding, agreements, service and relationship health |
| Finance | Overview & Control, Transactions & Cash, Receivables & Payables, Project Finance, Accounting & Reports |
| Team & Resources | Team & Capacity, People Operations, Vendors & Freelancers, Time Tracking |
| Documents | One canonical Document Library, with categories and saved views inside the library |
| Website CMS | Case Studies, Services, Insights, Testimonials, and Careers with internal Jobs, Applicants and Recruitment History views |
| Settings | System status, users/access, audit, integrations and relevant preferences |

### Authentication and MFA
- Login: username + password, generic failure message ("Username or password is incorrect"), never reveal which part failed.
- TOTP step: six separate digit boxes with paste support and auto-advance, `inputMode="numeric"`, `autoComplete="one-time-code"`. Show a "Use a recovery code" link.
- **Recovery codes** are shown once at creation: display in a monospace block with Copy and Download, and require a checkbox ("I saved these codes") before continuing. Explain that each code works once.
- Session expiry: a dialog that says the session ended and offers "Sign in again", preserving the current route.
- CSRF or session errors: neutral message ("Your session expired. Refresh and try again"), no internal details.

### Roles and permissions
- Hide navigation and actions the role cannot use. If a user reaches a restricted URL directly, show a clear "You don't have access to this page" state with a way back. Do not render partial restricted data.
- The client UI is not a security boundary: never rely on hiding alone, and always handle 401/403 responses from the API.

### Document vault
- Show an **Encrypted** badge on the vault. Files are downloaded through the app; **never display or construct storage URLs**.
- Upload: drag-and-drop plus a file picker, size/type limits stated up front, per-file progress, clear per-file errors.

### Destructive and sensitive actions
- Restore, delete, revoke, and reset actions use a confirm dialog that states the impact. For irreversible or system-wide actions (for example restoring a backup), require typing a confirmation word.
- Show what will happen, what will be lost, and whether a backup exists. Log-style confirmation after the action.

### System and backups (Master/IT)
- A status card: last backup time, retention, and restore-check status, with a badge (Healthy / Overdue / Failed) and icon + text.
- Manual snapshot is a secondary action with a pending state and a toast on completion.

### AI assistance (Gemini, optional)
- Label AI-generated content ("AI draft") and never apply it automatically: the user reviews, edits, then confirms.
- Show a loading state with a Cancel button. On failure say what happened and offer retry.
- Never send or display secrets, credentials, or vault contents to the AI surface.

### Notifications (Telegram, optional)
- Settings toggles per event type, with a test-message button and a clear connected/not connected badge. The bot token is managed on the server and is never shown in the UI.

---

## 9. Content and voice

- Plain and specific: "Tasks due this week", not "Upcoming task events".
- Sentence case, active voice, no exclamation marks, no filler.
- Buttons state exactly what happens: "Send invoice", "Restore backup", "Save changes".
- Numbers: currency with symbol and abbreviation, percentages without decimals unless meaningful, dates as `12 Apr 2025`.
- Keep domain terms consistent: **Client**, **Project**, **Task**, **Invoice**, **Document vault**, **Backup**.
- UI language is English.

---

## 10. Implementation rules

- **Stack:** React 19 + TypeScript, Tailwind v4 (tokens via `@theme`), `@untitledui/icons` (shared bridge + Vite alias for legacy imports), `motion`, `react-router-dom`, `fuse.js`, `clsx` + `tailwind-merge`. Do not add shadcn/ui, Radix, a chart library, or `framer-motion` without stating why.
- **Structure (adapt to what exists):** `src/components/ui`, `src/components/layout`, `src/components/charts`, `src/pages`, `src/lib` (`cn`, formatters), `src/hooks`. Small, reusable, typed components.
- **Theming:** `data-theme` on `<html>`; every component works in both themes.
- **Data:** use the real API where it exists; otherwise keep mock data in one place with realistic, consistent numbers across KPIs, charts, and tables.
- **Secrets and safety:** never commit runtime data, keys, credentials, or private files. Do not read or hardcode values from `.env`. Do not put tokens in `localStorage`, URLs, or logs.
- **No external images or brand assets.** Use initials, icons, and placeholders.
- **Quality gates:** `npm run lint` and `npm run build` must pass. Add `node --test` tests in `tests/` for non-trivial logic (formatters, permission helpers).

---

## 11. Do and don't

| Do | Don't |
|---|---|
| Use crimson for the primary series, active nav, primary button, focus | Use crimson for errors or as a decorative wash |
| Make the key number the largest element | Add gradients, glows, or heavy shadows in dark mode |
| Pair status color with icon + text | Signal status with color alone |
| Confirm destructive and system-wide actions | Let one click restore, delete, or revoke |
| Hide what a role cannot use, and still handle 403 | Trust the UI to enforce permissions |
| Use tabular numbers | Let digits jitter in tables and tooltips |
| Reuse existing repo components and map tokens | Create duplicate tokens or a second component set |

---

## 12. Definition of done

- [ ] Existing repo tokens/components inspected and reconciled; conflicts reported.
- [ ] Only tokens from this file are used; no stray hex values.
- [ ] Dark and light themes both render correctly.
- [ ] Affected layouts hold across the canonical widths: 1440, 1280, 1100, 1024, 900/899, 768, 600/599, 390 and 320 CSS px; zoom/text resize and 320px reflow are separately checked.
- [ ] CMS and Settings submodule navigation is accessible on mobile without relying on the desktop top bar.
- [ ] Focus states visible; keyboard navigation works; dialogs trap and restore focus.
- [ ] WCAG 2.2 AA contrast, keyboard, focus visibility, name/role/value, 200% text resize, 320 CSS px reflow, non-color cues and reduced-motion behavior have evidence for the touched scope.
- [ ] Charts have legends, tooltips, `aria-label`, and consistent series colors.
- [ ] Loading, empty, and error states exist for data views.
- [ ] Role-restricted items hidden and 401/403 handled.
- [ ] Reduced motion respected (`MotionConfig reducedMotion="user"`).
- [ ] No secrets, storage URLs, or sensitive data exposed or persisted client-side.
- [ ] `npm run lint` and `npm run build` pass; tests added where logic is non-trivial.
- [ ] A short note lists assumptions and anything added beyond this system.

---

## 13. Prompt preamble (paste at the start of any design task)

```
You are working in the Kapitech Agency Management System repo (React 19, Vite, TypeScript, Tailwind v4, motion, Express API).
First inspect src/index.css, src/components and src/lib, then follow AMS-DESIGN-SYSTEM.md strictly. Map existing tokens/components to it; do not duplicate.
Dark-first UI with crimson (#DC143C) as the single accent; use the danger token (not crimson) for errors.
Use Tailwind v4 @theme tokens, official Untitled UI icons through `src/lib/untitled-ui-icon-bridge.tsx`, the motion package, and hand-built accessible components (no shadcn/Radix, no new chart library without justification). Existing `lucide-react` import paths are compatibility aliases only; do not introduce a second icon set.
Respect roles, MFA and document-vault patterns; never expose secrets or storage URLs.
Build responsive (1440 / 1024 / 768 / 390), support both themes, and finish by running the Definition of Done checklist (npm run lint and npm run build must pass). List assumptions at the end.
```


## Kanban interaction contract

- The Projects portfolio board, Sprint & Delivery task board, and Tasks workspace board share the same operational expectations: visible stage labels/counts, semantic token colors, permission-aware controls, and clear empty/drop states.
- On boards with movement enabled, drag handles move a card between stages. The focused handle also supports **Left/Right Arrow** to move one stage and **Enter/Space** to open card details. Keep a separate tap/click path for card details and status actions so mobile users do not depend on native drag-and-drop.
- Status writes must use the existing task/project API and preserve the current authorization checks. Disable conflicting status/bulk writes while a save is pending; do not create a parallel business-data source.
- Keep the card and open detail surface synchronized during optimistic updates. On API failure, restore both to the previous server state and show the existing error feedback. Never make a detail modal appear saved merely because its button was clicked.
- Drag/drop should visibly mark the target lane and reset drag state on drop, cancellation, or invalid targets. Preserve filtering and sorting behavior; stage movement must not silently reorder cards within a stage when ordering is not persisted.
- Read-only roles must not expose active drag handles or mutate status. Test empty lanes, permission-limited views, overlapping updates, keyboard navigation, filtered boards, narrow screens, and save rollback.


## Reporting period and calendar controls

- Shared date and month calendars must allow users to jump directly to a year, rather than paging through every month or year one at a time. Year navigation must respect configured minimum and maximum dates.
- Report periods use one consistent control for Month, Quarter, and Year. Months and quarters must keep the year visible, offer quick actions for the current and previous period, and show the exact inclusive date range.
- Period comparisons must state the comparison baseline (previous period or same period in the prior year). Percentage change is shown as unavailable when the comparison baseline is zero; do not silently invent a percentage.
- Aggregated quarter and year views must include every month in the selected range. CSV exports must reflect the selected period and its comparison values, while preserving the existing caveats about provisional accounting figures.
- Period selectors are filters only. They must not change record dates, trigger posting, bypass permissions, or alter financial business rules.


## Global reporting period across AMS modules and tabs

- Keep the shared reporting-period control as a compact **Filter** action in the authenticated AMS topbar beside the notification and profile actions. Do not render a separate full-width card or extra content row above each module.
- Open the Month / Quarter / Year picker in a small anchored popover only when the user clicks Filter. Include the current selection, exact inclusive date range, quick actions for the current and previous period, and a one-click reset to `All dates`.
- Keep the initial filter disabled (`All dates`) until a user selects a period. Persist the user's selection across module navigation and internal tabs; show a subtle active indicator on the Filter button when a period is applied.
- A selected period filters date-stamped operational lists and supported reports. Records without usable dates stay visible so legacy or master records are not silently removed. Current-state KPIs and configuration forms remain current-state, not historical snapshots.
- Date-specific workflows such as a monthly closing checklist can retain their own narrower operational period where needed. Do not use a quarter/year selection to trigger a posting or closing action.
- Use the shared Month / Quarter / Year vocabulary and existing custom select component. Keep the control unobtrusive and consistent in both desktop and mobile headers; avoid a duplicate page-level filter bar.
