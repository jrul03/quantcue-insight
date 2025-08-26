import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowUp, ArrowDown, Target, ExternalLink, Bell } from "lucide-react";
import { toast } from "sonner";

interface Signal {
  id: string;
  type: 'BUY' | 'SELL' | 'ALERT';
  symbol: string;
  price: number;
  reason: string;
  confidence: number;
  timestamp: number;
  tags: string[];
  timeframe: string;
  riskReward?: number;
}

interface LiveSignalsToasterProps {
  onSignalClick?: (signal: Signal) => void;
  onJumpToChart?: (symbol: string) => void;
  className?: string;
}

export const LiveSignalsToaster = ({
  onSignalClick,
  onJumpToChart,
  className = ""
}: LiveSignalsToasterProps) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mock signal generation (in real implementation, this would come from WebSocket or API)
  useEffect(() => {
    if (!isEnabled) return;

    const generateSignal = () => {
      const symbols = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'NVDA', 'AMD'];
      const reasons = [
        'EMA50 cross above EMA200',
        'RSI oversold bounce',
        'Breakout above resistance',
        'Volume spike detected',
        'Hammer candle at support',
        'MACD bullish divergence',
        'Gap fill opportunity',
        'Institutional buying flow'
      ];
      const tags = [
        ['momentum', 'breakout'],
        ['oversold', 'bounce'],
        ['technical', 'resistance'],
        ['volume', 'unusual'],
        ['reversal', 'support'],
        ['divergence', 'momentum'],
        ['gap', 'fill'],
        ['institutional', 'flow']
      ];

      const signal: Signal = {
        id: Math.random().toString(36).substr(2, 9),
        type: Math.random() > 0.5 ? 'BUY' : 'SELL',
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        price: 100 + Math.random() * 400,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        confidence: 0.6 + Math.random() * 0.3, // 60-90%
        timestamp: Date.now(),
        tags: tags[Math.floor(Math.random() * tags.length)],
        timeframe: ['1m', '5m', '15m', '1h'][Math.floor(Math.random() * 4)],
        riskReward: 1 + Math.random() * 4 // 1:1 to 5:1
      };

      setSignals(prev => [signal, ...prev.slice(0, 4)]); // Keep only 5 most recent

      // Show toast notification
      toast(
        <div className="flex items-center gap-2">
          {signal.type === 'BUY' ? (
            <ArrowUp className="w-4 h-4 text-success" />
          ) : (
            <ArrowDown className="w-4 h-4 text-destructive" />
          )}
          <div>
            <div className="font-semibold">
              {signal.type} {signal.symbol}
            </div>
            <div className="text-xs text-muted-foreground">
              {signal.reason} • {(signal.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
        </div>,
        {
          duration: 5000,
          action: {
            label: "View",
            onClick: () => onJumpToChart?.(signal.symbol)
          }
        }
      );

      // Play sound (if enabled)
      if (soundEnabled) {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors if audio can't play
      }
    };

    // Generate signals at random intervals between 10-30 seconds
    const scheduleNextSignal = () => {
      const delay = 10000 + Math.random() * 20000; // 10-30 seconds
      setTimeout(() => {
        generateSignal();
        scheduleNextSignal();
      }, delay);
    };

    scheduleNextSignal();
  }, [isEnabled, soundEnabled, onJumpToChart]);

  const removeSignal = (id: string) => {
    setSignals(prev => prev.filter(s => s.id !== id));
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'BUY': return 'border-success/50 bg-success/5';
      case 'SELL': return 'border-destructive/50 bg-destructive/5';
      case 'ALERT': return 'border-warning/50 bg-warning/5';
      default: return 'border-border';
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'BUY': return <ArrowUp className="w-4 h-4 text-success" />;
      case 'SELL': return <ArrowDown className="w-4 h-4 text-destructive" />;
      case 'ALERT': return <Target className="w-4 h-4 text-warning" />;
      default: return null;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (signals.length === 0) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 space-y-2 ${className}`}>
      {/* Settings */}
      <Card className="p-2 bg-card/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Live Signals</span>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant={isEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEnabled(!isEnabled)}
              className="h-6 px-2 text-xs"
            >
              {isEnabled ? 'ON' : 'OFF'}
            </Button>
            <Button
              variant={soundEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-6 px-2 text-xs"
            >
              🔊
            </Button>
          </div>
        </div>
      </Card>

      {/* Signals */}
      {signals.map((signal) => (
        <Card 
          key={signal.id}
          className={`p-3 cursor-pointer transition-all hover:scale-105 bg-card/90 backdrop-blur-sm ${getSignalColor(signal.type)}`}
          onClick={() => onSignalClick?.(signal)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {getSignalIcon(signal.type)}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {signal.type} {signal.symbol}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    ${signal.price.toFixed(2)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {signal.timeframe}
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground max-w-xs">
                  {signal.reason}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {signal.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(signal.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">
                    {formatTime(signal.timestamp)}
                  </span>
                  {signal.riskReward && (
                    <span className="text-muted-foreground">
                      R:R {signal.riskReward.toFixed(1)}:1
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToChart?.(signal.symbol);
                }}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSignal(signal.id);
                }}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};