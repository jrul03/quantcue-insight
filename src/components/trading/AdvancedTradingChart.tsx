import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, TrendingDown, Activity, Volume2, Target, 
  Crosshair, Move, Square, Circle, Minus, Maximize2,
  ZoomIn, ZoomOut, RotateCcw, Settings, Palette,
  Play, Pause, RefreshCw
} from "lucide-react";

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface DrawingTool {
  type: 'trendline' | 'horizontal' | 'vertical' | 'rectangle' | 'fibonacci' | 'ray';
  points: Array<{ x: number; y: number; price: number; timestamp: number }>;
  color: string;
  width: number;
  id: string;
}

interface TradingChartProps {
  symbol: string;
  timeframe: string;
  data: Candle[];
  indicators: string[];
  onCandleClick: (candle: Candle, event: React.MouseEvent) => void;
  onDrawingComplete: (drawing: DrawingTool) => void;
  className?: string;
}

const TIMEFRAMES = ['1s', '5s', '15s', '1m', '5m', '15m', '1h', '4h', '1D', '1W'];
const DRAWING_TOOLS = [
  { id: 'select', name: 'Select', icon: Maximize2 },
  { id: 'crosshair', name: 'Crosshair', icon: Crosshair },
  { id: 'trendline', name: 'Trendline', icon: TrendingUp },
  { id: 'horizontal', name: 'Horizontal Line', icon: Minus },
  { id: 'vertical', name: 'Vertical Line', icon: Move },
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'fibonacci', name: 'Fibonacci', icon: Target },
  { id: 'ray', name: 'Ray', icon: Activity },
];

export const AdvancedTradingChart = ({
  symbol,
  timeframe,
  data,
  indicators,
  onCandleClick,
  onDrawingComplete,
  className = ""
}: TradingChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [activeTool, setActiveTool] = useState('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<DrawingTool> | null>(null);
  const [drawings, setDrawings] = useState<DrawingTool[]>([]);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [crosshairData, setCrosshairData] = useState<{ price: number; time: string; volume: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Chart dimensions and scaling
  const chartDimensions = useMemo(() => {
    if (!containerRef.current) return { width: 800, height: 600 };
    const rect = containerRef.current.getBoundingClientRect();
    return { 
      width: rect.width - 20, 
      height: rect.height - 100 // Leave space for toolbar
    };
  }, [containerRef.current]);

  // Price and time scaling
  const priceScale = useMemo(() => {
    if (!data.length) return { min: 0, max: 100, range: 100 };
    const prices = data.flatMap(d => [d.open, d.high, d.low, d.close]);
    const min = Math.min(...prices) * 0.98;
    const max = Math.max(...prices) * 1.02;
    return { min, max, range: max - min };
  }, [data]);

  const volumeScale = useMemo(() => {
    if (!data.length) return { min: 0, max: 1000000, range: 1000000 };
    const volumes = data.map(d => d.volume);
    const min = 0;
    const max = Math.max(...volumes) * 1.1;
    return { min, max, range: max - min };
  }, [data]);

  // Convert chart coordinates to canvas coordinates
  const priceToY = useCallback((price: number) => {
    const { height } = chartDimensions;
    const mainChartHeight = height * 0.7; // 70% for price chart, 30% for volume
    return mainChartHeight - ((price - priceScale.min) / priceScale.range) * mainChartHeight;
  }, [chartDimensions, priceScale]);

  const timestampToX = useCallback((timestamp: number, index: number) => {
    const { width } = chartDimensions;
    const candleWidth = width / Math.max(data.length, 50);
    return index * candleWidth + candleWidth / 2;
  }, [chartDimensions, data.length]);

  const volumeToY = useCallback((volume: number) => {
    const { height } = chartDimensions;
    const volumeChartStart = height * 0.75; // Volume chart starts at 75%
    const volumeChartHeight = height * 0.2; // 20% height for volume
    return volumeChartStart + volumeChartHeight - ((volume - volumeScale.min) / volumeScale.range) * volumeChartHeight;
  }, [chartDimensions, volumeScale]);

  // Drawing functions
  const drawCandle = useCallback((ctx: CanvasRenderingContext2D, candle: Candle, x: number, candleWidth: number) => {
    const { open, high, low, close } = candle;
    const isUp = close > open;
    const color = isUp ? 'hsl(var(--buy-color))' : 'hsl(var(--sell-color))';
    
    const openY = priceToY(open);
    const closeY = priceToY(close);
    const highY = priceToY(high);
    const lowY = priceToY(low);
    
    // Draw wick
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();
    
    // Draw body
    ctx.fillStyle = isUp ? color : 'transparent';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);
    const bodyWidth = candleWidth * 0.8;
    
    ctx.fillRect(x - bodyWidth/2, bodyTop, bodyWidth, Math.max(bodyHeight, 1));
    ctx.strokeRect(x - bodyWidth/2, bodyTop, bodyWidth, Math.max(bodyHeight, 1));
  }, [priceToY]);

  const drawVolume = useCallback((ctx: CanvasRenderingContext2D, candle: Candle, x: number, candleWidth: number) => {
    const { volume, close, open } = candle;
    const isUp = close > open;
    const color = isUp ? 'hsl(var(--buy-color) / 0.6)' : 'hsl(var(--sell-color) / 0.6)';
    
    const volumeY = volumeToY(volume);
    const { height } = chartDimensions;
    const volumeChartStart = height * 0.75;
    const barHeight = volumeChartStart - volumeY;
    
    ctx.fillStyle = color;
    ctx.fillRect(x - candleWidth/3, volumeY, candleWidth * 0.6, barHeight);
  }, [volumeToY, chartDimensions]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = chartDimensions;
    ctx.strokeStyle = 'hsl(var(--border) / 0.3)';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines (price levels)
    const priceSteps = 10;
    for (let i = 0; i <= priceSteps; i++) {
      const y = (height * 0.7 * i) / priceSteps;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines (time)
    const timeSteps = Math.min(data.length, 20);
    for (let i = 0; i <= timeSteps; i++) {
      const x = (width * i) / timeSteps;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [chartDimensions, data.length]);

  const drawPriceScale = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = chartDimensions;
    ctx.fillStyle = 'hsl(var(--foreground))';
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    
    const priceSteps = 8;
    for (let i = 0; i <= priceSteps; i++) {
      const price = priceScale.min + (priceScale.range * i) / priceSteps;
      const y = height * 0.7 - (height * 0.7 * i) / priceSteps;
      ctx.fillText(price.toFixed(2), width - 60, y + 4);
    }
  }, [chartDimensions, priceScale]);

  const drawCrosshair = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!mousePosition) return;
    
    const { width, height } = chartDimensions;
    ctx.strokeStyle = 'hsl(var(--primary) / 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, mousePosition.y);
    ctx.lineTo(width, mousePosition.y);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(mousePosition.x, 0);
    ctx.lineTo(mousePosition.x, height);
    ctx.stroke();
    
    ctx.setLineDash([]);
  }, [mousePosition, chartDimensions]);

  // Main render function
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = chartDimensions;
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx);
    
    // Draw candles and volume
    const candleWidth = width / Math.max(data.length, 50);
    data.forEach((candle, index) => {
      const x = timestampToX(candle.timestamp, index);
      drawCandle(ctx, candle, x, candleWidth);
      drawVolume(ctx, candle, x, candleWidth);
    });
    
    // Draw price scale
    drawPriceScale(ctx);
    
    // Draw crosshair
    if (activeTool === 'crosshair' || mousePosition) {
      drawCrosshair(ctx);
    }
    
  }, [data, chartDimensions, drawGrid, drawCandle, drawVolume, drawPriceScale, drawCrosshair, activeTool, mousePosition, timestampToX]);

  // Mouse event handlers
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    // Update crosshair data
    if (data.length > 0) {
      const candleWidth = chartDimensions.width / Math.max(data.length, 50);
      const candleIndex = Math.floor(x / candleWidth);
      
      if (candleIndex >= 0 && candleIndex < data.length) {
        const candle = data[candleIndex];
        const price = priceScale.min + (1 - (y / (chartDimensions.height * 0.7))) * priceScale.range;
        
        setCrosshairData({
          price: price,
          time: new Date(candle.timestamp).toLocaleTimeString(),
          volume: candle.volume
        });
      }
    }
  }, [data, chartDimensions, priceScale]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const candleWidth = chartDimensions.width / Math.max(data.length, 50);
    const candleIndex = Math.floor(x / candleWidth);
    
    if (candleIndex >= 0 && candleIndex < data.length) {
      const candle = data[candleIndex];
      onCandleClick(candle, event);
    }
  }, [data, chartDimensions, onCandleClick]);

  // Render chart when data changes
  useEffect(() => {
    renderChart();
  }, [renderChart]);

  // Generate mock data if none provided
  const mockData = useMemo(() => {
    if (data.length > 0) return data;
    
    const startTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    const interval = timeframe === '1s' ? 1000 : 
                    timeframe === '5s' ? 5000 :
                    timeframe === '15s' ? 15000 :
                    timeframe === '1m' ? 60000 :
                    timeframe === '5m' ? 300000 :
                    timeframe === '15m' ? 900000 :
                    timeframe === '1h' ? 3600000 :
                    timeframe === '4h' ? 14400000 :
                    86400000; // 1D
    
    const mockCandles: Candle[] = [];
    let price = 415.84;
    
    for (let i = 0; i < 100; i++) {
      const timestamp = startTime + (i * interval);
      const change = (Math.random() - 0.5) * 4;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      const volume = Math.floor(Math.random() * 1000000 + 500000);
      
      mockCandles.push({ timestamp, open, high, low, close, volume });
      price = close;
    }
    
    return mockCandles;
  }, [data, timeframe]);

  return (
    <div ref={containerRef} className={`relative h-full bg-card/30 rounded-lg border border-border/50 ${className}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-primary">{symbol}</h3>
          <Badge variant="outline" className="text-xs">
            {timeframe}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {crosshairData && (
              <>
                <span>${crosshairData.price.toFixed(2)}</span>
                <span>{crosshairData.time}</span>
                <span>{(crosshairData.volume / 1000000).toFixed(1)}M vol</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isPlaying ? "default" : "outline"}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="outline">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Drawing Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border/30 bg-muted/30">
        {DRAWING_TOOLS.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={activeTool === tool.id ? "default" : "ghost"}
                onClick={() => setActiveTool(tool.id)}
                className={activeTool === tool.id ? "neon-glow-primary" : ""}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tool.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Chart Canvas */}
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          onMouseLeave={() => setMousePosition(null)}
          style={{ 
            background: 'transparent',
            imageRendering: 'pixelated'
          }}
        />
        
        {/* Crosshair Info Panel */}
        {crosshairData && mousePosition && (
          <div 
            className="absolute bg-card/90 backdrop-blur-sm border border-border/50 rounded px-2 py-1 text-xs pointer-events-none z-10"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y - 40
            }}
          >
            <div className="space-y-1">
              <div className="text-primary font-mono">${crosshairData.price.toFixed(2)}</div>
              <div className="text-muted-foreground">{crosshairData.time}</div>
              <div className="text-muted-foreground">{(crosshairData.volume / 1000000).toFixed(1)}M</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-between p-2 border-t border-border/30 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">O: <span className="text-foreground font-mono">${mockData[mockData.length - 1]?.open.toFixed(2)}</span></span>
          <span className="text-muted-foreground">H: <span className="text-success font-mono">${mockData[mockData.length - 1]?.high.toFixed(2)}</span></span>
          <span className="text-muted-foreground">L: <span className="text-destructive font-mono">${mockData[mockData.length - 1]?.low.toFixed(2)}</span></span>
          <span className="text-muted-foreground">C: <span className="text-foreground font-mono">${mockData[mockData.length - 1]?.close.toFixed(2)}</span></span>
        </div>
        <div className="text-muted-foreground">
          Vol: {((mockData[mockData.length - 1]?.volume || 0) / 1000000).toFixed(1)}M
        </div>
      </div>
    </div>
  );
};