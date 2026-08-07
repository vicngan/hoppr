import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for the shared core layer.
 *
 * Credentials come from Expo public env vars (set in `.env` / EAS). Until they
 * are configured (Slice 1), `supabase` is `null` and callers should fall back
 * to mock data — this lets the app run end-to-end before a backend exists.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Expo Router's web "static" output prerenders on Node (no `window`), but
 * `@react-native-async-storage/async-storage`'s web adapter touches
 * `window`/`localStorage` as soon as the client calls `storage.getItem`.
 * Fall back to an in-memory no-op during that pass; the browser re-hydrates
 * with real `AsyncStorage` once `window` exists.
 */
const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: typeof window === 'undefined' ? noopStorage : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
