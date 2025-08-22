import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalSignal {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  timestamp: number;
  confidence: number;
  reason: string;
}

const mockCandlestickData: CandlestickData[] = [
  { timestamp: Date.now() - 4 * 60000, open: 410.50, high: 412.80, low: 409.20, close: 411.75, volume: 2500000 },
  { timestamp: Date.now() - 3 * 60000, open: 411.75, high: 414.20, low: 410.90, close: 413.45, volume: 2800000 },
  { timestamp: Date.now() - 2 * 60000, open: 413.45, high: 415.80, low: 412.10, close: 414.90, volume: 3200000 },
  { timestamp: Date.now() - 1 * 60000, open: 414.90, high: 416.50, low: 413.75, close: 415.25, volume: 2900000 },
  { timestamp: Date.now(), open: 415.25, high: 417.80, low: 414.60, close: 416.80, volume: 3100000 },
];

const mockSignals: TechnicalSignal[] = [
  {
    id: '1',
    type: 'buy',
    price: 413.45,
    timestamp: 1641081600000,
    confidence: 85,
    reason: 'EMA crossover + RSI oversold'
  },
  {
    id: '2',
    type: 'sell',
    price: 416.80,
    timestamp: 1641340800000,
    confidence: 78,
    reason: 'Bollinger Band resistance + overbought RSI'
  }
];

export const TradingChart = () => {
  const [currentPrice, setCurrentPrice] = useState(415.23);
  const [priceChange, setPriceChange] = useState(2.45);
  const [selectedTimeframe, setSelectedTimeframe] = useState('5M');
  const [candlestickData, setCandlestickData] = useState(mockCandlestickData);
  const [rsiValue, setRsiValue] = useState(67.5);

  // Generate new candlestick data
  const generateNewCandle = () => {
    const lastCandle = candlestickData[candlestickData.length - 1];
    const basePrice = lastCandle.close;
    const volatility = 0.5;
    
    const change = (Math.random() - 0.5) * volatility;
    const newOpen = basePrice;
    const newClose = basePrice + change;
    
    const high = Math.max(newOpen, newClose) + Math.random() * 0.3;
    const low = Math.min(newOpen, newClose) - Math.random() * 0.3;
    
    const newCandle: CandlestickData = {
      timestamp: Date.now(),
      open: newOpen,
      high,
      low,
      close: newClose,
      volume: 2000000 + Math.random() * 2000000,
    };
    
    return newCandle;
  };

  // Simulate real-time price updates and new candles
  useEffect(() => {
    const priceInterval = setInterval(() => {
      const change = (Math.random() - 0.5) * 0.2;
      setCurrentPrice(prev => prev + change);
      setPriceChange(change);
      
      // Update RSI with some variation
      setRsiValue(prev => {
        const rsiChange = (Math.random() - 0.5) * 2;
        return Math.max(0, Math.min(100, prev + rsiChange));
      });
    }, 1000);

    const candleInterval = setInterval(() => {
      const newCandle = generateNewCandle();
      setCandlestickData(prev => {
        const updated = [...prev.slice(1), newCandle];
        return updated;
      });
    }, 5000); // New candle every 5 seconds

    return () => {
      clearInterval(priceInterval);
      clearInterval(candleInterval);
    };
  }, [candlestickData]);

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold font-mono">SPY</h2>
            <Badge variant="secondary" className="text-xs">
              S&P 500 ETF
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-3xl font-mono font-bold">
              ${currentPrice.toFixed(2)}
            </div>
            <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-mono">
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({((priceChange / currentPrice) * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['1D', '5M', '1H'].map((timeframe) => (
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
              {timeframe}
            </Badge>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <Card className="flex-1 chart-container relative">
        <div className="absolute inset-0 p-6">
          {/* Chart Grid */}
          <div className="w-full h-full relative">
            <svg className="w-full h-full" viewBox="0 0 800 400">
              {/* Grid Lines */}
              <defs>
                <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="hsl(var(--chart-grid))" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Price Levels */}
              {[410, 412, 414, 416, 418].map((price, i) => (
                <g key={price}>
                  <line 
                    x1="0" 
                    y1={80 + i * 60} 
                    x2="800" 
                    y2={80 + i * 60} 
                    stroke="hsl(var(--chart-axis))" 
                    strokeWidth="0.5" 
                    strokeDasharray="2,2"
                  />
                  <text 
                    x="10" 
                    y={85 + i * 60} 
                    fill="hsl(var(--muted-foreground))" 
                    fontSize="12" 
                    fontFamily="monospace"
                  >
                    ${price}
                  </text>
                </g>
              ))}

              {/* Candlesticks */}
              {candlestickData.map((candle, i) => {
                const x = 100 + i * 140;
                const isGreen = candle.close > candle.open;
                const bodyTop = isGreen ? 320 - (candle.close - 410) * 20 : 320 - (candle.open - 410) * 20;
                const bodyBottom = isGreen ? 320 - (candle.open - 410) * 20 : 320 - (candle.close - 410) * 20;
                const wickTop = 320 - (candle.high - 410) * 20;
                const wickBottom = 320 - (candle.low - 410) * 20;

                return (
                  <g key={`${candle.timestamp}-${i}`} className="animate-in fade-in duration-500">
                    {/* Wick */}
                    <line 
                      x1={x} 
                      y1={wickTop} 
                      x2={x} 
                      y2={wickBottom} 
                      stroke={isGreen ? "hsl(var(--bullish))" : "hsl(var(--bearish))"} 
                      strokeWidth="1"
                    />
                    {/* Body */}
                    <rect 
                      x={x - 15} 
                      y={bodyTop} 
                      width={30} 
                      height={Math.abs(bodyBottom - bodyTop)} 
                      fill={isGreen ? "hsl(var(--bullish))" : "hsl(var(--bearish))"} 
                      stroke={isGreen ? "hsl(var(--bullish))" : "hsl(var(--bearish))"}
                    />
                  </g>
                );
              })}

              {/* EMA Lines */}
              <path 
                d="M 100,280 Q 200,275 300,270 T 500,265 T 700,260" 
                fill="none" 
                stroke="hsl(var(--ema-fast))" 
                strokeWidth="2"
              />
              <path 
                d="M 100,290 Q 200,285 300,280 T 500,275 T 700,270" 
                fill="none" 
                stroke="hsl(var(--ema-slow))" 
                strokeWidth="2"
              />

              {/* Bollinger Bands */}
              <path 
                d="M 100,250 Q 200,245 300,240 T 500,235 T 700,230" 
                fill="none" 
                stroke="hsl(var(--neon-cyan))" 
                strokeWidth="1" 
                strokeDasharray="3,3" 
                opacity="0.6"
              />
              <path 
                d="M 100,310 Q 200,315 300,320 T 500,325 T 700,330" 
                fill="none" 
                stroke="hsl(var(--neon-cyan))" 
                strokeWidth="1" 
                strokeDasharray="3,3" 
                opacity="0.6"
              />

              {/* Signal Markers */}
              {mockSignals.map((signal, i) => {
                const x = 240 + i * 280;
                const y = 320 - (signal.price - 410) * 20;
                
                return (
                  <g key={signal.id}>
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="8" 
                      fill={signal.type === 'buy' ? "hsl(var(--bullish))" : "hsl(var(--bearish))"} 
                      stroke="white" 
                      strokeWidth="2"
                    />
                    <text 
                      x={x} 
                      y={y + 3} 
                      textAnchor="middle" 
                      fill="white" 
                      fontSize="10" 
                      fontWeight="bold"
                    >
                      {signal.type === 'buy' ? '↑' : '↓'}
                    </text>
                    
                    {/* Signal Info Tooltip */}
                    <g className="opacity-0 hover:opacity-100 transition-opacity">
                      <rect 
                        x={x + 12} 
                        y={y - 25} 
                        width="120" 
                        height="40" 
                        fill="hsl(var(--card))" 
                        stroke="hsl(var(--border))" 
                        rx="4"
                      />
                      <text 
                        x={x + 18} 
                        y={y - 12} 
                        fill="hsl(var(--foreground))" 
                        fontSize="10"
                      >
                        {signal.type.toUpperCase()} {signal.confidence}%
                      </text>
                      <text 
                        x={x + 18} 
                        y={y - 2} 
                        fill="hsl(var(--muted-foreground))" 
                        fontSize="9"
                      >
                        ${signal.price.toFixed(2)}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Chart Legend */}
        <div className="absolute top-4 left-6 flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-indicator-ema-fast"></div>
            <span className="text-muted-foreground">EMA 20</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-indicator-ema-slow"></div>
            <span className="text-muted-foreground">EMA 50</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-neon-cyan opacity-60"></div>
            <span className="text-muted-foreground">Bollinger Bands</span>
          </div>
        </div>

        {/* RSI Indicator */}
        <div className="absolute bottom-4 left-6 right-6 h-16 bg-card/80 rounded border border-border p-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">RSI (14)</span>
            <span className="text-xs font-mono text-indicator-rsi">{rsiValue.toFixed(1)}</span>
          </div>
          <div className="w-full h-2 bg-muted rounded">
            <div 
              className="h-full bg-indicator-rsi rounded transition-all duration-1000 ease-out" 
              style={{ width: `${rsiValue}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>30</span>
            <span>70</span>
          </div>
        </div>
      </Card>
    </div>
  );
};