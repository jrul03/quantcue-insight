import { useState } from "react";
import { TradingChart } from "@/components/TradingChart";
import { SignalsFeed } from "@/components/SignalsFeed";
import { NewsStrip } from "@/components/NewsStrip";
import { HUDAgent } from "@/components/HUDAgent";
import { Backtester } from "@/components/Backtester";
import { IndicatorPanel } from "@/components/IndicatorPanel";
import { AITradingAssistant } from "@/components/AITradingAssistant";
import { StockSearchSelector, Stock } from "@/components/StockSearchSelector";
import { TechnicalIndicators, IndicatorConfig } from "@/components/TechnicalIndicators";
import { QuantHUD } from "@/components/QuantHUD";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

const Index = () => {
  const [selectedStock, setSelectedStock] = useState<Stock>({
    symbol: "SPY",
    name: "SPDR S&P 500 ETF",
    price: 415.23,
    change: 2.45,
    changePercent: 0.59,
    volume: 85234000,
    marketCap: "445B",
    sector: "Diversified",
    type: "etf"
  });
  
  const [currentPrice, setCurrentPrice] = useState(selectedStock.price);
  const [currentChange, setCurrentChange] = useState(selectedStock.change);
  const [favorites, setFavorites] = useState<string[]>(['SPY', 'AAPL', 'NVDA']);
  const [quantHUDVisible, setQuantHUDVisible] = useState(true);
  
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    {
      id: 'ema20',
      name: 'EMA 20',
      enabled: true,
      color: 'hsl(var(--ema-fast))',
      value: 412.34,
      signal: 'bullish',
      description: 'Exponential Moving Average (20 periods)',
      parameters: { period: 20 }
    },
    {
      id: 'ema50',
      name: 'EMA 50',
      enabled: true,
      color: 'hsl(var(--ema-slow))',
      value: 408.67,
      signal: 'neutral',
      description: 'Exponential Moving Average (50 periods)',
      parameters: { period: 50 }
    },
    {
      id: 'rsi',
      name: 'RSI',
      enabled: true,
      color: 'hsl(var(--indicator-rsi))',
      value: 67.5,
      signal: 'neutral',
      description: 'Relative Strength Index (14 periods)',
      parameters: { period: 14, overbought: 70, oversold: 30 }
    },
    {
      id: 'bb',
      name: 'Bollinger Bands',
      enabled: true,
      color: 'hsl(var(--neon-cyan))',
      signal: 'neutral',
      description: 'Bollinger Bands (20, 2)',
      parameters: { period: 20, stdDev: 2 }
    }
  ]);

  const handlePriceUpdate = (price: number, change: number) => {
    setCurrentPrice(price);
    setCurrentChange(change);
  };

  const handleToggleFavorite = (symbol: string) => {
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleToggleIndicator = (id: string) => {
    setIndicators(prev => 
      prev.map(indicator => 
        indicator.id === id 
          ? { ...indicator, enabled: !indicator.enabled }
          : indicator
      )
    );
  };

  const handleUpdateIndicator = (id: string, parameters: { [key: string]: number }) => {
    setIndicators(prev => 
      prev.map(indicator => 
        indicator.id === id 
          ? { ...indicator, parameters: { ...indicator.parameters, ...parameters } }
          : indicator
      )
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold">Q</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              QuantCue
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-neon-green rounded-full status-online"></div>
              <span className="text-muted-foreground">Live Data</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedStock.symbol}: <span className={`font-mono ${currentChange >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                ${currentPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <StockSearchSelector 
            selectedStock={selectedStock} 
            onStockSelect={setSelectedStock}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantHUDVisible(!quantHUDVisible)}
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            QuantHUD
          </Button>
          <div className="text-xs text-muted-foreground">
            Market Open • 09:30 EST
          </div>
        </div>
      </header>

      {/* News Strip */}
      <NewsStrip />

      {/* Main Trading Interface */}
      <div className="flex h-[calc(100vh-112px)]">
        {/* Left Sidebar - Indicators & Controls */}
        <div className="w-80 border-r border-border bg-card/30 backdrop-blur-sm p-4 space-y-4 overflow-y-auto">
          <TechnicalIndicators 
            indicators={indicators}
            onToggleIndicator={handleToggleIndicator}
            onUpdateIndicator={handleUpdateIndicator}
          />
          <Backtester />
        </div>

        {/* Center - Chart Area */}
        <div className="flex-1 flex flex-col">
          <TradingChart 
            selectedStock={selectedStock} 
            onPriceUpdate={handlePriceUpdate}
            activeIndicators={indicators}
          />
        </div>

        {/* Right Sidebar - Signals & Analysis */}
        <div className="w-96 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
          <div className="h-1/2 border-b border-border">
            <SignalsFeed />
          </div>
          <div className="h-1/2">
            <AITradingAssistant />
          </div>
        </div>
      </div>

      {/* Floating HUD Agent */}
      <HUDAgent />
      
      {/* Quantitative Analysis HUD */}
      <QuantHUD 
        selectedStock={selectedStock}
        isVisible={quantHUDVisible}
        onToggleVisibility={() => setQuantHUDVisible(!quantHUDVisible)}
      />
    </div>
  );
};

export default Index;