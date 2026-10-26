import { describe, expect, it } from 'vitest';
import { decadeHorizons, isOpen, loadNetwork } from '../network';
import { spb } from '../../../cities/spb/city';
import { buildGraph, findRoute } from '../routing';

const net = loadNetwork(spb.network);
const open = buildGraph(net, null);
const planned = buildGraph(net, Infinity);

describe('findRoute', () => {
  it('sums run times along one line', () => {
    const r = findRoute(open, 'devyatkino', 'akademicheskaya')!;
    expect(r.time).toBe(180 + 360);
    expect(r.transfers).toBe(0);
    expect(r.legs).toHaveLength(1);
  });

  it('adds transfer time when changing lines', () => {
    const r = findRoute(open, 'baltiyskaya', 'frunzenskaya')!;
    expect(r.transfers).toBe(1);
    expect(r.time).toBe(120 + 60 + 120);
    expect(r.transferTime).toBe(60);
    expect(r.legs.map((l) => l.kind)).toEqual(['ride', 'transfer', 'ride']);
  });

  it('rides through a non-stopping station without listing it as a stop', () => {
    const r = findRoute(open, 'gornyy-institut', 'spasskaya')!;
    expect(r.time).toBe(360);
    expect(r.path).toEqual(['gornyy-institut', 'teatralnaya', 'spasskaya']);
    expect(r.legs[0]).toMatchObject({ kind: 'ride', stations: ['gornyy-institut', 'spasskaya'] });
  });

  it('reaches planned stations only when they are included', () => {
    expect(findRoute(open, 'begovaya', 'kamenka')).toBeNull();
    const r = findRoute(planned, 'begovaya', 'kamenka')!;
    expect(r.estimated).toBe(true);
    expect(r.path).toEqual(['begovaya', 'bogatirskaya', 'kamenka']);
  });

  it('opens stations by the year the scheme gives', () => {
    const in2029 = buildGraph(net, 2029);
    const in2030 = buildGraph(net, 2030);
    expect(findRoute(in2029, 'begovaya', 'kamenka')).toBeNull();
    expect(findRoute(in2030, 'begovaya', 'kamenka')).not.toBeNull();
    expect(findRoute(in2029, 'gornyy-institut', 'spasskaya')!.legs[0]).toMatchObject({
      stations: ['gornyy-institut', 'teatralnaya', 'spasskaya'],
    });
  });

  it('follows a branch from its fork without a transfer', () => {
    const in2035 = buildGraph(net, 2035);
    const r = findRoute(in2035, 'avtovo', 'pulkovo')!;
    expect(r.transfers).toBe(0);
    expect(r.path).toContain('prospekt-veteranov');
    expect(r.path).not.toContain('aleksandrino');
    expect(findRoute(in2035, 'avtovo', 'kvc-ekspoforum')).toBeNull();
    expect(findRoute(planned, 'avtovo', 'kvc-ekspoforum')).not.toBeNull();
  });

  it('looks back to the network of a past year', () => {
    const in1959 = buildGraph(net, 1959);
    expect(findRoute(in1959, 'avtovo', 'ploschad-lenina')).not.toBeNull();
    expect(findRoute(in1959, 'avtovo', 'devyatkino')).toBeNull();
    expect(findRoute(in1959, 'avtovo', 'nevskiy-prospekt')).toBeNull();
  });

  it('runs through a station built before it opened', () => {
    const r = findRoute(buildGraph(net, 1955), 'vladimirskaya', 'tehnologicheskiy-institut-1')!;
    expect(r.path).toEqual(['vladimirskaya', 'pushkinskaya', 'tehnologicheskiy-institut-1']);
    expect(r.legs[0]).toMatchObject({ stations: ['vladimirskaya', 'tehnologicheskiy-institut-1'] });
  });

  it('uses track that only existed in the past', () => {
    const in1999 = buildGraph(net, 1999);
    const r = findRoute(in1999, 'ladozhskaya', 'staraya-derevnya')!;
    expect(r.transfers).toBe(0);
    expect(r.path).toContain('sadovaya');
    expect(r.legs[0]).toMatchObject({ kind: 'ride', lineIds: ['4'] });
    const today = findRoute(open, 'ladozhskaya', 'staraya-derevnya')!;
    expect(today.transfers).toBeGreaterThan(0);
  });

  it('names the line a historic ride was on, whichever end it starts from', () => {
    const in1999 = buildGraph(net, 1999);
    for (const [from, to] of [
      ['sportivnaya', 'ladozhskaya'],
      ['ladozhskaya', 'sportivnaya'],
    ] as const) {
      const r = findRoute(in1999, from, to)!;
      expect(r.legs, `${from} → ${to}`).toHaveLength(1);
      expect(r.legs[0]).toMatchObject({ kind: 'ride', lineIds: ['4'] });
    }
    // today the same trip starts on line 5
    const today = findRoute(open, 'sportivnaya', 'ladozhskaya')!;
    expect(today.legs[0]).toMatchObject({ kind: 'ride', lineIds: ['5'] });
  });

  it('keeps the network of every decade connected', () => {
    for (const year of decadeHorizons(net)) {
      const graph = buildGraph(net, year);
      const ids = [...net.stations.values()].filter((s) => isOpen(net, s, year)).map((s) => s.id);
      for (const id of ids) expect(findRoute(graph, ids[0]!, id), `${year}: ${id}`).not.toBeNull();
    }
  });

  it('connects every pair of open stations', () => {
    const ids = [...open.keys()];
    for (const id of ids) expect(findRoute(open, ids[0]!, id)).not.toBeNull();
  });

  it('returns an empty route for the same station', () => {
    const r = findRoute(open, 'avtovo', 'avtovo')!;
    expect(r.time).toBe(0);
    expect(r.legs).toEqual([]);
  });
});
