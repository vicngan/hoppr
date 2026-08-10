import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import type { Coords } from './engine/types';

/** Fallback center (downtown Ann Arbor) when permission is denied or pending. */
export const DEFAULT_CENTER: Coords = { lat: 42.2808, lng: -83.743 };
export const DEFAULT_LABEL = 'Ann Arbor, MI';

export type SavedLocation = { id: string; label: string; coords: Coords };

type LocationMode = 'current' | { savedId: string };

type LocationState = {
  mode: LocationMode;
  savedLocations: SavedLocation[];
  coords: Coords;
  label: string;
  /** whether coords are the user's real GPS location vs a fallback */
  precise: boolean;
  status: 'pending' | 'granted' | 'denied';
  hydrated: boolean;
  /** request permission + GPS + reverse geocode, and switch to "current" mode */
  useCurrentLocation: () => Promise<void>;
  /** switch to a saved location's fixed coords */
  selectSaved: (id: string) => void;
  /** resolve whatever mode was persisted; call once after rehydration */
  initLocation: () => Promise<void>;
};

/**
 * Single source of truth for what location Discover (and everything that
 * ranks by distance) uses. Only `mode`/`savedLocations` persist — coords and
 * label are always re-derived at runtime, so "current location" mode re-fetches
 * fresh GPS and a fresh reverse-geocoded label on every app launch.
 */
export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      mode: 'current',
      savedLocations: [],
      coords: DEFAULT_CENTER,
      label: DEFAULT_LABEL,
      precise: false,
      status: 'pending',
      hydrated: false,

      useCurrentLocation: async () => {
        set({ mode: 'current', status: 'pending' });
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            set({ status: 'denied', coords: DEFAULT_CENTER, label: DEFAULT_LABEL, precise: false });
            return;
          }
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const coords: Coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          let label = DEFAULT_LABEL;
          try {
            const [place] = await Location.reverseGeocodeAsync({
              latitude: coords.lat,
              longitude: coords.lng,
            });
            const city = place?.city ?? place?.subregion;
            const region = place?.region;
            if (city && region) label = `${city}, ${region}`;
            else if (city) label = city;
          } catch {
            // keep DEFAULT_LABEL
          }
          set({ status: 'granted', coords, label, precise: true });
        } catch {
          set({ status: 'denied', coords: DEFAULT_CENTER, label: DEFAULT_LABEL, precise: false });
        }
      },

      selectSaved: (id) => {
        const loc = get().savedLocations.find((l) => l.id === id);
        if (!loc) {
          get().useCurrentLocation();
          return;
        }
        set({ mode: { savedId: id }, coords: loc.coords, label: loc.label, precise: false, status: 'granted' });
      },

      initLocation: async () => {
        const { mode, savedLocations } = get();
        if (mode !== 'current' && savedLocations.some((l) => l.id === mode.savedId)) {
          get().selectSaved(mode.savedId);
          return;
        }
        await get().useCurrentLocation();
      },
    }),
    {
      name: 'hoppr.location.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ mode: s.mode, savedLocations: s.savedLocations }) as Pick<
        LocationState,
        'mode' | 'savedLocations'
      >,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
