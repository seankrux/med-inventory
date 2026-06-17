# Design System: Med Inventory Manager

A single source of truth for generating new screens (Google Stitch or otherwise)
that stay consistent with the app's clinical, calm, high-trust interface.

## 1. Visual Theme & Atmosphere

A restrained, clinical-yet-warm operations console — like a well-lit pharmacy
back office, not a consumer health app. Density sits at **4–6 (Daily App
Balanced)**: enough information per screen for a clinic worker to scan stock at a
glance, never cramped. Variance is **moderate (4)** — structured tables and stat
grids, with asymmetric breathing room around forms. Motion is **restrained
(2–3)**: state changes are quick and honest, never decorative. The feeling is
*dependable*. Nothing pulses for attention; the data is the interface.

## 2. Color Palette & Roles

- **Paper Mist** (`#f6f7f8`) — App canvas / page background (`ink-50`)
- **Pure Surface** (`#ffffff`) — Card, table, and modal fill
- **Charcoal Ink** (`#0d1116`) — Primary text, headings (`ink-900`, near-black, never `#000`)
- **Slate Body** (`#181d24`) — Default body text (`ink-800`)
- **Muted Steel** (`#4d5664`) — Secondary text, table cells (`ink-500`)
- **Faint Steel** (`#7b8492`) — Metadata, timestamps, placeholders (`ink-400`)
- **Structural Line** (`#d6dce4`) — 1px borders, dividers (`ink-200`)
- **Clinic Green** (`#059669`) — *Single accent*: primary CTAs, active nav, focus rings (`clinic-600`). Saturation under 80%; calm medical green, never neon.
- **Clinic Tint** (`#ecfdf5`) — Accent wash for icon chips, active backgrounds (`clinic-50`)
- **Amber Signal** (`#f59e0b`) — Low-stock status only
- **Rose Signal** (`#e11d48`) — Critical-stock status and destructive actions only

Status colors (amber/rose) are **functional, not decorative** — reserve them for
stock state and delete actions. One accent rule holds: green is the only brand
color.

## 3. Typography Rules

- **Display / Headings:** `Geist` — tight tracking, weight-driven hierarchy (semibold over size). Page titles ~`1.5rem`, section headers `0.875rem` semibold uppercase-tracked.
- **Body:** `Geist` — relaxed leading, secondary color for descriptions, ~65ch max measure.
- **Mono:** `Geist Mono` / `JetBrains Mono` — all inventory numbers, counters, receipt content, timestamps. Numeric columns use `tabular-nums` so digits align in tables.
- **Banned:** `Inter`, generic system-UI as a *brand* face, all serif fonts (this is a dashboard — serif is forbidden here), emoji anywhere.

## 4. Component Stylings

- **Buttons:** Flat fill, no outer glow. Primary = Clinic Green fill, white text. Secondary = ghost with `ink-200` border. Tactile `-1px` translate on `:active`. Disabled drops to 50% opacity. No custom cursors.
- **Cards:** `0.875rem` radius, `ink-200` hairline border, soft `shadow-sm` only. Elevation communicates grouping, not drama. In dense tables, prefer row dividers (`ink-100`) over nested cards.
- **Tables:** The primary data surface. Uppercase tracked `ink-500` header on a faint `ink-50` band; `ink-100` row dividers; hover row tint `ink-50/60`. Right-align and `tabular-nums` every numeric column.
- **Status Pills:** Rounded-full chip. `ok` = green tint, `low` = amber tint, `critical` = rose tint. Text label matches color — never rely on color alone.
- **Inputs / Forms:** Label above, hint or error below, accent focus ring. Leading icon sits inside with `pl-8`. No floating labels.
- **Loaders:** Inline spinner with a text label ("Loading items…") sized to context — never a bare full-screen spinner. Prefer skeletal rows for tables when feasible.
- **Empty States:** Composed title + one-line guidance + a single primary action (e.g. "Add first item"), not a lone "No data".
- **Receipt:** Monospace, dashed-border "thermal paper" card, centered header, print-isolated via `@media print`.

## 5. Layout Principles

- CSS Grid for stat rows and card grids; never `calc()` percentage math.
- Stat grids collapse `2 → 3 → 5` columns across breakpoints — not a fixed 3-equal-card row.
- Forms (dispense, receive, login) are single-column, centered, `max-w-lg` — focused task surfaces.
- Tables wrap in `overflow-x-auto` so they never force page-level horizontal scroll on mobile.
- Full-height auth/empty screens use `min-h-[100dvh]`, never `h-screen`.
- Every element owns its spatial zone — no overlapping or absolute-stacked content.

## 6. Motion & Interaction

- Transitions are short and on `transform`/`opacity`/`background` only — color/shadow on hover, `-1px` on active.
- No infinite/perpetual loops, no parallax, no staggered entrance choreography. This is clinical software: motion confirms an action, it doesn't entertain.
- Respect `prefers-reduced-motion`.
- Toasts (Sonner) report outcomes; destructive actions confirm first.

## 7. Anti-Patterns (Banned)

- No emojis, no `Inter`, no serif fonts, no pure black (`#000000`).
- No neon glows, no purple/blue "AI" gradients, no gradient text on headings.
- No oversaturated accents; green is the only brand color.
- No 3-equal-card feature rows; no centered marketing hero in this app.
- No bare circular spinners as the only loading state; no "No data" dead-ends.
- No color-only status signaling — always pair with a text label.
- No custom mouse cursors, no "Scroll to explore" / bouncing-chevron filler.
- No generic placeholder names ("John Doe", "Acme") or fake round stats.
- No broken Unsplash links — use SVG/icon avatars or `picsum.photos`.
