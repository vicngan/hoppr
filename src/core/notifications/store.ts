import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * "Nudges" — the notifications feed reached via Home's bell icon
 * (`src/app/notifications.tsx`). No notifications domain existed before this;
 * this is a deliberately small store (read/unread per id, seeded content),
 * not a push-notification pipeline — there's no backend event source to feed
 * it yet, so the seed list stands in for what a real feed would deliver.
 */

export type NotificationKind = 'invite' | 'vote' | 'plan' | 'chat' | 'system';

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** ISO-ish bucket for the grouped list: 'tonight' or 'earlier'. */
  bucket: 'tonight' | 'earlier';
  at: number;
  /** present when the card should carry a real primary action. */
  action?: {
    label: string;
    /** route to push, e.g. '/together/vote' or '/together/plan/invite'. */
    href: string;
  };
};

const SEED: Notification[] = [
  {
    id: 'n1',
    kind: 'invite',
    title: 'Mara started a hop',
    body: '"Friday, somewhere good" — the table is deciding where to land.',
    bucket: 'tonight',
    at: Date.now() - 1000 * 60 * 12,
    action: { label: 'Join', href: '/together/plan/invite' },
  },
  {
    id: 'n2',
    kind: 'vote',
    title: 'Time to vote',
    body: 'The group has a shortlist — cast your vote before it locks.',
    bucket: 'tonight',
    at: Date.now() - 1000 * 60 * 40,
    action: { label: 'Vote', href: '/together/vote' },
  },
  {
    id: 'n3',
    kind: 'plan',
    title: 'Plan locked in',
    body: 'Your hop landed on a time — check the details.',
    bucket: 'earlier',
    at: Date.now() - 1000 * 60 * 60 * 20,
    action: { label: 'View', href: '/chat' },
  },
  {
    id: 'n4',
    kind: 'system',
    title: 'Welcome to Hoppr',
    body: 'Nudges land here when friends invite you or a plan needs you.',
    bucket: 'earlier',
    at: Date.now() - 1000 * 60 * 60 * 48,
  },
];

type NotificationsState = {
  items: Notification[];
  /** notification id → true once read. */
  read: Record<string, true>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
};

export const useNotifications = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: SEED,
      read: {},

      markRead: (id) => set((s) => ({ read: { ...s.read, [id]: true } })),

      markAllRead: () =>
        set((s) => {
          const read: Record<string, true> = { ...s.read };
          for (const n of s.items) read[n.id] = true;
          return { read };
        }),

      unreadCount: () => get().items.filter((n) => !get().read[n.id]).length,
    }),
    {
      name: 'hoppr.notifications.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ read: s.read }) as Pick<NotificationsState, 'read'>,
    },
  ),
);
