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

/** Longest run of consecutive active days anywhere in the rating history. */
export function computeMaxStreak(ratingTimestamps: number[]): number {
  if (ratingTimestamps.length === 0) return 0;
  const days = Array.from(new Set(ratingTimestamps.map((t) => Math.floor(t / 86400000)))).sort(
    (a, b) => a - b,
  );
  let max = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] === 1) {
      run++;
      max = Math.max(max, run);
    } else {
      run = 1;
    }
  }
  return max;
}

export type StreakDay = { iso: string; weekdayLabel: string; dayNum: number; active: boolean; isToday: boolean };

/** Per-day activity for the trailing `days` days, for a horizontal streak strip. */
export function computeStreakDays(ratingTimestamps: number[], days = 21): StreakDay[] {
  const activeDays = new Set(ratingTimestamps.map((t) => Math.floor(t / 86400000)));
  const todayNum = Math.floor(Date.now() / 86400000);
  const out: StreakDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayNum = todayNum - i;
    const d = new Date(dayNum * 86400000);
    out.push({
      iso: d.toISOString().slice(0, 10),
      weekdayLabel: d.toLocaleDateString(undefined, { weekday: 'short' }),
      dayNum: d.getDate(),
      active: activeDays.has(dayNum),
      isToday: dayNum === todayNum,
    });
  }
  return out;
}
