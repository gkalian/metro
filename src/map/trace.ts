import type { ExpressionSpecification } from 'maplibre-gl';
import { lonScale, type Point } from '../geo/geometry';

export const CLEAR = 'rgba(0, 0, 0, 0)';

/** A route as one line from the first station to the last, coloured piece by piece. */
export interface Trace {
  coordinates: Point[];
  /** Where each piece starts, as a share of the length (as `line-progress` measures it), and its colour. */
  pieces: { at: number; color: string }[];
}

/**
 * Joins the pieces between consecutive stations into one line in travel order.
 * `piece(a, b)` returns the way from a to b, oriented either way, and its colour.
 */
export function buildTrace(
  path: string[],
  at: (id: string) => Point,
  piece: (a: string, b: string) => { points: Point[]; color: string },
): Trace {
  const coordinates: Point[] = [];
  const pieces: { start: number; color: string }[] = [];
  for (let i = 0; i + 1 < path.length; i++) {
    const { points, color } = piece(path[i]!, path[i + 1]!);
    const start = at(path[i]!);
    const forward = dist2(points[0]!, start) <= dist2(points.at(-1)!, start);
    const way = forward ? points : [...points].reverse();
    pieces.push({ start: Math.max(0, coordinates.length - 1), color });
    coordinates.push(...(coordinates.length ? way.slice(1) : way));
  }

  // line-progress runs along Web Mercator, which locally keeps these proportions
  const k = lonScale(coordinates[0]?.[1] ?? 0);
  const along = [0];
  for (let i = 1; i < coordinates.length; i++) {
    const [ax, ay] = coordinates[i - 1]!;
    const [bx, by] = coordinates[i]!;
    along.push(along[i - 1]! + Math.hypot((bx - ax) * k, by - ay));
  }
  const total = along.at(-1) || 1;
  return { coordinates, pieces: pieces.map((p) => ({ at: along[p.start]! / total, color: p.color })) };
}

/** Colours the route up to `progress`, leaving the rest clear. */
export function traceGradient(trace: Trace, progress: number): ExpressionSpecification {
  if (progress <= 0) return ['step', ['line-progress'], CLEAR, 0, CLEAR];
  let first = trace.pieces[0]?.color ?? CLEAR;
  const stops: (number | string)[] = [];
  for (const { at, color } of trace.pieces.slice(1)) {
    if (at >= progress) break;
    // step stops must rise strictly: the piece after a zero-length one takes its place
    if (at <= 0) first = color;
    else if (at <= ((stops.at(-2) as number | undefined) ?? 0)) stops[stops.length - 1] = color;
    else stops.push(at, color);
  }
  if (progress < 1) stops.push(progress, CLEAR);
  return ['step', ['line-progress'], first, ...stops] as ExpressionSpecification;
}

/** A glow that trails off behind the leading edge at `progress`. */
export function headGradient(progress: number, length: number, color: string, alpha: number): ExpressionSpecification {
  const glow = withAlpha(color, alpha);
  const points: [number, string][] = [
    [progress - length, withAlpha(color, 0)],
    [progress, glow],
    [progress + 0.002, withAlpha(color, 0)],
  ];
  const stops: (number | string)[] = [];
  let prev = -Infinity;
  for (const [at, c] of points) {
    const x = Math.min(1, Math.max(0, at));
    if (x <= prev) continue;
    stops.push(x, c);
    prev = x;
  }
  if (stops.length < 4) return ['step', ['line-progress'], CLEAR, 0, CLEAR];
  return ['interpolate', ['linear'], ['line-progress'], ...stops] as ExpressionSpecification;
}

function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const dist2 = (a: Point, b: Point) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
