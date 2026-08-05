import { RulesEngine } from './rules';
import type { RecoEngine } from './types';

/**
 * The active recommendation engine. Rules-based today; when the Claude engine
 * lands (Slice 3) this is the single line that flips — every screen consumes
 * the engine through this handle, so nothing else changes.
 */
export const engine: RecoEngine = new RulesEngine();

export type { RecoEngine, EngineContext, RankedPlace } from './types';
export { haversineMiles } from './rules';
