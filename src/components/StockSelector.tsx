import { useState, useEffect } from "react";
import { ChevronDown, Search, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiManager } from "@/lib/apiManager";
import { cn } from "@/lib/utils";

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

// Initial stock symbols - prices will be fetched from API
const stockSymbols = [
  { symbol: "SPY", name: "S&P 500 ETF" },
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "BTC-USD", name: "Bitcoin" },
  { symbol: "ETH-USD", name: "Ethereum" },
];

interface StockSelectorProps {
  selectedStock: Stock;
  onStockSelect: (stock: Stock) => void;
}

export const StockSelector = ({ selectedStock, onStockSelect }: StockSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stocksWithPrices, setStocksWithPrices] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSymbols, setLoadingSymbols] = useState<Set<string>>(new Set());

  // Load last known prices immediately
  useEffect(() => {
    const symbols = stockSymbols.map(s => s.symbol);
    const lastKnownPrices = apiManager.getLastKnownPrices(symbols);
    
    const stocksWithCachedPrices: Stock[] = stockSymbols.map((stock, index) => {
      const cachedQuote = lastKnownPrices[index];
      return {
        symbol: stock.symbol,
        name: stock.name,
        price: cachedQuote?.price || 0,
        change: cachedQuote?.change || 0
      };
    });
    
    setStocksWithPrices(stocksWithCachedPrices);
  }, []);

  // Fetch fresh prices when dropdown opens
  const fetchFreshPrices = async () => {
    if (!isOpen || loading) return;
    
    setLoading(true);
    const symbols = stockSymbols.map(s => s.symbol);
    setLoadingSymbols(new Set(symbols));
    
    try {
      const quotes = await apiManager.fetchMultipleQuotes(symbols);
      const stocksWithFreshPrices: Stock[] = stockSymbols.map((stock, index) => {
        const quote = quotes[index];
        return {
          symbol: stock.symbol,
          name: stock.name,
          price: quote?.price || 0,
          change: quote?.change || 0
        };
      });
      
      setStocksWithPrices(stocksWithFreshPrices);
    } catch (error) {
      console.error('Failed to fetch fresh prices:', error);
    } finally {
      setLoading(false);
      setLoadingSymbols(new Set());
    }
  };

  useEffect(() => {
    fetchFreshPrices();
  }, [isOpen]);

  const filteredStocks = stocksWithPrices.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStockSelect = (stock: Stock) => {
    onStockSelect(stock);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold">{selectedStock.symbol}</span>
          <span className="text-muted-foreground text-sm">{selectedStock.name}</span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <Card className="absolute top-full left-0 mt-2 w-80 z-50 p-4 bg-card/95 backdrop-blur-sm border border-border">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredStocks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No stocks found</div>
              ) : (
                filteredStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleStockSelect(stock)}
                    className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                      selectedStock.symbol === stock.symbol ? 'bg-primary/10 border border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{stock.symbol}</span>
                          <span className="text-xs text-muted-foreground">{stock.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono">
                            {stock.price > 0 ? `$${stock.price.toFixed(2)}` : '--'}
                          </span>
                          {stock.price > 0 && (
                            <div className={cn(
                              "flex items-center gap-1 text-xs",
                              stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                            )}>
                              {stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {loadingSymbols.has(stock.symbol) && (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};