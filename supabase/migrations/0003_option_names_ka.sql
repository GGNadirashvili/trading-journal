-- 0003: a Georgian name for every emotion, tag and setup.
-- (Georgian text is written as \XXXX escapes so this file is pure ASCII and survives any copy and paste.)
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
  ('calm', U&'\10DB\10E8\10D5\10D8\10D3\10D8'),
  ('confident', U&'\10D7\10D0\10D5\10D3\10D0\10EF\10D4\10E0\10D4\10D1\10E3\10DA\10D8'),
  ('focused', U&'\10D9\10DD\10DC\10EA\10D4\10DC\10E2\10E0\10D8\10E0\10D4\10D1\10E3\10DA\10D8'),
  ('patient', U&'\10DB\10DD\10DB\10D7\10DB\10D4\10DC\10D8'),
  ('anxious', U&'\10E8\10D4\10E8\10E4\10DD\10D7\10D4\10D1\10E3\10DA\10D8'),
  ('fomo', U&'FOMO (\10D2\10D0\10DB\10DD\10E2\10DD\10D5\10D4\10D1\10D8\10E1 \10E8\10D8\10E8\10D8)'),
  ('revenge', U&'\10E8\10E3\10E0\10D8\10E1\10EB\10D8\10D4\10D1\10D0'),
  ('greedy', U&'\10EE\10D0\10E0\10D1\10D8'),
  ('frustrated', U&'\10D8\10DB\10D4\10D3\10D2\10D0\10EA\10E0\10E3\10D4\10D1\10E3\10DA\10D8'),
  ('tired', U&'\10D3\10D0\10E6\10DA\10D8\10DA\10D8'),
  ('bored', U&'\10DB\10DD\10EC\10E7\10D4\10DC\10D8\10DA\10D8'),
  ('overconfident', U&'\10D6\10D4\10D3\10DB\10D4\10E2\10D0\10D3 \10D7\10D0\10D5\10D3\10D0\10EF\10D4\10E0\10D4\10D1\10E3\10DA\10D8')
) as m (name, name_ka)
where o.kind = 'emotion' and o.name = m.name and o.name_ka is null;
