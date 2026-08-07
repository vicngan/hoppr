import type { EvalCase, RankCandidate, RankResult, ScoredResult } from './types';

/** Mirrors (does not call) the whitelist/dedupe/append logic in
 * `src/core/ai/rank.ts` and `supabase/functions/hoppr-rank/index.ts`, so the
 * eval can report what the model itself returned before those layers'
 * defenses would silently clean it up. */
export function whitelistCheck(
  candidates: RankCandidate[],
  ranked: RankResult[],
): { hallucinatedIds: string[]; droppedIds: string[] } {
  const allowed = new Set(candidates.map((c) => c.id));
  const seen = new Set<string>();
  const hallucinatedIds: string[] = [];

  for (const r of ranked) {
    if (!allowed.has(r.id)) {
      hallucinatedIds.push(r.id);
      continue;
    }
    seen.add(r.id);
  }

  const droppedIds = candidates.map((c) => c.id).filter((id) => !seen.has(id));
  return { hallucinatedIds, droppedIds };
}

/** Applies the same whitelist/dedupe/append the app does, so hit@1/recall@3
 * are scored against what the user would actually see, not the raw model output. */
function toDisplayOrder(candidates: RankCandidate[], ranked: RankResult[]): string[] {
  const allowed = new Set(candidates.map((c) => c.id));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of ranked) {
    if (!allowed.has(r.id) || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r.id);
  }
  for (const c of candidates) if (!seen.has(c.id)) out.push(c.id);
  return out;
}

export function hitAt1(displayOrder: string[], idealTop3: string[]): boolean {
  if (idealTop3.length === 0) return true; // nothing to miss
  return displayOrder[0] === idealTop3[0];
}

export function recallAt3(displayOrder: string[], idealTop3: string[]): number {
  if (idealTop3.length === 0) return 1;
  const top3 = new Set(displayOrder.slice(0, 3));
  const hits = idealTop3.filter((id) => top3.has(id)).length;
  return hits / idealTop3.length;
}

export function unacceptableInTop5Count(displayOrder: string[], unacceptableInTop5?: string[]): number {
  if (!unacceptableInTop5 || unacceptableInTop5.length === 0) return 0;
  const top5 = new Set(displayOrder.slice(0, 5));
  return unacceptableInTop5.filter((id) => top5.has(id)).length;
}

export function scoreResult(
  evalCase: EvalCase,
  model: string,
  ranked: RankResult[],
  latencyMs: number,
  inputTokens: number,
  outputTokens: number,
): ScoredResult {
  const { hallucinatedIds, droppedIds } = whitelistCheck(evalCase.candidates, ranked);
  const displayOrder = toDisplayOrder(evalCase.candidates, ranked);

  return {
    caseId: evalCase.id,
    model,
    ranked,
    latencyMs,
    inputTokens,
    outputTokens,
    hallucinatedIds,
    droppedIds,
    hitAt1: hitAt1(displayOrder, evalCase.idealTop3),
    recallAt3: recallAt3(displayOrder, evalCase.idealTop3),
    unacceptableInTop5Count: unacceptableInTop5Count(displayOrder, evalCase.unacceptableInTop5),
  };
}
