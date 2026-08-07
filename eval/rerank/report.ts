import type { ScoredResult } from './types';

/** $ per million tokens, input/output. Rough figures — re-check against
 * current Anthropic pricing before trusting the cost column for real budget
 * decisions; this is meant to compare models relative to each other, not to
 * be an exact invoice. */
const PRICING_PER_MTOK: Record<string, { input: number; output: number }> = {
  'claude-opus-4-8': { input: 15, output: 75 },
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number | null {
  const rate = PRICING_PER_MTOK[model];
  if (!rate) return null;
  return (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
}

type ModelSummary = {
  model: string;
  n: number;
  avgHitAt1: number;
  avgRecallAt3: number;
  totalHallucinated: number;
  totalDropped: number;
  avgUnacceptableInTop5: number;
  avgLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number | null;
};

function summarize(model: string, results: ScoredResult[]): ModelSummary {
  const n = results.length;
  const sum = (f: (r: ScoredResult) => number) => results.reduce((acc, r) => acc + f(r), 0);

  const totalInputTokens = sum((r) => r.inputTokens);
  const totalOutputTokens = sum((r) => r.outputTokens);
  const cost = estimateCost(model, totalInputTokens, totalOutputTokens);

  return {
    model,
    n,
    avgHitAt1: sum((r) => (r.hitAt1 ? 1 : 0)) / n,
    avgRecallAt3: sum((r) => r.recallAt3) / n,
    totalHallucinated: sum((r) => r.hallucinatedIds.length),
    totalDropped: sum((r) => r.droppedIds.length),
    avgUnacceptableInTop5: sum((r) => r.unacceptableInTop5Count) / n,
    avgLatencyMs: sum((r) => r.latencyMs) / n,
    totalInputTokens,
    totalOutputTokens,
    totalCost: cost,
  };
}

function pad(s: string, width: number): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

export function printComparisonTable(results: ScoredResult[]): void {
  const models = [...new Set(results.map((r) => r.model))];
  const summaries = models.map((model) => summarize(model, results.filter((r) => r.model === model)));

  const cols = [
    ['model', 18],
    ['n', 5],
    ['hit@1', 7],
    ['recall@3', 9],
    ['halluc.', 8],
    ['dropped', 8],
    ['unaccept@5', 11],
    ['latency(ms)', 12],
    ['in tok', 9],
    ['out tok', 9],
    ['~cost($)', 10],
  ] as const;

  console.log(cols.map(([name, w]) => pad(name, w)).join(''));
  console.log('-'.repeat(cols.reduce((a, [, w]) => a + w, 0)));

  for (const s of summaries) {
    const row = [
      s.model,
      String(s.n),
      s.avgHitAt1.toFixed(2),
      s.avgRecallAt3.toFixed(2),
      String(s.totalHallucinated),
      String(s.totalDropped),
      s.avgUnacceptableInTop5.toFixed(2),
      Math.round(s.avgLatencyMs).toString(),
      String(s.totalInputTokens),
      String(s.totalOutputTokens),
      s.totalCost == null ? 'n/a' : s.totalCost.toFixed(4),
    ];
    console.log(row.map((v, i) => pad(v, cols[i][1])).join(''));
  }
}
