import type { MenuItem } from './types';

/** Group menu items by their `section` field, preserving first-seen order. */
export function groupBySection(items: MenuItem[]): [string, MenuItem[]][] {
  const map = new Map<string, MenuItem[]>();
  for (const it of items) {
    const key = it.section ?? '';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  }
  return [...map.entries()];
}
