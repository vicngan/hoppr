import { TAGS } from '../taste/tags';
import type { TasteProfile } from '../taste/profile';
import type { PlaceCategory } from '../places';
import { DIETARY_LABEL, type FoodPrefs, type MenuItem } from './types';

export type DishPick = {
  item: MenuItem;
  reason: string;
  alternatives: { item: MenuItem; note: string }[];
};

/**
 * Pick the dish that fits the diner. Rules-based and reactive to the taste
 * profile (a "quick" person gets something small; "cheap" gets the value pick)
 * plus their standing dietary limits. Claude can later replace the reasoning
 * behind the same shape.
 */
export function recommendDish(
  items: MenuItem[],
  profile: TasteProfile,
  prefs: FoodPrefs,
  category: PlaceCategory,
): DishPick | null {
  if (items.length === 0) return null;

  const w = (t: string) => profile.weights[t as keyof typeof profile.weights] ?? 0;
  const quick = w(TAGS.quick);
  const linger = w(TAGS.lingering);
  const cheap = w(TAGS.cheap);
  const splurge = w(TAGS.splurge);
  const drinkVenue = category === 'bar';
  const coffeeVenue = category === 'cafe' || category === 'bakery';

  // hard filters
  let pool = items;
  if (prefs.noAlcohol) pool = pool.filter((i) => !i.tags.includes('alcohol'));
  let dietFiltered = pool;
  let dietTight = false;
  if (prefs.diet) {
    const strict = pool.filter((i) => i.dietary.includes(prefs.diet!));
    if (strict.length > 0) {
      dietFiltered = strict;
      dietTight = true;
    }
  }
  if (dietFiltered.length === 0) dietFiltered = items;

  const score = (i: MenuItem): number => {
    let s = 0.5;
    if (quick > 0.1) {
      if (i.tags.includes('small')) s += 0.25 * quick;
      if (i.tags.includes('light')) s += 0.2 * quick;
      if (i.tags.includes('large')) s -= 0.15 * quick;
    }
    if (linger > 0.1) {
      if (i.tags.includes('sharing')) s += 0.15 * linger;
      if (i.tags.includes('hearty')) s += 0.12 * linger;
    }
    if (cheap > 0.1 && i.price != null) s += (i.price <= 6 ? 0.2 : i.price >= 15 ? -0.2 : 0) * cheap;
    if (splurge > 0.1 && i.price != null && i.price >= 15) s += 0.15 * splurge;
    if (coffeeVenue && i.tags.includes('caffeine')) s += 0.15;
    if (drinkVenue && i.tags.includes('alcohol') && !prefs.noAlcohol) s += 0.12;
    return s;
  };

  const ranked = [...dietFiltered].sort((a, b) => score(b) - score(a));
  const pick = ranked[0];

  return {
    item: pick,
    reason: reasonFor(pick, { quick, cheap, splurge }, prefs, dietTight),
    alternatives: ranked.slice(1, 4).map((item) => ({ item, note: altNote(item) })),
  };
}

function reasonFor(
  item: MenuItem,
  s: { quick: number; cheap: number; splurge: number },
  prefs: FoodPrefs,
  dietTight: boolean,
): string {
  const bits: string[] = [];
  if (dietTight && prefs.diet) bits.push(`${DIETARY_LABEL[prefs.diet]}, like you set`);
  if (s.quick > 0.15 && (item.tags.includes('small') || item.tags.includes('light')))
    bits.push('small and quick, the way you tend to go');
  if (s.cheap > 0.15 && item.price != null && item.price <= 6) bits.push('and easy on the wallet');
  if (s.splurge > 0.15 && item.price != null && item.price >= 15) bits.push('worth the splurge tonight');
  if (bits.length === 0) return item.description ?? 'A reliable favorite here.';
  const joined = bits.join(', ').replace(', and', ' and');
  return joined.charAt(0).toUpperCase() + joined.slice(1) + '.';
}

function altNote(item: MenuItem): string {
  if (item.tags.includes('alcohol')) return 'if you fancy a drink';
  if (item.tags.includes('sweet')) return 'the sweet option';
  if (item.tags.includes('hearty') || item.tags.includes('large')) return 'if you want something bigger';
  if (item.tags.includes('light') || item.tags.includes('small')) return 'if you want it lighter';
  if (item.tags.includes('sharing')) return 'good to share';
  return 'another solid pick';
}
