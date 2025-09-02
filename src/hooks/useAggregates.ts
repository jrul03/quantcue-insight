import { useState, useEffect, useCallback } from 'react';
import { getAggregates, getRateLimitStatus } from '@/lib/polygon';

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AggregatesData {
  candles: CandleData[];
  loading: boolean;
  error: string | null;
  isRateLimited: boolean;
  lastFetch: number | null;
}

/**
 * Hook for historical candlestick data with smart polling
 * Refetches every 30s (intraday) or 120s (1D)
 */
export function useAggregates(
  symbol: string, 
  timeframe: '1m' | '5m' | '15m' | '1h' | '1D'
): AggregatesData {
  const [state, setState] = useState<AggregatesData>({
    candles: [],
    loading: false,
    error: null,
    isRateLimited: false,
    lastFetch: null
  });

  const fetchAggregates = useCallback(async () => {
    if (!symbol) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check rate limit status
      const rateLimitStatus = getRateLimitStatus();
      
      if (rateLimitStatus.isLimited) {
        setState(prev => ({
          ...prev,
          loading: false,
          isRateLimited: true,
          error: 'Rate limited'
        }));
        return;
      }

      const bars = await getAggregates(symbol, timeframe);
      
      // Convert to CandleData format
      const candleData: CandleData[] = bars.map(bar => ({
        timestamp: bar.timestamp,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume
      }));

      setState(prev => ({
        ...prev,
        candles: candleData,
        loading: false,
        error: null,
        isRateLimited: false,
        lastFetch: Date.now()
      }));

    } catch (error) {
      console.warn(`Failed to fetch aggregates for ${symbol} ${timeframe}:`, error);
      
      const rateLimitStatus = getRateLimitStatus();
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data',
        isRateLimited: rateLimitStatus.isLimited
      }));
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    if (!symbol) {
      setState({
        candles: [],
        loading: false,
        error: null,
        isRateLimited: false,
        lastFetch: null
      });
      return;
    }

    let isActive = true;
    let intervalId: NodeJS.Timeout;

    const pollAggregates = async () => {
      if (!isActive) return;
      
      await fetchAggregates();
      
      if (!isActive) return;

      // Set up next poll - 30s for intraday, 120s for daily
      const rateLimitStatus = getRateLimitStatus();
      let interval: number;
      
      if (rateLimitStatus.isLimited) {
        interval = 45000; // 45s when rate limited
      } else if (timeframe === '1D') {
        interval = 120000; // 2 minutes for daily
      } else {
        interval = 30000; // 30s for intraday
      }
      
      intervalId = setTimeout(pollAggregates, interval);
    };

    // Initial fetch
    pollAggregates();

    return () => {
      isActive = false;
      if (intervalId) {
        clearTimeout(intervalId);
      }
    };
  }, [fetchAggregates]);

  return state;
}