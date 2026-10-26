import type { City } from '../core/city.ts';
import { spb } from './spb/city.ts';
import { thessaloniki } from './thessaloniki/city.ts';

/** Every city on the site, the main one first: each gets its page, and the switcher lists them. */
export const CITIES: City[] = [spb, thessaloniki];
