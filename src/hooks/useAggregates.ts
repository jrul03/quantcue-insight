import { useEffect, useState, useRef } from 'react';
import { getAggregates } from '@/lib/polygon';

interface AggregateData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AggregatesState {
  data: AggregateData[];
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

function getDateRange(timeframe: '1m' | '5m' | '15m' | '1h' | '1D'): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  let daysBack: number;
  switch (timeframe) {
    case '1m':
    case '5m':
    case '15m':
      daysBack = 5; // 5 days for intraday
      break;
    case '1h':
      daysBack = 30; // 30 days for hourly
      break;
    case '1D':
      daysBack = 365; // 1 year for daily
      break;
    default:
      daysBack = 5;
  }
  
  const fromDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
  const from = fromDate.toISOString().split('T')[0];
  
  return { from, to };
}

export function useAggregates(symbol: string, timeframe: '1m' | '5m' | '15m' | '1h' | '1D'): AggregatesState {
  const [state, setState] = useState<AggregatesState>({
    data: [],
    loading: false,
    error: null,
    lastFetch: null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!symbol || !timeframe) {
      setState({
        data: [],
        loading: false,
        error: null,
        lastFetch: null
      });
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    let isMounted = true;

    const fetchAggregates = async (isRefresh = false) => {
      if (!isRefresh) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      try {
        console.log(`📊 Fetching aggregates for ${symbol} ${timeframe}${isRefresh ? ' (refresh)' : ''}`);
        
        const { from, to } = getDateRange(timeframe);
        const aggregates = await getAggregates(symbol, timeframe, from, to);
        
        if (isMounted) {
          setState({
            data: aggregates,
            loading: false,
            error: null,
            lastFetch: Date.now()
          });
          
          console.log(`✅ Loaded ${aggregates.length} ${timeframe} candles for ${symbol}`);
        }
      } catch (error) {
        console.error(`❌ Failed to fetch aggregates for ${symbol} ${timeframe}:`, error);
        
        if (isMounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch data'
          }));
        }
      }
    };

    // Initial fetch
    fetchAggregates();

    // Set up refresh interval (30 seconds for live updates)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      fetchAggregates(true);
    }, 30000);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [symbol, timeframe]);

  return state;
}