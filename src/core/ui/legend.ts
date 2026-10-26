import type { Network } from '../domain/network';
import { nameOf, t } from '../app/i18n';
import { h } from './dom';

/** Lines, then the map's symbols; rail ones only where the city has suburban rail. */
export function renderLegend(root: HTMLElement, net: Network, rail: boolean): void {
  root.replaceChildren(
    ...net.lines.map((line) =>
      h(
        'li',
        {},
        h('span', { className: 'line-badge', textContent: line.id, css: { '--line': line.color } }),
        nameOf(line),
      ),
    ),
    h('li', { className: 'legend__extra' }, h('span', { className: 'plan-swatch' }), t('legendPlanned')),
    ...(rail
      ? [
          h('li', {}, h('span', { className: 'rail-swatch' }), t('legendRail')),
          h('li', {}, h('span', { className: 'walk-swatch' }), t('legendWalk')),
        ]
      : []),
  );
}
