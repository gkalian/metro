import { t } from '../app/i18n';

/** «7 мин», «1 ч 05 мин»; never less than a minute. */
export function formatTime(seconds: number): string {
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return t('minutes', min);
  return t('hoursMinutes', Math.floor(min / 60), String(min % 60).padStart(2, '0'));
}

/** For matching station names: case and «ё» do not matter. */
export const normalize = (s: string): string => s.toLowerCase().replaceAll('ё', 'е').trim();
