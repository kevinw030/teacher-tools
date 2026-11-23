-- ED Sidekick: Owner Dashboard.
-- Paste ALL of this into Supabase: SQL Editor > New query > Run. It is safe to run again later.
-- Nothing here gives anyone new powers except accounts whose plan is 'owner'.
-- It adds: a privacy-friendly visit counter, a history of plan changes, a payments table
-- (filled in by Stripe later), and owner-only functions that the dashboard reads.

-- ---------- 1. Is the person asking the owner? ----------
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and plan = 'owner');
$$;

-- ---------- 2. A history of plan changes (Free to Premium, cancellations) ----------
alter table public.profiles add column if not exists premium_since timestamptz;
create table if not exists public.plan_changes (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  old_plan text,
  new_plan text,
  at timestamptz not null default now()
);
alter table public.plan_changes enable row level security;
-- No policies on purpose: nobody can read it directly. The owner reads it through owner_stats().
create or replace function public.log_plan_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.plan is distinct from old.plan then
    insert into public.plan_changes (user_id, old_plan, new_plan) values (new.id, old.plan, new.plan);
    if new.plan = 'premium' then new.premium_since = now(); end if;
  end if;
  return new;
end; $$;
drop trigger if exists profiles_plan_change on public.profiles;
create trigger profiles_plan_change before update of plan on public.profiles
  for each row execute procedure public.log_plan_change();

-- ---------- 3. The visit counter ----------
-- One row per page opened. No IP address, no names. "visitor" is a random id made in the browser.
create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  event text not null default 'view' check (char_length(event) between 1 and 40),
  page text check (char_length(page) <= 60),
  detail text check (char_length(detail) <= 80),
  visitor text not null check (char_length(visitor) between 8 and 40),
  device text check (device in ('phone', 'tablet', 'computer')),
  source text check (char_length(source) <= 80),
  user_id uuid default auth.uid() references auth.users on delete set null
);
create index if not exists site_events_at on public.site_events (at);
create index if not exists site_events_user on public.site_events (user_id);
alter table public.site_events enable row level security;
-- Anyone can add a visit, but only these columns: the time and the account are filled in by the server.
revoke all on public.site_events from anon, authenticated;
grant insert (event, page, detail, visitor, device, source) on public.site_events to anon, authenticated;
drop policy if exists "Anyone can add a visit" on public.site_events;
create policy "Anyone can add a visit" on public.site_events for insert to anon, authenticated with check (true);
-- No read policy: nobody can read visits directly. The owner reads totals through owner_stats().

-- ---------- 4. Payments (Stripe will fill this in later) ----------
create table if not exists public.payments (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete set null,
  stripe_invoice text unique,
  amount_cents integer not null default 0,
  currency text default 'usd',
  billing text,               -- 'month' or 'year'
  status text default 'paid', -- 'paid' or 'refunded'
  paid_at timestamptz not null default now()
);
alter table public.payments enable row level security;
-- No policies: only the Stripe webhook (server side) writes here, and only the owner reads totals.

-- ---------- 5. What the dashboard reads (owner only) ----------
-- Every signed-up account, with its plan and when it was last used.
create or replace function public.owner_users()
returns table (id uuid, email text, first_name text, plan text, provider text, joined timestamptz,
  last_sign_in timestamptz, last_saved timestamptz, last_seen timestamptz, premium_since timestamptz,
  visits bigint, devices text, paid_cents bigint)
language sql stable security definer set search_path = public, auth as $$
  select p.id, coalesce(p.email, u.email)::text,
    coalesce(nullif(u.raw_user_meta_data->>'first_name', ''),
      split_part(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 1))::text,
    p.plan, coalesce(u.raw_app_meta_data->>'provider', 'email')::text,
    p.created_at, u.last_sign_in_at, d.updated_at, e.last_seen, p.premium_since,
    coalesce(e.n, 0), e.devices, coalesce(m.cents, 0)
  from public.profiles p
  left join auth.users u on u.id = p.id
  left join public.user_data d on d.user_id = p.id
  left join lateral (select max(s.at) as last_seen, count(*) as n, string_agg(distinct s.device, ',') as devices
    from public.site_events s where s.user_id = p.id) e on true
  left join lateral (select sum(case when y.status = 'refunded' then -y.amount_cents else y.amount_cents end) as cents
    from public.payments y where y.user_id = p.id) m on true
  where public.is_owner()
  order by p.created_at desc;
$$;

-- Traffic, plan history and income totals for the last few days (days) in the owner's time zone (tz).
create or replace function public.owner_stats(days integer default 30, tz text default 'UTC')
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare since timestamptz; today date; result jsonb;
begin
  if not public.is_owner() then raise exception 'Owner only' using errcode = '42501'; end if;
  days := least(greatest(coalesce(days, 30), 1), 3650);
  begin perform now() at time zone tz; exception when others then tz := 'UTC'; end;
  today := (now() at time zone tz)::date;
  since := (today - (days - 1)) at time zone tz;

  with ev as (select * from public.site_events where at >= since)
  select jsonb_build_object(
    'since', since,
    'first_event', (select min(at) from public.site_events),
    'views', (select count(*) from ev where event = 'view'),
    'visitors', (select count(distinct visitor) from ev),
    'today_views', (select count(*) from ev where event = 'view' and (at at time zone tz)::date = today),
    'today_visitors', (select count(distinct visitor) from ev where (at at time zone tz)::date = today),
    'signed_in_views', (select count(*) from ev where event = 'view' and user_id is not null),
    'returning', (select count(*) from (select visitor from ev group by visitor having count(distinct (at at time zone tz)::date) > 1) r),
    'new_visitors', (select count(*) from (select visitor, min(at) as f from public.site_events group by visitor) v where v.f >= since),
    'by_day', coalesce((select jsonb_agg(x order by x.d) from (
        select (at at time zone tz)::date as d, count(*) filter (where event = 'view') as views, count(distinct visitor) as visitors
        from ev group by 1) x), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(x order by x.views desc) from (
        select page, count(*) as views, count(distinct visitor) as visitors
        from ev where event = 'view' group by page order by 2 desc limit 120) x), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(x) from (
        select coalesce(device, 'computer') as device, count(distinct visitor) as visitors, count(*) as views from ev group by 1) x), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(x order by x.visitors desc) from (
        select source, count(distinct visitor) as visitors from ev where source is not null and source <> '' group by 1 order by 2 desc limit 15) x), '[]'::jsonb),
    'hours', coalesce((select jsonb_agg(x) from (
        select extract(hour from at at time zone tz)::int as h, count(*) as views from ev where event = 'view' group by 1) x), '[]'::jsonb),
    'weekdays', coalesce((select jsonb_agg(x) from (
        select extract(isodow from at at time zone tz)::int as d, count(*) as views from ev where event = 'view' group by 1) x), '[]'::jsonb),
    'actions', coalesce((select jsonb_agg(x order by x.n desc) from (
        select event, detail, count(*) as n, count(distinct visitor) as visitors
        from ev where event <> 'view' group by 1, 2 order by 3 desc limit 300) x), '[]'::jsonb),
    'plan_changes', coalesce((select jsonb_agg(x order by x.at) from (
        select (at at time zone tz)::date as d, at, old_plan, new_plan from public.plan_changes) x), '[]'::jsonb),
    'payments', coalesce((select jsonb_agg(x order by x.d) from (
        select (paid_at at time zone tz)::date as d, billing, status, amount_cents from public.payments) x), '[]'::jsonb)
  ) into result;
  return result;
end; $$;

-- Only signed-in accounts may even call these, and they return nothing unless the caller is the owner.
revoke all on function public.owner_users() from public, anon;
revoke all on function public.owner_stats(integer, text) from public, anon;
grant execute on function public.owner_users() to authenticated;
grant execute on function public.owner_stats(integer, text) to authenticated;
grant execute on function public.is_owner() to anon, authenticated;
