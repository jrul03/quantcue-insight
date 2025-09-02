import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CandleAnalysisPanel } from "./CandleAnalysisPanel";
import { CandleMoveAnalysisDrawer } from "./CandleMoveAnalysisDrawer";
import { InsightOverlay } from "./InsightsToggleBar";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { IndicatorToggles, IndicatorState } from "./IndicatorToggles";
import { SubCharts } from "./SubCharts";
import { ZoomControls } from "./ZoomControls";
import { CandleNewsPanel } from "./CandleNewsPanel";
import { ChartToolbar } from "./ChartToolbar";
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
  onCandleClick?: (candle: CandleData) => void;
}

export const AdvancedChart = ({ market, drawingTool = 'select', marketData, overlays, onCandleClick }: AdvancedChartProps) => {
  const [selectedCandle, setSelectedCandle] = useState<CandleData | null>(null);
  const [showCandleAnalysis, setShowCandleAnalysis] = useState(false);
  const [showMoveAnalysisDrawer, setShowMoveAnalysisDrawer] = useState(false);
  const [showCandleNewsPanel, setShowCandleNewsPanel] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1D'>('5m');
  const [highlightedTimestamp, setHighlightedTimestamp] = useState<number | null>(null);
  const [indicators, setIndicators] = useState<IndicatorState>({
    ema: false,
    rsi: false,
    macd: false,
    bollinger: false,
    vwap: false
  });

  // Zoom controls state
  const [zoomLevel, setZoomLevel] = useState(100);

  // Chart tools state
  const [crosshairEnabled, setCrosshairEnabled] = useState(false);
  const [magnetEnabled, setMagnetEnabled] = useState(false);

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

  // Enhanced price data with technical indicators
  const enhancedCandles = useMemo(() => {
    return candles.map((candle, index) => ({
      ...candle,
      ema20: indicators.ema ? calculateEMA(candles, index, 20) : null,
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
    setShowCandleNewsPanel(true);
    
    // Call parent callback if provided
    if (onCandleClick) {
      onCandleClick(candle);
    }
  };

  // Zoom control handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 25));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  // Chart tool handlers
  const handleCrosshairToggle = () => {
    setCrosshairEnabled(!crosshairEnabled);
  };

  const handleMagnetToggle = () => {
    setMagnetEnabled(!magnetEnabled);
  };

  const handleDownload = () => {
    // Export chart as PNG
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;
    
    // Simple download implementation - could be enhanced
    console.log('Chart download triggered');
  };

  // Chart dimensions and scaling
  const chartWidth = 900;
  const chartHeight = 400;
  const padding = { top: 20, right: 60, bottom: 40, left: 60 };
  
  // Calculate price scales
  const allPrices = enhancedCandles.flatMap(d => [d.open, d.high, d.low, d.close]);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) * 0.998 : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) * 1.002 : 100;
  const priceRange = maxPrice - minPrice || 1;
  
  // Scale functions
  const scalePrice = (price: number) => 
    chartHeight - padding.bottom - ((price - minPrice) / priceRange) * (chartHeight - padding.top - padding.bottom);
  
  const scaleX = (index: number) => 
    enhancedCandles.length > 1 ? 
      padding.left + (index * (chartWidth - padding.left - padding.right)) / (enhancedCandles.length - 1) :
      padding.left;

  return (
    <div className="h-full flex flex-col">
      {/* Market Status Bar */}
      <div className="px-6 py-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/40 to-slate-800/40 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white transition-all duration-300">
                {market.symbol}
              </span>
              <span className="text-xs text-slate-400">
                {market.assetClass.toUpperCase()} • Live Market Data
              </span>
            </div>
            <div className="flex flex-col items-end">
              <div className={`text-3xl font-mono font-bold transition-all duration-300 ${
                market.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${market.price.toFixed(2)}
              </div>
              <div className={`flex items-center gap-1 transition-all duration-300 ${market.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <span className="text-lg font-semibold">
                  {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}
                </span>
                <span className="text-sm opacity-90">
                  ({market.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-400">Volume:</span>
              <span className="ml-2 text-slate-200 font-mono">
                {(market.volume / 1000000).toFixed(1)}M
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Consolidated Chart Toolbar */}
      <ChartToolbar
        symbol={market.symbol}
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={setSelectedTimeframe}
        indicators={indicators}
        onIndicatorToggle={handleIndicatorToggle}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        crosshairEnabled={crosshairEnabled}
        onCrosshairToggle={handleCrosshairToggle}
        magnetEnabled={magnetEnabled}
        onMagnetToggle={handleMagnetToggle}
        onDownload={handleDownload}
      />

        {/* Main Chart */}
        <div className="flex-1 relative min-h-0">
          <Card className="h-full bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/30">
            <div className="h-full p-4">
              {enhancedCandles.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center animate-pulse">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 animate-spin"></div>
                    <p className="text-lg font-medium text-slate-300 mb-2">Loading Market Data</p>
                    <p className="text-sm text-slate-500">Fetching {market.symbol} candlestick data...</p>
                  </div>
                </div>
              ) : (
                <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
                  {/* Background Grid */}
                  <defs>
                    <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgb(51, 65, 85)" strokeWidth="0.5" opacity="0.3"/>
                    </pattern>
                    <linearGradient id="bullishGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="rgb(5, 150, 105)" stopOpacity="0.9"/>
                    </linearGradient>
                    <linearGradient id="bearishGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="rgb(220, 38, 38)" stopOpacity="0.9"/>
                    </linearGradient>
                  </defs>
                  <rect width="100%" height={chartHeight} fill="url(#grid)" />
                  
                  {/* Price Grid Lines */}
                  {Array.from({ length: 8 }, (_, i) => {
                    const price = minPrice + (priceRange / 7) * i;
                    const y = scalePrice(price);
                    return (
                      <g key={`price-${i}`}>
                        <line 
                          x1={padding.left} 
                          y1={y} 
                          x2={chartWidth - padding.right} 
                          y2={y} 
                          stroke="rgb(100, 116, 139)" 
                          strokeWidth="0.5"
                          strokeDasharray="2,2"
                          opacity="0.3"
                        />
                        <text 
                          x={chartWidth - padding.right + 5} 
                          y={y + 4} 
                          fill="rgb(148, 163, 184)" 
                          fontSize="10" 
                          fontFamily="monospace"
                        >
                          ${price.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* EMA Lines */}
                  {indicators.ema && (
                    <g>
                      {enhancedCandles[0]?.ema20 && (
                        <polyline
                          points={enhancedCandles.map((d, i) => `${scaleX(i)},${scalePrice(d.ema20 || d.close)}`).join(' ')}
                          fill="none"
                          stroke="rgb(59, 130, 246)"
                          strokeWidth="2"
                          opacity="0.8"
                        />
                      )}
                      {enhancedCandles[0]?.ema50 && (
                        <polyline
                          points={enhancedCandles.map((d, i) => `${scaleX(i)},${scalePrice(d.ema50 || d.close)}`).join(' ')}
                          fill="none"
                          stroke="rgb(147, 51, 234)"
                          strokeWidth="2"
                          opacity="0.8"
                        />
                      )}
                      {enhancedCandles[0]?.ema200 && (
                        <polyline
                          points={enhancedCandles.map((d, i) => `${scaleX(i)},${scalePrice(d.ema200 || d.close)}`).join(' ')}
                          fill="none"
                          stroke="rgb(251, 146, 60)"
                          strokeWidth="2"
                          opacity="0.8"
                        />
                      )}
                    </g>
                  )}
                  
                  {/* VWAP Line */}
                  {indicators.vwap && enhancedCandles[0]?.vwap && (
                    <polyline
                      points={enhancedCandles.map((d, i) => `${scaleX(i)},${scalePrice(d.vwap || d.close)}`).join(' ')}
                      fill="none"
                      stroke="rgb(34, 197, 94)"
                      strokeWidth="2.5"
                      opacity="0.9"
                    />
                  )}
                  
                  {/* Bollinger Bands */}
                  {indicators.bollinger && (
                    <g>
                      {enhancedCandles[0]?.bollingerUpper && (
                        <polyline
                          points={enhancedCandles.map((d, i) => `${scaleX(i)},${scalePrice(d.bollingerUpper || d.close)}`).join(' ')}
                          fill="none"
                          stroke="rgb(251, 146, 60)"
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                          opacity="0.7"
                        />
                      )}
                      {enhancedCandles[0]?.bollingerLower && (
                        <polyline
                          points={enhancedCandles.map((d, i) => `${scaleX(i)},${scalePrice(d.bollingerLower || d.close)}`).join(' ')}
                          fill="none"
                          stroke="rgb(251, 146, 60)"
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                          opacity="0.7"
                        />
                      )}
                    </g>
                  )}
                  
                  {/* Candlesticks */}
                  {enhancedCandles.map((candle, i) => {
                    const x = scaleX(i);
                    const isGreen = candle.close >= candle.open;
                    const isSelected = selectedCandle?.timestamp === candle.timestamp;
                    const isHighlighted = highlightedTimestamp === candle.timestamp;
                    
                    const highY = scalePrice(candle.high);
                    const lowY = scalePrice(candle.low);
                    const openY = scalePrice(candle.open);
                    const closeY = scalePrice(candle.close);
                    
                    const bodyTop = Math.min(openY, closeY);
                    const bodyHeight = Math.abs(closeY - openY);
                    const candleWidth = 8;
                    
                    return (
                      <g key={`candle-${i}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                        {/* Selection/Highlight background */}
                        {(isSelected || isHighlighted) && (
                          <rect
                            x={x - 15}
                            y={highY}
                            width={30}
                            height={lowY - highY}
                            fill={isSelected ? "rgba(59, 130, 246, 0.2)" : "rgba(251, 146, 60, 0.15)"}
                            className={isSelected ? "animate-pulse" : ""}
                          />
                        )}
                        
                        {/* Wick */}
                        <line
                          x1={x}
                          y1={highY}
                          x2={x}
                          y2={lowY}
                          stroke={isGreen ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
                          strokeWidth="1.5"
                        />
                        
                        {/* Body */}
                        <rect
                          x={x - candleWidth/2}
                          y={bodyTop}
                          width={candleWidth}
                          height={Math.max(bodyHeight, 1)}
                          fill={isGreen ? 'url(#bullishGradient)' : 'url(#bearishGradient)'}
                          stroke={isGreen ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
                          strokeWidth="1"
                          opacity={isSelected ? 1 : 0.9}
                        />
                        
                        {/* Click area */}
                        <rect
                          x={x - 15}
                          y={highY}
                          width={30}
                          height={lowY - highY}
                          fill="transparent"
                          onClick={() => handleCandleClick(candle)}
                        />
                      </g>
                    );
                  })}
                  
                  {/* Current Price Line */}
                  {lastPrice && (
                    <>
                      <line 
                        x1={padding.left} 
                        y1={scalePrice(lastPrice.price)} 
                        x2={chartWidth - padding.right} 
                        y2={scalePrice(lastPrice.price)} 
                        stroke="rgb(6, 182, 212)" 
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        opacity="0.8"
                      />
                    </>
                  )}
                </svg>
              )}
            </div>
          </Card>
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

      {/* Candle News Panel */}
      <CandleNewsPanel
        isOpen={showCandleNewsPanel}
        onClose={() => setShowCandleNewsPanel(false)}
        candle={selectedCandle}
        symbol={market.symbol}
      />
    </div>
  );
};

// Legacy components removed - functionality moved to EnhancedChartCanvas