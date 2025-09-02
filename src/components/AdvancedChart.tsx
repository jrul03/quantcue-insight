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

  // Map timeframe to hook resolution format
  const mapTimeframeToResolution = (tf: '1m' | '5m' | '15m' | '1h' | '1D'): "1"|"5"|"15"|"60"|"D" => {
    switch (tf) {
      case '1m': return '1';
      case '5m': return '5';
      case '15m': return '15';
      case '1h': return '60';
      case '1D': return 'D';
      default: return '5';
    }
  };

  const candlesData = useCandles(market.symbol, mapTimeframeToResolution(selectedTimeframe));
  const candles = candlesData.data || [];

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

  return (
    <div className="h-full flex flex-col">
      {/* Indicator Toggles */}
      <IndicatorToggles 
        indicators={indicators}
        onToggle={handleIndicatorToggle}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Chart Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900/30 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{market.symbol}</h2>
              <p className="text-sm text-slate-400">Real-time chart</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-mono font-bold transition-all duration-300 ${
                market.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${displayPrice.toFixed(2)}
              </div>
              
              <div className={`flex items-center gap-1 transition-all duration-300 ${
                market.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <span className="text-sm">
                  {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)} 
                  ({market.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-1">
            {(['1m', '5m', '15m', '1h', '1D'] as const).map((tf) => (
              <Button
                key={tf}
                variant={selectedTimeframe === tf ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(tf)}
                className={`text-xs transition-all duration-200 ${
                  selectedTimeframe === tf 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'border-slate-600 text-slate-300 hover:text-white hover:border-slate-500'
                }`}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800 p-4">
          <ChartCanvas 
            candles={enhancedCandles}
            selectedCandle={selectedCandle}
            onCandleClick={setSelectedCandle}
            indicators={indicators}
            timeframe={selectedTimeframe}
            highlightedTimestamp={highlightedTimestamp}
            market={market}
          />
        </div>

        {/* Sub Charts */}
        <SubCharts 
          showRSI={indicators.rsi}
          showMACD={indicators.macd}
          symbol={market.symbol}
          className="px-4 pb-4"
        />
      </div>

      {/* Move Analysis Drawer */}
      <CandleMoveAnalysisDrawer
        isOpen={showMoveAnalysisDrawer}
        onClose={() => setShowMoveAnalysisDrawer(false)}
        candle={selectedCandle}
        symbol={market.symbol}
      />
    </div>
  );
};

// Simplified chart canvas for demo
interface ChartCanvasProps {
  candles: Array<CandleData & {
    ema50?: number | null;
    ema200?: number | null;
    vwap?: number | null;
    bollingerUpper?: number | null;
    bollingerLower?: number | null;
  }>;
  selectedCandle: CandleData | null;
  onCandleClick: (candle: CandleData) => void;
  indicators: IndicatorState;
  timeframe: string;
  highlightedTimestamp: number | null;
  market: Market;
}

const ChartCanvas = ({ candles, selectedCandle, onCandleClick, indicators, timeframe, highlightedTimestamp, market }: ChartCanvasProps) => {
  if (!candles.length) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-800/20 rounded-lg">
        <div className="text-center animate-pulse">
          <div className="w-8 h-8 bg-slate-600 rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-slate-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  const maxPrice = Math.max(...candles.map(c => c.high));
  const minPrice = Math.min(...candles.map(c => c.low));
  const priceRange = maxPrice - minPrice;

  return (
    <div className="h-full w-full bg-slate-800/20 rounded-lg overflow-hidden relative">
      <CandlestickVisualization 
        candles={candles}
        indicators={indicators}
        onCandleClick={onCandleClick}
        selectedCandle={selectedCandle}
        highlightedTimestamp={highlightedTimestamp}
      />
    </div>
  );
};

interface CandlestickVisualizationProps {
  candles: Array<CandleData & {
    ema50?: number | null;
    ema200?: number | null;
    vwap?: number | null;
    bollingerUpper?: number | null;
    bollingerLower?: number | null;
  }>;
  indicators: IndicatorState;
  onCandleClick: (candle: CandleData) => void;
  selectedCandle: CandleData | null;
  highlightedTimestamp: number | null;
}

const CandlestickVisualization = ({ candles, indicators, onCandleClick, selectedCandle, highlightedTimestamp }: CandlestickVisualizationProps) => {
  const maxPrice = Math.max(...candles.map(c => c.high));
  const minPrice = Math.min(...candles.map(c => c.low));
  const priceRange = maxPrice - minPrice;

  return (
    <div className="w-full h-full relative">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(30, 41, 59)" />
            <stop offset="100%" stopColor="rgb(15, 23, 42)" />
          </linearGradient>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#chartGradient)" />

        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8].map(y => (
          <line
            key={y}
            x1="0%"
            y1={`${y * 100}%`}
            x2="100%"
            y2={`${y * 100}%`}
            stroke="rgba(100, 116, 139, 0.1)"
            strokeWidth="0.1"
          />
        ))}

        {/* EMA Cloud */}
        {indicators.ema && (
          <g className="animate-fade-in">
            <defs>
              <linearGradient id="emaCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                <stop offset="50%" stopColor="rgb(147, 51, 234)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            
            {/* EMA Cloud Area */}
            <path
              d={candles.map((candle, index) => {
                if (!candle.ema50 || !candle.ema200) return '';
                const x = (index / (candles.length - 1)) * 100;
                const y50 = ((maxPrice - candle.ema50) / priceRange) * 100;
                const y200 = ((maxPrice - candle.ema200) / priceRange) * 100;
                
                if (index === 0) {
                  return `M ${x}% ${y50}% L ${x}% ${y200}%`;
                }
                return ` L ${x}% ${y50}%`;
              }).join('') + candles.map((candle, index) => {
                if (!candle.ema200) return '';
                const x = (((candles.length - 1) - index) / (candles.length - 1)) * 100;
                const y200 = ((maxPrice - candle.ema200) / priceRange) * 100;
                return ` L ${x}% ${y200}%`;
              }).reverse().join('') + ' Z'}
              fill="url(#emaCloudGradient)"
              className="transition-opacity duration-300"
            />
            
            {/* EMA Lines */}
            <path
              d={candles.map((candle, index) => {
                if (!candle.ema50) return '';
                const x = (index / (candles.length - 1)) * 100;
                const y = ((maxPrice - candle.ema50) / priceRange) * 100;
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
              }).join(' ')}
              stroke="rgb(59, 130, 246)"
              strokeWidth="1.5"
              fill="none"
              className="animate-fade-in"
            />
            <path
              d={candles.map((candle, index) => {
                if (!candle.ema200) return '';
                const x = (index / (candles.length - 1)) * 100;
                const y = ((maxPrice - candle.ema200) / priceRange) * 100;
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
              }).join(' ')}
              stroke="rgb(147, 51, 234)"
              strokeWidth="1.5"
              fill="none"
              className="animate-fade-in"
            />
          </g>
        )}

        {/* Bollinger Bands */}
        {indicators.bollinger && (
          <g className="animate-fade-in">
            <path
              d={candles.map((candle, index) => {
                if (!candle.bollingerUpper) return '';
                const x = (index / (candles.length - 1)) * 100;
                const y = ((maxPrice - candle.bollingerUpper) / priceRange) * 100;
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
              }).join(' ')}
              stroke="rgb(251, 146, 60)"
              strokeWidth="1"
              strokeDasharray="3,3"
              fill="none"
              opacity="0.8"
            />
            <path
              d={candles.map((candle, index) => {
                if (!candle.bollingerLower) return '';
                const x = (index / (candles.length - 1)) * 100;
                const y = ((maxPrice - candle.bollingerLower) / priceRange) * 100;
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
              }).join(' ')}
              stroke="rgb(251, 146, 60)"
              strokeWidth="1"
              strokeDasharray="3,3"
              fill="none"
              opacity="0.8"
            />
          </g>
        )}

        {/* VWAP */}
        {indicators.vwap && (
          <path
            d={candles.map((candle, index) => {
              if (!candle.vwap) return '';
              const x = (index / (candles.length - 1)) * 100;
              const y = ((maxPrice - candle.vwap) / priceRange) * 100;
              return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
            }).join(' ')}
            stroke="rgb(34, 197, 94)"
            strokeWidth="2"
            fill="none"
            className="animate-fade-in"
            opacity="0.9"
          />
        )}

        {/* Candlesticks */}
        {candles.map((candle, index) => {
          const x = (index / (candles.length - 1)) * 100;
          const openY = ((maxPrice - candle.open) / priceRange) * 100;
          const closeY = ((maxPrice - candle.close) / priceRange) * 100;
          const highY = ((maxPrice - candle.high) / priceRange) * 100;
          const lowY = ((maxPrice - candle.low) / priceRange) * 100;
          
          const isUp = candle.close >= candle.open;
          const isSelected = selectedCandle?.timestamp === candle.timestamp;
          
          return (
            <g 
              key={candle.timestamp}
              className="cursor-pointer transition-all duration-200 hover:opacity-80"
              onClick={() => onCandleClick(candle)}
            >
              {/* Selection highlight */}
              {isSelected && (
                <rect
                  x={`${x - 0.5}%`}
                  y="0%"
                  width="1%"
                  height="100%"
                  fill="rgba(59, 130, 246, 0.2)"
                  className="animate-pulse"
                />
              )}
              
              {/* Wick */}
              <line
                x1={`${x}%`}
                y1={`${highY}%`}
                x2={`${x}%`}
                y2={`${lowY}%`}
                stroke={isUp ? '#22c55e' : '#ef4444'}
                strokeWidth="0.2"
              />
              
              {/* Body */}
              <rect
                x={`${x - 0.3}%`}
                y={`${Math.min(openY, closeY)}%`}
                width="0.6%"
                height={`${Math.abs(closeY - openY)}%`}
                fill={isUp ? '#22c55e' : '#ef4444'}
                className="transition-all duration-300"
                opacity={isSelected ? 1 : 0.9}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};