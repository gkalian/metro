/**
 * Language of the page. Station tooltips in English give only the name, line and opening
 * date; the Russian ones keep every note.
 */

export type Lang = 'ru' | 'en';
export const LANGS: readonly Lang[] = ['ru', 'en'];

let current: Lang = 'ru';

export const lang = (): Lang => current;

export function setLang(value: Lang): void {
  current = value;
}

/** The text for the current language. */
export const tr = (ru: string, en: string): string => (current === 'en' ? en : ru);

/** Name of a station or line in the current language; Russian where no English one is given. */
export const nameOf = (x: { name: string; nameEn?: string }): string => tr(x.name, x.nameEn ?? x.name);

const MONTHS: Record<string, string> = {
  января: 'January',
  февраля: 'February',
  марта: 'March',
  апреля: 'April',
  мая: 'May',
  июня: 'June',
  июля: 'July',
  августа: 'August',
  сентября: 'September',
  октября: 'October',
  ноября: 'November',
  декабря: 'December',
};

/** «29 декабря 1978 года» found in a note, as «29 December 1978»; the year alone otherwise. */
export function englishDate(note: string | undefined, year: number): string {
  const m = note?.match(/(\d{1,2}) ([а-я]+) (\d{4}) года/);
  const month = m && MONTHS[m[2]!];
  return m && month && Number(m[3]) === year ? `${m[1]} ${month} ${year}` : String(year);
}
