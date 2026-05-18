# Blueprint Design System

Lo-fi comic/handwritten aesthetic. Mobile-first PWA (max 430px). Follows Apple Health legibility baseline for font sizes.

## Color Tokens

| Token | CSS var | Tailwind | Use |
|-------|---------|----------|-----|
| Ink | `var(--ink)` | `text-ink` / `bg-ink` / `border-ink` | Primary text, borders |
| Ink soft | `var(--ink-soft)` | `text-ink-soft` | Secondary text, muted labels |
| Paper | `var(--paper)` | `bg-paper` | Main background |
| Paper 2 | `var(--paper-2)` | `bg-paper-2` | Card / toast background |
| Coral | `var(--coral)` | `text-coral` / `bg-coral` / `border-coral` | Accent, active state, CTA |
| Coral soft | `var(--coral-soft)` | `bg-coral-soft` | Accent background fill |

## Typography

### Fonts
| Token | CSS var | Tailwind | Use |
|-------|---------|----------|-----|
| Display | `var(--font-display)` | `font-display` | Titles, numbers, counters |
| Hand | `var(--font-hand)` | `font-hand` | Body, labels, captions |

Caveat / Patrick Hand (display) + Patrick Hand / Comic Sans (hand).

### Font Size Scale (Apple Health baseline)

All font sizes are inline `style={{ fontSize: N }}` — no Tailwind text-* utilities.

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
| 14 | Caption primary | Habit subtitle, XP hint, heatmap headers, habit rows in History |
| 13 | Caption secondary | Stat pill labels, "Esta semana", toast countdown, tz label |
| 12 | Micro label | Bar chart day labels, heatmap legend, tab bar labels |

**Minimum**: 12px for any visible text. Never go below.

### Key Rules
- `font-display` for numbers and titles. `font-hand` for body/label text.
- Titles (28+): already readable — don't reduce.
- Tab bar labels: 12px (must fit under icon in 60px column).
- SketchButton: `small=true` → 14px, normal → 17px.

## Borders & Shadows

- Standard border: `1.5–1.8px solid var(--ink)` — gives sketchy feel
- Card shadow: `shadow-sketch` (Tailwind) or `var(--shadow-sketch)` inline
- Float shadow: `shadow-float` / `var(--shadow-float)` — for FABs and toasts
- Border radius: from token vars (`var(--radius-pill)` for buttons, explicit px for cards)

## Layout

- `.screen` — full-height flex column, max-width 430px centered
- `.screen-scroll` — flex-1, overflow-y auto, the scrollable body region
- `<TabBar />` — always last child of `.screen`, fixed 70px height
- Horizontal padding: `18px` for headers, `14px` for content
- Gap between list items: `8px` habits, `10px` sections

## Aesthetic Rules

- Borders must look hand-drawn: `1.5–1.8px` thickness, slightly uneven radius
- No drop shadows on flat content — only on interactive elements (FAB, toast)
- Opacity `0.55` for done/disabled states (not gray color swap)
- Animations: `slideUp 0.2s ease` for toasts, `0.3–0.4s ease` for bar transitions
- No external icon libraries — use `<HandIcon kind="..." />` (20 icons available)
