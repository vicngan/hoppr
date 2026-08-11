# Hoppr Agent Guide

Read only the docs relevant to the current task — don't load all of `/docs` by default.

## Product

Hoppr is a discovery app for "when you don't know where to go." A mascot asks
rolling questions and suggests places that learn your taste over time. Includes
a menu chooser (snap a menu, get a taste-matched pick) and **Together**, a
group-planning layer for deciding as a group.

See `docs/PRODUCT.md` for the full slice history and product intent.

## Stack

Expo (React Native) + TypeScript + Expo Router, mobile-first (RN Web for web).
Supabase backend (Postgres + PostGIS, Auth, Storage, Edge Functions). Zustand +
AsyncStorage for local state. TanStack Query for server data. Google Places
(New) for venue data/photos. Claude (via Edge Functions) for ranking, menu
OCR, and question generation — never called directly from the client.

## Architecture Rules

### Recommendation engine

`src/core/engine/` defines the `RecoEngine` interface (`nextQuestion`,
`rankPlaces`), implemented by the synchronous, keyless `RulesEngine`. This is
NOT swapped for a Claude implementation — the Claude "flip" happens inside
`src/core/discovery.ts`'s `useRanked`: rules ranking runs first as the instant
baseline, and when Supabase is configured, Claude (via `hoppr-rank`)
re-orders the top candidates and rewrites the "why" lines. Question
generation (`nextQuestion`) stays rules-based/sync because it's called from
render.

Anti-hallucination is enforced in **code**, not the prompt: every place id
Claude returns is intersected against the input candidate set in
`hoppr-rank/index.ts`; foreign ids are dropped, duplicates removed, omissions
appended. Match score, distance, and candidate generation are always
rules-computed — never model-invented. See `docs/AI_SYSTEM.md`.

### Taste

Global taste (`src/core/taste/store.ts`) is local AsyncStorage-persisted,
tag-weight based (`src/core/taste/tags.ts`, `profile.ts`). Together hops copy
the global profile into a **hop-local** `HopMember.profile` that private
answers nudge — a hop must never mutate the user's global taste.

### AI

Client code never holds provider API keys. All model calls go through
Supabase Edge Functions (`supabase/functions/hoppr-*`). Keep keyless
fallbacks working (seed places/menus, rules-only ranking, simulated Together
bots) — the whole app must run with zero secrets configured.

### Places

Google Places is the external venue source, accessed only through
`src/core/places-repo.ts` (provider) + `src/core/places-store.ts` (cache),
never called directly from UI. `fetchNearby` hits `hoppr-places` when
Supabase is configured, else falls back to seed data.

### Data

Respect Supabase RLS (`auth.uid() = user_id` policies already exist on
user-owned tables even though there's no sign-in flow yet). Never use
service-role credentials client-side.

## Design

Source of truth: `src/theme/tokens.ts`, `src/theme/fonts.ts`,
`docs/DESIGN_SYSTEM.md`. One committed warm paper/ink/rust light theme — no
dark mode. Reuse `src/components/ui/` primitives before adding new ones.

## Before Coding

1. Read the relevant doc(s) in `/docs`.
2. Look at the existing implementation in the relevant `src/core/` module.
3. Search for existing components/helpers before creating new ones.
4. Preserve offline/keyless behavior — every AI-touching feature needs a
   non-AI fallback path.
5. Avoid unrelated refactors.

## After Coding

```bash
npx tsc --noEmit
```

There is no test suite yet beyond `eval/rerank/` (a ranking quality harness,
run via `npm run eval:rerank`, not part of normal dev loop). Don't claim a
change is verified by tests that don't exist — say what you actually checked.

## Important Paths

- `src/core/taste/` — taste model (tags, weights, `tasteFit`, store)
- `src/core/engine/` — `RecoEngine` interface + `RulesEngine`
- `src/core/discovery.ts` — ranking composition, Claude rerank hybrid
- `src/core/menu/` — menu model + dish recommender
- `src/core/together/` — group planning (hops, bots, sync, match logic)
- `src/core/library/` — saves/ratings
- `src/core/feedback.ts` — save/rate → taste weight updates
- `src/core/places-repo.ts`, `places-store.ts` — Google Places provider + cache
- `src/core/ai/` — client-side AI helpers (call Edge Functions, never providers)
- `src/theme/` — design tokens, fonts
- `src/components/ui/` — design primitives
- `src/app/` — Expo Router screens (tabs, hop/, menu/, place/, etc.)
- `supabase/functions/` — Edge Functions (Claude + Google Places server calls)
- `supabase/migrations/` — schema

## Documentation

- Product behavior / slice history → `docs/PRODUCT.md`
- System architecture → `docs/ARCHITECTURE.md`
- AI/recommendation contracts → `docs/AI_SYSTEM.md`
- Design system → `docs/DESIGN_SYSTEM.md`
- Database schema → `docs/DATA_MODEL.md`
- Current status / what's left → `docs/CURRENT_STATE.md`
