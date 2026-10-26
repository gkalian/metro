import { activeLinks, inService, isOpen, lineRunning, sectionLine, type Horizon, type Network, type Station } from './network';

export interface Edge {
  to: string;
  time: number;
  kind: 'ride' | 'transfer';
  /**
   * Lines whose trains make this ride, as they were within the horizon: one, or several
   * where lines share track; empty for a transfer.
   */
  lines: string[];
  estimated: boolean;
  /** Stations passed without stopping, in travel order. */
  via: string[];
}

export type Graph = Map<string, Edge[]>;

export interface RideLeg {
  kind: 'ride';
  /** Every line whose train makes the whole leg: several where lines share track; the first is shown. */
  lineIds: string[];
  /** Stops, including the boarding and the alighting station. */
  stations: string[];
  time: number;
}

export interface TransferLeg {
  kind: 'transfer';
  from: string;
  to: string;
  time: number;
  /** Onto a train of another line at the same platform, where lines that shared track part. */
  change?: boolean;
}

export type Leg = RideLeg | TransferLeg;

export interface Route {
  /** Every station on the way, pass-through ones included. */
  path: string[];
  legs: Leg[];
  time: number;
  transferTime: number;
  transfers: number;
  /** At least one run time is an estimate rather than a published figure. */
  estimated: boolean;
}

export function buildGraph(net: Network, horizon: Horizon): Graph {
  const graph: Graph = new Map();
  const add = (from: string, edge: Edge) => {
    const list = graph.get(from);
    if (!list) {
      graph.set(from, [edge]);
      return;
    }
    // two lines on the same track make one ride that either train takes
    const same = edge.kind === 'ride' && list.find(
      (e) => e.kind === 'ride' && e.to === edge.to && e.time === edge.time && e.via.join() === edge.via.join(),
    );
    if (same) {
      for (const id of edge.lines) if (!same.lines.includes(id)) same.lines.push(id);
      same.estimated ||= edge.estimated;
    } else {
      list.push(edge);
    }
  };

  for (const line of net.lines) {
    if (!lineRunning(net, line, horizon)) continue;
    for (const run of line.runs) {
      let prev: Station | null = null;
      let time = 0;
      let estimated = false;
      let via: string[] = [];
      for (const { station: s, toNext, estimated: est } of run) {
        if (!inService(net, s, horizon)) {
          prev = null;
          continue;
        }
        if (isOpen(net, s, horizon)) {
          if (prev) {
            const lineId = sectionLine(net, line, prev, s, horizon).id;
            add(prev.id, { to: s.id, time, kind: 'ride', lines: [lineId], estimated, via });
            add(s.id, { to: prev.id, time, kind: 'ride', lines: [lineId], estimated, via: [...via].reverse() });
          }
          prev = s;
          time = 0;
          estimated = false;
          via = [];
        } else if (prev) {
          via.push(s.id);
        }
        time += toNext ?? 0;
        estimated ||= !!est;
      }
    }
  }

  for (const l of activeLinks(net, horizon)) {
    const estimated = !!l.timeEstimated;
    add(l.a, { to: l.b, time: l.time, kind: 'ride', lines: [l.lineId], estimated, via: [] });
    add(l.b, { to: l.a, time: l.time, kind: 'ride', lines: [l.lineId], estimated, via: [] });
  }

  for (const t of net.transfers) {
    const a = net.stations.get(t.a);
    const b = net.stations.get(t.b);
    if (!a || !b) continue;
    if (!(isOpen(net, a, horizon) && isOpen(net, b, horizon))) continue;
    add(a.id, { to: b.id, time: t.time, kind: 'transfer', lines: [], estimated: false, via: [] });
    add(b.id, { to: a.id, time: t.time, kind: 'transfer', lines: [], estimated: false, via: [] });
  }
  return graph;
}

/** Fastest route; among equally fast ones, the one with fewer transfers. */
export function findRoute(graph: Graph, from: string, to: string): Route | null {
  if (!graph.has(from) && from !== to) return null;
  const dist = new Map<string, { time: number; transfers: number; prev?: string; edge?: Edge }>();
  dist.set(from, { time: 0, transfers: 0 });
  const done = new Set<string>();

  for (;;) {
    let cur: string | undefined;
    for (const [id, d] of dist) {
      if (done.has(id)) continue;
      const best = cur === undefined ? undefined : dist.get(cur);
      if (!best || d.time < best.time || (d.time === best.time && d.transfers < best.transfers)) cur = id;
    }
    if (cur === undefined) return null;
    if (cur === to) break;
    done.add(cur);
    const d = dist.get(cur)!;
    for (const edge of graph.get(cur) ?? []) {
      if (done.has(edge.to)) continue;
      const time = d.time + edge.time;
      const transfers = d.transfers + (edge.kind === 'transfer' ? 1 : 0);
      const old = dist.get(edge.to);
      if (!old || time < old.time || (time === old.time && transfers < old.transfers)) {
        dist.set(edge.to, { time, transfers, prev: cur, edge });
      }
    }
  }

  const steps: { from: string; edge: Edge }[] = [];
  for (let id = to; ; ) {
    const d = dist.get(id)!;
    if (!d.prev || !d.edge) break;
    steps.unshift({ from: d.prev, edge: d.edge });
    id = d.prev;
  }

  const path = [from];
  const legs: Leg[] = [];
  let transferTime = 0;
  let estimated = false;
  let changes = 0;
  for (const { from: a, edge } of steps) {
    path.push(...edge.via, edge.to);
    estimated ||= edge.estimated;
    if (edge.kind === 'transfer') {
      transferTime += edge.time;
      legs.push({ kind: 'transfer', from: a, to: edge.to, time: edge.time });
      continue;
    }
    // Stay on board while some line runs the whole way so far: on a fixed path this
    // greedy choice needs the fewest changes.
    const last = legs.at(-1);
    const common = last?.kind === 'ride' ? last.lineIds.filter((id) => edge.lines.includes(id)) : [];
    if (last?.kind === 'ride' && common.length) {
      last.lineIds = common;
      last.stations.push(edge.to);
      last.time += edge.time;
      continue;
    }
    if (last?.kind === 'ride') {
      legs.push({ kind: 'transfer', from: a, to: a, time: 0, change: true });
      changes++;
    }
    legs.push({ kind: 'ride', lineIds: [...edge.lines], stations: [a, edge.to], time: edge.time });
  }

  const total = dist.get(to)!;
  return { path, legs, time: total.time, transferTime, transfers: total.transfers + changes, estimated };
}
