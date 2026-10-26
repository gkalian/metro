import type { ExpressionSpecification, GeoJSONSource, Map as MlMap } from 'maplibre-gl';
import type { Feature } from 'geojson';

/** Opacity factor of a feature that is fading in or out; layers multiply their opacity by it. */
export const FADE: ExpressionSpecification = ['coalesce', ['feature-state', 'fade'], 1];

/** Scales `value` by FADE. */
export const faded = (value: number | ExpressionSpecification): ExpressionSpecification => ['*', value, FADE];

interface Entry {
  feature: Feature;
  /** 0 — gone, 1 — fully shown; moves linearly, the eased value goes to the map. */
  t: number;
  shown: boolean;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Cross-fades GeoJSON sources between datasets. Features are matched by `properties.key`
 * (the sources promote it to the feature id): new ones fade in, and the ones that went away
 * stay in the data until they have faded out.
 */
export class Fader {
  private readonly sources = new Map<string, Map<string, Entry>>();
  private frame = 0;
  private last: number | null = null;

  constructor(
    private readonly map: MlMap,
    private readonly duration: number,
  ) {}

  /** Forgets everything, e.g. after a style change has recreated the sources. */
  reset(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.sources.clear();
  }

  update(source: string, features: Feature[], animate: boolean): void {
    animate &&= this.duration > 0;
    let entries = this.sources.get(source);
    if (!entries) this.sources.set(source, (entries = new Map()));

    const seen = new Set<string>();
    for (const feature of features) {
      const base = String(feature.properties!.key);
      let key = base;
      for (let n = 2; seen.has(key); n++) key = `${base}#${n}`;
      feature.properties!.key = key;
      seen.add(key);
      const entry = entries.get(key);
      if (entry) {
        entry.feature = feature;
        entry.shown = true;
      } else {
        const t = animate ? 0 : 1;
        entries.set(key, { feature, t, shown: true });
        // the state may linger from an earlier visit of the same feature
        this.map.setFeatureState({ source, id: key }, { fade: t });
      }
    }
    for (const [key, entry] of entries) {
      if (seen.has(key)) continue;
      if (animate) entry.shown = false;
      else entries.delete(key);
    }

    this.push(source);
    if (!this.frame && this.moving()) {
      this.last = null;
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  private moving(): boolean {
    for (const entries of this.sources.values()) {
      for (const e of entries.values()) if (e.t !== (e.shown ? 1 : 0)) return true;
    }
    return false;
  }

  private push(source: string): void {
    const features = [...this.sources.get(source)!.values()].map((e) => e.feature);
    (this.map.getSource(source) as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features });
  }

  private readonly tick = (now: number): void => {
    const step = this.last === null ? 0 : (now - this.last) / this.duration;
    this.last = now;
    for (const [source, entries] of this.sources) {
      let removed = false;
      for (const [key, e] of entries) {
        const target = e.shown ? 1 : 0;
        if (e.t === target) continue;
        e.t = target ? Math.min(1, e.t + step) : Math.max(0, e.t - step);
        // a faded-out feature keeps its zero state until the data without it arrives
        this.map.setFeatureState({ source, id: key }, { fade: ease(e.t) });
        if (!e.shown && e.t === 0) {
          entries.delete(key);
          removed = true;
        }
      }
      if (removed) this.push(source);
    }
    this.frame = this.moving() ? requestAnimationFrame(this.tick) : 0;
  };
}
