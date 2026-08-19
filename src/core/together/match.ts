import { tasteFit } from '../taste/profile';
import { TAGS, type Tag } from '../taste/tags';
import { haversineMiles } from '../engine/rules';
import type { Coords } from '../engine/types';
import { isHiddenGem, type Place } from '../places';
import type { Dietary } from '../menu/types';
import { QUESTIONS, type Question } from '../questions';
import type { Hop, HopFoodAnswers, HopMember, PickTally, TimeSlot } from './types';

const MAX_MILES = 3;

/** How far the distance-willingness answer widens the search radius. */
const MAX_MILES_FOR_DISTANCE: Record<HopFoodAnswers['distance'], number> = {
  close: 1.5,
  nearby: 3,
  anywhere: 8,
};

/**
 * How well a place fits one member's 6 food-question answers, 0..1. Blended
 * into `groupShortlist` alongside `groupFit` (multi-member taste) — this is
 * the single-member "what did you actually ask for tonight" signal.
 */
export function foodFit(answers: HopFoodAnswers, place: Place): number {
  let score = 0;
  let weight = 0;

  if (answers.cuisines.length > 0) {
    const placeCuisines = (place.cuisine ?? []).map((c) => c.toLowerCase());
    const wanted = answers.cuisines.map((c) => c.toLowerCase());
    score += placeCuisines.some((c) => wanted.includes(c)) ? 1 : 0.3;
    weight += 1;
  }

  if (answers.dietary.length > 0) {
    const friendly = place.dietaryFriendly ?? [];
    const covered = answers.dietary.filter((d) => friendly.includes(d as Dietary)).length;
    score += covered / answers.dietary.length;
    weight += 1;
  }

  score += Math.max(0, 1 - Math.abs(answers.price - place.price) / 3);
  weight += 1;

  score += answers.adventurous === 'adventurous'
    ? (isHiddenGem(place) ? 1 : 1 - place.popularity)
    : place.popularity;
  weight += 1;

  return weight > 0 ? score / weight : 0.5;
}

/** Vibe-question picks nudge the same shared tag vocabulary the rest of taste uses. */
const VIBE_TAGS: Record<string, Tag[]> = {
  lively: [TAGS.lively, TAGS.group],
  cozy: [TAGS.comfy, TAGS.moody],
  quiet: [TAGS.quiet, TAGS.study],
};

/**
 * Weight-delta nudges from the vibe + price picks only — cuisine/dietary/
 * adventurous/distance stay in `HopFoodAnswers` for candidate filtering via
 * `foodFit`, since no existing tag maps to them.
 */
export function foodAnswerDeltas(answers: HopFoodAnswers): Partial<Record<Tag, number>> {
  const deltas: Partial<Record<Tag, number>> = {};
  for (const t of VIBE_TAGS[answers.vibe] ?? []) deltas[t] = 0.3;
  if (answers.price <= 2) deltas[TAGS.cheap] = (deltas[TAGS.cheap] ?? 0) + 0.25;
  else deltas[TAGS.splurge] = (deltas[TAGS.splurge] ?? 0) + 0.25;
  return deltas;
}

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

export type ShortlistOptions = {
  /** candidate pool size — 4-6 for the redesigned swipe deck (default 6) */
  size?: number;
  /** the host's own 6 food-question picks, blended in as `foodFit` */
  foodAnswers?: HopFoodAnswers | null;
  /** a place to boost into the pool (from Detail's "Plan with friends" CTA) without narrowing to it */
  boostPlaceId?: string | null;
};

/**
 * Build the swipe deck: rank places by group fit + food-question fit (with a
 * little proximity and popularity), best first, and take the top `size`. A
 * `boostPlaceId` is nudged to the front rather than narrowing the pool to it.
 */
export function groupShortlist(
  members: HopMember[],
  places: Place[],
  userCoords: Coords | null,
  opts: ShortlistOptions = {},
): string[] {
  const { size = 6, foodAnswers, boostPlaceId } = opts;
  const maxMiles = foodAnswers ? MAX_MILES_FOR_DISTANCE[foodAnswers.distance] : MAX_MILES;
  const scored = places.map((place) => {
    const g = groupScore(members, place);
    const f = foodAnswers ? foodFit(foodAnswers, place) : 0.5;
    const distanceMi = userCoords ? haversineMiles(userCoords, place.coords) : null;
    const proximity =
      distanceMi == null ? 0.6 : Math.max(0, 1 - Math.min(distanceMi, maxMiles) / maxMiles);
    let score = 0.45 * g + 0.25 * f + 0.1 * proximity + 0.2 * place.popularity;
    if (boostPlaceId && place.id === boostPlaceId) score += 0.5;
    return { id: place.id, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, size)
    .map((s) => s.id);
}

/**
 * One member's own top pick among a candidate pool: their highest-liked
 * swipe if they've swiped, else their best-scored candidate. Used by the
 * results screen to show "each person's own top pick" (not group overlap).
 */
export function topPickFor(member: HopMember, places: Place[]): string | null {
  const byId = new Map(places.map((p) => [p.id, p]));
  const likedIds = Object.entries(member.swipes)
    .filter(([, liked]) => liked)
    .map(([id]) => id)
    .map((id) => byId.get(id))
    .filter((p): p is Place => !!p);
  const pool = likedIds.length > 0 ? likedIds : places;
  return pool.slice().sort((a, b) => tasteFit(member.profile, b.tags) - tasteFit(member.profile, a.tags))[0]?.id ?? null;
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
