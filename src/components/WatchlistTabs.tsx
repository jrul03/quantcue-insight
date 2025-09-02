import { useState, useEffect } from "react";
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
import { useMemePrices } from "@/hooks/useMemePrices";
import { isCrypto, detectAssetClass } from "@/lib/assets";

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
      { symbol: 'WIF', name: 'dogwifhat' },
      { symbol: 'BOME', name: 'Book of Meme' },
      { symbol: 'POPCAT', name: 'Popcat' },
      { symbol: 'MEW', name: 'Cat in a dogs world' },
      { symbol: 'GOAT', name: 'Goatseus Maximus' },
      { symbol: 'PNUT', name: 'Peanut the Squirrel' },
      { symbol: 'ACT', name: 'Act I: The AI Prophecy' },
      { symbol: 'FWOG', name: 'Fwog' },
      { symbol: 'SLERF', name: 'Slerf' },
      { symbol: 'MOODENG', name: 'Moo Deng' },
      { symbol: 'CHILLGUY', name: 'Just a chill guy' },
      { symbol: 'MICHI', name: 'Michi' },
      { symbol: 'PONKE', name: 'Ponke' },
      { symbol: 'RETARDIO', name: 'Retardio' },
      { symbol: 'MANEKI', name: 'Maneki' }
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

  // Collect meme coin symbols for batch fetching
  const memeSymbols = watchlistData.memecoins.map(coin => coin.symbol);
  const isWatchlistActive = true; // Always consider watchlist as active
  
  // Batch fetch meme coin prices
  const { data: memePrices } = useMemePrices(memeSymbols, isWatchlistActive);

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
    // Determine if this is a meme coin or crypto
    const isMeme = assetClass === 'memecoins';
    const isCryptoAsset = assetClass === 'crypto' || isMeme;
    const isActive = isSelected || hoveredSymbol === asset.symbol;
    
    // Use appropriate pricing hook based on asset type
    const livePrice = useLivePrice(asset.symbol, isActive);
    const memeData = isMeme ? memePrices[asset.symbol] : null;
    
    // Get price and change data based on asset type
    const price = isMeme ? (memeData?.price || livePrice.price) : livePrice.price;
    const change = livePrice.change;
    const changePct = livePrice.changePct;
    const source = memeData?.source || livePrice.source || 'polygon';
    const lastUpdated = isMeme ? memeData?.ts : livePrice.lastUpdated;
    const isStale = livePrice.isStale || (lastUpdated ? Date.now() - lastUpdated > 30000 : false);

    // Smooth price transitions to prevent twitching
    const [displayPrice, setDisplayPrice] = useState(price);
    const [displayChangePct, setDisplayChangePct] = useState(changePct);

    useEffect(() => {
      const timer = setTimeout(() => {
        setDisplayPrice(price);
        setDisplayChangePct(changePct);
      }, 50);
      return () => clearTimeout(timer);
    }, [price, changePct]);

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
          "w-full p-3 hover:bg-slate-800/50 transition-all duration-200 border-l-2 text-left group relative",
          isSelected 
            ? "bg-blue-500/10 border-l-blue-500 shadow-lg shadow-blue-500/5" 
            : "border-l-transparent hover:border-l-slate-600"
        )}
      >
        <div className="flex items-center justify-between">
          {/* Left side - Symbol and name */}
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-semibold text-white group-hover:text-blue-300 transition-colors text-sm">
                {asset.symbol.replace('-USD', '').replace('=X', '').replace('=F', '')}
              </span>
              {isSelected && (
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
              )}
            </div>
            <div className="text-xs text-slate-500 truncate leading-tight">{asset.name}</div>
            
            {/* Source badge on hover - moved under name */}
            {source && hoveredSymbol === asset.symbol && (
              <div className={cn(
                "mt-1 inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded transition-opacity duration-200 items-center gap-1",
                source === 'jupiter' 
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                  : source === 'coingecko'
                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              )}>
                <span>{source === 'jupiter' ? 'JUP' : source === 'coingecko' ? 'CG' : 'POLY'}</span>
                {lastUpdated && (
                  <span className="opacity-70">
                    {Math.floor((Date.now() - lastUpdated) / 1000)}s
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Right side - Price and change */}
          <div className="text-right flex-shrink-0">
            <div className={cn(
              "font-mono text-sm font-bold transition-all duration-300 mb-1",
              displayPrice ? (isStale ? "opacity-70" : "opacity-100") : "opacity-60"
            )}>
              {displayPrice ? `$${formatPrice(displayPrice, asset.symbol)}` : '--'}
            </div>
            {displayChangePct !== null && (
              <div className={cn(
                "text-xs font-medium flex items-center justify-end gap-1 transition-all duration-300",
                displayChangePct >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {displayChangePct >= 0 ? 
                  <TrendingUp className="w-2.5 h-2.5" /> : 
                  <TrendingDown className="w-2.5 h-2.5" />
                }
                <span className="text-xs opacity-90">
                  {displayChangePct >= 0 ? '+' : ''}{displayChangePct.toFixed(2)}%
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