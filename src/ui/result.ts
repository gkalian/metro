import { inService, isOpen, isPast, type Horizon, type Network } from '../domain/network';
import type { Route } from '../domain/routing';
import { nameOf, tr } from '../app/i18n';
import { h } from './dom';
import { count, formatTime } from './format';

export function renderResult(
  root: HTMLElement,
  net: Network,
  state: { from: string | null; to: string | null; route: Route | null; horizon: Horizon; horizonLabel: string },
): void {
  const { from, to, route } = state;
  if (!from || !to) {
    root.replaceChildren(
      h('p', {
        className: 'hint',
        textContent: from
          ? tr(
              'Теперь выберите станцию назначения — на карте или в поле «Куда».',
              'Now pick the destination — on the map or in the “To” field.',
            )
          : tr(
              'Нажмите на две станции на карте или выберите их в полях выше — посчитаем время в пути.',
              'Click two stations on the map or pick them in the fields above to get the travel time.',
            ),
      }),
    );
    return;
  }
  if (!route) {
    root.replaceChildren(
      h('p', {
        className: 'hint',
        textContent: tr(
          `В сети ${state.horizonLabel} между этими станциями нет пути — сдвиньте ползунок года.`,
          `No way between these stations in the network ${state.horizonLabel} — move the year slider.`,
        ),
      }),
    );
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
        ? `${count(route.transfers, ['пересадка', 'пересадки', 'пересадок'], ['transfer', 'transfers'])} · ${tr('в поездах', 'on trains')} ${formatTime(rideTime)} · ${tr('переходы', 'walking')} ${formatTime(route.transferTime)}`
        : tr('без пересадок', 'no transfers'),
    }),
  );

  const legs = h('ol', { className: 'legs' });
  for (const leg of route.legs) {
    if (leg.kind === 'transfer') {
      legs.append(
        h('li', { className: 'leg leg--transfer' }, `${tr(`Переход на «${nameOf(station(leg.to))}»`, `Transfer to “${nameOf(station(leg.to))}”`)} · ${formatTime(leg.time)}`),
      );
      continue;
    }
    const line = net.lineById.get(leg.lineId)!;
    const middle = leg.stations.slice(1, -1);
    legs.append(
      h(
        'li',
        { className: 'leg', css: { '--line': line.color } },
        h(
          'div',
          { className: 'leg__head' },
          h('span', { className: 'line-badge', textContent: line.id }),
          h('span', { className: 'leg__line', textContent: nameOf(line) }),
          h('span', { className: 'leg__time', textContent: formatTime(leg.time) }),
        ),
        h('div', { className: 'leg__stop', textContent: nameOf(station(leg.stations[0]!)) }),
        middle.length
          ? h(
              'details',
              {},
              h('summary', {
                textContent: `${count(middle.length, ['станция', 'станции', 'станций'], ['station', 'stations'])} ${tr('без пересадки', 'in between')}`,
              }),
              h('ul', {}, ...middle.map((id) => h('li', { textContent: nameOf(station(id)) }))),
            )
          : null,
        h('div', { className: 'leg__stop', textContent: nameOf(station(leg.stations.at(-1)!)) }),
      ),
    );
  }

  // an endpoint does not take passengers yet, or the way runs through track not built yet
  const future = [from, to].some((id) => !isOpen(station(id))) || route.path.some((id) => !inService(station(id)));
  const notes = [
    tr('Время расчётное, без ожидания поезда.', 'Estimated time, not counting the wait for a train.'),
    future &&
      tr(
        'Будущая сеть — по схеме развития до 2040 года; сроки могут сдвинуться.',
        'The future network follows the development plan to 2040; dates may shift.',
      ),
    isPast(state.horizon) &&
      tr(
        'Сеть прошлых лет — по датам открытия станций; время перегонов — сегодняшнее.',
        'Past networks follow station opening dates; running times are today’s.',
      ),
    route.estimated &&
      tr(
        'Часть перегонов оценена по расстоянию — по ним нет опубликованных данных.',
        'Some running times are estimated from distance: there is no published data for them.',
      ),
  ].filter(Boolean);

  root.replaceChildren(summary, legs, h('p', { className: 'note', textContent: notes.join(' ') }));
}
