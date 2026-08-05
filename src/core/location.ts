import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { Coords } from './engine/types';

/** Fallback center (downtown Ann Arbor) when permission is denied or pending. */
export const DEFAULT_CENTER: Coords = { lat: 42.2808, lng: -83.743 };

type LocationState = {
  coords: Coords;
  /** whether coords are the user's real location vs the fallback */
  precise: boolean;
  status: 'pending' | 'granted' | 'denied';
};

/**
 * Best-effort user location for distance ranking. Requests foreground
 * permission once; always returns usable coords (falling back to the city
 * center) so the feed never blocks on a permission prompt.
 */
export function useUserLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    coords: DEFAULT_CENTER,
    precise: false,
    status: 'pending',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== 'granted') {
          setState((s) => ({ ...s, status: 'denied' }));
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled) return;
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          precise: true,
          status: 'granted',
        });
      } catch {
        if (!cancelled) setState((s) => ({ ...s, status: 'denied' }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
