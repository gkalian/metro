import { describe, expect, it } from 'vitest';
import { loadNetwork } from '../../domain/network';
import { loadRailway } from '../../domain/railway';
import { data as spb } from '../../../cities/spb/data';
import { buildGraph, findRoute } from '../../domain/routing';
import { metroFeatures, pairKey, railCurves, railFeatures, trackCurves, wayColor, type MapState } from '../features';

const net = loadNetwork(spb.network);
const rail = loadRailway(spb.railway);
const curves = trackCurves(net);
const color = (lineId: string) => net.lineById.get(lineId)!.color;
const base: MapState = { showPlanned: true, showRail: true, horizon: null, from: null, to: null, route: null };

const segment = (state: MapState, a: string, b: string) =>
  metroFeatures(net, curves, state).segments.find((f) => String(f.properties!.key).startsWith(`${pairKey(a, b)}|`));
const station = (state: MapState, id: string) =>
  metroFeatures(net, curves, state).stations.find((f) => f.properties!.id === id);

describe('metroFeatures', () => {
  it('draws the Садовая — Комендантский проспект section orange before 2009', () => {
    const in1999 = { ...base, horizon: 1999 };
    expect(segment(in1999, 'sportivnaya', 'chkalovskaya')!.properties!.color).toBe(color('4'));
    expect(station(in1999, 'sportivnaya')!.properties!.color).toBe(color('4'));
    expect(segment(base, 'sportivnaya', 'chkalovskaya')!.properties!.color).toBe(color('5'));
    expect(station(base, 'sportivnaya')!.properties!.color).toBe(color('5'));
  });

  it('changes the key with the look, so the fader cross-fades it', () => {
    const then = station({ ...base, horizon: 1999 }, 'sportivnaya')!.properties!.key;
    const now = station(base, 'sportivnaya')!.properties!.key;
    expect(then).not.toBe(now);
  });

  it('leaves later stations out when looking back', () => {
    expect(station({ ...base, horizon: 1959 }, 'devyatkino')).toBeUndefined();
    expect(station(base, 'kamenka')!.properties!.planned).toBe(true);
    expect(station({ ...base, showPlanned: false }, 'kamenka')).toBeUndefined();
  });

  it('draws the Vasilyevsky exit of «Спортивная» as the station joined by a transfer from 2015 on', () => {
    const exit = (state: MapState) =>
      metroFeatures(net, curves, state).stations.find((f) => f.properties!.exit === 'sportivnaya-vo');
    const passage = (state: MapState) =>
      metroFeatures(net, curves, state).transfers.find((f) => f.properties!.key === 'exit|sportivnaya-vo');
    expect(exit({ ...base, horizon: 2009 })).toBeUndefined();
    expect(passage({ ...base, horizon: 2009 })).toBeUndefined();
    expect(exit(base)!.properties).toMatchObject({ id: 'sportivnaya', name: 'Спортивная', color: color('5') });
    expect(passage(base)).toBeDefined();
  });

  it('mutes everything but the route', () => {
    const route = findRoute(buildGraph(net, null), 'devyatkino', 'akademicheskaya')!;
    const state = { ...base, from: 'devyatkino', to: 'akademicheskaya', route };
    expect(station(state, 'grazhdanskiy-prospekt')!.properties!.dim).toBe(false);
    expect(station(state, 'avtovo')!.properties!.dim).toBe(true);
    expect(station(state, 'devyatkino')!.properties!.role).toBe('from');
  });

  it('keys every feature uniquely', () => {
    const { segments, stations, transfers } = metroFeatures(net, curves, { ...base, horizon: Infinity });
    for (const list of [segments, stations, transfers]) {
      const keys = list.map((f) => f.properties!.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe('wayColor', () => {
  it('colours a ride by its line then, and leaves a walk clear', () => {
    expect(wayColor(net, 'dostoevskaya', 'sadovaya', 1999)).toBe(color('4'));
    expect(wayColor(net, 'sadovaya', 'sportivnaya', 1999)).toBe(color('4'));
    expect(wayColor(net, 'sadovaya', 'sportivnaya', null)).toBe(color('5'));
    expect(wayColor(net, 'sennaya-ploschad', 'sadovaya', null)).toBeNull();
  });
});

describe('railFeatures', () => {
  it('draws nothing when rail is switched off', () => {
    expect(railFeatures(net, rail, railCurves(rail), { ...base, showRail: false }).stations).toEqual([]);
  });

  it('leaves a name to the metro label when they match', () => {
    const { stations } = railFeatures(net, rail, railCurves(rail), base);
    const named = stations.filter((f) => f.properties!.name);
    expect(named.length).toBeGreaterThan(0);
    expect(named.length).toBeLessThan(stations.length);
  });
});
