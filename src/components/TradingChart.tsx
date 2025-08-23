import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Stock } from "@/components/StockSearchSelector";
import { IndicatorConfig } from "@/components/TechnicalIndicators";
import { ComposedChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar, Line, ReferenceLine, Tooltip } from 'recharts';

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

// Generate realistic historical data
const generateHistoricalData = (basePrice: number, periods: number = 50): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  
  for (let i = periods - 1; i >= 0; i--) {
    const timestamp = now - i * 5 * 60 * 1000; // 5-minute intervals
    const volatility = 0.002; // Realistic volatility
    
    // Generate price movement with trend and noise
    const trend = Math.sin(i * 0.1) * 0.001; // Subtle trend
    const noise = (Math.random() - 0.5) * volatility;
    const priceChange = trend + noise;
    
    const open = currentPrice;
    const close = open * (1 + priceChange);
    
    // Realistic high/low based on open/close
    const bodySize = Math.abs(close - open);
    const wickMultiplier = 0.5 + Math.random() * 1.5;
    
    const high = Math.max(open, close) + bodySize * wickMultiplier * Math.random();
    const low = Math.min(open, close) - bodySize * wickMultiplier * Math.random();
    
    // Volume with some correlation to price movement
    const baseVolume = 2000000;
    const volumeMultiplier = 1 + Math.abs(priceChange) * 50 + (Math.random() - 0.5) * 0.5;
    const volume = Math.floor(baseVolume * volumeMultiplier);
    
    // Technical indicators (simplified calculations)
    const ema20 = i < 20 ? close : data[data.length - 19]?.ema20 ? 
      (close * 2 + (data[data.length - 19].ema20 || close) * 19) / 21 : close;
    
    const ema50 = i < 50 ? close : data[data.length - 49]?.ema50 ? 
      (close * 2 + (data[data.length - 49].ema50 || close) * 49) / 51 : close;
    
    const ema200 = close * 0.995; // Simplified
    
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
      ema20,
      ema50,
      ema200,
      rsi: 30 + Math.random() * 40, // Simplified RSI
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

// Custom Candlestick Component for Recharts
const Candlestick = (props: any) => {
  const { payload, x, y, width, height } = props;
  if (!payload) return null;
  
  const {
    open,
    close,
    high,
    low,
  } = payload;
  
  const isGreen = close > open;
  const color = isGreen ? '#10b981' : '#ef4444'; // green-500 : red-500
  const fillColor = isGreen ? '#10b981' : '#ef4444';
  
  const bodyHeight = Math.abs((close - open) / (high - low)) * height;
  const bodyY = y + ((Math.max(open, close) - high) / (high - low)) * height;
  const wickX = x + width / 2;
  const wickTopY = y;
  const wickBottomY = y + height;
  
  return (
    <g>
      {/* Upper and lower wicks */}
      <line
        x1={wickX}
        y1={wickTopY}
        x2={wickX}
        y2={wickBottomY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Candle body */}
      <rect
        x={x + 1}
        y={bodyY}
        width={width - 2}
        height={Math.max(bodyHeight, 1)}
        fill={fillColor}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// Custom Volume Bars Component
const VolumeBar = (props: any) => {
  const { payload, x, y, width, height } = props;
  if (!payload) return null;
  
  const isGreen = payload.close > payload.open;
  const color = isGreen ? '#10b98150' : '#ef444450'; // with transparency
  
  return (
    <rect
      x={x + 1}
      y={y}
      width={width - 2}
      height={height}
      fill={color}
    />
  );
};

export const TradingChart = ({ selectedStock, onPriceUpdate, activeIndicators }: TradingChartProps) => {
  const [currentPrice, setCurrentPrice] = useState(selectedStock.price);
  const [priceChange, setPriceChange] = useState(selectedStock.change);
  const [selectedTimeframe, setSelectedTimeframe] = useState('5M');
  const [candlestickData, setCandlestickData] = useState(() => generateHistoricalData(selectedStock.price));
  const [rsiValue, setRsiValue] = useState(67.5);

  // Custom tooltip for professional look
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-lg border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-2">{data.time}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">O:</span>
              <span className="ml-1 font-mono">{data.open.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">H:</span>
              <span className="ml-1 font-mono">{data.high.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">L:</span>
              <span className="ml-1 font-mono">{data.low.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">C:</span>
              <span className={`ml-1 font-mono ${data.close > data.open ? 'text-bullish' : 'text-bearish'}`}>
                {data.close.toFixed(2)}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Vol:</span>
              <span className="ml-1 font-mono">{(data.volume / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

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
    
    const timestamp = Date.now();
    
    const newCandle: CandlestickData = {
      timestamp,
      time: new Date(timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      open: newOpen,
      high,
      low,
      close: newClose,
      volume: 2000000 + Math.random() * 2000000,
    };
    
    return newCandle;
  };

  // Reset data when stock changes
  useEffect(() => {
    setCurrentPrice(selectedStock.price);
    setPriceChange(selectedStock.change);
    setCandlestickData(generateHistoricalData(selectedStock.price));
  }, [selectedStock]);

  // Simulate real-time price updates and new candles
  useEffect(() => {
    const priceInterval = setInterval(() => {
      const change = (Math.random() - 0.5) * 0.2;
      const newPrice = currentPrice + change;
      setCurrentPrice(newPrice);
      setPriceChange(change);
      onPriceUpdate(newPrice, change);
      
      // Update RSI with some variation
      setRsiValue(prev => {
        const rsiChange = (Math.random() - 0.5) * 2;
        return Math.max(0, Math.min(100, prev + rsiChange));
      });
    }, 1000);

    const candleInterval = setInterval(() => {
      setCandlestickData(prev => {
        const lastCandle = prev[prev.length - 1];
        const newTimestamp = lastCandle.timestamp + 5 * 60 * 1000;
        const volatility = 0.002;
        const priceChange = (Math.random() - 0.5) * volatility;
        
        const open = lastCandle.close;
        const close = open * (1 + priceChange);
        const bodySize = Math.abs(close - open);
        const wickMultiplier = 0.5 + Math.random() * 1.5;
        
        const high = Math.max(open, close) + bodySize * wickMultiplier * Math.random();
        const low = Math.min(open, close) - bodySize * wickMultiplier * Math.random();
        
        const baseVolume = 2000000;
        const volumeMultiplier = 1 + Math.abs(priceChange) * 50 + (Math.random() - 0.5) * 0.5;
        const volume = Math.floor(baseVolume * volumeMultiplier);
        
        const newCandle: CandlestickData = {
          timestamp: newTimestamp,
          time: new Date(newTimestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          open,
          high,
          low,
          close,
          volume,
          ema20: lastCandle.ema20 ? (close * 2 + lastCandle.ema20 * 19) / 21 : close,
          ema50: lastCandle.ema50 ? (close * 2 + lastCandle.ema50 * 49) / 51 : close,
          ema200: close * 0.995,
          rsi: 30 + Math.random() * 40,
          upperBB: close + close * 0.02,
          lowerBB: close - close * 0.02,
          middleBB: close
        };
        
        return [...prev.slice(1), newCandle];
      });
    }, 5000); // New candle every 5 seconds

    return () => {
      clearInterval(priceInterval);
      clearInterval(candleInterval);
    };
  }, [candlestickData, currentPrice, onPriceUpdate]);

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

      {/* Professional Trading Chart Container */}
      <Card className="flex-1 chart-container relative bg-[#0a0a0a] border-gray-800">
        <div className="h-full flex flex-col">
          {/* Main Price Chart */}
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="70%">
              <ComposedChart
                data={candlestickData}
                margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="emaCloudGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="1,1" 
                  stroke="#1f2937" 
                  horizontal={true}
                  vertical={true}
                />
                
                <XAxis 
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  interval="preserveStartEnd"
                />
                
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                  orientation="right"
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                {/* Bollinger Bands */}
                {activeIndicators.find(i => i.id === 'bb' && i.enabled) && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="upperBB" 
                      stroke="#06b6d4" 
                      strokeWidth={1}
                      strokeDasharray="3,3"
                      dot={false}
                      connectNulls
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lowerBB" 
                      stroke="#06b6d4" 
                      strokeWidth={1}
                      strokeDasharray="3,3"
                      dot={false}
                      connectNulls
                    />
                  </>
                )}
                
                {/* EMA Lines */}
                {activeIndicators.find(i => i.id === 'ema20' && i.enabled) && (
                  <Line 
                    type="monotone" 
                    dataKey="ema20" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                )}
                
                {activeIndicators.find(i => i.id === 'ema50' && i.enabled) && (
                  <Line 
                    type="monotone" 
                    dataKey="ema50" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                )}
                
                {activeIndicators.find(i => i.id === 'ema200' && i.enabled) && (
                  <Line 
                    type="monotone" 
                    dataKey="ema200" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                )}
                
                {/* Candlesticks */}
                <Bar 
                  dataKey="high" 
                  shape={<Candlestick />}
                  isAnimationActive={true}
                />
                
                {/* Current Price Line */}
                <ReferenceLine 
                  y={currentPrice} 
                  stroke="#06b6d4" 
                  strokeDasharray="2,2"
                  strokeWidth={1}
                />
              </ComposedChart>
            </ResponsiveContainer>
            
            {/* Current Price Display */}
            <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded px-3 py-1">
              <div className={`text-lg font-mono font-bold ${priceChange >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                ${currentPrice.toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* Volume Chart */}
          <div className="h-[120px] border-t border-gray-800">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={candlestickData}
                margin={{ top: 10, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="1,1" stroke="#1f2937" />
                <XAxis 
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  orientation="right"
                />
                <Bar 
                  dataKey="volume" 
                  shape={<VolumeBar />}
                  isAnimationActive={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Chart Controls Overlay */}
        <div className="absolute top-4 left-4 flex gap-2 bg-card/90 backdrop-blur-sm border border-border rounded p-2">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((interval) => (
            <button
              key={interval}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedTimeframe === interval.toUpperCase() 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedTimeframe(interval.toUpperCase())}
            >
              {interval}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};