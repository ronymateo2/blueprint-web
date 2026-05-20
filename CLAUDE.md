# blueprint-web — Claude Instructions

React 19 SPA deployed on Cloudflare Pages. Talks to `blueprint_api` (separate Worker). Lo-fi comic/handwritten aesthetic. PWA with auto-update via service worker.

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Cloudflare Pages (static, no Worker) |
| Framework | React 19 + Vite 6 |
| Routing | React Router v7 |
| Styling | **Tailwind CSS v4** + CSS custom properties (design tokens) |
| PWA | `vite-plugin-pwa` — `autoUpdate` mode, polls every 60s |
| Data cache | `@tanstack/react-query` v5 — shared low-churn queries only |
| Language | TypeScript (strict) |

## Dev Commands

```bash
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # tsc + vite build → ./dist
npm run deploy   # wrangler pages deploy ./dist → Cloudflare Pages
npm run lint     # eslint
npm run check    # tsc + build (CI gate)
```

## Environment Variables

| Var | File | Description |
|-----|------|-------------|
| `VITE_API_URL` | `.env.local` | API base URL (default: `http://localhost:8787`) |

In production, set `VITE_API_URL` in Cloudflare Pages dashboard to the Worker URL.

## File Structure

```
src/
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
public/
  _redirects          # /* /index.html 200 — SPA routing on Cloudflare Pages
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
See [`src/components/COMPONENTS.md`](src/components/COMPONENTS.md) for component API reference.

## Data Fetching Patterns

**Default pattern** (data that changes frequently or is scoped to one component):
```ts
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => { api.xxx.get().then(setData).finally(() => setLoading(false)); }, [deps]);
```

**React Query** (`@tanstack/react-query`) — use when data rarely changes and multiple components need the same data. Deduplicates in-flight requests; all instances share one cache entry. Use `staleTime` to control background refetch frequency. Invalidate via `queryClient.invalidateQueries({ queryKey })` after mutations so all consumers update.

```ts
// hook
const { data = [], isLoading } = useQuery({ queryKey: ['key'], queryFn: () => api.x.list(), staleTime: 30_000 });

// after mutation
queryClient.invalidateQueries({ queryKey: ['key'] });
```

`useHabits` uses React Query (`queryKey: ['habits']`, `staleTime: 30s`). Use the same pattern for other shared, low-churn data.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Tailwind v4 via `@tailwindcss/vite` | Zero PostCSS config; CSS-first `@theme` maps design tokens directly to utilities |
| Keep `tokens.css` `:root` vars | Components with computed colors (e.g., `border: \`1.6px solid ${c}\``) still need `var(--ink)` inline |
| PWA `autoUpdate` + 60s poll | Silently refreshes on new deploy without user prompt; poll catches long-open sessions |
| React Query for shared low-churn data | Multiple components consuming same endpoint caused N parallel fetches; React Query deduplicates and caches. Use for data that rarely changes (`habits`). Keep plain `useState+useEffect` for component-local or frequently-mutated data. |
| LocalStorage for token | Simple; no cookie complexity needed for a Cloudflare Pages setup |
| React Router `useLocation` in AuthCallback | StrictMode double-invoke would clear `window.location.search` before second effect run |
| `public/_redirects` for SPA routing | Cloudflare Pages serves `index.html` for all routes, enabling client-side navigation |

## Adding a Screen

1. Create `src/screens/MyScreen.tsx` — always wrap content in `<div className="screen">` + `<div className="screen-scroll">` + `<TabBar />`
2. Add route in `App.tsx` inside `<ProtectedRoute>` unless it's a public screen
3. Add tab entry in `TabBar.tsx` if it becomes a main tab

## Adding a Hook

Hooks live in `src/hooks/`. Follow the `useHabits` / `useEntries` pattern: load on mount, expose `reload` for manual refresh, expose `setData` for optimistic updates.

## Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

##  Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

##  Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

##  Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
