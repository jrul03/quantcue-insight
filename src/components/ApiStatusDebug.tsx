import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getRateLimitStatus, getCacheStats } from '@/lib/polygon';
import { Activity, AlertTriangle, CheckCircle, Clock, Database } from 'lucide-react';

interface ApiStats {
  rateLimit: { isLimited: boolean; until: number };
  cache: { size: number; keys: string[] };
}

export function ApiStatusDebug() {
  const [stats, setStats] = useState<ApiStats>({
    rateLimit: { isLimited: false, until: 0 },
    cache: { size: 0, keys: [] }
  });
  
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats({
        rateLimit: getRateLimitStatus(),
        cache: getCacheStats()
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const { rateLimit, cache } = stats;
  const rateLimitRemaining = rateLimit.isLimited ? Math.max(0, rateLimit.until - Date.now()) : 0;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge
        variant={rateLimit.isLimited ? "destructive" : "secondary"}
        className="cursor-pointer flex items-center gap-2 text-xs"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {rateLimit.isLimited ? (
          <AlertTriangle className="w-3 h-3" />
        ) : (
          <Activity className="w-3 h-3 text-green-500" />
        )}
        API Status
      </Badge>

      {isExpanded && (
        <Card className="absolute top-8 right-0 p-3 w-64 text-xs space-y-2 bg-card/95 backdrop-blur-sm">
          {/* Rate Limit Status */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Rate Limit:</span>
            <div className="flex items-center gap-2">
              {rateLimit.isLimited ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-red-500">
                    {Math.ceil(rateLimitRemaining / 1000)}s
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">OK</span>
                </>
              )}
            </div>
          </div>

          {/* Cache Stats */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cache:</span>
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3 text-blue-500" />
              <span>{cache.size} entries</span>
            </div>
          </div>

          {/* Environment Check */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">API Key:</span>
            <div className="flex items-center gap-2">
              {import.meta.env.VITE_POLYGON_KEY ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">Set</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-red-500">Missing</span>
                </>
              )}
            </div>
          </div>

          {/* Recent Cache Keys */}
          {cache.keys.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="text-muted-foreground mb-1">Recent cache keys:</div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {cache.keys.slice(-5).map((key, i) => (
                  <div key={i} className="text-xs font-mono text-muted-foreground/80 truncate">
                    {key}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="flex items-center justify-between pt-2 border-t border-border text-muted-foreground/60">
            <Clock className="w-3 h-3" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </Card>
      )}
    </div>
  );
}