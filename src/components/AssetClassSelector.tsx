import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  TrendingUp, 
  Coins, 
  Zap, 
  Globe,
  Star,
  BarChart3
} from "lucide-react";

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities';
}

interface AssetClassSelectorProps {
  selectedMarket: Market;
  onMarketSelect: (market: Market) => void;
}

const marketData: Market[] = [
  // Stocks
  { symbol: "AAPL", price: 175.84, change: 2.45, changePercent: 1.41, volume: 45123000, assetClass: 'stocks' },
  { symbol: "GOOGL", price: 139.69, change: -1.89, changePercent: -1.33, volume: 19234000, assetClass: 'stocks' },
  { symbol: "MSFT", price: 378.85, change: 3.12, changePercent: 0.83, volume: 28934000, assetClass: 'stocks' },
  { symbol: "NVDA", price: 891.14, change: 15.67, changePercent: 1.79, volume: 38456000, assetClass: 'stocks' },
  { symbol: "TSLA", price: 248.50, change: -4.21, changePercent: -1.67, volume: 34567000, assetClass: 'stocks' },
  
  // Forex
  { symbol: "EURUSD", price: 1.0842, change: 0.0023, changePercent: 0.21, volume: 85234000, assetClass: 'forex' },
  { symbol: "GBPUSD", price: 1.2734, change: -0.0045, changePercent: -0.35, volume: 62145000, assetClass: 'forex' },
  { symbol: "USDJPY", price: 149.85, change: 0.32, changePercent: 0.21, volume: 71234000, assetClass: 'forex' },
  
  // Crypto
  { symbol: "BTCUSD", price: 43250.00, change: 1245.50, changePercent: 2.96, volume: 12456000, assetClass: 'crypto' },
  { symbol: "ETHUSD", price: 2567.80, change: -45.20, changePercent: -1.73, volume: 8234000, assetClass: 'crypto' },
  { symbol: "ADAUSD", price: 0.4523, change: 0.0123, changePercent: 2.80, volume: 5234000, assetClass: 'crypto' },
  
  // Options
  { symbol: "SPY240315C450", price: 8.50, change: 1.25, changePercent: 17.24, volume: 2345, assetClass: 'options' },
  { symbol: "AAPL240315P170", price: 3.20, change: -0.80, changePercent: -20.00, volume: 1876, assetClass: 'options' },
  
  // Commodities
  { symbol: "XAUUSD", price: 2034.50, change: 12.30, changePercent: 0.61, volume: 1234000, assetClass: 'commodities' },
  { symbol: "XTIUSD", price: 78.45, change: -1.23, changePercent: -1.54, volume: 987000, assetClass: 'commodities' },
];

export const AssetClassSelector = ({ selectedMarket, onMarketSelect }: AssetClassSelectorProps) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['AAPL', 'BTCUSD', 'EURUSD']);

  const assetClasses = [
    { id: 'all', label: 'All', icon: BarChart3, color: 'text-slate-400' },
    { id: 'stocks', label: 'Stocks', icon: TrendingUp, color: 'text-blue-400' },
    { id: 'forex', label: 'Forex', icon: Globe, color: 'text-green-400' },
    { id: 'crypto', label: 'Crypto', icon: Coins, color: 'text-orange-400' },
    { id: 'options', label: 'Options', icon: Zap, color: 'text-purple-400' },
    { id: 'commodities', label: 'Commodities', icon: BarChart3, color: 'text-yellow-400' },
  ];

  const filteredMarkets = marketData.filter(market => {
    const matchesClass = selectedClass === 'all' || market.assetClass === selectedClass;
    const matchesSearch = market.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Markets</h3>
        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
          {filteredMarkets.length} available
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search markets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-900/50 border-slate-700/50 text-slate-300"
        />
      </div>

      {/* Asset Class Filters */}
      <div className="grid grid-cols-2 gap-2">
        {assetClasses.map((assetClass) => {
          const Icon = assetClass.icon;
          return (
            <Button
              key={assetClass.id}
              size="sm"
              variant={selectedClass === assetClass.id ? "default" : "ghost"}
              onClick={() => setSelectedClass(assetClass.id)}
              className="flex items-center gap-2 justify-start text-xs h-9"
            >
              <Icon className={`w-3 h-3 ${assetClass.color}`} />
              {assetClass.label}
            </Button>
          );
        })}
      </div>

      {/* Market List */}
      <ScrollArea className="h-96">
        <div className="space-y-1">
          {filteredMarkets.map((market) => (
            <div
              key={market.symbol}
              onClick={() => onMarketSelect(market)}
              className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-slate-800/50 ${
                selectedMarket.symbol === market.symbol 
                  ? 'bg-blue-500/20 border border-blue-500/30' 
                  : 'border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm">{market.symbol}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1.5 py-0 ${
                      market.assetClass === 'stocks' ? 'border-blue-400/50 text-blue-400' :
                      market.assetClass === 'forex' ? 'border-green-400/50 text-green-400' :
                      market.assetClass === 'crypto' ? 'border-orange-400/50 text-orange-400' :
                      market.assetClass === 'options' ? 'border-purple-400/50 text-purple-400' :
                      'border-yellow-400/50 text-yellow-400'
                    }`}
                  >
                    {market.assetClass.toUpperCase()}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                    onClick={(e) => toggleFavorite(market.symbol, e)}
                  >
                    <Star 
                      className={`w-3 h-3 ${
                        favorites.includes(market.symbol) 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-slate-400'
                      }`} 
                    />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="font-mono text-sm">
                  ${market.price.toFixed(market.assetClass === 'forex' ? 4 : 2)}
                </div>
                <div className={`text-xs font-medium ${
                  market.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {market.change >= 0 ? '+' : ''}{market.changePercent.toFixed(2)}%
                </div>
              </div>

              <div className="text-xs text-slate-400 mt-1">
                Vol: {(market.volume / 1000000).toFixed(1)}M
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};