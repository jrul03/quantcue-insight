import { useState, useEffect, useCallback } from 'react';
import { getLatestTrade, getLatestQuote, getSnapshot, getRateLimitStatus } from '@/lib/polygon';
import { detectAssetClass } from '@/lib/assets';
import { getCryptoPrice } from '@/lib/cryptoOrchestrator';

interface LivePriceData {
  price: number | null;
  change: number | null;
  changePct: number | null;
  lastUpdated: number | null;
  isRateLimited: boolean;
  error: string | null;
  source?: string;
  isStale?: boolean;
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
      const assetClass = detectAssetClass(symbol);
      
      // Check rate limit status for Polygon
      const rateLimitStatus = getRateLimitStatus();
      
      if (rateLimitStatus.isLimited && assetClass !== 'crypto') {
        setData(prev => ({
          ...prev,
          isRateLimited: true,
          error: 'Rate limited'
        }));
        return;
      }

      let price: number | null = null;
      let change: number | null = null;
      let changePct: number | null = null;
      let source = 'polygon';
      
      // Route based on asset class
      if (assetClass === 'crypto') {
        const cryptoResult = await getCryptoPrice(symbol);
        if (cryptoResult) {
          price = cryptoResult.price;
          change = cryptoResult.change || null;
          changePct = cryptoResult.changePct || null;
          source = cryptoResult.source;
        }
      } else {
        // Stocks/FX: use existing Polygon chain
        price = await getLatestTrade(symbol);
        
        if (price === null) {
          price = await getLatestQuote(symbol);
        }
        
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
          // Get change data from snapshot
          const snapshot = await getSnapshot(symbol);
          const previousClose = snapshot?.ticker?.prevDay?.c || null;
          
          change = previousClose ? price - previousClose : null;
          changePct = previousClose && change !== null ? (change / previousClose) * 100 : null;
        }
      }

      if (price !== null) {
        const now = Date.now();
        setData(prev => ({
          price,
          change,
          changePct,
          lastUpdated: now,
          isRateLimited: false,
          error: null,
          source,
          isStale: prev.lastUpdated ? now - prev.lastUpdated > 30000 : false
        }));
      } else {
        // Keep last known good price to prevent flicker
        setData(prev => ({
          ...prev,
          error: prev.price !== null ? null : 'No price data available',
          isRateLimited: false,
          isStale: true
        }));
      }
    } catch (error) {
      console.warn(`Failed to fetch price for ${symbol}:`, error);
      
      const rateLimitStatus = getRateLimitStatus();
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch price',
        isRateLimited: rateLimitStatus.isLimited,
        isStale: true
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
        error: null,
        source: undefined,
        isStale: false
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