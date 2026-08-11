// Hoppr — Ask question generator Edge Function.
// Receives THIS caller's own taste digest + recent answer context, asks Claude
// to generate ONE new multiple-choice question that probes something the
// profile doesn't yet reflect confidently, in the same shape the client's
// static question bank already uses (Question/QOption).
//
// Anti-hallucination contract, enforced in code (not just the prompt):
//   • Stateless + per-request scoping — the function only ever sees the caller's
//     own digest and answer context, so one user's history can't leak into
//     another's question. There is no shared store to bleed from.
//   • Tag whitelist — every key in every option's `deltas` is checked against
//     the real tag vocabulary; anything foreign is dropped rather than trusted.
//   • Id collision — a generated id that collides with `excludeIds` is rejected.
//
// Deploy:  supabase functions deploy hoppr-questions
// Secret:  reuses ANTHROPIC_API_KEY (same as hoppr-menu/hoppr-rank) — no new secret.

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-5';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Mirrors src/core/taste/tags.ts — kept in sync by hand (same duplication
// pattern hoppr-places uses for its own Tag union).
const TAGS_ENUM = [
  'quiet', 'lively', 'bright', 'moody',
  'study', 'hangout', 'drinks', 'food', 'coffee', 'photo',
  'outlets', 'comfy', 'solo', 'group', 'lingering', 'quick',
  'cheap', 'splurge',
];

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    axis: { type: 'string' },
    kicker: { type: 'string' },
    prompt: { type: 'string' },
    options: {
      // Anthropic's json_schema structured output only supports minItems/maxItems
      // of 0 or 1 on arrays — the 2-4 option count is enforced in code below instead.
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          // An open string-keyed map isn't expressible under Anthropic's strict
          // structured output (additionalProperties must be false, which then
          // requires every key spelled out as `properties` — and spelling out
          // all 18 tags trips its schema complexity limit). A fixed-shape array
          // of {tag, delta} pairs sidesteps both constraints; converted back to
          // the client's `Record<Tag, number>` shape below.
          deltas: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                tag: { type: 'string', enum: TAGS_ENUM },
                delta: { type: 'number' },
              },
              required: ['tag', 'delta'],
            },
          },
        },
        required: ['id', 'label', 'deltas'],
      },
    },
  },
  required: ['id', 'axis', 'kicker', 'prompt', 'options'],
};

const SYSTEM =
  'You generate ONE new multiple-choice question for Hoppr, a place-discovery app, ' +
  "to learn about ONE person's taste. Hoppr's tag vocabulary (the ONLY values allowed " +
  `for a "tag" in any option's "deltas" list) is: ${TAGS_ENUM.join(', ')}. ` +
  'Each option maps to a subset of these tags via `deltas: [{tag, delta}, ...]`, delta in ' +
  '[-1, 1] indicating how strongly picking it implies that tag ' +
  '(favor magnitudes 0.3-1.0; 1-3 tags per option is plenty). ' +
  "Write in Hoppr's voice: a short kicker (a few words), a one-sentence prompt, and 2-4 punchy, " +
  'concrete options (not vague "somewhat/very" scales). The question must be clearly different in ' +
  'wording and angle from every question already asked (given below), and should probe an axis or ' +
  "nuance the taste digest doesn't yet reflect confidently. Generate a short unique id (kebab-case, " +
  'no spaces) for the question and for each option, none of which may match any id in the exclude list.';

type AskedContext = { questionId: string; axis?: string; optionId: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');

    const { digest, askedContext, excludeIds } = (await req.json()) as {
      digest?: string;
      askedContext?: AskedContext[];
      excludeIds?: string[];
    };
    const exclude = Array.isArray(excludeIds) ? excludeIds.slice(0, 200) : [];
    const asked = Array.isArray(askedContext) ? askedContext.slice(0, 12) : [];

    const askedText =
      asked.length === 0
        ? '(none yet — this is their first question)'
        : asked.map((a) => `axis=${a.axis ?? '?'} picked=${a.optionId}`).join('; ');

    // A same digest + empty asked-context (e.g. right after "start fresh")
    // sends an identical prompt every time, which makes the model converge on
    // the same "obvious" opening question. Force real topic variety by
    // randomly assigning a focus tag the question must center on.
    const focusTag = TAGS_ENUM[Math.floor(Math.random() * TAGS_ENUM.length)];

    const userText =
      `Taste digest: ${digest ?? '(none yet)'}\n\n` +
      `Already asked (most recent first): ${askedText}\n\n` +
      `Exclude these ids (do not reuse): [${exclude.join(', ')}]\n\n` +
      `Center this question's options mostly around the tag "${focusTag}" (still following the ` +
      'axis/nuance guidance above) — don\'t mention the tag name itself, just let it drive the ' +
      'options.\n\n' +
      'Generate the next question now.';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 768,
        temperature: 1,
        system: SYSTEM,
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
        messages: [{ role: 'user', content: [{ type: 'text', text: userText }] }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return new Response(JSON.stringify({ error: `anthropic ${res.status}`, detail }), {
        status: 502,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    const data = await res.json();
    const text = (data.content ?? []).find((b: { type: string }) => b.type === 'text')?.text ?? '{}';
    const parsed = JSON.parse(text) as {
      id?: string;
      axis?: string;
      kicker?: string;
      prompt?: string;
      options?: { id: string; label: string; deltas?: { tag?: string; delta?: number }[] }[];
    };

    // ── The enforced anti-hallucination contract ──────────────────────────────
    if (!parsed.id || exclude.includes(parsed.id)) {
      return new Response(JSON.stringify({ error: 'invalid or colliding id' }), {
        status: 422,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }
    const tagSet = new Set(TAGS_ENUM);
    const options = (parsed.options ?? [])
      .map((o) => {
        const deltas: Record<string, number> = {};
        for (const { tag, delta } of o.deltas ?? []) {
          if (!tag || !tagSet.has(tag) || typeof delta !== 'number' || Number.isNaN(delta)) continue;
          deltas[tag] = Math.max(-1, Math.min(1, delta));
        }
        return { id: String(o.id ?? '').slice(0, 40), label: String(o.label ?? '').slice(0, 60), deltas };
      })
      .filter((o) => o.id && o.label)
      .slice(0, 4);

    if (options.length < 2) {
      return new Response(JSON.stringify({ error: 'not enough valid options' }), {
        status: 422,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    const out = {
      id: parsed.id.slice(0, 80),
      axis: String(parsed.axis ?? 'general').slice(0, 40),
      kicker: String(parsed.kicker ?? '').slice(0, 80),
      prompt: String(parsed.prompt ?? '').slice(0, 200),
      options,
    };

    return new Response(JSON.stringify(out), {
      headers: { ...cors, 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...cors, 'content-type': 'application/json' },
    });
  }
});
