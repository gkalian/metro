import { inService, isOpen, isPast, type Horizon, type Network } from '../domain/network';
import type { Route } from '../domain/routing';
import { nameOf, t } from '../app/i18n';
import { h } from './dom';
import { formatTime } from './format';

export function renderResult(
  root: HTMLElement,
  net: Network,
  state: { from: string | null; to: string | null; route: Route | null; horizon: Horizon; horizonLabel: string },
): void {
  const { from, to, route } = state;
  if (!from || !to) {
    root.replaceChildren(h('p', { className: 'hint', textContent: t(from ? 'hintPickTo' : 'hintPickBoth') }));
    return;
  }
  if (!route) {
    root.replaceChildren(h('p', { className: 'hint', textContent: t('noRoute', state.horizonLabel) }));
    return;
  }

  const station = (id: string) => net.stations.get(id)!;
  const rideTime = route.time - route.transferTime;
  const summary = h(
    'div',
    { className: 'summary' },
    h('div', { className: 'summary__time', textContent: `${route.estimated ? '≈ ' : ''}${formatTime(route.time)}` }),
    h('div', {
      className: 'summary__meta',
      textContent: route.transfers
        ? [
            t('transfers', route.transfers),
            // a change of trains where lines sharing track part takes no walking
            route.transferTime && t('rideAndWalk', formatTime(rideTime), formatTime(route.transferTime)),
          ]
            .filter(Boolean)
            .join(' · ')
        : t('noTransfers'),
    }),
  );

  const legs = h('ol', { className: 'legs' });
  route.legs.forEach((leg, i) => {
    if (leg.kind === 'transfer' && leg.change) {
      const next = route.legs[i + 1];
      const onto = next?.kind === 'ride' ? next.lineIds : [];
      legs.append(h('li', { className: 'leg leg--transfer' }, t('changeTrains', nameOf(station(leg.from)), onto)));
      return;
    }
    if (leg.kind === 'transfer') {
      legs.append(h('li', { className: 'leg leg--transfer' }, `${t('walkTo', nameOf(station(leg.to)))} · ${formatTime(leg.time)}`));
      return;
    }
    const line = net.lineById.get(leg.lineId)!;
    // on shared track a train of any of these lines will do
    const lines = leg.lineIds.map((id) => net.lineById.get(id)!);
    const middle = leg.stations.slice(1, -1);
    legs.append(
      h(
        'li',
        { className: 'leg', css: { '--line': line.color } },
        h(
          'div',
          { className: 'leg__head' },
          ...lines.map((l) => h('span', { className: 'line-badge', textContent: l.id, css: { '--line': l.color } })),
          h('span', { className: 'leg__line', textContent: lines.length > 1 ? t('anyTrain', leg.lineIds) : nameOf(line) }),
          h('span', { className: 'leg__time', textContent: formatTime(leg.time) }),
        ),
        h('div', { className: 'leg__stop', textContent: nameOf(station(leg.stations[0]!)) }),
        middle.length
          ? h(
              'details',
              {},
              h('summary', { textContent: t('stopsBetween', middle.length) }),
              h('ul', {}, ...middle.map((id) => h('li', { textContent: nameOf(station(id)) }))),
            )
          : null,
        h('div', { className: 'leg__stop', textContent: nameOf(station(leg.stations.at(-1)!)) }),
      ),
    );
  });

  // an endpoint does not take passengers yet, or the way runs through track not built yet
  const future = [from, to].some((id) => !isOpen(station(id))) || route.path.some((id) => !inService(station(id)));
  const notes = [
    t('noteEstimate'),
    future && t('noteFuture'),
    isPast(state.horizon) && t('notePast'),
    route.estimated && t('noteEstimatedRuns'),
  ].filter(Boolean);

  root.replaceChildren(summary, legs, h('p', { className: 'note', textContent: notes.join(' ') }));
}
