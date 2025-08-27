import { useState } from "react";
import { ChevronDown, Search, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLastPrice } from "@/hooks/useLastPrice";
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

interface StockRowProps {
  symbol: string;
  name: string;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (stock: Stock) => void;
  onHover: (hovered: boolean) => void;
}

const StockRow = ({ symbol, name, isSelected, isHovered, onSelect, onHover }: StockRowProps) => {
  const { price, lastUpdated } = useLastPrice(symbol, isSelected || isHovered);
  
  const handleSelect = () => {
    onSelect({
      symbol,
      name,
      price: price || 0,
      change: 0 // Change calculation would need previous price
    });
  };

  return (
    <button
      onClick={handleSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50 ${
        isSelected ? 'bg-primary/10 border border-primary' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">{symbol}</span>
            <span className="text-xs text-muted-foreground">{name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono">
              {price ? `$${price.toFixed(2)}` : '--'}
            </span>
            {lastUpdated && (
              <span className="text-xs text-slate-500">
                {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

interface StockSelectorProps {
  selectedStock: Stock;
  onStockSelect: (stock: Stock) => void;
}

export const StockSelector = ({ selectedStock, onStockSelect }: StockSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredSymbol, setHoveredSymbol] = useState<string>("");

  const filteredStocks = stockSymbols.filter(stock =>
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
                  <StockRow
                    key={stock.symbol}
                    symbol={stock.symbol}
                    name={stock.name}
                    isSelected={selectedStock.symbol === stock.symbol}
                    isHovered={hoveredSymbol === stock.symbol}
                    onSelect={handleStockSelect}
                    onHover={(hovered) => setHoveredSymbol(hovered ? stock.symbol : "")}
                  />
                ))
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};