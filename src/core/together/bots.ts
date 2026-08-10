import { TAGS } from '../taste/tags';
import type { TasteProfile } from '../taste/profile';
import type { HopMember } from './types';

const T = TAGS;

/**
 * Seeded "friends" for the keyless demo. Each has a distinct, opinionated taste
 * so the swipe-to-match has real tension — the overlap is earned, not trivial.
 * When Supabase is connected these are replaced by real joiners over realtime.
 */
type BotSeed = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  weights: TasteProfile['weights'];
};

export const BOTS: BotSeed[] = [
  {
    id: 'mara',
    name: 'Mara',
    emoji: '🎧',
    blurb: 'Wants people, noise, and a good drink.',
    weights: {
      [T.lively]: 0.9,
      [T.group]: 0.8,
      [T.drinks]: 0.85,
      [T.food]: 0.5,
      [T.moody]: 0.5,
      [T.splurge]: 0.4,
      [T.quiet]: -0.6,
      [T.study]: -0.7,
    },
  },
  {
    id: 'dev',
    name: 'Dev',
    emoji: '📚',
    blurb: 'Would happily read in a corner all night.',
    weights: {
      [T.quiet]: 0.9,
      [T.study]: 0.7,
      [T.coffee]: 0.8,
      [T.outlets]: 0.6,
      [T.solo]: 0.5,
      [T.cheap]: 0.6,
      [T.lively]: -0.7,
      [T.drinks]: -0.4,
    },
  },
  {
    id: 'priya',
    name: 'Priya',
    emoji: '📷',
    blurb: 'In it for the food and the light.',
    weights: {
      [T.food]: 0.9,
      [T.photo]: 0.85,
      [T.bright]: 0.7,
      [T.group]: 0.6,
      [T.splurge]: 0.6,
      [T.comfy]: 0.4,
      [T.quick]: -0.4,
      [T.cheap]: -0.3,
    },
  },
  {
    id: 'sam',
    name: 'Sam',
    emoji: '🌿',
    blurb: 'Easygoing — a comfy seat and they’re set.',
    weights: {
      [T.comfy]: 0.8,
      [T.coffee]: 0.6,
      [T.lingering]: 0.7,
      [T.bright]: 0.4,
      [T.food]: 0.4,
      [T.group]: 0.5,
      [T.quick]: -0.5,
    },
  },
];

export const findBot = (id: string) => BOTS.find((b) => b.id === id);

/** Build a fully-formed, already-answered member from a bot seed. */
export function botMember(seed: BotSeed): HopMember {
  return {
    id: seed.id,
    name: seed.name,
    kind: 'friend',
    emoji: seed.emoji,
    answered: true, // friends arrive with their taste already known
    profile: { weights: { ...seed.weights }, answers: [] },
    swipes: {},
    swipedDone: false,
  };
}
