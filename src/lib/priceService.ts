import { getPolygonKey } from "./keys";
import { detectAssetClass, toPolygonSymbol } from "./assets";
import { getJSON, getApiStatus } from "./apiClient";

export async function getLastPrice(symbol: string): Promise<number|null> {
  const apiKey = getPolygonKey();
  console.log("💰 Getting last price for", symbol, "API key available:", !!apiKey);
  
  if (!apiKey) {
    console.error("❌ No Polygon API key - cannot fetch price");
    return null;
  }
  
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(symbol)}?apiKey=${apiKey}`;
  const j = await getJSON<any>(`poly:snap:${symbol}`, url, 10_000);
  const p = j?.ticker?.lastTrade?.p ?? j?.ticker?.last_trade?.p ?? j?.ticker?.day?.c;
  const val = Number(p);
  return Number.isFinite(val) ? val : null;
}

export async function getCandles(
  symbol: string,
  resolution: "S30"|"1"|"5"|"15"|"30"|"60"|"D" = "1",
  lookbackMs?: number
){
  const apiKey = getPolygonKey();
  console.log("📊 Getting candles for", symbol, "resolution:", resolution, "API key available:", !!apiKey);
  
  if (!apiKey) {
    console.error("❌ No Polygon API key - cannot fetch candles");
    return [];
  }
  
  const assetClass = detectAssetClass(symbol);
  const polygonSymbol = toPolygonSymbol(symbol, assetClass);

  // Determine timespan + multiplier
  let timespan: "day" | "minute" | "second";
  let multiplier: number;
  if (resolution === "D") {
    timespan = "day";
    multiplier = 1;
  } else if (resolution === "S30") {
    // Seconds data is generally available for crypto only
    if (assetClass === 'crypto') {
      timespan = "second";
      multiplier = 30;
    } else {
      timespan = "minute";
      multiplier = 1; // graceful fallback to 1m
    }
  } else {
    timespan = "minute";
    multiplier = Number(resolution);
  }
  
  // Fix date calculation - use proper date format (YYYY-MM-DD)
  const now = new Date();
  const to = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const daysBack = timespan === "minute" ? 1 : 30; // 1 day for intraday, 30 for daily
  const fromDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const from = fromDate.toISOString().split('T')[0];

  const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(polygonSymbol)}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${apiKey}`;
  console.log("🌐 Fetching candles from:", url);
  
  const j = await getJSON<any>(`poly:aggs:${symbol}:${multiplier}:${timespan}:${from}`, url, 20_000);
  console.log("📈 Candles response:", j);
  
  const arr = Array.isArray(j?.results) ? j.results : [];
  console.log("📊 Processed candles count:", arr.length);
  
  return arr.map((r:any)=>({ timestamp: r.t, open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v }));
}

export { getApiStatus } from "./apiClient";
