import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  Zap,
  Activity,
  Eye,
  Settings,
  Play,
  Pause
} from "lucide-react";

export interface Strategy {
  id: string;
  name: string;
  shortName: string;
  description: string;
  enabled: boolean;
  signals: number;
  winRate: number;
  category: 'trend' | 'momentum' | 'mean-reversion' | 'breakout';
  icon: any;
}

interface StrategyToggleBarProps {
  strategies: Strategy[];
  onToggle: (strategyId: string) => void;
  onSettingsClick?: (strategyId: string) => void;
}

export const StrategyToggleBar = ({ 
  strategies, 
  onToggle, 
  onSettingsClick 
}: StrategyToggleBarProps) => {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  const getStrategyIcon = (category: Strategy['category']) => {
    switch (category) {
      case 'trend': return TrendingUp;
      case 'momentum': return Zap;
      case 'mean-reversion': return Target;
      case 'breakout': return BarChart3;
      default: return Activity;
    }
  };

  const getCategoryColor = (category: Strategy['category']) => {
    switch (category) {
      case 'trend': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'momentum': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'mean-reversion': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'breakout': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      default: return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
    }
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-green-400';
    if (winRate >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="px-6 py-3 border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Algorithmic Strategies
          </h3>
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
            {strategies.filter(s => s.enabled).length} Active
          </Badge>
        </div>
        <div className="text-xs text-slate-400">
          Click to activate • Right-click for settings
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {strategies.map((strategy) => {
          const Icon = getStrategyIcon(strategy.category);
          const isExpanded = expandedStrategy === strategy.id;
          
          return (
            <div key={strategy.id} className="relative">
              <Button
                size="sm"
                variant={strategy.enabled ? "default" : "outline"}
                className={`
                  flex items-center gap-2 whitespace-nowrap transition-all duration-200 min-w-fit
                  ${strategy.enabled 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg neon-glow' 
                    : 'border-slate-600 hover:border-primary/50 hover:bg-slate-800'
                  }
                `}
                onClick={() => {
                  onToggle(strategy.id);
                  if (isExpanded) setExpandedStrategy(null);
                  else setExpandedStrategy(strategy.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onSettingsClick?.(strategy.id);
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{strategy.shortName}</span>
                
                {strategy.enabled && (
                  <>
                    <div className="w-px h-4 bg-primary-foreground/30"></div>
                    <div className="flex items-center gap-1">
                      {strategy.enabled ? (
                        <Play className="w-3 h-3 text-green-400" />
                      ) : (
                        <Pause className="w-3 h-3 text-slate-400" />
                      )}
                      <span className="text-xs">{strategy.signals}</span>
                    </div>
                  </>
                )}
              </Button>

              {/* Expanded Strategy Details */}
              {isExpanded && (
                <Card className="absolute top-full left-0 mt-2 w-80 p-4 bg-slate-950/95 border-slate-700/50 backdrop-blur-xl shadow-xl z-50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">{strategy.name}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(strategy.category)}`}
                      >
                        {strategy.category}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {strategy.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-slate-400 mb-1">Active Signals</div>
                        <div className="text-lg font-bold text-white">{strategy.signals}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-400 mb-1">Win Rate</div>
                        <div className={`text-lg font-bold ${getWinRateColor(strategy.winRate)}`}>
                          {strategy.winRate}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                      <Button
                        size="sm"
                        variant={strategy.enabled ? "destructive" : "default"}
                        onClick={() => {
                          onToggle(strategy.id);
                          setExpandedStrategy(null);
                        }}
                        className="flex-1"
                      >
                        {strategy.enabled ? (
                          <>
                            <Pause className="w-3 h-3 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Enable
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onSettingsClick?.(strategy.id);
                          setExpandedStrategy(null);
                        }}
                        className="border-slate-600 hover:border-primary/50"
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Signals Summary */}
      {strategies.some(s => s.enabled) && (
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live Signals Active</span>
          </div>
          <div className="h-3 w-px bg-slate-600"></div>
          <div>
            Total Signals: <span className="text-white font-semibold">
              {strategies.filter(s => s.enabled).reduce((sum, s) => sum + s.signals, 0)}
            </span>
          </div>
          <div className="h-3 w-px bg-slate-600"></div>
          <div>
            Avg Win Rate: <span className="text-green-400 font-semibold">
              {Math.round(
                strategies.filter(s => s.enabled).reduce((sum, s) => sum + s.winRate, 0) / 
                Math.max(strategies.filter(s => s.enabled).length, 1)
              )}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};