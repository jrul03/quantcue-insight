/**
 * Polygon REST API Client
 * Handles caching, rate limiting, and exponential backoff
 */

// Types
interface PolygonTrade {
  p: number; // price
  t: number; // timestamp
  x?: number; // exchange
}

interface PolygonSnapshot {
  ticker: {
    lastTrade?: PolygonTrade;
    last_trade?: PolygonTrade;
    day?: {
      c: number; // close
      o: number; // open
      h: number; // high
      l: number; // low
      v: number; // volume
    };
    prevDay?: {
      c: number; // close
      o: number; // open
      h: number; // high
      l: number; // low
      v: number; // volume
    };
  };
}

interface PolygonBar {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

interface PolygonAggregatesResponse {
  results?: PolygonBar[];
  status: string;
  ticker: string;
  queryCount: number;
  resultsCount: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

// Cache and request deduplication
const cache = new Map<string, CacheEntry<any>>();
const pendingRequests = new Map<string, PendingRequest<any>>();

// Rate limiting state
let isRateLimited = false;
let rateLimitUntil = 0;

/**
 * Get Polygon API key from environment
 */
function getApiKey(): string {
  const envKey = import.meta.env.VITE_POLYGON_KEY;
  const fallbackKey = "wla0IsNG3PjJoKDhlubEKR9i9LVV9ZgZ"; // Your provided API key
  
  const key = envKey || fallbackKey;
  if (!key) {
    console.warn("⚠️ No Polygon API key available");
    return "";
  }
  return key;
}

/**
 * Sleep utility for backoff
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Core fetch function with retry and backoff
 */
async function polyFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("No Polygon API key configured");
  }

  // Add API key to params
  const allParams = { ...params, apikey: apiKey };
  const searchParams = new URLSearchParams(allParams);
  const url = `https://api.polygon.io${path}?${searchParams}`;

  // Check rate limit
  if (isRateLimited && Date.now() < rateLimitUntil) {
    throw new Error("Rate limited - please wait");
  }

  let attempt = 0;
  const maxAttempts = 3;
  const baseDelay = 500;

  while (attempt < maxAttempts) {
    try {
      const response = await fetch(url);
      
      // Handle rate limiting
      if (response.status === 429) {
        isRateLimited = true;
        rateLimitUntil = Date.now() + 15000; // 15 second cooldown
        
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt);
        
        console.warn(`🚦 Rate limited by Polygon API. Waiting ${delay}ms before retry ${attempt + 1}/${maxAttempts}`);
        
        if (attempt < maxAttempts - 1) {
          await sleep(delay);
          attempt++;
          continue;
        }
        throw new Error("Rate limited - max retries exceeded");
      }

      // Handle server errors with exponential backoff
      if (response.status >= 500) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`🔄 Server error ${response.status}. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
        
        if (attempt < maxAttempts - 1) {
          await sleep(delay);
          attempt++;
          continue;
        }
        throw new Error(`Server error: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      // Success - reset rate limit flag
      isRateLimited = false;
      rateLimitUntil = 0;

      const data = await response.json();
      return data as T;
      
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`🔄 Request failed, retrying in ${delay}ms:`, error);
      await sleep(delay);
      attempt++;
    }
  }

  throw new Error("Max retries exceeded");
}

/**
 * Cached fetch with request deduplication
 */
async function cachedFetch<T>(
  cacheKey: string, 
  fetchFn: () => Promise<T>, 
  ttlMs: number = 5000
): Promise<T> {
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }

  // Check for pending request
  const pending = pendingRequests.get(cacheKey);
  if (pending && Date.now() - pending.timestamp < 30000) {
    return pending.promise;
  }

  // Create new request
  const promise = fetchFn();
  pendingRequests.set(cacheKey, { promise, timestamp: Date.now() });

  try {
    const data = await promise;
    
    // Cache successful result
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });

    return data;
  } finally {
    // Clean up pending request
    pendingRequests.delete(cacheKey);
  }
}

/**
 * Get latest trade price for a symbol - fallback to snapshot if trades endpoint unavailable
 */
export async function getLatestTrade(symbol: string): Promise<number | null> {
  try {
    // Try snapshot first since trades endpoint is giving 404
    const snapshot = await getSnapshot(symbol);
    if (snapshot?.ticker) {
      // Try different price fields from the snapshot
      const price = snapshot.ticker.lastTrade?.p || 
                   snapshot.ticker.last_trade?.p || 
                   snapshot.ticker.day?.c ||
                   snapshot.ticker.prevDay?.c;
      
      if (price && price > 0) {
        return price;
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to get latest trade for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get snapshot data for a symbol (includes price and daily stats)
 */
export async function getSnapshot(symbol: string): Promise<PolygonSnapshot | null> {
  try {
    const cacheKey = `snapshot:${symbol}`;
    
    const data = await cachedFetch<PolygonSnapshot>(
      cacheKey,
      () => polyFetch<PolygonSnapshot>(`/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}`),
      5000 // 5 second TTL
    );

    return data;
  } catch (error) {
    console.warn(`Failed to get snapshot for ${symbol}:`, error);
    return null;
  }
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
      daysBack = 30; // 30 days for daily
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
 */
export async function getAggregates(
  symbol: string, 
  tf: '1m' | '5m' | '15m' | '1h' | '1D'
): Promise<PolygonBar[]> {
  try {
    const { mult, timespan } = mapTimeframe(tf);
    const { from, to } = getDateRange(tf);
    
    const cacheKey = `aggs:${symbol}:${tf}:${from}`;
    
    const data = await cachedFetch<PolygonAggregatesResponse>(
      cacheKey,
      () => polyFetch<PolygonAggregatesResponse>(
        `/v2/aggs/ticker/${symbol}/range/${mult}/${timespan}/${from}/${to}`,
        { 
          adjusted: 'true',
          sort: 'asc',
          limit: '50000'
        }
      ),
      20000 // 20 second TTL for historical data
    );

    return data?.results ?? [];
  } catch (error) {
    console.warn(`Failed to get aggregates for ${symbol} ${tf}:`, error);
    return [];
  }
}

/**
 * Get rate limiting status
 */
export function getRateLimitStatus(): { isLimited: boolean; until: number } {
  return {
    isLimited: isRateLimited,
    until: rateLimitUntil
  };
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
  pendingRequests.clear();
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}