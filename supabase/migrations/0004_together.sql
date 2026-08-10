-- Hoppr — Together (Slice 5). Group planning: a "hop" that friends join by code,
-- answer privately, then swipe a shared shortlist until a place clears the table.
--
-- Model: the host device holds the authoritative `Hop` (see src/core/together/
-- types.ts) and publishes the full serialized state after every mutation. So the
-- source of truth is `hops.state` (a jsonb snapshot of the whole Hop); joiners
-- subscribe to that row over Supabase Realtime and mirror it locally. The child
-- tables (`hop_members`, `hop_answers`, `swipes`) are a normalized record of who
-- joined and what they did — handy for a future server-authoritative merge, but
-- not required for the host-authoritative flow shipping now.
--
-- Time votes (`Hop.slotVotes`) live INSIDE the `state` jsonb — they are part of
-- the authoritative Hop the host publishes, so no separate `slot_votes` table.
--
-- SECURITY POSTURE: this is a shareable, no-account group session. Anyone who
-- knows a hop's id (a random `hop_<ts>` string) or its human join code can read
-- and write that hop's rows — the id/code IS the capability, exactly like a
-- shared invite link. RLS is enabled but permissive (no auth.uid() checks) so
-- friends with no account can join. Mirrors the crowdsourced risk posture of the
-- earlier migrations; tightenable later (e.g. per-hop tokens / signed codes)
-- without touching the client contract.

-- Hop ids and member ids are client-generated strings (`hop_<ts>`, `you`, bot
-- ids, or a joiner id from the edge function) — NOT uuids — so these are `text`
-- primary keys to round-trip src/core/together/types.ts faithfully.

-- ── hops ─────────────────────────────────────────────────────────────────────
create table if not exists public.hops (
  id text primary key,                       -- Hop.id (e.g. "hop_1699999999999")
  code text not null unique,                 -- Hop.code — the human join code ("HOP-4KQ")
  title text not null default 'A hop',
  host_id text not null,                     -- Hop.hostId (member id of the host)
  status text not null default 'lobby',      -- HopStatus: lobby|answering|swiping|picked|planned
  state jsonb not null,                      -- authoritative serialized Hop snapshot
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hops_code_idx on public.hops (code);

-- ── hop_members ──────────────────────────────────────────────────────────────
-- One row per person at the table. No auth user required — no-account friends
-- join freely. `profile`/`swipes` mirror the HopMember jsonb sub-objects.
create table if not exists public.hop_members (
  id uuid primary key default gen_random_uuid(),
  hop_id text not null references public.hops (id) on delete cascade,
  member_id text not null,                   -- HopMember.id ("you", bot id, or joiner id)
  name text not null,
  emoji text not null default '🐇',
  kind text not null default 'friend',       -- 'you' | 'friend'
  answered boolean not null default false,
  swiped_done boolean not null default false,
  profile jsonb,                             -- HopMember.profile { weights, answers }
  swipes jsonb not null default '{}'::jsonb,  -- HopMember.swipes { placeId: liked }
  created_at timestamptz not null default now(),
  unique (hop_id, member_id)
);
create index if not exists hop_members_hop_idx on public.hop_members (hop_id);

-- ── hop_answers ──────────────────────────────────────────────────────────────
-- Each private answer, for record-keeping / a future server merge.
create table if not exists public.hop_answers (
  id bigint generated always as identity primary key,
  hop_id text not null references public.hops (id) on delete cascade,
  member_id text not null,
  question_id text not null,
  option_id text not null,
  at timestamptz not null default now()
);
create index if not exists hop_answers_hop_idx on public.hop_answers (hop_id);

-- ── swipes ───────────────────────────────────────────────────────────────────
create table if not exists public.swipes (
  id bigint generated always as identity primary key,
  hop_id text not null references public.hops (id) on delete cascade,
  member_id text not null,
  place_id text not null,
  liked boolean not null,
  at timestamptz not null default now(),
  unique (hop_id, member_id, place_id)
);
create index if not exists swipes_hop_idx on public.swipes (hop_id);

-- ── keep hops.updated_at fresh (nudges Realtime on every publish) ─────────────
create or replace function public.touch_hop_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hops_touch_updated_at on public.hops;
create trigger hops_touch_updated_at
  before update on public.hops
  for each row execute function public.touch_hop_updated_at();

-- ── row level security (shareable-session model — see header) ─────────────────
alter table public.hops enable row level security;
alter table public.hop_members enable row level security;
alter table public.hop_answers enable row level security;
alter table public.swipes enable row level security;

-- Knowing the hop id/code is the capability: full read+write to any hop row.
-- No auth.uid() checks so no-account friends can join and collaborate.
create policy "hops open" on public.hops
  for all using (true) with check (true);
create policy "hop_members open" on public.hop_members
  for all using (true) with check (true);
create policy "hop_answers open" on public.hop_answers
  for all using (true) with check (true);
create policy "swipes open" on public.swipes
  for all using (true) with check (true);

-- ── Supabase Realtime ────────────────────────────────────────────────────────
-- Joiners subscribe to postgres_changes on `hops` (the authoritative state row);
-- the child tables are published too for future normalized syncing.
alter publication supabase_realtime add table public.hops;
alter publication supabase_realtime add table public.hop_members;
alter publication supabase_realtime add table public.hop_answers;
alter publication supabase_realtime add table public.swipes;
