import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from '../i18n';
import { loadNetwork } from '../../domain/network';
import { data as spb } from '../../../cities/spb/data';
import { parseYear, timelineOf, yearParam } from '../horizons';

const net = loadNetwork(spb.network);
const timeline = timelineOf(net, 'decades');
const horizons = timeline.stops;

afterEach(() => setLang('ru'));

describe('timeline', () => {
  it('runs from the past through today to every plan', () => {
    expect(horizons[0]).toBe(1959);
    expect(horizons).toContain(null);
    expect(horizons.at(-1)).toBe(Infinity);
    const years = horizons.filter((h): h is number => h !== null && h !== Infinity);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it('says nothing after «Хронология» for today', () => {
    expect(timeline.heading(null)).toBe('');
    expect(timeline.heading(2019)).toBe(': к концу 2010-х');
    expect(timeline.heading(2030)).toBe(': на 2030');
    expect(timeline.heading(Infinity)).toBe(': все планы');
  });

  it('labels stops and the routing hint', () => {
    expect(timeline.label(null)).toBe('на сегодня');
    expect(timeline.label(1979)).toBe('к концу 1970-х');
    expect(timeline.tick(1959)).toBe('50-е');
    expect(timeline.tick(null)).toBe('сейчас');
  });

  it('labels in English', () => {
    setLang('en');
    expect(timeline.label(1979)).toBe('by the end of the 1970s');
    expect(timeline.heading(Infinity)).toBe(': all plans');
    expect(timeline.tick(1959)).toBe('50s');
    expect(timeline.tick(null)).toBe('now');
  });

  it('steps by the years of openings where the city wants it', () => {
    const years = timelineOf(net, 'years');
    expect(years.stops[0]).toBe(1955);
    expect(years.label(1961)).toBe('на конец 1961 года');
    expect(years.tick(1961)).toBe('1961');
  });

  it('round-trips through the URL', () => {
    for (const h of horizons) expect(parseYear(horizons, yearParam(h))).toBe(h);
    expect(parseYear(horizons, '1234')).toBeNull();
    expect(parseYear(horizons, null)).toBeNull();
  });
});
