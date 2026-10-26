import type { Lang } from './app/i18n';
import type { Messages } from './app/messages/ru';
import type { NetworkData } from './domain/network';
import type { RailwayData } from './domain/railway';

/** What the engine needs to know of a city; each city describes itself in `src/cities/<id>/city.ts`. */
export interface City {
  id: string;
  /** South-west and north-east corners the map cannot be moved past, as [lon, lat]. */
  bounds: [[number, number], [number, number]];
  network: NetworkData;
  /** Suburban rail drawn on the map, when the city has the data. */
  railway?: RailwayData;
  /** Texts that differ from the engine's, e.g. which plan the future network follows. */
  messages?: { [L in Lang]?: Partial<Messages> };
}
