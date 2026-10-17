create extension if not exists pgcrypto with schema extensions;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  mission_id text not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  learner_choice text,
  hint_count integer not null default 0 check (hint_count >= 0),
  created_at timestamptz not null default now(),
  game_state text not null default 'ordering',
  is_shared boolean not null default false,
  instructor_client_id text,
  instructor_token_hash text,
  learner_ready boolean not null default false,
  mission_started boolean not null default false
);

alter table public.sessions drop column if exists stage;
alter table public.sessions add column if not exists game_state text not null default 'ordering';
alter table public.sessions add column if not exists is_shared boolean not null default false;
alter table public.sessions add column if not exists hint_count integer not null default 0;
alter table public.sessions add column if not exists instructor_client_id text;
alter table public.sessions add column if not exists instructor_token_hash text;
alter table public.sessions add column if not exists learner_ready boolean not null default false;
alter table public.sessions add column if not exists mission_started boolean not null default false;

update public.sessions
set instructor_token_hash = encode(extensions.digest(instructor_client_id, 'sha256'), 'hex'),
    instructor_client_id = null
where instructor_client_id is not null
  and instructor_token_hash is null;

update public.sessions
set mission_started = true
where game_state <> 'ordering' or status = 'completed';

alter table public.sessions drop constraint if exists sessions_game_state_check;
update public.sessions set game_state = 'prices_revealed' where game_state = 'purchase_decision';
alter table public.sessions
  add constraint sessions_game_state_check
  check (game_state in (
    'ordering',
    'croissant_unavailable',
    'alternative_requested',
    'alternative_revealed',
    'prices_revealed',
    'payment',
    'completed'
  ));

create unique index if not exists sessions_single_shared_game
  on public.sessions (is_shared)
  where is_shared = true;

insert into public.sessions (mission_id, game_state, is_shared)
values ('cafe-a1', 'ordering', true)
on conflict (is_shared) where is_shared = true do nothing;

alter table public.sessions enable row level security;
revoke all on public.sessions from anon, authenticated;
grant select on public.sessions to anon, authenticated;

drop policy if exists "Sessions are readable by session id" on public.sessions;
drop policy if exists "Shared game is readable" on public.sessions;
create policy "Shared game is readable"
  on public.sessions for select
  to anon, authenticated
  using (is_shared = true);

drop function if exists public.create_game_session(text);
drop function if exists public.validate_native_controller(uuid, text);
drop function if exists public.advance_game_stage(uuid, text, smallint);
drop function if exists public.record_learner_hint(uuid);
drop function if exists public.set_learner_choice(uuid, text);
drop function if exists public.advance_shared_game(text, text);
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
drop table if exists private.session_controllers cascade;

create or replace function public.claim_shared_instructor(p_client_id text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  claimed boolean;
begin
  if p_client_id is null or length(p_client_id) < 20 or length(p_client_id) > 100 then
    raise exception 'Invalid client id';
  end if;

  update public.sessions
  set instructor_token_hash = encode(extensions.digest(p_client_id, 'sha256'), 'hex'),
      instructor_client_id = null
  where is_shared = true
    and (
      instructor_token_hash = encode(extensions.digest(p_client_id, 'sha256'), 'hex')
      or (instructor_token_hash is null and status = 'active')
    )
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

create or replace function public.set_shared_learner_ready()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  updated boolean;
begin
  update public.sessions
  set learner_ready = true
  where is_shared = true
    and status = 'active'
    and game_state = 'ordering'
    and mission_started = false
  returning true into updated;

  return coalesce(updated, false);
end;
$$;

create or replace function public.start_shared_game(p_client_id text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  started boolean;
begin
  update public.sessions
  set mission_started = true
  where is_shared = true
    and instructor_token_hash = encode(extensions.digest(p_client_id, 'sha256'), 'hex')
    and learner_ready = true
    and mission_started = false
    and game_state = 'ordering'
    and status = 'active'
  returning true into started;

  return coalesce(started, false);
end;
$$;

create or replace function public.advance_shared_game(
  p_client_id text,
  p_expected_state text,
  p_next_state text
)
returns public.sessions
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  game public.sessions;
  valid_transition boolean;
begin
  valid_transition := case p_expected_state
    when 'ordering' then p_next_state = 'croissant_unavailable'
    when 'croissant_unavailable' then p_next_state = 'alternative_requested'
    when 'alternative_requested' then p_next_state = 'alternative_revealed'
    when 'alternative_revealed' then p_next_state = 'prices_revealed'
    when 'prices_revealed' then p_next_state = 'payment'
    when 'payment' then p_next_state = 'completed'
    else false
  end;

  if not valid_transition then
    raise exception 'Invalid communication gate transition';
  end if;

  update public.sessions
  set game_state = p_next_state,
      status = case when p_next_state = 'completed' then 'completed' else 'active' end
  where is_shared = true
    and instructor_token_hash = encode(extensions.digest(p_client_id, 'sha256'), 'hex')
    and mission_started = true
    and game_state = p_expected_state
    and status = 'active'
  returning * into game;

  if not found then
    raise exception 'The shared game state has changed';
  end if;

  return game;
end;
$$;

create or replace function public.restart_shared_game(p_client_id text)
returns public.sessions
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  game public.sessions;
begin
  update public.sessions
  set game_state = 'ordering',
      status = 'active',
      hint_count = 0,
      learner_choice = null,
      learner_ready = false,
      mission_started = false
  where is_shared = true
    and instructor_token_hash = encode(extensions.digest(p_client_id, 'sha256'), 'hex')
    and status = 'completed'
  returning * into game;

  if not found then
    raise exception 'Only the claimed Speaker can restart a completed game';
  end if;

  return game;
end;
$$;

create or replace function public.record_learner_hint()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  new_hint_count integer;
begin
  update public.sessions
  set hint_count = hint_count + 1
  where is_shared = true and status = 'active' and mission_started = true
  returning hint_count into new_hint_count;

  if not found then
    raise exception 'The shared game is not active';
  end if;

  return new_hint_count;
end;
$$;

revoke all on function public.claim_shared_instructor(text) from public;
revoke all on function public.set_shared_learner_ready() from public;
revoke all on function public.start_shared_game(text) from public;
revoke all on function public.advance_shared_game(text, text, text) from public;
revoke all on function public.restart_shared_game(text) from public;
revoke all on function public.record_learner_hint() from public;
grant execute on function public.claim_shared_instructor(text) to anon, authenticated;
grant execute on function public.set_shared_learner_ready() to anon, authenticated;
grant execute on function public.start_shared_game(text) to anon, authenticated;
grant execute on function public.advance_shared_game(text, text, text) to anon, authenticated;
grant execute on function public.restart_shared_game(text) to anon, authenticated;
grant execute on function public.record_learner_hint() to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sessions'
  ) then
    alter publication supabase_realtime add table public.sessions;
  end if;
end;
$$;

-- Reset the shared game and release the Speaker claim from the SQL Editor:
-- update public.sessions
-- set game_state = 'ordering', status = 'active', instructor_client_id = null,
--     instructor_token_hash = null, learner_ready = false, mission_started = false,
--     hint_count = 0, learner_choice = null
-- where is_shared = true;
