export type Status = 'open' | 'construct' | 'project';

export interface Station {
  id: string;
  name: string;
  nameEn?: string;
  nameEl?: string;
  lat: number;
  lon: number;
  status: Status;
  /** The line whose file describes the station. */
  lineId: string;
  /** Every line calling at the station, its own first. */
  lineIds: string[];
  /** Planned opening year from the development scheme. */
  opening?: number;
  /** Year the station opened to passengers. */
  opened?: number;
  /** Year trains started running through, when that came before `opened`. */
  throughSince?: number;
  /** Trains run through without stopping (station not yet open to passengers). */
  passThrough?: boolean;
  note?: string;
  /** Seconds to the next station on the line. */
  toNext?: number;
  toNextEstimated?: boolean;
}

export interface Line {
  id: string;
  name: string;
  nameEn?: string;
  nameEl?: string;
  color: string;
  /** Year trains of this line began to run, when later than the stations it shares. */
  since?: number;
  /**
   * Continuous runs of track with this line's times: the main line, then each branch from
   * its fork. Stations of other lines it runs through (shared track) are included.
   */
  runs: RunStop[][];
}

export interface Transfer {
  a: string;
  b: string;
  time: number;
}

/**
 * A vestibule far from its station, joined to it by a passage, e.g. «Спортивная» on
 * Vasilyevsky Island. Shown on the map only, not routed.
 */
export interface Exit {
  id: string;
  station: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  /** Year the exit opened to passengers, when later than the station. */
  opened?: number;
  note?: string;
}

/** Track that carried trains in the past but is not part of any line today. */
export interface HistoricLink {
  a: string;
  b: string;
  lineId: string;
  time: number;
  timeEstimated?: boolean;
  /** In service from this year up to, not including, `until`. */
  from: number;
  until: number;
  note?: string;
}

/** Stations that belonged to another line before `until`, e.g. today's line 5 north of «Садовая». */
export interface FormerLine {
  lineId: string;
  until: number;
  stations: string[];
  note?: string;
}

export interface Network {
  lines: Line[];
  transfers: Transfer[];
  exits: Exit[];
  links: HistoricLink[];
  formerLines: FormerLine[];
  stations: Map<string, Station>;
  lineById: Map<string, Line>;
  /** Former line by station id. */
  formerLineOf: Map<string, FormerLine>;
  /** Year of the most recent opening; horizons up to it look back (see `isPast`). */
  latestOpened: number;
}

/** One stop along a run of track and the time to the next stop of that run. */
export interface RunStop {
  station: Station;
  toNext?: number;
  estimated?: boolean;
}

/**
 * Which network to consider: `null` is today's, a year adds everything the
 * scheme promises by then, `Infinity` adds undated plans too. A year no later
 * than the latest opening looks back: the network as it stood at the end of it.
 */
export type Horizon = number | null;

type RawStation = Omit<Station, 'lineId' | 'lineIds'>;
/** A station of another line this one runs through, with this line's time to its next stop. */
interface RawRef {
  ref: string;
  toNext?: number;
  toNextEstimated?: boolean;
}
type RawStop = RawStation | RawRef;
/** A line file: stations in order, `{"ref": id}` for a station of another line it runs through. */
type RawLine = Omit<Line, 'runs'> & {
  stations: RawStop[];
  /** Forks, e.g. the Pulkovo branch of line 1: `time` is from `from` to the first branch station. */
  branches?: { from: string; time: number; timeEstimated?: boolean; stations: RawStop[] }[];
};

/** A city's network as its data files give it; only the lines are required. */
export interface NetworkData {
  /** One file per line, in legend order (see the README for the format). */
  lines: unknown[];
  transfers?: Transfer[];
  exits?: Exit[];
  history?: { links?: HistoricLink[]; formerLines?: FormerLine[] };
}

const isRef = (s: RawStop): s is RawRef => 'ref' in s;

/** Years up to the network's latest opening are history, later ones are plans. */
export const isPast = (net: Network, h: Horizon): h is number => h !== null && h <= net.latestOpened;

export function loadNetwork(data: NetworkData): Network {
  const rawLines = data.lines as RawLine[];
  // every station first, so a line can name one described in another line's file
  const stations = new Map<string, Station>();
  for (const line of rawLines) {
    for (const s of [...line.stations, ...(line.branches ?? []).flatMap((b) => b.stations)]) {
      if (isRef(s)) continue;
      if (stations.has(s.id)) throw new Error(`line ${line.id}: station ${s.id} is described twice`);
      stations.set(s.id, { ...s, lineId: line.id, lineIds: [line.id] });
    }
  }
  const lines: Line[] = rawLines.map(({ stations: main, branches = [], ...line }) => {
    const station = (id: string) => {
      const s = stations.get(id);
      if (!s) throw new Error(`line ${line.id}: unknown station ${id}`);
      return s;
    };
    const resolve = (list: RawStop[]): RunStop[] =>
      list.map((s) => {
        const st = station(isRef(s) ? s.ref : s.id);
        if (!st.lineIds.includes(line.id)) st.lineIds.push(line.id);
        return { station: st, toNext: s.toNext, estimated: s.toNextEstimated };
      });
    return {
      ...line,
      runs: [
        resolve(main),
        ...branches.map((b) => [{ station: station(b.from), toNext: b.time, estimated: b.timeEstimated }, ...resolve(b.stations)]),
      ],
    };
  });
  const formerLines = data.history?.formerLines ?? [];
  return {
    lines,
    transfers: data.transfers ?? [],
    exits: data.exits ?? [],
    links: data.history?.links ?? [],
    formerLines,
    stations,
    lineById: new Map(lines.map((l) => [l.id, l])),
    formerLineOf: new Map(formerLines.flatMap((f) => f.stations.map((id) => [id, f] as const))),
    latestOpened: Math.max(...[...stations.values()].map((s) => s.opened ?? 0), ...lines.map((l) => l.since ?? 0)),
  };
}

/** The line the station belonged to within the horizon. */
export function lineAt(net: Network, s: Station, horizon: Horizon): Line {
  const former = net.formerLineOf.get(s.id);
  const id = former && isPast(net, horizon) && horizon < former.until ? former.lineId : s.lineId;
  return net.lineById.get(id)!;
}

/**
 * The line a run of track between two neighbouring stations of `line` belonged to within the
 * horizon: `line` itself, unless both ends were then on another line together.
 */
export function sectionLine(net: Network, line: Line, a: Station, b: Station, horizon: Horizon): Line {
  const la = lineAt(net, a, horizon);
  return la !== net.lineById.get(a.lineId) && la === lineAt(net, b, horizon) ? la : line;
}

/** Trains of the line run within the horizon; a line that shares track may have come later. */
export const lineRunning = (net: Network, line: Line, horizon: Horizon): boolean =>
  !isPast(net, horizon) || (line.since ?? 0) <= horizon;

/** Trains of the line take passengers within the horizon: it runs and one of its own stations is open. */
const lineInUse = (net: Network, line: Line, horizon: Horizon): boolean =>
  lineRunning(net, line, horizon) &&
  line.runs.some((run) => run.some((r) => r.station.lineId === line.id && isOpen(net, r.station, horizon)));

/** Lines calling at the station within the horizon, its own first. */
export const linesAt = (net: Network, s: Station, horizon: Horizon): Line[] => [
  lineAt(net, s, horizon),
  ...s.lineIds
    .slice(1)
    .map((id) => net.lineById.get(id)!)
    .filter((l) => lineInUse(net, l, horizon)),
];

/** Station accepts passengers within the horizon. */
export function isOpen(net: Network, s: Station, horizon: Horizon = null): boolean {
  if (isPast(net, horizon)) return (s.opened ?? Infinity) <= horizon;
  if (s.status === 'open' && !s.passThrough) return true;
  if (horizon === null) return false;
  return (s.opening ?? Infinity) <= horizon;
}

/** Exit takes passengers within the horizon: its station is open and so is the exit itself. */
export function exitOpen(net: Network, e: Exit, horizon: Horizon = null): boolean {
  if (!isOpen(net, net.stations.get(e.station)!, horizon)) return false;
  return !isPast(net, horizon) || (e.opened ?? 0) <= horizon;
}

/** Trains run through the station within the horizon. */
export function inService(net: Network, s: Station, horizon: Horizon = null): boolean {
  if (isPast(net, horizon)) return isOpen(net, s, horizon) || (s.throughSince ?? Infinity) <= horizon;
  return s.status === 'open' || !!s.passThrough || isOpen(net, s, horizon);
}

/** Historic track in service within the horizon. */
export function activeLinks(net: Network, horizon: Horizon): HistoricLink[] {
  if (!isPast(net, horizon)) return [];
  return net.links.filter((l) => l.from <= horizon && horizon < l.until);
}

/** Ends of the decades before the current one, e.g. 1959 for the 1950s, ascending. */
export function decadeHorizons(net: Network): number[] {
  const first = Math.min(...[...net.stations.values()].map((s) => s.opened ?? Infinity));
  const ends: number[] = [];
  for (let d = Math.floor(first / 10) * 10; d + 9 < net.latestOpened; d += 10) ends.push(d + 9);
  return ends;
}

/** Years before the latest in which stations opened, ascending: history step by step. */
export function yearHorizons(net: Network): number[] {
  const years = new Set<number>();
  for (const s of net.stations.values()) if (s.opened && s.opened < net.latestOpened) years.add(s.opened);
  return [...years].sort((a, b) => a - b);
}

/** Years the scheme names, ascending. */
export function openingYears(net: Network): number[] {
  const years = new Set<number>();
  for (const s of net.stations.values()) if (s.opening && !isOpen(net, s)) years.add(s.opening);
  return [...years].sort((a, b) => a - b);
}
