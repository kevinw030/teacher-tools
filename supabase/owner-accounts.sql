-- ED Sidekick: lets the OWNER change or delete other accounts from the Owner Dashboard
-- (All Accounts > tap a person > Make Plus / Make Free / Delete Account).
-- Paste ALL of this into Supabase: SQL Editor > New query > Run. Safe to run again.
--
-- Both functions check that the signed-in account's plan is 'owner' before doing anything,
-- so nobody else can use them. They also refuse to touch the owner's own account or any
-- other owner account, so the site owner can't be locked out by accident.

-- Is the person asking the owner? (Same as in owner-dashboard.sql; here so this file works alone.)
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and plan = 'owner');
$$;

-- Delete one account: the sign-in, the profile and all saved work (linked with "on delete cascade").
-- Payment records and visit counts stay for the books but no longer point to anyone.
-- A Plus account must be set to Free first (cancel their plan in Stripe so billing stops).
create or replace function public.owner_delete_user(target uuid)
returns void
language plpgsql security definer set search_path = public, auth as $$
declare p text;
begin
  if not public.is_owner() then raise exception 'Owner only' using errcode = '42501'; end if;
  if target is null or target = auth.uid() then raise exception 'own_account'; end if;
  select plan into p from public.profiles where id = target;
  if p = 'owner' then raise exception 'owner_account'; end if;
  if p = 'premium' then raise exception 'plus_account'; end if;
  delete from auth.users where id = target;
  delete from public.profiles where id = target; -- in case a profile was left without a sign-in
end; $$;

-- Change one account's plan to 'free' or 'premium' (premium is what the site calls Plus).
create or replace function public.owner_set_plan(target uuid, new_plan text)
returns void
language plpgsql security definer set search_path = public as $$
declare p text;
begin
  if not public.is_owner() then raise exception 'Owner only' using errcode = '42501'; end if;
  if new_plan not in ('free', 'premium') then raise exception 'bad_plan'; end if;
  if target is null or target = auth.uid() then raise exception 'own_account'; end if;
  select plan into p from public.profiles where id = target;
  if p is null then raise exception 'not_found'; end if;
  if p = 'owner' then raise exception 'owner_account'; end if;
  update public.profiles set plan = new_plan where id = target;
end; $$;

revoke all on function public.owner_delete_user(uuid) from public, anon;
revoke all on function public.owner_set_plan(uuid, text) from public, anon;
grant execute on function public.owner_delete_user(uuid) to authenticated;
grant execute on function public.owner_set_plan(uuid, text) to authenticated;
