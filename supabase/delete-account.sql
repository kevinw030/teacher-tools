-- ED Sidekick: lets a signed-in person delete their own account (the "Delete My Account" button).
-- Paste into Supabase > SQL Editor and click Run. Safe to run again.
--
-- What it removes: the sign-in, the profile and all saved work (boards, class lists, questions,
-- settings), because those tables are linked to the account with "on delete cascade".
-- Payment records and visit counts are kept for the books, but no longer point to anyone
-- ("on delete set null").
--
-- It refuses for:
--   * the owner account, so the site owner can't lock themself out by accident;
--   * a Plus account that is still paid up, so nobody keeps getting billed for a deleted
--     account. They cancel in Manage My Plan first (the site shows them how).

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  p text;
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  select plan into p from public.profiles where id = uid;
  if p = 'owner' then
    raise exception 'owner_account';
  end if;
  if p = 'premium' then
    raise exception 'cancel_plus_first';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
