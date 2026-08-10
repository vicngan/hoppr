/**
 * The Supabase realtime backend for "Together". Implements the `HopSync` seam
 * (see `sync.ts`) so the exact same store + screens run over the network.
 *
 * Host-authoritative: the host publishes the whole serialized `Hop` into
 * `hops.state`; joiners subscribe to that row via Supabase Realtime
 * (postgres_changes on `public.hops`, filtered by id) and mirror it locally.
 * No-account friends join by code through the `hoppr-hop` edge function.
 *
 * KEYLESS SAFETY: this module registers itself only when Supabase is configured.
 * With no env vars `supabase` is null, `setHopSync` is never called, `noopSync`
 * stays active, and importing this file is an inert no-op.
 */
import { supabase, isSupabaseConfigured } from '../supabase';
import { setHopSync, type HopSync } from './sync';
import type { Hop } from './types';

/** Deserialize a `hops.state` jsonb value into a `Hop` (it's plain JSON). */
function toHop(state: unknown): Hop | null {
  if (!state || typeof state !== 'object') return null;
  const hop = state as Hop;
  if (!hop.id || !Array.isArray(hop.members)) return null;
  return hop;
}

export const supabaseSync: HopSync = {
  available: true,

  async publish(hop: Hop): Promise<void> {
    if (!supabase) return;
    // The host writes its authoritative state; `create` upserts, so the first
    // publish creates the row and later ones update it.
    const { error } = await supabase.functions.invoke('hoppr-hop', {
      body: { action: 'create', hop },
    });
    if (error) {
      // Non-fatal: local state is already committed by the store; a failed
      // publish just means the group won't see this tick.
      console.warn('[together] publish failed', error);
    }
  },

  subscribe(hopId: string, onUpdate: (hop: Hop) => void): () => void {
    if (!supabase) return () => {};

    const channel = supabase
      .channel(`hop:${hopId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hops', filter: `id=eq.${hopId}` },
        (payload) => {
          const row = payload.new as { state?: unknown } | null;
          const hop = toHop(row?.state);
          if (hop) onUpdate(hop);
        },
      )
      .subscribe();

    return () => {
      // Fire-and-forget; also drop it from the client's channel registry.
      channel.unsubscribe();
      supabase?.removeChannel(channel);
    };
  },

  async join(code: string, name: string): Promise<{ hop: Hop; memberId: string }> {
    if (!supabase) throw new Error('Joining a hop needs a connected backend.');
    const { data, error } = await supabase.functions.invoke('hoppr-hop', {
      body: { action: 'join', code, name },
    });
    if (error) throw new Error(error.message ?? 'join failed');
    const hop = toHop(data?.hop);
    const memberId = data?.memberId as string | undefined;
    if (!hop || !memberId) throw new Error(data?.error ?? 'could not join that hop');
    return { hop, memberId };
  },
};

// Register only when a backend exists — otherwise leave `noopSync` active.
if (isSupabaseConfigured && supabase) {
  setHopSync(supabaseSync);
}
