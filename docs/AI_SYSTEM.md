# Hoppr AI System

## Philosophy

Models provide judgment (ordering, extraction, explanation). Code provides
truth (scores, distances, ids). Never let a model generate a number the app
treats as authoritative, and never let a client hold a provider key — every
call goes through a Supabase Edge Function in `supabase/functions/`.

Every AI-touching feature must keep working with zero secrets configured
(seed data / rules-only fallback). This is load-bearing for local dev and
demos.

## Edge Functions

| Function | Purpose | Model | Fallback when unconfigured |
|---|---|---|---|
| `hoppr-rank` | Re-order + explain the rules engine's top Discover candidates | `claude-sonnet-5` | Rules ordering (`RulesEngine.rankPlaces`) |
| `hoppr-menu` | Menu photo → structured menu JSON (vision) | Claude vision | Seed menus + manual entry |
| `hoppr-questions` | AI-generated Ask questions | Claude | Static question bank (`src/core/questions.ts`) |
| `hoppr-hop` | Together server-side logic | — | Simulated bots (`together/bots.ts`) |
| `hoppr-places` | Google Places `searchNearby` + upsert | (Google, not Claude) | 14 seed places |

All Claude Edge Functions currently target model id `claude-sonnet-5`
(`hoppr-rank/index.ts`). Both `hoppr-rank` and `hoppr-menu` reuse the single
`ANTHROPIC_API_KEY` secret — no per-function keys.

## Reranking contract (`hoppr-rank`)

Request:
```ts
{ digest: string; candidates: Candidate[] } // capped at 30 candidates
```

Response (via Anthropic structured outputs / `output_config.json_schema`):
```ts
{ ranked: { id: string; reason: string }[] }
```

### Invariants, enforced in code (not the prompt)

- `ranked` ids are intersected against the input candidate id set — any
  foreign/hallucinated/cross-tenant id is dropped silently.
- Duplicate ids are deduped (first occurrence wins).
- Any candidate Claude omits is appended at the end with an empty reason —
  the output is always a full permutation of the input, never a subset.
- Match score, distance, and popularity are never sent to or returned by the
  model — those stay rules-computed in `RulesEngine`.
- Stateless, per-request scoping: the function only ever sees the calling
  user's own digest and candidate list in that one request — no shared
  store, so no cross-user leakage is possible.
- The client (`src/core/discovery.ts`) re-validates the response as defense
  in depth even though the server already enforces the whitelist.

Any new AI-touching feature should follow the same pattern: whitelist
model-returned ids/references against a known-good input set in code, and
never trust the model for a number that must be correct.

## Menu extraction (`hoppr-menu`)

Vision call on a menu photo returns structured menu JSON. The taste-reactive
pick (`src/core/menu/recommend.ts`) that turns extracted dishes into "Hoppr's
pick" is deterministic rules — quick/cheap/splurge profile matching +
dietary-limit filtering — never model-chosen.

## Cost / model policy

Use the smallest/cheapest model that meets quality — see
`eval/rerank/` (`npm run eval:rerank`) for the reranking quality harness used
when evaluating model/prompt changes for `hoppr-rank`.

## Privacy

Never include another user's data in a single model request. `hoppr-rank`'s
stateless per-request design (no shared state to bleed from) is what makes
this a code-level guarantee rather than a policy.
