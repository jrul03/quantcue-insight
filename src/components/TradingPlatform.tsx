import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  BarChart3, 
  Brain, 
  Users, 
  Settings,
  Maximize2,
  Minimize2,
  Eye,
  Target,
  Zap,
  Globe,
  Clock,
  Activity,
  MessageCircle
} from "lucide-react";
import { AdvancedChart } from "./AdvancedChart";
import { MultiTimeframeAnalysis } from "./MultiTimeframeAnalysis";
import { AISignalPanel } from "./AISignalPanel";
import { MarketDepthHeatmap } from "./MarketDepthHeatmap";
import { CorrelationMatrix } from "./CorrelationMatrix";
import { CollaborationPanel } from "./CollaborationPanel";
import { DrawingToolbar } from "./DrawingToolbar";
import { AssetClassSelector } from "./AssetClassSelector";
import { AIOverlayHUD } from "./AIOverlayHUD";
import { TradeJournal } from "./TradeJournal";
import { VolatilityHeatmap } from "./VolatilityHeatmap";
import { AILiveAnalyzerHUD } from "./ai/AILiveAnalyzerHUD";
import { AIChat } from "./ai/AIChat";
import { CandleMoveAnalysisDrawer } from "./CandleMoveAnalysisDrawer";
import { StrategyToggleBar } from "./StrategyToggleBar";
import { LiveSignalsToaster } from "./LiveSignalsToaster";
import { FloatingToolbar } from "./ui/FloatingToolbar";
import { InsightsToggleBar, InsightOverlay } from "./InsightsToggleBar";
import { NewsSentimentHeatmap } from "./NewsSentimentHeatmap";
import { ResizablePanels } from "./ResizablePanels";
import { WatchlistTabs } from "./WatchlistTabs";
import { StockSelector, Stock } from "./StockSelector";
import { useLivePrice } from "@/hooks/useLivePrice";
import { ApiStatusDebug } from "@/components/ApiStatusDebug";

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities' | 'memecoins';
}

export const TradingPlatform = () => {
  const [selectedStock, setSelectedStock] = useState<Stock>({
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 0, // Will be fetched from API
    change: 0
  });

  const [selectedMarket, setSelectedMarket] = useState<Market>({
    symbol: "AAPL",
    price: 0, // Will be fetched from API
    change: 0,
    changePercent: 0,
    volume: 0,
    assetClass: 'stocks'
  });

  // Handle market selection from watchlist
  const handleMarketSelect = (market: Market) => {
    setSelectedMarket(market);
    setSelectedStock({
      symbol: market.symbol,
      name: market.symbol, // Would be fetched from API
      price: market.price,
      change: market.change
    });
  };

  // Use real-time price hook for selected stock
  const { price: currentPrice, change: priceChangeFromLive } = useLivePrice(selectedStock.symbol, true);

  const [isAIOverlayEnabled, setIsAIOverlayEnabled] = useState(true);
  const [selectedTimeframes, setSelectedTimeframes] = useState(['1H', '4H', '1D']);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string>('select');
  const [layoutMode, setLayoutMode] = useState<'standard' | 'focus' | 'analysis'>('standard');
  const [isAIAnalyzerVisible, setIsAIAnalyzerVisible] = useState(true);
  const [isAIChatbotVisible, setIsAIChatbotVisible] = useState(true);
  
  // Candle analysis state
  const [selectedCandle, setSelectedCandle] = useState<any>(null);
  const [isAnalysisDrawerOpen, setIsAnalysisDrawerOpen] = useState(false);
  
  // Live signals state
  const [liveSignals, setLiveSignals] = useState<any[]>([]);

  // Initialize insights overlays with URL state management
  const [insightsOverlays, setInsightsOverlays] = useState<InsightOverlay[]>(() => {
    // Read from URL params on initialization
    const urlParams = new URLSearchParams(window.location.search);
    const enabledOverlays = urlParams.get('insights')?.split(',') || [];
    
    return [
      { id: 'ema_cloud', name: 'EMA Cloud', shortName: 'EMA Cloud', enabled: enabledOverlays.includes('ema_cloud'), category: 'core' },
      { id: 'rsi_divergence', name: 'RSI Divergence', shortName: 'RSI Div', enabled: enabledOverlays.includes('rsi_divergence'), category: 'core' },
      { id: 'vwap', name: 'VWAP', shortName: 'VWAP', enabled: enabledOverlays.includes('vwap'), category: 'core' },
      { id: 'volume_profile', name: 'Volume Profile', shortName: 'Vol Profile', enabled: enabledOverlays.includes('volume_profile'), category: 'core' },
      { id: 'bollinger_bands', name: 'Bollinger Bands', shortName: 'Bollinger', enabled: enabledOverlays.includes('bollinger_bands'), category: 'advanced' },
      { id: 'auto_patterns', name: 'Auto Pattern Recognition', shortName: 'Patterns', enabled: enabledOverlays.includes('auto_patterns'), category: 'advanced' },
    ];
  });

  const [marketData, setMarketData] = useState({
    sentiment: 0.75, // 0-1 scale
    volatility: 0.45,
    momentum: 0.82,
    volume: 1.23 // relative to avg
  });

  // Handle stock selection
  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setSelectedMarket({
      symbol: stock.symbol,
      price: stock.price,
      change: stock.change,
      changePercent: stock.price > 0 ? (stock.change / stock.price) * 100 : 0,
      volume: 45800000,
      assetClass: stock.symbol.includes('-USD') ? 'crypto' : 'stocks'
    });
  };

  // Update market data when real-time price changes
  useEffect(() => {
    if (currentPrice != null) {
      const change = priceChangeFromLive || 0;
      const changePercent = currentPrice > 0 ? (change / currentPrice) * 100 : 0;
      
      setSelectedMarket(prev => ({
        ...prev,
        price: currentPrice,
        change,
        changePercent
      }));
      
      setSelectedStock(prev => ({
        ...prev,
        price: currentPrice,
        change
      }));
    }
  }, [currentPrice, priceChangeFromLive]);

  // Update other market data indicators periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      setMarketData(prev => ({
        sentiment: Math.max(0, Math.min(1, prev.sentiment + (Math.random() - 0.5) * 0.1)),
        volatility: Math.max(0, Math.min(1, prev.volatility + (Math.random() - 0.5) * 0.05)),
        momentum: Math.max(0, Math.min(1, prev.momentum + (Math.random() - 0.5) * 0.08)),
        volume: Math.max(0.5, Math.min(2, prev.volume + (Math.random() - 0.5) * 0.1))
      }));
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Handle insights overlay toggle with URL state persistence
  const handleInsightsToggle = (overlayId: string) => {
    setInsightsOverlays(prev => {
      const newOverlays = prev.map(overlay => 
        overlay.id === overlayId 
          ? { ...overlay, enabled: !overlay.enabled }
          : overlay
      );
      
      // Update URL with enabled overlays
      const enabledIds = newOverlays.filter(o => o.enabled).map(o => o.id);
      const url = new URL(window.location.href);
      if (enabledIds.length > 0) {
        url.searchParams.set('insights', enabledIds.join(','));
      } else {
        url.searchParams.delete('insights');
      }
      window.history.replaceState({}, '', url.toString());
      
      return newOverlays;
    });
  };

  // Handle news sentiment timeline click
  const handleSentimentTimeClick = (timestamp: number) => {
    // Create a mock candle for the timestamp (in a real app, this would find the actual candle)
    const mockCandle = {
      timestamp,
      open: selectedMarket.price * (0.99 + Math.random() * 0.02),
      high: selectedMarket.price * (1.001 + Math.random() * 0.02),
      low: selectedMarket.price * (0.98 + Math.random() * 0.02),
      close: selectedMarket.price,
      volume: Math.floor(Math.random() * 1000000) + 500000
    };
    
    // Set the selected candle and open the analysis drawer
    setSelectedCandle(mockCandle);
    setIsAnalysisDrawerOpen(true);
    
    console.log('Opening candle analysis for news at:', new Date(timestamp));
  };

  // Handle strategy toggles and signal generation
  const handleStrategyToggle = (strategyId: string, active: boolean) => {
    console.log(`Strategy ${strategyId} ${active ? 'activated' : 'deactivated'}`);
  };

  const handleSignalGenerated = (signal: any) => {
    const newSignal = {
      ...signal,
      id: Date.now().toString(),
      timestamp: Date.now(),
      strategyName: signal.strategyId.replace('_', ' ').toUpperCase()
    };
    
    setLiveSignals(prev => [...prev, newSignal]);
    console.log('New signal generated:', newSignal);
  };

  // Handle candle click for analysis - mock for now
  const handleCandleClick = (candle: any) => {
    const mockCandle = {
      timestamp: Date.now(),
      open: selectedMarket.price * 0.99,
      high: selectedMarket.price * 1.02,
      low: selectedMarket.price * 0.98,
      close: selectedMarket.price,
      volume: Math.floor(Math.random() * 1000000) + 500000
    };
    setSelectedCandle(mockCandle);
    setIsAnalysisDrawerOpen(true);
  };

  const handleSignalDismiss = (signalId: string) => {
    setLiveSignals(prev => prev.filter(s => s.id !== signalId));
  };

  const handleClearAllSignals = () => {
    setLiveSignals([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Advanced Header */}
      <header className="h-16 border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-xl flex items-center justify-between px-6 relative z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                QuantCue
              </h1>
              <div className="text-xs text-slate-400">Professional Trading Platform</div>
            </div>
          </div>

          {/* Live Market Status */}
          <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">Markets Open</span>
            </div>
            <div className="h-4 w-px bg-slate-600"></div>
            <div className="text-sm">
              <span className="text-slate-400">SPX:</span>
              <span className="ml-1 text-green-400">+0.85%</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-400">VIX:</span>
              <span className="ml-1 text-orange-400">18.4</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* API Status Debug */}
          <ApiStatusDebug />
          
          {/* AI Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Brain className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">AI Active</span>
            </div>
            <Button
              size="sm"
              variant={isAIChatbotVisible ? 'default' : 'ghost'}
              onClick={() => setIsAIChatbotVisible(!isAIChatbotVisible)}
              className="relative"
            >
              <MessageCircle className="w-4 h-4" />
              {!isAIChatbotVisible && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              )}
            </Button>
          </div>

          {/* Layout Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={layoutMode === 'standard' ? 'default' : 'ghost'}
              onClick={() => setLayoutMode('standard')}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={layoutMode === 'focus' ? 'default' : 'ghost'}
              onClick={() => setLayoutMode('focus')}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={layoutMode === 'analysis' ? 'default' : 'ghost'}
              onClick={() => setLayoutMode('analysis')}
            >
              <Activity className="w-4 h-4" />
            </Button>
          </div>

          <Button size="sm" variant="ghost">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Trading Interface */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Left Sidebar - Watchlist & Selection */}
          <div className="w-1/4 h-full border-r border-slate-700/50 bg-slate-900/50 backdrop-blur-sm flex flex-col">
            <WatchlistTabs 
              selectedMarket={selectedMarket}
              onMarketSelect={handleMarketSelect}
            />

            <div className="p-4 border-t border-slate-700/50">
              <DrawingToolbar 
                activeTool={activeDrawingTool}
                onToolSelect={setActiveDrawingTool}
              />
            </div>

            <div className="flex-1 overflow-y-auto border-t border-slate-700/50">
              <Tabs defaultValue="analysis" className="h-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-800/30">
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="journal">Journal</TabsTrigger>
                </TabsList>
                
                <TabsContent value="analysis" className="p-4">
                  <div className="space-y-4">
                    <MarketDepthHeatmap symbol={selectedMarket.symbol} />
                    <VolatilityHeatmap />
                  </div>
                </TabsContent>
                
                <TabsContent value="journal" className="p-4">
                  <TradeJournal />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Center - Chart & Analysis */}
          <div className="flex-1 flex flex-col h-full bg-slate-900/20">
            {/* Market Status Bar */}
            <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/40 to-slate-800/40 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white transition-all duration-300">
                      {selectedMarket.symbol}
                    </span>
                    <span className="text-xs text-slate-400">
                      {selectedMarket.assetClass.toUpperCase()} • Live Market Data
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`text-3xl font-mono font-bold transition-all duration-300 ${
                      selectedMarket.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${selectedMarket.price.toFixed(2)}
                    </div>
                    <div className={`flex items-center gap-1 transition-all duration-300 ${selectedMarket.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedMarket.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                      <span className="font-mono">
                        {selectedMarket.change >= 0 ? '+' : ''}{selectedMarket.change.toFixed(2)} ({selectedMarket.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Market Sentiment Indicators */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full opacity-75 animate-pulse"></div>
                      <span className="text-slate-400">Sentiment:</span>
                      <span className="text-green-400">{(marketData.sentiment * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full opacity-75 animate-pulse"></div>
                      <span className="text-slate-400">Vol:</span>
                      <span className="text-orange-400">{(marketData.volatility * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* News Sentiment Heatmap */}
              <div className="mt-3">
                <NewsSentimentHeatmap 
                  symbol={selectedMarket.symbol}
                  onTimeClick={handleSentimentTimeClick}
                />
              </div>
            </div>

            {/* Strategy Toggle Bar */}
            <StrategyToggleBar 
              onStrategyToggle={handleStrategyToggle}
              onSignalGenerated={handleSignalGenerated}
            />

            {/* Insights Toggle Bar */}
            <InsightsToggleBar 
              overlays={insightsOverlays}
              onToggle={handleInsightsToggle}
            />

            {/* Main Chart Area */}
            <div className="flex-1 relative">
              <AdvancedChart 
                market={selectedMarket}
                drawingTool={activeDrawingTool}
                marketData={marketData}
                overlays={insightsOverlays}
              />

              {/* AI Overlay HUD */}
              {isAIOverlayEnabled && (
                <AIOverlayHUD 
                  market={selectedMarket}
                  marketData={marketData}
                />
              )}
            </div>
          </div>

          {/* Right Sidebar - AI Signals & Analysis */}
          <div className="w-1/3 border-l border-slate-700/50 bg-gradient-to-b from-slate-900/60 to-slate-800/60 backdrop-blur-md flex flex-col h-full">
            <Tabs defaultValue="signals" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800/40 m-3 p-1 rounded-xl border border-slate-600/30">
                <TabsTrigger 
                  value="signals" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span className="font-medium">AI Signals</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="timeframes"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Multi-TF</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="correlation"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span className="font-medium">Correlation</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="collaborate"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Team</span>
                  </div>
                </TabsTrigger>
              </TabsList>
              
              {/* AI Signals Panel - Primary Position */}
              <TabsContent value="signals" className="flex-1 p-4 overflow-auto">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-600/30 h-full backdrop-blur-sm">
                  <div className="p-4 border-b border-slate-600/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">AI Trading Signals</h3>
                        <p className="text-xs text-slate-400">Real-time market intelligence</p>
                      </div>
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 h-full overflow-auto">
                    <AISignalPanel market={selectedMarket} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="timeframes" className="flex-1 p-4 overflow-auto">
                <MultiTimeframeAnalysis 
                  symbol={selectedMarket.symbol}
                  timeframes={selectedTimeframes}
                />
              </TabsContent>
              
              <TabsContent value="correlation" className="flex-1 p-4 overflow-auto">
                <CorrelationMatrix 
                  baseSymbol={selectedMarket.symbol}
                  assetClass={selectedMarket.assetClass}
                />
              </TabsContent>
              
              <TabsContent value="collaborate" className="flex-1 p-4 overflow-auto">
                <CollaborationPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* AI Live Analyzer HUD */}
      {isAIAnalyzerVisible && (
        <AILiveAnalyzerHUD 
          market={selectedMarket}
          marketData={marketData}
          isVisible={isAIAnalyzerVisible}
          onToggle={() => setIsAIAnalyzerVisible(!isAIAnalyzerVisible)}
        />
      )}

      {/* AI Chat */}
      {isAIChatbotVisible && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] z-40">
          <AIChat 
            market={selectedMarket}
            isVisible={isAIChatbotVisible}
            onClose={() => setIsAIChatbotVisible(false)}
            className="h-full"
          />
        </div>
      )}

      {/* Candle Move Analysis Drawer */}
      <CandleMoveAnalysisDrawer
        isOpen={isAnalysisDrawerOpen}
        onClose={() => setIsAnalysisDrawerOpen(false)}
        candle={selectedCandle}
        symbol={selectedMarket.symbol}
      />

      {/* Live Signals Toaster */}
      <LiveSignalsToaster 
        signals={liveSignals}
        onDismiss={handleSignalDismiss}
        onClearAll={handleClearAllSignals}
      />
    </div>
  );
};