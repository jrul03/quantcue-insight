import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MarketDepthHeatmapProps {
  symbol: string;
}

interface OrderBookLevel {
  price: number;
  size: number;
  type: 'bid' | 'ask';
  intensity: number; // 0-1 for heatmap intensity
}

export const MarketDepthHeatmap = ({ symbol }: MarketDepthHeatmapProps) => {
  const [orderBook, setOrderBook] = useState<OrderBookLevel[]>([]);
  const [spread, setSpread] = useState(0);
  const [selectedDepth, setSelectedDepth] = useState(10);

  useEffect(() => {
    const generateOrderBook = () => {
      const basePrice = 175.50;
      const levels: OrderBookLevel[] = [];
      
      // Generate bid levels (below current price)
      for (let i = 1; i <= selectedDepth; i++) {
        const price = basePrice - (i * 0.05);
        const size = Math.random() * 10000 + 1000;
        const intensity = Math.random();
        
        levels.push({
          price,
          size,
          type: 'bid',
          intensity
        });
      }
      
      // Generate ask levels (above current price)
      for (let i = 1; i <= selectedDepth; i++) {
        const price = basePrice + (i * 0.05);
        const size = Math.random() * 10000 + 1000;
        const intensity = Math.random();
        
        levels.push({
          price,
          size,
          type: 'ask',
          intensity
        });
      }
      
      setOrderBook(levels);
      
      // Calculate spread
      const bestBid = Math.max(...levels.filter(l => l.type === 'bid').map(l => l.price));
      const bestAsk = Math.min(...levels.filter(l => l.type === 'ask').map(l => l.price));
      setSpread(bestAsk - bestBid);
    };

    generateOrderBook();
    const interval = setInterval(generateOrderBook, 2000);
    
    return () => clearInterval(interval);
  }, [selectedDepth]);

  const bids = orderBook.filter(l => l.type === 'bid').sort((a, b) => b.price - a.price);
  const asks = orderBook.filter(l => l.type === 'ask').sort((a, b) => a.price - b.price);

  const maxSize = Math.max(...orderBook.map(l => l.size));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-green-400 rounded"></div>
          <h4 className="text-sm font-medium text-slate-300">Market Depth</h4>
        </div>
        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
          {symbol}
        </Badge>
      </div>

      {/* Depth Controls */}
      <div className="flex gap-1 p-1 bg-slate-800/30 rounded-lg">
        {[5, 10, 20].map((depth) => (
          <Button
            key={depth}
            size="sm"
            variant={selectedDepth === depth ? "default" : "ghost"}
            onClick={() => setSelectedDepth(depth)}
            className="text-xs h-7 px-2 flex-1"
          >
            {depth} levels
          </Button>
        ))}
      </div>

      {/* Spread Info */}
      <Card className="p-2 bg-slate-900/50 border-slate-700/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Spread:</span>
          <span className="font-mono text-orange-400">${spread.toFixed(4)}</span>
        </div>
      </Card>

      {/* Order Book Heatmap */}
      {orderBook.length === 0 && (
        <Card className="p-3 bg-slate-900/50 border-slate-700/50 text-xs text-slate-400">
          No depth data available. Try a different symbol or timeframe.
        </Card>
      )}
      <div className="space-y-1">
        {/* Asks (Sell Orders) */}
        <div className="space-y-px">
          {asks.slice(0, 5).reverse().map((level, index) => (
            <div key={`ask-${index}`} className="relative">
              <div 
                className="absolute inset-0 bg-red-400 rounded-sm"
                style={{ 
                  opacity: level.intensity * 0.3,
                  width: `${(level.size / maxSize) * 100}%`
                }}
              />
              <div className="relative flex items-center justify-between p-1 text-xs">
                <span className="font-mono text-red-400">${level.price.toFixed(2)}</span>
                <span className="font-mono text-slate-300">{(level.size / 1000).toFixed(1)}K</span>
              </div>
            </div>
          ))}
        </div>

        {/* Current Price */}
        <div className="flex items-center justify-center py-2 border-t border-b border-slate-600">
          <div className="text-sm font-bold text-blue-400">
            ${(orderBook.length > 0 ? 
              (Math.max(...bids.map(b => b.price)) + Math.min(...asks.map(a => a.price))) / 2 
              : 175.50
            ).toFixed(2)}
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="space-y-px">
          {bids.slice(0, 5).map((level, index) => (
            <div key={`bid-${index}`} className="relative">
              <div 
                className="absolute inset-0 bg-green-400 rounded-sm"
                style={{ 
                  opacity: level.intensity * 0.3,
                  width: `${(level.size / maxSize) * 100}%`
                }}
              />
              <div className="relative flex items-center justify-between p-1 text-xs">
                <span className="font-mono text-green-400">${level.price.toFixed(2)}</span>
                <span className="font-mono text-slate-300">{(level.size / 1000).toFixed(1)}K</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <Card className="p-3 bg-slate-900/50 border-slate-700/50">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-slate-400">Total Bids</div>
            <div className="font-mono text-green-400">
              {(bids.reduce((sum, b) => sum + b.size, 0) / 1000).toFixed(0)}K
            </div>
          </div>
          <div>
            <div className="text-slate-400">Total Asks</div>
            <div className="font-mono text-red-400">
              {(asks.reduce((sum, a) => sum + a.size, 0) / 1000).toFixed(0)}K
            </div>
          </div>
          <div>
            <div className="text-slate-400">Bid/Ask Ratio</div>
            <div className="font-mono text-blue-400">
              {(bids.length > 0 && asks.length > 0 ? 
                (bids.reduce((sum, b) => sum + b.size, 0) / asks.reduce((sum, a) => sum + a.size, 0)).toFixed(2)
                : '1.00'
              )}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Market Imbalance</div>
            <div className={`font-mono ${
              bids.reduce((sum, b) => sum + b.size, 0) > asks.reduce((sum, a) => sum + a.size, 0) 
                ? 'text-green-400' : 'text-red-400'
            }`}>
              {bids.reduce((sum, b) => sum + b.size, 0) > asks.reduce((sum, a) => sum + a.size, 0) 
                ? 'Bullish' : 'Bearish'
              }
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
