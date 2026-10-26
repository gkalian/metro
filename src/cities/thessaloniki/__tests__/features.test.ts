import { describe, expect, it } from 'vitest';
import { loadNetwork } from '../../../core/domain/network';
import { buildGraph, findRoute } from '../../../core/domain/routing';
import { metroFeatures, pairKey, routeColors, trackCurves, wayColor, type MapState } from '../../../core/map/features';
import { data } from '../data';

const net = loadNetwork(data.network);
const curves = trackCurves(net);
const color = (lineId: string) => net.lineById.get(lineId)!.color;
const base: MapState = { showPlanned: true, showRail: false, horizon: null, from: null, to: null, route: null };

const segments = (state: MapState, a: string, b: string) =>
  metroFeatures(net, curves, state).segments.filter((f) => String(f.properties!.key).startsWith(`${pairKey(a, b)}|`));
const segment = (state: MapState, a: string, b: string) => segments(state, a, b)[0];
const station = (state: MapState, id: string) =>
  metroFeatures(net, curves, state).stations.find((f) => f.properties!.id === id);

describe('metroFeatures', () => {
  it('draws the Kalamaria branch as open track today and leaves it out in 2024', () => {
    expect(segment(base, '25-martiou', 'nomarchia')!.properties!.status).toBe('open');
    expect(segment({ ...base, horizon: 2024 }, '25-martiou', 'nomarchia')).toBeUndefined();
  });

  it('draws the airport extension as planned, in the colour of line 2', () => {
    expect(segment(base, 'mikra', 'scholi-polemou')!.properties).toMatchObject({ status: 'project', color: color('2') });
  });

  it('draws lines 1 and 2 side by side on their shared track, from 2026 on', () => {
    const now = segments(base, 'venizelou', 'agias-sofias').map((f) => [f.properties!.color, f.properties!.side]);
    expect(now).toEqual([
      [color('1'), -0.5],
      [color('2'), 0.5],
    ]);
    const then = segments({ ...base, horizon: 2024 }, 'venizelou', 'agias-sofias').map((f) => f.properties!.side);
    expect(then).toEqual([0]);
  });

  it('marks stations where trains of several lines call', () => {
    expect(station(base, 'venizelou')!.properties!.shared).toBe(true);
    expect(station({ ...base, horizon: 2024 }, 'venizelou')!.properties!.shared).toBe(false);
    expect(station(base, 'mikra')!.properties!.shared).toBe(false);
  });

  it('changes the key with the look, so the fader cross-fades it', () => {
    const now = station(base, 'aerodromio')!.properties!.key;
    const then = station({ ...base, horizon: 2040 }, 'aerodromio')!.properties!.key;
    expect(then).not.toBe(now);
  });

  it('leaves later stations out when looking back', () => {
    expect(station({ ...base, horizon: 2024 }, 'mikra')).toBeUndefined();
    expect(station(base, 'aristotelous')!.properties!.planned).toBe(true);
    expect(station({ ...base, showPlanned: false }, 'aristotelous')).toBeUndefined();
  });

  it('mutes everything but the route', () => {
    const route = findRoute(buildGraph(net, null), 'neos-stathmos', 'sintrivani')!;
    const state = { ...base, from: 'neos-stathmos', to: 'sintrivani', route };
    expect(station(state, 'venizelou')!.properties!.dim).toBe(false);
    expect(station(state, 'mikra')!.properties!.dim).toBe(true);
    expect(station(state, 'neos-stathmos')!.properties!.role).toBe('from');
  });

  it('keys every feature uniquely', () => {
    const { segments, stations, transfers } = metroFeatures(net, curves, { ...base, horizon: Infinity });
    for (const list of [segments, stations, transfers]) {
      const keys = list.map((f) => f.properties!.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe('wayColor / routeColors', () => {
  it('colours a ride by its line and leaves a walk clear', () => {
    expect(wayColor(net, 'aristotelous', 'xanth', Infinity)).toBe(color('3'));
    expect(wayColor(net, 'dimokratias', 'dimokratias-3', Infinity)).toBeNull();
  });

  it('colours shared track by the train taken', () => {
    const route = findRoute(buildGraph(net, null), 'venizelou', 'mikra')!;
    const colors = routeColors(net, route);
    expect(colors.get(pairKey('venizelou', 'agias-sofias'))).toBe(color('2'));
    expect(colors.get(pairKey('25-martiou', 'nomarchia'))).toBe(color('2'));
  });
});
