-- =========================================================================
-- Roamly — Supabase schema
--
-- Run this once in your Supabase project: Dashboard → SQL Editor → paste →
-- Run. It is idempotent (safe to re-run). Creates:
--   • profiles          — one row per user (display name)
--   • places            — saved places, one owner each
--   • ai_credentials    — the user's Groq key, SERVER-ONLY (never readable
--                         by the browser); reached via security-definer RPCs
--                         and, for actual AI calls, the service role in the
--                         Netlify function.
-- Row-Level Security is on everywhere; each user only ever sees their own rows.
-- =========================================================================

-- ---------- profiles -----------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- places -------------------------------------------------------
create table if not exists public.places (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  name       text not null,
  address    text,
  category   text,
  status     text not null default 'want' check (status in ('want', 'visited')),
  notes      text,
  lat        double precision,
  lng        double precision,
  created_at timestamptz not null default now()
);

create index if not exists places_user_id_idx on public.places (user_id, created_at desc);

alter table public.places enable row level security;

drop policy if exists "places_all_own" on public.places;
create policy "places_all_own" on public.places
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- ai_credentials (server-only key) -----------------------------
create table if not exists public.ai_credentials (
  user_id    uuid primary key references auth.users on delete cascade,
  groq_key   text,
  groq_model text,
  updated_at timestamptz not null default now()
);

alter table public.ai_credentials enable row level security;
-- Intentionally NO policies for the authenticated/anon roles: clients can
-- neither read nor write this table directly. The secret key is reached only
-- through the security-definer functions below (which never return it) and by
-- the service role inside the serverless AI proxy.

-- ---------- AI credential RPCs (security definer) ------------------------
-- Status only — returns whether a key exists and the chosen model, never the
-- key itself. Safe to call from the browser.
create or replace function public.ai_status()
returns table (has_key boolean, model text)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(groq_key, '') <> '' as has_key,
    groq_model as model
  from public.ai_credentials
  where user_id = auth.uid();
$$;

-- Upsert the caller's key and/or model. An empty key keeps the existing one
-- (so the user can change just the model); use ai_clear() to remove it.
create or replace function public.ai_set(p_key text, p_model text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_credentials (user_id, groq_key, groq_model, updated_at)
  values (auth.uid(), nullif(p_key, ''), nullif(p_model, ''), now())
  on conflict (user_id) do update set
    groq_key   = coalesce(nullif(excluded.groq_key, ''), public.ai_credentials.groq_key),
    groq_model = excluded.groq_model,
    updated_at = now();
end;
$$;

-- Remove the caller's stored key + model entirely.
create or replace function public.ai_clear()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.ai_credentials where user_id = auth.uid();
end;
$$;

revoke all on function public.ai_status()             from public, anon;
revoke all on function public.ai_set(text, text)      from public, anon;
revoke all on function public.ai_clear()              from public, anon;
grant execute on function public.ai_status()          to authenticated;
grant execute on function public.ai_set(text, text)   to authenticated;
grant execute on function public.ai_clear()           to authenticated;

-- ---------- auto-create a profile row on signup -------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
