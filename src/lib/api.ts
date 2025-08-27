import { getFinnhubKey, getPolygonKey } from './keys';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface CandleStickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  sentiment?: number;
}

/**
 * Fetch real-time stock quote from Finnhub
 */
export const fetchStockQuote = async (symbol: string): Promise<StockQuote | null> => {
  const apiKey = getFinnhubKey();
  if (!apiKey) {
    console.error("Finnhub API key not available");
    return null;
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quote: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.c === 0) {
      console.warn(`No data available for symbol: ${symbol}`);
      return null;
    }
    
    return {
      symbol,
      price: data.c, // Current price
      change: data.d, // Change
      changePercent: data.dp, // Change percent
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return null;
  }
};

/**
 * Fetch historical candlestick data from Polygon
 */
export const fetchCandlestickData = async (
  symbol: string,
  timespan: 'minute' | 'hour' | 'day' = 'minute',
  multiplier: number = 1,
  from?: string,
  to?: string
): Promise<CandleStickData[]> => {
  const apiKey = getPolygonKey();
  if (!apiKey) {
    console.error("Polygon API key not available");
    return [];
  }

  try {
    // Default to last trading day if no dates provided
    const defaultTo = to || new Date().toISOString().split('T')[0];
    const defaultFrom = from || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${defaultFrom}/${defaultTo}?apiKey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch candlestick data: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.warn(`No candlestick data available for symbol: ${symbol}`);
      return [];
    }
    
    return data.results.map((candle: any) => ({
      timestamp: candle.t,
      open: candle.o,
      high: candle.h,
      low: candle.l,
      close: candle.c,
      volume: candle.v
    }));
  } catch (error) {
    console.error('Error fetching candlestick data:', error);
    return [];
  }
};

/**
 * Fetch company news from Finnhub
 */
export const fetchCompanyNews = async (
  symbol: string,
  from?: string,
  to?: string
): Promise<NewsItem[]> => {
  const apiKey = getFinnhubKey();
  if (!apiKey) {
    console.error("Finnhub API key not available");
    return [];
  }

  try {
    // Default to last 7 days
    const defaultTo = to || new Date().toISOString().split('T')[0];
    const defaultFrom = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${defaultFrom}&to=${defaultTo}&token=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch company news: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn(`Invalid news data for symbol: ${symbol}`);
      return [];
    }
    
    return data.map((article: any) => ({
      headline: article.headline || '',
      summary: article.summary || '',
      source: article.source || '',
      url: article.url || '',
      datetime: article.datetime * 1000, // Convert to milliseconds
      sentiment: undefined // Finnhub doesn't provide sentiment in this endpoint
    }));
  } catch (error) {
    console.error('Error fetching company news:', error);
    return [];
  }
};

/**
 * Fetch previous day's data from Polygon (useful for quick updates)
 */
export const fetchPreviousDayData = async (symbol: string): Promise<CandleStickData | null> => {
  const apiKey = getPolygonKey();
  if (!apiKey) {
    console.warn("Polygon API key not available");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch previous day data: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.warn(`No previous day data available for symbol: ${symbol}`);
      return null;
    }
    
    const result = data.results[0];
    return {
      timestamp: result.t,
      open: result.o,
      high: result.h,
      low: result.l,
      close: result.c,
      volume: result.v
    };
  } catch (error) {
    console.error('Error fetching previous day data:', error);
    return null;
  }
};