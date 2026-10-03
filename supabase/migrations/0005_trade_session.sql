-- 0005: the trading session each trade was taken in.
-- Run once in the Supabase SQL editor, after 0004.
-- The column allows NULL only so that trades saved before this change keep working; the app makes the
-- session mandatory for every trade it saves from now on.

alter table public.trades
  add column if not exists session text
  check (session is null or session in ('asia', 'london', 'ny_premarket', 'ny_am', 'ny_lunch', 'ny_pm', 'outside'));
