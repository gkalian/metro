import type { CityTexts, Lang } from './app/i18n.ts';
import type { NetworkData } from './domain/network.ts';
import type { RailwayData } from './domain/railway.ts';

/**
 * What the engine needs to know of a city; each city describes itself in
 * `src/cities/<id>/city.ts` and is listed in `src/cities/index.ts`.
 */
export interface City extends CityTexts {
  id: string;
  /** Where the city's page lives below the site root: '' for the main city, else e.g. 'thessaloniki/'. */
  path: string;
  /** «Метро Санкт-Петербурга»: the page heading, in every language, for the city switcher too. */
  title: Record<Lang, string>;
  /** For search engines and link previews, in Russian. */
  description: string;
  /** What the link preview picture (`public/<path>og.jpg`) shows, in Russian. */
  imageAlt: string;
  /** Colour of the favicon, usually line 1. */
  color: string;
  /** Steps of the past on the year slider: decades, or the years in which stations opened. */
  history: 'decades' | 'years';
  /** South-west and north-east corners the map cannot be moved past, as [lon, lat]. */
  bounds: [[number, number], [number, number]];
  /** The network, loaded with the page of this city only. */
  load: () => Promise<CityData>;
}

export interface CityData {
  network: NetworkData;
  /** Suburban rail drawn on the map, when the city has the data. */
  railway?: RailwayData;
}
