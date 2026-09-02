import { PLACES, type Place } from '../places';
import { TIME_SLOTS } from './match';
import type { Hop } from './types';

/**
 * One "planned hop" worth of ticket display data — either the single real
 * persisted `Hop` (see `hoppr.together.v1` in `store.ts`) or a fake sample.
 * There's no hop-history store yet (only ever one `Hop | null` persists), so
 * the Together tab's Upcoming/Past ticket list is demoed against these
 * fabricated tickets alongside whatever real hop exists — swap this out once
 * real history persistence lands.
 */
export type Ticket = {
  id: string;
  place: Place;
  title: string;
  when: Date | null;
  time: string | null;
  members: string[];
  source: 'real' | 'mock';
};

const DAY_MS = 24 * 60 * 60 * 1000;
const findPlace = (id: string) => PLACES.find((p) => p.id === id)!;

/** A few fabricated tickets spanning past and future so the split has something to show. */
function buildMockTickets(): Ticket[] {
  const now = Date.now();
  return [
    {
      id: 'mock-1',
      place: findPlace('marrow'),
      title: 'Friday hop',
      when: new Date(now + 4 * DAY_MS),
      time: '19:30',
      members: ['You', 'Priya', 'Sam'],
      source: 'mock',
    },
    {
      id: 'mock-2',
      place: findPlace('lumen'),
      title: 'Brunch club',
      when: new Date(now + 11 * DAY_MS),
      time: '11:00',
      members: ['You', 'Dev'],
      source: 'mock',
    },
    {
      id: 'mock-3',
      place: findPlace('foldwell'),
      title: 'Study date',
      when: new Date(now - 6 * DAY_MS),
      time: '14:00',
      members: ['You', 'Mara'],
      source: 'mock',
    },
    {
      id: 'mock-4',
      place: findPlace('stackhouse'),
      title: 'Table for four',
      when: new Date(now - 21 * DAY_MS),
      time: '20:00',
      members: ['You', 'Priya', 'Dev', 'Sam'],
      source: 'mock',
    },
  ];
}

function realHopTicket(hop: Hop | null): Ticket | null {
  if (!hop || hop.status !== 'planned' || !hop.pickId) return null;
  const place = PLACES.find((p) => p.id === hop.pickId);
  if (!place) return null;

  let when: Date | null = null;
  if (hop.planDate) {
    when = new Date(`${hop.planDate}T${hop.planTime ?? '00:00'}:00`);
  } else if (hop.slotId) {
    const slot = TIME_SLOTS.find((s) => s.id === hop.slotId);
    if (slot) {
      when = new Date();
      if (slot.day.toLowerCase() !== 'tonight') when.setDate(when.getDate() + 1);
    }
  }

  return {
    id: hop.id,
    place,
    title: hop.title,
    when,
    time: hop.planTime ?? null,
    members: hop.members.map((m) => m.name),
    source: 'real',
  };
}

/** All tickets — the real planned hop (if any) plus the fake samples — best-date-first within each split. */
export function buildTickets(hop: Hop | null): { upcoming: Ticket[]; past: Ticket[] } {
  const real = realHopTicket(hop);
  const all = real ? [real, ...buildMockTickets()] : buildMockTickets();
  const now = Date.now();

  const upcoming = all.filter((t) => !t.when || t.when.getTime() >= now).sort(byDateAsc);
  const past = all.filter((t) => t.when && t.when.getTime() < now).sort(byDateDesc);
  return { upcoming, past };
}

const byDateAsc = (a: Ticket, b: Ticket) => (a.when?.getTime() ?? Infinity) - (b.when?.getTime() ?? Infinity);
const byDateDesc = (a: Ticket, b: Ticket) => (b.when?.getTime() ?? 0) - (a.when?.getTime() ?? 0);
