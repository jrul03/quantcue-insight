import React, { useState, useCallback } from 'react';
import { useStreamData } from '@/hooks/useStreamData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Minus } from 'lucide-react';

interface Ticker {
  ticker: string;
  name?: string;
  market?: string;
  type?: string;
}

export function StreamSymbolSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('stocks');
  const [searchResults, setSearchResults] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { 
    connected, 
    subscriptions, 
    subscribe, 
    unsubscribe, 
    searchTickers,
    searchOptionsContracts 
  } = useStreamData();

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      let results;
      if (selectedMarket === 'options') {
        const data = await searchOptionsContracts(searchTerm.toUpperCase());
        results = data.results?.map((contract: any) => ({
          ticker: contract.ticker,
          name: `${contract.underlying_ticker} ${contract.expiration_date} ${contract.contract_type} ${contract.strike_price}`,
          market: 'options'
        })) || [];
      } else {
        const data = await searchTickers(selectedMarket, searchTerm);
        results = data.results || [];
      }
      
      setSearchResults(results.slice(0, 20)); // Limit to 20 results
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedMarket, searchTickers, searchOptionsContracts]);

  const handleSubscribe = useCallback(async (symbol: string) => {
    try {
      await subscribe([symbol]);
    } catch (error) {
      console.error('Subscribe failed:', error);
    }
  }, [subscribe]);

  const handleUnsubscribe = useCallback(async (symbol: string) => {
    try {
      await unsubscribe([symbol]);
    } catch (error) {
      console.error('Unsubscribe failed:', error);
    }
  }, [unsubscribe]);

  const isSubscribed = (symbol: string) => subscriptions.includes(symbol);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-4">Symbol Search & Subscriptions</h3>
      
      {/* Search Form */}
      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stocks">Stocks</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="forex">Forex</SelectItem>
              <SelectItem value="options">Options</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            placeholder={`Search ${selectedMarket}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          
          <Button 
            onClick={handleSearch} 
            disabled={!connected || loading || !searchTerm.trim()}
            size="sm"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {!connected && (
          <div className="text-sm text-muted-foreground">
            Stream disconnected - search unavailable
          </div>
        )}
      </div>

      {/* Current Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">
            Subscribed Symbols ({subscriptions.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {subscriptions.map(symbol => (
              <Badge key={symbol} variant="secondary" className="flex items-center gap-1">
                {symbol}
                <button
                  onClick={() => handleUnsubscribe(symbol)}
                  className="ml-1 hover:text-destructive"
                >
                  <Minus className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2">Search Results</div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((ticker, index) => (
              <div key={`${ticker.ticker}-${index}`} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-medium">
                    {ticker.ticker}
                  </div>
                  {ticker.name && (
                    <div className="text-xs text-muted-foreground truncate">
                      {ticker.name}
                    </div>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant={isSubscribed(ticker.ticker) ? "destructive" : "default"}
                  onClick={() => 
                    isSubscribed(ticker.ticker) 
                      ? handleUnsubscribe(ticker.ticker)
                      : handleSubscribe(ticker.ticker)
                  }
                  disabled={!connected}
                >
                  {isSubscribed(ticker.ticker) ? (
                    <Minus className="h-3 w-3" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Searching...
        </div>
      )}
    </Card>
  );
}