# Redesign Task Board

Live status board. Each subagent updates its own row as it starts/finishes.
Owners file cross-cutting issues found during QA (Phase 4) here rather than
editing other agents' files directly.

## Phase 0 — pre-flight

- [x] Resolve uncommitted `package.json`/`package-lock.json` diff (kept
  `patch-package` + `postinstall` infra, deleted the junk DerivedData patch)
- [x] Add `react-native-svg` (via `expo install`, SDK-compatible version)
- [x] Fetch brand assets → `src/assets/brand/{hoppr-mark-v2-trimmed,hoppr-lockup-v2-trimmed}.png`
- [x] Scaffold `docs/redesign/{SPEC,SCREEN_MAP,TASKS}.md`
- [x] Confirm clean `expo start` boot (verified via `tsc --noEmit` + `expo-doctor`)

## Phase 1 — foundation (not started, awaiting Phase 0 checkpoint)

- [x] Agent A: tokens + `theme/icons.tsx` + onboarding/plan-store contracts
- [x] Agent B: `AppHeader.tsx` + rewritten `GlobalTabBar.tsx` + Together tab icon

## Phase 2 — screen groups (not started)

- [x] 1. Onboarding (15 screens + Choice* components + store)
- [x] 2. Home + Ask + Deck + Gems
- [x] 3. Explore
- [x] 4. Saved + Profile
- [x] 5. Detail/Menu — `place/[id].tsx` rebuilt (detail-food + inline
  detail-event special case, dashed "Plan this with someone" →
  `/together/plan/invite?fromPlace=<id>`, "Help me order" → `/menu/[id]`,
  sticky bookmark + "coming soon" reserve bar); `menu/[id].tsx` gained the
  `menu-entry` bottom sheet (photo/browse/describe, in-component `Modal`
  since `_layout.tsx` isn't ours to touch) and a `menu-photo` simulated-scan
  mock using real `recommend.ts` picks. No new `event/[id]` route — see
  SCREEN_MAP.md's `detail-event` row for why.
- [x] 6. Together core + Plan-Together wizard + Tickets reconciliation —
  `(tabs)/together.tsx` restyled to `AppHeader variant="root"` + "Your
  tickets" entry card (shown when the hop is `planned`); `plan-store.ts`
  filled in with real invitee/date/time/reserve/preorder actions plus
  `commitToHop()`; 8 wizard routes under `together/plan/*` (`_layout.tsx` +
  invite/waiting/quiz/matches/datetime/reserve/preorder/ticket) plus
  `together/tickets.tsx`; `hop/*.tsx` were already fully tokenized (no
  hardcoded hex) so only left functionally untouched. `Hop` gained additive
  optional fields (`planDate`, `planTime`, `reserveDetails`,
  `preorderDetails`) and `together/store.ts` gained one small new public
  action, `setPlanDetails`, so the wizard's richer planned-state payload is
  still written through the store's own API rather than reached into
  directly — see `core/together/plan-store.ts`'s `commitToHop()` doc comment
  for the exact call order.
- [x] 7. Group-vote + Chat + Notifications

## Phase 3 — retire old screens

Folded into each Phase 2 owner's package (last step), not tracked separately.
`(tabs)/ask.tsx` (superseded by `home.tsx`) was also deleted during
reconciliation below — Package 2's report didn't explicitly delete it.

## Reconciliation pass (post Phase 2, before Phase 4)

All 7 packages landed. Cross-package fixes applied directly:
- Fixed 4 leftover `/(tabs)/discover` route references (now-deleted route)
  in `rate/[id].tsx`, `place/[id].tsx`, `BackButton.tsx` → `/explore`.
- Deleted orphaned `(tabs)/ask.tsx` (superseded by `home.tsx`).
- Reconciled the streak/name inconsistency Home and Profile both flagged:
  extracted `computeStreak` into shared `src/core/library/streak.ts`, wired
  into both `home.tsx`'s header pill and `profile.tsx`'s streak card so they
  agree; wired `home.tsx`'s hero greeting to the real onboarding name.
- Added `expo-linear-gradient` (user-approved) and wired the real gradient
  into `AppHeader`'s and `GlobalTabBar`'s profile dots, replacing both
  agents' flat-color fallback.
- Full lint pass: fixed all `react/no-unescaped-entities` errors (~23
  occurrences across onboarding/together/detail screens), a real
  `react-hooks/refs` issue in `AdventureSlider.tsx` (PanResponder + ref
  pattern, scoped rule disable with rationale — known RN gesture pattern),
  a `react-hooks/purity` issue in `together/tickets.tsx` (`Date.now()` in a
  memo, scoped rule disable — no SSR in this app), and ~8 unused
  import/variable warnings.
- `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor` all clean (lint: 1
  intentional warning left, documented above).

## Phase 4 — cross-screen QA

- [x] Swept for dangling references to retired routes: `router.replace`
  calls in `chat.tsx` and all `hop/*.tsx` still pointed at the deleted
  `/(tabs)/together` — repointed to `/together`.
- [x] `home.tsx`'s `AppHeader showBell` had no `onBellPress`, so the bell was
  a dead tap target — wired to `/notifications` (per SCREEN_MAP.md).

## Phase 5 — integration

- [x] Wire `_layout.tsx` onboarding redirect gate — `index.tsx` now reads
  `useOnboarding().hasOnboarded` and redirects to `/onboarding/ob-welcome`
  or `/home`; root layout hides `GlobalTabBar` while `pathname` starts with
  `/onboarding`.
- [x] Decide on collapsing `(tabs)` route group — collapsed. `together.tsx`
  was the only real survivor in that group (home/explore/saved/profile had
  already moved to top-level routes); moved to `src/app/together/index.tsx`
  alongside the existing `together/{plan,tickets,vote}` routes, deleted
  `(tabs)/_layout.tsx` and the four already-orphaned screen files
  (`ask.tsx`/`discover.tsx`/`list.tsx`/`you.tsx`), removed the `(tabs)`
  `Stack.Screen` entry from `_layout.tsx`.
- [x] Final `git status` lane-check — clean: only intentional redesign
  adds/mods plus the now-deleted `(tabs)` group remain.
- [x] Full verification pass — `tsc --noEmit`, `expo lint` (1 pre-existing
  documented warning in `chat.tsx`), `expo-doctor` (20/20) all clean.
