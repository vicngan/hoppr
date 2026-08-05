import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

type SessionState = {
  session: Session | null;
  loading: boolean;
  /** false until EXPO_PUBLIC_SUPABASE_* are set — the app runs on the local
   *  taste store until then */
  backendReady: boolean;
};

/**
 * Auth session. Safe to call before a Supabase project exists: it reports
 * `backendReady: false` and a null session so screens fall back to the local
 * profile. Once env vars are set, this tracks real auth state.
 */
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading, backendReady: isSupabaseConfigured };
}
