import { useEffect, useState } from 'react';
import { getCacheStats } from '@/lib/polygon';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ApiStatusProps {
  priceData?: {
    lastUpdate: number | null;
    isRateLimited: boolean;
    error: string | null;
    pollingInterval: string;
  };
  aggregatesData?: {
    lastFetch: number | null;
    error: string | null;
    dataAge: string;
  };
}

function formatTimestamp(ts: number | null): string {
  if (!ts) return 'Never';
  const now = Date.now();
  const diff = now - ts;
  
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export function ApiStatusDebug({ priceData, aggregatesData }: ApiStatusProps) {
  const [cacheStats, setCacheStats] = useState(getCacheStats());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(getCacheStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <Badge 
        variant="outline" 
        className="cursor-pointer"
        onClick={() => setIsVisible(true)}
      >
        API Debug
      </Badge>
    );
  }

  return (
    <Card className="absolute top-12 right-0 z-50 w-80">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">API Status</h3>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
        
        {priceData && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Live Price</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Last update: {formatTimestamp(priceData.lastUpdate)}</div>
              <div>Polling: {priceData.pollingInterval}</div>
              {priceData.isRateLimited && (
                <Badge variant="secondary" className="text-xs">
                  Rate Limited
                </Badge>
              )}
              {priceData.error && (
                <div className="text-red-500">Error: {priceData.error}</div>
              )}
            </div>
          </div>
        )}

        {aggregatesData && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Aggregates</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Last fetch: {formatTimestamp(aggregatesData.lastFetch)}</div>
              <div>Data age: {aggregatesData.dataAge}</div>
              {aggregatesData.error && (
                <div className="text-red-500">Error: {aggregatesData.error}</div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <div className="text-sm font-medium">Cache</div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Entries: {cacheStats.entries}</div>
            <div>Oldest: {formatTimestamp(cacheStats.oldestEntry)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}