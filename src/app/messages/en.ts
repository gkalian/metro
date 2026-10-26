import type { Messages } from './ru';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** English texts; the keys and arguments follow the Russian ones. */
export const en: Messages = {
  minutes: (min) => `${min} min`,
  hoursMinutes: (hours, min) => `${hours} h ${min} min`,
  date: (day, month, year) => `${day} ${MONTHS[month]} ${year}`,

  horizonToday: 'today',
  horizonAllPlans: 'with all plans',
  horizonDecade: (decade) => `by the end of the ${decade}s`,
  horizonYear: (year) => `by ${year}`,
  chronologyAllPlans: 'all plans',
  tickNow: 'now',
  tickAll: 'all',
  tickDecade: (decade) => `${String(decade).slice(2)}s`,

  showPanel: 'Show panel',
  hidePanel: 'Hide panel',
  languageButton: 'Language: English. Switch to Russian',
  from: 'From',
  to: 'To',
  clear: 'Clear',
  plannedFor: (year) => `planned ${year}`,
  noDate: 'no date',
  nothingFound: 'Nothing found',
  legendRail: 'Railway lines',
  legendWalk: 'Walking transfer between railway and metro',

  hintPickTo: 'Now pick the destination — on the map or in the “To” field.',
  hintPickBoth: 'Click two stations on the map or pick them in the fields above to get the travel time.',
  noRoute: (horizon) => `No way between these stations in the network ${horizon} — move the year slider.`,
  transfers: (n) => `${n} ${n === 1 ? 'transfer' : 'transfers'}`,
  rideAndWalk: (ride, walk) => `on trains ${ride} · walking ${walk}`,
  noTransfers: 'no transfers',
  walkTo: (station) => `Transfer to “${station}”`,
  changeTrains: (station, lines) => `Change at “${station}” to a line ${lines.join(' or ')} train`,
  anyTrain: (lines) => `Any train of lines ${lines.join(' and ')}`,
  stopsBetween: (n) => `${n} ${n === 1 ? 'station' : 'stations'} in between`,
  noteEstimate: 'Estimated time, not counting the wait for a train.',
  noteFuture: 'The future network follows the development plan to 2040; dates may shift.',
  notePast: 'Past networks follow station opening dates; running times are today’s.',
  noteEstimatedRuns: 'Some running times are estimated from distance: there is no published data for them.',

  status: (status) => ({ open: 'In service.', construct: 'Under construction.', project: 'Planned.' })[status],
  opened: (date) => `Opened ${date}`,
  openingPlanned: (year) => `Planned opening: ${year}`,
  openingUnknown: 'Opening date not announced',
  railStation: 'Railway station',
  railRoutes: (routes) => `Suburban trains: ${routes.join('; ')}.`,
  railTrains: 'Suburban and long-distance trains.',
  railToMetro: (stations) => `Transfer to the metro: ${stations.map((s) => `“${s}”`).join(', ')}.`,
};
