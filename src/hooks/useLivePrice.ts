import { useState, useEffect, useCallback } from 'react';
import { getLatestTrade, getLatestQuote, getSnapshot, getRateLimitStatus } from '@/lib/polygon';

interface LivePriceData {
  price: number | null;
  change: number | null;
  changePct: number | null;
  lastUpdated: number | null;
  isRateLimited: boolean;
  error: string | null;
}

/**
 * Hook for live price data with smart polling and fallback chain
 * Polls: getLatestTrade() -> getLatestQuote() mid -> snapshot lastTrade/day close
 */
export function useLivePrice(symbol: string, active: boolean = true): LivePriceData {
  const [data, setData] = useState<LivePriceData>({
    price: null,
    change: null,
    changePct: null,
    lastUpdated: null,
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

      let price: number | null = null;
      
      // 1. Try latest trade
      price = await getLatestTrade(symbol);
      
      // 2. Fallback to latest quote mid price
      if (price === null) {
        price = await getLatestQuote(symbol);
      }
      
      // 3. Fallback to snapshot data
      if (price === null) {
        const snapshot = await getSnapshot(symbol);
        if (snapshot?.ticker) {
          price = snapshot.ticker.lastTrade?.p || 
                  snapshot.ticker.last_trade?.p || 
                  snapshot.ticker.day?.c ||
                  snapshot.ticker.prevDay?.c ||
                  null;
        }
      }

      if (price !== null) {
        // Get previous close for change calculation from snapshot
        const snapshot = await getSnapshot(symbol);
        const previousClose = snapshot?.ticker?.prevDay?.c || null;
        
        const change = previousClose ? price - previousClose : null;
        const changePct = previousClose && change !== null ? (change / previousClose) * 100 : null;

        setData({
          price,
          change,
          changePct,
          lastUpdated: Date.now(),
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
        lastUpdated: null,
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
        interval = Math.random() * 2000 + 5000; // 5-7s when active
      } else {
        interval = Math.random() * 15000 + 45000; // 45-60s when inactive
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