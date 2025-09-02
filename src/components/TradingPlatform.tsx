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
  MessageCircle,
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
import { AITradingAssistant } from "./AITradingAssistant";
import { FloatingPanelManager } from "./FloatingPanelManager";
import { CandleMoveAnalysisDrawer } from "./CandleMoveAnalysisDrawer";
import { StrategyToggleBar } from "./StrategyToggleBar";
import { LiveSignalsToaster } from "./LiveSignalsToaster";
import { FloatingDrawingToolbar } from "./FloatingDrawingToolbar";
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
  assetClass:
    | "stocks"
    | "forex"
    | "crypto"
    | "options"
    | "commodities"
    | "memecoins";
}

export const TradingPlatform = () => {
  const [selectedStock, setSelectedStock] = useState<Stock>({
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 0,
    change: 0,
  });

  const [selectedMarket, setSelectedMarket] = useState<Market>({
    symbol: "AAPL",
    price: 0,
    change: 0,
    changePercent: 0,
    volume: 0,
    assetClass: "stocks",
  });

  const handleMarketSelect = (market: Market) => {
    setSelectedMarket(market);
    setSelectedStock({
      symbol: market.symbol,
      name: market.symbol,
      price: market.price,
      change: market.change,
    });
  };

  const { price: currentPrice, change: priceChangeFromLive } = useLivePrice(
    selectedStock.symbol,
    true
  );

  const [isAIOverlayEnabled, setIsAIOverlayEnabled] = useState(true);
  const [selectedTimeframes, setSelectedTimeframes] = useState([
    "1H",
    "4H",
    "1D",
  ]);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string>("select");
  const [layoutMode, setLayoutMode] =
    useState<"standard" | "focus" | "analysis">("standard");
  const [isAIAnalyzerVisible, setIsAIAnalyzerVisible] = useState(true);
  const [isAIChatbotVisible, setIsAIChatbotVisible] = useState(true);

  const [selectedCandle, setSelectedCandle] = useState<any>(null);
  const [isAnalysisDrawerOpen, setIsAnalysisDrawerOpen] = useState(false);

  const [liveSignals, setLiveSignals] = useState<any[]>([]);

  const [insightsOverlays, setInsightsOverlays] = useState<InsightOverlay[]>(
    () => {
      const urlParams = new URLSearchParams(window.location.search);
      const enabledOverlays = urlParams.get("insights")?.split(",") || [];
      return [
        {
          id: "ema_cloud",
          name: "EMA Cloud",
          shortName: "EMA Cloud",
          enabled: enabledOverlays.includes("ema_cloud"),
          category: "core",
        },
        {
          id: "rsi_divergence",
          name: "RSI Divergence",
          shortName: "RSI Div",
          enabled: enabledOverlays.includes("rsi_divergence"),
          category: "core",
        },
        {
          id: "vwap",
          name: "VWAP",
          shortName: "VWAP",
          enabled: enabledOverlays.includes("vwap"),
          category: "core",
        },
        {
          id: "volume_profile",
          name: "Volume Profile",
          shortName: "Vol Profile",
          enabled: enabledOverlays.includes("volume_profile"),
          category: "core",
        },
        {
          id: "bollinger_bands",
          name: "Bollinger Bands",
          shortName: "Bollinger",
          enabled: enabledOverlays.includes("bollinger_bands"),
          category: "advanced",
        },
        {
          id: "auto_patterns",
          name: "Auto Pattern Recognition",
          shortName: "Patterns",
          enabled: enabledOverlays.includes("auto_patterns"),
          category: "advanced",
        },
      ];
    }
  );

  const [marketData, setMarketData] = useState({
    sentiment: 0.75,
    volatility: 0.45,
    momentum: 0.82,
    volume: 1.23,
  });

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setSelectedMarket({
      symbol: stock.symbol,
      price: stock.price,
      change: stock.change,
      changePercent: stock.price > 0 ? (stock.change / stock.price) * 100 : 0,
      volume: 45800000,
      assetClass: stock.symbol.includes("-USD") ? "crypto" : "stocks",
    });
  };

  useEffect(() => {
    if (currentPrice != null) {
      const change = priceChangeFromLive || 0;
      const changePercent = currentPrice > 0 ? (change / currentPrice) * 100 : 0;
      setSelectedMarket((prev) => ({
        ...prev,
        price: currentPrice,
        change,
        changePercent,
      }));
      setSelectedStock((prev) => ({
        ...prev,
        price: currentPrice,
        change,
      }));
    }
  }, [currentPrice, priceChangeFromLive]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMarketData((prev) => ({
        sentiment: Math.max(
          0,
          Math.min(1, prev.sentiment + (Math.random() - 0.5) * 0.1)
        ),
        volatility: Math.max(
          0,
          Math.min(1, prev.volatility + (Math.random() - 0.5) * 0.05)
        ),
        momentum: Math.max(
          0,
          Math.min(1, prev.momentum + (Math.random() - 0.5) * 0.08)
        ),
        volume: Math.max(
          0.5,
          Math.min(2, prev.volume + (Math.random() - 0.5) * 0.1)
        ),
      }));
    }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleInsightsToggle = (overlayId: string) => {
    setInsightsOverlays((prev) => {
      const newOverlays = prev.map((overlay) =>
        overlay.id === overlayId
          ? { ...overlay, enabled: !overlay.enabled }
          : overlay
      );
      const enabledIds = newOverlays.filter((o) => o.enabled).map((o) => o.id);
      const url = new URL(window.location.href);
      if (enabledIds.length > 0) {
        url.searchParams.set("insights", enabledIds.join(","));
      } else {
        url.searchParams.delete("insights");
      }
      window.history.replaceState({}, "", url.toString());
      return newOverlays;
    });
  };

  const handleSentimentTimeClick = (timestamp: number) => {
    const mockCandle = {
      timestamp,
      open: selectedMarket.price * (0.99 + Math.random() * 0.02),
      high: selectedMarket.price * (1.001 + Math.random() * 0.02),
      low: selectedMarket.price * (0.98 + Math.random() * 0.02),
      close: selectedMarket.price,
      volume: Math.floor(Math.random() * 1000000) + 500000,
    };
    setSelectedCandle(mockCandle);
    setIsAnalysisDrawerOpen(true);
  };

  const handleStrategyToggle = (strategyId: string, active: boolean) => {
    console.log(
      `Strategy ${strategyId} ${active ? "activated" : "deactivated"}`
    );
  };

  const handleSignalGenerated = (signal: any) => {
    const newSignal = {
      ...signal,
      id: Date.now().toString(),
      timestamp: Date.now(),
      strategyName: signal.strategyId.replace("_", " ").toUpperCase(),
    };
    setLiveSignals((prev) => [...prev, newSignal]);
  };

  const handleCandleClick = () => {
    const mockCandle = {
      timestamp: Date.now(),
      open: selectedMarket.price * 0.99,
      high: selectedMarket.price * 1.02,
      low: selectedMarket.price * 0.98,
      close: selectedMarket.price,
      volume: Math.floor(Math.random() * 1000000) + 500000,
    };
    setSelectedCandle(mockCandle);
    setIsAnalysisDrawerOpen(true);
  };

  const handleSignalDismiss = (signalId: string) => {
    setLiveSignals((prev) => prev.filter((s) => s.id !== signalId));
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
              <div className="text-xs text-slate-400">
                Professional Trading Platform
              </div>
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
          <ApiStatusDebug />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Brain className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">AI Active</span>
            </div>
            <Button
              size="sm"
              variant={isAIChatbotVisible ? "default" : "ghost"}
              onClick={() => setIsAIChatbotVisible(!isAIChatbotVisible)}
              className="relative"
            >
              <MessageCircle className="w-4 h-4" />
              {!isAIChatbotVisible && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={layoutMode === "standard" ? "default" : "ghost"}
              onClick={() => setLayoutMode("standard")}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={layoutMode === "focus" ? "default" : "ghost"}
              onClick={() => setLayoutMode("focus")}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={layoutMode === "analysis" ? "default" : "ghost"}
              onClick={() => setLayoutMode("analysis")}
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
          {/* Left Sidebar */}
          <div className="w-[260px] h-full border-r border-slate-700/50 bg-slate-900/50 backdrop-blur-sm flex flex-col flex-shrink-0">
            <div className="h-2/3 min-h-0">
              <WatchlistTabs
                selectedMarket={selectedMarket}
                onMarketSelect={handleMarketSelect}
              />
            </div>

            <div className="h-1/3 border-t border-slate-700/50 flex flex-col bg-slate-800/20">
              <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/40">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Analysis Tools
                </h3>
              </div>

              <Tabs defaultValue="depth" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 mx-2 mt-2 p-1 rounded-md">
                  <TabsTrigger value="depth" className="text-xs font-medium">
                    Market Depth
                  </TabsTrigger>
                  <TabsTrigger
                    value="volatility"
                    className="text-xs font-medium"
                  >
                    Volatility
                  </TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 mx-2 mb-2 p-1 rounded-md">
                  <TabsTrigger value="journal" className="text-xs font-medium">
                    Journal
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai-analyzer"
                    className="text-xs font-medium"
                  >
                    AI Analyzer
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="depth" className="h-full px-2 pb-2 m-0">
                    <div className="h-full overflow-auto bg-slate-900/30 rounded border border-slate-700/30">
                      <MarketDepthHeatmap symbol={selectedMarket.symbol} />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="volatility"
                    className="h-full px-2 pb-2 m-0"
                  >
                    <div className="h-full overflow-auto bg-slate-900/30 rounded border border-slate-700/30">
                      <VolatilityHeatmap />
                    </div>
                  </TabsContent>

                  <TabsContent value="journal" className="h-full px-2 pb-2 m-0">
                    <div className="h-full overflow-auto bg-slate-900/30 rounded border border-slate-700/30">
                      <TradeJournal />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="ai-analyzer"
                    className="h-full px-2 pb-2 m-0"
                  >
                    <div className="h-full overflow-auto bg-slate-900/30 rounded border border-slate-700/30 p-3">
                      <div className="text-center text-slate-400 text-sm">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>AI Live Analyzer</p>
                        <p className="text-xs mt-1">Real-time pattern detection</p>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          {/* Center Workspace */}
          <div className="flex-1 flex flex-col h-full bg-slate-900/20 min-w-0 relative">
            <div
              className="flex-1 flex flex-col min-h-0 xl:min-h-[78vh] lg:min-h-[74vh]"
              data-chart-workspace
            >
              {/* Market Status Bar */}
              <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/40 to-slate-800/40 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white transition-all duration-300">
                        {selectedMarket.symbol}
                      </span>
                      <span className="text-xs text-slate-400">
                        {selectedMarket.assetClass.toUpperCase()} • Live Market
                        Data
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div
                        className={`text-3xl font-mono font-bold transition-all duration-300 ${
                          selectedMarket.change >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        ${selectedMarket.price.toFixed(2)}
                      </div>
                      <div
                        className={`flex items-center gap-1 transition-all duration-300 ${
                          selectedMarket.change >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {selectedMarket.change >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingUp className="w-4 h-4 rotate-180" />
                        )}
                        <span className="font-mono">
                          {selectedMarket.change >= 0 ? "+" : ""}
                          {selectedMarket.change.toFixed(2)} (
                          {selectedMarket.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full opacity-75 animate-pulse"></div>
                        <span className="text-slate-400">Sentiment:</span>
                        <span className="text-green-400">
                          {(marketData.sentiment * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full opacity-75 animate-pulse"></div>
                        <span className="text-slate-400">Vol:</span>
                        <span className="text-orange-400">
                          {(marketData.volatility * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <NewsSentimentHeatmap
                    symbol={selectedMarket.symbol}
                    onTimeClick={handleSentimentTimeClick}
                  />
                </div>
              </div>

              <StrategyToggleBar
                onStrategyToggle={handleStrategyToggle}
                onSignalGenerated={handleSignalGenerated}
              />

              <InsightsToggleBar
                overlays={insightsOverlays}
                onToggle={handleInsightsToggle}
              />

              {/* Main Chart Area */}
              <div className="flex-1 relative min-h-0">
                <FloatingDrawingToolbar
                  activeTool={activeDrawingTool}
                  onToolSelect={setActiveDrawingTool}
                />

                <AdvancedChart
                  market={selectedMarket}
                  drawingTool={activeDrawingTool}
                  marketData={marketData}
                  overlays={insightsOverlays}
                  onCandleClick={handleCandleClick}
                />

                {isAIOverlayEnabled && (
                  <AIOverlayHUD market={selectedMarket} marketData={marketData} />
                )}
              </div>
            </div>
          </div>

          {/* Floating Panels (not part of flex sizing) */}
          <FloatingPanelManager
            market={selectedMarket}
            marketData={marketData}
            showChat={isAIChatbotVisible}
            showAnalyzer={isAIAnalyzerVisible}
            onToggleChat={() => setIsAIChatbotVisible(!isAIChatbotVisible)}
            onToggleAnalyzer={() => setIsAIAnalyzerVisible(!isAIAnalyzerVisible)}
          />

          {/* Right Sidebar */}
          <div className="w-[320px] h-full border-l border-slate-700/50 bg-slate-900/50 backdrop-blur-sm flex-shrink-0 overflow-hidden">
            <Tabs defaultValue="signals" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/40 m-3 p-1 rounded-xl border border-slate-600/30">
                <TabsTrigger
                  value="signals"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span>AI Signals</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="timeframes"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Multi-TF</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signals" className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="px-4 py-3 border-b border-slate-600/30 bg-slate-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                          <Brain className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">
                            AI Signals
                          </h3>
                          <p className="text-xs text-slate-400">
                            Real-time intelligence
                          </p>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto px-3 py-2">
                    <AISignalPanel market={selectedMarket} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timeframes" className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="px-4 py-3 border-b border-slate-600/30 bg-slate-800/30">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Multi-Timeframe Analysis
                    </h3>
                  </div>
                  <div className="flex-1 overflow-auto p-3">
                    <MultiTimeframeAnalysis
                      symbol={selectedMarket.symbol}
                      timeframes={selectedTimeframes}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

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