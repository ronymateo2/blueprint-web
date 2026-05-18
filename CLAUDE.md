# blueprint-web — Claude Instructions

React 19 SPA deployed on Cloudflare Pages. Talks to `blueprint_api` (separate Worker). Lo-fi comic/handwritten aesthetic. PWA with auto-update via service worker.

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Cloudflare Pages |
| Framework | React 19 + Vite 6 |
| Routing | React Router v7 |
| Styling | **Tailwind CSS v4** + CSS custom properties (design tokens) |
| PWA | `vite-plugin-pwa` — `autoUpdate` mode, polls every 60s |
| Language | TypeScript (strict) |
| Worker | Hono (serves static assets only — no API routes here) |

## Dev Commands

```bash
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # tsc + vite build
npm run deploy   # wrangler deploy → Cloudflare Pages
npm run lint     # eslint
npm run check    # tsc + build + deploy dry-run (CI gate)
```

## Environment Variables

| Var | File | Description |
|-----|------|-------------|
| `VITE_API_URL` | `.env.local` | API base URL (default: `http://localhost:8787`) |

In production, set `VITE_API_URL` in Cloudflare Pages dashboard to the Worker URL.

## File Structure

```
src/react-app/
  index.css           # Tailwind entry: @import "tailwindcss" + @theme tokens
  design/
    tokens.css        # Legacy :root CSS vars (var(--ink) etc.) — kept for dynamic inline styles
    global.css        # body reset, .screen / .screen-scroll, .shadow-sketch, keyframes
  components/         # Reusable UI primitives — see COMPONENTS.md
    Ring.tsx          # SVG progress ring
    HandIcon.tsx      # 20 hand-drawn SVG icons
    IconTile.tsx      # Icon in a sketchy bordered box
    SketchBox.tsx     # Dashed/solid border card
    SketchButton.tsx  # Pill-shaped sketchy button
    TabBar.tsx        # Bottom navigation (4 tabs)
    UndoToast.tsx     # 4s countdown toast with undo action
    Heatmap.tsx       # GitHub-style activity heatmap
    BarChart.tsx      # 7-bar weekly chart
    Scribble.tsx      # SVG wavy underline accent
  screens/            # Route-level components
    Login.tsx         # "Continuar con Google" OAuth redirect
    AuthCallback.tsx  # Reads ?token= from URL, saves to localStorage
    Home.tsx          # Dashboard: habit list + rings
    QuickAction.tsx   # Full-screen big circle (log a habit)
    Points.tsx        # XP card + bar chart + heatmap
    History.tsx       # Per-habit heatmaps + recent entries
    CreateHabit.tsx   # New habit form
    EditHabit.tsx     # Edit habit + reminders
    Me.tsx            # Profile + timezone + logout
  hooks/
    useAuth.ts        # Verifies token via /api/auth/me; removes token on 401
    useHabits.ts      # Fetches and caches habit list
    useEntries.ts     # Fetches entries with from/to/habitId filters
    useStats.ts       # Fetches aggregated stats
    useUndo.ts        # Toast state management for undo actions
  api/
    client.ts         # Typed fetch wrappers; reads token from localStorage
  App.tsx             # BrowserRouter + ProtectedRoute + all routes
  main.tsx            # ReactDOM.createRoot (StrictMode on) + registerSW() PWA auto-update
src/worker/
  index.ts            # Hono worker — serves Pages static assets only
```

## Auth

Token stored in `localStorage["habit_token"]`. Set by `AuthCallback` after Google OAuth redirect. Sent as `Authorization: Bearer <token>` on every API request.

**Critical:** `AuthCallback` uses `useLocation().search` (from React Router), NOT `window.location.search`. Reason: React 18 StrictMode double-invokes effects — if the first invocation calls `navigate('/')`, `window.location.search` is already cleared by the time the second invocation runs, causing a redirect to `/login`. `useLocation` captures URL at render time and is stable across double-invokes.

`useAuth` removes the token only when the API returns a network-level failure or HTTP error. The `ProtectedRoute` in `App.tsx` redirects to `/login` if `user` is null after loading.

## Routing

```
/                       Home (ProtectedRoute)
/habits/new             CreateHabit (ProtectedRoute)
/habits/:id             QuickAction (ProtectedRoute)
/habits/:id/edit        EditHabit (ProtectedRoute)
/points                 Points (ProtectedRoute)
/history                History (ProtectedRoute)
/me                     Me (ProtectedRoute)
/login                  Login (public)
/auth/callback          AuthCallback (public)
```

## Styling Rules

- **Tailwind CSS v4** via `@tailwindcss/vite`. No external component library.
- Design tokens defined in `index.css` `@theme` block → become Tailwind utilities: `text-ink`, `bg-paper`, `bg-coral`, `font-hand`, `font-display`, `shadow-sketch`, etc.
- Legacy `tokens.css` `:root` vars (`var(--ink)`, `var(--coral)`, etc.) still present for inline-style fallbacks in components with computed/dynamic colors.
- **Prefer Tailwind classes** for static styles. Use `style={{}}` only for dynamic/computed values (e.g., `border: \`1.6px solid ${color}\``).
- Layout: use `.screen` wrapper + `.screen-scroll` for scrollable content — defined in `global.css`
- Max width: 430px centered (mobile-first PWA)
- Sketchy aesthetic: `1.5–1.8px solid` borders, `shadow-sketch` class, `border-radius` from token vars

### Typography Scale (Apple Health baseline)

All font sizes are **inline `style={{ fontSize: N }}`** — not Tailwind text-* classes. Minimum is 12px.

| px | Role |
|----|------|
| 38 | Screen hero (e.g. "Hoy") |
| 34 | Screen title (e.g. "Puntos", "Histórico") |
| 28 | Card hero (XP total) |
| 24 | Section value ("X / Y hábitos") |
| 22 | Item title (habit name, stat pill values) |
| 17 | Body / callout (toast text, button normal, tz value) |
| 16 | Subheadline (level subtitle, pts·racha, empty state) |
| 15 | Body secondary (date label, "quedan X", entry rows, period tabs) |
| 14 | Caption primary (habit subtitle, XP hint, heatmap headers) |
| 13 | Caption secondary (stat labels, "Esta semana", countdown, tz section label) |
| 12 | Micro label (bar chart days, heatmap legend, tab bar labels) |

`SketchButton`: `small=true` → 14px, normal → 17px.
`font-display` for numbers/titles. `font-hand` for body/labels.

### Tailwind token → class reference
| CSS var | Tailwind class |
|---------|---------------|
| `var(--ink)` | `text-ink` / `bg-ink` / `border-ink` |
| `var(--ink-soft)` | `text-ink-soft` |
| `var(--paper)` | `bg-paper` |
| `var(--paper-2)` | `bg-paper-2` |
| `var(--coral)` | `text-coral` / `bg-coral` / `border-coral` |
| `var(--coral-soft)` | `bg-coral-soft` |
| `var(--font-hand)` | `font-hand` |
| `var(--font-display)` | `font-display` |
| `var(--shadow-sketch)` | `shadow-sketch` |
| `var(--shadow-float)` | `shadow-float` |

See [`DESIGN.md`](../../DESIGN.md) for full design system reference.
See [`src/react-app/components/COMPONENTS.md`](src/react-app/components/COMPONENTS.md) for component API reference.

## Data Fetching Patterns

Hooks follow this pattern:
```ts
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => { api.xxx.get().then(setData).finally(() => setLoading(false)); }, [deps]);
```

No external state manager. No React Query. Simple useState + useEffect + direct API calls.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Tailwind v4 via `@tailwindcss/vite` | Zero PostCSS config; CSS-first `@theme` maps design tokens directly to utilities |
| Keep `tokens.css` `:root` vars | Components with computed colors (e.g., `border: \`1.6px solid ${c}\``) still need `var(--ink)` inline |
| PWA `autoUpdate` + 60s poll | Silently refreshes on new deploy without user prompt; poll catches long-open sessions |
| No React Query | Simple hooks are enough; the app is small and single-user per session |
| LocalStorage for token | Simple; no cookie complexity needed for a Cloudflare Pages + Worker setup |
| React Router `useLocation` in AuthCallback | StrictMode double-invoke would clear `window.location.search` before second effect run |
| Separate Worker + Pages | Independent deploys; API has its own D1 binding |

## Adding a Screen

1. Create `src/react-app/screens/MyScreen.tsx` — always wrap content in `<div className="screen">` + `<div className="screen-scroll">` + `<TabBar />`
2. Add route in `App.tsx` inside `<ProtectedRoute>` unless it's a public screen
3. Add tab entry in `TabBar.tsx` if it becomes a main tab

## Adding a Hook

Hooks live in `hooks/`. Follow the `useHabits` / `useEntries` pattern: load on mount, expose `reload` for manual refresh, expose `setData` for optimistic updates.
