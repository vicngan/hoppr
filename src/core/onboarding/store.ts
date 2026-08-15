import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Frozen field shape for the 15-screen onboarding flow (`src/app/onboarding/*.tsx`,
 * see `docs/redesign/SCREEN_MAP.md`). Each `setField` call is a screen committing
 * its answer; `markComplete` is called from the terminal `ob-account` step.
 *
 * Values are stored as loose strings/arrays here (raw onboarding-choice ids) —
 * screen-group agents map them onto `src/core/taste/tags.ts` vocabulary
 * (see SPEC.md §8) rather than this store depending on that vocabulary directly.
 */
export type OnboardingFields = {
  hasOnboarded: boolean;
  name: string;
  energy: string[];
  interests: string[];
  budget: string;
  crew: string;
  when: string;
  thisOrThat: Record<string, string>;
  dietary: string[];
  distance: string;
  tasteSwipes: { cardId: string; liked: boolean }[];
  dob?: string;
  photoUri?: string;
};

type OnboardingState = OnboardingFields & {
  setField: <K extends keyof OnboardingFields>(key: K, value: OnboardingFields[K]) => void;
  markComplete: () => void;
  hydrated: boolean;
};

const emptyFields = (): OnboardingFields => ({
  hasOnboarded: false,
  name: '',
  energy: [],
  interests: [],
  budget: '',
  crew: '',
  when: '',
  thisOrThat: {},
  dietary: [],
  distance: '',
  tasteSwipes: [],
  dob: undefined,
  photoUri: undefined,
});

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      ...emptyFields(),
      hydrated: false,
      setField: (key, value) => set((s) => ({ ...s, [key]: value })),
      markComplete: () => set({ hasOnboarded: true }),
    }),
    {
      name: 'hoppr.onboarding.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => {
        const { setField, markComplete, hydrated, ...fields } = s;
        return fields;
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
