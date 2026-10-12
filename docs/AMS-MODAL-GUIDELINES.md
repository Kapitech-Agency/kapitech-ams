# AMS Modal Guidelines

This is the shared implementation checklist for all centered modals in Kapitech AMS. The visual and interaction source of truth is `src/components/ui/Modal.tsx` with styles in `src/index.css`; use `AMS-DESIGN-SYSTEM.md` for the broader UI system.

## When to use a modal

- Use a modal for concise, focused, read-only details, short utility dialogs, and confirmation actions.
- Use the shared `Drawer` for create/edit workflows or multi-field business input. Do not add record-entry forms to `Modal`; `CommandPalette` is the sole search-oriented exception.
- Destructive actions should state which record is affected and what changes. Use `ConfirmDialog` unless a specialized workflow needs extra context or progress handling.

## Visual contract

| Element | Standard |
|---|---|
| Dialog surface | `--panel` background, `--text` foreground, `--line` border, 12px radius |
| Backdrop | Fixed translucent black scrim, 45% opacity, 2px blur |
| Title | 14px / 20px, weight 600 |
| Description | 12px / 16px, weight 400, `--muted` |
| Body | 13px / 18px default; preserve intentional content hierarchy |
| Header | 16px vertical and 20px horizontal padding |
| Body region | 20px padding, scrolls when content exceeds available height |
| Footer | 16px vertical and 20px horizontal padding, pinned below body |
| Close button | 36px × 36px |
| Footer actions | 40px high on mobile, 36px on desktop, 12px horizontal padding |

Do not use the page background token as a scrim. `bg-bg/80` creates a pale overlay in light theme instead of dimming the page, which is why the shared modal uses a consistent translucent black backdrop.

## Interaction and safety

- Keep keyboard focus inside the topmost modal; restore focus to the invoking control when the modal closes.
- `Escape` closes normal dialogs only when allowed. An async operation should pass `busy` so Escape, backdrop clicks, and the close button cannot dismiss an in-flight confirmation.
- A busy confirmation must disable Cancel and Confirm to prevent an ambiguous workflow or duplicate submission. Do not hide an error if the action fails; the owning page should report the failure and return to a usable state.
- Do not enable outside-click dismissal for workflows where it could discard input or obscure an important confirmation.
- The body scrolls independently. Keep the header visible, keep actions visible, and respect mobile safe-area spacing.
- Use `aria-labelledby`, optional `aria-describedby`, and meaningful close button labels. Keep keyboard focus indicators visible.
- The highest active modal owns focus and Escape behavior. A modal opened above a drawer must suspend the drawer focus trap until the modal closes.
- Destructive buttons use semantic `danger` styling and labels such as Delete or Revoke. Neutral actions use shared secondary buttons. Do not hardcode red/white/black values where AMS semantic tokens exist.

## Copy-paste template: focused detail dialog

Use this pattern for non-input details and short utility content. Update state, IDs, labels, and handlers for the feature.

```tsx
import { Modal } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

<Modal
  slug="record-details-modal"
  open={Boolean(selectedRecord)}
  onClose={() => setSelectedRecord(null)}
  size="lg"
  title={selectedRecord?.name || 'Record details'}
  description={selectedRecord?.context}
  footer={
    <Button type="button" variant="secondary" onClick={() => setSelectedRecord(null)}>
      Close
    </Button>
  }
>
  {selectedRecord && (
    <div className="space-y-4">
      <section className="rounded-card border border-line bg-bg p-4">
        <h3 className="text-sm font-semibold text-fg">Overview</h3>
        <p className="mt-2 text-xs leading-5 text-muted">
          {selectedRecord.description || 'No additional details provided.'}
        </p>
      </section>
    </div>
  )}
</Modal>
```

## Copy-paste template: async confirmation

Prefer `ConfirmDialog` for a concise confirmation. Wire `loading` to the real async operation state; don't create a separate local-only loading flag when the feature already has one.

```tsx
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

<ConfirmDialog
  open={Boolean(deleteTarget)}
  onClose={() => !deleting && setDeleteTarget(null)}
  title="Delete record?"
  description={deleteTarget ? `This will remove ${deleteTarget.name}.` : 'This record will be removed.'}
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={() => void confirmDelete()}
  loading={deleting}
/>
```

## Pre-PR checklist

- [ ] Use the shared `Modal` or `ConfirmDialog`; no page-specific modal shell.
- [ ] Dialog surface follows `--panel`, `--text`, and `--line`; backdrop is a stable black scrim in light and dark theme.
- [ ] The title and description establish a clear hierarchy and use the canonical type scale.
- [ ] Long content scrolls inside the body; header and footer remain visible.
- [ ] Destructive action copy names the consequence and target record.
- [ ] Busy state prevents duplicate action and accidental dismiss while pending.
- [ ] Tab, Shift+Tab, Escape behavior, focus trap and focus restoration work.
- [ ] Overlay stacks correctly above drawers and other dialogs.
- [ ] Typecheck, regression tests, and production build pass.
