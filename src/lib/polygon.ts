/**
 * Polygon REST API Client
 * Uses the apiClient.ts with caching, rate limiting, and exponential backoff
 */

import { getJSON, getApiStatus } from './apiClient';
import { detectAssetClass, toPolygonSymbol, getCoinGeckoPrice } from './assets';

const API_KEY = import.meta.env.VITE_POLYGON_KEY || "wla0IsNG3PjJoKDhlubEKR9i9LVV9ZgZ";

/**
 * Get latest trade price for a symbol with asset class handling
 * GET /v3/trades/{symbol}/latest?apiKey=...
 * Returns the last trade price (results.p)
 */
export async function getLatestTrade(symbol: string): Promise<number | null> {
  try {
    const assetClass = detectAssetClass(symbol);
    const polygonSymbol = toPolygonSymbol(symbol, assetClass);
    
    // For unsupported meme coins, try CoinGecko first
    if (assetClass === 'crypto') {
      const coinGeckoPrice = await getCoinGeckoPrice(symbol);
      if (coinGeckoPrice !== null) return coinGeckoPrice;
    }
    
    const url = `https://api.polygon.io/v3/trades/${polygonSymbol}/latest?apiKey=${API_KEY}`;
    const data = await getJSON<any>(`trade:${polygonSymbol}`, url, 5000); // 5s TTL
    
    const price = data?.results?.p;
    return typeof price === 'number' && price > 0 ? price : null;
  } catch (error) {
    console.warn(`Failed to get latest trade for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get latest quote for a symbol with asset class handling
 * GET /v3/quotes/{symbol}/latest?apiKey=...
 * Returns mid price = (bid + ask) / 2
 */
export async function getLatestQuote(symbol: string): Promise<number | null> {
  try {
    const assetClass = detectAssetClass(symbol);
    const polygonSymbol = toPolygonSymbol(symbol, assetClass);
    
    const url = `https://api.polygon.io/v3/quotes/${polygonSymbol}/latest?apiKey=${API_KEY}`;
    const data = await getJSON<any>(`quote:${polygonSymbol}`, url, 5000); // 5s TTL
    
    const results = data?.results;
    if (results?.bid_price && results?.ask_price) {
      const mid = (results.bid_price + results.ask_price) / 2;
      return mid > 0 ? mid : null;
    }
    return null;
  } catch (error) {
    console.warn(`Failed to get latest quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get snapshot data for a symbol with asset class handling
 * GET /v2/snapshot/locale/us/markets/{market}/tickers/{symbol}?apiKey=...
 */
export async function getSnapshot(symbol: string): Promise<any> {
  try {
    const assetClass = detectAssetClass(symbol);
    const polygonSymbol = toPolygonSymbol(symbol, assetClass);
    
    // Determine market endpoint based on asset class
    let market = 'stocks';
    if (assetClass === 'crypto') market = 'crypto';
    if (assetClass === 'fx') market = 'fx';
    
    const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/${market}/tickers/${polygonSymbol}?apiKey=${API_KEY}`;
    const data = await getJSON<any>(`snapshot:${polygonSymbol}`, url, 5000); // 5s TTL
    return data;
  } catch (error) {
    console.warn(`Failed to get snapshot for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get rate limiting status
 */
export function getRateLimitStatus(): { isLimited: boolean; until: number } {
  const status = getApiStatus();
  return {
    isLimited: status === "limited",
    until: status === "limited" ? Date.now() + 15000 : 0
  };
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): { size: number; keys: string[] } {
  // Simple mock for now - actual cache is managed by apiClient
  return {
    size: 0,
    keys: []
  };
}

/**
 * Map UI timeframe to Polygon multiplier and timespan
 */
function mapTimeframe(tf: '1m' | '5m' | '15m' | '1h' | '1D'): { mult: number; timespan: string } {
  switch (tf) {
    case '1m': return { mult: 1, timespan: 'minute' };
    case '5m': return { mult: 5, timespan: 'minute' };
    case '15m': return { mult: 15, timespan: 'minute' };
    case '1h': return { mult: 1, timespan: 'hour' };
    case '1D': return { mult: 1, timespan: 'day' };
    default: return { mult: 5, timespan: 'minute' };
  }
}

/**
 * Get date range for timeframe
 */
function getDateRange(tf: '1m' | '5m' | '15m' | '1h' | '1D'): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  let daysBack: number;
  switch (tf) {
    case '1m':
    case '5m':
      daysBack = 1; // 1 day for minute data (markets are closed weekends)
      break;
    case '15m':
      daysBack = 3; // 3 days for 15m data  
      break;
    case '1h':
      daysBack = 7; // 1 week for hourly
      break;
    case '1D':
      daysBack = 100; // 100 days for daily
      break;
    default:
      daysBack = 1;
  }

  const fromDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const from = fromDate.toISOString().split('T')[0];
  
  return { from, to };
}

/**
 * Get aggregates (candles) for a symbol and timeframe
 * GET /v2/aggs/ticker/{symbol}/range/{mult}/{timespan}/{from}/{to}?adjusted=true&sort=asc&limit=50000&apiKey=...
 * Returns mapped bars [{timestamp:t, open:o, high:h, low:l, close:c, volume:v}]
 */
export async function getAggregates(
  symbol: string, 
  tf: '1m' | '5m' | '15m' | '1h' | '1D'
): Promise<Array<{timestamp: number, open: number, high: number, low: number, close: number, volume: number}>> {
  try {
    const assetClass = detectAssetClass(symbol);
    const polygonSymbol = toPolygonSymbol(symbol, assetClass);
    const { mult, timespan } = mapTimeframe(tf);
    const { from, to } = getDateRange(tf);
    
    const url = `https://api.polygon.io/v2/aggs/ticker/${polygonSymbol}/range/${mult}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${API_KEY}`;
    const data = await getJSON<any>(`aggs:${polygonSymbol}:${tf}:${from}`, url, 20000); // 20s TTL
    
    const results = data?.results || [];
    return results.map((bar: any) => ({
      timestamp: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v
    }));
  } catch (error) {
    console.warn(`Failed to get aggregates for ${symbol} ${tf}:`, error);
    return [];
  }
}