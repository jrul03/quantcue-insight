import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  TrendingUp, 
  BarChart3, 
  Zap, 
  Target, 
  Settings,
  Play,
  Pause,
  AlertCircle
} from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: 'momentum' | 'mean-reversion' | 'breakout' | 'scalping';
  active: boolean;
  performance: {
    winRate: number;
    pnl: number;
    signals: number;
  };
  icon: React.ComponentType<{ className?: string }>;
}

interface StrategyToggleBarProps {
  onStrategyToggle: (strategyId: string, active: boolean) => void;
  onSignalGenerated: (signal: { 
    strategyId: string; 
    type: 'BUY' | 'SELL'; 
    symbol: string; 
    price: number; 
    confidence: number; 
    reason: string; 
  }) => void;
  currentSymbol?: string;
  currentPrice?: number;
}

const DEFAULT_STRATEGIES: Strategy[] = [
  {
    id: 'ema_cloud',
    name: 'EMA Cloud Breakout',
    shortName: 'EMA Cloud',
    description: 'Trades breakouts above/below EMA cloud with volume confirmation',
    category: 'momentum',
    active: false,
    performance: { winRate: 68, pnl: 2340, signals: 24 },
    icon: TrendingUp
  },
  {
    id: 'ema_rsi_cross',
    name: 'EMA/RSI Cross',
    shortName: 'EMA/RSI',
    description: 'Combined EMA crossover with RSI divergence signals',
    category: 'momentum',
    active: false,
    performance: { winRate: 72, pnl: 1890, signals: 18 },
    icon: BarChart3
  },
  {
    id: 'bollinger_bounce',
    name: 'Bollinger Bounce',
    shortName: 'BB Bounce',
    description: 'Mean reversion at Bollinger Band extremes',
    category: 'mean-reversion',
    active: false,
    performance: { winRate: 65, pnl: 1560, signals: 31 },
    icon: Target
  },
  {
    id: 'momentum_breakout',
    name: 'Momentum Breakout',
    shortName: 'Momentum',
    description: 'High-volume breakouts with momentum confirmation',
    category: 'breakout',
    active: false,
    performance: { winRate: 70, pnl: 2100, signals: 15 },
    icon: Zap
  }
];

export const StrategyToggleBar = ({ onStrategyToggle, onSignalGenerated, currentSymbol, currentPrice }: StrategyToggleBarProps) => {
  const [strategies, setStrategies] = useState<Strategy[]>(DEFAULT_STRATEGIES);
  const [showDetails, setShowDetails] = useState(false);

  const handleToggleStrategy = (strategyId: string) => {
    setStrategies(prev => prev.map(strategy => 
      strategy.id === strategyId 
        ? { ...strategy, active: !strategy.active }
        : strategy
    ));
    
    const strategy = strategies.find(s => s.id === strategyId);
    if (strategy) {
      onStrategyToggle(strategyId, !strategy.active);
      
      // Mock signal generation when strategy is activated
      if (!strategy.active) {
        setTimeout(() => {
          onSignalGenerated({
            strategyId,
            type: Math.random() > 0.5 ? 'BUY' : 'SELL',
            symbol: currentSymbol || 'AAPL',
            price: typeof currentPrice === 'number' && !Number.isNaN(currentPrice)
              ? currentPrice
              : 150 + Math.random() * 20,
            confidence: 0.7 + Math.random() * 0.3,
            reason: `${strategy.name} signal detected`
          });
        }, 2000 + Math.random() * 3000);
      }
    }
  };

  const activeStrategies = strategies.filter(s => s.active).length;
  const totalSignals = strategies.reduce((sum, s) => sum + (s.active ? s.performance.signals : 0), 0);

  return (
    <div className="px-6 py-3 border-b border-slate-700/50 bg-slate-900/20">
      <div className="flex items-center justify-between">
        {/* Strategy Toggle Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-300">Algo Strategies</span>
            {activeStrategies > 0 && (
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                {activeStrategies} Active
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {strategies.map((strategy) => {
              const Icon = strategy.icon;
              return (
                <Button
                  key={strategy.id}
                  size="sm"
                  variant={strategy.active ? "default" : "ghost"}
                  onClick={() => handleToggleStrategy(strategy.id)}
                  className={`h-8 px-3 text-xs ${
                    strategy.active 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3 h-3 mr-1.5" />
                  {strategy.shortName}
                  {strategy.active && (
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full ml-1.5 animate-pulse"></div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Performance Summary & Controls */}
        <div className="flex items-center gap-4">
          {activeStrategies > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Signals:</span>
                <span className="text-green-400 font-mono">{totalSignals}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Win Rate:</span>
                <span className="text-blue-400 font-mono">
                  {Math.round(strategies.reduce((sum, s) => 
                    sum + (s.active ? s.performance.winRate : 0), 0
                  ) / Math.max(activeStrategies, 1))}%
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="text-slate-400 hover:text-slate-200 h-7 px-2"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Strategy Details Panel */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-800/30">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {strategies.map((strategy) => (
              <Card 
                key={strategy.id} 
                className={`p-3 bg-slate-900/30 border transition-colors ${
                  strategy.active 
                    ? 'border-blue-500/30 bg-blue-500/10' 
                    : 'border-slate-800/30 hover:border-slate-700/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strategy.icon className={`w-4 h-4 ${strategy.active ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span className="text-sm font-medium text-slate-200">{strategy.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStrategy(strategy.id)}
                      className="h-6 w-6 p-0"
                    >
                      {strategy.active ? (
                        <Pause className="w-3 h-3 text-orange-400" />
                      ) : (
                        <Play className="w-3 h-3 text-green-400" />
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {strategy.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500">Win Rate</div>
                      <div className="font-mono text-blue-400">{strategy.performance.winRate}%</div>
                    </div>
                    <div>
                      <div className="text-slate-500">P&L</div>
                      <div className={`font-mono ${strategy.performance.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${strategy.performance.pnl}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Signals</div>
                      <div className="font-mono text-slate-300">{strategy.performance.signals}</div>
                    </div>
                  </div>

                  <Badge 
                    variant="outline" 
                    className={`w-full justify-center text-xs ${
                      strategy.category === 'momentum' ? 'border-blue-500/30 text-blue-400' :
                      strategy.category === 'mean-reversion' ? 'border-purple-500/30 text-purple-400' :
                      strategy.category === 'breakout' ? 'border-green-500/30 text-green-400' :
                      'border-orange-500/30 text-orange-400'
                    }`}
                  >
                    {strategy.category}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
