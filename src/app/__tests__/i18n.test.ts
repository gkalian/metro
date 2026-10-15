import { afterEach, describe, expect, it } from 'vitest';
import { englishDate, nameOf, setLang, tr } from '../i18n';

afterEach(() => setLang('ru'));

describe('nameOf', () => {
  const s = { name: 'Автово', nameEn: 'Avtovo' };

  it('gives the name in the current language', () => {
    expect(nameOf(s)).toBe('Автово');
    setLang('en');
    expect(nameOf(s)).toBe('Avtovo');
    expect(tr('Да', 'Yes')).toBe('Yes');
  });

  it('falls back to Russian', () => {
    setLang('en');
    expect(nameOf({ name: 'Автово' })).toBe('Автово');
  });
});

describe('englishDate', () => {
  it('translates the date from a note', () => {
    expect(englishDate('Открыта 29 декабря 1978 года', 1978)).toBe('29 December 1978');
    expect(englishDate('Открыта 30 декабря 1991 года. Второй выход — 2028 (по схеме)', 1991)).toBe('30 December 1991');
    expect(englishDate('Южный вестибюль открыт 27 мая 2015 года. Со станцией…', 2015)).toBe('27 May 2015');
  });

  it('gives the year when the note has no date for it', () => {
    expect(englishDate(undefined, 1955)).toBe('1955');
    expect(englishDate('Горнопроходческие работы', 2030)).toBe('2030');
    expect(englishDate('Открыта 1 июня 1958 года', 1961)).toBe('1961');
  });
});
