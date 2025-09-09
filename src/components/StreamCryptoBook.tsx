import React, { useEffect, useState } from 'react';
import { useStreamData } from '@/hooks/useStreamData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BookData {
  symbol: string;
  bid: number | null;
  ask: number | null;
  bidSize: number | null;
  askSize: number | null;
  spread: number | null;
  spreadPercent: number | null;
  lastUpdate: number;
}

const CRYPTO_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD'];

export function StreamCryptoBook() {
  const [books, setBooks] = useState<Map<string, BookData>>(new Map());
  const { connected, subscribe, addMessageHandler, error } = useStreamData();

  // Initialize crypto subscriptions
  useEffect(() => {
    if (connected) {
      subscribe(CRYPTO_SYMBOLS).catch(console.error);
    }
  }, [connected, subscribe]);

  // Handle incoming quote messages
  useEffect(() => {
    const removeHandler = addMessageHandler('*', (message) => {
      const { symbol, data, channel, market } = message;
      
      if (market === 'crypto' && channel === 'quote' && CRYPTO_SYMBOLS.includes(symbol)) {
        setBooks(prev => {
          const current = prev.get(symbol) || {
            symbol,
            bid: null,
            ask: null,
            bidSize: null,
            askSize: null,
            spread: null,
            spreadPercent: null,
            lastUpdate: 0
          };

          const updated: BookData = {
            ...current,
            bid: data.b || current.bid,
            ask: data.a || current.ask,
            bidSize: data.bs || current.bidSize,
            askSize: data.as || current.askSize,
            lastUpdate: Date.now()
          };

          // Calculate spread
          if (updated.bid && updated.ask) {
            updated.spread = updated.ask - updated.bid;
            updated.spreadPercent = (updated.spread / updated.ask) * 100;
          }

          const newMap = new Map(prev);
          newMap.set(symbol, updated);
          return newMap;
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
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium">Crypto Order Book</h3>
        <Badge variant={connected ? "default" : "secondary"}>
          {connected ? "Live" : "Offline"}
        </Badge>
      </div>

      <div className="space-y-4">
        {CRYPTO_SYMBOLS.map(symbol => {
          const book = books.get(symbol);
          return (
            <div key={symbol} className="border rounded-lg p-3">
              <div className="text-sm font-medium mb-2">{symbol}</div>
              
              <div className="grid grid-cols-3 gap-4 text-xs">
                {/* Bid Side */}
                <div>
                  <div className="text-muted-foreground mb-1">Bid</div>
                  <div className="font-mono text-green-500">
                    {book?.bid ? `$${book.bid.toFixed(2)}` : '--'}
                  </div>
                  <div className="text-muted-foreground">
                    {book?.bidSize ? `Size: ${book.bidSize.toFixed(4)}` : '--'}
                  </div>
                </div>

                {/* Spread */}
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">Spread</div>
                  <div className="font-mono">
                    {book?.spread ? `$${book.spread.toFixed(2)}` : '--'}
                  </div>
                  <div className="text-muted-foreground">
                    {book?.spreadPercent ? `${book.spreadPercent.toFixed(3)}%` : '--'}
                  </div>
                </div>

                {/* Ask Side */}
                <div className="text-right">
                  <div className="text-muted-foreground mb-1">Ask</div>
                  <div className="font-mono text-red-500">
                    {book?.ask ? `$${book.ask.toFixed(2)}` : '--'}
                  </div>
                  <div className="text-muted-foreground">
                    {book?.askSize ? `Size: ${book.askSize.toFixed(4)}` : '--'}
                  </div>
                </div>
              </div>

              {book?.lastUpdate && (
                <div className="text-xs text-muted-foreground mt-2">
                  Last update: {new Date(book.lastUpdate).toLocaleTimeString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {books.size === 0 && connected && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Waiting for crypto quotes...
        </div>
      )}
    </Card>
  );
}