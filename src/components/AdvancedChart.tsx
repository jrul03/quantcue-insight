import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CandleAnalysisPanel } from "./CandleAnalysisPanel";

interface Market {
  symbol: string;
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

interface DrawingElement {
  id: string;
  type: 'trendline' | 'support' | 'resistance' | 'fibonacci' | 'rectangle';
  points: Array<{x: number, y: number}>;
  color: string;
  timestamp: number;
}

interface AdvancedChartProps {
  market: Market;
  drawingTool: string;
  marketData: MarketData;
}

export const AdvancedChart = ({ market, drawingTool, marketData }: AdvancedChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const throttleRef = useRef<number>(0);
  
  // Ring buffer for performance (max 5000 candles)
  const MAX_CANDLES = 5000;
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<DrawingElement> | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1s');
  const [showVolume, setShowVolume] = useState(true);
  const [showIndicators, setShowIndicators] = useState(true);
  const [autoScale, setAutoScale] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'Connected' | 'Reconnecting' | 'Offline'>('Connected');
  const [selectedCandle, setSelectedCandle] = useState<CandleData | null>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [highlightedTimestamp, setHighlightedTimestamp] = useState<number | null>(null);

  // Get interval in milliseconds based on timeframe
  const getIntervalMs = useCallback((timeframe: string): number => {
    switch (timeframe) {
      case '1s': return 1000;
      case '5s': return 5000;
      case '1m': return 60000;
      case '5m': return 300000;
      case '1H': return 3600000;
      case '4H': return 14400000;
      case '1D': return 86400000;
      case '1W': return 604800000;
      default: return 3600000;
    }
  }, []);

  // Generate realistic candlestick data
  const generateCandleData = useCallback((basePrice: number, periods: number = 100): CandleData[] => {
    const data: CandleData[] = [];
    let price = basePrice;
    const now = Date.now();
    const intervalMs = getIntervalMs(selectedTimeframe);
    
    for (let i = periods - 1; i >= 0; i--) {
      const timestamp = now - i * intervalMs;
      const volatility = 0.02 * marketData.volatility * (selectedTimeframe === '1s' || selectedTimeframe === '5s' ? 0.1 : 1);
      
      const priceChange = (Math.random() - 0.5) * volatility * price;
      const open = price;
      const close = price + priceChange;
      
      const range = Math.abs(close - open) * (1 + Math.random());
      const high = Math.max(open, close) + range * Math.random();
      const low = Math.min(open, close) - range * Math.random();
      
      const volume = 1000000 * (0.5 + Math.random() * 1.5) * marketData.volume;
      
      // Technical indicators
      const ema20 = data.length > 0 ? (close * 0.1 + (data[data.length - 1].ema20 || close) * 0.9) : close;
      const ema50 = data.length > 0 ? (close * 0.04 + (data[data.length - 1].ema50 || close) * 0.96) : close;
      const rsi = 30 + Math.random() * 40; // Simplified RSI
      
      data.push({
        timestamp,
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: selectedTimeframe === '1s' || selectedTimeframe === '5s' ? '2-digit' : undefined,
          hour12: false 
        }),
        open,
        high,
        low,
        close,
        volume,
        ema20,
        ema50,
        rsi,
        sentiment: marketData.sentiment + (Math.random() - 0.5) * 0.2
      });
      
      price = close;
    }
    
    return data;
  }, [selectedTimeframe, marketData, getIntervalMs]);


  // Throttled update function
  const throttledUpdate = useCallback((updateFn: () => void, throttleMs: number = 250) => {
    const now = Date.now();
    if (now - throttleRef.current > throttleMs) {
      throttleRef.current = now;
      updateFn();
    }
  }, []);

  // Initialize chart data
  useEffect(() => {
    setCandleData(generateCandleData(market.price));
  }, [market.symbol, generateCandleData]);

  // Throttled live data updates with smart bar management
  useEffect(() => {
    if (!isLive) return;

    const intervalMs = getIntervalMs(selectedTimeframe);
    const updateInterval = selectedTimeframe === '1s' ? 1000 : selectedTimeframe === '5s' ? 5000 : Math.min(intervalMs, 5000);

    const interval = setInterval(() => {
      throttledUpdate(() => {
        setCandleData(prev => {
          if (prev.length === 0) return prev;
          
          const lastCandle = prev[prev.length - 1];
          const newTimestamp = Date.now();
          const intervalMs = getIntervalMs(selectedTimeframe);
          
          // Check if we should update current bar or create new one
          const shouldCreateNewBar = newTimestamp - lastCandle.timestamp >= intervalMs;
          
          const volatility = 0.01 * marketData.volatility * (selectedTimeframe === '1s' || selectedTimeframe === '5s' ? 0.1 : 1);
          const priceChange = (Math.random() - 0.5) * volatility * lastCandle.close;
          
          if (shouldCreateNewBar) {
            // Create new candle
            const open = lastCandle.close;
            const close = open + priceChange;
            const range = Math.abs(close - open) * (1 + Math.random());
            const high = Math.max(open, close) + range * Math.random();
            const low = Math.min(open, close) - range * Math.random();
            const volume = 1000000 * (0.5 + Math.random() * 1.5) * marketData.volume;
            
            const newCandle: CandleData = {
              timestamp: newTimestamp,
              time: new Date(newTimestamp).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: selectedTimeframe === '1s' || selectedTimeframe === '5s' ? '2-digit' : undefined,
                hour12: false 
              }),
              open,
              high,
              low,
              close,
              volume,
              ema20: close * 0.1 + (lastCandle.ema20 || close) * 0.9,
              ema50: close * 0.04 + (lastCandle.ema50 || close) * 0.96,
              rsi: 30 + Math.random() * 40,
              sentiment: marketData.sentiment + (Math.random() - 0.5) * 0.2
            };
            
            // Ring buffer management
            const newData = [...prev, newCandle];
            return newData.length > MAX_CANDLES ? newData.slice(-MAX_CANDLES) : newData;
          } else {
            // Update current candle in place
            const updatedCandle = { ...lastCandle };
            const newClose = lastCandle.open + priceChange;
            updatedCandle.close = newClose;
            updatedCandle.high = Math.max(updatedCandle.high, newClose);
            updatedCandle.low = Math.min(updatedCandle.low, newClose);
            updatedCandle.volume += Math.random() * 10000; // Add volume
            updatedCandle.ema20 = newClose * 0.1 + (updatedCandle.ema20 || newClose) * 0.9;
            updatedCandle.ema50 = newClose * 0.04 + (updatedCandle.ema50 || newClose) * 0.96;
            
            return [...prev.slice(0, -1), updatedCandle];
          }
        });
      }, selectedTimeframe === '1s' || selectedTimeframe === '5s' ? 250 : 500);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [marketData, selectedTimeframe, isLive, throttledUpdate, getIntervalMs]);

  // Memoized stable price scale
  const stablePriceScale = useMemo(() => {
    if (candleData.length === 0) return { min: market.price * 0.95, max: market.price * 1.05 };
    
    const prices = candleData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = Math.max(priceRange * 0.1, market.price * 0.01); // Minimum 1% padding
    
    return {
      min: minPrice - padding,
      max: maxPrice + padding
    };
  }, [candleData, market.price, autoScale]);

  // Stable rendering - only when data changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candleData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 60, bottom: showVolume ? 120 : 40, left: 60 };
    const chartHeight = height - padding.top - padding.bottom;
    const volumeHeight = showVolume ? 80 : 0;
    const priceHeight = chartHeight - volumeHeight - (volumeHeight > 0 ? 20 : 0);

    // Clear canvas with background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const priceRange = stablePriceScale.max - stablePriceScale.min;
    if (priceRange === 0) return;

    // Stable scaling functions
    const scalePrice = (price: number) => 
      padding.top + (1 - (price - stablePriceScale.min) / priceRange) * priceHeight;

    const scaleX = (index: number) => 
      padding.left + (index / Math.max(candleData.length - 1, 1)) * (width - padding.left - padding.right);

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const y = padding.top + (i / 10) * priceHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Draw price labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    for (let i = 0; i <= 5; i++) {
      const price = stablePriceScale.min + (priceRange * i / 5);
      const y = scalePrice(price);
      ctx.fillText(`$${price.toFixed(2)}`, width - padding.right + 5, y + 3);
    }

    // Draw EMA lines if enabled
    if (showIndicators) {
      // EMA 20
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      candleData.forEach((candle, i) => {
        if (candle.ema20) {
          const x = scaleX(i);
          const y = scalePrice(candle.ema20);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // EMA 50
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      candleData.forEach((candle, i) => {
        if (candle.ema50) {
          const x = scaleX(i);
          const y = scalePrice(candle.ema50);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw candlesticks
    candleData.forEach((candle, i) => {
      const x = scaleX(i);
      const isGreen = candle.close >= candle.open;
      const isHighlighted = highlightedTimestamp && Math.abs(candle.timestamp - highlightedTimestamp) < 60000;
      const color = isGreen ? '#10b981' : '#ef4444';
      const highlightColor = isHighlighted ? '#fbbf24' : color;
      
      const openY = scalePrice(candle.open);
      const closeY = scalePrice(candle.close);
      const highY = scalePrice(candle.high);
      const lowY = scalePrice(candle.low);
      
      const candleWidth = Math.max(2, (width - padding.left - padding.right) / candleData.length * 0.8);
      
      // Highlight background for selected/highlighted candle
      if (isHighlighted || (selectedCandle && candle.timestamp === selectedCandle.timestamp)) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
        ctx.fillRect(x - candleWidth, padding.top, candleWidth * 2, priceHeight);
      }
      
      // Draw wick
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      ctx.fillStyle = isGreen ? highlightColor : 'transparent';
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = isHighlighted ? 2 : 1;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      
      if (isGreen) {
        ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, Math.max(bodyHeight, 1));
      } else {
        ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, Math.max(bodyHeight, 1));
      }

      // Sentiment overlay (subtle background color)
      if (candle.sentiment && showIndicators) {
        const sentimentAlpha = Math.abs(candle.sentiment - 0.5) * 0.1;
        const sentimentColor = candle.sentiment > 0.5 ? `rgba(16, 185, 129, ${sentimentAlpha})` : `rgba(239, 68, 68, ${sentimentAlpha})`;
        ctx.fillStyle = sentimentColor;
        ctx.fillRect(x - candleWidth/2, padding.top, candleWidth, priceHeight);
      }
    });

    // Draw volume if enabled
    if (showVolume && volumeHeight > 0) {
      const volumeTop = padding.top + priceHeight + 20;
      const maxVolume = Math.max(...candleData.map(d => d.volume));
      
      candleData.forEach((candle, i) => {
        const x = scaleX(i);
        const volumeHeightPx = (candle.volume / maxVolume) * volumeHeight;
        const isGreen = candle.close >= candle.open;
        const color = isGreen ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)';
        
        ctx.fillStyle = color;
        const candleWidth = Math.max(2, (width - padding.left - padding.right) / candleData.length * 0.8);
        ctx.fillRect(x - candleWidth/2, volumeTop + volumeHeight - volumeHeightPx, candleWidth, volumeHeightPx);
      });
      
      // Volume label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Volume', padding.left, volumeTop - 5);
    }

    // Draw drawing elements
    drawingElements.forEach(element => {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = 2;
      ctx.setLineDash(element.type === 'support' || element.type === 'resistance' ? [5, 5] : []);
      
      if (element.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(element.points[0].x, element.points[0].y);
        for (let i = 1; i < element.points.length; i++) {
          ctx.lineTo(element.points[i].x, element.points[i].y);
        }
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    });

    // Current price line
    const currentPriceY = scalePrice(market.price);
    ctx.strokeStyle = '#06b6d4';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, currentPriceY);
    ctx.lineTo(width - padding.right, currentPriceY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price label
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(width - padding.right + 2, currentPriceY - 8, 50, 16);
    ctx.fillStyle = 'white';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`$${market.price.toFixed(2)}`, width - padding.right + 27, currentPriceY + 3);
    
  }, [candleData, drawingElements, market.price, showVolume, showIndicators, stablePriceScale, highlightedTimestamp, selectedCandle]);

  // Mouse event handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingTool !== 'select') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const width = rect.width;
    const padding = { left: 60, right: 60 };
    
    // Calculate which candle was clicked
    const chartWidth = width - padding.left - padding.right;
    const candleIndex = Math.round(((x - padding.left) / chartWidth) * (candleData.length - 1));
    
    if (candleIndex >= 0 && candleIndex < candleData.length) {
      const clickedCandle = candleData[candleIndex];
      setSelectedCandle(clickedCandle);
      setShowAnalysisPanel(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingTool === 'select') {
      handleCanvasClick(e);
      return;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentDrawing({
      id: Date.now().toString(),
      type: drawingTool as any,
      points: [{ x, y }],
      color: drawingTool === 'support' ? '#10b981' : drawingTool === 'resistance' ? '#ef4444' : '#06b6d4',
      timestamp: Date.now()
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentDrawing) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentDrawing(prev => ({
      ...prev!,
      points: prev!.points!.length === 1 ? [...prev!.points!, { x, y }] : [prev!.points![0], { x, y }]
    }));
  };

  const handleMouseUp = () => {
    if (isDrawing && currentDrawing && currentDrawing.points && currentDrawing.points.length >= 2) {
      setDrawingElements(prev => [...prev, currentDrawing as DrawingElement]);
    }
    setIsDrawing(false);
    setCurrentDrawing(null);
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Chart Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="flex gap-1 bg-slate-900/80 backdrop-blur-sm rounded-lg p-1 border border-slate-700/50">
          {['1s', '5s', '1m', '5m', '1H', '4H', '1D', '1W'].map((tf) => (
            <Button
              key={tf}
              size="sm"
              variant={selectedTimeframe === tf ? "default" : "ghost"}
              onClick={() => setSelectedTimeframe(tf)}
              className="text-xs h-7 px-2 pointer-events-auto"
            >
              {tf}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-1 bg-slate-900/80 backdrop-blur-sm rounded-lg p-1 border border-slate-700/50">
          <Button
            size="sm"
            variant={autoScale ? "default" : "ghost"}
            onClick={() => setAutoScale(!autoScale)}
            className="text-xs h-7 px-2 pointer-events-auto"
            title="Auto-scale Y axis"
          >
            Auto
          </Button>
          <Button
            size="sm"
            variant={showIndicators ? "default" : "ghost"}
            onClick={() => setShowIndicators(!showIndicators)}
            className="text-xs h-7 px-2 pointer-events-auto"
          >
            Indicators
          </Button>
          <Button
            size="sm"
            variant={showVolume ? "default" : "ghost"}
            onClick={() => setShowVolume(!showVolume)}
            className="text-xs h-7 px-2 pointer-events-auto"
          >
            Volume
          </Button>
        </div>

        {/* Live/Pause Toggle */}
        <div className="flex gap-1 bg-slate-900/80 backdrop-blur-sm rounded-lg p-1 border border-slate-700/50">
          <Button
            size="sm"
            variant={isLive ? "default" : "ghost"}
            onClick={() => setIsLive(!isLive)}
            className="text-xs h-7 px-2 pointer-events-auto"
          >
            {isLive ? "▸ Live" : "⏸ Paused"}
          </Button>
          <Badge 
            variant={connectionStatus === 'Connected' ? 'default' : connectionStatus === 'Reconnecting' ? 'secondary' : 'destructive'}
            className="text-xs h-7 px-2 flex items-center"
          >
            {connectionStatus}
          </Badge>
        </div>
      </div>

      {/* Technical Analysis Summary */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-slate-400">RSI:</span>
            <span className="ml-1 text-blue-400">
              {candleData.length > 0 ? candleData[candleData.length - 1].rsi?.toFixed(1) : '0.0'}
            </span>
          </div>
          <div>
            <span className="text-slate-400">EMA20:</span>
            <span className="ml-1 text-cyan-400">
              ${candleData.length > 0 ? candleData[candleData.length - 1].ema20?.toFixed(2) : '0.00'}
            </span>
          </div>
          <div>
            <span className="text-slate-400">EMA50:</span>
            <span className="ml-1 text-amber-400">
              ${candleData.length > 0 ? candleData[candleData.length - 1].ema50?.toFixed(2) : '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 w-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: drawingTool !== 'select' ? 'crosshair' : 'pointer' }}
      />

      {/* Chart Status Bar */}
      <div className="h-8 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-between px-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>Last Update: {new Date().toLocaleTimeString()}</span>
          <span>Drawings: {drawingElements.length}</span>
          <span>Memory: {candleData.length}/{MAX_CANDLES} bars</span>
          {drawingTool === 'select' && <span className="text-yellow-400">Click candles to analyze</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>Scale: {autoScale ? 'Auto' : 'Manual'}</span>
          <span>Interval: {selectedTimeframe}</span>
          {process.env.NODE_ENV === 'development' && (
            <span className="text-green-400">FPS: {selectedTimeframe === '1s' || selectedTimeframe === '5s' ? '30' : '60'}</span>
          )}
        </div>
      </div>

      {/* Analysis Panel */}
      {showAnalysisPanel && selectedCandle && (
        <CandleAnalysisPanel
          candle={selectedCandle}
          asset={{ symbol: market.symbol, assetClass: market.assetClass }}
          onClose={() => {
            setShowAnalysisPanel(false);
            setSelectedCandle(null);
            setHighlightedTimestamp(null);
          }}
          onHighlightCandle={(timestamp) => setHighlightedTimestamp(timestamp)}
        />
      )}
    </div>
  );
};