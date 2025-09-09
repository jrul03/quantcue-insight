import React, { useEffect, useState } from 'react';
import { useStreamData } from '@/hooks/useStreamData';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface TickerData {
  symbol: string;
  price: number | null;
  change: number;
  changePercent: number;
  market: string;
  lastUpdate: number;
}

const DEFAULT_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META',
  'BTC-USD', 'ETH-USD', 'EUR/USD', 'GBP/USD'
];

export function StreamTickerTape() {
  const [tickers, setTickers] = useState<Map<string, TickerData>>(new Map());
  const { connected, subscribe, addMessageHandler, error } = useStreamData();

  // Initialize default subscriptions
  useEffect(() => {
    if (connected) {
      subscribe(DEFAULT_SYMBOLS).catch(console.error);
    }
  }, [connected, subscribe]);

  // Handle incoming stream messages
  useEffect(() => {
    const removeHandler = addMessageHandler('*', (message) => {
      const { symbol, data, market, channel } = message;
      
      if (channel === 'trade' || channel === 'quote') {
        setTickers(prev => {
          const current = prev.get(symbol) || {
            symbol,
            price: null,
            change: 0,
            changePercent: 0,
            market,
            lastUpdate: 0
          };

          let newPrice = current.price;
          
          // Extract price from different message types
          if (channel === 'trade' && data.p) {
            newPrice = data.p;
          } else if (channel === 'quote' && data.P) {
            newPrice = data.P; // Ask price for quotes
          }

          if (newPrice && newPrice !== current.price) {
            const updated: TickerData = {
              ...current,
              price: newPrice,
              change: current.price ? newPrice - current.price : 0,
              changePercent: current.price ? ((newPrice - current.price) / current.price) * 100 : 0,
              lastUpdate: Date.now()
            };

            const newMap = new Map(prev);
            newMap.set(symbol, updated);
            return newMap;
          }

          return prev;
        });
      }
    });

    return removeHandler;
  }, [addMessageHandler]);

  if (error) {
    return (
      <Card className="p-4 bg-destructive/10 border-destructive/20">
        <div className="text-destructive text-sm">
          Stream Error: {error}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium">Live Market Data</h3>
        <Badge variant={connected ? "default" : "secondary"}>
          {connected ? "Connected" : "Disconnected"}
        </Badge>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from(tickers.values()).map((ticker) => (
          <div
            key={ticker.symbol}
            className="flex-shrink-0 min-w-[120px] p-3 rounded-lg bg-card/50 border"
          >
            <div className="text-xs font-medium text-muted-foreground mb-1">
              {ticker.symbol}
            </div>
            <div className="text-sm font-mono">
              {ticker.price ? `$${ticker.price.toFixed(2)}` : '--'}
            </div>
            <div className={`text-xs font-mono ${
              ticker.change > 0 ? 'text-green-500' : 
              ticker.change < 0 ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {ticker.change !== 0 && (
                <>
                  {ticker.change > 0 ? '+' : ''}
                  {ticker.change.toFixed(2)} ({ticker.changePercent.toFixed(1)}%)
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1 capitalize">
              {ticker.market}
            </div>
          </div>
        ))}
      </div>
      
      {tickers.size === 0 && connected && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Waiting for market data...
        </div>
      )}
    </Card>
  );
}