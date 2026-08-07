/**
 * Persona × candidate-slate test cases for the rerank eval, built entirely
 * from Hoppr's real seed data (`src/core/places.ts`) and real taste vocabulary
 * (`src/core/taste/tags.ts`), scored through the actual `profileDigest()` used
 * in production so the digest format can never drift from what the ranker
 * really sees.
 */
import { PLACES, type Place } from '../../src/core/places';
import { profileDigest } from '../../src/core/taste/profile';
import type { TasteProfile } from '../../src/core/taste/profile';
import type { Tag } from '../../src/core/taste/tags';
import type { EvalCase, RankCandidate } from './types';

function toCandidate(place: Place): RankCandidate {
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    tags: place.tags,
    area: place.area,
    price: place.price,
    popularity: place.popularity,
  };
}

function profile(weights: Partial<Record<Tag, number>>): TasteProfile {
  return { weights, answers: [] };
}

type Persona = {
  key: string;
  digest: string;
  /** Full preference ranking (best-first) over relevant places, hand-judged from tags. */
  preferenceOrder: string[];
  unacceptable: string[];
};

const PERSONAS: Persona[] = [
  {
    key: 'quiet-study-solo',
    digest: profileDigest(
      profile({ quiet: 0.6, study: 0.5, solo: 0.4, outlets: 0.3, lively: -0.5, group: -0.2 }),
    ),
    preferenceOrder: ['stackhouse', 'otterbein', 'foldwell', 'marrow', 'juniper'],
    unacceptable: ['emberline', 'cadence', 'halyard', 'perch'],
  },
  {
    key: 'lively-drinks-group',
    digest: profileDigest(
      profile({ lively: 0.6, drinks: 0.5, group: 0.4, hangout: 0.3, quiet: -0.5 }),
    ),
    preferenceOrder: ['emberline', 'cadence', 'halyard', 'perch', 'salt'],
    unacceptable: ['stackhouse', 'otterbein', 'foldwell'],
  },
  {
    key: 'budget-coffee-quick',
    digest: profileDigest(profile({ coffee: 0.5, cheap: 0.6, quick: 0.4, splurge: -0.5 })),
    preferenceOrder: ['grainhaus', 'stackhouse', 'westerly', 'otterbein'],
    unacceptable: ['juniper', 'salt', 'halyard'],
  },
  {
    key: 'splurge-photo-moody',
    digest: profileDigest(profile({ splurge: 0.6, photo: 0.5, moody: 0.4, cheap: -0.5 })),
    preferenceOrder: ['salt', 'juniper', 'perch', 'lumen'],
    unacceptable: ['grainhaus', 'stackhouse', 'westerly'],
  },
  {
    key: 'cold-start',
    digest: profileDigest(profile({})),
    // No taste signal — proxy "ideal" is popularity, same as the rules baseline
    // this persona would fall back to. No unacceptable set: nothing to dislike yet.
    preferenceOrder: ['otterbein', 'halyard', 'emberline', 'grainhaus'],
    unacceptable: [],
  },
  {
    key: 'contradictory-signal',
    digest: profileDigest(
      profile({ quiet: 0.4, lively: 0.35, comfy: 0.3, group: 0.3, solo: 0.25 }),
    ),
    // Deliberately mixed signal — no unacceptable set, since nothing is a clear miss.
    preferenceOrder: ['moss', 'marrow', 'cadence', 'otterbein'],
    unacceptable: [],
  },
];

function rotate<T>(arr: readonly T[], n: number): T[] {
  const k = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

/** 6 candidate-set variants per persona: rotate the slate and omit a few
 * non-essential places, always keeping every id the persona has an opinion
 * about (preferenceOrder + unacceptable) so idealTop3/unacceptableInTop5
 * stay meaningful in every variant. */
const VARIANTS: { rotateBy: number; omitCount: number }[] = [
  { rotateBy: 0, omitCount: 0 },
  { rotateBy: 2, omitCount: 1 },
  { rotateBy: 4, omitCount: 2 },
  { rotateBy: 6, omitCount: 3 },
  { rotateBy: 8, omitCount: 2 },
  { rotateBy: 10, omitCount: 4 },
];

function buildCasesForPersona(persona: Persona): EvalCase[] {
  const protectedIds = new Set([...persona.preferenceOrder, ...persona.unacceptable]);

  return VARIANTS.map(({ rotateBy, omitCount }, i) => {
    const rotated = rotate(PLACES, rotateBy);
    const droppable = rotated.filter((p) => !protectedIds.has(p.id));
    const omitIds = new Set(droppable.slice(0, omitCount).map((p) => p.id));
    const slate = rotated.filter((p) => !omitIds.has(p.id));
    const presentIds = new Set(slate.map((p) => p.id));

    const idealTop3 = persona.preferenceOrder.filter((id) => presentIds.has(id)).slice(0, 3);
    const unacceptableInTop5 = persona.unacceptable.filter((id) => presentIds.has(id));

    return {
      id: `${persona.key}-v${i}`,
      digest: persona.digest,
      candidates: slate.map(toCandidate),
      idealTop3,
      unacceptableInTop5: unacceptableInTop5.length > 0 ? unacceptableInTop5 : undefined,
    };
  });
}

export const EVAL_CASES: EvalCase[] = PERSONAS.flatMap(buildCasesForPersona);
