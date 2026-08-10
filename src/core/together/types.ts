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
