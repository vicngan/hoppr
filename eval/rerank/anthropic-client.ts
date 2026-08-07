/**
 * Direct fetch to the Anthropic Messages API, deliberately mirroring
 * `supabase/functions/hoppr-rank/index.ts`'s request shape (same
 * system/schema/output_config) so results are comparable across models
 * without introducing an untested SDK dependency.
 */
import { SYSTEM, SCHEMA, buildUserMessage } from './prompt';
import type { RankCandidate, RankResult } from './types';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export type CallRankOutcome = {
  ranked: RankResult[];
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
};

export async function callRank(
  model: string,
  digest: string,
  candidates: RankCandidate[],
): Promise<CallRankOutcome> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to .env (see .env.example) before running the eval.',
    );
  }

  const started = Date.now();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: SYSTEM,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: [{ type: 'text', text: buildUserMessage(digest, candidates) }] }],
    }),
  });
  const latencyMs = Date.now() - started;

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`anthropic ${res.status} (model=${model}): ${detail}`);
  }

  const data = await res.json();
  const text = (data.content ?? []).find((b: { type: string }) => b.type === 'text')?.text ?? '{}';
  const parsed = JSON.parse(text) as { ranked?: { id: string; reason?: string }[] };

  return {
    ranked: (parsed.ranked ?? []).map((r) => ({ id: r.id, reason: String(r.reason ?? '') })),
    latencyMs,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}
