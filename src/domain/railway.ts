import raw from '../data/railway.json';

/** Suburban rail stop from the metro scheme; shown on the map only, not routed. */
export interface RailStation {
  id: string;
  name: string;
  nameEn?: string;
  lat: number;
  lon: number;
  /** Metro stations within walking distance, as the scheme draws them. */
  metro?: string[];
}

/** A clock-face suburban route, stations in running order from the terminal. */
export interface RailRoute {
  id: string;
  name: string;
  stations: string[];
}

export interface Railway {
  routes: RailRoute[];
  stations: Map<string, RailStation>;
}

export function loadRailway(): Railway {
  const data = raw as { routes: RailRoute[]; stations: RailStation[] };
  return { routes: data.routes, stations: new Map(data.stations.map((s) => [s.id, s])) };
}

/** Routes calling at the station. */
export function routesAt(rail: Railway, id: string): RailRoute[] {
  return rail.routes.filter((r) => r.stations.includes(id));
}
