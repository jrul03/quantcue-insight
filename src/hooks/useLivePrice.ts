import { useState, useEffect, useCallback } from 'react';
import { getLatestTrade, getSnapshot, getRateLimitStatus } from '@/lib/polygon';

interface LivePriceData {
  price: number | null;
  change: number | null;
  changePct: number | null;
  ts: number | null;
  isRateLimited: boolean;
  error: string | null;
}

/**
 * Hook for live price data with smart polling
 */
export function useLivePrice(symbol: string, active: boolean = true): LivePriceData {
  const [data, setData] = useState<LivePriceData>({
    price: null,
    change: null,
    changePct: null,
    ts: null,
    isRateLimited: false,
    error: null
  });

  const fetchPrice = useCallback(async () => {
    if (!symbol) return;

    try {
      // Check rate limit status
      const rateLimitStatus = getRateLimitStatus();
      
      if (rateLimitStatus.isLimited) {
        setData(prev => ({
          ...prev,
          isRateLimited: true,
          error: 'Rate limited'
        }));
        return;
      }

      // Try latest trade first, fallback to snapshot
      let price = await getLatestTrade(symbol);
      
      if (price === null) {
        const snapshot = await getSnapshot(symbol);
        price = snapshot?.ticker?.lastTrade?.p || 
                snapshot?.ticker?.last_trade?.p || 
                snapshot?.ticker?.day?.c || 
                null;
      }

      if (price !== null) {
        // Get previous close for change calculation
        const snapshot = await getSnapshot(symbol);
        const previousClose = snapshot?.ticker?.day?.o || null;
        
        const change = previousClose ? price - previousClose : null;
        const changePct = previousClose && change !== null ? (change / previousClose) * 100 : null;

        setData({
          price,
          change,
          changePct,
          ts: Date.now(),
          isRateLimited: false,
          error: null
        });
      } else {
        setData(prev => ({
          ...prev,
          error: 'No price data available',
          isRateLimited: false
        }));
      }
    } catch (error) {
      console.warn(`Failed to fetch price for ${symbol}:`, error);
      
      const rateLimitStatus = getRateLimitStatus();
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch price',
        isRateLimited: rateLimitStatus.isLimited
      }));
    }
  }, [symbol]);

  useEffect(() => {
    if (!symbol) {
      setData({
        price: null,
        change: null,
        changePct: null,
        ts: null,
        isRateLimited: false,
        error: null
      });
      return;
    }

    let isActive = true;
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      if (!isActive) return;
      
      await fetchPrice();
      
      if (!isActive) return;

      // Determine polling interval
      const rateLimitStatus = getRateLimitStatus();
      let interval: number;
      
      if (rateLimitStatus.isLimited) {
        interval = 15000; // 15s when rate limited
      } else if (active) {
        interval = 5000; // 5s when active
      } else {
        interval = 60000; // 60s when inactive
      }

      timeoutId = setTimeout(poll, interval);
    };

    // Start polling
    poll();

    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [symbol, active, fetchPrice]);

  return data;
}