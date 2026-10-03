# Trading Journal

A private, personal trading journal for MNQ and ES futures. It is for notes and statistics only.

- Log trades with the emotional state before and after, tags, notes and screenshots.
- Overview dashboard: win rate, profit factor, avg win/loss, streaks, P&L calendar with weekly totals.
- Reports: equity curve, P&L by symbol / weekday / hour, and emotions vs results.
- Black background, white text, green for profit and red for loss.

## Architecture

| Part     | Choice                                                                |
| -------- | --------------------------------------------------------------------- |
| Frontend | React + Vite + TypeScript, Tailwind, Recharts                         |
| Backend  | None custom. Supabase free tier: Postgres, Auth, Storage              |
| Privacy  | Single-user login, signups disabled, row-level security on all tables |
| Hosting  | GitHub Pages (static), built by GitHub Actions                        |

The Supabase **anon key** ships in the frontend bundle. That is expected: without a signed-in session,
row-level security returns nothing. Never use the `service_role` key in this project. Personal data
(screenshots, notes) is never committed to git; `data/` is gitignored.

See [docs/DEVLOG.md](docs/DEVLOG.md) for every commit, its goal, and the mistakes made along the way.

## Setup

### 1. Supabase

1. Create a free project at <https://supabase.com>.
2. SQL Editor: run [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql). It creates the
   tables, row-level security policies and the private `screenshots` bucket.
3. Authentication -> Users -> Add user: create your own email + password (tick "Auto confirm").
4. Authentication -> Sign In / Providers: turn **off** "Allow new users to sign up". Now only your account exists.
5. Project Settings -> API: copy the Project URL and the `anon` public key.

### 2. Run locally

```bash
cp .env.example .env.local   # fill in the URL and anon key
npm install
npm run dev
```

`npm test` runs the unit tests, `npm run build` makes a production build, `npm run lint` lints.

Demo mode: put `VITE_DEMO=1` in `.env.local` to try the UI with fake in-memory data and no login
(development only; production builds never include it). Remove it to use your real data.

### 3. Add trades

Use **Trades -> New trade**. Leave P&L empty to compute it from the entry and exit prices using the point value
of the symbol (set on the Admin page), or type the final P&L yourself. Open a trade afterwards to add
screenshots (click, drop, or paste with Cmd+V).

### 4. Deploy to GitHub Pages

1. Repo -> Settings -> Secrets and variables -> Actions:
   - Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
   - Variable: `DEPLOY_ENABLED` = `true` (the workflow stays off until this is set).
2. Repo -> Settings -> Pages -> Source: **GitHub Actions**.
3. Push to `main` (or run the workflow manually). The site appears at
   `https://<your-username>.github.io/trading-journal/`.

**Private repo caveat:** GitHub Pages from a private repository needs a paid GitHub plan. Options:
(a) make the repo public. This is safe here: the code holds no secrets or data, and the database refuses
everything without your login. (b) Use a paid plan. (c) Host the same `dist/` build on Cloudflare Pages or Netlify.

Even when the site URL is public, nobody can read your trades without your Supabase login.

## Project layout

- `src/lib/stats.ts`, `reports.ts`, `calendar.ts`, `weeks.ts`: pure, tested logic (`*.test.ts`)
- `src/lib/tradesApi.ts`, `imagesApi.ts`: the only code that talks to Supabase
- `src/pages/`: Dashboard, Trades, TradeEdit, Reports, Login
- `src/components/`: layout, P&L calendar, gauges, trade form, image gallery
- `supabase/migrations/`: database schema and security policies
