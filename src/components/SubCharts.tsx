import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Activity, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface SubChartsProps {
  showRSI: boolean;
  showMACD: boolean;
  symbol: string;
  className?: string;
}

// Mock data generators for demo
const generateRSIData = (symbol: string) => {
  const points = 50;
  const data = [];
  let rsi = 45 + Math.random() * 20; // Start between 45-65
  
  for (let i = 0; i < points; i++) {
    rsi += (Math.random() - 0.5) * 8;
    rsi = Math.max(5, Math.min(95, rsi));
    data.push({
      timestamp: Date.now() - (points - i) * 60000,
      value: rsi
    });
  }
  return data;
};

const generateMACDData = (symbol: string) => {
  const points = 50;
  const data = [];
  let macd = 0;
  let signal = 0;
  
  for (let i = 0; i < points; i++) {
    macd += (Math.random() - 0.5) * 0.5;
    signal += (macd - signal) * 0.1 + (Math.random() - 0.5) * 0.1;
    
    data.push({
      timestamp: Date.now() - (points - i) * 60000,
      macd,
      signal,
      histogram: macd - signal
    });
  }
  return data;
};

const RSIChart = ({ symbol }: { symbol: string }) => {
  const rsiData = useMemo(() => generateRSIData(symbol), [symbol]);
  const currentRSI = rsiData[rsiData.length - 1]?.value || 50;
  
  const getRSIColor = (value: number) => {
    if (value > 70) return 'text-red-400';
    if (value < 30) return 'text-green-400';
    return 'text-yellow-400';
  };

  const getRSIStatus = (value: number) => {
    if (value > 70) return 'Overbought';
    if (value < 30) return 'Oversold';
    return 'Neutral';
  };

  return (
    <Card className="p-3 bg-slate-900/30 border-slate-700/50 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium text-slate-300">RSI (14)</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", getRSIColor(currentRSI))}>
            {currentRSI.toFixed(1)}
          </Badge>
          <Badge variant="outline" className={cn("text-xs", getRSIColor(currentRSI))}>
            {getRSIStatus(currentRSI)}
          </Badge>
        </div>
      </div>
      
      <div className="relative h-20 bg-slate-800/30 rounded overflow-hidden">
        {/* RSI levels */}
        <div className="absolute inset-x-0 top-0 h-px bg-red-500/30" />
        <div className="absolute inset-x-0 top-[30%] h-px bg-red-500/50 text-xs">
          <span className="absolute right-1 -top-2 text-red-400 text-[10px]">70</span>
        </div>
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-600/50">
          <span className="absolute right-1 -top-2 text-slate-400 text-[10px]">50</span>
        </div>
        <div className="absolute inset-x-0 top-[70%] h-px bg-green-500/50">
          <span className="absolute right-1 -top-2 text-green-400 text-[10px]">30</span>
        </div>
        
        {/* RSI line */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="rsiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <path
            d={rsiData.map((point, index) => {
              const x = (index / (rsiData.length - 1)) * 100;
              const y = 100 - point.value;
              return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
            }).join(' ')}
            stroke="url(#rsiGradient)"
            strokeWidth="1.5"
            fill="none"
            className="animate-fade-in"
          />
        </svg>
        
        {/* Current value indicator */}
        <div 
          className={cn(
            "absolute right-0 w-1 h-1 rounded-full animate-pulse",
            getRSIColor(currentRSI).replace('text-', 'bg-')
          )}
          style={{ top: `${100 - currentRSI}%` }}
        />
      </div>
    </Card>
  );
};

const MACDChart = ({ symbol }: { symbol: string }) => {
  const macdData = useMemo(() => generateMACDData(symbol), [symbol]);
  const current = macdData[macdData.length - 1];
  
  const getMACDTrend = (histogram: number) => {
    return histogram > 0 ? 'Bullish' : 'Bearish';
  };

  return (
    <Card className="p-3 bg-slate-900/30 border-slate-700/50 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-slate-300">MACD (12,26,9)</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(
            "text-xs",
            current?.histogram > 0 ? "text-green-400" : "text-red-400"
          )}>
            {current?.macd.toFixed(3)}
          </Badge>
          <Badge variant="outline" className={cn(
            "text-xs",
            current?.histogram > 0 ? "text-green-400" : "text-red-400"
          )}>
            {getMACDTrend(current?.histogram || 0)}
          </Badge>
        </div>
      </div>
      
      <div className="relative h-20 bg-slate-800/30 rounded overflow-hidden">
        {/* Zero line */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-600/50">
          <span className="absolute right-1 -top-2 text-slate-400 text-[10px]">0</span>
        </div>
        
        {/* MACD histogram */}
        <div className="absolute inset-0 flex items-end justify-between px-1">
          {macdData.slice(-20).map((point, index) => {
            const height = Math.abs(point.histogram) * 200;
            const isPositive = point.histogram > 0;
            return (
              <div
                key={index}
                className={cn(
                  "w-1 rounded-t transition-all duration-300",
                  isPositive ? "bg-green-500/60" : "bg-red-500/60"
                )}
                style={{
                  height: `${Math.min(height, 40)}px`,
                  transform: isPositive ? 'translateY(0)' : 'translateY(0) scaleY(-1)'
                }}
              />
            );
          })}
        </div>
        
        {/* MACD and Signal lines */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="macdGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="rgb(20, 184, 166)" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="signalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          
          {/* MACD line */}
          <path
            d={macdData.slice(-20).map((point, index) => {
              const x = (index / 19) * 100;
              const y = 50 - (point.macd * 1000);
              return `${index === 0 ? 'M' : 'L'} ${x}% ${Math.max(5, Math.min(95, y))}%`;
            }).join(' ')}
            stroke="url(#macdGradient)"
            strokeWidth="1.5"
            fill="none"
          />
          
          {/* Signal line */}
          <path
            d={macdData.slice(-20).map((point, index) => {
              const x = (index / 19) * 100;
              const y = 50 - (point.signal * 1000);
              return `${index === 0 ? 'M' : 'L'} ${x}% ${Math.max(5, Math.min(95, y))}%`;
            }).join(' ')}
            stroke="url(#signalGradient)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="2,2"
          />
        </svg>
      </div>
    </Card>
  );
};

export const SubCharts = ({ showRSI, showMACD, symbol, className }: SubChartsProps) => {
  if (!showRSI && !showMACD) return null;

  return (
    <div className={cn("space-y-3 border-t border-slate-700/50 pt-3", className)}>
      {showRSI && (
        <div className="animate-slide-in-right">
          <RSIChart symbol={symbol} />
        </div>
      )}
      {showMACD && (
        <div className="animate-slide-in-right">
          <MACDChart symbol={symbol} />
        </div>
      )}
    </div>
  );
};