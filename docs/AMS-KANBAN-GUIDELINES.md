# AMS Kanban Guidelines

## Scope

These rules apply to the Projects portfolio board, Sprint & Delivery task board, and the Tasks workspace board. They preserve the shared AMS dark-first design system and existing server-owned project/task workflows.

## Interaction and status flow

- Use the canonical stage order for each board. For task stages, it is **To Do → In Progress → Review → Done**.
- A draggable handle is the only drag source. Drop targets cover the full lane, including its empty state. Mark the active target with the existing accent token and clear the target when drag ends or a drop is rejected.
- Focused handles support Left/Right Arrow to move one stage. Enter or Space opens the card detail. Card title/details and visible status controls remain usable without drag-and-drop, especially on touch devices.
- Use existing API clients and permission checks. Do not add a second data store or treat local optimistic state as a server save.
- While a status write is pending, prevent conflicting single-card, bulk, and drag operations. Keep the card and open detail view synchronized for the optimistic change. If the server rejects the change, restore both surfaces to the previous status and show feedback.
- Only change a card's stage when the destination differs from its current stage. Do not imply that dropping within a stage changes sort order unless the backend persists ordering.
- Read-only users can still open card details, but must not receive an active drag handle or status-changing controls.

## Visual and responsive behavior

- Use the existing AMS tokens: --panel, --bg, --line, --text, --muted, and --accent. Do not introduce per-board colors or a new card system.
- Keep lane widths readable, allow horizontal scrolling rather than compressing four stages into narrow cards, and provide a useful empty-lane drop target for authorized users.
- Make pending writes obvious through disabled controls and existing notices/toasts. Keep counts based on the currently filtered set and ensure a stage move updates counts naturally.

## Regression checklist

- Move a task forward and backward via drag, keyboard, and touch-friendly controls.
- Drop into an empty lane and attempt a same-stage drop.
- Confirm status and open detail stay in sync after success and after server rejection.
- Attempt simultaneous card moves and bulk status changes.
- Confirm read-only roles cannot drag or mutate a status.
- Test filters/search, completed/blocked queues, small screens, and all empty states.
