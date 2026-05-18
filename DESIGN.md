# Blueprint Design System

Lo-fi comic/handwritten aesthetic. Warm paper background, charcoal ink, muted coral accent. Feels like a physical notebook — rough edges, sketch-style borders, hand-lettered typography.

**Styling engine:** Tailwind CSS v4. Design tokens live in `index.css` `@theme` and are available as Tailwind utilities (`text-ink`, `bg-paper`, etc.) AND as CSS custom properties (`var(--ink)`, `var(--paper)`, etc. via legacy `tokens.css`).

## Principles

1. **Hand-drawn, not polished** — slightly imperfect borders, dashed lines, wavy underlines
2. **Warm, not clinical** — paper tones, no pure whites or pure blacks
3. **Tactile** — elements feel like they could be cut out and moved around
4. **Minimal motion** — only `slideUp` (toasts) and `fadeIn`; no bouncy springs

---

## Color Tokens

Defined in `index.css` `@theme` and mirrored as `:root` vars in [`tokens.css`](tokens.css). **Use Tailwind classes for static styles; use `var(--*)` only inside computed inline `style={{}}` props.**

| Token | Value | Tailwind class | Use |
|-------|-------|----------------|-----|
| `--color-ink` | `#2A2A2A` | `text-ink` / `bg-ink` / `border-ink` | Primary text, borders, icons |
| `--color-ink-soft` | `#5C5852` | `text-ink-soft` | Secondary text, disabled states, hints |
| `--color-paper` | `#FAF6EE` | `bg-paper` | Page background, button fill on dark |
| `--color-paper-2` | `#F2EDDF` | `bg-paper-2` | Slightly darker paper — cards, toasts |
| `--color-coral` | `oklch(0.72 0.13 32)` | `text-coral` / `bg-coral` / `border-coral` | Accent: active states, CTAs, rings, selected |
| `--color-coral-soft` | `oklch(0.92 0.05 32)` | `bg-coral-soft` | Accent background tint — selected icon tiles |
| `--color-coral-dark` | `oklch(0.58 0.15 32)` | — (inline only) | Pressed/hover state on coral elements |

### Color Usage Rules

- Borders: `border-ink` (solid) or `var(--ink-soft)` inline (dashed / secondary)
- Accent borders + fills: `border-coral` / `bg-coral`
- Do NOT use `#000` or `#fff` anywhere
- Opacity instead of lighter ink: `opacity-45` for inactive tab items, `opacity-55` for completed habits

---

## Typography

Fonts loaded from Google Fonts in `index.html`.

| Token | Font | Tailwind class | Use |
|-------|------|----------------|-----|
| `--font-display` | Caveat 500/600/700 | `font-display` | Screen titles, large numbers, habit names |
| `--font-hand` | Patrick Hand | `font-hand` | Body text, labels, buttons, metadata |
| `--font-mono` | JetBrains Mono | `font-mono` | Timestamps, debug, data values |

### Type Scale (Apple Health baseline)

All font sizes are inline `style={{ fontSize: N }}` — no Tailwind `text-*` utilities. Minimum: **12px**.

| px | Role | Examples |
|----|------|---------|
| 38 | Screen hero | "Hoy" title |
| 34 | Screen title | "Puntos", "Histórico", "Yo" |
| 28 | Card hero | XP total |
| 24 | Section value | Habit count "X / Y hábitos" |
| 22 | Item title | Habit name in list, stat pill values |
| 17 | Body / callout | Toast text, button (normal), timezone value |
| 16 | Subheadline | Points subtitle, pts·racha row, empty state |
| 15 | Body secondary | Date label, "quedan X", entry rows, period tabs |
| 14 | Caption primary | Habit subtitle, XP hint, heatmap headers |
| 13 | Caption secondary | Stat labels, "Esta semana", toast countdown, tz label |
| 12 | Micro label | Bar chart days, heatmap legend, tab bar labels |

- `font-display` for numbers and titles. `font-hand` for body/label text.
- `SketchButton`: `small=true` → 14px, normal → 17px.
- Tab bar labels: 12px (must fit under icon in 60px column).

---

## Border & Shape Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | `10px` | Small elements (icon tiles, cells) |
| `--radius-md` | `14px` | Cards, toasts, input rows |
| `--radius-lg` | `18px` | Large cards |
| `--radius-pill` | `999px` | Buttons, pills, tabs |

### Border Style

- **Primary border**: `1.6px solid var(--ink)` — main element borders
- **Secondary border**: `1.5px solid var(--ink-soft)` — inner rows, separators
- **Dashed border**: `1.6px dashed var(--ink-soft)` — empty/placeholder states, delete rows
- **Accent border**: `1.6px solid var(--coral)` — selected state

---

## Shadow Tokens

| Token | Value | Tailwind class | Use |
|-------|-------|----------------|-----|
| `--shadow-sketch` | `2px 3px 0 rgba(0,0,0,0.12)` | `shadow-sketch` | Cards, filled buttons — gives a "cutout" feel |
| `--shadow-float` | `0 8px 24px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06)` | `shadow-float` | Floating overlays, modals |

> `shadow-sketch` and `shadow-float` are defined as plain CSS classes in `global.css` (not Tailwind `@utility`) to guarantee inclusion without tree-shaking.

---

## Layout

The app is a mobile-first PWA constrained to **430px max-width**.

```css
/* Always wrap screen content with: */
<div className="screen">         /* height: 100dvh, flex column, overflow hidden */
  <div className="screen-scroll"> /* flex: 1, overflow-y: auto, scrollbar hidden */
    ...content...
  </div>
  <TabBar />                     /* flexShrink: 0, always visible */
</div>
```

### Spacing

No spacing tokens — use absolute values in multiples of 4px or 6px.
Common values: `4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 32`.

- Horizontal padding: `18px` for headers, `14px` for content
- Gap between list items: `8px` habits, `10px` sections

### TabBar

Fixed `70px` height. Always last child of `.screen`.

### Safe Area

Bottom nav (`TabBar`) has `padding-bottom: 18px` to account for iOS home indicator. Content inside `screen-scroll` gets `padding-bottom: 100px` to clear the tab bar.

---

## Animations

Defined as `@keyframes` in `global.css`. Use sparingly.

| Name | Use |
|------|-----|
| `slideUp` | Toast notifications entering from bottom |
| `fadeIn` | Screen transitions, overlays |
| `blink` | Cursor blink in text inputs |

Duration: `0.2s ease` for slide/fade. `1s infinite` for blink.

Ring progress (`stroke-dashoffset`): `transition: stroke-dashoffset 0.4s ease` — set directly on the SVG circle.

---

## Interactive States

- **Tap highlight**: always `style={{ WebkitTapHighlightColor: 'transparent' }}` on tappable elements (no Tailwind equivalent)
- **Active/pressed**: `transition` class + `opacity` change on buttons
- **Disabled**: `opacity-45` — do NOT use `disabled` attribute styles on custom elements
- **Selected**: `border-coral` + `bg-coral-soft`
- **Done/completed habit**: `opacity-55` + `line-through` on name

---

## Heatmap Cells

Activity cells follow this intensity formula:
```ts
const bg = v <= 0 ? 'transparent' : `rgba(42,42,42,${0.15 + v * 0.7})`;
// v = 0   → transparent (no border fill)
// v = 0.5 → rgba(42,42,42,0.50)
// v = 1   → rgba(42,42,42,0.85)
```
Border: `1px solid var(--ink)` always visible.

---

## Icon Set

20 hand-drawn SVG icons in `HandIcon.tsx`. Reference by `kind` string:

`dish` `water` `mug` `pill` `book` `run` `dumb` `sun` `moon` `fire` `star` `leaf` `bolt` `clock` `target` `bell` `heart` `music` `phone` `plus` `check`

Render at consistent sizes: `16px` (list rows), `20px` (tab bar), `24px` (headers), `32–40px` (icon tiles).

---

## Do / Don't

| Do | Don't |
|----|-------|
| `text-ink` / `border-ink` for static colors | Use `#000`, `#333`, `black` |
| `font-hand` class for body copy | Use system-ui or sans-serif |
| `var(--ink)` in `style={{}}` only when color is computed | Use `var(--ink)` in static JSX (use Tailwind class instead) |
| `1.6px solid` borders (inline, computed) | `1px` borders (too thin) or `2px` borders (too heavy) |
| `shadow-sketch` on cards | `box-shadow: 0 2px 8px rgba(0,0,0,0.2)` — too soft |
| `rounded-[14px]` or `rounded-md` for cards | `border-radius: 8px` (bypasses design scale) |
| Tailwind classes for static styles | Inline `style={{}}` for static values |
| `style={{ WebkitTapHighlightColor: 'transparent' }}` | Forgetting this (causes blue flash on iOS) |
