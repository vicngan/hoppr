# Data Model

Schema lives in `supabase/migrations/`. The client still uses local
AsyncStorage as the "account" (taste, library) — these tables are
schema-ready for auth but not yet the live source of truth for those.

## Core relationships

```
auth.users
    └── profiles
          ├── taste_profiles     (0001)
          ├── questions_log      (0001)
          ├── ratings            (0001)
          └── suggestions_log    (0001)

places                            (0001, PostGIS location + places_nearby())
    ├── place_specs               (0001)
    ├── ratings                   (0001)
    └── menu_items                (0002)

hops                               (0004, host-authoritative state jsonb)
    ├── hop_members                (0004)
    ├── hop_answers                (0004)
    └── swipes                     (0004)
```

Migrations, in order: `0001_init` (profiles, taste_profiles, questions_log,
places + PostGIS `places_nearby()` function, ratings, place_specs,
suggestions_log, RLS), `0002_menus`, `0003_place_photo`, `0004_together`
(hops + normalized members/answers/swipes, Realtime publication),
`0005_place_rating`.

## Security

User-owned tables (`taste_profiles`, `ratings`, `questions_log`,
`suggestions_log`) have RLS policies of the form `auth.uid() = user_id`
already in place since `0001_init`, even though there is no sign-in flow
yet — implementing auth should mostly be wiring, not new policies. Never use
service-role credentials client-side; Edge Functions hold that trust
boundary.

## Geographic data

`places.location` is PostGIS. Nearby search uses the `places_nearby()`
database function (`0001_init.sql`) — don't reimplement haversine/distance
filtering in SQL application code; the client-side haversine in
`src/core/engine/rules.ts` is only for ranking already-fetched places, not
for querying.

## Together

`hops.state` is a host-authoritative jsonb blob mirroring the client's `Hop`
shape (`src/core/together/types.ts`), with `hop_members` / `hop_answers` /
`swipes` normalized alongside it for Realtime subscriptions
(`together/supabase-sync.ts`). The client's in-memory bot simulation
(`together/bots.ts`) and the Supabase-synced path share the exact same `Hop`
/ `HopMember` types — don't fork the shape when adding a synced feature.
