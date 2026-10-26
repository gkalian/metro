import { afterEach, describe, expect, it } from 'vitest';
import { LANGS, nameOf, nextLang, noteDate, setCityTexts, setLang, t } from '../i18n';

afterEach(() => {
  setLang('ru');
  setCityTexts({ langs: LANGS, localLang: 'ru' });
});

describe('nameOf', () => {
  const s = { name: 'Автово', nameEn: 'Avtovo' };

  it('gives the name in the current language', () => {
    expect(nameOf(s)).toBe('Автово');
    setLang('en');
    expect(nameOf(s)).toBe('Avtovo');
    setLang('el');
    expect(nameOf({ ...s, nameEl: 'Άφτοβο' })).toBe('Άφτοβο');
  });

  it('falls back to English, then Russian', () => {
    setLang('el');
    expect(nameOf(s)).toBe('Avtovo');
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
    setLang('el');
    expect(t('minutes', 7)).toBe('7 λεπ.');
  });

  it('takes the city’s wording where it has one', () => {
    setCityTexts({ langs: LANGS, localLang: 'ru', messages: { ru: { noteFuture: 'По плану до 2040 года.' } } });
    expect(t('noteFuture')).toBe('По плану до 2040 года.');
    setLang('en');
    expect(t('noteFuture')).toBe('The future network follows the development plans; dates may shift.');
  });
});

describe('nextLang', () => {
  it('steps through the city’s languages and back', () => {
    setCityTexts({ langs: ['ru', 'en'], localLang: 'ru' });
    expect(['ru', 'en'].map((l) => nextLang(l as 'ru' | 'en'))).toEqual(['en', 'ru']);
    setCityTexts({ langs: LANGS, localLang: 'el' });
    expect(LANGS.map(nextLang)).toEqual(['en', 'el', 'ru']);
  });

  it('names the next language on the button', () => {
    expect(t('languageButton', 'en')).toBe('Язык: русский. Переключить на английский');
    setLang('en');
    expect(t('languageButton', 'el')).toBe('Language: English. Switch to Greek');
  });
});

describe('noteDate', () => {
  it('translates the date from a note', () => {
    setLang('en');
    expect(noteDate('Открыта 29 декабря 1978 года', 1978)).toBe('29 December 1978');
    expect(noteDate('Открыта 30 декабря 1991 года. Второй выход — 2028 (по схеме)', 1991)).toBe('30 December 1991');
    expect(noteDate('Южный вестибюль открыт 27 мая 2015 года. Со станцией…', 2015)).toBe('27 May 2015');
    setLang('el');
    expect(noteDate('Открыта 30 ноября 2024 года', 2024)).toBe('30 Νοεμβρίου 2024');
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
