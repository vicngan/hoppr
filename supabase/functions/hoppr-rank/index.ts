// Hoppr — place ranking Edge Function (the hybrid reco "flip point").
// Receives THIS caller's own taste digest + candidate places, asks Claude to
// re-rank and explain ONLY those candidates, and returns the ordering. The
// Anthropic key stays server-side.
//
// Anti-hallucination contract, enforced in code (not just the prompt):
//   • Stateless + per-request scoping — the function only ever sees the caller's
//     own digest and candidate list, so one user's places can't leak into
//     another's ranking. There is no shared store to bleed from.
//   • Id-whitelist — every id Claude returns is intersected against the input
//     candidate set; anything foreign (a hallucinated or cross-tenant id) is
//     dropped, and omitted candidates are appended, so the output is a
//     permutation-with-reasons of exactly the input.
//
// Deploy:  supabase functions deploy hoppr-rank
// Secret:  reuses ANTHROPIC_API_KEY (same as hoppr-menu) — no new secret.

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-5';

// Cap candidates so cost/latency stay bounded at scale.
const MAX_CANDIDATES = 30;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Structured-outputs schema — the model may only return { ranked: [{id, reason}] }.
const SCHEMA = {
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

const SYSTEM =
  'You re-rank a fixed list of candidate places for ONE person, using their ' +
  'taste digest. Order best-fit first. You MUST only use ids that appear in the ' +
  'provided candidate list — never invent, merge, rename, or emit an id that is ' +
  'not present. `reason` is one short second-person sentence (max ~12 words) ' +
  'naming the concrete reason it fits them. Return every candidate exactly once.';

type Candidate = {
  id: string;
  name?: string;
  category?: string;
  tags?: string[];
  area?: string;
  price?: number;
  popularity?: number;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');

    const { digest, candidates } = (await req.json()) as {
      digest?: string;
      candidates?: Candidate[];
    };
    const cands = Array.isArray(candidates) ? candidates.slice(0, MAX_CANDIDATES) : [];
    if (cands.length === 0) {
      return new Response(JSON.stringify({ ranked: [] }), {
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    const userText =
      `Taste digest: ${digest ?? '(none yet)'}\n\n` +
      `Candidates (id — name — details):\n` +
      cands
        .map(
          (c) =>
            `${c.id} — ${c.name ?? '?'} — ${c.category ?? '?'}, ${c.area ?? '?'}, ` +
            `price ${c.price ?? '?'}, popularity ${c.popularity ?? '?'}, ` +
            `tags [${(c.tags ?? []).join(', ')}]`,
        )
        .join('\n') +
      `\n\nReturn ALL ${cands.length} ids, best-fit first, each with a reason.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
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
    const parsed = JSON.parse(text) as { ranked?: { id: string; reason?: string }[] };

    // ── The enforced anti-hallucination contract ──────────────────────────────
    const allowed = new Set(cands.map((c) => c.id));
    const seen = new Set<string>();
    const out: { id: string; reason: string }[] = [];
    for (const r of parsed.ranked ?? []) {
      if (!allowed.has(r.id) || seen.has(r.id)) continue; // drop foreign + dupes
      seen.add(r.id);
      out.push({ id: r.id, reason: String(r.reason ?? '').slice(0, 140) });
    }
    for (const c of cands) if (!seen.has(c.id)) out.push({ id: c.id, reason: '' }); // keep omissions

    return new Response(JSON.stringify({ ranked: out }), {
      headers: { ...cors, 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...cors, 'content-type': 'application/json' },
    });
  }
});
