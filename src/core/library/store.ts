import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Place } from '../places';
import type { Tag } from '../taste/tags';
import { useTaste } from '../taste/store';
import { ratingDeltas, saveDeltas, specDeltas } from '../feedback';

export type RatingRecord = {
  stars: number;
  /** spec label → chosen value, e.g. { Noise: 'Quiet' } */
  specs: Record<string, string>;
  note?: string;
  at: number;
};

type LibraryState = {
  /** place id → true */
  saved: Record<string, true>;
  /** place id → rating */
  ratings: Record<string, RatingRecord>;
  toggleSave: (place: Place) => void;
  rate: (place: Place, stars: number, specs: Record<string, string>, note?: string) => void;
  clear: () => void;
};

function merge(...ds: Partial<Record<Tag, number>>[]): Partial<Record<Tag, number>> {
  const out: Partial<Record<Tag, number>> = {};
  for (const d of ds)
    for (const [k, v] of Object.entries(d) as [Tag, number][]) out[k] = (out[k] ?? 0) + v;
  return out;
}

/**
 * Saved places + ratings, persisted locally (the pre-backend "library"). Saving
 * and rating also teach the taste profile via `useTaste.reinforce`, so the feed
 * reacts to what you actually keep and how you rate it.
 */
export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      saved: {},
      ratings: {},

      toggleSave: (place) => {
        const isSaved = !!get().saved[place.id];
        set((s) => {
          const saved = { ...s.saved };
          if (isSaved) delete saved[place.id];
          else saved[place.id] = true;
          return { saved };
        });
        if (!isSaved) useTaste.getState().reinforce(saveDeltas(place));
      },

      rate: (place, stars, specs, note) => {
        set((s) => ({
          ratings: { ...s.ratings, [place.id]: { stars, specs, note, at: Date.now() } },
        }));
        useTaste.getState().reinforce(merge(ratingDeltas(place, stars), specDeltas(specs)));
      },

      clear: () => set({ saved: {}, ratings: {} }),
    }),
    {
      name: 'hoppr.library.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Selector helpers (used with useLibrary(...) for reactivity). */
export const selectIsSaved = (id: string) => (s: LibraryState) => !!s.saved[id];
export const selectRating = (id: string) => (s: LibraryState) => s.ratings[id];
