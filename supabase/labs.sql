-- ED Sidekick Labs: student class logins, buddies (avatars), badges and question sets for the
-- Sidekick Live preview. OWNER ONLY for now: only an account with plan = 'owner' can make classes or sets.
-- Paste all of this into Supabase: SQL Editor > New query > Run. Safe to run more than once.
--
-- How student sign-in works:
--   * The teacher makes a class. The class gets a code like KTP-4829.
--   * The teacher adds students: a first name (up to 20 letters) and a 4-digit PIN for each.
--   * A student types the class code, taps their name and types their PIN. They get a sign-in token
--     that lasts 12 hours. Only a scrambled copy of the token is stored.
--   * 5 wrong PINs in a row pause that student for 5 minutes (the teacher can unpause).
--   * Too many wrong class codes from one network pause that network for 10 minutes.
--   * Students are NOT Supabase accounts. They can only use the lab_* functions below, and those only
--     ever return their own buddy, badges and game stats plus their classmates' first names and buddies.
--   * What is saved about a student: first name, PIN, buddy, badges, game stats, last sign-in time.
--     Nothing else. Deleting a class (or the teacher's account) erases all of it.

-- ---------- 0. Is this the owner account? ----------
create or replace function public.lab_is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and plan = 'owner');
$$;

-- ---------- 1. Classes ----------
create table if not exists public.lab_classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  code text not null unique,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);
alter table public.lab_classes enable row level security;
drop policy if exists "Teacher reads own classes" on public.lab_classes;
drop policy if exists "Teacher changes own classes" on public.lab_classes;
drop policy if exists "Teacher deletes own classes" on public.lab_classes;
create policy "Teacher reads own classes" on public.lab_classes for select using (auth.uid() = teacher_id);
create policy "Teacher changes own classes" on public.lab_classes for update using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "Teacher deletes own classes" on public.lab_classes for delete using (auth.uid() = teacher_id);
-- New classes only through lab_new_class() below (it makes the code and checks the owner plan).

-- ---------- 2. Students ----------
create table if not exists public.lab_students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.lab_classes on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 20),
  pin text not null check (pin ~ '^[0-9]{4}$'),
  buddy jsonb not null default '{}'::jsonb check (octet_length(buddy::text) < 2000),
  badges jsonb not null default '{}'::jsonb check (octet_length(badges::text) < 8000),
  stats jsonb not null default '{}'::jsonb check (octet_length(stats::text) < 8000),
  fails int not null default 0,
  paused_until timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists lab_students_class on public.lab_students (class_id);
-- How many students a class has (a class holds up to 60).
create or replace function public.lab_class_size(p_class uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.lab_students where class_id = p_class;
$$;
alter table public.lab_students enable row level security;
drop policy if exists "Teacher reads own students" on public.lab_students;
drop policy if exists "Teacher adds own students" on public.lab_students;
drop policy if exists "Teacher changes own students" on public.lab_students;
drop policy if exists "Teacher deletes own students" on public.lab_students;
create policy "Teacher reads own students" on public.lab_students for select
  using (exists (select 1 from public.lab_classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "Teacher adds own students" on public.lab_students for insert
  with check (exists (select 1 from public.lab_classes c where c.id = class_id and c.teacher_id = auth.uid())
    and public.lab_class_size(class_id) < 60);
create policy "Teacher changes own students" on public.lab_students for update
  using (exists (select 1 from public.lab_classes c where c.id = class_id and c.teacher_id = auth.uid()))
  with check (exists (select 1 from public.lab_classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "Teacher deletes own students" on public.lab_students for delete
  using (exists (select 1 from public.lab_classes c where c.id = class_id and c.teacher_id = auth.uid()));

-- ---------- 3. Student sign-ins and wrong-try counts (no policies: only the functions use them) ----------
create table if not exists public.lab_sessions (
  token_hash text primary key,
  student_id uuid not null references public.lab_students on delete cascade,
  expires_at timestamptz not null
);
alter table public.lab_sessions enable row level security;
create table if not exists public.lab_attempts (
  who text not null,          -- a scrambled copy of the network address, never the address itself
  at timestamptz not null default now()
);
create index if not exists lab_attempts_who on public.lab_attempts (who, at);
alter table public.lab_attempts enable row level security;

-- ---------- 4. Question sets ----------
create table if not exists public.lab_sets (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  subject text not null default '',
  grade text not null default '',
  questions jsonb not null default '[]'::jsonb check (octet_length(questions::text) < 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.lab_sets enable row level security;
drop policy if exists "Teacher reads own sets" on public.lab_sets;
drop policy if exists "Owner adds sets" on public.lab_sets;
drop policy if exists "Teacher changes own sets" on public.lab_sets;
drop policy if exists "Teacher deletes own sets" on public.lab_sets;
create policy "Teacher reads own sets" on public.lab_sets for select using (auth.uid() = teacher_id);
create policy "Owner adds sets" on public.lab_sets for insert with check (auth.uid() = teacher_id and public.lab_is_owner()
  and (select count(*) from public.lab_sets s where s.teacher_id = auth.uid()) < 200);
create policy "Teacher changes own sets" on public.lab_sets for update using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "Teacher deletes own sets" on public.lab_sets for delete using (auth.uid() = teacher_id);

-- ---------- 5. Teacher: make a class (owner only while this is a preview) ----------
create or replace function public.lab_new_class(p_name text) returns json
language plpgsql security definer set search_path = public as $$
declare a text := 'BCDFGHJKMNPQRSTVWXZ'; c text; i int; row public.lab_classes;
begin
  if auth.uid() is null or not public.lab_is_owner() then raise exception 'owner_only'; end if;
  if (select count(*) from public.lab_classes where teacher_id = auth.uid()) >= 20 then raise exception 'too_many'; end if;
  loop
    c := '';
    for i in 1..3 loop c := c || substr(a, 1 + floor(random() * length(a))::int, 1); end loop;
    c := c || '-' || lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (select 1 from public.lab_classes where code = c);
  end loop;
  insert into public.lab_classes (teacher_id, name, code) values (auth.uid(), left(trim(coalesce(p_name, '')), 40), c) returning * into row;
  return row_to_json(row);
end; $$;
revoke all on function public.lab_new_class(text) from public, anon;
grant execute on function public.lab_new_class(text) to authenticated;

-- A new code for a class (the old one stops working right away).
create or replace function public.lab_new_code(p_class uuid) returns text
language plpgsql security definer set search_path = public as $$
declare a text := 'BCDFGHJKMNPQRSTVWXZ'; c text; i int;
begin
  if not exists (select 1 from public.lab_classes where id = p_class and teacher_id = auth.uid()) then raise exception 'not_yours'; end if;
  loop
    c := '';
    for i in 1..3 loop c := c || substr(a, 1 + floor(random() * length(a))::int, 1); end loop;
    c := c || '-' || lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (select 1 from public.lab_classes where code = c);
  end loop;
  update public.lab_classes set code = c where id = p_class;
  delete from public.lab_sessions where student_id in (select id from public.lab_students where class_id = p_class);
  return c;
end; $$;
revoke all on function public.lab_new_code(uuid) from public, anon;
grant execute on function public.lab_new_code(uuid) to authenticated;

-- Sign every student in a class out (shared devices at the end of the day).
create or replace function public.lab_sign_out_all(p_class uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.lab_classes where id = p_class and teacher_id = auth.uid()) then raise exception 'not_yours'; end if;
  delete from public.lab_sessions where student_id in (select id from public.lab_students where class_id = p_class);
end; $$;
revoke all on function public.lab_sign_out_all(uuid) from public, anon;
grant execute on function public.lab_sign_out_all(uuid) to authenticated;

-- ---------- 6. Teacher: save the results of a live game ----------
-- The teacher's screen is the referee, so results come from it, never from a student's device.
-- p_results: [{ "id": student uuid, "stats": { ...totals to add... }, "best": { ...bests to keep... }, "badges": ["key", ...] }]
create or replace function public.lab_save_results(p_class uuid, p_results json) returns int
language plpgsql security definer set search_path = public as $$
declare r json; s public.lab_students; k text; v text; st jsonb; bd jsonb; n int := 0;
begin
  if not exists (select 1 from public.lab_classes where id = p_class and teacher_id = auth.uid()) then raise exception 'not_yours'; end if;
  update public.lab_classes set last_used_at = now() where id = p_class;
  for r in select * from json_array_elements(coalesce(p_results, '[]'::json)) loop
    select * into s from public.lab_students where id = (r->>'id')::uuid and class_id = p_class;
    if not found then continue; end if;
    st := s.stats; bd := s.badges;
    -- Totals add up (games, right answers, ...). Only whole numbers between 0 and 1000 per game.
    for k, v in select * from json_each_text(coalesce(r->'stats', '{}'::json)) loop
      if v ~ '^[0-9]{1,4}$' and v::int <= 1000 and k ~ '^[a-z0-9_]{1,24}$' then
        st := jsonb_set(st, array[k], to_jsonb(coalesce((st->>k)::int, 0) + v::int));
      end if;
    end loop;
    -- Bests keep the highest number.
    for k, v in select * from json_each_text(coalesce(r->'best', '{}'::json)) loop
      if v ~ '^[0-9]{1,4}$' and k ~ '^[a-z0-9_]{1,24}$' then
        st := jsonb_set(st, array['best_' || k], to_jsonb(greatest(coalesce((st->>('best_' || k))::int, 0), v::int)));
      end if;
    end loop;
    -- Badges: the day each one was first earned.
    for v in select * from json_array_elements_text(coalesce(r->'badges', '[]'::json)) loop
      if v ~ '^[a-z0-9_]{1,24}$' and not (bd ? v) then bd := bd || jsonb_build_object(v, to_char(now(), 'YYYY-MM-DD')); end if;
    end loop;
    if octet_length(st::text) < 8000 and octet_length(bd::text) < 8000 then
      update public.lab_students set stats = st, badges = bd where id = s.id; n := n + 1;
    end if;
  end loop;
  return n;
end; $$;
revoke all on function public.lab_save_results(uuid, json) from public, anon;
grant execute on function public.lab_save_results(uuid, json) to authenticated;

-- ---------- 7. Students (no account; these are the only things a student's device can call) ----------
create or replace function public.lab_who() returns text
language plpgsql stable security definer set search_path = public, extensions as $$
declare ip text := split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', 'none'), ',', 1);
begin
  return encode(extensions.digest('lab-' || ip, 'sha256'), 'hex');
end; $$;
revoke all on function public.lab_who() from public, anon, authenticated;

-- The class name and its students' first names and buddies, after the right class code.
create or replace function public.lab_roster(p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare w text := public.lab_who(); c public.lab_classes; out json;
begin
  delete from public.lab_attempts where at < now() - interval '1 hour';
  if (select count(*) from public.lab_attempts where who = w and at > now() - interval '10 minutes') >= 15 then
    return json_build_object('error', 'slow');
  end if;
  select * into c from public.lab_classes where code = upper(trim(coalesce(p_code, '')));
  if not found then
    insert into public.lab_attempts (who) values (w);
    return json_build_object('error', 'code');
  end if;
  if c.locked then return json_build_object('error', 'locked'); end if;
  select json_build_object('class', c.name, 'students', coalesce(json_agg(json_build_object('id', s.id, 'name', s.first_name, 'buddy', s.buddy) order by lower(s.first_name)), '[]'::json))
    into out from public.lab_students s where s.class_id = c.id;
  return out;
end; $$;
revoke all on function public.lab_roster(text) from public;
grant execute on function public.lab_roster(text) to anon, authenticated;

-- Sign in: the right class code, the student, and their PIN. Returns a token for 12 hours.
create or replace function public.lab_sign_in(p_code text, p_student uuid, p_pin text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare c public.lab_classes; s public.lab_students; tok text;
begin
  select * into c from public.lab_classes where code = upper(trim(coalesce(p_code, '')));
  if not found then return json_build_object('error', 'code'); end if;
  if c.locked then return json_build_object('error', 'locked'); end if;
  select * into s from public.lab_students where id = p_student and class_id = c.id;
  if not found then return json_build_object('error', 'code'); end if;
  if s.paused_until is not null and s.paused_until > now() then
    return json_build_object('error', 'paused', 'seconds', ceil(extract(epoch from s.paused_until - now())));
  end if;
  if coalesce(p_pin, '') <> s.pin then
    update public.lab_students set fails = case when fails + 1 >= 5 then 0 else fails + 1 end,
      paused_until = case when fails + 1 >= 5 then now() + interval '5 minutes' else null end
      where id = s.id;
    return json_build_object('error', 'pin', 'left', greatest(0, 4 - s.fails));
  end if;
  delete from public.lab_sessions where expires_at < now();
  tok := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.lab_sessions (token_hash, student_id, expires_at)
    values (encode(extensions.digest(tok, 'sha256'), 'hex'), s.id, now() + interval '12 hours');
  update public.lab_students set fails = 0, paused_until = null, last_seen_at = now() where id = s.id;
  update public.lab_classes set last_used_at = now() where id = c.id;
  return json_build_object('token', tok);
end; $$;
revoke all on function public.lab_sign_in(text, uuid, text) from public;
grant execute on function public.lab_sign_in(text, uuid, text) to anon, authenticated;

-- The student behind a token (or nothing).
create or replace function public.lab_token_student(p_token text) returns uuid
language sql stable security definer set search_path = public, extensions as $$
  select student_id from public.lab_sessions
  where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') and expires_at > now();
$$;
revoke all on function public.lab_token_student(text) from public, anon, authenticated;

-- Student Home: my name, buddy, badges, stats and class.
create or replace function public.lab_me(p_token text) returns json
language plpgsql security definer set search_path = public as $$
declare sid uuid := public.lab_token_student(p_token); out json;
begin
  if sid is null then return json_build_object('error', 'signed_out'); end if;
  select json_build_object('id', s.id, 'name', s.first_name, 'buddy', s.buddy, 'badges', s.badges, 'stats', s.stats,
      'class', c.name, 'code', c.code, 'classId', c.id)
    into out from public.lab_students s join public.lab_classes c on c.id = s.class_id where s.id = sid and not c.locked;
  update public.lab_students set last_seen_at = now() where id = sid;
  return coalesce(out, json_build_object('error', 'signed_out'));
end; $$;
revoke all on function public.lab_me(text) from public;
grant execute on function public.lab_me(text) to anon, authenticated;

-- Save my buddy. The first save earns the Buddy Maker badge.
create or replace function public.lab_save_buddy(p_token text, p_buddy jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare sid uuid := public.lab_token_student(p_token);
begin
  if sid is null then return json_build_object('error', 'signed_out'); end if;
  if jsonb_typeof(p_buddy) <> 'object' or octet_length(p_buddy::text) > 1500 then return json_build_object('error', 'bad'); end if;
  update public.lab_students set buddy = p_buddy,
    badges = case when badges ? 'buddy' then badges else badges || jsonb_build_object('buddy', to_char(now(), 'YYYY-MM-DD')) end
    where id = sid;
  return json_build_object('ok', true);
end; $$;
revoke all on function public.lab_save_buddy(text, jsonb) from public;
grant execute on function public.lab_save_buddy(text, jsonb) to anon, authenticated;

create or replace function public.lab_sign_out(p_token text) returns void
language sql security definer set search_path = public, extensions as $$
  delete from public.lab_sessions where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;
revoke all on function public.lab_sign_out(text) from public;
grant execute on function public.lab_sign_out(text) to anon, authenticated;
