import type { TasteProfile } from '../taste/profile';

/**
 * The "Together" (group planning) domain — a *hop*: one person starts it, the
 * table joins, everyone answers privately, then swipes a shared shortlist until
 * a place clears the whole group. Lives in `core/` so a future web build and the
 * Supabase realtime layer share the exact same model.
 *
 * The whole flow runs **keyless** on simulated friends (see `bots.ts`); when
 * Supabase is connected the same shapes flow over realtime instead (see
 * `sync.ts`).
 */

/** Where a hop is in its lifecycle. Drives which screen the group sees. */
export type HopStatus =
  | 'lobby' // gathering the table
  | 'answering' // everyone answering privately
  | 'swiping' // swiping the shared shortlist
  | 'picked' // a place cleared the group
  | 'planned'; // a time is locked in

/** A member's raw picks from the 6 unified food questions (invite → questions step). */
export type HopFoodAnswers = {
  cuisines: string[];
  vibe: string;
  dietary: string[];
  price: 1 | 2 | 3 | 4;
  adventurous: 'adventurous' | 'familiar';
  distance: 'close' | 'nearby' | 'anywhere';
};

/** One person at the table. "you" is this device; friends are bots (keyless) or real joiners. */
export type HopMember = {
  id: string;
  name: string;
  /** 'you' = the device owner (the one member whose swipes are live). */
  kind: 'you' | 'friend';
  /** avatar seed — a single emoji, kept deterministic per member. */
  emoji: string;
  /** finished the private answer flow. */
  answered: boolean;
  /**
   * This member's taste for *this outing*. For "you" it starts as a copy of your
   * global profile and the private answers nudge it (tonight's mood ≠ your usual),
   * so a hop never pollutes your real taste. Friends carry seeded profiles.
   */
  profile: TasteProfile;
  /** raw picks from the 6 unified food questions, kept separate from the derived `profile` deltas. */
  hopAnswers?: HopFoodAnswers;
  /** this member's own highest-liked shortlist place, once they've swiped. */
  topSwipeId?: string | null;
  /** placeId → liked (true) / passed (false), filled as they swipe. */
  swipes: Record<string, boolean>;
  /** finished swiping the whole shortlist. */
  swipedDone: boolean;
};

/** A proposed time for the outing (the light "Group Plan" step). */
export type TimeSlot = {
  id: string;
  /** short label for the chip, e.g. "Tonight". */
  day: string;
  /** e.g. "7:00". */
  time: string;
};

/** The shared, evolving state of one group outing. */
export type Hop = {
  id: string;
  /** short human code for the no-account Join flow, e.g. "HOP-4KQ". */
  code: string;
  title: string;
  createdAt: number;
  status: HopStatus;
  /** member id of the host (the device that started it). */
  hostId: string;
  members: HopMember[];
  /** place ids in the swipe deck, best group-fit first. */
  shortlist: string[];
  /** the winning place id once the group has swiped. */
  pickId: string | null;
  /** the locked time slot id, once chosen. */
  slotId: string | null;
  /** slotId → member ids who voted for it. */
  slotVotes: Record<string, string[]>;

  // --- Additive fields below: written only by the Plan-Together wizard's
  // `commitToHop()` (see `plan-store.ts`), via `store.ts`'s own `setPlanDetails`
  // action. The code-invite lobby path (`hop/*.tsx`) never populates these —
  // they extend the `planned` status's payload rather than replacing `slotId`/
  // `slotVotes`, which stay the mechanism that actually drives lobby→…→planned.
  /** wizard-chosen ISO date, e.g. '2026-08-20' — richer than the fixed TIME_SLOTS. */
  planDate?: string | null;
  /** wizard-chosen time, e.g. '19:30'. */
  planTime?: string | null;
  reserveDetails?: PlanReserveDetails | null;
  preorderDetails?: PlanPreorderDetails | null;
};

/**
 * Additive: the Plan-Together wizard's richer "reserve" step payload. Mirrors
 * `plan-store.ts`'s `PlanReserveDetails` shape (declared here, canonically, so
 * `Hop` can reference it without a circular import — `plan-store.ts` re-exports
 * it). The code-invite lobby path (`hop/*.tsx`) never sets this.
 */
export type PlanReserveDetails = {
  partySize: number;
  notes?: string;
  /** reservations aren't wired to a real provider this pass */
  status: 'not_requested' | 'requested' | 'coming_soon';
};

/** Additive: the Plan-Together wizard's "pre-order" step payload. */
export type PlanPreorderDetails = {
  itemIds: string[];
  notes?: string;
};

/** Per-place swipe tally used to reveal the Group Pick. */
export type PickTally = {
  placeId: string;
  /** how many members liked it. */
  likes: number;
  /** members who liked it. */
  likedBy: string[];
  /** 0..1 group taste fit, for tie-breaks and the "why". */
  groupScore: number;
  /** true if every member liked it — a clean sweep. */
  unanimous: boolean;
};
