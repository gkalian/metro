import './styles/index.css';
import { chronologyValue, horizonLabel, horizonsOf, parseYear, tickLabel, yearParam } from './app/horizons';
import { loadChoice, loadFlag, saveFlag, saveString } from './app/storage';
import { isOpen, loadNetwork, type Horizon } from './domain/network';
import { loadRailway } from './domain/railway';
import { buildGraph, findRoute, type Graph, type Route } from './domain/routing';
import { THEMES } from './map/basemap';
import { MapView } from './map/map-view';
import { bindFold } from './ui/fold';
import { renderLegend } from './ui/legend';
import { renderResult } from './ui/result';
import { StationPicker } from './ui/station-picker';

const net = loadNetwork();
const rail = loadRailway();
const horizons = horizonsOf(net);
const graphs = new Map<Horizon, Graph>();
const graphAt = (h: Horizon) => graphs.get(h) ?? graphs.set(h, buildGraph(net, h)).get(h)!;

const params = new URLSearchParams(location.search);
const known = (id: string | null) => (id && net.stations.has(id) ? id : null);

// Route and year live in the URL; display preferences in the browser (see app/storage).
const state = {
  from: known(params.get('from')),
  to: known(params.get('to')),
  showPlanned: loadFlag('show-planned', true),
  showRail: loadFlag('show-rail', true),
  horizon: parseYear(horizons, params.get('year')),
  theme: loadChoice('theme', THEMES, matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const showPlannedBox = $<HTMLInputElement>('show-planned');
const showRailBox = $<HTMLInputElement>('show-rail');
const slider = $<HTMLInputElement>('horizon');
slider.max = String(horizons.length - 1);
$('horizon-ticks').replaceChildren(
  ...horizons.map((h, i) => {
    const tick = Object.assign(document.createElement('span'), {
      textContent: tickLabel(h),
      className: h === null ? 'is-now' : '',
    });
    tick.style.setProperty('--at', String(i / (horizons.length - 1)));
    return tick;
  }),
);

// before the map, which reads the panel state for its padding
const sidebarToggle = $<HTMLButtonElement>('sidebar-toggle');
function setSidebar(collapsed: boolean): void {
  document.documentElement.dataset.sidebar = collapsed ? 'collapsed' : 'open';
  const label = collapsed ? 'Развернуть панель' : 'Свернуть панель';
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  sidebarToggle.setAttribute('aria-label', label);
  sidebarToggle.title = label;
}
setSidebar(loadChoice('sidebar', ['open', 'collapsed'], 'open') === 'collapsed');

const mapView = new MapView('map', net, rail, state.theme, onStationClick);
const fromPicker = new StationPicker($('picker-from'), 'Откуда', net, (id) => setEndpoint('from', id));
const toPicker = new StationPicker($('picker-to'), 'Куда', net, (id) => setEndpoint('to', id));
renderLegend($('legend'), net);
bindFold($<HTMLButtonElement>('legend-toggle'), $('legend'), 'legend-collapsed', true);
bindFold($<HTMLButtonElement>('chronology-toggle'), $('chronology'), 'chronology-collapsed', false);

function onStationClick(id: string): void {
  // a third click starts a new route
  if (!state.from || state.to) {
    state.from = id;
    state.to = null;
  } else if (id !== state.from) {
    state.to = id;
  }
  update(true);
}

function setEndpoint(which: 'from' | 'to', id: string | null): void {
  const other = which === 'from' ? 'to' : 'from';
  if (id && state[other] === id) state[other] = state[which];
  state[which] = id;
  update(true);
}

/** Moves the horizon far enough out for the station to be open. */
function reach(id: string | null): void {
  if (!id) return;
  const s = net.stations.get(id)!;
  if (isOpen(s, state.horizon)) return;
  state.horizon = horizons.find((h) => isOpen(s, h)) ?? Infinity;
}

function update(fit = false): void {
  if (state.showPlanned) {
    reach(state.from);
    reach(state.to);
  } else {
    for (const which of ['from', 'to'] as const) {
      const id = state[which];
      if (id && !isOpen(net.stations.get(id)!, state.horizon)) state[which] = null;
    }
  }

  let route: Route | null = null;
  if (state.from && state.to) route = findRoute(graphAt(state.horizon), state.from, state.to);

  document.documentElement.dataset.theme = state.theme;
  showPlannedBox.checked = state.showPlanned;
  showRailBox.checked = state.showRail;
  slider.value = String(horizons.indexOf(state.horizon));
  slider.setAttribute('aria-valuetext', horizonLabel(state.horizon));
  $('chronology-value').textContent = chronologyValue(state.horizon);
  for (const picker of [fromPicker, toPicker]) {
    picker.showPlanned = state.showPlanned;
    picker.horizon = state.horizon;
  }
  fromPicker.set(state.from ? net.stations.get(state.from)! : null);
  toPicker.set(state.to ? net.stations.get(state.to)! : null);
  renderResult($('result'), net, { ...state, route, horizonLabel: horizonLabel(state.horizon) });
  mapView.render({ ...state, route });
  if (fit && route && route.path.length > 1) mapView.fitRoute(route);

  const q = new URLSearchParams();
  if (state.from) q.set('from', state.from);
  if (state.to) q.set('to', state.to);
  const year = yearParam(state.horizon);
  if (year) q.set('year', year);
  history.replaceState(null, '', q.size ? `?${q}` : location.pathname);
}

showRailBox.addEventListener('change', () => {
  state.showRail = showRailBox.checked;
  saveFlag('show-rail', state.showRail);
  update();
});
showPlannedBox.addEventListener('change', () => {
  state.showPlanned = showPlannedBox.checked;
  saveFlag('show-planned', state.showPlanned);
  update();
});
slider.addEventListener('input', () => {
  state.horizon = horizons[Number(slider.value)] ?? null;
  // endpoints that are not open by the chosen year are dropped rather than pulling the slider back
  for (const which of ['from', 'to'] as const) {
    const id = state[which];
    if (id && !isOpen(net.stations.get(id)!, state.horizon)) state[which] = null;
  }
  update();
});
sidebarToggle.addEventListener('click', () => {
  const collapsed = document.documentElement.dataset.sidebar !== 'collapsed';
  setSidebar(collapsed);
  saveString('sidebar', collapsed ? 'collapsed' : 'open');
});

$('swap').addEventListener('click', () => {
  [state.from, state.to] = [state.to, state.from];
  update();
});
$('theme').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveString('theme', state.theme);
  mapView.setTheme(state.theme);
  update();
});

update(true);
