// Hoppr — Together (group planning) Edge Function.
// Small RPC over the `hops` tables: the host publishes the authoritative Hop
// state, no-account friends join by code. The service-role key stays
// server-side so joiners need no auth session.
//
// Deploy:  supabase functions deploy hoppr-hop
// Needs no new secrets — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected
// automatically in the Edge runtime.
//
// Body: { action, ... }
//   create  { hop }          → upsert a hop from the host's serialized state
//   publish { hop }          → write authoritative state + status for a hop
//   join    { code, name }   → add a member to the coded hop → { hop, memberId }
//   get     { id? , code? }  → fetch a hop → { hop }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });

// ── the Hop shape we round-trip (mirrors src/core/together/types.ts) ─────────
type HopMember = {
  id: string;
  name: string;
  kind: 'you' | 'friend';
  emoji: string;
  answered: boolean;
  profile: unknown;
  swipes: Record<string, boolean>;
  swipedDone: boolean;
};
type Hop = {
  id: string;
  code: string;
  title: string;
  createdAt: number;
  status: string;
  hostId: string;
  members: HopMember[];
  shortlist: string[];
  pickId: string | null;
  slotId: string | null;
  slotVotes: Record<string, string[]>;
};

function client() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

// Upsert the top-level hop row + its authoritative state snapshot.
async function upsertHop(db: ReturnType<typeof client>, hop: Hop) {
  const { error } = await db.from('hops').upsert(
    {
      id: hop.id,
      code: hop.code,
      title: hop.title,
      host_id: hop.hostId,
      status: hop.status,
      state: hop,
    },
    { onConflict: 'id' },
  );
  if (error) throw new Error(error.message);
}

// Best-effort mirror of members into the normalized table (never blocks).
async function mirrorMembers(db: ReturnType<typeof client>, hop: Hop) {
  try {
    const rows = hop.members.map((m) => ({
      hop_id: hop.id,
      member_id: m.id,
      name: m.name,
      emoji: m.emoji,
      kind: m.kind,
      answered: m.answered,
      swiped_done: m.swipedDone,
      profile: m.profile ?? null,
      swipes: m.swipes ?? {},
    }));
    if (rows.length) await db.from('hop_members').upsert(rows, { onConflict: 'hop_id,member_id' });
  } catch (_e) {
    // opportunistic — a mirror miss must not fail the host's publish
  }
}

async function fetchHop(
  db: ReturnType<typeof client>,
  by: { id?: string; code?: string },
): Promise<Hop | null> {
  let q = db.from('hops').select('state').limit(1);
  if (by.id) q = q.eq('id', by.id);
  else if (by.code) q = q.eq('code', by.code);
  else throw new Error('missing id or code');
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.state as Hop) ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const db = client();
    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    switch (action) {
      case 'create':
      case 'publish': {
        const hop = body?.hop as Hop | undefined;
        if (!hop || !hop.id || !hop.code) throw new Error('missing hop');
        await upsertHop(db, hop);
        await mirrorMembers(db, hop);
        return json({ ok: true, hop });
      }

      case 'join': {
        const code = String(body?.code ?? '').trim();
        const name = String(body?.name ?? 'Guest').trim() || 'Guest';
        if (!code) throw new Error('missing code');

        const hop = await fetchHop(db, { code });
        if (!hop) return json({ error: 'no such hop' }, 404);

        // Generate this joiner's member id and add them to the table + state.
        const memberId = `m_${crypto.randomUUID().slice(0, 8)}`;
        const member: HopMember = {
          id: memberId,
          name,
          kind: 'friend',
          emoji: '🐇',
          answered: false,
          profile: { weights: {}, answers: [] },
          swipes: {},
          swipedDone: false,
        };

        const next: Hop = { ...hop, members: [...hop.members, member] };
        await upsertHop(db, next);
        await db
          .from('hop_members')
          .upsert(
            {
              hop_id: next.id,
              member_id: memberId,
              name,
              emoji: member.emoji,
              kind: 'friend',
              answered: false,
              swiped_done: false,
              profile: member.profile,
              swipes: {},
            },
            { onConflict: 'hop_id,member_id' },
          );

        return json({ hop: next, memberId });
      }

      case 'get': {
        const id = body?.id ? String(body.id) : undefined;
        const code = body?.code ? String(body.code) : undefined;
        if (!id && !code) throw new Error('missing id or code');
        const hop = await fetchHop(db, { id, code });
        if (!hop) return json({ error: 'no such hop' }, 404);
        return json({ hop });
      }

      default:
        return json({ error: `unknown action: ${action ?? '(none)'}` }, 400);
    }
  } catch (e) {
    return json({ error: String(e) }, 400);
  }
});
