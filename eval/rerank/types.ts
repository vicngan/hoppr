/**
 * Duplicated (not imported) from `src/core/ai/rank.ts` — that module pulls in
 * the Supabase client, which this standalone Node harness has no reason to
 * initialize. Keep this shape in sync with `RankCandidate`/`RankResult` there.
 */
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

export type EvalCase = {
  id: string;
  digest: string;
  candidates: RankCandidate[];
  /** Place ids, best-fit first — human judgment call. */
  idealTop3: string[];
  /** Ids that should never surface in the top 5 for this persona. */
  unacceptableInTop5?: string[];
};

export type ModelRunResult = {
  caseId: string;
  model: string;
  ranked: RankResult[];
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  hallucinatedIds: string[];
  droppedIds: string[];
};

export type ScoredResult = ModelRunResult & {
  hitAt1: boolean;
  recallAt3: number;
  unacceptableInTop5Count: number;
};
