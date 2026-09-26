# AMS Design System

**Product:** Kapitech Agency Management System (AMS), a production-grade internal tool for running the agency: clients, projects, tasks, team, finance, and a private document vault.
**Repo:** `Kapitech-Agency/Kapitech-Agency.github.io` (React 19 + Vite + TypeScript + Tailwind CSS v4, Express API).
**Users:** agency staff and managers day to day; privileged **Master** and **IT** users for system, backup, and security tasks.
**Direction:** dark-first, data-dense, calm, trustworthy. Crimson is the single accent and is used sparingly.

> **For the AI agent:** this file is the source of truth for every UI you build in this repo. Use the tokens exactly as written. Do not invent colors, radii, fonts, or spacing values. If something is missing, extend the system in the same spirit and say what you added.
>
> **Before writing code, inspect the repo** (`src/index.css` or the current theme file, `src/components`, `src/lib`, existing pages). If tokens or components already exist, **map them to the names in this file and migrate incrementally**. Do not create parallel duplicates. Report any conflicts instead of silently overwriting.

---

## 0. Repo context

Verified from `README.md` and `package.json`:

| Area | Fact | What it means for UI work |
|---|---|---|
| Frontend | React 19, Vite 6, TypeScript, `react-router-dom` v7 | Function components, typed props, `NavLink` for nav active state |
| Styling | **Tailwind CSS v4** via `@tailwindcss/vite` | Define tokens in CSS with `@theme`. There is **no** `tailwind.config.js`. |
| Helpers | `clsx`, `tailwind-merge` | Use a `cn()` helper (`twMerge(clsx(...))`). Reuse it if it already exists in `src/lib`. |
| Icons | `lucide-react` | The only icon set |
| Motion | `motion` (`import { motion } from "motion/react"`) | Not `framer-motion` |
| Search | `fuse.js` | Client-side fuzzy search, e.g. the ⌘K palette |
| Charts | **No chart library installed** | Build small SVG chart components, or propose a dependency and justify it before adding |
| UI kit | **No shadcn/ui, no Radix** | Build components in-house. Handle focus and keyboard behavior yourself. |
| Backend | Express API, PostgreSQL (`pg`), HttpOnly session cookies, CSRF, TOTP MFA | UI must never handle secrets and must respect roles and CSRF flows |
| Quality gates | CI runs `npm ci`, `npm run lint` (`tsc --noEmit`), `npm run build`; tests use `node --test` | Every change must pass lint and build |
| Optional integrations | Gemini (AI), Telegram notifications | See the AI and notification patterns in section 8 |

Not verified (the `src` folder could not be inspected): existing colors, fonts, component names, folder layout. Follow the reconcile rule above.

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
| `--crimson-400` | `#ff4d6d` | **Accent text/icons on dark backgrounds** (`--accent-text`) |
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

### 2.6 Tailwind v4 setup (copy-paste)

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
  --accent-text:#ff4d6d;
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

---

## 3. Layout

- **App shell:** left sidebar (220px, collapsible to 64px) + main column. Main column has a 52px top bar, then a 24px padded content area.
- **Grid:** content uses a 12-column CSS grid with 12px gaps. Common patterns: KPI strip of 6 equal columns; hero chart full width; secondary cards 4 across.
- **Breakpoints:** ≥1100 full layout; 900-1099 KPI strip 3 columns and secondary cards 2 across; <900 sidebar becomes a drawer; <600 single column (KPIs 2 across).
- **Alignment:** left-align text; right-align numeric table columns.
- **Safe areas:** add `env(safe-area-inset-*)` padding on mobile for edge-hugging elements.

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
- Nav item: 8px 10px padding, radius 8, `--muted` text, `lucide-react` icon at 16px. Hover → `--text`.
- **Active item** (use `NavLink`): 14% accent tint background, `--text` color, 2px inset accent bar on the left.
- Sub-items indent 16px, size 12.
- **Settings button** pinned to the bottom: ghost style, gear icon + "Settings" label, same size and states as a nav item. When collapsed it shows the icon only, with a tooltip.
- Items the current role cannot access are **not rendered**.

### Top bar
- 52px high, bottom border `--line`. Tabs on the left (active tab: `--text` plus 2px accent underline). Right side: help, theme toggle, notifications, avatar menu (profile, security, sign out).

### KPI card
- No panel background (sits on `--bg`). Label (`small`, muted) above value (`display`). Unit is `small`, muted, directly after the value.
- Optional change badge: inverted pill (`--text` background, `--bg` text, radius 5, 11px, 600).
- One unit and at most one badge per KPI.

### Card
- `--panel` background, 1px `--line`, radius 12, padding 16. Header row: title left, controls right, 8px above content.

### Segmented control (range selector)
- Container `--bg`, radius 8, padding 2. Items radius 6, padding 3px 10px. Selected: `--line` background, `--text`. Unselected: `--muted`.

### Buttons
| Variant | Style |
|---|---|
| Primary | `--accent` fill, white text, radius 8, padding 7px 12px, weight 500. Hover `crimson-600`, pressed `crimson-700`. |
| Secondary | `--panel` fill, 1px `--line`, `--text`. Hover: border `--muted`. |
| Ghost | Transparent, `--muted` text. Hover: `--text`. |
| Destructive | `--danger` outline or fill with icon + text. Always behind a confirm step (see section 8). |

One primary button per view region. Buttons that trigger a request show a pending state and are disabled while pending.

### Badges and status
- 5px-radius chip or pill, 12px text, 600. Status = icon + text + tinted background (14% of the status color).
- Examples: **Active** (success), **Due soon** (warning), **Overdue** (danger), **Draft** (muted), **Encrypted** (info).

### Data table
- Row height 40 (compact 32). Header: `small`, muted, bottom border `--line`. No zebra; row hover is `color-mix(--text 4%)`.
- Numeric columns right-aligned with tabular figures. Sticky header. Row actions in the last column as a ghost icon menu.
- Always provide sort, search (Fuse.js where client-side), filter, pagination, empty state, and skeleton loading.

### Inputs
- Height 36, radius 8, 1px `--line`, `--panel` fill, `--muted` placeholder. Focus: accent outline. Error: `--danger` border plus message below (never color alone). Every input has a visible label.

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

- Text contrast ≥ 4.5:1 (3:1 for large text and UI graphics). Use `--accent-text` for crimson text on dark.
- Full keyboard navigation with visible focus. Logical tab order: sidebar → top bar → content.
- Charts: `role="img"` with a descriptive `aria-label`, and a table alternative on demand.
- Touch targets ≥ 40px on mobile. Never rely on hover for essential information.
- Announce async results (saved, failed) with an `aria-live` region.

---

## 8. Product patterns (agency and security)

### Modules (align with the real routes in the repo)
Sidebar order proposal: Dashboard, Clients, Projects, Tasks, Team, Finance, Documents, System. Settings is the bottom button. Only include modules that exist in the app.

| Module | Primary content |
|---|---|
| Dashboard | KPI strip (active projects, tasks due this week, overdue tasks, team utilization, monthly revenue, outstanding invoices), revenue vs expenses chart, project delivery, workload by person, expense breakdown |
| Clients | Client table/cards, detail (contacts, projects, invoices, files) |
| Projects | Project list/board, status, owner, deadline, budget vs actual |
| Tasks | Table and board views, assignee, due date, priority |
| Team | Members, roles, workload |
| Finance | Income, expenses, invoices, outstanding balances |
| Documents | Document vault: search, tags, upload, download via the app |
| System (Master/IT) | Backups, security, audit-style views |

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

- **Stack:** React 19 + TypeScript, Tailwind v4 (tokens via `@theme`), `lucide-react`, `motion`, `react-router-dom`, `fuse.js`, `clsx` + `tailwind-merge`. Do not add shadcn/ui, Radix, a chart library, or `framer-motion` without stating why.
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
- [ ] Layout holds at 1440, 1024, 768, and 390 widths.
- [ ] Focus states visible; keyboard navigation works; dialogs trap and restore focus.
- [ ] Text contrast passes; status never relies on color alone.
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
Use Tailwind v4 @theme tokens, lucide-react icons, the motion package, and hand-built accessible components (no shadcn/Radix, no new chart library without justification).
Respect roles, MFA and document-vault patterns; never expose secrets or storage URLs.
Build responsive (1440 / 1024 / 768 / 390), support both themes, and finish by running the Definition of Done checklist (npm run lint and npm run build must pass). List assumptions at the end.
```
