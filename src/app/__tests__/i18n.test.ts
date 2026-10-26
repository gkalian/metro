import { afterEach, describe, expect, it } from 'vitest';
import { LANGS, nameOf, nextLang, noteDate, setLang, t } from '../i18n';

afterEach(() => setLang('ru'));

describe('nameOf', () => {
  const s = { name: 'Автово', nameEn: 'Avtovo' };

  it('gives the name in the current language', () => {
    expect(nameOf(s)).toBe('Автово');
    setLang('en');
    expect(nameOf(s)).toBe('Avtovo');
  });

  it('falls back to Russian', () => {
    setLang('en');
    expect(nameOf({ name: 'Автово' })).toBe('Автово');
  });
});

describe('t', () => {
  it('gives the text in the current language, with its arguments', () => {
    expect(t('noTransfers')).toBe('без пересадок');
    expect(t('transfers', 2)).toBe('2 пересадки');
    expect(t('stopsBetween', 5)).toBe('5 станций без пересадки');
    setLang('en');
    expect(t('noTransfers')).toBe('no transfers');
    expect(t('anyTrain', ['1', '2'])).toBe('Any train of lines 1 and 2');
  });
});

describe('nextLang', () => {
  it('steps through every language and back', () => {
    expect(LANGS.map(nextLang)).toEqual(['en', 'ru']);
  });
});

describe('noteDate', () => {
  it('translates the date from a note', () => {
    setLang('en');
    expect(noteDate('Открыта 29 декабря 1978 года', 1978)).toBe('29 December 1978');
    expect(noteDate('Открыта 30 декабря 1991 года. Второй выход — 2028 (по схеме)', 1991)).toBe('30 December 1991');
    expect(noteDate('Южный вестибюль открыт 27 мая 2015 года. Со станцией…', 2015)).toBe('27 May 2015');
    setLang('ru');
    expect(noteDate('Открыта 29 декабря 1978 года', 1978)).toBe('29 декабря 1978 года');
  });

  it('gives the year when the note has no date for it', () => {
    setLang('en');
    expect(noteDate(undefined, 1955)).toBe('1955');
    expect(noteDate('Горнопроходческие работы', 2030)).toBe('2030');
    expect(noteDate('Открыта 1 июня 1958 года', 1961)).toBe('1961');
  });
});
