-- 0007: repair the Georgian names of the 12 built-in emotions.
-- Migrations 0003 and 0004 were pasted through a clipboard that used the wrong text encoding, so the Georgian names
-- were saved as garbage characters instead of Georgian letters. Run once in the Supabase SQL editor, after 0006.
-- This file is pure ASCII on purpose (Georgian is written as \XXXX escapes), so it cannot be damaged the same way.

-- 1. Fix the names already saved. Only built-in emotions whose Georgian name has no Georgian letter at all are
--    changed, so a Georgian name you typed yourself is never overwritten. A name that would clash with another
--    item of yours is skipped.
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
where o.kind = 'emotion'
  and o.name = m.name
  and (o.name_ka is null or o.name_ka !~ '[\u10D0-\u10FF]')
  and not exists (
    select 1 from public.options x
    where x.user_id = o.user_id and x.kind = o.kind and x.name_ka = m.name_ka and x.id <> o.id
  );

-- 2. Fix the starting lists given to accounts created from now on (same function as 0004, with correct text).
create or replace function public.seed_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.symbols (user_id, code, point_value)
  values (new.id, 'MNQ', 2), (new.id, 'ES', 50)
  on conflict do nothing;

  insert into public.options (user_id, kind, name, name_ka)
  values
    (new.id, 'emotion', 'calm', U&'\10DB\10E8\10D5\10D8\10D3\10D8'),
    (new.id, 'emotion', 'confident', U&'\10D7\10D0\10D5\10D3\10D0\10EF\10D4\10E0\10D4\10D1\10E3\10DA\10D8'),
    (new.id, 'emotion', 'focused', U&'\10D9\10DD\10DC\10EA\10D4\10DC\10E2\10E0\10D8\10E0\10D4\10D1\10E3\10DA\10D8'),
    (new.id, 'emotion', 'patient', U&'\10DB\10DD\10DB\10D7\10DB\10D4\10DC\10D8'),
    (new.id, 'emotion', 'anxious', U&'\10E8\10D4\10E8\10E4\10DD\10D7\10D4\10D1\10E3\10DA\10D8'),
    (new.id, 'emotion', 'fomo', U&'FOMO (\10D2\10D0\10DB\10DD\10E2\10DD\10D5\10D4\10D1\10D8\10E1 \10E8\10D8\10E8\10D8)'),
    (new.id, 'emotion', 'revenge', U&'\10E8\10E3\10E0\10D8\10E1\10EB\10D8\10D4\10D1\10D0'),
    (new.id, 'emotion', 'greedy', U&'\10EE\10D0\10E0\10D1\10D8'),
    (new.id, 'emotion', 'frustrated', U&'\10D8\10DB\10D4\10D3\10D2\10D0\10EA\10E0\10E3\10D4\10D1\10E3\10DA\10D8'),
    (new.id, 'emotion', 'tired', U&'\10D3\10D0\10E6\10DA\10D8\10DA\10D8'),
    (new.id, 'emotion', 'bored', U&'\10DB\10DD\10EC\10E7\10D4\10DC\10D8\10DA\10D8'),
    (new.id, 'emotion', 'overconfident', U&'\10D6\10D4\10D3\10DB\10D4\10E2\10D0\10D3 \10D7\10D0\10D5\10D3\10D0\10EF\10D4\10E0\10D4\10D1\10E3\10DA\10D8')
  on conflict do nothing;

  return new;
end;
$$;

revoke all on function public.seed_new_user() from public, anon, authenticated;
