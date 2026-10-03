-- Trading journal schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Every table is owned by one user and locked down with row-level security.

create table public.trades (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  symbol        text not null,                         -- MNQ, ES, ...
  direction     text not null check (direction in ('long', 'short')),
  qty           integer not null check (qty > 0),
  entry_price   numeric(12, 2),
  exit_price    numeric(12, 2),
  entry_time    timestamptz not null,
  exit_time     timestamptz,
  status        text not null default 'closed' check (status in ('open', 'closed')),
  pnl           numeric(12, 2) not null default 0,     -- net P&L in USD, after fees
  fees          numeric(12, 2) not null default 0,
  setup         text,
  tags          text[] not null default '{}',
  emotion_before text,
  emotion_after  text,
  emotion_tags  text[] not null default '{}',
  notes         text,
  created_at    timestamptz not null default now()
);

create index trades_user_entry_idx on public.trades (user_id, entry_time desc);

create table public.trade_images (
  id           uuid primary key default gen_random_uuid(),
  trade_id     uuid not null references public.trades (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null,                          -- path inside the `screenshots` bucket
  caption      text,
  created_at   timestamptz not null default now()
);

create index trade_images_trade_idx on public.trade_images (trade_id);

create table public.journal_days (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day     date not null,
  mood    text,
  notes   text,
  primary key (user_id, day)
);

-- Row-level security: a row is visible/editable only to its owner.
alter table public.trades       enable row level security;
alter table public.trade_images enable row level security;
alter table public.journal_days enable row level security;

create policy "own trades" on public.trades
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own trade images" on public.trade_images
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own journal days" on public.journal_days
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Private screenshot storage. Files live under "<user id>/..." and only that user can touch them.
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', false)
on conflict (id) do nothing;

create policy "own screenshots" on storage.objects
  for all to authenticated
  using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
