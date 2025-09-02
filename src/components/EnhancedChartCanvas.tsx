import { useState, useEffect, useRef, useCallback } from "react";
import { IndicatorState } from "./IndicatorToggles";

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities' | 'memecoins';
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

interface EnhancedChartCanvasProps {
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
  selectedTool: string;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
}

export const EnhancedChartCanvas = ({ 
  candles, 
  selectedCandle, 
  onCandleClick, 
  indicators, 
  timeframe, 
  highlightedTimestamp, 
  market,
  selectedTool,
  zoomLevel,
  onZoomChange
}: EnhancedChartCanvasProps) => {
  // All hooks must be at the top - before any conditional logic
  const svgRef = useRef<SVGSVGElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [crosshair, setCrosshair] = useState<{ x: number, y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (selectedTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [selectedTool, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (selectedTool === 'crosshair' || selectedTool === 'select') {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        setCrosshair({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        });
      }
    }

    if (isPanning && selectedTool === 'pan') {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [selectedTool, isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoomLevel * delta));
    onZoomChange(newZoom);
  }, [zoomLevel, onZoomChange]);

  // Early return AFTER all hooks
  if (!candles.length) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-lg border border-slate-700/30">
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-lg font-medium text-slate-300 mb-2">Loading Market Data</p>
          <p className="text-sm text-slate-500">Fetching {market.symbol} candlestick data...</p>
        </div>
      </div>
    );
  }

  const maxPrice = Math.max(...candles.map(c => c.high));
  const minPrice = Math.min(...candles.map(c => c.low));
  const priceRange = maxPrice - minPrice;

  return (
    <div 
      className="h-full w-full relative bg-gradient-to-br from-slate-900/30 to-slate-800/30 rounded-lg border border-slate-700/30 backdrop-blur-sm overflow-hidden"
      style={{ cursor: selectedTool === 'pan' ? 'grab' : selectedTool === 'crosshair' ? 'crosshair' : 'default' }}
    >
      <svg 
        ref={svgRef}
        viewBox="0 0 100 100" 
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
          transformOrigin: 'center center'
        }}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(30, 41, 59, 0.8)" />
            <stop offset="50%" stopColor="rgba(15, 23, 42, 0.9)" />
            <stop offset="100%" stopColor="rgba(2, 6, 23, 0.95)" />
          </linearGradient>
          <linearGradient id="emaCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="rgb(147, 51, 234)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#chartGradient)" />

        {/* Enhanced Grid */}
        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(y => (
          <line
            key={y}
            x1="0%"
            y1={`${y * 100}%`}
            x2="100%"
            y2={`${y * 100}%`}
            stroke="rgba(100, 116, 139, 0.15)"
            strokeWidth="0.1"
            strokeDasharray={y === 0.5 ? "none" : "1,1"}
          />
        ))}

        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(x => (
          <line
            key={x}
            x1={`${x * 100}%`}
            y1="0%"
            x2={`${x * 100}%`}
            y2="100%"
            stroke="rgba(100, 116, 139, 0.1)"
            strokeWidth="0.1"
            strokeDasharray="1,1"
          />
        ))}

        {/* EMA Cloud with Glow Effect */}
        {indicators.ema && (
          <g className="animate-fade-in">
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
              filter="url(#glow)"
              className="transition-opacity duration-300"
            />
            
            {/* Enhanced EMA Lines */}
            <path
              d={candles.map((candle, index) => {
                if (!candle.ema50) return '';
                const x = (index / (candles.length - 1)) * 100;
                const y = ((maxPrice - candle.ema50) / priceRange) * 100;
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
              }).join(' ')}
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              fill="none"
              filter="url(#glow)"
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
              strokeWidth="2"
              fill="none"
              filter="url(#glow)"
              className="animate-fade-in"
            />
          </g>
        )}

        {/* Enhanced Bollinger Bands */}
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
              strokeWidth="1.5"
              strokeDasharray="4,4"
              fill="none"
              opacity="0.9"
              filter="url(#glow)"
            />
            <path
              d={candles.map((candle, index) => {
                if (!candle.bollingerLower) return '';
                const x = (index / (candles.length - 1)) * 100;
                const y = ((maxPrice - candle.bollingerLower) / priceRange) * 100;
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
              }).join(' ')}
              stroke="rgb(251, 146, 60)"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              fill="none"
              opacity="0.9"
              filter="url(#glow)"
            />
          </g>
        )}

        {/* Enhanced VWAP */}
        {indicators.vwap && (
          <path
            d={candles.map((candle, index) => {
              if (!candle.vwap) return '';
              const x = (index / (candles.length - 1)) * 100;
              const y = ((maxPrice - candle.vwap) / priceRange) * 100;
              return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
            }).join(' ')}
            stroke="rgb(34, 197, 94)"
            strokeWidth="2.5"
            fill="none"
            filter="url(#glow)"
            className="animate-fade-in"
            opacity="0.95"
          />
        )}

        {/* Enhanced Candlesticks */}
        {candles.map((candle, index) => {
          const x = (index / (candles.length - 1)) * 100;
          const openY = ((maxPrice - candle.open) / priceRange) * 100;
          const closeY = ((maxPrice - candle.close) / priceRange) * 100;
          const highY = ((maxPrice - candle.high) / priceRange) * 100;
          const lowY = ((maxPrice - candle.low) / priceRange) * 100;
          
          const isUp = candle.close >= candle.open;
          const isSelected = selectedCandle?.timestamp === candle.timestamp;
          const isHighlighted = highlightedTimestamp === candle.timestamp;
          
          return (
            <g 
              key={candle.timestamp}
              className="cursor-pointer transition-all duration-200 hover:opacity-90"
              onClick={() => onCandleClick(candle)}
            >
              {/* Selection/Highlight */}
              {(isSelected || isHighlighted) && (
                <rect
                  x={`${x - 0.8}%`}
                  y="0%"
                  width="1.6%"
                  height="100%"
                  fill={isSelected ? "rgba(59, 130, 246, 0.2)" : "rgba(251, 146, 60, 0.15)"}
                  className={isSelected ? "animate-pulse" : "animate-fade-in"}
                />
              )}
              
              {/* Enhanced Wick */}
              <line
                x1={`${x}%`}
                y1={`${highY}%`}
                x2={`${x}%`}
                y2={`${lowY}%`}
                stroke={isUp ? '#10b981' : '#ef4444'}
                strokeWidth="0.3"
                filter="url(#glow)"
              />
              
              {/* Enhanced Body */}
              <rect
                x={`${x - 0.4}%`}
                y={`${Math.min(openY, closeY)}%`}
                width="0.8%"
                height={`${Math.max(0.2, Math.abs(closeY - openY))}%`}
                fill={isUp ? '#10b981' : '#ef4444'}
                className="transition-all duration-300"
                opacity={isSelected ? 1 : 0.95}
                filter={isSelected ? "url(#glow)" : "none"}
              />
            </g>
          );
        })}

        {/* Crosshair */}
        {crosshair && (selectedTool === 'crosshair' || selectedTool === 'select') && (
          <g className="pointer-events-none">
            <line
              x1="0%"
              y1={`${crosshair.y}%`}
              x2="100%"
              y2={`${crosshair.y}%`}
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth="0.1"
              strokeDasharray="2,2"
            />
            <line
              x1={`${crosshair.x}%`}
              y1="0%"
              x2={`${crosshair.x}%`}
              y2="100%"
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth="0.1"
              strokeDasharray="2,2"
            />
          </g>
        )}
      </svg>

      {/* Price Labels */}
      <div className="absolute right-2 top-4 space-y-1 pointer-events-none">
        <div className="bg-slate-800/90 text-green-400 px-2 py-1 rounded text-xs font-mono border border-slate-600/50">
          ${maxPrice.toFixed(2)}
        </div>
      </div>
      
      <div className="absolute right-2 bottom-4 space-y-1 pointer-events-none">
        <div className="bg-slate-800/90 text-red-400 px-2 py-1 rounded text-xs font-mono border border-slate-600/50">
          ${minPrice.toFixed(2)}
        </div>
      </div>
    </div>
  );
};