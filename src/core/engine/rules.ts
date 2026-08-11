import { tasteFit, type TasteProfile } from '../taste/profile';
import { TAGS, type Tag } from '../taste/tags';
import { QUESTIONS, type Question } from '../questions';
import type { Coords, EngineContext, RankedPlace, RecoEngine } from './types';

const MAX_MILES = 3; // beyond this, proximity contributes ~nothing

/** Great-circle distance in miles. */
export function haversineMiles(a: Coords, b: Coords): number {
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
const toRad = (d: number) => (d * Math.PI) / 180;

/** Phrases used to explain why a place fits, keyed by the strongest shared tag. */
const REASONS: Partial<Record<Tag, string>> = {
  [TAGS.quiet]: 'Quiet, the way you keep choosing.',
  [TAGS.lively]: 'Has the buzz you go looking for.',
  [TAGS.bright]: 'Big daylight and windows.',
  [TAGS.moody]: 'Low, warm light — your kind of room.',
  [TAGS.study]: 'Built for getting things done.',
  [TAGS.outlets]: 'A plug at basically every seat.',
  [TAGS.coffee]: 'The coffee is the point here.',
  [TAGS.drinks]: 'A properly good drink.',
  [TAGS.food]: 'Somewhere to actually eat.',
  [TAGS.photo]: 'Quietly the most photogenic pick.',
  [TAGS.solo]: 'Easy and unbothered on your own.',
  [TAGS.group]: 'Holds a table without the shouting.',
  [TAGS.lingering]: 'Nobody rushes you out.',
  [TAGS.comfy]: 'The kind of seat you sink into.',
  [TAGS.cheap]: 'Kind to your wallet.',
  [TAGS.splurge]: 'Worth the splurge tonight.',
};

/** The strongest tag both the profile likes and the place has. */
function reasonFor(profile: TasteProfile, tags: Tag[], fallback: string): string {
  let best: Tag | null = null;
  let bestW = 0.1; // require some conviction
  for (const t of tags) {
    const w = profile.weights[t] ?? 0;
    if (w > bestW) {
      bestW = w;
      best = t;
    }
  }
  return (best && REASONS[best]) || fallback;
}

export class RulesEngine implements RecoEngine {
  nextQuestion(ctx: EngineContext): Question | null {
    const remaining = QUESTIONS.filter((q) => !ctx.askedIds.includes(q.id));
    if (remaining.length === 0) return null;

    // Prefer the question whose tags we currently know least about (lowest
    // accumulated conviction) — i.e. reduce the biggest unknown first. Ties
    // (e.g. every question on a fresh profile, all at coverage 0) are broken
    // randomly so "start fresh" doesn't always resurface the same question.
    let candidates = [remaining[0]];
    let pickCoverage = Infinity;
    for (const q of remaining) {
      const tags = new Set<Tag>();
      for (const o of q.options) for (const t of Object.keys(o.deltas) as Tag[]) tags.add(t);
      let coverage = 0;
      for (const t of tags) coverage += Math.abs(ctx.profile.weights[t] ?? 0);
      if (coverage < pickCoverage) {
        pickCoverage = coverage;
        candidates = [q];
      } else if (coverage === pickCoverage) {
        candidates.push(q);
      }
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  rankPlaces(ctx: EngineContext): RankedPlace[] {
    const ranked = ctx.places.map((place) => {
      const fit = tasteFit(ctx.profile, place.tags); // 0..1
      const distanceMi = ctx.userCoords ? haversineMiles(ctx.userCoords, place.coords) : null;
      const proximity = distanceMi == null ? 0.6 : Math.max(0, 1 - Math.min(distanceMi, MAX_MILES) / MAX_MILES);

      const score = 0.55 * fit + 0.2 * proximity + 0.25 * place.popularity;
      const match = Math.round(60 + 38 * score); // believable 60–98 band
      return {
        place,
        match,
        score,
        distanceMi,
        reason: reasonFor(ctx.profile, place.tags, place.blurb),
      };
    });
    return ranked.sort((a, b) => b.score - a.score);
  }
}
