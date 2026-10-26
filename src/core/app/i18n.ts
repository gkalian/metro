/**
 * Language of the page and its texts, from the dictionaries in `messages/`. Station tooltips
 * outside Russian give only the name, line and opening date: the notes in the data are Russian.
 */
import { el } from './messages/el';
import { en } from './messages/en';
import { ru, type Messages } from './messages/ru';

export type Lang = 'ru' | 'en' | 'el';
/** Every language the engine speaks; a city picks its own from them. */
export const LANGS: readonly Lang[] = ['ru', 'en', 'el'];

const MESSAGES: Record<Lang, Messages> = { ru, en, el };

let current: Lang = 'ru';
/** The city's languages, in the order the language button steps through them. */
let langs: readonly Lang[] = LANGS;
/** The language of the city's own names and signs. */
let local: Lang = 'ru';
/** The city's own texts, in place of the engine's. */
let overrides: CityTexts['messages'] = {};

export interface CityTexts {
  /** The city's languages, in the order the language button steps through them; Russian first. */
  langs: readonly Lang[];
  /** The language of the city's signs and of the basemap's own names. */
  localLang: Lang;
  /** Texts the city words its own way, e.g. which plan its future network follows. */
  messages?: { [L in Lang]?: Partial<Messages> };
}

export const lang = (): Lang => current;
export const localLang = (): Lang => local;

export function setLang(value: Lang): void {
  current = value;
}

/** The languages and texts of the city on the page. */
export function setCityTexts(city: CityTexts): void {
  langs = city.langs;
  local = city.localLang;
  overrides = city.messages ?? {};
}

/** The language after `l` among the city's, for the language button. */
export const nextLang = (l: Lang): Lang => langs[(langs.indexOf(l) + 1) % langs.length]!;

type Args<K extends keyof Messages> = Messages[K] extends (...args: infer A) => string ? A : [];

/** The text under `key` in the current language, e.g. `t('transfers', 2)`. */
export function t<K extends keyof Messages>(key: K, ...args: Args<K>): string {
  const text = overrides?.[current]?.[key] ?? MESSAGES[current][key];
  return typeof text === 'function' ? (text as (...a: unknown[]) => string)(...args) : text;
}

/** Name of a station or line in the current language; English, then Russian where none is given. */
export const nameOf = (x: Named): string => nameIn(x, current) ?? (current === 'el' ? x.nameEn : undefined) ?? x.name;

interface Named {
  name: string;
  nameEn?: string;
  nameEl?: string;
}

/** The name in exactly this language, if the data gives one; `name` is the Russian. */
export const nameIn = (x: Named, l: Lang): string | undefined => (l === 'ru' ? x.name : l === 'en' ? x.nameEn : x.nameEl);

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

/** «29 декабря 1978 года» found in a note, in the current language; the year alone otherwise. */
export function noteDate(note: string | undefined, year: number): string {
  const m = note?.match(/(\d{1,2}) ([а-я]+) (\d{4}) года/);
  const month = m ? MONTHS.indexOf(m[2]!) : -1;
  return m && month >= 0 && Number(m[3]) === year ? t('date', Number(m[1]), month, year) : String(year);
}
