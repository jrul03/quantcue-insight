// src/lib/providers.ts
type CacheEntry<T> = { ts: number; ttl: number; value: T };
const memCache = new Map<string, CacheEntry<any>>();

export function getFromCache<T>(key: string): T | undefined {
  const e = memCache.get(key);
  if (!e) return;
  if (Date.now() - e.ts > e.ttl) {
    memCache.delete(key);
    return;
  }
  return e.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs: number) {
  memCache.set(key, { ts: Date.now(), ttl: ttlMs, value });
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Basic exponential backoff for 429/5xx
export async function fetchWithBackoff(
  url: string,
  init: RequestInit = {},
  opts: { retries?: number; baseDelayMs?: number } = {}
) {
  const retries = opts.retries ?? 3;
  const baseDelay = opts.baseDelayMs ?? 300;
  let lastErr: any;

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        // backoff
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
        continue;
      }
      // non-retryable
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    } catch (e) {
      lastErr = e;
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  throw lastErr;
}