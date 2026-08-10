import { TAGS, type Tag } from './taste/tags';
import type { Place } from './places';

/**
 * How explicit signals teach the taste profile. Ratings and saves are stronger,
 * more deliberate signals than a single question, so they nudge the tags a
 * place actually has — pulling the profile toward places you love and away from
 * ones you didn't.
 */

/** Merge helper. */
function add(into: Partial<Record<Tag, number>>, tag: Tag, delta: number) {
  into[tag] = (into[tag] ?? 0) + delta;
}

/**
 * Rating → deltas over the place's tags. 5★ pushes its tags up, 1★ down, 3★ is
 * roughly neutral. Kept small per-tag since a place carries several.
 */
export function ratingDeltas(place: Place, stars: number): Partial<Record<Tag, number>> {
  const signed = (stars - 3) / 2; // 5→+1, 1→-1
  const per = signed * 0.14;
  const out: Partial<Record<Tag, number>> = {};
  if (per !== 0) for (const t of place.tags) add(out, t, per);
  return out;
}

/** A save is a mild positive signal on the place's defining tags. */
export function saveDeltas(place: Place): Partial<Record<Tag, number>> {
  const out: Partial<Record<Tag, number>> = {};
  for (const t of place.tags) add(out, t, 0.05);
  return out;
}

/** Spec answers on the Rate screen that correspond to a taste tag. */
const SPEC_TAG: Record<string, Partial<Record<string, Tag>>> = {
  Noise: { Quiet: TAGS.quiet, Loud: TAGS.lively },
  Outlets: { Plenty: TAGS.outlets },
  Lighting: { Bright: TAGS.bright, Dim: TAGS.moody },
};

/**
 * Spec picks → small deltas. Reflects what the *user* valued about the visit
 * (e.g. tagging it "Quiet" reinforces they seek quiet), independent of stars.
 */
export function specDeltas(picks: Record<string, string>): Partial<Record<Tag, number>> {
  const out: Partial<Record<Tag, number>> = {};
  for (const [label, value] of Object.entries(picks)) {
    const tag = SPEC_TAG[label]?.[value];
    if (tag) add(out, tag, 0.1);
  }
  return out;
}
