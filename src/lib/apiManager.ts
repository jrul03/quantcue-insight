import { StockQuote, CandleStickData, NewsItem } from './api';
import { getFinnhubKey, getPolygonKey } from './keys';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RequestQueue {
  symbol: string;
  type: 'quote' | 'candles' | 'news';
  resolve: (data: any) => void;
  reject: (error: any) => void;
  retryCount: number;
}

export interface APIStatus {
  finnhub: 'connected' | 'rate_limited' | 'offline';
  polygon: 'connected' | 'rate_limited' | 'offline';
  lastUpdate: number;
}

class APIManager {
  private cache = new Map<string, CacheEntry<any>>();
  private requestQueue: RequestQueue[] = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private readonly REQUEST_DELAY = 1000; // 1 second between requests
  private readonly CACHE_TTL = 30000; // 30 seconds cache
  private readonly MAX_RETRIES = 3;
  
  private status: APIStatus = {
    finnhub: 'connected',
    polygon: 'connected',
    lastUpdate: Date.now()
  };

  private statusCallbacks: ((status: APIStatus) => void)[] = [];

  getStatus(): APIStatus {
    return { ...this.status };
  }

  onStatusChange(callback: (status: APIStatus) => void) {
    this.statusCallbacks.push(callback);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) this.statusCallbacks.splice(index, 1);
    };
  }

  private updateStatus(api: 'finnhub' | 'polygon', status: APIStatus['finnhub']) {
    this.status[api] = status;
    this.status.lastUpdate = Date.now();
    this.statusCallbacks.forEach(callback => callback(this.getStatus()));
  }

  private getCacheKey(type: string, symbol: string, params?: any): string {
    return `${type}:${symbol}:${JSON.stringify(params || {})}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      
      // Rate limiting
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.REQUEST_DELAY) {
        await this.delay(this.REQUEST_DELAY - timeSinceLastRequest);
      }
      
      try {
        let result;
        switch (request.type) {
          case 'quote':
            result = await this.fetchQuoteInternal(request.symbol);
            break;
          case 'candles':
            result = await this.fetchCandlesInternal(request.symbol);
            break;
          case 'news':
            result = await this.fetchNewsInternal(request.symbol);
            break;
        }
        
        this.lastRequestTime = Date.now();
        request.resolve(result);
        
      } catch (error) {
        if (request.retryCount < this.MAX_RETRIES) {
          // Exponential backoff
          const backoffDelay = Math.pow(2, request.retryCount) * 1000;
          await this.delay(backoffDelay);
          
          request.retryCount++;
          this.requestQueue.unshift(request); // Retry at front of queue
        } else {
          request.reject(error);
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  private queueRequest<T>(symbol: string, type: 'quote' | 'candles' | 'news'): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check for duplicate requests
      const existingIndex = this.requestQueue.findIndex(
        req => req.symbol === symbol && req.type === type
      );
      
      if (existingIndex > -1) {
        // Replace existing request to deduplicate
        this.requestQueue[existingIndex] = {
          symbol,
          type,
          resolve,
          reject,
          retryCount: 0
        };
      } else {
        this.requestQueue.push({
          symbol,
          type,
          resolve,
          reject,
          retryCount: 0
        });
      }
      
      this.processQueue();
    });
  }

  async fetchStockQuote(symbol: string, useCache: boolean = true): Promise<StockQuote | null> {
    const cacheKey = this.getCacheKey('quote', symbol);
    
    if (useCache) {
      const cached = this.getFromCache<StockQuote>(cacheKey);
      if (cached) return cached;
    }
    
    try {
      const result = await this.queueRequest<StockQuote | null>(symbol, 'quote');
      if (result) {
        this.setCache(cacheKey, result);
      }
      return result;
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
      return this.getFromCache<StockQuote>(cacheKey); // Return stale data if available
    }
  }

  private async fetchQuoteInternal(symbol: string): Promise<StockQuote | null> {
    const apiKey = getFinnhubKey();
    if (!apiKey) {
      this.updateStatus('finnhub', 'offline');
      return null;
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
    );
    
    if (response.status === 429) {
      this.updateStatus('finnhub', 'rate_limited');
      throw new Error('Rate limited');
    }
    
    if (!response.ok) {
      this.updateStatus('finnhub', 'offline');
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    this.updateStatus('finnhub', 'connected');
    
    if (data.c === 0) return null;
    
    return {
      symbol,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      timestamp: Date.now()
    };
  }

  private async fetchCandlesInternal(symbol: string): Promise<CandleStickData[]> {
    // Implementation similar to fetchQuoteInternal for candles
    return [];
  }

  private async fetchNewsInternal(symbol: string): Promise<NewsItem[]> {
    // Implementation similar to fetchQuoteInternal for news
    return [];
  }

  async fetchMultipleQuotes(symbols: string[]): Promise<(StockQuote | null)[]> {
    const promises = symbols.map(symbol => this.fetchStockQuote(symbol));
    return Promise.all(promises);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Get last known prices for immediate display
  getLastKnownPrices(symbols: string[]): (StockQuote | null)[] {
    return symbols.map(symbol => {
      const cacheKey = this.getCacheKey('quote', symbol);
      return this.getFromCache<StockQuote>(cacheKey);
    });
  }
}

export const apiManager = new APIManager();