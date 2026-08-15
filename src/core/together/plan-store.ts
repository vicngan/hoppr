import { create } from 'zustand';

import type { Coords } from '../engine/types';
import type { Place } from '../places';
import type { Tag } from '../taste/tags';
import { useTogether } from './store';
import { TIME_SLOTS } from './match';
import type { PlanPreorderDetails, PlanReserveDetails } from './types';

/**
 * Wizard-local state for the Plan-Together flow (`src/app/together/plan/*.tsx`,
 * see `docs/redesign/SPEC.md` §4 and `SCREEN_MAP.md`). Deliberately separate
 * from `together/store.ts` — this is scratch state for the 8-step wizard;
 * it commits into a real `Hop` (via that store) only once the wizard
 * finishes, through `commitToHop()` below.
 *
 * Not persisted: if the app is killed mid-wizard the flow restarts, same as
 * the design's source (no resume-mid-wizard behavior specified).
 *
 * Entry contract (frozen, SPEC.md §4): `?fromPlace=<id>` param prefills
 * `fromPlace` and skips the quiz+matches steps (`plan-quiz`, `plan-matches`);
 * no param means a blank path from Explore that includes them — `matches.tsx`
 * sets `fromPlace` itself once a place is chosen via real `match.ts` scoring,
 * so by the time `commitToHop()` runs, `fromPlace` is always set.
 */

export type PlanInvitee = {
  id: string;
  name: string;
  /** bot vs a real contact/code-invite, mirrors together/bots.ts kinds loosely */
  source: 'bot' | 'contact' | 'code';
};

// Re-exported from `types.ts` (the canonical declaration, so `Hop`'s additive
// fields can reference them without importing this file) so existing callers
// of this module don't need to know that.
export type { PlanReserveDetails, PlanPreorderDetails };

export type PlanState = {
  /** place id prefilled from Detail's "Plan with friends" CTA, if entered that way */
  fromPlace: string | null;
  invitees: PlanInvitee[];
  /** ISO date string, e.g. '2026-08-20' */
  date: string | null;
  /** e.g. '19:30' */
  time: string | null;
  reserve: PlanReserveDetails | null;
  preorder: PlanPreorderDetails | null;
  /**
   * Additive, non-frozen: tag nudges from `quiz.tsx`'s 3 quick-pick questions
   * (blank path only). Not part of SPEC.md §4's frozen contract — feeds
   * `matches.tsx`'s real `match.ts` scoring so the quiz isn't cosmetic, but
   * nothing downstream depends on it being present.
   */
  quizTags: Tag[];
  setQuizTags: (tags: Tag[]) => void;

  setFromPlace: (placeId: string | null) => void;
  addInvitee: (invitee: PlanInvitee) => void;
  removeInvitee: (id: string) => void;
  setDateTime: (date: string | null, time: string | null) => void;
  setReserve: (reserve: PlanReserveDetails | null) => void;
  setPreorder: (preorder: PlanPreorderDetails | null) => void;
  reset: () => void;

  /**
   * Commit the wizard's picks into a real `Hop`, calling only `together/
   * store.ts`'s own public actions — this makes the wizard a second entry
   * path into the *same* state machine, never a fork. Idempotent-ish: safe
   * to call once at the end of `reserve.tsx`; later wizard steps
   * (preorder/ticket) layer on top via `setPlanDetails`.
   *
   * Order, all via `useTogether`'s public actions:
   *   1. `startHop()` if there's no active hop yet.
   *   2. `invite(botId)` for every bot invitee.
   *   3. `beginAnswers()` — lobby → answering.
   *   4. `finishAnswering(places, coords)` — answering → swiping. `places` is
   *      narrowed to just the chosen place (`fromPlace`) so the real
   *      `groupShortlist`/`botSwipe` machinery in `match.ts` runs over a
   *      candidate pool of one — deterministic, not fabricated, and it means
   *      the eventual `groupPick` can only land on that place.
   *   5. `swipe(fromPlace, true)` (your vote) then `finishSwiping(places)` —
   *      swiping → picked, via the real tally in `pickTallies`.
   *   6. `voteSlot(...)` + `lockSlot()` — picked → planned. The store only
   *      exposes `TIME_SLOTS`-based voting for this transition, so the wizard
   *      casts a real vote for the first slot to reach `planned` honestly;
   *      the wizard's *actual* date/time goes on top via `setPlanDetails`,
   *      which never touches `status`/`slotId` itself.
   *   7. `setPlanDetails({ planDate, planTime, reserveDetails, preorderDetails })`
   *      — merges the wizard's richer payload onto the now-`planned` hop.
   */
  commitToHop: (places: Place[], userCoords: Coords | null) => void;
};

const initial = {
  fromPlace: null,
  invitees: [],
  date: null,
  time: null,
  reserve: null,
  preorder: null,
  quizTags: [],
} satisfies Partial<PlanState>;

export const usePlanStore = create<PlanState>()((set, get) => ({
  ...initial,

  setQuizTags: (tags) => set({ quizTags: tags }),
  setFromPlace: (placeId) => set({ fromPlace: placeId }),
  addInvitee: (invitee) =>
    set((s) => (s.invitees.some((i) => i.id === invitee.id) ? s : { invitees: [...s.invitees, invitee] })),
  removeInvitee: (id) => set((s) => ({ invitees: s.invitees.filter((i) => i.id !== id) })),
  setDateTime: (date, time) => set({ date, time }),
  setReserve: (reserve) => set({ reserve }),
  setPreorder: (preorder) => set({ preorder }),
  reset: () => set(initial),

  commitToHop: (allPlaces, userCoords) => {
    const s = get();
    const together = useTogether.getState();

    if (!together.hop) {
      const place = s.fromPlace ? allPlaces.find((p) => p.id === s.fromPlace) : undefined;
      together.startHop(place ? `Plan for ${place.name}` : 'Plan together');
    }

    for (const inv of s.invitees) {
      if (inv.source === 'bot') together.invite(inv.id);
    }

    if (useTogether.getState().hop?.status === 'lobby') {
      together.beginAnswers();
    }

    // Narrow the candidate pool to the already-chosen place (fromPlace is
    // always set by this point — either the Detail CTA's param or matches.tsx's
    // real match.ts-scored selection) so the real shortlist/swipe/pick
    // machinery below can only land on it.
    const chosen = s.fromPlace ? allPlaces.filter((p) => p.id === s.fromPlace) : allPlaces;

    if (useTogether.getState().hop?.status === 'answering') {
      together.finishAnswering(chosen, userCoords);
    }

    if (useTogether.getState().hop?.status === 'swiping' && s.fromPlace) {
      together.swipe(s.fromPlace, true);
      together.finishSwiping(chosen);
    }

    if (useTogether.getState().hop?.status === 'picked') {
      const firstSlot = TIME_SLOTS[0]?.id;
      if (firstSlot) together.voteSlot(firstSlot);
      together.lockSlot();
    }

    if (useTogether.getState().hop?.status === 'planned') {
      together.setPlanDetails({
        planDate: s.date,
        planTime: s.time,
        reserveDetails: s.reserve,
        preorderDetails: s.preorder,
      });
    }
  },
}));
