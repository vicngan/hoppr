# Hoppr

A discovery app for "when you don't know where to go." A mascot asks rolling
questions and suggests places that learn your taste over time. Includes a
menu chooser (snap a menu, get a taste-matched pick) and **Together**, a
group-planning social layer for deciding as a group.

**Stack:** Expo (React Native) + TypeScript + Expo Router, mobile-first (web
via RN Web later). Supabase backend (Postgres + PostGIS, Auth, Storage, Edge
Functions). Hybrid recommendation engine: a fast rules-based core with Claude
layered on top for ranking and menu OCR, behind the same interface so either
can run keyless. Google Places (New) for real venue data + photos.

Design system: warm paper/ink/rust palette (`#f7f2e8` / `#14110d` / `#c8431c`),
Instrument Serif display + DM Sans UI + JetBrains Mono labels. Source of
truth is the Claude Design project *"Hoppr discovery app design"*. Brand
assets live in `assets/brand/`.

---

## What's built

### Slice 0 — Scaffold + design system
- Design tokens and primitives: `src/theme/`, `src/components/ui/`.
- 5-tab shell (Ask / Discover / Together / You / list) + stack routes
  (place, category, chat, rate, hop, menu).
- Bottom tabs are persistent across every screen, including pushed stack
  routes — a single `GlobalTabBar` rendered once in the root layout, below
  the `<Stack>`, deriving active state from the current path.

### Slice 1 — The learning discovery loop (local data)
- Taste model (`src/core/taste/`): tag vocabulary, weight-update math,
  `tasteFit` scoring, Zustand store persisted to AsyncStorage (the "account"
  until auth lands).
- Reco engine (`src/core/engine/`): `RecoEngine` interface (`nextQuestion`,
  `rankPlaces`) with a `RulesEngine` implementation. Swap point is
  `engine/index.ts` — screens never change when the impl changes.
- Question bank, 14 seed places with tags/coordinates, ranking + row
  composition in `src/core/discovery.ts`, location via `expo-location` with
  an Ann Arbor fallback.
- Ask / Discover / Place / You / Category / list / Rate all wired to the
  engine — answers persist and visibly reorder Discover and update your
  traits on You.

### Slice 2 — Memory and feedback
- Library store (`src/core/library/store.ts`): saved place ids + rating
  records (stars, spec picks, note), Zustand + AsyncStorage.
- Rating/save → taste feedback (`src/core/feedback.ts`): saving nudges tags
  up, 5★ pushes a place's tags up (1★ down), spec picks nudge matching tags.
- Save button + rating flow wired end-to-end; Your list shows real
  saved/visited grids with star badges and empty states; You shows live
  answered/saved/rated counts and a "forget" reset.

### Slice 3 — Menu chooser (the AI headline)
- Menu model + taste-reactive dish recommender (`src/core/menu/`): rules
  engine picks by profile (quick/cheap/splurge) + dietary limits.
- AI client (`src/core/ai/client.ts`) → Edge Function `hoppr-menu` (Claude
  vision + structured outputs → menu JSON, key stays server-side).
- `/menu/[id]`: Hoppr's pick + alternatives, dietary toggles, full menu,
  "Snap the menu" via `expo-image-picker`, manual-add fallback when keyless.
- Works fully offline/keyless on seed menus + manual entry; photo OCR
  activates once Supabase + `ANTHROPIC_API_KEY` are live.

### Slice 4 — Real places via Google Places
- Places cache (`src/core/places-store.ts`) + provider
  (`src/core/places-repo.ts`): `fetchNearby` hits the Edge Function when
  Supabase is configured, else falls back to seed data; react-query hook
  keyed on rounded coords.
- Edge Function `hoppr-places`: Google Places API (New) `searchNearby`,
  maps types → category/tags, rating → popularity, priceLevel → price,
  best-effort upsert into `places` (source = `google`).
- Place card images (`src/components/PlaceImage.tsx`, `src/core/maps.ts`):
  Google Places photo → static map → stripe placeholder, in that order.

### Slice 5 — Together (group planning)
- Core (`src/core/together/`): 4 seeded bot friends with distinct tastes,
  group shortlist (avg + min-veto penalty), pick tallies, swipe logic, time
  slot voting, a Zustand state machine (`startHop → invite → answers → swipe
  → pick → plan → lock`). Your hop answers refine a **hop-local** taste copy
  — never pollutes your global profile.
- UI (`src/app/hop/`): lobby, answer, swipe (Pass/Like), pick reveal
  (animated with reanimated, "Liked by…" / "Unanimous"), plan (time-slot
  vote + share card), join.
- Sync seam (`src/core/together/sync.ts`): `noopSync` by default,
  `supabase-sync.ts` registers realtime automatically once Supabase is
  configured.
- Scope: through group pick + light plan. Split-the-bill deferred.

### Chat, wired live
- `src/app/chat.tsx` runs on the same engine + taste store as Ask (was a
  static placeholder). Reply chips carry real tag deltas; free-text input
  does best-effort keyword matching (no NLP). Lands on a real top pick as a
  tappable card once the question bank is spent.

### Claude ranking (the reco "flip") — hybrid, per-user, hallucination-safe
- Edge Function `hoppr-rank`: Claude re-orders + explains the *rules
  engine's* top candidates. Anti-hallucination is enforced in **code**, not
  prompt — per-request scoping (no cross-user data in a call) and an
  id-whitelist that drops any place id not in the input set, dedupes, and
  appends omissions, so the output is always a permutation-with-reasons of
  exactly what went in. Re-validated client-side as defense in depth.
- Only order + reason come from Claude — match score, distance, and
  candidate generation stay rules-computed; no model-invented numbers.
- Scope: Discover only. Ask/Chat next-question stays rules-based (the
  `RecoEngine` interface is sync and called from render, by design).

---

## Backend status (Supabase)

**Connected and live** as of 2026-08-07. Project `hoppr`
(`plvrsmfngnuzpdavljbw`, us-east-2), linked via `supabase/.temp/project-ref`.

- All 4 migrations applied: `0001_init` (profiles, taste_profiles,
  questions_log, places + PostGIS `places_nearby()`, ratings, place_specs,
  suggestions_log, RLS), `0002_menus`, `0003_place_photo`, `0004_together`
  (host-authoritative `hops.state` jsonb + normalized members/answers/swipes,
  Realtime publication).
- **Not yet deployed:** the 4 Edge Functions (`hoppr-menu`, `hoppr-places`,
  `hoppr-hop`, `hoppr-rank`) and their secrets (`ANTHROPIC_API_KEY`,
  `GOOGLE_PLACES_API_KEY`). The app runs fully keyless without them (seed
  places/menus, rules-only ranking, simulated Together friends). Deploy with:

  ```
  supabase functions deploy hoppr-menu hoppr-places hoppr-hop hoppr-rank
  supabase secrets set ANTHROPIC_API_KEY=... GOOGLE_PLACES_API_KEY=...
  ```

- Known CLI quirk: `supabase link` currently errors on this project
  (`LegacyLinkApiKeysNetworkError`, a CLI-side schema-validation bug parsing
  one API key's `inserted_at`). Workaround already applied: write the ref
  directly to `supabase/.temp/project-ref` — `db push` / `migration list`
  work fine after that.

---

## What's left

1. **Deploy the backend** — functions + secrets above. Turns on: menu photo
   OCR, real Google Places results, Claude reco ranking, and real-time
   Together sync (multi-device, not just simulated bots).
2. **Auth** — `profiles`/`taste_profiles` and RLS are already schema-ready
   (`auth.uid() = user_id` policies exist since Slice 1), but there's no
   sign-in flow yet. The taste "account" is still local AsyncStorage only.
3. **Question generation via Claude** — the Slice 3 plan called for flipping
   `nextQuestion` to Claude too; kept rules-based so far for latency +
   keyless support. `engine/index.ts` is still the swap point.
4. **Split-the-bill** — explicitly deferred from Together's scope.
5. **Web build** — RN Web SSR is verified working, but no dedicated web
   layout/polish pass has been done.
6. **Owner portal** — a way for venues to claim/edit their own listing
   (mentioned in original plan, not started).
7. **Real multi-user testing of Together** — the match/pick logic is
   verified via simulation and 4 seeded bots; not yet tested with real
   concurrent users over Realtime.

Full original build plan: `~/.claude/plans/i-want-to-create-sharded-acorn.md`.
