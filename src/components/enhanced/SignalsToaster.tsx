import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Clock,
  Target,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities';
}

interface Signal {
  id: string;
  type: 'BUY' | 'SELL' | 'WATCH';
  symbol: string;
  price: number;
  confidence: number;
  timestamp: number;
  reason: string;
  indicators: string[];
  stopLoss?: number;
  takeProfit?: number;
  entry?: number;
  timeframe: string;
  strategy: string;
  isNew?: boolean;
}

interface SignalsToasterProps {
  market: Market;
  onSignalClick: (signal: Signal) => void;
}

// Mock signal generation based on market conditions
const generateMockSignal = (market: Market): Signal => {
  const strategies = ['EMA Cross', 'RSI Divergence', 'Bollinger Squeeze', 'Volume Breakout', 'Support/Resistance'];
  const timeframes = ['1m', '5m', '15m', '1H'];
  
  const isUptrend = market.changePercent > 0;
  const highVolatility = Math.random() > 0.7;
  
  const signalType = highVolatility 
    ? (isUptrend ? 'BUY' : 'SELL')
    : (Math.random() > 0.6 ? 'WATCH' : (isUptrend ? 'BUY' : 'SELL'));

  const confidence = Math.floor(60 + Math.random() * 35); // 60-95%
  const priceVariation = market.price * (Math.random() * 0.02 - 0.01); // ±1%
  const entryPrice = market.price + priceVariation;
  
  let stopLoss, takeProfit;
  if (signalType === 'BUY') {
    stopLoss = entryPrice * 0.98; // 2% stop loss
    takeProfit = entryPrice * 1.04; // 4% take profit
  } else if (signalType === 'SELL') {
    stopLoss = entryPrice * 1.02;
    takeProfit = entryPrice * 0.96;
  }

  const strategy = strategies[Math.floor(Math.random() * strategies.length)];
  const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
  
  const reasons = {
    'EMA Cross': `EMA 20/50 golden cross confirmed on ${timeframe}`,
    'RSI Divergence': `RSI showing bullish divergence at ${confidence}% confidence`,
    'Bollinger Squeeze': `Bollinger Bands squeezing, breakout expected`,
    'Volume Breakout': `Volume spike ${Math.floor(market.volume / 1000000)}M above average`,
    'Support/Resistance': `Strong ${signalType === 'BUY' ? 'support' : 'resistance'} level test`
  };

  return {
    id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: signalType as 'BUY' | 'SELL' | 'WATCH',
    symbol: market.symbol,
    price: entryPrice,
    confidence,
    timestamp: Date.now(),
    reason: reasons[strategy as keyof typeof reasons],
    indicators: strategy.includes('EMA') ? ['EMA20', 'EMA50'] : 
                strategy.includes('RSI') ? ['RSI', 'MACD'] :
                strategy.includes('Bollinger') ? ['BBands', 'Volume'] :
                strategy.includes('Volume') ? ['Volume', 'VWAP'] :
                ['Support', 'Resistance'],
    stopLoss,
    takeProfit,
    entry: entryPrice,
    timeframe,
    strategy,
    isNew: true
  };
};

export const SignalsToaster = ({ market, onSignalClick }: SignalsToasterProps) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);

  // Generate new signals periodically
  useEffect(() => {
    if (isMuted) return;

    const interval = setInterval(() => {
      // Generate signal based on market conditions
      if (Math.random() > 0.7) { // 30% chance every interval
        const newSignal = generateMockSignal(market);
        
        setSignals(prev => {
          // Keep only last 5 signals
          const updated = [newSignal, ...prev.slice(0, 4)];
          return updated;
        });

        // Mark as not new after 3 seconds
        setTimeout(() => {
          setSignals(prev => 
            prev.map(s => s.id === newSignal.id ? { ...s, isNew: false } : s)
          );
        }, 3000);
      }
    }, 8000 + Math.random() * 7000); // 8-15 seconds

    return () => clearInterval(interval);
  }, [market, isMuted]);

  const removeSignal = (signalId: string) => {
    setSignals(prev => prev.filter(s => s.id !== signalId));
  };

  const handleSignalClick = (signal: Signal) => {
    onSignalClick(signal);
    // Could also auto-remove signal or mark as acted upon
  };

  const getSignalIcon = (type: Signal['type']) => {
    switch (type) {
      case 'BUY': return <TrendingUp className="w-4 h-4" />;
      case 'SELL': return <TrendingDown className="w-4 h-4" />;
      case 'WATCH': return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getSignalColor = (type: Signal['type']) => {
    switch (type) {
      case 'BUY': return 'border-bullish bg-bullish/10';
      case 'SELL': return 'border-bearish bg-bearish/10';
      case 'WATCH': return 'border-orange-500 bg-orange-500/10';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-bullish';
    if (confidence >= 70) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  if (!isVisible || signals.length === 0) {
    return (
      <div className="fixed bottom-20 right-4 z-30">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-card/90 backdrop-blur-sm"
        >
          <Zap className="w-4 h-4 mr-2" />
          Live Signals
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-30 max-w-xs">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {signals.length} Live Signals
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
            className="h-6 w-6 p-0"
            title={isMuted ? "Unmute signals" : "Mute signals"}
          >
            {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
            title="Hide signals"
          >
            <EyeOff className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Signals Stack */}
      <div className="space-y-2 max-h-80 overflow-hidden">
        {signals.map((signal, index) => (
          <Card
            key={signal.id}
            className={cn(
              "p-3 cursor-pointer transition-all duration-300 border-2 hover:scale-[1.02] backdrop-blur-sm",
              getSignalColor(signal.type),
              signal.isNew && "animate-pulse shadow-lg",
              hoveredSignal === signal.id && "shadow-xl scale-[1.02]"
            )}
            style={{
              transform: `translateY(${index * 2}px)`,
              zIndex: 30 - index
            }}
            onClick={() => handleSignalClick(signal)}
            onMouseEnter={() => setHoveredSignal(signal.id)}
            onMouseLeave={() => setHoveredSignal(null)}
          >
            <div className="flex items-start justify-between">
              {/* Signal Header */}
              <div className="flex items-start gap-2">
                <div className={cn(
                  "p-1 rounded",
                  signal.type === 'BUY' ? 'text-bullish' :
                  signal.type === 'SELL' ? 'text-bearish' :
                  'text-orange-500'
                )}>
                  {getSignalIcon(signal.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold font-mono text-sm">{signal.symbol}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs h-5",
                        signal.type === 'BUY' ? 'border-bullish text-bullish' :
                        signal.type === 'SELL' ? 'border-bearish text-bearish' :
                        'border-orange-500 text-orange-500'
                      )}
                    >
                      {signal.type}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-1">
                    {signal.reason}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono">${signal.price.toFixed(2)}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className={getConfidenceColor(signal.confidence)}>
                      {signal.confidence}%
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{signal.timeframe}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSignal(signal.id);
                }}
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Signal Details (shown on hover) */}
            {hoveredSignal === signal.id && (
              <div className="mt-2 pt-2 border-t border-border/50 animate-fade-in">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {signal.entry && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entry:</span>
                      <span className="font-mono">${signal.entry.toFixed(2)}</span>
                    </div>
                  )}
                  {signal.stopLoss && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stop:</span>
                      <span className="font-mono text-bearish">${signal.stopLoss.toFixed(2)}</span>
                    </div>
                  )}
                  {signal.takeProfit && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target:</span>
                      <span className="font-mono text-bullish">${signal.takeProfit.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Strategy:</span>
                    <span className="truncate">{signal.strategy}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1">
                    {signal.indicators.map((indicator) => (
                      <Badge key={indicator} variant="secondary" className="text-xs h-4">
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(signal.timestamp).toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Muted State */}
      {isMuted && (
        <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <VolumeX className="w-3 h-3" />
            <span>Signal generation paused</span>
          </div>
        </div>
      )}
    </div>
  );
};
