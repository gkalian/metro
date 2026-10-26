import { t } from './i18n';
import { decadeHorizons, isPast, openingYears, type Horizon, type Network } from '../domain/network';

/** Slider stops: history by decade, then today, then the scheme's years, then every plan. */
export const horizonsOf = (net: Network): Horizon[] => [...decadeHorizons(net), null, ...openingYears(net), Infinity];

/** E.g. «к концу 1970-х», to follow «в сети». */
export const horizonLabel = (h: Horizon): string =>
  h === null
    ? t('horizonToday')
    : h === Infinity
      ? t('horizonAllPlans')
      : isPast(h)
        ? t('horizonDecade', h - 9)
        : t('horizonYear', h);

/** What the «Хронология» heading adds; today is the default and goes unsaid. */
export const chronologyValue = (h: Horizon): string =>
  h === null ? '' : `: ${h === Infinity ? t('chronologyAllPlans') : horizonLabel(h)}`;

/** Short label under a slider stop. */
export const tickLabel = (h: Horizon): string =>
  h === null
    ? t('tickNow')
    : h === Infinity
      ? t('tickAll')
      : isPast(h)
        ? t('tickDecade', h - 9)
        : String(h);

/** The `year` URL parameter for a horizon, or null for today. */
export const yearParam = (h: Horizon): string | null => (h === null ? null : h === Infinity ? 'all' : String(h));

/** The horizon a `year` URL parameter names, if it is one of the stops. */
export const parseYear = (horizons: Horizon[], value: string | null): Horizon =>
  value === 'all' ? Infinity : (horizons.find((h) => h !== null && String(h) === value) ?? null);
