-- Hoppr — initial schema (Slice 1)
-- Run via the Supabase SQL editor or `supabase db push`.
-- Mirrors the local taste engine so the app can move from mock data to a real
-- backend without changing screen code.

create extension if not exists postgis;

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  home_lat double precision,
  home_lng double precision,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── taste_profiles (the learning core) ──────────────────────────────────────
create table if not exists public.taste_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  -- { "quiet": 0.8, "outlets": 0.6, ... } — same tag vocabulary as the client
  weights jsonb not null default '{}'::jsonb,
  summary text,
  updated_at timestamptz not null default now()
);

-- ── questions_log (every answer, to avoid repeats + explain the profile) ─────
create table if not exists public.questions_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id text not null,
  option_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists questions_log_user_idx on public.questions_log (user_id, created_at desc);

-- ── places ──────────────────────────────────────────────────────────────────
create table if not exists public.places (
  id text primary key,
  name text not null,
  category text not null,
  area text,
  lat double precision not null,
  lng double precision not null,
  geom geography(Point, 4326)
    generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  popularity real not null default 0.5,
  price smallint not null default 2,
  tags text[] not null default '{}',
  blurb text,
  source text not null default 'seed', -- seed | google | owner
  created_at timestamptz not null default now()
);
create index if not exists places_geom_idx on public.places using gist (geom);
create index if not exists places_tags_idx on public.places using gin (tags);

-- ── ratings + reported specs ────────────────────────────────────────────────
create table if not exists public.ratings (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id text not null references public.places (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create table if not exists public.place_specs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id text not null references public.places (id) on delete cascade,
  label text not null,      -- 'Noise', 'Outlets', ...
  value text not null,      -- 'Quiet', 'Plenty', ...
  created_at timestamptz not null default now()
);
create index if not exists place_specs_place_idx on public.place_specs (place_id);

-- ── suggestions_log (what we showed + what happened → feedback) ──────────────
create table if not exists public.suggestions_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id text not null references public.places (id) on delete cascade,
  context jsonb,
  outcome text, -- shown | opened | saved | visited | dismissed
  created_at timestamptz not null default now()
);

-- ── nearby query (candidate generation) ─────────────────────────────────────
create or replace function public.places_nearby(
  in_lat double precision,
  in_lng double precision,
  radius_m double precision default 5000
)
returns table (like public.places including all, distance_m double precision)
language sql stable
as $$
  select p.*, st_distance(p.geom, st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography) as distance_m
  from public.places p
  where st_dwithin(p.geom, st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography, radius_m)
  order by distance_m asc;
$$;

-- ── auto-create profile + taste row on signup ───────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'You'))
  on conflict (id) do nothing;
  insert into public.taste_profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── row level security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.taste_profiles enable row level security;
alter table public.questions_log enable row level security;
alter table public.ratings enable row level security;
alter table public.place_specs enable row level security;
alter table public.suggestions_log enable row level security;
alter table public.places enable row level security;

-- own-row access for per-user tables
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own taste" on public.taste_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own questions" on public.questions_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own suggestions" on public.suggestions_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ratings + specs: read all (crowdsourced), write your own
create policy "read ratings" on public.ratings for select using (true);
create policy "write own ratings" on public.ratings
  for insert with check (auth.uid() = user_id);
create policy "update own ratings" on public.ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "read specs" on public.place_specs for select using (true);
create policy "write own specs" on public.place_specs
  for insert with check (auth.uid() = user_id);

-- places: readable by everyone, insertable by any authenticated user (crowdsourced)
create policy "read places" on public.places for select using (true);
create policy "insert places" on public.places
  for insert to authenticated with check (true);
