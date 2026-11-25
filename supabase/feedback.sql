-- ED Sidekick: "Suggest an Idea or Report a Bug" notes (assets/feedback.js and the Owner Dashboard).
-- Paste all of this into Supabase: SQL Editor > New query > Run. Safe to run more than once.
-- Needs owner-dashboard.sql first (it makes public.is_owner()).
--
-- Who can do what:
--   * A signed-in account can send a note. Nobody can read notes except the owner account.
--   * The database fills in the name and email from the account itself, so nobody can send a note as someone else.
--   * Spam limit: 3 notes in 10 minutes and 10 notes a day per account.

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid() references auth.users on delete set null,
  name text,
  email text,
  kind text not null check (kind in ('tool', 'idea', 'bug')),
  message text not null check (char_length(btrim(message)) between 3 and 2000),
  page text check (char_length(page) <= 300),
  browser text check (char_length(browser) <= 300),
  status text not null default 'new' check (status in ('new', 'done')),
  done_at timestamptz,
  emailed_at timestamptz
);
create index if not exists feedback_user_time on public.feedback (user_id, created_at desc);
create index if not exists feedback_time on public.feedback (created_at desc);
alter table public.feedback enable row level security;

-- Members may only add rows (and only these columns). The owner reads and marks notes done.
revoke all on public.feedback from anon, authenticated;
grant insert (kind, message, page, browser) on public.feedback to authenticated;
grant select on public.feedback to authenticated;
grant update (status) on public.feedback to authenticated;

drop policy if exists "Send own feedback" on public.feedback;
drop policy if exists "Owner reads feedback" on public.feedback;
drop policy if exists "Owner marks feedback" on public.feedback;
create policy "Send own feedback" on public.feedback for insert to authenticated with check (user_id = auth.uid());
create policy "Owner reads feedback" on public.feedback for select to authenticated using (public.is_owner());
create policy "Owner marks feedback" on public.feedback for update to authenticated using (public.is_owner()) with check (public.is_owner());

-- Fill in who sent it, and stop spam, before each new note is saved.
create or replace function public.feedback_before_insert() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare u record; recent int; today int;
begin
  if auth.uid() is null then raise exception 'Please sign in first' using errcode = '42501'; end if;
  new.user_id := auth.uid();
  new.created_at := now();
  new.status := 'new'; new.done_at := null; new.emailed_at := null;
  new.message := btrim(new.message);
  select count(*) filter (where created_at > now() - interval '10 minutes'),
         count(*) filter (where created_at > now() - interval '1 day')
    into recent, today from public.feedback where user_id = new.user_id and created_at > now() - interval '1 day';
  if recent >= 3 or today >= 10 then
    raise exception 'too_many' using errcode = 'P0429', hint = 'Feedback limit reached. Try again later.';
  end if;
  select email, raw_user_meta_data into u from auth.users where id = new.user_id;
  new.email := u.email;
  new.name := coalesce(nullif(u.raw_user_meta_data->>'first_name', ''),
    nullif(split_part(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 1), ''),
    split_part(u.email, '@', 1));
  return new;
end; $$;
drop trigger if exists feedback_before_insert on public.feedback;
create trigger feedback_before_insert before insert on public.feedback
  for each row execute procedure public.feedback_before_insert();

-- Marking a note done (or back to new) stamps the time. Only the status can change.
create or replace function public.feedback_before_update() returns trigger
language plpgsql as $$
begin
  new.done_at := case when new.status = 'done' then coalesce(old.done_at, now()) else null end;
  return new;
end; $$;
drop trigger if exists feedback_before_update on public.feedback;
create trigger feedback_before_update before update on public.feedback
  for each row execute procedure public.feedback_before_update();
