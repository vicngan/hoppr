import { create } from 'zustand';

import type { Coords } from '../engine/types';
import type { Place } from '../places';
import { useTogether } from './store';
import { TIME_SLOTS } from './match';
import type { HopFoodAnswers, PlanPreorderDetails, PlanReserveDetails } from './types';

/**
 * Wizard-local state for the merged Plan-Together / Join-a-hop flow
 * (`src/app/together/plan/*.tsx`). Deliberately separate from
 * `together/store.ts` — this is scratch state for the wizard; it commits
 * into a real `Hop` (via that store) only once the wizard finishes, through
 * `commitToHop()` below.
 *
 * Not persisted: if the app is killed mid-wizard the flow restarts.
 *
 * `fromPlace` (set via Detail's "Plan with friends" CTA, `?fromPlace=<id>`)
 * is a *boost* signal now, not a skip: it guarantees that place is seeded
 * into the swipe candidate pool `matches.tsx` builds, but every entry
 * (blank or prefilled) always goes through the same invite → 6 questions →
 * swipe → datetime → results steps.
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
  /** place id boosted into the swipe candidate pool, if entered from Detail's "Plan with friends" CTA */
  fromPlace: string | null;
  invitees: PlanInvitee[];
  /** shareable demo code shown on the invite screen (cosmetic — no live backend to join into) */
  code: string;
  /** the host's own 6 food-question picks */
  hopAnswers: HopFoodAnswers | null;
  /** the shared swipe candidate pool (4-6 place ids), fixed once matches.tsx builds it */
  candidateIds: string[];
  /** the host's own placeId → liked swipes, filled in on matches.tsx */
  swipes: Record<string, boolean>;
  /** ISO date string, e.g. '2026-08-20' */
  date: string | null;
  /** e.g. '19:30' */
  time: string | null;
  reserve: PlanReserveDetails | null;
  preorder: PlanPreorderDetails | null;

  setHopAnswers: (answers: HopFoodAnswers) => void;
  setCandidateIds: (ids: string[]) => void;
  setSwipe: (placeId: string, liked: boolean) => void;
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
   *   2. `invite(botId)` for every bot invitee (contact/code invitees are
   *      seeded as lightweight bots too — see `invite.tsx`).
   *   3. `beginAnswers()` — lobby → answering.
   *   4. `finishAnswering(places, coords)` — answering → swiping, over the
   *      real `candidateIds` pool (4-6 places, boosted by `fromPlace` when
   *      present — see `matches.tsx`), not narrowed to one.
   *   5. Replays the host's real per-place swipes (`swipes`) via `swipe()`,
   *      then `finishSwiping(places)` — swiping → picked, via the real tally
   *      in `pickTallies`.
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

const randCode = () => {
  const s = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `HOP-${(s + '000').slice(0, 3)}`;
};

const initial = {
  fromPlace: null,
  invitees: [],
  code: randCode(),
  hopAnswers: null,
  candidateIds: [],
  swipes: {},
  date: null,
  time: null,
  reserve: null,
  preorder: null,
} satisfies Partial<PlanState>;

export const usePlanStore = create<PlanState>()((set, get) => ({
  ...initial,

  setHopAnswers: (answers) => set({ hopAnswers: answers }),
  setCandidateIds: (ids) => set({ candidateIds: ids }),
  setSwipe: (placeId, liked) => set((s) => ({ swipes: { ...s.swipes, [placeId]: liked } })),
  setFromPlace: (placeId) => set({ fromPlace: placeId }),
  addInvitee: (invitee) =>
    set((s) => (s.invitees.some((i) => i.id === invitee.id) ? s : { invitees: [...s.invitees, invitee] })),
  removeInvitee: (id) => set((s) => ({ invitees: s.invitees.filter((i) => i.id !== id) })),
  setDateTime: (date, time) => set({ date, time }),
  setReserve: (reserve) => set({ reserve }),
  setPreorder: (preorder) => set({ preorder }),
  reset: () => set({ ...initial, code: randCode() }),

  commitToHop: (allPlaces, userCoords) => {
    const s = get();
    const together = useTogether.getState();

    if (!together.hop) {
      const place = s.fromPlace ? allPlaces.find((p) => p.id === s.fromPlace) : undefined;
      together.startHop(place ? `Plan for ${place.name}` : 'Plan together');
    }

    for (const inv of s.invitees) {
      if (inv.source === 'bot') together.invite(inv.id);
      else together.inviteContact(inv.id, inv.name);
    }

    if (useTogether.getState().hop?.status === 'lobby') {
      together.beginAnswers();
    }

    // The real swipe candidate pool matches.tsx already built (4-6 places,
    // boosted by fromPlace) — not narrowed to one, so finishAnswering's
    // internal groupShortlist just re-confirms this exact set.
    const candidates = s.candidateIds.length
      ? allPlaces.filter((p) => s.candidateIds.includes(p.id))
      : s.fromPlace
        ? allPlaces.filter((p) => p.id === s.fromPlace)
        : allPlaces;

    if (useTogether.getState().hop?.status === 'answering') {
      together.finishAnswering(candidates, userCoords);
    }

    if (useTogether.getState().hop?.status === 'swiping') {
      for (const [placeId, liked] of Object.entries(s.swipes)) {
        together.swipe(placeId, liked);
      }
      together.finishSwiping(candidates);
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
