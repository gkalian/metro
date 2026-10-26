import { describe, expect, it } from 'vitest';
import { isOpen, loadNetwork, yearHorizons } from '../../../core/domain/network';
import { buildGraph, findRoute } from '../../../core/domain/routing';
import { data } from '../data';

const net = loadNetwork(data.network);
const open = buildGraph(net, null);
const planned = buildGraph(net, Infinity);

describe('findRoute', () => {
  it('sums run times along one line', () => {
    const r = findRoute(open, 'neos-stathmos', 'venizelou')!;
    expect(r.time).toBe(80 + 90);
    expect(r.transfers).toBe(0);
    expect(r.legs).toHaveLength(1);
  });

  it('takes the published 17 minutes from New Railway Station to Nea Elvetia', () => {
    const r = findRoute(open, 'neos-stathmos', 'nea-elvetia')!;
    expect(Math.abs(r.time - 17 * 60)).toBeLessThanOrEqual(30);
    expect(r.estimated).toBe(true);
  });

  it('rides line 2 through from the shared track to Mikra without a change', () => {
    const r = findRoute(open, 'venizelou', 'mikra')!;
    expect(r.transfers).toBe(0);
    expect(r.legs).toHaveLength(1);
    expect(r.legs[0]).toMatchObject({ lineIds: ['2'] });
    expect(r.path).toContain('25-martiou');
    expect(r.path).not.toContain('voulgari');
  });

  it('takes a train of either line on the shared track', () => {
    const r = findRoute(open, 'neos-stathmos', 'analipsi')!;
    expect(r.legs).toHaveLength(1);
    expect(r.legs[0]).toMatchObject({ lineIds: ['1', '2'] });
  });

  it('changes trains at 25 Martiou between line 1 and line 2', () => {
    for (const [from, to] of [
      ['nea-elvetia', 'kalamaria'],
      ['kalamaria', 'nea-elvetia'],
    ] as const) {
      const r = findRoute(open, from, to)!;
      expect(r.transfers, `${from} → ${to}`).toBe(1);
      expect(r.transferTime).toBe(0);
      expect(r.legs.map((l) => l.kind)).toEqual(['ride', 'transfer', 'ride']);
      expect(r.legs[1]).toMatchObject({ from: '25-martiou', to: '25-martiou', change: true });
    }
    const lines = findRoute(open, 'nea-elvetia', 'kalamaria')!.legs.map((l) => (l.kind === 'ride' ? l.lineIds[0] : '-'));
    expect(lines).toEqual(['1', '-', '2']);
  });

  it('changes onto line 4 at Dimokratias', () => {
    const r = findRoute(buildGraph(net, 2040), 'venizelou', 'neapoli')!;
    expect(r.transfers).toBe(1);
    expect(r.legs[1]).toMatchObject({ from: 'dimokratias', change: true });
    expect(r.legs[2]).toMatchObject({ lineIds: ['4'] });
  });

  it('does not count a change when the trip ends at the fork', () => {
    expect(findRoute(open, 'nea-elvetia', '25-martiou')!.transfers).toBe(0);
    expect(findRoute(open, 'mikra', '25-martiou')!.transfers).toBe(0);
  });

  it('adds transfer time when changing lines', () => {
    const r = findRoute(planned, 'venizelou', 'aristotelous')!;
    expect(r.transfers).toBe(1);
    expect(r.transferTime).toBe(180);
    expect(r.legs.map((l) => l.kind)).toEqual(['ride', 'transfer', 'ride']);
  });

  it('reaches planned stations only when they are included', () => {
    expect(findRoute(open, 'mikra', 'aerodromio')).toBeNull();
    const r = findRoute(buildGraph(net, 2040), 'mikra', 'aerodromio')!;
    expect(r.transfers).toBe(0);
    expect(r.path).toContain('patriarchika');
    expect(findRoute(buildGraph(net, 2040), 'mikra', 'thermi')).toBeNull();
    expect(findRoute(planned, 'mikra', 'thermi')).not.toBeNull();
  });

  it('looks back to the network of a past year, before line 2 ran', () => {
    const in2024 = buildGraph(net, 2024);
    expect(findRoute(in2024, 'neos-stathmos', 'nea-elvetia')).not.toBeNull();
    expect(findRoute(in2024, 'neos-stathmos', 'mikra')).toBeNull();
    expect(findRoute(in2024, 'neos-stathmos', 'analipsi')!.legs[0]).toMatchObject({ lineIds: ['1'] });
  });

  it('keeps the network of every past year connected', () => {
    for (const year of yearHorizons(net)) {
      const graph = buildGraph(net, year);
      const ids = [...net.stations.values()].filter((s) => isOpen(net, s, year)).map((s) => s.id);
      for (const id of ids) expect(findRoute(graph, ids[0]!, id), `${year}: ${id}`).not.toBeNull();
    }
  });

  it('connects every pair of stations, today and with every plan', () => {
    for (const graph of [open, planned]) {
      const ids = [...graph.keys()];
      for (const id of ids) expect(findRoute(graph, ids[0]!, id)).not.toBeNull();
    }
  });

  it('returns an empty route for the same station', () => {
    const r = findRoute(open, 'mikra', 'mikra')!;
    expect(r.time).toBe(0);
    expect(r.legs).toEqual([]);
  });
});
