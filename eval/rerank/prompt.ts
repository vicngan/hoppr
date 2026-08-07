/**
 * Mirrors the SYSTEM/SCHEMA/user-message format in
 * `supabase/functions/hoppr-rank/index.ts` — that function runs in Deno and
 * can't be imported into this Node script, so this is a deliberate duplicate.
 * Keep in sync manually; `eval/rerank/sync-check.ts` is the drift tripwire
 * that fails loudly if this copy and the edge function disagree.
 */
import type { RankCandidate } from './types';

export const SYSTEM =
  'You re-rank a fixed list of candidate places for ONE person, using their ' +
  'taste digest. Order best-fit first. You MUST only use ids that appear in the ' +
  'provided candidate list — never invent, merge, rename, or emit an id that is ' +
  'not present. `reason` is one short second-person sentence (max ~12 words) ' +
  'naming the concrete reason it fits them. Return every candidate exactly once.';

export const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ranked: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['id', 'reason'],
      },
    },
  },
  required: ['ranked'],
};

export function buildUserMessage(digest: string, candidates: RankCandidate[]): string {
  return (
    `Taste digest: ${digest ?? '(none yet)'}\n\n` +
    `Candidates (id — name — details):\n` +
    candidates
      .map(
        (c) =>
          `${c.id} — ${c.name ?? '?'} — ${c.category ?? '?'}, ${c.area ?? '?'}, ` +
          `price ${c.price ?? '?'}, popularity ${c.popularity ?? '?'}, ` +
          `tags [${(c.tags ?? []).join(', ')}]`,
      )
      .join('\n') +
    `\n\nReturn ALL ${candidates.length} ids, best-fit first, each with a reason.`
  );
}
