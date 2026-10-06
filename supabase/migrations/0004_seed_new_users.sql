-- 0004: give every NEW account the same starting lists (symbols MNQ and ES, and the 12 emotions with Georgian names).
-- Earlier migrations only seeded the accounts that already existed. Without this a new user would see an empty
-- symbol dropdown and could not add a trade until they set symbols up on the Admin page.
-- Run once in the Supabase SQL editor, after 0003.

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

-- Only the trigger itself may run it; it must not be callable from the website.
revoke all on function public.seed_new_user() from public, anon, authenticated;

drop trigger if exists seed_new_user on auth.users;
create trigger seed_new_user
  after insert on auth.users
  for each row execute function public.seed_new_user();
