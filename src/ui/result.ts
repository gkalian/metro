import { inService, isOpen, isPast, type Horizon, type Network } from '../domain/network';
import type { Route } from '../domain/routing';
import { h } from './dom';
import { formatTime, plural } from './format';

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
          ? 'Теперь выберите станцию назначения — на карте или в поле «Куда».'
          : 'Нажмите на две станции на карте или выберите их в полях выше — посчитаем время в пути.',
      }),
    );
    return;
  }
  if (!route) {
    root.replaceChildren(
      h('p', {
        className: 'hint',
        textContent: `В сети ${state.horizonLabel} между этими станциями нет пути — сдвиньте ползунок года.`,
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
        ? `${route.transfers} ${plural(route.transfers, 'пересадка', 'пересадки', 'пересадок')} · в поездах ${formatTime(rideTime)} · переходы ${formatTime(route.transferTime)}`
        : 'без пересадок',
    }),
  );

  const legs = h('ol', { className: 'legs' });
  for (const leg of route.legs) {
    if (leg.kind === 'transfer') {
      legs.append(
        h('li', { className: 'leg leg--transfer' }, `Переход на «${station(leg.to).name}» · ${formatTime(leg.time)}`),
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
          h('span', { className: 'leg__line', textContent: line.name }),
          h('span', { className: 'leg__time', textContent: formatTime(leg.time) }),
        ),
        h('div', { className: 'leg__stop', textContent: station(leg.stations[0]!).name }),
        middle.length
          ? h(
              'details',
              {},
              h('summary', {
                textContent: `${middle.length} ${plural(middle.length, 'станция', 'станции', 'станций')} без пересадки`,
              }),
              h('ul', {}, ...middle.map((id) => h('li', { textContent: station(id).name }))),
            )
          : null,
        h('div', { className: 'leg__stop', textContent: station(leg.stations.at(-1)!).name }),
      ),
    );
  }

  // an endpoint does not take passengers yet, or the way runs through track not built yet
  const future = [from, to].some((id) => !isOpen(station(id))) || route.path.some((id) => !inService(station(id)));
  const notes = [
    'Время расчётное, без ожидания поезда.',
    future && 'Будущая сеть — по схеме развития до 2040 года; сроки могут сдвинуться.',
    isPast(state.horizon) && 'Сеть прошлых лет — по датам открытия станций; время перегонов — сегодняшнее.',
    route.estimated && 'Часть перегонов оценена по расстоянию — по ним нет опубликованных данных.',
  ].filter(Boolean);

  root.replaceChildren(summary, legs, h('p', { className: 'note', textContent: notes.join(' ') }));
}
