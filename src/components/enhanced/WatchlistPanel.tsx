import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Search,
  Star,
  Plus,
  X,
  Eye,
  Activity,
  Volume2
} from "lucide-react";

interface Market {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities';
}

interface WatchlistPanelProps {
  selectedMarket: Market;
  onMarketSelect: (market: Market) => void;
}

// Mock watchlist data
const generateMockWatchlist = (): Market[] => [
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    price: 415.84 + (Math.random() - 0.5) * 10,
    change: (Math.random() - 0.5) * 5,
    changePercent: (Math.random() - 0.5) * 2,
    volume: Math.random() * 100000000,
    assetClass: 'stocks'
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ ETF',
    price: 365.20 + (Math.random() - 0.5) * 10,
    change: (Math.random() - 0.5) * 4,
    changePercent: (Math.random() - 0.5) * 1.5,
    volume: Math.random() * 80000000,
    assetClass: 'stocks'
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 175.40 + (Math.random() - 0.5) * 8,
    change: (Math.random() - 0.5) * 3,
    changePercent: (Math.random() - 0.5) * 2,
    volume: Math.random() * 60000000,
    assetClass: 'stocks'
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 248.50 + (Math.random() - 0.5) * 20,
    change: (Math.random() - 0.5) * 8,
    changePercent: (Math.random() - 0.5) * 4,
    volume: Math.random() * 120000000,
    assetClass: 'stocks'
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 445.80 + (Math.random() - 0.5) * 25,
    change: (Math.random() - 0.5) * 12,
    changePercent: (Math.random() - 0.5) * 3,
    volume: Math.random() * 90000000,
    assetClass: 'stocks'
  },
  {
    symbol: 'BTC-USD',
    name: 'Bitcoin',
    price: 42500 + (Math.random() - 0.5) * 2000,
    change: (Math.random() - 0.5) * 1000,
    changePercent: (Math.random() - 0.5) * 5,
    volume: Math.random() * 50000000000,
    assetClass: 'crypto'
  },
  {
    symbol: 'ETH-USD',
    name: 'Ethereum',
    price: 2500 + (Math.random() - 0.5) * 200,
    change: (Math.random() - 0.5) * 100,
    changePercent: (Math.random() - 0.5) * 4,
    volume: Math.random() * 20000000000,
    assetClass: 'crypto'
  },
  {
    symbol: 'EUR/USD',
    name: 'Euro/US Dollar',
    price: 1.0850 + (Math.random() - 0.5) * 0.02,
    change: (Math.random() - 0.5) * 0.01,
    changePercent: (Math.random() - 0.5) * 0.5,
    volume: Math.random() * 1000000000,
    assetClass: 'forex'
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound/US Dollar',
    price: 1.2650 + (Math.random() - 0.5) * 0.02,
    change: (Math.random() - 0.5) * 0.01,
    changePercent: (Math.random() - 0.5) * 0.4,
    volume: Math.random() * 800000000,
    assetClass: 'forex'
  },
  {
    symbol: 'GLD',
    name: 'SPDR Gold Trust',
    price: 195.50 + (Math.random() - 0.5) * 5,
    change: (Math.random() - 0.5) * 2,
    changePercent: (Math.random() - 0.5) * 1,
    volume: Math.random() * 15000000,
    assetClass: 'commodities'
  }
];

export const WatchlistPanel = ({ selectedMarket, onMarketSelect }: WatchlistPanelProps) => {
  const [watchlist, setWatchlist] = useState<Market[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredList, setFilteredList] = useState<Market[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // Initialize watchlist
  useEffect(() => {
    const mockList = generateMockWatchlist();
    setWatchlist(mockList);
    setFilteredList(mockList);
  }, []);

  // Update prices periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setWatchlist(prev => prev.map(market => ({
        ...market,
        price: Math.max(0.01, market.price + (Math.random() - 0.5) * (market.price * 0.002)),
        change: market.change + (Math.random() - 0.5) * 0.5,
        changePercent: market.changePercent + (Math.random() - 0.5) * 0.1
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Filter watchlist based on search and tab
  useEffect(() => {
    let filtered = watchlist;

    // Filter by asset class
    if (activeTab !== 'all') {
      filtered = filtered.filter(market => market.assetClass === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(market => 
        market.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredList(filtered);
  }, [watchlist, searchQuery, activeTab]);

  const formatPrice = (market: Market) => {
    if (market.assetClass === 'forex') {
      return market.price.toFixed(4);
    } else if (market.assetClass === 'crypto' && market.price > 1000) {
      return market.price.toFixed(0);
    } else if (market.assetClass === 'crypto') {
      return market.price.toFixed(2);
    } else {
      return market.price.toFixed(2);
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  const getAssetClassIcon = (assetClass: string) => {
    switch (assetClass) {
      case 'stocks': return '📈';
      case 'crypto': return '₿';
      case 'forex': return '💱';
      case 'commodities': return '🏅';
      case 'options': return '📊';
      default: return '📈';
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(market => market.symbol !== symbol));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Watchlist</h2>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbols..."
            className="pl-10 h-9 text-sm"
          />
        </div>
      </div>

      {/* Asset Class Tabs */}
      <div className="px-4 pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="stocks" className="text-xs">Stocks</TabsTrigger>
            <TabsTrigger value="crypto" className="text-xs">Crypto</TabsTrigger>
            <TabsTrigger value="forex" className="text-xs">Forex</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Watchlist Items */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4 pt-2">
          <div className="space-y-2">
            {filteredList.map((market) => (
              <Card
                key={market.symbol}
                className={`p-3 cursor-pointer transition-all hover:bg-accent ${
                  selectedMarket.symbol === market.symbol ? 'bg-accent border-primary' : ''
                }`}
                onClick={() => onMarketSelect(market)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm">{getAssetClassIcon(market.assetClass)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono text-sm">{market.symbol}</span>
                        {selectedMarket.symbol === market.symbol && (
                          <Eye className="w-3 h-3 text-primary" />
                        )}
                      </div>
                      {market.name && (
                        <div className="text-xs text-muted-foreground truncate">
                          {market.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-sm font-medium">
                      ${formatPrice(market)}
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${
                      market.changePercent >= 0 ? 'text-bullish' : 'text-bearish'
                    }`}>
                      {market.changePercent >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{market.changePercent >= 0 ? '+' : ''}{market.changePercent.toFixed(2)}%</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(market.symbol);
                    }}
                    className="h-6 w-6 p-0 ml-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/20"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Volume2 className="w-3 h-3" />
                    <span>{formatVolume(market.volume)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs h-4">
                      {market.assetClass.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}

            {filteredList.length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No symbols found' : 'No items in watchlist'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="grid grid-cols-3 gap-4 text-xs text-center">
          <div>
            <div className="font-medium text-bullish">
              {filteredList.filter(m => m.changePercent >= 0).length}
            </div>
            <div className="text-muted-foreground">Up</div>
          </div>
          <div>
            <div className="font-medium text-bearish">
              {filteredList.filter(m => m.changePercent < 0).length}
            </div>
            <div className="text-muted-foreground">Down</div>
          </div>
          <div>
            <div className="font-medium">
              {filteredList.length}
            </div>
            <div className="text-muted-foreground">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
};