import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Stock } from "@/components/StockSearchSelector";
import { IndicatorConfig } from "@/components/TechnicalIndicators";
import { fetchStockQuote, fetchCandlestickData, CandleStickData } from "@/lib/api";

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

interface TechnicalSignal {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  timestamp: number;
  confidence: number;
  reason: string;
}

// Generate realistic historical data with more detail
const generateHistoricalData = (basePrice: number, periods: number = 30): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  
  for (let i = periods - 1; i >= 0; i--) {
    const timestamp = now - i * 5 * 60 * 1000; // 5-minute intervals
    const volatility = 0.005; // More visible volatility
    
    // Generate realistic price movement
    const trend = Math.sin(i * 0.1) * 0.002;
    const noise = (Math.random() - 0.5) * volatility;
    const priceChange = trend + noise;
    
    const open = currentPrice;
    const close = open + (open * priceChange);
    
    // More realistic high/low with proper wicks
    const spread = Math.abs(close - open);
    const wickSize = spread * (0.5 + Math.random() * 2);
    
    const high = Math.max(open, close) + wickSize * Math.random();
    const low = Math.min(open, close) - wickSize * Math.random();
    
    // Volume correlated with price movement
    const baseVolume = 2500000;
    const volumeMultiplier = 1 + Math.abs(priceChange) * 100 + (Math.random() - 0.5) * 0.8;
    const volume = Math.floor(baseVolume * volumeMultiplier);
    
    data.push({
      timestamp,
      time: new Date(timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      open,
      high,
      low,
      close,
      volume,
      ema20: close,
      ema50: close * 0.998,
      ema200: close * 0.995,
      rsi: 30 + Math.random() * 40,
      upperBB: close + close * 0.02,
      lowerBB: close - close * 0.02,
      middleBB: close
    });
    
    currentPrice = close;
  }
  
  return data;
};

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

interface TradingChartProps {
  selectedStock: Stock;
  onPriceUpdate: (price: number, change: number) => void;
  activeIndicators: IndicatorConfig[];
}

export const TradingChart = ({ selectedStock, onPriceUpdate, activeIndicators }: TradingChartProps) => {
  const [currentPrice, setCurrentPrice] = useState(selectedStock.price);
  const [priceChange, setPriceChange] = useState(selectedStock.change);
  const [selectedTimeframe, setSelectedTimeframe] = useState('5M');
  const [candlestickData, setCandlestickData] = useState(() => generateHistoricalData(selectedStock.price));
  const [rsiValue, setRsiValue] = useState(67.5);

  // Debug: Log candlestick data
  console.log('Candlestick data generated:', candlestickData.length, 'candles');
  console.log('Sample candle:', candlestickData[0]);

  // Chart dimensions and scaling
  const chartWidth = 900;
  const chartHeight = 400;
  const volumeHeight = 80;
  const padding = { top: 20, right: 60, bottom: 40, left: 60 };
  
  // Calculate price and volume scales
  const allPrices = candlestickData.flatMap(d => [d.open, d.high, d.low, d.close]);
  const minPrice = Math.min(...allPrices) * 0.998;
  const maxPrice = Math.max(...allPrices) * 1.002;
  const priceRange = maxPrice - minPrice;
  
  const maxVolume = Math.max(...candlestickData.map(d => d.volume));
  
  // Scale functions
  const scalePrice = (price: number) => 
    chartHeight - padding.bottom - ((price - minPrice) / priceRange) * (chartHeight - padding.top - padding.bottom);
  
  const scaleVolume = (volume: number) => 
    (volume / maxVolume) * volumeHeight;
  
  const scaleX = (index: number) => 
    padding.left + (index * (chartWidth - padding.left - padding.right)) / (candlestickData.length - 1);

  // Reset data when stock changes and fetch real data
  useEffect(() => {
    const loadRealData = async () => {
      try {
        // Fetch real quote
        const quote = await fetchStockQuote(selectedStock.symbol);
        if (quote) {
          setCurrentPrice(quote.price);
          setPriceChange(quote.change);
          onPriceUpdate(quote.price, quote.change);
        } else {
          // Fallback to mock data
          setCurrentPrice(selectedStock.price);
          setPriceChange(selectedStock.change);
        }

        // Fetch real candlestick data
        const candleData = await fetchCandlestickData(selectedStock.symbol, 'minute', 5);
        if (candleData.length > 0) {
          const processedData = candleData.map((candle, index) => ({
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
            ema20: candle.close, // Simplified technical indicators
            ema50: candle.close * 0.998,
            ema200: candle.close * 0.995,
            rsi: 30 + Math.random() * 40,
            upperBB: candle.close + candle.close * 0.02,
            lowerBB: candle.close - candle.close * 0.02,
            middleBB: candle.close
          }));
          setCandlestickData(processedData);
        } else {
          // Fallback to mock data
          setCandlestickData(generateHistoricalData(selectedStock.price));
        }
      } catch (error) {
        console.error('Error loading real data:', error);
        // Fallback to mock data
        setCurrentPrice(selectedStock.price);
        setPriceChange(selectedStock.change);
        setCandlestickData(generateHistoricalData(selectedStock.price));
      }
    };

    loadRealData();
  }, [selectedStock, onPriceUpdate]);

  // Real-time updates with live data fetching
  useEffect(() => {
    const priceInterval = setInterval(async () => {
      try {
        // Try to fetch real-time quote
        const quote = await fetchStockQuote(selectedStock.symbol);
        if (quote) {
          setCurrentPrice(quote.price);
          setPriceChange(quote.change);
          onPriceUpdate(quote.price, quote.change);
        } else {
          // Fallback to mock updates
          const change = (Math.random() - 0.5) * 0.5;
          const newPrice = currentPrice + change;
          setCurrentPrice(newPrice);
          setPriceChange(change);
          onPriceUpdate(newPrice, change);
        }
      } catch (error) {
        console.error('Error fetching real-time data:', error);
        // Fallback to mock updates
        const change = (Math.random() - 0.5) * 0.5;
        const newPrice = currentPrice + change;
        setCurrentPrice(newPrice);
        setPriceChange(change);
        onPriceUpdate(newPrice, change);
      }
      
      setRsiValue(prev => {
        const rsiChange = (Math.random() - 0.5) * 3;
        return Math.max(0, Math.min(100, prev + rsiChange));
      });
    }, 5000); // Update every 5 seconds for real API calls

    const candleInterval = setInterval(() => {
      setCandlestickData(prev => {
        const lastCandle = prev[prev.length - 1];
        const volatility = 0.005;
        const priceChange = (Math.random() - 0.5) * volatility;
        
        const open = lastCandle.close;
        const close = open + (open * priceChange);
        const spread = Math.abs(close - open);
        const wickSize = spread * (0.5 + Math.random() * 2);
        
        const high = Math.max(open, close) + wickSize * Math.random();
        const low = Math.min(open, close) - wickSize * Math.random();
        
        const volume = Math.floor(2500000 * (1 + Math.abs(priceChange) * 100 + (Math.random() - 0.5) * 0.8));
        const timestamp = Date.now();
        
        const newCandle: CandlestickData = {
          timestamp,
          time: new Date(timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          open,
          high,
          low,
          close,
          volume,
          ema20: close,
          ema50: close * 0.998,
          ema200: close * 0.995,
          rsi: 30 + Math.random() * 40,
          upperBB: close + close * 0.02,
          lowerBB: close - close * 0.02,
          middleBB: close
        };
        
        return [...prev.slice(1), newCandle];
      });
    }, 3000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(candleInterval);
    };
  }, [currentPrice, onPriceUpdate]);

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

      {/* Professional SVG Candlestick Chart */}
      <Card className="flex-1 chart-container relative bg-[#0a0a0a] border-gray-800">
        <div className="h-full p-4">
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
        </div>
        
        {/* Chart Controls */}
        <div className="absolute top-4 left-4 flex gap-2 bg-card/90 backdrop-blur-sm border border-border rounded p-2">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((interval) => (
            <button
              key={interval}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedTimeframe === interval.toUpperCase() 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted text-muted-foreground'
              }`}
              onClick={() => setSelectedTimeframe(interval.toUpperCase())}
            >
              {interval}
            </button>
          ))}
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