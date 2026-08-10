import { tasteFit } from '../taste/profile';
import type { Tag } from '../taste/tags';
import { haversineMiles } from '../engine/rules';
import type { Coords } from '../engine/types';
import type { Place } from '../places';
import { QUESTIONS, type Question } from '../questions';
import type { Hop, HopMember, PickTally, TimeSlot } from './types';

const MAX_MILES = 3;

/** The private-answer flow for a hop: a quick 3-question read on tonight's mood. */
export const HOP_QUESTION_IDS = ['mood', 'purpose', 'budget'] as const;
export const hopQuestions = (): Question[] =>
  HOP_QUESTION_IDS.map((id) => QUESTIONS.find((q) => q.id === id)!).filter(Boolean);

/** A few proposed times for the light Group Plan step. */
export const TIME_SLOTS: TimeSlot[] = [
  { id: 'tonight', day: 'Tonight', time: '7:00' },
  { id: 'tomorrow-lunch', day: 'Tomorrow', time: '12:30' },
  { id: 'tomorrow-eve', day: 'Tomorrow', time: '6:30' },
  { id: 'friday', day: 'Friday', time: '8:00' },
];

/**
 * Group taste fit for a set of place tags: reward what the table broadly likes
 * (avg) but hard-penalize anything one person would veto (min) — a place nobody
 * hates beats a place two people love and one can't stand. 0..1.
 */
export function groupFit(members: HopMember[], placeTags: Tag[]): number {
  if (members.length === 0) return 0.5;
  let sum = 0;
  let min = 1;
  for (const m of members) {
    const f = tasteFit(m.profile, placeTags);
    sum += f;
    if (f < min) min = f;
  }
  const avg = sum / members.length;
  return 0.7 * avg + 0.3 * min;
}

const groupScore = (members: HopMember[], place: Place): number =>
  groupFit(members, place.tags);

/** Deterministic swipe for a simulated friend — likes what fits their taste. */
export function botSwipe(member: HopMember, place: Place): boolean {
  return tasteFit(member.profile, place.tags) >= 0.52;
}

/**
 * Build the swipe deck: rank places by group fit (with a little proximity and
 * popularity), best first, and take the top `size`.
 */
export function groupShortlist(
  members: HopMember[],
  places: Place[],
  userCoords: Coords | null,
  size = 8,
): string[] {
  const scored = places.map((place) => {
    const g = groupScore(members, place);
    const distanceMi = userCoords ? haversineMiles(userCoords, place.coords) : null;
    const proximity =
      distanceMi == null ? 0.6 : Math.max(0, 1 - Math.min(distanceMi, MAX_MILES) / MAX_MILES);
    const score = 0.6 * g + 0.15 * proximity + 0.25 * place.popularity;
    return { id: place.id, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, size)
    .map((s) => s.id);
}

/**
 * Tally the group's swipes into a ranked list of overlaps. The Group Pick is the
 * first entry: the place the most people liked, ties broken by group fit.
 */
export function pickTallies(hop: Hop, places: Place[]): PickTally[] {
  const byId = new Map(places.map((p) => [p.id, p]));
  const voters = hop.members.length;
  const tallies: PickTally[] = [];
  for (const placeId of hop.shortlist) {
    const place = byId.get(placeId);
    if (!place) continue;
    const likedBy = hop.members.filter((m) => m.swipes[placeId] === true).map((m) => m.id);
    tallies.push({
      placeId,
      likes: likedBy.length,
      likedBy,
      groupScore: groupScore(hop.members, place),
      unanimous: voters > 0 && likedBy.length === voters,
    });
  }
  return tallies.sort((a, b) => b.likes - a.likes || b.groupScore - a.groupScore);
}

/** The winning place id, or null if nothing was liked. */
export function groupPick(hop: Hop, places: Place[]): string | null {
  const top = pickTallies(hop, places)[0];
  return top && top.likes > 0 ? top.placeId : null;
}

/**
 * Deterministic time vote for a simulated friend — spreads the table across
 * slots so the winner feels earned (hash of member+slot, biased toward earlier).
 */
export function botSlotVote(member: HopMember, slots: TimeSlot[] = TIME_SLOTS): string {
  let h = 0;
  for (const ch of member.id) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
  // bias toward the front of the list so "Tonight" tends to gather momentum
  const idx = h % Math.max(1, Math.min(slots.length, 3));
  return slots[idx].id;
}

/** The slot with the most votes, ties broken by slot order. */
export function winningSlot(hop: Hop): string | null {
  let best: string | null = null;
  let bestCount = 0;
  for (const slot of TIME_SLOTS) {
    const count = hop.slotVotes[slot.id]?.length ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = slot.id;
    }
  }
  return best;
}
