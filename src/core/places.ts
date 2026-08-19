import { TAGS, type Tag } from './taste/tags';
import type { Dietary } from './menu/types';

export type PlaceCategory = 'cafe' | 'bar' | 'restaurant' | 'study' | 'photo' | 'bakery';

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  area: string;
  coords: { lat: number; lng: number };
  /** 0..1 baseline popularity */
  popularity: number;
  /** 1..4 price level */
  price: number;
  tags: Tag[];
  blurb: string;
  /** Google Places (New) photo resource name, when sourced from Google */
  photo?: string;
  quotes?: { text: string; who: string }[];
  /** 0..5 raw rating, when known — kept separate from `popularity` so hidden-gem detection isn't lost in that single scalar */
  rating?: number;
  /** raw review count, when known */
  reviewCount?: number;
  /** mock cuisine tags — no real cuisine data source yet, used by the Together food-question matching */
  cuisine?: string[];
  /** mock dietary-friendliness signal at the place level (distinct from per-dish `MenuItem.dietary`) */
  dietaryFriendly?: Dietary[];
  /** mock display hours, e.g. "7am – 6pm" */
  hoursLabel?: string;
};

/** Rating/review thresholds for the "Hidden gems" row — high rating, still under the radar. */
const HIDDEN_GEM_MIN_RATING = 4.4;
const HIDDEN_GEM_MAX_REVIEWS = 200;

/**
 * A place is a "hidden gem" when it's rated highly but hasn't accumulated many
 * reviews yet. Requires known review data — a place with no review count is
 * treated as unknown, not as a gem, so this only ever flags real signal.
 */
export function isHiddenGem(place: Place): boolean {
  return (
    (place.rating ?? 0) >= HIDDEN_GEM_MIN_RATING &&
    place.reviewCount != null &&
    place.reviewCount <= HIDDEN_GEM_MAX_REVIEWS
  );
}

const T = TAGS;

/**
 * Seed places around Ann Arbor (the design's Kerrytown / Main St world).
 * Distances are computed live from the user's location; ranking reacts to the
 * taste profile via the tags below.
 */
export const PLACES: Place[] = [
  {
    id: 'otterbein',
    name: 'Otterbein Coffee',
    category: 'cafe',
    area: 'Kerrytown',
    coords: { lat: 42.2864, lng: -83.7434 },
    popularity: 0.86,
    price: 1,
    tags: [T.coffee, T.quiet, T.bright, T.outlets, T.solo, T.lingering, T.study],
    blurb: 'Quiet until noon, outlets everywhere, and nobody rushes you.',
    quotes: [
      { text: 'Sat two hours on one cortado and nobody blinked.', who: 'Wren · regular' },
      { text: 'Back-left table has the outlets and the best light.', who: 'Theo · 3 visits' },
    ],
    cuisine: ['coffee', 'cafe'],
    dietaryFriendly: ['veg', 'vegan', 'dairy_free'],
    hoursLabel: '7am – 6pm',
  },
  {
    id: 'marrow',
    name: 'Marrow & Ash',
    category: 'cafe',
    area: 'Old West Side',
    coords: { lat: 42.2789, lng: -83.7561 },
    popularity: 0.72,
    price: 2,
    tags: [T.coffee, T.quiet, T.bright, T.comfy, T.solo, T.lingering],
    blurb: 'A hushed back room and a big communal table by the window.',
    cuisine: ['coffee', 'cafe', 'brunch'],
    dietaryFriendly: ['veg', 'gf'],
    hoursLabel: '7am – 5pm',
  },
  {
    id: 'foldwell',
    name: 'Foldwell Books',
    category: 'study',
    area: 'Downtown',
    coords: { lat: 42.2801, lng: -83.7488 },
    popularity: 0.64,
    price: 1,
    tags: [T.study, T.quiet, T.moody, T.solo, T.lingering, T.comfy],
    blurb: 'Reading nooks upstairs, warm lamps, and free tea refills.',
    rating: 4.7,
    reviewCount: 38,
    cuisine: ['coffee', 'tea'],
    dietaryFriendly: ['veg', 'vegan'],
    hoursLabel: '8am – 9pm',
  },
  {
    id: 'cadence',
    name: 'Cadence Tap',
    category: 'bar',
    area: 'Kerrytown',
    coords: { lat: 42.2871, lng: -83.7419 },
    popularity: 0.79,
    price: 2,
    tags: [T.drinks, T.lively, T.moody, T.group, T.hangout],
    blurb: 'Low light, good vinyl, and it was half full an hour ago.',
    cuisine: ['bar food', 'american'],
    dietaryFriendly: ['veg'],
    hoursLabel: '4pm – 2am',
  },
  {
    id: 'halyard',
    name: 'Halyard House',
    category: 'restaurant',
    area: 'Main St',
    coords: { lat: 42.2802, lng: -83.7476 },
    popularity: 0.83,
    price: 3,
    tags: [T.food, T.lively, T.group, T.hangout, T.splurge],
    blurb: 'Shared plates, buzzy, but you can still hear each other.',
    cuisine: ['new american', 'small plates'],
    dietaryFriendly: ['veg', 'gf'],
    hoursLabel: '5pm – 11pm',
  },
  {
    id: 'juniper',
    name: 'Juniper Room',
    category: 'bar',
    area: 'Downtown',
    coords: { lat: 42.2795, lng: -83.7452 },
    popularity: 0.7,
    price: 4,
    tags: [T.drinks, T.moody, T.quiet, T.solo, T.splurge],
    blurb: 'Small, warm, and a properly made negroni.',
    rating: 4.8,
    reviewCount: 52,
    cuisine: ['cocktails'],
    dietaryFriendly: [],
    hoursLabel: '6pm – 1am',
  },
  {
    id: 'westerly',
    name: 'Westerly Diner',
    category: 'restaurant',
    area: 'Westside',
    coords: { lat: 42.2758, lng: -83.7689 },
    popularity: 0.68,
    price: 1,
    tags: [T.food, T.cheap, T.lingering, T.bright, T.solo, T.group],
    blurb: 'All-day breakfast, window booths, and nobody hurries you.',
    cuisine: ['american', 'diner', 'breakfast'],
    dietaryFriendly: ['veg', 'gf'],
    hoursLabel: '7am – 9pm',
  },
  {
    id: 'lumen',
    name: 'Lumen Gallery Cafe',
    category: 'photo',
    area: 'Arts District',
    coords: { lat: 42.2833, lng: -83.7401 },
    popularity: 0.66,
    price: 2,
    tags: [T.coffee, T.photo, T.bright, T.quiet, T.hangout],
    blurb: 'A skylight, plants, and quietly the most photogenic room in town.',
    cuisine: ['coffee', 'cafe'],
    dietaryFriendly: ['veg', 'vegan'],
    hoursLabel: '9am – 6pm',
  },
  {
    id: 'grainhaus',
    name: 'Grainhaus Bakery',
    category: 'bakery',
    area: 'Kerrytown',
    coords: { lat: 42.2869, lng: -83.7447 },
    popularity: 0.81,
    price: 1,
    tags: [T.coffee, T.cheap, T.quick, T.bright, T.solo],
    blurb: 'Grab a laminated pastry and a filter coffee; in and out in ten.',
    cuisine: ['bakery', 'coffee'],
    dietaryFriendly: ['veg'],
    hoursLabel: '7am – 3pm',
  },
  {
    id: 'salt',
    name: 'Salt & Cedar',
    category: 'restaurant',
    area: 'Main St',
    coords: { lat: 42.2811, lng: -83.7469 },
    popularity: 0.77,
    price: 4,
    tags: [T.food, T.moody, T.group, T.splurge, T.hangout],
    blurb: 'Candlelit, a little romantic, good for a slow group dinner.',
    cuisine: ['mediterranean', 'new american'],
    dietaryFriendly: ['veg', 'gf', 'dairy_free'],
    hoursLabel: '5pm – 10pm',
  },
  {
    id: 'perch',
    name: 'The Perch',
    category: 'photo',
    area: 'Riverside',
    coords: { lat: 42.2914, lng: -83.7327 },
    popularity: 0.6,
    price: 2,
    tags: [T.photo, T.bright, T.hangout, T.group, T.lively],
    blurb: 'Rooftop light at golden hour; bring a friend and a camera.',
    rating: 4.6,
    reviewCount: 91,
    cuisine: ['small plates', 'cocktails'],
    dietaryFriendly: ['veg'],
    hoursLabel: '11am – 10pm',
  },
  {
    id: 'stackhouse',
    name: 'Stackhouse Study Bar',
    category: 'study',
    area: 'Campus',
    coords: { lat: 42.2769, lng: -83.7382 },
    popularity: 0.74,
    price: 1,
    tags: [T.study, T.quiet, T.outlets, T.solo, T.lingering, T.cheap],
    blurb: 'Silent floor with a plug at every seat and bottomless drip.',
    cuisine: ['coffee'],
    dietaryFriendly: ['veg', 'vegan'],
    hoursLabel: '7am – 11pm',
  },
  {
    id: 'moss',
    name: 'Moss & Maple',
    category: 'cafe',
    area: 'Burns Park',
    coords: { lat: 42.2681, lng: -83.7351 },
    popularity: 0.69,
    price: 2,
    tags: [T.coffee, T.bright, T.comfy, T.hangout, T.group, T.lingering],
    blurb: 'Sunny corner spot, comfy couches, easy to lose an afternoon.',
    cuisine: ['coffee', 'brunch'],
    dietaryFriendly: ['veg', 'gf'],
    hoursLabel: '7am – 6pm',
  },
  {
    id: 'emberline',
    name: 'Emberline',
    category: 'bar',
    area: 'Downtown',
    coords: { lat: 42.2807, lng: -83.7441 },
    popularity: 0.82,
    price: 3,
    tags: [T.drinks, T.lively, T.group, T.hangout, T.moody],
    blurb: 'Gets loud after nine on a Friday — in the good way.',
    cuisine: ['bar food', 'cocktails'],
    dietaryFriendly: ['veg'],
    hoursLabel: '4pm – 2am',
  },
];

export const CATEGORY_LABEL: Record<PlaceCategory, string> = {
  cafe: 'Cafe',
  bar: 'Bar',
  restaurant: 'Restaurant',
  study: 'Study',
  photo: 'Photo spot',
  bakery: 'Bakery',
};

export const findPlaceById = (id?: string) => PLACES.find((p) => p.id === id);

/** A spec meter for the Place screen. */
export type Spec = { label: string; value: string; fill: number };

/**
 * Derive the "specs" grid from a place's tags so the detail view stays coherent
 * with why it was recommended. (Real visitor-reported specs arrive in Slice 2.)
 */
export function deriveSpecs(place: Place): Spec[] {
  const has = (t: Tag) => place.tags.includes(t);
  const specs: Spec[] = [];

  specs.push(
    has(T.quiet)
      ? { label: 'Noise', value: 'Low till noon', fill: 0.28 }
      : has(T.lively)
        ? { label: 'Noise', value: 'Lively', fill: 0.82 }
        : { label: 'Noise', value: 'Moderate', fill: 0.5 },
  );
  specs.push(
    has(T.outlets)
      ? { label: 'Outlets', value: 'At most seats', fill: 0.9 }
      : { label: 'Outlets', value: 'A few around', fill: 0.4 },
  );
  specs.push(
    has(T.bright)
      ? { label: 'Lighting', value: 'Bright, natural', fill: 0.85 }
      : has(T.moody)
        ? { label: 'Lighting', value: 'Low, warm', fill: 0.4 }
        : { label: 'Lighting', value: 'Even', fill: 0.6 },
  );
  specs.push(
    has(T.comfy)
      ? { label: 'Seating', value: 'Sink-in comfy', fill: 0.82 }
      : has(T.solo)
        ? { label: 'Seating', value: 'Plenty of solo', fill: 0.75 }
        : { label: 'Seating', value: 'Tables & booths', fill: 0.65 },
  );
  specs.push(
    has(T.lingering)
      ? { label: 'Pace', value: 'Nobody rushes you', fill: 0.85 }
      : has(T.quick)
        ? { label: 'Pace', value: 'Quick turnover', fill: 0.3 }
        : { label: 'Pace', value: 'Easy', fill: 0.6 },
  );
  specs.push({ label: 'Price', value: '$'.repeat(place.price), fill: place.price / 4 });

  return specs;
}

/** Category/vibe badges for the place hero. */
export function placeBadges(place: Place): string[] {
  const out = [CATEGORY_LABEL[place.category]];
  if (place.tags.includes(T.quiet)) out.push('Quiet');
  else if (place.tags.includes(T.lively)) out.push('Lively');
  if (place.tags.includes(T.outlets)) out.push('Outlets');
  else if (place.tags.includes(T.bright)) out.push('Daylight');
  return out.slice(0, 3);
}
