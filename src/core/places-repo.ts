import { useQuery } from '@tanstack/react-query';
import { PLACES, type Place } from './places';
import { usePlacesStore } from './places-store';
import { supabase, isSupabaseConfigured } from './supabase';

/** True when a Supabase backend is configured to serve live Google Places. */
export const placesBackendReady = isSupabaseConfigured;

type NearbyResult = { places: Place[]; source: 'google' | 'seed' };

/**
 * Fetch nearby places. Prefers the `hoppr-places` edge function (Google Places)
 * when a backend is configured; otherwise — or on any error / empty response —
 * falls back to the local seed dataset so the app works keyless.
 */
export async function fetchNearby(coords: { lat: number; lng: number }): Promise<NearbyResult> {
  if (supabase && placesBackendReady) {
    try {
      const { data, error } = await supabase.functions.invoke('hoppr-places', {
        body: { lat: coords.lat, lng: coords.lng, radius: 4000 },
      });
      if (!error) {
        const places = (data?.places ?? data) as Place[] | undefined;
        if (Array.isArray(places) && places.length > 0) {
          return { places, source: 'google' };
        }
      }
    } catch {
      // fall through to seed
    }
  }
  return { places: PLACES, source: 'seed' };
}

/**
 * Nearby places for the given coords. Keyed on coords rounded to 3 decimals so
 * small GPS jitter doesn't trigger a refetch. Caches fetched places into the
 * places store so detail screens can resolve them. Falls back to seed data.
 */
export function usePlaces(coords: { lat: number; lng: number }) {
  const query = useQuery({
    queryKey: ['places', coords.lat.toFixed(3), coords.lng.toFixed(3)],
    queryFn: async () => {
      const result = await fetchNearby(coords);
      usePlacesStore.getState().upsertMany(result.places);
      return result;
    },
    staleTime: 5 * 60_000,
  });

  return {
    places: query.data?.places ?? PLACES,
    source: query.data?.source ?? 'seed',
    loading: query.isLoading,
  };
}
