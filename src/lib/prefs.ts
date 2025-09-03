// Lightweight localStorage helpers with guards. No external deps.

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function hasStorage(): boolean {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return false;
    const k = "__test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function getPref<T extends Json>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setPref<T extends Json>(key: string, value: T): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write errors
  }
}

