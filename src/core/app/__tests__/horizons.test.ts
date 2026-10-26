import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from '../i18n';
import { loadNetwork } from '../../domain/network';
import { spb } from '../../../cities/spb/city';
import { chronologyValue, horizonLabel, horizonsOf, parseYear, tickLabel, yearParam } from '../horizons';

const net = loadNetwork(spb.network);
const horizons = horizonsOf(net);

afterEach(() => setLang('ru'));

describe('horizons', () => {
  it('runs from the past through today to every plan', () => {
    expect(horizons[0]).toBe(1959);
    expect(horizons).toContain(null);
    expect(horizons.at(-1)).toBe(Infinity);
    const years = horizons.filter((h): h is number => h !== null && h !== Infinity);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it('says nothing after «Хронология» for today', () => {
    expect(chronologyValue(net, null)).toBe('');
    expect(chronologyValue(net, 2019)).toBe(': к концу 2010-х');
    expect(chronologyValue(net, 2030)).toBe(': на 2030');
    expect(chronologyValue(net, Infinity)).toBe(': все планы');
  });

  it('labels stops and the routing hint', () => {
    expect(horizonLabel(net, null)).toBe('на сегодня');
    expect(horizonLabel(net, 1979)).toBe('к концу 1970-х');
    expect(tickLabel(net, 1959)).toBe('50-е');
    expect(tickLabel(net, null)).toBe('сейчас');
  });

  it('labels in English', () => {
    setLang('en');
    expect(horizonLabel(net, 1979)).toBe('by the end of the 1970s');
    expect(chronologyValue(net, Infinity)).toBe(': all plans');
    expect(tickLabel(net, 1959)).toBe('50s');
    expect(tickLabel(net, null)).toBe('now');
  });

  it('round-trips through the URL', () => {
    for (const h of horizons) expect(parseYear(horizons, yearParam(h))).toBe(h);
    expect(parseYear(horizons, '1234')).toBeNull();
    expect(parseYear(horizons, null)).toBeNull();
  });
});
