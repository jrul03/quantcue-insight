import { useEffect, useState, useRef } from 'react';
import { getLatestTrade, getSnapshot } from '@/lib/polygon';

interface LivePriceData {
  price: number | null;
  change: number | null;
  changePct: number | null;
  ts: number | null;
  isRateLimited: boolean;
  error: string | null;
}

export function useLivePrice(symbol: string, active: boolean = true): LivePriceData {
  const [data, setData] = useState<LivePriceData>({
    price: null,
    change: null,
    changePct: null,
    ts: null,
    isRateLimited: false,
    error: null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const rateLimitedRef = useRef(false);

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

    let isMounted = true;

    const fetchPrice = async () => {
      try {
        console.log(`💰 Fetching live price for ${symbol} (active: ${active})`);
        
        // Try latest trade first, fallback to snapshot
        try {
          const tradeData = await getLatestTrade(symbol);
          
          if (isMounted) {
            // Get additional data from snapshot for change calculation
            try {
              const snapshotData = await getSnapshot(symbol);
              setData({
                price: tradeData.price,
                change: snapshotData.change,
                changePct: snapshotData.changePct,
                ts: tradeData.timestamp,
                isRateLimited: false,
                error: null
              });
            } catch {
              // If snapshot fails, just use trade price without change data
              setData({
                price: tradeData.price,
                change: null,
                changePct: null,
                ts: tradeData.timestamp,
                isRateLimited: false,
                error: null
              });
            }
          }
        } catch (tradeError) {
          // Fallback to snapshot only
          const snapshotData = await getSnapshot(symbol);
          
          if (isMounted) {
            setData({
              price: snapshotData.price,
              change: snapshotData.change,
              changePct: snapshotData.changePct,
              ts: Date.now(),
              isRateLimited: false,
              error: null
            });
          }
        }

        // Reset rate limit flag on successful request
        rateLimitedRef.current = false;

      } catch (error) {
        console.error(`❌ Failed to fetch price for ${symbol}:`, error);
        
        if (isMounted) {
          const isRateLimit = error instanceof Error && error.message === 'RATE_LIMITED';
          
          if (isRateLimit) {
            rateLimitedRef.current = true;
          }
          
          setData(prev => ({
            ...prev,
            isRateLimited: isRateLimit,
            error: error instanceof Error ? error.message : 'Unknown error',
            ts: Date.now()
          }));
        }
      }
    };

    // Initial fetch
    fetchPrice();

    // Set up polling interval based on active state and rate limit status
    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      let interval: number;
      if (rateLimitedRef.current) {
        interval = 15000; // 15s when rate limited
      } else if (active) {
        interval = 5000; // 5s when active
      } else {
        interval = 60000; // 60s when inactive
      }

      console.log(`⏰ Setting up price polling for ${symbol}: ${interval}ms`);
      
      intervalRef.current = setInterval(fetchPrice, interval);
    };

    startPolling();

    // Update polling interval when rate limit status changes
    const checkRateLimitInterval = setInterval(() => {
      const newInterval = rateLimitedRef.current ? 15000 : (active ? 5000 : 60000);
      const currentInterval = intervalRef.current ? 
        (rateLimitedRef.current ? 15000 : (active ? 5000 : 60000)) : 0;
      
      if (newInterval !== currentInterval) {
        startPolling();
      }
    }, 1000);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(checkRateLimitInterval);
    };
  }, [symbol, active]);

  return data;
}