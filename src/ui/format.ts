/** «7 мин», «1 ч 05 мин»; never less than a minute. */
export function formatTime(seconds: number): string {
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return `${min} мин`;
  return `${Math.floor(min / 60)} ч ${String(min % 60).padStart(2, '0')} мин`;
}

/** Russian plural form for `n`: «1 станция», «2 станции», «5 станций». */
export function plural(n: number, one: string, few: string, many: string): string {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return one;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few;
  return many;
}

/** For matching station names: case and «ё» do not matter. */
export const normalize = (s: string): string => s.toLowerCase().replaceAll('ё', 'е').trim();
