import { create } from 'zustand';
import { PLACES, type Place } from './places';

type PlacesState = {
  /** id → place, seeded with the local dataset and topped up from Google */
  byId: Record<string, Place>;
  upsertMany: (places: Place[]) => void;
};

const seed = Object.fromEntries(PLACES.map((p) => [p.id, p]));

/**
 * In-memory cache of every place the app has seen — seed data plus anything
 * fetched from Google. Detail screens read from here so a place resolves the
 * same whether it came from the seed list or a live nearby search.
 */
export const usePlacesStore = create<PlacesState>((set) => ({
  byId: seed,
  upsertMany: (places) =>
    set((s) => {
      const byId = { ...s.byId };
      for (const p of places) byId[p.id] = p;
      return { byId };
    }),
}));

/** Reactive lookup for a single place by id. */
export function usePlace(id?: string): Place | undefined {
  return usePlacesStore((s) => (id ? s.byId[id] : undefined));
}
