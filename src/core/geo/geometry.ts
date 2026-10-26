export type Point = [lon: number, lat: number];

/**
 * How long a degree of longitude is against a degree of latitude at `lat` (about ½ at 60°N).
 * Multiplying longitudes by it gives locally true proportions, as Web Mercator does.
 */
export const lonScale = (lat: number): number => Math.cos((lat * Math.PI) / 180);

const STEPS = 12;

/**
 * Centripetal Catmull-Rom spline through the given points.
 * Returns one polyline per gap between consecutive points.
 */
export function smoothLine(points: Point[]): Point[][] {
  if (points.length < 2) return [];
  const scale = lonScale(points[0]![1]);
  const p = points.map(([lon, lat]) => [lon * scale, lat] as Point);
  const first = p[0]!;
  const second = p[1]!;
  const last = p[p.length - 1]!;
  const beforeLast = p[p.length - 2]!;
  const ext: Point[] = [
    [2 * first[0] - second[0], 2 * first[1] - second[1]],
    ...p,
    [2 * last[0] - beforeLast[0], 2 * last[1] - beforeLast[1]],
  ];

  const segments: Point[][] = [];
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1]!, ext[i]!, ext[i + 1]!, ext[i + 2]!];
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    const seg: Point[] = [];
    for (let k = 0; k <= STEPS; k++) {
      const t = t1 + ((t2 - t1) * k) / STEPS;
      const a1 = lerp(p0, p1, 0, t1, t);
      const a2 = lerp(p1, p2, t1, t2, t);
      const a3 = lerp(p2, p3, t2, t3, t);
      const b1 = lerp(a1, a2, 0, t2, t);
      const b2 = lerp(a2, a3, t1, t3, t);
      const c = lerp(b1, b2, t1, t2, t);
      seg.push([c[0] / scale, c[1]]);
    }
    segments.push(seg);
  }
  return segments;
}

function knot(a: Point, b: Point): number {
  return Math.max(Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])), 1e-6);
}

function lerp(a: Point, b: Point, ta: number, tb: number, t: number): Point {
  const w = (t - ta) / (tb - ta);
  return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];
}
