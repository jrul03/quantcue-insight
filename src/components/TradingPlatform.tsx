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
  Activity
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

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities';
}

export const TradingPlatform = () => {
  const [selectedMarket, setSelectedMarket] = useState<Market>({
    symbol: "AAPL",
    price: 175.84,
    change: 2.45,
    changePercent: 1.41,
    volume: 45123000,
    assetClass: 'stocks'
  });

  const [isAIOverlayEnabled, setIsAIOverlayEnabled] = useState(true);
  const [selectedTimeframes, setSelectedTimeframes] = useState(['1H', '4H', '1D']);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string>('select');
  const [layoutMode, setLayoutMode] = useState<'standard' | 'focus' | 'analysis'>('standard');

  const [marketData, setMarketData] = useState({
    sentiment: 0.75, // 0-1 scale
    volatility: 0.45,
    momentum: 0.82,
    volume: 1.23 // relative to avg
  });

  // Simulate real-time market data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedMarket(prev => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 2,
        change: prev.change + (Math.random() - 0.5) * 0.5
      }));

      setMarketData(prev => ({
        sentiment: Math.max(0, Math.min(1, prev.sentiment + (Math.random() - 0.5) * 0.1)),
        volatility: Math.max(0, Math.min(1, prev.volatility + (Math.random() - 0.5) * 0.05)),
        momentum: Math.max(0, Math.min(1, prev.momentum + (Math.random() - 0.5) * 0.08)),
        volume: Math.max(0.5, Math.min(2, prev.volume + (Math.random() - 0.5) * 0.1))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
                ProTrader AI
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
          {/* AI Status */}
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">AI Active</span>
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
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Market Selection & Tools */}
        {layoutMode !== 'focus' && (
          <div className="w-80 border-r border-slate-700/50 bg-slate-900/50 backdrop-blur-sm flex flex-col">
            <div className="p-4 border-b border-slate-700/50">
              <AssetClassSelector 
                selectedMarket={selectedMarket}
                onMarketSelect={setSelectedMarket}
              />
            </div>

            <div className="p-4 border-b border-slate-700/50">
              <DrawingToolbar 
                activeTool={activeDrawingTool}
                onToolSelect={setActiveDrawingTool}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="signals" className="h-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-800/30">
                  <TabsTrigger value="signals">AI Signals</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="journal">Journal</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signals" className="p-4">
                  <AISignalPanel market={selectedMarket} />
                </TabsContent>
                
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
        )}

        {/* Center - Advanced Charting */}
        <div className="flex-1 flex flex-col relative">
          {/* Chart Header with Market Info */}
          <div className="h-14 border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-between px-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold font-mono">{selectedMarket.symbol}</h2>
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {selectedMarket.assetClass.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-3xl font-mono font-bold">
                  ${selectedMarket.price.toFixed(2)}
                </div>
                <div className={`flex items-center gap-1 ${selectedMarket.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
                  <div className="w-2 h-2 bg-green-400 rounded-full opacity-75"></div>
                  <span className="text-slate-400">Sentiment:</span>
                  <span className="text-green-400">{(marketData.sentiment * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full opacity-75"></div>
                  <span className="text-slate-400">Vol:</span>
                  <span className="text-orange-400">{(marketData.volatility * 100).toFixed(0)}%</span>
                </div>
              </div>

              <Button
                size="sm"
                variant={isAIOverlayEnabled ? "default" : "ghost"}
                onClick={() => setIsAIOverlayEnabled(!isAIOverlayEnabled)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                AI Overlay
              </Button>
            </div>
          </div>

          {/* Main Chart Area */}
          <div className="flex-1 relative">
            <AdvancedChart 
              market={selectedMarket}
              drawingTool={activeDrawingTool}
              marketData={marketData}
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

        {/* Right Sidebar - Analysis & Collaboration */}
        {layoutMode !== 'focus' && (
          <div className="w-96 border-l border-slate-700/50 bg-slate-900/50 backdrop-blur-sm flex flex-col">
            <Tabs defaultValue="timeframes" className="h-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/30">
                <TabsTrigger value="timeframes">Multi-TF</TabsTrigger>
                <TabsTrigger value="correlation">Correlation</TabsTrigger>
                <TabsTrigger value="collaborate">Team</TabsTrigger>
              </TabsList>
              
              <TabsContent value="timeframes" className="flex-1 p-4">
                <MultiTimeframeAnalysis 
                  symbol={selectedMarket.symbol}
                  timeframes={selectedTimeframes}
                />
              </TabsContent>
              
              <TabsContent value="correlation" className="flex-1 p-4">
                <CorrelationMatrix 
                  baseSymbol={selectedMarket.symbol}
                  assetClass={selectedMarket.assetClass}
                />
              </TabsContent>
              

              <TabsContent value="collaborate" className="flex-1 p-4">
                <CollaborationPanel />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};