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

/** Suburban rail as a city's data file gives it. */
export interface RailwayData {
  routes: RailRoute[];
  stations: RailStation[];
}

export interface Railway {
  routes: RailRoute[];
  stations: Map<string, RailStation>;
}

/** The city's suburban rail; none when the city has no such data. */
export function loadRailway(data: RailwayData = { routes: [], stations: [] }): Railway {
  return { routes: data.routes, stations: new Map(data.stations.map((s) => [s.id, s])) };
}

/** Routes calling at the station. */
export function routesAt(rail: Railway, id: string): RailRoute[] {
  return rail.routes.filter((r) => r.stations.includes(id));
}
