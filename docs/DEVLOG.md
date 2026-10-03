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
