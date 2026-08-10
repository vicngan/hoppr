# Hoppr — Supabase backend

The app runs fully on a **local, persisted taste profile + seed places** with no
backend. Connect Supabase when you're ready to sync profiles across devices and
crowdsource places/menus.

## One-time setup

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. In the dashboard **SQL editor**, run, in order:
   - `migrations/0001_init.sql` — tables, PostGIS, RLS, the signup trigger, and
     `places_nearby()`.
   - `migrations/0002_menus.sql` — the `menu_items` table + RLS (crowdsourced menus).
   - `migrations/0003_place_photo.sql` — adds a `photo` column for venue photos.
   - `seed.sql` — the 14 starter places (same data as `src/core/places.ts`).
3. In **Project Settings → API**, copy the **Project URL** and the **anon public**
   key.
4. In the app repo, `cp .env.example .env` and paste them in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-REF.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
5. Restart Expo (`npx expo start -c`). `isSupabaseConfigured` flips to true and
   `useSession()` starts tracking real auth.

## What's here

| File | Purpose |
| --- | --- |
| `migrations/0001_init.sql` | `profiles`, `taste_profiles`, `questions_log`, `places` (PostGIS), `ratings`, `place_specs`, `suggestions_log`; RLS; `places_nearby()`; auto-create profile on signup |
| `migrations/0004_together.sql` | `hops` (jsonb state snapshot), `hop_members`, `hop_answers`, `swipes`; permissive RLS; Realtime publication (Slice 5 group planning) |
| `seed.sql` | Starter places mirroring the local dataset |

## How the client maps on

- `src/core/supabase.ts` — the client (null until env is set).
- `src/core/session.ts` — `useSession()` (safe before setup).
- `src/core/taste/store.ts` — local taste profile; its `weights`/answers mirror
  `taste_profiles` / `questions_log` one-to-one, so syncing is a straight write.
- `places_nearby(lat, lng, radius_m)` is the candidate-generation query the
  engine will call in place of ranking the full local list.

## Menu OCR — `hoppr-menu` Edge Function

The "Order this" menu chooser reads photographed menus with Claude vision. That
call runs in an Edge Function so the Anthropic key never ships in the app.

```bash
supabase functions deploy hoppr-menu
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Until it's deployed, `aiAvailable()` is false and the menu screen falls back to
manual item entry. The seed dish recommender (taste-matched picks) works
regardless — the Edge Function only powers photo → item extraction.

## Google Places — `hoppr-places` Edge Function

Real nearby venues come from the Google Places API (New). The call runs in an
Edge Function so the Google key never ships in the app, and each response is
best-effort cached into the `places` table (`source = 'google'`) so the
crowdsourced dataset grows over time.

```bash
supabase functions deploy hoppr-places
supabase secrets set GOOGLE_PLACES_API_KEY=...
```

Until it's deployed, the app uses the local seed places (`src/core/places.ts`) —
the client falls back automatically, so discovery keeps working with no backend.

## Together (group planning) — `hoppr-hop` Edge Function

Slice 5 lets a table plan together: one person hosts a "hop", friends join by a
short code, everyone answers privately, then swipes a shared shortlist until a
place clears the group. Keyless it runs entirely on a local simulation (bots);
connect Supabase and the exact same store + screens run over Realtime.

The model is **host-authoritative**: the host device publishes the whole
serialized `Hop` into `hops.state`, and joiners subscribe to that row via
Supabase **Realtime** (`postgres_changes` on `public.hops`, filtered by id).
No-account friends join through the edge function using the service-role key, so
they need no auth session.

1. In the **SQL editor**, run `migrations/0004_together.sql` — the `hops`,
   `hop_members`, `hop_answers`, `swipes` tables, permissive RLS (see below), and
   the `supabase_realtime` publication for the collaborative tables.
2. Deploy the function (needs **no new secrets** — it reuses the project's
   injected `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`):

   ```bash
   supabase functions deploy hoppr-hop
   ```

Realtime must be enabled on the together tables; the migration adds them to the
`supabase_realtime` publication, so no dashboard toggling is needed.

**Security posture:** this is a shareable, no-account group session. Anyone who
knows a hop's id or join code can read+write that hop's rows — the code IS the
capability, like a shared invite link. RLS is enabled but permissive (no
`auth.uid()` checks) so friends without accounts can join. Tightenable later
(per-hop tokens / signed codes) without changing the client contract.

Until it's deployed, `isSupabaseConfigured` is false, `noopSync` stays active,
and the Together flow runs on simulated friends — the app is unaffected.

## Reasoned ranking — `hoppr-rank` Edge Function

The Discover feed's hybrid reco: the rules engine gives an instant baseline, and
when connected, Claude re-orders the top candidates and rewrites the "why you'll
like it" lines. The call runs in an Edge Function so the Anthropic key never
ships in the app.

```bash
supabase functions deploy hoppr-rank   # reuses ANTHROPIC_API_KEY (no new secret)
```

**Per-user & hallucination-safe by construction** (enforced in code, not prompt):
the function is **stateless** and receives only the caller's *own* taste digest +
candidate list, so no user's places can leak into another's ranking. Every id
Claude returns is intersected against the input candidate set — foreign or
invented ids are dropped and omitted candidates appended, so the output is a
permutation of exactly the input. `src/core/ai/rank.ts` re-checks the same
whitelist client-side (defense in depth), and `useRanked` guards a third time.
The stored `taste_profiles` table (migration `0001`) already carries RLS
(`auth.uid() = user_id`) as the account-time storage boundary.

Until it's deployed, `aiRankAvailable()` is false, the react-query re-rank never
fires, and Discover ranks purely on the rules engine — the app is unaffected.

## Next

- Mirror `useTaste` writes to `taste_profiles` / `questions_log` when accounts
  land (the table + RLS already exist in `0001`).
- Optionally load Discover candidates from `places_nearby()` when `backendReady`
  (currently the rules top-N feeds the ranker).
- Consider Claude-generated *questions* too (kept rules-based today for instant,
  keyless question flow).
