import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CandleAnalysisPanel } from "./CandleAnalysisPanel";
import { CandleMoveAnalysisDrawer } from "./CandleMoveAnalysisDrawer";
import { InsightOverlay } from "./InsightsToggleBar";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { IndicatorToggles, IndicatorState } from "./IndicatorToggles";
import { SubCharts } from "./SubCharts";
import { ChartToolbar } from "./ChartToolbar";
import { EnhancedChartCanvas } from "./EnhancedChartCanvas";
import { useCandles } from "@/hooks/useCandles";
import { useLastPrice } from "@/hooks/useLastPrice";

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities' | 'memecoins';
}

interface MarketData {
  sentiment: number;
  volatility: number;
  momentum: number;
  volume: number;
}

interface CandleData {
  timestamp: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
  rsi?: number;
  sentiment?: number;
}

interface AdvancedChartProps {
  market: Market;
  drawingTool: string;
  marketData: MarketData;
  overlays: InsightOverlay[];
}

export const AdvancedChart = ({ market, drawingTool = 'select', marketData, overlays }: AdvancedChartProps) => {
  const [selectedCandle, setSelectedCandle] = useState<CandleData | null>(null);
  const [showCandleAnalysis, setShowCandleAnalysis] = useState(false);
  const [showMoveAnalysisDrawer, setShowMoveAnalysisDrawer] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1D'>('5m');
  const [highlightedTimestamp, setHighlightedTimestamp] = useState<number | null>(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [indicators, setIndicators] = useState<IndicatorState>({
    ema: false,
    rsi: false,
    macd: false,
    bollinger: false,
    vwap: false
  });

  // Load indicator preferences from localStorage
  useEffect(() => {
    const savedIndicators = localStorage.getItem('chart-indicators');
    if (savedIndicators) {
      try {
        setIndicators(JSON.parse(savedIndicators));
      } catch (error) {
        console.warn('Failed to load indicator preferences:', error);
      }
    }
  }, []);

  // Save indicator preferences to localStorage
  useEffect(() => {
    localStorage.setItem('chart-indicators', JSON.stringify(indicators));
  }, [indicators]);

  const handleIndicatorToggle = (indicator: keyof IndicatorState) => {
    setIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));
  };

  // Map timeframe to resolution format expected by useCandles
  const getResolution = (timeframe: string): "1"|"5"|"15"|"60"|"D" => {
    switch(timeframe) {
      case '1m': return '1';
      case '5m': return '5';
      case '15m': return '15';
      case '1h': return '60';
      case '1D': return 'D';
      default: return '5';
    }
  };

  const candlesData = useCandles(market.symbol, getResolution(selectedTimeframe));
  const candles = Array.isArray(candlesData) ? candlesData : candlesData?.data || [];

  // Enhanced price data with smooth transitions
  const enhancedCandles = useMemo(() => {
    return candles.map((candle, index) => ({
      ...candle,
      ema50: indicators.ema ? calculateEMA(candles, index, 50) : null,
      ema200: indicators.ema ? calculateEMA(candles, index, 200) : null,
      vwap: indicators.vwap ? calculateVWAP(candles, index) : null,
      bollingerUpper: indicators.bollinger ? calculateBollinger(candles, index).upper : null,
      bollingerLower: indicators.bollinger ? calculateBollinger(candles, index).lower : null,
    }));
  }, [candles, indicators]);

  // Calculate EMA
  const calculateEMA = (data: CandleData[], index: number, period: number) => {
    if (index < period - 1) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = data[0].close;
    
    for (let i = 1; i <= index; i++) {
      ema = (data[i].close * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  };

  // Calculate VWAP
  const calculateVWAP = (data: CandleData[], index: number) => {
    let totalVolume = 0;
    let totalVolumePrice = 0;
    
    for (let i = 0; i <= index; i++) {
      const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
      totalVolumePrice += typicalPrice * data[i].volume;
      totalVolume += data[i].volume;
    }
    
    return totalVolume > 0 ? totalVolumePrice / totalVolume : null;
  };

  // Calculate Bollinger Bands
  const calculateBollinger = (data: CandleData[], index: number, period = 20, multiplier = 2) => {
    if (index < period - 1) return { upper: null, lower: null };
    
    const start = Math.max(0, index - period + 1);
    const slice = data.slice(start, index + 1);
    const closes = slice.map(c => c.close);
    const sma = closes.reduce((sum, close) => sum + close, 0) / closes.length;
    
    const variance = closes.reduce((sum, close) => sum + Math.pow(close - sma, 2), 0) / closes.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * multiplier),
      lower: sma - (stdDev * multiplier)
    };
  };

  const lastPrice = useLastPrice(market.symbol, true);

  // Smooth price transitions
  const [displayPrice, setDisplayPrice] = useState(market.price);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayPrice(market.price);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [market.price]);

  // Handle candle click for news analysis
  const handleCandleClick = (candle: CandleData) => {
    setSelectedCandle(candle);
    setShowMoveAnalysisDrawer(true);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(5, prev * 1.2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.1, prev / 1.2));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Chart Tools */}
      <ChartToolbar
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        zoomLevel={zoomLevel}
      />

      {/* Main Chart Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chart Header - Compact and Professional */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900/95 to-slate-800/95 border-b border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-6">
            {/* Symbol and Price */}
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{market.symbol}</h2>
                <p className="text-xs text-slate-400 font-medium">{selectedTimeframe} • Live Market Data</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-mono font-bold transition-all duration-300 ${
                  market.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${displayPrice.toFixed(2)}
                </div>
                
                <div className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all duration-300 ${
                  market.change >= 0 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  <span className="text-sm font-medium">
                    {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)} 
                    ({market.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Indicator Toggles - Inline */}
            <IndicatorToggles 
              indicators={indicators}
              onToggle={handleIndicatorToggle}
            />
          </div>

          {/* Timeframe Selector - Enhanced */}
          <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-600/30">
            {(['1m', '5m', '15m', '1h', '1D'] as const).map((tf) => (
              <Button
                key={tf}
                variant={selectedTimeframe === tf ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTimeframe(tf)}
                className={`text-xs font-medium transition-all duration-200 min-w-[2.5rem] ${
                  selectedTimeframe === tf 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>

        {/* Enhanced Chart Canvas - Full Size */}
        <div className="flex-1 relative min-h-0">
          <EnhancedChartCanvas
            candles={enhancedCandles}
            selectedCandle={selectedCandle}
            onCandleClick={handleCandleClick}
            indicators={indicators}
            timeframe={selectedTimeframe}
            highlightedTimestamp={highlightedTimestamp}
            market={market}
            selectedTool={selectedTool}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
          />
        </div>

        {/* Sub Charts - Collapsible */}
        {(indicators.rsi || indicators.macd) && (
          <div className="border-t border-slate-700/50">
            <SubCharts 
              showRSI={indicators.rsi}
              showMACD={indicators.macd}
              symbol={market.symbol}
              className="px-4 py-3"
            />
          </div>
        )}
      </div>

      {/* News Analysis Drawer */}
      <CandleMoveAnalysisDrawer
        isOpen={showMoveAnalysisDrawer}
        onClose={() => setShowMoveAnalysisDrawer(false)}
        candle={selectedCandle}
        symbol={market.symbol}
      />
    </div>
  );
};

// Legacy components removed - functionality moved to EnhancedChartCanvas