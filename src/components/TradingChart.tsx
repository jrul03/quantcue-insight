import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Stock } from "@/components/StockSearchSelector";
import { IndicatorConfig } from "@/components/TechnicalIndicators";
import { useLivePrice } from "@/hooks/useLivePrice";
import { useAggregates } from "@/hooks/useAggregates";

interface CandlestickData {
  timestamp: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi?: number;
  upperBB?: number;
  lowerBB?: number;
  middleBB?: number;
}

interface TradingChartProps {
  selectedStock: Stock;
  onPriceUpdate: (price: number, change: number) => void;
  activeIndicators: IndicatorConfig[];
}

export const TradingChart = ({ selectedStock, onPriceUpdate, activeIndicators }: TradingChartProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1m"|"5m"|"15m"|"1h"|"1D">('5m');

  // Use real data from hooks
  const { price: currentPrice, change: priceChange, changePct } = useLivePrice(selectedStock.symbol, true);
  const { candles, loading, error } = useAggregates(selectedStock.symbol, selectedTimeframe);

  // Convert candles to chart format with technical indicators
  const candlestickData: CandlestickData[] = candles.map((candle, index) => {
    // Simple EMA calculations (for display purposes)
    const ema20 = index >= 19 ? 
      candles.slice(Math.max(0, index - 19), index + 1)
        .reduce((sum, c) => sum + c.close, 0) / Math.min(20, index + 1) : candle.close;
    
    const ema50 = index >= 49 ?
      candles.slice(Math.max(0, index - 49), index + 1)
        .reduce((sum, c) => sum + c.close, 0) / Math.min(50, index + 1) : candle.close;

    return {
      timestamp: candle.timestamp,
      time: new Date(candle.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      ema20,
      ema50,
      ema200: ema50 * 0.995, // Simplified EMA200
      rsi: 30 + Math.random() * 40, // Will be replaced with proper RSI calculation
      upperBB: candle.close * 1.02,
      lowerBB: candle.close * 0.98,
      middleBB: candle.close
    };
  });

  // Update parent with price data
  useEffect(() => {
    if (currentPrice !== null && priceChange !== null) {
      onPriceUpdate(currentPrice, priceChange);
    }
  }, [currentPrice, priceChange, onPriceUpdate]);

  // Chart dimensions and scaling
  const chartWidth = 900;
  const chartHeight = 400;
  const volumeHeight = 80;
  const padding = { top: 20, right: 60, bottom: 40, left: 60 };
  
  // Calculate price and volume scales
  const allPrices = candlestickData.flatMap(d => [d.open, d.high, d.low, d.close]);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) * 0.998 : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) * 1.002 : 100;
  const priceRange = maxPrice - minPrice || 1;
  
  const maxVolume = candlestickData.length > 0 ? Math.max(...candlestickData.map(d => d.volume)) : 1;
  
  // Scale functions
  const scalePrice = (price: number) => 
    chartHeight - padding.bottom - ((price - minPrice) / priceRange) * (chartHeight - padding.top - padding.bottom);
  
  const scaleVolume = (volume: number) => 
    (volume / maxVolume) * volumeHeight;
  
  const scaleX = (index: number) => 
    candlestickData.length > 1 ? 
      padding.left + (index * (chartWidth - padding.left - padding.right)) / (candlestickData.length - 1) :
      padding.left;

  // Reset data when stock changes and fetch real data

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold font-mono">{selectedStock.symbol}</h2>
            <Badge variant="secondary" className="text-xs">
              {selectedStock.name}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-3xl font-mono font-bold">
              ${currentPrice ? currentPrice.toFixed(2) : 'Loading...'}
            </div>
            {(priceChange !== null || changePct !== null) && (
              <div className={`flex items-center gap-1 ${(priceChange || 0) >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                {(priceChange || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-mono">
                  {(priceChange || 0) >= 0 ? '+' : ''}{(priceChange || 0).toFixed(2)} ({(changePct || 0).toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['1m', '5m', '15m', '1h', '1D'] as const).map((timeframe) => (
            <Badge 
              key={timeframe}
              variant="outline" 
              className={`text-xs cursor-pointer transition-all hover:bg-primary/20 ${
                selectedTimeframe === timeframe 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe === '1D' ? '1D' : timeframe.toUpperCase()}
            </Badge>
          ))}
        </div>
      </div>

      {/* Chart renders with real data or loading state */}
      <Card className="flex-1 chart-container relative bg-[#0a0a0a] border-gray-800">
          <div className="h-full p-4">
            {loading && candlestickData.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading chart data...</div>
              </div>
            )}
            
            {error && candlestickData.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-red-400">Error loading chart: {error}</div>
              </div>
            )}
            
            {candlestickData.length > 0 && (
              <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight + volumeHeight + 40}`}>
                {/* Background Grid */}
                <defs>
                  <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#1f2937" strokeWidth="0.5"/>
                  </pattern>
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
                        stroke="#374151" 
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                      />
                      <text 
                        x={chartWidth - padding.right + 5} 
                        y={y + 4} 
                        fill="#9ca3af" 
                        fontSize="10" 
                        fontFamily="monospace"
                      >
                        ${price.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
                
                {/* Time Labels */}
                {candlestickData.map((candle, i) => {
                  if (i % 5 !== 0) return null; // Show every 5th time label
                  const x = scaleX(i);
                  return (
                    <text 
                      key={`time-${i}`}
                      x={x} 
                      y={chartHeight - 5} 
                      fill="#9ca3af" 
                      fontSize="10" 
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {candle.time}
                    </text>
                  );
                })}
                
                {/* EMA Lines */}
                {activeIndicators.find(i => i.id === 'ema20' && i.enabled) && (
                  <polyline
                    points={candlestickData.map((d, i) => `${scaleX(i)},${scalePrice(d.ema20 || d.close)}`).join(' ')}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                )}
                
                {activeIndicators.find(i => i.id === 'ema50' && i.enabled) && (
                  <polyline
                    points={candlestickData.map((d, i) => `${scaleX(i)},${scalePrice(d.ema50 || d.close)}`).join(' ')}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                )}
                
                {/* Candlesticks */}
                {candlestickData.map((candle, i) => {
                  const x = scaleX(i);
                  const isGreen = candle.close >= candle.open;
                  const color = isGreen ? '#10b981' : '#ef4444';
                  
                  const highY = scalePrice(candle.high);
                  const lowY = scalePrice(candle.low);
                  const openY = scalePrice(candle.open);
                  const closeY = scalePrice(candle.close);
                  
                  const bodyTop = Math.min(openY, closeY);
                  const bodyHeight = Math.abs(closeY - openY);
                  const candleWidth = 8;
                  
                  return (
                    <g key={`candle-${i}`} className="candle-group">
                      {/* Wick */}
                      <line
                        x1={x}
                        y1={highY}
                        x2={x}
                        y2={lowY}
                        stroke={color}
                        strokeWidth="1.5"
                      />
                      
                      {/* Body */}
                      <rect
                        x={x - candleWidth/2}
                        y={bodyTop}
                        width={candleWidth}
                        height={Math.max(bodyHeight, 1)}
                        fill={isGreen ? color : 'transparent'}
                        stroke={color}
                        strokeWidth="1.5"
                      />
                      
                      {/* Hover area for tooltip */}
                      <rect
                        x={x - 15}
                        y={highY}
                        width={30}
                        height={lowY - highY}
                        fill="transparent"
                        className="hover:fill-white/5 cursor-crosshair"
                      >
                        <title>
                          {`${candle.time}
O: $${candle.open.toFixed(2)}
H: $${candle.high.toFixed(2)}
L: $${candle.low.toFixed(2)}
C: $${candle.close.toFixed(2)}
Vol: ${(candle.volume / 1000000).toFixed(1)}M`}
                        </title>
                      </rect>
                    </g>
                  );
                })}
                
                {/* Current Price Line */}
                {currentPrice && (
                  <>
                    <line 
                      x1={padding.left} 
                      y1={scalePrice(currentPrice)} 
                      x2={chartWidth - padding.right} 
                      y2={scalePrice(currentPrice)} 
                      stroke="#06b6d4" 
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      opacity="0.8"
                    />
                    
                    {/* Current Price Label */}
                    <rect
                      x={chartWidth - padding.right + 5}
                      y={scalePrice(currentPrice) - 10}
                      width="50"
                      height="20"
                      fill="#06b6d4"
                      rx="3"
                    />
                    <text
                      x={chartWidth - padding.right + 30}
                      y={scalePrice(currentPrice) + 4}
                      fill="white"
                      fontSize="11"
                      textAnchor="middle"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      ${currentPrice.toFixed(2)}
                    </text>
                  </>
                )}
                
                {/* Volume Chart */}
                <g transform={`translate(0, ${chartHeight + 20})`}>
                  {candlestickData.map((candle, i) => {
                    const x = scaleX(i);
                    const height = scaleVolume(candle.volume);
                    const isGreen = candle.close >= candle.open;
                    const color = isGreen ? '#10b98150' : '#ef444450';
                    
                    return (
                      <rect
                        key={`volume-${i}`}
                        x={x - 4}
                        y={volumeHeight - height}
                        width={8}
                        height={height}
                        fill={color}
                      />
                    );
                  })}
                  
                  {/* Volume axis */}
                  <text 
                    x={padding.left - 5} 
                    y={10} 
                    fill="#9ca3af" 
                    fontSize="10"
                    textAnchor="end"
                  >
                    Vol
                  </text>
                </g>
              </svg>
            )}
          </div>
          
          {/* Live Indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded px-3 py-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">LIVE</span>
          </div>
        </Card>
    </div>
  );
};