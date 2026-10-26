import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { Feature } from 'geojson';
import type { Point } from '../geo/geometry';
import type { Network } from '../domain/network';
import type { Railway } from '../domain/railway';
import type { Route } from '../domain/routing';
import { lang } from '../app/i18n';
import { loadBasemap, localizeBasemap, type Theme } from './basemap';
import { Fader } from './fade';
import { metroFeatures, pairKey, railCurves, railFeatures, routeColors, trackCurves, wayColor, type MapState } from './features';
import { addNetworkLayers, EMPTY, FADING, NO_GRADIENT, type FadingSource } from './layers';
import { exitTooltip, railTooltip, stationTooltip } from './tooltip';
import { buildTrace, CLEAR, headGradient, traceGradient, type Trace } from './trace';

export type { MapState } from './features';

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
/** How long stations and lines take to appear or vanish when the year changes. */
const FADE_MS = 450;
const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

// MapLibre locates its worker via import.meta.url, which bundling breaks.
maplibregl.setWorkerUrl(workerUrl);

export class MapView {
  readonly map: MlMap;
  private theme: Theme;
  /** The basemap's layers are in place; false while a new theme loads. */
  private styled = false;
  private state: MapState = { showPlanned: true, showRail: true, horizon: null, from: null, to: null, route: null };
  private readonly curves: Map<string, Point[]>;
  private readonly railCurves: Map<string, Point[]>;
  private readonly popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
  /** Station the tooltip shows, so moving within it does not rebuild the tooltip. */
  private hovered: string | null = null;
  private readonly controls = [new maplibregl.NavigationControl({ showCompass: false }), new maplibregl.GeolocateControl({})];
  private corner: maplibregl.ControlPosition | null = null;
  private readonly fader: Fader;
  /** Whether the current sources have been filled once, so later changes fade. */
  private filled = false;
  /** The route being drawn: how far the line has grown and how bright its leading glow is. */
  private trace: (Trace & { key: string; progress: number; glow: number }) | null = null;
  private traceFrame = 0;

  constructor(
    container: string,
    private readonly net: Network,
    private readonly rail: Railway,
    bounds: [[number, number], [number, number]],
    theme: Theme,
    private readonly onStationClick: (id: string) => void,
  ) {
    this.theme = theme;
    this.curves = trackCurves(net);
    this.railCurves = railCurves(rail);
    this.map = new maplibregl.Map({
      container,
      bounds: networkBounds(net),
      fitBoundsOptions: { padding: viewPadding() },
      minZoom: 8,
      maxBounds: bounds,
      attributionControl: { compact: true },
    });
    this.fader = new Fader(this.map, REDUCED_MOTION ? 0 : FADE_MS);
    this.placeControls();
    window.addEventListener('resize', () => this.placeControls());
    this.map.on('style.load', () => this.addLayers());
    this.bindEvents();
    loadBasemap(this.map, theme);
  }

  setTheme(theme: Theme): void {
    if (theme === this.theme) return;
    this.theme = theme;
    this.styled = false;
    loadBasemap(this.map, theme);
  }

  render(state: MapState): void {
    this.state = state;
    if (!this.map.getSource('segments')) return;
    const metro = metroFeatures(this.net, this.curves, state);
    const rail = railFeatures(this.net, this.rail, this.railCurves, state);
    const data: Record<FadingSource, Feature[]> = {
      ...metro,
      'rail-lines': rail.lines,
      'rail-links': rail.links,
      'rail-stations': rail.stations,
    };
    for (const id of FADING) this.fader.update(id, data[id], this.filled);
    this.filled = true;
    this.showRoute(state.route);
  }

  fitRoute(route: Route): void {
    const bounds = new maplibregl.LngLatBounds();
    for (const id of route.path) {
      const s = this.net.stations.get(id)!;
      bounds.extend([s.lon, s.lat]);
    }
    this.map.fitBounds(bounds, { padding: viewPadding(), maxZoom: 13.5, duration: 600 });
  }

  /** Zoom buttons sit bottom-right beside the panel, top-right above the bottom sheet. */
  private placeControls(): void {
    const corner = isWide() ? 'bottom-right' : 'top-right';
    if (corner === this.corner) return;
    for (const control of this.controls) {
      if (this.corner) this.map.removeControl(control);
      this.map.addControl(control, corner);
    }
    this.corner = corner;
  }

  /** Starts drawing a route that differs from the one on the map. */
  private showRoute(route: Route | null): void {
    const key = route && route.path.length > 1 ? route.path.join('>') : '';
    if (key === (this.trace?.key ?? '')) {
      // the same way in another year may run on another line: recolour without drawing it again
      if (this.trace) Object.assign(this.trace, this.buildTrace(route!.path));
      this.fillRoute();
      return;
    }
    cancelAnimationFrame(this.traceFrame);
    this.trace = key ? { ...this.buildTrace(route!.path), key, progress: 0, glow: 0 } : null;
    this.fillRoute();
    if (this.trace) this.playTrace(this.trace, route!.path.length);
  }

  private buildTrace(path: string[]): Trace {
    const at = (id: string): Point => {
      const s = this.net.stations.get(id)!;
      return [s.lon, s.lat];
    };
    // on shared track the colour is the line of the train taken
    const rides = routeColors(this.net, this.state.route);
    return buildTrace(path, at, (a, b) => ({
      points: this.curves.get(pairKey(a, b)) ?? [at(a), at(b)],
      // a walk between lines is drawn by the transfer layer
      color: rides.get(pairKey(a, b)) ?? wayColor(this.net, a, b, this.state.horizon) ?? CLEAR,
    }));
  }

  /** Grows the route from its first station to the last once the camera has settled on it. */
  private playTrace(trace: NonNullable<typeof this.trace>, stops: number): void {
    // brisk on a hop, still quick across the city
    const duration = REDUCED_MOTION ? 0 : Math.min(2000, Math.max(800, 400 + 45 * stops));
    const glowOut = 400;
    const play = () => {
      if (this.trace !== trace) return;
      let start = 0;
      const frame = (now: number) => {
        if (this.trace !== trace) return;
        start ||= now;
        const elapsed = now - start;
        trace.progress = duration ? easeInOut(Math.min(1, elapsed / duration)) : 1;
        trace.glow = duration ? Math.max(0, Math.min(1, 1 - (elapsed - duration) / glowOut)) : 0;
        this.paintRoute();
        if (trace.glow > 0) this.traceFrame = requestAnimationFrame(frame);
      };
      this.traceFrame = requestAnimationFrame(frame);
    };
    // the caller may be about to fly the camera to the route
    this.traceFrame = requestAnimationFrame(() => {
      if (this.map.isMoving()) this.map.once('moveend', play);
      else play();
    });
  }

  private fillRoute(): void {
    const t = this.trace;
    (this.map.getSource('route') as GeoJSONSource | undefined)?.setData(
      t ? { type: 'Feature', geometry: { type: 'LineString', coordinates: t.coordinates }, properties: {} } : EMPTY,
    );
    this.paintRoute();
  }

  private paintRoute(): void {
    if (!this.map.getLayer('route-line')) return;
    const t = this.trace;
    this.map.setPaintProperty('route-line', 'line-gradient', t ? traceGradient(t, t.progress) : NO_GRADIENT);
    this.map.setPaintProperty(
      'route-head',
      'line-gradient',
      t && t.glow > 0 ? headGradient(t.progress, 0.12, '#ffffff', 0.95 * t.glow) : NO_GRADIENT,
    );
  }

  private bindEvents(): void {
    const map = this.map;
    const show = (key: string, lngLat: [number, number], content: () => HTMLElement) => {
      if (key === this.hovered && this.popup.isOpen()) return;
      this.hovered = key;
      this.popup.setLngLat(lngLat).setDOMContent(content()).addTo(map);
    };
    const hide = () => {
      this.hovered = null;
      this.popup.remove();
    };
    map.on('click', 'stations-hit', (e) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) this.onStationClick(id);
    });
    map.on('mousemove', 'stations-hit', (e) => {
      const props = e.features?.[0]?.properties;
      const s = props?.id ? this.net.stations.get(props.id as string) : undefined;
      if (!s) return;
      map.getCanvas().style.cursor = 'pointer';
      const exit = props?.exit ? this.net.exits.find((x) => x.id === props.exit) : undefined;
      // the line in the tooltip depends on the year, so the year is part of the key
      const key = `${exit?.id ?? s.id}@${this.state.horizon}@${lang()}`;
      if (exit) show(key, [exit.lon, exit.lat], () => exitTooltip(this.net, exit, this.state.horizon));
      else show(key, [s.lon, s.lat], () => stationTooltip(this.net, s, this.state.horizon));
    });
    map.on('mouseleave', 'stations-hit', () => {
      map.getCanvas().style.cursor = '';
      hide();
    });
    map.on('mousemove', 'rail-hit', (e) => {
      // a metro station under the pointer keeps the tooltip
      if (map.queryRenderedFeatures(e.point, { layers: ['stations-hit'] }).length) return;
      const id = e.features?.[0]?.properties?.id as string | undefined;
      const s = id ? this.rail.stations.get(id) : undefined;
      if (s) show(`${s.id}@${lang()}`, [s.lon, s.lat], () => railTooltip(this.net, this.rail, s));
    });
    map.on('mouseleave', 'rail-hit', () => {
      if (!map.getCanvas().style.cursor) hide();
    });
  }

  /** Basemap names follow the page's language; the network's own labels come with the next render. */
  localize(): void {
    // a style still loading picks the language up in addLayers
    if (this.styled) localizeBasemap(this.map);
  }

  private addLayers(): void {
    this.styled = true;
    localizeBasemap(this.map);
    // the style change dropped the old sources along with their feature states
    this.fader.reset();
    this.filled = false;
    addNetworkLayers(this.map, this.theme);
    // a route already on the map is shown whole rather than drawn again
    if (this.trace) Object.assign(this.trace, { progress: 1, glow: 0 });
    cancelAnimationFrame(this.traceFrame);
    this.fillRoute();
    this.render(this.state);
  }
}

const isWide = () => window.innerWidth > 720;

/** Keeps content clear of the panel: beside it on desktop, above it on mobile. */
function viewPadding(): maplibregl.PaddingOptions {
  const folded = document.documentElement.dataset.sidebar === 'collapsed';
  return isWide()
    ? { top: 60, bottom: 60, left: folded ? 60 : 440, right: 60 }
    : { top: 50, bottom: Math.round(window.innerHeight * 0.46) + 30, left: 40, right: 40 };
}

function networkBounds(net: Network): maplibregl.LngLatBounds {
  const bounds = new maplibregl.LngLatBounds();
  for (const s of net.stations.values()) bounds.extend([s.lon, s.lat]);
  return bounds;
}
