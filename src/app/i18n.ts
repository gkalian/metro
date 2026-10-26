/**
 * Language of the page and its texts, from the dictionaries in `messages/`. Station tooltips
 * outside Russian give only the name, line and opening date: the notes in the data are Russian.
 */
import { en } from './messages/en';
import { ru, type Messages } from './messages/ru';

export type Lang = 'ru' | 'en';
/** In the order the language button steps through them. */
export const LANGS: readonly Lang[] = ['ru', 'en'];

const MESSAGES: Record<Lang, Messages> = { ru, en };

let current: Lang = 'ru';

export const lang = (): Lang => current;

export function setLang(value: Lang): void {
  current = value;
}

/** The language after the current one, for the language button. */
export const nextLang = (l: Lang): Lang => LANGS[(LANGS.indexOf(l) + 1) % LANGS.length]!;

export type MessageKey = keyof Messages;
type Args<K extends MessageKey> = Messages[K] extends (...args: infer A) => string ? A : [];

/** The text under `key` in the current language, e.g. `t('transfers', 2)`. */
export function t<K extends MessageKey>(key: K, ...args: Args<K>): string {
  const text = MESSAGES[current][key];
  return typeof text === 'function' ? (text as (...a: unknown[]) => string)(...args) : text;
}

/** Name of a station or line in the current language; Russian where no translation is given. */
export const nameOf = (x: { name: string; nameEn?: string }): string => (current === 'en' ? (x.nameEn ?? x.name) : x.name);

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

/** «29 декабря 1978 года» found in a note, in the current language; the year alone otherwise. */
export function noteDate(note: string | undefined, year: number): string {
  const m = note?.match(/(\d{1,2}) ([а-я]+) (\d{4}) года/);
  const month = m ? MONTHS.indexOf(m[2]!) : -1;
  return m && month >= 0 && Number(m[3]) === year ? t('date', Number(m[1]), month, year) : String(year);
}
