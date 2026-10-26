import { t } from './i18n';
import { decadeHorizons, isPast, openingYears, yearHorizons, type Horizon, type Network } from '../domain/network';

/** The year slider of a city: its stops and how each is named. */
export interface Timeline {
  /** History, then today, then the scheme's years, then every plan. */
  stops: Horizon[];
  /** E.g. «к концу 1970-х», to follow «в сети». */
  label: (h: Horizon) => string;
  /** What the «Хронология» heading adds; today is the default and goes unsaid. */
  heading: (h: Horizon) => string;
  /** Short label under a stop. */
  tick: (h: Horizon) => string;
}

/** History steps by decade, or by the years in which stations opened. */
export function timelineOf(net: Network, history: 'decades' | 'years'): Timeline {
  const decades = history === 'decades';
  const past = decades ? decadeHorizons(net) : yearHorizons(net);
  const label = (h: Horizon): string =>
    h === null
      ? t('horizonToday')
      : h === Infinity
        ? t('horizonAllPlans')
        : !isPast(net, h)
          ? t('horizonYear', h)
          : decades
            ? t('horizonDecade', h - 9)
            : t('horizonEndOfYear', h);
  return {
    stops: [...past, null, ...openingYears(net), Infinity],
    label,
    heading: (h) => (h === null ? '' : `: ${h === Infinity ? t('chronologyAllPlans') : label(h)}`),
    tick: (h) =>
      h === null ? t('tickNow') : h === Infinity ? t('tickAll') : decades && isPast(net, h) ? t('tickDecade', h - 9) : String(h),
  };
}

/** The `year` URL parameter for a horizon, or null for today. */
export const yearParam = (h: Horizon): string | null => (h === null ? null : h === Infinity ? 'all' : String(h));

/** The horizon a `year` URL parameter names, if it is one of the stops. */
export const parseYear = (horizons: Horizon[], value: string | null): Horizon =>
  value === 'all' ? Infinity : (horizons.find((h) => h !== null && String(h) === value) ?? null);
