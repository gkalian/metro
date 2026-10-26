import type { Feature, LineString, Point as GeoPoint } from 'geojson';
import { smoothLine, type Point } from '../geo/geometry';
import {
  activeLinks,
  exitOpen,
  inService,
  isOpen,
  isPast,
  lineAt,
  lineRunning,
  linesAt,
  sectionLine,
  type Horizon,
  type Network,
  type Station,
  type Status,
} from '../domain/network';
import type { Railway } from '../domain/railway';
import { nameOf } from '../app/i18n';
import type { Route } from '../domain/routing';

/** What the map shows; the features below are built from it. */
export interface MapState {
  showPlanned: boolean;
  showRail: boolean;
  horizon: Horizon;
  from: string | null;
  to: string | null;
  route: Route | null;
}

/** Order-free key of a station pair. */
export const pairKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Smoothed track between neighbouring stations, by station pair. */
export function trackCurves(net: Network): Map<string, Point[]> {
  const curves = new Map<string, Point[]>();
  for (const run of net.lines.flatMap((line) => line.runs)) {
    const curve = smoothLine(run.map(({ station: s }) => [s.lon, s.lat]));
    run.slice(0, -1).forEach(({ station: s }, i) => curves.set(pairKey(s.id, run[i + 1]!.station.id), curve[i]!));
  }
  return curves;
}

/** Smoothed rail track by station pair; a section shared by two routes is kept once. */
export function railCurves(rail: Railway): Map<string, Point[]> {
  const curves = new Map<string, Point[]>();
  for (const route of rail.routes) {
    const stops = route.stations.map((id) => rail.stations.get(id)!);
    const curve = smoothLine(stops.map((s) => [s.lon, s.lat]));
    stops.slice(0, -1).forEach((s, i) => {
      const key = pairKey(s.id, stops[i + 1]!.id);
      if (!curves.has(key)) curves.set(key, curve[i]!);
    });
  }
  return curves;
}

/**
 * Colour of the way between two consecutive stations of a route: their line as it was then,
 * or null for a walk between lines.
 */
export function wayColor(net: Network, a: string, b: string, horizon: Horizon): string | null {
  // historic track may join stations that belong to different lines today
  const link = net.links.find((l) => pairKey(l.a, l.b) === pairKey(a, b));
  if (link) return net.lineById.get(link.lineId)!.color;
  const la = lineAt(net, net.stations.get(a)!, horizon);
  return la === lineAt(net, net.stations.get(b)!, horizon) ? la.color : null;
}

/**
 * Colour of each ride along a route by station pair: the line of the train taken, which on
 * shared track may differ from the line the stations belong to.
 */
export function routeColors(net: Network, route: Route | null): Map<string, string> {
  const colors = new Map<string, string>();
  for (const leg of route?.legs ?? []) {
    if (leg.kind !== 'ride') continue;
    const color = net.lineById.get(leg.lineIds[0]!)!.color;
    leg.stations.slice(0, -1).forEach((id, i) => colors.set(pairKey(id, leg.stations[i + 1]!), color));
  }
  return colors;
}

/**
 * Metro features keyed by `properties.key` for the fader. A key changes with the look of a
 * feature (status, line), so the old look cross-fades into the new one.
 */
export function metroFeatures(net: Network, curves: Map<string, Point[]>, state: MapState) {
  const { showPlanned, horizon, from, to, route } = state;
  const routeStations = new Set(route?.path);
  const routePairs = new Set<string>();
  route?.path.slice(0, -1).forEach((id, i) => routePairs.add(pairKey(id, route.path[i + 1]!)));
  const routeStops = new Set<string>(route?.legs.flatMap((l) => (l.kind === 'ride' ? l.stations : [l.from, l.to])));
  const hasRoute = !!route && route.path.length > 1;
  // with a route every track is muted, so the route line grows visibly over its own
  const dimTrack = hasRoute;
  // looking back, what came later is left out rather than drawn as planned
  const showLater = showPlanned && !isPast(net, horizon);

  const segments: Feature<LineString>[] = [];
  /** Lines drawn between each pair of stations, so shared track is drawn side by side. */
  const sharing = new Map<string, string[]>();
  for (const line of net.lines) {
    if (!lineRunning(net, line, horizon)) continue;
    for (const run of line.runs) {
      run.slice(0, -1).forEach(({ station: s }, i) => {
        const next = run[i + 1]!.station;
        const status = segmentStatus(net, s, next, horizon);
        if (!showLater && status !== 'open') return;
        const key = pairKey(s.id, next.id);
        const color = sectionLine(net, line, s, next, horizon).color;
        const lines = sharing.get(key) ?? sharing.set(key, []).get(key)!;
        lines.push(color);
        segments.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: curves.get(key)! },
          properties: { key: `${key}|${status}|${color}`, pair: key, color, status, dim: dimTrack, side: 0 },
        });
      });
    }
  }
  // on shared track each line keeps its place: -0.5 and 0.5 line widths from the middle for two
  for (const f of segments) {
    const lines = sharing.get(f.properties!.pair as string)!;
    f.properties!.side = lines.indexOf(f.properties!.color as string) - (lines.length - 1) / 2;
  }
  for (const link of activeLinks(net, horizon)) {
    const a = net.stations.get(link.a)!;
    const b = net.stations.get(link.b)!;
    segments.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[a.lon, a.lat], [b.lon, b.lat]] },
      properties: {
        key: `link|${pairKey(a.id, b.id)}`,
        color: net.lineById.get(link.lineId)!.color,
        status: 'open',
        dim: dimTrack,
      },
    });
  }

  const stations: Feature<GeoPoint>[] = [];
  for (const s of net.stations.values()) {
    const open = isOpen(net, s, horizon);
    if (!showLater && !open) continue;
    const role = s.id === from ? 'from' : s.id === to ? 'to' : '';
    const color = lineAt(net, s, horizon).color;
    const shared = linesAt(net, s, horizon).length > 1;
    stations.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
      properties: {
        key: `${s.id}|${open}|${color}|${shared}`,
        id: s.id,
        name: nameOf(s),
        color,
        planned: !open,
        // trains of several lines call here: drawn like a transfer
        shared,
        role,
        dim: hasRoute && !routeStations.has(s.id),
        // labels: endpoints first, then route stops, then open stations
        rank: role ? 0 : routeStops.has(s.id) ? 1 : open ? 2 : 3,
      },
    });
  }

  const transfers: Feature<LineString>[] = [];
  for (const t of net.transfers) {
    const a = net.stations.get(t.a)!;
    const b = net.stations.get(t.b)!;
    const planned = !(isOpen(net, a, horizon) && isOpen(net, b, horizon));
    if (planned && !showLater) continue;
    const key = pairKey(a.id, b.id);
    transfers.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[a.lon, a.lat], [b.lon, b.lat]] },
      properties: { key: `${key}|${planned}`, planned, dim: hasRoute && !routePairs.has(key) },
    });
  }

  // A far exit, once it takes passengers, looks like its station joined to it by a transfer;
  // it carries the station's id, so it answers clicks and hovers as the station does.
  for (const e of net.exits) {
    if (!exitOpen(net, e, horizon)) continue;
    const s = net.stations.get(e.station)!;
    const role = s.id === from ? 'from' : s.id === to ? 'to' : '';
    const color = lineAt(net, s, horizon).color;
    const dim = hasRoute && !routeStations.has(s.id);
    stations.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [e.lon, e.lat] },
      properties: {
        key: `${e.id}|${color}`,
        id: s.id,
        exit: e.id,
        name: nameOf(s),
        color,
        planned: false,
        shared: false,
        role,
        dim,
        rank: role ? 0 : routeStops.has(s.id) ? 1 : 2,
      },
    });
    transfers.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[s.lon, s.lat], [e.lon, e.lat]] },
      properties: { key: `exit|${e.id}`, planned: false, dim },
    });
  }

  return { segments, transfers, stations };
}

/** Suburban rail features, keyed like the metro ones. */
export function railFeatures(net: Network, rail: Railway, curves: Map<string, Point[]>, state: MapState) {
  const { showRail, route } = state;
  if (!showRail) return { lines: [], links: [], stations: [] };
  const dim = !!route && route.path.length > 1;

  const lines: Feature<LineString>[] = [...curves].map(([key, coordinates]) => ({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates },
    properties: { key, dim },
  }));
  const links: Feature<LineString>[] = [];
  const stations: Feature<GeoPoint>[] = [];
  for (const s of rail.stations.values()) {
    const metro = (s.metro ?? []).map((id) => net.stations.get(id)!);
    for (const m of metro) {
      links.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[s.lon, s.lat], [m.lon, m.lat]] },
        properties: { key: `${s.id}|${m.id}`, dim },
      });
    }
    stations.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
      properties: {
        key: s.id,
        id: s.id,
        // the metro label beside it already says the same
        name: metro.some((m) => m.name === s.name) ? '' : nameOf(s),
        terminal: rail.routes.some((r) => r.stations[0] === s.id || r.stations.at(-1) === s.id),
        dim,
      },
    });
  }
  return { lines, links, stations };
}

function segmentStatus(net: Network, a: Station, b: Station, horizon: Horizon): Status {
  if (inService(net, a, horizon) && inService(net, b, horizon)) return 'open';
  return a.status === 'project' || b.status === 'project' ? 'project' : 'construct';
}
