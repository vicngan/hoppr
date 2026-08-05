# Hoppr — Supabase backend

The app runs fully on a **local, persisted taste profile + seed places** with no
backend. Connect Supabase when you're ready to sync profiles across devices and
crowdsource places/menus.

## One-time setup

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. In the dashboard **SQL editor**, run, in order:
   - `migrations/0001_init.sql` — tables, PostGIS, RLS, the signup trigger, and
     `places_nearby()`.
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
| `seed.sql` | Starter places mirroring the local dataset |

## How the client maps on

- `src/core/supabase.ts` — the client (null until env is set).
- `src/core/session.ts` — `useSession()` (safe before setup).
- `src/core/taste/store.ts` — local taste profile; its `weights`/answers mirror
  `taste_profiles` / `questions_log` one-to-one, so syncing is a straight write.
- `places_nearby(lat, lng, radius_m)` is the candidate-generation query the
  engine will call in place of ranking the full local list.

## Next (still Slice 1 / Slice 3)

- Swap `src/core/discovery.ts` to load candidates from `places_nearby()` when
  `backendReady`, and mirror `useTaste` writes to `taste_profiles` /
  `questions_log`.
- The Claude engine (Slice 3) runs in a Supabase **Edge Function** so the API key
  never ships in the app.
