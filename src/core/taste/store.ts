import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { applyDeltas, applyWeightDeltas, emptyProfile, type TasteProfile } from './profile';
import type { Tag } from './tags';
import type { Question, QOption } from '../questions';

type TasteState = {
  profile: TasteProfile;
  /** record an answer → learn from it */
  answer: (q: Question, o: QOption) => void;
  /** implicit signal (rating, save) → nudge weights without logging an answer */
  reinforce: (deltas: Partial<Record<Tag, number>>) => void;
  /** wipe everything Hoppr knows */
  reset: () => void;
  /** has the profile been rehydrated from storage yet */
  hydrated: boolean;
};

/**
 * The single source of truth for what Hoppr knows about you. Persisted to
 * AsyncStorage so the profile survives reloads. Lives in `core/` so a future
 * web build shares it. In Slice 1 this is the whole "account"; Slice 1's
 * Supabase work mirrors it to `taste_profiles` once a backend is connected.
 */
export const useTaste = create<TasteState>()(
  persist(
    (set) => ({
      profile: emptyProfile(),
      hydrated: false,
      answer: (q, o) =>
        set((s) => ({
          profile: applyDeltas(s.profile, o.deltas, {
            questionId: q.id,
            optionId: o.id,
            at: Date.now(),
            axis: q.axis,
          }),
        })),
      reinforce: (deltas) => set((s) => ({ profile: applyWeightDeltas(s.profile, deltas) })),
      reset: () => set({ profile: emptyProfile() }),
    }),
    {
      name: 'hoppr.taste.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ profile: s.profile }) as Pick<TasteState, 'profile'>,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
