-- 0008: market notes (written without opening a trade) and their screenshots.
-- Run once in the Supabase SQL editor, after 0007. Pure ASCII on purpose, so it survives any copy and paste.

create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  noted_at   timestamptz not null default now(),          -- when the note is about (you can change it)
  title      text,
  body       text not null default '',
  session    text check (session is null or session in ('asia', 'london', 'ny_premarket', 'ny_am', 'ny_lunch', 'ny_pm', 'outside')),
  symbol     text,                                        -- optional, e.g. MNQ or ES
  tags       text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index notes_user_time_idx on public.notes (user_id, noted_at desc);

create table public.note_images (
  id           uuid primary key default gen_random_uuid(),
  note_id      uuid not null references public.notes (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null,                              -- path inside the private `screenshots` bucket
  created_at   timestamptz not null default now()
);

create index note_images_note_idx on public.note_images (note_id);

alter table public.notes       enable row level security;
alter table public.note_images enable row level security;

create policy "own notes" on public.notes
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A screenshot may only be attached to one of the SAME user's notes (same reasoning as for trades and accounts).
create policy "own note images" on public.note_images
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid())
  );
