# Components

Two folders: `ui/` (primitivas puras, zero domain knowledge) and `habits/` (saben de Habit/Reminder).

See [Component Placement Rule in CLAUDE.md](CLAUDE.md#component-placement-rule) for when to use each.

---

## Rules

1. **Named exports only** — `export function Btn(...)`
2. **Props extend HTML attributes** when wrapping native elements — `interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`
3. **Spread `...rest`** so callers add `onClick`, `aria-*`, `data-*` without extra prop declarations
4. **Merge `style` prop** — `{ ...defaults, ...style }` so callers can override
5. **`WebkitTapHighlightColor: 'transparent'`** on every tappable element
6. **CSS vars for colors** — never hardcode colors
7. **No comments** unless logic is non-obvious

---

## ui/

### Btn

`components/ui/Btn.tsx`

Primary button. 6 variants × 4 sizes. Extends `React.ButtonHTMLAttributes`.

```tsx
<Btn
  variant="primary"   // 'primary' | 'outline' | 'danger' | 'ink' | 'segment' | 'chip'
  size="md"           // 'xs'(13px) | 'sm'(14px) | 'md'(17px) | 'lg'(18px)
  active={false}      // segment/chip: filled when true
  loading={false}     // replaces children with '…', disables button
  fullWidth={false}   // width: 100%
  onClick={fn}
  style={{ padding: '12px 24px' }}  // override padding/fontSize for hero CTAs
>
  Guardar
</Btn>
```

| Variant | Appearance | Use |
|---------|-----------|-----|
| `primary` | coral fill, paper text | Primary CTA |
| `outline` | ink border, transparent | Secondary action |
| `danger` | coral border, coral text | Destructive secondary |
| `ink` | ink fill, paper text | Dark primary |
| `segment` | ink border; filled when `active` | Segmented control |
| `chip` | ink border; coral-soft bg when `active` | Multi-select chips |

---

### SketchBox

`components/ui/SketchBox.tsx`

Bordered card. Base for habit rows, form sections, info cards. Extends `React.HTMLAttributes<HTMLDivElement>`.

```tsx
<SketchBox
  padding={14}      // inner padding in px (default: 10)
  radius={16}       // border-radius in px (default: 14)
  accent={false}    // coral border + coral-soft bg
  dashed={false}    // dashed border instead of solid
  style={{ display: 'flex', gap: 12 }}
>
  {children}
</SketchBox>
```

Always has `shadow-sketch` class.

---

### BottomSheet

`components/ui/BottomSheet.tsx`

Slide-up modal with dimmed overlay. Unmounts after close animation (260ms).

```tsx
<BottomSheet
  open={isOpen}
  onClose={() => setOpen(false)}
  dismissable={true}   // tap overlay to close (default: true)
>
  {children}
</BottomSheet>
```

Position: `absolute inset-0 z-70` — must be inside a positioned container (`.screen`). Renders drag handle automatically.

---

### ConfirmSheet

`components/ui/ConfirmSheet.tsx`

Confirmation dialog built on `BottomSheet`. Two buttons: Cancelar + confirm action.

```tsx
<ConfirmSheet
  open={!!toDelete}
  title={`¿Eliminar «${toDelete?.name}»?`}
  description="Se borrarán todos sus registros."  // optional
  confirmLabel="Eliminar"                          // default: 'Eliminar'
  onConfirm={executeDelete}
  onCancel={() => setToDelete(null)}
/>
```

---

### Ring

`components/ui/Ring.tsx`

SVG circular progress ring. Value can exceed 1.0 — capped visually at full circle.

```tsx
<Ring
  size={108}              // diameter in px (default: 120)
  value={0.75}            // 0..1+, capped at 1 for rendering
  stroke={10}             // ring stroke width (default: 8)
  color="var(--coral)"    // ring fill color (default: var(--ink))
  track="#e8e1cf"         // background track color
  label={displayPoints}   // center content (ReactNode)
  labelSize={28}          // font-size for label (default: size * 0.50)
  sublabel="pts hoy"      // secondary center text
/>
```

Center content (label/sublabel) optional — omit both for a pure ring. Animated via CSS transition `0.4s ease`.

**Sizes in use:** `size={220}` QuickAction hero, `size={108}` Home summary.

---

### Scribble

`components/ui/Scribble.tsx`

Wavy SVG underline. Used under screen titles and active tab labels.

```tsx
<Scribble
  width={58}                    // svg width (default: 80)
  color="var(--coral)"          // stroke color (default: var(--coral))
  strokeWidth={2.5}             // default: 2.5
  style={{ marginTop: -4 }}
/>
```

Height derived from `strokeWidth * 5`. Use `width={28}` for tab bar active indicator.

---

### HandIcon

`components/ui/HandIcon.tsx`

Phosphor icon lookup by name. 27 icons available.

```tsx
<HandIcon
  kind="fire"            // icon name string
  size={20}              // px (default: undefined — Phosphor default)
  color="var(--coral)"   // optional, defaults to currentColor
/>
```

**Available kinds:**
`dish` `water` `mug` `pill` `book` `run` `dumb` `sun` `moon` `fire` `star` `leaf` `bolt` `clock` `target` `bell` `heart` `music` `phone` `plus` `check` `walk` `wash` `shower` `avocado` `cow` `strategy`

**Standard sizes:** `16` list rows, `20` tab bar, `22` icon picker, `24` headers.

---

### DatePicker

`components/ui/DatePicker.tsx`

Calendar date input using `BottomSheet`. Returns ISO strings (`YYYY-MM-DD`) or `null`.

```tsx
<DatePicker
  label="Inicio"
  value={startDate}              // string | null
  onChange={(v) => setStartDate(v)}
  placeholder="Desde siempre"    // shown when value is null
  minDate={todayLocalDate()}     // disables days before this date
/>
```

---

### TabBar

`components/ui/TabBar.tsx`

Bottom navigation. Always include at the bottom of every main screen — not inside `.screen-scroll`.

```tsx
<TabBar />  // no props
```

4 tabs hardcoded: **Hoy** (`/`), **Histórico** (`/history`), **Puntos** (`/points`), **Yo** (`/me`). Active tab: full opacity + `Scribble` underline. Uses `useNavDirection` context for slide transition direction.

---

## habits/

### HabitForm

`components/habits/HabitForm.tsx`

Full habit create/edit form. Used by `CreateHabit` and `EditHabit` screens.

```tsx
<HabitForm
  navTitle="nuevo hábito"
  saveLabel={<>Crear</>}
  defaultValues={habitFormValues}    // optional, for edit mode
  defaultReminders={reminders}       // optional
  onSubmit={async (values) => { ... }}
  onCancel={() => navigate(-1)}
  bottomSlot={<ArchiveButton />}     // optional content before save btn
  autoFocusName={true}               // auto-focus name input
/>
```

Exports types: `HabitFormValues`, `ReminderDraft`, `HabitType`, `FrequencyType`, `ICONS`, `TYPES`.

---

### IconTile

`components/habits/IconTile.tsx`

Habit icon in a bordered square tile. Used in habit lists and icon picker grid.

```tsx
<IconTile
  kind="star"        // passed to HandIcon
  size={50}          // tile size in px (default: 44)
  dashed={false}     // dashed border (empty/placeholder state)
  selected={false}   // coral border + coral-soft bg + shadow
  onClick={() => {}} // makes it tappable
/>
```

---

### ReminderBadge

`components/habits/ReminderBadge.tsx`

Shows time to next reminder or time since last reminder. Refreshes while tab is visible via `useVisibleTick`.

```tsx
<ReminderBadge
  reminders={habit.reminders}   // Reminder[] | undefined
  timezone={timezone}
/>
```

Renders nothing if no reminders are active today. Color: coral for past reminders, ink-soft for upcoming.

---

### MiniBars

`components/habits/MiniBars.tsx`

7-day mini bar chart aligned to ISO week. Highlights the selected day.

```tsx
<MiniBars
  weeklyChart={stats.weeklyChart}   // number[] — last N days of activity counts
  selectedDate={selectedDate}        // 'YYYY-MM-DD' — highlighted day
  timezone={timezone}
/>
```

---

### ConfettiBurst

`components/habits/ConfettiBurst.tsx`

36-piece confetti animation. Fires on mount, auto-cleans. No props. Fixed position, `pointer-events: none`.

```tsx
{confettiActive && <ConfettiBurst key={confettiKey} />}
```

Use `key` to re-trigger — incrementing the key remounts the component and replays the animation.

---

## Patterns

### Loading state
```tsx
<div className="screen items-center justify-center">
  <span className="font-hand text-ink-soft">Cargando…</span>
</div>
```

### Empty state
```tsx
<SketchBox dashed padding={20} style={{ textAlign: 'center' }}>
  <div className="font-display" style={{ fontSize: 26, marginBottom: 4 }}>Sin registros</div>
  <div className="font-hand text-ink-soft" style={{ fontSize: 16 }}>Descripción del estado vacío</div>
</SketchBox>
```

### Section label
```tsx
<div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>
  Sección
</div>
```

### Dashed separator
```tsx
<div style={{ borderTop: '1.5px dashed var(--ink-soft)', margin: '6px 4px' }} />
```

### Undo toast
```tsx
// hook: useUndo (uses sonner under the hood)
const { show: showToast } = useUndo();

showToast({
  id: entry.id,
  text: `${habit.name} · +${entry.points} pts`,
  onUndo: async () => {
    await api.entries.delete(entry.id);
    await reloadEntries();
  },
});
```

---

## Component checklist

- [ ] Named export
- [ ] Props interface defined above component
- [ ] Extends HTML attributes if wrapping native element
- [ ] Spreads `...rest` onto root element
- [ ] Merges `style` prop: `{ ...defaults, ...style }`
- [ ] `WebkitTapHighlightColor: 'transparent'` on tappable elements
- [ ] CSS vars for all colors
