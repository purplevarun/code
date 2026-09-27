-- PurpleDSA database schema for the shared supabase-common project.
-- Run this once in the Supabase project's SQL Editor, then add "purpledsa"
-- to Settings -> API -> Exposed schemas so PostgREST/RPC can reach it.

create schema if not exists purpledsa;

-- Minimal table: login fields + a flat array of solved problem codes +
-- a jsonb map for everything else (display name, per-provider handles).
-- otherDetails shape: { "name": "...", "handles": {"leetcode": "x", ...} }
create table if not exists purpledsa.users (
  "id" text primary key not null,
  "username" text not null,
  "passwordHash" text not null,
  "problemsSolved" text[] not null default '{}',
  "otherDetails" jsonb not null default '{}'::jsonb,
  "createdAt" timestamptz default now() not null,
  constraint "users_username_unique" unique ("username")
);

-- Atomic helpers so client toggles and provider syncs can't clobber each
-- other via read-modify-write on the array.

create or replace function purpledsa.add_solved(p_user_id text, p_slug text)
returns void
language sql
as $$
  update purpledsa.users
     set "problemsSolved" = array_append("problemsSolved", p_slug)
   where id = p_user_id
     and not (p_slug = any("problemsSolved"));
$$;

create or replace function purpledsa.remove_solved(p_user_id text, p_slug text)
returns void
language sql
as $$
  update purpledsa.users
     set "problemsSolved" = array_remove("problemsSolved", p_slug)
   where id = p_user_id;
$$;

create or replace function purpledsa.add_solved_many(p_user_id text, p_slugs text[])
returns void
language sql
as $$
  update purpledsa.users
     set "problemsSolved" = coalesce(
       (select array_agg(distinct slug)
        from unnest("problemsSolved" || p_slugs) as slug),
       '{}'
     )
   where id = p_user_id;
$$;

-- Allow Supabase client roles to query/insert rows used by this app.
grant usage on schema purpledsa to anon, authenticated;
grant select, insert, update on table purpledsa.users to anon, authenticated;
grant execute on function purpledsa.add_solved(text, text) to anon, authenticated;
grant execute on function purpledsa.remove_solved(text, text) to anon, authenticated;
grant execute on function purpledsa.add_solved_many(text, text[]) to anon, authenticated;

alter table purpledsa.users enable row level security;

drop policy if exists "allow_select_users" on purpledsa.users;
drop policy if exists "allow_insert_users" on purpledsa.users;
drop policy if exists "allow_update_users" on purpledsa.users;

create policy "allow_select_users"
  on purpledsa.users
  as permissive
  for select
  to anon, authenticated
  using (true);

create policy "allow_insert_users"
  on purpledsa.users
  as permissive
  for insert
  to anon, authenticated
  with check (true);

create policy "allow_update_users"
  on purpledsa.users
  as permissive
  for update
  to anon, authenticated
  using (true)
  with check (true);


