/**
 * The data files are edited by hand; these checks catch a mistyped id or a missing field
 * before it breaks the map (which trusts every id it is given). They run for every city.
 */
import { describe, expect, it } from 'vitest';
import { nameIn } from '../../core/app/i18n';
import { loadNetwork } from '../../core/domain/network';
import { loadRailway } from '../../core/domain/railway';
import { CITIES } from '..';

const loaded = await Promise.all(CITIES.map(async (city) => ({ city, data: await city.load() })));

describe.each(loaded)('$city.id', ({ city, data }) => {
  const net = loadNetwork(data.network);
  const rail = loadRailway(data.railway);
  const allStations = [...net.stations.values()];
  const metro = (id: string) => net.stations.has(id);
  const line = (id: string) => net.lineById.has(id);
  // within the map's bounds
  const [[west, south], [east, north]] = city.bounds;
  const inArea = (s: { lat: number; lon: number }) => s.lon > west && s.lon < east && s.lat > south && s.lat < north;

  describe('metro lines', () => {
    // a station described twice or an unknown id stops loadNetwork itself
    it('have unique line ids', () => {
      expect(net.lineById.size).toBe(net.lines.length);
    });

    it('fork branches from a station the line calls at', () => {
      for (const l of net.lines) {
        for (const fork of l.runs.slice(1).map((run) => run[0]!.station)) {
          expect(fork.lineIds, `${l.id}: ${fork.id}`).toContain(l.id);
        }
      }
    });

    it('place every station in the city', () => {
      expect(allStations.filter((s) => !inArea(s)).map((s) => s.id)).toEqual([]);
    });

    it.each(city.langs)('name every line and station in %s', (l) => {
      const unnamed = [...net.lines, ...allStations, ...rail.stations.values()].filter((x) => !nameIn(x, l)?.trim());
      expect(unnamed.map((x) => x.name)).toEqual([]);
    });

    it('have their pages described in every language', () => {
      expect(Object.values(city.title).every((s) => s.trim())).toBe(true);
      expect(city.langs[0]).toBe('ru');
      expect(city.langs).toContain(city.localLang);
    });

    it('give lines on shared track the same run times', () => {
      // a ride both lines make must take both the same time, or it counts as two different rides
      for (const l of net.lines) {
        for (const run of l.runs) {
          run.slice(0, -1).forEach((r, i) => {
            const next = run[i + 1]!.station;
            for (const orun of net.lines.filter((o) => o !== l).flatMap((o) => o.runs)) {
              const j = orun.findIndex((o) => o.station === r.station);
              if (j >= 0 && orun[j + 1]?.station === next) expect(orun[j]!.toNext, `${l.id}: ${r.station.id}`).toBe(r.toNext);
            }
          });
        }
      }
    });

    it('date every station open today, so the past can be drawn', () => {
      const undated = allStations.filter((s) => s.status === 'open' && !s.passThrough && !s.opened);
      expect(undated.map((s) => s.id)).toEqual([]);
    });

    it('give the time to the next stop along every run', () => {
      const missing = net.lines.flatMap((l) =>
        l.runs.flatMap((run) => run.slice(0, -1).filter((r) => r.toNext === undefined).map((r) => r.station.id)),
      );
      expect(missing).toEqual([]);
    });
  });

  describe('links between files', () => {
    it('transfers join two known stations of different lines', () => {
      for (const t of net.transfers) {
        expect(metro(t.a) && metro(t.b), `${t.a} — ${t.b}`).toBe(true);
        expect(net.stations.get(t.a)!.lineId, `${t.a} — ${t.b}`).not.toBe(net.stations.get(t.b)!.lineId);
      }
    });

    it('historic track names known stations and lines', () => {
      for (const l of net.links) {
        expect(metro(l.a) && metro(l.b) && line(l.lineId), `${l.a} — ${l.b}`).toBe(true);
        expect(l.from).toBeLessThan(l.until);
      }
      for (const f of net.formerLines) {
        expect(line(f.lineId), f.lineId).toBe(true);
        expect(f.stations.filter((id) => !metro(id))).toEqual([]);
      }
    });

    it('exits belong to known open stations and lie in the city', () => {
      const ids = net.exits.map((e) => e.id);
      expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
      for (const e of net.exits) {
        expect(metro(e.station), e.id).toBe(true);
        expect(inArea(e), e.id).toBe(true);
        expect(e.opened ?? Infinity, e.id).toBeGreaterThanOrEqual(net.stations.get(e.station)!.opened ?? Infinity);
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
});
