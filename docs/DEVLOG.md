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
