# Hoppr Redesign — Coordination Spec

## 1. Purpose & scope

This folder coordinates the phased redesign of Hoppr's mobile UI to match
the Claude Design prototype (`Hoppr App Prototype.dc.html`, project
`bb5458c3-5559-4865-95db-e247d2c1e01a`). Full plan and rationale:
`/Users/victoriangannguyen/.claude/plans/use-the-claude-design-mcp-misty-hollerith.md`.
Delivery is phased with a user checkpoint after each phase — see that plan's
§4 for the phase list. This doc is the shared reference every subagent reads
before writing code, and updates as decisions get made.

## 2. Non-negotiable invariants

From `src/core/together/AGENTS.md` (unchanged by this redesign):
- Hop state machine `lobby → answering → swiping → picked → planned` lives
  only in `src/core/together/store.ts`. Don't skip states from UI code.
- A hop's private per-session taste copy (`HopMember.profile`) must never
  write back to the global `src/core/taste/store.ts`.
- `src/core/together/match.ts` scoring stays deterministic — never AI-driven.

Redesign-specific:
- Route names come from `SCREEN_MAP.md` — don't invent alternates.
- Icons come from `src/theme/icons.tsx` — don't hand-roll SVGs per screen.
- Tokens come from `src/theme/tokens.ts` — don't hardcode hex values in
  screen files.
- Only the integration owner touches `src/app/_layout.tsx`,
  `src/app/index.tsx`, `src/components/GlobalTabBar.tsx`, and the `(tabs)`
  route group — screen-group agents work around these, not in them.

## 3. Design tokens reference

Import names, not raw hex, in screen code. See `src/theme/tokens.ts` for the
authoritative values (already extended with the design's palette — same
accent `#c8431c`, ink+alpha convention, and cream surfaces as before this
redesign). New additions for this pass:
- `gradientPlaceholders: ReadonlyArray<{ from: string; to: string }>` — 4
  pairs (`#e2c9a6/#9c320f`, `#d9b48a/#c8431c`, `#c9b79a/#8a5a2b`,
  `#d9c4a0/#6f4a24`), the universal "no photo" fallback set used by
  `PlaceImage`/`StripePlaceholder`. Cycle through by index, don't always use
  index 0.
- `colors.mapPin: '#2a6df4'` — one-off "you are here" map pin blue.
- `radius.sheet: 28` — bottom sheets, distinct from `radius.xxl` (20).

Fonts unchanged: Instrument Serif (headlines), DM Sans (UI/body — 700 weight
already loaded as `fonts.sansBold` for header wordmark/streak-pill
emphasis), JetBrains Mono (small eyebrow labels) — see `src/theme/fonts.ts`.

Icons: `src/theme/icons.tsx`, one named export per icon, contract
`type IconProps = { size?: number; color?: string; filled?: boolean }`.
Built this pass: `HomeIcon`, `ExploreIcon`, `SavedIcon` (supports
`filled`), `TogetherIcon` (stroke-only two-people glyph, never fills),
`ProfileIcon`, `ChevronBackIcon`, `BellIcon`, `StreakFlagIcon`. Screen-group
agents add further icons to this same file using this pattern — don't
hand-roll SVGs per screen.

## 4. Navigation model

Expo Router file-based routing for every screen with a stable identity.
Two flows get a dedicated Zustand store for shared step-state (mirroring the
existing `together/store.ts` precedent), while each step still gets its own
route:
- **Onboarding** — `src/core/onboarding/store.ts`, 15 routes under
  `src/app/onboarding/*.tsx`. Built this pass (types + working
  `setField`/`markComplete`, `persist` + AsyncStorage, matching
  `taste/store.ts`'s pattern):
  ```ts
  type OnboardingFields = {
    hasOnboarded: boolean;
    name: string;
    energy: string[];
    interests: string[];
    budget: string;
    crew: string;
    when: string;
    thisOrThat: Record<string, string>;
    dietary: string[];
    distance: string;
    tasteSwipes: Array<{ cardId: string; liked: boolean }>;
    dob?: string;
    photoUri?: string;
  };
  // + setField<K>(key: K, value: OnboardingFields[K]) => void
  // + markComplete: () => void
  ```
  Values are raw onboarding-choice ids (strings/arrays); the Onboarding
  screen-group agent maps them onto `src/core/taste/tags.ts` vocabulary
  per SPEC §8 — this store doesn't depend on that vocabulary directly.
- **Plan-Together wizard** — `src/core/together/plan-store.ts` (new sibling
  file to `together/store.ts`, not persisted — wizard restarts if the app is
  killed mid-flow), 8 routes under `src/app/together/plan/*.tsx`. Entry
  contract: `?fromPlace=<id>` param (prefilled path, skips quiz+matches) vs.
  no param (blank path from Explore, includes quiz+matches) — frozen so
  Detail and Together agents can build against it independently. Types +
  skeleton built this pass:
  ```ts
  type PlanInvitee = { id: string; name: string; source: 'bot' | 'contact' | 'code' };
  type PlanReserveDetails = { partySize: number; notes?: string; status: 'not_requested' | 'requested' | 'coming_soon' };
  type PlanPreorderDetails = { itemIds: string[]; notes?: string };
  type PlanState = {
    fromPlace: string | null;
    invitees: PlanInvitee[];
    date: string | null; // ISO date, e.g. '2026-08-20'
    time: string | null; // e.g. '19:30'
    reserve: PlanReserveDetails | null;
    preorder: PlanPreorderDetails | null;
    setFromPlace, addInvitee, removeInvitee, setDateTime, setReserve, setPreorder, reset
  };
  ```
  Full commit-into-`Hop` logic on wizard completion is the Together
  screen-group agent's job (Phase 2) — this store never writes into
  `together/store.ts` itself.

Store contracts (fields/types) are frozen here before full logic lands —
see `SCREEN_MAP.md` for the screen-key → route table.

## 5. Shared component contracts

- `AppHeader` (`src/components/AppHeader.tsx`): `{ variant: 'root'|'sub';
  title?: string; onBack?: () => void; showProfileDot?: boolean;
  showBell?: boolean; streak?: number; right?: ReactNode }`.
- `GlobalTabBar` (`src/components/GlobalTabBar.tsx`): consumer contract
  unchanged (mounted once at root); internals rewritten for the new 5 tabs
  (home/explore/saved/together/profile).
- `ChoiceTile` / `ChoicePill` / `ChoiceRow`
  (`src/components/onboarding/*.tsx`): shared selectable-option primitives,
  `multi: boolean` prop, implement the selection convention in §7.
- `CategoryPills` (`src/components/explore/CategoryPills.tsx`): controlled
  `{ categories: string[]; active: string; onSelect }`.
- Existing reused as-is: `Card`, `Kicker`, `PillButton`, `ProgressDots`,
  `Screen`, `StripePlaceholder`, `Text` (`src/components/ui/`).

## 6. Together/Tickets reconciliation

Together's main screen (`together.tsx`) keeps its existing intro/ResumeHub
as the primary view, and gains a persistent "Your tickets" entry card
(shown whenever the user has any upcoming RSVP/ticket) → new
`src/app/together/tickets.tsx`. The design's "Plan with Maya" demo shortcut
becomes that sub-screen's empty-state nudge. Tickets is a record of past/
upcoming plans, not a peer tab — it was folded into the Together tab slot
per the user's explicit decision to swap the design's Tickets tab for
Together.

## 7. Onboarding interactive-selection convention

Filled accent background (`colors.accent`) + white text, OR `1.5px` solid
`colors.accent` border = selected. White/outline (`colors.card` bg,
`colors.ink14` border) = unselected. Use `ChoiceTile` for grid tiles (energy
picker), `ChoicePill` for wrapped pill lists (interests, dietary),
`ChoiceRow` for stacked list rows (budget, crew, when). Most onboarding
choice screens in the design source have no real click handlers (static
mockup only) — these three components are what makes them genuinely
interactive.

## 8. Open items / explicit gaps (decisions already made — don't re-derive)

- **Together tab icon**: stroke-based two-people glyph, matches the other 4
  icons' line weight (not filled — only Saved fills on active). Implemented
  as `TogetherIcon` in `src/theme/icons.tsx` — two overlapping stroke
  circles (front person `r=3.25` at `cx=9`, back person `r=2.75` at
  `cx=15.5`) plus two shoulder-arc paths, `strokeWidth={2}` matching Home/
  Explore/Saved. Used by `GlobalTabBar.tsx`; never renders filled, even
  active, per this decision.
- **`ob-taste` swipe calibration**: real 3-card sequence, genuine like/pass
  branching, static seed data (not a live engine call).
- **Onboarding → taste profile**: yes, map `ob-energy`/`ob-interests`/
  `ob-budget`/`ob-dietary` onto existing `src/core/taste/tags.ts` vocabulary.
  Implemented: the mapping is applied once, at the terminal `ob-account`
  step (not per-screen) via `buildTasteDeltas()` + `useTaste().reinforce()`,
  right before `markComplete()`. Kept per-screen stores decoupled from
  `core/taste` until the end. `dietary` is intentionally **not** mapped —
  it's food-restriction metadata, not a taste-vibe tag, and doesn't fit
  `TAGS`. A few raw choices also have no clean tag ("active"/"exploring"
  energy, "comfortable" budget) and are left unmapped rather than forced.
- **Dead-CTA dispositions**: see the full table in the plan file §5.7 —
  highlights: Deck pass/bookmark + Detail bookmark → wire to
  `library/store.ts`; "Reserve a table" → explicit "coming soon" state, not
  silently dead; Chat composer → made functional via existing sync layer;
  Group-vote buttons → wire to existing deterministic `match.ts`.
- **Imagery**: no real photo pipeline this pass — `gradientPlaceholders`
  token set is the universal "no photo" fallback via `PlaceImage`/
  `StripePlaceholder`.
- **No error/loading/empty states** in the source design except one nudge
  on Tickets — real screens need real states, use judgment per screen.

## 9. Per-slice task breakdown

See `TASKS.md` for the live task board.
