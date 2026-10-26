/**
 * Interface texts in Russian. The other languages must give every key with the same
 * arguments (see `Messages`), so a text missing from a translation fails to compile.
 */
import type { Status } from '../../domain/network';

/** Russian plural form for `n`: «1 станция», «2 станции», «5 станций». */
export function plural(n: number, one: string, few: string, many: string): string {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return one;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few;
  return many;
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export const ru = {
  // time and dates
  minutes: (min: number) => `${min} мин`,
  hoursMinutes: (hours: number, min: string) => `${hours} ч ${min} мин`,
  /** `month` counts from 0. */
  date: (day: number, month: number, year: number) => `${day} ${MONTHS[month]} ${year} года`,

  // slider, after «в сети»
  horizonToday: 'на сегодня',
  horizonAllPlans: 'на все планы',
  horizonDecade: (decade: number) => `к концу ${decade}-х`,
  horizonYear: (year: number) => `на ${year}`,
  chronologyAllPlans: 'все планы',
  tickNow: 'сейчас',
  tickAll: 'все',
  tickDecade: (decade: number) => `${String(decade).slice(2)}-е`,

  // panel
  showPanel: 'Развернуть панель',
  hidePanel: 'Свернуть панель',
  languageButton: 'Язык: русский. Переключить на английский',
  from: 'Откуда',
  to: 'Куда',
  clear: 'Очистить',
  plannedFor: (year: number) => `план ${year}`,
  noDate: 'без срока',
  nothingFound: 'Ничего не найдено',
  legendRail: 'Железнодорожные линии',
  legendWalk: 'Пеший переход между станциями ж/д и метро',

  // route
  hintPickTo: 'Теперь выберите станцию назначения — на карте или в поле «Куда».',
  hintPickBoth: 'Нажмите на две станции на карте или выберите их в полях выше — посчитаем время в пути.',
  noRoute: (horizon: string) => `В сети ${horizon} между этими станциями нет пути — сдвиньте ползунок года.`,
  transfers: (n: number) => `${n} ${plural(n, 'пересадка', 'пересадки', 'пересадок')}`,
  rideAndWalk: (ride: string, walk: string) => `в поездах ${ride} · переходы ${walk}`,
  noTransfers: 'без пересадок',
  walkTo: (station: string) => `Переход на «${station}»`,
  changeTrains: (station: string, lines: string[]) => `На «${station}» — пересадка на поезд линии ${lines.join(' или ')}`,
  anyTrain: (lines: string[]) => `Любой поезд линий ${lines.join(' и ')}`,
  stopsBetween: (n: number) => `${n} ${plural(n, 'станция', 'станции', 'станций')} без пересадки`,
  noteEstimate: 'Время расчётное, без ожидания поезда.',
  noteFuture: 'Будущая сеть — по схеме развития до 2040 года; сроки могут сдвинуться.',
  notePast: 'Сеть прошлых лет — по датам открытия станций; время перегонов — сегодняшнее.',
  noteEstimatedRuns: 'Часть перегонов оценена по расстоянию — по ним нет опубликованных данных.',

  // tooltips
  status: (status: Status) => ({ open: 'Действует.', construct: 'Строится.', project: 'Проектируется.' })[status],
  opened: (date: string) => `Открыта ${date}`,
  openingPlanned: (year: number) => `Открытие по плану — ${year}.`,
  openingUnknown: 'Срок открытия не назван.',
  railStation: 'Железнодорожная станция',
  railRoutes: (routes: string[]) => `Электрички: ${routes.join('; ')}.`,
  railTrains: 'Пригородные и дальние поезда.',
  railToMetro: (stations: string[]) => `Пересадка на метро: ${stations.map((s) => `«${s}»`).join(', ')}.`,
};

export type Messages = typeof ru;
