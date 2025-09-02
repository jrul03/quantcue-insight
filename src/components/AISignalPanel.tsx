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
  assetClass: 'stocks' | 'forex' | 'crypto' | 'options' | 'commodities' | 'memecoins';
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
    <div className="space-y-0">
      {/* Section Header - AI Signals */}
      <div className="pt-4 pb-3 border-b border-slate-600/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">AI Trading Signals</h3>
          </div>
          <Badge variant="outline" className="border-blue-400/50 text-blue-400 text-xs font-bold">
            {filteredSignals.length}
          </Badge>
        </div>
      </div>

      {/* Timeframe Filter */}
      <div className="pt-4 pb-3">
        <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
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
      </div>

      {/* AI Confidence Score Section */}
      <div className="pt-4 pb-3 border-b border-slate-600/30">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-green-400" />
          AI Confidence Score
        </h4>
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Overall Confidence</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-bold">Active</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: '78%' }}
              ></div>
            </div>
            <span className="text-lg font-bold text-blue-400">78%</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Market bias: <span className="font-bold">{market.change >= 0 ? 'Bullish' : 'Bearish'}</span>
          </div>
        </div>
      </div>

      {/* Active Signals Section */}
      <div className="pt-4 pb-3 border-b border-slate-600/30">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Active Signals ({filteredSignals.length})
        </h4>
        <ScrollArea className="h-48">
          <div className="space-y-3 pr-2">
            {filteredSignals.map((signal) => (
              <Card key={signal.id} className={`p-3 border ${getSignalColor(signal.type)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSignalIcon(signal.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold capitalize">{signal.type}</span>
                        <Badge variant="outline" className="text-xs border-slate-600 font-bold">
                          {signal.timeframe}
                        </Badge>
                        {signal.status === 'triggered' && (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(signal.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getConfidenceColor(signal.confidence)}`}>
                      {signal.confidence}%
                    </div>
                    <div className="text-xs text-slate-400 font-medium">confidence</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  {signal.reason}
                </p>

                {/* Price Targets */}
                {(signal.priceTarget || signal.stopLoss) && (
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    {signal.priceTarget && (
                      <div className="bg-green-400/10 rounded p-2 border border-green-400/20">
                        <div className="text-slate-400 font-medium">Target</div>
                        <div className="font-mono font-bold text-green-400 text-sm">
                          ${signal.priceTarget.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {signal.stopLoss && (
                      <div className="bg-red-400/10 rounded p-2 border border-red-400/20">
                        <div className="text-slate-400 font-medium">Stop Loss</div>
                        <div className="font-mono font-bold text-red-400 text-sm">
                          ${signal.stopLoss.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {signal.riskReward && (
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Risk/Reward</span>
                    <span className="font-mono font-bold text-blue-400 text-sm">{signal.riskReward.toFixed(1)}:1</span>
                  </div>
                )}

                {/* Signal Strength */}
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">Strength</span>
                    <span className="font-bold text-slate-300">{signal.strength}/100</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${
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
      </div>

      {/* AI Analysis Summary */}
      <div className="pt-4">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          Market Intelligence
        </h4>
        <Card className="p-3 bg-slate-900/50 border-slate-700/50">
          <div className="text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Patterns detected:</span>
              <span className="font-bold text-white">3 active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Bullish sentiment:</span>
              <span className="font-bold text-green-400">{Math.round(Math.random() * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Volume vs avg:</span>
              <span className="font-bold text-blue-400">+{Math.round(20 + Math.random() * 50)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Anomalies:</span>
              <span className="font-bold text-slate-300">None detected</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};