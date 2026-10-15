import { tr } from '../app/i18n';

/** «7 мин», «1 ч 05 мин»; never less than a minute. */
export function formatTime(seconds: number): string {
  const min = Math.max(1, Math.round(seconds / 60));
  const m = tr('мин', 'min');
  if (min < 60) return `${min} ${m}`;
  return `${Math.floor(min / 60)} ${tr('ч', 'h')} ${String(min % 60).padStart(2, '0')} ${m}`;
}

/** Russian plural form for `n`: «1 станция», «2 станции», «5 станций». */
export function plural(n: number, one: string, few: string, many: string): string {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return one;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few;
  return many;
}

/** «1 станция» / «1 station»: the count with the word in the current language. */
export const count = (n: number, ru: [one: string, few: string, many: string], en: [one: string, many: string]): string =>
  `${n} ${tr(plural(n, ...ru), n === 1 ? en[0] : en[1])}`;

/** For matching station names: case and «ё» do not matter. */
export const normalize = (s: string): string => s.toLowerCase().replaceAll('ё', 'е').trim();
