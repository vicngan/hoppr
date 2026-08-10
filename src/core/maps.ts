import type { Coords } from './engine/types';

/**
 * Google imagery for place cards. One client-side key (restrict it to your app)
 * covers both the Places Photo endpoint (real venue photos) and Static Maps
 * (location fallback). When unset, both helpers return null and the striped
 * placeholder shows instead.
 *
 * Enable on the key: "Places API (New)" + "Maps Static API".
 */
export const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
export const mapsConfigured = Boolean(mapsKey);

/**
 * A real photo of the venue. `photoName` is the Places (New) photo resource
 * name (`places/…/photos/…`) returned by the hoppr-places function.
 */
export function placePhotoUrl(photoName?: string | null, width = 400): string | null {
  if (!mapsKey || !photoName) return null;
  const w = Math.min(1600, Math.max(80, Math.round(width)));
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${w}&key=${mapsKey}`;
}

// Warm map styling to match Hoppr's palette (paper landscape, sand roads, POIs off).
const STYLES = [
  'feature:poi|visibility:off',
  'feature:transit|visibility:off',
  'feature:administrative|element:labels|visibility:simplified',
  'feature:landscape|color:0xefe8da',
  'feature:water|color:0xd9d2c2',
  'feature:road|element:geometry|color:0xe4dccb',
  'feature:road|element:labels|visibility:off',
];

/**
 * Static map centered on the place with a rust marker — the fallback image when
 * a venue has no photo. `size` is capped at 640 and rendered at scale 2.
 */
export function staticMapUrl(coords?: Coords, size = 400): string | null {
  if (!mapsKey || !coords) return null;
  const s = Math.min(640, Math.max(80, Math.round(size)));
  const c = `${coords.lat},${coords.lng}`;
  const styleParams = STYLES.map((v) => `style=${encodeURIComponent(v)}`).join('&');
  return (
    'https://maps.googleapis.com/maps/api/staticmap' +
    `?center=${c}&zoom=15&size=${s}x${s}&scale=2` +
    `&markers=${encodeURIComponent('color:0xC8431C|' + c)}` +
    `&${styleParams}&key=${mapsKey}`
  );
}
