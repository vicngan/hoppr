import { useLocationStore, DEFAULT_CENTER } from './location-store';
import type { Coords } from './engine/types';

export { DEFAULT_CENTER };

type LocationState = {
  coords: Coords;
  /** whether coords are the user's real location vs the fallback */
  precise: boolean;
  status: 'pending' | 'granted' | 'denied';
};

/**
 * Best-effort user location for distance ranking, backed by the shared
 * `location-store`. Screens across the app share one permission request and
 * GPS fetch instead of each doing their own.
 */
export function useUserLocation(): LocationState {
  const coords = useLocationStore((s) => s.coords);
  const precise = useLocationStore((s) => s.precise);
  const status = useLocationStore((s) => s.status);
  return { coords, precise, status };
}
