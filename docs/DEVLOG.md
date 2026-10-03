# Devlog

One entry per commit: what changed, why (the goal), and any mistakes or lessons.
Newest entries go at the bottom.

## Conventions

- Small, logical commits. One idea per commit.
- Commit messages describe the change only.
- Mistakes are written down here. Fixes get their own commit; pushed history is not rewritten
  without asking first.

## 0. Initial commit (`66eef72`)

- **What:** `git init`, README placeholder, `.gitignore`, private GitHub repo created and pushed.
- **Goal:** have a repo to build in.
- **Mistake (fixed in entry 40):** the original commit message carried an AI co-author line, which broke the
  project rule that commit messages must not mention the assistant. The rule was given right after this commit.
  The commit ID shown here is the one after the history was rewritten to remove that line.

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

## 14. style: white text for readability

- **What:** default text is now near-white (`--color-fg`), inputs and selects use it, the muted label color is
  much lighter, and borders are slightly brighter. Green remains for accents (buttons, active nav, wins,
  focus) and red for losses.
- **Goal:** the owner found the all-green text hard to read. The "black background, green text" idea from the
  brief is kept as black + green accents; readability wins for body text.
- **Mistake:** I used green as the default text color in the first theme commit without checking contrast on
  long text and small labels. The muted gray-green was also too dark. A screenshot review would have caught
  this earlier; I now check each new page visually before committing.

## 15. feat(import): bulk entry and JSON import

- **What:** Import page with two ways in, both through one tested parser (`src/lib/importTrades.ts`):
  a bulk-entry grid (type or paste rows) and a "Paste JSON" box. The parser accepts loose input (`Buy`/`L`
  for long, defaults for time 09:30 and qty 1), computes P&L from prices minus fees when P&L is blank, and
  reports errors per row ("Row 2: date must look like ..."). A preview shows what will be saved, and the
  import button stays disabled until every row is valid, so a bad import never half-saves.
- **Goal:** get last week's trades (known only from screenshots and notes) into the journal. Plan: the owner
  drops screenshots and notes in the gitignored `data/` folder, I transcribe them to JSON, the owner reviews
  the preview and imports. Private data never goes through git. Screenshots are attached per trade afterwards.
- **Tests:** 5 new parser tests (17 pass in total): price-based P&L with fees, local-time handling, defaults,
  multiple bad rows reported with numbers, JSON shapes.
- **Checked in demo mode:** one valid and one invalid row: error shown for row 2, preview $18.50
  (10 pts x $2 - $1.50), button disabled.
- **Mistakes:** (1) my first browser test pasted garbage because my test tool stringified the JSON, and the
  app correctly said "Not valid JSON"; that was a test-tooling error, not an app bug. (2) My next click used
  stale screen coordinates and opened a different page; I switched to clicking by element reference.
  Nothing was saved (demo is in-memory). (3) Fixed "1 trades" plural before committing.
- **Known limit:** import is not de-duplicated; importing the same file twice creates duplicates.

## 16. feat(reports): equity curve and breakdown charts

- **What:** Reports page (Recharts): equity curve, and P&L by symbol, weekday and entry hour as green/red bar
  charts, plus an "Emotions vs results" table (trades, win rate, avg P&L, total; worst average first), with
  the same 30D/90D/180D/ALL chips. The numbers come from pure functions in `src/lib/reports.ts`, with 5 tests
  (22 pass in total). Only closed trades are counted; a trade with several emotion tags counts in each.
- **Goal:** the analysis part of the brief, especially the link between emotional state and results.
- **Checked by hand in demo mode:** ES +298.40 and MNQ -390.50; equity ends at -92.10 (equals net P&L);
  "frustrated" = 3 trades, 0% wins, avg -191.27; "confident" = 4 trades, 100%, avg +120.43.
- **Mistakes:** axis labels showed "$-150" instead of "-$150"; fixed with a small formatter. A first
  screenshot showed a half-drawn line; that was only chart animation, not a bug.
- **Known cost:** Recharts makes the bundle larger (the build prints a chunk-size warning). Fine for a personal
  tool; could be split with a lazy-loaded Reports route later.

## 17. ci: GitHub Pages deploy workflow

- **What:** `.github/workflows/deploy.yml` (checkout, Node 22, `npm ci`, `npm test`, build with the Supabase
  URL and anon key from repo secrets, upload and deploy to Pages) and `base: '/trading-journal/'` in
  `vite.config.ts`, applied only when `GITHUB_ACTIONS` is set so local dev still runs at `/`.
- **Goal:** every push to `main` that passes the tests gets deployed, once deployment is switched on.
- **Safety switch:** the job only runs when the repo variable `DEPLOY_ENABLED` is `true`. Without this,
  every push would produce a failing run (no secrets, Pages not enabled, repo visibility undecided).
- **Checked locally:** a build with `GITHUB_ACTIONS=true` emits asset URLs under `/trading-journal/`, a normal
  build under `/`, and the workflow file parses. The workflow itself has NOT run on GitHub yet.
- **Open decision:** GitHub Pages on a private repo needs a paid plan. Options are listed in the README.

## 18. docs: setup and deploy instructions

- **What:** README rewritten with the Supabase setup, local run, demo mode, importing last week, the GitHub
  Pages deploy steps, and the private-repo caveat.
- **Goal:** the owner can finish the parts only they can do (create the Supabase project, add secrets, enable
  Pages) without reading code.
- **Status at this point:** everything is built and checked in demo mode, but nothing has run against a real
  Supabase project or on GitHub Pages yet. Untested until then: the SQL migration, real login, row-level
  security, screenshot upload, and the deploy workflow. These are the first things to verify next, and any
  fixes will get their own commits and devlog entries.

## 19. refactor: remove the fees field

- **What:** fees are gone from the trade form, the import grid and JSON, the parser, the `Trade` type, the
  API mapping, the demo data and the tests. The P&L field is now just "P&L ($)": type it, or leave it blank to
  compute it from entry and exit prices.
- **Goal:** the owner asked to remove the fee area. P&L is entered as the final number, so a separate fees
  input only added noise.
- **Behavior change:** blank P&L is now the gross result from prices (before, it was gross minus fees).
- **Database:** the `fees` column still exists but has a default of 0, so inserts keep working. It is dropped
  in the next database migration (0002), which is a deliberate step because dropping is irreversible.
- **Checked:** type-check, lint, 22 tests pass (the import test now expects 40, not 38.5).
- **Mistake:** my scripted edit stopped on one README line because the sentence wrapped differently than I
  assumed, after the code edits had already been written. I fixed the README by hand and re-checked with a
  search that no "fee" text remains in `src/` or the README.

## 20. feat(db): symbols, options and weekly reviews

- **What:** `supabase/migrations/0002_settings_and_reviews.sql`:
  - `symbols` (code + dollar value per point, replaces the hard-coded MNQ/ES values),
  - `options` (pick-lists for emotions, tags and setups),
  - `weekly_reviews` (one row per week, keyed by that week's Monday: emotional, technical, mistakes, lessons,
    plus the outlook for the next week: bias, outlook, key levels, plan),
  - row-level security on all three, seeds MNQ ($2/pt), ES ($50/pt) and 12 emotions for the existing user,
  - drops the `fees` column.
- **Goal:** make the lists editable from an admin page instead of living in code, and give the weekly notes
  a place to be stored.
- **Verified before touching the real database:** both migrations ran in a throwaway local Postgres (PGlite,
  with stand-ins for Supabase's auth/storage schemas). An existing trade survived, `fees` was dropped,
  seeds loaded (2 symbols, 12 emotions), RLS was on for the 3 tables, and 5 bad inserts were rejected
  (lowercase code, duplicate symbol, zero point value, unknown option kind, unknown bias).
- **Limits of that check:** it does not test Supabase's real auth. The policies are the same pattern as 0001,
  which was verified on the real project.
- **Decision:** symbols are stored by code in `trades.symbol` (text), so deleting a symbol from the admin page
  never deletes or breaks old trades.
- **Owner action:** this migration must be run once in the Supabase SQL editor before the new pages work.

## 21. feat(settings): settings data layer and provider

- **What:** `settingsApi.ts` (symbols and options: list / add / update / delete against Supabase), a
  `SettingsProvider` + `useSettings()` giving `symbols`, `pointValues`, and `optionNames('emotion' | 'tag' |
  'setup')`, and the provider wired into `App.tsx` above the trades provider.
- **Goal:** one source of truth for the lists the admin page edits and the trade form and import read.
- **Safety net:** if the new tables cannot be read (for example migration 0002 has not been run yet), the
  provider keeps built-in defaults (MNQ $2/pt, ES $50/pt, the 12 emotions) and stores the error, so the app
  never breaks because of a missing migration. The admin page will show that error.
- **No visible change yet:** nothing reads the settings until the next commits.
- **Checked:** type-check and lint. Not exercised against the real database yet (migration pending).

## 22. feat(trades): use managed symbols and labels in the form and import

- **What:** the trade form takes its symbol dropdown, emotion chips and tag chips from the settings, and offers
  setup names as suggestions. Tags are now chips picked from the managed list, not a comma-separated text
  box. The P&L-from-prices calculation (`pnlFromPrices`) and the import parser take the point values from
  the settings instead of a hard-coded table, so any symbol you add with a point value works. New shared
  `ChipPicker` component. Removed the old hard-coded `emotions.ts`.
- **Goal:** what you can pick must be what you manage on the Admin page.
- **Old data stays visible:** if a trade has an emotion, tag or symbol that was later removed from the lists,
  it still shows (and can be toggled off) in that trade's form, and the symbol stays selectable. Removing an
  item from a list never changes old trades.
- **Tests updated:** the P&L and parser tests now pass the point-value table (22 pass).
- **Checked in a demo-mode browser tab:** dropdown shows MNQ and ES, no Fees field, 12 emotion chips, tags hint.
- **Mistakes:** (1) I changed function signatures first and let the type-checker point out the one caller I had
  not updated (the form), then fixed it; it was caught before committing. (2) My browser check first showed the
  Overview instead of the form because the tab had not finished loading; I reloaded with a cache-busting
  query and re-read the page text.
- **Tooling:** added a second dev-server config ("demo", port 5174, `VITE_DEMO=1`) so I can look at the UI with
  fake data while `.env.local` points at the real Supabase project.

## 23. refactor: remove the import page

- **What:** deleted the Import page, the CSV/JSON parser and its tests, the bulk-insert API call, the nav
  item and the README section. Trades are added one at a time with **New trade**.
- **Goal:** the owner enters data by hand and asked to remove the section. Less code to maintain and no
  duplicate-import risk.
- **Supersedes** devlog entry 15 and the plan to transcribe screenshots into JSON; the owner adds trades manually.
- **Checked:** type-check, lint, 21 tests pass (the 5 parser tests went with the parser). A search finds no
  remaining references to the import code.
- **Note:** `pnlFromPrices` stays, because the trade form still computes P&L from prices.

## 24. refactor: remove open/closed trade status

- **What:** every trade is a finished trade, so the status field is gone from the form, the trade log (the
  Status column), the type, the API mapping, the stats and report functions (no more "closed only"
  filters), the demo data, the "N open" note on Net P&L, and the tests. The calendar opens on the newest trade.
  Migration 0002 now also drops `trades.status`.
- **Goal:** the owner records only completed trades; the extra field and filters were noise.
- **Behavior change:** P&L is now always required. Type it, or give entry and exit prices for a symbol with a
  point value; otherwise saving shows an error (before, an "open" trade could be saved without P&L).
- **Tags:** the comma-separated tags box no longer exists (entry 22): tags are chips picked from the list you
  manage on the Admin page.
- **Checked:** type-check, lint, 21 tests pass (fixtures that included an open trade were updated), and 0002
  re-run in the local test Postgres: both columns gone, existing trade kept. 0002 had not been run on the real
  database yet, so extending it was safe; had it already run, this would have needed a 0003.
- **Mistake avoided:** I almost left the old "open trade" fixtures in the tests, which would have silently
  changed what the tests proved; I removed those rows and recomputed the expected counts by hand (5 trades).

## 25. refactor(dashboard): remove the trade expectancy card

- **What:** removed the Trade Expectancy card, the `expectancy` value from the stats and its test line, and
  the README mention.
- **Goal:** the owner does not use this number; every card on the dashboard should be one that is read.
- **Checked:** type-check, lint, 21 tests pass, and a browser screenshot in demo mode: the remaining cards
  (win gauge, profit factor, avg win/loss, net P&L, day and trade streak) fill the grid without a gap.

## 26. feat(review): weekly review and next-week outlook

- **What:** a "Weekly review" page (`/review`, book icon in the sidebar). Pick a week (Monday to Sunday, with
  previous/next arrows and a "Last week" shortcut). It opens on the week of your newest trade. Each week has:
  - this week's numbers (net P&L, trades, win rate, wins/losses), computed from your trades,
  - **Looking back:** emotional analysis, technical analysis, mistakes I made, lessons,
  - **Next week outlook:** market bias (bullish / bearish / neutral / unclear), market thoughts, key levels,
    game plan and rules.
  The following week then shows what you wrote as a read-only "What I expected for this week" card, so you can
  compare your expectation with what really happened.
  Week maths is in `src/lib/weeks.ts` with 4 tests; storage is `src/lib/reviewsApi.ts` (one upserted row per week).
- **Goal:** text-only space for the owner's analysis of mistakes and their thoughts on the coming week.
- **Design choices:** one explicit Save button (not autosave), and a warning before leaving a week with unsaved
  text. The outlook is stored on the week it was written in; it is shown again on the next week.
- **Checked in demo mode:** the page opened on Sep 7 - Sep 13 with the right numbers (-92.10, 7 trades, 4 wins,
  3 losses); text typed into Mistakes and Market thoughts landed in the right boxes, Save showed "Saved", and the
  next week displayed the saved thoughts under "What I expected".
- **Mistake caught before committing:** I first picked the starting week inside the page component, which can
  render before trades have loaded and would have opened on the wrong week. Moved it into a child that mounts
  after loading. Also: my browser test needed a separate JavaScript read of the textareas to prove which boxes
  received the text, because the click targets looked identical in the log.
- **Not verified yet:** saving to the real database (needs migration 0002 to be run first).

## 27. feat(admin): manage symbols, emotions, tags and setups

- **What:** an Admin page (gear icon in the sidebar):
  - **Symbols:** add or delete a symbol and edit its dollars-per-point (saved when you leave the field or
    press Enter). Codes are stored upper-case; duplicates are rejected with a clear message.
  - **Emotional conditions, Tags, Setups:** chips with an x to remove and a box to add. Deleting asks for
    confirmation and says how many existing trades use that item.
  - A yellow banner explains it if the settings tables cannot be read (migration 0002 not run yet).
- **Goal:** everything the trade form offers is editable without touching code.
- **Safety rule:** removing a symbol or label never changes old trades. They keep their text; the item just
  stops being offered for new trades.
- **Checked end to end in demo mode, without reloading the page:** added symbol NQ at $20/pt and the emotion
  "impatient"; the new-trade form immediately offered both; saving an NQ trade with entry 20000 and exit 20010
  and no P&L gave $200.00 (10 points x $20), and the trade log has no Status column.
- **Not verified yet:** saving settings to the real database (needs migration 0002).
- **Admin security:** the app has a single user, signups are off, and every table has row-level security, so
  the person who can open Admin is the only one who can read or change anything. The next commit shows the
  signup status on the Admin page and adds data export and password change.

## 28. feat(admin): security status, backup export and password change

- **What:** three more cards on the Admin page:
  - **Security:** shows who is signed in and asks Supabase live whether new signups are disabled. If they are
    ever enabled it shows a red warning with where to switch them off.
  - **Backup:** "Download backup (JSON)" (trades, weekly reviews, symbols, lists) and "Download trades (CSV)".
    Screenshots are not included; they stay in Supabase Storage.
  - **Change password:** new password twice, minimum 8 characters, through Supabase auth.
- **Goal:** the owner wants to be the only admin. Single user + signups off + row-level security already
  enforces that; this makes the state visible and gives a way to keep a copy of the data.
- **Tests:** 2 new tests for CSV quoting and the trades CSV row (23 pass in total).
- **Checked:** the signup endpoint (`/auth/v1/settings`) answers browser requests from localhost (CORS
  header present) and reports `disable_signup: true` for the real project. The page was checked in demo mode;
  in demo mode the signup check says it cannot run and the password form is hidden.
- **Not verified yet (needs the owner's login):** the live signup status on the page, the password change,
  and the JSON download with real data.
- **Mistake:** lint flagged setting state synchronously inside the effect for the signup check; I made the
  initial state depend on configuration instead.

## 29. feat(review): saved reviews list, clear form after saving

- **What:** the Weekly review page now has a "Saved reviews" list (newest first; week, bias for next week,
  number of trades and P&L of that week, and the first lines of text). Click an entry to open it for reading or
  editing; the trash icon deletes it after confirmation. After a successful save the form is cleared and a
  green note confirms where the review went.
- **Where reviews are stored:** in the Supabase table `weekly_reviews`, one row per week (the Monday date is
  the key). Only the logged-in owner can read it (row-level security), and the Admin backup includes it.
- **Why it was missing:** the first version only showed one week at a time; there was no way to see which
  weeks had a saved review. The owner asked for the list and for the form to clear after saving.
- **Data-loss guards (added deliberately because of the clearing):**
  1. The Save button is disabled while the form is empty, so a cleared form can never overwrite a saved review
     with blank text (`isReviewEmpty`, 2 new tests, 25 pass in total).
  2. If you type into a cleared form for a week that already has a saved review, saving asks "Replace it?".
- **Checked end to end in demo mode:** typed a mistake note and saved: all 7 boxes were empty afterwards, the
  confirmation showed, the list showed the week with 7 trades and -$92.10 and the note's text, Save was
  disabled; clicking the list entry reloaded the text and re-enabled Save.
- **Mistake in the first version:** a review could only be reached by paging to its week, so saved work felt
  lost. Clearing a form that auto-reloads the same week would also have re-filled it, so the editor now
  starts blank after a save instead of reloading.
- **Not verified yet:** the same flow against the real database (migration 0002 must be applied; the owner's
  last message showed it was still missing).

## 30. feat(ui): Yes/No confirmation dialog for deletes

- **What:** a shared in-app dialog (`ConfirmProvider` + `useConfirm()`) with **No** and **Yes** buttons replaces
  the browser's built-in popups everywhere: deleting a trade, a screenshot, a symbol, an emotion/tag/setup and
  a weekly review, plus the two non-delete questions ("Leave without saving?" and "Replace the saved review?").
  Delete dialogs have a red Yes. The dialog explains the effect, for example "2 existing trade(s) use ES. They
  are kept...".
- **Goal:** the owner asked for a Yes/No confirmation on delete buttons; the in-app dialog matches the app's
  style and is clearer than a system popup.
- **Safety details:** No is focused when the dialog opens, so a stray Enter cannot delete anything. Escape or a
  click outside the box also counts as No. A second question replaces the first (answered No).
- **Checked in demo mode** by driving the real page: No kept ES, Escape kept ES, clicking outside kept ES, a
  click inside the box left it open, Yes deleted ES. No `window.confirm` call is left in `src/`.
- **Mistake:** while testing I clicked at screen coordinates I had misjudged and hit Yes instead of No, which
  deleted the demo symbol ES (demo data only, nothing real). I then reproduced the No path through the page
  itself to prove the dialog was right and my aim was wrong, rather than assuming the code was buggy.

## 31. style: gap after the dropdown arrow

- **What:** one global CSS rule gives every dropdown its own chevron arrow with a gap after it (2.5rem of right
  padding), instead of the browser's default arrow that sat tight against the right edge.
- **Goal:** the owner pointed out the "All symbols" dropdown on the Trades page had no gap after the arrow.
  A single rule fixes it for all dropdowns (month/year in the calendar, symbol/direction in the trade form,
  market bias in the weekly review) so they match.
- **Checked:** production build passes; screenshot of the Trades page in demo mode shows the gap.
- **Note:** I fixed it globally on purpose rather than only on that one select, so the dropdowns do not end up
  looking different from each other. The other dropdowns were not individually screenshotted.

## 32. feat(i18n): language switch with English and Georgian

- **What:** a small translation system (no library): `src/i18n/en.ts` (English, the source of truth),
  `ka.ts` (Georgian, typed so it must have exactly the same keys), `LanguageProvider` and `useI18n()` giving
  `t(key, params)`, `tn(key, n)` for singular/plural, and the date locale. A language button sits above "Sign
  out" in the sidebar and in the corner of the login page; it shows the name of the other language ("ქართული"
  / "English"). The choice is saved in the browser (`localStorage`), defaults to Georgian if the browser is
  set to Georgian, and also sets `<html lang>` and the browser tab title.
- **Translated in this commit:** sidebar, login page, "Supabase is not configured" screen, demo banner.
  The remaining pages follow in the next commits, one area at a time.
- **Safety nets:** a missing Georgian string falls back to English, then to the key itself, so the UI never
  goes blank. 8 new tests (33 pass in total) check that Georgian has exactly the English keys, nothing is
  empty, placeholders like `{n}` match in both languages, and every `_one` has an `_other`.
- **Decisions:** money stays `$1,234.56` in both languages. Dates and month names will follow the language.
  Things you type yourself (notes, setup names, tags) are never translated. The built-in emotion names will
  be shown in Georgian while the stored value stays English, so old trades and reports keep working.
- **Checked in the browser (demo mode):** pressing the button switched the sidebar, banner and tab title to
  Georgian, saved the choice, set `lang="ka"`, and the Georgian letters render correctly.
- **Caveat:** I wrote the Georgian text myself. It should be read by a Georgian speaker (you); wording that
  sounds unnatural is easy to change in `ka.ts` and I would like your corrections.

## 33. feat(i18n): translate the dashboard and calendar

- **What:** Overview cards (win gauge, profit factor, avg win/loss, net P&L, day and trade streaks, the
  30D/90D/180D/ALL chips) and the P&L calendar (title, month and year pickers, weekday names, "Weekly"
  column, "N trades") in English and Georgian. Counts use plural-aware strings (`unit.trade_one/_other`).
- **Goal:** the first real pages in Georgian, and the base for date handling in all later pages.
- **Mistake found by looking at the screen:** the Georgian dashboard showed English month and weekday names.
  The browser pane I test in has no Georgian locale data (`Intl` silently fell back to English), and some of
  your own devices might not have it either. My new date tests passed anyway, because Node has full locale
  data, so they gave a false sense of safety.
- **Fix:** Georgian month names, short weekdays, the short "7 სექ" form and the numeric date (11.09.2026) are
  now written out in `src/i18n/dates.ts` instead of coming from the browser. English still uses the browser.
  The tests now check the exact Georgian strings, so they no longer depend on the machine's locale data.
- **Also:** `fmtDate` / `fmtTime` / `formatWeek` now take the language; `Trades` got a one-line change to
  pass it so the build stays green (its text is translated in the next commit). 37 tests pass in total.
- **Checked in the browser (demo mode):** Georgian dashboard text, calendar weekdays (კვი ორშ სამ ...), month
  სექტემბერი, "კვირა", and "N ტრეიდი" counts. Narrow day cells wrap "2 ტრეიდი" onto two lines in a small window.

## 34. feat(i18n): translate trades, the trade form and screenshots

- **What:** the trade log (headers, search box, symbol filter, "New trade", Long/Short as ლონგი/შორტი, hold
  time as "20 წთ" / "1 სთ 5 წთ", the empty state), the new/edit trade page and form (all labels, hints,
  the P&L error message, the emotion section), the screenshot box, and the Yes/No confirm dialog (დიახ / არა).
  The sidebar brand text too.
- **Built-in emotions:** the 12 default emotions show in Georgian (მშვიდი, თავდაჯერებული, შურისძიება, ...)
  through a `te()` helper, but what is stored in the database stays the English word, so old trades, filters
  and the Reports page keep matching. Emotions you add yourself are shown exactly as you typed them.
- **Checked in the browser (demo mode):** the trade log, dates (11.09.2026), directions, hold times, emotions
  and the whole new-trade form read in Georgian. A scan of the changed files found no remaining English
  text in the page markup.
- **Mistakes:** (1) I replaced `holdTime` with `holdMinutes` using an edit that cut off everything after it in
  `format.ts`, which deleted the two date-input helpers (`toLocalInput`, `fromLocalInput`). The type-checker
  reported it immediately and I restored them from git before anything was committed. (2) My first string
  search missed the "New trade" button text, and I only noticed it when I read the page in Georgian; I then
  ran a scan for leftover literal text rather than trusting the search. (3) In the trade row I had to
  rename the `t` (trade) prop to `trade` so that `t()` could be the translate function.
- **Tests:** 2 new tests for plural strings and emotion names (39 pass in total).

## 35. feat(i18n): translate the weekly review

- **What:** the whole weekly review page and the saved-reviews list: week navigation, the four "looking
  back" boxes with their hints, the next-week outlook, "What I expected" card, bias values (ზრდადი / კლებადი /
  ნეიტრალური / გაურკვეველი), the Save button, the confirmation and the Yes/No questions. Week ranges follow
  the language ("7 სექ – 13 სექ, 2026").
- **Goal:** the page you write your own analysis in should be fully in the language you think in.
- **Checked in the browser (demo mode):** typed a note and saved; the confirmation, the week header, the bias
  dropdown options and the list entry (week, "7 ტრეიდი", P&L, note excerpt) were all Georgian. Type-check,
  lint and 39 tests pass; a scan found no remaining English text in the two files' markup.
- **Reminder:** your own text (analysis, notes) is stored exactly as typed in whichever language you write.
  Only the labels around it change with the language switch.

## 36. feat(i18n): translate reports and the admin page

- **What:** the Reports page (chart titles, tooltips, the emotions table, weekday names on the chart, "(none)")
  and the whole Admin page (symbols, emotion/tag/setup lists with their delete questions, security status,
  backup buttons, change password), plus the wrong-password message on the login page. With this, every piece
  of text in the app is available in both languages.
- **Goal:** finish the Georgian version so no screen mixes the two languages.
- **Design details:** the "already exists" error is now a typed `DuplicateError`, so it can be worded in the
  current language instead of a fixed English sentence. Weekday buckets in Reports stay English inside the
  code (so the maths and tests are unchanged) and are only renamed when drawn.
- **Checked in the browser (demo mode):** Admin and Reports fully Georgian, the delete dialog says
  "წაიშალოს სიმბოლო ES? ... არა / დიახ", and one click on the language button returns everything to English
  with the choice remembered. A scan of all `.tsx` files finds no hard-coded English UI text left. Type-check,
  lint and 39 tests pass.
- **Mistake:** my first version of the `DuplicateError` class used a constructor shortcut that this project's
  TypeScript settings do not allow; the compiler said so immediately and I wrote the field out explicitly.
- **Known limits:**
  1. Error messages that come straight from Supabase (for example a network failure) stay in English; only the
     wrong-password message is translated.
  2. Your own notes, tags, setups and custom emotions are never translated; they appear as you typed them.
  3. **I wrote all Georgian text myself and it has not been reviewed by a native speaker.** Please read it and
     send corrections; every sentence is a single line in `src/i18n/ka.ts`. Trading words are transliterated
     the way I assumed traders say them (ლონგი, შორტი, ბექაფი, სქრინშოტი, სეტაპი); change them if you use
     different ones.

## 37. feat(db): Georgian names for emotions, tags and setups

- **What:** `supabase/migrations/0003_option_names_ka.sql` adds `options.name_ka` (the Georgian name). `name`
  stays the English name and is still the value saved on trades; `name_ka` is only what is shown when the app
  is in Georgian. The 12 built-in emotions get their Georgian names. Two items of the same kind cannot share a
  Georgian name (a unique index), because they would look identical on screen.
- **Goal:** the owner wants every new emotion, tag or setup to have both an English and a Georgian name, and
  the app to show the one matching the language. The previous "emotions are stored as typed" approach could
  show two identical-looking chips in Georgian (for example the built-in "calm" and a hand-typed "მშვიდი").
- **Design choice:** trades keep storing the English name, so no trade has to be rewritten and Reports keeps
  grouping correctly. Only the display changes with the language.
- **Verified before touching the real database** (local throw-away Postgres, migrations 0001, 0002 and 0003
  in order): 12 of 12 emotions got a Georgian name, a custom tag created before 0003 survived with no Georgian
  name, a duplicate Georgian name and a blank one were rejected, the same Georgian text in a different kind
  (emotion vs setup) is allowed, and running the file a second time is harmless.
- **Owner action:** run this file once in the Supabase SQL editor. Until then the app keeps working and falls
  back to the built-in translations; the new add form (next commits) needs the column.

## 38. feat(admin): English and Georgian names for emotions, tags and setups

- **What:** every emotion, tag and setup now has an English name (the value saved on trades) and a Georgian
  name (what the app shows in Georgian). On the Admin page each list is a table with both names; adding an item
  requires both. A pencil edits the Georgian name only. Why only that one: the English name is what trades
  store, so renaming it would silently detach old trades from it. The data layer got `optionLabel()` (which
  name to show for a language) and `validateNames()`, with 8 new tests (47 pass in total).
- **Goal:** the owner asked for both values to be asked for and used.
- **Rules:** both names are required. The English field must not contain Georgian letters, which catches the
  two fields being swapped. A duplicate English or Georgian name is refused. If the Georgian name is missing
  (items created before this change, or if migration 0003 is not run yet), the built-in emotion translation is
  used, otherwise the English name.
- **Safe before the migration:** loading the lists falls back to the old query if the `name_ka` column does not
  exist yet, so pulling this code before running 0003 does not break the app. Adding items needs the column.
- **Checked in the browser (demo mode):** typing the words into the wrong fields showed "The English name must
  not contain Georgian letters. Did you swap the two fields?" and added nothing; a correct pair
  (restless / მოუსვენარი) was added, the form cleared and the error disappeared.
- **Mistake in my test, not in the app:** my select-all keystroke did not register, so my second attempt was
  appended to the first and I briefly thought the add was broken. I selected the field text through the page
  instead and the add worked. I am recording it because it cost a wrong first conclusion.
- **Not done yet:** the new names are not shown on the trade form, trade log and reports yet; that is the next
  commit.

## 39. feat(ui): show emotion, tag and setup names in the current language

- **What:** the trade form (emotion and tag chips), the trade log (emotion column and search), and the
  Reports emotions table now show each item's English or Georgian name depending on the language. The Setup
  field is now a pick-list of your setups (it was free text with suggestions), so its names can be translated
  too; a trade whose setup was later removed from the list still shows it. The backup file includes both names.
- **Goal:** finish the bilingual lists: add once with both names, see the right one everywhere.
- **Search:** the trade log search also matches the names as shown on screen, so typing Georgian finds
  Georgian-labelled emotions and tags.
- **Cleanup:** the earlier `te()` emotion helper is gone; the built-in translations are now only a fallback
  inside `optionLabel()` for items that have no stored Georgian name.
- **Checked in the browser (demo mode):** added the emotion restless / მოუსვენარი, opened the new-trade form
  without reloading: the chip read "restless" in English and "მოუსვენარი" in Georgian after pressing the
  language button; the trade log's emotion column showed Georgian names; searching the Georgian prefix
  "იმედგაც" returned exactly the 3 "frustrated" trades. Type-check, lint and 47 tests pass.
- **Behavior change to be aware of:** the Setup field no longer accepts free text. Add setups on the Admin page
  first (with both names), then pick them on the trade form.
- **Owner action:** run `0003_option_names_ka.sql` once in the Supabase SQL editor (the README lists it now).
  Not verified against the real database until then.

## 40. chore: rewrite history before publishing, then publish

- **What:** before making the repository public, I removed the co-author line from the first commit message.
  It was the only commit message that mentioned the assistant. That required rewriting history with
  `git filter-branch` and a force push (`--force-with-lease`), which changes every commit ID.
- **Done only with the owner's explicit approval** (they chose "Yes, remove it") because a force push cannot be
  undone for anyone who has a copy.
- **Verified before pushing:** a local backup branch of the old history was kept and compared with the result:
  still 40 commits, the file contents of the latest commit are identical (empty diff), all 40 commit subjects
  and dates are unchanged, and no commit message mentions the assistant any more.
- **Pre-publish checks:** no keys, tokens or environment files are in any file or in any commit of the history;
  the `.env.local` file is ignored; only the public (publishable) Supabase key is ever used, and it is supplied
  through GitHub secrets at build time. The unit tests (47) and the production build pass.
- **Mistake risk I avoided:** I did not rewrite history on the first attempt to "tidy" the repo; I asked first,
  made a backup, verified the result and only then pushed.
- **Note:** this devlog still describes the removed line in words (entries 0 and 40), because you asked for
  mistakes to be documented. It does not appear in any commit message.

## 41. Published to GitHub Pages

- **What:** the repository was made public (owner's choice), the two Supabase values were stored as GitHub
  secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, read from the local `.env.local` and not printed),
  the repo variable `DEPLOY_ENABLED=true` was set, Pages was switched to "GitHub Actions", and the deploy
  workflow was run. Live at https://ggnadirashvili.github.io/trading-journal/.
- **CI result:** install, 47 tests, build and deploy all passed (22 seconds). Pushes to `main` now deploy
  automatically.
- **Checked on the live site:** the page and its JavaScript and CSS load from `/trading-journal/...` (HTTP 200);
  the browser shows the login screen with no console errors.
- **Checked what the public files contain:** the Supabase address and the publishable key are in the bundle (that
  is how a website talks to Supabase, and it is intended); no secret key, no token, no demo mode or demo data.
  A search match for "sb_secret_" turned out to be Supabase's own library recognising key prefixes, not a key.
- **Checked that data stays private even though everything above is public:** with only the public key and no
  login, reading trades, reviews, symbols, lists and screenshot records returns nothing, and inserting a trade
  is refused by the row-level security rule.
- **Mistake / hiccup:** my first attempt to make the repo public used `gh repo edit`, which hung with no output
  and hit the tool timeout; I stopped it, confirmed nothing had changed (the repo was still private) and did the
  same change through the GitHub API, which worked.
- **Not verified (needs the owner's login):** signing in on the live site, and every feature against the real
  database after 0003. Warnings from GitHub (not errors): the official deploy actions still run on Node 20, which
  GitHub is phasing out; to be updated later when newer versions exist.
- **Still to do by the owner:** run migration 0003 in Supabase, and add the live address to Supabase
  (Authentication, URL Configuration) so email links such as password reset point to the live site.

## 42. feat(db): starting lists for every new account, and how to add another user

- **What:** `supabase/migrations/0004_seed_new_users.sql`: a database trigger that gives each newly created
  account the same starting lists as yours (symbols MNQ $2/pt and ES $50/pt, and the 12 emotions with Georgian
  names). A README section explains how to add another person.
- **Goal:** the owner wants a second account for a friend, with no admin rights. The app has no admin tier:
  every account only touches its own rows, and admin power is the owner's Supabase and GitHub logins.
- **Why the trigger was needed:** migrations 0002 and 0003 only seeded accounts that existed at that moment, so
  a new user would have seen an empty symbol dropdown and been unable to add a trade.
- **Verified locally with two simulated users (throw-away Postgres, migrations 0001 to 0004 in order):**
  - a user created after 0004 gets exactly 2 symbols and 12 emotions, all 12 with Georgian names;
  - the second user sees 0 of the first user's trades, weekly reviews, screenshot records and storage files;
  - their updates and deletes on the first user's rows change 0 rows;
  - inserting a row that names the other user as owner, writing into the other user's screenshot folder, and
    moving their own row to the other user are all refused;
  - they can write their own rows and their own storage folder;
  - the seed function cannot be called directly from the website (permission denied).
- **Mistake in my test output:** the test printed the owner's symbol count with a wrong "0 expected" note; the
  owner correctly has 2 from migration 0002. The behavior was right, my label was wrong.
- **Limits stated plainly:** (1) the owner can read everyone's data in the Supabase dashboard; (2) invite and
  password-reset emails are not supported because the app has no page for setting a password from an email link
  and I have not tested that flow, so accounts are created with a password by the owner; (3) this was tested
  locally, not yet with a real second login on the live site.
- **Owner action:** run this migration once in the Supabase SQL editor before creating the friend's account, and
  after 0003.

## 43. feat(accounts): prop-firm account rules engine

- **What:** `src/lib/accounts.ts`: a pure function `evaluateAccount(account, trades)` that works out where a
  prop-firm account stands: balance, loss limit ("floor"), how much you can still lose, how much is left to the
  profit goal, progress bars, and whether it is active, passed or failed (with the day it ended). No screens yet.
- **Goal:** the owner trades prop-firm accounts (current one: 50k size, 2k max drawdown, 53k goal, now about 49k
  so 1k of room left). The numbers must be right before they are shown.
- **Rules built in:**
  - the floor can be **static** (start minus drawdown), **trailing** (follows the highest balance after each
    trade) or **trailing end-of-day** (follows the highest closing balance, counted once the day is over); the
    trailing types can stop rising once the floor reaches the starting balance (how most firms do it);
  - a trade that brings the balance **to or below** the floor fails the account; reaching the goal passes it;
    whichever comes first ends the account and later trades no longer move its balance;
  - a **balance adjustment** lets an account that already has results start at its real balance (49k) and a
    known earlier **peak** is respected; a **manual** passed/failed result overrides the numbers (for example
    when the firm ends an account for a rule the numbers cannot show).
- **Tests:** 17 new tests with hand-computed numbers, including the owner's own account (balance 49,000, floor
  48,000, 1,000 of room, 4,000 to the goal, half the drawdown used) (64 pass in total).
- **Assumption to confirm:** I do not know which floor type the owner's firm uses (many use trailing). The form
  will let each account pick one; trailing after each trade is the default because it is the strictest, so the
  app never shows more room than the firm would allow. Only closed trades are known, so intraday dips and open
  profit cannot be seen.

## 44. feat(db): trading session column

- **What:** `supabase/migrations/0005_trade_session.sql` adds `trades.session` with exactly seven allowed values:
  `asia`, `london`, `ny_premarket`, `ny_am`, `ny_lunch`, `ny_pm`, `outside`.
- **Goal:** the owner wants every trade to carry the session it was taken in, and win-rate statistics per session.
- **Why the column allows empty values:** trades saved before this change have no session and must keep
  working. The app (next commits) makes the session mandatory for every trade it saves from now on, and editing
  an old trade requires choosing one, so old trades get classified over time.
- **Verified locally (throw-away Postgres, migrations 0001 to 0005):** an older trade survives with an empty
  session, all seven values are accepted, three invalid values ("NY AM", "tokyo", "") are rejected, and running
  the file twice is harmless.
- **Owner action:** run this file once in the Supabase SQL editor (after 0003 and 0004).

## 45. feat(trades): mandatory session on every trade

- **What:** the trade form has a **Session** dropdown: Asia, London, NY Premarket, NY AM, NY Lunch, NY PM,
  Outside of session (in Georgian: აზია, ლონდონი, NY პრემარკეტი, NY AM, NY ლანჩი, NY PM, სესიის გარეთ). It starts
  on "Select a session…" with no default and is required: the browser blocks saving, and the form shows a message
  if that check is ever bypassed. The trade log has a Session column ("Not set" for old trades). The session is
  saved with the trade, included in the CSV and JSON backups, and the demo data has sessions.
- **Goal:** every trade must be classified so statistics can be built per session (next commit).
- **Old trades:** they have no session. To save any changes to one, a session must be chosen, so they get
  classified as you touch them.
- **Not automatic:** the session is chosen by you, not guessed from the entry time. Session hours depend on the
  time zone and on the definition you use, so I did not hard-code a guess.
- **Checked in the browser (demo mode):** the dropdown lists the seven options in order, starts empty, is
  marked required, and the form is invalid until a session is chosen. Type-check, lint and 64 tests pass (the
  CSV test now also checks the session column).
- **Owner action:** run `0005_trade_session.sql` in the Supabase SQL editor before using this version with
  your real database: saving a trade writes the new column, and without it the save would be refused.

## 46. feat(reports): win rate by session

- **What:** a "Win rate by session" card on the Reports page (it follows the 30D/90D/180D/ALL range): a bar
  chart of the win rate per session (green at 50% or above, red below, with a dashed 50% line and the
  percentage on each bar) and a table with trades, win rate with the win count (for example 1/3), average P&L
  and total P&L. Sessions are always listed in your order (Asia, London, NY Premarket, NY AM, NY Lunch, NY PM,
  Outside of session); sessions with no trades are left out; trades saved before sessions existed appear last as
  "Not set". The calculation (`bySession`) has 4 new tests (68 pass in total).
- **Definitions:** win rate = winning trades divided by all trades in that session. A break-even trade (exactly
  0) counts as a trade but not as a win.
- **Checked by hand in demo mode:** NY AM has 3 trades with 1 win (33%), total -278.80, average -92.93; Asia,
  London and NY PM are 1 of 1 (100%); NY Lunch is 0 of 1. The chart and table show exactly these numbers.
- **Small known flaw:** a 0% bar has no height, and its "0%" label is not drawn on the chart; the table shows it.
- **Georgian:** the card, its columns, the note and the tooltip are translated; the session names use the
  common trader spellings (NY AM, NY PM stay in Latin letters). Please check the wording.
- **Deployment note:** these session commits are committed locally but **not pushed yet**, on purpose. Pushing
  deploys the live site automatically, and the live site would then try to save the new `session` column before
  migration 0005 exists in the real database, so saving trades there would fail.

## 47. feat(db): prop-firm accounts

- **What:** `supabase/migrations/0006_accounts.sql`: an `accounts` table (account id, size, max drawdown, profit
  goal as a target balance, drawdown type, trailing lock, balance adjustment, known earlier peak, manual
  passed/failed with a date, opening date) and `trades.account_id`. Row-level security keeps accounts private to
  their owner. The trades policy now also requires that a trade can only point at an account of the SAME user.
  Deleting an account keeps its trades (they simply have no account).
- **Goal:** track the owner's prop-firm accounts (current: 50k, 2k drawdown, 53k goal, now about 49k) and which
  trades belong to which account.
- **Why the extra trades rule:** a foreign key alone only checks that an account exists, not whose it is, so
  without the new check a user who guessed another user's account id could attach their own trade to it.
- **Verified locally with two simulated users (throw-away Postgres, migrations 0001 to 0006):** an older trade
  survives with no account; the owner's account is created with the defaults (trailing, lock on) and the old
  trade is attached to it; the friend sees only their own accounts, cannot edit or delete the owner's account,
  cannot save a trade on it, and can save a trade on their own account; both users may use the same account
  name; six bad inputs are rejected (goal not above the size, zero drawdown, blank name, unknown drawdown type,
  manual status without a date, duplicate name for the same user); deleting an account keeps its trade.
- **Weakness in my own test:** the "move a trade onto someone else's account" check ran when that user had no
  trade yet, so it proved nothing. The "save a trade on someone else's account" check does prove the rule, and
  the same policy covers updates, but I have not run a meaningful update test.
- **Not idempotent:** like 0002, this file must be run once.
- **Owner action:** run it in the Supabase SQL editor after 0005, before using the accounts screens.

## 48. feat(accounts): store accounts and attach each trade to one

- **What:** the app side of accounts, with no new screens yet. Trades now carry an `accountId`. New pieces: an
  accounts API (list, create, edit, mark passed/failed by hand, delete), an `AccountsProvider` that works out
  where every account stands from its trades (using the rules engine from entry 43) and splits them into
  active accounts and a history, and an **account filter** state (all accounts or one) that remembers your
  choice and gives the "scoped" trades the dashboard, trade log and reports will use. The trade form has an
  **Account** dropdown as its first field.
- **Rules in the trade form:**
  - when you have accounts, choosing one is required for every new trade;
  - only accounts still in play (not passed, not failed) are offered, and if there is exactly one, it is chosen
    for you; if you have none, or all are finished, a yellow notice with an "Add account" button replaces the
    dropdown;
  - editing a trade that belongs to a finished account keeps that account in its list;
  - trades that existed before accounts (no account) can still be saved without one.
- **Why only active accounts take new trades:** a failed or passed account is over; adding trades to it would
  make the history wrong. When an account fails you add the next one.
- **Demo data** now has a current account and an older one that failed in August, so history can be checked.
- **Checked in the browser (demo mode):** the new-trade form shows "Account" first, offers only the active demo
  account, preselects it, and marks it required. Type-check, lint and 68 tests pass.
- **Mistake:** my scripted edit of `App.tsx` produced wrong indentation (the same slip I made twice before in
  this project); I rewrote the whole file instead of patching it, and the compiler found nothing else.
- **Deployment note:** not pushed yet (needs migrations 0005 and 0006 in the real database first).
