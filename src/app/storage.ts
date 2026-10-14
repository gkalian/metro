/**
 * Per-browser preferences in localStorage. Storage may be blocked (private mode, cookies off):
 * reads then give the fallback and writes are dropped, so the page works, it just forgets.
 */

export function loadString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // not remembered this time
  }
}

export function loadFlag(key: string, fallback: boolean): boolean {
  const v = loadString(key);
  return v === null ? fallback : v === '1';
}

export function saveFlag(key: string, on: boolean): void {
  saveString(key, on ? '1' : '0');
}

/** A stored value if it is one of `allowed`, otherwise the fallback. */
export function loadChoice<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const v = loadString(key);
  return allowed.includes(v as T) ? (v as T) : fallback;
}
