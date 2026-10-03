-- 0003: a Georgian name for every emotion, tag and setup.
-- `name` stays the English name and is the value saved on trades; `name_ka` is only what the app shows
-- when it is in Georgian. Run once in the Supabase SQL editor, after 0002.

alter table public.options
  add column if not exists name_ka text check (name_ka is null or length(trim(name_ka)) > 0);

-- Two items of the same kind may not share a Georgian name either (they would look identical on screen).
create unique index if not exists options_user_kind_name_ka_idx
  on public.options (user_id, kind, name_ka)
  where name_ka is not null;

-- Georgian names for the built-in emotions that were seeded by 0002.
update public.options o
set name_ka = m.name_ka
from (values
  ('calm', 'მშვიდი'),
  ('confident', 'თავდაჯერებული'),
  ('focused', 'კონცენტრირებული'),
  ('patient', 'მომთმენი'),
  ('anxious', 'შეშფოთებული'),
  ('fomo', 'FOMO (გამოტოვების შიში)'),
  ('revenge', 'შურისძიება'),
  ('greedy', 'ხარბი'),
  ('frustrated', 'იმედგაცრუებული'),
  ('tired', 'დაღლილი'),
  ('bored', 'მოწყენილი'),
  ('overconfident', 'ზედმეტად თავდაჯერებული')
) as m (name, name_ka)
where o.kind = 'emotion' and o.name = m.name and o.name_ka is null;
