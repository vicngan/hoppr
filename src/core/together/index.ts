/**
 * Together — the group-planning ("hop") layer. Public surface for the screens.
 *
 *   useTogether()        the hop state machine (start → answer → swipe → pick → plan)
 *   selectIsHost / selectYou   selectors over the current hop
 *   BOTS                 seeded friends for the keyless demo
 *   hopQuestions()       the private 3-question flow
 *   TIME_SLOTS           proposed times for the light plan step
 *   pickTallies / winningSlot   read-model helpers for the reveal screens
 *   setHopSync           where the realtime backend registers itself
 */
export * from './types';
export { useTogether, selectIsHost, selectYou, YOU_ID } from './store';
export { BOTS, findBot } from './bots';
export {
  hopQuestions,
  HOP_QUESTION_IDS,
  TIME_SLOTS,
  pickTallies,
  groupPick,
  groupFit,
  winningSlot,
} from './match';
export { setHopSync, hopSync, isSimulated, noopSync, type HopSync } from './sync';

// Registers the realtime backend when Supabase is configured (no-op keyless).
import './register-sync';
