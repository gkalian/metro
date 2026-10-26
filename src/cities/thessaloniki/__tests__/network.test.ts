import { describe, expect, it } from 'vitest';
import { activeLinks, inService, isOpen, isPast, lineAt, linesAt, loadNetwork, yearHorizons } from '../../../core/domain/network';
import { data } from '../data';

const net = loadNetwork(data.network);
const st = (id: string) => net.stations.get(id)!;

describe('isOpen / inService', () => {
  it('opens stations by their year when looking back', () => {
    expect(isOpen(net, st('nea-elvetia'), 2024)).toBe(true);
    expect(isOpen(net, st('mikra'), 2024)).toBe(false);
    expect(inService(net, st('mikra'), 2024)).toBe(false);
    expect(isOpen(net, st('mikra'))).toBe(true);
  });

  it('opens planned stations by the plan year, undated ones only with every plan', () => {
    expect(isOpen(net, st('aerodromio'))).toBe(false);
    expect(isOpen(net, st('aerodromio'), 2040)).toBe(true);
    expect(isOpen(net, st('thermi'), 2040)).toBe(false);
    expect(isOpen(net, st('thermi'), Infinity)).toBe(true);
  });

  it('tells history from plans', () => {
    expect(isPast(net, null)).toBe(false);
    expect(isPast(net, 2024)).toBe(true);
    expect(isPast(net, 2040)).toBe(false);
  });
});

describe('lineAt', () => {
  it('keeps every station on its own line', () => {
    expect(lineAt(net, st('mikra'), 2026).id).toBe('2');
    expect(lineAt(net, st('venizelou'), null).id).toBe('1');
    expect(lineAt(net, st('aristotelous'), Infinity).id).toBe('3');
    expect(lineAt(net, st('neapoli'), Infinity).id).toBe('4');
  });

  it('lists every line calling at a shared station, once it runs', () => {
    const ids = (id: string, h: Parameters<typeof linesAt>[2]) => linesAt(net, st(id), h).map((l) => l.id);
    expect(ids('venizelou', null)).toEqual(['1', '2']);
    expect(ids('venizelou', 2024)).toEqual(['1']);
    expect(ids('nea-elvetia', null)).toEqual(['1']);
    expect(ids('dimokratias', null)).toEqual(['1', '2']);
    expect(ids('dimokratias', 2040)).toEqual(['1', '2', '4']);
  });
});

describe('history', () => {
  it('has no track that is gone today', () => {
    expect(activeLinks(net, 2024)).toEqual([]);
  });

  it('steps by the years of earlier openings', () => {
    expect(yearHorizons(net)).toEqual([2024]);
  });
});
