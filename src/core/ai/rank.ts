import { supabase, isSupabaseConfigured } from '../supabase';

/**
 * Client gateway to the Claude place-ranker (the `hoppr-rank` Edge Function).
 * Mirrors `ai/client.ts`: the Anthropic key never ships in the app, and until a
 * backend is connected `aiRankAvailable()` is false so callers fall back to the
 * rules engine.
 *
 * Defense in depth: even though the Edge Function already whitelists ids, this
 * re-validates that every returned id was in the candidate set the client sent —
 * so a foreign/hallucinated id can never reach the UI, whatever the server did.
 */
export function aiRankAvailable(): boolean {
  return isSupabaseConfigured && supabase != null;
}

/** The compact candidate shape sent to the ranker (no personal data beyond taste). */
export type RankCandidate = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  area: string;
  price: number;
  popularity: number;
};

export type RankResult = { id: string; reason: string };

/**
 * Ask Claude to re-rank the caller's own candidate places by their taste digest.
 * Returns a permutation-with-reasons of exactly the input ids. Throws if the
 * backend isn't configured — callers should check `aiRankAvailable()` first.
 */
export async function aiRankPlaces(
  digest: string,
  candidates: RankCandidate[],
): Promise<RankResult[]> {
  if (!supabase) throw new Error('AI backend not configured');

  const { data, error } = await supabase.functions.invoke('hoppr-rank', {
    body: { digest, candidates },
  });
  if (error) throw error;

  // Re-run the whitelist/dedupe/append locally — never trust the id set blindly.
  const allowed = new Set(candidates.map((c) => c.id));
  const seen = new Set<string>();
  const out: RankResult[] = [];
  for (const r of (data?.ranked ?? []) as RankResult[]) {
    if (!r || !allowed.has(r.id) || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push({ id: r.id, reason: typeof r.reason === 'string' ? r.reason : '' });
  }
  for (const c of candidates) if (!seen.has(c.id)) out.push({ id: c.id, reason: '' });
  return out;
}
