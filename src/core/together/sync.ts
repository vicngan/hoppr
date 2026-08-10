import type { Hop } from './types';

/**
 * The seam between the local simulation and a real backend. The store owns hop
 * state and calls into the active `HopSync` after every mutation. Keyless, the
 * `noopSync` is active and simulated friends drive the flow locally. When
 * Supabase is connected, a realtime implementation registers itself via
 * `setHopSync` (see `supabase/functions/hoppr-hop` + the realtime provider) so
 * the exact same store + screens run over the network instead — no UI changes.
 */
export interface HopSync {
  /** true once a real backend is wired in — the store stops simulating friends. */
  available: boolean;
  /** push the host's authoritative hop state to the group. */
  publish(hop: Hop): void | Promise<void>;
  /** subscribe to remote hop updates; returns an unsubscribe fn. */
  subscribe(hopId: string, onUpdate: (hop: Hop) => void): () => void;
  /** no-account join by code; resolves the hop and this device's member id. */
  join(code: string, name: string): Promise<{ hop: Hop; memberId: string }>;
}

export const noopSync: HopSync = {
  available: false,
  publish: () => {},
  subscribe: () => () => {},
  join: async () => {
    throw new Error('Joining a hop needs a connected backend.');
  },
};

let active: HopSync = noopSync;

/** Register the realtime backend (called once, when Supabase is configured). */
export function setHopSync(sync: HopSync): void {
  active = sync;
}

/** The active sync — `noopSync` until a backend registers one. */
export function hopSync(): HopSync {
  return active;
}

/** True when the flow should simulate friends (no real backend to drive them). */
export const isSimulated = (): boolean => !active.available;
