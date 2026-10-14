/**
 * The data files are edited by hand; these checks catch a mistyped id or a missing field
 * before it breaks the map (which trusts every id it is given).
 */
import { describe, expect, it } from 'vitest';
import { lineRuns, loadNetwork, type Station } from '../../domain/network';
import { loadRailway } from '../../domain/railway';
import history from '../history.json';
import transfers from '../transfers.json';

const net = loadNetwork();
const rail = loadRailway();
const allStations: Station[] = net.lines.flatMap((l) => [...l.stations, ...l.branches.flatMap((b) => b.stations)]);
const metro = (id: string) => net.stations.has(id);
const line = (id: string) => net.lineById.has(id);
// the map's maxBounds
const inArea = (s: { lat: number; lon: number }) => s.lon > 28.6 && s.lon < 32 && s.lat > 59.3 && s.lat < 60.5;

describe('metro lines', () => {
  it('have unique line and station ids', () => {
    expect(net.lineById.size).toBe(net.lines.length);
    const ids = allStations.map((s) => s.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('fork branches from a station of their own line', () => {
    for (const l of net.lines) {
      for (const b of l.branches) expect(net.stations.get(b.from)?.lineId, `${l.id}: ${b.from}`).toBe(l.id);
    }
  });

  it('place every station in the city', () => {
    expect(allStations.filter((s) => !inArea(s)).map((s) => s.id)).toEqual([]);
  });

  it('date every station open today, so the past can be drawn', () => {
    const undated = allStations.filter((s) => s.status === 'open' && !s.passThrough && !s.opened);
    expect(undated.map((s) => s.id)).toEqual([]);
  });

  it('give the time to the next stop along every run', () => {
    const missing = net.lines.flatMap((l) =>
      lineRuns(net, l).flatMap((run) => run.slice(0, -1).filter((r) => r.toNext === undefined).map((r) => r.station.id)),
    );
    expect(missing).toEqual([]);
  });
});

describe('links between files', () => {
  it('transfers join two known stations of different lines', () => {
    for (const t of transfers) {
      expect(metro(t.a) && metro(t.b), `${t.a} — ${t.b}`).toBe(true);
      expect(net.stations.get(t.a)!.lineId, `${t.a} — ${t.b}`).not.toBe(net.stations.get(t.b)!.lineId);
    }
  });

  it('historic track names known stations and lines', () => {
    for (const l of history.links) {
      expect(metro(l.a) && metro(l.b) && line(l.lineId), `${l.a} — ${l.b}`).toBe(true);
      expect(l.from).toBeLessThan(l.until);
    }
    for (const f of history.formerLines) {
      expect(line(f.lineId), f.lineId).toBe(true);
      expect(f.stations.filter((id) => !metro(id))).toEqual([]);
    }
  });

  it('rail routes and metro walks name known stations', () => {
    expect(rail.stations.size).toBe(new Set([...rail.stations.values()].map((s) => s.id)).size);
    for (const r of rail.routes) expect(r.stations.filter((id) => !rail.stations.has(id)), r.id).toEqual([]);
    for (const s of rail.stations.values()) {
      expect((s.metro ?? []).filter((id) => !metro(id)), s.id).toEqual([]);
      expect(inArea(s), s.id).toBe(true);
    }
  });
});
