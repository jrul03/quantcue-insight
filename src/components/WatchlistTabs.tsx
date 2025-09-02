import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Bitcoin, 
  Smile, 
  Wheat, 
  DollarSign, 
  Target 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLivePrice } from "@/hooks/useLivePrice";

interface WatchlistAsset {
  symbol: string;
  name: string;
}

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities' | 'memecoins';
}

interface WatchlistTabsProps {
  selectedMarket: Market;
  onMarketSelect: (market: Market) => void;
}

export const WatchlistTabs = ({ selectedMarket, onMarketSelect }: WatchlistTabsProps) => {
  const [hoveredSymbol, setHoveredSymbol] = useState<string>("");

  // Static watchlist data - prices fetched via API
  const watchlistData = {
    stocks: [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corp.' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.' },
      { symbol: 'META', name: 'Meta Platforms' },
      { symbol: 'NFLX', name: 'Netflix Inc.' },
      { symbol: 'AMD', name: 'Advanced Micro Devices' },
      { symbol: 'CRM', name: 'Salesforce Inc.' }
    ],
    commodities: [
      { symbol: 'GC=F', name: 'Gold Futures' },
      { symbol: 'SI=F', name: 'Silver Futures' },
      { symbol: 'CL=F', name: 'Crude Oil' },
      { symbol: 'NG=F', name: 'Natural Gas' },
      { symbol: 'HG=F', name: 'Copper Futures' },
      { symbol: 'PL=F', name: 'Platinum Futures' }
    ],
    crypto: [
      { symbol: 'BTC', name: 'Bitcoin' },
      { symbol: 'ETH', name: 'Ethereum' },
      { symbol: 'BNB', name: 'BNB' },
      { symbol: 'SOL', name: 'Solana' },
      { symbol: 'XRP', name: 'XRP' },
      { symbol: 'ADA', name: 'Cardano' }
    ],
    memecoins: [
      { symbol: 'DOGE', name: 'Dogecoin' },
      { symbol: 'SHIB', name: 'Shiba Inu' },
      { symbol: 'PEPE', name: 'Pepe' },
      { symbol: 'BONK', name: 'Bonk' },
      { symbol: 'FLOKI', name: 'Floki Inu' },
      { symbol: 'WIF', name: 'dogwifhat' }
    ],
    forex: [
      { symbol: 'EURUSD', name: 'EUR/USD' },
      { symbol: 'GBPUSD', name: 'GBP/USD' },
      { symbol: 'USDJPY', name: 'USD/JPY' },
      { symbol: 'USDCHF', name: 'USD/CHF' },
      { symbol: 'AUDUSD', name: 'AUD/USD' },
      { symbol: 'USDCAD', name: 'USD/CAD' }
    ],
    options: [
      { symbol: 'SPY', name: 'SPY Options' },
      { symbol: 'QQQ', name: 'QQQ Options' },
      { symbol: 'IWM', name: 'IWM Options' }
    ]
  };

  const handleAssetClick = (asset: WatchlistAsset, assetClass: string, price: number, change: number) => {
    const market: Market = {
      symbol: asset.symbol,
      price: price || 0,
      change: change || 0,
      changePercent: change && price ? (change / (price - change)) * 100 : 0,
      volume: 0,
      assetClass: assetClass as Market['assetClass']
    };
    
    onMarketSelect(market);
  };

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes('USD') && price < 1) {
      return price.toFixed(8);
    } else if (price < 1) {
      return price.toFixed(4);
    } else if (price < 100) {
      return price.toFixed(2);
    } else {
      return price.toFixed(2);
    }
  };

  const AssetRow = ({ asset, assetClass, isSelected }: { 
    asset: WatchlistAsset; 
    assetClass: string;
    isSelected: boolean;
  }) => {
    // Only fetch prices for selected or hovered rows to avoid rate limiting
    const isActive = isSelected || hoveredSymbol === asset.symbol;
    const { price, change, changePct } = useLivePrice(asset.symbol, isActive);

    const handleClick = () => {
      handleAssetClick(asset, assetClass, price || 0, change || 0);
    };

    return (
      <button
        key={asset.symbol}
        onClick={handleClick}
        onMouseEnter={() => setHoveredSymbol(asset.symbol)}
        onMouseLeave={() => setHoveredSymbol("")}
        className={cn(
          "w-full p-3 hover:bg-slate-800/50 transition-all duration-150 border-l-2 text-left group",
          isSelected 
            ? "bg-blue-500/10 border-l-blue-500 shadow-lg shadow-blue-500/5" 
            : "border-l-transparent hover:border-l-slate-600"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-white group-hover:text-blue-300 transition-colors">
                {asset.symbol.replace('-USD', '').replace('=X', '').replace('=F', '')}
              </span>
              {isSelected && (
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              )}
            </div>
            <div className="text-xs text-slate-400 truncate">{asset.name}</div>
          </div>
          
          <div className="text-right">
            <div className="font-mono text-sm font-medium">
              {price ? `$${formatPrice(price, asset.symbol)}` : '--'}
            </div>
            {changePct !== null && (
              <div className={cn(
                "text-xs font-medium flex items-center gap-1",
                changePct >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {changePct >= 0 ? 
                  <TrendingUp className="w-3 h-3" /> : 
                  <TrendingDown className="w-3 h-3" />
                }
                <span>
                  {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Watchlists</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">LIVE</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stocks" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 grid-rows-2 gap-1 bg-slate-800/30 p-1 mx-4 mt-2">
          <TabsTrigger value="stocks" className="text-xs flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Stocks
          </TabsTrigger>
          <TabsTrigger value="crypto" className="text-xs flex items-center gap-1">
            <Bitcoin className="w-3 h-3" />
            Crypto
          </TabsTrigger>
          <TabsTrigger value="memecoins" className="text-xs flex items-center gap-1">
            <Smile className="w-3 h-3" />
            Meme
          </TabsTrigger>
          <TabsTrigger value="commodities" className="text-xs flex items-center gap-1">
            <Wheat className="w-3 h-3" />
            Commodities
          </TabsTrigger>
          <TabsTrigger value="forex" className="text-xs flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            FX
          </TabsTrigger>
          <TabsTrigger value="options" className="text-xs flex items-center gap-1">
            <Target className="w-3 h-3" />
            Options
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-hidden">
          {Object.entries(watchlistData).map(([category, assets]) => (
            <TabsContent 
              key={category} 
              value={category} 
              className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-slate-700/30">
                  {assets.map((asset) => (
                    <AssetRow 
                      key={asset.symbol}
                      asset={asset}
                      assetClass={category}
                      isSelected={selectedMarket.symbol === asset.symbol}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};