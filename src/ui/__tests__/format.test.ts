import { afterEach, describe, expect, it } from 'vitest';
import { setLang, t } from '../../app/i18n';
import { plural } from '../../app/messages/ru';
import { formatTime, normalize } from '../format';

afterEach(() => setLang('ru'));

describe('formatTime', () => {
  it('rounds to minutes, at least one', () => {
    expect(formatTime(10)).toBe('1 мин');
    expect(formatTime(150)).toBe('3 мин');
    expect(formatTime(59 * 60)).toBe('59 мин');
  });

  it('switches to hours past an hour', () => {
    expect(formatTime(65 * 60)).toBe('1 ч 05 мин');
    expect(formatTime(120 * 60)).toBe('2 ч 00 мин');
  });
});

describe('plural', () => {
  const st = (n: number) => plural(n, 'станция', 'станции', 'станций');

  it('picks the Russian form', () => {
    expect([1, 2, 5, 11, 12, 14, 21, 22, 25, 101, 111].map(st)).toEqual([
      'станция', 'станции', 'станций', 'станций', 'станций', 'станций',
      'станция', 'станции', 'станций', 'станция', 'станций',
    ]);
  });
});

describe('in English', () => {
  it('formats time and counts', () => {
    setLang('en');
    expect(formatTime(65 * 60)).toBe('1 h 05 min');
    expect(t('transfers', 1)).toBe('1 transfer');
    expect(t('transfers', 3)).toBe('3 transfers');
  });
});

describe('normalize', () => {
  it('ignores case and ё', () => {
    expect(normalize(' Чёрная речка ')).toBe('черная речка');
  });
});
