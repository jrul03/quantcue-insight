import { useState, useEffect, useRef } from 'react';
import { getManyMemePrices, MemePriceResult } from '@/lib/memecoins';

interface MemePriceData {
  price: number | null;
  ts: number;
  source: string;
}

// Module-level cache to prevent flicker between component mounts
const priceCache = new Map<string, MemePriceData>();
let lastFetchTime = 0;

export function useMemePrices(ids: string[], active: boolean) {
  const [data, setData] = useState<Record<string, MemePriceData>>({});
  const [isStale, setIsStale] = useState(false);
  const activeRef = useRef(active);
  
  activeRef.current = active;

  useEffect(() => {
    if (!ids.length) return;

    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Initialize data from cache
    const initialData: Record<string, MemePriceData> = {};
    for (const id of ids) {
      const cached = priceCache.get(id);
      if (cached) {
        initialData[id] = cached;
      }
    }
    setData(initialData);

    const fetchPrices = async () => {
      if (!mounted) return;

      try {
        const results = await getManyMemePrices(ids);
        const now = Date.now();

        if (!mounted) return;

        const newData: Record<string, MemePriceData> = {};
        
        for (const result of results) {
          if (result.price !== null) {
            const priceData: MemePriceData = {
              price: result.price,
              ts: now,
              source: result.source
            };
            
            // Update cache and state
            priceCache.set(result.key, priceData);
            newData[result.key] = priceData;
          } else {
            // Keep existing cached value if fetch failed
            const existing = priceCache.get(result.key);
            if (existing) {
              newData[result.key] = existing;
            }
          }
        }

        lastFetchTime = now;
        setData(newData);
        setIsStale(false);
      } catch (error) {
        console.warn('Failed to fetch meme prices:', error);
        if (!mounted) return;
        
        // Keep existing data on error
        setIsStale(true);
      }

      if (!mounted) return;

      // Schedule next fetch based on active state
      const interval = activeRef.current 
        ? Math.random() * 3000 + 7000  // 7-10s when active
        : Math.random() * 15000 + 45000; // 45-60s when inactive

      timeoutId = setTimeout(fetchPrices, interval);
    };

    // Start fetching immediately if cache is stale or empty
    const cacheAge = Date.now() - lastFetchTime;
    const shouldFetchNow = cacheAge > 30000 || !ids.every(id => priceCache.has(id));
    
    if (shouldFetchNow) {
      fetchPrices();
    } else {
      // Schedule next fetch without immediate fetch
      const interval = activeRef.current ? 7000 : 45000;
      timeoutId = setTimeout(fetchPrices, interval);
    }

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [ids.join(','), active]);

  return { data, isStale };
}
