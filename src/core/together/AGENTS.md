# Together

Group planning ("hop") domain. See `docs/ARCHITECTURE.md` and
`docs/PRODUCT.md` for the full picture — this is just the local invariant
that's easy to break by accident.

## Critical invariant

`HopMember.profile` (in `types.ts`) starts as a **copy** of the user's global
`TasteProfile` when a hop begins. Answers given during a hop nudge that copy,
never the global `taste/store.ts` profile. A hop's private answers reflect
tonight's mood, not a permanent taste update — don't wire hop answers into
`src/core/feedback.ts` or the global taste store.

## State machine

`lobby → answering → swiping → picked → planned`, driven by `store.ts`
(Zustand). Don't skip states from UI code — transitions belong in the store.

## Keyless vs synced

`bots.ts` simulates 4 friends with fixed tastes so the whole flow works with
zero backend config. `sync.ts` is a `noopSync` by default; `supabase-sync.ts`
registers Realtime automatically once Supabase is configured
(`register-sync.ts`). Both paths share the same `Hop`/`HopMember` shapes —
don't fork them when adding a synced-only feature.

## Scoring

`match.ts` computes group fit (avg taste fit + min-veto penalty) and pick
tallies deterministically. This is not, and should not become, AI-driven —
Claude may explain a group pick but must not choose it.
