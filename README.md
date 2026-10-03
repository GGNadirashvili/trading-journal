# Trading Journal

A private, personal trading journal for MNQ and ES futures. It is for notes and statistics only.

## Goals

- Record every trade: symbol, direction, size, prices, P&L.
- Record the emotional state around each trade as text, and attach screenshots.
- See statistics in a dashboard inspired by Tradeify: win rate, profit factor, expectancy,
  average win/loss, streaks, equity curve.
- See a P&L calendar with daily and weekly totals.
- Import the previous week's trades (from screenshots and notes) and analyze them.
- Black background, green accent text.
- Free to host, readable only by the owner.

## Architecture

| Part     | Choice                                                                 |
| -------- | ---------------------------------------------------------------------- |
| Frontend | React + Vite + TypeScript, Tailwind, Recharts                          |
| Backend  | None custom. Supabase free tier: Postgres, Auth, Storage              |
| Privacy  | Single user login, signups disabled, row-level security on all tables  |
| Hosting  | GitHub Pages (static) built by GitHub Actions                          |

The Supabase "anon" key ships in the frontend bundle. That is expected: without a logged-in session,
row-level security returns nothing. Personal data (screenshots, notes) is never committed to git.

## Documentation

See [docs/DEVLOG.md](docs/DEVLOG.md) for every commit, its goal, and mistakes made along the way.
