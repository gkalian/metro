import { describe, expect, it } from 'vitest';
import { loadNetwork } from '../../domain/network';
import { chronologyValue, horizonLabel, horizonsOf, parseYear, tickLabel, yearParam } from '../horizons';

const net = loadNetwork();
const horizons = horizonsOf(net);

describe('horizons', () => {
  it('runs from the past through today to every plan', () => {
    expect(horizons[0]).toBe(1959);
    expect(horizons).toContain(null);
    expect(horizons.at(-1)).toBe(Infinity);
    const years = horizons.filter((h): h is number => h !== null && h !== Infinity);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it('says nothing after «Хронология» for today', () => {
    expect(chronologyValue(null)).toBe('');
    expect(chronologyValue(2019)).toBe(': к концу 2010-х');
    expect(chronologyValue(2030)).toBe(': на 2030');
    expect(chronologyValue(Infinity)).toBe(': все планы');
  });

  it('labels stops and the routing hint', () => {
    expect(horizonLabel(null)).toBe('на сегодня');
    expect(horizonLabel(1979)).toBe('к концу 1970-х');
    expect(tickLabel(1959)).toBe('50-е');
    expect(tickLabel(null)).toBe('сейчас');
  });

  it('round-trips through the URL', () => {
    for (const h of horizons) expect(parseYear(horizons, yearParam(h))).toBe(h);
    expect(parseYear(horizons, '1234')).toBeNull();
    expect(parseYear(horizons, null)).toBeNull();
  });
});
