/**
 * "Consecutive days with activity" streak, computed from real rating
 * timestamps (`library/store.ts`'s `ratings[id].at`). Shared by `home.tsx`'s
 * header pill and `profile.tsx`'s streak card so both surfaces agree.
 */
export function computeStreak(ratingTimestamps: number[]): number {
  if (ratingTimestamps.length === 0) return 0;
  const days = Array.from(
    new Set(ratingTimestamps.map((t) => Math.floor(t / 86400000))),
  ).sort((a, b) => b - a);
  const today = Math.floor(Date.now() / 86400000);
  if (days[0] !== today && days[0] !== today - 1) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] === 1) streak++;
    else break;
  }
  return streak;
}
