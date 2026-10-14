import type { Network } from '../domain/network';
import { h } from './dom';

export function renderLegend(root: HTMLElement, net: Network): void {
  root.replaceChildren(
    ...net.lines.map((line) =>
      h(
        'li',
        {},
        h('span', { className: 'line-badge', textContent: line.id, css: { '--line': line.color } }),
        line.name,
      ),
    ),
    h('li', { className: 'legend__rail' }, h('span', { className: 'rail-swatch' }), 'Железнодорожные линии'),
    h('li', {}, h('span', { className: 'walk-swatch' }), 'Пеший переход между станциями ж/д и метро'),
  );
}
