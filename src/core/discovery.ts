import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { engine, type RankedPlace } from './engine';
import type { Coords } from './engine/types';
import { useUserLocation } from './location';
import { useTaste } from './taste/store';
import { usePlaces } from './places-repo';
import { hasSignal, profileDigest } from './taste/profile';
import { aiRankAvailable, aiRankPlaces } from './ai/rank';
import { aiQuestionAvailable, aiNextQuestion, type AskedContext } from './ai/questions';
import { TAGS, type Tag } from './taste/tags';
import { isHiddenGem, type Place } from './places';
import type { Question } from './questions';

/** How many top rules-candidates we hand to Claude to re-rank. */
const RERANK_N = 20;

/**
 * Ranked places for the current profile + location. The rules engine produces
 * an instant, keyless baseline (also the fallback); when a backend is connected
 * and we've learned something, Claude re-orders the top candidates and rewrites
 * the "why" lines. Only ORDER and `reason` come from Claude — `match`/`score`/
 * `distanceMi` stay rules-computed, so the model never invents confidence
 * numbers. The `RecoEngine` interface stays synchronous; all async lives here.
 */
export function useRanked() {
  const profile = useTaste((s) => s.profile);
  const { coords, precise, status } = useUserLocation();
  const { places, loading, source } = usePlaces(coords);

  // (A) synchronous rules baseline — first paint + keyless behavior, unchanged.
  const base = useMemo(
    () => engine.rankPlaces({ profile, places, userCoords: coords, askedIds: [] }),
    [profile, places, coords],
  );

  // (B) the top candidates handed to Claude, plus a stable query signature.
  const topN = useMemo(() => base.slice(0, RERANK_N), [base]);
  const digest = useMemo(() => profileDigest(profile), [profile]);
  const sig = useMemo(() => topN.map((r) => r.place.id).join(',') + '|' + digest, [topN, digest]);

  const rerank = useQuery({
    queryKey: ['rank', coords.lat.toFixed(3), coords.lng.toFixed(3), sig],
    enabled: aiRankAvailable() && hasSignal(profile) && topN.length > 1,
    staleTime: 5 * 60_000,
    queryFn: () =>
      aiRankPlaces(
        digest,
        topN.map((r) => ({
          id: r.place.id,
          name: r.place.name,
          category: r.place.category,
          tags: r.place.tags,
          area: r.place.area,
          price: r.place.price,
          popularity: r.place.popularity,
        })),
      ),
  });

  // (C) apply Claude's ordering + reasons over the rules result; on
  // loading/error/absence fall straight back to `base`. Nothing is ever dropped.
  const ranked = useMemo(() => {
    if (!rerank.data) return base;
    const byId = new Map(base.map((r) => [r.place.id, r]));
    const out: RankedPlace[] = [];
    for (const { id, reason } of rerank.data) {
      const r = byId.get(id);
      if (!r) continue; // final guard: only ids present in the baseline survive
      out.push(reason ? { ...r, reason } : r);
      byId.delete(id);
    }
    for (const r of byId.values()) out.push(r);
    return out;
  }, [base, rerank.data]);

  return {
    ranked,
    precise,
    locationStatus: status,
    learned: hasSignal(profile),
    loading,
    placesSource: source,
  };
}

/** Most-recent-first, capped — compact context so Claude avoids repeats. */
function buildAskedContext(answers: { questionId: string; optionId: string; axis?: string }[]): AskedContext[] {
  return answers
    .slice(-12)
    .reverse()
    .map((a) => ({ questionId: a.questionId, axis: a.axis, optionId: a.optionId }));
}

/**
 * The next Ask question. The rules engine is the always-available synchronous
 * baseline/fallback (identical behavior to today when AI is unavailable); when
 * a backend is connected, Claude generates a fresh question each visit so the
 * bank never permanently exhausts. Both `ask.tsx` and `chat.tsx` share this
 * hook instead of each computing `askedIds`/calling `engine.nextQuestion`
 * independently.
 */
export function useNextQuestion(places: Place[], userCoords: Coords | null) {
  const profile = useTaste((s) => s.profile);
  const lifetimeAskedIds = useMemo(() => profile.answers.map((a) => a.questionId), [profile.answers]);

  const fallback = useMemo(
    () => engine.nextQuestion({ profile, places, userCoords, askedIds: lifetimeAskedIds }),
    [profile, places, userCoords, lifetimeAskedIds],
  );

  const digest = useMemo(() => profileDigest(profile), [profile]);
  const askedContext = useMemo(() => buildAskedContext(profile.answers), [profile.answers]);

  const ai = useQuery({
    queryKey: ['nextQuestion', digest, lifetimeAskedIds.length],
    enabled: aiQuestionAvailable(),
    staleTime: 0,
    queryFn: () => aiNextQuestion(digest, askedContext, lifetimeAskedIds),
  });

  const question: Question | null = ai.data ?? fallback;
  return { question, answeredCount: new Set(lifetimeAskedIds).size };
}

/** Filter chip → the tag it narrows to (undefined = no narrowing). */
const FILTER_TAG: Record<string, Tag | undefined> = {
  'For you': undefined,
  Coffee: TAGS.coffee,
  Study: TAGS.study,
  'Light drink': TAGS.drinks,
  'Photo spots': TAGS.photo,
  'Open now': undefined,
};

export function filterRanked(ranked: RankedPlace[], filter: string): RankedPlace[] {
  const tag = FILTER_TAG[filter];
  if (!tag) return ranked;
  return ranked.filter((r) => r.place.tags.includes(tag));
}

export type DiscoverRow = { key: string; title: string; note: string; items: RankedPlace[] };

/**
 * Shape the ranked list into the design's themed rows. Rows only appear when
 * they have enough places, so the feed reflects what actually fits you.
 */
export function buildRows(ranked: RankedPlace[], learned: boolean): DiscoverRow[] {
  const rows: DiscoverRow[] = [];

  rows.push({
    key: 'foryou',
    title: learned ? 'Right now, for you' : 'A place to start',
    note: learned
      ? 'Sorted by how well they fit what you’ve told Hoppr.'
      : 'Answer a few questions and these reorder around you.',
    items: ranked.slice(0, 6),
  });

  const quiet = ranked.filter((r) => r.place.tags.includes(TAGS.quiet));
  if (quiet.length >= 3) {
    rows.push({
      key: 'quiet',
      title: 'Quiet corners',
      note: 'Low-noise rooms where nobody minds if you stay.',
      items: quiet.slice(0, 6),
    });
  }

  const louder = ranked.filter(
    (r) => r.place.tags.includes(TAGS.lively) || r.place.tags.includes(TAGS.drinks),
  );
  if (louder.length >= 3) {
    rows.push({
      key: 'louder',
      title: 'A little louder after nine',
      note: 'For when the mood tips toward people.',
      items: louder.slice(0, 6),
    });
  }

  const walk = ranked
    .filter((r) => (r.distanceMi ?? 0) > 1)
    .sort((a, b) => b.score - a.score);
  if (walk.length >= 3) {
    rows.push({
      key: 'walk',
      title: 'Worth the extra ten minutes',
      note: 'A touch farther, but they fit you.',
      items: walk.slice(0, 6),
    });
  }

  const hiddenGems = ranked.filter((r) => isHiddenGem(r.place));
  if (hiddenGems.length >= 3) {
    rows.push({
      key: 'hiddenGems',
      title: 'Hidden gems',
      note: 'Loved by the few who’ve found them.',
      items: hiddenGems.slice(0, 6),
    });
  }

  return rows;
}

/** Format a distance for the mono meta line. */
export function fmtDistance(mi: number | null): string {
  if (mi == null) return '';
  return `${mi < 0.1 ? '0.1' : mi.toFixed(1)} mi`;
}
