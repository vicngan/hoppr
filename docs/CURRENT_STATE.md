# Current State

Updated: 2026-08-11

Full history/detail lives in `README.md`; this is the short version for
agents deciding what to work on.

## Complete

- [x] Slice 0 — scaffold + design system (tokens, primitives, 5-tab shell + stack routes)
- [x] Slice 1 — learning discovery loop (taste model, `RulesEngine`, Ask/Discover/Place/You/Category/list/Rate wired)
- [x] Slice 2 — memory + feedback (library store, save/rate → taste feedback)
- [x] Slice 3 — menu chooser (menu model, `hoppr-menu` vision extraction, keyless fallback)
- [x] Slice 4 — real places via Google Places (`hoppr-places`, places cache, photo fallback chain)
- [x] Slice 5 — Together (hop state machine, 4 seeded bots, sync seam, lobby→plan UI)
- [x] Chat wired to the live engine + taste store (was a static placeholder)
- [x] Claude reranking (`hoppr-rank`), hybrid + id-whitelisted, Discover only
- [x] Rerank eval harness (`eval/rerank/`, `npm run eval:rerank`)
- [x] Location picker, AI-generated Ask questions (`hoppr-questions`), hidden gems (per latest commit)

## Backend (Supabase)

Connected and live as of 2026-08-07. Project `hoppr`
(`plvrsmfngnuzpdavljbw`, us-east-2), linked via `supabase/.temp/project-ref`
(see Known Issues below — do not re-link).

Migrations applied: `0001_init` through `0005_place_rating`.

Edge Functions exist in `supabase/functions/` (`hoppr-menu`, `hoppr-places`,
`hoppr-hop`, `hoppr-rank`, `hoppr-questions`) — check deploy status before
assuming they're live in a given environment:
```
supabase functions deploy hoppr-menu hoppr-places hoppr-hop hoppr-rank hoppr-questions
supabase secrets set ANTHROPIC_API_KEY=... GOOGLE_PLACES_API_KEY=...
```
The app runs fully keyless without them (seed places/menus, rules-only
ranking, simulated Together friends).

## Not complete

- [ ] Auth / sign-in flow (RLS + `profiles`/`taste_profiles` schema is ready; taste is still local-only)
- [ ] Split-the-bill in Together (explicitly deferred)
- [ ] Dedicated web layout/polish pass (RN Web SSR verified working, no polish yet)
- [ ] Owner portal (venues claiming/editing their own listing)
- [ ] Real multi-user testing of Together over Realtime (verified via simulation + 4 bots only)

## Known issues

**Supabase CLI link bug**: `supabase link` errors on this project with
`LegacyLinkApiKeysNetworkError` (CLI-side schema-validation bug parsing an
API key's `inserted_at`). Workaround already applied: the project ref is
written directly to `supabase/.temp/project-ref`; `db push` /
`migration list` work fine after that. Don't try to "fix" this by re-linking
or recreating the project.

## Current priority (per README's "What's left")

1. Deploy the backend (functions + secrets)
2. Auth
3. Real-user beta of Together
4. AI model evals
5. Web polish
