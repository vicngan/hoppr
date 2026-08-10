// Hoppr — menu OCR Edge Function.
// Receives a base64 menu photo, extracts structured menu items with Claude
// vision, and returns them as JSON. The Anthropic key stays server-side.
//
// Deploy:  supabase functions deploy hoppr-menu
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-opus-4-8';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Structured-outputs schema — guarantees the model returns exactly this shape.
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          price: { type: ['number', 'null'] },
          section: { type: 'string' },
          description: { type: 'string' },
          tags: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['light', 'hearty', 'sweet', 'savory', 'spicy', 'caffeine', 'alcohol', 'small', 'large', 'sharing'],
            },
          },
          dietary: {
            type: 'array',
            items: { type: 'string', enum: ['veg', 'vegan', 'gf', 'dairy_free'] },
          },
        },
        required: ['name', 'price', 'section', 'description', 'tags', 'dietary'],
      },
    },
  },
  required: ['items'],
};

const PROMPT =
  'You are digitizing a restaurant or cafe menu from a photo. Extract every ' +
  'orderable item. For each: the name; the price as a number (null if not ' +
  'shown); the menu section/heading it sits under; a short description if the ' +
  'menu gives one (else empty string); attribute tags from the allowed set that ' +
  'plausibly apply (portion size, flavor, caffeine/alcohol); and dietary flags ' +
  'only when the menu explicitly marks them (V, VG, GF, DF). Do not invent ' +
  'prices or dietary flags. Ignore headers, hours, and non-food text.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
    const { image, mimeType } = await req.json();
    if (!image) throw new Error('missing image');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16000,
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType ?? 'image/jpeg', data: image } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
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
    // With structured outputs the first text block is JSON matching SCHEMA.
    const text = (data.content ?? []).find((b: { type: string }) => b.type === 'text')?.text ?? '{}';
    const parsed = JSON.parse(text);

    return new Response(JSON.stringify({ items: parsed.items ?? [] }), {
      headers: { ...cors, 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...cors, 'content-type': 'application/json' },
    });
  }
});
