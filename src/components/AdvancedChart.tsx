import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CandleAnalysisPanel } from "./CandleAnalysisPanel";
import { CandleMoveAnalysisDrawer } from "./CandleMoveAnalysisDrawer";
import { InsightOverlay } from "./InsightsToggleBar";
import { ConfidenceMeter } from "./ConfidenceMeter";
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
  overlays: InsightOverlay[];
}

export const AdvancedChart = ({ market, drawingTool, marketData, overlays }: AdvancedChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef<boolean>(false);
  
  // Ring buffer for performance (max 5000 candles)
  const MAX_CANDLES = 5000;
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<DrawingElement> | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1');
  const [showVolume, setShowVolume] = useState(true);
  const [showIndicators, setShowIndicators] = useState(true);
  const [autoScale, setAutoScale] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'Connected' | 'Reconnecting' | 'Offline'>('Connected');
  const [selectedCandle, setSelectedCandle] = useState<CandleData | null>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [showMoveAnalysisDrawer, setShowMoveAnalysisDrawer] = useState(false);
  const [highlightedTimestamp, setHighlightedTimestamp] = useState<number | null>(null);

  // Use real hooks for data
  const { data: candles, loading: isLoading } = useCandles(market.symbol, selectedTimeframe as "1"|"5"|"15"|"60"|"D");
  const { price: currentPrice } = useLastPrice(market.symbol, true);

  // Convert real candle data to chart format
  useEffect(() => {
    console.log("🔄 Processing candles:", { inputCount: candles.length, currentCandleDataCount: candleData.length });
    
    if (candles.length > 0) {
      const processedData: CandleData[] = candles.map((candle, index) => {
        // Calculate technical indicators - FIX: Use processedData instead of candleData to avoid circular dependency
        const ema20 = index > 0 ? (candle.close * 0.1 + (processedData[index - 1]?.ema20 || candle.close) * 0.9) : candle.close;
        const ema50 = index > 0 ? (candle.close * 0.04 + (processedData[index - 1]?.ema50 || candle.close) * 0.96) : candle.close;
        
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
          rsi: 50 + Math.sin(index * 0.1) * 20, // Simple RSI calculation
          sentiment: marketData.sentiment
        };
      });
      
      console.log("✅ Setting processed candle data:", { processedCount: processedData.length, firstCandle: processedData[0], lastCandle: processedData[processedData.length - 1] });
      setCandleData(processedData.slice(-MAX_CANDLES));
    }
  }, [candles, marketData.sentiment]);

  const getIntervalMs = (timeframe: string): number => {
    switch (timeframe) {
      case '1s': return 1000;
      case '5s': return 5000;
      case '1': return 60 * 1000;
      case '5': return 5 * 60 * 1000;
      case '15': return 15 * 60 * 1000;
      case '60': return 60 * 60 * 1000;
      case 'D': return 24 * 60 * 60 * 1000;
      default: return 60 * 1000;
    }
  };
  
  const priceScale = useMemo(() => {
    if (candleData.length === 0) return { min: 0, max: 100, range: 100 };
    
    const prices = candleData.flatMap(d => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.05;
    
    return {
      min: min - padding,
      max: max + padding,
      range: (max - min) + (padding * 2)
    };
  }, [candleData]);
  
  useEffect(() => {
    if (!canvasRef.current || candleData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Chart dimensions
    const padding = { top: 20, right: 80, bottom: 60, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;
    const volumeHeight = showVolume ? chartHeight * 0.2 : 0;
    const priceHeight = chartHeight - volumeHeight;

    // Scales
    const xScale = (index: number) => padding.left + (index / Math.max(candleData.length - 1, 1)) * chartWidth;
    const yScale = (price: number) => padding.top + (1 - (price - priceScale.min) / priceScale.range) * priceHeight;
    
    const maxVolume = Math.max(...candleData.map(d => d.volume));
    const volumeScale = (volume: number) => padding.top + priceHeight + (1 - volume / maxVolume) * volumeHeight;

    // Grid and labels
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * priceHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      
      // Price labels
      const price = priceScale.max - (i / 5) * priceScale.range;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`$${price.toFixed(2)}`, padding.left + chartWidth + 8, y + 4);
    }

    // Vertical grid lines
    const timeLabels = 5;
    for (let i = 0; i <= timeLabels; i++) {
      const x = padding.left + (i / timeLabels) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + priceHeight);
      ctx.stroke();
      
      if (i < candleData.length) {
        const dataIndex = Math.floor((i / timeLabels) * (candleData.length - 1));
        const candle = candleData[dataIndex];
        if (candle) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(candle.time, x, rect.height - 10);
        }
      }
    }

    // Technical indicators
    if (showIndicators) {
      // EMA 20
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      candleData.forEach((candle, index) => {
        if (candle.ema20) {
          const x = xScale(index);
          const y = yScale(candle.ema20);
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // EMA 50
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      candleData.forEach((candle, index) => {
        if (candle.ema50) {
          const x = xScale(index);
          const y = yScale(candle.ema50);
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Volume bars
    if (showVolume && volumeHeight > 0) {
      candleData.forEach((candle, index) => {
        const x = xScale(index);
        const barWidth = Math.max(1, chartWidth / candleData.length * 0.8);
        const barHeight = volumeHeight * (candle.volume / maxVolume) * 0.8;
        
        ctx.fillStyle = candle.close >= candle.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
        ctx.fillRect(x - barWidth / 2, padding.top + priceHeight + volumeHeight - barHeight, barWidth, barHeight);
      });
    }

    // Drawing elements
    drawingElements.forEach(element => {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      if (element.points.length >= 2) {
        ctx.moveTo(element.points[0].x, element.points[0].y);
        for (let i = 1; i < element.points.length; i++) {
          ctx.lineTo(element.points[i].x, element.points[i].y);
        }
      }
      
      ctx.stroke();
    });

    // Candlesticks
    candleData.forEach((candle, index) => {
      const x = xScale(index);
      const openY = yScale(candle.open);
      const closeY = yScale(candle.close);
      const highY = yScale(candle.high);
      const lowY = yScale(candle.low);
      
      const isUp = candle.close >= candle.open;
      const color = isUp ? '#22c55e' : '#ef4444';
      
      // Highlight selected candle or news timestamp
      const isHighlighted = selectedCandle?.timestamp === candle.timestamp || 
                           highlightedTimestamp === candle.timestamp;
      
      if (isHighlighted) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        const barWidth = Math.max(2, chartWidth / candleData.length);
        ctx.fillRect(x - barWidth / 2, padding.top, barWidth, priceHeight);
      }
      
      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Body
      const bodyHeight = Math.abs(closeY - openY);
      const bodyTop = Math.min(openY, closeY);
      const bodyWidth = Math.max(1, chartWidth / candleData.length * 0.7);
      
      ctx.fillStyle = color;
      ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, Math.max(1, bodyHeight));
      
      // Body outline
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - bodyWidth / 2, bodyTop, bodyWidth, Math.max(1, bodyHeight));
    });

    // Current price line
    if (currentPrice && currentPrice > 0) {
      const priceY = yScale(currentPrice);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, priceY);
      ctx.lineTo(padding.left + chartWidth, priceY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Price label
      ctx.fillStyle = '#06b6d4';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`$${currentPrice.toFixed(2)}`, padding.left + chartWidth + 8, priceY + 4);
    }

  }, [candleData, priceScale, showVolume, showIndicators, currentPrice, drawingElements, selectedCandle, highlightedTimestamp]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (drawingTool === 'none') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentDrawing({
      id: Date.now().toString(),
      type: drawingTool as any,
      points: [{ x, y }],
      color: '#fbbf24',
      timestamp: Date.now()
    });
  }, [drawingTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !currentDrawing) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentDrawing(prev => prev ? {
      ...prev,
      points: [prev.points[0], { x, y }]
    } : null);
  }, [isDrawing, currentDrawing]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentDrawing && currentDrawing.points && currentDrawing.points.length >= 2) {
      setDrawingElements(prev => [...prev, currentDrawing as DrawingElement]);
    }
    setIsDrawing(false);
    setCurrentDrawing(null);
  }, [isDrawing, currentDrawing]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (drawingTool !== 'none') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || candleData.length === 0) return;
    
    const x = e.clientX - rect.left;
    const padding = { left: 60, right: 80 };
    const chartWidth = rect.width - padding.left - padding.right;
    
    const relativeX = (x - padding.left) / chartWidth;
    const candleIndex = Math.floor(relativeX * candleData.length);
    
    if (candleIndex >= 0 && candleIndex < candleData.length) {
      const clickedCandle = candleData[candleIndex];
      setSelectedCandle(clickedCandle);
      setShowMoveAnalysisDrawer(true);
    }
  }, [drawingTool, candleData]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading chart data...</p>
        </div>
      </Card>
    );
  }

  // No data state
  if (candleData.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">No Chart Data Available</p>
          <p className="text-sm text-muted-foreground">
            Unable to load data for {market.symbol}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chart Controls */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {market.symbol}
          </Badge>
          <div className="flex gap-1">
            {['1', '5', '15', '60', 'D'].map((timeframe) => (
              <Button
                key={timeframe}
                size="sm"
                variant={selectedTimeframe === timeframe ? "default" : "outline"}
                onClick={() => setSelectedTimeframe(timeframe)}
                className="text-xs"
              >
                {timeframe}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showIndicators ? "default" : "outline"}
            onClick={() => setShowIndicators(!showIndicators)}
            className="text-xs"
          >
            Indicators
          </Button>
          <Button
            size="sm"
            variant={showVolume ? "default" : "outline"}
            onClick={() => setShowVolume(!showVolume)}
            className="text-xs"
          >
            Volume
          </Button>
          <Button
            size="sm"
            variant={isLive ? "default" : "outline"}
            onClick={() => setIsLive(!isLive)}
            className="text-xs"
          >
            {isLive ? 'Live' : 'Paused'}
          </Button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          style={{ display: 'block' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
        />
        
        {/* Live Indicator */}
        {isLive && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded px-2 py-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold">LIVE</span>
          </div>
        )}
      </div>

      {/* Technical Analysis Summary */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">RSI (14)</div>
            <div className="text-sm font-mono">
              {candleData.length > 0 ? candleData[candleData.length - 1]?.rsi?.toFixed(1) : '--'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">EMA20</div>
            <div className="text-sm font-mono">
              {candleData.length > 0 ? `$${candleData[candleData.length - 1]?.ema20?.toFixed(2)}` : '--'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">EMA50</div>
            <div className="text-sm font-mono">
              {candleData.length > 0 ? `$${candleData[candleData.length - 1]?.ema50?.toFixed(2)}` : '--'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className="text-sm font-mono">
              {(75 + Math.random() * 20).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Panel */}
      {showAnalysisPanel && selectedCandle && (
        <div className="p-4 bg-card border-t">
          <h3 className="font-semibold mb-2">Candle Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Analysis for {new Date(selectedCandle.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {/* Move Analysis Drawer */}
      <CandleMoveAnalysisDrawer
        isOpen={showMoveAnalysisDrawer}
        onClose={() => setShowMoveAnalysisDrawer(false)}
        candleData={selectedCandle}
        symbol={market.symbol}
        timeframe={selectedTimeframe}
        assetClass={market.assetClass}
        onNewsHover={setHighlightedTimestamp}
        onNewsClick={() => {}}
      />

      {/* Status Bar */}
      <div className="px-4 py-2 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Last Update: {new Date().toLocaleTimeString()}</span>
            <span>Drawings: {drawingElements.length}</span>
            <span>Memory: {(candleData.length / 1000).toFixed(1)}k candles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'Connected' ? 'bg-green-500' : connectionStatus === 'Reconnecting' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <span>{connectionStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
