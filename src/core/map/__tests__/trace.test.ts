import { describe, expect, it } from 'vitest';
import type { Point } from '../../geo/geometry';
import { buildTrace, CLEAR, headGradient, traceGradient } from '../trace';

const at: Record<string, Point> = { a: [30, 60], b: [30.1, 60], c: [30.1, 60.1], d: [30.2, 60.1] };
const colors: Record<string, string> = { 'a-b': '#ff0000', 'b-c': '#00ff00', 'c-d': '#0000ff' };
const pieceOf = (a: string, b: string) => ({
  // stored against the travel direction on purpose
  points: [at[b]!, [(at[a]![0] + at[b]![0]) / 2, (at[a]![1] + at[b]![1]) / 2] as Point, at[a]!],
  color: colors[[a, b].sort().join('-')]!,
});

describe('buildTrace', () => {
  const trace = buildTrace(['a', 'b', 'c', 'd'], (id) => at[id]!, pieceOf);

  it('runs from the first station to the last without repeating joints', () => {
    expect(trace.coordinates[0]).toEqual(at.a);
    expect(trace.coordinates.at(-1)).toEqual(at.d);
    expect(trace.coordinates).toHaveLength(7);
  });

  it('starts each piece at its share of the length', () => {
    expect(trace.pieces.map((p) => p.color)).toEqual(['#ff0000', '#00ff00', '#0000ff']);
    expect(trace.pieces[0]!.at).toBe(0);
    const [, b, c] = trace.pieces;
    // east-west legs are shortened by cos(60°) = 0.5 against the north-south one
    expect(b!.at).toBeCloseTo(0.25, 3);
    expect(c!.at).toBeCloseTo(0.75, 3);
  });
});

describe('traceGradient', () => {
  const trace = { coordinates: [], pieces: [{ at: 0, color: 'red' }, { at: 0.5, color: 'blue' }] };

  it('draws nothing before the start', () => {
    expect(traceGradient(trace, 0)).toEqual(['step', ['line-progress'], CLEAR, 0, CLEAR]);
  });

  it('clears the line past the leading edge', () => {
    expect(traceGradient(trace, 0.3)).toEqual(['step', ['line-progress'], 'red', 0.3, CLEAR]);
    expect(traceGradient(trace, 0.8)).toEqual(['step', ['line-progress'], 'red', 0.5, 'blue', 0.8, CLEAR]);
  });

  it('shows the whole route once done', () => {
    expect(traceGradient(trace, 1)).toEqual(['step', ['line-progress'], 'red', 0.5, 'blue']);
  });

  it('keeps stops rising past zero-length pieces', () => {
    const t = { coordinates: [], pieces: [{ at: 0, color: 'a' }, { at: 0, color: 'b' }, { at: 0.5, color: 'c' }, { at: 0.5, color: 'd' }] };
    expect(traceGradient(t, 1)).toEqual(['step', ['line-progress'], 'b', 0.5, 'd']);
  });
});

describe('headGradient', () => {
  it('fades in behind the edge and stops right after it', () => {
    expect(headGradient(0.5, 0.1, '#ffffff', 0.8)).toEqual([
      'interpolate', ['linear'], ['line-progress'],
      0.4, 'rgba(255, 255, 255, 0)',
      0.5, 'rgba(255, 255, 255, 0.8)',
      0.502, 'rgba(255, 255, 255, 0)',
    ]);
  });

  it('clips to the line at both ends', () => {
    const near = headGradient(0.05, 0.1, '#ffffff', 1);
    expect(near.slice(3, 5)).toEqual([0, 'rgba(255, 255, 255, 0)']);
    const end = headGradient(1, 0.1, '#ffffff', 1);
    expect(end.at(-2)).toBe(1);
  });
});
