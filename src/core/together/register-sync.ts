/**
 * Side-effect module: registers the realtime `HopSync` backend when Supabase is
 * configured. Imported once by `together/index.ts` so any screen touching the
 * hop layer wires the backend automatically. Keyless, this is a no-op and the
 * store runs on `noopSync` (simulated friends).
 *
 * The Supabase-realtime implementation is authored in `supabase-sync.ts` and
 * registered here via `setHopSync(...)` — kept authored-but-not-connected, the
 * same discipline as the rest of the backend.
 */
// Side-effect import: the guard inside `supabase-sync` keeps this inert keyless.
import './supabase-sync';

export {};
