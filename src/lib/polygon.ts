/**
 * Polygon REST API Client
 * Features: caching, exponential backoff, rate limit handling
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PolygonTrade {
  participant_timestamp: number;
  conditions: number[];
  exchange: number;
  price: number;
  sip_timestamp: number;
  size: number;
  timeframe: string;
}

interface PolygonSnapshot {
  ticker: {
    day: {
      c: number; // close
      h: number; // high
      l: number; // low
      o: number; // open
      v: number; // volume
      vw: number; // volume weighted
    };
    lastTrade: {
      c: number[];
      i: string;
      p: number;
      s: number;
      t: number;
      x: number;
    };
    lastQuote: {
      P: number;
      S: number;
      p: number;
      s: number;
      t: number;
    };
    min: {
      av: number;
      c: number;
      h: number;
      l: number;
      o: number;
      t: number;
      v: number;
      vw: number;
    };
    prevDay: {
      c: number;
      h: number;
      l: number;
      o: number;
      v: number;
      vw: number;
    };
  };
}

interface PolygonAggregatesResponse {
  results: Array<{
    t: number; // timestamp
    o: number; // open
    h: number; // high
    l: number; // low
    c: number; // close
    v: number; // volume
    vw: number; // volume weighted
    n: number; // number of transactions
  }>;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  status: string;
  request_id: string;
  count: number;
}

interface TimeframeMapping {
  mult: number;
  timespan: 'minute' | 'hour' | 'day';
}

// Cache and concurrency management
const cache = new Map<string, CacheEntry<any>>();
const pendingRequests = new Map<string, Promise<any>>();

// Timeframe mappings
const TIMEFRAME_MAP: Record<string, TimeframeMapping> = {
  '1m': { mult: 1, timespan: 'minute' },
  '5m': { mult: 5, timespan: 'minute' },
  '15m': { mult: 15, timespan: 'minute' },
  '1h': { mult: 1, timespan: 'hour' },
  '1D': { mult: 1, timespan: 'day' }
};

// TTL constants (in milliseconds)
const TTL = {
  PRICE: 5000, // 5 seconds
  CANDLES: 20000, // 20 seconds
  SNAPSHOT: 10000 // 10 seconds
};

function getApiKey(): string {
  const key = import.meta.env.VITE_POLYGON_KEY;
  if (!key) {
    console.error('❌ VITE_POLYGON_KEY environment variable not set');
    throw new Error('Polygon API key not configured');
  }
  return key;
}

function getCacheKey(path: string, params?: Record<string, string>): string {
  const paramString = params ? new URLSearchParams(params).toString() : '';
  return `${path}${paramString ? `?${paramString}` : ''}`;
}

function isValidCacheEntry<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function polyFetch<T>(path: string, params?: Record<string, string>, ttl: number = TTL.PRICE): Promise<T> {
  const apiKey = getApiKey();
  const allParams = { ...params, apikey: apiKey };
  const cacheKey = getCacheKey(path, allParams);
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && isValidCacheEntry(cached)) {
    console.log(`📋 Cache hit for ${path}`);
    return cached.data;
  }
  
  // Check if request is already pending (dedupe)
  if (pendingRequests.has(cacheKey)) {
    console.log(`⏳ Deduping request for ${path}`);
    return pendingRequests.get(cacheKey)!;
  }
  
  // Make the request with exponential backoff
  const requestPromise = makeRequestWithBackoff<T>(path, allParams, ttl, cacheKey);
  pendingRequests.set(cacheKey, requestPromise);
  
  try {
    const result = await requestPromise;
    return result;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

async function makeRequestWithBackoff<T>(
  path: string, 
  params: Record<string, string>, 
  ttl: number,
  cacheKey: string,
  attempt: number = 1
): Promise<T> {
  const url = `https://api.polygon.io${path}?${new URLSearchParams(params).toString()}`;
  
  try {
    console.log(`🌐 Polygon API request (attempt ${attempt}): ${path}`);
    const response = await fetch(url);
    
    if (response.status === 429) {
      if (attempt <= 3) {
        const delay = Math.pow(2, attempt - 1) * 500; // 500ms, 1000ms, 2000ms
        console.warn(`⚠️ Rate limited, retrying in ${delay}ms (attempt ${attempt}/3)`);
        await sleep(delay);
        return makeRequestWithBackoff<T>(path, params, ttl, cacheKey, attempt + 1);
      } else {
        throw new Error('RATE_LIMITED');
      }
    }
    
    if (response.status >= 500) {
      if (attempt <= 3) {
        const delay = Math.pow(2, attempt - 1) * 500;
        console.warn(`⚠️ Server error ${response.status}, retrying in ${delay}ms (attempt ${attempt}/3)`);
        await sleep(delay);
        return makeRequestWithBackoff<T>(path, params, ttl, cacheKey, attempt + 1);
      } else {
        throw new Error(`SERVER_ERROR_${response.status}`);
      }
    }
    
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    console.log(`✅ Polygon API success: ${path}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Polygon API error for ${path}:`, error);
    throw error;
  }
}

export async function getLatestTrade(symbol: string): Promise<{ price: number; timestamp: number }> {
  try {
    const data = await polyFetch<{ results: PolygonTrade }>(`/v3/trades/${symbol}/latest`, {}, TTL.PRICE);
    return {
      price: data.results.price,
      timestamp: data.results.sip_timestamp
    };
  } catch (error) {
    console.warn(`Failed to get latest trade for ${symbol}, falling back to snapshot`);
    const snapshot = await getSnapshot(symbol);
    return {
      price: snapshot.price,
      timestamp: Date.now()
    };
  }
}

export async function getSnapshot(symbol: string): Promise<{
  price: number;
  change: number;
  changePct: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
  prevClose: number;
}> {
  const data = await polyFetch<{ results: [PolygonSnapshot] }>(`/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}`, {}, TTL.SNAPSHOT);
  const ticker = data.results[0]?.ticker;
  
  if (!ticker) {
    throw new Error(`No data found for symbol ${symbol}`);
  }
  
  const currentPrice = ticker.lastTrade?.p || ticker.day?.c || 0;
  const prevClose = ticker.prevDay?.c || ticker.day?.o || currentPrice;
  const change = currentPrice - prevClose;
  const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;
  
  return {
    price: currentPrice,
    change,
    changePct,
    volume: ticker.day?.v || 0,
    high: ticker.day?.h || currentPrice,
    low: ticker.day?.l || currentPrice,
    open: ticker.day?.o || currentPrice,
    close: ticker.day?.c || currentPrice,
    prevClose
  };
}

export async function getAggregates(
  symbol: string,
  timeframe: '1m' | '5m' | '15m' | '1h' | '1D',
  from: string,
  to: string
): Promise<Array<{
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}>> {
  const mapping = TIMEFRAME_MAP[timeframe];
  if (!mapping) {
    throw new Error(`Unsupported timeframe: ${timeframe}`);
  }
  
  const data = await polyFetch<PolygonAggregatesResponse>(
    `/v2/aggs/ticker/${symbol}/range/${mapping.mult}/${mapping.timespan}/${from}/${to}`,
    { adjusted: 'true', sort: 'asc', limit: '50000' },
    TTL.CANDLES
  );
  
  if (!data.results || data.results.length === 0) {
    console.warn(`No aggregate data found for ${symbol} ${timeframe}`);
    return [];
  }
  
  return data.results.map(bar => ({
    timestamp: bar.t,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v
  }));
}

// Utility function to clear cache (useful for testing)
export function clearCache(): void {
  cache.clear();
  console.log('🧹 Polygon cache cleared');
}

// Get cache stats (for API status component)
export function getCacheStats(): {
  entries: number;
  hitRate: number;
  oldestEntry: number | null;
} {
  const entries = cache.size;
  const now = Date.now();
  let oldestTimestamp: number | null = null;
  
  for (const [, entry] of cache) {
    if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp;
    }
  }
  
  return {
    entries,
    hitRate: 0, // Would need to track hits vs misses to calculate this
    oldestEntry: oldestTimestamp ? now - oldestTimestamp : null
  };
}