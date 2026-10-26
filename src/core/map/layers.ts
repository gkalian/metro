import type { ExpressionSpecification, Map as MlMap } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import { FADE, faded } from './fade';
import { CLEAR } from './trace';
import { FONT_BOLD, FONT_REGULAR, type Theme } from './basemap';

/** Sources whose features fade in and out, each feature keyed by `properties.key`. */
export const FADING = ['segments', 'transfers', 'stations', 'rail-lines', 'rail-links', 'rail-stations'] as const;
export type FadingSource = (typeof FADING)[number];

export const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };
export const NO_GRADIENT: ExpressionSpecification = ['step', ['line-progress'], CLEAR, 0, CLEAR];

const COLORS: Record<Theme, { text: string; halo: string; casing: string; rail: string }> = {
  light: { text: '#1b1e24', halo: '#ffffff', casing: '#ffffff', rail: '#4a505a' },
  dark: { text: '#f1f3f6', halo: '#15171c', casing: '#15171c', rail: '#aeb5c1' },
};

/** Adds the network's sources and layers on top of a freshly loaded basemap. */
export function addNetworkLayers(map: MlMap, theme: Theme): void {
  const c = COLORS[theme];
  for (const id of FADING) map.addSource(id, { type: 'geojson', data: EMPTY, promoteId: 'key' });
  map.addSource('route', { type: 'geojson', data: EMPTY, lineMetrics: true });

  const width = (k: number) =>
    ['interpolate', ['linear'], ['zoom'], 9, 2.2 * k, 12, 4.5 * k, 15, 8 * k] as ExpressionSpecification;
  const dimmed = (on: number, off: number) => faded(['case', ['get', 'dim'], off, on]);
  // stations swell into place as they fade in
  const swell = (k: number | ExpressionSpecification) =>
    ['*', k, ['+', 0.4, ['*', 0.6, FADE]]] as ExpressionSpecification;
  const round = { 'line-cap': 'round', 'line-join': 'round' } as const;
  // only one zoom interpolation is allowed per expression, so the factor goes inside the stops
  const radius = (k: number | ExpressionSpecification) =>
    [
      'interpolate', ['linear'], ['zoom'],
      9, ['*', 2.4, k],
      12, ['*', 4.6, k],
      15, ['*', 8, k],
    ] as ExpressionSpecification;

  // lines sharing track sit side by side, a line width apart; historic track has no side
  const side = ['coalesce', ['get', 'side'], 0] as ExpressionSpecification;
  const offset = ['interpolate', ['linear'], ['zoom'],
    9, ['*', 2.2, side],
    12, ['*', 4.5, side],
    15, ['*', 8, side],
  ] as ExpressionSpecification;

  // Suburban rail lies under the metro, drawn the classic way: dark line with a dashed light core.
  map.addLayer({
    id: 'rail-lines',
    type: 'line',
    source: 'rail-lines',
    layout: round,
    paint: { 'line-color': c.rail, 'line-width': width(0.95), 'line-opacity': dimmed(0.95, 0.3) },
  });
  map.addLayer({
    id: 'rail-lines-core',
    type: 'line',
    source: 'rail-lines',
    paint: {
      'line-color': c.casing,
      'line-width': width(0.45),
      'line-dasharray': [2.5, 2.5],
      'line-opacity': dimmed(1, 0.3),
    },
  });
  map.addLayer({
    id: 'rail-links',
    type: 'line',
    source: 'rail-links',
    layout: { 'line-cap': 'round' },
    paint: {
      'line-color': c.rail,
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 14, 2.4],
      'line-dasharray': [0.1, 2],
      'line-opacity': dimmed(0.9, 0.3),
    },
  });
  map.addLayer({
    id: 'rail-stations',
    type: 'circle',
    source: 'rail-stations',
    paint: {
      'circle-radius': radius(swell(['case', ['get', 'terminal'], 0.85, 0.55])),
      'circle-color': c.casing,
      'circle-stroke-color': c.rail,
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 9, 1.2, 12, 1.8, 15, 2.6],
      'circle-opacity': dimmed(1, 0.4),
      'circle-stroke-opacity': dimmed(1, 0.3),
    },
  });
  map.addLayer({
    id: 'rail-hit',
    type: 'circle',
    source: 'rail-stations',
    paint: { 'circle-radius': radius(1.8), 'circle-opacity': 0 },
  });

  map.addLayer({
    id: 'segments-casing',
    type: 'line',
    source: 'segments',
    filter: ['==', ['get', 'status'], 'open'],
    layout: round,
    paint: { 'line-offset': offset, 'line-color': c.casing, 'line-width': width(1.5), 'line-opacity': dimmed(0.9, 0) },
  });
  map.addLayer({
    id: 'segments-project',
    type: 'line',
    source: 'segments',
    filter: ['==', ['get', 'status'], 'project'],
    paint: {
      'line-offset': offset,
      'line-color': ['get', 'color'],
      'line-width': width(0.7),
      'line-dasharray': [1, 2],
      'line-opacity': dimmed(0.85, 0.25),
    },
  });
  map.addLayer({
    id: 'segments-construct',
    type: 'line',
    source: 'segments',
    filter: ['==', ['get', 'status'], 'construct'],
    paint: {
      'line-offset': offset,
      'line-color': ['get', 'color'],
      'line-width': width(0.85),
      'line-dasharray': [3, 1.5],
      'line-opacity': dimmed(0.9, 0.25),
    },
  });
  map.addLayer({
    id: 'segments-open',
    type: 'line',
    source: 'segments',
    filter: ['==', ['get', 'status'], 'open'],
    layout: round,
    paint: {
      'line-offset': offset,
      'line-color': ['get', 'color'],
      'line-width': width(1),
      'line-opacity': dimmed(1, 0.22),
    },
  });
  // The route is one line coloured by a gradient along it, so it can grow from start to end.
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: round,
    paint: { 'line-width': width(1.45), 'line-gradient': NO_GRADIENT },
  });
  // a glint running ahead of it shows the direction of travel
  map.addLayer({
    id: 'route-head',
    type: 'line',
    source: 'route',
    layout: round,
    paint: { 'line-width': width(0.55), 'line-blur': 0.5, 'line-gradient': NO_GRADIENT },
  });

  map.addLayer({
    id: 'transfers-casing',
    type: 'line',
    source: 'transfers',
    layout: round,
    paint: {
      'line-color': c.text,
      'line-width': width(1.9),
      'line-opacity': faded(['case', ['get', 'dim'], 0.15, ['get', 'planned'], 0.35, 0.85]),
    },
  });
  map.addLayer({
    id: 'transfers',
    type: 'line',
    source: 'transfers',
    layout: round,
    paint: { 'line-color': c.casing, 'line-width': width(1.2), 'line-opacity': dimmed(1, 0.3) },
  });

  map.addLayer({
    id: 'stations',
    type: 'circle',
    source: 'stations',
    filter: ['==', ['get', 'role'], ''],
    paint: {
      'circle-radius': radius(swell(['case', ['get', 'planned'], 0.8, 1])),
      'circle-color': c.casing,
      'circle-stroke-color': ['case', ['get', 'shared'], c.text, ['get', 'color']],
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 9, 1.4, 12, 2.4, 15, 3.6],
      'circle-opacity': dimmed(1, 0.5),
      'circle-stroke-opacity': faded(['case', ['get', 'dim'], 0.25, ['get', 'planned'], 0.75, 1]),
    },
  });
  map.addLayer({
    id: 'stations-selected',
    type: 'circle',
    source: 'stations',
    filter: ['!=', ['get', 'role'], ''],
    paint: {
      'circle-radius': radius(swell(1.7)),
      'circle-color': ['get', 'color'],
      'circle-stroke-color': c.casing,
      'circle-stroke-width': 3,
      'circle-opacity': FADE,
      'circle-stroke-opacity': FADE,
    },
  });
  // Generous invisible target so stations are easy to tap.
  map.addLayer({
    id: 'stations-hit',
    type: 'circle',
    source: 'stations',
    paint: { 'circle-radius': radius(2.6), 'circle-opacity': 0 },
  });

  // below the metro labels, so metro names win collisions
  map.addLayer({
    id: 'rail-label',
    type: 'symbol',
    source: 'rail-stations',
    minzoom: 10.5,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['literal', FONT_REGULAR],
      'text-size': ['interpolate', ['linear'], ['zoom'], 11, 9.5, 13, 11.5, 16, 14],
      'text-variable-anchor': ['right', 'left', 'top', 'bottom'],
      'text-radial-offset': 0.7,
      'text-justify': 'auto',
      'text-max-width': 8,
    },
    paint: {
      'text-color': c.rail,
      'text-halo-color': c.halo,
      'text-halo-width': 1.4,
      'text-opacity': dimmed(0.95, 0.3),
    },
  });

  map.addLayer({
    id: 'stations-label',
    type: 'symbol',
    source: 'stations',
    minzoom: 9.5,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['case', ['get', 'planned'], ['literal', FONT_REGULAR], ['literal', FONT_BOLD]],
      'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10.5, 13, 13.5, 16, 16],
      'text-variable-anchor': ['left', 'right', 'top', 'bottom', 'top-left', 'bottom-left'],
      'text-radial-offset': 0.85,
      'text-justify': 'auto',
      'text-max-width': 9,
      'symbol-sort-key': ['get', 'rank'],
    },
    paint: {
      'text-color': c.text,
      'text-halo-color': c.halo,
      'text-halo-width': 1.6,
      'text-opacity': faded(['case', ['get', 'dim'], 0.35, ['get', 'planned'], 0.8, 1]),
    },
  });
}
