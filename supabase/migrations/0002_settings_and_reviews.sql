-- 0002: managed symbols and labels (admin page), weekly reviews, and removal of the fees column.
-- Run once in the Supabase SQL editor, after 0001.

-- Fees are no longer tracked; P&L is entered as the final number.
alter table public.trades drop column if exists fees;

-- Symbols you trade, with the dollar value of one price point (used to compute P&L from prices).
create table public.symbols (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  code        text not null check (code = upper(trim(code)) and length(code) > 0),
  point_value numeric(12, 4) not null check (point_value > 0),
  created_at  timestamptz not null default now(),
  unique (user_id, code)
);

-- Pick-lists for the trade form: emotions, tags and setups.
create table public.options (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('emotion', 'tag', 'setup')),
  name       text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (user_id, kind, name)
);

-- One row per week (week_start = that week's Monday). The first block looks back at that week,
-- the second is the outlook written for the following week.
create table public.weekly_reviews (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,
  emotional  text,
  technical  text,
  mistakes   text,
  lessons    text,
  bias       text check (bias in ('bullish', 'bearish', 'neutral', 'unclear')),
  outlook    text,
  key_levels text,
  plan       text,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.symbols        enable row level security;
alter table public.options        enable row level security;
alter table public.weekly_reviews enable row level security;

create policy "own symbols" on public.symbols
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own options" on public.options
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own weekly reviews" on public.weekly_reviews
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Starting lists for the existing user(s). Everything can be changed on the Admin page.
insert into public.symbols (user_id, code, point_value)
select u.id, s.code, s.point_value
from auth.users u
cross join (values ('MNQ', 2), ('ES', 50)) as s (code, point_value)
on conflict do nothing;

insert into public.options (user_id, kind, name)
select u.id, 'emotion', e.name
from auth.users u
cross join (values ('calm'), ('confident'), ('focused'), ('patient'), ('anxious'), ('fomo'),
                   ('revenge'), ('greedy'), ('frustrated'), ('tired'), ('bored'), ('overconfident')) as e (name)
on conflict do nothing;
