# Devlog

One entry per commit: what changed, why (the goal), and any mistakes or lessons.
Newest entries go at the bottom.

## Conventions

- Small, logical commits. One idea per commit.
- Commit messages describe the change only.
- Mistakes are written down here. Fixes get their own commit; pushed history is not rewritten
  without asking first.

## 0. Initial commit (`9c12b80`)

- **What:** `git init`, README placeholder, `.gitignore`, private GitHub repo created and pushed.
- **Goal:** have a repo to build in.
- **Mistake:** the commit message carries a `Co-Authored-By: Claude` trailer. The project rule
  (set right after) is that commits must not mention Claude. The commit predates the rule and is already
  pushed, so it stays until the owner decides whether to rewrite it with a force push.

## 1. docs: add project goals and devlog

- **What:** project goals and architecture in the README, this devlog.
- **Goal:** write down what we are building and why before writing code, so later commits can be
  checked against it.
- **Decisions:** Supabase over a custom backend (no server to run, free, gives auth + storage + RLS).
  GitHub Pages for hosting. Note: Pages from a private repo needs a paid plan, so repo visibility or
  host is to be decided at deploy time.

## 2. chore: scaffold Vite + React + TypeScript

- **What:** Vite 8 + React 19 + TypeScript project (generated with `npm create vite`, demo files removed),
  oxlint for linting, `data/` added to `.gitignore`.
- **Goal:** a building, empty app to grow from. `npm run build` and `npm run lint` pass.
- **Note:** the generator refuses non-empty folders, so it was run in a scratch directory and the files
  were copied in. The package name was changed to `trading-journal`.

## 3. chore: add Tailwind and black/green theme

- **What:** Tailwind CSS v4 via `@tailwindcss/vite`; theme tokens in `src/index.css` (black background,
  green text, dark green surfaces/lines, red for losses, yellow for wash/warnings).
- **Goal:** one place for the black + green look, so components use names like `text-green`,
  `bg-surface`, `text-loss` instead of raw colors.
- **Plan change:** the planned "lint/format config" commit is dropped. The scaffold already ships
  oxlint, and a formatter adds noise for a one-person project.

## 4. feat(db): add Supabase schema and RLS policies

- **What:** `supabase/migrations/0001_init.sql` with `trades`, `trade_images`, `journal_days`, row-level
  security on all three, and a private `screenshots` storage bucket restricted to `<user id>/` folders.
- **Goal:** make privacy a property of the database, not of the frontend. The anon key in the bundle is
  useless without the owner's login.
- **Not verified yet:** the SQL has not run against a real Supabase project (none exists yet). It will be
  tested once the project is created, and any fix will be a separate commit.

## 5. feat(domain): trade types, contract values, stats

- **What:** `Trade` type, MNQ/ES (plus NQ/MES) point values and `pnlFromPrices`, and pure statistics in
  `src/lib/stats.ts`: win rate, profit factor, expectancy, avg win/loss, daily totals, trade and day
  streaks. Vitest tests with hand-computed numbers (`npm test`, 8 pass).
- **Goal:** the numbers the dashboard shows must be right, so they live in pure, tested functions
  separate from any UI or database code.
- **Definitions chosen:** only closed trades count toward results; open trades are only counted.
  A trade with P&L of exactly 0 is "wash". Profit factor is `null` (shown as "-") when there are no
  losses. A trade belongs to the day it was entered, in local time.
- **Order change:** done before auth, because auth needs a real Supabase project and this does not.

## 6. feat(layout): app shell, sidebar, routing

- **What:** `react-router-dom` with `HashRouter`, a sidebar (icons only on narrow screens, labels on wide),
  and placeholder pages: Dashboard, Trades, Calendar, Reports, Import. Icons from `lucide-react`.
- **Goal:** fix the page structure early so each later commit fills in one page.
- **Decision:** `HashRouter` (URLs like `/#/trades`) because GitHub Pages cannot rewrite deep links.
- **Checked:** type-check, lint, build, and a screenshot of the dev server.
- **Housekeeping:** `.claude/` (local dev-server config) is gitignored.

## 7. feat(auth): Supabase client and login gate

- **What:** Supabase client (`src/lib/supabase.ts`), auth context/provider, email + password `Login` page,
  `AuthGate` wrapping the whole app, sign-out button, `.env.example`. With no env vars the app shows a
  "Supabase is not configured" message instead of crashing.
- **Goal:** nothing in the app is reachable without a session. The real protection is RLS (commit 4);
  this gate is the user-facing half.
- **Mistake caught by lint:** I first exported the hook from the same file as the provider component, which
  breaks React fast refresh. Split into `authContext.ts` (context + `useAuth`) and `auth.tsx` (provider).
  Also my first edit of `App.tsx` left bad indentation; rewrote the file.
- **Not verified yet:** the "not configured" screen was checked in the browser. Real sign-in is untested
  until a Supabase project and user exist.

## 8. feat(trades): trade data layer and provider

- **What:** `tradesApi.ts` (list/create/createMany/update/delete against Supabase, mapping between
  `snake_case` rows and the `Trade` type), `TradesProvider` + `useTrades()` so every page shares one
  loaded list, and a dev-only **demo mode**.
- **Goal:** one place that talks to the database; pages only call `useTrades()`.
- **Demo mode:** `VITE_DEMO=1` in `.env.local` makes `npm run dev` use 7 made-up trades in memory and skip
  login, with a yellow banner. It is gated on `import.meta.env.DEV`, so production builds drop it
  (checked: the built JS contains no "DEMO MODE" string). Reason: I cannot see real screens until a
  Supabase project exists, and I do not want to build blind. The sample trades are fake, never real data.
- **Gotcha handled:** Postgres `numeric` can arrive as a string, so values are coerced with `Number()`.
- **Mistake avoided from last time:** rewrote `App.tsx` whole instead of patching, to avoid broken indentation.
- **Not verified yet:** the Supabase calls themselves (no project yet); demo mode and types are verified.

## 9. feat(trades): trade log table

- **What:** Trades page: table with date, symbol, status, direction, qty, entry, exit, hold time, return and
  emotion tags. Sort by date/symbol/qty/return, filter by symbol, free-text search across notes, setup and
  emotions. Money/date helpers in `src/lib/format.ts`.
- **Goal:** the table from the Tradeify reference, in black and green, with search that also covers the
  emotion notes.
- **Mistake:** I defined the sortable header component inside the page component. Lint warned that this
  recreates the component on every render. Moved it to module level before committing.
- **Checked:** type-check, lint, and a screenshot in demo mode. Rows are not clickable yet; the add/edit
  form is the next commit.

## 10. feat(trades): add/edit trade form with emotion fields

- **What:** `/trades/new` and `/trades/:id` (one `TradeEdit` page, one `TradeForm`). Fields: symbol, direction,
  qty, status, prices, entry/exit time, net P&L, fees, setup, tags. An "Emotional state" box has quick-pick
  emotion chips (calm, fomo, revenge, ...) plus free text for before and after the trade, and a notes field.
  Delete with confirmation. Table rows open the edit page; "New trade" button on the log.
- **Goal:** the core of the journal: capture how you felt next to what happened.
- **P&L rule:** a typed net P&L wins. If it is blank, P&L = (exit - entry) x point value x qty (sign flipped
  for shorts) minus fees. Unknown symbol with no P&L is rejected with a message rather than saving 0.
- **Checked end to end in demo mode:** ES short, 5000 -> 4995, fees $4, no P&L typed saved as $246.00
  (5 pts x $50 - $4), with the "fomo" tag shown in the log.
- **Mistake:** the "now" default for entry time called `new Date()` during render; lint flagged it as impure.
  Changed to a lazy `useState(() => ...)` initializer.
- **Not done yet:** screenshots (next commit; they need a saved trade to attach to).

## 11. feat(trades): screenshot upload and gallery

- **What:** `imagesApi.ts` (list / upload / delete) and an `ImageGallery` on the edit page. Add screenshots by
  clicking, drag and drop, or pasting from the clipboard (Cmd+V). Click a thumbnail to enlarge, hover for delete.
- **Goal:** attach the chart screenshots to each trade, privately.
- **How it stays private:** files go in the private `screenshots` bucket under `<user id>/<trade id>/<random>.ext`
  (the storage policy from commit 4 checks that first folder). The page shows one-hour signed URLs, never
  public links. If the database insert fails after the upload, the file is removed so no orphan stays behind.
- **Limit by design:** screenshots attach to a saved trade, so the new-trade page says "save first".
- **Checked in demo mode:** a simulated clipboard paste produced a thumbnail on the page.
- **Not verified yet:** the real Supabase upload, signed URL and storage policy (no project yet). This is the
  riskiest untested piece, so it is first on the list once Supabase exists.

## 12. feat(dashboard): stat cards and date range

- **What:** Overview page with Trade Win gauge (wins/wash/losses counts), Profit Factor with donut, Trade
  Expectancy, Avg Win/Loss with bar, Net P&L, Day Streak and Trade Streak, plus 30D / 90D / 180D / ALL chips.
  Stats gained `grossWin` / `grossLoss`, and `inRange()` does the date filtering.
- **Goal:** the Tradeify-style overview from the reference screenshot, in black and green.
- **Checked by hand:** demo data (7 trades) gives net -92.10, win rate 4/7 = 57.1%, avg win 120.43, avg loss
  -191.27, profit factor 481.7 / 573.8 = 0.84, day streak 2 wins, trade streak 2 wins. The page shows
  exactly these numbers.
- **Mistake:** my `inRange` test used March 1 as a "within 180 days" date, but that is about 216 days before
  Oct 3, so the test failed. The code was right and the fixture was wrong; changed the fixture to April 20.
- **Tooling hiccup (not a code bug):** creating `.env.local` restarted the dev server mid-session and left the
  browser tab with stale hot-reload errors. A reload fixed it.
- **Default range is ALL**, because with only one week of data a 30D default would go empty after a month.

## 13. feat(dashboard): P&L calendar with weekly totals

- **What:** `PnlCalendar` on the Overview page: month and year selectors, previous/next arrows, month total,
  Sunday-first grid with per-day P&L and trade count (green/red tint), a "Weekly" column, and a ring on today.
  Clicking a day opens the trade log filtered to that date (`/trades?date=YYYY-MM-DD`, removable chip).
  Grid maths is a pure function (`src/lib/calendar.ts`) with tests (12 tests pass in total).
- **Goal:** the P&L calendar from the reference screenshot; opens on the month of the latest trade so the
  imported week is visible immediately.
- **Decisions:** days from neighbouring months are dimmed filler and are not counted in weekly totals, so a
  week that spans two months shows each month's part separately. A day belongs to the day the trade was
  entered. The separate Calendar page was dropped: the calendar lives on the Overview like in the reference.
- **Checked by hand:** demo Sep 9 shows -$462.00 (-286.20 - 175.80) and the week of Sep 6 shows -$92.10, 7 trades.
- **Mistakes found while looking at the screenshot:** (1) a large loss like "-$462.00" overflowed its cell;
  now smaller text with no wrapping. (2) the "today" ring was drawn on a dimmed filler day from the next
  month; now only in-month days get it. (3) lint flagged `new Date()` calls during render; moved to helpers
  and lazy state.
