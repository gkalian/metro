import line1 from '../data/lines/1.json';
import line2 from '../data/lines/2.json';
import line3 from '../data/lines/3.json';
import line4 from '../data/lines/4.json';
import line5 from '../data/lines/5.json';
import line6 from '../data/lines/6.json';
import lineK from '../data/lines/k.json';
import exits from '../data/exits.json';
import history from '../data/history.json';
import transfers from '../data/transfers.json';

export type Status = 'open' | 'construct' | 'project';

export interface Station {
  id: string;
  name: string;
  lat: number;
  lon: number;
  status: Status;
  lineId: string;
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

/** A fork leaving the line at `from`, e.g. the Pulkovo branch of line 1. */
export interface Branch {
  from: string;
  /** Seconds from `from` to the first branch station. */
  time: number;
  timeEstimated?: boolean;
  stations: Station[];
}

export interface Line {
  id: string;
  name: string;
  color: string;
  stations: Station[];
  branches: Branch[];
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

type RawStation = Omit<Station, 'lineId'>;
type RawLine = Omit<Line, 'stations' | 'branches'> & {
  stations: RawStation[];
  branches?: (Omit<Branch, 'stations'> & { stations: RawStation[] })[];
};

/** One file per line, in legend order. */
const RAW_LINES = [line1, line2, line3, line4, line5, line6, lineK] as unknown as RawLine[];

/** The most recent opening; years up to it are history, later ones are plans. */
const LATEST_OPENED = Math.max(
  ...RAW_LINES.flatMap((l) => [...l.stations, ...(l.branches ?? []).flatMap((b) => b.stations)]).map((s) => s.opened ?? 0),
);

export const isPast = (h: Horizon): h is number => h !== null && h <= LATEST_OPENED;

export const STATUS_LABEL: Record<Status, string> = {
  open: 'Действует',
  construct: 'Строится',
  project: 'Проектируется',
};

export function loadNetwork(): Network {
  const lines: Line[] = RAW_LINES.map((line) => {
    const own = (list: RawStation[]) => list.map((s) => ({ ...s, lineId: line.id }));
    return {
      ...line,
      stations: own(line.stations),
      branches: (line.branches ?? []).map((b) => ({ ...b, stations: own(b.stations) })),
    };
  });
  const stations = new Map<string, Station>();
  for (const line of lines) {
    for (const s of line.stations) stations.set(s.id, s);
    for (const b of line.branches) for (const s of b.stations) stations.set(s.id, s);
  }
  const formerLines = history.formerLines as FormerLine[];
  return {
    lines,
    transfers: transfers as Transfer[],
    exits: exits as Exit[],
    links: history.links as HistoricLink[],
    formerLines,
    stations,
    lineById: new Map(lines.map((l) => [l.id, l])),
    formerLineOf: new Map(formerLines.flatMap((f) => f.stations.map((id) => [id, f] as const))),
  };
}

/** The line the station belonged to within the horizon. */
export function lineAt(net: Network, s: Station, horizon: Horizon): Line {
  const former = net.formerLineOf.get(s.id);
  const id = former && isPast(horizon) && horizon < former.until ? former.lineId : s.lineId;
  return net.lineById.get(id)!;
}

/** The line a run of track between two neighbouring stations of `line` belonged to within the horizon. */
export function sectionLine(net: Network, line: Line, a: Station, b: Station, horizon: Horizon): Line {
  const la = lineAt(net, a, horizon);
  return la === lineAt(net, b, horizon) ? la : line;
}

/** Continuous runs of track: the main line, then each branch starting at its fork. */
export function lineRuns(net: Network, line: Line): RunStop[][] {
  const stops = (list: Station[]): RunStop[] =>
    list.map((s) => ({ station: s, toNext: s.toNext, estimated: s.toNextEstimated }));
  return [
    stops(line.stations),
    ...line.branches.map((b) => [
      { station: net.stations.get(b.from)!, toNext: b.time, estimated: b.timeEstimated },
      ...stops(b.stations),
    ]),
  ];
}

/** Station accepts passengers within the horizon. */
export function isOpen(s: Station, horizon: Horizon = null): boolean {
  if (isPast(horizon)) return (s.opened ?? Infinity) <= horizon;
  if (s.status === 'open' && !s.passThrough) return true;
  if (horizon === null) return false;
  return (s.opening ?? Infinity) <= horizon;
}

/** Exit takes passengers within the horizon: its station is open and so is the exit itself. */
export function exitOpen(net: Network, e: Exit, horizon: Horizon = null): boolean {
  if (!isOpen(net.stations.get(e.station)!, horizon)) return false;
  return !isPast(horizon) || (e.opened ?? 0) <= horizon;
}

/** Trains run through the station within the horizon. */
export function inService(s: Station, horizon: Horizon = null): boolean {
  if (isPast(horizon)) return isOpen(s, horizon) || (s.throughSince ?? Infinity) <= horizon;
  return s.status === 'open' || !!s.passThrough || isOpen(s, horizon);
}

/** Historic track in service within the horizon. */
export function activeLinks(net: Network, horizon: Horizon): HistoricLink[] {
  if (!isPast(horizon)) return [];
  return net.links.filter((l) => l.from <= horizon && horizon < l.until);
}

/** Ends of the decades before the current one, e.g. 1959 for the 1950s, ascending. */
export function decadeHorizons(net: Network): number[] {
  const first = Math.min(...[...net.stations.values()].map((s) => s.opened ?? Infinity));
  const ends: number[] = [];
  for (let d = Math.floor(first / 10) * 10; d + 9 < LATEST_OPENED; d += 10) ends.push(d + 9);
  return ends;
}

/** Years the scheme names, ascending. */
export function openingYears(net: Network): number[] {
  const years = new Set<number>();
  for (const s of net.stations.values()) if (s.opening && !isOpen(s)) years.add(s.opening);
  return [...years].sort((a, b) => a - b);
}
