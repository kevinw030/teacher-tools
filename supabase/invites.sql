-- ED Sidekick: invite codes that give free days of Plus.
-- Paste all of this into Supabase: SQL Editor > New query > Run. Safe to run more than once.
--
-- How it works:
--   * Every account gets its own invite code (6 letters and numbers, made the first time My Account asks for it).
--   * A NEW account that signs up with someone's code gets 3 free days of Plus, and so does the person who invited them.
--   * The inviter is rewarded for up to 10 invites (30 free days). Friends invited after that still get their own 3 days.
--   * Free days are saved in profiles.plus_until. The plan column is never touched, so a paying Stripe Plus
--     account is never changed, and Stripe keeps full control of paid plans.
--   * Only the functions below can write invites or free days. Nobody can change them from the browser.

-- ---------- 1. New columns on each account ----------
alter table public.profiles add column if not exists invite_code text;
alter table public.profiles add column if not exists plus_until timestamptz;
create unique index if not exists profiles_invite_code_key on public.profiles (invite_code);

-- ---------- 2. Every invite that was used ----------
create table if not exists public.referrals (
  id bigint generated always as identity primary key,
  inviter uuid references auth.users on delete set null,
  invitee uuid unique references auth.users on delete set null,
  -- Kept even if the account is deleted, so deleting and signing up again can't claim a second reward.
  invitee_email text not null unique,
  inviter_rewarded boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.referrals enable row level security;
-- No policies on purpose: only the functions below read or write this table.

-- One email address, written the same way every time (Gmail ignores dots and anything after a +).
create or replace function public.invite_email_key(e text) returns text
language plpgsql immutable as $$
declare local text; dom text;
begin
  e := lower(trim(coalesce(e, '')));
  local := split_part(e, '@', 1); dom := split_part(e, '@', 2);
  local := split_part(local, '+', 1);
  if dom in ('gmail.com', 'googlemail.com') then local := replace(local, '.', ''); dom := 'gmail.com'; end if;
  return local || '@' || dom;
end; $$;

-- A new random code. No vowels, so a code never spells a word, and no 0/O or 1/I mix-ups.
create or replace function public.new_invite_code() returns text
language plpgsql security definer set search_path = public as $$
declare a text := 'BCDFGHJKMNPQRSTVWXYZ23456789'; c text; i int;
begin
  loop
    c := '';
    for i in 1..6 loop c := c || substr(a, 1 + floor(random() * length(a))::int, 1); end loop;
    exit when not exists (select 1 from public.profiles where invite_code = c);
  end loop;
  return c;
end; $$;
revoke all on function public.new_invite_code() from public, anon, authenticated;

-- ---------- 3. My Account: my code, how many friends joined, and my free days ----------
create or replace function public.my_invites() returns json
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c text; pu timestamptz; n int; joined timestamptz; mail text; used boolean;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select invite_code, plus_until into c, pu from public.profiles where id = uid;
  if not found then
    insert into public.profiles (id, email) select id, email from auth.users where id = uid on conflict do nothing;
  end if;
  if c is null then
    c := public.new_invite_code();
    update public.profiles set invite_code = c where id = uid;
  end if;
  select created_at, email into joined, mail from auth.users where id = uid;
  select count(*) into n from public.referrals where inviter = uid;
  select exists (select 1 from public.referrals where invitee = uid or invitee_email = public.invite_email_key(mail)) into used;
  return json_build_object(
    'code', c,
    'invites', n,
    'rewarded', least(n, 10),
    'max', 10,
    'plus_until', pu,
    'used_code', used,
    -- New accounts (first 7 days) that haven't used a code yet can still type one in.
    'can_redeem', not used and joined > now() - interval '7 days'
  );
end; $$;
revoke all on function public.my_invites() from public, anon;
grant execute on function public.my_invites() to authenticated;

-- ---------- 4. Use an invite code (once, new accounts only, not your own) ----------
create or replace function public.redeem_invite(invite_code text) returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); code text; inviter_id uuid; inviter_mail text; mail text; joined timestamptz;
  done_count int; reward boolean := false; mine timestamptz;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  code := upper(regexp_replace(coalesce(invite_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if length(code) < 4 or length(code) > 12 then return json_build_object('ok', false, 'reason', 'bad_code'); end if;

  -- One redeem at a time per account.
  perform pg_advisory_xact_lock(hashtext('invite:' || uid::text));

  select p.id into inviter_id from public.profiles p where p.invite_code = code;
  if inviter_id is null then return json_build_object('ok', false, 'reason', 'bad_code'); end if;
  if inviter_id = uid then return json_build_object('ok', false, 'reason', 'own_code'); end if;

  select created_at, email into joined, mail from auth.users where id = uid;
  select email into inviter_mail from auth.users where id = inviter_id;
  if public.invite_email_key(mail) = public.invite_email_key(inviter_mail) then
    return json_build_object('ok', false, 'reason', 'own_code');
  end if;
  if exists (select 1 from public.referrals where invitee = uid or invitee_email = public.invite_email_key(mail)) then
    return json_build_object('ok', false, 'reason', 'already');
  end if;
  if joined < now() - interval '7 days' then return json_build_object('ok', false, 'reason', 'not_new'); end if;

  -- The inviter is rewarded for their first 10 friends. Lock their row so two friends at once count right.
  perform 1 from public.profiles where id = inviter_id for update;
  select count(*) into done_count from public.referrals where inviter = inviter_id and inviter_rewarded;
  reward := done_count < 10;

  insert into public.referrals (inviter, invitee, invitee_email, inviter_rewarded)
  values (inviter_id, uid, public.invite_email_key(mail), reward);

  -- 3 free days each, added on top of any free days still left.
  update public.profiles set plus_until = greatest(coalesce(plus_until, now()), now()) + interval '3 days'
    where id = uid returning plus_until into mine;
  if reward then
    update public.profiles set plus_until = greatest(coalesce(plus_until, now()), now()) + interval '3 days'
      where id = inviter_id;
  end if;
  return json_build_object('ok', true, 'plus_until', mine, 'inviter_rewarded', reward);
exception when unique_violation then
  return json_build_object('ok', false, 'reason', 'already');
end; $$;
revoke all on function public.redeem_invite(text) from public, anon;
grant execute on function public.redeem_invite(text) to authenticated;

-- ---------- 5. For any future server check: does this account have Plus right now? ----------
create or replace function public.has_plus(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid
    and (plan in ('premium', 'owner') or (plus_until is not null and plus_until > now())));
$$;
