import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Map as MlMap } from 'maplibre-gl';
import type { Feature } from 'geojson';
import { Fader } from '../fade';

/** Just enough of a MapLibre map: one source's data and the feature states. */
function fakeMap() {
  const states = new Map<string, number>();
  let data: Feature[] = [];
  const map = {
    getSource: () => ({ setData: (fc: { features: Feature[] }) => void (data = fc.features) }),
    setFeatureState: ({ id }: { id: string }, s: { fade: number }) => void states.set(id, s.fade),
  };
  return { map: map as unknown as MlMap, states, keys: () => data.map((f) => f.properties!.key as string) };
}

const point = (key: string): Feature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [30, 60] },
  properties: { key },
});

let frames: FrameRequestCallback[] = [];
let now = 0;
/** Runs animation frames `ms` apart until nothing asks for another. */
const runFrames = (ms: number) => {
  for (let i = 0; i < 100 && frames.length; i++) {
    const due = frames;
    frames = [];
    now += ms;
    for (const f of due) f(now);
  }
};

beforeEach(() => {
  frames = [];
  now = 0;
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => frames.push(f));
  vi.stubGlobal('cancelAnimationFrame', () => (frames = []));
});
afterEach(() => vi.unstubAllGlobals());

describe('Fader', () => {
  it('shows the first data at once', () => {
    const { map, states, keys } = fakeMap();
    new Fader(map, 400).update('s', [point('a')], false);
    expect(keys()).toEqual(['a']);
    expect(states.get('a')).toBe(1);
    expect(frames).toHaveLength(0);
  });

  it('fades new features in and keeps old ones until they have faded out', () => {
    const { map, states, keys } = fakeMap();
    const fader = new Fader(map, 400);
    fader.update('s', [point('a')], false);
    fader.update('s', [point('b')], true);
    expect(keys()).toEqual(['a', 'b']);
    expect(states.get('b')).toBe(0);

    runFrames(100);
    expect(states.get('a')).toBe(0);
    expect(states.get('b')).toBe(1);
    expect(keys()).toEqual(['b']);
  });

  it('turns back from where it is when the data changes mid-fade', () => {
    const { map, states, keys } = fakeMap();
    const fader = new Fader(map, 400);
    fader.update('s', [point('a')], false);
    fader.update('s', [], true);
    frames.shift()!((now = 0));
    frames.shift()!((now = 200));
    const halfway = states.get('a')!;
    expect(halfway).toBeGreaterThan(0);
    expect(halfway).toBeLessThan(1);

    fader.update('s', [point('a')], true);
    runFrames(100);
    expect(states.get('a')).toBe(1);
    expect(keys()).toEqual(['a']);
  });

  it('does not animate with no duration', () => {
    const { map, keys } = fakeMap();
    const fader = new Fader(map, 0);
    fader.update('s', [point('a')], false);
    fader.update('s', [point('b')], true);
    expect(keys()).toEqual(['b']);
    expect(frames).toHaveLength(0);
  });
});
