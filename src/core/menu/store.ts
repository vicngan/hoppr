import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SEED_MENUS } from './seed';
import { emptyFoodPrefs, type Dietary, type FoodPrefs, type MenuItem } from './types';

type MenuState = {
  /** place id → items added via photo/manual (crowdsourced over the seed) */
  added: Record<string, MenuItem[]>;
  prefs: FoodPrefs;
  addItems: (placeId: string, items: MenuItem[]) => void;
  setDiet: (diet: Dietary | null) => void;
  setNoAlcohol: (v: boolean) => void;
};

export const useMenuStore = create<MenuState>()(
  persist(
    (set) => ({
      added: {},
      prefs: emptyFoodPrefs(),
      addItems: (placeId, items) =>
        set((s) => ({
          added: { ...s.added, [placeId]: [...(s.added[placeId] ?? []), ...items] },
        })),
      setDiet: (diet) => set((s) => ({ prefs: { ...s.prefs, diet } })),
      setNoAlcohol: (noAlcohol) => set((s) => ({ prefs: { ...s.prefs, noAlcohol } })),
    }),
    { name: 'hoppr.menu.v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** Reactive merged menu for a place (seed + crowdsourced). */
export function useMenu(placeId: string): MenuItem[] {
  const added = useMenuStore((s) => s.added);
  return mergeMenu(placeId, added);
}

/** Merge seed + crowdsourced items for a place, de-duped by name. */
export function mergeMenu(placeId: string, added: Record<string, MenuItem[]>): MenuItem[] {
  const seen = new Set<string>();
  const out: MenuItem[] = [];
  for (const item of [...(SEED_MENUS[placeId] ?? []), ...(added[placeId] ?? [])]) {
    const key = item.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
