import { useState, useEffect, useRef } from "react";
import { Search, Star, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: string;
  sector?: string;
  type: 'stock' | 'etf' | 'index';
}

const stockDatabase: Stock[] = [
  // Popular Stocks
  { symbol: "AAPL", name: "Apple Inc.", price: 175.84, change: -1.23, changePercent: -0.69, volume: 45123000, marketCap: "2.8T", sector: "Technology", type: "stock" },
  { symbol: "NVDA", name: "NVIDIA Corporation", price: 891.14, change: 15.67, changePercent: 1.79, volume: 38456000, marketCap: "2.2T", sector: "Technology", type: "stock" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.50, change: -4.21, changePercent: -1.67, volume: 34567000, marketCap: "792B", sector: "Consumer Discretionary", type: "stock" },
  { symbol: "MSFT", name: "Microsoft Corporation", price: 378.85, change: 3.12, changePercent: 0.83, volume: 28934000, marketCap: "2.8T", sector: "Technology", type: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 139.69, change: 1.89, changePercent: 1.37, volume: 19234000, marketCap: "1.7T", sector: "Communication Services", type: "stock" },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 155.21, change: 2.34, changePercent: 1.53, volume: 25678000, marketCap: "1.6T", sector: "Consumer Discretionary", type: "stock" },
  { symbol: "META", name: "Meta Platforms Inc.", price: 484.20, change: -2.10, changePercent: -0.43, volume: 15432000, marketCap: "1.2T", sector: "Communication Services", type: "stock" },
  
  // ETFs
  { symbol: "SPY", name: "SPDR S&P 500 ETF", price: 415.23, change: 2.45, changePercent: 0.59, volume: 85234000, marketCap: "445B", sector: "Diversified", type: "etf" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", price: 367.89, change: 4.21, changePercent: 1.16, volume: 42567000, marketCap: "195B", sector: "Technology", type: "etf" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", price: 198.45, change: -0.87, changePercent: -0.44, volume: 23456000, marketCap: "28B", sector: "Small Cap", type: "etf" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", price: 245.67, change: 1.89, changePercent: 0.78, volume: 18765000, marketCap: "295B", sector: "Diversified", type: "etf" },
  
  // Indices
  { symbol: "^GSPC", name: "S&P 500 Index", price: 4178.45, change: 25.67, changePercent: 0.62, volume: 0, type: "index" },
  { symbol: "^IXIC", name: "NASDAQ Composite", price: 12987.33, change: 89.21, changePercent: 0.69, volume: 0, type: "index" },
  { symbol: "^DJI", name: "Dow Jones Industrial Average", price: 33456.78, change: -45.32, changePercent: -0.14, volume: 0, type: "index" },
  
  // Additional Popular Stocks
  { symbol: "AMD", name: "Advanced Micro Devices", price: 112.34, change: 2.87, changePercent: 2.62, volume: 31245000, marketCap: "181B", sector: "Technology", type: "stock" },
  { symbol: "NFLX", name: "Netflix Inc.", price: 445.67, change: -8.21, changePercent: -1.81, volume: 12345000, marketCap: "198B", sector: "Communication Services", type: "stock" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", price: 145.89, change: 1.45, changePercent: 1.00, volume: 18765000, marketCap: "429B", sector: "Financial Services", type: "stock" },
  { symbol: "V", name: "Visa Inc.", price: 234.56, change: 3.21, changePercent: 1.39, volume: 8765000, marketCap: "509B", sector: "Financial Services", type: "stock" },
];

interface StockSearchSelectorProps {
  selectedStock: Stock;
  onStockSelect: (stock: Stock) => void;
  favorites: string[];
  onToggleFavorite: (symbol: string) => void;
}

export const StockSearchSelector = ({ 
  selectedStock, 
  onStockSelect, 
  favorites, 
  onToggleFavorite 
}: StockSearchSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'stocks' | 'etfs' | 'indices' | 'favorites'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredStocks = stockDatabase.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'stocks' && stock.type === 'stock') ||
                      (activeTab === 'etfs' && stock.type === 'etf') ||
                      (activeTab === 'indices' && stock.type === 'index') ||
                      (activeTab === 'favorites' && favorites.includes(stock.symbol));
    
    return matchesSearch && matchesTab;
  });

  const handleStockSelect = (stock: Stock) => {
    onStockSelect(stock);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Global search focus handler
  useEffect(() => {
    const openAndFocus = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    };
    const handler = () => openAndFocus();
    window.addEventListener('app:focus-search' as any, handler as any);
    return () => window.removeEventListener('app:focus-search' as any, handler as any);
  }, []);

  const getTypeIcon = (type: Stock['type']) => {
    switch (type) {
      case 'stock': return <TrendingUp className="w-3 h-3" />;
      case 'etf': return <BarChart3 className="w-3 h-3" />;
      case 'index': return <BarChart3 className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: Stock['type']) => {
    switch (type) {
      case 'stock': return 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30';
      case 'etf': return 'bg-neon-purple/20 text-neon-purple border-neon-purple/30';
      case 'index': return 'bg-neon-green/20 text-neon-green border-neon-green/30';
    }
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 min-w-[280px] justify-between bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getTypeIcon(selectedStock.type)}
            <span className="font-mono font-bold text-lg">{selectedStock.symbol}</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground truncate max-w-32">
              {selectedStock.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono">${selectedStock.price.toFixed(2)}</span>
              <span className={`text-xs ${selectedStock.change >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                {selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        <Search className="w-4 h-4 text-muted-foreground" />
      </Button>

      {isOpen && (
        <Card className="absolute top-full left-0 mt-2 w-96 z-50 p-0 bg-card/95 backdrop-blur-sm border border-border/50 shadow-2xl">
          <div className="p-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search stocks, ETFs, indices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
              {[
                { key: 'all', label: 'All' },
                { key: 'stocks', label: 'Stocks' },
                { key: 'etfs', label: 'ETFs' },
                { key: 'indices', label: 'Indices' },
                { key: 'favorites', label: 'Favorites' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === tab.key 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <ScrollArea className="h-80">
              <div className="space-y-1">
                {filteredStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer group hover:bg-muted/50 ${
                      selectedStock.symbol === stock.symbol ? 'bg-primary/10 border border-primary/30' : ''
                    }`}
                    onClick={() => handleStockSelect(stock)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(stock.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{stock.symbol}</span>
                            <Badge variant="outline" className={`text-xs px-1.5 py-0 ${getTypeColor(stock.type)}`}>
                              {stock.type.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-48">
                            {stock.name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">${stock.price.toFixed(2)}</span>
                          <span className={`text-xs font-medium ${stock.change >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                        {stock.marketCap && (
                          <span className="text-xs text-muted-foreground">
                            {stock.marketCap}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(stock.symbol);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                    >
                      <Star 
                        className={`w-4 h-4 ${
                          favorites.includes(stock.symbol) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-muted-foreground'
                        }`} 
                      />
                    </Button>
                  </div>
                ))}
                
                {filteredStocks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No results found</p>
                    <p className="text-xs">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </Card>
      )}
    </div>
  );
};
