# Hoppr Product

## Problem

Hoppr is for "when you don't know where to go" — not for someone who already
knows what they're searching for. A mascot asks rolling questions and
suggests places that learn the user's taste over time.

## Product principle

Google Maps: "I know what I'm looking for."
Hoppr: "I don't know what I want. Help me decide."

Every feature should reduce decision overload, not add another search box.

## Core loop

Ask (rolling questions) → learn taste (tag weights) → rank places → user
saves/rates/picks → taste updates → better next ranking.

## Feature areas (as built, see `docs/CURRENT_STATE.md` for status)

### Ask / Discover
Rolling questions (`src/core/questions.ts`, `RulesEngine.nextQuestion`) pick
whichever question's tags the profile knows least about, so each answer
narrows the biggest unknown. Discover ranks all seed/live places by
`tasteFit` + proximity + popularity (`src/core/engine/rules.ts`).

### Chat
`src/app/chat.tsx` runs on the same engine + taste store as Ask — reply chips
carry real tag deltas, free-text does best-effort keyword matching (no NLP).
Lands on a tappable top-pick card once the question bank is exhausted.

### Menu chooser
Snap a menu photo → Claude vision extracts structured menu JSON
(`hoppr-menu`) → the taste-reactive recommender (`src/core/menu/recommend.ts`)
picks by profile (quick/cheap/splurge) + dietary limits. Works fully
keyless/offline on seed menus + manual entry.

### Together (group planning)
One person starts a *hop*, the table joins, everyone answers privately (into
a **hop-local** taste copy, never the global profile), then swipes a shared
shortlist until a place clears the group (avg fit + min-veto penalty). Ends
at group pick + light time-slot plan. Split-the-bill is explicitly out of
scope.

### Library / You
Saved places + ratings (`src/core/library/store.ts`) feed back into taste via
`src/core/feedback.ts`: saving nudges tags up, 5★ pushes a place's tags up
(1★ down), spec picks nudge matching tags.

## Out of scope (for now)

- Split-the-bill in Together
- Venue owner portal (claim/edit a listing)
- Auth / real accounts (taste is currently local-AsyncStorage only, though
  RLS policies already assume `auth.uid()`)
