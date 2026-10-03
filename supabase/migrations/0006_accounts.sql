-- 0006: prop-firm accounts, and which account each trade belongs to.
-- Run once in the Supabase SQL editor, after 0005.

create table public.accounts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name           text not null check (length(trim(name)) > 0),            -- the account id as the prop firm shows it
  start_balance  numeric(14, 2) not null check (start_balance > 0),       -- account size, e.g. 50000
  max_drawdown   numeric(14, 2) not null check (max_drawdown > 0),        -- e.g. 2000
  profit_goal    numeric(14, 2) not null,                                 -- the BALANCE to reach, e.g. 53000
  drawdown_type  text not null default 'trailing' check (drawdown_type in ('static', 'trailing', 'trailing_eod')),
  lock_at_start  boolean not null default true,                           -- trailing floor stops rising at the start balance
  adjustment     numeric(14, 2) not null default 0,                       -- results made before journaling / a correction
  peak_baseline  numeric(14, 2),                                          -- highest balance before the first journaled trade
  manual_status  text check (manual_status in ('passed', 'failed')),      -- set by hand, overrides the numbers
  manual_closed_at date,
  opened_at      date not null default current_date,
  created_at     timestamptz not null default now(),
  unique (user_id, name),
  check (profit_goal > start_balance),
  check (manual_status is null or manual_closed_at is not null)
);

alter table public.accounts enable row level security;

create policy "own accounts" on public.accounts
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Each trade may belong to one account. Deleting an account keeps its trades (they become "no account").
alter table public.trades
  add column if not exists account_id uuid references public.accounts (id) on delete set null;

create index if not exists trades_account_idx on public.trades (account_id);

-- A trade may only point at one of the SAME user's accounts. Without this check, someone who guessed another
-- user's account id could attach their own trade to it.
drop policy if exists "own trades" on public.trades;
create policy "own trades" on public.trades
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (account_id is null or exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid()))
  );
