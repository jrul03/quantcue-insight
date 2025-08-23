import { useState, useEffect, useRef, useCallback } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  BarChart3, 
  Search,
  Settings,
  Maximize2,
  Minimize2,
  Eye,
  Target,
  Brain,
  Activity,
  Clock,
  Wifi,
  WifiOff,
  Play,
  Pause
} from "lucide-react";
import { AdvancedChart } from "../AdvancedChart";
import { EnhancedDrawingToolbar } from "./EnhancedDrawingToolbar";
import { AITradingDock } from "./AITradingDock";
import { SignalsToaster } from "./SignalsToaster";
import { InsightsPanel } from "./InsightsPanel";
import { WatchlistPanel } from "./WatchlistPanel";

interface Market {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities';
}

interface MarketData {
  sentiment: number;
  volatility: number;
  momentum: number;
  volume: number;
}

interface LayoutConfig {
  showWatchlist: boolean;
  showInsights: boolean;
  chartMaximized: boolean;
  savedLayouts: Record<string, any>;
}

const TIMEFRAMES = ['1s', '5s', '1m', '5m', '15m', '1H', '4H', '1D', '1W'];
const INDICATORS = ['EMA20', 'EMA50', 'EMA200', 'Bands', 'VWAP', 'Volume'];

export const EnhancedTradingPlatform = () => {
  // Core state
  const [selectedMarket, setSelectedMarket] = useState<Market>({
    symbol: "SPY",
    price: 415.84,
    change: 2.45,
    changePercent: 1.41,
    volume: 45123000,
    assetClass: 'stocks'
  });

  const [marketData, setMarketData] = useState<MarketData>({
    sentiment: 0.75,
    volatility: 0.45,
    momentum: 0.82,
    volume: 1.23
  });

  // UI state
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const [activeDrawingTool, setActiveDrawingTool] = useState<string>('select');
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['EMA20', 'Volume']);
  const [autoScale, setAutoScale] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'Connected' | 'Reconnecting' | 'Offline'>('Connected');
  
  // Layout state
  const [layout, setLayout] = useState<LayoutConfig>({
    showWatchlist: true,
    showInsights: true,
    chartMaximized: false,
    savedLayouts: {}
  });

  // Performance monitoring
  const [fps, setFps] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const fpsRef = useRef(0);
  const lastFrameTime = useRef(performance.now());
  const devMode = new URLSearchParams(window.location.search).get('dev') === '1';

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Market[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Mock search functionality
  const mockSymbols = [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', assetClass: 'stocks' as const },
    { symbol: 'QQQ', name: 'Invesco QQQ ETF', assetClass: 'stocks' as const },
    { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stocks' as const },
    { symbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'stocks' as const },
    { symbol: 'BTC-USD', name: 'Bitcoin', assetClass: 'crypto' as const },
    { symbol: 'EUR/USD', name: 'Euro/Dollar', assetClass: 'forex' as const },
  ];

  // Performance monitoring
  const updatePerformanceMetrics = useCallback(() => {
    const now = performance.now();
    const delta = now - lastFrameTime.current;
    
    if (delta > 0) {
      fpsRef.current = 1000 / delta;
      setFps(Math.round(fpsRef.current));
    }
    
    lastFrameTime.current = now;

    // Mock CPU usage calculation
    setCpuUsage(Math.random() * 30); 
  }, []);

  // Real-time market data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedMarket(prev => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 0.5,
        change: prev.change + (Math.random() - 0.5) * 0.1
      }));

      setMarketData(prev => ({
        sentiment: Math.max(0, Math.min(1, prev.sentiment + (Math.random() - 0.5) * 0.05)),
        volatility: Math.max(0, Math.min(1, prev.volatility + (Math.random() - 0.5) * 0.02)),
        momentum: Math.max(0, Math.min(1, prev.momentum + (Math.random() - 0.5) * 0.03)),
        volume: Math.max(0.5, Math.min(2, prev.volume + (Math.random() - 0.5) * 0.05))
      }));

      updatePerformanceMetrics();
    }, 1000);

    return () => clearInterval(interval);
  }, [updatePerformanceMetrics]);

  // Symbol search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      const results = mockSymbols
        .filter(s => 
          s.symbol.toLowerCase().includes(query.toLowerCase()) ||
          s.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
        .map(s => ({
          ...s,
          price: Math.random() * 500 + 50,
          change: (Math.random() - 0.5) * 10,
          changePercent: (Math.random() - 0.5) * 5,
          volume: Math.random() * 100000000
        }));
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, []);

  const selectMarket = (market: Market) => {
    setSelectedMarket(market);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Layout management
  const saveLayout = (name: string) => {
    const currentLayout = {
      showWatchlist: layout.showWatchlist,
      showInsights: layout.showInsights,
      chartMaximized: layout.chartMaximized,
      timeframe: selectedTimeframe,
      indicators: activeIndicators,
      autoScale
    };
    
    const newLayouts = { ...layout.savedLayouts, [name]: currentLayout };
    setLayout(prev => ({ ...prev, savedLayouts: newLayouts }));
    localStorage.setItem('tradingPlatformLayouts', JSON.stringify(newLayouts));
  };

  const loadLayout = (name: string) => {
    const savedLayout = layout.savedLayouts[name];
    if (savedLayout) {
      setLayout(prev => ({
        ...prev,
        showWatchlist: savedLayout.showWatchlist,
        showInsights: savedLayout.showInsights,
        chartMaximized: savedLayout.chartMaximized
      }));
      setSelectedTimeframe(savedLayout.timeframe);
      setActiveIndicators(savedLayout.indicators);
      setAutoScale(savedLayout.autoScale);
    }
  };

  const resetLayout = () => {
    setLayout({
      showWatchlist: true,
      showInsights: true,
      chartMaximized: false,
      savedLayouts: layout.savedLayouts
    });
    setSelectedTimeframe('1m');
    setActiveIndicators(['EMA20', 'Volume']);
    setAutoScale(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background text-foreground">
      {/* Enhanced Header */}
      <header className="h-16 border-b border-border bg-card/90 backdrop-blur-xl flex items-center justify-between px-6 relative z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ProTrader AI
              </h1>
              <div className="text-xs text-muted-foreground">Enhanced Trading Platform</div>
            </div>
          </div>

          {/* Symbol Search */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border min-w-[300px]">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search symbols (SPY, AAPL, BTC-USD...)"
                className="border-none bg-transparent text-sm focus-visible:ring-0 px-0"
              />
            </div>
            
            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => selectMarket(result)}
                    className="w-full px-4 py-3 text-left hover:bg-accent flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-mono font-semibold">{result.symbol}</div>
                      <div className="text-xs text-muted-foreground">{result.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">${result.price.toFixed(2)}</div>
                      <div className={`text-xs ${result.change >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                        {result.change >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-border bg-card/50">
            {connectionStatus === 'Connected' ? (
              <Wifi className="w-4 h-4 text-bullish" />
            ) : (
              <WifiOff className="w-4 h-4 text-bearish" />
            )}
            <span className="text-sm">{connectionStatus}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Performance Badge (Dev Mode) */}
          {devMode && (
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded text-xs font-mono">
              <span>FPS: {fps}</span>
              <span>CPU: {cpuUsage.toFixed(1)}%</span>
            </div>
          )}

          {/* Layout Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLayout(prev => ({ ...prev, showWatchlist: !prev.showWatchlist }))}
              className="text-xs"
            >
              Watchlist
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLayout(prev => ({ ...prev, showInsights: !prev.showInsights }))}
              className="text-xs"
            >
              Insights
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLayout(prev => ({ ...prev, chartMaximized: !prev.chartMaximized }))}
            >
              {layout.chartMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>

          {/* Layout Management */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => saveLayout(`layout_${Date.now()}`)}>
              Save Layout
            </Button>
            <Button size="sm" variant="ghost" onClick={resetLayout}>
              Reset
            </Button>
          </div>

          <Button size="sm" variant="ghost">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Top Toolbar */}
      <div className="h-12 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          {/* Current Symbol Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-mono">{selectedMarket.symbol}</h2>
              <Badge variant="outline">{selectedMarket.assetClass.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xl font-mono font-bold">
                ${selectedMarket.price.toFixed(2)}
              </div>
              <div className={`flex items-center gap-1 ${selectedMarket.change >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                {selectedMarket.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                <span className="font-mono text-sm">
                  {selectedMarket.change >= 0 ? '+' : ''}{selectedMarket.change.toFixed(2)} ({selectedMarket.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Timeframe Chips */}
          <div className="flex items-center gap-1">
            {TIMEFRAMES.map((tf) => (
              <Button
                key={tf}
                size="sm"
                variant={selectedTimeframe === tf ? "default" : "ghost"}
                onClick={() => setSelectedTimeframe(tf)}
                className="h-8 px-3 text-xs font-mono"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Indicator Toggles */}
          <div className="flex items-center gap-2 text-sm">
            {INDICATORS.map((indicator) => (
              <label key={indicator} className="flex items-center gap-1 cursor-pointer">
                <Switch
                  checked={activeIndicators.includes(indicator)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setActiveIndicators(prev => [...prev, indicator]);
                    } else {
                      setActiveIndicators(prev => prev.filter(i => i !== indicator));
                    }
                  }}
                  className="scale-75"
                />
                <span className="text-xs">{indicator}</span>
              </label>
            ))}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Auto Scale & Live Controls */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <Switch
                checked={autoScale}
                onCheckedChange={setAutoScale}
                className="scale-75"
              />
              <span className="text-xs">Auto Scale</span>
            </label>
            
            <Button
              size="sm"
              variant={isLive ? "default" : "outline"}
              onClick={() => setIsLive(!isLive)}
              className="flex items-center gap-2 h-8"
            >
              {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span className="text-xs">{isLive ? 'LIVE' : 'PAUSED'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Trading Interface */}
      <div className="h-[calc(100vh-112px)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Watchlist & Drawing Tools */}
          {!layout.chartMaximized && layout.showWatchlist && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <div className="h-full border-r border-border bg-card/30 backdrop-blur-sm flex flex-col">
                  <div className="p-4 border-b border-border">
                    <EnhancedDrawingToolbar 
                      activeTool={activeDrawingTool}
                      onToolSelect={setActiveDrawingTool}
                    />
                  </div>
                  <div className="flex-1">
                    <WatchlistPanel 
                      selectedMarket={selectedMarket}
                      onMarketSelect={setSelectedMarket}
                    />
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Center Panel - Chart */}
          <ResizablePanel defaultSize={layout.chartMaximized ? 100 : 60} minSize={40}>
            <div className="h-full relative">
              <AdvancedChart 
                market={selectedMarket}
                drawingTool={activeDrawingTool}
                marketData={marketData}
              />
            </div>
          </ResizablePanel>

          {/* Right Panel - Insights */}
          {!layout.chartMaximized && layout.showInsights && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <div className="h-full border-l border-border bg-card/30 backdrop-blur-sm">
                  <InsightsPanel 
                    market={selectedMarket}
                    marketData={marketData}
                    timeframe={selectedTimeframe}
                  />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* AI Trading Dock */}
      <AITradingDock 
        market={selectedMarket}
        marketData={marketData}
        timeframe={selectedTimeframe}
        indicators={activeIndicators}
      />

      {/* Signals Toaster */}
      <SignalsToaster 
        market={selectedMarket}
        onSignalClick={(signal) => {
          // Handle signal click - could highlight on chart, open details, etc.
          console.log('Signal clicked:', signal);
        }}
      />
    </div>
  );
};