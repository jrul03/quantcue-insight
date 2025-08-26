import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, TrendingUp, TrendingDown, Target, AlertTriangle,
  Eye, EyeOff, Settings, Zap, Activity, ArrowUp, ArrowDown
} from "lucide-react";

interface MarketSignal {
  type: 'buy' | 'sell' | 'hold';
  strength: number; // 0-100
  reason: string;
  confidence: number; // 0-1
  risk: number; // Risk in R units
  timeframe: string;
  indicators: string[];
}

interface PatternDetection {
  name: string;
  confidence: number;
  stage: string; // e.g., "forming", "confirmed", "breaking"
  targetPrice?: number;
  invalidationPrice?: number;
}

interface AIHudOverlayProps {
  symbol: string;
  currentPrice: number;
  indicators: Record<string, number>;
  patterns: PatternDetection[];
  className?: string;
}

export const AIHudOverlay = ({
  symbol,
  currentPrice,
  indicators,
  patterns,
  className = ""
}: AIHudOverlayProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<MarketSignal | null>(null);
  const [signalHistory, setSignalHistory] = useState<MarketSignal[]>([]);

  // Analyze indicators and generate signals
  useEffect(() => {
    const analyzeMarket = () => {
      const { EMA20, EMA50, EMA200, RSI, MACD, Volume } = indicators;
      
      let signal: MarketSignal;
      
      // Simple signal generation logic (in real implementation, this would be much more sophisticated)
      if (EMA20 > EMA50 && EMA50 > EMA200 && RSI < 70 && MACD > 0) {
        signal = {
          type: 'buy',
          strength: 75,
          reason: 'EMA alignment + RSI favorable + MACD positive',
          confidence: 0.82,
          risk: 0.7,
          timeframe: '15m-1h',
          indicators: ['EMA', 'RSI', 'MACD']
        };
      } else if (EMA20 < EMA50 && EMA50 < EMA200 && RSI > 30 && MACD < 0) {
        signal = {
          type: 'sell',
          strength: 68,
          reason: 'Bearish EMA cross + oversold bounce + MACD negative',
          confidence: 0.74,
          risk: 0.8,
          timeframe: '15m-1h',
          indicators: ['EMA', 'RSI', 'MACD']
        };
      } else if (RSI > 70 || RSI < 30) {
        signal = {
          type: RSI > 70 ? 'sell' : 'buy',
          strength: 45,
          reason: RSI > 70 ? 'Overbought conditions' : 'Oversold conditions',
          confidence: 0.58,
          risk: 1.2,
          timeframe: '5m-15m',
          indicators: ['RSI']
        };
      } else {
        signal = {
          type: 'hold',
          strength: 25,
          reason: 'Mixed signals, await clearer direction',
          confidence: 0.35,
          risk: 0.0,
          timeframe: 'any',
          indicators: ['Multiple']
        };
      }

      setCurrentSignal(signal);
      
      // Add to history if different from last signal
      setSignalHistory(prev => {
        const lastSignal = prev[prev.length - 1];
        if (!lastSignal || 
            lastSignal.type !== signal.type || 
            Math.abs(lastSignal.confidence - signal.confidence) > 0.1) {
          return [...prev.slice(-4), { ...signal, timestamp: Date.now() }].slice(-5);
        }
        return prev;
      });
    };

    const interval = setInterval(analyzeMarket, 5000); // Update every 5 seconds
    analyzeMarket(); // Initial analysis

    return () => clearInterval(interval);
  }, [indicators]);

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'buy': return 'text-success';
      case 'sell': return 'text-destructive';
      case 'hold': return 'text-muted-foreground';
      default: return 'text-foreground';
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'buy': return <ArrowUp className="w-4 h-4" />;
      case 'sell': return <ArrowDown className="w-4 h-4" />;
      case 'hold': return <Target className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-success';
    if (confidence > 0.6) return 'text-warning';
    return 'text-muted-foreground';
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed top-4 left-4 z-50 bg-card/90 backdrop-blur-sm"
      >
        <Eye className="w-4 h-4 mr-2" />
        Show AI HUD
      </Button>
    );
  }

  return (
    <Card className={`fixed top-4 left-4 z-50 bg-card/90 backdrop-blur-sm border-primary/20 ${className}`}>
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary animate-neon-pulse" />
            <span className="text-sm font-semibold text-primary">AI Assistant</span>
            <Badge variant="outline" className="text-xs">
              {symbol}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0"
            >
              {isMinimized ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Current Signal */}
            {currentSignal && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 ${getSignalColor(currentSignal.type)}`}>
                    {getSignalIcon(currentSignal.type)}
                    <span className="text-sm font-semibold uppercase">
                      {currentSignal.type}
                    </span>
                  </div>
                  <Badge 
                    variant={currentSignal.type === 'buy' ? 'default' : 
                            currentSignal.type === 'sell' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {currentSignal.strength}% strength
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground">
                  {currentSignal.reason}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className={`ml-1 font-mono ${getConfidenceColor(currentSignal.confidence)}`}>
                      {(currentSignal.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risk:</span>
                    <span className="ml-1 font-mono text-foreground">
                      {currentSignal.risk.toFixed(1)}R
                    </span>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-muted-foreground">Timeframe:</span>
                  <span className="ml-1 font-mono text-primary">
                    {currentSignal.timeframe}
                  </span>
                </div>

                <Progress 
                  value={currentSignal.confidence * 100} 
                  className="h-1"
                />
              </div>
            )}

            {/* Active Patterns */}
            {patterns.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-secondary" />
                  <span className="text-xs font-semibold text-secondary">Patterns</span>
                </div>
                
                <div className="space-y-1">
                  {patterns.slice(0, 2).map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{pattern.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {pattern.stage}
                        </Badge>
                      </div>
                      <span className={`font-mono ${getConfidenceColor(pattern.confidence)}`}>
                        {(pattern.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Indicators */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-accent" />
                <span className="text-xs font-semibold text-accent">Key Metrics</span>
              </div>
              
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RSI:</span>
                  <span className={`font-mono ${
                    indicators.RSI > 70 ? 'text-destructive' : 
                    indicators.RSI < 30 ? 'text-success' : 'text-foreground'
                  }`}>
                    {indicators.RSI?.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VWAP:</span>
                  <span className={`font-mono ${
                    currentPrice > indicators.VWAP ? 'text-success' : 'text-destructive'
                  }`}>
                    ${indicators.VWAP?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EMA20:</span>
                  <span className={`font-mono ${
                    currentPrice > indicators.EMA20 ? 'text-success' : 'text-destructive'
                  }`}>
                    ${indicators.EMA20?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vol:</span>
                  <span className="font-mono text-secondary">
                    {(indicators.Volume / 1000000).toFixed(1)}M
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                Explain
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                Backtest
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                Alert
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};