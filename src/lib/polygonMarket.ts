import { getJSON } from "@/lib/apiClient";
import { detectAssetClass, toPolygonSymbol } from "@/lib/assets";

const API_KEY = import.meta.env.VITE_POLYGON_KEY || "";

export type Mover = {
  symbol: string;
  lastPrice: number;
  change: number; // absolute change vs previous close
  changePct: number; // percentage change (0-100)
  volume: number;
};

type MarketKind = "stocks" | "crypto";

function snapshotUrl(kind: MarketKind): string {
  const base = kind === "stocks"
    ? "https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers"
    : "https://api.polygon.io/v2/snapshot/locale/global/markets/crypto/tickers";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}limit=250&apiKey=${API_KEY}`;
}

function mapTickersToMovers(json: any, kind: MarketKind): Mover[] {
  const tickers = Array.isArray(json?.tickers) ? json.tickers : [];
  const list: Mover[] = [];
  for (const t of tickers) {
    const sym = String(t?.ticker || t?.T || "");
    if (!sym) continue;
    const last = Number(
      t?.lastTrade?.p ?? t?.last_trade?.p ?? t?.lastQuote?.p ?? t?.last_quote?.p ?? t?.day?.c ?? t?.prevDay?.c
    );
    const prev = Number(t?.prevDay?.c ?? t?.day?.o ?? 0);
    if (!Number.isFinite(last) || last <= 0) continue;
    const change = Number.isFinite(prev) && prev > 0 ? last - prev : 0;
    const changePct = Number.isFinite(prev) && prev > 0 ? (change / prev) * 100 : 0;
    const volume = Number(t?.day?.v ?? t?.day?.volume ?? 0);

    // Normalize symbol for crypto to UI format (strip X: prefix)
    const symbol = kind === "crypto" ? sym.replace(/^X:/, "") : sym;

    list.push({ symbol, lastPrice: last, change, changePct, volume });
  }
  return list;
}

export async function getTopMovers(kind: MarketKind, direction: "gainers" | "losers" = "gainers"): Promise<Mover[]> {
  const url = snapshotUrl(kind);
  const data = await getJSON<any>(`poly:top:${kind}`, url, 10_000);
  const items = mapTickersToMovers(data, kind);
  const sorted = items.sort((a, b) => (direction === "gainers" ? b.changePct - a.changePct : a.changePct - b.changePct));
  return sorted.slice(0, 25);
}

