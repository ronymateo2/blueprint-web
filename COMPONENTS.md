# Component Standards

All components are inline-styled with CSS custom properties — no Tailwind, no CSS modules, no external UI library. Every component follows the lo-fi comic aesthetic defined in [`DESIGN.md`](DESIGN.md).

---

## Rules for All Components

1. **Props extend HTML attributes** when wrapping a native element (e.g., `interface SketchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`)
2. **Spread `...rest`** so callers can add `onClick`, `aria-*`, `data-*` without extra prop declarations
3. **Merge styles** via `{ ...defaultStyle, ...style }` — callers can override individual properties
4. **No comments** unless the logic is non-obvious
5. **No default export** — always named exports (`export function Ring(...)`)
6. **No state** unless the component owns it (UndoToast timer, BarChart hover)
7. **WebkitTapHighlightColor: 'transparent'** on every tappable element

---

## Ring

`components/Ring.tsx`

SVG progress ring. Value can exceed 1.0 — capped at full circle visually.

```tsx
<Ring
  size={220}          // diameter in px (default: 120)
  value={0.75}        // 0..1+, capped at 1 for rendering
  stroke={14}         // ring stroke width (default: 8)
  color="var(--coral)"  // ring fill color (default: var(--ink))
  track="#e8e1cf"     // background track color
  label="8 / 10"      // center text (Caveat font, size × 0.22)
  sublabel="completados hoy"  // secondary center text (Patrick Hand, size × 0.1)
/>
```

**Sizes in use:**
- `size={220}` — QuickAction full-screen hero ring
- `size={86}` — Home summary ring
- `size={46}` — Home habit list mini ring

**Note:** `value` prop drives `stroke-dashoffset`. Animated via CSS transition on the SVG circle (`0.4s ease`).

---

## HandIcon

`components/HandIcon.tsx`

Hand-drawn SVG icons. 20 available kinds.

```tsx
<HandIcon
  kind="fire"   // icon name string
  size={20}     // px (width = height)
  color="var(--ink)"  // optional, defaults to currentColor
/>
```

**Available kinds:**
`dish` `water` `mug` `pill` `book` `run` `dumb` `sun` `moon` `fire` `star` `leaf` `bolt` `clock` `target` `bell` `heart` `music` `phone` `plus` `check`

**Standard sizes:** `16` (list rows), `20` (tab bar), `24` (headers), `32–40` (large icon tiles).

---

## IconTile

`components/IconTile.tsx`

Square tile with a sketchy border containing a `HandIcon`. Used for habit icons in lists and the icon picker grid.

```tsx
<IconTile
  kind="star"       // passed to HandIcon
  size={44}         // tile size in px (default: 44)
  dashed={false}    // dashed border instead of solid (for empty/placeholder state)
  selected={false}  // coral border + coral-soft bg when true
  onClick={() => {}} // makes it tappable (cursor: pointer)
/>
```

**States:**
- Default: `1.6px solid var(--ink)`, transparent bg
- Dashed: `1.6px dashed var(--ink-soft)`, transparent bg (empty slot)
- Selected: `1.6px solid var(--coral)`, `var(--coral-soft)` bg + subtle shadow

---

## SketchButton

`components/SketchButton.tsx`

Pill-shaped button. The primary interactive element.

```tsx
<SketchButton
  accent={false}   // coral color scheme instead of ink
  filled={false}   // solid fill (coral/ink bg + paper text)
  small={false}    // smaller padding and font (13px vs 15px)
  onClick={fn}
  style={{ padding: '12px 32px', fontSize: 18 }}  // override for hero CTAs
>
  + Registrar uno
</SketchButton>
```

**Variants:**
| Props | Appearance | Use |
|-------|-----------|-----|
| default | `--ink` outline, transparent bg | Secondary action |
| `accent` | `--coral` outline, transparent bg | Accent secondary |
| `filled accent` | coral fill, paper text | Primary CTA |
| `filled` | ink fill, paper text | Dark primary |
| `small` | smaller padding/font | Top-bar nav buttons |

---

## SketchBox

`components/SketchBox.tsx`

Bordered card container. Base for habit list rows, form sections, info cards.

```tsx
<SketchBox
  padding={10}       // inner padding in px (default: 10)
  radius={14}        // border-radius in px (default: 14)
  accent={false}     // coral border + coral-soft bg
  dashed={false}     // dashed border instead of solid
  onClick={fn}       // spreads via ...rest
  style={{ marginBottom: 8 }}
>
  {children}
</SketchBox>
```

**States:**
- Default: `1.6px solid var(--ink)`, `var(--shadow-sketch)`
- Accent: `var(--coral)` border, `var(--coral-soft)` background
- Dashed: `var(--ink)` dashed border (use `dashed accent` for coral dashed)

---

## TabBar

`components/TabBar.tsx`

Bottom navigation. Always render at the bottom of every main screen. Reads `useLocation` to determine active tab automatically.

```tsx
<TabBar />
```

4 tabs, hardcoded: **Hoy** (`/`), **Histórico** (`/history`), **Puntos** (`/points`), **Yo** (`/me`).

Active tab: full opacity + `Scribble` underline. Inactive: `opacity: 0.45`.

**Rule:** Include `<TabBar />` as the last child of every `.screen` div. Do not put it inside `.screen-scroll`.

---

## UndoToast

`components/UndoToast.tsx`

4-second countdown toast with an undo action. Appears after logging a habit entry.

```tsx
<UndoToast
  text="Agua · +5 pts"       // description of the logged action
  onUndo={handleUndo}         // called when user taps undo
  onDismiss={dismiss}         // called when timer expires or user dismisses
  durationMs={4000}           // optional, default 4000
/>
```

Position: `absolute`, `bottom: 90px`, `left/right: 16px` — sits above the tab bar.

**Usage pattern** (with `useUndo` hook):
```tsx
const { toast, show: showToast, dismiss, handleUndo } = useUndo();

async function doLog(value: number) {
  const entry = await api.entries.create({ habit_id: id, value });
  showToast({
    id: entry.id,
    text: `${habit.name} · +${entry.points} pts`,
    onUndo: async () => {
      await api.entries.delete(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    },
  });
}

{toast && <UndoToast key={toast.id} text={toast.text} onUndo={handleUndo} onDismiss={dismiss} />}
```

**Important:** Use `key={toast.id}` to force remount when a new toast replaces the previous one (resets the timer).

---

## Heatmap

`components/Heatmap.tsx`

GitHub-style activity grid. Weeks flow left-to-right, days top-to-bottom (Mon → Sun).

```tsx
<Heatmap
  data={values}    // number[] of 0..1 intensity values, length = weeks × 7
  weeks={14}       // columns (default: 14)
  cellSize={12}    // cell size in px (default: 12)
/>
```

Cell intensity: `rgba(42,42,42, 0.15 + v * 0.7)`. Transparent when `v <= 0`. Always has `1px solid var(--ink)` border.

**In Points screen:** `weeks={14}`, `cellSize={12}`.
**In History screen (per-habit mini):** 28 cells (2 rows × 14 days), manually rendered with `gridTemplateRows: 'repeat(2, 1fr)'` and `cellSize={8}`.

---

## BarChart

`components/BarChart.tsx`

7-bar weekly chart. Active bar filled coral, others outlined.

```tsx
<BarChart
  values={[120, 80, 200, 150, 0, 300, 250]}  // 7 values, pts per day
  labels={['L','M','X','J','V','S','D']}       // x-axis labels (default: these)
  activeIndex={4}     // which bar is filled coral (usually today's index)
  height={70}         // chart height in px (default: 70)
/>
```

Bar height is relative to `Math.max(...values)`. Minimum bar height: `4px` (always visible even for 0).

---

## Scribble

`components/Scribble.tsx`

Wavy SVG underline accent. Used under screen titles and active tab labels.

```tsx
<Scribble
  width={80}                   // svg width (default: 80)
  color="var(--coral)"         // stroke color (default: var(--coral))
  strokeWidth={2.5}            // default: 2.5
  style={{ marginTop: 2 }}     // optional additional styles
/>
```

Height is derived from `strokeWidth * 5`. Use `width={28}` for tab bar active indicator.

---

## Patterns

### Empty State
```tsx
<div style={{ fontFamily: 'var(--font-hand)', color: 'var(--ink-soft)', fontSize: 14, padding: '8px 0' }}>
  Sin registros en este período
</div>
```

### Section Header
```tsx
<div style={{ fontFamily: 'var(--font-hand)', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6 }}>
  SECCIÓN
</div>
```

### Dashed Separator Row
```tsx
<div style={{ borderBottom: '1px dashed var(--ink-soft)', padding: '5px 0' }}>
  ...
</div>
```

### Loading State
```tsx
<div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
  <span style={{ fontFamily: 'var(--font-hand)', color: 'var(--ink-soft)' }}>Cargando…</span>
</div>
```

### FAB (Floating Action Button)
```tsx
<button
  onClick={() => navigate('/habits/new')}
  style={{
    position: 'absolute', bottom: 80, right: 18,
    width: 54, height: 54, borderRadius: '50%',
    background: 'var(--coral)', border: '2px solid var(--ink)',
    color: 'var(--paper)', fontSize: 28, fontFamily: 'var(--font-display)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '2px 3px 0 rgba(0,0,0,0.15)',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  }}
>+</button>
```

---

## Component Checklist (when creating a new component)

- [ ] Named export (`export function MyComponent`)
- [ ] Props interface defined above the component
- [ ] Extends HTML attributes if wrapping native element
- [ ] Spreads `...rest` onto the root element
- [ ] Merges `style` prop: `{ ...defaults, ...style }`
- [ ] `WebkitTapHighlightColor: 'transparent'` on tappable elements
- [ ] No hardcoded colors — uses CSS vars
- [ ] No Tailwind classes
- [ ] No comments unless logic is non-obvious
