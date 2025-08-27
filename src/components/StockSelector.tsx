import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

// Popular stocks with initial mock data (will be updated with real data)
const popularStocks: Stock[] = [
  { symbol: "SPY", name: "S&P 500 ETF", price: 415.23, change: 2.45 },
  { symbol: "AAPL", name: "Apple Inc.", price: 175.84, change: -1.23 },
  { symbol: "NVDA", name: "NVIDIA Corporation", price: 891.14, change: 15.67 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: -4.21 },
  { symbol: "MSFT", name: "Microsoft Corporation", price: 378.85, change: 3.12 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 139.69, change: 1.89 },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 155.21, change: 2.34 },
  { symbol: "META", name: "Meta Platforms Inc.", price: 484.20, change: -2.10 },
  { symbol: "BTC-USD", name: "Bitcoin", price: 43250.00, change: 850.00 },
  { symbol: "ETH-USD", name: "Ethereum", price: 2420.50, change: -45.20 },
];

interface StockSelectorProps {
  selectedStock: Stock;
  onStockSelect: (stock: Stock) => void;
}

export const StockSelector = ({ selectedStock, onStockSelect }: StockSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStocks = popularStocks.filter(stock =>
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
              {filteredStocks.map((stock) => (
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
                        <span className="font-mono">${stock.price.toFixed(2)}</span>
                        <span className={`text-xs ${stock.change >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};