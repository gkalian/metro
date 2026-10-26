import { lang, nameOf, noteDate, t } from '../app/i18n';
import { isOpen, lineAt, linesAt, type Exit, type Horizon, type Line, type Network, type Station } from '../domain/network';
import { routesAt, type Railway, type RailStation } from '../domain/railway';
import { h } from '../ui/dom';

const notes = (texts: (string | false | undefined)[]) =>
  texts.filter((t): t is string => !!t).map((text) => h('span', { className: 'tip__note', textContent: text }));

/** The notes in the data are written in Russian; other languages get only the dates. */
const fullNotes = () => lang() === 'ru';

const lineLabel = (line: Line) =>
  h('span', { className: 'tip__line', textContent: `${line.id} · ${nameOf(line)}`, css: { '--line': line.color } });

/** Without the notes, only the date: when the station opened or is due to. */
function shortOpening(s: Station): string {
  if (isOpen(s) && s.opened) return t('opened', noteDate(s.note, s.opened));
  return s.opening ? t('openingPlanned', s.opening) : t('openingUnknown');
}

/** Name, lines calling within the horizon, status and notes of a metro station. */
export function stationTooltip(net: Network, s: Station, horizon: Horizon): HTMLElement {
  return h(
    'div',
    { className: 'tip' },
    h('strong', { textContent: nameOf(s) }),
    ...linesAt(net, s, horizon).map(lineLabel),
    ...notes(
      fullNotes()
        ? [
            !isOpen(s) && !s.passThrough && t('status', s.status),
            !isOpen(s) && (s.opening ? t('openingPlanned', s.opening) : t('openingUnknown')),
            s.note,
          ]
        : [shortOpening(s)],
    ),
  );
}

/** Station, its line within the horizon and where a far exit comes up. */
export function exitTooltip(net: Network, e: Exit, horizon: Horizon): HTMLElement {
  const s = net.stations.get(e.station)!;
  return h(
    'div',
    { className: 'tip' },
    h('strong', { textContent: nameOf(s) }),
    lineLabel(lineAt(net, s, horizon)),
    ...notes(fullNotes() ? [`${e.name}: ${e.address}.`, e.note] : [t('opened', noteDate(e.note, e.opened ?? s.opened!))]),
  );
}

/** Name, suburban routes and metro links of a rail station. */
export function railTooltip(net: Network, rail: Railway, s: RailStation): HTMLElement {
  const routes = routesAt(rail, s.id).map((r) => r.name);
  const metro = (s.metro ?? []).map((id) => nameOf(net.stations.get(id)!));
  return h(
    'div',
    { className: 'tip' },
    h('strong', { textContent: nameOf(s) }),
    h('span', { className: 'tip__line tip__line--rail', textContent: t('railStation') }),
    // route names are Russian only
    ...(fullNotes()
      ? notes([routes.length ? t('railRoutes', routes) : t('railTrains'), metro.length > 0 && t('railToMetro', metro)])
      : []),
  );
}
