import { RulesEngine } from './rules';
import type { RecoEngine } from './types';

/**
 * The active recommendation engine — kept RULES-based and SYNCHRONOUS so the
 * render-body callers (ask.tsx, chat.tsx) stay simple and instant.
 *
 * The Claude "flip" for RANKING is not done by swapping this line (an async
 * interface would break those sync callers). Instead the hybrid lives in
 * `discovery.ts`'s `useRanked`: the rules ranking here is the instant, keyless
 * baseline + fallback, and — when Supabase is connected — Claude re-orders the
 * top candidates and rewrites the "why" lines via `core/ai/rank.ts` →
 * `supabase/functions/hoppr-rank`. Question generation stays rules-based here.
 */
export const engine: RecoEngine = new RulesEngine();

export type { RecoEngine, EngineContext, RankedPlace } from './types';
export { haversineMiles } from './rules';
