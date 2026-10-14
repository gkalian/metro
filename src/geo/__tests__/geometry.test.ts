import { describe, expect, it } from 'vitest';
import { lonScale, smoothLine, type Point } from '../geometry';

describe('lonScale', () => {
  it('halves longitudes near 60°N', () => {
    expect(lonScale(60)).toBeCloseTo(0.5, 6);
    expect(lonScale(0)).toBe(1);
  });
});

describe('smoothLine', () => {
  const points: Point[] = [
    [30.3, 59.9],
    [30.35, 59.95],
    [30.45, 59.96],
    [30.5, 60.0],
  ];
  const curves = smoothLine(points);

  it('gives one curve per gap, each from one station to the next', () => {
    expect(curves).toHaveLength(points.length - 1);
    curves.forEach((curve, i) => {
      expect(curve[0]![0]).toBeCloseTo(points[i]![0], 9);
      expect(curve[0]![1]).toBeCloseTo(points[i]![1], 9);
      expect(curve.at(-1)![0]).toBeCloseTo(points[i + 1]![0], 9);
      expect(curve.at(-1)![1]).toBeCloseTo(points[i + 1]![1], 9);
    });
  });

  it('keeps a straight run straight', () => {
    const [curve] = smoothLine([
      [30, 60],
      [30.1, 60],
    ]);
    expect(curve!.every(([, lat]) => Math.abs(lat - 60) < 1e-9)).toBe(true);
  });

  it('has nothing to draw for a single station', () => {
    expect(smoothLine([[30, 60]])).toEqual([]);
  });
});
