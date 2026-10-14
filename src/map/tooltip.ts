import { isOpen, lineAt, STATUS_LABEL, type Exit, type Horizon, type Network, type Station } from '../domain/network';
import { routesAt, type Railway, type RailStation } from '../domain/railway';
import { h } from '../ui/dom';

const notes = (texts: (string | false | undefined)[]) =>
  texts.filter((t): t is string => !!t).map((text) => h('span', { className: 'tip__note', textContent: text }));

/** Name, line as it was within the horizon, status and notes of a metro station. */
export function stationTooltip(net: Network, s: Station, horizon: Horizon): HTMLElement {
  const line = lineAt(net, s, horizon);
  return h(
    'div',
    { className: 'tip' },
    h('strong', { textContent: s.name }),
    h('span', { className: 'tip__line', textContent: `${line.id} · ${line.name}`, css: { '--line': line.color } }),
    ...notes([
      !isOpen(s) && !s.passThrough && `${STATUS_LABEL[s.status]}.`,
      !isOpen(s) && (s.opening ? `Открытие по плану — ${s.opening}.` : 'Срок открытия не назван.'),
      s.note,
    ]),
  );
}

/** Station, its line within the horizon and where a far exit comes up. */
export function exitTooltip(net: Network, e: Exit, horizon: Horizon): HTMLElement {
  const s = net.stations.get(e.station)!;
  const line = lineAt(net, s, horizon);
  return h(
    'div',
    { className: 'tip' },
    h('strong', { textContent: s.name }),
    h('span', { className: 'tip__line', textContent: `${line.id} · ${line.name}`, css: { '--line': line.color } }),
    ...notes([`${e.name}: ${e.address}.`, e.note]),
  );
}

/** Name, suburban routes and metro links of a rail station. */
export function railTooltip(net: Network, rail: Railway, s: RailStation): HTMLElement {
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
