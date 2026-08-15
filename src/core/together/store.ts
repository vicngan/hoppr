import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTaste } from '../taste/store';
import { applyDeltas, emptyProfile, type TasteProfile } from '../taste/profile';
import type { Coords } from '../engine/types';
import type { Place } from '../places';
import type { Question, QOption } from '../questions';
import { BOTS, botMember, findBot } from './bots';
import { groupShortlist, botSwipe, groupPick, botSlotVote, winningSlot, TIME_SLOTS } from './match';
import { hopSync, isSimulated } from './sync';
import type { Hop, HopMember } from './types';

const YOU = 'you';

const randCode = () => {
  const s = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `HOP-${(s + '000').slice(0, 3)}`;
};

/** A "you" member seeded from the live global taste (a copy — never mutates it). */
function youMember(): HopMember {
  const base = useTaste.getState().profile;
  return {
    id: YOU,
    name: 'You',
    kind: 'you',
    emoji: '🐇',
    answered: false,
    // carry your learned weights as the baseline; hop answers refine them, and
    // answers[] starts fresh so the private flow shows the full 3 questions.
    profile: { weights: { ...base.weights }, answers: [] },
    swipes: {},
    swipedDone: false,
  };
}

type TogetherState = {
  hop: Hop | null;
  hydrated: boolean;

  /** Host a new hop (you are the host). */
  startHop: (title: string) => void;
  /** Keyless demo of the *joiner* side: drop into a bot-hosted hop mid-flight. */
  simulateJoin: (name?: string) => void;
  /** No-account join by code — needs a connected backend. */
  joinHop: (code: string, name: string) => Promise<void>;

  /** Lobby: add / remove a simulated friend. */
  invite: (botId: string) => void;
  uninvite: (botId: string) => void;
  /** Lobby → private answers. */
  beginAnswers: () => void;
  /** Record one of *your* private answers (refines your hop-local taste only). */
  answerAsYou: (q: Question, o: QOption) => void;
  /** Finish your answers; when the table is done, build the swipe deck. */
  finishAnswering: (places: Place[], userCoords: Coords | null) => void;

  /** Swiping: like/pass a place in the deck. */
  swipe: (placeId: string, like: boolean) => void;
  /** Finish the deck → reveal the Group Pick. */
  finishSwiping: (places: Place[]) => void;

  /** Plan: vote a time slot. */
  voteSlot: (slotId: string) => void;
  /** Lock the winning time. */
  lockSlot: () => void;

  /**
   * Merge the Plan-Together wizard's additive planned-state fields (real ISO
   * date/time, reserve/preorder details — see `types.ts`) onto the current
   * hop. This is the wizard's *only* write surface into `Hop` beyond the
   * other public actions above (`invite`, `beginAnswers`, `finishAnswering`,
   * `swipe`, `finishSwiping`, `voteSlot`, `lockSlot`) — it never touches
   * `slotId`/`slotVotes`/`status`, which stay driven by `voteSlot`/`lockSlot`
   * so the wizard goes through the same state machine as the code-invite path.
   */
  setPlanDetails: (
    patch: Partial<Pick<Hop, 'planDate' | 'planTime' | 'reserveDetails' | 'preorderDetails'>>,
  ) => void;

  /** Apply an authoritative hop pushed from the backend (realtime inbound). */
  applyRemote: (hop: Hop) => void;
  /** (Re)subscribe to a hop's realtime updates; no-op keyless. Internal. */
  _resubscribe: (hopId: string) => void;
  /** Leave / clear the current hop. */
  leaveHop: () => void;
};

/** Active realtime unsubscribe, kept outside the store (not serializable). */
let unsub: (() => void) | null = null;

export const useTogether = create<TogetherState>()(
  persist(
    (set, get) => {
      /** Commit next hop state locally and mirror it to the backend (if any). */
      const push = (hop: Hop) => {
        set({ hop });
        hopSync().publish(hop);
      };

      return {
        hop: null,
        hydrated: false,

        startHop: (title) => {
          const hop: Hop = {
            id: `hop_${Date.now()}`,
            code: randCode(),
            title: title.trim() || 'A hop',
            createdAt: Date.now(),
            status: 'lobby',
            hostId: YOU,
            members: [youMember()],
            shortlist: [],
            pickId: null,
            slotId: null,
            slotVotes: {},
          };
          push(hop);
        },

        simulateJoin: (name = 'You') => {
          const you: HopMember = { ...youMember(), name };
          const hop: Hop = {
            id: `hop_${Date.now()}`,
            code: 'HOP-DEMO',
            title: 'Friday, somewhere good',
            createdAt: Date.now(),
            status: 'answering', // the host already got things rolling
            hostId: 'mara',
            members: [botMember(BOTS[0]), botMember(BOTS[1]), you],
            shortlist: [],
            pickId: null,
            slotId: null,
            slotVotes: {},
          };
          push(hop);
        },

        joinHop: async (code, name) => {
          const { hop } = await hopSync().join(code, name);
          set({ hop });
          // Joiners mirror the host: subscribe to the authoritative state and
          // apply every published tick. (Host stays source of truth via publish.)
          get()._resubscribe(hop.id);
        },

        invite: (botId) => {
          const hop = get().hop;
          if (!hop || hop.status !== 'lobby') return;
          if (hop.members.some((m) => m.id === botId)) return;
          const seed = findBot(botId);
          if (!seed) return;
          push({ ...hop, members: [...hop.members, botMember(seed)] });
        },

        uninvite: (botId) => {
          const hop = get().hop;
          if (!hop || hop.status !== 'lobby' || botId === YOU) return;
          push({ ...hop, members: hop.members.filter((m) => m.id !== botId) });
        },

        beginAnswers: () => {
          const hop = get().hop;
          if (!hop || hop.status !== 'lobby') return;
          push({ ...hop, status: 'answering' });
        },

        answerAsYou: (q, o) => {
          const hop = get().hop;
          if (!hop) return;
          const members = hop.members.map((m) =>
            m.id === YOU
              ? { ...m, profile: applyDeltas(m.profile, o.deltas, { questionId: q.id, optionId: o.id, at: Date.now() }) }
              : m,
          );
          push({ ...hop, members });
        },

        finishAnswering: (places, userCoords) => {
          const hop = get().hop;
          if (!hop) return;
          const members = hop.members.map((m) => (m.id === YOU ? { ...m, answered: true } : m));
          const everyoneIn = members.every((m) => m.answered);
          if (!everyoneIn) {
            push({ ...hop, members });
            return;
          }
          // build the shared deck, and (keyless) precompute the friends' swipes
          const shortlist = groupShortlist(members, places, userCoords);
          const byId = new Map(places.map((p) => [p.id, p]));
          const swiped = members.map((m) => {
            if (m.kind === 'you' || !isSimulated()) return m;
            const swipes: Record<string, boolean> = {};
            for (const id of shortlist) {
              const p = byId.get(id);
              if (p) swipes[id] = botSwipe(m, p);
            }
            return { ...m, swipes, swipedDone: true };
          });
          push({ ...hop, members: swiped, shortlist, status: 'swiping' });
        },

        swipe: (placeId, like) => {
          const hop = get().hop;
          if (!hop) return;
          const members = hop.members.map((m) => {
            if (m.id !== YOU) return m;
            const swipes = { ...m.swipes, [placeId]: like };
            return { ...m, swipes, swipedDone: hop.shortlist.every((id) => id in swipes) };
          });
          push({ ...hop, members });
        },

        finishSwiping: (places) => {
          const hop = get().hop;
          if (!hop) return;
          const members = hop.members.map((m) => (m.id === YOU ? { ...m, swipedDone: true } : m));
          const next = { ...hop, members };
          push({ ...next, pickId: groupPick(next, places), status: 'picked' });
        },

        voteSlot: (slotId) => {
          const hop = get().hop;
          if (!hop) return;
          const slotVotes: Record<string, string[]> = {};
          // your vote is exclusive across slots
          for (const slot of TIME_SLOTS) {
            const others = (hop.slotVotes[slot.id] ?? []).filter((id) => id !== YOU);
            slotVotes[slot.id] = slot.id === slotId ? [...others, YOU] : others;
          }
          // keyless: the table votes once, deterministically
          if (isSimulated()) {
            for (const m of hop.members) {
              if (m.kind === 'you') continue;
              const already = TIME_SLOTS.some((s) => slotVotes[s.id].includes(m.id));
              if (already) continue;
              const choice = botSlotVote(m);
              slotVotes[choice] = [...(slotVotes[choice] ?? []), m.id];
            }
          }
          push({ ...hop, slotVotes });
        },

        lockSlot: () => {
          const hop = get().hop;
          if (!hop) return;
          push({ ...hop, slotId: winningSlot(hop), status: 'planned' });
        },

        setPlanDetails: (patch) => {
          const hop = get().hop;
          if (!hop) return;
          push({ ...hop, ...patch });
        },

        applyRemote: (hop) => set({ hop }),

        _resubscribe: (hopId) => {
          unsub?.();
          unsub = null;
          const sync = hopSync();
          if (!sync.available) return; // keyless: nothing to subscribe to
          unsub = sync.subscribe(hopId, (hop) => get().applyRemote(hop));
        },

        leaveHop: () => {
          unsub?.();
          unsub = null;
          set({ hop: null });
        },
      };
    },
    {
      name: 'hoppr.together.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ hop: s.hop }) as Pick<TogetherState, 'hop'>,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/** Convenience selectors. */
export const selectIsHost = (hop: Hop | null) => hop?.hostId === YOU;
export const selectYou = (hop: Hop | null): HopMember | undefined =>
  hop?.members.find((m) => m.id === YOU);
export const YOU_ID = YOU;

/** Baseline empty profile export for callers that need one. */
export const emptyHopProfile: () => TasteProfile = emptyProfile;
