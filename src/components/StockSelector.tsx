import { useState, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchStockQuote } from "@/lib/api";

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

// Initial stock symbols with expanded asset classes
const stockSymbols = [
  { symbol: "SPY", name: "S&P 500 ETF" },
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
  // Crypto majors
  { symbol: "BTC-USD", name: "Bitcoin" },
  { symbol: "ETH-USD", name: "Ethereum" },
  { symbol: "SOL-USD", name: "Solana" },
  { symbol: "ADA-USD", name: "Cardano" },
  // Meme coins
  { symbol: "DOGE-USD", name: "Dogecoin" },
  { symbol: "SHIB-USD", name: "Shiba Inu" },
  { symbol: "PEPE-USD", name: "Pepe" },
  // Commodities & FX
  { symbol: "GLD", name: "Gold ETF" },
  { symbol: "USO", name: "Oil ETF" },
  { symbol: "EURUSD=X", name: "EUR/USD" }
];

interface StockSelectorProps {
  selectedStock: Stock;
  onStockSelect: (stock: Stock) => void;
}

export const StockSelector = ({ selectedStock, onStockSelect }: StockSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stocksWithPrices, setStocksWithPrices] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real prices for all stocks on component mount
  useEffect(() => {
    const fetchAllStockPrices = async () => {
      setLoading(true);
      const stocksWithRealPrices: Stock[] = [];
      
      for (const stock of stockSymbols) {
        try {
          const quote = await fetchStockQuote(stock.symbol);
          if (quote) {
            stocksWithRealPrices.push({
              symbol: stock.symbol,
              name: stock.name,
              price: quote.price,
              change: quote.change
            });
          } else {
            // Fallback with placeholder data
            stocksWithRealPrices.push({
              symbol: stock.symbol,
              name: stock.name,
              price: 0,
              change: 0
            });
          }
        } catch (error) {
          console.error(`Error fetching ${stock.symbol}:`, error);
          // Fallback with placeholder data
          stocksWithRealPrices.push({
            symbol: stock.symbol,
            name: stock.name,
            price: 0,
            change: 0
          });
        }
      }
      
      setStocksWithPrices(stocksWithRealPrices);
      setLoading(false);
    };

    fetchAllStockPrices();
  }, []);

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
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading real prices...</div>
              ) : filteredStocks.length === 0 ? (
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
                          {stock.price > 0 ? `$${stock.price.toFixed(2)}` : 'Loading...'}
                        </span>
                        {stock.price > 0 && (
                          <span className={`text-xs ${stock.change >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                          </span>
                        )}
                      </div>
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