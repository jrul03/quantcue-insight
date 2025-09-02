type CacheEntry<T> = { value: T; expires: number };
const cache = new Map<string, CacheEntry<any>>();
const inflight = new Map<string, Promise<any>>();
const queue: { run: () => Promise<any>; resolve: (v:any)=>void; reject:(e:any)=>void }[] = [];
let active = 0;
const CONCURRENCY = 3, GAP_MS = 150, DEFAULT_TTL_MS = 15000, MAX_RETRIES = 3, BASE_DELAY = 800;

export type ApiStatus = "ok" | "limited" | "error";
let status: ApiStatus = "ok";
const listeners = new Set<(s:ApiStatus)=>void>();
export const subscribeApiStatus = (cb:(s:ApiStatus)=>void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};
const setStatus = (s:ApiStatus) => { if (s!==status){ status=s; listeners.forEach(l=>l(s)); } };
export const getApiStatus = () => status;

const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));

async function runWithBackoff(input: RequestInfo, init?: RequestInit) {
  let attempt = 0;
  while (true) {
    const res = await fetch(input, init);
    if (res.status === 429) {
      setStatus("limited");
      const ra = Number(res.headers.get("retry-after") || 0);
      const delay = ra>0 ? ra*1000 : BASE_DELAY * Math.pow(2, attempt++);
      if (attempt > MAX_RETRIES) throw new Error("Rate limited");
      await sleep(delay); continue;
    }
    if (!res.ok) { setStatus("error"); throw new Error(`HTTP ${res.status}`); }
    setStatus("ok"); return res;
  }
}

function enqueue<T>(run:()=>Promise<T>):Promise<T>{
  return new Promise((resolve,reject)=>{ queue.push({run,resolve,reject}); pump(); });
}
async function pump(){
  if (active>=CONCURRENCY) return;
  const item = queue.shift(); if(!item) return;
  active++;
  try { item.resolve(await item.run()); } catch(e){ item.reject(e); }
  finally { active--; setTimeout(pump, GAP_MS); }
}

export async function getJSON<T>(key:string, url:string, ttlMs=DEFAULT_TTL_MS):Promise<T>{
  const now=Date.now(); const ce=cache.get(key);
  if (ce && ce.expires > now) return ce.value as T;
  const existing = inflight.get(key); if (existing) return existing as Promise<T>;
  const p = enqueue<T>(async()=> {
    const res = await runWithBackoff(url);
    const data = await res.json();
    cache.set(key, { value: data, expires: now + ttlMs });
    inflight.delete(key);
    return data as T;
  });
  inflight.set(key,p);
  return p;
}