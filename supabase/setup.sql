-- Teacher Tools: accounts and cloud saving.
-- Paste all of this into Supabase: SQL Editor > New query > Run. Safe to run once on a new project.

-- Each account's plan. Teachers can read their own plan but can't change it.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'premium', 'owner')),
  stripe_customer text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles for select using (auth.uid() = id);

-- Make a profile for every new account.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Everything a teacher saves on the site, as one row per account.
create table if not exists public.user_data (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_data_size check (octet_length(data::text) < 8000000)
);
alter table public.user_data enable row level security;
drop policy if exists "Read own data" on public.user_data;
drop policy if exists "Add own data" on public.user_data;
drop policy if exists "Change own data" on public.user_data;
drop policy if exists "Delete own data" on public.user_data;
create policy "Read own data" on public.user_data for select using (auth.uid() = user_id);
create policy "Add own data" on public.user_data for insert with check (auth.uid() = user_id);
create policy "Change own data" on public.user_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own data" on public.user_data for delete using (auth.uid() = user_id);

-- The server's clock decides which save is newest.
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch before insert or update on public.user_data
  for each row execute procedure public.touch_updated_at();

-- After you sign in on the site for the first time, give your own account everything
-- (put your email in the quotes and run just this line):
-- update public.profiles set plan = 'owner' where email = 'YOUR-EMAIL-HERE';

-- To give someone Premium by hand (for example a teacher friend):
-- update public.profiles set plan = 'premium' where email = 'THEIR-EMAIL';
