import { useState, useEffect } from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { apiManager, APIStatus } from '@/lib/apiManager';
import { cn } from '@/lib/utils';

export const APIStatusIndicator = () => {
  const [status, setStatus] = useState<APIStatus>(apiManager.getStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = apiManager.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    apiManager.clearCache();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = (status: APIStatus['finnhub']) => {
    switch (status) {
      case 'connected': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rate_limited': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'offline': return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const getStatusIcon = (status: APIStatus['finnhub']) => {
    switch (status) {
      case 'connected': return <Wifi className="w-3 h-3" />;
      case 'rate_limited': return <Clock className="w-3 h-3" />;
      case 'offline': return <WifiOff className="w-3 h-3" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1">
        <Badge 
          variant="outline" 
          className={cn("text-xs px-2 py-0.5", getStatusColor(status.finnhub))}
        >
          {getStatusIcon(status.finnhub)}
          <span className="ml-1">Finnhub</span>
        </Badge>
        
        <Badge 
          variant="outline" 
          className={cn("text-xs px-2 py-0.5", getStatusColor(status.polygon))}
        >
          {getStatusIcon(status.polygon)}
          <span className="ml-1">Polygon</span>
        </Badge>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="h-6 w-6 p-0"
      >
        <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
      </Button>

      <span className="text-muted-foreground">
        {formatTimestamp(status.lastUpdate)}
      </span>
    </div>
  );
};