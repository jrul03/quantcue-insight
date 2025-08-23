import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface Market {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities';
}

interface AISignal {
  id: string;
  type: 'buy' | 'sell' | 'hold' | 'alert';
  strength: number; // 0-100
  timeframe: string;
  reason: string;
  confidence: number;
  timestamp: number;
  priceTarget?: number;
  stopLoss?: number;
  riskReward?: number;
  status: 'active' | 'triggered' | 'expired';
}

interface AISignalPanelProps {
  market: Market;
}

export const AISignalPanel = ({ market }: AISignalPanelProps) => {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  // Generate AI signals
  useEffect(() => {
    const generateSignals = () => {
      const newSignals: AISignal[] = [
        {
          id: '1',
          type: 'buy',
          strength: 85,
          timeframe: '4H',
          reason: 'Bullish divergence detected on RSI with price breaking above key resistance',
          confidence: 87,
          timestamp: Date.now() - 10 * 60 * 1000,
          priceTarget: market.price * 1.05,
          stopLoss: market.price * 0.97,
          riskReward: 1.67,
          status: 'active'
        },
        {
          id: '2',
          type: 'sell',
          strength: 72,
          timeframe: '1H',
          reason: 'Bearish engulfing pattern with high volume at resistance level',
          confidence: 74,
          timestamp: Date.now() - 25 * 60 * 1000,
          priceTarget: market.price * 0.96,
          stopLoss: market.price * 1.02,
          riskReward: 2.1,
          status: 'active'
        },
        {
          id: '3',
          type: 'alert',
          strength: 65,
          timeframe: '1D',
          reason: 'Approaching major support level with oversold conditions',
          confidence: 68,
          timestamp: Date.now() - 45 * 60 * 1000,
          status: 'active'
        },
        {
          id: '4',
          type: 'buy',
          strength: 91,
          timeframe: '15m',
          reason: 'AI pattern recognition: Cup & Handle formation with volume spike',
          confidence: 92,
          timestamp: Date.now() - 5 * 60 * 1000,
          priceTarget: market.price * 1.08,
          stopLoss: market.price * 0.95,
          riskReward: 1.9,
          status: 'triggered'
        }
      ];
      setSignals(newSignals);
    };

    generateSignals();
    const interval = setInterval(generateSignals, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [market]);

  const getSignalIcon = (type: AISignal['type']) => {
    switch (type) {
      case 'buy': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'sell': return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'hold': return <Target className="w-4 h-4 text-yellow-400" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    }
  };

  const getSignalColor = (type: AISignal['type']) => {
    switch (type) {
      case 'buy': return 'border-green-400/30 bg-green-400/10';
      case 'sell': return 'border-red-400/30 bg-red-400/10';
      case 'hold': return 'border-yellow-400/30 bg-yellow-400/10';
      case 'alert': return 'border-orange-400/30 bg-orange-400/10';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const filteredSignals = signals.filter(signal => 
    selectedTimeframe === 'all' || signal.timeframe === selectedTimeframe
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-medium text-slate-300">AI Signals</h3>
        </div>
        <Badge variant="outline" className="border-blue-400/50 text-blue-400 text-xs">
          {filteredSignals.length} active
        </Badge>
      </div>

      {/* Timeframe Filter */}
      <div className="flex gap-1 p-1 bg-slate-800/30 rounded-lg">
        {['all', '15m', '1H', '4H', '1D'].map((tf) => (
          <Button
            key={tf}
            size="sm"
            variant={selectedTimeframe === tf ? "default" : "ghost"}
            onClick={() => setSelectedTimeframe(tf)}
            className="text-xs h-7 px-2 flex-1"
          >
            {tf === 'all' ? 'All' : tf}
          </Button>
        ))}
      </div>

      {/* AI Confidence Score */}
      <Card className="p-3 bg-slate-900/50 border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">AI Confidence</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Active</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-1000"
              style={{ width: '78%' }}
            ></div>
          </div>
          <span className="text-sm font-bold text-blue-400">78%</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Market conditions favor {market.change >= 0 ? 'bullish' : 'bearish'} signals
        </div>
      </Card>

      {/* Signals List */}
      <ScrollArea className="h-80">
        <div className="space-y-3">
          {filteredSignals.map((signal) => (
            <Card key={signal.id} className={`p-3 border ${getSignalColor(signal.type)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getSignalIcon(signal.type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold capitalize">{signal.type}</span>
                      <Badge variant="outline" className="text-xs border-slate-600">
                        {signal.timeframe}
                      </Badge>
                      {signal.status === 'triggered' && (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatTime(signal.timestamp)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-bold ${getConfidenceColor(signal.confidence)}`}>
                    {signal.confidence}%
                  </div>
                  <div className="text-xs text-slate-400">confidence</div>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                {signal.reason}
              </p>

              {/* Price Targets */}
              {(signal.priceTarget || signal.stopLoss) && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {signal.priceTarget && (
                    <div className="bg-green-400/10 rounded p-2">
                      <div className="text-slate-400">Target</div>
                      <div className="font-mono text-green-400">
                        ${signal.priceTarget.toFixed(2)}
                      </div>
                    </div>
                  )}
                  {signal.stopLoss && (
                    <div className="bg-red-400/10 rounded p-2">
                      <div className="text-slate-400">Stop Loss</div>
                      <div className="font-mono text-red-400">
                        ${signal.stopLoss.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {signal.riskReward && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Risk/Reward Ratio</span>
                  <span className="font-mono text-blue-400">{signal.riskReward.toFixed(2)}</span>
                </div>
              )}

              {/* Signal Strength */}
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Signal Strength</span>
                  <span className="text-slate-300">{signal.strength}/100</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all ${
                      signal.strength >= 80 ? 'bg-green-400' :
                      signal.strength >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${signal.strength}%` }}
                  ></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* AI Analysis Summary */}
      <Card className="p-3 bg-slate-900/50 border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-slate-300">AI Analysis</span>
        </div>
        <div className="text-xs text-slate-400 space-y-1">
          <div>• Pattern recognition: 3 active formations detected</div>
          <div>• Sentiment analysis: {Math.round(Math.random() * 100)}% bullish social sentiment</div>
          <div>• Volume analysis: Above average by {Math.round(20 + Math.random() * 50)}%</div>
          <div>• Anomaly detection: No unusual activity detected</div>
        </div>
      </Card>
    </div>
  );
};