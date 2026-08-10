import { supabase, isSupabaseConfigured } from '../supabase';
import { TAGS, type Tag } from '../taste/tags';
import type { Question, QOption } from '../questions';

/**
 * Client gateway to the Claude question-generator (the `hoppr-questions` Edge
 * Function). Mirrors `ai/rank.ts`: the Anthropic key never ships in the app,
 * and until a backend is connected `aiQuestionAvailable()` is false so callers
 * fall back to the static question bank.
 */
export function aiQuestionAvailable(): boolean {
  return isSupabaseConfigured && supabase != null;
}

/** One past answer, compact context so Claude can avoid repeating ground already covered. */
export type AskedContext = {
  questionId: string;
  axis?: string;
  optionId: string;
};

const VALID_TAGS = new Set<string>(Object.values(TAGS));
const MAX_ASKED_CONTEXT = 12;

const clamp = (n: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, n));

/**
 * Ask Claude to generate one fresh, non-repetitive question for this caller's
 * own taste profile. Returns `null` (never throws) on an unusable/invalid
 * response so the caller can silently fall back to the rules engine — only
 * network/config errors throw. Every `deltas` key is re-validated against the
 * real `Tag` vocabulary; unknown keys are dropped rather than rejecting the
 * whole question, matching the "salvage what's valid" spirit of `rank.ts`.
 */
export async function aiNextQuestion(
  digest: string,
  askedContext: AskedContext[],
  excludeIds: string[],
): Promise<Question | null> {
  if (!supabase) throw new Error('AI backend not configured');

  const { data, error } = await supabase.functions.invoke('hoppr-questions', {
    body: {
      digest,
      askedContext: askedContext.slice(0, MAX_ASKED_CONTEXT),
      excludeIds,
    },
  });
  if (error) return null;

  return validateQuestion(data, excludeIds);
}

function validateQuestion(raw: unknown, excludeIds: string[]): Question | null {
  if (!raw || typeof raw !== 'object') return null;
  const q = raw as Partial<Question>;
  if (typeof q.id !== 'string' || !q.id || excludeIds.includes(q.id)) return null;
  if (typeof q.axis !== 'string' || !q.axis) return null;
  if (typeof q.kicker !== 'string' || !q.kicker) return null;
  if (typeof q.prompt !== 'string' || !q.prompt) return null;
  if (!Array.isArray(q.options)) return null;

  const options: QOption[] = [];
  for (const opt of q.options) {
    const validated = validateOption(opt);
    if (validated) options.push(validated);
  }
  if (options.length < 2) return null;

  return {
    id: q.id.slice(0, 80),
    axis: q.axis.slice(0, 40),
    kicker: q.kicker.slice(0, 80),
    prompt: q.prompt.slice(0, 200),
    options: options.slice(0, 4),
  };
}

function validateOption(raw: unknown): QOption | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<QOption>;
  if (typeof o.id !== 'string' || !o.id) return null;
  if (typeof o.label !== 'string' || !o.label) return null;
  if (!o.deltas || typeof o.deltas !== 'object') return null;

  const deltas: Partial<Record<Tag, number>> = {};
  for (const [tag, delta] of Object.entries(o.deltas)) {
    if (!VALID_TAGS.has(tag) || typeof delta !== 'number' || Number.isNaN(delta)) continue;
    deltas[tag as Tag] = clamp(delta);
  }

  return { id: o.id.slice(0, 40), label: o.label.slice(0, 60), deltas };
}
