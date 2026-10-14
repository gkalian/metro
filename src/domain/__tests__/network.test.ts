import { describe, expect, it } from 'vitest';
import { activeLinks, decadeHorizons, inService, isOpen, isPast, lineAt, loadNetwork, sectionLine } from '../network';

const net = loadNetwork();
const st = (id: string) => net.stations.get(id)!;

describe('isOpen / inService', () => {
  it('opens stations by their year when looking back', () => {
    expect(isOpen(st('sportivnaya'), 1989)).toBe(false);
    expect(isOpen(st('sportivnaya'), 1999)).toBe(true);
  });

  it('runs trains through a station before it opens', () => {
    // «Адмиралтейская»: trains since 1997, passengers since 2011
    expect(isOpen(st('admiralteyskaya'), 1999)).toBe(false);
    expect(inService(st('admiralteyskaya'), 1999)).toBe(true);
  });

  it('opens planned stations by the scheme year, undated ones only with every plan', () => {
    expect(isOpen(st('kamenka'))).toBe(false);
    expect(isOpen(st('kvc-ekspoforum'), 2040)).toBe(false);
    expect(isOpen(st('kvc-ekspoforum'), Infinity)).toBe(true);
  });

  it('tells history from plans', () => {
    expect(isPast(null)).toBe(false);
    expect(isPast(1999)).toBe(true);
    expect(isPast(2040)).toBe(false);
  });
});

describe('lineAt', () => {
  it('puts the Садовая — Комендантский проспект section on line 4 before 2009', () => {
    for (const id of ['sadovaya', 'sportivnaya', 'komendantskiy-prospekt']) {
      expect(lineAt(net, st(id), 1999).id, id).toBe('4');
      expect(lineAt(net, st(id), 2009).id, id).toBe('5');
      expect(lineAt(net, st(id), null).id, id).toBe('5');
    }
  });

  it('leaves stations that never moved alone', () => {
    expect(lineAt(net, st('dostoevskaya'), 1999).id).toBe('4');
    expect(lineAt(net, st('nevskiy-prospekt'), 1999).id).toBe('2');
  });

  it('gives a section the line both its ends were on', () => {
    const l5 = net.lineById.get('5')!;
    expect(sectionLine(net, l5, st('sportivnaya'), st('chkalovskaya'), 1999).id).toBe('4');
    expect(sectionLine(net, l5, st('sportivnaya'), st('chkalovskaya'), null).id).toBe('5');
  });
});

describe('history', () => {
  it('runs the Достоевская — Садовая track until 2009', () => {
    expect(activeLinks(net, 1999).map((l) => l.b)).toEqual(['sadovaya']);
    expect(activeLinks(net, 2009)).toEqual([]);
    expect(activeLinks(net, null)).toEqual([]);
  });

  it('steps by decade up to the current one', () => {
    const decades = decadeHorizons(net);
    expect(decades[0]).toBe(1959);
    expect(decades.every((d) => d % 10 === 9)).toBe(true);
  });
});
