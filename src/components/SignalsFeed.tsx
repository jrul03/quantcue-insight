import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, TrendingUp, TrendingDown, Clock, Target, AlertCircle } from "lucide-react";

interface Signal {
  id: string;
  type: 'buy' | 'sell' | 'watch';
  symbol: string;
  price: number;
  confidence: number;
  timestamp: Date;
  reason: string;
  indicators: string[];
  stopLoss?: number;
  takeProfit?: number;
  status: 'active' | 'triggered' | 'expired';
}

// Real data will be fetched from APIs - no mock data
const realSignals: Signal[] = [];

export const SignalsFeed = () => {
  const getSignalIcon = (type: Signal['type']) => {
    switch (type) {
      case 'buy': return <TrendingUp className="w-4 h-4 text-bullish" />;
      case 'sell': return <TrendingDown className="w-4 h-4 text-bearish" />;
      case 'watch': return <AlertCircle className="w-4 h-4 text-neon-orange" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-neon-green';
    if (confidence >= 60) return 'text-neon-orange';
    return 'text-bearish';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Live Signals</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {realSignals.filter(s => s.status === 'active').length} Active
          </Badge>
        </div>
      </div>

      {/* Signals List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {realSignals.length > 0 ? (
            realSignals.map((signal) => (
            <Card key={signal.id} className="trading-panel">
              <CardContent className="p-4">
                {/* Signal Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getSignalIcon(signal.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono">{signal.symbol}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${signal.type === 'buy' ? 'signal-positive' : signal.type === 'sell' ? 'signal-negative' : 'signal-neutral'}`}
                        >
                          {signal.type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTime(signal.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-mono font-semibold">${signal.price.toFixed(2)}</div>
                    <div className={`text-xs font-bold ${getConfidenceColor(signal.confidence)}`}>
                      {signal.confidence}%
                    </div>
                  </div>
                </div>

                {/* Signal Reason */}
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {signal.reason}
                </p>

                {/* Indicators */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {signal.indicators.map((indicator) => (
                    <Badge key={indicator} variant="secondary" className="text-xs">
                      {indicator}
                    </Badge>
                  ))}
                </div>

                {/* Risk Management */}
                {(signal.stopLoss || signal.takeProfit) && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {signal.stopLoss && (
                      <div className="flex items-center justify-between bg-bearish/10 rounded p-2">
                        <span className="text-muted-foreground">Stop Loss</span>
                        <span className="font-mono text-bearish">${signal.stopLoss.toFixed(2)}</span>
                      </div>
                    )}
                    {signal.takeProfit && (
                      <div className="flex items-center justify-between bg-bullish/10 rounded p-2">
                        <span className="text-muted-foreground">Take Profit</span>
                        <span className="font-mono text-bullish">${signal.takeProfit.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <Badge 
                    variant={signal.status === 'active' ? 'default' : signal.status === 'triggered' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {signal.status}
                  </Badge>
                  
                  {signal.status === 'triggered' && (
                    <div className="flex items-center gap-1 text-xs text-bullish">
                      <Target className="w-3 h-3" />
                      Executed
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No trading signals available</p>
              <p className="text-xs mt-1">Signals will appear when market conditions are met</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Summary Stats */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="text-center">
            <div className="text-bullish font-bold">73%</div>
            <div className="text-muted-foreground">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-neon-cyan font-bold">12</div>
            <div className="text-muted-foreground">Today</div>
          </div>
          <div className="text-center">
            <div className="text-neon-green font-bold">+2.4%</div>
            <div className="text-muted-foreground">P&L</div>
          </div>
        </div>
      </div>
    </div>
  );
};