import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DistanceUnit = 'mi' | 'km';

type UnitsState = {
  unit: DistanceUnit;
  setUnit: (unit: DistanceUnit) => void;
};

/** Distance-display preference (miles vs kilometers) — read by `fmtDistance` (`discovery.ts`). */
export const useUnits = create<UnitsState>()(
  persist(
    (set) => ({
      unit: 'mi',
      setUnit: (unit) => set({ unit }),
    }),
    {
      name: 'hoppr.units.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
