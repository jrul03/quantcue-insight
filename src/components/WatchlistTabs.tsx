import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface WatchlistAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
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
  const [watchlistData, setWatchlistData] = useState<{[key: string]: WatchlistAsset[]}>({});
  const [isLiveMode, setIsLiveMode] = useState(true);

  // Initialize watchlist data
  useEffect(() => {
    const generatePrice = (base: number, volatility: number = 0.02) => {
      return base + (Math.random() - 0.5) * 2 * base * volatility;
    };

    const generateChange = (price: number) => {
      const change = (Math.random() - 0.5) * price * 0.05;
      return {
        change,
        changePercent: (change / (price - change)) * 100
      };
    };

    const baseData = {
      stocks: [
        { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 175.50 },
        { symbol: 'MSFT', name: 'Microsoft Corp.', basePrice: 378.85 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 138.45 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 145.30 },
        { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 248.75 },
        { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 875.25 },
        { symbol: 'META', name: 'Meta Platforms', basePrice: 485.60 },
        { symbol: 'NFLX', name: 'Netflix Inc.', basePrice: 445.80 },
        { symbol: 'AMD', name: 'Advanced Micro Devices', basePrice: 142.25 },
        { symbol: 'CRM', name: 'Salesforce Inc.', basePrice: 285.40 }
      ],
      commodities: [
        { symbol: 'GC=F', name: 'Gold Futures', basePrice: 2045.80 },
        { symbol: 'SI=F', name: 'Silver Futures', basePrice: 24.35 },
        { symbol: 'CL=F', name: 'Crude Oil', basePrice: 78.45 },
        { symbol: 'NG=F', name: 'Natural Gas', basePrice: 2.85 },
        { symbol: 'HG=F', name: 'Copper Futures', basePrice: 3.78 },
        { symbol: 'PL=F', name: 'Platinum Futures', basePrice: 925.50 },
        { symbol: 'PA=F', name: 'Palladium Futures', basePrice: 1285.75 },
        { symbol: 'ZC=F', name: 'Corn Futures', basePrice: 485.25 },
        { symbol: 'ZS=F', name: 'Soybean Futures', basePrice: 1285.50 },
        { symbol: 'ZW=F', name: 'Wheat Futures', basePrice: 625.75 }
      ],
      crypto: [
        { symbol: 'BTC-USD', name: 'Bitcoin', basePrice: 43250.80 },
        { symbol: 'ETH-USD', name: 'Ethereum', basePrice: 2385.45 },
        { symbol: 'BNB-USD', name: 'BNB', basePrice: 315.25 },
        { symbol: 'SOL-USD', name: 'Solana', basePrice: 98.75 },
        { symbol: 'XRP-USD', name: 'XRP', basePrice: 0.625 },
        { symbol: 'ADA-USD', name: 'Cardano', basePrice: 0.485 },
        { symbol: 'AVAX-USD', name: 'Avalanche', basePrice: 37.85 },
        { symbol: 'DOT-USD', name: 'Polkadot', basePrice: 6.45 },
        { symbol: 'MATIC-USD', name: 'Polygon', basePrice: 0.78 },
        { symbol: 'LINK-USD', name: 'Chainlink', basePrice: 14.85 }
      ],
      memecoins: [
        { symbol: 'DOGE-USD', name: 'Dogecoin', basePrice: 0.0823 },
        { symbol: 'SHIB-USD', name: 'Shiba Inu', basePrice: 0.0000095 },
        { symbol: 'PEPE-USD', name: 'Pepe', basePrice: 0.00000125 },
        { symbol: 'BONK-USD', name: 'Bonk', basePrice: 0.0000145 },
        { symbol: 'FLOKI-USD', name: 'Floki Inu', basePrice: 0.0000285 },
        { symbol: 'WIF-USD', name: 'dogwifhat', basePrice: 2.45 },
        { symbol: 'BOME-USD', name: 'Book of Meme', basePrice: 0.0125 },
        { symbol: 'MYRO-USD', name: 'Myro', basePrice: 0.185 }
      ],
      forex: [
        { symbol: 'EURUSD=X', name: 'EUR/USD', basePrice: 1.0875 },
        { symbol: 'GBPUSD=X', name: 'GBP/USD', basePrice: 1.2725 },
        { symbol: 'USDJPY=X', name: 'USD/JPY', basePrice: 149.85 },
        { symbol: 'USDCHF=X', name: 'USD/CHF', basePrice: 0.8945 },
        { symbol: 'AUDUSD=X', name: 'AUD/USD', basePrice: 0.6725 },
        { symbol: 'USDCAD=X', name: 'USD/CAD', basePrice: 1.3585 },
        { symbol: 'NZDUSD=X', name: 'NZD/USD', basePrice: 0.6125 },
        { symbol: 'EURGBP=X', name: 'EUR/GBP', basePrice: 0.8545 },
        { symbol: 'EURJPY=X', name: 'EUR/JPY', basePrice: 162.75 },
        { symbol: 'GBPJPY=X', name: 'GBP/JPY', basePrice: 190.45 }
      ],
      options: [
        { symbol: 'AAPL241220C00180000', name: 'AAPL Dec 20 $180 Call', basePrice: 8.45 },
        { symbol: 'TSLA241220P00240000', name: 'TSLA Dec 20 $240 Put', basePrice: 12.75 },
        { symbol: 'SPY241220C00480000', name: 'SPY Dec 20 $480 Call', basePrice: 15.25 },
        { symbol: 'QQQ241220P00380000', name: 'QQQ Dec 20 $380 Put', basePrice: 9.85 },
        { symbol: 'NVDA241220C00900000', name: 'NVDA Dec 20 $900 Call', basePrice: 24.50 },
        { symbol: 'MSFT241220C00400000', name: 'MSFT Dec 20 $400 Call', basePrice: 11.25 },
        { symbol: 'AMZN241220P00140000', name: 'AMZN Dec 20 $140 Put', basePrice: 6.75 },
        { symbol: 'META241220C00500000', name: 'META Dec 20 $500 Call', basePrice: 18.95 }
      ]
    };

    const generateWatchlistData = () => {
      const data: {[key: string]: WatchlistAsset[]} = {};
      
      Object.entries(baseData).forEach(([key, assets]) => {
        data[key] = assets.map(asset => {
          const price = generatePrice(asset.basePrice);
          const { change, changePercent } = generateChange(price);
          
          return {
            symbol: asset.symbol,
            name: asset.name,
            price,
            change,
            changePercent,
            volume: Math.floor(Math.random() * 10000000) + 1000000
          };
        });
      });
      
      return data;
    };

    setWatchlistData(generateWatchlistData());
  }, []);

  // Live data updates
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      setWatchlistData(prev => {
        const updated = { ...prev };
        
        Object.keys(updated).forEach(category => {
          updated[category] = updated[category].map(asset => {
            // Small random price movement
            const priceChange = (Math.random() - 0.5) * asset.price * 0.001;
            const newPrice = Math.max(0.0001, asset.price + priceChange);
            const change = priceChange;
            const changePercent = (change / asset.price) * 100;
            
            return {
              ...asset,
              price: newPrice,
              change: asset.change + change,
              changePercent: asset.changePercent + changePercent
            };
          });
        });
        
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

  const handleAssetClick = (asset: WatchlistAsset, assetClass: string) => {
    const market: Market = {
      symbol: asset.symbol,
      price: asset.price,
      change: asset.change,
      changePercent: asset.changePercent,
      volume: asset.volume,
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
  }) => (
    <button
      key={asset.symbol}
      onClick={() => handleAssetClick(asset, assetClass)}
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
            ${formatPrice(asset.price, asset.symbol)}
          </div>
          <div className={cn(
            "text-xs font-medium flex items-center gap-1",
            asset.changePercent >= 0 ? "text-green-400" : "text-red-400"
          )}>
            {asset.changePercent >= 0 ? 
              <TrendingUp className="w-3 h-3" /> : 
              <TrendingDown className="w-3 h-3" />
            }
            <span>
              {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Watchlists</h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isLiveMode ? "default" : "ghost"}
              onClick={() => setIsLiveMode(!isLiveMode)}
              className="h-6 px-2 text-xs"
            >
              {isLiveMode ? "LIVE" : "PAUSED"}
            </Button>
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