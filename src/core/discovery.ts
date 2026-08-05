import { useMemo } from 'react';
import { engine, type RankedPlace } from './engine';
import { useUserLocation } from './location';
import { useTaste } from './taste/store';
import { PLACES } from './places';
import { hasSignal } from './taste/profile';
import { TAGS, type Tag } from './taste/tags';

/** Ranked places for the current profile + location. Recomputes reactively. */
export function useRanked() {
  const profile = useTaste((s) => s.profile);
  const { coords, precise, status } = useUserLocation();

  const ranked = useMemo(
    () => engine.rankPlaces({ profile, places: PLACES, userCoords: coords, askedIds: [] }),
    [profile, coords],
  );

  return { ranked, precise, locationStatus: status, learned: hasSignal(profile) };
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

  return rows;
}

/** Format a distance for the mono meta line. */
export function fmtDistance(mi: number | null): string {
  if (mi == null) return '';
  return `${mi < 0.1 ? '0.1' : mi.toFixed(1)} mi`;
}
