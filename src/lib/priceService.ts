import { POLYGON_KEY } from "./keys";
import { apiGetJSON, getApiStatus } from "./apiClient";

export async function getLastPrice(symbol: string): Promise<number|null> {
  if (!POLYGON_KEY) return null;
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(symbol)}?apiKey=${POLYGON_KEY}`;
  const j = await apiGetJSON<any>(`poly:snap:${symbol}`, url, 10_000);
  const p = j?.ticker?.lastTrade?.p ?? j?.ticker?.last_trade?.p ?? j?.ticker?.day?.c;
  const val = Number(p);
  return Number.isFinite(val) ? val : null;
}

export async function getCandles(
  symbol: string,
  resolution: "1"|"5"|"15"|"60"|"D" = "1",
  lookbackMs?: number
){
  if (!POLYGON_KEY) return [];
  const timespan = resolution === "D" ? "day" : "minute";
  const multiplier = resolution === "D" ? 1 : Number(resolution);
  const to = Date.now();
  const from = (() => {
    if (timespan === "minute") return to - (lookbackMs ?? 2 * 60 * 60 * 1000);
    return to - (lookbackMs ?? 100 * 24 * 60 * 60 * 1000);
  })();

  const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_KEY}`;
  const j = await apiGetJSON<any>(`poly:aggs:${symbol}:${multiplier}:${timespan}:${Math.floor(from/60_000)}`, url, 20_000);
  const arr = Array.isArray(j?.results) ? j.results : [];
  return arr.map((r:any)=>({ timestamp: r.t, open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v }));
}

export { getApiStatus } from "./apiClient";