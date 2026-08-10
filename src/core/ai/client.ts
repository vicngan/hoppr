import { supabase, isSupabaseConfigured } from '../supabase';
import { DISH_TAGS, type Dietary, type DishTag, type MenuItem } from '../menu/types';

/**
 * Client-side gateway to Hoppr's AI features. All calls go through Supabase
 * Edge Functions so the Anthropic key never ships in the app. Until a backend
 * is connected, `aiAvailable()` is false and callers fall back (manual entry).
 */
export function aiAvailable(): boolean {
  return isSupabaseConfigured && supabase != null;
}

/** Raw item shape returned by the hoppr-menu function. */
type RawItem = {
  name: string;
  price: number | null;
  section?: string;
  description?: string;
  tags?: string[];
  dietary?: string[];
};

const DISH_TAG_SET = new Set<string>(DISH_TAGS);
const DIETARY_SET = new Set<string>(['veg', 'vegan', 'gf', 'dairy_free']);

/**
 * Extract menu items from a photo via Claude vision (in the Edge Function).
 * Returns normalized MenuItems ready to persist. Throws if the backend isn't
 * configured — callers should check `aiAvailable()` first.
 */
export async function aiExtractMenu(base64: string, mimeType: string): Promise<MenuItem[]> {
  if (!supabase) throw new Error('AI backend not configured');

  const { data, error } = await supabase.functions.invoke('hoppr-menu', {
    body: { image: base64, mimeType },
  });
  if (error) throw error;

  const raw: RawItem[] = data?.items ?? [];
  return raw
    .filter((r) => r.name?.trim())
    .map((r, i) => ({
      id: `ocr-${Date.now()}-${i}`,
      name: r.name.trim(),
      price: typeof r.price === 'number' ? r.price : null,
      section: r.section?.trim() || undefined,
      description: r.description?.trim() || undefined,
      tags: (r.tags ?? []).filter((t): t is DishTag => DISH_TAG_SET.has(t)),
      dietary: (r.dietary ?? []).filter((d): d is Dietary => DIETARY_SET.has(d)),
      source: 'ocr' as const,
    }));
}
