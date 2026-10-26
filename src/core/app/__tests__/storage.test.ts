import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadChoice, loadFlag, saveFlag, saveString } from '../storage';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
    key: (i) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  };
}

const blocked = (): Storage => {
  const deny = () => {
    throw new DOMException('denied', 'SecurityError');
  };
  return { getItem: deny, setItem: deny, removeItem: deny, clear: deny, key: deny, length: 0 };
};

afterEach(() => vi.unstubAllGlobals());

describe('storage', () => {
  it('remembers flags', () => {
    vi.stubGlobal('localStorage', memoryStorage());
    expect(loadFlag('rail', true)).toBe(true);
    saveFlag('rail', false);
    expect(loadFlag('rail', true)).toBe(false);
  });

  it('accepts only known choices', () => {
    vi.stubGlobal('localStorage', memoryStorage());
    saveString('theme', 'sepia');
    expect(loadChoice('theme', ['light', 'dark'], 'light')).toBe('light');
    saveString('theme', 'dark');
    expect(loadChoice('theme', ['light', 'dark'], 'light')).toBe('dark');
  });

  it('falls back and forgets quietly when storage is blocked', () => {
    vi.stubGlobal('localStorage', blocked());
    expect(() => saveFlag('rail', false)).not.toThrow();
    expect(loadFlag('rail', true)).toBe(true);
    expect(loadChoice('theme', ['light', 'dark'], 'dark')).toBe('dark');
  });
});
