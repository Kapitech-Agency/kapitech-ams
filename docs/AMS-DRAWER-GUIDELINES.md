# AMS Drawer Guidelines

This is the implementation checklist and copy-paste template for every drawer in Kapitech AMS. The shared component is `src/components/ui/Drawer.tsx`; canonical styles are in `src/index.css`. `AMS-DESIGN-SYSTEM.md` owns global dimensions and the WCAG 2.2 AA target; this file defines only the Drawer variants and interaction contract.

## Non-negotiable rules

- Use the shared Drawer component. Do not implement an independent side panel, header, scrolling body, or action footer.
- Use a named size preset. There is intentionally no page-specific width override.
- Keep long-form scrolling in the drawer body and actions in footer, outside the scrolling region.
- Keep the drawer open while saving. Disable submit/cancel while saving, and prevent Escape/outside click from interrupting an in-flight mutation.
- Keep form behavior, permissions, API calls, validation, field IDs and business logic unchanged during visual-only changes.
- Use explicit labels and visible error states; never rely on placeholder text as a label.
- Use CustomSelect for AMS-managed dropdowns.
- Use data-ams-drawer-preview only for a faithful preview whose typography should remain independent from editor styles.

## Named width presets

| size | Max width | Intended use |
|---|---:|---|
| sm | 384px | Short, focused actions |
| md | 448px | Small forms, roughly 1–4 fields |
| lg | 512px | Standard forms |
| xl | 576px | Longer forms and related field groups |
| 2xl | 672px | Dense forms or editor content |
| 3xl | 896px | Long forms or wider structured details |
| 4xl | 1024px | Bilingual or multi-column editors |

The drawer is full width on narrow screens (below 600 CSS px) and must stay within the dynamic viewport and device safe areas. Choose the smallest preset that maintains readability. Stack multi-column fields on mobile instead of compressing them. The panel itself must not cause document-level horizontal overflow.

## Canonical type scale

| Element | Size / line-height | Weight |
|---|---|---:|
| Drawer title | 14 / 20px | 600 |
| Description | 12 / 16px | 400 |
| Section title | 14 / 20px | 600 |
| Subsection title | 12 / 16px | 600 |
| Field label | 12 / 16px | 500 |
| Input, select, body | 13 / 18px | 400–500 |
| Helper and validation text | 12 / 18px | 400 |
| Metadata and badge | 10–11 / 14px | 400–600 |

Use sentence case. Avoid text below 10px and never use 9px for field labels, instructions, or validation messages.

## Canonical spacing and controls

- Header: 16px vertical and 20px horizontal padding.
- Body: 20px padding on desktop; 16px on mobile.
- Footer: 16px vertical and 20px horizontal padding; mobile bottom respects the device safe area.
- Top-level form gap: 20px.
- Form grid gap: 12px, unless a structural layout is explicitly marked with data-ams-drawer-layout="sections".
- Label-to-control gap: 6px.
- Input/select height: 40px; text size 13/18; border radius 8px.
- Textarea: minimum 88px; use data-ams-drawer-size="large" only for a long editorial field that needs a 130px minimum.
- Form section/card padding: 16px.
- Footer actions: minimum 36px effective target on desktop and 40px on touch layouts, 8px apart. The visible control may be visually compact only when its effective target still meets the Design System target-size rule. Use shared Button variants.
- The body scrolls; the action footer stays visible.

## Copy-paste template

Change IDs, labels, validation, and handlers to match the feature. Preserve the shared geometry and component structure.

```tsx
import { Drawer } from '../../components/ui/Drawer';
import Button from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';

<Drawer
  slug="feature-editor-drawer"
  open={drawerOpen}
  onClose={() => !saving && setDrawerOpen(false)}
  size="xl"
  title={editingRecord ? 'Edit record' : 'Create record'}
  description="A short explanation of what this form manages."
  footer={
    <>
      <Button type="button" variant="secondary" onClick={() => setDrawerOpen(false)} disabled={saving}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" form="feature-editor-form" loading={saving}>
        {editingRecord ? 'Save changes' : 'Create record'}
      </Button>
    </>
  }
>
  <form
    id="feature-editor-form"
    data-ams-feature-slug="feature-editor-form"
    onSubmit={handleSave}
    className="space-y-5"
  >
    <section
      data-ams-drawer-layout="sections"
      className="grid gap-4 rounded-card border border-line bg-bg p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-fg">Basic information</h3>
        <p className="text-xs leading-5 text-muted">
          Group related fields and explain any important operational context.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="feature-name" className="mb-1.5 block">
            Record name <span className="text-danger">*</span>
          </label>
          <input id="feature-name" name="name" type="text" required className="ams-control w-full" placeholder="Enter a name" />
        </div>

        <div>
          <label className="mb-1.5 block">Status</label>
          <CustomSelect aria-label="Status" value={status} onChange={setStatus} options={statusOptions} triggerClassName="w-full" />
        </div>
      </div>
    </section>

    {formError && (
      <div role="alert" className="rounded-control border border-danger/30 bg-danger/10 p-3 text-xs leading-5 text-danger">
        {formError}
      </div>
    )}
  </form>
</Drawer>
```

## Pre-PR checklist

- [ ] Shared Drawer with one named width preset; no custom width override.
- [ ] Shared header, scrollable body and pinned footer.
- [ ] Clear title and one-sentence description.
- [ ] Every control has an explicit, accessible label.
- [ ] Sections use 20px vertical rhythm; field grids use 12px gaps.
- [ ] Labels, descriptions, hints, errors and controls follow the type scale above.
- [ ] Footer action order is Cancel then primary action; both remain usable on mobile.
- [ ] Pending state prevents duplicate submissions and accidental close without changing business flow.
- [ ] Keyboard focus, Escape, screen-reader names, focus restoration, and overlay stacking remain functional.
- [ ] Drawer respects dynamic viewport height, safe-area insets, 200% text resize and 320 CSS px reflow.
- [ ] Typecheck, regression tests, and production build pass.
