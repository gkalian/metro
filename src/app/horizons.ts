import { tr } from './i18n';
import { decadeHorizons, isPast, openingYears, type Horizon, type Network } from '../domain/network';

/** Slider stops: history by decade, then today, then the scheme's years, then every plan. */
export const horizonsOf = (net: Network): Horizon[] => [...decadeHorizons(net), null, ...openingYears(net), Infinity];

/** E.g. «к концу 1970-х», to follow «в сети». */
export const horizonLabel = (h: Horizon): string =>
  h === null
    ? tr('на сегодня', 'today')
    : h === Infinity
      ? tr('на все планы', 'with all plans')
      : isPast(h)
        ? tr(`к концу ${h - 9}-х`, `by the end of the ${h - 9}s`)
        : tr(`на ${h}`, `by ${h}`);

/** What the «Хронология» heading adds; today is the default and goes unsaid. */
export const chronologyValue = (h: Horizon): string =>
  h === null ? '' : `: ${h === Infinity ? tr('все планы', 'all plans') : horizonLabel(h)}`;

/** Short label under a slider stop. */
export const tickLabel = (h: Horizon): string =>
  h === null
    ? tr('сейчас', 'now')
    : h === Infinity
      ? tr('все', 'all')
      : isPast(h)
        ? `${String(h - 9).slice(2)}${tr('-е', 's')}`
        : String(h);

/** The `year` URL parameter for a horizon, or null for today. */
export const yearParam = (h: Horizon): string | null => (h === null ? null : h === Infinity ? 'all' : String(h));

/** The horizon a `year` URL parameter names, if it is one of the stops. */
export const parseYear = (horizons: Horizon[], value: string | null): Horizon =>
  value === 'all' ? Infinity : (horizons.find((h) => h !== null && String(h) === value) ?? null);
