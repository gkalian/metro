import { englishDate, lang, nameOf } from '../app/i18n';
import { isOpen, lineAt, STATUS_LABEL, type Exit, type Horizon, type Line, type Network, type Station } from '../domain/network';
import { routesAt, type Railway, type RailStation } from '../domain/railway';
import { h } from '../ui/dom';

const notes = (texts: (string | false | undefined)[]) =>
  texts.filter((t): t is string => !!t).map((text) => h('span', { className: 'tip__note', textContent: text }));

const lineLabel = (line: Line) =>
  h('span', { className: 'tip__line', textContent: `${line.id} · ${nameOf(line)}`, css: { '--line': line.color } });

/** In English only the date: when the station opened or is due to. */
function englishOpening(s: Station): string {
  if (isOpen(s) && s.opened) return `Opened ${englishDate(s.note, s.opened)}`;
  return s.opening ? `Planned opening: ${s.opening}` : 'Opening date not announced';
}

/** Name, line as it was within the horizon, status and notes of a metro station. */
export function stationTooltip(net: Network, s: Station, horizon: Horizon): HTMLElement {
  return h(
    'div',
    { className: 'tip' },
    h('strong', { textContent: nameOf(s) }),
    lineLabel(lineAt(net, s, horizon)),
    ...notes(
      lang() === 'en'
        ? [englishOpening(s)]
        : [
            !isOpen(s) && !s.passThrough && `${STATUS_LABEL[s.status]}.`,
            !isOpen(s) && (s.opening ? `Открытие по плану — ${s.opening}.` : 'Срок открытия не назван.'),
            s.note,
          ],
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
    ...notes(
      lang() === 'en'
        ? [`Opened ${englishDate(e.note, e.opened ?? s.opened!)}`]
        : [`${e.name}: ${e.address}.`, e.note],
    ),
  );
}

/** Name, suburban routes and metro links of a rail station. */
export function railTooltip(net: Network, rail: Railway, s: RailStation): HTMLElement {
  if (lang() === 'en') {
    return h(
      'div',
      { className: 'tip' },
      h('strong', { textContent: nameOf(s) }),
      h('span', { className: 'tip__line tip__line--rail', textContent: 'Railway station' }),
    );
  }
  const routes = routesAt(rail, s.id).map((r) => r.name);
  const metro = (s.metro ?? []).map((id) => `«${net.stations.get(id)!.name}»`);
  return h(
    'div',
    { className: 'tip' },
    h('strong', { textContent: s.name }),
    h('span', { className: 'tip__line tip__line--rail', textContent: 'Железнодорожная станция' }),
    ...notes([
      routes.length ? `Электрички: ${routes.join('; ')}.` : 'Пригородные и дальние поезда.',
      metro.length > 0 && `Пересадка на метро: ${metro.join(', ')}.`,
    ]),
  );
}
