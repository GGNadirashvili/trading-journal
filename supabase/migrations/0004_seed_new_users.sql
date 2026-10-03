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
    (new.id, 'emotion', 'calm', 'მშვიდი'),
    (new.id, 'emotion', 'confident', 'თავდაჯერებული'),
    (new.id, 'emotion', 'focused', 'კონცენტრირებული'),
    (new.id, 'emotion', 'patient', 'მომთმენი'),
    (new.id, 'emotion', 'anxious', 'შეშფოთებული'),
    (new.id, 'emotion', 'fomo', 'FOMO (გამოტოვების შიში)'),
    (new.id, 'emotion', 'revenge', 'შურისძიება'),
    (new.id, 'emotion', 'greedy', 'ხარბი'),
    (new.id, 'emotion', 'frustrated', 'იმედგაცრუებული'),
    (new.id, 'emotion', 'tired', 'დაღლილი'),
    (new.id, 'emotion', 'bored', 'მოწყენილი'),
    (new.id, 'emotion', 'overconfident', 'ზედმეტად თავდაჯერებული')
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
