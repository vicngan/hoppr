// Hoppr — nearby places Edge Function.
// Takes a location and returns real venues shaped exactly like the app's Place
// type, sourced from the Google Places API (New). The Google key stays
// server-side. Results are best-effort cached into the `places` table so the
// crowdsourced dataset grows as people explore.
//
// Deploy:  supabase functions deploy hoppr-places
// Secret:  supabase secrets set GOOGLE_PLACES_API_KEY=...
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically in the
// Edge runtime — no need to set them yourself.

const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── the app's Place shape (mirrors src/core/places.ts) ──────────────────────
type PlaceCategory = 'cafe' | 'bar' | 'restaurant' | 'study' | 'photo' | 'bakery';
type Tag =
  | 'coffee' | 'quiet' | 'lively' | 'bright' | 'moody' | 'study' | 'hangout'
  | 'drinks' | 'food' | 'photo' | 'outlets' | 'comfy' | 'solo' | 'group'
  | 'lingering' | 'quick' | 'cheap' | 'splurge';
type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  area: string;
  coords: { lat: number; lng: number };
  popularity: number; // 0..1
  price: number; // 1..3
  tags: Tag[];
  blurb: string;
  photo?: string;
  rating?: number;
  reviewCount?: number;
};

// ── minimal shape of a Google Places (New) result we care about ─────────────
type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  shortFormattedAddress?: string;
  editorialSummary?: { text?: string };
  photos?: { name?: string }[];
};

// Google type string → our category + a small set of base tags. First matching
// type in a result wins; everything falls back to a plain restaurant.
const TYPE_MAP: Record<string, { category: PlaceCategory; tags: Tag[] }> = {
  cafe: { category: 'cafe', tags: ['coffee'] },
  coffee_shop: { category: 'cafe', tags: ['coffee'] },
  bar: { category: 'bar', tags: ['drinks', 'lively'] },
  night_club: { category: 'bar', tags: ['drinks', 'lively'] },
  bakery: { category: 'bakery', tags: ['coffee', 'quick', 'cheap'] },
  book_store: { category: 'study', tags: ['study', 'quiet'] },
  library: { category: 'study', tags: ['study', 'quiet'] },
  art_gallery: { category: 'photo', tags: ['photo', 'bright'] },
  tourist_attraction: { category: 'photo', tags: ['photo', 'bright'] },
  park: { category: 'photo', tags: ['photo', 'bright'] },
  restaurant: { category: 'restaurant', tags: ['food'] },
  meal_takeaway: { category: 'restaurant', tags: ['food'] },
  food: { category: 'restaurant', tags: ['food'] },
};

const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 2,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 3,
};

function categoryFor(types: string[]): { category: PlaceCategory; tags: Tag[] } {
  for (const t of types) {
    if (TYPE_MAP[t]) return TYPE_MAP[t];
  }
  return { category: 'restaurant', tags: ['food'] };
}

function popularityFor(rating?: number, count?: number): number {
  if (!rating) return 0.6;
  const ratingPart = (rating / 5) * 0.85;
  const countPart = Math.min((count ?? 0) / 500, 1) * 0.15;
  return Math.min(1, ratingPart + countPart);
}

function priceFor(priceLevel?: string): number {
  const p = priceLevel ? PRICE_MAP[priceLevel] ?? 2 : 2;
  return Math.max(1, Math.min(3, p));
}

function mapPlace(place: GooglePlace): Place {
  const { category, tags } = categoryFor(place.types ?? []);
  const area = (place.shortFormattedAddress ?? '').split(',')[0].trim();
  const blurb = place.editorialSummary?.text ?? `A nearby ${category}.`;
  return {
    id: 'g:' + (place.id ?? ''),
    name: place.displayName?.text ?? '',
    category,
    area,
    coords: {
      lat: place.location?.latitude ?? 0,
      lng: place.location?.longitude ?? 0,
    },
    popularity: popularityFor(place.rating, place.userRatingCount),
    price: priceFor(place.priceLevel),
    tags,
    blurb,
    photo: place.photos?.[0]?.name,
    rating: place.rating,
    reviewCount: place.userRatingCount,
  };
}

// Best-effort write to the `places` cache. Never throws — a cache miss must not
// fail the user's request.
async function cachePlaces(places: Place[]): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || places.length === 0) return;
  try {
    const rows = places.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      area: p.area,
      lat: p.coords.lat,
      lng: p.coords.lng,
      popularity: p.popularity,
      price: p.price,
      tags: p.tags,
      blurb: p.blurb,
      photo: p.photo ?? null,
      rating: p.rating ?? null,
      review_count: p.reviewCount ?? null,
      source: 'google',
    }));
    await fetch(`${SUPABASE_URL}/rest/v1/places?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'content-type': 'application/json',
        prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(rows),
    });
  } catch (_e) {
    // swallow — caching is opportunistic
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (!GOOGLE_PLACES_API_KEY) throw new Error('GOOGLE_PLACES_API_KEY not set');
    // `keyword` is accepted for API symmetry; searchNearby has no free-text
    // field, so we ignore it here (use searchText if keyword filtering matters).
    const { lat, lng, radius } = await req.json();
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('missing lat/lng');
    }

    const body: Record<string, unknown> = {
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: typeof radius === 'number' ? radius : 4000,
        },
      },
    };

    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.location,places.types,places.rating,' +
          'places.userRatingCount,places.priceLevel,places.shortFormattedAddress,' +
          'places.editorialSummary,places.photos',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      return new Response(JSON.stringify({ error: `google ${res.status}`, detail }), {
        status: 502,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    const data = await res.json();
    const places: Place[] = (data.places ?? []).map(mapPlace);

    // Opportunistically grow the crowdsourced dataset; never blocks the response.
    await cachePlaces(places);

    return new Response(JSON.stringify({ places }), {
      headers: { ...cors, 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...cors, 'content-type': 'application/json' },
    });
  }
});
