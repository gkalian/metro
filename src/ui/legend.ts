import type { Network } from '../domain/network';
import { nameOf, t } from '../app/i18n';
import { h } from './dom';

export function renderLegend(root: HTMLElement, net: Network): void {
  root.replaceChildren(
    ...net.lines.map((line) =>
      h(
        'li',
        {},
        h('span', { className: 'line-badge', textContent: line.id, css: { '--line': line.color } }),
        nameOf(line),
      ),
    ),
    h('li', { className: 'legend__rail' }, h('span', { className: 'rail-swatch' }), t('legendRail')),
    h('li', {}, h('span', { className: 'walk-swatch' }), t('legendWalk')),
  );
}
