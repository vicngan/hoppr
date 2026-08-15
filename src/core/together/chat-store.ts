import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase, isSupabaseConfigured } from '../supabase';
import { YOU_ID } from './store';

/**
 * A minimal, hop-scoped message log for `src/app/chat.tsx` (Together's group
 * chat). This is a deliberately small sibling to `together/store.ts` — NOT an
 * extension of `Hop`/`HopMember` (those types and the state machine in
 * `store.ts` are owned by the Together-core package and are off-limits here).
 * Plain text only, keyed by hop id, persisted locally so a chat survives an
 * app restart the same way a hop does.
 *
 * Realtime: `together/sync.ts`'s `HopSync` seam only carries whole-`Hop`
 * snapshots (members/shortlist/votes), it has no message channel, so this
 * store can't reuse it directly. When Supabase is configured this store
 * best-effort broadcasts on its own `chat:{hopId}` realtime channel (same
 * client, same "keyless is a no-op" convention as `supabase-sync.ts`) so
 * group members on a connected build see each other's messages live; keyless
 * builds just get the local echo, which still exercises the whole screen.
 */

export type ChatMessage = {
  id: string;
  hopId: string;
  /** member id, or 'you' for the local device — matches `HopMember.id`. */
  from: string;
  text: string;
  at: number;
};

type ChatState = {
  /** hopId → messages, oldest first. */
  byHop: Record<string, ChatMessage[]>;
  /** Post a plain-text message from this device into the hop's thread. */
  send: (hopId: string, text: string) => void;
  /** Apply an incoming realtime message (from another device). Internal-ish. */
  _receive: (msg: ChatMessage) => void;
  /** (Re)subscribe this device to a hop's chat channel; no-op keyless. */
  subscribe: (hopId: string) => () => void;
  clearHop: (hopId: string) => void;
};

const channelFor = (hopId: string) => `chat:${hopId}`;

export const useHopChat = create<ChatState>()(
  persist(
    (set, get) => ({
      byHop: {},

      send: (hopId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const msg: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          hopId,
          from: YOU_ID,
          text: trimmed,
          at: Date.now(),
        };
        get()._receive(msg);
        if (isSupabaseConfigured && supabase) {
          supabase.channel(channelFor(hopId)).send({
            type: 'broadcast',
            event: 'message',
            payload: msg,
          });
        }
      },

      _receive: (msg) => {
        set((s) => {
          const existing = s.byHop[msg.hopId] ?? [];
          if (existing.some((m) => m.id === msg.id)) return s;
          return { byHop: { ...s.byHop, [msg.hopId]: [...existing, msg] } };
        });
      },

      subscribe: (hopId) => {
        if (!isSupabaseConfigured || !supabase) return () => {};
        const channel = supabase
          .channel(channelFor(hopId))
          .on('broadcast', { event: 'message' }, ({ payload }) => {
            const msg = payload as ChatMessage;
            if (msg?.from === YOU_ID) return; // already applied locally on send
            get()._receive(msg);
          })
          .subscribe();
        return () => {
          channel.unsubscribe();
          supabase?.removeChannel(channel);
        };
      },

      clearHop: (hopId) => {
        set((s) => {
          const byHop = { ...s.byHop };
          delete byHop[hopId];
          return { byHop };
        });
      },
    }),
    {
      name: 'hoppr.together.chat.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ byHop: s.byHop }) as Pick<ChatState, 'byHop'>,
    },
  ),
);

export const selectHopMessages = (hopId: string | undefined) => (s: ChatState) =>
  hopId ? (s.byHop[hopId] ?? []) : [];
