import { isOpen, lineAt, type Horizon, type Network, type Station } from '../domain/network';
import { nameOf, t } from '../app/i18n';
import { h } from './dom';
import { normalize } from './format';

/** Text field with a filtered dropdown of stations. */
export class StationPicker {
  private readonly input: HTMLInputElement;
  private readonly list: HTMLUListElement;
  private readonly badge: HTMLSpanElement;
  private options: Station[] = [];
  private active = 0;
  private value: Station | null = null;
  private readonly clear: HTMLButtonElement;
  showPlanned = true;
  horizon: Horizon = null;

  constructor(
    root: HTMLElement,
    private readonly label: 'from' | 'to',
    private readonly net: Network,
    private readonly onPick: (id: string | null) => void,
  ) {
    this.badge = h('span', { className: 'line-badge picker__badge' });
    this.input = h('input', { type: 'text', autocomplete: 'off', spellcheck: false });
    const clear = (this.clear = h('button', { type: 'button', className: 'picker__clear', textContent: '×' }));
    this.list = h('ul', { className: 'picker__list', hidden: true });
    root.append(this.badge, this.input, clear, this.list);

    this.input.addEventListener('focus', () => {
      this.input.select();
      this.open('');
    });
    this.input.addEventListener('input', () => this.open(this.input.value));
    this.input.addEventListener('blur', () => {
      this.close();
      this.set(this.value);
    });
    this.input.addEventListener('keydown', (e) => this.onKey(e));
    clear.addEventListener('click', () => this.onPick(null));
    // mousedown, so the pick lands before the input's blur closes the list
    this.list.addEventListener('mousedown', (e) => {
      const li = (e.target as HTMLElement).closest('li');
      if (!li?.dataset.id) return;
      e.preventDefault();
      this.pick(li.dataset.id);
    });
  }

  set(station: Station | null): void {
    this.value = station;
    const placeholder = t(this.label);
    this.input.placeholder = placeholder;
    this.input.setAttribute('aria-label', placeholder);
    this.clear.title = t('clear');
    this.input.value = station ? nameOf(station) : '';
    // the line as it was in the chosen year
    const line = station && lineAt(this.net, station, this.horizon);
    this.badge.textContent = line?.id ?? '';
    this.badge.style.setProperty('--line', line?.color ?? 'transparent');
    this.badge.classList.toggle('picker__badge--empty', !line);
  }

  private pick(id: string): void {
    this.close();
    this.input.blur();
    this.onPick(id);
  }

  private open(query: string): void {
    const q = normalize(query);
    const all = [...this.net.stations.values()].filter((s) => this.showPlanned || isOpen(this.net, s, this.horizon));
    // either name finds the station, whichever language is shown
    const names = (s: Station) => [s.name, s.nameEn ?? ''].map(normalize);
    const starts = all.filter((s) => names(s).some((n) => n.startsWith(q)));
    const contains = all.filter((s) => !starts.includes(s) && names(s).some((n) => n.includes(q)));
    this.options = q ? [...starts, ...contains] : all;
    this.active = 0;
    this.list.replaceChildren(
      ...this.options.map((s) => {
        const line = lineAt(this.net, s, this.horizon);
        const li = h(
          'li',
          {},
          h('span', { className: 'line-badge', textContent: line.id, css: { '--line': line.color } }),
          h('span', { className: 'picker__name', textContent: nameOf(s) }),
          !isOpen(this.net, s) && h('span', { className: 'picker__status', textContent: s.opening ? t('plannedFor', s.opening) : t('noDate') }),
        );
        li.dataset.id = s.id;
        return li;
      }),
    );
    if (!this.options.length) this.list.append(h('li', { className: 'picker__empty', textContent: t('nothingFound') }));
    this.list.hidden = false;
    this.highlight();
  }

  private close(): void {
    this.list.hidden = true;
  }

  private highlight(): void {
    [...this.list.children].forEach((li, i) => li.classList.toggle('is-active', i === this.active));
    this.list.children[this.active]?.scrollIntoView({ block: 'nearest' });
  }

  private onKey(e: KeyboardEvent): void {
    if (this.list.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = this.options.length;
      if (n) this.active = (this.active + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
      this.highlight();
    } else if (e.key === 'Enter') {
      const s = this.options[this.active];
      if (s) this.pick(s.id);
    } else if (e.key === 'Escape') {
      this.input.blur();
    }
  }
}
